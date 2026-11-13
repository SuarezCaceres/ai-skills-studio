// Pruebas de la lógica de asignaciones de componentes (E2): validación, alta, baja y persistencia.
// Uso: node scripts/test-component-assignments.mjs
import { build } from 'esbuild';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dir = mkdtempSync(join(tmpdir(), 'wt4-assign-'));
const entry = join(dir, 'entry.ts');
const out = join(dir, 'bundle.mjs');

writeFileSync(entry, `export * from ${JSON.stringify(join(ROOT, 'src/services/componentAssignments.ts').replace(/\\/g, '/'))};\n`);
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

const NOW = new Date('2026-11-13T10:00:00.000Z');
const memoryStore = (initial = {}) => {
  const data = { ...initial };
  return { data, getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => void (data[k] = v) };
};

console.log('Validación de datos no fiables');
test('un valor que no es un objeto da un mapa vacío', () => {
  for (const bad of [null, undefined, 3, 'x', [], true]) assert.deepEqual(m.sanitizeAssignments(bad), {});
});
test('una entrada válida se conserva', () => {
  const map = m.sanitizeAssignments(
    { accordion: { componentId: 'x', skillIds: ['acme/tools/demo'], modelIds: ['claude-opus-5-5'], note: ' Hecho con Opus ', updatedAt: '2026-01-02T00:00:00Z' } },
    NOW
  );
  assert.deepEqual(map.accordion, {
    componentId: 'accordion',
    skillIds: ['acme/tools/demo'],
    modelIds: ['claude-opus-5-5'],
    note: 'Hecho con Opus',
    updatedAt: '2026-01-02T00:00:00.000Z',
  });
});
test('el componentId sale de la clave, no del contenido', () => {
  const map = m.sanitizeAssignments({ badge: { componentId: 'otro', skillIds: [], modelIds: ['m1'] } }, NOW);
  assert.equal(map.badge.componentId, 'badge');
  assert.equal(map.otro, undefined);
});
test('claves con formato inválido se descartan (__proto__, mayúsculas, rutas)', () => {
  const raw = JSON.parse('{"__proto__":{"skillIds":["a/b/c"]},"Bad Key":{"modelIds":["m1"]},"../x":{"modelIds":["m1"]},"ok-1":{"modelIds":["m1"]}}');
  assert.deepEqual(Object.keys(m.sanitizeAssignments(raw, NOW)), ['ok-1']);
});
test('ids de skill mal formados, con saltos de línea o demasiado largos se descartan', () => {
  const map = m.sanitizeAssignments(
    { card: { skillIds: ['sin-barras', 'a/b/c', 'a/b/ruta\nmala', `a/b/${'x'.repeat(300)}`, 42, null, '<script>/x/y'], modelIds: [] } },
    NOW
  );
  assert.deepEqual(map.card.skillIds, ['a/b/c']);
});
test('ids de modelo inválidos se descartan y los repetidos se unen', () => {
  const map = m.sanitizeAssignments({ card: { skillIds: [], modelIds: ['claude-opus-5-5', 'claude-opus-5-5', 'con espacios', '', '<b>', 7] } }, NOW);
  assert.deepEqual(map.card.modelIds, ['claude-opus-5-5']);
});
test('máximo 20 ids por lista', () => {
  const ids = Array.from({ length: 50 }, (_, i) => `m${i}`);
  assert.equal(m.sanitizeAssignments({ card: { skillIds: [], modelIds: ids } }, NOW).card.modelIds.length, m.MAX_ASSIGNED_IDS);
});
test('la nota se recorta a 300 caracteres y pierde los caracteres de control', () => {
  const map = m.sanitizeAssignments({ card: { skillIds: [], modelIds: ['m1'], note: `\u0000hola\u0007${'x'.repeat(400)}` } }, NOW);
  assert.equal(map.card.note.length, m.MAX_NOTE_LENGTH);
  assert.ok(map.card.note.startsWith('hola'));
});
test('una entrada sin skills ni modelos desaparece (queda «No asignado»)', () => {
  assert.deepEqual(m.sanitizeAssignments({ card: { skillIds: [], modelIds: [], note: 'solo nota' } }, NOW), {});
});
test('una fecha inválida se sustituye por la actual', () => {
  assert.equal(m.sanitizeAssignments({ card: { skillIds: [], modelIds: ['m1'], updatedAt: 'ayer' } }, NOW).card.updatedAt, NOW.toISOString());
});

