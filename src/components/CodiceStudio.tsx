import React, { useState, useMemo } from 'react';
import {
  Terminal,
  Cpu,
  Layers,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  Activity,
  Play,
  Search,
  ExternalLink,
  Code2,
  Sliders,
  RefreshCw,
  GitBranch,
  CheckCircle2,
  Lock,
  ArrowUpRight,
  BookOpen,
} from 'lucide-react';
import { LessonsSection } from './lessons/LessonsSection';

interface SkillItem {
  id: string;
  title: string;
  category: 'Orchestrator' | 'Frontend UI' | 'Memory & Hooks' | 'Security';
  version: string;
  status: 'Activo' | 'Live Sync' | 'Standby';
  description: string;
  modelTarget: string;
  latencyMs: number;
  tokens: number;
  promptSnippet: string;
  tags: string[];
}

const SAMPLE_SKILLS: SkillItem[] = [
  {
    id: 'skill-orchestrator',
    title: 'Autonomous Multi-Agent Orchestrator',
    category: 'Orchestrator',
    version: 'v2.4.0',
    status: 'Live Sync',
    description:
      'Planificador reflexivo y despacho paralelo de agentes especialistas con aislamiento de contexto y memoria persistente.',
    modelTarget: 'Claude Opus 5.5 / Gemini 3.8',
    latencyMs: 142,
    tokens: 4120,
    promptSnippet: `// System Directive: Multi-Agent Dispatch Protocol
interface AgentDispatchEnvelope<TContext> {
  readonly traceId: string;
  readonly role: 'Architect' | 'Auditor' | 'Synthesizer';
  readonly memoryTier: 'ephemeral' | 'vault-synced';
  execute(task: TaskPayload, ctx: TContext): Promise<AgentVerdict>;
}

export async function orchestratePipeline(mission: MissionSpec): Promise<PipelineResult> {
  const kernel = await acquireKernelSession({ sandbox: true });
  return kernel.dispatchParallel([mission.plan, mission.verify]);
}`,
    tags: ['mcp', 'agentic', 'parallel-run', 'zero-leak'],
  },
  {
    id: 'skill-ui-cyber',
    title: 'Cyber Dark UI Design System',
    category: 'Frontend UI',
    version: 'v3.1.2',
    status: 'Activo',
    description:
      'Tokens de diseño Vercel/Linear en modo espacial. Fondo azul noche, acentos cian neón y cero tonos cálidos.',
    modelTarget: 'GPT Astra / Gemini Ultra',
    latencyMs: 88,
    tokens: 2850,
    promptSnippet: `/* Carbon Dark Theme Tokens */
:root {
  --bg-midnight-void: #0a0d14;
  --bg-surface-carbon: #121722;
  --panel-glass: rgba(18, 23, 34, 0.82);
  --border-subtle: rgba(148, 163, 184, 0.16);
  --accent-cyan-neon: #0ea5e9;
  --accent-cyan-glow: #38bdf8;
  --status-emerald: #34d399;
  --text-primary: #ffffff;
  --text-muted: #94a3b8;
}`,
    tags: ['tailwind-v4', 'glassmorphism', 'cyan-glow'],
  },
  {
    id: 'skill-memory-vault',
    title: 'Stateful Synaptic Memory Vault',
    category: 'Memory & Hooks',
    version: 'v1.9.4',
    status: 'Live Sync',
    description:
      'Persistencia vectorizada local con cifrado criptográfico PBKDF2 y sincronización bidireccional Obsidian MOC.',
    modelTarget: 'Claude Opus 4.8',
    latencyMs: 95,
    tokens: 3410,
    promptSnippet: `// Cryptographic Memory Hydration
export class SynapticMemoryVault {
  private cipherSalt: Uint8Array;
  
  async retrieveContext(vectorQuery: Float32Array): Promise<MemoryNode[]> {
    const verified = await crypto.subtle.verify("HMAC", this.key, signature, vectorQuery);
    if (!verified) throw new SecurityBoundaryException("Integrity check failed");
    return this.kdTree.search(vectorQuery, { topK: 5 });
  }
}`,
    tags: ['crypto-pbkdf2', 'vector-index', 'obsidian-moc'],
  },
  {
    id: 'skill-security-guard',
    title: 'Boundary Threat Model & CSP Auditor',
    category: 'Security',
    version: 'v2.0.1',
    status: 'Activo',
    description:
      'Sanitizador de fronteras no confiables, control de Path Traversal en paquetes VFS (.zip) y cabeceras CSP estrictas.',
    modelTarget: 'Gemini 3.8 Live / Sonnet 5.5',
    latencyMs: 64,
    tokens: 1980,
    promptSnippet: `// Security Boundary Enforcement
export function sanitizeArchiveStream(entryPath: string): string {
  const normalized = entryPath.replace(/\\\\/g, '/');
  if (normalized.includes('../') || normalized.startsWith('/')) {
    throw new PathTraversalForbidden("Suspicious directory traversal detected");
  }
  return normalized.replace(/[\\x00-\\x1F\\x7F]/g, '');
}`,
    tags: ['stride-model', 'anti-traversal', 'csp-strict'],
  },
];

