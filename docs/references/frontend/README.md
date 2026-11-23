# Referencias de Frontend

> **Cuándo consultar este índice:** al crear o modificar vistas en `src/components/`, añadir piezas al UI Kit, ajustar estilos o integrar recursos del kit estático en `public/assets/`.

## Materiales reales en el repositorio

1. **Sistema de diseño base — [`design-system/ai-skills-studio/MASTER.md`](../../../design-system/ai-skills-studio/MASTER.md)**
   - Guía de referencia sobre escala de espaciado, radios, sombras y estados de interacción para herramientas de desarrollo.
   - **Advertencia obligatoria:** tanto la paleta original de ese archivo (`#22C55E` verde sobre `#0F172A`) como su par tipográfico inicial (`JetBrains Mono` + `IBM Plex Sans`) quedaron **sustituidos en producción por la paleta carbón + cian (`#0ea5e9`), las fuentes `Geist` + `Geist Mono` y las directrices de `docs/rules/frontend.md`**, que tienen prioridad absoluta.

2. **Registro central del UI Kit — [`src/data/componentRegistry.ts`](../../../src/data/componentRegistry.ts)**
   - Fuente única de verdad de los 20 componentes propios del catálogo UI.
   - Muestra el patrón exacto de carga diferida de demos (`import.meta.glob('../components/ui-kit/*.tsx')`), lectura del código fuente real en texto plano (`?raw`) y declaración estructurada de garantías de accesibilidad (`a11y`).

3. **Implementaciones accesibles del UI Kit — [`src/components/ui-kit/`](../../../src/components/ui-kit/)**
   - 20 componentes React autocontenidos (`Accordion.tsx`, `Alerts.tsx`, `Avatar.tsx`, `Drawer.tsx`, `Forms.tsx`, etc.) que exportan una función `Demo`.
   - Sirven como ejemplo canónico de navegación por teclado, roles y atributos ARIA (`aria-expanded`, `aria-controls`, `role="alert"` / `role="status"`), manejo de foco y comunicación de estado sin depender únicamente del color.
   - Si añades o alteras visualmente un componente del kit, regenera sus miniaturas en `public/components/*.png` con `node scripts/capture-components.mjs`.

4. **Kit editorial estático `tasteskill 2.5.1` — [`public/assets/`](../../../public/assets/) y [`vite.config.ts`](../../../vite.config.ts)**
   - Hojas de estilo, efectos, fondos e iconos estáticos que conviven con Tailwind CSS v4 (configurado sin Preflight en `src/index.css`).
   - Revisa `preservePublicKitAssets()` en `vite.config.ts` antes de cambiar rutas `assets/*` en `index.html`, para no romper la carga directa en desarrollo ni el empaquetado de producción.
