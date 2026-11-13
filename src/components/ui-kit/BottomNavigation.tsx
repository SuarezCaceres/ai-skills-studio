import { useRef, useState, type KeyboardEvent } from 'react';
import { BookOpen, Boxes, Home, Settings, type LucideIcon } from 'lucide-react';

export interface BottomNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Contador opcional (por ejemplo, avisos sin leer). */
  badge?: number;
}

interface BottomNavigationProps {
  items: BottomNavItem[];
  activeId: string;
  onChange: (id: string) => void;
  label?: string;
}

/**
 * Barra de navegación inferior para móvil. Es un `<nav>` con botones; el activo lleva
 * `aria-current="page"`. Flecha izquierda/derecha, Inicio y Fin mueven el foco (roving tabindex).
 */
export function BottomNavigation({ items, activeId, onChange, label = 'Navegación principal' }: BottomNavigationProps) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next: number | undefined;
    if (event.key === 'ArrowRight') next = (index + 1) % items.length;
    if (event.key === 'ArrowLeft') next = (index - 1 + items.length) % items.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = items.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    refs.current[next]?.focus();
  };

  return (
    <nav aria-label={label} className="w-full border-t border-slate-800 bg-[#0d111a]">
      <ul className="m-0 flex list-none items-stretch p-0">
        {items.map((item, index) => {
          const active = item.id === activeId;
          const Icon = item.icon;
          return (
            <li key={item.id} className="min-w-0 flex-1">
              <button
                ref={(node) => {
                  refs.current[index] = node;
                }}
                type="button"
                tabIndex={active ? 0 : -1}
                aria-current={active ? 'page' : undefined}
                onClick={() => onChange(item.id)}
                onKeyDown={(event) => onKeyDown(event, index)}
                className={`relative flex min-h-14 w-full cursor-pointer flex-col items-center justify-center gap-1 border-0 bg-transparent px-1 py-2 text-[11px] font-medium transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#0ea5e9] ${
                  active ? 'text-[#38bdf8]' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {active && <span aria-hidden="true" className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-[#0ea5e9]" />}
                <span className="relative">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                  {item.badge ? (
                    <span className="absolute -right-2.5 -top-1.5 min-w-4 rounded-full bg-[#0ea5e9] px-1 text-center text-[10px] font-bold leading-4 text-[#0a0d14]">
                      <span aria-hidden="true">{item.badge}</span>
                      <span className="sr-only">{item.badge} sin leer</span>
                    </span>
                  ) : null}
                </span>
                <span className="truncate">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

const ITEMS: BottomNavItem[] = [
  { id: 'inicio', label: 'Inicio', icon: Home },
  { id: 'clases', label: 'Clases', icon: BookOpen, badge: 3 },
  { id: 'componentes', label: 'Componentes', icon: Boxes },
  { id: 'ajustes', label: 'Ajustes', icon: Settings },
];

/** Demo del registro: una pantalla de móvil que cambia de sección. */
export function Demo() {
  const [active, setActive] = useState('inicio');
  const current = ITEMS.find((item) => item.id === active);
  return (
    <div className="flex h-72 w-full max-w-xs flex-col overflow-hidden rounded-2xl border border-slate-700 bg-[#0a0d14]">
      <div className="flex flex-1 items-center justify-center p-4 text-center">
        <p className="m-0 text-sm text-slate-300" aria-live="polite">
          Sección: <strong className="text-white">{current?.label}</strong>
        </p>
      </div>
      <BottomNavigation items={ITEMS} activeId={active} onChange={setActive} />
    </div>
  );
}
