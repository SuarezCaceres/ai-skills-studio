import type { CommunityLesson, Lesson, LessonVideo } from '../types/lessons';
import { isGitSha, isValidLessonId, isValidLogin, sanitizeBody, sanitizeLessonMeta } from './lessonsStore';

/**
 * Lógica pura para compartir clases a través de GitHub (sin red, para poder probarla entera).
 *
 * Cada clase compartida son dos archivos en `classes/<id>/` de `<login>/codice-skills` y un Issue
 * `[class]` en el repo catálogo cuyo marcador lleva los metadatos (así la lista de Comunidad no pide
 * los archivos). TODO lo que llega de GitHub es de otra persona: se valida con los mismos saneadores
 * que las clases locales y la autoría sale del Issue, nunca del marcador.
 */

export const SHARE_REPO_NAME = 'codice-skills';
export const CLASSES_DIR = 'classes';
export const CLASS_FORMAT = 'codice-class';
export const CLASE_JSON = 'clase.json';
export const CLASE_MD = 'CLASE.md';

/** Tope de bytes que se aceptan al leer los archivos de una clase ajena. */
export const MAX_CLASE_JSON_BYTES = 30_000;
export const MAX_CLASE_MD_BYTES = 100_000;
/** Tope del cuerpo de un Issue de GitHub es de 65 536 caracteres. */
const MAX_MARKER_BODY = 65_000;

/* ---------------- Huella ---------------- */

