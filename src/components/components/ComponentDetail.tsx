import { Component, Suspense, useEffect, useState, type ErrorInfo, type ReactNode } from 'react';
import { Accessibility, Bot, Code2, Eye, ImageIcon, LogIn, Pencil, Plus, RotateCcw, Sparkles, X } from 'lucide-react';
import type { CatalogSkill } from '../../types/catalog';
import type { ComponentAssignment, UiComponentEntry } from '../../types/uiComponents';
import { AI_BENCHMARK_MODELS } from '../../data/aiModelsData';
import { PersonAvatar } from '../catalog/PersonAvatar';
import { CopyButton } from '../ui-kit/Clipboard';
import { isUnassigned } from './assignmentInfo';
import { ComponentThumb } from './ComponentThumb';

interface ComponentDetailProps {
  entry: UiComponentEntry;
  assignment?: ComponentAssignment;
  /** Skills del equipo, para mostrar el nombre y el avatar de las asignadas. */
  skills: CatalogSkill[];
  /** Con sesión de GitHub se puede asignar y desasignar. */
  canEdit: boolean;
  saveFailed: boolean;
  onAssign: () => void;
  onUnassign: (kind: 'skill' | 'model', id: string) => void;
  onOpenSkill: (id: string) => void;
  onRequestLogin: () => void;
}

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]';

/** Evita que un fallo dentro de una demo tumbe toda la página. */
class PreviewBoundary extends Component<{ children: ReactNode; onReset: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('[components] la vista previa falló:', error.message, info.componentStack);
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className="max-w-sm rounded-lg border border-rose-500/40 bg-rose-950/30 p-4 text-sm text-rose-200">
        <p className="m-0 font-semibold">No se pudo dibujar este componente.</p>
        <button
          type="button"
          onClick={() => {
            this.setState({ failed: false });
            this.props.onReset();
          }}
          className={`mt-3 cursor-pointer rounded-full border border-rose-400/50 bg-transparent px-3 py-1 text-xs font-semibold text-rose-100 hover:bg-rose-900/40 ${FOCUS}`}
        >
          Reintentar
        </button>
      </div>
    );
  }
}

type SourceState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; code: string };

function useSource(entry: UiComponentEntry): SourceState {
  const [state, setState] = useState<SourceState>({ status: 'loading' });
  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    entry
      .loadSource()
      .then((code) => !cancelled && setState({ status: 'ready', code }))
      .catch(() => !cancelled && setState({ status: 'error' }));
    return () => {
      cancelled = true;
    };
  }, [entry]);
  return state;
}

function SectionTitle({ icon, id, children }: { icon: ReactNode; id: string; children: ReactNode }) {
  return (
    <h3 id={id} className="m-0 flex items-center gap-2 text-sm font-semibold text-white">
      <span aria-hidden="true" className="text-[#38bdf8]">
        {icon}
      </span>
      {children}
    </h3>
  );
}

const CHIP_REMOVE =
  '-mr-1 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-slate-400 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0ea5e9]';

type AssignmentPanelProps = Pick<
  ComponentDetailProps,
  'entry' | 'assignment' | 'skills' | 'canEdit' | 'saveFailed' | 'onAssign' | 'onUnassign' | 'onOpenSkill' | 'onRequestLogin'
>;

