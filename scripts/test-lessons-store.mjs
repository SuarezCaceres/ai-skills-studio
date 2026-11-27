// Pruebas de la lógica de clases (E3): validación, permisos, almacén local e importar/exportar.
// Uso: node scripts/test-lessons-store.mjs
import { build } from 'esbuild';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dir = mkdtempSync(join(tmpdir(), 'wt4-lessons-'));
const entry = join(dir, 'entry.ts');
const out = join(dir, 'bundle.mjs');
writeFileSync(
  entry,
  `export * from ${JSON.stringify(join(ROOT, 'src/services/lessonsStore.ts').replace(/\\/g, '/'))};\n` +
    `export * from ${JSON.stringify(join(ROOT, 'src/services/youtube.ts').replace(/\\/g, '/'))};\n`
);
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
const LATER = new Date('2026-11-16T10:00:00.000Z');
const memory = (initial = {}) => {
  const data = { ...initial };
  return { data, getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => void (data[k] = v) };
};
const draft = (over = {}) => ({
  title: '¿Qué es un hook?',
  summary: 'Qué es un hook y cómo lo usamos en el equipo.',
  level: 'Principiante',
  tags: ['hooks', 'Claude Code'],
  bodyMarkdown: '# Hooks\n\nUn hook es un comando que se ejecuta ante un evento.',
  skillIds: ['acme/tools/demo'],
  componentIds: ['accordion'],
  ...over,
});
const author = { login: 'SuarezCaceres', avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4' };

console.log('Identificadores');
test('slugify quita acentos, signos y mayúsculas', () => {
  assert.equal(m.slugify('¿Qué es un hook?'), 'que-es-un-hook');
  assert.equal(m.slugify('Cómo trabajar con worktrees'), 'como-trabajar-con-worktrees');
  assert.equal(m.slugify('???'), 'clase');
});
test('uniqueLessonId añade sufijo cuando el slug ya existe', () => {
  assert.equal(m.uniqueLessonId('Hola mundo', []), 'hola-mundo');
  assert.equal(m.uniqueLessonId('Hola mundo', ['hola-mundo']), 'hola-mundo-2');
  assert.equal(m.uniqueLessonId('Hola mundo', ['hola-mundo', 'hola-mundo-2']), 'hola-mundo-3');
});

console.log('Validación del formulario');
test('un borrador correcto no tiene errores', () => assert.deepEqual(m.validateDraft(draft()), {}));
test('título, resumen y explicación cortos dan errores en español', () => {
  const e = m.validateDraft(draft({ title: 'abc', summary: 'corto', bodyMarkdown: 'poco' }));
  assert.ok(e.title && e.summary && e.body);
  assert.match(e.title, /al menos 5/);
});
test('los límites máximos se aplican', () => {
  const e = m.validateDraft(draft({ title: 'x'.repeat(121), summary: 'y'.repeat(301), bodyMarkdown: 'z'.repeat(20_001) }));
  assert.ok(e.title && e.summary && e.body);
});
test('demasiadas skills, componentes o etiquetas dan error', () => {
  const many = Array.from({ length: 25 }, (_, i) => `a/b/c${i}`);
  const e = m.validateDraft(draft({ skillIds: many, componentIds: many, tags: many }));
  assert.ok(e.skillIds && e.componentIds && e.tags);
});

console.log('Saneado de datos no fiables');
test('crear una clase conserva lo escrito y normaliza etiquetas', () => {
  const l = m.createLesson(draft(), author, [], NOW);
  assert.equal(l.id, 'que-es-un-hook');
  assert.deepEqual(l.tags, ['hooks', 'claude-code']);
  assert.equal(l.author.login, 'SuarezCaceres');
  assert.equal(l.author.profileUrl, 'https://github.com/SuarezCaceres');
  assert.equal(l.createdAt, NOW.toISOString());
});
test('el perfil se reconstruye: una URL ajena o javascript: no entra', () => {
  const l = m.sanitizeLesson({ ...m.createLesson(draft(), author, [], NOW), author: { login: 'eve', profileUrl: 'javascript:alert(1)', avatarUrl: 'https://evil.test/a.png' } });
  assert.equal(l.author.profileUrl, 'https://github.com/eve');
  assert.equal(l.author.avatarUrl, undefined);
});
test('se rechazan logins con caracteres raros, ids inválidos y niveles desconocidos', () => {
  const base = m.createLesson(draft(), author, [], NOW);
  assert.equal(m.sanitizeLesson({ ...base, author: { login: '../x' } }), null);
  assert.equal(m.sanitizeLesson({ ...base, id: 'Mal Id' }), null);
  assert.equal(m.sanitizeLesson({ ...base, level: 'Experto' }), null);
  assert.equal(m.sanitizeLesson({ ...base, bodyMarkdown: '   ' }), null);
  assert.equal(m.sanitizeLesson('texto'), null);
});
test('ids de skill/componente mal formados se descartan', () => {
  const base = m.createLesson(draft(), author, [], NOW);
  const l = m.sanitizeLesson({ ...base, skillIds: ['a/b/c', '<x>', 'sin-barra', 5], componentIds: ['card', 'Bad Id', '../x'] });
  assert.deepEqual(l.skillIds, ['a/b/c']);
  assert.deepEqual(l.componentIds, ['card']);
});
test('el cuerpo se recorta al máximo y pierde caracteres de control', () => {
  const base = m.createLesson(draft(), author, [], NOW);
  const l = m.sanitizeLesson({ ...base, bodyMarkdown: `\u0000hola${'x'.repeat(25_000)}` });
  assert.equal(l.bodyMarkdown.length, 20_000);
  assert.ok(!l.bodyMarkdown.includes('\u0000'));
});
test('el HTML del usuario se conserva como texto (SafeMarkdown lo trata al pintar)', () => {
  const l = m.createLesson(draft({ bodyMarkdown: '<script>alert(1)</script> y más texto suficiente aquí' }), author, [], NOW);
  assert.ok(l.bodyMarkdown.includes('<script>'));
});

console.log('Permisos');
test('solo quien la subió puede editarla o borrarla (sin distinguir mayúsculas)', () => {
  const l = m.createLesson(draft(), author, [], NOW);
  assert.equal(m.canManageLesson(l, 'suarezcaceres'), true);
  assert.equal(m.canManageLesson(l, 'otra-persona'), false);
  assert.equal(m.canManageLesson(l, null), false);
  assert.equal(m.canManageLesson(l, ''), false);
});
test('editar conserva id, autoría y creación; cambia el contenido y updatedAt', () => {
  const l = m.createLesson(draft(), author, [], NOW);
  const u = m.updateLesson(l, draft({ title: 'Otro título distinto', level: 'Avanzado' }), LATER);
  assert.equal(u.id, l.id);
  assert.equal(u.author.login, l.author.login);
  assert.equal(u.createdAt, l.createdAt);
  assert.equal(u.updatedAt, LATER.toISOString());
  assert.equal(u.level, 'Avanzado');
});

console.log('Almacén local');
test('guardar, leer, editar y borrar', () => {
  const store = m.createLocalLessonsStore(memory());
  const l = m.createLesson(draft(), author, [], NOW);
  assert.equal(store.save(l), true);
  assert.equal(store.list().length, 1);
  assert.equal(store.get(l.id).title, '¿Qué es un hook?');
  assert.equal(store.save({ ...l, title: 'Hooks en profundidad' }), true);
  assert.equal(store.list().length, 1);
  assert.equal(store.get(l.id).title, 'Hooks en profundidad');
  assert.equal(store.remove(l.id), true);
  assert.deepEqual(store.list(), []);
});
test('persiste entre «recargas» (nuevo almacén sobre el mismo storage)', () => {
  const backend = memory();
  m.createLocalLessonsStore(backend).save(m.createLesson(draft(), author, [], NOW));
  assert.equal(m.createLocalLessonsStore(backend).list().length, 1);
});
test('la lista sale de más reciente a más antigua', () => {
  const store = m.createLocalLessonsStore(memory());
  store.save(m.createLesson(draft({ title: 'Primera clase de prueba' }), author, [], NOW));
  store.save(m.createLesson(draft({ title: 'Segunda clase de prueba' }), author, ['primera-clase-de-prueba'], LATER));
  assert.deepEqual(store.list().map((l) => l.id), ['segunda-clase-de-prueba', 'primera-clase-de-prueba']);
});
test('JSON corrupto o manipulado da una lista vacía o saneada, sin lanzar', () => {
  assert.deepEqual(m.createLocalLessonsStore(memory({ [m.LESSONS_KEY]: '{no json' })).list(), []);
  const good = m.createLesson(draft(), author, [], NOW);
  const store = m.createLocalLessonsStore(memory({ [m.LESSONS_KEY]: JSON.stringify([good, { id: 'x' }, 5, null, good]) }));
  assert.equal(store.list().length, 1);
});
test('si guardar falla devuelve false y marca failed', () => {
  const broken = { getItem: () => null, setItem: () => { throw new Error('cuota'); } };
  const store = m.createLocalLessonsStore(broken);
  assert.equal(store.save(m.createLesson(draft(), author, [], NOW)), false);
  assert.equal(store.failed, true);
});
test('save rechaza una clase inválida', () => {
  assert.equal(m.createLocalLessonsStore(memory()).save({ id: 'x' }), false);
});

console.log('Importar y exportar');
test('exportar e importar en otro navegador reproduce las clases', () => {
  const l = m.createLesson(draft(), author, [], NOW);
  const json = m.exportLessons([l], NOW);
  const r = m.importLessons(json, [], NOW);
  assert.equal(r.added, 1);
  assert.deepEqual(r.lessons[0], l);
});
test('importar no pisa la clase de otra persona con el mismo id', () => {
  const mine = m.createLesson(draft(), author, [], NOW);
  const theirs = { ...mine, author: { login: 'eve', profileUrl: 'https://github.com/eve' }, title: 'Clase suplantada', updatedAt: LATER.toISOString() };
  const r = m.importLessons(m.exportLessons([theirs], NOW), [mine], NOW);
  assert.equal(r.skipped, 1);
  assert.equal(r.lessons[0].title, mine.title);
});
test('importar actualiza si es del mismo autor y más reciente', () => {
  const mine = m.createLesson(draft(), author, [], NOW);
  const newer = { ...mine, title: 'Título actualizado ya', updatedAt: LATER.toISOString() };
  const r = m.importLessons(m.exportLessons([newer], NOW), [mine], NOW);
  assert.equal(r.updated, 1);
  assert.equal(r.lessons[0].title, 'Título actualizado ya');
});
test('las clases inválidas del archivo se cuentan como omitidas', () => {
  const l = m.createLesson(draft(), author, [], NOW);
  const json = JSON.stringify({ format: 'codice-lessons', version: 1, exportedAt: NOW.toISOString(), lessons: [l, { id: 'malo' }, 7] });
  const r = m.importLessons(json, [], NOW);
  assert.equal(r.added, 1);
  assert.equal(r.skipped, 2);
});
test('un archivo que no es un export lanza un error en español', () => {
  assert.throws(() => m.importLessons('no es json', []), /JSON válido/);
  assert.throws(() => m.importLessons('{"a":1}', []), /exportación de clases/);
  assert.throws(() => m.importLessons('x'.repeat(2_000_001), []), /demasiado grande/);
});

console.log('Enlaces de YouTube');
const VID = 'dQw4w9WgXcQ';
const LIST = 'PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf';
test('reconoce los formatos de video: watch, youtu.be, shorts, embed y live', () => {
  for (const link of [
    `https://www.youtube.com/watch?v=${VID}`,
    `https://youtube.com/watch?v=${VID}&t=42s`,
    `https://m.youtube.com/watch?v=${VID}`,
    `https://youtu.be/${VID}`,
    `https://youtu.be/${VID}?si=abc`,
    `https://www.youtube.com/shorts/${VID}`,
    `https://www.youtube.com/embed/${VID}`,
    `https://www.youtube.com/live/${VID}?feature=share`,
    `https://www.youtube-nocookie.com/embed/${VID}`,
    `youtu.be/${VID}`,
    `  www.youtube.com/watch?v=${VID}  `,
  ]) {
    const r = m.parseYouTubeLink(link);
    assert.deepEqual(r, { ok: true, kind: 'video', youtubeId: VID }, link);
  }
});
test('reconoce listas de reproducción y un link con v= y list= cuenta como video', () => {
  assert.deepEqual(m.parseYouTubeLink(`https://www.youtube.com/playlist?list=${LIST}`), { ok: true, kind: 'playlist', youtubeId: LIST });
  assert.deepEqual(m.parseYouTubeLink(`https://www.youtube.com/embed/videoseries?list=${LIST}`), { ok: true, kind: 'playlist', youtubeId: LIST });
  assert.deepEqual(m.parseYouTubeLink(`https://www.youtube.com/watch?list=${LIST}`), { ok: true, kind: 'playlist', youtubeId: LIST });
  assert.deepEqual(m.parseYouTubeLink(`https://www.youtube.com/watch?v=${VID}&list=${LIST}`), { ok: true, kind: 'video', youtubeId: VID });
});
test('rechaza hosts ajenos, esquemas peligrosos, vacíos e ID mal formados', () => {
  const bad = [
    '',
    '   ',
    'hola',
    `https://vimeo.com/${VID}`,
    `https://evil.com/watch?v=${VID}`,
    `https://youtube.com.evil.com/watch?v=${VID}`,
    `https://youtube.com@evil.com/watch?v=${VID}`,
    `javascript:alert(1)//youtube.com/watch?v=${VID}`,
    'data:text/html,<script>alert(1)</script>',
    `ftp://youtube.com/watch?v=${VID}`,
    'https://www.youtube.com/watch?v=corto',
    `https://www.youtube.com/watch?v=${VID}"onload="x`,
    'https://www.youtube.com/',
    'https://www.youtube.com/channel/UC1234567890',
    'https://youtu.be/',
    'https://www.youtube.com/playlist?list=abc',
  ];
  for (const link of bad) {
    const r = m.parseYouTubeLink(link);
    assert.equal(r.ok, false, `debería rechazar: ${link}`);
    assert.ok(typeof r.error === 'string' && r.error.length > 5);
  }
});
test('embedUrl solo usa youtube-nocookie y el ID validado; thumbnailUrl y watchUrl también', () => {
  assert.equal(m.embedUrl({ kind: 'video', youtubeId: VID }), `https://www.youtube-nocookie.com/embed/${VID}?rel=0`);
  assert.equal(m.embedUrl({ kind: 'video', youtubeId: VID }, { autoplay: true }), `https://www.youtube-nocookie.com/embed/${VID}?rel=0&autoplay=1`);
  assert.equal(m.embedUrl({ kind: 'playlist', youtubeId: LIST }), `https://www.youtube-nocookie.com/embed/videoseries?rel=0&list=${LIST}`);
  assert.equal(m.thumbnailUrl({ kind: 'video', youtubeId: VID }), `https://i.ytimg.com/vi/${VID}/hqdefault.jpg`);
  assert.equal(m.thumbnailUrl({ kind: 'playlist', youtubeId: LIST }), null);
  assert.equal(m.watchUrl({ kind: 'video', youtubeId: VID }), `https://www.youtube.com/watch?v=${VID}`);
  assert.equal(m.watchUrl({ kind: 'playlist', youtubeId: LIST }), `https://www.youtube.com/playlist?list=${LIST}`);
});
test('videoLabel usa el título o «Parte N» según el orden', () => {
  assert.equal(m.videoLabel({ title: '' }, 0), 'Parte 1');
  assert.equal(m.videoLabel({ title: '   ' }, 1), 'Parte 2');
  assert.equal(m.videoLabel({ title: 'Instalación' }, 2), 'Instalación');
});

console.log('Partes de video en la clase');
const part = (over = {}) => ({ id: 'v1', kind: 'video', youtubeId: VID, title: '', ...over });
test('una clase sin videos (o antigua, sin el campo) es válida y queda con videos []', () => {
  assert.deepEqual(m.createLesson(draft(), author, [], NOW).videos, []);
  const old = m.createLesson(draft(), author, [], NOW);
  delete old.videos;
  assert.deepEqual(m.sanitizeLesson(old, NOW).videos, []);
});
test('createLesson conserva las partes en orden con sus títulos', () => {
  const l = m.createLesson(draft({ videos: [part({ title: 'Intro' }), part({ id: 'v2', youtubeId: 'abcdefghijk', title: '' })] }), author, [], NOW);
  assert.equal(l.videos.length, 2);
  assert.equal(l.videos[0].title, 'Intro');
  assert.equal(l.videos[1].youtubeId, 'abcdefghijk');
});
test('sanitizeLesson descarta partes inválidas y no deja pasar URLs ni campos extra', () => {
  const l = m.createLesson(draft(), author, [], NOW);
  const dirty = {
    ...l,
    videos: [
      part(),
      { id: 'v2', kind: 'video', youtubeId: 'https://evil.com/x', title: 'x' },
      { id: 'v3', kind: 'iframe', youtubeId: VID, title: 'x' },
      { id: 'v4', kind: 'playlist', youtubeId: 'corto', title: 'x' },
      { id: 'v5', kind: 'video', youtubeId: VID, title: 'Con url', url: 'javascript:alert(1)' },
      null,
      7,
    ],
  };
  const cleaned = m.sanitizeLesson(dirty, NOW).videos;
  assert.deepEqual(cleaned.map((v) => v.id), ['v1', 'v5']);
  assert.deepEqual(Object.keys(cleaned[1]).sort(), ['id', 'kind', 'title', 'youtubeId']);
});
test('los ids de parte repetidos o inválidos se regeneran', () => {
  const l = m.createLesson(draft(), author, [], NOW);
  const cleaned = m.sanitizeLesson({ ...l, videos: [part({ id: 'v1' }), part({ id: 'v1' }), part({ id: '<bad>' })] }, NOW).videos;
  assert.equal(new Set(cleaned.map((v) => v.id)).size, 3);
});
test('el título de la parte se limpia y se recorta a 80 caracteres', () => {
  const l = m.createLesson(draft({ videos: [part({ title: '  ' + 'x'.repeat(200) + '\u0000 ' })] }), author, [], NOW);
  assert.equal(l.videos[0].title.length, 80);
});
test('máximo 12 partes: validateDraft avisa y sanitizeLesson recorta', () => {
  const many = Array.from({ length: 15 }, (_, i) => part({ id: `v${i + 1}` }));
  assert.match(m.validateDraft(draft({ videos: many })).videos, /12/);
  assert.equal(m.createLesson(draft({ videos: many }), author, [], NOW).videos.length, 12);
  assert.equal(m.validateDraft(draft({ videos: many.slice(0, 12) })).videos, undefined);
});
test('validateDraft avisa de una parte con enlace no válido y acepta que falte el campo', () => {
  assert.match(m.validateDraft(draft({ videos: [part({ youtubeId: 'no' })] })).videos, /no válido/);
  assert.equal(m.validateDraft(draft()).videos, undefined);
});
test('uniqueVideoId elige el primer id libre', () => {
  assert.equal(m.uniqueVideoId([]), 'v1');
  assert.equal(m.uniqueVideoId(['v1', 'v3']), 'v2');
});
test('updateLesson cambia las partes y, si el formulario no las trae, conserva las existentes', () => {
  const l = m.createLesson(draft({ videos: [part()] }), author, [], NOW);
  assert.equal(m.updateLesson(l, draft({ videos: [] }), LATER).videos.length, 0);
  const withoutVideos = draft();
  assert.equal(m.updateLesson(l, withoutVideos, LATER).videos.length, 1);
});
test('exportar e importar conserva las partes de video; un export antiguo sin ellas sigue valiendo', () => {
  const l = m.createLesson(draft({ videos: [part({ title: 'Intro' })] }), author, [], NOW);
  const back = m.importLessons(m.exportLessons([l], NOW), [], NOW);
  assert.equal(back.added, 1);
  assert.deepEqual(back.lessons[0].videos, l.videos);
  const legacy = { ...l };
  delete legacy.videos;
  const r = m.importLessons(JSON.stringify({ format: 'codice-lessons', version: 1, exportedAt: NOW.toISOString(), lessons: [legacy] }), [], NOW);
  assert.equal(r.added, 1);
  assert.deepEqual(r.lessons[0].videos, []);
});
test('los videos no cambian quién puede gestionar la clase: solo la autora', () => {
  const l = m.createLesson(draft({ videos: [part()] }), author, [], NOW);
  assert.equal(m.canManageLesson(l, 'SuarezCaceres'), true);
  assert.equal(m.canManageLesson(l, 'otra-persona'), false);
  assert.equal(m.canManageLesson(l, null), false);
});

console.log('Páginas de referencia (spec 006, C7 y C9)');
const SIX_PAGES = ['landing-saas', 'tienda-online', 'dashboard', 'login-registro', 'precios', 'blog-articulo'];
test('LIMITS.pages es 5', () => assert.equal(m.LIMITS.pages, 5));
test('validateDraft: 5 páginas no dan error y 6 dan errors.pageIds en español', () => {
  assert.deepEqual(m.validateDraft(draft({ pageIds: SIX_PAGES.slice(0, 5) })), {});
  const e = m.validateDraft(draft({ pageIds: SIX_PAGES }));
  assert.match(e.pageIds, /5 páginas de referencia/);
  assert.deepEqual(Object.keys(e), ['pageIds']);
});
test('validateDraft acepta un borrador sin el campo pageIds (formularios antiguos)', () => {
  const d = draft();
  delete d.pageIds;
  assert.deepEqual(m.validateDraft(d), {});
});
test('sanitizeLesson de una clase guardada antes de la 006 (sin pageIds) da pageIds []', () => {
  const old = m.createLesson(draft(), author, [], NOW);
  delete old.pageIds;
  const clean = m.sanitizeLesson(old, NOW);
  assert.ok(clean);
  assert.deepEqual(clean.pageIds, []);
});
test('pageIds que no es un arreglo (texto, objeto, null, número) se lee como []', () => {
  const base = m.createLesson(draft(), author, [], NOW);
  for (const bad of ['dashboard', { 0: 'dashboard' }, null, 7]) assert.deepEqual(m.sanitizeLesson({ ...base, pageIds: bad }, NOW).pageIds, [], JSON.stringify(bad));
});
test('ids desconocidos, no-string, con otra grafía y repetidos se descartan conservando el orden', () => {
  const base = m.createLesson(draft(), author, [], NOW);
  const raw = ['precios', 'pagina-retirada', 5, null, { id: 'dashboard' }, 'Dashboard', ' dashboard', 'precios', 'dashboard', '../precios', 'landing-saas'];
  assert.deepEqual(m.sanitizeLesson({ ...base, pageIds: raw }, NOW).pageIds, ['precios', 'dashboard', 'landing-saas']);
});
test('por encima de 5 páginas se recorta a las 5 primeras válidas, en su orden', () => {
  const base = m.createLesson(draft(), author, [], NOW);
  const reversed = [...SIX_PAGES].reverse();
  assert.deepEqual(m.sanitizeLesson({ ...base, pageIds: reversed }, NOW).pageIds, reversed.slice(0, 5));
  // Los descartados no consumen hueco: con basura intercalada siguen entrando 5 válidas.
  const mixed = ['x', SIX_PAGES[0], 'x', SIX_PAGES[1], SIX_PAGES[1], SIX_PAGES[2], 'y', SIX_PAGES[3], SIX_PAGES[4], SIX_PAGES[5]];
  assert.deepEqual(m.sanitizeLesson({ ...base, pageIds: mixed }, NOW).pageIds, SIX_PAGES.slice(0, 5));
});
test('createLesson conserva pageIds en orden y sin páginas queda en []', () => {
  assert.deepEqual(m.createLesson(draft({ pageIds: ['dashboard', 'precios'] }), author, [], NOW).pageIds, ['dashboard', 'precios']);
  assert.deepEqual(m.createLesson(draft(), author, [], NOW).pageIds, []);
});
test('createLesson con un id desconocido en el borrador lo quita al guardar', () => {
  assert.deepEqual(m.createLesson(draft({ pageIds: ['pagina-retirada', 'blog-articulo'] }), author, [], NOW).pageIds, ['blog-articulo']);
});
test('updateLesson cambia pageIds y, si el borrador no los trae, conserva los existentes', () => {
  const l = m.createLesson(draft({ pageIds: ['dashboard', 'precios'] }), author, [], NOW);
  assert.deepEqual(m.updateLesson(l, draft({ pageIds: ['blog-articulo'] }), LATER).pageIds, ['blog-articulo']);
  assert.deepEqual(m.updateLesson(l, draft({ pageIds: [] }), LATER).pageIds, []);
  const withoutPages = draft();
  delete withoutPages.pageIds;
  assert.deepEqual(m.updateLesson(l, withoutPages, LATER).pageIds, ['dashboard', 'precios']);
});
test('el almacén local guarda y relee pageIds', () => {
  const backend = memory();
  const l = m.createLesson(draft({ pageIds: ['tienda-online'] }), author, [], NOW);
  m.createLocalLessonsStore(backend).save(l);
  assert.deepEqual(m.createLocalLessonsStore(backend).get(l.id).pageIds, ['tienda-online']);
});
test('el almacén local sanea pageIds manipulados en localStorage', () => {
  const l = m.createLesson(draft(), author, [], NOW);
  const backend = memory({ [m.LESSONS_KEY]: JSON.stringify([{ ...l, pageIds: ['dashboard', 'evil', 'dashboard', 42] }]) });
  assert.deepEqual(m.createLocalLessonsStore(backend).get(l.id).pageIds, ['dashboard']);
});
test('exportar e importar conserva pageIds', () => {
  const l = m.createLesson(draft({ pageIds: ['login-registro', 'precios'] }), author, [], NOW);
  const exported = JSON.parse(m.exportLessons([l], NOW));
  assert.deepEqual(exported.lessons[0].pageIds, ['login-registro', 'precios']);
  const back = m.importLessons(m.exportLessons([l], NOW), [], NOW);
  assert.equal(back.added, 1);
  assert.deepEqual(back.lessons[0].pageIds, ['login-registro', 'precios']);
  assert.deepEqual(back.lessons[0], l);
});
test('un export antiguo sin pageIds importa con pageIds []', () => {
  const l = m.createLesson(draft(), author, [], NOW);
  const legacy = { ...l };
  delete legacy.pageIds;
  const r = m.importLessons(JSON.stringify({ format: 'codice-lessons', version: 1, exportedAt: NOW.toISOString(), lessons: [legacy] }), [], NOW);
  assert.equal(r.added, 1);
  assert.equal(r.skipped, 0);
  assert.deepEqual(r.lessons[0].pageIds, []);
});
test('un import con pageIds hostiles entra saneado (sin desconocidos, repetidos ni más de 5)', () => {
  const l = m.createLesson(draft(), author, [], NOW);
  const hostile = { ...l, pageIds: ['<script>', ...SIX_PAGES, 'dashboard'] };
  const r = m.importLessons(JSON.stringify({ format: 'codice-lessons', version: 1, exportedAt: NOW.toISOString(), lessons: [hostile] }), [], NOW);
  assert.deepEqual(r.lessons[0].pageIds, SIX_PAGES.slice(0, 5));
});

rmSync(dir, { recursive: true, force: true });
console.log(`\n${passed} pruebas de clases OK`);
