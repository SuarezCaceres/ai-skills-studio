import React, { useState, useRef } from 'react';
import { SkillDocument, ScreenshotEvidence } from '../types/skill';
import {
  Cpu,
  Image as ImageIcon,
  Code,
  Plus,
  Trash2,
  UploadCloud,
  Maximize2,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';

interface ContextEvidenceLoggerProps {
  skill: SkillDocument;
  onUpdateSkill: (skill: SkillDocument) => void;
  onStatusChange: (status: string | null) => void;
}

export const ContextEvidenceLogger: React.FC<ContextEvidenceLoggerProps> = ({
  skill,
  onUpdateSkill,
  onStatusChange,
}) => {
  const [modelName, setModelName] = useState('Gemini 2.5 Pro / Ultra');
  const [modelStatus, setModelStatus] = useState<'optimal' | 'compatible' | 'needs-tuning'>(
    'optimal'
  );
  const [modelNotes, setModelNotes] = useState('');

  const [screenshotTitle, setScreenshotTitle] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [selectedScreenshot, setSelectedScreenshot] = useState<ScreenshotEvidence | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [snippetTitle, setSnippetTitle] = useState('');
  const [snippetLang, setSnippetLang] = useState('tsx');
  const [snippetCode, setSnippetCode] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getProviderName = (name: string) => {
    if (name.includes('Gemini')) return 'Google DeepMind';
    if (name.includes('Claude')) return 'Anthropic';
    if (name.includes('GPT')) return 'OpenAI';
    return 'Open Weights / Custom';
  };

  const handleAddModel = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSkill({
      ...skill,
      models: [
        {
          id: `model-${Date.now()}`,
          modelName,
          provider: getProviderName(modelName),
          testedAt: new Date().toLocaleDateString(),
          status: modelStatus,
          notes:
            modelNotes.trim() ||
            `Probado exitosamente con las instrucciones de ${skill.filename}.`,
        },
        ...skill.models,
      ],
    });
    setModelNotes('');
    onStatusChange(`Modelo ${modelName} vinculado a ${skill.filename}`);
    setTimeout(() => onStatusChange(null), 2200);
  };

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = String(ev.target?.result || '');
      const title = screenshotTitle.trim() || file.name.replace(/\.[^.]+$/, '');
      onUpdateSkill({
        ...skill,
        screenshots: [
          {
            id: `shot-${Date.now()}`,
            title,
            dataUrl,
            createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            modelUsed: modelName,
          },
          ...skill.screenshots,
        ],
      });
      setScreenshotTitle('');
      onStatusChange(`Captura "${title}" añadida a la galería flotante`);
      setTimeout(() => onStatusChange(null), 2200);
    };
    reader.readAsDataURL(file);
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImageFile(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) processImageFile(file);
        break;
      }
    }
  };

  const openModalPreview = (shot: ScreenshotEvidence) => {
    setSelectedScreenshot(shot);
    setTimeout(() => {
      dialogRef.current?.showModal();
    }, 0);
  };

  const handleAddSnippet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!snippetCode.trim()) return;
    const title = snippetTitle.trim() || `Snippet ${snippetLang.toUpperCase()}`;
    onUpdateSkill({
      ...skill,
      codeSnippets: [
        {
          id: `code-${Date.now()}`,
          title,
          language: snippetLang,
          code: snippetCode,
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: modelName,
        },
        ...skill.codeSnippets,
      ],
    });
    setSnippetTitle('');
    setSnippetCode('');
    onStatusChange(`Fragmento de código "${title}" adjuntado`);
    setTimeout(() => onStatusChange(null), 2200);
  };

  return (
    <section
      aria-labelledby="context-evidence-heading"
      onPaste={handlePaste}
      className="space-y-8"
    >
      {/* Cabecera de la Galería del Sistema y Capturas del Núcleo */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-800/90 pb-5">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#38BDF8]">
            <Sparkles className="w-3.5 h-3.5 text-[#0EA5E9]" aria-hidden="true" />
            GALERÍA DEL SISTEMA · CAPTURAS DEL NÚCLEO UI/UX
          </span>
          <h1
            id="context-evidence-heading"
            className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white"
          >
            Galería del Sistema y Capturas del Núcleo
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl">
            Adjunta capturas del núcleo visual y fragmentos de código ejecutados con previsualización flotante en Azul Noche, zoom a pantalla completa y asociación con el Cortex de Modelos.
          </p>
        </div>
      </div>

      {/* Galería Showcase de 2 Columnas en Cyber Dark y Cian */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna A: Subida y Previsualización Flotante de Capturas del Núcleo */}
        <div className="rounded-3xl bg-[#0F172A] border border-[#0EA5E9]/35 p-5 sm:p-6 cyan-glow flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#0EA5E9]" aria-hidden="true" />
              Capturas del Núcleo (Galería Visual UI/UX)
            </h2>
            <span className="text-[11px] font-medium text-slate-400">
              Arrastra imagen o pega con{' '}
              <kbd className="px-1.5 py-0.5 bg-[#0B0F19] border border-[#0EA5E9]/40 rounded text-[#38BDF8] font-mono">
                Ctrl+V
              </kbd>
            </span>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingOver(true);
            }}
            onDragLeave={() => setIsDraggingOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-4 transition flex flex-wrap items-center gap-2.5 ${
              isDraggingOver
                ? 'border-[#0EA5E9] bg-[#0EA5E9]/10 cyan-glow-sm'
                : 'border-zinc-800 bg-[#0B0B0B]/90 hover:border-[#0EA5E9]/60'
            }`}
          >
            <label htmlFor="screenshot-title-input" className="sr-only">
              Descripción de la captura de pantalla
            </label>
            <input
              id="screenshot-title-input"
              type="text"
              value={screenshotTitle}
              onChange={(e) => setScreenshotTitle(e.target.value)}
              placeholder="Etiqueta de la captura (ej. Ejecución en Gemini Ultra)..."
              className="flex-1 min-w-[180px] h-10 bg-[#121212] border border-zinc-800 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-[#0EA5E9]"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleScreenshotUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-10 px-4 bg-gradient-to-r from-[#0EA5E9] to-[#0EA5E9] text-black rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer shrink-0"
            >
              <UploadCloud className="w-4 h-4" aria-hidden="true" />
              <span>Subir Pantallazo</span>
            </button>
          </div>

          {/* Tarjetas Flotantes Estilizadas con Zoom y Eliminación Rápida */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-1">
            {skill.screenshots.map((shot) => (
              <figure
                key={shot.id}
                className="bg-[#0B0B0B] border border-zinc-800 hover:border-[#0EA5E9] rounded-2xl overflow-hidden flex flex-col group transition duration-200 hover:-translate-y-1 cyan-glow-sm"
              >
                <div className="relative overflow-hidden bg-zinc-950">
                  <img
                    src={shot.dataUrl}
                    alt={shot.title}
                    width={640}
                    height={360}
                    loading="lazy"
                    className="w-full h-40 object-cover group-hover:scale-[1.03] transition duration-300"
                  />
                  {/* Controles Flotantes de Zoom y Eliminación Rápida */}
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openModalPreview(shot)}
                      aria-label={`Hacer zoom en captura ${shot.title}`}
                      title="Zoom a pantalla completa"
                      className="p-2 rounded-xl bg-[#0B0B0B]/90 border border-[#0EA5E9]/50 text-[#0EA5E9] hover:bg-[#0EA5E9] hover:text-black transition cursor-pointer"
                    >
                      <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateSkill({
                          ...skill,
                          screenshots: skill.screenshots.filter((s) => s.id !== shot.id),
                        });
                        onStatusChange(`Captura "${shot.title}" eliminada`);
                        setTimeout(() => onStatusChange(null), 1800);
                      }}
                      aria-label={`Eliminación rápida de captura ${shot.title}`}
                      title="Eliminación rápida"
                      className="p-2 rounded-xl bg-[#0B0B0B]/90 border border-rose-500/40 text-rose-400 hover:bg-rose-600 hover:text-white transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <figcaption className="p-3 text-xs flex items-center justify-between gap-2 bg-[#121212] border-t border-zinc-800/80">
                  <div className="min-w-0">
                    <div className="font-bold text-white truncate">{shot.title}</div>
                    <div className="text-[11px] font-mono text-[#0EA5E9]">
                      {shot.modelUsed} · {shot.createdAt}
                    </div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>

        {/* Columna B: Subida de Fragmentos de Código Relacionados */}
        <div className="rounded-3xl bg-[#121212] border border-zinc-800 p-5 sm:p-6 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Code className="w-5 h-5 text-[#0EA5E9]" aria-hidden="true" />
              Fragmentos de Código Implementados
            </h2>
            <span className="text-[11px] font-mono text-[#0EA5E9]">
              {skill.codeSnippets.length} guardados
            </span>
          </div>

          <form
            onSubmit={handleAddSnippet}
            className="space-y-2.5 bg-[#0B0B0B] border border-zinc-800 rounded-2xl p-3.5"
          >
            <div className="flex flex-wrap gap-2">
              <label htmlFor="snippet-title-input" className="sr-only">
                Título del fragmento de código
              </label>
              <input
                id="snippet-title-input"
                type="text"
                value={snippetTitle}
                onChange={(e) => setSnippetTitle(e.target.value)}
                placeholder="Título del código (ej. Hook o Componente generado)..."
                className="flex-1 min-w-[180px] h-9 bg-[#121212] border border-zinc-800 rounded-xl px-3 text-xs text-white"
              />
              <label htmlFor="snippet-lang-select" className="sr-only">
                Lenguaje de programación
              </label>
              <select
                id="snippet-lang-select"
                value={snippetLang}
                onChange={(e) => setSnippetLang(e.target.value)}
                className="h-9 bg-[#121212] border border-zinc-800 rounded-xl px-3 text-xs font-mono font-bold text-[#0EA5E9] cursor-pointer"
              >
                <option value="tsx">TSX / React</option>
                <option value="typescript">TypeScript</option>
                <option value="css">CSS</option>
                <option value="json">JSON</option>
                <option value="bash">Bash / CLI</option>
              </select>
            </div>

            <label htmlFor="snippet-code-textarea" className="sr-only">
              Código fuente de evidencia
            </label>
            <textarea
              id="snippet-code-textarea"
              rows={3}
              value={snippetCode}
              onChange={(e) => setSnippetCode(e.target.value)}
              placeholder="Pega aquí el fragmento de código que la IA está implementando o ejecutando..."
              className="w-full bg-[#121212] border border-zinc-800 rounded-xl p-2.5 text-xs font-mono text-zinc-100 focus:outline-none focus:border-[#0EA5E9]"
            />

            <div className="flex justify-end">
              <button
                type="submit"
                className="h-9 px-4 bg-gradient-to-r from-[#0EA5E9] to-[#0EA5E9] text-black rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Adjuntar Código</span>
              </button>
            </div>
          </form>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {skill.codeSnippets.map((snip) => (
              <figure
                key={snip.id}
                className="bg-[#0B0B0B] text-zinc-100 rounded-2xl p-3.5 border border-zinc-800"
              >
                <figcaption className="text-xs font-semibold text-zinc-200 mb-2 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 truncate">
                    <span className="truncate">{snip.title}</span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#0EA5E9]/15 text-[#0EA5E9] border border-[#0EA5E9]/30">
                      {snip.language}
                    </span>
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-zinc-500">{snip.modelUsed}</span>
                    <button
                      type="button"
                      onClick={async () => {
                        await navigator.clipboard.writeText(snip.code);
                        setCopiedId(snip.id);
                        setTimeout(() => setCopiedId(null), 1500);
                      }}
                      aria-label={`Copiar código ${snip.title}`}
                      className="text-zinc-400 hover:text-white flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      {copiedId === snip.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateSkill({
                          ...skill,
                          codeSnippets: skill.codeSnippets.filter((c) => c.id !== snip.id),
                        })
                      }
                      aria-label={`Eliminar fragmento ${snip.title}`}
                      className="text-zinc-400 hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </figcaption>
                <pre
                  tabIndex={0}
                  className="bg-[#121212] rounded-xl p-3 text-[11px] font-mono text-zinc-100 overflow-x-auto whitespace-pre-wrap"
                >
                  <code>{snip.code}</code>
                </pre>
              </figure>
            ))}
          </div>
        </div>
      </div>

      {/* Registro Rápido de Modelos Asociados a esta Skill */}
      <div className="rounded-3xl bg-[#121212] border border-zinc-800 p-5 sm:p-6 space-y-4">
        <h2 className="text-base font-extrabold text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-[#0EA5E9]" aria-hidden="true" />
          Bitácora de Modelos IA Probados con {skill.filename}
        </h2>

        <form onSubmit={handleAddModel} className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
          <div className="md:col-span-3">
            <label htmlFor="ai-model-select" className="sr-only">
              Modelo de Inteligencia Artificial
            </label>
            <select
              id="ai-model-select"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="w-full h-10 bg-[#0B0B0B] border border-zinc-800 rounded-xl px-3 text-xs font-bold text-white cursor-pointer"
            >
              <option value="Gemini 2.5 Pro / Ultra">Gemini (Ultra / Máximo)</option>
              <option value="Claude 3.7 Sonnet">Claude / Sonnet (Máximo / Alto)</option>
              <option value="Claude 4 Opus">Claude / Opus (Ultra)</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <label htmlFor="ai-status-select" className="sr-only">
              Resultado de compatibilidad
            </label>
            <select
              id="ai-status-select"
              value={modelStatus}
              onChange={(e) =>
                setModelStatus(e.target.value as 'optimal' | 'compatible' | 'needs-tuning')
              }
              className="w-full h-10 bg-[#0B0B0B] border border-zinc-800 rounded-xl px-3 text-xs font-bold text-white cursor-pointer"
            >
              <option value="optimal">Rendimiento Ultra / Óptimo</option>
              <option value="compatible">Compatible</option>
              <option value="needs-tuning">Requiere Ajuste</option>
            </select>
          </div>

          <div className="md:col-span-4">
            <label htmlFor="ai-notes-input" className="sr-only">
              Notas de comportamiento del modelo
            </label>
            <input
              id="ai-notes-input"
              type="text"
              value={modelNotes}
              onChange={(e) => setModelNotes(e.target.value)}
              placeholder="Observaciones de rendimiento con este modelo..."
              className="w-full h-10 bg-[#0B0B0B] border border-zinc-800 rounded-xl px-3.5 text-xs text-white"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full h-10 bg-gradient-to-r from-[#0EA5E9] to-[#0EA5E9] text-black rounded-xl px-4 text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Registrar</span>
            </button>
          </div>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {skill.models.map((m) => (
            <div
              key={m.id}
              className="bg-[#0B0B0B] border border-zinc-800 rounded-2xl p-3.5 flex items-start justify-between gap-2"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-xs font-bold text-white">{m.modelName}</strong>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#0EA5E9]/15 text-[#0EA5E9] border border-[#0EA5E9]/40">
                    {m.status === 'optimal' ? 'ULTRA / ÓPTIMO' : 'COMPATIBLE'}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">{m.notes}</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onUpdateSkill({
                    ...skill,
                    models: skill.models.filter((item) => item.id !== m.id),
                  })
                }
                aria-label={`Eliminar registro de ${m.modelName}`}
                className="text-zinc-500 hover:text-rose-400 p-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Modal nativo <dialog closedby="any"> para Zoom Flotante de Capturas */}
      <dialog
        ref={dialogRef}
        {...({ closedby: 'any' } as any)}
        className="backdrop:bg-black/85 bg-[#121212] border border-[#0EA5E9]/50 text-white rounded-3xl p-5 max-w-3xl w-full cyan-glow m-auto"
      >
        {selectedScreenshot && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-white">{selectedScreenshot.title}</h3>
                <p className="text-xs text-[#0EA5E9] font-mono">
                  Modelo asociado: {selectedScreenshot.modelUsed} · {selectedScreenshot.createdAt}
                </p>
              </div>
              <form method="dialog">
                <button
                  value="close"
                  className="px-4 py-1.5 text-xs font-extrabold bg-[#0EA5E9] text-black rounded-full cursor-pointer"
                >
                  Cerrar Zoom (Esc)
                </button>
              </form>
            </div>
            <img
              src={selectedScreenshot.dataUrl}
              alt={selectedScreenshot.title}
              width={800}
              height={450}
              className="w-full rounded-2xl border border-zinc-800"
            />
          </div>
        )}
      </dialog>
    </section>
  );
};
