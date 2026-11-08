import {
  RarArchivePackage,
  RarFileEntry,
  CodeLanguage,
  LanguageBreakdownItem,
} from '../types/workspace';
import {
  validateUploadFile,
  sanitizeArchiveFilePath,
  sanitizeUserText,
} from '../utils/securityHardening';

const MAX_ARCHIVE_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB strict security boundary (TB-02)
const MAX_VFS_FILES = 120;
const MAX_SINGLE_TEXT_FILE_BYTES = 1.5 * 1024 * 1024;

const ALLOWED_WORKSPACE_EXTENSIONS = [
  '.zip',
  '.skillbundle',
  '.rar',
  '.md',
  '.ts',
  '.tsx',
  '.css',
  '.json',
  '.html',
];

const IGNORED_DIRECTORY_SEGMENTS = new Set([
  'node_modules',
  '.git',
  'dist',
  '.next',
  'out',
  '.cache',
  '.taste-skill',
]);

const LANGUAGE_META: Record<CodeLanguage, { label: string; color: string }> = {
  tsx: { label: 'React TSX', color: '#0EA5E9' },
  typescript: { label: 'TypeScript', color: '#38BDF8' },
  css: { label: 'CSS System', color: '#10B981' },
  markdown: { label: 'SKILL Markdown', color: '#F59E0B' },
  json: { label: 'JSON Config', color: '#94A3B8' },
  html: { label: 'HTML5', color: '#EF4444' },
};

export function detectCodeLanguage(filename: string): CodeLanguage {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.tsx') || lower.endsWith('.jsx')) return 'tsx';
  if (lower.endsWith('.ts') || lower.endsWith('.js') || lower.endsWith('.mjs')) return 'typescript';
  if (lower.endsWith('.css') || lower.endsWith('.scss')) return 'css';
  if (lower.endsWith('.json')) return 'json';
  if (lower.endsWith('.html') || lower.endsWith('.svg')) return 'html';
  return 'markdown';
}

export function isSupportedTextFilename(filename: string): boolean {
  const lower = filename.toLowerCase();
  return /\.(tsx|jsx|ts|js|mjs|css|scss|json|md|markdown|txt|html|yml|yaml)$/i.test(lower);
}

export function computeLanguageBreakdown(files: RarFileEntry[]): LanguageBreakdownItem[] {
  const totalsByLang: Record<CodeLanguage, number> = {
    tsx: 0,
    typescript: 0,
    css: 0,
    markdown: 0,
    json: 0,
    html: 0,
  };

  let totalBytes = 0;
  for (const file of files) {
    const size = Math.max(file.sizeBytes, 80);
    totalsByLang[file.language] = (totalsByLang[file.language] || 0) + size;
    totalBytes += size;
  }

  if (totalBytes === 0) {
    return [
      { language: 'SKILL Markdown', extension: 'markdown', percentage: 44, bytes: 4400, color: '#F59E0B' },
      { language: 'React TSX', extension: 'tsx', percentage: 34, bytes: 3400, color: '#0EA5E9' },
      { language: 'TypeScript', extension: 'typescript', percentage: 22, bytes: 2200, color: '#38BDF8' },
    ];
  }

  const items: LanguageBreakdownItem[] = (Object.keys(totalsByLang) as CodeLanguage[])
    .filter((ext) => totalsByLang[ext] > 0)
    .map((ext) => ({
      language: LANGUAGE_META[ext].label,
      extension: ext,
      bytes: totalsByLang[ext],
      percentage: Math.max(1, Math.round((totalsByLang[ext] / totalBytes) * 100)),
      color: LANGUAGE_META[ext].color,
    }))
    .sort((a, b) => b.bytes - a.bytes);

  const sum = items.reduce((acc, item) => acc + item.percentage, 0);
  if (items.length > 0 && sum !== 100) {
    items[0].percentage = Math.max(1, items[0].percentage + (100 - sum));
  }

  return items;
}

