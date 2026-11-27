# Plan · 006 · Páginas de referencia

> Estado: aprobado (2026-11-27)
> Spec: `docs/specs/006-paginas-de-referencia/spec.md` (aprobada el 2026-11-27).
> Worktree: `../ai-skills-studio-006` · rama `feat/006-paginas-de-referencia` (desde `main` `d29f7de`).

## Enfoque
Se replica el patrón de **Componentes**: un registro fijo que se alimenta de `import.meta.glob` (vista en vivo diferida y código con `?raw`) y miniaturas generadas por un script desde la propia pieza. La diferencia es que aquí cada pieza es una **página completa** en `src/components/page-templates/`.

Los datos se separan en tres capas, para que la lógica pura de clases siga probándose en Node y el chunk inicial no crezca:
1. `src/data/pageIds.ts`: solo la lista de ids. La importa `lessonsStore` para sanear `pageIds`.
2. `src/data/pageCatalog.ts`: metadatos y prompts, sin `import.meta.glob`. Lo usan el selector del editor y las suites de Node.
3. `src/data/pageRegistry.ts`: metadatos más `Preview` diferido y `loadSource` (`?raw`). Solo lo usan la galería y la modal.

La modal (`PagePreviewModal`) es **una sola pieza** que usan la página «Páginas» y el detalle de una clase. Se monta con `createPortal` sobre `document.body`, según la lección aprendida de `docs/rules/frontend.md`, y se carga de forma diferida desde el detalle de la clase. Lee las clases con `useLessons()` para mostrar «Clases que la usan», así que no necesita que se las pasen.

**Escritorio / Móvil:** el marco cambia su ancho (`100 %` o `390 px`) y las plantillas usan *container queries* nativas de Tailwind v4 (`@container`, `@md:`, `@lg:`). No hace falta ningún `iframe` ni dependencia.

**Alternativa descartada:** pintar las plantillas en un `iframe srcdoc` para aislar estilos y *media queries*. Obliga a duplicar el CSS de la app dentro del `iframe`, complica la CSP y el foco, y las *container queries* ya resuelven el cambio de ancho.

## Contratos (Fase 0, antes de paralelizar)

### `src/data/pageIds.ts` (nuevo)
```ts
export const PAGE_IDS = ['landing-saas', 'tienda-online', 'dashboard', 'login-registro', 'precios', 'blog-articulo'] as const;
export type PageId = (typeof PAGE_IDS)[number];
export const isPageId = (v: unknown): v is PageId => typeof v === 'string' && (PAGE_IDS as readonly string[]).includes(v);
```

### `src/types/pages.ts` (nuevo)
```ts
export type PageCategory = 'Landing' | 'Tienda online' | 'Dashboard' | 'Autenticación' | 'Precios' | 'Blog';
export const PAGE_CATEGORIES: PageCategory[];          // orden de los chips
export interface PageTemplateMeta {
  id: PageId;
  file: string;              // nombre en page-templates/, sin .tsx
  name: string;              // «Landing SaaS»
  nickname: string;          // «la portada de un producto» → «Le dicen: …»
  category: PageCategory;
  description: string;       // 1–2 frases en español
  prompt: string;            // en inglés, para pegar en una IA
  componentIds: string[];    // ids de COMPONENT_REGISTRY que usa
  thumbnail: string;         // `pages/<id>.png` (relativa a la base)
}
export interface PageTemplateEntry extends PageTemplateMeta {
  sourcePath: string;                                   // src/components/page-templates/<file>.tsx
  Preview: LazyExoticComponent<ComponentType>;          // export `Template` del archivo
  loadSource: () => Promise<string>;                    // ?raw
}
```

### Plantillas (`src/components/page-templates/<File>.tsx`)
Cada archivo exporta `export function Template()`. La raíz es `<div className="@container …">` y no lleva estado global, efectos de red ni navegación: enlaces `href="#"` con `preventDefault` y formularios con `onSubmit={e => e.preventDefault()}`. Las imágenes son bloques SVG o CSS locales.

Archivos: `LandingSaas`, `TiendaOnline`, `Dashboard`, `LoginRegistro`, `Precios`, `BlogArticulo`.

### Clases (`src/types/lessons.ts`)
- `Lesson.pageIds: string[]` y `LessonDraft.pageIds: string[]` (siempre presentes tras sanear). `CommunityLesson` lo hereda.
- `lessonsStore.ts`: `LIMITS.pages = 5`, `cleanPageIds()` (solo ids de `PAGE_IDS`, sin repetidos, como máximo 5) en `sanitizeLessonMeta`, error `pageIds` en `validateDraft` y en `DraftErrors`.
- `lessonSharing.ts`:
  - `contentHash` añade `pageIds` al final del arreglo **solo si no está vacío**, así que la huella de las clases ya compartidas no cambia.
  - `pageIds` se añade también a `Shareable`, `buildSharedFiles` (`clase.json`), `ClassMarker`/`buildClassMarker`/`readClassMarker`, `toCommunityLesson` y `withSharedFiles`.
  - Al leer, lo que falta se toma como `[]` (pasa por `sanitizeLessonMeta`).

