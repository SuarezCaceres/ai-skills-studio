import type {
  CatalogApi,
  CatalogSkill,
  CatalogSkillFile,
  GithubSession,
  ResultVerdict,
  SkillAuthor,
  SkillResultReport,
  SkillVotes,
} from '../types/catalog';
import type { SpecificModelVersion } from '../types/workspace';

/**
 * Servicio de catálogo comunitario sobre la API de GitHub.
 *
 * Modelo de datos (todo vive en el repo catálogo, sin base de datos propia):
 *  - Cada skill registrada es un Issue "ancla" con la etiqueta `skill` y
 *    `skill:<id>`. Su cuerpo lleva un marcador HTML con una instantánea de los
 *    metadatos. Las reacciones 👍 de ese Issue son los votos.
 *  - Cada resultado reportado es un Issue con las etiquetas `result`,
 *    `model:<modelo>`, `verdict:<veredicto>` y `skill:<id>`.
 *
 * IMPORTANTE: GitHub descarta las etiquetas que pone un usuario sin permiso de
 * triage en el repo. Por eso el repo catálogo debe tener el workflow
 * "codice-labeler" descrito en docs/catalog-setup.md, que aplica las etiquetas
 * a partir del marcador del cuerpo.
 *
 * Seguridad: todo lo leído de repos externos y de Issues es NO confiable. Aquí
 * solo se valida y se recorta; el renderizado debe sanitizar el Markdown.
 * Nunca se ejecuta nada del contenido.
 *
 * Lecturas públicas sin token; escrituras con el token de la sesión (en memoria).
 */

/* ------------------------------------------------------------------ */
/* Errores                                                             */
/* ------------------------------------------------------------------ */

export type CatalogErrorCode =
  | 'not_configured'
  | 'auth_required'
  | 'invalid_url'
  | 'invalid_input'
  | 'not_found'
  | 'private_repo'
  | 'no_skill_md'
  | 'ambiguous_skill'
  | 'too_large'
  | 'rate_limit'
  | 'forbidden'
  | 'network'
  | 'github';

export class CatalogError extends Error {
  readonly code: CatalogErrorCode;
  /** Instante (ms epoch) en que se renueva el límite de peticiones, si aplica. */
  readonly retryAt?: number;

  constructor(code: CatalogErrorCode, message: string, retryAt?: number) {
    super(message);
    this.name = 'CatalogError';
    this.code = code;
    this.retryAt = retryAt;
  }
}

/* ------------------------------------------------------------------ */
/* Constantes y validaciones                                           */
/* ------------------------------------------------------------------ */

const API = 'https://api.github.com';
const OWNER_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
const REPO_RE = /^[A-Za-z0-9._-]{1,100}$/;
const MAX_SKILL_MD_BYTES = 256 * 1024;
const MAX_FILE_PREVIEW_BYTES = 512 * 1024;
const MAX_FILES = 500;
const MAX_ISSUE_PAGES = 3;

const MODELS: Record<SpecificModelVersion, true> = {
  'Opus 5.5': true,
  'Opus 4.8': true,
  'Gemini 3.8': true,
  'Gemini 3.7': true,
  'Sonnet 5.5': true,
  'GPT Astra': true,
  'GPT Luna': true,
  'DeepSeek V3': true,
};
const VERDICTS: Record<ResultVerdict, true> = { worked: true, partial: true, failed: true };

const isModel = (v: unknown): v is SpecificModelVersion =>
  typeof v === 'string' && Object.prototype.hasOwnProperty.call(MODELS, v);
const isVerdict = (v: unknown): v is ResultVerdict =>
  typeof v === 'string' && Object.prototype.hasOwnProperty.call(VERDICTS, v);

/** Quita caracteres de control (salvo salto de línea y tabulación) y recorta. */
function cleanText(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max);
}

function safeHttpsUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length > 500) return undefined;
  try {
    const u = new URL(value.trim());
    return u.protocol === 'https:' ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}

function isSafePath(p: string): boolean {
  return !p.split('/').some((s) => s === '..' || s === '.') && !p.includes('\\') && !p.includes('\0');
}

const encodePath = (p: string) => p.split('/').map(encodeURIComponent).join('/');

