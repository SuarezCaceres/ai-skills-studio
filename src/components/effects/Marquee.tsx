import { useState } from 'react';
import { Pause, Play } from 'lucide-react';

const css = `
.fx-marquee {
  border: 1px solid #1e293b;
  border-radius: 14px;
  background: #0a0d14;
  padding: 18px 0;
}
.fx-marquee-mask {
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
  /* Los extremos se desvanecen para que las palabras entren y salgan sin corte brusco. */
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent);
}
.fx-marquee:focus-visible {
  outline: 2px solid #0ea5e9;
  outline-offset: 2px;
}
.fx-marquee-track {
  display: flex;
  width: max-content;
  animation: fx-marquee-scroll 24s linear infinite;
}
.fx-marquee-track.is-reverse {
  animation-direction: reverse;
  animation-duration: 30s;
}
.fx-marquee:hover .fx-marquee-track,
.fx-marquee:focus-within .fx-marquee-track,
.fx-marquee.is-paused .fx-marquee-track {
  animation-play-state: paused;
}
/* Pausa persistente (WCAG 2.2.2): el movimiento continuo siempre se puede detener. */
.fx-marquee-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  border: 1px solid #1e293b;
  border-radius: 999px;
  background: #121722;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 600;
  color: #e2e8f0;
  cursor: pointer;
}
.fx-marquee-toggle:hover {
  border-color: #334155;
}
.fx-marquee-toggle:focus-visible {
  outline: 2px solid #0ea5e9;
  outline-offset: 2px;
}
.fx-marquee-group {
  display: flex;
  flex-shrink: 0;
  gap: 12px;
  margin: 0;
  padding: 0 12px 0 0;
  list-style: none;
}
.fx-marquee-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  border: 1px solid #1e293b;
  border-radius: 999px;
  background: #121722;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
}
.fx-marquee-pill::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #0ea5e9;
}
/* Mueve la mitad del carril: como el contenido está duplicado, el bucle no tiene costura. */
@keyframes fx-marquee-scroll {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
@media (prefers-reduced-motion: reduce) {
  .fx-marquee-track {
    animation: none;
    transition: none;
  }
}
`;

const ROWS = [
  ['Skills', 'Hooks', 'Worktrees', 'Subagentes', 'Specs', 'Revisiones'],
  ['Prompts', 'Clases', 'Modelos', 'Componentes', 'Pruebas', 'Pull requests'],
];

function Group({ words, copy }: { words: string[]; copy?: boolean }) {
  return (
    <ul className="fx-marquee-group" aria-hidden={copy ? true : undefined}>
      {words.map((word) => (
        <li key={word} className="fx-marquee-pill">
          {word}
        </li>
      ))}
    </ul>
  );
}

/**
 * Demo de «Marquee»: dos cintas de palabras en bucle infinito que se paran con el ratón encima, con el foco
 * o, de forma persistente, con el botón «Pausar».
 */
export function Demo() {
  const [paused, setPaused] = useState(false);
  return (
    <div data-effect="marquee" className="w-full min-w-0 max-w-[560px]">
      <style>{css}</style>
      <div
        role="region"
        aria-label="Conceptos del equipo (se detiene al pasar el ratón o al enfocar)"
        tabIndex={0}
        className={`fx-marquee${paused ? ' is-paused' : ''}`}
      >
        <div className="fx-marquee-mask">
          {ROWS.map((words, i) => (
            <div key={words[0]} className={`fx-marquee-track${i % 2 === 1 ? ' is-reverse' : ''}`}>
              <Group words={words} />
              <Group words={words} copy />
            </div>
          ))}
        </div>
      </div>
      <button type="button" aria-pressed={paused} onClick={() => setPaused((p) => !p)} className="fx-marquee-toggle">
        {paused ? <Play aria-hidden="true" size={14} /> : <Pause aria-hidden="true" size={14} />}
        {paused ? 'Reanudar cinta' : 'Pausar cinta'}
      </button>
    </div>
  );
}