console.log('Alta y baja');
test('upsert añade la asignación y no modifica el mapa original', () => {
  const base = {};
  const next = m.upsertAssignment(base, 'accordion', { skillIds: ['acme/tools/demo'], modelIds: [] }, NOW);
  assert.deepEqual(base, {});
  assert.deepEqual(next.accordion.skillIds, ['acme/tools/demo']);
  assert.equal(next.accordion.updatedAt, NOW.toISOString());
});
test('upsert reemplaza la asignación anterior', () => {
  const a = m.upsertAssignment({}, 'accordion', { skillIds: ['a/b/c'], modelIds: ['m1'] }, NOW);
  const b = m.upsertAssignment(a, 'accordion', { skillIds: [], modelIds: ['m2'], note: 'nota' }, NOW);
  assert.deepEqual(b.accordion.skillIds, []);
  assert.deepEqual(b.accordion.modelIds, ['m2']);
  assert.equal(b.accordion.note, 'nota');
});
test('upsert sin skills ni modelos elimina la entrada', () => {
  const a = m.upsertAssignment({}, 'accordion', { skillIds: ['a/b/c'], modelIds: [] }, NOW);
  assert.deepEqual(m.upsertAssignment(a, 'accordion', { skillIds: [], modelIds: [] }, NOW), {});
});
test('upsert ignora un componentId inválido', () => {
  assert.deepEqual(m.upsertAssignment({}, '../../x', { skillIds: ['a/b/c'], modelIds: [] }, NOW), {});
});
test('removeFromAssignment quita solo lo indicado', () => {
  const a = m.upsertAssignment({}, 'card', { skillIds: ['a/b/c', 'd/e/f'], modelIds: ['m1'], note: 'n' }, NOW);
  const b = m.removeFromAssignment(a, 'card', 'skill', 'a/b/c', NOW);
  assert.deepEqual(b.card.skillIds, ['d/e/f']);
  assert.deepEqual(b.card.modelIds, ['m1']);
  assert.equal(b.card.note, 'n');
});
test('quitar lo último deja el componente sin asignar', () => {
  const a = m.upsertAssignment({}, 'card', { skillIds: [], modelIds: ['m1'] }, NOW);
  assert.deepEqual(m.removeFromAssignment(a, 'card', 'model', 'm1', NOW), {});
});
test('componentsOfSkill lista los componentes de una skill', () => {
  let map = m.upsertAssignment({}, 'card', { skillIds: ['a/b/c'], modelIds: [] }, NOW);
  map = m.upsertAssignment(map, 'badge', { skillIds: ['a/b/c', 'd/e/f'], modelIds: [] }, NOW);
  map = m.upsertAssignment(map, 'footer', { skillIds: ['d/e/f'], modelIds: [] }, NOW);
  assert.deepEqual(m.componentsOfSkill(map, 'a/b/c').sort(), ['badge', 'card']);
});

console.log('Persistencia');
test('guardar y volver a cargar conserva las asignaciones (como tras recargar la página)', () => {
  const store = memoryStore();
  const map = m.upsertAssignment({}, 'accordion', { skillIds: ['acme/tools/demo'], modelIds: ['claude-opus-5-5'], note: 'ok' }, NOW);
  assert.equal(m.saveAssignments(map, store), true);
  assert.deepEqual(m.loadAssignments(store), map);
});
test('JSON corrupto o ausente da un mapa vacío', () => {
  assert.deepEqual(m.loadAssignments(memoryStore()), {});
  assert.deepEqual(m.loadAssignments(memoryStore({ [m.COMPONENT_ASSIGNMENTS_KEY]: '{no es json' })), {});
});
test('lo manipulado en el almacenamiento se sanea al cargar', () => {
  const store = memoryStore({ [m.COMPONENT_ASSIGNMENTS_KEY]: JSON.stringify({ card: { skillIds: ['a/b/c', '<x>'], modelIds: [] }, 'X!': { modelIds: ['m1'] } }) });
  assert.deepEqual(Object.keys(m.loadAssignments(store)), ['card']);
  assert.deepEqual(m.loadAssignments(store).card.skillIds, ['a/b/c']);
});
test('si el almacenamiento falla, guardar devuelve false y no lanza', () => {
  const broken = { getItem: () => null, setItem: () => { throw new Error('cuota'); } };
  assert.equal(m.saveAssignments({}, broken), false);
});

rmSync(dir, { recursive: true, force: true });
console.log(`\n${passed} pruebas de asignaciones OK`);
