import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, Layers, Link2, Pause, Play, X, Zap } from 'lucide-react';
import chatgptIcon from '../assets/ai-icons/chatgpt.png';
import claudeIcon from '../assets/ai-icons/claude.png';
import geminiIcon from '../assets/ai-icons/gemini.png';
import deepseekIcon from '../assets/ai-icons/deepseek.png';
import opencodeIcon from '../assets/ai-icons/opencode.png';
import './capabilitiesOrbital.css';

type AgentNodeKey = 'chatgpt' | 'claude' | 'gemini' | 'deepseek' | 'opencode';

export interface OrbitalAgentItem {
  id: number;
  key: AgentNodeKey;
  title: string;
  date: string;
  content: string;
  category: string;
  iconSrc: string;
  pixelArt?: boolean;
  relatedIds: number[];
  status: 'completed' | 'in-progress' | 'pending';
  energy: number;
}

const DEFAULT_ORBITAL_AGENTS: readonly OrbitalAgentItem[] = [
  {
    id: 1,
    key: 'claude',
    title: 'Claude',
    date: 'Harness · CLI',
    content:
      'Ejecuta tu harness (AGENTS.md + SKILL.md) con mínimo consumo de tokens; si se acaban tus créditos, el progreso queda listo para otro agente.',
    category: 'Agente CLI',
    iconSrc: claudeIcon,
    pixelArt: true,
    relatedIds: [2, 5],
    status: 'completed',
    energy: 98,
  },
  {
    id: 2,
    key: 'gemini',
    title: 'Gemini',
    date: 'Relevo · Multimodal',
    content:
      'Retoma tu proyecto desde el mismo harness sin perder contexto, analiza capturas de referencia y traduce documentación al español.',
    category: 'Agente Multimodal',
    iconSrc: geminiIcon,
    relatedIds: [1, 3],
    status: 'completed',
    energy: 96,
  },
  {
    id: 3,
    key: 'chatgpt',
    title: 'ChatGPT',
    date: 'Diseño · Flujo',
    content:
      'Aplica skills del catálogo comunitario, componentes UI y referencias de diseño con reportes verificables por modelo.',
    category: 'Asistente IA',
    iconSrc: chatgptIcon,
    relatedIds: [2, 4],
    status: 'completed',
    energy: 94,
  },
  {
    id: 4,
    key: 'deepseek',
    title: 'DeepSeek',
    date: 'Código · Ahorro',
    content:
      'Ideal como relevo económico cuando se agotan créditos: lee tu harness y continúa refactorizando código y auditorías sin repetir prompts.',
    category: 'Razonamiento',
    iconSrc: deepseekIcon,
    relatedIds: [3, 5],
    status: 'in-progress',
    energy: 91,
  },
  {
    id: 5,
    key: 'opencode',
    title: 'OpenCode',
    date: 'Terminal · Open',
    content:
      'Conecta el mismo harness portátil y tus directivas de skills.sh desde terminal open source con múltiples proveedores de modelos.',
    category: 'Terminal Open Source',
    iconSrc: opencodeIcon,
    pixelArt: true,
    relatedIds: [1, 4],
    status: 'in-progress',
    energy: 92,
  },
];

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia(REDUCED_MOTION_QUERY).matches;

function statusLabel(status: OrbitalAgentItem['status']): string {
  switch (status) {
    case 'completed':
      return 'Verificado';
    case 'in-progress':
      return 'En integración';
    case 'pending':
      return 'Pendiente';
  }
}

function renderOrbitalAgentIcon(item: OrbitalAgentItem): React.ReactNode {
  const imgClass = `orbital-img${item.pixelArt ? ' orbital-img--pixel' : ''}`;

  if (item.key === 'claude') {
    return (
      <>
        <img src={item.iconSrc} alt="" aria-hidden="true" className={`${imgClass} orb-claude-body`} />
        <img src={item.iconSrc} alt="" aria-hidden="true" className={`${imgClass} orb-claude-leg-1 orb-claude-leg-a`} />
        <img src={item.iconSrc} alt="" aria-hidden="true" className={`${imgClass} orb-claude-leg-2 orb-claude-leg-b`} />
        <img src={item.iconSrc} alt="" aria-hidden="true" className={`${imgClass} orb-claude-leg-3 orb-claude-leg-a`} />
        <img src={item.iconSrc} alt="" aria-hidden="true" className={`${imgClass} orb-claude-leg-4 orb-claude-leg-b`} />
      </>
    );
  }

  if (item.key === 'opencode') {
    return (
      <>
        <span className="orb-opencode-core" aria-hidden="true" />
        <img src={item.iconSrc} alt="" aria-hidden="true" className={imgClass} />
      </>
    );
  }

  return <img src={item.iconSrc} alt="" aria-hidden="true" className={imgClass} />;
}

interface CapabilitiesOrbitalShowcaseProps {
  timelineData?: readonly OrbitalAgentItem[];
}

/**
 * Línea orbital interactiva con los 5 agentes IA alrededor del núcleo Códice Studio.
 * Sustituye el diagrama estático del panel derecho de #capabilities sin dependencias externas.
 */
