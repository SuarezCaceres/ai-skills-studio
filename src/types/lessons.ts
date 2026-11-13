export type LessonLevel = 'Principiante' | 'Intermedio' | 'Avanzado';

export const LESSON_LEVELS: LessonLevel[] = ['Principiante', 'Intermedio', 'Avanzado'];

export interface LessonAuthor {
  /** Login de GitHub de quien subió la clase. */
  login: string;
  avatarUrl?: string;
  profileUrl: string;
}

/** Una parte de video de una clase (un video suelto o una lista de reproducción de YouTube). */
export interface LessonVideo {
  /** Identificador único dentro de la clase (sirve para reordenar y borrar). */
  id: string;
  kind: 'video' | 'playlist';
  /** ID de YouTube ya validado: nunca se guarda la URL completa. */
  youtubeId: string;
  /** Opcional. Vacío = «Parte N» según el orden. */
  title: string;
}

/** Estado local de una clase que su autora compartió en GitHub. Nunca se exporta ni se importa. */
export interface LessonShare {
  /** `<login>/codice-skills`. */
  repo: string;
  /** Carpeta dentro de `classes/` (es el id de la clase). */
  slug: string;
  issueNumber: number;
  /** Commit al que está fijada la clase compartida. */
  sha: string;
  sharedAt: string;
  /** Huella del contenido compartido, para saber si hay cambios sin compartir. */
  contentHash: string;
}

/** Una clase: explica qué se hizo en el equipo y cómo, y enlaza skills y componentes. */
export interface Lesson {
  /** Identificador único (slug del título con sufijo si hace falta). */
  id: string;
  title: string;
  summary: string;
  level: LessonLevel;
  tags: string[];
  /** Explicación en Markdown (contenido no fiable: se pinta siempre con `SafeMarkdown`). */
  bodyMarkdown: string;
  /** `CatalogSkill.id` (`owner/repo/ruta`). */
  skillIds: string[];
  /** `UiComponentEntry.id`. */
  componentIds: string[];
  /** Partes de video, en orden. Puede estar vacío. */
  videos: LessonVideo[];
  /** Solo si la autora la compartió en GitHub. */
  shared?: LessonShare;
  author: LessonAuthor;
  createdAt: string;
  updatedAt: string;
}

/** Lo que rellena la persona en el formulario. */
export interface LessonDraft {
  title: string;
  summary: string;
  level: LessonLevel;
  tags: string[];
  bodyMarkdown: string;
  skillIds: string[];
  componentIds: string[];
  videos: LessonVideo[];
}

/**
 * Clase compartida por otra persona (o por ti) y leída de GitHub. Es de solo lectura y no se guarda
 * en el navegador. `bodyMarkdown` llega al abrirla: en la lista solo hay metadatos.
 */
export interface CommunityLesson extends Omit<Lesson, 'bodyMarkdown' | 'shared'> {
  bodyMarkdown?: string;
  /** `<login>/codice-skills`. */
  repo: string;
  /** Commit al que está fijada. */
  sha: string;
  issueNumber: number;
  issueUrl: string;
  repoUrl: string;
  contentHash: string;
}
