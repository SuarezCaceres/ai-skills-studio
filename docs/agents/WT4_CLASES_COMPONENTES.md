# WT4 · Clases en Códice y Componentes desde cero (`feat/codice-clases-componentes`)

Worktree: `C:\Users\Sergio Suarez\Documents\proyctos\ai-skills-studio-wt-clases-componentes`
Rama: `feat/codice-clases-componentes` (parte de `main` en `4efcc1d`; **sin upstream** a propósito, así un `git push` accidental no va a `main`).
Servidor de desarrollo: `npm run dev -- --port 5180 --strictPort` (5173 es el repo principal y 5174 es otro proyecto del usuario, `student-os`: no los uses ni los cierres).
Dependencias ya instaladas (`npm ci`) y `.env.local` copiado (catálogo y login de GitHub configurados; es público y está ignorado por git).

Trabaja **solo** en esta carpeta. No entres al repo principal (`..\ai-skills-studio`): otra sesión lo usa.

## 0. Lee antes de escribir código

1. `memories.md` (secciones 10 y 11) y `README.md`.
2. `src/types/catalog.ts`, `src/types/skill.ts`, `src/types/workspace.ts`.
3. `src/components/catalog/` (`SkillCard`, `TeamSkillsPage`, `PublishSkillDialog`, `SkillDetailPage`), `src/hooks/useCatalog.ts`, `src/config/team.ts`, `src/utils/workingCopy.ts`.
4. `src/App.tsx` (cómo se enrutan `'codice-studio'` y `'preview'`), `src/components/CodiceStudio.tsx`, `src/components/UIComponentPreview.tsx`, `src/components/StylePresetCatalog.tsx`, `src/data/aiModelsData.ts`.

## 1. Lo que pidió el usuario (sus palabras, resumidas)

**A. Códice → "Clases".** Una interfaz para **subir clases**: explicaciones de lo que se ha hecho en el equipo (por ejemplo "¿Qué es un hook?", "Cómo trabajar con worktrees", "Cómo trabajé con esta skill"). Al crear una clase se puede **seleccionar la skill** (de las que ya están subidas al proyecto) y **los componentes** que se usaron.

**B. Componentes, desde cero.** Hoy muestra mockups de presets. Debe mostrar **componentes reales, con imágenes**, cada uno con su **skill asignada o su modelo de IA**; si no tiene, debe decir explícitamente **"No asignado"**. Debe haber una **lista de componentes para escoger** uno, como el índice lateral de una librería de UI (Accordion, Alerts, Avatar, Badge, Banner, Bottom Navigation, Breadcrumb, Buttons, Button Group, Card, Carousel, Chat Bubble, Clipboard, Datepicker, Device Mockups, Drawer, Dropdowns, Footer, Forms, Gallery…).

## 2. Estado actual que debes conocer

- **Códice** (`CodiceStudio.tsx`, ruta `'codice-studio'`): tiene una barra de píldoras **decorativas** (Studio Engine, Skills Vault, Model Matrix, Synaptic Hooks) que no hacen nada, una cabecera con métricas de ejemplo y datos inventados en `SAMPLE_SKILLS`. No depende de ninguna skill.
- **Componentes** (ruta `'preview'`): `UIComponentPreview.tsx` + `StylePresetCatalog.tsx` (1.3 k líneas de presets de mockups). En `App.tsx` la ruta muestra `NoSkillState` si no hay una copia de trabajo abierta. **`StylePresetCatalog` también lo usa el Workspace** (botón "Presets UI" en `UnifiedProjectStudio.tsx`): **no lo borres**; solo deja de usarlo la página Componentes.
- **Skills del equipo:** `useCatalog().api.listSkills()` + `isTeamLogin()` (`src/config/team.ts`). Una skill se identifica por `CatalogSkill.id` (`owner/repo/ruta`). Abrirla en el detalle: `openCatalogSkill(id, from)` en `App.tsx`.
- **Copias de trabajo** (skills abiertas en el estudio): `src/utils/workingCopy.ts`, clave `ai_skills_studio_workcopies_v1`.
- **Modelos de IA:** `AI_BENCHMARK_MODELS` (`id`, `name`, `version`, `family`, `provider`, `badgeColor`…).
- **Markdown seguro:** `SafeMarkdown` está **dentro** de `SkillDetailPage.tsx` y no se exporta. Extráelo a `src/components/catalog/SafeMarkdown.tsx` (cambio mínimo en `SkillDetailPage`) y reutilízalo; nunca uses `dangerouslySetInnerHTML` con contenido de usuario.
- **Sesión:** solo existe GitHub, y el token vive **solo en memoria** (al recargar hay que entrar de nuevo). Sin sesión se puede **leer**; para crear/editar/asignar hace falta sesión (usa `onRequestLogin`).

