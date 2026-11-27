import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import catalogoUrl from '../../assets/guide/catalogo.webp';
import { GUIDE_CAPTURE } from '../../data/guideShowcaseHotspots';
import { GUIDE_COPY, GUIDE_STEP_TEXT, guideTooltipText } from '../../data/guideShowcaseCopy';
import type { GuideHotspot, GuideMode, GuideStep } from '../../types/guideShowcase';

/**
 * Marco de navegador 16:9 con la captura real del Catálogo y su capa de guía (foco, marcadores y tooltip).
 * Es el medio que hoy recibe `GuideMediaSlot` (spec 005, C3/C4/C9).
 */
export interface GuideCaptureFrameProps {
  mode: GuideMode;
  reduced: boolean;
  step: GuideStep;
  paused: boolean;
  /** El ratón (solo `pointerType === 'mouse'`) entra o sale del marco. */
  onHoverChange: (hovering: boolean) => void;
  /** El foco entra en el marco o sale de él. */
  onFocusChange: (focused: boolean) => void;
}

const TIP_GAP = 10;
const TIP_EDGE = 8;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), Math.max(min, max));

export const GuideCaptureFrame: React.FC<GuideCaptureFrameProps> = ({
  mode,
  reduced,
  step,
  paused,
  onHoverChange,
  onFocusChange,
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  const [tipPos, setTipPos] = useState<{ left: number; top: number } | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const tipRef = useRef<HTMLDivElement | null>(null);
  // El tooltip solo anima su posición entre pasos, nunca al aparecer (evita que «vuele» desde la esquina).
  const tipPlacedRef = useRef(false);

  const guided = mode === 'con-guia';
  const showTip = guided && !reduced;
  const hotspot: GuideHotspot = GUIDE_CAPTURE.hotspots[step - 1];
  const { width: capW, height: capH } = GUIDE_CAPTURE;

  // Posición del tooltip: arriba o abajo del foco según el espacio, siempre dentro del marco.
  const placeTooltip = useCallback(() => {
    const stage = stageRef.current;
    const tip = tipRef.current;
    if (!stage || !tip) return;
    const W = stage.clientWidth;
    const H = stage.clientHeight;
    const w = tip.offsetWidth;
    const h = tip.offsetHeight;
    const { x, y, h: bh } = hotspot.box;
    const boxLeft = (x / 100) * W;
    const boxTop = (y / 100) * H;
    const boxBottom = ((y + bh) / 100) * H;

    const left = clamp(boxLeft, TIP_EDGE, W - w - TIP_EDGE);
    const spaceBelow = H - boxBottom - TIP_GAP - TIP_EDGE;
    const spaceAbove = boxTop - TIP_GAP - TIP_EDGE;
    const below = boxBottom + TIP_GAP;
    const above = boxTop - TIP_GAP - h;
    let top: number;
    if (spaceBelow >= h) top = below;
    else if (spaceAbove >= h) top = above;
    else top = spaceBelow >= spaceAbove ? below : above;
    top = clamp(top, TIP_EDGE, H - h - TIP_EDGE);

    setTipPos((prev) =>
      prev && Math.abs(prev.left - left) < 0.5 && Math.abs(prev.top - top) < 0.5
        ? prev
        : { left, top }
    );
  }, [hotspot]);

  useEffect(() => {
    tipPlacedRef.current = tipPos !== null;
  }, [tipPos]);

  useLayoutEffect(() => {
    if (!showTip) {
      setTipPos(null);
      return;
    }
    placeTooltip();
    const stage = stageRef.current;
    if (!stage || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => placeTooltip());
    observer.observe(stage);
    return () => observer.disconnect();
  }, [showTip, placeTooltip]);

  // Solo el ratón pausa al pasar por encima: en táctil, pointerenter quedaría «pegado» tras un toque.
  const onPointerEnter = (event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'mouse') onHoverChange(true);
  };
  const onPointerLeave = (event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'mouse') onHoverChange(false);
  };
  const onBlur = (event: React.FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) onFocusChange(false);
  };

  const visibleSpots: readonly GuideHotspot[] = !guided
    ? []
    : reduced
      ? GUIDE_CAPTURE.hotspots
      : [hotspot];

  return (
    <figure
      data-testid="guia-marco"
      data-paused={paused ? 'true' : 'false'}
      tabIndex={guided && !reduced ? 0 : undefined}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onFocus={() => onFocusChange(true)}
      onBlur={onBlur}
      className="m-0 overflow-hidden rounded-xl border border-white/10 bg-[var(--p-bg)] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.85)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]"
    >
      <div className="flex items-center gap-3 border-b border-white/10 bg-[var(--p-surface)] px-3.5 py-2.5">
        <span className="flex gap-1.5" aria-hidden="true">
          <i className="block h-2.5 w-2.5 rounded-full bg-[#475569]" />
          <i className="block h-2.5 w-2.5 rounded-full bg-[#475569]" />
          <i className="block h-2.5 w-2.5 rounded-full bg-[#475569]" />
        </span>
        <span
          aria-hidden="true"
          className="min-w-0 flex-1 truncate rounded-md bg-[var(--p-bg)] px-3 py-1 text-center font-mono text-[11px] text-[#9aa0a8]"
        >
          {GUIDE_COPY.frameUrl}
        </span>
      </div>

      <div
        ref={stageRef}
        className="relative overflow-hidden bg-[var(--p-surface)]"
        style={{ aspectRatio: `${capW} / ${capH}` }}
      >
        <img
          src={catalogoUrl}
          alt={GUIDE_COPY.imageAlt}
          width={capW}
          height={capH}
          draggable={false}
          onError={() => setImageFailed(true)}
          className={`absolute inset-0 w-full select-none object-cover transition-[filter,opacity] duration-500 ease-out ${
            imageFailed ? 'opacity-0' : ''
          }`}
          style={{
            height: '100%',
            filter: guided ? 'none' : 'grayscale(1) brightness(0.55)',
          }}
        />

        {imageFailed && (
          <div
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center bg-[var(--p-surface)] p-6 text-center text-sm text-[#9aa0a8]"
          >
            {GUIDE_COPY.imageAlt}
          </div>
        )}

        {/* Foco y marcadores: decorativos */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          {visibleSpots.map((spot) => (
            <div
              key={reduced ? spot.id : 'foco'}
              data-testid="guia-foco"
              className={`absolute rounded-md border-2 border-[#0ea5e9] ${
                reduced ? '' : 'transition-[left,top,width,height] duration-500 ease-out'
              }`}
              style={{
                left: `${spot.box.x}%`,
                top: `${spot.box.y}%`,
                width: `${spot.box.w}%`,
                height: `${spot.box.h}%`,
                boxShadow: reduced
                  ? '0 0 0 3px rgba(14,165,233,0.25)'
                  : '0 0 0 3px rgba(14,165,233,0.25), 0 0 0 9999px rgba(10,13,20,0.62)',
              }}
            >
              <span
                data-testid="guia-paso"
                data-step={spot.step}
                className="absolute -left-2.5 -top-2.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#0a0d14] bg-[#0ea5e9] text-xs font-bold text-[#0a0d14]"
              >
                {spot.step}
              </span>
            </div>
          ))}
        </div>

        {showTip && (
          <div
            ref={tipRef}
            data-testid="guia-tooltip"
            className={`guia-tooltip absolute z-10 rounded-lg border border-[#0ea5e9] bg-[var(--p-surface)] px-3 py-2 text-xs leading-snug text-[#f1f5f9] shadow-[0_12px_30px_-12px_rgba(0,0,0,0.9)] sm:text-[13px] ${
              tipPlacedRef.current ? 'transition-[left,top] duration-500 ease-out' : ''
            }`}
            style={{
              width: 'min(17rem, calc(100% - 1rem))',
              left: tipPos?.left ?? 0,
              top: tipPos?.top ?? 0,
              visibility: tipPos ? 'visible' : 'hidden',
            }}
          >
            {guideTooltipText(step, GUIDE_STEP_TEXT[hotspot.id])}
          </div>
        )}
      </div>
    </figure>
  );
};
