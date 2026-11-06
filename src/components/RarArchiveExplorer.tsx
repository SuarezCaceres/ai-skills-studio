import React, { useState, useRef } from 'react';
import { RarArchivePackage, RarFileEntry, CodeLanguage } from '../types/workspace';
import { DEFAULT_RAR_PACKAGE, parseUploadedRarFile } from '../services/rarParserService';
import {
  FolderArchive,
  FolderOpen,
  Folder,
  FileCode2,
  UploadCloud,
  Copy,
  Check,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Terminal,
  RefreshCw,
} from 'lucide-react';

interface RarArchiveExplorerProps {
  onStatusChange: (status: string | null) => void;
}

export const RarArchiveExplorer: React.FC<RarArchiveExplorerProps> = ({
  onStatusChange,
}) => {
  const [archive, setArchive] = useState<RarArchivePackage>(DEFAULT_RAR_PACKAGE);
  const [selectedFileId, setSelectedFileId] = useState<string>(
    DEFAULT_RAR_PACKAGE.files[0]?.id || ''
  );
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'src/components': true,
    'src/styles': true,
    'src/services': true,
    config: true,
    docs: true,
  });
  const [langFilter, setLangFilter] = useState<'all' | CodeLanguage>('all');
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [copiedFile, setCopiedFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredFiles = archive.files.filter(
    (f) => langFilter === 'all' || f.language === langFilter
  );

  const selectedFile: RarFileEntry =
    archive.files.find((f) => f.id === selectedFileId) ||
    filteredFiles[0] ||
    archive.files[0];

  const folders = Array.from(new Set(filteredFiles.map((f) => f.folder)));

  const handleRarFileProcess = async (file: File) => {
    setIsExtracting(true);
    onStatusChange(`Descomprimiendo paquete ${file.name} en memoria...`);
    await new Promise((r) => setTimeout(r, 850));

    const parsed = await parseUploadedRarFile(file);
    setArchive(parsed);
    setSelectedFileId(parsed.files[0]?.id || '');

    const folderMap: Record<string, boolean> = {};
    parsed.files.forEach((f) => {
      folderMap[f.folder] = true;
    });
    setExpandedFolders(folderMap);

    setIsExtracting(false);
    onStatusChange(
      `Paquete ${parsed.archiveName} descomprimido (${parsed.files.length} archivos en árbol)`
    );
    setTimeout(() => onStatusChange(null), 3000);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleRarFileProcess(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleRarFileProcess(file);
    e.target.value = '';
  };

  const toggleFolder = (folderName: string) => {
    setExpandedFolders((prev) => ({ ...prev, [folderName]: !prev[folderName] }));
  };

  const getLangBadge = (lang: CodeLanguage) => {
    switch (lang) {
      case 'tsx':
        return { label: 'TSX', color: 'text-[#0EA5E9] bg-[#0EA5E9]/15 border-[#0EA5E9]/40' };
      case 'typescript':
        return { label: 'TS', color: 'text-sky-300 bg-sky-500/15 border-sky-500/30' };
      case 'css':
        return { label: 'CSS', color: 'text-sky-300 bg-sky-500/15 border-sky-500/40' };
      case 'json':
        return { label: 'JSON', color: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/40' };
      default:
        return { label: 'MD', color: 'text-zinc-300 bg-zinc-800 border-zinc-700' };
    }
  };

  // Resaltador de sintaxis ligero y seguro para TypeScript, TSX, CSS y JSON
  const renderHighlightedLine = (line: string, lang: CodeLanguage) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      return <span className="text-zinc-500 italic">{line}</span>;
    }
    if (lang === 'css') {
      if (trimmed.startsWith('.') || trimmed.startsWith(':root') || trimmed === '}') {
        return <span className="text-[#0EA5E9] font-semibold">{line}</span>;
      }
      if (line.includes(':')) {
        const [prop, ...rest] = line.split(':');
        return (
          <>
            <span className="text-sky-300">{prop}</span>:
            <span className="text-sky-200">{rest.join(':')}</span>
          </>
        );
      }
    }

    // Coloreado de keywords de TypeScript / React TSX / JSON
    const tokenRegex =
      /(\b(?:import|from|export|const|let|function|return|interface|type|async|await|if|throw|new)\b|'[^']*'|"[^"]*"|`[^`]*`|#[0-9A-Fa-f]{6}|\b\d+\b)/g;
    const parts = line.split(tokenRegex);

    return parts.map((part, idx) => {
      if (
        /^(import|from|export|const|let|function|return|interface|type|async|await|if|throw|new)$/.test(
          part
        )
      ) {
        return (
          <span key={idx} className="text-[#0EA5E9] font-semibold">
            {part}
          </span>
        );
      }
      if (/^('[^']*'|"[^"]*"|`[^`]*`)$/.test(part)) {
        return (
          <span key={idx} className="text-emerald-300">
            {part}
          </span>
        );
      }
      if (/^#[0-9A-Fa-f]{6}$/.test(part)) {
        return (
          <span
            key={idx}
            className="px-1.5 py-0.2 rounded font-bold text-black bg-[#0EA5E9]"
          >
            {part}
          </span>
        );
      }
      if (/^\d+$/.test(part)) {
        return (
          <span key={idx} className="text-sky-300">
            {part}
          </span>
        );
      }
      return <React.Fragment key={idx}>{part}</React.Fragment>;
    });
  };

  return (
    <section aria-labelledby="rar-explorer-heading" className="space-y-6">
      {/* Cabecera de la Página del Explorador .RAR */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-800/90 pb-5">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#0EA5E9]">
            <FolderArchive className="w-3.5 h-3.5 text-[#0EA5E9]" aria-hidden="true" />
            DESCOMPRESOR EN MEMORIA &amp; EXPLORADOR DE ÁRBOL (.RAR)
          </span>
          <h1
            id="rar-explorer-heading"
            className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white"
          >
            Gestor de Paquetes .RAR e Inspector de Código
          </h1>
          <p className="text-sm text-zinc-400 max-w-2xl">
            Arrastra y suelta cualquier archivo comprimido <code className="text-[#0EA5E9]">.rar</code>{' '}
            para descomprimir su estructura en árbol e inspeccionar sus módulos por lenguaje (CSS, TypeScript, TSX, JSON) con resaltado de sintaxis.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setArchive(DEFAULT_RAR_PACKAGE);
            setSelectedFileId(DEFAULT_RAR_PACKAGE.files[0].id);
            onStatusChange('Paquete de demostración ai-skills-core-architecture-v2.rar restaurado');
            setTimeout(() => onStatusChange(null), 2200);
          }}
          className="h-10 px-4 rounded-xl bg-[#121212] hover:bg-zinc-900 border border-[#0EA5E9]/40 text-xs font-bold text-[#0EA5E9] flex items-center gap-2 transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Recargar .RAR Base</span>
        </button>
      </div>

      {/* Zona Drag and Drop para subir archivos .RAR */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`rounded-3xl p-6 border-2 border-dashed transition duration-200 flex flex-wrap items-center justify-between gap-4 ${
          isDragging
            ? 'border-[#0EA5E9] bg-[#0EA5E9]/10 cyan-glow'
            : 'border-[#0EA5E9]/35 bg-[#121212] hover:border-[#0EA5E9]/70'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#0EA5E9]/15 border border-[#0EA5E9]/40 flex items-center justify-center shrink-0 cyan-glow-sm">
            <UploadCloud
              className={`w-7 h-7 text-[#0EA5E9] ${isExtracting ? 'animate-bounce' : ''}`}
              aria-hidden="true"
            />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-extrabold text-white">
                {isExtracting
                  ? 'Descomprimiendo flujo binario .RAR...'
                  : 'Arrastra y suelta tu paquete .RAR aquí'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#0EA5E9]/20 text-[#0EA5E9] border border-[#0EA5E9]/40">
                RAR4 / RAR5 Soportado
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Paquete activo:{' '}
              <strong className="text-white font-mono">{archive.archiveName}</strong> ·{' '}
              {(archive.totalSizeBytes / 1024).toFixed(1)} KB · {archive.signatureDetected}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".rar,.zip,.7z,.tar"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="h-11 px-5 rounded-xl bg-gradient-to-r from-[#0EA5E9] to-[#0EA5E9] hover:from-[#0EA5E9] hover:to-[#0EA5E9] text-black font-extrabold text-xs flex items-center gap-2 cyan-glow transition cursor-pointer"
          >
            <FolderArchive className="w-4 h-4" aria-hidden="true" />
            <span>Seleccionar Archivo .RAR</span>
          </button>
        </div>
      </div>

      {/* Filtros por Lenguaje (Todos, TSX, TypeScript, CSS, JSON, Markdown) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: 'all', label: 'Todos los archivos' },
              { id: 'tsx', label: 'React TSX (.tsx)' },
              { id: 'typescript', label: 'TypeScript (.ts)' },
              { id: 'css', label: 'Estilos CSS (.css)' },
              { id: 'json', label: 'Config JSON (.json)' },
              { id: 'markdown', label: 'Docs (.md)' },
            ] as const
          ).map((item) => {
            const active = langFilter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setLangFilter(item.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  active
                    ? 'bg-[#0EA5E9] text-black border-[#0EA5E9] cyan-glow-sm'
                    : 'bg-[#121212] text-zinc-300 border-zinc-800 hover:border-[#0EA5E9]/50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <span className="text-xs font-mono text-zinc-400">
          {filteredFiles.length} archivos en el árbol
        </span>
      </div>

      {/* Layout Principal del IDE: Explorador de Árbol Izquierdo + Visor de Código con Syntax Highlighting Derecho */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Árbol de Archivos Descomprimido */}
        <aside
          aria-label="Explorador de archivos en árbol del paquete .rar"
          className="lg:col-span-4 rounded-2xl bg-[#121212] border border-zinc-800/90 overflow-hidden shadow-xl"
        >
          <div className="px-4 py-3 bg-[#0B0B0B] border-b border-zinc-800 flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#0EA5E9]" aria-hidden="true" />
              <span className="truncate">{archive.archiveName}</span>
            </span>
            <span className="text-[10px] font-mono text-[#0EA5E9]">TREE VIEW</span>
          </div>

          <div className="p-3 space-y-2 max-h-[480px] overflow-y-auto">
            {folders.map((folderName) => {
              const isExpanded = expandedFolders[folderName] ?? true;
              const filesInFolder = filteredFiles.filter((f) => f.folder === folderName);

              return (
                <div key={folderName} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => toggleFolder(folderName)}
                    className="w-full px-2.5 py-1.5 rounded-lg hover:bg-zinc-900 text-xs font-bold text-zinc-200 flex items-center gap-2 transition cursor-pointer"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-[#0EA5E9]" aria-hidden="true" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
                    )}
                    {isExpanded ? (
                      <FolderOpen className="w-4 h-4 text-[#0EA5E9]" aria-hidden="true" />
                    ) : (
                      <Folder className="w-4 h-4 text-[#0EA5E9]" aria-hidden="true" />
                    )}
                    <span className="font-mono">{folderName}/</span>
                  </button>

                  {isExpanded && (
                    <ul className="pl-6 space-y-1 border-l border-zinc-800 ml-4">
                      {filesInFolder.map((file) => {
                        const isSelected = file.id === selectedFile.id;
                        const badge = getLangBadge(file.language);
                        return (
                          <li key={file.id}>
                            <button
                              type="button"
                              onClick={() => setSelectedFileId(file.id)}
                              className={`w-full px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2 transition cursor-pointer ${
                                isSelected
                                  ? 'bg-[#0EA5E9]/15 text-white border border-[#0EA5E9]/50 font-bold'
                                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/70'
                              }`}
                            >
                              <span className="flex items-center gap-2 truncate">
                                <FileCode2
                                  className={`w-3.5 h-3.5 shrink-0 ${
                                    isSelected ? 'text-[#0EA5E9]' : 'text-zinc-500'
                                  }`}
                                  aria-hidden="true"
                                />
                                <span className="truncate font-mono">{file.name}</span>
                              </span>
                              <span
                                className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${badge.color}`}
                              >
                                {badge.label}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* Inspector de Código con Resaltado de Sintaxis (Syntax Highlighting) */}
        <div className="lg:col-span-8 rounded-2xl bg-[#121212] border border-[#0EA5E9]/30 overflow-hidden cyan-glow">
          <div className="px-5 py-3.5 bg-[#0B0B0B] border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5" aria-hidden="true">
                <span className="w-3 h-3 rounded-full bg-[#0EA5E9]" />
                <span className="w-3 h-3 rounded-full bg-[#0EA5E9]" />
                <span className="w-3 h-3 rounded-full bg-zinc-700" />
              </span>
              <span className="text-xs font-mono font-bold text-white">
                {selectedFile.path}
              </span>
              <span className="text-[11px] font-mono text-zinc-500">
                ({(selectedFile.sizeBytes / 1024).toFixed(2)} KB)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md text-[10px] font-mono uppercase bg-[#0EA5E9]/15 text-[#0EA5E9] border border-[#0EA5E9]/30">
                Syntax Highlighting: {selectedFile.language.toUpperCase()}
              </span>
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(selectedFile.content);
                  setCopiedFile(true);
                  setTimeout(() => setCopiedFile(false), 1800);
                }}
                className="px-3 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 cursor-pointer"
              >
                {copiedFile ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#0EA5E9]" aria-hidden="true" />
                    <span>Copiar Código</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <figure className="p-0 m-0">
            <pre
              tabIndex={0}
              className="p-5 bg-[#0B0B0B] text-xs font-mono text-zinc-200 overflow-x-auto max-h-[480px] leading-relaxed focus:outline-none"
            >
              <code>
                {selectedFile.content.split('\n').map((line, i) => (
                  <div
                    key={i}
                    className="table-row hover:bg-[#121212] transition-colors"
                  >
                    <span
                      className="table-cell pr-4 text-right text-zinc-600 select-none w-10"
                      aria-hidden="true"
                    >
                      {i + 1}
                    </span>
                    <span className="table-cell whitespace-pre">
                      {renderHighlightedLine(line, selectedFile.language)}
                    </span>
                  </div>
                ))}
              </code>
            </pre>
            <figcaption className="px-5 py-2.5 bg-[#121212] border-t border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#0EA5E9]" aria-hidden="true" />
                Inspeccionando archivo extraído en memoria desde{' '}
                <strong className="text-white">{archive.archiveName}</strong>
              </span>
              <span className="font-mono text-[#0EA5E9]">UTF-8 · LF</span>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
};
