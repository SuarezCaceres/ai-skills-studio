import { useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, OctagonAlert, RotateCcw, X } from 'lucide-react';

export type AlertTone = 'info' | 'success' | 'warning' | 'error';

const TONES: Record<AlertTone, { box: string; icon: string; Icon: typeof Info }> = {
  info: { box: 'border-sky-500/40 bg-sky-950/30 text-sky-100', icon: 'text-sky-300', Icon: Info },
  success: { box: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-100', icon: 'text-emerald-300', Icon: CheckCircle2 },
  warning: { box: 'border-amber-500/40 bg-amber-950/30 text-amber-100', icon: 'text-amber-300', Icon: AlertTriangle },
  error: { box: 'border-rose-500/40 bg-rose-950/30 text-rose-100', icon: 'text-rose-300', Icon: OctagonAlert },
};

interface AlertProps {
  tone?: AlertTone;
  title: string;
  children?: ReactNode;
  onDismiss?: () => void;
  action?: { label: string; onClick: () => void };
}

/**
 * Alerta en línea. Los avisos urgentes (`warning`, `error`) usan `role="alert"` para que el
 * lector de pantalla los anuncie al instante; los demás, `role="status"` (cortés).
 */
export function Alert({ tone = 'info', title, children, onDismiss, action }: AlertProps) {
  const { box, icon, Icon } = TONES[tone];
  const urgent = tone === 'warning' || tone === 'error';
  return (
    <div role={urgent ? 'alert' : 'status'} className={`flex items-start gap-3 rounded-xl border p-3.5 ${box}`}>
      <Icon aria-hidden="true" className={`mt-0.5 h-4 w-4 shrink-0 ${icon}`} />
      <div className="min-w-0 flex-1 text-sm">
        <p className="m-0 font-semibold">{title}</p>
        {children && <div className="mt-1 text-[13px] leading-relaxed opacity-90">{children}</div>}
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-2 cursor-pointer border-0 bg-transparent p-0 text-[13px] font-semibold text-current underline underline-offset-2 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]"
          >
            {action.label}
          </button>
        )}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={`Cerrar aviso: ${title}`}
          className="-m-1 flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-current opacity-70 hover:bg-white/10 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0ea5e9]"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

const SAMPLES: Array<{ tone: AlertTone; title: string; body: string; action?: string }> = [
  { tone: 'info', title: 'Copia de trabajo abierta', body: 'Los cambios se guardan solo en este navegador.' },
  { tone: 'success', title: 'Skill subida', body: 'Ya aparece en el catálogo del equipo.' },
  { tone: 'warning', title: 'Incluye scripts', body: 'Revisa el código antes de instalarla.', action: 'Ver los scripts' },
  { tone: 'error', title: 'No se pudo conectar con GitHub', body: 'Comprueba tu conexión e inténtalo de nuevo.', action: 'Reintentar' },
];

/** Demo del registro: las cuatro variantes, descartables, con un botón para restaurarlas. */
export function Demo() {
  const [hidden, setHidden] = useState<AlertTone[]>([]);
  const [retries, setRetries] = useState(0);
  const visible = SAMPLES.filter((sample) => !hidden.includes(sample.tone));
  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      {visible.map((sample) => (
        <Alert
          key={sample.tone}
          tone={sample.tone}
          title={sample.title}
          onDismiss={() => setHidden((list) => [...list, sample.tone])}
          action={sample.action ? { label: sample.action, onClick: () => setRetries((n) => n + 1) } : undefined}
        >
          {sample.body}
        </Alert>
      ))}
      {visible.length === 0 && <p className="m-0 text-sm text-slate-500">Cerraste todos los avisos.</p>}
      <div className="flex items-center gap-3 text-xs text-slate-500">
        <button
          type="button"
          onClick={() => setHidden([])}
          disabled={hidden.length === 0}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-700 bg-transparent px-3 py-1.5 font-medium text-slate-200 hover:border-[#0ea5e9] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]"
        >
          <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
          Mostrar de nuevo
        </button>
        <span aria-live="polite">{retries > 0 ? `Acciones pulsadas: ${retries}` : ''}</span>
      </div>
    </div>
  );
}
