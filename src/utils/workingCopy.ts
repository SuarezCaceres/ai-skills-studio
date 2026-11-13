import type { CatalogSkill } from '../types/catalog';
import type { RarArchivePackage, RarFileEntry } from '../types/workspace';
import type { SkillDocument, UIComponentSpec } from '../types/skill';
import {
  computeLanguageBreakdown,
  detectCodeLanguage,
  extractColorsFromFiles,
  isSupportedTextFilename,
} from '../services/rarParserService';
import { isValidSkillDocumentArray } from './securityHardening';

/**
 * Copias de trabajo: una skill del equipo traída al navegador para usarla en los módulos
 * del estudio (Workspace, Componentes, Capturas y Modelos). Lo que se hace en ellos queda
 * guardado aquí, en `localStorage`, ligado al id de la skill del catálogo.
 */
export const WORKING_COPIES_KEY = 'ai_skills_studio_workcopies_v1';

/** Máximo de archivos y tamaño de cada uno que se traen al Workspace desde GitHub. */
export const MAX_COPY_FILES = 12;
export const MAX_COPY_FILE_BYTES = 100_000;

export const workingCopyId = (catalogId: string): string => `team:${catalogId}`;

export function defaultUiSpec(title: string): UIComponentSpec {
  return {
    id: `spec-${Date.now()}`,
    type: 'menubar',
    title,
    theme: 'cyan',
    items: [
      {
        id: 'skill',
        label: 'Skill',
        shortcut: 'Alt+S',
        checked: true,
        children: [
          { id: 'open-md', label: 'Abrir SKILL.md', shortcut: 'Ctrl+O', checked: true },
          { id: 'translate', label: 'Traducir al español', shortcut: 'Ctrl+T' },
        ],
      },
      {
        id: 'verify',
        label: 'Verificación',
        shortcut: 'Alt+V',
        children: [
          { id: 'audit', label: 'Revisar con el auditor', shortcut: 'F5' },
          { id: 'diff', label: 'Ver diff en vivo', shortcut: 'F6' },
        ],
      },
    ],
  };
}

/** Skill transitoria para usar el Workspace con un .zip o carpeta suelto, sin guardar nada. */
export function createScratchSkill(): SkillDocument {
  return {
    id: 'scratch-workspace',
    filename: 'SKILL.md',
    name: 'Workspace suelto',
    summary: 'Paquete o carpeta montado en memoria. No se guarda.',
    category: 'Workspace VFS',
    level: 'Intermedio',
    kind: 'proyecto',
    tags: [],
    language: 'en',
    markdownContent: '',
    updatedAt: new Date().toISOString(),
    ficha: { whereToUse: 'Workspace VFS', requirements: '', estimatedTime: '', collaborators: [] },
    uiSpec: defaultUiSpec('Workspace'),
    models: [],
    screenshots: [],
    codeSnippets: [],
  };
}

export interface FetchedSkillFile {
  /** Ruta relativa dentro de la carpeta de la skill. */
  path: string;
  content: string;
}

/** Archivos de la skill que valen la pena montar en el Workspace (texto compatible y pequeño). */
export function pickWorkspaceFiles(skill: CatalogSkill): string[] {
  const wanted = skill.files
    .filter((f) => {
      const name = f.path.split('/').pop() ?? f.path;
      return f.sizeBytes > 0 && f.sizeBytes <= MAX_COPY_FILE_BYTES && isSupportedTextFilename(name);
    })
    .map((f) => f.path);
  // SKILL.md primero: es lo que el estudio abre por defecto.
  wanted.sort((a, b) => Number(b === 'SKILL.md') - Number(a === 'SKILL.md') || a.localeCompare(b));
  return wanted.slice(0, MAX_COPY_FILES);
}

