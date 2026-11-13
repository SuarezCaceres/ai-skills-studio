import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

const DAY_MS = 86_400_000;

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const addMonths = (d: Date, n: number) => {
  // Si el día no existe en el mes destino (31 → febrero) se queda en el último día de ese mes.
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(d.getDate(), last));
};
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const keyOf = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
/** Lunes = 0 … domingo = 6. */
const weekdayIndex = (d: Date) => (d.getDay() + 6) % 7;

const formatShort = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
const formatLong = new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const monthFormat = new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' });
/** «noviembre de 2026» → «Noviembre de 2026» (solo la primera letra, no las preposiciones). */
const monthTitle = { format: (d: Date) => monthFormat.format(d).replace(/^./, (c) => c.toUpperCase()) };

/** Convierte «d/m/aaaa» en fecha; devuelve `null` si no es una fecha real. */
export function parseDate(text: string): Date | null {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text.trim());
  if (!match) return null;
  const [d, m, y] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d ? date : null;
}

interface CalendarProps {
  value: Date | null;
  min?: Date;
  max?: Date;
  onSelect: (date: Date) => void;
  onEscape: () => void;
}

/**
 * Calendario mensual con el patrón `grid` de WAI-ARIA. Flechas: ±1 día / ±1 semana; Inicio y Fin:
 * lunes y domingo; RePág y AvPág: mes anterior y siguiente (con Mayús, año). Enter o Espacio eligen.
 */
