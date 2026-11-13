import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { SkillDocument } from './types/skill';
import {
  AppPageRoute,
  UserAccount,
  RarArchivePackage,
} from './types/workspace';
import { AI_BENCHMARK_MODELS } from './data/aiModelsData';
import { DEFAULT_RAR_PACKAGE } from './services/rarParserService';
import { eraseAllPersonalData } from './utils/securityHardening';
import {
  WORKING_COPIES_KEY,
  buildWorkspacePackage,
  catalogSkillToDocument,
  createScratchSkill,
  loadWorkingCopies,
  pickWorkspaceFiles,
  saveWorkingCopies,
  upsertWorkingCopy,
} from './utils/workingCopy';
import { ActiveSkillBar } from './components/studio/ActiveSkillBar';
import { NoSkillState } from './components/studio/NoSkillState';
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
const TeamSkillsPage = lazy(() =>
  import('./components/catalog/TeamSkillsPage').then((m) => ({
    default: m.TeamSkillsPage,
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

// Datos de versiones anteriores (cuentas locales con contraseña y su sesión). Ya no se usan.
const LEGACY_AUTH_KEYS = ['ai_skills_studio_users_v2', 'ai_skills_studio_session_v1'];

export function App() {
  const [showAuthScreen, setShowAuthScreen] = useState<boolean>(false);
  // Sesión de GitHub (solo en memoria): es la única identidad. Montar el hook aquí completa
  // el regreso de OAuth (`?code&state`) al arrancar, también en el modo por redirección.
  const { session: githubSession, service: catalogService, signOut: signOutGithub } = useCatalog();

  const currentUser = useMemo<UserAccount | null>(
    () =>
      githubSession
        ? {
            id: `gh-${githubSession.login}`,
            fullName: githubSession.login,
            email: `${githubSession.login}@users.noreply.github.com`,
            role: 'Colaborador · GitHub',
            createdAt: '',
          }
        : null,
    [githubSession]
  );
  const isCollaboratorMode = Boolean(currentUser);

  // Copias de trabajo: skills del equipo traídas al navegador con "Abrir en estudio".
  const [skills, setSkills] = useState<SkillDocument[]>(loadWorkingCopies);
  const [activeSkillId, setActiveSkillId] = useState<string | null>(
    () => skills[0]?.id ?? null
  );
  // Skill transitoria para usar el Workspace con un paquete suelto, sin guardar nada.
  const [scratchSkill, setScratchSkill] = useState<SkillDocument>(createScratchSkill);
  const [activePage, setActivePage] = useState<AppPageRoute>('inicio');
  const [selectedCatalogSkillId, setSelectedCatalogSkillId] = useState<
    string | null
  >(null);
  // Pantalla a la que vuelve el detalle de una skill del catálogo (equipo o catálogo).
  const [detailBackPage, setDetailBackPage] = useState<AppPageRoute>('catalogo');

  const openCatalogSkill = (id: string, from: AppPageRoute) => {
    setSelectedCatalogSkillId(id);
    setDetailBackPage(from);
    setActivePage('skill-detalle');
  };
  const [selectedModelId, setSelectedModelId] = useState<string>(
    AI_BENCHMARK_MODELS[0].id
  );
  const [activeRarPackage, setActiveRarPackage] = useState<RarArchivePackage>(
    () => skills[0]?.rarPackage || DEFAULT_RAR_PACKAGE
  );
  const [globalStatus, setGlobalStatus] = useState<string | null>(null);

  const flash = (message: string, ms = 2800) => {
    setGlobalStatus(message);
    setTimeout(() => setGlobalStatus(null), ms);
  };

  useEffect(() => {
    saveWorkingCopies(skills);
  }, [skills]);

  // Limpieza única de las cuentas locales con contraseña de versiones anteriores.
  useEffect(() => {
    try {
      LEGACY_AUTH_KEYS.forEach((k) => localStorage.removeItem(k));
    } catch {
      // sin acceso a localStorage
    }
  }, []);

  const workingSkill: SkillDocument | null =
    skills.find((s) => s.id === activeSkillId) ?? skills[0] ?? null;
  // Los módulos que guardan trabajo por skill exigen una copia; el Workspace también
  // funciona con un paquete suelto.
  const studioSkill: SkillDocument = workingSkill ?? scratchSkill;
  const selectedModel =
    AI_BENCHMARK_MODELS.find((m) => m.id === selectedModelId) ||
    AI_BENCHMARK_MODELS[0];

  const handleSelectSkill = (id: string) => {
    setActiveSkillId(id);
    const found = skills.find((s) => s.id === id);
    setActiveRarPackage(found?.rarPackage || DEFAULT_RAR_PACKAGE);
  };

  // Al completarse el inicio de sesión con GitHub se cierra la pantalla de acceso.
  useEffect(() => {
    if (!githubSession) return;
    setShowAuthScreen(false);
    setGlobalStatus(`Sesión iniciada · Bienvenido, @${githubSession.login}`);
    const t = setTimeout(() => setGlobalStatus(null), 2800);
    return () => clearTimeout(t);
  }, [githubSession?.login]);

  const handleLogout = () => {
    signOutGithub();
    setShowAuthScreen(false);
    flash('Sesión cerrada · Exploras en Modo Visitante');
  };

  const handleErasePersonalData = () => {
    signOutGithub();
    eraseAllPersonalData();
    try {
      localStorage.removeItem(WORKING_COPIES_KEY);
    } catch {
      // ignorar
    }
    setSkills([]);
    setActiveSkillId(null);
    setActiveRarPackage(DEFAULT_RAR_PACKAGE);
    setScratchSkill(createScratchSkill());
    setShowAuthScreen(false);
    flash('Datos locales eliminados (GDPR / CCPA) · Sesión cerrada', 3200);
  };

  // Aplica un cambio a una copia de trabajo o, si es el paquete suelto, a la skill transitoria.
  const patchSkill = (id: string, change: (s: SkillDocument) => SkillDocument) => {
    if (id === scratchSkill.id) setScratchSkill((prev) => change(prev));
    else setSkills((prev) => prev.map((s) => (s.id === id ? change(s) : s)));
  };

  const handleUpdateSkill = (updated: SkillDocument) => {
    patchSkill(updated.id, () => updated);
  };

  const handleUpdateSkillMarkdown = (
    skillId: string,
    markdownContent: string,
    translatedContent?: string
  ) => {
    patchSkill(skillId, (s) => ({
      ...s,
      markdownContent,
      translatedContent: translatedContent ?? s.translatedContent,
      updatedAt: new Date().toISOString(),
    }));
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
    patchSkill(skillId, (s) => ({
      ...s,
      ...updates,
      updatedAt: new Date().toISOString(),
    }));
  };

  // Permite montar carpetas/ZIPs y probar ediciones en memoria tanto en visitante como con GitHub.
  const handleUpdateRarPackage = (pkg: RarArchivePackage) => {
    setActiveRarPackage(pkg);
    patchSkill(studioSkill.id, (s) => ({
      ...s,
      rarPackage: pkg,
      predominantLanguages: pkg.metadata.predominantLanguages,
      colorPalette: pkg.metadata.colorPalette,
      aiModelLabel: pkg.metadata.aiModelLabel,
      appliedSkill: pkg.metadata.appliedSkill,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleRemoveWorkingCopy = (id: string) => {
    const rest = skills.filter((s) => s.id !== id);
    setSkills(rest);
    if (workingSkill?.id === id) {
      const next = rest[0] ?? null;
      setActiveSkillId(next?.id ?? null);
      setActiveRarPackage(next?.rarPackage || DEFAULT_RAR_PACKAGE);
    }
    flash('Copia de trabajo quitada de este navegador');
  };

  // "Abrir en estudio": trae la skill del equipo (SKILL.md y archivos de texto pequeños) al
  // navegador como copia de trabajo y abre el Workspace con ella.
  const openInStudio = async (catalogId: string) => {
    setGlobalStatus('Preparando la copia de trabajo…');
    try {
      const skill = await catalogService.getSkill(catalogId);
      if (!skill) throw new Error('La skill ya no está registrada en el catálogo.');
      const loaded = await Promise.all(
        pickWorkspaceFiles(skill).map(async (path) => {
          if (path === 'SKILL.md') return { path, content: skill.markdown };
          try {
            return { path, content: await catalogService.getSkillFileContent(skill.id, path) };
          } catch {
            return null; // un archivo que no se pudo leer no impide abrir la skill
          }
        })
      );
      const files = loaded.filter((f): f is { path: string; content: string } => f !== null);
      if (!files.some((f) => f.path === 'SKILL.md')) files.unshift({ path: 'SKILL.md', content: skill.markdown });

      const pkg = buildWorkspacePackage(skill, files);
      const next = upsertWorkingCopy(skills, catalogSkillToDocument(skill, pkg));
      const opened = next[0];
      setSkills(next);
      setActiveSkillId(opened.id);
      setActiveRarPackage(opened.rarPackage ?? pkg);
      setActivePage('estudio');
      window.scrollTo({ top: 0, behavior: 'auto' });
      flash(`Copia de trabajo de ${skill.name} lista`);
    } catch (err) {
      flash(err instanceof Error && err.message ? err.message : 'No se pudo abrir la skill en el estudio.', 4200);
    }
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
          <AuthScreen onContinueAsPublic={() => setShowAuthScreen(false)} />
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
          activeSkillId={workingSkill?.id ?? ''}
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
            onFilterByFramework={() => {
              setActivePage('boveda');
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

  const skillBar = (
    <ActiveSkillBar
      skills={skills}
      activeSkill={workingSkill}
      onSelect={handleSelectSkill}
      onRemove={handleRemoveWorkingCopy}
      onOpenDetail={(id) => openCatalogSkill(id, activePage)}
      onGoToTeam={() => setActivePage('boveda')}
    />
  );

  /* MODO IDE INTERNO (activePage !== 'inicio'): estación de trabajo de ancho completo sin restricciones 100svh */
  return (
    <>
      <NeuralAtmosphereBackground />
      <TopStudioHeader
        skills={skills}
        activeSkillId={workingSkill?.id ?? ''}
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
                <TeamSkillsPage
                  onOpenSkill={(id) => openCatalogSkill(id, 'boveda')}
                  onRequestLogin={() => setShowAuthScreen(true)}
                  onOpenInStudio={openInStudio}
                />
              )}

              {activePage === 'catalogo' && (
                <CatalogPage
                  onOpenSkill={(id) => openCatalogSkill(id, 'catalogo')}
                  onRequestLogin={() => setShowAuthScreen(true)}
                  onOpenInStudio={openInStudio}
                />
              )}

              {activePage === 'estudio' && (
                <>
                  {skillBar}
                  <UnifiedProjectStudio
                    activeSkill={studioSkill}
                    activeRarPackage={activeRarPackage}
                    isEditorMode={isCollaboratorMode}
                    onRequestLogin={() => setShowAuthScreen(true)}
                    onUpdateRarPackage={handleUpdateRarPackage}
                    onUpdateSkill={handleUpdateSkill}
                    onUpdateSkillMarkdown={handleUpdateSkillMarkdown}
                    onUpdateProjectMetadata={handleUpdateProjectMetadata}
                    onNavigatePage={setActivePage}
                  />
                </>
              )}

              {activePage === 'preview' &&
                (workingSkill ? (
                  <>
                    {skillBar}
                    <UIComponentPreview
                      skill={workingSkill}
                      onUpdateSkill={handleUpdateSkill}
                      onStatusChange={setGlobalStatus}
                      isCollaboratorMode={isCollaboratorMode}
                      currentUserName={currentUser?.fullName}
                      onRequestLogin={() => setShowAuthScreen(true)}
                    />
                  </>
                ) : (
                  <NoSkillState
                    module="Componentes"
                    description="Aquí pruebas barras de menús y paletas accesibles con el estilo de una skill y guardas el resultado en su copia."
                    onGoToTeam={() => setActivePage('boveda')}
                  />
                ))}

              {activePage === 'evidencias' &&
                (workingSkill ? (
                  <>
                    {skillBar}
                    <ContextEvidenceLogger
                      skill={workingSkill}
                      onUpdateSkill={handleUpdateSkill}
                      onStatusChange={setGlobalStatus}
                    />
                  </>
                ) : (
                  <NoSkillState
                    module="Capturas"
                    description="Aquí guardas capturas y fragmentos de código de las pruebas de una skill."
                    onGoToTeam={() => setActivePage('boveda')}
                  />
                ))}

              {activePage === 'skill-detalle' && (
                <CatalogDetailRoute
                  skillId={selectedCatalogSkillId}
                  onBack={() => setActivePage(detailBackPage)}
                  backLabel={detailBackPage === 'boveda' ? 'Skills del equipo' : 'Catálogo'}
                  onOpenInStudio={openInStudio}
                  onRequestLogin={() => setShowAuthScreen(true)}
                />
              )}

              {activePage === 'modelos-ia' &&
                (workingSkill ? (
                  <>
                    {skillBar}
                    <AIModelBenchmarkPanel
                      selectedModelId={selectedModelId}
                      onSelectModel={setSelectedModelId}
                      activeSkill={workingSkill}
                      onUpdateSkill={handleUpdateSkill}
                      onStatusChange={setGlobalStatus}
                      isCollaboratorMode={isCollaboratorMode}
                      currentUserName={currentUser?.fullName}
                    />
                  </>
                ) : (
                  <NoSkillState
                    module="Modelos"
                    description="Aquí comparas cómo responden los modelos de IA con una skill y registras cuál funcionó mejor."
                    onGoToTeam={() => setActivePage('boveda')}
                  />
                ))}
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
                  {isCollaboratorMode && githubSession
                    ? `GitHub (@${githubSession.login})`
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
