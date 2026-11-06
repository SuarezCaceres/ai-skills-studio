import React, { useState, useRef, useEffect } from 'react';
import {
  SkillDocument,
  LanguageCode,
  SkillLevel,
  SkillKind,
} from '../types/skill';
import { AppPageRoute } from '../types/workspace';
import { ObsidianBrandIcon } from './BrandIcons';
import {
  FileText,
  Plus,
  Download,
  Upload,
  Trash2,
  Edit3,
  Save,
  X,
  Search,
  ChevronRight,
  Crown,
  Code2,
  Check,
  Cpu,
  Sparkles,
  FolderArchive,
  Lock,
  ShieldCheck,
} from 'lucide-react';

interface SkillManagerProps {
  skills: SkillDocument[];
  activeSkillId: string;
  isEditorMode: boolean;
  currentUserName?: string;
  onRequestLogin: () => void;
  onSelectSkill: (id: string) => void;
  onCreateSkill: (newSkill: Omit<SkillDocument, 'id' | 'updatedAt'>) => void;
  onUpdateSkill: (skill: SkillDocument) => void;
  onDeleteSkill: (id: string) => void;
  onStatusChange: (status: string | null) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onNavigatePage: (page: AppPageRoute) => void;
}

export const SkillManager: React.FC<SkillManagerProps> = ({
  skills,
  activeSkillId,
  isEditorMode,
  onRequestLogin,
  onSelectSkill,
  onCreateSkill,
  onUpdateSkill,
  onDeleteSkill,
  onStatusChange,
  searchQuery,
  onSearchChange,
  onNavigatePage,
}) => {
  const activeSkill = skills.find((s) => s.id === activeSkillId) || skills[0];

  const [kindFilter, setKindFilter] = useState<'all' | SkillKind>('all');
  const [levelFilter, setLevelFilter] = useState<'all' | SkillLevel>('all');
  const [isEditing, setIsEditing] = useState(false);

  const [draftName, setDraftName] = useState(activeSkill.name);
  const [draftFilename, setDraftFilename] = useState(activeSkill.filename);
  const [draftSummary, setDraftSummary] = useState(activeSkill.summary);
  const [draftCategory, setDraftCategory] = useState(activeSkill.category);
  const [draftLevel, setDraftLevel] = useState<SkillLevel>(activeSkill.level);
  const [draftLanguage, setDraftLanguage] = useState<LanguageCode>(
    activeSkill.language
  );
  const [draftMarkdown, setDraftMarkdown] = useState(
    activeSkill.markdownContent
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const codiceSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraftName(activeSkill.name);
    setDraftFilename(activeSkill.filename);
    setDraftSummary(activeSkill.summary);
    setDraftCategory(activeSkill.category);
    setDraftLevel(activeSkill.level);
    setDraftLanguage(activeSkill.language);
    setDraftMarkdown(activeSkill.markdownContent);
  }, [activeSkill.id]);

  const filteredSkills = skills.filter((s) => {
    const matchesQuery =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.aiModelLabel || '')
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (s.appliedSkill || '')
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      s.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesKind = kindFilter === 'all' || s.kind === kindFilter;
    const matchesLevel = levelFilter === 'all' || s.level === levelFilter;
    return matchesQuery && matchesKind && matchesLevel;
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanFilename = draftFilename.trim().endsWith('.md')
      ? draftFilename.trim()
      : `${draftFilename.trim() || 'skill'}.md`;
    onUpdateSkill({
      ...activeSkill,
      name: draftName.trim() || 'Skill sin título',
      filename: cleanFilename,
      summary:
        draftSummary.trim() ||
        'Instrucciones personalizadas para el Cortex de Modelos.',
      category: draftCategory.trim() || 'General',
      level: draftLevel,
      language: draftLanguage,
      markdownContent: draftMarkdown,
      updatedAt: new Date().toISOString(),
    });
    setIsEditing(false);
    onStatusChange(`Guardado en el Códice Neuronal: ${cleanFilename}`);
    setTimeout(() => onStatusChange(null), 2200);
  };

  const handleDownloadMd = (skill: SkillDocument, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const blob = new Blob([skill.markdownContent], {
      type: 'text/markdown;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = skill.filename;
    a.click();
    URL.revokeObjectURL(url);
    onStatusChange(`Descargando ${skill.filename}...`);
    setTimeout(() => onStatusChange(null), 2000);
  };

  const handleImportMd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = String(event.target?.result || '');
      const baseName = file.name.replace(/\.md$/i, '');
      onCreateSkill({
        name: `${baseName} · Skill del Códice Neuronal`,
        filename: file.name.endsWith('.md') ? file.name : `${file.name}.md`,
        summary:
          content
            .split('\n')
            .find(
              (l) =>
                l.trim().length > 20 &&
                !l.startsWith('#') &&
                !l.startsWith('-')
            )
            ?.trim() || 'Skill importada desde archivo Markdown (.md) local.',
        category: 'Importada (.md)',
        level: 'Intermedio',
        kind: 'guia',
        tags: ['#markdown', '#codice-neuronal', '#skills'],
        language: 'en',
        aiModelLabel: 'Opus 5.5',
        appliedSkill: 'ui-ux-pro-max',
        colorPalette: ['#0A0F1D', '#0F172A', '#0EA5E9', '#38BDF8'],
        markdownContent: content,
        ficha: {
          whereToUse: 'Códice Neuronal, Antigravity CLI y agentes compatibles',
          requirements: 'Archivo Markdown (.md) válido',
          estimatedTime: 'Lista para usar y traducir en 1 clic.',
          collaborators: ['@colaborador'],
        },
        uiSpec: {
          ...activeSkill.uiSpec,
          id: `spec-${Date.now()}`,
          title: `Menú de ${baseName}`,
        },
        models: [
          {
            id: `mod-${Date.now()}`,
            modelName: 'Claude Opus · Versión Opus 5.5',
            provider: 'Anthropic',
            testedAt: new Date().toLocaleDateString(),
            status: 'optimal',
            notes: 'Skill importada y validada en el Códice Neuronal.',
          },
        ],
        screenshots: [],
        codeSnippets: [],
      });
      onStatusChange(`Importada al Códice Neuronal: ${file.name}`);
      setTimeout(() => onStatusChange(null), 2500);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCreateNewSkill = () => {
    const index = skills.length + 1;
    const filename = `skill-codice-${index}.md`;
    onCreateSkill({
      name: `Proyecto #${index} · Arquitectura Cyber Dark & Cian`,
      filename,
      summary:
        'Proyecto con paquete .rar asociado, traducción instantánea de Markdown en 1 clic (sin voz), Galería del Sistema y evaluación por dictado de voz.',
      category: 'Códice Neuronal',
      level: 'Intermedio',
      kind: 'proyecto',
      tags: ['#ui-ux-pro-max', '#rar-package', '#opus-5.5'],
      language: 'en',
      aiModelLabel: 'Opus 5.5',
      appliedSkill: 'ui-ux-pro-max',
      colorPalette: ['#030712', '#0B1120', '#0EA5E9', '#38BDF8'],
      ficha: {
        whereToUse: 'Códice Neuronal, Núcleo de Proyectos .RAR y Cortex IA',
        requirements:
          'Configurar las instrucciones del archivo .md y asociar una versión del Cortex de Modelos',
        estimatedTime: '2 minutos de edición interactiva',
        collaborators: ['@equipo_colaborador'],
      },
      markdownContent: `---
name: skill-codice-${index}
description: Diseña y genera menús de barras accesibles, menús desplegables con navegación por teclado y barras de comandos dinámicas en Cyber Dark (#030712) y Cian Eléctrico (#0EA5E9).
---

# Arquitecto de Componentes UI y Menús Interactivos

## Propósito de la Skill
Diseña y genera menús de barras accesibles, menús desplegables con navegación por teclado y barras de comandos dinámicas con resplandor cian sutil sobre fondo Cyber Dark.

## Instrucciones para el Agente de IA
1. Utiliza siempre elementos semánticos nativos (\`<button type="button">\`, \`<figure>\`, \`<pre tabindex="0">\`).
2. Sincroniza el estado \`aria-expanded\` en cada disparador de menú desplegable.
3. Incluye atajos de teclado claros y soporte para cerrar con la tecla \`Escape\`.`,
      uiSpec: {
        id: `spec-${Date.now()}`,
        type: 'menubar',
        title: `Menú de Proyecto #${index}`,
        theme: 'cyan',
        items: [
          {
            id: `m-${Date.now()}-1`,
            label: 'Comandos IA',
            children: [
              {
                id: `sub-${Date.now()}-1`,
                label: 'Ejecutar Skill en Opus 5.5',
                shortcut: 'Ctrl+Enter',
                checked: true,
              },
              {
                id: `sub-${Date.now()}-2`,
                label: 'Exportar .md',
                shortcut: 'Ctrl+S',
              },
            ],
          },
        ],
      },
      models: [
        {
          id: `mod-${Date.now()}`,
          modelName: 'Claude Opus · Versión Opus 5.5',
          provider: 'Anthropic',
          testedAt: new Date().toLocaleDateString(),
          status: 'optimal',
          notes: 'Creada en el Códice Neuronal.',
        },
      ],
      screenshots: [],
      codeSnippets: [],
    });
    setIsEditing(true);
  };

  const getLevelBadgeStyle = (level: SkillLevel) => {
    switch (level) {
      case 'Principiante':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40';
      case 'Intermedio':
        return 'bg-[#0EA5E9]/15 text-[#38BDF8] border-[#0EA5E9]/40';
      case 'Avanzado':
        return 'bg-rose-950/80 text-rose-300 border-rose-500/40';
    }
  };

  return (
    <div className="space-y-12">
      {/* 1. CÓDICE NEURONAL (ARSENAL DE SKILLS, PAQUETES .RAR Y METADATOS DEL SISTEMA) */}
      <section
        ref={codiceSectionRef}
        aria-labelledby="boveda-heading"
        className="space-y-6 pt-2"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#38BDF8] block">
              CÓDICE NEURONAL · NÚCLEO DE PROYECTOS (.RAR), SKILLS (.MD) Y CORTEX IA
            </span>
            <h2
              id="boveda-heading"
              className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white"
            >
              Códice Neuronal y Arsenal de Skills
            </h2>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              Selecciona cualquier elemento para abrirlo en el{' '}
              <strong className="text-[#38BDF8]">Núcleo de Proyectos</strong>{' '}
              (Árbol de archivos{' '}
              <code className="px-1.5 py-0.5 rounded-md bg-[#0F172A] border border-[#0EA5E9]/30 text-[#38BDF8] text-xs font-mono">
                .rar
              </code>
              , código fuente, Galería del Sistema y traducción de{' '}
              <code className="px-1.5 py-0.5 rounded-md bg-[#0F172A] border border-[#0EA5E9]/30 text-[#38BDF8] text-xs font-mono">
                .md
              </code>{' '}
              en 1 clic).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.markdown,.txt"
              onChange={handleImportMd}
              className="hidden"
            />
            {isEditorMode ? (
              <>
                <button
                  type="button"
                  onClick={() => onNavigatePage('estudio')}
                  className="h-10 px-4 rounded-xl bg-[#0F172A] hover:bg-slate-800 border border-[#0EA5E9]/45 text-xs font-bold text-[#38BDF8] flex items-center gap-2 transition cursor-pointer"
                >
                  <FolderArchive
                    className="w-3.5 h-3.5 text-[#0EA5E9]"
                    aria-hidden="true"
                  />
                  <span>Subir Paquete .RAR</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-10 px-4 rounded-xl bg-[#0F172A] hover:bg-slate-800 border border-slate-800 hover:border-[#0EA5E9]/50 text-xs font-bold text-slate-200 flex items-center gap-2 transition cursor-pointer"
                >
                  <Upload
                    className="w-3.5 h-3.5 text-[#0EA5E9]"
                    aria-hidden="true"
                  />
                  <span>Importar .md</span>
                </button>

                <a
                  href="obsidian://open?vault=ai-skills-studio"
                  title="Abrir este proyecto y sus notas en Obsidian"
                  className="btn-obsidian-vault h-10 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer"
                >
                  <ObsidianBrandIcon className="w-4 h-4 shrink-0" />
                  <span>Bóveda Obsidian</span>
                </a>

                <button
                  type="button"
                  onClick={() => setIsEditing((v) => !v)}
                  className="h-10 px-4 rounded-xl bg-[#0F172A] hover:bg-slate-800 border border-slate-800 hover:border-[#0EA5E9]/50 text-xs font-bold text-slate-200 flex items-center gap-2 transition cursor-pointer"
                >
                  <Edit3
                    className="w-3.5 h-3.5 text-[#38BDF8]"
                    aria-hidden="true"
                  />
                  <span>{isEditing ? 'Cerrar Editor' : 'Editar Activa'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCreateNewSkill}
                  className="h-10 px-4 rounded-xl bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8] hover:brightness-110 text-black text-xs font-extrabold flex items-center gap-2 cyan-glow-sm transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Nueva Skill en Códice</span>
                </button>
              </>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href="obsidian://open?vault=ai-skills-studio"
                  title="Abrir este proyecto y sus notas en Obsidian"
                  className="btn-obsidian-vault h-10 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer"
                >
                  <ObsidianBrandIcon className="w-4 h-4 shrink-0" />
                  <span>Bóveda Obsidian</span>
                </a>
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-[#0F172A] px-3.5 py-2 text-xs font-semibold text-slate-300">
                  <Lock className="w-3.5 h-3.5 text-[#0EA5E9]" />
                  Modo Visitante: Exploración de Solo Lectura
                </span>
                <button
                  type="button"
                  onClick={onRequestLogin}
                  className="h-10 px-4 rounded-xl bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8] hover:brightness-110 text-black text-xs font-extrabold flex items-center gap-2 cyan-glow-sm transition cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Activar Modo Colaborador</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Buscador y Doble Fila de Filtros en Cyber Dark y Cian Eléctrico */}
        <div className="space-y-3.5">
          <search>
            <form onSubmit={(e) => e.preventDefault()} className="relative">
              <label htmlFor="vault-search-input" className="sr-only">
                Busca proyectos, paquetes .rar, skills en Markdown o versiones de modelos IA
              </label>
              <Search
                className="w-4 h-4 text-[#0EA5E9] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="vault-search-input"
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Busca en el Códice Neuronal por proyecto, paquete .rar, skill, framework o versión IA (Opus 5.5, Gemini 3.8, Sonnet 5.5, GPT Astra)..."
                className="w-full h-12 rounded-2xl bg-[#0F172A] border border-slate-800 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#0EA5E9] transition"
              />
            </form>
          </search>

          {/* Fila 1: Tipo */}
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: 'all', label: 'Todo el Códice' },
                {
                  id: 'proyecto',
                  label: 'Núcleo de Proyectos (.RAR)',
                  icon: true,
                },
                { id: 'guia', label: 'Guías Técnicas (.md)' },
                { id: 'repo', label: 'Repositorios & Módulos' },
              ] as const
            ).map((item) => {
              const active = kindFilter === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setKindFilter(item.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition duration-200 flex items-center gap-1.5 cursor-pointer ${
                    active
                      ? 'bg-[#0EA5E9] text-black border-[#0EA5E9] cyan-glow-sm'
                      : 'bg-[#0F172A] text-slate-300 border-slate-800 hover:border-[#0EA5E9]/50'
                  }`}
                >
                  {'icon' in item && item.icon && (
                    <Crown
                      className={`w-3.5 h-3.5 ${
                        active ? 'text-black' : 'text-[#38BDF8]'
                      }`}
                      aria-hidden="true"
                    />
                  )}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Fila 2: Nivel */}
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: 'all', label: 'Todos los niveles' },
                { id: 'Principiante', label: 'Principiante' },
                { id: 'Intermedio', label: 'Intermedio' },
                { id: 'Avanzado', label: 'Avanzado' },
              ] as const
            ).map((lvl) => {
              const active = levelFilter === lvl.id;
              return (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setLevelFilter(lvl.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition duration-200 cursor-pointer ${
                    active
                      ? 'bg-[#0EA5E9] text-black border-[#0EA5E9] cyan-glow-sm'
                      : 'bg-[#0F172A] text-slate-300 border-slate-800 hover:border-[#0EA5E9]/50'
                  }`}
                >
                  {lvl.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Editor Desplegable (Modo Colaborador) */}
        {isEditing && (
          <form
            onSubmit={handleSave}
            className="bg-[#0F172A] border border-[#0EA5E9]/40 rounded-2xl p-5 cyan-glow space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#0EA5E9]" aria-hidden="true" />
                Editando en Códice Neuronal:{' '}
                <code className="text-[#38BDF8]">{activeSkill.filename}</code>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label
                  htmlFor="skill-name-input"
                  className="block text-xs font-medium text-slate-400 mb-1"
                >
                  Título del Proyecto / Skill
                </label>
                <input
                  id="skill-name-input"
                  type="text"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  className="w-full rounded-xl bg-[#0B0F19] border border-slate-800 px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="skill-file-input"
                  className="block text-xs font-medium text-slate-400 mb-1"
                >
                  Nombre del Archivo (.md)
                </label>
                <input
                  id="skill-file-input"
                  type="text"
                  value={draftFilename}
                  onChange={(e) => setDraftFilename(e.target.value)}
                  className="w-full rounded-xl bg-[#0B0F19] border border-slate-800 px-3 py-2 text-xs font-mono text-[#38BDF8]"
                />
              </div>

              <div>
                <label
                  htmlFor="skill-level-select"
                  className="block text-xs font-medium text-slate-400 mb-1"
                >
                  Nivel
                </label>
                <select
                  id="skill-level-select"
                  value={draftLevel}
                  onChange={(e) => setDraftLevel(e.target.value as SkillLevel)}
                  className="w-full rounded-xl bg-[#0B0F19] border border-slate-800 px-3 py-2 text-xs text-white"
                >
                  <option value="Principiante">Principiante</option>
                  <option value="Intermedio">Intermedio</option>
                  <option value="Avanzado">Avanzado</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="skill-lang-select"
                  className="block text-xs font-medium text-slate-400 mb-1"
                >
                  Idioma Base
                </label>
                <select
                  id="skill-lang-select"
                  value={draftLanguage}
                  onChange={(e) =>
                    setDraftLanguage(e.target.value as LanguageCode)
                  }
                  className="w-full rounded-xl bg-[#0B0F19] border border-slate-800 px-3 py-2 text-xs text-white"
                >
                  <option value="es">Español (ES)</option>
                  <option value="en">Inglés (EN)</option>
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="skill-summary-input"
                className="block text-xs font-medium text-slate-400 mb-1"
              >
                Resumen del Proyecto
              </label>
              <input
                id="skill-summary-input"
                type="text"
                value={draftSummary}
                onChange={(e) => setDraftSummary(e.target.value)}
                className="w-full rounded-xl bg-[#0B0F19] border border-slate-800 px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label
                htmlFor="skill-md-textarea"
                className="block text-xs font-medium text-slate-400 mb-1"
              >
                Contenido Markdown (.md)
              </label>
              <textarea
                id="skill-md-textarea"
                rows={7}
                value={draftMarkdown}
                onChange={(e) => setDraftMarkdown(e.target.value)}
                className="w-full rounded-xl bg-[#0B0F19] border border-slate-800 p-3 text-xs font-mono text-slate-100 leading-relaxed focus:outline-none focus:border-[#0EA5E9]"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl border border-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8] text-black text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" aria-hidden="true" />
                Guardar {draftFilename}
              </button>
            </div>
          </form>
        )}

        {/* Lista de Proyectos del Códice Neuronal */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-slate-400 px-1">
            {filteredSkills.length}{' '}
            {filteredSkills.length === 1
              ? 'elemento en el Códice Neuronal'
              : 'elementos en el Códice Neuronal'}{' '}
            · Haz clic en cualquiera para abrirlo en el{' '}
            <strong className="text-[#38BDF8]">Núcleo de Proyectos (.RAR)</strong>
          </div>

          <div className="edu-floating-panel rounded-2xl divide-y divide-slate-800/80 overflow-hidden">
            {filteredSkills.map((skill) => {
              const isActive = skill.id === activeSkillId;
              const palette = skill.colorPalette || [
                '#0A0F1D',
                '#0F172A',
                '#0EA5E9',
                '#38BDF8',
              ];
              const langs = skill.predominantLanguages || [];

              return (
                <article
                  key={skill.id}
                  onClick={() => {
                    onSelectSkill(skill.id);
                    onNavigatePage('estudio');
                  }}
                  className={`p-4 sm:p-5 transition duration-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer ${
                    isActive ? 'bg-[#0EA5E9]/10' : 'hover:bg-slate-900/70'
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${
                        isActive
                          ? 'bg-[#0EA5E9] border-[#0EA5E9] text-black font-bold'
                          : 'bg-[#0B0F19] border-slate-800 text-[#38BDF8]'
                      }`}
                    >
                      {skill.kind === 'proyecto' ? (
                        <FolderArchive
                          className="w-4 h-4"
                          aria-hidden="true"
                        />
                      ) : skill.kind === 'repo' ? (
                        <Code2 className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <FileText className="w-4 h-4" aria-hidden="true" />
                      )}
                    </div>

                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm sm:text-[15px] font-bold text-white leading-snug">
                          {skill.name}
                        </h3>

                        {skill.kind === 'proyecto' && (
                          <Crown
                            className="w-4 h-4 text-[#38BDF8] shrink-0"
                            aria-hidden="true"
                          />
                        )}

                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#0B0F19] text-slate-300 border border-slate-800 whitespace-nowrap">
                          {skill.kind === 'guia'
                            ? 'GUÍA DEL CÓDICE'
                            : 'NÚCLEO .RAR'}
                        </span>

                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border whitespace-nowrap ${getLevelBadgeStyle(
                            skill.level
                          )}`}
                        >
                          {skill.level}
                        </span>

                        {isActive && (
                          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#0EA5E9] text-black flex items-center gap-1 whitespace-nowrap">
                            <Check className="w-3 h-3" aria-hidden="true" />
                            Activo
                          </span>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed">
                        {skill.summary}
                      </p>

                      {/* Fila explícita de Metadatos del Proyecto: Versión del Cortex IA, Skill aplicada, Lenguajes y Paleta */}
                      <div className="pt-1 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#0B0F19] text-white border border-[#0EA5E9]/45">
                          <Cpu className="w-3 h-3 text-[#0EA5E9]" />
                          {skill.aiModelLabel || 'Opus 5.5'}
                        </span>

                        <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#0B0F19] text-[#38BDF8] border border-[#38BDF8]/35">
                          <Sparkles className="w-3 h-3 text-[#38BDF8]" />
                          Skill: #{skill.appliedSkill || 'ui-ux-pro-max'}
                        </span>

                        {langs.slice(0, 3).map((l) => (
                          <span
                            key={l.language}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#0B0F19] text-slate-300 border border-slate-800"
                          >
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: l.color }}
                            />
                            {l.language} {l.percentage}%
                          </span>
                        ))}

                        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#0B0F19] text-slate-400 border border-slate-800">
                          <span>Paleta:</span>
                          {palette.slice(0, 5).map((hex) => (
                            <span
                              key={hex}
                              title={hex}
                              className="w-3 h-3 rounded-full border border-white/20"
                              style={{ backgroundColor: hex }}
                            />
                          ))}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end lg:self-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSkill(skill.id);
                        onNavigatePage('estudio');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8] text-black text-xs font-extrabold transition cursor-pointer inline-flex items-center gap-1.5 shadow-sm shadow-[#0EA5E9]/20 hover:brightness-110"
                    >
                      <span>Abrir en Núcleo de Proyectos</span>
                      <ChevronRight
                        className="w-3.5 h-3.5"
                        aria-hidden="true"
                      />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDownloadMd(skill, e)}
                      aria-label={`Descargar ${skill.filename}`}
                      className="p-2 rounded-xl text-slate-400 hover:text-[#38BDF8] hover:bg-slate-800 transition cursor-pointer"
                    >
                      <Download className="w-4 h-4" aria-hidden="true" />
                    </button>
                    {isEditorMode && skills.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSkill(skill.id);
                        }}
                        aria-label={`Eliminar ${skill.filename}`}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
