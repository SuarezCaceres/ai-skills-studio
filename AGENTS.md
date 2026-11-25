# AGENTS.md

> Índice único de **Códice Studio (`ai-skills-studio`)** para agentes de IA (Antigravity CLI y Claude Code).
> Se carga en cada sesión: mantenlo por debajo de **120 líneas**. El detalle vive en `docs/`.
> No crees `CLAUDE.md` ni `GEMINI.md`: si existen, algunas herramientas ignoran este archivo.

## Qué es este proyecto
**Códice Studio (`v2.2.2`)** es un IDE web client-side y catálogo comunitario sobre GitHub para auditar, editar en VFS, probar y compartir *skills* (`SKILL.md`), componentes UI accesibles y clases técnicas para agentes de IA. Está desplegado en producción en Vercel (`https://codice-oauth.vercel.app`) junto a sus funciones serverless en `api/`; la persistencia comunitaria vive en GitHub.
Detalle: `docs/project/PROJECT.md` · Arquitectura: `docs/project/ARCHITECTURE.md`

## Estructura del repo
```
src/              SPA en React 19 + TS + Tailwind v4 (componentes, hooks, services, types, ui-kit)
public/assets/    kit editorial estático tasteskill 2.5.1 (ZONA BLINDADA: no mover ni importar en TS)
api/              función serverless de Vercel (`github-oauth.ts`: único lugar con client secret)
scripts/          sensor `check.sh`, 13 suites de prueba (Node + Playwright), fixtures y miniaturas
docs/             contexto, stack, reglas, specs, ADRs, `catalog-setup.md`, `features.json`, progreso
.agents/skills/   skills del proyecto (Claude Code las ve vía `.claude/skills`)
```

## Rol principal: Orquestador General
Cuando una tarea abarque varias áreas, requiera planificación por etapas o permita paralelismo, actúa como **Orquestador General** (skill `orquestador-general`):
1. Analiza primero el código real y entrevista al humano solo sobre lo no deducible.
2. Fija contratos compartidos (`src/types/*`, `src/App.tsx`) antes de paralelizar.
3. Delega por fases en subagentes especializados con **propiedad disjunta de archivos** (*Zero-Conflict*) y cierra con un subagente `revisor` independiente.

## Al empezar cada sesión
1. Lee las últimas entradas de `docs/PROGRESS.md`, `docs/TASKS.md` y `docs/features.json`.
2. Ejecuta `git status` y `git log --oneline -10`.
3. Si falta configurar hooks o el enlace `.claude/skills`, ejecuta `./init.sh`.
4. Trabaja en **una** tarea clara a la vez. Si hay ambigüedad, pregunta antes de asumir.

## Mapa de contexto: lee solo lo que necesites
| Si vas a… | Lee primero |
|-----------|-------------|
| Entender el producto y glosario | `docs/project/PROJECT.md` |
| Entender piezas, contratos y datos | `docs/project/ARCHITECTURE.md` |
| Tocar UI, páginas o kit de componentes | `docs/stack/frontend.md`, `docs/rules/frontend.md` |
| Tocar `api/github-oauth.ts` o servicios GitHub | `docs/stack/backend.md`, `docs/rules/backend.md`, `docs/catalog-setup.md` |
| Escribir o depurar pruebas | `docs/rules/testing.md`, `docs/references/testing/README.md` |
| Tocar OAuth, CSP, VFS o Markdown externo | `docs/rules/security.md` |
| Hacer commits, ramas o abrir un PR | `docs/rules/general.md`, skill `github-workflow-standards` |
| Coordinar fases o subagentes en paralelo | skill `orquestador-general` |
| Crear una funcionalidad nueva | skill `spec-plan-code` |
| Consultar decisiones previas (ADRs) | `docs/decisions/` |

## Skills del proyecto (`.agents/skills/`)
| Skill | Cuándo usarla |
|-------|---------------|
| `orquestador-general` | Dividir en fases y coordinar subagentes sin colisión de archivos |
| `spec-plan-code` | Funcionalidad nueva o cambio grande (`spec → plan → código`) |
| `frontend-proyecto` | Trabajo en `src/` (vistas, estilos, estado, `ui-kit/`) |
| `backend-proyecto` | Trabajo en `api/` o servicios de integración con GitHub API |
| `pruebas-proyecto` | Escribir, ejecutar o corregir suites en `scripts/test-*.mjs` |
| `revisor` | Auditoría independiente contra spec, reglas y pruebas antes del PR |
| `github-workflow-standards` | Obligatoria antes de cada commit semántico o PR (5 secciones) |
| `adoptar-proyecto` / `init-stack` | Adopción inicial del harness o redefinición de stack |

## Comandos
| Acción | Comando |
|--------|---------|
| Preparar entorno y hooks | `./init.sh` |
| Verificación rápida (tipos + 6 suites Node, ~8 s) | `./scripts/check.sh --rapido` |
| Verificación completa (+ build + 7 suites Playwright) | `./scripts/check.sh` |
| Servidor de desarrollo (OAuth requiere `:5173`) | `npm run dev` |
| Build de producción (`tsc -b && vite build`) | `npm run build` |
| Regenerar miniaturas del kit UI (`≤ 40 KB`) | `node scripts/capture-components.mjs` |

## Flujo de trabajo y Definición de terminado
Toda funcionalidad nueva sigue `spec-plan-code` (`docs/specs/NNN-nombre/spec.md` → aprobación → `plan.md` → aprobación → rama `feat/NNN-nombre` → `revisor` → PR de **5 secciones** según `github-workflow-standards`).
Algo está **terminado** solo cuando:
- `./scripts/check.sh` pasa (sin tocar jamás `api.github.com` ni `youtube.com` reales en pruebas).
- Cada criterio de aceptación de la spec tiene prueba en verde.
- `docs/features.json`, `docs/TASKS.md` y `docs/PROGRESS.md` están actualizados.

## Autonomía y Zonas Blindadas
- **Sin preguntar:** leer código, editar dentro del alcance aprobado, correr pruebas, crear ramas `feat/*`/`fix/*`/`chore/*`, commitear en ellas y preparar PRs.
- **Pregunta antes de:** añadir/quitar dependencias `npm`, modificar `docs/rules/`, tocar las **zonas blindadas** (`public/assets/*`, plugins `preserve-public-kit-assets` y `cspConnectSrc` en `vite.config.ts`, `api/github-oauth.ts`, `src/utils/securityHardening.ts`, CSP de `index.html`, workflows CI/CD) o borrar archivos ajenos.
- **Nunca:** push/merge directo a `main`, leer o commitear `.env`/`.env.local`, persistir el token de GitHub fuera de memoria, borrar/debilitar pruebas para que pasen o usar `--no-verify`.

## Reglas de oro y Cierre de sesión
- `docs/rules/` manda sobre cualquier skill externa. Cuando el humano corrija un error, propón añadirlo en «Lecciones aprendidas» del archivo `docs/rules/*.md` correspondiente.
- Al cerrar sesión: registra entrada arriba en `docs/PROGRESS.md`, actualiza `docs/TASKS.md` y `docs/features.json`, y deja la rama limpia.
