import { useState } from 'react';
import { ChevronRight, Ellipsis } from 'lucide-react';

export interface Crumb {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: Crumb[];
  /** Con más migas que este número, las del medio se pliegan tras un botón «…». */
  collapseAfter?: number;
}

const LINK =
  'rounded-sm text-slate-400 transition-colors hover:text-[#38bdf8] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]';

/**
 * Migas de pan: `<nav>` con lista ordenada, la última (página actual) con `aria-current="page"` y sin
 * enlace. Los separadores son decorativos. Si hay muchas migas, las del medio se pliegan y se expanden.
 */
export function Breadcrumb({ items, collapseAfter = 4 }: BreadcrumbProps) {
  const [expanded, setExpanded] = useState(false);
  const collapsed = !expanded && items.length > collapseAfter;
  const head = collapsed ? items.slice(0, 1) : items.slice(0, items.length - 1);
  const current = items[items.length - 1];
  // Plegado: primera miga, «…», la anterior a la actual y la actual.
  const last = collapsed ? items.slice(-2, -1) : [];

  const crumb = (item: Crumb, key: string) => (
    <li key={key} className="inline-flex items-center gap-1.5">
      {item.href ? (
        <a href={item.href} className={LINK}>
          {item.label}
        </a>
      ) : (
        <span className="text-slate-400">{item.label}</span>
      )}
      <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 text-slate-600" />
    </li>
  );

  return (
    <nav aria-label="Migas de pan" className="text-sm">
      <ol className="m-0 flex list-none flex-wrap items-center gap-x-1.5 gap-y-1 p-0">
        {head.map((item, i) => crumb(item, `h-${i}`))}
        {collapsed && (
          <li className="inline-flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setExpanded(true)}
              aria-label={`Mostrar ${items.length - 3} niveles ocultos`}
              className="flex h-6 w-7 cursor-pointer items-center justify-center rounded-md border border-slate-700 bg-transparent text-slate-300 hover:border-[#0ea5e9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]"
            >
              <Ellipsis aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
            <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 text-slate-600" />
          </li>
        )}
        {last.map((item, i) => crumb(item, `t-${i}`))}
        <li className="inline-flex items-center">
          <span aria-current="page" className="font-semibold text-white">
            {current.label}
          </span>
        </li>
      </ol>
    </nav>
  );
}

/** Demo del registro: una ruta corta y otra larga que se despliega. */
export function Demo() {
  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[
          { label: 'Inicio', href: '#inicio' },
          { label: 'Códice', href: '#codice' },
          { label: 'Clases' },
        ]}
      />
      <Breadcrumb
        items={[
          { label: 'Inicio', href: '#inicio' },
          { label: 'Skills del equipo', href: '#equipo' },
          { label: 'SuarezCaceres', href: '#autor' },
          { label: 'codice-skills', href: '#repo' },
          { label: 'frontend-design', href: '#skill' },
          { label: 'SKILL.md' },
        ]}
      />
    </div>
  );
}
