// Pruebas del servicio de GitHub para clases compartidas (C2), sin navegador y sin puertos:
// el servicio real contra la máquina de estado de `scripts/lib/fake-github-classes.mjs`.
// Uso: node scripts/test-lesson-sharing-service.mjs
import { build } from 'esbuild';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { createFakeFetch, createFakeGithubClasses } from './lib/fake-github-classes.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dir = mkdtempSync(join(tmpdir(), 'codice-sharing-service-'));
const entry = join(dir, 'entry.ts');
const out = join(dir, 'bundle.mjs');
const src = (f) => JSON.stringify(join(ROOT, 'src/services', f).replace(/\\/g, '/'));
writeFileSync(
  entry,
  [`export * from ${src('githubCatalogService.ts')};`, `export * from ${src('lessonSharing.ts')};`, `export * from ${src('lessonsStore.ts')};`].join('\n') + '\n'
);
await build({
  entryPoints: [entry],
  outfile: out,
  bundle: true,
  format: 'esm',
  platform: 'node',
  logLevel: 'error',
  define: { 'import.meta.env': '{}' },
});

const BUNDLE = pathToFileURL(out).href;
const m = await import(BUNDLE);

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

const NOW = new Date('2026-11-15T10:00:00.000Z');
const VID = 'dQw4w9WgXcQ';
const TOKENS = { tok_alice: 'alice', tok_bob: 'bob', tok_carol: 'carol', tok_mallory: 'mallory' };
const CATALOG = 'test/catalog';

let instance = 0;
/**
 * Un GitHub simulado nuevo y una instancia NUEVA del servicio (la caché del módulo no se comparte
 * entre pruebas). `as(login)` devuelve un servicio con la sesión de esa persona sobre el mismo GitHub.
 */
async function world(machineOptions = {}, serviceOptions = {}) {
  const machine = createFakeGithubClasses({ catalogRepo: CATALOG, tokens: TOKENS, ...machineOptions });
  const urls = [];
  const fake = createFakeFetch(machine);
  globalThis.fetch = async (input, init) => {
    urls.push(typeof input === 'string' ? input : input.url ?? String(input));
    return fake(input, init);
  };
  const mod = await import(`${BUNDLE}?i=${++instance}`);
  const tokenOf = (login) => Object.entries(TOKENS).find(([, l]) => l === login)?.[0] ?? 'ghu_test_token_0123456789';
  const as = (login, extra = {}) =>
    mod.createGithubCatalogService({
      catalogRepo: CATALOG,
      getSession: () => (login ? { login, token: tokenOf(login) } : null),
      ...serviceOptions,
      ...extra,
    });
  return { machine, urls, mod, as, alice: as('alice'), bob: as('bob'), carol: as('carol'), anon: as(null) };
}

const draft = (over = {}) => ({
  title: '¿Qué es un hook?',
  summary: 'Qué es un hook y cómo lo usamos en el equipo.',
  level: 'Principiante',
  tags: ['hooks'],
  bodyMarkdown: '# Hooks\n\nUn hook es un comando que se ejecuta ante un evento.',
  skillIds: ['acme/tools/demo'],
  componentIds: ['accordion'],
  videos: [{ id: 'v1', kind: 'video', youtubeId: VID, title: 'Intro' }],
  ...over,
});
const lessonBy = (login, over = {}, when = NOW) => m.createLesson(draft(over), { login }, [], when);
const failsWith = async (promise, code, message) => {
  await assert.rejects(promise, (err) => {
    assert.equal(err.name, 'CatalogError', `esperaba CatalogError y llegó ${err?.name}: ${err?.message}`);
    assert.equal(err.code, code, `código ${err.code}: ${err.message}`);
    if (message) assert.match(err.message, message);
    return true;
  });
};
const markerOf = (issue) => m.readClassMarker(issue.body);

/* ------------------------------------------------------------------ */
/* Compartir                                                           */
/* ------------------------------------------------------------------ */

