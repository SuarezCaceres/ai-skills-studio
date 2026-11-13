import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { Github, Loader2, X } from 'lucide-react';
import type { CatalogSkill, GithubSession } from '../../types/catalog';

export interface PublishSkillDialogProps {
  open: boolean;
  session: GithubSession | null;
  onClose: () => void;
  onRequestLogin?: () => void;
  /** Normalmente `api.registerSkillFromUrl`. */
  onRegister: (repoUrl: string) => Promise<CatalogSkill>;
  onRegistered: (skill: CatalogSkill) => void;
}

/** Valida en cliente que la URL sea de un repo de github.com (https). */
export function validateRepoUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value) return 'Pega la URL de tu repositorio.';
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return 'La URL no es válida.';
  }
  if (url.protocol !== 'https:' || url.hostname !== 'github.com') {
    return 'Solo se admiten repositorios de https://github.com.';
  }
  const parts = url.pathname.split('/').filter(Boolean);
  if (parts.length < 2) return 'La URL debe incluir usuario y repositorio.';
  return null;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function PublishSkillDialog({
  open,
  session,
  onClose,
  onRequestLogin,
  onRegister,
  onRegistered,
}: PublishSkillDialogProps) {
  const uid = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Foco inicial y restauración al cerrar.
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const t = setTimeout(
      () => (inputRef.current ?? dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE))?.focus(),
      0
    );
    return () => {
      clearTimeout(t);
      previous?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape' && !submitting) {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== 'Tab') return;
    const items = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!session || submitting) return;
    const problem = validateRepoUrl(url);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const skill = await onRegister(url.trim());
      setUrl('');
      onRegistered(skill);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar la skill.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[#0a0d14]/80 p-0 sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-title`}
        aria-describedby={`${uid}-desc`}
        onKeyDown={handleKeyDown}
        className="max-h-[92svh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-slate-700 bg-[#121722] p-5 shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={`${uid}-title`} className="m-0 text-lg font-bold tracking-tight text-white">
            Publicar una skill
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Cerrar"
            className="-mt-1 -mr-1 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-slate-400 hover:bg-slate-800 hover:text-white focus-visible:outline-2 focus-visible:outline-[#0ea5e9] disabled:opacity-50"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <p id={`${uid}-desc`} className="mt-1 mb-4 text-[13px] leading-relaxed text-slate-400">
          Pega la URL del repositorio de GitHub (o de la carpeta de la skill) que contiene un{' '}
          <code className="font-mono text-slate-300">SKILL.md</code>. Se lee su contenido público; no
          se ejecuta nada.
        </p>

        {!session && (
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-slate-700 bg-[#0a0d14] p-3 text-sm text-slate-300">
            <Github className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            <span className="min-w-0 flex-1">Necesitas iniciar sesión con GitHub.</span>
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

        <form onSubmit={handleSubmit} noValidate className="[display:grid] gap-3">
          <div>
            <label htmlFor={`${uid}-url`} className="mb-1.5 block text-xs font-semibold text-slate-300">
              URL del repositorio
            </label>
            <input
              ref={inputRef}
              id={`${uid}-url`}
              type="url"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              value={url}
              disabled={!session || submitting}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/usuario/repo"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${uid}-err` : undefined}
              className="w-full rounded-lg border border-slate-700 bg-[#0a0d14] px-3 py-2 font-mono text-sm text-slate-100 placeholder:text-slate-500 focus-visible:border-[#0ea5e9] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0ea5e9] disabled:cursor-not-allowed disabled:opacity-60"
            />
            <div aria-live="polite">
              {error && (
                <p id={`${uid}-err`} role="alert" className="mt-1.5 mb-0 text-xs text-rose-300">
                  {error}
                </p>
              )}
            </div>
          </div>

          <div className="mt-1 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="cursor-pointer rounded-full border border-slate-600 bg-transparent px-4 py-2 text-sm font-semibold text-slate-200 hover:border-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9] disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!session || submitting}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border-0 bg-[#0ea5e9] px-5 py-2 text-sm font-bold text-[#0a0d14] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38bdf8] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {submitting ? 'Registrando…' : 'Registrar skill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