export function extractColorsFromFiles(files: RarFileEntry[]): string[] {
  const foundHex = new Set<string>();
  const hexRegex = /#[0-9A-Fa-f]{6}\b/g;

  for (const file of files) {
    if (file.language === 'css' || file.language === 'tsx' || file.language === 'json') {
      const matches = file.content.match(hexRegex);
      if (matches) {
        for (const m of matches) {
          foundHex.add(m.toUpperCase());
        }
      }
    }
  }

  const defaults = ['#0A0D14', '#121722', '#F1F5F9', '#0EA5E9', '#10B981'];
  for (const d of defaults) {
    if (foundHex.size < 5) {
      foundHex.add(d);
    }
  }

  return Array.from(foundHex).slice(0, 6);
}

const DEFAULT_SKILL_MD = `---
name: design-taste-frontend
description: >-
  Construye interfaces web con jerarquía clara, una sección por pantalla, bordes simétricos,
  iconos reales a color y cero lenguaje genérico de plantilla.
---

# Directivas del Sistema de Interfaz (TasteSkill 2.5)

## Reglas de Ingeniería Visual
1. Una sección por pantalla en páginas de producto (\`100svh\`), con bordes izquierdo y derecho idénticos (\`.wrap\`).
2. Interfaz 90-95% neutral en carbón (\`#0A0D14\` y \`#121722\`), un único acento funcional (\`#0EA5E9\`) y prohibición estricta de tonos violetas.
3. Mostrar siempre la herramienta real funcionando en un \`app-frame\` HTML en vivo, nunca capturas simuladas.
4. Dos niveles de profundidad máxima: tarjeta y panel; nunca cajas dentro de cajas para texto.

## Reglas de Copy Técnico
- El titular \`h1\` nombra la categoría y el usuario objetivo en 2 a 8 palabras, acompañado de un dato verificable.
- Cada botón inicia con un verbo en imperativo seguido del objeto (\`Abrir Workspace\`, \`Exportar ZIP\`).
- Presupuesto estricto de 60 a 80 palabras por pantalla fuera de paneles de interfaz.`;

