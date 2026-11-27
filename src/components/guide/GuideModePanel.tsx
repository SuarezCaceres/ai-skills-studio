import React, { useState } from 'react';
import { Check, ChevronRight, CircleHelp, Pause, Play } from 'lucide-react';
import { GUIDE_CAPTURE } from '../../data/guideShowcaseHotspots';
import { GUIDE_COPY, GUIDE_LISTS, GUIDE_STEP_LABELS } from '../../data/guideShowcaseCopy';
import { GUIDE_STEP_INTERVAL_MS } from '../../types/guideShowcase';
import type { GuideModePanelProps, GuideRowState } from '../../types/guideShowcase';
import './guideCard.css';

/**
 * Relleno de una barra. El desfase (`--guia-delay`) se fija SOLO al montar: cambiarlo con la animación en marcha
 * la haría saltar. Mientras está montada, la pausa se hace con `animation-play-state` y el reinicio de cada paso
 * con una `key` nueva (`cycleKey`).
 */
const BarFill: React.FC<{ initialElapsedMs: number; paused: boolean }> = ({ initialElapsedMs, paused }) => {
  const [delayMs] = useState(initialElapsedMs);
  return (
    <span
      className="guia-barra__relleno"
      style={
        {
          '--guia-dur': `${GUIDE_STEP_INTERVAL_MS}ms`,
          '--guia-delay': `-${delayMs}ms`,
          animationPlayState: paused ? 'paused' : 'running',
        } as React.CSSProperties
      }
    />
  );
};

/** Marca de estado a la derecha de cada fila: «?» atascada, aro pendiente, aro con punto activa y ✓ completa. */
const RowMark: React.FC<{ state: GuideRowState }> = ({ state }) => (
  <span className={`guia-fila__marca guia-fila__marca--${state}`} aria-hidden="true">
    {state === 'atascada' && <CircleHelp size={18} strokeWidth={2} />}
    {state === 'completa' && <Check size={13} strokeWidth={3} />}
  </span>
);

/**
 * Bloque de texto del modo + tarjeta de barras (spec 005, C8, C11, C12).
 * - «Sin guía»: 3 obstáculos con barras «atascadas» (gris, casi vacías, sobre un carril discontinuo).
 * - «Con guía»: 3 pasos; la barra del paso activo se llena durante `GUIDE_STEP_INTERVAL_MS` (cronómetro visible
 *   del avance automático) y se congela al pausar. Las completadas quedan llenas con ✓; las pendientes, vacías.
 */
export const GuideModePanel: React.FC<GuideModePanelProps> = ({
  mode,
  reduced,
  step,
  paused,
  userPaused,
  elapsedMs,
  cycleKey,
  onTogglePause,
  onOpenCatalog,
}) => {
  const guided = mode === 'con-guia';

  const rowState = (index: number): GuideRowState => {
    if (!guided) return 'atascada';
    if (reduced) return 'completa';
    const rowStep = index + 1;
    if (rowStep < step) return 'completa';
    if (rowStep === step) return 'activa';
    return 'pendiente';
  };

  return (
    <div data-testid="guia-panel" data-mode={mode} className="guia-panel">
      <div className="guia-panel__texto">
        <span className="guia-panel__etiqueta">
          <span className="guia-panel__punto" aria-hidden="true" />
          {GUIDE_COPY.modes[mode]}
        </span>
        <h3 className="guia-panel__titulo">{GUIDE_COPY.listLabels[mode]}</h3>
        <p className="guia-panel__descripcion">{GUIDE_COPY.captions[mode]}</p>
      </div>

      <div data-testid="guia-tarjeta" className="guia-tarjeta">
        <ul data-testid="guia-lista" aria-label={GUIDE_COPY.listLabels[mode]} className="guia-tarjeta__lista">
          {[0, 1, 2].map((index) => {
            const state = rowState(index);
            const label = guided
              ? GUIDE_STEP_LABELS[GUIDE_CAPTURE.hotspots[index].id]
              : GUIDE_LISTS['sin-guia'][index];
            const detail = guided ? GUIDE_LISTS['con-guia'][index] : null;
            return (
              <li
                key={`${mode}-${index}`}
                data-testid="guia-fila"
                data-estado={state}
                aria-current={state === 'activa' ? 'step' : undefined}
                className="guia-fila"
                style={{ '--guia-orden': index } as React.CSSProperties}
              >
                <div className="guia-fila__cabecera">
                  <span className="guia-fila__texto">{label}</span>
                  <RowMark state={state} />
                </div>
                {detail && <span className="guia-fila__detalle">{detail}</span>}
                <span data-testid="guia-barra" aria-hidden="true" className="guia-barra">
                  <BarFill
                    // Se vuelve a montar al empezar cada paso (cycleKey) y en cada pausa (elapsedMs, medido por el reloj
                    // de JS): así el desfase siempre sale del reloj, aunque el navegador no recalcule estilos con la
                    // pestaña oculta y la animación CSS haya seguido corriendo.
                    key={state === 'activa' ? `activa-${cycleKey}-${elapsedMs}` : state}
                    initialElapsedMs={state === 'activa' ? elapsedMs : 0}
                    paused={paused}
                  />
                </span>
              </li>
            );
          })}
        </ul>

        <div className="guia-tarjeta__acciones">
          {/* WCAG 2.2.2: el avance automático se puede pausar sin depender del ratón. */}
          {guided && !reduced && (
            <button
              type="button"
              data-testid="guia-pausa"
              aria-pressed={userPaused}
              onClick={onTogglePause}
              className="guia-tarjeta__pausa"
            >
              {userPaused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
              {userPaused ? GUIDE_COPY.resumeGuide : GUIDE_COPY.pauseGuide}
            </button>
          )}
          <button type="button" onClick={onOpenCatalog} className="guia-tarjeta__cta">
            {GUIDE_COPY.cta}
            <ChevronRight size={16} aria-hidden="true" className="guia-tarjeta__flecha" />
          </button>
        </div>
      </div>
    </div>
  );
};
