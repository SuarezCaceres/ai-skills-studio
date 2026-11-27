import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Home,
  BookOpen,
  Sparkles,
  LogOut,
  ShieldCheck,
  Layers,
  X,
  Trash2,
  Github,
  Globe,
  Users,
} from 'lucide-react';
import { AppPageRoute, UserAccount } from '../types/workspace';
import { ObsidianBrandIcon } from './BrandIcons';
import './navbarNotch.css';

export interface StudioNavigationProps {
  activePage: AppPageRoute;
  onNavigatePage: (page: AppPageRoute) => void;
  currentUser: UserAccount | null;
  onRequestLogin: () => void;
  onLogout: () => void;
  onErasePersonalData?: () => void;
  /** Avatar de la sesión de GitHub, si la hay. */
  githubAvatarUrl?: string;
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
    id: 'boveda',
    label: 'Skills',
    subtitle: 'Skills del equipo y directivas SKILL.md',
    shortLabel: 'Skills',
    icon: BookOpen,
  },
  {
    id: 'catalogo',
    label: 'Catálogo',
    subtitle: 'Skills de la comunidad, votos y resultados por modelo',
    shortLabel: 'Catálogo',
    icon: Users,
  },
  {
    id: 'skills-sh',
    label: 'Explorar',
    subtitle: 'Directorio abierto sincronizado con skills.sh',
    shortLabel: 'Explorar',
    icon: Globe,
  },
  {
    id: 'preview',
    label: 'Componentes',
    subtitle: 'Catálogo de componentes UI accesibles y código real',
    shortLabel: 'Componentes',
    icon: Layers,
  },
  {
    id: 'codice-studio',
    label: 'Códice',
    subtitle: 'Clases del equipo y bóveda local de conocimiento',
    shortLabel: 'Códice',
    icon: Sparkles,
  },
];

const LANDING_SPY_SECTIONS = ['guia', 'inspector', 'capabilities', 'benchmarks', 'faq'] as const;
type LandingSpySection = (typeof LANDING_SPY_SECTIONS)[number];

const LANDING_NAV_ITEMS: { id: LandingSpySection; label: string; href: string }[] = [
  { id: 'guia', label: 'Guía', href: '#guia' },
  { id: 'inspector', label: 'Inspector', href: '#inspector' },
  { id: 'capabilities', label: 'Capacidades', href: '#capabilities' },
  { id: 'benchmarks', label: 'Ecosistema', href: '#benchmarks' },
  { id: 'faq', label: 'Preguntas', href: '#faq' },
];

