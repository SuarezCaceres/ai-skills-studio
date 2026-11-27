import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Boxes, Wand2 } from 'lucide-react';
import { useCatalog } from '../../hooks/useCatalog';
import { isTeamLogin } from '../../config/team';
import type { CatalogSkill } from '../../types/catalog';
import { CATEGORIES_BY_KIND, type UiComponentEntry, type UiEntryKind } from '../../types/uiComponents';
import { COMPONENT_REGISTRY, getComponentEntry } from '../../data/componentRegistry';
import { isUnassigned } from './assignmentInfo';
import { AssignDrawer, type SkillsStatus } from './AssignDrawer';
import { ComponentDetail } from './ComponentDetail';
import { ComponentSidebar, type EntryNoun } from './ComponentSidebar';
import { useAssignments } from './useAssignments';
import { useLessons } from '../lessons/useLessons';

interface ComponentsPageProps {
  /** Componente o efecto elegido (controlado desde `App` para poder abrirlo desde una clase). */
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Abre el detalle de una skill asignada. */
  onOpenSkill: (id: string) => void;
  /** Abre la pantalla de acceso con GitHub (asignar requiere sesión). */
  onRequestLogin: () => void;
  /** Abre una clase en Códice. */
  onOpenLesson: (id: string) => void;
}

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]';

/** Pestañas de la página, en orden, con los textos que cambian según el grupo. */
const VIEWS: Array<{
  kind: UiEntryKind;
  label: string;
  eyebrow: string;
  description: string;
  noun: EntryNoun;
  Icon: typeof Boxes;
}> = [
  {
    kind: 'componente',
    label: 'Componentes',
    eyebrow: 'Kit de interfaz',
    description:
      'Componentes reales del equipo, con su código, sus variantes y la skill o el modelo de IA con el que se hicieron. Elige uno de la lista.',
    noun: { singular: 'componente', plural: 'componentes', label: 'Componentes' },
    Icon: Boxes,
  },
  {
    kind: 'efecto',
    label: 'Efectos',
    eyebrow: 'Estilos y animaciones',
    description:
      'Estilos y animaciones para pedirle a tu IA un look o un movimiento concreto: míralos en vivo, copia su prompt en español y llévate el código. Elige uno de la lista.',
    noun: { singular: 'efecto', plural: 'efectos', label: 'Efectos' },
    Icon: Wand2,
  },
];

/** Entradas del registro de cada pestaña (el registro es estático: se calcula una vez). */
const ENTRIES_BY_KIND: Record<UiEntryKind, UiComponentEntry[]> = {
  componente: COMPONENT_REGISTRY.filter((entry) => entry.kind === 'componente'),
  efecto: COMPONENT_REGISTRY.filter((entry) => entry.kind === 'efecto'),
};

const tabId = (kind: UiEntryKind) => `components-tab-${kind}`;
const PANEL_ID = 'components-tabpanel';

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-800 bg-[#121722] px-4 py-3">
      <p className="m-0 font-mono text-[11px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mb-0 mt-1 text-xl font-bold tabular-nums text-white">{value}</p>
    </div>
  );
}

/**
 * Página Componentes: pestañas «Componentes | Efectos», lista lateral para elegir una entrada del
 * registro y, a la derecha, su detalle (vista previa en vivo, prompt si es un efecto, imagen,
 * asignación, código y accesibilidad). Ver el contenido es libre; asignar requiere sesión de GitHub.
 *
 * La pestaña activa sale del `kind` de la entrada elegida: si `App` marca un efecto desde fuera
 * (por ejemplo, desde una clase), la pestaña «Efectos» se activa sola, sin efectos encadenados.
 */