test('compartir crea el repo, hace un único commit con los dos archivos y abre el Issue con marcador y etiquetas', async () => {
  const w = await world();
  const lesson = lessonBy('alice');
  const share = await w.alice.shareLesson(lesson);

  const files = w.machine.repoFiles('alice/codice-skills');
  assert.ok(files, 'se creó alice/codice-skills');
  const expected = m.buildSharedFiles(lesson);
  assert.equal(files[expected[0].path], expected[0].content);
  assert.equal(files[expected[1].path], expected[1].content);
  assert.equal(w.machine.commitCount('alice/codice-skills'), 2, 'commit inicial + un único commit de la clase');
  assert.equal(w.machine.countCalls('POST /repos/alice/codice-skills/git/commits'), 1);

  const [issue] = w.machine.issues;
  assert.equal(w.machine.issues.length, 1);
  assert.equal(issue.title, `[class] alice/${lesson.id}`);
  assert.deepEqual(issue.labels.map((l) => l.name), ['class', `class:${lesson.id}`]);
  assert.equal(issue.user.login, 'alice');
  assert.equal(markerOf(issue).data.sha, w.machine.head('alice/codice-skills'));

  assert.deepEqual(share, {
    repo: 'alice/codice-skills',
    slug: lesson.id,
    issueNumber: issue.number,
    sha: w.machine.head('alice/codice-skills'),
    sharedAt: share.sharedAt,
    contentHash: m.contentHash(lesson),
  });
  assert.ok(!Number.isNaN(Date.parse(share.sharedAt)));
  assert.ok(m.toCommunityLesson(issue), 'el Issue que se publica lo acepta el lector de Comunidad');
});

test('el estado devuelto es válido para el almacén: sanitizeLesson lo conserva y shareStatus pasa a shared', async () => {
  const w = await world();
  const lesson = lessonBy('alice');
  const share = await w.alice.shareLesson(lesson);
  const saved = m.sanitizeLesson({ ...lesson, shared: share });
  assert.deepEqual(saved.shared, share);
  assert.equal(m.shareStatus(saved), 'shared');
});

test('si el repo ya existe se reutiliza: no se crea otro y los demás archivos se conservan', async () => {
  const w = await world();
  w.machine.seedRepo('alice', 'codice-skills', { 'README.md': '# mío\n', 'skills/otra/SKILL.md': 'x' });
  await w.alice.shareLesson(lessonBy('alice'));
  assert.equal(w.machine.countCalls('POST /user/repos'), 0);
  const files = w.machine.repoFiles('alice/codice-skills');
  assert.equal(files['README.md'], '# mío\n');
  assert.equal(files['skills/otra/SKILL.md'], 'x');
});

test('un repo codice-skills privado se rechaza con un mensaje claro', async () => {
  const w = await world();
  w.machine.seedRepo('alice', 'codice-skills', { 'README.md': 'x' }, { private: true });
  await failsWith(w.alice.shareLesson(lessonBy('alice')), 'private_repo', /privado/);
  assert.equal(w.machine.issues.length, 0);
});

test('idempotente: compartir dos veces deja un solo Issue (mismo número) y el marcador al último commit', async () => {
  const w = await world();
  const lesson = lessonBy('alice');
  const first = await w.alice.shareLesson(lesson);
  const second = await w.alice.shareLesson(lesson);
  assert.equal(w.machine.issues.length, 1);
  assert.equal(second.issueNumber, first.issueNumber);
  assert.notEqual(second.sha, first.sha);
  assert.equal(markerOf(w.machine.issues[0]).data.sha, second.sha);
  assert.equal(w.machine.countCalls('POST /repos/test/catalog/issues'), 1);
});

test('idempotente aunque el workflow aún no etiquete las clases: el Issue se encuentra por autor y marcador', async () => {
  const w = await world({ labelerKinds: ['skill', 'result'] });
  const lesson = lessonBy('alice');
  const first = await w.alice.shareLesson(lesson);
  assert.deepEqual(w.machine.issues[0].labels, [], 'sin etiquetas: el workflow no reconoce class');
  const second = await w.alice.shareLesson(lesson);
  assert.equal(w.machine.issues.length, 1);
  assert.equal(second.issueNumber, first.issueNumber);
});

test('compartir de nuevo una clase retirada reabre su Issue en lugar de crear otro', async () => {
  const w = await world();
  const lesson = lessonBy('alice');
  const first = await w.alice.shareLesson(lesson);
  await w.alice.unshareLesson(first);
  assert.equal(w.machine.issues[0].state, 'closed');
  const again = await w.alice.shareLesson(lesson);
  assert.equal(again.issueNumber, first.issueNumber);
  assert.equal(w.machine.issues.length, 1);
  assert.equal(w.machine.issues[0].state, 'open');
  assert.ok(w.machine.repoFiles('alice/codice-skills')[`classes/${lesson.id}/CLASE.md`]);
});

