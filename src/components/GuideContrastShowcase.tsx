import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GUIDE_CAPTURE } from '../data/guideShowcaseHotspots';
import { GUIDE_COPY, GUIDE_STEP_TEXT, guideAnnouncementText } from '../data/guideShowcaseCopy';
import { GUIDE_STEP_INTERVAL_MS, type GuideMode, type GuideStep } from '../types/guideShowcase';
import type { AppPageRoute } from '../types/workspace';
import { GuideCaptureFrame } from './guide/GuideCaptureFrame';
import { GuideMediaSlot } from './guide/GuideMediaSlot';
import { GuideModePanel } from './guide/GuideModePanel';
import './guide/guideShowcase.css';

interface GuideContrastShowcaseProps {
  onNavigatePage: (page: AppPageRoute) => void;
}

const MODES: readonly GuideMode[] = ['sin-guia', 'con-guia'];
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const nextStep = (step: GuideStep): GuideStep => ((step % 3) + 1) as GuideStep;

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia(REDUCED_MOTION_QUERY).matches;

/**
 * Sección «Guía vs. sin guía» de la portada (spec 005).
 * Orquesta el estado (modo, paso, pausas y reloj) y la maquetación en espejo (C8):
 * - «Sin guía»: escenario a la izquierda, panel a la derecha.
 * - «Con guía»: panel a la izquierda, escenario a la derecha.
 * Por debajo de 1024 px todo se apila con el escenario arriba.
 */
