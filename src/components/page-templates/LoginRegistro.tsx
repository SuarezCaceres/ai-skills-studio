import { useState, type MouseEvent } from 'react';
import { Eye, EyeOff, Github } from 'lucide-react';
import { Button } from '../ui-kit/Buttons';
import { Field } from '../ui-kit/Forms';

/** La plantilla es inerte: ningún enlace navega. */
function blockLinks(event: MouseEvent<HTMLElement>) {
  if ((event.target as Element).closest('a')) event.preventDefault();
}

const INPUT =
  'h-11 w-full rounded-lg border border-slate-700 bg-[#0a0d14] px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#0ea5e9]';
const LINK = 'rounded-sm font-medium text-[#38bdf8] no-underline hover:underline focus-visible:outline-2 focus-visible:outline-[#0ea5e9]';

/** Panel de marca: solo se ve cuando hay ancho para dos columnas. */
function BrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden border-r border-slate-800 bg-[#0d111a] p-10 @3xl:flex @3xl:flex-col @3xl:justify-between">
      <p className="m-0 flex items-center gap-2 text-lg font-bold text-white">
        <span aria-hidden="true" className="h-3 w-3 rounded-sm bg-[#0ea5e9]" />
        Ancla
      </p>
      <svg aria-hidden="true" viewBox="0 0 320 220" className="w-full max-w-sm">
        <g fill="none" strokeWidth="1.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={20 + i * 22} y={20 + i * 14} width={200} height={120} rx="14" className={i === 4 ? 'stroke-[#0ea5e9]' : 'stroke-slate-700'} />
          ))}
        </g>
        <circle cx="270" cy="60" r="22" className="fill-[#0ea5e9]/20 stroke-[#0ea5e9]" />
      </svg>
      <div>
        <p className="m-0 max-w-[32ch] text-2xl font-semibold leading-snug text-white">Tus copias de seguridad, en orden y a un clic.</p>
        <p className="mb-0 mt-3 max-w-[40ch] text-sm leading-relaxed text-slate-400">
          Más de 4.000 equipos guardan sus proyectos con Ancla. Cifrado de extremo a extremo y restauración en minutos.
        </p>
      </div>
    </aside>
  );
}

export function Template() {
  const [mode, setMode] = useState<'entrar' | 'registro'>('entrar');
  const [showPassword, setShowPassword] = useState(false);
  const signIn = mode === 'entrar';

  return (
    <div className="@container min-h-full w-full bg-[#0a0d14] font-sans text-slate-300" onClick={blockLinks}>
      <div className="[display:grid] min-h-[640px] @3xl:grid-cols-2">
        <BrandPanel />

        <main className="flex items-center justify-center px-5 py-12">
          <div className="w-full max-w-sm">
            <p className="m-0 mb-8 flex items-center gap-2 text-base font-bold text-white @3xl:hidden">
              <span aria-hidden="true" className="h-3 w-3 rounded-sm bg-[#0ea5e9]" />
              Ancla
            </p>
            <h1 className="m-0 text-2xl font-bold tracking-tight text-white">{signIn ? 'Entra en tu cuenta' : 'Crea tu cuenta'}</h1>
            <p className="mb-0 mt-2 text-sm text-slate-400">
              {signIn ? '¿Aún no tienes cuenta? ' : '¿Ya tienes cuenta? '}
              <button
                type="button"
                onClick={() => setMode(signIn ? 'registro' : 'entrar')}
                className="cursor-pointer rounded-sm border-0 bg-transparent p-0 text-sm font-medium text-[#38bdf8] hover:underline focus-visible:outline-2 focus-visible:outline-[#0ea5e9]"
              >
                {signIn ? 'Regístrate gratis' : 'Entra'}
              </button>
            </p>

            <Button
              variant="secondary"
              size="lg"
              className="mt-8 w-full"
              icon={<Github aria-hidden="true" className="h-4 w-4" />}
            >
              Continuar con GitHub
            </Button>

            <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
              <span aria-hidden="true" className="h-px flex-1 bg-slate-800" />o con tu correo
              <span aria-hidden="true" className="h-px flex-1 bg-slate-800" />
            </div>

            <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()} noValidate>
              {!signIn && (
                <Field label="Nombre" required>
                  {(control) => <input {...control} type="text" autoComplete="name" className={INPUT} />}
                </Field>
              )}
              <Field label="Correo electrónico" required>
                {(control) => <input {...control} type="email" autoComplete="email" placeholder="tu@correo.com" className={INPUT} />}
              </Field>
              <Field label="Contraseña" required hint={signIn ? undefined : 'Al menos 12 caracteres.'}>
                {(control) => (
                  <div className="relative">
                    <input
                      {...control}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={signIn ? 'current-password' : 'new-password'}
                      className={`${INPUT} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-pressed={showPassword}
                      aria-label="Mostrar contraseña"
                      className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-slate-400 hover:text-white focus-visible:outline-2 focus-visible:outline-[#0ea5e9]"
                    >
                      {showPassword ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
                    </button>
                  </div>
                )}
              </Field>

              {signIn && (
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <label className="flex cursor-pointer items-center gap-2 text-slate-300">
                    <input type="checkbox" className="h-4 w-4 accent-[#0ea5e9]" defaultChecked />
                    Recordarme
                  </label>
                  <a href="#" className={LINK}>
                    ¿Olvidaste la contraseña?
                  </a>
                </div>
              )}

              <Button type="submit" size="lg" className="mt-2 w-full">
                {signIn ? 'Entrar' : 'Crear cuenta'}
              </Button>
            </form>

            <p className="mb-0 mt-8 text-xs leading-relaxed text-slate-400">
              Al continuar aceptas las{' '}
              <a href="#" className={LINK}>
                condiciones del servicio
              </a>{' '}
              y la{' '}
              <a href="#" className={LINK}>
                política de privacidad
              </a>
              .
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