test('no se «adopta» el Issue de otra persona con el mismo id: se crea uno propio', async () => {
  const w = await world();
  const lesson = lessonBy('alice');
  const theirs = lessonBy('mallory', { title: 'Misma clase de otra' });
  w.machine.seedIssue({
    login: 'mallory',
    title: `[class] mallory/${lesson.id}`,
    body: m.buildClassMarker({ ...theirs, id: lesson.id }, { repo: 'mallory/codice-skills', sha: 'a'.repeat(40) }),
    labels: ['class'],
  });
  const share = await w.alice.shareLesson(lesson);
  assert.equal(w.machine.issues.length, 2);
  assert.notEqual(share.issueNumber, w.machine.issues[0].number);
  assert.equal(w.machine.issues.find((i) => i.number === share.issueNumber).user.login, 'alice');
  assert.equal(w.machine.issues[0].state, 'open', 'el de la otra persona no se toca');
});

test('un título con --> o HTML no rompe el Issue: el marcador se lee intacto', async () => {
  const w = await world();
  const lesson = lessonBy('alice', { title: 'Truco --> <script>alert(1)</script> <!--' });
  await w.alice.shareLesson(lesson);
  const issue = w.machine.issues[0];
  assert.equal(markerOf(issue).data.title, lesson.title);
  assert.equal(issue.body.includes('<script>'), false);
  assert.ok(m.toCommunityLesson(issue));
});

test('compartir solo la clase propia: la de otra autora es forbidden y no hay ninguna petición', async () => {
  const w = await world();
  await failsWith(w.alice.shareLesson(lessonBy('bob')), 'forbidden', /propias clases/);
  assert.equal(w.machine.calls.length, 0);
});

test('una clase inválida (sin título, id con ruta, sin cuerpo) es invalid_input y no hay peticiones', async () => {
  const w = await world();
  const ok = lessonBy('alice');
  for (const bad of [{ ...ok, title: '   ' }, { ...ok, id: '../x' }, { ...ok, bodyMarkdown: '' }, { ...ok, level: 'Dios' }, null, 'texto']) {
    await failsWith(w.alice.shareLesson(bad), 'invalid_input');
  }
  assert.equal(w.machine.calls.length, 0);
});

/* ------------------------------------------------------------------ */
/* Sesión y configuración                                              */
/* ------------------------------------------------------------------ */

test('sin sesión todos los métodos piden entrar con GitHub (auth_required) sin tocar la red', async () => {
  const w = await world();
  const lesson = lessonBy('alice');
  const shared = { ...lesson, shared: { repo: 'alice/codice-skills', slug: lesson.id, issueNumber: 1, sha: 'a'.repeat(40), sharedAt: NOW.toISOString(), contentHash: m.contentHash(lesson) } };
  await failsWith(w.anon.shareLesson(lesson), 'auth_required');
  await failsWith(w.anon.updateSharedLesson(shared), 'auth_required');
  await failsWith(w.anon.unshareLesson(shared.shared), 'auth_required');
  await failsWith(w.anon.listCommunityLessons(), 'auth_required');
  await failsWith(w.anon.getCommunityLesson({ repo: 'alice/codice-skills', id: lesson.id, sha: 'a'.repeat(40), author: { login: 'alice' } }), 'auth_required');
  assert.equal(w.machine.calls.length, 0);
});

test('sin catálogo configurado todos los métodos que lo necesitan dan not_configured', async () => {
  const w = await world();
  const noCatalog = w.as('alice', { catalogRepo: '' });
  const lesson = lessonBy('alice');
  await failsWith(noCatalog.shareLesson(lesson), 'not_configured');
  await failsWith(noCatalog.listCommunityLessons(), 'not_configured');
  await failsWith(noCatalog.unshareLesson({ repo: 'alice/codice-skills', slug: lesson.id, issueNumber: 1, sha: 'a'.repeat(40), sharedAt: NOW.toISOString(), contentHash: m.contentHash(lesson) }), 'not_configured');
  assert.equal(w.machine.calls.length, 0);
});

test('nada sale de api.github.com (la CSP solo permite ese origen)', async () => {
  const w = await world();
  const lesson = lessonBy('alice');
  const share = await w.alice.shareLesson(lesson);
  const [community] = await w.bob.listCommunityLessons();
  await w.bob.getCommunityLesson(community);
  await w.alice.unshareLesson(share);
  assert.ok(w.urls.length > 10);
  assert.ok(w.urls.every((u) => u.startsWith('https://api.github.com/')), w.urls.find((u) => !u.startsWith('https://api.github.com/')));
});

/* ------------------------------------------------------------------ */
/* Actualizar                                                          */
/* ------------------------------------------------------------------ */

