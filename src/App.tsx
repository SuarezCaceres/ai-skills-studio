import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import type { CatalogSkillPreview } from './types/catalog';
import type { SkillsShBusyKind, SkillsShEntry } from './types/skillsSh';
import { AppPageRoute, UserAccount } from './types/workspace';
import { eraseAllPersonalData } from './utils/securityHardening';
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
const ComponentsPage = lazy(() =>
  import('./components/components/ComponentsPage').then((m) => ({
    default: m.ComponentsPage,
  }))
);
const PagesPage = lazy(() =>
  import('./components/pages/PagesPage').then((m) => ({
    default: m.PagesPage,
  }))
);
const CatalogPage = lazy(() =>
  import('./components/catalog/CatalogPage').then((m) => ({
    default: m.CatalogPage,
  }))
);
const MemberProfilePage = lazy(() =>
  import('./components/catalog/MemberProfilePage').then((m) => ({
    default: m.MemberProfilePage,
  }))
);
const CatalogDetailRoute = lazy(() =>
  import('./components/catalog/CatalogDetailRoute').then((m) => ({
    default: m.CatalogDetailRoute,
  }))
);
const SkillsShPage = lazy(() =>
  import('./components/skills-sh/SkillsShPage').then((m) => ({
    default: m.SkillsShPage,
  }))
);

