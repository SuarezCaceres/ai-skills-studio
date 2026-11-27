# Plan · 006 · Efectos: estilos y animaciones en Componentes

> Estado: aprobado
> Spec: `docs/specs/006-efectos-estilos-animaciones/spec.md` (aprobada el 2026-11-27).

## Enfoque
Los efectos son **entradas del mismo registro** que los componentes (`COMPONENT_REGISTRY`), con un campo `kind` que los distingue. Así heredan sin código nuevo: detalle, código real `?raw`, miniatura, asignación de skills/modelos, `PreviewBoundary` y la relación inversa con las clases (C5). La página solo filtra el registro según la pestaña activa.

Cada efecto es un archivo propio en **`src/components/effects/`** (no en `ui-kit/`, que es el kit de componentes) que exporta `Demo()`. Cada archivo es **autocontenido**: trae su CSS en un `<style>` con clases prefijadas (`fx-<id>-…`) y su `@media (prefers-reduced-motion: reduce)`, para que el código que se enseña sea exactamente lo que hace falta copiar. La CSP ya permite `style-src 'unsafe-inline'` y `img-src data:`: no se toca `index.html`.

## Contratos (`src/types/uiComponents.ts`)
```ts
export type UiEntryKind = 'componente' | 'efecto';
export type UiComponentCategory = 'Navegación' | … | 'Comunicación' | 'Estilos' | 'Animaciones';
export const UI_COMPONENT_CATEGORIES   // sin cambios: las 6 del kit
export const UI_EFFECT_CATEGORIES: UiComponentCategory[] = ['Estilos', 'Animaciones'];

interface UiComponentMeta {
  …
  kind: UiEntryKind;
  /** Solo efectos: cómo se le dice en lenguaje llano («el efecto vidrio esmerilado»). */
  nickname?: string;
  /** Solo efectos: prompt en español listo para pegar en una IA. */
  prompt?: string;
}
```
`componentsByCategory(entries, categories)` recibe la lista de categorías del grupo (por defecto, la del kit). `sourcePath` pasa a reflejar la carpeta real (`ui-kit/` o `effects/`). Las asignaciones (`ComponentAssignment`) no cambian: el id de un efecto funciona igual.

## Archivos por módulo
| Módulo | Archivos | Cambio |
|---|---|---|
| Tipos y registro | `src/types/uiComponents.ts`, `src/data/componentRegistry.ts` | `kind`, `nickname`, `prompt`, categorías de efectos; segundo `import.meta.glob` sobre `effects/*.tsx`; 18 entradas nuevas en `META` con prompt en español |
| Efectos (estilos) | `src/components/effects/{Glassmorphism,NeoBrutalism,MeshGradient,GrainTexture,Claymorphism,DarkPremium,SwissStyle,Editorial}.tsx` | Nuevos |
| Efectos (animaciones) | `src/components/effects/{FadeUp,Stagger,Marquee,Shimmer,HoverLift,Typewriter,GradientBorder,CountUp,MagneticButton,TextReveal}.tsx` + `effects/ReplayFrame.tsx` (botón «Repetir» compartido: remonta la demo con un `key`) | Nuevos |
| Página | `src/components/components/ComponentsPage.tsx` | Pestañas «Componentes \| Efectos» (`role="tablist"`, flechas izquierda/derecha, Inicio/Fin); filtra el registro por `kind`; cifras de cabecera por pestaña; si el `selectedId` llega de fuera y es de la otra pestaña, cambia de pestaña sola; al cambiar de pestaña elige el primero del grupo |
| Lista lateral | `src/components/components/ComponentSidebar.tsx` | Recibe `categories` y una etiqueta (`Componentes`/`Efectos`); se remonta por pestaña (`key`), con lo que los filtros se limpian |
| Detalle | `src/components/components/ComponentDetail.tsx` | Si la entrada trae `nickname`/`prompt`: línea «Le dicen: …» sobre el nombre y bloque «Prompt para tu IA» con `CopyButton` (ya anuncia la copia y el fallo) |
| Miniaturas | `scripts/capture-components.mjs`, `public/components/<id>.png` ×18 | El script pulsa la pestaña «Efectos» para las entradas `kind: 'efecto'`; captura con movimiento reducido (estado final) |
| Pruebas | `scripts/test-effects-page.mjs` (nueva, puerto `5192`), `scripts/check.sh` | Suite nueva en `TEST_E2E_CMD` |
| Clases | `src/components/lessons/pickers.tsx` (solo si hace falta) | Revisar que el selector de componentes de una clase muestre también los efectos con su grupo; sin cambios si ya agrupa por categoría |
| Docs | `docs/project/ARCHITECTURE.md`, `docs/features.json`, `docs/TASKS.md`, `docs/PROGRESS.md` | Registro de la carpeta `effects/` y del campo `kind` |

