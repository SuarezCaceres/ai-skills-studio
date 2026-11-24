# Plan · 003 · Directorio sincronizado de skills.sh (Explorar)

> Estado: aprobado

## Enfoque
Implementar una integración híbrida de `https://www.skills.sh` bajo la ruta `'skills-sh'` (**Explorar**) sin añadir dependencias `npm` ni abrir orígenes nuevos en la CSP de producción. En producción, el cliente deriva el proxy `<origen-vercel>/api/skills-sh` del origen ya autorizado en `VITE_GITHUB_OAUTH_URL` (con override opcional `VITE_SKILLS_SH_PROXY_URL` en el mismo origen); en desarrollo local sin proxy configurado, la interfaz degrada automáticamente al snapshot estático `public/data/skills-sh-snapshot.json` sin tocar `vite.config.ts`. El snapshot se mantiene actualizado cada 6 h mediante `.github/workflows/sync-skills-sh.yml`. Para las acciones **Abrir en Workspace** e **Importar al catálogo**, se amplía `githubCatalogService` con resolución de `SKILL.md` por `(source, skillId)` fijada a `commitSha`.

## Cambios por área
| Área | Archivos / módulos | Qué cambia |
|---|---|---|
| **Contrato (Fase 0, secuencial)** | `src/types/skillsSh.ts` *(nuevo)*, `src/types/workspace.ts`, `src/types/catalog.ts`, `src/App.tsx` | Contratos `SkillsShEntry`, `SkillsShView`, `SkillsShListResult`, `SkillsShSearchResult`, `SkillsShSnapshot`; nueva ruta `'skills-sh'` en `AppPageRoute`; `React.lazy` de `SkillsShPage` y handlers `openSkillsShInStudio` / `importSkillsShToCatalog` en `App.tsx`. |
| **Backend / Proxy y Snapshot (Paralelo A)** | `api/skills-sh.ts` *(nuevo)*, `scripts/sync-skills-sh-snapshot.mjs` *(nuevo)*, `public/data/skills-sh-snapshot.json` *(nuevo)*, `.github/workflows/sync-skills-sh.yml` *(nuevo, autorizado)*, `.env.example` | Proxy serverless Vercel con CORS estricto (`ALLOWED_ORIGINS`), anti-SSRF, sanitización y caché Edge 5 min; script generador de snapshot estático, snapshot inicial y workflow cron cada 6 h. |
| **Servicios cliente (Paralelo B)** | `src/services/skillsShService.ts` *(nuevo)*, `src/services/githubCatalogService.ts` | Cliente híbrido (`live → cache → snapshot`) con búsqueda local de respaldo y construcción segura del comando `npx skills add`; nuevo método `resolveGithubSkillByHint(source, skillId)` para localizar `SKILL.md` en repos mono/multi-skill fijado a `commitSha`. |
| **Frontend UI (Paralelo C)** | `src/components/NavbarActiveSkill.tsx`, `src/components/skills-sh/SkillsShPage.tsx` *(nuevo)*, `src/components/skills-sh/SkillsShCard.tsx` *(nuevo)* | Enlace **Explorar** en la barra superior y menú de módulos; página completa con tabs de vista, buscador con *debounce*, filtro Oficiales, paginación, indicador de origen (`En vivo` / `Respaldo`), copia de `npx`, atribución a `skills.sh`, **Abrir en Workspace** e **Importar al catálogo**. |
| **Pruebas y sensor (Fase 2)** | `scripts/test-skills-sh-proxy.mjs` *(nuevo)*, `scripts/test-skills-sh-service.mjs` *(nuevo)*, `scripts/test-skills-sh-page.mjs` *(nuevo)*, `scripts/check.sh` | Unitarias del proxy y del servicio híbrido + puente GitHub con `fetch` simulado; E2E Playwright en 4 anchos (`1440`, `1024`, `768`, `390`) con red interceptada; alta de `api/skills-sh.ts` en `TYPECHECK_CMD` y de las 3 suites en `scripts/check.sh`. |

## Autorizaciones de zonas blindadas
- `.github/workflows/sync-skills-sh.yml` (zona blindada CI/CD): **autorizado explícitamente por el usuario**.
- Sin modificaciones en `api/github-oauth.ts`, `public/assets/*`, `index.html`, `docs/rules/*` ni dependencias `npm`.

## Pruebas
| Criterio | Tipo de prueba | Dónde |
|---|---|---|
| C1 | Unitaria (Node, `fetch` simulado) | `scripts/test-skills-sh-proxy.mjs` |
| C2 | Unitaria / Integración (Node, `fetch` y storage simulados) | `scripts/test-skills-sh-service.mjs` |
| C3 | Integración de servicio (Node, GitHub simulado) | `scripts/test-skills-sh-service.mjs` |
| C4 | E2E multi-ancho (Playwright, `1440`/`1024`/`768`/`390`, red interceptada) | `scripts/test-skills-sh-page.mjs` |

## Pasos
1. Guardar spec, plan y alta de `003` en `docs/features.json` (`estado: "en_curso"`).
2. **Fase 0 (secuencial):** Congelar `src/types/skillsSh.ts`, ampliar `AppPageRoute` en `src/types/workspace.ts` y `CatalogApi` en `src/types/catalog.ts`, y cablear `SkillsShPage` (con stub temporal o tras crear interfaz) y los handlers en `src/App.tsx`; verificar `npx tsc -b`.
3. **Fase 1 (paralelo Zero-Conflict):** Despachar 3 subagentes con propiedad disjunta:
   - Subagente A (`backend-proyecto`): `api/skills-sh.ts`, `scripts/sync-skills-sh-snapshot.mjs`, `public/data/skills-sh-snapshot.json`, `.github/workflows/sync-skills-sh.yml`, `.env.example`.
   - Subagente B (`backend-proyecto`): `src/services/skillsShService.ts` y `resolveGithubSkillByHint` en `src/services/githubCatalogService.ts`.
   - Subagente C (`frontend-proyecto`): `src/components/skills-sh/SkillsShCard.tsx`, `src/components/skills-sh/SkillsShPage.tsx`, `src/components/NavbarActiveSkill.tsx`.
4. **Fase 2 (`pruebas-proyecto`):** Crear `scripts/test-skills-sh-proxy.mjs`, `scripts/test-skills-sh-service.mjs`, `scripts/test-skills-sh-page.mjs`, conectar en `scripts/check.sh` y ejecutar `./scripts/check.sh` completo.
5. **Fase 3 (`revisor` + cierre):** Auditoría independiente, corregir hallazgos, actualizar `docs/features.json`, `docs/TASKS.md`, `docs/PROGRESS.md` y abrir PR de 5 secciones.

## Riesgos
- **Desbordamiento en la cabecera superior al pasar a 8 enlaces visibles:** mitigar verificando en Playwright en `1440`, `1024`, `768` y `390` px y ajustando la visibilidad de `PAGE_NAV_ITEMS` si hace falta.
- **Cambio futuro en el contrato interno de `skills.sh`:** mitigar mediante validación defensiva en `api/skills-sh.ts` y `skillsShService.ts` más degradación automática al snapshot estático.
- **Límite de GitHub API (60 req/h sin sesión) al inspeccionar en Workspace:** mitigar reutilizando la caché existente de `githubCatalogService` y evitando leer múltiples archivos innecesarios al buscar `SKILL.md`.
