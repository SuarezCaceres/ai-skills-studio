import { useEffect, useRef } from 'react';
import { AlertCircle, Globe, Loader2, RefreshCw, Undo2 } from 'lucide-react';
import type { Lesson } from '../../types/lessons';
import type { ShareFailure, ShareOp } from './useShareLesson';

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]';

interface ShareDialogProps {
  mode: ShareOp;
  lesson: Lesson;
  /** Login de la cuenta que publica (dueña del repo `<login>/codice-skills`). */
  login: string;
  busy: boolean;
  error: ShareFailure | null;
  onConfirm: () => void;
  onClose: () => void;
  onRequestLogin: () => void;
}

const COPY: Record<ShareOp, { title: string; confirm: string; busy: string; Icon: typeof Globe }> = {
  share: { title: 'Compartir esta clase', confirm: 'Compartir públicamente', busy: 'Compartiendo…', Icon: Globe },
  update: { title: 'Actualizar lo compartido', confirm: 'Actualizar', busy: 'Actualizando…', Icon: RefreshCw },
  unshare: { title: 'Retirar de Comunidad', confirm: 'Sí, retirar', busy: 'Retirando…', Icon: Undo2 },
};

/**
 * Confirmación de compartir, actualizar o retirar una clase. Usa el `<dialog>` nativo en modo modal
 * (foco atrapado, Escape y fondo gestionados por el navegador). Mientras trabaja no se puede cerrar.
 */
export function ShareDialog({ mode, lesson, login, busy, error, onConfirm, onClose, onRequestLogin }: ShareDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const copy = COPY[mode];
  const Icon = copy.Icon;
  const folder = `${login}/codice-skills › classes/${lesson.id}/`;

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  const failed = error && error.op === mode ? error : null;

  return (
    <dialog
      ref={ref}
      aria-labelledby="share-dialog-title"
      aria-describedby="share-dialog-body"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
      className="m-auto max-h-[90vh] w-[min(92vw,36rem)] overflow-y-auto rounded-2xl border border-slate-700 bg-[#121722] p-0 text-slate-300 shadow-2xl backdrop:bg-[#030712]/80 backdrop:backdrop-blur-sm"
    >
      <div className="space-y-4 p-5 sm:p-6">
        <h2 id="share-dialog-title" className="m-0 flex items-center gap-2.5 text-lg font-bold text-white">
          <span aria-hidden="true" className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${mode === 'unshare' ? 'border-rose-500/40 bg-rose-950/30 text-rose-300' : 'border-[#0ea5e9]/40 bg-[#0ea5e9]/10 text-[#38bdf8]'}`}>
            <Icon className="h-4 w-4" />
          </span>
          {copy.title}
        </h2>

        <div id="share-dialog-body" className="space-y-3 text-sm leading-relaxed">
          {mode === 'share' && (
            <>
              <p className="m-0">
                Se publicará «<strong className="text-white">{lesson.title}</strong>» en GitHub, en tu repositorio público{' '}
                <code className="rounded bg-[#0a0d14] px-1.5 py-0.5 font-mono text-xs text-[#38bdf8]">{folder}</code>, en un único commit con{' '}
                <code className="font-mono text-xs text-slate-200">clase.json</code> y <code className="font-mono text-xs text-slate-200">CLASE.md</code>, y se abrirá un Issue{' '}
                <code className="font-mono text-xs text-slate-200">[class]</code> en el catálogo para que otras personas la encuentren.
              </p>
              <p className="m-0">
                <strong className="text-white">Qué se publica:</strong> el título, el resumen, el nivel, las etiquetas, las skills y los componentes vinculados, los videos, el texto de la
                explicación y tu usuario de GitHub como autora.
              </p>
            </>
          )}
          {mode === 'update' && (
            <p className="m-0">
              Se publicará un nuevo commit con la versión actual de «<strong className="text-white">{lesson.title}</strong>» en{' '}
              <code className="rounded bg-[#0a0d14] px-1.5 py-0.5 font-mono text-xs text-[#38bdf8]">{folder}</code> y se actualizará su Issue en el catálogo. Hasta entonces, lo que ve la gente es la
              versión anterior.
            </p>
          )}
          {mode === 'unshare' && (
            <p className="m-0">
              Se borrará la carpeta <code className="rounded bg-[#0a0d14] px-1.5 py-0.5 font-mono text-xs text-[#38bdf8]">{folder}</code> de tu repositorio con un commit y se cerrará su Issue en el
              catálogo. <strong className="text-white">Tu clase en este navegador no se toca.</strong> Quien ya la haya leído o copiado la conservará: eso no se puede deshacer.
            </p>
          )}

          {mode !== 'unshare' && (
            <p className="m-0 flex gap-2.5 rounded-xl border border-amber-500/40 bg-amber-950/30 p-3 text-amber-100">
              <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                <strong>Es público de verdad.</strong> Cualquiera en internet podrá leerlo en GitHub. Pedir sesión en Códice para ver Comunidad es solo un filtro de esta app, no protege el contenido.
                No compartas nada que no quieras hacer público.
              </span>
            </p>
          )}
          {mode === 'share' && (
            <p className="m-0 text-xs text-slate-400">Puedes retirarla cuando quieras desde el detalle de la clase: se borra la carpeta del repositorio y se cierra el Issue.</p>
          )}
        </div>

        {failed && (
          <div role="alert" id="share-dialog-error" className="space-y-2 rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 text-sm text-rose-100">
            <p className="m-0">{failed.message}</p>
            {failed.needsLogin && (
              <button type="button" onClick={onRequestLogin} className={`h-9 cursor-pointer rounded-full border border-rose-300/50 bg-transparent px-4 text-xs font-semibold text-rose-50 hover:bg-white/10 ${FOCUS}`}>
                Entrar con GitHub
              </button>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
          <button
            type="button"
            autoFocus
            onClick={onClose}
            disabled={busy}
            className={`h-11 cursor-pointer rounded-full border border-slate-600 bg-transparent px-5 text-sm font-semibold text-slate-100 hover:border-[#0ea5e9] disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`}
          >
            Cancelar
          </button>
          {!(failed && !failed.retryable) && (
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              aria-describedby={failed ? 'share-dialog-error' : undefined}
              className={`inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border-0 px-5 text-sm font-semibold disabled:cursor-wait disabled:opacity-70 ${FOCUS} ${
                mode === 'unshare' ? 'bg-rose-500 text-white hover:bg-rose-400' : 'bg-[#0ea5e9] text-[#0a0d14] hover:bg-[#38bdf8]'
              }`}
            >
              {busy && <Loader2 aria-hidden="true" className="h-4 w-4 motion-safe:animate-spin" />}
              {busy ? copy.busy : failed ? 'Reintentar' : copy.confirm}
            </button>
          )}
        </div>
      </div>
    </dialog>
  );
}
