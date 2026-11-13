import { useCallback, useEffect, useRef, useState } from 'react';
import type { ComponentAssignment } from '../../types/uiComponents';
import {
  COMPONENT_ASSIGNMENTS_KEY,
  loadAssignments,
  removeFromAssignment,
  saveAssignments,
  upsertAssignment,
  type AssignmentInput,
} from '../../services/componentAssignments';

export interface UseAssignmentsResult {
  assignments: Record<string, ComponentAssignment>;
  /** `true` si el último guardado en `localStorage` falló (los cambios siguen solo en memoria). */
  saveFailed: boolean;
  assign: (componentId: string, input: AssignmentInput) => void;
  unassign: (componentId: string, kind: 'skill' | 'model', id: string) => void;
}

/** Asignaciones de componentes persistidas en `localStorage` y sincronizadas entre pestañas. */
export function useAssignments(): UseAssignmentsResult {
  const [assignments, setAssignments] = useState(() => loadAssignments());
  const [saveFailed, setSaveFailed] = useState(false);
  const current = useRef(assignments);

  const commit = useCallback((next: Record<string, ComponentAssignment>) => {
    current.current = next;
    setAssignments(next);
    setSaveFailed(!saveAssignments(next));
  }, []);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== COMPONENT_ASSIGNMENTS_KEY) return;
      const fresh = loadAssignments();
      current.current = fresh;
      setAssignments(fresh);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const assign = useCallback(
    (componentId: string, input: AssignmentInput) => commit(upsertAssignment(current.current, componentId, input)),
    [commit]
  );

  const unassign = useCallback(
    (componentId: string, kind: 'skill' | 'model', id: string) =>
      commit(removeFromAssignment(current.current, componentId, kind, id)),
    [commit]
  );

  return { assignments, saveFailed, assign, unassign };
}
