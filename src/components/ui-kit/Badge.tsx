import { useState, type ReactNode } from 'react';
import { X } from 'lucide-react';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

const TONES: Record<BadgeTone, { solid: string; soft: string; dot: string }> = {
  neutral: { solid: 'bg-slate-200 text-[#0a0d14]', soft: 'border-slate-700 bg-slate-800/60 text-slate-200', dot: 'bg-slate-400' },
  accent: { solid: 'bg-[#0ea5e9] text-[#0a0d14]', soft: 'border-[#0ea5e9]/40 bg-[#0ea5e9]/10 text-[#38bdf8]', dot: 'bg-[#0ea5e9]' },
  success: { solid: 'bg-emerald-400 text-[#0a0d14]', soft: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300', dot: 'bg-emerald-400' },
  warning: { solid: 'bg-amber-400 text-[#0a0d14]', soft: 'border-amber-500/40 bg-amber-950/30 text-amber-300', dot: 'bg-amber-400' },
  danger: { solid: 'bg-rose-400 text-[#0a0d14]', soft: 'border-rose-500/40 bg-rose-950/30 text-rose-300', dot: 'bg-rose-400' },
};

interface BadgeProps {
  tone?: BadgeTone;
  /** `soft` es el estilo con borde; `solid` es relleno. */
  variant?: 'soft' | 'solid';
  /** Punto de color delante del texto. */
  dot?: boolean;
  onRemove?: () => void;
  children: ReactNode;
}

/** Insignia pequeña para estados, categorías y etiquetas. Si se puede quitar, el botón lleva nombre accesible. */
export function Badge({ tone = 'neutral', variant = 'soft', dot = false, onRemove, children }: BadgeProps) {
  const t = TONES[tone];
  const skin = variant === 'solid' ? `border-transparent ${t.solid}` : t.soft;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${skin}`}>
      {dot && <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />}
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Quitar ${typeof children === 'string' ? children : 'etiqueta'}`}
          className="-mr-1 flex h-4 w-4 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-current opacity-70 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0ea5e9]"
        >
          <X aria-hidden="true" className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}

interface CountBadgeProps {
  count: number;
  /** Por encima de este valor se muestra «99+». */
  max?: number;
  label: string;
}

/** Contador (notificaciones, mensajes). El texto oculto dice a qué se refiere. */
export function CountBadge({ count, max = 99, label }: CountBadgeProps) {
  if (count <= 0) return null;
  return (
    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[#0ea5e9] px-1.5 text-[11px] font-bold leading-5 text-[#0a0d14]">
      <span aria-hidden="true">{count > max ? `${max}+` : count}</span>
      <span className="sr-only">
        {count} {label}
      </span>
    </span>
  );
}

const TONE_LIST: Array<[BadgeTone, string]> = [
  ['neutral', 'Borrador'],
  ['accent', 'Nuevo'],
  ['success', 'Aprobada'],
  ['warning', 'En revisión'],
  ['danger', 'Con errores'],
];

/** Demo del registro: variantes, punto, etiquetas que se quitan y contadores. */
export function Demo() {
  const [tags, setTags] = useState(['react', 'accesibilidad', 'worktrees']);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        {TONE_LIST.map(([tone, label]) => (
          <Badge key={tone} tone={tone}>
            {label}
          </Badge>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {TONE_LIST.map(([tone, label]) => (
          <Badge key={tone} tone={tone} variant="solid" dot={false}>
            {label}
          </Badge>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="success" dot>
          En línea
        </Badge>
        <Badge tone="warning" dot>
          Sincronizando
        </Badge>
        <Badge tone="danger" dot>
          Sin conexión
        </Badge>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {tags.map((tag) => (
          <Badge key={tag} tone="accent" onRemove={() => setTags((list) => list.filter((t) => t !== tag))}>
            {tag}
          </Badge>
        ))}
        {tags.length === 0 && <span className="text-xs text-slate-500">Sin etiquetas.</span>}
      </div>
      <div className="flex items-center gap-4 text-sm text-slate-300">
        Mensajes <CountBadge count={4} label="sin leer" />
        Avisos <CountBadge count={142} label="sin leer" />
      </div>
    </div>
  );
}
