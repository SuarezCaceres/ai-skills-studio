import { useState, type ReactNode } from 'react';
import { Laptop, Smartphone, Globe, type LucideIcon } from 'lucide-react';

interface FrameProps {
  /** Descripción de lo que muestra el dispositivo, para lectores de pantalla. */
  label: string;
  children: ReactNode;
}

/** Marco de teléfono con isla de cámara y barra inferior. Hecho solo con CSS. */
export function PhoneFrame({ label, children }: FrameProps) {
  return (
    <figure aria-label={label} className="m-0 w-[200px]">
      <div className="rounded-[2rem] border border-slate-600 bg-[#1b2230] p-2 shadow-xl shadow-black/50">
        <div className="relative aspect-[9/19] overflow-hidden rounded-[1.5rem] bg-[#0a0d14]">
          <span aria-hidden="true" className="absolute left-1/2 top-2 z-10 h-4 w-14 -translate-x-1/2 rounded-full bg-black" />
          <div className="h-full w-full overflow-hidden pt-8">{children}</div>
          <span aria-hidden="true" className="absolute inset-x-12 bottom-1.5 h-1 rounded-full bg-slate-500/70" />
        </div>
      </div>
    </figure>
  );
}

/** Marco de portátil: pantalla con bisel y base. */
export function LaptopFrame({ label, children }: FrameProps) {
  return (
    <figure aria-label={label} className="m-0 w-full max-w-[420px]">
      <div className="rounded-t-xl border border-b-0 border-slate-600 bg-[#1b2230] p-2 pb-0 shadow-xl shadow-black/50">
        <div className="aspect-[16/10] overflow-hidden rounded-t-md bg-[#0a0d14]">{children}</div>
      </div>
      <div aria-hidden="true" className="relative h-3 rounded-b-xl border border-slate-600 bg-gradient-to-b from-slate-500 to-slate-700">
        <span className="absolute left-1/2 top-0 h-1 w-16 -translate-x-1/2 rounded-b-md bg-slate-800" />
      </div>
    </figure>
  );
}

/** Ventana de navegador con barra de direcciones (solo texto, no navega). */
export function BrowserFrame({ label, url, children }: FrameProps & { url: string }) {
  return (
    <figure aria-label={label} className="m-0 w-full max-w-[420px]">
      <div className="overflow-hidden rounded-xl border border-slate-600 bg-[#1b2230] shadow-xl shadow-black/50">
        <div className="flex items-center gap-3 border-b border-slate-700 px-3 py-2">
          <span aria-hidden="true" className="flex gap-1.5">
            <i className="block h-2.5 w-2.5 rounded-full bg-slate-500" />
            <i className="block h-2.5 w-2.5 rounded-full bg-slate-500" />
            <i className="block h-2.5 w-2.5 rounded-full bg-slate-500" />
          </span>
          <span className="min-w-0 flex-1 truncate rounded-md bg-[#0a0d14] px-3 py-1 text-center font-mono text-[11px] text-slate-400">{url}</span>
        </div>
        <div className="aspect-[16/10] overflow-hidden bg-[#0a0d14]">{children}</div>
      </div>
    </figure>
  );
}

/** Pantalla de ejemplo que se dibuja dentro de cada marco. */
function ScreenContent() {
  return (
    <div aria-hidden="true" className="flex h-full flex-col gap-2 p-3">
      <div className="h-3 w-1/3 rounded bg-[#0ea5e9]" />
      <div className="h-2 w-2/3 rounded bg-slate-700" />
      <div className="mt-1 h-16 rounded-lg bg-gradient-to-br from-[#0c4a6e] to-[#0a0d14]" />
      <div className="[display:grid] grid-cols-2 gap-2">
        <div className="h-10 rounded-md bg-slate-800" />
        <div className="h-10 rounded-md bg-slate-800" />
      </div>
      <div className="h-2 w-1/2 rounded bg-slate-700" />
      <div className="h-2 w-3/4 rounded bg-slate-800" />
    </div>
  );
}

type DeviceId = 'telefono' | 'portatil' | 'navegador';

const DEVICES: Array<{ id: DeviceId; label: string; icon: LucideIcon }> = [
  { id: 'telefono', label: 'Teléfono', icon: Smartphone },
  { id: 'portatil', label: 'Portátil', icon: Laptop },
  { id: 'navegador', label: 'Navegador', icon: Globe },
];

/** Demo del registro: un selector de dispositivo y el marco elegido con una pantalla de ejemplo. */
export function Demo() {
  const [device, setDevice] = useState<DeviceId>('telefono');
  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div role="group" aria-label="Dispositivo" className="inline-flex gap-1 rounded-full border border-slate-700 bg-[#0a0d14] p-0.5">
        {DEVICES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            aria-pressed={device === id}
            onClick={() => setDevice(id)}
            className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border-0 px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0ea5e9] ${
              device === id ? 'bg-[#0ea5e9] text-[#0a0d14]' : 'bg-transparent text-slate-300 hover:text-white'
            }`}
          >
            <Icon aria-hidden="true" className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>
      {device === 'telefono' && (
        <PhoneFrame label="Teléfono con una pantalla de ejemplo">
          <ScreenContent />
        </PhoneFrame>
      )}
      {device === 'portatil' && (
        <LaptopFrame label="Portátil con una pantalla de ejemplo">
          <ScreenContent />
        </LaptopFrame>
      )}
      {device === 'navegador' && (
        <BrowserFrame label="Ventana de navegador con una pantalla de ejemplo" url="codice.studio/clases">
          <ScreenContent />
        </BrowserFrame>
      )}
    </div>
  );
}
