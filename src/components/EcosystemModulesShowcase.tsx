import React, { useRef, useState } from 'react';
import skillsEquipoShot from '../assets/ecosystem/skills-equipo.webp';
import catalogoShot from '../assets/ecosystem/catalogo.webp';
import explorarShot from '../assets/ecosystem/explorar.webp';
import componentesShot from '../assets/ecosystem/componentes.webp';
import codiceShot from '../assets/ecosystem/codice.webp';
import './ecosystemModules.css';

interface EcosystemModuleItem {
  id: string;
  number: string;
  title: string;
  routeLabel: string;
  shortMeta: string;
  description: string;
  chips: readonly string[];
  image: string;
  alt: string;
}

const ECOSYSTEM_MODULES: readonly EcosystemModuleItem[] = [
  {
    id: 'skills-equipo',
    number: '01',
    title: 'Skills del equipo',
    routeLabel: 'skills',
    shortMeta: 'Equipos, skills propias y harness compartido',
    description:
      'Arma secciones de trabajo para tu equipo, sube tus propias directivas SKILL.md desde GitHub y comparte tu harness portátil para ahorrar tokens y trabajar coordinados en proyectos web o móviles.',
    chips: ['Equipos en GitHub', 'Tus propias skills', 'Harness · commitSha'],
    image: skillsEquipoShot,
    alt: 'Vista interna de Skills del equipo con sesión iniciada en Códice Studio, mostrando filtros por integrante y directivas del equipo.',
  },
  {
    id: 'catalogo-comunitario',
    number: '02',
    title: 'Catálogo comunitario',
    routeLabel: 'catalogo',
    shortMeta: 'Skills, referencias y veredictos por modelo',
    description:
      'Explora skills, efectos y páginas de referencia hechas con IA por la comunidad, con votos reales, auditoría AuditBadge y reportes de qué modelo (Claude, Gemini, DeepSeek) rindió mejor.',
    chips: ['Páginas de referencia', 'AuditBadge · Votos', 'Veredictos por IA'],
    image: catalogoShot,
    alt: 'Vista interna del Catálogo comunitario autenticado en Códice Studio con tarjetas de skills, buscador y filtros por categoría.',
  },
  {
    id: 'explorar-skills-sh',
    number: '03',
    title: 'Explorar skills.sh',
    routeLabel: 'explorar',
    shortMeta: 'Directorio abierto e importación segura',
    description:
      'Conecta el directorio abierto de skills.sh, inspecciona cualquier repositorio de GitHub en solo lectura (≤ 512 KB), tradúcelo al español e impórtalo a tu equipo o a tus clases en un clic.',
    chips: ['Directorio skills.sh', 'Lectura inerte ≤ 512 KB', 'Importar en 1 clic'],
    image: explorarShot,
    alt: 'Vista interna del módulo Explorar skills.sh autenticado en Códice Studio con botones de inspección e importación al catálogo.',
  },
  {
    id: 'componentes-ui',
    number: '04',
    title: 'Componentes UI',
    routeLabel: 'componentes',
    shortMeta: 'Piezas accesibles y efectos listos para copiar',
    description:
      'Revisa componentes UI accesibles y efectos visuales usados en las clases con demostración en vivo, navegación por teclado y código real listo para aplicar en páginas web y aplicaciones.',
    chips: ['20 piezas + efectos', 'Demo en vivo', 'Código real A11y'],
    image: componentesShot,
    alt: 'Vista interna del catálogo de Componentes UI en Códice Studio con selector lateral y demostración interactiva.',
  },
  {
    id: 'codice-clases',
    number: '05',
    title: 'Códice de clases',
    routeLabel: 'codice',
    shortMeta: 'Videos con menú desplegable de materiales',
    description:
      'Aprende o publica clases en video (tuyas, de tu equipo o de la comunidad) con su kit desplegable listo: componentes, efectos, skills, modelo de IA, nivel, referencias y proyectos hechos enlazados.',
    chips: ['Video + kit desplegable', 'Equipos y comunidad', 'Harness y Obsidian'],
    image: codiceShot,
    alt: 'Vista interna del módulo Códice de clases en Códice Studio con pestañas de clases propias y comunidad.',
  },
];

