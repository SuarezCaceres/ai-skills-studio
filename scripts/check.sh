#!/usr/bin/env bash
# Sensor principal del harness: lint + tipos + pruebas.
# Uso:  ./scripts/check.sh            → verificación completa
#       ./scripts/check.sh --rapido   → sin E2E (lo usa el hook pre-commit)
# Sale con código distinto de 0 si algo falla.
set -uo pipefail
cd "$(dirname "$0")/.."

# ── Sensores del proyecto (Códice Studio / ai-skills-studio) ───────────────
LINT_CMD=""          # Pendiente: evaluar Biome/ESLint en docs/TASKS.md
TYPECHECK_CMD="npx tsc -b && npx tsc --noEmit --strict --skipLibCheck --target ES2022 --module ESNext --lib ES2022,DOM api/github-oauth.ts api/skills-sh.ts"
TEST_UNIT_CMD="node scripts/test-catalog-install-translate.mjs && node scripts/test-lessons-store.mjs && node scripts/test-lesson-sharing.mjs && node scripts/test-component-assignments.mjs && node scripts/test-skills-sh-proxy.mjs"
TEST_INT_CMD="node scripts/test-skill-upload.mjs && node scripts/test-lesson-sharing-service.mjs && node scripts/test-skills-sh-service.mjs"
TEST_E2E_CMD="npm run build && node scripts/test-interfaces-playwright.mjs && node scripts/test-interactions-playwright.mjs && node scripts/test-catalog-integration.mjs && node scripts/test-components-page.mjs && node scripts/test-components-assign.mjs && node scripts/test-lessons.mjs && node scripts/test-lessons-share.mjs && node scripts/test-skills-sh-page.mjs && node scripts/test-guide-showcase.mjs && node scripts/test-effects-page.mjs && node scripts/test-pages-page.mjs"
# ───────────────────────────────────────────────────────────────────────────

RAPIDO=false
[ "${1:-}" = "--rapido" ] && RAPIDO=true

fallos=0
sin_configurar=0

run() {
  local nombre="$1" cmd="$2"
  if [ -z "$cmd" ]; then
    echo "⚠ $nombre: sin configurar (rellena scripts/check.sh)"
    sin_configurar=$((sin_configurar + 1))
    return
  fi
  echo "▶ $nombre: $cmd"
  if eval "$cmd"; then
    echo "✔ $nombre"
  else
    echo "✘ $nombre FALLÓ"
    fallos=$((fallos + 1))
  fi
}

run "Lint"        "$LINT_CMD"
run "Tipos"       "$TYPECHECK_CMD"
run "Unitarias"   "$TEST_UNIT_CMD"
run "Integración" "$TEST_INT_CMD"
if [ "$RAPIDO" = false ]; then
  run "E2E" "$TEST_E2E_CMD"
fi

echo "────────────────────────"
if [ "$fallos" -gt 0 ]; then
  echo "✘ $fallos verificación(es) fallaron. No está terminado."
  exit 1
fi
if [ "$sin_configurar" -gt 0 ]; then
  echo "⚠ Pasa, pero hay $sin_configurar verificación(es) sin configurar."
else
  echo "✔ Todo pasa."
fi
