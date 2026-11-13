import { useState } from 'react';
import { ExternalLink, ListVideo, Play } from 'lucide-react';
import type { LessonVideo } from '../../types/lessons';
import { embedUrl, thumbnailUrl, watchUrl } from '../../services/youtube';

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]';

interface VideoPlayerProps {
  video: LessonVideo;
  /** Nombre visible de la parte («Parte 2» o su título). */
  label: string;
  lessonTitle: string;
  playing: boolean;
  onPlay: () => void;
}

/**
 * Reproductor de una parte. No carga nada de YouTube hasta que la persona pulsa play (miniatura +
 * botón): menos peticiones a terceros y sin reproducción automática al abrir la clase. El espacio
 * 16:9 está reservado desde el primer momento, así que la página no se mueve al cargar.
 */
export function VideoPlayer({ video, label, lessonTitle, playing, onPlay }: VideoPlayerProps) {
  const thumb = thumbnailUrl(video);
  const [thumbFailed, setThumbFailed] = useState(false);

  return (
    <div className="min-w-0 space-y-2">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-800 bg-[#0a0d14]">
        {playing ? (
          <iframe
            src={embedUrl(video, { autoplay: true })}
            title={`Video: ${label} (${lessonTitle})`}
            className="absolute inset-0 h-full w-full border-0"
            loading="lazy"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox"
          />
        ) : (
          <button
            type="button"
            onClick={onPlay}
            aria-label={`Reproducir: ${label}`}
            className={`group absolute inset-0 flex h-full w-full cursor-pointer items-center justify-center border-0 bg-transparent p-0 ${FOCUS} focus-visible:outline-offset-[-4px]`}
          >
            {thumb && !thumbFailed ? (
              <img
                src={thumb}
                alt=""
                loading="lazy"
                onError={() => setThumbFailed(true)}
                className="absolute inset-0 h-full w-full object-cover opacity-80"
              />
            ) : (
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#121722] text-slate-500">
                <ListVideo aria-hidden="true" className="h-8 w-8" />
                <span className="text-xs">{video.kind === 'playlist' ? 'Lista de reproducción' : 'Video de YouTube'}</span>
              </span>
            )}
            <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#030712]/80 via-transparent to-transparent" />
            <span
              aria-hidden="true"
              className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#0ea5e9] text-[#030712] shadow-[0_0_24px_rgba(14,165,233,0.45)] motion-safe:transition-transform motion-safe:duration-200 group-hover:bg-[#38bdf8] motion-safe:group-hover:scale-105"
            >
              <Play className="ml-0.5 h-6 w-6 fill-current" />
            </span>
          </button>
        )}
      </div>

      <p className="m-0 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-slate-500">
        <span className="min-w-0 truncate">{label}</span>
        <a
          href={watchUrl(video)}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex min-h-6 items-center gap-1 rounded text-slate-400 hover:text-[#38bdf8] hover:underline ${FOCUS}`}
        >
          Abrir en YouTube
          <ExternalLink aria-hidden="true" className="h-3 w-3" />
        </a>
      </p>
    </div>
  );
}
