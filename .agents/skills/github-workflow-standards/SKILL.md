---
name: github-workflow-standards
description: Estándar oficial y obligatorio para estructurar repositorios, redactar commits semánticos (Conventional Commits) y elaborar Pull Requests con el formato estructurado de 5 secciones reflexivas (¿Qué es?, ¿Por qué se hizo?, ¿Para qué sirve?, ¿Cómo está construido?, Checklist de Verificación). Debe consultarse obligatoriamente antes de realizar cualquier commit o abrir un PR.
---

# 🚀 Estándar Oficial de Flujo GitHub: Commits, Pull Requests y Arquitectura

Este estándar define las reglas obligatorias e ineludibles para cualquier desarrollador o agente de inteligencia artificial que trabaje en los repositorios de la organización y proyectos personales (@SuarezCaceres).

---

## 📌 Protocolo de Lectura Previa Obligatoria

> [!IMPORTANT]
> **REGLA GENERAL ABSOLUTA:**
> Antes de crear cualquier commit o abrir un Pull Request en este repositorio, **ES OBLIGATORIO** leer `memories.md` y cumplir estrictamente con esta especificación. No se aceptarán commits con mensajes vagos ni Pull Requests con descripciones vacías o genéricas.

---

## 📝 1. Estándar de Commits (Conventional Commits)

Todos los commits deben seguir estrictamente el estándar semántico de **Conventional Commits**:

```text
<tipo>(<ámbito opcional>): <descripción imperativa en presente>
```

### Tipos Permitidos y Cuándo Usarlos:

| Tipo | Propósito | Ejemplo Válido |
| :--- | :--- | :--- |
| `feat` | Nueva funcionalidad, módulo o componente interactivo. | `feat(learning): implement Aprendizaje tab with Active Recall` |
| `refactor`| Reestructuración de layout o código sin alterar funcionalidad. | `refactor(navbar): optimize layout and prevent text wrapping` |
| `fix` | Corrección de un bug o comportamiento inesperado. | `fix(auth): resolve session expiration check in PBKDF2` |
| `ui` / `style` | Ajustes cosméticos, tokens de diseño, espaciado o tipografía. | `feat(ui): elevate visual design with obsidian palette` |
| `docs` | Actualización de documentación técnica, `memories.md` o README. | `docs: update memories.md to v1.3.0 reflecting learning module` |
| `merge` | Fusión e integración de ramas de agentes o worktrees. | `merge: integrate Agent 1 (University GPA calculator & rubrics)` |
| `ci` | Configuración de GitHub Actions, GitLab CI/CD o pipelines. | `ci(deploy): add GitHub Pages automated deployment pipeline` |
| `chore` | Tareas de mantenimiento, actualización de dependencias o tooling. | `chore: upgrade vite to v6.4.5 and align tailwind plugins` |

### Reglas Clave de Commits:
1. **Verbo en imperativo y tiempo presente:** `add`, `implement`, `optimize`, `resolve`, `unify` (no `added`, no `fixing`).
2. **Minúsculas en el mensaje inicial:** `feat(navbar): ...` (no `feat(navbar): Add...`).
3. **Sin punto final al final de la línea.**
4. **Claridad atómica:** Un commit debe representar un cambio cohesivo y comprobado con `npm run build`.

---

## 📋 2. Estándar Oficial de Pull Requests (5 Secciones Obligatorias)

Cada Pull Request debe seguir la siguiente estructura de 5 secciones con preguntas reflexivas:

### Estructura del Título del PR:
```text
feat: [Nombre Principal del Proyecto o Módulo] — [Subtítulo descriptivo y propósito]
```
*Ejemplo:* `feat: StudentOS PRO MAX — Life, Gym & College Hub para Universitarios`

---

### Plantilla Oficial del Cuerpo del PR:

