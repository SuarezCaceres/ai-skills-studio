import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  ExternalLink,
  FileCode2,
  FileText,
  Github,
  Loader2,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { CatalogError } from '../../services/githubCatalogService';
import type {
  CatalogApi,
  CatalogSkill,
  CatalogSkillFile,
  GithubSession,
} from '../../types/catalog';
import {
  MAX_FILE_PREVIEW_BYTES,
  isSafeSkillFilePath,
  validateSkillFilePreview,
} from '../../utils/skillAuditHelpers';
import { safeHttpUrl } from './ResultsByModel';

export interface FilesPanelProps {
  skill: CatalogSkill;
  api?: Pick<CatalogApi, 'getGithubFileAtSha' | 'getSkillFileContent'>;
  loadedContents?: Record<string, string>;
  onFileLoaded?: (filePath: string, content: string) => void;
  session?: GithubSession | null;
  onRequestLogin?: () => void;
}

type FileErrorState = {
  message: string;
  code?: string;
};

const FOCUS =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]';

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '–';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function isSkillMdPath(path: string): boolean {
  return path.toLowerCase() === 'skill.md';
}

function encodePathSegments(path: string): string {
  return path
    .split('/')
    .filter((s) => s.length > 0)
    .map(encodeURIComponent)
    .join('/');
}

function buildGithubBlobUrl(skill: CatalogSkill, filePath: string): string | null {
  if (!skill.repo || !skill.commitSha) return null;
  if (!isSafeSkillFilePath(filePath)) {
    return safeHttpUrl(`https://github.com/${skill.repo}/tree/${encodeURIComponent(skill.commitSha)}`);
  }
  const fullPath = skill.skillPath ? `${skill.skillPath}/${filePath}` : filePath;
  const encoded = encodePathSegments(fullPath);
  return safeHttpUrl(
    `https://github.com/${skill.repo}/blob/${encodeURIComponent(skill.commitSha)}/${encoded}`
  );
}

function errorDetail(err: unknown): FileErrorState {
  if (err instanceof CatalogError) {
    return { message: err.message, code: err.code };
  }
  if (err instanceof Error && err.message) {
    return { message: err.message };
  }
  return { message: 'No se pudo descargar el archivo desde GitHub.' };
}

