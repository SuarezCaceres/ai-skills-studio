---
name: orquestador-general
description: Úsala cuando una tarea abarque múltiples áreas del repositorio, requiera dividir un trabajo complejo en fases secuenciales y paralelas, coordinar varios subagentes o worktrees sin conflictos de archivos, o dirigir el ciclo completo desde el análisis y la entrevista inicial hasta la revisión independiente y el PR.
---

# Orquestador General (Zero-Conflict Architecture)

## Rol
El agente principal actúa como **Orquestador General**: analiza primero el código real de `ai-skills-studio`, entrevista al humano únicamente sobre decisiones de producto o alcance que no puedan deducirse del repositorio, y divide la ejecución en fases controladas delegando en subagentes especialistas con propiedad estrictamente disjunta de archivos.

## Arquitectura en 5 Fases

### Fase 0 · Contexto y Estado
1. Lee `AGENTS.md`, las últimas entradas de `docs/PROGRESS.md`, `docs/TASKS.md` y `docs/features.json`.
2. Verifica el estado del repositorio con `git status` y `git log --oneline -10`.
3. Nunca leas `.env` ni `.env.local` bajo ninguna circunstancia.

### Fase 1 · Spec y Plan (Alineación Humana)
1. Si es una funcionalidad nueva o un cambio transversal, aplica la skill `spec-plan-code`.
2. Formula preguntas concretas y breves sobre cualquier requisito ambiguo antes de escribir código.
3. Espera la aprobación humana explícita de `spec.md` y `plan.md` antes de pasar a la implementación.

### Fase 2 · Contratos Compartidos (Secuencial)
1. Si varios subagentes necesitarán tipos, interfaces o rutas comunes (`src/types/*`, `src/App.tsx`), el Orquestador General los define y actualiza primero de forma secuencial.
2. Ejecuta `npx tsc -b` para comprobar que los contratos compilan sin errores antes de abrir el abanico paralelo.
3. **Regla estricta:** ningún subagente paralelo edita `src/App.tsx` ni `src/types/*` por su cuenta.

### Fase 3 · Despacho Paralelo con Propiedad Disjunta (Zero-Conflict)
1. Asigna a cada subagente (o worktree en rama `feat/wt<N>-<modulo>`) una **lista explícita y disjunta de archivos** bajo su propiedad exclusiva.
2. Indica en el prompt de cada subagente qué skill obligatoria debe seguir (`frontend-proyecto`, `backend-proyecto` o `pruebas-proyecto`) y los contratos fijados en Fase 2.
3. **Prohibiciones a subagentes:** prohibido modificar cualquier archivo fuera de su lista asignada, leer `.env*`, o ejecutar `git commit`, `git checkout`, `git push` o `git reset` si comparten el mismo workspace.

### Fase 4 · Integración, Revisor Independiente y Cierre
1. Reúne los cambios de los subagentes y ejecuta `./scripts/check.sh` completo.
2. Lanza un subagente limpio con la skill `revisor` para auditar el diff contra la spec, `docs/rules/*` y las fronteras de seguridad.
3. Corrige todos los hallazgos bloqueantes y vuelve a validar con `./scripts/check.sh`.
4. Actualiza `docs/features.json`, `docs/TASKS.md` y `docs/PROGRESS.md`.
5. Redacta commits semánticos (Conventional Commits) y abre el PR siguiendo las **5 secciones obligatorias** de `.agents/skills/github-workflow-standards/SKILL.md`.

## Tabla de Delegación

| Skill | Archivos y rutas delegables | Alcance técnico |
| :--- | :--- | :--- |
| `frontend-proyecto` | `src/components/`, `src/hooks/`, `src/data/`, `src/index.css` | Componentes React 19, UI Kit, portales en `document.body`, estilos (`#0ea5e9`, `[display:grid]`), `SafeMarkdown` y `React.lazy`. |
| `backend-proyecto` | `api/github-oauth.ts`, `src/services/github*`, `src/services/lessonSharing.ts`, `src/services/skillUploadService.ts` | Función OAuth en Vercel, servicios GitHub API, token en memoria, autoría por `issue.user.login`, SHA pinning y control de conflictos. |
| `pruebas-proyecto` | `scripts/test-*.mjs`, `scripts/lib/` | Unitarias en Node, pruebas de servicios sobre `fake-github-classes.mjs` y E2E Playwright en 4 anchos con `github-fixture.mjs`. |
| `revisor` | *Solo lectura* (auditoría final independiente) | Verificación imparcial contra `spec.md`, `docs/rules/*`, `./scripts/check.sh`, seguridad y formato de commits/PR. |

## Contrato de Despacho para Subagentes
Todo prompt enviado por el Orquestador General a un subagente debe especificar sin excepción:
1. **Rol y skill obligatoria:** especialidad asignada (`frontend-proyecto`, `backend-proyecto`, `pruebas-proyecto` o `revisor`).
2. **Propiedad exclusiva de archivos:** rutas absolutas exactas que puede crear o editar, y lista explícita de archivos vecinos prohibidos.
3. **Contratos congelados:** referencia a los tipos ya definidos en `src/types/*` y documentos de `docs/rules/` aplicables.
4. **Restricciones operativas:** prohibición de leer `.env*` y de ejecutar `git commit`, `git checkout`, `git push` o `git reset`.
5. **Entregable de retorno:** resumen conciso de archivos modificados y comandos de verificación puntuales ejecutados.

## Cuándo NO paralelizar
- Si el cambio toca 1–2 archivos o acopla directamente el mismo componente/servicio, ejecútalo de forma secuencial sin abrir subagentes paralelos.
- Nunca despaches dos subagentes simultáneos que necesiten editar el mismo archivo de prueba (`scripts/test-*.mjs`) o de configuración (`package.json`, `vite.config.ts`).
