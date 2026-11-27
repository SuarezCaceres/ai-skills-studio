import { createPortal } from 'react-dom';
import type { PageId, PageTemplateMeta } from '../../types/pages';

/**
 * Ventana con una página de referencia en vivo (spec 006). La usan la página «Páginas» y el detalle
 * de una clase. Firma congelada en la Fase 0: no cambiarla sin pasar por el orquestador.
 */
export interface PagePreviewModalProps {
  /** Lista por la que navegan ↑/↓ y anterior/siguiente (la categoría filtrada, o las páginas de la clase). */
  pages: PageTemplateMeta[];
  initialId: PageId;
  /** El llamador devuelve el foco a su disparador. */
  onClose: () => void;
  onOpenComponent?: (id: string) => void;
  /** Si falta, «Clases que la usan» se muestra sin enlace. */
  onOpenLesson?: (id: string) => void;
}

/** Esqueleto de la Fase 0: la versión completa llega en la Fase 1 (`wt1`). */
export function PagePreviewModal({ pages, initialId, onClose }: PagePreviewModalProps) {
  const page = pages.find((p) => p.id === initialId) ?? pages[0];
  if (!page) return null;
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="pagina-modal-titulo" data-testid="pagina-modal" className="rounded-2xl bg-[#121722] p-6">
        <h2 id="pagina-modal-titulo" className="m-0 text-xl font-bold text-white">
          {page.name}
        </h2>
        <button type="button" onClick={onClose} className="mt-4 rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-white">
          Cerrar
        </button>
      </div>
    </div>,
    document.body
  );
}

export default PagePreviewModal;
