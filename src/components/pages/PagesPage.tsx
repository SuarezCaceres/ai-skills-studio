import { LayoutTemplate } from 'lucide-react';
import { PAGE_REGISTRY } from '../../data/pageRegistry';

export interface PagesPageProps {
  /** Abre un componente del kit en la página Componentes. */
  onOpenComponent: (id: string) => void;
  /** Abre una clase en Códice. */
  onOpenLesson: (id: string) => void;
}

/**
 * Página «Páginas» (spec 006): galería de páginas de referencia hechas con el kit.
 * Esqueleto de la Fase 0: la galería, los filtros y la modal llegan en la Fase 1 (`wt1`).
 */
export function PagesPage(_props: PagesPageProps) {
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
      </header>
      <ul className="m-0 list-none p-0">
        {PAGE_REGISTRY.map((page) => (
          <li key={page.id}>
            <button type="button" data-testid="pagina-tarjeta" data-page-id={page.id}>
              {page.name}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default PagesPage;
