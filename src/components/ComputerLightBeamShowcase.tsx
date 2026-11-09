import React, { useState, useCallback } from 'react';
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
  Cpu,
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
      { num: '02', type: 'context', text: '  name: "design-taste-frontend",' },
      { num: '03', type: 'del', text: '- herogradient: "purple-gradient",' },
      { num: '04', type: 'del', text: '- shadows: "neon-glow-violet",' },
      { num: '05', type: 'add', text: '+ surface: "#0a0d14", // 92% dark carbon' },
      { num: '06', type: 'add', text: '+ cardSurface: "#121722", // Swiss minimal' },
      { num: '07', type: 'add', text: '+ accentFunctional: "#0ea5e9", // Cyan' },
      { num: '08', type: 'context', text: '  strictContrastRatio: 14.8,' },
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
      { num: '02', type: 'context', text: '  const stream = new DecompressionStream("deflate");' },
      { num: '03', type: 'del', text: '- const rawBytes = mockExtractArchive(file);' },
      { num: '04', type: 'add', text: '+ const decompressed = await file.stream().pipeThrough(stream);' },
      { num: '05', type: 'add', text: '+ const sha256 = await crypto.subtle.digest("SHA-256", bytes);' },
      { num: '06', type: 'context', text: '  return verifyAndBuildVfsTree(decompressed, sha256);' },
      { num: '07', type: 'add', text: '+ this.registerTelemetry("2M-context", sha256);' },
      { num: '08', type: 'context', text: '}' },
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
      { num: '02', type: 'context', text: '  allowedTypes: ["feat", "fix", "chore", "docs"],' },
      { num: '03', type: 'del', text: '- commitFormat: "free-form"' },
      { num: '04', type: 'add', text: '+ commitFormat: "<type>(<scope>): <subject>"' },
      { num: '05', type: 'add', text: '+ prSections: ["¿Qué?", "¿Por qué?", "¿Cómo?"]' },
      { num: '06', type: 'context', text: '  strictEnforcement: true' },
      { num: '07', type: 'add', text: '+ gitHubWorkflowIntegrity: "A++ verified";' },
      { num: '08', type: 'context', text: '}' },
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
      { num: '02', type: 'context', text: '  readonly activeExperts: number = 8;' },
      { num: '03', type: 'del', text: '- private quantMode: "fp16-unoptimized";' },
      { num: '04', type: 'add', text: '+ private quantMode: "mla-deepseek-fp8";' },
      { num: '05', type: 'add', text: '+ private dynamicRoutingCache: Map<string, Tensor>;' },
      { num: '06', type: 'context', text: '  public async dispatchTokenBatch(tokens: number[]) {' },
      { num: '07', type: 'add', text: '+   return this.multiHeadLatentAttention(tokens);' },
      { num: '08', type: 'context', text: '  }' },
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

  React.useEffect(() => {
    if (activeModel) {
      setLocalModel(activeModel);
    }
  }, [activeModel]);

  const effectiveModel = localModel || activeModel;

  // Sincronizar con el modelo activo o mapear a uno de los 4 gigantes
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
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Manejador del micro-parallax orbital (3D Tilt suave hacia el puntero)
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    // Límites de inclinación elegantes de ±4.5 grados para evitar aberraciones ópticas
    const tiltX = -(y / (rect.height / 2)) * 4.5;
    const tiltY = (x / (rect.width / 2)) * 4.5;
    setTilt({ x: tiltX, y: tiltY });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
    setHoveredStation(null);
  }, []);

  const displayedStation = hoveredStation || activeStation;

  return (
    <div
      className="relative w-full max-w-5xl mx-auto py-4 sm:py-6 select-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* ====================================================================
          1. HAZ DE LUZ VOLUMÉTRICO DINÁMICO SEGÚN EL MODELO DE IA ACTIVO
         ==================================================================== */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-16 sm:-top-24 h-72 sm:h-96 flex justify-center overflow-hidden transition-all duration-700"
      >
        {/* Cono central de luz volumétrica */}
        <div
          className="w-[85%] sm:w-[65%] h-full opacity-60 sm:opacity-75 blur-3xl transition-all duration-700"
          style={{
            background: displayedStation.beamGradient,
            transform: 'perspective(400px) rotateX(35deg)',
          }}
        />
        {/* Rayo de luz focalizado */}
        <div
          className="absolute top-10 w-44 sm:w-64 h-full blur-2xl opacity-40 transition-all duration-500"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${displayedStation.brandColor} 0%, transparent 70%)`,
          }}
        />
      </div>

      {/* ====================================================================
          2. DOCK ORBITAL DE LOS TOP 4 GIGANTES DE IA (CLAUDE, GEMINI, GPT, DEEPSEEK)
          Con micro-parallax, hover 3D y activación instantánea de telemetría
         ==================================================================== */}
      <div className="relative z-30 mb-4 sm:mb-6">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 px-2">
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
      <div className="relative z-20 mb-3 flex justify-center px-4">
        <div
          className="flex flex-wrap items-center justify-between gap-3 w-full max-w-4xl rounded-xl border border-white/10 bg-[#0c111a]/85 backdrop-blur-md px-4 py-2 text-xs font-mono text-slate-300 shadow-xl transition-all duration-300"
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
          4. CHASIS FÍSICO 3D DE LA LAPTOP (ESTILO MACBOOK PRO DARK CARBON)
          Con tapa de aluminio, bisel OLED, pantalla de diff en vivo, bisagra,
          teclado chiclet retroiluminado y trackpad de cristal esmerilado.
         ==================================================================== */}
      <div
        className="relative z-10 mx-auto w-full max-w-4xl transition-transform duration-150 ease-out"
        style={{
          transform: `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* ------------------------------------------------------------------
            4A. TAPA DE LA LAPTOP & PANTALLA OLED
           ------------------------------------------------------------------ */}
        <div
          className="relative rounded-t-2xl sm:rounded-t-3xl border border-white/15 bg-[#121722] p-2 sm:p-2.5 pb-0 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] transition-all duration-500"
          style={{
            boxShadow: `0 20px 60px -10px ${displayedStation.glowShadow}, 0 25px 70px -15px rgba(0,0,0,0.95)`,
          }}
        >
          {/* Muesca y Cámara FaceTime HD centrada en el bisel superior */}
          <div className="absolute top-1 inset-x-0 flex items-center justify-center gap-1.5 pointer-events-none z-30">
            <span className="h-1.5 w-1.5 rounded-full bg-[#05070a] border border-white/20" />
            <span className="h-1 w-1 rounded-full bg-emerald-400/90 shadow-sm shadow-emerald-400 animate-pulse" />
          </div>

          {/* Marco Biselado de la Pantalla OLED */}
          <div className="relative rounded-t-xl overflow-hidden border border-white/10 bg-[#070b12]">
            {/* Barra de Ventana del Editor IDE */}
            <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-[#0b101a] px-3 sm:px-4 py-2 text-xs">
              {/* Botones Semáforo macOS */}
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#10b981]" />
              </div>

              {/* Título de Archivo Activo en la Laptop */}
              <div className="flex items-center gap-2 min-w-0 max-w-md truncate font-mono text-[11px] text-slate-300">
                <FileCode
                  className="h-3.5 w-3.5 shrink-0"
                  style={{ color: displayedStation.accentColor }}
                />
                <span className="font-semibold text-white truncate">
                  codice-workspace.zip
                </span>
                <span className="text-slate-500">/</span>
                <span className="text-slate-300 truncate">
                  {displayedStation.activeFile}
                </span>
              </div>

              {/* Badge de Seguridad y Hash SHA-256 */}
              <div className="hidden sm:flex items-center gap-1.5 font-mono text-[10px] text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>SHA-256 verificado</span>
              </div>
            </div>

            {/* Viewport Interior de la Pantalla: Árbol VFS + Diff de Código en Vivo */}
            <div className="flex flex-col md:flex-row min-h-[220px] sm:min-h-[260px] text-xs font-mono">
              {/* Columna Izquierda: Árbol de archivos VFS */}
              <div className="hidden md:block w-48 lg:w-56 shrink-0 border-r border-white/10 bg-[#080d16]/80 p-3">
                <div className="mb-2 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Explorador VFS</span>
                  <span className="text-[10px] text-cyan-400">5 archivos</span>
                </div>
                <div className="space-y-1">
                  {VFS_TREE_PREVIEW.map((item) => {
                    const isSelectedFile =
                      displayedStation.activeFile.endsWith(item.name);
                    return (
                      <div
                        key={item.name}
                        className={`flex items-center justify-between rounded px-2 py-1 transition-colors ${
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
                        <span className="truncate text-[11px]">{item.name}</span>
                        <span
                          className={`text-[9px] px-1 rounded font-bold ${
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
                <div className="mt-4 rounded-lg border border-white/10 bg-[#0d131f] p-2.5 text-[10px]">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span>Motor Activo:</span>
                    <strong className="text-white">
                      {displayedStation.provider}
                    </strong>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-1.5">
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
              <div className="flex-1 min-w-0 bg-[#060a12] p-3 sm:p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2 text-[11px]">
                    <span className="text-slate-400 truncate">
                      skill:{' '}
                      <strong className="text-white font-mono">
                        {displayedStation.skillApplied}
                      </strong>
                    </span>
                    <span className="text-emerald-400 font-bold text-[10px]">
                      (+8 −2) · Inferencia en vivo
                    </span>
                  </div>

                  {/* Líneas de código con gutter de línea numérico */}
                  <div className="space-y-0.5 font-mono text-[11px] leading-5">
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
                        <span className="w-4 select-none text-[10px] text-slate-600 font-mono text-right shrink-0">
                          {line.num}
                        </span>
                        <span className="truncate">{line.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pie de pantalla de la laptop con telemetría de inferencia */}
                <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
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
            4B. BISAGRA DE PRECISIÓN UNIBODY
           ------------------------------------------------------------------ */}
        <div className="relative mx-auto w-[92%] h-2.5 sm:h-3 bg-gradient-to-r from-[#0d121c] via-[#222c3e] to-[#0d121c] border-t border-b border-white/15 z-20 flex items-center justify-center">
          {/* Muesca central ergonómica de la bisagra */}
          <div className="w-16 sm:w-24 h-1 rounded-full bg-[#0a0d14] border-t border-white/10" />
        </div>

        {/* ------------------------------------------------------------------
            4C. BASE DEL TECLADO CHICLET Y TRACKPAD DE CRISTAL ESMERILADO
            Construido en perspectiva isométrica elegante
           ------------------------------------------------------------------ */}
        <div
          className="relative rounded-b-2xl sm:rounded-b-3xl border-x border-b border-white/20 bg-gradient-to-b from-[#161c28] via-[#101520] to-[#0c1018] p-3 sm:p-5 shadow-2xl"
          style={{
            boxShadow: `0 25px 80px -15px rgba(0,0,0,0.95), 0 0 40px -10px ${displayedStation.glowShadow}`,
          }}
        >
          {/* Bandeja rebajada del teclado chiclet */}
          <div className="relative rounded-xl border border-white/10 bg-[#090d14] p-2 sm:p-2.5 shadow-inner space-y-1 sm:space-y-1.5 font-mono text-[9px] sm:text-[10px] text-slate-300">
            {/* Fila 1: Función */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              <div className="w-9 sm:w-12 text-center rounded bg-[#131924] border border-white/5 py-1 text-[8px] sm:text-[9px]">
                esc
              </div>
              <div className="flex-1 flex items-center gap-1 sm:gap-1.5">
                {['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'].map((f) => (
                  <div
                    key={f}
                    className="flex-1 text-center rounded bg-[#131924] border border-white/5 py-1 text-[7px] sm:text-[8px] text-slate-400"
                  >
                    {f}
                  </div>
                ))}
              </div>
              <div className="w-8 sm:w-10 flex items-center justify-center rounded bg-[#131924] border border-white/5 py-1">
                <span
                  className="h-1.5 w-1.5 rounded-full"
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
                  className="flex-1 text-center rounded bg-[#151c28] border border-white/5 py-1"
                >
                  {k}
                </div>
              ))}
              <div className="w-10 sm:w-14 text-center rounded bg-[#151c28] border border-white/5 py-1 text-[8px]">
                delete
              </div>
            </div>

            {/* Fila 3: QWERTY */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              <div className="w-10 sm:w-13 text-center rounded bg-[#151c28] border border-white/5 py-1 text-[8px]">
                tab
              </div>
              {['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']'].map((k) => (
                <div
                  key={k}
                  className="flex-1 text-center rounded bg-[#151c28] border border-white/5 py-1"
                >
                  {k}
                </div>
              ))}
              <div className="w-8 sm:w-10 text-center rounded bg-[#151c28] border border-white/5 py-1 text-[8px]">
                \
              </div>
            </div>

            {/* Fila 4: ASDF */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              <div className="w-12 sm:w-16 text-center rounded bg-[#151c28] border border-white/5 py-1 text-[8px]">
                caps
              </div>
              {['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'"].map((k) => (
                <div
                  key={k}
                  className="flex-1 text-center rounded bg-[#151c28] border border-white/5 py-1"
                >
                  {k}
                </div>
              ))}
              <div className="w-12 sm:w-16 text-center rounded bg-[#151c28] border border-white/5 py-1 text-[8px]">
                return
              </div>
            </div>

            {/* Fila 5: Barra Espaciadora y Modificadores */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              <div className="w-8 sm:w-11 text-center rounded bg-[#151c28] border border-white/5 py-1 text-[8px]">
                fn
              </div>
              <div className="w-8 sm:w-11 text-center rounded bg-[#151c28] border border-white/5 py-1 text-[8px]">
                control
              </div>
              <div className="w-9 sm:w-12 text-center rounded bg-[#151c28] border border-white/5 py-1 text-[8px]">
                option
              </div>
              <div className="w-10 sm:w-14 text-center rounded bg-[#151c28] border border-white/5 py-1 text-[8px]">
                command ⌘
              </div>
              <div
                className="flex-1 rounded bg-[#182030] border border-white/10 py-1 font-sans text-[8px] flex items-center justify-center transition-colors shadow-sm"
                style={{
                  boxShadow: `0 0 10px -2px ${displayedStation.glowShadow}`,
                }}
              >
                <span className="text-slate-500 font-mono tracking-widest text-[7px] uppercase">
                  Códice Studio
                </span>
              </div>
              <div className="w-10 sm:w-14 text-center rounded bg-[#151c28] border border-white/5 py-1 text-[8px]">
                command ⌘
              </div>
              <div className="w-9 sm:w-12 text-center rounded bg-[#151c28] border border-white/5 py-1 text-[8px]">
                option
              </div>
              <div className="w-10 sm:w-14 flex items-center justify-center gap-0.5 rounded bg-[#151c28] border border-white/5 py-1 text-[8px]">
                <span>◀</span>
                <span>▲▼</span>
                <span>▶</span>
              </div>
            </div>
          </div>

          {/* Trackpad Háptico de Cristal Esmerilado */}
          <div className="mt-3 sm:mt-4 flex justify-center">
            <div className="w-44 sm:w-60 h-10 sm:h-12 rounded-xl border border-white/10 bg-[#0e131d]/90 shadow-inner flex items-center justify-center">
              <span className="h-0.5 w-6 rounded-full bg-slate-700/60" />
            </div>
          </div>

          {/* Ranura frontal de apertura ergonómica (Thumb Notch) */}
          <div className="absolute -bottom-1.5 inset-x-0 flex justify-center pointer-events-none">
            <div className="w-20 sm:w-28 h-2 rounded-b-md bg-[#0a0d14] border-b border-x border-white/15" />
          </div>
        </div>
      </div>
    </div>
  );
};
