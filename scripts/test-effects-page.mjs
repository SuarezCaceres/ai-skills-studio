/**
 * Prueba de la pestaña «Efectos» de la página Componentes (spec 006, criterios C1–C6):
 * pestañas por clic y teclado, grupos Estilos/Animaciones, detalle de los 18 efectos (apodo, prompt,
 * código real, notas y miniatura), copiar el prompt, «Repetir» y movimiento reducido, apertura desde una
 * clase, asignación de skills y presupuesto del chunk inicial.
 *
 * Compila su propio dist en una carpeta temporal con catálogo y OAuth de prueba
 * (`scripts/lib/github-fixture.mjs`): no depende del `dist/` de `npm run build` ni de `.env.local`.
 * Fase A (C1–C4): `vite preview` sobre ese dist, con GitHub simulado.
 * Fase B (C5): el mismo dist, iniciando sesión y asignando sin tocar GitHub real.
 * C6: imports de los efectos, análisis del dist de prueba y ninguna petición fuera de `127.0.0.1`
 *   (salvo Google Fonts, que se contesta vacío). Cualquier otra petición se aborta y cuenta como fallo.
 *
 * Los ids, nombres y prompts salen del propio registro (`COMPONENT_REGISTRY`, entradas `kind: 'efecto'`),
 * así un efecto nuevo se prueba sin tocar este script.
 *
 * Uso: node scripts/test-effects-page.mjs
 */
import { build, createServer, preview } from 'vite';
import { chromium } from 'playwright';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { clickAuthSignIn, enterApp } from './lib/enter-app.mjs';
import {
  SKILL_NAME,
  TEAM_LOGIN,
  TEST_CATALOG_REPO,
  TEST_CLIENT_ID,
  TEST_OAUTH_URL,
  installFakeGithub,
} from './lib/github-fixture.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 5192;
const ORIGIN = `http://127.0.0.1:${PORT}`;
const OUT_DIR = join(tmpdir(), 'ai-skills-studio-effects-e2e');
/** El dist que se sirve y se analiza: el propio de la suite, no el de `npm run build`. */
const DIST = OUT_DIR;
const SHOTS_DIR = resolve(ROOT, 'shots', 'effects');
const THUMBS_DIR = resolve(ROOT, 'public', 'components');
const MAX_THUMB_BYTES = 40 * 1024;
const MAX_ENTRY_BYTES = 350_000;
const LESSONS_KEY = 'ai_skills_studio_lessons_v1';
const ASSIGNMENTS_KEY = 'ai_skills_studio_component_assignments_v1';
/** Animaciones que ocurren una sola vez y llevan «Repetir animación». */
const ONCE = ['fade-up', 'stagger', 'typewriter', 'count-up', 'text-reveal'];
const WIDTHS = [['1440', 1440, 900], ['1024', 1024, 768], ['768', 768, 1024], ['390', 390, 844]];

const failures = [];
let passed = 0;
function check(name, ok, detail = '') {
  console.log(`  ${ok ? 'ok ' : 'FALLA'}  ${name}${ok || !detail ? '' : ` — ${detail}`}`);
  if (ok) passed++;
  else failures.push(name);
}

/** Ejecuta un bloque de casos; si algo lanza (un selector que no aparece…), lo apunta y sigue con el siguiente. */
async function block(title, fn) {
  console.log(`\n${title}`);
  try {
    await fn();
  } catch (err) {
    check(`${title}: el bloque termina sin errores inesperados`, false, String(err?.message ?? err).split('\n')[0]);
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
const pending = (s) => /PENDIENTE/i.test(String(s ?? ''));

/* ---------------- Datos del registro ---------------- */

/** Carga el registro con Vite (resuelve `import.meta.glob`) y devuelve solo los efectos, sin código. */
async function loadEffects() {
  const server = await createServer({
    root: ROOT,
    logLevel: 'error',
    appType: 'custom',
    server: { middlewareMode: true, hmr: false, ws: false },
    // Sin escaneo de dependencias: solo hace falta evaluar el registro, y el escaneo protesta al cerrar.
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  try {
    const { COMPONENT_REGISTRY } = await server.ssrLoadModule('/src/data/componentRegistry.ts');
    return COMPONENT_REGISTRY.filter((e) => e.kind === 'efecto').map(({ id, name, category, description, nickname, prompt, a11y }) => ({
      id,
      name,
      category,
      description,
      nickname,
      prompt,
      a11y: [...(a11y ?? [])],
    }));
  } finally {
    await server.close();
  }
}

/* ---------------- Red, errores y CSP ---------------- */

/**
 * Ruta comodín registrada ANTES que las simulaciones de GitHub (Playwright prueba las rutas en orden inverso
 * al registro): deja pasar `127.0.0.1`, contesta vacío a Google Fonts y aborta todo lo demás anotándolo.
 */
async function guardNetwork(context, stray) {
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === '127.0.0.1') return route.continue();
    if (url.hostname === 'fonts.googleapis.com') return route.fulfill({ status: 200, contentType: 'text/css', body: '' });
    if (url.hostname === 'fonts.gstatic.com') return route.fulfill({ status: 200, contentType: 'font/woff2', body: '' });
    stray.push(route.request().url());
    return route.abort('blockedbyclient');
  });
}

/** GitHub simulado mínimo (sin sesión), como en `test-components-page.mjs`. */
async function fakeGithub(route) {
  const { pathname } = new URL(route.request().url());
  if (pathname.startsWith('/users/')) {
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ login: pathname.split('/')[2], name: null }) });
  }
  return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
}

async function watchCsp(context, sink) {
  await context.exposeBinding('__reportCspViolation', (_source, message) => sink.push(`CSP ${message}`));
  await context.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (e) => {
      window.__reportCspViolation?.(`${e.violatedDirective} ${e.blockedURI}`);
    });
  });
}

