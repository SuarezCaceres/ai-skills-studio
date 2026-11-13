import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Globe, Lock, RefreshCw, Undo2 } from 'lucide-react';
import type { Lesson } from '../../types/lessons';
import { shareStatus } from '../../services/lessonSharing';
import { safeHttpUrl } from '../catalog/ResultsByModel';
import { ShareDialog } from './ShareDialog';
import type { ShareOp, UseShareLessonResult } from './useShareLesson';

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]';
const BTN = `inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border px-4 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`;

interface SharePanelProps {
  lesson: Lesson;
  login: string;
  sharing: UseShareLessonResult;
  onRequestLogin: () => void;
  /** Se llama tras una operación correcta (para el aviso de la sección). */
  onDone: (op: ShareOp) => void;
}

const DONE_TEXT: Record<ShareOp, string> = {
  share: 'Clase compartida en Comunidad.',
  update: 'Se actualizó lo compartido.',
  unshare: 'La clase se retiró de Comunidad.',
};

/** Estado de compartida de una clase propia y sus acciones: compartir, actualizar y retirar. */
export function SharePanel({ lesson, login, sharing, onRequestLogin, onDone }: SharePanelProps) {
  const status = shareStatus(lesson);
  const [dialog, setDialog] = useState<ShareOp | null>(null);
  const [announce, setAnnounce] = useState('');
  const opener = useRef<HTMLElement | null>(null);

  const open = (op: ShareOp, trigger: HTMLElement) => {
    opener.current = trigger;
    sharing.clearError();
    setDialog(op);
  };

  const close = () => {
    setDialog(null);
    sharing.clearError();
    // Devuelve el foco al botón que abrió el diálogo (si sigue en pantalla).
    window.requestAnimationFrame(() => opener.current?.isConnected && opener.current.focus());
  };

  const confirm = async () => {
    if (!dialog) return;
    const op = dialog;
    setAnnounce(op === 'share' ? 'Compartiendo la clase…' : op === 'update' ? 'Actualizando lo compartido…' : 'Retirando la clase…');
    const ok = await sharing.run(op, lesson);
    if (ok) {
      setDialog(null);
      setAnnounce(DONE_TEXT[op]);
      onDone(op);
      // El botón que abrió el diálogo cambia de estado: el foco va al encabezado del panel.
      window.requestAnimationFrame(() => document.getElementById('share-heading')?.focus());
    } else {
      setAnnounce('No se pudo completar la acción.');
    }
  };

  useEffect(() => {
    setAnnounce('');
  }, [lesson.id]);

  const share = lesson.shared;
  const repoUrl = share ? safeHttpUrl(`https://github.com/${share.repo}`) : undefined;
  const folderUrl = share ? safeHttpUrl(`https://github.com/${share.repo}/tree/${share.sha}/classes/${share.slug}`) : undefined;

  const chip =
    status === 'shared'
      ? { label: 'Compartida', cls: 'border-[#0ea5e9]/50 bg-[#0ea5e9]/10 text-[#38bdf8]', Icon: Globe }
      : status === 'dirty'
        ? { label: 'Cambios sin compartir', cls: 'border-amber-500/40 bg-amber-950/30 text-amber-300', Icon: RefreshCw }
        : { label: 'Privada', cls: 'border-slate-600 bg-[#0a0d14] text-slate-300', Icon: Lock };
  const ChipIcon = chip.Icon;

  return (
    <section aria-labelledby="share-heading" className="space-y-3 rounded-xl border border-slate-800 bg-[#121722] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <h2 id="share-heading" tabIndex={-1} className="m-0 flex flex-wrap items-center gap-2.5 text-sm font-semibold text-white outline-none">
            Compartir en Comunidad
            <span data-testid="share-status" className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${chip.cls}`}>
              <ChipIcon aria-hidden="true" className="h-3 w-3" />
              {chip.label}
            </span>
          </h2>
          <p className="m-0 max-w-2xl text-xs leading-relaxed text-slate-400">
            {status === 'private' && 'Solo está en este navegador. Si la compartes, queda en un repositorio público de GitHub y aparece en Comunidad para quien entre con GitHub.'}
            {status === 'shared' && 'Está en Comunidad y al día. En GitHub es pública: cualquiera puede leerla ahí.'}
            {status === 'dirty' && 'Editaste la clase después de compartirla. Lo que ve la gente sigue siendo la versión anterior hasta que la actualices.'}
          </p>
          {share && (repoUrl || folderUrl) && (
            <p className="m-0 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              {folderUrl && (
                <a href={folderUrl} target="_blank" rel="noopener noreferrer" className={`inline-flex min-h-6 items-center gap-1 rounded text-[#38bdf8] hover:underline ${FOCUS}`}>
                  Ver en GitHub
                  <ExternalLink aria-hidden="true" className="h-3 w-3" />
                </a>
              )}
              {repoUrl && (
                <a href={repoUrl} target="_blank" rel="noopener noreferrer" className={`inline-flex min-h-6 items-center gap-1 rounded text-slate-400 hover:text-[#38bdf8] hover:underline ${FOCUS}`}>
                  {share.repo}
                  <ExternalLink aria-hidden="true" className="h-3 w-3" />
                </a>
              )}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {status === 'private' && (
            <button type="button" onClick={(e) => open('share', e.currentTarget)} disabled={sharing.busy !== null} className={`${BTN} border-0 bg-[#0ea5e9] text-[#0a0d14] hover:bg-[#38bdf8]`}>
              <Globe aria-hidden="true" className="h-4 w-4" />
              Compartir en Comunidad
            </button>
          )}
          {status === 'dirty' && (
            <button type="button" onClick={(e) => open('update', e.currentTarget)} disabled={sharing.busy !== null} className={`${BTN} border-0 bg-[#0ea5e9] text-[#0a0d14] hover:bg-[#38bdf8]`}>
              <RefreshCw aria-hidden="true" className="h-4 w-4" />
              Actualizar lo compartido
            </button>
          )}
          {status !== 'private' && (
            <button type="button" onClick={(e) => open('unshare', e.currentTarget)} disabled={sharing.busy !== null} className={`${BTN} border-rose-500/50 bg-transparent text-rose-200 hover:bg-rose-950/40`}>
              <Undo2 aria-hidden="true" className="h-4 w-4" />
              Retirar de Comunidad
            </button>
          )}
        </div>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {announce}
      </p>

      {dialog && (
        <ShareDialog
          mode={dialog}
          lesson={lesson}
          login={login}
          busy={sharing.busy === dialog}
          error={sharing.error}
          onConfirm={() => void confirm()}
          onClose={close}
          onRequestLogin={onRequestLogin}
        />
      )}
    </section>
  );
}
