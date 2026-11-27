# Spec · 004 · Retiro de Workspace e inspección real de código

> Estado: aprobada

## Problema
El módulo **Workspace (`estudio`)** y sus pantallas o utilidades acopladas (**Modelos**, **Capturas**, **Presets UI** y el parser/empaquetador local `.zip`/`.rar`) nacieron antes de existir el **Catálogo** comunitario sobre GitHub, la sección **Componentes** con vistas previas y código fuente real y el directorio **Explorar (`skills.sh`)**. Hoy introducen complejidad, estado local (`workingCopy` en `localStorage`), UI heredada desalineada con el producto y falsas expectativas de edición/empaquetado local sin aporte real para los equipos.

Al mismo tiempo, la única necesidad real que seguía pasando por Workspace —**inspeccionar bajo demanda los archivos reales (scripts, referencias y configuración) de una skill antes de instalarla o importarla**— está incompleta en el visor actual: dentro de **Catálogo** (`SkillDetailPage`), los archivos distintos de `SKILL.md` no se descargan en la pestaña **Archivos**, y en **Explorar (`skills.sh`)** la única acción para inspeccionar una skill externa es *"Abrir en Workspace"*.

## Objetivo
Retirar de forma limpia **Workspace**, sus módulos acoplados (**Modelos**, **Capturas**, **Presets UI**) y el soporte de archivos `.zip`/`.rar`, reorientar la portada, navegación y pie hacia los módulos vigentes (**Catálogo**, **Equipos**, **Explorar**, **Componentes** y **Códice**) y unificar la **inspección segura bajo demanda de archivos fijados a `commitSha`** directamente dentro de la ficha de detalle de skill.

## Alcance
- **Incluye:**
  - Retiro completo del módulo **Workspace** (`estudio`), la ruta standalone **Modelos** (`modelos-ia`), la ruta oculta **Capturas** (`evidencias`), el catálogo de mockups **Presets UI** (`StylePresetCatalog` + feedback de reseñas/voz asociado) y el parsing/exportación de archivos `.zip`/`.rar` en el navegador (`rarParserService`).
  - Eliminación de las copias de trabajo locales (`workingCopy`, `ActiveSkillBar`, `NoSkillState`), de los botones **«Abrir en estudio»** en tarjetas/detalle/perfiles y del enlace a copias locales en el creador de **Códice** (manteniendo la vinculación con skills reales del equipo).
  - Conservación de las listas y datos reales usados fuera de Workspace: veredicto y reporte por modelo de IA dentro de **Catálogo** (`ResultsByModel`, `ReportResultForm`) y asignación de modelos a **Componentes** (`AssignDrawer`, `ComponentDetail`).
  - **Inspección bajo demanda en la pestaña Archivos de `SkillDetailPage`:** al seleccionar un archivo distinto de `SKILL.md` de una skill del catálogo, descargar su contenido real desde su `commitSha` exacto en GitHub (dentro del tope de tamaño y rutas seguras), mostrarlo como texto plano con opción de copiar y **re-auditar** automáticamente los hallazgos de seguridad (`AuditBadge`) incluyendo el contenido recién cargado.
  - **Vista previa unificada desde `Explorar (skills.sh)`:** sustituir **«Abrir en Workspace»** por una acción para **inspeccionar la skill** usando la misma interfaz de **Detalle de skill** en modo vista previa de solo lectura fijada al `commitSha` resuelto (`SKILL.md`, traducción al español, `AuditBadge`, pestaña **Archivos** bajo demanda, comando `npx`/instalación y botón **Importar al catálogo** / regreso a **Explorar**, ocultando votos/reportes hasta que exista en el catálogo). Las fuentes `.well-known` mantienen el aviso actual sin botones rotos.
  - **Actualización de portada (Landing), barra superior y pie de página:** reemplazar textos, CTAs y demostraciones interactivas que hoy promocionan *Abrir Workspace*, `.zip`/`.rar` o el comparador standalone de 7 modelos para dirigir a los módulos activos (**Catálogo**, **Equipos**, **Explorar**, **Componentes** y **Códice**).
  - Limpieza al cerrar sesión de la clave residual de copias de trabajo en `localStorage`, manteniendo **intactas las zonas blindadas** (`public/assets/*`, `vite.config.ts`, `api/github-oauth.ts`, `src/utils/securityHardening.ts`, CSP de `index.html`, workflows CI/CD) y `docs/rules/security.md`.
  - Actualización de pruebas E2E/unitarias existentes cuyas aserciones hoy exigen **Workspace**, **Modelos** o `rarParserService` (confirmada en la alineación previa) y nuevas pruebas para la inspección bajo demanda y la vista previa de `skills.sh`.
- **No incluye:**
  - Edición in-browser de múltiples archivos de una skill ni almacenamiento de borradores `.zip`/`.rar` (la publicación desde carpeta local y la edición colaborativa con commit continúan únicamente mediante GitHub API en el Catálogo).
  - Ejecución en navegador de scripts inspeccionados (`.sh`, `.ps1`, `.py`, etc.).
  - Modificación de zonas blindadas ni de `docs/rules/*`.
  - Incorporación de nuevas dependencias `npm`.

