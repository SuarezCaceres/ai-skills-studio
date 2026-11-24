# ADR 0001 · AGENTS.md como índice único para todos los agentes

- **Fecha:** 2026-11-23
- **Estado:** aceptada

## Contexto
El proyecto se trabaja con Claude Code y Antigravity CLI. Tener un archivo de instrucciones por herramienta (CLAUDE.md, GEMINI.md…) duplica reglas que acaban desincronizándose.

## Decisión
- Un único `AGENTS.md` en la raíz, corto, que funciona como índice. Claude Code lo lee cuando no existe `CLAUDE.md`, y Antigravity lo lee de forma nativa.
- El detalle vive en `docs/` (reglas, stack, referencias) y se lee bajo demanda (divulgación progresiva).
- Las skills viven en `.agents/skills/`, y `.claude/skills` es un enlace simbólico a esa carpeta.
- Los sensores que deben valer para cualquier agente se implementan como hooks de git (`.githooks/`) y en `scripts/check.sh`.

## Alternativas consideradas
- **Un archivo por herramienta:** descartado por la duplicación.
- **Todo dentro de AGENTS.md:** descartado. Un archivo largo consume contexto en cada sesión y reduce la adherencia a las reglas.

## Consecuencias
- No se debe crear `CLAUDE.md` ni `GEMINI.md`, ni en el repo ni en las carpetas superiores.
- En Windows, el enlace simbólico nativo requiere modo desarrollador y `core.symlinks`; cuando no está disponible, `./init.sh` crea automáticamente una Junction NTFS (`mklink /J`, ver ADR 0002).