/** Asignación: skills (avatar + nombre, con enlace a su detalle) y modelos de IA, o «No asignado» si no hay ninguno. */
export function AssignmentPanel({
  entry,
  assignment,
  skills,
  canEdit,
  saveFailed,
  onAssign,
  onUnassign,
  onOpenSkill,
  onRequestLogin,
}: AssignmentPanelProps) {
  const unassigned = isUnassigned(assignment);
  const models = (assignment?.modelIds ?? []).flatMap((id) => AI_BENCHMARK_MODELS.filter((m) => m.id === id));

  return (
    <div className="flex flex-col gap-3 text-sm">
      {unassigned ? (
        <p className="m-0 flex flex-wrap items-center gap-2 text-sm text-slate-300">
          <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900/60 px-2.5 py-0.5 text-xs font-semibold text-slate-300">
            No asignado
          </span>
          <span className="text-slate-500">Todavía no tiene una skill ni un modelo de IA.</span>
        </p>
      ) : (
        <>
          <div>
            <p className="m-0 mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <Sparkles aria-hidden="true" className="h-3.5 w-3.5" /> Skills
            </p>
            {assignment && assignment.skillIds.length > 0 ? (
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                {assignment.skillIds.map((id) => {
                  const skill = skills.find((s) => s.id === id);
                  const name = skill?.name ?? (id.split('/').pop() || id);
                  return (
                    <li
                      key={id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#0ea5e9]/40 bg-[#0ea5e9]/10 py-0.5 pl-1 pr-2"
                    >
                      <PersonAvatar
                        login={skill?.uploadedBy.login ?? (id.split('/')[0] || '?')}
                        avatarUrl={skill?.uploadedBy.avatarUrl}
                        size={20}
                      />
                      <button
                        type="button"
                        onClick={() => onOpenSkill(id)}
                        title={`Abrir la skill ${name}`}
                        className={`cursor-pointer border-0 bg-transparent p-0 font-mono text-xs text-[#38bdf8] hover:underline ${FOCUS}`}
                      >
                        {name}
                      </button>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => onUnassign('skill', id)}
                          aria-label={`Quitar la skill ${name} de ${entry.name}`}
                          className={CHIP_REMOVE}
                        >
                          <X aria-hidden="true" className="h-3 w-3" />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="m-0 text-slate-500">No asignado</p>
            )}
          </div>
          <div>
            <p className="m-0 mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <Bot aria-hidden="true" className="h-3.5 w-3.5" /> Modelos de IA
            </p>
            {models.length > 0 ? (
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                {models.map((model) => (
                  <li
                    key={model.id}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-[#0a0d14] py-1 pl-3 pr-2 text-xs text-slate-200"
                  >
                    <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ backgroundColor: model.badgeColor }} />
                    {model.family} · {model.version}
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => onUnassign('model', model.id)}
                        aria-label={`Quitar el modelo ${model.family} ${model.version} de ${entry.name}`}
                        className={CHIP_REMOVE}
                      >
                        <X aria-hidden="true" className="h-3 w-3" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="m-0 text-slate-500">No asignado</p>
            )}
          </div>
          {assignment?.note && (
            <p className="m-0 rounded-lg border border-slate-800 bg-[#0a0d14] p-3 text-xs leading-relaxed text-slate-300">
              {assignment.note}
            </p>
          )}
        </>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {canEdit ? (
          <button
            type="button"
            onClick={onAssign}
            className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border-0 bg-[#0ea5e9] px-4 text-xs font-semibold text-[#0a0d14] hover:bg-[#38bdf8] ${FOCUS}`}
          >
            {unassigned ? <Plus aria-hidden="true" className="h-4 w-4" /> : <Pencil aria-hidden="true" className="h-3.5 w-3.5" />}
            {unassigned ? 'Asignar skill o modelo' : 'Editar asignación'}
          </button>
        ) : (
          <button
            type="button"
            onClick={onRequestLogin}
            className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-slate-700 bg-transparent px-4 text-xs font-semibold text-slate-100 hover:border-[#0ea5e9] hover:text-[#38bdf8] ${FOCUS}`}
          >
            <LogIn aria-hidden="true" className="h-4 w-4" />
            Entrar con GitHub para asignar
          </button>
        )}
        {saveFailed && (
          <p role="alert" className="m-0 text-xs text-amber-300">
            No se pudo guardar en este navegador: el cambio se perderá al recargar.
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Detalle de un componente: vista previa en vivo, imagen generada, asignación (skills y modelos),
 * código real con botón de copiar y notas de accesibilidad.
 */
export function ComponentDetail({ entry, assignment, skills, canEdit, saveFailed, onAssign, onUnassign, onOpenSkill, onRequestLogin }: ComponentDetailProps) {
  const [version, setVersion] = useState(0);
  const source = useSource(entry);
  const lines = source.status === 'ready' ? source.code.split('\n').length : 0;

  return (
    <article aria-labelledby="component-name" className="flex min-w-0 flex-col gap-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <p className="m-0 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#38bdf8]">{entry.category}</p>
          <h2 id="component-name" tabIndex={-1} className="m-0 text-2xl font-bold tracking-tight text-white outline-none">
            {entry.name}
          </h2>
          <p className="m-0 max-w-2xl text-sm leading-relaxed text-slate-400">{entry.description}</p>
        </div>
      </header>

      <section aria-labelledby="sec-preview" className="min-w-0 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <SectionTitle id="sec-preview" icon={<Eye className="h-4 w-4" />}>
            Vista previa en vivo
          </SectionTitle>
          <button
            type="button"
            onClick={() => setVersion((v) => v + 1)}
            className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-slate-700 bg-transparent px-3 text-xs font-medium text-slate-200 hover:border-[#0ea5e9] ${FOCUS}`}
          >
            <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
            Reiniciar
          </button>
        </div>
        <div
          data-preview-stage
          className="min-w-0 overflow-auto rounded-xl border border-slate-800 bg-[#0a0d14] p-5 sm:p-8"
          style={{ backgroundImage: 'radial-gradient(rgb(148 163 184 / 0.12) 1px, transparent 1px)', backgroundSize: '18px 18px' }}
        >
          <div className="flex min-h-48 items-center justify-center">
            <PreviewBoundary key={`${entry.id}-${version}`} onReset={() => setVersion((v) => v + 1)}>
              <Suspense
                fallback={
                  <div role="status" className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0ea5e9] border-t-transparent motion-reduce:animate-none" />
                    Cargando componente…
                  </div>
                }
              >
                <entry.Preview />
              </Suspense>
            </PreviewBoundary>
          </div>
        </div>
      </section>

      <div className="[display:grid] items-start gap-5 md:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <section aria-labelledby="sec-image" className="min-w-0 space-y-2 rounded-xl border border-slate-800 bg-[#121722] p-4">
          <SectionTitle id="sec-image" icon={<ImageIcon className="h-4 w-4" />}>
            Imagen
          </SectionTitle>
          <ComponentThumb key={entry.id} entry={entry} width={308} fluid />
          <p className="m-0 text-[11px] leading-relaxed text-slate-500">
            Captura generada a partir del propio componente (640 × 400).
          </p>
        </section>

        <section aria-labelledby="sec-assignment" className="min-w-0 space-y-3 rounded-xl border border-slate-800 bg-[#121722] p-4">
          <SectionTitle id="sec-assignment" icon={<Sparkles className="h-4 w-4" />}>
            Skill o modelo de IA asignado
          </SectionTitle>
          <AssignmentPanel
            entry={entry}
            assignment={assignment}
            skills={skills}
            canEdit={canEdit}
            saveFailed={saveFailed}
            onAssign={onAssign}
            onUnassign={onUnassign}
            onOpenSkill={onOpenSkill}
            onRequestLogin={onRequestLogin}
          />
        </section>
      </div>

      <section aria-labelledby="sec-code" className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle id="sec-code" icon={<Code2 className="h-4 w-4" />}>
            Código
          </SectionTitle>
          {source.status === 'ready' && <CopyButton text={source.code} label="Copiar código" />}
        </div>
        <p className="m-0 font-mono text-xs text-slate-500">
          {entry.sourcePath}
          {lines > 0 && ` · ${lines} líneas`}
        </p>
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#0a0d14]">
          {source.status === 'loading' && (
            <p role="status" className="m-0 p-4 text-xs text-slate-500">
              Cargando el código…
            </p>
          )}
          {source.status === 'error' && (
            <p role="alert" className="m-0 p-4 text-xs text-rose-300">
              No se pudo cargar el código de este componente.
            </p>
          )}
          {source.status === 'ready' && (
            <pre
              tabIndex={0}
              aria-label={`Código de ${entry.name}`}
              className="m-0 max-h-[28rem] overflow-auto p-4 font-mono text-xs leading-relaxed text-slate-200"
            >
              <code>{source.code}</code>
            </pre>
          )}
        </div>
      </section>

      <section aria-labelledby="sec-a11y" className="space-y-2 rounded-xl border border-slate-800 bg-[#121722] p-4">
        <SectionTitle id="sec-a11y" icon={<Accessibility className="h-4 w-4" />}>
          Notas de accesibilidad
        </SectionTitle>
        <ul className="m-0 flex list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed text-slate-400">
          {entry.a11y.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </section>
    </article>
  );
}