test('actualizar publica los cambios en un commit nuevo, mantiene el Issue y devuelve el estado nuevo', async () => {
  const w = await world();
  const lesson = lessonBy('alice');
  const first = await w.alice.shareLesson(lesson);
  const edited = m.updateLesson({ ...lesson, shared: first }, draft({ title: 'Hooks explicados', bodyMarkdown: '# Nuevo\n\nContenido renovado de la clase.' }), new Date('2026-11-16T10:00:00.000Z'));
  assert.equal(m.shareStatus(edited), 'dirty');

  const next = await w.alice.updateSharedLesson(edited);
  assert.equal(next.issueNumber, first.issueNumber);
  assert.notEqual(next.sha, first.sha);
  assert.equal(next.contentHash, m.contentHash(edited));
  assert.equal(next.slug, lesson.id);
  assert.equal(w.machine.issues.length, 1);
  assert.equal(w.machine.commitCount('alice/codice-skills'), 3);
  assert.match(w.machine.repoFiles('alice/codice-skills')[`classes/${lesson.id}/CLASE.md`], /Contenido renovado/);
  const marker = markerOf(w.machine.issues[0]);
  assert.equal(marker.data.sha, next.sha);
  assert.equal(marker.data.title, 'Hooks explicados');
  assert.equal(m.shareStatus({ ...edited, shared: next }), 'shared');
});

test('actualizar exige que la clase esté compartida y que el estado corresponda a ella', async () => {
  const w = await world();
  const lesson = lessonBy('alice');
  const share = await w.alice.shareLesson(lesson);
  await failsWith(w.alice.updateSharedLesson(lesson), 'invalid_input', /Compartir/);
  await failsWith(w.alice.updateSharedLesson({ ...lesson, shared: { ...share, slug: 'otra-clase' } }), 'invalid_input');
  await failsWith(w.alice.updateSharedLesson(null), 'invalid_input');
});

test('actualizar con el Issue borrado crea uno nuevo; con el repo borrado lo recrea', async () => {
  const w = await world();
  const lesson = lessonBy('alice');
  const first = await w.alice.shareLesson(lesson);
  w.machine.deleteIssue(first.issueNumber);
  const second = await w.alice.updateSharedLesson({ ...lesson, shared: first });
  assert.notEqual(second.issueNumber, first.issueNumber);
  assert.equal(w.machine.issues.length, 1);

  w.machine.deleteRepo('alice/codice-skills');
  const third = await w.alice.updateSharedLesson({ ...lesson, shared: second });
  assert.ok(w.machine.repoFiles('alice/codice-skills')[`classes/${lesson.id}/clase.json`]);
  assert.equal(third.issueNumber, second.issueNumber);
});

test('actualizar un Issue ajeno (estado manipulado) es forbidden y no se modifica', async () => {
  const w = await world();
  const lesson = lessonBy('alice');
  const theirs = w.machine.seedIssue({ login: 'mallory', title: 'otra', body: 'x', labels: ['class'] });
  const share = await w.alice.shareLesson(lesson);
  await failsWith(w.alice.updateSharedLesson({ ...lesson, shared: { ...share, issueNumber: theirs } }), 'forbidden');
  assert.equal(w.machine.issues.find((i) => i.number === theirs).body, 'x');
});

/* ------------------------------------------------------------------ */
/* Retirar                                                             */
/* ------------------------------------------------------------------ */

test('retirar borra la carpeta de la clase, cierra el Issue y deja el resto del repo', async () => {
  const w = await world();
  w.machine.seedRepo('alice', 'codice-skills', { 'README.md': '# mío\n' });
  const lesson = lessonBy('alice');
  const share = await w.alice.shareLesson(lesson);
  await w.alice.unshareLesson(share);
  const files = w.machine.repoFiles('alice/codice-skills');
  assert.deepEqual(Object.keys(files), ['README.md']);
  assert.equal(w.machine.issues[0].state, 'closed');
  assert.deepEqual(await w.bob.listCommunityLessons(), []);
});

test('retirar dos veces o algo que ya no existe termina sin error y sin commits de más', async () => {
  const w = await world();
  const lesson = lessonBy('alice');
  const share = await w.alice.shareLesson(lesson);
  await w.alice.unshareLesson(share);
  const commits = w.machine.commitCount('alice/codice-skills');
  await w.alice.unshareLesson(share);
  assert.equal(w.machine.commitCount('alice/codice-skills'), commits, 'no hay nada que borrar: no se crea commit');

  w.machine.deleteRepo('alice/codice-skills');
  await w.alice.unshareLesson(share);

  const w2 = await world();
  const s2 = await w2.alice.shareLesson(lesson);
  w2.machine.deleteIssue(s2.issueNumber);
  await w2.alice.unshareLesson(s2);
  assert.equal(w2.machine.repoFiles('alice/codice-skills')[`classes/${lesson.id}/clase.json`], undefined);
});

