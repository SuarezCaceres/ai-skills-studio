import type { ReactNode } from 'react';
import { ExternalLink, FileCode2, Loader2, Scale, Tag, ThumbsUp, TriangleAlert } from 'lucide-react';
import type { CatalogSkill, SkillVotes } from '../../types/catalog';
import { safeHttpUrl } from './ResultsByModel';

export interface SkillSidebarProps {
  skill: CatalogSkill;
  votes: SkillVotes | null;
  votesError?: string | null;
  voting?: boolean;
  /** `false` si no hay sesión: el botón pide iniciarla en lugar de votar. */
  canVote: boolean;
  onVote: () => void;
  /** Espacio reservado para el `AuditBadge` del WT3. */
  auditSlot?: ReactNode;
  /** Espacio reservado para el `InstallPanel` del WT3. */
  installSlot?: ReactNode;
  children?: ReactNode;
}

function Row({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
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

export function SkillSidebar({
  skill,
  votes,
  votesError,
  voting,
  canVote,
  onVote,
  auditSlot,
  installSlot,
  children,
}: SkillSidebarProps) {
  const repoUrl = safeHttpUrl(`https://github.com/${skill.repo}`);
  const voted = votes?.votedByMe ?? false;

  return (
    <aside aria-label="Ficha de la skill" className="min-w-0 space-y-4">
      <div className="rounded-xl border border-slate-800 bg-[#121722] p-4">
        <button
          type="button"
          onClick={onVote}
          disabled={voting || !votes}
          aria-pressed={canVote ? voted : undefined}
          className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38bdf8] disabled:cursor-not-allowed disabled:opacity-60 ${
            voted
              ? 'border-[#0ea5e9] bg-[#0ea5e9] text-[#0a0d14] hover:brightness-110'
              : 'border-slate-600 bg-transparent text-slate-100 hover:border-[#0ea5e9] hover:text-[#38bdf8]'
          }`}
        >
          {voting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <ThumbsUp className="h-4 w-4" aria-hidden="true" />
          )}
          {voted ? 'Votada' : 'Votar'}
          <span
            className="font-mono tabular-nums"
            aria-label={`${votes?.count ?? 0} votos`}
          >
            {votes ? votes.count : '–'}
          </span>
        </button>
        {!canVote && (
          <p className="mt-2 mb-0 text-center text-xs text-slate-500">
            Inicia sesión con GitHub para votar.
          </p>
        )}
        <p role="status" className="m-0 empty:hidden">
          {votesError && <span className="mt-2 block text-center text-xs text-rose-300">{votesError}</span>}
        </p>
      </div>

      {auditSlot}

      <dl className="m-0 divide-y divide-slate-800/80 rounded-xl border border-slate-800 bg-[#121722] px-4">
        <Row icon={<FileCode2 className="h-4 w-4" />} label="Repositorio">
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
        </Row>
        <Row icon={<Scale className="h-4 w-4" />} label="Licencia">
          {skill.license ?? <span className="text-slate-400">Sin licencia declarada</span>}
        </Row>
        <Row icon={<Tag className="h-4 w-4" />} label="Categoría">
          {skill.category}
        </Row>
        <Row icon={<TriangleAlert className="h-4 w-4" />} label="Trae scripts">
          {skill.hasScripts ? (
            <span className="inline-flex items-center rounded-full border border-amber-500/40 bg-amber-950/40 px-2 py-0.5 text-xs font-semibold text-amber-300">
              Sí, revisa antes de ejecutar
            </span>
          ) : (
            <span className="text-slate-300">No</span>
          )}
        </Row>
      </dl>

      {installSlot}
      {children}
    </aside>
  );
}