const DEFAULT_FILES_RAW: Omit<RarFileEntry, 'originalContent'>[] = [
  {
    id: 'vfs-1',
    name: 'SKILL.md',
    path: 'skills/design-taste-frontend/SKILL.md',
    folder: 'skills/design-taste-frontend',
    sizeBytes: new TextEncoder().encode(DEFAULT_SKILL_MD).length,
    language: 'markdown',
    content: DEFAULT_SKILL_MD,
  },
  {
    id: 'vfs-2',
    name: 'skillManifestAuditor.ts',
    path: 'src/services/skillManifestAuditor.ts',
    folder: 'src/services',
    sizeBytes: 1840,
    language: 'typescript',
    content: `export interface AuditFinding {
  ruleId: string;
  severity: 'error' | 'warn' | 'ok';
  message: string;
}

const SLOP_WORDS = ['seamless', 'elevate', 'delve', 'revolutionary', 'game-changing', 'tapestry'];
const VIOLET_HEX = /#(7c3aed|8b5cf6|a855f7|c084fc|9333ea|6d28d9)\\b/i;

export function verifySkillDocument(markdown: string, cssSources: string[]): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const hasFrontmatter = /^---\\s*[\\s\\S]+?name:\\s*\\S+[\\s\\S]+?---/.test(markdown);

  findings.push({
    ruleId: 'frontmatter-schema',
    severity: hasFrontmatter ? 'ok' : 'error',
    message: hasFrontmatter
      ? 'Frontmatter YAML válido con name y description.'
      : 'Falta bloque YAML inicial con name y description.',
  });

  const lower = markdown.toLowerCase();
  const hit = SLOP_WORDS.find((w) => lower.includes(w));
  findings.push({
    ruleId: 'copy-anti-slop',
    severity: hit ? 'warn' : 'ok',
    message: hit ? \`Término genérico detectado: "\${hit}".\` : 'Vocabulario técnico limpio.',
  });

  const hasViolet = cssSources.some((src) => VIOLET_HEX.test(src));
  findings.push({
    ruleId: 'palette-no-violet',
    severity: hasViolet ? 'error' : 'ok',
    message: hasViolet ? 'Tono violeta detectado en hojas de estilo.' : 'Paleta libre de tonos violeta.',
  });

  return findings;
}`,
  },
  {
    id: 'vfs-3',
    name: 'WorkspaceDiffFrame.tsx',
    path: 'src/components/WorkspaceDiffFrame.tsx',
    folder: 'src/components',
    sizeBytes: 1490,
    language: 'tsx',
    content: `import React from 'react';

interface DiffRow {
  lineNumber: number;
  kind: 'same' | 'add' | 'del';
  text: string;
}

export const WorkspaceDiffFrame: React.FC<{ rows: DiffRow[]; filename: string }> = ({
  rows,
  filename,
}) => {
  return (
    <div className="rounded border border-slate-800 bg-[#0A0D14] font-mono text-xs text-slate-200">
      <header className="flex items-center justify-between border-b border-slate-800 bg-[#121722] px-3 py-2">
        <span>{filename}</span>
        <span className="text-[#0EA5E9]">UTF-8 · LF</span>
      </header>
      <div className="divide-y divide-slate-900/60">
        {rows.map((row, index) => (
          <div
            key={index}
            className={
              row.kind === 'add'
                ? 'bg-emerald-950/35 text-emerald-200 px-3 py-0.5'
                : row.kind === 'del'
                  ? 'bg-rose-950/35 text-rose-200 px-3 py-0.5'
                  : 'px-3 py-0.5 text-slate-400'
            }
          >
            <span className="mr-3 inline-block w-6 select-none text-right opacity-50">
              {row.lineNumber}
            </span>
            <span>{row.kind === 'add' ? '+ ' : row.kind === 'del' ? '- ' : '  '}</span>
            <span>{row.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};`,
  },
  {
    id: 'vfs-4',
    name: 'tasteskill-tokens.css',
    path: 'src/styles/tasteskill-tokens.css',
    folder: 'src/styles',
    sizeBytes: 920,
    language: 'css',
    content: `:root {
  --p-bg: #0A0D14;
  --p-surface: #121722;
  --p-ink: #F1F5F9;
  --p-muted: #7E8288;
  --p-accent: #0EA5E9;
  --p-action: #0EA5E9;
  --r-sm: 4px;
  --r-md: 6px;
  --r-lg: 8px;
}

.workspace-surface {
  background-color: var(--p-surface);
  color: var(--p-ink);
  border: 1px solid rgba(241, 245, 249, 0.12);
  border-radius: var(--r-md);
}`,
  },
  {
    id: 'vfs-5',
    name: 'skill-bundle.json',
    path: 'config/skill-bundle.json',
    folder: 'config',
    sizeBytes: 640,
    language: 'json',
    content: `{
  "bundle": "codice-tasteskill-workspace",
  "version": "2.5.1",
  "format": "zip-vfs",
  "entrySkill": "skills/design-taste-frontend/SKILL.md",
  "targets": [".agents/skills", ".claude/skills"],
  "tokens": {
    "ground": "#0A0D14",
    "surface": "#121722",
    "accent": "#0EA5E9",
    "status": "#10B981"
  }
}`,
  },
];

const DEFAULT_FILES: RarFileEntry[] = DEFAULT_FILES_RAW.map((f) => ({
  ...f,
  originalContent: f.content,
}));

export const DEFAULT_RAR_PACKAGE: RarArchivePackage = {
  id: 'vfs-default-tasteskill-bundle',
  archiveName: 'codice-tasteskill-workspace.zip',
  uploadedAt: 'Sesión local activa',
  totalSizeBytes: DEFAULT_FILES.reduce((sum, f) => sum + f.sizeBytes, 0),
  signatureDetected: 'Workspace VFS en memoria · ZIP / Carpeta compatible',
  sourceKind: 'bundle',
  files: DEFAULT_FILES,
  metadata: {
    aiModelId: 'claude-opus-55',
    aiModelLabel: 'Claude Opus · Opus 5.5',
    appliedSkill: 'design-taste-frontend',
    predominantLanguages: computeLanguageBreakdown(DEFAULT_FILES),
    colorPalette: extractColorsFromFiles(DEFAULT_FILES),
  },
};

