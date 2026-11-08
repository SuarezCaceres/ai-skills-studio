import React, { useState, useRef } from 'react';
import {
  AppliedSkillDetail,
  PresetAIModelName,
  SkillDocument,
  UIComponentType,
  UIMenuItem,
  UIStylePreset,
} from '../types/skill';
import { STYLE_PRESETS } from '../data/stylePresets';
import { VoiceVisualFeedback } from './VoiceVisualFeedback';
import {
  Eye,
  Code2,
  Check,
  Copy,
  Sparkles,
  X,
  ArrowUpRight,
  Palette,
  Cpu,
  Layers,
  Terminal,
  Command,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  Plus,
  Trash2,
  Lock,
  ShieldCheck,
} from 'lucide-react';

interface StylePresetCatalogProps {
  skill: SkillDocument;
  onApplyPreset: (preset: UIStylePreset, applyMarkdownToo: boolean) => void;
  isCollaboratorMode?: boolean;
  currentUserName?: string;
  onRequestLogin?: () => void;
  onUpdateAppliedSkills?: (skillsList: AppliedSkillDetail[]) => void;
}

const AI_MODEL_VERSIONS: Array<{
  version: PresetAIModelName;
  family: string;
}> = [
  { version: 'Opus 5.5', family: 'Claude Opus' },
  { version: 'Opus 4.8', family: 'Claude Opus' },
  { version: 'Gemini 3.8', family: 'Gemini' },
  { version: 'Gemini 3.7', family: 'Gemini' },
  { version: 'Sonnet 5.5', family: 'Claude Sonnet' },
  { version: 'GPT Astra', family: 'GPT' },
  { version: 'GPT Luna', family: 'GPT' },
];

