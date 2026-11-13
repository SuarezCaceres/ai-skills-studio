import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Github, Loader2, Plus, RefreshCw, Search, X } from 'lucide-react';
import { useCatalog } from '../../hooks/useCatalog';
import type { CatalogSkill } from '../../types/catalog';
import { PublishSkillDialog } from './PublishSkillDialog';
import { SkillCard, SkillCardSkeleton } from './SkillCard';

interface CatalogPageProps {
  /** Abre la página de detalle de la skill del catálogo. */
  onOpenSkill: (id: string) => void;
  /** Abre la pantalla de acceso (inicio de sesión con GitHub). */
  onRequestLogin: () => void;
  /** Trae una copia de trabajo de la skill al estudio. */
  onOpenInStudio?: (id: string) => void;
}

type ListState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; skills: CatalogSkill[] };

type SortKey = 'recientes' | 'nombre';

const FOCUS =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]';

/**
 * Página del catálogo comunitario: lista las skills registradas en el repo
 * catálogo de GitHub, con buscador, categorías y orden, y permite publicar.
 */
export function CatalogPage({ onOpenSkill, onRequestLogin, onOpenInStudio }: CatalogPageProps) {
  const { api, session } = useCatalog();
  const [state, setState] = useState<ListState>({ status: 'loading' });
  const [reload, setReload] = useState(0);
  const [publishOpen, setPublishOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('todas');
  const [sort, setSort] = useState<SortKey>('recientes');

  const load = useCallback(() => setReload((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    api
      .listSkills()
      .then((skills) => {
        if (!cancelled) setState({ status: 'ready', skills });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            status: 'error',
            message: err instanceof Error && err.message ? err.message : 'No se pudo cargar el catálogo.',
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [api, reload]);

  const skills = state.status === 'ready' ? state.skills : [];

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of skills) counts.set(s.category, (counts.get(s.category) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [skills]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = skills.filter((s) => {
      if (category !== 'todas' && s.category !== category) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.author.login.toLowerCase().includes(q) ||
        s.repo.toLowerCase().includes(q)
      );
    });
    return [...list].sort((a, b) =>
      sort === 'nombre'
        ? a.name.localeCompare(b.name)
        : Date.parse(b.registeredAt) - Date.parse(a.registeredAt)
    );
  }, [skills, query, category, sort]);

  const filtering = query.trim() !== '' || category !== 'todas';

  return (
    <section
      aria-labelledby="catalog-page-heading"
      className="mx-auto w-full max-w-[1280px] min-w-0 space-y-6 px-4 py-8 text-slate-300 sm:px-6"
    >
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-2xl space-y-2">
          <p className="m-0 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#38bdf8]">
            Catálogo comunitario
          </p>
          <h1 id="catalog-page-heading" className="m-0 text-3xl font-bold tracking-tight text-white">
            Skills de la comunidad
          </h1>
          <p className="m-0 text-sm leading-relaxed text-slate-400">
            Skills registradas desde repos públicos de GitHub. Cada una pasa por un auditor automático y se instala
            con un comando fijado al commit revisado. Vota y cuenta con qué modelo te funcionó.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {session ? (
            <span className="inline-flex h-9 items-center gap-2 rounded-full border border-slate-700 bg-[#121722] px-3 text-xs text-slate-300">
              <Github className="h-3.5 w-3.5 text-[#38bdf8]" aria-hidden="true" />@{session.login}
            </span>
          ) : (
            <button
              type="button"
              onClick={onRequestLogin}
              className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-slate-700 bg-transparent px-4 text-xs font-semibold text-slate-100 transition hover:border-[#0ea5e9] hover:text-[#38bdf8] ${FOCUS}`}
            >
              <Github className="h-4 w-4" aria-hidden="true" />
              Entrar con GitHub
            </button>
          )}
          <button
            type="button"
            onClick={() => setPublishOpen(true)}
            className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border-0 bg-[#0ea5e9] px-4 text-xs font-semibold text-[#0a0d14] transition hover:bg-[#38bdf8] ${FOCUS}`}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Publicar una skill
          </button>
        </div>
      </header>

      <div className="space-y-3 rounded-xl border border-slate-800 bg-[#121722] p-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              aria-hidden="true"
            />
            <input
              id="catalog-search-input"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, descripción, autor o repo…"
              aria-label="Buscar en el catálogo"
              className="h-10 w-full rounded-lg border border-slate-800 bg-[#0a0d14] pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#0ea5e9]"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-400">
            Ordenar
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-10 rounded-lg border border-slate-800 bg-[#0a0d14] px-3 text-xs text-slate-100 outline-none focus:border-[#0ea5e9]"
            >
              <option value="recientes">Más recientes</option>
              <option value="nombre">Nombre (A–Z)</option>
            </select>
          </label>
          <button
            type="button"
            onClick={load}
            disabled={state.status === 'loading'}
            aria-label="Recargar el catálogo"
            className={`inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-slate-800 bg-[#0a0d14] text-slate-300 transition hover:border-slate-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`}
          >
            <RefreshCw
              className={`h-4 w-4 ${state.status === 'loading' ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
          </button>
        </div>

        {categories.length > 1 && (
          <div role="group" aria-label="Categorías" className="flex flex-wrap items-center gap-1.5">
            {[['todas', skills.length] as [string, number], ...categories].map(([name, count]) => {
              const active = category === name;
              return (
                <button
                  key={name}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCategory(name)}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${FOCUS} ${
                    active
                      ? 'border-[#0ea5e9] bg-[#0ea5e9] text-[#0a0d14]'
                      : 'border-slate-800 bg-[#0a0d14] text-slate-300 hover:border-slate-600'
                  }`}
                >
                  {name === 'todas' ? 'Todas' : name}
                  <span className={`font-mono tabular-nums ${active ? 'text-[#0a0d14]/70' : 'text-slate-500'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {state.status === 'loading' && (
        <div role="status" aria-label="Cargando el catálogo">
          <p className="sr-only">Cargando el catálogo…</p>
          <ul className="m-0 [display:grid] list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <SkillCardSkeleton key={i} />
            ))}
          </ul>
        </div>
      )}

      {state.status === 'error' && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded-xl border border-rose-500/40 bg-rose-950/30 p-4 text-sm text-rose-200"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1">{state.message}</span>
          <button
            type="button"
            onClick={load}
            className={`cursor-pointer rounded-lg border border-rose-400/50 bg-transparent px-3 py-1 text-xs font-semibold text-rose-100 hover:bg-rose-900/40 ${FOCUS}`}
          >
            Reintentar
          </button>
        </div>
      )}

      {state.status === 'ready' && (
        <>
          <p role="status" className="m-0 font-mono text-xs text-slate-500">
            {visible.length} {visible.length === 1 ? 'skill' : 'skills'}
            {filtering && ` de ${skills.length}`}
          </p>

          {skills.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 bg-[#121722] p-10 text-center">
              <p className="m-0 text-sm text-slate-300">Todavía no hay skills en el catálogo.</p>
              <p className="mx-0 mb-4 mt-1 text-xs text-slate-500">
                Publica la primera pegando la URL de un repo de GitHub.
              </p>
              <button
                type="button"
                onClick={() => setPublishOpen(true)}
                className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border-0 bg-[#0ea5e9] px-4 text-xs font-semibold text-[#0a0d14] hover:bg-[#38bdf8] ${FOCUS}`}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Publicar una skill
              </button>
            </div>
          ) : visible.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 bg-[#121722] p-10 text-center">
              <p className="m-0 text-sm text-slate-300">Ninguna skill coincide con tu búsqueda.</p>
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setCategory('todas');
                }}
                className={`mt-3 inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-slate-700 bg-transparent px-3 text-xs font-medium text-slate-200 hover:border-[#0ea5e9] ${FOCUS}`}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                Quitar filtros
              </button>
            </div>
          ) : (
            <ul className="m-0 [display:grid] list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((skill) => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  onOpen={() => onOpenSkill(skill.id)}
                  onOpenInStudio={onOpenInStudio ? () => onOpenInStudio(skill.id) : undefined}
                />
              ))}
            </ul>
          )}
        </>
      )}

      {state.status === 'loading' && (
        <p className="m-0 flex items-center gap-2 text-xs text-slate-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          Leyendo las skills desde GitHub…
        </p>
      )}

      <PublishSkillDialog
        open={publishOpen}
        session={session}
        onClose={() => setPublishOpen(false)}
        onRequestLogin={onRequestLogin}
        onRegister={(url) => api.registerSkillFromUrl(url)}
        onPublishLocal={api.publishLocalSkill ? (bundle, onProgress) => api.publishLocalSkill!(bundle, onProgress) : undefined}
        onRegistered={(created) => {
          load();
          onOpenSkill(created.id);
        }}
      />
    </section>
  );
}

export default CatalogPage;
