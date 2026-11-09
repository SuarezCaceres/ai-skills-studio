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
  ChevronUp,
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
  Sparkles,
  Sliders,
  Palette,
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

const LANGUAGE_BADGES: Record<CodeLanguage, { label: string; badgeClass: string; iconColor: string }> = {
  tsx: { label: 'TSX', badgeClass: 'border-[#0ea5e9]/40 bg-[#0ea5e9]/10 text-[#38bdf8]', iconColor: 'text-cyan-400' },
  typescript: { label: 'TS', badgeClass: 'border-sky-500/35 bg-sky-500/10 text-sky-300', iconColor: 'text-sky-400' },
  css: { label: 'CSS', badgeClass: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300', iconColor: 'text-emerald-400' },
  markdown: { label: 'MD', badgeClass: 'border-amber-500/35 bg-amber-500/10 text-amber-300', iconColor: 'text-amber-400' },
  json: { label: 'JSON', badgeClass: 'border-slate-600/40 bg-slate-800/40 text-slate-300', iconColor: 'text-yellow-400' },
  html: { label: 'HTML', badgeClass: 'border-rose-500/35 bg-rose-500/10 text-rose-300', iconColor: 'text-rose-400' },
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

  // Bottom drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'audit' | 'composition' | 'cli'>('audit');

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

  const auditSummary = useMemo(() => {
    const passCount = auditReport.checks.filter((c) => c.status === 'pass').length;
    const warnCount = auditReport.checks.filter((c) => c.status === 'warn').length;
    const failCount = auditReport.checks.filter((c) => c.status === 'fail').length;
    return { passCount, warnCount, failCount, total: auditReport.checks.length };
  }, [auditReport]);

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
        ? `---\nname: ${name.replace(/\.md$/i, '')}\ndescription: Directiva operativa para el agente de IA.\n---\n\n# ${name.replace(/\.md$/i, '')}\n\n1. Define aquí las reglas operativas y validaciones de la skill.\n`
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
      className="ide-workspace-vfs space-y-3 font-sans"
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
      <header
        className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 transition-colors duration-200 ${
          isDraggingOver
            ? 'border-[#0ea5e9] bg-[#121c2c]'
            : 'border-slate-800/90 bg-[#121722]'
        }`}
      >
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-700/80 bg-[#0a0d14] text-[#0ea5e9]">
            <FolderOpen className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-sm sm:text-base font-semibold text-white tracking-tight">
                {workspace.archiveName}
              </h1>
              <span className="rounded-full border border-slate-700/80 bg-[#0a0d14] px-2 py-0.5 font-mono text-[11px] tabular-nums text-slate-300">
                {workspace.files.length} archivos · {(workspace.totalSizeBytes / 1024).toFixed(1)} KB
              </span>
              {auditReport.modifiedCount > 0 && (
                <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 font-mono text-[11px] font-medium text-amber-300">
                  {auditReport.modifiedCount} modificado{auditReport.modifiedCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="truncate text-[11px] text-slate-400 mt-0.5">
              {workspace.signatureDetected} · VFS en memoria de navegador
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={isBusy}
            onClick={() => void handleOpenDirectoryPicker()}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-700/80 bg-[#0a0d14] px-3 text-xs font-medium text-slate-200 hover:border-slate-500 hover:text-white transition-all duration-150 cursor-pointer"
          >
            <FolderOpen className="h-3.5 w-3.5 text-[#0ea5e9]" />
            <span>Abrir carpeta</span>
          </button>

          <button
            type="button"
            disabled={isBusy}
            onClick={() => archiveInputRef.current?.click()}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-700/80 bg-[#0a0d14] px-3 text-xs font-medium text-slate-200 hover:border-slate-500 hover:text-white transition-all duration-150 cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5 text-[#0ea5e9]" />
            <span>Importar paquete ZIP</span>
          </button>

          <button
            type="button"
            onClick={handleExportZip}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-700/80 bg-[#0a0d14] px-3 text-xs font-medium text-slate-200 hover:border-slate-500 hover:text-white transition-all duration-150 cursor-pointer"
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
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#0ea5e9] px-3 text-xs font-semibold text-[#0a0d14] hover:bg-[#38bdf8] transition-all duration-150 cursor-pointer shadow-sm"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Guardar en catálogo</span>
          </button>
        </div>
      </header>

      {feedbackBanner && (
        <div
          role="status"
          aria-live="polite"
          className={`flex items-center justify-between rounded-md border px-3.5 py-2 text-xs font-medium ${
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

      {/* 2-COLUMN MAIN IDE LAYOUT: TREE (LEFT) + STUDIO AREA (EDITOR + BOTTOM DRAWER) */}
      <div className="flex flex-col lg:flex-row gap-3 min-h-[620px]">
        {/* PANE 1: VIRTUAL FILE SYSTEM TREE (280px) */}
        <aside
          aria-label="Explorador de archivos del workspace"
          className="w-full lg:w-72 lg:shrink-0 flex flex-col rounded-lg border border-slate-800/80 bg-[#121722] overflow-hidden"
        >
          {/* Header controls: Search & Micro-filters */}
          <div className="space-y-2 border-b border-slate-800/80 p-2.5 bg-[#0d1118]">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Árbol VFS
              </span>
              <button
                type="button"
                onClick={() => setShowNewFileForm((v) => !v)}
                className="inline-flex items-center gap-1 rounded border border-slate-700/80 bg-[#0a0d14] px-2 py-0.5 text-[11px] font-medium text-slate-200 hover:border-[#0ea5e9] hover:text-white transition cursor-pointer"
              >
                <Plus className="h-3 w-3 text-[#0ea5e9]" />
                <span>Nuevo</span>
              </button>
            </div>

            {showNewFileForm && (
              <form
                onSubmit={handleCreateFile}
                className="space-y-2 rounded-md border border-slate-700/80 bg-[#0a0d14] p-2"
              >
                <label className="block text-[11px] text-slate-400 font-medium" htmlFor="vfs-new-path">
                  Ruta del archivo
                </label>
                <input
                  id="vfs-new-path"
                  type="text"
                  value={newFilePath}
                  onChange={(e) => setNewFilePath(e.target.value)}
                  className="w-full rounded border border-slate-700 bg-[#121722] px-2 py-1 font-mono text-xs text-white focus:border-[#0ea5e9] outline-none"
                />
                <div className="flex items-center gap-2">
                  <select
                    aria-label="Lenguaje del archivo"
                    value={newFileLang}
                    onChange={(e) => setNewFileLang(e.target.value as CodeLanguage)}
                    className="flex-1 rounded border border-slate-700 bg-[#121722] px-2 py-1 text-xs text-slate-200 outline-none"
                  >
                    <option value="markdown">Markdown (.md)</option>
                    <option value="typescript">TypeScript (.ts)</option>
                    <option value="tsx">React TSX (.tsx)</option>
                    <option value="css">CSS (.css)</option>
                    <option value="json">JSON (.json)</option>
                  </select>
                  <button
                    type="submit"
                    className="rounded bg-[#0ea5e9] px-2.5 py-1 text-xs font-semibold text-[#0a0d14] hover:bg-[#38bdf8] cursor-pointer"
                  >
                    Crear
                  </button>
                </div>
              </form>
            )}

            {/* Search filter input */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrar ruta o código..."
                aria-label="Filtrar archivos en el árbol VFS"
                className="w-full rounded border border-slate-800/90 bg-[#0a0d14] py-1.5 pl-8 pr-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:border-[#0ea5e9] outline-none"
              />
            </div>

            {/* Micro-filters strip (all, md, ts, tsx, css, json) */}
            <div className="flex flex-wrap gap-1">
              {(['all', 'markdown', 'typescript', 'tsx', 'css', 'json'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLangFilter(lang)}
                  className={`rounded px-1.5 py-0.5 font-mono text-[10px] transition-colors cursor-pointer ${
                    langFilter === lang
                      ? 'bg-[#0ea5e9] font-semibold text-[#0a0d14]'
                      : 'border border-slate-800/80 bg-[#0a0d14] text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {lang === 'all' ? 'Todos' : LANGUAGE_BADGES[lang].label}
                </button>
              ))}
            </div>
          </div>

          {/* Tree list */}
          <div className="ide-scroll flex-1 overflow-y-auto p-2 space-y-1 max-h-[580px] lg:max-h-[calc(100vh-280px)] min-h-[300px]">
            {Object.entries(groupedByFolder).map(([folder, files]) => {
              const isCollapsed = Boolean(collapsedFolders[folder]);
              return (
                <div key={folder} className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() =>
                      setCollapsedFolders((prev) => ({ ...prev, [folder]: !prev[folder] }))
                    }
                    className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-left font-mono text-xs text-slate-400 hover:bg-[#171d2b] hover:text-slate-200 transition cursor-pointer"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                    )}
                    <Folder className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate text-slate-300 font-medium">{folder}</span>
                    <span className="ml-auto text-[10px] text-slate-500 font-mono">
                      {files.length}
                    </span>
                  </button>

                  {!isCollapsed && (
                    <div className="ml-2.5 pl-2.5 border-l border-slate-800/80 space-y-0.5">
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
                            className={`group flex items-center justify-between gap-1.5 rounded px-2 py-1 text-xs transition duration-150 ${
                              isSelected
                                ? 'bg-[#0ea5e9]/12 text-white border-l-2 border-[#0ea5e9]'
                                : 'text-slate-300 hover:bg-[#171d2b]'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleSelectFile(file.id)}
                              className="flex min-w-0 flex-1 items-center gap-2 text-left cursor-pointer"
                            >
                              <FileCode className={`h-3.5 w-3.5 shrink-0 ${badge.iconColor}`} />
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
                                className={`rounded border px-1.5 py-0 font-mono text-[10px] ${badge.badgeClass}`}
                              >
                                {badge.label}
                              </span>
                              {workspace.files.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteFile(file.id)}
                                  aria-label={`Eliminar ${file.name}`}
                                  className="opacity-0 group-hover:opacity-100 rounded p-0.5 text-slate-500 hover:text-rose-400 transition-opacity cursor-pointer"
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

        {/* PANE 2: CENTER STUDIO AREA (EXPANSIVE EDITOR + BOTTOM TELEMETRY DRAWER) */}
        <section
          aria-label="Editor de código y visor de diferencias"
          className="flex-1 min-w-0 flex flex-col rounded-lg border border-slate-800/80 bg-[#121722] overflow-hidden"
        >
          {/* Open Tabs Bar */}
          <div className="ide-scroll flex items-center justify-between gap-2 border-b border-slate-800/80 bg-[#0d1118] px-2 pt-1.5 overflow-x-auto">
            <div className="flex items-center gap-1">
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
                    className={`flex items-center gap-2 rounded-t-md border-x border-t px-3 py-1.5 font-mono text-xs cursor-pointer transition-colors ${
                      active
                        ? 'border-t-2 border-t-[#0ea5e9] border-x-slate-700/80 bg-[#121722] text-white font-medium'
                        : 'border-transparent bg-transparent text-slate-400 hover:text-slate-200 hover:bg-[#171d2b]/50'
                    }`}
                  >
                    <span className="truncate max-w-[140px]">{file.name}</span>
                    {dirty && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />}
                    <button
                      type="button"
                      onClick={(e) => handleCloseTab(e, file.id)}
                      aria-label={`Cerrar pestaña ${file.name}`}
                      className="text-slate-500 hover:text-white cursor-pointer ml-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mode Switcher Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 px-3 py-2 bg-[#0f141f]">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setEditorMode('code')}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                  editorMode === 'code'
                    ? 'bg-[#0ea5e9] text-[#0a0d14] font-semibold'
                    : 'border border-slate-700/80 bg-[#0a0d14] text-slate-300 hover:text-white hover:border-slate-600'
                }`}
              >
                <FileCode className="h-3.5 w-3.5" />
                <span>Código en vivo</span>
              </button>

              <button
                type="button"
                onClick={() => setEditorMode('diff')}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                  editorMode === 'diff'
                    ? 'bg-[#0ea5e9] text-[#0a0d14] font-semibold'
                    : 'border border-slate-700/80 bg-[#0a0d14] text-slate-300 hover:text-white hover:border-slate-600'
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
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                    editorMode === 'translate'
                      ? 'bg-[#0ea5e9] text-[#0a0d14] font-semibold'
                      : 'border border-slate-700/80 bg-[#0a0d14] text-slate-300 hover:text-white hover:border-slate-600'
                  }`}
                >
                  <Languages className="h-3.5 w-3.5" />
                  <span>{isTranslating ? 'Traduciendo...' : 'Traducir ES'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setEditorMode('presets')}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                  editorMode === 'presets'
                    ? 'bg-[#0ea5e9] text-[#0a0d14] font-semibold'
                    : 'border border-slate-700/80 bg-[#0a0d14] text-slate-300 hover:text-white hover:border-slate-600'
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
                  className="inline-flex items-center gap-1 rounded-md border border-slate-700/80 bg-[#0a0d14] px-2.5 py-1 text-xs text-slate-300 hover:border-slate-500 hover:text-white transition cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Revertir</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => void handleCopyActiveCode()}
                className="inline-flex items-center gap-1 rounded-md border border-slate-700/80 bg-[#0a0d14] px-2.5 py-1 text-xs text-slate-300 hover:border-slate-500 hover:text-white transition cursor-pointer"
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

          {/* Active Editor Canvas */}
          <div className="flex-1 bg-[#0a0d14] relative min-h-[380px]">
            {editorMode === 'presets' ? (
              <div className="ide-scroll max-h-[560px] overflow-y-auto p-4">
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
              <div className="grid min-h-[420px] grid-cols-[44px_minmax(0,1fr)]">
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
                  className="min-h-[420px] w-full resize-y bg-[#0a0d14] p-3 font-mono text-xs leading-6 text-slate-100 outline-none"
                />
              </div>
            ) : editorMode === 'diff' ? (
              <div className="ide-scroll max-h-[500px] overflow-y-auto font-mono text-xs leading-6">
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
                    <span className="w-9 shrink-0 select-none text-right pr-2 opacity-50 tabular-nums">
                      {row.oldLine ?? ''}
                    </span>
                    <span className="w-9 shrink-0 select-none text-right pr-3 opacity-50 tabular-nums">
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
              <div className="ide-scroll max-h-[500px] overflow-y-auto p-4 font-mono text-xs leading-6 text-slate-200 whitespace-pre-wrap">
                {translatedCache[activeFile.id] || activeFile.content}
              </div>
            )}
          </div>

          {/* Status Bar */}
          {activeFile && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 bg-[#0d1118] px-3 py-1.5 font-mono text-[11px] text-slate-400">
              <span className="truncate max-w-[320px]">{activeFile.path}</span>
              <div className="flex items-center gap-3">
                <span className="tabular-nums">
                  {activeFile.content.split('\n').length} líneas · {activeFile.sizeBytes} B · UTF-8
                </span>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen((v) => !v)}
                  className="inline-flex items-center gap-1 rounded border border-slate-700/80 bg-[#0a0d14] px-2 py-0.5 text-[10px] text-slate-300 hover:text-white hover:border-[#0ea5e9] transition cursor-pointer"
                >
                  <Terminal className="h-3 w-3 text-[#0ea5e9]" />
                  <span>{isDrawerOpen ? 'Ocultar Terminal' : 'Mostrar Terminal'}</span>
                  {isDrawerOpen ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronUp className="h-3 w-3" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* COLLAPSIBLE BOTTOM DRAWER (TERMINAL / AUDIT / TELEMETRY / CLI) */}
          <div className="border-t border-slate-800/80 bg-[#121722]">
            {/* Drawer Header Strip / Tabs */}
            <div className="flex items-center justify-between border-b border-slate-800/80 bg-[#0d1118] px-3 py-1.5">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveDrawerTab('audit');
                    setIsDrawerOpen(true);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                    isDrawerOpen && activeDrawerTab === 'audit'
                      ? 'bg-[#171d2b] text-white border-b-2 border-[#0ea5e9]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <CheckCircle2
                    className={`h-3.5 w-3.5 ${
                      auditSummary.failCount > 0
                        ? 'text-rose-400'
                        : auditSummary.warnCount > 0
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                    }`}
                  />
                  <span>
                    Auditoría en vivo ({auditSummary.passCount}/{auditSummary.total})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveDrawerTab('composition');
                    setIsDrawerOpen(true);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                    isDrawerOpen && activeDrawerTab === 'composition'
                      ? 'bg-[#171d2b] text-white border-b-2 border-[#0ea5e9]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sliders className="h-3.5 w-3.5 text-sky-400" />
                  <span>Composición & Modelo</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveDrawerTab('cli');
                    setIsDrawerOpen(true);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                    isDrawerOpen && activeDrawerTab === 'cli'
                      ? 'bg-[#171d2b] text-white border-b-2 border-[#0ea5e9]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Terminal className="h-3.5 w-3.5 text-[#0ea5e9]" />
                  <span>PowerShell CLI</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-full border border-slate-700/80 bg-[#0a0d14] px-2 py-0.5 font-mono text-[10px] tabular-nums text-[#38bdf8]">
                  ~{auditReport.estimatedTokens.toLocaleString()} tok
                </span>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen((v) => !v)}
                  aria-label={isDrawerOpen ? 'Minimizar panel' : 'Expandir panel'}
                  className="rounded p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  {isDrawerOpen ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronUp className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Drawer Body */}
            {isDrawerOpen && (
              <div className="ide-scroll h-60 overflow-y-auto bg-[#0a0d14] p-3.5">
                {/* TAB 1: AUDITORÍA EN VIVO */}
                {activeDrawerTab === 'audit' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400 pb-1 border-b border-slate-800/60">
                      <span>Validación de directivas e integridad de especificaciones de Skill</span>
                      <span className="font-mono text-[11px] text-slate-300">
                        {auditSummary.passCount} pass · {auditSummary.warnCount} warn · {auditSummary.failCount} fail
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {auditReport.checks.map((chk) => (
                        <div
                          key={chk.id}
                          className="rounded-md border border-slate-800/80 bg-[#0d1118] p-2.5 text-xs"
                        >
                          <div className="flex items-center justify-between gap-1.5 font-medium text-slate-100">
                            <div className="flex items-center gap-1.5 truncate">
                              {chk.status === 'pass' && (
                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                              )}
                              {chk.status === 'warn' && (
                                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                              )}
                              {chk.status === 'fail' && (
                                <XCircle className="h-3.5 w-3.5 shrink-0 text-rose-400" />
                              )}
                              <span className="truncate">{chk.label}</span>
                            </div>
                            <span className="shrink-0 font-mono text-[10px] uppercase text-slate-500">
                              {chk.id}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
                            {chk.detail}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 2: COMPOSICIÓN & MODELO */}
                {activeDrawerTab === 'composition' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left: Languages & Hex Palette */}
                    <div className="space-y-3">
                      <div>
                        <span className="block text-xs font-medium text-slate-300 mb-1.5">
                          Desglose de lenguajes
                        </span>
                        <div className="flex h-2 w-full overflow-hidden rounded-full bg-[#121722]">
                          {workspace.metadata.predominantLanguages.map((lang) => (
                            <div
                              key={lang.extension}
                              style={{ width: `${lang.percentage}%`, backgroundColor: lang.color }}
                              title={`${lang.language}: ${lang.percentage}%`}
                            />
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-2 text-[11px] text-slate-300 mt-2">
                          {workspace.metadata.predominantLanguages.map((lang) => (
                            <span
                              key={lang.extension}
                              className="inline-flex items-center gap-1 font-mono tabular-nums"
                            >
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: lang.color }}
                              />
                              {lang.language} {lang.percentage}%
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Swatches */}
                      <div>
                        <span className="block text-xs font-medium text-slate-300 mb-1.5">
                          Tokens de color detectados
                        </span>
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
                              className="inline-flex items-center gap-1.5 rounded-md border border-slate-700/80 bg-[#0d1118] px-2 py-1 font-mono text-[11px] text-slate-200 hover:border-slate-500 transition cursor-pointer"
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

                    {/* Right: Runtime Target Selectors */}
                    <div className="space-y-2.5 border-t md:border-t-0 md:border-l border-slate-800/80 md:pl-4">
                      <div>
                        <label
                          className="block text-xs font-medium text-slate-300 mb-1"
                          htmlFor="wks-model-select"
                        >
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
                          className="w-full rounded-md border border-slate-700/80 bg-[#0d1118] px-2.5 py-1.5 text-xs text-slate-100 outline-none focus:border-[#0ea5e9]"
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
                      </div>

                      <div>
                        <label
                          className="block text-xs font-medium text-slate-300 mb-1"
                          htmlFor="wks-skill-select"
                        >
                          Skill rectora aplicada
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
                          className="w-full rounded-md border border-slate-700/80 bg-[#0d1118] px-2.5 py-1.5 font-mono text-xs text-slate-100 outline-none focus:border-[#0ea5e9]"
                        >
                          {AVAILABLE_SKILLS.map((sk) => (
                            <option key={sk} value={sk}>
                              {sk}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: POWERSHELL CLI & LOCAL SYNC */}
                {activeDrawerTab === 'cli' && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Descomprime y enlaza el workspace directamente con tu entorno de agentes locales o vault de notas:
                    </p>
                    <div className="rounded-md border border-slate-800/80 bg-[#0d1118] p-2.5 font-mono text-[11px] text-slate-300 break-all select-all">
                      {cliInstallCommand}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => void handleCopyCli()}
                        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-700/80 bg-[#0d1118] px-3 text-xs font-medium text-slate-200 hover:border-slate-500 hover:text-white transition cursor-pointer"
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
                        className="btn-obsidian-vault inline-flex h-8 items-center gap-2 rounded-md px-3 text-xs font-medium transition"
                      >
                        <ObsidianBrandIcon className="h-3.5 w-3.5" />
                        <span>Sincronizar con Obsidian</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => onNavigatePage('boveda')}
                        className="inline-flex h-8 items-center rounded-md border border-slate-800/80 bg-transparent px-3 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/40 transition cursor-pointer"
                      >
                        Ir al repositorio de skills
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
