/**
 * Contrato de la sección «Guía vs. sin guía» de la portada (spec 005).
 *
 * Lo consumen `GuideContrastShowcase.tsx` (vista) y lo produce
 * `scripts/capture-guide-showcase.mjs` (captura + hotspots generados).
 */

/** Modo activo del selector de la sección. */
export type GuideMode = 'sin-guia' | 'con-guia';

/** Pasos de la guía sobre la captura del Catálogo, en orden. */
export type GuideStepId = 'buscar' | 'filtrar' | 'abrir';

/** Caja en porcentajes (0–100) relativa a la captura completa. */
export interface GuideBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface GuideHotspot {
  id: GuideStepId;
  step: 1 | 2 | 3;
  box: GuideBox;
}

export interface GuideCaptureMeta {
  /** Tamaño real en px de la captura (para `aspect-ratio`). */
  width: number;
  height: number;
  hotspots: readonly [GuideHotspot, GuideHotspot, GuideHotspot];
}

/** Intervalo de avance automático de la guía, en milisegundos. */
export const GUIDE_STEP_INTERVAL_MS = 3500;
