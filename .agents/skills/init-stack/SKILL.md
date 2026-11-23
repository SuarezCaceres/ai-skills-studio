---
name: init-stack
description: Úsala al empezar un proyecto NUEVO (sin código todavía) con esta plantilla, o cuando el usuario quiera definir o cambiar el stack (lenguajes, frameworks, base de datos, herramientas de pruebas). Rellena docs/stack, los comandos de AGENTS.md, scripts/check.sh e init.sh.
---

# Definir el stack del proyecto

## 1. Entrevista (pregunta, no supongas)
Pregunta al usuario, en una sola tanda:
- Frontend: lenguaje, framework, librería de UI/estilos, gestión de estado.
- Backend: lenguaje, framework, base de datos, ORM, autenticación.
- Pruebas: herramienta de unitarias, de integración y de E2E.
- Gestor de paquetes y si el monorepo usa workspaces (pnpm, npm, uv…).
- Despliegue previsto (opcional).
Si no tiene clara alguna elección, propón 2–3 opciones con sus ventajas y deja que elija.

## 2. Rellenar
1. `docs/stack/frontend.md` y `docs/stack/backend.md`: tablas, comandos y estructura de carpetas.
2. `AGENTS.md`: la tabla «Comandos» (solo esa sección; no alargues el archivo).
3. `scripts/check.sh`: las variables `LINT_CMD`, `TYPECHECK_CMD`, `TEST_UNIT_CMD`, `TEST_INT_CMD` y `TEST_E2E_CMD`.
4. `init.sh`: los pasos de instalación, servicios y migraciones.
5. `.env.example`: las variables que va a necesitar el stack.
6. `.gitignore`: las entradas propias del stack.

## 3. Andamiaje (pide confirmación antes)
Propón los comandos oficiales del framework para crear `apps/web` y `apps/api`, y ejecútalos solo cuando el usuario apruebe. Configura el linter, el formateador y las herramientas de pruebas para que `./scripts/check.sh` funcione de verdad.

## 4. Skills de terceros
Sugiere skills de buenas prácticas para el stack elegido, con su fuente. Si el usuario acepta:
```bash
npx skills add <usuario/repo> -a claude-code -a antigravity
```
Después, apúntalas en la sección «Skills de terceros» de `docs/stack/*.md` y en la skill orquestadora que corresponda (`frontend-proyecto`, `backend-proyecto` o `pruebas-proyecto`).

## 5. Cerrar
- Escribe un ADR en `docs/decisions/` con el stack elegido y por qué.
- Ejecuta `./scripts/check.sh` y comprueba que no queden verificaciones «sin configurar».
- Actualiza `docs/TASKS.md` y `docs/PROGRESS.md`, y haz commit en la rama `chore/init-stack`.
