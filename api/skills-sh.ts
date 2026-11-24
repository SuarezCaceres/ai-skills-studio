/**
 * Función serverless de Vercel: proxy ligero de solo lectura hacia el directorio
 * público https://www.skills.sh con lista blanca anti-SSRF, CORS estricto por
 * `ALLOWED_ORIGINS`, saneamiento de respuesta y caché Edge.
 *
 * Variables de entorno (configurar en Vercel, nunca en el repo):
 *   ALLOWED_ORIGINS   orígenes del sitio separados por comas, sin barra final.
 *                     Ej.: https://suarezcaceres.github.io,http://localhost:5173
 *
 * Contrato:
 *   GET ?mode=list&view=all-time|trending|hot&page=0..50
 *   GET ?mode=search&q=<1..80 chars>&limit=1..50
 *   OPTIONS (preflight CORS)
 *
 * Respuestas:
 *   200     { mode, view?, page?, query?, skills, total?, hasMore?, count?, syncedAt }
 *   400     { error: 'invalid_mode' | 'invalid_view' | 'invalid_page' | 'invalid_query' | 'invalid_limit' | 'invalid_request' }
 *   403     { error: 'origin_not_allowed' }
 *   405     { error: 'method_not_allowed' }
 *   502     { error: 'upstream_unavailable' }
 */

declare const process: { env: Record<string, string | undefined> };

const UPSTREAM_ORIGIN = 'https://www.skills.sh';
const UPSTREAM_TIMEOUT_MS = 8000;
const MAX_UPSTREAM_BYTES = 1024 * 1024; // 1 MB
const MAX_PAGE = 50;
const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;
const MAX_QUERY_LEN = 80;
const MAX_SKILLS_ITEMS = 200;
const MAX_WEEKLY_POINTS = 16;

const EDGE_CACHE_CONTROL = 'public, s-maxage=300, stale-while-revalidate=3600';
const CONTROL_CHAR_RE = /[\u0000-\u001F\u007F]/;
const NON_NEGATIVE_INT_RE = /^\d+$/;

const ALLOWED_VIEWS = {
  'all-time': 'all-time',
  trending: 'trending',
  hot: 'hot',
} as const;

type AllowedView = keyof typeof ALLOWED_VIEWS;

interface SanitizedSkillItem {
  source: string;
  skillId: string;
  name: string;
  installs: number;
  weeklyInstalls?: number[];
  installsYesterday?: number;
  change?: number;
  isOfficial?: boolean;
}

export interface SkillsShHandlerOptions {
  fetchImpl?: typeof fetch;
  allowedOrigins?: string[];
}

function normalizeOrigins(rawOrigins: string[]): string[] {
  return rawOrigins
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

function resolveAllowedOrigins(override?: string[]): string[] {
  if (override !== undefined) {
    return normalizeOrigins(override);
  }
  const envValue = typeof process !== 'undefined' ? (process.env.ALLOWED_ORIGINS ?? '') : '';
  return normalizeOrigins(envValue.split(','));
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Max-Age': '600',
    Vary: 'Origin',
  };
}

function jsonResponse(
  status: number,
  body: unknown,
  extraHeaders: Record<string, string> = {},
  cacheControl = 'no-store'
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cacheControl,
      'X-Content-Type-Options': 'nosniff',
      Vary: 'Origin',
      ...extraHeaders,
    },
  });
}

/** Devuelve el origen permitido de la petición o `null` si no coincide exactamente. */
function checkOrigin(request: Request, origins: string[]): string | null {
  const origin = (request.headers.get('origin') ?? '').trim().replace(/\/+$/, '');
  return origin && origins.includes(origin) ? origin : null;
}

function isAllowedView(value: string | null): value is AllowedView {
  return value !== null && Object.prototype.hasOwnProperty.call(ALLOWED_VIEWS, value);
}

function parseBoundedInt(
  raw: string | null,
  defaultValue: number,
  min: number,
  max: number
): number | null {
  if (raw === null || raw === '') return defaultValue;
  if (!NON_NEGATIVE_INT_RE.test(raw)) return null;
  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) return null;
  return parsed;
}

