import { Bot, Sparkles } from 'lucide-react';
import type { ComponentAssignment } from '../../types/uiComponents';
import { hasModel, hasSkill, isUnassigned } from './assignmentInfo';

interface AssignmentBadgeProps {
  assignment?: ComponentAssignment;
}

/**
 * Insignia de la lista: dice explícitamente «No asignado» cuando el componente no tiene
 * ni skill ni modelo de IA; si los tiene, resume cuántos.
 */
export function AssignmentBadge({ assignment }: AssignmentBadgeProps) {
  if (isUnassigned(assignment)) {
    return (
      <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900/60 px-2 py-0.5 text-[10px] font-medium text-slate-400">
        No asignado
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      {hasSkill(assignment) && (
        <span className="inline-flex items-center gap-1 rounded-full border border-[#0ea5e9]/40 bg-[#0ea5e9]/10 px-2 py-0.5 text-[10px] font-semibold text-[#38bdf8]">
          <Sparkles aria-hidden="true" className="h-3 w-3" />
          {assignment!.skillIds.length} {assignment!.skillIds.length === 1 ? 'skill' : 'skills'}
        </span>
      )}
      {hasModel(assignment) && (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-950/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
          <Bot aria-hidden="true" className="h-3 w-3" />
          {assignment!.modelIds.length} {assignment!.modelIds.length === 1 ? 'modelo' : 'modelos'}
        </span>
      )}
    </span>
  );
}