test('retirar valida el estado: repo ajeno es forbidden; id o número inválidos son invalid_input', async () => {
  const w = await world();
  const lesson = lessonBy('alice');
  const share = await w.alice.shareLesson(lesson);
  await failsWith(w.alice.unshareLesson({ ...share, repo: 'bob/codice-skills' }), 'forbidden');
  await failsWith(w.alice.unshareLesson({ ...share, repo: 'alice/otro-repo' }), 'forbidden');
  await failsWith(w.alice.unshareLesson({ ...share, slug: '../x' }), 'invalid_input');
  await failsWith(w.alice.unshareLesson({ ...share, issueNumber: 0 }), 'invalid_input');
  await failsWith(w.alice.unshareLesson({ ...share, issueNumber: 1.5 }), 'invalid_input');
  await failsWith(w.alice.unshareLesson(null), 'invalid_input');
  assert.equal(w.machine.issues[0].state, 'open');
});

test('retirar con el número de Issue de otra persona es forbidden: no se cierra el suyo', async () => {
  const w = await world();
  const lesson = lessonBy('alice');
  const share = await w.alice.shareLesson(lesson);
  const theirs = w.machine.seedIssue({ login: 'mallory', title: 'otra', body: 'x', labels: ['class'] });
  await failsWith(w.alice.unshareLesson({ ...share, issueNumber: theirs }), 'forbidden');
  assert.equal(w.machine.issues.find((i) => i.number === theirs).state, 'open');
});

/* ------------------------------------------------------------------ */
/* Comunidad: listar                                                   */
/* ------------------------------------------------------------------ */

test('listar reúne las clases de varias personas, sin cuerpo, de la más reciente a la más antigua', async () => {
  const w = await world();
  const a = lessonBy('alice', { title: 'Clase de Alice' }, new Date('2026-11-10T10:00:00.000Z'));
  const b = lessonBy('bob', { title: 'Clase de Bob' }, new Date('2026-11-12T10:00:00.000Z'));
  await w.alice.shareLesson(a);
  await w.bob.shareLesson(b);
  const list = await w.carol.listCommunityLessons();
  assert.deepEqual(list.map((l) => l.title), ['Clase de Bob', 'Clase de Alice']);
  assert.deepEqual(list.map((l) => l.author.login), ['bob', 'alice']);
  assert.ok(list.every((l) => !('bodyMarkdown' in l)));
  assert.equal(list[0].repo, 'bob/codice-skills');
  assert.equal(list[0].sha, w.machine.head('bob/codice-skills'));
  assert.ok(list[0].issueUrl.startsWith('https://github.com/test/catalog/issues/'));
  assert.equal(list[0].repoUrl, 'https://github.com/bob/codice-skills');
});

test('listar incluye también la clase propia y deja fuera las retiradas', async () => {
  const w = await world();
  const s1 = await w.alice.shareLesson(lessonBy('alice', { title: 'Una' }));
  await w.alice.shareLesson(lessonBy('alice', { title: 'Dos' }));
  assert.equal((await w.alice.listCommunityLessons()).length, 2);
  await w.alice.unshareLesson(s1);
  assert.deepEqual((await w.alice.listCommunityLessons()).map((l) => l.title), ['Dos']);
});

test('listar no usa la caché: lo que otra persona comparte después aparece al volver a pedir la lista', async () => {
  const w = await world();
  assert.deepEqual(await w.carol.listCommunityLessons(), []);
  const before = w.machine.countCalls('labels=class');
  // Otra instancia (otra persona, otro navegador): carol no hizo ninguna escritura que fuerce releer.
  await w.alice.shareLesson(lessonBy('alice', { title: 'Compartida después' }));
  const second = await w.carol.listCommunityLessons();
  assert.deepEqual(second.map((l) => l.title), ['Compartida después']);
  assert.ok(w.machine.countCalls('labels=class') > before, 'la segunda lista tuvo que ir a GitHub, no a la caché');
});

test('listar ignora Issues sin marcador, de otro tipo, pull requests y marcadores rotos', async () => {
  const w = await world();
  await w.alice.shareLesson(lessonBy('alice', { title: 'Buena' }));
  w.machine.seedIssue({ login: 'bob', title: '[class] sin marcador', body: 'hola', labels: ['class'] });
  w.machine.seedIssue({ login: 'bob', title: '[class] roto', body: '<!-- codice:v1 {no json} -->', labels: ['class'] });
  w.machine.seedIssue({ login: 'bob', title: '[skill] x', body: '<!-- codice:v1 {"kind":"skill","labels":["class"],"data":{}} -->', labels: ['class'] });
  w.machine.seedIssue({ login: 'bob', title: '[class] pr', body: 'x', labels: ['class'], pull_request: true });
  const list = await w.carol.listCommunityLessons();
  assert.deepEqual(list.map((l) => l.title), ['Buena']);
});

