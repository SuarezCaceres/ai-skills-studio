# Arquitectura · Códice Studio

## Vista general
Códice Studio es una aplicación web *client-side* sin servidor de aplicación tradicional ni base de datos propia. Toda la lectura y escritura comunitaria ocurre directamente entre el navegador y la API de GitHub; las únicas piezas desplegadas fuera del sitio estático son dos funciones *serverless* mínimas en Vercel: `api/github-oauth.ts` (custodia `GITHUB_CLIENT_SECRET` para OAuth con PKCE) y `api/skills-sh.ts` (proxy de solo lectura con caché Edge para consultar el directorio abierto `https://www.skills.sh` respetando CORS y CSP).

```text
+-----------------------------------------------------------------------------------+
| NAVEGADOR DEL USUARIO                                                             |
|                                                                                   |
|  +--------------------------------------+   +----------------------------------+  |
|  | SPA React 19 (src/)                  |   | Kit estático tasteskill 2.5.1    |  |
|  | - Studio VFS, Catálogo, Explorar,    |   | (public/assets/)                 |  |
|  |   Clases, UI Kit (20 comp.), Models  |   | Preservado sin transformar por   |  |
|  | - Estado local saneado: localStorage |   | preservePublicKitAssets (Vite)   |  |
|  | - Snapshot respaldo: public/data/    |   +----------------------------------+  |
|  | - Token OAuth: SOLO en memoria       |                                         |
|  +------------------+-------------------+                                         |
+---------------------|-------------------------------------------------------------+
                      |
                      | 1. Lecturas públicas (sin token, caché + TTL) y escrituras
                      |    autenticadas (token Bearer en memoria)
                      +-----------------------------------> https://api.github.com
                      |                                      |- Repo catálogo (VITE_CATALOG_REPO):
                      |                                      |   Issues (skill / result / class)
                      |                                      |   + reacciones (+1) + codice-labeler.yml
                      |                                      +- Repo personal (<login>/codice-skills):
                      |                                          Git Data API (blobs, trees, commits, SHA)
                      |
                      | 2. Canje OAuth + PKCE (POST code, redirect_uri, code_verifier)
                      +-----------------> api/github-oauth.ts (Vercel Serverless Function)
                      |                    [Único lugar con GITHUB_CLIENT_SECRET + CORS estricto]
                      |                                      |
                      |                                      v
                      |                   https://github.com/login/oauth/access_token
                      |
                      | 3. Directorio sincronizado Explorar (GET ?mode=list|search)
                      +-----------------> api/skills-sh.ts (Vercel Serverless Function)
                      |                    [CORS estricto, anti-SSRF, caché Edge 5 min;
                      |                     degrada a caché local y public/data/skills-sh-snapshot.json]
                      |                                      |
                      |                                      v
                      |                   https://www.skills.sh/api/*
                      |
                      | 4. Traducción opcional al español (bajo demanda)
                      +-----------------> API nativa Translator del navegador
                      |                   o https://generativelanguage.googleapis.com
                      |                     (clave de Gemini aportada por la persona)
                      |
                      | 5. Reproducción de videos en Códice -> Clases (tras clic explícito)
                      +-----------------> https://www.youtube-nocookie.com (iframe bajo demanda)
```

## Piezas
El repositorio no usa un esquema monorepo `apps/web` + `apps/api`; la aplicación vive directamente en la raíz del proyecto con las siguientes piezas reales:

| Pieza | Ubicación | Responsabilidad |
|-------|-----------|-----------------|
| **Frontend (SPA)** | `src/` | Aplicación en React 19 + TypeScript estricto. Navegación interna sin *router* externo mediante el estado `AppPageRoute` en `src/App.tsx`, con carga diferida (`React.lazy` + `Suspense`) de las vistas secundarias (incluida `skills-sh` / **Explorar**). |
| **Kit editorial y activos** | `public/assets/`, `public/components/`, `public/data/` | Sistema visual estático HTML/CSS/JS `tasteskill 2.5.1` (preservado sin transformar por `preservePublicKitAssets` en `vite.config.ts`), miniaturas `.png` de los 20 componentes del UI Kit y snapshot de respaldo `skills-sh-snapshot.json`. |
| **Funciones Vercel (`api/`)** | `api/github-oauth.ts`, `api/skills-sh.ts` | Funciones *serverless* Web Fetch (`Request`/`Response`) con CORS estricto (`ALLOWED_ORIGINS`): canje OAuth PKCE sin exponer `GITHUB_CLIENT_SECRET`, y proxy de solo lectura anti-SSRF con caché Edge hacia `https://www.skills.sh`. |
| **Verificación y utilidades** | `scripts/` | Sensor maestro `scripts/check.sh`, 16 suites automatizadas en Node y Playwright (`scripts/test-*.mjs`), simuladores de GitHub en memoria (`scripts/lib/`), sincronizador `sync-skills-sh-snapshot.mjs` y capturador de componentes. |
| **Documentación y harness** | `docs/` | Contexto del producto (`project/`), stack (`stack/`), reglas obligatorias (`rules/`), referencias (`references/`), specs (`specs/`), planes (`plans/`), decisiones arquitectónicas (`decisions/`) y guía del catálogo (`catalog-setup.md`). |

