import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Github, Lock, ShieldCheck, X } from 'lucide-react';
import { useCatalog } from '../hooks/useCatalog';
import './authModal.css';

interface AuthScreenProps {
  onContinueAsPublic?: () => void;
}

/**
 * Modal flotante de acceso con GitHub (estilo Forge con vidrio esmerilado y fondo difuminado).
 * Se monta sobre la vista actual sin perder la posición de scroll ni desmontar el fondo WebGL2.
 */
export const AuthScreen: React.FC<AuthScreenProps> = ({ onContinueAsPublic }) => {
  const { oauthConfigured, signingIn, authError, signIn } = useCatalog();
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeBtnRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onContinueAsPublic) {
        onContinueAsPublic();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onContinueAsPublic]);

  const modal = (
    <div
      className="auth-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-heading"
      onClick={(event) => {
        if (event.target === event.currentTarget && onContinueAsPublic) {
          onContinueAsPublic();
        }
      }}
    >
      <div className="auth-modal-card">
        <div className="flex items-start justify-between gap-3">
          <p className="m-0 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400">
            <span aria-hidden="true" className="h-px w-5 bg-[#0ea5e9]" />
            <span>Acceso · GitHub OAuth</span>
          </p>
          {onContinueAsPublic && (
            <button
              ref={closeBtnRef}
              type="button"
              onClick={onContinueAsPublic}
              aria-label="Cerrar ventana de acceso"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-700/80 bg-slate-900/70 text-slate-300 transition hover:border-[#0ea5e9]/60 hover:bg-[#0ea5e9]/15 hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <h1 id="auth-modal-heading" className="auth-modal-title">
          Entra con <span className="text-[#0ea5e9]">tu cuenta de GitHub</span>
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-slate-300">
          Desbloquea el catálogo comunitario, Skills del equipo, Explorar, Componentes y Códice para publicar, votar y reportar resultados por modelo.
        </p>

        <div className="auth-modal-grid">
          <div className="rounded-xl border border-slate-800/90 bg-[#0d1220]/80 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-100">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#0ea5e9]" aria-hidden="true" />
              <span>Permiso public_repo</span>
            </div>
            <p className="mt-1 text-[11px] leading-snug text-slate-400">
              Solo para crear Issues y reacciones con tu firma en GitHub.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800/90 bg-[#0d1220]/80 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-100">
              <Lock className="h-3.5 w-3.5 shrink-0 text-[#0ea5e9]" aria-hidden="true" />
              <span>Token en memoria</span>
            </div>
            <p className="mt-1 text-[11px] leading-snug text-slate-400">
              Nunca se guarda en disco ni en servidor; caduca al recargar.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-2.5">
          <button
            type="button"
            onClick={() => {
              void signIn();
            }}
            disabled={!oauthConfigured || signingIn}
            className="auth-modal-cta"
          >
            <Github className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{signingIn ? 'Esperando a GitHub…' : 'Entrar con GitHub'}</span>
          </button>

          {!oauthConfigured && (
            <p className="text-center text-[11px] text-slate-400">
              El inicio de sesión con GitHub aún no está configurado en este despliegue.
            </p>
          )}
          {authError && (
            <p role="alert" className="text-center text-[11px] text-rose-300">
              {authError}
            </p>
          )}

          {onContinueAsPublic && (
            <button
              type="button"
              onClick={onContinueAsPublic}
              className="auth-modal-secondary"
            >
              Volver al Códice en Modo Visitante
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return modal;
  return createPortal(modal, document.body);
};
