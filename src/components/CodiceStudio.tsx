import React from 'react';
import { Sparkles } from 'lucide-react';
import { LessonsSection } from './lessons/LessonsSection';

interface CodiceStudioProps {
  /** Clase abierta en Códice (la guarda `App`). */
  openLessonId?: string | null;
  onOpenLesson?: (id: string | null) => void;
  onOpenSkill?: (id: string) => void;
  onOpenComponent?: (id: string) => void;
  onRequestLogin?: () => void;
}

export const CodiceStudio: React.FC<CodiceStudioProps> = ({
  openLessonId = null,
  onOpenLesson = () => undefined,
  onOpenSkill = () => undefined,
  onOpenComponent = () => undefined,
  onRequestLogin = () => undefined,
}) => {
  return (
    <div className="relative min-h-screen w-full bg-[#030712] text-[#94A3B8] font-sans antialiased selection:bg-[#0EA5E9] selection:text-white overflow-x-hidden">
      {/* Atmósfera: luz cian/pizarra difuminada y cuadrícula sutil */}
      <div
        className="pointer-events-none fixed -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-sky-900/15 via-slate-900/10 to-transparent blur-[140px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed -bottom-40 -right-40 h-[650px] w-[650px] rounded-full bg-gradient-to-tl from-sky-900/15 via-slate-950/20 to-transparent blur-[150px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[800px] rounded-full bg-slate-900/20 blur-[160px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.035] bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#0A0D14]/85 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-[#121722] border border-sky-500/40">
                <Sparkles aria-hidden="true" className="w-4 h-4 text-sky-400" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#0EA5E9]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base tracking-tight text-[#FFFFFF]">Códice</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-mono font-medium tracking-wide bg-slate-900 border border-slate-700 text-sky-300">
                    STUDIO
                  </span>
                </div>
                <p className="text-[10px] text-[#94A3B8]/70 hidden sm:block tracking-wider uppercase">
                  Clases del equipo
                </p>
              </div>
            </div>
          </div>
        </header>

        <section aria-label="Clases del equipo" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LessonsSection
            openLessonId={openLessonId}
            onOpenLesson={onOpenLesson}
            onOpenSkill={onOpenSkill}
            onOpenComponent={onOpenComponent}
            onRequestLogin={onRequestLogin}
          />
        </section>
      </div>
    </div>
  );
};

export default CodiceStudio;