/* ==========================================================================
   REAL CLIENT-SIDE ZIP READER & WRITER (DataView + Web Compression Streams)
   ========================================================================== */

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

async function inflateRawBytes(compressed: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('DecompressionStream no está disponible en este navegador.');
  }
  const ds = new DecompressionStream('deflate-raw');
  const writer = ds.writable.getWriter();
  await writer.write(new Uint8Array(compressed));
  await writer.close();

  const reader = ds.readable.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      total += value.byteLength;
      if (total > MAX_SINGLE_TEXT_FILE_BYTES * 2) {
        throw new Error('Entrada comprimida excede el límite seguro en memoria.');
      }
    }
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

async function extractRealZipEntries(buffer: ArrayBuffer): Promise<RarFileEntry[]> {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const decoder = new TextDecoder('utf-8', { fatal: false });

  // Locate End of Central Directory (0x06054b50)
  let eocdOffset = -1;
  const minSearch = Math.max(0, bytes.length - 65557);
  for (let i = bytes.length - 22; i >= minSearch; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset === -1) {
    throw new Error('No se encontró el directorio central en el archivo .ZIP.');
  }

  const totalEntries = view.getUint16(eocdOffset + 10, true);
  const cdOffset = view.getUint32(eocdOffset + 16, true);

  const entries: RarFileEntry[] = [];
  let ptr = cdOffset;

  for (let idx = 0; idx < totalEntries && entries.length < MAX_VFS_FILES; idx++) {
    if (ptr + 46 > bytes.length || view.getUint32(ptr, true) !== 0x02014b50) {
      break;
    }

    const compressionMethod = view.getUint16(ptr + 10, true);
    const compressedSize = view.getUint32(ptr + 20, true);
    const uncompressedSize = view.getUint32(ptr + 24, true);
    const nameLen = view.getUint16(ptr + 28, true);
    const extraLen = view.getUint16(ptr + 30, true);
    const commentLen = view.getUint16(ptr + 32, true);
    const localHeaderOffset = view.getUint32(ptr + 42, true);

    const rawName = decoder.decode(bytes.subarray(ptr + 46, ptr + 46 + nameLen));
    ptr += 46 + nameLen + extraLen + commentLen;

    if (rawName.endsWith('/')) continue;
    const segments = rawName.split('/').filter(Boolean);
    if (segments.some((seg) => IGNORED_DIRECTORY_SEGMENTS.has(seg))) continue;
    if (!isSupportedTextFilename(rawName)) continue;
    if (uncompressedSize > MAX_SINGLE_TEXT_FILE_BYTES) continue;

    if (localHeaderOffset + 30 > bytes.length) continue;
    if (view.getUint32(localHeaderOffset, true) !== 0x04034b50) continue;

    const localNameLen = view.getUint16(localHeaderOffset + 26, true);
    const localExtraLen = view.getUint16(localHeaderOffset + 28, true);
    const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
    const dataEnd = dataStart + compressedSize;
    if (dataEnd > bytes.length) continue;

    const slice = bytes.subarray(dataStart, dataEnd);
    let rawContentBytes: Uint8Array | null = null;

    if (compressionMethod === 0) {
      rawContentBytes = slice;
    } else if (compressionMethod === 8) {
      try {
        rawContentBytes = await inflateRawBytes(slice);
      } catch {
        rawContentBytes = null;
      }
    }

    if (!rawContentBytes) continue;

    const safePath = sanitizeArchiveFilePath(rawName);
    const pathParts = safePath.split('/');
    const fileName = pathParts[pathParts.length - 1];
    const folder = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : 'root';
    const content = decoder.decode(rawContentBytes);

    entries.push({
      id: `zip-${Date.now()}-${idx}`,
      name: fileName,
      path: safePath,
      folder,
      sizeBytes: rawContentBytes.byteLength,
      language: detectCodeLanguage(fileName),
      content,
      originalContent: content,
    });
  }

  return entries;
}

