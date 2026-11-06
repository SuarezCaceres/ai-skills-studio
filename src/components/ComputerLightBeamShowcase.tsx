import React, { useState } from 'react';
import {
  Sparkles,
  Laptop,
  ArrowUpRight,
  Cpu,
  Globe,
  Plus,
  PanelLeft,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AppPageRoute, SpecificModelVersion } from '../types/workspace';
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

interface ComputerLightBeamShowcaseProps {
  activeModel: SpecificModelVersion;
  onSelectModel: (version: SpecificModelVersion) => void;
  onNavigatePage: (page: AppPageRoute) => void;
}

interface FloatingBeamPill {
  id: string;
  label: string;
  sublabel: string;
  modelVersion: SpecificModelVersion;
  skillTag: string;
  topPercent: string;
  leftPercent: string;
  brandIcon: React.ReactNode;
  description: string;
}

const FLOATING_BEAM_PILLS: FloatingBeamPill[] = [
  {
    id: 'pill-opus-55',
    label: 'Claude Opus 5.5 · Cortex',
    sublabel: 'Razonamiento 100%',
    modelVersion: 'Opus 5.5',
    skillTag: '#ui-ux-pro-max',
    topPercent: '6%',
    leftPercent: '14%',
    brandIcon: <ClaudeBrandIcon className="h-6 w-6 shrink-0" />,
    description:
      'Jerarquía visual AAA en Azul Noche (#0A0F1D) con sombras multicapa y precisión arquitectónica.',
  },
  {
    id: 'pill-study-angular',
    label: 'Plan de Estudio · Angular & UI',
    sublabel: 'Ingeniería Frontend',
    modelVersion: 'Sonnet 5.5',
    skillTag: '#angular-tutor',
    topPercent: '9%',
    leftPercent: '56%',
    brandIcon: <AngularBrandIcon className="h-6 w-6 shrink-0" />,
    description:
      'Ruta de aprendizaje interactiva sincronizada con componentes en Angular, React 19 y Tailwind CSS.',
  },
  {
    id: 'pill-gemini-38',
    label: 'Gemini 3.8 · 2M Contexto',
    sublabel: '178 tokens/seg',
    modelVersion: 'Gemini 3.8',
    skillTag: '#modern-web-guidance',
    topPercent: '23%',
    leftPercent: '8%',
    brandIcon: <GeminiBrandIcon className="h-6 w-6 shrink-0" />,
    description:
      'Descompresión e inspección completa de paquetes .RAR en memoria con traducción instantánea 1-clic.',
  },
  {
    id: 'pill-sonnet-55',
    label: 'Claude Sonnet 5.5 · UI Code',
    sublabel: 'React 19 & Tailwind',
    modelVersion: 'Sonnet 5.5',
    skillTag: '#ui-ux-pro-max',
    topPercent: '27%',
    leftPercent: '51%',
    brandIcon: <ReactBrandIcon className="h-6 w-6 shrink-0" />,
    description:
      'Ingeniería frontend impecable con menús accesibles, micro-interacciones y cristal esmerilado.',
  },
  {
    id: 'pill-opus-48',
    label: 'Claude Opus 4.8 · Spring Boot',
    sublabel: 'Auditoría Backend',
    modelVersion: 'Opus 4.8',
    skillTag: '#google-antigravity-sdk',
    topPercent: '42%',
    leftPercent: '16%',
    brandIcon: <SpringBootBrandIcon className="h-6 w-6 shrink-0" />,
    description:
      'Estabilidad ortogonal en microservicios Spring Boot, contratos TypeScript y árboles .RAR.',
  },
  {
    id: 'pill-gpt-astra',
    label: 'GPT Astra · UI/UX Pro Max',
    sublabel: 'Síntesis Futurista',
    modelVersion: 'GPT Astra',
    skillTag: '#ui-ux-pro-max',
    topPercent: '47%',
    leftPercent: '57%',
    brandIcon: <GPTBrandIcon className="h-6 w-6 shrink-0" />,
    description:
      'Composición visual de alto impacto ejecutivo con indicadores energéticos y telemetría.',
  },
  {
    id: 'pill-gpt-luna',
    label: 'GPT Luna · Tailwind Nocturno',
    sublabel: 'Atmósfera Lunar',
    modelVersion: 'GPT Luna',
    skillTag: '#modern-web-guidance',
    topPercent: '61%',
    leftPercent: '11%',
    brandIcon: <TailwindBrandIcon className="h-6 w-6 shrink-0" />,
    description:
      'Calibración lumínica descansada sobre Azul Noche (#0A0F1D) con dictado de voz en español.',
  },
  {
    id: 'pill-gemini-37',
    label: 'Gemini 3.7 · TypeScript Core',
    sublabel: 'Baja Latencia',
    modelVersion: 'Gemini 3.7',
    skillTag: '#ui-ux-pro-max',
    topPercent: '66%',
    leftPercent: '53%',
    brandIcon: <TypeScriptBrandIcon className="h-6 w-6 shrink-0" />,
    description:
      'Control de acceso diferenciado entre Modo Visitante (lectura) y Modo Colaborador (edición .RAR).',
  },
];

