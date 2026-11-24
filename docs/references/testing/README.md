# Referencias de Pruebas (Testing)

> **Cuándo consultar este índice:** al escribir o depurar pruebas de servicios en Node o pruebas E2E de interfaz con Playwright, o cuando necesites simular `api.github.com` y el flujo OAuth sin tocar la red real.

Las normas obligatorias de verificación viven en `docs/rules/testing.md`. Nunca golpees `api.github.com` real desde pruebas automatizadas (la cuota anónima es de 60 peticiones/hora por IP).

## Fixtures y ejemplos canónicos en el repositorio

1. **Fixture de red para Playwright — [`scripts/lib/github-fixture.mjs`](../../../scripts/lib/github-fixture.mjs)**
   - Exporta `installFakeGithub(context, options)` junto con constantes de prueba (`TEST_CATALOG_REPO`, `TEST_CLIENT_ID`, `TEST_OAUTH_URL`, `TEAM_LOGIN`).
   - Intercepta en el contexto del navegador las peticiones a `api.github.com`, avatares de GitHub y el endpoint OAuth simulado (`api/github-oauth`), exponiendo cabeceras CORS reales (`x-ratelimit-remaining`, `x-ratelimit-reset`, `retry-after`).
   - Con `{ classes: true }`, conecta y devuelve la máquina de estado completa de `fake-github-classes.mjs`.

2. **Máquina de estado pura de GitHub — [`scripts/lib/fake-github-classes.mjs`](../../../scripts/lib/fake-github-classes.mjs)**
   - Exporta `createFakeGithubClasses(options)` y `createFakeFetch(machine)` para reutilizar exactamente el mismo simulador tanto en Node puro (`fetch` simulado) como en Playwright.
   - Modela en memoria repositorios, objetos Git (`blobs`, `trees`, `commits`, `refs`), contenidos crudos, Issues del catálogo, el etiquetado automático del workflow `codice-labeler` y reglas de inyección de fallos (`401`, `403` por *rate limit*, `404`, `5xx` o corte de red), además de contabilizar llamadas.

3. **Ejemplo canónico de prueba rápida en Node puro — [`scripts/test-skill-upload.mjs`](../../../scripts/test-skill-upload.mjs)**
   - Patrón recomendado para probar lógica de dominio y servicios TypeScript en milisegundos sin levantar Vite ni Chromium: empaqueta los módulos `.ts` requeridos en un directorio temporal con `esbuild`, define `import.meta.env` de prueba y ejecuta aserciones con `node:assert/strict` contra un GitHub en memoria.
   - Otros ejemplos del mismo estilo: [`scripts/test-lesson-sharing-service.mjs`](../../../scripts/test-lesson-sharing-service.mjs) y [`scripts/test-lessons-store.mjs`](../../../scripts/test-lessons-store.mjs).

4. **Ejemplo canónico de prueba E2E con Playwright — [`scripts/test-lessons-share.mjs`](../../../scripts/test-lessons-share.mjs)**
   - Patrón completo de extremo a extremo: compila la app (`viteBuild`), levanta `preview` en un puerto aislado, instala `installFakeGithub(context, { classes: true })` en Chromium *headless*, siembra datos (incluido Markdown hostil con `<script>` / `onerror` para verificar sanitización anti-XSS) y valida tanto la interfaz como los commits e Issues resultantes en la máquina de estado.
   - Para pruebas de regresión visual, contraste y ausencia de desbordamiento en los 4 anchos (`1440`, `1024`, `768`, `390`), consulta [`scripts/test-interfaces-playwright.mjs`](../../../scripts/test-interfaces-playwright.mjs).
