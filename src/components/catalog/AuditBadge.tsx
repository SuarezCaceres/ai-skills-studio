import React, { useMemo } from 'react';
import { AlertOctagon, AlertTriangle, Info, ShieldCheck } from 'lucide-react';
import type {
  AuditSeverity,
  CatalogSkill,
  SkillAuditFinding,
} from '../../types/catalog';
import type { RarArchivePackage, RarFileEntry } from '../../types/workspace';
import { auditWorkspacePackage, detectCodeLanguage } from '../../services/rarParserService';

/**
 * Auditor de skills externas. Todo el contenido se trata como texto no confiable:
 * solo se lee con expresiones regulares, jamás se ejecuta ni se interpreta.
 */

type AuditableSkill = Pick<CatalogSkill, 'markdown' | 'files' | 'hasScripts'>;

interface ContentRule {
  id: string;
  severity: AuditSeverity;
  label: string;
  detail: string;
  test: RegExp;
}

const SCRIPT_EXT = /\.(sh|bash|zsh|ps1|psm1|bat|cmd|vbs)$/i;
const BINARY_EXT = /\.(exe|dll|msi|bin|jar|so|dylib|scr|com)$/i;
const RUNTIME_EXT = /\.(py|rb|pl|php|js|mjs|cjs)$/i;

