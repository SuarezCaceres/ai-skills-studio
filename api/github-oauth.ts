/**
 * Función serverless de Vercel: intercambia el `code` de OAuth de GitHub por un
 * token de acceso. Es el ÚNICO lugar que conoce el client secret.
 *
 * Variables de entorno (configurar en Vercel, nunca en el repo):
 *   GITHUB_CLIENT_ID       client id de la OAuth App
 *   GITHUB_CLIENT_SECRET   client secret de la OAuth App
 *   ALLOWED_ORIGINS        orígenes del sitio separados por comas, sin barra final.
 *                          Ej.: https://suarezcaceres.github.io,http://localhost:5173
 *
 * Contrato:  POST  { code, redirect_uri, code_verifier? }
 *            200   { access_token, token_type, scope }   (sin nada más)
 *            4xx/5xx { error }  (mensajes genéricos; nunca se registran secretos)
 *
 * CORS: solo responde a los orígenes de ALLOWED_ORIGINS.
 */

declare const process: { env: Record<string, string | undefined> };

const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const MAX_BODY_BYTES = 2048;

function allowedOrigins(): string[] {
  return (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '600',
    Vary: 'Origin',
  };
}

function json(status: number, body: unknown, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...extra,
    },
  });
}

/** Devuelve el origen permitido de la petición o `null`. */
function checkOrigin(request: Request): string | null {
  const origin = (request.headers.get('origin') ?? '').replace(/\/+$/, '');
  return origin && allowedOrigins().includes(origin) ? origin : null;
}

export function OPTIONS(request: Request): Response {
  const origin = checkOrigin(request);
  if (!origin) return new Response(null, { status: 403 });
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function POST(request: Request): Promise<Response> {
  const origin = checkOrigin(request);
  if (!origin) return json(403, { error: 'origin_not_allowed' });
  const cors = corsHeaders(origin);

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret || allowedOrigins().length === 0) {
    return json(500, { error: 'server_not_configured' }, cors);
  }

  // Cuerpo acotado para no procesar peticiones abusivas.
  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return json(400, { error: 'invalid_request' }, cors);
  }
  if (raw.length > MAX_BODY_BYTES) return json(413, { error: 'payload_too_large' }, cors);

  let payload: { code?: unknown; redirect_uri?: unknown; code_verifier?: unknown };
  try {
    payload = JSON.parse(raw) as typeof payload;
  } catch {
    return json(400, { error: 'invalid_request' }, cors);
  }

  const { code, redirect_uri: redirectUri, code_verifier: codeVerifier } = payload;
  if (typeof code !== 'string' || !/^[A-Za-z0-9_-]{10,100}$/.test(code)) {
    return json(400, { error: 'invalid_code' }, cors);
  }
  if (typeof redirectUri !== 'string' || redirectUri.length > 300) {
    return json(400, { error: 'invalid_redirect_uri' }, cors);
  }
  try {
    // El redirect_uri debe pertenecer al propio sitio autorizado.
    if (!allowedOrigins().includes(new URL(redirectUri).origin)) {
      return json(400, { error: 'invalid_redirect_uri' }, cors);
    }
  } catch {
    return json(400, { error: 'invalid_redirect_uri' }, cors);
  }
  if (codeVerifier !== undefined && (typeof codeVerifier !== 'string' || !/^[A-Za-z0-9._~-]{43,128}$/.test(codeVerifier))) {
    return json(400, { error: 'invalid_code_verifier' }, cors);
  }

  const form = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
  });
  if (typeof codeVerifier === 'string') form.set('code_verifier', codeVerifier);

  let upstream: Response;
  try {
    upstream = await fetch(GITHUB_TOKEN_URL, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
    });
  } catch {
    return json(502, { error: 'github_unreachable' }, cors);
  }

  let data: { access_token?: unknown; token_type?: unknown; scope?: unknown; error?: unknown } = {};
  try {
    data = (await upstream.json()) as typeof data;
  } catch {
    return json(502, { error: 'github_bad_response' }, cors);
  }

  if (!upstream.ok || typeof data.access_token !== 'string' || data.error) {
    // No se reenvía el detalle de GitHub: basta con saber que el intercambio falló.
    return json(400, { error: 'exchange_failed' }, cors);
  }

  return json(
    200,
    {
      access_token: data.access_token,
      token_type: typeof data.token_type === 'string' ? data.token_type : 'bearer',
      scope: typeof data.scope === 'string' ? data.scope : '',
    },
    cors
  );
}
