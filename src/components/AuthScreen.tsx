import React from 'react';
import { useCatalog } from '../hooks/useCatalog';
import {
  ShieldCheck,
  Flame,
  Cpu,
  FolderArchive,
  BookOpen,
  Github,
} from 'lucide-react';

interface AuthScreenProps {
  onContinueAsPublic?: () => void;
}

/**
 * Pantalla de acceso: solo existen el modo visitante y entrar con GitHub. La entrada como
 * colaborador al completarse el OAuth la gestiona `App` (observa la sesión de GitHub).
 */
export const AuthScreen: React.FC<AuthScreenProps> = ({ onContinueAsPublic }) => {
  const { oauthConfigured, signingIn, authError, signIn } = useCatalog();

  return (
    <div className="min-h-screen bg-transparent text-slate-100 flex flex-col justify-center items-center px-4 py-10 relative overflow-hidden">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10">
        {/* Columna izquierda: qué cambia al entrar */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0F172A] border border-[#0EA5E9]/40 text-[#38BDF8] text-xs font-bold uppercase tracking-wider cyan-glow-sm">
            <Flame className="w-4 h-4 text-[#0EA5E9]" aria-hidden="true" />
            <span>Modo Visitante vs. Entrar con GitHub</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.1]">
            Entra con{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]">
              tu cuenta de GitHub
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            En <strong className="text-white">Modo Visitante</strong> cualquier persona puede explorar el catálogo y las skills
            del equipo y montar carpetas o paquetes en memoria. Con <strong className="text-[#0EA5E9]">GitHub</strong> además
            puedes subir skills, votar y contar con qué modelo te funcionaron; tu cuenta queda como autora de lo que subes.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            <div className="p-4 rounded-2xl bg-[#0F172A]/90 border border-slate-800 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#0EA5E9]/15 border border-[#0EA5E9]/40 flex items-center justify-center shrink-0">
                <FolderArchive className="w-4 h-4 text-[#0EA5E9]" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-white">Con GitHub</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Subir skills, votar, reportar resultados por modelo y firmar con tu cuenta.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0F172A]/90 border border-slate-800 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center shrink-0">
                <Cpu className="w-4 h-4 text-sky-400" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-white">Modo Visitante</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Consulta libre del catálogo, del equipo y del estudio, sin guardar nada en GitHub.
                </p>
              </div>
            </div>
          </div>

          {onContinueAsPublic && (
            <button
              type="button"
              onClick={onContinueAsPublic}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-[#0F172A] px-5 py-3 text-xs font-bold text-slate-200 transition hover:border-[#0EA5E9] hover:text-white cursor-pointer"
            >
              <BookOpen className="h-4 w-4 text-[#0EA5E9]" />
              Volver al Códice en Modo Visitante (Solo Lectura)
            </button>
          )}
        </div>

        {/* Columna derecha: entrar con GitHub */}
        <div className="lg:col-span-6">
          <div className="edu-floating-panel rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <h2 className="m-0 text-lg font-bold text-white">Acceso con GitHub</h2>
              <p className="m-0 text-xs leading-relaxed text-slate-400">
                Se abre una ventana de GitHub para autorizar la app. Pedimos el permiso <code className="font-mono">public_repo</code>{' '}
                para crear Issues y reacciones en el catálogo. El token solo vive en memoria: al recargar la página tendrás
                que entrar de nuevo.
              </p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  void signIn();
                }}
                disabled={!oauthConfigured || signingIn}
                className="w-full h-12 rounded-xl bg-[#0EA5E9] hover:brightness-110 text-[#0a0d14] font-extrabold text-sm flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Github className="w-4 h-4" aria-hidden="true" />
                <span>{signingIn ? 'Esperando a GitHub…' : 'Entrar con GitHub'}</span>
              </button>
              {!oauthConfigured && (
                <p className="text-[11px] text-slate-400">
                  El inicio de sesión con GitHub aún no está configurado en este despliegue.
                </p>
              )}
              {authError && (
                <p role="alert" className="text-[11px] text-rose-300">
                  {authError}
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#0EA5E9]" aria-hidden="true" />
                Tu identidad es tu cuenta de GitHub
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
