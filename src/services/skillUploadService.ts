import type { LocalSkillFile } from '../types/catalog';

/**
 * Lectura y validación de una skill que está en el equipo local (un `.md` o una carpeta)
 * antes de subirla a GitHub. No habla con la red: solo decide qué archivos se publicarían y
 * detiene lo que no debe subirse (secretos, archivos enormes, rutas peligrosas).
 */

export const UPLOAD_LIMITS = {
  maxFiles: 50,
  maxFileBytes: 1_000_000,
  maxTotalBytes: 5_000_000,
} as const;

/** Nombre de carpeta en el repo: minúsculas, números y guiones; sin guion al inicio ni al final. */
export const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;

export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UploadError';
  }
}

/** Lo mínimo que se necesita de un `File`; así también se prueba en Node sin navegador. */
export interface LocalFileLike {
  size: number;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export interface LocalInputFile {
  file: LocalFileLike;
  /** `webkitRelativePath` de una carpeta, o el nombre si es un archivo suelto. */
  relativePath: string;
}

export interface LocalSkillDraft {
  suggestedSlug: string;
  name?: string;
  description?: string;
  files: LocalSkillFile[];
  totalBytes: number;
  /** Avisos que no impiden subir. */
  warnings: string[];
  /** Rutas que se dejaron fuera a propósito. */
  ignored: string[];
}

const IGNORED_SEGMENTS = new Set(['.git', 'node_modules', '.DS_Store', 'Thumbs.db', '__MACOSX']);
const SCRIPT_EXT = /\.(sh|bash|zsh|ps1|psm1|bat|cmd|py|rb|pl|php|js|mjs|cjs|ts|exe|dll|so|jar|vbs)$/i;

/** Patrones de credenciales muy reconocibles. Se detiene la subida; nunca se muestra el valor. */
const SECRET_PATTERNS: Array<{ label: string; re: RegExp }> = [
  { label: 'una clave privada', re: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP |ENCRYPTED )?PRIVATE KEY-----/ },
  { label: 'un token de GitHub', re: /\bgh[pousr]_[A-Za-z0-9]{30,}\b/ },
  { label: 'un token de GitHub', re: /\bgithub_pat_[A-Za-z0-9_]{40,}\b/ },
  { label: 'una clave de acceso de AWS', re: /\bAKIA[0-9A-Z]{16}\b/ },
  { label: 'una clave de API (sk-…)', re: /\bsk-[A-Za-z0-9_-]{32,}\b/ },
  { label: 'un token de Slack', re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ },
  { label: 'una clave de Google', re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
];

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\.md$/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
    .replace(/-+$/g, '');
}

export function isValidSlug(slug: string): boolean {
  return SLUG_RE.test(slug);
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/** `true` si parece texto: sin bytes nulos al principio. */
function isLikelyText(bytes: Uint8Array): boolean {
  const n = Math.min(bytes.length, 8000);
  for (let i = 0; i < n; i++) if (bytes[i] === 0) return false;
  return true;
}

/** Devuelve la descripción de la primera credencial encontrada, o `null`. */
export function findSecret(text: string): string | null {
  for (const { label, re } of SECRET_PATTERNS) if (re.test(text)) return label;
  return null;
}

function parseFrontmatter(md: string): Record<string, string> {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(md.replace(/^﻿/, ''));
  const out: Record<string, string> = {};
  if (!m) return out;
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z_-]+):\s*(.*)$/.exec(line);
    if (kv) out[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '');
  }
  return out;
}

function normalizePath(raw: string): string {
  const p = raw.replace(/\\/g, '/').replace(/^(\.\/)+/, '');
  if (!p || p.startsWith('/') || /^[A-Za-z]:/.test(p)) {
    throw new UploadError(`La ruta "${raw}" no es válida.`);
  }
  const segments = p.split('/');
  if (segments.some((s) => s === '' || s === '.' || s === '..')) {
    throw new UploadError(`La ruta "${raw}" no es válida.`);
  }
  return p;
}

const baseName = (p: string): string => p.slice(p.lastIndexOf('/') + 1);
const dirName = (p: string): string => (p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '');

/**
 * Lee la selección del usuario y la convierte en una skill publicable.
 * - Un solo `.md`: se sube como `SKILL.md`.
 * - Una carpeta: debe contener un `SKILL.md` (en la raíz o en una subcarpeta); lo demás de esa
 *   carpeta viaja con él.
 */