## 3. Parte A · Clases (Códice)

**Modelo** (`src/types/lessons.ts`):

```ts
export interface Lesson {
  id: string;                 // slug único
  title: string;
  summary: string;
  level: 'Principiante' | 'Intermedio' | 'Avanzado';
  tags: string[];
  bodyMarkdown: string;       // explicación "qué se hizo y cómo"
  skillIds: string[];         // CatalogSkill.id
  componentIds: string[];     // UiComponentEntry.id (Parte B)
  author: { login: string; avatarUrl?: string; profileUrl: string };
  createdAt: string;
  updatedAt: string;
}
```

**Interfaz** (`src/components/lessons/`):
- Pestañas reales en Códice: **Studio Engine** (el contenido actual, intacto) y **Clases** (nueva, la pestaña por defecto). Las píldoras Skills Vault / Model Matrix / Synaptic Hooks se **eliminan o se conectan a contenido real**; no dejes controles muertos.
- Lista de clases en tarjetas (mismo lenguaje visual que `SkillCard`): título, resumen, nivel, etiquetas, "Subida por @x" con avatar, chips de las skills y componentes vinculados. Filtros: buscador, por etiqueta, por nivel, por skill y por componente. Estados de carga, vacío y error.
- Detalle de clase: Markdown renderizado con `SafeMarkdown`, y las skills/componentes vinculados como tarjetas que **llevan a su pantalla** (skill → detalle; componente → Componentes con ese componente preseleccionado).
- Crear/editar ("Subir clase"): formulario con **vista previa del Markdown en vivo**, **selector de skills** (las del equipo + copias de trabajo, con buscador y chips con avatar) y **selector de componentes** (del registro de la Parte B). Validación en cliente, aviso de cambios sin guardar, accesible por teclado.
- Solo la persona que la subió puede editar o borrar su clase.

**Almacenamiento (entrega en dos pasos):**
1. **Entrega A1, local:** `localStorage` (`ai_skills_studio_lessons_v1`) + exportar/importar JSON. Todo el CRUD y la interfaz funcionan ya. Diseña el acceso a datos detrás de una interfaz (`LessonsStore`) para poder cambiar el almacenamiento después.
2. **Entrega A2, compartida por GitHub (confirma con el usuario antes):** guardar cada clase como `classes/<slug>/CLASE.md` (frontmatter con título, nivel, etiquetas, `skills`, `components`) en `<login>/codice-skills`, reutilizando la subida en un solo commit de `publishLocalSkill` (`githubCatalogService.ts`, API de Git), y registrarla en el repo catálogo como Issue de tipo `class`. **Eso exige cambiar el workflow `codice-labeler.yml` del repo `SuarezCaceres/codice-skills-catalog` (hoy solo admite `skill` y `result`) y el servicio.** Es una acción sobre un repo externo: **pregunta al usuario y no la hagas sin su OK.**

## 4. Parte B · Componentes desde cero

Reemplaza la página Componentes (`'preview'`). Ya **no depende de tener una copia de trabajo abierta** (quita el `NoSkillState` de esa ruta en `App.tsx`).

