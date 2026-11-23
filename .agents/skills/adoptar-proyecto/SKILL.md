---
name: adoptar-proyecto
description: Úsala cuando el harness se acaba de instalar en un proyecto que ya existe (con código, lenguajes y frameworks propios). Analiza el código, rellena docs/, AGENTS.md y los comandos con lo que encuentra, y entrevista al usuario solo sobre lo que no se puede deducir, incluido qué falta implementar.
---

# Adoptar el harness en un proyecto existente

Objetivo: que `AGENTS.md` y `docs/` describan **este** proyecto real, y que la memoria (`features.json`, `TASKS.md`) refleje lo que falta por hacer.

Principios:
- **Lee antes de preguntar.** No preguntes nada que puedas averiguar leyendo el código, la configuración o el historial de git.
- **No muevas ni reescribas el código del proyecto.** El harness se adapta al proyecto, no al revés. Si las carpetas no son `apps/web` y `apps/api`, cambia el mapa, no las carpetas.
- **Trabaja en la rama `chore/adoptar-harness`.**
- Muestra al usuario lo que dedujiste para que lo confirme o lo corrija.

## Fase 1 · Exploración (sin preguntar)
Revisa y toma nota:
1. **Estructura:** árbol de carpetas a 2–3 niveles, ignorando dependencias y builds. ¿Monorepo, una sola app, repos separados?
2. **Lenguajes y frameworks:** `package.json`, `pnpm-workspace.yaml`, `pyproject.toml`, `requirements*.txt`, `pom.xml`, `build.gradle`, `*.csproj`, `go.mod`, `composer.json`, `Gemfile`, etc. Anota las versiones.
3. **Comandos reales:** scripts de `package.json`, `Makefile`, `justfile`, `docker-compose*`, `README`.
4. **Calidad:** configuración de linter, formateador y tipos (`eslint`, `prettier`, `biome`, `ruff`, `mypy`, `tsconfig`…).
5. **Pruebas:** herramientas (`jest`, `vitest`, `pytest`, `playwright`, `cypress`…), dónde están, cuántas hay y si pasan.
6. **Datos:** base de datos, ORM, carpeta de migraciones y variables de entorno usadas (nombres, nunca valores; no leas `.env`).
7. **CI/CD y despliegue:** `.github/workflows/`, `vercel.json`, `Dockerfile`…
8. **Convenciones observadas:** `git log --oneline -30` (estilo de commits y ramas) y patrones repetidos en el código (nombres, capas, manejo de errores).
9. **Instrucciones previas:** `CLAUDE.md`, `GEMINI.md`, `.cursorrules`, `.github/copilot-instructions.md` y cualquier `*.harness.*` que dejó el instalador.
10. **Señales de trabajo pendiente:** `TODO`/`FIXME` en el código, issues abiertos si `gh` está disponible y ramas sin fusionar.

## Fase 2 · Borrador automático
Con lo que encontraste, rellena:
- `docs/stack/frontend.md` y `docs/stack/backend.md`: tecnologías, versiones, comandos y estructura **real**. Si no hay backend o frontend, dilo en el archivo.
- `docs/project/ARCHITECTURE.md`: piezas reales, rutas reales y cómo se comunican.
- `AGENTS.md`: secciones «Estructura del repo», «Mapa de contexto» (con las rutas reales) y «Comandos». Mantenlo por debajo de 120 líneas.
- `scripts/check.sh`: las variables de comandos. **Ejecútalo** y comprueba que cada comando funciona. Si algo falla por un problema previo del proyecto, no lo arregles ahora: anótalo en `TASKS.md`.
- `init.sh`: instalación de dependencias, servicios y migraciones reales.
- `.env.example`: los nombres de las variables encontradas.
- `docs/rules/*.md`: añade las convenciones **observadas** en el código, marcadas como «(observado)» para que el usuario las confirme.
- Los `AGENTS.md` locales de `apps/web` y `apps/api`: muévelos a las carpetas reales del frontend y del backend, o bórralos si no aplican.

Después, presenta al usuario un resumen corto: «Esto es lo que entendí del proyecto» (stack, estructura, comandos, estado de las pruebas y convenciones observadas).

## Fase 3 · Entrevista (solo lo que el código no dice)
Pregunta en rondas de 3–4 preguntas como máximo. Usa una herramienta de preguntas con opciones si la tienes.

**Ronda 1 · Producto**
- ¿Qué problema resuelve y para quién?
- ¿En qué estado está: prototipo, MVP o producción con usuarios?
- ¿Hay algo que no se deba tocar (módulos heredados, integraciones delicadas)?

**Ronda 2 · Lo que falta implementar**
- ¿Qué funcionalidades faltan o están a medias? Lista las que dedujiste de TODOs, issues y ramas, y pide que confirme, añada o descarte.
- ¿En qué orden de prioridad?
- ¿Hay bugs conocidos?

**Ronda 3 · Reglas y calidad**
- ¿Confirmas las convenciones observadas? ¿Quieres cambiar alguna?
- ¿Qué cobertura de pruebas esperas? ¿Faltan tipos de prueba (integración, E2E)?
- ¿Hay requisitos de seguridad o de datos especiales?

**Ronda 4 · Materiales**
- ¿Tienes guías, documentación o ejemplos que quieras en `docs/references/`?
- ¿Quieres instalar skills de buenas prácticas para el stack? Sugiere las adecuadas.

## Fase 4 · Memoria del proyecto
- `docs/project/PROJECT.md`: con las respuestas de la ronda 1.
- `docs/features.json`: borra la funcionalidad de ejemplo y añade cada funcionalidad pendiente con estado `pendiente`. Si hay funcionalidades existentes importantes, añádelas con estado `hecho` para tener el mapa completo.
- Por cada funcionalidad prioritaria, crea solo la carpeta `docs/specs/NNN-nombre/`. La spec se escribe después con `spec-plan-code`.
- `docs/TASKS.md`: bugs, deuda técnica y verificaciones que no pasan.

## Fase 5 · Limpieza y cierre
1. **Instrucciones previas:** pasa el contenido útil de `CLAUDE.md`, `GEMINI.md` y similares a `AGENTS.md` o `docs/rules/`. Después **pide permiso** para borrarlos: mientras exista un `CLAUDE.md`, Claude Code ignora `AGENTS.md`.
2. **Archivos `*.harness.*`:** fusiónalos con los originales (pidiendo confirmación cuando haya conflicto) y bórralos.
3. Escribe el ADR `docs/decisions/0002-adopcion-del-harness.md` con el estado en el que se encontró el proyecto y las decisiones tomadas.
4. Ejecuta `./scripts/check.sh` y anota el resultado.
5. Añade la primera entrada real a `docs/PROGRESS.md`.
6. Haz commit y abre un PR con el resumen. Sugiere la siguiente funcionalidad prioritaria para empezar con `spec-plan-code`.