export function exportWorkspaceAsZipBlob(pkg: RarArchivePackage): Blob {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const file of pkg.files) {
    const safePath = sanitizeArchiveFilePath(file.path || `${file.folder}/${file.name}`);
    const nameBytes = encoder.encode(safePath);
    const dataBytes = encoder.encode(file.content);
    const checksum = crc32(dataBytes);

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0x0800, true); // UTF-8 flag
    lv.setUint16(8, 0, true); // Store (0) for instant deterministic extraction
    lv.setUint16(10, 0, true);
    lv.setUint16(12, 0x5621, true);
    lv.setUint32(14, checksum, true);
    lv.setUint32(18, dataBytes.length, true);
    lv.setUint32(22, dataBytes.length, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0x5621, true);
    cv.setUint32(16, checksum, true);
    cv.setUint32(20, dataBytes.length, true);
    cv.setUint32(24, dataBytes.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);

    localParts.push(localHeader, dataBytes);
    centralParts.push(centralHeader);
    offset += localHeader.length + dataBytes.length;
  }

  const cdSize = centralParts.reduce((acc, p) => acc + p.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, pkg.files.length, true);
  ev.setUint16(10, pkg.files.length, true);
  ev.setUint32(12, cdSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  const allParts: BlobPart[] = [
    ...localParts.map((u) => new Uint8Array(u)),
    ...centralParts.map((u) => new Uint8Array(u)),
    new Uint8Array(eocd),
  ];
  return new Blob(allParts, { type: 'application/zip' });
}

/* ==========================================================================
   LOCAL FOLDER & MULTI-FILE INGESTION (File System Access API / webkitRelativePath)
   ========================================================================== */

export async function ingestFileListToWorkspace(
  rawFiles: { file: File; relativePath: string }[],
  workspaceLabel: string,
  currentModelLabel = 'Claude Opus · Opus 5.5',
  currentSkillName = 'design-taste-frontend'
): Promise<RarArchivePackage> {
  const entries: RarFileEntry[] = [];
  let totalBytes = 0;

  for (let i = 0; i < rawFiles.length && entries.length < MAX_VFS_FILES; i++) {
    const { file, relativePath } = rawFiles[i];
    if (file.size <= 0 || file.size > MAX_SINGLE_TEXT_FILE_BYTES) continue;

    const parts = relativePath.replace(/\\/g, '/').split('/').filter(Boolean);
    if (parts.some((seg) => IGNORED_DIRECTORY_SEGMENTS.has(seg))) continue;
    if (!isSupportedTextFilename(file.name)) continue;

    totalBytes += file.size;
    if (totalBytes > MAX_ARCHIVE_UPLOAD_BYTES) break;

    const text = await file.text();
    const safePath = sanitizeArchiveFilePath(relativePath);
    const safeParts = safePath.split('/');
    const name = safeParts[safeParts.length - 1];
    const folder = safeParts.length > 1 ? safeParts.slice(0, -1).join('/') : 'root';

    entries.push({
      id: `dir-${Date.now()}-${i}`,
      name,
      path: safePath,
      folder,
      sizeBytes: file.size,
      language: detectCodeLanguage(name),
      content: text,
      originalContent: text,
    });
  }

  if (entries.length === 0) {
    throw new Error(
      'La carpeta no contiene archivos de código o Markdown compatibles (.md, .ts, .tsx, .css, .json, .html).'
    );
  }

  const cleanName = sanitizeUserText(workspaceLabel, 80) || 'local-workspace';
  return {
    id: `wks-dir-${Date.now()}`,
    archiveName: cleanName,
    uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    totalSizeBytes: totalBytes,
    signatureDetected: `Carpeta local montada en VFS (${entries.length} archivos reales)`,
    sourceKind: 'folder',
    files: entries,
    metadata: {
      aiModelId: 'claude-opus-55',
      aiModelLabel: currentModelLabel,
      appliedSkill: currentSkillName,
      predominantLanguages: computeLanguageBreakdown(entries),
      colorPalette: extractColorsFromFiles(entries),
    },
  };
}

