# Stack del backend

> **Arquitectura sin servidor monolítico:** Códice Studio **no tiene carpeta `apps/api/`, servidor Node persistente ni base de datos tradicional propia**. El rol de backend se reparte entre una única función *serverless* en Vercel para el intercambio OAuth y el uso directo de la API pública de GitHub como índice y almacén inmutable fijado a commits SHA.

Las reglas obligatorias asociadas viven en `docs/rules/backend.md` y `docs/rules/security.md`.

## Las dos piezas que actúan como backend

1. **Función Serverless OAuth (`api/github-oauth.ts`):**
   - Ejecutada en **Vercel Functions** con la API estándar Web Fetch (`OPTIONS` y `POST` sobre `Request` / `Response`).
   - Es el **único lugar donde existe `GITHUB_CLIENT_SECRET`**.
   - Aplica lista blanca estricta de orígenes (`ALLOWED_ORIGINS`) en CORS, acota el cuerpo a `MAX_BODY_BYTES = 2048`, valida con expresiones regulares `code`, `redirect_uri` (comprobando que su origen pertenezca a `ALLOWED_ORIGINS`) y `code_verifier` (PKCE), e intercambia el código contra `https://github.com/login/oauth/access_token`.
   - Responde exclusivamente `{ access_token, token_type, scope }` con `Cache-Control: no-store` y mensajes de error genéricos sin filtrar respuestas internas de GitHub.
   - **Variables exclusivas de Vercel (nunca en el repositorio):** `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `ALLOWED_ORIGINS`.

2. **Backend sin servidor sobre GitHub API (`src/services/githubCatalogService.ts` + repo catálogo):**
   - **Índice comunitario:** GitHub Issues y reacciones (`+1`) en el repositorio público definido por `VITE_CATALOG_REPO`. El workflow `.github/workflows/codice-labeler.yml` del repo catálogo valida el marcador `<!-- codice:v1 {...} -->` al abrirse cada Issue y aplica las etiquetas `skill`, `result`, `class`, `model:*` y `verdict:*`.
   - **Almacén de artefactos:** Git Data API (`blobs`, `trees`, `commits`, `refs`) sobre el repositorio público personal `<login>/codice-skills` para publicar o actualizar *skills* locales y clases compartidas (`classes/<id>/`), referenciadas siempre mediante un `commitSha` inmutable de 40 caracteres.

## Resumen técnico
| Aspecto | Elección | Versión / Detalle |
|---------|----------|-------------------|
| Lenguaje | TypeScript | `~5.7.2` |
| Runtime / Plataforma | Vercel Serverless Functions (estándar Web Fetch) + GitHub REST / Git Data API | Vercel (`Other`, sin *build*) / GitHub API `2022-11-28` |
| Base de datos / Índice | GitHub Issues + reacciones en `VITE_CATALOG_REPO` | Etiquetado validado por `codice-labeler.yml` |
| Almacenamiento de archivos | Repositorios públicos Git (`<login>/codice-skills`) leídos por commit SHA | Inmutable por SHA-1 (40 hex) |
| Validación | Validación manual estricta de tipos, longitud, regex y orígenes en frontera | Sin dependencias externas en `api/` |
| Autenticación | GitHub OAuth 2.0 + PKCE + `state` anti-CSRF (alcance `public_repo`, token solo en memoria) | `api/github-oauth.ts` + `githubAuthService.ts` |
| Pruebas de servicios | Scripts ESM en Node con `node:assert/strict` y máquina de estado GitHub en memoria | Node `20+` (`22+` recomendado; `scripts/lib/fake-github-classes.mjs`) |
| Gestor de paquetes | `npm` | Node `20+` |

## Comandos
| Acción | Comando |
|--------|---------|
| Desarrollo local (SPA; OAuth apunta a `VITE_GITHUB_OAUTH_URL` o modo lectura) | `npm run dev` |
| Build y verificación de tipos | `npm run build` (`tsc -b && vite build`) |
| Lint | *Pendiente de configurar* (registrado en `docs/TASKS.md`) |
| Tipos (`src/` + `api/github-oauth.ts`) | `./scripts/check.sh --rapido` (ejecuta `tsc -b` y `tsc --noEmit` estricto sobre `api/github-oauth.ts`) |
| Pruebas de subida de skills y Git Data API (en memoria) | `node scripts/test-skill-upload.mjs` |
| Pruebas del servicio de clases compartidas (en memoria) | `node scripts/test-lesson-sharing-service.mjs` |
| Pruebas de integración de catálogo, instalación y traducción | `node scripts/test-catalog-integration.mjs` y `node scripts/test-catalog-install-translate.mjs` |
| Suite rápida completa de servicios (sin E2E) | `./scripts/check.sh --rapido` |
| Migraciones de base de datos | *No aplica* (sin base de datos propia; el workflow `codice-labeler.yml` se actualiza según `docs/catalog-setup.md`) |

## Estructura de carpetas en `api/` y `src/services/`
```text
api/
  github-oauth.ts               Función serverless de Vercel para canje de código OAuth + PKCE

src/services/
  githubAuthService.ts          Inicio de sesión OAuth PKCE, validación de state y custodia del token en memoria
  githubCatalogService.ts       Lectura/escritura de Issues, reacciones, caché con TTL y manejo de rate limits de GitHub
  skillUploadService.ts         Lectura de archivos locales y commits vía Git Data API en <login>/codice-skills
  lessonSharing.ts              Publicación, actualización y retirada de clases compartidas sobre GitHub
  installCommandService.ts      Construcción segura del comando de instalación fijado a commitSha
  translationService.ts         Traducción al español (API Translator nativa o Gemini API con clave propia)
  lessonsStore.ts               Persistencia y validación local de clases en localStorage
  componentAssignments.ts       Persistencia local de asignaciones de skills/modelos a componentes UI
  rarParserService.ts           Inspección segura de cabeceras .rar (límite 25 MB y sanitización de rutas)
  speechService.ts              Integración con Web Speech API para dictado por voz
  teamStats.ts                  Métricas agregadas de contribuciones por autor/equipo
  youtube.ts                    Extracción de IDs y URLs de embed sin cookies (youtube-nocookie.com)
```

## Skills disponibles para servicios y flujo backend
> **Prioridad:** las reglas de `docs/rules/backend.md` y `docs/rules/security.md` mandan siempre sobre cualquier skill.

| Skill | Para qué | Fuente |
|-------|----------|--------|
| `backend-proyecto` | Trabajo en `api/github-oauth.ts`, servicios de GitHub, contratos de Issues y seguridad OAuth | `.agents/skills/backend-proyecto/` |
| `github-workflow-standards` | Estándar obligatorio de commits semánticos y Pull Requests de 5 secciones | `.agents/skills/github-workflow-standards/` |
