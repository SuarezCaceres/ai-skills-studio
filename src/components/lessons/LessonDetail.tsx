import { useState, type ReactNode } from 'react';
import { ArrowLeft, Boxes, Pencil, Sparkles, Trash2 } from 'lucide-react';
import type { Lesson } from '../../types/lessons';
import { getComponentEntry } from '../../data/componentRegistry';
import { PersonAvatar } from '../catalog/PersonAvatar';
import { SafeMarkdown } from '../catalog/SafeMarkdown';
import { safeHttpUrl } from '../catalog/ResultsByModel';
import { ComponentThumb } from '../components/ComponentThumb';
import { LessonVideos } from './LessonVideos';
import { LEVEL_STYLE, shortDate } from './LessonCard';
import type { UseSkillOptionsResult } from './useLessons';

interface LessonDetailProps {
  lesson: Lesson;
  skills: UseSkillOptionsResult;
  canManage: boolean;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onOpenSkill: (id: string) => void;
  onOpenComponent: (id: string) => void;
  /** Texto del botón de vuelta (por defecto «Clases»). */
  backLabel?: string;
  /** Cómo se presenta quien la subió (por defecto «Subida por»). */
  byline?: string;
  /** Contenido extra bajo la cabecera: el panel de compartir o el aviso de solo lectura. */
  extra?: ReactNode;
}

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]';
const CARD =
  'flex w-full min-w-0 cursor-pointer items-center gap-3 rounded-xl border border-slate-800 bg-[#121722] p-3 text-left transition-colors hover:border-[#0ea5e9]/70 hover:bg-[#141b29]';

/** Detalle de una clase: Markdown seguro y tarjetas que llevan a cada skill y componente vinculados. */
export function LessonDetail({ lesson, skills, canManage, onBack, onEdit, onDelete, onOpenSkill, onOpenComponent, backLabel = 'Clases', byline = 'Subida por', extra }: LessonDetailProps) {
  const [confirming, setConfirming] = useState(false);
  const profile = safeHttpUrl(lesson.author.profileUrl);

  return (
    <article aria-labelledby="lesson-title" className="mx-auto w-full max-w-[1100px] min-w-0 space-y-6 text-slate-300">
      <button
        type="button"
        onClick={onBack}
        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border-0 bg-transparent px-1 py-1 text-sm font-medium text-[#38bdf8] hover:underline ${FOCUS}`}
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        {backLabel}
      </button>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className={`rounded-full border px-2.5 py-0.5 font-medium ${LEVEL_STYLE[lesson.level]}`}>{lesson.level}</span>
          {lesson.tags.map((tag) => (
            <span key={tag} className="font-mono text-slate-500">
              #{tag}
            </span>
          ))}
        </div>
        <h1 id="lesson-title" tabIndex={-1} className="m-0 text-3xl font-bold tracking-tight text-white outline-none">
          {lesson.title}
        </h1>
        <p className="m-0 max-w-3xl text-base leading-relaxed text-slate-400">{lesson.summary}</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="m-0 flex items-center gap-2 text-xs text-slate-400">
            <PersonAvatar login={lesson.author.login} avatarUrl={lesson.author.avatarUrl} size={24} />
            <span>
              {byline}{' '}
              {profile ? (
                <a href={profile} target="_blank" rel="noopener noreferrer" className={`font-semibold text-slate-200 hover:underline ${FOCUS}`}>
                  @{lesson.author.login}
                </a>
              ) : (
                <strong className="text-slate-200">@{lesson.author.login}</strong>
              )}
              {' · '}
              {shortDate(lesson.createdAt)}
              {lesson.updatedAt !== lesson.createdAt && ` · editada el ${shortDate(lesson.updatedAt)}`}
            </span>
          </p>
          {canManage && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onEdit}
                className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-slate-700 bg-transparent px-4 text-xs font-semibold text-slate-100 hover:border-[#0ea5e9] hover:text-[#38bdf8] ${FOCUS}`}
              >
                <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
                Editar
              </button>
              {!confirming && (
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-rose-500/50 bg-transparent px-4 text-xs font-semibold text-rose-200 hover:bg-rose-950/40 ${FOCUS}`}
                >
                  <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                  Borrar
                </button>
              )}
            </div>
          )}
        </div>
        {confirming && (
          <div role="alertdialog" aria-label="Confirmar el borrado" className="flex flex-wrap items-center gap-3 rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 text-sm text-rose-100">
            <span className="min-w-0 flex-1">¿Borrar «{lesson.title}»? No se puede deshacer.</span>
            <button type="button" autoFocus onClick={() => setConfirming(false)} className={`h-8 cursor-pointer rounded-full border border-slate-600 bg-transparent px-3 text-xs font-semibold text-slate-100 ${FOCUS}`}>
              Cancelar
            </button>
            <button type="button" onClick={onDelete} className={`h-8 cursor-pointer rounded-full border-0 bg-rose-500 px-3 text-xs font-semibold text-white hover:bg-rose-400 ${FOCUS}`}>
              Sí, borrar
            </button>
          </div>
        )}
      </header>

      {extra}

      <LessonVideos key={lesson.id} lessonTitle={lesson.title} videos={lesson.videos} />

      <div className="[display:grid] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section aria-label="Explicación" className="min-w-0 rounded-xl border border-slate-800 bg-[#121722] p-5 sm:p-6">
          <SafeMarkdown source={lesson.bodyMarkdown} />
        </section>

        <aside aria-label="Vinculado a esta clase" className="min-w-0 space-y-5">
          <section aria-labelledby="lesson-skills" className="space-y-2">
            <h2 id="lesson-skills" className="m-0 flex items-center gap-2 text-sm font-semibold text-white">
              <Sparkles aria-hidden="true" className="h-4 w-4 text-[#38bdf8]" />
              Skills usadas
            </h2>
            {lesson.skillIds.length === 0 ? (
              <p className="m-0 text-xs text-slate-500">Esta clase no vincula ninguna skill.</p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {lesson.skillIds.map((id) => {
                  const skill = skills.find(id);
                  const name = skill?.name ?? (id.split('/').pop() || id);
                  return (
                    <li key={id}>
                      <button type="button" onClick={() => onOpenSkill(id)} className={`${CARD} ${FOCUS}`}>
                        <PersonAvatar login={skill?.authorLogin ?? (id.split('/')[0] || '?')} avatarUrl={skill?.avatarUrl} size={28} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-mono text-sm font-semibold text-white">{name}</span>
                          <span className="block truncate text-[11px] text-slate-500">Abrir la skill</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section aria-labelledby="lesson-components" className="space-y-2">
            <h2 id="lesson-components" className="m-0 flex items-center gap-2 text-sm font-semibold text-white">
              <Boxes aria-hidden="true" className="h-4 w-4 text-emerald-300" />
              Componentes usados
            </h2>
            {lesson.componentIds.length === 0 ? (
              <p className="m-0 text-xs text-slate-500">Esta clase no vincula ningún componente.</p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {lesson.componentIds.map((id) => {
                  const entry = getComponentEntry(id);
                  if (!entry) {
                    return (
                      <li key={id} className="rounded-xl border border-dashed border-slate-700 p-3 text-xs text-slate-500">
                        Componente «{id}» ya no está en el kit.
                      </li>
                    );
                  }
                  return (
                    <li key={id}>
                      <button type="button" onClick={() => onOpenComponent(id)} className={`${CARD} ${FOCUS}`}>
                        <ComponentThumb entry={entry} width={64} decorative />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-white">{entry.name}</span>
                          <span className="block truncate text-[11px] text-slate-500">{entry.category} · Ver en Componentes</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </article>
  );
}
