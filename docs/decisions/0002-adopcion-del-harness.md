# ADR 0002 · Adopción del harness e incorporación del Orquestador General

- **Fecha:** 2026-11-23
- **Estado:** aceptada

## Contexto
`ai-skills-studio` (Códice Studio `v2.2.2`) creció con múltiples módulos en producción (Workspace VFS, Catálogo sobre GitHub, Kit de 20 componentes UI y Clases con videos y pestaña Comunidad) usando `memories.md` (295 líneas), briefs sueltos `docs/agents/WT*.md` y una prueba de `CLAUDE.md` en otra rama (`chore/claude-init`). Cargar un único documento largo en cada sesión consume ventana de contexto, duplica reglas entre Claude Code y Antigravity CLI, y carecía de un sensor unificado pre-commit rápido frente a las 13 suites de prueba.

## Decisión
1. **Índice corto + divulgación progresiva:** Adoptar `AGENTS.md` (`< 120` líneas) como índice único y trasladar el contexto de producto, arquitectura, stack y reglas a `docs/{project,stack,rules,references}/`.
2. **Transición limpia de `memories.md`:** Convertir `memories.md` en un puntero corto hacia `AGENTS.md` y `docs/`, manteniendo intactos los enlaces existentes y la obligatoriedad del estándar de commits y PR de 5 secciones (`github-workflow-standards`).
3. **Adaptación sin mover el código:** Conservar la estructura real (`src/`, `public/assets/`, `api/github-oauth.ts`, `scripts/`) en lugar de forzar `apps/web` y `apps/api`, añadiendo punteros locales `src/AGENTS.md` y `api/AGENTS.md`.
4. **Rol permanente `orquestador-general`:** Crear `.agents/skills/orquestador-general/SKILL.md` para dividir trabajos complejos en fases, fijar contratos primero (`src/types/*`, `src/App.tsx`) y delegar subagentes con propiedad disjunta de archivos (*Zero-Conflict*).
5. **Sensores en dos velocidades y soporte Windows:** Configurar `scripts/check.sh --rapido` con `tsc -b` + las 6 suites Node puras (~8 s en `pre-commit`) y `scripts/check.sh` completo sumando `npm run build` + las 7 suites Playwright E2E, sin instalar paquetes nuevos. En Windows, `init.sh` crea una **Junction NTFS** (`.claude/skills -> .agents/skills`) y `.gitattributes` fuerza `LF` en `*.sh` y `.githooks/*`.

## Alternativas consideradas
- **Reestructurar el repositorio a `apps/web` y `apps/api`:** Descartado; rompería rutas de Vite, pipelines de GitHub/GitLab Pages, Vercel y el historial de ramas activas sin aportar valor real.
- **Mantener `memories.md` completo en paralelo con `docs/`:** Descartado; provocaría deriva inmediata entre dos fuentes de verdad.
- **Ejecutar las 13 suites (incluido Playwright) en cada `pre-commit`:** Descartado; compilar y abrir Chromium 7 veces en cada commit ralentiza el trabajo atómico. Queda reservado para `./scripts/check.sh` completo antes de cerrar/abrir PR.

## Consecuencias
- Todo agente (Claude Code o Antigravity) lee las mismas reglas y skills desde `.agents/skills/` y `AGENTS.md`.
- Las próximas funcionalidades (`001-equipos-y-miembros` y `002-skills-de-equipo`, derivadas de `docs/plans/PLAN_EQUIPOS.md`) seguirán el flujo `spec-plan-code` coordinado por `orquestador-general`.
- Queda registrado en `docs/TASKS.md` evaluar más adelante un linter ligero (Biome/ESLint) para activar `LINT_CMD`.
