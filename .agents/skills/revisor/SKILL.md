---
name: revisor
description: Úsala antes de abrir un PR, o cuando el usuario pida revisar cambios. Evalúa el trabajo contra la spec, las reglas, la seguridad, las pruebas y el estándar de GitHub como un revisor independiente que no escribió el código.
---

# Revisión independiente (`ai-skills-studio`)

Actúa como un auditor técnico imparcial que **no** escribió este código. Tu objetivo es detectar defectos funcionales, brechas de seguridad y violaciones de reglas antes de abrir el PR, no justificar la implementación. Siempre que sea posible, ejecuta esta skill en un subagente con contexto limpio.

## Entrada
- El diff completo frente a la rama base (`git diff testing...HEAD` o `git diff main...HEAD` según la rama destino del PR) y `git log` de la rama.
- La spec y el plan aprobados: `docs/specs/NNN-*/spec.md` y `docs/specs/NNN-*/plan.md`.
- Las reglas obligatorias aplicables: `docs/rules/general.md`, `docs/rules/frontend.md`, `docs/rules/backend.md`, `docs/rules/security.md` y `docs/rules/testing.md`.
- El estándar de entregas: `.agents/skills/github-workflow-standards/SKILL.md`.

## Lista de comprobación
1. **Spec y alcance:** ¿cada criterio de aceptación de `spec.md` está implementado por completo? ¿Se coló código o funcionalidad fuera del alcance aprobado?
2. **Pruebas reales y sin red externa:** ¿cada criterio tiene prueba en `scripts/test-*.mjs` que verifica el comportamiento real (incluidos los 4 anchos `1440, 1024, 768, 390` en E2E si hay UI)? ¿Se usó `github-fixture.mjs` sin tocar `api.github.com` ni `youtube.com` reales? ¿Se borró, omitió o debilitó alguna aserción existente?
3. **Verificación ejecutable:** ejecuta `./scripts/check.sh` (o `./scripts/check.sh --rapido` si el entorno impide correr E2E, **indicando explícitamente cuál ejecutaste y el resultado real obtenido**).
4. **Reglas de UI y arquitectura (`docs/rules/`):** ¿se respetan la paleta carbón + `#0ea5e9` (cero violeta, naranja o emojis), `[display:grid]` en lugar de `.grid`, portales en `document.body`, carga diferida con `React.lazy` (< 350 kB inicial) y miniaturas actualizadas si cambió `src/components/ui-kit/`?
5. **Fronteras de seguridad:**
   - Token OAuth exclusivamente en memoria (nunca en `localStorage`, `sessionStorage`, cookies ni URL).
   - CSP intacta y uso obligatorio de `SafeMarkdown` para todo Markdown externo.
   - Autoría verificada siempre por `issue.user.login` (jamás por datos dentro del marcador `codice:v1`) y lecturas fijadas a commit SHA.
   - CORS y validación de entrada estrictos en `api/github-oauth.ts`.
   - Ninguna lectura, exposición ni commit de `.env` o `.env.local`, y `public/assets/*` completamente intacto.
6. **Limpieza y memoria del proyecto:** ¿sin código muerto, `console.log` de depuración ni TODOs huérfanos? ¿Están actualizados `docs/features.json`, `docs/TASKS.md`, `docs/PROGRESS.md` y, si aplica, `ARCHITECTURE.md` o `docs/decisions/`?
7. **Estándar de GitHub:** ¿los commits cumplen Conventional Commits en imperativo y la descripción preparada para el PR contiene las **5 secciones reflexivas obligatorias** (`¿Qué es...?`, `¿Por qué se hizo/creó?`, `¿Para qué sirve?`, `¿Cómo está construido?`, `Checklist de Verificación / Pruebas & Validación`) de `.github/pull_request_template.md` y `.agents/skills/github-workflow-standards/SKILL.md`?

## Salida
Entrega un informe conciso dividido en tres niveles:
- **Bloqueante:** impide abrir o fusionar el PR; debe corregirse obligatoriamente.
- **Recomendado:** mejora importante de robustez, mantenibilidad o claridad.
- **Menor:** detalle opcional o sugerencia puntual.

Cita siempre `archivo:línea`, qué falla y qué regla o criterio vulnera. Si no hay hallazgos en ninguna categoría, decláralo explícitamente en una línea junto con el comando de verificación ejecutado. **No edites archivos durante la revisión:** entrega primero el informe.