### Ruta y navegación
- `AppPageRoute` añade `'paginas'` (`src/types/workspace.ts`).
- `src/App.tsx`: `const PagesPage = lazy(...)` y montaje en `activePage === 'paginas'` con `onOpenComponent` (abre Componentes con ese id) y `onOpenLesson` (abre la clase en Códice, como hace hoy `ComponentsPage`).
- `NavbarActiveSkill.tsx`: entrada `{ id: 'paginas', label: 'Páginas', … icon: LayoutTemplate }` justo después de `preview` en `PAGE_NAV_ITEMS`, y enlace «Páginas de referencia» en el menú «UI y conocimiento».

### `PagePreviewModal` (firma fija)
```ts
interface PagePreviewModalProps {
  pages: PageTemplateMeta[];          // lista por la que navegan ↑/↓ (la categoría filtrada, o las de la clase)
  initialId: PageId;
  onClose: () => void;                // el llamador devuelve el foco a su disparador
  onOpenComponent?: (id: string) => void;
  onOpenLesson?: (id: string) => void; // si falta, «Clases que la usan» se muestra sin enlace
}
```

### Contrato de DOM (lo usan `wt1`, `wt3` y `wt4`)
| Elemento | Selector / nombre accesible |
|----------|-----------------------------|
| Página | `section[aria-labelledby="pages-heading"]`, `h1#pages-heading` «Páginas» |
| Chips de categoría | `[data-testid="paginas-filtro"] button[aria-pressed]`, texto «Todas 6», «Landing 1»… |
| Tarjeta | `button[data-testid="pagina-tarjeta"][data-page-id]` con nombre, apodo y categoría |
| Modal | `[role="dialog"][aria-modal="true"][data-testid="pagina-modal"]`, nombrada por su `h2` |
| Marco | `[data-testid="pagina-marco"][data-viewport="escritorio"\|"movil"]` |
| Escritorio / Móvil | `role="radiogroup"` «Vista», radios «Escritorio» y «Móvil» |
| Navegación | botones «Página anterior» / «Página siguiente», `[data-testid="pagina-posicion"]` «2 / 6», «Cerrar» |
| Usar | botón «Usar esta página» (`aria-expanded`), `role="tablist"` con pestañas «Prompt» y «Código» |
| Textos | `[data-testid="pagina-prompt"]`, `[data-testid="pagina-codigo"]`, botones «Copiar prompt» y «Copiar código» |
| Aviso | `[data-testid="pagina-aviso"][aria-live="polite"]` («Copiado» / «No se pudo copiar, selecciona el texto») |
| Relaciones | `[data-testid="pagina-componentes"]` y `[data-testid="pagina-clases"]` |
| Error de carga | `[data-testid="pagina-error"]` con botón «Reintentar» |
| Editor de clase | `fieldset` con `legend` «Páginas de referencia (N de 5)» y casillas nombradas por la página |
| Detalle de clase | `section[aria-labelledby="lesson-pages"]`, `h2` «Páginas de referencia», `button[data-testid="clase-pagina-chip"][data-page-id]` |

## Cambios por área
| Área | Archivos / módulos | Qué cambia |
|------|--------------------|------------|
| Contrato | `src/types/pages.ts`, `src/data/pageIds.ts`, `src/types/lessons.ts`, `src/types/workspace.ts` | Tipos nuevos, `pageIds` y la ruta `paginas` |
| Datos | `src/data/pageCatalog.ts`, `src/data/pageRegistry.ts` | Catálogo fijo de 6 páginas. No hay migración: lo que falta se toma como `[]` |
| Servicios | `src/services/lessonsStore.ts`, `src/services/lessonSharing.ts` | Saneo, límite, huella condicional y compartir |
| Frontend | `src/components/pages/*` (nuevo), `src/components/page-templates/*` (nuevo), `src/components/lessons/{pickers,LessonEditor,LessonDetail}.tsx`, `src/App.tsx`, `src/components/NavbarActiveSkill.tsx` | Galería, modal, plantillas e integración con clases |
| Assets | `public/pages/<id>.png` (nuevo, fuera de `public/assets/`) | Miniaturas `≤ 40 KB` |
| Scripts | `scripts/capture-pages.mjs` (nuevo, puerto `5192`), `scripts/test-pages-page.mjs` (nuevo, puerto `5197`), suites de clases y `scripts/check.sh` | Capturas y pruebas |
| Backend / zonas blindadas | — | **Sin cambios.** Sin dependencias nuevas ni cambios en `docs/rules/` |