export function Calendar({ value, min, max, onSelect, onEscape }: CalendarProps) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [focused, setFocused] = useState<Date>(() => value ?? today);
  const refs = useRef(new Map<string, HTMLButtonElement>());
  const moveFocus = useRef(false);
  const gridId = useId();

  const clamp = (d: Date) => (min && d < min ? min : max && d > max ? max : d);
  const disabled = (d: Date) => Boolean((min && d < min) || (max && d > max));

  // Seis semanas completas, de lunes a domingo, que contienen el mes enfocado.
  const weeks = useMemo(() => {
    const first = new Date(focused.getFullYear(), focused.getMonth(), 1);
    const start = addDays(first, -weekdayIndex(first));
    return Array.from({ length: 6 }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)));
  }, [focused]);

  const weekdays = useMemo(() => {
    const monday = new Date(2024, 0, 1);
    const short = new Intl.DateTimeFormat('es', { weekday: 'short' });
    const long = new Intl.DateTimeFormat('es', { weekday: 'long' });
    return Array.from({ length: 7 }, (_, i) => ({ short: short.format(addDays(monday, i)).replace('.', ''), long: long.format(addDays(monday, i)) }));
  }, []);

  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    refs.current.get(keyOf(focused))?.focus();
  }, [focused]);

  // Al abrir, el foco entra en el día elegido (o en hoy).
  useEffect(() => {
    refs.current.get(keyOf(focused))?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const move = (next: Date) => {
    moveFocus.current = true;
    setFocused(clamp(next));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const k = event.key;
    const handlers: Record<string, () => Date> = {
      ArrowLeft: () => addDays(focused, -1),
      ArrowRight: () => addDays(focused, 1),
      ArrowUp: () => addDays(focused, -7),
      ArrowDown: () => addDays(focused, 7),
      Home: () => addDays(focused, -weekdayIndex(focused)),
      End: () => addDays(focused, 6 - weekdayIndex(focused)),
      PageUp: () => addMonths(focused, event.shiftKey ? -12 : -1),
      PageDown: () => addMonths(focused, event.shiftKey ? 12 : 1),
    };
    if (k === 'Escape') {
      event.preventDefault();
      onEscape();
      return;
    }
    const next = handlers[k];
    if (!next) return;
    event.preventDefault();
    move(next());
  };

  const nav =
    'flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-slate-700 bg-transparent text-slate-200 hover:border-[#0ea5e9] hover:text-[#38bdf8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]';

  return (
    <div onKeyDown={onKeyDown} className="w-72 select-none">
      <div className="mb-2 flex items-center justify-between">
        <button type="button" className={nav} onClick={() => setFocused(clamp(addMonths(focused, -1)))} aria-label="Mes anterior">
          <ChevronLeft aria-hidden="true" className="h-4 w-4" />
        </button>
        <p id={`${gridId}-title`} aria-live="polite" className="m-0 text-sm font-semibold text-white">
          {monthTitle.format(focused)}
        </p>
        <button type="button" className={nav} onClick={() => setFocused(clamp(addMonths(focused, 1)))} aria-label="Mes siguiente">
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>

      <table role="grid" aria-labelledby={`${gridId}-title`} className="w-full border-collapse text-center">
        <thead>
          <tr>
            {weekdays.map((day) => (
              <th key={day.long} scope="col" abbr={day.long} className="pb-1 text-[11px] font-medium capitalize text-slate-500">
                {day.short}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={keyOf(week[0])}>
              {week.map((day) => {
                const inMonth = day.getMonth() === focused.getMonth();
                const selected = value ? sameDay(day, value) : false;
                const isToday = sameDay(day, today);
                const off = disabled(day);
                const isFocus = sameDay(day, focused);
                return (
                  <td key={keyOf(day)} role="gridcell" aria-selected={selected} className="p-0.5">
                    <button
                      ref={(node) => {
                        if (node) refs.current.set(keyOf(day), node);
                        else refs.current.delete(keyOf(day));
                      }}
                      type="button"
                      tabIndex={isFocus ? 0 : -1}
                      disabled={off}
                      aria-label={formatLong.format(day)}
                      aria-current={isToday ? 'date' : undefined}
                      onClick={() => onSelect(day)}
                      className={`h-9 w-9 cursor-pointer rounded-full border text-sm tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0ea5e9] disabled:cursor-not-allowed disabled:opacity-30 ${
                        selected
                          ? 'border-[#0ea5e9] bg-[#0ea5e9] font-bold text-[#0a0d14]'
                          : isToday
                            ? 'border-[#0ea5e9]/60 bg-transparent font-semibold text-[#38bdf8] hover:bg-white/10'
                            : `border-transparent bg-transparent hover:bg-white/10 ${inMonth ? 'text-slate-100' : 'text-slate-600'}`
                      }`}
                    >
                      {day.getDate()}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mb-0 mt-2 text-[11px] text-slate-500">Flechas para moverte · RePág y AvPág cambian de mes · Esc cierra</p>
    </div>
  );
}

interface DatepickerProps {
  label: string;
  value: Date | null;
  onChange: (value: Date | null) => void;
  min?: Date;
  max?: Date;
}

/** Campo de fecha: se puede escribir («d/m/aaaa») o elegir en el calendario desplegable. */
export function Datepicker({ label, value, onChange, min, max }: DatepickerProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(value ? formatShort(value) : '');
  const [error, setError] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setText(value ? formatShort(value) : '');
    setError('');
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const commit = (raw: string) => {
    if (raw.trim() === '') {
      setError('');
      onChange(null);
      return;
    }
    const parsed = parseDate(raw);
    if (!parsed) return setError('Escribe una fecha real con el formato d/m/aaaa.');
    if ((min && parsed < min) || (max && parsed > max)) {
      return setError(`La fecha debe estar entre ${min ? formatShort(min) : '…'} y ${max ? formatShort(max) : '…'}.`);
    }
    setError('');
    onChange(parsed);
  };

  return (
    <div ref={root} className="relative w-64">
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-slate-300">
        {label}
      </label>
      <div className={`flex items-center rounded-lg border bg-[#0a0d14] focus-within:border-[#0ea5e9] ${error ? 'border-rose-500/70' : 'border-slate-700'}`}>
        <input
          id={id}
          value={text}
          inputMode="numeric"
          placeholder="dd/mm/aaaa"
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => commit(text)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit(text);
            if (e.key === 'ArrowDown' && e.altKey) setOpen(true);
          }}
          className="h-10 min-w-0 flex-1 border-0 bg-transparent px-3 text-sm text-white outline-none placeholder:text-slate-500"
        />
        <button
          ref={toggle}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={value ? `Cambiar fecha, ${formatLong.format(value)}` : 'Elegir fecha'}
          onClick={() => setOpen((o) => !o)}
          className="mr-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-slate-300 hover:bg-white/10 hover:text-[#38bdf8] focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[#0ea5e9]"
        >
          <CalendarDays aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="mb-0 mt-1.5 text-xs text-rose-300">
          {error}
        </p>
      )}
      {open && (
        <div
          role="dialog"
          aria-label={`Calendario: ${label}`}
          className="absolute left-0 top-full z-20 mt-2 rounded-xl border border-slate-700 bg-[#121722] p-3 shadow-2xl shadow-black/60"
        >
          <Calendar
            value={value}
            min={min}
            max={max}
            onSelect={(date) => {
              onChange(date);
              setOpen(false);
              toggle.current?.focus();
            }}
            onEscape={() => {
              setOpen(false);
              toggle.current?.focus();
            }}
          />
        </div>
      )}
    </div>
  );
}

/** Demo del registro: fecha libre y fecha limitada a los próximos 30 días. */
export function Demo() {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [free, setFree] = useState<Date | null>(null);
  const [limited, setLimited] = useState<Date | null>(null);
  const days = (a: Date | null) => (a ? Math.round((a.getTime() - today.getTime()) / DAY_MS) : null);
  return (
    <div className="flex min-h-[26rem] flex-wrap items-start gap-8">
      <div className="flex flex-col gap-2">
        <Datepicker label="Fecha de la clase" value={free} onChange={setFree} />
        <p role="status" className="m-0 text-xs text-slate-500">
          {free ? formatLong.format(free) : 'Sin fecha elegida.'}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Datepicker label="Entrega (próximos 30 días)" value={limited} onChange={setLimited} min={today} max={addDays(today, 30)} />
        <p role="status" className="m-0 text-xs text-slate-500">
          {limited ? `Faltan ${days(limited)} días.` : 'Sin fecha elegida.'}
        </p>
      </div>
    </div>
  );
}
