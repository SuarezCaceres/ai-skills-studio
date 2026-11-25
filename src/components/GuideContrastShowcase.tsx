import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  CircleHelp,
  Compass,
  Crosshair,
  ListChecks,
  MousePointerClick,
  Route,
  Shuffle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import catalogoUrl from '../assets/guide/catalogo.webp';
import { GUIDE_CAPTURE } from '../data/guideShowcaseHotspots';
import {
  GUIDE_COPY,
  GUIDE_LISTS,
  GUIDE_STEP_TEXT,
  guideAnnouncementText,
  guideTooltipText,
} from '../data/guideShowcaseCopy';
import {
  GUIDE_STEP_INTERVAL_MS,
  type GuideHotspot,
  type GuideMode,
} from '../types/guideShowcase';
import type { AppPageRoute } from '../types/workspace';

interface GuideContrastShowcaseProps {
  onNavigatePage: (page: AppPageRoute) => void;
}

type StepNumber = 1 | 2 | 3;

const MODES: readonly GuideMode[] = ['sin-guia', 'con-guia'];

const LIST_ICONS: Record<GuideMode, readonly [LucideIcon, LucideIcon, LucideIcon]> = {
  'sin-guia': [CircleHelp, MousePointerClick, Shuffle],
  'con-guia': [Route, Crosshair, ListChecks],
};

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const TIP_GAP = 10;
const TIP_EDGE = 8;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), Math.max(min, max));

const nextStep = (step: StepNumber): StepNumber => ((step % 3) + 1) as StepNumber;

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia(REDUCED_MOTION_QUERY).matches;

