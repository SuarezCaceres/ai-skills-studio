import type { ReactNode } from 'react';
import { ArrowUpRight, Clock, Star } from 'lucide-react';

interface CardProps {
  title: string;
  children?: ReactNode;
  /** Zona superior (imagen, ilustración). */
  media?: ReactNode;
  footer?: ReactNode;
  /** Si se pasa, el título es un botón que cubre toda la tarjeta (sin anidar controles). */
  onOpen?: () => void;
  /** Nivel del encabezado para respetar la jerarquía de la página. */
  headingLevel?: 2 | 3 | 4;
}

/**
 * Tarjeta de contenido. Patrón accesible: el título es el único control que cubre la tarjeta
 * (`after:absolute after:inset-0`) y los enlaces secundarios van encima con `relative z-10`.
 */
export function Card({ title, children, media, footer, onOpen, headingLevel = 3 }: CardProps) {
  const Heading = `h${headingLevel}` as 'h2' | 'h3' | 'h4';
  const interactive = Boolean(onOpen);
  return (
    <article
      className={`group relative flex min-w-0 flex-col overflow-hidden rounded-xl border border-slate-800 bg-[#121722] transition-colors ${
        interactive ? 'hover:border-[#0ea5e9]/70 hover:bg-[#141b29] focus-within:border-[#0ea5e9]/70' : ''
      }`}
    >
      {media}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Heading className="m-0 text-base font-semibold leading-snug text-white">
          {onOpen ? (
            <button
              type="button"
              onClick={onOpen}
              className="cursor-pointer border-0 bg-transparent p-0 text-left font-[inherit] text-[inherit] after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
            >
              {title}
            </button>
          ) : (
            title
          )}
        </Heading>
        {children && <div className="text-sm leading-relaxed text-slate-400">{children}</div>}
      </div>
      {footer && <div className="mt-auto flex items-center gap-3 border-t border-slate-800/80 px-4 py-3 text-xs text-slate-500">{footer}</div>}
    </article>
  );
}

/** Ilustración de cabecera hecha con CSS (sin imágenes externas). */
function Cover({ tone }: { tone: 'sky' | 'emerald' }) {
  const from = tone === 'sky' ? '#0c4a6e' : '#064e3b';
  return (
    <div
      aria-hidden="true"
      className="h-28 w-full"
      style={{ background: `radial-gradient(circle at 25% 20%, #0ea5e9 0, transparent 45%), linear-gradient(135deg, ${from}, #0a0d14)` }}
    />
  );
}

/** Demo del registro: tarjeta simple, con cabecera, interactiva y con otra cabecera. */
export function Demo() {
  return (
    <div className="[display:grid] w-full max-w-3xl gap-4 sm:grid-cols-2">
      <Card title="Tarjeta sencilla">Un contenedor con título y texto, sin acciones.</Card>

      <Card
        title="Con cabecera"
        media={<Cover tone="sky" />}
        footer={
          <>
            <Clock aria-hidden="true" className="h-3.5 w-3.5" />
            Hace 2 días
          </>
        }
      >
        Una ilustración ocupa la parte superior y el pie guarda los metadatos.
      </Card>

      <Card
        title="Tarjeta interactiva"
        onOpen={() => undefined}
        footer={
          <>
            <span className="inline-flex items-center gap-1">
              <Star aria-hidden="true" className="h-3.5 w-3.5 text-amber-300" />
              4,8
            </span>
            <span className="ml-auto inline-flex items-center gap-1 text-[#38bdf8]">
              Abrir
              <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
            </span>
          </>
        }
      >
        Toda la tarjeta es clicable gracias a un único botón: el título.
      </Card>

      <Card title="Con cabecera verde" media={<Cover tone="emerald" />}>
        El mismo componente admite cualquier contenido en la zona superior.
      </Card>
    </div>
  );
}
