import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { COMPONENT_REGISTRY } from '../../data/componentRegistry';
import { PersonAvatar } from '../catalog/PersonAvatar';
import { ComponentThumb } from '../components/ComponentThumb';
import type { SkillOption, UseSkillOptionsResult } from './useLessons';

const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

const ROW =
  'flex cursor-pointer items-center gap-3 rounded-lg border border-slate-800 bg-[#0a0d14] px-3 py-2 hover:border-slate-600 has-[:checked]:border-[#0ea5e9]/60 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[#0ea5e9]';

interface PickerProps {
  value: string[];
  onChange: (next: string[]) => void;
  max: number;
  error?: string;
}

function SearchBox({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div className="relative mb-2">
      <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        placeholder={label}
        className="h-9 w-full rounded-lg border border-slate-800 bg-[#0a0d14] pl-9 pr-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#0ea5e9]"
      />
    </div>
  );
}

/** Selector de skills: las del equipo y las copias de trabajo, con buscador y avatar del autor. */
export function SkillPicker({ value, onChange, max, error, skills }: PickerProps & { skills: UseSkillOptionsResult }) {
  const [query, setQuery] = useState('');
  const { options, status } = skills;

  // Las ya elegidas que no aparecen (p. ej. una skill retirada) se muestran para poder quitarlas.
  const orphan = useMemo<SkillOption[]>(
    () => value.filter((id) => !options.some((o) => o.id === id)).map((id) => ({ id, name: id.split('/').pop() || id, source: 'equipo', hasCopy: false })),
    [value, options]
  );
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return options.filter((o) => !q || o.name.toLowerCase().includes(q) || (o.authorLogin ?? '').toLowerCase().includes(q));
  }, [options, query]);

  return (
    <fieldset className="m-0 min-w-0 border-0 p-0" aria-describedby={error ? 'picker-skills-error' : undefined}>
      <legend className="mb-1.5 p-0 text-sm font-semibold text-white">
        Skills usadas <span className="font-normal text-slate-500">({value.length} de {max})</span>
      </legend>
      {status === 'loading' && <p role="status" className="m-0 text-xs text-slate-500">Cargando las skills…</p>}
      {status === 'error' && (
        <p role="alert" className="m-0 mb-2 text-xs text-amber-300">
          No se pudieron cargar las skills del equipo; puedes seguir y vincularlas más tarde.
        </p>
      )}
      {status === 'ready' && options.length === 0 && orphan.length === 0 && (
        <p className="m-0 text-xs text-slate-500">Todavía no hay skills del equipo ni copias de trabajo para vincular.</p>
      )}
      {options.length > 5 && <SearchBox value={query} onChange={setQuery} label="Buscar skill" />}
      <ul className="m-0 flex max-h-64 list-none flex-col gap-1 overflow-y-auto p-0 pr-1">
        {[...visible, ...orphan].map((o) => (
          <li key={o.id}>
            <label className={ROW}>
              <input type="checkbox" checked={value.includes(o.id)} onChange={() => onChange(toggle(value, o.id))} className="h-4 w-4 shrink-0 accent-[#0ea5e9]" />
              <PersonAvatar login={o.authorLogin ?? (o.id.split('/')[0] || '?')} avatarUrl={o.avatarUrl} size={24} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-mono text-sm text-white">{o.name}</span>
                <span className="block truncate text-[11px] text-slate-500">
                  {o.authorLogin ? `@${o.authorLogin}` : 'Copia de trabajo'}
                  {o.hasCopy && o.source === 'equipo' ? ' · con copia de trabajo' : ''}
                </span>
              </span>
            </label>
          </li>
        ))}
        {status === 'ready' && options.length > 0 && visible.length === 0 && <li className="text-xs text-slate-500">Ninguna skill coincide.</li>}
      </ul>
      {error && (
        <p id="picker-skills-error" className="m-0 mt-1.5 text-xs text-rose-300">
          {error}
        </p>
      )}
    </fieldset>
  );
}

/** Selector de componentes del registro, con miniatura y buscador. */
export function ComponentPicker({ value, onChange, max, error }: PickerProps) {
  const [query, setQuery] = useState('');
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return COMPONENT_REGISTRY.filter((c) => !q || c.name.toLowerCase().includes(q) || c.category.toLowerCase().includes(q));
  }, [query]);

  return (
    <fieldset className="m-0 min-w-0 border-0 p-0" aria-describedby={error ? 'picker-components-error' : undefined}>
      <legend className="mb-1.5 p-0 text-sm font-semibold text-white">
        Componentes usados <span className="font-normal text-slate-500">({value.length} de {max})</span>
      </legend>
      <SearchBox value={query} onChange={setQuery} label="Buscar componente" />
      <ul className="m-0 flex max-h-64 list-none flex-col gap-1 overflow-y-auto p-0 pr-1">
        {visible.map((c) => (
          <li key={c.id}>
            <label className={ROW}>
              <input type="checkbox" checked={value.includes(c.id)} onChange={() => onChange(toggle(value, c.id))} className="h-4 w-4 shrink-0 accent-[#0ea5e9]" />
              <ComponentThumb entry={c} width={48} decorative />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-white">{c.name}</span>
                <span className="block truncate text-[11px] text-slate-500">{c.category}</span>
              </span>
            </label>
          </li>
        ))}
        {visible.length === 0 && <li className="text-xs text-slate-500">Ningún componente coincide.</li>}
      </ul>
      {error && (
        <p id="picker-components-error" className="m-0 mt-1.5 text-xs text-rose-300">
          {error}
        </p>
      )}
    </fieldset>
  );
}
