import React, { useState, useEffect, useRef } from 'react';
import { SkillDocument, UIComponentType, UIMenuItem, UIStylePreset } from '../types/skill';
import { StylePresetCatalog } from './StylePresetCatalog';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Terminal,
  Sparkles,
  Trash2,
  Command,
  Wand2,
  Zap,
  Layers,
} from 'lucide-react';

interface UIComponentPreviewProps {
  skill: SkillDocument;
  onUpdateSkill: (skill: SkillDocument) => void;
  onStatusChange: (status: string | null) => void;
  isCollaboratorMode?: boolean;
  currentUserName?: string;
  onRequestLogin?: () => void;
}

export const UIComponentPreview: React.FC<UIComponentPreviewProps> = ({
  skill,
  onUpdateSkill,
  onStatusChange,
  isCollaboratorMode = false,
  currentUserName,
  onRequestLogin,
}) => {
  const { uiSpec } = skill;
  const [openMenuId, setOpenMenuId] = useState<string | null>(uiSpec.items[0]?.id || null);
  const [lastTriggeredAction, setLastTriggeredAction] = useState<string>(
    'Listo · Haz clic en cualquier menú o tarjeta de estilo para probarlo'
  );
  const [newItemLabel, setNewItemLabel] = useState('');
  const [newItemShortcut, setNewItemShortcut] = useState('Ctrl+K');
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const activeColors = uiSpec.accentColors || ['#0EA5E9', '#0EA5E9', '#10B981', '#121212'];

  useEffect(() => {
    setOpenMenuId(uiSpec.items[0]?.id || null);
  }, [skill.id]);

  // Progressive enhancement fallback for focusgroup per modern-web-guidance `menu` spec
  useEffect(() => {
    const root = previewContainerRef.current;
    if (!root || 'focusGroup' in HTMLElement.prototype) return;

    const groups = root.querySelectorAll<HTMLElement>('[focusgroup~="menu"]');
    const cleanups: Array<() => void> = [];

    groups.forEach((group) => {
      group.setAttribute('role', 'menu');
      group.querySelectorAll<HTMLButtonElement>('button:not([role])').forEach((item) => {
        item.setAttribute('role', 'menuitem');
      });

      const handleKeyDown = (event: KeyboardEvent) => {
        if (!['ArrowDown', 'ArrowUp', 'Home', 'End', 'Escape'].includes(event.key)) return;
        if (event.key === 'Escape') {
          setOpenMenuId(null);
          return;
        }
        const items = [...group.querySelectorAll<HTMLButtonElement>('button')].filter(
          (item) => !item.disabled && item.getAttribute('aria-disabled') !== 'true'
        );
        const current = items.indexOf(document.activeElement as HTMLButtonElement);
        if (current < 0) return;
        const next =
          event.key === 'Home'
            ? 0
            : event.key === 'End'
            ? items.length - 1
            : (current + (event.key === 'ArrowUp' ? -1 : 1) + items.length) % items.length;
        event.preventDefault();
        items[next]?.focus();
      };

      group.addEventListener('keydown', handleKeyDown);
      cleanups.push(() => group.removeEventListener('keydown', handleKeyDown));
    });

    return () => cleanups.forEach((fn) => fn());
  }, [openMenuId, uiSpec]);

  const handleTypeChange = (type: UIComponentType) => {
    onUpdateSkill({
      ...skill,
      uiSpec: { ...uiSpec, type },
    });
  };

  const handleApplyPreset = (preset: UIStylePreset, applyMarkdownToo: boolean) => {
    onUpdateSkill({
      ...skill,
      markdownContent: applyMarkdownToo ? preset.promptMarkdown : skill.markdownContent,
      uiSpec: {
        ...uiSpec,
        type: preset.componentType,
        title: preset.name,
        theme: preset.theme,
        activePresetId: preset.id,
        accentColors: preset.colors,
        styleLabel: preset.styleCategory,
        items: preset.menuItems,
      },
    });
    setOpenMenuId(preset.menuItems[0]?.id || 'dropdown-open');
    setLastTriggeredAction(`Arquetipo aplicado: ${preset.name} (${preset.styleCategory})`);
    onStatusChange(
      applyMarkdownToo
        ? `Estilo y Prompt "${preset.name}" aplicados a ${skill.filename}`
        : `Vista previa actualizada al estilo "${preset.name}"`
    );
    setTimeout(() => onStatusChange(null), 2500);
  };

  const handleAddMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemLabel.trim()) return;
    const newItem: UIMenuItem = {
      id: `item-${Date.now()}`,
      label: newItemLabel.trim(),
      shortcut: newItemShortcut.trim() || 'Ctrl+J',
      checked: true,
      children: [
        {
          id: `sub-${Date.now()}-1`,
          label: `Ejecutar: ${newItemLabel.trim()}`,
          shortcut: newItemShortcut.trim() || '↵',
          checked: true,
        },
        {
          id: `sub-${Date.now()}-2`,
          label: `Configurar ${newItemLabel.trim()}`,
          shortcut: 'Alt+C',
        },
      ],
    };

    onUpdateSkill({
      ...skill,
      uiSpec: {
        ...uiSpec,
        items: [...uiSpec.items, newItem],
      },
    });
    setNewItemLabel('');
    onStatusChange(`Componente actualizado: "${newItem.label}"`);
    setTimeout(() => onStatusChange(null), 2000);
  };

  const handleSyncFromMarkdown = () => {
    const headings = skill.markdownContent
      .split('\n')
      .filter((line) => line.startsWith('## ') || line.startsWith('- '))
      .map((line) => line.replace(/^(## |- )/, '').trim())
      .filter(Boolean)
      .slice(0, 4);

    if (headings.length === 0) return;

    const syncedItems: UIMenuItem[] = headings.map((h, idx) => ({
      id: `sync-${Date.now()}-${idx}`,
      label: h.length > 26 ? `${h.slice(0, 26)}...` : h,
      shortcut: `Alt+${idx + 1}`,
      checked: idx === 0,
      children: [
        {
          id: `sync-sub-${idx}-1`,
          label: `Ejecutar instrucción #${idx + 1}`,
          shortcut: '↵',
          checked: true,
        },
        {
          id: `sync-sub-${idx}-2`,
          label: 'Ver trazabilidad en modelo IA',
          shortcut: 'Ctrl+L',
        },
      ],
    }));

    onUpdateSkill({
      ...skill,
      uiSpec: {
        ...uiSpec,
        items: syncedItems,
      },
    });
    setOpenMenuId(syncedItems[0]?.id || null);
    onStatusChange('Menús sincronizados desde las instrucciones del archivo .md');
    setTimeout(() => onStatusChange(null), 2400);
  };

  const handleDeleteMenuItem = (id: string) => {
    if (uiSpec.items.length <= 1) return;
    onUpdateSkill({
      ...skill,
      uiSpec: {
        ...uiSpec,
        items: uiSpec.items.filter((i) => i.id !== id),
      },
    });
  };

  return (
    <section aria-labelledby="showcase-preview-heading" className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-800/90 pb-5">
        <div className="space-y-2">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#0F172A] text-[#0EA5E9] cyan-glow-sm flex items-center justify-center border border-[#0EA5E9]/40 shrink-0">
              <Zap className="w-6 h-6 text-[#0EA5E9]" aria-hidden="true" />
            </div>
            <div>
              <h1
                id="showcase-preview-heading"
                className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white"
              >
                Forja de Interfaces UI/UX
              </h1>
              <p className="text-sm text-slate-400">
                Pasa el cursor sobre las tarjetas del catálogo para pulsar{' '}
                <strong className="text-[#38BDF8]">Ver Demostración</strong> o{' '}
                <strong className="text-[#38BDF8]">Mostrar Prompt y Rendimiento</strong> en{' '}
                <code className="font-mono text-[#38BDF8]">{skill.filename}</code>.
              </p>
            </div>
          </div>
        </div>

        {/* Selector de Tipo de Componente */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#0F172A] p-1.5 rounded-2xl border border-slate-800">
          {(
            [
              { id: 'menubar', label: 'Menú de Barras' },
              { id: 'dropdown', label: 'Menú Desplegable' },
              { id: 'toolbar', label: 'Barra Flotante' },
              { id: 'command-palette', label: 'Paleta Rápida' },
            ] as Array<{ id: UIComponentType; label: string }>
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTypeChange(tab.id)}
              className={`px-3.5 py-1.5 text-xs rounded-xl font-bold transition duration-200 cursor-pointer ${
                uiSpec.type === tab.id
                  ? 'bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8] text-black shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Showcase de 2 Columnas en Azul Noche y Naranja */}
      <div ref={previewContainerRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TARJETA 1: Sandbox Interactivo Principal */}
        <div className="rounded-3xl bg-[#0F172A] border border-[#0EA5E9]/35 cyan-glow overflow-hidden flex flex-col justify-between min-h-[380px]">
          <div className="p-6 space-y-5 flex-1 flex flex-col justify-between">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="w-6 h-6 rounded-lg text-black text-[11px] font-extrabold flex items-center justify-center"
                  style={{ backgroundColor: activeColors[0] }}
                >
                  UI
                </span>
                <span className="text-xs font-bold text-slate-200">
                  {uiSpec.styleLabel || 'Cyber Dark Studio Sandbox'} · {uiSpec.type.toUpperCase()}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1" title="Paleta activa del componente">
                  {activeColors.map((hex, i) => (
                    <span
                      key={i}
                      className="w-3.5 h-3.5 rounded-full border border-white/25"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#0EA5E9]/20 text-[#38BDF8] border border-[#0EA5E9]/40">
                  Live Preview
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center my-auto py-2">
              <div className="sm:col-span-5 space-y-2">
                <div className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-[1.05]">
                  UI.
                  <br />
                  <span style={{ color: activeColors[0] }}>Menús.</span>
                  <br />
                  En Vivo.
                </div>
                <p className="text-[11px] text-slate-400">{uiSpec.title}</p>
              </div>

              {/* Componente Renderizado en Vivo */}
              <div className="sm:col-span-7 flex flex-col items-start">
                {uiSpec.type === 'menubar' && (
                  <div className="w-full space-y-2">
                    <div
                      role="menubar"
                      aria-label={uiSpec.title}
                      className="inline-flex flex-wrap bg-[#0B0F19] border border-slate-800 rounded-2xl p-1 shadow-xs"
                    >
                      {uiSpec.items.map((item) => {
                        const isOpen = openMenuId === item.id;
                        const triggerId = `cyan-menubar-trigger-${item.id}`;
                        return (
                          <div key={item.id} className="relative">
                            <button
                              id={triggerId}
                              type="button"
                              aria-haspopup="menu"
                              aria-expanded={isOpen}
                              onClick={() => setOpenMenuId(isOpen ? null : item.id)}
                              style={isOpen ? { backgroundColor: activeColors[0] } : undefined}
                              className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1 transition duration-200 cursor-pointer ${
                                isOpen
                                  ? 'text-black shadow-xs'
                                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
                              }`}
                            >
                              <span>{item.label}</span>
                              <ChevronDown className="w-3.5 h-3.5 opacity-70" aria-hidden="true" />
                            </button>

                            {isOpen && (
                              <div
                                {...({ focusgroup: 'menu nomemory' } as any)}
                                aria-labelledby={triggerId}
                                className="mt-2 w-60 bg-[#0B0F19] border border-[#0EA5E9]/40 rounded-2xl shadow-2xl p-1.5 z-20 space-y-0.5"
                              >
                                {(item.children && item.children.length > 0
                                  ? item.children
                                  : [
                                      {
                                        id: `${item.id}-default`,
                                        label: `Ejecutar ${item.label}`,
                                        shortcut: item.shortcut || '↵',
                                        checked: true,
                                      },
                                    ]
                                ).map((sub) => (
                                  <button
                                    key={sub.id}
                                    type="button"
                                    role={sub.checked !== undefined ? 'menuitemcheckbox' : undefined}
                                    aria-checked={sub.checked}
                                    onClick={() =>
                                      setLastTriggeredAction(`${item.label} → ${sub.label}`)
                                    }
                                    className="w-full px-3 py-2 text-xs text-left text-slate-200 hover:bg-[#0EA5E9]/20 hover:text-white rounded-xl transition cursor-pointer"
                                  >
                                    <span>{sub.label}</span>
                                    {sub.shortcut && (
                                      <span
                                        className="hint text-[10px] font-mono text-[#38BDF8]"
                                        aria-hidden="true"
                                      >
                                        {sub.shortcut}
                                      </span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {uiSpec.type === 'dropdown' && (
                  <div className="relative w-full">
                    <button
                      id="dropdown-studio-trigger"
                      type="button"
                      aria-haspopup="menu"
                      aria-expanded={openMenuId === 'dropdown-open'}
                      onClick={() =>
                        setOpenMenuId(openMenuId === 'dropdown-open' ? null : 'dropdown-open')
                      }
                      style={{ backgroundColor: activeColors[0] }}
                      className="px-4 py-2.5 text-black text-xs font-extrabold rounded-2xl shadow-sm flex items-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" aria-hidden="true" />
                      <span>{uiSpec.title}</span>
                      <ChevronDown className="w-4 h-4" aria-hidden="true" />
                    </button>

                    <div
                      {...({ focusgroup: 'menu nomemory' } as any)}
                      aria-labelledby="dropdown-studio-trigger"
                      className="mt-2 w-full bg-[#0B0F19] border border-[#0EA5E9]/40 rounded-2xl shadow-lg p-1.5 space-y-0.5"
                    >
                      {uiSpec.items.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          role={item.checked !== undefined ? 'menuitemcheckbox' : undefined}
                          aria-checked={item.checked}
                          onClick={() => setLastTriggeredAction(`Dropdown: ${item.label}`)}
                          className="w-full px-3 py-2 text-xs text-slate-200 hover:bg-[#0EA5E9]/20 rounded-xl transition cursor-pointer"
                        >
                          <span>{item.label}</span>
                          <span
                            className="hint text-[10px] font-mono text-[#38BDF8]"
                            aria-hidden="true"
                          >
                            {item.shortcut || '↵'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {uiSpec.type === 'toolbar' && (
                  <div className="flex flex-wrap items-center gap-2 bg-[#0B0F19] border border-slate-800 p-2.5 rounded-2xl w-full">
                    {uiSpec.items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setLastTriggeredAction(`Toolbar: ${item.label}`)}
                        className="px-3 py-2 bg-[#0F172A] hover:bg-[#0EA5E9] text-slate-200 hover:text-black border border-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition duration-200 cursor-pointer"
                      >
                        <Terminal className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {uiSpec.type === 'command-palette' && (
                  <div className="w-full bg-[#0B0F19] border border-[#0EA5E9]/40 rounded-2xl overflow-hidden shadow-md">
                    <div className="px-3.5 py-2 bg-[#0F172A] border-b border-slate-800 flex items-center gap-2 text-xs font-bold text-[#38BDF8]">
                      <Command className="w-3.5 h-3.5 text-[#0EA5E9]" aria-hidden="true" />
                      <span>{uiSpec.title}</span>
                    </div>
                    <div className="p-1.5 space-y-1">
                      {uiSpec.items.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setLastTriggeredAction(`Paleta: ${item.label}`)}
                          className="w-full px-3 py-2 text-xs text-slate-200 hover:bg-[#0EA5E9]/20 rounded-xl flex items-center justify-between transition cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5 font-medium">
                            <ChevronRight className="w-3.5 h-3.5 text-[#0EA5E9]" aria-hidden="true" />
                            {item.label}
                          </span>
                          <span className="text-[10px] font-mono text-[#38BDF8]" aria-hidden="true">
                            {item.shortcut || 'Ctrl+P'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 border-t border-slate-800 text-[11px] font-bold bg-[#0B0F19]">
            <div className="text-[#0EA5E9] px-3 py-2.5 text-center truncate border-r border-slate-800">
              MENUBAR UI
            </div>
            <div className="text-[#38BDF8] px-3 py-2.5 text-center truncate border-r border-slate-800">
              DROPDOWN
            </div>
            <div className="text-sky-300 px-3 py-2.5 text-center truncate border-r border-slate-800">
              ARIA READY
            </div>
            <div className="text-emerald-400 px-3 py-2.5 text-center truncate">
              LIVE SYNC
            </div>
          </div>
        </div>

        {/* TARJETA 2: Constructor en Vivo */}
        <div className="rounded-3xl bg-[#0F172A] border border-slate-800 text-white p-6 shadow-xl flex flex-col justify-between min-h-[380px] relative overflow-hidden">
          <div className="space-y-2 text-center max-w-md mx-auto my-auto py-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#38BDF8] bg-[#0EA5E9]/15 border border-[#0EA5E9]/30 px-3 py-1 rounded-full">
              <Layers className="w-3.5 h-3.5 text-[#0EA5E9]" aria-hidden="true" />
              Constructor de Complementos UI
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Personaliza los menús de tu skill en vivo
            </h2>
            <p className="text-xs text-slate-400">
              Evento activo:{' '}
              <strong className="text-[#38BDF8] font-mono">{lastTriggeredAction}</strong>
            </p>
          </div>

          <form onSubmit={handleAddMenuItem} className="space-y-3 z-10">
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-[#0B0F19] border border-slate-800 p-1.5 rounded-2xl">
              <label htmlFor="new-menu-item-input" className="sr-only">
                Nombre del nuevo comando o menú
              </label>
              <input
                id="new-menu-item-input"
                type="text"
                value={newItemLabel}
                onChange={(e) => setNewItemLabel(e.target.value)}
                placeholder="Añadir comando (ej. 'Exportar Agente')..."
                className="flex-1 min-w-[160px] bg-transparent px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none"
              />
              <label htmlFor="new-menu-shortcut-input" className="sr-only">
                Atajo de teclado
              </label>
              <input
                id="new-menu-shortcut-input"
                type="text"
                value={newItemShortcut}
                onChange={(e) => setNewItemShortcut(e.target.value)}
                placeholder="Ctrl+K"
                className="w-20 bg-[#0F172A] border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-mono text-[#38BDF8]"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8] text-black rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Añadir al Menú</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {uiSpec.items.map((item) => (
                  <span
                    key={item.id}
                    className="inline-flex items-center gap-1.5 text-[11px] bg-[#0B0F19] border border-slate-800 text-slate-300 px-2.5 py-1 rounded-full"
                  >
                    <span>{item.label}</span>
                    {uiSpec.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteMenuItem(item.id)}
                        aria-label={`Quitar ítem ${item.label}`}
                        className="text-slate-500 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" aria-hidden="true" />
                      </button>
                    )}
                  </span>
                ))}
              </div>

              <button
                type="button"
                onClick={handleSyncFromMarkdown}
                className="px-3 py-1.5 rounded-full bg-[#0B0F19] hover:bg-slate-800 border border-[#0EA5E9]/40 text-xs font-bold text-[#38BDF8] flex items-center gap-1.5 transition cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5 text-[#0EA5E9]" aria-hidden="true" />
                <span>Generar desde .md</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Catálogo de 6 Arquetipos Visuales */}
      <StylePresetCatalog
        skill={skill}
        onApplyPreset={handleApplyPreset}
        isCollaboratorMode={isCollaboratorMode}
        currentUserName={currentUserName}
        onRequestLogin={onRequestLogin}
      />
    </section>
  );
};