interface DirectoryPickerHandle {
  name: string;
  values: () => AsyncIterable<
    | { kind: 'file'; name: string; getFile: () => Promise<File> }
    | { kind: 'directory'; name: string; values: DirectoryPickerHandle['values'] }
  >;
}

export async function openLocalDirectoryWorkspace(
  currentModelLabel = 'Claude Opus · Opus 5.5',
  currentSkillName = 'design-taste-frontend'
): Promise<RarArchivePackage | null> {
  const pickerWin = window as unknown as {
    showDirectoryPicker?: () => Promise<DirectoryPickerHandle>;
  };

  if (typeof pickerWin.showDirectoryPicker !== 'function') {
    throw new Error(
      'Tu navegador no expone showDirectoryPicker; usa el botón "Seleccionar carpeta" para cargarla.'
    );
  }

  let rootHandle: DirectoryPickerHandle;
  try {
    rootHandle = await pickerWin.showDirectoryPicker();
  } catch {
    return null; // Cancelled by user
  }

  const collected: { file: File; relativePath: string }[] = [];

  const walk = async (dir: DirectoryPickerHandle, prefix: string, depth: number) => {
    if (depth > 5 || collected.length >= MAX_VFS_FILES) return;
    for await (const entry of dir.values()) {
      if (collected.length >= MAX_VFS_FILES) break;
      if (IGNORED_DIRECTORY_SEGMENTS.has(entry.name)) continue;
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.kind === 'file') {
        if (isSupportedTextFilename(entry.name)) {
          const f = await entry.getFile();
          collected.push({ file: f, relativePath: rel });
        }
      } else if (entry.kind === 'directory') {
        await walk(entry, rel, depth + 1);
      }
    }
  };

  await walk(rootHandle, '', 0);
  return ingestFileListToWorkspace(
    collected,
    rootHandle.name,
    currentModelLabel,
    currentSkillName
  );
}

/* ==========================================================================
   ARCHIVE / SINGLE-FILE PARSER (ZIP real + Single MD/TS/CSS + Legacy RAR Header)
   ========================================================================== */

