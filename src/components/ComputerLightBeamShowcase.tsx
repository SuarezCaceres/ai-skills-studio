import React, { useState } from 'react';
import {
  Sparkles,
  Terminal,
  Cpu,
  Layers,
  FolderArchive,
  ArrowRight,
  CheckCircle2,
  Activity,
  Play,
  RotateCw,
} from 'lucide-react';
import { AppPageRoute, SpecificModelVersion } from '../types/workspace';
import {
  ClaudeBrandIcon,
  GeminiBrandIcon,
  GPTBrandIcon,
  AngularBrandIcon,
  SpringBootBrandIcon,
  ReactBrandIcon,
  ObsidianBrandIcon,
} from './BrandIcons';

interface ComputerLightBeamShowcaseProps {
  activeModel: SpecificModelVersion;
  onSelectModel: (version: SpecificModelVersion) => void;
  onNavigatePage: (page: AppPageRoute) => void;
}

interface InteractiveSandboxAction {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  targetPage: AppPageRoute;
  commandSnippet: string;
  simulatedOutput: string;
  icon: React.ReactNode;
}

const SANDBOX_ACTIONS: InteractiveSandboxAction[] = [
  {
    id: 'action-rar',
    title: 'Inspección Binaria .RAR en Memoria',
    subtitle: 'Extracción sin backend de paquetes RAR4/RAR5',
    category: 'Módulo .RAR',
    targetPage: 'estudio',
    commandSnippet: '$ codice rar unpack --in-memory --target=bidercorp.rar',
    simulatedOutput: '[OK] Encabezado RAR5 detectado en 14ms · 42 módulos TypeScript extraídos · 0 peticiones de red',
    icon: <FolderArchive className="h-4 w-4 text-[#0EA5E9]" />,
  },
  {
    id: 'action-benchmark',
    title: 'Telemetría de Modelos Fundacionales',
    subtitle: 'Comparación tok/s, latencia y razonamiento',
    category: 'Benchmarking',
    targetPage: 'modelos-ia',
    commandSnippet: '$ codice bench --models=opus-5.5,gemini-3.8 --metric=tok_sec',
    simulatedOutput: 'Claude Opus 5.5: 112 tok/s (99.4% precisión) | Gemini 3.8: 178 tok/s (2M tokens de contexto)',
    icon: <Cpu className="h-4 w-4 text-[#38BDF8]" />,
  },
  {
    id: 'action-skills',
    title: 'Catálogo de Directivas y Skills',
    subtitle: 'Gestor y auditor de prompts de ingeniería',
    category: 'Skills Codex',
    targetPage: 'boveda',
    commandSnippet: '$ codice skill audit --rules=wai-aria,dark-mode --format=obsidian',
    simulatedOutput: '[AUDIT] 12 skills validadas · Vinculación bidireccional lista para obsidian://open',
    icon: <Sparkles className="h-4 w-4 text-[#A855F7]" />,
  },
  {
    id: 'action-ui',
    title: 'Sandbox de Componentes UI/UX',
    subtitle: 'Pruebas de menús accesibles y tokens en vivo',
    category: 'UI/UX Pro Max',
    targetPage: 'preview',
    commandSnippet: '$ codice ui inspect --contrast=AAA --focus-rings=visible',
    simulatedOutput: 'Contraste 4.8:1 verificado en #030712 · WAI-ARIA menubar conforme · 0 layout shifts',
    icon: <Layers className="h-4 w-4 text-[#10B981]" />,
  },
];

const MODEL_PROFILES: Record<
  SpecificModelVersion,
  {
    speed: string;
    latency: string;
    context: string;
    specialty: string;
    brand: 'Claude' | 'Gemini' | 'GPT';
  }
> = {
  'Opus 5.5': {
    speed: '112 tok/s',
    latency: '420 ms',
    context: '500K tokens',
    specialty: 'Razonamiento arquitectónico y auditoría de código',
    brand: 'Claude',
  },
  'Opus 4.8': {
    speed: '96 tok/s',
    latency: '480 ms',
    context: '200K tokens',
    specialty: 'Refactorización y estabilidad de sistemas',
    brand: 'Claude',
  },
  'Sonnet 5.5': {
    speed: '145 tok/s',
    latency: '260 ms',
    context: '200K tokens',
    specialty: 'Generación precisa de interfaces React y Tailwind',
    brand: 'Claude',
  },
  'Gemini 3.8': {
    speed: '178 tok/s',
    latency: '190 ms',
    context: '2,000K tokens',
    specialty: 'Ventana de contexto ultra masiva y velocidad pura',
    brand: 'Gemini',
  },
  'Gemini 3.7': {
    speed: '162 tok/s',
    latency: '210 ms',
    context: '1,000K tokens',
    specialty: 'Inferencia reactiva y procesamiento en tiempo real',
    brand: 'Gemini',
  },
  'GPT Astra': {
    speed: '130 tok/s',
    latency: '290 ms',
    context: '128K tokens',
    specialty: 'Inferencia visual multimodal y síntesis conceptual',
    brand: 'GPT',
  },
  'GPT Luna': {
    speed: '120 tok/s',
    latency: '310 ms',
    context: '128K tokens',
    specialty: 'Modos nocturnos, optimización tokenómica y control',
    brand: 'GPT',
  },
};