const CONTENT_RULES: ContentRule[] = [
  {
    id: 'pipe-to-shell',
    severity: 'danger',
    label: 'Descarga y ejecuta un script remoto',
    detail: 'Encadena curl/wget con un intérprete (curl ... | sh). Ejecuta código sin revisarlo.',
    test: /\b(?:curl|wget)\b[^\n|]*\|\s*(?:sudo\s+)?(?:ba|z|da|k)?sh\b/i,
  },
  {
    id: 'pipe-to-iex',
    severity: 'danger',
    label: 'Descarga y ejecuta con PowerShell',
    detail: 'Encadena una descarga con Invoke-Expression/iex (irm ... | iex).',
    test: /\b(?:iwr|irm|invoke-webrequest|invoke-restmethod|curl|wget)\b[^\n|]*\|\s*(?:iex|invoke-expression)\b/i,
  },
  {
    id: 'invoke-expression',
    severity: 'danger',
    label: 'Usa Invoke-Expression',
    detail: 'Invoke-Expression / iex ejecuta cadenas arbitrarias como código.',
    test: /\binvoke-expression\b|(?:^|[\s;|(])iex\s+[($"'\w]/i,
  },
  {
    id: 'decode-and-run',
    severity: 'danger',
    label: 'Decodifica y ejecuta contenido ofuscado',
    detail: 'Decodifica base64 y lo pasa a un intérprete o a eval.',
    test: /base64\s+(?:-d|--decode)[^\n]*\|\s*(?:ba|z)?sh\b|frombase64string[^\n]*(?:iex|invoke-expression)|\beval\s*\(?\s*(?:atob|base64)/i,
  },
  {
    id: 'rm-rf-root',
    severity: 'danger',
    label: 'Borrado recursivo de rutas críticas',
    detail: 'rm -rf apuntando a /, ~, $HOME o comodines amplios.',
    test: /\brm\s+-[a-z]*r[a-z]*f?[a-z]*\s+(?:--no-preserve-root\s+)?(?:\/(?:\s|$|\*)|~(?:\/|\s|$)|\$HOME\b|\*(?:\s|$)|\.\/?\*)/i,
  },
  {
    id: 'rm-rf',
    severity: 'warn',
    label: 'Borrado recursivo forzado',
    detail: 'Usa rm -rf o Remove-Item -Recurse -Force; revisa la ruta que borra.',
    test: /\brm\s+-[a-z]*r[a-z]*f|\brm\s+-[a-z]*f[a-z]*r|remove-item\b[^\n]*-recurse[^\n]*-force|remove-item\b[^\n]*-force[^\n]*-recurse/i,
  },
  {
    id: 'remote-download',
    severity: 'warn',
    label: 'Descarga de contenido remoto',
    detail: 'Descarga archivos de internet (curl, wget, Invoke-WebRequest, BitsTransfer).',
    test: /\b(?:curl|wget)\s+[^\n]*(?:https?:\/\/|-o\b|-O\b)|\b(?:invoke-webrequest|invoke-restmethod|start-bitstransfer|iwr|irm)\b/i,
  },
  {
    id: 'privilege-escalation',
    severity: 'warn',
    label: 'Eleva privilegios o cambia permisos',
    detail: 'Usa sudo, chmod 777 o chmod +x.',
    test: /\bsudo\s+\S|\bchmod\s+(?:-R\s+)?(?:777|\+x|a\+x)\b/i,
  },
  {
    id: 'credential-access',
    severity: 'warn',
    label: 'Accede a credenciales o claves',
    detail: 'Menciona rutas de claves o credenciales (.ssh, .aws, id_rsa, .env, tokens).',
    test: /~?\/?\.ssh\/|\bid_(?:rsa|ed25519)\b|~?\/?\.aws\/credentials|\.npmrc\b|\/etc\/(?:passwd|shadow)\b/i,
  },
  {
    id: 'prompt-injection',
    severity: 'warn',
    label: 'Posible inyección de instrucciones',
    detail: 'Contiene frases del tipo "ignora las instrucciones anteriores" dirigidas al agente.',
    test: /ignore\s+(?:all\s+)?(?:the\s+)?(?:previous|prior|above)\s+instructions|ignora\s+(?:todas\s+)?las\s+instrucciones\s+anteriores|disregard\s+(?:your|the)\s+(?:system|previous)/i,
  },
];

function snippetOf(text: string, rx: RegExp): string {
  const m = text.match(rx);
  if (!m || m.index === undefined) return '';
  const start = text.lastIndexOf('\n', m.index) + 1;
  let end = text.indexOf('\n', m.index);
  if (end === -1) end = text.length;
  const line = text.slice(start, end).trim();
  return line.length > 90 ? `${line.slice(0, 87)}...` : line;
}

function toWorkspacePackage(skill: AuditableSkill): RarArchivePackage {
  const files: RarFileEntry[] = [
    {
      id: 'skill-md',
      name: 'SKILL.md',
      path: 'SKILL.md',
      folder: '',
      sizeBytes: skill.markdown.length,
      language: 'markdown',
      content: skill.markdown,
    },
    ...skill.files
      .filter((f) => f.path.toLowerCase() !== 'skill.md')
      .map((f, i): RarFileEntry => {
        const name = f.path.split('/').pop() ?? f.path;
        return {
          id: `file-${i}`,
          name,
          path: f.path,
          folder: f.path.includes('/') ? f.path.slice(0, f.path.lastIndexOf('/')) : '',
          sizeBytes: f.sizeBytes,
          language: detectCodeLanguage(name),
          content: f.content ?? '',
        };
      }),
  ];
  return {
    id: 'catalog-audit',
    archiveName: 'catalog-skill',
    uploadedAt: new Date(0).toISOString(),
    totalSizeBytes: files.reduce((a, f) => a + f.sizeBytes, 0),
    signatureDetected: 'catalog',
    sourceKind: 'folder',
    files,
    metadata: {} as RarArchivePackage['metadata'],
  };
}

const SEVERITY_ORDER: Record<AuditSeverity, number> = { danger: 0, warn: 1, info: 2 };

/**
 * Audita una skill del catálogo. Reutiliza `auditWorkspacePackage` (esquema SKILL.md y
 * seguridad de rutas) y suma la detección de scripts y patrones peligrosos.
 */
export function auditCatalogSkill(skill: AuditableSkill): SkillAuditFinding[] {
  const findings: SkillAuditFinding[] = [];
  const seen = new Set<string>();
  const push = (f: SkillAuditFinding) => {
    if (seen.has(f.id)) return;
    seen.add(f.id);
    findings.push(f);
  };

  // 1) Comprobaciones existentes del VFS (solo las que aplican a skills externas).
  const pkg = toWorkspacePackage(skill);
  for (const check of auditWorkspacePackage(pkg).checks) {
    if (check.id === 'skill-frontmatter' && check.status !== 'pass') {
      push({
        id: 'skill-frontmatter',
        severity: 'warn',
        label: 'SKILL.md sin cabecera válida',
        detail: check.detail,
        filePath: 'SKILL.md',
      });
    }
    if (check.id === 'path-safety' && check.status === 'fail') {
      push({
        id: 'path-safety',
        severity: 'danger',
        label: 'Ruta de archivo sospechosa',
        detail: check.detail,
      });
    }
  }

  // 2) Archivos ejecutables o scripts por extensión.
  for (const f of skill.files) {
    if (BINARY_EXT.test(f.path)) {
      push({
        id: `binary:${f.path}`,
        severity: 'danger',
        label: 'Archivo binario ejecutable',
        detail: 'Los binarios no se pueden auditar; no los ejecutes salvo que confíes en el autor.',
        filePath: f.path,
      });
    } else if (SCRIPT_EXT.test(f.path)) {
      push({
        id: `script:${f.path}`,
        severity: 'warn',
        label: 'Incluye un script de shell',
        detail: 'Los scripts .sh/.ps1/.bat pueden ejecutar comandos en tu equipo. Revísalo antes de instalar.',
        filePath: f.path,
      });
    } else if (RUNTIME_EXT.test(f.path)) {
      push({
        id: `script:${f.path}`,
        severity: 'info',
        label: 'Incluye código ejecutable',
        detail: 'Archivo de código (Python, Node, etc.) que el agente podría ejecutar.',
        filePath: f.path,
      });
    }
  }

  // 3) Patrones peligrosos en el contenido (SKILL.md y archivos con contenido cargado).
  const sources: Array<{ path: string; content: string }> = [
    { path: 'SKILL.md', content: skill.markdown },
    ...skill.files
      .filter((f) => f.content && f.path.toLowerCase() !== 'skill.md')
      .map((f) => ({ path: f.path, content: f.content as string })),
  ];
  for (const src of sources) {
    for (const rule of CONTENT_RULES) {
      if (!rule.test.test(src.content)) continue;
      // Un rm -rf crítico ya cubre al rm -rf genérico en el mismo archivo.
      if (rule.id === 'rm-rf' && seen.has(`rm-rf-root:${src.path}`)) continue;
      const snippet = snippetOf(src.content, rule.test);
      push({
        id: `${rule.id}:${src.path}`,
        severity: rule.severity,
        label: rule.label,
        detail: snippet ? `${rule.detail} Línea: ${snippet}` : rule.detail,
        filePath: src.path,
      });
    }
  }

  // 4) Archivos sin contenido cargado: no se pudieron revisar.
  const unread = skill.files.filter(
    (f) => f.content === undefined && (SCRIPT_EXT.test(f.path) || RUNTIME_EXT.test(f.path))
  );
  if (unread.length > 0) {
    push({
      id: 'unread-scripts',
      severity: 'info',
      label: 'Scripts sin revisar',
      detail: `El contenido de ${unread.length} script(s) no se ha cargado, así que solo se auditó su nombre.`,
    });
  }

  if (skill.hasScripts && !findings.some((f) => f.id.startsWith('script:') || f.id.startsWith('binary:'))) {
    push({
      id: 'has-scripts-flag',
      severity: 'info',
      label: 'La skill declara scripts',
      detail: 'El catálogo marca esta skill como portadora de scripts o patrones ejecutables.',
    });
  }

  return findings.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

/** Severidad máxima de una lista de hallazgos, o `null` si no hay ninguno. */
export function highestSeverity(findings: SkillAuditFinding[]): AuditSeverity | null {
  if (findings.some((f) => f.severity === 'danger')) return 'danger';
  if (findings.some((f) => f.severity === 'warn')) return 'warn';
  if (findings.length > 0) return 'info';
  return null;
}

const STYLE: Record<
  AuditSeverity | 'clean',
  { box: string; text: string; title: string; Icon: React.ElementType }
> = {
  danger: {
    box: 'border-rose-500/50 bg-rose-950/30',
    text: 'text-rose-300',
    title: 'Riesgo alto',
    Icon: AlertOctagon,
  },
  warn: {
    box: 'border-amber-500/40 bg-amber-950/20',
    text: 'text-amber-300',
    title: 'Revisa antes de instalar',
    Icon: AlertTriangle,
  },
  info: {
    box: 'border-slate-700 bg-[#121722]',
    text: 'text-slate-300',
    title: 'Notas del auditor',
    Icon: Info,
  },
  clean: {
    box: 'border-emerald-500/30 bg-emerald-950/20',
    text: 'text-emerald-300',
    title: 'Sin hallazgos',
    Icon: ShieldCheck,
  },
};

interface AuditBadgeProps {
  /** Hallazgos ya calculados. Si se omite, se calculan a partir de `skill`. */
  findings?: SkillAuditFinding[];
  skill?: AuditableSkill;
  /** Muestra solo la insignia, sin la lista de hallazgos. */
  compact?: boolean;
  className?: string;
}

export const AuditBadge: React.FC<AuditBadgeProps> = ({ findings, skill, compact, className }) => {
  const list = useMemo(
    () => findings ?? (skill ? auditCatalogSkill(skill) : []),
    [findings, skill]
  );
  const level = highestSeverity(list);
  const style = STYLE[level ?? 'clean'];
  const { Icon } = style;
  const dangerCount = list.filter((f) => f.severity === 'danger').length;
  const warnCount = list.filter((f) => f.severity === 'warn').length;

  return (
    <div
      role={level === 'danger' ? 'alert' : 'status'}
      className={`rounded-lg border p-3 ${style.box} ${className ?? ''}`}
      data-audit-level={level ?? 'clean'}
    >
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 shrink-0 ${style.text}`} aria-hidden="true" />
        <span className={`text-sm font-semibold ${style.text}`}>{style.title}</span>
        <span className="ml-auto font-mono text-xs tabular-nums text-slate-400">
          {dangerCount > 0 && `${dangerCount} alto${dangerCount > 1 ? 's' : ''}`}
          {dangerCount > 0 && warnCount > 0 && ' · '}
          {warnCount > 0 && `${warnCount} medio${warnCount > 1 ? 's' : ''}`}
          {dangerCount === 0 && warnCount === 0 && list.length > 0 && `${list.length} nota${list.length > 1 ? 's' : ''}`}
        </span>
      </div>
      {!compact && list.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {list.map((f) => (
            <li key={f.id} className="text-xs leading-relaxed text-slate-300">
              <span
                className={`mr-1.5 inline-block rounded px-1 font-mono text-[10px] uppercase ${
                  f.severity === 'danger'
                    ? 'bg-rose-500/20 text-rose-300'
                    : f.severity === 'warn'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-slate-700/60 text-slate-300'
                }`}
              >
                {f.severity === 'danger' ? 'alto' : f.severity === 'warn' ? 'medio' : 'info'}
              </span>
              <span className="font-medium text-slate-100">{f.label}</span>
              {f.filePath && <span className="font-mono text-slate-400"> · {f.filePath}</span>}
              <span className="block pl-0.5 text-slate-400">{f.detail}</span>
            </li>
          ))}
        </ul>
      )}
      {!compact && list.length === 0 && (
        <p className="mt-1 text-xs text-slate-400">
          No se detectaron scripts ni patrones peligrosos. Esto no garantiza que la skill sea segura.
        </p>
      )}
    </div>
  );
};

export default AuditBadge;