export const GuideContrastShowcase: React.FC<GuideContrastShowcaseProps> = ({
  onNavigatePage,
}) => {
  const [mode, setMode] = useState<GuideMode>('sin-guia');
  const [step, setStep] = useState<StepNumber>(1);
  const [reduced, setReduced] = useState<boolean>(prefersReducedMotion);
  const [pageVisible, setPageVisible] = useState<boolean>(
    () => typeof document === 'undefined' || document.visibilityState !== 'hidden'
  );
  const [hoverPaused, setHoverPaused] = useState(false);
  const [focusPaused, setFocusPaused] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [tipPos, setTipPos] = useState<{ left: number; top: number } | null>(null);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const tipRef = useRef<HTMLDivElement | null>(null);
  const radioRefs = useRef<Record<GuideMode, HTMLButtonElement | null>>({
    'sin-guia': null,
    'con-guia': null,
  });

  const guided = mode === 'con-guia';
  const paused = hoverPaused || focusPaused;
  const showTip = guided && !reduced;
  const hotspot: GuideHotspot = GUIDE_CAPTURE.hotspots[step - 1];
  const { width: capW, height: capH } = GUIDE_CAPTURE;

  // prefers-reduced-motion: lectura inicial y cambios en vivo.
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia(REDUCED_MOTION_QUERY);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    setReduced(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  // El avance se detiene con la pestaña oculta.
  useEffect(() => {
    const onVisibility = () => setPageVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // Avance automático 1 → 2 → 3 → 1 (pausable, sin movimiento reducido).
  useEffect(() => {
    if (!guided || reduced || paused || !pageVisible) return;
    const id = window.setInterval(() => setStep(nextStep), GUIDE_STEP_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [guided, reduced, paused, pageVisible]);

  // Anuncio para lectores de pantalla (región aria-live="polite").
  useEffect(() => {
    if (guided) {
      setAnnouncement(
        reduced
          ? GUIDE_COPY.announceStatic
          : guideAnnouncementText(step, GUIDE_STEP_TEXT[hotspot.id])
      );
    } else {
      setAnnouncement((prev) => (prev ? GUIDE_COPY.announceNoGuide : ''));
    }
  }, [guided, reduced, step, hotspot.id]);

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

  const selectMode = useCallback((next: GuideMode) => {
    setMode(next);
    setStep(1);
    setFocusPaused(false);
  }, []);

  const onRadioKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const key = event.key;
    const forward = key === 'ArrowRight' || key === 'ArrowDown';
    const backward = key === 'ArrowLeft' || key === 'ArrowUp';
    if (!forward && !backward) return;
    event.preventDefault();
    const index = MODES.indexOf(mode);
    const target = MODES[(index + (forward ? 1 : -1) + MODES.length) % MODES.length];
    selectMode(target);
    radioRefs.current[target]?.focus();
  };

  const onFrameBlur = (event: React.FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setFocusPaused(false);
    }
  };

  const openCatalog = () => {
    onNavigatePage('catalogo');
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const visibleSpots: readonly GuideHotspot[] = !guided
    ? []
    : reduced
      ? GUIDE_CAPTURE.hotspots
      : [hotspot];

  const listIcons = LIST_ICONS[mode];
  const listItems = GUIDE_LISTS[mode];

  return (
    <section
      id="guia"
      className="section"
      aria-labelledby="guia-h"
      data-mode={mode}
    >
      <div className="wrap">
        <div className="my-auto w-full [display:grid] gap-x-14 gap-y-7 lg:[grid-template-columns:minmax(0,5fr)_minmax(0,7fr)]">
          {/* Cabecera + selector */}
          <div className="flex flex-col gap-5 lg:[grid-column:1] lg:[grid-row:1] lg:self-end">
            <span className="font-mono text-xs uppercase tracking-[0.14em] text-[#0ea5e9]">
              {GUIDE_COPY.label}
            </span>
            <h2 id="guia-h">{GUIDE_COPY.title}</h2>
            <p className="muted measure">{GUIDE_COPY.subtitle}</p>

            <div
              role="radiogroup"
              aria-label={GUIDE_COPY.selectorLabel}
              className="relative [display:grid] [grid-template-columns:1fr_1fr] self-start w-full max-w-sm rounded-full border border-white/10 bg-[var(--p-surface)] p-1"
            >
              <span
                aria-hidden="true"
                data-testid="guia-indicador"
                className={`guia-indicador absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-[#0ea5e9] transition-transform duration-300 ease-out ${
                  guided ? 'translate-x-full' : 'translate-x-0'
                }`}
              />
              {MODES.map((value) => {
                const selected = value === mode;
                return (
                  <button
                    key={value}
                    ref={(node) => {
                      radioRefs.current[value] = node;
                    }}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => selectMode(value)}
                    onKeyDown={onRadioKeyDown}
                    className={`relative z-10 cursor-pointer rounded-full border-0 bg-transparent px-4 py-2.5 text-sm font-medium transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9] ${
                      selected ? 'text-[#0a0d14]' : 'text-[#94a3b8] hover:text-[#f1f5f9]'
                    }`}
                  >
                    {GUIDE_COPY.modes[value]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Marco de navegador con la captura real */}
          <div className="min-w-0 lg:[grid-column:2] lg:[grid-row:1/span_2] lg:self-center">
            <figure
              data-testid="guia-marco"
              data-paused={paused ? 'true' : 'false'}
              tabIndex={guided && !reduced ? 0 : undefined}
              onMouseEnter={() => setHoverPaused(true)}
              onMouseLeave={() => setHoverPaused(false)}
              onFocus={() => setFocusPaused(true)}
              onBlur={onFrameBlur}
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
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 overflow-hidden"
                >
                  {visibleSpots.map((spot) => (
                    <div
                      key={reduced ? spot.id : 'foco'}
                      data-testid="guia-foco"
                      className={`absolute rounded-md border-2 border-[#0ea5e9] ${
                        reduced
                          ? ''
                          : 'guia-foco transition-[left,top,width,height] duration-500 ease-out'
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
                    className="guia-tooltip absolute z-10 rounded-lg border border-[#0ea5e9] bg-[var(--p-surface)] px-3 py-2 text-xs leading-snug text-[#f1f5f9] shadow-[0_12px_30px_-12px_rgba(0,0,0,0.9)] transition-[left,top] duration-500 ease-out sm:text-[13px]"
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

              <figcaption className="border-t border-white/10 bg-[var(--p-surface)] px-4 py-2.5 text-xs text-[#9aa0a8]">
                {GUIDE_COPY.captions[mode]}
              </figcaption>
            </figure>

            {guided && reduced && (
              <ol
                data-testid="guia-pasos-estaticos"
                aria-label={GUIDE_COPY.stepsListLabel}
                className="mt-5 flex flex-col gap-3 p-0"
              >
                {GUIDE_CAPTURE.hotspots.map((spot) => (
                  <li key={spot.id} className="flex items-start gap-3 text-sm text-[#f1f5f9]">
                    <span
                      aria-hidden="true"
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0ea5e9] text-xs font-bold text-[#0a0d14]"
                    >
                      {spot.step}
                    </span>
                    <span>{GUIDE_STEP_TEXT[spot.id]}</span>
                  </li>
                ))}
              </ol>
            )}

            <div
              data-testid="guia-anuncio"
              aria-live="polite"
              aria-atomic="true"
              className="sr-only"
            >
              {announcement}
            </div>
          </div>

          {/* Lista por modo + CTA */}
          <div className="flex flex-col gap-6 lg:[grid-column:1] lg:[grid-row:2] lg:self-start">
            <ul
              key={mode}
              data-testid="guia-lista"
              aria-label={GUIDE_COPY.listLabels[mode]}
              className="m-0 flex flex-col gap-3.5 p-0"
            >
              {listItems.map((text, index) => {
                const Icon = listIcons[index];
                return (
                  <li
                    key={text}
                    style={{ '--i': index } as React.CSSProperties}
                    className="guia-item flex items-start gap-3 text-[15px] leading-snug text-[#f1f5f9]"
                  >
                    <Icon
                      aria-hidden="true"
                      className={`mt-0.5 h-[18px] w-[18px] shrink-0 ${
                        guided ? 'text-[#0ea5e9]' : 'text-[#9aa0a8]'
                      }`}
                    />
                    <span>{text}</span>
                  </li>
                );
              })}
            </ul>

            <button
              type="button"
              onClick={openCatalog}
              className="inline-flex cursor-pointer items-center gap-2 self-start rounded-full border-0 bg-[#0ea5e9] px-6 py-3 text-sm font-semibold text-[#0a0d14] transition-colors duration-200 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]"
            >
              <Compass aria-hidden="true" className="h-4 w-4" />
              {GUIDE_COPY.cta}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
