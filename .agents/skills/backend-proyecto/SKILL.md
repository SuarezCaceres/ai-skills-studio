---
name: backend-proyecto
description: Úsala al crear o modificar la función serverless api/github-oauth.ts o la capa de servicios e integración con GitHub API en src/services/ (githubCatalogService.ts, githubAuthService.ts, skillUploadService.ts, lessonSharing.ts) y sus contratos en src/types/catalog.ts.
---

# Trabajo en backend e integraciones GitHub (`api/` y `src/services/`)

## Alcance en `ai-skills-studio`
Este proyecto no tiene un servidor monolítico ni base de datos tradicional; su capa de backend e integración externa comprende:
- `api/github-oauth.ts`: función serverless en Vercel que intercambia el `code` OAuth de GitHub por `access_token` (único punto con acceso a `GITHUB_CLIENT_SECRET`).
- `src/services/`: clientes y lógica de negocio contra GitHub REST API (`githubCatalogService.ts`, `githubAuthService.ts`, `skillUploadService.ts`, `lessonSharing.ts`).
- `src/types/catalog.ts` (junto con `src/types/lessons.ts` y `src/types/skill.ts`): contratos de datos e interfaces compartidas.
- `docs/catalog-setup.md`: configuración operativa de la OAuth App, variables en Vercel y repositorio catálogo.

## Antes de empezar, lee
1. `docs/rules/backend.md` y `docs/rules/security.md`: reglas obligatorias. **Mandan sobre todo lo demás.**
2. `docs/stack/backend.md` y `docs/catalog-setup.md`: arquitectura OAuth, protocolo de catálogo sobre GitHub Issues/Contents y límites de tasa.
3. La spec y el plan de la funcionalidad, si existen (`docs/specs/NNN-*/`).
4. Referencias adicionales si existen en `docs/references/backend/`.

## Al trabajar
- **Borde OAuth (`api/github-oauth.ts`):** valida siempre el origen contra `ALLOWED_ORIGINS` (CORS estricto), limita el tamaño del cuerpo (`MAX_BODY_BYTES`), valida `code`, `redirect_uri` y `code_verifier?`, responde con `Cache-Control: no-store` y devuelve mensajes de error genéricos sin registrar jamás secretos ni tokens. **Pregunta al humano antes de cambiar orígenes CORS o el contrato OAuth.**
- **Token exclusivamente en memoria:** en `githubAuthService.ts` y el resto del cliente, el `access_token` vive únicamente en memoria de ejecución; nunca lo persistas en `localStorage`, `sessionStorage`, `IndexedDB`, cookies ni parámetros de URL.
- **Autoría verificable:** determina la identidad del autor siempre mediante `issue.user.login` devuelto por la API de GitHub, **nunca** confiando en el campo `authorLogin` ni en metadatos dentro del comentario HTML `<!-- codice:v1 ... -->` (que cualquiera puede falsificar al abrir un issue).
- **Inmutabilidad por SHA:** fija las lecturas de skills y artefactos publicados a un `commitSha` hexadecimal completo de 40 caracteres, evitando ramas mutables al descargar contenido del catálogo.
- **Control de concurrencia y sobrescritura:** al crear o actualizar archivos en repositorios del usuario (`skillUploadService.ts`, `lessonSharing.ts`), comprueba el contenido previo (`expectBase64` / `sha` del blob en GitHub Contents API) para detectar conflictos de edición sin pisar cambios ajenos silenciosamente.
- **Contratos sincronizados:** si cambia el formato de un marcador o respuesta, actualiza `src/types/catalog.ts` (y `docs/catalog-setup.md` si afecta al protocolo) en el mismo cambio.
- **Pruebas aisladas de la red:** cubre cada servicio y caso de error con la skill `pruebas-proyecto` sobre Node usando los simuladores de `scripts/lib/github-fixture.mjs` y `scripts/lib/fake-github-classes.mjs`, **sin realizar jamás peticiones reales a `api.github.com`**.

## Para terminar
- `./scripts/check.sh --rapido` pasa completo (`tsc -b` para `src/`, `tsc --noEmit` estricto para `api/github-oauth.ts`, más pruebas unitarias y de servicios en Node).
- Si tocaste flujos integrados con la interfaz de catálogo o clases compartidas, ejecuta también `node scripts/test-catalog-integration.mjs` o `node scripts/test-lessons-share.mjs`.
