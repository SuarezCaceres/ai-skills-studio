import React, { useState } from 'react';
import { UserAccount } from '../types/workspace';
import {
  hashPasswordPBKDF2,
  checkLoginRateLimit,
  recordFailedLoginAttempt,
  resetLoginAttempts,
  sanitizeUserText,
} from '../utils/securityHardening';
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Flame,
  ArrowRight,
  UserPlus,
  LogIn,
  AlertCircle,
  Cpu,
  FolderArchive,
  BookOpen,
} from 'lucide-react';

interface AuthScreenProps {
  onAuthenticated: (user: UserAccount) => void;
  onContinueAsPublic?: () => void;
}

const USERS_STORAGE_KEY = 'ai_orange_studio_users_v1';

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onAuthenticated,
  onContinueAsPublic,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('sergio@aistudio.dev');
  const [password, setPassword] = useState('OrangeAI2026!');
  const [role, setRole] = useState('Editor Autorizado · Full-Stack Architect');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [emailTouchedError, setEmailTouchedError] = useState<string | null>(null);

  const loadStoredUsers = (): Array<UserAccount & { passwordHash: string }> => {
    try {
      const raw = localStorage.getItem(USERS_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // Fallback
    }
    return [
      {
        id: 'usr-default-1',
        fullName: 'Sergio Suarez',
        email: 'sergio@aistudio.dev',
        role: 'Editor Autorizado · Full-Stack Architect',
        createdAt: '05/11/2026',
        passwordHash: 'pbkdf2_sha256$default_editor_seeded',
      },
    ];
  };

  const handleEmailBlur = () => {
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailTouchedError('Introduce un formato de correo válido (ej. usuario@dominio.com).');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = sanitizeUserText(email, 160).toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMessage('Por favor ingresa un correo electrónico válido.');
      return;
    }

    const rateLimit = checkLoginRateLimit(cleanEmail);
    if (!rateLimit.allowed) {
      setErrorMessage(
        `Demasiados intentos fallidos. Por seguridad, espera ${rateLimit.retryAfterSeconds}s antes de intentar de nuevo.`
      );
      return;
    }

    if (password.length < 6) {
      setErrorMessage('La contraseña debe contener al menos 6 caracteres.');
      return;
    }

    const candidateHash = await hashPasswordPBKDF2(password, cleanEmail);
    const users = loadStoredUsers();

    if (mode === 'register') {
      const cleanFullName = sanitizeUserText(fullName, 120);
      const cleanRole = sanitizeUserText(role, 120) || 'Editor Autorizado';

      if (!cleanFullName) {
        setErrorMessage('Ingresa tu nombre completo para crear la cuenta de editor.');
        return;
      }
      if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
        setErrorMessage('No fue posible completar el registro con este correo. Inicia sesión si ya tienes cuenta.');
        return;
      }

      const newUser: UserAccount & { passwordHash: string } = {
        id: `usr-${Date.now()}`,
        fullName: cleanFullName,
        email: cleanEmail,
        role: cleanRole,
        createdAt: new Date().toLocaleDateString(),
        passwordHash: candidateHash,
      };

      const updated = [newUser, ...users];
      try {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore quota error
      }

      resetLoginAttempts(cleanEmail);
      onAuthenticated({
        id: newUser.id,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt,
      });
      return;
    }

    const defaultEditorHash =
      cleanEmail === 'sergio@aistudio.dev'
        ? await hashPasswordPBKDF2('OrangeAI2026!', 'sergio@aistudio.dev')
        : '';

    const matched = users.find((u) => {
      if (u.email.toLowerCase() !== cleanEmail) return false;
      if (u.passwordHash === candidateHash) return true;
      if (
        u.id === 'usr-default-1' &&
        cleanEmail === 'sergio@aistudio.dev' &&
        candidateHash === defaultEditorHash
      ) {
        return true;
      }
      return false;
    });

    if (!matched) {
      recordFailedLoginAttempt(cleanEmail);
      const afterLimit = checkLoginRateLimit(cleanEmail);
      if (!afterLimit.allowed) {
        setErrorMessage(
          `Acceso bloqueado temporalmente por intentos fallidos. Reintenta en ${afterLimit.retryAfterSeconds}s.`
        );
      } else {
        setErrorMessage(
          'Credenciales inválidas. Verifica tu correo y contraseña o utiliza el acceso de demostración.'
        );
      }
      return;
    }

    resetLoginAttempts(cleanEmail);
    onAuthenticated({
      id: matched.id,
      fullName: matched.fullName,
      email: matched.email,
      role: matched.role,
      createdAt: matched.createdAt,
    });
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-100 flex flex-col justify-center items-center px-4 py-10 relative overflow-hidden">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10">
        {/* Columna Izquierda: Identidad del Sistema y Explicación de Roles */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0F172A] border border-[#FF6B00]/40 text-[#F97316] text-xs font-bold uppercase tracking-wider orange-glow-sm">
            <Flame className="w-4 h-4 text-[#FF6B00]" aria-hidden="true" />
            <span>Control de Roles · Modo Visitante vs. Modo Colaborador</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.1]">
            Acceso para{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B00] to-[#F97316]">
              Modo Colaborador
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            En <strong className="text-white">Modo Visitante</strong> cualquier usuario puede explorar el Códice Neuronal, interactuar con los mockups, ver la Galería del Sistema y leer la documentación. Inicia sesión en <strong className="text-[#FF6B00]">Modo Colaborador</strong> para habilitar la subida de paquetes <code className="text-[#F97316] font-mono">.rar</code>, edición de skills aplicadas y gestión del sistema.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            <div className="p-4 rounded-2xl bg-[#0F172A]/90 border border-slate-800 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FF6B00]/15 border border-[#FF6B00]/40 flex items-center justify-center shrink-0">
                <FolderArchive className="w-4 h-4 text-[#FF6B00]" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-white">Permisos de Colaborador (.RAR)</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Subir archivos .rar, adjuntar códigos, editar skills aplicadas y gestionar el Códice.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0F172A]/90 border border-slate-800 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center shrink-0">
                <Cpu className="w-4 h-4 text-sky-400" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-white">Modo Visitante Abierto</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Consulta libre de catálogos, planes de estudio, mockups y dictado de voz.
                </p>
              </div>
            </div>
          </div>

          {onContinueAsPublic && (
            <button
              type="button"
              onClick={onContinueAsPublic}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-[#0F172A] px-5 py-3 text-xs font-bold text-slate-200 transition hover:border-[#FF6B00] hover:text-white cursor-pointer"
            >
              <BookOpen className="h-4 w-4 text-[#FF6B00]" />
              Volver al Códice en Modo Visitante (Solo Lectura)
            </button>
          )}
        </div>

        {/* Columna Derecha: Tarjeta de Login y Registro en Azul Noche (#131C31 / #0F172A) */}
        <div className="lg:col-span-6">
          <div className="edu-floating-panel rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#0A0F1D] border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                }}
                className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                  mode === 'login'
                    ? 'bg-gradient-to-r from-[#FF6B00] to-[#F97316] text-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LogIn className="w-4 h-4" aria-hidden="true" />
                <span>Iniciar Sesión (Editor)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMessage(null);
                }}
                className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                  mode === 'register'
                    ? 'bg-gradient-to-r from-[#FF6B00] to-[#F97316] text-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-4 h-4" aria-hidden="true" />
                <span>Registrar Editor</span>
              </button>
            </div>

            {errorMessage && (
              <div
                role="alert"
                aria-live="assertive"
                className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" aria-hidden="true" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              method="POST"
              action="#auth"
              noValidate
              className="space-y-4"
            >
              {mode === 'register' && (
                <div>
                  <label
                    htmlFor="auth-fullname"
                    className="block text-xs font-semibold text-slate-300 mb-1.5"
                  >
                    Nombre Completo *
                  </label>
                  <input
                    id="auth-fullname"
                    name="fullName"
                    type="text"
                    required
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="Ej. Sergio Suarez"
                    className="w-full h-12 rounded-xl bg-[#0A0F1D] border border-slate-800 focus:border-[#FF6B00] px-4 text-sm text-white focus:outline-none transition"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="auth-email"
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  Correo Electrónico *
                </label>
                <input
                  id="auth-email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  required
                  aria-describedby={emailTouchedError ? 'email-error-msg' : undefined}
                  value={email}
                  onBlur={handleEmailBlur}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailTouchedError(null);
                    setErrorMessage(null);
                  }}
                  placeholder="usuario@empresa.com"
                  className="w-full h-12 rounded-xl bg-[#0A0F1D] border border-slate-800 focus:border-[#FF6B00] px-4 text-sm text-white focus:outline-none transition"
                />
                {emailTouchedError && (
                  <p id="email-error-msg" className="text-[11px] text-[#F97316] mt-1">
                    {emailTouchedError}
                  </p>
                )}
              </div>

              {mode === 'register' && (
                <div>
                  <label
                    htmlFor="auth-role"
                    className="block text-xs font-semibold text-slate-300 mb-1.5"
                  >
                    Rol en el Equipo
                  </label>
                  <input
                    id="auth-role"
                    name="role"
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Editor Autorizado · Full-Stack Architect"
                    className="w-full h-12 rounded-xl bg-[#0A0F1D] border border-slate-800 focus:border-[#FF6B00] px-4 text-sm text-white focus:outline-none transition"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="auth-password"
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  Contraseña *
                </label>
                <div className="relative">
                  <input
                    id="auth-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    minLength={6}
                    required
                    aria-describedby="password-hint"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMessage(null);
                    }}
                    className="w-full h-12 rounded-xl bg-[#0A0F1D] border border-slate-800 focus:border-[#FF6B00] pl-4 pr-12 text-sm text-white focus:outline-none transition"
                  />
                  <button
                    type="button"
                    aria-pressed={showPassword}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-[#F97316] cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <Eye className="w-4 h-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
                <span id="password-hint" className="block text-[11px] text-slate-400 mt-1">
                  Mínimo 6 caracteres. Habilita permisos de subida .rar y edición.
                </span>
              </div>

              <button
                type="submit"
                className="w-full h-12 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#F97316] hover:brightness-110 text-black font-extrabold text-sm flex items-center justify-center gap-2 orange-glow transition cursor-pointer"
              >
                <span>
                  {mode === 'login'
                    ? 'Activar Modo Editor'
                    : 'Registrar y Activar Modo Editor'}
                </span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </form>

            <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#FF6B00]" aria-hidden="true" />
                Control de Acceso por Roles
              </span>
              <button
                type="button"
                onClick={() =>
                  onAuthenticated({
                    id: 'usr-demo',
                    fullName: 'Sergio Suarez',
                    email: 'sergio@aistudio.dev',
                    role: 'Editor Autorizado · Full-Stack Architect',
                    createdAt: '05/11/2026',
                  })
                }
                className="text-[#F97316] hover:underline font-bold cursor-pointer"
              >
                Acceso Rápido Demo Editor (1-Clic) →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
