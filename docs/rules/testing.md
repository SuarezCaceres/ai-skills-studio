# Reglas de pruebas

Estas reglas son obligatorias y mandan sobre cualquier skill de pruebas de terceros. Ningún cambio funcional o corrección de bug se considera terminado sin pruebas automatizadas verdes ejecutadas por `./scripts/check.sh`.

## Niveles reales de pruebas en `scripts/`
| Nivel | Entorno de ejecución | Qué valida | Suites en `scripts/` |
|---|---|---|---|
| **Unitarias** | Node puro (sin navegador ni servidor) | Lógica pura, validadores, saneadores, traducción, instalación y almacenes de estado | `test-catalog-install-translate.mjs`, `test-lessons-store.mjs`, `test-lesson-sharing.mjs`, `test-component-assignments.mjs` |
| **Integración de servicios** | Node + máquina de estado GitHub en memoria | Flujos completos de subida local, edición, conflictos por SHA, sincronización y clases compartidas | `test-skill-upload.mjs`, `test-lesson-sharing-service.mjs` |
| **E2E e interfaz** | Playwright + `vite preview` + Chromium real | Recorridos completos de usuario, accesibilidad y diseño multi-ancho (`1440`, `1024`, `768`, `390`) con red interceptada | `test-interfaces-playwright.mjs`, `test-interactions-playwright.mjs`, `test-catalog-integration.mjs`, `test-components-page.mjs`, `test-components-assign.mjs`, `test-lessons.mjs`, `test-lessons-share.mjs` |

- Las capturas diagnósticas generadas por Playwright se guardan únicamente de forma temporal en `shots/` (directorio ignorado por Git; nunca commitear capturas de ejecución).
- Toda funcionalidad nueva debe incluir pruebas unitarias para sus reglas puras, pruebas de servicio si toca integración con el catálogo/GitHub y al menos una prueba E2E por cada criterio de aceptación visible para la persona usuaria.
- Todo bug corregido debe ir acompañado de una prueba que fallaba antes del arreglo.

## Regla inquebrantable de aislamiento de red
- **NINGUNA prueba automatizada puede realizar peticiones reales a `api.github.com`, `github.com`, `youtube.com` (`youtube-nocookie.com`) ni `generativelanguage.googleapis.com`.**
- Usa siempre los simuladores locales deterministas del repositorio:
  - `scripts/lib/github-fixture.mjs` (`installFakeGithub`) para interceptar catálogo, OAuth, avatares y API de GitHub en contextos de Playwright.
  - `scripts/lib/fake-github-classes.mjs` (`createFakeGithubClasses` y `createFakeFetch`) para pruebas de servicios en Node y flujos con estado de repositorios, commits e Issues.
- **Aislamiento de caché entre casos:** cuando pruebes servicios que mantienen caché en memoria o en módulo (`githubCatalogService`, sesiones en `githubAuthService`), cada caso debe usar su propia cuenta/repositorio simulado o reiniciar explícitamente el estado para no contaminar pruebas posteriores ni depender del orden de ejecución.

## Cómo escribir las pruebas
- Estructura clara **AAA (Arrange, Act, Assert)**: prepara el escenario, ejecuta la acción observable y verifica el resultado concreto.
- Nombres descriptivos en español o inglés consistente que expresen la regla de negocio verificada (p. ej. `rechaza subida cuando detecta clave privada`, nunca `test2`).
- Evalúa el comportamiento observable (DOM accesible, llamadas recibidas por el fixture de GitHub, estado persistido), no detalles internos de implementación.

## Prohibiciones absolutas
- **Prohibido** borrar, comentar, saltar (`skip`) o debilitar aserciones para lograr que `./scripts/check.sh` o `npm test` pasen. Si una prueba existente contradice un requisito nuevo aprobado, explícalo primero y pide confirmación.
- **Prohibido** declarar una tarea como terminada sin haber ejecutado `./scripts/check.sh` (o sin informar explícitamente qué impidió correrlo).
- **Prohibido** escribir pruebas superficiales que únicamente comprueben «que no lanza error» sin verificar el estado o salida resultante.

## Pruebas inestables (flaky)
- Si una prueba falla de manera intermitente (tiempos de hidratación, animaciones o portales), no la reintentes hasta que pase por azar: corrige la espera determinista sobre el estado visible o regístrala en `docs/TASKS.md` avisando al equipo.

## Lecciones aprendidas
- 2026-11 · Fugas de red cuando existe `.env.local` durante el build de pruebas → Vite incrusta variables `VITE_*` presentes en `.env.local`; toda suite Playwright debe instalar `installFakeGithub` o interceptar orígenes externos antes de `page.goto()` para jamás contactar `api.github.com` real.
- 2026-11 · Pruebas deterministas de traducción nativa y vídeos embebidos en Chromium → Simular `window.Translator` mediante `context.addInitScript()` y bloquear la carga externa de `youtube-nocookie.com` comprobando en el DOM los atributos seguros del `<iframe>`.
