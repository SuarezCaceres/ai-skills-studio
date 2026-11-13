import { useCallback, useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import type { CatalogApi, CatalogSkill, SkillAuthor } from '../../types/catalog';

export interface MoreFromAuthorProps {
  author: SkillAuthor;
  /** Skill actual; se excluye de la lista. */
  currentSkillId: string;
  api: Pick<CatalogApi, 'listSkillsByAuthor'>;
  onSelect: (skillId: string) => void;
}

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; skills: CatalogSkill[] };

export function MoreFromAuthor({ author, currentSkillId, api, onSelect }: MoreFromAuthorProps) {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    api
      .listSkillsByAuthor(author.login)
      .then((skills) => {
        if (!cancelled) setState({ status: 'ready', skills });
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setState({
            status: 'error',
            message: err instanceof Error ? err.message : 'No se pudieron cargar las skills del autor.',
          });
      });
    return () => {
      cancelled = true;
    };
  }, [api, author.login, attempt]);

  const others =
    state.status === 'ready' ? state.skills.filter((s) => s.id !== currentSkillId) : [];

  // Sin otras skills no hay nada que mostrar: se omite la sección entera.
  if (state.status === 'ready' && others.length === 0) return null;

  return (
    <section aria-labelledby="more-author-heading" className="space-y-3">
      <h2 id="more-author-heading" className="m-0 text-lg font-bold tracking-tight text-white">
        Más de @{author.login}
      </h2>

      {state.status === 'loading' && (
        <div role="status" aria-label="Cargando skills del autor" className="[display:grid] gap-3 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl border border-slate-800 bg-[#121722]" />
          ))}
        </div>
      )}

      {state.status === 'error' && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 text-sm text-rose-200"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1">{state.message}</span>
          <button
            type="button"
            onClick={retry}
            className="cursor-pointer rounded-lg border border-rose-400/50 bg-transparent px-3 py-1 text-xs font-semibold text-rose-100 hover:bg-rose-900/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]"
          >
            Reintentar
          </button>
        </div>
      )}

      {state.status === 'ready' && (
        <ul className="m-0 [display:grid] list-none gap-3 p-0 sm:grid-cols-2">
          {others.map((s) => (
            <li key={s.id} className="min-w-0">
              <button
                type="button"
                onClick={() => onSelect(s.id)}
                className="flex h-full w-full min-w-0 cursor-pointer flex-col items-start gap-1 rounded-xl border border-slate-800 bg-[#121722] p-4 text-left transition duration-200 hover:border-[#0ea5e9]/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9] motion-safe:hover:-translate-y-0.5"
              >
                <span className="max-w-full truncate font-mono text-sm font-bold text-[#38bdf8]">
                  {s.name}
                </span>
                <span lang="en" className="line-clamp-2 text-[13px] leading-snug text-slate-400">
                  {s.description}
                </span>
                <span className="mt-1 rounded-full border border-slate-700 px-2 py-0.5 text-[11px] text-slate-400">
                  {s.category}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
