# Progreso

> Bitácora entre sesiones. Cada sesión **añade** una entrada al principio (la más reciente arriba).
> Su objetivo es que la siguiente sesión, que no recuerda nada, sepa dónde retomar.

<!-- Formato:
## AAAA-MM-DD · agente (Claude Code / Antigravity) · rama
- **Hecho:** qué se completó (con referencia a commits o PR)
- **Verificación:** resultado de ./scripts/check.sh
- **Pendiente:** qué queda y el siguiente paso concreto
- **Problemas:** errores, dudas o decisiones que necesitan al humano
-->

## 2026-11-26 · Claude Code (`Orquestador General`) · `feat/005-guia-vs-sin-guia`
- **Hecho:**
  - Spec y plan de la 005 ampliados con el rediseño en espejo **C8–C12** (aprobados por el humano) y rebase de la 005 sobre la 004 final (conflictos solo documentales).
  - **Fase 0 (`56c1dca`):** `GuideCaptureFrame` extraído; esqueletos de `GuideMediaSlot` y `GuideModePanel` con contrato de DOM; reloj con tiempo restante (al reanudar se espera solo lo que falta); maquetación en espejo con CSS propio en el chunk diferido; excepción del halo en `docs/rules/frontend.md`.
  - **Fase C (3 worktrees en paralelo):** escenario con círculo, anillo y píldora (`wt1`, `73a5a75`), texto del modo y tarjeta de barras (`wt2`, `41fa86d`) y suite C8–C12 (`wt3`, `2cdcf64`).
  - **Captura con tipografía real:** `capture-guide-showcase.mjs` carga ahora Geist y Geist Mono desde Google Fonts (falla si no llegan; `--fuentes-de-reserva` para trabajar sin conexión). `catalogo.webp` regenerado (58,9 KB) y C6b actualizado (se cumple tras la 004).
  - **Integración (`5ec931a`):** `#guia` crece más allá de una pantalla en escritorio (el kit la fijaba a 708 px de contenido y se montaba sobre `#inspector`); círculo con superficie plana (sin degradado decorativo).
- **Verificación:** `./scripts/check.sh` completo en `exit 0` con las variables del simulador (`test-guide-showcase.mjs` 356/356). Chunk inicial 349,7 kB (C6b en verde).
- **Pendiente:** fusionar el PR #32 de la 004; rebasar la 005 sobre `main` y abrir su PR de 5 secciones con squash.
- **Problemas:** `git worktree remove` borró parte del `node_modules` compartido a través de la junction (reparado con `npm install`, lockfile intacto). `test-interactions-playwright.mjs` depende de `.env.local` (anotado en `TASKS.md`).

## 2026-11-27 · Claude Code · `feat/004-retiro-workspace-inspector-codigo` (seguimiento tras PR #31)
- **Hecho:**
  - La 004 ya se fusionó en `main` con el PR #31 (merge `309be17`, sin *squash*, así que `0505bc5` con tipo `test` quedó en `main`). Estos cambios van en un PR de seguimiento.
  - `fix(landing)`: con la Geist Mono real, la fila de métricas de la ficha del portátil (`ComputerLightBeamShowcase.tsx`) llevaba la portada a `scrollWidth` 403 a 390 px; ahora envuelve y se limita al ancho (390 a 390 px, sin desbordes a 768/1024/1440). `test-interfaces-playwright.mjs` añade una comprobación con texto más ancho (las suites sirven Google Fonts vacías) que fallaba antes del arreglo.
  - `.playwright-mcp/` ignorada en `.gitignore`.
- **Verificación:** `./scripts/check.sh` completo en `exit 0`. Un intento falló porque otro proceso ocupaba el puerto `5190` de `test-lessons.mjs`, y otro por la prueba intermitente `Datepicker: Enter elige el día y cierra`, que pasa 3/3 aislada y queda registrada en `docs/TASKS.md`.
- **Pendiente:** revisión humana y fusión del PR de seguimiento.
- **Problemas:** ejecutar `check.sh` a la vez en varios worktrees provoca choques de puertos fijos (`5185`–`5190`).

