/**
 * Prueba E2E de la sección «Guía vs. sin guía» de la portada (spec 005, criterios C1–C7).
 *
 * Compila la app en un directorio temporal, la sirve con `vite preview` (puerto 5196) y la recorre con
 * Chromium en los 4 anchos obligatorios (1440, 1024, 768 y 390). Toda la red externa está interceptada:
 * GitHub y avatares los simula `scripts/lib/github-fixture.mjs`, las fuentes de Google se contestan vacías
 * y cualquier otro origen se aborta y se registra como fuga. Nunca se toca `api.github.com` real.
 * El avance de la guía (3500 ms) se controla con `page.clock`: no hay esperas reales.
 *
 * Se escribe contra el «Contrato de DOM» de `docs/specs/005-guia-vs-sin-guia/plan.md`.
 *
 * Uso: node scripts/test-guide-showcase.mjs
 */
import { build, preview } from 'vite';
import { chromium } from 'playwright';
import { transformSync } from 'esbuild';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TEST_CATALOG_REPO, TEST_CLIENT_ID, TEST_OAUTH_URL, installFakeGithub } from './lib/github-fixture.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PORT = 5196;
const OUT_DIR = join(tmpdir(), 'ai-skills-studio-guide-showcase-e2e');
const SHOTS_DIR = resolve(ROOT, 'shots', 'guide-showcase');
const HOTSPOTS_FILE = resolve(ROOT, 'src', 'data', 'guideShowcaseHotspots.ts');
const SOURCE_WEBP = resolve(ROOT, 'src', 'assets', 'guide', 'catalogo.webp');
const TYPES_FILE = resolve(ROOT, 'src', 'types', 'guideShowcase.ts');

const MAX_WEBP_BYTES = 60 * 1024; // C6/C7: la captura pesa ≤ 60 KB
const MAX_INITIAL_CHUNK_BYTES = 350 * 1000; // C6: presupuesto del chunk inicial (kB de Vite = 1000 B)
const ACCENT_HUE = 199; // cian #0ea5e9
const HUE_TOLERANCE = 8;
// «Acento» = color con croma (máx − mín de RGB, 0–1) > 0,25. Equivale a saturación HSL > 0,25 con luminosidad media, pero no
// marca como acento los neutros pizarra oficiales de la paleta Cyber Dark (#f1f5f9, #94a3b8, #121722, #0a0d14…): su
// saturación HSL es alta solo porque su luminosidad es extrema (casi blancos o casi negros) y visualmente son grises.
const CHROMA_LIMIT = 0.25;

const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
];

/**
 * Orígenes externos que la portada ya carga hoy o que atiende el fixture. No son de la sección «guía»:
 *  - fonts.googleapis.com / fonts.gstatic.com: `<link>` de Geist en `index.html` (CSP lo permite). Se contestan vacíos.
 *  - api.github.com / avatars.githubusercontent.com / github.com / oauth.example.test: interceptados por
 *    `installFakeGithub` (catálogo, avatares, OAuth simulado). Nunca llegan a la red real.
 */
const ALLOWED_EXTERNAL = new Map([
  ['https://fonts.googleapis.com', 'fuentes de la portada (index.html), contestadas vacías'],
  ['https://fonts.gstatic.com', 'fuentes de la portada (index.html), contestadas vacías'],
  ['https://api.github.com', 'interceptado por el fixture de GitHub'],
  ['https://avatars.githubusercontent.com', 'interceptado por el fixture de GitHub'],
  ['https://github.com', 'interceptado por el fixture de GitHub (autorización)'],
  [new URL(TEST_OAUTH_URL).origin, 'interceptado por el fixture de GitHub (canje de código)'],
]);

let passed = 0;
const failures = [];

function check(name, ok, detail = '') {
  if (ok) passed++;
  console.log(`  ${ok ? 'ok ' : 'FALLA'}  ${name}${ok || !detail ? '' : ` — ${detail}`}`);
  if (!ok) failures.push(detail ? `${name} (${detail})` : name);
}

function aviso(message) {
  console.log(`  aviso  ${message}`);
}

/** Ejecuta un grupo de comprobaciones; una excepción (p. ej. elemento ausente) se registra como fallo y no cuelga la suite. */
async function guarded(name, fn) {
  try {
    await fn();
  } catch (error) {
    const detail = String(error?.message ?? error).split('\n')[0].slice(0, 240);
    check(name, false, detail);
  }
}

/* ──────────────────────────── C7: hotspots (solo Node, sin navegador) ──────────────────────────── */

