/**
 * Contrato de la sección «Guía vs. sin guía» de la portada (spec 005).
 *
 * Lo consumen `GuideContrastShowcase.tsx` (vista) y lo produce
 * `scripts/capture-guide-showcase.mjs` (captura + hotspots generados).
 * La ampliación C8–C12 (rediseño en espejo) añade los props de `GuideMediaSlot` y `GuideModePanel`.
 */
import type { ReactNode } from 'react';

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

/** Paso de la guía (1 → 2 → 3 → 1). */
export type GuideStep = 1 | 2 | 3;

/**
 * Estado de una fila de la tarjeta de barras (C11):
 * - `atascada`: modo «Sin guía» (barra vacía, «?»).
 * - `pendiente` / `activa` / `completa`: modo «Con guía», según el paso activo.
 */
export type GuideRowState = 'atascada' | 'pendiente' | 'activa' | 'completa';

/** Escenario: círculo, halo, anillo punteado y píldora de estado alrededor del medio (C9, C10). */
export interface GuideMediaSlotProps {
  mode: GuideMode;
  reduced: boolean;
  /** Paso activo (solo relevante en «Con guía» sin movimiento reducido). */
  step: GuideStep;
  /** Medio centrado sobre el círculo: hoy, `<GuideCaptureFrame>`; en el futuro, un video por modo. */
  children: ReactNode;
}

/** Bloque de texto del modo + tarjeta de barras con pausa y CTA (C8, C11). */
export interface GuideModePanelProps {
  mode: GuideMode;
  reduced: boolean;
  step: GuideStep;
  /** La guía está pausada por cualquier causa (congela la barra activa). */
  paused: boolean;
  /** Pausa manual (estado del botón, `aria-pressed`). */
  userPaused: boolean;
  /** Milisegundos ya transcurridos del paso activo (para `--guia-delay` si la barra se vuelve a montar). */
  elapsedMs: number;
  /** Cambia cada vez que un paso arranca de cero (clave para reiniciar la animación de la barra). */
  cycleKey: number;
  onTogglePause: () => void;
  onOpenCatalog: () => void;
}
