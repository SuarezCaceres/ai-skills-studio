const css = `
.fx-clay {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 560px;
  min-height: 300px;
  padding: 32px 20px;
  box-sizing: border-box;
  border-radius: 28px;
  background: #e8f0fb;
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  color: #1e293b;
}
/* El volumen sale de tres sombras: una exterior suave y dos interiores (luz arriba, sombra abajo). */
.fx-clay-card {
  width: 100%;
  max-width: 320px;
  padding: 24px;
  box-sizing: border-box;
  border-radius: 32px;
  background: #f8fafc;
  box-shadow:
    12px 16px 32px rgb(30 41 59 / 0.18),
    inset -8px -10px 18px rgb(30 41 59 / 0.08),
    inset 8px 10px 18px rgb(255 255 255 / 0.9);
}
.fx-clay-row { display: flex; gap: 14px; }
.fx-clay-shape {
  width: 56px;
  height: 56px;
  border-radius: 20px;
  box-shadow:
    6px 8px 16px rgb(30 41 59 / 0.18),
    inset -5px -6px 10px rgb(30 41 59 / 0.12),
    inset 5px 6px 10px rgb(255 255 255 / 0.75);
}
.fx-clay-shape--pink { background: #fbcfe8; }
.fx-clay-shape--mint { background: #bbf7d0; border-radius: 50%; }
.fx-clay-shape--sky { background: #bae6fd; }
.fx-clay-title { margin: 20px 0 0; font-family: inherit; font-size: 22px; font-weight: 800; line-height: 1.2; }
.fx-clay-text { margin: 6px 0 0; font-size: 14px; line-height: 1.5; color: #334155; }
.fx-clay-button {
  margin-top: 18px;
  padding: 12px 22px;
  border: 0;
  border-radius: 999px;
  background: #f9a8d4;
  color: #3b0a24;
  font: inherit;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  box-shadow:
    6px 8px 16px rgb(190 24 93 / 0.25),
    inset -4px -5px 10px rgb(190 24 93 / 0.18),
    inset 4px 5px 10px rgb(255 255 255 / 0.6);
  transition: box-shadow 150ms ease, transform 150ms ease;
}
/* Al pulsar, la plastilina se aplasta: menos sombra exterior y la interior se invierte. */
.fx-clay-button:active {
  transform: scale(0.97);
  box-shadow:
    2px 3px 6px rgb(190 24 93 / 0.2),
    inset 4px 5px 10px rgb(190 24 93 / 0.22),
    inset -4px -5px 10px rgb(255 255 255 / 0.5);
}
.fx-clay-button:focus-visible { outline: 2px solid #0ea5e9; outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) {
  .fx-clay-button { transition: none; }
}
`;

/**
 * Claymorphism: formas muy redondeadas en tonos pastel que parecen de plastilina. El volumen sale
 * de combinar una sombra exterior suave con dos sombras interiores, una clara arriba a la
 * izquierda y otra oscura abajo a la derecha. El botón se «aplasta» al pulsarlo.
 */
export function Demo() {
  return (
    <div className="fx-clay" data-effect="claymorphism">
      <style>{css}</style>
      <div className="fx-clay-card">
        <div className="fx-clay-row" aria-hidden="true">
          <span className="fx-clay-shape fx-clay-shape--pink" />
          <span className="fx-clay-shape fx-clay-shape--mint" />
          <span className="fx-clay-shape fx-clay-shape--sky" />
        </div>
        <h3 className="fx-clay-title">Racha de 7 días</h3>
        <p className="fx-clay-text">Formas blanditas con luz por dentro y sombra por fuera.</p>
        <button type="button" className="fx-clay-button">
          Seguir jugando
        </button>
      </div>
    </div>
  );
}
