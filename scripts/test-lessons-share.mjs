/**
 * Prueba de interfaz de las clases compartidas (C5): pestañas Mis clases | Comunidad, flujo de compartir
 * (confirmar, error y reintento, actualizar, retirar) y vista de solo lectura de las clases de otras
 * personas. Recorre la interfaz Y el servicio reales contra el GitHub simulado de
 * `scripts/lib/fake-github-classes.mjs` (nunca toca `api.github.com` ni YouTube reales) y comprueba también
 * el estado que queda «en GitHub»: archivos, commits e Issues.
 *
 * Uso: node scripts/test-lessons-share.mjs
 */
import { build as viteBuild, preview } from 'vite';
import { build as esbuild } from 'esbuild';
import { chromium } from 'playwright';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { TEST_CATALOG_REPO, TEST_CLIENT_ID, TEST_OAUTH_URL, installFakeGithub } from './lib/github-fixture.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 5191;
const OUT_DIR = join(tmpdir(), 'ai-skills-studio-share-e2e');
const SHOTS_DIR = resolve(ROOT, 'shots', 'share');
const ME = 'SuarezCaceres';

const failures = [];
function check(name, ok, detail = '') {
  console.log(`  ${ok ? 'ok ' : 'FALLA'}  ${name}${ok || !detail ? '' : ` — ${detail}`}`);
  if (!ok) failures.push(name);
}

/* ---------------- Lógica de clases (la misma que usa la app) para sembrar datos ---------------- */
const helperDir = mkdtempSync(join(tmpdir(), 'codice-share-helpers-'));
const entry = join(helperDir, 'entry.ts');
const bundle = join(helperDir, 'bundle.mjs');
const src = (f) => JSON.stringify(join(ROOT, 'src/services', f).replace(/\\/g, '/'));
writeFileSync(entry, `export * from ${src('lessonSharing.ts')};\nexport * from ${src('lessonsStore.ts')};\n`);
await esbuild({ entryPoints: [entry], outfile: bundle, bundle: true, format: 'esm', platform: 'node', logLevel: 'error' });
const m = await import(pathToFileURL(bundle).href);

const NOW = new Date('2026-11-10T10:00:00.000Z');
const BODY = '## Qué es\n\nUn hook es un comando que se ejecuta ante un evento.\n\n- Se configura en `settings.json`\n- Se lanza solo';
const lesson = (login, title, over = {}) =>
  m.createLesson(
    { title, summary: 'Resumen de la clase para la prueba de interfaz.', level: 'Intermedio', tags: ['hooks'], bodyMarkdown: BODY, skillIds: [], componentIds: [], videos: [], ...over },
    { login },
    [],
    NOW
  );

const HOSTILE = '## Qué es un hook\n\nTexto de Ana.\n\n<img src="x" onerror="window.__pwned = 1">\n<script>window.__pwned = 2</script>';
const OWN = [lesson(ME, 'Mis hooks de Claude Code', { updatedAt: '2026-11-13T10:00:00.000Z' }), lesson(ME, 'Segunda clase privada')];
const ANA_HOOKS = lesson('ana-dev', 'Hooks de Claude Code desde cero', { bodyMarkdown: HOSTILE, tags: ['hooks', 'ana'], videos: [{ id: 'v1', kind: 'video', youtubeId: 'jNQXAC9IVRw', title: 'Introducción' }] });
const ANA_WT = lesson('ana-dev', 'Worktrees paso a paso', { level: 'Avanzado', tags: ['git'] });
const ANA_OLD = lesson('ana-dev', 'Clase que Ana retiró');
const LUIS = lesson('luis-ia', 'Clase en tres partes', {
  level: 'Avanzado',
  tags: ['video'],
  videos: [
    { id: 'v1', kind: 'video', youtubeId: 'jNQXAC9IVRw', title: 'Instalación' },
    { id: 'v2', kind: 'video', youtubeId: 'M7lc1UVf-VE', title: '' },
    { id: 'v3', kind: 'playlist', youtubeId: 'PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf', title: 'Lista completa' },
  ],
});
const PEPE = lesson('pepe', 'Esta se borrará de GitHub');