function watchErrors(page, sink) {
  page.on('console', (m) => m.type() === 'error' && sink.push(m.text()));
  page.on('pageerror', (e) => sink.push(String(e)));
}

/* ---------------- Navegación ---------------- */

/** Desde la portada, pasa a la página Componentes con clics dentro de la app (no recarga: conserva la sesión). */
async function clickToComponents(page) {
  await clickToModule(page, { text: 'Componentes', prefix: false }, '#components-heading');
}

/**
 * Pasa de la portada (si se está en ella) al módulo cuyo enlace contiene `text` (o empieza por él si
 * `prefix`). Espera a que existan el botón de la portada o la barra de módulos antes de pulsar.
 */
async function clickToModule(page, link, heading) {
  await page.waitForFunction(
    () => document.querySelector('.nav__actions a.btn--primary') || document.querySelector('nav[aria-label="Módulos del estudio"] a'),
    null,
    { timeout: 15000 }
  );
  await enterApp(page);
  await page.waitForFunction(
    ({ text, prefix }) =>
      [...document.querySelectorAll('nav[aria-label="Módulos del estudio"] a')].some((a) =>
        prefix ? a.textContent.trim().startsWith(text) : a.textContent.includes(text)
      ),
    link,
    { timeout: 15000 }
  );
  await page.evaluate(({ text, prefix }) => {
    [...document.querySelectorAll('nav[aria-label="Módulos del estudio"] a')]
      .find((a) => (prefix ? a.textContent.trim().startsWith(text) : a.textContent.includes(text)))
      ?.click();
  }, link);
  await page.locator(heading).waitFor({ timeout: 15000 });
}

