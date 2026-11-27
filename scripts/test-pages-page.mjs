/**
 * Prueba de la página «Páginas» (spec 007 · C1–C6, C11 y C12): navegación, galería con chips, modal
 * accesible con la plantilla en vivo, Escritorio/Móvil, «Usar esta página» (prompt y código reales,
 * portapapeles), «Clases que la usan», «Componentes que usa», presupuesto del build y miniaturas.
 *
 * Compila la app en una carpeta temporal (con catálogo y OAuth de prueba), la sirve con `vite preview` en
 * el puerto fijo 5197 y bloquea TODA la red externa: GitHub va simulado con `installFakeGithub`, las
 * fuentes de Google se contestan vacías y cualquier otro origen se aborta y se anota.
 *
 * Escrita contra el «Contrato de DOM» de `docs/specs/006-paginas-de-referencia/plan.md`.
 *
 * Depende de:
 *  - las miniaturas `public/pages/<id>.png` (≤ 40 KB), que genera `node scripts/capture-pages.mjs`
 *    (Fase 2 de la 006). Sin ellas fallan C2 (miniatura cargada) y C12.
 *  - `git` con la rama `main` disponible, para comparar `package.json` (C11).
 *
 * Uso: node scripts/test-pages-page.mjs
 */
import { build, preview } from 'vite';
import { build as esbuild } from 'esbuild';
import { chromium } from 'playwright';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { TEST_CATALOG_REPO, TEST_CLIENT_ID, TEST_OAUTH_URL, installFakeGithub } from './lib/github-fixture.mjs';
import { enterApp } from './lib/enter-app.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 5197;
const OUT_DIR = join(tmpdir(), 'ai-skills-studio-pages-e2e');
const SHOTS_DIR = resolve(ROOT, 'shots', 'pages');
const LESSONS_KEY = 'ai_skills_studio_lessons_v1';
const MAX_THUMB_BYTES = 40 * 1024;
/** Presupuesto del chunk inicial (kB de Vite = 1000 bytes). */
const MAX_INITIAL_CHUNK = 350_000;
/**
 * Chunk inicial de `main` (d29f7de) antes de la 006, compilado con las mismas variables de prueba.
 * Si la base ya superara 350 kB, la regla de la spec (C11) permitiría crecer como mucho 1 kB sobre ella.
 */
const BASE_INITIAL_CHUNK = 349_820;
const VIEWPORTS = [
  ['1440', 1440, 900],
  ['1024', 1024, 768],
  ['768', 768, 1024],
  ['390', 390, 844],
];

const failures = [];
function check(name, ok, detail = '') {
  console.log(`  ${ok ? 'ok ' : 'FALLA'}  ${name}${ok || !detail ? '' : ` — ${detail}`}`);
  if (!ok) failures.push(name);
}

/* ---------------- Datos reales: catálogo, ids y lógica de clases (los mismos que usa la app) ---------------- */
const helperDir = mkdtempSync(join(tmpdir(), 'codice-pages-helpers-'));
{
  const entry = join(helperDir, 'entry.ts');
  const p = (f) => JSON.stringify(join(ROOT, 'src', f).replace(/\\/g, '/'));
  writeFileSync(
    entry,
    `export * from ${p('data/pageCatalog.ts')};\nexport * from ${p('data/pageIds.ts')};\nexport { PAGE_CATEGORIES } from ${p('types/pages.ts')};\n` +
      `export { createLesson } from ${p('services/lessonsStore.ts')};\n`
  );
  await esbuild({ entryPoints: [entry], outfile: join(helperDir, 'bundle.mjs'), bundle: true, format: 'esm', platform: 'node', logLevel: 'error' });
}
const data = await import(pathToFileURL(join(helperDir, 'bundle.mjs')).href);
const { PAGE_CATALOG, PAGE_IDS, PAGE_CATEGORIES } = data;
const byId = (id) => PAGE_CATALOG.find((p) => p.id === id);

/** Texto normalizado: CRLF → LF y sin espacio final (el `?raw` y el disco pueden diferir en el fin de línea). */
const normalize = (text) => String(text ?? '').replace(/\r\n?/g, '\n').replace(/\s+$/, '');
const squash = (text) => String(text ?? '').replace(/\s+/g, ' ').trim();
const sourceOf = (meta) => readFileSync(resolve(ROOT, 'src/components/page-templates', `${meta.file}.tsx`), 'utf8');

const SEEDED_TITLE = 'Clase que usa el panel de control';
const SEEDED = data.createLesson(
  {
    title: SEEDED_TITLE,
    summary: 'Una clase sembrada para comprobar «Clases que la usan».',
    level: 'Intermedio',
    tags: ['paginas'],
    bodyMarkdown: '## Panel\n\nEsta clase enlaza la página de referencia del panel de control.',
    skillIds: [],
    componentIds: [],
    pageIds: ['dashboard'],
    videos: [],
  },
  { login: 'SuarezCaceres' },
  [],
  new Date('2026-11-20T10:00:00.000Z')
);