export async function parseUploadedRarFile(
  file: File,
  currentModelLabel = 'Claude Opus · Opus 5.5',
  currentSkillName = 'design-taste-frontend'
): Promise<RarArchivePackage> {
  const validation = validateUploadFile(
    file,
    MAX_ARCHIVE_UPLOAD_BYTES,
    ALLOWED_WORKSPACE_EXTENSIONS
  );
  if (!validation.valid) {
    throw new Error(validation.error || 'Archivo rechazado por validación de seguridad.');
  }

  const lower = file.name.toLowerCase();

  // 1. Real .ZIP / .skillbundle extraction
  if (lower.endsWith('.zip') || lower.endsWith('.skillbundle')) {
    const buffer = await file.arrayBuffer();
    const extracted = await extractRealZipEntries(buffer);
    if (extracted.length === 0) {
      throw new Error('El paquete .ZIP no contiene archivos de texto o código legibles.');
    }
    return {
      id: `wks-zip-${Date.now()}`,
      archiveName: sanitizeUserText(file.name, 80),
      uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      totalSizeBytes: file.size,
      signatureDetected: `ZIP Deflate/Store verificado (${extracted.length} archivos reales)`,
      sourceKind: 'zip',
      files: extracted,
      metadata: {
        aiModelId: 'claude-opus-55',
        aiModelLabel: currentModelLabel,
        appliedSkill: currentSkillName,
        predominantLanguages: computeLanguageBreakdown(extracted),
        colorPalette: extractColorsFromFiles(extracted),
      },
    };
  }

  // 2. Direct text / Markdown / TypeScript / CSS / JSON file
  if (!lower.endsWith('.rar')) {
    const content = await file.text();
    const safeName = sanitizeArchiveFilePath(file.name).split('/').pop() || 'SKILL.md';
    const folder = safeName.toLowerCase().endsWith('.md') ? 'skills' : 'src';
    const entry: RarFileEntry = {
      id: `wks-file-${Date.now()}`,
      name: safeName,
      path: `${folder}/${safeName}`,
      folder,
      sizeBytes: file.size,
      language: detectCodeLanguage(safeName),
      content,
      originalContent: content,
    };
    return {
      id: `wks-single-${Date.now()}`,
      archiveName: safeName,
      uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      totalSizeBytes: file.size,
      signatureDetected: 'Archivo fuente cargado directamente en VFS',
      sourceKind: 'bundle',
      files: [entry],
      metadata: {
        aiModelId: 'claude-opus-55',
        aiModelLabel: currentModelLabel,
        appliedSkill: currentSkillName,
        predominantLanguages: computeLanguageBreakdown([entry]),
        colorPalette: extractColorsFromFiles([entry]),
      },
    };
  }

  // 3. Honest Legacy .RAR binary header inspection (backward compatibility)
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const isRarMagic =
    bytes.length >= 7 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x61 &&
    bytes[2] === 0x72 &&
    bytes[3] === 0x21 &&
    bytes[4] === 0x1a &&
    bytes[5] === 0x07;

  const signatureLabel = isRarMagic
    ? bytes[6] === 0x01
      ? 'Cabecera RAR5 heredada (conviértelo a .ZIP o carpeta para edición completa)'
      : 'Cabecera RAR4 heredada (conviértelo a .ZIP o carpeta para edición completa)'
    : 'Contenedor binario heredado';

  const decoder = new TextDecoder('utf-8', { fatal: false });
  const rawText = decoder.decode(bytes.slice(0, Math.min(bytes.length, 262144)));
  const pathMatches = Array.from(
    new Set(rawText.match(/[a-zA-Z0-9_\-/]+\.(tsx|ts|css|json|md|js|html)/g) || [])
  ).slice(0, 12);

  const reportContent = `# Inspección de archivo heredado: ${sanitizeUserText(file.name, 80)}

- **Firma binaria:** ${signatureLabel}
- **Tamaño:** ${(file.size / 1024).toFixed(1)} KB
- **Rutas detectadas en tabla de encabezados:** ${
    pathMatches.length > 0 ? pathMatches.map((p) => `\n  - \`${sanitizeArchiveFilePath(p)}\``).join('') : 'Ninguna ruta en texto plano'
  }

