import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

export interface AccordionItem {
  id: string;
  title: string;
  content: ReactNode;
  disabled?: boolean;
}

interface AccordionProps {
  items: AccordionItem[];
  /** `single` deja un panel abierto a la vez; `multiple` permite varios. */
  mode?: 'single' | 'multiple';
  defaultOpen?: string[];
}

/**
 * Acordeón con el patrón WAI-ARIA: cada cabecera es un botón con `aria-expanded` y
 * `aria-controls`; Flecha arriba/abajo, Inicio y Fin mueven el foco entre cabeceras.
 */
export function Accordion({ items, mode = 'single', defaultOpen = [] }: AccordionProps) {
  const baseId = useId();
  const [open, setOpen] = useState<string[]>(defaultOpen);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);

  const toggle = (id: string) =>
    setOpen((current) => {
      if (current.includes(id)) return current.filter((x) => x !== id);
      return mode === 'single' ? [id] : [...current, id];
    });

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const enabled = items.map((_, i) => i).filter((i) => !items[i].disabled);
    const position = enabled.indexOf(index);
    let next: number | undefined;
    if (event.key === 'ArrowDown') next = enabled[(position + 1) % enabled.length];
    if (event.key === 'ArrowUp') next = enabled[(position - 1 + enabled.length) % enabled.length];
    if (event.key === 'Home') next = enabled[0];
    if (event.key === 'End') next = enabled[enabled.length - 1];
    if (next === undefined) return;
    event.preventDefault();
    buttons.current[next]?.focus();
  };

  return (
    <div className="w-full divide-y divide-slate-800 overflow-hidden rounded-xl border border-slate-800 bg-[#121722]">
      {items.map((item, index) => {
        const expanded = open.includes(item.id);
        const buttonId = `${baseId}-${item.id}-button`;
        const panelId = `${baseId}-${item.id}-panel`;
        return (
          <div key={item.id}>
            <h3 className="m-0 text-base font-normal">
              <button
                ref={(node) => {
                  buttons.current[index] = node;
                }}
                id={buttonId}
                type="button"
                aria-expanded={expanded}
                aria-controls={panelId}
                disabled={item.disabled}
                onClick={() => toggle(item.id)}
                onKeyDown={(event) => onKeyDown(event, index)}
                className="flex w-full cursor-pointer items-center justify-between gap-3 border-0 bg-transparent px-4 py-3.5 text-left text-sm font-semibold text-slate-100 transition-colors hover:bg-[#171d2b] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#0ea5e9] disabled:cursor-not-allowed disabled:text-slate-500 disabled:hover:bg-transparent"
              >
                {item.title}
                <ChevronDown
                  aria-hidden="true"
                  className={`h-4 w-4 shrink-0 text-[#38bdf8] transition-transform motion-reduce:transition-none ${
                    expanded ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!expanded}
              className="px-4 pb-4 text-sm leading-relaxed text-slate-400"
            >
              {item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const FAQ: AccordionItem[] = [
  {
    id: 'skill',
    title: '¿Qué es una skill?',
    content: 'Un paquete de instrucciones (un SKILL.md y archivos de apoyo) que un modelo de IA carga cuando la tarea lo pide.',
  },
  {
    id: 'hook',
    title: '¿Qué es un hook?',
    content: 'Un comando que el entorno ejecuta solo cuando ocurre un evento, por ejemplo antes o después de usar una herramienta.',
  },
  {
    id: 'worktree',
    title: '¿Para qué sirve un worktree?',
    content: 'Para trabajar en varias ramas a la vez, cada una en su propia carpeta, sin pisar los cambios de las demás.',
  },
  { id: 'draft', title: 'Sección bloqueada', content: 'No se puede abrir.', disabled: true },
];

/** Demo del registro: un acordeón de un solo panel y otro que admite varios abiertos. */
export function Demo() {
  return (
    <div className="[display:grid] w-full max-w-xl gap-6">
      <div>
        <p className="mb-2 mt-0 font-mono text-[11px] uppercase tracking-wider text-slate-500">Un panel a la vez</p>
        <Accordion items={FAQ} defaultOpen={['skill']} />
      </div>
      <div>
        <p className="mb-2 mt-0 font-mono text-[11px] uppercase tracking-wider text-slate-500">Varios paneles</p>
        <Accordion items={FAQ.slice(0, 3)} mode="multiple" defaultOpen={['hook', 'worktree']} />
      </div>
    </div>
  );
}
