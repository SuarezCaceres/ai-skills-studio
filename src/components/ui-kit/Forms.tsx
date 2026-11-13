import { useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { CheckCircle2 } from 'lucide-react';

interface FieldProps {
  label: string;
  /** Se muestra bajo el campo cuando no hay error. */
  hint?: string;
  error?: string;
  required?: boolean;
  /** Recibe los atributos de accesibilidad que debe poner el control. */
  children: (control: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: true; 'aria-required'?: true }) => ReactNode;
}

/** Etiqueta + control + ayuda/error enlazados con `htmlFor` y `aria-describedby`. */
export function Field({ label, hint, error, required, children }: FieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-slate-300">
        {label}
        {required && (
          <>
            <span aria-hidden="true" className="text-[#38bdf8]"> *</span>
            <span className="sr-only"> (obligatorio)</span>
          </>
        )}
      </label>
      {children({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
        'aria-required': required ? true : undefined,
      })}
      {error ? (
        <p id={`${id}-error`} className="m-0 text-xs text-rose-300">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="m-0 text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

const CONTROL =
  'w-full rounded-lg border border-slate-700 bg-[#0a0d14] px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#0ea5e9] aria-[invalid=true]:border-rose-500/70';

const LEVELS = ['Principiante', 'Intermedio', 'Avanzado'] as const;

interface Values {
  title: string;
  email: string;
  level: string;
  summary: string;
  agree: boolean;
  notify: boolean;
}

type Errors = Partial<Record<keyof Values, string>>;

function validate(values: Values): Errors {
  const errors: Errors = {};
  if (values.title.trim().length < 5) errors.title = 'El título necesita al menos 5 caracteres.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = 'Escribe un correo válido, por ejemplo nombre@dominio.es.';
  if (!LEVELS.includes(values.level as (typeof LEVELS)[number])) errors.level = 'Elige un nivel.';
  if (values.summary.trim().length < 20) errors.summary = 'Cuenta de qué trata en al menos 20 caracteres.';
  if (!values.agree) errors.agree = 'Debes aceptar las normas del equipo.';
  return errors;
}

const SUMMARY_MAX = 200;

/**
 * Formulario completo: validación al enviar, resumen de errores con `role="alert"` que lleva el foco al
 * primer campo con fallo, y corrección en vivo una vez que ya se intentó enviar.
 */
export function ContactForm() {
  const [values, setValues] = useState<Values>({ title: '', email: '', level: '', summary: '', agree: false, notify: true });
  const [submitted, setSubmitted] = useState(false);
  const [done, setDone] = useState(false);
  const form = useRef<HTMLFormElement>(null);

  const errors = submitted ? validate(values) : {};
  const errorList = Object.entries(errors);

  const set = <K extends keyof Values>(key: K, value: Values[K]) => setValues((v) => ({ ...v, [key]: value }));

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    const found = validate(values);
    if (Object.keys(found).length > 0) {
      setDone(false);
      const first = Object.keys(found)[0];
      window.requestAnimationFrame(() => form.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus());
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <div role="status" className="flex flex-col items-start gap-3 rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-5 text-emerald-100">
        <CheckCircle2 aria-hidden="true" className="h-5 w-5 text-emerald-300" />
        <p className="m-0 text-sm font-semibold">Clase enviada: «{values.title}»</p>
        <button
          type="button"
          onClick={() => {
            setDone(false);
            setSubmitted(false);
            setValues({ title: '', email: '', level: '', summary: '', agree: false, notify: true });
          }}
          className="cursor-pointer rounded-full border border-emerald-400/50 bg-transparent px-4 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-emerald-900/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]"
        >
          Escribir otra
        </button>
      </div>
    );
  }

  return (
    <form ref={form} onSubmit={onSubmit} noValidate className="flex w-full max-w-md flex-col gap-4 rounded-xl border border-slate-800 bg-[#121722] p-5">
      {errorList.length > 0 && (
        <div role="alert" className="rounded-lg border border-rose-500/40 bg-rose-950/30 p-3 text-xs text-rose-200">
          <p className="m-0 font-semibold">Revisa {errorList.length === 1 ? 'un campo' : `${errorList.length} campos`}:</p>
          <ul className="mb-0 mt-1 list-disc pl-4">
            {errorList.map(([name, message]) => (
              <li key={name}>{message}</li>
            ))}
          </ul>
        </div>
      )}

      <Field label="Título de la clase" required error={errors.title} hint="Por ejemplo: «¿Qué es un hook?»">
        {(c) => (
          <input {...c} name="title" value={values.title} onChange={(e) => set('title', e.target.value)} maxLength={80} className={`${CONTROL} h-10`} />
        )}
      </Field>

      <Field label="Correo de contacto" required error={errors.email}>
        {(c) => (
          <input {...c} name="email" type="email" autoComplete="email" value={values.email} onChange={(e) => set('email', e.target.value)} className={`${CONTROL} h-10`} />
        )}
      </Field>

      <Field label="Nivel" required error={errors.level}>
        {(c) => (
          <select {...c} name="level" value={values.level} onChange={(e) => set('level', e.target.value)} className={`${CONTROL} h-10`}>
            <option value="">Elige un nivel…</option>
            {LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        )}
      </Field>

      <Field label="Resumen" required error={errors.summary} hint={`${values.summary.length} de ${SUMMARY_MAX} caracteres`}>
        {(c) => (
          <textarea {...c} name="summary" rows={3} maxLength={SUMMARY_MAX} value={values.summary} onChange={(e) => set('summary', e.target.value)} className={`${CONTROL} resize-y py-2`} />
        )}
      </Field>

      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="mb-1 p-0 text-xs font-medium text-slate-300">Preferencias</legend>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" name="notify" checked={values.notify} onChange={(e) => set('notify', e.target.checked)} className="h-4 w-4 accent-[#0ea5e9]" />
          Avisarme cuando alguien comente
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            name="agree"
            checked={values.agree}
            onChange={(e) => set('agree', e.target.checked)}
            aria-invalid={errors.agree ? true : undefined}
            aria-describedby={errors.agree ? 'agree-error' : undefined}
            className="h-4 w-4 accent-[#0ea5e9]"
          />
          Acepto las normas del equipo
        </label>
        {errors.agree && (
          <p id="agree-error" className="m-0 text-xs text-rose-300">
            {errors.agree}
          </p>
        )}
      </fieldset>

      <button
        type="submit"
        className="h-10 cursor-pointer rounded-full border-0 bg-[#0ea5e9] px-5 text-sm font-semibold text-[#0a0d14] transition-colors hover:bg-[#38bdf8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]"
      >
        Enviar clase
      </button>
    </form>
  );
}

/** Demo del registro: el formulario completo con validación. */
export function Demo() {
  return <ContactForm />;
}
