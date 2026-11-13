import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { CatalogSkill } from '../../types/catalog';
import type { ComponentAssignment, UiComponentEntry } from '../../types/uiComponents';
import { AI_BENCHMARK_MODELS } from '../../data/aiModelsData';
import { MAX_ASSIGNED_IDS, MAX_NOTE_LENGTH, type AssignmentInput } from '../../services/componentAssignments';
import { PersonAvatar } from '../catalog/PersonAvatar';
import { Drawer } from '../ui-kit/Drawer';

export type SkillsStatus = 'loading' | 'error' | 'ready';

interface AssignDrawerProps {
  entry: UiComponentEntry;
  assignment?: ComponentAssignment;
  /** Skills del equipo disponibles para elegir. */
  skills: CatalogSkill[];
  skillsStatus: SkillsStatus;
  onSave: (input: AssignmentInput) => void;
  onClose: () => void;
}

const BUTTON =
  'inline-flex h-9 cursor-pointer items-center rounded-full px-4 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]';

function toggle(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

/**
 * Panel para asignar skills del equipo y modelos de IA a un componente, con casillas de verificación.
 * Reutiliza el `Drawer` del propio kit (modal, foco atrapado, Escape cierra).
 */
export function AssignDrawer({ entry, assignment, skills, skillsStatus, onSave, onClose }: AssignDrawerProps) {
  const [skillIds, setSkillIds] = useState<string[]>(assignment?.skillIds ?? []);
  const [modelIds, setModelIds] = useState<string[]>(assignment?.modelIds ?? []);
  const [note, setNote] = useState(assignment?.note ?? '');
  const [query, setQuery] = useState('');

  // Skills ya asignadas que ya no están en el catálogo: se muestran para poder quitarlas.
  const missing = useMemo(
    () => (assignment?.skillIds ?? []).filter((id) => !skills.some((s) => s.id === id)),
    [assignment, skills]
  );

  const visibleSkills = useMemo(() => {
    const q = query.trim().toLowerCase();
    return skills.filter((s) => !q || s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
  }, [skills, query]);

  const tooMany = skillIds.length > MAX_ASSIGNED_IDS || modelIds.length > MAX_ASSIGNED_IDS;
  const changed =
    JSON.stringify([skillIds.slice().sort(), modelIds.slice().sort(), note.trim()]) !==
    JSON.stringify([(assignment?.skillIds ?? []).slice().sort(), (assignment?.modelIds ?? []).slice().sort(), (assignment?.note ?? '').trim()]);

  return (
    <Drawer
      open
      onClose={onClose}
      title={`Asignar a ${entry.name}`}
      footer={
        <>
          <button type="button" onClick={onClose} className={`${BUTTON} border border-slate-700 bg-transparent text-slate-100 hover:border-[#0ea5e9]`}>
            Cancelar
          </button>
          <button
            type="button"
            disabled={!changed || tooMany}
            onClick={() => onSave({ skillIds, modelIds, note })}
            className={`${BUTTON} border-0 bg-[#0ea5e9] text-[#0a0d14] hover:bg-[#38bdf8] disabled:cursor-not-allowed disabled:opacity-40`}
          >
            Guardar asignación
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <fieldset className="m-0 min-w-0 border-0 p-0">
          <legend className="mb-2 p-0 text-sm font-semibold text-white">Skills del equipo</legend>
          {skillsStatus === 'loading' && <p role="status" className="m-0 text-xs text-slate-500">Cargando las skills del equipo…</p>}
          {skillsStatus === 'error' && (
            <p role="alert" className="m-0 text-xs text-rose-300">
              No se pudieron cargar las skills del equipo. Puedes asignar un modelo y volver a intentarlo más tarde.
            </p>
          )}
          {skillsStatus === 'ready' && skills.length === 0 && missing.length === 0 && (
            <p className="m-0 text-xs text-slate-500">El equipo todavía no ha subido skills.</p>
          )}
          {skills.length > 5 && (
            <div className="relative mb-2">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Buscar skill"
                placeholder="Buscar skill…"
                className="h-9 w-full rounded-lg border border-slate-800 bg-[#0a0d14] pl-9 pr-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#0ea5e9]"
              />
            </div>
          )}
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {visibleSkills.map((skill) => (
              <li key={skill.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-800 bg-[#0a0d14] px-3 py-2 hover:border-slate-600">
                  <input
                    type="checkbox"
                    checked={skillIds.includes(skill.id)}
                    onChange={() => setSkillIds((l) => toggle(l, skill.id))}
                    className="h-4 w-4 shrink-0 accent-[#0ea5e9]"
                  />
                  <PersonAvatar login={skill.uploadedBy.login} avatarUrl={skill.uploadedBy.avatarUrl} size={24} />
                  <span className="min-w-0">
                    <span className="block truncate font-mono text-sm text-white">{skill.name}</span>
                    <span className="block truncate text-[11px] text-slate-500">@{skill.uploadedBy.login}</span>
                  </span>
                </label>
              </li>
            ))}
            {missing.map((id) => (
              <li key={id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-950/20 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={skillIds.includes(id)}
                    onChange={() => setSkillIds((l) => toggle(l, id))}
                    className="h-4 w-4 shrink-0 accent-[#0ea5e9]"
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-mono text-sm text-amber-100">{id.split('/').pop() || id}</span>
                    <span className="block text-[11px] text-amber-300/80">Ya no está en el catálogo</span>
                  </span>
                </label>
              </li>
            ))}
            {skillsStatus === 'ready' && skills.length > 0 && visibleSkills.length === 0 && (
              <li className="text-xs text-slate-500">Ninguna skill coincide con la búsqueda.</li>
            )}
          </ul>
        </fieldset>

        <fieldset className="m-0 min-w-0 border-0 p-0">
          <legend className="mb-2 p-0 text-sm font-semibold text-white">Modelos de IA</legend>
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {AI_BENCHMARK_MODELS.map((model) => (
              <li key={model.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-800 bg-[#0a0d14] px-3 py-2 hover:border-slate-600">
                  <input
                    type="checkbox"
                    checked={modelIds.includes(model.id)}
                    onChange={() => setModelIds((l) => toggle(l, model.id))}
                    className="h-4 w-4 shrink-0 accent-[#0ea5e9]"
                  />
                  <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: model.badgeColor }} />
                  <span className="min-w-0 text-sm text-slate-100">
                    {model.family} <span className="text-slate-500">· {model.version}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>

        <div>
          <label htmlFor="assign-note" className="mb-1.5 block text-sm font-semibold text-white">
            Nota <span className="font-normal text-slate-500">(opcional)</span>
          </label>
          <textarea
            id="assign-note"
            rows={3}
            value={note}
            maxLength={MAX_NOTE_LENGTH}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Por ejemplo: hecho con la skill de diseño y revisado con Opus."
            className="w-full resize-y rounded-lg border border-slate-800 bg-[#0a0d14] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#0ea5e9]"
          />
          <p className="m-0 mt-1 text-right text-[11px] text-slate-500">
            {note.length} de {MAX_NOTE_LENGTH}
          </p>
        </div>

        {tooMany && (
          <p role="alert" className="m-0 text-xs text-rose-300">
            Puedes elegir como máximo {MAX_ASSIGNED_IDS} skills y {MAX_ASSIGNED_IDS} modelos.
          </p>
        )}
      </div>
    </Drawer>
  );
}