// Datos de versiones anteriores (cuentas locales con contraseña, su sesión y copias de trabajo). Ya no se usan.
const LEGACY_AUTH_KEYS = ['ai_skills_studio_users_v2', 'ai_skills_studio_session_v1'];
const LEGACY_WORKCOPIES_KEY = 'ai_skills_studio_workcopies_v1';

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

  const [activePage, setActivePage] = useState<AppPageRoute>('inicio');
  const [selectedCatalogSkillId, setSelectedCatalogSkillId] = useState<
    string | null
  >(null);
  const [previewSkill, setPreviewSkill] = useState<CatalogSkillPreview | null>(
    null
  );
  const [importingPreview, setImportingPreview] = useState(false);
  // Pantalla a la que vuelve el detalle de una skill del catálogo (equipo, catálogo o explorar).
  const [detailBackPage, setDetailBackPage] = useState<AppPageRoute>('catalogo');

  // Componente elegido en la página Componentes (se puede abrir desde otras pantallas).
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  // Clase abierta en Códice → Clases; se conserva al saltar a una skill o a un componente y volver.
  const [openLessonId, setOpenLessonId] = useState<string | null>(null);

  const openCatalogSkill = (id: string, from: AppPageRoute) => {
    setPreviewSkill(null);
    setSelectedCatalogSkillId(id);
    setDetailBackPage(from);
    setActivePage('skill-detalle');
  };

  // Perfil de un integrante y pantalla a la que vuelve.
  const [selectedProfileLogin, setSelectedProfileLogin] = useState<string | null>(null);
  const [profileBackPage, setProfileBackPage] = useState<AppPageRoute>('boveda');
  const openProfile = (login: string, from: AppPageRoute) => {
    setSelectedProfileLogin(login);
    setProfileBackPage(from);
    setActivePage('perfil');
    window.scrollTo({ top: 0, behavior: 'auto' });
  };
  const [globalStatus, setGlobalStatus] = useState<string | null>(null);
  const [skillsShBusy, setSkillsShBusy] = useState<{
    entryId: string;
    kind: SkillsShBusyKind;
  } | null>(null);

  const flash = (message: string, ms = 2800) => {
    setGlobalStatus(message);
    setTimeout(() => setGlobalStatus(null), ms);
  };

  // Limpieza única de las cuentas locales con contraseña de versiones anteriores.
  useEffect(() => {
    try {
      LEGACY_AUTH_KEYS.forEach((k) => localStorage.removeItem(k));
    } catch {
      // sin acceso a localStorage
    }
  }, []);

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
    try {
      localStorage.removeItem(LEGACY_WORKCOPIES_KEY);
    } catch {
      // ignorar
    }
    setShowAuthScreen(false);
    flash('Sesión cerrada · Exploras en Modo Visitante');
  };

  const handleErasePersonalData = () => {
    signOutGithub();
    eraseAllPersonalData();
    try {
      localStorage.removeItem(LEGACY_WORKCOPIES_KEY);
    } catch {
      // ignorar
    }
    setPreviewSkill(null);
    setShowAuthScreen(false);
    flash('Datos locales eliminados (GDPR / CCPA) · Sesión cerrada', 3200);
  };

  // Abre una skill de skills.sh (fuente GitHub) en vista previa de solo lectura fijada a commitSha.
  const inspectSkillsShEntry = async (entry: SkillsShEntry) => {
    if (!entry.isGithubSource) {
      flash('Esta skill vive en un dominio externo (.well-known). Instálala con el comando npx.', 4200);
      return;
    }
    if (!catalogService.inspectGithubSkillByHint) {
      flash('La inspección directa de repositorios no está disponible en este entorno.', 4000);
      return;
    }
    setSkillsShBusy({ entryId: entry.id, kind: 'inspect' });
    setGlobalStatus(`Inspeccionando ${entry.name} desde GitHub…`);
    try {
      const { skill, canonicalUrl } = await catalogService.inspectGithubSkillByHint(
        entry.source,
        entry.skillId
      );
      // Import diferido: estas utilidades solo hacen falta aquí y así no pesan en el chunk inicial.
      const { buildNpxInstallCommand, buildSkillsShUrl } = await import('./services/skillsShService');
      const npxCommand = buildNpxInstallCommand(entry.source, entry.skillId) || undefined;
      setPreviewSkill({
        skill,
        canonicalUrl,
        sourceLabel: 'skills.sh',
        externalUrl: buildSkillsShUrl(entry.source, entry.skillId),
        npxCommand,
      });
      setSelectedCatalogSkillId(null);
      setDetailBackPage('skills-sh');
      setActivePage('skill-detalle');
      window.scrollTo({ top: 0, behavior: 'auto' });
      flash(`Vista previa de ${skill.name} fijada a ${skill.commitSha.slice(0, 7)}`);
    } catch (err) {
      flash(
        err instanceof Error && err.message
          ? err.message
          : 'No se pudo inspeccionar la skill desde GitHub.',
        4500
      );
    } finally {
      setSkillsShBusy(null);
    }
  };

  // Importa al catálogo comunitario la skill abierta actualmente en vista previa desde Explorar.
  const handleImportPreview = async (preview: CatalogSkillPreview) => {
    if (!githubSession) {
      setShowAuthScreen(true);
      flash('Inicia sesión con GitHub para importar esta skill al catálogo comunitario.', 3600);
      return;
    }
    setImportingPreview(true);
    setGlobalStatus(`Importando ${preview.skill.name} al catálogo…`);
    try {
      const registered = await catalogService.registerSkillFromUrl(preview.canonicalUrl);
      setPreviewSkill(null);
      setSelectedCatalogSkillId(registered.id);
      setDetailBackPage('skills-sh');
      setActivePage('skill-detalle');
      window.scrollTo({ top: 0, behavior: 'auto' });
      flash(`Skill «${registered.name}» disponible en el catálogo comunitario`);
    } catch (err) {
      flash(
        err instanceof Error && err.message
          ? err.message
          : 'No se pudo importar la skill al catálogo.',
        4500
      );
      throw err;
    } finally {
      setImportingPreview(false);
    }
  };

  // Registra una skill de skills.sh (fuente GitHub) en el catálogo comunitario de Códice Studio.
  const importSkillsShToCatalog = async (entry: SkillsShEntry) => {
    if (!entry.isGithubSource) {
      flash('Solo se pueden importar al catálogo skills alojadas en repositorios públicos de GitHub.', 4200);
      return;
    }
    if (!githubSession) {
      setShowAuthScreen(true);
      flash('Inicia sesión con GitHub para importar esta skill al catálogo comunitario.', 3600);
      return;
    }
    if (!catalogService.inspectGithubSkillByHint) {
      flash('La importación desde skills.sh no está disponible en este entorno.', 4000);
      return;
    }
    setSkillsShBusy({ entryId: entry.id, kind: 'import' });
    setGlobalStatus(`Importando ${entry.name} al catálogo…`);
    try {
      const { canonicalUrl } = await catalogService.inspectGithubSkillByHint(entry.source, entry.skillId);
      const registered = await catalogService.registerSkillFromUrl(canonicalUrl);
      openCatalogSkill(registered.id, 'skills-sh');
      window.scrollTo({ top: 0, behavior: 'auto' });
      flash(`Skill «${registered.name}» disponible en el catálogo comunitario`);
    } catch (err) {
      flash(
        err instanceof Error && err.message
          ? err.message
          : 'No se pudo importar la skill al catálogo.',
        4500
      );
    } finally {
      setSkillsShBusy(null);
    }
  };

  const openModuleFromFooter = (
    e: React.MouseEvent<HTMLAnchorElement>,
    page: AppPageRoute
  ) => {
    e.preventDefault();
    setPreviewSkill(null);
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

  /* MODO LANDING (activePage === 'inicio'): estructura estricta tasteskill 2.5.1 (header.nav + main#top + footer.closing) */
  if (activePage === 'inicio') {
    return (
      <>
        <NeuralAtmosphereBackground />
        <TopStudioHeader
          activePage={activePage}
          onNavigatePage={setActivePage}
          currentUser={currentUser}
          onRequestLogin={() => setShowAuthScreen(true)}
          onLogout={handleLogout}
          onErasePersonalData={handleErasePersonalData}
          githubAvatarUrl={githubSession?.avatarUrl}
        />

        <main id="top">
          <InformativeLandingSection onNavigatePage={setActivePage} />
        </main>

        <footer
          className="footer closing g2m"
          id="contact"
          aria-labelledby="close-h"
        >
          <div className="wrap">
            <div className="closing__cta close--type">
              <div className="section-head">
                <h2 id="close-h">Audita e inspecciona skills desde GitHub hoy</h2>
                <p className="t-small muted">
                  Lectura bajo demanda fijada a commitSha · Sin servidor ni registro previo
                </p>
              </div>
              <a
                className="btn btn--primary"
                href="#inspector"
                onClick={(e) => openModuleFromFooter(e, 'boveda')}
              >
                Explorar Catálogo
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
                    Catálogo comunitario, inspector por commitSha y clases del equipo.
                  </p>
                </div>

                <div className="footer__col span-2">
                  <h3>Módulos</h3>
                  <ul>
                    <li>
                      <a
                        href="#inspector"
                        onClick={(e) => openModuleFromFooter(e, 'boveda')}
                      >
                        Skills del equipo
                      </a>
                    </li>
                    <li>
                      <a
                        href="#capabilities"
                        onClick={(e) => openModuleFromFooter(e, 'catalogo')}
                      >
                        Catálogo comunitario
                      </a>
                    </li>
                    <li>
                      <a
                        href="#benchmarks"
                        onClick={(e) => openModuleFromFooter(e, 'codice-studio')}
                      >
                        Códice de clases
                      </a>
                    </li>
                    <li>
                      <a
                        href="#top"
                        onClick={(e) => openModuleFromFooter(e, 'skills-sh')}
                      >
                        Explorar skills.sh
                      </a>
                    </li>
                  </ul>
                </div>

                <div className="footer__col span-2">
                  <h3>Página</h3>
                  <ul>
                    <li>
                      <a href="#inspector">Inspector</a>
                    </li>
                    <li>
                      <a href="#capabilities">Capacidades</a>
                    </li>
                    <li>
                      <a href="#benchmarks">Módulos</a>
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
        activePage={activePage}
        onNavigatePage={setActivePage}
        currentUser={currentUser}
        onRequestLogin={() => setShowAuthScreen(true)}
        onLogout={handleLogout}
        onErasePersonalData={handleErasePersonalData}
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
              {activePage === 'codice-studio' && (
                <CodiceStudio
                  openLessonId={openLessonId}
                  onOpenLesson={setOpenLessonId}
                  onOpenSkill={(id) => openCatalogSkill(id, 'codice-studio')}
                  onOpenComponent={(id) => {
                    setSelectedComponentId(id);
                    setActivePage('preview');
                  }}
                  onRequestLogin={() => setShowAuthScreen(true)}
                />
              )}

              {activePage === 'boveda' && (
                <TeamSkillsPage
                  onOpenSkill={(id) => openCatalogSkill(id, 'boveda')}
                  onRequestLogin={() => setShowAuthScreen(true)}
                  onOpenProfile={(login) => openProfile(login, 'boveda')}
                />
              )}

              {activePage === 'perfil' && selectedProfileLogin && (
                <MemberProfilePage
                  login={selectedProfileLogin}
                  onBack={() => setActivePage(profileBackPage)}
                  onOpenSkill={(id) => openCatalogSkill(id, 'perfil')}
                  onRequestLogin={() => setShowAuthScreen(true)}
                />
              )}

              {activePage === 'catalogo' && (
                <CatalogPage
                  onOpenSkill={(id) => openCatalogSkill(id, 'catalogo')}
                  onRequestLogin={() => setShowAuthScreen(true)}
                />
              )}

              {activePage === 'skills-sh' && (
                <SkillsShPage
                  onInspectSkill={inspectSkillsShEntry}
                  onImportToCatalog={importSkillsShToCatalog}
                  onRequestLogin={() => setShowAuthScreen(true)}
                  busyAction={skillsShBusy}
                />
              )}

              {activePage === 'preview' && (
                <ComponentsPage
                  selectedId={selectedComponentId}
                  onSelect={setSelectedComponentId}
                  onOpenSkill={(id) => openCatalogSkill(id, 'preview')}
                  onRequestLogin={() => setShowAuthScreen(true)}
                  onOpenLesson={(id) => {
                    setOpenLessonId(id);
                    setActivePage('codice-studio');
                  }}
                />
              )}

              {activePage === 'paginas' && (
                <PagesPage
                  onOpenComponent={(id) => {
                    setSelectedComponentId(id);
                    setActivePage('preview');
                  }}
                  onOpenLesson={(id) => {
                    setOpenLessonId(id);
                    setActivePage('codice-studio');
                  }}
                />
              )}

              {activePage === 'skill-detalle' && (
                <CatalogDetailRoute
                  skillId={selectedCatalogSkillId}
                  previewSkill={previewSkill}
                  onBack={() => {
                    setPreviewSkill(null);
                    setActivePage(detailBackPage);
                  }}
                  backLabel={
                    previewSkill
                      ? 'Explorar'
                      : detailBackPage === 'boveda'
                        ? 'Skills del equipo'
                        : detailBackPage === 'perfil'
                          ? 'Perfil'
                          : detailBackPage === 'codice-studio'
                            ? 'Códice'
                            : detailBackPage === 'preview'
                              ? 'Componentes'
                              : detailBackPage === 'catalogo'
                                ? 'Catálogo'
                                : detailBackPage === 'skills-sh'
                                  ? 'Explorar'
                                  : 'Volver'
                  }
                  onImportPreview={handleImportPreview}
                  importingPreview={importingPreview}
                  onRequestLogin={() => setShowAuthScreen(true)}
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
                Códice Studio
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
                Inspector:{' '}
                <code className="font-mono text-slate-200">
                  commitSha fijado (512 KB máx)
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
