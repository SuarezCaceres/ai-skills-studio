# Referencias de Backend y Servicios GitHub

> **Cuándo consultar este índice:** al tocar el flujo OAuth (`api/github-oauth.ts`), el protocolo de Issues y etiquetas del catálogo, las operaciones con la Git Data API en `src/services/` o la próxima implementación de equipos de trabajo.

## Materiales reales en el repositorio

1. **Guía de infraestructura del catálogo — [`docs/catalog-setup.md`](../../catalog-setup.md)**
   - Documentación completa de puesta en marcha del backend sin servidor propio: configuración del repositorio catálogo público (`VITE_CATALOG_REPO`), tabla de tipos de Issue (`skill`, `result`, `class`) y formato del marcador `<!-- codice:v1 {...} -->`.
   - Incluye el código íntegro del workflow `.github/workflows/codice-labeler.yml`, la configuración de la GitHub OAuth App, las variables de entorno en Vercel y GitHub Pages, la política CSP (`connect-src`) y el comportamiento ante límites de cuota (`60` req/h anónimo vs `5000` req/h autenticado).

2. **Función Serverless de canje OAuth — [`api/github-oauth.ts`](../../../api/github-oauth.ts)**
   - Referencia canónica de frontera segura en Vercel Functions: validación estricta de `Origin` frente a `ALLOWED_ORIGINS`, rechazo por tamaño (`MAX_BODY_BYTES = 2048`), validación por regex de `code`, `redirect_uri` y `code_verifier` (PKCE), cabeceras `Cache-Control: no-store` y ocultación de errores internos de GitHub.

3. **Servicios cliente sobre GitHub API — [`src/services/`](../../../src/services/)**
   - [`src/services/githubCatalogService.ts`](../../../src/services/githubCatalogService.ts): lectura paginada/filtrada por etiquetas, caché en memoria y `localStorage` con TTL y degradación elegante cuando expira el *rate limit*.
   - [`src/services/skillUploadService.ts`](../../../src/services/skillUploadService.ts) y [`src/services/lessonSharing.ts`](../../../src/services/lessonSharing.ts): creación de commits multi-archivo mediante la Git Data API (`blobs` → `trees` → `commits` → `refs`) en `<login>/codice-skills` fijados a un SHA de 40 caracteres.

4. **Diseño de Equipos de Trabajo (Fases 5 y 6) — [`docs/plans/PLAN_EQUIPOS.md`](../../plans/PLAN_EQUIPOS.md)**
   - Arquitectura acordada para las siguientes iteraciones pendientes (`docs/specs/001-equipos-y-miembros/` y `docs/specs/002-skills-de-equipo/`): esquema de `equipo.json`, códigos de invitación de un solo uso con hash + sal (caducidad de 7 días), correspondencia con permisos reales de colaboradores en GitHub e Issues `kind: 'team'`.
