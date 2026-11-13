import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { X } from 'lucide-react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  side?: 'left' | 'right';
  children: ReactNode;
  footer?: ReactNode;
  /**
   * `false` (por defecto) cubre toda la ventana (`fixed`). `true` lo limita al contenedor
   * `relative` más cercano: sirve para previsualizarlo dentro de una caja.
   */
  contained?: boolean;
}

/**
 * Panel lateral modal: `role="dialog"` + `aria-modal`, el foco entra al abrir, se queda dentro
 * (Tab/Mayús+Tab), Escape y el fondo lo cierran, y el foco vuelve al botón que lo abrió.
 */
export function Drawer({ open, onClose, title, side = 'right', children, footer, contained = false }: DrawerProps) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement as HTMLElement | null;
    const first = panel.current?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel.current)?.focus();
    return () => opener.current?.focus();
  }, [open]);

  if (!open) return null;

  const position = contained ? 'absolute' : 'fixed';

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== 'Tab' || !panel.current) return;
    const items = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (items.length === 0) return;
    const firstItem = items[0];
    const lastItem = items[items.length - 1];
    if (event.shiftKey && document.activeElement === firstItem) {
      event.preventDefault();
      lastItem.focus();
    } else if (!event.shiftKey && document.activeElement === lastItem) {
      event.preventDefault();
      firstItem.focus();
    }
  };

  return (
    <div className={`${position} inset-0 z-40 overflow-hidden`}>
      <div aria-hidden="true" onClick={onClose} className="absolute inset-0 bg-black/60" />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className={`absolute inset-y-0 flex w-full max-w-sm flex-col bg-[#121722] shadow-2xl shadow-black/70 outline-none ${
          side === 'right' ? 'right-0 border-l' : 'left-0 border-r'
        } border-slate-700`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
          <h2 id={titleId} className="m-0 text-base font-semibold text-white">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-slate-400 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0ea5e9]"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 text-sm leading-relaxed text-slate-300">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-800 px-4 py-3">{footer}</div>}
      </div>
    </div>
  );
}

/** Demo del registro: abre dos paneles (derecha e izquierda) dentro de una caja de pruebas. */
export function Demo() {
  const [side, setSide] = useState<'left' | 'right' | null>(null);
  const trigger =
    'inline-flex h-9 cursor-pointer items-center rounded-full border border-slate-700 bg-transparent px-4 text-xs font-semibold text-slate-100 hover:border-[#0ea5e9] hover:text-[#38bdf8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]';
  return (
    <div className="relative h-80 w-full max-w-2xl overflow-hidden rounded-xl border border-slate-800 bg-[#0a0d14]">
      <div className="flex flex-wrap gap-3 p-4">
        <button type="button" className={trigger} onClick={() => setSide('right')}>
          Abrir filtros (derecha)
        </button>
        <button type="button" className={trigger} onClick={() => setSide('left')}>
          Abrir menú (izquierda)
        </button>
      </div>
      <p className="m-0 px-4 text-xs text-slate-500">Con el panel abierto, Tab se queda dentro y Esc lo cierra.</p>
      <Drawer
        contained
        open={side !== null}
        side={side ?? 'right'}
        onClose={() => setSide(null)}
        title={side === 'left' ? 'Menú' : 'Filtros'}
        footer={
          <>
            <button type="button" onClick={() => setSide(null)} className={trigger}>
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => setSide(null)}
              className="inline-flex h-9 cursor-pointer items-center rounded-full border-0 bg-[#0ea5e9] px-4 text-xs font-semibold text-[#0a0d14] hover:bg-[#38bdf8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]"
            >
              Aplicar
            </button>
          </>
        }
      >
        <label className="flex items-center gap-2">
          <input type="checkbox" defaultChecked className="h-4 w-4 accent-[#0ea5e9]" />
          Solo mis clases
        </label>
        <label className="mt-3 flex items-center gap-2">
          <input type="checkbox" className="h-4 w-4 accent-[#0ea5e9]" />
          Con skill asignada
        </label>
      </Drawer>
    </div>
  );
}
