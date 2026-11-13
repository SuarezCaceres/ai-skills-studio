import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  BookMarked,
  Building2,
  CalendarDays,
  Github,
  Globe,
  MapPin,
  Plus,
  Users,
} from 'lucide-react';
import { useCatalog } from '../../hooks/useCatalog';
import type { GithubProfile } from '../../services/githubCatalogService';
import { computeMemberStats } from '../../services/teamStats';
import type { CatalogSkill } from '../../types/catalog';
import { isTeamLogin } from '../../config/team';
import { PersonAvatar } from './PersonAvatar';
import { PublishSkillDialog } from './PublishSkillDialog';
import { SkillCard, SkillCardSkeleton } from './SkillCard';
import { relativeDate, shortDate } from './format';

interface MemberProfilePageProps {
  /** Login de GitHub de la persona. */
  login: string;
  onBack: () => void;
  backLabel?: string;
  onOpenSkill: (id: string) => void;
  onOpenInStudio?: (id: string) => void;
  onRequestLogin: () => void;
}

type SkillsState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; skills: CatalogSkill[] };

const FOCUS =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]';

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-800 bg-[#121722] px-4 py-3">
      <p className="m-0 font-mono text-[11px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mb-0 mt-1 truncate text-xl font-bold tabular-nums text-white">{value}</p>
      {hint && <p className="m-0 truncate text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function Meta({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <li className="inline-flex min-w-0 items-center gap-1.5 text-xs text-slate-400">
      <Icon className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden="true" />
      <span className="min-w-0 truncate">{children}</span>
    </li>
  );
}

