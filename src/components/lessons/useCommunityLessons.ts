import { useCallback, useEffect, useState } from 'react';
import type { GithubSession, LessonSharingApi } from '../../types/catalog';
import type { CommunityLesson } from '../../types/lessons';
import { describeSharingError, type SharingFailure } from './sharingErrors';

/** Clave estable de una clase de Comunidad (el mismo id puede repetirse entre autoras distintas). */
export const communityKey = (lesson: Pick<CommunityLesson, 'repo' | 'id'>) => `${lesson.repo}/${lesson.id}`;

export type CommunityStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface UseCommunityLessonsResult {
  /** `idle`: sin sesión o todavía sin abrir la vista (no se hace ninguna petición). */
  status: CommunityStatus;
  lessons: CommunityLesson[];
  error: SharingFailure | null;
  reload: () => void;
}

/**
 * Clases compartidas por cualquiera (solo metadatos). Sin sesión, o mientras `enabled` sea `false`,
 * NO se hace ninguna petición. Se pide una vez por sesión y se vuelve a pedir con `reload`.
 */
export function useCommunityLessons(service: LessonSharingApi, session: GithubSession | null, enabled: boolean): UseCommunityLessonsResult {
  const login = session?.login ?? null;
  const [state, setState] = useState<Omit<UseCommunityLessonsResult, 'reload'>>({ status: 'idle', lessons: [], error: null });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!enabled || !login) {
      setState({ status: 'idle', lessons: [], error: null });
      return;
    }
    let cancelled = false;
    setState((prev) => ({ status: 'loading', lessons: prev.lessons, error: null }));
    service
      .listCommunityLessons()
      .then((lessons) => {
        if (!cancelled) setState({ status: 'ready', lessons, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled) setState({ status: 'error', lessons: [], error: describeSharingError(err, 'list') });
      });
    return () => {
      cancelled = true;
    };
  }, [service, login, enabled, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { ...state, reload };
}

export type CommunityBodyState =
  | { status: 'loading' }
  | { status: 'ready'; lesson: CommunityLesson }
  | { status: 'gone' }
  | { status: 'error'; error: SharingFailure };

/** Carga el cuerpo de una clase de Comunidad desde su commit fijado. */
export function useCommunityLessonBody(service: LessonSharingApi, summary: CommunityLesson | undefined): CommunityBodyState & { reload: () => void } {
  const [state, setState] = useState<CommunityBodyState>({ status: 'loading' });
  const [nonce, setNonce] = useState(0);
  const key = summary ? communityKey(summary) : null;

  useEffect(() => {
    if (!summary) {
      setState({ status: 'gone' });
      return;
    }
    let cancelled = false;
    setState({ status: 'loading' });
    service
      .getCommunityLesson(summary)
      .then((lesson) => {
        if (!cancelled) setState({ status: 'ready', lesson });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const failure = describeSharingError(err, 'load');
        setState(failure.code === 'not_found' ? { status: 'gone' } : { status: 'error', error: failure });
      });
    return () => {
      cancelled = true;
    };
    // `summary` cambia de identidad al recargar la lista; la clave basta para saber si es otra clase.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service, key, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { ...state, reload };
}
