import { useEffect, useState } from 'react';
import { ReplayFrame } from './ReplayFrame';

const css = `
.fx-typewriter-box {
  border: 1px solid #1e293b;
  border-radius: 14px;
  background: #121722;
  padding: 18px 20px;
}
/* El texto completo, invisible, reserva el alto final: el bloque no da saltos mientras se escribe. */
.fx-typewriter-stack {
  display: grid;
}
.fx-typewriter-stack > * {
  grid-area: 1 / 1;
}
.fx-typewriter-sizer {
  visibility: hidden;
}
.fx-typewriter-caret {
  display: inline-block;
  width: 2px;
  height: 1.1em;
  margin-left: 2px;
  vertical-align: text-bottom;
  background: #0ea5e9;
  animation: fx-typewriter-blink 1s steps(1, end) infinite;
}
@keyframes fx-typewriter-blink {
  50% { opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .fx-typewriter-caret {
    animation: none;
    transition: none;
  }
}
`;

const TEXT = 'Describe el efecto con palabras claras y deja que la IA escriba el código por ti.';
/** Milisegundos entre letra y letra. */
const SPEED = 45;

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function TypedLine() {
  // Con movimiento reducido el texto aparece entero desde el principio.
  const [count, setCount] = useState(() => (prefersReducedMotion() ? TEXT.length : 0));

  useEffect(() => {
    if (count >= TEXT.length) return;
    const timer = window.setTimeout(() => setCount(count + 1), SPEED);
    return () => window.clearTimeout(timer);
  }, [count]);

  return (
    <div className="fx-typewriter-box">
      <p className="m-0 mb-2 text-xs font-semibold tracking-widest text-[#38bdf8]">PROMPT</p>
      <p className="m-0 text-lg leading-relaxed font-medium text-slate-100">
        <span className="sr-only">{TEXT}</span>
        <span aria-hidden="true" className="fx-typewriter-stack">
          <span className="fx-typewriter-sizer">
            {TEXT}
            <span className="inline-block w-1" />
          </span>
          <span>
            <span data-typed>{TEXT.slice(0, count)}</span>
            <span className="fx-typewriter-caret" />
          </span>
        </span>
      </p>
    </div>
  );
}

/** Demo de «Typewriter»: una frase que se escribe letra a letra con un cursor que parpadea. */
export function Demo() {
  return (
    <div data-effect="typewriter" className="w-full max-w-[560px]">
      <style>{css}</style>
      <ReplayFrame>
        <TypedLine />
      </ReplayFrame>
    </div>
  );
}
