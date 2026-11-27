import React, { memo, useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import { AnimatePresence, domMax, LazyMotion, m, MotionConfig } from 'motion/react';
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Check,
  Eye,
  FileCode2,
  FolderSearch,
  Globe,
  Layers,
  LayoutGrid,
  MousePointerClick,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { AppPageRoute } from '../../types/workspace';
import chatgptIcon from '../../assets/ai-icons/chatgpt.png';
import claudeIcon from '../../assets/ai-icons/claude.png';
import geminiIcon from '../../assets/ai-icons/gemini.png';
import deepseekIcon from '../../assets/ai-icons/deepseek.png';
import opencodeIcon from '../../assets/ai-icons/opencode.png';
import { WorkshopLight } from './WorkshopLight';
import './forgeHero.css';

interface ForgeHeroShowcaseProps {
  onNavigatePage: (page: AppPageRoute) => void;
}

type WorkflowId = 'auditar' | 'explorar' | 'componentes' | 'codice' | 'all';
type BenchToolId =
  | 'skill-md'
  | 'files-panel'
  | 'audit-badge'
  | 'skills-sh'
  | 'kit-ui'
  | 'claude'
  | 'gemini'
  | 'chatgpt'
  | 'deepseek'
  | 'opencode';

interface BenchTool {
  id: BenchToolId;
  name: string;
  category: string;
  tag: string;
  /** [left, top, width, height] en porcentaje sobre el tablero knolling */
  box: [number, number, number, number];
  image?: string;
  pixelArt?: boolean;
  icon?: LucideIcon;
}

interface WorkflowPreset {
  id: WorkflowId;
  label: string;
  icon: LucideIcon;
  route: AppPageRoute;
  ctaLabel: string;
  tools: BenchToolId[];
  title: [string, string, string];
  accessibleTitle: string;
}

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const LIFT_SPRING = { type: 'spring', stiffness: 260, damping: 24, mass: 0.7 } as const;
const RULER_MARKS = Array.from({ length: 11 }, (_, i) => i * 10);
const LAMP_REST = { x: 24, y: 16 };
const SHADOW_REACH = 26;

const BENCH_TOOLS: readonly BenchTool[] = [
  // Fila superior: módulos técnicos del estudio
  { id: 'skill-md', name: 'SKILL.md', category: 'Directiva', tag: 'SHA', box: [2, 8, 17.6, 38], icon: FileCode2 },
  { id: 'files-panel', name: 'FilesPanel', category: 'Inspector', tag: '512 KB', box: [21.6, 8, 17.6, 38], icon: FolderSearch },
  { id: 'audit-badge', name: 'AuditBadge', category: 'Seguridad', tag: 'Auto', box: [41.2, 8, 17.6, 38], icon: ShieldCheck },
  { id: 'skills-sh', name: 'skills.sh', category: 'Explorar', tag: 'Live', box: [60.8, 8, 17.6, 38], icon: Globe },
  { id: 'kit-ui', name: 'Kit UI', category: 'Componentes', tag: '20 UI', box: [80.4, 8, 17.6, 38], icon: Layers },
  // Fila inferior: los 5 agentes de IA con sus iconos transparentes limpios
  { id: 'claude', name: 'Claude', category: 'Agente IA', tag: 'CLI', box: [2, 51, 17.6, 38], image: claudeIcon, pixelArt: true },
  { id: 'gemini', name: 'Gemini', category: 'Agente IA', tag: '2M', box: [21.6, 51, 17.6, 38], image: geminiIcon },
  { id: 'chatgpt', name: 'ChatGPT', category: 'Agente IA', tag: 'Flujo', box: [41.2, 51, 17.6, 38], image: chatgptIcon },
  { id: 'deepseek', name: 'DeepSeek', category: 'Agente IA', tag: 'Código', box: [60.8, 51, 17.6, 38], image: deepseekIcon },
  { id: 'opencode', name: 'OpenCode', category: 'Agente IA', tag: 'Open', box: [80.4, 51, 17.6, 38], image: opencodeIcon, pixelArt: true },
];

const TOOL_MAP: Record<BenchToolId, BenchTool> = Object.fromEntries(
  BENCH_TOOLS.map((t) => [t.id, t])
) as Record<BenchToolId, BenchTool>;

const WORKFLOWS: readonly WorkflowPreset[] = [
  {
    id: 'auditar',
    label: 'Auditar skill',
    icon: ShieldCheck,
    route: 'catalogo',
    ctaLabel: 'Abrir Catálogo',
    tools: ['skill-md', 'files-panel', 'audit-badge', 'claude', 'deepseek'],
    title: ['Catálogo e inspector', 'de skills para', 'equipos IA'],
    accessibleTitle: 'Catálogo e inspector de skills para equipos IA',
  },
  {
    id: 'explorar',
    label: 'skills.sh',
    icon: Globe,
    route: 'skills-sh',
    ctaLabel: 'Ir a Explorar',
    tools: ['skills-sh', 'skill-md', 'audit-badge', 'gemini', 'opencode'],
    title: ['Descubre y audita', 'directivas en', 'skills.sh'],
    accessibleTitle: 'Catálogo e inspector de skills: descubre y audita directivas en skills.sh',
  },
  {
    id: 'componentes',
    label: 'Kit UI',
    icon: Layers,
    route: 'preview',
    ctaLabel: 'Ver Componentes',
    tools: ['kit-ui', 'skill-md', 'claude', 'gemini', 'chatgpt'],
    title: ['Componentes UI', 'accesibles con', 'código real'],
    accessibleTitle: 'Catálogo e inspector de skills: componentes UI accesibles con código real',
  },
  {
    id: 'codice',
    label: 'Códice',
    icon: BookOpen,
    route: 'codice-studio',
    ctaLabel: 'Abrir Códice',
    tools: ['skill-md', 'kit-ui', 'chatgpt', 'claude', 'opencode'],
    title: ['Documenta clases', 'técnicas en', 'tu Códice'],
    accessibleTitle: 'Catálogo e inspector de skills: documenta clases técnicas en tu Códice',
  },
  {
    id: 'all',
    label: 'Todo',
    icon: LayoutGrid,
    route: 'boveda',
    ctaLabel: 'Ver Skills del equipo',
    tools: [],
    title: ['Todo tu estudio', 'conectado por', 'commitSha'],
    accessibleTitle: 'Catálogo e inspector de skills: todo tu estudio conectado por commitSha',
  },
];

const TRUST_ITEMS = [
  { icon: BadgeCheck, label: 'Fijado a commitSha' },
  { icon: ShieldCheck, label: 'Lectura inerte ≤ 512 KB' },
  { icon: Sparkles, label: 'Sesión OAuth en memoria' },
] as const;

const useMediaQuery = (query: string): boolean => {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query]
  );

  return useSyncExternalStore(
    subscribe,
    () => (typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(query).matches : false),
    () => false
  );
};