test('listar descarta la suplantación: un Issue de mallory que apunta al repo de alice no sale', async () => {
  const w = await world();
  const real = lessonBy('alice', { title: 'Real de Alice' });
  await w.alice.shareLesson(real);
  const fake = lessonBy('alice', { title: 'Falsa a nombre de Alice' });
  w.machine.seedIssue({
    login: 'mallory',
    title: `[class] alice/${fake.id}`,
    body: m.buildClassMarker({ ...fake, id: 'falsa' }, { repo: 'alice/codice-skills', sha: 'b'.repeat(40) }),
    labels: ['class'],
  });
  const list = await w.carol.listCommunityLessons();
  assert.deepEqual(list.map((l) => l.title), ['Real de Alice']);
});

test('listar se queda con el Issue más reciente si hay duplicados del mismo id', async () => {
  const w = await world();
  const lesson = lessonBy('alice');
  const sha = 'c'.repeat(40);
  const body = (title) => m.buildClassMarker({ ...lesson, title }, { repo: 'alice/codice-skills', sha });
  w.machine.seedIssue({ login: 'alice', title: 'viejo', body: body('Versión vieja'), labels: ['class'], createdAt: '2026-11-01T10:00:00.000Z' });
  w.machine.seedIssue({ login: 'alice', title: 'nuevo', body: body('Versión nueva'), labels: ['class'], createdAt: '2026-11-02T10:00:00.000Z' });
  const list = await w.carol.listCommunityLessons();
  assert.equal(list.length, 1);
  assert.equal(list[0].title, 'Versión nueva');
});

test('mientras el workflow no reconozca class los Issues no tienen etiqueta y Comunidad sale vacía (depende de C4)', async () => {
  const w = await world({ labelerKinds: ['skill', 'result'] });
  await w.alice.shareLesson(lessonBy('alice'));
  assert.equal(w.machine.issues.length, 1);
  assert.deepEqual(await w.carol.listCommunityLessons(), []);
});

test('paginación: hasta 100 por página y como mucho 3 páginas', async () => {
  const seed = (machine, count) => {
    for (let i = 0; i < count; i++) {
      const login = `user${i}`;
      const lesson = m.createLesson(draft({ title: `Clase número ${i}` }), { login }, [], new Date(NOW.getTime() + i * 1000));
      machine.seedIssue({
        login,
        title: `[class] ${login}/${lesson.id}`,
        body: m.buildClassMarker(lesson, { repo: `${login}/codice-skills`, sha: 'd'.repeat(40) }),
        labels: ['class'],
        createdAt: new Date(NOW.getTime() + i * 1000).toISOString(),
      });
    }
  };
  const w = await world();
  seed(w.machine, 150);
  assert.equal((await w.carol.listCommunityLessons()).length, 150);
  assert.equal(w.machine.countCalls(/GET \/repos\/test\/catalog\/issues\?/), 2);

  const big = await world();
  seed(big.machine, 320);
  assert.equal((await big.carol.listCommunityLessons()).length, 300);
  assert.equal(big.machine.countCalls(/GET \/repos\/test\/catalog\/issues\?/), 3);
});

/* ------------------------------------------------------------------ */
/* Comunidad: abrir una clase                                          */
/* ------------------------------------------------------------------ */

test('abrir una clase carga el cuerpo desde el commit fijado (contenido, no rama)', async () => {
  const w = await world();
  const lesson = lessonBy('alice', { bodyMarkdown: '# Versión uno\n\nPrimer contenido de la clase compartida.' });
  const first = await w.alice.shareLesson(lesson);
  const [listed] = await w.carol.listCommunityLessons();
  assert.equal(listed.sha, first.sha);

  const edited = m.updateLesson({ ...lesson, shared: first }, draft({ bodyMarkdown: '# Versión dos\n\nSegundo contenido, ya cambiado.' }), new Date('2026-11-16T10:00:00.000Z'));
  await w.alice.updateSharedLesson(edited);

  const full = await w.carol.getCommunityLesson(listed);
  assert.match(full.bodyMarkdown, /Versión uno/, 'sigue viendo lo que se compartió en ese commit');
  assert.equal(full.author.login, 'alice');
  assert.equal(full.sha, first.sha);
  assert.deepEqual(full.videos, lesson.videos);
  assert.match(full.contentHash, /^[0-9a-f]{8}$/);
});

