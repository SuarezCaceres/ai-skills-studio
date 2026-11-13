import { LESSON_LEVELS, type Lesson, type LessonAuthor, type LessonDraft } from '../types/lessons';

/**
 * Almacén de clases. Todo el acceso a datos pasa por la interfaz `LessonsStore`, para poder
 * cambiar el almacenamiento (hoy `localStorage`; más adelante, repos de GitHub) sin tocar la interfaz.
 *
 * Todo lo que se lee del almacenamiento o de un JSON importado se trata como NO fiable:
 * `sanitizeLesson` valida forma, longitudes, caracteres y URLs antes de aceptarlo.
 */
export const LESSONS_KEY = 'ai_skills_studio_lessons_v1';

export const LIMITS = {
  title: { min: 5, max: 120 },
  summary: { min: 10, max: 300 },
  body: { min: 30, max: 20_000 },
  tags: 8,
  tag: 24,
  skills: 20,
  components: 20,
  lessons: 500,
} as const;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface LessonsStore {
  list(): Lesson[];
  get(id: string): Lesson | undefined;
  /** Crea o reemplaza una clase ya válida. Devuelve `false` si no se pudo guardar. */
  save(lesson: Lesson): boolean;
  remove(id: string): boolean;
  /** Si el almacenamiento falló al leer o escribir por última vez. */
  readonly failed: boolean;
}

/* ---------------- Utilidades ---------------- */

const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;
const LESSON_ID = /^[a-z0-9][a-z0-9-]{0,79}$/;
const SKILL_ID = /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+(\/[^\u0000-\u001f]*)?$/;
const COMPONENT_ID = /^[a-z0-9][a-z0-9-]{0,63}$/;
const LOGIN = /^[A-Za-z0-9-]{1,39}$/;

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

const clean = (v: unknown, max: number): string => (typeof v === 'string' ? v.replace(CONTROL, '').trim().slice(0, max) : '');

/** «¿Qué es un hook?» → «que-es-un-hook». */
export function slugify(title: string): string {
  const slug = title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');
  return slug || 'clase';
}

