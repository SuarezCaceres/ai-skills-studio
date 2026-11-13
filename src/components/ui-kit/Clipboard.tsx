import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';

/** Copia texto al portapapeles; si la API moderna no está disponible usa un `textarea` temporal. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Sin permiso o contexto no seguro: se prueba el método clásico.
  }
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

type CopyState = 'idle' | 'copied' | 'failed';

/** Estado de copiado que vuelve solo a «idle» tras un momento. */
export function useCopy(resetMs = 1800) {
  const [state, setState] = useState<CopyState>('idle');
  const timer = useRef<number>(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const copy = async (text: string) => {
    const ok = await copyText(text);
    setState(ok ? 'copied' : 'failed');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState('idle'), resetMs);
    return ok;
  };
  return { state, copy };
}

interface CopyButtonProps {
  text: string;
  /** Texto del botón; por defecto «Copiar». */
  label?: string;
  /** Solo el icono (el nombre accesible se mantiene). */
  iconOnly?: boolean;
}

/** Botón de copiar. El resultado se anuncia en una región `role="status"`. */
export function CopyButton({ text, label = 'Copiar', iconOnly = false }: CopyButtonProps) {
  const { state, copy } = useCopy();
  const copied = state === 'copied';
  return (
    <>
      <button
        type="button"
        onClick={() => copy(text)}
        aria-label={iconOnly ? label : undefined}
        title={iconOnly ? label : undefined}
        className={`inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-full border bg-transparent text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9] ${
          iconOnly ? 'w-8' : 'px-3'
        } ${copied ? 'border-emerald-500/60 text-emerald-300' : 'border-slate-700 text-slate-200 hover:border-[#0ea5e9] hover:text-[#38bdf8]'}`}
      >
        {copied ? <Check aria-hidden="true" className="h-3.5 w-3.5" /> : <Copy aria-hidden="true" className="h-3.5 w-3.5" />}
        {!iconOnly && (copied ? 'Copiado' : label)}
      </button>
      <span role="status" className="sr-only">
        {state === 'copied' ? 'Copiado al portapapeles' : state === 'failed' ? 'No se pudo copiar' : ''}
      </span>
    </>
  );
}

/** Campo de solo lectura con su botón de copiar (por ejemplo, un comando de instalación). */
export function CopyField({ value, label }: { value: string; label: string }) {
  const id = `copy-field-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-slate-400">
        {label}
      </label>
      <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-[#0a0d14] py-1.5 pl-3 pr-1.5">
        <input
          id={id}
          readOnly
          value={value}
          onFocus={(e) => e.currentTarget.select()}
          className="min-w-0 flex-1 border-0 bg-transparent font-mono text-xs text-slate-200 outline-none"
        />
        <CopyButton text={value} />
      </div>
    </div>
  );
}

/** Bloque de código con botón de copiar en la esquina. */
export function CodeSnippet({ code, language }: { code: string; language?: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-800 bg-[#0a0d14]">
      <div className="flex items-center justify-between border-b border-slate-800 px-3 py-1.5">
        <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500">{language ?? 'texto'}</span>
        <CopyButton text={code} iconOnly label="Copiar el código" />
      </div>
      <pre className="m-0 overflow-x-auto p-3 font-mono text-xs leading-relaxed text-slate-200">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/** Demo del registro: botón, campo y bloque de código. */
export function Demo() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-5">
      <div className="flex items-center gap-3">
        <CopyButton text="npm run dev -- --port 5180 --strictPort" />
        <CopyButton text="git fetch github" iconOnly label="Copiar el comando" />
      </div>
      <CopyField label="Comando de instalación" value="npx skills add SuarezCaceres/codice-skills --skill frontend-design" />
      <CodeSnippet language="bash" code={'git fetch github\ngit merge github/main'} />
    </div>
  );
}