/** Un repo `<login>/codice-skills` con las clases dadas y un Issue `[class]` por cada una. */
function seedUser(machine, login, lessons, { closed = [], withoutFiles = [] } = {}) {
  const files = { 'README.md': '# codice-skills\n' };
  for (const l of lessons) {
    if (withoutFiles.includes(l.id)) continue;
    for (const f of m.buildSharedFiles(l)) files[f.path] = f.content;
  }
  machine.seedRepo(login, 'codice-skills', files);
  const sha = machine.head(`${login}/codice-skills`);
  for (const l of lessons) {
    machine.seedIssue({
      login,
      title: `[class] ${login}/${l.id}`,
      body: `Clase compartida.\n\n${m.buildClassMarker(l, { repo: `${login}/codice-skills`, sha })}`,
      labels: ['class', m.classLabel(l.id)],
      state: closed.includes(l.id) ? 'closed' : 'open',
    });
  }
  return sha;
}

function seedCommunity(machine) {
  const anaSha = seedUser(machine, 'ana-dev', [ANA_HOOKS, ANA_WT, ANA_OLD], { closed: [ANA_OLD.id] });
  seedUser(machine, 'luis-ia', [LUIS]);
  seedUser(machine, 'pepe', [PEPE], { withoutFiles: [PEPE.id] });
  // Suplantación: otra cuenta copia el marcador de Ana apuntando a su repo.
  machine.seedIssue({
    login: 'atacante',
    title: `[class] atacante/${ANA_HOOKS.id}`,
    body: m.buildClassMarker(ANA_HOOKS, { repo: 'ana-dev/codice-skills', sha: anaSha }),
    labels: ['class', m.classLabel(ANA_HOOKS.id)],
  });
  // Ruido: Issue con la etiqueta pero sin marcador, y un pull request con marcador.
  machine.seedIssue({ login: 'ruido', title: '[class] sin marcador', body: 'nada que ver', labels: ['class'] });
  machine.seedIssue({ login: 'ana-dev', title: '[class] pr', body: m.buildClassMarker(ANA_WT, { repo: 'ana-dev/codice-skills', sha: anaSha }), labels: ['class'], pull_request: true });
  return anaSha;
}

