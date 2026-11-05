import React, { useEffect, useState } from 'react';
import {
  Home,
  BookOpen,
  FolderArchive,
  Cpu,
  Check,
  Sparkles,
  LogOut,
  LogIn,
  ShieldCheck,
  Layers,
  Image as ImageIcon,
  X,
  Upload,
  Mic,
  Terminal,
  Trash2,
} from 'lucide-react';
import { SkillDocument } from '../types/skill';
import { AppPageRoute, UserAccount } from '../types/workspace';
import { eraseAllPersonalData } from '../utils/securityHardening';
import {
  ClaudeBrandIcon,
  GeminiBrandIcon,
  GPTBrandIcon,
  AngularBrandIcon,
  SpringBootBrandIcon,
  TailwindBrandIcon,
  ObsidianBrandIcon,
} from './BrandIcons';

export interface StudioNavigationProps {
  skills: SkillDocument[];
  activeSkillId: string;
  onSelectSkill: (id: string) => void;
  activePage: AppPageRoute;
  onNavigatePage: (page: AppPageRoute) => void;
  currentUser: UserAccount | null;
  onRequestLogin: () => void;
  onLogout: () => void;
  onErasePersonalData?: () => void;
  selectedModelName: string;
}

export const PAGE_NAV_ITEMS: {
  id: AppPageRoute;
  label: string;
  subtitle: string;
  shortLabel: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  {
    id: 'inicio',
    label: 'Inicio',
    subtitle: 'Landing Page Informativo y Herramientas',
    shortLabel: 'Inicio',
    icon: Home,
  },
  {
    id: 'boveda',
    label: 'Skills',
    subtitle: 'Repositorio de Skills .MD y Reglas',
    shortLabel: 'Skills',
    icon: BookOpen,
  },
  {
    id: 'estudio',
    label: 'Proyectos .RAR',
    subtitle: 'Visor e Inspector de Paquetes .RAR',
    shortLabel: 'Proyectos .RAR',
    icon: FolderArchive,
  },
  {
    id: 'preview',
    label: 'Catálogo UI/UX',
    subtitle: 'Componentes en Vivo y Prompts',
    shortLabel: 'Catálogo UI/UX',
    icon: Layers,
  },
  {
    id: 'evidencias',
    label: 'Capturas',
    subtitle: 'Galería Visual de Interfaces',
    shortLabel: 'Capturas',
    icon: ImageIcon,
  },
  {
    id: 'modelos-ia',
    label: 'Modelos IA',
    subtitle: 'Comparador de las 7 Versiones de IA',
    shortLabel: 'Modelos IA',
    icon: Cpu,
  },
];

/**
 * Navbar Superior Flotante Estilo Cristal (Glassmorphism - UI/UX Pro Max)
 * - En Modo General (Visitante): Logo a la izquierda, cápsula central con las 6 secciones y un único botón "Iniciar Sesión" a la derecha (SIN menú hamburguesa ni selector .rar).
 * - En Modo Colaborador (Al iniciar sesión): Habilita a la derecha el botón de Menú Hamburguesa moderno con todas las opciones de edición, cambio de proyecto .rar y subida de archivos.
 */
