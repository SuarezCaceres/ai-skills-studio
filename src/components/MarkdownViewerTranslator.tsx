import React, { useState, useEffect } from 'react';
import { SkillDocument, LanguageCode } from '../types/skill';
import { translateSkillMarkdown } from '../services/translationService';
import { speakMessage, stopSpeech } from '../services/speechService';
import {
  Languages,
  Volume2,
  VolumeX,
  Sparkles,
  Check,
  Play,
  Square,
  KeyRound,
  Copy,
  ChevronRight,
  Radio,
} from 'lucide-react';

interface MarkdownViewerTranslatorProps {
  skill: SkillDocument;
  onUpdateSkill: (updated: SkillDocument) => void;
  onStatusChange: (statusText: string | null) => void;
}

export const MarkdownViewerTranslator: React.FC<MarkdownViewerTranslatorProps> = ({
  skill,
  onUpdateSkill,
  onStatusChange,
}) => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [isReadingAloud, setIsReadingAloud] = useState(false);
  const [targetLang, setTargetLang] = useState<LanguageCode>(
    skill.language === 'es' ? 'en' : 'es'
  );
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [copiedSide, setCopiedSide] = useState<'original' | 'translated' | null>(null);

  useEffect(() => {
    setTargetLang(skill.language === 'es' ? 'en' : 'es');
  }, [skill.id, skill.language]);

  const handleTranslate = async () => {
    setIsTranslating(true);
    const statusLabel =
      targetLang === 'en'
        ? 'Traduciendo... (ES → EN)'
        : 'Traduciendo... (EN → ES)';

    onStatusChange(statusLabel);
    speakMessage(
      targetLang === 'en'
        ? 'Traduciendo contenido de la skill al inglés'
        : 'Traduciendo contenido de la skill al español',
      'es-ES',
      voiceEnabled
    );

    await new Promise((resolve) => setTimeout(resolve, 1300));

    const translated = await translateSkillMarkdown(
      skill.markdownContent,
      targetLang,
      geminiApiKey
    );

    onUpdateSkill({
      ...skill,
      translatedContent: translated,
      updatedAt: new Date().toISOString(),
    });

    setIsTranslating(false);
    onStatusChange('Traducción completada');
    speakMessage('Traducción completada', 'es-ES', voiceEnabled);
    setTimeout(() => onStatusChange(null), 2600);
  };

  const handleReadSkillAloud = () => {
    if (isReadingAloud) {
      stopSpeech();
      setIsReadingAloud(false);
      onStatusChange(null);
      return;
    }
    const contentToRead = skill.translatedContent || skill.markdownContent;
    const cleanText = contentToRead.replace(/[#*`_-]/g, ' ');
    setIsReadingAloud(true);
    onStatusChange(`Reproduciendo voz: ${skill.filename}...`);
    speakMessage(
      cleanText,
      skill.translatedContent
        ? targetLang === 'en'
          ? 'en-US'
          : 'es-ES'
        : skill.language === 'en'
        ? 'en-US'
        : 'es-ES',
      true
    );
    setTimeout(() => {
      setIsReadingAloud(false);
      onStatusChange(null);
    }, 5000);
  };

  const handleCopy = async (text: string, side: 'original' | 'translated') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSide(side);
      setTimeout(() => setCopiedSide(null), 1800);
    } catch {
      // Fallback
    }
  };

  return (
    <section aria-labelledby="ficha-skill-heading" className="space-y-6">
      {/* Breadcrumb Editorial en Naranja y Negro */}
      <div className="space-y-3">
        <nav aria-label="Ruta de navegación" className="flex items-center gap-1.5 text-xs text-zinc-400">
          <span>Comunidad</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#FF6B00]" aria-hidden="true" />
          <span>Bóveda</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#FF6B00]" aria-hidden="true" />
          <span className="font-bold text-[#FF8C00] truncate">{skill.filename}</span>
        </nav>

        <h1
          id="ficha-skill-heading"
          className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight"
        >
          {skill.name.split('·')[0].trim()}
        </h1>

        <p className="text-sm sm:text-base text-zinc-400 max-w-3xl leading-relaxed">
          {skill.summary}
        </p>

        <p className="text-xs text-zinc-500">
          En colaboración con{' '}
          {skill.ficha.collaborators.map((handle, i) => (
            <React.Fragment key={handle}>
              <strong className="font-bold text-[#FF8C00] underline underline-offset-2">
                {handle}
              </strong>
              {i < skill.ficha.collaborators.length - 1 ? ' y ' : ''}
            </React.Fragment>
          ))}{' '}
          · Archivo activo: <code className="font-mono text-white">{skill.filename}</code>
        </p>
      </div>

      {/* Tarjeta "FICHA" en #121212 con Glow Naranja */}
      <div className="rounded-3xl bg-[#121212] border border-[#FF6B00]/30 p-5 sm:p-7 orange-glow space-y-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-[#FF6B00]/15 text-[#FF8C00] border border-[#FF6B00]/40">
              FICHA TÉCNICA &amp; TRADUCTOR .MD
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setVoiceEnabled((v) => !v)}
                aria-label={voiceEnabled ? 'Silenciar alertas de voz' : 'Activar alertas de voz'}
                className={`h-9 px-3.5 rounded-full border text-xs font-bold flex items-center gap-1.5 transition duration-200 cursor-pointer ${
                  voiceEnabled
                    ? 'bg-[#FF6B00]/15 border-[#FF6B00]/50 text-[#FF8C00]'
                    : 'bg-[#0B0B0B] border-zinc-800 text-zinc-500'
                }`}
              >
                {voiceEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-[#FF6B00]" aria-hidden="true" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span>Voz {voiceEnabled ? 'ON' : 'OFF'}</span>
              </button>

              <button
                type="button"
                onClick={handleReadSkillAloud}
                className="h-9 px-3.5 rounded-full bg-[#0B0B0B] hover:bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs font-bold flex items-center gap-1.5 transition duration-200 cursor-pointer"
              >
                {isReadingAloud ? (
                  <>
                    <Square className="w-3.5 h-3.5 text-rose-500" aria-hidden="true" />
                    <span>Detener Voz</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-[#FF6B00]" aria-hidden="true" />
                    <span>Escuchar .md</span>
                  </>
                )}
              </button>

              <label htmlFor="target-lang-select" className="sr-only">
                Idioma de destino para la traducción
              </label>
              <select
                id="target-lang-select"
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value as LanguageCode)}
                className="h-9 bg-[#0B0B0B] border border-zinc-800 text-xs font-bold text-white rounded-full px-3.5 cursor-pointer"
              >
                <option value="en">Traducir a Inglés (EN)</option>
                <option value="es">Traducir a Español (ES)</option>
              </select>

              <button
                type="button"
                disabled={isTranslating}
                onClick={handleTranslate}
                className="h-9 px-4 text-xs font-extrabold bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] hover:from-[#FF8C00] hover:to-[#FF6B00] disabled:opacity-60 text-black rounded-full flex items-center gap-2 transition duration-200 orange-glow-sm cursor-pointer"
              >
                <Languages
                  className={`w-3.5 h-3.5 ${isTranslating ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
                <span>{isTranslating ? 'Traduciendo...' : 'Traducir Skill'}</span>
              </button>
            </div>
          </div>

          <h2 className="text-lg font-bold text-white">
            {skill.name.split('·')[0].trim()}
          </h2>
        </div>

        {/* Tabla de Especificaciones de la Ficha */}
        <dl className="divide-y divide-zinc-800/80 border-t border-b border-zinc-800/80 text-xs sm:text-sm">
          <div className="py-3 grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4">
            <dt className="sm:col-span-3 text-[11px] font-bold uppercase tracking-wider text-[#FF8C00] self-center">
              NIVEL
            </dt>
            <dd className="sm:col-span-9 text-zinc-200 font-semibold">{skill.level}</dd>
          </div>

          <div className="py-3 grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4">
            <dt className="sm:col-span-3 text-[11px] font-bold uppercase tracking-wider text-[#FF8C00] self-center">
              DÓNDE SE USA
            </dt>
            <dd className="sm:col-span-9 text-zinc-300">{skill.ficha.whereToUse}</dd>
          </div>

          <div className="py-3 grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4">
            <dt className="sm:col-span-3 text-[11px] font-bold uppercase tracking-wider text-[#FF8C00] self-center">
              QUÉ NECESITAS
            </dt>
            <dd className="sm:col-span-9 text-zinc-300">{skill.ficha.requirements}</dd>
          </div>

          <div className="py-3 grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-4">
            <dt className="sm:col-span-3 text-[11px] font-bold uppercase tracking-wider text-[#FF8C00] self-center">
              CUÁNTO TOMA
            </dt>
            <dd className="sm:col-span-9 text-zinc-300">{skill.ficha.estimatedTime}</dd>
          </div>
        </dl>

        {/* Indicador Dinámico de Voz / Alerta en Tiempo Real */}
        <div
          role="status"
          aria-live="polite"
          className={`rounded-2xl px-4 py-3 border transition duration-200 flex flex-wrap items-center justify-between gap-3 ${
            isTranslating
              ? 'bg-[#FF6B00]/15 border-[#FF6B00] text-white orange-glow-sm'
              : 'bg-[#0B0B0B] border-zinc-800/80 text-zinc-400'
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                isTranslating
                  ? 'bg-[#FF6B00] text-black'
                  : 'bg-[#121212] border border-[#FF6B00]/40 text-[#FF6B00]'
              }`}
              aria-hidden="true"
            >
              <Radio className={`w-4 h-4 ${isTranslating ? 'animate-ping' : ''}`} />
            </span>

            <div className="text-xs leading-relaxed">
              {isTranslating ? (
                <>
                  <strong className="font-bold text-[#FF8C00]">
                    Indicador de Voz Activo (&ldquo;Traduciendo...&rdquo;):
                  </strong>{' '}
                  Procesando y traduciendo <code className="font-mono">{skill.filename}</code> a{' '}
                  <strong>{targetLang === 'en' ? 'Inglés (EN)' : 'Español (ES)'}</strong>
                </>
              ) : (
                <>
                  <strong className="font-semibold text-zinc-200">
                    Feedback de Voz e Indicador Visual:
                  </strong>{' '}
                  Pulsa <em>Traducir Skill</em> para activar la alerta dinámica{' '}
                  <code className="px-1.5 py-0.5 rounded bg-[#121212] border border-[#FF6B00]/30 text-[#FF8C00] font-mono">
                    &quot;Traduciendo...&quot;
                  </code>
                </>
              )}
            </div>
          </div>

          <div className="flex items-end gap-1 h-4 px-2" aria-hidden="true">
            <span
              className={`w-1 rounded-full ${
                isTranslating ? 'bg-[#FF6B00] h-3 animate-bounce' : 'bg-zinc-700 h-1.5'
              }`}
            />
            <span
              className={`w-1 rounded-full ${
                isTranslating
                  ? 'bg-[#FF8C00] h-4 animate-bounce [animation-delay:120ms]'
                  : 'bg-zinc-700 h-2.5'
              }`}
            />
            <span
              className={`w-1 rounded-full ${
                isTranslating
                  ? 'bg-[#FF6B00] h-2.5 animate-bounce [animation-delay:240ms]'
                  : 'bg-zinc-700 h-1.5'
              }`}
            />
          </div>
        </div>

        {/* Visor Dual de Markdown Plano (Original vs Traducido) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <figure className="flex flex-col gap-2">
            <figcaption className="text-xs font-bold text-zinc-300 flex items-center justify-between px-1">
              <span>
                Markdown Plano ({skill.language.toUpperCase()}) ·{' '}
                <code className="text-[#FF8C00] font-mono">{skill.filename}</code>
              </span>
              <button
                type="button"
                onClick={() => handleCopy(skill.markdownContent, 'original')}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{copiedSide === 'original' ? 'Copiado' : 'Copiar'}</span>
              </button>
            </figcaption>
            <pre
              tabIndex={0}
              className="bg-[#0B0B0B] border border-zinc-800 rounded-2xl p-4 text-xs font-mono text-zinc-200 overflow-x-auto max-h-64 whitespace-pre-wrap leading-relaxed focus:outline-none focus:border-[#FF6B00]"
            >
              <code>{skill.markdownContent}</code>
            </pre>
          </figure>

          <figure className="flex flex-col gap-2">
            <figcaption className="text-xs font-bold text-[#FF8C00] flex items-center justify-between px-1">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#FF6B00]" aria-hidden="true" />
                Traducción Multilingüe ({targetLang.toUpperCase()})
              </span>
              <div className="flex items-center gap-3">
                {skill.translatedContent && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleCopy(skill.translatedContent || '', 'translated')}
                      className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{copiedSide === 'translated' ? 'Copiado' : 'Copiar'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateSkill({
                          ...skill,
                          markdownContent: skill.translatedContent || skill.markdownContent,
                          language: targetLang,
                          translatedContent: undefined,
                        });
                        onStatusChange(`Traducción (${targetLang.toUpperCase()}) establecida como principal`);
                        setTimeout(() => onStatusChange(null), 2200);
                      }}
                      className="text-xs text-[#FF8C00] hover:underline flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Usar como principal</span>
                    </button>
                  </>
                )}
              </div>
            </figcaption>
            <pre
              tabIndex={0}
              className="bg-[#0B0B0B] border border-[#FF6B00]/40 rounded-2xl p-4 text-xs font-mono text-amber-100 overflow-x-auto max-h-64 whitespace-pre-wrap leading-relaxed focus:outline-none focus:border-[#FF8C00]"
            >
              <code>
                {skill.translatedContent ||
                  `# Traducción Bilingüe (${targetLang.toUpperCase()})\n\nHaz clic en "Traducir Skill" arriba a la derecha para traducir "${skill.filename}" y escuchar el indicador de voz en vivo.`}
              </code>
            </pre>
          </figure>
        </div>

        {/* Disclosure nativo <details> para API Key opcional */}
        <details className="bg-[#0B0B0B] border border-zinc-800 rounded-2xl px-4 py-2.5 text-xs">
          <summary className="cursor-pointer text-zinc-400 hover:text-white font-semibold select-none">
            Motor de Traducción Híbrido (Instantáneo Local + Gemini API opcional)
          </summary>
          <div className="pt-3 pb-1 flex flex-wrap items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#FF6B00] shrink-0" aria-hidden="true" />
            <label htmlFor="gemini-key-input" className="text-zinc-400">
              Gemini API Key (opcional):
            </label>
            <input
              id="gemini-key-input"
              type="password"
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              placeholder="AIzaSy... (Si se deja vacío, utiliza el traductor instantáneo integrado)"
              className="flex-1 min-w-[240px] bg-[#121212] border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
            />
          </div>
        </details>
      </div>
    </section>
  );
};
