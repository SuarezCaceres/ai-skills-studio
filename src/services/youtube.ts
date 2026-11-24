import type { LessonVideo } from '../types/lessons';

/**
 * Enlaces de YouTube para las clases.
 *
 * Lo que la persona pega es texto NO fiable: aquí se extrae solo el identificador (de video o de
 * lista) y se valida con una expresión estricta. Lo que se guarda y se incrusta es ese ID; la URL del
 * iframe se construye siempre en `embedUrl`, nunca a partir de lo pegado.
 */

export type YouTubeKind = LessonVideo['kind'];

export type YouTubeParseResult = { ok: true; kind: YouTubeKind; youtubeId: string } | { ok: false; error: string };

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const PLAYLIST_ID = /^[A-Za-z0-9_-]{10,64}$/;

const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'youtube-nocookie.com', 'www.youtube-nocookie.com']);

/** Origen único desde el que se incrusta (debe coincidir con `frame-src` de la CSP en `index.html`). */
export const YOUTUBE_EMBED_ORIGIN = 'https://www.youtube-nocookie.com';

export function isValidYouTubeId(kind: unknown, id: unknown): boolean {
  if (typeof id !== 'string') return false;
  if (kind === 'video') return VIDEO_ID.test(id);
  if (kind === 'playlist') return PLAYLIST_ID.test(id);
  return false;
}

const fail = (error: string): YouTubeParseResult => ({ ok: false, error });

/**
 * Reconoce `watch?v=`, `youtu.be/`, `shorts/`, `embed/`, `live/` y `playlist?list=`.
 * Un enlace con `v=` y `list=` a la vez se toma como video suelto.
 */
export function parseYouTubeLink(text: string): YouTubeParseResult {
  const input = String(text ?? '').trim();
  if (!input) return fail('Pega el enlace de un video de YouTube.');
  if (/^[a-z][a-z0-9+.-]*:/i.test(input) && !/^https?:\/\//i.test(input)) {
    return fail('Solo se aceptan enlaces de YouTube (https://…).');
  }

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
  } catch {
    return fail('Eso no parece un enlace. Pega la dirección completa del video.');
  }
  if (!YOUTUBE_HOSTS.has(url.hostname.toLowerCase())) {
    return fail('Solo se aceptan enlaces de YouTube (youtube.com o youtu.be).');
  }

  const segments = url.pathname.split('/').filter(Boolean);
  const host = url.hostname.toLowerCase();
  let kind: YouTubeKind | null = null;
  let id: string | null = null;

  if (host === 'youtu.be') {
    kind = 'video';
    id = segments[0] ?? null;
  } else if (segments[0] === 'watch') {
    const v = url.searchParams.get('v');
    const list = url.searchParams.get('list');
    if (v) {
      kind = 'video';
      id = v;
    } else if (list) {
      kind = 'playlist';
      id = list;
    }
  } else if (segments[0] === 'playlist') {
    kind = 'playlist';
    id = url.searchParams.get('list');
  } else if (segments[0] === 'embed' && segments[1] === 'videoseries') {
    kind = 'playlist';
    id = url.searchParams.get('list');
  } else if (segments[0] === 'shorts' || segments[0] === 'embed' || segments[0] === 'live') {
    kind = 'video';
    id = segments[1] ?? null;
  }

  if (!kind || !id) return fail('No encontré un video ni una lista en ese enlace. Prueba con el enlace de «Compartir».');
  if (!isValidYouTubeId(kind, id)) return fail('El identificador del enlace no es válido.');
  return { ok: true, kind, youtubeId: id };
}

/** URL del reproductor (dominio sin cookies). Solo usa el ID ya validado. */
export function embedUrl(video: Pick<LessonVideo, 'kind' | 'youtubeId'>, options: { autoplay?: boolean } = {}): string {
  const id = encodeURIComponent(video.youtubeId);
  const params = new URLSearchParams({ rel: '0' });
  if (options.autoplay) params.set('autoplay', '1');
  if (video.kind === 'playlist') {
    params.set('list', video.youtubeId);
    return `${YOUTUBE_EMBED_ORIGIN}/embed/videoseries?${params.toString()}`;
  }
  return `${YOUTUBE_EMBED_ORIGIN}/embed/${id}?${params.toString()}`;
}

/** Miniatura del video. Las listas no tienen miniatura conocida de antemano. */
export function thumbnailUrl(video: Pick<LessonVideo, 'kind' | 'youtubeId'>): string | null {
  return video.kind === 'video' ? `https://i.ytimg.com/vi/${encodeURIComponent(video.youtubeId)}/hqdefault.jpg` : null;
}

/** Enlace para abrir el video en YouTube (alternativa si el reproductor no carga). */
export function watchUrl(video: Pick<LessonVideo, 'kind' | 'youtubeId'>): string {
  const id = encodeURIComponent(video.youtubeId);
  return video.kind === 'playlist' ? `https://www.youtube.com/playlist?list=${id}` : `https://www.youtube.com/watch?v=${id}`;
}

/** Nombre visible de una parte: su título o «Parte N» según el orden (empezando en 1). */
export function videoLabel(video: Pick<LessonVideo, 'title'>, index: number): string {
  return video.title.trim() || `Parte ${index + 1}`;
}