/** Slug que no choca con los ids ya usados (añade -2, -3…). */
export function uniqueLessonId(title: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  const base = slugify(title);
  if (!used.has(base)) return base;
  for (let n = 2; n < 10_000; n++) {
    const candidate = `${base}-${n}`;
    if (!used.has(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}

export function normalizeTags(raw: string[]): string[] {
  const seen = new Set<string>();
  for (const item of raw) {
    const tag = clean(item, LIMITS.tag).toLowerCase().replace(/\s+/g, '-').replace(/^#/, '');
    if (tag) seen.add(tag);
    if (seen.size >= LIMITS.tags) break;
  }
  return [...seen];
}

function cleanIds(value: unknown, valid: RegExp, max: number): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  for (const item of value) {
    if (typeof item === 'string' && item.length <= 200 && valid.test(item)) seen.add(item);
    if (seen.size >= max) break;
  }
  return [...seen];
}

/** Solo https: nada de `javascript:` ni `data:`. */
function httpsUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function cleanAuthor(value: unknown): LessonAuthor | null {
  if (!isRecord(value) || typeof value.login !== 'string' || !LOGIN.test(value.login)) return null;
  const avatar = httpsUrl(value.avatarUrl);
  return {
    login: value.login,
    ...(avatar?.startsWith('https://avatars.githubusercontent.com/') ? { avatarUrl: avatar } : {}),
    // El perfil se reconstruye a partir del login: nunca se confía en una URL ajena.
    profileUrl: `https://github.com/${value.login}`,
  };
}

function cleanDate(value: unknown, fallback: string): string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? new Date(value).toISOString() : fallback;
}

/** Convierte datos no fiables en una clase válida, o `null` si no se puede aprovechar. */
export function sanitizeLesson(raw: unknown, now: Date = new Date()): Lesson | null {
  if (!isRecord(raw)) return null;
  const id = typeof raw.id === 'string' && LESSON_ID.test(raw.id) ? raw.id : null;
  const author = cleanAuthor(raw.author);
  const title = clean(raw.title, LIMITS.title.max);
  const summary = clean(raw.summary, LIMITS.summary.max);
  const body = typeof raw.bodyMarkdown === 'string' ? raw.bodyMarkdown.replace(CONTROL, '').slice(0, LIMITS.body.max) : '';
  const level = LESSON_LEVELS.find((l) => l === raw.level);
  if (!id || !author || !title || !level || body.trim() === '') return null;
  const iso = now.toISOString();
  const createdAt = cleanDate(raw.createdAt, iso);
  return {
    id,
    title,
    summary,
    level,
    tags: normalizeTags(Array.isArray(raw.tags) ? (raw.tags.filter((t) => typeof t === 'string') as string[]) : []),
    bodyMarkdown: body,
    skillIds: cleanIds(raw.skillIds, SKILL_ID, LIMITS.skills),
    componentIds: cleanIds(raw.componentIds, COMPONENT_ID, LIMITS.components),
    author,
    createdAt,
    updatedAt: cleanDate(raw.updatedAt, createdAt),
  };
}

/* ---------------- Validación del formulario ---------------- */

export type DraftErrors = Partial<Record<'title' | 'summary' | 'body' | 'tags' | 'skillIds' | 'componentIds', string>>;

export function validateDraft(draft: LessonDraft): DraftErrors {
  const errors: DraftErrors = {};
  const title = draft.title.trim().length;
  const summary = draft.summary.trim().length;
  const body = draft.bodyMarkdown.trim().length;
  if (title < LIMITS.title.min) errors.title = `El título necesita al menos ${LIMITS.title.min} caracteres.`;
  else if (title > LIMITS.title.max) errors.title = `El título admite como máximo ${LIMITS.title.max} caracteres.`;
  if (summary < LIMITS.summary.min) errors.summary = `El resumen necesita al menos ${LIMITS.summary.min} caracteres.`;
  else if (summary > LIMITS.summary.max) errors.summary = `El resumen admite como máximo ${LIMITS.summary.max} caracteres.`;
  if (body < LIMITS.body.min) errors.body = `Explica la clase con al menos ${LIMITS.body.min} caracteres.`;
  else if (draft.bodyMarkdown.length > LIMITS.body.max) errors.body = `La explicación admite como máximo ${LIMITS.body.max.toLocaleString('es')} caracteres.`;
  if (draft.tags.length > LIMITS.tags) errors.tags = `Como máximo ${LIMITS.tags} etiquetas.`;
  if (draft.skillIds.length > LIMITS.skills) errors.skillIds = `Como máximo ${LIMITS.skills} skills.`;
  if (draft.componentIds.length > LIMITS.components) errors.componentIds = `Como máximo ${LIMITS.components} componentes.`;
  return errors;
}

/** Solo quien subió la clase puede editarla o borrarla (comparación sin distinguir mayúsculas). */
export function canManageLesson(lesson: Lesson, login: string | null | undefined): boolean {
  return Boolean(login) && lesson.author.login.toLowerCase() === String(login).toLowerCase();
}

/** Construye una clase nueva a partir del formulario y de la sesión. */
export function createLesson(draft: LessonDraft, author: { login: string; avatarUrl?: string }, takenIds: Iterable<string>, now: Date = new Date()): Lesson {
  const lesson = sanitizeLesson(
    {
      id: uniqueLessonId(draft.title, takenIds),
      ...draft,
      author: { login: author.login, avatarUrl: author.avatarUrl },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    now
  );
  if (!lesson) throw new Error('La clase no es válida.');
  return lesson;
}

/** Aplica el formulario a una clase existente conservando id, autoría y fecha de creación. */
export function updateLesson(existing: Lesson, draft: LessonDraft, now: Date = new Date()): Lesson {
  const lesson = sanitizeLesson({ ...existing, ...draft, updatedAt: now.toISOString() }, now);
  if (!lesson) throw new Error('La clase no es válida.');
  return lesson;
}

/* ---------------- Importar y exportar ---------------- */

export interface LessonsExport {
  format: 'codice-lessons';
  version: 1;
  exportedAt: string;
  lessons: Lesson[];
}

export function exportLessons(lessons: Lesson[], now: Date = new Date()): string {
  const payload: LessonsExport = { format: 'codice-lessons', version: 1, exportedAt: now.toISOString(), lessons };
  return JSON.stringify(payload, null, 2);
}

export const MAX_IMPORT_BYTES = 2_000_000;

export interface ImportResult {
  /** Estado final de la lista tras importar. */
  lessons: Lesson[];
  added: number;
  updated: number;
  skipped: number;
}

/**
 * Mezcla un JSON exportado con las clases actuales. Una clase con el mismo id solo se sustituye si
 * la autoría coincide y la importada es más reciente; las inválidas se descartan. Lanza `Error`
 * con un mensaje en español si el archivo no es un export de clases.
 */
export function importLessons(text: string, current: Lesson[], now: Date = new Date()): ImportResult {
  if (text.length > MAX_IMPORT_BYTES) throw new Error('El archivo es demasiado grande (máximo 2 MB).');
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('El archivo no es un JSON válido.');
  }
  const items = isRecord(parsed) && parsed.format === 'codice-lessons' && Array.isArray(parsed.lessons) ? parsed.lessons : null;
  if (!items) throw new Error('El archivo no es una exportación de clases de Códice.');

  const byId = new Map(current.map((l) => [l.id, l]));
  let added = 0;
  let updated = 0;
  let skipped = 0;
  for (const item of items.slice(0, LIMITS.lessons)) {
    const lesson = sanitizeLesson(item, now);
    if (!lesson) {
      skipped++;
      continue;
    }
    const existing = byId.get(lesson.id);
    if (!existing) {
      if (byId.size >= LIMITS.lessons) {
        skipped++;
        continue;
      }
      byId.set(lesson.id, lesson);
      added++;
    } else if (existing.author.login.toLowerCase() === lesson.author.login.toLowerCase() && Date.parse(lesson.updatedAt) > Date.parse(existing.updatedAt)) {
      byId.set(lesson.id, lesson);
      updated++;
    } else {
      skipped++;
    }
  }
  return { lessons: [...byId.values()], added, updated, skipped };
}

/* ---------------- Implementación local ---------------- */

export function createLocalLessonsStore(storage?: StorageLike): LessonsStore {
  let failed = false;
  const backend = (): StorageLike | null => {
    try {
      return storage ?? localStorage;
    } catch {
      return null;
    }
  };

  const read = (): Lesson[] => {
    try {
      const raw = backend()?.getItem(LESSONS_KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      const seen = new Set<string>();
      const out: Lesson[] = [];
      for (const item of parsed.slice(0, LIMITS.lessons)) {
        const lesson = sanitizeLesson(item);
        if (lesson && !seen.has(lesson.id)) {
          seen.add(lesson.id);
          out.push(lesson);
        }
      }
      return out;
    } catch {
      failed = true;
      return [];
    }
  };

  const write = (lessons: Lesson[]): boolean => {
    try {
      const store = backend();
      if (!store) throw new Error('sin almacenamiento');
      store.setItem(LESSONS_KEY, JSON.stringify(lessons));
      failed = false;
      return true;
    } catch {
      failed = true;
      return false;
    }
  };

  return {
    list: () => read().sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)),
    get: (id) => read().find((l) => l.id === id),
    save(lesson) {
      const valid = sanitizeLesson(lesson);
      if (!valid) return false;
      const all = read();
      const index = all.findIndex((l) => l.id === valid.id);
      if (index >= 0) all[index] = valid;
      else if (all.length >= LIMITS.lessons) return false;
      else all.push(valid);
      return write(all);
    },
    remove(id) {
      const all = read();
      return write(all.filter((l) => l.id !== id));
    },
    get failed() {
      return failed;
    },
  };
}

/** Sustituye todo el contenido (lo usa la importación) y devuelve `false` si no se pudo guardar. */
export function replaceAllLessons(store: LessonsStore, lessons: Lesson[]): boolean {
  const current = store.list();
  const keep = new Set(lessons.map((l) => l.id));
  let ok = true;
  for (const l of lessons) ok = store.save(l) && ok;
  for (const l of current) if (!keep.has(l.id)) ok = store.remove(l.id) && ok;
  return ok;
}