## Historias de usuario
- Como integrante del equipo que revisa el **Catálogo**, quiero hacer clic en cualquier archivo de la pestaña **Archivos** de una skill para leer su código fuente real fijado al `commitSha` auditado y confirmar con `AuditBadge` si los scripts contienen comandos peligrosos antes de instalarla.
- Como persona que descubre una skill de GitHub en **Explorar (`skills.sh`)**, quiero abrir su detalle completo en modo vista previa sin entrar a ningún Workspace obsoleto, revisar su `SKILL.md` y sus archivos reales fijados al commit y decidir si copiar el comando o importarla al catálogo.
- Como visitante que llega a la portada o navega por la barra superior, quiero encontrar un producto coherente enfocado en **Catálogo**, **Equipos**, **Explorar**, **Componentes** y **Códice**, sin rutas huérfanas, mockups obsoletos ni menciones a `.rar`/Workspace.

## Criterios de aceptación
Cada criterio debe poder comprobarse con una prueba. Se copian a `docs/features.json`.
- **C1:** Dado el menú de módulos, las tarjetas del catálogo, **Componentes** y **Códice**, cuando se carga la aplicación tras el retiro, entonces no existen las rutas **Workspace** (`estudio`), **Modelos** (`modelos-ia`), **Capturas** (`evidencias`), **Presets UI**, copias de trabajo (`ActiveSkillBar`/`workingCopy`), parsing `.zip`/`.rar` ni botones **«Abrir en estudio»**, mientras **Catálogo**, **Equipos**, **Explorar**, **Componentes** (con modelos disponibles) y **Códice** (con skills del equipo) siguen funcionando con normalidad.
- **C2:** Dado el detalle de una skill en el **Catálogo** (`SkillDetailPage`) con archivos adicionales además de `SKILL.md`, cuando el usuario abre la pestaña **Archivos** y selecciona un archivo de texto, entonces se solicita su contenido real fijado a `commitSha`, se muestra como texto inerte con botón de copia (con estados visibles de carga, error recuperable y archivos excluidos por tamaño/tipo) y `AuditBadge` re-evalúa el archivo descargado actualizando los hallazgos de seguridad si detecta patrones riesgosos o quita la alerta de script sin leer cuando ya fue inspeccionado.
- **C3:** Dado un resultado alojado en GitHub dentro de **Explorar (`skills.sh`)**, cuando el usuario pulsa la acción de inspección, entonces se resuelve la skill fijada a su `commitSha` real y se abre la vista unificada de **Detalle de skill** en modo vista previa con `SKILL.md`, traducción fiel, auditoría `AuditBadge`, visor bajo demanda en **Archivos**, instalación y acción directa de **Importar al catálogo** y regreso a **Explorar**; en entradas `.well-known` se conserva el aviso claro sin acciones rotas.
- **C4:** Dada la portada (hero, escaparate del portátil, capacidades y preguntas frecuentes), la barra de navegación superior y el pie de página, cuando se inspeccionan y navegan en los 4 anchos (`1440`, `1024`, `768`, `390` px), entonces todas las referencias y CTA apuntan a los flujos activos sin menciones a Workspace VFS, `.rar` ni comparador standalone de modelos, sin rutas muertas, sin desbordamiento horizontal y sin errores de consola o CSP.
- **C5:** Dada la ejecución completa de verificación del repositorio (`./scripts/check.sh`) con respuestas simuladas de GitHub (sin peticiones reales externas) y zonas blindadas intactas, entonces compilan tipos, build y las suites Node + Playwright cubriendo C1–C4 con cero fallos.

## Casos límite y errores
- **Archivo demasiado grande o binario:** si un archivo listado en **Archivos** supera el límite de previsualización (512 KB) o corresponde a una extensión binaria/ejecutable no textual, se informa con claridad sin bloquear el visor y manteniendo el enlace al archivo exacto en GitHub por `commitSha`.
- **Error de red o límite de API de GitHub (`rate_limit`):** la carga bajo demanda de un archivo o de la vista previa de `skills.sh` muestra mensaje claro en español con opción de reintento o inicio de sesión sin perder el contexto de la ficha.
- **Datos residuales de versiones anteriores en navegador:** la clave heredada `ai_skills_studio_workcopies_v1` deja de leerse o rehidratarse como copias activas; si el usuario cierra sesión o borra datos, también se limpia cualquier residuo local.
- **Enlaces o anclas antiguas en portada:** botones y enlaces del pie/cabecera/portada nunca redirigen a rutas retiradas (`estudio`, `modelos-ia`, `evidencias`) ni muestran vistas vacías o bloqueadas.

## Preguntas abiertas
- Ninguna: alcance, modelo de vista previa unificada desde `Explorar`, inspección y re-auditoría bajo demanda en `FilesPanel`, reemplazo de pruebas heredadas y preservación intacta de zonas blindadas aprobados por el usuario el 2026-11-24.