export const ComputerLightBeamShowcase: React.FC<
  ComputerLightBeamShowcaseProps
> = ({ activeModel, onSelectModel, onNavigatePage }) => {
  const [selectedActionId, setSelectedActionId] = useState<string>(
    SANDBOX_ACTIONS[0].id
  );
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  const currentAction =
    SANDBOX_ACTIONS.find((a) => a.id === selectedActionId) ||
    SANDBOX_ACTIONS[0];
  const profile = MODEL_PROFILES[activeModel] || MODEL_PROFILES['Opus 5.5'];

  const handleRunSimulation = (actionId: string) => {
    setSelectedActionId(actionId);
    setIsExecuting(true);
    setTimeout(() => {
      setIsExecuting(false);
    }, 450);
  };

  return (
    <div className="relative w-full rounded-2xl border border-slate-800 bg-[#0B1120] p-4 sm:p-6 shadow-2xl backdrop-blur-xl transition-all">
      {/* Barra de Instrumentación de la Estación de Trabajo */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-3 gap-1.5">
            <span className="h-3 w-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <Terminal className="h-4 w-4 text-[#0EA5E9]" />
            <span className="font-mono text-xs font-semibold text-slate-200">
              codice-workstation://telemetry/session-active
            </span>
          </div>
        </div>

        {/* Estado en vivo */}
        <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/30 px-3 py-1 text-xs text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono font-medium">Inferencia Activa</span>
        </div>
      </div>

      {/* Selector de Modelos con Métricas en Vivo */}
      <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800/60">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap mr-1">
          Modelo:
        </span>
        {(Object.keys(MODEL_PROFILES) as SpecificModelVersion[]).map(
          (version) => {
            const isSelected = activeModel === version;
            return (
              <button
                key={version}
                type="button"
                onClick={() => onSelectModel(version)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-mono transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#0EA5E9] text-white font-bold shadow-md shadow-[#0EA5E9]/20'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {version === 'Opus 5.5' || version === 'Opus 4.8' || version === 'Sonnet 5.5' ? (
                  <ClaudeBrandIcon className="h-3.5 w-3.5 shrink-0" />
                ) : version.startsWith('Gemini') ? (
                  <GeminiBrandIcon className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <GPTBrandIcon className="h-3.5 w-3.5 shrink-0" />
                )}
                <span>{version}</span>
              </button>
            );
          }
        )}
      </div>

      {/* Grid Central: Acciones del Sandbox + Consola Interactiva */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Columna Izquierda: Acciones de Simulación */}
        <div className="lg:col-span-5 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Selecciona un Módulo del Códice:
          </span>
          {SANDBOX_ACTIONS.map((action) => {
            const isCurrent = selectedActionId === action.id;
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => handleRunSimulation(action.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                  isCurrent
                    ? 'border-[#0EA5E9]/60 bg-[#0EA5E9]/10 shadow-sm'
                    : 'border-slate-800/80 bg-slate-950/40 hover:bg-slate-900/60 text-slate-300'
                }`}
              >
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                  {action.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-slate-100 truncate">
                      {action.title}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {action.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    {action.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Columna Derecha: Consola de Salida y Telemetría */}
        <div className="lg:col-span-7 flex flex-col justify-between rounded-xl border border-slate-800 bg-[#070b14] p-4 font-mono text-xs">
          <div>
            {/* Telemetría del Modelo Activo */}
            <div className="grid grid-cols-3 gap-2 pb-3 mb-3 border-b border-slate-800/70 text-center">
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Velocidad</div>
                <div className="font-bold text-[#38BDF8] text-sm mt-0.5">{profile.speed}</div>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Latencia</div>
                <div className="font-bold text-emerald-400 text-sm mt-0.5">{profile.latency}</div>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Contexto</div>
                <div className="font-bold text-violet-400 text-sm mt-0.5">{profile.context}</div>
              </div>
            </div>

            {/* Comando y Ejecución en Vivo */}
            <div className="space-y-2">
              <div className="text-slate-400 flex items-center justify-between">
                <span>Instrucción / Prompt:</span>
                <span className="text-[10px] text-slate-400">{profile.specialty}</span>
              </div>
              <div className="rounded-lg bg-black/60 p-3 text-[#38BDF8] border border-slate-800">
                {currentAction.commandSnippet}
              </div>

              <div className="mt-3">
                <div className="text-slate-400 text-[11px] mb-1">Respuesta de Inferencia:</div>
                <div
                  className={`rounded-lg bg-slate-950/90 p-3 border border-slate-800/90 text-slate-200 transition-opacity ${
                    isExecuting ? 'opacity-40' : 'opacity-100'
                  }`}
                >
                  {isExecuting ? (
                    <div className="flex items-center gap-2 text-[#0EA5E9]">
                      <RotateCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Sintetizando tokens del modelo {activeModel}...</span>
                    </div>
                  ) : (
                    <span>{currentAction.simulatedOutput}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* CTA de Navegación Directa al Módulo */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Módulo listo en el entorno de producción
            </span>
            <button
              type="button"
              onClick={() => onNavigatePage(currentAction.targetPage)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0EA5E9] hover:bg-[#0284C7] px-3.5 py-1.5 text-xs font-sans font-bold text-white transition-all cursor-pointer shadow-md shadow-[#0EA5E9]/20"
            >
              <span>Abrir {currentAction.title}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
