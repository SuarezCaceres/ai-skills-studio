/**
 * Genera la captura de la página Catálogo para la sección «Guía vs. sin guía» de la portada (spec 005).
 *
 * Arranca un servidor de Vite (puerto 5195) con el catálogo configurado, abre la página Catálogo en un Chromium
 * sin cabeza a 1280 × 800 y fotografía el viewport. A la vez mide, con `boundingBox()`, las tres zonas que la guía
 * señala: el buscador, el grupo de categorías y la primera tarjeta de skill. Las cajas se escriben en porcentajes
 * de la captura (con un pequeño margen) en `src/data/guideShowcaseHotspots.ts`, así foco y tooltip no se
 * desalinean al escalar la imagen. La captura se convierte a WebP sin dependencias nuevas (un `<canvas>` de
 * Chromium) y se guarda en `src/assets/guide/catalogo.webp`; si no cabe en 60 KB, el script falla.
 *
 * GitHub se intercepta con el catálogo simulado de `scripts/lib/guide-showcase-fixture.mjs`: nunca se toca
 * `api.github.com`. Si la app pide algo que el fixture no atiende (GitHub u otro dominio externo), el script
 * falla con un mensaje claro. La fecha se fija y se desactivan animaciones y fondo decorativo, como en
 * `capture-components.mjs`, para que la captura salga igual cada vez.
 *
 * Uso:  node scripts/capture-guide-showcase.mjs
 */
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { mkdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GUIDE_FIXED_NOW, GUIDE_SKILLS, installGuideShowcaseGithub } from './lib/guide-showcase-fixture.mjs';
import { TEST_CATALOG_REPO, TEST_CLIENT_ID, TEST_OAUTH_URL } from './lib/github-fixture.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const WEBP_FILE = resolve(ROOT, 'src', 'assets', 'guide', 'catalogo.webp');
const HOTSPOTS_FILE = resolve(ROOT, 'src', 'data', 'guideShowcaseHotspots.ts');
const PORT = 5195;
const WIDTH = 1280;
const HEIGHT = 800;
const MAX_BYTES = 60 * 1024;
/** Calidades WebP que se prueban, de mayor a menor, hasta que la imagen quepa en `MAX_BYTES`. */
const QUALITIES = [0.82, 0.78, 0.74, 0.7, 0.66, 0.62, 0.58, 0.54, 0.5];
/** Margen alrededor de cada caja medida, en puntos porcentuales de cada eje. */
const MARGIN_PCT = 0.75;

// Sin animaciones, y sin el fondo decorativo de la app (fijo y con z-index: se pintaría sobre la captura).
const CAPTURE_CSS =
  '*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}' +
  'div.pointer-events-none.fixed.inset-0.z-0{display:none!important}';

const round2 = (n) => Math.round(n * 100) / 100;
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

/** Caja (px) que envuelve a todos los hijos visibles que cumplen `selector` dentro de `locator`. */
async function unionOfChildren(locator, selector) {
  return locator.evaluate((el, sel) => {
    const rects = [...el.querySelectorAll(sel)]
      .map((child) => child.getBoundingClientRect())
      .filter((r) => r.width > 0 && r.height > 0);
    if (rects.length === 0) return null;
    const x = Math.min(...rects.map((r) => r.left));
    const y = Math.min(...rects.map((r) => r.top));
    const right = Math.max(...rects.map((r) => r.right));
    const bottom = Math.max(...rects.map((r) => r.bottom));
    return { x, y, width: right - x, height: bottom - y };
  }, selector);
}

/** Caja de `boundingBox()` (px) → porcentajes de la captura, con margen y recortada a 0–100. */
function toPercentBox(px) {
  const x0 = clamp(((px.x / WIDTH) * 100) - MARGIN_PCT, 0, 100);
  const y0 = clamp(((px.y / HEIGHT) * 100) - MARGIN_PCT, 0, 100);
  const x1 = clamp((((px.x + px.width) / WIDTH) * 100) + MARGIN_PCT, 0, 100);
  const y1 = clamp((((px.y + px.height) / HEIGHT) * 100) + MARGIN_PCT, 0, 100);
  return { x: round2(x0), y: round2(y0), w: round2(x1 - x0), h: round2(y1 - y0) };
}

function assertBox(id, box) {
  const inside = box.x >= 0 && box.y >= 0 && box.x + box.w <= 100.0001 && box.y + box.h <= 100.0001;
  if (!inside || box.w <= 0 || box.h <= 0) {
    throw new Error(
      `La caja «${id}» no es válida (${JSON.stringify(box)}): debe quedar dentro de 0–100 % y tener área > 0. ` +
        'Probablemente el elemento no cabe en el viewport de 1280 × 800.'
    );
  }
}

/** Convierte un PNG a WebP con un `<canvas>` de Chromium. Baja la calidad hasta que pese ≤ `MAX_BYTES`. */
async function pngToWebp(browser, png) {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    const tried = [];
    for (const quality of QUALITIES) {
      const dataUrl = await page.evaluate(
        async ({ b64, q }) => {
          const blob = await (await fetch(`data:image/png;base64,${b64}`)).blob();
          const bitmap = await createImageBitmap(blob);
          const canvas = document.createElement('canvas');
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          canvas.getContext('2d').drawImage(bitmap, 0, 0);
          return canvas.toDataURL('image/webp', q);
        },
        { b64: png.toString('base64'), q: quality }
      );
      if (!dataUrl.startsWith('data:image/webp')) {
        throw new Error(`Chromium no generó WebP (devolvió «${dataUrl.slice(0, 24)}…»); no se guarda un formato equivocado.`);
      }
      const buffer = Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');
      tried.push(`${quality} → ${(buffer.length / 1024).toFixed(1)} KB`);
      if (buffer.length <= MAX_BYTES) return { buffer, quality };
    }
    throw new Error(`Ni con la calidad más baja el WebP cabe en ${MAX_BYTES / 1024} KB. Probado: ${tried.join(', ')}.`);
  } finally {
    await context.close();
  }
}

