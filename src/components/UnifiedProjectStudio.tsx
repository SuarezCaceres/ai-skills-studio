import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FolderOpen,
  Folder,
  Upload,
  FileCode,
  Download,
  Search,
  ChevronRight,
  ChevronDown,
  Save,
  Copy,
  Check,
  Plus,
  Trash2,
  RotateCcw,
  GitCompare,
  Languages,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Terminal,
  X,
  Layers,
} from 'lucide-react';
import {
  AppPageRoute,
  CodeLanguage,
  RarArchivePackage,
  RarFileEntry,
} from '../types/workspace';
import { SkillDocument } from '../types/skill';
import { StylePresetCatalog } from './StylePresetCatalog';
import { ObsidianBrandIcon } from './BrandIcons';
import {
  parseUploadedRarFile,
  computeLanguageBreakdown,
  extractColorsFromFiles,
  exportWorkspaceAsZipBlob,
  openLocalDirectoryWorkspace,
  ingestFileListToWorkspace,
  computeLineDiff,
  auditWorkspacePackage,
} from '../services/rarParserService';
import { translateSkillMarkdown } from '../services/translationService';
import { AI_BENCHMARK_MODELS } from '../data/aiModelsData';

interface UnifiedProjectStudioProps {
  activeSkill: SkillDocument;
  activeRarPackage: RarArchivePackage;
  isEditorMode: boolean;
  onRequestLogin: () => void;
  onUpdateRarPackage: (pkg: RarArchivePackage) => void;
  onSaveRarProjectToBoveda: (pkg: RarArchivePackage) => void;
  onUpdateSkill: (skill: SkillDocument) => void;
  onUpdateSkillMarkdown: (
    skillId: string,
    markdown: string,
    translated?: string
  ) => void;
  onUpdateProjectMetadata: (
    skillId: string,
    updates: {
      aiModelId?: string;
      aiModelLabel?: string;
      appliedSkill?: string;
      colorPalette?: string[];
    }
  ) => void;
  onNavigatePage: (page: AppPageRoute) => void;
}

