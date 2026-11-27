import type { CSSProperties } from 'react';
import { ReplayFrame } from './ReplayFrame';

const css = `
/* El titular escala con el ancho del propio cuadro (unidades cqi), no con el de la ventana. */
.fx-text-reveal {
  container-type: inline-size;
}
.fx-text-reveal-title {
  margin: 0;
  font-size: clamp(26px, 8cqi, 44px);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: #f8fafc;
}
/* La máscara recorta lo que asoma: la palabra parte escondida justo debajo y sube a su sitio. */
.fx-text-reveal-mask {
  display: inline-block;
  overflow: hidden;
  vertical-align: bottom;
  padding-bottom: 0.08em;
}
.fx-text-reveal-word {
  display: inline-block;
  animation: fx-text-reveal-rise 700ms cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: calc(var(--i) * 70ms);
}
.fx-text-reveal-lead {
  animation: fx-text-reveal-fade 600ms ease-out both;
  animation-delay: calc(var(--i) * 70ms + 200ms);
}
@keyframes fx-text-reveal-rise {
  from { transform: translateY(110%); }
  to { transform: translateY(0); }
}
@keyframes fx-text-reveal-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .fx-text-reveal-word,
  .fx-text-reveal-lead {
    animation: none;
    transition: none;
  }
}
`;

const LINES = ['Diseña con intención.', 'Anima con cuidado.'].map((line) => line.split(' '));
const HEADLINE = LINES.map((words) => words.join(' ')).join(' ');
/** Posición de la primera palabra de cada línea en el orden de aparición (para el retraso). */
const LINE_START = LINES.map((_, l) => LINES.slice(0, l).reduce((total, words) => total + words.length, 0));
const WORD_COUNT = LINES.flat().length;

function Headline() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#121722] px-6 py-8">
      <h3 className="fx-text-reveal-title">
        <span className="sr-only">{HEADLINE}</span>
        <span aria-hidden="true">
          {LINES.map((words, l) => (
            <span key={l} className={`block${l === 1 ? ' text-[#38bdf8]' : ''}`}>
              {words.map((word, w) => (
                <span key={w}>
                  <span className="fx-text-reveal-mask">
                    <span className="fx-text-reveal-word" style={{ '--i': LINE_START[l] + w } as CSSProperties}>
                      {word}
                    </span>
                  </span>{' '}
                </span>
              ))}
            </span>
          ))}
        </span>
      </h3>
      <p className="fx-text-reveal-lead m-0 mt-4 text-sm text-slate-400" style={{ '--i': WORD_COUNT } as CSSProperties}>
        Cada palabra sale de debajo de una máscara, una detrás de otra.
      </p>
    </div>
  );
}

/** Demo de «Revelado de texto»: las palabras del titular emergen desde abajo de una máscara, escalonadas. */
export function Demo() {
  return (
    <div data-effect="text-reveal" className="fx-text-reveal w-full max-w-[560px]">
      <style>{css}</style>
      <ReplayFrame>
        <Headline />
      </ReplayFrame>
    </div>
  );
}
