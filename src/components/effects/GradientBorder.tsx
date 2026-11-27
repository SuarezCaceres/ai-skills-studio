import { Zap } from 'lucide-react';

const css = `
/* Registrar el ángulo como <angle> permite animarlo: sin @property el navegador no sabe interpolarlo. */
@property --fx-gradient-border-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}
.fx-gradient-border-card {
  border: 2px solid transparent;
  border-radius: 18px;
  /* Tres capas: el relleno de la tarjeta, el destello cónico que gira y un borde base tenue debajo. */
  background:
    linear-gradient(#121722, #121722) padding-box,
    conic-gradient(
      from var(--fx-gradient-border-angle),
      transparent 0deg,
      #0ea5e9 70deg,
      #67e8f9 110deg,
      transparent 180deg,
      transparent 360deg
    ) border-box,
    linear-gradient(#1e293b, #1e293b) border-box;
  animation: fx-gradient-border-spin 4s linear infinite;
}
@keyframes fx-gradient-border-spin {
  to { --fx-gradient-border-angle: 360deg; }
}
@media (prefers-reduced-motion: reduce) {
  .fx-gradient-border-card {
    animation: none;
    transition: none;
  }
}
`;

/** Demo de «Borde degradado giratorio»: una tarjeta cuyo borde lleva un destello cian que da la vuelta. */
export function Demo() {
  return (
    <div data-effect="gradient-border" className="flex w-full max-w-[560px] justify-center">
      <style>{css}</style>
      <article className="fx-gradient-border-card w-full max-w-sm p-6">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0ea5e9]/15 text-[#38bdf8]">
          <Zap aria-hidden="true" className="h-5 w-5" />
        </span>
        <h3 className="m-0 mt-4 text-lg font-semibold text-slate-100">Plan Equipo</h3>
        <p className="m-0 mt-1 text-sm text-slate-400">
          El borde que gira llama la atención sobre la opción recomendada sin tapar el contenido.
        </p>
        <p className="m-0 mt-4 text-2xl font-bold text-white">
          12 € <span className="text-sm font-medium text-slate-400">/ mes</span>
        </p>
      </article>
    </div>
  );
}
