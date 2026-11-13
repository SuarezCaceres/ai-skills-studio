import { useEffect, useId, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react';
import { AlertTriangle, FileText, FolderUp, Github, Loader2, Pencil, X } from 'lucide-react';
import type { CatalogSkill, GithubSession, LocalSkillBundle, PublishProgress } from '../../types/catalog';
import {
  UPLOAD_LIMITS,
  buildSkillMd,
  checkSkillText,
  isValidSlug,
  readLocalSkill,
  slugify,
  utf8ToBase64,
  type LocalSkillDraft,
} from '../../services/skillUploadService';
import { SafeMarkdown } from './SafeMarkdown';

export interface PublishSkillDialogProps {
  open: boolean;
  session: GithubSession | null;
  onClose: () => void;
  onRequestLogin?: () => void;
  /** Normalmente `api.registerSkillFromUrl`. */
  onRegister: (repoUrl: string) => Promise<CatalogSkill>;
  /**
   * Si se pasa, aparece la pestaña "Desde mi equipo": sube un `.md` o una carpeta al repo
   * `<login>/codice-skills` de la persona y la registra. Normalmente `api.publishLocalSkill`.
   */
  onPublishLocal?: (bundle: LocalSkillBundle, onProgress: (p: PublishProgress) => void) => Promise<CatalogSkill>;
  onRegistered: (skill: CatalogSkill) => void;
}

type Mode = 'url' | 'local' | 'write';

const DEFAULT_BODY = `# Título de la skill

## Cuándo usarla
Describe en una o dos frases cuándo debe activarse esta skill.

## Instrucciones
1. Primer paso.
2. Segundo paso.
`;

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

const FOCUS =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]';

