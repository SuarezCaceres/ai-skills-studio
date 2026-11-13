import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { ArrowLeft, Eye, PenLine, X } from 'lucide-react';
import { LESSON_LEVELS, type Lesson, type LessonDraft } from '../../types/lessons';
import { LIMITS, normalizeTags, validateDraft, type DraftErrors } from '../../services/lessonsStore';
import { SafeMarkdown } from '../catalog/SafeMarkdown';
import { ComponentPicker, SkillPicker } from './pickers';
import { VideoPartsField, addVideoFromLink } from './VideoPartsField';
import type { UseSkillOptionsResult } from './useLessons';

interface LessonEditorProps {
  /** Clase que se edita; sin ella, es una clase nueva. */
  lesson?: Lesson;
  skills: UseSkillOptionsResult;
  /** Debe devolver `false` si no se pudo guardar. */
  onSubmit: (draft: LessonDraft) => boolean;
  onCancel: () => void;
}

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]';
const INPUT =
  'w-full rounded-lg border border-slate-700 bg-[#0a0d14] px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#0ea5e9] aria-[invalid=true]:border-rose-500/70';

const STARTER = `## Qué hicimos

Cuenta con tus palabras qué se hizo y por qué.

## Cómo lo hicimos

1. Primer paso
2. Segundo paso

## Qué aprendimos

- Una idea clave
`;

function toDraft(lesson?: Lesson): LessonDraft {
  return {
    title: lesson?.title ?? '',
    summary: lesson?.summary ?? '',
    level: lesson?.level ?? 'Principiante',
    tags: lesson?.tags ?? [],
    bodyMarkdown: lesson?.bodyMarkdown ?? STARTER,
    skillIds: lesson?.skillIds ?? [],
    componentIds: lesson?.componentIds ?? [],
    videos: lesson?.videos ?? [],
  };
}

const sameDraft = (a: LessonDraft, b: LessonDraft) => JSON.stringify(a) === JSON.stringify(b);

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} className="m-0 mt-1 text-xs text-rose-300">
      {message}
    </p>
  ) : null;
}

/**
 * Formulario para subir o editar una clase: Markdown con vista previa en vivo (`SafeMarkdown`),
 * etiquetas, nivel y selectores de skills y componentes. Valida en el cliente, avisa si se sale con
 * cambios sin guardar y se maneja entero con teclado.
 */
