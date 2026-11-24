#!/usr/bin/env bash
# Prepara el entorno de desarrollo de Códice Studio (ai-skills-studio).
# Idempotente y compatible con Windows (Git Bash) + Linux/macOS.
# Los agentes lo ejecutan al empezar una sesión si el entorno no está levantado.
set -euo pipefail
cd "$(dirname "$0")"

ES_WINDOWS=false
case "$(uname -s 2>/dev/null || echo "")" in
  MINGW*|MSYS*|CYGWIN*) ES_WINDOWS=true ;;
esac

es_junction_ntfs() {
  [ "$ES_WINDOWS" = true ] || return 1
  powershell.exe -NoProfile -NonInteractive -Command '
    if (Test-Path -LiteralPath ".claude/skills") {
      $it = Get-Item -LiteralPath ".claude/skills" -Force
      if ($it.LinkType -eq "Junction") { exit 0 }
    }
    exit 1
  ' >/dev/null 2>&1
}

es_reparse_point() {
  [ "$ES_WINDOWS" = true ] || return 1
  powershell.exe -NoProfile -NonInteractive -Command '
    if (Test-Path -LiteralPath ".claude/skills") {
      $it = Get-Item -LiteralPath ".claude/skills" -Force
      if ([bool]($it.Attributes -band [IO.FileAttributes]::ReparsePoint)) { exit 0 }
    }
    exit 1
  ' >/dev/null 2>&1
}

echo "▶ Configurando hooks de git (.githooks)"
git config core.hooksPath .githooks
chmod +x .githooks/* scripts/*.sh .claude/hooks/*.sh 2>/dev/null || true

echo "▶ Comprobando el enlace .claude/skills → .agents/skills"
mkdir -p .claude
if [ "$ES_WINDOWS" = true ] && es_junction_ntfs && [ -d .claude/skills ]; then
  echo "  ok (Junction NTFS)"
elif [ -L .claude/skills ] && [ -d .claude/skills ]; then
  echo "  ok"
else
  # Solo borrar .claude/skills como directorio normal tras confirmar que NO es symlink ni Junction
  if [ -L .claude/skills ] || es_reparse_point; then
    if [ "$ES_WINDOWS" = true ]; then
      cmd.exe //c "rmdir .claude\\skills" >/dev/null 2>&1 || rm -f .claude/skills
    else
      rm -f .claude/skills
    fi
  elif [ -e .claude/skills ]; then
    rm -rf .claude/skills
  fi

  if MSYS=winsymlinks:nativestrict ln -s ../.agents/skills .claude/skills 2>/dev/null && [ -L .claude/skills ] && [ -d .claude/skills ]; then
    echo "  ok (symlink creado)"
  elif [ "$ES_WINDOWS" = true ] && cmd.exe //c "mklink /J .claude\\skills .agents\\skills" >/dev/null 2>&1 && (es_junction_ntfs || [ -d .claude/skills ]); then
    echo "  ok (Junction NTFS creada)"
  else
    echo "  ⚠ No se pudo crear el enlace .claude/skills → .agents/skills."
    echo "    En Linux/macOS: ln -s ../.agents/skills .claude/skills"
    echo "    En Windows:     cmd /c mklink /J .claude\\skills .agents\\skills"
    exit 1
  fi
fi

if [ ! -f .env.local ] && [ ! -f .env ] && [ -f .env.example ]; then
  echo "▶ Creando .env.local a partir de .env.example (opcional: sin variables la app funciona en modo solo lectura)"
  cp .env.example .env.local
fi

if [ ! -d node_modules ]; then
  echo "▶ Instalando dependencias (npm ci)"
  npm ci || npm install
else
  echo "✔ Dependencias listas (node_modules presente)"
fi

echo "✔ Entorno listo"
