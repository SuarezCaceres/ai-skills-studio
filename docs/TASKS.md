# Tareas

> El agente lee este archivo al empezar cada sesión y lo actualiza al terminar.
> Las funcionalidades completas viven en `docs/features.json`; aquí van tareas operativas, deuda técnica y pasos manuales.

## En curso
- [ ] **005 · Guía vs. sin guía en la portada (`feat/005-guia-vs-sin-guia`, worktree `ai-skills-studio-005`):** Fases 0–3 hechas (contratos, 3 worktrees `feat/wt{1,2,3}-guia-*`, integración y docs); `test-guide-showcase.mjs` en verde (210/210); revisión independiente hecha y hallazgos aplicados. C6 dividido (decisión del humano): C6a pasa y C6b (chunk inicial < 350 kB) queda abierto hasta pagar la deuda del bundle. Falta abrir el PR tras integrar la 004. Se basa en la punta commiteada de la 004 (`9f7580d`): integrar después de la 004 o rebasar sobre `main` · agente + humano

## Pendiente
- [ ] **🔴 PRIORIDAD ALTA · Remediar auditoría de seguridad (`security-audit`, run-1, perfil `quick`):** 8 hallazgos `needs_validation` verificados en código + 2 brechas diferidas. Reporte: `reporte-auditoria-seguridad.md` (artefacto de la conversación) y `scratch/security-audit/ai-skills-studio/run-1/` (`REPORT.md`, `NEEDS-VALIDATION.md`, `findings.json`). Abrir rama `fix/security-hardening` vía `spec-plan-code`; varias correcciones tocan zonas blindadas (requieren autorización) · humano + agente
  - [ ] Excluir de `dist/assets/` los HTML generadores/lab sin CSP (`make-posters.html`, `make-fallbacks.html`, `make-still.html`, etc.) — brecha diferida prioritaria · `vite.config.ts` (zona blindada)
  - [ ] Path traversal en middleware dev `/assets/*` + `server.host: true` · `vite.config.ts` (zona blindada)
  - [ ] Atribución `authorLogin` no verificada + fallback `no_skill_md` que evade `AuditBadge` · `githubCatalogService.ts`
  - [ ] *Anchor squatting* (Issue más antiguo gana) · `githubCatalogService.ts` / `SkillDetailPage.tsx`
  - [ ] `code_verifier` PKCE obligatorio + atar `redirect_uri` al `Origin` + OAuth App separada para `localhost:5173` · `api/github-oauth.ts` (zona blindada) + Vercel
  - [ ] Cabeceras anti-framing en Pages (verificar cabeceras reales; `frame-ancestors` no aplica en `<meta>`) · `index.html` (zona blindada) / hosting
  - [ ] Borrado GDPR incompleto e inaccesible sin sesión · `securityHardening.ts` (zona blindada) / `App.tsx` / `NavbarActiveSkill.tsx`
  - [ ] Importación JSON de clases sobrescribe clases propias · `lessonsStore.ts`
  - [ ] Crash persistente por carpetas `constructor/` etc. + falta Error Boundary · `UnifiedProjectStudio.tsx:346` (ya retirado en `004`), `App.tsx`/`main.tsx`
  - [ ] Verificar en producción (solo lectura): `ALLOWED_ORIGINS` en Vercel, cabeceras HTTP de Pages y `codice-labeler.yml` · humano
  - [ ] Auditoría incremental de `feat/003-directorio-skills-sh` (`api/skills-sh.ts`, `skillsShService.ts`, `sync-skills-sh.yml`) · agente
