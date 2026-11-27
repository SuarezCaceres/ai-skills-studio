/**
 * Genera las miniaturas de la página «Páginas» (spec 007) a partir de las PROPIAS plantillas.
 *
 * Arranca un servidor de Vite, abre cada página de referencia en su modal y copia la plantilla ya
 * pintada a un lienzo fijo de 1280 × 800 px (vista de escritorio). La captura se hace con
 * `deviceScaleFactor: 0.5`, así que cada miniatura sale a 640 × 400 px. Guarda `public/pages/<id>.png`;
 * si pasa de 40 KB la reduce a paleta indexada (sin dependencias) y, si aun así no cabe, falla.
 *
 * GitHub se intercepta y cualquier otro origen externo se bloquea: nunca sale nada a la red.
 *
 * Uso:  node scripts/capture-pages.mjs [--only=dashboard,precios]
 */
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { mkdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { quantizePng } from './lib/png-quantize.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = resolve(ROOT, 'public', 'pages');
const PORT = 5192;
const CANVAS = { width: 1280, height: 800 };
const MAX_BYTES = 40 * 1024;

const only = (process.argv.find((a) => a.startsWith('--only=')) ?? '').slice('--only='.length).split(',').filter(Boolean);

const CAPTURE_CSS = '*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}';

async function openPagesRoute(page, origin) {
  await page.goto(`${origin}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);
  await page.evaluate(() => document.querySelector('.nav__actions a.btn--primary')?.click());
  await page.waitForTimeout(400);
  await page.evaluate(() =>
    [...document.querySelectorAll('nav[aria-label="Módulos del estudio"] a')].find((a) => a.textContent.trim().startsWith('Páginas'))?.click()
  );
  await page.locator('#pages-heading').waitFor();
  await page.addStyleTag({ content: CAPTURE_CSS });
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
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 0.5, reducedMotion: 'reduce' });
    // Todo lo que no sea el servidor local se corta; GitHub responde vacío.
    await context.route('**/*', (route) => {
      const url = new URL(route.request().url());
      if (url.origin === origin) return route.continue();
      if (url.hostname === 'api.github.com') return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      return route.abort();
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));

    const { PAGE_CATALOG } = await server.ssrLoadModule('/src/data/pageCatalog.ts');
    if (PAGE_CATALOG.length === 0) throw new Error('El catálogo de páginas está vacío.');

    for (const { id, name } of PAGE_CATALOG) {
      if (only.length > 0 && !only.includes(id)) continue;
      await openPagesRoute(page, origin);
      await page.locator(`[data-testid="pagina-tarjeta"][data-page-id="${id}"]`).click();
      const region = page.getByRole('region', { name: `Vista previa de ${name}` });
      await region.waitFor();
      // Espera a que la plantilla diferida sustituya al «Cargando».
      await page.waitForFunction((n) => {
        const r = [...document.querySelectorAll('[role="region"]')].find((el) => el.getAttribute('aria-label') === `Vista previa de ${n}`);
        return r && r.querySelector('.\\@container');
      }, name);
      await page.waitForTimeout(250);

      // Copia la plantilla pintada a un lienzo fijo de escritorio, por encima de todo.
      await page.evaluate(
        ({ n, w, h }) => {
          const r = [...document.querySelectorAll('[role="region"]')].find((el) => el.getAttribute('aria-label') === `Vista previa de ${n}`);
          const root = r.querySelector('.\\@container');
          const canvas = document.createElement('div');
          canvas.id = 'captura-pagina';
          canvas.style.cssText = `position:fixed;left:0;top:0;width:${w}px;height:${h}px;overflow:hidden;z-index:2147483647;background:#0a0d14`;
          canvas.appendChild(root.cloneNode(true));
          document.body.appendChild(canvas);
        },
        { n: name, w: CANVAS.width, h: CANVAS.height }
      );
      await page.waitForTimeout(150);

      let png = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, ...CANVAS } });
      let note = '';
      if (png.length > MAX_BYTES) {
        const reduced = quantizePng(png, MAX_BYTES);
        png = reduced.buffer;
        note = ` (paleta de ${reduced.colors} colores)`;
      }
      writeFileSync(resolve(OUT_DIR, `${id}.png`), png);
      report.push({ id, bytes: png.length, note });
    }
    if (errors.length > 0) console.warn('Errores de página durante la captura:', errors.slice(0, 3));
  } finally {
    await browser.close();
    await server.close();
  }

  console.log('\nMiniaturas generadas en public/pages/');
  let tooBig = 0;
  for (const r of report) {
    const bad = r.bytes > MAX_BYTES;
    if (bad) tooBig++;
    console.log(`  ${bad ? 'GRANDE' : 'ok    '} ${r.id.padEnd(16)} ${(r.bytes / 1024).toFixed(1).padStart(5)} KB${r.note}`);
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
