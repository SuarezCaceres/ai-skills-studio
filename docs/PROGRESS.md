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

## 2026-11-26 · Antigravity (`Orquestador General` / `skill-sh`) · `chore/cierre-skill-sh`
- **Hecho:**
  - Cierre operativo de la sesión `skill-sh` (PR #25 al PR #29) tras confirmarse en navegador real el inicio de sesión con GitHub (`OAuth App` `Ov23lii7kOK3ajmx8d1u`) tanto en `https://codice-oauth.vercel.app/` como en `http://localhost:5173/`.
  - Comprobación en vivo de producción (`https://codice-oauth.vercel.app/` y `/api/skills-sh` en `200`, autorización OAuth en `302`) y verificación de las 4 corridas programadas en verde de `.github/workflows/sync-skills-sh.yml` actualizando `main`.
  - Ajuste documental en `docs/catalog-setup.md` (aclarando *OAuth App* y múltiples *Redirect URIs*), cierre de la tarea operativa de `003` en `docs/TASKS.md`, y limpieza de ramas ya fusionadas y archivos temporales locales de la sesión.
- **Verificación:** `./scripts/check.sh` completo en **`exit 0`** en la rama de cierre `chore/cierre-skill-sh`.
- **Pendiente:** Sin pendientes abiertos de `003-directorio-skills-sh` ni de producción en Vercel; continuar en `docs/TASKS.md` con `001-equipos-y-miembros`.
- **Problemas:** Ninguno.

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
