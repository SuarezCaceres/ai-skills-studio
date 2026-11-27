import React from 'react';
import { GUIDE_COPY, guideStatusText } from '../../data/guideShowcaseCopy';
import type { GuideMediaSlotProps } from '../../types/guideShowcase';
import './guideStage.css';

/**
 * Escenario de la sección «Guía vs. sin guía» (spec 005, C9, C10, C12).
 * Pinta el círculo, el halo (solo «Con guía»), el anillo punteado y la píldora de estado alrededor del medio,
 * que llega como `children` (hoy la captura del Catálogo; en el futuro, un video por modo).
 *
 * ESQUELETO DE LA FASE 0: cumple el contrato de DOM; el diseño visual lo completa wt1.
 */
export const GuideMediaSlot: React.FC<GuideMediaSlotProps> = ({ mode, reduced, step, children }) => {
  const guided = mode === 'con-guia';
  const status = !guided
    ? GUIDE_COPY.status.blind
    : reduced
      ? GUIDE_COPY.status.reduced
      : guideStatusText(step);

  return (
    <div data-testid="guia-escenario" data-mode={mode} className="guia-escenario">
      <div className="guia-escenario__orbita" aria-hidden="true">
        {guided && <span data-testid="guia-halo" className="guia-escenario__halo" />}
        <span className="guia-escenario__circulo" />
        <span
          data-testid="guia-anillo"
          data-girando={guided && !reduced ? 'true' : 'false'}
          className="guia-escenario__anillo"
        />
      </div>

      <div className="guia-escenario__medio">{children}</div>

      <p data-testid="guia-estado" className="guia-escenario__estado">
        <span className="guia-escenario__punto" aria-hidden="true" />
        {status}
      </p>
    </div>
  );
};
