# Reglas del frontend

Estas reglas son obligatorias para toda la interfaz de Códice Studio (`src/`, `index.html`, `vite.config.ts`) y mandan sobre cualquier skill visual de terceros. El detalle tecnológico del stack vive en `docs/stack/frontend.md`.

## Identidad visual y Anti-Slop (`tasteskill 2.5.1`)
- **Paleta oficial Cyber Dark:**
  - Fondo base carbón profundo: `#0a0d14` (`--p-bg`).
  - Superficie pizarra elevada: `#121722` (`--p-surface`).
  - Texto primario: `#f1f5f9` (`--p-ink`); texto secundario: `#94a3b8` / `#9aa0a8`.
  - **Único color de acento interactivo:** cian `#0ea5e9` (`--p-accent` / `--p-action`).
- **Prohibiciones visuales estrictas:**
  - Prohibido introducir degradados decorativos, brillos neón arbitrarios o superficies violeta/púrpura o naranja en el cromo de la aplicación.
    - **Excepción acotada (autorizada por el humano el 2026-11-26, spec 005 C9):** en la sección «Guía vs. sin guía» de la portada (`#guia`, `src/components/guide/`) se permite un único halo radial cian `#0ea5e9` detrás del escenario, con opacidad `≤ 15 %` y solo en el modo «Con guía». No se extiende a ninguna otra pieza.
  - Prohibido usar emojis como iconos de botones, pestañas o controles interactivos; usa exclusivamente iconos de `lucide-react` o SVGs propios con atributos accesibles.

## Dos mundos de assets (Zona blindada)
- El árbol `public/assets/{components,effects,backgrounds,diagrams}` (junto con el resto del sistema estático en `public/assets/`) es un kit externo preservado intacto tanto en desarrollo como en build por el plugin `preservePublicKitAssets` de `vite.config.ts`.
- **Prohibido mover, editar, renombrar o importar desde TypeScript archivos de `public/assets/`** sin autorización humana explícita. Los assets compilados por Vite salen hacia `dist/bundle/` para no colisionar con `public/assets/`.

## Navegación y presupuesto de bundle (`< 350 kB`)
- **Sin router externo:** no instales `react-router` ni librerías equivalentes. Las vistas se declaran en `AppPageRoute` (`src/types/workspace.ts`) y se montan de forma diferida con `React.lazy` + `Suspense` desde `src/App.tsx`.
- **Presupuesto de carga:** el bundle inicial de aplicación debe mantenerse por debajo de `350 kB` sin comprimir. Conserva la separación manual de chunks `vendor-react` (`react`, `react-dom`) y `vendor-icons` (`lucide-react`) configurada en `vite.config.ts`, y pide permiso antes de plantear cualquier dependencia nueva (`AGENTS.md`).
  - **Dependencia de animación autorizada (2026-11-27, rama `feat/hero-forge`):** se autoriza el uso de `motion` (`motion/react` con `LazyMotion` + `domMax`) exclusivamente dentro de componentes cargados con `React.lazy` para no superar el presupuesto inicial de `350 kB`, manteniendo obligatoriamente la paleta Cyber Dark (`#0a0d14` / `#121722`) y el acento único cian `#0ea5e9` junto con el respeto a `prefers-reduced-motion`.

## Componentes, datos y estado
- Componentes enfocados, cohesivos y con una sola responsabilidad; reutiliza las piezas existentes antes de crear variantes duplicadas.
- **Cero `fetch` directo en componentes visuales:** ninguna llamada a GitHub ni a Gemini puede vivir en componentes de presentación. Toda comunicación externa pasa por `src/services/` y hooks de dominio como `src/hooks/useCatalog.ts`.
- Contempla siempre de forma explícita los **tres estados de interfaz**: cargando, vacío y error legible en español (orientado a qué ocurrió y cómo recuperarse, sin volcar trazas técnicas).
- **Persistencia local segura:** todo dato hidratado desde `localStorage` debe validarse en la frontera con *type guards* explícitos (p. ej. `isValidSkillDocumentArray` en `src/utils/securityHardening.ts`) y almacenarse bajo claves versionadas (`ai_skills_studio_*_v1` o sufijo de versión explícito).

## Kit UI propio (`src/components/ui-kit/`)
- Todo componente dentro de `src/components/ui-kit/` debe ser **código 100% propio** de Códice Studio: prohibido copiar código fuente, estilos o capturas de terceros.
- Cada pieza del kit exporta su función `Demo()`, se registra en `src/data/componentRegistry.ts` y mantiene sincronizada su vista previa estática.
- Siempre que cambie el aspecto visual de un componente del kit, regenera su miniatura (`≤ 40 KB`) ejecutando `node scripts/capture-components.mjs`.

## Accesibilidad
- HTML5 semántico estricto: declara siempre `type="button"` en botones que no envían formularios, asocia `<label>` reales en cada control de entrada y proporciona textos `alt` significativos.
- Contraste mínimo **WCAG AA ≥ 4.5:1** sobre `#0a0d14` y `#121722`, y anillos de foco siempre visibles (`focus-visible:outline` con `#0ea5e9`).
- Navegación completa por teclado: cierre con `Escape` en cajones/modales, devolución del foco al disparador y atributos `aria-expanded`, `aria-controls` y regiones `aria-live` para avisos dinámicos.

## Lecciones aprendidas
- 2026-11 · Colisión de .grid con el kit estático → En Tailwind dentro de este proyecto, usar [display:grid] en lugar de la clase grid cuando el stylesheet de public/assets/ esté presente.
- 2026-11 · Capas superpuestas bajo la cabecera fija (z-50) → Renderizar Drawer, visores y diálogos modales mediante createPortal sobre document.body.
- 2026-11 · Montaje del diagrama estático en React → Inicializar window.TPDiagram.mount() dentro de useEffect con limpieza destroy(), nunca depender de DOMContentLoaded.
- 2026-11 · `main > section` del kit estático (`public/assets/system.css`) gana a Tailwind → Sus reglas no van en ninguna capa CSS y fijan altura de pantalla y relleno a toda sección hija directa de `<main>`. En plantillas y vistas propias, envolver el contenido de `<main>` en un `<div>` en vez de colgar `<section>` directamente de `<main>`.