/* ---------------- Contexto aislado ---------------- */
async function openContext(browser, origin, { viewport = { width: 1440, height: 900 }, lessons = null, failingClipboard = false } = {}) {
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin });
  const leaks = [];
  // 1) Red de seguridad: se registra primero para que las rutas siguientes tengan prioridad.
  await context.route(
    (url) => (url.protocol === 'http:' || url.protocol === 'https:') && url.origin !== origin,
    (route) => {
      leaks.push(route.request().url());
      return route.abort();
    }
  );
  // 2) Fuentes de la portada (index.html): vacías, sin internet.
  await context.route('https://fonts.googleapis.com/**', (route) => route.fulfill({ status: 200, contentType: 'text/css', body: '/* sin fuentes en pruebas */' }));
  await context.route('https://fonts.gstatic.com/**', (route) => route.fulfill({ status: 200, contentType: 'font/woff2', body: '' }));
  // 3) GitHub, avatares y OAuth simulados.
  await installFakeGithub(context);
  // 4) CSP y, si se pide, un portapapeles que falla.
  await context.addInitScript(() => {
    window.__cspViolations = [];
    document.addEventListener('securitypolicyviolation', (e) => window.__cspViolations.push(`${e.violatedDirective} ← ${e.blockedURI}`));
  });
  if (failingClipboard) {
    await context.addInitScript(() => {
      try {
        Object.defineProperty(navigator.clipboard, 'writeText', { configurable: true, value: () => Promise.reject(new DOMException('Denegado', 'NotAllowedError')) });
      } catch {
        /* sin portapapeles */
      }
    });
  }
  if (lessons) {
    await context.addInitScript(
      ([key, seed]) => {
        try {
          if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(seed));
        } catch {
          /* sin almacenamiento */
        }
      },
      [LESSONS_KEY, lessons]
    );
  }
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  const state = { errors: [], external: [], leaks };
  page.on('console', (m) => m.type() === 'error' && state.errors.push(`console: ${m.text()}`));
  page.on('pageerror', (e) => state.errors.push(`pageerror: ${String(e)}`));
  page.on('response', (r) => r.status() >= 400 && r.url().startsWith(origin) && state.errors.push(`${r.status()} ${r.url()}`));
  page.on('request', (r) => {
    try {
      const u = new URL(r.url());
      if ((u.protocol === 'http:' || u.protocol === 'https:') && u.origin !== origin) state.external.push(r.url());
    } catch {
      /* data:, blob: */
    }
  });
  return { context, page, state };
}