function hotspotsModule(boxes) {
  const row = ([id, step]) => {
    const b = boxes[id];
    return `    { id: '${id}', step: ${step}, box: { x: ${b.x}, y: ${b.y}, w: ${b.w}, h: ${b.h} } },`;
  };
  return [
    '// Generado por scripts/capture-guide-showcase.mjs — no editar a mano.',
    "import type { GuideCaptureMeta } from '../types/guideShowcase';",
    '',
    'export const GUIDE_CAPTURE: GuideCaptureMeta = {',
    `  width: ${WIDTH},`,
    `  height: ${HEIGHT},`,
    '  hotspots: [',
    ...[['buscar', 1], ['filtrar', 2], ['abrir', 3]].map(row),
    '  ],',
    '};',
    '',
  ].join('\n');
}

async function main() {
  // Variables que la app lee al arrancar: sin ellas el Catálogo no está configurado. Mandan sobre cualquier `.env*`.
  process.env.VITE_CATALOG_REPO = TEST_CATALOG_REPO;
  process.env.VITE_GITHUB_CLIENT_ID = TEST_CLIENT_ID;
  process.env.VITE_GITHUB_OAUTH_URL = TEST_OAUTH_URL;

  const server = await createServer({
    root: ROOT,
    logLevel: 'error',
    server: { port: PORT, host: '127.0.0.1', strictPort: true },
  });
  await server.listen();
  const origin = `http://127.0.0.1:${PORT}`;

  const browser = await chromium.launch({ headless: true });
  let result;
  let guard;
  try {
    const context = await browser.newContext({
      viewport: { width: WIDTH, height: HEIGHT },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    });
    await context.clock.setFixedTime(GUIDE_FIXED_NOW);
    guard = await installGuideShowcaseGithub(context, { localOrigin: origin });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

    await page.goto(`${origin}/`, { waitUntil: 'domcontentloaded' });
    await page.locator('.nav__actions a.btn--primary').click();
    await page.locator('.nav__links a:has-text("Catálogo")').click();
    await page.locator('#catalog-page-heading').waitFor();
    await page.addStyleTag({ content: CAPTURE_CSS });

    // Tarjetas pintadas: sin esqueletos de carga ni mensajes de error, y con sus avatares ya cargados.
    const cards = page.locator('section[aria-labelledby="catalog-page-heading"] ul article');
    await cards.first().waitFor({ timeout: 10_000 });
    const expected = GUIDE_SKILLS.length;
    const count = await cards.count();
    if (count !== expected) throw new Error(`Se esperaban ${expected} tarjetas y hay ${count}: el catálogo simulado no se cargó entero.`);
    if ((await page.locator('[role="alert"]').count()) > 0) throw new Error('La página del Catálogo muestra un error.');
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(
        [...document.images].map((img) => (img.complete ? null : new Promise((ok) => ((img.onload = ok), (img.onerror = ok)))))
      );
    });
    // Un fotograma más para que el layout termine de asentarse tras fuentes e imágenes.
    await page.evaluate(() => new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok))));
    await page.mouse.move(WIDTH - 1, HEIGHT - 1);
    await page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur());

    // Las tres zonas que señala la guía.
    const targets = {
      buscar: page.getByLabel('Buscar en el catálogo'),
      filtrar: page.getByRole('group', { name: 'Categorías' }),
      abrir: cards.first(),
    };
    const boxes = {};
    for (const [id, locator] of Object.entries(targets)) {
      // El grupo de categorías ocupa todo el ancho de la fila; la guía debe señalar solo los chips.
      const px = id === 'filtrar' ? await unionOfChildren(locator, 'button') : await locator.boundingBox();
      if (!px) throw new Error(`No se pudo medir la zona «${id}»: el elemento no está visible.`);
      boxes[id] = toPercentBox(px);
      assertBox(id, boxes[id]);
    }

    const png = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
    guard.assertNoRealNetwork();
    if (errors.length > 0) console.warn('Errores de página durante la captura:', errors.slice(0, 3));

    const webp = await pngToWebp(browser, png);
    result = { webp, boxes, served: guard.report.served };
  } catch (err) {
    // Si la causa es una petición que el fixture no atiende, se dice eso y no un simple «timeout».
    guard?.assertNoRealNetwork();
    throw err;
  } finally {
    await browser.close();
    await server.close();
  }

  mkdirSync(dirname(WEBP_FILE), { recursive: true });
  writeFileSync(WEBP_FILE, result.webp.buffer);
  writeFileSync(HOTSPOTS_FILE, hotspotsModule(result.boxes));

  const bytes = statSync(WEBP_FILE).size;
  console.log('\nCaptura del Catálogo generada');
  console.log(`  src/assets/guide/catalogo.webp  ${(bytes / 1024).toFixed(1)} KB (calidad ${result.webp.quality}, límite ${MAX_BYTES / 1024} KB)`);
  console.log(`  src/data/guideShowcaseHotspots.ts  ${WIDTH}×${HEIGHT}`);
  for (const [id, b] of Object.entries(result.boxes)) {
    console.log(`    ${id.padEnd(7)} x ${String(b.x).padStart(5)} %  y ${String(b.y).padStart(5)} %  w ${String(b.w).padStart(5)} %  h ${String(b.h).padStart(5)} %`);
  }
  console.log(`  Red: ${result.served} peticiones atendidas por el fixture, 0 reales.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
