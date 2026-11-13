import { Fragment, useMemo } from 'react';
import type { ReactNode } from 'react';
import { safeHttpUrl } from './ResultsByModel';

/* ==========================================================================
   Render de Markdown NO confiable
   Se construye con elementos de React (nunca `dangerouslySetInnerHTML`):
   el HTML crudo se muestra como texto, los enlaces solo admiten http(s),
   las imágenes no se cargan (se muestran como texto) y no se ejecuta nada.
   ========================================================================== */

export const MAX_MARKDOWN_CHARS = 200_000;

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

export function SafeMarkdown({ source }: { source: string }) {
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
