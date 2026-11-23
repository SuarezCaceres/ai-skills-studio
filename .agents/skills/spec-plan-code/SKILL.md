---
name: spec-plan-code
description: Úsala para cualquier funcionalidad nueva o cambio grande en ai-skills-studio. Guía el flujo spec → plan → código → revisión con aprobación humana entre fases, contratos previos, pruebas por criterio y cierre con el estándar de PR de 5 secciones.
---

# Flujo spec → plan → código (`ai-skills-studio`)

## Fase 1 · Spec (qué y por qué)
1. Busca el siguiente identificador libre `NNN` en `docs/features.json`.
2. Copia `docs/specs/_plantilla/` a `docs/specs/NNN-nombre/`.
3. Redacta `spec.md`. Si algún requisito o borde funcional no se deduce del código existente, **pregunta al humano** antes de asumirlo.
4. Define criterios de aceptación concretos y verificables mediante pruebas automatizadas en `scripts/test-*.mjs`.
5. Registra la funcionalidad en `docs/features.json` con estado `spec` y todos sus criterios en `pasa: false`.
6. **Detente y solicita la aprobación explícita de `spec.md`.** No avances a Fase 2 sin un «sí» del humano.

## Fase 2 · Plan (cómo)
1. Lee `docs/project/ARCHITECTURE.md`, `docs/stack/*` y los archivos de `docs/rules/` de las capas involucradas (`src/`, `api/`, `scripts/`).
2. Rellena `plan.md` especificando:
   - contratos de tipos a crear o modificar en `src/types/*` (y rutas en `src/App.tsx` si aplica);
   - archivos afectados por módulo y si se ejecutará de forma secuencial o en paralelo con `orquestador-general`;
   - qué script de prueba (`scripts/test-*.mjs`) cubrirá cada criterio de aceptación;
   - pasos pequeños y verificables.
3. Señala explícitamente si se requiere añadir una dependencia en `package.json`, modificar `api/github-oauth.ts` o tocar `docs/rules/` (requieren autorización explícita).
4. Actualiza el estado en `docs/features.json` a `plan`.
5. **Detente y solicita la aprobación explícita de `plan.md`.**

## Fase 3 · Código
1. Crea o sitúate en la rama `feat/NNN-nombre` y actualiza el estado en `docs/features.json` a `en_curso`.
2. **Si el plan abarca múltiples áreas independientes:** usa la skill `orquestador-general`:
   - fija y verifica primero de forma secuencial los contratos compartidos en `src/types/*` y `src/App.tsx` con `npx tsc -b`;
   - despacha subagentes (o worktrees `feat/wt<N>-<modulo>`) asignando listas de archivos estrictamente disjuntas.
3. Implementa siguiendo las skills de especialidad:
   - `frontend-proyecto` para `src/components/`, `src/hooks/`, `src/data/` y `src/index.css`;
   - `backend-proyecto` para `api/github-oauth.ts` y `src/services/`;
   - `pruebas-proyecto` para `scripts/test-*.mjs` y `scripts/lib/` (sin tráfico a `api.github.com` ni `youtube.com` reales).
4. Verifica cada paso con `./scripts/check.sh --rapido` y realiza commits atómicos siguiendo Conventional Commits (`.agents/skills/github-workflow-standards/SKILL.md`).
5. Si durante la implementación descubres que el plan aprobado necesita cambiar, detente, explica el desvío al humano y actualiza `plan.md` antes de continuar.

## Fase 4 · Revisión y cierre
1. Ejecuta `./scripts/check.sh` completo (tipos, unitarias, servicios y E2E Playwright).
2. Ejecuta una auditoría independiente con la skill `revisor` (preferiblemente en un subagente limpio) y corrige cualquier hallazgo bloqueante.
3. En `docs/features.json`, cambia `pasa: true` **únicamente** en los criterios cuya prueba automatizada pasa de verdad, y actualiza el estado a `revision`.
4. Actualiza `docs/TASKS.md` y añade la entrada de cierre de sesión en `docs/PROGRESS.md`.
5. Abre el Pull Request hacia `testing` (o hacia la rama base que indique el humano) redactando las **5 secciones obligatorias** de `.agents/skills/github-workflow-standards/SKILL.md`, enlazando `docs/specs/NNN-nombre/spec.md` y detallando qué prueba cubre cada criterio.
6. Una vez que el humano integre el PR, actualiza el estado en `docs/features.json` a `hecho`.
