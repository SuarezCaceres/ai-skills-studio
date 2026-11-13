import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import type { CatalogApi, GithubSession } from '../types/catalog';
import {
  completeLoginFromUrl,
  getSession,
  isGithubOAuthConfigured,
  signInWithGithub,
  signOut,
  subscribe,
} from '../services/githubAuthService';
import { createGithubCatalogService, type GithubCatalogApi } from '../services/githubCatalogService';

/** Instancia única del servicio: comparte caché entre todos los componentes. */
const catalogService: GithubCatalogApi = createGithubCatalogService({ getSession });

export interface UseCatalogResult {
  /** Superficie del catálogo (`CatalogApi`) respaldada por GitHub. */
  api: CatalogApi;
  /** Igual que `api` pero con extras (p. ej. contenido de un archivo de la skill). */
  service: GithubCatalogApi;
  /** Sesión de GitHub en memoria, o `null` si es visitante. */
  session: GithubSession | null;
  /** `false` si faltan `VITE_GITHUB_CLIENT_ID` / `VITE_GITHUB_OAUTH_URL`. */
  oauthConfigured: boolean;
  /** `true` mientras se espera la respuesta de GitHub. */
  signingIn: boolean;
  /** Último error de inicio de sesión (mensaje en español), si lo hubo. */
  authError: string | null;
  /** Botón "Entrar con GitHub". */
  signIn: () => Promise<GithubSession | null>;
  signOut: () => void;
}

/**
 * Hook del catálogo: expone `CatalogApi` y la sesión de GitHub.
 * Al montarse completa el regreso de OAuth si la URL trae `?code&state`.
 */
export function useCatalog(): UseCatalogResult {
  const session = useSyncExternalStore(subscribe, getSession, getSession);
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    completeLoginFromUrl().catch((err: unknown) => {
      if (alive) setAuthError(err instanceof Error ? err.message : 'No se pudo completar el inicio de sesión.');
    });
    return () => {
      alive = false;
    };
  }, []);

  const signIn = useCallback(async () => {
    setAuthError(null);
    setSigningIn(true);
    try {
      return await signInWithGithub();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'No se pudo iniciar sesión con GitHub.');
      return null;
    } finally {
      setSigningIn(false);
    }
  }, []);

  return {
    api: catalogService,
    service: catalogService,
    session,
    oauthConfigured: isGithubOAuthConfigured(),
    signingIn,
    authError,
    signIn,
    signOut,
  };
}
