import React, { useState, useEffect } from 'react';
import { AppPageRoute, SpecificModelVersion } from '../types/workspace';
import {
  ClaudeBrandIcon,
  GeminiBrandIcon,
  GPTBrandIcon,
  DeepSeekBrandIcon,
} from './BrandIcons';
import {
  FileCode,
  Zap,
  Activity,
  Layers,
  Sparkles,
  ExternalLink,
  Fingerprint,
  Code2,
  Terminal,
} from 'lucide-react';

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

interface BigFourAIProfile {
  version: SpecificModelVersion;
  shortLabel: string;
  provider: 'Claude' | 'Gemini' | 'GPT' | 'DeepSeek';
  brandColor: string;
  accentColor: string;
  glowShadow: string;
  beamGradient: string;
  activeFile: string;
  speed: string;
  latency: string;
  context: string;
  reasoningScore: string;
  benchmarkHighlight: string;
  specialty: string;
  skillApplied: string;
  diffLines: DiffRow[];
  summaryLine: string;
}

const BIG_FOUR_MODELS: BigFourAIProfile[] = [
  {
    version: 'Opus 5.5',
    shortLabel: 'Claude Opus 5.5',
    provider: 'Claude',
    brandColor: '#d97757',
    accentColor: '#f97316',
    glowShadow: 'rgba(217, 119, 87, 0.40)',
    beamGradient:
      'linear-gradient(180deg, rgba(217, 119, 87, 0.45) 0%, rgba(249, 115, 22, 0.18) 50%, transparent 100%)',
    activeFile: 'skills/design-taste-frontend/SKILL.md',
    speed: '88 tok/s',
    latency: '420 ms',
    context: '200K tokens',
    reasoningScore: '98.4%',
    benchmarkHighlight: 'SWE-bench 52.4% · HumanEval 92.8%',
    specialty: 'Arquitectura limpia, contratos TypeScript y estética anti-slop',
    skillApplied: 'design-taste-frontend',
    diffLines: [
      { num: '01', type: 'info', text: '@@ -12,6 +12,8 @@ export interface SkillDesignSpec {' },
      { num: '02', type: 'del', text: '- herogradient: "purple-gradient",' },
      { num: '03', type: 'add', text: '+ surface: "#0a0d14", // 92% dark carbon' },
      { num: '04', type: 'add', text: '+ cardSurface: "#121722", // Swiss minimal' },
      { num: '05', type: 'add', text: '+ accentFunctional: "#0ea5e9", // Cyan' },
      { num: '06', type: 'context', text: '  strictContrastRatio: 14.8' },
    ],
    summaryLine: 'Auditoría estructural y contratos TypeScript estrictos',
  },
  {
    version: 'Gemini 3.8',
    shortLabel: 'Gemini 3.8 Pro',
    provider: 'Gemini',
    brandColor: '#0ea5e9',
    accentColor: '#38bdf8',
    glowShadow: 'rgba(14, 165, 233, 0.42)',
    beamGradient:
      'linear-gradient(180deg, rgba(14, 165, 233, 0.45) 0%, rgba(56, 189, 248, 0.20) 50%, transparent 100%)',
    activeFile: 'src/services/rarParserService.ts',
    speed: '178 tok/s',
    latency: '210 ms',
    context: '2M tokens',
    reasoningScore: '97.2%',
    benchmarkHighlight: 'Long-Context 99.4% · SWE-bench 50.8%',
    specialty: 'Descompresión VFS en navegador y contexto masivo 2M tokens',
    skillApplied: 'vfs-zip-engine',
    diffLines: [
      { num: '01', type: 'info', text: '@@ -44,6 +44,8 @@ async function mountVfsPackage(file) {' },
      { num: '02', type: 'del', text: '- const rawBytes = mockExtractArchive(file);' },
      { num: '03', type: 'add', text: '+ const decompressed = await file.stream().pipeThrough(stream);' },
      { num: '04', type: 'add', text: '+ const sha256 = await crypto.subtle.digest("SHA-256", bytes);' },
      { num: '05', type: 'add', text: '+ this.registerTelemetry("2M-context", sha256);' },
      { num: '06', type: 'context', text: '  return verifyAndBuildVfsTree(decompressed, sha256);' },
    ],
    summaryLine: 'Lectura íntegra de repositorios ZIP y carpetas completas en memoria',
  },
  {
    version: 'GPT Astra',
    shortLabel: 'GPT Astra',
    provider: 'GPT',
    brandColor: '#10b981',
    accentColor: '#34d399',
    glowShadow: 'rgba(16, 185, 129, 0.40)',
    beamGradient:
      'linear-gradient(180deg, rgba(16, 185, 129, 0.45) 0%, rgba(52, 211, 153, 0.18) 50%, transparent 100%)',
    activeFile: 'skills/github-workflow-standards/SKILL.md',
    speed: '142 tok/s',
    latency: '260 ms',
    context: '256K tokens',
    reasoningScore: '96.5%',
    benchmarkHighlight: 'Conventional Commits 99.2% · HumanEval 89.6%',
    specialty: 'Trazabilidad semántica, Pull Requests estructurados y CI/CD',
    skillApplied: 'github-workflow-standards',
    diffLines: [
      { num: '01', type: 'info', text: '@@ -8,5 +8,7 @@ rule ConventionalCommits {' },
      { num: '02', type: 'del', text: '- commitFormat: "free-form"' },
      { num: '03', type: 'add', text: '+ commitFormat: "<type>(<scope>): <subject>"' },
      { num: '04', type: 'add', text: '+ prSections: ["¿Qué?", "¿Por qué?", "¿Cómo?"]' },
      { num: '05', type: 'add', text: '+ gitHubWorkflowIntegrity: "A++ verified";' },
      { num: '06', type: 'context', text: '  strictEnforcement: true' },
    ],
    summaryLine: 'Validación semántica de commits y trazabilidad de Pull Requests',
  },
  {
    version: 'DeepSeek V3',
    shortLabel: 'DeepSeek V3',
    provider: 'DeepSeek',
    brandColor: '#2563eb',
    accentColor: '#60a5fa',
    glowShadow: 'rgba(37, 99, 235, 0.44)',
    beamGradient:
      'linear-gradient(180deg, rgba(37, 99, 235, 0.45) 0%, rgba(96, 165, 250, 0.18) 50%, transparent 100%)',
    activeFile: 'src/services/deepSeekMoEEngine.ts',
    speed: '135 tok/s',
    latency: '230 ms',
    context: '128K tokens',
    reasoningScore: '96.2%',
    benchmarkHighlight: 'SWE-bench 49.2% · MoE Latent Attention 98%',
    specialty: 'Inferencia MoE distribuida, compresión MLA y precisión matemática',
    skillApplied: 'deepseek-moe-reasoning',
    diffLines: [
      { num: '01', type: 'info', text: '@@ -18,6 +18,8 @@ export class DeepSeekMoEInference {' },
      { num: '02', type: 'del', text: '- private quantMode: "fp16-unoptimized";' },
      { num: '03', type: 'add', text: '+ private quantMode: "mla-deepseek-fp8";' },
      { num: '04', type: 'add', text: '+ private dynamicRoutingCache: Map<string, Tensor>;' },
      { num: '05', type: 'add', text: '+ return this.multiHeadLatentAttention(tokens);' },
      { num: '06', type: 'context', text: '  readonly activeExperts: number = 8;' },
    ],
    summaryLine: 'Inferencia MoE con Multi-Head Latent Attention y cuantización FP8',
  },
];

