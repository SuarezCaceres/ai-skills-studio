import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  FileText,
  FolderOpen,
  Plus,
} from 'lucide-react';
import type {
  CatalogApi,
  CatalogSkill,
  CatalogSkillFile,
  GithubSession,
  SkillResultReport,
  SkillVotes,
} from '../../types/catalog';
import { mockCatalogApi } from './mockCatalogApi';
import { SkillSidebar } from './SkillSidebar';
import { ResultsByModel, safeHttpUrl } from './ResultsByModel';
import { ReportResultForm } from './ReportResultForm';
import type { ReportInput } from './ReportResultForm';
import { MoreFromAuthor } from './MoreFromAuthor';
import { PublishSkillDialog } from './PublishSkillDialog';

/* ==========================================================================
   Render de Markdown NO confiable
   Se construye con elementos de React (nunca `dangerouslySetInnerHTML`):
   el HTML crudo se muestra como texto, los enlaces solo admiten http(s),
   las imágenes no se cargan (se muestran como texto) y no se ejecuta nada.
   ========================================================================== */

const MAX_MARKDOWN_CHARS = 200_000;

const INLINE_RE =
  /(`+)([\s\S]+?)\1|!\[([^\]]*)\]\(\s*([^)\s]*)[^)]*\)|\[([^\]]+)\]\(\s*([^)\s]*)[^)]*\)|\*\*([^*]+)\*\*|__([^_]+)__|\*([^*\s][^*]*)\*|(?<![A-Za-z0-9])_([^_\s][^_]*)_(?![A-Za-z0-9])/g;

function renderInline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let n = 0;
  for (const m of text.matchAll(INLINE_RE)) {
    const index = m.index ?? 0;
    if (index > last) out.push(text.slice(last, index));
    const k = `${key}-${n++}`;
    if (m[2] !== undefined) {
      out.push(
        <code
          key={k}
          className="rounded bg-[#0a0d14] px-1.5 py-0.5 font-mono text-[0.85em] text-[#38bdf8]"
        >
          {m[2].trim()}
        </code>
      );
    } else if (m[3] !== undefined) {
      // Imagen: no se carga contenido remoto desde Markdown externo.
      out.push(
        <span key={k} className="text-slate-400">
          [imagen{m[3] ? `: ${m[3]}` : ''}]
        </span>
      );
    } else if (m[5] !== undefined) {
      const href = safeHttpUrl(m[6]);
      out.push(
        href ? (
          <a
            key={k}
            href={href}
            target="_blank"
            rel="noopener noreferrer nofollow ugc"
            className="text-[#38bdf8] underline underline-offset-2 hover:text-sky-300"
          >
            {renderInline(m[5], k)}
          </a>
        ) : (
          <span key={k}>{renderInline(m[5], k)}</span>
        )
      );
    } else if (m[7] !== undefined || m[8] !== undefined) {
      out.push(
        <strong key={k} className="font-semibold text-white">
          {renderInline((m[7] ?? m[8]) as string, k)}
        </strong>
      );
    } else {
      out.push(<em key={k}>{renderInline((m[9] ?? m[10]) as string, k)}</em>);
    }
    last = index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const HEADING_CLASS: Record<number, string> = {
  2: 'mt-8 mb-3 border-b border-slate-800 pb-2 text-xl font-bold tracking-tight text-white',
  3: 'mt-6 mb-2 text-lg font-bold tracking-tight text-white',
  4: 'mt-5 mb-2 text-base font-semibold text-slate-100',
  5: 'mt-4 mb-1.5 text-sm font-semibold text-slate-100',
  6: 'mt-4 mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300',
};

const FENCE_RE = /^\s*(```+|~~~+)\s*([\w+-]*)/;
const HEADING_RE = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/;
const HR_RE = /^\s{0,3}([-*_])(\s*\1){2,}\s*$/;
const UL_RE = /^(\s*)[-*+]\s+(.*)$/;
const OL_RE = /^(\s*)\d+[.)]\s+(.*)$/;
const TABLE_SEP_RE = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim());
}

function isTableStart(line: string, next: string | undefined): boolean {
  return line.includes('|') && next !== undefined && next.includes('-') && TABLE_SEP_RE.test(next);
}