## 2026-11-27 · Antigravity (`Orquestador General`) · `feat/004-retiro-workspace-inspector-codigo`
- **Hecho:**
  - Ejecución de **Fases 0–3** de `004-retiro-workspace-inspector-codigo` (`docs/specs/004-retiro-workspace-inspector-codigo/{spec.md,plan.md}`):
    - **Fase 0:** creación de `src/utils/skillAuditHelpers.ts` (frontmatter YAML, rutas seguras, límites binarios/512 KB y auditoría estructural) y contratos aditivos en `src/types/{skillsSh,catalog}.ts`.
    - **Fase 1 (3 worktrees paralelos Zero-Conflict):** desacoplamiento de `AuditBadge.tsx`, descarga bajo demanda fijada a `commitSha` en `FilesPanel.tsx` con re-auditoría automática y vista previa `skills.sh` en `SkillDetailPage`/`CatalogDetailRoute`; reemplazo de «Abrir en Workspace» por «Inspeccionar» en `SkillsShCard`/`SkillsShPage`; reorientación de portada (`InformativeLandingSection`, `ComputerLightBeamShowcase`) y `NavbarActiveSkill.tsx` (retirando `estudio`/`modelos-ia`/`evidencias`, añadiendo manejo React del menú móvil y apuntando `.nav__actions a.btn--primary` a `'boveda'`), desconexión de `workingCopy` en Códice y limpieza de `aiModelsData.ts` preservando `AI_BENCHMARK_MODELS`.
    - **Fase 2:** integración en `src/App.tsx` (cableando `inspectSkillsShEntry` y manteniendo limpieza de `ai_skills_studio_workcopies_v1` al cerrar sesión/GDPR), estrechamiento de `src/types/{workspace,skill,skillsSh}.ts` (conservando `SkillDocument`), retiro de `@deprecated translateSkillMarkdown` y eliminación física de los 13 archivos obsoletos (`UnifiedProjectStudio`, `StylePresetCatalog`, `stylePresets`, `ContextEvidenceLogger`, `AIModelBenchmarkPanel`, `VoiceVisualFeedback`, `MarkdownViewerTranslator`, `speechService`, `frameworkCollectionsData`, `studio/ActiveSkillBar`, `studio/NoSkillState`, `workingCopy`, `rarParserService`).
    - **Fase 3:** adaptación de las suites de prueba (`test-catalog-install-translate.mjs`, `test-catalog-integration.mjs`, `test-skills-sh-page.mjs`, `test-interfaces-playwright.mjs`, `test-interactions-playwright.mjs`, `verify-laptop-showcase.mjs`) y actualización de `docs/project/{ARCHITECTURE,PROJECT}.md`, `docs/plans/PLAN_EQUIPOS.md`, `docs/features.json`, `docs/TASKS.md` y `docs/PROGRESS.md`.
    - **Fase 4 (cierre):** verificación independiente unánime (`revisor`: `APPROVE` con 0 bloqueantes, `teamwork_challenger`: `CONFIRMED`, `teamwork_auditor`: `CLEAN`), criterios `C1`–`C5` en verde, cierre de `docs/features.json` (`estado: "hecho"`, `C5: true`) y redacción local de la descripción del PR de 5 secciones (sin `git push` ni apertura en GitHub).
    - **Observaciones menores recomendadas para seguimiento posterior (no bloqueantes):** textos heredados no visibles en UI principal dentro de `src/data/aiModelsData.ts` (`strengths`/`recommendedFor`) y `src/components/AuthScreen.tsx`, brecha preexistente en la heurística de `eval` sin `base64`/`atob` en `src/components/catalog/AuditBadge.tsx:58`, casos límite menores en `src/utils/skillAuditHelpers.ts`, margen estrecho del chunk inicial (`349.48 kB` < `350 kB`) y menciones heredadas en `docs/rules/security.md` (zona protegida fuera de alcance en `004`).
- **Verificación:**
  - `npm run build`: chunk inicial `349.48 kB` (`< 350 kB`), compilación limpia con `tsc -b`.
  - `./scripts/check.sh` completo en **`exit 0`** (tipos `tsc -b` + `api/{github-oauth,skills-sh}.ts`, 5 suites unitarias, 3 suites de integración y 8 suites Playwright E2E; único aviso esperado: `Lint: sin configurar`).
  - Suites específicas en verde: `node scripts/test-skills-sh-proxy.mjs` (`29` ok), `node scripts/test-skills-sh-service.mjs` (`17` ok), `node scripts/test-skills-sh-page.mjs` (`34` ok) y `node scripts/verify-laptop-showcase.mjs` (`exit 0`), todas con GitHub simulado y cero llamadas reales externas.
- **Pendiente:** Dar seguimiento a los ítems previos de auditoría de seguridad y deuda técnica registrados en `docs/TASKS.md`.
- **Problemas:** Ninguno.

