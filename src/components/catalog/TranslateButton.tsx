import React, { useEffect, useRef, useState } from 'react';
import { KeyRound, Languages, Loader2, Undo2 } from 'lucide-react';
import {
  TranslationUnavailableError,
  getNativeTranslationSupport,
  translateMarkdownToSpanish,
  type NativeSupport,
  type TranslationEngine,
} from '../../services/translationService';

interface TranslateButtonProps {
  /** Markdown original (en inglés) que se traduce. Se trata como texto no confiable. */
  markdown: string;
  /**
   * Recibe el texto en español, o `null` cuando la persona vuelve al original.
   * El componente padre decide dónde mostrarlo (siempre sanitizado).
   */
  onChange: (translated: string | null) => void;
  className?: string;
}

export const TranslateButton: React.FC<TranslateButtonProps> = ({ markdown, onChange, className }) => {
  const [support, setSupport] = useState<NativeSupport | 'checking'>('checking');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [translated, setTranslated] = useState(false);
  const [engine, setEngine] = useState<TranslationEngine | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [needsKey, setNeedsKey] = useState(false);
  // La clave vive solo en memoria de este componente: nunca se guarda en disco.
  const [apiKey, setApiKey] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let alive = true;
    void getNativeTranslationSupport().then((s) => alive && setSupport(s));
    return () => {
      alive = false;
      abortRef.current?.abort();
    };
  }, []);

  // Si cambia la skill mostrada, se descarta la traducción anterior.
  useEffect(() => {
    abortRef.current?.abort();
    setTranslated(false);
    setBusy(false);
    setProgress(null);
    setMessage(null);
  }, [markdown]);

  const run = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    setMessage(null);
    setProgress(null);
    try {
      const result = await translateMarkdownToSpanish(markdown, {
        apiKey,
        signal: controller.signal,
        onProgress: (done, total) => setProgress({ done, total }),
      });
      if (controller.signal.aborted) return;
      if (result.alreadySpanish) {
        setMessage('El contenido ya está en español.');
        return;
      }
      setEngine(result.engine);
      setTranslated(true);
      setNeedsKey(false);
      onChange(result.text);
    } catch (err) {
      if (controller.signal.aborted || (err instanceof DOMException && err.name === 'AbortError')) return;
      if (err instanceof TranslationUnavailableError) {
        setNeedsKey(true);
        setMessage(err.message);
      } else {
        setMessage(err instanceof Error ? err.message : 'No se pudo traducir.');
      }
    } finally {
      if (abortRef.current === controller) setBusy(false);
    }
  };

  const restore = () => {
    setTranslated(false);
    setMessage(null);
    onChange(null);
  };

  const label = busy
    ? progress
      ? `Traduciendo ${progress.done}/${progress.total}`
      : support === 'downloadable'
        ? 'Preparando el modelo de traducción'
        : 'Traduciendo'
    : 'Traducir al español';

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        {translated ? (
          <button
            type="button"
            onClick={restore}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-[#121722] px-3 py-2 text-sm font-medium text-slate-100 transition hover:border-[#0ea5e9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]"
          >
            <Undo2 className="h-4 w-4" aria-hidden="true" />
            Ver original
          </button>
        ) : (
          <button
            type="button"
            onClick={run}
            disabled={busy || !markdown.trim()}
            aria-busy={busy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-[#121722] px-3 py-2 text-sm font-medium text-slate-100 transition hover:border-[#0ea5e9] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Languages className="h-4 w-4 text-[#0ea5e9]" aria-hidden="true" />
            )}
            {label}
          </button>
        )}
        {translated && engine && (
          <span className="font-mono text-xs text-slate-400">
            Traducido con {engine === 'native' ? 'el navegador' : 'Gemini'}
          </span>
        )}
      </div>

      {needsKey && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-slate-300" htmlFor="translate-gemini-key">
            <KeyRound className="h-3.5 w-3.5 text-[#0ea5e9]" aria-hidden="true" />
            Clave de Gemini
          </label>
          <input
            id="translate-gemini-key"
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Solo se usa en esta pestaña"
            className="w-56 rounded-md border border-slate-700 bg-[#0a0d14] px-2 py-1.5 font-mono text-xs text-slate-100 placeholder:text-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0ea5e9]"
          />
        </div>
      )}

      <p className="mt-1.5 min-h-4 text-xs text-slate-400" role="status" aria-live="polite">
        {message}
      </p>
    </div>
  );
};

export default TranslateButton;
