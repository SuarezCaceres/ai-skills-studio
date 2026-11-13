import { useMemo, useState } from 'react';
import { AlertCircle, Github, Loader2, RefreshCw, Search, Users, X } from 'lucide-react';
import type { GithubSession } from '../../types/catalog';
import { COMPONENT_REGISTRY, getComponentEntry } from '../../data/componentRegistry';
import { LESSON_LEVELS } from '../../types/lessons';
import { LessonCard } from './LessonCard';
import { panelId, tabId } from './LessonsTabs';
import { communityKey, type UseCommunityLessonsResult } from './useCommunityLessons';
import type { UseSkillOptionsResult } from './useLessons';

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]';
const SELECT =
  'h-10 min-w-0 w-full cursor-pointer rounded-lg border border-slate-800 bg-[#0a0d14] px-3 text-sm text-slate-200 outline-none focus:border-[#0ea5e9]';
const PRIMARY = `inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border-0 bg-[#0ea5e9] px-5 text-xs font-semibold text-[#0a0d14] hover:bg-[#38bdf8] ${FOCUS}`;
const GHOST = `inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-slate-700 bg-transparent px-4 text-xs font-semibold text-slate-100 hover:border-[#0ea5e9] hover:text-[#38bdf8] disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`;

interface CommunityPanelProps {
  community: UseCommunityLessonsResult;
  session: GithubSession | null;
  skills: UseSkillOptionsResult;
  onOpen: (key: string) => void;
  onRequestLogin: () => void;
}