## Efectos y qué hace su cuadro
- **Estilos:** Glassmorphism (tarjeta translúcida + desenfoque sobre manchas de color propias, con *fallback* sin `backdrop-filter`), Neo-brutalism (bordes 3 px, sombra dura desplazada, botón que «se hunde» al pulsar), Mesh gradient (varias manchas radiales superpuestas), Grain texture (ruido SVG `feTurbulence` en línea sobre degradado), Claymorphism (volumen con sombras interiores y exteriores suaves), Dark mode premium (superficies escalonadas, borde de 1 px, tipografía fina), Swiss style (rejilla, tipografía grande alineada a la izquierda, un solo color de acento), Editorial (titular serif, capitular, columnas de texto).
- **Animaciones:** Fade-up al hacer scroll (caja con scroll propio e `IntersectionObserver`), Stagger, Marquee (pausa al pasar el ratón o al enfocar), Shimmer/skeleton, Hover lift, Typewriter, Borde degradado giratorio, Contador numérico, Botón magnético (sigue al puntero dentro de un radio; sin efecto con teclado salvo el foco), Revelado de texto. «Repetir» en Fade-up, Stagger, Typewriter, Contador y Revelado.
- Los colores de las demos son el **contenido** del efecto (manchas del mesh, amarillo del brutalismo…), no el cromo de la app: la regla de «único acento cian» se sigue aplicando a pestañas, lista, bordes y botones de la página.

## Pruebas por criterio
| Criterio | Prueba |
|---|---|
| C1 | `test-effects-page.mjs`: pestañas por clic y por flechas; grupos y recuento 8 + 10 en orden; cifras de cabecera; vuelta al kit sin efectos (y `test-components-page.mjs` sigue viendo sus 20); `scrollWidth ≤ ancho` y cero errores de consola/CSP en 1440/1024/768/390 |
| C2 | Recorre los 18: apodo, nombre, descripción, `[data-preview-stage]` con contenido, prompt no vacío, código con `export function Demo`, notas a11y; tamaño de `public/components/<id>.png` ≤ 40 KB (lectura de disco) |
| C3 | Copiar el prompt de 2 efectos y comparar `navigator.clipboard.readText()` con el texto mostrado; mensaje de estado visible |
| C4 | «Repetir» remonta la demo (el nodo cambia y el texto del typewriter/contador vuelve al inicio); contexto con `reducedMotion: 'reduce'`: `getAnimations()` del cuadro vacío en los 18 y estado final visible (contador en su cifra final, texto completo) |
| C5 | Clase guardada en `localStorage` que menciona un efecto → «Ver componente» abre Componentes en la pestaña Efectos con él marcado; asignar y desasignar una skill con el `installFakeGithub` de siempre |
| C6 | los archivos de `effects/` solo importan `react`, `lucide-react` o archivos propios (no se compara `package.json`, que puede crecer por otras ramas como `feat/hero-forge`); ninguna petición fuera de `127.0.0.1` (salvo Google Fonts, que la app ya pide); los efectos no aparecen en el chunk `index-*.js` (búsqueda de un prompt en `dist/`); chunk inicial < 350 kB; `test-components-page.mjs` y `test-components-assign.mjs` en verde |

## Ejecución
Secuencial, en esta rama y sin worktrees. Los efectos son 18 archivos independientes pero pequeños, y la integración (página, detalle, captura) depende del contrato. Paralelizar no compensa: la última vez la junction de `node_modules` dio problemas al quitar worktrees.

1. Contrato + registro + `ReplayFrame` + 1 estilo y 1 animación de muestra → `npx tsc -b`.
2. Pestañas, lista lateral y detalle (prompt y apodo) → comprobación manual en `npm run dev`.
3. Los 16 efectos restantes.
4. `capture-components.mjs` + 18 miniaturas.
5. `test-effects-page.mjs` + alta en `check.sh` → `./scripts/check.sh --rapido` y completo.
6. Docs, subagente `revisor` independiente y PR de 5 secciones con `github-workflow-standards`.

Commits atómicos por paso (`feat(componentes)`, `feat(efectos)`, `chore(scripts)`, `docs`).

## Autorizaciones
- **No** añade dependencias, **no** toca `api/`, `index.html`, `vite.config.ts`, `public/assets/` ni `docs/rules/`.
- Se modifica `scripts/check.sh` solo para añadir la suite nueva a `TEST_E2E_CMD` (no es zona blindada).
