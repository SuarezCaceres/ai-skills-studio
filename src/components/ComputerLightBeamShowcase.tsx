import React, { useState } from 'react';
import { AppPageRoute } from '../types/workspace';
import {
  FileCode,
  ShieldCheck,
  Globe,
  Layers,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface ComputerLightBeamShowcaseProps {
  onNavigatePage: (page: AppPageRoute) => void;
}

interface CodePreviewRow {
  num: string;
  type: 'info' | 'context' | 'del' | 'add';
  text: string;
}

interface StudioFlowSlide {
  id: 'catalogo' | 'explorar' | 'componentes' | 'codice';
  route: AppPageRoute;
  shortLabel: string;
  badgeText: string;
  accentColor: string;
  glowShadow: string;
  beamGradient: string;
  activeFile: string;
  metricPrimary: string;
  metricSecondary: string;
  metricContext: string;
  statusTag: string;
  specialty: string;
  moduleApplied: string;
  ctaLabel: string;
  codeLines: CodePreviewRow[];
  summaryLine: string;
  Icon: React.FC<{ className?: string; style?: React.CSSProperties }>;
}

const STUDIO_FLOW_SLIDES: StudioFlowSlide[] = [
  {
    id: 'catalogo',
    route: 'boveda',
    shortLabel: 'Catálogo + Inspector',
    badgeText: 'commitSha',
    accentColor: '#0ea5e9',
    glowShadow: 'rgba(14, 165, 233, 0.40)',
    beamGradient:
      'linear-gradient(180deg, rgba(14, 165, 233, 0.42) 0%, rgba(56, 189, 248, 0.16) 50%, transparent 100%)',
    activeFile: 'src/components/catalog/FilesPanel.tsx',
    metricPrimary: 'commitSha fijado',
    metricSecondary: '512 KB máx',
    metricContext: 'Texto inerte',
    statusTag: 'AuditBadge activo',
    specialty: 'Descarga bajo demanda fijada a commitSha y re-auditoría de scripts',
    moduleApplied: 'catalogo-commit-sha',
    ctaLabel: 'Abrir en Catálogo',
    Icon: ShieldCheck,
    codeLines: [
      { num: '01', type: 'info', text: '@@ Inspección segura por commitSha @@' },
      { num: '02', type: 'context', text: 'const content = await getSkillFileContent(skill.id, path);' },
      { num: '03', type: 'add', text: '+ const audit = auditSkillContent(mergedFiles);' },
      { num: '04', type: 'add', text: '+ assertSafeRelativePath(path) && bytes <= 524_288;' },
      { num: '05', type: 'add', text: '+ renderPlainTextWithCopy(content, commitSha);' },
      { num: '06', type: 'context', text: 'return <AuditBadge findings={audit.findings} />;' },
    ],
    summaryLine: 'Lee cada archivo real desde su commitSha exacto antes de instalar',
  },
  {
    id: 'explorar',
    route: 'skills-sh',
    shortLabel: 'Explorar skills.sh',
    badgeText: 'Vista previa',
    accentColor: '#38bdf8',
    glowShadow: 'rgba(56, 189, 248, 0.38)',
    beamGradient:
      'linear-gradient(180deg, rgba(56, 189, 248, 0.40) 0%, rgba(14, 165, 233, 0.15) 50%, transparent 100%)',
    activeFile: 'src/components/skills-sh/SkillsShPage.tsx',
    metricPrimary: 'GitHub en vivo',
    metricSecondary: 'Solo lectura',
    metricContext: 'npx + Importar',
    statusTag: 'Inspección unificada',
    specialty: 'Vista previa completa en SkillDetailPage sin copias locales',
    moduleApplied: 'explorar-skills-sh',
    ctaLabel: 'Ir a Explorar',
    Icon: Globe,
    codeLines: [
      { num: '01', type: 'info', text: '@@ Explorar → Detalle en modo vista previa @@' },
      { num: '02', type: 'context', text: 'const resolved = await inspectGithubSkillByHint(source, id);' },
      { num: '03', type: 'add', text: '+ openPreviewDetail(resolved.skill, { readOnly: true });' },
      { num: '04', type: 'add', text: '+ showTranslateEs() && showFilesAtSha(resolved.commitSha);' },
      { num: '05', type: 'add', text: '+ onImportToCatalog(() => registerSkillFromUrl(url));' },
      { num: '06', type: 'context', text: '/* Fuentes .well-known conservan su comando npx */' },
    ],
    summaryLine: 'Inspecciona SKILL.md y archivos externos en solo lectura e importa al catálogo',
  },
  {
    id: 'componentes',
    route: 'preview',
    shortLabel: 'Componentes UI',
    badgeText: '20 piezas',
    accentColor: '#10b981',
    glowShadow: 'rgba(16, 185, 129, 0.36)',
    beamGradient:
      'linear-gradient(180deg, rgba(16, 185, 129, 0.38) 0%, rgba(14, 165, 233, 0.15) 50%, transparent 100%)',
    activeFile: 'src/components/ui-kit/Drawer.tsx',
    metricPrimary: 'WCAG AA',
    metricSecondary: 'Teclado 100%',
    metricContext: 'Código real',
    statusTag: 'Kit UI propio',
    specialty: 'Componentes accesibles en vivo, foco controlado y asignación a skills',
    moduleApplied: 'ui-kit-accesible',
    ctaLabel: 'Ver Componentes',
    Icon: Layers,
    codeLines: [
      { num: '01', type: 'info', text: '@@ Kit UI propio con portales y teclado @@' },
      { num: '02', type: 'context', text: 'return createPortal(' },
      { num: '03', type: 'add', text: '+ <div role="dialog" aria-modal="true" onKeyDown={onEsc}>' },
      { num: '04', type: 'add', text: '+   <FocusTrap restoreFocusOnClose>{children}</FocusTrap>' },
      { num: '05', type: 'add', text: '+ </div>,' },
      { num: '06', type: 'context', text: 'document.body );' },
    ],
    summaryLine: 'Prueba 20 componentes accesibles en vivo y copia su código TypeScript',
  },
  {
    id: 'codice',
    route: 'codice-studio',
    shortLabel: 'Códice',
    badgeText: 'Clases',
    accentColor: '#0284c7',
    glowShadow: 'rgba(2, 132, 199, 0.40)',
    beamGradient:
      'linear-gradient(180deg, rgba(2, 132, 199, 0.42) 0%, rgba(56, 189, 248, 0.16) 50%, transparent 100%)',
    activeFile: 'src/components/lessons/LessonEditor.tsx',
    metricPrimary: 'SafeMarkdown',
    metricSecondary: 'Skills equipo',
    metricContext: 'Obsidian',
    statusTag: 'Conocimiento vivo',
    specialty: 'Clases técnicas vinculadas a skills reales del equipo y componentes',
    moduleApplied: 'codice-clases-equipo',
    ctaLabel: 'Abrir Códice',
    Icon: Sparkles,
    codeLines: [
      { num: '01', type: 'info', text: '@@ Clases del equipo vinculadas al catálogo @@' },
      { num: '02', type: 'context', text: 'const teamSkills = useSkillOptions(); // solo GitHub equipo' },
      { num: '03', type: 'add', text: '+ <SkillPicker skills={teamSkills} value={draft.skillIds} />' },
      { num: '04', type: 'add', text: '+ <ComponentPicker value={draft.componentIds} />' },
      { num: '05', type: 'add', text: '+ <SafeMarkdown source={draft.bodyMarkdown} />' },
      { num: '06', type: 'context', text: 'exportJson() // respaldo portable y seguro' },
    ],
    summaryLine: 'Documenta aprendizajes técnicos en Markdown saneado y compártelos',
  },
];

const INSPECTOR_TREE_PREVIEW = [
  { name: 'SKILL.md', status: 'SHA' },
  { name: 'FilesPanel.tsx', status: 'ON' },
  { name: 'AuditBadge.tsx', status: 'OK' },
  { name: 'Drawer.tsx', status: 'UI' },
  { name: 'LessonEditor.tsx', status: 'MD' },
];

export const ComputerLightBeamShowcase: React.FC<ComputerLightBeamShowcaseProps> = ({
  onNavigatePage,
}) => {
  const [activeSlideId, setActiveSlideId] = useState<StudioFlowSlide['id']>('catalogo');
  const [hoveredSlide, setHoveredSlide] = useState<StudioFlowSlide | null>(null);
  const [touchIdPulse, setTouchIdPulse] = useState(false);
  const [trackpadRipple, setTrackpadRipple] = useState(false);

  const activeSlide =
    STUDIO_FLOW_SLIDES.find((s) => s.id === activeSlideId) || STUDIO_FLOW_SLIDES[0];
  const displayedSlide = hoveredSlide || activeSlide;

  // Ciclo al siguiente módulo mediante el Touch ID interactivo
  const handleTouchIdClick = () => {
    setTouchIdPulse(true);
    setTimeout(() => setTouchIdPulse(false), 600);

    const currentIndex = STUDIO_FLOW_SLIDES.findIndex((s) => s.id === activeSlide.id);
    const nextIndex = (currentIndex + 1) % STUDIO_FLOW_SLIDES.length;
    setActiveSlideId(STUDIO_FLOW_SLIDES[nextIndex].id);
  };

  const handleTrackpadClick = () => {
    setTrackpadRipple(true);
    setTimeout(() => setTrackpadRipple(false), 500);
  };

  const ActiveIcon = displayedSlide.Icon;

  return (
    <div className="relative w-full max-w-5xl mx-auto py-2 sm:py-3 select-none">
      {/* 1. HAZ DE LUZ VOLUMÉTRICO Y RESPLANDOR DIFUMINADO */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-16 sm:-top-24 h-96 sm:h-[540px] flex justify-center overflow-hidden transition-all duration-700 z-0"
      >
        <div
          className="w-[95%] sm:w-[80%] h-full opacity-70 sm:opacity-85 blur-3xl transition-all duration-700"
          style={{
            background: displayedSlide.beamGradient,
          }}
        />
        <div
          className="absolute top-8 w-60 sm:w-84 h-full blur-2xl opacity-50 transition-all duration-500"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${displayedSlide.accentColor} 0%, transparent 70%)`,
          }}
        />
        <div
          className="absolute top-44 w-[85%] h-72 rounded-full blur-[100px] opacity-35 transition-all duration-700"
          style={{
            backgroundColor: displayedSlide.accentColor,
          }}
        />
      </div>

      {/* 2. SELECTOR DE LOS 4 FLUJOS ACTIVOS DE CÓDICE STUDIO */}
      <div className="relative z-30 mb-2.5 sm:mb-3">
        <div
          className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 px-2"
          role="group"
          aria-label="Flujos interactivos de Códice Studio"
        >
          {STUDIO_FLOW_SLIDES.map((slide) => {
            const isSelected = activeSlide.id === slide.id;
            const isHovered = hoveredSlide?.id === slide.id;
            const SlideIcon = slide.Icon;

            return (
              <button
                key={slide.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setActiveSlideId(slide.id)}
                onMouseEnter={() => setHoveredSlide(slide)}
                onMouseLeave={() => setHoveredSlide(null)}
                className={`group relative flex items-center gap-2.5 sm:gap-3 rounded-2xl px-3.5 sm:px-4.5 py-2 sm:py-2.5 text-xs font-semibold backdrop-blur-xl transition-all duration-300 cursor-pointer border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9] ${
                  isSelected
                    ? 'border-[#0ea5e9]/60 text-white shadow-xl scale-105'
                    : 'border-white/10 text-slate-300 hover:text-white hover:border-white/25'
                }`}
                style={{
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(18,23,34,0.94) 0%, rgba(10,13,20,0.98) 100%)'
                    : 'rgba(12, 17, 28, 0.72)',
                  boxShadow: isSelected
                    ? `0 0 24px -2px ${slide.glowShadow}, 0 8px 24px -6px rgba(0,0,0,0.8)`
                    : isHovered
                      ? `0 0 16px -3px ${slide.glowShadow}`
                      : 'none',
                }}
              >
                <div
                  className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-[#0a0d14] transition-transform duration-300 group-hover:scale-110"
                  style={{ color: slide.accentColor }}
                >
                  <SlideIcon className="h-4 w-4" aria-hidden="true" />
                </div>

                <div className="text-left flex flex-col">
                  <span className="font-bold tracking-tight text-white text-xs sm:text-[13px] leading-tight">
                    {slide.shortLabel}
                  </span>
                  <span className="font-mono text-[9.5px] sm:text-[10px] text-slate-400">
                    {slide.badgeText}
                  </span>
                </div>

                {isSelected && (
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-[1px] inset-x-4 h-[2px] rounded-full blur-[0.5px]"
                    style={{ backgroundColor: slide.accentColor }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. FICHA FLOTANTE DE ESTADO DEL FLUJO */}
      <div className="relative z-20 mb-2 sm:mb-3 flex justify-center px-4">
        <div
          className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 w-full max-w-4xl rounded-xl border border-white/10 bg-[#0c111a]/90 backdrop-blur-md px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs font-mono text-slate-300 shadow-xl transition-all duration-300"
          style={{
            borderLeftColor: displayedSlide.accentColor,
            borderLeftWidth: '3px',
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-bold tracking-tight text-white flex items-center gap-1.5 shrink-0">
              <ActiveIcon
                className="h-3.5 w-3.5"
                style={{ color: displayedSlide.accentColor }}
              />
              <span>{displayedSlide.shortLabel}</span>
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400 truncate max-w-xs sm:max-w-md text-[11px]">
              {displayedSlide.specialty}
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 text-[11px] ml-auto shrink-0">
            <span className="flex items-center gap-1">
              <Lock className="h-3 w-3 text-[#0ea5e9]" aria-hidden="true" />
              <strong className="text-white">{displayedSlide.metricPrimary}</strong>
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" aria-hidden="true" />
              <span>{displayedSlide.metricSecondary}</span>
            </span>
            <span className="hidden md:flex items-center gap-1 text-slate-400">
              <Layers className="h-3 w-3 text-[#38bdf8]" aria-hidden="true" />
              <span>{displayedSlide.metricContext}</span>
            </span>
            <span
              className="px-2 py-0.5 rounded font-bold text-[10px]"
              style={{
                backgroundColor: 'rgba(14, 165, 233, 0.16)',
                color: '#38bdf8',
              }}
            >
              {displayedSlide.statusTag}
            </span>
          </div>
        </div>
      </div>

      {/* 4. MACBOOK PRO SPACE BLACK CON PANTALLA OLED INTERACTIVA */}
      <div className="relative z-10 mx-auto w-full max-w-4xl px-2">
        <div className="relative w-full aspect-[856/660]">
          <img
            src={`${import.meta.env.BASE_URL}macbook-pro-tight.jpg`}
            alt="MacBook Pro mostrando el inspector de skills y módulos de Códice Studio"
            className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
            style={{
              maskImage:
                'radial-gradient(ellipse 94% 90% at 50% 50%, black 72%, transparent 100%)',
              WebkitMaskImage:
                'radial-gradient(ellipse 94% 90% at 50% 50%, black 72%, transparent 100%)',
            }}
            loading="eager"
          />

          {/* 4A. PANTALLA OLED INTERACTIVA */}
          <div
            className="absolute left-[15.2%] w-[69.6%] top-[6.2%] h-[55.0%] rounded-t-lg overflow-hidden flex flex-col bg-[#070b14]/95 text-slate-200 z-10 border border-white/10 shadow-[inset_0_0_24px_rgba(0,0,0,0.9)]"
            style={{
              boxShadow: `inset 0 0 20px ${displayedSlide.glowShadow}, inset 0 0 40px rgba(0,0,0,0.95)`,
            }}
          >
            {/* Barra Superior */}
            <div className="flex items-center justify-between gap-1.5 border-b border-white/10 bg-[#090e18] px-2.5 sm:px-3 py-1 text-[10px] sm:text-[11px] shrink-0">
              <div className="flex items-center gap-1.5 shrink-0" aria-hidden="true">
                <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-slate-600" />
                <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-slate-500" />
                <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-[#0ea5e9]" />
              </div>

              <div className="flex items-center gap-1.5 min-w-0 font-mono text-[9px] sm:text-[10.5px] text-slate-300 truncate">
                <FileCode
                  className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0"
                  style={{ color: displayedSlide.accentColor }}
                  aria-hidden="true"
                />
                <span className="hidden md:inline font-semibold text-white">
                  codice-studio
                </span>
                <span className="hidden md:inline text-slate-500">/</span>
                <span className="text-white font-medium truncate">
                  {displayedSlide.activeFile.split('/').pop()}
                </span>
              </div>

              <div className="flex items-center gap-1 font-mono text-[8.5px] sm:text-[9.5px] text-emerald-400 shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="hidden sm:inline">commitSha verificado</span>
                <span className="sm:hidden">commitSha</span>
              </div>
            </div>

            {/* Viewport Interior: Archivos de la skill + Vista de código */}
            <div className="flex-1 min-h-0 flex flex-col md:flex-row font-mono text-xs overflow-hidden">
              <div className="hidden md:block w-36 lg:w-40 shrink-0 border-r border-white/10 bg-[#060a12]/90 p-2 overflow-y-auto">
                <div className="mb-1 flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Archivos</span>
                  <span className="text-[#38bdf8] font-mono">5 items</span>
                </div>
                <div className="space-y-0.5">
                  {INSPECTOR_TREE_PREVIEW.map((item) => {
                    const isSelected = displayedSlide.activeFile.endsWith(item.name);
                    return (
                      <div
                        key={item.name}
                        className={`flex items-center justify-between rounded px-1.5 py-0.5 text-[9px] transition-colors ${
                          isSelected
                            ? 'bg-white/10 text-white font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                        style={{
                          borderLeft: isSelected
                            ? `2px solid ${displayedSlide.accentColor}`
                            : '2px solid transparent',
                        }}
                      >
                        <span className="truncate">{item.name}</span>
                        <span
                          className={`text-[7.5px] px-1 rounded font-bold ${
                            item.status === 'OK'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : item.status === 'ON' || item.status === 'SHA'
                                ? 'bg-[#0ea5e9]/20 text-[#38bdf8]'
                                : 'bg-slate-700/40 text-slate-300'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex-1 min-w-0 p-2 sm:p-2.5 flex flex-col justify-between overflow-hidden bg-[#050810]/80">
                <div className="overflow-hidden">
                  <div className="flex items-center justify-between border-b border-white/10 pb-1 mb-1 text-[9px] sm:text-[10px]">
                    <span className="text-slate-400 truncate">
                      módulo:{' '}
                      <strong className="text-white font-mono">
                        {displayedSlide.moduleApplied}
                      </strong>
                    </span>
                    <span className="text-emerald-400 font-bold text-[8.5px] sm:text-[9.5px] shrink-0">
                      Solo lectura · Seguro
                    </span>
                  </div>

                  <div className="space-y-0.5 font-mono text-[9px] sm:text-[10px] md:text-[10.5px] leading-tight">
                    {displayedSlide.codeLines.map((line, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded truncate ${
                          line.type === 'del'
                            ? 'bg-rose-950/40 text-rose-300 border-l-2 border-rose-500'
                            : line.type === 'add'
                              ? 'bg-emerald-950/40 text-emerald-300 border-l-2 border-emerald-500'
                              : line.type === 'info'
                                ? 'bg-sky-950/30 text-sky-300'
                                : 'text-slate-400'
                        }`}
                      >
                        <span className="w-3 select-none text-[8px] sm:text-[8.5px] text-slate-600 font-mono text-right shrink-0">
                          {line.num}
                        </span>
                        <span className="truncate">{line.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-1 pt-1 border-t border-white/10 flex items-center justify-between text-[8.5px] sm:text-[9.5px] text-slate-400 shrink-0">
                  <span className="truncate max-w-[65%]">
                    {displayedSlide.summaryLine}
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigatePage(displayedSlide.route)}
                    className="flex items-center gap-1 text-[#38bdf8] hover:text-white font-semibold cursor-pointer shrink-0 ml-1 focus-visible:outline-2 focus-visible:outline-[#0ea5e9]"
                  >
                    <span>{displayedSlide.ctaLabel}</span>
                    <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 4B. HOTSPOT INTERACTIVO DE TOUCH ID EN EL TECLADO */}
          <button
            type="button"
            onClick={handleTouchIdClick}
            title="Touch ID: Clic para cambiar de módulo"
            aria-label="Touch ID: cambiar al siguiente flujo del estudio"
            className="absolute left-[67.6%] top-[65.4%] w-[3.0%] h-[2.5%] rounded-[2px] cursor-pointer z-20 group transition-all bg-transparent border-0 p-0 focus-visible:outline-2 focus-visible:outline-[#0ea5e9]"
          >
            <span
              className={`absolute inset-0 rounded-[2px] transition-all duration-300 pointer-events-none ${
                touchIdPulse
                  ? 'ring-2 ring-white/90 scale-125 opacity-100'
                  : 'group-hover:ring-1 group-hover:ring-white/40 opacity-0 group-hover:opacity-100'
              }`}
              style={{
                boxShadow: touchIdPulse
                  ? `0 0 14px ${displayedSlide.accentColor}`
                  : undefined,
              }}
            />
          </button>

          {/* 4C. HOTSPOT INTERACTIVO DEL TRACKPAD */}
          <button
            type="button"
            onClick={handleTrackpadClick}
            title="Force Touch Trackpad: Clic para respuesta háptica"
            aria-label="Trackpad interactivo"
            className="absolute left-[35.5%] top-[78.0%] w-[29.0%] h-[18.0%] rounded-lg cursor-pointer z-20 group overflow-hidden bg-transparent border-0 p-0 focus-visible:outline-2 focus-visible:outline-[#0ea5e9]"
          >
            {trackpadRipple && (
              <span className="absolute inset-0 bg-white/10 rounded-lg animate-ping opacity-60 pointer-events-none" />
            )}
            <span className="absolute inset-0 rounded-lg border border-transparent group-hover:border-white/20 group-hover:bg-white/[0.03] transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
};
