# Tareas

> El agente lee este archivo al empezar cada sesión y lo actualiza al terminar.
> Las funcionalidades completas viven en `docs/features.json`; aquí van tareas operativas, deuda técnica y pasos manuales.

## En curso
<!-- - [ ] Descripción · rama · responsable (humano / agente) -->

## Pendiente
- [ ] **Siguiente funcionalidad prioritaria (`001`):** Ejecutar la skill `spec-plan-code` para `001-equipos-y-miembros` (tomando como base las decisiones de `docs/plans/PLAN_EQUIPOS.md`, Fase 5) · agente + humano
- [ ] **Verificar alcance OAuth para equipos:** Comprobar con cuenta real de GitHub si el scope `public_repo` alcanza para invitar colaboradores, dar rol `admin` y aceptar invitaciones por API antes de cerrar el plan de `001-equipos-y-miembros` · humano + agente
- [ ] **Integración de ramas en curso:** Revisar/fusionar PR #21 (`feat/codice-mejoras-y-limpieza`) y `feat/codice-clases-compartidas` en `testing`/`main` · humano
- [ ] **Paso manual externo (repo catálogo):** Actualizar `.github/workflows/codice-labeler.yml` en `codice-skills-catalog` para admitir `kind: class` (y `kind: team` al implementar `001`), según `docs/catalog-setup.md` · humano
- [ ] **Calidad / Linter (`LINT_CMD`):** Evaluar si incorporar Biome o ESLint para activar `LINT_CMD` en `scripts/check.sh` (requiere aprobación antes de instalar dependencias; `api/github-oauth.ts` y `api/skills-sh.ts` ya están cubiertos en `TYPECHECK_CMD`) · humano + agente
- [ ] **Presupuesto de bundle inicial (`vendor-react`):** Ajustar `manualChunks` en `vite.config.ts` (zona blindada, requiere autorización) para incluir `react-dom` completo en `vendor-react` y devolver el chunk `index-*.js` por debajo de `350 kB` (deuda preexistente detectada en la auditoría de `003`) · humano + agente
- [ ] **Limpieza de ramas antiguas:** Evaluar borrar la rama local/remota no fusionada `chore/claude-init` (su `CLAUDE.md` ya fue absorbido en `AGENTS.md` y `docs/`) · humano

## Bloqueado
<!-- - [ ] Descripción · por qué está bloqueado · qué se necesita -->

## Hecho
- [x] 2026-11-26 · Confirmar despliegue en producción de `api/skills-sh.ts` compartiendo `ALLOWED_ORIGINS`, login GitHub PKCE (`OAuth App` `Ov23lii7kOK3ajmx8d1u`) en `https://codice-oauth.vercel.app/` + `http://localhost:5173/` y cron `.github/workflows/sync-skills-sh.yml` operativo en `main` (PRs #28, #29 y cierre `chore/cierre-skill-sh`)
- [x] 2026-11-23 · Instalar `harness-template` en `chore/adoptar-harness`, rellenar `AGENTS.md` + `docs/` + skills (incluida `orquestador-general`) y configurar sensores en `scripts/check.sh` e `init.sh`
