import { useEffect, useRef, useState } from 'react';
import {
  BadgeCheck,
  Check,
  Copy,
  Download,
  ExternalLink,
  FolderCode,
  Github,
  Globe,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import type { SkillsShBusyKind, SkillsShEntry } from '../../types/skillsSh';

export interface SkillsShCardProps {
  entry: SkillsShEntry;
  rank?: number;
  onOpenInWorkspace: (entry: SkillsShEntry) => Promise<void>;
  onImportToCatalog: (entry: SkillsShEntry) => Promise<void>;
  busyKind?: SkillsShBusyKind | null;
  anyBusy?: boolean;
}

const FOCUS =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]';

function formatInstalls(count: number): string {
  if (!Number.isFinite(count) || count < 0) return '0';
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (count >= 100_000) {
    return `${Math.round(count / 1_000)}k`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return String(Math.round(count));
}

function formatChange(delta: number): string {
  if (delta >= 1_000) {
    return `${(delta / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return String(Math.round(delta));
}

function safeHttpUrl(raw?: string): string | null {
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.toString() : null;
  } catch {
    return null;
  }
}

/**
 * Tarjeta de una skill indexada en skills.sh.
 * Muestra posición de ranking, instalaciones, origen, comando `npx skills add`
 * copiable y acciones de integración con Workspace y Catálogo.
 */
export function SkillsShCard({
  entry,
  rank,
  onOpenInWorkspace,
  onImportToCatalog,
  busyKind = null,
  anyBusy = false,
}: SkillsShCardProps) {
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const handleCopyCommand = async () => {
    if (!entry.installCommand) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(entry.installCommand);
      } else {
        const helper = document.createElement('textarea');
        helper.value = entry.installCommand;
        helper.setAttribute('readonly', '');
        helper.style.position = 'fixed';
        helper.style.opacity = '0';
        document.body.appendChild(helper);
        helper.select();
        document.execCommand('copy');
        document.body.removeChild(helper);
      }
      setCopied(true);
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = window.setTimeout(() => {
        setCopied(false);
        copyTimerRef.current = null;
      }, 2000);
    } catch {
      setCopied(false);
    }
  };

  const skillsShUrl = safeHttpUrl(entry.skillsShUrl);
  const githubUrl = safeHttpUrl(entry.githubUrl);
  const hasPositiveChange = typeof entry.change === 'number' && entry.change > 0;
  const isWorkspaceBusy = busyKind === 'workspace';
  const isImportBusy = busyKind === 'import';

  return (
    <li className="min-w-0">
      <article className="flex h-full min-w-0 flex-col gap-3.5 rounded-xl border border-slate-800 bg-[#121722] p-5 transition-colors hover:border-slate-700">
        {/* Fila superior: ranking, nombre, insignia Oficial y métricas */}
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              {typeof rank === 'number' && (
                <span className="inline-flex shrink-0 items-center rounded-md border border-slate-800 bg-[#0a0d14] px-2 py-0.5 font-mono text-xs font-semibold tabular-nums text-slate-400">
                  #{rank}
                </span>
              )}
              {entry.isOfficial && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#0ea5e9]/35 bg-[#0ea5e9]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#38bdf8]">
                  <BadgeCheck className="h-3.5 w-3.5 text-[#38bdf8]" aria-hidden="true" />
                  Oficial
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className="inline-flex items-baseline gap-1 rounded-full border border-slate-800 bg-[#0a0d14] px-2.5 py-0.5 text-xs"
                title={`${entry.installs.toLocaleString('es-ES')} instalaciones totales`}
              >
                <span className="font-mono font-semibold tabular-nums text-[#f1f5f9]">
                  {formatInstalls(entry.installs)}
                </span>
                <span className="text-[11px] text-slate-400">instalaciones</span>
              </span>
              {hasPositiveChange && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] font-medium tabular-nums text-emerald-400">
                  <TrendingUp className="h-3 w-3" aria-hidden="true" />+{formatChange(entry.change!)} hoy
                </span>
              )}
            </div>
          </div>

          <h2 className="m-0 min-w-0 break-words font-mono text-base font-semibold leading-snug text-[#f1f5f9]">
            {entry.name}
          </h2>

          {/* Subtítulo: origen y tipo de fuente */}
          <div className="flex min-w-0 items-center justify-between gap-2">
            <p className="m-0 min-w-0 flex-1 truncate font-mono text-xs text-slate-400" title={entry.source}>
              {entry.source}
            </p>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-800 bg-[#0a0d14] px-2 py-0.5 text-[11px] font-medium text-slate-300">
              {entry.isGithubSource ? (
                <>
                  <Github className="h-3 w-3 text-slate-400" aria-hidden="true" />
                  GitHub
                </>
              ) : (
                <>
                  <Globe className="h-3 w-3 text-slate-400" aria-hidden="true" />
                  Fuente .well-known
                </>
              )}
            </span>
          </div>
        </div>

        {/* Bloque monoespaciado del comando npx */}
        {entry.installCommand ? (
          <div className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-800 bg-[#0a0d14] px-3 py-2">
            <code
              className="min-w-0 flex-1 truncate font-mono text-xs text-slate-200"
              title={entry.installCommand}
            >
              {entry.installCommand}
            </code>
            <button
              type="button"
              onClick={() => void handleCopyCommand()}
              aria-label={copied ? `Comando copiado para ${entry.name}` : `Copiar comando npx de ${entry.name}`}
              className={`inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md border border-slate-700 bg-[#121722] px-2.5 py-1 text-[11px] font-semibold text-slate-200 transition hover:border-[#0ea5e9] hover:text-[#38bdf8] ${FOCUS}`}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                  <span className="text-emerald-400">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Copiar</span>
                </>
              )}
            </button>
            <span className="sr-only" aria-live="polite">
              {copied ? 'Comando npx copiado al portapapeles' : ''}
            </span>
          </div>
        ) : (
          <p className="m-0 rounded-lg border border-slate-800/80 bg-[#0a0d14] px-3 py-2 font-mono text-xs text-slate-400">
            Comando npx no disponible para esta entrada.
          </p>
        )}

        {/* Fila de acciones y enlaces externos */}
        <div className="mt-auto flex min-w-0 flex-col gap-3 border-t border-slate-800/80 pt-3">
          {entry.isGithubSource ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={anyBusy}
                onClick={() => void onOpenInWorkspace(entry)}
                aria-label={`Abrir ${entry.name} en Workspace`}
                className={`inline-flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[#0ea5e9]/60 bg-[#0ea5e9]/10 px-3 py-2 text-xs font-semibold text-[#38bdf8] transition hover:bg-[#0ea5e9] hover:text-[#0a0d14] disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`}
              >
                {isWorkspaceBusy ? (
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" />
                ) : (
                  <FolderCode className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                )}
                <span className="truncate">Abrir en Workspace</span>
              </button>

              <button
                type="button"
                disabled={anyBusy}
                onClick={() => void onImportToCatalog(entry)}
                aria-label={`Importar ${entry.name} al catálogo comunitario`}
                className={`inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-[#0a0d14] px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-[#0ea5e9] hover:text-[#38bdf8] disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`}
              >
                {isImportBusy ? (
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" />
                ) : (
                  <Download className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                )}
                <span>Importar</span>
              </button>
            </div>
          ) : (
            <p className="m-0 text-xs leading-relaxed text-slate-400">
              Fuente externa (.well-known): instálala con npx o ábrela en skills.sh
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-xs">
            {skillsShUrl && (
              <a
                href={skillsShUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Ver ${entry.name} en skills.sh (abre en una pestaña nueva)`}
                className={`inline-flex items-center gap-1 font-medium text-slate-300 transition hover:text-[#38bdf8] hover:underline ${FOCUS}`}
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                skills.sh
              </a>
            )}
            {githubUrl && (
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Ver repositorio ${entry.source} en GitHub (abre en una pestaña nueva)`}
                className={`inline-flex items-center gap-1 font-medium text-slate-300 transition hover:text-[#38bdf8] hover:underline ${FOCUS}`}
              >
                <Github className="h-3.5 w-3.5" aria-hidden="true" />
                GitHub
              </a>
            )}
          </div>
        </div>
      </article>
    </li>
  );
}

/** Tarjeta skeleton animada mientras carga el directorio de skills.sh. */
export function SkillsShCardSkeleton() {
  return (
    <li aria-hidden="true" className="min-w-0 rounded-xl border border-slate-800 bg-[#121722] p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="h-5 w-14 animate-pulse rounded bg-slate-800" />
        <div className="h-5 w-24 animate-pulse rounded-full bg-slate-800" />
      </div>
      <div className="mt-3 h-5 w-3/4 animate-pulse rounded bg-slate-800" />
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="h-3.5 w-1/2 animate-pulse rounded bg-slate-800/80" />
        <div className="h-4 w-16 animate-pulse rounded-full bg-slate-800/80" />
      </div>
      <div className="mt-4 h-10 w-full animate-pulse rounded-lg bg-[#0a0d14]" />
      <div className="mt-4 flex gap-2 border-t border-slate-800/80 pt-3">
        <div className="h-8 flex-1 animate-pulse rounded-lg bg-slate-800/80" />
        <div className="h-8 w-24 animate-pulse rounded-lg bg-slate-800/80" />
      </div>
    </li>
  );
}

export default SkillsShCard;
