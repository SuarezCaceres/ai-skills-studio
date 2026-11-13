import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Download, Loader2, Plus, Trash2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary: 'border-transparent bg-[#0ea5e9] text-[#0a0d14] hover:bg-[#38bdf8]',
  secondary: 'border-slate-700 bg-transparent text-slate-100 hover:border-[#0ea5e9] hover:text-[#38bdf8]',
  ghost: 'border-transparent bg-transparent text-slate-300 hover:bg-white/10 hover:text-white',
  danger: 'border-rose-500/50 bg-rose-950/30 text-rose-200 hover:bg-rose-900/50',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 gap-1.5 px-3 text-xs',
  md: 'h-10 gap-2 px-4 text-sm',
  lg: 'h-12 gap-2.5 px-6 text-base',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Mientras es `true` el botón no responde y avisa con `aria-busy`. */
  loading?: boolean;
  /** Texto que se anuncia mientras carga (por defecto «Cargando»). */
  loadingLabel?: string;
  icon?: ReactNode;
}

/** Botón con cuatro variantes, tres tamaños y estado de carga. Siempre `type="button"` salvo que se indique. */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingLabel = 'Cargando',
  icon,
  disabled,
  type = 'button',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex cursor-pointer items-center justify-center rounded-full border font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9] disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {loading ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : icon}
      {children}
      {loading && <span className="sr-only">{loadingLabel}</span>}
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Obligatorio: un botón de solo icono necesita nombre accesible. */
  label: string;
  variant?: Variant;
  children: ReactNode;
}

/** Botón cuadrado de solo icono; el nombre accesible sale de `label`. */
export function IconButton({ label, variant = 'secondary', children, className = '', type = 'button', ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9] disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

/** Demo del registro: variantes, tamaños, estados y un guardado simulado. */
export function Demo() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = () => {
    setSaved(false);
    setSaving(true);
    window.setTimeout(() => {
      setSaving(false);
      setSaved(true);
    }, 1200);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary">Principal</Button>
        <Button variant="secondary">Secundario</Button>
        <Button variant="ghost">Fantasma</Button>
        <Button variant="danger" icon={<Trash2 aria-hidden="true" className="h-4 w-4" />}>
          Eliminar
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm">Pequeño</Button>
        <Button size="md">Mediano</Button>
        <Button size="lg">Grande</Button>
        <Button disabled>Desactivado</Button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button loading={saving} loadingLabel="Guardando" onClick={save} icon={<Download aria-hidden="true" className="h-4 w-4" />}>
          {saving ? 'Guardando…' : 'Guardar copia'}
        </Button>
        <span role="status" className="text-xs text-emerald-300">
          {saved ? 'Copia guardada.' : ''}
        </span>
        <IconButton label="Añadir componente">
          <Plus aria-hidden="true" className="h-4 w-4" />
        </IconButton>
      </div>
    </div>
  );
}