export function FilesPanel({
  skill,
  api,
  loadedContents,
  onFileLoaded,
  session,
  onRequestLogin,
}: FilesPanelProps) {
  const files = skill.files;
  const [selected, setSelected] = useState<string>(
    () => files.find((f) => isSkillMdPath(f.path))?.path ?? files[0]?.path ?? ''
  );
  const [localContents, setLocalContents] = useState<Record<string, string>>({});
  const [loadingPath, setLoadingPath] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, FileErrorState>>({});
  const [retryTick, setRetryTick] = useState(0);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [copyFailed, setCopyFailed] = useState(false);
  const copyTimer = useRef<number | undefined>(undefined);
  const onFileLoadedRef = useRef(onFileLoaded);
  onFileLoadedRef.current = onFileLoaded;

  useEffect(() => () => window.clearTimeout(copyTimer.current), []);

  // Reinicia selección y caché local al cambiar de skill o de commit.
  useEffect(() => {
    setSelected(skill.files.find((f) => isSkillMdPath(f.path))?.path ?? skill.files[0]?.path ?? '');
    setLocalContents({});
    setLoadingPath(null);
    setErrors({});
    setCopiedPath(null);
    setCopyFailed(false);
  }, [skill.id, skill.commitSha]);

  const file: CatalogSkillFile | undefined = files.find((f) => f.path === selected) ?? files[0];
  const selectedPath = file?.path ?? '';

  const resolvedContent = (() => {
    if (!file) return undefined;
    if (loadedContents && Object.prototype.hasOwnProperty.call(loadedContents, file.path)) {
      return loadedContents[file.path];
    }
    if (Object.prototype.hasOwnProperty.call(localContents, file.path)) {
      return localContents[file.path];
    }
    if (typeof file.content === 'string') {
      return file.content;
    }
    if (isSkillMdPath(file.path)) {
      return skill.markdown;
    }
    return undefined;
  })();

  const previewValidation = file && !isSkillMdPath(file.path) ? validateSkillFilePreview(file) : { previewable: true as const };

  useEffect(() => {
    if (!file) return;
    if (isSkillMdPath(file.path)) return;
    if (!previewValidation.previewable) return;
    if (typeof resolvedContent === 'string') return;

    const loader = api?.getGithubFileAtSha
      ? () => api.getGithubFileAtSha!(skill.repo, skill.skillPath, file.path, skill.commitSha)
      : api?.getSkillFileContent
        ? () => api.getSkillFileContent!(skill.id, file.path)
        : null;

    if (!loader) {
      setErrors((prev) => ({
        ...prev,
        [file.path]: {
          message: 'La descarga bajo demanda de archivos no está disponible en este entorno.',
        },
      }));
      return;
    }

    let cancelled = false;
    const targetPath = file.path;
    setLoadingPath(targetPath);
    setErrors((prev) => {
      if (!Object.prototype.hasOwnProperty.call(prev, targetPath)) return prev;
      const next = { ...prev };
      delete next[targetPath];
      return next;
    });

    loader()
      .then((text) => {
        if (cancelled) return;
        setLocalContents((prev) => ({ ...prev, [targetPath]: text }));
        setLoadingPath((curr) => (curr === targetPath ? null : curr));
        onFileLoadedRef.current?.(targetPath, text);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setErrors((prev) => ({ ...prev, [targetPath]: errorDetail(err) }));
        setLoadingPath((curr) => (curr === targetPath ? null : curr));
      });

    return () => {
      cancelled = true;
    };
  }, [
    api,
    file?.path,
    previewValidation.previewable,
    resolvedContent,
    retryTick,
    skill.commitSha,
    skill.id,
    skill.repo,
    skill.skillPath,
  ]);

  if (files.length === 0) {
    return (
      <p className="m-0 rounded-xl border border-dashed border-slate-700 bg-[#121722] p-5 text-sm text-slate-400">
        Esta skill no lista archivos.
      </p>
    );
  }

  const githubUrl = file ? buildGithubBlobUrl(skill, file.path) : null;
  const activeError = file ? errors[file.path] : undefined;
  const isLoading = Boolean(file && loadingPath === file.path && typeof resolvedContent !== 'string');
  const displayContent =
    typeof resolvedContent === 'string'
      ? resolvedContent.length > MAX_FILE_PREVIEW_BYTES
        ? resolvedContent.slice(0, MAX_FILE_PREVIEW_BYTES)
        : resolvedContent
      : undefined;

  const handleCopy = async () => {
    if (!file || typeof displayContent !== 'string') return;
    try {
      await navigator.clipboard.writeText(displayContent);
      setCopiedPath(file.path);
      setCopyFailed(false);
      window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopiedPath(null), 2000);
    } catch {
      setCopyFailed(true);
    }
  };

  const handleRetry = () => {
    if (!file) return;
    setErrors((prev) => {
      const next = { ...prev };
      delete next[file.path];
      return next;
    });
    setRetryTick((n) => n + 1);
  };

  const showLoginCta =
    Boolean(onRequestLogin) &&
    Boolean(activeError) &&
    (activeError?.code === 'auth_required' || (activeError?.code === 'rate_limit' && !session));

  return (
    <div className="[display:grid] min-w-0 gap-4 md:grid-cols-[minmax(0,250px)_minmax(0,1fr)]">
      <ul
        aria-label="Archivos de la skill"
        className="m-0 flex list-none flex-col gap-1 overflow-hidden rounded-xl border border-slate-800 bg-[#121722] p-2"
      >
        {files.map((f) => {
          const isSelected = f.path === selectedPath;
          const isLoaded =
            isSkillMdPath(f.path) ||
            typeof f.content === 'string' ||
            Boolean(loadedContents && Object.prototype.hasOwnProperty.call(loadedContents, f.path)) ||
            Object.prototype.hasOwnProperty.call(localContents, f.path);

          return (
            <li key={f.path} className="min-w-0">
              <button
                type="button"
                onClick={() => {
                  setSelected(f.path);
                  setCopyFailed(false);
                }}
                aria-current={isSelected ? 'true' : undefined}
                className={`flex w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-lg border-0 border-l-2 px-2.5 py-1.5 text-left text-xs transition-colors ${FOCUS} ${
                  isSelected
                    ? 'border-l-[#0ea5e9] bg-[#0a0d14] text-white'
                    : 'border-l-transparent bg-transparent text-slate-400 hover:bg-[#0a0d14]/60 hover:text-slate-200'
                }`}
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  {isSkillMdPath(f.path) ? (
                    <FileText className="h-3.5 w-3.5 shrink-0 text-[#38bdf8]" aria-hidden="true" />
                  ) : (
                    <FileCode2
                      className={`h-3.5 w-3.5 shrink-0 ${isLoaded ? 'text-emerald-400' : 'text-slate-500'}`}
                      aria-hidden="true"
                    />
                  )}
                  <span className="min-w-0 truncate font-mono" title={f.path}>
                    {f.path}
                  </span>
                </span>
                <span className="shrink-0 font-mono tabular-nums text-slate-500">
                  {formatBytes(f.sizeBytes)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="min-w-0 overflow-hidden rounded-xl border border-slate-800 bg-[#0a0d14]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-[#121722] px-4 py-2 font-mono text-xs text-slate-300">
          <div className="flex min-w-0 items-center gap-2">
            <span className="break-all font-semibold text-slate-100">{file?.path}</span>
            {file && (
              <span className="shrink-0 text-[11px] tabular-nums text-slate-500">
                {formatBytes(file.sizeBytes)}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 font-sans">
            {typeof displayContent === 'string' && (
              <button
                type="button"
                onClick={handleCopy}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-700 bg-[#0a0d14] px-3 py-1 text-[11px] font-semibold text-slate-200 transition hover:border-[#0ea5e9] hover:text-[#38bdf8] ${FOCUS}`}
              >
                {copiedPath === file?.path ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                ) : (
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {copiedPath === file?.path ? 'Copiado' : 'Copiar'}
              </button>
            )}
            {githubUrl && (
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 rounded-full border border-slate-700 bg-[#0a0d14] px-3 py-1 text-[11px] font-semibold text-[#38bdf8] no-underline transition hover:border-[#0ea5e9] hover:underline ${FOCUS}`}
              >
                Ver en GitHub ({skill.commitSha.slice(0, 7)})
                <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span className="sr-only">(se abre en una pestaña nueva)</span>
              </a>
            )}
          </div>
        </div>

        {copyFailed && (
          <p role="status" aria-live="polite" className="m-0 border-b border-slate-800 bg-[#121722] px-4 py-1.5 text-xs text-amber-300">
            No se pudo copiar al portapapeles; selecciona el texto manualmente.
          </p>
        )}

        {!previewValidation.previewable ? (
          <div
            role="status"
            className="flex flex-col items-start gap-3 p-5 text-sm text-amber-200"
          >
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
              <div className="space-y-1">
                <p className="m-0 font-semibold text-amber-200">Archivo no previsualizable en el visor</p>
                <p className="m-0 text-xs leading-relaxed text-slate-300">{previewValidation.message}</p>
              </div>
            </div>
            {githubUrl && (
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-950/30 px-3.5 py-1.5 text-xs font-semibold text-amber-200 no-underline transition hover:border-amber-400 hover:text-white ${FOCUS}`}
              >
                Abrir en GitHub en el commit {skill.commitSha.slice(0, 7)}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="sr-only">(se abre en una pestaña nueva)</span>
              </a>
            )}
          </div>
        ) : isLoading ? (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-2.5 p-5 text-sm text-slate-300"
          >
            <Loader2 className="h-4 w-4 animate-spin text-[#0ea5e9]" aria-hidden="true" />
            <span>
              Descargando <code className="font-mono text-slate-100">{file?.path}</code> fijado al commit{' '}
              <code className="font-mono text-slate-100">{skill.commitSha.slice(0, 7)}</code>…
            </span>
          </div>
        ) : activeError && typeof displayContent !== 'string' ? (
          <div
            role="alert"
            className="flex flex-col items-start gap-3 p-5 text-sm text-rose-200"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" aria-hidden="true" />
              <div className="space-y-1">
                <p className="m-0 font-semibold text-rose-200">No se pudo cargar este archivo</p>
                <p className="m-0 text-xs leading-relaxed text-rose-200/90">{activeError.message}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleRetry}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-rose-400/50 bg-rose-950/40 px-3.5 py-1.5 text-xs font-semibold text-rose-100 transition hover:bg-rose-900/50 ${FOCUS}`}
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                Reintentar
              </button>
              {showLoginCta && (
                <button
                  type="button"
                  onClick={onRequestLogin}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-600 bg-[#121722] px-3.5 py-1.5 text-xs font-semibold text-slate-100 transition hover:border-[#0ea5e9] hover:text-[#38bdf8] ${FOCUS}`}
                >
                  <Github className="h-3.5 w-3.5" aria-hidden="true" />
                  Iniciar sesión con GitHub
                </button>
              )}
            </div>
          </div>
        ) : typeof displayContent === 'string' ? (
          <pre
            tabIndex={0}
            aria-label={`Contenido de ${file?.path}`}
            className="m-0 max-h-[28rem] overflow-auto whitespace-pre-wrap break-words p-4 font-mono text-[13px] leading-relaxed text-slate-200 focus-visible:outline-2 focus-visible:outline-[#0ea5e9]"
          >
            {displayContent.length > 0 ? displayContent : '(Archivo vacío)'}
          </pre>
        ) : (
          <p className="m-0 p-4 text-sm text-slate-400">
            Selecciona un archivo para inspeccionar su contenido como texto plano.
          </p>
        )}
      </div>
    </div>
  );
}

export default FilesPanel;
