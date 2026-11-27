import { useEffect, useState } from 'react';
import { ReplayFrame } from './ReplayFrame';

const css = `
/* El tamaño de las cifras sigue el ancho del propio cuadro (unidades cqi), no el de la ventana. */
.fx-count-up {
  container-type: inline-size;
}
.fx-count-up-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
}
.fx-count-up-stat {
  display: flex;
  flex-direction: column-reverse;
  gap: 4px;
  border: 1px solid #1e293b;
  border-radius: 14px;
  background: #121722;
  padding: 16px 12px;
  text-align: center;
}
.fx-count-up-value {
  margin: 0;
  font-size: clamp(22px, 8cqi, 36px);
  white-space: nowrap;
  font-weight: 800;
  line-height: 1.1;
  color: #f8fafc;
  /* Cifras de ancho fijo: el número no baila mientras sube. */
  font-variant-numeric: tabular-nums;
}
`;

/** `\u00a0` es un espacio duro: la cifra y el símbolo % no se separan de línea. */
const STATS = [
  { value: 1280, suffix: '', label: 'skills auditadas' },
  { value: 98, suffix: '\u00a0%', label: 'pruebas en verde' },
  { value: 42, suffix: '', label: 'clases publicadas' },
];
/** Duración de la subida, en milisegundos. */
const DURATION = 1600;

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
const format = (n: number) => new Intl.NumberFormat('es-ES').format(n);

/** Valor que sube de 0 a `target` en `DURATION` ms con easing; con movimiento reducido, `target` directamente. */
function useCountUp(target: number) {
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0));

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let frame = 0;
    let start: number | null = null;
    const tick = (now: number) => {
      start ??= now;
      const progress = Math.min((now - start) / DURATION, 1);
      setValue(Math.round(target * easeOutCubic(progress)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return value;
}

function Stat({ value, suffix, label }: (typeof STATS)[number]) {
  const current = useCountUp(value);
  return (
    <div className="fx-count-up-stat">
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="fx-count-up-value">
        {/* Los lectores de pantalla oyen solo la cifra final, no cada paso intermedio. */}
        <span className="sr-only">
          {format(value)}
          {suffix}
        </span>
        <span aria-hidden="true">
          <span data-count={value}>{format(current)}</span>
          {suffix}
        </span>
      </dd>
    </div>
  );
}

/** Demo de «Contador numérico»: tres cifras que suben de 0 a su valor con una frenada suave al final. */
export function Demo() {
  return (
    <div data-effect="count-up" className="fx-count-up w-full max-w-[560px]">
      <style>{css}</style>
      <ReplayFrame>
        <dl className="fx-count-up-grid">
          {STATS.map((stat) => (
            <Stat key={stat.label} {...stat} />
          ))}
        </dl>
      </ReplayFrame>
    </div>
  );
}
