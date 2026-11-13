import { ArrowUpRight, Boxes, Sparkles } from 'lucide-react';
import type { Lesson } from '../../types/lessons';
import { getComponentEntry } from '../../data/componentRegistry';
import { PersonAvatar } from '../catalog/PersonAvatar';
import { safeHttpUrl } from '../catalog/ResultsByModel';
import type { UseSkillOptionsResult } from './useLessons';

const LINK =
  'relative z-10 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]';

export const LEVEL_STYLE: Record<Lesson['level'], string> = {
  Principiante: 'border-emerald-500/35 bg-emerald-950/30 text-emerald-300',
  Intermedio: 'border-[#0ea5e9]/35 bg-[#0ea5e9]/10 text-[#38bdf8]',
  Avanzado: 'border-amber-500/35 bg-amber-950/30 text-amber-300',
};

export function shortDate(iso: string): string {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? '' : new Date(t).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
}

interface LessonCardProps {
  lesson: Lesson;
  skills: UseSkillOptionsResult;
  onOpen: () => void;
}

/**
 * Tarjeta de una clase (mismo lenguaje que `SkillCard`): el título es el único botón y cubre la
 * tarjeta; el enlace al perfil queda encima con `z-10`. Los chips de skills y componentes son texto.
 */
export function LessonCard({ lesson, skills, onOpen }: LessonCardProps) {
  const profile = safeHttpUrl(lesson.author.profileUrl);
  const when = shortDate(lesson.updatedAt);
  return (
    <li className="min-w-0">
      <article className="group relative flex h-full min-w-0 flex-col gap-4 rounded-xl border border-slate-800 bg-[#121722] p-5 transition-colors hover:border-[#0ea5e9]/70 hover:bg-[#141b29] focus-within:border-[#0ea5e9]/70">
        <div className="flex items-center gap-2.5">
          <PersonAvatar login={lesson.author.login} avatarUrl={lesson.author.avatarUrl} />
          <p className="m-0 min-w-0 flex-1 truncate text-xs text-slate-400">
            Subida por{' '}
            {profile ? (
              <a href={profile} target="_blank" rel="noopener noreferrer" className={`${LINK} font-semibold text-slate-200 hover:underline`}>
                @{lesson.author.login}
              </a>
            ) : (
              <span className="font-semibold text-slate-200">@{lesson.author.login}</span>
            )}
            {when && <span className="text-slate-500"> · {when}</span>}
          </p>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-600 transition-colors group-hover:text-[#38bdf8]" aria-hidden="true" />
        </div>

        <div className="min-w-0">
          <h3 className="m-0">
            <button
              type="button"
              onClick={onOpen}
              className="m-0 w-full cursor-pointer break-words border-0 bg-transparent p-0 text-left text-base font-semibold leading-snug text-white after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
            >
              {lesson.title}
            </button>
          </h3>
          <p className="mb-0 mt-2 line-clamp-3 text-sm leading-relaxed text-slate-400">{lesson.summary || 'Sin resumen.'}</p>
        </div>

        {(lesson.skillIds.length > 0 || lesson.componentIds.length > 0) && (
          <ul aria-label="Skills y componentes vinculados" className="m-0 flex list-none flex-wrap gap-1.5 p-0">
            {lesson.skillIds.map((id) => (
              <li key={`s-${id}`} className="inline-flex max-w-full items-center gap-1 rounded-full border border-slate-700 bg-[#0a0d14] px-2 py-0.5 font-mono text-[11px] text-slate-300">
                <Sparkles aria-hidden="true" className="h-3 w-3 shrink-0 text-[#38bdf8]" />
                <span className="truncate">{skills.find(id)?.name ?? (id.split('/').pop() || id)}</span>
              </li>
            ))}
            {lesson.componentIds.map((id) => (
              <li key={`c-${id}`} className="inline-flex max-w-full items-center gap-1 rounded-full border border-slate-700 bg-[#0a0d14] px-2 py-0.5 text-[11px] text-slate-300">
                <Boxes aria-hidden="true" className="h-3 w-3 shrink-0 text-emerald-300" />
                <span className="truncate">{getComponentEntry(id)?.name ?? id}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-slate-800/80 pt-3 text-[11px]">
          <span className={`rounded-full border px-2.5 py-0.5 font-medium ${LEVEL_STYLE[lesson.level]}`}>{lesson.level}</span>
          {lesson.tags.map((tag) => (
            <span key={tag} className="font-mono text-slate-500">
              #{tag}
            </span>
          ))}
        </div>
      </article>
    </li>
  );
}
