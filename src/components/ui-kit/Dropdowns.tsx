import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { ChevronDown, Copy, Pencil, Share2, Trash2, type LucideIcon } from 'lucide-react';

export interface MenuItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  disabled?: boolean;
  danger?: boolean;
  /** Dibuja una línea separadora antes de este elemento. */
  separatorBefore?: boolean;
}

interface DropdownMenuProps {
  /** Texto del botón que abre el menú. */
  label: string;
  items: MenuItem[];
  onSelect: (id: string) => void;
}

/**
 * Menú desplegable con el patrón `menu` de WAI-ARIA: el botón usa `aria-haspopup` y `aria-expanded`;
 * con el menú abierto las flechas, Inicio y Fin recorren las opciones, Escape cierra y devuelve el foco,
 * y se puede elegir escribiendo la primera letra.
 */
export function DropdownMenu({ label, items, onSelect }: DropdownMenuProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const options = useRef<Array<HTMLButtonElement | null>>([]);

  const enabled = items.map((item, i) => (item.disabled ? -1 : i)).filter((i) => i >= 0);

  useEffect(() => {
    if (open) options.current[active]?.focus();
  }, [open, active]);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const openAt = (position: 'first' | 'last') => {
    setActive(position === 'first' ? enabled[0] : enabled[enabled.length - 1]);
    setOpen(true);
  };

  const close = (returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) trigger.current?.focus();
  };

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      openAt('first');
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      openAt('last');
    }
  };

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const position = enabled.indexOf(active);
    if (event.key === 'ArrowDown') setActive(enabled[(position + 1) % enabled.length]);
    else if (event.key === 'ArrowUp') setActive(enabled[(position - 1 + enabled.length) % enabled.length]);
    else if (event.key === 'Home') setActive(enabled[0]);
    else if (event.key === 'End') setActive(enabled[enabled.length - 1]);
    else if (event.key === 'Escape') close(true);
    else if (event.key === 'Tab') close(false);
    else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
      const letter = event.key.toLowerCase();
      const match = enabled.find((i) => items[i].label.toLowerCase().startsWith(letter));
      if (match === undefined) return;
      setActive(match);
    } else return;
    if (event.key !== 'Tab') event.preventDefault();
  };

  return (
    <div ref={root} className="relative inline-block">
      <button
        ref={trigger}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? `${id}-menu` : undefined}
        onClick={() => (open ? close(false) : openAt('first'))}
        onKeyDown={onTriggerKeyDown}
        className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-slate-700 bg-[#121722] px-4 text-sm font-semibold text-slate-100 transition-colors hover:border-[#0ea5e9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]"
      >
        {label}
        <ChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          id={`${id}-menu`}
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKeyDown}
          className="absolute left-0 top-full z-20 mt-2 min-w-52 rounded-xl border border-slate-700 bg-[#121722] p-1.5 shadow-2xl shadow-black/60"
        >
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={item.id}>
                {item.separatorBefore && <div role="separator" className="my-1 h-px bg-slate-800" />}
                <button
                  ref={(node) => {
                    options.current[index] = node;
                  }}
                  type="button"
                  role="menuitem"
                  tabIndex={index === active ? 0 : -1}
                  aria-disabled={item.disabled || undefined}
                  onMouseEnter={() => !item.disabled && setActive(index)}
                  onClick={() => {
                    if (item.disabled) return;
                    onSelect(item.id);
                    close(true);
                  }}
                  className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg border-0 bg-transparent px-3 py-2 text-left text-sm focus-visible:outline-none ${
                    item.disabled
                      ? 'cursor-not-allowed text-slate-600'
                      : item.danger
                        ? 'text-rose-300 focus:bg-rose-950/50 hover:bg-rose-950/50'
                        : 'text-slate-200 focus:bg-white/10 hover:bg-white/10'
                  }`}
                >
                  {Icon && <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />}
                  {item.label}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const ITEMS: MenuItem[] = [
  { id: 'edit', label: 'Editar', icon: Pencil },
  { id: 'duplicate', label: 'Duplicar', icon: Copy },
  { id: 'share', label: 'Compartir', icon: Share2, disabled: true },
  { id: 'delete', label: 'Eliminar', icon: Trash2, danger: true, separatorBefore: true },
];

/** Demo del registro: un menú de acciones que informa de la opción elegida. */
export function Demo() {
  const [last, setLast] = useState<string | null>(null);
  return (
    <div className="flex min-h-64 flex-col items-start gap-3">
      <DropdownMenu label="Acciones de la clase" items={ITEMS} onSelect={(itemId) => setLast(ITEMS.find((i) => i.id === itemId)?.label ?? null)} />
      <p role="status" className="m-0 text-xs text-slate-500">
        {last ? `Elegiste: ${last}` : 'Abre el menú con clic, Enter o la flecha abajo.'}
      </p>
    </div>
  );
}