/** Perfil de un integrante: su GitHub, lo que ha subido, sus números y su actividad reciente. */
export function MemberProfilePage({ login, onBack, backLabel = 'Skills del equipo', onOpenSkill, onOpenInStudio, onRequestLogin }: MemberProfilePageProps) {
  const { api, service, session } = useCatalog();
  const [profile, setProfile] = useState<GithubProfile | null | 'loading'>('loading');
  const [state, setState] = useState<SkillsState>({ status: 'loading' });
  const [reload, setReload] = useState(0);
  const [publishOpen, setPublishOpen] = useState(false);

  const load = useCallback(() => setReload((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setProfile('loading');
    service
      .getProfile(login)
      .then((p) => !cancelled && setProfile(p))
      .catch(() => !cancelled && setProfile(null));
    return () => {
      cancelled = true;
    };
  }, [service, login]);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    api
      .listSkills()
      .then((all) => {
        if (!cancelled) setState({ status: 'ready', skills: all });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({ status: 'error', message: err instanceof Error && err.message ? err.message : 'No se pudo cargar el catálogo.' });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [api, reload]);

  const all = state.status === 'ready' ? state.skills : [];
  const mine = useMemo(
    () =>
      all
        .filter((s) => s.uploadedBy.login.toLowerCase() === login.toLowerCase())
        .sort((a, b) => Date.parse(b.registeredAt) - Date.parse(a.registeredAt)),
    [all, login]
  );
  const stats = useMemo(() => computeMemberStats(all, login), [all, login]);

  const ready = profile !== 'loading' && profile !== null ? profile : null;
  const shownLogin = ready?.login ?? mine[0]?.uploadedBy.login ?? login;
  const avatarUrl = ready?.avatarUrl ?? mine[0]?.uploadedBy.avatarUrl;
  const own = session?.login.toLowerCase() === login.toLowerCase();
  const skillsRepo = stats.repos.find((r) => r.toLowerCase().startsWith(`${login.toLowerCase()}/`));

  return (
    <section
      aria-labelledby="member-heading"
      className="mx-auto w-full max-w-[1280px] min-w-0 space-y-6 px-4 py-8 text-slate-300 sm:px-6"
    >
      <button
        type="button"
        onClick={onBack}
        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border-0 bg-transparent px-1 py-1 text-sm font-medium text-[#38bdf8] hover:underline ${FOCUS}`}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {backLabel}
      </button>

      <header className="flex flex-wrap items-start gap-5 rounded-2xl border border-slate-800 bg-[#121722] p-5 sm:p-6">
        <PersonAvatar login={shownLogin} avatarUrl={avatarUrl} size={88} className="border-2" />
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <h1 id="member-heading" className="m-0 break-words text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {ready?.name ?? `@${shownLogin}`}
            </h1>
            <p className="m-0 mt-0.5 font-mono text-sm text-slate-400">
              <a
                href={ready?.profileUrl ?? `https://github.com/${shownLogin}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`rounded-sm hover:text-[#38bdf8] hover:underline ${FOCUS}`}
              >
                @{shownLogin}
              </a>
              {isTeamLogin(login) ? '' : ' · no forma parte del equipo'}
            </p>
          </div>

          {profile === 'loading' && <div aria-hidden="true" className="h-4 w-2/3 animate-pulse rounded bg-slate-800" />}
          {ready?.bio && <p className="m-0 max-w-[68ch] text-sm leading-relaxed text-slate-300">{ready.bio}</p>}

          {ready && (
            <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1.5 p-0">
              {ready.location && <Meta icon={MapPin}>{ready.location}</Meta>}
              {ready.company && <Meta icon={Building2}>{ready.company}</Meta>}
              {ready.website && (
                <Meta icon={Globe}>
                  <a href={ready.website} target="_blank" rel="noopener noreferrer" className="hover:text-[#38bdf8] hover:underline">
                    {ready.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  </a>
                </Meta>
              )}
              {ready.joinedAt && <Meta icon={CalendarDays}>En GitHub desde {new Date(ready.joinedAt).getFullYear()}</Meta>}
              <Meta icon={BookMarked}>{ready.publicRepos} {ready.publicRepos === 1 ? 'repo público' : 'repos públicos'}</Meta>
              <Meta icon={Users}>{ready.followers} {ready.followers === 1 ? 'seguidor' : 'seguidores'}</Meta>
            </ul>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <a
              href={ready?.profileUrl ?? `https://github.com/${shownLogin}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex h-9 items-center gap-2 rounded-full border border-slate-700 bg-transparent px-4 text-xs font-semibold text-slate-100 no-underline transition hover:border-[#0ea5e9] hover:text-[#38bdf8] ${FOCUS}`}
            >
              <Github className="h-4 w-4" aria-hidden="true" />
              Ver en GitHub
            </a>
            {skillsRepo && (
              <a
                href={`https://github.com/${skillsRepo}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex h-9 items-center gap-2 rounded-full border border-slate-700 bg-transparent px-4 text-xs font-semibold text-slate-100 no-underline transition hover:border-[#0ea5e9] hover:text-[#38bdf8] ${FOCUS}`}
              >
                <BookMarked className="h-4 w-4" aria-hidden="true" />
                {skillsRepo}
              </a>
            )}
            {own && (
              <button
                type="button"
                onClick={() => setPublishOpen(true)}
                className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border-0 bg-[#0ea5e9] px-4 text-xs font-semibold text-[#0a0d14] hover:bg-[#38bdf8] ${FOCUS}`}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Subir una skill
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="[display:grid] gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Skills subidas" value={state.status === 'ready' ? String(stats.skills) : '—'} />
        <Tile
          label="Categorías"
          value={state.status === 'ready' ? String(stats.categories.length) : '—'}
          hint={stats.categories.slice(0, 2).map((c) => c.name).join(' · ') || undefined}
        />
        <Tile label="Con scripts" value={state.status === 'ready' ? String(stats.withScripts) : '—'} />
        <Tile
          label="Última subida"
          value={stats.lastUploadAt ? relativeDate(stats.lastUploadAt) : '—'}
          hint={stats.lastUploadAt ? shortDate(stats.lastUploadAt) : undefined}
        />
      </div>

      {state.status === 'loading' && (
        <div role="status" aria-label="Cargando las skills">
          <p className="sr-only">Cargando las skills…</p>
          <ul className="m-0 [display:grid] list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <SkillCardSkeleton key={i} />
            ))}
          </ul>
        </div>
      )}

      {state.status === 'error' && (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl border border-rose-500/40 bg-rose-950/30 p-4 text-sm text-rose-200">
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
          <div>
            <h2 className="m-0 mb-3 text-lg font-bold tracking-tight text-white">
              Skills de <span className="font-mono">@{shownLogin}</span>
              <span className="ml-2 font-mono text-sm font-normal text-slate-500">{mine.length}</span>
            </h2>
            {mine.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-700 bg-[#121722] p-8 text-center">
                <p className="m-0 text-sm text-slate-300">@{shownLogin} todavía no subió skills.</p>
                {own && (
                  <button
                    type="button"
                    onClick={() => setPublishOpen(true)}
                    className={`mt-3 inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border-0 bg-[#0ea5e9] px-4 text-xs font-semibold text-[#0a0d14] hover:bg-[#38bdf8] ${FOCUS}`}
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Subir mi primera skill
                  </button>
                )}
              </div>
            ) : (
              <ul className="m-0 [display:grid] list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
                {mine.map((skill) => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    onOpen={() => onOpenSkill(skill.id)}
                    onOpenInStudio={onOpenInStudio ? () => onOpenInStudio(skill.id) : undefined}
                  />
                ))}
              </ul>
            )}
          </div>

          {mine.length > 0 && (
            <div>
              <h2 className="m-0 mb-3 text-lg font-bold tracking-tight text-white">Actividad reciente</h2>
              <ol className="m-0 list-none space-y-0 overflow-hidden rounded-xl border border-slate-800 bg-[#121722] p-0">
                {mine.slice(0, 5).map((s) => (
                  <li key={s.id} className="border-b border-slate-800/80 last:border-b-0">
                    <button
                      type="button"
                      onClick={() => onOpenSkill(s.id)}
                      className={`flex w-full cursor-pointer flex-wrap items-center gap-x-3 gap-y-0.5 border-0 bg-transparent px-4 py-3 text-left transition hover:bg-[#141b29] ${FOCUS}`}
                    >
                      <span className="text-sm text-slate-300">
                        Subió <span className="font-mono font-semibold text-white">{s.name}</span>
                      </span>
                      <span className="font-mono text-[11px] text-slate-500">{s.repo}</span>
                      <span className="ml-auto text-xs text-slate-500">{relativeDate(s.registeredAt)}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </>
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

export default MemberProfilePage;