export const TopStudioHeader: React.FC<StudioNavigationProps> = ({
  skills,
  activeSkillId,
  onSelectSkill,
  activePage,
  onNavigatePage,
  currentUser,
  onRequestLogin,
  onLogout,
  onErasePersonalData,
  selectedModelName,
}) => {
  const [collaboratorDrawerOpen, setCollaboratorDrawerOpen] = useState(false);
  const isCollaboratorMode = Boolean(currentUser);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCollaboratorDrawerOpen(false);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 px-3 pt-3 pb-2 sm:px-6">
        {/* Contenedor Flotante Glassmorphism con brillo especular superior en Morado Moderno */}
        <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-2xl sm:rounded-full border border-purple-500/20 bg-[#0B0718]/85 px-4 py-2.5 sm:px-6 shadow-[0_12px_45px_-10px_rgba(3,2,8,0.9)] backdrop-blur-2xl">
          {/* Línea de luz superior sutil */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-12 -top-[1px] h-[1px] bg-gradient-to-r from-transparent via-[#A855F7]/80 to-transparent"
          />

          {/* 1. IZQUIERDA: Logotipo */}
          <button
            type="button"
            onClick={() => onNavigatePage('inicio')}
            className="group flex items-center gap-2.5 text-left cursor-pointer shrink-0 focus:outline-none"
          >
            <div className="relative flex h-9 w-9 items-center justify-center rounded-full border border-purple-400/50 bg-gradient-to-br from-[#8B5CF6] via-[#7C3AED] to-[#4F46E5] text-white shadow-lg shadow-[#8B5CF6]/40 transition-transform duration-200 group-hover:scale-105">
              <Sparkles className="h-4 w-4 stroke-[2.5]" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-base sm:text-lg font-black tracking-tight text-white">
                códice
              </span>
              <span className="text-base sm:text-lg font-extrabold tracking-tight text-[#C084FC]">
                studio
              </span>
            </div>
          </button>

          {/* 2. CENTRO: Cápsula Moderna con las 6 Secciones Claramente Separadas */}
          <nav
            aria-label="Secciones principales de la plataforma"
            className="hidden lg:flex items-center gap-1 rounded-full border border-purple-500/20 bg-[#120D24]/90 p-1 shadow-inner"
          >
            {PAGE_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isCurrent = activePage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={isCurrent ? 'page' : undefined}
                  onClick={() => onNavigatePage(item.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-extrabold tracking-tight transition-all duration-200 cursor-pointer ${
                    isCurrent
                      ? 'bg-gradient-to-r from-[#8B5CF6] via-[#7C3AED] to-[#6366F1] text-white shadow-md shadow-[#8B5CF6]/35'
                      : 'text-purple-200/70 hover:text-white hover:bg-white/[0.08]'
                  }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 ${
                      isCurrent ? 'text-white' : 'text-[#C084FC]'
                    }`}
                  />
                  <span>{item.shortLabel}</span>
                </button>
              );
            })}
          </nav>

          {/* 3. DERECHA:
              - Enlace Directo a Obsidian Vault
              - Si NO ha iniciado sesión (Modo General): UN SOLO BOTÓN "Iniciar Sesión" (Cero menú hamburguesa).
              - Si SÍ ha iniciado sesión (Modo Colaborador): Badge de Colaborador + BOTÓN DE MENÚ HAMBURGUESA MODERNO. */}
          <div className="flex items-center gap-2.5 shrink-0">
            <a
              href="obsidian://open?vault=ai-skills-studio"
              title="Abrir AI Skills Studio en tu Obsidian descargado"
              className="btn-obsidian-vault inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-md cursor-pointer"
            >
              <ObsidianBrandIcon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Obsidian</span>
            </a>

            {isCollaboratorMode && currentUser ? (
              <>
                <button
                  type="button"
                  onClick={() => setCollaboratorDrawerOpen(true)}
                  className="hidden sm:inline-flex items-center gap-2 rounded-full border border-purple-500/50 bg-purple-500/15 px-3.5 py-1.5 text-xs font-extrabold text-[#C084FC] hover:bg-purple-500/25 transition cursor-pointer"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-[#C084FC]" />
                  <span>{currentUser.fullName.split(' ')[0]}</span>
                </button>

                {/* BOTÓN MENÚ HAMBURGUESA MODERNO (EXCLUSIVO DE MODO COLABORADOR) */}
                <button
                  type="button"
                  onClick={() => setCollaboratorDrawerOpen(true)}
                  aria-label="Abrir menú hamburguesa de Colaborador"
                  aria-expanded={collaboratorDrawerOpen}
                  title="Menú de Colaborador (Edición, Paquetes .RAR y Herramientas)"
                  className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-purple-500/50 bg-gradient-to-br from-purple-500/25 to-[#120D24] shadow-lg shadow-[#8B5CF6]/25 hover:border-purple-400 transition-all duration-200 cursor-pointer"
                >
                  <span
                    aria-hidden="true"
                    className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0B0718] bg-emerald-400"
                  />
                  <div className="flex w-4.5 flex-col items-end gap-1.5">
                    <span className="h-[2px] w-4.5 rounded-full bg-white transition-all duration-200 group-hover:w-3 group-hover:bg-[#C084FC]" />
                    <span className="h-[2px] w-3.5 rounded-full bg-[#8B5CF6] transition-all duration-200 group-hover:w-4.5" />
                    <span className="h-[2px] w-4 rounded-full bg-purple-200 transition-all duration-200 group-hover:w-2.5 group-hover:bg-white" />
                  </div>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onRequestLogin}
                className="inline-flex items-center gap-2 rounded-full border border-purple-400/40 bg-gradient-to-r from-[#8B5CF6] via-[#7C3AED] to-[#6366F1] px-4 py-2 text-xs font-extrabold text-white shadow-lg shadow-[#8B5CF6]/35 hover:brightness-110 transition-all duration-200 cursor-pointer"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Iniciar Sesión</span>
              </button>
            )}
          </div>
        </div>

        {/* Cinta Móvil/Tablet para navegar entre las 6 secciones cuando la pantalla es menor a lg */}
        <div className="mx-auto mt-2 flex lg:hidden max-w-7xl items-center gap-1.5 overflow-x-auto rounded-full border border-purple-500/20 bg-[#0B0718]/90 px-3 py-1.5 backdrop-blur-xl">
          {PAGE_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isCurrent = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigatePage(item.id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold whitespace-nowrap cursor-pointer transition ${
                  isCurrent
                    ? 'bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white shadow-sm'
                    : 'text-purple-200/70 hover:text-white'
                }`}
              >
                <Icon className="h-3 w-3" />
                <span>{item.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* ====================================================================
          MENÚ HAMBURGUESA MODERNO (SLIDE-OVER DRAWER - UI/UX PRO MAX)
          Renderizado ÚNICAMENTE cuando el usuario ha iniciado sesión (Modo Colaborador)
         ==================================================================== */}
      {isCollaboratorMode && currentUser && collaboratorDrawerOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-label="Menú Hamburguesa de Colaborador"
        >
          {/* Backdrop con desenfoque */}
          <div
            aria-hidden="true"
            onClick={() => setCollaboratorDrawerOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
          />

          {/* Panel Lateral Glassmórfico */}
          <aside className="relative z-10 flex h-full w-full max-w-md flex-col justify-between border-l border-[#FF6B00]/40 bg-gradient-to-b from-[#0D1326]/98 via-[#0A0F1D]/98 to-[#070B14]/98 p-6 shadow-2xl backdrop-blur-2xl overflow-y-auto">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-20 right-0 h-48 w-48 rounded-full bg-[#FF6B00]/20 blur-3xl"
            />

            <div className="space-y-6 relative z-10">
              {/* Cabecera del Menú Hamburguesa */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF6B00] to-[#F97316] text-black shadow-lg shadow-[#FF6B00]/30">
                    <Terminal className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black tracking-tight text-white">
                        MENÚ COLABORADOR
                      </span>
                      <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 font-mono text-[9px] font-extrabold text-emerald-300">
                        ACTIVO
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Gestión de paquetes .RAR, edición de skills y prompts
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCollaboratorDrawerOpen(false)}
                  aria-label="Cerrar menú de colaborador"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-[#0F172A] text-slate-400 hover:border-[#FF6B00] hover:text-white transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Tarjeta de Sesión del Colaborador */}
              <div className="rounded-2xl border border-[#FF6B00]/50 bg-gradient-to-br from-[#131C31] to-[#0A0F1D] p-4 shadow-lg space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF6B00]/20 border border-[#FF6B00]/40 text-[#FF6B00]">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                      Colaborador Autorizado
                    </span>
                    <p className="text-sm font-black text-white truncate">
                      {currentUser.fullName}
                    </p>
                    <p className="font-mono text-[11px] text-slate-400 truncate">
                      {currentUser.email}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onNavigatePage('estudio');
                      setCollaboratorDrawerOpen(false);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#F97316] px-3 py-2 text-[11px] font-extrabold text-black shadow-md cursor-pointer"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Subir .RAR / Código</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onLogout();
                      setCollaboratorDrawerOpen(false);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-[#0A0F1D] px-3 py-2 text-[11px] font-bold text-slate-300 hover:border-rose-500/60 hover:text-rose-300 transition cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    eraseAllPersonalData();
                    if (onErasePersonalData) {
                      onErasePersonalData();
                    } else {
                      onLogout();
                    }
                    setCollaboratorDrawerOpen(false);
                  }}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-950/25 px-3 py-1.5 text-[10px] font-bold text-rose-300 hover:border-rose-500/70 hover:bg-rose-950/50 transition cursor-pointer"
                >
                  <Trash2 className="h-3 w-3 text-rose-400" />
                  <span>Borrar Datos Personales y Sesión (GDPR / CCPA)</span>
                </button>
              </div>

              {/* Selector de Proyecto / Paquete .RAR Activo (Movido aquí adentro para mantener limpio el Navbar) */}
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  Proyecto / Paquete .RAR Activo ({skills.length})
                </span>
                <div className="max-h-44 space-y-1.5 overflow-y-auto rounded-2xl border border-slate-800 bg-[#0A0F1D]/90 p-2">
                  {skills.map((skill) => {
                    const selected = skill.id === activeSkillId;
                    return (
                      <button
                        key={skill.id}
                        type="button"
                        onClick={() => {
                          onSelectSkill(skill.id);
                        }}
                        className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs transition cursor-pointer ${
                          selected
                            ? 'border border-[#FF6B00]/50 bg-[#FF6B00]/15 text-white'
                            : 'text-slate-300 hover:bg-slate-800/70'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="truncate font-bold text-white">
                            {skill.name}
                          </p>
                          <p className="truncate font-mono text-[10px] text-[#F97316]">
                            {skill.rarPackage?.archiveName || skill.filename} ·{' '}
                            {skill.aiModelLabel || 'Opus 5.5'}
                          </p>
                        </div>
                        {selected && (
                          <Check className="h-4 w-4 shrink-0 text-[#FF6B00]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Herramientas Rápidas de Edición */}
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  Herramientas de Edición Rápida
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      onNavigatePage('boveda');
                      setCollaboratorDrawerOpen(false);
                    }}
                    className="group rounded-2xl border border-slate-800 bg-[#0F172A]/90 p-3 text-left hover:border-[#FF6B00]/60 transition cursor-pointer"
                  >
                    <BookOpen className="h-4 w-4 text-[#FF6B00] mb-1.5" />
                    <span className="block text-xs font-extrabold text-white group-hover:text-[#F97316]">
                      Editar Skills .MD
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      Crear o modificar skills
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onNavigatePage('preview');
                      setCollaboratorDrawerOpen(false);
                    }}
                    className="group rounded-2xl border border-slate-800 bg-[#0F172A]/90 p-3 text-left hover:border-[#FF6B00]/60 transition cursor-pointer"
                  >
                    <Mic className="h-4 w-4 text-sky-400 mb-1.5" />
                    <span className="block text-xs font-extrabold text-white group-hover:text-sky-300">
                      Prompts &amp; Voz ES
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      Editar skills por componente
                    </span>
                  </button>

                  <a
                    href="obsidian://open?vault=ai-skills-studio"
                    title="Abrir este proyecto y sus notas en Obsidian"
                    className="col-span-2 group rounded-2xl border border-purple-500/30 bg-purple-950/20 p-3 text-left hover:border-purple-500/70 hover:bg-purple-950/35 transition cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <ObsidianBrandIcon className="h-6 w-6 shrink-0" />
                      <div>
                        <span className="block text-xs font-extrabold text-white group-hover:text-purple-300">
                          Bóveda en Obsidian
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          Abrir notas .md y grafo de conocimiento
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-purple-400 border border-purple-500/30 rounded-full px-2 py-0.5">
                      1-Clic
                    </span>
                  </a>
                </div>
              </div>

              {/* Navegación Completa de las 6 Secciones */}
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  Secciones de la Web (6)
                </span>
                <div className="space-y-1.5">
                  {PAGE_NAV_ITEMS.map((item, idx) => {
                    const Icon = item.icon;
                    const isCurrent = activePage === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onNavigatePage(item.id);
                          setCollaboratorDrawerOpen(false);
                        }}
                        className={`w-full flex items-center justify-between gap-3 rounded-2xl p-2.5 text-left transition-all cursor-pointer border ${
                          isCurrent
                            ? 'bg-gradient-to-r from-[#FF6B00] to-[#F97316] text-black border-[#FF6B00] shadow-md'
                            : 'border-slate-800/90 bg-[#0F172A]/75 text-slate-200 hover:border-[#FF6B00]/50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                              isCurrent
                                ? 'bg-black/20 text-black'
                                : 'bg-[#0A0F1D] text-[#FF6B00] border border-slate-800'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="block text-xs font-extrabold truncate">
                              {item.label}
                            </span>
                            <span
                              className={`block text-[10px] truncate ${
                                isCurrent
                                  ? 'text-black/80 font-semibold'
                                  : 'text-slate-400'
                              }`}
                            >
                              {item.subtitle}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`shrink-0 rounded-lg px-2 py-0.5 font-mono text-[10px] font-bold ${
                            isCurrent
                              ? 'bg-black/20 text-black'
                              : 'bg-[#0A0F1D] text-slate-400 border border-slate-800'
                          }`}
                        >
                          0{idx + 1}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Pie del Drawer */}
            <div className="relative z-10 mt-6 border-t border-white/10 pt-4 space-y-2.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-bold">Modelo Activo:</span>
                <span className="font-mono font-extrabold text-[#F97316]">
                  {selectedModelName}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#0A0F1D] px-3 py-2">
                <span className="text-[10px] font-bold text-slate-400">
                  IAs &amp; Frameworks:
                </span>
                <div className="flex items-center gap-2">
                  <ClaudeBrandIcon className="h-4 w-4" />
                  <GeminiBrandIcon className="h-4 w-4" />
                  <GPTBrandIcon className="h-4 w-4" />
                  <AngularBrandIcon className="h-4 w-4" />
                  <SpringBootBrandIcon className="h-4 w-4" />
                  <TailwindBrandIcon className="h-4 w-4" />
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};