test('abrir una clase pide los archivos por la API de contenidos con Accept raw', async () => {
  const w = await world();
  await w.alice.shareLesson(lessonBy('alice'));
  const [listed] = await w.carol.listCommunityLessons();
  w.machine.resetCalls();
  await w.carol.getCommunityLesson(listed);
  assert.equal(w.machine.countCalls(/GET \/repos\/alice\/codice-skills\/contents\/classes\/.+\/clase\.json\?ref=[0-9a-f]{40}/), 1);
  assert.equal(w.machine.countCalls(/GET \/repos\/alice\/codice-skills\/contents\/classes\/.+\/CLASE\.md\?ref=[0-9a-f]{40}/), 1);
});

test('contenido hostil: el HTML del cuerpo se conserva como texto y los videos manipulados se descartan', async () => {
  const w = await world();
  const lesson = lessonBy('alice');
  const sha = w.machine.seedRepo('alice', 'codice-skills', {
    [`classes/${lesson.id}/clase.json`]: JSON.stringify({
      format: 'codice-class',
      version: 1,
      title: lesson.title,
      summary: lesson.summary,
      level: lesson.level,
      tags: [],
      skillIds: [],
      componentIds: [],
      videos: [
        { id: 'v1', kind: 'video', youtubeId: 'javascript:alert(1)', title: 'x' },
        { id: 'v2', kind: 'video', youtubeId: VID, title: 'bien', url: 'https://evil.test' },
      ],
      author: { login: 'victima' },
    }),
    [`classes/${lesson.id}/CLASE.md`]: '## Hola\n\n<img src=x onerror=alert(1)>\u0000',
  });
  w.machine.seedIssue({ login: 'alice', title: 'x', body: m.buildClassMarker(lesson, { repo: 'alice/codice-skills', sha }), labels: ['class'] });
  const [listed] = await w.carol.listCommunityLessons();
  const full = await w.carol.getCommunityLesson(listed);
  assert.ok(full.bodyMarkdown.includes('<img src=x onerror=alert(1)>'));
  assert.equal(full.bodyMarkdown.includes('\u0000'), false);
  assert.deepEqual(full.videos.map((v) => v.youtubeId), [VID]);
  assert.deepEqual(Object.keys(full.videos[0]).sort(), ['id', 'kind', 'title', 'youtubeId']);
  assert.equal(full.author.login, 'alice');
});

test('abrir una clase cuyos archivos faltan, están rotos, son de otro formato o enormes es not_found', async () => {
  const lesson = lessonBy('alice');
  const goodJson = m.buildSharedFiles(lesson)[0].content;
  const cases = {
    'sin archivos': {},
    'sin CLASE.md': { [`classes/${lesson.id}/clase.json`]: goodJson },
    'JSON roto': { [`classes/${lesson.id}/clase.json`]: 'no es json', [`classes/${lesson.id}/CLASE.md`]: '# hola' },
    'formato ajeno': { [`classes/${lesson.id}/clase.json`]: '{"format":"otro"}', [`classes/${lesson.id}/CLASE.md`]: '# hola' },
    'cuerpo vacío': { [`classes/${lesson.id}/clase.json`]: goodJson, [`classes/${lesson.id}/CLASE.md`]: '  \n' },
    'cuerpo enorme': { [`classes/${lesson.id}/clase.json`]: goodJson, [`classes/${lesson.id}/CLASE.md`]: 'x'.repeat(100_001) },
    'json enorme': { [`classes/${lesson.id}/clase.json`]: `${goodJson}${' '.repeat(30_001)}`, [`classes/${lesson.id}/CLASE.md`]: '# hola' },
  };
  for (const [name, files] of Object.entries(cases)) {
    const w = await world();
    const sha = w.machine.seedRepo('alice', 'codice-skills', { 'README.md': 'x', ...files });
    w.machine.seedIssue({ login: 'alice', title: 'x', body: m.buildClassMarker(lesson, { repo: 'alice/codice-skills', sha }), labels: ['class'] });
    const [listed] = await w.carol.listCommunityLessons();
    await failsWith(w.carol.getCommunityLesson(listed), 'not_found', /ya no está disponible/).catch((err) => {
      throw new Error(`${name}: ${err.message}`);
    });
  }
});

test('abrir una clase cuyo repo se borró es not_found', async () => {
  const w = await world();
  await w.alice.shareLesson(lessonBy('alice'));
  const [listed] = await w.carol.listCommunityLessons();
  w.machine.deleteRepo('alice/codice-skills');
  await failsWith(w.bob.getCommunityLesson(listed), 'not_found', /ya no está disponible/);
});