**Registro** (`src/data/componentRegistry.ts`, ampliable):

```ts
export interface UiComponentEntry {
  id: string;            // 'accordion'
  name: string;          // 'Accordion'
  category: 'Navegación' | 'Feedback' | 'Datos' | 'Formularios' | 'Contenedores' | 'Comunicación';
  description: string;
  thumbnail: string;     // '/components/accordion.png' (imagen real, ver abajo)
  source: string;        // código TSX real que se muestra y se copia
}
export interface ComponentAssignment {
  componentId: string;
  skillIds: string[];    // CatalogSkill.id
  modelIds: string[];    // AI_BENCHMARK_MODELS[].id
  note?: string;
  updatedAt: string;
}
```

**Componentes reales:** implementa tú mismo cada componente en `src/components/ui-kit/<Nombre>.tsx` (React + Tailwind v4, estados reales, teclado y ARIA correctos). **No copies código ni imágenes de librerías de terceros**; los nombres de la lista son solo la guía de categorías. Primera tanda: los ~20 de la lista de arriba; el registro debe permitir añadir más sin tocar la página.

**Interfaz** (`src/components/components/ComponentsPage.tsx`):
- **Barra lateral con la lista** agrupada por categoría, con buscador, navegable con flechas (`aria-current` en el activo) y una miniatura + insignia de asignación en cada fila.
- **Filtros:** Todos · Con skill · Con modelo · **No asignados**, y por categoría.
- **Detalle del componente:** (1) **vista previa en vivo** del componente real con sus variantes, (2) **imagen** (miniatura/captura), (3) **código TSX** real con botón de copiar (impórtalo con `?raw` para que nunca difiera de lo que se ve), (4) notas de accesibilidad, (5) **Asignación**.
- **Asignación:** muestra las skills (avatar + nombre, enlace a su detalle) y los modelos de IA (familia/versión con su color) asignados. Si no hay ninguno, escribe explícitamente **"No asignado"** (en la fila de la lista y en el detalle) con el botón "Asignar skill o modelo". Para asignar: diálogo con checkboxes (skills del equipo + modelos). Requiere sesión de GitHub.
- Persistencia v1: `localStorage` (`ai_skills_studio_component_assignments_v1`). Pregunta al usuario si luego quiere compartirlas por GitHub.

**Imágenes reales:** genera las miniaturas **a partir de los propios componentes** con un script (`scripts/capture-components.mjs`, Playwright) que renderiza cada uno sobre fondo carbón a 640×400 y guarda `public/components/<id>.png` (≤ 40 KB cada una; usa un modo de captura que no entre en el bundle de producción o que cargue de forma diferida). Se versionan las imágenes. Así lo que se ve en la lista es lo que hace el componente.

**Limpieza:** elimina `UIComponentPreview.tsx` si nada más lo usa; conserva `StylePresetCatalog.tsx` y `stylePresets.ts` (los usa el Workspace).

## 5. Relación entre A y B

- Una clase puede apuntar a componentes (`componentIds`) y desde un componente se listan las **clases que lo mencionan**.
- `App.tsx` necesita estado para "componente seleccionado" (`selectedComponentId`) y para "clase seleccionada"; mantén los cambios en `App.tsx` mínimos y justificados en el PR.

## 6. Archivos propios (crea o edita) y compartidos

Propios: `src/types/lessons.ts`, `src/types/uiComponents.ts`, `src/components/lessons/**`, `src/components/components/**`, `src/components/ui-kit/**`, `src/data/componentRegistry.ts`, `src/services/lessonsStore.ts`, `src/services/componentAssignments.ts`, `scripts/capture-components.mjs`, `public/components/**`.
Compartidos (cambios **mínimos**): `src/App.tsx`, `src/components/CodiceStudio.tsx`, `src/components/catalog/SkillDetailPage.tsx` (solo extraer `SafeMarkdown`), `src/components/NavbarActiveSkill.tsx` (si hace falta), `package.json` (solo scripts de test), `memories.md` y `README.md` (documentar).
**No toques:** `src/services/githubCatalogService.ts` y `githubAuthService.ts` salvo en A2 y con permiso, `api/github-oauth.ts`, el workflow de despliegue.