/**
 * Sección interactiva #benchmarks (Ecosistema) en chunk diferido:
 * - Izquierda: Tab Switcher numerado (01–05) con expansión suave al hacer clic o con teclado.
 * - Derecha: vista previa real del módulo autenticado en Códice Studio.
 */
export const EcosystemModulesShowcase: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const active = ECOSYSTEM_MODULES[activeIndex];

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const { key } = event;
    let next: number | null = null;
    if (key === 'ArrowDown') next = (activeIndex + 1) % ECOSYSTEM_MODULES.length;
    else if (key === 'ArrowUp') next = (activeIndex - 1 + ECOSYSTEM_MODULES.length) % ECOSYSTEM_MODULES.length;
    else if (key === 'Home') next = 0;
    else if (key === 'End') next = ECOSYSTEM_MODULES.length - 1;
    if (next === null) return;
    event.preventDefault();
    setActiveIndex(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="eco-grid">
      <div className="eco-left">
        <div className="eco-header">
          <p className="ld-eyebrow">
            <span aria-hidden="true" className="ld-eyebrow__bar" />
            <span>Ecosistema integrado · 5 módulos</span>
          </p>
          <h2 id="benchmarks-h" className="ld-heading">
            <span className="ld-heading__mask">
              <span className="ld-heading__line">Cinco módulos conectados</span>
            </span>
            <span className="ld-heading__mask">
              <span className="ld-heading__line ld-accent">para crear con IA</span>
            </span>
          </h2>
          <p className="eco-intro">
            Pulsa cada módulo para ver cómo reúne clases con video, kit desplegable, efectos,
            páginas de referencia y tu harness multi-agente al iniciar sesión.
          </p>
        </div>

        <div
          className="eco-list"
          role="tablist"
          aria-label="Módulos del ecosistema de Códice Studio"
          aria-orientation="vertical"
          onKeyDown={handleKeyDown}
        >
          {ECOSYSTEM_MODULES.map((item, idx) => {
            const isSelected = idx === activeIndex;
            return (
              <div
                key={item.id}
                className={`eco-item${isSelected ? ' eco-item--active' : ''}`}
              >
                <button
                  ref={(node) => {
                    tabRefs.current[idx] = node;
                  }}
                  id={`eco-tab-${item.id}`}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  aria-expanded={isSelected}
                  aria-controls={`eco-panel-${item.id}`}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => setActiveIndex(idx)}
                  className="eco-trigger"
                >
                  <span className="eco-num">{item.number}</span>
                  <span className="eco-title">{item.title}</span>
                  <span className="eco-plus" aria-hidden="true" />
                </button>

                <div
                  id={`eco-panel-${item.id}`}
                  role="region"
                  aria-labelledby={`eco-tab-${item.id}`}
                  className="eco-body-wrap"
                >
                  <div className="eco-body-inner">
                    <p className="eco-desc">{item.description}</p>
                    <div className="eco-chips">
                      {item.chips.map((chip) => (
                        <span key={chip} className="eco-chip">
                          {chip}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        className="eco-right"
        role="tabpanel"
        aria-labelledby={`eco-tab-${active.id}`}
      >
        <div className="eco-preview-frame">
          <div className="eco-preview-bar" aria-hidden="true">
            <div className="eco-preview-bar__left">
              <span className="eco-preview-dots">
                <i />
                <i />
                <i />
              </span>
              <span className="eco-preview-route">
                codice-studio <b>/</b> {active.routeLabel}
              </span>
            </div>
            <span className="eco-preview-badge">
              <i />
              Sesión GitHub
            </span>
          </div>

          <div className="eco-preview-viewport">
            {ECOSYSTEM_MODULES.map((item, idx) => {
              const isSelected = idx === activeIndex;
              return (
                <div
                  key={item.id}
                  aria-hidden={!isSelected}
                  className={`eco-preview-slide${isSelected ? ' eco-preview-slide--active' : ''}`}
                >
                  <img
                    src={item.image}
                    alt={item.alt}
                    width={1280}
                    height={800}
                    loading="lazy"
                    decoding="async"
                    className="eco-preview-img"
                  />
                </div>
              );
            })}

            <div className="eco-preview-pill">
              <span className="eco-preview-pill__num">{active.number}</span>
              <span>{active.title}</span>
              <span className="eco-preview-pill__meta">· {active.shortMeta}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EcosystemModulesShowcase;
