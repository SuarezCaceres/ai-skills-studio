import type {
  SkillsShEntry,
  SkillsShListResult,
  SkillsShRawItem,
  SkillsShSearchResult,
  SkillsShSnapshotFile,
  SkillsShSnapshotView,
  SkillsShView,
} from '../types/skillsSh';

/**
 * Cliente híbrido del directorio público https://www.skills.sh.
 *
 * Estrategia de obtención de datos:
 *  1. Caché local fresca en memoria / storage (TTL de 5 min), siempre validada con type guards.
 *  2. Proxy serverless configurado (`VITE_SKILLS_SH_PROXY_URL` o derivado de `VITE_GITHUB_OAUTH_URL`).
 *  3. Respaldo degradado: caché expirada si existe y, si no, snapshot estático local.
 *
 * Seguridad: toda respuesta del proxy, del snapshot y de `storage` se trata como entrada no confiable.
 */

export const SKILLS_SH_CACHE_KEY = 'ai_skills_studio_skills_sh_v1';
export const SKILLS_SH_TTL_MS = 5 * 60_000;

const FETCH_TIMEOUT_MS = 8_000;
const MAX_PAGE = 50;
const SNAPSHOT_PAGE_SIZE = 50;
const MAX_QUERY_LEN = 80;
const MAX_SEARCH_LIMIT = 50;
const MAX_CACHED_PAGES = 15;
const MAX_WEEKLY_POINTS = 12;

const OWNER_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
const REPO_RE = /^[A-Za-z0-9._-]{1,100}$/;
const SAFE_CLI_SOURCE_RE = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,199}$/;
const SAFE_CLI_SKILL_ID_RE = /^[A-Za-z0-9@][A-Za-z0-9._:@/-]{0,119}$/;
const VALID_VIEWS: readonly SkillsShView[] = ['all-time', 'trending', 'hot'];

/* ------------------------------------------------------------------ */
/* Helpers puros y validadores                                         */
/* ------------------------------------------------------------------ */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSkillsShView(value: unknown): value is SkillsShView {
  return value === 'all-time' || value === 'trending' || value === 'hot';
}

/** Elimina caracteres de control (incluidos saltos de línea), recorta y acota longitud. */
function cleanSingleLine(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, max);
}

function isValidIsoDate(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 64) return false;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001F\u007F]/.test(trimmed)) return false;
  return !Number.isNaN(Date.parse(trimmed));
}

function parseAllowedProxyUrl(raw: unknown): URL | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 500) return null;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.username || url.password) return null;
  const isHttps = url.protocol === 'https:';
  const isLocalHttp =
    url.protocol === 'http:' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1');
  if (!isHttps && !isLocalHttp) return null;
  return url;
}

/** Valida estrictamente que `source` corresponde a `owner/repo` en GitHub. */
export function isGithubSource(source: string): boolean {
  if (typeof source !== 'string') return false;
  const parts = source.split('/');
  if (parts.length !== 2) return false;
  const [owner, repo] = parts;
  if (!OWNER_RE.test(owner) || !REPO_RE.test(repo)) return false;
  if (repo === '.' || repo === '..') return false;
  return true;
}

/**
 * Construye el comando `npx skills add <source> --skill <skillId>` validando patrones estrictos
 * sin metacaracteres de shell, espacios, comillas, saltos de línea ni `..`. Devuelve `''` si es inseguro.
 */
export function buildNpxInstallCommand(source: string, skillId: string): string {
  if (typeof source !== 'string' || typeof skillId !== 'string') return '';
  if (!SAFE_CLI_SOURCE_RE.test(source) || !SAFE_CLI_SKILL_ID_RE.test(skillId)) return '';
  if (
    source.includes('..') ||
    skillId.includes('..') ||
    source.includes('//') ||
    skillId.includes('//') ||
    source.endsWith('/') ||
    skillId.endsWith('/')
  ) {
    return '';
  }
  return `npx skills add ${source} --skill ${skillId}`;
}

/**
 * Construye la URL oficial `https://www.skills.sh/<source>/<skillId>` codificando cada segmento
 * de forma segura y conservando `/` en fuentes `owner/repo`.
 */
