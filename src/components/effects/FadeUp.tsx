import { useEffect, useRef, useState } from 'react';
import { ReplayFrame } from './ReplayFrame';

const css = `
.fx-fade-up-box {
  height: 260px;
  overflow-y: auto;
  overscroll-behavior: contain;
  border: 1px solid #1e293b;
  border-radius: 14px;
  background: #0a0d14;
  padding: 16px;
}
.fx-fade-up-box:focus-visible {
  outline: 2px solid #0ea5e9;
  outline-offset: 2px;
}
.fx-fade-up-card {
  opacity: 0;
  transform: translateY(24px);
  transition:
    opacity 600ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 600ms cubic-bezier(0.22, 1, 0.36, 1);
}
.fx-fade-up-card.is-visible {
  opacity: 1;
  transform: none;
}
@media (prefers-reduced-motion: reduce) {
  .fx-fade-up-card {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
`;

const CARDS = [
  { step: '01', title: 'Escribe la spec', body: 'Qué problema resuelves y cómo sabrás que funciona.' },
  { step: '02', title: 'Acuerda el plan', body: 'Archivos, contratos y pruebas antes de tocar código.' },
  { step: '03', title: 'Construye por fases', body: 'Cambios pequeños, cada uno con su prueba en verde.' },
  { step: '04', title: 'Revisa con otros ojos', body: 'Un revisor independiente contrasta la spec y las reglas.' },
  { step: '05', title: 'Abre el PR', body: 'Cinco secciones: qué, por qué, para qué, cómo y checklist.' },
  { step: '06', title: 'Cuenta lo aprendido', body: 'Una clase corta para que el equipo no repita errores.' },
];

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function FadeUpList() {
  const boxRef = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState<ReadonlySet<number>>(
    () => new Set(prefersReducedMotion() ? CARDS.map((_, i) => i) : [])
  );

  useEffect(() => {
    const box = boxRef.current;
    if (!box || prefersReducedMotion()) return;

    // Cada tarjeta se observa una sola vez: al entrar en la caja se marca visible y se deja de observar.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          const index = Number((entry.target as HTMLElement).dataset.index);
          setShown((prev) => new Set(prev).add(index));
        }
      },
      { root: box, threshold: 0.25 }
    );
    box.querySelectorAll('[data-index]').forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={boxRef}
      role="region"
      aria-label="Pasos de trabajo: baja dentro de la caja para verlos aparecer"
      tabIndex={0}
      className="fx-fade-up-box"
    >
      <ol className="m-0 flex list-none flex-col gap-3 p-0">
        {CARDS.map((card, i) => (
          <li
            key={card.step}
            data-index={i}
            className={`fx-fade-up-card rounded-xl border border-slate-800 bg-[#121722] p-4${shown.has(i) ? ' is-visible' : ''}`}
          >
            <p className="m-0 text-xs font-semibold tracking-widest text-[#38bdf8]">PASO {card.step}</p>
            <h3 className="m-0 mt-1 text-base font-semibold text-slate-100">{card.title}</h3>
            <p className="m-0 mt-1 text-sm text-slate-400">{card.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Demo de «Fade-up al hacer scroll»: las tarjetas suben y aparecen al entrar en la caja con scroll propio. */
export function Demo() {
  return (
    <div data-effect="fade-up" className="w-full max-w-[560px]">
      <style>{css}</style>
      <ReplayFrame>
        <FadeUpList />
      </ReplayFrame>
    </div>
  );
}
