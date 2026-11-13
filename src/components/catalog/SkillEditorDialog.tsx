import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { AlertTriangle, Loader2, RefreshCw, X } from 'lucide-react';
import type { CatalogSkill } from '../../types/catalog';
import { CatalogError } from '../../services/githubCatalogService';
import { MAX_SKILL_MD_CHARS, checkSkillText } from '../../services/skillUploadService';
import { SafeMarkdown } from './SafeMarkdown';

interface SkillEditorDialogProps {
  open: boolean;
  skill: CatalogSkill;
  onClose: () => void;
  /** Guarda el SKILL.md nuevo con un commit. Debe lanzar un error legible si falla. */
  onSave: (markdown: string, message: string) => Promise<void>;
  /** Vuelve a leer la skill desde GitHub (tras un conflicto). */
  onReload?: () => void;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const FOCUS =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]';

type View = 'escribir' | 'vista';

/** Editor del SKILL.md de una skill propia: guarda con un commit en su repositorio de GitHub. */
export function SkillEditorDialog({ open, skill, onClose, onSave, onReload }: SkillEditorDialogProps) {
  const uid = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState(skill.markdown);
  const [message, setMessage] = useState('');
  const [view, setView] = useState<View>('escribir');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<{ text: string; conflict: boolean } | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  // Cada vez que se abre, parte del contenido actual de la skill.
  useEffect(() => {
    if (!open) return;
    setText(skill.markdown);
    setMessage('');
    setView('escribir');
    setError(null);
    setConfirmDiscard(false);
    const t = setTimeout(() => areaRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [open, skill.id, skill.markdown]);

  const report = useMemo(() => checkSkillText(text), [text]);
  const changed = text.trim() !== skill.markdown.trim();
  const defaultMessage = `Actualiza ${skill.name} desde Códice Studio`;

  if (!open) return null;

  const requestClose = () => {
    if (saving) return;
    if (changed && !confirmDiscard) {
      setConfirmDiscard(true);
      return;
    }
    onClose();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      requestClose();
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

  const handleSave = async () => {
    if (saving || !changed || report.errors.length > 0) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(text, message.trim() || defaultMessage);
      onClose();
    } catch (err) {
      setError({
        text: err instanceof Error ? err.message : 'No se pudo guardar el cambio.',
        conflict: err instanceof CatalogError && err.code === 'conflict',
      });
    } finally {
      setSaving(false);
    }
  };

  const viewTab = (id: View, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={view === id}
      onClick={() => setView(id)}
      className={`-mb-px cursor-pointer border-0 border-b-2 bg-transparent px-3 py-2 text-sm font-semibold ${FOCUS} ${
        view === id ? 'border-b-[#0ea5e9] text-white' : 'border-b-transparent text-slate-400 hover:text-slate-200'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[#0a0d14]/80 p-0 sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-title`}
        onKeyDown={handleKeyDown}
        className="flex max-h-[94svh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl border border-slate-700 bg-[#121722] shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 p-4">
          <div className="min-w-0">
            <h2 id={`${uid}-title`} className="m-0 text-lg font-bold tracking-tight text-white">
              Editar <span className="font-mono">{skill.name}</span>
            </h2>
            <p className="m-0 mt-0.5 truncate font-mono text-[11px] text-slate-500">
              {skill.repo}/{skill.skillPath ? `${skill.skillPath}/` : ''}SKILL.md
            </p>
          </div>
          <button
            type="button"
            onClick={requestClose}
            disabled={saving}
            aria-label="Cerrar"
            className={`inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-50 ${FOCUS}`}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
          <div role="tablist" aria-label="Modo del editor" className="flex gap-1 border-b border-slate-800">
            {viewTab('escribir', 'Escribir')}
            {viewTab('vista', 'Vista previa')}
          </div>

          {view === 'escribir' ? (
            <div>
              <label htmlFor={`${uid}-text`} className="sr-only">
                Contenido del SKILL.md
              </label>
              <textarea
                ref={areaRef}
                id={`${uid}-text`}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setConfirmDiscard(false);
                }}
                disabled={saving}
                spellCheck={false}
                aria-invalid={report.errors.length > 0}
                className="block h-[46svh] min-h-[240px] w-full resize-y rounded-lg border border-slate-700 bg-[#0a0d14] p-3 font-mono text-[13px] leading-relaxed text-slate-100 focus-visible:border-[#0ea5e9] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0ea5e9] disabled:opacity-60"
              />
              <p className="m-0 mt-1.5 text-right font-mono text-[11px] tabular-nums text-slate-500">
                {text.length.toLocaleString('es')} / {MAX_SKILL_MD_CHARS.toLocaleString('es')} caracteres
              </p>
            </div>
          ) : (
            <article lang="es" aria-label="Vista previa del SKILL.md" className="min-h-[240px] rounded-lg border border-slate-800 bg-[#0a0d14] p-4">
              <SafeMarkdown source={text} />
            </article>
          )}

          {report.errors.length > 0 && (
            <ul role="alert" className="m-0 list-none space-y-1 p-0">
              {report.errors.map((e) => (
                <li key={e} className="flex items-start gap-2 text-xs text-rose-300">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{e}</span>
                </li>
              ))}
            </ul>
          )}
          {report.warnings.length > 0 && (
            <ul className="m-0 list-none space-y-1 p-0">
              {report.warnings.map((w) => (
                <li key={w} className="flex items-start gap-2 text-xs text-amber-300">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          )}

          <div>
            <label htmlFor={`${uid}-msg`} className="mb-1.5 block text-xs font-semibold text-slate-300">
              Mensaje del commit
            </label>
            <input
              id={`${uid}-msg`}
              type="text"
              value={message}
              maxLength={200}
              disabled={saving}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={defaultMessage}
              className="w-full rounded-lg border border-slate-700 bg-[#0a0d14] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:border-[#0ea5e9] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0ea5e9] disabled:opacity-60"
            />
            <p className="m-0 mt-1.5 text-[11px] text-slate-500">
              Se guarda con un commit en tu repositorio y el catálogo apunta a la versión nueva.
            </p>
          </div>

          {error && (
            <div role="alert" className="flex flex-wrap items-center gap-3 rounded-lg border border-rose-500/40 bg-rose-950/30 p-3 text-xs text-rose-200">
              <span className="min-w-0 flex-1">{error.text}</span>
              {error.conflict && onReload && (
                <button
                  type="button"
                  onClick={() => {
                    onReload();
                    onClose();
                  }}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-rose-400/50 bg-transparent px-3 py-1 font-semibold text-rose-100 hover:bg-rose-900/40 ${FOCUS}`}
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  Recargar la skill
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-800 p-4">
          {confirmDiscard && (
            <p role="status" className="m-0 mr-auto text-xs text-amber-300">
              Tienes cambios sin guardar. Pulsa Cerrar otra vez para descartarlos.
            </p>
          )}
          <button
            type="button"
            onClick={requestClose}
            disabled={saving}
            className={`cursor-pointer rounded-full border border-slate-600 bg-transparent px-4 py-2 text-sm font-semibold text-slate-200 hover:border-slate-400 disabled:opacity-50 ${FOCUS}`}
          >
            {confirmDiscard ? 'Descartar y cerrar' : 'Cancelar'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !changed || report.errors.length > 0}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border-0 bg-[#0ea5e9] px-5 py-2 text-sm font-bold text-[#0a0d14] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38bdf8] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {saving ? 'Guardando…' : 'Guardar en GitHub'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SkillEditorDialog;
