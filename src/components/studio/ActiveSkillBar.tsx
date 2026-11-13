import { ExternalLink, Trash2, Users } from 'lucide-react';
import type { SkillDocument } from '../../types/skill';
import { PersonAvatar } from '../catalog/PersonAvatar';

interface ActiveSkillBarProps {
  /** Copias de trabajo guardadas en este navegador. */
  skills: SkillDocument[];
  /** Copia activa, o `null` si el estudio usa un paquete suelto. */
  activeSkill: SkillDocument | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  /** Abre el detalle de la skill en el catálogo. */
  onOpenDetail: (catalogId: string) => void;
  /** Va a la lista de skills del equipo. */
  onGoToTeam: () => void;
}

const BTN =
  'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-slate-700 bg-transparent px-3 text-xs font-medium text-slate-200 transition hover:border-[#0ea5e9] hover:text-[#38bdf8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]';

/** Barra fija sobre los módulos del estudio: qué skill del equipo se está usando. */
export function ActiveSkillBar({ skills, activeSkill, onSelect, onRemove, onOpenDetail, onGoToTeam }: ActiveSkillBarProps) {
  const origin = activeSkill?.origin;
  return (
    <div
      role="region"
      aria-label="Skill activa del estudio"
      className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-slate-800 bg-[#121722] px-4 py-3"
    >
      {activeSkill && origin ? (
        <>
          <PersonAvatar login={origin.uploadedByLogin} avatarUrl={origin.uploadedByAvatarUrl} size={28} />
          <div className="min-w-0 flex-1">
            <p className="m-0 truncate font-mono text-sm font-semibold text-white">{activeSkill.name}</p>
            <p className="m-0 truncate text-xs text-slate-400">
              Copia de trabajo · subida por{' '}
              <a
                href={origin.uploadedByProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-slate-200 hover:underline"
              >
                @{origin.uploadedByLogin}
              </a>{' '}
              · <span className="font-mono">{origin.repo}</span>
            </p>
          </div>
          {skills.length > 1 && (
            <label className="flex items-center gap-2 text-xs text-slate-400">
              Cambiar
              <select
                value={activeSkill.id}
                onChange={(e) => onSelect(e.target.value)}
                className="h-8 max-w-[220px] rounded-lg border border-slate-800 bg-[#0a0d14] px-2 text-xs text-slate-100 outline-none focus:border-[#0ea5e9]"
              >
                {skills.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button type="button" onClick={() => onOpenDetail(origin.catalogId)} className={BTN}>
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            Ver en el catálogo
          </button>
          <button
            type="button"
            onClick={() => onRemove(activeSkill.id)}
            aria-label={`Quitar la copia de ${activeSkill.name}`}
            className={`${BTN} hover:border-rose-500/60 hover:text-rose-300`}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Quitar copia
          </button>
        </>
      ) : (
        <>
          <Users className="h-4 w-4 shrink-0 text-[#38bdf8]" aria-hidden="true" />
          <p className="m-0 min-w-0 flex-1 text-sm text-slate-300">
            Sin skill abierta. Elige una del equipo y pulsa <strong className="text-white">Abrir en estudio</strong>.
          </p>
          <button type="button" onClick={onGoToTeam} className={BTN}>
            Ver skills del equipo
          </button>
        </>
      )}
    </div>
  );
}

export default ActiveSkillBar;