/** Monta los archivos descargados de la skill como paquete del Workspace. */
export function buildWorkspacePackage(skill: CatalogSkill, files: FetchedSkillFile[]): RarArchivePackage {
  const entries: RarFileEntry[] = files.map((f, i) => {
    const parts = f.path.split('/');
    const name = parts[parts.length - 1];
    return {
      id: `wc-${i}-${f.path}`,
      name,
      path: f.path,
      folder: parts.length > 1 ? parts.slice(0, -1).join('/') : 'root',
      sizeBytes: new Blob([f.content]).size,
      language: detectCodeLanguage(name),
      content: f.content,
      originalContent: f.content,
    };
  });
  return {
    id: `wks-team-${skill.id}`,
    archiveName: skill.name,
    uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    totalSizeBytes: entries.reduce((sum, e) => sum + e.sizeBytes, 0),
    signatureDetected: `Copia de ${skill.repo} (${entries.length} archivos de texto)`,
    sourceKind: 'folder',
    files: entries,
    metadata: {
      aiModelId: 'claude-opus-55',
      aiModelLabel: 'Claude Opus · Opus 5.5',
      appliedSkill: skill.name,
      predominantLanguages: computeLanguageBreakdown(entries),
      colorPalette: extractColorsFromFiles(entries),
    },
  };
}

/** Convierte una skill del catálogo en el documento que usan los módulos del estudio. */
export function catalogSkillToDocument(skill: CatalogSkill, pkg: RarArchivePackage): SkillDocument {
  const now = new Date().toISOString();
  const mainMd = pkg.files.find((f) => f.path === 'SKILL.md')?.content ?? skill.markdown;
  return {
    id: workingCopyId(skill.id),
    filename: 'SKILL.md',
    name: skill.name,
    summary: skill.description || `Skill de ${skill.repo}`,
    category: skill.category,
    level: 'Intermedio',
    kind: 'guia',
    tags: [`#${skill.category}`, '#equipo', `#${skill.uploadedBy.login}`],
    language: 'en',
    markdownContent: mainMd,
    updatedAt: now,
    ficha: {
      whereToUse: `Copia de trabajo de ${skill.repo}`,
      requirements: 'Ninguno: la copia vive en tu navegador.',
      estimatedTime: 'Lista para usar',
      collaborators: [`@${skill.uploadedBy.login}`],
    },
    uiSpec: defaultUiSpec(skill.name),
    models: [],
    screenshots: [],
    codeSnippets: [],
    aiModelLabel: pkg.metadata.aiModelLabel,
    appliedSkill: skill.name,
    predominantLanguages: pkg.metadata.predominantLanguages,
    colorPalette: pkg.metadata.colorPalette,
    rarPackage: pkg,
    origin: {
      catalogId: skill.id,
      repo: skill.repo,
      skillPath: skill.skillPath,
      commitSha: skill.commitSha,
      uploadedByLogin: skill.uploadedBy.login,
      uploadedByAvatarUrl: skill.uploadedBy.avatarUrl,
      uploadedByProfileUrl: skill.uploadedBy.profileUrl,
      fetchedAt: now,
    },
  };
}

/**
 * Añade o actualiza una copia. Si ya existía se conserva el trabajo de la persona
 * (modelos, capturas, componentes y ediciones del paquete) y solo se refresca si el commit cambió.
 */
export function upsertWorkingCopy(list: SkillDocument[], fresh: SkillDocument): SkillDocument[] {
  const existing = list.find((s) => s.id === fresh.id);
  if (!existing) return [fresh, ...list];
  const sameCommit = existing.origin?.commitSha === fresh.origin?.commitSha;
  const merged: SkillDocument = sameCommit
    ? { ...existing, origin: fresh.origin }
    : { ...fresh, models: existing.models, screenshots: existing.screenshots, codeSnippets: existing.codeSnippets, uiSpec: existing.uiSpec };
  return [merged, ...list.filter((s) => s.id !== fresh.id)];
}

export function loadWorkingCopies(): SkillDocument[] {
  try {
    const raw = localStorage.getItem(WORKING_COPIES_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => isValidSkillDocumentArray([item])) as SkillDocument[];
  } catch {
    return [];
  }
}

export function saveWorkingCopies(list: SkillDocument[]): void {
  try {
    localStorage.setItem(WORKING_COPIES_KEY, JSON.stringify(list));
  } catch {
    // Cuota de almacenamiento llena o sin acceso: la copia sigue viva en memoria.
  }
}