interface CodiceStudioProps {
  /** Clase abierta en la pestaña «Clases» (la guarda `App`). */
  openLessonId?: string | null;
  onOpenLesson?: (id: string | null) => void;
  onOpenSkill?: (id: string) => void;
  onOpenComponent?: (id: string) => void;
  onRequestLogin?: () => void;
}

type CodiceSection = 'clases' | 'engine';

const SECTIONS: Array<{ id: CodiceSection; label: string }> = [
  { id: 'clases', label: 'Clases' },
  { id: 'engine', label: 'Studio Engine' },
];

export const CodiceStudio: React.FC<CodiceStudioProps> = ({
  openLessonId = null,
  onOpenLesson = () => undefined,
  onOpenSkill = () => undefined,
  onOpenComponent = () => undefined,
  onRequestLogin = () => undefined,
}) => {
  const [section, setSection] = useState<CodiceSection>('clases');
  const [selectedSkillId, setSelectedSkillId] = useState<string>(SAMPLE_SKILLS[0].id);
  const [activeTab, setActiveTab] = useState<'prompt' | 'typescript' | 'telemetry'>('prompt');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionOutput, setExecutionOutput] = useState<string | null>(null);

  const selectedSkill = useMemo(
    () => SAMPLE_SKILLS.find((s) => s.id === selectedSkillId) || SAMPLE_SKILLS[0],
    [selectedSkillId]
  );

  const filteredSkills = useMemo(() => {
    return SAMPLE_SKILLS.filter((skill) => {
      const matchesCategory = selectedCategory === 'All' || skill.category === selectedCategory;
      const matchesSearch =
        skill.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
        skill.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
        skill.tags.some((t) => t.toLowerCase().includes(searchFilter.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchFilter]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedSkill.promptSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunInference = () => {
    setIsExecuting(true);
    setExecutionOutput(null);
    setTimeout(() => {
      setIsExecuting(false);
      setExecutionOutput(
        `✓ [${selectedSkill.modelTarget}] Inferencia exitosa en ${selectedSkill.latencyMs}ms.\n` +
          `• Token Context: ${selectedSkill.tokens} tokens evaluados sin degradación.\n` +
          `• Estado de sincronización: Seguro (PBKDF2 validado, 0 violaciones CSP).\n` +
          `• Salida: Núcleo neuronal sincronizado con Códice Obsidian.`
      );
    }, 600);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#030712] text-[#94A3B8] font-sans antialiased selection:bg-[#0EA5E9] selection:text-white overflow-x-hidden">
      {/* 
        ========================================================================
        1. ATMÓSFERA ESPACIAL / NEBULOSAS DIFUMINADAS (CYBER DARK)
        ========================================================================
      */}
      {/* Luz atmosférica sutil en cian/pizarra */}
      <div
        className="pointer-events-none fixed -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-sky-900/15 via-slate-900/10 to-transparent blur-[140px]"
        aria-hidden="true"
      />
      {/* Nebulosa cian / azul noche inferior derecha */}
      <div
        className="pointer-events-none fixed -bottom-40 -right-40 h-[650px] w-[650px] rounded-full bg-gradient-to-tl from-sky-900/15 via-slate-950/20 to-transparent blur-[150px]"
        aria-hidden="true"
      />
      {/* Destello central sutil en pizarra */}
      <div
        className="pointer-events-none fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[800px] rounded-full bg-slate-900/20 blur-[160px]"
        aria-hidden="true"
      />
      {/* Cuadrícula sutil de precisión técnica */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.035] bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* 
          ========================================================================
          2. BARRA DE NAVEGACIÓN SUPERIOR (ESTILO VERCEL / LINEAR)
          ========================================================================
        */}
        <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#0A0D14]/85 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            {/* Logo e Identidad de Marca */}
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-[#121722] border border-sky-500/40">
                <Sparkles className="w-4 h-4 text-sky-400" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#0EA5E9]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base tracking-tight text-[#FFFFFF]">
                    Códice
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-mono font-medium tracking-wide bg-slate-900 border border-slate-700 text-sky-300">
                    STUDIO
                  </span>
                </div>
                <p className="text-[10px] text-[#94A3B8]/70 hidden sm:block tracking-wider uppercase">
                  Workspace VFS &amp; Clases del equipo
                </p>
              </div>
            </div>

            {/* Enlaces de Navegación Limpios */}
            <div
              role="tablist"
              aria-label="Secciones de Códice"
              className="flex items-center gap-1 bg-[#121722] border border-slate-800 px-2 py-1 rounded-full shadow-inner"
            >
              {SECTIONS.map((item) => (
                <button
                  key={item.id}
                  id={`codice-tab-${item.id}`}
                  type="button"
                  role="tab"
                  aria-selected={section === item.id}
                  aria-controls={`codice-panel-${item.id}`}
                  onClick={() => setSection(item.id)}
                  className={`px-3.5 py-1 text-xs font-medium rounded-full transition-all duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9] ${
                    section === item.id
                      ? 'bg-sky-500/15 text-[#38BDF8] border border-sky-400/30'
                      : 'bg-transparent text-[#94A3B8] border border-transparent hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {item.id === 'clases' && <BookOpen aria-hidden="true" className="mr-1.5 inline h-3.5 w-3.5 align-[-2px]" />}
                  {item.label}
                </button>
              ))}
            </div>

            {/* Estado del Usuario y CTA Neón */}
            <div className={`items-center gap-3 ${section === 'engine' ? 'flex' : 'hidden'}`}>
              {/* Badge de Estado: Verde Esmeralda Suave estricto */}
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-[11px] font-mono text-emerald-300">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34D399] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#34D399]" />
                </span>
                <span className="font-semibold tracking-wide">Live Sync</span>
              </div>

              {/* Botón Primario / CTA Cian Eléctrico */}
              <button
                type="button"
                onClick={handleRunInference}
                disabled={isExecuting}
                className="group relative inline-flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-lg text-[#030712] bg-[#0EA5E9] hover:bg-[#38BDF8] transition-all duration-200 shadow-[0_0_20px_rgba(14,165,233,0.35)] hover:shadow-[0_0_26px_rgba(56,189,248,0.55)] active:scale-95 disabled:opacity-60"
              >
                {isExecuting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
                <span>{isExecuting ? 'Ejecutando...' : 'Run Pipeline'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* 
          ========================================================================
          3. HERO & SUBTÍTULO CARBON + CIAN
          ========================================================================
        */}
        {section === 'clases' ? (
          <div
            id="codice-panel-clases"
            role="tabpanel"
            aria-labelledby="codice-tab-clases"
            className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8"
          >
            <LessonsSection
              openLessonId={openLessonId}
              onOpenLesson={onOpenLesson}
              onOpenSkill={onOpenSkill}
              onOpenComponent={onOpenComponent}
              onRequestLogin={onRequestLogin}
            />
          </div>
        ) : (
        <div
          id="codice-panel-engine"
          role="tabpanel"
          aria-labelledby="codice-tab-engine"
          className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8"
        >
          <section className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-sky-300">
              <Activity className="w-3.5 h-3.5 text-sky-400" />
              <span>Plataforma de Alta Densidad para Agentes Autónomos</span>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#FFFFFF]">
                  Códice Neuronal{' '}
                  <span className="text-[#0EA5E9]">
                    AI Studio
                  </span>
                </h1>
                <p className="text-sm sm:text-base text-[#94A3B8] max-w-2xl mt-1.5 leading-relaxed">
                  Entorno de diseño, orquestación y auditoría para agentes de IA con arquitectura
                  espacial minimalista, cero saturación visual y máxima fidelidad de cómputo.
                </p>
              </div>

              {/* Indicadores rápidos de telemetría */}
              <div className="flex items-center gap-3 text-xs font-mono">
                <div className="px-3 py-2 rounded-lg bg-[#121722] border border-slate-800">
                  <span className="text-[#94A3B8] block text-[10px] uppercase">Throughput</span>
                  <span className="text-[#FFFFFF] font-bold">178 tok/s</span>
                </div>
                <div className="px-3 py-2 rounded-lg bg-[#121722] border border-slate-800">
                  <span className="text-[#94A3B8] block text-[10px] uppercase">Latencia Base</span>
                  <span className="text-[#38BDF8] font-bold">42 ms</span>
                </div>
                <div className="px-3 py-2 rounded-lg bg-[#121722] border border-slate-800">
                  <span className="text-[#94A3B8] block text-[10px] uppercase">Protocolo</span>
                  <span className="text-[#34D399] font-bold">v3.8-Live</span>
                </div>
              </div>
            </div>
          </section>

          {/* 
            ========================================================================
            4. FILTROS Y BÚSQUEDA TÉCNICA
            ========================================================================
          */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-y border-slate-800 py-3">
            {/* Categorías */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {['All', 'Orchestrator', 'Frontend UI', 'Memory & Hooks', 'Security'].map(
                (category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-all duration-200 ${
                      selectedCategory === category
                        ? 'bg-[#0EA5E9]/15 text-[#38BDF8] border border-[#0EA5E9]/40'
                        : 'bg-[#121722] text-[#94A3B8] border border-slate-800 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {category}
                  </button>
                )
              )}
            </div>

            {/* Buscador */}
            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8]" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filtrar por skill, tag o modelo..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-[#121722] border border-slate-800 text-white placeholder-[#94A3B8]/60  focus:border-[#0EA5E9] focus:ring-1 focus:ring-[#0EA5E9]/40 transition-all"
              />
            </div>
          </div>

          {/* 
            ========================================================================
            5. LAYOUT DE TRABAJO: PANEL DE SKILLS (IZQ) + EDITOR / PROMPT (DER)
            ========================================================================
          */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Tarjetas de Skills (4 cols en escritorio) */}
            <div className="lg:col-span-5 space-y-3.5">
              <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                <span className="font-medium text-white flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-sky-400" />
                  Módulos de Códice ({filteredSkills.length})
                </span>
                <span className="font-mono text-[11px]">JSON / Schema Compliant</span>
              </div>

              <div className="space-y-3">
                {filteredSkills.map((skill) => {
                  const isSelected = skill.id === selectedSkill.id;
                  return (
                    <article
                      key={skill.id}
                      onClick={() => setSelectedSkillId(skill.id)}
                      className={`group relative p-4 rounded-xl cursor-pointer transition-all duration-300 border ${
                        isSelected
                          ? 'bg-[#121722] border-[#0EA5E9]/70 translate-x-1'
                          : 'bg-[#121722]/70 border-slate-800 hover:border-[#38BDF8]/50 hover:-translate-y-0.5'
                      }`}
                    >
                      {/* Borde sutil superior con brillo cuando está seleccionado */}
                      {isSelected && (
                        <div
                          className="absolute -top-[1px] left-4 right-4 h-[2px] bg-gradient-to-r from-transparent via-[#38BDF8] to-transparent"
                          aria-hidden="true"
                        />
                      )}

                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm text-[#FFFFFF] group-hover:text-[#38BDF8] transition-colors">
                              {skill.title}
                            </h3>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-sky-300">
                              {skill.version}
                            </span>
                          </div>
                          <p className="text-xs text-[#94A3B8] mt-1 line-clamp-2 leading-relaxed">
                            {skill.description}
                          </p>
                        </div>

                        {/* Status Verde Esmeralda */}
                        <span
                          className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium ${
                            skill.status === 'Live Sync'
                              ? 'bg-emerald-950/50 text-[#34D399] border border-emerald-500/30'
                              : 'bg-emerald-950/30 text-emerald-400/90 border border-emerald-500/20'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
                          {skill.status}
                        </span>
                      </div>

                      {/* Footer de la tarjeta: Tags y métricas */}
                      <div className="mt-3.5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2 text-[11px]">
                        <div className="flex flex-wrap gap-1.5">
                          {skill.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded bg-slate-900/80 border border-slate-800 text-slate-400 font-mono text-[10px]"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                        <div className="font-mono text-[10px] text-sky-400/90 shrink-0">
                          {skill.latencyMs}ms · {skill.tokens} tok
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            {/* Bloque de Código / Prompts (7 cols en escritorio) */}
            <div className="lg:col-span-7 space-y-3.5">
              <div className="flex items-center justify-between text-xs">
                {/* Pestañas del Editor */}
                <div className="flex items-center gap-1 bg-[#121722] border border-slate-800 p-1 rounded-lg">
                  {[
                    { id: 'prompt', label: 'System Directives', icon: Code2 },
                    { id: 'typescript', label: 'TypeScript Binding', icon: Terminal },
                    { id: 'telemetry', label: 'Inference Log', icon: Activity },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                          activeTab === tab.id
                            ? 'bg-[#0EA5E9]/20 text-[#38BDF8] border border-[#0EA5E9]/40'
                            : 'text-[#94A3B8] hover:text-white'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Acciones de Copiado */}
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#121722] border border-slate-800 text-xs text-[#94A3B8] hover:text-[#38BDF8] hover:border-[#0EA5E9]/50 transition-all duration-200"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#34D399]" />
                      <span className="text-[#34D399] font-medium">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Bloque</span>
                    </>
                  )}
                </button>
              </div>

              {/* Contenedor del Editor de Código (Carbon Dark) */}
              <div className="rounded-xl border border-slate-800 bg-[#0A0D14] shadow-2xl overflow-hidden">
                {/* Barra superior de ventana de código */}
                <div className="px-4 py-2.5 bg-[#121722] border-b border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-mono text-[11px] text-[#94A3B8]">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500/40 border border-sky-400/50" />
                    <span className="text-white font-medium">{selectedSkill.id}.ts</span>
                    <span className="text-slate-600">/</span>
                    <span className="text-[#38BDF8]">{selectedSkill.modelTarget}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-[#94A3B8]">
                    <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                      UTF-8
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-sky-950/50 border border-sky-800/40 text-[#38BDF8]">
                      TS Strict
                    </span>
                  </div>
                </div>

                {/* Área de Código Monoespaciado */}
                <div className="p-4 sm:p-5 overflow-x-auto text-xs sm:text-sm font-mono leading-relaxed bg-[#080B11]">
                  <pre className="text-slate-200">
                    <code>{selectedSkill.promptSnippet}</code>
                  </pre>
                </div>

                {/* Consola de Ejecución en Vivo */}
                {executionOutput && (
                  <div className="border-t border-slate-800 bg-[#0A0D14] p-4 text-xs font-mono space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-emerald-300">
                      <span className="flex items-center gap-1.5 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399]" />
                        Telemetría de Inferencia
                      </span>
                      <span className="text-[#94A3B8] text-[10px]">Justo ahora</span>
                    </div>
                    <p className="text-slate-300 whitespace-pre-line leading-relaxed">
                      {executionOutput}
                    </p>
                  </div>
                )}

                {/* Footer de Métricas Técnicas */}
                <div className="px-4 py-2 bg-[#121722] border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#94A3B8]">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#34D399]" />
                      CSP Strict Level 3
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-sky-400" />
                      PBKDF2 Cifrado Local
                    </span>
                  </div>
                  <div className="font-mono text-[#38BDF8]">
                    Context Budget: 4,120 / 128,000 tok
                  </div>
                </div>
              </div>

              {/* Tarjeta de Respaldo Obsidian & Git Sync */}
              <div className="p-4 rounded-xl bg-[#121722] border border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-sky-300">
                    <GitBranch className="w-4 h-4 text-sky-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">
                      Obsidian Vault &amp; GitLab Mirror
                    </h4>
                    <p className="text-[11px] text-[#94A3B8]">
                      Sincronizado con commit <code className="text-[#38BDF8]">b43bf25</code> en rama{' '}
                      <code className="text-sky-300">feat/tasteskill-workspace-overhaul</code>.
                    </p>
                  </div>
                </div>

                <a
                  href="#vault"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#0EA5E9] hover:text-[#38BDF8] transition-colors"
                >
                  <span>Ver MOC</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default CodiceStudio;