export const TopStudioHeader: React.FC<StudioNavigationProps> = ({
  activePage,
  onNavigatePage,
  currentUser,
  onRequestLogin,
  onLogout,
  onErasePersonalData,
  githubAvatarUrl,
}) => {
  const [collaboratorDrawerOpen, setCollaboratorDrawerOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<LandingSpySection | null>(null);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [sliderBox, setSliderBox] = useState<{ left: number; width: number; visible: boolean }>({
    left: 0,
    width: 0,
    visible: false,
  });
  const navRef = useRef<HTMLElement | null>(null);
  const navLinksRef = useRef<HTMLElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const isLanding = activePage === 'inicio';
  const showModuleTabs = Boolean(currentUser) || !isLanding;

  const activeNavKey = showModuleTabs ? activePage : activeSection;
  const targetNavKey = hoveredKey ?? activeNavKey;

  const updateSlider = useCallback((key: string | null) => {
    const container = navLinksRef.current;
    if (!container || !key || window.innerWidth < 1024) {
      setSliderBox((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      return;
    }
    const target = container.querySelector<HTMLElement>(`[data-nav-key="${key}"]`);
    if (!target) {
      setSliderBox((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      return;
    }
    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const left = Math.round(targetRect.left - containerRect.left);
    const width = Math.round(targetRect.width);
    setSliderBox((prev) =>
      prev.left === left && prev.width === width && prev.visible
        ? prev
        : { left, width, visible: true }
    );
  }, []);

  // Compacta el Notch y añade contraste sutil al bajar el scroll.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ScrollSpy en la portada pública (sin sesión) para resaltar la sección visible dentro del Notch.
  useEffect(() => {
    if (showModuleTabs) {
      setActiveSection(null);
      return;
    }
    const detectSection = () => {
      const marker = window.innerHeight * 0.38;
      let current: LandingSpySection | null = null;
      for (const id of LANDING_SPY_SECTIONS) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= marker && rect.bottom > 80) {
          current = id;
        }
      }
      setActiveSection(current);
    };
    detectSection();
    window.addEventListener('scroll', detectSection, { passive: true });
    window.addEventListener('resize', detectSection, { passive: true });
    return () => {
      window.removeEventListener('scroll', detectSection);
      window.removeEventListener('resize', detectSection);
    };
  }, [showModuleTabs]);

  // Mantiene sincronizado el pill deslizante al cambiar hover, ruta, sección o ancho.
  useEffect(() => {
    updateSlider(targetNavKey);
    const onResize = () => updateSlider(targetNavKey);
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, [targetNavKey, activePage, showModuleTabs, updateSlider]);

  // Intercepta clics en .nav__toggle en fase de captura para evitar doble disparo
  // con public/assets/system.js y mantener el menú móvil operativo tras remontar el header.
  useEffect(() => {
    const headerEl = navRef.current;
    if (!headerEl) return;
    const handleClickCapture = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (target?.closest('.nav__toggle')) {
        e.stopPropagation();
        setMobileMenuOpen((prev) => !prev);
      }
    };
    headerEl.addEventListener('click', handleClickCapture, { capture: true });
    return () => headerEl.removeEventListener('click', handleClickCapture, { capture: true });
  }, []);

  useEffect(() => {
    document.body.classList.toggle('nav-locked', mobileMenuOpen);
    return () => {
      document.body.classList.remove('nav-locked');
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const btn = toggleRef.current;
    if (!btn) return;
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', '18');
    svg.setAttribute('height', '18');
    svg.setAttribute('viewBox', '0 0 18 18');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', mobileMenuOpen ? 'M4 4l10 10M14 4L4 14' : 'M2 5h14M2 13h14');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '1.6');
    path.setAttribute('stroke-linecap', 'round');
    svg.appendChild(path);
    btn.replaceChildren(svg);
  }, [mobileMenuOpen]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setMobileMenuOpen(false);
      }
    };
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [activePage]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (collaboratorDrawerOpen) {
        setCollaboratorDrawerOpen(false);
        return;
      }
      if (mobileMenuOpen) {
        setMobileMenuOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [collaboratorDrawerOpen, mobileMenuOpen]);

  const handleOpenModule = (e: React.MouseEvent<HTMLAnchorElement>, page: AppPageRoute) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    onNavigatePage(page);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  return (
    <>
      <header
        ref={navRef}
        className={`nav nav--centre nav--notch${scrolled ? ' is-scrolled' : ''}${mobileMenuOpen ? ' is-open' : ''}`}
        onClick={(e) => {
          const target = e.target as Element | null;
          if (mobileMenuOpen && target?.closest('a[href]')) {
            setMobileMenuOpen(false);
          }
        }}
      >
        <div className="wrap nav__bar">
          <a className="skip-link" href="#top">
            Saltar al contenido
          </a>

          <a
            className="nav__logo"
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setMobileMenuOpen(false);
              const reduced =
                typeof window.matchMedia === 'function' &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;
              if (!isLanding) {
                onNavigatePage('inicio');
                window.scrollTo({ top: 0, behavior: 'auto' });
              } else {
                window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
              }
            }}
          >
            <span className="mark" data-mark="stack" aria-hidden="true" />
            Códice Studio
          </a>

          {!showModuleTabs ? (
            <nav
              ref={navLinksRef}
              className="nav__links"
              aria-label="Principal"
              onMouseLeave={() => setHoveredKey(null)}
            >
              <span
                aria-hidden="true"
                className="nav-notch__slider"
                style={{
                  width: `${sliderBox.width}px`,
                  transform: `translate3d(${sliderBox.left}px, -50%, 0)`,
                  opacity: sliderBox.visible ? 1 : 0,
                }}
              />
              {LANDING_NAV_ITEMS.map((item) => (
                <div className="nav__item" key={item.id}>
                  <a
                    className="nav__link"
                    href={item.href}
                    data-nav-key={item.id}
                    data-active={activeSection === item.id ? 'true' : undefined}
                    onMouseEnter={() => setHoveredKey(item.id)}
                    onFocus={() => setHoveredKey(item.id)}
                    onBlur={() => setHoveredKey(null)}
                  >
                    {item.label}
                  </a>
                </div>
              ))}
            </nav>
          ) : (
            <nav
              ref={navLinksRef}
              className="nav__links"
              aria-label="Módulos del estudio"
              onMouseLeave={() => setHoveredKey(null)}
            >
              <span
                aria-hidden="true"
                className="nav-notch__slider"
                style={{
                  width: `${sliderBox.width}px`,
                  transform: `translate3d(${sliderBox.left}px, -50%, 0)`,
                  opacity: sliderBox.visible ? 1 : 0,
                }}
              />
              {PAGE_NAV_ITEMS.map((item) => (
                <div className="nav__item" key={item.id}>
                  <a
                    className="nav__link"
                    href="#top"
                    data-nav-key={item.id}
                    aria-current={activePage === item.id ? 'page' : undefined}
                    onMouseEnter={() => setHoveredKey(item.id)}
                    onFocus={() => setHoveredKey(item.id)}
                    onBlur={() => setHoveredKey(null)}
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
              <>
                <a
                  className="nav__link inline-flex items-center gap-2"
                  href="#top"
                  aria-label={`Sesión de ${currentUser.fullName}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setCollaboratorDrawerOpen(true);
                  }}
                >
                  {githubAvatarUrl ? (
                    <img
                      src={githubAvatarUrl}
                      alt=""
                      width={22}
                      height={22}
                      referrerPolicy="no-referrer"
                      className="h-[22px] w-[22px] rounded-full border border-slate-700"
                    />
                  ) : currentUser.id.startsWith('gh-') ? (
                    <Github className="h-4 w-4" aria-hidden="true" />
                  ) : null}
                  {currentUser.fullName.split(' ')[0]}
                </a>
                {activePage !== 'boveda' ? (
                  <a
                    className="btn btn--primary"
                    href="#inspector"
                    onClick={(e) => handleOpenModule(e, 'boveda')}
                  >
                    Abrir<span className="hidden min-[1440px]:inline"> catálogo</span>
                  </a>
                ) : (
                  <span className="hidden min-[1180px]:inline-flex items-center gap-1.5 rounded-full border border-[#0ea5e9]/30 bg-[#0ea5e9]/10 px-3 py-1 font-mono text-[11px] font-medium text-[#38bdf8]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#0ea5e9]" />
                    Catálogo activo
                  </span>
                )}
              </>
            ) : (
              <a
                className="btn btn--primary inline-flex items-center gap-2"
                aria-label="Entrar con GitHub"
                href="#top"
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  onRequestLogin();
                }}
              >
                <Github className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  <span className="hidden min-[1280px]:inline">Entrar con </span>GitHub
                </span>
              </a>
            )}
          </div>

          <button
            ref={toggleRef}
            className="nav__toggle"
            type="button"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          />
        </div>
      </header>

      {collaboratorDrawerOpen &&
        currentUser &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex justify-end bg-black/70"
            role="dialog"
            aria-modal="true"
            aria-label="Panel de sesión"
          >
            <div className="flex h-full w-full max-w-md flex-col justify-between border-l border-slate-800 bg-[#0d1118] p-6 text-slate-100">
              <div className="space-y-6 overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="h-5 w-5 text-[#0ea5e9]" />
                    <div>
                      <p className="text-sm font-semibold text-white">{currentUser.fullName}</p>
                      <p className="font-mono text-xs text-slate-400">{currentUser.role}</p>
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
                  <p className="text-xs font-medium text-slate-400">Acceso rápido a módulos</p>
                  <div className="space-y-1.5">
                    {PAGE_NAV_ITEMS.filter((item) => item.id !== 'inicio').map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setCollaboratorDrawerOpen(false);
                            onNavigatePage(item.id);
                            window.scrollTo({ top: 0, behavior: 'auto' });
                          }}
                          className={`flex w-full items-center gap-3 rounded border px-3 py-2.5 text-left text-sm transition cursor-pointer ${
                            activePage === item.id
                              ? 'border-[#0ea5e9]/60 bg-[#121722] text-white'
                              : 'border-slate-800/80 bg-[#0a0d14] text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <Icon className="h-4 w-4 shrink-0 text-[#0ea5e9]" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{item.label}</span>
                            <span className="block truncate text-[11px] text-slate-400">
                              {item.subtitle}
                            </span>
                          </span>
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
          </div>,
          document.body
        )}
    </>
  );
};