```markdown
## 📌 ¿Qué es este proyecto / cambio?

[Descripción concisa en 1-2 párrafos en negrita y texto fluido explicando la naturaleza del cambio].

- **[Módulo o Área 1]:** [Detalle de funcionalidad, alcance y componentes involucrados].
- **[Módulo o Área 2]:** [Detalle de funcionalidad, alcance y componentes involucrados].
- **[Módulo o Área 3]:** [Detalle de funcionalidad, alcance y componentes involucrados].

---

## 💡 ¿Por qué se creó? (El Por Qué)

[Explicación del problema de raíz, dolores del usuario o ineficiencias previas que motivaron este desarrollo]:
1. **[Fricción o Problema 1]:** [Explicación detallada de la limitación o cuello de botella previo].
2. **[Fricción o Problema 2]:** [Explicación detallada de la limitación o cuello de botella previo].
3. **[Fricción o Problema 3]:** [Explicación detallada de la limitación o cuello de botella previo].

---

## 🎯 ¿Para qué sirve? (El Para Qué)

[Beneficios directos, valor entregado al usuario y cómo resuelve las fricciones descritas]:
- **[Beneficio 1]:** [Explicación del impacto en la experiencia y flujo de trabajo].
- **[Beneficio 2]:** [Explicación del impacto en la experiencia y flujo de trabajo].
- **[Beneficio 3]:** [Explicación del impacto en la experiencia y flujo de trabajo].

---

## 🛠️ ¿Cómo está construido? (El Cómo)

- **Frontend Core:** [Framework, versión y lenguaje, ej: React 19 + TypeScript + Vite].
- **Motor de Estilos:** [Tailwind CSS v4 con sistema de tokens semánticos].
- **Tipografía:** [Fuentes oficiales, ej: Plus Jakarta Sans / JetBrains Mono].
- **Iconografía:** [Lucide Icons sin emojis interactivos como botones].
- **Persistencia / Backend:** [Mecanismo de datos, ej: LocalStorage reactivo / Supabase / In-Memory RAR].
- **CI/CD & Despliegue:** [GitHub Actions / GitLab Pages con validación automatizada].

---

## 🧪 Pruebas & Validación (Checklist)

- [ ] **Compilación de producción:** `npm run build` ejecutado con éxito sin errores de TypeScript.
- [ ] **Diseño Responsive:** Probado en resoluciones móviles (375px), tablets y pantallas de escritorio.
- [ ] **Contraste y Accesibilidad:** Contraste de texto validado (WCAG >= 4.5:1), anillos de foco visibles y semántica HTML5 nativa.
- [ ] **Integridad de datos:** Validación de codificación UTF-8 sin caracteres corruptos.
```

---

## 🌿 3. Flujo de Ramas y Git Worktrees (Zero Conflict Architecture)

Para evitar colisiones entre agentes y ramas:

1. **Aislamiento Disjunto de Archivos:**
   - Si varios agentes trabajan en simultáneo, cada worktree/rama debe tener la propiedad exclusiva de sus archivos.
   - Ningún agente debe modificar archivos asignados a otro worktree en su misma fase.
2. **Nomenclatura de Ramas:**
   - Ramas de características: `feat/<nombre-modulo>` (ej: `feat/learning-hub`)
   - Ramas de agentes en worktrees: `feat/wt<N>-<modulo>` o `feat/agent-<N>-<modulo>` (ej: `feat/wt1-landing-terminal`)
3. **Verificación Previa a la Fusión:**
   - Antes de solicitar o ejecutar `git merge`, ejecutar:
     ```bash
     npm run build
     ```
   - Si la compilación falla, el cambio no está listo para fusionarse.

---

## 🧠 4. Rol de `memories.md`

Todo proyecto debe incluir un archivo `memories.md` en su raíz. Este documento actúa como el **cerebro contextual vivo** del proyecto:

1. Registra el estado actual, stack, versión y mapa de directorios.
2. Documenta las decisiones arquitectónicas y el porqué de cada módulo.
3. Se actualiza obligatoriamente en cada hito importante con el commit correspondiente (`docs: update memories.md ...`).
4. Recuerda a todo agente la **obligatoriedad de este estándar**.
