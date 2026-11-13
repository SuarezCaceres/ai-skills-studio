import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import type { ComponentAssignment, UiComponentCategory, UiComponentEntry } from '../../types/uiComponents';
import { UI_COMPONENT_CATEGORIES } from '../../types/uiComponents';
import { componentsByCategory } from '../../data/componentRegistry';
import { AssignmentBadge } from './AssignmentBadge';
import { ComponentThumb } from './ComponentThumb';
import { ASSIGNMENT_FILTERS, matchesAssignmentFilter, type AssignmentFilter } from './assignmentInfo';

interface ComponentSidebarProps {
  entries: UiComponentEntry[];
  assignments: Record<string, ComponentAssignment>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]';

/**
 * Lista lateral de componentes agrupada por categoría, con buscador y filtros (asignación y categoría).
 * Las flechas arriba/abajo, Inicio y Fin recorren la lista y eligen el componente (`aria-current`).
 * En pantallas estrechas la lista se pliega tras un botón que muestra el componente elegido.
 */
export function ComponentSidebar({ entries, assignments, selectedId, onSelect }: ComponentSidebarProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<AssignmentFilter>('todos');
  const [category, setCategory] = useState<UiComponentCategory | 'todas'>('todas');
  const [mobileOpen, setMobileOpen] = useState(false);
  const rows = useRef(new Map<string, HTMLButtonElement>());

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter(
      (entry) =>
        (category === 'todas' || entry.category === category) &&
        matchesAssignmentFilter(filter, assignments[entry.id]) &&
        (!q ||
          entry.name.toLowerCase().includes(q) ||
          entry.description.toLowerCase().includes(q) ||
          entry.category.toLowerCase().includes(q))
    );
  }, [entries, assignments, query, filter, category]);

  const groups = useMemo(() => componentsByCategory(visible), [visible]);
  const selected = entries.find((entry) => entry.id === selectedId);
  const filtering = query.trim() !== '' || filter !== 'todos' || category !== 'todas';

  const choose = (id: string) => {
    onSelect(id);
    setMobileOpen(false);
  };

  const onRowKeyDown = (event: KeyboardEvent<HTMLButtonElement>, id: string) => {
    const order = groups.flatMap((group) => group.entries.map((entry) => entry.id));
    const index = order.indexOf(id);
    let next: string | undefined;
    if (event.key === 'ArrowDown') next = order[Math.min(index + 1, order.length - 1)];
    if (event.key === 'ArrowUp') next = order[Math.max(index - 1, 0)];
    if (event.key === 'Home') next = order[0];
    if (event.key === 'End') next = order[order.length - 1];
    if (!next) return;
    event.preventDefault();
    onSelect(next);
    rows.current.get(next)?.focus();
  };

  return (
    <aside aria-label="Lista de componentes" className="min-w-0 lg:sticky lg:top-24 lg:self-start">
      <button
        type="button"
        aria-expanded={mobileOpen}
        aria-controls="component-list-panel"
        onClick={() => setMobileOpen((o) => !o)}
        className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-800 bg-[#121722] px-4 py-3 text-left text-sm text-slate-100 lg:hidden ${FOCUS}`}
      >
        <span className="min-w-0 truncate">
          <span className="text-slate-500">Componente: </span>
          <strong>{selected?.name ?? 'Elige uno'}</strong>
          <span className="text-slate-500"> · {entries.length} en total</span>
        </span>
        <ChevronDown aria-hidden="true" className={`h-4 w-4 shrink-0 transition-transform ${mobileOpen ? 'rotate-180' : ''}`} />
      </button>

      <div
        id="component-list-panel"
        className={`${mobileOpen ? 'flex' : 'hidden'} mt-3 flex-col gap-3 rounded-xl border border-slate-800 bg-[#121722] p-3 lg:mt-0 lg:flex lg:max-h-[calc(100dvh-8rem)]`}
      >
        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar componente…"
            aria-label="Buscar componente"
            className="h-9 w-full rounded-lg border border-slate-800 bg-[#0a0d14] pl-9 pr-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#0ea5e9]"
          />
        </div>

        <div role="group" aria-label="Filtrar por asignación" className="flex flex-wrap gap-1.5">
          {ASSIGNMENT_FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={filter === item.value}
              onClick={() => setFilter(item.value)}
              className={`h-7 cursor-pointer rounded-full border px-3 text-[11px] font-semibold transition ${FOCUS} ${
                filter === item.value
                  ? 'border-[#0ea5e9] bg-[#0ea5e9] text-[#0a0d14]'
                  : 'border-slate-800 bg-[#0a0d14] text-slate-300 hover:border-slate-600'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div>
          <label htmlFor="component-category" className="sr-only">
            Filtrar por categoría
          </label>
          <select
            id="component-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as UiComponentCategory | 'todas')}
            className="h-9 w-full cursor-pointer rounded-lg border border-slate-800 bg-[#0a0d14] px-3 text-sm text-slate-200 outline-none focus:border-[#0ea5e9]"
          >
            <option value="todas">Todas las categorías</option>
            {UI_COMPONENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <p role="status" className="m-0 flex items-center justify-between font-mono text-[11px] text-slate-500">
          <span>
            {visible.length} {visible.length === 1 ? 'componente' : 'componentes'}
            {filtering && ` de ${entries.length}`}
          </span>
          {filtering && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setFilter('todos');
                setCategory('todas');
              }}
              className={`inline-flex cursor-pointer items-center gap-1 rounded-sm border-0 bg-transparent p-0 font-mono text-[11px] text-[#38bdf8] hover:underline ${FOCUS}`}
            >
              <X aria-hidden="true" className="h-3 w-3" />
              Quitar filtros
            </button>
          )}
        </p>

        <nav aria-label="Componentes" className="-mr-1 min-h-0 flex-1 overflow-y-auto pr-1 [max-height:60dvh] lg:[max-height:none]">
          {groups.length === 0 ? (
            <p className="m-0 rounded-lg border border-dashed border-slate-700 p-4 text-center text-sm text-slate-400">
              Ningún componente coincide con los filtros.
            </p>
          ) : (
            groups.map((group) => (
              <section key={group.category} aria-labelledby={`cat-${group.category}`} className="mb-3 last:mb-0">
                <h2 id={`cat-${group.category}`} className="m-0 mb-1 px-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {group.category}
                </h2>
                <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
                  {group.entries.map((entry) => {
                    const active = entry.id === selectedId;
                    return (
                      <li key={entry.id}>
                        <button
                          ref={(node) => {
                            if (node) rows.current.set(entry.id, node);
                            else rows.current.delete(entry.id);
                          }}
                          type="button"
                          aria-current={active ? 'true' : undefined}
                          onClick={() => choose(entry.id)}
                          onKeyDown={(event) => onRowKeyDown(event, entry.id)}
                          className={`flex w-full cursor-pointer items-center gap-3 rounded-lg border px-2 py-2 text-left transition-colors ${FOCUS} ${
                            active
                              ? 'border-[#0ea5e9]/60 bg-[#0ea5e9]/10 text-white'
                              : 'border-transparent bg-transparent text-slate-300 hover:bg-white/5'
                          }`}
                        >
                          <ComponentThumb entry={entry} width={64} decorative />
                          <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
                            <span className="text-sm font-semibold">{entry.name}</span>
                            <AssignmentBadge assignment={assignments[entry.id]} />
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))
          )}
        </nav>
      </div>
    </aside>
  );
}
