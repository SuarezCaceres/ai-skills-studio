import { useState, type ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';

/**
 * Marco de las animaciones que ocurren una sola vez: enseña la demo y un botón «Repetir» que la
 * vuelve a montar (cambia el `key`), con lo que la animación arranca de cero. El contenido lleva
 * `data-replay-run` con el número de ejecución (1, 2, 3…).
 */
export function ReplayFrame({ children }: { children: ReactNode }) {
  const [run, setRun] = useState(1);

  return (
    <div className="flex w-full flex-col gap-3">
      <div key={run} data-replay-run={run} className="w-full min-w-0">
        {children}
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          aria-label="Repetir animación"
          onClick={() => setRun((n) => n + 1)}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-700 bg-[#121722] px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:border-[#0ea5e9] hover:text-[#38bdf8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9] motion-reduce:transition-none"
        >
          <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
          Repetir
        </button>
      </div>
    </div>
  );
}
