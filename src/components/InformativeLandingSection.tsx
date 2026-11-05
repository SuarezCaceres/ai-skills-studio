import React, { useState } from 'react';
import {
  Sparkles,
  Code2,
  FolderArchive,
  Layers,
  BookOpen,
  Cpu,
  Image as ImageIcon,
  ArrowRight,
  CheckCircle2,
  Mic,
  Palette,
  FileCode2,
} from 'lucide-react';
import { AppPageRoute, SpecificModelVersion } from '../types/workspace';
import { ComputerLightBeamShowcase } from './ComputerLightBeamShowcase';
import {
  ClaudeBrandIcon,
  GeminiBrandIcon,
  GPTBrandIcon,
  AngularBrandIcon,
  SpringBootBrandIcon,
  TailwindBrandIcon,
  TypeScriptBrandIcon,
  ReactBrandIcon,
} from './BrandIcons';
import {
  MODEL_VERSION_PILLS,
  FRAMEWORK_COLLECTIONS,
} from '../data/frameworkCollectionsData';

interface InformativeLandingSectionProps {
  onNavigatePage: (page: AppPageRoute) => void;
  onSelectModelVersion?: (version: SpecificModelVersion) => void;
  onFilterByFramework?: (tag: string) => void;
}

const AIBrandBadgeIcon: React.FC<{
  brand: 'Claude' | 'Gemini' | 'GPT';
  className?: string;
}> = ({ brand, className = 'h-3.5 w-3.5' }) => {
  if (brand === 'Claude') return <ClaudeBrandIcon className={className} />;
  if (brand === 'Gemini') return <GeminiBrandIcon className={className} />;
  return <GPTBrandIcon className={className} />;
};

export const InformativeLandingSection: React.FC<
  InformativeLandingSectionProps