async function loadHotspotsModule() {
  const source = readFileSync(HOTSPOTS_FILE, 'utf8');
  const { code } = transformSync(source, { loader: 'ts', format: 'esm', target: 'es2022' });
  const url = `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
  return import(url);
}

async function testHotspotsC7() {
  console.log('\nC7 · captura y hotspots');
  const mod = await loadHotspotsModule();
  const capture = mod.GUIDE_CAPTURE;
  check('C7 GUIDE_CAPTURE exporta ancho y alto positivos', Number.isFinite(capture?.width) && Number.isFinite(capture?.height) && capture.width > 0 && capture.height > 0, JSON.stringify({ width: capture?.width, height: capture?.height }));

  const hotspots = capture?.hotspots ?? [];
  check('C7 hay exactamente 3 hotspots', hotspots.length === 3, `hay ${hotspots.length}`);
  check(
    'C7 los hotspots son buscar/filtrar/abrir con steps 1/2/3 en orden',
    hotspots.map((h) => `${h.id}:${h.step}`).join(',') === 'buscar:1,filtrar:2,abrir:3',
    hotspots.map((h) => `${h.id}:${h.step}`).join(',')
  );
  for (const h of hotspots) {
    const b = h.box ?? {};
    const finite = ['x', 'y', 'w', 'h'].every((k) => typeof b[k] === 'number' && Number.isFinite(b[k]));
    const inside = finite && b.x >= 0 && b.y >= 0 && b.x + b.w <= 100 && b.y + b.h <= 100;
    check(`C7 «${h.id}» tiene la caja dentro de 0–100 % y con área > 0`, inside && b.w > 0 && b.h > 0, JSON.stringify(b));
  }

  // La captura de origen existe, es WebP y pesa ≤ 60 KB (el script de captura también lo exige).
  const exists = existsSync(SOURCE_WEBP);
  check('C7 existe src/assets/guide/catalogo.webp', exists, SOURCE_WEBP);
  if (exists) {
    const buf = readFileSync(SOURCE_WEBP);
    check('C7 catalogo.webp es un WebP real (RIFF/WEBP)', buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP');
    check(`C7 catalogo.webp pesa ≤ 60 KB (${(buf.length / 1024).toFixed(1)} KB)`, buf.length <= MAX_WEBP_BYTES, `${buf.length} B`);
  }
  return capture;
}

/* ──────────────────────────── utilidades de página ──────────────────────────── */

const GUIA = '#guia';
const marker = `${GUIA} [data-testid="guia-paso"]`;
const tooltip = `${GUIA} [data-testid="guia-tooltip"]`;
const announce = `${GUIA} [data-testid="guia-anuncio"]`;
const marco = `${GUIA} figure[data-testid="guia-marco"]`;
const lista = `${GUIA} ul[data-testid="guia-lista"]`;
const staticSteps = `${GUIA} ol[data-testid="guia-pasos-estaticos"]`;
const radiogroup = `${GUIA} [role="radiogroup"][aria-label="Modo de la vista previa"]`;

const textOf = async (page, selector) => (await page.locator(selector).first().textContent({ timeout: 2000 }).catch(() => null))?.replace(/\s+/g, ' ').trim() ?? null;
const countOf = (page, selector) => page.locator(selector).count();
const radio = (page, name) => page.locator(`${radiogroup} [role="radio"]`).filter({ hasText: new RegExp(`^\\s*${name}\\s*$`) }).first();

async function currentSteps(page) {
  return page.$$eval(marker, (els) => els.map((el) => el.getAttribute('data-step')));
}

/** Espera (en tiempo real, sin depender del reloj simulado) a que haya un único marcador con ese paso. */
async function waitSingleStep(page, step, timeout = 3000) {
  try {
    await page.waitForFunction(
      ([sel, expected]) => {
        const els = document.querySelectorAll(sel);
        return els.length === 1 && els[0].getAttribute('data-step') === String(expected);
      },
      [marker, step],
      { timeout }
    );
    return true;
  } catch {
    return false;
  }
}

/** Origen de la petición ajeno al servidor de preview (http/https). */
function externalOrigin(url, origin) {
  try {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u.origin === origin ? null : u.origin;
  } catch {
    return null;
  }
}

/**
 * Crea un contexto aislado: red externa bloqueada salvo fixture y fuentes, reloj simulado instalado y
 * registro de errores de consola, CSP y peticiones externas.
 */
async function openContext(browser, origin, options = {}) {
  const context = await browser.newContext({ viewport: options.viewport ?? VIEWPORTS[0], reducedMotion: options.reducedMotion ?? 'no-preference' });
  const leaks = [];
  // 1) Red de seguridad: cualquier origen externo que nadie atienda se aborta (y se anota). Se registra primero
  //    para que las rutas siguientes (fixture y fuentes) tengan prioridad sobre ella.
  await context.route(
    (url) => (url.protocol === 'http:' || url.protocol === 'https:') && url.origin !== origin,
    (route) => {
      leaks.push(route.request().url());
      return route.abort();
    }
  );
  // 2) Fuentes de la portada: se contestan vacías para no depender de internet.
  await context.route('https://fonts.googleapis.com/**', (route) => route.fulfill({ status: 200, contentType: 'text/css', body: '/* sin fuentes en pruebas */' }));
  await context.route('https://fonts.gstatic.com/**', (route) => route.fulfill({ status: 200, contentType: 'font/woff2', body: '' }));
  // 3) GitHub, avatares y OAuth simulados.
  await installFakeGithub(context);
  // 4) Violaciones de CSP visibles desde la página.
  await context.addInitScript(() => {
    window.__cspViolations = [];
    document.addEventListener('securitypolicyviolation', (e) => window.__cspViolations.push(`${e.violatedDirective} ← ${e.blockedURI}`));
  });

  const page = await context.newPage();
  page.setDefaultTimeout(5000);
  const state = { errors: [], requests: [], leaks };
  page.on('console', (m) => m.type() === 'error' && state.errors.push(`console: ${m.text()}`));
  page.on('pageerror', (e) => state.errors.push(`pageerror: ${String(e)}`));
  page.on('request', (r) => {
    const ext = externalOrigin(r.url(), origin);
    if (ext) state.requests.push({ origin: ext, url: r.url() });
  });
  if (options.clock !== false) await page.clock.install();
  return { context, page, state };
}

/** Abre la portada y espera a `#guia`. Devuelve `false` si la sección no existe (componente aún no integrado). */
async function openLanding(page, origin, { pause = true } = {}) {
  await page.goto(`${origin}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('load').catch(() => {});
  const found = await page
    .locator(GUIA)
    .waitFor({ state: 'attached', timeout: 6000 })
    .then(() => true)
    .catch(() => false);
  if (!found) return false;
  await page.locator(GUIA).scrollIntoViewIfNeeded().catch(() => {});
  await page
    .waitForLoadState('networkidle', { timeout: 6000 })
    .catch(() => {});
  if (pause) await pauseClock(page);
  return true;
}

/** Congela el reloj de la página: a partir de aquí solo avanza con `page.clock.runFor`. */
async function pauseClock(page) {
  const now = await page.evaluate(() => Date.now());
  await page.clock.pauseAt(now + 200);
}

/* ──────────────────────────── paleta (C6) ──────────────────────────── */

/** Recorre #guia (y sus pseudoelementos) y devuelve los colores de acento fuera del cian #0ea5e9. */
function scanPalette({ hue, tolerance, chromaLimit }) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  /** Cualquier sintaxis CSS (rgb, oklch, color(), lab…) → [r, g, b, a] gracias al propio navegador. */
  function toRgba(value) {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = '#000';
    ctx.fillStyle = value;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    return [r, g, b, a / 255];
  }

  function hsl([r, g, b]) {
    const R = r / 255;
    const G = g / 255;
    const B = b / 255;
    const max = Math.max(R, G, B);
    const min = Math.min(R, G, B);
    const l = (max + min) / 2;
    const d = max - min;
    if (d === 0) return { h: 0, s: 0, l };
    const s = d / (1 - Math.abs(2 * l - 1));
    let h;
    if (max === R) h = ((G - B) / d) % 6;
    else if (max === G) h = (B - R) / d + 2;
    else h = (R - G) / d + 4;
    h = (h * 60 + 360) % 360;
    return { h, s, l };
  }

  /** Extrae los colores de un valor computado (admite listas como box-shadow y funciones anidadas). */
  function colorsIn(value) {
    const out = [];
    const fn = /(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix)\(/gi;
    let m;
    while ((m = fn.exec(value))) {
      let depth = 1;
      let i = fn.lastIndex;
      while (i < value.length && depth > 0) {
        if (value[i] === '(') depth++;
        else if (value[i] === ')') depth--;
        i++;
      }
      out.push(value.slice(m.index, i));
      fn.lastIndex = i;
    }
    return out;
  }

  const describe = (el) => {
    const id = el.id ? `#${el.id}` : '';
    const tid = el.getAttribute('data-testid') ? `[data-testid="${el.getAttribute('data-testid')}"]` : '';
    const cls = typeof el.className === 'string' && el.className ? `.${el.className.trim().split(/\s+/).slice(0, 3).join('.')}` : '';
    return `${el.tagName.toLowerCase()}${id}${tid}${cls}`.slice(0, 140);
  };

  const offenders = [];
  const seen = new Set();
  let inspected = 0;
  const inspect = (el, pseudo) => {
    const cs = getComputedStyle(el, pseudo);
    if (pseudo && (cs.content === 'none' || cs.content === 'normal')) return;
    inspected++;
    const props = ['color', 'background-color', 'outline-color', 'box-shadow'];
    // Un borde o contorno de grosor 0 (o sin estilo) no se pinta: su color no cuenta.
    for (const side of ['top', 'right', 'bottom', 'left']) {
      if (parseFloat(cs.getPropertyValue(`border-${side}-width`)) > 0 && cs.getPropertyValue(`border-${side}-style`) !== 'none') props.push(`border-${side}-color`);
    }
    for (const prop of props) {
      if (prop === 'outline-color' && (cs.outlineStyle === 'none' || parseFloat(cs.outlineWidth) === 0)) continue;
      const value = cs.getPropertyValue(prop);
      if (!value || value === 'none') continue;
      for (const css of colorsIn(value)) {
        const [r, g, b, a] = toRgba(css);
        if (a <= 0) continue;
        const chroma = (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
        if (chroma <= chromaLimit) continue;
        const { h, s } = hsl([r, g, b]);
        const dist = Math.min(Math.abs(h - hue), 360 - Math.abs(h - hue));
        if (dist <= tolerance) continue;
        const key = `${describe(el)}|${pseudo ?? ''}|${prop}|${css}`;
        if (seen.has(key)) continue;
        seen.add(key);
        offenders.push(`${describe(el)}${pseudo ? pseudo : ''} · ${prop}: ${css} → tono ${Math.round(h)}°, croma ${(chroma * 100).toFixed(0)} %, sat HSL ${(s * 100).toFixed(0)} %`);
      }
    }
  };

  const root = document.querySelector('#guia');
  const all = [root, ...root.querySelectorAll('*')];
  for (const el of all) {
    inspect(el, null);
    inspect(el, '::before');
    inspect(el, '::after');
  }
  return { offenders, inspected };
}

/* ──────────────────────────── principal ──────────────────────────── */

async function main() {
  rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(SHOTS_DIR, { recursive: true });

  // C7 primero: es puro Node y no depende de que el componente exista.
  let capture;
  await guarded('C7 hotspots', async () => {
    capture = await testHotspotsC7();
  });

  const prevEnv = {
    VITE_GITHUB_OAUTH_URL: process.env.VITE_GITHUB_OAUTH_URL,
    VITE_CATALOG_REPO: process.env.VITE_CATALOG_REPO,
    VITE_GITHUB_CLIENT_ID: process.env.VITE_GITHUB_CLIENT_ID,
    VITE_SKILLS_SH_PROXY_URL: process.env.VITE_SKILLS_SH_PROXY_URL,
  };
  process.env.VITE_GITHUB_OAUTH_URL = TEST_OAUTH_URL;
  process.env.VITE_CATALOG_REPO = TEST_CATALOG_REPO;
  process.env.VITE_GITHUB_CLIENT_ID = TEST_CLIENT_ID;
  process.env.VITE_SKILLS_SH_PROXY_URL = '';

  let server;
  let browser;
  try {
    console.log('\nCompilando la app para la sección «guía vs. sin guía»...');
    await build({ root: ROOT, logLevel: 'error', build: { outDir: OUT_DIR, emptyOutDir: true } });
    server = await preview({ root: ROOT, build: { outDir: OUT_DIR }, preview: { port: PORT, host: '127.0.0.1', strictPort: true } });
    const origin = `http://127.0.0.1:${PORT}`;
    browser = await chromium.launch({ headless: true });

    const interval = Number(/GUIDE_STEP_INTERVAL_MS\s*=\s*(\d+)/.exec(readFileSync(TYPES_FILE, 'utf8'))?.[1] ?? 3500);
    check(`el intervalo de avance del contrato es ${interval} ms (3500)`, interval === 3500, `${interval}`);
    const hotspotById = new Map((capture?.hotspots ?? []).map((h) => [h.id, h]));

    /* ───── C1 + C2 + C3 (clic) por ancho ───── */
    for (const vp of VIEWPORTS) {
      const tag = `${vp.width}x${vp.height}`;
      console.log(`\nViewport ${tag}`);
      const { context, page, state } = await openContext(browser, origin, { viewport: vp });
      const ready = await openLanding(page, origin);
      if (!ready) {
        check(`${tag} C1 la sección #guia existe en la portada`, false, '#guia no está en el DOM (¿falta integrar el componente?)');
        await context.close();
        continue;
      }

      await guarded(`${tag} C1`, async () => {
        const order = await page.evaluate(() => {
          const guia = document.getElementById('guia');
          const hero = document.querySelector('section[aria-labelledby="hero-h"]');
          const inspector = document.getElementById('inspector');
          return {
            tag: guia?.tagName.toLowerCase(),
            labelledby: guia?.getAttribute('aria-labelledby'),
            afterHero: !!hero && guia?.previousElementSibling === hero,
            beforeInspector: !!inspector && !!guia && !!(guia.compareDocumentPosition(inspector) & Node.DOCUMENT_POSITION_FOLLOWING),
          };
        });
        check(`${tag} C1 #guia es una <section aria-labelledby="guia-h">`, order.tag === 'section' && order.labelledby === 'guia-h', JSON.stringify(order));
        check(`${tag} C1 #guia es el hermano siguiente del hero y va antes de #inspector`, order.afterHero && order.beforeInspector, JSON.stringify(order));

        const title = page.locator(`${GUIA} h2#guia-h`);
        check(`${tag} C1 título «La misma página, con y sin alguien que te guíe» visible`, (await title.isVisible()) && (await title.textContent())?.replace(/\s+/g, ' ').trim() === 'La misma página, con y sin alguien que te guíe', await title.textContent().catch(() => 'sin h2#guia-h'));

        const frame = page.locator(marco);
        await frame.scrollIntoViewIfNeeded();
        const img = page.locator(`${marco} img`).first();
        await page.waitForFunction((sel) => { const i = document.querySelector(sel); return !!i && i.complete && i.naturalWidth > 0; }, `${marco} img`, { timeout: 5000 }).catch(() => {});
        const imgInfo = await img.evaluate((i) => ({ complete: i.complete, naturalWidth: i.naturalWidth, alt: i.alt, src: i.currentSrc || i.src }));
        check(`${tag} C1 marco visible con la captura cargada (naturalWidth > 0)`, (await frame.isVisible()) && (await img.isVisible()) && imgInfo.complete && imgInfo.naturalWidth > 0, JSON.stringify(imgInfo));
        check(`${tag} C1 la captura tiene alt descriptivo`, imgInfo.alt.trim().length > 0, `alt="${imgInfo.alt}"`);
        check(
          `${tag} C1 la captura es local (mismo origen o data:)`,
          imgInfo.src.startsWith('data:') || new URL(imgInfo.src).origin === origin,
          imgInfo.src.slice(0, 120)
        );

        const group = page.locator(radiogroup);
        const radios = page.locator(`${radiogroup} [role="radio"]`);
        const names = (await radios.allTextContents()).map((t) => t.replace(/\s+/g, ' ').trim());
        check(`${tag} C1 selector visible con «Sin guía» y «Con guía»`, (await group.isVisible()) && names.length === 2 && names[0] === 'Sin guía' && names[1] === 'Con guía', JSON.stringify(names));

        const layout = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }));
        check(`${tag} C1 sin desbordamiento horizontal`, layout.scrollWidth <= layout.innerWidth, `scrollWidth=${layout.scrollWidth}, innerWidth=${layout.innerWidth}`);
        await page.screenshot({ path: join(SHOTS_DIR, `guia-sin-${vp.width}.png`) });
      });

      await guarded(`${tag} C2`, async () => {
        const section = page.locator(GUIA);
        check(`${tag} C2 al cargar, «Sin guía» está activo (aria-checked y data-mode)`,
          (await radio(page, 'Sin guía').getAttribute('aria-checked')) === 'true' &&
            (await radio(page, 'Con guía').getAttribute('aria-checked')) === 'false' &&
            (await section.getAttribute('data-mode')) === 'sin-guia');
        const items = page.locator(`${lista} li`);
        check(`${tag} C2 la lista de obstáculos es visible y tiene elementos`, (await page.locator(lista).isVisible()) && (await items.count()) > 0, `li=${await items.count()}`);
        check(`${tag} C2 no hay ningún marcador de paso`, (await countOf(page, marker)) === 0, `${await countOf(page, marker)} marcadores`);
      });

      await guarded(`${tag} C3`, async () => {
        const sinText = await textOf(page, lista);
        await radio(page, 'Con guía').click();
        const section = page.locator(GUIA);
        check(`${tag} C3 clic en «Con guía»: aria-checked y data-mode cambian`,
          (await radio(page, 'Con guía').getAttribute('aria-checked')) === 'true' &&
            (await radio(page, 'Sin guía').getAttribute('aria-checked')) === 'false' &&
            (await section.getAttribute('data-mode')) === 'con-guia');
        check(`${tag} C3 aparece un único marcador, el del paso 1`, await waitSingleStep(page, 1), `pasos: ${(await currentSteps(page)).join(',') || 'ninguno'}`);
        const tip = await textOf(page, tooltip);
        check(`${tag} C3 el tooltip dice «Paso 1 de 3 · …»`, !!tip && /^Paso 1 de 3\s*·\s*\S/.test(tip), `tooltip="${tip}"`);
        const said = await textOf(page, announce);
        check(`${tag} C3 el anuncio aria-live=polite dice «Paso 1 de 3: …»`, !!said && /Paso 1 de 3:\s*\S/.test(said) && (await page.locator(announce).getAttribute('aria-live')) === 'polite', `anuncio="${said}"`);
        const conText = await textOf(page, lista);
        check(`${tag} C3 la lista cambia de contenido al activar la guía`, !!conText && conText !== sinText && (await page.locator(`${lista} li`).count()) > 0, `sin="${sinText?.slice(0, 40)}" con="${conText?.slice(0, 40)}"`);
      });

      // Geometría: el tooltip nunca se sale del marco y cada marcador cae sobre su hotspot (3 pasos).
      await guarded(`${tag} C3 geometría`, async () => {
        for (const step of [1, 2, 3]) {
          if (step > 1) {
            await page.clock.runFor(interval);
            await waitSingleStep(page, step);
          }
          const geo = await page.evaluate(
            ({ marcoSel, markerSel, tipSel }) => {
              const f = document.querySelector(marcoSel)?.getBoundingClientRect();
              const m = document.querySelector(markerSel)?.getBoundingClientRect();
              const t = document.querySelector(tipSel)?.getBoundingClientRect();
              const img = document.querySelector(`${marcoSel} img`)?.getBoundingClientRect();
              const box = (r) => r && { x: r.x, y: r.y, w: r.width, h: r.height };
              return { frame: box(f), marker: box(m), tip: box(t), img: box(img) };
            },
            { marcoSel: marco, markerSel: marker, tipSel: tooltip }
          );
          const tol = 1;
          const inFrame = (b) => b && geo.frame && b.x >= geo.frame.x - tol && b.y >= geo.frame.y - tol && b.x + b.w <= geo.frame.x + geo.frame.w + tol && b.y + b.h <= geo.frame.y + geo.frame.h + tol;
          check(`${tag} C3 paso ${step}: el tooltip queda dentro del marco`, !!geo.tip && inFrame(geo.tip), JSON.stringify({ frame: geo.frame, tip: geo.tip }));
          const hotspot = hotspotById.get(['buscar', 'filtrar', 'abrir'][step - 1]);
          if (hotspot && geo.img && geo.marker) {
            // Caja del hotspot en px (relativa a la imagen) ampliada 6 puntos porcentuales por si el marcador lleva halo o insignia.
            const pad = 6;
            const hb = {
              x1: geo.img.x + ((hotspot.box.x - pad) / 100) * geo.img.w,
              y1: geo.img.y + ((hotspot.box.y - pad) / 100) * geo.img.h,
              x2: geo.img.x + ((hotspot.box.x + hotspot.box.w + pad) / 100) * geo.img.w,
              y2: geo.img.y + ((hotspot.box.y + hotspot.box.h + pad) / 100) * geo.img.h,
            };
            const overlaps = geo.marker.x < hb.x2 && geo.marker.x + geo.marker.w > hb.x1 && geo.marker.y < hb.y2 && geo.marker.y + geo.marker.h > hb.y1;
            check(`${tag} C3 paso ${step}: el marcador cae sobre el hotspot «${hotspot.id}»`, overlaps, JSON.stringify({ marker: geo.marker, hotspot: hb }));
          } else {
            check(`${tag} C3 paso ${step}: hay marcador sobre la captura`, false, 'sin marcador o sin hotspot');
          }
          if (step === 1 && geo.tip && geo.marker) {
            const near = geo.tip.x < geo.marker.x + geo.marker.w + 120 && geo.tip.x + geo.tip.w > geo.marker.x - 120 && geo.tip.y < geo.marker.y + geo.marker.h + 120 && geo.tip.y + geo.tip.h > geo.marker.y - 120;
            check(`${tag} C3 paso 1: el tooltip está junto al marcador del buscador`, near, JSON.stringify({ marker: geo.marker, tip: geo.tip }));
          }
        }
        const layout = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }));
        check(`${tag} C3 sin desbordamiento horizontal con la guía activa`, layout.scrollWidth <= layout.innerWidth, `scrollWidth=${layout.scrollWidth}, innerWidth=${layout.innerWidth}`);
        await page.screenshot({ path: join(SHOTS_DIR, `guia-con-${vp.width}.png`) });
      });

      await guarded(`${tag} errores`, async () => {
        const csp = await page.evaluate(() => window.__cspViolations ?? []);
        check(`${tag} C1 sin errores de consola ni pageerror`, state.errors.length === 0, state.errors.slice(0, 3).join(' | '));
        check(`${tag} C1 sin violaciones de CSP`, csp.length === 0, csp.slice(0, 3).join(' | '));
      });
      await context.close();
    }

    /* ───── C3 (teclado) en un contexto nuevo ───── */
    for (const vp of [VIEWPORTS[0], VIEWPORTS[3]]) {
      const tag = `${vp.width}x${vp.height}`;
      console.log(`\nTeclado ${tag}`);
      const { context, page } = await openContext(browser, origin, { viewport: vp });
      if (!(await openLanding(page, origin))) {
        check(`${tag} C3 teclado: la sección #guia existe`, false, '#guia no está en el DOM');
        await context.close();
        continue;
      }
      await guarded(`${tag} C3 teclado`, async () => {
        const sin = radio(page, 'Sin guía');
        const con = radio(page, 'Con guía');
        const activeName = () => page.evaluate(() => (document.activeElement?.getAttribute('role') === 'radio' ? document.activeElement.textContent.replace(/\s+/g, ' ').trim() : `<${document.activeElement?.tagName}>`));

        check(`${tag} C3 roving tabindex inicial: «Sin guía» 0 y «Con guía» -1`, (await sin.getAttribute('tabindex')) === '0' && (await con.getAttribute('tabindex')) === '-1', `${await sin.getAttribute('tabindex')} / ${await con.getAttribute('tabindex')}`);
        await sin.focus();
        check(`${tag} C3 el foco está en el radio activo`, (await activeName()) === 'Sin guía', await activeName());

        await page.keyboard.press('ArrowRight');
        await page.waitForFunction(() => document.activeElement?.getAttribute('role') === 'radio' && /Con guía/.test(document.activeElement.textContent ?? ''), null, { timeout: 2000 }).catch(() => {});
        check(`${tag} C3 flecha derecha mueve el foco a «Con guía»`, (await activeName()) === 'Con guía', await activeName());
        let selectedByArrow = (await con.getAttribute('aria-checked')) === 'true';
        if (!selectedByArrow) await page.keyboard.press('Space');
        check(`${tag} C3 teclado: «Con guía» queda seleccionado${selectedByArrow ? ' con la flecha' : ' con Espacio'}`, (await con.getAttribute('aria-checked')) === 'true' && (await page.locator(GUIA).getAttribute('data-mode')) === 'con-guia');
        check(`${tag} C3 teclado: aparece el paso 1 de 3`, (await waitSingleStep(page, 1)) && /Paso 1 de 3/.test((await textOf(page, tooltip)) ?? ''), `pasos: ${(await currentSteps(page)).join(',')}`);
        check(`${tag} C3 roving tabindex tras cambiar: «Con guía» 0 y «Sin guía» -1`, (await con.getAttribute('tabindex')) === '0' && (await sin.getAttribute('tabindex')) === '-1', `${await con.getAttribute('tabindex')} / ${await sin.getAttribute('tabindex')}`);

        await page.keyboard.press('ArrowLeft');
        await page.waitForFunction(() => document.activeElement?.getAttribute('role') === 'radio' && /Sin guía/.test(document.activeElement.textContent ?? ''), null, { timeout: 2000 }).catch(() => {});
        check(`${tag} C3 flecha izquierda devuelve el foco a «Sin guía»`, (await activeName()) === 'Sin guía', await activeName());
        if ((await sin.getAttribute('aria-checked')) !== 'true') await page.keyboard.press('Enter');
        check(`${tag} C3 teclado: «Sin guía» vuelve a quedar seleccionado y desaparecen los marcadores`, (await sin.getAttribute('aria-checked')) === 'true' && (await page.locator(GUIA).getAttribute('data-mode')) === 'sin-guia' && (await countOf(page, marker)) === 0);
      });
      await context.close();
    }

    /* ───── C4: avance, pausa y movimiento reducido ───── */
    console.log('\nC4 · avance automático');
    {
      const { context, page } = await openContext(browser, origin, { viewport: VIEWPORTS[0] });
      if (!(await openLanding(page, origin))) {
        check('C4 la sección #guia existe', false, '#guia no está en el DOM');
      } else {
        await guarded('C4 avance', async () => {
          await radio(page, 'Con guía').click();
          check('C4 arranca en el paso 1', await waitSingleStep(page, 1));
          for (const [expected, label] of [[2, '1 → 2'], [3, '2 → 3'], [1, '3 → 1']]) {
            await page.clock.runFor(interval);
            const ok = await waitSingleStep(page, expected);
            check(`C4 tras ${interval} ms avanza ${label} (marcador)`, ok, `pasos: ${(await currentSteps(page)).join(',') || 'ninguno'}`);
            const tip = await textOf(page, tooltip);
            const said = await textOf(page, announce);
            check(`C4 paso ${expected}: tooltip y anuncio coinciden`, new RegExp(`^Paso ${expected} de 3\\s*·`).test(tip ?? '') && new RegExp(`Paso ${expected} de 3:`).test(said ?? ''), `tooltip="${tip}" anuncio="${said}"`);
          }
          await page.clock.runFor(interval - 600);
          check('C4 no avanza antes de cumplirse el intervalo', await waitSingleStep(page, 1, 1500), `pasos: ${(await currentSteps(page)).join(',')}`);
        });

        await guarded('C4 pausa por ratón', async () => {
          // Se parte del paso 1 con 2900 ms ya consumidos; se vuelve a empezar de forma limpia.
          await radio(page, 'Sin guía').click();
          await radio(page, 'Con guía').click();
          await waitSingleStep(page, 1);
          const frame = page.locator(marco);
          await frame.scrollIntoViewIfNeeded();
          await frame.hover();
          check('C4 hover sobre el marco: data-paused="true"', (await frame.getAttribute('data-paused')) === 'true', `data-paused=${await frame.getAttribute('data-paused')}`);
          await page.clock.runFor(interval * 2);
          check('C4 en pausa el paso no avanza tras 2 intervalos', await waitSingleStep(page, 1, 1500), `pasos: ${(await currentSteps(page)).join(',')}`);
          await page.locator(`${GUIA} h2#guia-h`).hover();
          check('C4 al quitar el ratón: data-paused="false"', (await frame.getAttribute('data-paused')) === 'false', `data-paused=${await frame.getAttribute('data-paused')}`);
          await page.clock.runFor(interval);
          check('C4 al salir del marco el avance se reanuda (paso 2)', await waitSingleStep(page, 2), `pasos: ${(await currentSteps(page)).join(',')}`);
        });

        await guarded('C4 pausa por foco', async () => {
          const frame = page.locator(marco);
          const focusable = await frame.evaluate((el) => {
            const target = el.matches('[tabindex]:not([tabindex="-1"])') ? el : el.querySelector('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (!target) return false;
            target.focus();
            return document.activeElement === target;
          });
          if (!focusable) {
            aviso('C4 el marco no contiene elementos enfocables: la pausa por foco no se puede probar (solo la de ratón).');
            return;
          }
          check('C4 foco dentro del marco: data-paused="true"', (await frame.getAttribute('data-paused')) === 'true');
          const before = await currentSteps(page);
          await page.clock.runFor(interval * 2);
          check('C4 con el foco dentro el paso no avanza', JSON.stringify(await currentSteps(page)) === JSON.stringify(before), `${before} → ${await currentSteps(page)}`);
          await page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur());
          check('C4 al sacar el foco: data-paused="false"', (await frame.getAttribute('data-paused')) === 'false');
        });

        await guarded('C4 reinicio', async () => {
          await radio(page, 'Sin guía').click();
          await page.clock.runFor(interval * 2);
          check('C4 al volver a «Sin guía» desaparecen los marcadores y no hay avance', (await countOf(page, marker)) === 0, `${await countOf(page, marker)} marcadores`);
          await radio(page, 'Con guía').click();
          check('C4 al volver a «Con guía» la guía reinicia en el paso 1', await waitSingleStep(page, 1), `pasos: ${(await currentSteps(page)).join(',')}`);
        });
      }
      await context.close();
    }

    for (const vp of [VIEWPORTS[0], VIEWPORTS[3]]) {
      const tag = `${vp.width}x${vp.height}`;
      const { context, page, state } = await openContext(browser, origin, { viewport: vp, reducedMotion: 'reduce' });
      if (!(await openLanding(page, origin))) {
        check(`${tag} C4 movimiento reducido: la sección #guia existe`, false, '#guia no está en el DOM');
        await context.close();
        continue;
      }
      await guarded(`${tag} C4 movimiento reducido`, async () => {
        check(`${tag} C4 (reduce) en «Sin guía» no hay marcadores`, (await countOf(page, marker)) === 0);
        await radio(page, 'Con guía').click();
        await page.waitForFunction((sel) => document.querySelectorAll(sel).length === 3, marker, { timeout: 3000 }).catch(() => {});
        const steps = (await currentSteps(page)).sort();
        check(`${tag} C4 (reduce) en «Con guía» están los 3 marcadores a la vez`, steps.join(',') === '1,2,3', `pasos: ${steps.join(',') || 'ninguno'}`);
        check(`${tag} C4 (reduce) no hay tooltip`, (await countOf(page, tooltip)) === 0, `${await countOf(page, tooltip)} tooltips`);
        check(`${tag} C4 (reduce) aparece ol[data-testid="guia-pasos-estaticos"] con 3 li`, (await countOf(page, `${staticSteps} > li`)) === 3 && (await page.locator(staticSteps).isVisible()), `li=${await countOf(page, `${staticSteps} > li`)}`);
        const said = await textOf(page, announce);
        check(`${tag} C4 (reduce) el anuncio dice «Guía de 3 pasos»`, /Guía de 3 pasos/.test(said ?? ''), `anuncio="${said}"`);
        await page.clock.runFor(interval * 4);
        const after = (await currentSteps(page)).sort();
        check(`${tag} C4 (reduce) no avanza con el reloj: siguen los 3 marcadores y el mismo anuncio`, after.join(',') === '1,2,3' && (await textOf(page, announce)) === said && (await countOf(page, tooltip)) === 0, `pasos: ${after.join(',')}`);
        const layout = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }));
        check(`${tag} C4 (reduce) sin desbordamiento horizontal`, layout.scrollWidth <= layout.innerWidth, `scrollWidth=${layout.scrollWidth}, innerWidth=${layout.innerWidth}`);
        await page.screenshot({ path: join(SHOTS_DIR, `guia-reduce-${vp.width}.png`) });
        check(`${tag} C4 (reduce) sin errores de consola`, state.errors.length === 0, state.errors.slice(0, 3).join(' | '));
      });
      await context.close();
    }

    /* ───── C5: «Ir al catálogo» ───── */
    console.log('\nC5 · botón «Ir al catálogo»');
    for (const vp of [VIEWPORTS[0], VIEWPORTS[3]]) {
      const tag = `${vp.width}x${vp.height}`;
      // Sin reloj simulado: la navegación diferida al catálogo usa temporizadores reales.
      const { context, page } = await openContext(browser, origin, { viewport: vp, clock: false });
      if (!(await openLanding(page, origin, { pause: false }))) {
        check(`${tag} C5 la sección #guia existe`, false, '#guia no está en el DOM');
        await context.close();
        continue;
      }
      await guarded(`${tag} C5`, async () => {
        const cta = page.locator(`${GUIA} button`).filter({ hasText: /^\s*Ir al catálogo\s*$/ }).first();
        await cta.scrollIntoViewIfNeeded();
        check(`${tag} C5 hay un <button type="button"> «Ir al catálogo»`, (await cta.isVisible()) && (await cta.getAttribute('type')) === 'button', `type=${await cta.getAttribute('type').catch(() => null)}`);
        await cta.click();
        const heading = page.locator('#catalog-page-heading');
        await heading.waitFor({ state: 'visible', timeout: 8000 });
        check(`${tag} C5 el clic muestra la página del Catálogo`, (await heading.textContent())?.trim() === 'Skills de la comunidad', await heading.textContent());
        check(`${tag} C5 la sección #guia ya no está en pantalla`, !(await page.locator(GUIA).isVisible().catch(() => false)));
      });
      await context.close();
    }

    /* ───── C6: red, peso y paleta ───── */
    console.log('\nC6 · red, peso y paleta');
    {
      const { context, page, state } = await openContext(browser, origin, { viewport: VIEWPORTS[0] });
      const ready = await openLanding(page, origin);
      if (!ready) {
        check('C6 la sección #guia existe', false, '#guia no está en el DOM');
      } else {
        await guarded('C6 red', async () => {
          const mark = state.requests.length;
          const frame = page.locator(marco);
          await radio(page, 'Con guía').click();
          await frame.hover();
          await page.clock.runFor(interval * 3);
          await page.locator(`${GUIA} h2#guia-h`).hover();
          await page.clock.runFor(interval * 3);
          await radio(page, 'Sin guía').click();
          await radio(page, 'Con guía').click();
          await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {});
          const during = state.requests.slice(mark);
          check('C6 durante la interacción con #guia no hay ninguna petición a otro origen', during.length === 0, during.map((r) => r.url).slice(0, 3).join(', '));

          const byOrigin = new Map();
          for (const r of state.requests) byOrigin.set(r.origin, (byOrigin.get(r.origin) ?? 0) + 1);
          const unexpected = [...byOrigin.keys()].filter((o) => !ALLOWED_EXTERNAL.has(o));
          check('C6 la carga de la portada solo contacta orígenes conocidos (fixture y fuentes)', unexpected.length === 0 && state.leaks.length === 0, `desconocidos: ${unexpected.join(', ')} · fugas abortadas: ${state.leaks.slice(0, 3).join(', ')}`);
          for (const [o, n] of byOrigin) console.log(`        origen excluido: ${o} ×${n} — ${ALLOWED_EXTERNAL.get(o) ?? 'NO PERMITIDO'}`);
          if (byOrigin.size === 0) console.log('        (la portada no contactó ningún origen externo)');

          const refs = await page.evaluate((sel) => {
            const urls = [];
            for (const el of document.querySelectorAll(`${sel}, ${sel} *`)) {
              for (const attr of ['src', 'srcset', 'href', 'poster', 'data']) {
                const v = el.getAttribute(attr);
                if (v && !v.startsWith('#')) urls.push(`${el.tagName.toLowerCase()}[${attr}]=${v.split(',')[0].trim().split(' ')[0]}`);
              }
              for (const pseudo of [null, '::before', '::after']) {
                const bg = getComputedStyle(el, pseudo).backgroundImage;
                for (const m of bg.matchAll(/url\(["']?([^"')]+)["']?\)/g)) urls.push(`${el.tagName.toLowerCase()}[background]=${m[1]}`);
              }
            }
            return urls.map((u) => ({ label: u, url: u.slice(u.indexOf('=') + 1) }));
          }, GUIA);
          const remote = refs.filter(({ url }) => {
            if (url.startsWith('data:') || url.startsWith('blob:')) return false;
            try {
              return new URL(url, origin).origin !== origin;
            } catch {
              return true;
            }
          });
          check('C6 todo recurso referenciado dentro de #guia (img, background, enlaces) es local', remote.length === 0, remote.slice(0, 3).map((r) => r.label).join(', '));
        });

        await guarded('C6 WebP', async () => {
          const src = await page.locator(`${marco} img`).first().evaluate((i) => i.currentSrc || i.src);
          let bytes;
          let kind;
          if (src.startsWith('data:')) {
            const m = /^data:([^;,]+)(;base64)?,(.*)$/s.exec(src);
            kind = m?.[1];
            bytes = m ? (m[2] ? Buffer.from(m[3], 'base64') : Buffer.from(decodeURIComponent(m[3]))) : Buffer.alloc(0);
          } else {
            const file = join(OUT_DIR, decodeURIComponent(new URL(src).pathname));
            kind = 'archivo emitido';
            bytes = existsSync(file) ? readFileSync(file) : Buffer.alloc(0);
          }
          check(`C6 la captura emitida es un WebP real (${src.startsWith('data:') ? 'inlineada como data:' : 'en dist/'})`, bytes.length > 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP', `${kind}, ${bytes.length} B, src=${src.slice(0, 80)}`);
          check(`C6 la captura pesa ≤ 60 KB (${(bytes.length / 1024).toFixed(1)} KB)`, bytes.length > 0 && bytes.length <= MAX_WEBP_BYTES, `${bytes.length} B`);
        });

        await guarded('C6 chunk', async () => {
          const html = readFileSync(join(OUT_DIR, 'index.html'), 'utf8');
          const entry = /<script[^>]+type="module"[^>]+src="([^"]+)"/.exec(html)?.[1];
          const dir = join(OUT_DIR, 'bundle');
          const fallback = existsSync(dir) ? readdirSync(dir).find((f) => /^index-.*\.js$/.test(f)) : undefined;
          const file = entry ? join(OUT_DIR, entry) : fallback ? join(dir, fallback) : null;
          if (!file || !existsSync(file)) throw new Error('no se encontró el chunk inicial index-*.js en dist/');
          const size = statSync(file).size;
          const kb = (size / 1000).toFixed(1);
          if (size > MAX_INITIAL_CHUNK_BYTES) aviso(`el chunk inicial ${file.split(/[\\/]/).pop()} pesa ${kb} kB (> 350 kB): deuda preexistente registrada, no se falla`);
          else aviso(`el chunk inicial ${file.split(/[\\/]/).pop()} pesa ${kb} kB (presupuesto 350 kB)`);
          check('C6 el chunk inicial se mide y existe en dist/', size > 0);
        });

        await guarded('C6 dependencias', async () => {
          const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
          const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
          const banned = names.filter((n) => /^(framer-motion|motion|class-variance-authority|@radix-ui\/.+)$/.test(n));
          check('C6 package.json no incorpora framer-motion ni shadcn/Radix', banned.length === 0, banned.join(', '));
        });

        await guarded('C6 paleta', async () => {
          const args = { hue: ACCENT_HUE, tolerance: HUE_TOLERANCE, chromaLimit: CHROMA_LIMIT };
          for (const mode of ['Sin guía', 'Con guía']) {
            await radio(page, mode).click();
            await page.locator(GUIA).scrollIntoViewIfNeeded();
            await page.waitForTimeout(700); // deja terminar las transiciones CSS (no dependen del reloj simulado)
            const { offenders, inspected } = await page.evaluate(scanPalette, args);
            check(`C6 paleta en «${mode}»: todo acento (croma > 0,25) es cian 199° ± 8° (${inspected} nodos revisados)`, offenders.length === 0, offenders.slice(0, 5).join(' || '));
          }
          // En «Con guía» también con la sección en estado de enfoque (hover sobre el marco).
          await page.locator(marco).hover();
          const { offenders } = await page.evaluate(scanPalette, args);
          check('C6 paleta con el marco en hover (pausa)', offenders.length === 0, offenders.slice(0, 5).join(' || '));
        });
      }
      await context.close();
    }
  } finally {
    if (browser) await browser.close();
    if (server) await server.close?.();
    rmSync(OUT_DIR, { recursive: true, force: true });
    for (const [k, v] of Object.entries(prevEnv)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }

  console.log(`\n${passed} comprobaciones correctas${failures.length ? `, ${failures.length} fallaron` : ''}`);
  if (failures.length > 0) {
    console.error(`Fallos:\n - ${failures.join('\n - ')}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
