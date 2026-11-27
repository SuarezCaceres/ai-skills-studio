import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, Boxes, ChevronDown, ChevronUp, Code2, Monitor, Smartphone, X } from 'lucide-react';
import { getComponentEntry } from '../../data/componentRegistry';
import { getPageEntry } from '../../data/pageRegistry';
import type { PageId, PageTemplateMeta } from '../../types/pages';
import { useLessons } from '../lessons/useLessons';
import { PageFrame, type Viewport } from './PageFrame';
import { PageUsePanel } from './PageUsePanel';
import { BUTTON, FOCUS, ICON_BUTTON, focusableIn, keepsVerticalArrows } from './pageUi';

/**
 * Ventana con una página de referencia en vivo (spec 007). La usan la página «Páginas» y el detalle
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

const VIEWPORTS: Array<{ id: Viewport; label: string; Icon: typeof Monitor }> = [
  { id: 'escritorio', label: 'Escritorio', Icon: Monitor },
  { id: 'movil', label: 'Móvil', Icon: Smartphone },
];

/** Bloquea el desplazamiento del `body` mientras la modal está abierta y lo restaura al cerrar. */
function useBodyScrollLock() {
  useEffect(() => {
    const { style } = document.body;
    const previous = style.overflow;
    style.overflow = 'hidden';
    return () => {
      style.overflow = previous;
    };
  }, []);
}

function SectionTitle({ id, icon, children }: { id: string; icon: ReactNode; children: ReactNode }) {
  return (
    <h3 id={id} className="m-0 flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400">
      <span aria-hidden="true" className="text-[#38bdf8]">
        {icon}
      </span>
      {children}
    </h3>
  );
}

/**
 * Modal accesible: portal sobre `document.body`, foco inicial dentro y atrapado (Tab/Mayús+Tab), Esc y
 * «Cerrar» la cierran, ↑/↓ y anterior/siguiente pasan a la página vecina. No anima nada, así que respeta
 * `prefers-reduced-motion` sin más.
 */