const kb = (bytes: number): string => (bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(bytes < 10_240 ? 1 : 0)} KB`);

export function PublishSkillDialog({
  open,
  session,
  onClose,
  onRequestLogin,
  onRegister,
  onPublishLocal,
  onRegistered,
}: PublishSkillDialogProps) {
  const uid = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>('url');
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Pestaña "Desde mi equipo"
  const [reading, setReading] = useState(false);
  const [draft, setDraft] = useState<LocalSkillDraft | null>(null);
  const [slug, setSlug] = useState('');
  const [ack, setAck] = useState(false);
  const [progress, setProgress] = useState<PublishProgress | null>(null);

  // Pestaña "Escribir aquí"
  const [wName, setWName] = useState('');
  const [wDesc, setWDesc] = useState('');
  const [wBody, setWBody] = useState(DEFAULT_BODY);
  const [wPreview, setWPreview] = useState(false);
  const [wAck, setWAck] = useState(false);

  const canLocal = Boolean(onPublishLocal);
  const busy = submitting || reading;

  const resetLocal = () => {
    setDraft(null);
    setSlug('');
    setAck(false);
    setProgress(null);
  };

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

  // Al cerrar se descarta lo que se había elegido.
  useEffect(() => {
    if (open) return;
    setMode('url');
    setError(null);
    resetLocal();
    setWName('');
    setWDesc('');
    setWBody(DEFAULT_BODY);
    setWPreview(false);
    setWAck(false);
  }, [open]);

  if (!open) return null;

  const switchMode = (next: Mode) => {
    if (busy || next === mode) return;
    setMode(next);
    setError(null);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape' && !busy) {
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

  const handleSubmitUrl = async (e: FormEvent) => {
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

  const handlePick = async (e: ChangeEvent<HTMLInputElement>) => {
    const chosen = Array.from(e.target.files ?? []);
    e.target.value = ''; // permite volver a elegir lo mismo
    if (chosen.length === 0) return;
    setError(null);
    resetLocal();
    setReading(true);
    try {
      const result = await readLocalSkill(
        chosen.map((file) => ({ file, relativePath: file.webkitRelativePath || file.name }))
      );
      setDraft(result);
      setSlug(result.suggestedSlug);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo leer la selección.');
    } finally {
      setReading(false);
    }
  };

  const slugProblem = !slug ? 'Escribe un nombre.' : !isValidSlug(slug) ? 'Usa solo minúsculas, números y guiones.' : null;

  const handleSubmitLocal = async (e: FormEvent) => {
    e.preventDefault();
    if (!session || !draft || !onPublishLocal || submitting || slugProblem || !ack) return;
    setError(null);
    setSubmitting(true);
    setProgress({ step: 'repo', message: 'Empezando…' });
    try {
      const skill = await onPublishLocal({ slug, files: draft.files }, setProgress);
      resetLocal();
      onRegistered(skill);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir la skill.');
    } finally {
      setSubmitting(false);
      setProgress(null);
    }
  };

  const writeSlug = slugify(wName);
  const writeMd = buildSkillMd({ name: writeSlug, description: wDesc, body: wBody });
  const writeProblem = !writeSlug
    ? 'Escribe un nombre para la skill.'
    : !wDesc.trim()
      ? 'Escribe una descripción corta.'
      : !wBody.trim()
        ? 'Escribe el contenido de la skill.'
        : (checkSkillText(writeMd).errors[0] ?? null);

  const handleSubmitWrite = async (e: FormEvent) => {
    e.preventDefault();
    if (!session || !onPublishLocal || submitting || writeProblem || !wAck) return;
    setError(null);
    setSubmitting(true);
    setProgress({ step: 'repo', message: 'Empezando…' });
    try {
      const skill = await onPublishLocal(
        {
          slug: writeSlug,
          files: [{ path: 'SKILL.md', sizeBytes: new TextEncoder().encode(writeMd).length, base64: utf8ToBase64(writeMd) }],
        },
        setProgress
      );
      onRegistered(skill);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir la skill.');
    } finally {
      setSubmitting(false);
      setProgress(null);
    }
  };

  const target = session ? `github.com/${session.login}/codice-skills/skills/${slug || '…'}` : '';
  const writeTarget = session ? `github.com/${session.login}/codice-skills/skills/${writeSlug || '…'}` : '';

  const tabClass = (active: boolean) =>
    `-mb-px inline-flex cursor-pointer items-center gap-2 border-0 border-b-2 bg-transparent px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS} ${
      active ? 'border-b-[#0ea5e9] text-white' : 'border-b-transparent text-slate-400 hover:text-slate-200'
    }`;

  const errorBlock = (
    <div aria-live="polite">
      {error && (
        <p id={`${uid}-err`} role="alert" className="mt-1.5 mb-0 text-xs text-rose-300">
          {error}
        </p>
      )}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[#0a0d14]/80 p-0 sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-title`}
        aria-describedby={`${uid}-desc`}
        onKeyDown={handleKeyDown}
        className="max-h-[92svh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-slate-700 bg-[#121722] p-5 shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={`${uid}-title`} className="m-0 text-lg font-bold tracking-tight text-white">
            Subir una skill
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Cerrar"
            className={`-mt-1 -mr-1 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-50 ${FOCUS}`}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {canLocal && (
          <div role="tablist" aria-label="Origen de la skill" className="mt-3 flex gap-1 border-b border-slate-800">
            <button type="button" role="tab" aria-selected={mode === 'url'} disabled={busy} onClick={() => switchMode('url')} className={tabClass(mode === 'url')}>
              <Github className="h-4 w-4" aria-hidden="true" />
              Desde una URL de GitHub
            </button>
            <button type="button" role="tab" aria-selected={mode === 'local'} disabled={busy} onClick={() => switchMode('local')} className={tabClass(mode === 'local')}>
              <FolderUp className="h-4 w-4" aria-hidden="true" />
              Desde mi equipo
            </button>
            <button type="button" role="tab" aria-selected={mode === 'write'} disabled={busy} onClick={() => switchMode('write')} className={tabClass(mode === 'write')}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Escribir aquí
            </button>
          </div>
        )}

        <p id={`${uid}-desc`} className="mt-3 mb-4 text-[13px] leading-relaxed text-slate-400">
          {mode === 'url' ? (
            <>
              Pega la URL del repositorio de GitHub (o de la carpeta de la skill) que contiene un{' '}
              <code className="font-mono text-slate-300">SKILL.md</code>. Se lee su contenido público; no se ejecuta nada.
            </>
          ) : mode === 'write' ? (
            <>
              Escribe la skill aquí mismo. Se guarda como <code className="font-mono text-slate-300">SKILL.md</code> en un repositorio{' '}
              <strong className="text-slate-200">público</strong> de tu cuenta y se registra en el catálogo.
            </>
          ) : (
            <>
              Elige un <code className="font-mono text-slate-300">.md</code> o la carpeta de tu skill (con su{' '}
              <code className="font-mono text-slate-300">SKILL.md</code>). Se sube a un repositorio <strong className="text-slate-200">público</strong> de tu
              cuenta y se registra en el catálogo.
            </>
          )}
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

        {mode === 'url' && (
          <form onSubmit={handleSubmitUrl} noValidate className="[display:grid] gap-3">
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
              {errorBlock}
            </div>

            <div className="mt-1 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className={`cursor-pointer rounded-full border border-slate-600 bg-transparent px-4 py-2 text-sm font-semibold text-slate-200 hover:border-slate-400 disabled:opacity-50 ${FOCUS}`}
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
        )}

        {mode === 'write' && (
          <form onSubmit={handleSubmitWrite} noValidate className="[display:grid] gap-3">
            <div>
              <label htmlFor={`${uid}-wname`} className="mb-1.5 block text-xs font-semibold text-slate-300">
                Nombre de la skill
              </label>
              <input
                ref={inputRef}
                id={`${uid}-wname`}
                type="text"
                autoComplete="off"
                spellCheck={false}
                value={wName}
                disabled={!session || submitting}
                onChange={(e) => setWName(e.target.value)}
                placeholder="mi-skill-genial"
                className="w-full rounded-lg border border-slate-700 bg-[#0a0d14] px-3 py-2 font-mono text-sm text-slate-100 placeholder:text-slate-500 focus-visible:border-[#0ea5e9] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0ea5e9] disabled:opacity-60"
              />
              <p className="m-0 mt-1.5 break-all font-mono text-[11px] text-slate-500">{writeTarget}</p>
            </div>

            <div>
              <label htmlFor={`${uid}-wdesc`} className="mb-1.5 block text-xs font-semibold text-slate-300">
                Descripción (la verá la gente en la tarjeta)
              </label>
              <textarea
                id={`${uid}-wdesc`}
                value={wDesc}
                rows={2}
                maxLength={300}
                disabled={!session || submitting}
                onChange={(e) => setWDesc(e.target.value)}
                className="w-full resize-y rounded-lg border border-slate-700 bg-[#0a0d14] px-3 py-2 text-sm text-slate-100 focus-visible:border-[#0ea5e9] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0ea5e9] disabled:opacity-60"
              />
            </div>

            <div>
              <div role="tablist" aria-label="Modo del contenido" className="mb-2 flex gap-1 border-b border-slate-800">
                {(['Escribir', 'Vista previa'] as const).map((label) => {
                  const active = (label === 'Vista previa') === wPreview;
                  return (
                    <button
                      key={label}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setWPreview(label === 'Vista previa')}
                      className={`-mb-px cursor-pointer border-0 border-b-2 bg-transparent px-3 py-1.5 text-xs font-semibold ${FOCUS} ${
                        active ? 'border-b-[#0ea5e9] text-white' : 'border-b-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              {wPreview ? (
                <article lang="es" aria-label="Vista previa del contenido" className="min-h-[180px] rounded-lg border border-slate-800 bg-[#0a0d14] p-3">
                  <SafeMarkdown source={writeMd} />
                </article>
              ) : (
                <>
                  <label htmlFor={`${uid}-wbody`} className="sr-only">
                    Contenido de la skill
                  </label>
                  <textarea
                    id={`${uid}-wbody`}
                    value={wBody}
                    rows={10}
                    disabled={!session || submitting}
                    spellCheck={false}
                    onChange={(e) => setWBody(e.target.value)}
                    className="block min-h-[180px] w-full resize-y rounded-lg border border-slate-700 bg-[#0a0d14] p-3 font-mono text-[13px] leading-relaxed text-slate-100 focus-visible:border-[#0ea5e9] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0ea5e9] disabled:opacity-60"
                  />
                </>
              )}
            </div>

            {writeProblem && wName.trim() !== '' && (
              <p role="alert" className="m-0 flex items-start gap-2 text-xs text-amber-300">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{writeProblem}</span>
              </p>
            )}
            {errorBlock}

            <label className="flex cursor-pointer items-start gap-2 text-xs leading-relaxed text-slate-300">
              <input
                type="checkbox"
                checked={wAck}
                disabled={submitting}
                onChange={(e) => setWAck(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[#0ea5e9]"
              />
              <span>
                Entiendo que se publicará en un repositorio <strong className="text-slate-100">público</strong> de mi cuenta de GitHub
                {session && (
                  <>
                    {' '}
                    (<span className="font-mono">{session.login}/codice-skills</span>)
                  </>
                )}
                , que se creará si no existe.
              </span>
            </label>

            {submitting && progress && (
              <p role="status" aria-live="polite" className="m-0 flex items-center gap-2 text-xs text-slate-300">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                {progress.message}
              </p>
            )}

            <div className="mt-1 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className={`cursor-pointer rounded-full border border-slate-600 bg-transparent px-4 py-2 text-sm font-semibold text-slate-200 hover:border-slate-400 disabled:opacity-50 ${FOCUS}`}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!session || Boolean(writeProblem) || !wAck || submitting}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border-0 bg-[#0ea5e9] px-5 py-2 text-sm font-bold text-[#0a0d14] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38bdf8] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {submitting ? 'Subiendo…' : 'Crear y subir'}
              </button>
            </div>
          </form>
        )}

        {mode === 'local' && (
          <form onSubmit={handleSubmitLocal} noValidate className="[display:grid] gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,text/markdown"
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={handlePick}
            />
            <input
              ref={folderInputRef}
              type="file"
              multiple
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={handlePick}
              {...({ webkitdirectory: '' } as Record<string, string>)}
            />

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!session || busy}
                onClick={() => fileInputRef.current?.click()}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-600 bg-transparent px-4 py-2 text-sm font-semibold text-slate-100 hover:border-[#0ea5e9] hover:text-[#38bdf8] disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`}
              >
                <FileText className="h-4 w-4" aria-hidden="true" />
                Elegir un archivo .md
              </button>
              <button
                type="button"
                disabled={!session || busy}
                onClick={() => folderInputRef.current?.click()}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-600 bg-transparent px-4 py-2 text-sm font-semibold text-slate-100 hover:border-[#0ea5e9] hover:text-[#38bdf8] disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`}
              >
                <FolderUp className="h-4 w-4" aria-hidden="true" />
                Elegir una carpeta
              </button>
            </div>

            {reading && (
              <p role="status" className="m-0 flex items-center gap-2 text-xs text-slate-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                Leyendo y revisando los archivos…
              </p>
            )}

            {errorBlock}

            {draft && session && (
              <div className="[display:grid] gap-3 rounded-xl border border-slate-800 bg-[#0a0d14] p-3">
                <div>
                  <p className="m-0 text-sm font-semibold text-white">
                    {draft.files.length} {draft.files.length === 1 ? 'archivo' : 'archivos'} · {kb(draft.totalBytes)}
                  </p>
                  <ul className="m-0 mt-1.5 list-none space-y-0.5 p-0 font-mono text-[11px] text-slate-400">
                    {draft.files.slice(0, 8).map((f) => (
                      <li key={f.path} className="flex justify-between gap-3">
                        <span className="min-w-0 truncate">{f.path}</span>
                        <span className="shrink-0 text-slate-500">{kb(f.sizeBytes)}</span>
                      </li>
                    ))}
                    {draft.files.length > 8 && <li className="text-slate-500">… y {draft.files.length - 8} más</li>}
                  </ul>
                </div>

                {draft.warnings.length > 0 && (
                  <ul className="m-0 list-none space-y-1 p-0">
                    {draft.warnings.map((w) => (
                      <li key={w} className="flex items-start gap-2 text-xs text-amber-300">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div>
                  <label htmlFor={`${uid}-slug`} className="mb-1.5 block text-xs font-semibold text-slate-300">
                    Nombre de la carpeta en tu repo
                  </label>
                  <input
                    id={`${uid}-slug`}
                    type="text"
                    autoComplete="off"
                    spellCheck={false}
                    value={slug}
                    disabled={submitting}
                    onChange={(e) => setSlug(slugify(e.target.value.toLowerCase().replace(/ /g, '-')))}
                    aria-invalid={Boolean(slugProblem)}
                    className="w-full rounded-lg border border-slate-700 bg-[#121722] px-3 py-2 font-mono text-sm text-slate-100 focus-visible:border-[#0ea5e9] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0ea5e9] disabled:opacity-60"
                  />
                  <p className="m-0 mt-1.5 break-all font-mono text-[11px] text-slate-500">{target}</p>
                  {slugProblem && <p className="m-0 mt-1 text-xs text-rose-300">{slugProblem}</p>}
                </div>

                <label className="flex cursor-pointer items-start gap-2 text-xs leading-relaxed text-slate-300">
                  <input
                    type="checkbox"
                    checked={ack}
                    disabled={submitting}
                    onChange={(e) => setAck(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[#0ea5e9]"
                  />
                  <span>
                    Entiendo que estos archivos se publicarán en un repositorio <strong className="text-slate-100">público</strong> de mi cuenta de GitHub
                    (<span className="font-mono">{session.login}/codice-skills</span>), que se creará si no existe. Máximo {UPLOAD_LIMITS.maxFiles} archivos y{' '}
                    {UPLOAD_LIMITS.maxTotalBytes / 1_000_000} MB.
                  </span>
                </label>
              </div>
            )}

            {submitting && progress && (
              <div role="status" aria-live="polite" className="text-xs text-slate-300">
                <p className="m-0 flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  {progress.message}
                </p>
                {progress.total ? (
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800" aria-hidden="true">
                    <div
                      className="h-full rounded-full bg-[#0ea5e9] transition-all"
                      style={{ width: `${Math.round(((progress.done ?? 0) / progress.total) * 100)}%` }}
                    />
                  </div>
                ) : null}
              </div>
            )}

            <div className="mt-1 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className={`cursor-pointer rounded-full border border-slate-600 bg-transparent px-4 py-2 text-sm font-semibold text-slate-200 hover:border-slate-400 disabled:opacity-50 ${FOCUS}`}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!session || !draft || Boolean(slugProblem) || !ack || busy}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border-0 bg-[#0ea5e9] px-5 py-2 text-sm font-bold text-[#0a0d14] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38bdf8] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {submitting ? 'Subiendo…' : 'Subir y registrar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