## Contratos
1. **Tipos de dominio en TypeScript (`src/types/`):**
   - `src/types/catalog.ts`: contratos del catálogo comunitario (`CatalogSkill`, `SkillResult`, auditoría estática, sesión de GitHub, puente por `skillId` y filtros).
   - `src/types/skillsSh.ts`: contratos del directorio sincronizado `skills.sh` (`SkillsShEntry`, `SkillsShView`, `SkillsShListResult`, `SkillsShSearchResult`, `SkillsShSnapshotFile`).
   - `src/types/lessons.ts`: modelo de lecciones locales, partes de video de YouTube y metadatos de clases compartidas en comunidad.
   - `src/types/skill.ts`: documento de *skill*, colecciones de frameworks y especificaciones de auditoría.
   - `src/types/uiComponents.ts`: metadatos (`UiComponentMeta`), entradas del registro y asignaciones de componentes UI.
   - `src/types/workspace.ts`: nodos del sistema de archivos virtual (VFS), rutas `AppPageRoute`, pestañas abiertas y estados de cambios (*Diff*).
2. **Contrato en Issues de GitHub (`<!-- codice:v1 {...} -->`):**
   - Cada Issue abierto en `VITE_CATALOG_REPO` incluye en su cuerpo un comentario HTML estructurado con `{ kind, labels, data }`.
   - Tipos soportados actualmente: `'skill'` (ancla de *skill* fijada a `commitSha`), `'result'` (reporte de evaluación por modelo y veredicto) y `'class'` (clase publicada en `<login>/codice-skills`), más `'team'` previsto en las Fases 5 y 6.
   - Tanto el workflow `.github/workflows/codice-labeler.yml` del repo catálogo como el lector `src/services/githubCatalogService.ts` validan el esquema, los prefijos de etiquetas y la correspondencia de autoría antes de aceptar un registro.

## Datos
No existe base de datos relacional ni NoSQL propia ni carpeta de migraciones:

- **Estado comunitario compartido (GitHub):**
  - *Índice y votos:* Issues públicos y reacciones `+1` en el repositorio configurado en `VITE_CATALOG_REPO`.
  - *Contenido versionado:* archivos Markdown y manifiestos publicados en `<login>/codice-skills` mediante commits atómicos de la Git Data API y leídos siempre fijados a un `commitSha` de 40 caracteres (inmutabilidad frente a modificaciones posteriores en ramas).
- **Estado local del navegador (`localStorage`):**
  - Claves versionadas para copias de trabajo (`ai_skills_studio_workcopies_v1`), clases propias (`ai_skills_studio_lessons_v1`), asignaciones del UI Kit (`ai_skills_studio_component_assignments_v1`) y cachés HTTP con TTL (de 30 s a 24 h, con reutilización de caché expirada si se agota el *rate limit* de GitHub).
  - Toda lectura de `localStorage` pasa por *type guards* explícitos para descartar datos corruptos o esquemas antiguos sin romper el renderizado.
- **Sesión y credenciales:**
  - El token OAuth de GitHub vive **exclusivamente en memoria** (`src/services/githubAuthService.ts`); jamás se escribe en `localStorage`, `sessionStorage` ni cookies. Recargar la pestaña cierra la sesión.

## Decisiones relevantes
- [`docs/decisions/0001-agents-md-como-indice-unico.md`](../decisions/0001-agents-md-como-indice-unico.md) — uso de `AGENTS.md` corto como único punto de entrada para agentes de IA y detalle desacoplado en `docs/`.
- [`docs/decisions/0002-adopcion-del-harness.md`](../decisions/0002-adopcion-del-harness.md) — adopción del harness respetando la estructura real del repositorio (`src/`, `api/`, `scripts/`) sin forzar carpetas ficticias.
- [`docs/catalog-setup.md`](../catalog-setup.md) — arquitectura operativa de GitHub Issues + `codice-labeler.yml` + OAuth PKCE en Vercel + CSP `connect-src`.
- [`REPORTE_SEGURIDAD_Y_CALIDAD.md`](../../REPORTE_SEGURIDAD_Y_CALIDAD.md) — historial de endurecimiento de seguridad (CSP, cabeceras HTTP, límites de subida y sanitización) y partición del bundle con `React.lazy`.