/** Hash corto y estable (cyrb53) para etiquetas de más de 50 caracteres. */
function shortHash(input: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

/** Etiqueta `skill:<id>`; GitHub limita las etiquetas a 50 caracteres. */
export function skillLabel(skillId: string): string {
  const direct = `skill:${skillId}`;
  return direct.length <= 50 ? direct : `skill:h-${shortHash(skillId)}`;
}

/* ------------------------------------------------------------------ */
/* Análisis de URL de repo y de id de skill                            */
/* ------------------------------------------------------------------ */

export interface ParsedRepoInput {
  owner: string;
  repo: string;
  /** Segmentos tras `/tree/` o `/blob/` (rama + ruta, ambiguos si la rama lleva `/`). */
  rest: string[];
  kind: 'tree' | 'blob' | null;
}

/** Acepta `https://github.com/usuario/repo[/tree/rama/ruta]` o `usuario/repo`. */
export function parseRepoInput(input: string): ParsedRepoInput {
  const fail = () =>
    new CatalogError(
      'invalid_url',
      'URL no válida. Usa https://github.com/usuario/repo (opcionalmente /tree/rama/ruta) o usuario/repo.'
    );
  const raw = input.trim();
  if (!raw || raw.length > 400) throw fail();

  let segments: string[];
  if (/^[\w.-]+\/[\w.-]+$/.test(raw)) {
    segments = raw.split('/');
  } else {
    let url: URL;
    try {
      url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    } catch {
      throw fail();
    }
    if (url.protocol !== 'https:' || !['github.com', 'www.github.com'].includes(url.hostname)) {
      throw fail();
    }
    try {
      segments = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);
    } catch {
      throw fail();
    }
  }

  if (segments.length < 2) throw fail();
  const owner = segments[0];
  const repo = segments[1].replace(/\.git$/i, '');
  if (!OWNER_RE.test(owner) || !REPO_RE.test(repo) || repo === '.' || repo === '..') throw fail();

  let kind: ParsedRepoInput['kind'] = null;
  let rest: string[] = [];
  if (segments.length > 2) {
    if (segments[2] === 'tree' || segments[2] === 'blob') {
      kind = segments[2];
      rest = segments.slice(3);
    }
    // Otras rutas (issues, pulls...) se ignoran: se registra el repo completo.
  }
  if (rest.some((s) => !s || s === '..' || s === '.' || s.includes('\\'))) throw fail();
  return { owner, repo, rest, kind };
}

/** `owner/repo[/ruta]`. */
export function buildSkillId(owner: string, repo: string, skillPath: string): string {
  return skillPath ? `${owner}/${repo}/${skillPath}` : `${owner}/${repo}`;
}

export function parseSkillId(id: string): { owner: string; repo: string; skillPath: string } | null {
  if (typeof id !== 'string' || id.length > 400) return null;
  const parts = id.split('/').filter((p, i) => p !== '' || i < 2);
  if (parts.length < 2) return null;
  const [owner, repo, ...rest] = parts;
  const skillPath = rest.join('/');
  if (!OWNER_RE.test(owner) || !REPO_RE.test(repo)) return null;
  if (skillPath && !isSafePath(skillPath)) return null;
  return { owner, repo, skillPath };
}

/* ------------------------------------------------------------------ */
/* Frontmatter y detección de scripts                                  */
/* ------------------------------------------------------------------ */

function unquote(raw: string): string {
  const v = raw.trim();
  if (v.length >= 2 && v.startsWith('"') && v.endsWith('"')) {
    return v.slice(1, -1).replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }
  if (v.length >= 2 && v.startsWith("'") && v.endsWith("'")) {
    return v.slice(1, -1).replace(/''/g, "'");
  }
  return v.replace(/\s+#.*$/, '');
}

/** Lee el frontmatter YAML (subconjunto: escalares, comillas y bloques `>`/`|`). */
export function parseFrontmatter(markdown: string): Record<string, string> {
  const out: Record<string, string> = Object.create(null);
  const m = /^\uFEFF?---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(markdown);
  if (!m) return out;
  const lines = m[1].split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const km = /^([A-Za-z0-9_-]+):[ \t]*(.*)$/.exec(lines[i]);
    if (!km) continue;
    const key = km[1];
    const value = km[2];
    const block: string[] = [];
    while (i + 1 < lines.length && (/^[ \t]+\S/.test(lines[i + 1]) || lines[i + 1].trim() === '')) {
      block.push(lines[i + 1].trim());
      i++;
    }
    while (block.length && block[block.length - 1] === '') block.pop();
    const style = /^([>|])[+-]?$/.exec(value.trim());
    if (style) {
      out[key] = block.join(style[1] === '>' ? ' ' : '\n').trim();
    } else if (value.trim() === '') {
      out[key] = block.join(' ').trim();
    } else {
      out[key] = [unquote(value), ...block].join(' ').trim();
    }
  }
  return out;
}

