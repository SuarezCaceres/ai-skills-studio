import React, { useState, useEffect, lazy, Suspense } from 'react';
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
import { useCatalog } from './hooks/useCatalog';

const CodiceStudio = lazy(() =>
  import('./components/CodiceStudio').then((m) => ({
    default: m.CodiceStudio,
  }))
);
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
const CatalogPage = lazy(() =>
  import('./components/catalog/CatalogPage').then((m) => ({
    default: m.CatalogPage,
  }))
);
const CatalogDetailRoute = lazy(() =>
  import('./components/catalog/CatalogDetailRoute').then((m) => ({
    default: m.CatalogDetailRoute,
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

  const [showAuthScreen, setShowAuthScreen] = useState<boolean>(false);
  // Sesión de GitHub (solo en memoria). Montar el hook aquí completa el regreso de
  // OAuth (`?code&state`) al arrancar, también en el modo por redirección.
  const { session: githubSession, signOut: signOutGithub } = useCatalog();

  const [skills, setSkills] = useState<SkillDocument[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (isValidSkillDocumentArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((item) => item.id));
          const missingBuiltIns = INITIAL_SKILLS.filter(
            (builtIn) => !existingIds.has(builtIn.id)
          );
          return [...missingBuiltIns, ...parsed];
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
  const [selectedCatalogSkillId, setSelectedCatalogSkillId] = useState<
    string | null
  >(null);
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
      // Ignorar límites de cuota de almacenamiento local
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
    setGlobalStatus(`Modo Colaborador activado · Bienvenido, ${user.fullName}`);
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

  // Al completarse el inicio de sesión con GitHub se entra como colaborador.
  useEffect(() => {
    if (!githubSession) return;
    if (currentUser?.id === `gh-${githubSession.login}`) return;
    handleAuthenticated({
      id: `gh-${githubSession.login}`,
      fullName: githubSession.login,
      email: `${githubSession.login}@users.noreply.github.com`,
      role: 'Colaborador · GitHub',
      createdAt: new Date().toLocaleDateString(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [githubSession]);

  const handleLogout = () => {
    signOutGithub();
    setCurrentUser(null);
    setShowAuthScreen(false);
    setGlobalStatus('Sesión cerrada · Exploras en Modo Visitante');
    setTimeout(() => setGlobalStatus(null), 2800);
    try {
      localStorage.removeItem(AUTH_SESSION_KEY);
    } catch {
      // ignore
    }
  };

  const handleErasePersonalData = () => {
    signOutGithub();
    eraseAllPersonalData();
    setCurrentUser(null);
    setShowAuthScreen(false);
    setGlobalStatus(
      'Datos personales eliminados (GDPR / CCPA) · Sesión cerrada'
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

  // Permite montar carpetas/ZIPs y probar ediciones en memoria tanto en visitante como colaborador
  const handleUpdateRarPackage = (pkg: RarArchivePackage) => {
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
    const cleanTitle = pkg.archiveName.replace(/\.(zip|skillbundle|rar)$/i, '');
    const existingWithSameArchive = skills.find(
      (s) => s.rarPackage?.archiveName === pkg.archiveName
    );
    if (existingWithSameArchive) {
      handleUpdateRarPackage(pkg);
      setGlobalStatus(`Workspace ${pkg.archiveName} actualizado en la bóveda`);
      setTimeout(() => setGlobalStatus(null), 2600);
      return;
    }

    const mdFile = pkg.files.find((f) => f.language === 'markdown');
    handleCreateSkill({
      name: `${cleanTitle} · Workspace VFS`,
      filename: mdFile?.name || `${cleanTitle}.md`,
      summary: `Workspace (${pkg.signatureDetected}) auditado con ${pkg.metadata.aiModelLabel} y la directiva #${pkg.metadata.appliedSkill}. Incluye ${pkg.files.length} archivos en VFS.`,
      category: 'Workspace VFS',
      level: 'Avanzado',
      kind: 'proyecto',
      tags: [
        `#${pkg.metadata.appliedSkill}`,
        '#workspace-vfs',
        '#zip-bundle',
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
        `# Workspace Documentation: ${cleanTitle}\n\n## Overview\nThis workspace was mounted in client memory from \`${pkg.archiveName}\`. Use the **Traducir ES** action to translate technical sections into Spanish.`,
      ficha: {
        whereToUse: 'Workspace VFS, paquetes ZIP y bóveda local',
        requirements: 'Navegador moderno con soporte Web Crypto y DecompressionStream',
        estimatedTime: 'Inspección y diff en tiempo real',
        collaborators: [currentUser?.email || '@colaborador'],
      },
      uiSpec: activeSkill.uiSpec,
      models: activeSkill.models,
      screenshots: activeSkill.screenshots,
      codeSnippets: activeSkill.codeSnippets,
    });
    setGlobalStatus(`Workspace ${pkg.archiveName} guardado en la bóveda`);
    setTimeout(() => setGlobalStatus(null), 2600);
  };

  const openModuleFromFooter = (
    e: React.MouseEvent<HTMLAnchorElement>,
    page: AppPageRoute
  ) => {
    e.preventDefault();
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  if (showAuthScreen) {
    return (
      <div className="relative min-h-screen bg-[#0a0d14] text-[#f1f5f9]">
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

  /* MODO LANDING (activePage === 'inicio'): estructura estricta tasteskill 2.5.1 (header.nav + main#top + footer.closing) */
  if (activePage === 'inicio') {
    return (
      <>
        <NeuralAtmosphereBackground />
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
          githubAvatarUrl={githubSession?.avatarUrl}
        />

        <main id="top">
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
        </main>

        <footer
          className="footer closing g2m"
          id="contact"
          aria-labelledby="close-h"
        >
          <div className="wrap">
            <div className="closing__cta close--type">
              <div className="section-head">
                <h2 id="close-h">Audita tu próximo workspace hoy</h2>
                <p className="t-small muted">
                  Ejecución íntegra en navegador · Sin servidor ni registro previo
                </p>
              </div>
              <a
                className="btn btn--primary"
                href="#workspace"
                onClick={(e) => openModuleFromFooter(e, 'estudio')}
              >
                Abrir Workspace
              </a>
            </div>

            <div className="closing__links">
              <div className="grid">
                <div className="span-4 stack-4">
                  <a className="nav__logo" href="#top">
                    <span className="mark" data-mark="stack" aria-hidden="true" />
                    Códice Studio
                  </a>
                  <p className="footer__lede">
                    Auditoría local de skills y workspaces IA.
                  </p>
                </div>

                <div className="footer__col span-2">
                  <h3>Módulos</h3>
                  <ul>
                    <li>
                      <a
                        href="#workspace"
                        onClick={(e) => openModuleFromFooter(e, 'estudio')}
                      >
                        Workspace VFS
                      </a>
                    </li>
                    <li>
                      <a
                        href="#capabilities"
                        onClick={(e) => openModuleFromFooter(e, 'boveda')}
                      >
                        Catálogo SKILL.md
                      </a>
                    </li>
                    <li>
                      <a
                        href="#benchmarks"
                        onClick={(e) => openModuleFromFooter(e, 'codice-studio')}
                      >
                        Códice Obsidian
                      </a>
                    </li>
                  </ul>
                </div>

                <div className="footer__col span-2">
                  <h3>Página</h3>
                  <ul>
                    <li>
                      <a href="#workspace">Workspace</a>
                    </li>
                    <li>
                      <a href="#capabilities">Capacidades</a>
                    </li>
                    <li>
                      <a href="#benchmarks">Modelos</a>
                    </li>
                  </ul>
                </div>

                <div className="footer__col span-2">
                  <h3>Verificación</h3>
                  <ul>
                    <li>
                      <a
                        href="#capabilities"
                        onClick={(e) => openModuleFromFooter(e, 'preview')}
                      >
                        Componentes UI
                      </a>
                    </li>
                    <li>
                      <a
                        href="#faq"
                        onClick={(e) => openModuleFromFooter(e, 'evidencias')}
                      >
                        Registro visual
                      </a>
                    </li>
                    <li>
                      <a href="#faq">Preguntas</a>
                    </li>
                  </ul>
                </div>

                <div className="footer__col span-2">
                  <h3>Cuenta</h3>
                  <ul>
                    <li>
                      <a
                        href="#top"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowAuthScreen(true);
                        }}
                      >
                        Acceder
                      </a>
                    </li>
                    <li>
                      <a href="obsidian://open?vault=ai-skills-studio">
                        Abrir en Obsidian
                      </a>
                    </li>
                    <li>
                      <a href="https://github.com/suarezcaceres/ai-skills-studio">
                        Repositorio
                      </a>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="footer__legal">
                <span>&copy; 2026 Códice Studio. Ejecución local en cliente.</span>
                <div className="socials" />
                <span>
                  Los nombres de productos y logotipos son marcas registradas de sus
                  respectivos propietarios.
                </span>
              </div>
            </div>
          </div>
        </footer>
      </>
    );
  }

  /* MODO IDE INTERNO (activePage !== 'inicio'): estación de trabajo de ancho completo sin restricciones 100svh */
  return (
    <>
      <NeuralAtmosphereBackground />
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
          githubAvatarUrl={githubSession?.avatarUrl}
      />

      <div className="ide-shell selection:bg-[#0ea5e9] selection:text-[#0a0d14] relative z-10">
        {globalStatus && (
          <div
            role="status"
            aria-live="polite"
            className="mx-auto mt-4 flex max-w-lg items-center justify-center gap-2 rounded-full border border-[#0ea5e9]/40 bg-[#121722] px-4 py-1.5 text-xs font-medium text-[#f1f5f9]"
          >
            <span className="h-2 w-2 rounded-full bg-[#0ea5e9]" />
            {globalStatus}
          </div>
        )}

        <main id="top" className="ide-container">
          <div>
            <Suspense
              fallback={
                <div
                  role="status"
                  aria-live="polite"
                  className="mx-auto my-16 flex max-w-md flex-col items-center justify-center gap-3 rounded-lg border border-slate-800 bg-[#121722] p-8 text-center"
                >
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0ea5e9] border-t-transparent" />
                  <p className="text-xs font-medium text-slate-300">
                    Cargando estación de trabajo...
                  </p>
                </div>
              }
            >
              {activePage === 'codice-studio' && <CodiceStudio />}

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

              {activePage === 'catalogo' && (
                <CatalogPage
                  onOpenSkill={(id) => {
                    setSelectedCatalogSkillId(id);
                    setActivePage('skill-detalle');
                  }}
                  onRequestLogin={() => setShowAuthScreen(true)}
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

              {activePage === 'skill-detalle' && (
                <CatalogDetailRoute
                  skillId={selectedCatalogSkillId}
                  onBack={() => setActivePage('catalogo')}
                  onRequestLogin={() => setShowAuthScreen(true)}
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
          </div>
        </main>

        <footer className="border-t border-slate-800/80 bg-[#0a0d14] py-5 px-6 text-xs text-slate-400">
          <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-[#0ea5e9]" />
              <span className="font-semibold text-slate-200">
                Códice Studio · Workspace VFS
              </span>
              <span>·</span>
              <span>
                Carbón neutro (<code className="text-slate-300">#0a0d14</code>) y acento cian (
                <code className="text-[#38bdf8]">#0ea5e9</code>)
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span>
                Sesión:{' '}
                <strong
                  className={
                    isCollaboratorMode ? 'text-emerald-400' : 'text-[#38bdf8]'
                  }
                >
                  {isCollaboratorMode && currentUser
                    ? `Colaborador (${currentUser.email})`
                    : 'Visitante (lectura y pruebas en memoria)'}
                </strong>
              </span>
              <span>|</span>
              <span>
                Paquete activo:{' '}
                <code className="font-mono text-slate-200">
                  {activeRarPackage.archiveName}
                </code>
              </span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

export default App;