> = ({ onNavigatePage, onSelectModelVersion, onFilterByFramework }) => {
  const [activeDesktopModel, setActiveDesktopModel] =
    useState<SpecificModelVersion>('Opus 5.5');
  const [collectionTab, setCollectionTab] = useState<
    'todos' | 'frecuentes' | 'populares'
  >('todos');

  const visibleCollections =
    collectionTab === 'todos'
      ? FRAMEWORK_COLLECTIONS
      : FRAMEWORK_COLLECTIONS.filter((c) => c.category === collectionTab);

  const handleModelClickInMockup = (version: SpecificModelVersion) => {
    setActiveDesktopModel(version);
    onSelectModelVersion?.(version);
  };

  return (
    <div className="relative space-y-16">
      {/* ====================================================================
          1. SECCIÓN HERO CENTRADA CON LA COMPUTADORA DE INGENIERÍA E ICONOS
         ==================================================================== */}
      <section
        aria-labelledby="landing-hero-heading"
        className="relative -mt-4 rounded-3xl border border-purple-500/20 bg-gradient-to-b from-[#0F0B1E] via-[#130E26] to-[#07050E] px-4 pt-12 pb-8 sm:px-10 sm:pt-16 sm:pb-12 shadow-2xl overflow-hidden"
      >
        {/* Retícula Geométrica en Perspectiva Superior */}
        <svg
          aria-hidden="true"
          viewBox="0 0 1200 260"
          className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl opacity-30"
        >
          <defs>
            <linearGradient id="heroGridGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="25%" stopColor="#8B5CF6" />
              <stop offset="50%" stopColor="#C084FC" />
              <stop offset="75%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <path
            d="M120 190 L1080 190 M180 150 L1020 150 M250 115 L950 115 M600 115 L600 240 M430 115 L310 240 M770 115 L890 240 M330 115 L140 240 M870 115 L1060 240"
            stroke="url(#heroGridGrad)"
            strokeWidth="1"
            fill="none"
          />
        </svg>

        {/* Bloque Superior Centrado */}
        <div className="relative z-10 mx-auto max-w-4xl text-center space-y-6">
          <h1
            id="landing-hero-heading"
            className="text-4xl sm:text-6xl lg:text-[64px] font-black tracking-tight text-white leading-[1.06]"
          >
            Nueva Era de{' '}
            <span className="bg-gradient-to-r from-white via-purple-100 to-[#C084FC] bg-clip-text text-transparent">
              Ingeniería y Skills IA
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-sm sm:text-lg text-purple-100/80 leading-relaxed font-medium">
            Inspecciona paquetes <code className="text-[#C084FC] font-mono font-bold">.rar</code> en vivo, personaliza componentes UI/UX con sus prompts exactos y compara el rendimiento real de{' '}
            <strong className="text-white">Claude Opus 5.5, Gemini 3.8 y GPT Astra</strong>.
          </p>

          {/* Barra Cápsula Central Interactiva */}
          <div className="mx-auto flex max-w-lg items-center justify-between gap-2 rounded-full border border-purple-500/25 bg-[#17102E]/90 p-1.5 pl-4 shadow-[0_0_40px_rgba(139,92,246,0.22)] backdrop-blur-xl">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <AIBrandBadgeIcon
                brand={
                  MODEL_VERSION_PILLS.find((m) => m.version === activeDesktopModel)
                    ?.brand || 'Claude'
                }
                className="h-4 w-4 shrink-0"
              />
              <label htmlFor="hero-model-select" className="sr-only">
                Seleccionar versión de modelo IA en la estación
              </label>
              <select
                id="hero-model-select"
                value={activeDesktopModel}
                onChange={(e) =>
                  handleModelClickInMockup(e.target.value as SpecificModelVersion)
                }
                className="w-full bg-transparent text-xs sm:text-sm font-bold text-slate-200 focus:outline-none cursor-pointer truncate"
              >
                {MODEL_VERSION_PILLS.map((m) => (
                  <option
                    key={m.version}
                    value={m.version}
                    className="bg-[#0D091A] text-white"
                  >
                    {m.brand} · {m.version} ({m.badge})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => onNavigatePage('preview')}
              className="shrink-0 rounded-full border border-purple-400/30 bg-gradient-to-r from-[#8B5CF6] via-[#7C3AED] to-[#6366F1] hover:brightness-110 px-5 py-2.5 text-xs sm:text-sm font-extrabold text-white shadow-lg shadow-[#8B5CF6]/35 transition cursor-pointer"
            >
              Ver Catálogo UI/UX
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-medium text-purple-200/70">
            <span>Acceso libre en Modo General</span>
            <Sparkles className="h-3.5 w-3.5 text-[#C084FC]" />
            <span>7 Versiones de IA &amp; Evaluación por Voz ES</span>
          </div>

          {/* Píldoras Rápidas de las 7 Versiones con sus Iconos Oficiales */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
            {MODEL_VERSION_PILLS.map((m) => {
              const active = activeDesktopModel === m.version;
              return (
                <button
                  key={m.version}
                  type="button"
                  onClick={() => handleModelClickInMockup(m.version)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold transition cursor-pointer border ${
                    active
                      ? 'bg-[#8B5CF6]/25 text-white border-[#A855F7] shadow-sm shadow-[#8B5CF6]/40'
                      : 'border-white/10 bg-[#130E26]/80 text-purple-200/80 hover:border-[#8B5CF6]/50 hover:text-white'
                  }`}
                >
                  <AIBrandBadgeIcon brand={m.brand} className="h-3.5 w-3.5" />
                  <span>{m.version}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Contenedor Panorámico Inferior con la Computadora de Ingeniería e Iconos */}
        <div className="relative z-10 mt-10 mx-auto max-w-6xl">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 h-44 w-[82%] rounded-full bg-gradient-to-r from-purple-600/40 via-[#8B5CF6]/45 to-sky-500/30 blur-3xl"
          />

          <ComputerLightBeamShowcase
            activeModel={activeDesktopModel}
            onSelectModel={handleModelClickInMockup}
            onNavigatePage={onNavigatePage}
          />
        </div>
      </section>

      {/* ====================================================================
          2. SECCIÓN INFORMATIVA: ¿PARA QUÉ Y POR QUÉ SIRVE LA PLATAFORMA?
         ==================================================================== */}
      <section
        aria-labelledby="purpose-why-heading"
        className="content-visibility-auto rounded-3xl border border-slate-800/90 bg-gradient-to-b from-[#0F172A]/95 to-[#0A0F1D] p-6 sm:p-10 shadow-xl space-y-8"
      >
        <div className="max-w-3xl mx-auto text-center space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FF6B00]/35 bg-[#FF6B00]/10 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#F97316]">
            <Sparkles className="h-3.5 w-3.5 text-[#FF6B00]" />
            Propósito y Utilidad de la Web
          </span>
          <h2
            id="purpose-why-heading"
            className="text-2xl sm:text-4xl font-black tracking-tight text-white"
          >
            ¿Para qué y por qué sirve Códice Orange?
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Esta aplicación web fue creada para resolver la desconexión entre los{' '}
            <strong className="text-white">paquetes de código comprimidos (.rar)</strong>, los{' '}
            <strong className="text-white">prompts de diseño UI/UX</strong> y las{' '}
            <strong className="text-white">pruebas de modelos de IA</strong>, reuniendo todo en un mismo entorno interactivo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Razón 1 */}
          <div className="rounded-2xl border border-slate-800 bg-[#0A0F1D]/90 p-6 space-y-3 hover:border-[#FF6B00]/50 transition">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FF6B00]/15 border border-[#FF6B00]/40 text-[#FF6B00]">
              <FolderArchive className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-extrabold text-white">
              1. ¿Por qué centralizar paquetes .RAR y código?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Normalmente, para revisar un proyecto comprimido hay que descargarlo, extraerlo y abrir un editor local. Aquí puedes{' '}
              <strong className="text-white">arrastrar cualquier archivo .rar</strong> para ver al instante sus capturas visuales, explorar su árbol de archivos, leer su código fuente y traducir su documentación <code className="text-[#F97316]">.md</code> al español en 1 clic.
            </p>
          </div>

          {/* Razón 2 */}
          <div className="rounded-2xl border border-slate-800 bg-[#0A0F1D]/90 p-6 space-y-3 hover:border-[#FF6B00]/50 transition">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/15 border border-sky-400/40 text-sky-400">
              <Palette className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-extrabold text-white">
              2. ¿Para qué sirve el Catálogo UI/UX en vivo?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              En lugar de ver plantillas estáticas, puedes pasar el cursor sobre cada estilo para{' '}
              <strong className="text-white">abrir una demostración interactiva</strong>, cambiar los colores del componente en tiempo real y obtener el{' '}
              <strong className="text-white">prompt exacto y las skills</strong> necesarias para replicarlo.
            </p>
          </div>

          {/* Razón 3 */}
          <div className="rounded-2xl border border-slate-800 bg-[#0A0F1D]/90 p-6 space-y-3 hover:border-[#FF6B00]/50 transition">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-400">
              <Cpu className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-extrabold text-white">
              3. ¿Por qué comparar 7 versiones de IA y dictar por voz?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              No todos los modelos generan la misma calidad visual. La web permite comparar cómo responden{' '}
              <strong className="text-white">Opus 5.5, Opus 4.8, Sonnet 5.5, Gemini 3.8, Gemini 3.7, GPT Astra y GPT Luna</strong>, y registrar tu opinión hablada mediante{' '}
              <strong className="text-white">dictado por voz en español</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* ====================================================================
          3. SECCIÓN: HERRAMIENTAS DE LA PLATAFORMA (FUNCIONES INTERNAS DE LA WEB)
             De aquí el usuario comprende cada módulo y puede navegar desde las tarjetas o el Navbar
         ==================================================================== */}
      <section
        aria-labelledby="platform-tools-heading"
        className="content-visibility-auto space-y-8"
      >
        <div className="max-w-3xl mx-auto text-center space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/35 bg-sky-500/10 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-sky-300">
            <Layers className="h-3.5 w-3.5 text-sky-400" />
            Funciones Internas de la Web
          </span>
          <h2
            id="platform-tools-heading"
            className="text-2xl sm:text-4xl font-black tracking-tight text-white"
          >
            Herramientas de la Plataforma
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            Conoce las herramientas que integran esta plataforma. Puedes acceder a cualquiera de ellas desde aquí o usando la{' '}
            <strong className="text-white">barra de navegación superior</strong> en cualquier momento.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Herramienta 1: Visor de Proyectos .RAR */}
          <article className="rounded-3xl border border-slate-800 bg-gradient-to-b from-[#0F172A] to-[#0A0F1D] p-6 flex flex-col justify-between space-y-5 hover:border-[#FF6B00]/60 transition shadow-lg">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FF6B00]/15 border border-[#FF6B00]/40 text-[#FF6B00]">
                  <FolderArchive className="h-6 w-6" />
                </div>
                <span className="rounded-full border border-[#FF6B00]/35 bg-[#FF6B00]/10 px-3 py-1 font-mono text-[10px] font-extrabold text-[#F97316]">
                  Sección: Proyectos .RAR
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-white">
                Visor e Inspector de Paquetes .RAR
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Dividido en tres paneles: <strong className="text-white">capturas visuales del sistema</strong> a la izquierda/centro, <strong className="text-white">árbol de archivos y visor de código</strong> a la derecha, y <strong className="text-white">documentación .MD con traducción instantánea</strong> en la parte inferior.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-400 pt-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Carga drag &amp; drop de archivos .rar en memoria</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Botón &quot;Traducir&quot; al español en 1 clic</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => onNavigatePage('estudio')}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#F97316] px-4 py-2.5 text-xs font-extrabold text-black shadow-md hover:brightness-110 transition cursor-pointer"
            >
              <span>Ir a Proyectos .RAR</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </article>

          {/* Herramienta 2: Catálogo de Componentes UI/UX y Prompts */}
          <article className="rounded-3xl border border-slate-800 bg-gradient-to-b from-[#0F172A] to-[#0A0F1D] p-6 flex flex-col justify-between space-y-5 hover:border-[#FF6B00]/60 transition shadow-lg">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/15 border border-sky-400/40 text-sky-400">
                  <Layers className="h-6 w-6" />
                </div>
                <span className="rounded-full border border-sky-500/35 bg-sky-500/10 px-3 py-1 font-mono text-[10px] font-extrabold text-sky-300">
                  Sección: Catálogo UI/UX
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-white">
                Catálogo UI/UX con Demo y Prompts
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Incluye tarjetas de componentes con dos acciones al pasar el cursor: <strong className="text-white">&quot;Ver Demostración&quot;</strong> para personalizar colores y menús en vivo, y <strong className="text-white">&quot;Mostrar Prompt y Rendimiento&quot;</strong> para copiar el prompt y editar sus skills.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-400 pt-1">
                <li className="flex items-center gap-2">
                  <Mic className="h-3.5 w-3.5 text-[#FF6B00] shrink-0" />
                  <span>Evaluación de impacto visual con dictado por voz (ES)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Skills editables al iniciar sesión como Colaborador</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => onNavigatePage('preview')}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-[#131C31] hover:bg-[#FF6B00] hover:text-black hover:border-[#FF6B00] px-4 py-2.5 text-xs font-extrabold text-white transition cursor-pointer"
            >
              <span>Ir a Catálogo UI/UX</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </article>

          {/* Herramienta 3: Repositorio de Skills (.MD) */}
          <article className="rounded-3xl border border-slate-800 bg-gradient-to-b from-[#0F172A] to-[#0A0F1D] p-6 flex flex-col justify-between space-y-5 hover:border-[#FF6B00]/60 transition shadow-lg">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/15 border border-purple-400/40 text-purple-300">
                  <BookOpen className="h-6 w-6" />
                </div>
                <span className="rounded-full border border-purple-500/35 bg-purple-500/10 px-3 py-1 font-mono text-[10px] font-extrabold text-purple-300">
                  Sección: Skills
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-white">
                Gestor y Biblioteca de Skills (.MD)
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Repositorio organizado de documentos <code className="text-[#F97316]">SKILL.md</code> y guías técnicas que definen cómo debe programar y diseñar cada agente de IA según el framework.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-400 pt-1">
                <li className="flex items-center gap-2">
                  <FileCode2 className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                  <span>Descarga directa de archivos .MD y filtrado por nivel</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Creación y edición de skills en Modo Colaborador</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => onNavigatePage('boveda')}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-[#131C31] hover:bg-[#FF6B00] hover:text-black hover:border-[#FF6B00] px-4 py-2.5 text-xs font-extrabold text-white transition cursor-pointer"
            >
              <span>Ir a Skills</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </article>

          {/* Herramienta 4: Comparador de Modelos IA */}
          <article className="rounded-3xl border border-slate-800 bg-gradient-to-b from-[#0F172A] to-[#0A0F1D] p-6 flex flex-col justify-between space-y-5 hover:border-[#FF6B00]/60 transition shadow-lg md:col-span-1 lg:col-span-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-400">
                    <Cpu className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-white">
                      Comparador de las 7 Versiones de Modelos de IA
                    </h3>
                    <p className="text-xs text-slate-400">
                      Benchmarks de velocidad, contexto, código y fidelidad visual
                    </p>
                  </div>
                </div>
                <span className="rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3 py-1 font-mono text-[10px] font-extrabold text-emerald-300">
                  Sección: Modelos IA
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Compara lado a lado las métricas y el impacto visual de las versiones específicas soportadas en la plataforma:{' '}
                <strong className="text-white">
                  Claude Opus 5.5, Claude Opus 4.8, Claude Sonnet 5.5, Gemini 3.8, Gemini 3.7, GPT Astra y GPT Luna
                </strong>.
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {MODEL_VERSION_PILLS.map((m) => (
                  <span
                    key={m.version}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#0A0F1D] px-2.5 py-1 text-[11px] font-bold text-slate-200"
                  >
                    <AIBrandBadgeIcon brand={m.brand} className="h-3.5 w-3.5" />
                    <span>{m.version}</span>
                  </span>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigatePage('modelos-ia')}
              className="w-full sm:w-auto self-start inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-[#131C31] hover:bg-[#FF6B00] hover:text-black hover:border-[#FF6B00] px-5 py-2.5 text-xs font-extrabold text-white transition cursor-pointer"
            >
              <span>Ir a Modelos IA</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </article>

          {/* Herramienta 5: Galería de Capturas */}
          <article className="rounded-3xl border border-slate-800 bg-gradient-to-b from-[#0F172A] to-[#0A0F1D] p-6 flex flex-col justify-between space-y-5 hover:border-[#FF6B00]/60 transition shadow-lg">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-400/40 text-amber-300">
                  <ImageIcon className="h-6 w-6" />
                </div>
                <span className="rounded-full border border-amber-500/35 bg-amber-500/10 px-3 py-1 font-mono text-[10px] font-extrabold text-amber-300">
                  Sección: Capturas
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-white">
                Galería de Capturas y Evidencias UI/UX
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Visualiza en alta resolución las pantallas de cada proyecto y registra nuevas capturas junto con sus fragmentos de código asociados.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigatePage('evidencias')}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-[#131C31] hover:bg-[#FF6B00] hover:text-black hover:border-[#FF6B00] px-4 py-2.5 text-xs font-extrabold text-white transition cursor-pointer"
            >
              <span>Ir a Capturas</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </article>
        </div>
      </section>

      {/* ====================================================================
          4. SECCIÓN DE COLECCIONES Y FRAMEWORKS (POPULARES Y MÁS FRECUENTES)
         ==================================================================== */}
      <section
        aria-labelledby="collections-frameworks-heading"
        className="content-visibility-auto space-y-8 pt-2"
      >
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FF6B00]/35 bg-[#FF6B00]/10 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#F97316]">
            <Code2 className="h-3.5 w-3.5 text-[#FF6B00]" />
            Ecosistema de Frameworks Soportados
          </span>
          <h2
            id="collections-frameworks-heading"
            className="text-3xl sm:text-5xl font-black tracking-tight text-white"
          >
            Colecciones y Frameworks
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            Explora nuestras arquitecturas clasificadas en{' '}
            <strong className="text-white">Frameworks Más Frecuentes</strong>{' '}
            (Angular, Spring Boot, Tailwind, TypeScript) y{' '}
            <strong className="text-white">Frameworks Populares</strong> de la comunidad.
          </p>

          <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-[#0F172A] p-1.5 mt-2">
            {(
              [
                {
                  id: 'todos',
                  label: 'Todas las Colecciones (8)',
                },
                {
                  id: 'frecuentes',
                  label: '⚡ Frameworks Más Frecuentes (Angular, Spring Boot, Tailwind)',
                },
                {
                  id: 'populares',
                  label: '🔥 Frameworks Populares (React 19, Astro, Python MCP)',
                },
              ] as const
            ).map((tab) => {
              const active = collectionTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCollectionTab(tab.id)}
                  className={`rounded-xl px-4 py-2 text-xs font-extrabold transition cursor-pointer ${
                    active
                      ? 'bg-gradient-to-r from-[#FF6B00] to-[#F97316] text-black shadow-md'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Cuadrícula de 4 Columnas de Tarjetas */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {visibleCollections.map((col) => (
            <article
              key={col.id}
              className="group relative rounded-3xl border border-slate-800/90 bg-gradient-to-b from-[#0F172A] via-[#0B1324] to-[#0A0F1D] p-6 flex flex-col justify-between overflow-hidden shadow-xl hover:border-[#FF6B00]/60 transition-all duration-300 min-h-[430px]"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full blur-2xl opacity-30 group-hover:opacity-60 transition"
                style={{ backgroundColor: col.accentColor }}
              />

              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0A0F1D]/90 shadow-lg border border-white/15"
                    style={{
                      boxShadow: `0 8px 24px -4px ${col.accentColor}55`,
                    }}
                  >
                    {col.iconSvg}
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider border ${
                      col.category === 'frecuentes'
                        ? 'bg-[#FF6B00]/15 text-[#F97316] border-[#FF6B00]/40'
                        : 'bg-sky-500/15 text-sky-300 border-sky-500/35'
                    }`}
                  >
                    {col.categoryBadge}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-extrabold text-white tracking-tight">
                    {col.name}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed min-h-[54px]">
                    {col.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (onFilterByFramework) {
                      onFilterByFramework(col.filterTag);
                    }
                    onNavigatePage('boveda');
                  }}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-700/90 bg-[#131C31]/90 hover:bg-[#FF6B00] hover:text-black hover:border-[#FF6B00] text-xs font-extrabold text-white transition duration-200 cursor-pointer shadow-sm"
                >
                  {col.ctaLabel}
                </button>
              </div>

              <div className="relative z-10 pt-8 mt-auto">
                <div className="grid grid-cols-3 gap-2 items-end">
                  {col.previewCards.map((card, idx) => (
                    <div
                      key={card.title}
                      className={`rounded-xl border border-slate-700/90 bg-[#0A0F1D] p-2.5 shadow-lg transition-transform duration-300 group-hover:-translate-y-1 ${
                        idx === 0
                          ? '-rotate-3 translate-y-1'
                          : idx === 1
                          ? 'z-10 scale-105 border-[#FF6B00]/50 shadow-xl'
                          : 'rotate-3 translate-y-1'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div
                          className="h-1.5 w-6 rounded-full"
                          style={{ backgroundColor: card.accent }}
                        />
                        <AIBrandBadgeIcon
                          brand={card.aiBrand}
                          className="h-3.5 w-3.5"
                        />
                      </div>
                      <p className="text-[10px] font-extrabold text-white truncate">
                        {card.title}
                      </p>
                      <p className="text-[9px] text-slate-400 truncate mt-0.5">
                        {card.subtitle}
                      </p>
                      <span
                        className="mt-1.5 inline-block rounded px-1.5 py-0.5 font-mono text-[8px] font-bold text-black"
                        style={{ backgroundColor: card.accent }}
                      >
                        {card.badge}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Cintillo Inferior de Ecosistemas e Inteligencias con Iconos Oficiales */}
        <div className="pt-6 border-t border-slate-800/80 text-center space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Frecuentemente Desplegado e Integrado Con:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-7 text-slate-300">
            {[
              {
                name: 'Angular Signals',
                badge: 'Frecuente',
                icon: <AngularBrandIcon className="h-5 w-5" />,
              },
              {
                name: 'Spring Boot 3',
                badge: 'Frecuente',
                icon: <SpringBootBrandIcon className="h-5 w-5" />,
              },
              {
                name: 'Tailwind CSS',
                badge: 'Frecuente',
                icon: <TailwindBrandIcon className="h-5 w-5" />,
              },
              {
                name: 'TypeScript 5',
                badge: 'Frecuente',
                icon: <TypeScriptBrandIcon className="h-5 w-5" />,
              },
              {
                name: 'React 19',
                badge: 'Popular',
                icon: <ReactBrandIcon className="h-5 w-5" />,
              },
              {
                name: 'Claude Opus 5.5',
                badge: 'IA Cortex',
                icon: <ClaudeBrandIcon className="h-5 w-5" />,
              },
              {
                name: 'Gemini 3.8 Ultra',
                badge: 'IA Cortex',
                icon: <GeminiBrandIcon className="h-5 w-5" />,
              },
              {
                name: 'GPT Astra & Luna',
                badge: 'IA Cortex',
                icon: <GPTBrandIcon className="h-5 w-5" />,
              },
            ].map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-2 rounded-xl border border-slate-800/90 bg-[#0F172A]/80 px-3.5 py-2 text-xs sm:text-sm font-black tracking-tight text-white/90 hover:border-[#FF6B00]/60 hover:text-[#FF6B00] transition"
              >
                {item.icon}
                <span>{item.name}</span>
                <span className="rounded-md border border-slate-800 bg-[#0A0F1D] px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#F97316]">
                  {item.badge}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
