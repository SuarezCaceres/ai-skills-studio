import { useState, type KeyboardEvent } from 'react';
import { ArrowDown, ArrowUp, ListVideo, Plus, Trash2 } from 'lucide-react';
import type { LessonVideo } from '../../types/lessons';
import { LIMITS, uniqueVideoId } from '../../services/lessonsStore';
import { parseYouTubeLink, thumbnailUrl, videoLabel } from '../../services/youtube';

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]';
const INPUT =
  'w-full rounded-lg border border-slate-700 bg-[#0a0d14] px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#0ea5e9] aria-[invalid=true]:border-rose-500/70';
const ICON_BUTTON =
  'flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-700 bg-transparent p-0 text-slate-300 hover:border-[#0ea5e9] hover:text-[#38bdf8] aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:hover:border-slate-700 aria-disabled:hover:text-slate-300';

/** Interpreta el enlace pegado y lo añade al final. Devuelve la lista nueva o el error en español. */
export function addVideoFromLink(input: string, videos: LessonVideo[]): { videos: LessonVideo[] } | { error: string } {
  if (videos.length >= LIMITS.videos) return { error: `Como máximo ${LIMITS.videos} partes de video.` };
  const parsed = parseYouTubeLink(input);
  if (!parsed.ok) return { error: parsed.error };
  if (videos.some((v) => v.kind === parsed.kind && v.youtubeId === parsed.youtubeId)) {
    return { error: 'Ese video ya está en la lista.' };
  }
  const id = uniqueVideoId(videos.map((v) => v.id));
  return { videos: [...videos, { id, kind: parsed.kind, youtubeId: parsed.youtubeId, title: '' }] };
}

function PartThumb({ video }: { video: LessonVideo }) {
  const src = thumbnailUrl(video);
  const [failed, setFailed] = useState(false);
  return (
    <span aria-hidden="true" className="relative flex aspect-video w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-800 bg-[#121722] text-slate-500 sm:w-24">
      {src && !failed ? (
        <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover" />
      ) : (
        <ListVideo className="h-5 w-5" />
      )}
    </span>
  );
}

interface VideoPartsFieldProps {
  videos: LessonVideo[];
  onChange: (next: LessonVideo[]) => void;
  /** Texto del campo de enlace (lo controla el formulario para poder añadir lo pendiente al guardar). */
  input: string;
  onInputChange: (value: string) => void;
  /** Error de la última tentativa de añadir. */
  linkError?: string;
  onLinkError: (message: string | undefined) => void;
  /** Error de validación del conjunto (límite, parte no válida). */
  error?: string;
}

/**
 * Campo «Videos de YouTube» del editor: pegar un enlace y añadirlo (Enter o botón), título opcional,
 * reordenar con botones y quitar. Todo se maneja con teclado y los cambios se anuncian en una región
 * `aria-live`.
 */
export function VideoPartsField({ videos, onChange, input, onInputChange, linkError, onLinkError, error }: VideoPartsFieldProps) {
  const [announce, setAnnounce] = useState('');
  const full = videos.length >= LIMITS.videos;

  const add = () => {
    if (!input.trim()) {
      onLinkError('Pega el enlace de un video de YouTube.');
      return;
    }
    const result = addVideoFromLink(input, videos);
    if ('error' in result) {
      onLinkError(result.error);
      return;
    }
    onChange(result.videos);
    onInputChange('');
    onLinkError(undefined);
    setAnnounce(`Parte ${result.videos.length} añadida.`);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      add();
    }
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= videos.length) return;
    const next = videos.slice();
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
    setAnnounce(`${videoLabel(item, to)} movida a la posición ${to + 1} de ${next.length}.`);
  };

  const remove = (index: number) => {
    const label = videoLabel(videos[index], index);
    onChange(videos.filter((_, i) => i !== index));
    setAnnounce(`${label} quitada.`);
    document.getElementById('lesson-video-input')?.focus();
  };

  const rename = (index: number, title: string) => onChange(videos.map((v, i) => (i === index ? { ...v, title } : v)));

  const describedBy = [linkError ? 'err-video-link' : 'hint-video', error ? 'err-videos' : ''].filter(Boolean).join(' ');

  return (
    <div>
      <label htmlFor="lesson-video-input" className="mb-1.5 block text-sm font-semibold text-white">
        Videos de YouTube <span className="font-normal text-slate-500">(opcional)</span>
      </label>
      <div className="flex items-start gap-2">
        <input
          id="lesson-video-input"
          type="text"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          value={input}
          onChange={(e) => {
            onInputChange(e.target.value);
            if (linkError) onLinkError(undefined);
          }}
          onKeyDown={onKeyDown}
          disabled={full}
          placeholder={full ? 'Máximo alcanzado' : 'https://www.youtube.com/watch?v=…'}
          aria-invalid={linkError || error ? true : undefined}
          aria-describedby={describedBy}
          className={`${INPUT} h-10`}
        />
        <button
          type="button"
          onClick={add}
          disabled={full}
          className={`inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-[#0ea5e9]/60 bg-[#0ea5e9]/10 px-3.5 text-sm font-semibold text-[#38bdf8] hover:bg-[#0ea5e9]/20 disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`}
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          Añadir
        </button>
      </div>
      {linkError ? (
        <p id="err-video-link" className="m-0 mt-1 text-xs text-rose-300">
          {linkError}
        </p>
      ) : (
        <p id="hint-video" className="m-0 mt-1 text-[11px] text-slate-500">
          Pega un video, un short o una lista de reproducción. Puedes añadir varias partes ({videos.length} de {LIMITS.videos}).
        </p>
      )}
      {error && (
        <p id="err-videos" className="m-0 mt-1 text-xs text-rose-300">
          {error}
        </p>
      )}

      {videos.length > 0 && (
        <ol aria-label="Partes del video" className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
          {videos.map((video, index) => (
            <li key={video.id} className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-[#0d1118] p-2">
              <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800 font-mono text-xs font-semibold text-slate-300">
                {index + 1}
              </span>
              <PartThumb video={video} />
              <div className="min-w-0 flex-1">
                <input
                  type="text"
                  value={video.title}
                  onChange={(e) => rename(index, e.target.value)}
                  maxLength={LIMITS.videoTitle}
                  aria-label={`Título de la parte ${index + 1} (opcional)`}
                  placeholder={`Parte ${index + 1}`}
                  className={`${INPUT} h-9`}
                />
                <p className="m-0 mt-1 truncate font-mono text-[11px] text-slate-500">
                  {video.kind === 'playlist' ? 'Lista' : 'Video'} · {video.youtubeId}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => move(index, index - 1)}
                  aria-disabled={index === 0 ? true : undefined}
                  aria-label={`Subir la parte ${index + 1}`}
                  className={`${ICON_BUTTON} ${FOCUS}`}
                >
                  <ArrowUp aria-hidden="true" className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, index + 1)}
                  aria-disabled={index === videos.length - 1 ? true : undefined}
                  aria-label={`Bajar la parte ${index + 1}`}
                  className={`${ICON_BUTTON} ${FOCUS}`}
                >
                  <ArrowDown aria-hidden="true" className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label={`Quitar la parte ${index + 1}`}
                  className={`${ICON_BUTTON} hover:!border-rose-500/70 hover:!text-rose-300 ${FOCUS}`}
                >
                  <Trash2 aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
      <p role="status" aria-live="polite" className="sr-only">
        {announce}
      </p>
    </div>
  );
}