export function buildSkillsShUrl(source: string, skillId: string): string {
  const cleanSource = cleanSingleLine(source, 200);
  const cleanSkillId = cleanSingleLine(skillId, 120);
  if (!cleanSource || !cleanSkillId) return 'https://www.skills.sh';

  const sourceSegments = cleanSource.split('/').filter(Boolean);
  if (sourceSegments.length === 0) return 'https://www.skills.sh';
  if (sourceSegments.some((seg) => seg === '.' || seg === '..' || seg.includes('\\'))) {
    return 'https://www.skills.sh';
  }
  if (cleanSkillId === '.' || cleanSkillId === '..' || cleanSkillId.includes('\\')) {
    return 'https://www.skills.sh';
  }

  const encodedSource = sourceSegments.map(encodeURIComponent).join('/');
  const encodedSkillId = encodeURIComponent(cleanSkillId);
  const candidate = `https://www.skills.sh/${encodedSource}/${encodedSkillId}`;
  try {
    const parsed = new URL(candidate);
    if (parsed.origin !== 'https://www.skills.sh') return 'https://www.skills.sh';
    return parsed.toString();
  } catch {
    return 'https://www.skills.sh';
  }
}

/** Sanea y normaliza una entrada cruda recibida del proxy, snapshot o caché. */
export function normalizeSkillsShItem(raw: unknown): SkillsShEntry | null {
  if (!isRecord(raw)) return null;

  const source = cleanSingleLine(raw.source, 200);
  const skillId = cleanSingleLine(raw.skillId, 120);
  if (!source || !skillId) return null;

  const installs = raw.installs;
  if (typeof installs !== 'number' || !Number.isInteger(installs) || installs < 0) return null;

  const name = cleanSingleLine(raw.name, 120) || skillId;
  const githubSource = isGithubSource(source);

  let weeklyInstalls: number[] | undefined;
  if (Array.isArray(raw.weeklyInstalls)) {
    const cleaned = raw.weeklyInstalls
      .filter((n): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0)
      .slice(0, MAX_WEEKLY_POINTS);
    if (cleaned.length > 0) weeklyInstalls = cleaned;
  }

  const installsYesterday =
    typeof raw.installsYesterday === 'number' &&
    Number.isFinite(raw.installsYesterday) &&
    raw.installsYesterday >= 0
      ? Math.trunc(raw.installsYesterday)
      : undefined;

  const change =
    typeof raw.change === 'number' && Number.isFinite(raw.change) ? raw.change : undefined;

  const isOfficial = raw.isOfficial === true;
  const skillsShUrl = buildSkillsShUrl(source, skillId);
  const installCommand = buildNpxInstallCommand(source, skillId);

  let githubUrl: string | undefined;
  if (githubSource) {
    const [owner, repo] = source.split('/');
    githubUrl = `https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  }

  const entry: SkillsShEntry = {
    id: `${source}/${skillId}`,
    source,
    skillId,
    name,
    installs,
    isOfficial,
    isGithubSource: githubSource,
    skillsShUrl,
    installCommand,
  };
  if (weeklyInstalls !== undefined) entry.weeklyInstalls = weeklyInstalls;
  if (installsYesterday !== undefined) entry.installsYesterday = installsYesterday;
  if (change !== undefined) entry.change = change;
  if (githubUrl !== undefined) entry.githubUrl = githubUrl;

  return entry;
}

function entryToRawItem(entry: SkillsShEntry): SkillsShRawItem {
  const item: SkillsShRawItem = {
    source: entry.source,
    skillId: entry.skillId,
    name: entry.name,
    installs: entry.installs,
  };
  if (entry.weeklyInstalls !== undefined) item.weeklyInstalls = entry.weeklyInstalls;
  if (entry.installsYesterday !== undefined) item.installsYesterday = entry.installsYesterday;
  if (entry.change !== undefined) item.change = entry.change;
  if (entry.isOfficial) item.isOfficial = true;
  return item;
}

/** Valida estrictamente un archivo de snapshot estático de skills.sh y sanea todas sus entradas. */
export function parseSkillsShSnapshot(raw: unknown): SkillsShSnapshotFile | null {
  if (!isRecord(raw)) return null;
  if (raw.version !== 1) return null;
  if (raw.source !== 'https://www.skills.sh') return null;
  if (!isValidIsoDate(raw.generatedAt)) return null;
  if (!isRecord(raw.views)) return null;

  const views = {} as Record<SkillsShView, SkillsShSnapshotView>;
  for (const view of VALID_VIEWS) {
    const rawView = raw.views[view];
    if (!isRecord(rawView)) return null;
    if (!Array.isArray(rawView.skills)) return null;
    if (typeof rawView.total !== 'number' || !Number.isInteger(rawView.total) || rawView.total < 0) {
      return null;
    }

    const sanitized: SkillsShRawItem[] = [];
    for (const item of rawView.skills) {
      const normalized = normalizeSkillsShItem(item);
      if (normalized) sanitized.push(entryToRawItem(normalized));
    }

    views[view] = {
      total: Math.max(rawView.total, sanitized.length),
      skills: sanitized,
    };
  }

  return {
    version: 1,
    generatedAt: raw.generatedAt.trim(),
    source: 'https://www.skills.sh',
    views,
  };
}

/** Resuelve la URL del proxy por defecto a partir de variables de entorno públicas `VITE_*`. */
export function resolveDefaultProxyUrl(env?: {
  VITE_SKILLS_SH_PROXY_URL?: string;
  VITE_GITHUB_OAUTH_URL?: string;
}): string {
  const sourceEnv =
    env ??
    (typeof import.meta !== 'undefined' && import.meta.env
      ? (import.meta.env as {
          VITE_SKILLS_SH_PROXY_URL?: string;
          VITE_GITHUB_OAUTH_URL?: string;
        })
      : {});

  const direct = parseAllowedProxyUrl(sourceEnv.VITE_SKILLS_SH_PROXY_URL);
  if (direct) {
    const cleanPath = direct.pathname.replace(/\/+$/, '');
    return `${direct.origin}${cleanPath}`;
  }

  const oauth = parseAllowedProxyUrl(sourceEnv.VITE_GITHUB_OAUTH_URL);
  if (oauth) {
    return `${oauth.origin}/api/skills-sh`;
  }

  return '';
}

/* ------------------------------------------------------------------ */
/* Caché persistente con validación estricta                           */
/* ------------------------------------------------------------------ */

interface CachedListRecord {
  view: SkillsShView;
  page: number;
  skills: SkillsShEntry[];
  total: number;
  hasMore: boolean;
  syncedAt: string;
  cachedAt: number;
}

interface StoredCacheEnvelope {
  version: 1;
  entries: Record<string, CachedListRecord>;
}

function parseCachedRecord(raw: unknown): CachedListRecord | null {
  if (!isRecord(raw)) return null;
  if (!isSkillsShView(raw.view)) return null;
  if (typeof raw.page !== 'number' || !Number.isInteger(raw.page) || raw.page < 0 || raw.page > MAX_PAGE) {
    return null;
  }
  if (!Array.isArray(raw.skills)) return null;
  if (typeof raw.total !== 'number' || !Number.isInteger(raw.total) || raw.total < 0) return null;
  if (typeof raw.hasMore !== 'boolean') return null;
  if (!isValidIsoDate(raw.syncedAt)) return null;
  if (typeof raw.cachedAt !== 'number' || !Number.isFinite(raw.cachedAt) || raw.cachedAt < 0) {
    return null;
  }

  const skills: SkillsShEntry[] = [];
  for (const item of raw.skills) {
    const normalized = normalizeSkillsShItem(item);
    if (normalized) skills.push(normalized);
  }

  return {
    view: raw.view,
    page: raw.page,
    skills,
    total: Math.max(raw.total, skills.length),
    hasMore: raw.hasMore,
    syncedAt: raw.syncedAt.trim(),
    cachedAt: raw.cachedAt,
  };
}

function parseStoredCache(rawText: string): Map<string, CachedListRecord> {
  const map = new Map<string, CachedListRecord>();
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return map;
  }
  if (!isRecord(parsed) || parsed.version !== 1 || !isRecord(parsed.entries)) {
    return map;
  }
  for (const [key, value] of Object.entries(parsed.entries)) {
    const record = parseCachedRecord(value);
    if (record && key === `${record.view}:${record.page}`) {
      map.set(key, record);
    }
  }
  return map;
}

/* ------------------------------------------------------------------ */
/* Servicio híbrido                                                    */
/* ------------------------------------------------------------------ */

export interface SkillsShServiceOptions {
  proxyUrl?: string;
  snapshotUrl?: string;
  fetchImpl?: typeof fetch;
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null;
  now?: () => number;
  ttlMs?: number;
}

export interface SkillsShApi {
  list(
    view: SkillsShView,
    page?: number,
    opts?: { forceFresh?: boolean }
  ): Promise<SkillsShListResult>;
  search(query: string, limit?: number): Promise<SkillsShSearchResult>;
  clearCache(): void;
}

function defaultSnapshotPath(): string {
  const rawBase =
    typeof import.meta !== 'undefined' && typeof import.meta.env?.BASE_URL === 'string'
      ? import.meta.env.BASE_URL
      : './';
  const base = rawBase || './';
  return `${base.endsWith('/') ? base : `${base}/`}data/skills-sh-snapshot.json`;
}

function resolveOptionProxyUrl(explicit: string | undefined): string {
  if (explicit === undefined) return resolveDefaultProxyUrl();
  const parsed = parseAllowedProxyUrl(explicit);
  if (!parsed) return '';
  return `${parsed.origin}${parsed.pathname.replace(/\/+$/, '')}`;
}

export function createSkillsShService(options: SkillsShServiceOptions = {}): SkillsShApi {
  const proxyUrl = resolveOptionProxyUrl(options.proxyUrl);
  const snapshotUrl = options.snapshotUrl ?? defaultSnapshotPath();
  const storage =
    options.storage === undefined
      ? typeof localStorage !== 'undefined'
        ? localStorage
        : null
      : options.storage;
  const now = options.now ?? (() => Date.now());
  const ttlMs = options.ttlMs ?? SKILLS_SH_TTL_MS;

  const doFetch: typeof fetch =
    options.fetchImpl ?? ((input, init) => globalThis.fetch(input, init));

  const memCache = new Map<string, CachedListRecord>();
  let hydrated = false;
  let cachedSnapshot: SkillsShSnapshotFile | null = null;

  function hydrateFromStorage(): void {
    if (hydrated) return;
    hydrated = true;
    if (!storage) return;
    try {
      const raw = storage.getItem(SKILLS_SH_CACHE_KEY);
      if (!raw) return;
      const loaded = parseStoredCache(raw);
      for (const [key, record] of loaded) {
        if (!memCache.has(key)) memCache.set(key, record);
      }
    } catch {
      /* Storage no disponible o bloqueado: continuar solo en memoria */
    }
  }

  function persistCache(): void {
    if (!storage) return;
    const sorted = [...memCache.entries()].sort((a, b) => b[1].cachedAt - a[1].cachedAt);
    const trimmed = sorted.slice(0, MAX_CACHED_PAGES);
    const entries: Record<string, CachedListRecord> = {};
    for (const [key, record] of trimmed) {
      entries[key] = record;
    }
    const envelope: StoredCacheEnvelope = { version: 1, entries };
    try {
      storage.setItem(SKILLS_SH_CACHE_KEY, JSON.stringify(envelope));
    } catch {
      /* Cuota llena o storage de solo lectura */
    }
  }

  function getCached(key: string): CachedListRecord | undefined {
    hydrateFromStorage();
    return memCache.get(key);
  }

  function setCached(key: string, record: CachedListRecord): void {
    hydrateFromStorage();
    memCache.set(key, record);
    persistCache();
  }

  async function fetchJson(url: string): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await doFetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  async function loadSnapshot(): Promise<SkillsShSnapshotFile> {
    if (cachedSnapshot) return cachedSnapshot;
    const raw = await fetchJson(snapshotUrl);
    const parsed = parseSkillsShSnapshot(raw);
    if (!parsed) {
      throw new Error('La copia de respaldo estática de skills.sh tiene un formato no válido.');
    }
    cachedSnapshot = parsed;
    return parsed;
  }

  function parseLiveListPayload(
    raw: unknown,
    view: SkillsShView,
    page: number
  ): SkillsShListResult | null {
    if (!isRecord(raw) || !Array.isArray(raw.skills)) return null;
    const skills: SkillsShEntry[] = [];
    for (const item of raw.skills) {
      const normalized = normalizeSkillsShItem(item);
      if (normalized) skills.push(normalized);
    }
    if (raw.skills.length > 0 && skills.length === 0) return null;

    const rawTotal = raw.total ?? raw.count;
    const total =
      typeof rawTotal === 'number' && Number.isInteger(rawTotal) && rawTotal >= 0
        ? Math.max(rawTotal, skills.length)
        : skills.length;
    const hasMore = typeof raw.hasMore === 'boolean' ? raw.hasMore : false;
    const syncedAt = isValidIsoDate(raw.syncedAt)
      ? raw.syncedAt.trim()
      : new Date(now()).toISOString();

    return {
      view,
      page,
      skills,
      total,
      hasMore,
      sourceMode: 'live',
      syncedAt,
    };
  }

  function parseLiveSearchPayload(
    raw: unknown,
    query: string,
    limit: number
  ): SkillsShSearchResult | null {
    if (!isRecord(raw) || !Array.isArray(raw.skills)) return null;
    const skills: SkillsShEntry[] = [];
    for (const item of raw.skills) {
      const normalized = normalizeSkillsShItem(item);
      if (normalized) skills.push(normalized);
    }
    if (raw.skills.length > 0 && skills.length === 0) return null;

    const limited = skills.slice(0, limit);
    const rawCount = raw.count ?? raw.total;
    const count =
      typeof rawCount === 'number' && Number.isInteger(rawCount) && rawCount >= 0
        ? Math.max(rawCount, limited.length)
        : limited.length;
    const syncedAt = isValidIsoDate(raw.syncedAt)
      ? raw.syncedAt.trim()
      : new Date(now()).toISOString();

    return {
      query,
      skills: limited,
      count,
      sourceMode: 'live',
      syncedAt,
    };
  }

  return {
    async list(
      view: SkillsShView,
      page = 0,
      opts?: { forceFresh?: boolean }
    ): Promise<SkillsShListResult> {
      const safeView: SkillsShView = isSkillsShView(view) ? view : 'all-time';
      const safePage = Number.isFinite(page)
        ? Math.min(MAX_PAGE, Math.max(0, Math.trunc(page)))
        : 0;
      const cacheKey = `${safeView}:${safePage}`;
      const cached = getCached(cacheKey);

      if (!opts?.forceFresh && cached && now() - cached.cachedAt < ttlMs) {
        return {
          view: safeView,
          page: safePage,
          skills: cached.skills,
          total: cached.total,
          hasMore: cached.hasMore,
          sourceMode: 'cache',
          syncedAt: cached.syncedAt,
        };
      }

      let proxyFailed = false;
      if (proxyUrl) {
        try {
          const url = `${proxyUrl}?mode=list&view=${encodeURIComponent(safeView)}&page=${safePage}`;
          const raw = await fetchJson(url);
          const live = parseLiveListPayload(raw, safeView, safePage);
          if (live) {
            setCached(cacheKey, {
              view: live.view,
              page: live.page,
              skills: live.skills,
              total: live.total,
              hasMore: live.hasMore,
              syncedAt: live.syncedAt,
              cachedAt: now(),
            });
            return live;
          }
          proxyFailed = true;
        } catch {
          proxyFailed = true;
        }
      }

      if (cached) {
        return {
          view: safeView,
          page: safePage,
          skills: cached.skills,
          total: cached.total,
          hasMore: cached.hasMore,
          sourceMode: 'cache',
          syncedAt: cached.syncedAt,
          notice:
            'Mostrando la última copia guardada porque la sincronización en vivo no respondió.',
        };
      }

      let snapshot: SkillsShSnapshotFile;
      try {
        snapshot = await loadSnapshot();
      } catch {
        throw new Error(
          'No se pudo cargar el directorio de skills.sh ni la copia de respaldo estática. Inténtalo de nuevo más tarde.'
        );
      }

      const viewData = snapshot.views[safeView];
      const normalized = viewData.skills
        .map(normalizeSkillsShItem)
        .filter((item): item is SkillsShEntry => item !== null);

      const start = safePage * SNAPSHOT_PAGE_SIZE;
      const end = start + SNAPSHOT_PAGE_SIZE;
      const pageItems = normalized.slice(start, end);
      const hasMore = end < normalized.length;

      const notice = proxyFailed
        ? 'La sincronización en vivo con skills.sh no respondió temporalmente. Mostrando copia de respaldo estática.'
        : 'Mostrando copia de respaldo estática del directorio (proxy de sincronización en vivo no configurado).';

      return {
        view: safeView,
        page: safePage,
        skills: pageItems,
        total: viewData.total,
        hasMore,
        sourceMode: 'snapshot',
        syncedAt: snapshot.generatedAt,
        notice,
      };
    },

    async search(query: string, limit = 30): Promise<SkillsShSearchResult> {
      const cleanQ = cleanSingleLine(query, MAX_QUERY_LEN);
      const safeLimit = Number.isFinite(limit)
        ? Math.min(MAX_SEARCH_LIMIT, Math.max(1, Math.trunc(limit)))
        : 30;

      if (!cleanQ) {
        return {
          query: '',
          skills: [],
          count: 0,
          sourceMode: proxyUrl ? 'live' : 'snapshot',
          syncedAt: new Date(now()).toISOString(),
        };
      }

      let proxyFailed = false;
      if (proxyUrl) {
        try {
          const url = `${proxyUrl}?mode=search&q=${encodeURIComponent(cleanQ)}&limit=${safeLimit}`;
          const raw = await fetchJson(url);
          const live = parseLiveSearchPayload(raw, cleanQ, safeLimit);
          if (live) return live;
          proxyFailed = true;
        } catch {
          proxyFailed = true;
        }
      }

      hydrateFromStorage();
      const byId = new Map<string, SkillsShEntry>();
      const addEntry = (entry: SkillsShEntry) => {
        const existing = byId.get(entry.id);
        if (!existing || entry.installs > existing.installs) {
          byId.set(entry.id, entry);
        }
      };

      let snapshot: SkillsShSnapshotFile | null = null;
      try {
        snapshot = await loadSnapshot();
        for (const view of VALID_VIEWS) {
          for (const rawItem of snapshot.views[view].skills) {
            const normalized = normalizeSkillsShItem(rawItem);
            if (normalized) addEntry(normalized);
          }
        }
      } catch {
        snapshot = null;
      }

      let latestCachedSyncedAt = '';
      for (const record of memCache.values()) {
        if (!latestCachedSyncedAt || record.syncedAt > latestCachedSyncedAt) {
          latestCachedSyncedAt = record.syncedAt;
        }
        for (const entry of record.skills) {
          addEntry(entry);
        }
      }

      if (!snapshot && byId.size === 0) {
        throw new Error(
          'No se pudo buscar en skills.sh ni cargar la copia de respaldo estática. Inténtalo de nuevo más tarde.'
        );
      }

      const needle = cleanQ.toLowerCase();
      const matches = [...byId.values()].filter(
        (entry) =>
          entry.name.toLowerCase().includes(needle) ||
          entry.skillId.toLowerCase().includes(needle) ||
          entry.source.toLowerCase().includes(needle)
      );
      matches.sort((a, b) => b.installs - a.installs || a.name.localeCompare(b.name));

      const limited = matches.slice(0, safeLimit);
      const syncedAt = snapshot?.generatedAt ?? (latestCachedSyncedAt || new Date(now()).toISOString());
      const notice = proxyFailed
        ? 'La búsqueda en vivo con skills.sh no respondió. Mostrando coincidencias de la copia de respaldo local.'
        : 'Búsqueda local sobre la copia de respaldo estática (proxy en vivo no configurado).';

      return {
        query: cleanQ,
        skills: limited,
        count: matches.length,
        sourceMode: 'snapshot',
        syncedAt,
        notice,
      };
    },

    clearCache(): void {
      memCache.clear();
      hydrated = false;
      cachedSnapshot = null;
      try {
        storage?.removeItem(SKILLS_SH_CACHE_KEY);
      } catch {
        /* Ignorar errores de storage */
      }
    },
  };
}

export const skillsShService: SkillsShApi = createSkillsShService();
