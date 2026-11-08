import React, { useEffect, useState } from 'react';
import {
  Home,
  BookOpen,
  FolderCode,
  Cpu,
  Sparkles,
  LogOut,
  ShieldCheck,
  Layers,
  Image as ImageIcon,
  X,
  Trash2,
  Check,
} from 'lucide-react';
import { SkillDocument } from '../types/skill';
import { AppPageRoute, UserAccount } from '../types/workspace';
import { ObsidianBrandIcon } from './BrandIcons';

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
    subtitle: 'Resumen de arquitectura y acceso rápido',
    shortLabel: 'Inicio',
    icon: Home,
  },
  {
    id: 'estudio',
    label: 'Workspace',
    subtitle: 'Árbol VFS, paquetes ZIP, carpetas y diff en vivo',
    shortLabel: 'Workspace',
    icon: FolderCode,
  },
  {
    id: 'boveda',
    label: 'Skills',
    subtitle: 'Repositorio y editor de directivas SKILL.md',
    shortLabel: 'Skills',
    icon: BookOpen,
  },
  {
    id: 'codice-studio',
    label: 'Códice',
    subtitle: 'Sincronización con bóveda local de notas',
    shortLabel: 'Códice',
    icon: Sparkles,
  },
  {
    id: 'preview',
    label: 'Componentes',
    subtitle: 'Barras de menús y paletas accesibles en vivo',
    shortLabel: 'Componentes',
    icon: Layers,
  },
  {
    id: 'modelos-ia',
    label: 'Modelos',
    subtitle: 'Velocidad, latencia y contexto de 7 modelos',
    shortLabel: 'Modelos',
    icon: Cpu,
  },
  {
    id: 'evidencias',
    label: 'Capturas',
    subtitle: 'Registro visual de pruebas por skill',
    shortLabel: 'Capturas',
    icon: ImageIcon,
  },
];

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
  const isLanding = activePage === 'inicio';

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCollaboratorDrawerOpen(false);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  const handleOpenModule = (e: React.MouseEvent<HTMLAnchorElement>, page: AppPageRoute) => {
    e.preventDefault();
    onNavigatePage(page);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  return (
    <>
      <header className="nav nav--centre">
        <div className="wrap nav__bar">
          <a className="skip-link" href="#top">
            Saltar al contenido
          </a>

          <a
            className="nav__logo"
            href="#top"
            onClick={(e) => {
              if (!isLanding) {
                e.preventDefault();
                onNavigatePage('inicio');
                window.scrollTo({ top: 0, behavior: 'auto' });
              }
            }}
          >
            <span className="mark" data-mark="stack" aria-hidden="true" />
            Códice Studio
          </a>

          {isLanding ? (
            <nav className="nav__links" aria-label="Principal">
              <div className="nav__item">
                <a className="nav__link" href="#workspace">
                  Módulos{' '}
                  <svg className="chev" viewBox="0 0 12 12" aria-hidden="true">
                    <path
                      d="M3 4.5l3 3 3-3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
                <div className="nav__menu">
                  <div className="wrap grid">
                    <div className="menu-col span-4">
                      <p className="t-label">Ingeniería</p>
                      <a href="#workspace" onClick={(e) => handleOpenModule(e, 'estudio')}>
                        Workspace VFS<span>Paquetes ZIP, carpetas y diff</span>
                      </a>
                      <a href="#workspace" onClick={(e) => handleOpenModule(e, 'boveda')}>
                        Catálogo de skills<span>Archivos SKILL.md y auditoría</span>
                      </a>
                      <a href="#capabilities" onClick={(e) => handleOpenModule(e, 'codice-studio')}>
                        Códice de notas<span>Vínculo directo con Obsidian</span>
                      </a>
                    </div>
                    <div className="menu-col span-4">
                      <p className="t-label">Verificación</p>
                      <a href="#capabilities" onClick={(e) => handleOpenModule(e, 'preview')}>
                        Componentes UI<span>Menús y atajos de teclado</span>
                      </a>
                      <a href="#benchmarks" onClick={(e) => handleOpenModule(e, 'modelos-ia')}>
                        Benchmarks IA<span>7 modelos medidos en vivo</span>
                      </a>
                      <a href="#faq" onClick={(e) => handleOpenModule(e, 'evidencias')}>
                        Registro visual<span>Capturas y trazas de prueba</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              <div className="nav__item">
                <a className="nav__link" href="#workspace">
                  Workspace
                </a>
              </div>
              <div className="nav__item">
                <a className="nav__link" href="#capabilities">
                  Capacidades
                </a>
              </div>
              <div className="nav__item">
                <a className="nav__link" href="#benchmarks">
                  Modelos
                </a>
              </div>
              <div className="nav__item">
                <a className="nav__link" href="#faq">
                  Preguntas
                </a>
              </div>
            </nav>
          ) : (
            <nav className="nav__links" aria-label="Módulos del estudio">
              {PAGE_NAV_ITEMS.slice(0, 6).map((item) => (
                <div className="nav__item" key={item.id}>
                  <a
                    className="nav__link"
                    href="#top"
                    aria-current={activePage === item.id ? 'page' : undefined}
                    onClick={(e) => handleOpenModule(e, item.id)}
                  >
                    {item.shortLabel}
                  </a>
                </div>
              ))}
            </nav>
          )}

          <div className="nav__actions">
            {currentUser ? (
              <a
                className="nav__link"
                href="#workspace"
                onClick={(e) => {
                  e.preventDefault();
                  setCollaboratorDrawerOpen(true);
                }}
              >
                {currentUser.fullName.split(' ')[0]}
              </a>
            ) : (
              <a
                className="nav__link"
                href="#workspace"
                onClick={(e) => {
                  e.preventDefault();
                  onRequestLogin();
                }}
              >
                Acceder
              </a>
            )}
            <a
              className="btn btn--primary"
              href="#workspace"
              onClick={(e) => handleOpenModule(e, 'estudio')}
            >
              Abrir<span className="hidden sm:inline"> Workspace</span>
            </a>
          </div>

          <button
            className="nav__toggle"
            type="button"
            aria-expanded="false"
            aria-label="Abrir menú"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path
                d="M2 5h14M2 13h14"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </header>

      {collaboratorDrawerOpen && currentUser && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/70"
          role="dialog"
          aria-modal="true"
          aria-label="Panel de sesión y proyectos activos"
        >
          <div className="flex h-full w-full max-w-md flex-col justify-between border-l border-slate-800 bg-[#0d1118] p-6 text-slate-100">
            <div className="space-y-6 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="h-5 w-5 text-[#0ea5e9]" />
                  <div>
                    <p className="text-sm font-semibold text-white">{currentUser.fullName}</p>
                    <p className="font-mono text-xs text-slate-400">
                      {currentUser.role} · {selectedModelName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCollaboratorDrawerOpen(false)}
                  aria-label="Cerrar panel"
                  className="inline-flex h-9 w-9 items-center justify-center rounded border border-slate-800 bg-[#121722] text-slate-300 hover:border-slate-600 hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-400">Skill activa en estudio</p>
                <div className="space-y-1.5">
                  {skills.map((skill) => {
                    const selected = skill.id === activeSkillId;
                    return (
                      <button
                        key={skill.id}
                        type="button"
                        onClick={() => {
                          onSelectSkill(skill.id);
                          setCollaboratorDrawerOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded border px-3 py-2.5 text-left text-sm transition cursor-pointer ${
                          selected
                            ? 'border-[#0ea5e9]/60 bg-[#121722] text-white'
                            : 'border-slate-800/80 bg-[#0a0d14] text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span className="truncate font-medium">{skill.name}</span>
                        {selected && <Check className="h-4 w-4 shrink-0 text-[#0ea5e9]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-800 pt-4">
                <p className="text-xs font-medium text-slate-400">Vínculo local</p>
                <a
                  href="obsidian://open?vault=ai-skills-studio"
                  className="btn-obsidian-vault flex w-full items-center justify-center gap-2 rounded px-3.5 py-2.5 text-sm font-medium"
                >
                  <ObsidianBrandIcon className="h-4 w-4 shrink-0" />
                  <span>Abrir bóveda en Obsidian</span>
                </a>
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-800 pt-4">
              {onErasePersonalData && (
                <button
                  type="button"
                  onClick={() => {
                    setCollaboratorDrawerOpen(false);
                    onErasePersonalData();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded border border-rose-500/30 bg-rose-950/20 px-3.5 py-2.5 text-xs font-medium text-rose-300 hover:bg-rose-950/40 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Borrar datos locales (GDPR)</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setCollaboratorDrawerOpen(false);
                  onLogout();
                }}
                className="flex w-full items-center justify-center gap-2 rounded border border-slate-700 bg-[#121722] px-3.5 py-2.5 text-xs font-medium text-slate-200 hover:border-slate-500 hover:text-white cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
