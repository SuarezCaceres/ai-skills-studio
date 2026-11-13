import { useState } from 'react';
import { ListVideo, PlayCircle } from 'lucide-react';
import type { LessonVideo } from '../../types/lessons';
import { videoLabel } from '../../services/youtube';
import { VideoPlayer } from './VideoPlayer';

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]';

interface LessonVideosProps {
  lessonTitle: string;
  videos: LessonVideo[];
}

/**
 * Videos de una clase: el reproductor de la parte activa y, si hay varias, la lista de partes.
 * Cambiar de parte mientras se reproduce carga la nueva directamente (la persona ya pulsó play);
 * si todavía no se reprodujo nada, solo cambia la miniatura.
 */
export function LessonVideos({ lessonTitle, videos }: LessonVideosProps) {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  if (videos.length === 0) return null;

  const index = Math.min(active, videos.length - 1);
  const video = videos[index];
  const multiple = videos.length > 1;

  return (
    <section aria-labelledby="lesson-videos" className="space-y-3">
      <h2 id="lesson-videos" className="m-0 flex flex-wrap items-center gap-x-2 text-sm font-semibold text-white">
        <PlayCircle aria-hidden="true" className="h-4 w-4 text-[#38bdf8]" />
        {multiple ? 'Videos de la clase' : 'Video de la clase'}
        {multiple && (
          <span className="font-normal text-slate-500">
            · Parte {index + 1} de {videos.length}
          </span>
        )}
      </h2>

      <div className={`[display:grid] items-start gap-4 ${multiple ? 'lg:grid-cols-[minmax(0,1fr)_320px]' : ''}`}>
        <VideoPlayer
          key={video.id}
          video={video}
          label={videoLabel(video, index)}
          lessonTitle={lessonTitle}
          playing={playing}
          onPlay={() => setPlaying(true)}
        />

        {multiple && (
          <ol aria-label="Partes del video" className="m-0 flex list-none flex-col gap-2 p-0 lg:max-h-[420px] lg:overflow-y-auto">
            {videos.map((item, i) => {
              const current = i === index;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-current={current ? 'true' : undefined}
                    onClick={() => setActive(i)}
                    className={`flex min-h-11 w-full min-w-0 cursor-pointer items-center gap-3 rounded-xl border p-2.5 text-left transition-colors ${FOCUS} ${
                      current
                        ? 'border-[#0ea5e9]/70 bg-sky-500/10 text-white'
                        : 'border-slate-800 bg-[#121722] text-slate-300 hover:border-[#0ea5e9]/50 hover:bg-[#141b29]'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-semibold ${
                        current ? 'bg-[#0ea5e9] text-[#030712]' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{videoLabel(item, i)}</span>
                    {item.kind === 'playlist' && <ListVideo aria-label="Lista de reproducción" className="h-4 w-4 shrink-0 text-slate-500" />}
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}