- [ ] **Siguiente funcionalidad prioritaria (`001`):** Ejecutar la skill `spec-plan-code` para `001-equipos-y-miembros` (tomando como base las decisiones de `docs/plans/PLAN_EQUIPOS.md`, Fase 5) · agente + humano
- [ ] **Verificar alcance OAuth para equipos:** Comprobar con cuenta real de GitHub si el scope `public_repo` alcanza para invitar colaboradores, dar rol `admin` y aceptar invitaciones por API antes de cerrar el plan de `001-equipos-y-miembros` · humano + agente
- [ ] **Integración de ramas en curso:** Revisar/fusionar PR #21 (`feat/codice-mejoras-y-limpieza`) y `feat/codice-clases-compartidas` en `testing`/`main` · humano
- [ ] **Paso manual externo (repo catálogo):** Actualizar `.github/workflows/codice-labeler.yml` en `codice-skills-catalog` para admitir `kind: class` (y `kind: team` al implementar `001`), según `docs/catalog-setup.md` · humano
- [ ] **Calidad / Linter (`LINT_CMD`):** Evaluar si incorporar Biome o ESLint para activar `LINT_CMD` en `scripts/check.sh` (requiere aprobación antes de instalar dependencias; `api/github-oauth.ts` y `api/skills-sh.ts` ya están cubiertos en `TYPECHECK_CMD`) · humano + agente
- [ ] **Presupuesto de bundle inicial (`vendor-react`):** Ajustar `manualChunks` en `vite.config.ts` (zona blindada, requiere autorización) para incluir `react-dom` completo en `vendor-react` y devolver el chunk `index-*.js` por debajo de `350 kB` (deuda preexistente detectada en la auditoría de `003`) · humano + agente
- [ ] **Prueba intermitente (flaky) `Datepicker: Enter elige el día y cierra`** (`scripts/test-components-page.mjs:184`): falló 1 vez en `./scripts/check.sh` completo el 2026-11-27 (rama `004`, máquina con carga y otro worktree ejecutando pruebas) y pasó 3/3 aislada y en la ejecución completa siguiente. Sustituir la espera fija de 1,5 s por una espera determinista del estado visible del Datepicker (`src/components/ui-kit/`) · agente
- [ ] **Puertos fijos en suites Playwright (`5185`–`5190`):** ejecutar `check.sh` a la vez en varios worktrees provoca `Port ... is already in use` (visto con `5190` de `test-lessons.mjs`). Evaluar puertos libres dinámicos · agente
- [ ] **Limpieza de ramas antiguas:** Evaluar borrar la rama local/remota no fusionada `chore/claude-init` (su `CLAUDE.md` ya fue absorbido en `AGENTS.md` y `docs/`) · humano

## Bloqueado
<!-- - [ ] Descripción · por qué está bloqueado · qué se necesita -->

## Hecho
- [x] 2026-11-27 · **004 · Retiro de Workspace e inspección real de código (`feat/004-retiro-workspace-inspector-codigo`):** completadas Fases 0–4 (`C1`–`C5`: retiro de Workspace/`estudio`, `modelos-ia`, `evidencias`, `StylePresetCatalog`, `workingCopy`, `rarParserService` y 13 archivos obsoletos; inspector bajo demanda fijado a `commitSha` en `FilesPanel` con re-auditoría automática; vista previa de `skills.sh` en `SkillDetailPage`/`CatalogDetailRoute`; actualización de portada/navbar, suites Node + Playwright y documentación; auditorías `revisor` `APPROVE`, `teamwork_challenger` `CONFIRMED` y `teamwork_auditor` `CLEAN`; descripción local del PR de 5 secciones redactada)
- [x] 2026-11-26 · Confirmar despliegue en producción de `api/skills-sh.ts` compartiendo `ALLOWED_ORIGINS`, login GitHub PKCE (`OAuth App` `Ov23lii7kOK3ajmx8d1u`) en `https://codice-oauth.vercel.app/` + `http://localhost:5173/` y cron `.github/workflows/sync-skills-sh.yml` operativo en `main` (PRs #28, #29 y cierre `chore/cierre-skill-sh`)
- [x] 2026-11-23 · Instalar `harness-template` en `chore/adoptar-harness`, rellenar `AGENTS.md` + `docs/` + skills (incluida `orquestador-general`) y configurar sensores en `scripts/check.sh` e `init.sh`
