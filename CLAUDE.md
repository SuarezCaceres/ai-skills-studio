# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es

Códice Studio (`ai-skills-studio`): SPA en React 19 + TypeScript + Vite 6 + Tailwind v4 para auditar, editar y compartir *skills* de IA. No tiene backend propio: todo corre en el navegador, salvo una función serverless de Vercel (`api/github-oauth.ts`). La documentación del proyecto y los mensajes de UI están en español.

## Comandos

```bash
npm ci                 # instalar (Node 20+)
npm run dev            # Vite en http://localhost:5173
npm run build          # tsc -b && vite build (es la "puerta" antes de fusionar)
npm run preview        # sirve dist/
npm test               # encadena TODOS los scripts de scripts/test-*.mjs (lento)
node scripts/test-lessons.mjs   # ejecutar una sola prueba
node scripts/capture-components.mjs   # regenera las miniaturas del kit de componentes
```

- No hay linter ni runner de tests unitarios. Las "pruebas" son scripts Node con **Playwright** (`npx playwright install chromium` si falta el navegador). Cada script compila con la API de Vite, levanta `preview` en su propio puerto, usa un navegador real y sale con código ≠ 0 si algo falla.
- Las pruebas **nunca deben tocar `api.github.com` real** (cuota anónima de 60 peticiones/h por IP): usan `scripts/lib/github-fixture.mjs` (`installFakeGithub`) para simular la API, el OAuth y los avatares. Cualquier prueba nueva debe reutilizarlo.
- Las capturas de las pruebas van a `shots/` (ignorado por git).

## Arquitectura

**Sin router.** `src/App.tsx` es el orquestador: la navegación es el estado `AppPageRoute` (`src/types/workspace.ts`) y cada página se carga con `React.lazy` + `Suspense`. Hay un límite de ~350 kB para el bundle principal; mantén las páginas nuevas en `lazy` y `vendor-react`/`vendor-icons` como chunks manuales (`vite.config.ts`).

**Identidad = sesión de GitHub, solo en memoria.** `useCatalog` (montado en `App`) mantiene la sesión; el token OAuth/PKCE **no se persiste** (ni `localStorage`, ni cookies). `eraseAllPersonalData` (`utils/securityHardening.ts`) borra los datos locales. Ver sin sesión es libre; escribir (votar, registrar, asignar, subir) exige sesión.

**Catálogo sobre GitHub.** No hay base de datos: `services/githubCatalogService.ts` lee/escribe **Issues y reacciones** de un repo catálogo (`VITE_CATALOG_REPO`). Cada Issue lleva un marcador `<!-- codice:v1 {...} -->`; el workflow `codice-labeler` del repo catálogo aplica las etiquetas. Tipos en `types/catalog.ts`. El flujo OAuth intercambia el código vía `api/github-oauth.ts` (único lugar con el *client secret*). Puesta en marcha manual completa: `docs/catalog-setup.md`.

**Equipo.** `src/config/team.ts` (`TEAM_LOGINS`) define quién cuenta como "equipo"; "Skills del equipo" muestra las skills cuyo Issue ancla abrió alguien de esa lista. `utils/workingCopy.ts` guarda las copias de trabajo locales de esas skills (`localStorage`).

**Persistencia local.** Las claves de `localStorage` llevan versión (`ai_skills_studio_*_v1`) y se validan con *type guards* al leer (`services/lessonsStore.ts`, `services/componentAssignments.ts`). Si cambias un modelo de datos, sube la versión de la clave.

**Env vars (públicas, prefijo `VITE_`):** `VITE_CATALOG_REPO`, `VITE_GITHUB_CLIENT_ID`, `VITE_GITHUB_OAUTH_URL`. Sin ellas la app funciona en modo solo lectura. `vite.config.ts` inyecta el origen de `VITE_GITHUB_OAUTH_URL` en el `connect-src` de la CSP de `index.html` (placeholder `__CSP_CONNECT_SRC__`); si añades otro origen al que la app haga `fetch`, hay que permitirlo ahí o la CSP lo bloqueará.

**Dos mundos de assets.**
- `src/` es la app React (componentes, `services/`, `utils/`, `data/`).
- `public/assets/{components,effects,backgrounds,diagrams}` es un kit estático en HTML/CSS/JS plano que `index.html` referencia por URL. Los plugins `preserve-public-kit-assets-*` de `vite.config.ts` evitan que Vite reescriba esas rutas; no las muevas ni las importes desde TS.

**Kit de componentes (`src/components/ui-kit/`).** Para añadir uno: crear `ui-kit/<Nombre>.tsx` con un `export function Demo()`, registrarlo en `src/data/componentRegistry.ts` y correr `node scripts/capture-components.mjs` para generar su miniatura. Es código propio; no copiar código ni imágenes de librerías de terceros.

**Seguridad ya implementada (no la debilites):** validación anti-traversal y límite de 25 MB al leer `.rar` (`rarParserService.ts`, 100 % en cliente), auditor de skills (scripts, `curl | sh`, rutas sensibles), CSP estricta y cabeceras en `vite.config.ts`. `REPORTE_SEGURIDAD_Y_CALIDAD.md` detalla los hallazgos.

## Convenciones del repo

- **Antes de commitear o abrir un PR, leer `memories.md` y la skill `.agents/skills/github-workflow-standards/SKILL.md`** (obligatorio según ambos). Resumen:
  - Commits en Conventional Commits, imperativo, minúsculas, sin punto final: `feat(ambito): add ...`. Tipos: `feat`, `refactor`, `fix`, `ui`, `style`, `docs`, `merge`, `ci`, `chore`.
  - Los PR usan la plantilla de 5 secciones de `.github/pull_request_template.md` (¿Qué es?, ¿Por qué?, ¿Para qué?, ¿Cómo está construido?, Pruebas).
  - `npm run build` debe pasar antes de fusionar. Actualiza `memories.md` (`docs: update memories.md ...`) en cada hito importante.
- Ramas: `main` es producción (se despliega sola: GitHub Pages vía `.github/workflows/deploy.yml` y GitLab Pages vía `.gitlab-ci.yml`); `testing` es la rama de integración; el trabajo va en `feat/<modulo>` (o `feat/wt<N>-<modulo>` en worktrees, con archivos disjuntos entre worktrees). `docs/agents/WT*.md` son los briefs de agentes en paralelo.
- Estilo visual: fondo carbón (`#0a0d14` / `#121722`) y un solo acento cian `#0ea5e9`; sin naranja ni iconos emoji en controles. En Tailwind usa `[display:grid]` en lugar de la clase `grid` (ver `docs/agents/WT4_*`). Sistema de diseño en `design-system/ai-skills-studio/MASTER.md`.
- `tsconfig.json` solo incluye `src/` con `strict`; `scripts/*.mjs` y `api/` no pasan por `tsc -b`.
- `.obsidian/` y `Códice Neuronal - MOC.md` son la bóveda de Obsidian del proyecto (notas, no código).
