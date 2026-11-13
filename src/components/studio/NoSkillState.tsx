import { FolderOpen } from 'lucide-react';

interface NoSkillStateProps {
  /** Nombre del módulo, por ejemplo "Componentes". */
  module: string;
  /** Qué hace el módulo con una skill. */
  description: string;
  onGoToTeam: () => void;
}

/** Estado vacío de los módulos que necesitan una skill del equipo abierta en el estudio. */
export function NoSkillState({ module, description, onGoToTeam }: NoSkillStateProps) {
  return (
    <section
      aria-labelledby="no-skill-heading"
      className="mx-auto my-12 flex max-w-xl flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-700 bg-[#121722] p-10 text-center"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 bg-[#0a0d14] text-[#38bdf8]">
        <FolderOpen className="h-5 w-5" aria-hidden="true" />
      </span>
      <h1 id="no-skill-heading" className="m-0 text-xl font-bold text-white">
        {module} necesita una skill
      </h1>
      <p className="m-0 text-sm leading-relaxed text-slate-400">{description}</p>
      <p className="m-0 text-sm text-slate-400">
        Elige una skill del equipo y pulsa <strong className="text-white">Abrir en estudio</strong> para traer una
        copia de trabajo a tu navegador.
      </p>
      <button
        type="button"
        onClick={onGoToTeam}
        className="mt-2 inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border-0 bg-[#0ea5e9] px-5 text-sm font-semibold text-[#0a0d14] transition hover:bg-[#38bdf8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]"
      >
        Ver skills del equipo
      </button>
    </section>
  );
}

export default NoSkillState;
