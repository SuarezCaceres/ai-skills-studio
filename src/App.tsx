import { useState, useEffect, lazy, Suspense } from 'react';
import { SkillDocument } from './types/skill';
import {
  AppPageRoute,
  UserAccount,
  RarArchivePackage,
} from './types/workspace';
import { INITIAL_SKILLS } from './data/initialSkills';
import { AI_BENCHMARK_MODELS } from './data/aiModelsData';
import { DEFAULT_RAR_PACKAGE } from './services/rarParserService';
import {
  createSecureSessionPayload,
  parseSecureSessionPayload,
  isValidSkillDocumentArray,
  eraseAllPersonalData,
} from './utils/securityHardening';
import { AuthScreen } from './components/AuthScreen';
import { TopStudioHeader } from './components/NavbarActiveSkill';
import { InformativeLandingSection } from './components/InformativeLandingSection';
import { NeuralAtmosphereBackground } from './components/NeuralAtmosphereBackground';

const SkillManager = lazy(() =>
  import('./components/SkillManager').then((m) => ({
    default: m.SkillManager,
  }))
);
const UnifiedProjectStudio = lazy(() =>
  import('./components/UnifiedProjectStudio').then((m) => ({
    default: m.UnifiedProjectStudio,
  }))
);
const UIComponentPreview = lazy(() =>
  import('./components/UIComponentPreview').then((m) => ({
    default: m.UIComponentPreview,
  }))
);
const ContextEvidenceLogger = lazy(() =>
  import('./components/ContextEvidenceLogger').then((m) => ({
    default: m.ContextEvidenceLogger,
  }))
);
const AIModelBenchmarkPanel = lazy(() =>
  import('./components/AIModelBenchmarkPanel').then((m) => ({
    default: m.AIModelBenchmarkPanel,
  }))
);

const STORAGE_KEY = 'ai_skills_studio_vault_v4';
const AUTH_SESSION_KEY = 'ai_skills_studio_session_v1';

