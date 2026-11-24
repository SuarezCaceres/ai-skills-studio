# Progreso

> Bitácora entre sesiones. Cada sesión **añade** una entrada al principio (la más reciente arriba).
> Su objetivo es que la siguiente sesión, que no recuerda nada, sepa dónde retomar.

<!-- Formato:
## AAAA-MM-DD · agente (Claude Code / Antigravity) · rama
- **Hecho:** qué se completó (con referencia a commits o PR)
- **Verificación:** resultado de ./scripts/check.sh
- **Pendiente:** qué queda y el siguiente paso concreto
- **Problemas:** errores, dudas o decisiones que necesitan al humano
-->

## 2026-11-23 · Antigravity (`Orquestador General`) · `fix/github-pages-artifact-v4`
- **Hecho:** Actualización de `actions/upload-pages-artifact@v3` a `@v4` en `.github/workflows/deploy.yml` (con aprobación humana) para restaurar el despliegue automático a GitHub Pages tras el retiro de `upload-artifact@v3`.
- **Verificación:** `./scripts/check.sh --rapido` en `pre-commit` y workflow `Deploy to GitHub Pages` en `main`.
- **Pendiente:** Iniciar `001-equipos-y-miembros` con `spec-plan-code` y actualizar manualmente `codice-labeler.yml` en el repo catálogo.
- **Problemas:** Ninguno.

## 2026-11-23 · Antigravity (`Orquestador General`) · `chore/adoptar-harness`
- **Hecho:**
  - Instalación de `SuarezCaceres/harness-template` sobre la rama `chore/adoptar-harness` (partiendo de `feat/codice-clases-compartidas`, `27018b4`) sin conflictos con el código existente.
  - Entrevista de alineación con el usuario y despacho en paralelo de 4 subagentes especialistas con propiedad disjunta de archivos:
    1. Producto, arquitectura real (`src/`, `public/assets/`, `api/github-oauth.ts`), stack y referencias (`docs/project/*`, `docs/stack/*`, `docs/references/*`).
    2. Reglas obligatorias de Git/PR de 5 secciones, identidad visual `tasteskill 2.5.1`, fronteras de API GitHub, aislamiento de red en pruebas y seguridad (`docs/rules/*`).
    3. Sensores en dos velocidades (`scripts/check.sh --rapido` vs completo), `init.sh` con Junction NTFS en Windows para `.claude/skills`, `.gitattributes` (`LF`), `.env.example` y limpieza de `.gitignore`.
    4. Creación de `.agents/skills/orquestador-general/SKILL.md`, adaptación de las skills del harness a rutas reales y punteros `src/AGENTS.md` y `api/AGENTS.md`.
  - Redacción de `AGENTS.md` (`< 120` líneas), conversión de `memories.md` en puntero canónico, carga de funcionalidades hechas (`H01`–`H04`) y pendientes (`001-equipos-y-miembros`, `002-skills-de-equipo`) en `docs/features.json`, `docs/TASKS.md` y `docs/decisions/0002-adopcion-del-harness.md`.
- **Verificación:** Auditoría independiente (`revisor`) superada y corregidos todos sus hallazgos (`.claude/worktrees/` en `.gitignore`, bloqueo de `.env.local` y `HEAD:main` en `guard.sh`, permisos `.env.example` en `.claude/settings.json` y chequeo de tipos de `api/github-oauth.ts` en `check.sh`). `./init.sh` idempotente en verde y `./scripts/check.sh --rapido` en **`exit 0`** (`tsc -b` + `api/github-oauth.ts` + 6 suites Node / 192 aserciones en verde; único aviso esperado: `Lint: sin configurar`).
- **Pendiente:**
  - Siguiente paso de desarrollo: iniciar `001-equipos-y-miembros` usando las skills `orquestador-general` + `spec-plan-code` a partir de `docs/plans/PLAN_EQUIPOS.md`.
  - Pasos manuales externos del dueño: actualizar `codice-labeler.yml` en el repo catálogo para `kind: class` y comprobar permisos de `public_repo` para invitaciones de equipos.
- **Problemas:** Sin `LINT_CMD` activo por decisión explícita de no añadir paquetes nuevos en esta rama (registrado en `docs/TASKS.md`).
