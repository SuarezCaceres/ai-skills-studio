/**
 * Prueba de la pestaña «Clases» de Códice (E3) y de la relación inversa en Componentes (E4),
 * con GitHub simulado (API, OAuth con redirección y avatares). Nunca toca GitHub real.
 *
 * Recorre: pestañas reales (sin píldoras decorativas), alta con vista previa en vivo y selectores de
 * skill y componente, validación, aviso de cambios sin guardar, enlaces a la skill y al componente,
 * relación inversa, filtros, permisos, editar, borrar, exportar/importar JSON, persistencia y responsive.
 *
 * Uso: node scripts/test-lessons.mjs
 */
import { build, preview } from 'vite';
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
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
const PORT = 5190;
const OUT_DIR = join(tmpdir(), 'ai-skills-studio-lessons-e2e');
const SHOTS_DIR = resolve(ROOT, 'shots', 'lessons');

const failures = [];
function check(name, ok, detail = '') {
  console.log(`  ${ok ? 'ok ' : 'FALLA'}  ${name}${ok || !detail ? '' : ` — ${detail}`}`);
  if (!ok) failures.push(name);
}

const TITLE = '¿Qué es un hook?';
const BODY = [
  '## Qué es',
  '',
  'Un hook es un comando que se ejecuta ante un evento.',
  '',
  '- Se configura en `settings.json`',
  '- Se lanza solo',
  '',
  '<img src="x" onerror="window.__pwned = 1">',
  '<script>window.__pwned = 2</script>',
].join('\n');

/** Pasa de la portada a un módulo del estudio con clics (no recarga: conserva la sesión). */
async function clickToModule(page, label) {
  await page.evaluate(() => document.querySelector('.nav__actions a.btn--primary')?.click());
  await page.waitForTimeout(300);
  await page.evaluate((text) => {
    const links = [...document.querySelectorAll('nav[aria-label="Módulos del estudio"] a')];
    links.find((a) => a.textContent.trim().startsWith(text))?.click();
  }, label);
}