export function LessonEditor({ lesson, skills, onSubmit, onCancel }: LessonEditorProps) {
  const initial = useMemo(() => toDraft(lesson), [lesson]);
  const [draft, setDraft] = useState<LessonDraft>(initial);
  const [tagInput, setTagInput] = useState('');
  const [videoInput, setVideoInput] = useState('');
  const [videoLinkError, setVideoLinkError] = useState<string | undefined>();
  const [attempted, setAttempted] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [mobileTab, setMobileTab] = useState<'escribir' | 'vista'>('escribir');
  const form = useRef<HTMLFormElement>(null);

  const dirty = !sameDraft(draft, initial) || tagInput.trim() !== '' || videoInput.trim() !== '';
  const errors: DraftErrors = attempted ? validateDraft(draft) : {};

  // Aviso del navegador al cerrar o recargar la pestaña con cambios sin guardar.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const set = <K extends keyof LessonDraft>(key: K, value: LessonDraft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const addTags = (raw: string) => {
    const next = normalizeTags([...draft.tags, ...raw.split(',')]);
    set('tags', next);
    setTagInput('');
  };

  const onTagKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      if (tagInput.trim()) addTags(tagInput);
    } else if (event.key === 'Backspace' && tagInput === '' && draft.tags.length > 0) {
      set('tags', draft.tags.slice(0, -1));
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setAttempted(true);
    setSaveError(false);
    let pending = tagInput.trim() ? { ...draft, tags: normalizeTags([...draft.tags, ...tagInput.split(',')]) } : draft;
    // Un enlace pegado y sin añadir cuenta como una parte más; si no es válido, no se guarda en silencio.
    if (videoInput.trim()) {
      const added = addVideoFromLink(videoInput, pending.videos);
      if ('error' in added) {
        setVideoLinkError(added.error);
        window.requestAnimationFrame(() => document.getElementById('lesson-video-input')?.focus());
        return;
      }
      pending = { ...pending, videos: added.videos };
    }
    const found = validateDraft(pending);
    const first = Object.keys(found)[0];
    if (first) {
      const target = { title: 'lesson-title-input', summary: 'lesson-summary-input', body: 'lesson-body-input', tags: 'lesson-tags-input', videos: 'lesson-video-input' }[first];
      if (first === 'body') setMobileTab('escribir');
      window.requestAnimationFrame(() => (target ? document.getElementById(target) : form.current?.querySelector<HTMLElement>('input[type="checkbox"]'))?.focus());
      return;
    }
    if (!onSubmit(pending)) setSaveError(true);
  };

  const leave = () => (dirty ? setConfirmLeave(true) : onCancel());
  const errorList = [...Object.values(errors), ...(attempted && videoLinkError ? [videoLinkError] : [])];

  return (
    <form ref={form} onSubmit={submit} noValidate aria-labelledby="editor-heading" className="mx-auto w-full max-w-[1280px] min-w-0 space-y-6 text-slate-300">
      <button type="button" onClick={leave} className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border-0 bg-transparent px-1 py-1 text-sm font-medium text-[#38bdf8] hover:underline ${FOCUS}`}>
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        {lesson ? 'Volver a la clase' : 'Clases'}
      </button>

      <header className="space-y-1">
        <h1 id="editor-heading" className="m-0 text-3xl font-bold tracking-tight text-white">
          {lesson ? 'Editar clase' : 'Subir una clase'}
        </h1>
        <p className="m-0 text-sm text-slate-400">Explica lo que se hizo en el equipo y vincula la skill y los componentes que usaste.</p>
      </header>

      {errorList.length > 0 && (
        <div role="alert" className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 text-xs text-rose-200">
          <p className="m-0 font-semibold">Revisa {errorList.length === 1 ? 'un campo' : `${errorList.length} campos`}:</p>
          <ul className="mb-0 mt-1 list-disc pl-4">
            {errorList.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      )}
      {saveError && (
        <p role="alert" className="m-0 rounded-xl border border-amber-500/40 bg-amber-950/30 p-3 text-xs text-amber-200">
          No se pudo guardar en este navegador (almacenamiento lleno o bloqueado). Exporta tus clases a JSON para no perderlas.
        </p>
      )}

      <div className="[display:grid] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-5 rounded-xl border border-slate-800 bg-[#121722] p-5">
          <div>
            <label htmlFor="lesson-title-input" className="mb-1.5 block text-sm font-semibold text-white">
              Título <span aria-hidden="true" className="text-[#38bdf8]">*</span>
              <span className="sr-only"> (obligatorio)</span>
            </label>
            <input
              id="lesson-title-input"
              value={draft.title}
              onChange={(e) => set('title', e.target.value)}
              maxLength={LIMITS.title.max}
              placeholder="¿Qué es un hook?"
              aria-invalid={errors.title ? true : undefined}
              aria-describedby={errors.title ? 'err-title' : undefined}
              className={`${INPUT} h-10`}
            />
            <FieldError id="err-title" message={errors.title} />
          </div>

          <div>
            <label htmlFor="lesson-summary-input" className="mb-1.5 block text-sm font-semibold text-white">
              Resumen <span aria-hidden="true" className="text-[#38bdf8]">*</span>
              <span className="sr-only"> (obligatorio)</span>
            </label>
            <textarea
              id="lesson-summary-input"
              rows={2}
              value={draft.summary}
              onChange={(e) => set('summary', e.target.value)}
              maxLength={LIMITS.summary.max}
              aria-invalid={errors.summary ? true : undefined}
              aria-describedby={errors.summary ? 'err-summary' : 'hint-summary'}
              className={`${INPUT} resize-y py-2`}
            />
            {errors.summary ? <FieldError id="err-summary" message={errors.summary} /> : (
              <p id="hint-summary" className="m-0 mt-1 text-right text-[11px] text-slate-500">
                {draft.summary.length} de {LIMITS.summary.max}
              </p>
            )}
          </div>

          <div className="[display:grid] gap-4 sm:grid-cols-[180px_minmax(0,1fr)]">
            <div>
              <label htmlFor="lesson-level-input" className="mb-1.5 block text-sm font-semibold text-white">
                Nivel
              </label>
              <select id="lesson-level-input" value={draft.level} onChange={(e) => set('level', e.target.value as LessonDraft['level'])} className={`${INPUT} h-10`}>
                {LESSON_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="lesson-tags-input" className="mb-1.5 block text-sm font-semibold text-white">
                Etiquetas <span className="font-normal text-slate-500">(Enter o coma)</span>
              </label>
              <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-slate-700 bg-[#0a0d14] px-2 py-1.5 focus-within:border-[#0ea5e9]">
                {draft.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-full border border-[#0ea5e9]/40 bg-[#0ea5e9]/10 py-0.5 pl-2.5 pr-1 font-mono text-xs text-[#38bdf8]">
                    #{tag}
                    <button
                      type="button"
                      onClick={() => set('tags', draft.tags.filter((t) => t !== tag))}
                      aria-label={`Quitar la etiqueta ${tag}`}
                      className={`flex h-4 w-4 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-current hover:bg-white/10 ${FOCUS}`}
                    >
                      <X aria-hidden="true" className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <input
                  id="lesson-tags-input"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={onTagKeyDown}
                  onBlur={() => tagInput.trim() && addTags(tagInput)}
                  disabled={draft.tags.length >= LIMITS.tags}
                  placeholder={draft.tags.length >= LIMITS.tags ? 'Máximo alcanzado' : 'hooks, worktrees…'}
                  className="min-w-24 flex-1 border-0 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                />
              </div>
              <FieldError id="err-tags" message={errors.tags} />
            </div>
          </div>

          <SkillPicker value={draft.skillIds} onChange={(v) => set('skillIds', v)} max={LIMITS.skills} error={errors.skillIds} skills={skills} />
          <ComponentPicker value={draft.componentIds} onChange={(v) => set('componentIds', v)} max={LIMITS.components} error={errors.componentIds} />
          <VideoPartsField
            videos={draft.videos}
            onChange={(v) => set('videos', v)}
            input={videoInput}
            onInputChange={setVideoInput}
            linkError={videoLinkError}
            onLinkError={setVideoLinkError}
            error={errors.videos}
          />
        </div>

        <div className="min-w-0 space-y-3">
          <div role="tablist" aria-label="Explicación" className="flex gap-1 rounded-full border border-slate-700 bg-[#0a0d14] p-0.5 lg:hidden">
            {([['escribir', 'Escribir', PenLine], ['vista', 'Vista previa', Eye]] as const).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                role="tab"
                id={`tab-${id}`}
                aria-selected={mobileTab === id}
                aria-controls={`panel-${id}`}
                onClick={() => setMobileTab(id)}
                className={`inline-flex h-8 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full border-0 text-xs font-semibold ${FOCUS} ${mobileTab === id ? 'bg-[#0ea5e9] text-[#0a0d14]' : 'bg-transparent text-slate-300'}`}
              >
                <Icon aria-hidden="true" className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          <section id="panel-escribir" role="tabpanel" aria-labelledby="tab-escribir" className={`${mobileTab === 'escribir' ? 'block' : 'hidden'} space-y-1.5 lg:block`}>
            <label htmlFor="lesson-body-input" className="block text-sm font-semibold text-white">
              Explicación en Markdown <span aria-hidden="true" className="text-[#38bdf8]">*</span>
              <span className="sr-only"> (obligatorio)</span>
            </label>
            <textarea
              id="lesson-body-input"
              value={draft.bodyMarkdown}
              onChange={(e) => set('bodyMarkdown', e.target.value)}
              rows={16}
              spellCheck
              aria-invalid={errors.body ? true : undefined}
              aria-describedby={errors.body ? 'err-body' : 'hint-body'}
              className={`${INPUT} resize-y py-3 font-mono leading-relaxed`}
            />
            {errors.body ? <FieldError id="err-body" message={errors.body} /> : (
              <p id="hint-body" className="m-0 text-right text-[11px] text-slate-500">
                {draft.bodyMarkdown.length.toLocaleString('es')} de {LIMITS.body.max.toLocaleString('es')}
              </p>
            )}
          </section>

          <section id="panel-vista" role="tabpanel" aria-labelledby="tab-vista" className={`${mobileTab === 'vista' ? 'block' : 'hidden'} lg:block`}>
            <h2 className="m-0 mb-1.5 hidden items-center gap-1.5 text-sm font-semibold text-white lg:flex">
              <Eye aria-hidden="true" className="h-4 w-4 text-[#38bdf8]" />
              Vista previa en vivo
            </h2>
            <div data-testid="lesson-preview" className="min-h-48 rounded-xl border border-slate-800 bg-[#0d1118] p-5">
              <SafeMarkdown source={draft.bodyMarkdown} />
            </div>
          </section>
        </div>
      </div>

      {confirmLeave && (
        <div role="alertdialog" aria-label="Cambios sin guardar" className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-950/30 p-3 text-sm text-amber-100">
          <span className="min-w-0 flex-1">Tienes cambios sin guardar. Si sales ahora, se perderán.</span>
          <button type="button" autoFocus onClick={() => setConfirmLeave(false)} className={`h-8 cursor-pointer rounded-full border border-slate-600 bg-transparent px-3 text-xs font-semibold text-slate-100 ${FOCUS}`}>
            Seguir editando
          </button>
          <button type="button" onClick={onCancel} className={`h-8 cursor-pointer rounded-full border-0 bg-amber-400 px-3 text-xs font-semibold text-[#0a0d14] hover:bg-amber-300 ${FOCUS}`}>
            Descartar cambios
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-800 pt-4">
        {dirty && <span className="mr-auto text-xs text-amber-300">Cambios sin guardar</span>}
        <button type="button" onClick={leave} className={`h-10 cursor-pointer rounded-full border border-slate-700 bg-transparent px-5 text-sm font-semibold text-slate-100 hover:border-[#0ea5e9] ${FOCUS}`}>
          Cancelar
        </button>
        <button type="submit" className={`h-10 cursor-pointer rounded-full border-0 bg-[#0ea5e9] px-5 text-sm font-semibold text-[#0a0d14] hover:bg-[#38bdf8] ${FOCUS}`}>
          {lesson ? 'Guardar cambios' : 'Subir clase'}
        </button>
      </div>
    </form>
  );
}
