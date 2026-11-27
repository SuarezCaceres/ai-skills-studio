/** Clases y utilidades compartidas por la galería y la modal de páginas de referencia (spec 007). */

/** Anillo de foco visible con el acento cian. */
export const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]';

/** Botón secundario con borde (el mismo lenguaje que Componentes). */
export const BUTTON = `inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-transparent px-3 text-xs font-semibold text-slate-100 hover:border-[#0ea5e9] hover:text-[#38bdf8] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-700 disabled:hover:text-slate-100 ${FOCUS}`;

/** Botón cuadrado solo con icono. */
export const ICON_BUTTON = `inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-700 bg-transparent text-slate-300 hover:border-[#0ea5e9] hover:text-[#38bdf8] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-700 disabled:hover:text-slate-300 ${FOCUS}`;

/** Elementos que pueden recibir el foco con Tab. */
export const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Elementos enfocables y visibles dentro de `root`, en orden de documento. */
export function focusableIn(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.getClientRects().length > 0);
}

/**
 * `true` si las flechas ↑/↓ deben quedarse en el elemento con el foco: campos de texto y controles
 * que ya usan esas flechas (grupo de radios, listas, menús, deslizadores).
 */
export function keepsVerticalArrows(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target.matches('input, textarea, select')) return true;
  if (
    target.closest('[role="radiogroup"], [role="listbox"], [role="menu"], [role="menubar"], [role="slider"], [role="spinbutton"], [role="combobox"], [role="tree"], [role="grid"]')
  ) {
    return true;
  }
  // Dentro de una zona con desplazamiento vertical (vista previa, prompt, código), ↑/↓ la recorren.
  for (let el: HTMLElement | null = target; el && el.getAttribute('role') !== 'dialog'; el = el.parentElement) {
    if (scrollsVertically(el)) return true;
  }
  return false;
}

function scrollsVertically(el: HTMLElement): boolean {
  const { overflowY } = window.getComputedStyle(el);
  return (overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 1;
}