/* ---------------- Navegación ---------------- */
async function gotoLanding(page, origin) {
  await page.goto(`${origin}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(300);
}

/** Desde la portada, entra al estudio y elige un módulo de la barra «Módulos del estudio». */
async function openModule(page, origin, label) {
  await gotoLanding(page, origin);
  await enterApp(page);
  await page.waitForTimeout(300);
  await page.evaluate((text) => {
    const links = [...document.querySelectorAll('nav[aria-label="Módulos del estudio"] a')];
    links.find((a) => a.textContent.trim().startsWith(text))?.click();
  }, label);
}

async function openPages(page, origin) {
  await openModule(page, origin, 'Páginas');
  await page.locator('#pages-heading').waitFor();
}

/**
 * Ejecuta un bloque de comprobaciones. Si algo lanza (un elemento que no aparece), lo anota como fallo y
 * sigue con el siguiente bloque desde la galería limpia, para que una sola ausencia no oculte el resto.
 */
async function section(page, origin, name, fn) {
  console.log(`\n${name}`);
  try {
    await fn();
  } catch (err) {
    check(`${name}: el recorrido llega al final`, false, String(err?.message ?? err).split('\n')[0]);
    await page.keyboard.press('Escape').catch(() => {});
    await openPages(page, origin).catch(() => {});
  }
}

const cardsLoc = (page) => page.locator('button[data-testid="pagina-tarjeta"][data-page-id]');
const card = (page, id) => page.locator(`button[data-testid="pagina-tarjeta"][data-page-id="${id}"]`);
const chips = (page) => page.locator('[data-testid="paginas-filtro"] button[aria-pressed]');
const chip = (page, label) => chips(page).filter({ hasText: new RegExp(`^\\s*${label.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}\\s*\\d+\\s*$`) });
const modal = (page) => page.locator('[role="dialog"][aria-modal="true"][data-testid="pagina-modal"]');
const frame = (page) => modal(page).locator('[data-testid="pagina-marco"]');
const position = (page) => modal(page).locator('[data-testid="pagina-posicion"]');
const notice = (page) => modal(page).locator('[data-testid="pagina-aviso"][aria-live="polite"]');

/** Título visible de la modal (su `h2`). */
const modalTitle = async (page) => squash(await modal(page).locator('h2').first().innerText());

/** Espera a que la plantilla diferida esté pintada dentro del marco. */
async function waitTemplate(page) {
  await page.waitForFunction(
    () => {
      const el = document.querySelector('[data-testid="pagina-modal"] [data-testid="pagina-marco"]');
      return !!el && !el.querySelector('[data-testid="pagina-error"]') && el.innerText.trim().length > 20;
    },
    null,
    { timeout: 10000 }
  );
}

async function closeModal(page) {
  await page.keyboard.press('Escape');
  await modal(page).waitFor({ state: 'detached', timeout: 3000 }).catch(() => {});
}

const activeInside = (page, selector) => page.evaluate((sel) => !!document.activeElement?.closest(sel), selector);
const activePageId = (page) => page.evaluate(() => document.activeElement?.getAttribute('data-page-id') ?? null);
const isOff = async (loc) => (await loc.isDisabled()) || (await loc.getAttribute('aria-disabled')) === 'true';
const columns = (loc) => loc.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(/\s+/).filter((t) => t && t !== 'none').length);
const docOverflow = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

/* ---------------- Comprobaciones del build (C11 y C12) ---------------- */
function checkBuild() {
  console.log('\nBuild, dependencias y miniaturas (C11, C12)');
  const html = readFileSync(join(OUT_DIR, 'index.html'), 'utf8');
  // El chunk de entrada de Vite (`bundle/index-*.js`); los `assets/*.js` del kit estático no cuentan.
  const entry = /<script[^>]+type="module"[^>]*\ssrc="([^"]*\/index-[^"/]+\.js)"/.exec(html)?.[1];
  const entryPath = entry ? join(OUT_DIR, entry.replace(/^\.?\//, '')) : null;
  const size = entryPath && existsSync(entryPath) ? statSync(entryPath).size : -1;
  const budget = BASE_INITIAL_CHUNK > MAX_INITIAL_CHUNK ? BASE_INITIAL_CHUNK + 1000 : MAX_INITIAL_CHUNK;
  check(`el chunk inicial (${entry ?? '¿?'}) pesa < 350 kB`, size > 0 && size < budget, `${size} bytes`);
  console.log(`       chunk inicial: ${size} bytes (${size - BASE_INITIAL_CHUNK >= 0 ? '+' : ''}${size - BASE_INITIAL_CHUNK} frente a main)`);

  const chunkDir = entryPath ? dirname(entryPath) : join(OUT_DIR, 'bundle');
  const assets = existsSync(chunkDir) ? readdirSync(chunkDir) : [];
  check('la página «Páginas» va en su propio chunk diferido', assets.some((f) => /^PagesPage-.*\.js$/.test(f)), assets.filter((f) => f.endsWith('.js')).join(', '));
  const missingChunks = PAGE_CATALOG.filter((p) => !assets.some((f) => new RegExp(`^${p.file}-.*\\.js$`).test(f))).map((p) => p.file);
  check('cada plantilla va en su propio chunk diferido', missingChunks.length === 0, missingChunks.join(', '));
  const preloaded = [...html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="([^"]+)"/g)].map((mm) => mm[1]);
  const eager = preloaded.filter((h) => /PagesPage|PagePreviewModal/.test(h) || PAGE_CATALOG.some((p) => h.includes(`/${p.file}-`)));
  check('index.html no precarga la página ni las plantillas', eager.length === 0, eager.join(', '));
  const initialCode = entryPath && existsSync(entryPath) ? readFileSync(entryPath, 'utf8') : '';
  const leakedPrompt = PAGE_CATALOG.find((p) => initialCode.includes(p.prompt.slice(0, 60)));
  check('los prompts del catálogo no viajan en el chunk inicial', !leakedPrompt, leakedPrompt?.id ?? '');

  // La 007 no añade dependencias: su código solo importa React, lucide-react y archivos propios.
  // (No se compara package.json con main: otras ramas integradas, como hero-forge, añaden las suyas.)
  const OWN_DIRS = ['src/components/pages', 'src/components/page-templates'];
  const OWN_FILES = ['src/data/pageIds.ts', 'src/data/pageCatalog.ts', 'src/data/pageRegistry.ts', 'src/types/pages.ts'];
  const ALLOWED = new Set(['react', 'react-dom', 'lucide-react']);
  const ownFiles = [...OWN_FILES, ...OWN_DIRS.flatMap((d) => readdirSync(resolve(ROOT, d)).map((n) => `${d}/${n}`))].filter((p) => /.(tsx?|css)$/.test(p));
  const foreign = [];
  for (const rel of ownFiles) {
    for (const m of readFileSync(resolve(ROOT, rel), 'utf8').matchAll(/froms+['"]([^'"]+)['"]/g)) {
      const spec = m[1];
      if (spec.startsWith('.')) continue;
      const pkgName = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0];
      if (!ALLOWED.has(pkgName)) foreign.push(`${rel}: ${spec}`);
    }
  }
  check('el código de la 007 no usa dependencias nuevas (solo react, react-dom y lucide-react)', ownFiles.length > 10 && foreign.length === 0, foreign.join(', ') || `${ownFiles.length} archivos`);

  for (const id of PAGE_IDS) {
    const meta = byId(id);
    const file = resolve(ROOT, 'public', meta?.thumbnail ?? `pages/${id}.png`);
    const bytes = existsSync(file) ? statSync(file).size : -1;
    check(`C12: existe public/pages/${id}.png y pesa ≤ 40 KB`, bytes > 0 && bytes <= MAX_THUMB_BYTES, bytes < 0 ? 'no existe' : `${bytes} bytes`);
  }
  check('el catálogo apunta cada miniatura a pages/<id>.png', PAGE_CATALOG.every((p) => p.thumbnail === `pages/${p.id}.png`));
}

/* ---------------- Recorrido principal ---------------- */
async function main() {
  rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(SHOTS_DIR, { recursive: true });
  process.env.VITE_CATALOG_REPO = TEST_CATALOG_REPO;
  process.env.VITE_GITHUB_CLIENT_ID = TEST_CLIENT_ID;
  process.env.VITE_GITHUB_OAUTH_URL = TEST_OAUTH_URL;
  console.log('Compilando la app con catálogo y OAuth de prueba...');
  await build({ root: ROOT, logLevel: 'error', build: { outDir: OUT_DIR, emptyOutDir: true } });
  checkBuild();

  const server = await preview({ root: ROOT, build: { outDir: OUT_DIR }, preview: { port: PORT, host: '127.0.0.1', strictPort: true } });
  const origin = `http://127.0.0.1:${PORT}`;
  const browser = await chromium.launch({ headless: true });
  const contexts = [];

  try {
    const main = await openContext(browser, origin);
    contexts.push(main);
    const { page } = main;

    const [first, second, third] = PAGE_CATALOG;
    await section(page, origin, 'Ruta y navegación (C1)', async () => {
      await gotoLanding(page, origin);

      await openPages(page, origin);
      const navLabels = (await page.locator('nav[aria-label="Módulos del estudio"] a').allInnerTexts()).map((t) => t.trim());
      const iComp = navLabels.indexOf('Componentes');
      check('«Páginas» está justo después de «Componentes» en la barra de módulos', iComp >= 0 && navLabels[iComp + 1] === 'Páginas', navLabels.join(' | '));
      check('la entrada «Páginas» queda marcada como actual (aria-current=page)', (await page.locator('nav[aria-label="Módulos del estudio"] a[aria-current="page"]').innerText()).trim() === 'Páginas');
      check('la página es section[aria-labelledby="pages-heading"] con h1 «Páginas»', (await page.locator('section[aria-labelledby="pages-heading"] h1#pages-heading').innerText()).trim() === 'Páginas');

    });
    await section(page, origin, 'Galería (C2)', async () => {
      main.state.external.length = 0;
      await cardsLoc(page).first().waitFor();
      const ids = await cardsLoc(page).evaluateAll((els) => els.map((el) => el.getAttribute('data-page-id')));
      check('hay 6 tarjetas, una por página del registro', ids.length === 6 && [...ids].sort().join() === [...PAGE_IDS].sort().join(), ids.join(', '));
      for (const meta of PAGE_CATALOG) {
        const text = squash(await card(page, meta.id).innerText().catch(() => ''));
        check(`tarjeta ${meta.id}: nombre, «Le dicen: ${meta.nickname}» y categoría`, text.includes(meta.name) && text.includes(`Le dicen: ${meta.nickname}`) && text.toLocaleLowerCase('es').includes(meta.category.toLocaleLowerCase('es')), text);
      }
      const thumbsOk = await page
        .waitForFunction(
          () => {
            const imgs = [...document.querySelectorAll('button[data-testid="pagina-tarjeta"] img')];
            return imgs.length === 6 && imgs.every((img) => img.complete && img.naturalWidth > 0);
          },
          null,
          { timeout: 8000 }
        )
        .then(() => true, () => false);
      const thumbs = await cardsLoc(page).evaluateAll((els) => els.map((el) => ({ id: el.getAttribute('data-page-id'), src: el.querySelector('img')?.getAttribute('src') ?? '', w: el.querySelector('img')?.naturalWidth ?? 0 })));
      check('las 6 miniaturas se cargan (naturalWidth > 0)', thumbsOk, JSON.stringify(thumbs.filter((t) => !t.w)));
      check('cada miniatura es local: pages/<id>.png', thumbs.every((t) => t.src.endsWith(`pages/${t.id}.png`) && !/^https?:/.test(t.src)), thumbs.map((t) => t.src).join(', '));

      const chipTexts = (await chips(page).allInnerTexts()).map(squash);
      const expectedChips = ['Todas 6', ...PAGE_CATEGORIES.map((c) => `${c} ${PAGE_CATALOG.filter((p) => p.category === c).length}`)];
      check('los chips muestran «Todas 6» y cada categoría con su recuento, en orden', chipTexts.join('|') === expectedChips.join('|'), chipTexts.join('|'));
      check('al entrar, «Todas» está pulsado', (await chip(page, 'Todas').getAttribute('aria-pressed')) === 'true');
      for (const cat of PAGE_CATEGORIES) {
        await chip(page, cat).click();
        const visible = await cardsLoc(page).evaluateAll((els) => els.map((el) => el.getAttribute('data-page-id')));
        const expected = PAGE_CATALOG.filter((p) => p.category === cat).map((p) => p.id);
        check(`el chip «${cat}» deja solo sus tarjetas y queda pulsado`, visible.join() === expected.join() && (await chip(page, cat).getAttribute('aria-pressed')) === 'true' && (await chip(page, 'Todas').getAttribute('aria-pressed')) === 'false', visible.join(', '));
      }
      await chip(page, 'Todas').click();
      check('«Todas» vuelve a mostrar las 6', (await cardsLoc(page).count()) === 6);

    });
    await section(page, origin, 'Modal accesible (C3)', async () => {
      await card(page, first.id).click();
      await modal(page).waitFor();
      check('clic abre role=dialog con aria-modal=true', (await modal(page).count()) === 1);
      check('la modal se nombra con el título de la página', (await page.getByRole('dialog', { name: first.name, exact: true }).count()) === 1 && (await modalTitle(page)) === first.name);
      check('la modal se monta en un portal sobre document.body', await page.evaluate(() => document.querySelector('[data-testid="pagina-modal"]')?.closest('section[aria-labelledby="pages-heading"]') === null));
      await waitTemplate(page).catch(() => {});
      const modalText = squash(await modal(page).innerText());
      check('muestra el apodo y la descripción', modalText.includes(first.nickname) && modalText.includes(first.description), modalText.slice(0, 200));
      check('pinta la plantilla en vivo dentro del marco', await frame(page).evaluate((el) => el.innerText.trim().length > 20 && !el.querySelector('[data-testid="pagina-error"]')).catch(() => false));
      const compLinks = modal(page).locator('[data-testid="pagina-componentes"]').locator('a, button');
      check('«Componentes que usa» tiene un enlace por componente', (await compLinks.count()) === first.componentIds.length, `${await compLinks.count()} de ${first.componentIds.length}`);
      check('aparece la posición «1 / 6»', squash(await position(page).innerText()) === '1 / 6', await position(page).innerText().catch(() => ''));
      check('al abrirla, el foco va al botón «Cerrar»', await page.evaluate(() => document.activeElement?.getAttribute('aria-label') === 'Cerrar' && !!document.activeElement.closest('[data-testid="pagina-modal"]')));
      let trapped = true;
      for (let i = 0; i < 30 && trapped; i++) {
        await page.keyboard.press('Tab');
        trapped = await activeInside(page, '[data-testid="pagina-modal"]');
      }
      for (let i = 0; i < 10 && trapped; i++) {
        await page.keyboard.press('Shift+Tab');
        trapped = await activeInside(page, '[data-testid="pagina-modal"]');
      }
      check('Tab y Shift+Tab no sacan el foco de la modal', trapped);
      await closeModal(page);
      check('Esc cierra la modal', (await modal(page).count()) === 0);
      check('al cerrar, el foco vuelve a la tarjeta que la abrió', (await activePageId(page)) === first.id, String(await activePageId(page)));

      await card(page, second.id).focus();
      await page.keyboard.press('Enter');
      await modal(page).waitFor();
      check('Enter sobre una tarjeta abre su modal', (await modalTitle(page)) === second.name);
      await modal(page).getByRole('button', { name: 'Cerrar', exact: true }).click();
      await modal(page).waitFor({ state: 'detached' }).catch(() => {});
      check('el botón «Cerrar» cierra y devuelve el foco a la tarjeta', (await modal(page).count()) === 0 && (await activePageId(page)) === second.id);

      await card(page, third.id).focus();
      await page.keyboard.press(' ');
      await modal(page).waitFor();
      check('Espacio sobre una tarjeta abre su modal', (await modalTitle(page)) === third.name);
      // Clic en el fondo oscuro (esquina de la ventana, fuera del diálogo).
      const outside = await modal(page).evaluate((el) => {
        const r = el.getBoundingClientRect();
        return r.left > 6 ? { x: 3, y: Math.round(window.innerHeight / 2) } : { x: Math.round(window.innerWidth / 2), y: 3 };
      });
      await page.mouse.click(outside.x, outside.y);
      await modal(page).waitFor({ state: 'detached', timeout: 3000 }).catch(() => {});
      check('un clic en el fondo oscuro cierra la modal y devuelve el foco', (await modal(page).count()) === 0 && (await activePageId(page)) === third.id, String(await activePageId(page)));
      if ((await modal(page).count()) > 0) await closeModal(page);

      await card(page, first.id).click();
      await modal(page).waitFor();
      await modal(page).getByRole('button', { name: 'Cerrar', exact: true }).focus();
      await page.keyboard.press('ArrowDown');
      check('↓ pasa a la página siguiente y la posición dice «2 / 6»', (await modalTitle(page)) === second.name && squash(await position(page).innerText()) === '2 / 6', `${await modalTitle(page)} · ${await position(page).innerText()}`);
      check('el nombre accesible sigue al título nuevo', (await page.getByRole('dialog', { name: second.name, exact: true }).count()) === 1);
      await page.keyboard.press('ArrowUp');
      check('↑ vuelve a la anterior («1 / 6»)', (await modalTitle(page)) === first.name && squash(await position(page).innerText()) === '1 / 6');
      await modal(page).getByRole('button', { name: 'Página siguiente' }).click();
      check('«Página siguiente» avanza («2 / 6»)', (await modalTitle(page)) === second.name && squash(await position(page).innerText()) === '2 / 6');
      await modal(page).getByRole('button', { name: 'Página anterior' }).click();
      check('«Página anterior» retrocede («1 / 6»)', (await modalTitle(page)) === first.name && squash(await position(page).innerText()) === '1 / 6');
      const lastPage = PAGE_CATALOG[PAGE_CATALOG.length - 1];
      await modal(page).getByRole('button', { name: 'Página anterior' }).click();
      check('la navegación es circular: anterior desde la primera va a la última («6 / 6»)', (await modalTitle(page)) === lastPage.name && squash(await position(page).innerText()) === '6 / 6');
      await modal(page).getByRole('button', { name: 'Página siguiente' }).click();
      check('y siguiente desde la última vuelve a la primera («1 / 6»)', (await modalTitle(page)) === first.name && squash(await position(page).innerText()) === '1 / 6');
      await closeModal(page);
      check('tras navegar, Esc devuelve el foco a la tarjeta que abrió la modal', (await activePageId(page)) === first.id, String(await activePageId(page)));

      await chip(page, 'Precios').click();
      await card(page, 'precios').click();
      await modal(page).waitFor();
      check('con un filtro de una sola página la posición dice «1 / 1»', squash(await position(page).innerText()) === '1 / 1');
      check('con «1 / 1», anterior y siguiente están desactivados', (await isOff(modal(page).getByRole('button', { name: 'Página anterior' }))) && (await isOff(modal(page).getByRole('button', { name: 'Página siguiente' }))));
      await modal(page).getByRole('button', { name: 'Cerrar', exact: true }).focus();
      await page.keyboard.press('ArrowDown');
      check('con «1 / 1», ↓ no cambia de página', (await modalTitle(page)) === byId('precios').name);
      await closeModal(page);
      await chip(page, 'Todas').click();

    });
    await section(page, origin, 'Escritorio y móvil (C4)', async () => {
      await card(page, 'tienda-online').click();
      await modal(page).waitFor();
      await waitTemplate(page).catch(() => {});
      const vista = modal(page).getByRole('radiogroup', { name: 'Vista' });
      const desktopRadio = vista.getByRole('radio', { name: 'Escritorio' });
      const mobileRadio = vista.getByRole('radio', { name: 'Móvil' });
      check('hay un radiogroup «Vista» con Escritorio (marcado) y Móvil', (await vista.count()) === 1 && (await desktopRadio.getAttribute('aria-checked').catch(() => null)) !== 'false' && (await desktopRadio.isChecked().catch(() => false)));
      check('el marco empieza en data-viewport="escritorio"', (await frame(page).getAttribute('data-viewport')) === 'escritorio');
      const grid = frame(page).locator('[data-testid="tienda-rejilla"]');
      await grid.waitFor({ timeout: 8000 }).catch(() => {});
      const desktopCols = await columns(grid).catch(() => -1);
      check('en escritorio (1440) la rejilla de Tienda online tiene 4 columnas', desktopCols === 4, `${desktopCols} columnas`);
      await mobileRadio.click();
      await page.waitForTimeout(150);
      check('«Móvil» cambia el marco a data-viewport="movil"', (await frame(page).getAttribute('data-viewport')) === 'movil' && (await mobileRadio.isChecked()));
      const mobileWidth = await frame(page).evaluate((el) => el.getBoundingClientRect().width);
      check('en móvil el marco mide unos 390 px', Math.abs(mobileWidth - 390) <= 12, `${mobileWidth}px`);
      const mobileCols = await columns(grid).catch(() => -1);
      check('en móvil la rejilla pasa a 2 columnas o menos', mobileCols >= 1 && mobileCols <= 2, `${mobileCols} columnas`);
      const frameOverflow = await frame(page).evaluate((el) => {
        const content = el.querySelector('.\\@container') ?? el.firstElementChild;
        return { frame: el.scrollWidth - el.clientWidth, content: content ? content.scrollWidth - content.clientWidth : 0 };
      });
      check('en móvil la plantilla no desborda el marco', frameOverflow.frame <= 1 && frameOverflow.content <= 1, JSON.stringify(frameOverflow));
      await desktopRadio.click();
      await page.waitForTimeout(150);
      check('«Escritorio» devuelve el marco y las 4 columnas', (await frame(page).getAttribute('data-viewport')) === 'escritorio' && (await columns(grid).catch(() => -1)) === 4);
      await closeModal(page);

    });
    await section(page, origin, 'Usar esta página: prompt y código (C5)', async () => {
      await card(page, first.id).click();
      await modal(page).waitFor();
      for (let i = 0; i < PAGE_CATALOG.length; i++) {
        const expectedId = PAGE_CATALOG[i].id;
        const meta = byId(expectedId);
        if (i > 0) await modal(page).getByRole('button', { name: 'Página siguiente' }).click();
        await waitTemplate(page).catch(() => {});
        check(`${meta.id}: la modal muestra «${meta.name}»`, (await modalTitle(page)) === meta.name);
        const useBtn = modal(page).getByRole('button', { name: 'Usar esta página' });
        if ((await useBtn.getAttribute('aria-expanded')) !== 'true') await useBtn.click();
        const tablist = modal(page).getByRole('tablist');
        await tablist.waitFor({ timeout: 4000 }).catch(() => {});
        const promptTab = tablist.getByRole('tab', { name: 'Prompt' });
        const codeTab = tablist.getByRole('tab', { name: 'Código' });
        if ((await promptTab.getAttribute('aria-selected')) !== 'true') await promptTab.click();
        const promptText = await modal(page).locator('[data-testid="pagina-prompt"]').innerText().catch(() => '');
        check(`${meta.id}: el prompt coincide con PAGE_CATALOG`, normalize(promptText) === normalize(meta.prompt), promptText.slice(0, 120));
        await codeTab.click();
        const codeEl = modal(page).locator('[data-testid="pagina-codigo"]');
        await page.waitForFunction(() => (document.querySelector('[data-testid="pagina-modal"] [data-testid="pagina-codigo"]')?.textContent ?? '').includes('export function Template'), null, { timeout: 6000 }).catch(() => {});
        const codeText = await codeEl.evaluate((el) => el.textContent ?? '').catch(() => '');
        check(`${meta.id}: el código es el archivo src/components/page-templates/${meta.file}.tsx`, normalize(codeText) === normalize(sourceOf(meta)), `${normalize(codeText).length} vs ${normalize(sourceOf(meta)).length} caracteres`);
      }
      // Pestañas, flechas y copiar, sobre la última página abierta.
      const lastMeta = PAGE_CATALOG[PAGE_CATALOG.length - 1];
      const useBtn = modal(page).getByRole('button', { name: 'Usar esta página' });
      check('«Usar esta página» indica que está desplegado (aria-expanded=true)', (await useBtn.getAttribute('aria-expanded')) === 'true');
      const tablist = modal(page).getByRole('tablist');
      const promptTab = tablist.getByRole('tab', { name: 'Prompt' });
      const codeTab = tablist.getByRole('tab', { name: 'Código' });
      check('el tablist tiene exactamente las pestañas «Prompt» y «Código»', (await tablist.getByRole('tab').allInnerTexts()).map(squash).join('|') === 'Prompt|Código');
      await codeTab.focus();
      await page.keyboard.press('ArrowLeft');
      check('← lleva a «Prompt» (seleccionada y con el foco)', (await promptTab.getAttribute('aria-selected')) === 'true' && (await page.evaluate(() => document.activeElement?.textContent?.trim())) === 'Prompt');
      await page.keyboard.press('ArrowRight');
      check('→ lleva a «Código» (seleccionada y con el foco)', (await codeTab.getAttribute('aria-selected')) === 'true' && (await page.evaluate(() => document.activeElement?.textContent?.trim())) === 'Código');
      await page.keyboard.press('ArrowRight');
      check('→ desde la última pestaña vuelve a la primera', (await promptTab.getAttribute('aria-selected')) === 'true');
      await page.keyboard.press('ArrowLeft');
      check('← desde la primera pestaña va a la última', (await codeTab.getAttribute('aria-selected')) === 'true');

      await promptTab.click();
      await page.evaluate(() => navigator.clipboard.writeText('portapapeles previo'));
      await modal(page).getByRole('button', { name: 'Copiar prompt' }).click();
      const copiedPrompt = await notice(page).filter({ hasText: 'Copiado' }).waitFor({ timeout: 2000 }).then(() => true, () => false);
      check('«Copiar prompt» anuncia «Copiado» en la región aria-live', copiedPrompt, await notice(page).innerText().catch(() => 'sin aviso'));
      check('el portapapeles tiene exactamente el prompt', (await page.evaluate(() => navigator.clipboard.readText())) === lastMeta.prompt);
      await codeTab.click();
      await modal(page).getByRole('button', { name: 'Copiar código' }).click();
      const copiedCode = await notice(page).filter({ hasText: 'Copiado' }).waitFor({ timeout: 2000 }).then(() => true, () => false);
      check('«Copiar código» anuncia «Copiado»', copiedCode);
      const clipCode = await page.evaluate(() => navigator.clipboard.readText());
      check('el portapapeles tiene exactamente el código del archivo', normalize(clipCode) === normalize(sourceOf(lastMeta)) && clipCode.includes('export function Template'), `${clipCode.length} caracteres`);
      await closeModal(page);

    });
    await section(page, origin, 'Plantillas inertes: enlaces y formularios', async () => {
      for (const meta of PAGE_CATALOG) {
        await card(page, meta.id).click();
        await modal(page).waitFor();
        await waitTemplate(page).catch(() => {});
        const urlBefore = page.url();
        // Escucha en document (fase bubble): ahí ya corrió el preventDefault de React.
        const inert = await frame(page).evaluate(async (el) => {
          const seen = [];
          const record = (e) => seen.push({ type: e.type, prevented: e.defaultPrevented });
          document.addEventListener('click', record);
          document.addEventListener('submit', record);
          const anchors = [...el.querySelectorAll('a')];
          const bad = anchors.filter((a) => a.getAttribute('href') !== '#').map((a) => a.getAttribute('href'));
          anchors.forEach((a) => a.click());
          const forms = [...el.querySelectorAll('form')];
          forms.forEach((f) => f.requestSubmit?.());
          await new Promise((r) => setTimeout(r, 50));
          document.removeEventListener('click', record);
          document.removeEventListener('submit', record);
          const notPrevented = seen.filter((s) => !s.prevented).map((s) => s.type);
          return { anchors: anchors.length, bad, forms: forms.length, submits: seen.filter((s) => s.type === 'submit').length, notPrevented };
        });
        check(`${meta.id}: los enlaces de la plantilla son href="#"`, inert.bad.length === 0, inert.bad.join(', '));
        check(`${meta.id}: enlaces y formularios cancelan su acción por defecto (${inert.anchors} enlaces, ${inert.forms} formularios)`, inert.notPrevented.length === 0 && inert.submits === inert.forms, inert.notPrevented.join(', '));
        check(`${meta.id}: no navega ni cierra la modal`, page.url() === urlBefore && (await modal(page).count()) === 1 && (await modalTitle(page)) === meta.name, page.url());
        await closeModal(page);
      }
    });
    await section(page, origin, '↑/↓ dentro de la vista previa desplazan, no cambian de página (C3)', async () => {
      await card(page, 'landing-saas').click();
      await modal(page).waitFor();
      await waitTemplate(page).catch(() => {});
      const region = modal(page).getByRole('region', { name: `Vista previa de ${byId('landing-saas').name}` });
      await region.focus();
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(250);
      const scrolled = await region.evaluate((el) => el.scrollTop);
      check('con el foco en la vista previa, ↓ la desplaza y la página sigue siendo la misma', (await modalTitle(page)) === byId('landing-saas').name && scrolled > 0, `${await modalTitle(page)} · scrollTop ${scrolled}`);
      await closeModal(page);
    });
    await section(page, origin, 'Clases que la usan: vacío (C6)', async () => {
      await card(page, 'dashboard').click();
      await modal(page).waitFor();
      check('sin clases, «Clases que la usan» dice «Todavía ninguna clase usa esta página.»', (await modal(page).locator('[data-testid="pagina-clases"]').innerText().catch(() => '')).includes('Todavía ninguna clase usa esta página.'));

      console.log('\nComponentes que usa → Componentes (C3)');
      const firstComp = modal(page).locator('[data-testid="pagina-componentes"]').locator('a, button').first();
      const compLabel = squash(await firstComp.innerText().catch(() => ''));
      await firstComp.click();
      const reachedComponents = await page.locator('#components-heading').waitFor({ timeout: 6000 }).then(() => true, () => false);
      const compName = reachedComponents ? squash(await page.locator('#component-name').innerText().catch(() => '')) : '';
      check('un enlace de «Componentes que usa» abre Componentes con ese componente', reachedComponents && !!compName && compLabel.includes(compName), `${compLabel} → ${compName}`);
      check('la modal se cerró al ir a Componentes', (await modal(page).count()) === 0);

    });
    console.log('\nPresupuesto de red (C11)');
    // Fuera quedan el shell de la app (GitHub simulado) y las fuentes de `index.html`, que se piden en cada
    // recarga de la portada y no dependen de las páginas. Todo lo demás cuenta como fuga de las plantillas.
    const SHELL = ['https://api.github.com/', 'https://avatars.githubusercontent.com/', 'https://fonts.googleapis.com/', 'https://fonts.gstatic.com/'];
    const external = main.state.external.filter((u) => !SHELL.some((prefix) => u.startsWith(prefix)));
    check('abrir la galería y las 6 plantillas no pide nada a dominios externos', external.length === 0, external.slice(0, 5).join(' | '));
    const githubDuring = main.state.external.filter((u) => u.startsWith('https://api.github.com/'));
    console.log(`       (peticiones a la API de GitHub simulada durante el recorrido: ${githubDuring.length})`);
    check('ninguna petición escapó a la red real (todo lo externo estaba simulado)', main.state.leaks.length === 0, main.state.leaks.slice(0, 5).join(' | '));

    await section(page, origin, 'Responsive (C1, C4)', async () => {
      for (const [name, width, height] of VIEWPORTS) {
        await page.setViewportSize({ width, height });
        await openPages(page, origin);
        await cardsLoc(page).first().waitFor();
        await page.waitForTimeout(200);
        await page.screenshot({ path: resolve(SHOTS_DIR, `paginas-${name}.png`), fullPage: true });
        const galleryOverflow = await docOverflow(page);
        check(`a ${name} px la galería no desborda en horizontal`, galleryOverflow <= 0, `${galleryOverflow}px`);
        await card(page, 'tienda-online').click();
        await modal(page).waitFor();
        await waitTemplate(page).catch(() => {});
        const box = await modal(page).evaluate((el) => {
          const r = el.getBoundingClientRect();
          return { left: r.left, right: r.right, vw: window.innerWidth };
        });
        check(`a ${name} px la modal cabe en la ventana`, box.left >= 0 && box.right <= box.vw + 0.5, JSON.stringify(box));
        const frameFit = await frame(page).evaluate((el) => ({ w: el.getBoundingClientRect().width, overflow: el.scrollWidth - el.clientWidth, right: el.getBoundingClientRect().right, vw: window.innerWidth }));
        check(`a ${name} px el marco no desborda`, frameFit.overflow <= 1 && frameFit.right <= frameFit.vw + 0.5, JSON.stringify(frameFit));
        if (width === 390) {
          await modal(page).getByRole('radiogroup', { name: 'Vista' }).getByRole('radio', { name: 'Móvil' }).click();
          await page.waitForTimeout(150);
          const narrow = await frame(page).evaluate((el) => ({ w: el.getBoundingClientRect().width, overflow: el.scrollWidth - el.clientWidth, right: el.getBoundingClientRect().right, vw: window.innerWidth }));
          check('a 390 px, en «Móvil» el marco ocupa el ancho disponible sin desbordar', narrow.w <= narrow.vw && narrow.overflow <= 1 && narrow.right <= narrow.vw + 0.5, JSON.stringify(narrow));
          check('a 390 px la página no desborda con la modal abierta', (await docOverflow(page)) <= 0);
        }
        await page.screenshot({ path: resolve(SHOTS_DIR, `modal-${name}.png`) });
        await closeModal(page);
      }

    });
    const csp = await page.evaluate(() => window.__cspViolations ?? []);
    check('sin violaciones de CSP', csp.length === 0, csp.slice(0, 3).join(' | '));
    check('sin errores de consola ni respuestas fallidas', main.state.errors.length === 0, main.state.errors.slice(0, 3).join(' | '));

    /* ---------- Segundo contexto: una clase sembrada y un portapapeles que falla ---------- */
    console.log('\nClases que la usan con una clase sembrada (C6) y portapapeles que falla (C5)');
    const seeded = await openContext(browser, origin, { lessons: [SEEDED], failingClipboard: true });
    contexts.push(seeded);
    const p2 = seeded.page;
    await section(p2, origin, 'Recorrido con la clase sembrada', async () => {
      await openPages(p2, origin);
      await card(p2, 'dashboard').click();
      await modal(p2).waitFor();
      const usedBy = modal(p2).locator('[data-testid="pagina-clases"]');
      check('«Clases que la usan» lista la clase sembrada con pageIds ["dashboard"]', (await usedBy.innerText().catch(() => '')).includes(SEEDED_TITLE));
      check('y ya no dice que ninguna la usa', !(await usedBy.innerText().catch(() => '')).includes('Todavía ninguna clase usa esta página.'));
      await modal(p2).getByRole('button', { name: 'Página siguiente' }).click();
      check('otra página que la clase no enlaza sigue diciendo que ninguna la usa', (await modal(p2).locator('[data-testid="pagina-clases"]').innerText().catch(() => '')).includes('Todavía ninguna clase usa esta página.'));
      await modal(p2).getByRole('button', { name: 'Página anterior' }).click();

      const useBtn2 = modal(p2).getByRole('button', { name: 'Usar esta página' });
      if ((await useBtn2.getAttribute('aria-expanded')) !== 'true') await useBtn2.click();
      await modal(p2).getByRole('tab', { name: 'Prompt' }).click();
      await modal(p2).getByRole('button', { name: 'Copiar prompt' }).click();
      const failMsg = await notice(p2).filter({ hasText: 'No se pudo copiar, selecciona el texto' }).waitFor({ timeout: 2000 }).then(() => true, () => false);
      check('si el portapapeles falla, avisa «No se pudo copiar, selecciona el texto»', failMsg, await notice(p2).innerText().catch(() => 'sin aviso'));
      check('y no anuncia «Copiado»', !(await notice(p2).innerText().catch(() => '')).includes('Copiado'));
      const selectable = await modal(p2).locator('[data-testid="pagina-prompt"]').evaluate((el) => getComputedStyle(el).userSelect !== 'none' && (el.textContent ?? '').length > 0).catch(() => false);
      check('el texto del prompt sigue visible y seleccionable', selectable);
      await modal(p2).getByRole('tab', { name: 'Código' }).click();
      await modal(p2).getByRole('button', { name: 'Copiar código' }).click();
      const failCode = await notice(p2).filter({ hasText: 'No se pudo copiar, selecciona el texto' }).waitFor({ timeout: 2000 }).then(() => true, () => false);
      check('copiar el código con el portapapeles roto también avisa del fallo', failCode);

      const lessonLink = usedBy.locator('a, button').filter({ hasText: SEEDED_TITLE });
      if ((await lessonLink.count()) > 0) {
        await lessonLink.first().click();
        const opened = await p2.locator('#lesson-title').waitFor({ timeout: 6000 }).then(() => true, () => false);
        check('la clase de «Clases que la usan» abre su detalle en Códice', opened && (await p2.locator('#lesson-title').innerText()).trim() === SEEDED_TITLE);
      } else {
        check('la clase de «Clases que la usan» es un enlace a su detalle', false, 'sin enlace');
      }
    });
    const csp2 = await p2.evaluate(() => window.__cspViolations ?? []);
    check('segundo contexto: sin violaciones de CSP ni fugas de red', csp2.length === 0 && seeded.state.leaks.length === 0, [...csp2, ...seeded.state.leaks].slice(0, 3).join(' | '));
    const unexpected = seeded.state.errors.filter((e) => !/clipboard|Denegado|NotAllowedError/i.test(e));
    check('segundo contexto: sin errores de consola inesperados', unexpected.length === 0, unexpected.slice(0, 3).join(' | '));
  } finally {
    for (const c of contexts) await c.context.close().catch(() => {});
    await browser.close();
    await server.close();
    rmSync(OUT_DIR, { recursive: true, force: true });
    rmSync(helperDir, { recursive: true, force: true });
  }

  if (failures.length > 0) {
    console.error(`\n${failures.length} comprobación(es) fallaron:\n - ${failures.join('\n - ')}`);
    process.exit(1);
  }
  console.log('\nPágina «Páginas»: todo en verde.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  rmSync(helperDir, { recursive: true, force: true });
  process.exit(1);
});
