import { useState, type ReactNode } from 'react';
import { ArrowRight, Megaphone, RotateCcw, X } from 'lucide-react';

interface BannerProps {
  /** Texto breve; el énfasis va en `<strong>`. */
  children: ReactNode;
  action?: { label: string; href: string };
  onDismiss?: () => void;
  /** Nombre de la región para lectores de pantalla. */
  label?: string;
}

/**
 * Banner de anuncio a todo el ancho. Es una región con nombre (`role="region"`), no una alerta:
 * no interrumpe la lectura. Si se puede cerrar, el botón dice a qué banner afecta.
 */
export function Banner({ children, action, onDismiss, label = 'Anuncio' }: BannerProps) {
  return (
    <section
      aria-label={label}
      className="flex items-center gap-3 border-y border-[#0ea5e9]/30 bg-gradient-to-r from-[#0ea5e9]/15 via-[#0ea5e9]/5 to-transparent px-4 py-2.5 text-sm text-slate-200"
    >
      <Megaphone aria-hidden="true" className="h-4 w-4 shrink-0 text-[#38bdf8]" />
      <p className="m-0 min-w-0 flex-1 leading-snug">{children}</p>
      {action && (
        <a
          href={action.href}
          className="inline-flex shrink-0 items-center gap-1 rounded-sm font-semibold text-[#38bdf8] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]"
        >
          {action.label}
          <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
        </a>
      )}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={`Cerrar: ${label}`}
          className="-my-1 flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-slate-400 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0ea5e9]"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      )}
    </section>
  );
}

/** Demo del registro: un banner que se puede cerrar y otro fijo con enlace. */
export function Demo() {
  const [open, setOpen] = useState(true);
  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      {open ? (
        <Banner
          label="Novedades de Códice"
          action={{ label: 'Ver clases', href: '#clases' }}
          onDismiss={() => setOpen(false)}
        >
          <strong className="text-white">Nuevo:</strong> ya puedes subir clases y vincularlas a una skill.
        </Banner>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-full border border-slate-700 bg-transparent px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-[#0ea5e9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]"
        >
          <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
          Mostrar el banner
        </button>
      )}
      <Banner label="Mantenimiento">Mantenimiento programado el domingo de 02:00 a 03:00 (hora de Madrid).</Banner>
    </div>
  );
}
