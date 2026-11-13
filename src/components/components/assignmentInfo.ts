import type { ComponentAssignment } from '../../types/uiComponents';

export type AssignmentFilter = 'todos' | 'skill' | 'modelo' | 'sin-asignar';

export const ASSIGNMENT_FILTERS: Array<{ value: AssignmentFilter; label: string }> = [
  { value: 'todos', label: 'Todos' },
  { value: 'skill', label: 'Con skill' },
  { value: 'modelo', label: 'Con modelo' },
  { value: 'sin-asignar', label: 'No asignados' },
];

export function hasSkill(assignment?: ComponentAssignment): boolean {
  return Boolean(assignment && assignment.skillIds.length > 0);
}

export function hasModel(assignment?: ComponentAssignment): boolean {
  return Boolean(assignment && assignment.modelIds.length > 0);
}

/** Un componente está «No asignado» cuando no tiene ni skill ni modelo de IA. */
export function isUnassigned(assignment?: ComponentAssignment): boolean {
  return !hasSkill(assignment) && !hasModel(assignment);
}

export function matchesAssignmentFilter(filter: AssignmentFilter, assignment?: ComponentAssignment): boolean {
  if (filter === 'skill') return hasSkill(assignment);
  if (filter === 'modelo') return hasModel(assignment);
  if (filter === 'sin-asignar') return isUnassigned(assignment);
  return true;
}