> Los algoritmos propietarios de compresión sólida RAR requieren conversión a **.ZIP** o **apertura directa de carpeta local** para leer el contenido fuente íntegro en el navegador.`;

  const reportEntry: RarFileEntry = {
    id: `rar-legacy-${Date.now()}`,
    name: 'INSPECCION_CABECERA.md',
    path: 'docs/INSPECCION_CABECERA.md',
    folder: 'docs',
    sizeBytes: new TextEncoder().encode(reportContent).length,
    language: 'markdown',
    content: reportContent,
    originalContent: reportContent,
  };

  return {
    id: `pkg-legacy-${Date.now()}`,
    archiveName: sanitizeUserText(file.name, 80),
    uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    totalSizeBytes: file.size,
    signatureDetected: signatureLabel,
    sourceKind: 'rar-legacy',
    files: [reportEntry],
    metadata: {
      aiModelId: 'claude-opus-55',
      aiModelLabel: currentModelLabel,
      appliedSkill: currentSkillName,
      predominantLanguages: computeLanguageBreakdown([reportEntry]),
      colorPalette: extractColorsFromFiles([reportEntry]),
    },
  };
}

/* ==========================================================================
   LIVE DIFF & SKILL LINTER UTILITIES
   ========================================================================== */

export interface DiffLine {
  type: 'same' | 'add' | 'del';
  oldLine?: number;
  newLine?: number;
  text: string;
}

export function computeLineDiff(original: string, modified: string): DiffLine[] {
  const a = original.split('\n');
  const b = modified.split('\n');

  if (original === modified) {
    return b.map((text, idx) => ({
      type: 'same',
      oldLine: idx + 1,
      newLine: idx + 1,
      text,
    }));
  }

  // LCS matrix capped safely for responsive UI rendering
  const maxLines = 300;
  const aSlice = a.slice(0, maxLines);
  const bSlice = b.slice(0, maxLines);
  const m = aSlice.length;
  const n = bSlice.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));

  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (aSlice[i] === bSlice[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (aSlice[i] === bSlice[j]) {
      out.push({ type: 'same', oldLine: i + 1, newLine: j + 1, text: aSlice[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ type: 'del', oldLine: i + 1, text: aSlice[i] });
      i++;
    } else {
      out.push({ type: 'add', newLine: j + 1, text: bSlice[j] });
      j++;
    }
  }
  while (i < m) {
    out.push({ type: 'del', oldLine: i + 1, text: aSlice[i] });
    i++;
  }
  while (j < n) {
    out.push({ type: 'add', newLine: j + 1, text: bSlice[j] });
    j++;
  }

  return out;
}

export interface WorkspaceAuditCheck {
  id: string;
  label: string;
  status: 'pass' | 'warn' | 'fail';
  detail: string;
}

export function auditWorkspacePackage(pkg: RarArchivePackage): {
  estimatedTokens: number;
  modifiedCount: number;
  checks: WorkspaceAuditCheck[];
} {
  const totalChars = pkg.files.reduce((acc, f) => acc + f.content.length, 0);
  const estimatedTokens = Math.max(1, Math.ceil(totalChars / 4));
  const modifiedCount = pkg.files.filter(
    (f) => f.originalContent !== undefined && f.originalContent !== f.content
  ).length;

  const skillFile = pkg.files.find(
    (f) => f.name.toLowerCase() === 'skill.md' || f.language === 'markdown'
  );
  const hasYamlFrontmatter = skillFile
    ? /^---\s*\n[\s\S]*?name:\s*\S+[\s\S]*?description:[\s\S]*?\n---/.test(
        skillFile.content.trim()
      )
    : false;

  const violetRegex = /#(7c3aed|8b5cf6|a855f7|c084fc|9333ea|6d28d9|d8b4fe)\b/i;
  const violetHit = pkg.files.find(
    (f) => (f.language === 'css' || f.language === 'tsx') && violetRegex.test(f.content)
  );

  const slopRegex = /\b(seamless|elevate|delve|revolutionary|game-changing|unlock the power|synergy)\b/i;
  const slopHit = pkg.files.find((f) => slopRegex.test(f.content));

  const unsafePathHit = pkg.files.find((f) => f.path.includes('..'));

  const checks: WorkspaceAuditCheck[] = [
    {
      id: 'skill-frontmatter',
      label: 'Esquema SKILL.md',
      status: skillFile ? (hasYamlFrontmatter ? 'pass' : 'warn') : 'warn',
      detail: !skillFile
        ? 'Sin archivo SKILL.md en la raíz del paquete.'
        : hasYamlFrontmatter
          ? `Frontmatter válido en ${skillFile.name}.`
          : `${skillFile.name} sin cabecera YAML (name, description).`,
    },
    {
      id: 'palette-violet',
      label: 'Regla anti-violeta',
      status: violetHit ? 'fail' : 'pass',
      detail: violetHit
        ? `Hexadecimal violeta en ${violetHit.name}.`
        : 'Superficies neutrales sin tonos violeta.',
    },
    {
      id: 'copy-slop',
      label: 'Copy anti-slop',
      status: slopHit ? 'warn' : 'pass',
      detail: slopHit
        ? `Cliché detectado en ${slopHit.name}.`
        : 'Sin adjetivos vacíos ni frases de plantilla.',
    },
    {
      id: 'path-safety',
      label: 'Rutas VFS (STRIDE TB-02)',
      status: unsafePathHit ? 'fail' : 'pass',
      detail: unsafePathHit
        ? `Secuencia inválida en ${unsafePathHit.path}.`
        : `${pkg.files.length} rutas normalizadas bajo límite de 25 MB.`,
    },
  ];

  return { estimatedTokens, modifiedCount, checks };
}
