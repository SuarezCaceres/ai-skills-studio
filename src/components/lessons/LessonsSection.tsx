import { useMemo, useRef, useState } from 'react';
import { AlertCircle, BookOpen, Download, Github, Plus, Search, Upload, X } from 'lucide-react';
import { useCatalog } from '../../hooks/useCatalog';
import { COMPONENT_REGISTRY, getComponentEntry } from '../../data/componentRegistry';
import { LESSON_LEVELS, type Lesson, type LessonDraft } from '../../types/lessons';
import { canManageLesson, createLesson, updateLesson } from '../../services/lessonsStore';
import { LessonCard } from './LessonCard';
import { LessonDetail } from './LessonDetail';
import { LessonEditor } from './LessonEditor';
import { useLessons, useSkillOptions } from './useLessons';

interface LessonsSectionProps {
  /** Clase abierta (la guarda `App` para recuperarla al volver desde una skill o un componente). */
  openLessonId: string | null;
  onOpenLesson: (id: string | null) => void;
  onOpenSkill: (id: string) => void;
  onOpenComponent: (id: string) => void;
  onRequestLogin: () => void;
}

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]';
const SELECT =
  'h-9 min-w-0 cursor-pointer rounded-lg border border-slate-800 bg-[#0a0d14] px-3 text-sm text-slate-200 outline-none focus:border-[#0ea5e9]';

type Editing = null | 'new' | string;

/**
 * Pestaña «Clases» de Códice: lista con filtros, detalle y formulario de alta y edición.
 * Ver es libre; subir, editar y borrar requieren sesión de GitHub y solo sobre las propias.
 */
