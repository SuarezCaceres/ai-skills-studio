const css = `
.fx-dark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 560px;
  min-height: 300px;
  padding: 28px 20px;
  box-sizing: border-box;
  border-radius: 20px;
  background: #09090b;
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  color: #fafafa;
}
/* Superficies escalonadas: cada nivel es un poco más claro que el de abajo, con borde de 1 px. */
.fx-dark-card {
  width: 100%;
  max-width: 360px;
  padding: 22px;
  box-sizing: border-box;
  border: 1px solid rgb(255 255 255 / 0.08);
  border-radius: 16px;
  background: #111113;
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.04), 0 24px 48px rgb(0 0 0 / 0.5);
}
.fx-dark-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.fx-dark-label {
  margin: 0;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #a1a1aa;
}
.fx-dark-chip {
  padding: 2px 8px;
  border: 1px solid rgb(74 222 128 / 0.25);
  border-radius: 999px;
  background: rgb(74 222 128 / 0.08);
  font-size: 12px;
  font-weight: 500;
  color: #4ade80;
}
.fx-dark-metric {
  margin: 10px 0 0;
  font-size: 40px;
  font-weight: 300;
  line-height: 1;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
}
.fx-dark-panel {
  margin-top: 18px;
  padding: 12px 14px;
  border: 1px solid rgb(255 255 255 / 0.06);
  border-radius: 12px;
  background: #18181b;
}
.fx-dark-spark { display: block; width: 100%; height: 40px; }
.fx-dark-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 16px; }
.fx-dark-note { margin: 0; font-size: 13px; font-weight: 300; color: #a1a1aa; }
.fx-dark-button {
  padding: 8px 14px;
  border: 1px solid rgb(255 255 255 / 0.12);
  border-radius: 10px;
  background: #18181b;
  color: #fafafa;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 150ms ease, border-color 150ms ease;
}
.fx-dark-button:hover { background: #27272a; border-color: rgb(255 255 255 / 0.2); }
.fx-dark-button:focus-visible { outline: 2px solid #0ea5e9; outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) {
  .fx-dark-button { transition: none; }
}
`;

/**
 * Dark mode premium: casi negro en tres niveles (#09090b, #111113 y #18181b), bordes de 1 px
 * blancos al 6–12 %, tipografía fina para la cifra grande y un único toque de color (verde) para
 * el dato que importa. Nada de brillos ni degradados llamativos.
 */
export function Demo() {
  return (
    <div className="fx-dark" data-effect="dark-premium">
      <style>{css}</style>
      <div className="fx-dark-card">
        <div className="fx-dark-head">
          <p className="fx-dark-label">Ingresos del mes</p>
          <span className="fx-dark-chip">+12,4 %</span>
        </div>
        <p className="fx-dark-metric">48.290 €</p>
        <div className="fx-dark-panel">
          <svg className="fx-dark-spark" viewBox="0 0 200 40" preserveAspectRatio="none" aria-hidden="true">
            <path
              d="M0 32 L20 28 L40 30 L60 22 L80 24 L100 16 L120 19 L140 12 L160 14 L180 6 L200 8"
              fill="none"
              stroke="#d4d4d8"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
        <div className="fx-dark-foot">
          <p className="fx-dark-note">Actualizado hace 2 min</p>
          <button type="button" className="fx-dark-button">
            Ver informe
          </button>
        </div>
      </div>
    </div>
  );
}
