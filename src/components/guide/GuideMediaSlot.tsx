import React from 'react';
import { GUIDE_COPY, guideStatusText } from '../../data/guideShowcaseCopy';
import type { GuideMediaSlotProps } from '../../types/guideShowcase';
import './guideStage.css';

/**
 * Escenario de la sección «Guía vs. sin guía» (spec 005, C9, C10, C12).
 * Composición de showcase de producto: el medio (`children`, hoy la captura del Catálogo; en el futuro, un video
 * por modo) va centrado sobre un círculo con un anillo punteado que asoma por arriba y por abajo, y la píldora de
 * estado se apoya en el borde inferior del círculo.
 *
 * - «Sin guía»: anillo gris pizarra quieto y abierto (un hueco, como una carga atascada), sin halo y punto gris quieto.
 * - «Con guía»: anillo cian cerrado que gira despacio, halo radial cian (opacidad ≤ 0,15) y punto cian que late.
 * Todo lo decorativo es `aria-hidden`; `guideStage.css` anula el movimiento con movimiento reducido.
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
      <div className="guia-escenario__plato">
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
          <span data-testid="guia-estado-punto" className="guia-escenario__punto" aria-hidden="true" />
          {status}
        </p>
      </div>
    </div>
  );
};
