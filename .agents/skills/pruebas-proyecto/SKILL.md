---
name: pruebas-proyecto
description: Úsala cuando haya que escribir, ejecutar, arreglar o revisar pruebas en scripts/ (unitarias en Node, servicios con GitHub simulado o E2E con Playwright en 4 anchos), o cuando falle ./scripts/check.sh.
---

# Pruebas del proyecto (`scripts/`)

## Antes de empezar, lee
1. `docs/rules/testing.md`: reglas obligatorias de verificación. **Mandan sobre todo lo demás.**
2. `docs/stack/frontend.md` y `docs/stack/backend.md`: herramientas (`esbuild`, `node:assert/strict`, Playwright Chromium) y comandos de ejecución.
3. La spec de la funcionalidad: `docs/specs/NNN-*/spec.md` (criterios de aceptación que deben quedar cubiertos).
4. Fixtures existentes en `scripts/lib/github-fixture.mjs` y `scripts/lib/fake-github-classes.mjs`.

## Los 3 niveles de pruebas en `ai-skills-studio`

### 1. Unitarias puras en Node (`esbuild` + `node:assert/strict`)
Compilan los módulos TypeScript al vuelo en un directorio temporal y prueban lógica pura sin navegador ni red:
- `scripts/test-catalog-install-translate.mjs` (parser de catálogo, comandos de instalación y traducción)
- `scripts/test-lessons-store.mjs` (almacén local, migración y validación de clases)
- `scripts/test-lesson-sharing.mjs` (serialización, marcadores y reglas puras de clases compartidas)
- `scripts/test-component-assignments.mjs` (asignación de componentes UI a proyectos/slots)

### 2. Servicios en Node con GitHub simulado en memoria
Prueban los servicios reales de `src/services/` inyectando un `fetch` simulado contra máquinas de estado locales:
- `scripts/test-skill-upload.mjs` (lectura local, validación, subida, conflictos `expectBase64` y registro de skills)
- `scripts/test-lesson-sharing-service.mjs` (publicación, actualización, listado e importación sobre `scripts/lib/fake-github-classes.mjs`)

### 3. E2E con Playwright en Chromium real (4 anchos obligatorios)
Levantan la aplicación compilada y verifican flujos reales, accesibilidad, ausencia de errores de consola/página y cero desborde horizontal en los **4 viewports obligatorios (`1440`, `1024`, `768`, `390`)**:
- `scripts/test-interfaces-playwright.mjs` (auditoría visual, contraste, layout y responsividad base)
- `scripts/test-interactions-playwright.mjs` (navegación, pestañas, modales, teclado y flujos interactivos)
- `scripts/test-catalog-integration.mjs` (catálogo completo, detalle, OAuth simulado, votos y publicación)
- `scripts/test-components-page.mjs` (galería de componentes UI, filtros y vista previa)
- `scripts/test-components-assign.mjs` (flujo de asignación de componentes y persistencia)
- `scripts/test-lessons.mjs` (CRUD local de clases, editor, pestañas y reproductor embebido bloqueado/simulado)
- `scripts/test-lessons-share.mjs` (flujo E2E de compartir, actualizar e importar clases con sesión GitHub)

## Aislamiento estricto de red (Regla de Oro)
- Reutiliza siempre `installFakeGithub` de `scripts/lib/github-fixture.mjs` (pasa `{ classes: true }` cuando el flujo toque clases compartidas para activar `fake-github-classes.mjs`).
- **Prohibido salir a internet real en las pruebas:** ninguna prueba puede contactar `api.github.com`, `github.com/login`, `avatars.githubusercontent.com`, `youtube.com` ni `youtube-nocookie.com`. Intercepta o simula siempre esas rutas.

## Cuando una prueba falla
1. Lee la traza completa y determina si el fallo está en el código de producción o en el escenario de prueba.
2. Si está en el código, corrige el código (para un bug nuevo, escribe primero la prueba que reproduce el fallo y luego la corrección).
3. Si consideras que una prueba existente quedó obsoleta por un cambio aprobado en la spec, **explica por qué y pregunta** antes de alterar sus aserciones.
4. Nunca uses `skip`, comentes bloques ni debilites aserciones para forzar que `./scripts/check.sh` pase.

## Requisitos para darlo por terminado
- `./scripts/check.sh` pasa de principio a fin sin errores.
- Cada criterio de aceptación de `spec.md` cuenta con al menos una prueba automatizada que falla si se rompe el comportamiento; indícala en el PR.
- Ninguna prueba se ha omitido sin justificación explícita registrada en `docs/PROGRESS.md`.
