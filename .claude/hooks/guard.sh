#!/usr/bin/env bash
# Hook PreToolUse de Claude Code: bloquea comandos peligrosos antes de ejecutarlos.
# Recibe el JSON de la llamada por stdin. Salir con código 2 bloquea el comando
# y devuelve el mensaje de stderr al agente.
entrada="$(cat)"

bloquear() {
  echo "Bloqueado por el harness: $1. Consulta la sección Autonomía de AGENTS.md." >&2
  exit 2
}

echo "$entrada" | grep -Eq 'git[^"]*push[^"]*([[:space:]]|:)(main|master)([^a-zA-Z0-9_/-]|$)' && bloquear "push a main/master"
echo "$entrada" | grep -Eq 'git[^"]*push[^"]*(--force|[[:space:]]-f([[:space:]]|"|$))'        && bloquear "push forzado"
echo "$entrada" | grep -Eq -- '--no-verify'                                                   && bloquear "saltarse los hooks con --no-verify"
echo "$entrada" | grep -Eq 'rm[[:space:]]+-[a-zA-Z]*r[a-zA-Z]*[[:space:]]+(/|~|\$HOME|\.)([[:space:]]|"|$)' && bloquear "borrado recursivo de una ruta raíz"

if echo "$entrada" | grep -Eiq '(cat|less|more|head|tail|source|type|get-content|gc)[[:space:]]+[^"]*\.env(\.[a-zA-Z0-9_.-]+)?([[:space:]]|"|'\''|$)'; then
  if ! echo "$entrada" | grep -Eiq '\.env\.example([[:space:]]|"|'\''|$)'; then
    bloquear "leer archivos .env o .env.local"
  fi
fi

exit 0