async function openComponents(page) {
  await page.goto(`${ORIGIN}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(300);
  await clickToComponents(page);
}

async function clickToCodice(page) {
  await clickToModule(page, { text: 'Códice', prefix: true }, '#lessons-heading');
}

const tablist = (page) => page.getByRole('tablist', { name: 'Tipo de pieza' });
const tab = (page, label) => tablist(page).getByRole('tab', { name: new RegExp(`^${label}`) });
const stage = (page) => page.locator('[data-preview-stage]');
const detail = (page) => page.locator('article[aria-labelledby="component-name"]');
const assignmentSection = (page) => page.locator('section[aria-labelledby="sec-assignment"]');

async function selectedTabName(page) {
  return norm(await tablist(page).locator('[role="tab"][aria-selected="true"]').first().textContent({ timeout: 3000 }).catch(() => ''));
}

/** Activa una pestaña con un clic (si no lo está ya) y espera a que quede seleccionada. */
async function showTab(page, label) {
  const t = tab(page, label);
  if ((await t.getAttribute('aria-selected')) !== 'true') await t.click();
  await tablist(page).locator('[role="tab"][aria-selected="true"]', { hasText: new RegExp(`^\\s*${label}`) }).waitFor();
}

/** Despliega la lista en móvil si está plegada. */
async function openMobileList(page) {
  const toggle = page.locator('button[aria-controls="component-list-panel"]');
  if ((await toggle.isVisible()) && (await toggle.getAttribute('aria-expanded')) !== 'true') await toggle.click();
}

/** Elige un efecto por su nombre desde la pestaña «Efectos». */
async function pickEffect(page, name) {
  await showTab(page, 'Efectos');
  await openMobileList(page);
  await page.locator('nav[aria-label="Efectos"] ul button', { hasText: new RegExp(`^\\s*${escapeRe(name)}`) }).first().click();
  await page.locator('#component-name', { hasText: new RegExp(`^\\s*${escapeRe(name)}\\s*$`) }).waitFor();
}

/** Espera a que la demo diferida esté montada: sin «Cargando…» y con su raíz `[data-effect]` dibujada. */
async function waitDemo(page, effect, timeout = 10000) {
  return page
    .waitForFunction(
      (id) => {
        const s = document.querySelector('[data-preview-stage]');
        if (!s || /Cargando (componente|efecto)/.test(s.textContent)) return false;
        const root = s.querySelector(`[data-effect="${id}"]`);
        if (!root) return false;
        const r = root.getBoundingClientRect();
        return r.width * r.height > 0;
      },
      effect.id,
      { timeout }
    )
    .then(() => true, () => false);
}

/** Lee los grupos (`h2`) y los nombres de las filas de una lista lateral. */
function readGroups(page, navLabel) {
  return page.evaluate((label) => {
    const nav = document.querySelector(`nav[aria-label="${label}"]`);
    if (!nav) return null;
    return [...nav.querySelectorAll('h2')].map((h) => {
      const section = h.closest('section') ?? h.parentElement;
      const rows = [...section.querySelectorAll('ul button')].map((b) =>
        (b.querySelector(':scope > span:last-child > span:first-child')?.textContent ?? b.textContent).trim()
      );
      return { title: h.textContent.trim(), rows };
    });
  }, navLabel);
}

/** Las cifras de la cabecera: cada tarjeta es un par de `<p>` (etiqueta y número). */
function readStats(page) {
  return page.evaluate(() => {
    const heading = document.getElementById('components-heading');
    const root = heading?.closest('header') ?? heading?.parentElement?.parentElement;
    if (!root) return [];
    return [...root.querySelectorAll('div')]
      .filter((d) => d.children.length === 2 && [...d.children].every((c) => c.tagName === 'P') && /^\d+$/.test(d.children[1].textContent.trim()))
      .map((d) => ({ label: d.children[0].textContent.trim(), value: Number(d.children[1].textContent.trim()) }));
  });
}

const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

/** Animaciones y transiciones en marcha dentro del cuadro en vivo (nombre de cada una). */
function runningAnimations(page) {
  return page.evaluate(() => {
    const s = document.querySelector('[data-preview-stage]');
    if (!s) return ['(sin cuadro)'];
    return s
      .getAnimations({ subtree: true })
      .filter((a) => a.playState === 'running')
      .map((a) => a.animationName ?? a.transitionProperty ?? a.constructor.name);
  });
}

const typedText = (page) => page.evaluate(() => document.querySelector('[data-preview-stage] [data-typed]')?.textContent ?? null);
const countText = (page) =>
  page.evaluate(() => {
    const nodes = [...document.querySelectorAll('[data-preview-stage] [data-count]')];
    return nodes.length ? nodes.map((n) => n.textContent.trim()).join('|') : null;
  });
const countSum = (text) => (text ?? '').split('|').reduce((sum, part) => sum + (Number(part.replace(/[^\d]/g, '')) || 0), 0);

/** Espera a que una lectura deje de cambiar durante `quietMs` (fin de una animación). Devuelve el valor o `null`. */
async function waitStable(read, { quietMs = 800, maxMs = 15000 } = {}) {
  const start = Date.now();
  let last = await read();
  let since = Date.now();
  while (Date.now() - start < maxMs) {
    await sleep(100);
    const value = await read();
    if (value !== last) {
      last = value;
      since = Date.now();
    } else if (Date.now() - since >= quietMs && value !== null && value !== '') {
      return value;
    }
  }
  return null;
}

/** Espera hasta `timeout` ms a que `predicate(valor)` se cumpla, leyendo cada 50 ms. */
async function pollUntil(read, predicate, timeout = 1500) {
  const start = Date.now();
  let value = await read();
  while (!predicate(value) && Date.now() - start < timeout) {
    await sleep(50);
    value = await read();
  }
  return { ok: predicate(value), value };
}

/* ---------------- Fase A: C1–C4 ---------------- */

async function phaseA(browser, effects, errors, stray) {
  const styles = effects.filter((e) => e.category === 'Estilos');
  const animations = effects.filter((e) => e.category === 'Animaciones');
  const finals = { typed: null, count: null };

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
  context.setDefaultTimeout(8000);
  await guardNetwork(context, stray);
  await context.route('https://api.github.com/**', fakeGithub);
  await watchCsp(context, errors);
  const page = await context.newPage();
  watchErrors(page, errors);

  /* ---------- C1 ---------- */
  await block('C1 · Pestañas «Componentes | Efectos», grupos, cifras y responsive', async () => {
    const errorsBefore = errors.length;
    await openComponents(page);

    const tabNames = (await tablist(page).getByRole('tab').allInnerTexts()).map(norm);
    check('hay un tablist «Tipo de pieza» con dos pestañas: Componentes y Efectos', tabNames.length === 2 && /^Componentes/.test(tabNames[0]) && /^Efectos/.test(tabNames[1]), tabNames.join(' | '));
    check('las pestañas llevan su recuento (Componentes 20, Efectos 18)', /^Componentes\D*20\b/.test(tabNames[0] ?? '') && new RegExp(`^Efectos\\D*${effects.length}\\b`).test(tabNames[1] ?? ''), tabNames.join(' | '));
    check('por defecto está seleccionada «Componentes»', /^Componentes/.test(await selectedTabName(page)));
    const panelLinked = await page.evaluate(() => {
      const selected = document.querySelector('[role="tablist"][aria-label="Tipo de pieza"] [role="tab"][aria-selected="true"]');
      const panels = [...document.querySelectorAll('[role="tabpanel"]')];
      if (!selected || panels.length === 0) return false;
      const controls = selected.getAttribute('aria-controls');
      return panels.some((p) => (controls && p.id === controls) || (selected.id && (p.getAttribute('aria-labelledby') ?? '').split(/\s+/).includes(selected.id)));
    });
    check('hay un role=tabpanel enlazado con la pestaña activa (aria-controls o aria-labelledby)', panelLinked);

    const kitGroups = (await readGroups(page, 'Componentes')) ?? [];
    const kitRows = kitGroups.flatMap((g) => g.rows);
    check('en «Componentes» la lista trae los 20 de siempre', kitRows.length === 20, `hay ${kitRows.length}`);
    check('en «Componentes» no hay grupos Estilos ni Animaciones', !kitGroups.some((g) => /^(Estilos|Animaciones)$/i.test(g.title)), kitGroups.map((g) => g.title).join(', '));
    check('en «Componentes» no aparece ningún efecto', !kitRows.some((n) => effects.some((e) => e.name === n)));
    const kitStats = await readStats(page);
    check('las cifras de cabecera cuentan componentes (Componentes 20)', /^Componentes$/i.test(kitStats[0]?.label ?? '') && kitStats[0]?.value === 20, JSON.stringify(kitStats));

    // Clic en «Efectos».
    await tab(page, 'Efectos').click();
    await page.locator('nav[aria-label="Efectos"]').waitFor({ state: 'attached' });
    check('el clic en «Efectos» la selecciona', /^Efectos/.test(await selectedTabName(page)));
    check('la lista lateral pasa a ser «Lista de efectos»', (await page.locator('aside[aria-label="Lista de efectos"]').count()) === 1);
    check('en «Efectos» ya no está la lista de componentes', (await page.locator('nav[aria-label="Componentes"]').count()) === 0);
    const fxGroups = (await readGroups(page, 'Efectos')) ?? [];
    check('los grupos son Estilos y Animaciones, en ese orden', fxGroups.map((g) => g.title).join('|') === 'Estilos|Animaciones', fxGroups.map((g) => g.title).join('|'));
    check(`Estilos tiene ${styles.length} filas y Animaciones ${animations.length}`, styles.length === 8 && animations.length === 10 && fxGroups[0]?.rows.length === 8 && fxGroups[1]?.rows.length === 10, fxGroups.map((g) => `${g.title}=${g.rows.length}`).join(', '));
    check('las filas siguen el orden del registro', fxGroups[0]?.rows.join('|') === styles.map((e) => e.name).join('|') && fxGroups[1]?.rows.join('|') === animations.map((e) => e.name).join('|'), fxGroups.map((g) => g.rows.join(', ')).join(' / '));
    check('en «Efectos» no aparece ningún componente del kit', !fxGroups.flatMap((g) => g.rows).some((n) => kitRows.includes(n)));
    const fxStats = await readStats(page);
    check(`las cifras de cabecera cuentan efectos (Efectos ${effects.length}; asignados + no asignados = ${effects.length})`, /^Efectos$/i.test(fxStats[0]?.label ?? '') && fxStats[0]?.value === effects.length && (fxStats[1]?.value ?? -1) + (fxStats[2]?.value ?? -1) === effects.length, JSON.stringify(fxStats));
    check('al pasar a «Efectos» se elige el primero del grupo', norm(await page.locator('#component-name').textContent()) === styles[0]?.name, norm(await page.locator('#component-name').textContent()));

    // Vuelta a «Componentes» por clic.
    await tab(page, 'Componentes').click();
    await page.locator('nav[aria-label="Componentes"]').waitFor({ state: 'attached' });
    const backRows = ((await readGroups(page, 'Componentes')) ?? []).flatMap((g) => g.rows);
    check('al volver a «Componentes» se ve el kit de siempre (20, sin efectos)', backRows.length === 20 && !backRows.some((n) => effects.some((e) => e.name === n)), `hay ${backRows.length}`);
    check('al volver, el detalle es de un componente', kitRows.includes(norm(await page.locator('#component-name').textContent())));

    // Teclado: flechas, Inicio y Fin (activación automática).
    await tab(page, 'Componentes').focus();
    const focusedTab = () => page.evaluate(() => (document.activeElement?.getAttribute('role') === 'tab' ? document.activeElement.textContent.trim() : ''));
    await page.keyboard.press('ArrowRight');
    check('flecha derecha pasa a «Efectos» (seleccionada y con foco)', /^Efectos/.test(await selectedTabName(page)) && /^Efectos/.test(await focusedTab()));
    await page.keyboard.press('ArrowLeft');
    check('flecha izquierda vuelve a «Componentes»', /^Componentes/.test(await selectedTabName(page)) && /^Componentes/.test(await focusedTab()));
    await page.keyboard.press('End');
    check('Fin lleva a la última pestaña («Efectos»)', /^Efectos/.test(await selectedTabName(page)) && /^Efectos/.test(await focusedTab()));
    await page.keyboard.press('Home');
    check('Inicio lleva a la primera pestaña («Componentes»)', /^Componentes/.test(await selectedTabName(page)) && /^Componentes/.test(await focusedTab()));

    // Caso límite: los filtros se limpian al cambiar de pestaña.
    await page.locator('aside input[type="search"]').fill('accordion');
    await tab(page, 'Efectos').click();
    await page.locator('nav[aria-label="Efectos"]').waitFor({ state: 'attached' });
    const afterFilter = ((await readGroups(page, 'Efectos')) ?? []).flatMap((g) => g.rows).length;
    check('al cambiar de pestaña con un filtro puesto, el filtro se limpia', afterFilter === effects.length && (await page.locator('aside input[type="search"]').inputValue()) === '', `filas=${afterFilter}`);

    // Responsive: sin desborde en ambas pestañas.
    for (const [label, width, height] of WIDTHS) {
      await page.setViewportSize({ width, height });
      await openComponents(page);
      const kitOverflow = await overflow(page);
      await page.screenshot({ path: resolve(SHOTS_DIR, `componentes-${label}.png`), fullPage: true });
      await showTab(page, 'Efectos');
      if (width < 1024) {
        const toggle = page.locator('button[aria-controls="component-list-panel"]');
        const folded = (await toggle.isVisible()) && (await toggle.getAttribute('aria-expanded')) === 'false';
        await toggle.click();
        const unfolded = await page.locator('nav[aria-label="Efectos"]').isVisible();
        check(`a ${label} px la lista de efectos está plegada tras un botón y se despliega`, folded && unfolded);
      }
      await pickEffect(page, animations[0]?.name ?? styles[0].name);
      await waitDemo(page, animations[0] ?? styles[0]);
      const fxOverflow = await overflow(page);
      await page.screenshot({ path: resolve(SHOTS_DIR, `efectos-${label}.png`), fullPage: true });
      check(`sin desborde horizontal a ${label} px (Componentes y Efectos)`, kitOverflow <= 0 && fxOverflow <= 0, `${kitOverflow}/${fxOverflow}px`);
    }
    await page.setViewportSize({ width: 1440, height: 900 });

    const c1Errors = errors.slice(errorsBefore);
    check('C1 sin errores de consola, pageerror ni violaciones CSP', c1Errors.length === 0, c1Errors.slice(0, 3).join(' | '));
  });

  /* ---------- C2 ---------- */
  await block(`C2 · Detalle de los ${effects.length} efectos`, async () => {
    await openComponents(page);
    check(`el registro tiene ${effects.length} efectos (8 estilos + 10 animaciones)`, effects.length === 18 && styles.length === 8 && animations.length === 10, `${styles.length}+${animations.length}`);
    for (const effect of effects) {
      const problems = [];
      try {
        await pickEffect(page, effect.name);
        if (!(await waitDemo(page, effect))) problems.push(effect.category === 'Animaciones' ? `sin [data-effect="${effect.id}"]` : 'la demo no se montó');
        await page.locator('section[aria-labelledby="sec-code"] pre code').waitFor();

        const nickname = norm(await page.locator('[data-testid="effect-nickname"]').textContent({ timeout: 2000 }).catch(() => ''));
        if (!/^Le dicen:\s*\S/.test(nickname)) problems.push(`apodo «${nickname}»`);
        if (!effect.nickname || pending(effect.nickname) || !nickname.includes(norm(effect.nickname))) problems.push('apodo pendiente o distinto del registro');

        if (norm(await page.locator('#component-name').textContent()) !== effect.name) problems.push('nombre');
        const article = norm(await detail(page).innerText());
        if (!norm(effect.description) || pending(effect.description) || !article.includes(norm(effect.description))) problems.push('descripción');

        const stageInfo = await stage(page).evaluate((el, id) => {
          const root = el.querySelector(`[data-effect="${id}"]`);
          const r = root?.getBoundingClientRect();
          return { text: el.innerText, drawn: Boolean(r && r.width * r.height > 0 && root.children.length > 0) };
        }, effect.id);
        if (!stageInfo.drawn) problems.push('cuadro en vivo vacío');
        if (/No se pudo dibujar/.test(stageInfo.text)) problems.push('la demo falló («No se pudo dibujar»)');

        const promptBlock = norm(await page.locator('[data-testid="effect-prompt"]').innerText({ timeout: 2000 }).catch(() => ''));
        if (!norm(effect.prompt) || pending(effect.prompt) || pending(promptBlock)) problems.push('prompt pendiente');
        else if (!promptBlock.includes(norm(effect.prompt))) problems.push('el bloque no muestra el prompt del registro');
        if ((await page.getByRole('button', { name: 'Copiar prompt' }).count()) !== 1) problems.push('sin botón «Copiar prompt»');

        const code = await page.locator('section[aria-labelledby="sec-code"] pre code').innerText();
        if (!code.includes('export function Demo')) problems.push('código sin «export function Demo»');

        const notes = (await page.locator('section[aria-labelledby="sec-a11y"] li').allInnerTexts()).map(norm).filter(Boolean);
        if (notes.length === 0 || notes.some(pending) || effect.a11y.length === 0 || effect.a11y.some(pending)) problems.push('notas de accesibilidad vacías o pendientes');
      } catch (err) {
        problems.push(String(err?.message ?? err).split('\n')[0]);
      }
      check(`${effect.name}: apodo, nombre, descripción, cuadro, prompt, código y notas`, problems.length === 0, problems.join('; '));
    }

    for (const effect of effects) {
      const file = resolve(THUMBS_DIR, `${effect.id}.png`);
      const bytes = existsSync(file) ? statSync(file).size : -1;
      check(`miniatura public/components/${effect.id}.png existe y pesa ≤ 40 KB`, bytes > 0 && bytes <= MAX_THUMB_BYTES, bytes < 0 ? 'no existe' : `${bytes} bytes`);
    }
  });

  /* ---------- C3 ---------- */
  await block('C3 · Copiar el prompt', async () => {
    await openComponents(page);
    const samples = [styles[0], animations.find((e) => e.id === 'typewriter') ?? animations[0]].filter(Boolean);
    for (const effect of samples) {
      await pickEffect(page, effect.name);
      await page.evaluate(() => navigator.clipboard.writeText('(vacío)'));
      const promptBox = page.locator('[data-testid="effect-prompt"]');
      const shown = norm(await promptBox.innerText());
      await page.getByRole('button', { name: 'Copiar prompt' }).click();
      const announced = await page
        .getByRole('status')
        .filter({ hasText: 'Copiado al portapapeles' })
        .waitFor({ state: 'attached', timeout: 2000 })
        .then(() => true, () => false);
      const clip = await page.evaluate(() => navigator.clipboard.readText());
      check(`${effect.name}: el portapapeles recibe exactamente el prompt del registro`, clip === effect.prompt && clip.trim().length > 0, `${clip.length} caracteres`);
      check(`${effect.name}: el texto copiado es el que muestra el bloque`, clip.trim().length > 0 && shown.includes(norm(clip)));
      check(`${effect.name}: la copia se anuncia en un role="status" («Copiado al portapapeles»)`, announced);
    }
  });

  /* ---------- C4 ---------- */
  await block('C4 · «Repetir» en las animaciones de una sola vez', async () => {
    await openComponents(page);
    const once = ONCE.map((id) => animations.find((e) => e.id === id));
    check('las 5 animaciones de una sola vez están en el registro', once.every(Boolean), ONCE.filter((id, i) => !once[i]).join(', '));
    for (const effect of once.filter(Boolean)) {
      await pickEffect(page, effect.name);
      await waitDemo(page, effect);
      const runAttr = () => page.evaluate(() => document.querySelector('[data-preview-stage] [data-replay-run]')?.getAttribute('data-replay-run') ?? null);
      const replay = detail(page).getByRole('button', { name: /Repetir animación/ });
      const hasReplay = (await replay.count()) === 1;

      // Estado final antes de repetir (para el typewriter y el contador).
      let before = null;
      if (effect.id === 'typewriter') before = finals.typed = await waitStable(() => typedText(page));
      if (effect.id === 'count-up') before = finals.count = await waitStable(() => countText(page));

      const run0 = await runAttr();
      // Se marca el nodo actual: si «Repetir» remonta la demo, el nodo marcado desaparece del documento.
      await page.evaluate(() => document.querySelector('[data-preview-stage] [data-replay-run]')?.setAttribute('data-old-run', ''));
      if (hasReplay) await replay.click();
      const restarted =
        effect.id === 'typewriter'
          ? await pollUntil(() => typedText(page), (t) => before !== null && t !== null && t.length < before.length)
          : effect.id === 'count-up'
            ? await pollUntil(() => countText(page), (t) => before !== null && t !== null && countSum(t) < countSum(before))
            : null;
      const { ok: incremented, value: run1 } = await pollUntil(runAttr, (v) => run0 !== null && v !== null && Number(v) > Number(run0));

      check(`${effect.name}: tiene el botón «Repetir animación»`, hasReplay);
      check(`${effect.name}: «Repetir» incrementa data-replay-run`, incremented, `${run0} → ${run1}`);
      const remounted = await page.evaluate(() => {
        const s = document.querySelector('[data-preview-stage]');
        return s.querySelector('[data-old-run]') === null && s.querySelector('[data-replay-run]') !== null;
      });
      check(`${effect.name}: «Repetir» remonta la demo (el nodo anterior se sustituye)`, remounted);
      if (effect.id === 'typewriter') {
        check('Typewriter: tras «Repetir» vuelve a escribir desde el principio (texto más corto)', Boolean(restarted?.ok), `antes «${before}», después «${restarted?.value}»`);
      }
      if (effect.id === 'count-up') {
        check('Contador numérico: tras «Repetir» vuelve a contar (cifra menor que la final)', Boolean(restarted?.ok), `antes ${before}, después ${restarted?.value}`);
      }
    }

    // Control: sin movimiento reducido, las animaciones continuas sí se ven en marcha (la medición de abajo sirve).
    for (const id of ['marquee', 'gradient-border']) {
      const effect = animations.find((e) => e.id === id);
      if (!effect) continue;
      await pickEffect(page, effect.name);
      await waitDemo(page, effect);
      const moving = await pollUntil(() => runningAnimations(page), (list) => list.length > 0, 1500);
      check(`control: sin movimiento reducido, ${effect.name} tiene animaciones en marcha`, moving.ok, 'getAnimations() no ve ninguna');
    }

    // Pausa persistente del Marquee (WCAG 2.2.2): el botón detiene la cinta y la reanuda.
    const marquee = animations.find((e) => e.id === 'marquee');
    if (marquee) {
      await pickEffect(page, marquee.name);
      await waitDemo(page, marquee);
      const toggle = stage(page).getByRole('button', { name: /Pausar cinta/ });
      check('Marquee: tiene el botón «Pausar cinta»', (await toggle.count()) === 1);
      if ((await toggle.count()) === 1) {
        await toggle.click();
        await page.mouse.move(0, 0);
        const stopped = await pollUntil(() => runningAnimations(page), (list) => list.length === 0, 1500);
        const pressed = await stage(page).getByRole('button', { name: /Reanudar cinta/ }).getAttribute('aria-pressed');
        check('Marquee: «Pausar cinta» detiene la cinta (aria-pressed="true")', stopped.ok && pressed === 'true', `${stopped.value?.length ?? '?'} en marcha, aria-pressed=${pressed}`);
        await stage(page).getByRole('button', { name: /Reanudar cinta/ }).click();
        await page.mouse.move(0, 0);
        await page.evaluate(() => document.activeElement?.blur());
        const resumed = await pollUntil(() => runningAnimations(page), (list) => list.length > 0, 1500);
        check('Marquee: «Reanudar cinta» la pone en marcha otra vez', resumed.ok);
      }
    }
  });

  await context.close();

  // Movimiento reducido: contexto aparte.
  await block('C4 · Con prefers-reduced-motion: reduce, nada se mueve y se ve el estado final', async () => {
    const reduced = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    reduced.setDefaultTimeout(8000);
    await guardNetwork(reduced, stray);
    await reduced.route('https://api.github.com/**', fakeGithub);
    await watchCsp(reduced, errors);
    const rpage = await reduced.newPage();
    watchErrors(rpage, errors);
    try {
      await openComponents(rpage);
      for (const effect of [...animations, ...styles]) {
        try {
          await pickEffect(rpage, effect.name);
          const mounted = await waitDemo(rpage, effect);
          // Recién montada y un momento después: ninguna animación ni transición en marcha.
          const atMount = await runningAnimations(rpage);
          await rpage.waitForTimeout(300);
          const later = await runningAnimations(rpage);
          const moving = [...new Set([...atMount, ...later])];
          check(`${effect.name}: 0 animaciones en marcha en el cuadro`, mounted && moving.length === 0, mounted ? moving.join(', ') : 'la demo no se montó');

          if (effect.id === 'typewriter') {
            const full = finals.typed;
            const shown = await pollUntil(() => typedText(rpage), (t) => (full ? t === full : Boolean(t)), 400);
            const steady = full ? shown.ok : shown.ok && (await rpage.waitForTimeout(600), (await typedText(rpage)) === shown.value);
            check('Typewriter: muestra el texto completo sin escribirlo', steady, `«${shown.value}» (completo: «${full}»)`);
          }
          if (effect.id === 'count-up') {
            const final = finals.count;
            const shown = await pollUntil(() => countText(rpage), (t) => (final ? t === final : Boolean(t)), 400);
            const steady = final ? shown.ok : shown.ok && (await rpage.waitForTimeout(600), (await countText(rpage)) === shown.value);
            check('Contador numérico: muestra su cifra final sin contar', steady, `${shown.value} (final: ${final})`);
          }
        } catch (err) {
          check(`${effect.name}: se comprueba con movimiento reducido`, false, String(err?.message ?? err).split('\n')[0]);
        }
      }
      await rpage.screenshot({ path: resolve(SHOTS_DIR, 'reducido-1440.png'), fullPage: true });
    } finally {
      await reduced.close();
    }
  });
}

/* ---------------- Fase B: C5 con sesión simulada ---------------- */

async function phaseB(browser, effects, errors, stray) {
  const target = effects.find((e) => e.id === 'typewriter') ?? effects[effects.length - 1];
  const TITLE = 'Efectos que pedimos a la IA';

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  context.setDefaultTimeout(8000);
  await guardNetwork(context, stray);
  await installFakeGithub(context);
  await watchCsp(context, errors);
  const page = await context.newPage();
  watchErrors(page, errors);

  await block('C5 · Efecto abierto desde una clase', async () => {
    const now = new Date().toISOString();
    const lesson = {
      id: 'efectos-que-pedimos',
      title: TITLE,
      summary: 'Cómo pedimos a la IA el efecto que queremos.',
      level: 'Intermedio',
      tags: ['efectos'],
      bodyMarkdown: 'Usamos el prompt del efecto tal cual y ajustamos los tiempos.',
      skillIds: [],
      componentIds: [target.id],
      videos: [],
      author: { login: TEAM_LOGIN },
      createdAt: now,
      updatedAt: now,
    };
    await page.goto(`${ORIGIN}/`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: LESSONS_KEY, value: JSON.stringify([lesson]) });
    await page.goto(`${ORIGIN}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);
    await clickToCodice(page);

    await page.locator('section[aria-labelledby="lessons-heading"] article').getByRole('button', { name: TITLE }).click();
    await page.locator('#lesson-title').waitFor();
    const card = page.getByRole('button', { name: /Ver en Componentes/ }).filter({ hasText: target.name });
    check(`la clase muestra el efecto ${target.name} entre sus piezas`, (await card.count()) === 1);
    await card.click();
    await page.locator('#components-heading').waitFor();
    await page.locator('#component-name', { hasText: new RegExp(`^\\s*${escapeRe(target.name)}\\s*$`) }).waitFor().catch(() => {});
    check('Componentes se abre con la pestaña «Efectos» seleccionada', /^Efectos/.test(await selectedTabName(page)), await selectedTabName(page));
    check(`el detalle muestra ${target.name}`, norm(await page.locator('#component-name').textContent()) === target.name, norm(await page.locator('#component-name').textContent()));
    check('el efecto queda marcado en la lista (aria-current)', norm(await page.locator('nav[aria-label="Efectos"] button[aria-current="true"]').innerText().catch(() => '')).startsWith(target.name));
    check('relación inversa: el efecto lista la clase que lo menciona', (await page.locator('section[aria-labelledby="sec-lessons"]').getByRole('button', { name: new RegExp(escapeRe(TITLE)) }).count()) === 1);
    await page.screenshot({ path: resolve(SHOTS_DIR, 'desde-clase-1440.png'), fullPage: true });
  });

  await block('C5 · Asignar y desasignar una skill a un efecto', async () => {
    if (!(await page.locator('#components-heading').isVisible().catch(() => false))) await clickToComponents(page);
    await assignmentSection(page).getByRole('button', { name: 'Entrar con GitHub para asignar' }).click();
    await clickAuthSignIn(page);
    await page.waitForFunction(() => !location.search.includes('code='), null, { timeout: 15000 });
    await page.waitForTimeout(500);
    await clickToComponents(page);
    await pickEffect(page, target.name);
    const assignButton = assignmentSection(page).getByRole('button', { name: 'Asignar skill o modelo' });
    await assignButton.waitFor({ timeout: 10000 });
    check('con sesión, el efecto ofrece «Asignar skill o modelo»', (await assignButton.count()) === 1);

    await assignButton.click();
    const dialog = page.getByRole('dialog', { name: `Asignar a ${target.name}` });
    await dialog.waitFor();
    const skillBox = dialog.getByRole('checkbox', { name: new RegExp(SKILL_NAME) });
    await skillBox.waitFor({ timeout: 8000 });
    await skillBox.check();
    await dialog.getByRole('button', { name: 'Guardar asignación' }).click();
    await dialog.waitFor({ state: 'detached' });

    const row = page.locator('nav[aria-label="Efectos"] ul button', { hasText: new RegExp(`^\\s*${escapeRe(target.name)}`) }).first();
    check('el detalle del efecto muestra la skill asignada', (await assignmentSection(page).getByRole('button', { name: SKILL_NAME, exact: true }).count()) === 1);
    check('la fila del efecto muestra «1 skill»', (await row.innerText()).includes('1 skill'));
    const stats = await readStats(page);
    check('las cifras de «Efectos» cuentan la asignación (1 asignado)', stats[0]?.value === effects.length && stats[1]?.value === 1 && stats[2]?.value === effects.length - 1, JSON.stringify(stats));
    const stored = await page.evaluate((key) => localStorage.getItem(key) ?? '', ASSIGNMENTS_KEY);
    check('la asignación queda guardada con el id del efecto', stored.includes(target.id) && stored.includes('acme/tools/demo'));

    await assignmentSection(page).getByRole('button', { name: new RegExp(`Quitar la skill ${escapeRe(SKILL_NAME)} de ${escapeRe(target.name)}`) }).click();
    await assignmentSection(page).getByText('No asignado', { exact: true }).first().waitFor().catch(() => {});
    check('quitar la skill deja el efecto en «No asignado»', (await assignmentSection(page).getByText('No asignado', { exact: true }).count()) >= 1 && (await row.innerText()).includes('No asignado'));
    const emptied = await page.evaluate((key) => localStorage.getItem(key) ?? '', ASSIGNMENTS_KEY);
    check('localStorage ya no guarda el efecto', !emptied.includes(target.id));
  });

  await context.close();
}

