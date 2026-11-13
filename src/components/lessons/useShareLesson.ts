import { useCallback, useEffect, useRef, useState } from 'react';
import type { LessonSharingApi } from '../../types/catalog';
import type { Lesson } from '../../types/lessons';
import { describeSharingError, type SharingFailure } from './sharingErrors';

export type ShareOp = 'share' | 'update' | 'unshare';

export interface ShareFailure extends SharingFailure {
  op: ShareOp;
}

export interface UseShareLessonResult {
  /** Operación en curso (solo una a la vez). */
  busy: ShareOp | null;
  error: ShareFailure | null;
  clearError: () => void;
  /** Ejecuta la operación y guarda el resultado en la clase local. Devuelve `true` si todo salió bien. */
  run: (op: ShareOp, lesson: Lesson) => Promise<boolean>;
}

/**
 * Compartir, actualizar y retirar una clase. Tras compartir o actualizar guarda el `LessonShare`
 * devuelto en la clase local (`shared`); tras retirar, se lo quita. No toca nada más de la clase.
 */
export function useShareLesson(service: LessonSharingApi, save: (lesson: Lesson) => boolean): UseShareLessonResult {
  const [busy, setBusy] = useState<ShareOp | null>(null);
  const [error, setError] = useState<ShareFailure | null>(null);
  const running = useRef(false);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const run = useCallback(
    async (op: ShareOp, lesson: Lesson): Promise<boolean> => {
      if (running.current) return false;
      running.current = true;
      setError(null);
      setBusy(op);
      try {
        let next: Lesson;
        if (op === 'unshare') {
          if (!lesson.shared) throw Object.assign(new Error('sin estado'), { name: 'LocalState' });
          await service.unshareLesson(lesson.shared);
          const { shared: _removed, ...rest } = lesson;
          next = rest;
        } else if (op === 'update') {
          next = { ...lesson, shared: await service.updateSharedLesson(lesson) };
        } else {
          next = { ...lesson, shared: await service.shareLesson(lesson) };
        }
        if (!save(next)) {
          if (alive.current) {
            setError({
              op,
              code: 'local-save',
              message:
                op === 'unshare'
                  ? 'Se retiró de GitHub, pero este navegador no dejó guardar el cambio. Recarga la página y comprueba el estado de la clase.'
                  : 'Se compartió en GitHub, pero este navegador no dejó guardar el estado. Exporta tus clases a JSON para no perderlas.',
              retryable: false,
              needsLogin: false,
            });
          }
          return false;
        }
        return true;
      } catch (err) {
        if (alive.current) setError({ op, ...describeSharingError(err, op) });
        return false;
      } finally {
        running.current = false;
        if (alive.current) setBusy(null);
      }
    },
    [service, save]
  );

  const clearError = useCallback(() => setError(null), []);
  return { busy, error, clearError, run };
}
