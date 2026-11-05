import {
  LanguageBreakdownItem,
  RarArchivePackage,
  SpecificModelVersion,
} from './workspace';

export type LanguageCode = 'es' | 'en';

export type SkillLevel = 'Principiante' | 'Intermedio' | 'Avanzado';

export type SkillKind = 'guia' | 'repo' | 'proyecto';

export type UIComponentType =
  | 'menubar'
  | 'dropdown'
  | 'toolbar'
  | 'command-palette';

export interface UIMenuItem {
  id: string;
  label: string;
  shortcut?: string;
  checked?: boolean;
  actionDescription?: string;
  children?: UIMenuItem[];
}

export interface UIComponentSpec {
  id: string;
  type: UIComponentType;
  title: string;
  theme: 'indigo' | 'emerald' | 'amber' | 'rose';
  activePresetId?: string;
  accentColors?: string[];
  styleLabel?: string;
  items: UIMenuItem[];
}

export type PresetAIModelName = SpecificModelVersion;

export interface AppliedSkillDetail {
  skillId: string;
  description: string;
}

export interface PresetModelVariation {
  modelName: PresetAIModelName;
  family: 'Claude Opus' | 'Gemini' | 'Claude Sonnet' | 'GPT';
  tier: string;
  visualDifference: string;
  structureDifference: string;
  promptAdaptation: string;
}

export interface UIStylePreset {
  id: string;
  name: string;
  category: string;
  styleCategory: string;
  mode: 'Light' | 'Dark';
  colors: string[];
  theme: 'indigo' | 'emerald' | 'amber' | 'rose';
  componentType: UIComponentType;
  heroTitle: string;
  heroAccent: string;
  heroSubtitle: string;
  badgeText: string;
  metrics: string[];
  menuItems: UIMenuItem[];
  promptMarkdown: string;
  defaultAiModel?: PresetAIModelName;
  skillsApplied?: AppliedSkillDetail[];
  modelVariations?: Record<PresetAIModelName, PresetModelVariation>;
}

export interface AIModelUsage {
  id: string;
  modelName: string;
  provider: string;
  testedAt: string;
  status: 'optimal' | 'compatible' | 'needs-tuning';
  notes: string;
}

export interface ScreenshotEvidence {
  id: string;
  title: string;
  dataUrl: string;
  createdAt: string;
  modelUsed: string;
}

export interface CodeEvidence {
  id: string;
  title: string;
  language: string;
  code: string;
  createdAt: string;
  modelUsed: string;
}

export interface SkillFicha {
  whereToUse: string;
  requirements: string;
  estimatedTime: string;
  collaborators: string[];
}

export interface SkillDocument {
  id: string;
  filename: string;
  name: string;
  summary: string;
  category: string;
  level: SkillLevel;
  kind: SkillKind;
  tags: string[];
  language: LanguageCode;
  markdownContent: string;
  translatedContent?: string;
  updatedAt: string;
  ficha: SkillFicha;
  uiSpec: UIComponentSpec;
  models: AIModelUsage[];
  screenshots: ScreenshotEvidence[];
  codeSnippets: CodeEvidence[];
  aiModelId?: string;
  aiModelLabel?: string;
  appliedSkill?: string;
  appliedSkillsList?: AppliedSkillDetail[];
  predominantLanguages?: LanguageBreakdownItem[];
  colorPalette?: string[];
  rarPackage?: RarArchivePackage;
}
