const css = `
.fx-editorial {
  width: 100%;
  max-width: 560px;
  padding: 26px 24px;
  box-sizing: border-box;
  background: #faf7f2;
  font-family: Georgia, 'Times New Roman', serif;
  color: #1c1917;
}
.fx-editorial-kicker {
  margin: 0;
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #9f1239;
}
.fx-editorial-title {
  margin: 8px 0 0;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 34px;
  font-weight: 400;
  line-height: 1.05;
  letter-spacing: -0.01em;
}
.fx-editorial-deck { margin: 10px 0 0; font-size: 16px; font-style: italic; line-height: 1.4; color: #44403c; }
/* Filete: una línea fina y otra gruesa, como en la cabecera de una revista. */
.fx-editorial-rule {
  height: 3px;
  margin: 16px 0 14px;
  border: 0;
  border-top: 1px solid #1c1917;
  border-bottom: 1px solid #1c1917;
}
.fx-editorial-body {
  columns: 2 180px;
  column-gap: 24px;
  column-rule: 1px solid #d6d3d1;
  font-size: 14px;
  line-height: 1.55;
  text-align: justify;
  hyphens: auto;
}
.fx-editorial-body p { margin: 0 0 10px; }
/* Capitular: la primera letra ocupa unas tres líneas. */
.fx-editorial-body p:first-child::first-letter {
  float: left;
  margin: 4px 8px 0 0;
  font-size: 54px;
  line-height: 0.8;
  color: #9f1239;
}
.fx-editorial-byline {
  margin: 4px 0 0;
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  font-size: 12px;
  color: #57534e;
}
`;

/**
 * Editorial: maqueta de revista con titular serif grande, entradilla en cursiva, filete doble,
 * capitular en la primera letra y el texto en dos columnas separadas por una línea fina.
 * Las columnas pasan a una sola en pantallas estrechas (`columns: 2 180px`).
 */
export function Demo() {
  return (
    <article className="fx-editorial" data-effect="editorial" lang="es">
      <style>{css}</style>
      <p className="fx-editorial-kicker">Ensayo · Nº 12</p>
      <h3 className="fx-editorial-title">El arte de pedir bien las cosas</h3>
      <p className="fx-editorial-deck">Por qué una buena descripción vale más que diez intentos a ciegas.</p>
      <hr className="fx-editorial-rule" />
      <div className="fx-editorial-body">
        <p>
          Cuando sabemos cómo se llama lo que buscamos, la conversación cambia. Ya no describimos a ojo: nombramos un
          estilo, una medida, un color.
        </p>
        <p>
          La maqueta editorial lo demuestra con poco: una serif generosa, columnas que respiran y una sola letra grande
          que invita a empezar.
        </p>
      </div>
      <p className="fx-editorial-byline">Por la redacción · 4 min de lectura</p>
    </article>
  );
}
