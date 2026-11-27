import { forwardRef, useState } from 'react';
import { LayoutTemplate } from 'lucide-react';
import { pageThumbnailUrl } from '../../data/pageRegistry';
import type { PageTemplateMeta } from '../../types/pages';
import { FOCUS } from './pageUi';

interface PageCardProps {
  page: PageTemplateMeta;
  onOpen: (page: PageTemplateMeta) => void;
}

/**
 * Tarjeta de la galería: miniatura, nombre, apodo y categoría. Es un `button`, así que clic, Enter y
 * Espacio la abren. Si la miniatura aún no existe, queda el fondo con un icono y la tarjeta no se rompe.
 */
export const PageCard = forwardRef<HTMLButtonElement, PageCardProps>(function PageCard({ page, onOpen }, ref) {
  const [thumbFailed, setThumbFailed] = useState(false);
  return (
    <button
      ref={ref}
      type="button"
      data-testid="pagina-tarjeta"
      data-page-id={page.id}
      onClick={() => onOpen(page)}
      className={`group flex h-full w-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-800 bg-[#121722] p-0 text-left hover:border-[#0ea5e9]/70 ${FOCUS}`}
    >
      <span className="relative block aspect-[16/10] w-full overflow-hidden border-b border-slate-800 bg-[var(--p-surface,#0a0d14)]">
        <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center text-slate-700">
          <LayoutTemplate className="h-8 w-8" />
        </span>
        <img
          src={pageThumbnailUrl(page)}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setThumbFailed(true)}
          className={`absolute inset-0 h-full w-full object-cover object-top ${thumbFailed ? 'invisible' : ''}`}
        />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1.5 p-4">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#38bdf8]">{page.category}</span>
        <span className="text-base font-semibold text-white group-hover:text-[#38bdf8]">{page.name}</span>
        <span className="text-sm text-slate-400">Le dicen: {page.nickname}</span>
      </span>
    </button>
  );
});