const LANGUAGE_BADGES: Record<CodeLanguage, { label: string; badgeClass: string }> = {
  tsx: { label: 'TSX', badgeClass: 'border-[#0ea5e9]/40 bg-[#0ea5e9]/10 text-[#38bdf8]' },
  typescript: { label: 'TS', badgeClass: 'border-sky-500/35 bg-sky-500/10 text-sky-300' },
  css: { label: 'CSS', badgeClass: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300' },
  markdown: { label: 'MD', badgeClass: 'border-amber-500/35 bg-amber-500/10 text-amber-300' },
  json: { label: 'JSON', badgeClass: 'border-slate-500/40 bg-slate-500/15 text-slate-300' },
  html: { label: 'HTML', badgeClass: 'border-rose-500/35 bg-rose-500/10 text-rose-300' },
};

const AVAILABLE_SKILLS = [
  'design-taste-frontend',
  'github-workflow-standards',
  'playwright-best-practices',
  'ui-ux-pro-max',
  'frontend-design',
];

export const UnifiedProjectStudio: React.FC<UnifiedProjectStudioProps> = ({
  activeSkill,
  activeRarPackage,
  isEditorMode,
  onRequestLogin,
  onUpdateRarPackage,
  onSaveRarProjectToBoveda,
  onUpdateSkill,
  onUpdateSkillMarkdown,
  onUpdateProjectMetadata,
  onNavigatePage,
}) => {
  const [workspace, setWorkspace] = useState<RarArchivePackage>(activeRarPackage);
  const [openTabs, setOpenTabs] = useState<string[]>(() =>
    activeRarPackage.files.slice(0, 3).map((f) => f.id)
  );
  const [selectedFileId, setSelectedFileId] = useState<string>(
    activeRarPackage.files[0]?.id || ''
  );
  const [editorMode, setEditorMode] = useState<'code' | 'diff' | 'translate' | 'presets'>('code');
  const [searchQuery, setSearchQuery] = useState('');
  const [langFilter, setLangFilter] = useState<'all' | CodeLanguage>('all');
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const [isBusy, setIsBusy] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    tone: 'info' | 'error';
    text: string;
  } | null>(null);

  const [showNewFileForm, setShowNewFileForm] = useState(false);
  const [newFilePath, setNewFilePath] = useState('skills/nueva-regla/SKILL.md');
  const [newFileLang, setNewFileLang] = useState<CodeLanguage>('markdown');

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [translatedCache, setTranslatedCache] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const archiveInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setWorkspace(activeRarPackage);
    setOpenTabs(activeRarPackage.files.slice(0, 3).map((f) => f.id));
    setSelectedFileId(activeRarPackage.files[0]?.id || '');
  }, [activeRarPackage.id]);

  const notify = (text: string, tone: 'info' | 'error' = 'info') => {
    setFeedbackBanner({ text, tone });
    setTimeout(() => {
      setFeedbackBanner((prev) => (prev?.text === text ? null : prev));
    }, 3600);
  };

  const commitWorkspace = (next: RarArchivePackage) => {
    const recomputed: RarArchivePackage = {
      ...next,
      totalSizeBytes: next.files.reduce((acc, f) => acc + f.sizeBytes, 0),
      metadata: {
        ...next.metadata,
        predominantLanguages: computeLanguageBreakdown(next.files),
        colorPalette: extractColorsFromFiles(next.files),
      },
    };
    setWorkspace(recomputed);
    onUpdateRarPackage(recomputed);
  };

  const filteredFiles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return workspace.files.filter((file) => {
      if (langFilter !== 'all' && file.language !== langFilter) return false;
      if (!q) return true;
      return (
        file.name.toLowerCase().includes(q) ||
        file.path.toLowerCase().includes(q) ||
        file.content.toLowerCase().includes(q)
      );
    });
  }, [workspace.files, langFilter, searchQuery]);

  const groupedByFolder = useMemo(() => {
    const groups: Record<string, RarFileEntry[]> = {};
    for (const file of filteredFiles) {
      const key = file.folder || 'root';
      if (!groups[key]) groups[key] = [];
      groups[key].push(file);
    }
    return groups;
  }, [filteredFiles]);

  const activeFile: RarFileEntry | null = useMemo(() => {
    return (
      workspace.files.find((f) => f.id === selectedFileId) ||
      workspace.files[0] ||
      null
    );
  }, [workspace.files, selectedFileId]);

  const diffRows = useMemo(() => {
    if (!activeFile) return [];
    const base = activeFile.originalContent ?? activeFile.content;
    return computeLineDiff(base, activeFile.content);
  }, [activeFile]);

  const diffStats = useMemo(() => {
    let added = 0;
    let removed = 0;
    for (const row of diffRows) {
      if (row.type === 'add') added++;
      if (row.type === 'del') removed++;
    }
    return { added, removed };
  }, [diffRows]);

  const auditReport = useMemo(() => auditWorkspacePackage(workspace), [workspace]);

  const handleSelectFile = (fileId: string) => {
    setSelectedFileId(fileId);
    setOpenTabs((prev) => (prev.includes(fileId) ? prev : [...prev.slice(-5), fileId]));
    if (editorMode === 'presets') {
      setEditorMode('code');
    }
  };

  const handleCloseTab = (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    const remaining = openTabs.filter((id) => id !== fileId);
    setOpenTabs(remaining);
    if (selectedFileId === fileId) {
      setSelectedFileId(remaining[remaining.length - 1] || workspace.files[0]?.id || '');
    }
  };

  const handleEditActiveFile = (nextContent: string) => {
    if (!activeFile) return;
    const sizeBytes = new TextEncoder().encode(nextContent).length;
    const updatedFiles = workspace.files.map((f) =>
      f.id === activeFile.id ? { ...f, content: nextContent, sizeBytes } : f
    );
    commitWorkspace({ ...workspace, files: updatedFiles });
  };

  const handleRevertActiveFile = () => {
    if (!activeFile || activeFile.originalContent === undefined) return;
    handleEditActiveFile(activeFile.originalContent);
    notify(`Cambios revertidos en ${activeFile.name}.`);
  };

  const handleCreateFile = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newFilePath.trim().replace(/\\/g, '/').replace(/^\/+/, '');
    if (!clean) return;
    const parts = clean.split('/').filter(Boolean);
    const name = parts[parts.length - 1] || 'nuevo.md';
    const folder = parts.length > 1 ? parts.slice(0, -1).join('/') : 'src';
    const starter =
      newFileLang === 'markdown'
        ? `---\nname: ${name.replace(/\.md$/i, '')}\ndescription: Directiva operativa para el agente.\n---\n\n# ${name.replace(/\.md$/i, '')}\n\n1. Describe qué valida o construye esta skill.\n`
        : `// ${clean}\nexport const ready = true;\n`;

    const entry: RarFileEntry = {
      id: `vfs-new-${Date.now()}`,
      name,
      path: `${folder}/${name}`,
      folder,
      sizeBytes: new TextEncoder().encode(starter).length,
      language: newFileLang,
      content: starter,
      originalContent: '',
    };

    const nextPkg: RarArchivePackage = {
      ...workspace,
      files: [entry, ...workspace.files],
    };
    commitWorkspace(nextPkg);
    handleSelectFile(entry.id);
    setShowNewFileForm(false);
    notify(`Archivo ${entry.path} añadido al VFS.`);
  };

  const handleDeleteFile = (fileId: string) => {
    if (workspace.files.length <= 1) {
      notify('El workspace debe conservar al menos un archivo.', 'error');
      return;
    }
    const target = workspace.files.find((f) => f.id === fileId);
    const remaining = workspace.files.filter((f) => f.id !== fileId);
    commitWorkspace({ ...workspace, files: remaining });
    setOpenTabs((prev) => prev.filter((id) => id !== fileId));
    if (selectedFileId === fileId) {
      setSelectedFileId(remaining[0]?.id || '');
    }
    if (target) notify(`Archivo ${target.name} eliminado del VFS.`);
  };

  const handleArchiveUpload = async (file: File) => {
    setIsBusy(true);
    try {
      const parsed = await parseUploadedRarFile(
        file,
        workspace.metadata.aiModelLabel,
        workspace.metadata.appliedSkill
      );
      commitWorkspace(parsed);
      setOpenTabs(parsed.files.slice(0, 3).map((f) => f.id));
      setSelectedFileId(parsed.files[0]?.id || '');
      notify(`Workspace ${parsed.archiveName} montado (${parsed.files.length} archivos).`);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'No se pudo abrir el paquete.', 'error');
    } finally {
      setIsBusy(false);
    }
  };

  const handleOpenDirectoryPicker = async () => {
    setIsBusy(true);
    try {
      const picked = await openLocalDirectoryWorkspace(
        workspace.metadata.aiModelLabel,
        workspace.metadata.appliedSkill
      );
      if (picked) {
        commitWorkspace(picked);
        setOpenTabs(picked.files.slice(0, 3).map((f) => f.id));
        setSelectedFileId(picked.files[0]?.id || '');
        notify(`Carpeta local "${picked.archiveName}" cargada (${picked.files.length} archivos).`);
      }
    } catch {
      folderInputRef.current?.click();
    } finally {
      setIsBusy(false);
    }
  };

  const handleFallbackFolderInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setIsBusy(true);
    try {
      const items: { file: File; relativePath: string }[] = [];
      let rootFolder = 'carpeta-local';
      for (let i = 0; i < fileList.length; i++) {
        const f = fileList[i];
        const rel = (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name;
        if (i === 0 && rel.includes('/')) {
          rootFolder = rel.split('/')[0];
        }
        items.push({ file: f, relativePath: rel });
      }
      const mounted = await ingestFileListToWorkspace(
        items,
        rootFolder,
        workspace.metadata.aiModelLabel,
        workspace.metadata.appliedSkill
      );
      commitWorkspace(mounted);
      setOpenTabs(mounted.files.slice(0, 3).map((f) => f.id));
      setSelectedFileId(mounted.files[0]?.id || '');
      notify(`Carpeta "${mounted.archiveName}" montada (${mounted.files.length} archivos).`);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Error al leer la carpeta.', 'error');
    } finally {
      setIsBusy(false);
      e.target.value = '';
    }
  };

  const handleExportZip = () => {
    const blob = exportWorkspaceAsZipBlob(workspace);
    const baseName = workspace.archiveName.replace(/\.(zip|rar|skillbundle)$/i, '');
    const outName = `${baseName || 'workspace-bundle'}.zip`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = outName;
    a.click();
    URL.revokeObjectURL(url);
    notify(`Paquete ${outName} exportado con CRC-32 verificado.`);
  };

  const handleTranslateActiveFile = async () => {
    if (!activeFile) return;
    setIsTranslating(true);
    try {
      const translated = await translateSkillMarkdown(activeFile.content, 'es');
      setTranslatedCache((prev) => ({ ...prev, [activeFile.id]: translated }));
      if (activeFile.language === 'markdown') {
        onUpdateSkillMarkdown(activeSkill.id, activeFile.content, translated);
      }
      setEditorMode('translate');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopyActiveCode = async () => {
    if (!activeFile) return;
    const text =
      editorMode === 'translate' && translatedCache[activeFile.id]
        ? translatedCache[activeFile.id]
        : activeFile.content;
    await navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1600);
  };

  const cliInstallCommand = useMemo(() => {
    const slug = workspace.archiveName
      .replace(/\.(zip|rar|skillbundle)$/i, '')
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-');
    return `Expand-Archive -Path "./${slug}.zip" -DestinationPath "./.agents/skills/${slug}" -Force`;
  }, [workspace.archiveName]);

  const handleCopyCli = async () => {
    await navigator.clipboard.writeText(cliInstallCommand);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 1600);
  };

  return (
    <div
      className="space-y-4"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingOver(true);
      }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDraggingOver(false);
        const dropped = e.dataTransfer.files?.[0];
        if (dropped) void handleArchiveUpload(dropped);
      }}
    >
      {/* Hidden inputs for Archive (.zip/.md/.ts/.rar) & Directory upload */}
      <input
        ref={archiveInputRef}
        type="file"
        accept=".zip,.skillbundle,.md,.ts,.tsx,.css,.json,.html,.rar"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleArchiveUpload(file);
          e.target.value = '';
        }}
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        // @ts-expect-error webkitdirectory is supported in Chromium/Firefox/Safari
        webkitdirectory="true"
        className="hidden"
        onChange={handleFallbackFolderInput}
      />

      {/* TOP WORKSPACE COMMAND BAR */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 rounded-md border px-4 py-3 transition ${
          isDraggingOver
            ? 'border-[#0ea5e9] bg-[#121c2c]'
            : 'border-slate-800 bg-[#121722]'
        }`}
      >
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-slate-700 bg-[#0a0d14] text-[#0ea5e9]">
            <FolderOpen className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-base font-semibold text-white">
                {workspace.archiveName}
              </h1>
              <span className="rounded border border-slate-700 bg-[#0a0d14] px-2 py-0.5 font-mono text-[11px] text-slate-300">
                {workspace.files.length} archivos · {(workspace.totalSizeBytes / 1024).toFixed(1)} KB
              </span>
              {auditReport.modifiedCount > 0 && (
                <span className="rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 font-mono text-[11px] text-amber-300">
                  {auditReport.modifiedCount} modificado{auditReport.modifiedCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="truncate text-xs text-slate-400">{workspace.signatureDetected}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={isBusy}
            onClick={() => void handleOpenDirectoryPicker()}
            className="inline-flex h-9 items-center gap-1.5 rounded border border-slate-700 bg-[#0a0d14] px-3 text-xs font-medium text-slate-200 hover:border-slate-500 hover:text-white cursor-pointer"
          >
            <FolderOpen className="h-3.5 w-3.5 text-[#0ea5e9]" />
            <span>Abrir carpeta local</span>
          </button>

          <button
            type="button"
            disabled={isBusy}
            onClick={() => archiveInputRef.current?.click()}
            className="inline-flex h-9 items-center gap-1.5 rounded border border-slate-700 bg-[#0a0d14] px-3 text-xs font-medium text-slate-200 hover:border-slate-500 hover:text-white cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5 text-[#0ea5e9]" />
            <span>Importar .ZIP / archivo</span>
          </button>

          <button
            type="button"
            onClick={handleExportZip}
            className="inline-flex h-9 items-center gap-1.5 rounded border border-slate-700 bg-[#0a0d14] px-3 text-xs font-medium text-slate-200 hover:border-slate-500 hover:text-white cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-emerald-400" />
            <span>Exportar .ZIP</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!isEditorMode) {
                onRequestLogin();
                return;
              }
              onSaveRarProjectToBoveda(workspace);
              notify(`Workspace "${workspace.archiveName}" guardado en el catálogo.`);
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded bg-[#0ea5e9] px-3.5 text-xs font-semibold text-[#0a0d14] hover:bg-[#38bdf8] cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Guardar en catálogo</span>
          </button>
        </div>
      </div>

      {feedbackBanner && (
        <div
          role="status"
          aria-live="polite"
          className={`flex items-center justify-between rounded border px-3.5 py-2 text-xs font-medium ${
            feedbackBanner.tone === 'error'
              ? 'border-rose-500/40 bg-rose-950/30 text-rose-200'
              : 'border-[#0ea5e9]/40 bg-[#0ea5e9]/10 text-sky-200'
          }`}
        >
          <span>{feedbackBanner.text}</span>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            aria-label="Cerrar aviso"
            className="text-current opacity-75 hover:opacity-100 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 3-COLUMN IDE WORKSPACE GRID */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* PANE 1: VIRTUAL FILE SYSTEM TREE */}
        <aside
          aria-label="Explorador de archivos del workspace"
          className="flex flex-col rounded-md border border-slate-800 bg-[#121722] lg:col-span-3"
        >
          <div className="space-y-2.5 border-b border-slate-800 p-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Árbol VFS
              </span>
              <button
                type="button"
                onClick={() => setShowNewFileForm((v) => !v)}
                className="inline-flex items-center gap-1 rounded border border-slate-700 bg-[#0a0d14] px-2 py-1 text-[11px] font-medium text-slate-200 hover:border-[#0ea5e9] hover:text-white cursor-pointer"
              >
                <Plus className="h-3 w-3 text-[#0ea5e9]" />
                <span>Nuevo</span>
              </button>
            </div>

            {showNewFileForm && (
              <form
                onSubmit={handleCreateFile}
                className="space-y-2 rounded border border-slate-700 bg-[#0a0d14] p-2.5"
              >
                <label className="block text-[11px] text-slate-400" htmlFor="vfs-new-path">
                  Ruta del archivo
                </label>
                <input
                  id="vfs-new-path"
                  type="text"
                  value={newFilePath}
                  onChange={(e) => setNewFilePath(e.target.value)}
                  className="w-full rounded border border-slate-700 bg-[#121722] px-2 py-1 font-mono text-xs text-white"
                />
                <div className="flex items-center gap-2">
                  <select
                    aria-label="Lenguaje del archivo"
                    value={newFileLang}
                    onChange={(e) => setNewFileLang(e.target.value as CodeLanguage)}
                    className="flex-1 rounded border border-slate-700 bg-[#121722] px-2 py-1 text-xs text-slate-200"
                  >
                    <option value="markdown">Markdown (.md)</option>
                    <option value="typescript">TypeScript (.ts)</option>
                    <option value="tsx">React TSX (.tsx)</option>
                    <option value="css">CSS (.css)</option>
                    <option value="json">JSON (.json)</option>
                  </select>
                  <button
                    type="submit"
                    className="rounded bg-[#0ea5e9] px-2.5 py-1 text-xs font-semibold text-[#0a0d14] cursor-pointer"
                  >
                    Crear
                  </button>
                </div>
              </form>
            )}

            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrar ruta o código..."
                aria-label="Filtrar archivos en el árbol VFS"
                className="w-full rounded border border-slate-800 bg-[#0a0d14] py-1.5 pl-8 pr-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:border-[#0ea5e9]"
              />
            </div>

            <div className="flex flex-wrap gap-1">
              {(['all', 'markdown', 'tsx', 'typescript', 'css', 'json'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLangFilter(lang)}
                  className={`rounded px-2 py-0.5 font-mono text-[11px] transition cursor-pointer ${
                    langFilter === lang
                      ? 'bg-[#0ea5e9] font-semibold text-[#0a0d14]'
                      : 'bg-[#0a0d14] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lang === 'all' ? 'Todos' : LANGUAGE_BADGES[lang].label}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[580px] flex-1 overflow-y-auto p-2 space-y-1.5">
            {Object.entries(groupedByFolder).map(([folder, files]) => {
              const isCollapsed = Boolean(collapsedFolders[folder]);
              return (
                <div key={folder} className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() =>
                      setCollapsedFolders((prev) => ({ ...prev, [folder]: !prev[folder] }))
                    }
                    className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-left font-mono text-xs text-slate-400 hover:bg-[#0a0d14] hover:text-slate-200 cursor-pointer"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <Folder className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                    <span className="truncate">{folder}</span>
                  </button>

                  {!isCollapsed && (
                    <div className="space-y-0.5 pl-3">
                      {files.map((file) => {
                        const isSelected = activeFile?.id === file.id;
                        const isAdded = file.originalContent === '';
                        const isModified =
                          !isAdded &&
                          file.originalContent !== undefined &&
                          file.originalContent !== file.content;
                        const badge = LANGUAGE_BADGES[file.language];

                        return (
                          <div
                            key={file.id}
                            className={`group flex items-center justify-between gap-1.5 rounded px-2 py-1.5 text-xs transition ${
                              isSelected
                                ? 'bg-[#0ea5e9]/15 text-white ring-1 ring-[#0ea5e9]/45'
                                : 'text-slate-300 hover:bg-[#0a0d14]'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleSelectFile(file.id)}
                              className="flex min-w-0 flex-1 items-center gap-2 text-left cursor-pointer"
                            >
                              <FileCode className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                              <span className="truncate font-mono text-[12px]">{file.name}</span>
                            </button>
                            <div className="flex items-center gap-1 shrink-0">
                              {isAdded && (
                                <span
                                  title="Archivo nuevo en sesión"
                                  className="font-mono text-[10px] font-bold text-emerald-400"
                                >
                                  A
                                </span>
                              )}
                              {isModified && (
                                <span
                                  title="Modificado respecto al original"
                                  className="font-mono text-[10px] font-bold text-amber-400"
                                >
                                  M
                                </span>
                              )}
                              <span
                                className={`rounded border px-1.5 py-0.2 font-mono text-[10px] ${badge.badgeClass}`}
                              >
                                {badge.label}
                              </span>
                              {workspace.files.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteFile(file.id)}
                                  aria-label={`Eliminar ${file.name}`}
                                  className="hidden rounded p-0.5 text-slate-500 hover:text-rose-400 group-hover:inline-flex cursor-pointer"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* PANE 2: MULTI-TAB CODE EDITOR, UNIFIED DIFF & TRANSLATOR */}
        <section
          aria-label="Editor de código y visor de diferencias"
          className="flex flex-col rounded-md border border-slate-800 bg-[#121722] lg:col-span-6"
        >
          {/* Open Tabs Bar */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 bg-[#0d1118] px-2 pt-1.5">
            <div className="flex items-center gap-1 overflow-x-auto">
              {openTabs.map((tabId) => {
                const file = workspace.files.find((f) => f.id === tabId);
                if (!file) return null;
                const active = activeFile?.id === file.id;
                const dirty =
                  file.originalContent !== undefined && file.originalContent !== file.content;
                return (
                  <div
                    key={file.id}
                    onClick={() => setSelectedFileId(file.id)}
                    role="tab"
                    tabIndex={0}
                    aria-selected={active}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') setSelectedFileId(file.id);
                    }}
                    className={`flex items-center gap-2 rounded-t border-x border-t px-3 py-1.5 font-mono text-xs cursor-pointer ${
                      active
                        ? 'border-slate-700 bg-[#121722] text-white'
                        : 'border-transparent bg-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="truncate max-w-[150px]">{file.name}</span>
                    {dirty && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />}
                    <button
                      type="button"
                      onClick={(e) => handleCloseTab(e, file.id)}
                      aria-label={`Cerrar pestaña ${file.name}`}
                      className="text-slate-500 hover:text-white cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mode Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-3 py-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setEditorMode('code')}
                className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium cursor-pointer ${
                  editorMode === 'code'
                    ? 'bg-[#0ea5e9] text-[#0a0d14] font-semibold'
                    : 'bg-[#0a0d14] text-slate-300 hover:text-white'
                }`}
              >
                <FileCode className="h-3.5 w-3.5" />
                <span>Código en vivo</span>
              </button>

              <button
                type="button"
                onClick={() => setEditorMode('diff')}
                className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium cursor-pointer ${
                  editorMode === 'diff'
                    ? 'bg-[#0ea5e9] text-[#0a0d14] font-semibold'
                    : 'bg-[#0a0d14] text-slate-300 hover:text-white'
                }`}
              >
                <GitCompare className="h-3.5 w-3.5" />
                <span>
                  Diff ({diffStats.added > 0 || diffStats.removed > 0 ? `+${diffStats.added} -${diffStats.removed}` : '0'})
                </span>
              </button>

              {activeFile?.language === 'markdown' && (
                <button
                  type="button"
                  disabled={isTranslating}
                  onClick={() => void handleTranslateActiveFile()}
                  className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium cursor-pointer ${
                    editorMode === 'translate'
                      ? 'bg-[#0ea5e9] text-[#0a0d14] font-semibold'
                      : 'bg-[#0a0d14] text-slate-300 hover:text-white'
                  }`}
                >
                  <Languages className="h-3.5 w-3.5" />
                  <span>{isTranslating ? 'Traduciendo...' : 'Traducir ES'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setEditorMode('presets')}
                className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium cursor-pointer ${
                  editorMode === 'presets'
                    ? 'bg-[#0ea5e9] text-[#0a0d14] font-semibold'
                    : 'bg-[#0a0d14] text-slate-300 hover:text-white'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Presets UI</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              {(diffStats.added > 0 || diffStats.removed > 0) && (
                <button
                  type="button"
                  onClick={handleRevertActiveFile}
                  className="inline-flex items-center gap-1 rounded border border-slate-700 bg-[#0a0d14] px-2.5 py-1 text-xs text-slate-300 hover:border-slate-500 hover:text-white cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Revertir</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => void handleCopyActiveCode()}
                className="inline-flex items-center gap-1 rounded border border-slate-700 bg-[#0a0d14] px-2.5 py-1 text-xs text-slate-300 hover:border-slate-500 hover:text-white cursor-pointer"
              >
                {copiedCode ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Active Editor Surface */}
          <div className="flex-1 bg-[#0a0d14]">
            {editorMode === 'presets' ? (
              <div className="max-h-[560px] overflow-y-auto p-4">
                <StylePresetCatalog
                  skill={activeSkill}
                  isCollaboratorMode={isEditorMode}
                  onRequestLogin={onRequestLogin}
                  onApplyPreset={(preset, applyMarkdownToo) => {
                    onUpdateSkill({
                      ...activeSkill,
                      markdownContent: applyMarkdownToo
                        ? preset.promptMarkdown
                        : activeSkill.markdownContent,
                      uiSpec: {
                        ...activeSkill.uiSpec,
                        type: preset.componentType,
                        title: `${preset.heroTitle} ${preset.heroAccent}`,
                        theme: preset.theme,
                        activePresetId: preset.id,
                        accentColors: preset.colors,
                        styleLabel: preset.name,
                        items: preset.menuItems,
                      },
                    });
                    notify(`Preset "${preset.name}" aplicado a ${activeSkill.name}.`);
                  }}
                />
              </div>
            ) : !activeFile ? (
              <div className="p-8 text-center text-sm text-slate-400">
                Selecciona un archivo en el árbol VFS para inspeccionarlo o editarlo.
              </div>
            ) : editorMode === 'code' ? (
              <div className="grid min-h-[520px] grid-cols-[44px_minmax(0,1fr)]">
                <div
                  aria-hidden="true"
                  className="select-none border-r border-slate-800/80 bg-[#0d1118] py-3 pr-2 text-right font-mono text-xs leading-6 text-slate-600"
                >
                  {activeFile.content.split('\n').map((_, idx) => (
                    <div key={idx}>{idx + 1}</div>
                  ))}
                </div>
                <textarea
                  aria-label={`Editor de código para ${activeFile.path}`}
                  value={activeFile.content}
                  onChange={(e) => handleEditActiveFile(e.target.value)}
                  spellCheck={false}
                  className="min-h-[520px] w-full resize-y bg-[#0a0d14] p-3 font-mono text-xs leading-6 text-slate-100"
                />
              </div>
            ) : editorMode === 'diff' ? (
              <div className="max-h-[560px] overflow-y-auto font-mono text-xs leading-6">
                {diffStats.added === 0 && diffStats.removed === 0 && (
                  <div className="border-b border-slate-800 bg-[#0d1118] px-4 py-2 text-slate-400">
                    Sin cambios respecto a la captura inicial. Edita el archivo en «Código en vivo» para inspeccionar el diff línea por línea.
                  </div>
                )}
                {diffRows.map((row, idx) => (
                  <div
                    key={idx}
                    className={`flex px-3 ${
                      row.type === 'add'
                        ? 'bg-emerald-950/40 text-emerald-200'
                        : row.type === 'del'
                          ? 'bg-rose-950/40 text-rose-200'
                          : 'text-slate-400'
                    }`}
                  >
                    <span className="w-9 shrink-0 select-none text-right pr-2 opacity-50">
                      {row.oldLine ?? ''}
                    </span>
                    <span className="w-9 shrink-0 select-none text-right pr-3 opacity-50">
                      {row.newLine ?? ''}
                    </span>
                    <span className="w-5 shrink-0 select-none font-bold">
                      {row.type === 'add' ? '+' : row.type === 'del' ? '-' : ' '}
                    </span>
                    <span className="whitespace-pre-wrap break-all">{row.text}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="max-h-[560px] overflow-y-auto p-4 font-mono text-xs leading-6 text-slate-200 whitespace-pre-wrap">
                {translatedCache[activeFile.id] || activeFile.content}
              </div>
            )}
          </div>

          {activeFile && (
            <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 bg-[#0d1118] px-3 py-1.5 font-mono text-[11px] text-slate-400">
              <span>{activeFile.path}</span>
              <span>
                {activeFile.content.split('\n').length} líneas · {activeFile.sizeBytes} B · UTF-8
              </span>
            </footer>
          )}
        </section>

        {/* PANE 3: SKILL AUDITOR, TELEMETRY & WORKTREE / CLI EXPORT */}
        <aside
          aria-label="Auditoría de skill y exportación"
          className="space-y-4 lg:col-span-3"
        >
          {/* Live Audit Card */}
          <div className="rounded-md border border-slate-800 bg-[#121722] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Auditoría en vivo</h2>
              <span className="rounded border border-slate-700 bg-[#0a0d14] px-2 py-0.5 font-mono text-[11px] text-[#38bdf8]">
                ~{auditReport.estimatedTokens.toLocaleString()} tok
              </span>
            </div>

            <div className="space-y-2">
              {auditReport.checks.map((chk) => (
                <div
                  key={chk.id}
                  className="rounded border border-slate-800 bg-[#0a0d14] p-2.5 text-xs"
                >
                  <div className="flex items-center gap-1.5 font-medium text-slate-100">
                    {chk.status === 'pass' && (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    )}
                    {chk.status === 'warn' && (
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                    )}
                    {chk.status === 'fail' && (
                      <XCircle className="h-3.5 w-3.5 shrink-0 text-rose-400" />
                    )}
                    <span>{chk.label}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">{chk.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Language Breakdown & Runtime Target */}
          <div className="rounded-md border border-slate-800 bg-[#121722] p-4 space-y-3">
            <h2 className="text-sm font-semibold text-white">Composición y modelo</h2>

            <div className="flex h-2 w-full overflow-hidden rounded bg-[#0a0d14]">
              {workspace.metadata.predominantLanguages.map((lang) => (
                <div
                  key={lang.extension}
                  style={{ width: `${lang.percentage}%`, backgroundColor: lang.color }}
                  title={`${lang.language}: ${lang.percentage}%`}
                />
              ))}
            </div>

            <div className="flex flex-wrap gap-2 text-[11px] text-slate-300">
              {workspace.metadata.predominantLanguages.map((lang) => (
                <span key={lang.extension} className="inline-flex items-center gap-1 font-mono">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: lang.color }}
                  />
                  {lang.language} {lang.percentage}%
                </span>
              ))}
            </div>

            <div className="space-y-2 pt-1">
              <label className="block text-xs text-slate-400" htmlFor="wks-model-select">
                Modelo objetivo
              </label>
              <select
                id="wks-model-select"
                value={workspace.metadata.aiModelLabel}
                onChange={(e) => {
                  const label = e.target.value;
                  const next = {
                    ...workspace,
                    metadata: { ...workspace.metadata, aiModelLabel: label },
                  };
                  commitWorkspace(next);
                  onUpdateProjectMetadata(activeSkill.id, { aiModelLabel: label });
                }}
                className="w-full rounded border border-slate-700 bg-[#0a0d14] px-2.5 py-1.5 text-xs text-slate-100"
              >
                {AI_BENCHMARK_MODELS.map((m) => {
                  const full = `${m.family} · ${m.version}`;
                  return (
                    <option key={m.id} value={full}>
                      {full} ({m.speedTokensPerSec} tok/s)
                    </option>
                  );
                })}
              </select>

              <label className="block text-xs text-slate-400" htmlFor="wks-skill-select">
                Skill rectora
              </label>
              <select
                id="wks-skill-select"
                value={workspace.metadata.appliedSkill}
                onChange={(e) => {
                  const sk = e.target.value;
                  const next = {
                    ...workspace,
                    metadata: { ...workspace.metadata, appliedSkill: sk },
                  };
                  commitWorkspace(next);
                  onUpdateProjectMetadata(activeSkill.id, { appliedSkill: sk });
                }}
                className="w-full rounded border border-slate-700 bg-[#0a0d14] px-2.5 py-1.5 font-mono text-xs text-slate-100"
              >
                {AVAILABLE_SKILLS.map((sk) => (
                  <option key={sk} value={sk}>
                    {sk}
                  </option>
                ))}
              </select>
            </div>

            {/* Extracted Palette Swatches */}
            <div className="space-y-1.5 pt-1">
              <span className="block text-xs text-slate-400">Tokens hexadecimales detectados</span>
              <div className="flex flex-wrap gap-1.5">
                {workspace.metadata.colorPalette.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(hex);
                      setCopiedHex(hex);
                      setTimeout(() => setCopiedHex(null), 1400);
                    }}
                    className="inline-flex items-center gap-1.5 rounded border border-slate-700 bg-[#0a0d14] px-2 py-1 font-mono text-[11px] text-slate-200 hover:border-slate-500 cursor-pointer"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-sm border border-white/15"
                      style={{ backgroundColor: hex }}
                    />
                    <span>{copiedHex === hex ? 'Copiado' : hex}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* CLI Install & Obsidian Sync */}
          <div className="rounded-md border border-slate-800 bg-[#121722] p-4 space-y-3">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-white">
              <Terminal className="h-4 w-4 text-[#0ea5e9]" />
              <h2>Instalación en entorno local</h2>
            </div>
            <p className="text-xs text-slate-400">
              Exporta el paquete .ZIP y descomprímelo directamente en tu directorio de agentes:
            </p>
            <div className="rounded border border-slate-800 bg-[#0a0d14] p-2.5 font-mono text-[11px] text-slate-300 break-all">
              {cliInstallCommand}
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => void handleCopyCli()}
                className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded border border-slate-700 bg-[#0a0d14] px-3 text-xs font-medium text-slate-200 hover:border-slate-500 hover:text-white cursor-pointer"
              >
                {copiedCli ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Comando copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copiar comando PowerShell</span>
                  </>
                )}
              </button>

              <a
                href="obsidian://open?vault=ai-skills-studio"
                className="btn-obsidian-vault inline-flex h-9 w-full items-center justify-center gap-2 rounded px-3 text-xs font-medium"
              >
                <ObsidianBrandIcon className="h-3.5 w-3.5" />
                <span>Sincronizar con Obsidian</span>
              </a>

              <button
                type="button"
                onClick={() => onNavigatePage('boveda')}
                className="inline-flex h-9 w-full items-center justify-center rounded border border-slate-800 bg-transparent px-3 text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Ir al repositorio de skills
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
