import { useRef, type KeyboardEvent } from 'react';
import { BookOpen, Users } from 'lucide-react';

export type LessonsTab = 'mis-clases' | 'comunidad';

const TABS: Array<{ id: LessonsTab; label: string; Icon: typeof BookOpen }> = [
  { id: 'mis-clases', label: 'Mis clases', Icon: BookOpen },
  { id: 'comunidad', label: 'Comunidad', Icon: Users },
];

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]';

export const tabId = (tab: LessonsTab) => `tab-${tab}`;
export const panelId = (tab: LessonsTab) => `panel-${tab}`;

interface LessonsTabsProps {
  value: LessonsTab;
  onChange: (tab: LessonsTab) => void;
}

/**
 * Pestañas reales «Mis clases | Comunidad»: `tablist`, una sola pestaña en el orden de tabulación y
 * flechas, Inicio y Fin para moverse (el foco acompaña a la selección).
 */
export function LessonsTabs({ value, onChange }: LessonsTabsProps) {
  const refs = useRef<Record<LessonsTab, HTMLButtonElement | null>>({ 'mis-clases': null, comunidad: null });

  const move = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % TABS.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + TABS.length) % TABS.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = TABS.length - 1;
    else return;
    event.preventDefault();
    const target = TABS[next].id;
    onChange(target);
    refs.current[target]?.focus();
  };

  return (
    <div role="tablist" aria-label="Clases" className="flex w-full gap-1 rounded-full border border-slate-700 bg-[#0a0d14] p-1 sm:w-fit">
      {TABS.map(({ id, label, Icon }, index) => {
        const selected = value === id;
        return (
          <button
            key={id}
            ref={(el) => {
              refs.current[id] = el;
            }}
            type="button"
            role="tab"
            id={tabId(id)}
            aria-selected={selected}
            aria-controls={panelId(id)}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(id)}
            onKeyDown={(e) => move(e, index)}
            className={`inline-flex h-10 min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border-0 px-5 text-sm font-semibold motion-safe:transition-colors sm:flex-none ${FOCUS} ${
              selected ? 'bg-[#0ea5e9] text-[#0a0d14]' : 'bg-transparent text-slate-300 hover:bg-white/[0.06] hover:text-white'
            }`}
          >
            <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
