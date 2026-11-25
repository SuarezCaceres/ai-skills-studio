import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileCode2,
  FileText,
  FolderOpen,
  Pencil,
  Plus,
  Scale,
  Tag,
  Terminal,
  TriangleAlert,
  Loader2,
} from 'lucide-react';
import type {
  CatalogApi,
  CatalogSkill,
  CatalogSkillPreview,
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
import { SafeMarkdown } from './SafeMarkdown';
import { SkillEditorDialog } from './SkillEditorDialog';
import { utf8ToBase64 } from '../../services/skillUploadService';
import { TranslateButton } from './TranslateButton';
import { FilesPanel } from './FilesPanel';

/* ==========================================================================
   Pestañas WAI-ARIA
   ========================================================================== */

type TabId = 'resumen' | 'archivos';

const TABS: { id: TabId; label: string; Icon: typeof FileText }[] = [
  { id: 'resumen', label: 'Resumen', Icon: FileText },
  { id: 'archivos', label: 'Archivos', Icon: FolderOpen },
];

function PreviewSidebarRow({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span className="mt-0.5 shrink-0 text-slate-500" aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</dt>
        <dd className="m-0 mt-0.5 break-words text-sm text-slate-200">{children}</dd>
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
  /** Vista previa de solo lectura fijada a `commitSha` (cuando viene de `Explorar`). */
  previewSkill?: CatalogSkillPreview | null;
  onBack: () => void;
  /** Texto del botón de volver. */
  backLabel?: string;
  /** Importa al catálogo comunitario la skill abierta en vista previa. */
  onImportPreview?: (preview: CatalogSkillPreview) => Promise<void>;
  /** `true` mientras está en curso la importación de la vista previa. */
  importingPreview?: boolean;
  /** @deprecated Compatibilidad temporal Fase 0/1; se retira en Fase 2. */
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
  previewSkill = null,
  onBack,
  backLabel,
  onImportPreview,
  importingPreview = false,
  onOpenInStudio: _onOpenInStudio,
  api,
  session = null,
  onRequestLogin,
  renderAudit,
  renderInstall,
}: SkillDetailPageProps) {
  const uid = useId();
  const isPreview = Boolean(previewSkill);
  const effectiveBackLabel = backLabel ?? (isPreview ? 'Explorar' : 'Catálogo');
  const previewKey = previewSkill ? `${previewSkill.skill.id}@${previewSkill.skill.commitSha}` : '';

  const [currentId, setCurrentId] = useState<string | null>(skillId);
  const [skillState, setSkillState] = useState<SkillState>({ status: 'idle' });
  const [resultsState, setResultsState] = useState<ResultsState>({ status: 'loading' });
  const [votes, setVotes] = useState<SkillVotes | null>(null);
  const [votesError, setVotesError] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);
  const [tab, setTab] = useState<TabId>('resumen');
  const [publishOpen, setPublishOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [translated, setTranslated] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [loadedContents, setLoadedContents] = useState<Record<string, string>>({});
  const [npxCopied, setNpxCopied] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const npxTimer = useRef<number | undefined>(undefined);
  const tabRefs = useRef<Record<TabId, HTMLButtonElement | null>>({ resumen: null, archivos: null });

  useEffect(() => () => window.clearTimeout(npxTimer.current), []);

  // Sincroniza con la selección que llega desde App.tsx.
  useEffect(() => {
    setCurrentId(skillId);
  }, [skillId]);

  // Al cambiar de vista previa, reinicia pestaña, traducción y archivos cargados.
  useEffect(() => {
    if (!previewKey) return;
    setTab('resumen');
    setTranslated(null);
    setLoadedContents({});
    setNpxCopied(false);
    setImportError(null);
  }, [previewKey]);

  // Carga de la skill (solo en modo catálogo; en vista previa ya viene fijada a commitSha).
  useEffect(() => {
    if (isPreview) return;
    if (!currentId) {
      setSkillState({ status: 'idle' });
      return;
    }
    let cancelled = false;
    setSkillState({ status: 'loading' });
    setTab('resumen');
    setTranslated(null);
    setLoadedContents({});
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
  }, [api, currentId, reload, isPreview]);

  const baseSkill = previewSkill
    ? previewSkill.skill
    : skillState.status === 'ready'
      ? skillState.skill
      : null;

  const baseSkillKey = baseSkill ? `${baseSkill.id}@${baseSkill.commitSha}` : '';
  useEffect(() => {
    setLoadedContents({});
  }, [baseSkillKey]);

  const handleFileLoaded = useCallback((filePath: string, content: string) => {
    setLoadedContents((prev) =>
      Object.prototype.hasOwnProperty.call(prev, filePath) && prev[filePath] === content
        ? prev
        : { ...prev, [filePath]: content }
    );
  }, []);

  const effectiveSkill = useMemo<CatalogSkill | null>(() => {
    if (!baseSkill) return null;
    if (Object.keys(loadedContents).length === 0) return baseSkill;
    return {
      ...baseSkill,
      files: baseSkill.files.map((f) =>
        Object.prototype.hasOwnProperty.call(loadedContents, f.path)
          ? { ...f, content: loadedContents[f.path] }
          : f
      ),
    };
  }, [baseSkill, loadedContents]);

  // Resultados y votos, en paralelo y con estados independientes (deshabilitados en vista previa).
  const readyId = !isPreview && skillState.status === 'ready' ? skillState.skill.id : null;
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

  const handleCopyNpx = async () => {
    if (!previewSkill?.npxCommand) return;
    try {
      await navigator.clipboard.writeText(previewSkill.npxCommand);
      setNpxCopied(true);
      window.clearTimeout(npxTimer.current);
      npxTimer.current = window.setTimeout(() => setNpxCopied(false), 2000);
    } catch {
      /* el usuario puede copiar manualmente */
    }
  };

  const handleImportPreview = async () => {
    if (!previewSkill || !onImportPreview || importingPreview) return;
    setImportError(null);
    try {
      await onImportPreview(previewSkill);
    } catch (err) {
      setImportError(errorMessage(err, 'No se pudo importar la skill al catálogo.'));
    }
  };

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
      {effectiveBackLabel}
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

  if (!isPreview && skillState.status === 'idle') {
    return shell(
      <div className="space-y-4">
        {backButton}
        <p className="m-0 rounded-xl border border-dashed border-slate-700 bg-[#121722] p-6 text-sm text-slate-400">
          No hay ninguna skill seleccionada. Vuelve al catálogo y elige una.
        </p>
      </div>
    );
  }

  if (!isPreview && skillState.status === 'loading') {
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

  if (!isPreview && (skillState.status === 'error' || skillState.status === 'notfound')) {
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

  if (!effectiveSkill) return null;

  const skill = effectiveSkill;
  const me = session?.login.toLowerCase();
  const canEdit =
    !isPreview &&
    Boolean(me) &&
    Boolean(api.commitSkillChanges) &&
    skill.uploadedBy.login.toLowerCase() === me &&
    skill.repo.split('/')[0].toLowerCase() === me;
  const uploader = skill.uploadedBy;
  const profileUrl = safeHttpUrl(uploader.profileUrl);
  const avatarUrl = safeHttpUrl(uploader.avatarUrl);
  const repoUrl = safeHttpUrl(`https://github.com/${skill.repo}`);
  const externalPreviewUrl = previewSkill ? safeHttpUrl(previewSkill.externalUrl) : null;
  const panelId = (id: TabId) => `${uid}-panel-${id}`;
  const tabId = (id: TabId) => `${uid}-tab-${id}`;

  return shell(
    <>
      <p role="status" className="sr-only">
        Skill {skill.name} cargada
      </p>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        {backButton}
        {isPreview && previewSkill ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#0ea5e9]/40 bg-[#0ea5e9]/10 px-3 py-1 font-mono text-xs font-medium text-[#38bdf8]">
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              Vista previa · {previewSkill.sourceLabel ?? 'skills.sh'} · {skill.commitSha.slice(0, 7)}
            </span>
            {externalPreviewUrl && (
              <a
                href={externalPreviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-transparent px-3 py-1 text-xs font-semibold text-slate-200 no-underline transition hover:border-[#0ea5e9] hover:text-[#38bdf8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]"
              >
                Ver en {previewSkill.sourceLabel ?? 'skills.sh'}
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
                <span className="sr-only">(se abre en una pestaña nueva)</span>
              </a>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {canEdit && (
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-600 bg-transparent px-4 py-1.5 text-xs font-semibold text-slate-100 hover:border-[#0ea5e9] hover:text-[#38bdf8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                Editar
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
        )}
      </div>

      <div className="[display:grid] min-w-0 gap-x-8 gap-y-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:[grid-template-rows:auto_1fr]">
        {/* Ficha lateral: primero en el DOM para móvil, columna derecha en escritorio. */}
        <div className="min-w-0 lg:col-start-2 lg:row-start-1 lg:row-span-2">
          <div className="lg:sticky lg:top-20">
            {isPreview && previewSkill ? (
              <aside aria-label="Ficha de la skill" className="min-w-0 space-y-4">
                <div className="space-y-2.5 rounded-xl border border-slate-800 bg-[#121722] p-4">
                  <p className="m-0 font-mono text-[11px] uppercase tracking-wider text-[#38bdf8]">
                    Vista previa · {previewSkill.sourceLabel ?? 'skills.sh'}
                  </p>
                  {onImportPreview && (
                    <button
                      type="button"
                      onClick={handleImportPreview}
                      disabled={importingPreview}
                      aria-busy={importingPreview || undefined}
                      className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border-0 bg-[#0ea5e9] px-4 py-2.5 text-sm font-bold text-[#0a0d14] transition hover:bg-[#38bdf8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {importingPreview ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Download className="h-4 w-4" aria-hidden="true" />
                      )}
                      {importingPreview ? 'Importando al catálogo…' : 'Importar al catálogo'}
                    </button>
                  )}
                  <p className="m-0 text-xs leading-relaxed text-slate-400">
                    Solo lectura fijada al commit{' '}
                    <code className="font-mono text-slate-200">{skill.commitSha.slice(0, 7)}</code>.
                    {!session && onImportPreview ? ' Requiere iniciar sesión con GitHub para registrarla.' : ''}
                  </p>
                  {importError && (
                    <p role="alert" className="m-0 text-xs text-rose-300">
                      {importError}
                    </p>
                  )}
                </div>

                {renderAudit?.(skill)}

                <dl className="m-0 divide-y divide-slate-800/80 rounded-xl border border-slate-800 bg-[#121722] px-4">
                  <PreviewSidebarRow icon={<FileCode2 className="h-4 w-4" />} label="Repositorio">
                    {repoUrl ? (
                      <a
                        href={repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex max-w-full items-center gap-1 font-mono text-[13px] text-[#38bdf8] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]"
                      >
                        <span className="truncate">{skill.repo}</span>
                        <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                        <span className="sr-only">(se abre en una pestaña nueva)</span>
                      </a>
                    ) : (
                      <span className="font-mono text-[13px]">{skill.repo}</span>
                    )}
                    <span className="mt-0.5 block font-mono text-[11px] text-slate-500">
                      commit {skill.commitSha.slice(0, 7)}
                    </span>
                  </PreviewSidebarRow>
                  <PreviewSidebarRow icon={<Scale className="h-4 w-4" />} label="Licencia">
                    {skill.license ?? <span className="text-slate-400">Sin licencia declarada</span>}
                  </PreviewSidebarRow>
                  <PreviewSidebarRow icon={<Tag className="h-4 w-4" />} label="Categoría">
                    {skill.category}
                  </PreviewSidebarRow>
                  <PreviewSidebarRow icon={<TriangleAlert className="h-4 w-4" />} label="Trae scripts">
                    {skill.hasScripts ? (
                      <span className="inline-flex items-center rounded-full border border-amber-500/40 bg-amber-950/40 px-2 py-0.5 text-xs font-semibold text-amber-300">
                        Sí, revisa antes de ejecutar
                      </span>
                    ) : (
                      <span className="text-slate-300">No</span>
                    )}
                  </PreviewSidebarRow>
                </dl>

                {previewSkill.npxCommand && (
                  <div className="space-y-2 rounded-xl border border-slate-800 bg-[#121722] p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                        <Terminal className="h-3.5 w-3.5 text-[#0ea5e9]" aria-hidden="true" />
                        Comando rápido (npx)
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyNpx}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-slate-700 bg-[#0a0d14] px-2.5 py-1 text-[11px] font-semibold text-slate-200 transition hover:border-[#0ea5e9] hover:text-[#38bdf8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]"
                      >
                        {npxCopied ? (
                          <Check className="h-3 w-3 text-emerald-400" aria-hidden="true" />
                        ) : (
                          <Copy className="h-3 w-3" aria-hidden="true" />
                        )}
                        {npxCopied ? 'Copiado' : 'Copiar npx'}
                      </button>
                    </div>
                    <pre
                      tabIndex={0}
                      className="m-0 overflow-x-auto rounded-lg border border-slate-800 bg-[#0a0d14] p-2.5 font-mono text-xs text-slate-200 focus-visible:outline-2 focus-visible:outline-[#0ea5e9]"
                    >
                      {previewSkill.npxCommand}
                    </pre>
                  </div>
                )}

                {renderInstall?.(skill)}
              </aside>
            ) : (
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
            )}
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
                {(isPreview ? skill.author.login : uploader.login).slice(0, 1)}
              </span>
            )}
            {isPreview ? (
              <>
                <span>Repositorio</span>
                {repoUrl ? (
                  <a
                    href={repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono font-semibold text-slate-200 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]"
                  >
                    {skill.repo}
                  </a>
                ) : (
                  <span className="font-mono font-semibold text-slate-200">{skill.repo}</span>
                )}
              </>
            ) : (
              <>
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
              </>
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
                    <TranslateButton
                      key={`${skill.id}@${skill.commitSha}`}
                      markdown={skill.markdown}
                      onChange={setTranslated}
                    />
                    <article
                      lang={translated === null ? 'en' : 'es'}
                      aria-label={translated === null ? 'Contenido de SKILL.md' : 'Contenido de SKILL.md traducido al español'}
                      className="min-w-0"
                    >
                      <SafeMarkdown source={translated ?? skill.markdown} />
                    </article>
                  </div>
                  {!isPreview && (
                    <>
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
                    </>
                  )}
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
              {tab === 'archivos' && (
                <FilesPanel
                  key={`${skill.id}@${skill.commitSha}`}
                  skill={skill}
                  api={api}
                  loadedContents={loadedContents}
                  onFileLoaded={handleFileLoaded}
                  session={session}
                  onRequestLogin={onRequestLogin}
                />
              )}
            </div>
          </div>

          {!isPreview && (
            <MoreFromAuthor
              author={skill.author}
              currentSkillId={skill.id}
              api={api}
              onSelect={setCurrentId}
            />
          )}
        </div>
      </div>

      {canEdit && (
        <SkillEditorDialog
          open={editOpen}
          skill={skill}
          onClose={() => setEditOpen(false)}
          onReload={() => {
            // Tras un conflicto el registro puede estar en un commit viejo: se pone al día primero.
            const sync = api.syncSkillToLatest ? api.syncSkillToLatest(skill.id).catch(() => undefined) : Promise.resolve();
            void sync.then(() => setReload((n) => n + 1));
          }}
          onSave={async (markdown, message) => {
            await api.commitSkillChanges!(
              skill.id,
              [{ path: 'SKILL.md', base64: utf8ToBase64(markdown), expectBase64: utf8ToBase64(skill.markdown) }],
              { message }
            );
            setReload((n) => n + 1);
          }}
        />
      )}

      {!isPreview && (
        <PublishSkillDialog
          open={publishOpen}
          session={session}
          onClose={() => setPublishOpen(false)}
          onRequestLogin={onRequestLogin}
          onRegister={(url) => api.registerSkillFromUrl(url)}
          onPublishLocal={api.publishLocalSkill ? (bundle, onProgress) => api.publishLocalSkill!(bundle, onProgress) : undefined}
          onRegistered={(created) => setCurrentId(created.id)}
        />
      )}
    </>
  );
}