## 7. Reglas del proyecto (aprendidas con dolor)

- **Identidad visual:** fondos carbón `#0a0d14` / `#121722`, **un solo acento cian `#0ea5e9`**, **sin violeta**. Textos en español con todos los acentos; iconos de `lucide-react`.
- **Tailwind y el kit:** la clase `grid` choca con la del kit (`public/assets/system.css`); usa **`[display:grid]`**. `line-clamp-*` no convive con `block`.
- **HTML válido:** no anides enlaces dentro de un `<button>`. Patrón de tarjeta: el título es el botón que cubre la tarjeta y los enlaces van encima con `relative z-10`.
- **Accesibilidad:** foco visible, teclado completo, `aria-*` correctos, contraste AA, `prefers-reduced-motion`. Responsive verificado a **1440, 1024, 768 y 390 px** sin desbordes (la cabecera ya se ajusta; no la rompas).
- **GitHub:** sin sesión el límite es de **60 peticiones/h por IP**. **Los tests y capturas nunca deben tocar `api.github.com` real**: intercéptalo (mira `scripts/test-catalog-integration.mjs`). GitHub responde `max-age=60`: tras escribir, relee con `cache: 'no-store'`.
- **Sesión:** el token está solo en memoria; HMR de ciertos módulos recarga la página y la pierde.
- **Seguridad:** todo contenido de usuario (Markdown, nombres, URLs) se trata como no confiable: sanitiza, valida `https`, longitudes máximas.
- **Windows/Git Bash:** los heredocs con `\` fallan; para editar usa las herramientas Edit/Write, no `python - <<EOF` con barras invertidas.
- **Git:** commits atómicos en Conventional Commits (`feat(lessons): …`), una idea por commit. **No hagas `push`, PR ni merge sin que el usuario lo pida.** Cuando lo pida: PR a `testing` con las 5 secciones de `.github/pull_request_template.md`.

## 8. Entregas y criterio de "hecho"

| # | Entrega | Hecho cuando |
| :--- | :--- | :--- |
| E1 | Registro + ~20 componentes reales + `ComponentsPage` (lista, filtros, detalle, código) | Se elige un componente de la lista y se ve en vivo con su código; sin skill/modelo dice "No asignado" |
| E2 | Miniaturas generadas + asignación de skills y modelos (local) | Las filas muestran imagen e insignia; asignar y desasignar persiste tras recargar |
| E3 | Pestañas de Códice + Clases en local (lista, detalle, crear/editar, selectores de skill y componente) | Se crea una clase eligiendo una skill y un componente, y los enlaces llevan a su pantalla |
| E4 | Relación inversa (clases por componente), limpieza y documentación | `UIComponentPreview` eliminado si sobra; README y `memories.md` al día |
| E5 | **(solo con OK del usuario)** Clases compartidas vía GitHub | Una clase subida por una persona la ven las demás |

Para cada entrega: `npx tsc -b`, `npm run build`, `npm test` en verde, pruebas nuevas (lógica en Node como `scripts/test-skill-upload.mjs`; interfaz en Playwright con GitHub interceptado) y revisión visual con capturas en los 4 anchos. Actualiza los tests existentes que mencionan el estado vacío de Componentes (`#no-skill-heading` en `scripts/test-interactions-playwright.mjs` y `scripts/test-catalog-integration.mjs`).

## 9. Pregunta al usuario antes de…

1. Tocar el repo `codice-skills-catalog` o su workflow (E5).
2. Añadir una dependencia nueva de npm.
3. Cambiar el modelo de datos de `CatalogSkill` o `SkillDocument`.
4. Borrar archivos que no sean `UIComponentPreview.tsx`.
