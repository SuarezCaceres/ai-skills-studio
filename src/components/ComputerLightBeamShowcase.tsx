import React from 'react';
import { AppPageRoute, SpecificModelVersion } from '../types/workspace';
import {
  ClaudeBrandIcon,
  GeminiBrandIcon,
  GPTBrandIcon,
} from './BrandIcons';

interface ComputerLightBeamShowcaseProps {
  activeModel: SpecificModelVersion;
  onSelectModel: (version: SpecificModelVersion) => void;
  onNavigatePage: (page: AppPageRoute) => void;
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
  diffRemoved: string;
  diffAdded: string;
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
    diffRemoved: '- herogradient: purple',
    diffAdded: '+ surface: #0a0d14 · accent: #0ea5e9',
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
    diffRemoved: '- mockExtract("Orange.tsx")',
    diffAdded: '+ DecompressionStream("deflate")',
    summaryLine: 'Lectura íntegra de repositorios ZIP y carpetas completas',
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
    diffRemoved: '- vista estática .rar',
    diffAdded: '+ árbol VFS multi-pestaña',
    summaryLine: 'Interfaces React 19 con menús accesibles por teclado',
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
    diffRemoved: '- commit: "update files"',
    diffAdded: '+ feat(vfs): add zip engine',
    summaryLine: 'Validación semántica de commits y trazabilidad de PR',
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
    diffRemoved: '- path sin validar',
    diffAdded: '+ sanitizeArchiveEntryPath()',
    summaryLine: 'Sanitización instantánea de rutas y hashes SHA-256',
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
    diffRemoved: '- formato propietario',
    diffAdded: '+ sourceKind: "zip" | "folder"',
    summaryLine: 'Invariantes de dominio e integridad entre módulos',
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
    diffRemoved: '- sombras de neón',
    diffAdded: '+ 92% carbón neutro #0a0d14',
    summaryLine: 'Calibración de contraste AAA (14.8:1) en modo nocturno',
  },
];

const VFS_TREE_ITEMS = [
  { name: 'taste-frontend.md', path: 'skills/design-taste-frontend/SKILL.md', status: 'M' },
  { name: 'github-workflow.md', path: 'skills/github-workflow-standards/SKILL.md', status: 'A' },
  { name: 'rarParserService.ts', path: 'src/services/rarParserService.ts', status: 'M' },
  { name: 'UnifiedStudio.tsx', path: 'src/components/UnifiedProjectStudio.tsx', status: 'M' },
  { name: 'securityHardening.ts', path: 'src/utils/securityHardening.ts', status: 'OK' },
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
      {/* Barra superior de ventana del IDE */}
      <div className="cs-dock-win__bar">
        <span className="cs-dock-win__dots">
          <i />
          <i />
          <i />
        </span>
        <div className="flex items-center min-w-0 max-w-full overflow-hidden text-xs">
          <span className="font-medium text-slate-200 truncate">
            codice-workspace.zip
          </span>
          <span className="hidden sm:inline text-slate-400 truncate ml-1">
            · {station.activeFile}
          </span>
        </div>
        <span className="ml-auto hidden md:inline-flex items-center gap-2 font-mono text-xs text-slate-400 shrink-0">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
          <span>SHA-256 verificado</span>
        </span>
      </div>

      {/* Dock interactivo de modelos fundacionales */}
      <div className="cs-dock-win__dock hidden sm:flex">
        {MODEL_STATIONS.map((item, idx) => {
          const isSelected = item.version === station.version;
          return (
            <span
              key={item.version}
              role="presentation"
              tabIndex={-1}
              onClick={() => onSelectModel(item.version)}
              className={`items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium whitespace-nowrap transition cursor-pointer border ${
                idx >= 4 ? 'hidden xl:inline-flex' : idx >= 3 ? 'hidden lg:inline-flex' : 'inline-flex'
              } ${
                isSelected
                  ? 'border-[#0ea5e9]/70 bg-[#0ea5e9]/15 text-white'
                  : 'border-transparent bg-transparent text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
              }`}
            >
              <ProviderMiniIcon provider={item.provider} />
              <span className="truncate">{item.shortLabel}</span>
            </span>
          );
        })}
      </div>

      {/* Cuerpo de 3 paneles: Árbol VFS + Diff en vivo + Telemetría del modelo seleccionado */}
      <div className="cs-dock-win__body">
        {/* Panel 1: Árbol VFS */}
        <div className="cs-dock-win__tree">
          <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-400">
            <span>Workspace VFS</span>
            <span className="font-mono text-[11px] text-slate-500">5 archivos</span>
          </div>
          {VFS_TREE_ITEMS.map((entry) => {
            const active = entry.path === station.activeFile;
            return (
              <div
                key={entry.path}
                className={`flex items-center justify-between rounded px-2 py-0.5 text-xs font-mono min-w-0 ${
                  active
                    ? 'bg-[#162032] text-white border border-[#0ea5e9]/35'
                    : 'text-slate-400'
                }`}
              >
                <span className="truncate min-w-0">{entry.name}</span>
                <span
                  className={`ml-2 text-[11px] shrink-0 font-medium ${
                    entry.status === 'A'
                      ? 'text-emerald-400'
                      : entry.status === 'M'
                        ? 'text-[#38bdf8]'
                        : 'text-slate-500'
                  }`}
                >
                  {entry.status}
                </span>
              </div>
            );
          })}
        </div>

        {/* Panel 2: Código / Diff en vivo */}
        <div className="cs-dock-win__code">
          <div className="mb-2 border-b border-slate-800/80 pb-1.5 text-xs text-slate-400 flex items-center justify-between min-w-0">
            <span className="truncate">skill: <strong className="text-slate-200">{station.skillApplied}</strong></span>
            <span className="text-emerald-400 font-mono text-[11px] shrink-0 ml-1">(+14 −4)</span>
          </div>
          <div className="space-y-1 min-w-0">
            <div className="text-slate-500 truncate text-[11px] min-w-0">
              01 &nbsp;--- a/{station.activeFile.split('/').pop()}
            </div>
            <div className="text-slate-500 truncate text-[11px] min-w-0">
              02 &nbsp;+++ b/{station.activeFile.split('/').pop()}
            </div>
            <div className="rounded bg-rose-500/10 px-2 py-0.5 text-rose-300 truncate text-[11px] min-w-0">
              03 &nbsp;{station.diffRemoved}
            </div>
            <div className="rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-300 truncate text-[11px] min-w-0">
              04 &nbsp;{station.diffAdded}
            </div>
          </div>
        </div>

        {/* Panel 3: Telemetría plana del modelo seleccionado (0 bordes anidados) */}
        <div className="cs-dock-win__telemetry">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
            <ProviderMiniIcon provider={station.provider} />
            <div className="min-w-0">
              <div className="truncate text-xs font-semibold text-white">
                {station.provider} · {station.version}
              </div>
              <div className="truncate text-[11px] text-slate-400">
                Auditoría local activa
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <div className="text-[11px] text-slate-400">Velocidad</div>
              <div className="font-mono font-semibold text-white">{station.speed}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Primer token</div>
              <div className="font-mono font-semibold text-white">{station.latency}</div>
            </div>
          </div>

          <div className="text-xs pt-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Contexto</span>
              <span className="font-mono text-[#38bdf8]">{station.context}</span>
            </div>
            <p className="mt-1 text-[11px] leading-snug text-slate-300">
              {station.summaryLine}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
