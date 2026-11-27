import { useCallback, useMemo, useRef, useState } from 'react';
import { LayoutTemplate } from 'lucide-react';
import { PAGE_REGISTRY } from '../../data/pageRegistry';
import { PAGE_CATEGORIES, type PageCategory, type PageId, type PageTemplateMeta } from '../../types/pages';
import { PageCard } from './PageCard';
import { PagePreviewModal } from './PagePreviewModal';
import { FOCUS } from './pageUi';

export interface PagesPageProps {
  /** Abre un componente del kit en la página Componentes. */
  onOpenComponent: (id: string) => void;
  /** Abre una clase en Códice. */
  onOpenLesson: (id: string) => void;
}

type Filter = 'todas' | PageCategory;

interface OpenState {
  id: PageId;
  /** Las tarjetas visibles al abrir: la modal navega entre ellas. */
  pages: PageTemplateMeta[];
}

function Chip({ label, count, pressed, onClick }: { label: string; count: number; pressed: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`inline-flex h-9 cursor-pointer items-center rounded-full border px-4 text-xs font-semibold ${FOCUS} ${
        pressed
          ? 'border-[#0ea5e9] bg-[#0ea5e9]/15 text-[#38bdf8]'
          : 'border-slate-700 bg-transparent text-slate-300 hover:border-[#0ea5e9]/70 hover:text-white'
      }`}
    >
      <span>
        {label} <span className={`font-mono tabular-nums ${pressed ? 'text-[#7dd3fc]' : 'text-slate-500'}`}>{count}</span>
      </span>
    </button>
  );
}

/**
 * Página «Páginas» (spec 007): galería de páginas de referencia hechas con el kit. Los chips filtran
 * por categoría y cada tarjeta abre la modal con la página en vivo, su prompt y su código.
 */
export function PagesPage({ onOpenComponent, onOpenLesson }: PagesPageProps) {
  const [filter, setFilter] = useState<Filter>('todas');
  const [open, setOpen] = useState<OpenState | null>(null);
  const cards = useRef(new Map<PageId, HTMLButtonElement>());
  const opener = useRef<PageId | null>(null);

  const categories = useMemo(
    () =>
      PAGE_CATEGORIES.map((category) => ({ category, count: PAGE_REGISTRY.filter((p) => p.category === category).length })).filter(
        (c) => c.count > 0
      ),
    []
  );
  const visible = useMemo(() => (filter === 'todas' ? PAGE_REGISTRY : PAGE_REGISTRY.filter((p) => p.category === filter)), [filter]);

  const openPage = useCallback(
    (page: PageTemplateMeta) => {
      opener.current = page.id;
      setOpen({ id: page.id, pages: visible });
    },
    [visible]
  );

  // La modal no devuelve el foco por su cuenta: aquí vuelve a la tarjeta que la abrió.
  const close = useCallback(() => {
    setOpen(null);
    const id = opener.current;
    opener.current = null;
    if (id) cards.current.get(id)?.focus();
  }, []);

  return (
    <section aria-labelledby="pages-heading" className="mx-auto w-full max-w-[1280px] min-w-0 space-y-6 px-4 py-8 text-slate-300 sm:px-6">
      <header className="max-w-2xl space-y-2">
        <p className="m-0 flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#38bdf8]">
          <LayoutTemplate className="h-3.5 w-3.5" aria-hidden="true" />
          Páginas de referencia
        </p>
        <h1 id="pages-heading" className="m-0 text-3xl font-bold tracking-tight text-white">
          Páginas
        </h1>
        <p className="m-0 text-sm leading-relaxed text-slate-400">
          Páginas completas hechas con el kit de interfaz. Ábrelas para verlas en escritorio o en móvil y copia su prompt o su
          código.
        </p>
      </header>

      <div data-testid="paginas-filtro" role="group" aria-label="Filtrar por categoría" className="flex flex-wrap gap-2">
        <Chip label="Todas" count={PAGE_REGISTRY.length} pressed={filter === 'todas'} onClick={() => setFilter('todas')} />
        {categories.map(({ category, count }) => (
          <Chip key={category} label={category} count={count} pressed={filter === category} onClick={() => setFilter(category)} />
        ))}
      </div>

      <ul className="m-0 [display:grid] list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((page) => (
          <li key={page.id} className="min-w-0">
            <PageCard
              page={page}
              onOpen={openPage}
              ref={(el) => {
                if (el) cards.current.set(page.id, el);
                else cards.current.delete(page.id);
              }}
            />
          </li>
        ))}
      </ul>

      {open && (
        <PagePreviewModal
          pages={open.pages}
          initialId={open.id}
          onClose={close}
          onOpenComponent={onOpenComponent}
          onOpenLesson={onOpenLesson}
        />
      )}
    </section>
  );
}

export default PagesPage;