interface ComputerDockIconItem {
  id: string;
  name: string;
  subtitle: string;
  modelToSelect?: SpecificModelVersion;
  isCenterEmblem?: boolean;
  iconElement: React.ReactNode;
}

const COMPUTER_DOCK_ICONS: ComputerDockIconItem[] = [
  {
    id: 'dock-angular',
    name: 'Angular',
    subtitle: 'Framework Frecuente',
    modelToSelect: 'Sonnet 5.5',
    iconElement: <AngularBrandIcon className="h-8 w-8" />,
  },
  {
    id: 'dock-claude',
    name: 'Claude Opus 5.5',
    subtitle: 'Anthropic IA',
    modelToSelect: 'Opus 5.5',
    iconElement: <ClaudeBrandIcon className="h-8 w-8" />,
  },
  {
    id: 'dock-gemini',
    name: 'Gemini 3.8',
    subtitle: 'Google DeepMind',
    modelToSelect: 'Gemini 3.8',
    iconElement: <GeminiBrandIcon className="h-8 w-8" />,
  },
  {
    id: 'dock-center-codice',
    name: 'Códice Studio',
    subtitle: 'Núcleo Central IA',
    modelToSelect: 'Opus 5.5',
    isCenterEmblem: true,
    iconElement: (
      <svg viewBox="0 0 36 26" className="h-8 w-11 fill-white" aria-hidden="true">
        <path d="M3 4h6.8l4.4 12.2L18.8 4h5.8l-7.2 18h-6.2L3 4zm19.5 0H29.5l-7.2 18h-6L22.5 4z" />
      </svg>
    ),
  },
  {
    id: 'dock-gpt',
    name: 'GPT Astra & Luna',
    subtitle: 'OpenAI Next-Gen',
    modelToSelect: 'GPT Astra',
    iconElement: <GPTBrandIcon className="h-8 w-8" />,
  },
  {
    id: 'dock-springboot',
    name: 'Spring Boot',
    subtitle: 'Framework Frecuente',
    modelToSelect: 'Opus 4.8',
    iconElement: <SpringBootBrandIcon className="h-8 w-8" />,
  },
  {
    id: 'dock-tailwind',
    name: 'Tailwind CSS',
    subtitle: 'Diseño Nocturno',
    modelToSelect: 'GPT Luna',
    iconElement: <TailwindBrandIcon className="h-8 w-8" />,
  },
];

export const ComputerLightBeamShowcase: React.FC<
  ComputerLightBeamShowcaseProps
