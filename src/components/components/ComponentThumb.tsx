import { useState } from 'react';
import { Boxes } from 'lucide-react';
import type { UiComponentEntry } from '../../types/uiComponents';
import { thumbnailUrl } from '../../data/componentRegistry';

interface ComponentThumbProps {
  entry: UiComponentEntry;
  /** Ancho en píxeles; el alto sale de la proporción 8:5 de las capturas (640×400). */
  width: number;
  className?: string;
  /** `true` si la imagen es decorativa (por ejemplo, junto al nombre en la lista). */
  decorative?: boolean;
  /** `true` hace que ocupe todo el ancho del contenedor manteniendo la proporción. */
  fluid?: boolean;
}

/**
 * Miniatura del componente: la captura generada por `scripts/capture-components.mjs` a partir del
 * propio componente. Si el archivo no existe o falla, muestra un icono en su lugar.
 */
export function ComponentThumb({ entry, width, className = '', decorative = false, fluid = false }: ComponentThumbProps) {
  const [failed, setFailed] = useState(false);
  const height = Math.round((width * 400) / 640);
  const box = fluid ? undefined : { width, height };
  const fluidClass = fluid ? 'aspect-[8/5] h-auto w-full' : '';

  if (failed) {
    return (
      <span
        aria-hidden="true"
        style={box}
        className={`flex shrink-0 items-center justify-center rounded-md border border-slate-800 bg-[#0a0d14] text-slate-600 ${fluidClass} ${className}`}
      >
        <Boxes className="h-4 w-4" />
      </span>
    );
  }
  return (
    <img
      src={thumbnailUrl(entry)}
      alt={decorative ? '' : `Captura generada del componente ${entry.name}`}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      style={box}
      className={`shrink-0 rounded-md border border-slate-800 bg-[#0a0d14] object-cover ${fluidClass} ${className}`}
    />
  );
}