/** Pestaña «Comunidad»: clases que comparte cualquiera, de solo lectura. Sin sesión no se pide nada. */
export function CommunityPanel({ community, session, skills, onOpen, onRequestLogin }: CommunityPanelProps) {
  const { status, lessons, error, reload } = community;
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('');
  const [tag, setTag] = useState('');
  const [author, setAuthor] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [componentFilter, setComponentFilter] = useState('');

  const authors = useMemo(() => [...new Set(lessons.map((l) => l.author.login))].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' })), [lessons]);
  const allTags = useMemo(() => [...new Set(lessons.flatMap((l) => l.tags))].sort(), [lessons]);
  const usedSkills = useMemo(() => [...new Set(lessons.flatMap((l) => l.skillIds))], [lessons]);
  const usedComponents = useMemo(() => [...new Set(lessons.flatMap((l) => l.componentIds))].filter((id) => getComponentEntry(id)), [lessons]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return lessons.filter(
      (l) =>
        (!q || l.title.toLowerCase().includes(q) || l.summary.toLowerCase().includes(q) || l.author.login.toLowerCase().includes(q) || l.tags.some((t) => t.includes(q))) &&
        (!level || l.level === level) &&
        (!tag || l.tags.includes(tag)) &&
        (!author || l.author.login === author) &&
        (!skillFilter || l.skillIds.includes(skillFilter)) &&
        (!componentFilter || l.componentIds.includes(componentFilter))
    );
  }, [lessons, query, level, tag, author, skillFilter, componentFilter]);
  const filtering = Boolean(query.trim() || level || tag || author || skillFilter || componentFilter);
  const clearFilters = () => {
    setQuery('');
    setLevel('');
    setTag('');
    setAuthor('');
    setSkillFilter('');
    setComponentFilter('');
  };

  const wrap = (children: React.ReactNode) => (
    <div role="tabpanel" id={panelId('comunidad')} aria-labelledby={tabId('comunidad')} className="space-y-5">
      {children}
    </div>
  );

  /* ---------- Sin sesión: no se pide nada ---------- */
  if (!session) {
    return wrap(
      <div data-testid="community-signed-out" className="mx-auto max-w-xl space-y-3 rounded-xl border border-dashed border-slate-700 bg-[#121722] p-8 text-center sm:p-10">
        <span aria-hidden="true" className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-[#0ea5e9]/40 bg-[#0ea5e9]/10 text-[#38bdf8]">
          <Users className="h-5 w-5" />
        </span>
        <h2 className="m-0 text-base font-semibold text-white">Entra con GitHub para ver la Comunidad</h2>
        <p className="m-0 text-sm leading-relaxed text-slate-400">
          Aquí aparecen las clases que otras personas comparten. Son de solo lectura. Pedimos sesión para verlas, pero recuerda que viven en repositorios públicos de GitHub.
        </p>
        <button type="button" onClick={onRequestLogin} className={`${PRIMARY} mt-1`}>
          <Github aria-hidden="true" className="h-4 w-4" />
          Entrar con GitHub
        </button>
      </div>
    );
  }

  const toolbar = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="m-0 max-w-2xl text-xs leading-relaxed text-slate-400">
        Clases que comparten otras personas en repositorios públicos de GitHub. Aquí solo se leen: no se pueden editar ni borrar.
      </p>
      <button type="button" onClick={reload} disabled={status === 'loading'} className={GHOST}>
        <RefreshCw aria-hidden="true" className={`h-4 w-4 ${status === 'loading' ? 'motion-safe:animate-spin' : ''}`} />
        Actualizar lista
      </button>
    </div>
  );

  /* ---------- Cargando (la primera vez) ---------- */
  if (status === 'loading' && lessons.length === 0) {
    return wrap(
      <>
        {toolbar}
        <p role="status" className="m-0 flex items-center gap-2 font-mono text-xs text-slate-400">
          <Loader2 aria-hidden="true" className="h-4 w-4 motion-safe:animate-spin" />
          Cargando las clases de la comunidad…
        </p>
        <ul aria-hidden="true" className="m-0 [display:grid] list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <li key={i} className="h-56 rounded-xl border border-slate-800 bg-[#121722] motion-safe:animate-pulse" />
          ))}
        </ul>
      </>
    );
  }

  /* ---------- Error ---------- */
  if (status === 'error' && error) {
    return wrap(
      <>
        {toolbar}
        <div role="alert" className="mx-auto max-w-xl space-y-3 rounded-xl border border-rose-500/40 bg-rose-950/30 p-6 text-center text-sm text-rose-100">
          <p className="m-0 flex items-center justify-center gap-2">
            <AlertCircle aria-hidden="true" className="h-4 w-4 shrink-0" />
            {error.message}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {error.needsLogin && (
              <button type="button" onClick={onRequestLogin} className={PRIMARY}>
                <Github aria-hidden="true" className="h-4 w-4" />
                Entrar con GitHub
              </button>
            )}
            {error.retryable && (
              <button type="button" onClick={reload} className={GHOST}>
                <RefreshCw aria-hidden="true" className="h-4 w-4" />
                Reintentar
              </button>
            )}
          </div>
        </div>
      </>
    );
  }

  /* ---------- Vacío ---------- */
  if (lessons.length === 0) {
    return wrap(
      <>
        {toolbar}
        <div className="rounded-xl border border-dashed border-slate-700 bg-[#121722] p-10 text-center">
          <p className="m-0 text-sm text-slate-300">Todavía nadie compartió clases.</p>
          <p className="mx-0 mb-0 mt-1 text-xs text-slate-500">Comparte la tuya desde su detalle en «Mis clases».</p>
        </div>
      </>
    );
  }

  /* ---------- Lista ---------- */
  return wrap(
    <>
      {toolbar}
      <div className="space-y-3 rounded-xl border border-slate-800 bg-[#121722] p-3">
        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Buscar en la comunidad"
            placeholder="Buscar por título, resumen, etiqueta o autor…"
            className="h-10 w-full rounded-lg border border-slate-800 bg-[#0a0d14] pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#0ea5e9]"
          />
        </div>
        <div className="[display:grid] gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label htmlFor="c-level" className="sr-only">Nivel</label>
            <select id="c-level" value={level} onChange={(e) => setLevel(e.target.value)} className={SELECT}>
              <option value="">Todos los niveles</option>
              {LESSON_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="c-tag" className="sr-only">Etiqueta</label>
            <select id="c-tag" value={tag} onChange={(e) => setTag(e.target.value)} className={SELECT}>
              <option value="">Todas las etiquetas</option>
              {allTags.map((t) => <option key={t} value={t}>#{t}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="c-author" className="sr-only">Autor</label>
            <select id="c-author" value={author} onChange={(e) => setAuthor(e.target.value)} className={SELECT}>
              <option value="">Todas las personas</option>
              {authors.map((a) => <option key={a} value={a}>@{a}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="c-skill" className="sr-only">Skill</label>
            <select id="c-skill" value={skillFilter} onChange={(e) => setSkillFilter(e.target.value)} className={SELECT}>
              <option value="">Todas las skills</option>
              {usedSkills.map((id) => <option key={id} value={id}>{skills.find(id)?.name ?? (id.split('/').pop() || id)}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="c-component" className="sr-only">Componente</label>
            <select id="c-component" value={componentFilter} onChange={(e) => setComponentFilter(e.target.value)} className={SELECT}>
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

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 bg-[#121722] p-10 text-center">
          <p className="m-0 text-sm text-slate-300">Ninguna clase de la comunidad coincide con los filtros.</p>
          <button type="button" onClick={clearFilters} className={`mt-3 inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border border-slate-700 bg-transparent px-4 text-xs font-medium text-slate-200 hover:border-[#0ea5e9] ${FOCUS}`}>
            <X aria-hidden="true" className="h-3.5 w-3.5" />
            Quitar filtros
          </button>
        </div>
      ) : (
        <ul className="m-0 [display:grid] list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((lesson) => (
            <LessonCard
              key={communityKey(lesson)}
              lesson={lesson}
              skills={skills}
              community={{ own: lesson.author.login.toLowerCase() === session.login.toLowerCase() }}
              onOpen={() => onOpen(communityKey(lesson))}
            />
          ))}
        </ul>
      )}
    </>
  );
}
