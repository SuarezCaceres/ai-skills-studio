import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Flame,
  Github,
  Info,
  RefreshCw,
  Search,
  TrendingUp,
  Trophy,
  X,
} from 'lucide-react';
import { useCatalog } from '../../hooks/useCatalog';
import { skillsShService } from '../../services/skillsShService';
import type {
  SkillsShEntry,
  SkillsShPageProps,
  SkillsShSourceMode,
  SkillsShView,
} from '../../types/skillsSh';
import { SkillsShCard, SkillsShCardSkeleton } from './SkillsShCard';

type PageState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ready';
      mode: 'list' | 'search';
      skills: SkillsShEntry[];
      total: number;
      hasMore: boolean;
      sourceMode: SkillsShSourceMode;
      syncedAt: string;
      notice?: string;
    };

const FOCUS =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]';

const VIEW_TABS: {
  id: SkillsShView;
  label: string;
  icon: typeof Trophy;
}[] = [
  { id: 'all-time', label: 'Más instaladas', icon: Trophy },
  { id: 'trending', label: 'Tendencia', icon: TrendingUp },
  { id: 'hot', label: 'En alza', icon: Flame },
];

function formatSyncedDate(iso: string): string {
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return '';
  return new Date(ts).toLocaleString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Sección «Explorar» de Códice Studio: directorio abierto sincronizado con
 * https://www.skills.sh, con vistas de ranking, filtro de oficiales, buscador
 * con debounce, paginación y acciones de integración directa.
 */
export function SkillsShPage({
  onInspectSkill,
  onOpenInWorkspace,
  onImportToCatalog,
  onRequestLogin,
  busyAction = null,
}: SkillsShPageProps) {
  const { session } = useCatalog();
  const [view, setView] = useState<SkillsShView>('all-time');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [onlyOfficial, setOnlyOfficial] = useState(false);
  const [reload, setReload] = useState<{ count: number; forceFresh: boolean }>({
    count: 0,
    forceFresh: false,
  });
  const [state, setState] = useState<PageState>({ status: 'loading' });

  // Debounce de 300ms para las búsquedas en el directorio de skills.sh.
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed === '') {
      setDebouncedQuery('');
      return;
    }
    const timer = window.setTimeout(() => {
      setDebouncedQuery(trimmed);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  // Carga de datos (listado paginado o búsqueda) con prevención de condiciones de carrera.
  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });

    const request = debouncedQuery
      ? skillsShService.search(debouncedQuery, 40).then((res) => ({
          mode: 'search' as const,
          skills: res.skills,
          total: res.count,
          hasMore: false,
          sourceMode: res.sourceMode,
          syncedAt: res.syncedAt,
          notice: res.notice,
        }))
      : skillsShService
          .list(view, page, reload.forceFresh ? { forceFresh: true } : undefined)
          .then((res) => ({
            mode: 'list' as const,
            skills: res.skills,
            total: res.total,
            hasMore: res.hasMore,
            sourceMode: res.sourceMode,
            syncedAt: res.syncedAt,
            notice: res.notice,
          }));

    request
      .then((data) => {
        if (cancelled) return;
        if (data.mode === 'list' && page === 0 && data.skills.length > 0) {
          setPageSize(data.skills.length);
        }
        setState({ status: 'ready', ...data });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({
          status: 'error',
          message:
            err instanceof Error && err.message
              ? err.message
              : 'No se pudo cargar el directorio de skills.sh en este momento.',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [view, page, debouncedQuery, reload]);

  const handleForceRefresh = useCallback(() => {
    skillsShService.clearCache();
    setReload((prev) => ({ count: prev.count + 1, forceFresh: true }));
  }, []);

  const handleRetry = useCallback(() => {
    setReload((prev) => ({ count: prev.count + 1, forceFresh: false }));
  }, []);

  const handleSelectView = useCallback((nextView: SkillsShView) => {
    setView(nextView);
    setPage(0);
    setQuery('');
    setDebouncedQuery('');
    setReload((prev) => (prev.forceFresh ? { ...prev, forceFresh: false } : prev));
  }, []);

  const handleChangePage = useCallback((nextPage: number) => {
    setPage(Math.max(0, nextPage));
    setReload((prev) => (prev.forceFresh ? { ...prev, forceFresh: false } : prev));
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const handleClearFilters = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    setOnlyOfficial(false);
    setPage(0);
  }, []);

  const rankedVisibleSkills = useMemo(() => {
    if (state.status !== 'ready') return [];
    const offset = state.mode === 'list' ? page * pageSize : 0;
    return state.skills
      .map((entry, idx) => ({
        entry,
        rank: state.mode === 'list' ? offset + idx + 1 : undefined,
      }))
      .filter(({ entry }) => (!onlyOfficial ? true : entry.isOfficial));
  }, [state, page, pageSize, onlyOfficial]);

  const isSearching = debouncedQuery.length > 0;
  const formattedSyncedAt = state.status === 'ready' ? formatSyncedDate(state.syncedAt) : '';
  const showNoticeBanner =
    state.status === 'ready' && (Boolean(state.notice) || state.sourceMode === 'snapshot');

  return (
    <section
      aria-labelledby="skills-sh-heading"
      className="mx-auto w-full max-w-[1280px] min-w-0 space-y-6 px-4 py-8 text-slate-300 sm:px-6"
    >
      {/* Cabecera principal */}
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0 max-w-2xl space-y-2">
          <p className="m-0 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#38bdf8]">
            Directorio sincronizado · skills.sh
          </p>
          <h1
            id="skills-sh-heading"
            className="m-0 text-3xl font-bold tracking-tight text-[#f1f5f9]"
          >
            Explorar skills de skills.sh
          </h1>
          <p className="m-0 text-sm leading-relaxed text-slate-400">
            Directorio abierto sincronizado con{' '}
            <a
              href="https://www.skills.sh"
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 font-medium text-[#38bdf8] hover:underline ${FOCUS}`}
            >
              skills.sh
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
            . Busca skills por popularidad o tendencia, copia su comando{' '}
            <code className="font-mono text-xs text-slate-200">npx</code>, inspecciona
            repositorios públicos de GitHub en vista previa fijada a{' '}
            <code className="font-mono text-xs text-slate-200">commitSha</code> o impórtalos al
            catálogo comunitario.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {state.status === 'ready' && (
            <span
              className="inline-flex h-9 items-center gap-2 rounded-full border border-slate-800 bg-[#121722] px-3 text-xs text-slate-300"
              role="status"
            >
              {state.sourceMode === 'live' && (
                <>
                  <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
                  <span className="font-medium text-emerald-300">En vivo</span>
                  {state.total > 0 && (
                    <span className="font-mono text-[11px] tabular-nums text-slate-400">
                      · {state.total.toLocaleString('es-ES')} skills
                    </span>
                  )}
                </>
              )}
              {state.sourceMode === 'cache' && (
                <>
                  <span className="h-2 w-2 rounded-full bg-[#38bdf8]" aria-hidden="true" />
                  <span className="font-medium text-slate-200">Caché local</span>
                </>
              )}
              {state.sourceMode === 'snapshot' && (
                <>
                  <span className="h-2 w-2 rounded-full bg-slate-400" aria-hidden="true" />
                  <span className="font-medium text-slate-200">Copia de respaldo</span>
                  {formattedSyncedAt && (
                    <span className="font-mono text-[11px] text-slate-400">
                      · {formattedSyncedAt}
                    </span>
                  )}
                </>
              )}
            </span>
          )}

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
        </div>
      </header>

      {/* Banner informativo cuando se opera en modo copia de respaldo o con aviso */}
      {showNoticeBanner && state.status === 'ready' && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700 bg-[#121722] px-4 py-3 text-xs text-slate-300"
        >
          <div className="flex min-w-0 flex-1 items-start gap-2.5">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#38bdf8]" aria-hidden="true" />
            <p className="m-0 leading-relaxed">
              {state.notice ||
                `Mostrando la copia de respaldo estática sincronizada${
                  formattedSyncedAt ? ` el ${formattedSyncedAt}` : ''
                }. Puedes seguir buscando, copiando comandos npx e inspeccionando skills de GitHub.`}
            </p>
          </div>
          <button
            type="button"
            onClick={handleForceRefresh}
            className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-[#0ea5e9]/60 bg-[#0a0d14] px-3 py-1.5 text-xs font-semibold text-[#38bdf8] transition hover:bg-[#0ea5e9] hover:text-[#0a0d14] ${FOCUS}`}
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Reintentar en vivo
          </button>
        </div>
      )}

      {/* Barra de controles */}
      <div className="space-y-3 rounded-xl border border-slate-800 bg-[#121722] p-3.5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-0 flex-1 basis-[240px]">
            <label htmlFor="skills-sh-search" className="sr-only">
              Buscar en el directorio de skills.sh
            </label>
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              aria-hidden="true"
            />
            <input
              id="skills-sh-search"
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
              placeholder="Buscar en ~10,000 skills de skills.sh (ej. react, next, audit)…"
              aria-label="Buscar en el directorio de skills.sh"
              className={`h-10 w-full rounded-lg border border-slate-800 bg-[#0a0d14] pl-10 pr-10 text-sm text-[#f1f5f9] placeholder:text-slate-500 focus:border-[#0ea5e9] ${FOCUS}`}
            />
            {query.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setDebouncedQuery('');
                }}
                aria-label="Limpiar búsqueda"
                className={`absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-slate-400 transition hover:text-white ${FOCUS}`}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleForceRefresh}
            disabled={state.status === 'loading'}
            aria-label="Actualizar directorio de skills.sh"
            className={`inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-slate-800 bg-[#0a0d14] px-3.5 text-xs font-semibold text-slate-200 transition hover:border-slate-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`}
          >
            <RefreshCw
              className={`h-4 w-4 ${state.status === 'loading' ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span>Actualizar</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div
            role="group"
            aria-label="Ranking de skills.sh"
            className="flex flex-wrap items-center gap-1.5"
          >
            {VIEW_TABS.map((tab) => {
              const Icon = tab.icon;
              const active = !isSearching && view === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => handleSelectView(tab.id)}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${FOCUS} ${
                    active
                      ? 'border-[#0ea5e9] bg-[#0ea5e9] text-[#0a0d14]'
                      : 'border-slate-800 bg-[#0a0d14] text-slate-300 hover:border-slate-600 hover:text-white'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            aria-pressed={onlyOfficial}
            onClick={() => setOnlyOfficial((prev) => !prev)}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${FOCUS} ${
              onlyOfficial
                ? 'border-[#0ea5e9] bg-[#0ea5e9]/15 text-[#38bdf8]'
                : 'border-slate-800 bg-[#0a0d14] text-slate-300 hover:border-slate-600 hover:text-white'
            }`}
          >
            <BadgeCheck
              className={`h-3.5 w-3.5 ${onlyOfficial ? 'text-[#38bdf8]' : 'text-slate-400'}`}
              aria-hidden="true"
            />
            Solo oficiales
          </button>
        </div>
      </div>

      {/* Estado: Cargando */}
      {state.status === 'loading' && (
        <div role="status" aria-label="Cargando directorio de skills.sh">
          <p className="sr-only">Cargando skills desde skills.sh…</p>
          <ul className="m-0 [display:grid] list-none grid-cols-1 gap-4 p-0 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <SkillsShCardSkeleton key={i} />
            ))}
          </ul>
        </div>
      )}

      {/* Estado: Error */}
      {state.status === 'error' && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded-xl border border-rose-500/40 bg-rose-950/30 p-4 text-sm text-rose-200"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1">{state.message}</span>
          <button
            type="button"
            onClick={handleRetry}
            className={`cursor-pointer rounded-lg border border-rose-400/50 bg-transparent px-3 py-1.5 text-xs font-semibold text-rose-100 transition hover:bg-rose-900/40 ${FOCUS}`}
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Estado: Listo */}
      {state.status === 'ready' && (
        <>
          <p role="status" className="m-0 font-mono text-xs text-slate-400">
            {state.mode === 'search' ? (
              <>
                Mostrando {rankedVisibleSkills.length} de {state.total.toLocaleString('es-ES')}{' '}
                skills para «{debouncedQuery}»
                {onlyOfficial ? ' · solo oficiales' : ''}
              </>
            ) : (
              <>
                Mostrando {rankedVisibleSkills.length} de {state.total.toLocaleString('es-ES')}{' '}
                skills
                {onlyOfficial ? ' oficiales en esta página' : ''}
                {page > 0 ? ` · página ${page + 1}` : ''}
              </>
            )}
          </p>

          {rankedVisibleSkills.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 bg-[#121722] p-10 text-center">
              <p className="m-0 text-sm font-medium text-slate-200">
                Ninguna skill coincide con los filtros actuales.
              </p>
              <p className="mx-0 mb-4 mt-1 text-xs text-slate-400">
                {onlyOfficial
                  ? 'Desactiva «Solo oficiales» o ajusta tu término de búsqueda para ver más resultados.'
                  : 'Prueba con otro término más amplio o vuelve al listado por ranking.'}
              </p>
              <button
                type="button"
                onClick={handleClearFilters}
                className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-slate-700 bg-[#0a0d14] px-4 text-xs font-semibold text-slate-200 transition hover:border-[#0ea5e9] hover:text-[#38bdf8] ${FOCUS}`}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                Limpiar filtros
              </button>
            </div>
          ) : (
            <>
              <ul className="m-0 [display:grid] list-none grid-cols-1 gap-4 p-0 md:grid-cols-2 lg:grid-cols-3">
                {rankedVisibleSkills.map(({ entry, rank }) => (
                  <SkillsShCard
                    key={entry.id}
                    entry={entry}
                    rank={rank}
                    onInspectSkill={onInspectSkill ?? onOpenInWorkspace}
                    onImportToCatalog={onImportToCatalog}
                    busyKind={busyAction && busyAction.entryId === entry.id ? busyAction.kind : null}
                    anyBusy={Boolean(busyAction)}
                  />
                ))}
              </ul>

              {state.mode === 'list' && (page > 0 || state.hasMore) && (
                <nav
                  aria-label="Paginación del directorio skills.sh"
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-[#121722] px-4 py-3"
                >
                  <button
                    type="button"
                    disabled={page === 0}
                    onClick={() => handleChangePage(page - 1)}
                    className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-700 bg-[#0a0d14] px-3.5 text-xs font-semibold text-slate-200 transition hover:border-[#0ea5e9] hover:text-[#38bdf8] disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`}
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    Anterior
                  </button>

                  <span className="font-mono text-xs tabular-nums text-slate-300">
                    Página {page + 1}
                  </span>

                  <button
                    type="button"
                    disabled={!state.hasMore}
                    onClick={() => handleChangePage(page + 1)}
                    className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-700 bg-[#0a0d14] px-3.5 text-xs font-semibold text-slate-200 transition hover:border-[#0ea5e9] hover:text-[#38bdf8] disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`}
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </nav>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}

export default SkillsShPage;
