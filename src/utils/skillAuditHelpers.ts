import type { SkillAuditFinding } from '../types/catalog';

/** Tope máximo de previsualización de archivos bajo demanda en el detalle (512 KB). */
export const MAX_FILE_PREVIEW_BYTES = 512 * 1024;

const YAML_FRONTMATTER_BLOCK_RE = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;
const FRONTMATTER_NAME_RE = /(?:^|\n)[ \t]*name:[ \t]*\S+/;
const FRONTMATTER_DESCRIPTION_RE = /(?:^|\n)[ \t]*description:/;
const CONTROL_CHAR_RE = /[\u0000-\u001f\u007f]/;

/** Extensiones de binarios ejecutables (riesgo alto en auditoría). */
export const EXECUTABLE_BINARY_EXT_RE = /\.(exe|dll|msi|bin|jar|so|dylib|scr|com)$/i;

/** Extensiones binarias o multimedia no textuales que no deben descargarse como texto plano. */
const NON_TEXT_BINARY_EXT_RE =
  /\.(exe|dll|msi|bin|jar|so|dylib|scr|com|png|jpe?g|gif|webp|ico|bmp|avif|pdf|zip|rar|tar|gz|tgz|7z|woff2?|ttf|otf|eot|mp3|mp4|webm|wav|ogg|wasm|pyc|pyo|class|o|a|lib|node)$/i;

/**
 * Comprueba que el `SKILL.md` tenga bloque frontmatter YAML inicial con `name` y `description`.
 * Equivalente puro extraído de `auditWorkspacePackage` (`rarParserService`).
 */
export function hasValidSkillFrontmatter(markdown: string): boolean {
  if (typeof markdown !== 'string') return false;
  const match = YAML_FRONTMATTER_BLOCK_RE.exec(markdown.trim());
  if (!match) return false;
  const block = match[1].replace(/\r\n?/g, '\n');
  return FRONTMATTER_NAME_RE.test(block) && FRONTMATTER_DESCRIPTION_RE.test(block);
}

/**
 * Valida que la ruta relativa de un archivo dentro de una skill sea segura
 * (sin espacios externos, caracteres de control, `..`, barras invertidas, rutas absolutas ni segmentos vacíos o `.`).
 */
export function isSafeSkillFilePath(filePath: string): boolean {
  if (typeof filePath !== 'string' || !filePath || filePath !== filePath.trim()) return false;
  if (CONTROL_CHAR_RE.test(filePath)) return false;
  if (filePath.includes('\\') || filePath.includes('..')) return false;
  if (filePath.startsWith('/') || /^[a-zA-Z]:/.test(filePath)) return false;
  const segments = filePath.split('/');
  return segments.every((seg) => seg.length > 0 && seg !== '.' && seg !== '..');
}

/** Devuelve la primera ruta insegura detectada en la lista de archivos, o `undefined`. */
export function findUnsafeSkillFilePath(
  files: ReadonlyArray<{ path: string }>
): string | undefined {
  return files.find((f) => !isSafeSkillFilePath(f.path))?.path;
}

/** Indica si el archivo corresponde a un binario ejecutable. */
export function isExecutableBinarySkillFile(filePath: string): boolean {
  return typeof filePath === 'string' && EXECUTABLE_BINARY_EXT_RE.test(filePath.trim());
}

/** Indica si el archivo corresponde a una extensión binaria/no textual no previsualizable. */
export function isBinarySkillFile(filePath: string): boolean {
  return typeof filePath === 'string' && NON_TEXT_BINARY_EXT_RE.test(filePath.trim());
}

export type FilePreviewValidation =
  | { previewable: true }
  | {
      previewable: false;
      reason: 'unsafe_path' | 'binary' | 'too_large';
      message: string;
    };

/**
 * Valida antes de solicitar red a GitHub si un archivo de la pestaña «Archivos» puede
 * descargarse y mostrarse como texto plano inerte dentro del límite de 512 KB.
 */
export function validateSkillFilePreview(file: {
  path: string;
  sizeBytes: number;
}): FilePreviewValidation {
  if (!isSafeSkillFilePath(file.path)) {
    return {
      previewable: false,
      reason: 'unsafe_path',
      message: 'Ruta de archivo bloqueada por validación de seguridad.',
    };
  }
  if (isBinarySkillFile(file.path)) {
    return {
      previewable: false,
      reason: 'binary',
      message:
        'Archivo binario o multimedia no textual: no se previsualiza aquí. Ábrelo en GitHub en el commit exacto.',
    };
  }
  if (!Number.isFinite(file.sizeBytes) || file.sizeBytes < 0) {
    return {
      previewable: false,
      reason: 'too_large',
      message:
        'Tamaño de archivo inválido para previsualización. Ábrelo en GitHub en el commit exacto.',
    };
  }
  if (file.sizeBytes > MAX_FILE_PREVIEW_BYTES) {
    return {
      previewable: false,
      reason: 'too_large',
      message:
        'El archivo supera el límite de previsualización (512 KB). Ábrelo en GitHub en el commit exacto.',
    };
  }
  return { previewable: true };
}

/**
 * Hallazgos estructurales de `SKILL.md` y rutas seguras para `AuditBadge`,
 * desacoplados de `rarParserService` y `RarArchivePackage`.
 */
export function auditSkillStructure(
  markdown: string,
  files: ReadonlyArray<{ path: string }>
): SkillAuditFinding[] {
  const findings: SkillAuditFinding[] = [];

  if (!hasValidSkillFrontmatter(markdown)) {
    findings.push({
      id: 'skill-frontmatter',
      severity: 'warn',
      label: 'SKILL.md sin cabecera válida',
      detail: 'SKILL.md sin cabecera YAML (name, description).',
      filePath: 'SKILL.md',
    });
  }

  const unsafePath = findUnsafeSkillFilePath(files);
  if (unsafePath !== undefined) {
    findings.push({
      id: 'path-safety',
      severity: 'danger',
      label: 'Ruta de archivo sospechosa',
      detail: `Secuencia inválida en ${unsafePath}.`,
    });
  }

  return findings;
}