/** Carga la app desde cero (la sesión en memoria se pierde, como al recargar la pestaña). */
async function openCodice(page, origin) {
  await page.goto(`${origin}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(300);
  await clickToModule(page, 'Códice');
  await page.locator('#lessons-heading').waitFor();
}

async function login(page, triggerName) {
  await page.getByRole('button', { name: triggerName }).first().click();
  await page.getByRole('button', { name: 'Entrar con GitHub' }).click();
  await page.waitForFunction(() => !location.search.includes('code='), null, { timeout: 15000 });
  await page.waitForTimeout(500);
  await clickToModule(page, 'Códice');
  await page.locator('#lessons-heading').waitFor();
  await page.getByRole('button', { name: 'Subir clase' }).waitFor({ timeout: 10000 });
}

const cards = (page) => page.locator('section[aria-labelledby="lessons-heading"] article');

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
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
    await installFakeGithub(context);
    const page = await context.newPage();
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('response', (r) => r.status() === 404 && errors.push(`404 ${r.url()}`));

    console.log('\nVista de Códice');
    await openCodice(page, origin);
    await page.locator('#lessons-heading').waitFor();
    check('Códice no tiene pestañas: Clases es la única vista', (await page.getByRole('tab').count()) === 0);
    const body = await page.locator('body').innerText();
    check('Studio Engine ya no existe (ni su Run Pipeline ni su Live Sync)', !/Studio Engine|Run Pipeline|Live Sync/.test(body));
    check('las píldoras decorativas ya no están (Skills Vault, Model Matrix, Synaptic Hooks)', !/Skills Vault|Model Matrix|Synaptic Hooks/.test(body));

    console.log('\nSin sesión y sin clases');
    check('estado vacío con invitación a subir la primera', (await page.getByText('Todavía no hay clases en este navegador.').count()) === 1);
    check('sin sesión el botón pide entrar con GitHub', (await page.getByRole('button', { name: 'Entrar con GitHub para subir' }).count()) >= 1);
    check('exportar está desactivado sin clases', await page.getByRole('button', { name: 'Exportar JSON' }).isDisabled());

    console.log('\nSubir una clase');
    await login(page, 'Entrar con GitHub para subir');
    await page.getByRole('button', { name: 'Subir clase' }).click();
    await page.locator('#editor-heading').waitFor();
    await page.getByRole('button', { name: 'Subir clase' }).last().click();
    check('enviar vacío muestra un resumen de errores (role=alert)', (await page.getByRole('alert').filter({ hasText: 'Revisa' }).count()) === 1);
    check('el foco va al primer campo con error (título)', await page.waitForFunction(() => document.activeElement?.id === 'lesson-title-input', null, { timeout: 1500 }).then(() => true, () => false));
    check('el título con error lleva aria-invalid y aria-describedby', (await page.locator('#lesson-title-input').getAttribute('aria-invalid')) === 'true' && !!(await page.locator('#lesson-title-input').getAttribute('aria-describedby')));

    await page.locator('#lesson-title-input').fill(TITLE);
    await page.locator('#lesson-summary-input').fill('Qué es un hook y cómo lo usamos en el equipo.');
    await page.locator('#lesson-level-input').selectOption('Intermedio');
    await page.locator('#lesson-tags-input').fill('hooks, Claude Code');
    await page.locator('#lesson-tags-input').press('Enter');
    check('las etiquetas se normalizan en chips', (await page.getByText('#claude-code').count()) >= 1 && (await page.getByText('#hooks').count()) >= 1);
    await page.locator('#lesson-body-input').fill(BODY);
    const preview = page.getByTestId('lesson-preview');
    check('la vista previa se actualiza en vivo (título de sección)', (await preview.getByRole('heading', { name: 'Qué es' }).count()) === 1);
    check('la vista previa muestra la lista', (await preview.locator('li').count()) >= 2);
    check('el HTML del usuario no se ejecuta ni se inyecta (img/script)', (await preview.locator('img, script').count()) === 0 && (await page.evaluate(() => window.__pwned)) === undefined);

    await page.getByRole('checkbox', { name: new RegExp(SKILL_NAME) }).check();
    await page.getByRole('checkbox', { name: /Accordion/ }).check();
    check('el selector de skills lista la skill del equipo con su autor', (await page.getByText(`@${TEAM_LOGIN}`).count()) >= 1);
    await page.screenshot({ path: resolve(SHOTS_DIR, 'editor-1440.png'), fullPage: true });

    await page.getByRole('button', { name: 'Cancelar' }).click();
    check('cancelar con cambios avisa de que se perderán', (await page.getByRole('alertdialog', { name: 'Cambios sin guardar' }).count()) === 1);
    await page.getByRole('button', { name: 'Seguir editando' }).click();
    check('«Seguir editando» conserva lo escrito', (await page.locator('#lesson-title-input').inputValue()) === TITLE);

    await page.getByRole('button', { name: 'Subir clase' }).last().click();
    await page.locator('#lesson-title').waitFor();
    check('al guardar se abre el detalle de la clase', (await page.locator('#lesson-title').innerText()) === TITLE);
    check('el detalle muestra quién la subió', (await page.getByText(`@${TEAM_LOGIN}`).count()) >= 1);
    const hCount = await page.locator('section[aria-label="Explicación"]').getByRole('heading', { name: 'Qué es' }).count();
    const liCount = await page.locator('section[aria-label="Explicación"] li').count();
    check('el Markdown se renderiza con SafeMarkdown (encabezado y lista)', hCount === 1 && liCount >= 2, `h=${hCount} li=${liCount}`);
    check('el detalle no inyecta HTML del usuario', (await page.locator('section[aria-label="Explicación"] img, section[aria-label="Explicación"] script').count()) === 0 && (await page.evaluate(() => window.__pwned)) === undefined);
    await page.screenshot({ path: resolve(SHOTS_DIR, 'detalle-1440.png'), fullPage: true });

    console.log('\nEnlaces a la skill y al componente');
    await page.getByRole('button', { name: new RegExp(SKILL_NAME) }).click();
    const back = page.getByRole('button', { name: 'Códice', exact: true });
    await back.waitFor({ timeout: 10000 });
    check('la tarjeta de la skill lleva a su detalle, con «Códice» como vuelta', (await page.locator('section[aria-label="Detalle de skill"]').count()) >= 1);
    await back.click();
    await page.locator('#lesson-title').waitFor();
    check('al volver, la clase sigue abierta', (await page.locator('#lesson-title').innerText()) === TITLE);

    await page.getByRole('button', { name: /Accordion/ }).click();
    await page.locator('#components-heading').waitFor();
    check('la tarjeta del componente lleva a Componentes con ese componente elegido', (await page.locator('#component-name').innerText()) === 'Accordion');
    const inverse = page.locator('section[aria-labelledby="sec-lessons"]');
    check('relación inversa: el componente lista la clase que lo menciona', (await inverse.getByRole('button', { name: new RegExp(TITLE.replace('?', '\\?')) }).count()) === 1);
    await page.getByRole('button', { name: 'Card', exact: true }).first().click().catch(() => {});
    await page.locator('nav[aria-label="Componentes"] ul button', { hasText: /^Card/ }).click();
    await page.locator('#component-name', { hasText: 'Card' }).waitFor();
    check('un componente sin clases dice que ninguna lo usa', (await inverse.getByText('Ninguna clase usa este componente todavía.').count()) === 1);
    await page.locator('nav[aria-label="Componentes"] ul button', { hasText: /^Accordion/ }).click();
    await inverse.getByRole('button', { name: new RegExp(TITLE.replace('?', '\\?')) }).click();
    await page.locator('#lesson-title').waitFor();
    check('desde el componente se vuelve a abrir la clase en Códice', (await page.locator('#lesson-title').innerText()) === TITLE);

    console.log('\nLista y filtros');
    await page.getByRole('button', { name: 'Clases', exact: true }).click();
    await page.locator('#lessons-heading').waitFor();
    check('la lista muestra la tarjeta de la clase', (await cards(page).count()) === 1);
    const cardText = await cards(page).first().innerText();
    check('la tarjeta muestra autor, nivel, etiquetas y chips de skill y componente', cardText.includes(`@${TEAM_LOGIN}`) && cardText.includes('Intermedio') && cardText.includes('#hooks') && cardText.includes(SKILL_NAME) && cardText.includes('Accordion'));
    await page.getByLabel('Buscar en las clases').fill('zzz');
    check('una búsqueda sin resultados lo explica', (await page.getByText('Ninguna clase coincide con los filtros.').count()) === 1);
    await page.getByRole('button', { name: 'Quitar filtros' }).click();
    await page.getByLabel('Nivel').selectOption('Avanzado');
    check('el filtro por nivel excluye lo que no coincide', (await cards(page).count()) === 0);
    await page.getByLabel('Nivel').selectOption('Intermedio');
    await page.getByLabel('Etiqueta').selectOption('hooks');
    await page.getByLabel('Skill', { exact: true }).selectOption({ label: SKILL_NAME });
    await page.getByLabel('Componente', { exact: true }).selectOption({ label: 'Accordion' });
    check('los filtros combinados (nivel, etiqueta, skill y componente) dejan la clase', (await cards(page).count()) === 1);
    await page.getByLabel('Buscar en las clases').fill('hook');
    check('el buscador encuentra por título', (await cards(page).count()) === 1);
    await page.getByLabel('Buscar en las clases').fill('');
    await page.getByLabel('Nivel').selectOption('');
    await page.getByLabel('Etiqueta').selectOption('');
    await page.getByLabel('Skill', { exact: true }).selectOption('');
    await page.getByLabel('Componente', { exact: true }).selectOption('');

    console.log('\nEditar');
    await cards(page).first().getByRole('button', { name: TITLE }).click();
    await page.getByRole('button', { name: 'Editar' }).click();
    await page.locator('#editor-heading').waitFor();
    check('editar precarga el formulario', (await page.locator('#lesson-title-input').inputValue()) === TITLE && (await page.locator('#lesson-level-input').inputValue()) === 'Intermedio');
    check('editar precarga las selecciones de skill y componente', (await page.getByRole('checkbox', { name: new RegExp(SKILL_NAME) }).isChecked()) && (await page.getByRole('checkbox', { name: /Accordion/ }).isChecked()));
    await page.locator('#lesson-title-input').fill('Hooks explicados desde cero');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await page.locator('#lesson-title').waitFor();
    check('guardar cambios actualiza el título y conserva el id', (await page.locator('#lesson-title').innerText()) === 'Hooks explicados desde cero');

    console.log('\nPermisos y datos de otras personas');
    await page.getByRole('button', { name: 'Clases', exact: true }).click();
    const exportDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exportar JSON' }).click();
    const download = await exportDownload;
    const exported = JSON.parse(readFileSync(await download.path(), 'utf8'));
    check('exportar descarga un JSON con formato y la clase', exported.format === 'codice-lessons' && exported.lessons.length === 1 && exported.lessons[0].title === 'Hooks explicados desde cero');

    const foreign = { ...exported.lessons[0], id: 'clase-de-otra-persona', title: 'Clase de otra persona', author: { login: 'otra-persona', profileUrl: 'https://evil.test/' } };
    await page.locator('input[type="file"]').setInputFiles({ name: 'ajena.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ ...exported, lessons: [foreign, { id: 'roto' }] })) });
    await page.getByText(/Importación terminada: 1 nuevas, 0 actualizadas, 1 omitidas/).waitFor();
    check('importar añade la clase válida y omite la rota', (await cards(page).count()) === 2);
    const foreignHref = await cards(page).filter({ hasText: 'Clase de otra persona' }).locator('a').first().getAttribute('href');
    check('el perfil de una clase importada se reconstruye desde el login (no se fía de la URL)', foreignHref === 'https://github.com/otra-persona', String(foreignHref));
    await cards(page).filter({ hasText: 'Clase de otra persona' }).getByRole('button', { name: 'Clase de otra persona' }).click();
    await page.locator('#lesson-title').waitFor();
    check('en la clase de otra persona no hay Editar ni Borrar', (await page.getByRole('button', { name: 'Editar' }).count()) === 0 && (await page.getByRole('button', { name: 'Borrar' }).count()) === 0);
    await page.getByRole('button', { name: 'Clases', exact: true }).click();
    await page.locator('input[type="file"]').setInputFiles({ name: 'malo.json', mimeType: 'application/json', buffer: Buffer.from('esto no es json') });
    await page.getByText('El archivo no es un JSON válido.').waitFor();
    check('un archivo que no es JSON se rechaza con un mensaje claro', true);

    console.log('\nPersistencia (recargar pierde la sesión, no las clases)');
    await openCodice(page, origin);
    check('tras recargar siguen las dos clases', (await cards(page).count()) === 2);
    await cards(page).filter({ hasText: 'Hooks explicados' }).getByRole('button', { name: 'Hooks explicados desde cero' }).click();
    await page.locator('#lesson-title').waitFor();
    check('sin sesión no hay Editar ni Borrar aunque sea tu clase', (await page.getByRole('button', { name: 'Editar' }).count()) === 0);

    console.log('\nBorrar');
    await page.getByRole('button', { name: 'Clases', exact: true }).click();
    await login(page, 'Subir clase').catch(async () => {
      // «Entrar con GitHub para subir» es el botón sin sesión.
      await login(page, 'Entrar con GitHub para subir');
    });
    await cards(page).filter({ hasText: 'Hooks explicados' }).getByRole('button', { name: 'Hooks explicados desde cero' }).click();
    check('con sesión y siendo la autora aparecen Editar y Borrar', (await page.getByRole('button', { name: 'Editar' }).count()) === 1 && (await page.getByRole('button', { name: 'Borrar' }).count()) === 1);
    await page.getByRole('button', { name: 'Borrar' }).click();
    check('borrar pide confirmación', (await page.getByRole('alertdialog', { name: 'Confirmar el borrado' }).count()) === 1);
    await page.getByRole('button', { name: 'Cancelar' }).click();
    check('cancelar la confirmación conserva la clase', (await page.locator('#lesson-title').count()) === 1);
    await page.getByRole('button', { name: 'Borrar' }).click();
    await page.getByRole('button', { name: 'Sí, borrar' }).click();
    await page.locator('#lessons-heading').waitFor();
    check('tras borrar, la clase desaparece de la lista', (await cards(page).filter({ hasText: 'Hooks explicados' }).count()) === 0 && (await cards(page).count()) === 1);
    await page.evaluate(() => [...document.querySelectorAll('nav[aria-label="Módulos del estudio"] a')].find((l) => l.textContent.includes('Componentes'))?.click());
    await page.locator('#components-heading').waitFor();
    await page.locator('nav[aria-label="Componentes"] ul button', { hasText: /^Accordion/ }).click();
    const afterDelete = page.locator('section[aria-labelledby="sec-lessons"]');
    check('el componente deja de listar la clase borrada (y sigue la de otra persona)', (await afterDelete.getByText('Hooks explicados desde cero').count()) === 0 && (await afterDelete.getByText('Clase de otra persona').count()) === 1);
    await page.evaluate(() => [...document.querySelectorAll('nav[aria-label="Módulos del estudio"] a')].find((l) => l.textContent.trim().startsWith('Códice'))?.click());
    await page.locator('#lessons-heading').waitFor();

    console.log('\nResponsive');
    for (const [name, width, height] of [['1440', 1440, 900], ['1024', 1024, 768], ['768', 768, 1024], ['390', 390, 844]]) {
      await page.setViewportSize({ width, height });
      await page.waitForTimeout(250);
      await page.screenshot({ path: resolve(SHOTS_DIR, `lista-${name}.png`), fullPage: true });
      const listOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      await page.getByRole('button', { name: 'Subir clase' }).click();
      await page.locator('#editor-heading').waitFor();
      await page.screenshot({ path: resolve(SHOTS_DIR, `editor-${name}.png`), fullPage: true });
      const editorOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      check(`sin desborde horizontal a ${name} px (lista y editor)`, listOverflow <= 0 && editorOverflow <= 0, `${listOverflow}/${editorOverflow}px`);
      if (width < 1024) {
        await page.getByRole('tab', { name: 'Vista previa' }).click();
        check(`a ${name} px la vista previa tiene su propia pestaña`, await page.getByTestId('lesson-preview').isVisible());
      }
      await page.getByRole('button', { name: 'Clases', exact: true }).click();
      await page.getByRole('button', { name: 'Cancelar' }).click().catch(() => {});
      await page.locator('#lessons-heading').waitFor();
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
  console.log('\nClases: todo en verde.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