const VFS_TREE_PREVIEW = [
  { name: 'SKILL.md', status: 'M' },
  { name: 'rarParserService.ts', status: 'M' },
  { name: 'UnifiedStudio.tsx', status: 'M' },
  { name: 'securityHardening.ts', status: 'OK' },
  { name: 'skill-bundle.json', status: 'A' },
];

export const ComputerLightBeamShowcase: React.FC<ComputerLightBeamShowcaseProps> = ({
  activeModel,
  onSelectModel,
  onNavigatePage,
}) => {
  const [localModel, setLocalModel] = useState<SpecificModelVersion>(activeModel);
  const [touchIdPulse, setTouchIdPulse] = useState(false);
  const [trackpadRipple, setTrackpadRipple] = useState(false);

  useEffect(() => {
    if (activeModel) {
      setLocalModel(activeModel);
    }
  }, [activeModel]);

  const effectiveModel = localModel || activeModel;

  const activeStation =
    BIG_FOUR_MODELS.find((m) => m.version === effectiveModel) ||
    BIG_FOUR_MODELS.find(
      (m) =>
        (effectiveModel.includes('Opus') || effectiveModel.includes('Sonnet')) &&
        m.provider === 'Claude'
    ) ||
    BIG_FOUR_MODELS.find(
      (m) => effectiveModel.includes('Gemini') && m.provider === 'Gemini'
    ) ||
    BIG_FOUR_MODELS.find(
      (m) => effectiveModel.includes('GPT') && m.provider === 'GPT'
    ) ||
    BIG_FOUR_MODELS[0];

  const [hoveredStation, setHoveredStation] = useState<BigFourAIProfile | null>(
    null
  );

  const displayedStation = hoveredStation || activeStation;

  // Ciclo al siguiente modelo mediante el Touch ID interactivo
  const handleTouchIdClick = () => {
    setTouchIdPulse(true);
    setTimeout(() => setTouchIdPulse(false), 600);

    const currentIndex = BIG_FOUR_MODELS.findIndex(
      (m) => m.version === activeStation.version
    );
    const nextIndex = (currentIndex + 1) % BIG_FOUR_MODELS.length;
    const nextModel = BIG_FOUR_MODELS[nextIndex].version;
    setLocalModel(nextModel);
    onSelectModel(nextModel);
  };

  const handleTrackpadClick = () => {
    setTrackpadRipple(true);
    setTimeout(() => setTrackpadRipple(false), 500);
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto py-2 sm:py-3 select-none">
      {/* ====================================================================
          1. HAZ DE LUZ VOLUMÉTRICO DINÁMICO QUE CAE HACIA LA MACBOOK PRO
         ==================================================================== */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-12 sm:-top-20 h-72 sm:h-96 flex justify-center overflow-hidden transition-all duration-700 z-0"
      >
        {/* Cono central de luz volumétrica */}
        <div
          className="w-[85%] sm:w-[65%] h-full opacity-65 sm:opacity-80 blur-3xl transition-all duration-700"
          style={{
            background: displayedStation.beamGradient,
          }}
        />
        {/* Rayo de luz focalizado */}
        <div
          className="absolute top-8 w-48 sm:w-72 h-full blur-2xl opacity-45 transition-all duration-500"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${displayedStation.brandColor} 0%, transparent 70%)`,
          }}
        />
      </div>

      {/* ====================================================================
          2. DOCK ORBITAL DE LOS 4 GIGANTES DE IA (CLAUDE, GEMINI, GPT, DEEPSEEK)
         ==================================================================== */}
      <div className="relative z-30 mb-2.5 sm:mb-3">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-2">
          {BIG_FOUR_MODELS.map((model) => {
            const isSelected = activeStation.version === model.version;
            const isHovered = hoveredStation?.version === model.version;

            return (
              <button
                key={model.version}
                type="button"
                onClick={() => {
                  setLocalModel(model.version);
                  onSelectModel(model.version);
                }}
                onMouseEnter={() => setHoveredStation(model)}
                onMouseLeave={() => setHoveredStation(null)}
                className={`group relative flex items-center gap-2 sm:gap-2.5 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold backdrop-blur-xl transition-all duration-300 cursor-pointer border ${
                  isSelected
                    ? 'border-white/35 text-white shadow-lg scale-105'
                    : 'border-white/10 text-slate-300 hover:text-white hover:border-white/25 hover:scale-102'
                }`}
                style={{
                  background: isSelected
                    ? `linear-gradient(135deg, rgba(20,26,38,0.95) 0%, rgba(10,13,20,0.98) 100%)`
                    : 'rgba(14, 19, 29, 0.75)',
                  boxShadow: isSelected
                    ? `0 0 24px -2px ${model.glowShadow}, 0 10px 24px -6px rgba(0,0,0,0.8)`
                    : isHovered
                      ? `0 0 16px -3px ${model.glowShadow}`
                      : 'none',
                }}
              >
                {/* Indicador LED con color de marca */}
                <span
                  className="inline-block h-2 w-2 rounded-full transition-transform group-hover:scale-125"
                  style={{
                    backgroundColor: model.brandColor,
                    boxShadow: `0 0 8px ${model.brandColor}`,
                  }}
                />

                {/* Icono de Marca Oficial */}
                <div className="shrink-0 transition-transform group-hover:rotate-6">
                  {model.provider === 'Claude' && (
                    <ClaudeBrandIcon className="h-4 w-4" />
                  )}
                  {model.provider === 'Gemini' && (
                    <GeminiBrandIcon className="h-4 w-4" />
                  )}
                  {model.provider === 'GPT' && (
                    <GPTBrandIcon className="h-4 w-4" />
                  )}
                  {model.provider === 'DeepSeek' && (
                    <DeepSeekBrandIcon className="h-4 w-4" />
                  )}
                </div>

                {/* Nombre y Métrica Clave */}
                <span className="font-semibold tracking-tight">
                  {model.shortLabel}
                </span>

                <span
                  className="hidden sm:inline font-mono text-[10px] px-1.5 py-0.5 rounded border border-white/10"
                  style={{
                    color: model.accentColor,
                    backgroundColor: 'rgba(255,255,255,0.03)',
                  }}
                >
                  {model.speed}
                </span>

                {/* Resplandor inferior activo */}
                {isSelected && (
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-[1px] inset-x-4 h-[2px] rounded-full blur-[1px]"
                    style={{ backgroundColor: model.accentColor }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ====================================================================
          3. FICHA FLOTANTE DE TELEMETRÍA Y BENCHMARK DE IA
         ==================================================================== */}
      <div className="relative z-20 mb-2 sm:mb-3 flex justify-center px-4">
        <div
          className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 w-full max-w-4xl rounded-xl border border-white/10 bg-[#0c111a]/90 backdrop-blur-md px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs font-mono text-slate-300 shadow-xl transition-all duration-300"
          style={{
            borderLeftColor: displayedStation.brandColor,
            borderLeftWidth: '3px',
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="font-bold tracking-tight text-white flex items-center gap-1.5"
            >
              <Sparkles
                className="h-3.5 w-3.5"
                style={{ color: displayedStation.accentColor }}
              />
              <span>{displayedStation.shortLabel}</span>
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400 truncate max-w-xs sm:max-w-md text-[11px]">
              {displayedStation.specialty}
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 text-[11px] ml-auto shrink-0">
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-amber-400" />
              <strong className="text-white">{displayedStation.speed}</strong>
            </span>
            <span className="flex items-center gap-1">
              <Activity className="h-3 w-3 text-cyan-400" />
              <span>{displayedStation.latency}</span>
            </span>
            <span className="hidden md:flex items-center gap-1 text-slate-400">
              <Layers className="h-3 w-3 text-emerald-400" />
              <span>{displayedStation.context}</span>
            </span>
            <span
              className="px-2 py-0.5 rounded font-bold text-[10px]"
              style={{
                backgroundColor: `${displayedStation.brandColor}22`,
                color: displayedStation.accentColor,
              }}
            >
              Razonamiento: {displayedStation.reasoningScore}
            </span>
          </div>
        </div>
      </div>

      {/* ====================================================================
          4. IMAGEN INTERACTIVA DE MACBOOK PRO SPACE BLACK
          Fotografía fotorrealista de MacBook Pro con:
          - Pantalla OLED Liquid Retina interactiva incrustada en el display
          - Hotspot táctil de Touch ID con sensor biométrico funcional
          - Hotspot del Force Touch trackpad con respuesta háptica
         ==================================================================== */}
      <div className="relative z-10 mx-auto w-full max-w-4xl px-2">
        <div
          className="relative w-full aspect-[856/660] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl transition-all duration-500"
          style={{
            boxShadow: `0 25px 80px -15px rgba(0,0,0,0.95), 0 0 50px -10px ${displayedStation.glowShadow}`,
          }}
        >
          {/* FOTOGRAFÍA FOTORREALISTA DE LA MACBOOK PRO */}
          <img
            src={`${import.meta.env.BASE_URL}macbook-pro-tight.jpg`}
            alt="MacBook Pro Space Black fotorrealista"
            className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
            loading="eager"
          />

          {/* ================================================================
              4A. PANTALLA OLED INTERACTIVA (ENCAPSULADA EN EL DISPLAY DE LA MAC)
              Posicionada exactamente dentro del cristal Liquid Retina XDR:
              left: 15.2%, width: 69.6%, top: 6.2%, height: 55.0%
             ================================================================ */}
          <div
            className="absolute left-[15.2%] w-[69.6%] top-[6.2%] h-[55.0%] rounded-t-lg overflow-hidden flex flex-col bg-[#070b14]/95 text-slate-200 z-10 border border-white/10 shadow-[inset_0_0_24px_rgba(0,0,0,0.9)]"
            style={{
              boxShadow: `inset 0 0 20px ${displayedStation.glowShadow}, inset 0 0 40px rgba(0,0,0,0.95)`,
            }}
          >
            {/* Barra Superior macOS del Editor IDE */}
            <div className="flex items-center justify-between gap-1.5 border-b border-white/10 bg-[#090e18] px-2.5 sm:px-3 py-1 text-[10px] sm:text-[11px] shrink-0">
              {/* Botones Semáforo macOS */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-[#ef4444] transition-opacity hover:opacity-80" />
                <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-[#f59e0b] transition-opacity hover:opacity-80" />
                <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-[#10b981] transition-opacity hover:opacity-80" />
              </div>

              {/* Título de Archivo y VFS */}
              <div className="flex items-center gap-1.5 min-w-0 font-mono text-[9px] sm:text-[10.5px] text-slate-300 truncate">
                <FileCode
                  className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0"
                  style={{ color: displayedStation.accentColor }}
                />
                <span className="hidden md:inline font-semibold text-white">
                  codice-workspace.zip
                </span>
                <span className="hidden md:inline text-slate-500">/</span>
                <span className="text-white font-medium truncate">
                  {displayedStation.activeFile.split('/').pop()}
                </span>
              </div>

              {/* Badge de Verificación SHA-256 */}
              <div className="flex items-center gap-1 font-mono text-[8.5px] sm:text-[9.5px] text-emerald-400 shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="hidden sm:inline">SHA-256 verificado</span>
                <span className="sm:hidden">SHA-256</span>
              </div>
            </div>

            {/* Viewport Interior del IDE: Árbol VFS + Diff de Código en Vivo */}
            <div className="flex-1 min-h-0 flex flex-col md:flex-row font-mono text-xs overflow-hidden">
              {/* Columna Izquierda: Árbol de archivos VFS (visible en pantallas medianas+) */}
              <div className="hidden md:block w-36 lg:w-40 shrink-0 border-r border-white/10 bg-[#060a12]/90 p-2 overflow-y-auto">
                <div className="mb-1 flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>VFS Explorer</span>
                  <span className="text-cyan-400 font-mono">5 items</span>
                </div>
                <div className="space-y-0.5">
                  {VFS_TREE_PREVIEW.map((item) => {
                    const isSelected = displayedStation.activeFile.endsWith(item.name);
                    return (
                      <div
                        key={item.name}
                        className={`flex items-center justify-between rounded px-1.5 py-0.5 text-[9px] transition-colors ${
                          isSelected
                            ? 'bg-white/10 text-white font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                        style={{
                          borderLeft: isSelected
                            ? `2px solid ${displayedStation.brandColor}`
                            : '2px solid transparent',
                        }}
                      >
                        <span className="truncate">{item.name}</span>
                        <span
                          className={`text-[7.5px] px-1 rounded font-bold ${
                            item.status === 'A'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : item.status === 'M'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-slate-700/40 text-slate-400'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Columna Central: Diff de Código en Vivo generado por la IA */}
              <div className="flex-1 min-w-0 p-2 sm:p-2.5 flex flex-col justify-between overflow-hidden bg-[#050810]/80">
                <div className="overflow-hidden">
                  <div className="flex items-center justify-between border-b border-white/10 pb-1 mb-1 text-[9px] sm:text-[10px]">
                    <span className="text-slate-400 truncate">
                      skill:{' '}
                      <strong className="text-white font-mono">
                        {displayedStation.skillApplied}
                      </strong>
                    </span>
                    <span className="text-emerald-400 font-bold text-[8.5px] sm:text-[9.5px] shrink-0">
                      (+6 −1) · En vivo
                    </span>
                  </div>

                  {/* Líneas de Diff Sintáctico */}
                  <div className="space-y-0.5 font-mono text-[9px] sm:text-[10px] md:text-[10.5px] leading-tight">
                    {displayedStation.diffLines.map((line, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded truncate ${
                          line.type === 'del'
                            ? 'bg-rose-950/40 text-rose-300 border-l-2 border-rose-500'
                            : line.type === 'add'
                              ? 'bg-emerald-950/40 text-emerald-300 border-l-2 border-emerald-500'
                              : line.type === 'info'
                                ? 'bg-sky-950/30 text-sky-300'
                                : 'text-slate-400'
                        }`}
                      >
                        <span className="w-3 select-none text-[8px] sm:text-[8.5px] text-slate-600 font-mono text-right shrink-0">
                          {line.num}
                        </span>
                        <span className="truncate">{line.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pie de pantalla de la laptop con telemetría de inferencia y CTA */}
                <div className="mt-1 pt-1 border-t border-white/10 flex items-center justify-between text-[8.5px] sm:text-[9.5px] text-slate-400 shrink-0">
                  <span className="truncate max-w-[65%]">
                    {displayedStation.summaryLine}
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigatePage('estudio')}
                    className="flex items-center gap-1 text-sky-400 hover:text-sky-300 font-semibold cursor-pointer shrink-0 ml-1"
                  >
                    <span>Editar en Workspace</span>
                    <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ================================================================
              4B. HOTSPOT INTERACTIVO DE TOUCH ID EN EL TECLADO
              Ubicado en la tecla Touch ID física de la foto (esquina sup-der)
             ================================================================ */}
          <button
            type="button"
            onClick={handleTouchIdClick}
            title="Touch ID: Clic para alternar modelo de IA"
            className="absolute left-[67.6%] top-[65.4%] w-[3.0%] h-[2.5%] rounded-[2px] cursor-pointer z-20 group transition-all bg-transparent border-0 p-0 outline-none focus:outline-none"
          >
            {/* Halo biométrico interactivo solo en clic o hover */}
            <span
              className={`absolute inset-0 rounded-[2px] transition-all duration-300 pointer-events-none ${
                touchIdPulse
                  ? 'ring-2 ring-white/90 scale-125 opacity-100'
                  : 'group-hover:ring-1 group-hover:ring-white/40 opacity-0 group-hover:opacity-100'
              }`}
              style={{
                boxShadow: touchIdPulse
                  ? `0 0 14px ${displayedStation.accentColor}`
                  : undefined,
              }}
            />
          </button>

          {/* ================================================================
              4C. HOTSPOT INTERACTIVO DEL FORCE TOUCH TRACKPAD
              Ubicado en el trackpad físico de cristal de la fotografía
             ================================================================ */}
          <div
            onClick={handleTrackpadClick}
            title="Force Touch Trackpad: Clic para respuesta háptica"
            className="absolute left-[35.5%] top-[78.0%] w-[29.0%] h-[18.0%] rounded-lg cursor-pointer z-20 group overflow-hidden"
          >
            {/* Efecto de onda háptica al hacer clic */}
            {trackpadRipple && (
              <span
                className="absolute inset-0 bg-white/10 rounded-lg animate-ping opacity-60 pointer-events-none"
              />
            )}
            <span className="absolute inset-0 rounded-lg border border-transparent group-hover:border-white/20 group-hover:bg-white/[0.03] transition-colors" />
          </div>
        </div>
      </div>
    </div>
  );
};