function startsBlock(line: string, next: string | undefined): boolean {
  return (
    FENCE_RE.test(line) ||
    HEADING_RE.test(line) ||
    HR_RE.test(line) ||
    UL_RE.test(line) ||
    OL_RE.test(line) ||
    /^\s*>/.test(line) ||
    isTableStart(line, next)
  );
}

function renderBlocks(source: string, key: string): ReactNode[] {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const out: ReactNode[] = [];
  let i = 0;
  let n = 0;

  while (i < lines.length) {
    const line = lines[i];
    const k = `${key}-${n++}`;

    if (line.trim() === '') {
      i++;
      continue;
    }

    const fence = FENCE_RE.exec(line);
    if (fence) {
      const marker = fence[1];
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(marker)) body.push(lines[i++]);
      i++; // cierre
      out.push(
        <pre
          key={k}
          tabIndex={0}
          aria-label={fence[2] ? `Código ${fence[2]}` : 'Código'}
          className="my-4 overflow-x-auto rounded-lg border border-slate-800 bg-[#0a0d14] p-4 font-mono text-[13px] leading-relaxed text-slate-200 focus-visible:outline-2 focus-visible:outline-[#0ea5e9]"
        >
          <code>{body.join('\n')}</code>
        </pre>
      );
      continue;
    }

    const heading = HEADING_RE.exec(line);
    if (heading) {
      // El h1 de la página es el nombre de la skill: los títulos del Markdown bajan un nivel.
      const level = Math.min(heading[1].length + 1, 6);
      const Tag = `h${level}` as 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
      out.push(
        <Tag key={k} className={HEADING_CLASS[level]}>
          {renderInline(heading[2], k)}
        </Tag>
      );
      i++;
      continue;
    }

    if (HR_RE.test(line)) {
      out.push(<hr key={k} className="my-6 border-0 border-t border-slate-800" />);
      i++;
      continue;
    }

    if (/^\s*>/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) quote.push(lines[i++].replace(/^\s*>\s?/, ''));
      out.push(
        <blockquote
          key={k}
          className="my-4 border-l-2 border-[#0ea5e9] bg-[#121722] py-1 pl-4 pr-3 text-slate-300"
        >
          {renderBlocks(quote.join('\n'), k)}
        </blockquote>
      );
      continue;
    }

    if (isTableStart(line, lines[i + 1])) {
      const head = splitRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim() !== '') {
        rows.push(splitRow(lines[i++]));
      }
      out.push(
        <div key={k} className="my-4 overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full border-collapse text-left text-[13px]">
            <thead className="bg-[#121722] text-slate-200">
              <tr>
                {head.map((c, ci) => (
                  <th key={ci} scope="col" className="border-b border-slate-800 px-3 py-2 font-semibold">
                    {renderInline(c, `${k}-h${ci}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {rows.map((r, ri) => (
                <tr key={ri} className="border-b border-slate-800/70 last:border-b-0">
                  {r.map((c, ci) => (
                    <td key={ci} className="px-3 py-2 align-top">
                      {renderInline(c, `${k}-${ri}-${ci}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    const listMatch = UL_RE.exec(line) ?? OL_RE.exec(line);
    if (listMatch) {
      const ordered = !UL_RE.test(line);
      const baseIndent = listMatch[1].length;
      const items: { text: string; rest: string[] }[] = [];
      while (i < lines.length) {
        const cur = lines[i];
        const m = (ordered ? OL_RE : UL_RE).exec(cur);
        if (m && m[1].length <= baseIndent) {
          items.push({ text: m[2], rest: [] });
          i++;
        } else if (
          items.length > 0 &&
          cur.trim() !== '' &&
          cur.length - cur.trimStart().length > baseIndent
        ) {
          items[items.length - 1].rest.push(cur);
          i++;
        } else {
          break;
        }
      }
      const ListTag = ordered ? 'ol' : 'ul';
      out.push(
        <ListTag
          key={k}
          className={`my-3 space-y-1.5 pl-6 text-slate-300 ${ordered ? 'list-decimal' : 'list-disc'} marker:text-slate-500`}
        >
          {items.map((it, ii) => (
            <li key={ii} className="pl-1 leading-relaxed">
              {renderInline(it.text, `${k}-${ii}`)}
              {it.rest.length > 0 && renderBlocks(it.rest.join('\n'), `${k}-${ii}n`)}
            </li>
          ))}
        </ListTag>
      );
      continue;
    }

    const para: string[] = [line];
    i++;
    while (i < lines.length && lines[i].trim() !== '' && !startsBlock(lines[i], lines[i + 1])) {
      para.push(lines[i++]);
    }
    out.push(
      <p key={k} className="my-3 break-words leading-relaxed text-slate-300">
        {para.map((l, li) => (
          <Fragment key={li}>
            {li > 0 && ' '}
            {renderInline(l.trim(), `${k}-${li}`)}
          </Fragment>
        ))}
      </p>
    );
  }
  return out;
}

/** Quita el frontmatter YAML y limita el tamaño antes de renderizar. */
function prepareMarkdown(raw: string): { text: string; truncated: boolean } {
  const noFront = raw.replace(/^﻿?---\r?\n[\s\S]*?\r?\n---[ \t]*(\r?\n|$)/, '');
  const truncated = noFront.length > MAX_MARKDOWN_CHARS;
  return { text: truncated ? noFront.slice(0, MAX_MARKDOWN_CHARS) : noFront, truncated };
}

function SafeMarkdown({ source }: { source: string }) {
  const { text, truncated } = useMemo(() => prepareMarkdown(source), [source]);
  const blocks = useMemo(() => renderBlocks(text, 'md'), [text]);
  if (blocks.length === 0) {
    return <p className="m-0 text-sm text-slate-400">Este SKILL.md está vacío.</p>;
  }
  return (
    <div className="text-[15px]">
      {blocks}
      {truncated && (
        <p className="text-xs text-amber-300">
          Contenido recortado: el SKILL.md supera los {MAX_MARKDOWN_CHARS.toLocaleString('es')}{' '}
          caracteres. Ábrelo en GitHub para verlo completo.
        </p>
      )}
    </div>
  );
}

/* ==========================================================================
   Pestañas WAI-ARIA y pestaña de archivos
   ========================================================================== */

type TabId = 'resumen' | 'archivos';

const TABS: { id: TabId; label: string; Icon: typeof FileText }[] = [
  { id: 'resumen', label: 'Resumen', Icon: FileText },
  { id: 'archivos', label: 'Archivos', Icon: FolderOpen },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function FilesPanel({ skill }: { skill: CatalogSkill }) {
  const files = skill.files;
  const [selected, setSelected] = useState<string>(
    () => files.find((f) => f.path === 'SKILL.md')?.path ?? files[0]?.path ?? ''
  );
  const file: CatalogSkillFile | undefined = files.find((f) => f.path === selected);
  const content = file?.path === 'SKILL.md' ? (file.content ?? skill.markdown) : file?.content;

  if (files.length === 0) {
    return (
      <p className="m-0 rounded-xl border border-dashed border-slate-700 bg-[#121722] p-5 text-sm text-slate-400">
        Esta skill no lista archivos.
      </p>
    );
  }

  return (
    <div className="[display:grid] min-w-0 gap-4 md:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
      <ul
        aria-label="Archivos de la skill"
        className="m-0 flex list-none flex-col gap-1 overflow-hidden rounded-xl border border-slate-800 bg-[#121722] p-2"
      >
        {files.map((f) => (
          <li key={f.path} className="min-w-0">
            <button
              type="button"
              onClick={() => setSelected(f.path)}
              aria-current={f.path === selected ? 'true' : undefined}
              className={`flex w-full min-w-0 cursor-pointer items-center justify-between gap-3 rounded-lg border-0 border-l-2 px-2.5 py-1.5 text-left text-xs transition-colors focus-visible:outline-2 focus-visible:outline-[#0ea5e9] ${
                f.path === selected
                  ? 'border-l-[#0ea5e9] bg-[#0a0d14] text-white'
                  : 'border-l-transparent bg-transparent text-slate-400 hover:bg-[#0a0d14]/60 hover:text-slate-200'
              }`}
            >
              <span className="min-w-0 truncate font-mono" title={f.path}>
                {f.path}
              </span>
              <span className="shrink-0 font-mono tabular-nums text-slate-500">
                {formatBytes(f.sizeBytes)}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="min-w-0 overflow-hidden rounded-xl border border-slate-800 bg-[#0a0d14]">
        <div className="border-b border-slate-800 bg-[#121722] px-4 py-2 font-mono text-xs text-slate-300">
          <span className="break-all">{file?.path}</span>
        </div>
        {content !== undefined ? (
          <pre
            tabIndex={0}
            aria-label={`Contenido de ${file?.path}`}
            className="m-0 max-h-[28rem] overflow-auto p-4 font-mono text-[13px] leading-relaxed text-slate-200 focus-visible:outline-2 focus-visible:outline-[#0ea5e9]"
          >
            {content.length > MAX_MARKDOWN_CHARS ? content.slice(0, MAX_MARKDOWN_CHARS) : content}
          </pre>
        ) : (
          <p className="m-0 p-4 text-sm text-slate-400">
            El contenido de este archivo no se descarga en esta vista. Ábrelo en el repositorio.
          </p>
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   Página de detalle
   ========================================================================== */

export interface SkillDetailPageProps {
  /** `CatalogSkill.id` seleccionado, o null si no hay ninguno. */
  skillId: string | null;
  onBack: () => void;
  /**
   * Props opcionales (no rompen la firma usada por App.tsx): la integración
   * final inyecta aquí los servicios reales y los paneles del WT3.
   */
  api?: CatalogApi;
  session?: GithubSession | null;
  onRequestLogin?: () => void;
  renderAudit?: (skill: CatalogSkill) => ReactNode;
  renderInstall?: (skill: CatalogSkill) => ReactNode;
}

type SkillState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'notfound' }
  | { status: 'ready'; skill: CatalogSkill };

type ResultsState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; results: SkillResultReport[] };

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

export function SkillDetailPage({
  skillId,
  onBack,
  api = mockCatalogApi,
  session = null,
  onRequestLogin,
  renderAudit,
  renderInstall,
}: SkillDetailPageProps) {
  const uid = useId();
  const [currentId, setCurrentId] = useState<string | null>(skillId);
  const [skillState, setSkillState] = useState<SkillState>({ status: 'idle' });
  const [resultsState, setResultsState] = useState<ResultsState>({ status: 'loading' });
  const [votes, setVotes] = useState<SkillVotes | null>(null);
  const [votesError, setVotesError] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);
  const [tab, setTab] = useState<TabId>('resumen');
  const [publishOpen, setPublishOpen] = useState(false);
  const [reload, setReload] = useState(0);
  const tabRefs = useRef<Record<TabId, HTMLButtonElement | null>>({ resumen: null, archivos: null });

  // Sincroniza con la selección que llega desde App.tsx.
  useEffect(() => {
    setCurrentId(skillId);
  }, [skillId]);

  // Carga de la skill.
  useEffect(() => {
    if (!currentId) {
      setSkillState({ status: 'idle' });
      return;
    }
    let cancelled = false;
    setSkillState({ status: 'loading' });
    setTab('resumen');
    api
      .getSkill(currentId)
      .then((skill) => {
        if (cancelled) return;
        setSkillState(skill ? { status: 'ready', skill } : { status: 'notfound' });
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setSkillState({ status: 'error', message: errorMessage(err, 'No se pudo cargar la skill.') });
      });
    return () => {
      cancelled = true;
    };
  }, [api, currentId, reload]);

  // Resultados y votos, en paralelo y con estados independientes.
  const readyId = skillState.status === 'ready' ? skillState.skill.id : null;
  const [resultsReload, setResultsReload] = useState(0);
  useEffect(() => {
    if (!readyId) return;
    let cancelled = false;
    setResultsState({ status: 'loading' });
    api
      .listResults(readyId)
      .then((results) => {
        if (!cancelled) setResultsState({ status: 'ready', results });
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setResultsState({
            status: 'error',
            message: errorMessage(err, 'No se pudieron cargar los resultados.'),
          });
      });
    return () => {
      cancelled = true;
    };
  }, [api, readyId, resultsReload]);

  useEffect(() => {
    if (!readyId) return;
    let cancelled = false;
    setVotes(null);
    setVotesError(null);
    api
      .getVotes(readyId)
      .then((v) => {
        if (!cancelled) setVotes(v);
      })
      .catch((err: unknown) => {
        if (!cancelled) setVotesError(errorMessage(err, 'No se pudieron cargar los votos.'));
      });
    return () => {
      cancelled = true;
    };
  }, [api, readyId]);

  const handleVote = useCallback(async () => {
    if (!readyId) return;
    if (!session) {
      onRequestLogin?.();
      return;
    }
    setVoting(true);
    setVotesError(null);
    try {
      setVotes(await api.toggleVote(readyId));
    } catch (err) {
      setVotesError(errorMessage(err, 'No se pudo registrar el voto.'));
    } finally {
      setVoting(false);
    }
  }, [api, readyId, session, onRequestLogin]);

  const handleReport = useCallback(
    async (input: ReportInput) => {
      const report = await api.reportResult(input);
      setResultsState((prev) =>
        prev.status === 'ready' ? { status: 'ready', results: [...prev.results, report] } : prev
      );
      return report;
    },
    [api]
  );

  const handleTabKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const idx = TABS.findIndex((t) => t.id === tab);
    let next = idx;
    if (e.key === 'ArrowRight') next = (idx + 1) % TABS.length;
    else if (e.key === 'ArrowLeft') next = (idx - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = TABS.length - 1;
    else return;
    e.preventDefault();
    setTab(TABS[next].id);
    tabRefs.current[TABS[next].id]?.focus();
  };

  const backButton = (
    <button
      type="button"
      onClick={onBack}
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border-0 bg-transparent px-1 py-1 text-sm font-medium text-[#38bdf8] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Skills
    </button>
  );

  const shell = (children: ReactNode) => (
    <section
      aria-label="Detalle de skill"
      className="mx-auto w-full max-w-[1280px] min-w-0 px-4 py-6 text-slate-300 sm:px-6"
    >
      {children}
    </section>
  );

  if (skillState.status === 'idle') {
    return shell(
      <div className="space-y-4">
        {backButton}
        <p className="m-0 rounded-xl border border-dashed border-slate-700 bg-[#121722] p-6 text-sm text-slate-400">
          No hay ninguna skill seleccionada. Vuelve al catálogo y elige una.
        </p>
      </div>
    );
  }

  if (skillState.status === 'loading') {
    return shell(
      <div className="space-y-6" role="status" aria-label="Cargando skill">
        {backButton}
        <div className="[display:grid] gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <div className="h-9 w-2/3 animate-pulse rounded-lg bg-[#121722]" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-[#121722]" />
            <div className="h-16 animate-pulse rounded-lg bg-[#121722]" />
            <div className="h-64 animate-pulse rounded-xl border border-slate-800 bg-[#121722]" />
          </div>
          <div className="h-72 animate-pulse rounded-xl border border-slate-800 bg-[#121722]" />
        </div>
      </div>
    );
  }

  if (skillState.status === 'error' || skillState.status === 'notfound') {
    const notFound = skillState.status === 'notfound';
    return shell(
      <div className="space-y-4">
        {backButton}
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded-xl border border-rose-500/40 bg-rose-950/30 p-4 text-sm text-rose-200"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            {skillState.status === 'error' ? skillState.message : 'No encontramos esta skill en el catálogo.'}
          </span>
          {!notFound && (
            <button
              type="button"
              onClick={() => setReload((n) => n + 1)}
              className="cursor-pointer rounded-lg border border-rose-400/50 bg-transparent px-3 py-1 text-xs font-semibold text-rose-100 hover:bg-rose-900/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]"
            >
              Reintentar
            </button>
          )}
        </div>
      </div>
    );
  }

  const { skill } = skillState;
  const profileUrl = safeHttpUrl(skill.author.profileUrl);
  const avatarUrl = safeHttpUrl(skill.author.avatarUrl);
  const panelId = (id: TabId) => `${uid}-panel-${id}`;
  const tabId = (id: TabId) => `${uid}-tab-${id}`;

  return shell(
    <>
      <p role="status" className="sr-only">
        Skill {skill.name} cargada
      </p>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        {backButton}
        <button
          type="button"
          onClick={() => setPublishOpen(true)}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-600 bg-transparent px-4 py-1.5 text-xs font-semibold text-slate-100 hover:border-[#0ea5e9] hover:text-[#38bdf8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Publicar una skill
        </button>
      </div>

      <div className="[display:grid] min-w-0 gap-x-8 gap-y-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Ficha lateral: primero en el DOM para móvil, columna derecha en escritorio. */}
        <div className="min-w-0 lg:col-start-2 lg:row-start-1 lg:row-span-2">
          <div className="lg:sticky lg:top-20">
            <SkillSidebar
              skill={skill}
              votes={votes}
              votesError={votesError}
              voting={voting}
              canVote={Boolean(session)}
              onVote={handleVote}
              auditSlot={renderAudit?.(skill)}
              installSlot={renderInstall?.(skill)}
            />
          </div>
        </div>

        <header className="min-w-0 lg:col-start-1 lg:row-start-1">
          <h1
            className="m-0 break-words font-mono text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl"
          >
            {skill.name}
          </h1>
          <p className="mt-2 mb-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-400">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                width={20}
                height={20}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="h-5 w-5 rounded-full border border-slate-700"
              />
            ) : (
              <span
                aria-hidden="true"
                className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-700 bg-[#121722] text-[10px] font-bold uppercase text-slate-300"
              >
                {skill.author.login.slice(0, 1)}
              </span>
            )}
            <span>por</span>
            {profileUrl ? (
              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-slate-200 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]"
              >
                @{skill.author.login}
              </a>
            ) : (
              <span className="font-semibold text-slate-200">@{skill.author.login}</span>
            )}
          </p>
          <p
            lang="en"
            className="mt-4 mb-0 max-w-[68ch] break-words text-base leading-relaxed text-slate-300"
          >
            {skill.description}
          </p>
        </header>

        <div className="min-w-0 space-y-10 lg:col-start-1 lg:row-start-2">
          <div>
            <div
              role="tablist"
              aria-label="Secciones de la skill"
              className="flex gap-1 border-b border-slate-800"
            >
              {TABS.map(({ id, label, Icon }) => {
                const active = tab === id;
                return (
                  <button
                    key={id}
                    ref={(el) => {
                      tabRefs.current[id] = el;
                    }}
                    type="button"
                    role="tab"
                    id={tabId(id)}
                    aria-selected={active}
                    aria-controls={panelId(id)}
                    tabIndex={active ? 0 : -1}
                    onClick={() => setTab(id)}
                    onKeyDown={handleTabKeyDown}
                    className={`-mb-px inline-flex cursor-pointer items-center gap-2 border-0 border-b-2 bg-transparent px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#0ea5e9] ${
                      active
                        ? 'border-b-[#0ea5e9] text-white'
                        : 'border-b-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {label}
                    {id === 'archivos' && (
                      <span className="rounded-full bg-slate-800 px-1.5 font-mono text-[11px] tabular-nums text-slate-300">
                        {skill.files.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div
              role="tabpanel"
              id={panelId('resumen')}
              aria-labelledby={tabId('resumen')}
              hidden={tab !== 'resumen'}
              tabIndex={0}
              className="pt-6 focus-visible:outline-2 focus-visible:outline-[#0ea5e9]"
            >
              {tab === 'resumen' && (
                <div className="space-y-10">
                  <article lang="en" aria-label="Contenido de SKILL.md" className="min-w-0">
                    <SafeMarkdown source={skill.markdown} />
                  </article>
                  <ResultsByModel
                    results={resultsState.status === 'ready' ? resultsState.results : []}
                    loading={resultsState.status === 'loading'}
                    error={resultsState.status === 'error' ? resultsState.message : null}
                    onRetry={() => setResultsReload((n) => n + 1)}
                  />
                  <ReportResultForm
                    key={skill.id}
                    skillId={skill.id}
                    session={session}
                    onRequestLogin={onRequestLogin}
                    onSubmit={handleReport}
                  />
                </div>
              )}
            </div>

            <div
              role="tabpanel"
              id={panelId('archivos')}
              aria-labelledby={tabId('archivos')}
              hidden={tab !== 'archivos'}
              tabIndex={0}
              className="pt-6 focus-visible:outline-2 focus-visible:outline-[#0ea5e9]"
            >
              {tab === 'archivos' && <FilesPanel key={skill.id} skill={skill} />}
            </div>
          </div>

          <MoreFromAuthor
            author={skill.author}
            currentSkillId={skill.id}
            api={api}
            onSelect={setCurrentId}
          />
        </div>
      </div>

      <PublishSkillDialog
        open={publishOpen}
        session={session}
        onClose={() => setPublishOpen(false)}
        onRequestLogin={onRequestLogin}
        onRegister={(url) => api.registerSkillFromUrl(url)}
        onRegistered={(created) => setCurrentId(created.id)}
      />
    </>
  );
}
