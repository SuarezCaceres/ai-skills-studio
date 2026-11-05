import React, { useMemo, useRef, useState } from 'react';
import {
  FolderArchive,
  FolderOpen,
  Folder,
  Upload,
  FileCode,
  FileText,
  Palette,
  Cpu,
  Sparkles,
  Languages,
  Check,
  Copy,
  Download,
  Search,
  ChevronRight,
  ChevronDown,
  Save,
  Layers,
  Eye,
  Code2,
  Columns,
  ArrowLeft,
  Image as ImageIcon,
  Maximize2,
  Trash2,
  Plus,
  Lock,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  AppPageRoute,
  CodeLanguage,
  RarArchivePackage,
  RarFileEntry,
} from '../types/workspace';
import { SkillDocument, ScreenshotEvidence, UIStylePreset } from '../types/skill';
import { StylePresetCatalog } from './StylePresetCatalog';
import { ObsidianBrandIcon } from './BrandIcons';
import {
  parseUploadedRarFile,
  computeLanguageBreakdown,
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

const LANGUAGE_BADGES: Record<
  CodeLanguage,
  { label: string; colorClass: string }
> = {
  tsx: {
    label: 'TSX',
    colorClass: 'border-[#FF6B00]/45 bg-[#FF6B00]/15 text-[#F97316]',
  },
  typescript: {
    label: 'TS',
    colorClass: 'border-sky-500/40 bg-sky-500/15 text-sky-300',
  },
  css: {
    label: 'CSS',
    colorClass: 'border-amber-400/40 bg-amber-500/15 text-amber-300',
  },
  json: {
    label: 'JSON',
    colorClass: 'border-purple-500/40 bg-purple-500/15 text-purple-300',
  },
  markdown: {
    label: 'MD',
    colorClass: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
  },
  html: {
    label: 'HTML',
    colorClass: 'border-rose-500/40 bg-rose-500/15 text-rose-300',
  },
};

const AVAILABLE_SKILLS = [
  'ui-ux-pro-max',
  'modern-web-guidance',
  'google-antigravity-sdk',
  'chrome-extensions',
  'gemini-api-dev',
];

function renderHighlightedLine(line: string, lang: CodeLanguage): React.ReactNode {
  if (
    line.trim().startsWith('//') ||
    line.trim().startsWith('/*') ||
    line.trim().startsWith('*') ||
    line.trim().startsWith('<!--')
  ) {
    return <span className="italic text-slate-500">{line}</span>;
  }

  if (lang === 'markdown') {
    if (line.startsWith('#')) {
      return <span className="font-bold text-[#FF6B00]">{line}</span>;
    }
    if (line.trim().startsWith('-') || /^\d+\./.test(line.trim())) {
      return <span className="text-amber-200">{line}</span>;
    }
  }

  const tokens = line.split(
    /(\b(?:import|export|from|const|let|function|return|async|await|interface|type|if|else)\b|'[^']*'|"[^"]*"|`[^`]*`|#[0-9A-Fa-f]{6}\b)/g
  );

  return tokens.map((token, idx) => {
    if (
      /^(import|export|from|const|let|function|return|async|await|interface|type|if|else)$/.test(
        token
      )
    ) {
      return (
        <span key={idx} className="font-semibold text-[#FF6B00]">
          {token}
        </span>
      );
    }
    if (/^('[^']*'|"[^"]*"|`[^`]*`)$/.test(token)) {
      return (
        <span key={idx} className="text-amber-300">
          {token}
        </span>
      );
    }
    if (/^#[0-9A-Fa-f]{6}$/i.test(token)) {
      return (
        <span
          key={idx}
          className="inline-flex items-center gap-1 rounded bg-slate-900 px-1.5 py-0.2 font-mono text-xs text-white ring-1 ring-white/15"
        >
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: token }}
          />
          {token}
        </span>
      );
    }
    return <span key={idx}>{token}</span>;
  });
}

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
  // 'main-split' = Sección 1 (Izquierda/Centro: Pantallazos y UI/UX) + Sección 2 (Derecha: Árbol de Archivos .RAR y Código)
  // 'docs-metadata' = Sección 3 (Panel/Pestaña dedicada a Documentación .MD y Metadatos Técnicos)
  const [activeSectionView, setActiveSectionView] = useState<'main-split' | 'docs-metadata'>(
    'main-split'
  );

  const [selectedSourceId, setSelectedSourceId] = useState<string>(
    activeRarPackage.files[0]?.id || 'f-1'
  );
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    'src/components': true,
    'src/styles': true,
    'src/services': true,
    'src/config': true,
    config: true,
    docs: true,
    src: true,
  });
  const [languageFilter, setLanguageFilter] = useState<CodeLanguage | 'all'>('all');
  const [codeSearchQuery, setCodeSearchQuery] = useState('');
  const [isDraggingRar, setIsDraggingRar] = useState(false);
  const [isProcessingRar, setIsProcessingRar] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedColorHex, setCopiedColorHex] = useState<string | null>(null);
  const [savedToBovedaBanner, setSavedToBovedaBanner] = useState(false);
  const [newColorInput, setNewColorInput] = useState('#FF6B00');

  // Estados de la Sección Visual Principal (Izquierda/Centro)
  const [activeScreenshotIndex, setActiveScreenshotIndex] = useState(0);
  const [zoomedScreenshot, setZoomedScreenshot] = useState<ScreenshotEvidence | null>(null);
  const [activeMenuDemoId, setActiveMenuDemoId] = useState<string>(
    activeSkill.uiSpec.items[0]?.id || ''
  );
  const [lastTriggeredUiCommand, setLastTriggeredUiCommand] = useState<string>(
    'Haz clic en los controles interactivos del componente UI/UX para probar su respuesta'
  );

  // Modal para adjuntar nuevo código en Modo Editor
  const [showAttachCodeForm, setShowAttachCodeForm] = useState(false);
  const [newCodeFilename, setNewCodeFilename] = useState('NuevoComponente.tsx');
  const [newCodeLang, setNewCodeLang] = useState<CodeLanguage>('tsx');
  const [newCodeContent, setNewCodeContent] = useState('');

  // Estados del Traductor 1-Click (Sin Voz) en la Sección 3
  const [isTranslatingMd, setIsTranslatingMd] = useState(false);
  const [translatedFileMap, setTranslatedFileMap] = useState<Record<string, string>>({});
  const [mdDisplayMode, setMdDisplayMode] = useState<'original' | 'translated' | 'split'>(
    'original'
  );
  const [mdRenderStyle, setMdRenderStyle] = useState<'formatted' | 'raw'>('formatted');
  const [studentReadingSurface, setStudentReadingSurface] = useState<'dark' | 'ivory'>(
    'dark'
  );

  const rarInputRef = useRef<HTMLInputElement | null>(null);
  const screenshotInputRef = useRef<HTMLInputElement | null>(null);
  const zoomDialogRef = useRef<HTMLDialogElement | null>(null);

  const projectAiModelLabel =
    activeSkill.aiModelLabel ||
    activeRarPackage.metadata?.aiModelLabel ||
    'Gemini (Ultra / Máximo)';
  const projectAppliedSkill =
    activeSkill.appliedSkill ||
    activeRarPackage.metadata?.appliedSkill ||
    'ui-ux-pro-max';
  const projectLanguages = useMemo(
    () =>
      activeRarPackage.metadata?.predominantLanguages?.length
        ? activeRarPackage.metadata.predominantLanguages
        : computeLanguageBreakdown(activeRarPackage.files),
    [activeRarPackage]
  );
  const projectPalette =
    activeSkill.colorPalette ||
    activeRarPackage.metadata?.colorPalette || [
      '#0A0F1D',
      '#0F172A',
      '#FF6B00',
      '#F97316',
      '#38BDF8',
    ];

  const filteredFiles = useMemo(() => {
    if (languageFilter === 'all') return activeRarPackage.files;
    return activeRarPackage.files.filter((f) => f.language === languageFilter);
  }, [activeRarPackage.files, languageFilter]);

  const groupedByFolder = useMemo(() => {
    const groups: Record<string, RarFileEntry[]> = {};
    for (const file of filteredFiles) {
      if (!groups[file.folder]) {
        groups[file.folder] = [];
      }
      groups[file.folder].push(file);
    }
    return groups;
  }, [filteredFiles]);

  const selectedRarFile = useMemo(() => {
    return (
      activeRarPackage.files.find((f) => f.id === selectedSourceId) ||
      activeRarPackage.files[0] ||
      null
    );
  }, [activeRarPackage.files, selectedSourceId]);

  const currentOriginalMarkdown = activeSkill.markdownContent;
  const currentTranslatedMarkdown =
    activeSkill.translatedContent || translatedFileMap['skill-md'];

  const handleRarUpload = async (file: File) => {
    if (!isEditorMode) {
      onRequestLogin();
      return;
    }
    setIsProcessingRar(true);
    try {
      const parsed = await parseUploadedRarFile(
        file,
        projectAiModelLabel,
        projectAppliedSkill
      );
      onUpdateRarPackage(parsed);
      if (parsed.files[0]) {
        setSelectedSourceId(parsed.files[0].id);
      }
      setOpenFolders((prev) => {
        const next = { ...prev };
        parsed.files.forEach((f) => {
          next[f.folder] = true;
        });
        return next;
      });
    } finally {
      setIsProcessingRar(false);
    }
  };

  const handleScreenshotUpload = (file: File) => {
    if (!isEditorMode) {
      onRequestLogin();
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = String(ev.target?.result || '');
      const newShot: ScreenshotEvidence = {
        id: `shot-${Date.now()}`,
        title: file.name.replace(/\.[^.]+$/, '') || 'Captura UI/UX del Proyecto',
        dataUrl,
        createdAt: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        modelUsed: projectAiModelLabel,
      };
      onUpdateSkill({
        ...activeSkill,
        screenshots: [newShot, ...activeSkill.screenshots],
        updatedAt: new Date().toISOString(),
      });
      setActiveScreenshotIndex(0);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteScreenshot = (shotId: string) => {
    if (!isEditorMode) return;
    const remaining = activeSkill.screenshots.filter((s) => s.id !== shotId);
    onUpdateSkill({
      ...activeSkill,
      screenshots: remaining,
      updatedAt: new Date().toISOString(),
    });
    setActiveScreenshotIndex(0);
  };

  const handleAttachCodeToRar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditorMode || !newCodeContent.trim()) return;
    const cleanName = newCodeFilename.trim() || 'ModuloExtra.tsx';
    const newEntry: RarFileEntry = {
      id: `f-editor-${Date.now()}`,
      name: cleanName,
      path: `src/components/${cleanName}`,
      folder: 'src/components',
      sizeBytes: new Blob([newCodeContent]).size,
      language: newCodeLang,
      content: newCodeContent,
    };
    const updatedFiles = [newEntry, ...activeRarPackage.files];
    const updatedPkg: RarArchivePackage = {
      ...activeRarPackage,
      files: updatedFiles,
      totalSizeBytes: activeRarPackage.totalSizeBytes + newEntry.sizeBytes,
      metadata: {
        ...activeRarPackage.metadata,
        predominantLanguages: computeLanguageBreakdown(updatedFiles),
      },
    };
    onUpdateRarPackage(updatedPkg);
    setSelectedSourceId(newEntry.id);
    setNewCodeContent('');
    setShowAttachCodeForm(false);
  };

  const handleOneClickTranslate = async () => {
    setIsTranslatingMd(true);
    try {
      const translated = await translateSkillMarkdown(currentOriginalMarkdown, 'es');
      setTranslatedFileMap((prev) => ({ ...prev, 'skill-md': translated }));
      onUpdateSkillMarkdown(activeSkill.id, activeSkill.markdownContent, translated);
      setMdDisplayMode('translated');
    } finally {
      setIsTranslatingMd(false);
    }
  };

  const handleCopyContent = async () => {
    const textToCopy =
      activeSectionView === 'docs-metadata'
        ? mdDisplayMode === 'translated' && currentTranslatedMarkdown
          ? currentTranslatedMarkdown
          : currentOriginalMarkdown
        : selectedRarFile?.content || '';
    await navigator.clipboard.writeText(textToCopy);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1800);
  };

  const handleDownloadCurrentFile = () => {
    const filename =
      activeSectionView === 'docs-metadata'
        ? activeSkill.filename
        : selectedRarFile?.name || 'archivo.ts';
    const content =
      activeSectionView === 'docs-metadata'
        ? mdDisplayMode === 'translated' && currentTranslatedMarkdown
          ? currentTranslatedMarkdown
          : currentOriginalMarkdown
        : selectedRarFile?.content || '';
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddColorToPalette = () => {
    if (!isEditorMode) return;
    const normalized = newColorInput.toUpperCase();
    if (!/^#[0-9A-F]{6}$/.test(normalized)) return;
    if (projectPalette.includes(normalized)) return;
    const updatedPalette = [...projectPalette.slice(0, 5), normalized];
    onUpdateProjectMetadata(activeSkill.id, { colorPalette: updatedPalette });
    onUpdateRarPackage({
      ...activeRarPackage,
      metadata: {
        ...activeRarPackage.metadata,
        colorPalette: updatedPalette,
      },
    });
  };

  const handleSaveToBoveda = () => {
    if (!isEditorMode) {
      onRequestLogin();
      return;
    }
    onSaveRarProjectToBoveda(activeRarPackage);
    setSavedToBovedaBanner(true);
    setTimeout(() => setSavedToBovedaBanner(false), 2600);
  };

  const openZoomModal = (shot: ScreenshotEvidence) => {
    setZoomedScreenshot(shot);
    setTimeout(() => {
      zoomDialogRef.current?.showModal();
    }, 0);
  };

  const renderMarkdownFormattedBlock = (markdownText: string) => {
    const lines = markdownText.split('\n');
    const isIvory = studentReadingSurface === 'ivory';
    return (
      <div
        className={`space-y-2.5 text-sm leading-relaxed ${
          isIvory ? 'text-slate-900' : 'text-slate-200'
        }`}
      >
        {lines.map((line, index) => {
          if (line.startsWith('# ')) {
            return (
              <h3
                key={index}
                className={`border-b border-[#FF6B00]/35 pb-2 text-xl font-extrabold tracking-tight ${
                  isIvory ? 'text-slate-950' : 'text-white'
                }`}
              >
                {line.replace('# ', '')}
              </h3>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h4
                key={index}
                className={`pt-2 text-base font-bold ${
                  isIvory ? 'text-[#D95300]' : 'text-[#F97316]'
                }`}
              >
                {line.replace('## ', '')}
              </h4>
            );
          }
          if (line.trim().startsWith('- ') || /^\d+\.\s/.test(line.trim())) {
            return (
              <div
                key={index}
                className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-2 text-xs ${
                  isIvory
                    ? 'border-[#FF6B00]/35 bg-white/90 text-slate-900 shadow-xs'
                    : 'border-slate-800 bg-[#0A0F1D] text-slate-200'
                }`}
              >
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#FF6B00]" />
                <span>{line.replace(/^(- |\d+\.\s)/, '')}</span>
              </div>
            );
          }
          if (line.trim() === '---') {
            return (
              <hr
                key={index}
                className={isIvory ? 'border-[#FF6B00]/25' : 'border-slate-800'}
              />
            );
          }
          if (!line.trim()) {
            return <div key={index} className="h-1" />;
          }
          return (
            <p
              key={index}
              className={`text-xs leading-relaxed ${
                isIvory ? 'text-slate-800' : 'text-slate-300'
              }`}
            >
              {line}
            </p>
          );
        })}
      </div>
    );
  };

  const codeLines = useMemo(() => {
    const raw = selectedRarFile?.content || '';
    const lines = raw.split('\n');
    if (!codeSearchQuery.trim()) {
      return lines.map((line, index) => ({ line, lineNumber: index + 1 }));
    }
    const q = codeSearchQuery.toLowerCase();
    return lines
      .map((line, index) => ({ line, lineNumber: index + 1 }))
      .filter((item) => item.line.toLowerCase().includes(q));
  }, [selectedRarFile, codeSearchQuery]);

  const currentScreenshot =
    activeSkill.screenshots[activeScreenshotIndex] || activeSkill.screenshots[0] || null;

  return (
    <div className="space-y-5">
      {/* CABECERA DEL VISOR DE PAQUETES (.RAR) + BOTÓN DEDICADO A DOCUMENTACIÓN Y METADATOS */}
      <section
        aria-label="Cabecera del Proyecto y Conmutador de Secciones"
        className="edu-floating-panel rounded-3xl p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigatePage('boveda')}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-[#0A0F1D] px-3 py-1 text-xs font-semibold text-slate-300 transition hover:border-[#FF6B00] hover:text-white cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5 text-[#FF6B00]" />
                Códice Neuronal
              </button>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FF6B00]/40 bg-[#FF6B00]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#F97316]">
                <FolderArchive className="h-3.5 w-3.5 text-[#FF6B00]" />
                Núcleo de Proyectos · {activeRarPackage.archiveName}
              </span>

              {isEditorMode ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Modo Colaborador: Edición y Subida .RAR Habilitadas
                </span>
              ) : (
                <button
                  type="button"
                  onClick={onRequestLogin}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-[#0A0F1D] px-3 py-1 text-[11px] font-semibold text-slate-300 transition hover:border-[#FF6B00] hover:text-white cursor-pointer"
                >
                  <Lock className="h-3 w-3 text-[#FF6B00]" />
                  Modo Visitante (Solo Lectura) · Activar Modo Colaborador
                </button>
              )}
            </div>

            <h1 className="mt-2 truncate text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              {activeSkill.name}
            </h1>
            <p className="mt-0.5 text-xs sm:text-sm text-slate-400 line-clamp-1">
              {activeSkill.summary}
            </p>
          </div>

          {/* Botones Estratégicos: Vista Principal (UI/UX + Árbol .RAR) vs Botón Dedicado de Documentación y Metadatos */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex rounded-2xl border border-slate-800 bg-[#0A0F1D] p-1">
              <button
                type="button"
                onClick={() => setActiveSectionView('main-split')}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition cursor-pointer ${
                  activeSectionView === 'main-split'
                    ? 'bg-gradient-to-r from-[#FF6B00] to-[#F97316] text-black shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Layers className="h-4 w-4" />
                Visor UI/UX + Árbol .RAR
              </button>

              <button
                type="button"
                onClick={() => setActiveSectionView('docs-metadata')}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition cursor-pointer ${
                  activeSectionView === 'docs-metadata'
                    ? 'bg-gradient-to-r from-[#FF6B00] to-[#F97316] text-black shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <FileText className="h-4 w-4" />
                Documentación .MD y Metadatos
              </button>
            </div>

            {/* Acciones exclusivas de Modo Editor */}
            {isEditorMode && (
              <>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingRar(true);
                  }}
                  onDragLeave={() => setIsDraggingRar(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingRar(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleRarUpload(file);
                  }}
                  onClick={() => rarInputRef.current?.click()}
                  className={`flex cursor-pointer items-center gap-2 rounded-2xl border-2 border-dashed px-3.5 py-2 transition ${
                    isDraggingRar
                      ? 'border-[#FF6B00] bg-[#FF6B00]/15 text-white'
                      : 'border-[#FF6B00]/45 bg-[#0A0F1D] text-slate-200 hover:border-[#FF6B00]'
                  }`}
                >
                  <Upload className="h-4 w-4 text-[#FF6B00]" />
                  <span className="text-xs font-bold">
                    {isProcessingRar ? 'Procesando...' : 'Subir .RAR'}
                  </span>
                  <input
                    ref={rarInputRef}
                    type="file"
                    accept=".rar,application/vnd.rar,application/x-rar-compressed"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleRarUpload(file);
                      e.target.value = '';
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveToBoveda}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-[#FF6B00]/50 bg-[#FF6B00]/15 px-3.5 py-2 text-xs font-bold text-[#F97316] transition hover:bg-[#FF6B00] hover:text-black cursor-pointer"
                >
                  {savedToBovedaBanner ? (
                    <>
                      <Check className="h-4 w-4" />
                      ¡Guardado!
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Guardar en Bóveda
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ====================================================================
          DISTRIBUCIÓN PRINCIPAL EN DOS COLUMNAS ASIMÉTRICAS:
          1. IZQUIERDA/CENTRO (7 cols): SECCIÓN VISUAL PRINCIPAL (Pantallazos y Componentes UI/UX)
          2. DERECHA (5 cols): ÁRBOL DE ARCHIVOS (.RAR) Y CÓDIGO FUENTE
         ==================================================================== */}
      {activeSectionView === 'main-split' && (
        <div className="space-y-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          {/* 1. SECCIÓN VISUAL PRINCIPAL (IZQUIERDA / CENTRO — 7 COLUMNAS) */}
          <section
            aria-label="Sección Visual Principal: Capturas de Pantalla y Componentes UI/UX"
            className="space-y-5 lg:col-span-7"
          >
            {/* Bloque Visual 1A: Vitrina Destacada de Capturas de Pantalla */}
            <div className="edu-floating-panel rounded-3xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF6B00]/15 border border-[#FF6B00]/40 text-[#FF6B00]">
                    <ImageIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#F97316]">
                      1. Sección Visual Principal (Izquierda / Centro)
                    </span>
                    <h2 className="text-base font-extrabold text-white">
                      Capturas de Pantalla y Evidencia UI/UX
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isEditorMode ? (
                    <>
                      <input
                        ref={screenshotInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleScreenshotUpload(file);
                          e.target.value = '';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => screenshotInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#F97316] px-3 py-1.5 text-xs font-extrabold text-black shadow-sm transition hover:brightness-110 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Subir Captura
                      </button>
                    </>
                  ) : (
                    <span className="text-[11px] text-slate-400">
                      {activeSkill.screenshots.length} capturas disponibles
                    </span>
                  )}
                </div>
              </div>

              {/* Visor Grande de la Captura Activa */}
              {currentScreenshot ? (
                <div className="space-y-3">
                  <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-[#0A0F1D]">
                    <img
                      src={currentScreenshot.dataUrl}
                      alt={currentScreenshot.title}
                      width={640}
                      height={360}
                      className="h-[270px] sm:h-[310px] w-full object-cover transition duration-300 group-hover:scale-[1.01]"
                    />
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-[#0A0F1D] via-[#0A0F1D]/85 to-transparent p-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-white">
                          {currentScreenshot.title}
                        </p>
                        <p className="text-[11px] text-[#F97316]">
                          Generado con {currentScreenshot.modelUsed} · {currentScreenshot.createdAt}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => openZoomModal(currentScreenshot)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF6B00] px-3 py-1.5 text-xs font-extrabold text-black shadow-md transition hover:brightness-110 cursor-pointer"
                        >
                          <Maximize2 className="h-3.5 w-3.5" />
                          Zoom
                        </button>
                        {isEditorMode && (
                          <button
                            type="button"
                            onClick={() => handleDeleteScreenshot(currentScreenshot.id)}
                            aria-label="Eliminar captura"
                            className="rounded-xl border border-rose-500/40 bg-rose-950/70 p-2 text-rose-300 hover:bg-rose-900 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Miniaturas de navegación de capturas */}
                  {activeSkill.screenshots.length > 1 && (
                    <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                      {activeSkill.screenshots.map((shot, idx) => (
                        <button
                          key={shot.id}
                          type="button"
                          onClick={() => setActiveScreenshotIndex(idx)}
                          className={`relative h-16 w-28 shrink-0 overflow-hidden rounded-xl border-2 transition cursor-pointer ${
                            idx === activeScreenshotIndex
                              ? 'border-[#FF6B00] shadow-md shadow-[#FF6B00]/20'
                              : 'border-slate-800 opacity-65 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={shot.dataUrl}
                            alt={shot.title}
                            width={112}
                            height={64}
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-800 bg-[#0A0F1D] p-8 text-center">
                  <p className="text-xs text-slate-400">
                    No hay capturas registradas en este paquete.
                  </p>
                </div>
              )}
            </div>

            {/* Bloque Visual 1B: Previsualización Interactiva del Componente UI/UX del Proyecto */}
            <div className="edu-floating-panel rounded-3xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                      Componente UI/UX en Vivo · {activeSkill.uiSpec.type.toUpperCase()}
                    </span>
                    <h3 className="text-sm font-extrabold text-white">
                      {activeSkill.uiSpec.title}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigatePage('preview')}
                  className="rounded-xl border border-[#FF6B00]/40 bg-[#FF6B00]/10 px-3 py-1.5 text-xs font-bold text-[#F97316] transition hover:bg-[#FF6B00] hover:text-black cursor-pointer"
                >
                  Abrir Laboratorio UI/UX Completo →
                </button>
              </div>

              {/* Escenario interactivo del componente UI/UX */}
              <div className="rounded-2xl border border-slate-800 bg-[#0A0F1D] p-4 space-y-3">
                <div
                  role="menubar"
                  aria-label={activeSkill.uiSpec.title}
                  className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-800 bg-[#0F172A] p-1.5"
                >
                  {activeSkill.uiSpec.items.map((item) => {
                    const isSelected = activeMenuDemoId === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="menuitem"
                        aria-expanded={isSelected}
                        onClick={() => {
                          setActiveMenuDemoId(item.id);
                          setLastTriggeredUiCommand(
                            `Menú activado: "${item.label}" (${item.shortcut || 'Interactivo'})`
                          );
                        }}
                        className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-[#FF6B00] to-[#F97316] text-black shadow-sm'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <span>{item.label}</span>
                        {item.shortcut && (
                          <kbd
                            className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                              isSelected
                                ? 'bg-black/20 text-black'
                                : 'bg-slate-900 text-slate-400'
                            }`}
                          >
                            {item.shortcut}
                          </kbd>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Sub-ítems del menú activo */}
                {activeSkill.uiSpec.items.find((i) => i.id === activeMenuDemoId)?.children && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    {activeSkill.uiSpec.items
                      .find((i) => i.id === activeMenuDemoId)
                      ?.children?.map((sub) => (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() =>
                            setLastTriggeredUiCommand(
                              `Acción ejecutada: ${sub.label} (${sub.shortcut || 'OK'})`
                            )
                          }
                          className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#131C31] px-3 py-2 text-left text-xs text-slate-200 transition hover:border-[#FF6B00] hover:text-white cursor-pointer"
                        >
                          <span className="truncate font-semibold">{sub.label}</span>
                          {sub.shortcut && (
                            <span className="font-mono text-[10px] text-[#F97316]">
                              {sub.shortcut}
                            </span>
                          )}
                        </button>
                      ))}
                  </div>
                )}

                <div className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-[#0F172A] px-3 py-2 text-[11px] font-mono text-slate-300">
                  <span className="truncate">{lastTriggeredUiCommand}</span>
                  <span className="text-[#FF6B00] font-bold shrink-0 ml-2">UI/UX READY</span>
                </div>
              </div>
            </div>
          </section>

          {/* 2. ÁRBOL DE ARCHIVOS E INSPECTOR DE CÓDIGO FUENTE (DERECHA — 5 COLUMNAS) */}
          <aside
            aria-label="Árbol de Archivos .RAR y Visualizador de Código Fuente"
            className="edu-floating-panel rounded-3xl p-5 space-y-4 lg:col-span-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3.5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#F97316]">
                  2. Explorador de Paquete (Derecha)
                </span>
                <h2 className="text-base font-extrabold text-white">
                  Árbol de Archivos (.RAR) y Código
                </h2>
              </div>

              <div className="flex items-center gap-1.5">
                {isEditorMode && (
                  <button
                    type="button"
                    onClick={() => setShowAttachCodeForm((v) => !v)}
                    className="inline-flex items-center gap-1 rounded-xl border border-[#FF6B00]/45 bg-[#FF6B00]/15 px-2.5 py-1.5 text-[11px] font-bold text-[#F97316] transition hover:bg-[#FF6B00] hover:text-black cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Adjuntar Código
                  </button>
                )}
                <span className="rounded-full border border-slate-700 bg-[#0A0F1D] px-2.5 py-1 font-mono text-[10px] text-slate-300">
                  {activeRarPackage.files.length} archivos
                </span>
              </div>
            </div>

            {/* Formulario desplegable para adjuntar un archivo de código al árbol (Solo Modo Editor) */}
            {isEditorMode && showAttachCodeForm && (
              <form
                onSubmit={handleAttachCodeToRar}
                className="rounded-2xl border border-[#FF6B00]/45 bg-[#0A0F1D] p-3.5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#F97316]">
                    Adjuntar Nuevo Archivo al Árbol .RAR
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAttachCodeForm(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newCodeFilename}
                    onChange={(e) => setNewCodeFilename(e.target.value)}
                    placeholder="NombreArchivo.tsx"
                    className="rounded-xl border border-slate-800 bg-[#0F172A] px-3 py-1.5 text-xs text-white font-mono"
                  />
                  <select
                    value={newCodeLang}
                    onChange={(e) => setNewCodeLang(e.target.value as CodeLanguage)}
                    className="rounded-xl border border-slate-800 bg-[#0F172A] px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="tsx">React TSX</option>
                    <option value="typescript">TypeScript</option>
                    <option value="css">CSS</option>
                    <option value="json">JSON</option>
                    <option value="markdown">Markdown</option>
                  </select>
                </div>
                <textarea
                  rows={4}
                  value={newCodeContent}
                  onChange={(e) => setNewCodeContent(e.target.value)}
                  placeholder="// Pega aquí el código fuente a incluir en el árbol..."
                  className="w-full rounded-xl border border-slate-800 bg-[#0F172A] p-2.5 font-mono text-xs text-white"
                />
                <button
                  type="submit"
                  className="w-full rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#F97316] py-2 text-xs font-extrabold text-black cursor-pointer"
                >
                  Guardar Archivo en el Árbol
                </button>
              </form>
            )}

            {/* Filtros por lenguaje */}
            <div className="flex flex-wrap gap-1.5">
              {(
                ['all', 'tsx', 'typescript', 'css', 'markdown', 'json'] as const
              ).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguageFilter(lang)}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition cursor-pointer ${
                    languageFilter === lang
                      ? 'bg-[#FF6B00] text-black'
                      : 'border border-slate-800 bg-[#0A0F1D] text-slate-400 hover:border-[#FF6B00]/40 hover:text-white'
                  }`}
                >
                  {lang === 'all' ? 'Todos' : LANGUAGE_BADGES[lang].label}
                </button>
              ))}
            </div>

            {/* Árbol interactivo de carpetas y archivos del .RAR */}
            <div
              role="tree"
              aria-label="Estructura de carpetas del paquete .rar"
              className="max-h-[210px] space-y-1.5 overflow-y-auto rounded-2xl border border-slate-800 bg-[#0A0F1D] p-2.5"
            >
              {Object.entries(groupedByFolder).map(([folderName, files]) => {
                const isOpen = openFolders[folderName] ?? true;
                return (
                  <div key={folderName} className="space-y-1">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenFolders((prev) => ({
                          ...prev,
                          [folderName]: !isOpen,
                        }))
                      }
                      className="flex w-full items-center justify-between rounded-xl px-2 py-1 text-left text-xs font-bold text-slate-200 hover:bg-slate-800/60 cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        {isOpen ? (
                          <ChevronDown className="h-3.5 w-3.5 text-[#FF6B00]" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                        )}
                        {isOpen ? (
                          <FolderOpen className="h-3.5 w-3.5 text-[#FF6B00]" />
                        ) : (
                          <Folder className="h-3.5 w-3.5 text-[#F97316]" />
                        )}
                        <span className="font-mono text-[11px]">{folderName}/</span>
                      </span>
                      <span className="text-[10px] text-slate-500">{files.length}</span>
                    </button>

                    {isOpen && (
                      <div className="space-y-0.5 pl-4">
                        {files.map((file) => {
                          const isSelected = selectedRarFile?.id === file.id;
                          const badge = LANGUAGE_BADGES[file.language];
                          return (
                            <button
                              key={file.id}
                              type="button"
                              role="treeitem"
                              aria-selected={isSelected}
                              onClick={() => setSelectedSourceId(file.id)}
                              className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs transition cursor-pointer ${
                                isSelected
                                  ? 'border border-[#FF6B00]/60 bg-[#FF6B00]/15 font-bold text-white'
                                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                              }`}
                            >
                              <span className="flex items-center gap-2 truncate">
                                <FileCode
                                  className={`h-3.5 w-3.5 shrink-0 ${
                                    isSelected ? 'text-[#FF6B00]' : 'text-slate-500'
                                  }`}
                                />
                                <span className="truncate font-mono text-[11px]">
                                  {file.name}
                                </span>
                              </span>
                              <span
                                className={`ml-2 shrink-0 rounded border px-1.5 py-0.2 font-mono text-[9px] font-bold ${badge.colorClass}`}
                              >
                                {badge.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Visor de Código Fuente del archivo seleccionado en el árbol */}
            <figure className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0A0F1D]">
              <figcaption className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-[#0F172A] px-3.5 py-2 text-[11px]">
                <span className="font-mono font-bold text-white truncate">
                  {selectedRarFile?.path}
                </span>
                <div className="flex items-center gap-1.5">
                  <search role="search" className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
                    <input
                      type="search"
                      value={codeSearchQuery}
                      onChange={(e) => setCodeSearchQuery(e.target.value)}
                      placeholder="Buscar..."
                      aria-label="Buscar línea de código"
                      className="w-24 rounded-lg border border-slate-700 bg-[#0A0F1D] py-0.5 pl-7 pr-2 text-[10px] text-white focus:border-[#FF6B00] focus:outline-none"
                    />
                  </search>
                  <button
                    type="button"
                    onClick={handleCopyContent}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-[#0A0F1D] px-2 py-1 text-[10px] font-semibold text-slate-300 hover:border-[#FF6B00] hover:text-white cursor-pointer"
                  >
                    {copiedCode ? (
                      <Check className="h-3 w-3 text-[#FF6B00]" />
                    ) : (
                      <Copy className="h-3 w-3 text-[#FF6B00]" />
                    )}
                    {copiedCode ? 'OK' : 'Copiar'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadCurrentFile}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#FF6B00]/40 bg-[#FF6B00]/15 px-2 py-1 text-[10px] font-bold text-[#F97316] hover:bg-[#FF6B00] hover:text-black cursor-pointer"
                  >
                    <Download className="h-3 w-3" />
                  </button>
                </div>
              </figcaption>
              <pre
                tabIndex={0}
                className="h-[310px] overflow-auto p-3.5 font-mono text-[11px] leading-relaxed text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
              >
                <code>
                  {codeLines.map(({ line, lineNumber }) => (
                    <div
                      key={lineNumber}
                      className="grid grid-cols-[2.2rem_1fr] gap-2.5 rounded px-1.5 py-0.5 hover:bg-slate-900/80"
                    >
                      <span className="select-none text-right text-slate-600">
                        {lineNumber}
                      </span>
                      <span className="whitespace-pre-wrap break-all">
                        {renderHighlightedLine(
                          line,
                          selectedRarFile?.language || 'typescript'
                        )}
                      </span>
                    </div>
                  ))}
                </code>
              </pre>
            </figure>
          </aside>
        </div>

        {/* Catálogo Interactivo de Componentes UI/UX con botones Hover: "Ver Demostración" y "Mostrar Prompt y Rendimiento" */}
        <div className="edu-floating-panel rounded-3xl p-6">
          <StylePresetCatalog
            skill={activeSkill}
            isCollaboratorMode={isEditorMode}
            onRequestLogin={onRequestLogin}
            onApplyPreset={(preset: UIStylePreset, applyMarkdownToo: boolean) => {
              onUpdateSkill({
                ...activeSkill,
                markdownContent: applyMarkdownToo
                  ? preset.promptMarkdown
                  : activeSkill.markdownContent,
                aiModelLabel: preset.defaultAiModel || activeSkill.aiModelLabel,
                uiSpec: {
                  ...activeSkill.uiSpec,
                  type: preset.componentType,
                  title: preset.name,
                  theme: preset.theme,
                  activePresetId: preset.id,
                  accentColors: preset.colors,
                  styleLabel: preset.styleCategory,
                  items: preset.menuItems,
                },
              });
              setLastTriggeredUiCommand(
                `Arquetipo UI/UX "${preset.name}" sincronizado en ${activeSkill.filename}.`
              );
            }}
          />
        </div>
        </div>
      )}

      {/* ====================================================================
          3. SECCIÓN DEDICADA DE DOCUMENTACIÓN (.MD) Y METADATOS TÉCNICOS
         ==================================================================== */}
      {activeSectionView === 'docs-metadata' && (
        <section
          aria-label="Documentación y Metadatos Técnicos del Proyecto"
          className="space-y-6"
        >
          {/* Cuadrícula de los 4 Metadatos Técnicos Solicitados */}
          <div className="edu-floating-panel rounded-3xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3.5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#F97316]">
                  3. Ficha de Metadatos Técnicos del Núcleo de Proyectos
                </span>
                <h2 className="text-lg font-extrabold text-white">
                  Cortex de Modelos, Skill Aplicada, Paleta y Lenguajes
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveSectionView('main-split')}
                className="rounded-xl border border-slate-700 bg-[#0A0F1D] px-3.5 py-1.5 text-xs font-bold text-slate-300 hover:border-[#FF6B00] hover:text-white cursor-pointer"
              >
                ← Volver al Núcleo de Proyectos y Árbol .RAR
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {/* 1. Modelo de IA Empleado */}
              <div className="rounded-2xl border border-slate-800 bg-[#0A0F1D] p-4">
                <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <Cpu className="h-3.5 w-3.5 text-[#FF6B00]" />
                  Versión del Cortex de Modelos
                </span>
                {isEditorMode ? (
                  <select
                    aria-label="Modelo de IA empleado"
                    value={projectAiModelLabel}
                    onChange={(e) => {
                      const newLabel = e.target.value;
                      onUpdateProjectMetadata(activeSkill.id, { aiModelLabel: newLabel });
                      onUpdateRarPackage({
                        ...activeRarPackage,
                        metadata: { ...activeRarPackage.metadata, aiModelLabel: newLabel },
                      });
                    }}
                    className="mt-2.5 w-full rounded-xl border border-[#FF6B00]/40 bg-[#0F172A] px-3 py-2 text-xs font-bold text-white"
                  >
                    {AI_BENCHMARK_MODELS.map((m) => {
                      const label = `${m.family} · ${m.version}`;
                      return (
                        <option key={m.id} value={label}>
                          {label} ({m.tier})
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <p className="mt-2.5 rounded-xl border border-slate-800 bg-[#0F172A] px-3 py-2 text-xs font-bold text-white">
                    {projectAiModelLabel}
                  </p>
                )}
                <p className="mt-2 text-[11px] text-slate-400">
                  Arquitectura generada y auditada con esta versión exacta.
                </p>
              </div>

              {/* 2. Skill Aplicada */}
              <div className="rounded-2xl border border-slate-800 bg-[#0A0F1D] p-4">
                <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <Sparkles className="h-3.5 w-3.5 text-[#FF6B00]" />
                  Skill Aplicada
                </span>
                {isEditorMode ? (
                  <select
                    aria-label="Skill aplicada"
                    value={projectAppliedSkill}
                    onChange={(e) => {
                      const newSkill = e.target.value;
                      onUpdateProjectMetadata(activeSkill.id, { appliedSkill: newSkill });
                      onUpdateRarPackage({
                        ...activeRarPackage,
                        metadata: { ...activeRarPackage.metadata, appliedSkill: newSkill },
                      });
                    }}
                    className="mt-2.5 w-full rounded-xl border border-[#FF6B00]/40 bg-[#0F172A] px-3 py-2 font-mono text-xs font-bold text-[#F97316]"
                  >
                    {AVAILABLE_SKILLS.map((sk) => (
                      <option key={sk} value={sk}>
                        #{sk}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="mt-2.5 rounded-xl border border-slate-800 bg-[#0F172A] px-3 py-2 font-mono text-xs font-bold text-[#F97316]">
                    #{projectAppliedSkill}
                  </p>
                )}
                <p className="mt-2 text-[11px] text-slate-400">
                  Estándar de diseño y buenas prácticas aplicado.
                </p>
              </div>

              {/* 3. Lenguajes de Programación Predominantes */}
              <div className="rounded-2xl border border-slate-800 bg-[#0A0F1D] p-4">
                <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <Code2 className="h-3.5 w-3.5 text-[#FF6B00]" />
                  Lenguajes Predominantes
                </span>
                <div className="mt-2.5 flex h-2.5 w-full overflow-hidden rounded-full bg-slate-900">
                  {projectLanguages.map((item) => (
                    <div
                      key={item.language}
                      style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                      title={`${item.language}: ${item.percentage}%`}
                    />
                  ))}
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {projectLanguages.map((item) => (
                    <span
                      key={item.language}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-800 bg-[#0F172A] px-2 py-0.5 text-[10px] font-semibold text-slate-200"
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      {item.language}{' '}
                      <strong className="text-[#F97316]">{item.percentage}%</strong>
                    </span>
                  ))}
                </div>
              </div>

              {/* 4. Paleta de Colores Utilizada */}
              <div className="rounded-2xl border border-slate-800 bg-[#0A0F1D] p-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <Palette className="h-3.5 w-3.5 text-[#FF6B00]" />
                    Paleta de Colores
                  </span>
                  {copiedColorHex && (
                    <span className="font-mono text-[10px] font-bold text-[#F97316]">
                      {copiedColorHex} copiado
                    </span>
                  )}
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  {projectPalette.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(hex);
                        setCopiedColorHex(hex);
                        setTimeout(() => setCopiedColorHex(null), 1500);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-[#0F172A] px-2 py-1 font-mono text-[11px] text-slate-200 hover:border-[#FF6B00] cursor-pointer"
                    >
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-white/20"
                        style={{ backgroundColor: hex }}
                      />
                      {hex}
                    </button>
                  ))}
                </div>
                {isEditorMode && (
                  <div className="mt-2.5 flex items-center gap-1.5">
                    <input
                      type="color"
                      aria-label="Añadir color a la paleta"
                      value={newColorInput}
                      onChange={(e) => setNewColorInput(e.target.value)}
                      className="h-6 w-8 cursor-pointer rounded border border-slate-700 bg-transparent"
                    />
                    <button
                      type="button"
                      onClick={handleAddColorToPalette}
                      className="rounded-lg border border-slate-700 bg-[#0F172A] px-2 py-1 text-[10px] font-bold text-slate-300 hover:border-[#FF6B00] hover:text-white cursor-pointer"
                    >
                      + Añadir ({newColorInput.toUpperCase()})
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Visor de Documentación Markdown con Traductor 1-Click Sin Voz */}
          <div className="edu-floating-panel rounded-3xl p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#FF6B00]/40 bg-[#0A0F1D] text-[#FF6B00]">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-mono text-base font-extrabold text-white">
                    Documentación Técnica: {activeSkill.filename}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Incluye traducción instantánea al español en 1 clic (sin reproducir audios ni voces)
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleOneClickTranslate}
                  disabled={isTranslatingMd}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#F97316] px-4 py-2 text-xs font-extrabold text-black shadow-md transition hover:brightness-110 cursor-pointer"
                >
                  <Languages className="h-4 w-4" />
                  {isTranslatingMd ? 'Traduciendo...' : 'Traducir al Español (1-Click)'}
                </button>

                {currentTranslatedMarkdown && (
                  <div className="inline-flex rounded-xl border border-slate-800 bg-[#0A0F1D] p-1">
                    <button
                      type="button"
                      onClick={() => setMdDisplayMode('translated')}
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                        mdDisplayMode === 'translated'
                          ? 'bg-[#FF6B00] text-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Español
                    </button>
                    <button
                      type="button"
                      onClick={() => setMdDisplayMode('original')}
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                        mdDisplayMode === 'original'
                          ? 'bg-[#FF6B00] text-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Original
                    </button>
                    <button
                      type="button"
                      onClick={() => setMdDisplayMode('split')}
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                        mdDisplayMode === 'split'
                          ? 'bg-[#FF6B00] text-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Columns className="h-3.5 w-3.5" />
                      Dividido
                    </button>
                  </div>
                )}

                <div className="inline-flex rounded-xl border border-slate-800 bg-[#0A0F1D] p-1">
                  <button
                    type="button"
                    onClick={() => setStudentReadingSurface('dark')}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                      studentReadingSurface === 'dark'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Azul Noche
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudentReadingSurface('ivory')}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                      studentReadingSurface === 'ivory'
                        ? 'bg-[#F9F6F0] text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Marfil (#F9F6F0)
                  </button>
                </div>

                <div className="inline-flex rounded-xl border border-slate-800 bg-[#0A0F1D] p-1">
                  <button
                    type="button"
                    onClick={() => setMdRenderStyle('formatted')}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
                      mdRenderStyle === 'formatted'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Eye className="h-3 w-3 text-[#FF6B00]" />
                    Lectura
                  </button>
                  <button
                    type="button"
                    onClick={() => setMdRenderStyle('raw')}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
                      mdRenderStyle === 'raw'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Code2 className="h-3 w-3 text-[#FF6B00]" />
                    Raw
                  </button>
                </div>

                <a
                  href={`obsidian://open?vault=ai-skills-studio&file=skills%2F${encodeURIComponent(activeSkill.filename || 'auditor-de-conversiones.md')}`}
                  title="Abrir esta nota y su grafo en Obsidian"
                  className="btn-obsidian-vault inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-bold transition cursor-pointer"
                >
                  <ObsidianBrandIcon className="h-3.5 w-3.5 shrink-0" />
                  <span>Abrir en Obsidian</span>
                </a>
              </div>
            </div>

            {mdRenderStyle === 'formatted' ? (
              mdDisplayMode === 'split' && currentTranslatedMarkdown ? (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div
                    className={`rounded-2xl p-6 ${
                      studentReadingSurface === 'ivory'
                        ? 'edu-ivory-reading-card'
                        : 'border border-slate-800 bg-[#0A0F1D]'
                    }`}
                  >
                    <span className="mb-3 inline-block rounded-full border border-slate-700 bg-slate-900 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                      Original
                    </span>
                    {renderMarkdownFormattedBlock(currentOriginalMarkdown)}
                  </div>
                  <div
                    className={`rounded-2xl p-6 ${
                      studentReadingSurface === 'ivory'
                        ? 'edu-ivory-reading-card'
                        : 'border border-[#FF6B00]/45 bg-[#0A0F1D]'
                    }`}
                  >
                    <span className="mb-3 inline-block rounded-full bg-[#FF6B00] px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-black">
                      Traducido al Español (1-Click · Sin Voz)
                    </span>
                    {renderMarkdownFormattedBlock(currentTranslatedMarkdown)}
                  </div>
                </div>
              ) : (
                <div
                  className={`rounded-2xl p-6 ${
                    studentReadingSurface === 'ivory'
                      ? 'edu-ivory-reading-card'
                      : 'border border-slate-800 bg-[#0A0F1D]'
                  }`}
                >
                  {renderMarkdownFormattedBlock(
                    mdDisplayMode === 'translated' && currentTranslatedMarkdown
                      ? currentTranslatedMarkdown
                      : currentOriginalMarkdown
                  )}
                </div>
              )
            ) : (
              <pre
                tabIndex={0}
                className="max-h-[420px] overflow-auto rounded-2xl border border-slate-800 bg-[#0A0F1D] p-5 font-mono text-xs leading-relaxed text-slate-200"
              >
                <code>
                  {mdDisplayMode === 'translated' && currentTranslatedMarkdown
                    ? currentTranslatedMarkdown
                    : currentOriginalMarkdown}
                </code>
              </pre>
            )}
          </div>
        </section>
      )}

      {/* MODAL NATIVO <dialog> PARA ZOOM DE CAPTURAS DE PANTALLA */}
      <dialog
        ref={zoomDialogRef}
        closedby="any"
        className="backdrop:bg-black/80 bg-transparent p-0 max-w-4xl w-full rounded-3xl m-auto"
      >
        {zoomedScreenshot && (
          <div className="edu-floating-panel rounded-3xl p-5 space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">
                  {zoomedScreenshot.title}
                </h3>
                <p className="text-xs text-[#F97316]">
                  {zoomedScreenshot.modelUsed} · {zoomedScreenshot.createdAt}
                </p>
              </div>
              <form method="dialog">
                <button
                  type="submit"
                  className="rounded-xl border border-slate-700 bg-[#0A0F1D] px-3 py-1.5 text-xs font-bold text-slate-300 hover:border-[#FF6B00] hover:text-white cursor-pointer"
                >
                  Cerrar (Esc)
                </button>
              </form>
            </div>
            <img
              src={zoomedScreenshot.dataUrl}
              alt={zoomedScreenshot.title}
              width={900}
              height={520}
              className="w-full rounded-2xl border border-slate-800 object-contain max-h-[70vh] bg-[#0A0F1D]"
            />
          </div>
        )}
      </dialog>
    </div>
  );
};