## Pruebas
| Criterio | Tipo | Dónde |
|----------|------|-------|
| C1 | e2e (4 anchos) | `test-pages-page.mjs`: entrada en barra y menú, sin `scrollWidth` extra, sin errores de consola ni CSP |
| C2 | e2e | `test-pages-page.mjs`: 6 tarjetas, miniaturas cargadas (`naturalWidth > 0`), recuentos de chips y filtro con «Todas» |
| C3 | e2e | `test-pages-page.mjs`: apertura por clic, Enter y Espacio, `aria-modal`, Tab atrapado, Esc devuelve el foco, ↑/↓, botones y posición, filtro de 1 → «1 / 1» con botones desactivados |
| C4 | e2e | `test-pages-page.mjs`: `data-viewport`, ancho del marco ≈ 390, cambio de columnas de la rejilla de Tienda online y sin desborde a 390 px de ventana |
| C5 | e2e | `test-pages-page.mjs`: pestañas con flechas, prompt igual a `pageCatalog`, código igual al archivo leído del disco, portapapeles (permisos concedidos) y aviso; portapapeles denegado → aviso de error |
| C6 | e2e | `test-pages-page.mjs`: clase sembrada en `localStorage` con `pageIds` aparece en «Clases que la usan»; sin clases, estado vacío |
| C7 | e2e + unit | `test-lessons.mjs` (selector, guardar y error al pasar de 5) y `test-lessons-store.mjs` (`validateDraft`) |
| C8 | e2e | `test-lessons.mjs`: chip abre la modal sobre la clase, el `iframe` del video sigue montado (mismo nodo) y el foco vuelve al chip. Comunidad: `test-lessons-share.mjs` |
| C9 | unit | `test-lessons-store.mjs`: falta → `[]`, desconocidos/repetidos/>5 descartados, export/import conserva. `test-lesson-sharing.mjs`: huella fija para una clase sin `pageIds` (valor calculado con el código de `main` y escrito en la prueba) y distinta con `pageIds` |
| C10 | unit + e2e | `test-lesson-sharing.mjs` (marcador y `clase.json` de ida y vuelta) y `test-lessons-share.mjs` (Comunidad con GitHub simulado) |
| C11 | e2e + build | `test-pages-page.mjs`: cero peticiones fuera de `127.0.0.1` al abrir las 6. Tras `npm run build`: chunk inicial `< 350 kB` o `≤ base + 1 kB` (lee `dist/`), `package.json` sin dependencias nuevas frente a `main` y miniaturas `≤ 40 KB` |
| C12 | script + unit | `node scripts/capture-pages.mjs` regenera las 6 y falla si alguna pasa de 40 KB. `test-pages-page.mjs` comprueba que existe `public/pages/<id>.png` para cada id del registro |

Las suites nuevas o ampliadas se registran en `scripts/check.sh` (`test-pages-page.mjs` en `TEST_E2E_CMD`). Ninguna toca red real: `installFakeGithub` y bloqueo de cualquier origen externo.

## Pasos

### Fase 0 · Contratos (secuencial, en `ai-skills-studio-006`)
1. `docs:` spec y plan aprobados más la entrada en `features.json` (`estado: plan`).
2. `feat(paginas): contratos de páginas de referencia`:
   - `pageIds.ts`, `types/pages.ts`, `pageCatalog.ts` (6 entradas con textos provisionales) y `pageRegistry.ts`.
   - Las 6 plantillas como esqueleto mínimo que ya exporta `Template` con `@container`.
   - `PagesPage` y `PagePreviewModal` como esqueletos con la firma final y los `data-testid` del contrato.
   - Ruta `paginas` en `App.tsx`, `workspace.ts` y `NavbarActiveSkill.tsx`.
3. `feat(clases): pageIds en clases, saneo y compartir`: `types/lessons.ts`, `lessonsStore.ts`, `lessonSharing.ts`, y `pageIds: []` por defecto en `LessonEditor.tsx` (solo lo necesario para compilar).
4. Verificación: `npx tsc -b` y `./scripts/check.sh --rapido` en verde. La huella de una clase sin `pageIds` se compara con la de `main` antes de seguir.