export function LessonsSection({ openLessonId, onOpenLesson, onOpenSkill, onOpenComponent, onRequestLogin }: LessonsSectionProps) {
  const { session } = useCatalog();
  const { lessons, storageFailed, save, remove, exportJson, importJson } = useLessons();
  const skills = useSkillOptions();
  const [editing, setEditing] = useState<Editing>(null);
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState('');
  const [level, setLevel] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [componentFilter, setComponentFilter] = useState('');
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const opened = openLessonId ? lessons.find((l) => l.id === openLessonId) : undefined;

  const allTags = useMemo(() => [...new Set(lessons.flatMap((l) => l.tags))].sort(), [lessons]);
  const usedSkills = useMemo(() => [...new Set(lessons.flatMap((l) => l.skillIds))], [lessons]);
  const usedComponents = useMemo(() => [...new Set(lessons.flatMap((l) => l.componentIds))].filter((id) => getComponentEntry(id)), [lessons]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return lessons.filter(
      (l) =>
        (!q || l.title.toLowerCase().includes(q) || l.summary.toLowerCase().includes(q) || l.author.login.toLowerCase().includes(q) || l.tags.some((t) => t.includes(q))) &&
        (!tag || l.tags.includes(tag)) &&
        (!level || l.level === level) &&
        (!skillFilter || l.skillIds.includes(skillFilter)) &&
        (!componentFilter || l.componentIds.includes(componentFilter))
    );
  }, [lessons, query, tag, level, skillFilter, componentFilter]);
  const filtering = Boolean(query.trim() || tag || level || skillFilter || componentFilter);

  const startNew = () => {
    if (!session) return onRequestLogin();
    setNotice(null);
    setEditing('new');
  };

  const submit = (draft: LessonDraft): boolean => {
    if (!session) return false;
    const existing = editing && editing !== 'new' ? lessons.find((l) => l.id === editing) : undefined;
    if (existing && !canManageLesson(existing, session.login)) return false;
    const lesson: Lesson = existing
      ? updateLesson(existing, draft)
      : createLesson(draft, { login: session.login, avatarUrl: session.avatarUrl }, lessons.map((l) => l.id));
    if (!save(lesson)) return false;
    setEditing(null);
    onOpenLesson(lesson.id);
    setNotice({ kind: 'ok', text: existing ? 'Cambios guardados.' : 'Clase subida.' });
    return true;
  };

  const doExport = () => {
    const blob = new Blob([exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clases-codice-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice({ kind: 'ok', text: `Se exportaron ${lessons.length} ${lessons.length === 1 ? 'clase' : 'clases'}.` });
  };

  const doImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      if (file.size > 2_000_000) throw new Error('El archivo es demasiado grande (máximo 2 MB).');
      const result = importJson(await file.text());
      setNotice({
        kind: result.saved ? 'ok' : 'error',
        text: result.saved
          ? `Importación terminada: ${result.added} nuevas, ${result.updated} actualizadas, ${result.skipped} omitidas.`
          : 'Se leyó el archivo, pero el navegador no dejó guardarlo.',
      });
    } catch (err) {
      setNotice({ kind: 'error', text: err instanceof Error ? err.message : 'No se pudo importar el archivo.' });
    } finally {
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  /* ---------- Formulario ---------- */
  if (editing) {
    const existing = editing === 'new' ? undefined : lessons.find((l) => l.id === editing);
    if (editing === 'new' || existing) {
      return (
        <LessonEditor
          key={editing}
          lesson={existing}
          skills={skills}
          onSubmit={submit}
          onCancel={() => setEditing(null)}
        />
      );
    }
  }

  /* ---------- Detalle ---------- */
  if (openLessonId) {
    if (!opened) {
      return (
        <div className="mx-auto max-w-xl space-y-3 rounded-xl border border-dashed border-slate-700 bg-[#121722] p-10 text-center">
          <p className="m-0 text-sm text-slate-300">Esa clase ya no existe en este navegador.</p>
          <button type="button" onClick={() => onOpenLesson(null)} className={`h-9 cursor-pointer rounded-full border-0 bg-[#0ea5e9] px-4 text-xs font-semibold text-[#0a0d14] hover:bg-[#38bdf8] ${FOCUS}`}>
            Ver todas las clases
          </button>
        </div>
      );
    }
    return (
      <>
        {notice && <Notice notice={notice} onClose={() => setNotice(null)} />}
        <LessonDetail
          lesson={opened}
          skills={skills}
          canManage={canManageLesson(opened, session?.login)}
          onBack={() => {
            setNotice(null);
            onOpenLesson(null);
          }}
          onEdit={() => setEditing(opened.id)}
          onDelete={() => {
            if (remove(opened.id)) {
              onOpenLesson(null);
              setNotice({ kind: 'ok', text: 'Clase borrada.' });
            } else setNotice({ kind: 'error', text: 'No se pudo borrar: el navegador no dejó guardar el cambio.' });
          }}
          onOpenSkill={onOpenSkill}
          onOpenComponent={onOpenComponent}
        />
      </>
    );
  }

  /* ---------- Lista ---------- */
  return (
    <section aria-labelledby="lessons-heading" className="mx-auto w-full max-w-[1280px] min-w-0 space-y-6 text-slate-300">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-2xl space-y-2">
          <p className="m-0 flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#38bdf8]">
            <BookOpen aria-hidden="true" className="h-3.5 w-3.5" />
            Aprender en equipo
          </p>
          <h1 id="lessons-heading" className="m-0 text-3xl font-bold tracking-tight text-white">
            Clases
          </h1>
          <p className="m-0 text-sm leading-relaxed text-slate-400">
            Explicaciones de lo que se ha hecho en el equipo: «¿Qué es un hook?», «Cómo trabajar con worktrees», «Cómo trabajé con esta skill».
            Cada clase puede enlazar la skill y los componentes que se usaron.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {session ? (
            <span className="inline-flex h-9 items-center gap-2 rounded-full border border-slate-700 bg-[#121722] px-3 text-xs text-slate-300">
              <Github aria-hidden="true" className="h-3.5 w-3.5 text-[#38bdf8]" />@{session.login}
            </span>
          ) : null}
          <button type="button" onClick={doExport} disabled={lessons.length === 0} className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-slate-700 bg-transparent px-4 text-xs font-semibold text-slate-100 hover:border-[#0ea5e9] hover:text-[#38bdf8] disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`}>
            <Download aria-hidden="true" className="h-4 w-4" />
            Exportar JSON
          </button>
          <button type="button" onClick={() => fileInput.current?.click()} className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-slate-700 bg-transparent px-4 text-xs font-semibold text-slate-100 hover:border-[#0ea5e9] hover:text-[#38bdf8] ${FOCUS}`}>
            <Upload aria-hidden="true" className="h-4 w-4" />
            Importar JSON
          </button>
          <input ref={fileInput} type="file" accept="application/json,.json" aria-label="Archivo JSON de clases" className="sr-only" tabIndex={-1} onChange={(e) => void doImport(e.target.files?.[0])} />
          <button type="button" onClick={startNew} className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border-0 bg-[#0ea5e9] px-4 text-xs font-semibold text-[#0a0d14] hover:bg-[#38bdf8] ${FOCUS}`}>
            {session ? <Plus aria-hidden="true" className="h-4 w-4" /> : <Github aria-hidden="true" className="h-4 w-4" />}
            {session ? 'Subir clase' : 'Entrar con GitHub para subir'}
          </button>
        </div>
      </header>

      {notice && <Notice notice={notice} onClose={() => setNotice(null)} />}
      {storageFailed && (
        <p role="alert" className="m-0 flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-950/30 p-3 text-xs text-amber-200">
          <AlertCircle aria-hidden="true" className="h-4 w-4 shrink-0" />
          Este navegador no deja leer o guardar las clases (modo privado o almacenamiento bloqueado). Lo que subas no sobrevivirá a una recarga.
        </p>
      )}

      <div className="space-y-3 rounded-xl border border-slate-800 bg-[#121722] p-3">
        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Buscar en las clases"
            placeholder="Buscar por título, resumen, etiqueta o autor…"
            className="h-10 w-full rounded-lg border border-slate-800 bg-[#0a0d14] pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#0ea5e9]"
          />
        </div>
        <div className="[display:grid] gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="f-level" className="sr-only">Nivel</label>
            <select id="f-level" value={level} onChange={(e) => setLevel(e.target.value)} className={`${SELECT} w-full`}>
              <option value="">Todos los niveles</option>
              {LESSON_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="f-tag" className="sr-only">Etiqueta</label>
            <select id="f-tag" value={tag} onChange={(e) => setTag(e.target.value)} className={`${SELECT} w-full`}>
              <option value="">Todas las etiquetas</option>
              {allTags.map((t) => <option key={t} value={t}>#{t}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="f-skill" className="sr-only">Skill</label>
            <select id="f-skill" value={skillFilter} onChange={(e) => setSkillFilter(e.target.value)} className={`${SELECT} w-full`}>
              <option value="">Todas las skills</option>
              {usedSkills.map((id) => <option key={id} value={id}>{skills.find(id)?.name ?? (id.split('/').pop() || id)}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="f-component" className="sr-only">Componente</label>
            <select id="f-component" value={componentFilter} onChange={(e) => setComponentFilter(e.target.value)} className={`${SELECT} w-full`}>
              <option value="">Todos los componentes</option>
              {usedComponents.map((id) => <option key={id} value={id}>{COMPONENT_REGISTRY.find((c) => c.id === id)?.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <p role="status" className="m-0 font-mono text-xs text-slate-500">
        {visible.length} {visible.length === 1 ? 'clase' : 'clases'}
        {filtering && ` de ${lessons.length}`}
      </p>

      {lessons.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 bg-[#121722] p-10 text-center">
          <p className="m-0 text-sm text-slate-300">Todavía no hay clases en este navegador.</p>
          <p className="mx-0 mb-4 mt-1 text-xs text-slate-500">Sube la primera o importa un JSON exportado por otra persona.</p>
          <button type="button" onClick={startNew} className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border-0 bg-[#0ea5e9] px-4 text-xs font-semibold text-[#0a0d14] hover:bg-[#38bdf8] ${FOCUS}`}>
            <Plus aria-hidden="true" className="h-4 w-4" />
            {session ? 'Subir la primera clase' : 'Entrar con GitHub para subir'}
          </button>
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 bg-[#121722] p-10 text-center">
          <p className="m-0 text-sm text-slate-300">Ninguna clase coincide con los filtros.</p>
          <button
            type="button"
            onClick={() => { setQuery(''); setTag(''); setLevel(''); setSkillFilter(''); setComponentFilter(''); }}
            className={`mt-3 inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-slate-700 bg-transparent px-3 text-xs font-medium text-slate-200 hover:border-[#0ea5e9] ${FOCUS}`}
          >
            <X aria-hidden="true" className="h-3.5 w-3.5" />
            Quitar filtros
          </button>
        </div>
      ) : (
        <ul className="m-0 [display:grid] list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} skills={skills} onOpen={() => onOpenLesson(lesson.id)} />
          ))}
        </ul>
      )}
    </section>
  );
}

function Notice({ notice, onClose }: { notice: { kind: 'ok' | 'error'; text: string }; onClose: () => void }) {
  const ok = notice.kind === 'ok';
  return (
    <div
      role={ok ? 'status' : 'alert'}
      className={`mx-auto mb-4 flex w-full max-w-[1280px] items-center gap-3 rounded-xl border p-3 text-sm ${ok ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-100' : 'border-rose-500/40 bg-rose-950/30 text-rose-200'}`}
    >
      <span className="min-w-0 flex-1">{notice.text}</span>
      <button type="button" onClick={onClose} aria-label="Cerrar el aviso" className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-current hover:bg-white/10 ${FOCUS}`}>
        <X aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  );
}
