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

/**
 * Bloque de texto del modo + tarjeta de barras (spec 005, C8, C11, C12).
 * - «Sin guía»: 3 obstáculos con barras «atascadas».
 * - «Con guía»: 3 pasos; la barra del paso activo se llena durante `GUIDE_STEP_INTERVAL_MS` (cronómetro visible
 *   del avance automático) y se congela al pausar.
 *
 * ESQUELETO DE LA FASE 0: cumple el contrato de DOM; el diseño visual lo completa wt2.
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
      <span className="guia-panel__etiqueta">{GUIDE_COPY.modes[mode]}</span>
      <h3 className="guia-panel__titulo">{GUIDE_COPY.listLabels[mode]}</h3>
      <p className="guia-panel__descripcion">{GUIDE_COPY.captions[mode]}</p>

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
                className="guia-fila"
              >
                <div className="guia-fila__cabecera">
                  <span className="guia-fila__texto">{label}</span>
                  <span className="guia-fila__icono" aria-hidden="true">
                    {state === 'atascada' && <CircleHelp size={16} />}
                    {state === 'completa' && <Check size={16} />}
                  </span>
                </div>
                <span data-testid="guia-barra" aria-hidden="true" className="guia-barra">
                  <BarFill
                    key={state === 'activa' ? `activa-${cycleKey}` : state}
                    initialElapsedMs={state === 'activa' ? elapsedMs : 0}
                    paused={paused}
                  />
                </span>
                {detail && <span className="guia-fila__detalle">{detail}</span>}
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
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};