export const StylePresetCatalog: React.FC<StylePresetCatalogProps> = ({
  skill,
  onApplyPreset,
  isCollaboratorMode = false,
  currentUserName,
  onRequestLogin,
  onUpdateAppliedSkills,
}) => {
  // Estados para los dos modales accionados desde los botones hover: "Ver Demostración" y "Mostrar Prompt y Rendimiento"
  const [promptModalPreset, setPromptModalPreset] =
    useState<UIStylePreset | null>(null);
  const [selectedPromptModel, setSelectedPromptModel] =
    useState<PresetAIModelName>('Opus 5.5');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Estado editable de las skills aplicadas dentro del modal "Mostrar Prompt y Rendimiento"
  const [editableSkills, setEditableSkills] = useState<AppliedSkillDetail[]>(
    []
  );
  const [newSkillIdInput, setNewSkillIdInput] = useState<string>('');
  const [newSkillDescInput, setNewSkillDescInput] = useState<string>('');

  // Estados del Modal "Ver Demostración" (Personalización de la skill y colores en vivo a gran escala)
  const [demoModalPreset, setDemoModalPreset] = useState<UIStylePreset | null>(
    null
  );
  const [customColors, setCustomColors] = useState<string[]>([
    '#0EA5E9',
    '#38BDF8',
    '#38BDF8',
    '#0A0F1D',
  ]);
  const [customHeroTitle, setCustomHeroTitle] = useState<string>('');
  const [customHeroAccent, setCustomHeroAccent] = useState<string>('');
  const [customComponentType, setCustomComponentType] =
    useState<UIComponentType>('menubar');
  const [customMenuItems, setCustomMenuItems] = useState<UIMenuItem[]>([]);
  const [activeDemoMenuId, setActiveDemoMenuId] = useState<string>('');
  const [demoTriggeredStatus, setDemoTriggeredStatus] = useState<string>(
    'Interactúa con los colores o haz clic en los menús para probar la demostración a gran escala'
  );

  const promptDialogRef = useRef<HTMLDialogElement>(null);
  const demoDialogRef = useRef<HTMLDialogElement>(null);

  const activePresetId = skill.uiSpec.activePresetId || STYLE_PRESETS[0].id;

  // Abre el modal "Mostrar Prompt y Rendimiento"
  const openPromptModal = (preset: UIStylePreset) => {
    setPromptModalPreset(preset);
    setSelectedPromptModel(preset.defaultAiModel || 'Opus 5.5');
    setEditableSkills(
      preset.skillsApplied || [
        {
          skillId: 'ui-ux-pro-max',
          description:
            'Sistema de diseño en Cyber Dark (#030712) con acentos Cian Eléctrico (#0EA5E9).',
        },
      ]
    );
    setNewSkillIdInput('');
    setNewSkillDescInput('');
    requestAnimationFrame(() => {
      promptDialogRef.current?.showModal();
    });
  };

  const closePromptModal = () => {
    promptDialogRef.current?.close();
    setPromptModalPreset(null);
  };

  // Abre el modal "Ver Demostración"
  const openDemoModal = (preset: UIStylePreset) => {
    setDemoModalPreset(preset);
    setCustomColors([...preset.colors]);
    setCustomHeroTitle(preset.heroTitle);
    setCustomHeroAccent(preset.heroAccent);
    setCustomComponentType(preset.componentType);
    setCustomMenuItems(preset.menuItems.map((item) => ({ ...item })));
    setActiveDemoMenuId(preset.menuItems[0]?.id || '');
    setDemoTriggeredStatus(
      `Demostración en vivo iniciada: "${preset.name}". Ajusta los colores o prueba los comandos.`
    );
    requestAnimationFrame(() => {
      demoDialogRef.current?.showModal();
    });
  };

  const closeDemoModal = () => {
    demoDialogRef.current?.close();
    setDemoModalPreset(null);
  };

  const handleCopyPrompt = async (preset: UIStylePreset, textToCopy: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedId(preset.id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // Fallback
    }
  };

  const handleColorChange = (index: number, newHex: string) => {
    setCustomColors((prev) =>
      prev.map((c, idx) => (idx === index ? newHex : c))
    );
    setDemoTriggeredStatus(
      `Color #${index + 1} actualizado en vivo a ${newHex.toUpperCase()}`
    );
  };

  const handleResetDemoCustomization = () => {
    if (!demoModalPreset) return;
    setCustomColors([...demoModalPreset.colors]);
    setCustomHeroTitle(demoModalPreset.heroTitle);
    setCustomHeroAccent(demoModalPreset.heroAccent);
    setCustomComponentType(demoModalPreset.componentType);
    setCustomMenuItems(demoModalPreset.menuItems.map((item) => ({ ...item })));
    setDemoTriggeredStatus(
      'Parámetros restaurados a los valores originales del arquetipo.'
    );
  };

  const handleApplyCustomizedDemoToSkill = () => {
    if (!demoModalPreset) return;
    const customizedPreset: UIStylePreset = {
      ...demoModalPreset,
      colors: customColors,
      heroTitle: customHeroTitle,
      heroAccent: customHeroAccent,
      componentType: customComponentType,
      menuItems: customMenuItems,
    };
    onApplyPreset(customizedPreset, false);
    closeDemoModal();
  };

  const handleAddEditableSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCollaboratorMode) {
      onRequestLogin?.();
      return;
    }
    const cleanId = newSkillIdInput.trim().replace(/^#/, '');
    if (!cleanId) return;
    const nextSkills: AppliedSkillDetail[] = [
      ...editableSkills,
      {
        skillId: cleanId,
        description:
          newSkillDescInput.trim() ||
          'Regla de arquitectura e interacción aplicada por el colaborador.',
      },
    ];
    setEditableSkills(nextSkills);
    onUpdateAppliedSkills?.(nextSkills);
    setNewSkillIdInput('');
    setNewSkillDescInput('');
  };

  const handleUpdateSkillDescription = (index: number, newDesc: string) => {
    if (!isCollaboratorMode) return;
    const nextSkills = editableSkills.map((sk, idx) =>
      idx === index ? { ...sk, description: newDesc } : sk
    );
    setEditableSkills(nextSkills);
    onUpdateAppliedSkills?.(nextSkills);
  };

  const handleRemoveEditableSkill = (index: number) => {
    if (!isCollaboratorMode || editableSkills.length <= 1) return;
    const nextSkills = editableSkills.filter((_, idx) => idx !== index);
    setEditableSkills(nextSkills);
    onUpdateAppliedSkills?.(nextSkills);
  };

  const activeModelVariation =
    promptModalPreset?.modelVariations?.[selectedPromptModel];

  const composedPromptForModel = promptModalPreset
    ? `${promptModalPreset.promptMarkdown}\n\n${
        activeModelVariation?.promptAdaptation || ''
      }`.trim()
    : '';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#38BDF8]">
            <Sparkles className="w-3.5 h-3.5 text-[#0EA5E9]" aria-hidden="true" />
            Catálogo Interactivo de Componentes UI/UX · Acciones al Pasar el Cursor
          </span>
          <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-0.5">
            Pasa el cursor sobre cualquier tarjeta: &ldquo;Ver Demostración&rdquo; o &ldquo;Mostrar Prompt y Rendimiento&rdquo;
          </h3>
        </div>
        <p className="text-xs text-slate-400 max-w-md">
          Explora las 6 arquitecturas visuales en Cyber Dark y Cian Eléctrico. Prueba la personalización en vivo o compara el rendimiento entre{' '}
          <strong className="text-[#38BDF8]">Opus 5.5, Gemini 3.8, Sonnet 5.5 y GPT Astra</strong>.
        </p>
      </div>

      {/* Cuadrícula de 6 Tarjetas con los dos botones Hover ("Ver Demostración" y "Mostrar Prompt y Rendimiento") */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {STYLE_PRESETS.map((preset) => {
          const isSelected = activePresetId === preset.id;
          const primaryColor = preset.colors[0];
          const secondaryColor = preset.colors[1];

          return (
            <article
              key={preset.id}
              className={`group relative rounded-3xl overflow-hidden border transition-all duration-300 flex flex-col justify-between bg-[#0F172A] ${
                isSelected
                  ? 'border-[#0EA5E9] ring-2 ring-[#0EA5E9]/35 cyan-glow'
                  : 'border-slate-800/90 hover:border-[#0EA5E9]/60 shadow-lg'
              }`}
            >
              {/* MITAD SUPERIOR: Miniatura de Previsualización + Overlay al pasar el cursor (Hover) */}
              <div
                className="relative h-56 p-4 flex flex-col justify-between overflow-hidden border-b border-slate-800/90"
                style={{
                  background: `radial-gradient(circle at 85% 15%, ${primaryColor}28, transparent 58%), radial-gradient(circle at 15% 85%, ${secondaryColor}22, transparent 55%), #0A0F1D`,
                }}
              >
                {/* Mini barra superior de navegador */}
                <div className="flex items-center justify-between gap-2 bg-[#0F172A]/90 backdrop-blur-md border border-slate-800/90 rounded-xl px-3 py-1.5 text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-4 h-4 rounded-md flex items-center justify-center text-black font-black text-[9px]"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {preset.category.slice(0, 1)}
                    </span>
                    <span className="font-bold text-white truncate max-w-[100px]">
                      {preset.category}
                    </span>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-slate-400">
                    {preset.menuItems.slice(0, 2).map((m) => (
                      <span key={m.id} className="truncate max-w-[68px]">
                        {m.label}
                      </span>
                    ))}
                  </div>
                  <span
                    className="px-2 py-0.5 rounded-md text-black font-extrabold text-[9px]"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {preset.defaultAiModel || 'Opus 5.5'}
                  </span>
                </div>

                {/* Centro de la miniatura */}
                <div className="my-auto text-center px-2 space-y-1.5">
                  <span
                    className="inline-block text-[9px] font-bold px-2.5 py-0.5 rounded-full border"
                    style={{
                      color: primaryColor,
                      borderColor: `${primaryColor}55`,
                      backgroundColor: `${primaryColor}18`,
                    }}
                  >
                    ✦ {preset.badgeText}
                  </span>
                  <h4 className="text-sm sm:text-base font-black tracking-tight leading-snug text-white">
                    {preset.heroTitle}{' '}
                    <span style={{ color: primaryColor }}>
                      {preset.heroAccent}
                    </span>
                  </h4>
                  <p className="text-[10px] text-slate-400 line-clamp-1 max-w-xs mx-auto">
                    {preset.heroSubtitle}
                  </p>
                </div>

                {/* Pie de métricas de la miniatura */}
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {preset.metrics.map((metric, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg px-2 py-1 text-center text-[9px] font-bold truncate bg-[#0F172A]/90 text-slate-300 border border-slate-800/80"
                    >
                      {metric}
                    </div>
                  ))}
                </div>

                {/* OVERLAY INTERACTIVO EN HOVER CON LOS 2 BOTONES EN ESPAÑOL */}
                <div className="absolute inset-0 bg-[#0B0F19]/88 backdrop-blur-md opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all duration-200 flex flex-col items-center justify-center gap-3 p-4">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#38BDF8]">
                    Acciones de Laboratorio UI/UX
                  </span>
                  <div className="flex flex-wrap items-center justify-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => openDemoModal(preset)}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8] hover:brightness-110 text-black font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-[#0EA5E9]/30 transition transform hover:scale-105 cursor-pointer"
                    >
                      <Eye className="w-4 h-4" aria-hidden="true" />
                      <span>Ver Demostración</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openPromptModal(preset)}
                      className="px-4 py-2.5 rounded-xl bg-[#131C31] hover:bg-slate-800 text-white border border-[#0EA5E9]/45 font-bold text-xs flex items-center gap-2 shadow-lg transition transform hover:scale-105 cursor-pointer"
                    >
                      <Code2
                        className="w-4 h-4 text-[#0EA5E9]"
                        aria-hidden="true"
                      />
                      <span>Mostrar Prompt y Rendimiento</span>
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-300 text-center">
                    Personaliza colores en vivo o evalúa el modelo con dictado por voz
                  </span>
                </div>
              </div>

              {/* MITAD INFERIOR: Metadatos de la Tarjeta y Acciones Rápidas */}
              <div className="p-5 space-y-3.5 bg-[#0F172A] flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-base font-extrabold text-white leading-snug">
                        {preset.name}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {preset.styleCategory}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full shrink-0 bg-[#0EA5E9]/15 text-[#38BDF8] border border-[#0EA5E9]/30">
                      {preset.defaultAiModel || 'Opus 5.5'}
                    </span>
                  </div>

                  {/* Muestras de Paleta + Etiquetas de Skills */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1.5">
                      {preset.colors.map((hex, i) => (
                        <span
                          key={i}
                          title={hex}
                          className="w-4 h-4 rounded-full border border-white/20 shadow-xs"
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </div>

                    <div className="flex items-center gap-1">
                      {(preset.skillsApplied || []).slice(0, 2).map((sk) => (
                        <span
                          key={sk.skillId}
                          className="text-[10px] font-mono text-sky-300 bg-sky-950/60 border border-sky-500/30 px-2 py-0.5 rounded-md"
                        >
                          #{sk.skillId}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Botones rápidos también accesibles en pantallas táctiles */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800/90">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openDemoModal(preset)}
                      className={`text-xs font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8] text-black'
                          : 'bg-[#0B0F19] hover:bg-[#0EA5E9] text-slate-200 hover:text-black border border-slate-800'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Ver Demostración</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openPromptModal(preset)}
                      className="text-xs font-bold text-slate-300 hover:text-white px-2.5 py-1.5 rounded-xl bg-[#0B0F19] hover:bg-slate-800 border border-slate-800 flex items-center gap-1 transition cursor-pointer"
                    >
                      <Code2
                        className="w-3.5 h-3.5 text-[#0EA5E9]"
                        aria-hidden="true"
                      />
                      <span>Prompt y Rendimiento</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyPrompt(preset, preset.promptMarkdown)}
                    aria-label={`Copiar prompt de ${preset.name}`}
                    className="text-[11px] font-semibold text-slate-400 hover:text-[#38BDF8] p-1.5 rounded-lg hover:bg-slate-800/60 transition cursor-pointer"
                  >
                    {copiedId === preset.id ? (
                      <Check
                        className="w-3.5 h-3.5 text-emerald-400"
                        aria-hidden="true"
                      />
                    ) : (
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* =======================================================================
          MODAL 1: "Ver Demostración" — VENTANA EMERGENTE GRANDE PARA PERSONALIZAR
          LA SKILL EN VIVO, INTERACTUAR CON LOS COLORES Y PREVISUALIZAR A GRAN ESCALA
         ======================================================================= */}
      <dialog
        ref={demoDialogRef}
        closedby="any"
        onClose={() => setDemoModalPreset(null)}
        aria-labelledby="view-demo-modal-title"
        className="m-auto w-full max-w-5xl rounded-3xl bg-[#0B0F19] border border-[#0EA5E9]/45 text-slate-100 p-0 shadow-2xl backdrop:bg-black/80 backdrop:backdrop-blur-md open:flex open:flex-col max-h-[92vh]"
      >
        {demoModalPreset && (
          <>
            {/* Cabecera del Modal "Ver Demostración" */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-800 bg-[#0F172A]">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-black font-black shadow-md"
                  style={{ backgroundColor: customColors[0] || '#0EA5E9' }}
                >
                  <Palette className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#0EA5E9]/20 text-[#38BDF8] border border-[#0EA5E9]/40">
                      Ver Demostración · Personalizador Interactivo en Vivo
                    </span>
                    <span className="text-xs text-slate-400">
                      {demoModalPreset.styleCategory}
                    </span>
                  </div>
                  <h3
                    id="view-demo-modal-title"
                    className="text-lg sm:text-xl font-extrabold text-white mt-0.5"
                  >
                    {demoModalPreset.name}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetDemoCustomization}
                  className="px-3 py-1.5 rounded-xl bg-[#0B0F19] hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#0EA5E9]" />
                  <span>Restaurar Colores</span>
                </button>
                <form method="dialog">
                  <button
                    type="submit"
                    aria-label="Cerrar ventana de demostración"
                    className="p-2 rounded-xl bg-[#0B0F19] hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                </form>
              </div>
            </div>

            {/* Cuerpo dividido del Modal "Ver Demostración" */}
            <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Panel Izquierdo (5 cols): Controles de Colores y Personalización en Vivo */}
              <div className="lg:col-span-5 space-y-5 bg-[#0F172A] border border-slate-800 rounded-2xl p-5">
                <div className="space-y-1 border-b border-slate-800 pb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#38BDF8]">
                    1. Paleta Interactiva del Componente
                  </span>
                  <h4 className="text-sm font-extrabold text-white">
                    Personaliza los colores en tiempo real
                  </h4>
                  <p className="text-xs text-slate-400">
                    Haz clic en cualquier selector cromático para transformar la previsualización a gran escala al instante.
                  </p>
                </div>

                {/* Selectores de color en vivo */}
                <div className="grid grid-cols-2 gap-3">
                  {customColors.map((hex, index) => {
                    const labels = [
                      'Acento Primario',
                      'Acento Secundario',
                      'Brillo Estado',
                      'Superficie Base',
                    ];
                    return (
                      <label
                        key={index}
                        className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-[#0B0F19] p-2.5 cursor-pointer hover:border-[#0EA5E9]/50 transition"
                      >
                        <input
                          type="color"
                          value={hex}
                          onChange={(e) =>
                            handleColorChange(index, e.target.value)
                          }
                          className="h-8 w-8 rounded-lg border-0 bg-transparent cursor-pointer shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="block text-[10px] font-bold text-slate-300 truncate">
                            {labels[index] || `Color #${index + 1}`}
                          </span>
                          <span className="block font-mono text-[11px] font-bold text-[#38BDF8]">
                            {hex.toUpperCase()}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {/* Paletas Rápidas Preconfiguradas */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-300">
                    Combinaciones Rápidas de Estudio:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      {
                        label: 'Cyber Dark + Cian',
                        palette: ['#0EA5E9', '#38BDF8', '#38BDF8', '#030712'],
                      },
                      {
                        label: 'Solar Ciber + Cian',
                        palette: ['#0EA5E9', '#06B6D4', '#10B981', '#0F172A'],
                      },
                      {
                        label: 'Coral + Esmeralda',
                        palette: ['#38BDF8', '#F43F5E', '#14B8A6', '#0A0F1D'],
                      },
                    ].map((presetPalette) => (
                      <button
                        key={presetPalette.label}
                        type="button"
                        onClick={() => {
                          setCustomColors(presetPalette.palette);
                          setDemoTriggeredStatus(
                            `Paleta rápida aplicada: ${presetPalette.label}`
                          );
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-[#0B0F19] px-2.5 py-1.5 text-[11px] font-semibold text-slate-300 hover:border-[#0EA5E9] hover:text-white cursor-pointer"
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: presetPalette.palette[0] }}
                        />
                        <span>{presetPalette.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selector del Tipo de Arquitectura del Componente */}
                <div className="space-y-2 border-t border-slate-800 pt-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#38BDF8]">
                    2. Arquitectura del Componente
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { id: 'menubar', label: 'Menú de Barras' },
                        { id: 'dropdown', label: 'Menú Desplegable' },
                        { id: 'toolbar', label: 'Barra Flotante' },
                        { id: 'command-palette', label: 'Paleta Comandos' },
                      ] as Array<{ id: UIComponentType; label: string }>
                    ).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setCustomComponentType(t.id)}
                        className={`rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer ${
                          customComponentType === t.id
                            ? 'bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8] text-black shadow-sm'
                            : 'border border-slate-800 bg-[#0B0F19] text-slate-300 hover:text-white'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Personalización de Textos y Comandos de la Skill */}
                <div className="space-y-3 border-t border-slate-800 pt-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#38BDF8]">
                    3. Textos y Comandos de la Skill
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">
                        Título Principal
                      </label>
                      <input
                        type="text"
                        value={customHeroTitle}
                        onChange={(e) => setCustomHeroTitle(e.target.value)}
                        className="w-full rounded-xl border border-slate-800 bg-[#0B0F19] px-3 py-1.5 text-xs text-white focus:border-[#0EA5E9] "
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">
                        Texto Destacado
                      </label>
                      <input
                        type="text"
                        value={customHeroAccent}
                        onChange={(e) => setCustomHeroAccent(e.target.value)}
                        className="w-full rounded-xl border border-slate-800 bg-[#0B0F19] px-3 py-1.5 text-xs text-[#38BDF8] font-bold focus:border-[#0EA5E9] "
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Panel Derecho (7 cols): Escenario de Previsualización Interactiva a Gran Escala */}
              <div className="lg:col-span-7 flex flex-col justify-between rounded-3xl border border-slate-800 p-6 relative overflow-hidden min-h-[430px]"
                style={{
                  background: `radial-gradient(circle at 85% 15%, ${customColors[0]}35, transparent 55%), radial-gradient(circle at 15% 85%, ${customColors[1]}28, transparent 55%), ${customColors[3] || '#0A0F1D'}`,
                }}
              >
                {/* Cabecera del Escenario a Gran Escala */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-[#0F172A]/90 backdrop-blur-md border border-slate-800 rounded-2xl px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-black font-black text-xs"
                      style={{ backgroundColor: customColors[0] }}
                    >
                      UI
                    </span>
                    <span className="text-xs font-extrabold text-white">
                      {demoModalPreset.name} · Escala Real
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2.5 py-1 rounded-full text-[10px] font-extrabold text-black"
                      style={{ backgroundColor: customColors[0] }}
                    >
                      {customComponentType.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Cuerpo Interactivo del Componente */}
                <div className="my-auto py-6 space-y-6">
                  <div className="space-y-2 text-center max-w-lg mx-auto">
                    <span
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full border"
                      style={{
                        color: customColors[0],
                        borderColor: `${customColors[0]}66`,
                        backgroundColor: `${customColors[0]}1F`,
                      }}
                    >
                      ✦ {demoModalPreset.badgeText}
                    </span>
                    <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                      {customHeroTitle}{' '}
                      <span style={{ color: customColors[0] }}>
                        {customHeroAccent}
                      </span>
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300">
                      {demoModalPreset.heroSubtitle}
                    </p>
                  </div>

                  {/* Renderizado en Vivo según el Tipo de Componente Seleccionado */}
                  <div className="max-w-xl mx-auto">
                    {customComponentType === 'menubar' && (
                      <div className="space-y-3">
                        <div
                          role="menubar"
                          aria-label={demoModalPreset.name}
                          className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-[#0B0F19]/95 p-2 shadow-xl"
                        >
                          {customMenuItems.map((item) => {
                            const isOpen = activeDemoMenuId === item.id;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                role="menuitem"
                                aria-expanded={isOpen}
                                onClick={() => {
                                  setActiveDemoMenuId(item.id);
                                  setDemoTriggeredStatus(
                                    `Menú seleccionado: "${item.label}" (${item.shortcut || 'Interactivo'})`
                                  );
                                }}
                                style={
                                  isOpen
                                    ? { backgroundColor: customColors[0] }
                                    : undefined
                                }
                                className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
                                  isOpen
                                    ? 'text-black shadow-md'
                                    : 'text-slate-200 hover:bg-slate-800/80'
                                }`}
                              >
                                <span>{item.label}</span>
                                <ChevronDown className="w-3.5 h-3.5 opacity-75" />
                              </button>
                            );
                          })}
                        </div>

                        {/* Submenús interactivos */}
                        {customMenuItems.find((i) => i.id === activeDemoMenuId)
                          ?.children && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-[#0F172A]/95 border border-slate-800 rounded-2xl p-3 shadow-2xl">
                            {customMenuItems
                              .find((i) => i.id === activeDemoMenuId)
                              ?.children?.map((sub) => (
                                <button
                                  key={sub.id}
                                  type="button"
                                  onClick={() =>
                                    setDemoTriggeredStatus(
                                      `Subcomando ejecutado: ${sub.label} (${sub.shortcut || '↵'})`
                                    )
                                  }
                                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#0B0F19] px-3.5 py-2.5 text-left text-xs text-slate-200 hover:border-[#0EA5E9] hover:text-white transition cursor-pointer"
                                >
                                  <span className="font-semibold">
                                    {sub.label}
                                  </span>
                                  <span
                                    className="font-mono text-[10px] font-bold"
                                    style={{ color: customColors[0] }}
                                  >
                                    {sub.shortcut || '↵'}
                                  </span>
                                </button>
                              ))}
                          </div>
                        )}
                      </div>
                    )}

                    {customComponentType === 'dropdown' && (
                      <div className="space-y-2.5 max-w-md mx-auto">
                        <button
                          type="button"
                          style={{ backgroundColor: customColors[0] }}
                          className="w-full py-3 px-4 rounded-2xl text-black font-extrabold text-xs flex items-center justify-between shadow-lg cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <Layers className="w-4 h-4" />
                            {demoModalPreset.name}
                          </span>
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <div className="rounded-2xl border border-slate-800 bg-[#0B0F19]/95 p-2 space-y-1 shadow-2xl">
                          {customMenuItems.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() =>
                                setDemoTriggeredStatus(
                                  `Opción desplegable activada: ${item.label}`
                                )
                              }
                              className="w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs text-slate-200 hover:bg-slate-800/80 transition cursor-pointer"
                            >
                              <span className="font-semibold">{item.label}</span>
                              <span
                                className="font-mono text-[10px] font-bold"
                                style={{ color: customColors[0] }}
                              >
                                {item.shortcut || '↵'}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {customComponentType === 'toolbar' && (
                      <div className="flex flex-wrap items-center justify-center gap-2.5 rounded-2xl border border-slate-800 bg-[#0B0F19]/95 p-3 shadow-2xl">
                        {customMenuItems.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() =>
                              setDemoTriggeredStatus(
                                `Acción de barra flotante: ${item.label}`
                              )
                            }
                            style={{ borderColor: `${customColors[0]}55` }}
                            className="px-3.5 py-2 rounded-xl bg-[#0F172A] hover:brightness-125 border text-xs font-bold text-white flex items-center gap-2 transition cursor-pointer"
                          >
                            <Terminal
                              className="w-3.5 h-3.5"
                              style={{ color: customColors[0] }}
                            />
                            <span>{item.label}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {customComponentType === 'command-palette' && (
                      <div className="rounded-2xl border border-slate-800 bg-[#0B0F19]/95 overflow-hidden shadow-2xl">
                        <div className="px-4 py-2.5 bg-[#0F172A] border-b border-slate-800 flex items-center gap-2 text-xs font-bold">
                          <Command
                            className="w-4 h-4"
                            style={{ color: customColors[0] }}
                          />
                          <span className="text-white">
                            Paleta de Comandos en Vivo · {demoModalPreset.name}
                          </span>
                        </div>
                        <div className="p-2 space-y-1">
                          {customMenuItems.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() =>
                                setDemoTriggeredStatus(
                                  `Comando disparado: ${item.label}`
                                )
                              }
                              className="w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs text-slate-200 hover:bg-slate-800/80 transition cursor-pointer"
                            >
                              <span className="flex items-center gap-2 font-mono">
                                <ChevronRight
                                  className="w-3.5 h-3.5"
                                  style={{ color: customColors[0] }}
                                />
                                {item.label}
                              </span>
                              <span
                                className="font-mono text-[10px]"
                                style={{ color: customColors[1] }}
                              >
                                {item.shortcut || 'Ctrl+K'}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pie de telemetría de la previsualización */}
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-800 bg-[#0B0F19]/90 px-4 py-2.5 text-xs">
                  <span className="font-mono text-slate-300 truncate">
                    {demoTriggeredStatus}
                  </span>
                  <span
                    className="font-mono font-bold text-[11px]"
                    style={{ color: customColors[0] }}
                  >
                    ESCALA REAL ACTIVA
                  </span>
                </div>
              </div>
            </div>

            {/* Pie del Modal "Ver Demostración" */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-slate-800 bg-[#0F172A]">
              <span className="text-xs text-slate-400">
                Al aplicar los cambios, la skill{' '}
                <strong className="text-white">{skill.filename}</strong> adoptará esta paleta y estructura.
              </span>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={closeDemoModal}
                  className="px-4 py-2 rounded-xl border border-slate-700 bg-[#0B0F19] text-xs font-bold text-slate-300 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleApplyCustomizedDemoToSkill}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8] text-black font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-[#0EA5E9]/25 hover:brightness-110 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Aplicar Personalización a la Skill</span>
                </button>
              </div>
            </div>
          </>
        )}
      </dialog>

      {/* =======================================================================
          MODAL 2: "Mostrar Prompt y Rendimiento" — PROMPT EXACTO, SKILLS EDITABLES
          (EN MODO COLABORADOR), COMPARATIVA DE 7 VERSIONES DE MODELOS IA Y DICTADO POR VOZ
         ======================================================================= */}
      <dialog
        ref={promptDialogRef}
        closedby="any"
        onClose={() => setPromptModalPreset(null)}
        aria-labelledby="preset-prompt-modal-title"
        className="m-auto w-full max-w-6xl rounded-3xl bg-[#0B0F19] border border-[#0EA5E9]/45 text-slate-100 p-0 shadow-2xl backdrop:bg-black/80 backdrop:backdrop-blur-md open:flex open:flex-col max-h-[92vh]"
      >
        {promptModalPreset && (
          <>
            {/* Cabecera del Modal "Mostrar Prompt y Rendimiento" */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-800 bg-[#0F172A]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0EA5E9]/15 border border-[#0EA5E9]/40 flex items-center justify-center text-[#0EA5E9]">
                  <Code2 className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#0EA5E9]/20 text-[#38BDF8] border border-[#0EA5E9]/35">
                      Mostrar Prompt y Rendimiento · Trazabilidad IA
                    </span>
                    <span className="text-xs text-slate-400">
                      {promptModalPreset.styleCategory}
                    </span>
                  </div>
                  <h3
                    id="preset-prompt-modal-title"
                    className="text-lg sm:text-xl font-extrabold text-white mt-0.5"
                  >
                    {promptModalPreset.name}
                  </h3>
                </div>
              </div>

              <form method="dialog">
                <button
                  type="submit"
                  aria-label="Cerrar ventana de prompt y rendimiento"
                  className="p-2 rounded-xl bg-[#0B0F19] hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition cursor-pointer"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </form>
            </div>

            {/* Cuerpo dividido: Izquierda (Prompt Exacto + Evaluación por Voz) | Derecha (Skills Editables + Versión Exacta del Modelo IA) */}
            <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* COLUMNA IZQUIERDA (7 cols): Prompt Exacto + Módulo de Evaluación con Dictado por Voz */}
              <div className="lg:col-span-7 space-y-5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#38BDF8]">
                        1. Prompt Exacto en Uso ({selectedPromptModel})
                      </span>
                      <h4 className="text-sm font-extrabold text-white">
                        Instrucciones listas para copiar o inyectar en {skill.filename}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyPrompt(promptModalPreset, composedPromptForModel)
                      }
                      className="px-3.5 py-1.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 border border-[#0EA5E9]/40 text-xs font-bold text-[#38BDF8] flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {copiedId === promptModalPreset.id ? (
                        <>
                          <Check
                            className="w-3.5 h-3.5 text-emerald-400"
                            aria-hidden="true"
                          />
                          <span>¡Prompt Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy
                            className="w-3.5 h-3.5 text-[#0EA5E9]"
                            aria-hidden="true"
                          />
                          <span>Copiar Prompt</span>
                        </>
                      )}
                    </button>
                  </div>

                  <figure className="rounded-2xl bg-[#0F172A] border border-slate-800 overflow-hidden">
                    <figcaption className="px-4 py-2.5 bg-[#131C31] border-b border-slate-800 flex items-center justify-between text-xs text-slate-300 font-mono">
                      <span>
                        SKILL.md · Generado con{' '}
                        <strong className="text-[#38BDF8]">
                          {selectedPromptModel}
                        </strong>
                      </span>
                      <span className="text-[10px] text-sky-400">
                        {composedPromptForModel.split('\n').length} líneas
                      </span>
                    </figcaption>
                    <pre
                      tabIndex={0}
                      className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed whitespace-pre-wrap max-h-[260px]"
                    >
                      <code>{composedPromptForModel}</code>
                    </pre>
                  </figure>
                </div>

                {/* Módulo Interactivo de Evaluación del Impacto Visual con Dictado por Voz (ES) */}
                <VoiceVisualFeedback
                  selectedModelVersion={selectedPromptModel}
                  presetName={promptModalPreset.name}
                  isCollaboratorMode={isCollaboratorMode}
                  currentUserName={currentUserName}
                  compact
                />
              </div>

              {/* PANEL LATERAL DERECHO (5 cols): Modelo de IA con Versiones Específicas + Skills Aplicadas (Editables en Modo Colaborador) */}
              <aside
                aria-label="Skills utilizadas y versión específica del modelo de inteligencia artificial"
                className="lg:col-span-5 space-y-5 bg-[#0F172A] border border-slate-800 rounded-2xl p-5"
              >
                {/* Bloque A: Selector de las 7 Versiones Específicas de Modelos IA */}
                <div className="space-y-3 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-[#0EA5E9]" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#38BDF8]">
                      2. Versión Específica del Modelo IA
                    </span>
                  </div>
                  <h4 className="text-sm font-extrabold text-white">
                    Compara cómo varía el resultado visual por versión
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {AI_MODEL_VERSIONS.map((item) => {
                      const isCurrent = selectedPromptModel === item.version;
                      return (
                        <button
                          key={item.version}
                          type="button"
                          onClick={() => setSelectedPromptModel(item.version)}
                          className={`rounded-xl px-2.5 py-2 text-left transition cursor-pointer border ${
                            isCurrent
                              ? 'bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8] text-black border-[#0EA5E9] shadow-md'
                              : 'border-slate-800 bg-[#0B0F19] text-slate-300 hover:border-[#0EA5E9]/45 hover:text-white'
                          }`}
                        >
                          <span
                            className={`block text-[9px] font-mono uppercase ${
                              isCurrent ? 'text-black/80 font-bold' : 'text-slate-400'
                            }`}
                          >
                            {item.family}
                          </span>
                          <span className="block text-xs font-extrabold truncate">
                            {item.version}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Tarjeta con el desglose del modelo seleccionado */}
                  {activeModelVariation && (
                    <div className="rounded-2xl border border-[#0EA5E9]/35 bg-[#0B0F19] p-4 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-extrabold text-white">
                          {activeModelVariation.family} · {activeModelVariation.modelName}
                        </span>
                        <span className="rounded-full bg-[#0EA5E9]/20 border border-[#0EA5E9]/40 px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#38BDF8]">
                          {activeModelVariation.tier}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                          Impacto en el Resultado Visual:
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {activeModelVariation.visualDifference}
                        </p>
                      </div>

                      <div className="space-y-1 pt-1 border-t border-slate-800/80">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                          Diferencia en Arquitectura de Código:
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {activeModelVariation.structureDifference}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bloque B: Skills Exactas Utilizadas (Editables en Modo Colaborador) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#0EA5E9]" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#38BDF8]">
                        3. Skills Utilizadas ({editableSkills.length})
                      </span>
                    </div>

                    {isCollaboratorMode ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#0EA5E9]/15 border border-[#0EA5E9]/40 px-2.5 py-0.5 text-[10px] font-bold text-[#38BDF8]">
                        <ShieldCheck className="w-3 h-3" /> Editable (Colaborador)
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={onRequestLogin}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-[#0B0F19] px-2.5 py-0.5 text-[10px] font-bold text-slate-300 hover:border-[#0EA5E9] hover:text-white cursor-pointer"
                      >
                        <Lock className="w-2.5 h-2.5 text-[#0EA5E9]" /> Iniciar sesión para editar
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {editableSkills.map((sk, idx) => (
                      <div
                        key={`${sk.skillId}-${idx}`}
                        className="rounded-xl border border-slate-800 bg-[#0B0F19] p-3 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-block font-mono text-xs font-extrabold text-[#38BDF8] bg-[#0EA5E9]/15 border border-[#0EA5E9]/30 px-2.5 py-0.5 rounded-lg">
                            #{sk.skillId}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-semibold text-emerald-400">
                              Activa
                            </span>
                            {isCollaboratorMode && editableSkills.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveEditableSkill(idx)}
                                aria-label={`Eliminar skill ${sk.skillId}`}
                                className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {isCollaboratorMode ? (
                          <input
                            type="text"
                            value={sk.description}
                            onChange={(e) =>
                              handleUpdateSkillDescription(idx, e.target.value)
                            }
                            aria-label={`Descripción de la skill ${sk.skillId}`}
                            className="w-full rounded-lg border border-slate-800 bg-[#0F172A] px-2.5 py-1 text-xs text-slate-200 focus:border-[#0EA5E9] "
                          />
                        ) : (
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {sk.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Formulario para añadir nueva skill (Exclusivo Modo Colaborador) */}
                  {isCollaboratorMode && (
                    <form
                      onSubmit={handleAddEditableSkill}
                      className="rounded-xl border border-[#0EA5E9]/35 bg-[#0B0F19] p-3 space-y-2"
                    >
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-[#38BDF8]">
                        Añadir Skill al Componente (Modo Colaborador)
                      </span>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newSkillIdInput}
                          onChange={(e) => setNewSkillIdInput(e.target.value)}
                          placeholder="ej. executive-video-editor"
                          className="flex-1 rounded-lg border border-slate-800 bg-[#0F172A] px-2.5 py-1.5 font-mono text-xs text-white focus:border-[#0EA5E9] "
                        />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8] px-3 py-1.5 text-xs font-extrabold text-black cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Añadir</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={newSkillDescInput}
                        onChange={(e) => setNewSkillDescInput(e.target.value)}
                        placeholder="Descripción del impacto técnico o visual..."
                        className="w-full rounded-lg border border-slate-800 bg-[#0F172A] px-2.5 py-1.5 text-xs text-slate-300 focus:border-[#0EA5E9] "
                      />
                    </form>
                  )}
                </div>
              </aside>
            </div>

            {/* Pie del Modal "Mostrar Prompt y Rendimiento" */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-slate-800 bg-[#0F172A]">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Versión activa:</span>
                <strong className="text-[#38BDF8]">{selectedPromptModel}</strong>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onApplyPreset(
                      {
                        ...promptModalPreset,
                        defaultAiModel: selectedPromptModel,
                        skillsApplied: editableSkills,
                      },
                      false
                    );
                    closePromptModal();
                  }}
                  className="px-4 py-2 rounded-xl bg-[#0B0F19] hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  Aplicar Solo Diseño UI
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onApplyPreset(
                      {
                        ...promptModalPreset,
                        defaultAiModel: selectedPromptModel,
                        skillsApplied: editableSkills,
                        promptMarkdown: composedPromptForModel,
                      },
                      true
                    );
                    closePromptModal();
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8] text-black text-xs font-extrabold flex items-center gap-1.5 shadow-md transition hover:brightness-110 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Inyectar Prompt + Estilo en {skill.filename}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </>
        )}
      </dialog>
    </div>
  );
};
