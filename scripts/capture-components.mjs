/**
 * Genera las miniaturas de la página Componentes a partir de los PROPIOS componentes.
 *
 * Arranca un servidor de Vite, abre la página Componentes en un Chromium sin cabeza, y por cada
 * componente del registro fotografía su vista previa en vivo sobre fondo carbón a 640 × 400 px
 * (si la demo es más grande, se reduce con `zoom` hasta que quepa). Guarda `public/components/<id>.png`;
 * si una imagen pasa de 40 KB la reduce a paleta indexada (sin dependencias) y, si aun así no cabe, falla. No añade código a la app: todo ocurre aquí, fuera del bundle.
 *
 * GitHub se intercepta (la cuota anónima es de 60 peticiones/h por IP): nunca se toca api.github.com.
 *
 * Uso:  node scripts/capture-components.mjs [--only=accordion,card]
 */
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { mkdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { quantizePng } from './lib/png-quantize.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = resolve(ROOT, 'public', 'components');
const PORT = 5191;
const WIDTH = 640;
const HEIGHT = 400;
const PADDING = 16;
/** Fecha fija: las demos que dependen de «hoy» (Datepicker) salen iguales cada vez que se regeneran. */
const FIXED_NOW = new Date('2026-11-15T12:00:00');
const MAX_BYTES = 40 * 1024;

const only = (process.argv.find((a) => a.startsWith('--only=')) ?? '').slice('--only='.length).split(',').filter(Boolean);

/** Estados que hay que provocar para que la captura enseñe lo importante (menús, paneles abiertos…). */
const PREPARE = {
  dropdowns: (stage) => stage.getByRole('button', { name: 'Acciones de la clase' }).click(),
  datepicker: (stage) => stage.getByRole('button', { name: 'Elegir fecha' }).first().click(),
  drawer: (stage) => stage.getByRole('button', { name: /Abrir filtros/ }).click(),
};

// Sin animaciones, y sin el fondo decorativo de la app (fijo y con z-index: se pintaría sobre la captura).
const CAPTURE_CSS =
  '*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}' +
  'div.pointer-events-none.fixed.inset-0.z-0{display:none!important}';

async function fakeGithub(route) {
  const { pathname } = new URL(route.request().url());
  const body = pathname.startsWith('/users/') ? JSON.stringify({ login: pathname.split('/')[2], name: null }) : '[]';
  return route.fulfill({ status: 200, contentType: 'application/json', body });
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const server = await createServer({
    root: ROOT,
    logLevel: 'error',
    server: { port: PORT, host: '127.0.0.1', strictPort: true },
  });
  await server.listen();
  const origin = `http://127.0.0.1:${PORT}`;

  const browser = await chromium.launch({ headless: true });
  const report = [];
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    await context.clock.setFixedTime(FIXED_NOW);
    await context.route('https://api.github.com/**', fakeGithub);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));

    await page.goto(`${origin}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    await page.evaluate(() => document.querySelector('.nav__actions a.btn--primary')?.click());
    await page.waitForTimeout(400);
    await page.evaluate(() =>
      [...document.querySelectorAll('nav[aria-label="Módulos del estudio"] a')].find((a) => a.textContent.includes('Componentes'))?.click()
    );
    await page.locator('#components-heading').waitFor();
    await page.addStyleTag({ content: CAPTURE_CSS });

    // Los ids y nombres salen del propio registro, así una entrada nueva se captura sin tocar este script.
    const { COMPONENT_REGISTRY } = await server.ssrLoadModule('/src/data/componentRegistry.ts');
    if (COMPONENT_REGISTRY.length === 0) throw new Error('El registro de componentes está vacío.');

    for (const { id: finalId, name } of COMPONENT_REGISTRY) {
      if (only.length > 0 && !only.includes(finalId)) continue;
      await page.locator('nav[aria-label="Componentes"] ul button', { hasText: new RegExp(`^${name}`) }).first().click();
      await page.locator('#component-name', { hasText: name }).waitFor();

      const stage = page.locator('[data-preview-stage]');
      await stage.waitFor();
      await page.waitForTimeout(350);
      if (PREPARE[finalId]) {
        await PREPARE[finalId](stage);
        await page.waitForTimeout(200);
      }

      // Caja de 640 × 400 y reducción de la demo hasta que quepa.
      const scale = await page.evaluate(
        ({ w, h, pad }) => {
          const box = document.querySelector('[data-preview-stage]');
          box.style.cssText += `;width:${w}px;height:${h}px;padding:0;overflow:hidden;border-radius:0;border:0;box-sizing:border-box;flex:none`;
          const inner = box.firstElementChild;
          inner.style.cssText += `;height:100%;min-height:0;padding:${pad}px;box-sizing:border-box`;
          const demo = inner.firstElementChild;
          let s = 1;
          for (; s > 0.3; s = Math.round((s - 0.05) * 100) / 100) {
            demo.style.zoom = String(s);
            const r = demo.getBoundingClientRect();
            if (r.height <= h - pad * 2 && r.width <= w - pad * 2 + 1) break;
          }
          return s;
        },
        { w: WIDTH, h: HEIGHT, pad: PADDING }
      );
      await page.waitForTimeout(150);

      let png = await stage.screenshot({ type: 'png' });
      let note = '';
      if (png.length > MAX_BYTES) {
        // Los puntos del fondo añaden ruido: se quitan antes de rendirse con el tamaño.
        await page.evaluate(() => {
          document.querySelector('[data-preview-stage]').style.backgroundImage = 'none';
        });
        png = await stage.screenshot({ type: 'png' });
        note = ' (sin puntos de fondo)';
      }
      if (png.length > MAX_BYTES) {
        // Sigue grande (degradados): se reduce a paleta indexada, lo bastante fiel para una miniatura.
        const reduced = quantizePng(png, MAX_BYTES);
        png = reduced.buffer;
        note += ` (paleta de ${reduced.colors} colores)`;
      }
      writeFileSync(resolve(OUT_DIR, `${finalId}.png`), png);
      report.push({ id: finalId, bytes: png.length, scale, note });

      // Reestablece la página para el siguiente componente.
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.evaluate(() => document.querySelector('.nav__actions a.btn--primary')?.click());
      await page.waitForTimeout(300);
      await page.evaluate(() =>
        [...document.querySelectorAll('nav[aria-label="Módulos del estudio"] a')].find((a) => a.textContent.includes('Componentes'))?.click()
      );
      await page.locator('#components-heading').waitFor();
      await page.addStyleTag({ content: CAPTURE_CSS });
    }
    if (errors.length > 0) console.warn('Errores de página durante la captura:', errors.slice(0, 3));
  } finally {
    await browser.close();
    await server.close();
  }

  console.log('\nMiniaturas generadas en public/components/');
  let tooBig = 0;
  for (const r of report) {
    const kb = (r.bytes / 1024).toFixed(1);
    const bad = r.bytes > MAX_BYTES;
    if (bad) tooBig++;
    console.log(`  ${bad ? 'GRANDE' : 'ok    '} ${r.id.padEnd(18)} ${kb.padStart(5)} KB  zoom ${r.scale}${r.note}`);
  }
  for (const r of report) statSync(resolve(OUT_DIR, `${r.id}.png`));
  if (tooBig > 0) {
    console.error(`\n${tooBig} imagen(es) superan ${MAX_BYTES / 1024} KB.`);
    process.exit(1);
  }
  console.log(`\n${report.length} miniaturas, todas ≤ ${MAX_BYTES / 1024} KB.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