/** FNV-1a de 32 bits sobre el texto, en 8 dígitos hexadecimales. No es criptográfica: detecta cambios. */
export function fnv1a(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

const plainVideos = (videos: LessonVideo[]) => videos.map((v) => ({ id: v.id, kind: v.kind, youtubeId: v.youtubeId, title: v.title }));

type Shareable = Pick<Lesson, 'title' | 'summary' | 'level' | 'tags' | 'skillIds' | 'componentIds' | 'videos' | 'bodyMarkdown'>;

/** Huella de lo que se publica. Autor, fechas y estado de «compartida» no cuentan. */
export function contentHash(lesson: Shareable): string {
  return fnv1a(
    JSON.stringify([
      lesson.title,
      lesson.summary,
      lesson.level,
      lesson.tags,
      lesson.skillIds,
      lesson.componentIds,
      plainVideos(lesson.videos),
      lesson.bodyMarkdown,
    ])
  );
}

export type ShareStatus = 'private' | 'shared' | 'dirty';

/** `private` (nunca compartida), `shared` (al día) o `dirty` (compartida, pero editada después). */
export function shareStatus(lesson: Lesson): ShareStatus {
  if (!lesson.shared) return 'private';
  return lesson.shared.contentHash === contentHash(lesson) ? 'shared' : 'dirty';
}

/* ---------------- Archivos que se publican ---------------- */

export interface SharedFile {
  path: string;
  content: string;
}

/** Carpeta de la clase dentro del repo. El id ya es un slug seguro (`[a-z0-9-]`). */
export function classDir(id: string): string {
  if (!isValidLessonId(id)) throw new Error('El id de la clase no es válido.');
  return `${CLASSES_DIR}/${id}`;
}

/** `clase.json` (metadatos y videos) y `CLASE.md` (la explicación). Sin autor: lo da la cuenta que publica. */
export function buildSharedFiles(lesson: Lesson): SharedFile[] {
  const dir = classDir(lesson.id);
  const meta = {
    format: CLASS_FORMAT,
    version: 1,
    title: lesson.title,
    summary: lesson.summary,
    level: lesson.level,
    tags: lesson.tags,
    skillIds: lesson.skillIds,
    componentIds: lesson.componentIds,
    videos: plainVideos(lesson.videos),
  };
  return [
    { path: `${dir}/${CLASE_JSON}`, content: `${JSON.stringify(meta, null, 2)}\n` },
    { path: `${dir}/${CLASE_MD}`, content: lesson.bodyMarkdown.endsWith('\n') ? lesson.bodyMarkdown : `${lesson.bodyMarkdown}\n` },
  ];
}

/* ---------------- Marcador del Issue ---------------- */

/** Etiqueta `class:<id>`; GitHub limita las etiquetas a 50 caracteres. */
export function classLabel(id: string): string {
  const direct = `class:${id}`;
  return direct.length <= 50 ? direct : `class:h-${fnv1a(id)}${fnv1a([...id].reverse().join(''))}`;
}

export interface ClassMarkerData {
  repo: string;
  slug: string;
  sha: string;
  title: string;
  summary: string;
  level: string;
  tags: string[];
  skillIds: string[];
  componentIds: string[];
  videos: Array<Pick<LessonVideo, 'id' | 'kind' | 'youtubeId' | 'title'>>;
  createdAt: string;
  updatedAt: string;
  contentHash: string;
}

export interface ClassMarker {
  kind: 'class';
  /** Etiquetas que debe aplicar el workflow del repo catálogo. */
  labels: string[];
  data: ClassMarkerData;
}

const MARKER_RE = /<!--\s*codice:v1\s+(\{[\s\S]*?\})\s*-->/;

/** Marcador `<!-- codice:v1 {...} -->`. `<` y `>` van escapados: nada del JSON puede cerrar el comentario. */
export function buildClassMarker(lesson: Lesson, where: { repo: string; sha: string }): string {
  const marker: ClassMarker = {
    kind: 'class',
    labels: ['class', classLabel(lesson.id)],
    data: {
      repo: where.repo,
      slug: lesson.id,
      sha: where.sha,
      title: lesson.title,
      summary: lesson.summary,
      level: lesson.level,
      tags: lesson.tags,
      skillIds: lesson.skillIds,
      componentIds: lesson.componentIds,
      videos: plainVideos(lesson.videos),
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt,
      contentHash: contentHash(lesson),
    },
  };
  const json = JSON.stringify(marker).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
  return `<!-- codice:v1 ${json} -->`;
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Lee el marcador de una clase. Devuelve `null` si no existe o no es de tipo `class`. */
export function readClassMarker(body: string | null | undefined): ClassMarker | null {
  if (!body || body.length > MAX_MARKER_BODY) return null;
  const m = MARKER_RE.exec(body);
  if (!m) return null;
  try {
    const parsed: unknown = JSON.parse(m[1]);
    if (!isRecord(parsed) || parsed.kind !== 'class' || !isRecord(parsed.data)) return null;
    return parsed as unknown as ClassMarker;
  } catch {
    return null;
  }
}

/* ---------------- Clases de otras personas ---------------- */

/** Lo mínimo que se lee de un Issue de GitHub. */
export interface GhClassIssue {
  number: number;
  html_url: string;
  body: string | null;
  user: { login: string; avatar_url?: string } | null;
  pull_request?: unknown;
}

const ISSUE_URL = /^https:\/\/github\.com\/[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+\/issues\/\d+$/;
const HASH8 = /^[0-9a-f]{8}$/;

/**
 * Convierte un Issue `[class]` en una clase de Comunidad (sin cuerpo), o `null` si no es de fiar.
 * La autoría es la de quien abrió el Issue y solo vale si el repo del marcador es SU `codice-skills`:
 * así nadie publica una clase «a nombre de» otra persona apuntando a su repo.
 */
export function toCommunityLesson(issue: GhClassIssue, now: Date = new Date()): CommunityLesson | null {
  if (!isRecord(issue) || issue.pull_request) return null;
  if (!Number.isSafeInteger(issue.number) || issue.number < 1) return null;
  const login = issue.user?.login;
  if (!isValidLogin(login)) return null;
  if (typeof issue.html_url !== 'string' || !ISSUE_URL.test(issue.html_url)) return null;

  const marker = readClassMarker(issue.body);
  if (!marker) return null;
  const data: Record<string, unknown> = marker.data as unknown as Record<string, unknown>;

  const repo = typeof data.repo === 'string' ? data.repo : '';
  if (repo.toLowerCase() !== `${login}/${SHARE_REPO_NAME}`.toLowerCase()) return null;
  if (!isValidLessonId(data.slug) || !isGitSha(data.sha)) return null;
  if (typeof data.contentHash !== 'string' || !HASH8.test(data.contentHash)) return null;

  const meta = sanitizeLessonMeta(
    {
      id: data.slug,
      title: data.title,
      summary: data.summary,
      level: data.level,
      tags: data.tags,
      skillIds: data.skillIds,
      componentIds: data.componentIds,
      videos: data.videos,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      // La autoría sale del Issue, no del marcador.
      author: { login, avatarUrl: issue.user?.avatar_url },
    },
    now
  );
  if (!meta) return null;

  const { shared: _shared, ...rest } = meta;
  const canonicalRepo = `${login}/${SHARE_REPO_NAME}`;
  return {
    ...rest,
    repo: canonicalRepo,
    sha: data.sha as string,
    issueNumber: issue.number,
    issueUrl: issue.html_url,
    repoUrl: `https://github.com/${canonicalRepo}`,
    contentHash: data.contentHash,
  };
}

const byteLength = (text: string) => new TextEncoder().encode(text).length;

/**
 * Completa una clase de Comunidad con los archivos leídos en el commit fijado. Los archivos mandan
 * sobre el marcador (el marcador solo sirve para la lista). Devuelve `null` si algo no es válido.
 */
export function withSharedFiles(base: CommunityLesson, files: { json: string; markdown: string }, now: Date = new Date()): CommunityLesson | null {
  if (typeof files.json !== 'string' || typeof files.markdown !== 'string') return null;
  if (byteLength(files.json) > MAX_CLASE_JSON_BYTES || byteLength(files.markdown) > MAX_CLASE_MD_BYTES) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(files.json);
  } catch {
    return null;
  }
  if (!isRecord(parsed) || parsed.format !== CLASS_FORMAT) return null;
  const body = sanitizeBody(files.markdown);
  if (body.trim() === '') return null;
  const meta = sanitizeLessonMeta(
    {
      id: base.id,
      title: parsed.title,
      summary: parsed.summary,
      level: parsed.level,
      tags: parsed.tags,
      skillIds: parsed.skillIds,
      componentIds: parsed.componentIds,
      videos: parsed.videos,
      author: base.author,
      createdAt: base.createdAt,
      updatedAt: base.updatedAt,
    },
    now
  );
  if (!meta) return null;
  return {
    ...base,
    title: meta.title,
    summary: meta.summary,
    level: meta.level,
    tags: meta.tags,
    skillIds: meta.skillIds,
    componentIds: meta.componentIds,
    videos: meta.videos,
    bodyMarkdown: body,
    contentHash: contentHash({ ...meta, bodyMarkdown: body }),
  };
}
