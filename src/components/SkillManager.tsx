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
  ExternalLink,
  Users,
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
  currentUserName,
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
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.filename.toLowerCase().includes(q) ||
      s.summary.toLowerCase().includes(q) ||
      (s.aiModelLabel || '').toLowerCase().includes(q) ||
      (s.appliedSkill || '').toLowerCase().includes(q) ||
      s.tags.some((t) => t.toLowerCase().includes(q));
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
            notes: 'Importada desde archivo local (.md)',
          },
        ],
        screenshots: [],
        codeSnippets: [],
      });
      onStatusChange(`Skill importada con éxito: ${file.name}`);
      setTimeout(() => onStatusChange(null), 2400);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCreateNewSkill = () => {
    const index = skills.length + 1;
    onCreateSkill({
      name: `Directiva Personalizada #${index}`,
      filename: `skill-personalizada-${index}.md`,
      summary:
        'Nueva directiva para agentes de desarrollo y modelos cognitivos.',
      category: 'Personalizada',
      level: 'Intermedio',
      kind: 'guia',
      tags: ['#custom', '#directiva-ia', '#skills'],
      language: 'es',
      aiModelLabel: 'Gemini 3.8',
      appliedSkill: 'design-taste-frontend',
      colorPalette: ['#0A0D14', '#121722', '#0EA5E9', '#38BDF8'],
      markdownContent: `---
name: directiva-personalizada-${index}
description: Directiva técnica con diseño anti-slop y controles accesibles.
---

# Directiva Técnica y Operativa para Agentes

## Propósito de la Skill
Define las directrices de arquitectura, calidad de código y diseño de interfaz para el desarrollo asistido por agentes.

## Instrucciones para el Agente de IA
1. Utiliza siempre elementos semánticos nativos (\`<button type="button">\`, \`<figure>\`, \`<pre tabindex="0">\`).
2. Mantén bordes alineados y una paleta neutra en carbón (#0a0d14) con acento cian (#0ea5e9).
3. Asegura pruebas en navegadores reales y cumplimiento con las directivas del Códice.`,
      ficha: {
        whereToUse: 'Códice Neuronal, Antigravity CLI y agentes compatibles',
        requirements: 'Archivo Markdown (.md) válido',
        estimatedTime: 'Lista para usar y traducir en 1 clic.',
        collaborators: [currentUserName || '@colaborador'],
      },
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
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-500/35';
      case 'Intermedio':
        return 'bg-[#0ea5e9]/12 text-[#38bdf8] border-[#0ea5e9]/35';
      case 'Avanzado':
        return 'bg-rose-950/60 text-rose-300 border-rose-500/35';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. CABECERA Y ARSENAL DE SKILLS */}
      <section
        ref={codiceSectionRef}
        aria-labelledby="boveda-heading"
        className="space-y-6 pt-1"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#38bdf8] block">
              CÓDICE NEURONAL · ARSENAL DE SKILLS (.MD) Y WORKSPACES VFS
            </span>
            <h1
              id="boveda-heading"
              className="text-2xl sm:text-3xl font-bold tracking-tight text-white"
            >
              Códice Neuronal y Catálogo de Skills
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Selecciona cualquier elemento para inspeccionarlo o abrirlo en{' '}
              <strong className="text-[#38bdf8]">Workspace Studio</strong>{' '}
              (VFS interactivo, diff en tiempo real y traducción técnica en 1 clic).
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
            <button
              type="button"
              onClick={() => onNavigatePage('catalogo')}
              className="h-9 px-3.5 rounded-md bg-[#121722] hover:bg-slate-800 border border-slate-700 hover:border-[#0ea5e9] text-xs font-medium text-slate-200 flex items-center gap-2 transition cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-[#0ea5e9]" aria-hidden="true" />
              <span>Catálogo comunitario</span>
            </button>
            {isEditorMode ? (
              <>
                <button
                  type="button"
                  onClick={() => onNavigatePage('estudio')}
                  className="h-9 px-3.5 rounded-md bg-[#121722] hover:bg-slate-800 border border-slate-700 hover:border-slate-500 text-xs font-medium text-slate-200 flex items-center gap-2 transition cursor-pointer"
                >
                  <FolderArchive
                    className="w-3.5 h-3.5 text-[#0ea5e9]"
                    aria-hidden="true"
                  />
                  <span>Abrir Workspace</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-9 px-3.5 rounded-md bg-[#121722] hover:bg-slate-800 border border-slate-700 hover:border-slate-500 text-xs font-medium text-slate-200 flex items-center gap-2 transition cursor-pointer"
                >
                  <Upload
                    className="w-3.5 h-3.5 text-[#0ea5e9]"
                    aria-hidden="true"
                  />
                  <span>Importar .md</span>
                </button>

                <a
                  href="obsidian://open?vault=ai-skills-studio"
                  title="Abrir este proyecto y sus notas en Obsidian"
                  className="btn-obsidian-vault h-9 px-3.5 rounded-md text-xs font-medium flex items-center gap-2 transition cursor-pointer"
                >
                  <ObsidianBrandIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>Bóveda Obsidian</span>
                </a>

                <button
                  type="button"
                  onClick={() => setIsEditing((v) => !v)}
                  className="h-9 px-3.5 rounded-md bg-[#121722] hover:bg-slate-800 border border-slate-700 hover:border-slate-500 text-xs font-medium text-slate-200 flex items-center gap-2 transition cursor-pointer"
                >
                  <Edit3
                    className="w-3.5 h-3.5 text-[#38bdf8]"
                    aria-hidden="true"
                  />
                  <span>{isEditing ? 'Cerrar Editor' : 'Editar Activa'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCreateNewSkill}
                  className="h-9 px-4 rounded-md bg-[#0ea5e9] hover:bg-[#38bdf8] text-[#0a0d14] text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Nueva Skill</span>
                </button>
              </>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href="obsidian://open?vault=ai-skills-studio"
                  title="Abrir este proyecto y sus notas en Obsidian"
                  className="btn-obsidian-vault h-9 px-3.5 rounded-md text-xs font-medium flex items-center gap-2 transition cursor-pointer"
                >
                  <ObsidianBrandIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>Bóveda Obsidian</span>
                </a>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-800 bg-[#121722] px-3 py-1.5 text-xs text-slate-400">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  Modo Visitante
                </span>
                <button
                  type="button"
                  onClick={onRequestLogin}
                  className="h-9 px-3.5 rounded-md bg-[#0ea5e9] hover:bg-[#38bdf8] text-[#0a0d14] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Activar Colaborador</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* BUSCADOR Y FILTROS ORDENADOS */}
        <div className="rounded-lg border border-slate-800 bg-[#121722] p-3 space-y-3">
          <div className="relative">
            <Search
              className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="vault-search-input"
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar en el Códice por proyecto, skill, modelo IA o tag..."
              className="w-full h-10 rounded-md bg-[#0a0d14] border border-slate-800 pl-10 pr-4 text-xs text-white placeholder:text-slate-500 focus:border-[#0ea5e9] outline-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-800/80">
            {/* Fila 1: Tipo */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-mono text-slate-500 mr-1">Tipo:</span>
              {(
                [
                  { id: 'all', label: 'Todo' },
                  { id: 'proyecto', label: 'Workspaces VFS (.ZIP)', icon: true },
                  { id: 'guia', label: 'Guías (.md)' },
                  { id: 'repo', label: 'Repositorios' },
                ] as const
              ).map((item) => {
                const active = kindFilter === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setKindFilter(item.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition cursor-pointer flex items-center gap-1 ${
                      active
                        ? 'bg-[#0ea5e9] text-[#0a0d14] border-[#0ea5e9] font-semibold'
                        : 'bg-[#0a0d14] text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {'icon' in item && item.icon && (
                      <Crown
                        className={`w-3 h-3 ${active ? 'text-[#0a0d14]' : 'text-[#38bdf8]'}`}
                        aria-hidden="true"
                      />
                    )}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Fila 2: Nivel */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-mono text-slate-500 mr-1">Nivel:</span>
              {(
                [
                  { id: 'all', label: 'Todos' },
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
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition cursor-pointer ${
                      active
                        ? 'bg-[#0ea5e9] text-[#0a0d14] border-[#0ea5e9] font-semibold'
                        : 'bg-[#0a0d14] text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {lvl.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* EDITOR DESPLEGABLE (MODO COLABORADOR) */}
        {isEditing && (
          <form
            onSubmit={handleSave}
            className="bg-[#121722] border border-[#0ea5e9]/40 rounded-lg p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 tracking-tight">
                <Edit3 className="w-4 h-4 text-[#0ea5e9]" aria-hidden="true" />
                Editando en Códice Neuronal:{' '}
                <code className="text-[#38bdf8] font-mono">{activeSkill.filename}</code>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="[display:grid] grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label
                  htmlFor="skill-name-input"
                  className="block text-xs font-medium text-slate-400 mb-1"
                >
                  Título de la Skill
                </label>
                <input
                  id="skill-name-input"
                  type="text"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  className="w-full rounded-md bg-[#0a0d14] border border-slate-700 px-3 py-1.5 text-xs text-white focus:border-[#0ea5e9] outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="skill-file-input"
                  className="block text-xs font-medium text-slate-400 mb-1"
                >
                  Nombre de archivo (.md)
                </label>
                <input
                  id="skill-file-input"
                  type="text"
                  value={draftFilename}
                  onChange={(e) => setDraftFilename(e.target.value)}
                  className="w-full rounded-md bg-[#0a0d14] border border-slate-700 px-3 py-1.5 text-xs font-mono text-[#38bdf8] focus:border-[#0ea5e9] outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="skill-level-select"
                  className="block text-xs font-medium text-slate-400 mb-1"
                >
                  Nivel de complejidad
                </label>
                <select
                  id="skill-level-select"
                  value={draftLevel}
                  onChange={(e) => setDraftLevel(e.target.value as SkillLevel)}
                  className="w-full rounded-md bg-[#0a0d14] border border-slate-700 px-3 py-1.5 text-xs text-white outline-none"
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
                  Idioma base
                </label>
                <select
                  id="skill-lang-select"
                  value={draftLanguage}
                  onChange={(e) =>
                    setDraftLanguage(e.target.value as LanguageCode)
                  }
                  className="w-full rounded-md bg-[#0a0d14] border border-slate-700 px-3 py-1.5 text-xs text-white outline-none"
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
                Resumen de propósito
              </label>
              <input
                id="skill-summary-input"
                type="text"
                value={draftSummary}
                onChange={(e) => setDraftSummary(e.target.value)}
                className="w-full rounded-md bg-[#0a0d14] border border-slate-700 px-3 py-1.5 text-xs text-white focus:border-[#0ea5e9] outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="skill-md-textarea"
                className="block text-xs font-medium text-slate-400 mb-1"
              >
                Contenido Markdown (SKILL.md)
              </label>
              <textarea
                id="skill-md-textarea"
                rows={8}
                value={draftMarkdown}
                onChange={(e) => setDraftMarkdown(e.target.value)}
                className="w-full rounded-md bg-[#0a0d14] border border-slate-700 p-3 text-xs font-mono text-slate-100 leading-relaxed focus:border-[#0ea5e9] outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3.5 py-1.5 rounded-md border border-slate-700 text-xs font-medium text-slate-300 hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-md bg-[#0ea5e9] hover:bg-[#38bdf8] text-[#0a0d14] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" aria-hidden="true" />
                Guardar cambios
              </button>
            </div>
          </form>
        )}

        {/* LISTA DE PROYECTOS Y SKILLS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1 font-mono text-xs text-slate-400">
            <span>
              {filteredSkills.length}{' '}
              {filteredSkills.length === 1 ? 'elemento' : 'elementos'} en el Códice Neuronal
            </span>
            <span className="hidden text-[11px] text-slate-500 sm:inline">
              Haz clic en una tarjeta para activarla
            </span>
          </div>

          {filteredSkills.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 bg-[#121722] p-10 text-center text-sm text-slate-300">
              Ninguna skill coincide con tu búsqueda.
            </div>
          ) : (
            <ul className="m-0 [display:grid] list-none gap-4 p-0 md:grid-cols-2 xl:grid-cols-3">
              {filteredSkills.map((skill) => {
                const isActive = skill.id === activeSkillId;
                const langs = (skill.predominantLanguages || []).slice(0, 4);
                const langTotal = langs.reduce((sum, l) => sum + l.percentage, 0) || 1;
                const KindIcon =
                  skill.kind === 'proyecto' ? FolderArchive : skill.kind === 'repo' ? Code2 : FileText;

                return (
                  <li key={skill.id} className="min-w-0">
                    <article
                      onClick={() => onSelectSkill(skill.id)}
                      className={`flex h-full cursor-pointer flex-col gap-4 rounded-xl border p-5 transition-colors ${
                        isActive
                          ? 'border-[#0ea5e9] bg-[#0ea5e9]/[0.07]'
                          : 'border-slate-800 bg-[#121722] hover:border-slate-600 hover:bg-[#141b29]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                            isActive
                              ? 'border-[#0ea5e9] bg-[#0ea5e9] text-[#0a0d14]'
                              : 'border-slate-700 bg-[#0a0d14] text-[#38bdf8]'
                          }`}
                        >
                          <KindIcon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1 truncate font-mono text-[10px] font-medium uppercase tracking-wider text-slate-400">
                          {skill.kind === 'guia' ? 'Guía técnica' : skill.kind === 'repo' ? 'Repositorio' : 'Workspace VFS'}
                        </span>
                        {isActive && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#0ea5e9] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#0a0d14]">
                            <Check className="h-3 w-3" aria-hidden="true" />
                            Activo
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h2 className="m-0 text-base font-semibold leading-snug text-white">{skill.name}</h2>
                        <p className="mb-0 mt-2 line-clamp-3 text-sm leading-relaxed text-slate-400">
                          {skill.summary}
                        </p>
                      </div>

                      {langs.length > 0 && (
                        <div>
                          <div
                            className="flex h-1.5 overflow-hidden rounded-full bg-[#0a0d14]"
                            role="img"
                            aria-label={`Lenguajes: ${langs.map((l) => `${l.language} ${l.percentage}%`).join(', ')}`}
                          >
                            {langs.map((l) => (
                              <span
                                key={l.language}
                                style={{ width: `${(l.percentage / langTotal) * 100}%`, backgroundColor: l.color }}
                              />
                            ))}
                          </div>
                          <p className="mb-0 mt-1.5 truncate font-mono text-[11px] text-slate-500">
                            {langs.map((l) => `${l.language} ${l.percentage}%`).join(' · ')}
                          </p>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span
                          className={`rounded-full border px-2.5 py-0.5 font-medium ${getLevelBadgeStyle(skill.level)}`}
                        >
                          {skill.level}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-[#0a0d14] px-2.5 py-0.5 text-slate-200">
                          <Cpu className="h-3 w-3 text-[#0ea5e9]" aria-hidden="true" />
                          {skill.aiModelLabel || 'Opus 5.5'}
                        </span>
                        <span className="truncate rounded-full border border-[#38bdf8]/35 bg-[#0a0d14] px-2.5 py-0.5 font-mono text-[#38bdf8]">
                          #{skill.appliedSkill || 'ui-ux-pro-max'}
                        </span>
                      </div>

                      <div className="mt-auto flex items-center gap-1.5 border-t border-slate-800/80 pt-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectSkill(skill.id);
                            onNavigatePage('estudio');
                          }}
                          className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border-0 bg-[#0ea5e9] px-3 py-2 text-xs font-semibold text-[#0a0d14] transition hover:bg-[#38bdf8]"
                        >
                          <span>Abrir en Workspace</span>
                          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDownloadMd(skill, e)}
                          aria-label={`Descargar ${skill.filename}`}
                          className="cursor-pointer rounded-lg border-0 bg-transparent p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                        >
                          <Download className="h-4 w-4" aria-hidden="true" />
                        </button>
                        {isEditorMode && skills.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSkill(skill.id);
                            }}
                            aria-label={`Eliminar ${skill.filename}`}
                            className="cursor-pointer rounded-lg border-0 bg-transparent p-2 text-slate-400 transition hover:bg-rose-950/40 hover:text-rose-400"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
};