const SCRIPT_EXT = /\.(sh|bash|zsh|fish|ps1|psm1|bat|cmd|py|rb|pl|php|js|mjs|cjs|ts|exe|dll|so|jar|com|vbs|wsf)$/i;
const SCRIPT_MD_PATTERNS: RegExp[] = [
  /```\s*(sh|bash|zsh|shell|powershell|pwsh|ps1|bat|cmd)\b/i,
  /\b(curl|wget)\b[^\n|]*\|\s*(sudo\s+)?(ba|z)?sh\b/i,
  /\b(Invoke-Expression|iex)\b/i,
];

function detectScripts(
  entries: Array<{ path: string; mode?: string }>,
  markdown: string
): boolean {
  for (const e of entries) {
    const base = e.path.split('/').pop() ?? '';
    if (SCRIPT_EXT.test(base)) return true;
    if (e.mode === '100755') return true;
    if (/(^|\/)scripts\//i.test(e.path)) return true;
  }
  return SCRIPT_MD_PATTERNS.some((re) => re.test(markdown));
}

/* ------------------------------------------------------------------ */
/* Caché (memoria + localStorage con TTL)                              */
/* ------------------------------------------------------------------ */

const LS_PREFIX = 'codice-catalog:v1:';
const LS_MAX_CHARS = 150_000;

interface CacheEntry {
  exp: number;
  value: unknown;
}
const memCache = new Map<string, CacheEntry>();

function cacheRead(key: string, allowStale: boolean): { hit: boolean; value?: unknown } {
  const now = Date.now();
  let entry = memCache.get(key);
  if (!entry) {
    try {
      const raw = localStorage.getItem(LS_PREFIX + key);
      if (raw) {
        const parsed = JSON.parse(raw) as CacheEntry;
        if (parsed && typeof parsed.exp === 'number') {
          entry = parsed;
          memCache.set(key, parsed);
        }
      }
    } catch {
      /* localStorage no disponible: solo memoria */
    }
  }
  if (!entry) return { hit: false };
  if (entry.exp > now || allowStale) return { hit: true, value: entry.value };
  return { hit: false };
}

function cacheWrite(key: string, value: unknown, ttlMs: number): void {
  const entry: CacheEntry = { exp: Date.now() + ttlMs, value };
  memCache.set(key, entry);
  try {
    const raw = JSON.stringify(entry);
    if (raw.length <= LS_MAX_CHARS) localStorage.setItem(LS_PREFIX + key, raw);
  } catch {
    /* cuota llena o sin storage */
  }
}

/** Borra las entradas cuya clave contenga alguno de los fragmentos dados. */
function cacheInvalidate(fragments: string[]): void {
  const matches = (k: string) => fragments.some((f) => k.includes(f));
  for (const k of [...memCache.keys()]) if (matches(k)) memCache.delete(k);
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith(LS_PREFIX) && matches(k.slice(LS_PREFIX.length))) localStorage.removeItem(k);
    }
  } catch {
    /* ignorar */
  }
}

/* ------------------------------------------------------------------ */
/* Cliente HTTP de GitHub                                              */
/* ------------------------------------------------------------------ */

interface RequestOptions {
  method?: 'GET' | 'POST' | 'DELETE';
  body?: unknown;
  token?: string;
  /** Pide el cuerpo como texto crudo (contenido de archivos, SHA). */
  accept?: string;
  text?: boolean;
  /** Salta la caché HTTP del navegador (GitHub responde con `max-age=60`): para releer tras una escritura. */
  fresh?: boolean;
}

interface HttpResult<T> {
  status: number;
  data: T;
}

function formatWait(retryAt: number): string {
  const mins = Math.max(1, Math.ceil((retryAt - Date.now()) / 60000));
  const hour = new Date(retryAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  return `a las ${hour} (en unos ${mins} min)`;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<HttpResult<T>> {
  const headers: Record<string, string> = {
    Accept: opts.accept ?? 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';

  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      method: opts.method ?? 'GET',
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      cache: opts.fresh ? 'no-store' : undefined,
    });
  } catch {
    throw new CatalogError('network', 'No se pudo conectar con GitHub. Revisa tu conexión e inténtalo de nuevo.');
  }

  if (res.ok) {
    if (res.status === 204) return { status: 204, data: undefined as T };
    const data = (opts.text ? await res.text() : await res.json()) as T;
    return { status: res.status, data };
  }

  let message = '';
  try {
    const j = (await res.json()) as { message?: string };
    message = typeof j.message === 'string' ? j.message : '';
  } catch {
    /* sin cuerpo JSON */
  }

  const remaining = res.headers.get('x-ratelimit-remaining');
  const reset = Number(res.headers.get('x-ratelimit-reset'));
  const retryAfter = Number(res.headers.get('retry-after'));
  const limited =
    res.status === 429 || (res.status === 403 && (remaining === '0' || retryAfter > 0 || /rate limit/i.test(message)));
  if (limited) {
    const retryAt = retryAfter > 0 ? Date.now() + retryAfter * 1000 : reset > 0 ? reset * 1000 : Date.now() + 60_000;
    const hint = opts.token
      ? ''
      : ' Inicia sesión con GitHub para elevar el límite de 60 a 5000 peticiones por hora.';
    throw new CatalogError(
      'rate_limit',
      `Se alcanzó el límite de peticiones de GitHub. Reintenta ${formatWait(retryAt)}.${hint}`,
      retryAt
    );
  }
  if (res.status === 401) {
    throw new CatalogError('auth_required', 'Tu sesión de GitHub no es válida o expiró. Vuelve a entrar con GitHub.');
  }
  if (res.status === 403) {
    throw new CatalogError('forbidden', `GitHub rechazó la operación (permisos insuficientes). ${message}`.trim());
  }
  if (res.status === 404) {
    throw new CatalogError('not_found', 'No se encontró el recurso en GitHub (o es privado).');
  }
  throw new CatalogError('github', `GitHub respondió ${res.status}${message ? `: ${message}` : ''}.`);
}

/* ------------------------------------------------------------------ */
/* Tipos mínimos de respuestas de GitHub                               */
/* ------------------------------------------------------------------ */

interface GhUser {
  login: string;
  avatar_url?: string;
  html_url?: string;
}
interface GhRepo {
  private: boolean;
  default_branch: string;
  topics?: string[];
  license?: { spdx_id?: string | null } | null;
  owner: GhUser;
}
interface GhTreeEntry {
  path: string;
  mode?: string;
  type: string;
  size?: number;
}
interface GhTree {
  tree: GhTreeEntry[];
  truncated?: boolean;
}
interface GhIssue {
  number: number;
  html_url: string;
  body: string | null;
  created_at: string;
  user: GhUser | null;
  labels: Array<string | { name?: string }>;
  reactions?: Record<string, number>;
  pull_request?: unknown;
}
interface GhReaction {
  id: number;
  content: string;
  user: { login: string } | null;
}

/* ------------------------------------------------------------------ */
/* Marcador en el cuerpo de los Issues                                 */
/* ------------------------------------------------------------------ */

const MARKER_RE = /<!--\s*codice:v1\s+(\{[\s\S]*?\})\s*-->/;

interface MarkerPayload {
  kind: 'skill' | 'result';
  /** Etiquetas que debe aplicar el workflow del repo catálogo. */
  labels: string[];
  data: Record<string, unknown>;
}

function buildMarker(payload: MarkerPayload): string {
  const json = JSON.stringify(payload).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
  return `<!-- codice:v1 ${json} -->`;
}

function readMarker(body: string | null): MarkerPayload | null {
  if (!body) return null;
  const m = MARKER_RE.exec(body);
  if (!m) return null;
  try {
    const parsed = JSON.parse(m[1]) as MarkerPayload;
    if (!parsed || (parsed.kind !== 'skill' && parsed.kind !== 'result') || typeof parsed.data !== 'object' || !parsed.data) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function toAuthor(user: GhUser | null | undefined): SkillAuthor {
  const login = user && OWNER_RE.test(user.login) ? user.login : 'desconocido';
  const avatar = user?.avatar_url;
  return {
    login,
    avatarUrl: typeof avatar === 'string' && avatar.startsWith('https://avatars.githubusercontent.com/') ? avatar : undefined,
    profileUrl: `https://github.com/${login}`,
  };
}

