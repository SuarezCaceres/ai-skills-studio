import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import { Github, Loader2, Send } from 'lucide-react';
import type { GithubSession, ResultVerdict, SkillResultReport } from '../../types/catalog';
import type { SpecificModelVersion } from '../../types/workspace';
import { AI_BENCHMARK_MODELS } from '../../data/aiModelsData';
import { VERDICT_META, safeHttpUrl } from './ResultsByModel';

export type ReportInput = Omit<SkillResultReport, 'id' | 'author' | 'createdAt' | 'issueUrl'>;

export interface ReportResultFormProps {
  skillId: string;
  /** Sesión de GitHub; sin ella el formulario queda bloqueado. */
  session: GithubSession | null;
  onRequestLogin?: () => void;
  onSubmit: (input: ReportInput) => Promise<unknown>;
}

const MAX_COMMENT = 1000;
const MODELS: SpecificModelVersion[] = AI_BENCHMARK_MODELS.map((m) => m.version);
const VERDICTS: ResultVerdict[] = ['worked', 'partial', 'failed'];

const fieldClass =
  'w-full rounded-lg border border-slate-700 bg-[#0a0d14] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:border-[#0ea5e9] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0ea5e9] disabled:cursor-not-allowed disabled:opacity-60';

export function ReportResultForm({
  skillId,
  session,
  onRequestLogin,
  onSubmit,
}: ReportResultFormProps) {
  const uid = useId();
  const [model, setModel] = useState<SpecificModelVersion>(MODELS[0]);
  const [verdict, setVerdict] = useState<ResultVerdict>('worked');
  const [comment, setComment] = useState('');
  const [evidence, setEvidence] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const evidenceInvalid = evidence.trim() !== '' && !safeHttpUrl(evidence);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!session || submitting) return;
    setSent(false);
    if (comment.trim().length < 5) {
      setError('Cuéntanos con unas palabras cómo te fue (mínimo 5 caracteres).');
      return;
    }
    if (evidenceInvalid) {
      setError('La evidencia debe ser una URL http(s) válida.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        skillId,
        model,
        verdict,
        comment: comment.trim(),
        evidenceUrl: safeHttpUrl(evidence) ?? undefined,
      });
      setComment('');
      setEvidence('');
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar el reporte.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      aria-labelledby={`${uid}-title`}
      className="rounded-xl border border-slate-800 bg-[#121722] p-4 sm:p-5"
    >
      <h2 id={`${uid}-title`} className="m-0 text-lg font-bold tracking-tight text-white">
        Reporta tu resultado
      </h2>
      <p className="mt-1 mb-4 text-[13px] text-slate-400">
        Tu reporte se publica como Issue en el repositorio del catálogo, con tu usuario de GitHub.
      </p>

      {!session && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-slate-700 bg-[#0a0d14] p-3 text-sm text-slate-300">
          <Github className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
          <span className="min-w-0 flex-1">Necesitas iniciar sesión con GitHub para reportar.</span>
          {onRequestLogin && (
            <button
              type="button"
              onClick={onRequestLogin}
              className="cursor-pointer rounded-full border-0 bg-[#0ea5e9] px-4 py-1.5 text-xs font-bold text-[#0a0d14] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38bdf8]"
            >
              Iniciar sesión
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="[display:grid] gap-4">
        <fieldset disabled={!session || submitting} className="m-0 [display:grid] min-w-0 gap-4 border-0 p-0">
          <div className="[display:grid] gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={`${uid}-model`} className="mb-1.5 block text-xs font-semibold text-slate-300">
                Modelo
              </label>
              <select
                id={`${uid}-model`}
                value={model}
                onChange={(e) => setModel(e.target.value as SpecificModelVersion)}
                className={fieldClass}
              >
                {MODELS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div role="radiogroup" aria-labelledby={`${uid}-verdict`}>
              <span id={`${uid}-verdict`} className="mb-1.5 block text-xs font-semibold text-slate-300">
                Veredicto
              </span>
              <div className="flex flex-wrap gap-2">
                {VERDICTS.map((v) => {
                  const meta = VERDICT_META[v];
                  const selected = verdict === v;
                  return (
                    <label
                      key={v}
                      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#0ea5e9] ${
                        selected
                          ? meta.chip
                          : 'border-slate-700 bg-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`${uid}-verdict`}
                        value={v}
                        checked={selected}
                        onChange={() => setVerdict(v)}
                        className="sr-only"
                      />
                      <meta.Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      {meta.label}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <label htmlFor={`${uid}-comment`} className="text-xs font-semibold text-slate-300">
                Comentario
              </label>
              <span className="font-mono text-[11px] tabular-nums text-slate-500">
                {comment.length}/{MAX_COMMENT}
              </span>
            </div>
            <textarea
              id={`${uid}-comment`}
              value={comment}
              maxLength={MAX_COMMENT}
              rows={4}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Qué pediste, qué obtuviste y qué ajustarías."
              className={`${fieldClass} resize-y`}
            />
          </div>

          <div>
            <label htmlFor={`${uid}-evidence`} className="mb-1.5 block text-xs font-semibold text-slate-300">
              Evidencia <span className="font-normal text-slate-500">(opcional)</span>
            </label>
            <input
              id={`${uid}-evidence`}
              type="url"
              inputMode="url"
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              placeholder="https://github.com/usuario/repo/pull/1"
              aria-invalid={evidenceInvalid}
              aria-describedby={evidenceInvalid ? `${uid}-evidence-err` : undefined}
              className={fieldClass}
            />
            {evidenceInvalid && (
              <p id={`${uid}-evidence-err`} className="mt-1 mb-0 text-xs text-rose-300">
                Usa una URL que empiece por https://
              </p>
            )}
          </div>
        </fieldset>

        <div aria-live="polite" className="min-h-5 text-sm">
          {error && (
            <p role="alert" className="m-0 text-rose-300">
              {error}
            </p>
          )}
          {sent && !error && <p className="m-0 text-emerald-300">Reporte enviado. Gracias.</p>}
        </div>

        <div>
          <button
            type="submit"
            disabled={!session || submitting}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border-0 bg-[#0ea5e9] px-5 py-2 text-sm font-bold text-[#0a0d14] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38bdf8] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
            {submitting ? 'Enviando…' : 'Enviar reporte'}
          </button>
        </div>
      </form>
    </section>
  );
}
