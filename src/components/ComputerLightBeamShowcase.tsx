import React from 'react';
import { AppPageRoute, SpecificModelVersion } from '../types/workspace';
import {
  ClaudeBrandIcon,
  GeminiBrandIcon,
  GPTBrandIcon,
} from './BrandIcons';
import { FileCode, ChevronRight, CheckCircle2 } from 'lucide-react';

interface ComputerLightBeamShowcaseProps {
  activeModel: SpecificModelVersion;
  onSelectModel: (version: SpecificModelVersion) => void;
  onNavigatePage: (page: AppPageRoute) => void;
}

interface DiffRow {
  num: string;
  type: 'info' | 'context' | 'del' | 'add';
  text: string;
}

interface ModelStationSpec {
  version: SpecificModelVersion;
  shortLabel: string;
  provider: 'Claude' | 'Gemini' | 'GPT';
  activeFile: string;
  speed: string;
  latency: string;
  context: string;
  skillApplied: string;
  diffLines: DiffRow[];
  summaryLine: string;
}

const MODEL_STATIONS: ModelStationSpec[] = [
  {
    version: 'Opus 5.5',
    shortLabel: 'Opus 5.5',
    provider: 'Claude',
    activeFile: 'skills/design-taste-frontend/SKILL.md',
    speed: '88 tok/s',
    latency: '420 ms',
    context: '200K tokens',
    skillApplied: 'design-taste-frontend',
    diffLines: [
      { num: '01', type: 'info', text: '@@ -12,6 +12,8 @@ export interface SkillDesignSpec {' },
      { num: '02', type: 'context', text: '  name: "design-taste-frontend",' },
      { num: '03', type: 'del', text: '- herogradient: "purple-gradient",' },
      { num: '04', type: 'del', text: '- shadows: "neon-glow-violet",' },
      { num: '05', type: 'add', text: '+ surface: "#0a0d14", // 92% dark carbon' },
      { num: '06', type: 'add', text: '+ cardSurface: "#121722", // Swiss minimal' },
      { num: '07', type: 'add', text: '+ accentFunctional: "#0ea5e9", // Cyan' },
      { num: '08', type: 'context', text: '  strictContrastRatio: 14.8,' },
      { num: '09', type: 'context', text: '  zeroSlopEnforced: true' },
      { num: '10', type: 'context', text: '}' },
    ],
    summaryLine: 'Auditoría estructural y contratos TypeScript estrictos',
  },
  {
    version: 'Gemini 3.8',
    shortLabel: 'Gemini 3.8',
    provider: 'Gemini',
    activeFile: 'src/services/rarParserService.ts',
    speed: '178 tok/s',
    latency: '210 ms',
    context: '2M tokens',
    skillApplied: 'vfs-zip-engine',
    diffLines: [
      { num: '01', type: 'info', text: '@@ -44,6 +44,8 @@ async function mountVfsPackage(file) {' },
      { num: '02', type: 'context', text: '  const stream = new DecompressionStream("deflate");' },
      { num: '03', type: 'del', text: '- const rawBytes = mockExtractArchive(file);' },
      { num: '04', type: 'add', text: '+ const decompressed = await file.stream().pipeThrough(stream);' },
      { num: '05', type: 'add', text: '+ const sha256 = await crypto.subtle.digest("SHA-256", bytes);' },
      { num: '06', type: 'context', text: '  return verifyAndBuildVfsTree(decompressed, sha256);' },
      { num: '07', type: 'context', text: '}' },
    ],
    summaryLine: 'Lectura íntegra de repositorios ZIP y carpetas completas en memoria',
  },
  {
    version: 'Sonnet 5.5',
    shortLabel: 'Sonnet 5.5',
    provider: 'Claude',
    activeFile: 'src/components/UnifiedProjectStudio.tsx',
    speed: '128 tok/s',
    latency: '290 ms',
    context: '200K tokens',
    skillApplied: 'ui-ux-pro-max',
    diffLines: [
      { num: '01', type: 'info', text: '@@ -28,6 +28,8 @@ export const StudioLayout = () => {' },
      { num: '02', type: 'context', text: '  const { openTabs, activeFile } = useVfs();' },
      { num: '03', type: 'del', text: '- return <LegacyThreeColumnStudio />;' },
      { num: '04', type: 'add', text: '+ return <ModernTwoColumnStudio' },
      { num: '05', type: 'add', text: '+   sidebar={<VfsTreeExplorer /> }' },
      { num: '06', type: 'add', text: '+   editor={<VSCodeStyleEditor /> }' },
      { num: '07', type: 'add', text: '+   bottomDrawer={<TelemetryTerminal /> }' },
      { num: '08', type: 'add', text: '+ />;' },
      { num: '09', type: 'context', text: '};' },
    ],
    summaryLine: 'Interfaces React 19 con editor moderno y gutter numérico alineado',
  },
  {
    version: 'GPT Astra',
    shortLabel: 'GPT Astra',
    provider: 'GPT',
    activeFile: 'skills/github-workflow-standards/SKILL.md',
    speed: '142 tok/s',
    latency: '260 ms',
    context: '256K tokens',
    skillApplied: 'github-workflow-standards',
    diffLines: [
      { num: '01', type: 'info', text: '@@ -8,5 +8,7 @@ rule ConventionalCommits {' },
      { num: '02', type: 'context', text: '  allowedTypes: ["feat", "fix", "chore", "docs"],' },
      { num: '03', type: 'del', text: '- commitFormat: "free-form"' },
      { num: '04', type: 'add', text: '+ commitFormat: "<type>(<scope>): <subject>"' },
      { num: '05', type: 'add', text: '+ prSections: ["¿Qué?", "¿Por qué?", "¿Cómo?"]' },
      { num: '06', type: 'context', text: '  strictEnforcement: true' },
      { num: '07', type: 'context', text: '}' },
    ],
    summaryLine: 'Validación semántica de commits y trazabilidad de Pull Requests',
  },
  {
    version: 'Gemini 3.7',
    shortLabel: 'Gemini 3.7',
    provider: 'Gemini',
    activeFile: 'src/utils/securityHardening.ts',
    speed: '164 tok/s',
    latency: '185 ms',
    context: '1M tokens',
    skillApplied: 'security-hardening',
    diffLines: [
      { num: '01', type: 'info', text: '@@ -15,5 +15,7 @@ export function sanitizeEntry {' },
      { num: '02', type: 'context', text: '  const cleanPath = path.normalize(rawPath);' },
      { num: '03', type: 'del', text: '- if (cleanPath.startsWith("/")) return false;' },
      { num: '04', type: 'add', text: '+ if (cleanPath.includes("..") || path.isAbsolute(cleanPath)) {' },
      { num: '05', type: 'add', text: '+   throw new SecurityError("Zip-Slip traversal detected");' },
      { num: '06', type: 'context', text: '  }' },
      { num: '07', type: 'context', text: '}' },
    ],
    summaryLine: 'Sanitización instantánea de rutas y hashes SHA-256 en cliente',
  },
  {
    version: 'Opus 4.8',
    shortLabel: 'Opus 4.8',
    provider: 'Claude',
    activeFile: 'src/types/workspace.ts',
    speed: '76 tok/s',
    latency: '470 ms',
    context: '200K tokens',
    skillApplied: 'clean-architecture',
    diffLines: [
      { num: '01', type: 'info', text: '@@ -32,5 +32,7 @@ export interface RarPackage {' },
      { num: '02', type: 'context', text: '  id: string; totalSizeBytes: number;' },
      { num: '03', type: 'del', text: '- sourceFormat: "proprietary-rar"' },
      { num: '04', type: 'add', text: '+ sourceFormat: "zip-vfs" | "local-folder"' },
      { num: '05', type: 'add', text: '+ checksum: string; // CRC-32 & SHA-256' },
      { num: '06', type: 'context', text: '  files: RarFileEntry[];' },
      { num: '07', type: 'context', text: '}' },
    ],
    summaryLine: 'Invariantes de dominio e integridad estricta entre módulos',
  },
  {
    version: 'GPT Luna',
    shortLabel: 'GPT Luna',
    provider: 'GPT',
    activeFile: 'src/index.css',
    speed: '136 tok/s',
    latency: '275 ms',
    context: '256K tokens',
    skillApplied: 'design-taste-frontend',
    diffLines: [
      { num: '01', type: 'info', text: '@@ -50,6 +50,8 @@ :root {' },
      { num: '02', type: 'context', text: '  --font-mono: "Geist Mono", monospace;' },
      { num: '03', type: 'del', text: '- --color-accent: #8b5cf6; /* neon violet */' },
      { num: '04', type: 'add', text: '+ --color-accent: #0ea5e9; /* electric cyan */' },
      { num: '05', type: 'add', text: '+ --color-ground: #0a0d14; /* 92% dark carbon */' },
      { num: '06', type: 'context', text: '  --contrast-ratio: 14.8; /* AAA rating */' },
      { num: '07', type: 'context', text: '}' },
    ],
    summaryLine: 'Calibración de contraste AAA (14.8:1) en modo nocturno OLED',
  },
];