test('abrir una clase con datos manipulados (repo ajeno, id o commit inválidos) es invalid_input sin peticiones', async () => {
  const w = await world();
  await w.alice.shareLesson(lessonBy('alice'));
  const [listed] = await w.carol.listCommunityLessons();
  w.machine.resetCalls();
  for (const bad of [
    { ...listed, repo: 'victima/codice-skills' },
    { ...listed, repo: 'alice/otro-repo' },
    { ...listed, repo: 'alice/codice-skills/../x' },
    { ...listed, id: '../etc' },
    { ...listed, sha: 'zzz' },
    { ...listed, author: { login: 'bob' } },
    null,
  ]) {
    await failsWith(w.carol.getCommunityLesson(bad), 'invalid_input');
  }
  assert.equal(w.machine.calls.length, 0);
});

/* ------------------------------------------------------------------ */
/* Errores de GitHub                                                   */
/* ------------------------------------------------------------------ */

test('límite de peticiones: rate_limit con la hora de renovación, al compartir y al listar', async () => {
  const w = await world();
  w.machine.failNext({ match: 'POST /repos/alice/codice-skills/git/blobs', kind: 'rate-limit' });
  w.machine.seedRepo('alice', 'codice-skills');
  await assert.rejects(w.alice.shareLesson(lessonBy('alice')), (err) => {
    assert.equal(err.code, 'rate_limit');
    assert.ok(err.retryAt > Date.now());
    assert.match(err.message, /límite de peticiones/);
    return true;
  });
  assert.equal(w.machine.issues.length, 0, 'no se abrió ningún Issue a medias');

  const w2 = await world();
  w2.machine.failNext({ match: 'GET /repos/test/catalog/issues', kind: 'rate-limit' });
  await failsWith(w2.carol.listCommunityLessons(), 'rate_limit');
});

test('sesión caducada (401), permisos (403), repo catálogo inexistente y 5xx se traducen a su código', async () => {
  const w = await world();
  w.machine.failNext({ match: 'POST /user/repos', kind: 'unauthorized' });
  await failsWith(w.alice.shareLesson(lessonBy('alice')), 'auth_required');

  w.machine.failNext({ match: 'POST /user/repos', kind: 'forbidden' });
  await failsWith(w.alice.shareLesson(lessonBy('alice')), 'forbidden');

  w.machine.failNext({ match: 'POST /user/repos', kind: 'server', status: 502 });
  await failsWith(w.alice.shareLesson(lessonBy('alice')), 'github', /502/);

  const w2 = await world();
  w2.machine.failNext({ match: 'GET /repos/test/catalog/issues', kind: 'not-found' });
  await failsWith(w2.carol.listCommunityLessons(), 'not_found');
});

test('red caída: network, sin dejar nada a medias', async () => {
  const w = await world();
  w.machine.failNext({ match: 'POST /user/repos', kind: 'network' });
  await failsWith(w.alice.shareLesson(lessonBy('alice')), 'network', /conectar con GitHub/);
  assert.equal(w.machine.issues.length, 0);
  const w2 = await world();
  w2.machine.failNext({ match: 'GET /repos/test/catalog/issues', kind: 'network' });
  await failsWith(w2.carol.listCommunityLessons(), 'network');
});

test('si falla el Issue tras el commit, reintentar compartir lo completa sin duplicar nada', async () => {
  const w = await world();
  const lesson = lessonBy('alice');
  w.machine.failNext({ match: 'POST /repos/test/catalog/issues', kind: 'server' });
  await failsWith(w.alice.shareLesson(lesson), 'github');
  assert.equal(w.machine.issues.length, 0);
  assert.ok(w.machine.repoFiles('alice/codice-skills')[`classes/${lesson.id}/clase.json`], 'el commit sí quedó');
  const share = await w.alice.shareLesson(lesson);
  assert.equal(w.machine.issues.length, 1);
  assert.equal(share.issueNumber, w.machine.issues[0].number);
});

test('si el repo cambió mientras se compartía (la ref no avanza) es conflict', async () => {
  const w = await world();
  w.machine.seedRepo('alice', 'codice-skills');
  w.machine.failNext({ match: 'PATCH /repos/alice/codice-skills/git/refs/heads/main', kind: 'server', status: 422 });
  await failsWith(w.alice.shareLesson(lessonBy('alice')), 'conflict');
  assert.equal(w.machine.issues.length, 0);
});

/* ------------------------------------------------------------------ */

let passed = 0;
try {
  for (const [name, fn] of tests) {
    try {
      await fn();
      passed++;
      console.log(`  ok  ${name}`);
    } catch (err) {
      console.error(`  FALLA  ${name}\n${err.stack}`);
      process.exitCode = 1;
      break;
    }
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}
if (process.exitCode) process.exit(process.exitCode);
console.log(`\n${passed} pruebas del servicio de clases compartidas OK`);
