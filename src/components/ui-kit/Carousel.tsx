import { useEffect, useId, useState, type KeyboardEvent, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

interface CarouselProps {
  slides: ReactNode[];
  /** Nombre del carrusel para lectores de pantalla. */
  label: string;
  /** Milisegundos entre diapositivas; sin valor, no avanza solo. */
  autoplayMs?: number;
}

/**
 * Carrusel con el patrón WAI-ARIA: región con `aria-roledescription="carousel"`, cada diapositiva
 * es un grupo «N de M», Flecha izquierda/derecha cambian de diapositiva y el avance automático
 * (opcional) se detiene con el botón de pausa, con el foco dentro o con `prefers-reduced-motion`.
 */
export function Carousel({ slides, label, autoplayMs }: CarouselProps) {
  const id = useId();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  const go = (next: number) => setIndex(((next % count) + count) % count);

  useEffect(() => {
    if (!autoplayMs || !playing || paused) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % count), autoplayMs);
    return () => window.clearInterval(timer);
  }, [autoplayMs, playing, paused, count]);

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      go(index + 1);
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      go(index - 1);
    }
  };

  const control =
    'flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-slate-700 bg-[#0a0d14]/80 text-slate-100 transition-colors hover:border-[#0ea5e9] hover:text-[#38bdf8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]';

  return (
    <section
      aria-roledescription="carousel"
      aria-label={label}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="w-full overflow-hidden rounded-xl border border-slate-800 bg-[#121722]"
    >
      <div className="relative">
        <div
          id={`${id}-slides`}
          aria-live={playing && !paused ? 'off' : 'polite'}
          className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((slide, i) => (
            <div
              key={i}
              role="group"
              aria-roledescription="diapositiva"
              aria-label={`${i + 1} de ${count}`}
              aria-hidden={i !== index}
              // Las diapositivas fuera de vista no reciben foco.
              inert={i !== index}
              className="w-full shrink-0 basis-full"
            >
              {slide}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-slate-800 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <button type="button" className={control} onClick={() => go(index - 1)} aria-label="Diapositiva anterior" aria-controls={`${id}-slides`}>
            <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          </button>
          <button type="button" className={control} onClick={() => go(index + 1)} aria-label="Diapositiva siguiente" aria-controls={`${id}-slides`}>
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </button>
          {autoplayMs ? (
            <button
              type="button"
              className={control}
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? 'Detener el avance automático' : 'Iniciar el avance automático'}
            >
              {playing ? <Pause aria-hidden="true" className="h-4 w-4" /> : <Play aria-hidden="true" className="h-4 w-4" />}
            </button>
          ) : null}
        </div>
        <div role="group" aria-label="Elegir diapositiva" className="flex items-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ir a la diapositiva ${i + 1}`}
              aria-current={i === index ? 'true' : undefined}
              className="flex h-6 w-6 cursor-pointer items-center justify-center border-0 bg-transparent p-0 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[#0ea5e9]"
            >
              <span
                aria-hidden="true"
                className={`block h-2 rounded-full transition-all motion-reduce:transition-none ${
                  i === index ? 'w-5 bg-[#0ea5e9]' : 'w-2 bg-slate-600'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

const SLIDES = [
  { title: 'Skills', body: 'Instrucciones reutilizables que cargan los modelos.', from: '#0c4a6e' },
  { title: 'Hooks', body: 'Comandos que se ejecutan solos ante un evento.', from: '#134e4a' },
  { title: 'Worktrees', body: 'Varias ramas a la vez, cada una en su carpeta.', from: '#1e3a5f' },
  { title: 'Clases', body: 'Explicaciones de lo que ha hecho el equipo.', from: '#164e63' },
];

/** Demo del registro: cuatro diapositivas con avance automático opcional. */
export function Demo() {
  return (
    <div className="w-full max-w-xl">
      <Carousel
        label="Conceptos del equipo"
        autoplayMs={4000}
        slides={SLIDES.map((slide) => (
          <div
            key={slide.title}
            className="flex h-44 flex-col justify-end gap-1 p-5"
            style={{ background: `linear-gradient(135deg, ${slide.from}, #0a0d14)` }}
          >
            <h3 className="m-0 text-xl font-bold text-white">{slide.title}</h3>
            <p className="m-0 text-sm text-slate-300">{slide.body}</p>
          </div>
        ))}
      />
    </div>
  );
}
