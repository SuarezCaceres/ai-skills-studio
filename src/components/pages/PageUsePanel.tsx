import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { Check, Code2, Copy, MessageSquareText } from 'lucide-react';
import type { PageTemplateEntry } from '../../types/pages';
import { BUTTON, FOCUS } from './pageUi';

type Tab = 'prompt' | 'codigo';
type Source = { status: 'loading' | 'error' } | { status: 'ready'; code: string };

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'prompt', label: 'Prompt' },
  { id: 'codigo', label: 'Código' },
];

const COPY_OK = 'Copiado';
const COPY_FAIL = 'No se pudo copiar, selecciona el texto';

/** Selecciona el contenido de `el` para que se pueda copiar a mano si el portapapeles falla. */
function selectContents(el: HTMLElement | null) {
  if (!el) return;
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.selectNodeContents(el);
  selection.removeAllRanges();
  selection.addRange(range);
}

interface PageUsePanelProps {
  entry: PageTemplateEntry;
  /** Id del contenedor, para el `aria-controls` del botón «Usar esta página». */
  id: string;
}

/**
 * Contenido de «Usar esta página»: pestañas Prompt y Código (patrón ARIA tabs) con botón de copiar y un
 * aviso `aria-live`. Se monta con `key` por página, así que al cambiar de página vuelve a «Prompt».
 */
export function PageUsePanel({ entry, id }: PageUsePanelProps) {
  const base = useId();
  const [tab, setTab] = useState<Tab>('prompt');
  const [source, setSource] = useState<Source>({ status: 'loading' });
  const [notice, setNotice] = useState('');
  const tabs = useRef<Record<Tab, HTMLButtonElement | null>>({ prompt: null, codigo: null });
  const text = useRef<HTMLPreElement>(null);

  // El código real de la plantilla se pide al abrir el panel.
  useEffect(() => {
    let cancelled = false;
    entry
      .loadSource()
      .then((code) => !cancelled && setSource({ status: 'ready', code }))
      .catch(() => !cancelled && setSource({ status: 'error' }));
    return () => {
      cancelled = true;
    };
  }, [entry]);

  const select = (next: Tab, focus = false) => {
    setTab(next);
    setNotice('');
    if (focus) tabs.current[next]?.focus();
  };

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const index = TABS.findIndex((t) => t.id === tab);
    let next: number | null = null;
    if (event.key === 'ArrowRight') next = (index + 1) % TABS.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + TABS.length) % TABS.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = TABS.length - 1;
    if (next === null) return;
    event.preventDefault();
    select(TABS[next].id, true);
  };

  const copy = async (value: string) => {
    // Se vacía el aviso y se espera un fotograma: así «Copiado» se vuelve a anunciar al repetir.
    setNotice('');
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Sin portapapeles');
      await navigator.clipboard.writeText(value);
      setNotice(COPY_OK);
    } catch {
      setNotice(COPY_FAIL);
      selectContents(text.current);
    }
  };

  const pre = 'm-0 max-h-[24rem] overflow-auto p-4 font-mono text-xs leading-relaxed text-slate-200';
  const tabId = (t: Tab) => `${base}-tab-${t}`;
  const panelId = (t: Tab) => `${base}-panel-${t}`;

  return (
    <div id={id} className="min-w-0 space-y-3 rounded-xl border border-slate-800 bg-[#0a0d14] p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Usar esta página" className="inline-flex rounded-lg border border-slate-800 bg-[#121722] p-1">
          {TABS.map((t) => {
            const active = t.id === tab;
            const Icon = t.id === 'prompt' ? MessageSquareText : Code2;
            return (
              <button
                key={t.id}
                ref={(el) => {
                  tabs.current[t.id] = el;
                }}
                type="button"
                role="tab"
                id={tabId(t.id)}
                aria-selected={active}
                aria-controls={panelId(t.id)}
                tabIndex={active ? 0 : -1}
                onClick={() => select(t.id)}
                onKeyDown={onTabKeyDown}
                className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border-0 px-3 text-xs font-semibold ${FOCUS} ${
                  active ? 'bg-[#0ea5e9]/15 text-[#38bdf8]' : 'bg-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Icon aria-hidden="true" className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          <p data-testid="pagina-aviso" aria-live="polite" className="m-0 flex items-center gap-1 text-xs text-slate-400">
            {notice === COPY_OK && <Check aria-hidden="true" className="h-3.5 w-3.5 text-[#38bdf8]" />}
            {notice}
          </p>
          {tab === 'prompt' ? (
            <button type="button" onClick={() => copy(entry.prompt)} className={BUTTON}>
              <Copy aria-hidden="true" className="h-3.5 w-3.5" />
              Copiar prompt
            </button>
          ) : (
            <button type="button" disabled={source.status !== 'ready'} onClick={() => source.status === 'ready' && copy(source.code)} className={BUTTON}>
              <Copy aria-hidden="true" className="h-3.5 w-3.5" />
              Copiar código
            </button>
          )}
        </div>
      </div>

      <div role="tabpanel" id={panelId(tab)} aria-labelledby={tabId(tab)} className="min-w-0 overflow-hidden rounded-lg border border-slate-800 bg-[#05070b]">
        {tab === 'prompt' ? (
          <div data-testid="pagina-prompt">
            <pre ref={text} tabIndex={0} aria-label={`Prompt de ${entry.name}`} className={`${pre} whitespace-pre-wrap break-words ${FOCUS}`}>
              {entry.prompt}
            </pre>
          </div>
        ) : (
          <div data-testid="pagina-codigo">
            {source.status === 'loading' && (
              <p role="status" className="m-0 p-4 text-xs text-slate-500">
                Cargando el código…
              </p>
            )}
            {source.status === 'error' && (
              <p role="alert" className="m-0 p-4 text-xs text-rose-300">
                No se pudo cargar el código de esta página.
              </p>
            )}
            {source.status === 'ready' && (
              <pre ref={text} tabIndex={0} aria-label={`Código de ${entry.name}`} className={`${pre} ${FOCUS}`}>
                <code>{source.code}</code>
              </pre>
            )}
          </div>
        )}
      </div>
      <p className="m-0 font-mono text-[11px] text-slate-500">
        {tab === 'prompt' ? 'En inglés, para pegarlo en tu IA.' : entry.sourcePath}
      </p>
    </div>
  );
}
