import { useRef, useState, type KeyboardEvent } from 'react';
import { Bold, Italic, LayoutGrid, List, Underline } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface SegmentedProps {
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
}

/**
 * Grupo de opciones excluyentes (segmented control) con el patrón `radiogroup`:
 * una sola opción entra en el orden de tabulación y las flechas mueven la selección.
 */
export function SegmentedControl({ label, options, value, onChange }: SegmentedProps) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next: number | undefined;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % options.length;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + options.length) % options.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = options.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    onChange(options[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div role="radiogroup" aria-label={label} className="inline-flex overflow-hidden rounded-full border border-slate-700 bg-[#0a0d14] p-0.5">
      {options.map((option, index) => {
        const checked = option.value === value;
        return (
          <button
            key={option.value}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={`h-8 cursor-pointer rounded-full border-0 px-4 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0ea5e9] ${
              checked ? 'bg-[#0ea5e9] text-[#0a0d14]' : 'bg-transparent text-slate-300 hover:text-white'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

interface ToggleItem {
  id: string;
  label: string;
  icon: typeof Bold;
}

interface ToggleGroupProps {
  label: string;
  items: ToggleItem[];
  pressed: string[];
  onToggle: (id: string) => void;
}

/** Grupo de interruptores independientes (negrita, cursiva…): cada botón usa `aria-pressed`. */
export function ToggleGroup({ label, items, pressed, onToggle }: ToggleGroupProps) {
  return (
    <div role="group" aria-label={label} className="inline-flex -space-x-px">
      {items.map((item, index) => {
        const on = pressed.includes(item.id);
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={on}
            aria-label={item.label}
            title={item.label}
            onClick={() => onToggle(item.id)}
            className={`flex h-9 w-10 cursor-pointer items-center justify-center border text-slate-200 transition-colors focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0ea5e9] ${
              index === 0 ? 'rounded-l-lg' : ''
            } ${index === items.length - 1 ? 'rounded-r-lg' : ''} ${
              on ? 'border-[#0ea5e9] bg-[#0ea5e9]/20 text-[#38bdf8]' : 'border-slate-700 bg-transparent hover:bg-white/10'
            }`}
          >
            <Icon aria-hidden="true" className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}

const RANGES: Option[] = [
  { value: 'dia', label: 'Día' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mes' },
];

const FORMATS: ToggleItem[] = [
  { id: 'bold', label: 'Negrita', icon: Bold },
  { id: 'italic', label: 'Cursiva', icon: Italic },
  { id: 'underline', label: 'Subrayado', icon: Underline },
];

const VIEWS: Option[] = [
  { value: 'lista', label: 'Lista' },
  { value: 'cuadricula', label: 'Cuadrícula' },
];

/** Demo del registro: selección única, interruptores y vistas con icono. */
export function Demo() {
  const [range, setRange] = useState('semana');
  const [pressed, setPressed] = useState<string[]>(['bold']);
  const [view, setView] = useState('lista');
  return (
    <div className="flex flex-col items-start gap-6">
      <div className="flex flex-col gap-2">
        <SegmentedControl label="Rango de fechas" options={RANGES} value={range} onChange={setRange} />
        <p className="m-0 text-xs text-slate-500" aria-live="polite">
          Rango: {RANGES.find((r) => r.value === range)?.label}
        </p>
      </div>
      <ToggleGroup
        label="Formato del texto"
        items={FORMATS}
        pressed={pressed}
        onToggle={(id) => setPressed((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]))}
      />
      <div role="group" aria-label="Vista" className="inline-flex -space-x-px">
        {VIEWS.map((option, index) => {
          const on = view === option.value;
          const Icon = option.value === 'lista' ? List : LayoutGrid;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={on}
              onClick={() => setView(option.value)}
              className={`inline-flex h-9 cursor-pointer items-center gap-2 border px-4 text-xs font-semibold transition-colors focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0ea5e9] ${
                index === 0 ? 'rounded-l-full' : 'rounded-r-full'
              } ${on ? 'border-[#0ea5e9] bg-[#0ea5e9]/20 text-[#38bdf8]' : 'border-slate-700 bg-transparent text-slate-200 hover:bg-white/10'}`}
            >
              <Icon aria-hidden="true" className="h-4 w-4" />
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
