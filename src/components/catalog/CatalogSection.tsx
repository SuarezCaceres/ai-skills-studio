import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, ChevronRight, Loader2, Plus, ShieldAlert, Users } from 'lucide-react';
import { useCatalog } from '../../hooks/useCatalog';
import type { CatalogSkill } from '../../types/catalog';
import { PublishSkillDialog } from './PublishSkillDialog';

interface CatalogSectionProps {
  /** Abre la página de detalle de la skill del catálogo. */
  onOpenSkill: (id: string) => void;
  /** Abre la pantalla de acceso (inicio de sesión con GitHub). */
  onRequestLogin: () => void;
}

type ListState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; skills: CatalogSkill[] };

/**
 * Catálogo comunitario dentro de la bóveda: lista las skills registradas en el
 * repo catálogo de GitHub y permite abrir su detalle o publicar una nueva.
 */
export function CatalogSection({ onOpenSkill, onRequestLogin }: CatalogSectionProps) {
  const { api, session } = useCatalog();
  const [state, setState] = useState<ListState>({ status: 'loading' });
  const [reload, setReload] = useState(0);
  const [publishOpen, setPublishOpen] = useState(false);

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

  return (
    <section aria-labelledby="catalog-heading" className="rounded-lg border border-slate-800 bg-[#121722] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-[#38bdf8]" aria-hidden="true" />
          <h2 id="catalog-heading" className="m-0 text-sm font-semibold text-white">
            Catálogo de la comunidad
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setPublishOpen(true)}
          className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-slate-700 bg-transparent px-3 text-xs font-medium text-slate-200 transition hover:border-[#0ea5e9] hover:text-[#38bdf8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Publicar una skill
        </button>
      </div>

      <div className="mt-3">
        {state.status === 'loading' && (
          <p role="status" className="m-0 flex items-center gap-2 text-xs text-slate-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            Cargando el catálogo…
          </p>
        )}

        {state.status === 'error' && (
          <div
            role="alert"
            className="flex flex-wrap items-center gap-3 rounded-md border border-rose-500/40 bg-rose-950/30 p-3 text-xs text-rose-200"
          >
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0 flex-1">{state.message}</span>
            <button
              type="button"
              onClick={load}
              className="cursor-pointer rounded-md border border-rose-400/50 bg-transparent px-3 py-1 text-xs font-semibold text-rose-100 hover:bg-rose-900/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]"
            >
              Reintentar
            </button>
          </div>
        )}

        {state.status === 'ready' && state.skills.length === 0 && (
          <p className="m-0 text-xs text-slate-400">
            Todavía no hay skills en el catálogo. Publica la primera pegando la URL de un repo de GitHub.
          </p>
        )}

        {state.status === 'ready' && state.skills.length > 0 && (
          <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {state.skills.map((skill) => {
              return (
                <li key={skill.id} className="min-w-0">
                  <button
                    type="button"
                    onClick={() => onOpenSkill(skill.id)}
                    className="flex w-full min-w-0 cursor-pointer items-start gap-2 rounded-md border border-slate-800 bg-[#0a0d14] p-3 text-left transition hover:border-[#0ea5e9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-mono text-sm font-semibold text-white">{skill.name}</span>
                      <span lang="en" className="mt-1 line-clamp-2 block text-xs text-slate-400">
                        {skill.description}
                      </span>
                      <span className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                        <span>@{skill.author.login}</span>
                        {/* La lista solo trae la instantánea: la auditoría completa está en el detalle. */}
                        {skill.hasScripts && (
                          <span className="inline-flex items-center gap-1 text-amber-300">
                            <ShieldAlert className="h-3 w-3" aria-hidden="true" />
                            Incluye scripts
                          </span>
                        )}
                      </span>
                    </span>
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

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

export default CatalogSection;
