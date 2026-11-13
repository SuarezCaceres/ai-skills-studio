import { useEffect, useMemo, useState } from 'react';
import { Boxes } from 'lucide-react';
import { useCatalog } from '../../hooks/useCatalog';
import { isTeamLogin } from '../../config/team';
import type { CatalogSkill } from '../../types/catalog';
import { COMPONENT_REGISTRY, getComponentEntry } from '../../data/componentRegistry';
import { isUnassigned } from './assignmentInfo';
import { AssignDrawer, type SkillsStatus } from './AssignDrawer';
import { ComponentDetail } from './ComponentDetail';
import { ComponentSidebar } from './ComponentSidebar';
import { useAssignments } from './useAssignments';

interface ComponentsPageProps {
  /** Componente elegido (controlado desde `App` para poder abrirlo desde una clase). */
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Abre el detalle de una skill asignada. */
  onOpenSkill: (id: string) => void;
  /** Abre la pantalla de acceso con GitHub (asignar requiere sesión). */
  onRequestLogin: () => void;
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-800 bg-[#121722] px-4 py-3">
      <p className="m-0 font-mono text-[11px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mb-0 mt-1 text-xl font-bold tabular-nums text-white">{value}</p>
    </div>
  );
}

/**
 * Página Componentes: lista lateral para elegir uno del registro y, a la derecha, su detalle
 * (vista previa en vivo, imagen, asignación, código y accesibilidad). No necesita ninguna skill abierta.
 * Ver el contenido es libre; asignar skills o modelos requiere sesión de GitHub.
 */
export function ComponentsPage({ selectedId, onSelect, onOpenSkill, onRequestLogin }: ComponentsPageProps) {
  const entries = COMPONENT_REGISTRY;
  const selected = getComponentEntry(selectedId) ?? entries[0];
  const { api, session } = useCatalog();
  const { assignments, saveFailed, assign, unassign } = useAssignments();
  const [assigning, setAssigning] = useState(false);
  const [skills, setSkills] = useState<CatalogSkill[]>([]);
  const [skillsStatus, setSkillsStatus] = useState<SkillsStatus>('loading');

  // Sin elección previa se marca el primero, para que la lista y el detalle coincidan.
  useEffect(() => {
    if (!getComponentEntry(selectedId) && entries[0]) onSelect(entries[0].id);
  }, [selectedId, entries, onSelect]);

  // Skills del equipo: sirven para mostrar las asignadas y para elegirlas en el panel.
  useEffect(() => {
    let cancelled = false;
    setSkillsStatus('loading');
    api
      .listSkills()
      .then((all) => {
        if (cancelled) return;
        setSkills(all.filter((s) => isTeamLogin(s.uploadedBy.login)));
        setSkillsStatus('ready');
      })
      .catch(() => !cancelled && setSkillsStatus('error'));
    return () => {
      cancelled = true;
    };
  }, [api]);

  // Si se cierra la sesión o se cambia de componente, el panel de asignar no debe quedar abierto.
  useEffect(() => {
    setAssigning(false);
  }, [selected?.id, session]);

  const unassigned = useMemo(() => entries.filter((e) => isUnassigned(assignments[e.id])).length, [entries, assignments]);

  return (
    <section aria-labelledby="components-heading" className="mx-auto w-full max-w-[1280px] min-w-0 space-y-6 px-4 py-8 text-slate-300 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-2xl space-y-2">
          <p className="m-0 flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#38bdf8]">
            <Boxes className="h-3.5 w-3.5" aria-hidden="true" />
            Kit de interfaz
          </p>
          <h1 id="components-heading" className="m-0 text-3xl font-bold tracking-tight text-white">
            Componentes
          </h1>
          <p className="m-0 text-sm leading-relaxed text-slate-400">
            Componentes reales del equipo, con su código, sus variantes y la skill o el modelo de IA con el que se hicieron.
            Elige uno de la lista.
          </p>
        </div>
        <div className="[display:grid] grid-cols-3 gap-3">
          <Stat label="Componentes" value={entries.length} />
          <Stat label="Asignados" value={entries.length - unassigned} />
          <Stat label="No asignados" value={unassigned} />
        </div>
      </header>

      <div className="[display:grid] items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <ComponentSidebar entries={entries} assignments={assignments} selectedId={selected?.id ?? null} onSelect={onSelect} />
        {selected && (
          <ComponentDetail
            key={selected.id}
            entry={selected}
            assignment={assignments[selected.id]}
            skills={skills}
            canEdit={Boolean(session)}
            saveFailed={saveFailed}
            onAssign={() => setAssigning(true)}
            onUnassign={(kind, id) => unassign(selected.id, kind, id)}
            onOpenSkill={onOpenSkill}
            onRequestLogin={onRequestLogin}
          />
        )}
      </div>

      {assigning && selected && session && (
        <AssignDrawer
          entry={selected}
          assignment={assignments[selected.id]}
          skills={skills}
          skillsStatus={skillsStatus}
          onSave={(input) => {
            assign(selected.id, input);
            setAssigning(false);
          }}
          onClose={() => setAssigning(false)}
        />
      )}
    </section>
  );
}

export default ComponentsPage;
