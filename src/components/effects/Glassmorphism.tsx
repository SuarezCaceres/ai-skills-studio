const css = `
.fx-glass {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 560px;
  min-height: 300px;
  padding: 32px 20px;
  box-sizing: border-box;
  overflow: hidden;
  border-radius: 20px;
  background: #0b1020;
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
}
.fx-glass-blob {
  position: absolute;
  border-radius: 50%;
  opacity: 0.8;
}
.fx-glass-blob--green { width: 200px; height: 200px; left: -40px; top: -40px; background: #15803d; }
.fx-glass-blob--pink { width: 220px; height: 220px; right: -50px; bottom: -70px; background: #be185d; }
.fx-glass-blob--blue { width: 150px; height: 150px; left: 45%; top: 30px; background: #2563eb; }

.fx-glass-card {
  position: relative;
  width: 100%;
  max-width: 320px;
  padding: 24px;
  box-sizing: border-box;
  border-radius: 16px;
  border: 1px solid rgb(255 255 255 / 0.25);
  background: rgb(255 255 255 / 0.1);
  box-shadow: 0 8px 32px rgb(0 0 0 / 0.3);
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  color: #ffffff;
}
/* Sin backdrop-filter: fondo más opaco para que el texto siga legible. */
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .fx-glass-card { background: rgb(15 23 42 / 0.88); }
}
.fx-glass-eyebrow {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #e2e8f0;
}
.fx-glass-title { margin: 6px 0 0; font-family: inherit; font-size: 28px; font-weight: 700; line-height: 1.1; }
.fx-glass-text { margin: 8px 0 0; font-size: 14px; line-height: 1.5; color: #f1f5f9; }
.fx-glass-button {
  margin-top: 18px;
  padding: 10px 18px;
  border: 1px solid rgb(255 255 255 / 0.35);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.18);
  color: #ffffff;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 150ms ease;
}
.fx-glass-button:hover { background: rgb(255 255 255 / 0.28); }
.fx-glass-button:focus-visible { outline: 2px solid #0ea5e9; outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) {
  .fx-glass-button { transition: none; }
}
`;

/**
 * Glassmorphism: una tarjeta translúcida (blanco al 10 %) que desenfoca lo que tiene detrás con
 * `backdrop-filter: blur(20px)`. Solo luce sobre un fondo con color, así que la demo trae sus
 * propias manchas verde, rosa y azul. Si el navegador no soporta el desenfoque, la tarjeta pasa
 * a un fondo oscuro casi opaco.
 */
export function Demo() {
  return (
    <div className="fx-glass" data-effect="glassmorphism">
      <style>{css}</style>
      <span aria-hidden="true" className="fx-glass-blob fx-glass-blob--green" />
      <span aria-hidden="true" className="fx-glass-blob fx-glass-blob--blue" />
      <span aria-hidden="true" className="fx-glass-blob fx-glass-blob--pink" />

      <div className="fx-glass-card">
        <p className="fx-glass-eyebrow">Plan Pro</p>
        <h3 className="fx-glass-title">24 € al mes</h3>
        <p className="fx-glass-text">Una capa de vidrio esmerilado: deja ver el color de detrás, pero desenfocado.</p>
        <button type="button" className="fx-glass-button">
          Elegir plan
        </button>
      </div>
    </div>
  );
}
