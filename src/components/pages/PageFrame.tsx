import { Component, Suspense, lazy, useRef, useState, type ComponentType, type LazyExoticComponent, type ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import type { PageId, PageTemplateEntry } from '../../types/pages';
import { BUTTON } from './pageUi';

export type Viewport = 'escritorio' | 'movil';

type Preview = LazyExoticComponent<ComponentType>;

/**
 * `React.lazy` recuerda un fallo para siempre. Tras «Reintentar» se guarda aquí el `lazy` nuevo, para que
 * al volver a abrir la misma página no se use el que ya falló.
 */
const retried = new Map<PageId, Preview>();

function freshPreview(entry: PageTemplateEntry): Preview {
  return lazy(() => entry.loadPreview().then((m) => ({ default: m.Template })));
}

interface BoundaryProps {
  name: string;
  onRetry: () => void;
  children: ReactNode;
}

/** Captura el fallo de la plantilla (al cargarla o al pintarla) sin cerrar la modal. */
class PreviewBoundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div data-testid="pagina-error" role="alert" className="flex min-h-[16rem] flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="m-0 text-sm text-rose-300">No se pudo cargar la página «{this.props.name}».</p>
        <button type="button" onClick={this.props.onRetry} className={BUTTON}>
          <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
          Reintentar
        </button>
      </div>
    );
  }
}

interface PageFrameProps {
  entry: PageTemplateEntry;
  viewport: Viewport;
}

/**
 * Marco con aspecto de navegador que pinta la plantilla en vivo. En escritorio ocupa el ancho disponible y
 * en móvil se estrecha a 390 px; las plantillas reaccionan con *container queries*. El alto está limitado y
 * el contenido se desplaza por dentro, así que nunca desborda el documento.
 */
export function PageFrame({ entry, viewport }: PageFrameProps) {
  const [Preview, setPreview] = useState<Preview>(() => retried.get(entry.id) ?? entry.Preview);
  const [attempt, setAttempt] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);

  const retry = () => {
    const next = freshPreview(entry);
    retried.set(entry.id, next);
    setPreview(() => next);
    setAttempt((n) => n + 1);
    // El botón desaparece: el foco pasa al área del marco para no perderse fuera de la modal.
    scroller.current?.focus();
  };

  const mobile = viewport === 'movil';
  return (
    <div
      data-testid="pagina-marco"
      data-viewport={viewport}
      style={mobile ? { width: 'min(390px, 100%)' } : undefined}
      className={`mx-auto flex min-w-0 max-w-full flex-col overflow-hidden rounded-xl border border-slate-700 bg-[#0a0d14] ${mobile ? '' : 'w-full'}`}
    >
      <div aria-hidden="true" className="flex items-center gap-3 border-b border-slate-800 bg-[#121722] px-3 py-2">
        <span className="flex shrink-0 gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
        </span>
        <span className="min-w-0 flex-1 truncate rounded-md bg-[#0a0d14] px-3 py-1 font-mono text-[11px] text-slate-500">
          tu-proyecto.dev/{entry.id}
        </span>
      </div>
      <div
        ref={scroller}
        tabIndex={0}
        role="region"
        aria-label={`Vista previa de ${entry.name}`}
        className="h-[min(62vh,640px)] min-h-[18rem] overflow-auto focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#0ea5e9]"
      >
        <PreviewBoundary key={attempt} name={entry.name} onRetry={retry}>
          <Suspense
            fallback={
              <p role="status" className="m-0 flex min-h-[16rem] items-center justify-center p-6 text-sm text-slate-500">
                Cargando la página…
              </p>
            }
          >
            <Preview />
          </Suspense>
        </PreviewBoundary>
      </div>
    </div>
  );
}