/* ---------------- C6: estático ---------------- */

/** Frase ASCII larga del prompt (evita depender de cómo escape el minificador los acentos). */
function promptPhrase(prompt) {
  const runs = String(prompt ?? '').match(/[A-Za-z0-9 ,.:()-]{12,}/g) ?? [];
  return runs.map((r) => r.trim()).sort((a, b) => b.length - a.length)[0] ?? '';
}

function staticChecks(effects) {
  // Los efectos no traen dependencias: solo importan React, lucide-react o archivos propios. Se mira el código
  // de los efectos y no el package.json, que puede crecer por otras ramas sin que la 006 tenga nada que ver.
  const ALLOWED_PACKAGES = new Set(['react', 'lucide-react']);
  const effectFiles = [
    ...readdirSync(resolve(ROOT, 'src/components/effects')).map((f) => `src/components/effects/${f}`),
    ...readdirSync(resolve(ROOT, 'src/data/effects')).map((f) => `src/data/effects/${f}`),
  ].filter((f) => /\.tsx?$/.test(f));
  const foreign = effectFiles.flatMap((file) =>
    [...readFileSync(resolve(ROOT, file), 'utf8').matchAll(/^\s*import\s[^'"]*?['"]([^'"]+)['"]/gm)]
      .map((m) => m[1])
      .filter((spec) => !spec.startsWith('.') && !ALLOWED_PACKAGES.has(spec))
      .map((spec) => `${file} → ${spec}`)
  );
  check(`los efectos solo importan react, lucide-react o archivos propios (${effectFiles.length} archivos)`, effectFiles.length >= 18 && foreign.length === 0, foreign.join(', '));

  const html = readFileSync(resolve(DIST, 'index.html'), 'utf8');
  const entryPath = html.match(/<script[^>]*type="module"[^>]*src="\.?\/?(bundle\/[^"]+\.js)"/)?.[1];
  check('el index.html del dist referencia un chunk de entrada en bundle/', Boolean(entryPath), 'no se encontró');
  if (!entryPath) return;
  const entry = readFileSync(resolve(DIST, entryPath), 'utf8');
  const entryBytes = statSync(resolve(DIST, entryPath)).size;
  check(`el chunk de entrada pesa < ${MAX_ENTRY_BYTES.toLocaleString('es')} bytes`, entryBytes < MAX_ENTRY_BYTES, `${entryPath}: ${entryBytes} bytes`);

  const phrases = effects.map((e) => ({ id: e.id, phrase: promptPhrase(e.prompt) })).filter((p) => p.phrase.length >= 12 && !pending(p.phrase));
  check('hay frases de prompt con las que buscar en el bundle', phrases.length > 0, 'los prompts están pendientes o no tienen frases ASCII largas');
  const inEntry = phrases.filter((p) => entry.includes(p.phrase)).map((p) => p.id);
  check('el chunk de entrada no contiene el texto de ningún prompt de efecto', inEntry.length === 0, inEntry.join(', '));
  const chunks = readdirSync(resolve(DIST, 'bundle')).filter((f) => f.endsWith('.js') && `bundle/${f}` !== entryPath);
  const lazyText = chunks.map((f) => readFileSync(resolve(DIST, 'bundle', f), 'utf8')).join('\n');
  const found = phrases.filter((p) => lazyText.includes(p.phrase)).length;
  check('los prompts viven en chunks diferidos (la búsqueda los encuentra fuera del de entrada)', phrases.length > 0 && found === phrases.length, `${found} de ${phrases.length}`);
  // El código de las demos (su raíz data-effect y su CSS fx-…) tampoco debe colarse en el chunk de entrada.
  const demoMarkers = ['"data-effect"', 'fx-marquee-scroll', 'fx-shimmer-sweep'];
  const leaked = demoMarkers.filter((m) => entry.includes(m));
  check('el chunk de entrada no contiene el código de las demos (data-effect ni CSS fx-)', leaked.length === 0, leaked.join(', '));
  check('el código de las demos sí está en chunks diferidos', demoMarkers.every((m) => lazyText.includes(m)), 'no se encontraron los marcadores');
}

/* ---------------- Principal ---------------- */

async function main() {
  mkdirSync(SHOTS_DIR, { recursive: true });

  console.log('Leyendo los efectos del registro...');
  const effects = await loadEffects();
  console.log(`  ${effects.length} efectos: ${effects.map((e) => e.id).join(', ')}`);

  const errors = [];
  const stray = [];
  const browser = await chromium.launch({ headless: true });
  try {
    // Un único dist de prueba con catálogo y OAuth simulados: no depende de `npm run build` ni de `.env.local`.
    console.log('\nCompilando la app con catálogo y OAuth de prueba...');
    process.env.VITE_CATALOG_REPO = TEST_CATALOG_REPO;
    process.env.VITE_GITHUB_CLIENT_ID = TEST_CLIENT_ID;
    process.env.VITE_GITHUB_OAUTH_URL = TEST_OAUTH_URL;
    process.env.VITE_SKILLS_SH_PROXY_URL = '';
    // `loadEffects` arrancó antes un servidor de Vite, que deja NODE_ENV=development: sin esto el build
    // sale en modo desarrollo (React sin minificar) y el chunk de entrada no se parece al de producción.
    process.env.NODE_ENV = 'production';
    rmSync(OUT_DIR, { recursive: true, force: true });
    await build({ root: ROOT, logLevel: 'error', build: { outDir: OUT_DIR, emptyOutDir: true } });
    if (!existsSync(resolve(DIST, 'index.html'))) throw new Error(`La compilación de prueba no generó ${DIST}/index.html.`);
    const server = await preview({ root: ROOT, build: { outDir: OUT_DIR }, preview: { port: PORT, host: '127.0.0.1', strictPort: true } });
    try {
      await phaseA(browser, effects, errors, stray);
      await phaseB(browser, effects, errors, stray);
    } finally {
      await server.close();
    }

    await block('C6 · Sin dependencias ni peticiones externas, demos diferidas y chunk inicial < 350 kB', async () => {
      staticChecks(effects);
      check('la suite no vio peticiones fuera de 127.0.0.1 (salvo Google Fonts y GitHub simulado)', stray.length === 0, [...new Set(stray)].slice(0, 3).join(' | '));
    });
  } finally {
    await browser.close();
    rmSync(OUT_DIR, { recursive: true, force: true });
  }

  console.log('\nGeneral');
  check('sin errores de consola, pageerror ni violaciones CSP en todo el recorrido', errors.length === 0, [...new Set(errors)].slice(0, 3).join(' | '));

  if (failures.length > 0) {
    console.error(`\n${passed} pruebas correctas; ${failures.length} comprobación(es) fallaron:\n - ${failures.join('\n - ')}`);
    process.exit(1);
  }
  console.log(`\n${passed} pruebas correctas. Efectos: todo en verde.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
