import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  FileText,
  FolderOpen,
  Plus,
} from 'lucide-react';
import type {
  CatalogApi,
  CatalogSkill,
  CatalogSkillFile,
  GithubSession,
  SkillResultReport,
  SkillVotes,
} from '../../types/catalog';
import { SkillSidebar } from './SkillSidebar';
import { ResultsByModel, safeHttpUrl } from './ResultsByModel';
import { ReportResultForm } from './ReportResultForm';
import type { ReportInput } from './ReportResultForm';
import { MoreFromAuthor } from './MoreFromAuthor';
import { PublishSkillDialog } from './PublishSkillDialog';
import { MAX_MARKDOWN_CHARS, SafeMarkdown } from './SafeMarkdown';
import { TranslateButton } from './TranslateButton';

/* ==========================================================================
   Pestañas WAI-ARIA y pestaña de archivos
   ========================================================================== */

type TabId = 'resumen' | 'archivos';

const TABS: { id: TabId; label: string; Icon: typeof FileText }[] = [
  { id: 'resumen', label: 'Resumen', Icon: FileText },
  { id: 'archivos', label: 'Archivos', Icon: FolderOpen },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function FilesPanel({ skill }: { skill: CatalogSkill }) {
  const files = skill.files;
  const [selected, setSelected] = useState<string>(
    () => files.find((f) => f.path === 'SKILL.md')?.path ?? files[0]?.path ?? ''
  );
  const file: CatalogSkillFile | undefined = files.find((f) => f.path === selected);
  const content = file?.path === 'SKILL.md' ? (file.content ?? skill.markdown) : file?.content;

  if (files.length === 0) {
    return (
      <p className="m-0 rounded-xl border border-dashed border-slate-700 bg-[#121722] p-5 text-sm text-slate-400">
        Esta skill no lista archivos.
      </p>
    );
  }

  return (
    <div className="[display:grid] min-w-0 gap-4 md:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
      <ul
        aria-label="Archivos de la skill"
        className="m-0 flex list-none flex-col gap-1 overflow-hidden rounded-xl border border-slate-800 bg-[#121722] p-2"
      >
        {files.map((f) => (
          <li key={f.path} className="min-w-0">
            <button
              type="button"
              onClick={() => setSelected(f.path)}
              aria-current={f.path === selected ? 'true' : undefined}
              className={`flex w-full min-w-0 cursor-pointer items-center justify-between gap-3 rounded-lg border-0 border-l-2 px-2.5 py-1.5 text-left text-xs transition-colors focus-visible:outline-2 focus-visible:outline-[#0ea5e9] ${
                f.path === selected
                  ? 'border-l-[#0ea5e9] bg-[#0a0d14] text-white'
                  : 'border-l-transparent bg-transparent text-slate-400 hover:bg-[#0a0d14]/60 hover:text-slate-200'
              }`}
            >
              <span className="min-w-0 truncate font-mono" title={f.path}>
                {f.path}
              </span>
              <span className="shrink-0 font-mono tabular-nums text-slate-500">
                {formatBytes(f.sizeBytes)}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="min-w-0 overflow-hidden rounded-xl border border-slate-800 bg-[#0a0d14]">
        <div className="border-b border-slate-800 bg-[#121722] px-4 py-2 font-mono text-xs text-slate-300">
          <span className="break-all">{file?.path}</span>
        </div>
        {content !== undefined ? (
          <pre
            tabIndex={0}
            aria-label={`Contenido de ${file?.path}`}
            className="m-0 max-h-[28rem] overflow-auto p-4 font-mono text-[13px] leading-relaxed text-slate-200 focus-visible:outline-2 focus-visible:outline-[#0ea5e9]"
          >
            {content.length > MAX_MARKDOWN_CHARS ? content.slice(0, MAX_MARKDOWN_CHARS) : content}
          </pre>
        ) : (
          <p className="m-0 p-4 text-sm text-slate-400">
            El contenido de este archivo no se descarga en esta vista. Ábrelo en el repositorio.
          </p>
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   Página de detalle
   ========================================================================== */

export interface SkillDetailPageProps {
  /** `CatalogSkill.id` seleccionado, o null si no hay ninguno. */
  skillId: string | null;
  onBack: () => void;
  /** Texto del botón de volver. */
  backLabel?: string;
  /** Si se pasa, muestra "Abrir en estudio" en la cabecera. */
  onOpenInStudio?: (skill: CatalogSkill) => void;
  /**
   * `api` es obligatoria: la ruta de integración (`CatalogDetailRoute`) inyecta el
   * servicio real de GitHub. El mock de desarrollo no se importa desde aquí para
   * que no entre en el bundle de producción.
   */
  api: CatalogApi;
  session?: GithubSession | null;
  onRequestLogin?: () => void;
  renderAudit?: (skill: CatalogSkill) => ReactNode;
  renderInstall?: (skill: CatalogSkill) => ReactNode;
}

type SkillState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'notfound' }
  | { status: 'ready'; skill: CatalogSkill };

type ResultsState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; results: SkillResultReport[] };

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

export function SkillDetailPage({
  skillId,
  onBack,
  backLabel = 'Catálogo',
  onOpenInStudio,
  api,
  session = null,
  onRequestLogin,
  renderAudit,
  renderInstall,
}: SkillDetailPageProps) {
  const uid = useId();
  const [currentId, setCurrentId] = useState<string | null>(skillId);
  const [skillState, setSkillState] = useState<SkillState>({ status: 'idle' });
  const [resultsState, setResultsState] = useState<ResultsState>({ status: 'loading' });
  const [votes, setVotes] = useState<SkillVotes | null>(null);
  const [votesError, setVotesError] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);
  const [tab, setTab] = useState<TabId>('resumen');
  const [publishOpen, setPublishOpen] = useState(false);
  const [translated, setTranslated] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const tabRefs = useRef<Record<TabId, HTMLButtonElement | null>>({ resumen: null, archivos: null });

  // Sincroniza con la selección que llega desde App.tsx.
  useEffect(() => {
    setCurrentId(skillId);
  }, [skillId]);

  // Carga de la skill.
  useEffect(() => {
    if (!currentId) {
      setSkillState({ status: 'idle' });
      return;
    }
    let cancelled = false;
    setSkillState({ status: 'loading' });
    setTab('resumen');
    setTranslated(null);
    api
      .getSkill(currentId)
      .then((skill) => {
        if (cancelled) return;
        setSkillState(skill ? { status: 'ready', skill } : { status: 'notfound' });
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setSkillState({ status: 'error', message: errorMessage(err, 'No se pudo cargar la skill.') });
      });
    return () => {
      cancelled = true;
    };
  }, [api, currentId, reload]);

  // Resultados y votos, en paralelo y con estados independientes.
  const readyId = skillState.status === 'ready' ? skillState.skill.id : null;
  const [resultsReload, setResultsReload] = useState(0);
  useEffect(() => {
    if (!readyId) return;
    let cancelled = false;
    setResultsState({ status: 'loading' });
    api
      .listResults(readyId)
      .then((results) => {
        if (!cancelled) setResultsState({ status: 'ready', results });
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setResultsState({
            status: 'error',
            message: errorMessage(err, 'No se pudieron cargar los resultados.'),
          });
      });
    return () => {
      cancelled = true;
    };
  }, [api, readyId, resultsReload]);

  useEffect(() => {
    if (!readyId) return;
    let cancelled = false;
    setVotes(null);
    setVotesError(null);
    api
      .getVotes(readyId)
      .then((v) => {
        if (!cancelled) setVotes(v);
      })
      .catch((err: unknown) => {
        if (!cancelled) setVotesError(errorMessage(err, 'No se pudieron cargar los votos.'));
      });
    return () => {
      cancelled = true;
    };
  }, [api, readyId]);

  const handleVote = useCallback(async () => {
    if (!readyId) return;
    if (!session) {
      onRequestLogin?.();
      return;
    }
    setVoting(true);
    setVotesError(null);
    try {
      setVotes(await api.toggleVote(readyId));
    } catch (err) {
      setVotesError(errorMessage(err, 'No se pudo registrar el voto.'));
    } finally {
      setVoting(false);
    }
  }, [api, readyId, session, onRequestLogin]);

  const handleReport = useCallback(
    async (input: ReportInput) => {
      const report = await api.reportResult(input);
      setResultsState((prev) =>
        prev.status === 'ready' ? { status: 'ready', results: [...prev.results, report] } : prev
      );
      return report;
    },
    [api]
  );

  const handleTabKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const idx = TABS.findIndex((t) => t.id === tab);
    let next = idx;
    if (e.key === 'ArrowRight') next = (idx + 1) % TABS.length;
    else if (e.key === 'ArrowLeft') next = (idx - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = TABS.length - 1;
    else return;
    e.preventDefault();
    setTab(TABS[next].id);
    tabRefs.current[TABS[next].id]?.focus();
  };

  const backButton = (
    <button
      type="button"
      onClick={onBack}
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border-0 bg-transparent px-1 py-1 text-sm font-medium text-[#38bdf8] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {backLabel}
    </button>
  );

  const shell = (children: ReactNode) => (
    <section
      aria-label="Detalle de skill"
      className="mx-auto w-full max-w-[1280px] min-w-0 px-4 py-6 text-slate-300 sm:px-6"
    >
      {children}
    </section>
  );

  if (skillState.status === 'idle') {
    return shell(
      <div className="space-y-4">
        {backButton}
        <p className="m-0 rounded-xl border border-dashed border-slate-700 bg-[#121722] p-6 text-sm text-slate-400">
          No hay ninguna skill seleccionada. Vuelve al catálogo y elige una.
        </p>
      </div>
    );
  }

  if (skillState.status === 'loading') {
    return shell(
      <div className="space-y-6" role="status" aria-label="Cargando skill">
        {backButton}
        <div className="[display:grid] gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <div className="h-9 w-2/3 animate-pulse rounded-lg bg-[#121722]" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-[#121722]" />
            <div className="h-16 animate-pulse rounded-lg bg-[#121722]" />
            <div className="h-64 animate-pulse rounded-xl border border-slate-800 bg-[#121722]" />
          </div>
          <div className="h-72 animate-pulse rounded-xl border border-slate-800 bg-[#121722]" />
        </div>
      </div>
    );
  }

  if (skillState.status === 'error' || skillState.status === 'notfound') {
    const notFound = skillState.status === 'notfound';
    return shell(
      <div className="space-y-4">
        {backButton}
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded-xl border border-rose-500/40 bg-rose-950/30 p-4 text-sm text-rose-200"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            {skillState.status === 'error' ? skillState.message : 'No encontramos esta skill en el catálogo.'}
          </span>
          {!notFound && (
            <button
              type="button"
              onClick={() => setReload((n) => n + 1)}
              className="cursor-pointer rounded-lg border border-rose-400/50 bg-transparent px-3 py-1 text-xs font-semibold text-rose-100 hover:bg-rose-900/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]"
            >
              Reintentar
            </button>
          )}
        </div>
      </div>
    );
  }

  const { skill } = skillState;
  const uploader = skill.uploadedBy;
  const profileUrl = safeHttpUrl(uploader.profileUrl);
  const avatarUrl = safeHttpUrl(uploader.avatarUrl);
  const panelId = (id: TabId) => `${uid}-panel-${id}`;
  const tabId = (id: TabId) => `${uid}-tab-${id}`;

  return shell(
    <>
      <p role="status" className="sr-only">
        Skill {skill.name} cargada
      </p>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        {backButton}
        <div className="flex flex-wrap items-center gap-2">
        {onOpenInStudio && (
          <button
            type="button"
            onClick={() => onOpenInStudio(skill)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border-0 bg-[#0ea5e9] px-4 py-1.5 text-xs font-semibold text-[#0a0d14] hover:bg-[#38bdf8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]"
          >
            <FolderOpen className="h-3.5 w-3.5" aria-hidden="true" />
            Abrir en estudio
          </button>
        )}
        <button
          type="button"
          onClick={() => setPublishOpen(true)}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-600 bg-transparent px-4 py-1.5 text-xs font-semibold text-slate-100 hover:border-[#0ea5e9] hover:text-[#38bdf8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Publicar una skill
        </button>
        </div>
      </div>

      <div className="[display:grid] min-w-0 gap-x-8 gap-y-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:[grid-template-rows:auto_1fr]">
        {/* Ficha lateral: primero en el DOM para móvil, columna derecha en escritorio. */}
        <div className="min-w-0 lg:col-start-2 lg:row-start-1 lg:row-span-2">
          <div className="lg:sticky lg:top-20">
            <SkillSidebar
              skill={skill}
              votes={votes}
              votesError={votesError}
              voting={voting}
              canVote={Boolean(session)}
              onVote={handleVote}
              auditSlot={renderAudit?.(skill)}
              installSlot={renderInstall?.(skill)}
            />
          </div>
        </div>

        <header className="min-w-0 lg:col-start-1 lg:row-start-1">
          <h1
            className="m-0 break-words font-mono text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl"
          >
            {skill.name}
          </h1>
          <p className="mt-2 mb-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-400">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                width={20}
                height={20}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="h-5 w-5 rounded-full border border-slate-700"
              />
            ) : (
              <span
                aria-hidden="true"
                className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-700 bg-[#121722] text-[10px] font-bold uppercase text-slate-300"
              >
                {uploader.login.slice(0, 1)}
              </span>
            )}
            <span>Subida por</span>
            {profileUrl ? (
              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-slate-200 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]"
              >
                @{uploader.login}
              </a>
            ) : (
              <span className="font-semibold text-slate-200">@{uploader.login}</span>
            )}
          </p>
          <p
            lang="en"
            className="mt-4 mb-0 max-w-[68ch] break-words text-base leading-relaxed text-slate-300"
          >
            {skill.description}
          </p>
        </header>

        <div className="min-w-0 space-y-10 lg:col-start-1 lg:row-start-2">
          <div>
            <div
              role="tablist"
              aria-label="Secciones de la skill"
              className="flex gap-1 border-b border-slate-800"
            >
              {TABS.map(({ id, label, Icon }) => {
                const active = tab === id;
                return (
                  <button
                    key={id}
                    ref={(el) => {
                      tabRefs.current[id] = el;
                    }}
                    type="button"
                    role="tab"
                    id={tabId(id)}
                    aria-selected={active}
                    aria-controls={panelId(id)}
                    tabIndex={active ? 0 : -1}
                    onClick={() => setTab(id)}
                    onKeyDown={handleTabKeyDown}
                    className={`-mb-px inline-flex cursor-pointer items-center gap-2 border-0 border-b-2 bg-transparent px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#0ea5e9] ${
                      active
                        ? 'border-b-[#0ea5e9] text-white'
                        : 'border-b-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {label}
                    {id === 'archivos' && (
                      <span className="rounded-full bg-slate-800 px-1.5 font-mono text-[11px] tabular-nums text-slate-300">
                        {skill.files.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div
              role="tabpanel"
              id={panelId('resumen')}
              aria-labelledby={tabId('resumen')}
              hidden={tab !== 'resumen'}
              tabIndex={0}
              className="pt-6 focus-visible:outline-2 focus-visible:outline-[#0ea5e9]"
            >
              {tab === 'resumen' && (
                <div className="space-y-10">
                  <div className="space-y-4">
                    <TranslateButton key={skill.id} markdown={skill.markdown} onChange={setTranslated} />
                    <article
                      lang={translated === null ? 'en' : 'es'}
                      aria-label={translated === null ? 'Contenido de SKILL.md' : 'Contenido de SKILL.md traducido al español'}
                      className="min-w-0"
                    >
                      <SafeMarkdown source={translated ?? skill.markdown} />
                    </article>
                  </div>
                  <ResultsByModel
                    results={resultsState.status === 'ready' ? resultsState.results : []}
                    loading={resultsState.status === 'loading'}
                    error={resultsState.status === 'error' ? resultsState.message : null}
                    onRetry={() => setResultsReload((n) => n + 1)}
                  />
                  <ReportResultForm
                    key={skill.id}
                    skillId={skill.id}
                    session={session}
                    onRequestLogin={onRequestLogin}
                    onSubmit={handleReport}
                  />
                </div>
              )}
            </div>

            <div
              role="tabpanel"
              id={panelId('archivos')}
              aria-labelledby={tabId('archivos')}
              hidden={tab !== 'archivos'}
              tabIndex={0}
              className="pt-6 focus-visible:outline-2 focus-visible:outline-[#0ea5e9]"
            >
              {tab === 'archivos' && <FilesPanel key={skill.id} skill={skill} />}
            </div>
          </div>

          <MoreFromAuthor
            author={skill.author}
            currentSkillId={skill.id}
            api={api}
            onSelect={setCurrentId}
          />
        </div>
      </div>

      <PublishSkillDialog
        open={publishOpen}
        session={session}
        onClose={() => setPublishOpen(false)}
        onRequestLogin={onRequestLogin}
        onRegister={(url) => api.registerSkillFromUrl(url)}
        onPublishLocal={api.publishLocalSkill ? (bundle, onProgress) => api.publishLocalSkill!(bundle, onProgress) : undefined}
        onRegistered={(created) => setCurrentId(created.id)}
      />
    </>
  );
}
