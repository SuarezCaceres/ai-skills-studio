/**
 * Prueba E2E de la sección «Guía vs. sin guía» de la portada (spec 005, criterios C1–C7 y ampliación C8–C12).
 *
 * Compila la app en un directorio temporal, la sirve con `vite preview` (puerto 5196) y la recorre con
 * Chromium en los 4 anchos obligatorios (1440, 1024, 768 y 390). Toda la red externa está interceptada:
 * GitHub y avatares los simula `scripts/lib/github-fixture.mjs`, las fuentes de Google se contestan vacías
 * y cualquier otro origen se aborta y se registra como fuga. Nunca se toca `api.github.com` real.
 * El avance de la guía (3500 ms) se controla con `page.clock`. Las animaciones CSS (espejo, barras, anillo)
 * no las controla `page.clock`: solo para ellas hay esperas reales cortas sobre `getAnimations()`.
 *
 * Se escribe contra el «Contrato de DOM» de `docs/specs/005-guia-vs-sin-guia/plan.md` (Fase 0 y ampliación
 * 2026-11-26: escenario, anillo, halo, píldora, panel, tarjeta, filas, barras y pausa).
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
const COPY_FILE = resolve(ROOT, 'src', 'data', 'guideShowcaseCopy.ts');

const MAX_WEBP_BYTES = 60 * 1024; // C6a/C7: la captura pesa ≤ 60 KB
const MAX_INITIAL_CHUNK_BYTES = 350 * 1000; // C6b: presupuesto del chunk inicial (kB de Vite = 1000 B)
// Chunk inicial medido en la base de la 005 (9f7580d, punta de la 004) antes de añadir la sección: 382 305 B.
// Tras integrar la 004 final el chunk inicial ronda 349,7 kB: el límite efectivo es ya el de C6b (< 350 kB).
const BASELINE_INITIAL_CHUNK_BYTES = 382_305;
const CHUNK_SLACK_BYTES = 2_000;
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

/** Carga un módulo TypeScript sin imports de valor (solo `import type`) compilándolo al vuelo con esbuild. */
async function loadTsModule(file) {
  const source = readFileSync(file, 'utf8');
  const { code } = transformSync(source, { loader: 'ts', format: 'esm', target: 'es2022' });
  const url = `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
  return import(url);
}

async function testHotspotsC7() {
  console.log('\nC7 · captura y hotspots');
  const mod = await loadTsModule(HOTSPOTS_FILE);
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
const escenario = `${GUIA} [data-testid="guia-escenario"]`;
const anillo = `${GUIA} [data-testid="guia-anillo"]`;
const halo = `${GUIA} [data-testid="guia-halo"]`;
const estado = `${GUIA} [data-testid="guia-estado"]`;
const estadoPunto = `${GUIA} [data-testid="guia-estado-punto"]`;
const panel = `${GUIA} [data-testid="guia-panel"]`;
const tarjeta = `${GUIA} [data-testid="guia-tarjeta"]`;
const lista = `${tarjeta} ul[data-testid="guia-lista"]`;
const filas = `${lista} > li[data-testid="guia-fila"]`;
const pausa = `${tarjeta} button[data-testid="guia-pausa"]`;
const radiogroup = `${GUIA} [role="radiogroup"][aria-label="Modo de la vista previa"]`;

const textOf = async (page, selector) => (await page.locator(selector).first().textContent({ timeout: 2000 }).catch(() => null))?.replace(/\s+/g, ' ').trim() ?? null;
const countOf = (page, selector) => page.locator(selector).count();
const radio = (page, name) => page.locator(`${radiogroup} [role="radio"]`).filter({ hasText: new RegExp(`^\\s*${name}\\s*$`) }).first();
const ctaIn = (page, scope) => page.locator(scope).getByRole('button', { name: 'Ir al catálogo', exact: true });

/** Deja que React pinte lo que haya disparado el reloj simulado antes de comprobar que algo NO cambió. */
const settle = (page) => page.waitForTimeout(200);

async function currentSteps(page) {
  return page.$$eval(marker, (els) => els.map((el) => el.getAttribute('data-step')));
}

/** `data-estado` de las filas de la tarjeta, en orden («activa,pendiente,pendiente»). */
async function rowStates(page) {
  return page.$$eval(filas, (els) => els.map((el) => el.getAttribute('data-estado')).join(','));
}

/** Espera (en tiempo real) a que las filas tengan exactamente esos estados. */
async function waitRowStates(page, expected, timeout = 3000) {
  try {
    await page.waitForFunction(
      ([sel, exp]) => [...document.querySelectorAll(sel)].map((el) => el.getAttribute('data-estado')).join(',') === exp,
      [filas, expected],
      { timeout }
    );
    return true;
  } catch {
    return false;
  }
}

/** Textos normalizados de las filas de la tarjeta. */
async function rowTexts(page) {
  return page.$$eval(filas, (els) => els.map((el) => (el.textContent ?? '').replace(/\s+/g, ' ').trim()));
}

/** `animation-name` computado de un elemento (null si no existe). */
async function animationNameOf(page, selector) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    return el ? getComputedStyle(el).animationName : null;
  }, selector);
}

/** Barras de la tarjeta: para cada fila, los `animation-name` de la barra y de sus descendientes. */
async function barAnimations(page) {
  return page.$$eval(filas, (rows) =>
    rows.map((row) => {
      const bar = row.querySelector('[data-testid="guia-barra"]');
      if (!bar) return null;
      return [bar, ...bar.querySelectorAll('*')].map((el) => getComputedStyle(el).animationName);
    })
  );
}

/**
 * Barra de la fila activa: cuántos elementos (la barra o su relleno) tienen animación, su `animation-play-state`
 * y el `scaleX` del primero animado (para comprobar que se congela).
 */
async function activeBarInfo(page) {
  return page.evaluate((sel) => {
    const row = [...document.querySelectorAll(sel)].find((r) => r.getAttribute('data-estado') === 'activa');
    const bar = row?.querySelector('[data-testid="guia-barra"]');
    if (!bar) return null;
    const animated = [bar, ...bar.querySelectorAll('*')].filter((el) => getComputedStyle(el).animationName !== 'none');
    const first = animated[0];
    const matrix = first ? getComputedStyle(first).transform : null;
    const scaleX = matrix && matrix.startsWith('matrix(') ? Number(matrix.slice(7).split(',')[0]) : matrix === 'none' ? 1 : null;
    return { count: animated.length, states: animated.map((el) => getComputedStyle(el).animationPlayState), scaleX };
  }, filas);
}

/** Caja (getBoundingClientRect) de un elemento, o null. */
async function rectOf(page, selector) {
  return page.evaluate((sel) => {
    const r = document.querySelector(sel)?.getBoundingClientRect();
    return r ? { x: r.x, y: r.y, w: r.width, h: r.height, cx: r.x + r.width / 2, top: r.top, bottom: r.bottom } : null;
  }, selector);
}

/**
 * Espera (en tiempo real) a que terminen las animaciones y transiciones finitas de esos elementos y de sus
 * ancestros dentro de #guia (p. ej. el deslizamiento en espejo de ~500 ms). Las infinitas (anillo) no cuentan.
 */
async function waitSettled(page, selectors, timeout = 3000) {
  return page
    .waitForFunction(
      (sels) => {
        const stop = document.getElementById('guia')?.parentElement ?? null;
        for (const sel of sels) {
          for (let el = document.querySelector(sel); el && el !== stop; el = el.parentElement) {
            for (const a of el.getAnimations()) {
              const end = a.effect?.getComputedTiming?.().endTime;
              if (a.playState === 'running' && Number.isFinite(end)) return false;
            }
          }
        }
        return true;
      },
      selectors,
      { timeout }
    )
    .then(() => true)
    .catch(() => false);
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

/* ──────────────────────────── paleta (C6a) ──────────────────────────── */

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

  // Textos de la sección (obstáculos, ventajas, etiquetas de pasos y píldora) desde la fuente única de copy.
  let copy = {};
  await guarded('Textos de la sección (guideShowcaseCopy.ts)', async () => {
    copy = await loadTsModule(COPY_FILE);
  });
  const LISTS = copy.GUIDE_LISTS ?? { 'sin-guia': [], 'con-guia': [] };
  const COPY = copy.GUIDE_COPY ?? { modes: {}, listLabels: {}, captions: {} };
  // Etiquetas de los pasos fijadas por la spec (C11): se comprueban literalmente, no se leen del código.
  const STEP_LABELS = ['1 · Buscar', '2 · Filtrar por categoría', '3 · Abrir una skill'];
  check('C11 GUIDE_LISTS tiene 3 obstáculos y 3 ventajas', LISTS['sin-guia']?.length === 3 && LISTS['con-guia']?.length === 3, JSON.stringify(LISTS));

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
        // La «lista de obstáculos» es ahora la tarjeta de barras: 3 filas atascadas con los textos de GUIDE_LISTS.
        await page.locator(tarjeta).scrollIntoViewIfNeeded();
        check(`${tag} C2 la tarjeta contiene la lista ul[data-testid="guia-lista"] visible`, (await page.locator(tarjeta).isVisible()) && (await page.locator(lista).isVisible()), `tarjetas=${await countOf(page, tarjeta)}, listas=${await countOf(page, lista)}`);
        const states = await rowStates(page);
        check(`${tag} C2 la tarjeta muestra 3 filas con data-estado="atascada"`, states === 'atascada,atascada,atascada', `estados: ${states || 'ninguno'}`);
        const texts = await rowTexts(page);
        const obstacles = LISTS['sin-guia'] ?? [];
        check(`${tag} C2 las filas muestran los obstáculos de GUIDE_LISTS['sin-guia'] en orden`, texts.length === 3 && obstacles.length === 3 && texts.every((t, i) => t.includes(obstacles[i])), JSON.stringify(texts));
        const panelInfo = await page.evaluate((sel) => {
          const el = document.querySelector(sel);
          return el && { text: (el.textContent ?? '').replace(/\s+/g, ' ').trim(), h3: el.querySelector('h3')?.textContent?.replace(/\s+/g, ' ').trim() ?? null, visible: el.getBoundingClientRect().height > 0 };
        }, panel);
        check(`${tag} C2 el panel muestra el texto del modo «Sin guía» (etiqueta, título h3 y descripción)`,
          !!panelInfo?.visible && panelInfo.text.includes(COPY.modes['sin-guia']) && panelInfo.h3 === COPY.listLabels['sin-guia'] && panelInfo.text.includes(COPY.captions['sin-guia']),
          JSON.stringify(panelInfo)?.slice(0, 200));
        check(`${tag} C2 no hay ningún marcador de paso`, (await countOf(page, marker)) === 0, `${await countOf(page, marker)} marcadores`);
        check(`${tag} C11 en «Sin guía» no hay botón de pausa`, (await countOf(page, `${GUIA} [data-testid="guia-pausa"]`)) === 0);
        const filter = await page.locator(`${marco} img`).evaluate((img) => getComputedStyle(img).filter);
        check(`${tag} C2 la captura se ve atenuada (filtro con grayscale y brightness < 1)`, /grayscale\(1\)/.test(filter) && /brightness\(0\.\d+\)/.test(filter), `filter="${filter}"`);
      });

      const wide = vp.width >= 1024;
      /** C8: en ≥ 1024 px el escenario está a la izquierda o a la derecha del panel; por debajo, apilado encima. */
      const checkLayoutC8 = async (modeLabel, escenarioLeft) => {
        await waitSettled(page, [escenario, panel]);
        const e = await rectOf(page, escenario);
        const p = await rectOf(page, panel);
        const detail = JSON.stringify({ escenario: e && { cx: Math.round(e.cx), top: Math.round(e.top), bottom: Math.round(e.bottom) }, panel: p && { cx: Math.round(p.cx), top: Math.round(p.top) } });
        if (wide) {
          // Margen de 40 px: más que el desplazamiento de la animación de entrada (2rem) por si aún no hubiera acabado.
          const ok = !!e && !!p && (escenarioLeft ? e.cx + 40 < p.cx : e.cx > p.cx + 40);
          check(`${tag} C8 en «${modeLabel}» el escenario queda a la ${escenarioLeft ? 'izquierda' : 'derecha'} del panel`, ok, detail);
        } else {
          check(`${tag} C8 en «${modeLabel}» se apila: el escenario queda encima del panel`, !!e && !!p && e.bottom <= p.top + 1, detail);
          const layout = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }));
          check(`${tag} C8 en «${modeLabel}» sin desbordamiento horizontal`, layout.scrollWidth <= layout.innerWidth, `scrollWidth=${layout.scrollWidth}, innerWidth=${layout.innerWidth}`);
        }
      };

      /** Estilos computados del anillo y de los bloques en espejo: fallan si se rompe el CSS (no solo el atributo). */
      const ringStyle = (sel) => page.evaluate((s) => {
        const el = document.querySelector(s);
        if (!el) return null;
        const cs = getComputedStyle(el);
        return { animationName: cs.animationName, borderTopColor: cs.borderTopColor };
      }, sel);
      const waitRingColor = (sel, color) => page
        .waitForFunction(([s, c]) => getComputedStyle(document.querySelector(s)).borderTopColor === c, [sel, color], { timeout: 3000 })
        .then(() => true)
        .catch(() => false);
      const mirrorAnimations = () => page.evaluate(() => ['.guia__escenario', '.guia__panel'].map((s) => {
        const cs = getComputedStyle(document.querySelector(`#guia ${s}`));
        return { name: cs.animationName, duration: cs.animationDuration };
      }));
      const SLATE = 'rgb(71, 85, 105)';
      const CYAN = 'rgb(14, 165, 233)';

      await guarded(`${tag} C8/C9/C10 «Sin guía»`, async () => {
        await checkLayoutC8('Sin guía', true);
        const inside = await page.evaluate(([e, m]) => !!document.querySelector(e)?.contains(document.querySelector(m)), [escenario, marco]);
        check(`${tag} C9 el marco está dentro del escenario (GuideMediaSlot)`, inside);
        check(`${tag} C9 en «Sin guía» el anillo está quieto (data-girando="false")`, (await page.locator(anillo).getAttribute('data-girando')) === 'false', `data-girando=${await page.locator(anillo).getAttribute('data-girando').catch(() => 'sin anillo')}`);
        check(`${tag} C9 en «Sin guía» no hay halo`, (await countOf(page, halo)) === 0, `${await countOf(page, halo)} halos`);
        const ringSin = await ringStyle(anillo);
        check(`${tag} C9 en «Sin guía» el anillo no tiene animación de giro (animation-name: none)`, ringSin?.animationName === 'none', JSON.stringify(ringSin));
        check(`${tag} C9 en «Sin guía» el anillo es gris pizarra (#475569)`, await waitRingColor(anillo, SLATE), JSON.stringify(await ringStyle(anillo)));
        const pill = await textOf(page, estado);
        check(`${tag} C10 en «Sin guía» la píldora dice «A ciegas»`, pill === 'A ciegas' && (await page.locator(estado).isVisible()), `píldora="${pill}"`);
      });

      await guarded(`${tag} C3`, async () => {
        const sinText = await textOf(page, lista);
        await radio(page, 'Con guía').click();
        const section = page.locator(GUIA);
        if (wide) {
          // C8: el cambio de modo desliza y funde los dos bloques (~500 ms, solo CSS) con la animación del modo nuevo.
          const anims = await mirrorAnimations();
          check(`${tag} C8 al pasar a «Con guía» escenario y panel entran con su animación de ~500 ms`,
            anims[0].name === 'guia-entra-der-b' && anims[1].name === 'guia-entra-izq-b' && anims.every((a) => a.duration === '0.5s'),
            JSON.stringify(anims));
        }
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
        check(`${tag} C3 la lista cambia de contenido al activar la guía`, !!conText && conText !== sinText && (await countOf(page, filas)) > 0, `sin="${sinText?.slice(0, 40)}" con="${conText?.slice(0, 40)}"`);
        const texts = await rowTexts(page);
        const advantages = LISTS['con-guia'] ?? [];
        check(`${tag} C3 las filas son «1 · Buscar», «2 · Filtrar por categoría» y «3 · Abrir una skill», cada una con su ventaja`,
          texts.length === 3 && advantages.length === 3 && texts.every((t, i) => t.startsWith(STEP_LABELS[i]) && t.includes(advantages[i])),
          JSON.stringify(texts));
        check(`${tag} C3 ya no queda ninguna fila «atascada»`, !(await rowStates(page)).includes('atascada'), await rowStates(page));
        const panelText = await textOf(page, panel);
        const panelH3 = await textOf(page, `${panel} h3`);
        check(`${tag} C3 el panel muestra el texto del modo «Con guía»`, !!panelText && panelText.includes(COPY.modes['con-guia']) && panelH3 === COPY.listLabels['con-guia'] && panelText.includes(COPY.captions['con-guia']), `h3="${panelH3}" panel="${panelText?.slice(0, 80)}"`);
        check(`${tag} C11 el botón «Pausar guía» está dentro de la tarjeta`, (await countOf(page, pausa)) === 1 && (await countOf(page, `${GUIA} [data-testid="guia-pausa"]`)) === 1, `en tarjeta=${await countOf(page, pausa)}`);
        check(`${tag} C11 el CTA «Ir al catálogo» está dentro de la tarjeta`, (await ctaIn(page, tarjeta).count()) === 1 && (await ctaIn(page, GUIA).count()) === 1, `en tarjeta=${await ctaIn(page, tarjeta).count()}, en sección=${await ctaIn(page, GUIA).count()}`);
        // El filtro transiciona en CSS (500 ms): se espera a su valor final.
        const lit = await page
          .waitForFunction((sel) => getComputedStyle(document.querySelector(sel)).filter === 'none', `${marco} img`, { timeout: 3000 })
          .then(() => true)
          .catch(() => false);
        const litFilter = await page.locator(`${marco} img`).evaluate((img) => getComputedStyle(img).filter);
        check(`${tag} C3 la captura se ilumina (sin filtro de atenuación)`, lit, `filter="${litFilter}"`);
      });

      await guarded(`${tag} C8/C9 «Con guía»`, async () => {
        await checkLayoutC8('Con guía', false);
        check(`${tag} C9 en «Con guía» el anillo gira (data-girando="true")`, (await page.locator(anillo).getAttribute('data-girando')) === 'true', `data-girando=${await page.locator(anillo).getAttribute('data-girando').catch(() => 'sin anillo')}`);
        check(`${tag} C9 en «Con guía» aparece un halo`, (await countOf(page, halo)) === 1, `${await countOf(page, halo)} halos`);
        const ringCon = await ringStyle(anillo);
        check(`${tag} C9 en «Con guía» el anillo gira con CSS (animation-name: guia-anillo-gira)`, ringCon?.animationName === 'guia-anillo-gira', JSON.stringify(ringCon));
        check(`${tag} C9 en «Con guía» el anillo es cian (#0ea5e9)`, await waitRingColor(anillo, CYAN), JSON.stringify(await ringStyle(anillo)));
        await waitSettled(page, [halo]);
        const opacity = await page.evaluate((sel) => {
          const el = document.querySelector(sel);
          return el ? Number(getComputedStyle(el).opacity) : null;
        }, halo);
        check(`${tag} C9 la opacidad computada del halo es > 0 y ≤ 0,15`, opacity !== null && opacity > 0 && opacity <= 0.15, `opacity=${opacity}`);
      });

      // Geometría: el tooltip nunca se sale del marco y cada marcador cae sobre su hotspot (3 pasos).
      await guarded(`${tag} C3 geometría`, async () => {
        for (const step of [1, 2, 3]) {
          if (step > 1) {
            await page.clock.runFor(interval);
            await waitSingleStep(page, step);
          }
          // C10: la píldora dice el mismo paso que el marcador visible.
          const visible = await currentSteps(page);
          const pill = await textOf(page, estado);
          check(`${tag} C10 paso ${step}: la píldora dice «Guiado · Paso ${step} de 3» y coincide con el marcador visible`,
            visible.length === 1 && visible[0] === String(step) && pill === `Guiado · Paso ${visible[0]} de 3`,
            `píldora="${pill}", marcadores=${visible.join(',') || 'ninguno'}`);
          // El foco se desplaza con una transición CSS (no la controla page.clock): medir cuando haya terminado.
          await page.waitForFunction(
            (sel) => (document.querySelector(sel)?.getAnimations({ subtree: true }) ?? [])
              .every((a) => !(a instanceof CSSTransition) || a.playState !== 'running'),
            GUIA,
            { timeout: 5000 },
          );
          const geo = await page.evaluate(
            ({ marcoSel, markerSel, tipSel }) => {
              const f = document.querySelector(marcoSel)?.getBoundingClientRect();
              const m = document.querySelector(markerSel)?.getBoundingClientRect();
              const t = document.querySelector(tipSel)?.getBoundingClientRect();
              const img = document.querySelector(`${marcoSel} img`)?.getBoundingClientRect();
              const foco = document.querySelector(`${marcoSel} [data-testid="guia-foco"]`)?.getBoundingClientRect();
              const box = (r) => r && { x: r.x, y: r.y, w: r.width, h: r.height };
              return { frame: box(f), marker: box(m), tip: box(t), img: box(img), foco: box(foco) };
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
            // El recuadro del foco coincide con la caja del hotspot (±2 px, sin el margen anterior).
            const exp = {
              x: geo.img.x + (hotspot.box.x / 100) * geo.img.w,
              y: geo.img.y + (hotspot.box.y / 100) * geo.img.h,
              w: (hotspot.box.w / 100) * geo.img.w,
              h: (hotspot.box.h / 100) * geo.img.h,
            };
            const near2 = (a, b) => Math.abs(a - b) <= 2;
            check(`${tag} C3 paso ${step}: el foco tiene la posición y el tamaño del hotspot «${hotspot.id}»`,
              !!geo.foco && near2(geo.foco.x, exp.x) && near2(geo.foco.y, exp.y) && near2(geo.foco.w, exp.w) && near2(geo.foco.h, exp.h),
              JSON.stringify({ foco: geo.foco, esperado: exp }));
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

        await guarded('C4 botón de pausa (WCAG 2.2.2)', async () => {
          const pauseBtn = page.locator(pausa);
          const frame = page.locator(marco);
          check('C4 hay un botón «Pausar guía» con aria-pressed="false"', (await pauseBtn.isVisible()) && (await pauseBtn.getAttribute('aria-pressed')) === 'false' && /Pausar guía/.test((await pauseBtn.textContent()) ?? ''));
          await pauseBtn.click();
          check('C4 al pulsarlo: aria-pressed="true", texto «Reanudar guía» y data-paused="true"',
            (await pauseBtn.getAttribute('aria-pressed')) === 'true' && /Reanudar guía/.test((await pauseBtn.textContent()) ?? '') && (await frame.getAttribute('data-paused')) === 'true');
          await page.clock.runFor(interval * 2);
          check('C4 con la guía pausada por el botón no avanza', await waitSingleStep(page, 1, 1500), `pasos: ${(await currentSteps(page)).join(',')}`);
          await pauseBtn.click();
          await page.clock.runFor(interval);
          check('C4 al reanudar con el botón avanza al paso 2', await waitSingleStep(page, 2), `pasos: ${(await currentSteps(page)).join(',')}`);
        });

        await guarded('C4 pestaña oculta (visibilitychange)', async () => {
          await radio(page, 'Sin guía').click();
          await radio(page, 'Con guía').click();
          await waitSingleStep(page, 1);
          const setHidden = (hidden) => page.evaluate((h) => {
            Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (h ? 'hidden' : 'visible') });
            document.dispatchEvent(new Event('visibilitychange'));
          }, hidden);
          await setHidden(true);
          await page.clock.runFor(interval * 2);
          check('C4 con la pestaña oculta la guía no avanza', await waitSingleStep(page, 1, 1500), `pasos: ${(await currentSteps(page)).join(',')}`);
          await setHidden(false);
          await page.clock.runFor(interval);
          check('C4 al volver a la pestaña la guía se reanuda', await waitSingleStep(page, 2), `pasos: ${(await currentSteps(page)).join(',')}`);
        });

        await guarded('C4 fuera de pantalla', async () => {
          await radio(page, 'Sin guía').click();
          await radio(page, 'Con guía').click();
          await waitSingleStep(page, 1);
          await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
          await page.waitForFunction((sel) => {
            const r = document.querySelector(sel).getBoundingClientRect();
            return r.bottom < 0 || r.top > window.innerHeight;
          }, GUIA);
          await page.waitForTimeout(300); // IntersectionObserver no depende del reloj simulado
          const before = await textOf(page, announce);
          await page.clock.runFor(interval * 2);
          check('C4 con la sección fuera de pantalla no avanza ni cambia el anuncio', (await waitSingleStep(page, 1, 1500)) && (await textOf(page, announce)) === before, `pasos: ${(await currentSteps(page)).join(',')}`);
          await page.locator(GUIA).scrollIntoViewIfNeeded();
          await page.waitForTimeout(300);
          await page.mouse.move(0, 0); // sin hover sobre el marco
          await page.clock.runFor(interval);
          check('C4 al volver a verla, la guía se reanuda', await waitSingleStep(page, 2), `pasos: ${(await currentSteps(page)).join(',')}`);
        });
      }
      await context.close();
    }

    /* ───── C10 (punto) + C11: tarjeta de barras, pausa y tiempo restante ───── */
    console.log('\nC10/C11 · píldora y tarjeta de barras');
    {
      const { context, page } = await openContext(browser, origin, { viewport: VIEWPORTS[0] });
      if (!(await openLanding(page, origin))) {
        check('C11 la sección #guia existe', false, '#guia no está en el DOM');
      } else {
        await guarded('C10 punto de la píldora', async () => {
          const dotSin = await animationNameOf(page, estadoPunto);
          check('C10 en «Sin guía» el punto de la píldora está quieto (animation-name none)', dotSin === 'none', dotSin === null ? 'no existe [data-testid="guia-estado-punto"]' : `animation-name=${dotSin}`);
          await radio(page, 'Con guía').click();
          await waitSingleStep(page, 1);
          const dotCon = await animationNameOf(page, estadoPunto);
          check('C10 en «Con guía» el punto de la píldora late (animation-name distinto de none)', dotCon !== null && dotCon !== 'none', dotCon === null ? 'no existe [data-testid="guia-estado-punto"]' : `animation-name=${dotCon}`);
        });

        await guarded('C11 estados de las filas', async () => {
          if ((await page.locator(GUIA).getAttribute('data-mode')) !== 'con-guia') await radio(page, 'Con guía').click();
          // El avance solo corre con la sección a la vista (IntersectionObserver, threshold 0.25).
          await page.locator(GUIA).scrollIntoViewIfNeeded();
          await page.mouse.move(0, 0); // sin hover sobre el marco
          await waitSingleStep(page, 1);
          check('C11 paso 1: filas activa, pendiente, pendiente', await waitRowStates(page, 'activa,pendiente,pendiente'), `estados: ${await rowStates(page)}`);
          for (const [expected, step] of [['completa,activa,pendiente', 2], ['completa,completa,activa', 3], ['activa,pendiente,pendiente', 1]]) {
            await page.clock.runFor(interval);
            check(`C11 tras ${interval} ms (paso ${step}): filas ${expected.replace(/,/g, ', ')}`, (await waitRowStates(page, expected)) && (await waitSingleStep(page, step)), `estados: ${await rowStates(page)}, pasos: ${(await currentSteps(page)).join(',')}`);
          }
          const info = await activeBarInfo(page);
          check('C11 la barra de la fila activa anima y está en marcha (animation-play-state running)', !!info && info.count > 0 && info.states.every((s) => s === 'running'), JSON.stringify(info));
        });

        await guarded('C11 pausa con tiempo restante', async () => {
          const pauseBtn = page.locator(pausa);
          // Paso 1 recién empezado (tras volver de 3 → 1): consumir 1500 ms y pausar con el botón.
          await page.clock.runFor(1500);
          await settle(page);
          check('C11 con 1500 ms transcurridos sigue en el paso 1', (await rowStates(page)) === 'activa,pendiente,pendiente' && (await waitSingleStep(page, 1, 500)), `estados: ${await rowStates(page)}`);
          await pauseBtn.click();
          check('C11 «Pausar guía» queda pulsado (aria-pressed="true")', (await pauseBtn.getAttribute('aria-pressed')) === 'true', `aria-pressed=${await pauseBtn.getAttribute('aria-pressed')}`);
          const frozen = await page
            .waitForFunction((sel) => {
              const row = [...document.querySelectorAll(sel)].find((r) => r.getAttribute('data-estado') === 'activa');
              const bar = row?.querySelector('[data-testid="guia-barra"]');
              const animated = bar ? [bar, ...bar.querySelectorAll('*')].filter((el) => getComputedStyle(el).animationName !== 'none') : [];
              return animated.length > 0 && animated.every((el) => getComputedStyle(el).animationPlayState === 'paused');
            }, filas, { timeout: 2000 })
            .then(() => true)
            .catch(() => false);
          const before = await activeBarInfo(page);
          check('C11 en pausa la barra activa tiene animation-play-state «paused»', frozen, JSON.stringify(before));
          // WCAG 2.2.2: «Pausar guía» detiene todo lo que se mueve en la sección, también el anillo y el punto que late.
          const decorPaused = await page.evaluate(() => ['[data-testid="guia-anillo"]', '[data-testid="guia-estado-punto"]'].map((s) => {
            const el = document.querySelector(`#guia ${s}`);
            return el ? getComputedStyle(el).animationPlayState : null;
          }));
          check('C11 en pausa el anillo y el punto de la píldora también se congelan (animation-play-state «paused»)', decorPaused.every((s) => s === 'paused'), JSON.stringify(decorPaused));
          // La animación CSS corre en tiempo real: si no está congelada, su scaleX cambia en 400 ms reales.
          await page.waitForTimeout(400);
          const after = await activeBarInfo(page);
          // scaleX < 1: la barra se congeló a medio llenar (si ya estuviera llena la comprobación no probaría nada).
          check('C11 en pausa el relleno de la barra queda a medias y no avanza', typeof before?.scaleX === 'number' && before.scaleX < 1 && before.scaleX === after?.scaleX, `scaleX ${before?.scaleX} → ${after?.scaleX}`);

          await page.clock.runFor(5000);
          await settle(page);
          check('C11 en pausa, tras 5000 ms el paso NO avanza (sigue el 1)', (await rowStates(page)) === 'activa,pendiente,pendiente' && (await waitSingleStep(page, 1, 500)), `estados: ${await rowStates(page)}, pasos: ${(await currentSteps(page)).join(',')}`);

          await pauseBtn.click();
          check('C11 «Reanudar guía» devuelve aria-pressed="false"', (await pauseBtn.getAttribute('aria-pressed')) === 'false', `aria-pressed=${await pauseBtn.getAttribute('aria-pressed')}`);
          const resumed = await page
            .waitForFunction((sel) => {
              const row = [...document.querySelectorAll(sel)].find((r) => r.getAttribute('data-estado') === 'activa');
              const bar = row?.querySelector('[data-testid="guia-barra"]');
              const animated = bar ? [bar, ...bar.querySelectorAll('*')].filter((el) => getComputedStyle(el).animationName !== 'none') : [];
              return animated.length > 0 && animated.every((el) => getComputedStyle(el).animationPlayState === 'running');
            }, filas, { timeout: 2000 })
            .then(() => true)
            .catch(() => false);
          check('C11 al reanudar la barra activa vuelve a animation-play-state «running»', resumed, JSON.stringify(await activeBarInfo(page)));

          // Quedan 2000 ms del paso 1: a los 1800 ms aún no avanza (no salta pasos) y a los 2100 ms ya está en el 2
          // (no reinicia el intervalo completo de 3500 ms).
          await page.clock.runFor(1800);
          await settle(page);
          check('C11 al reanudar, 1800 ms después sigue en el paso 1', (await rowStates(page)) === 'activa,pendiente,pendiente' && (await waitSingleStep(page, 1, 500)), `estados: ${await rowStates(page)}, pasos: ${(await currentSteps(page)).join(',')}`);
          await page.clock.runFor(300);
          check('C11 al reanudar, 2100 ms después pasa al paso 2 (solo espera el tiempo restante)', (await waitSingleStep(page, 2)) && (await waitRowStates(page, 'completa,activa,pendiente')), `estados: ${await rowStates(page)}, pasos: ${(await currentSteps(page)).join(',')}`);
          check('C10 tras reanudar, la píldora dice «Guiado · Paso 2 de 3»', (await textOf(page, estado)) === 'Guiado · Paso 2 de 3', `píldora="${await textOf(page, estado)}"`);
        });
      }
      await context.close();
    }

    /* ───── Caso límite: la captura no carga ───── */
    console.log('\nCaso límite · imagen que falla');
    {
      const { context, page } = await openContext(browser, origin, { viewport: VIEWPORTS[0] });
      await page.route(/catalogo[^/]*\.webp(\?.*)?$/, (route) => route.abort());
      if (!(await openLanding(page, origin))) {
        check('Imagen que falla: la sección #guia existe', false, '#guia no está en el DOM');
      } else {
        await guarded('Imagen que falla', async () => {
          const altText = await page.locator(`${marco} img`).getAttribute('alt');
          const shown = await page.locator(marco).evaluate((el, alt) => [...el.querySelectorAll('div')].some((d) => d.textContent?.trim() === alt && getComputedStyle(d).visibility !== 'hidden' && d.getBoundingClientRect().height > 0), altText);
          check('Imagen que falla: el marco muestra el texto alternativo', shown, `alt="${altText}"`);
          await radio(page, 'Con guía').click();
          check('Imagen que falla: el selector y la guía siguen funcionando', (await page.locator(GUIA).getAttribute('data-mode')) === 'con-guia' && (await waitSingleStep(page, 1)));
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
        check(`${tag} C12 (reduce) la sección expone data-reduced="true"`, (await page.locator(GUIA).getAttribute('data-reduced')) === 'true', `data-reduced=${await page.locator(GUIA).getAttribute('data-reduced')}`);
        const ringSin = await animationNameOf(page, anillo);
        check(`${tag} C12 (reduce) en «Sin guía» el anillo no anima (animation-name none)`, ringSin === 'none', `animation-name=${ringSin}`);
        const dotSin = await animationNameOf(page, estadoPunto);
        check(`${tag} C12 (reduce) en «Sin guía» el punto de la píldora no late`, dotSin === 'none', dotSin === null ? 'no existe [data-testid="guia-estado-punto"]' : `animation-name=${dotSin}`);

        await radio(page, 'Con guía').click();
        // Cambio instantáneo: sin animaciones ni transiciones en toda la sección justo después de cambiar de modo.
        const anims = await page.evaluate(() => (document.getElementById('guia')?.getAnimations({ subtree: true }) ?? []).map((a) => a.animationName ?? a.transitionProperty ?? a.constructor.name));
        check(`${tag} C12 (reduce) el cambio de modo es instantáneo (ninguna animación ni transición en #guia)`, anims.length === 0, anims.slice(0, 5).join(', '));
        await page.waitForFunction((sel) => document.querySelectorAll(sel).length === 3, marker, { timeout: 3000 }).catch(() => {});
        const steps = (await currentSteps(page)).sort();
        check(`${tag} C4 (reduce) en «Con guía» están los 3 marcadores a la vez`, steps.join(',') === '1,2,3', `pasos: ${steps.join(',') || 'ninguno'}`);
        check(`${tag} C4 (reduce) no hay tooltip`, (await countOf(page, tooltip)) === 0, `${await countOf(page, tooltip)} tooltips`);
        // Sustituye a la antigua ol[data-testid="guia-pasos-estaticos"]: los pasos se leen en la tarjeta.
        await page.locator(tarjeta).scrollIntoViewIfNeeded();
        const texts = await rowTexts(page);
        check(`${tag} C4 (reduce) la tarjeta muestra los 3 pasos de la guía en orden`, (await page.locator(lista).isVisible()) && texts.length === 3 && texts.every((t, i) => t.startsWith(STEP_LABELS[i])), JSON.stringify(texts));
        check(`${tag} C12 (reduce) las 3 filas están «completa»`, (await rowStates(page)) === 'completa,completa,completa', `estados: ${await rowStates(page)}`);
        const pill = await textOf(page, estado);
        check(`${tag} C12 (reduce) la píldora dice «Guiado · 3 pasos»`, pill === 'Guiado · 3 pasos', `píldora="${pill}"`);
        const ring = await animationNameOf(page, anillo);
        check(`${tag} C12 (reduce) en «Con guía» el anillo no gira (data-girando="false" y animation-name none)`, ring === 'none' && (await page.locator(anillo).getAttribute('data-girando')) === 'false', `animation-name=${ring}, data-girando=${await page.locator(anillo).getAttribute('data-girando')}`);
        const dot = await animationNameOf(page, estadoPunto);
        check(`${tag} C12 (reduce) en «Con guía» el punto de la píldora no late`, dot === 'none', dot === null ? 'no existe [data-testid="guia-estado-punto"]' : `animation-name=${dot}`);
        const bars = await barAnimations(page);
        check(`${tag} C12 (reduce) las barras se muestran sin animar (animation-name none en barra y relleno)`, bars.length === 3 && bars.every((names) => names && names.every((n) => n === 'none')), JSON.stringify(bars));
        check(`${tag} C12 (reduce) no hay botón de pausa`, (await countOf(page, `${GUIA} [data-testid="guia-pausa"]`)) === 0, `${await countOf(page, `${GUIA} [data-testid="guia-pausa"]`)} botones`);
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
        // El CTA vive dentro de la tarjeta; su nombre accesible es exactamente «Ir al catálogo» (la › es decorativa).
        const cta = ctaIn(page, tarjeta).first();
        await cta.scrollIntoViewIfNeeded();
        check(`${tag} C5 hay un <button type="button"> «Ir al catálogo» dentro de la tarjeta`, (await cta.isVisible()) && (await cta.getAttribute('type')) === 'button', `type=${await cta.getAttribute('type').catch(() => null)}`);
        await cta.click();
        const heading = page.locator('#catalog-page-heading');
        await heading.waitFor({ state: 'visible', timeout: 8000 });
        check(`${tag} C5 el clic muestra la página del Catálogo`, (await heading.textContent())?.trim() === 'Skills de la comunidad', await heading.textContent());
        check(`${tag} C5 la sección #guia ya no está en pantalla`, !(await page.locator(GUIA).isVisible().catch(() => false)));
      });
      await context.close();
    }

    /* ───── C6a/C6b: red, peso, chunk y paleta ───── */
    console.log('\nC6a/C6b · red, peso, chunk y paleta');
    {
      const { context, page, state } = await openContext(browser, origin, { viewport: VIEWPORTS[0] });
      const ready = await openLanding(page, origin);
      if (!ready) {
        check('C6a la sección #guia existe', false, '#guia no está en el DOM');
      } else {
        await guarded('C6a red', async () => {
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
          check('C6a durante la interacción con #guia no hay ninguna petición a otro origen', during.length === 0, during.map((r) => r.url).slice(0, 3).join(', '));

          const byOrigin = new Map();
          for (const r of state.requests) byOrigin.set(r.origin, (byOrigin.get(r.origin) ?? 0) + 1);
          const unexpected = [...byOrigin.keys()].filter((o) => !ALLOWED_EXTERNAL.has(o));
          check('C6a la carga de la portada solo contacta orígenes conocidos (fixture y fuentes)', unexpected.length === 0 && state.leaks.length === 0, `desconocidos: ${unexpected.join(', ')} · fugas abortadas: ${state.leaks.slice(0, 3).join(', ')}`);
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
          check('C6a todo recurso referenciado dentro de #guia (img, background, enlaces) es local', remote.length === 0, remote.slice(0, 3).map((r) => r.label).join(', '));
        });

        await guarded('C6a WebP', async () => {
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
          check(`C6a la captura emitida es un WebP real (${src.startsWith('data:') ? 'inlineada como data:' : 'en dist/'})`, bytes.length > 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP', `${kind}, ${bytes.length} B, src=${src.slice(0, 80)}`);
          check(`C6a la captura pesa ≤ 60 KB (${(bytes.length / 1024).toFixed(1)} KB)`, bytes.length > 0 && bytes.length <= MAX_WEBP_BYTES, `${bytes.length} B`);
        });

        await guarded('C6a chunk', async () => {
          const html = readFileSync(join(OUT_DIR, 'index.html'), 'utf8');
          const entry = /<script[^>]+type="module"[^>]+src="([^"]+)"/.exec(html)?.[1];
          const dir = join(OUT_DIR, 'bundle');
          const fallback = existsSync(dir) ? readdirSync(dir).find((f) => /^index-.*\.js$/.test(f)) : undefined;
          const file = entry ? join(OUT_DIR, entry) : fallback ? join(dir, fallback) : null;
          if (!file || !existsSync(file)) throw new Error('no se encontró el chunk inicial index-*.js en dist/');
          const size = statSync(file).size;
          const kb = (size / 1000).toFixed(1);
          // C6b: la deuda del bundle quedó pagada al integrar la 004 (≈ 349,7 kB): ahora es una comprobación real.
          check(`C6b el chunk inicial ${file.split(/[\\/]/).pop()} pesa < 350 kB (${kb} kB)`, size > 0 && size < MAX_INITIAL_CHUNK_BYTES, `${size} B frente a ${MAX_INITIAL_CHUNK_BYTES} B`);
          // No regresión: la 005 no puede engordar el chunk inicial respecto a la base (la sección va en su propio chunk).
          check(`C6a la sección no engorda el chunk inicial (≤ base + ${CHUNK_SLACK_BYTES / 1000} kB)`, size > 0 && size <= BASELINE_INITIAL_CHUNK_BYTES + CHUNK_SLACK_BYTES, `${size} B frente a base ${BASELINE_INITIAL_CHUNK_BYTES} B`);
          const lazyChunk = existsSync(dir) && readdirSync(dir).some((f) => /^GuideContrastShowcase-.*\.js$/.test(f));
          check('C6a la sección se carga en un chunk diferido propio (GuideContrastShowcase-*.js)', lazyChunk);
        });

        await guarded('C6a dependencias', async () => {
          const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
          const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
          // motion (motion/react) fue autorizado por el humano el 2026-11-27 para chunks diferidos (docs/rules/frontend.md);
          // framer-motion y shadcn/Radix siguen bloqueados, y GuideContrastShowcase no debe importar motion.
          const banned = names.filter((n) => /^(framer-motion|class-variance-authority|@radix-ui\/.+)$/.test(n));
          check('C6a package.json no incorpora framer-motion ni shadcn/Radix', banned.length === 0, banned.join(', '));
          const guideSrc = readFileSync(resolve(ROOT, 'src', 'components', 'GuideContrastShowcase.tsx'), 'utf8');
          check('C6a #guia no importa motion ni framer-motion', !/from\s+['"](?:motion|framer-motion)/.test(guideSrc));
        });

        await guarded('C6a paleta', async () => {
          const args = { hue: ACCENT_HUE, tolerance: HUE_TOLERANCE, chromaLimit: CHROMA_LIMIT };
          for (const mode of ['Sin guía', 'Con guía']) {
            await radio(page, mode).click();
            await page.locator(GUIA).scrollIntoViewIfNeeded();
            await page.waitForTimeout(700); // deja terminar las transiciones CSS (no dependen del reloj simulado)
            const { offenders, inspected } = await page.evaluate(scanPalette, args);
            check(`C6a paleta en «${mode}»: todo acento (croma > 0,25) es cian 199° ± 8° (${inspected} nodos revisados)`, offenders.length === 0, offenders.slice(0, 5).join(' || '));
          }
          // En «Con guía» también con la sección en estado de enfoque (hover sobre el marco).
          await page.locator(marco).hover();
          const { offenders } = await page.evaluate(scanPalette, args);
          check('C6a paleta con el marco en hover (pausa)', offenders.length === 0, offenders.slice(0, 5).join(' || '));
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
