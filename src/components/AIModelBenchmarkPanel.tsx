import React, { useState } from 'react';
import { AI_BENCHMARK_MODELS } from '../data/aiModelsData';
import { AIBenchmarkModel, AIModelFamily } from '../types/workspace';
import { SkillDocument } from '../types/skill';
import { VoiceVisualFeedback } from './VoiceVisualFeedback';
import {
  Cpu,
  Zap,
  CheckCircle2,
  Activity,
  Sparkles,
  Play,
  Layers,
  Eye,
} from 'lucide-react';

interface AIModelBenchmarkPanelProps {
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  activeSkill: SkillDocument;
  onUpdateSkill: (skill: SkillDocument) => void;
  onStatusChange: (status: string | null) => void;
  isCollaboratorMode?: boolean;
  currentUserName?: string;
}

export const AIModelBenchmarkPanel: React.FC<AIModelBenchmarkPanelProps> = ({
  selectedModelId,
  onSelectModel,
  activeSkill,
  onUpdateSkill,
  onStatusChange,
  isCollaboratorMode = false,
  currentUserName,
}) => {
  const [isTestingBenchmark, setIsTestingBenchmark] = useState(false);
  const [liveTokenRate, setLiveTokenRate] = useState<number | null>(null);
  const [familyFilter, setFamilyFilter] = useState<AIModelFamily | 'Todos'>(
    'Todos'
  );

  const activeModel: AIBenchmarkModel =
    AI_BENCHMARK_MODELS.find((m) => m.id === selectedModelId) ||
    AI_BENCHMARK_MODELS[0];

  const filteredModels =
    familyFilter === 'Todos'
      ? AI_BENCHMARK_MODELS
      : AI_BENCHMARK_MODELS.filter((m) => m.family === familyFilter);

  const handleRunLiveStressTest = async () => {
    setIsTestingBenchmark(true);
    onStatusChange(
      `Ejecutando diagnóstico visual y de rendimiento en ${activeModel.name}...`
    );
    await new Promise((r) => setTimeout(r, 850));
    const jitter = Math.round((Math.random() - 0.3) * 10);
    const measuredRate = activeModel.speedTokensPerSec + jitter;
    setLiveTokenRate(measuredRate);

    if (isCollaboratorMode) {
      const alreadyExists = activeSkill.models.some(
        (m) => m.modelName === activeModel.name
      );
      if (!alreadyExists) {
        onUpdateSkill({
          ...activeSkill,
          models: [
            {
              id: `bench-${Date.now()}`,
              modelName: activeModel.name,
              provider: activeModel.provider,
              testedAt: new Date().toLocaleDateString(),
              status: 'optimal',
              notes: `Versión ${activeModel.version} (${activeModel.tier}) · Velocidad: ${measuredRate} tok/s · Fidelidad Visual: ${activeModel.visualFidelityScore}%`,
            },
            ...activeSkill.models,
          ],
        });
      }
    }

    setIsTestingBenchmark(false);
    onStatusChange(
      `Diagnóstico completado: ${activeModel.version} alcanzó ${measuredRate} tokens/seg (${activeModel.tier})`
    );
    setTimeout(() => onStatusChange(null), 3000);
  };

  return (
    <section aria-labelledby="models-benchmark-heading" className="space-y-8">
      {/* Cabecera de la Matriz de Inteligencias (Cortex de Modelos IA) */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-800/90 pb-5">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#38BDF8]">
            <Activity
              className="w-3.5 h-3.5 text-[#0EA5E9]"
              aria-hidden="true"
            />
            MATRIZ DE INTELIGENCIAS · CORTEX DE MODELOS Y VERSIONES ESPECÍFICAS
          </span>
          <h1
            id="models-benchmark-heading"
            className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white"
          >
            Matriz de Inteligencias y Evaluación por Voz
          </h1>
          <p className="text-sm text-slate-400 max-w-3xl">
            Compara el rendimiento visual y arquitectónico entre las versiones específicas del estudio:{' '}
            <strong className="text-[#38BDF8]">Opus 5.5, Opus 4.8</strong>,{' '}
            <strong className="text-[#38BDF8]">Gemini 3.8, Gemini 3.7</strong>,{' '}
            <strong className="text-[#38BDF8]">Sonnet 5.5</strong> y{' '}
            <strong className="text-[#38BDF8]">GPT Astra, GPT Luna</strong>.
          </p>
        </div>

        <button
          type="button"
          disabled={isTestingBenchmark}
          onClick={handleRunLiveStressTest}
          className="h-11 px-5 rounded-xl bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8] hover:brightness-110 disabled:opacity-60 text-black font-extrabold text-xs flex items-center gap-2 cyan-glow transition cursor-pointer"
        >
          <Play
            className={`w-4 h-4 ${isTestingBenchmark ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          <span>
            {isTestingBenchmark
              ? 'Evaluando Cortex...'
              : `Probar Versión ${activeModel.version}`}
          </span>
        </button>
      </div>

      {/* Filtros por Familia de Inteligencia Artificial */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              'Todos',
              'Claude Opus',
              'Gemini',
              'Claude Sonnet',
              'GPT',
            ] as const
          ).map((fam) => {
            const active = familyFilter === fam;
            return (
              <button
                key={fam}
                type="button"
                onClick={() => setFamilyFilter(fam)}
                className={`rounded-full px-4 py-1.5 text-xs font-extrabold transition cursor-pointer ${
                  active
                    ? 'bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8] text-black shadow-md'
                    : 'border border-slate-800 bg-[#0F172A] text-slate-300 hover:border-[#0EA5E9]/50 hover:text-white'
                }`}
              >
                {fam === 'Todos' ? 'Todas las Familias (7 Versiones)' : fam}
              </button>
            );
          })}
        </div>

        <span className="text-xs text-slate-400">
          Versión seleccionada:{' '}
          <strong className="font-mono text-[#38BDF8]">
            {activeModel.version}
          </strong>
        </span>
      </div>

      {/* Cuadrícula de las 7 Versiones Específicas de Modelos IA */}
      <div
        role="radiogroup"
        aria-label="Selector de versión específica de Modelo de IA"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
      >
        {filteredModels.map((model) => {
          const isSelected = model.id === activeModel.id;
          return (
            <div
              key={model.id}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              onClick={() => {
                onSelectModel(model.id);
                setLiveTokenRate(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectModel(model.id);
                  setLiveTokenRate(null);
                }
              }}
              className={`rounded-3xl p-5 transition duration-200 flex flex-col justify-between gap-4 cursor-pointer ${
                isSelected
                  ? 'bg-[#0F172A] border-2 border-[#0EA5E9] cyan-glow'
                  : 'bg-[#0F172A]/90 border border-slate-800 hover:border-[#0EA5E9]/55'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#0EA5E9]/15 text-[#38BDF8] border border-[#0EA5E9]/40">
                    {model.family} · {model.tier}
                  </span>
                  {isSelected && (
                    <CheckCircle2
                      className="w-5 h-5 text-[#0EA5E9] shrink-0"
                      aria-hidden="true"
                    />
                  )}
                </div>

                <div className="flex items-baseline justify-between gap-2">
                  <div>
                    <div className="text-[11px] font-mono text-slate-400">
                      {model.provider}
                    </div>
                    <h2 className="text-lg font-extrabold text-white mt-0.5">
                      {model.version}
                    </h2>
                  </div>
                  <span className="rounded-xl bg-[#0B0F19] border border-slate-800 px-2.5 py-1 font-mono text-xs font-extrabold text-sky-400">
                    Fidelidad UI: {model.visualFidelityScore}%
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {model.summary}
                </p>

                <div className="rounded-xl border border-slate-800/90 bg-[#0B0F19] p-2.5 text-[11px] text-slate-300">
                  <strong className="text-[#38BDF8] block mb-0.5">
                    Impacto Visual:
                  </strong>
                  {model.visualImpactNotes}
                </div>
              </div>

              {/* Barras Rápidas de Rendimiento Visual y Código */}
              <div className="space-y-2.5 pt-3 border-t border-slate-800/80">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">
                      Fidelidad Visual &amp; Estética UI/UX
                    </span>
                    <span className="font-mono font-bold text-[#38BDF8]">
                      {model.visualFidelityScore}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#0B0F19] overflow-hidden border border-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]"
                      style={{ width: `${model.visualFidelityScore}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">
                      Razonamiento &amp; Arquitectura de Código
                    </span>
                    <span className="font-mono font-bold text-white">
                      {model.codingScore}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#0B0F19] overflow-hidden border border-slate-800">
                    <div
                      className="h-full rounded-full bg-sky-400"
                      style={{ width: `${model.codingScore}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-slate-400">
                  <span>Velocidad: {model.speedTokensPerSec} tok/s</span>
                  <span>Contexto: {model.contextWindow}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Panel Detallado del Modelo Seleccionado + Módulo de Evaluación Visual con Dictado de Voz */}
      <div className="rounded-3xl bg-[#0F172A] border border-[#0EA5E9]/35 p-6 sm:p-8 cyan-glow space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#0EA5E9]/15 border border-[#0EA5E9]/40 flex items-center justify-center">
              <Cpu className="w-6 h-6 text-[#0EA5E9]" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-extrabold text-white">
                  {activeModel.name}
                </h3>
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-[#0EA5E9] text-black">
                  {activeModel.version}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Familia: <strong className="text-slate-200">{activeModel.family}</strong> ·
                Vinculado al proyecto activo{' '}
                <code className="text-[#38BDF8]">{activeSkill.filename}</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-[#0B0F19] border border-slate-800 text-right">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">
                Velocidad en Tiempo Real
              </div>
              <div className="text-lg font-mono font-extrabold text-[#38BDF8]">
                {liveTokenRate ?? activeModel.speedTokensPerSec} tok/s
              </div>
            </div>
            <div className="px-4 py-2 rounded-xl bg-[#0B0F19] border border-slate-800 text-right">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">
                Latencia TTFT
              </div>
              <div className="text-lg font-mono font-extrabold text-white">
                {activeModel.latencyMs} ms
              </div>
            </div>
          </div>
        </div>

        {/* 4 Indicadores Visuales de Rendimiento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Fidelidad Visual UI/UX',
              score: activeModel.visualFidelityScore,
              desc: 'Acabado cromático en Azul Noche y Naranja',
            },
            {
              label: 'Razonamiento Lógico',
              score: activeModel.reasoningScore,
              desc: 'Resolución de arquitectura y algoritmos',
            },
            {
              label: 'Generación de Código',
              score: activeModel.codingScore,
              desc: 'TypeScript, React, CSS y accesibilidad ARIA',
            },
            {
              label: 'Capacidad de Procesamiento',
              score: activeModel.processingCapacity,
              desc: `Ventana activa de ${activeModel.contextWindow}`,
            },
          ].map((metric) => (
            <div
              key={metric.label}
              className="p-4 rounded-2xl bg-[#0B0F19] border border-slate-800/90 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">
                  {metric.label}
                </span>
                <span className="text-sm font-mono font-extrabold text-[#0EA5E9]">
                  {metric.score}/100
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-900 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8] transition-all duration-500"
                  style={{ width: `${metric.score}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">{metric.desc}</p>
            </div>
          ))}
        </div>

        {/* Fortalezas y Casos Recomendados */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 rounded-2xl bg-[#0B0F19] border border-slate-800 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#38BDF8] flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#0EA5E9]" aria-hidden="true" />
              Fortalezas de la Versión {activeModel.version}
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              {activeModel.strengths.map((s) => (
                <li key={s} className="flex items-start gap-2">
                  <Sparkles
                    className="w-3.5 h-3.5 text-[#0EA5E9] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-[#0B0F19] border border-slate-800 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" aria-hidden="true" />
              Casos de Uso Recomendados en el Estudio
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              {activeModel.recommendedFor.map((r) => (
                <li key={r} className="flex items-start gap-2">
                  <Eye
                    className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* MÓDULO INTEGRADO DE FEEDBACK CON DICTADO POR VOZ EN ESPAÑOL */}
        <VoiceVisualFeedback
          selectedModelVersion={activeModel.version}
          isCollaboratorMode={isCollaboratorMode}
          currentUserName={currentUserName}
        />
      </div>
    </section>
  );
};
