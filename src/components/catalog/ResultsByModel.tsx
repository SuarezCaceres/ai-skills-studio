import { useMemo } from 'react';
import { AlertCircle, CheckCircle2, CircleSlash, ExternalLink, MinusCircle } from 'lucide-react';
import type { ResultVerdict, SkillResultReport } from '../../types/catalog';
import type { SpecificModelVersion } from '../../types/workspace';

/**
 * Devuelve la URL solo si es http(s); cualquier otro esquema
 * (`javascript:`, `data:`, etc.) se descarta. Los datos del catálogo
 * vienen de terceros y nunca se enlazan sin pasar por aquí.
 */
export function safeHttpUrl(raw: string | undefined | null): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw.trim());
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

export const VERDICT_META: Record<
  ResultVerdict,
  { label: string; chip: string; Icon: typeof CheckCircle2 }
> = {
  worked: {
    label: 'Funcionó',
    chip: 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300',
    Icon: CheckCircle2,
  },
  partial: {
    label: 'Parcial',
    chip: 'border-amber-500/40 bg-amber-950/40 text-amber-300',
    Icon: MinusCircle,
  },
  failed: {
    label: 'No funcionó',
    chip: 'border-rose-500/40 bg-rose-950/40 text-rose-300',
    Icon: CircleSlash,
  },
};

const VERDICT_ORDER: ResultVerdict[] = ['worked', 'partial', 'failed'];

export function VerdictChip({ verdict }: { verdict: ResultVerdict }) {
  const { label, chip, Icon } = VERDICT_META[verdict];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${chip}`}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {label}
    </span>
  );
}

const dateFormat = new Intl.DateTimeFormat('es', { dateStyle: 'medium' });

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : dateFormat.format(d);
}

export interface ResultsByModelProps {
  results: SkillResultReport[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function ResultsByModel({ results, loading, error, onRetry }: ResultsByModelProps) {
  const groups = useMemo(() => {
    const map = new Map<SpecificModelVersion, SkillResultReport[]>();
    for (const r of results) {
      const list = map.get(r.model) ?? [];
      list.push(r);
      map.set(r.model, list);
    }
    return [...map.entries()]
      .map(([model, reports]) => ({
        model,
        reports: [...reports].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
        tally: VERDICT_ORDER.map((v) => ({
          verdict: v,
          count: reports.filter((r) => r.verdict === v).length,
        })),
      }))
      .sort((a, b) => b.reports.length - a.reports.length || a.model.localeCompare(b.model));
  }, [results]);

  return (
    <section aria-labelledby="results-heading" className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="results-heading" className="m-0 text-lg font-bold tracking-tight text-white">
          Resultados por modelo
        </h2>
        {!loading && !error && results.length > 0 && (
          <span className="font-mono text-xs tabular-nums text-slate-400">
            {results.length} {results.length === 1 ? 'reporte' : 'reportes'}
          </span>
        )}
      </div>

      {loading && (
        <div
          role="status"
          aria-label="Cargando resultados"
          className="[display:grid] gap-3 sm:grid-cols-2"
        >
          {[0, 1].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl border border-slate-800 bg-[#121722]" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded-xl border border-rose-500/40 bg-rose-950/30 p-4 text-sm text-rose-200"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1">{error}</span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="cursor-pointer rounded-lg border border-rose-400/50 bg-transparent px-3 py-1 text-xs font-semibold text-rose-100 hover:bg-rose-900/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]"
            >
              Reintentar
            </button>
          )}
        </div>
      )}

      {!loading && !error && groups.length === 0 && (
        <p className="m-0 rounded-xl border border-dashed border-slate-700 bg-[#121722] p-5 text-sm text-slate-400">
          Aún nadie ha reportado resultados. Sé la primera persona en contar cómo le fue con un
          modelo.
        </p>
      )}

      {!loading && !error && groups.length > 0 && (
        <ul className="m-0 [display:grid] list-none gap-4 p-0 sm:grid-cols-2">
          {groups.map(({ model, reports, tally }) => (
            <li
              key={model}
              className="flex min-w-0 flex-col gap-3 rounded-xl border border-slate-800 bg-[#121722] p-4 transition-transform duration-200 motion-safe:hover:-translate-y-0.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="m-0 font-mono text-sm font-bold text-[#38bdf8]">{model}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {tally
                    .filter((t) => t.count > 0)
                    .map((t) => (
                      <span
                        key={t.verdict}
                        className={`rounded-full border px-2 py-0.5 font-mono text-[11px] tabular-nums ${VERDICT_META[t.verdict].chip}`}
                        title={VERDICT_META[t.verdict].label}
                      >
                        {t.count} {VERDICT_META[t.verdict].label.toLowerCase()}
                      </span>
                    ))}
                </div>
              </div>

              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {reports.map((r) => {
                  const evidence = safeHttpUrl(r.evidenceUrl);
                  const issue = safeHttpUrl(r.issueUrl);
                  return (
                    <li
                      key={r.id}
                      className="space-y-1.5 border-t border-slate-800/80 pt-3 first:border-t-0 first:pt-0"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <VerdictChip verdict={r.verdict} />
                        <span className="text-xs text-slate-300">@{r.author.login}</span>
                        <span className="text-xs text-slate-500">{formatDate(r.createdAt)}</span>
                      </div>
                      {r.comment && (
                        <p className="m-0 break-words text-[13px] leading-relaxed text-slate-300">
                          {r.comment}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                        {evidence && (
                          <a
                            href={evidence}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            className="inline-flex items-center gap-1 text-[#38bdf8] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]"
                          >
                            Evidencia
                            <ExternalLink className="h-3 w-3" aria-hidden="true" />
                            <span className="sr-only">(se abre en una pestaña nueva)</span>
                          </a>
                        )}
                        {issue && (
                          <a
                            href={issue}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            className="inline-flex items-center gap-1 text-slate-400 underline-offset-2 hover:text-slate-200 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]"
                          >
                            Issue en GitHub
                            <ExternalLink className="h-3 w-3" aria-hidden="true" />
                            <span className="sr-only">(se abre en una pestaña nueva)</span>
                          </a>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
