import type { ComponentAssignment } from '../types/uiComponents';

/**
 * Asignaciones de skills y modelos de IA a los componentes del kit (versión local).
 *
 * Se guardan en `localStorage` bajo una sola clave. Lo que se lee de ahí no es de fiar (puede estar
 * corrupto o manipulado), así que `sanitizeAssignments` valida forma, longitudes y caracteres antes de usarlo.
 */
export const COMPONENT_ASSIGNMENTS_KEY = 'ai_skills_studio_component_assignments_v1';

export const MAX_ASSIGNED_IDS = 20;
export const MAX_NOTE_LENGTH = 300;
const MAX_ID_LENGTH = 200;

type AssignmentMap = Record<string, ComponentAssignment>;

/** Subconjunto de `Storage` que se necesita; permite probar sin navegador. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const COMPONENT_ID = /^[a-z0-9][a-z0-9-]{0,63}$/;
const MODEL_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
// `owner/repo/ruta`: sin espacios de control ni saltos de línea.
const SKILL_ID = /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+(\/[^\u0000-\u001f]*)?$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function cleanIds(value: unknown, valid: RegExp): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  for (const item of value) {
    if (typeof item !== 'string' || item.length > MAX_ID_LENGTH || !valid.test(item)) continue;
    seen.add(item);
    if (seen.size >= MAX_ASSIGNED_IDS) break;
  }
  return [...seen];
}

function cleanNote(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  // eslint-disable-next-line no-control-regex
  const note = value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim().slice(0, MAX_NOTE_LENGTH);
  return note || undefined;
}

function cleanDate(value: unknown, fallback: string): string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? new Date(value).toISOString() : fallback;
}

/** Convierte datos no fiables en un mapa válido; descarta lo que no encaja y las entradas vacías. */
export function sanitizeAssignments(raw: unknown, now: Date = new Date()): AssignmentMap {
  const result: AssignmentMap = {};
  if (!isRecord(raw)) return result;
  for (const [key, entry] of Object.entries(raw)) {
    if (!COMPONENT_ID.test(key) || !isRecord(entry)) continue;
    const skillIds = cleanIds(entry.skillIds, SKILL_ID);
    const modelIds = cleanIds(entry.modelIds, MODEL_ID);
    if (skillIds.length === 0 && modelIds.length === 0) continue;
    const note = cleanNote(entry.note);
    result[key] = {
      componentId: key,
      skillIds,
      modelIds,
      ...(note ? { note } : {}),
      updatedAt: cleanDate(entry.updatedAt, now.toISOString()),
    };
  }
  return result;
}

export function loadAssignments(storage?: StorageLike): AssignmentMap {
  try {
    const store = storage ?? localStorage;
    const raw = store.getItem(COMPONENT_ASSIGNMENTS_KEY);
    return raw ? sanitizeAssignments(JSON.parse(raw)) : {};
  } catch {
    return {};
  }
}

/** Devuelve `false` si no se pudo guardar (sin acceso al almacenamiento o cuota llena). */
export function saveAssignments(map: AssignmentMap, storage?: StorageLike): boolean {
  try {
    (storage ?? localStorage).setItem(COMPONENT_ASSIGNMENTS_KEY, JSON.stringify(map));
    return true;
  } catch {
    return false;
  }
}

export interface AssignmentInput {
  skillIds: string[];
  modelIds: string[];
  note?: string;
}

/**
 * Devuelve un mapa nuevo con la asignación del componente reemplazada. Si no queda ninguna
 * skill ni modelo, la entrada se elimina: el componente vuelve a estar «No asignado».
 */
export function upsertAssignment(
  map: AssignmentMap,
  componentId: string,
  input: AssignmentInput,
  now: Date = new Date()
): AssignmentMap {
  if (!COMPONENT_ID.test(componentId)) return map;
  const next: AssignmentMap = { ...map };
  const skillIds = cleanIds(input.skillIds, SKILL_ID);
  const modelIds = cleanIds(input.modelIds, MODEL_ID);
  if (skillIds.length === 0 && modelIds.length === 0) {
    delete next[componentId];
    return next;
  }
  const note = cleanNote(input.note);
  next[componentId] = { componentId, skillIds, modelIds, ...(note ? { note } : {}), updatedAt: now.toISOString() };
  return next;
}

/** Quita una sola skill o un solo modelo de la asignación de un componente. */
export function removeFromAssignment(
  map: AssignmentMap,
  componentId: string,
  kind: 'skill' | 'model',
  id: string,
  now: Date = new Date()
): AssignmentMap {
  const current = map[componentId];
  if (!current) return map;
  return upsertAssignment(
    map,
    componentId,
    {
      skillIds: kind === 'skill' ? current.skillIds.filter((x) => x !== id) : current.skillIds,
      modelIds: kind === 'model' ? current.modelIds.filter((x) => x !== id) : current.modelIds,
      note: current.note,
    },
    now
  );
}

/** Ids de los componentes que tienen asignada una skill (para enlazar desde la skill hacia ellos). */
export function componentsOfSkill(map: AssignmentMap, skillId: string): string[] {
  return Object.values(map)
    .filter((a) => a.skillIds.includes(skillId))
    .map((a) => a.componentId);
}
