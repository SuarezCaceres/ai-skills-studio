import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export interface GalleryImage {
  id: string;
  src: string;
  /** Descripción real de la imagen (no «foto 1»). */
  alt: string;
  caption?: string;
}

interface GalleryProps {
  images: GalleryImage[];
  /** Nombre de la galería para lectores de pantalla. */
  label: string;
  /** `true` limita el visor a la caja `relative` más cercana (útil para previsualizarlo); si no, se dibuja en un portal sobre `document.body`. */
  contained?: boolean;
}

const FOCUSABLE = 'button:not([disabled])';

/**
 * Galería de miniaturas con visor ampliado. El visor es un `dialog` modal: Flecha izquierda/derecha
 * cambian de imagen, Escape cierra, Tab se queda dentro y el foco vuelve a la miniatura de origen.
 */
export function Gallery({ images, label, contained = false }: GalleryProps) {
  const titleId = useId();
  const [current, setCurrent] = useState<number | null>(null);
  const viewer = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const count = images.length;

  useEffect(() => {
    if (current === null) return;
    viewer.current?.querySelector<HTMLElement>('[data-close]')?.focus();
    // Solo al abrir: cambiar de imagen no debe mover el foco.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current === null]);

  const open = (index: number, trigger: HTMLElement) => {
    opener.current = trigger;
    setCurrent(index);
  };

  const close = () => {
    setCurrent(null);
    window.requestAnimationFrame(() => opener.current?.focus());
  };

  const step = (delta: number) => setCurrent((i) => (i === null ? i : (i + delta + count) % count));

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      close();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      step(1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      step(-1);
    } else if (event.key === 'Tab' && viewer.current) {
      const items = Array.from(viewer.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  const image = current === null ? null : images[current];
  const nav =
    'flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-slate-600 bg-black/60 text-white hover:border-[#0ea5e9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]';

  const overlay = image ? (
    <div className={`${contained ? 'absolute z-10' : 'fixed z-[60]'} inset-0`}>
      <div aria-hidden="true" onClick={close} className="absolute inset-0 bg-black/85" />
      <div
        ref={viewer}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={onKeyDown}
        className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4"
      >
        <p id={titleId} className="sr-only">
          {label}: imagen {(current ?? 0) + 1} de {count}
        </p>
        <button data-close type="button" onClick={close} aria-label="Cerrar visor" className={`${nav} absolute right-3 top-3`}>
          <X aria-hidden="true" className="h-5 w-5" />
        </button>
        <div className="flex min-h-0 w-full max-w-2xl flex-1 items-center justify-center gap-3">
          <button type="button" onClick={() => step(-1)} aria-label="Imagen anterior" className={nav}>
            <ChevronLeft aria-hidden="true" className="h-5 w-5" />
          </button>
          <img src={image.src} alt={image.alt} className="max-h-full min-w-0 flex-1 rounded-lg object-contain" />
          <button type="button" onClick={() => step(1)} aria-label="Imagen siguiente" className={nav}>
            <ChevronRight aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
        <p className="m-0 text-center text-sm text-slate-200" aria-live="polite">
          {image.caption ?? image.alt} <span className="text-slate-500">· {(current ?? 0) + 1}/{count}</span>
        </p>
      </div>
    </div>
  ) : null;

  return (
    <>
      <ul aria-label={label} className="m-0 [display:grid] list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3">
        {images.map((item, index) => (
          <li key={item.id} className="min-w-0">
            <button
              type="button"
              onClick={(event) => open(index, event.currentTarget)}
              aria-haspopup="dialog"
              className="group block w-full cursor-pointer overflow-hidden rounded-lg border border-slate-800 bg-[#0a0d14] p-0 transition-colors hover:border-[#0ea5e9]/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]"
            >
              <img src={item.src} alt={item.alt} loading="lazy" className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none" />
            </button>
          </li>
        ))}
      </ul>

      {overlay && (contained ? overlay : createPortal(overlay, document.body))}
    </>
  );
}

/** Genera una ilustración SVG (en cian, verde y grises) para no depender de fotos externas. */
function artwork(seed: number, hue: string): string {
  const shapes = Array.from({ length: 5 }, (_, i) => {
    const x = (seed * 37 + i * 61) % 320;
    const y = (seed * 53 + i * 47) % 200;
    const r = 18 + ((seed + i * 13) % 42);
    return `<circle cx='${x}' cy='${y}' r='${r}' fill='${hue}' fill-opacity='${0.12 + i * 0.1}'/>`;
  }).join('');
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 240'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#0f1b2d'/><stop offset='1' stop-color='#0a0d14'/></linearGradient></defs><rect width='320' height='240' fill='url(#g)'/>${shapes}<path d='M0 190 C80 150 160 220 320 170 V240 H0Z' fill='${hue}' fill-opacity='0.35'/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const SAMPLES: Array<[string, string, string]> = [
  ['Amanecer sobre colinas azules', '#0ea5e9', 'Colinas'],
  ['Burbujas de luz en un fondo oscuro', '#38bdf8', 'Burbujas'],
  ['Olas verdes bajo la noche', '#10b981', 'Olas'],
  ['Círculos grises superpuestos', '#94a3b8', 'Círculos'],
  ['Neblina cian al atardecer', '#0284c7', 'Neblina'],
  ['Montañas de esmeralda', '#34d399', 'Montañas'],
];

/** Demo del registro: seis ilustraciones y un visor contenido en la caja. */
export function Demo() {
  const images = useMemo<GalleryImage[]>(
    () => SAMPLES.map(([alt, hue, caption], i) => ({ id: `img-${i}`, src: artwork(i + 3, hue), alt, caption })),
    []
  );
  return (
    <div className="relative min-h-72 w-full max-w-2xl overflow-hidden rounded-xl border border-slate-800 bg-[#121722] p-3">
      <Gallery images={images} label="Ilustraciones de ejemplo" contained />
    </div>
  );
}