### Fase 1 · En paralelo (4 sub-worktrees desde la Fase 0, archivos disjuntos)
| Worktree / rama | Propiedad exclusiva | Entrega |
|-----------------|---------------------|---------|
| `../ai-skills-studio-006-wt1` · `feat/wt1-paginas-galeria` | `src/components/pages/**` | Galería, chips, tarjeta, modal (portal, foco atrapado, Esc, ↑/↓), marco Escritorio/Móvil, «Usar esta página» con pestañas y copiar, «Componentes que usa», «Clases que la usan», error con reintentar y movimiento reducido |
| `../ai-skills-studio-006-wt2` · `feat/wt2-paginas-plantillas` | `src/components/page-templates/**`, `src/data/pageCatalog.ts` | Las 6 plantillas reales con el kit y *container queries*, prompts en inglés, descripciones, apodos y `componentIds` exactos |
| `../ai-skills-studio-006-wt3` · `feat/wt3-paginas-clases` | `src/components/lessons/{pickers,LessonEditor,LessonDetail}.tsx` | `PagePicker`, selector en el editor y sección «Páginas de referencia» en el detalle con la modal diferida |
| `../ai-skills-studio-006-wt4` · `feat/wt4-paginas-pruebas` | `scripts/test-pages-page.mjs` (nuevo), `scripts/test-{lessons-store,lesson-sharing,lessons,lessons-share}.mjs`, `scripts/check.sh` | Pruebas de C1–C12 según el contrato de DOM. Las unitarias deben pasar ya; las E2E se validan en la Fase 2 |

Reglas de la Fase 1:
- Cada worktree enlaza `node_modules` con `mklink /J`.
- Solo `tsc -b` y `check.sh --rapido`, nunca `check.sh` completo en paralelo (puertos fijos).
- Si un worktree necesita cambiar un contrato, se detiene y me avisa a mí (orquestador), sin editar archivos ajenos.
- Commits atómicos con Conventional Commits (`feat`, `fix`, `docs`, `chore`; nunca `test`).

### Fase 2 · Integración (secuencial, en `ai-skills-studio-006`)
5. Fusionar `wt2`, `wt1`, `wt3` y `wt4`, en ese orden (las plantillas primero, para que la modal y las pruebas vean el contenido real).
6. `feat(scripts): capturas de las páginas de referencia`: `scripts/capture-pages.mjs` y `public/pages/*.png` (`≤ 40 KB`).
7. `npm run build` (medir el chunk inicial) y `./scripts/check.sh` completo con las variables del simulador:
   `VITE_CATALOG_REPO=test/catalog VITE_GITHUB_CLIENT_ID=test-client-id VITE_GITHUB_OAUTH_URL=https://oauth.example.test/api/github-oauth`.
   Los fallos se corrigen con commits `fix(...)` en la 006.
8. Revisión visual con Playwright en los 4 anchos (capturas temporales en `shots/`, sin commitear).
9. Quitar las junctions (`cmd /c rmdir <wt>\node_modules`), borrar los sub-worktrees y sus ramas.

### Fase 3 · Cierre
10. Subagente `revisor` independiente contra la spec, las reglas y las pruebas, y corrección de bloqueantes.
11. `docs:` `features.json` (`pasa: true` solo con prueba en verde, `estado: revision`), `TASKS.md`, `PROGRESS.md` y `ARCHITECTURE.md` (registro de páginas y relación con clases).
12. `git push` de la rama y PR hacia `main` con las 5 secciones de `github-workflow-standards`, enlazando la spec y la prueba de cada criterio.

## Riesgos
- **Chunk inicial.** `App.tsx` y `NavbarActiveSkill.tsx` solo ganan un `lazy()` y un ítem. `lessonsStore` importa solo `pageIds.ts` (unos 150 B). Se mide en el paso 7 contra la base de `main`.
- **Container queries y la clase `.grid` del kit estático** (lección aprendida): en las plantillas se usa `[display:grid]` en vez de `grid`.
- **Estilos del kit `public/assets/` sobre las plantillas:** pueden heredar estilos globales (enlaces, `h1`, botones). Se mitiga con clases explícitas, y se comprueba en la revisión visual y en las miniaturas.
- **Huella `contentHash`:** cualquier cambio de orden o de campo marcaría como «cambios sin compartir» todas las clases ya compartidas. Lo cubre la prueba con la huella fija de C9.
- **Portapapeles en Playwright:** necesita `context.grantPermissions(['clipboard-read','clipboard-write'])` y `localhost`. El caso denegado se simula sustituyendo `navigator.clipboard.writeText` con `addInitScript`.
- **Pruebas intermitentes heredadas** (Datepicker) y **puertos fijos:** `check.sh` completo solo en la Fase 2, en un único worktree.
- **`test-interactions-playwright.mjs` depende de `.env.local`:** se ejecuta con las variables del simulador (ver `docs/TASKS.md`).