/* ---------------- Ayudantes de navegador ---------------- */
async function clickToModule(page, label) {
  await page.evaluate(() => document.querySelector('.nav__actions a.btn--primary')?.click());
  await page.waitForTimeout(300);
  await page.evaluate((text) => {
    const links = [...document.querySelectorAll('nav[aria-label="Módulos del estudio"] a')];
    links.find((a) => a.textContent.trim().startsWith(text))?.click();
  }, label);
}
async function openCodice(page, origin) {
  await page.goto(`${origin}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(300);
  await clickToModule(page, 'Códice');
  await page.locator('#lessons-heading').waitFor({ timeout: 20000 });
}
async function login(page) {
  await page.getByRole('button', { name: 'Entrar con GitHub para subir' }).first().click();
  await page.getByRole('button', { name: 'Entrar con GitHub' }).click();
  await page.waitForFunction(() => !location.search.includes('code='), null, { timeout: 15000 });
  await page.waitForTimeout(500);
  await clickToModule(page, 'Códice');
  await page.locator('#lessons-heading').waitFor();
  await page.getByRole('button', { name: 'Subir clase' }).waitFor({ timeout: 10000 });
}
const cards = (page) => page.locator('section[aria-labelledby="lessons-heading"] article');
const noOverflow = (page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
const classCalls = (machine) => machine.countCalls('labels=class');
const ownIssues = (machine) => machine.issues.filter((i) => i.user.login === ME && i.title.startsWith('[class] '));

async function main() {
  rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(SHOTS_DIR, { recursive: true });
  process.env.VITE_CATALOG_REPO = TEST_CATALOG_REPO;
  process.env.VITE_GITHUB_CLIENT_ID = TEST_CLIENT_ID;
  process.env.VITE_GITHUB_OAUTH_URL = TEST_OAUTH_URL;
  console.log('Compilando la app con catálogo y OAuth de prueba...');
  await viteBuild({ root: ROOT, logLevel: 'error', build: { outDir: OUT_DIR, emptyOutDir: true } });

  const server = await preview({ root: ROOT, build: { outDir: OUT_DIR }, preview: { port: PORT, host: '127.0.0.1', strictPort: true } });
  const origin = `http://127.0.0.1:${PORT}`;
  const browser = await chromium.launch({ headless: true });
  const errors = [];

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.addInitScript((seed) => {
      try {
        if (!localStorage.getItem('ai_skills_studio_lessons_v1')) localStorage.setItem('ai_skills_studio_lessons_v1', JSON.stringify(seed));
      } catch {
        /* sin almacenamiento */
      }
    }, OWN);
    const machine = await installFakeGithub(context, { classes: true });
    const anaSha = seedCommunity(machine);

    // YouTube simulado: nunca se sale a youtube.com real.
    const ytRequests = [];
    await context.route(/^https:\/\/(www\.youtube-nocookie\.com|i\.ytimg\.com)\//, (route) => {
      const url = route.request().url();
      ytRequests.push(url);
      return url.includes('i.ytimg.com')
        ? route.fulfill({ status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360"><rect width="480" height="360" fill="#1e293b"/></svg>' })
        : route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>reproductor simulado</title><p>reproductor simulado</p>' });
    });
    const page = await context.newPage();
    const stray = [];
    page.on('request', (r) => /youtube\.com|youtu\.be|googlevideo\.com/.test(r.url()) && stray.push(r.url()));
    page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
    page.on('pageerror', (e) => errors.push(String(e)));

    console.log('\nPestañas y sin sesión');
    await openCodice(page, origin);
    check('hay dos pestañas reales: Mis clases y Comunidad', (await page.getByRole('tab').allInnerTexts()).map((t) => t.trim()).join('|') === 'Mis clases|Comunidad');
    check('Mis clases es la pestaña por defecto y muestra las dos clases propias', (await page.getByRole('tab', { name: 'Mis clases' }).getAttribute('aria-selected')) === 'true' && (await cards(page).count()) === 2);
    await page.getByRole('tab', { name: 'Comunidad' }).click();
    await page.locator('[data-testid="community-signed-out"]').waitFor();
    check('sin sesión Comunidad invita a entrar con GitHub', (await page.getByTestId('community-signed-out').getByRole('button', { name: 'Entrar con GitHub' }).count()) === 1);
    check('sin sesión no se hace NINGUNA petición de clases a GitHub', classCalls(machine) === 0, `${classCalls(machine)} peticiones`);
    await page.screenshot({ path: resolve(SHOTS_DIR, 'comunidad-sin-sesion-1440.png'), fullPage: true });
    await page.getByRole('tab', { name: 'Comunidad' }).focus();
    await page.keyboard.press('ArrowLeft');
    check('ArrowLeft selecciona Mis clases y mueve el foco', (await page.getByRole('tab', { name: 'Mis clases' }).getAttribute('aria-selected')) === 'true' && (await page.evaluate(() => document.activeElement?.id)) === 'tab-mis-clases');
    await page.keyboard.press('End');
    check('End va a Comunidad y cambia el panel', (await page.getByRole('tab', { name: 'Comunidad' }).getAttribute('aria-selected')) === 'true' && (await page.getByRole('tabpanel').getAttribute('id')) === 'panel-comunidad');
    await page.keyboard.press('Home');
    check('Home vuelve a Mis clases', (await page.getByRole('tab', { name: 'Mis clases' }).getAttribute('aria-selected')) === 'true');

    console.log('\nEntrar con GitHub');
    await login(page);
    check('con sesión, Mis clases lista las dos clases y ninguna dice Compartida', (await cards(page).count()) === 2 && (await page.getByTestId('card-share-status').count()) === 0);

    console.log('\nCompartir (con un fallo de red y reintento)');
    await cards(page).first().getByRole('button', { name: 'Mis hooks de Claude Code' }).click();
    await page.locator('#lesson-title').waitFor();
    check('el detalle propio muestra el panel de compartir como Privada', (await page.getByTestId('share-status').innerText()).includes('Privada'));
    await page.getByRole('button', { name: 'Compartir en Comunidad', exact: true }).click();
    const dlg = page.getByRole('dialog', { name: 'Compartir esta clase' });
    await dlg.waitFor();
    const dlgText = await dlg.innerText();
    check('el diálogo avisa de que es público de verdad y de que la sesión solo es un filtro', /público de verdad/i.test(dlgText) && /solo un filtro/i.test(dlgText));
    check('el diálogo dice dónde se publica y cómo retirarla', dlgText.includes(`${ME}/codice-skills`) && dlgText.includes(`classes/${OWN[0].id}/`) && /retirarla/i.test(dlgText));
    check('el foco empieza en Cancelar', (await page.evaluate(() => document.activeElement?.textContent?.trim())) === 'Cancelar');
    await page.screenshot({ path: resolve(SHOTS_DIR, 'dialogo-compartir-1440.png'), fullPage: true });
    await dlg.getByRole('button', { name: 'Cancelar' }).click();
    await page.getByRole('dialog').waitFor({ state: 'detached' });
    check('cancelar no escribe nada en GitHub', machine.repoFiles(`${ME}/codice-skills`) === null && ownIssues(machine).length === 0 && machine.countCalls('POST') === 0);

    await page.getByRole('button', { name: 'Compartir en Comunidad', exact: true }).click();
    machine.failNext({ match: 'POST /user/repos', kind: 'network' });
    await dlg.getByRole('button', { name: 'Compartir públicamente' }).click();
    await dlg.getByRole('alert').waitFor({ timeout: 10000 });
    check('un fallo de red se explica dentro del diálogo y ofrece Reintentar', /conexi[oó]n/i.test(await dlg.getByRole('alert').innerText()) && (await dlg.getByRole('button', { name: 'Reintentar' }).count()) === 1);
    check('tras el fallo no queda nada publicado ni guardado como compartido', ownIssues(machine).length === 0 && (await page.getByTestId('share-status').innerText()).includes('Privada'));
    await dlg.getByRole('button', { name: 'Reintentar' }).click();
    await page.getByRole('dialog').waitFor({ state: 'detached', timeout: 15000 });
    check('al reintentar se comparte: la clase pasa a Compartida', (await page.getByTestId('share-status').innerText()).includes('Compartida'));
    check('aparece el aviso «Clase compartida en Comunidad.»', (await page.getByText('Clase compartida en Comunidad.').count()) >= 1);

    const files = machine.repoFiles(`${ME}/codice-skills`) ?? {};
    check('en GitHub quedan clase.json y CLASE.md en classes/<id>/', `classes/${OWN[0].id}/clase.json` in files && `classes/${OWN[0].id}/CLASE.md` in files, Object.keys(files).join(', '));
    check('CLASE.md es la explicación y clase.json no lleva autor ni cuerpo', files[`classes/${OWN[0].id}/CLASE.md`]?.includes('Un hook es un comando') && !/author|bodyMarkdown/.test(files[`classes/${OWN[0].id}/clase.json`] ?? ''));
    const mine = ownIssues(machine);
    check('hay exactamente un Issue [class] propio, con las etiquetas class y class:<id>', mine.length === 1 && mine[0].title === `[class] ${ME}/${OWN[0].id}` && mine[0].labels.some((l) => l.name === 'class') && mine[0].labels.some((l) => l.name === m.classLabel(OWN[0].id)), JSON.stringify(mine.map((i) => [i.title, i.labels])));
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('ai_skills_studio_lessons_v1') || '[]'));
    const sharedInfo = stored.find((l) => l.id === OWN[0].id)?.shared;
    check('la clase local guarda su estado compartido (repo, issue, commit y huella)', sharedInfo?.repo === `${ME}/codice-skills` && sharedInfo.issueNumber === mine[0].number && sharedInfo.sha === machine.head(`${ME}/codice-skills`) && /^[0-9a-f]{8}$/.test(sharedInfo.contentHash));
    const links = await page.getByRole('link', { name: 'Ver en GitHub' }).evaluateAll((a) => a.map((x) => x.getAttribute('href')));
    check('hay enlaces «Ver en GitHub» seguros', links.length >= 1 && links.every((h) => h.startsWith('https://github.com/')), links.join(' | '));
    await page.screenshot({ path: resolve(SHOTS_DIR, 'detalle-compartida-1440.png'), fullPage: true });

    console.log('\nEditar, cambios sin compartir y actualizar');
    const commitsBefore = machine.commitCount(`${ME}/codice-skills`);
    await page.getByRole('button', { name: 'Editar' }).click();
    await page.locator('#lesson-title-input').fill('Mis hooks de Claude Code (v2)');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await page.locator('#lesson-title').waitFor();
    check('tras editar, el estado es «Cambios sin compartir» y se ofrece actualizar', (await page.getByTestId('share-status').innerText()).includes('Cambios sin compartir') && (await page.getByRole('button', { name: 'Actualizar lo compartido' }).count()) === 1);
    check('editar no cambia nada en GitHub hasta actualizar', machine.commitCount(`${ME}/codice-skills`) === commitsBefore);
    await page.getByRole('button', { name: 'Actualizar lo compartido' }).click();
    await page.getByRole('dialog', { name: 'Actualizar lo compartido' }).getByRole('button', { name: 'Actualizar', exact: true }).click();
    await page.getByRole('dialog').waitFor({ state: 'detached', timeout: 15000 });
    const afterUpdate = await page.getByTestId('share-status').innerText();
    check('actualizar vuelve a dejarla Compartida', afterUpdate.includes('Compartida') && !afterUpdate.includes('Cambios'));
    check('actualizar hace un commit nuevo y NO duplica el Issue', machine.commitCount(`${ME}/codice-skills`) === commitsBefore + 1 && ownIssues(machine).length === 1 && ownIssues(machine)[0].title === `[class] ${ME}/${OWN[0].id}`);
    check('el Issue sigue abierto y su marcador apunta al commit nuevo', ownIssues(machine)[0].state === 'open' && ownIssues(machine)[0].body.includes(machine.head(`${ME}/codice-skills`)));

    console.log('\nTarjeta en Mis clases');
    await page.getByRole('button', { name: 'Clases', exact: true }).click();
    await page.locator('#lessons-heading').waitFor();
    check('la tarjeta compartida lleva «Compartida» y la otra clase sigue privada', (await page.getByTestId('card-share-status').count()) === 1 && (await page.getByTestId('card-share-status').innerText()).includes('Compartida'));
    await page.screenshot({ path: resolve(SHOTS_DIR, 'mis-clases-1440.png'), fullPage: true });

    console.log('\nComunidad con sesión');
    await page.getByRole('tab', { name: 'Comunidad' }).click();
    await cards(page).first().waitFor({ timeout: 15000 });
    check('la lista trae las 4 de otras personas + la propia compartida', (await cards(page).count()) === 5, String(await cards(page).count()));
    const titles = await cards(page).locator('h3').allInnerTexts();
    check('la suplantación (otra cuenta con el marcador de Ana), la clase retirada, el Issue sin marcador y el pull request NO aparecen', titles.filter((t) => t.includes('Hooks de Claude Code desde cero')).length === 1 && !titles.some((t) => /retir|sin marcador|pr$/i.test(t)), titles.join(' | '));
    check('la clase de Ana sale a nombre de @ana-dev, no del atacante', (await cards(page).filter({ hasText: 'Hooks de Claude Code desde cero' }).innerText()).includes('@ana-dev') && !(await page.locator('body').innerText()).includes('@atacante'));
    check('las tarjetas dicen «De @login» y la propia lleva «Tuya»', (await page.getByText('De @ana-dev').count()) >= 1 && (await page.getByText('Tuya', { exact: true }).count()) >= 1);
    check('las tarjetas de Comunidad no tienen Editar ni Borrar', (await page.getByRole('button', { name: /^(Editar|Borrar)/ }).count()) === 0);
    check('la lista no pidió el cuerpo de ninguna clase (solo metadatos)', machine.countCalls('/contents/classes/') === 0, `${machine.countCalls('/contents/classes/')} lecturas`);
    await page.screenshot({ path: resolve(SHOTS_DIR, 'comunidad-lista-1440.png'), fullPage: true });
    await page.getByLabel('Autor').selectOption('ana-dev');
    check('el filtro por autor deja solo las de @ana-dev (2)', (await cards(page).count()) === 2);
    await page.getByLabel('Autor').selectOption('');
    await page.getByLabel('Nivel').selectOption('Avanzado');
    check('el filtro por nivel deja las avanzadas (Worktrees y la de Luis)', (await cards(page).count()) === 2);
    await page.getByLabel('Nivel').selectOption('');
    await page.getByLabel('Buscar en la comunidad').fill('zzzz');
    check('una búsqueda sin resultados lo explica', (await page.getByText('Ninguna clase de la comunidad coincide con los filtros.').count()) === 1);
    await page.getByRole('button', { name: 'Quitar filtros' }).click();
    check('quitar filtros devuelve las 5', (await cards(page).count()) === 5);

    console.log('\nDetalle de una clase de Comunidad (solo lectura)');
    await cards(page).filter({ hasText: 'Hooks de Claude Code desde cero' }).getByRole('button', { name: 'Hooks de Claude Code desde cero' }).click();
    await page.locator('#lesson-title').waitFor();
    await page.getByTestId('community-readonly').waitFor({ timeout: 15000 });
    check('el detalle es de solo lectura: sin Editar, Borrar ni Compartir', (await page.getByRole('button', { name: /^(Editar|Borrar|Compartir)/ }).count()) === 0 && (await page.getByTestId('share-status').count()) === 0);
    check('dice «Compartida por @ana-dev» y el botón de vuelta es «Comunidad»', (await page.getByText('Compartida por').count()) === 1 && (await page.getByRole('button', { name: 'Comunidad', exact: true }).count()) === 1);
    check('se pidieron clase.json y CLASE.md al commit fijado, por la API de contenidos', machine.countCalls(`/contents/classes/${ANA_HOOKS.id}/clase.json`) >= 1 && machine.countCalls(`/contents/classes/${ANA_HOOKS.id}/CLASE.md`) >= 1);
    const explanation = page.locator('section[aria-label="Explicación"]');
    check('el cuerpo se pinta con SafeMarkdown (encabezado) y el HTML de Ana no se inyecta ni se ejecuta', (await explanation.getByRole('heading', { name: 'Qué es un hook' }).count()) === 1 && (await explanation.locator('img, script').count()) === 0 && (await page.evaluate(() => window.__pwned)) === undefined);
    check('se ve el reproductor de video y no se carga nada de YouTube sin pulsar play', (await page.locator('#lesson-videos').count()) === 1 && (await page.locator('iframe').count()) === 0);
    await page.getByRole('button', { name: 'Reproducir: Introducción' }).click();
    check('al pulsar play se crea el iframe de youtube-nocookie', ((await page.locator('iframe').getAttribute('src')) ?? '').startsWith('https://www.youtube-nocookie.com/embed/jNQXAC9IVRw'));
    const gh = await page.getByRole('link', { name: 'Ver en GitHub' }).getAttribute('href');
    check('«Ver en GitHub» apunta a la carpeta fijada al commit de Ana', gh === `https://github.com/ana-dev/codice-skills/tree/${anaSha}/classes/${ANA_HOOKS.id}`, String(gh));
    await page.screenshot({ path: resolve(SHOTS_DIR, 'comunidad-detalle-1440.png'), fullPage: true });
    await page.getByRole('button', { name: 'Comunidad', exact: true }).click();
    check('volver deja la pestaña Comunidad con la lista', (await page.getByRole('tab', { name: 'Comunidad' }).getAttribute('aria-selected')) === 'true' && (await cards(page).count()) === 5);

    await cards(page).filter({ hasText: 'Clase en tres partes' }).getByRole('button', { name: 'Clase en tres partes' }).click();
    await page.locator('#lesson-videos').waitFor({ timeout: 15000 });
    check('una clase de otra persona con tres partes muestra la lista de partes (video y lista de reproducción)', (await page.getByRole('list', { name: 'Partes del video' }).getByRole('button').count()) === 3);
    await page.getByRole('button', { name: 'Comunidad', exact: true }).click();

    console.log('\nClase que ya no está en GitHub');
    await cards(page).filter({ hasText: 'Esta se borrará de GitHub' }).getByRole('button', { name: 'Esta se borrará de GitHub' }).click();
    await page.getByText('Esta clase ya no está disponible.').waitFor({ timeout: 15000 });
    check('se muestra «Esta clase ya no está disponible.» con salida a la lista', (await page.getByRole('button', { name: 'Volver a la comunidad' }).count()) === 1);
    await page.screenshot({ path: resolve(SHOTS_DIR, 'comunidad-no-disponible-1440.png'), fullPage: true });
    await page.getByRole('button', { name: 'Volver a la comunidad' }).click();

    console.log(`\nError al cargar la lista`);
    const issuesList = `GET /repos/${TEST_CATALOG_REPO}/issues`;
    machine.failNext({ match: issuesList, kind: 'rate-limit', times: 3 });
    await page.getByRole('button', { name: 'Actualizar lista' }).click();
    await page.waitForTimeout(800);
    check('con el límite de peticiones se conserva la última lista (caché), sin romperse ni mostrar un error', (await cards(page).count()) === 5 && (await page.getByRole('alert').count()) === 0);
    machine.clearRules();
    machine.failNext({ match: issuesList, kind: 'server', times: 3 });
    await page.getByRole('button', { name: 'Actualizar lista' }).click();
    await page.getByRole('alert').first().waitFor({ timeout: 15000 });
    check('un error real de GitHub se explica y ofrece Reintentar', /GitHub respondió con un error/.test(await page.getByRole('alert').first().innerText()) && (await page.getByRole('button', { name: 'Reintentar' }).count()) === 1, await page.getByRole('alert').first().innerText());
    await page.screenshot({ path: resolve(SHOTS_DIR, 'comunidad-error-1440.png'), fullPage: true });
    machine.clearRules();
    await page.getByRole('button', { name: 'Reintentar' }).click();
    await cards(page).first().waitFor({ timeout: 15000 });
    check('al reintentar vuelve la lista', (await cards(page).count()) === 5);

    console.log('\nRetirar');
    await page.getByRole('tab', { name: 'Mis clases' }).click();
    await cards(page).filter({ hasText: 'Mis hooks de Claude Code (v2)' }).getByRole('button', { name: 'Mis hooks de Claude Code (v2)' }).click();
    await page.locator('#lesson-title').waitFor();
    await page.getByRole('button', { name: 'Retirar de Comunidad' }).click();
    const out = page.getByRole('dialog', { name: 'Retirar de Comunidad' });
    await out.waitFor();
    const outText = await out.innerText();
    check('el diálogo de retirar explica el borrado y que la clase local no se toca', /no se toca/i.test(outText) && !/público de verdad/i.test(outText));
    await out.getByRole('button', { name: 'Sí, retirar' }).click();
    await page.getByRole('dialog').waitFor({ state: 'detached', timeout: 15000 });
    check('tras retirar, la clase vuelve a Privada y sigue en Mis clases', (await page.getByTestId('share-status').innerText()).includes('Privada') && (await page.locator('#lesson-title').innerText()).includes('(v2)'));
    const filesAfter = machine.repoFiles(`${ME}/codice-skills`) ?? {};
    check('en GitHub se borró classes/<id>/ y el Issue quedó cerrado', !Object.keys(filesAfter).some((p) => p.startsWith(`classes/${OWN[0].id}/`)) && ownIssues(machine)[0].state === 'closed', Object.keys(filesAfter).join(', '));
    check('el estado compartido se quitó de la clase local', !(await page.evaluate((id) => JSON.parse(localStorage.getItem('ai_skills_studio_lessons_v1') || '[]').find((l) => l.id === id)?.shared, OWN[0].id)));
    await page.getByRole('button', { name: 'Clases', exact: true }).click();
    await page.getByRole('tab', { name: 'Comunidad' }).click();
    await page.getByRole('button', { name: 'Actualizar lista' }).click();
    await page.waitForTimeout(600);
    check('la clase retirada ya no sale en Comunidad (4)', (await cards(page).count()) === 4 && (await page.getByText('Tuya', { exact: true }).count()) === 0);

    console.log('\nRecargar pierde la sesión');
    machine.resetCalls();
    await openCodice(page, origin);
    await page.getByRole('tab', { name: 'Comunidad' }).click();
    await page.locator('[data-testid="community-signed-out"]').waitFor();
    check('al recargar, Comunidad vuelve a pedir sesión y no hace peticiones de clases', classCalls(machine) === 0 && (await cards(page).count()) === 0);

    console.log('\nResponsive');
    await page.getByRole('tab', { name: 'Mis clases' }).click();
    await login(page);
    await page.getByRole('tab', { name: 'Comunidad' }).click();
    await cards(page).first().waitFor({ timeout: 15000 });
    for (const [width, height] of [[1440, 900], [1024, 768], [768, 1024], [390, 844]]) {
      await page.setViewportSize({ width, height });
      await page.waitForTimeout(250);
      check(`sin desborde horizontal a ${width} px (lista de Comunidad)`, await noOverflow(page));
      await cards(page).filter({ hasText: 'Hooks de Claude Code desde cero' }).getByRole('button', { name: 'Hooks de Claude Code desde cero' }).click();
      await page.getByTestId('community-readonly').waitFor({ timeout: 15000 });
      check(`sin desborde horizontal a ${width} px (detalle de Comunidad)`, await noOverflow(page));
      await page.screenshot({ path: resolve(SHOTS_DIR, `comunidad-detalle-${width}.png`), fullPage: true });
      await page.getByRole('button', { name: 'Comunidad', exact: true }).click();
      await cards(page).first().waitFor();
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('tab', { name: 'Mis clases' }).click();
    await cards(page).filter({ hasText: 'Mis hooks de Claude Code (v2)' }).getByRole('button', { name: 'Mis hooks de Claude Code (v2)' }).click();
    await page.getByRole('button', { name: 'Compartir en Comunidad', exact: true }).click();
    const dlgMobile = page.getByRole('dialog', { name: 'Compartir esta clase' });
    await dlgMobile.waitFor();
    check('el diálogo de compartir cabe en 390 px', await page.evaluate(() => { const r = document.querySelector('dialog')?.getBoundingClientRect(); return !!r && r.left >= 0 && r.right <= window.innerWidth; }));
    await page.screenshot({ path: resolve(SHOTS_DIR, 'dialogo-compartir-390.png'), fullPage: true });
    await dlgMobile.getByRole('button', { name: 'Cancelar' }).click();

    console.log('\nLímites de la prueba');
    check('ninguna petición salió a YouTube real (solo youtube-nocookie y miniaturas, ambos simulados)', stray.length === 0 && ytRequests.length > 0, stray.slice(0, 3).join(' | '));
    const real = errors.filter((e) => !/Failed to load resource|net::ERR|oauth\.example|ERR_FAILED|Failed to fetch/i.test(e));
    check('sin errores de consola inesperados', real.length === 0, real.slice(0, 3).join(' | '));
  } finally {
    await browser.close();
    await server.close();
    rmSync(OUT_DIR, { recursive: true, force: true });
    rmSync(helperDir, { recursive: true, force: true });
  }

  if (failures.length > 0) {
    console.error(`\n${failures.length} comprobación(es) fallaron:\n - ${failures.join('\n - ')}`);
    process.exit(1);
  }
  console.log('\nClases compartidas: todo en verde.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