export const CapabilitiesOrbitalShowcase: React.FC<CapabilitiesOrbitalShowcaseProps> = ({
  timelineData = DEFAULT_ORBITAL_AGENTS,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const orbitRef = useRef<HTMLDivElement | null>(null);
  const nodeRefs = useRef<Record<number, HTMLButtonElement | null>>({});

  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [activeNodeId, setActiveNodeId] = useState<number | null>(null);
  const [userPaused, setUserPaused] = useState<boolean>(false);
  const [smoothJump, setSmoothJump] = useState<boolean>(false);
  const [reduced, setReduced] = useState<boolean>(prefersReducedMotion);
  const [inView, setInView] = useState<boolean>(() => typeof IntersectionObserver === 'undefined');
  const [radius, setRadius] = useState<number>(156);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia(REDUCED_MOTION_QUERY);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    setReduced(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Ajusta el radio orbital al ancho real del panel para evitar cualquier desborde en 390/768/1024/1440 px.
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const updateRadius = () => {
      const rect = node.getBoundingClientRect();
      const minSide = Math.min(rect.width, rect.height || rect.width);
      const next = Math.max(106, Math.min(185, Math.round(minSide * 0.33)));
      setRadius(next);
    };
    updateRadius();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(updateRadius);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  const isAutoRotating = !reduced && !userPaused && activeNodeId === null && inView;
  const animationsRunning = !reduced && !userPaused && inView;

  useEffect(() => {
    if (!isAutoRotating) return;
    const timer = window.setInterval(() => {
      setSmoothJump(false);
      setRotationAngle((prev) => Number(((prev + 0.35) % 360).toFixed(3)));
    }, 50);
    return () => window.clearInterval(timer);
  }, [isAutoRotating]);

  const closeActiveNode = useCallback(() => {
    setActiveNodeId((current) => {
      if (current !== null) {
        const trigger = nodeRefs.current[current];
        if (trigger) window.requestAnimationFrame(() => trigger.focus());
      }
      return null;
    });
  }, []);

  useEffect(() => {
    if (activeNodeId === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeActiveNode();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeNodeId, closeActiveNode]);

  const selectNode = (id: number) => {
    if (activeNodeId === id) {
      setActiveNodeId(null);
      return;
    }
    const idx = timelineData.findIndex((item) => item.id === id);
    if (idx >= 0) {
      const targetAngle = (idx / timelineData.length) * 360;
      setSmoothJump(true);
      setRotationAngle(270 - targetAngle);
    }
    setActiveNodeId(id);
  };

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === containerRef.current || e.target === orbitRef.current) {
      setActiveNodeId(null);
    }
  };

  const activeItem =
    activeNodeId !== null ? timelineData.find((i) => i.id === activeNodeId) ?? null : null;
  const relatedIds = activeItem ? activeItem.relatedIds : [];

  const positions = timelineData.map((_, index) => {
    const angle = ((index / timelineData.length) * 360 + rotationAngle) % 360;
    const radian = (angle * Math.PI) / 180;
    const x = radius * Math.cos(radian);
    const y = radius * Math.sin(radian);
    const zIndex = Math.round(100 + 50 * Math.cos(radian));
    const opacity = Math.max(0.55, Math.min(1, 0.55 + 0.45 * ((1 + Math.sin(radian)) / 2)));
    return { x, y, zIndex, opacity };
  });

  const ringDiameter = radius * 2;
  const innerDiameter = Math.round(radius * 1.18);

  return (
    <div
      ref={containerRef}
      className={`orbital-panel${animationsRunning ? ' orbital-panel--running' : ''}`}
      data-orbital-running={animationsRunning ? 'true' : 'false'}
      role="region"
      aria-label="Órbita interactiva de agentes de IA compatibles con Códice Studio"
      onClick={handleContainerClick}
    >
      <div ref={orbitRef} className="orbital-stage">
        {/* Anillos orbitales concéntricos */}
        <div
          className="orbital-ring"
          aria-hidden="true"
          style={{ width: `${ringDiameter}px`, height: `${ringDiameter}px` }}
        />
        <div
          className="orbital-ring orbital-ring--inner"
          aria-hidden="true"
          style={{ width: `${innerDiameter}px`, height: `${innerDiameter}px` }}
        />

        {/* Conexiones radiales desde el núcleo hacia cada nodo */}
        <svg className="orbital-spokes" viewBox="-260 -260 520 520" aria-hidden="true">
          {timelineData.map((item, idx) => {
            const pos = positions[idx];
            const isHighlighted = item.id === activeNodeId || relatedIds.includes(item.id);
            return (
              <line
                key={item.id}
                x1={0}
                y1={0}
                x2={pos.x}
                y2={pos.y}
                stroke={isHighlighted ? '#0ea5e9' : 'rgba(148, 163, 184, 0.22)'}
                strokeOpacity={isHighlighted ? 0.65 : 0.45}
                strokeWidth={isHighlighted ? 1.6 : 1}
              />
            );
          })}
        </svg>

        {/* Núcleo central Códice Studio */}
        <div className="orbital-core" aria-hidden="true">
          <span className="orbital-core__ring orbital-core__ring--1" />
          <span className="orbital-core__ring orbital-core__ring--2" />
          <Layers className="w-5 h-5 text-[#0ea5e9]" />
          <span className="orbital-core__label">Códice</span>
        </div>

        {/* Nodos orbitales de agentes IA */}
        {timelineData.map((item, idx) => {
          const pos = positions[idx];
          const isExpanded = item.id === activeNodeId;
          const isRelated = relatedIds.includes(item.id);
          const energySize = Math.round(item.energy * 0.45 + 42);

          return (
            <div
              key={item.id}
              className={`orbital-node-wrap${smoothJump ? ' orbital-node-wrap--smooth' : ''}`}
              style={{
                transform: `translate(${pos.x.toFixed(2)}px, ${pos.y.toFixed(2)}px)`,
                zIndex: isExpanded ? 220 : pos.zIndex,
                opacity: isExpanded ? 1 : pos.opacity,
              }}
            >
              <span
                className={`orbital-energy${isRelated ? ' orbital-energy--pulse' : ''}`}
                aria-hidden="true"
                style={{ width: `${energySize}px`, height: `${energySize}px` }}
              />
              <button
                ref={(el) => {
                  nodeRefs.current[item.id] = el;
                }}
                type="button"
                className={`orbital-node${isExpanded ? ' orbital-node--expanded' : ''}${
                  isRelated ? ' orbital-node--related' : ''
                }`}
                aria-expanded={isExpanded}
                aria-label={`${item.title} (${statusLabel(item.status)}): ver integración con Códice Studio`}
                onClick={(e) => {
                  e.stopPropagation();
                  selectNode(item.id);
                }}
              >
                <span className={`orbital-icon orbital-icon--${item.key}`} aria-hidden="true">
                  {renderOrbitalAgentIcon(item)}
                </span>
              </button>
              <span
                className={`orbital-node__title${isExpanded ? ' orbital-node__title--expanded' : ''}`}
                aria-hidden="true"
              >
                {item.title}
              </span>
            </div>
          );
        })}

        {/* Tarjeta detallada del nodo expandido */}
        {activeItem && (
          <div
            className="orbital-card"
            role="dialog"
            aria-label={`Detalle de ${activeItem.title}`}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="orbital-card__connector" aria-hidden="true" />
            <div className="orbital-card__head">
              <span className={`orbital-badge orbital-badge--${activeItem.status}`}>
                {statusLabel(activeItem.status)}
              </span>
              <span className="orbital-card__date">{activeItem.date}</span>
            </div>

            <div className="orbital-card__title-row">
              <h3 className="orbital-card__title">{activeItem.title}</h3>
              <button
                type="button"
                className="orbital-card__close"
                aria-label={`Cerrar detalle de ${activeItem.title}`}
                onClick={closeActiveNode}
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>

            <p className="orbital-card__body">{activeItem.content}</p>

            <div className="orbital-card__meter">
              <div className="orbital-card__meter-row">
                <span className="orbital-card__meter-label">
                  <Zap className="w-3 h-3 text-[#0ea5e9]" aria-hidden="true" />
                  <span>Nivel de integración</span>
                </span>
                <span className="orbital-card__meter-val">{activeItem.energy}%</span>
              </div>
              <div className="orbital-card__bar" aria-hidden="true">
                <div
                  className="orbital-card__bar-fill"
                  style={{ width: `${activeItem.energy}%` }}
                />
              </div>
            </div>

            {activeItem.relatedIds.length > 0 && (
              <div className="orbital-card__related">
                <div className="orbital-card__related-head">
                  <Link2 className="w-3 h-3" aria-hidden="true" />
                  <span>Nodos conectados</span>
                </div>
                <div className="orbital-card__related-list">
                  {activeItem.relatedIds.map((relId) => {
                    const rel = timelineData.find((i) => i.id === relId);
                    if (!rel) return null;
                    return (
                      <button
                        key={relId}
                        type="button"
                        className="orbital-rel-btn"
                        onClick={() => selectNode(relId)}
                      >
                        <span>{rel.title}</span>
                        <ArrowRight className="w-3 h-3 text-[#0ea5e9]" aria-hidden="true" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <span className="orbital-hint" aria-hidden="true">
        {activeItem ? 'Esc o clic fuera para reanudar' : 'Haz clic en un nodo'}
      </span>

      {!reduced && (
        <button
          type="button"
          className="orbital-pause"
          aria-pressed={userPaused}
          aria-label={userPaused ? 'Reanudar órbita' : 'Pausar órbita'}
          onClick={(e) => {
            e.stopPropagation();
            setUserPaused((p) => !p);
          }}
        >
          {userPaused ? (
            <Play className="w-3.5 h-3.5" aria-hidden="true" />
          ) : (
            <Pause className="w-3.5 h-3.5" aria-hidden="true" />
          )}
        </button>
      )}

      <div className="sr-only-live" aria-live="polite">
        {activeItem ? `${activeItem.title}: ${activeItem.content}` : ''}
      </div>
    </div>
  );
};

export default CapabilitiesOrbitalShowcase;
