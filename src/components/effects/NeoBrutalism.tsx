const css = `
.fx-brutal {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 560px;
  min-height: 300px;
  padding: 32px 20px;
  box-sizing: border-box;
  border-radius: 4px;
  background: #f4efe4;
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  color: #000000;
}
.fx-brutal-card {
  width: 100%;
  max-width: 340px;
  padding: 22px;
  box-sizing: border-box;
  border: 3px solid #000000;
  background: #ffffff;
  box-shadow: 6px 6px 0 #000000;
}
.fx-brutal-tag {
  display: inline-block;
  margin: 0;
  padding: 2px 10px;
  border: 3px solid #000000;
  background: #ff90e8;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.fx-brutal-title {
  margin: 14px 0 0;
  font-family: inherit;
  font-size: 30px;
  font-weight: 900;
  line-height: 1;
  text-transform: uppercase;
}
.fx-brutal-text { margin: 10px 0 0; font-size: 15px; font-weight: 500; line-height: 1.45; }
.fx-brutal-button {
  margin-top: 20px;
  padding: 12px 22px;
  border: 3px solid #000000;
  border-radius: 0;
  background: #facc15;
  color: #000000;
  font: inherit;
  font-size: 16px;
  font-weight: 900;
  letter-spacing: 0.04em;
  cursor: pointer;
  box-shadow: 4px 4px 0 #000000;
  transition: transform 80ms ease, box-shadow 80ms ease;
}
.fx-brutal-button:hover { transform: translate(-1px, -1px); box-shadow: 5px 5px 0 #000000; }
/* Al pulsar, el botón «se hunde»: avanza lo mismo que medía la sombra y la sombra desaparece. */
.fx-brutal-button:active { transform: translate(4px, 4px); box-shadow: 0 0 0 #000000; }
.fx-brutal-button:focus-visible { outline: 2px solid #0ea5e9; outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) {
  .fx-brutal-button { transition: none; }
}
`;

/**
 * Neo-brutalism: bordes negros gruesos (3 px), colores planos y saturados y sombras duras sin
 * desenfoque desplazadas hacia abajo a la derecha. El botón «CLICK ME» se hunde al pulsarlo:
 * se desplaza 4 px y su sombra pasa a 0.
 */
export function Demo() {
  return (
    <div className="fx-brutal" data-effect="neo-brutalism">
      <style>{css}</style>
      <div className="fx-brutal-card">
        <p className="fx-brutal-tag">Nuevo</p>
        <h3 className="fx-brutal-title">Sin adornos. Con carácter.</h3>
        <p className="fx-brutal-text">Bordes gruesos, sombra dura y colores que no piden permiso.</p>
        <button type="button" className="fx-brutal-button">
          CLICK ME
        </button>
      </div>
    </div>
  );
}
