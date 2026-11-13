/**
 * Prueba de la asignación de skills y modelos a los componentes (E2), con GitHub simulado:
 * miniaturas, estado «No asignado», inicio de sesión, asignar, desasignar, filtros y persistencia.
 *
 * Compila la app en una carpeta temporal con un catálogo y un OAuth de prueba; intercepta
 * `api.github.com`, `github.com/login/oauth` y el canje del código. Nunca toca GitHub real.
 *
 * Uso: node scripts/test-components-assign.mjs
 */
import { build, preview } from 'vite';
import { chromium } from 'playwright';
import { mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SKILL_NAME,
  TEAM_LOGIN,
  TEST_CATALOG_REPO,
  TEST_CLIENT_ID,
  TEST_OAUTH_URL,
  installFakeGithub,
} from './lib/github-fixture.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 5189;
const OUT_DIR = join(tmpdir(), 'ai-skills-studio-components-assign-e2e');
const SHOTS_DIR = resolve(ROOT, 'shots', 'components');

const failures = [];
function check(name, ok, detail = '') {
  console.log(`  ${ok ? 'ok ' : 'FALLA'}  ${name}${ok || !detail ? '' : ` — ${detail}`}`);
  if (!ok) failures.push(name);
}

/** Desde la portada, pasa a la página Componentes con clics dentro de la app (no recarga: conserva la sesión). */
async function clickToComponents(page) {
  await page.evaluate(() => document.querySelector('.nav__actions a.btn--primary')?.click());
  await page.waitForTimeout(300);
  await page.evaluate(() =>
    [...document.querySelectorAll('nav[aria-label="Módulos del estudio"] a')].find((a) => a.textContent.includes('Componentes'))?.click()
  );
  await page.locator('#components-heading').waitFor();
}

