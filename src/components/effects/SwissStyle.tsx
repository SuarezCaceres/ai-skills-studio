const css = `
.fx-swiss {
  position: relative;
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  column-gap: 12px;
  row-gap: 10px;
  width: 100%;
  max-width: 560px;
  min-height: 300px;
  padding: 24px;
  box-sizing: border-box;
  container-type: inline-size;
  background: #f5f5f0;
  font-family: 'Helvetica Neue', Helvetica, Arial, system-ui, sans-serif;
  color: #111111;
}
/* La retícula a la vista: seis columnas con el mismo hueco que el contenido. */
.fx-swiss-lines {
  position: absolute;
  inset: 0 24px;
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  column-gap: 12px;
  pointer-events: none;
}
.fx-swiss-lines span {
  border-left: 1px solid rgb(17 17 17 / 0.08);
  border-right: 1px solid rgb(17 17 17 / 0.08);
}
.fx-swiss > :not(.fx-swiss-lines) { position: relative; margin: 0; }
.fx-swiss-num { grid-column: 1 / 2; font-size: 14px; font-weight: 700; color: #c8102e; }
.fx-swiss-meta { grid-column: 3 / 7; font-size: 12px; font-weight: 500; line-height: 1.4; }
.fx-swiss-title {
  grid-column: 1 / 6;
  font-family: inherit;
  font-size: clamp(30px, 11cqi, 58px);
  font-weight: 700;
  line-height: 0.95;
  letter-spacing: -0.03em;
  text-align: left;
}
.fx-swiss-block { grid-column: 6 / 7; align-self: end; aspect-ratio: 1; background: #c8102e; }
.fx-swiss-rule { grid-column: 1 / 7; height: 0; border: 0; border-top: 2px solid #111111; }
.fx-swiss-body { grid-column: 1 / 5; font-size: 13px; line-height: 1.45; }
`;

/**
 * Swiss style (estilo tipográfico internacional): una rejilla de seis columnas que se deja ver,
 * tipografía sans grande alineada a la izquierda, filetes negros y un único color de acento
 * (rojo). El orden lo da la retícula, no la decoración.
 */
export function Demo() {
  return (
    <div className="fx-swiss" data-effect="swiss-style">
      <style>{css}</style>
      <div className="fx-swiss-lines" aria-hidden="true">
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} />
        ))}
      </div>
      <p className="fx-swiss-num">01</p>
      <p className="fx-swiss-meta">Retícula de 6 columnas · Un solo color</p>
      <h3 className="fx-swiss-title">
        Forma
        <br />
        sigue a la
        <br />
        función.
      </h3>
      <span className="fx-swiss-block" aria-hidden="true" />
      <hr className="fx-swiss-rule" />
      <p className="fx-swiss-body">Alineado a la izquierda, sin adornos: la jerarquía sale del tamaño y del espacio.</p>
    </div>
  );
}