interface SkillSnapshot {
  repo: string;
  skillPath: string;
  name: string;
  description: string;
  authorLogin: string;
  authorAvatar?: string;
  license: string | null;
  category: string;
  hasScripts: boolean;
  commitSha: string;
}

function snapshotOf(skill: CatalogSkill): SkillSnapshot {
  return {
    repo: skill.repo,
    skillPath: skill.skillPath,
    name: skill.name,
    description: skill.description,
    authorLogin: skill.author.login,
    authorAvatar: skill.author.avatarUrl,
    license: skill.license,
    category: skill.category,
    hasScripts: skill.hasScripts,
    commitSha: skill.commitSha,
  };
}

/** Valida una instantánea leída de un Issue (no confiable) y la convierte en skill ligera. */
function skillFromSnapshot(data: Record<string, unknown>, createdAt: string): CatalogSkill | null {
  const repo = cleanText(data.repo, 140);
  const [owner, repoName] = repo.split('/');
  const skillPath = cleanText(data.skillPath, 300);
  const commitSha = cleanText(data.commitSha, 40);
  const login = cleanText(data.authorLogin, 39);
  if (!owner || !repoName || repo.split('/').length !== 2) return null;
  if (!OWNER_RE.test(owner) || !REPO_RE.test(repoName) || !OWNER_RE.test(login)) return null;
  if (skillPath && !isSafePath(skillPath)) return null;
  if (!/^[0-9a-f]{40}$/.test(commitSha)) return null;
  const avatar = typeof data.authorAvatar === 'string' ? data.authorAvatar : undefined;
  const license = cleanText(data.license, 60);
  return {
    id: buildSkillId(owner, repoName, skillPath),
    name: cleanText(data.name, 100) || repoName,
    description: cleanText(data.description, 600),
    author: {
      login,
      avatarUrl: avatar && avatar.startsWith('https://avatars.githubusercontent.com/') ? avatar.slice(0, 300) : undefined,
      profileUrl: `https://github.com/${login}`,
    },
    // Provisional: `listAnchors` lo sustituye por el autor real del Issue.
    uploadedBy: { login, profileUrl: `https://github.com/${login}` },
    repo,
    skillPath,
    license: license || null,
    category: cleanText(data.category, 40) || 'general',
    hasScripts: data.hasScripts === true,
    commitSha,
    markdown: '',
    files: [],
    registeredAt: createdAt,
  };
}

/* ------------------------------------------------------------------ */
/* Servicio                                                            */
/* ------------------------------------------------------------------ */

export interface CatalogServiceOptions {
  /** `usuario/repo` del repo catálogo. Por defecto `VITE_CATALOG_REPO`. */
  catalogRepo?: string;
  /** Devuelve la sesión actual (o `null` si es visitante). */
  getSession: () => GithubSession | null;
}

/** Datos públicos de una cuenta de GitHub para mostrar a un integrante del equipo. */
export interface GithubProfile {
  login: string;
  name: string | null;
  avatarUrl?: string;
  profileUrl: string;
}

export interface GithubCatalogApi extends CatalogApi {
  /** Contenido de un archivo de la skill (lectura bajo demanda para la pestaña "Archivos"). */
  getSkillFileContent(skillId: string, filePath: string): Promise<string>;
  /** Perfil público (avatar y nombre) de una cuenta; `null` si no existe. Con caché de 24 h. */
  getProfile(login: string): Promise<GithubProfile | null>;
}

const TTL = {
  repo: 10 * 60_000,
  immutable: 24 * 60 * 60_000,
  issues: 2 * 60_000,
  votes: 30_000,
};

