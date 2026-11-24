# Spec · 003 · Directorio sincronizado de skills.sh (Explorar)

> Estado: aprobada

## Problema
Códice Studio cuenta con un catálogo comunitario propio respaldado por GitHub Issues, pero el ecosistema abierto de skills (`SKILL.md`) crece a diario en el directorio público `https://www.skills.sh` (~10,000 skills). Hasta ahora, quienes usan Códice Studio tenían que salir de la aplicación para descubrir nuevas skills y copiar URLs manualmente; además, `skills.sh` bloquea incrustaciones (`X-Frame-Options: DENY`) y no habilita CORS en sus endpoints JSON.

## Objetivo
Integrar en Códice Studio una sección propia **Explorar** en la barra de navegación superior sincronizada automáticamente con `https://www.skills.sh` mediante una arquitectura híbrida (proxy Edge en Vercel en vivo + copia de respaldo estática actualizada periódicamente), permitiendo buscar, filtrar por ranking, copiar el comando `npx skills add`, inspeccionar el `SKILL.md` en Workspace e importar skills de GitHub directamente al catálogo comunitario.

## Alcance
- **Incluye:**
  - Nueva sección **Explorar** (`AppPageRoute = 'skills-sh'`) en la barra superior y menú de módulos, cargada bajo demanda (`React.lazy`).
  - Función serverless `api/skills-sh.ts` en Vercel con CORS por `ALLOWED_ORIGINS`, lista blanca estricta anti-SSRF y caché Edge (`s-maxage=300, stale-while-revalidate=3600`).
  - Snapshot estático de respaldo `public/data/skills-sh-snapshot.json`, script reproducible `scripts/sync-skills-sh-snapshot.mjs` y workflow programado `.github/workflows/sync-skills-sh.yml` (cada 6 h, aprobado explícitamente por el dueño del repositorio).
  - Vistas *Más instaladas (`all-time`)*, *Tendencia (`trending`)* y *En alza (`hot`)*, filtro *Oficiales*, buscador en vivo con *debounce* y paginación.
  - Acciones por skill: atribución clara a `skills.sh`, enlace a ficha original y repositorio, copia de `npx skills add <source> --skill <skillId>`, **Abrir en Workspace** (GitHub `owner/repo` fijado a `commitSha`) e **Importar al catálogo** (GitHub `owner/repo` con sesión GitHub).
- **No incluye:**
  - Incrustar `skills.sh` vía `<iframe>`.
  - Importación directa o lectura en Workspace de fuentes `.well-known` no alojadas en GitHub (~14% del índice); en esos casos se muestra aviso claro manteniendo el comando `npx` y el enlace externo.
  - Nuevas dependencias `npm`.

## Historias de usuario
- Como persona usuaria, quiero explorar las skills más populares y en tendencia de `skills.sh` dentro de Códice Studio sin salir de la app y con datos actualizados automáticamente.
- Como desarrolladora, quiero buscar en las ~10,000 skills de `skills.sh`, copiar su comando `npx skills add` o abrir su `SKILL.md` en el Workspace VFS para auditarla antes de instalarla.
- Como miembro con sesión en GitHub, quiero importar con un clic una skill de `skills.sh` alojada en GitHub al catálogo comunitario de Códice Studio para auditarla, votarla y reportar resultados por modelo.
- Como visitante sin conectividad con `skills.sh` o sin proxy Vercel configurado, quiero que la sección **Explorar** siga funcionando con una copia de respaldo estática avisándome con transparencia del estado de sincronización.

## Criterios de aceptación
- **C1:** Dado el endpoint serverless `api/skills-sh.ts`, cuando recibe peticiones con origen autorizado (`ALLOWED_ORIGINS`) y parámetros válidos (`mode=list` con `view` en `all-time|trending|hot` y `page` acotado, o `mode=search` con `q` y `limit` acotados), entonces devuelve JSON saneado con cabeceras `Cache-Control` de caché Edge y rechaza orígenes no autorizados (`403`) o parámetros fuera de lista blanca (`400`).
- **C2:** Dado `skillsShService`, cuando consulta el directorio y el proxy en vivo responde, entonces sirve datos en vivo (`sourceMode: 'live'`) y los guarda en caché local saneada; y cuando el proxy falla o no está configurado, entonces degrada automáticamente a caché válida o al snapshot estático (`public/data/skills-sh-snapshot.json`, `sourceMode: 'snapshot'`) soportando búsqueda local y mostrando la fecha de respaldo.
- **C3:** Dada una skill de `skills.sh` cuya fuente `source` es un repositorio público de GitHub (`owner/repo`), cuando la persona pulsa **Abrir en Workspace** o **Importar al catálogo**, entonces se resuelve el `SKILL.md` correspondiente a `skillId` (tanto en repos mono-skill como multi-skill) fijado al `commitSha` real y se abre en Workspace o se registra en el catálogo; y si `source` es un dominio `.well-known`, se informa de la limitación sin error inesperado.
- **C4:** Dada la sección **Explorar** en la barra de navegación superior, cuando se navega y opera en los 4 anchos (`1440`, `1024`, `768`, `390` px), entonces la vista muestra ranking, filtro *Oficiales*, buscador, paginación, atribución a `skills.sh`, copia de comando `npx` y acciones de integración respetando la paleta Cyber Dark (`#0a0d14`, `#121722`, `#0ea5e9`), accesibilidad y sin desbordamiento horizontal ni errores de consola.

## Casos límite y errores
- `skills.sh` caído, timeout (> 8 s) o cambio de formato: degradación silenciosa y controlada al snapshot estático con banner explicativo en español y botón de reintento.
- Fuentes `.well-known` (sin barra `/` en `source`, ej. `uizze.sh` o `open.feishu.cn`): se renderizan con insignia *Fuente externa*, permiten copiar `npx skills add` y abrir `skills.sh`, y deshabilitan con explicación los botones dependientes de `api.github.com`.
- Repos multi-skill en GitHub donde `skillId` no coincide exactamente con el nombre de carpeta: se intenta coincidencia por ruta normalizada y frontmatter `name` de forma acotada antes de informar que el repositorio requiere registro manual por URL de carpeta.
- Rate limit anónimo de GitHub (60 req/h) al abrir en Workspace: se muestra el error accionable de `CatalogError` sugiriendo iniciar sesión con GitHub.

## Preguntas abiertas
- Ninguna: alcance, ubicación (**Explorar** en barra superior), estrategia híbrida (Vercel + snapshot cron cada 6 h) y acciones aprobadas por el usuario el 2026-11-24.
