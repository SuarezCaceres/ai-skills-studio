const css = `
/* Las columnas dependen del ancho del propio cuadro, no de la ventana. */
.fx-shimmer {
  container-type: inline-size;
}
.fx-shimmer-cards {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
}
@container (min-width: 480px) {
  .fx-shimmer-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
.fx-shimmer-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  border: 1px solid #1e293b;
  border-radius: 14px;
  background: #121722;
  padding: 16px;
}
/* Cada «hueso» lleva una franja clara en el centro de un degradado 4 veces más ancho que él;
   mover la posición del fondo de 100 % a 0 % hace que la franja lo recorra de izquierda a derecha. */
.fx-shimmer-bone {
  border-radius: 8px;
  background-color: #1a2130;
  background-image: linear-gradient(90deg, #1a2130 0%, #1a2130 40%, #2b3649 50%, #1a2130 60%, #1a2130 100%);
  background-size: 400% 100%;
  background-position: 100% 0;
  animation: fx-shimmer-sweep 1.6s linear infinite;
}
/* El avatar es redondo: va en el CSS propio porque este <style> pisa a las utilidades de Tailwind. */
.fx-shimmer-bone.is-round {
  border-radius: 50%;
}
@keyframes fx-shimmer-sweep {
  from { background-position: 100% 0; }
  to { background-position: 0% 0; }
}
@media (prefers-reduced-motion: reduce) {
  .fx-shimmer-bone {
    animation: none;
    transition: none;
  }
}
`;

function SkeletonCard() {
  return (
    <div className="fx-shimmer-card" aria-hidden="true">
      <div className="flex items-center gap-3">
        <div className="fx-shimmer-bone is-round h-10 w-10 shrink-0" />
        <div className="flex flex-1 flex-col gap-2">
          <div className="fx-shimmer-bone h-3 w-3/5" />
          <div className="fx-shimmer-bone h-3 w-2/5" />
        </div>
      </div>
      <div className="fx-shimmer-bone h-24 w-full" />
      <div className="fx-shimmer-bone h-3 w-full" />
      <div className="fx-shimmer-bone h-3 w-4/5" />
    </div>
  );
}

/** Demo de «Shimmer»: tarjetas esqueleto con un brillo que las recorre mientras el contenido «carga». */
export function Demo() {
  return (
    <div data-effect="shimmer" className="fx-shimmer w-full max-w-[560px]">
      <style>{css}</style>
      <div role="status" aria-busy="true" className="fx-shimmer-cards">
        <span className="sr-only">Cargando las tarjetas…</span>
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
