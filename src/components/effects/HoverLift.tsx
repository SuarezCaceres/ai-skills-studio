import { useState } from 'react';
import { Check } from 'lucide-react';

const css = `
/* Las columnas dependen del ancho del propio cuadro, no de la ventana. */
.fx-hover-lift {
  container-type: inline-size;
}
.fx-hover-lift-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
}
@container (min-width: 480px) {
  .fx-hover-lift-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
.fx-hover-lift-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  cursor: pointer;
  text-align: left;
  font: inherit;
  color: #e2e8f0;
  border: 1px solid #1e293b;
  border-radius: 14px;
  background: #121722;
  padding: 16px;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.3);
  transition:
    transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 220ms cubic-bezier(0.2, 0.8, 0.2, 1),
    border-color 220ms ease;
}
.fx-hover-lift-card:hover,
.fx-hover-lift-card:focus-visible {
  transform: translateY(-6px);
  border-color: #0ea5e9;
  box-shadow: 0 18px 32px -14px rgb(14 165 233 / 0.45), 0 4px 10px rgb(0 0 0 / 0.35);
}
.fx-hover-lift-card:focus-visible {
  outline: 2px solid #0ea5e9;
  outline-offset: 2px;
}
.fx-hover-lift-card[aria-pressed='true'] {
  border-color: #0ea5e9;
  background: #10202e;
}
/* Sin movimiento: la tarjeta no sube, pero el borde y la sombra siguen marcando el estado. */
@media (prefers-reduced-motion: reduce) {
  .fx-hover-lift-card {
    animation: none;
    transition: none;
  }
  .fx-hover-lift-card:hover,
  .fx-hover-lift-card:focus-visible {
    transform: none;
  }
}
`;

const PLANS = [
  { name: 'Personal', price: '0 €', detail: 'Para probar skills en tu equipo.' },
  { name: 'Equipo', price: '12 €', detail: 'Catálogo compartido y revisiones.' },
  { name: 'Empresa', price: 'A medida', detail: 'Soporte y reglas propias.' },
];

/** Demo de «Hover lift»: tarjetas que suben 6 px y ganan sombra al pasar el ratón o al recibir el foco. */
export function Demo() {
  const [selected, setSelected] = useState('Equipo');

  return (
    <div data-effect="hover-lift" className="fx-hover-lift w-full max-w-[560px]">
      <style>{css}</style>
      <div role="group" aria-label="Elige un plan" className="fx-hover-lift-grid">
        {PLANS.map((plan) => {
          const active = plan.name === selected;
          return (
            <button
              key={plan.name}
              type="button"
              aria-pressed={active}
              onClick={() => setSelected(plan.name)}
              className="fx-hover-lift-card"
            >
              <span className="flex items-center justify-between gap-2 text-sm font-semibold text-slate-300">
                {plan.name}
                {active ? <Check aria-hidden="true" className="h-4 w-4 text-[#38bdf8]" /> : null}
              </span>
              <span className="text-xl font-bold text-white">{plan.price}</span>
              <span className="text-xs text-slate-400">{plan.detail}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
