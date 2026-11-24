// Pruebas de la lógica pura para compartir clases (C1): archivos, huella, marcador, autoría y contenido ajeno.
// Uso: node scripts/test-lesson-sharing.mjs
import { build } from 'esbuild';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dir = mkdtempSync(join(tmpdir(), 'codice-sharing-'));
const entry = join(dir, 'entry.ts');
const out = join(dir, 'bundle.mjs');
const src = (f) => JSON.stringify(join(ROOT, 'src/services', f).replace(/\\/g, '/'));
writeFileSync(entry, `export * from ${src('lessonSharing.ts')};\nexport * from ${src('lessonsStore.ts')};\n`);
await build({ entryPoints: [entry], outfile: out, bundle: true, format: 'esm', platform: 'node', logLevel: 'error' });
const m = await import(pathToFileURL(out).href);

let passed = 0;
const test = (name, fn) => {
  try {
    fn();
    passed++;
    console.log(`  ok  ${name}`);
  } catch (err) {
    console.error(`  FALLA  ${name}\n${err.stack}`);
    rmSync(dir, { recursive: true, force: true });
    process.exit(1);
  }
};

const NOW = new Date('2026-11-15T10:00:00.000Z');
const SHA = 'a'.repeat(40);
const VID = 'dQw4w9WgXcQ';
const memory = (initial = {}) => {
  const data = { ...initial };
  return { data, getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => void (data[k] = v) };
};
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
const author = { login: 'SuarezCaceres' };
const lesson = (over = {}) => m.createLesson(draft(over), author, [], NOW);
const WHERE = { repo: 'SuarezCaceres/codice-skills', sha: SHA };
/** Un Issue [class] tal como lo devolvería GitHub. */
const issueFor = (l, over = {}) => ({
  number: 7,
  html_url: 'https://github.com/test/catalog/issues/7',
  body: `Clase compartida.\n\n${m.buildClassMarker(l, WHERE)}`,
  user: { login: 'SuarezCaceres', avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4' },
  ...over,
});
/** Reemplaza campos del marcador de un Issue para simular datos manipulados. */
const tamper = (l, patch) => {
  const marker = m.readClassMarker(issueFor(l).body);
  return `<!-- codice:v1 ${JSON.stringify({ ...marker, data: { ...marker.data, ...patch } })} -->`;
};

console.log('Huella y estado');
test('contentHash es estable y de 8 dígitos hexadecimales', () => {
  const l = lesson();
  assert.match(m.contentHash(l), /^[0-9a-f]{8}$/);
  assert.equal(m.contentHash(l), m.contentHash({ ...l }));
});
test('cambia con el título, el cuerpo, las etiquetas y los videos', () => {
  const l = lesson();
  const h = m.contentHash(l);
  assert.notEqual(m.contentHash({ ...l, title: 'Otro título' }), h);
  assert.notEqual(m.contentHash({ ...l, bodyMarkdown: l.bodyMarkdown + ' más' }), h);
  assert.notEqual(m.contentHash({ ...l, tags: ['otra'] }), h);
  assert.notEqual(m.contentHash({ ...l, videos: [] }), h);
  assert.notEqual(m.contentHash({ ...l, videos: [{ ...l.videos[0], title: 'Cambiado' }] }), h);
});
test('no cambia con lo que no se publica: autor, fechas y estado de compartida', () => {
  const l = lesson();
  const h = m.contentHash(l);
  assert.equal(m.contentHash({ ...l, author: { login: 'otra' }, updatedAt: '2030-01-01T00:00:00.000Z' }), h);
});
test('shareStatus: private, shared y dirty', () => {
  const l = lesson();
  assert.equal(m.shareStatus(l), 'private');
  const shared = { ...l, shared: { repo: WHERE.repo, slug: l.id, issueNumber: 7, sha: SHA, sharedAt: NOW.toISOString(), contentHash: m.contentHash(l) } };
  assert.equal(m.shareStatus(shared), 'shared');
  assert.equal(m.shareStatus({ ...shared, title: 'Editada después de compartir' }), 'dirty');
});

console.log('Archivos que se publican');
test('buildSharedFiles genera clase.json y CLASE.md dentro de classes/<id>/', () => {
  const l = lesson();
  const files = m.buildSharedFiles(l);
  assert.deepEqual(files.map((f) => f.path), [`classes/${l.id}/clase.json`, `classes/${l.id}/CLASE.md`]);
  assert.equal(files[1].content, `${l.bodyMarkdown}\n`);
});
test('clase.json lleva formato, metadatos y videos, pero ni autor ni cuerpo ni fechas', () => {
  const meta = JSON.parse(m.buildSharedFiles(lesson())[0].content);
  assert.equal(meta.format, 'codice-class');
  assert.equal(meta.version, 1);
  assert.equal(meta.title, '¿Qué es un hook?');
  assert.deepEqual(meta.videos, [{ id: 'v1', kind: 'video', youtubeId: VID, title: 'Intro' }]);
  for (const key of ['author', 'bodyMarkdown', 'createdAt', 'updatedAt', 'shared', 'id']) assert.equal(key in meta, false, key);
});
test('classDir rechaza ids con ruta, mayúsculas o vacíos', () => {
  for (const bad of ['../x', 'a/b', 'A', '', 'x'.repeat(81), '.git']) assert.throws(() => m.classDir(bad), /no es válido/, bad);
  assert.equal(m.classDir('que-es-un-hook'), 'classes/que-es-un-hook');
});

console.log('Etiquetas y marcador');
test('classLabel usa class:<id> y, si pasa de 50 caracteres, una versión con hash', () => {
  assert.equal(m.classLabel('que-es-un-hook'), 'class:que-es-un-hook');
  const long = m.classLabel('x'.repeat(80));
  assert.ok(long.length <= 50 && long.startsWith('class:h-'), long);
  assert.notEqual(m.classLabel('a'.repeat(80)), m.classLabel('b'.repeat(80)));
  assert.equal(m.classLabel('a'.repeat(80)), m.classLabel('a'.repeat(80)));
});
test('el marcador va y vuelve con kind, etiquetas y datos', () => {
  const l = lesson();
  const marker = m.readClassMarker(`texto\n${m.buildClassMarker(l, WHERE)}\nmás`);
  assert.equal(marker.kind, 'class');
  assert.deepEqual(marker.labels, ['class', `class:${l.id}`]);
  assert.equal(marker.data.slug, l.id);
  assert.equal(marker.data.sha, SHA);
  assert.equal(marker.data.contentHash, m.contentHash(l));
});
test('un título con --> o <script> no puede cerrar el comentario ni inyectar HTML', () => {
  const l = lesson({ title: 'Truco --> <script>alert(1)</script> <!--' });
  const text = m.buildClassMarker(l, WHERE);
  assert.equal((text.match(/-->/g) ?? []).length, 1, 'solo el cierre final');
  assert.equal(text.includes('<script>'), false);
  assert.equal(m.readClassMarker(`${text}`).data.title, 'Truco --> <script>alert(1)</script> <!--');
});
test('readClassMarker devuelve null si falta, está roto, es de otro tipo o es enorme', () => {
  assert.equal(m.readClassMarker(null), null);
  assert.equal(m.readClassMarker('sin marcador'), null);
  assert.equal(m.readClassMarker('<!-- codice:v1 {no es json} -->'), null);
  assert.equal(m.readClassMarker('<!-- codice:v1 {"kind":"skill","labels":[],"data":{}} -->'), null);
  assert.equal(m.readClassMarker('<!-- codice:v1 {"kind":"class","labels":[]} -->'), null);
  assert.equal(m.readClassMarker(`${'x'.repeat(66_000)}${m.buildClassMarker(lesson(), WHERE)}`), null);
});

console.log('Clases de otras personas: autoría');
test('un Issue válido se convierte en una clase de Comunidad sin cuerpo', () => {
  const l = lesson();
  const c = m.toCommunityLesson(issueFor(l), NOW);
  assert.equal(c.id, l.id);
  assert.equal(c.title, l.title);
  assert.equal(c.author.login, 'SuarezCaceres');
  assert.equal(c.author.profileUrl, 'https://github.com/SuarezCaceres');
  assert.equal(c.repo, 'SuarezCaceres/codice-skills');
  assert.equal(c.repoUrl, 'https://github.com/SuarezCaceres/codice-skills');
  assert.equal(c.sha, SHA);
  assert.equal(c.issueNumber, 7);
  assert.equal(c.issueUrl, 'https://github.com/test/catalog/issues/7');
  assert.equal('bodyMarkdown' in c, false);
  assert.equal('shared' in c, false);
  assert.deepEqual(c.videos, l.videos);
});
test('la autoría es la de quien abrió el Issue, aunque el marcador diga otra cosa', () => {
  const l = lesson();
  const body = tamper(l, { author: { login: 'victima' }, authorLogin: 'victima' });
  const c = m.toCommunityLesson(issueFor(l, { body }), NOW);
  assert.equal(c.author.login, 'SuarezCaceres');
});
test('suplantación: marcador que apunta al repo de otra persona se descarta', () => {
  const l = lesson();
  const body = tamper(l, { repo: 'victima/codice-skills' });
  assert.equal(m.toCommunityLesson(issueFor(l, { body }), NOW), null);
  assert.equal(m.toCommunityLesson(issueFor(l, { user: { login: 'atacante' } }), NOW), null);
});
test('el login se compara sin distinguir mayúsculas y el repo sale con la grafía del Issue', () => {
  const l = lesson();
  const body = tamper(l, { repo: 'suarezcaceres/CODICE-SKILLS' });
  assert.equal(m.toCommunityLesson(issueFor(l, { body }), NOW).repo, 'SuarezCaceres/codice-skills');
});
test('se descartan repos que no son codice-skills, slugs con ruta, sha y huella mal formados', () => {
  const l = lesson();
  const cases = [
    { repo: 'SuarezCaceres/otro-repo' },
    { repo: 'SuarezCaceres/codice-skills/../x' },
    { slug: '../etc' },
    { slug: 'A/B' },
    { sha: 'zzz' },
    { sha: 'a'.repeat(39) },
    { contentHash: 'no-es-hash' },
  ];
  for (const patch of cases) assert.equal(m.toCommunityLesson(issueFor(l, { body: tamper(l, patch) }), NOW), null, JSON.stringify(patch));
});
test('se descartan pull requests, Issues sin usuario, sin marcador o con URL ajena a github.com', () => {
  const l = lesson();
  assert.equal(m.toCommunityLesson(issueFor(l, { pull_request: {} }), NOW), null);
  assert.equal(m.toCommunityLesson(issueFor(l, { user: null }), NOW), null);
  assert.equal(m.toCommunityLesson(issueFor(l, { body: 'sin marcador' }), NOW), null);
  assert.equal(m.toCommunityLesson(issueFor(l, { html_url: 'https://evil.test/issues/1' }), NOW), null);
  assert.equal(m.toCommunityLesson(issueFor(l, { html_url: 'javascript:alert(1)' }), NOW), null);
  assert.equal(m.toCommunityLesson(issueFor(l, { number: 0 }), NOW), null);
  assert.equal(m.toCommunityLesson(null, NOW), null);
});
test('el avatar solo se acepta si es de avatars.githubusercontent.com', () => {
  const l = lesson();
  assert.equal(m.toCommunityLesson(issueFor(l, { user: { login: 'SuarezCaceres', avatar_url: 'https://evil.test/a.png' } }), NOW).author.avatarUrl, undefined);
  assert.ok(m.toCommunityLesson(issueFor(l), NOW).author.avatarUrl.startsWith('https://avatars.githubusercontent.com/'));
});

console.log('Clases de otras personas: contenido hostil');
test('videos manipulados en el marcador: se descartan los inválidos y se recortan a 12', () => {
  const l = lesson();
  const many = Array.from({ length: 20 }, (_, i) => ({ id: `v${i + 1}`, kind: 'video', youtubeId: VID, title: `Parte ${i + 1}` }));
  const evil = [
    { id: 'v1', kind: 'video', youtubeId: 'javascript:alert(1)', title: 'x' },
    { id: 'v2', kind: 'iframe', youtubeId: VID, title: 'x' },
    { id: 'v3', kind: 'video', youtubeId: VID, title: 'ok', url: 'https://evil.test' },
    ...many,
  ];
  const c = m.toCommunityLesson(issueFor(l, { body: tamper(l, { videos: evil }) }), NOW);
  assert.equal(c.videos.length, 12);
  assert.equal(c.videos[0].title, 'ok');
  assert.deepEqual(Object.keys(c.videos[0]).sort(), ['id', 'kind', 'title', 'youtubeId']);
});
test('título vacío, nivel desconocido o ids de skill/componente raros no pasan', () => {
  const l = lesson();
  assert.equal(m.toCommunityLesson(issueFor(l, { body: tamper(l, { title: '   ' }) }), NOW), null);
  assert.equal(m.toCommunityLesson(issueFor(l, { body: tamper(l, { level: 'Dios' }) }), NOW), null);
  const c = m.toCommunityLesson(issueFor(l, { body: tamper(l, { skillIds: ['no es id', 'acme/tools/demo'], componentIds: ['../x', 'accordion'] }) }), NOW);
  assert.deepEqual(c.skillIds, ['acme/tools/demo']);
  assert.deepEqual(c.componentIds, ['accordion']);
});
test('withSharedFiles carga el cuerpo; el HTML del cuerpo se conserva como texto (SafeMarkdown lo trata al pintar)', () => {
  const l = lesson();
  const base = m.toCommunityLesson(issueFor(l), NOW);
  const files = m.buildSharedFiles({ ...l, bodyMarkdown: '## Hola\n\n<img src=x onerror=alert(1)>' });
  const full = m.withSharedFiles(base, { json: files[0].content, markdown: files[1].content }, NOW);
  assert.ok(full.bodyMarkdown.includes('## Hola'));
  assert.ok(full.bodyMarkdown.includes('<img src=x onerror=alert(1)>'));
  assert.equal(full.author.login, 'SuarezCaceres');
  assert.equal(full.sha, SHA);
});
test('withSharedFiles manda sobre el marcador y recalcula la huella', () => {
  const l = lesson();
  const base = m.toCommunityLesson(issueFor(l), NOW);
  const files = m.buildSharedFiles({ ...l, title: 'Título real de los archivos' });
  const full = m.withSharedFiles(base, { json: files[0].content, markdown: files[1].content }, NOW);
  assert.equal(full.title, 'Título real de los archivos');
  assert.match(full.contentHash, /^[0-9a-f]{8}$/);
  assert.notEqual(full.contentHash, base.contentHash);
});
test('withSharedFiles no deja que los archivos cambien al autor, el repo o el commit', () => {
  const l = lesson();
  const base = m.toCommunityLesson(issueFor(l), NOW);
  const meta = { ...JSON.parse(m.buildSharedFiles(l)[0].content), author: { login: 'victima' }, repo: 'victima/codice-skills', sha: 'b'.repeat(40) };
  const full = m.withSharedFiles(base, { json: JSON.stringify(meta), markdown: l.bodyMarkdown }, NOW);
  assert.equal(full.author.login, 'SuarezCaceres');
  assert.equal(full.repo, 'SuarezCaceres/codice-skills');
  assert.equal(full.sha, SHA);
});
test('withSharedFiles devuelve null con JSON roto, formato ajeno, cuerpo vacío o archivos enormes', () => {
  const l = lesson();
  const base = m.toCommunityLesson(issueFor(l), NOW);
  const good = m.buildSharedFiles(l);
  assert.equal(m.withSharedFiles(base, { json: 'no es json', markdown: good[1].content }, NOW), null);
  assert.equal(m.withSharedFiles(base, { json: '{"format":"otro"}', markdown: good[1].content }, NOW), null);
  assert.equal(m.withSharedFiles(base, { json: good[0].content, markdown: '   \n' }, NOW), null);
  assert.equal(m.withSharedFiles(base, { json: good[0].content, markdown: 'x'.repeat(100_001) }, NOW), null);
  assert.equal(m.withSharedFiles(base, { json: `${good[0].content}${' '.repeat(30_001)}`, markdown: good[1].content }, NOW), null);
  assert.equal(m.withSharedFiles(base, { json: 7, markdown: good[1].content }, NOW), null);
});
test('el cuerpo se recorta a 20 000 caracteres y pierde caracteres de control', () => {
  const l = lesson();
  const base = m.toCommunityLesson(issueFor(l), NOW);
  const full = m.withSharedFiles(base, { json: m.buildSharedFiles(l)[0].content, markdown: `Hola\u0000${'x'.repeat(25_000)}` }, NOW);
  assert.equal(full.bodyMarkdown.length, 20_000);
  assert.equal(full.bodyMarkdown.includes('\u0000'), false);
});

console.log('Estado de «compartida» en el almacén');
const sharedInfo = (l) => ({ repo: WHERE.repo, slug: l.id, issueNumber: 7, sha: SHA, sharedAt: NOW.toISOString(), contentHash: m.contentHash(l) });
test('sanitizeLesson conserva un estado de compartida válido', () => {
  const l = lesson();
  const clean = m.sanitizeLesson({ ...l, shared: sharedInfo(l) }, NOW);
  assert.deepEqual(clean.shared, sharedInfo(l));
});
test('sanitizeLesson descarta un estado de compartida mal formado, sin invalidar la clase', () => {
  const l = lesson();
  const bad = [
    { ...sharedInfo(l), repo: 'otra/cosa' },
    { ...sharedInfo(l), slug: '../x' },
    { ...sharedInfo(l), issueNumber: 0 },
    { ...sharedInfo(l), issueNumber: 1.5 },
    { ...sharedInfo(l), sha: 'xyz' },
    { ...sharedInfo(l), contentHash: 'nope' },
    { ...sharedInfo(l), sharedAt: 'ayer' },
    'texto',
    null,
  ];
  for (const shared of bad) {
    const clean = m.sanitizeLesson({ ...l, shared }, NOW);
    assert.ok(clean, JSON.stringify(shared));
    assert.equal(clean.shared, undefined, JSON.stringify(shared));
  }
});
test('el almacén local conserva el estado de compartida entre recargas', () => {
  const l = lesson();
  const storage = memory();
  m.createLocalLessonsStore(storage).save({ ...l, shared: sharedInfo(l) });
  assert.deepEqual(m.createLocalLessonsStore(storage).get(l.id).shared, sharedInfo(l));
});
test('exportar no incluye el estado de compartida', () => {
  const l = lesson();
  const exported = JSON.parse(m.exportLessons([{ ...l, shared: sharedInfo(l) }], NOW));
  assert.equal('shared' in exported.lessons[0], false);
});
test('importar nunca trae el estado de compartida, ni siquiera si el archivo lo declara', () => {
  const l = lesson();
  const file = JSON.stringify({ format: 'codice-lessons', version: 1, exportedAt: NOW.toISOString(), lessons: [{ ...l, shared: sharedInfo(l) }] });
  const r = m.importLessons(file, [], NOW);
  assert.equal(r.added, 1);
  assert.equal(r.lessons[0].shared, undefined);
});
test('importar una versión más nueva de tu propia clase conserva su estado de compartida', () => {
  const l = lesson();
  const existing = { ...l, shared: sharedInfo(l) };
  const newer = { ...l, title: 'Título nuevo', updatedAt: '2026-12-01T00:00:00.000Z' };
  const file = JSON.stringify({ format: 'codice-lessons', version: 1, exportedAt: NOW.toISOString(), lessons: [newer] });
  const r = m.importLessons(file, [existing], NOW);
  assert.equal(r.updated, 1);
  assert.equal(r.lessons[0].title, 'Título nuevo');
  assert.deepEqual(r.lessons[0].shared, sharedInfo(l));
});
test('updateLesson conserva el estado de compartida y shareStatus pasa a dirty', () => {
  const l = lesson();
  const shared = { ...l, shared: sharedInfo(l) };
  const edited = m.updateLesson(shared, draft({ title: 'Cambiado después de compartir' }), new Date('2026-11-16T10:00:00.000Z'));
  assert.deepEqual(edited.shared, sharedInfo(l));
  assert.equal(m.shareStatus(edited), 'dirty');
});

rmSync(dir, { recursive: true, force: true });
console.log(`\n${passed} pruebas de clases compartidas OK`);
