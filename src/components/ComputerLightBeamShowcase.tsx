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
    glowShadow: 'rgba(217, 119, 87, 0.35)',
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
    glowShadow: 'rgba(14, 165, 233, 0.40)',
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
    glowShadow: 'rgba(16, 185, 129, 0.38)',
    beamGradient:
      'linear-gradient(180deg, rgba(16, 185, 129, 0.42) 0%, rgba(52, 211, 153, 0.18) 50%, transparent 100%)',
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
    glowShadow: 'rgba(37, 99, 235, 0.42)',
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
  { name: 'SKILL.md', lang: 'MD', status: 'M' },
  { name: 'rarParserService.ts', lang: 'TS', status: 'M' },
  { name: 'UnifiedStudio.tsx', lang: 'TSX', status: 'M' },
  { name: 'securityHardening.ts', lang: 'TS', status: 'OK' },
  { name: 'skill-bundle.json', lang: 'JSON', status: 'A' },
];

export const ComputerLightBeamShowcase: React.FC<ComputerLightBeamShowcaseProps> = ({
  activeModel,
  onSelectModel,
  onNavigatePage,
}) => {
  const [localModel, setLocalModel] = useState<SpecificModelVersion>(activeModel);

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

  return (
    <div className="relative w-full max-w-5xl mx-auto py-2 sm:py-3 select-none">
      {/* ====================================================================
          1. HAZ DE LUZ VOLUMÉTRICO DINÁMICO SEGÚN EL MODELO DE IA ACTIVO
         ==================================================================== */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-12 sm:-top-20 h-64 sm:h-80 flex justify-center overflow-hidden transition-all duration-700"
      >
        {/* Cono central de luz volumétrica */}
        <div
          className="w-[85%] sm:w-[65%] h-full opacity-60 sm:opacity-75 blur-3xl transition-all duration-700"
          style={{
            background: displayedStation.beamGradient,
          }}
        />
        {/* Rayo de luz focalizado */}
        <div
          className="absolute top-8 w-44 sm:w-64 h-full blur-2xl opacity-40 transition-all duration-500"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${displayedStation.brandColor} 0%, transparent 70%)`,
          }}
        />
      </div>

      {/* ====================================================================
          2. DOCK ORBITAL DE LOS TOP 4 GIGANTES DE IA (CLAUDE, GEMINI, GPT, DEEPSEEK)
         ==================================================================== */}
      <div className="relative z-30 mb-2 sm:mb-2.5">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3.5 px-2">
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
                className={`group relative flex items-center gap-2.5 rounded-full px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold backdrop-blur-xl transition-all duration-300 cursor-pointer border ${
                  isSelected
                    ? 'border-white/30 text-white shadow-lg scale-105'
                    : 'border-white/10 text-slate-300 hover:text-white hover:border-white/20 hover:scale-102'
                }`}
                style={{
                  background: isSelected
                    ? `linear-gradient(135deg, rgba(18,24,36,0.95) 0%, rgba(10,13,20,0.98) 100%)`
                    : 'rgba(14, 19, 29, 0.75)',
                  boxShadow: isSelected
                    ? `0 0 20px -2px ${model.glowShadow}, 0 10px 24px -6px rgba(0,0,0,0.8)`
                    : isHovered
                      ? `0 0 14px -3px ${model.glowShadow}`
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
          3. FICHA FLOTANTE DE BENCHMARKS (Activada en Hover o fija al activo)
         ==================================================================== */}
      <div className="relative z-20 mb-2 sm:mb-2.5 flex justify-center px-4">
        <div
          className="flex flex-wrap items-center justify-between gap-3 w-full max-w-4xl rounded-xl border border-white/10 bg-[#0c111a]/85 backdrop-blur-md px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs font-mono text-slate-300 shadow-xl transition-all duration-300"
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

          <div className="flex items-center gap-4 text-[11px] ml-auto shrink-0">
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
          4. CHASIS MACBOOK PRO SPACE BLACK (REFERENCIA FOTOGRÁFICA OFICIAL)
          Diseño frontal limpio, nítido y sin distorsión 3D forzada:
          - Tapa con bisel ultra delgado y Notch de cámara FaceTime
          - Pantalla OLED con editor de código y telemetría
          - Bisagra unibody oculta con ventilación
          - Base Magic Keyboard flanqueada por rejillas de altavoces
          - Force Touch trackpad gigante de cristal
         ==================================================================== */}
      <div className="relative z-10 mx-auto w-full max-w-4xl">
        {/* ------------------------------------------------------------------
            4A. TAPA DE LA LAPTOP (LID) & PANTALLA LIQUID RETINA XDR CON NOTCH
           ------------------------------------------------------------------ */}
        <div
          className="relative rounded-t-2xl sm:rounded-t-3xl border border-white/15 bg-[#151922] p-2 sm:p-2.5 pb-0 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.95)] transition-all duration-500"
          style={{
            boxShadow: `0 15px 50px -10px ${displayedStation.glowShadow}, 0 20px 60px -10px rgba(0,0,0,0.95)`,
          }}
        >
          {/* EL ICÓNICO NOTCH DEL MACBOOK PRO (Centrado en el bisel superior) */}
          <div className="absolute top-2 sm:top-2.5 inset-x-0 flex justify-center pointer-events-none z-30">
            <div className="w-24 sm:w-32 h-3 sm:h-3.5 bg-[#05070c] rounded-b-md border-b border-x border-white/10 flex items-center justify-center gap-1.5 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0a0f18] border border-white/20" />
              <span className="h-1 w-1 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse" />
            </div>
          </div>

          {/* Marco Biselado de la Pantalla OLED */}
          <div className="relative rounded-t-xl overflow-hidden border border-white/10 bg-[#070b12]">
            {/* Barra de Ventana del Editor IDE */}
            <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-[#0b101a] px-3 sm:px-4 py-1.5 text-xs">
              {/* Grupo Izquierdo: Botones Semáforo macOS + Título de Archivo */}
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#10b981]" />
                </div>

                <div className="hidden sm:block h-3 w-px bg-white/15 shrink-0" />

                <div className="flex items-center gap-1.5 min-w-0 font-mono text-[9.5px] sm:text-[11px] text-slate-300">
                  <FileCode
                    className="hidden sm:inline-block h-3.5 w-3.5 shrink-0"
                    style={{ color: displayedStation.accentColor }}
                  />
                  <span className="hidden sm:inline font-semibold text-white">
                    codice-workspace.zip
                  </span>
                  <span className="hidden sm:inline text-slate-500">/</span>
                  <span className="font-semibold sm:font-normal text-white sm:text-slate-300 truncate max-w-[75px] sm:max-w-[220px]">
                    {displayedStation.activeFile.split('/').pop()}
                  </span>
                </div>
              </div>

              {/* Centro: Espacio libre para que el Notch de cámara encaje perfectamente sin tapar texto */}
              <div className="w-24 sm:w-32 shrink-0 pointer-events-none" />

              {/* Grupo Derecho: Badge de Seguridad y Hash SHA-256 */}
              <div className="hidden sm:flex items-center gap-1.5 font-mono text-[10px] text-emerald-400 shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>SHA-256 verificado</span>
              </div>
            </div>

            {/* Viewport Interior de la Pantalla: Árbol VFS + Diff de Código en Vivo */}
            <div className="flex flex-col md:flex-row min-h-[170px] sm:min-h-[190px] text-xs font-mono">
              {/* Columna Izquierda: Árbol de archivos VFS */}
              <div className="hidden md:block w-44 lg:w-48 shrink-0 border-r border-white/10 bg-[#080d16]/80 p-2.5">
                <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Explorador VFS</span>
                  <span className="text-[10px] text-cyan-400">5 archivos</span>
                </div>
                <div className="space-y-0.5">
                  {VFS_TREE_PREVIEW.map((item) => {
                    const isSelectedFile =
                      displayedStation.activeFile.endsWith(item.name);
                    return (
                      <div
                        key={item.name}
                        className={`flex items-center justify-between rounded px-1.5 py-0.5 transition-colors ${
                          isSelectedFile
                            ? 'bg-white/10 text-white font-semibold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                        style={{
                          borderLeft: isSelectedFile
                            ? `2px solid ${displayedStation.brandColor}`
                            : '2px solid transparent',
                        }}
                      >
                        <span className="truncate text-[10px]">{item.name}</span>
                        <span
                          className={`text-[8px] px-1 rounded font-bold ${
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

                {/* Tarjeta de Telemetría Lateral */}
                <div className="mt-2.5 rounded-lg border border-white/10 bg-[#0d131f] p-2 text-[9px]">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span>Motor Activo:</span>
                    <strong className="text-white">
                      {displayedStation.provider}
                    </strong>
                  </div>
                  <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mb-1">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: displayedStation.reasoningScore,
                        backgroundColor: displayedStation.accentColor,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Benchmark:</span>
                    <span className="text-emerald-400 font-bold">
                      {displayedStation.reasoningScore}
                    </span>
                  </div>
                </div>
              </div>

              {/* Columna Derecha / Central: Diff de Código en Vivo generado por la IA */}
              <div className="flex-1 min-w-0 bg-[#060a12] p-2.5 sm:p-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-1 mb-1.5 text-[10px]">
                    <span className="text-slate-400 truncate">
                      skill:{' '}
                      <strong className="text-white font-mono">
                        {displayedStation.skillApplied}
                      </strong>
                    </span>
                    <span className="text-emerald-400 font-bold text-[9px]">
                      (+6 −1) · Inferencia en vivo
                    </span>
                  </div>

                  {/* Líneas de código con gutter de línea numérico */}
                  <div className="space-y-0.5 font-mono text-[10.5px] leading-4.5">
                    {displayedStation.diffLines.map((line, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-2 px-1.5 py-0.5 rounded ${
                          line.type === 'del'
                            ? 'bg-rose-950/40 text-rose-300 border-l-2 border-rose-500'
                            : line.type === 'add'
                              ? 'bg-emerald-950/40 text-emerald-300 border-l-2 border-emerald-500'
                              : line.type === 'info'
                                ? 'bg-sky-950/30 text-sky-300'
                                : 'text-slate-400'
                        }`}
                      >
                        <span className="w-3.5 select-none text-[9px] text-slate-600 font-mono text-right shrink-0">
                          {line.num}
                        </span>
                        <span className="truncate">{line.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pie de pantalla de la laptop con telemetría de inferencia */}
                <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between text-[9.5px] text-slate-400">
                  <span className="truncate">{displayedStation.summaryLine}</span>
                  <button
                    type="button"
                    onClick={() => onNavigatePage('estudio')}
                    className="flex items-center gap-1 text-sky-400 hover:text-sky-300 font-semibold cursor-pointer shrink-0 ml-2"
                  >
                    <span>Editar en Workspace</span>
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------
            4B. BISAGRA UNIBODY METÁLICA DEL MACBOOK PRO
           ------------------------------------------------------------------ */}
        <div className="relative mx-auto w-[92%] h-2 sm:h-2.5 bg-gradient-to-r from-[#0e121a] via-[#242c3d] to-[#0e121a] border-t border-b border-white/15 z-20 flex items-center justify-center">
          {/* Muesca central ergonómica de la bisagra */}
          <div className="w-14 sm:w-20 h-0.5 rounded-full bg-[#080b11] border-t border-white/10" />
        </div>

        {/* ------------------------------------------------------------------
            4C. BASE UNIBODY DE ALUMINIO SPACE BLACK
            Con altavoces laterales, Magic Keyboard y Force Touch trackpad
           ------------------------------------------------------------------ */}
        <div
          className="relative rounded-b-2xl sm:rounded-b-3xl border-x border-b border-white/20 bg-gradient-to-b from-[#161a24] via-[#11151e] to-[#0d1017] p-2.5 sm:p-3.5 shadow-2xl"
          style={{
            boxShadow: `0 25px 80px -15px rgba(0,0,0,0.95), 0 0 40px -10px ${displayedStation.glowShadow}`,
          }}
        >
          {/* Fila del Teclado: Altavoz Izquierdo + Magic Keyboard + Altavoz Derecho */}
          <div className="flex items-stretch gap-2 sm:gap-3">
            {/* Rejilla de altavoz izquierda (Perforación láser como en el MacBook Pro) */}
            <div
              aria-hidden="true"
              className="hidden sm:flex flex-col justify-around py-3 w-5 sm:w-8 shrink-0 select-none opacity-30"
            >
              {Array.from({ length: 16 }).map((_, idx) => (
                <div key={idx} className="flex justify-around gap-0.5">
                  <span className="h-0.5 w-0.5 rounded-full bg-slate-400" />
                  <span className="h-0.5 w-0.5 rounded-full bg-slate-400" />
                </div>
              ))}
            </div>

            {/* Bandeja rebajada del Magic Keyboard */}
            <div className="flex-1 rounded-xl border border-white/10 bg-[#090c13] p-1.5 sm:p-2 shadow-inner space-y-1 font-mono text-[8.5px] sm:text-[9.5px] text-slate-300">
              {/* Fila 1: Función + Touch ID Sensor */}
              <div className="flex items-center gap-1 sm:gap-1.5">
                <div className="w-8 sm:w-11 text-center rounded bg-[#131924] border border-white/5 py-0.5 sm:py-1 text-[7.5px] sm:text-[8.5px]">
                  esc
                </div>
                <div className="flex-1 flex items-center gap-1 sm:gap-1.5">
                  {['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'].map((f) => (
                    <div
                      key={f}
                      className="flex-1 text-center rounded bg-[#131924] border border-white/5 py-0.5 sm:py-1 text-[7px] sm:text-[7.5px] text-slate-400"
                    >
                      {f}
                    </div>
                  ))}
                </div>
                {/* Touch ID Sensor (Con iluminación de color del modelo de IA activo) */}
                <div
                  title="Touch ID Sensor"
                  className="w-7 sm:w-9 flex items-center justify-center rounded-md bg-[#0a0d14] border border-white/15 py-0.5 sm:py-1 cursor-pointer transition-all duration-300"
                  style={{
                    boxShadow: `0 0 8px ${displayedStation.glowShadow}`,
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full transition-colors duration-300"
                    style={{
                      backgroundColor: displayedStation.accentColor,
                      boxShadow: `0 0 6px ${displayedStation.accentColor}`,
                    }}
                  />
                </div>
              </div>

              {/* Fila 2: Numérica */}
              <div className="flex items-center gap-1 sm:gap-1.5">
                {['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='].map((k) => (
                  <div
                    key={k}
                    className="flex-1 text-center rounded bg-[#151c28] border border-white/5 py-0.5 sm:py-1"
                  >
                    {k}
                  </div>
                ))}
                <div className="w-9 sm:w-12 text-center rounded bg-[#151c28] border border-white/5 py-0.5 sm:py-1 text-[7.5px]">
                  delete
                </div>
              </div>

              {/* Fila 3: QWERTY */}
              <div className="flex items-center gap-1 sm:gap-1.5">
                <div className="w-9 sm:w-12 text-center rounded bg-[#151c28] border border-white/5 py-0.5 sm:py-1 text-[7.5px]">
                  tab
                </div>
                {['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']'].map((k) => (
                  <div
                    key={k}
                    className="flex-1 text-center rounded bg-[#151c28] border border-white/5 py-0.5 sm:py-1"
                  >
                    {k}
                  </div>
                ))}
                <div className="w-7 sm:w-9 text-center rounded bg-[#151c28] border border-white/5 py-0.5 sm:py-1 text-[7.5px]">
                  \
                </div>
              </div>

              {/* Fila 4: ASDF */}
              <div className="flex items-center gap-1 sm:gap-1.5">
                <div className="w-10 sm:w-14 text-center rounded bg-[#151c28] border border-white/5 py-0.5 sm:py-1 text-[7.5px]">
                  caps
                </div>
                {['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'"].map((k) => (
                  <div
                    key={k}
                    className="flex-1 text-center rounded bg-[#151c28] border border-white/5 py-0.5 sm:py-1"
                  >
                    {k}
                  </div>
                ))}
                <div className="w-10 sm:w-14 text-center rounded bg-[#151c28] border border-white/5 py-0.5 sm:py-1 text-[7.5px]">
                  return
                </div>
              </div>

              {/* Fila 5: Barra Espaciadora y Modificadores */}
              <div className="flex items-center gap-1 sm:gap-1.5">
                <div className="w-7 sm:w-10 text-center rounded bg-[#151c28] border border-white/5 py-0.5 sm:py-1 text-[7.5px]">
                  fn
                </div>
                <div className="w-7 sm:w-10 text-center rounded bg-[#151c28] border border-white/5 py-0.5 sm:py-1 text-[7.5px]">
                  control
                </div>
                <div className="w-8 sm:w-11 text-center rounded bg-[#151c28] border border-white/5 py-0.5 sm:py-1 text-[7.5px]">
                  option
                </div>
                <div className="w-9 sm:w-12 text-center rounded bg-[#151c28] border border-white/5 py-0.5 sm:py-1 text-[7.5px]">
                  command ⌘
                </div>
                <div
                  className="flex-1 rounded bg-[#182030] border border-white/10 py-0.5 sm:py-1 font-sans text-[7.5px] flex items-center justify-center transition-colors shadow-sm"
                  style={{
                    boxShadow: `0 0 10px -2px ${displayedStation.glowShadow}`,
                  }}
                >
                  <span className="text-slate-500 font-mono tracking-widest text-[6.5px] sm:text-[7px] uppercase">
                    Códice Studio
                  </span>
                </div>
                <div className="w-9 sm:w-12 text-center rounded bg-[#151c28] border border-white/5 py-0.5 sm:py-1 text-[7.5px]">
                  command ⌘
                </div>
                <div className="w-8 sm:w-11 text-center rounded bg-[#151c28] border border-white/5 py-0.5 sm:py-1 text-[7.5px]">
                  option
                </div>
                <div className="w-9 sm:w-12 flex items-center justify-center gap-0.5 rounded bg-[#151c28] border border-white/5 py-0.5 sm:py-1 text-[7.5px]">
                  <span>◀</span>
                  <span>▲▼</span>
                  <span>▶</span>
                </div>
              </div>
            </div>

            {/* Rejilla de altavoz derecha (Perforación láser) */}
            <div
              aria-hidden="true"
              className="hidden sm:flex flex-col justify-around py-3 w-5 sm:w-8 shrink-0 select-none opacity-30"
            >
              {Array.from({ length: 16 }).map((_, idx) => (
                <div key={idx} className="flex justify-around gap-0.5">
                  <span className="h-0.5 w-0.5 rounded-full bg-slate-400" />
                  <span className="h-0.5 w-0.5 rounded-full bg-slate-400" />
                </div>
              ))}
            </div>
          </div>

          {/* FORCE TOUCH TRACKPAD DE CRISTAL ESMERILADO */}
          <div className="mt-2.5 sm:mt-3 flex justify-center">
            <div className="w-48 sm:w-68 h-10 sm:h-13 rounded-xl border border-white/10 bg-[#0e131d]/90 shadow-inner flex items-center justify-center transition-colors">
              <span className="h-0.5 w-6 rounded-full bg-slate-700/60" />
            </div>
          </div>

          {/* Ranura frontal de apertura ergonómica (Thumb Scoop Notch) */}
          <div className="absolute -bottom-1 inset-x-0 flex justify-center pointer-events-none">
            <div className="w-16 sm:w-24 h-1.5 rounded-b-md bg-[#0a0d14] border-b border-x border-white/15" />
          </div>
        </div>
      </div>
    </div>
  );
};
