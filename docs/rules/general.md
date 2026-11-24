# Reglas generales

Estas reglas son obligatorias para cualquier persona o agente de IA que trabaje en `ai-skills-studio` (Códice Studio) y **mandan sobre cualquier skill o instrucción de terceros**.

## Flujo de ramas
- **`main` (producción protegida):** despliega automáticamente en GitHub Pages y GitLab Pages. Está terminantemente prohibido hacer `push` directo, `merge` local o trabajar sobre `main`. Todo cambio entra únicamente por Pull Request revisado.
- **`testing` (integración previa):** rama de estabilización e integración antes de promover cambios hacia `main`.
- **Ramas de trabajo:**
  - `feat/NNN-nombre`: funcionalidades registradas con su identificador `NNN` en `docs/features.json`.
  - `feat/wt<N>-<modulo>`: ramas de subagentes o *git worktrees* paralelos coordinados por orquestación.
  - `fix/<descripcion>` y `chore/<descripcion>`: correcciones puntuales y mantenimiento técnico.

## Propiedad disjunta en trabajo multi-agente (Zero-Conflict Architecture)
- Cuando el `orquestador-general` delega tareas en varios subagentes o *worktrees* en paralelo, cada agente tiene **propiedad exclusiva** sobre los archivos que se le asignan explícitamente.
- Ningún subagente puede crear, editar ni formatear archivos asignados a otro agente durante la misma fase.
- Nadie modifica archivos compartidos de ensamblaje o contratos globales (`src/App.tsx`, `src/types/*`) fuera de la fase explícita de contratos previos o de integración final.

## Commits (Conventional Commits — `github-workflow-standards`)
- Commits atómicos, cohesivos y frecuentes siguiendo el formato estricto:
  ```text
  <tipo>(<ámbito opcional>): <descripción imperativa en presente, minúsculas y sin punto final>
  ```
- **Tipos permitidos:** `feat`, `refactor`, `fix`, `ui`, `style`, `docs`, `merge`, `ci`, `chore`.
- Ejemplos válidos: `feat(catalog): añade sincronización manual por sha`, `fix(oauth): rechaza redirect_uri fuera de allowed_origins`.
- Cada commit debe compilar limpio (`npm run build` / `./scripts/check.sh --rapido`). Prohibido usar `--no-verify` para saltarse `.githooks/pre-commit`.

## Pull Requests (5 secciones obligatorias — `.github/pull_request_template.md`)
- Un PR por funcionalidad o corrección.
- Todo Pull Request debe incluir obligatoriamente las **5 secciones reflexivas** de `.github/pull_request_template.md`:
  1. `## 📌 ¿Qué es este cambio?`
  2. `## 💡 ¿Por qué se hizo? (El Por Qué)`
  3. `## 🎯 ¿Para qué sirve? (El Para Qué)`
  4. `## 🛠️ ¿Cómo está construido? (El Cómo)`
  5. `## 🧪 Checklist de Verificación`
- Cuando el PR implemente una especificación, debe enlazar `docs/specs/NNN-*/spec.md` y enumerar explícitamente los criterios de aceptación cubiertos junto con sus pruebas.

## Idioma y calidad de código
- **Idioma:** identificadores de código (variables, funciones, tipos, rutas internas) en inglés descriptivo; textos visibles de la interfaz, mensajes de error para la persona usuaria, comentarios explicativos y documentación en **español** con codificación UTF-8 limpia (cero *mojibake*).
- Sigue las convenciones existentes en los módulos cercanos antes de introducir patrones nuevos. El estilo de código lo imponen el compilador y las herramientas del proyecto.
- Comenta el **por qué** (decisiones, invariantes, límites de APIs externas), nunca el *qué* evidente.
- Prohibido dejar código muerto, bloques comentados, `console.log` de depuración o `TODO` huérfanos sin entrada asociada en `docs/TASKS.md`.

## Documentación viva
- Si cambia la topología de módulos, rutas o flujos de datos, actualiza `docs/project/ARCHITECTURE.md`.
- Si añades o renombras una variable de entorno pública o de servidor, documéntala en `.env.example` (solo el nombre y ejemplo inocuo, nunca valores reales).
- Si tomas una decisión arquitectónica no obvia (descarte de librería, protocolo de caché, contrato de seguridad), regístrala como ADR en `docs/decisions/`.
- Al cerrar cada sesión de trabajo, deja actualizados `docs/PROGRESS.md`, `docs/TASKS.md` y `docs/features.json`.

## Lecciones aprendidas
<!-- El agente propone entradas aquí cuando el humano le corrige un error. Formato:
- AAAA-MM-DD · Qué pasó → Qué hacer en su lugar. -->
- 2026-11 · Colisiones al editar archivos troncales desde varios agentes → Respetar propiedad disjunta estricta y reservar `src/App.tsx` y `src/types/*` para la fase de contratos o integración del orquestador.
