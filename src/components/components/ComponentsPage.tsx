import { useEffect, useMemo } from 'react';
import { Boxes } from 'lucide-react';
import type { ComponentAssignment } from '../../types/uiComponents';
import { COMPONENT_REGISTRY, getComponentEntry } from '../../data/componentRegistry';
import { isUnassigned } from './assignmentInfo';
import { ComponentDetail } from './ComponentDetail';
import { ComponentSidebar } from './ComponentSidebar';

interface ComponentsPageProps {
  /** Componente elegido (controlado desde `App` para poder abrirlo desde una clase). */
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Skills y modelos asignados, por id de componente. */
  assignments?: Record<string, ComponentAssignment>;
}

const NO_ASSIGNMENTS: Record<string, ComponentAssignment> = {};

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
 * (vista previa en vivo, código real, accesibilidad y asignación). No necesita ninguna skill abierta.
 */
export function ComponentsPage({ selectedId, onSelect, assignments = NO_ASSIGNMENTS }: ComponentsPageProps) {
  const entries = COMPONENT_REGISTRY;
  const selected = getComponentEntry(selectedId) ?? entries[0];

  // Sin elección previa se marca el primero, para que la lista y el detalle coincidan.
  useEffect(() => {
    if (!getComponentEntry(selectedId) && entries[0]) onSelect(entries[0].id);
  }, [selectedId, entries, onSelect]);

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
        {selected && <ComponentDetail key={selected.id} entry={selected} assignment={assignments[selected.id]} />}
      </div>
    </section>
  );
}

export default ComponentsPage;