export function ComponentsPage({ selectedId, onSelect, onOpenSkill, onRequestLogin, onOpenLesson }: ComponentsPageProps) {
  const selectedEntry = getComponentEntry(selectedId);
  // Solo decide la pestaña cuando no hay ninguna entrada válida elegida (primer montaje o id obsoleto).
  const [fallbackView, setFallbackView] = useState<UiEntryKind>('componente');
  const view: UiEntryKind = selectedEntry?.kind ?? fallbackView;
  const meta = VIEWS.find((v) => v.kind === view) ?? VIEWS[0];
  const entries = ENTRIES_BY_KIND[view];
  const selected = selectedEntry ?? entries[0];

  const { api, session } = useCatalog();
  const { assignments, saveFailed, assign, unassign } = useAssignments();
  const { lessons } = useLessons();
  const [assigning, setAssigning] = useState(false);
  const [skills, setSkills] = useState<CatalogSkill[]>([]);
  const [skillsStatus, setSkillsStatus] = useState<SkillsStatus>('loading');
  const tabRefs = useRef<Partial<Record<UiEntryKind, HTMLButtonElement | null>>>({});

  // Sin elección válida se marca el primero de la pestaña, para que la lista y el detalle coincidan.
  // Una vez elegido, `selectedEntry` deja de ser `undefined` y el efecto no vuelve a disparar.
  useEffect(() => {
    if (!selectedEntry && entries[0]) onSelect(entries[0].id);
  }, [selectedEntry, entries, onSelect]);

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

  // Si se cierra la sesión o se cambia de entrada, el panel de asignar no debe quedar abierto.
  useEffect(() => {
    setAssigning(false);
  }, [selected?.id, session]);

  const unassigned = useMemo(() => entries.filter((e) => isUnassigned(assignments[e.id])).length, [entries, assignments]);

  /** Cambia de pestaña eligiendo la primera entrada de ese grupo (la pestaña sigue a la selección). */
  const changeView = (kind: UiEntryKind) => {
    setFallbackView(kind);
    if (kind === view) return;
    const first = ENTRIES_BY_KIND[kind][0];
    if (first) onSelect(first.id);
  };

  // Activación automática: flechas izquierda/derecha, Inicio y Fin cambian de pestaña y mueven el foco.
  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % VIEWS.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + VIEWS.length) % VIEWS.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = VIEWS.length - 1;
    else return;
    event.preventDefault();
    const target = VIEWS[next].kind;
    changeView(target);
    tabRefs.current[target]?.focus();
  };

  return (
    <section aria-labelledby="components-heading" className="mx-auto w-full max-w-[1280px] min-w-0 space-y-6 px-4 py-8 text-slate-300 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-2xl space-y-2">
          <p className="m-0 flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#38bdf8]">
            <meta.Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {meta.eyebrow}
          </p>
          <h1 id="components-heading" className="m-0 text-3xl font-bold tracking-tight text-white">
            Componentes
          </h1>
          <p className="m-0 text-sm leading-relaxed text-slate-400">{meta.description}</p>
        </div>
        <div className="[display:grid] grid-cols-3 gap-3">
          <Stat label={meta.label} value={entries.length} />
          <Stat label="Asignados" value={entries.length - unassigned} />
          <Stat label="No asignados" value={unassigned} />
        </div>
      </header>

      <div
        role="tablist"
        aria-label="Tipo de pieza"
        className="flex w-full gap-1 rounded-full border border-slate-800 bg-[#0a0d14] p-1 sm:w-fit"
      >
        {VIEWS.map(({ kind, label, Icon }, index) => {
          const active = kind === view;
          return (
            <button
              key={kind}
              ref={(node) => {
                tabRefs.current[kind] = node;
              }}
              id={tabId(kind)}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={PANEL_ID}
              tabIndex={active ? 0 : -1}
              onClick={() => changeView(kind)}
              onKeyDown={(event) => onTabKeyDown(event, index)}
              className={`inline-flex h-10 min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border-0 px-5 text-sm font-semibold motion-safe:transition-colors sm:flex-none ${FOCUS} ${
                active ? 'bg-[#0ea5e9] text-[#0a0d14]' : 'bg-transparent text-slate-300 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
              {label}{' '}
              <span
                className={`rounded-full px-1.5 font-mono text-[11px] tabular-nums ${
                  active ? 'bg-[#0a0d14]/15 text-[#0a0d14]' : 'bg-white/[0.06] text-slate-400'
                }`}
              >
                {ENTRIES_BY_KIND[kind].length}
              </span>
            </button>
          );
        })}
      </div>

      <div
        id={PANEL_ID}
        role="tabpanel"
        aria-labelledby={tabId(view)}
        className="[display:grid] items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]"
      >
        <ComponentSidebar
          key={view}
          entries={entries}
          categories={CATEGORIES_BY_KIND[view]}
          noun={meta.noun}
          assignments={assignments}
          selectedId={selected?.id ?? null}
          onSelect={onSelect}
        />
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
            lessons={lessons.filter((l) => l.componentIds.includes(selected.id))}
            onOpenLesson={onOpenLesson}
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