const RollingLine: React.FC<{ text: string; delay: number }> = ({ text, delay }) => (
  <AnimatePresence mode="wait" initial={false}>
    <m.span key={text} className="fg-rolling-line">
      {text.split('').map((char, index) => (
        <m.span
          key={`${char}-${index}`}
          initial={{ y: '110%' }}
          animate={{ y: '0%', transition: { delay: delay + index * 0.025, duration: 0.45, ease: EASE_OUT } }}
          exit={{ y: '-110%', transition: { delay: index * 0.015, duration: 0.22, ease: [0.55, 0, 1, 0.45] } }}
          className="inline-block"
        >
          {char === ' ' ? '\u00A0' : <span className="fg-letter">{char}</span>}
        </m.span>
      ))}
    </m.span>
  </AnimatePresence>
);

interface BoardToolTileProps {
  tool: BenchTool;
  inKit: boolean;
  active: boolean;
  order: number;
  reduceMotion: boolean;
  onToggle: (id: BenchToolId) => void;
  onActive: (id: BenchToolId | null) => void;
}

const BoardToolTile = memo<BoardToolTileProps>(({ tool, inKit, active, order, reduceMotion, onToggle, onActive }) => {
  const [left, top, width, height] = tool.box;
  const labelBelow = top < 20;
  const lifted = inKit && !reduceMotion;
  const delay = inKit && !reduceMotion ? Math.max(0, order) * 0.055 : 0;
  const ToolIcon = tool.icon;

  const style = {
    left: `${left}%`,
    top: `${top}%`,
    width: `${width}%`,
    height: `${height}%`,
    '--tx': left + width / 2,
    '--ty': top + height / 2,
    zIndex: active ? 45 : inKit ? 20 : 12,
  } as CSSProperties;

  return (
    <button
      type="button"
      aria-pressed={inKit}
      aria-label={`${tool.name} (${tool.category})`}
      onClick={() => onToggle(tool.id)}
      onPointerEnter={() => onActive(tool.id)}
      onPointerLeave={() => onActive(null)}
      onFocus={() => onActive(tool.id)}
      onBlur={() => onActive(null)}
      style={style}
      className="fg-tool"
    >
      <m.div
        initial={false}
        animate={{
          opacity: inKit || active ? 1 : 0.48,
          y: lifted ? -6 : 0,
          scale: lifted ? 1.03 : 1,
        }}
        transition={{
          opacity: { duration: 0.3, delay, ease: EASE_OUT },
          default: { ...LIFT_SPRING, delay },
        }}
        className={`fg-tool__body${inKit ? ' fg-tool__body--lifted' : ' fg-tool__body--dim'}`}
      >
        <span className="fg-tool__icon-box" aria-hidden="true">
          {tool.image ? (
            <img
              src={tool.image}
              alt=""
              draggable={false}
              className={`fg-tool__img${tool.pixelArt ? ' fg-tool__img--pixel' : ''}`}
            />
          ) : (
            ToolIcon && <ToolIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#0ea5e9]" strokeWidth={1.85} />
          )}
        </span>
        <span className="fg-tool__name">{tool.name}</span>
        <span className="fg-tool__meta">{tool.tag}</span>
      </m.div>

      <AnimatePresence>
        {active && (
          <m.span
            initial={{ opacity: 0, y: labelBelow ? -4 : 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: EASE_OUT }}
            className={`fg-tag ${labelBelow ? 'fg-tag--below' : 'fg-tag--above'}`}
          >
            <span className={`fg-tag__badge${inKit ? ' fg-tag__badge--in' : ''}`} aria-hidden="true">
              {inKit ? <Check className="w-3 h-3" strokeWidth={3} /> : <Plus className="w-3 h-3" strokeWidth={3} />}
            </span>
            <span className="fg-tag__title">{tool.name}</span>
            <span className="fg-tag__cat">{inKit ? 'En flujo' : tool.category}</span>
          </m.span>
        )}
      </AnimatePresence>
    </button>
  );
});

