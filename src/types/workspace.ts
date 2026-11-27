export type AppPageRoute =
  | 'inicio'
  | 'codice-studio'
  | 'boveda'
  | 'catalogo'
  | 'skills-sh'
  | 'preview'
  | 'skill-detalle'
  | 'perfil';

export interface UserAccount {
  id: string;
  fullName: string;
  email: string;
  role: string;
  createdAt: string;
}

export type AIModelFamily = 'Claude Opus' | 'Gemini' | 'Claude Sonnet' | 'GPT' | 'DeepSeek';

export type SpecificModelVersion =
  | 'Opus 5.5'
  | 'Opus 4.8'
  | 'Gemini 3.8'
  | 'Gemini 3.7'
  | 'Sonnet 5.5'
  | 'GPT Astra'
  | 'GPT Luna'
  | 'DeepSeek V3';

export type PerformanceTier =
  | 'Ultra / Máximo'
  | 'Máximo / Alto'
  | 'Ultra'
  | 'Cortex Supremo';

export interface AIBenchmarkModel {
  id: string;
  name: string;
  version: SpecificModelVersion;
  family: AIModelFamily;
  provider: string;
  tier: PerformanceTier;
  badgeColor: string;
  speedTokensPerSec: number;
  latencyMs: number;
  contextWindow: string;
  reasoningScore: number;
  codingScore: number;
  processingCapacity: number;
  multimodalScore: number;
  visualFidelityScore: number;
  summary: string;
  visualImpactNotes: string;
  strengths: string[];
  recommendedFor: string[];
}
