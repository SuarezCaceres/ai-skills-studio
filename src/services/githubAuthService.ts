import type { GithubSession } from '../types/catalog';

/**
 * Autenticación con GitHub (OAuth App, flujo de código web con PKCE).
 *
 * - El navegador solo conoce el `client_id` (público). El intercambio del código
 *   por token lo hace la función serverless `api/github-oauth.ts`, que es la
 *   única que conoce el `client secret` (variable de entorno en Vercel).
 * - El token vive SOLO en memoria de esta pestaña: nunca en localStorage,
 *   sessionStorage ni cookies. Recargar la página cierra la sesión.
 * - Estado anti-CSRF aleatorio de un solo uso, verificado antes de intercambiar.
 * - Por defecto abre una ventana emergente para no perder el estado de la app;
 *   si el navegador la bloquea, redirige la pestaña completa.
 *
 * Configuración (variables públicas de Vite, ver docs/catalog-setup.md):
 *   VITE_GITHUB_CLIENT_ID   client id de la OAuth App
 *   VITE_GITHUB_OAUTH_URL   URL de la función, ej. https://mi-proyecto.vercel.app/api/github-oauth
 */

export type AuthErrorCode =
  | 'not_configured'
  | 'popup_blocked'
  | 'cancelled'
  | 'state_mismatch'
  | 'access_denied'
  | 'exchange_failed'
  | 'network';