BoardToolTile.displayName = 'BoardToolTile';

/**
 * Hero interactivo estilo Forge adaptado a Códice Studio (Cyber Dark + cian #0ea5e9).
 * Cargado en chunk diferido con LazyMotion (domMax) para mantener el bundle inicial < 350 kB.
 */
export const ForgeHeroShowcase: React.FC<ForgeHeroShowcaseProps> = ({ onNavigatePage }) => {
  const [workflowId, setWorkflowId] = useState<WorkflowId>('auditar');
  const [kit, setKit] = useState<BenchToolId[]>(WORKFLOWS[0].tools);
  const [activeTool, setActiveTool] = useState<BenchToolId | null>(null);
  const [peekId, setPeekId] = useState<WorkflowId | null>(null);

  const boardRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef(0);
  const lampRef = useRef(LAMP_REST);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const finePointer = useMediaQuery('(hover: hover) and (pointer: fine)');

  const workflow = WORKFLOWS.find((w) => w.id === workflowId) ?? WORKFLOWS[0];
  const preview = peekId ? WORKFLOWS.find((w) => w.id === peekId) ?? null : null;
  const shownKit = preview ? preview.tools : kit;
  const customised =
    kit.length !== workflow.tools.length || kit.some((id) => !workflow.tools.includes(id));
  const bright = (preview ? preview.id : workflowId) === 'all' && shownKit.length === 0;

  useEffect(() => () => window.cancelAnimationFrame(frameRef.current), []);

  const moveLamp = useCallback((x: number, y: number) => {
    lampRef.current = { x, y };
    if (frameRef.current) return;
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = 0;
      boardRef.current?.style.setProperty('--lx', String(lampRef.current.x));
      boardRef.current?.style.setProperty('--ly', String(lampRef.current.y));
    });
  }, []);

  const handleBoardPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!finePointer || reduceMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    moveLamp(
      ((e.clientX - rect.left) / rect.width) * 100,
      ((e.clientY - rect.top) / rect.height) * 100
    );
  };

  const handlePickWorkflow = (id: WorkflowId) => {
    const next = WORKFLOWS.find((w) => w.id === id);
    if (!next) return;
    setWorkflowId(id);
    setKit(next.tools);
    setPeekId(null);
  };

  const handleToggleTool = useCallback((id: BenchToolId) => {
    setKit((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }, []);

  const handleRemoveTool = useCallback((id: BenchToolId) => {
    setKit((current) => current.filter((item) => item !== id));
  }, []);

  const handleTabKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const stepMap: Record<string, number> = {
      ArrowRight: 1,
      ArrowDown: 1,
      ArrowLeft: -1,
      ArrowUp: -1,
    };
    const step = stepMap[e.key];
    if (!step) return;
    e.preventDefault();
    const activeIndex = WORKFLOWS.findIndex((w) => w.id === workflowId);
    const nextIdx = (activeIndex + step + WORKFLOWS.length) % WORKFLOWS.length;
    handlePickWorkflow(WORKFLOWS[nextIdx].id);
    tabRefs.current[nextIdx]?.focus();
  };

  const openRoute = (e: React.MouseEvent, page: AppPageRoute) => {
    e.preventDefault();
    onNavigatePage(page);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const boardStyle = {
    '--lx': LAMP_REST.x,
    '--ly': LAMP_REST.y,
    '--fg-reach': `${SHADOW_REACH / 100}px`,
  } as CSSProperties;

  const count = kit.length;
  const countLabel = `${count} ${count === 1 ? 'pieza' : 'piezas'}`;

  return (
    <LazyMotion features={domMax}>
      <MotionConfig reducedMotion="user">
        <section
          className="hero fg-hero-root"
          data-enter
          aria-labelledby="hero-h"
        >
          <WorkshopLight reduceMotion={reduceMotion} finePointer={finePointer} />

          <div className="fg-hero-wrap">
            <div className="fg-hero-grid">
              {/* Columna izquierda: copy con letras rodantes, CTAs y fila de garantías */}
              <div className="fg-copy-col">
                <p className="fg-eyebrow" role="status">
                  <span aria-hidden="true" className="fg-eyebrow__bar" />
                  <span>Inspección GitHub · Fijada a commitSha</span>
                </p>

                <h1 id="hero-h" className="fg-display">
                  <span className="sr-only">{workflow.accessibleTitle}</span>
                  {workflow.title.map((line, index) => (
                    <span key={index} aria-hidden="true" className="fg-mask">
                      <span className={index === workflow.title.length - 1 ? 'fg-line--accent' : undefined}>
                        <RollingLine text={line} delay={index * 0.08} />
                      </span>
                    </span>
                  ))}
                </h1>

                <p className="fg-subtext">
                  Audita directivas SKILL.md y su código fuente fijados a commitSha en GitHub,
                  descubre skills en skills.sh, prueba componentes UI accesibles y documenta clases
                  en Códice.
                </p>

                <div className="fg-actions">
                  <a
                    href="#inspector"
                    onClick={(e) => openRoute(e, 'catalogo')}
                    className="fg-cta-primary fg-sheen"
                  >
                    <span>Explorar catálogo</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </a>
                  <a href="#capabilities" className="fg-cta-secondary">
                    Ver capacidades
                  </a>
                </div>

                <ul className="fg-trust fg-trust--desktop">
                  {TRUST_ITEMS.map(({ icon: Icon, label }) => (
                    <li key={label} className="fg-trust__item">
                      <Icon className="w-4 h-4 text-[#0ea5e9]" strokeWidth={1.8} aria-hidden="true" />
                      <span>{label}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Columna derecha: selector de flujos + tablero knolling con lámpara + dock contador */}
              <div className="fg-bench-col">
                <div className="fg-picker-row">
                  <p className="fg-picker-label">Elige un flujo para levantar sus piezas</p>
                  <div
                    role="radiogroup"
                    aria-label="Flujos de trabajo de Códice Studio"
                    onKeyDown={handleTabKeyDown}
                    onPointerLeave={() => setPeekId(null)}
                    className="fg-picker"
                  >
                    {WORKFLOWS.map((item, idx) => {
                      const isActive = item.id === workflowId;
                      const TabIcon = item.icon;
                      const usesActiveTool =
                        activeTool !== null && item.id !== 'all' && item.tools.includes(activeTool);

                      return (
                        <button
                          key={item.id}
                          ref={(node) => {
                            tabRefs.current[idx] = node;
                          }}
                          type="button"
                          role="radio"
                          aria-checked={isActive}
                          tabIndex={isActive ? 0 : -1}
                          onClick={() => handlePickWorkflow(item.id)}
                          onPointerEnter={(ev) => {
                            if (ev.pointerType === 'mouse') {
                              setPeekId(item.id === workflowId ? null : item.id);
                            }
                          }}
                          className={`fg-picker-tab${isActive ? ' fg-picker-tab--active' : ''}`}
                        >
                          {isActive && (
                            <m.span
                              layoutId="fg-picker-pill"
                              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                              className="fg-picker-pill"
                              aria-hidden="true"
                            />
                          )}
                          <span className="fg-picker-tab__content">
                            <TabIcon className="w-3.5 h-3.5" strokeWidth={1.9} aria-hidden="true" />
                            <span>{item.label}</span>
                          </span>
                          <AnimatePresence>
                            {usesActiveTool && (
                              <m.span
                                aria-hidden="true"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                                className="fg-picker-dot"
                              />
                            )}
                          </AnimatePresence>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tapete de corte con reglas y tablero knolling interactivo */}
                <div className="fg-mat">
                  <div aria-hidden="true" className="fg-ruler-x">
                    {RULER_MARKS.map((mark) => (
                      <span key={mark} style={{ left: `${mark}%` }}>
                        {mark / 10}
                      </span>
                    ))}
                  </div>
                  <div aria-hidden="true" className="fg-ruler-y">
                    {RULER_MARKS.filter((mark) => mark < 100).map((mark) => (
                      <span key={mark} style={{ top: `${mark}%` }}>
                        {mark / 10}
                      </span>
                    ))}
                  </div>

                  <div
                    ref={boardRef}
                    style={boardStyle}
                    data-bright={bright ? 'true' : 'false'}
                    onPointerMove={handleBoardPointerMove}
                    onPointerLeave={() => moveLamp(LAMP_REST.x, LAMP_REST.y)}
                    className="fg-board"
                    role="group"
                    aria-label="Tablero interactivo de módulos y agentes de IA"
                  >
                    <m.div
                      aria-hidden="true"
                      initial={false}
                      animate={{ opacity: bright ? 0 : shownKit.length ? 0.42 : 0.1 }}
                      transition={{ duration: 0.45, ease: EASE_OUT }}
                      className="fg-board__scrim"
                    />
                    <div aria-hidden="true" className="fg-lamp" />

                    {!reduceMotion && (
                      <AnimatePresence initial={false}>
                        <m.div
                          key={workflowId}
                          aria-hidden="true"
                          initial={{ x: '-65%', opacity: 0.85 }}
                          animate={{ x: '165%', opacity: 0 }}
                          transition={{ duration: 0.95, ease: EASE_OUT }}
                          className="fg-sweep"
                        />
                      </AnimatePresence>
                    )}

                    {BENCH_TOOLS.map((tool) => (
                      <BoardToolTile
                        key={tool.id}
                        tool={tool}
                        inKit={shownKit.includes(tool.id)}
                        active={activeTool === tool.id}
                        order={shownKit.indexOf(tool.id)}
                        reduceMotion={reduceMotion}
                        onToggle={handleToggleTool}
                        onActive={setActiveTool}
                      />
                    ))}

                    <AnimatePresence>
                      {preview && (
                        <m.p
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.18, ease: EASE_OUT }}
                          className="fg-board-preview-pill"
                        >
                          <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>
                            Vista previa · {preview.label} ({preview.tools.length})
                          </span>
                        </m.p>
                      )}
                    </AnimatePresence>

                    <p className="fg-board-hint" aria-hidden="true">
                      <MousePointerClick className="w-3.5 h-3.5 text-[#0ea5e9]" />
                      <span>Haz clic en cada pieza para armar tu flujo</span>
                    </p>
                  </div>
                </div>

                {/* Dock inferior contador con chips editables y acceso directo al módulo */}
                <div className="fg-dock">
                  <div className="fg-dock__summary">
                    <p className="fg-dock__eyebrow">Tu flujo activo</p>
                    <span className="sr-only" aria-live="polite">
                      {countLabel} en tu flujo {workflow.label}
                    </span>
                    <p aria-hidden="true" className="fg-dock__count-line">
                      <span className="fg-dock__tally">
                        <AnimatePresence mode="popLayout" initial={false}>
                          <m.span
                            key={count}
                            initial={{ y: '100%' }}
                            animate={{ y: '0%' }}
                            exit={{ y: '-100%' }}
                            transition={{ duration: 0.28, ease: EASE_OUT }}
                          >
                            {count}
                          </m.span>
                        </AnimatePresence>
                      </span>
                      <span>&nbsp;{count === 1 ? 'pieza' : 'piezas'} ·</span>
                      <span className="fg-dock__subtitle">
                        {workflow.id === 'all'
                          ? 'Selección libre'
                          : customised
                            ? 'Personalizado'
                            : workflow.label}
                      </span>
                    </p>
                  </div>

                  <ul className="fg-dock__chips" aria-label="Piezas seleccionadas en el flujo">
                    <AnimatePresence initial={false} mode="popLayout">
                      {kit.map((id) => {
                        const t = TOOL_MAP[id];
                        const Icon = t.icon;
                        return (
                          <m.li
                            key={id}
                            layout
                            initial={{ opacity: 0, scale: 0.6 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.6 }}
                            transition={{ duration: 0.25, ease: EASE_OUT }}
                          >
                            <button
                              type="button"
                              onClick={() => handleRemoveTool(id)}
                              aria-label={`Quitar ${t.name} de tu flujo`}
                              title={t.name}
                              className="fg-dock__chip-btn"
                            >
                              {t.image ? (
                                <img
                                  src={t.image}
                                  alt=""
                                  width={22}
                                  height={22}
                                  className={`w-full h-full object-contain${t.pixelArt ? ' fg-tool__img--pixel' : ''}`}
                                />
                              ) : (
                                Icon && <Icon className="w-4 h-4 text-[#0ea5e9]" aria-hidden="true" />
                              )}
                              <span className="fg-dock__chip-x" aria-hidden="true">
                                <X className="w-2.5 h-2.5" strokeWidth={3} />
                              </span>
                            </button>
                          </m.li>
                        );
                      })}
                    </AnimatePresence>
                    {count === 0 && (
                      <li className="fg-dock__empty">
                        Pulsa piezas en el tablero para armar tu flujo.
                      </li>
                    )}
                  </ul>

                  <div className="fg-dock__controls">
                    {customised && (
                      <button
                        type="button"
                        onClick={() => setKit(workflow.tools)}
                        aria-label={`Restablecer el flujo ${workflow.label}`}
                        className="fg-dock__reset"
                      >
                        <RotateCcw className="w-4 h-4" aria-hidden="true" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => openRoute(e, workflow.route)}
                      className="fg-dock__cta fg-sheen"
                    >
                      <span>{workflow.ctaLabel}</span>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>

              <ul className="fg-trust fg-trust--mobile">
                {TRUST_ITEMS.map(({ icon: Icon, label }) => (
                  <li key={label} className="fg-trust__item">
                    <Icon className="w-4 h-4 text-[#0ea5e9]" strokeWidth={1.8} aria-hidden="true" />
                    <span>{label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </MotionConfig>
    </LazyMotion>
  );
};

export default ForgeHeroShowcase;