## 2026-11-26 · Antigravity (`Orquestador General` / `skill-sh`) · `chore/cierre-skill-sh`
- **Hecho:**
  - Cierre operativo de la sesión `skill-sh` (PR #25 al PR #29) tras confirmarse en navegador real el inicio de sesión con GitHub (`OAuth App` `Ov23lii7kOK3ajmx8d1u`) tanto en `https://codice-oauth.vercel.app/` como en `http://localhost:5173/`.
  - Comprobación en vivo de producción (`https://codice-oauth.vercel.app/` y `/api/skills-sh` en `200`, autorización OAuth en `302`) y verificación de las 4 corridas programadas en verde de `.github/workflows/sync-skills-sh.yml` actualizando `main`.
  - Ajuste documental en `docs/catalog-setup.md` (aclarando *OAuth App* y múltiples *Redirect URIs*), cierre de la tarea operativa de `003` en `docs/TASKS.md`, y limpieza de ramas ya fusionadas y archivos temporales locales de la sesión.
- **Verificación:** `./scripts/check.sh` completo en **`exit 0`** en la rama de cierre `chore/cierre-skill-sh`.
- **Pendiente:** Sin pendientes abiertos de `003-directorio-skills-sh` ni de producción en Vercel; continuar en `docs/TASKS.md` con `001-equipos-y-miembros`.
- **Problemas:** Ninguno.

## 2026-11-25 · Claude Code (`Orquestador General`) · `feat/005-guia-vs-sin-guia`
- **Hecho:**
  - Entrevista (`grilling`) para adaptar el componente externo `spatial-product-showcase` (framer-motion + shadcn) al stack real: sección ilustrativa «Guía vs. sin guía» en la portada con la misma captura del Catálogo atenuada o guiada en 3 pasos, sin dependencias nuevas.
  - `docs/specs/005-guia-vs-sin-guia/{spec,plan}.md` aprobados y Fase 0 de contratos (`src/types/guideShowcase.ts`, hotspots y WebP provisionales).
  - Fase 1 en 3 worktrees paralelos con agentes hijos: componente `GuideContrastShowcase.tsx` + textos + montaje (`wt1`), script reproducible `capture-guide-showcase.mjs` con GitHub simulado y WebP de 58 KB (`wt2`) y suite `test-guide-showcase.mjs` en 4 anchos conectada a `check.sh` (`wt3`).
  - Fase 2: integración, caja de los chips de categoría ajustada a los botones (92 % → 39 %), espera a las transiciones CSS en la prueba de geometría y comillas angulares en el tooltip.
- **Verificación:** `test-guide-showcase.mjs` 210/210; tipos, unitarias e integración en verde. Resto de E2E en verde salvo 3 suites heredadas de la 004 (`test-interactions-playwright`, `test-catalog-integration` y `test-skills-sh-page`), que buscan UI retirada o ya fallaban en la base `9f7580d`. Criterios C1–C5 y C7 en `pasa: true`; C6 en `false` por el chunk inicial (~393 kB, deuda preexistente).
  - Fase 4: `revisor` independiente → **APROBADO CON CAMBIOS** (0 bloqueantes). Aplicados los 5 importantes: sección cargada con `React.lazy` (chunk inicial 382,7 kB frente a 382,3 kB en la base `9f7580d`, medida real), avance detenido fuera de pantalla (`IntersectionObserver`), botón «Pausar guía» (WCAG 2.2.2), pausa por hover solo con ratón, tooltip sin «vuelo» inicial y pruebas nuevas (atenuación, tamaño del foco, `visibilitychange`, fuera de pantalla, botón de pausa, imagen que falla y no regresión del chunk).
  - C6 dividido por decisión del humano: C6a (dependencias, red, WebP, chunk diferido sin regresión y paleta) en `pasa: true`; C6b (chunk inicial < 350 kB) abierto y ligado a la deuda del bundle.
- **Pendiente:** abrir el PR cuando la 004 esté integrada (squash del commit `test(e2e)`).
- **Problemas:** Chunk inicial en 382,7 kB: deuda preexistente (la base ya pesaba 382,3 kB); la sección va en su propio chunk de 11 kB. El commit `180a2a9` usa el tipo `test`, que no está en `docs/rules/general.md`: hacer *squash* al integrar. La captura usa fuentes de reserva porque las de Google se bloquean en el script para no depender de la red.

## 2026-11-24 · Antigravity (`Orquestador General`) · `chore/vercel-primary-deploy`
- **Hecho:**
  - Adopción de Vercel (`https://codice-oauth.vercel.app`) como despliegue principal de frontend + funciones serverless (`api/github-oauth.ts`, `api/skills-sh.ts`), retirando `.github/workflows/deploy.yml` (con aprobación explícita del dueño).
  - Creación de `vercel.json` (`framework: "vite"`, `outputDirectory: "dist"`, cabeceras de seguridad HTTP en rutas no-API) y actualización de `AGENTS.md`, `docs/project/PROJECT.md` y `docs/catalog-setup.md`.
  - Configuración en Vercel (`codice-oauth`) de `VITE_CATALOG_REPO`, `VITE_GITHUB_CLIENT_ID`, `VITE_GITHUB_OAUTH_URL` y `ALLOWED_ORIGINS` (`https://codice-oauth.vercel.app`, alias de equipo y `http://localhost:5173`), más conexión Git.
  - Corrección `same-origin` en `api/skills-sh.ts` (`fix/skills-sh-same-origin-cors`) para aceptar `GET` del mismo origen sin cabecera `Origin` cuando `Sec-Fetch-Site: same-origin` (o `Referer` equivalente) coincide con `ALLOWED_ORIGINS`.
- **Verificación:** `./scripts/check.sh` completo en **`exit 0`** y comprobación en vivo sobre `https://codice-oauth.vercel.app/` (botón **Entrar con GitHub** habilitado, CSP con `connect-src`, cabeceras de seguridad y **Explorar** en vivo).
- **Pendiente:** Confirmar que `https://codice-oauth.vercel.app/` figura en las Callback URLs de la GitHub App `Ov23lii7kOK3ajmx8d1u` y probar el flujo completo de inicio de sesión en el navegador.
- **Problemas:** Ninguno.

## 2026-11-24 · Antigravity (`Orquestador General`) · `fix/dev-proxy-y-pages-deploy`
- **Hecho:**
  - Middleware solo de desarrollo (`apply: 'serve'`) en `vite.config.ts` que expone `/api/skills-sh` delegando en `api/skills-sh.ts` con validación estricta de origen local (`localhost` / `127.0.0.1`).
  - Respaldo automático de desarrollo (`devProxyFallbackUrl = '/api/skills-sh'` solo cuando `import.meta.env.DEV` está activo) en `src/services/skillsShService.ts` + prueba unitaria en `scripts/test-skills-sh-service.mjs`.
  - Separación de jobs `build` → `deploy` con espera previa de 5 s en `.github/workflows/deploy.yml` para eliminar la condición de carrera (`Found 0 artifact(s)`) en `actions/deploy-pages@v4`, más `.vercel/` añadido a `.gitignore`.
- **Verificación:** `./scripts/check.sh` completo en **`exit 0`** (incluyendo 17/17 en `test-skills-sh-service.mjs`), `curl` local en `http://localhost:5173/api/skills-sh` (`200` en vivo y `403` para origen ajeno) y comprobación real en Chromium sobre `http://localhost:5173/` mostrando estado **En vivo** con `0` errores.
- **Pendiente:** Confirmar despliegue en verde de `Deploy to GitHub Pages` tras el merge y completar el login/despliegue en Vercel CLI (`npx vercel --prod`) para activar `/api/skills-sh` también en producción.
- **Problemas:** Ninguno.

## 2026-11-24 · Antigravity (`Orquestador General`) · `feat/003-directorio-skills-sh`
- **Hecho:**
  - Integración previa de `.agents/skills/security-audit/` en `main` mediante PR #25 (`chore/security-audit`), creando luego la rama limpia `feat/003-directorio-skills-sh` desde `main`.
  - Análisis en vivo de `https://www.skills.sh`, redacción y aprobación de `docs/specs/003-directorio-skills-sh/{spec.md,plan.md}`, congelación de contratos en `src/types/skillsSh.ts`, `src/types/workspace.ts`, `src/types/catalog.ts` y cableado lazy en `src/App.tsx`.
  - Implementación en paralelo (3 especialistas Zero-Conflict):
    1. Proxy serverless `api/skills-sh.ts` (CORS `ALLOWED_ORIGINS`, anti-SSRF, timeout 8 s, límite 1 MB, caché Edge 5 min), generador `scripts/sync-skills-sh-snapshot.mjs`, snapshot inicial `public/data/skills-sh-snapshot.json` (42.1 KB) y workflow cron `.github/workflows/sync-skills-sh.yml` (autorizado por el dueño).
    2. Servicio cliente híbrido `src/services/skillsShService.ts` (`live → cache → snapshot` con búsqueda local) y puente GitHub `inspectGithubSkillByHint` / `getGithubFileAtSha` en `src/services/githubCatalogService.ts` fijado a `commitSha`.
    3. Nueva sección **Explorar** (`src/components/skills-sh/{SkillsShPage,SkillsShCard}.tsx`) y acceso en `src/components/NavbarActiveSkill.tsx` (barra superior y mega-menú).
  - Suites automatizadas con aislamiento total de red (`test-skills-sh-proxy.mjs`: 27 OK, `test-skills-sh-service.mjs`: 16 OK, `test-skills-sh-page.mjs`: 25 OK en 4 anchos) conectadas a `scripts/check.sh`.
  - Actualización de `docs/project/ARCHITECTURE.md` y cierre de `003-directorio-skills-sh` en `docs/features.json` (`estado: "hecho"`) tras formato completo del PR #26 e integración en `main`.
- **Verificación:** `./scripts/check.sh` completo en **`exit 0`** (tipos + 16 suites Node y Playwright en verde) y auditoría independiente (`revisor`) con veredicto **APROBADO** sin bloqueantes; aplicadas mejoras menores sugeridas.
- **Pendiente:** Comprobar en Vercel que `/api/skills-sh` comparte `ALLOWED_ORIGINS` con `/api/github-oauth`, resolver hallazgos pendientes de `security-audit` en `docs/TASKS.md` y continuar con `001-equipos-y-miembros`.
- **Problemas:** Ninguno (deuda preexistente del chunk `vendor-react` registrada en `docs/TASKS.md`).

## 2026-11-23 · Antigravity (`Orquestador General`) · `fix/github-pages-artifact-v4`
- **Hecho:** Actualización de `actions/upload-pages-artifact@v3` a `@v4` en `.github/workflows/deploy.yml` (con aprobación humana) para restaurar el despliegue automático a GitHub Pages tras el retiro de `upload-artifact@v3`.
- **Verificación:** `./scripts/check.sh --rapido` en `pre-commit` y workflow `Deploy to GitHub Pages` en `main`.
- **Pendiente:** Iniciar `001-equipos-y-miembros` con `spec-plan-code` y actualizar manualmente `codice-labeler.yml` en el repo catálogo.
- **Problemas:** Ninguno.

## 2026-11-23 · Antigravity (`Orquestador General`) · `chore/adoptar-harness`
- **Hecho:**
  - Instalación de `SuarezCaceres/harness-template` sobre la rama `chore/adoptar-harness` (partiendo de `feat/codice-clases-compartidas`, `27018b4`) sin conflictos con el código existente.
  - Entrevista de alineación con el usuario y despacho en paralelo de 4 subagentes especialistas con propiedad disjunta de archivos:
    1. Producto, arquitectura real (`src/`, `public/assets/`, `api/github-oauth.ts`), stack y referencias (`docs/project/*`, `docs/stack/*`, `docs/references/*`).
    2. Reglas obligatorias de Git/PR de 5 secciones, identidad visual `tasteskill 2.5.1`, fronteras de API GitHub, aislamiento de red en pruebas y seguridad (`docs/rules/*`).
    3. Sensores en dos velocidades (`scripts/check.sh --rapido` vs completo), `init.sh` con Junction NTFS en Windows para `.claude/skills`, `.gitattributes` (`LF`), `.env.example` y limpieza de `.gitignore`.
    4. Creación de `.agents/skills/orquestador-general/SKILL.md`, adaptación de las skills del harness a rutas reales y punteros `src/AGENTS.md` y `api/AGENTS.md`.
  - Redacción de `AGENTS.md` (`< 120` líneas), conversión de `memories.md` en puntero canónico, carga de funcionalidades hechas (`H01`–`H04`) y pendientes (`001-equipos-y-miembros`, `002-skills-de-equipo`) en `docs/features.json`, `docs/TASKS.md` y `docs/decisions/0002-adopcion-del-harness.md`.
- **Verificación:** Auditoría independiente (`revisor`) superada y corregidos todos sus hallazgos (`.claude/worktrees/` en `.gitignore`, bloqueo de `.env.local` y `HEAD:main` en `guard.sh`, permisos `.env.example` en `.claude/settings.json` y chequeo de tipos de `api/github-oauth.ts` en `check.sh`). `./init.sh` idempotente en verde y `./scripts/check.sh --rapido` en **`exit 0`** (`tsc -b` + `api/github-oauth.ts` + 6 suites Node / 192 aserciones en verde; único aviso esperado: `Lint: sin configurar`).
- **Pendiente:**
  - Siguiente paso de desarrollo: iniciar `001-equipos-y-miembros` usando las skills `orquestador-general` + `spec-plan-code` a partir de `docs/plans/PLAN_EQUIPOS.md`.
  - Pasos manuales externos del dueño: actualizar `codice-labeler.yml` en el repo catálogo para `kind: class` y comprobar permisos de `public_repo` para invitaciones de equipos.
- **Problemas:** Sin `LINT_CMD` activo por decisión explícita de no añadir paquetes nuevos en esta rama (registrado en `docs/TASKS.md`).