export function createGithubCatalogService(options: CatalogServiceOptions): GithubCatalogApi {
  const catalogRepo = (options.catalogRepo ?? (import.meta.env.VITE_CATALOG_REPO as string | undefined) ?? '').trim();
  const inflight = new Map<string, Promise<unknown>>();

  const requireCatalog = (): string => {
    const [o, r, extra] = catalogRepo.split('/');
    if (!o || !r || extra !== undefined || !OWNER_RE.test(o) || !REPO_RE.test(r)) {
      throw new CatalogError(
        'not_configured',
        'El catálogo no está configurado. Define VITE_CATALOG_REPO=usuario/repo (ver docs/catalog-setup.md).'
      );
    }
    return catalogRepo;
  };

  const requireSession = (): GithubSession => {
    const s = options.getSession();
    if (!s) throw new CatalogError('auth_required', 'Inicia sesión con GitHub para realizar esta acción.');
    return s;
  };

  /** GET público con caché, deduplicación y reutilización de caché caducada si hay rate limit o red caída. */
  async function cachedGet<T>(
    path: string,
    ttlMs: number,
    opts: Pick<RequestOptions, 'accept' | 'text' | 'fresh'> = {}
  ): Promise<T> {
    const key = `GET ${path}${opts.accept ? ` @${opts.accept}` : ''}`;
    if (!opts.fresh) {
      const cached = cacheRead(key, false);
      if (cached.hit) return cached.value as T;
      const pending = inflight.get(key);
      if (pending) return pending as Promise<T>;
    }

    const task = (async () => {
      try {
        // Con sesión, las lecturas públicas también llevan el token: así cuentan en el límite
        // de 5000/h de la persona y no en el anónimo de 60/h de su IP. Los datos son públicos,
        // por eso la caché no distingue entre sesión y visitante.
        const token = options.getSession()?.token;
        let result: HttpResult<T>;
        try {
          result = await request<T>(path, { ...opts, token });
        } catch (err) {
          // Token caducado o revocado: la lectura pública debe seguir funcionando sin él.
          if (token && err instanceof CatalogError && err.code === 'auth_required') {
            result = await request<T>(path, opts);
          } else {
            throw err;
          }
        }
        const { data } = result;
        cacheWrite(key, data, ttlMs);
        return data;
      } catch (err) {
        if (err instanceof CatalogError && (err.code === 'rate_limit' || err.code === 'network')) {
          const stale = cacheRead(key, true);
          if (stale.hit) return stale.value as T;
        }
        throw err;
      } finally {
        inflight.delete(key);
      }
    })();
    inflight.set(key, task);
    return task;
  }

  /* ---------- Lectura de skills desde repos de GitHub ---------- */

  async function fetchRepo(owner: string, repo: string): Promise<GhRepo> {
    try {
      const info = await cachedGet<GhRepo>(`/repos/${owner}/${repo}`, TTL.repo);
      if (info.private) {
        throw new CatalogError('private_repo', 'Solo se pueden registrar skills de repositorios públicos.');
      }
      return info;
    } catch (err) {
      if (err instanceof CatalogError && err.code === 'not_found') {
        throw new CatalogError('not_found', `No existe el repositorio ${owner}/${repo} o es privado.`);
      }
      throw err;
    }
  }

  async function commitSha(owner: string, repo: string, ref: string): Promise<string> {
    const sha = await cachedGet<string>(
      `/repos/${owner}/${repo}/commits/${encodePath(ref)}`,
      TTL.repo,
      { accept: 'application/vnd.github.sha', text: true }
    );
    const clean = String(sha).trim();
    if (!/^[0-9a-f]{40}$/.test(clean)) throw new CatalogError('github', 'GitHub devolvió un SHA de commit no válido.');
    return clean;
  }

  async function fetchTree(owner: string, repo: string, sha: string): Promise<GhTree> {
    return cachedGet<GhTree>(`/repos/${owner}/${repo}/git/trees/${sha}?recursive=1`, TTL.immutable);
  }

  async function fetchRaw(owner: string, repo: string, path: string, sha: string): Promise<string> {
    return cachedGet<string>(
      `/repos/${owner}/${repo}/contents/${encodePath(path)}?ref=${sha}`,
      TTL.immutable,
      { accept: 'application/vnd.github.raw+json', text: true }
    );
  }

  /** Resuelve rama + ruta a partir de los segmentos de una URL `/tree/...`. */
  async function resolveRefAndPath(
    parsed: ParsedRepoInput,
    defaultBranch: string
  ): Promise<{ sha: string; path: string }> {
    const { owner, repo, rest } = parsed;
    if (rest.length === 0) return { sha: await commitSha(owner, repo, defaultBranch), path: '' };
    const attempts = Math.min(rest.length, 4);
    for (let i = 1; i <= attempts; i++) {
      try {
        const sha = await commitSha(owner, repo, rest.slice(0, i).join('/'));
        return { sha, path: rest.slice(i).join('/') };
      } catch (err) {
        if (!(err instanceof CatalogError) || (err.code !== 'not_found' && err.code !== 'github')) throw err;
      }
    }
    throw new CatalogError('not_found', 'No se encontró la rama indicada en la URL.');
  }

  interface BuildTarget {
    owner: string;
    repo: string;
    sha: string;
    /** Ruta pedida (puede estar vacía y entonces se busca el SKILL.md). */
    path: string;
    /** `true` cuando la ruta ya es exacta (skill registrada) y no se auto-detecta. */
    exact?: boolean;
  }

  async function buildSkill(target: BuildTarget, repoInfo: GhRepo, registeredAt: string): Promise<CatalogSkill> {
    const { owner, repo, sha } = target;
    const tree = await fetchTree(owner, repo, sha);
    const blobs = tree.tree.filter((e) => e.type === 'blob' && isSafePath(e.path));

    let requested = target.path.replace(/^\/+|\/+$/g, '');
    if (requested.toLowerCase().endsWith('/skill.md') || requested === 'SKILL.md') {
      requested = requested.slice(0, Math.max(0, requested.length - 'SKILL.md'.length)).replace(/\/+$/, '');
    }

    const mdPath = (dir: string) => (dir ? `${dir}/SKILL.md` : 'SKILL.md');
    let skillPath: string;
    if (requested || target.exact) {
      if (!blobs.some((e) => e.path === mdPath(requested))) {
        throw new CatalogError('no_skill_md', `No hay un SKILL.md en "${requested || '/'}" de ${owner}/${repo}.`);
      }
      skillPath = requested;
    } else if (blobs.some((e) => e.path === 'SKILL.md')) {
      skillPath = '';
    } else {
      const found = blobs.filter((e) => e.path.endsWith('/SKILL.md')).map((e) => e.path.slice(0, -'/SKILL.md'.length));
      if (found.length === 0) {
        throw new CatalogError('no_skill_md', `${owner}/${repo} no contiene ningún archivo SKILL.md.`);
      }
      if (found.length > 1) {
        const sample = found.slice(0, 5).join(', ');
        throw new CatalogError(
          'ambiguous_skill',
          `El repo contiene varias skills (${sample}${found.length > 5 ? '…' : ''}). Pega la URL de una carpeta concreta: https://github.com/${owner}/${repo}/tree/<rama>/<carpeta>.`
        );
      }
      skillPath = found[0];
    }

    const mdEntry = blobs.find((e) => e.path === mdPath(skillPath));
    if ((mdEntry?.size ?? 0) > MAX_SKILL_MD_BYTES) {
      throw new CatalogError('too_large', 'El SKILL.md supera el tamaño máximo permitido (256 KB).');
    }
    const markdown = cleanText(await fetchRaw(owner, repo, mdPath(skillPath), sha), MAX_SKILL_MD_BYTES);

    const prefix = skillPath ? `${skillPath}/` : '';
    const inSkill = blobs
      .filter((e) => e.path.startsWith(prefix) && !e.path.startsWith(`${prefix}.git/`))
      .map((e) => ({ ...e, rel: e.path.slice(prefix.length) }));
    const files: CatalogSkillFile[] = inSkill
      .slice(0, MAX_FILES)
      .map((e) => ({ path: e.rel, sizeBytes: e.size ?? 0 }));

    const fm = parseFrontmatter(markdown);
    const dirName = skillPath ? skillPath.split('/').pop() ?? repo : repo;
    const spdx = repoInfo.license?.spdx_id;
    const author = toAuthor(repoInfo.owner);

    return {
      id: buildSkillId(owner, repo, skillPath),
      name: cleanText(fm.name, 100) || dirName,
      description: cleanText(fm.description, 600),
      author,
      // Provisional: quien registra lo fija `getSkill` / `registerSkillFromUrl`.
      uploadedBy: author,
      repo: `${owner}/${repo}`,
      skillPath,
      license: spdx && spdx !== 'NOASSERTION' ? spdx : null,
      category: cleanText(fm.category, 40) || cleanText(repoInfo.topics?.[0], 40) || 'general',
      hasScripts: detectScripts(inSkill.map((e) => ({ path: e.rel, mode: e.mode })), markdown),
      commitSha: sha,
      markdown,
      files,
      registeredAt,
    };
  }

  /* ---------- Issues ---------- */

  async function listIssues(labels: string[], state: 'open' | 'all'): Promise<GhIssue[]> {
    const repoPath = requireCatalog();
    const all: GhIssue[] = [];
    for (let page = 1; page <= MAX_ISSUE_PAGES; page++) {
      const qs = new URLSearchParams({
        labels: labels.join(','),
        state,
        per_page: '100',
        page: String(page),
        sort: 'created',
        direction: 'desc',
      });
      const batch = await cachedGet<GhIssue[]>(`/repos/${repoPath}/issues?${qs}`, TTL.issues);
      all.push(...batch.filter((i) => !i.pull_request));
      if (batch.length < 100) break;
    }
    return all;
  }

  interface Anchor {
    issue: GhIssue;
    skill: CatalogSkill;
  }

  async function listAnchors(): Promise<Anchor[]> {
    const issues = await listIssues(['skill'], 'open');
    const seen = new Set<string>();
    const anchors: Anchor[] = [];
    // El más antiguo gana si hay duplicados: se recorre de más viejo a más nuevo.
    for (const issue of [...issues].reverse()) {
      const marker = readMarker(issue.body);
      if (!marker || marker.kind !== 'skill') continue;
      const snapshot = skillFromSnapshot(marker.data, issue.created_at);
      if (!snapshot || seen.has(snapshot.id.toLowerCase())) continue;
      seen.add(snapshot.id.toLowerCase());
      // Se usa el autor del Issue (verificado por GitHub), no lo que declare el marcador.
      anchors.push({ issue, skill: { ...snapshot, uploadedBy: toAuthor(issue.user) } });
    }
    return anchors.reverse();
  }

  async function findAnchor(skillId: string): Promise<Anchor | null> {
    const parsed = parseSkillId(skillId);
    if (!parsed) return null;
    const id = buildSkillId(parsed.owner, parsed.repo, parsed.skillPath).toLowerCase();
    return (await listAnchors()).find((a) => a.skill.id.toLowerCase() === id) ?? null;
  }

  function reportFromIssue(issue: GhIssue, skillId: string): SkillResultReport | null {
    const marker = readMarker(issue.body);
    if (!marker || marker.kind !== 'result') return null;
    const d = marker.data;
    if (d.skillId !== skillId || !isModel(d.model) || !isVerdict(d.verdict)) return null;
    return {
      id: String(issue.number),
      skillId,
      model: d.model,
      verdict: d.verdict,
      comment: cleanText(d.comment, 2000),
      evidenceUrl: safeHttpsUrl(d.evidenceUrl),
      author: toAuthor(issue.user),
      createdAt: issue.created_at,
      issueUrl: issue.html_url,
    };
  }

  async function myReaction(issueNumber: number, session: GithubSession): Promise<GhReaction | undefined> {
    const repoPath = requireCatalog();
    for (let page = 1; page <= 5; page++) {
      const { data } = await request<GhReaction[]>(
        `/repos/${repoPath}/issues/${issueNumber}/reactions?content=%2B1&per_page=100&page=${page}`,
        { token: session.token, fresh: true }
      );
      const mine = data.find((r) => r.user?.login.toLowerCase() === session.login.toLowerCase());
      if (mine) return mine;
      if (data.length < 100) break;
    }
    return undefined;
  }

  async function votesFor(anchor: Anchor, withSession: boolean, fresh = false): Promise<SkillVotes> {
    const repoPath = requireCatalog();
    const issue = await cachedGet<GhIssue>(`/repos/${repoPath}/issues/${anchor.issue.number}`, TTL.votes, { fresh });
    const session = options.getSession();
    const mine = withSession && session ? await myReaction(anchor.issue.number, session) : undefined;
    return { skillId: anchor.skill.id, count: issue.reactions?.['+1'] ?? 0, votedByMe: Boolean(mine) };
  }

  /* ---------- API pública ---------- */

  async function getSkill(id: string): Promise<CatalogSkill | null> {
    const anchor = await findAnchor(id);
    if (!anchor) return null;
    const { skill: snap } = anchor;
    const [owner, repo] = snap.repo.split('/');
    try {
      const repoInfo = await fetchRepo(owner, repo);
      const built = await buildSkill(
        { owner, repo, sha: snap.commitSha, path: snap.skillPath, exact: true },
        repoInfo,
        snap.registeredAt
      );
      return { ...built, uploadedBy: snap.uploadedBy };
    } catch (err) {
      // Repo borrado o hecho privado: se muestra la instantánea guardada.
      if (err instanceof CatalogError && ['not_found', 'private_repo', 'no_skill_md'].includes(err.code)) return snap;
      throw err;
    }
  }


  return {
    async registerSkillFromUrl(repoUrl) {
      const repoPath = requireCatalog();
      const session = requireSession();
      const parsed = parseRepoInput(repoUrl);
      const repoInfo = await fetchRepo(parsed.owner, parsed.repo);
      const { sha, path } = await resolveRefAndPath(parsed, repoInfo.default_branch);
      const skill = await buildSkill({ owner: parsed.owner, repo: parsed.repo, sha, path }, repoInfo, new Date().toISOString());

      const existing = await findAnchor(skill.id);
      if (existing) return { ...skill, uploadedBy: existing.skill.uploadedBy, registeredAt: existing.issue.created_at };

      const body = [
        buildMarker({
          kind: 'skill',
          labels: ['skill', skillLabel(skill.id)],
          data: snapshotOf(skill) as unknown as Record<string, unknown>,
        }),
        `Skill registrada en el catálogo: **${skill.name}**`,
        '',
        `- Repositorio: https://github.com/${skill.repo}`,
        `- Ruta: \`${skill.skillPath || '/'}\``,
        `- Commit: \`${skill.commitSha}\``,
        '',
        'Este Issue es el ancla de la skill: los 👍 de este Issue son los votos de la comunidad.',
      ].join('\n');

      const { data: issue } = await request<GhIssue>(`/repos/${repoPath}/issues`, {
        method: 'POST',
        token: session.token,
        body: { title: `[skill] ${skill.id}`.slice(0, 250), body, labels: ['skill', skillLabel(skill.id)] },
      });
      cacheInvalidate([`/repos/${repoPath}/issues`]);
      return {
        ...skill,
        uploadedBy: toAuthor(issue.user ?? { login: session.login, avatar_url: session.avatarUrl }),
        registeredAt: issue.created_at,
      };
    },

    async listSkills() {
      const anchors = await listAnchors();
      return anchors.map((a) => a.skill);
    },

    getSkill,

    async listSkillsByAuthor(login) {
      const wanted = login.trim().toLowerCase();
      if (!wanted) return [];
      return (await listAnchors()).map((a) => a.skill).filter((s) => s.author.login.toLowerCase() === wanted);
    },

    async listResults(skillId) {
      const labels = ['result', skillLabel(skillId)];
      const issues = await listIssues(labels, 'all');
      return issues
        .map((i) => reportFromIssue(i, skillId))
        .filter((r): r is SkillResultReport => r !== null);
    },

    async reportResult(input) {
      const repoPath = requireCatalog();
      const session = requireSession();
      if (!isModel(input.model)) throw new CatalogError('invalid_input', 'Modelo de IA no reconocido.');
      if (!isVerdict(input.verdict)) throw new CatalogError('invalid_input', 'Veredicto no válido.');
      const comment = cleanText(input.comment, 2000);
      if (!comment) throw new CatalogError('invalid_input', 'Escribe un comentario sobre cómo te fue con la skill.');
      let evidenceUrl: string | undefined;
      if (input.evidenceUrl && input.evidenceUrl.trim()) {
        evidenceUrl = safeHttpsUrl(input.evidenceUrl);
        if (!evidenceUrl) throw new CatalogError('invalid_input', 'La evidencia debe ser una URL https válida.');
      }
      const anchor = await findAnchor(input.skillId);
      if (!anchor) throw new CatalogError('not_found', 'La skill no está registrada en el catálogo.');

      const labels = ['result', `model:${input.model}`, `verdict:${input.verdict}`, skillLabel(anchor.skill.id)];
      const body = [
        buildMarker({
          kind: 'result',
          labels,
          data: { skillId: anchor.skill.id, model: input.model, verdict: input.verdict, comment, evidenceUrl },
        }),
        `**Skill:** ${anchor.skill.id}`,
        `**Modelo:** ${input.model}`,
        `**Veredicto:** ${input.verdict}`,
        evidenceUrl ? `**Evidencia:** ${evidenceUrl}` : '',
        '',
        comment,
      ]
        .filter((l, i, a) => l !== '' || a[i - 1] !== '')
        .join('\n');

      const { data: issue } = await request<GhIssue>(`/repos/${repoPath}/issues`, {
        method: 'POST',
        token: session.token,
        body: { title: `[result] ${anchor.skill.id} · ${input.model} · ${input.verdict}`.slice(0, 250), body, labels },
      });
      cacheInvalidate([`/repos/${repoPath}/issues`]);

      return {
        id: String(issue.number),
        skillId: anchor.skill.id,
        model: input.model,
        verdict: input.verdict,
        comment,
        evidenceUrl,
        author: toAuthor(issue.user ?? { login: session.login, avatar_url: session.avatarUrl }),
        createdAt: issue.created_at,
        issueUrl: issue.html_url,
      };
    },

    async getVotes(skillId) {
      const anchor = await findAnchor(skillId);
      if (!anchor) return { skillId, count: 0, votedByMe: false };
      return votesFor(anchor, true);
    },

    async toggleVote(skillId) {
      const repoPath = requireCatalog();
      const session = requireSession();
      const anchor = await findAnchor(skillId);
      if (!anchor) throw new CatalogError('not_found', 'La skill no está registrada en el catálogo.');
      const n = anchor.issue.number;
      const mine = await myReaction(n, session);
      if (mine) {
        await request<void>(`/repos/${repoPath}/issues/${n}/reactions/${mine.id}`, {
          method: 'DELETE',
          token: session.token,
        });
      } else {
        await request<GhReaction>(`/repos/${repoPath}/issues/${n}/reactions`, {
          method: 'POST',
          token: session.token,
          body: { content: '+1' },
        });
      }
      cacheInvalidate([`/repos/${repoPath}/issues/${n}`]);
      return votesFor(anchor, true, true);
    },

    async getProfile(login) {
      const wanted = login.trim();
      if (!OWNER_RE.test(wanted)) return null;
      try {
        const u = await cachedGet<GhUser & { name?: string | null }>(`/users/${wanted}`, TTL.immutable);
        const author = toAuthor(u);
        return { login: author.login, name: u.name ? cleanText(u.name, 80) : null, avatarUrl: author.avatarUrl, profileUrl: author.profileUrl };
      } catch (err) {
        if (err instanceof CatalogError && err.code === 'not_found') return null;
        throw err;
      }
    },

    async getSkillFileContent(skillId, filePath) {
      const skill = await getSkill(skillId);
      if (!skill) throw new CatalogError('not_found', 'La skill no está registrada en el catálogo.');
      const file = skill.files.find((f) => f.path === filePath);
      if (!file || !isSafePath(filePath)) throw new CatalogError('not_found', 'Ese archivo no pertenece a la skill.');
      if (file.sizeBytes > MAX_FILE_PREVIEW_BYTES) {
        throw new CatalogError('too_large', 'El archivo es demasiado grande para previsualizarlo (máx. 512 KB).');
      }
      const [owner, repo] = skill.repo.split('/');
      const full = skill.skillPath ? `${skill.skillPath}/${filePath}` : filePath;
      // Texto crudo y no confiable: el llamador debe mostrarlo como texto, nunca como HTML.
      return cleanText(await fetchRaw(owner, repo, full, skill.commitSha), MAX_FILE_PREVIEW_BYTES);
    },
  };
}