/** Carga la app desde cero (la sesión en memoria se pierde, como al recargar la pestaña). */
async function openComponents(page, origin) {
  await page.goto(`${origin}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(300);
  await clickToComponents(page);
}

const row = (page, name) => page.locator('nav[aria-label="Componentes"] ul button', { hasText: new RegExp(`^${name}`) });
const rows = (page) => page.locator('nav[aria-label="Componentes"] ul button');
const assignmentSection = (page) => page.locator('section[aria-labelledby="sec-assignment"]');

/** Inicia sesión con el GitHub simulado desde la propia página Componentes. */
async function login(page, origin) {
  await page.getByRole('button', { name: 'Entrar con GitHub para asignar' }).click();
  await page.getByRole('button', { name: 'Entrar con GitHub' }).click();
  await page.waitForFunction(() => !location.search.includes('code='), null, { timeout: 15000 });
  await page.waitForTimeout(500);
  await clickToComponents(page);
  await assignmentSection(page).getByRole('button', { name: /Asignar skill o modelo|Editar asignación/ }).waitFor({ timeout: 10000 });
}

async function main() {
  rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(SHOTS_DIR, { recursive: true });
  process.env.VITE_CATALOG_REPO = TEST_CATALOG_REPO;
  process.env.VITE_GITHUB_CLIENT_ID = TEST_CLIENT_ID;
  process.env.VITE_GITHUB_OAUTH_URL = TEST_OAUTH_URL;
  console.log('Compilando la app con catálogo y OAuth de prueba...');
  await build({ root: ROOT, logLevel: 'error', build: { outDir: OUT_DIR, emptyOutDir: true } });

  const server = await preview({ root: ROOT, build: { outDir: OUT_DIR }, preview: { port: PORT, host: '127.0.0.1', strictPort: true } });
  const origin = `http://127.0.0.1:${PORT}`;
  const browser = await chromium.launch({ headless: true });
  const errors = [];

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await installFakeGithub(context);
    const page = await context.newPage();
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(String(e)));

    console.log('\nMiniaturas');
    await openComponents(page, origin);
    await page.waitForFunction(() => [...document.querySelectorAll('nav[aria-label="Componentes"] img')].length === 20 && [...document.querySelectorAll('nav[aria-label="Componentes"] img')].every((i) => i.complete));
    const thumbs = await page.locator('nav[aria-label="Componentes"] img').evaluateAll((imgs) => imgs.map((i) => i.naturalWidth));
    check('las 20 filas muestran su miniatura generada (640 px de ancho natural)', thumbs.length === 20 && thumbs.every((w) => w === 640), thumbs.join(','));
    const big = page.getByRole('img', { name: 'Captura generada del componente Accordion' });
    await big.waitFor();
    check('el detalle muestra la imagen del componente', (await big.evaluate((i) => i.complete && i.naturalWidth)) === 640);

    console.log('\nSin sesión');
    check('sin sesión se ofrece entrar con GitHub para asignar', (await assignmentSection(page).getByRole('button', { name: 'Entrar con GitHub para asignar' }).count()) === 1);
    check('sin sesión no hay botón de asignar', (await assignmentSection(page).getByRole('button', { name: 'Asignar skill o modelo' }).count()) === 0);

    console.log('\nAsignar (con sesión)');
    await login(page, origin);
    check('con sesión aparece "Asignar skill o modelo"', (await assignmentSection(page).getByRole('button', { name: 'Asignar skill o modelo' }).count()) === 1);
    await assignmentSection(page).getByRole('button', { name: 'Asignar skill o modelo' }).click();
    const dialog = page.getByRole('dialog', { name: 'Asignar a Accordion' });
    await dialog.waitFor();
    check('se abre un diálogo modal con el foco dentro', await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]')));
    const skillBox = dialog.getByRole('checkbox', { name: new RegExp(SKILL_NAME) });
    await skillBox.waitFor({ timeout: 8000 });
    check('el diálogo lista las skills del equipo con su autor', (await dialog.getByText(`@${TEAM_LOGIN}`).count()) >= 1);
    check('el botón Guardar empieza desactivado (sin cambios)', await dialog.getByRole('button', { name: 'Guardar asignación' }).isDisabled());
    await skillBox.check();
    await dialog.getByRole('checkbox', { name: /Claude Opus.*Opus 5\.5/ }).check();
    await dialog.getByLabel(/Nota/).fill('Hecho con la skill de diseño y revisado con Opus.');
    await page.screenshot({ path: resolve(SHOTS_DIR, 'asignar-1440.png') });
    await dialog.getByRole('button', { name: 'Guardar asignación' }).click();
    await dialog.waitFor({ state: 'detached' });
    check('al guardar, el foco vuelve al botón que abrió el panel', (await page.evaluate(() => document.activeElement?.textContent ?? '')).includes('Editar asignación'));

    const panel = assignmentSection(page);
    check('el detalle muestra la skill asignada', (await panel.getByRole('button', { name: SKILL_NAME, exact: true }).count()) === 1);
    check('el detalle muestra el modelo asignado', (await panel.getByText('Claude Opus · Opus 5.5').count()) === 1);
    check('el detalle muestra la nota', (await panel.getByText('Hecho con la skill de diseño').count()) === 1);
    check('el detalle ya no dice "No asignado"', (await panel.getByText('No asignado', { exact: true }).count()) === 0);
    check('la fila del Accordion muestra "1 skill" y "1 modelo"', (await row(page, 'Accordion').innerText()).includes('1 skill') && (await row(page, 'Accordion').innerText()).includes('1 modelo'));
    check('las demás filas siguen diciendo "No asignado"', (await rows(page).filter({ hasText: 'No asignado' }).count()) === 19);

    console.log('\nFiltros con asignaciones');
    await page.getByRole('button', { name: 'Con skill' }).click();
    check('"Con skill" deja solo el Accordion', (await rows(page).count()) === 1 && (await rows(page).first().innerText()).includes('Accordion'));
    await page.getByRole('button', { name: 'Con modelo' }).click();
    check('"Con modelo" deja solo el Accordion', (await rows(page).count()) === 1);
    await page.getByRole('button', { name: 'No asignados' }).click();
    check('"No asignados" deja los otros 19', (await rows(page).count()) === 19);
    await page.getByRole('button', { name: 'Todos', exact: true }).click();

    console.log('\nPersistencia (recargar pierde la sesión pero no las asignaciones)');
    await openComponents(page, origin);
    check('tras recargar, la fila conserva "1 skill"', (await row(page, 'Accordion').innerText()).includes('1 skill'));
    check('tras recargar, el detalle conserva skill y modelo', (await assignmentSection(page).getByText(SKILL_NAME).count()) >= 1 && (await assignmentSection(page).getByText('Claude Opus · Opus 5.5').count()) === 1);
    check('tras recargar (sin sesión) no hay botones para quitar', (await assignmentSection(page).getByRole('button', { name: /^Quitar/ }).count()) === 0);
    const stored = await page.evaluate(() => localStorage.getItem('ai_skills_studio_component_assignments_v1') ?? '');
    check('queda guardado en localStorage', stored.includes('accordion') && stored.includes('acme/tools/demo'));

    console.log('\nAbrir la skill y volver');
    await assignmentSection(page).getByRole('button', { name: SKILL_NAME, exact: true }).click();
    const back = page.getByRole('button', { name: 'Componentes', exact: true });
    await back.waitFor({ timeout: 10000 });
    check('el chip abre el detalle de la skill, con "Componentes" como destino de vuelta', (await page.locator('section[aria-label="Detalle de skill"]').count()) >= 1);
    await back.click();
    await page.locator('#components-heading').waitFor();
    check('al volver, sigue elegido el mismo componente', (await page.locator('#component-name').innerText()) === 'Accordion');

    console.log('\nDesasignar (con sesión)');
    await openComponents(page, origin);
    await login(page, origin);
    await assignmentSection(page).getByRole('button', { name: new RegExp(`Quitar la skill ${SKILL_NAME} de Accordion`) }).click();
    check('quitar la skill deja el modelo', (await assignmentSection(page).getByText('Claude Opus · Opus 5.5').count()) === 1 && (await assignmentSection(page).getByRole('button', { name: SKILL_NAME, exact: true }).count()) === 0);
    check('la fila pasa a "1 modelo" sin skill', !(await row(page, 'Accordion').innerText()).includes('skill'));
    await assignmentSection(page).getByRole('button', { name: /Quitar el modelo Claude Opus Opus 5\.5 de Accordion/ }).click();
    check('quitar lo último deja el componente en "No asignado"', (await assignmentSection(page).getByText('No asignado', { exact: true }).count()) >= 1 && (await row(page, 'Accordion').innerText()).includes('No asignado'));
    const emptied = await page.evaluate(() => localStorage.getItem('ai_skills_studio_component_assignments_v1') ?? '');
    check('localStorage ya no guarda el componente', !emptied.includes('accordion'));

    console.log('\nResponsive del panel de asignar');
    for (const [name, width, height] of [['1024', 1024, 768], ['768', 768, 1024], ['390', 390, 844]]) {
      await page.setViewportSize({ width, height });
      await page.waitForTimeout(200);
      await assignmentSection(page).getByRole('button', { name: 'Asignar skill o modelo' }).click();
      await page.getByRole('dialog', { name: 'Asignar a Accordion' }).waitFor();
      await page.screenshot({ path: resolve(SHOTS_DIR, `asignar-${name}.png`) });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      check(`el panel de asignar no desborda a ${name} px`, overflow <= 0, `${overflow}px`);
      await page.keyboard.press('Escape');
      await page.getByRole('dialog').waitFor({ state: 'detached' });
    }

    check('sin errores de consola', errors.length === 0, errors.slice(0, 3).join(' | '));
  } finally {
    await browser.close();
    await server.close();
    rmSync(OUT_DIR, { recursive: true, force: true });
  }

  if (failures.length > 0) {
    console.error(`\n${failures.length} comprobación(es) fallaron:\n - ${failures.join('\n - ')}`);
    process.exit(1);
  }
  console.log('\nAsignación de componentes: todo en verde.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
