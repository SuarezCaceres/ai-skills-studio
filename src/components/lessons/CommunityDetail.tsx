import { AlertCircle, ArrowLeft, ExternalLink, Eye, Loader2, RefreshCw } from 'lucide-react';
import type { LessonSharingApi } from '../../types/catalog';
import type { CommunityLesson, Lesson } from '../../types/lessons';
import { safeHttpUrl } from '../catalog/ResultsByModel';
import { LessonDetail } from './LessonDetail';
import { useCommunityLessonBody } from './useCommunityLessons';
import type { UseSkillOptionsResult } from './useLessons';

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]';
const BACK = `inline-flex cursor-pointer items-center gap-1.5 rounded-lg border-0 bg-transparent px-1 py-1 text-sm font-medium text-[#38bdf8] hover:underline ${FOCUS}`;
const BTN = `inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border px-4 text-xs font-semibold ${FOCUS}`;

interface CommunityDetailProps {
  /** Clase elegida en la lista; `undefined` si ya no está (la lista se recargó sin ella). */
  summary: CommunityLesson | undefined;
  service: LessonSharingApi;
  skills: UseSkillOptionsResult;
  onBack: () => void;
  onOpenSkill: (id: string) => void;
  onOpenComponent: (id: string) => void;
}

/** Enlaces de la clase en GitHub, construidos solo con campos ya validados (repo, commit y carpeta). */
function githubLinks(lesson: CommunityLesson) {
  return {
    folder: safeHttpUrl(`${lesson.repoUrl}/tree/${lesson.sha}/classes/${lesson.id}`),
    issue: safeHttpUrl(lesson.issueUrl),
  };
}

/** Detalle de una clase de Comunidad: solo lectura (sin Editar, Borrar ni Compartir). */
export function CommunityDetail({ summary, service, skills, onBack, onOpenSkill, onOpenComponent }: CommunityDetailProps) {
  const body = useCommunityLessonBody(service, summary);

  const back = (
    <button type="button" onClick={onBack} className={BACK}>
      <ArrowLeft aria-hidden="true" className="h-4 w-4" />
      Comunidad
    </button>
  );

  if (body.status === 'gone') {
    return (
      <div className="mx-auto w-full max-w-[1100px] space-y-4">
        {back}
        <div role="status" className="mx-auto max-w-xl space-y-3 rounded-xl border border-dashed border-slate-700 bg-[#121722] p-10 text-center">
          <p className="m-0 text-sm text-slate-300">Esta clase ya no está disponible.</p>
          <p className="m-0 text-xs text-slate-500">Quien la compartió pudo retirarla o borrar su repositorio.</p>
          <button type="button" onClick={onBack} className={`${BTN} border-0 bg-[#0ea5e9] text-[#0a0d14] hover:bg-[#38bdf8]`}>
            Volver a la comunidad
          </button>
        </div>
      </div>
    );
  }

  if (body.status === 'loading') {
    return (
      <div className="mx-auto w-full max-w-[1100px] space-y-5">
        {back}
        {summary && (
          <header className="space-y-2">
            <h1 id="lesson-title" tabIndex={-1} className="m-0 text-3xl font-bold tracking-tight text-white outline-none">
              {summary.title}
            </h1>
            <p className="m-0 max-w-3xl text-base leading-relaxed text-slate-400">{summary.summary}</p>
          </header>
        )}
        <p role="status" className="m-0 flex items-center gap-2 font-mono text-xs text-slate-400">
          <Loader2 aria-hidden="true" className="h-4 w-4 motion-safe:animate-spin" />
          Cargando la clase…
        </p>
        <div aria-hidden="true" className="h-64 rounded-xl border border-slate-800 bg-[#121722] motion-safe:animate-pulse" />
      </div>
    );
  }

  if (body.status === 'error') {
    return (
      <div className="mx-auto w-full max-w-[1100px] space-y-4">
        {back}
        <div role="alert" className="mx-auto max-w-xl space-y-3 rounded-xl border border-rose-500/40 bg-rose-950/30 p-6 text-center text-sm text-rose-100">
          <p className="m-0 flex items-center justify-center gap-2">
            <AlertCircle aria-hidden="true" className="h-4 w-4 shrink-0" />
            {body.error.message}
          </p>
          {body.error.retryable && (
            <button type="button" onClick={body.reload} className={`${BTN} border-slate-600 bg-transparent text-slate-100 hover:border-[#0ea5e9]`}>
              <RefreshCw aria-hidden="true" className="h-4 w-4" />
              Reintentar
            </button>
          )}
        </div>
      </div>
    );
  }

  const loaded = body.lesson;
  const links = githubLinks(loaded);
  const asLesson: Lesson = { ...loaded, bodyMarkdown: loaded.bodyMarkdown ?? '' };

  return (
    <LessonDetail
      lesson={asLesson}
      skills={skills}
      canManage={false}
      backLabel="Comunidad"
      byline="Compartida por"
      onBack={onBack}
      onEdit={() => undefined}
      onDelete={() => undefined}
      onOpenSkill={onOpenSkill}
      onOpenComponent={onOpenComponent}
      extra={
        <p data-testid="community-readonly" className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-slate-800 bg-[#121722] px-4 py-3 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-300">
            <Eye aria-hidden="true" className="h-4 w-4 text-[#38bdf8]" />
            Solo lectura
          </span>
          <span>Está en un repositorio público de GitHub, fijada al commit con el que se compartió.</span>
          {links.folder && (
            <a href={links.folder} target="_blank" rel="noopener noreferrer" className={`inline-flex min-h-6 items-center gap-1 rounded text-[#38bdf8] hover:underline ${FOCUS}`}>
              Ver en GitHub
              <ExternalLink aria-hidden="true" className="h-3 w-3" />
            </a>
          )}
          {links.issue && (
            <a href={links.issue} target="_blank" rel="noopener noreferrer" className={`inline-flex min-h-6 items-center gap-1 rounded text-slate-400 hover:text-[#38bdf8] hover:underline ${FOCUS}`}>
              Issue del catálogo
              <ExternalLink aria-hidden="true" className="h-3 w-3" />
            </a>
          )}
        </p>
      }
    />
  );
}
