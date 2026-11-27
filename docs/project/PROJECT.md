# Proyecto · Códice Studio (`ai-skills-studio`)

## Qué es
Códice Studio (`ai-skills-studio`) es una aplicación web *client-side* y catálogo comunitario sobre GitHub para inspeccionar bajo demanda, auditar, traducir, probar y compartir *skills* (`SKILL.md`), componentes UI accesibles y clases técnicas para agentes de IA.

## Para quién
Desarrolladores e ingenieros de IA —tanto individuales como equipos de trabajo— que utilizan Claude Code, Antigravity CLI, Cursor o Gemini CLI y necesitan auditar la seguridad y calidad de las *skills* inspeccionando sus archivos reales fijados a un `commitSha` inmutable antes de instalarlas o importarlas, consultar componentes UI con código real y compartir conocimiento técnico en español.

## Alcance
- **Incluye:**
  - **Catálogo comunitario y Skills de equipo (`Catálogo` y `Skills`):** publicación por URL pública, desde carpeta o archivo local o redactando directamente desde la aplicación hacia `<login>/codice-skills`; votos (`👍`), reportes verificables por modelo de IA (`ResultsByModel`, `ReportResultForm`), auditoría automática de riesgos (`AuditBadge` + `skillAuditHelpers.ts`), **inspección bajo demanda de archivos reales fijados a `commitSha` en `FilesPanel`** (texto inerte hasta 512 KB, exclusión de binarios/rutas inseguras, copia y re-auditoría automática), generación del comando de instalación fijado a SHA inmutable y traducción al español (API nativa `Translator` o clave propia de Gemini).
  - **Explorar (`skills.sh`):** directorio abierto sincronizado vía proxy `api/skills-sh.ts` y snapshot de respaldo (`all-time`, `trending`, `hot`, filtro *Oficiales*, búsqueda y copia de `npx skills add`) con botón **Inspeccionar** que abre `SkillDetailPage` en modo vista previa de solo lectura fijado a `commitSha` e **Importar al catálogo** (las fuentes `.well-known` muestran aviso claro sin acciones rotas).
  - **Kit propio de 20 componentes UI (`Componentes` en `src/components/ui-kit/`):** demostraciones interactivas en vivo, inspección del código fuente real importado con `?raw`, miniaturas generadas automáticamente y asignación local de *skills* y modelos de IA recomendados (`AI_BENCHMARK_MODELS`) por componente.
  - **Códice → Clases (`Códice`):** creación y lectura de lecciones en Markdown sanitizado con partes de video de YouTube (`youtube-nocookie.com` cargadas bajo demanda tras interacción del usuario), vinculación con skills del equipo, importación/exportación en JSON, integración directa con bóvedas de Obsidian (`obsidian://`) y pestaña *Comunidad* compartida a través de GitHub.
- **No incluye (por ahora):**
  - Backend monolítico propio ni base de datos tradicional.
  - Cuentas locales con correo y contraseña (retiradas en favor de autenticación OAuth con GitHub mantenida exclusivamente en memoria).
  - Workspace VFS en navegador, copias de trabajo locales (`workingCopy`), comparador standalone de modelos, catálogo mockup de presets UI ni empaquetado/parsing local `.zip`/`.rar` (retirados en `004` en favor de la publicación directa por GitHub API y la inspección bajo demanda por `commitSha`).
  - Ejecución de código o scripts arbitrarios contenidos dentro de las *skills* inspeccionadas.
  - Indexación de repositorios privados en el catálogo comunitario público.
  - *Próximos hitos planificados en `docs/features.json`:* Equipos de trabajo dinámicos (Fase 5) y Skills colaborativas de equipo (Fase 6).

## Estado actual
En **producción (`v2.2.2`)**, desplegado como sitio estático y funciones serverless en:
- **Vercel (producción principal):** `https://codice-oauth.vercel.app/` (`api/github-oauth.ts` y `api/skills-sh.ts`)

**Pendiente operativo manual externo:** actualizar el archivo `.github/workflows/codice-labeler.yml` dentro del repositorio catálogo de GitHub para que reconozca y etiquete automáticamente los Issues con `kind: 'class'` (procedimiento documentado en `docs/catalog-setup.md`).

## Glosario
| Término | Significado en este proyecto |
|---------|------------------------------|
| **Skill (`SKILL.md`)** | Paquete de instrucciones estructuradas (YAML *frontmatter* + Markdown y recursos opcionales) que extiende las capacidades de un agente de IA como Claude Code o Antigravity CLI. |
| **Repo catálogo (`VITE_CATALOG_REPO`)** | Repositorio público de GitHub cuyos Issues y reacciones actúan como índice comunitario descentralizado de *skills*, reportes de resultados y clases compartidas. |
| **Issue ancla y marcador `codice:v1`** | Issue abierto en el repo catálogo que contiene un bloque oculto `<!-- codice:v1 {...} -->` con metadatos JSON estructurados (`kind: 'skill' \| 'result' \| 'class'`), validado y etiquetado por el workflow `codice-labeler.yml`. |
| **Repo personal (`<login>/codice-skills`)** | Repositorio público en la cuenta de GitHub de cada autora o autor donde la aplicación crea commits vía Git Data API al publicar desde archivos locales, desde el editor integrado o al compartir una clase (`classes/<id>/`). |
| **Inspección bajo demanda (`commitSha`)** | Descarga unitaria desde `FilesPanel` (`getGithubFileAtSha` / `getSkillFileContent`) del código de archivos distintos de `SKILL.md` fijados a un SHA de 40 caracteres, mostrándolos como texto plano inerte (≤ 512 KB, sin binarios ni rutas inseguras) y disparando la re-auditoría automática de `AuditBadge`. |
| **Explorar (`skills.sh`)** | Módulo conectado a `api/skills-sh.ts` y snapshot estático para descubrir rankings externos (`all-time`, `trending`, `hot`), inspeccionar skills de GitHub en modo vista previa de solo lectura (`SkillDetailPage`) o importarlas al catálogo comunitario. |
| **UI Kit (`componentRegistry`)** | Colección propia de 20 componentes React accesibles en `src/components/ui-kit/`, registrados en `src/data/componentRegistry.ts` con vista previa en vivo, código fuente crudo (`?raw`) y criterios `a11y`. |
| **Clase compartida** | Lección de *Códice → Clases* publicada en `classes/<id>/` dentro de `<login>/codice-skills` (fijada a un SHA) y anunciada en el repo catálogo mediante un Issue `[class] <login>/<id>` para aparecer en la pestaña *Comunidad*. |