function sanitizeSkillItem(raw: unknown): SanitizedSkillItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;

  if (typeof item.source !== 'string' || typeof item.skillId !== 'string' || typeof item.name !== 'string') {
    return null;
  }

  const source = item.source.trim();
  const skillId = item.skillId.trim();
  const name = item.name.trim();

  if (
    !source ||
    source.length > 200 ||
    CONTROL_CHAR_RE.test(source) ||
    /\s/.test(source)
  ) {
    return null;
  }
  if (
    !skillId ||
    skillId.length > 150 ||
    CONTROL_CHAR_RE.test(skillId) ||
    /\s/.test(skillId)
  ) {
    return null;
  }
  if (!name || name.length > 150 || CONTROL_CHAR_RE.test(name)) {
    return null;
  }

  if (typeof item.installs !== 'number' || !Number.isFinite(item.installs) || item.installs < 0) {
    return null;
  }

  const sanitized: SanitizedSkillItem = {
    source,
    skillId,
    name,
    installs: Math.trunc(item.installs),
  };

  if (Array.isArray(item.weeklyInstalls)) {
    const weekly: number[] = [];
    for (const point of item.weeklyInstalls) {
      if (weekly.length >= MAX_WEEKLY_POINTS) break;
      if (typeof point === 'number' && Number.isFinite(point) && point >= 0) {
        weekly.push(Math.trunc(point));
      }
    }
    if (weekly.length > 0) {
      sanitized.weeklyInstalls = weekly;
    }
  }

  if (
    typeof item.installsYesterday === 'number' &&
    Number.isFinite(item.installsYesterday) &&
    item.installsYesterday >= 0
  ) {
    sanitized.installsYesterday = Math.trunc(item.installsYesterday);
  }

  if (typeof item.change === 'number' && Number.isFinite(item.change)) {
    sanitized.change = Math.trunc(item.change);
  }

  if (typeof item.isOfficial === 'boolean') {
    sanitized.isOfficial = item.isOfficial;
  }

  return sanitized;
}

function sanitizeSkillsList(rawSkills: unknown): SanitizedSkillItem[] | null {
  if (!Array.isArray(rawSkills)) return null;
  const result: SanitizedSkillItem[] = [];
  for (const entry of rawSkills) {
    if (result.length >= MAX_SKILLS_ITEMS) break;
    const clean = sanitizeSkillItem(entry);
    if (clean) result.push(clean);
  }
  return result;
}

async function readBoundedText(response: Response, maxBytes: number): Promise<string> {
  const contentLengthHeader = response.headers?.get?.('content-length');
  if (contentLengthHeader) {
    const declaredLength = Number(contentLengthHeader);
    if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
      try {
        await response.body?.cancel?.();
      } catch {
        // Ignorar fallo al cancelar el stream excedido.
      }
      throw new Error('upstream_too_large');
    }
  }

  if (response.body && typeof response.body.getReader === 'function') {
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!value) continue;
        totalBytes += value.byteLength;
        if (totalBytes > maxBytes) {
          await reader.cancel();
          throw new Error('upstream_too_large');
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }

    const merged = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return new TextDecoder('utf-8').decode(merged);
  }

  if (typeof response.text === 'function') {
    const text = await response.text();
    if (new TextEncoder().encode(text).byteLength > maxBytes) {
      throw new Error('upstream_too_large');
    }
    return text;
  }

  if (typeof response.json === 'function') {
    const serialized = JSON.stringify(await response.json());
    if (new TextEncoder().encode(serialized).byteLength > maxBytes) {
      throw new Error('upstream_too_large');
    }
    return serialized;
  }

  throw new Error('upstream_unreadable');
}