export class AuthError extends Error {
  readonly code: AuthErrorCode;
  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

const AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const USER_URL = 'https://api.github.com/user';
const SCOPE = 'public_repo';
const PENDING_KEY = 'codice-oauth-pending';
const POPUP_NAME = 'codice-github-oauth';
const MESSAGE_TYPE = 'codice-github-oauth-result';
const PENDING_TTL_MS = 10 * 60_000;

const clientId = (): string => String(import.meta.env.VITE_GITHUB_CLIENT_ID ?? '').trim();
const exchangeUrl = (): string => String(import.meta.env.VITE_GITHUB_OAUTH_URL ?? '').trim();

export function isGithubOAuthConfigured(): boolean {
  const url = exchangeUrl();
  return clientId() !== '' && (/^https:\/\//.test(url) || /^http:\/\/localhost[:/]/.test(url));
}

/* ---------------- Sesión en memoria ---------------- */

let currentSession: GithubSession | null = null;
const listeners = new Set<() => void>();

function setSession(next: GithubSession | null): void {
  currentSession = next;
  listeners.forEach((fn) => fn());
}

export function getSession(): GithubSession | null {
  return currentSession;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function signOut(): void {
  setSession(null);
}

/* ---------------- Utilidades criptográficas ---------------- */

function base64Url(bytes: Uint8Array): string {
  let bin = '';
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomToken(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64Url(bytes);
}

async function challengeFor(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64Url(new Uint8Array(digest));
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/* ---------------- Estado pendiente (anti-CSRF + PKCE) ---------------- */

interface PendingLogin {
  state: string;
  verifier: string;
  redirectUri: string;
  mode: 'popup' | 'redirect';
  createdAt: number;
}

let pendingInMemory: PendingLogin | null = null;

function savePending(p: PendingLogin): void {
  pendingInMemory = p;
  // El verificador PKCE y el estado no son el token: solo sirven para este intercambio.
  if (p.mode === 'redirect') {
    try {
      sessionStorage.setItem(PENDING_KEY, JSON.stringify(p));
    } catch {
      /* sin sessionStorage el flujo de redirección no podrá completarse */
    }
  }
}

function takePending(): PendingLogin | null {
  let p = pendingInMemory;
  pendingInMemory = null;
  if (!p) {
    try {
      const raw = sessionStorage.getItem(PENDING_KEY);
      if (raw) p = JSON.parse(raw) as PendingLogin;
    } catch {
      p = null;
    }
  }
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignorar */
  }
  return p;
}

function redirectUri(): string {
  return `${window.location.origin}${window.location.pathname}`;
}

/* ---------------- Intercambio de código ---------------- */

async function completeExchange(code: string, state: string): Promise<GithubSession> {
  const pending = takePending(); // un solo uso
  if (
    !pending ||
    Date.now() - pending.createdAt > PENDING_TTL_MS ||
    !timingSafeEqual(pending.state, state)
  ) {
    throw new AuthError(
      'state_mismatch',
      'La respuesta de GitHub no coincide con tu intento de inicio de sesión (posible CSRF o enlace caducado). Inténtalo de nuevo.'
    );
  }

  let tokenResponse: Response;
  try {
    tokenResponse = await fetch(exchangeUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'omit',
      body: JSON.stringify({ code, redirect_uri: pending.redirectUri, code_verifier: pending.verifier }),
    });
  } catch {
    throw new AuthError('network', 'No se pudo contactar con el servicio de inicio de sesión. Inténtalo de nuevo.');
  }
  let payload: { access_token?: unknown; expires_in?: unknown } = {};
  try {
    payload = (await tokenResponse.json()) as typeof payload;
  } catch {
    /* respuesta no JSON */
  }
  if (!tokenResponse.ok || typeof payload.access_token !== 'string' || payload.access_token.length < 10) {
    throw new AuthError('exchange_failed', 'GitHub no aceptó el código de acceso. Vuelve a intentar entrar.');
  }
  const token = payload.access_token;

  let userResponse: Response;
  try {
    userResponse = await fetch(USER_URL, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
    });
  } catch {
    throw new AuthError('network', 'No se pudo leer tu perfil de GitHub. Inténtalo de nuevo.');
  }
  if (!userResponse.ok) throw new AuthError('exchange_failed', 'No se pudo verificar tu cuenta de GitHub.');
  const user = (await userResponse.json()) as { login?: unknown; avatar_url?: unknown };
  if (typeof user.login !== 'string' || !/^[A-Za-z0-9-]{1,39}$/.test(user.login)) {
    throw new AuthError('exchange_failed', 'GitHub devolvió un perfil no válido.');
  }

  const expiresIn = typeof payload.expires_in === 'number' ? payload.expires_in : undefined;
  const session: GithubSession = {
    login: user.login,
    avatarUrl:
      typeof user.avatar_url === 'string' && user.avatar_url.startsWith('https://avatars.githubusercontent.com/')
        ? user.avatar_url
        : undefined,
    token,
    expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : undefined,
  };
  setSession(session);
  return session;
}

/* ---------------- Inicio de sesión ---------------- */

let signInInFlight: Promise<GithubSession> | null = null;

/** Botón "Entrar con GitHub": abre la autorización de GitHub y devuelve la sesión. */
export function signInWithGithub(): Promise<GithubSession> {
  if (signInInFlight) return signInInFlight;
  signInInFlight = startSignIn().finally(() => {
    signInInFlight = null;
  });
  return signInInFlight;
}

async function startSignIn(): Promise<GithubSession> {
  if (!isGithubOAuthConfigured()) {
    throw new AuthError(
      'not_configured',
      'El inicio de sesión con GitHub no está configurado (VITE_GITHUB_CLIENT_ID y VITE_GITHUB_OAUTH_URL). Ver docs/catalog-setup.md.'
    );
  }
  const verifier = randomToken(48);
  const pending: PendingLogin = {
    state: randomToken(24),
    verifier,
    redirectUri: redirectUri(),
    mode: 'popup',
    createdAt: Date.now(),
  };
  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set('client_id', clientId());
  url.searchParams.set('redirect_uri', pending.redirectUri);
  url.searchParams.set('scope', SCOPE);
  url.searchParams.set('state', pending.state);
  url.searchParams.set('code_challenge', await challengeFor(verifier));
  url.searchParams.set('code_challenge_method', 'S256');

  const popup = window.open(url.toString(), POPUP_NAME, 'popup=yes,width=520,height=720');
  if (!popup) {
    // Ventana bloqueada: redirección completa; la sesión se completa al volver (completeLoginFromUrl).
    savePending({ ...pending, mode: 'redirect' });
    const redirect = new URL(url.toString());
    window.location.assign(redirect.toString());
    return new Promise<GithubSession>(() => undefined);
  }
  savePending(pending);

  return new Promise<GithubSession>((resolve, reject) => {
    let settled = false;
    const finish = () => {
      settled = true;
      window.removeEventListener('message', onMessage);
      window.clearInterval(timer);
    };
    const onMessage = (ev: MessageEvent) => {
      if (ev.origin !== window.location.origin || ev.source !== popup) return;
      const data = ev.data as { type?: unknown; code?: unknown; state?: unknown; error?: unknown } | null;
      if (!data || data.type !== MESSAGE_TYPE) return;
      finish();
      if (typeof data.error === 'string' && data.error) {
        takePending();
        reject(new AuthError('access_denied', 'Cancelaste la autorización en GitHub.'));
        return;
      }
      if (typeof data.code !== 'string' || typeof data.state !== 'string') {
        takePending();
        reject(new AuthError('exchange_failed', 'Respuesta de GitHub incompleta.'));
        return;
      }
      completeExchange(data.code, data.state).then(resolve, reject);
    };
    window.addEventListener('message', onMessage);
    const timer = window.setInterval(() => {
      if (!popup.closed) return;
      // Pequeña espera por si el mensaje aún está en cola.
      window.setTimeout(() => {
        if (settled) return;
        finish();
        takePending();
        reject(new AuthError('cancelled', 'Cerraste la ventana de GitHub antes de terminar.'));
      }, 400);
      window.clearInterval(timer);
    }, 500);
  });
}

let callbackHandled = false;

/**
 * Llamar una vez al arrancar la app (lo hace `useCatalog`). Gestiona la vuelta de
 * GitHub con `?code=...&state=...`:
 *  - En la ventana emergente: reenvía el resultado a la pestaña principal y se cierra.
 *  - En el modo redirección: completa el inicio de sesión en esta pestaña.
 * Devuelve la sesión si se completó aquí, o `null` si no había nada que hacer.
 */
export async function completeLoginFromUrl(): Promise<GithubSession | null> {
  if (callbackHandled) return null;
  const params = new URLSearchParams(window.location.search);
  const state = params.get('state');
  const code = params.get('code');
  const oauthError = params.get('error');
  if (!state || (!code && !oauthError)) return null;
  callbackHandled = true;

  // Limpia la URL para que el código no quede en el historial ni se reutilice.
  const cleanSearch = new URLSearchParams(window.location.search);
  ['code', 'state', 'error', 'error_description', 'error_uri'].forEach((k) => cleanSearch.delete(k));
  const qs = cleanSearch.toString();
  window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`);

  if (window.name === POPUP_NAME) {
    if (window.opener && window.opener !== window) {
      window.opener.postMessage(
        { type: MESSAGE_TYPE, code, state, error: oauthError ?? undefined },
        window.location.origin
      );
    }
    window.close();
    return null;
  }

  if (oauthError) {
    takePending();
    throw new AuthError('access_denied', 'Cancelaste la autorización en GitHub.');
  }
  return completeExchange(code as string, state);
}
