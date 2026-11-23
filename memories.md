# 🧠 MEMORIES.md — Puntero al Harness Oficial (`AGENTS.md` + `docs/`)

> [!IMPORTANT]
> **Fuente única de verdad a partir de la adopción del Harness (`v2.2.2+`):**
> El contexto vivo, la arquitectura, las reglas obligatorias y el estado de **Códice Studio (`ai-skills-studio`)** se gestionan ahora mediante divulgación progresiva desde **[AGENTS.md](./AGENTS.md)** y la carpeta **[docs/](./docs/)**.
> **No dupliques documentación aquí:** actualiza el documento específico del harness que corresponda.

## 🧭 Dónde leer y actualizar cada cosa

| Qué necesitas | Archivo canónico |
| :--- | :--- |
| **Índice maestro de sesión, comandos y autonomía** | [`AGENTS.md`](./AGENTS.md) |
| **Coordinación por fases y subagentes sin conflictos** | [`.agents/skills/orquestador-general/SKILL.md`](./.agents/skills/orquestador-general/SKILL.md) |
| **Estándar obligatorio de Commits y PRs (5 secciones)** | [`.agents/skills/github-workflow-standards/SKILL.md`](./.agents/skills/github-workflow-standards/SKILL.md) y [`docs/rules/general.md`](./docs/rules/general.md) |
| **Visión del producto, alcance y glosario** | [`docs/project/PROJECT.md`](./docs/project/PROJECT.md) |
| **Arquitectura, piezas reales, contratos y datos** | [`docs/project/ARCHITECTURE.md`](./docs/project/ARCHITECTURE.md) |
| **Stack y comandos reales (Frontend / Serverless + GitHub)** | [`docs/stack/frontend.md`](./docs/stack/frontend.md) · [`docs/stack/backend.md`](./docs/stack/backend.md) |
| **Reglas obligatorias y lecciones aprendidas** | [`docs/rules/frontend.md`](./docs/rules/frontend.md) · [`docs/rules/backend.md`](./docs/rules/backend.md) · [`docs/rules/testing.md`](./docs/rules/testing.md) · [`docs/rules/security.md`](./docs/rules/security.md) |
| **Puesta en marcha manual (Catálogo, OAuth App y Vercel)** | [`docs/catalog-setup.md`](./docs/catalog-setup.md) |
| **Funcionalidades (hechas y hoja de ruta)** | [`docs/features.json`](./docs/features.json) y [`docs/specs/`](./docs/specs/) |
| **Tareas operativas y bitácora entre sesiones** | [`docs/TASKS.md`](./docs/TASKS.md) y [`docs/PROGRESS.md`](./docs/PROGRESS.md) |
| **Decisiones de arquitectura (ADRs)** | [`docs/decisions/`](./docs/decisions/) |

> El historial detallado previo a la adopción del harness permanece íntegro en el historial de Git (`git log -p memories.md`) y resumido en [`docs/decisions/0002-adopcion-del-harness.md`](./docs/decisions/0002-adopcion-del-harness.md).