> = ({ activeModel, onSelectModel, onNavigatePage }) => {
  const [selectedPill, setSelectedPill] = useState<FloatingBeamPill>(
    FLOATING_BEAM_PILLS[0]
  );

  return (
    <div
      style={{ transform: 'translateZ(0)' }}
      className="relative rounded-3xl border border-white/15 bg-[#060913] overflow-hidden shadow-[0_25px_90px_-15px_rgba(255,107,0,0.32)]"
    >
      {/* ====================================================================
          BARRA SUPERIOR DE VENTANA ESTILO "WOPE" / STUDIO BROWSER
          (Con semáforo macOS, URL de la aplicación y pestañas con Iconos de IAs y Frameworks)
         ==================================================================== */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#0B0F1C]/95 backdrop-blur-xl px-4 py-2.5">
        {/* Semáforo de ventana + Controles de navegación */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#FF5F56]" />
            <span className="h-3 w-3 rounded-full bg-[#FFBD2E]" />
            <span className="h-3 w-3 rounded-full bg-[#27C93F]" />
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-slate-500 border-l border-white/10 pl-3">
            <PanelLeft className="h-3.5 w-3.5 text-slate-400" />
            <ChevronLeft className="h-3.5 w-3.5" />
            <ChevronRight className="h-3.5 w-3.5" />
          </div>

          {/* Pestaña Activa Principal */}
          <div className="hidden md:inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#131B2E] px-2.5 py-1 text-[11px] font-bold text-white">
            <Sparkles className="h-3 w-3 text-[#0EA5E9]" />
            <span>Estación IA · {activeModel}</span>
          </div>
        </div>

        {/* Barra de Dirección Central (Inspirada en app.wope.com de la imagen de referencia) */}
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#070A14] px-4 py-1 text-[11px] font-mono text-slate-300 shadow-inner min-w-[220px] sm:min-w-[300px] justify-center">
          <Globe className="h-3 w-3 text-[#0EA5E9]" />
          <span className="truncate">
            app.codice-studio.ai/ingenieria/{activeModel.toLowerCase().replace(/\s+/g, '-')}
          </span>
        </div>

        {/* Pestañas derechas con los Iconos Oficiales de las IAs y Frameworks */}
        <div className="hidden xl:flex items-center gap-1.5">
          {[
            {
              label: 'Claude 5.5',
              version: 'Opus 5.5' as SpecificModelVersion,
              icon: <ClaudeBrandIcon className="h-3.5 w-3.5" />,
            },
            {
              label: 'Gemini 3.8',
              version: 'Gemini 3.8' as SpecificModelVersion,
              icon: <GeminiBrandIcon className="h-3.5 w-3.5" />,
            },
            {
              label: 'GPT Astra',
              version: 'GPT Astra' as SpecificModelVersion,
              icon: <GPTBrandIcon className="h-3.5 w-3.5" />,
            },
            {
              label: 'Angular',
              version: 'Sonnet 5.5' as SpecificModelVersion,
              icon: <AngularBrandIcon className="h-3.5 w-3.5" />,
            },
          ].map((tab) => {
            const active = activeModel === tab.version;
            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => onSelectModel(tab.version)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-bold transition cursor-pointer border ${
                  active
                    ? 'border-[#0EA5E9]/60 bg-[#0EA5E9]/15 text-white'
                    : 'border-white/5 bg-[#111728]/80 text-slate-400 hover:text-white'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
          <span className="p-1 text-slate-500">
            <Plus className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>

      {/* ====================================================================
          ESCENA PRINCIPAL EN EL LUGAR DEL DASHBOARD:
          LAPTOP DE INGENIERÍA DE FONDO + HACES DE LUZ DIFUMINADOS +
          PÍLDORAS FLOTANTES CON ICONOS + DOCK INFERIOR DE ICONOS DE IAS Y FRAMEWORKS
         ==================================================================== */}
      <div className="relative h-[510px] sm:h-[560px] w-full overflow-hidden select-none">
        {/* 1. IMAGEN GENERADA DE LAPTOP DE INGENIERÍA CON HOLOGRAMAS Y ESQUEMAS EN EL FONDO */}
        <img
          src="/engineering-laptop-hero.jpg"
          alt="Laptop de ingeniería de software proyectando esquemas holográficos y haces de luz en azul noche y naranja"
          width={1280}
          height={720}
          className="absolute inset-0 h-full w-full object-cover object-center opacity-85 scale-105 transition-transform duration-700"
        />

        {/* Velo radial para fundir los bordes y resaltar tanto la laptop como las píldoras flotantes */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 68%, rgba(255, 107, 0, 0.15) 0%, rgba(10, 15, 29, 0.42) 55%, rgba(6, 9, 19, 0.90) 100%)',
          }}
        />

        {/* 2. HACES DE LUZ VOLUMÉTRICOS DIFUMINADOS ADICIONALES */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div
            className="absolute -top-24 left-[22%] h-[120%] w-52 origin-bottom -rotate-[20deg] blur-2xl opacity-55"
            style={{
              background:
                'linear-gradient(180deg, rgba(167, 139, 250, 0.35) 0%, rgba(139, 92, 246, 0.22) 50%, rgba(255, 107, 0, 0.35) 92%, transparent 100%)',
              transform: 'translate3d(0, 0, 0)',
              willChange: 'transform',
            }}
          />
          <div
            className="absolute -top-20 left-[45%] h-[115%] w-48 origin-bottom -rotate-[10deg] blur-2xl opacity-60"
            style={{
              background:
                'linear-gradient(180deg, rgba(56, 189, 248, 0.22) 0%, rgba(255, 107, 0, 0.38) 90%, transparent 100%)',
              transform: 'translate3d(0, 0, 0)',
              willChange: 'transform',
            }}
          />
        </div>

        {/* 3. PÍLDORAS FLOTANTES DE CRISTAL CON LOS ICONOS OFICIALES DE LAS IAS Y FRAMEWORKS */}
        <div className="relative z-10 h-[390px] sm:h-[430px] w-full max-w-5xl mx-auto px-4">
          {FLOATING_BEAM_PILLS.map((pill) => {
            const isSelected = selectedPill.id === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => {
                  setSelectedPill(pill);
                  onSelectModel(pill.modelVersion);
                }}
                style={{
                  top: pill.topPercent,
                  left: pill.leftPercent,
                }}
                className={`group absolute inline-flex items-center gap-3 rounded-full pl-3 pr-5 py-2 text-xs font-bold backdrop-blur-md transition-all duration-300 cursor-pointer ${
                  isSelected
                    ? 'bg-[#0F172A]/95 border-2 border-[#0EA5E9] text-white shadow-xl shadow-[#0EA5E9]/40 scale-105 z-20'
                    : 'bg-[#0B0F19]/80 hover:bg-[#0F172A]/95 border border-white/20 text-slate-100 hover:border-[#0EA5E9]/70 hover:scale-105 shadow-lg'
                }`}
              >
                {pill.brandIcon}
                <div className="text-left leading-tight">
                  <span className="block text-[11px] sm:text-xs font-extrabold tracking-tight text-white">
                    {pill.label}
                  </span>
                  <span className="hidden sm:block text-[10px] font-mono text-slate-300">
                    {pill.sublabel} · {pill.skillTag}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* 4. BASE INFERIOR DE LA COMPUTADORA CON HORIZONTE NARANJA DIFUMINADO Y FILA DE ICONOS DE IAS Y FRAMEWORKS */}
        <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center">
          {/* Resplandor Naranja Difuminado en el borde superior de la base */}
          <div
            aria-hidden="true"
            className="h-6 w-[84%] max-w-4xl rounded-full bg-gradient-to-r from-transparent via-[#0EA5E9] to-transparent blur-md opacity-95 -mb-2.5"
          />
          <div
            aria-hidden="true"
            className="h-[2px] w-[88%] max-w-5xl bg-gradient-to-r from-transparent via-[#38BDF8] to-transparent shadow-lg shadow-[#0EA5E9]"
          />

          {/* Dock de la Computadora con los Iconos Oficiales de Claude, Gemini, GPT, Angular, Spring Boot y Tailwind */}
          <div className="w-[96%] max-w-5xl rounded-t-2xl border-t border-x border-white/15 bg-gradient-to-b from-[#0D1224]/95 to-[#060913]/98 px-3 sm:px-8 py-3.5 shadow-2xl backdrop-blur-xl">
            <div
              role="toolbar"
              aria-label="Iconos de inteligencias artificiales y frameworks integrados en la computadora"
              className="flex items-center justify-around gap-2 sm:gap-5"
            >
              {COMPUTER_DOCK_ICONS.map((dockIcon) => {
                const isActive =
                  dockIcon.modelToSelect === activeModel &&
                  !dockIcon.isCenterEmblem;
                return (
                  <button
                    key={dockIcon.id}
                    type="button"
                    onClick={() => {
                      if (dockIcon.modelToSelect) {
                        onSelectModel(dockIcon.modelToSelect);
                      }
                      const matchingPill = FLOATING_BEAM_PILLS.find(
                        (p) => p.modelVersion === dockIcon.modelToSelect
                      );
                      if (matchingPill) setSelectedPill(matchingPill);
                    }}
                    title={`${dockIcon.name} — ${dockIcon.subtitle}`}
                    className={`group flex flex-col items-center gap-1.5 transition duration-200 cursor-pointer ${
                      dockIcon.isCenterEmblem
                        ? 'scale-105 px-4 py-1.5 rounded-2xl bg-white/[0.07] border border-[#0EA5E9]/55 shadow-lg shadow-[#0EA5E9]/30'
                        : isActive
                        ? 'px-3 py-1 rounded-xl bg-white/[0.08] border border-[#0EA5E9]/60 shadow-md'
                        : 'px-2.5 py-1 rounded-xl hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center justify-center transition transform group-hover:scale-110">
                      {dockIcon.iconElement}
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold tracking-tight whitespace-nowrap ${
                        dockIcon.isCenterEmblem
                          ? 'text-[#38BDF8]'
                          : isActive
                          ? 'text-white'
                          : 'text-slate-400 group-hover:text-white'
                      }`}
                    >
                      {dockIcon.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Barra Inferior de Detalle del Elemento Activo */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/90 bg-[#0B0F19] px-5 py-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
          <span className="inline-flex items-center gap-1 rounded-lg bg-[#0EA5E9]/20 border border-[#0EA5E9]/45 px-2.5 py-1 font-mono text-[10px] font-extrabold text-[#38BDF8]">
            <Cpu className="h-3 w-3" />
            {selectedPill.modelVersion}
          </span>
          <span className="font-bold text-white truncate">
            {selectedPill.label}:
          </span>
          <span className="text-slate-300 truncate">
            {selectedPill.description}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onNavigatePage('preview')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-[#0F172A] px-3 py-1.5 text-[11px] font-bold text-slate-200 hover:border-[#0EA5E9] hover:text-white transition cursor-pointer"
          >
            <Laptop className="h-3.5 w-3.5 text-[#0EA5E9]" />
            <span>Forja UI/UX</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigatePage('modelos-ia')}
            className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8] px-3 py-1.5 text-[11px] font-extrabold text-black transition hover:brightness-110 cursor-pointer"
          >
            <span>Cortex IA</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