const VFS_TREE_ITEMS = [
  { name: 'taste-frontend.md', path: 'skills/design-taste-frontend/SKILL.md', status: 'M', lang: 'MD' },
  { name: 'github-workflow.md', path: 'skills/github-workflow-standards/SKILL.md', status: 'A', lang: 'MD' },
  { name: 'rarParserService.ts', path: 'src/services/rarParserService.ts', status: 'M', lang: 'TS' },
  { name: 'UnifiedStudio.tsx', path: 'src/components/UnifiedProjectStudio.tsx', status: 'M', lang: 'TSX' },
  { name: 'securityHardening.ts', path: 'src/utils/securityHardening.ts', status: 'OK', lang: 'TS' },
];

const ProviderMiniIcon: React.FC<{ provider: 'Claude' | 'Gemini' | 'GPT' }> = ({
  provider,
}) => {
  if (provider === 'Claude') return <ClaudeBrandIcon className="h-4 w-4 shrink-0" />;
  if (provider === 'Gemini') return <GeminiBrandIcon className="h-4 w-4 shrink-0" />;
  return <GPTBrandIcon className="h-4 w-4 shrink-0" />;
};

export const ComputerLightBeamShowcase: React.FC<ComputerLightBeamShowcaseProps> = ({
  activeModel,
  onSelectModel,
  onNavigatePage,
}) => {
  const station =
    MODEL_STATIONS.find((m) => m.version === activeModel) || MODEL_STATIONS[0];

  return (
    <div className="ly-piece cs-dock-win" data-ui="codice-dock" aria-hidden="true">
      {/* 1. Barra superior de ventana del IDE */}
      <div className="cs-dock-win__bar">
        <span className="cs-dock-win__dots">
          <i style={{ backgroundColor: '#ef4444' }} />
          <i style={{ backgroundColor: '#f59e0b' }} />
          <i style={{ backgroundColor: '#10b981' }} />
        </span>
        <div className="flex items-center min-w-0 max-w-full overflow-hidden text-xs">
          <span className="font-semibold text-white truncate">
            codice-workspace.zip
          </span>
          <span className="hidden sm:inline text-slate-400 truncate ml-1.5 font-mono text-[11px]">
            · {station.activeFile}
          </span>
        </div>
        <span className="ml-auto hidden md:inline-flex items-center gap-1.5 font-mono text-[11px] text-emerald-400 shrink-0">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>SHA-256 verificado</span>
        </span>
      </div>

      {/* 2. Dock interactivo de modelos fundacionales */}
      <div className="cs-dock-win__dock hidden sm:flex">
        {MODEL_STATIONS.map((item, idx) => {
          const isSelected = item.version === station.version;
          return (
            <button
              key={item.version}
              type="button"
              onClick={() => onSelectModel(item.version)}
              className={`items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium whitespace-nowrap transition cursor-pointer border ${
                idx >= 5 ? 'hidden 2xl:inline-flex' : idx >= 4 ? 'hidden xl:inline-flex' : idx >= 3 ? 'hidden lg:inline-flex' : 'inline-flex'
              } ${
                isSelected
                  ? 'border-[#0ea5e9]/70 bg-[#0ea5e9]/20 text-white shadow-sm'
                  : 'border-transparent bg-transparent text-slate-400 hover:bg-white/[0.05] hover:text-slate-200'
              }`}
            >
              <ProviderMiniIcon provider={item.provider} />
              <span className="truncate">{item.shortLabel}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Cuerpo de 3 paneles: Árbol VFS + Diff en vivo + Telemetría del modelo seleccionado */}
      <div className="cs-dock-win__body">
        {/* Panel 1: Árbol VFS */}
        <div className="cs-dock-win__tree">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800/60 pb-1.5">
            <span>Árbol VFS</span>
            <span className="font-mono text-[10px] text-[#38bdf8] font-bold">5 archivos</span>
          </div>
          <div className="space-y-1">
            {VFS_TREE_ITEMS.map((entry) => {
              const active = entry.path === station.activeFile;
              return (
                <div
                  key={entry.path}
                  className={`flex items-center justify-between rounded px-2 py-1 text-xs font-mono min-w-0 transition-colors ${
                    active
                      ? 'bg-[#0ea5e9]/15 text-white border-l-2 border-[#0ea5e9]'
                      : 'text-slate-300 hover:bg-[#121722]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0 truncate">
                    <FileCode
                      className={`h-3 w-3 shrink-0 ${
                        entry.lang === 'MD'
                          ? 'text-amber-400'
                          : entry.lang === 'TSX'
                            ? 'text-cyan-400'
                            : 'text-sky-400'
                      }`}
                    />
                    <span className="truncate min-w-0 text-[11px]">{entry.name}</span>
                  </div>
                  <span
                    className={`ml-1.5 text-[10px] shrink-0 font-bold px-1 rounded ${
                      entry.status === 'A'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : entry.status === 'M'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {entry.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel 2: Código / Diff en vivo */}
        <div className="cs-dock-win__code">
          <div className="mb-2 border-b border-slate-800/80 pb-1.5 text-xs text-slate-400 flex items-center justify-between min-w-0">
            <span className="truncate">
              skill: <strong className="text-white font-mono">{station.skillApplied}</strong>
            </span>
            <span className="text-emerald-400 font-mono text-[11px] shrink-0 ml-1 font-semibold">
              (+14 −4)
            </span>
          </div>
          <div className="space-y-0.5 min-w-0 font-mono text-[11px] leading-5">
            {station.diffLines.map((row, idx) => (
              <div
                key={idx}
                className={`flex items-center px-1.5 py-0.5 rounded truncate min-w-0 ${
                  row.type === 'del'
                    ? 'bg-rose-950/40 text-rose-300 border-l-2 border-rose-500'
                    : row.type === 'add'
                      ? 'bg-emerald-950/40 text-emerald-300 border-l-2 border-emerald-500'
                      : row.type === 'info'
                        ? 'text-slate-500 font-semibold'
                        : 'text-slate-400'
                }`}
              >
                <span className="select-none text-slate-600 mr-2 tabular-nums text-[10px] w-4 text-right">
                  {row.num}
                </span>
                <span className="truncate whitespace-pre">{row.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Panel 3: Telemetría plana del modelo seleccionado */}
        <div className="cs-dock-win__telemetry">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
            <ProviderMiniIcon provider={station.provider} />
            <div className="min-w-0">
              <div className="truncate text-xs font-semibold text-white">
                {station.provider} · {station.version}
              </div>
              <div className="truncate text-[11px] text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 inline shrink-0" />
                <span>Auditoría local activa</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded bg-[#0a0d14] p-1.5 border border-slate-800/60">
              <div className="text-[10px] text-slate-400">Velocidad</div>
              <div className="font-mono font-semibold text-white text-xs">{station.speed}</div>
            </div>
            <div className="rounded bg-[#0a0d14] p-1.5 border border-slate-800/60">
              <div className="text-[10px] text-slate-400">Primer token</div>
              <div className="font-mono font-semibold text-white text-xs">{station.latency}</div>
            </div>
          </div>

          <div className="text-xs pt-0.5 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Contexto</span>
              <span className="font-mono text-[#38bdf8] font-semibold">{station.context}</span>
            </div>
            <div className="rounded bg-[#0a0d14] p-2 border border-slate-800/60 text-[11px] leading-relaxed text-slate-300">
              {station.summaryLine}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Pie de estado de la ventana del IDE */}
      <div className="cs-dock-win__footer">
        <span className="truncate">● 5 archivos · VFS en memoria de navegador</span>
        <button
          type="button"
          onClick={() => onNavigatePage('estudio')}
          className="inline-flex items-center gap-1 text-[#0ea5e9] hover:text-[#38bdf8] font-medium transition cursor-pointer"
        >
          <span>Abrir Workspace Studio</span>
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
};
