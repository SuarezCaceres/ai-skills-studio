# Proyecto · Códice Studio (`ai-skills-studio`)

## Qué es
Códice Studio (`ai-skills-studio`) es un IDE web *client-side* y plataforma comunitaria para auditar, editar, probar y compartir *skills* (`SKILL.md`), componentes UI accesibles y clases técnicas para agentes de IA.

## Para quién
Desarrolladores e ingenieros de IA —tanto individuales como equipos de trabajo— que utilizan Claude Code, Antigravity CLI, Cursor o Gemini CLI y necesitan validar la seguridad y calidad de las *skills* antes de instalarlas en su máquina, editar copias aisladas en un sistema de archivos virtual (VFS) sin ensuciar su entorno local y compartir conocimiento técnico en español.

## Alcance
- **Incluye:**
  - **Workspace Studio VFS en memoria:** montaje de carpetas locales (`showDirectoryPicker` / `webkitdirectory`), compresión y descompresión real de paquetes `.ZIP` y `.skillbundle` (`DecompressionStream`), inspección honesta de archivos `.rar` heredados (con tope estricto de 25 MB y protección contra *path traversal*), editor multi-pestaña con vista *Diff* línea a línea y auditor anti-slop y de seguridad para `SKILL.md`.
  - **Catálogo comunitario y Skills sobre GitHub:** publicación por URL pública, desde carpeta o archivo local o redactando directamente desde la aplicación hacia `<login>/codice-skills`; votos (`👍`), reportes verificables por modelo de IA, auditoría automática de riesgos (`curl | sh`, scripts ejecutables, rutas sensibles), generación del comando de instalación fijado a un commit SHA inmutable y traducción al español (mediante la API nativa `Translator` del navegador o clave propia de Gemini).
  - **Kit propio de 20 componentes UI (`src/components/ui-kit/`):** demostraciones interactivas en vivo, inspección del código fuente real importado con `?raw`, miniaturas generadas automáticamente y asignación local de *skills* y modelos de IA recomendados por componente.
  - **Códice → Clases:** creación y lectura de lecciones en Markdown sanitizado con partes de video de YouTube (`youtube-nocookie.com` cargadas bajo demanda tras interacción del usuario), importación/exportación en JSON y pestaña *Comunidad* compartida a través de GitHub.
  - **Benchmarking y herramientas de flujo:** comparativa técnica de 8 modelos de IA (`Opus 5.5`, `Opus 4.8`, `Gemini 3.8`, `Gemini 3.7`, `Sonnet 5.5`, `GPT Astra`, `GPT Luna` y `DeepSeek V3`), dictado por voz (Web Speech API con sanitización de entrada) e integración directa con bóvedas de Obsidian (`obsidian://`).
- **No incluye (por ahora):**
  - Backend monolítico propio ni base de datos tradicional.
  - Cuentas locales con correo y contraseña (retiradas en favor de autenticación OAuth con GitHub mantenida exclusivamente en memoria).
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
| **Copia de trabajo (`workingCopy`)** | Clon editable persistido en `localStorage` (`ai_skills_studio_workcopies_v1`) que permite modificar y auditar una *skill* sin alterar la versión original del catálogo hasta exportar o publicar los cambios. |
| **Workspace VFS** | Sistema de archivos virtual en memoria del Studio que monta directorios locales o paquetes comprimidos para edición multi-pestaña, comparación *Diff* línea a línea y empaquetado `.ZIP` / `.skillbundle`. |
| **UI Kit (`componentRegistry`)** | Colección propia de 20 componentes React accesibles en `src/components/ui-kit/`, registrados en `src/data/componentRegistry.ts` con vista previa en vivo, código fuente crudo (`?raw`) y criterios `a11y`. |
| **Clase compartida** | Lección de *Códice → Clases* publicada en `classes/<id>/` dentro de `<login>/codice-skills` (fijada a un SHA) y anunciada en el repo catálogo mediante un Issue `[class] <login>/<id>` para aparecer en la pestaña *Comunidad*. |