export async function handleSkillsShRequest(
  request: Request,
  options: SkillsShHandlerOptions = {}
): Promise<Response> {
  const allowedOrigins = resolveAllowedOrigins(options.allowedOrigins);
  const origin = checkOrigin(request, allowedOrigins);

  if (!origin) {
    return jsonResponse(403, { error: 'origin_not_allowed' });
  }

  const cors = corsHeaders(origin);
  const method = (request.method || 'GET').toUpperCase();

  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...cors,
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }

  if (method !== 'GET') {
    return jsonResponse(405, { error: 'method_not_allowed' }, cors);
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(request.url);
  } catch {
    return jsonResponse(400, { error: 'invalid_request' }, cors);
  }

  const mode = parsedUrl.searchParams.get('mode');
  let upstreamUrl: string;
  let listMeta: { view: AllowedView; page: number } | null = null;
  let searchMeta: { query: string; limit: number } | null = null;

  if (mode === 'list') {
    const rawView = parsedUrl.searchParams.get('view');
    if (!isAllowedView(rawView)) {
      return jsonResponse(400, { error: 'invalid_view' }, cors);
    }

    const page = parseBoundedInt(parsedUrl.searchParams.get('page'), 0, 0, MAX_PAGE);
    if (page === null) {
      return jsonResponse(400, { error: 'invalid_page' }, cors);
    }

    const safeView = ALLOWED_VIEWS[rawView];
    upstreamUrl = `${UPSTREAM_ORIGIN}/api/skills/${safeView}/${page}`;
    listMeta = { view: safeView, page };
  } else if (mode === 'search') {
    const rawQuery = parsedUrl.searchParams.get('q');
    if (rawQuery === null || CONTROL_CHAR_RE.test(rawQuery)) {
      return jsonResponse(400, { error: 'invalid_query' }, cors);
    }
    const query = rawQuery.trim();
    if (query.length < 1 || query.length > MAX_QUERY_LEN) {
      return jsonResponse(400, { error: 'invalid_query' }, cors);
    }

    const limit = parseBoundedInt(
      parsedUrl.searchParams.get('limit'),
      DEFAULT_LIMIT,
      1,
      MAX_LIMIT
    );
    if (limit === null) {
      return jsonResponse(400, { error: 'invalid_limit' }, cors);
    }

    upstreamUrl = `${UPSTREAM_ORIGIN}/api/search?q=${encodeURIComponent(query)}&limit=${limit}`;
    searchMeta = { query, limit };
  } else {
    return jsonResponse(400, { error: 'invalid_mode' }, cors);
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  let upstream: Response;
  try {
    upstream = await fetchImpl(upstreamUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      redirect: 'error',
      signal: controller.signal,
    });
  } catch {
    clearTimeout(timer);
    return jsonResponse(502, { error: 'upstream_unavailable' }, cors);
  }

  try {
    if (upstream.url) {
      const finalOrigin = new URL(upstream.url).origin;
      if (finalOrigin !== UPSTREAM_ORIGIN) {
        return jsonResponse(502, { error: 'upstream_unavailable' }, cors);
      }
    }

    if (!upstream.ok) {
      return jsonResponse(502, { error: 'upstream_unavailable' }, cors);
    }

    const rawText = await readBoundedText(upstream, MAX_UPSTREAM_BYTES);
    const data = JSON.parse(rawText) as Record<string, unknown>;
    if (!data || typeof data !== 'object') {
      return jsonResponse(502, { error: 'upstream_unavailable' }, cors);
    }

    const skills = sanitizeSkillsList(data.skills);
    if (skills === null) {
      return jsonResponse(502, { error: 'upstream_unavailable' }, cors);
    }

    const syncedAt = new Date().toISOString();

    if (listMeta) {
      const total =
        typeof data.total === 'number' && Number.isFinite(data.total) && data.total >= 0
          ? Math.trunc(data.total)
          : skills.length;
      const hasMore = typeof data.hasMore === 'boolean' ? data.hasMore : false;

      return jsonResponse(
        200,
        {
          mode: 'list',
          view: listMeta.view,
          page: listMeta.page,
          skills,
          total,
          hasMore,
          syncedAt,
        },
        cors,
        EDGE_CACHE_CONTROL
      );
    }

    const count =
      typeof data.count === 'number' && Number.isFinite(data.count) && data.count >= 0
        ? Math.trunc(data.count)
        : skills.length;

    return jsonResponse(
      200,
      {
        mode: 'search',
        query: searchMeta!.query,
        skills,
        count,
        syncedAt,
      },
      cors,
      EDGE_CACHE_CONTROL
    );
  } catch {
    return jsonResponse(502, { error: 'upstream_unavailable' }, cors);
  } finally {
    clearTimeout(timer);
  }
}

export function OPTIONS(request: Request): Response {
  const origin = checkOrigin(request, resolveAllowedOrigins());
  if (!origin) {
    return jsonResponse(403, { error: 'origin_not_allowed' });
  }
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders(origin),
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export async function GET(request: Request): Promise<Response> {
  return handleSkillsShRequest(request);
}
