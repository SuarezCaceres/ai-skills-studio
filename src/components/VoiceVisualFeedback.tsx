import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Star,
  Sparkles,
  Volume2,
  CheckCircle2,
  MessageSquarePlus,
  Trash2,
} from 'lucide-react';
import {
  SpecificModelVersion,
  VisualFeedbackReview,
} from '../types/workspace';
import { INITIAL_VISUAL_FEEDBACK_REVIEWS } from '../data/aiModelsData';
import { sanitizeUserText } from '../utils/securityHardening';

interface VoiceVisualFeedbackProps {
  selectedModelVersion: SpecificModelVersion;
  presetName?: string;
  isCollaboratorMode: boolean;
  currentUserName?: string;
  compact?: boolean;
}

const FEEDBACK_STORAGE_KEY = 'ai_studio_visual_feedback_reviews_v2';

// Declaración segura para Web Speech API en navegadores Chromium / Edge / Safari
interface BrowserSpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      0: { transcript: string };
    };
  };
}

interface BrowserSpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

export const VoiceVisualFeedback: React.FC<VoiceVisualFeedbackProps> = ({
  selectedModelVersion,
  presetName,
  isCollaboratorMode,
  currentUserName,
  compact = false,
}) => {
  const [reviews, setReviews] = useState<VisualFeedbackReview[]>(() => {
    try {
      const saved = localStorage.getItem(FEEDBACK_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_VISUAL_FEEDBACK_REVIEWS;
  });

  const [rating, setRating] = useState<number>(5);
  const [commentText, setCommentText] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [usedVoiceInCurrentDraft, setUsedVoiceInCurrentDraft] =
    useState<boolean>(false);
  const [speechStatus, setSpeechStatus] = useState<string | null>(null);
  const [filterByCurrentModel, setFilterByCurrentModel] =
    useState<boolean>(false);

  const recognitionRef = useRef<BrowserSpeechRecognitionInstance | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(reviews));
    } catch {
      // ignore
    }
  }, [reviews]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const toggleVoiceDictation = () => {
    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
      setInterimTranscript('');
      setSpeechStatus('Dictado por voz finalizado. Puedes editar el texto antes de publicar.');
      return;
    }

    const SpeechRecognitionConstructor =
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      // Si el navegador no expone Web Speech API nativa, ofrecemos transcripción asistida
      setUsedVoiceInCurrentDraft(true);
      const sampleDictation = `El resultado visual generado con ${selectedModelVersion}${
        presetName ? ` en "${presetName}"` : ''
      } destaca por su atmósfera azul noche (#0A0F1D), excelente legibilidad y acentos naranjas vibrantes muy bien balanceados.`;
      setCommentText((prev) =>
        prev ? `${prev.trim()} ${sampleDictation}` : sampleDictation
      );
      setSpeechStatus(
        'API de voz no detectada en este navegador: se insertó dictado asistido en español.'
      );
      return;
    }

    try {
      const recognition = new (SpeechRecognitionConstructor as new () => BrowserSpeechRecognitionInstance)();
      recognition.lang = 'es-ES';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: BrowserSpeechRecognitionEvent) => {
        let finalChunk = '';
        let interimChunk = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalChunk += transcriptPiece + ' ';
          } else {
            interimChunk += transcriptPiece;
          }
        }
        if (finalChunk) {
          const safeChunk = sanitizeUserText(finalChunk, 500);
          setCommentText((prev) =>
            sanitizeUserText(prev ? `${prev.trim()} ${safeChunk}` : safeChunk, 500)
          );
          setUsedVoiceInCurrentDraft(true);
        }
        setInterimTranscript(sanitizeUserText(interimChunk, 500));
      };

      recognition.onerror = (event: { error: string }) => {
        setIsListening(false);
        setInterimTranscript('');
        if (event.error === 'not-allowed') {
          setSpeechStatus(
            'Permiso de micrófono denegado. Activa el micrófono en el navegador o usa el botón de dictado de prueba.'
          );
        } else {
          setSpeechStatus(`Estado de voz (${event.error}): puedes continuar escribiendo o probar de nuevo.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
      setUsedVoiceInCurrentDraft(true);
      setSpeechStatus(
        'Escuchando en español (es-ES)... Habla ahora para dictar cómo sentiste el resultado visual.'
      );
    } catch {
      setIsListening(false);
      setSpeechStatus('No fue posible iniciar el micrófono. Escribe tu evaluación debajo.');
    }
  };

  const handleInsertQuickVoiceSample = () => {
    setUsedVoiceInCurrentDraft(true);
    const voiceSample = `Al evaluar ${selectedModelVersion}${
      presetName ? ` sobre el componente "${presetName}"` : ''
    }, siento que el contraste entre el fondo azul noche y los botones naranjas guía la vista de inmediato y las transiciones se perciben muy fluidas.`;
    setCommentText((prev) =>
      prev ? `${prev.trim()} ${voiceSample}` : voiceSample
    );
    setSpeechStatus('Transcripción de voz en español añadida al campo de evaluación.');
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    const finalComment = sanitizeUserText(`${commentText} ${interimTranscript}`, 500);
    if (!finalComment) return;

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
    }

    const newReview: VisualFeedbackReview = {
      id: `rev-${Date.now()}`,
      modelVersion: selectedModelVersion,
      presetName: presetName ? sanitizeUserText(presetName, 100) : undefined,
      authorName: sanitizeUserText(
        currentUserName ||
          (isCollaboratorMode ? 'Colaborador Autorizado' : 'Visitante del Estudio'),
        120
      ),
      authorRole: isCollaboratorMode ? 'Modo Colaborador' : 'Modo Visitante',
      rating,
      comment: finalComment,
      usedVoiceDictation: usedVoiceInCurrentDraft,
      createdAt: 'Justo ahora',
    };

    setReviews((prev) => [newReview, ...prev]);
    setCommentText('');
    setInterimTranscript('');
    setUsedVoiceInCurrentDraft(false);
    setSpeechStatus(
      `¡Evaluación visual registrada para ${selectedModelVersion}!`
    );
    setTimeout(() => setSpeechStatus(null), 3500);
  };

  const handleDeleteReview = (id: string) => {
    if (!isCollaboratorMode) return;
    setReviews((prev) => prev.filter((r) => r.id !== id));
  };

  const displayedReviews = filterByCurrentModel
    ? reviews.filter((r) => r.modelVersion === selectedModelVersion)
    : reviews;

  return (
    <div
      className={`rounded-2xl border border-[#0EA5E9]/35 bg-[#0B0F19]/95 ${
        compact ? 'p-4 space-y-3.5' : 'p-5 space-y-4'
      }`}
    >
      {/* Cabecera del Módulo de Evaluación Visual con Dictado de Voz */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
              isListening
                ? 'border-[#0EA5E9] bg-[#0EA5E9] text-black animate-pulse'
                : 'border-[#0EA5E9]/40 bg-[#0EA5E9]/15 text-[#0EA5E9]'
            }`}
          >
            <Mic className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#38BDF8]">
              Impacto en el Resultado Visual · Dictado por Voz (ES)
            </span>
            <h4 className="text-sm font-extrabold text-white">
              Evalúa la Percepción Visual de{' '}
              <span className="text-[#0EA5E9]">{selectedModelVersion}</span>
            </h4>
          </div>
        </div>

        {/* Calificación de Impacto Visual en Estrellas */}
        <div
          className="flex items-center gap-1 rounded-xl border border-slate-800 bg-[#0F172A] px-2.5 py-1.5"
          role="group"
          aria-label="Calificación del resultado visual de 1 a 5 estrellas"
        >
          <span className="mr-1 text-[10px] font-bold text-slate-400">
            Impacto:
          </span>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              aria-label={`Calificar con ${star} estrellas`}
              className="p-0.5 transition hover:scale-110 cursor-pointer"
            >
              <Star
                className={`h-3.5 w-3.5 ${
                  star <= rating
                    ? 'fill-[#0EA5E9] text-[#0EA5E9]'
                    : 'text-slate-600'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Formulario con Dictado por Voz + Campo Escrito */}
      <form onSubmit={handleSubmitReview} className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleVoiceDictation}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-extrabold transition cursor-pointer ${
                isListening
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 animate-pulse'
                  : 'bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8] text-black shadow-md shadow-[#0EA5E9]/25 hover:brightness-110'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="h-3.5 w-3.5" />
                  <span>Detener Dictado por Voz</span>
                </>
              ) : (
                <>
                  <Mic className="h-3.5 w-3.5" />
                  <span>Dictar Opinión por Voz (ES)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleInsertQuickVoiceSample}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-[#0F172A] px-3 py-2 text-[11px] font-bold text-slate-300 transition hover:border-[#0EA5E9] hover:text-white cursor-pointer"
              title="Insertar ejemplo de dictado de voz sobre el impacto visual"
            >
              <Volume2 className="h-3.5 w-3.5 text-[#0EA5E9]" />
              <span>Dictado Asistido de Ejemplo</span>
            </button>
          </div>

          {isListening && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#0EA5E9]/50 bg-[#0EA5E9]/15 px-3 py-1 text-[11px] font-bold text-[#38BDF8]">
              <span className="h-2 w-2 rounded-full bg-[#0EA5E9] animate-ping" />
              Micrófono Activo (Español)
            </span>
          )}
        </div>

        {speechStatus && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-2 rounded-xl border border-[#0EA5E9]/30 bg-[#0F172A] px-3 py-2 text-[11px] text-[#38BDF8]"
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#0EA5E9]" />
            <span>{speechStatus}</span>
          </div>
        )}

        <div className="relative">
          <label htmlFor={`voice-feedback-textarea-${selectedModelVersion}`} className="sr-only">
            Reseña u opinión sobre el resultado visual
          </label>
          <textarea
            id={`voice-feedback-textarea-${selectedModelVersion}`}
            rows={compact ? 2 : 3}
            maxLength={500}
            value={
              interimTranscript
                ? `${commentText} ${interimTranscript}`.trim()
                : commentText
            }
            onChange={(e) => {
              setCommentText(e.target.value.slice(0, 500));
              setInterimTranscript('');
            }}
            placeholder={`Dicta con el micrófono o escribe aquí cómo sentiste el resultado visual de ${selectedModelVersion} (contraste azul noche, acentos naranja, fluidez, estructura)...`}
            className="w-full rounded-xl border border-slate-700 bg-[#0F172A] p-3 text-xs leading-relaxed text-white placeholder:text-slate-500 focus:border-[#0EA5E9] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] text-slate-400">
            Publicando como:{' '}
            <strong className="text-white">
              {isCollaboratorMode ? 'Modo Colaborador' : 'Modo Visitante'}
            </strong>
            {usedVoiceInCurrentDraft && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-md bg-[#0EA5E9]/15 px-2 py-0.5 text-[10px] font-bold text-[#38BDF8]">
                <Mic className="h-2.5 w-2.5" /> Con Dictado de Voz
              </span>
            )}
          </span>

          <button
            type="submit"
            disabled={!commentText.trim() && !interimTranscript.trim()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8] px-4 py-2 text-xs font-extrabold text-black shadow-md transition hover:brightness-110 disabled:opacity-40 cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Registrar Evaluación Visual</span>
          </button>
        </div>
      </form>

      {/* Historial de Evaluaciones Visuales Registradas */}
      <div className="space-y-2 border-t border-slate-800 pt-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <MessageSquarePlus className="h-3.5 w-3.5 text-[#0EA5E9]" />
            Bitácora de Percepción Visual ({displayedReviews.length})
          </span>
          <button
            type="button"
            onClick={() => setFilterByCurrentModel((v) => !v)}
            className="text-[11px] font-bold text-[#38BDF8] hover:underline cursor-pointer"
          >
            {filterByCurrentModel
              ? 'Ver todas las versiones'
              : `Filtrar solo ${selectedModelVersion}`}
          </button>
        </div>

        <div className="max-h-44 space-y-2 overflow-y-auto pr-1">
          {displayedReviews.slice(0, compact ? 3 : 6).map((rev) => (
            <div
              key={rev.id}
              className="rounded-xl border border-slate-800/90 bg-[#0F172A]/90 p-3 text-xs space-y-1.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-[#0EA5E9]/20 border border-[#0EA5E9]/40 px-2 py-0.5 font-mono text-[10px] font-extrabold text-[#38BDF8]">
                    {rev.modelVersion}
                  </span>
                  <span className="font-bold text-white">{rev.authorName}</span>
                  <span className="text-[10px] text-slate-400">
                    ({rev.authorRole})
                  </span>
                  {rev.usedVoiceDictation && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-bold text-emerald-300">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      Dictado por Voz
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="flex items-center text-[#0EA5E9]">
                    {Array.from({ length: rev.rating }).map((_, idx) => (
                      <Star
                        key={idx}
                        className="h-3 w-3 fill-[#0EA5E9] text-[#0EA5E9]"
                      />
                    ))}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {rev.createdAt}
                  </span>
                  {isCollaboratorMode && (
                    <button
                      type="button"
                      onClick={() => handleDeleteReview(rev.id)}
                      aria-label="Eliminar reseña"
                      className="text-slate-500 hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-slate-300 leading-relaxed">{rev.comment}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
