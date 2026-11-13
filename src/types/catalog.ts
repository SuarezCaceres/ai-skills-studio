import type { SpecificModelVersion } from './workspace';

/**
 * Contratos compartidos del catálogo comunitario de skills.
 * Fase 0: solo tipos. Los tres worktrees (datos GitHub, interfaz de detalle,
 * instalar/traducir) dependen de este archivo y NO deben modificarlo sin
 * coordinación (ver memories.md, sección 11).
 */

/** Herramientas de agente para las que se genera un comando de instalación. */
export type InstallTarget = 'claude-code' | 'cursor' | 'gemini-cli';

/** Veredicto de un resultado reportado por la comunidad. */
export type ResultVerdict = 'worked' | 'partial' | 'failed';

export interface SkillAuthor {
  /** Login de GitHub, ej. `SuarezCaceres`. */
  login: string;
  avatarUrl?: string;
  profileUrl: string;
}

/** Archivo de una skill remota (lista de la pestaña "Archivos"). */
export interface CatalogSkillFile {
  path: string;
  sizeBytes: number;
  /** Solo se rellena al abrir el archivo; el árbol llega sin contenido. */
  content?: string;
}

/** Skill registrada en el catálogo a partir de una URL de repo de GitHub. */
export interface CatalogSkill {
  /** `${owner}/${repo}/${skillPath}`; estable y apto para URL. */
  id: string;
  name: string;
  /** Descripción en inglés, tal como viene del frontmatter del SKILL.md. */
  description: string;
  /** Dueño del repo de origen (por ejemplo `anthropics`). No es quien la registró. */
  author: SkillAuthor;
  /**
   * Quien registró la skill en el catálogo: el autor del Issue ancla en GitHub, que no se
   * puede falsificar (a diferencia de lo que diga el cuerpo del Issue). Es la base de la
   * vista del equipo y del "Subida por".
   */
  uploadedBy: SkillAuthor;
  /** `usuario/repo`. */
  repo: string;
  /** Carpeta de la skill dentro del repo (vacío si está en la raíz). */
  skillPath: string;
  license: string | null;
  category: string;
  /** `true` si trae archivos ejecutables o patrones de script. */
  hasScripts: boolean;
  /** SHA del commit del que se leyó el contenido. */
  commitSha: string;
  /** Contenido del SKILL.md (no confiable: sanitizar antes de renderizar). */
  markdown: string;
  files: CatalogSkillFile[];
  registeredAt: string;
}

/** Resultado de uso: "esta skill funcionó con el modelo X". */
export interface SkillResultReport {
  id: string;
  skillId: string;
  /** Reutiliza el tipo cerrado de modelos de `workspace.ts`. */
  model: SpecificModelVersion;
  verdict: ResultVerdict;
  comment: string;
  evidenceUrl?: string;
  author: SkillAuthor;
  createdAt: string;
  /** URL del Issue de GitHub donde vive el reporte. */
  issueUrl: string;
}

export interface SkillVotes {
  skillId: string;
  count: number;
  /** `true` si el usuario autenticado ya votó. */
  votedByMe: boolean;
}

/** Comando y ruta destino para instalar una skill con una herramienta. */
export interface InstallInstruction {
  target: InstallTarget;
  label: string;
  /** Carpeta destino, ej. `~/.claude/skills/<nombre>`. */
  destinationPath: string;
  command: string;
}

/** Severidad de un hallazgo del auditor aplicado a una skill externa. */
export type AuditSeverity = 'info' | 'warn' | 'danger';

export interface SkillAuditFinding {
  id: string;
  severity: AuditSeverity;
  label: string;
  detail: string;
  /** Archivo donde se detectó, si aplica. */
  filePath?: string;
}

/** Sesión de GitHub en el cliente. El token nunca se persiste en disco. */
export interface GithubSession {
  login: string;
  avatarUrl?: string;
  token: string;
  expiresAt?: string;
}

/**
 * Superficie del servicio de catálogo que implementa el WT1 y consume el WT2.
 * Mientras el WT1 no esté fusionado, el WT2 usa una implementación mock.
 */
export interface CatalogApi {
  registerSkillFromUrl(repoUrl: string): Promise<CatalogSkill>;
  listSkills(): Promise<CatalogSkill[]>;
  getSkill(id: string): Promise<CatalogSkill | null>;
  listSkillsByAuthor(login: string): Promise<CatalogSkill[]>;
  listResults(skillId: string): Promise<SkillResultReport[]>;
  reportResult(
    input: Omit<SkillResultReport, 'id' | 'author' | 'createdAt' | 'issueUrl'>
  ): Promise<SkillResultReport>;
  getVotes(skillId: string): Promise<SkillVotes>;
  toggleVote(skillId: string): Promise<SkillVotes>;
}
