import { ArrowUpRight, FolderOpen, Scale, ShieldAlert } from 'lucide-react';
import type { CatalogSkill } from '../../types/catalog';
import { PersonAvatar } from './PersonAvatar';
import { safeHttpUrl } from './ResultsByModel';

interface SkillCardProps {
  skill: CatalogSkill;
  onOpen: () => void;
  /** Si se pasa, muestra "Abrir en estudio" (trae una copia de trabajo al navegador). */
  onOpenInStudio?: () => void;
}

const LINK =
  'relative z-10 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]';

function shortDate(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '';
  return new Date(t).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Tarjeta de una skill del catálogo. Muestra quién la subió (autor del Issue en GitHub) y
 * de qué repo viene. El título es el botón que cubre toda la tarjeta; los enlaces a GitHub
 * quedan por encima (`z-10`) para no anidar controles interactivos.
 */
export function SkillCard({ skill, onOpen, onOpenInStudio }: SkillCardProps) {
  const uploader = skill.uploadedBy;
  const profileUrl = safeHttpUrl(uploader.profileUrl);
  const when = shortDate(skill.registeredAt);

  return (
    <li className="min-w-0">
      <article className="group relative flex h-full min-w-0 flex-col gap-4 rounded-xl border border-slate-800 bg-[#121722] p-5 transition-colors hover:border-[#0ea5e9]/70 hover:bg-[#141b29] focus-within:border-[#0ea5e9]/70">
        <div className="flex items-center gap-2.5">
          <PersonAvatar login={uploader.login} avatarUrl={uploader.avatarUrl} />
          <div className="min-w-0 flex-1">
            <p className="m-0 truncate text-xs text-slate-400">
              Subida por{' '}
              {profileUrl ? (
                <a
                  href={profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${LINK} font-semibold text-slate-200 hover:underline`}
                >
                  @{uploader.login}
                </a>
              ) : (
                <span className="font-semibold text-slate-200">@{uploader.login}</span>
              )}
              {when && <span className="text-slate-500"> · {when}</span>}
            </p>
            <p className="m-0 truncate font-mono text-[11px] text-slate-500">
              Origen{' '}
              <a
                href={`https://github.com/${skill.repo}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`${LINK} hover:text-[#38bdf8] hover:underline`}
              >
                {skill.repo}
              </a>
            </p>
          </div>
          <ArrowUpRight
            className="h-4 w-4 shrink-0 text-slate-600 transition-colors group-hover:text-[#38bdf8]"
            aria-hidden="true"
          />
        </div>

        <div className="min-w-0">
          <button
            type="button"
            onClick={onOpen}
            className="m-0 w-full cursor-pointer break-words border-0 bg-transparent p-0 text-left font-mono text-base font-semibold leading-snug text-white after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
          >
            {skill.name}
          </button>
          <p lang="en" className="mb-0 mt-2 line-clamp-3 text-sm leading-relaxed text-slate-400">
            {skill.description || 'Sin descripción.'}
          </p>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-slate-800/80 pt-3 text-[11px]">
          <span className="rounded-full border border-[#0ea5e9]/35 bg-[#0ea5e9]/10 px-2.5 py-0.5 font-medium text-[#38bdf8]">
            {skill.category}
          </span>
          {skill.hasScripts && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/35 bg-amber-950/30 px-2.5 py-0.5 font-medium text-amber-300">
              <ShieldAlert className="h-3 w-3" aria-hidden="true" />
              Incluye scripts
            </span>
          )}
          {skill.license && (
            <span
              className={`${onOpenInStudio ? '' : 'ml-auto '}inline-flex items-center gap-1 font-mono text-slate-500`}
            >
              <Scale className="h-3 w-3" aria-hidden="true" />
              {skill.license}
            </span>
          )}
          {onOpenInStudio && (
            <button
              type="button"
              onClick={onOpenInStudio}
              aria-label={`Abrir ${skill.name} en estudio`}
              className={`${LINK} ml-auto inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-700 bg-transparent px-3 py-1 font-sans text-[11px] font-semibold text-slate-200 transition hover:border-[#0ea5e9] hover:text-[#38bdf8]`}
            >
              <FolderOpen className="h-3 w-3" aria-hidden="true" />
              Abrir en estudio
            </button>
          )}
        </div>
      </article>
    </li>
  );
}

/** Marcador de posición mientras carga la lista. */
export function SkillCardSkeleton() {
  return (
    <li aria-hidden="true" className="rounded-xl border border-slate-800 bg-[#121722] p-5">
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 animate-pulse rounded-full bg-slate-800" />
        <div className="h-3 w-28 animate-pulse rounded bg-slate-800" />
      </div>
      <div className="mt-5 h-4 w-2/3 animate-pulse rounded bg-slate-800" />
      <div className="mt-3 space-y-2">
        <div className="h-3 animate-pulse rounded bg-slate-800/80" />
        <div className="h-3 animate-pulse rounded bg-slate-800/80" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-slate-800/80" />
      </div>
    </li>
  );
}

export default SkillCard;
