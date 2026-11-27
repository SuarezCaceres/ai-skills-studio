import type { CSSProperties } from 'react';
import { Bot, FileCode2, GitBranch, Layers, ShieldCheck, Sparkles } from 'lucide-react';
import { ReplayFrame } from './ReplayFrame';

const css = `
/* Las columnas dependen del ancho del propio cuadro, no de la ventana. */
.fx-stagger {
  container-type: inline-size;
}
.fx-stagger-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
@container (min-width: 480px) {
  .fx-stagger-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
.fx-stagger-item {
  animation: fx-stagger-in 500ms cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: calc(var(--i) * 90ms);
}
@keyframes fx-stagger-in {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .fx-stagger-item {
    animation: none;
    transition: none;
  }
}
`;

const ITEMS = [
  { icon: Sparkles, label: 'Skills' },
  { icon: Bot, label: 'Subagentes' },
  { icon: GitBranch, label: 'Worktrees' },
  { icon: FileCode2, label: 'Specs' },
  { icon: ShieldCheck, label: 'Revisión' },
  { icon: Layers, label: 'Componentes' },
];

/** Demo de «Stagger»: seis tarjetas que aparecen una detrás de otra con un retraso de 90 ms entre ellas. */
export function Demo() {
  return (
    <div data-effect="stagger" className="fx-stagger w-full max-w-[560px]">
      <style>{css}</style>
      <ReplayFrame>
        <ul className="fx-stagger-grid m-0 list-none p-0">
          {ITEMS.map(({ icon: Icon, label }, i) => (
            <li
              key={label}
              className="fx-stagger-item flex flex-col gap-3 rounded-xl border border-slate-800 bg-[#121722] p-4"
              style={{ '--i': i } as CSSProperties}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0ea5e9]/15 text-[#38bdf8]">
                <Icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold text-slate-100">{label}</span>
            </li>
          ))}
        </ul>
      </ReplayFrame>
    </div>
  );
}
