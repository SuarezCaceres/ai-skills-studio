export type AppPageRoute =
  | 'inicio'
  | 'codice-studio'
  | 'boveda'
  | 'catalogo'
  | 'estudio'
  | 'preview'
  | 'evidencias'
  | 'modelos-ia'
  | 'skill-detalle';

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

export interface VisualFeedbackReview {
  id: string;
  modelVersion: SpecificModelVersion;
  presetName?: string;
  authorName: string;
  authorRole: 'Modo Colaborador' | 'Modo Visitante';
  rating: number;
  comment: string;
  usedVoiceDictation: boolean;
  createdAt: string;
}

export type CodeLanguage =
  | 'typescript'
  | 'tsx'
  | 'css'
  | 'json'
  | 'markdown'
  | 'html';

export interface LanguageBreakdownItem {
  language: string;
  extension: CodeLanguage;
  percentage: number;
  bytes: number;
  color: string;
}

export interface ProjectMetadata {
  aiModelId: string;
  aiModelLabel: string;
  appliedSkill: string;
  predominantLanguages: LanguageBreakdownItem[];
  colorPalette: string[];
}

export interface RarFileEntry {
  id: string;
  name: string;
  path: string;
  folder: string;
  sizeBytes: number;
  language: CodeLanguage;
  content: string;
  originalContent?: string;
}

export interface RarArchivePackage {
  id: string;
  archiveName: string;
  uploadedAt: string;
  totalSizeBytes: number;
  signatureDetected: string;
  sourceKind?: 'zip' | 'folder' | 'bundle' | 'rar-legacy';
  files: RarFileEntry[];
  metadata: ProjectMetadata;
}