export const GuideContrastShowcase: React.FC<GuideContrastShowcaseProps> = ({ onNavigatePage }) => {
  const [mode, setMode] = useState<GuideMode>('sin-guia');
  const [step, setStep] = useState<GuideStep>(1);
  const [reduced, setReduced] = useState<boolean>(prefersReducedMotion);
  const [pageVisible, setPageVisible] = useState<boolean>(
    () => typeof document === 'undefined' || document.visibilityState !== 'hidden'
  );
  const [hoverPaused, setHoverPaused] = useState(false);
  const [focusPaused, setFocusPaused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  // Sin IntersectionObserver (entornos antiguos) se considera visible para no bloquear la guía.
  const [inView, setInView] = useState<boolean>(() => typeof IntersectionObserver === 'undefined');
  const [announcement, setAnnouncement] = useState('');

  // Reloj del paso activo (C11): `key` identifica el ciclo y `elapsed` acumula lo ya transcurrido entre pausas.
  const clockRef = useRef({ key: 0, elapsed: 0 });
  const [cycleKey, setCycleKey] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);

  const sectionRef = useRef<HTMLElement | null>(null);
  const radioRefs = useRef<Record<GuideMode, HTMLButtonElement | null>>({
    'sin-guia': null,
    'con-guia': null,
  });

  const guided = mode === 'con-guia';
  const paused = hoverPaused || focusPaused || userPaused;
  const running = guided && !reduced && !paused && pageVisible && inView;
  const hotspotId = GUIDE_CAPTURE.hotspots[step - 1].id;

  /** Arranca un ciclo nuevo desde cero (paso siguiente o reinicio al cambiar de modo). */
  const restartCycle = useCallback((update: (prev: GuideStep) => GuideStep) => {
    const key = clockRef.current.key + 1;
    clockRef.current = { key, elapsed: 0 };
    setCycleKey(key);
    setElapsedMs(0);
    setStep(update);
  }, []);

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

  // Fuera de pantalla no se avanza ni se anuncia nada (no interrumpe al lector de pantalla en otra sección).
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry?.isIntersecting ?? false),
      { threshold: 0.25 }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // Avance automático 1 → 2 → 3 → 1 con tiempo restante: al pausar se guarda lo transcurrido y al reanudar
  // solo se espera lo que falta, igual que la barra CSS congelada (C11).
  useEffect(() => {
    if (!running) return;
    const key = clockRef.current.key;
    // performance.now() es monótono (un cambio del reloj del sistema no falsea lo transcurrido) y page.clock lo controla.
    const startedAt = performance.now();
    const remaining = Math.max(0, GUIDE_STEP_INTERVAL_MS - clockRef.current.elapsed);
    const id = window.setTimeout(() => {
      if (clockRef.current.key === key) restartCycle(nextStep);
    }, remaining);
    return () => {
      window.clearTimeout(id);
      // Solo se acumula si el ciclo sigue siendo el mismo (no tras avanzar ni tras cambiar de modo).
      if (clockRef.current.key !== key) return;
      const elapsed = Math.min(
        GUIDE_STEP_INTERVAL_MS,
        Math.max(0, clockRef.current.elapsed + (performance.now() - startedAt))
      );
      clockRef.current = { key, elapsed };
      setElapsedMs(elapsed);
    };
  }, [running, cycleKey, restartCycle]);

  // Anuncio para lectores de pantalla (región aria-live="polite").
  useEffect(() => {
    if (guided) {
      setAnnouncement(
        reduced ? GUIDE_COPY.announceStatic : guideAnnouncementText(step, GUIDE_STEP_TEXT[hotspotId])
      );
    } else {
      setAnnouncement((prev) => (prev ? GUIDE_COPY.announceNoGuide : ''));
    }
  }, [guided, reduced, step, hotspotId]);

  const selectMode = useCallback(
    (next: GuideMode) => {
      // Volver a pulsar el modo activo no reinicia la guía.
      if (next === mode) return;
      setMode(next);
      setFocusPaused(false);
      setUserPaused(false);
      restartCycle(() => 1);
    },
    [mode, restartCycle]
  );

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

  const openCatalog = () => {
    onNavigatePage('catalogo');
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  return (
    <section
      ref={sectionRef}
      id="guia"
      className="section guia"
      aria-labelledby="guia-h"
      data-mode={mode}
      data-reduced={reduced ? 'true' : 'false'}
      data-paused={guided && paused ? 'true' : 'false'}
    >
      <div className="wrap">
        <header className="guia__cabecera">
          <span className="font-mono text-xs uppercase tracking-[0.14em] text-[#0ea5e9]">
            {GUIDE_COPY.label}
          </span>
          <h2 id="guia-h">{GUIDE_COPY.title}</h2>
          <p className="muted measure">{GUIDE_COPY.subtitle}</p>
        </header>

        <div className="guia__rejilla">
          <div className="guia__escenario">
            <GuideMediaSlot mode={mode} reduced={reduced} step={step}>
              <GuideCaptureFrame
                mode={mode}
                reduced={reduced}
                step={step}
                paused={paused}
                onHoverChange={setHoverPaused}
                onFocusChange={setFocusPaused}
              />
            </GuideMediaSlot>
          </div>

          <div className="guia__selector">
            <div
              role="radiogroup"
              aria-label={GUIDE_COPY.selectorLabel}
              className="relative [display:grid] [grid-template-columns:1fr_1fr] w-full max-w-xs rounded-full border border-white/10 bg-[var(--p-surface)] p-1"
            >
              <span
                aria-hidden="true"
                data-testid="guia-indicador"
                className={`absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-full transition-[transform,background-color] duration-500 ease-out ${
                  guided ? 'translate-x-full bg-[#0ea5e9]' : 'translate-x-0 bg-[#475569]'
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
                      selected
                        ? value === 'con-guia'
                          ? 'text-[#0a0d14]'
                          : 'text-[#f1f5f9]'
                        : 'text-[#94a3b8] hover:text-[#f1f5f9]'
                    }`}
                  >
                    {GUIDE_COPY.modes[value]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="guia__panel">
            <GuideModePanel
              mode={mode}
              reduced={reduced}
              step={step}
              paused={paused || !running}
              userPaused={userPaused}
              elapsedMs={elapsedMs}
              cycleKey={cycleKey}
              onTogglePause={() => setUserPaused((value) => !value)}
              onOpenCatalog={openCatalog}
            />
          </div>
        </div>

        <div data-testid="guia-anuncio" aria-live="polite" aria-atomic="true" className="sr-only">
          {announcement}
        </div>
      </div>
    </section>
  );
};
