const css = `
.fx-mesh {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  width: 100%;
  max-width: 560px;
  min-height: 300px;
  padding: 28px;
  box-sizing: border-box;
  border-radius: 20px;
  /* Varias manchas radiales superpuestas sobre un color base claro: eso es el «mesh». */
  background-color: #fdf2f8;
  background-image:
    radial-gradient(at 12% 18%, #38bdf8 0, transparent 55%),
    radial-gradient(at 88% 12%, #f472b6 0, transparent 50%),
    radial-gradient(at 80% 88%, #facc15 0, transparent 50%),
    radial-gradient(at 18% 92%, #34d399 0, transparent 55%),
    radial-gradient(at 50% 50%, #a5f3fc 0, transparent 45%);
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  color: #0f172a;
}
.fx-mesh-eyebrow {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.fx-mesh-title {
  margin: 8px 0 0;
  font-family: inherit;
  max-width: 14ch;
  font-size: 36px;
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.02em;
}
.fx-mesh-text { margin: 10px 0 0; max-width: 34ch; font-size: 15px; line-height: 1.5; color: #1e293b; }
`;

/**
 * Mesh gradient: cinco `radial-gradient` colocados en distintos puntos que se funden entre sí sobre
 * un fondo claro, de modo que el color parece líquido. Es solo CSS, sin imágenes; el texto va en
 * azul casi negro para mantener el contraste sobre cualquier zona del degradado.
 */
export function Demo() {
  return (
    <div className="fx-mesh" data-effect="mesh-gradient">
      <style>{css}</style>
      <p className="fx-mesh-eyebrow">Mesh gradient</p>
      <h3 className="fx-mesh-title">Color que se funde</h3>
      <p className="fx-mesh-text">Varias manchas de degradado radial superpuestas, sin una sola imagen.</p>
    </div>
  );
}