export function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const savedUser = localStorage.getItem(AUTH_SESSION_KEY);
      return parseSecureSessionPayload(savedUser);
    } catch {
      return null;
    }
  });

  // Permite mostrar la pantalla de Login/Registro cuando el visitante quiere pasar a Modo Colaborador
  const [showAuthScreen, setShowAuthScreen] = useState<boolean>(false);

  const [skills, setSkills] = useState<SkillDocument[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (isValidSkillDocumentArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // Fallback a INITIAL_SKILLS
    }
    return INITIAL_SKILLS;
  });

  const [activeSkillId, setActiveSkillId] = useState<string>(
    () => skills[0]?.id || ''
  );
  const [activePage, setActivePage] = useState<AppPageRoute>('inicio');
  const [selectedModelId, setSelectedModelId] = useState<string>(
    AI_BENCHMARK_MODELS[0].id
  );
  const [activeRarPackage, setActiveRarPackage] = useState<RarArchivePackage>(
    () => skills[0]?.rarPackage || DEFAULT_RAR_PACKAGE
  );
  const [globalStatus, setGlobalStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(skills));
    } catch {
      // Ignorar límites de cuota
    }
  }, [skills]);

  const activeSkill = skills.find((s) => s.id === activeSkillId) || skills[0];
  const selectedModel =
    AI_BENCHMARK_MODELS.find((m) => m.id === selectedModelId) ||
    AI_BENCHMARK_MODELS[0];
  const isCollaboratorMode = Boolean(currentUser);

  const handleSelectSkill = (id: string) => {
    setActiveSkillId(id);
    const found = skills.find((s) => s.id === id);
    if (found?.rarPackage) {
      setActiveRarPackage(found.rarPackage);
    }
  };

  const handleAuthenticated = (user: UserAccount) => {
    setCurrentUser(user);
    setShowAuthScreen(false);
    setGlobalStatus(`Modo Colaborador Activado · Bienvenido, ${user.fullName}`);
    setTimeout(() => setGlobalStatus(null), 2800);
    try {
      localStorage.setItem(
        AUTH_SESSION_KEY,
        createSecureSessionPayload(user)
      );
    } catch {
      // ignore
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowAuthScreen(false);
    setGlobalStatus(
      'Sesión cerrada · Ahora exploras en Modo Visitante (Solo Lectura)'
    );
    setTimeout(() => setGlobalStatus(null), 2800);
    try {
      localStorage.removeItem(AUTH_SESSION_KEY);
    } catch {
      // ignore
    }
  };

  const handleErasePersonalData = () => {
    eraseAllPersonalData();
    setCurrentUser(null);
    setShowAuthScreen(false);
    setGlobalStatus(
      'Datos personales eliminados (GDPR / CCPA) · Sesión cerrada en Modo Visitante'
    );
    setTimeout(() => setGlobalStatus(null), 3200);
  };

  const handleCreateSkill = (
    newSkillData: Omit<SkillDocument, 'id' | 'updatedAt'>
  ) => {
    if (!isCollaboratorMode) {
      setShowAuthScreen(true);
      return;
    }
    const created: SkillDocument = {
      ...newSkillData,
      id: `skill-${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };
    setSkills((prev) => [created, ...prev]);
    setActiveSkillId(created.id);
    if (created.rarPackage) {
      setActiveRarPackage(created.rarPackage);
    }
  };

  // Permite actualizar vistas previas UI/UX en vivo incluso en Modo Visitante para experimentar las demostraciones
  const handleUpdateSkill = (updated: SkillDocument) => {
    setSkills((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleDeleteSkill = (id: string) => {
    if (!isCollaboratorMode) {
      setShowAuthScreen(true);
      return;
    }
    setSkills((prev) => {
      const remaining = prev.filter((s) => s.id !== id);
      if (activeSkillId === id && remaining.length > 0) {
        setActiveSkillId(remaining[0].id);
      }
      return remaining;
    });
  };

  const handleUpdateSkillMarkdown = (
    skillId: string,
    markdownContent: string,
    translatedContent?: string
  ) => {
    setSkills((prev) =>
      prev.map((s) =>
        s.id === skillId
          ? {
              ...s,
              markdownContent,
              translatedContent: translatedContent ?? s.translatedContent,
              updatedAt: new Date().toISOString(),
            }
          : s
      )
    );
  };

  const handleUpdateProjectMetadata = (
    skillId: string,
    updates: {
      aiModelId?: string;
      aiModelLabel?: string;
      appliedSkill?: string;
      colorPalette?: string[];
    }
  ) => {
    if (!isCollaboratorMode) return;
    setSkills((prev) =>
      prev.map((s) =>
        s.id === skillId
          ? {
              ...s,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : s
      )
    );
  };

  const handleUpdateRarPackage = (pkg: RarArchivePackage) => {
    if (!isCollaboratorMode) return;
    setActiveRarPackage(pkg);
    setSkills((prev) =>
      prev.map((s) =>
        s.id === activeSkill.id
          ? {
              ...s,
              rarPackage: pkg,
              predominantLanguages: pkg.metadata.predominantLanguages,
              colorPalette: pkg.metadata.colorPalette,
              aiModelLabel: pkg.metadata.aiModelLabel,
              appliedSkill: pkg.metadata.appliedSkill,
              updatedAt: new Date().toISOString(),
            }
          : s
      )
    );
  };

  const handleSaveRarProjectToBoveda = (pkg: RarArchivePackage) => {
    if (!isCollaboratorMode) {
      setShowAuthScreen(true);
      return;
    }
    const cleanTitle = pkg.archiveName.replace(/\.rar$/i, '');
    const existingWithSameArchive = skills.find(
      (s) => s.rarPackage?.archiveName === pkg.archiveName
    );
    if (existingWithSameArchive) {
      handleUpdateRarPackage(pkg);
      setGlobalStatus(
        `Paquete ${pkg.archiveName} actualizado en el Códice Neuronal`
      );
      setTimeout(() => setGlobalStatus(null), 2600);
      return;
    }

    const mdFile = pkg.files.find((f) => f.language === 'markdown');
    handleCreateSkill({
      name: `${cleanTitle} · Núcleo de Proyecto .RAR`,
      filename: mdFile?.name || `${cleanTitle}.md`,
      summary: `Paquete .RAR (${pkg.signatureDetected}) desarrollado con ${pkg.metadata.aiModelLabel} y la skill #${pkg.metadata.appliedSkill}. Contiene ${pkg.files.length} módulos inspeccionables.`,
      category: 'Núcleo .RAR',
      level: 'Avanzado',
      kind: 'proyecto',
      tags: [
        `#${pkg.metadata.appliedSkill}`,
        '#rar-package',
        '#codice-neuronal',
      ],
      language: 'en',
      aiModelId: pkg.metadata.aiModelId,
      aiModelLabel: pkg.metadata.aiModelLabel,
      appliedSkill: pkg.metadata.appliedSkill,
      predominantLanguages: pkg.metadata.predominantLanguages,
      colorPalette: pkg.metadata.colorPalette,
      rarPackage: pkg,
      markdownContent:
        mdFile?.content ||
        `# Project Documentation: ${cleanTitle}\n\n## Overview\nThis package was extracted in memory from \`${pkg.archiveName}\`. Press the **Traducir** button in the top bar to translate this documentation into Spanish instantaneously.`,
      ficha: {
        whereToUse: 'Núcleo de Proyectos .RAR y Códice Neuronal',
        requirements: 'Paquete .RAR verificado en memoria',
        estimatedTime: 'Inspección y traducción en 1 clic',
        collaborators: [currentUser?.email || '@colaborador'],
      },
      uiSpec: activeSkill.uiSpec,
      models: activeSkill.models,
      screenshots: activeSkill.screenshots,
      codeSnippets: activeSkill.codeSnippets,
    });
    setGlobalStatus(
      `¡Paquete ${pkg.archiveName} registrado en el Códice Neuronal!`
    );
    setTimeout(() => setGlobalStatus(null), 2600);
  };

  if (showAuthScreen) {
    return (
      <div className="relative min-h-screen bg-[#07050E]">
        <NeuralAtmosphereBackground />
        <div className="relative z-10">
          <AuthScreen
            onAuthenticated={handleAuthenticated}
            onContinueAsPublic={() => setShowAuthScreen(false)}
          />
        </div>
      </div>
    );
  }

  const formattedModelLabel = `${selectedModel.family} · ${selectedModel.version}`;

  return (
    <div className="relative min-h-screen flex bg-[#07050E] text-slate-100 selection:bg-[#8B5CF6] selection:text-white">
      <NeuralAtmosphereBackground />

      {/* COLUMNA PRINCIPAL DINÁMICA (CABECERA CONTEXTUAL + CONTENIDO EN CUADRÍCULA + PIE) */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0">
        <TopStudioHeader
          skills={skills}
          activeSkillId={activeSkill.id}
          onSelectSkill={handleSelectSkill}
          activePage={activePage}
          onNavigatePage={setActivePage}
          currentUser={currentUser}
          onRequestLogin={() => setShowAuthScreen(true)}
          onLogout={handleLogout}
          onErasePersonalData={handleErasePersonalData}
          selectedModelName={formattedModelLabel}
        />

        {globalStatus && (
          <div
            role="status"
            aria-live="polite"
            className="relative z-20 mx-auto mt-3 flex max-w-md items-center justify-center gap-2 rounded-full border border-purple-500/50 bg-[#120D24] px-4 py-1.5 text-xs font-bold text-[#C084FC] purple-glow-sm"
          >
            <span className="h-2 w-2 rounded-full bg-[#8B5CF6] animate-ping" />
            {globalStatus}
          </div>
        )}

        <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-7">
          {activePage === 'inicio' && (
            <InformativeLandingSection
              onNavigatePage={setActivePage}
              onSelectModelVersion={(version) => {
                const found = AI_BENCHMARK_MODELS.find(
                  (m) => m.version === version
                );
                if (found) setSelectedModelId(found.id);
              }}
              onFilterByFramework={(tag) => {
                setSearchQuery(tag);
              }}
            />
          )}

          {activePage !== 'inicio' && (
            <Suspense
              fallback={
                <div
                  role="status"
                  aria-live="polite"
                  className="mx-auto my-16 flex max-w-md flex-col items-center justify-center gap-3 rounded-3xl border border-[#FF6B00]/40 bg-[#0F172A]/90 p-8 text-center shadow-2xl"
                >
                  <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#FF6B00] border-t-transparent" />
                  <p className="text-xs font-extrabold uppercase tracking-wider text-[#F97316]">
                    Cargando módulo del Códice Neuronal...
                  </p>
                </div>
              }
            >
              {activePage === 'boveda' && (
                <SkillManager
                  skills={skills}
                  activeSkillId={activeSkill.id}
                  isEditorMode={isCollaboratorMode}
                  currentUserName={currentUser?.fullName}
                  onRequestLogin={() => setShowAuthScreen(true)}
                  onSelectSkill={handleSelectSkill}
                  onCreateSkill={handleCreateSkill}
                  onUpdateSkill={handleUpdateSkill}
                  onDeleteSkill={handleDeleteSkill}
                  onStatusChange={setGlobalStatus}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onNavigatePage={setActivePage}
                />
              )}

              {activePage === 'estudio' && (
                <UnifiedProjectStudio
                  activeSkill={activeSkill}
                  activeRarPackage={activeRarPackage}
                  isEditorMode={isCollaboratorMode}
                  onRequestLogin={() => setShowAuthScreen(true)}
                  onUpdateRarPackage={handleUpdateRarPackage}
                  onSaveRarProjectToBoveda={handleSaveRarProjectToBoveda}
                  onUpdateSkill={handleUpdateSkill}
                  onUpdateSkillMarkdown={handleUpdateSkillMarkdown}
                  onUpdateProjectMetadata={handleUpdateProjectMetadata}
                  onNavigatePage={setActivePage}
                />
              )}

              {activePage === 'preview' && (
                <UIComponentPreview
                  skill={activeSkill}
                  onUpdateSkill={handleUpdateSkill}
                  onStatusChange={setGlobalStatus}
                  isCollaboratorMode={isCollaboratorMode}
                  currentUserName={currentUser?.fullName}
                  onRequestLogin={() => setShowAuthScreen(true)}
                />
              )}

              {activePage === 'evidencias' && (
                <ContextEvidenceLogger
                  skill={activeSkill}
                  onUpdateSkill={handleUpdateSkill}
                  onStatusChange={setGlobalStatus}
                />
              )}

              {activePage === 'modelos-ia' && (
                <AIModelBenchmarkPanel
                  selectedModelId={selectedModelId}
                  onSelectModel={setSelectedModelId}
                  activeSkill={activeSkill}
                  onUpdateSkill={handleUpdateSkill}
                  onStatusChange={setGlobalStatus}
                  isCollaboratorMode={isCollaboratorMode}
                  currentUserName={currentUser?.fullName}
                />
              )}
            </Suspense>
          )}
        </main>

        <footer className="border-t border-purple-500/20 bg-[#07050E]/95 backdrop-blur-md py-6 px-4 sm:px-6 text-xs text-purple-200/70">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6] shadow-sm shadow-[#8B5CF6]" />
              <span className="font-bold text-white">
                Códice Studio · Ecosistema Neuronal IA
              </span>
              <span className="text-purple-400/40">·</span>
              <span>
                Noche Obsidiana (<code className="text-purple-300">#07050E</code> /{' '}
                <code className="text-purple-300">#120D24</code>) &amp; Violeta Moderno (<code className="text-[#C084FC]">#8B5CF6</code>)
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-purple-200/60">
              <span>
                Rol de acceso:{' '}
                <strong
                  className={
                    isCollaboratorMode ? 'text-[#C084FC]' : 'text-sky-400'
                  }
                >
                  {isCollaboratorMode && currentUser
                    ? `Modo Colaborador (${currentUser.email})`
                    : 'Modo Visitante (Público General · Solo Lectura)'}
                </strong>
              </span>
              <span className="text-purple-400/40">|</span>
              <span>
                Núcleo activo:{' '}
                <code className="text-[#C084FC] font-semibold">
                  {activeRarPackage.archiveName}
                </code>
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