export async function readLocalSkill(input: LocalInputFile[]): Promise<LocalSkillDraft> {
  if (input.length === 0) throw new UploadError('No se seleccionó ningún archivo.');

  const warnings: string[] = [];
  const ignored: string[] = [];
  const candidates: Array<{ path: string; file: LocalFileLike }> = [];

  for (const { file, relativePath } of input) {
    const path = normalizePath(relativePath);
    const segments = path.split('/');
    const name = baseName(path);
    if (segments.some((s) => IGNORED_SEGMENTS.has(s))) {
      ignored.push(path);
    } else if (name.startsWith('.env')) {
      ignored.push(path);
      warnings.push(`Se dejó fuera ${path}: los archivos .env pueden tener credenciales.`);
    } else {
      candidates.push({ path, file });
    }
  }
  if (candidates.length === 0) throw new UploadError('No quedó ningún archivo para subir.');

  let selected: Array<{ path: string; file: LocalFileLike }>;
  let folderHint = '';

  if (input.length === 1 && /\.md$/i.test(candidates[0].path)) {
    // Archivo suelto: es el SKILL.md de la skill, se llame como se llame.
    const only = candidates[0];
    folderHint = baseName(only.path);
    selected = [{ path: 'SKILL.md', file: only.file }];
  } else {
    const skillMds = candidates.filter((c) => baseName(c.path).toLowerCase() === 'skill.md');
    if (skillMds.length === 0) {
      throw new UploadError('No encuentro un SKILL.md. La skill necesita ese archivo en su carpeta.');
    }
    if (skillMds.length > 1) {
      throw new UploadError(
        'Hay varios SKILL.md en la selección. Elige la carpeta de una sola skill (o sube una a la vez).'
      );
    }
    const root = dirName(skillMds[0].path);
    folderHint = root ? baseName(root) : '';
    const prefix = root ? `${root}/` : '';
    const inside = candidates.filter((c) => c.path.startsWith(prefix));
    const outside = candidates.length - inside.length;
    if (outside > 0) {
      warnings.push(`${outside} archivo(s) fuera de la carpeta de la skill no se subirán.`);
    }
    selected = inside.map((c) => {
      const rel = c.path.slice(prefix.length);
      return { path: baseName(rel).toLowerCase() === 'skill.md' && !rel.includes('/') ? 'SKILL.md' : rel, file: c.file };
    });
  }

  if (selected.length > UPLOAD_LIMITS.maxFiles) {
    throw new UploadError(`La skill tiene ${selected.length} archivos; el máximo es ${UPLOAD_LIMITS.maxFiles}.`);
  }

  const files: LocalSkillFile[] = [];
  let totalBytes = 0;
  let skillMd = '';
  let hasScripts = false;
  for (const { path, file } of selected) {
    if (file.size > UPLOAD_LIMITS.maxFileBytes) {
      throw new UploadError(
        `${path} pesa ${(file.size / 1_000_000).toFixed(1)} MB; el máximo por archivo es ${UPLOAD_LIMITS.maxFileBytes / 1_000_000} MB.`
      );
    }
    totalBytes += file.size;
    if (totalBytes > UPLOAD_LIMITS.maxTotalBytes) {
      throw new UploadError(`La skill supera ${UPLOAD_LIMITS.maxTotalBytes / 1_000_000} MB en total.`);
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (isLikelyText(bytes)) {
      const text = new TextDecoder('utf-8').decode(bytes);
      const secret = findSecret(text);
      if (secret) {
        throw new UploadError(`${path} parece contener ${secret}. Quítalo antes de subir: el repo será público.`);
      }
      if (path === 'SKILL.md') skillMd = text;
    }
    if (SCRIPT_EXT.test(path)) hasScripts = true;
    files.push({ path, sizeBytes: bytes.length, base64: bytesToBase64(bytes) });
  }

  if (!skillMd.trim()) throw new UploadError('El SKILL.md está vacío.');
  if (hasScripts) {
    warnings.push('Incluye scripts: el auditor del catálogo lo marcará y quien instale verá una advertencia.');
  }

  const fm = parseFrontmatter(skillMd);
  if (!fm.name) warnings.push('El SKILL.md no tiene `name` en su frontmatter.');
  if (!fm.description) warnings.push('El SKILL.md no tiene `description` en su frontmatter: la tarjeta saldrá sin descripción.');

  files.sort((a, b) => Number(b.path === 'SKILL.md') - Number(a.path === 'SKILL.md') || a.path.localeCompare(b.path));

  return {
    suggestedSlug: slugify(fm.name ?? '') || slugify(folderHint) || 'skill',
    name: fm.name || undefined,
    description: fm.description || undefined,
    files,
    totalBytes,
    warnings,
    ignored,
  };
}