export function PagePreviewModal({ pages, initialId, onClose, onOpenComponent, onOpenLesson }: PagePreviewModalProps) {
  const titleId = useId();
  const usageId = useId();
  const dialog = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const radios = useRef<Record<Viewport, HTMLButtonElement | null>>({ escritorio: null, movil: null });
  const [currentId, setCurrentId] = useState<PageId>(initialId);
  const [viewport, setViewport] = useState<Viewport>('escritorio');
  const [usageOpen, setUsageOpen] = useState(false);
  const { lessons } = useLessons();

  useBodyScrollLock();

  useEffect(() => {
    closeButton.current?.focus();
  }, []);

  const index = Math.max(
    0,
    pages.findIndex((p) => p.id === currentId)
  );
  const page = pages[index];
  const entry = page ? getPageEntry(page.id) : undefined;

  const components = useMemo(
    () => (page?.componentIds ?? []).map((id) => getComponentEntry(id)).filter((c): c is NonNullable<typeof c> => Boolean(c)),
    [page]
  );
  const usedBy = useMemo(() => (page ? lessons.filter((l) => l.pageIds.includes(page.id)) : []), [lessons, page]);

  if (!page || !entry) return null;

  const single = pages.length <= 1;
  const go = (step: number) => {
    if (single) return;
    setCurrentId(pages[(index + step + pages.length) % pages.length].id);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      event.preventDefault();
      onClose();
      return;
    }
    if ((event.key === 'ArrowUp' || event.key === 'ArrowDown') && !event.defaultPrevented && !keepsVerticalArrows(event.target)) {
      if (single) return;
      event.preventDefault();
      go(event.key === 'ArrowUp' ? -1 : 1);
      return;
    }
    if (event.key !== 'Tab' || !dialog.current) return;
    const items = focusableIn(dialog.current);
    if (items.length === 0) {
      event.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement as HTMLElement | null;
    const inside = active ? items.includes(active) : false;
    if (event.shiftKey && (active === first || !inside)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || !inside)) {
      event.preventDefault();
      first.focus();
    }
  };

  const chooseViewport = (next: Viewport, focus = false) => {
    setViewport(next);
    if (focus) radios.current[next]?.focus();
  };

  const onRadioKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const i = VIEWPORTS.findIndex((v) => v.id === viewport);
    const step = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
    chooseViewport(VIEWPORTS[(i + step + VIEWPORTS.length) % VIEWPORTS.length].id, true);
  };

  const leaveTo = (open: ((id: string) => void) | undefined, id: string) => {
    onClose();
    open?.(id);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[80] overflow-y-auto overscroll-contain bg-black/75 px-2 py-3 sm:px-6 sm:py-8"
      onMouseDown={(event) => {
        if (event.target !== event.currentTarget) return;
        // Sin esto, la acción por defecto del mousedown lleva el foco al body después de devolverlo.
        event.preventDefault();
        onClose();
      }}
    >
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-testid="pagina-modal"
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-5 rounded-2xl border border-slate-700 bg-[#121722] p-3 text-slate-300 shadow-2xl shadow-black/70 outline-none sm:p-6"
      >
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 max-w-3xl flex-1 basis-[18rem] space-y-1.5">
            <p className="m-0 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#38bdf8]">{page.category}</p>
            <h2 id={titleId} className="m-0 text-2xl font-bold tracking-tight text-white">
              {page.name}
            </h2>
            <p className="m-0 text-sm text-slate-400">Le dicen: {page.nickname}</p>
            <p className="m-0 text-sm leading-relaxed text-slate-300">{page.description}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" aria-label="Página anterior" title="Página anterior (↑)" disabled={single} onClick={() => go(-1)} className={ICON_BUTTON}>
              <ChevronUp aria-hidden="true" className="h-4 w-4" />
            </button>
            <span data-testid="pagina-posicion" className="min-w-[3.5rem] text-center font-mono text-xs tabular-nums text-slate-400">
              {index + 1} / {pages.length}
            </span>
            <button type="button" aria-label="Página siguiente" title="Página siguiente (↓)" disabled={single} onClick={() => go(1)} className={ICON_BUTTON}>
              <ChevronDown aria-hidden="true" className="h-4 w-4" />
            </button>
            <button ref={closeButton} type="button" aria-label="Cerrar" onClick={onClose} className={`${ICON_BUTTON} ml-1`}>
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="radiogroup" aria-label="Vista" className="inline-flex rounded-lg border border-slate-800 bg-[#0a0d14] p-1">
            {VIEWPORTS.map(({ id, label, Icon }) => {
              const checked = viewport === id;
              return (
                <button
                  key={id}
                  ref={(el) => {
                    radios.current[id] = el;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  tabIndex={checked ? 0 : -1}
                  onClick={() => chooseViewport(id)}
                  onKeyDown={onRadioKeyDown}
                  className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border-0 px-3 text-xs font-semibold ${FOCUS} ${
                    checked ? 'bg-[#0ea5e9]/15 text-[#38bdf8]' : 'bg-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon aria-hidden="true" className="h-3.5 w-3.5" />
                  {label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            aria-expanded={usageOpen}
            aria-controls={usageOpen ? usageId : undefined}
            onClick={() => setUsageOpen((v) => !v)}
            className={
              usageOpen
                ? `${BUTTON} border-[#0ea5e9] text-[#38bdf8]`
                : `inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border-0 bg-[#0ea5e9] px-4 text-xs font-semibold text-[#0a0d14] hover:bg-[#38bdf8] ${FOCUS}`
            }
          >
            <Code2 aria-hidden="true" className="h-3.5 w-3.5" />
            Usar esta página
          </button>
        </div>

        {usageOpen && <PageUsePanel key={`uso-${page.id}`} id={usageId} entry={entry} />}

        <PageFrame key={`marco-${page.id}`} entry={entry} viewport={viewport} />

        <div className="[display:grid] gap-4 md:grid-cols-2">
          <section data-testid="pagina-componentes" aria-labelledby={`${titleId}-componentes`} className="min-w-0 space-y-2 rounded-xl border border-slate-800 bg-[#0a0d14] p-4">
            <SectionTitle id={`${titleId}-componentes`} icon={<Boxes className="h-3.5 w-3.5" />}>
              Componentes que usa
            </SectionTitle>
            {components.length === 0 ? (
              <p className="m-0 text-sm text-slate-500">Esta página no usa componentes del kit.</p>
            ) : (
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                {components.map((c) => (
                  <li key={c.id}>
                    {onOpenComponent ? (
                      <button type="button" onClick={() => leaveTo(onOpenComponent, c.id)} className={BUTTON}>
                        {c.name}
                      </button>
                    ) : (
                      <span className="inline-flex h-9 items-center rounded-lg border border-slate-800 px-3 text-xs font-semibold text-slate-300">
                        {c.name}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section data-testid="pagina-clases" aria-labelledby={`${titleId}-clases`} className="min-w-0 space-y-2 rounded-xl border border-slate-800 bg-[#0a0d14] p-4">
            <SectionTitle id={`${titleId}-clases`} icon={<BookOpen className="h-3.5 w-3.5" />}>
              Clases que la usan
            </SectionTitle>
            {usedBy.length === 0 ? (
              <p className="m-0 text-sm text-slate-500">Todavía ninguna clase usa esta página.</p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {usedBy.map((lesson) => (
                  <li key={lesson.id} className="min-w-0">
                    {onOpenLesson ? (
                      <button
                        type="button"
                        onClick={() => leaveTo(onOpenLesson, lesson.id)}
                        className={`flex w-full cursor-pointer flex-col items-start gap-0.5 rounded-lg border border-slate-800 bg-[#121722] px-3 py-2 text-left hover:border-[#0ea5e9]/70 ${FOCUS}`}
                      >
                        <span className="text-sm font-semibold text-white">{lesson.title}</span>
                        <span className="text-[11px] text-slate-500">
                          {lesson.level} · @{lesson.author.login}
                        </span>
                      </button>
                    ) : (
                      <span className="block rounded-lg border border-slate-800 px-3 py-2 text-sm font-semibold text-white">{lesson.title}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default PagePreviewModal;
