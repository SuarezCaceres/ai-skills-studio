import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Github, Plus, Search, Users, X } from 'lucide-react';
import { useCatalog } from '../../hooks/useCatalog';
import type { GithubProfile } from '../../services/githubCatalogService';
import type { CatalogSkill } from '../../types/catalog';
import { TEAM_LOGINS, isTeamLogin } from '../../config/team';
import { PersonAvatar } from './PersonAvatar';
import { PublishSkillDialog } from './PublishSkillDialog';
import { SkillCard, SkillCardSkeleton } from './SkillCard';

interface TeamSkillsPageProps {
  /** Abre la página de detalle de la skill. */
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

const FOCUS =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]';

function relativeDate(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '—';
  const days = Math.floor((Date.now() - t) / 86_400_000);
  if (days <= 0) return 'hoy';
  if (days === 1) return 'ayer';
  if (days < 30) return `hace ${days} días`;
  const months = Math.floor(days / 30);
  return months === 1 ? 'hace 1 mes' : `hace ${months} meses`;
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-800 bg-[#121722] px-4 py-3">
      <p className="m-0 font-mono text-[11px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mb-0 mt-1 truncate text-xl font-bold tabular-nums text-white">{value}</p>
      {hint && <p className="m-0 truncate text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

/**
 * Interfaz del equipo: las skills cuyo Issue ancla abrió alguna de las cuentas de
 * `TEAM_LOGINS`, con quién la subió, su GitHub y el repo de origen.
 */
export function TeamSkillsPage({ onOpenSkill, onRequestLogin, onOpenInStudio }: TeamSkillsPageProps) {
  const { api, service, session } = useCatalog();
  const [state, setState] = useState<ListState>({ status: 'loading' });
  const [profiles, setProfiles] = useState<Record<string, GithubProfile | null>>({});
  const [reload, setReload] = useState(0);
  const [publishOpen, setPublishOpen] = useState(false);
  const [member, setMember] = useState<string>('todos');
  const [query, setQuery] = useState('');

  const load = useCallback(() => setReload((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    api
      .listSkills()
      .then((all) => {
        if (!cancelled) setState({ status: 'ready', skills: all.filter((s) => isTeamLogin(s.uploadedBy.login)) });
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

  // Perfiles (avatar y nombre) de los integrantes; si fallan, se usa lo que traen las skills.
  useEffect(() => {
    let cancelled = false;
    Promise.all(TEAM_LOGINS.map((login) => service.getProfile(login).catch(() => null))).then((list) => {
      if (cancelled) return;
      setProfiles(Object.fromEntries(TEAM_LOGINS.map((login, i) => [login.toLowerCase(), list[i]])));
    });
    return () => {
      cancelled = true;
    };
  }, [service]);

  const skills = state.status === 'ready' ? state.skills : [];

  const members = useMemo(
    () =>
      TEAM_LOGINS.map((login) => {
        const key = login.toLowerCase();
        const mine = skills.filter((s) => s.uploadedBy.login.toLowerCase() === key);
        const fromSkill = mine[0]?.uploadedBy;
        const profile = profiles[key];
        return {
          login: profile?.login ?? fromSkill?.login ?? login,
          key,
          name: profile?.name ?? null,
          avatarUrl: profile?.avatarUrl ?? fromSkill?.avatarUrl,
          count: mine.length,
        };
      }),
    [skills, profiles]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return skills
      .filter((s) => member === 'todos' || s.uploadedBy.login.toLowerCase() === member)
      .filter(
        (s) =>
          !q ||
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.repo.toLowerCase().includes(q) ||
          s.uploadedBy.login.toLowerCase().includes(q)
      )
      .sort((a, b) => Date.parse(b.registeredAt) - Date.parse(a.registeredAt));
  }, [skills, member, query]);

  const latest = useMemo(
    () => [...skills].sort((a, b) => Date.parse(b.registeredAt) - Date.parse(a.registeredAt))[0],
    [skills]
  );

  const filtering = member !== 'todos' || query.trim() !== '';

  return (
    <section
      aria-labelledby="team-heading"
      className="mx-auto w-full max-w-[1280px] min-w-0 space-y-6 px-4 py-8 text-slate-300 sm:px-6"
    >
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-2xl space-y-2">
          <p className="m-0 flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#38bdf8]">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            Interfaz del equipo
          </p>
          <h1 id="team-heading" className="m-0 text-3xl font-bold tracking-tight text-white">
            Skills del equipo
          </h1>
          <p className="m-0 text-sm leading-relaxed text-slate-400">
            Lo que ha subido cada integrante, con su cuenta de GitHub y el repo de donde viene. Se registran con la
            URL de un repo que tenga un <code className="font-mono text-slate-300">SKILL.md</code>.
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
            Subir una skill
          </button>
        </div>
      </header>

      <div className="[display:grid] gap-3 sm:grid-cols-3">
        <Stat label="Skills" value={state.status === 'ready' ? String(skills.length) : '—'} />
        <Stat label="Integrantes" value={String(TEAM_LOGINS.length)} hint={`${members.filter((m) => m.count > 0).length} con skills subidas`} />
        <Stat
          label="Última subida"
          value={latest ? relativeDate(latest.registeredAt) : '—'}
          hint={latest ? `${latest.name} · @${latest.uploadedBy.login}` : undefined}
        />
      </div>

      <div className="space-y-3 rounded-xl border border-slate-800 bg-[#121722] p-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            aria-hidden="true"
          />
          <input
            id="team-search-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, descripción, repo o integrante…"
            aria-label="Buscar en las skills del equipo"
            className="h-10 w-full rounded-lg border border-slate-800 bg-[#0a0d14] pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#0ea5e9]"
          />
        </div>

        <div role="group" aria-label="Integrantes del equipo" className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            aria-pressed={member === 'todos'}
            onClick={() => setMember('todos')}
            className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-xs font-medium transition ${FOCUS} ${
              member === 'todos'
                ? 'border-[#0ea5e9] bg-[#0ea5e9] text-[#0a0d14]'
                : 'border-slate-800 bg-[#0a0d14] text-slate-300 hover:border-slate-600'
            }`}
          >
            Todo el equipo
            <span className={`font-mono tabular-nums ${member === 'todos' ? 'text-[#0a0d14]/70' : 'text-slate-500'}`}>
              {skills.length}
            </span>
          </button>
          {members.map((m) => {
            const active = member === m.key;
            return (
              <button
                key={m.key}
                type="button"
                aria-pressed={active}
                onClick={() => setMember(m.key)}
                title={m.name ?? undefined}
                className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border pl-1.5 pr-3.5 text-xs font-medium transition ${FOCUS} ${
                  active
                    ? 'border-[#0ea5e9] bg-[#0ea5e9] text-[#0a0d14]'
                    : 'border-slate-800 bg-[#0a0d14] text-slate-300 hover:border-slate-600'
                }`}
              >
                <PersonAvatar login={m.login} avatarUrl={m.avatarUrl} size={24} />@{m.login}
                <span className={`font-mono tabular-nums ${active ? 'text-[#0a0d14]/70' : 'text-slate-500'}`}>
                  {m.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {state.status === 'loading' && (
        <div role="status" aria-label="Cargando las skills del equipo">
          <p className="sr-only">Cargando las skills del equipo…</p>
          <ul className="m-0 [display:grid] list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
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
              <p className="m-0 text-sm text-slate-300">Nadie del equipo ha subido skills todavía.</p>
              <p className="mx-0 mb-4 mt-1 text-xs text-slate-500">
                Sube la primera pegando la URL de un repo de GitHub con un SKILL.md.
              </p>
              <button
                type="button"
                onClick={() => setPublishOpen(true)}
                className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border-0 bg-[#0ea5e9] px-4 text-xs font-semibold text-[#0a0d14] hover:bg-[#38bdf8] ${FOCUS}`}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Subir una skill
              </button>
            </div>
          ) : visible.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 bg-[#121722] p-10 text-center">
              <p className="m-0 text-sm text-slate-300">Ninguna skill coincide con el filtro.</p>
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setMember('todos');
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

      <PublishSkillDialog
        open={publishOpen}
        session={session}
        onClose={() => setPublishOpen(false)}
        onRequestLogin={onRequestLogin}
        onRegister={(url) => api.registerSkillFromUrl(url)}
        onRegistered={(created) => {
          load();
          onOpenSkill(created.id);
        }}
      />
    </section>
  );
}

export default TeamSkillsPage;
