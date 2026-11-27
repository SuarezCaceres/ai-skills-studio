/** Ruido generado por el propio navegador con `feTurbulence`, en un SVG en línea (sin descargas). */
const noise =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const css = `
.fx-grain {
  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  width: 100%;
  max-width: 560px;
  min-height: 300px;
  padding: 28px;
  box-sizing: border-box;
  overflow: hidden;
  border-radius: 20px;
  background: linear-gradient(135deg, #0f172a 0%, #831843 52%, #c2410c 100%);
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  color: #ffffff;
}
/* La capa de grano: el ruido SVG repetido, mezclado con el degradado y sin captar el ratón. */
.fx-grain::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background-image: ${noise};
  background-size: 160px 160px;
  opacity: 0.6;
  mix-blend-mode: overlay;
  pointer-events: none;
}
.fx-grain-eyebrow {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #fde68a;
}
.fx-grain-title {
  margin: 8px 0 0;
  font-family: inherit;
  max-width: 14ch;
  font-size: 36px;
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.02em;
}
.fx-grain-text { margin: 10px 0 0; max-width: 34ch; font-size: 15px; line-height: 1.5; color: #f8fafc; }
`;

/**
 * Grain texture: un degradado con una capa de ruido fino encima, como el grano de una foto de
 * película. El ruido es un SVG con `feTurbulence` incrustado como `data:` URI, repetido en un
 * pseudoelemento al 60 % de opacidad con `mix-blend-mode: overlay`, por debajo del texto.
 */
export function Demo() {
  return (
    <div className="fx-grain" data-effect="grain-texture">
      <style>{css}</style>
      <p className="fx-grain-eyebrow">Grain texture</p>
      <h3 className="fx-grain-title">Textura de película</h3>
      <p className="fx-grain-text">Un ruido fino sobre el degradado quita el aspecto plástico y digital.</p>
    </div>
  );
}
