/**
 * Contratos compartidos para la integración sincronizada del directorio
 * público https://www.skills.sh en la sección «Explorar» de Códice Studio.
 *
 * Fase 0 (Orquestador General): congelado antes del despacho paralelo.
 */

export type SkillsShView = 'all-time' | 'trending' | 'hot';

export type SkillsShSourceMode = 'live' | 'cache' | 'snapshot';

/** Forma cruda (no confiable) recibida desde el proxy o desde el snapshot estático. */
export interface SkillsShRawItem {
  source: string;
  skillId: string;
  name: string;
  installs: number;
  weeklyInstalls?: number[];
  installsYesterday?: number;
  change?: number;
  isOfficial?: boolean;
}

/** Entrada normalizada y saneada lista para renderizarse en la UI. */
export interface SkillsShEntry {
  /** Identificador estable `${source}/${skillId}`. */
  id: string;
  /** Repositorio GitHub (`owner/repo`) o dominio `.well-known` (`uizze.sh`). */
  source: string;
  skillId: string;
  name: string;
  installs: number;
  weeklyInstalls?: number[];
  installsYesterday?: number;
  change?: number;
  isOfficial: boolean;
  /** `true` si `source` corresponde a un repositorio público `owner/repo` en GitHub. */
  isGithubSource: boolean;
  /** Enlace oficial a la ficha en https://www.skills.sh. */
  skillsShUrl: string;
  /** Enlace al repositorio en https://github.com/<owner>/<repo> cuando aplica. */
  githubUrl?: string;
  /** Comando seguro `npx skills add <source> --skill <skillId>` o vacío si fue rechazado. */
  installCommand: string;
}

export interface SkillsShListResult {
  view: SkillsShView;
  page: number;
  skills: SkillsShEntry[];
  total: number;
  hasMore: boolean;
  sourceMode: SkillsShSourceMode;
  syncedAt: string;
  /** Aviso legible en español si se degradó a caché o snapshot estático. */
  notice?: string;
}

export interface SkillsShSearchResult {
  query: string;
  skills: SkillsShEntry[];
  count: number;
  sourceMode: SkillsShSourceMode;
  syncedAt: string;
  notice?: string;
}

export interface SkillsShSnapshotView {
  total: number;
  skills: SkillsShRawItem[];
}

export interface SkillsShSnapshotFile {
  version: 1;
  generatedAt: string;
  source: 'https://www.skills.sh';
  views: Record<SkillsShView, SkillsShSnapshotView>;
}

/** Estados posibles de una acción en curso sobre una tarjeta de `skills.sh`. */
export type SkillsShBusyKind = 'inspect' | 'import';

/** Contrato de props entre `src/App.tsx` y `src/components/skills-sh/SkillsShPage.tsx`. */
export interface SkillsShPageProps {
  /** Resuelve la skill desde GitHub fijada a su `commitSha` y abre la vista previa en detalle. */
  onInspectSkill: (entry: SkillsShEntry) => Promise<void>;
  /** Registra la skill en el catálogo comunitario de Códice y abre su detalle. */
  onImportToCatalog: (entry: SkillsShEntry) => Promise<void>;
  /** Abre el modal/pantalla de inicio de sesión con GitHub. */
  onRequestLogin: () => void;
  /** Acción en curso (si la hay) para reflejar estado de carga en la tarjeta correspondiente. */
  busyAction?: { entryId: string; kind: SkillsShBusyKind } | null;
}
