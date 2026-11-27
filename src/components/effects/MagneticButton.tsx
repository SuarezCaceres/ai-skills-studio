import { useRef, type PointerEvent } from 'react';
import { ArrowRight } from 'lucide-react';

const css = `
.fx-magnetic-button-zone {
  display: flex;
  height: 220px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  border: 1px dashed #1e293b;
  border-radius: 14px;
  background: radial-gradient(circle at center, #121722 0%, #0a0d14 70%);
}
.fx-magnetic-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  border: 0;
  border-radius: 999px;
  background: #0ea5e9;
  padding: 14px 26px;
  font: inherit;
  font-size: 15px;
  font-weight: 700;
  color: #04121c;
  box-shadow: 0 10px 24px -10px rgb(14 165 233 / 0.7);
  /* La transición suaviza cada salto del puntero y la vuelta al centro. */
  transition: transform 250ms cubic-bezier(0.2, 0.8, 0.2, 1);
  will-change: transform;
}
.fx-magnetic-button:focus-visible {
  outline: 2px solid #0ea5e9;
  outline-offset: 2px;
}
@media (prefers-reduced-motion: reduce) {
  .fx-magnetic-button {
    animation: none;
    transition: none;
    transform: none !important;
  }
}
`;

/** Distancia (px) desde el centro del botón a la que empieza a notarse la atracción. */
const RADIUS = 140;
/** Fracción de la distancia al puntero que se desplaza el botón (0,35 = un tercio largo). */
const STRENGTH = 0.35;

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Demo de «Botón magnético»: el botón se acerca al puntero cuando está cerca y vuelve al centro al alejarse. */
export function Demo() {
  // El ancla no se mueve: sirve de centro de referencia mientras el botón se desplaza.
  const anchorRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const moveTo = (x: number, y: number) => {
    if (buttonRef.current) buttonRef.current.style.transform = `translate(${x}px, ${y}px)`;
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const anchor = anchorRef.current;
    // Solo ratón y lápiz: en pantallas táctiles el dedo tapa el botón y el efecto no aporta nada.
    if (!anchor || event.pointerType === 'touch' || prefersReducedMotion()) return;
    const rect = anchor.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    if (Math.hypot(dx, dy) > RADIUS) moveTo(0, 0);
    else moveTo(dx * STRENGTH, dy * STRENGTH);
  };

  return (
    <div data-effect="magnetic-button" className="w-full max-w-[560px]">
      <style>{css}</style>
      <div className="fx-magnetic-button-zone" onPointerMove={onPointerMove} onPointerLeave={() => moveTo(0, 0)}>
        <span ref={anchorRef} className="inline-flex">
          <button ref={buttonRef} type="button" className="fx-magnetic-button">
            Empezar ahora
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </span>
        <p className="m-0 text-xs text-slate-400">Acerca el puntero al botón</p>
      </div>
    </div>
  );
}
