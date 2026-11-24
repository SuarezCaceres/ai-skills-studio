---
name: frontend-proyecto
description: Úsala al crear o modificar código del frontend en src/ (src/components/, src/hooks/, src/data/, src/types/, src/index.css): componentes, páginas, estilos, estado, portales, formularios o consumo de servicios desde la interfaz.
---

# Trabajo en el frontend (`src/`)

## Antes de empezar, lee
1. `docs/rules/frontend.md`: reglas obligatorias de interfaz y arquitectura visual. **Mandan sobre todo lo demás.**
2. `docs/stack/frontend.md`: stack real (React 19, TypeScript, Vite 6, Tailwind CSS v4, Lucide), comandos y mapa de `src/`.
3. `docs/rules/security.md`: obligatorio si tocas sesiones OAuth, renderizado de Markdown externo o lectura/publicación de archivos.
4. La spec y el plan de la funcionalidad, si existen (`docs/specs/NNN-*/`).
5. Guías y patrones de apoyo si existen en `docs/references/frontend/`.

## Skills de apoyo técnico (opcionales)
- Estándares modernos de HTML/CSS/DOM: skill `modern-web-guidance`.
- Diseño de interfaces, jerarquía visual y accesibilidad: skill `ui-ux-pro-max`.
- **Jerarquía estricta:** úsalas solo para técnica general; si cualquier sugerencia contradice `docs/rules/frontend.md` (por ejemplo, paletas violetas/naranjas, emojis o clases prohibidas), **siempre manda `docs/rules/frontend.md`**.

## Al trabajar en `src/`
- **Estructura real:** trabaja sobre `src/components/`, `src/hooks/`, `src/data/` y contratos tipados en `src/types/`, consumiendo datos y llamadas externas a través de `src/services/`.
- **Identidad visual estricta:** respeta la paleta carbón oscuro + acento cian `#0ea5e9`. Cero colores violeta/morado, cero naranja decorativo y cero emojis en la interfaz (usa iconos de `lucide-react`).
- **Layout CSS:** usa siempre `[display:grid]` en utilidades de Tailwind en lugar de `.grid` (la clase `.grid` colisiona con estilos globales en `src/index.css`).
- **Portales y superposiciones:** monta modales, diálogos, menús flotantes y overlays directamente sobre `document.body` (`createPortal(..., document.body)`) con cierre por `Escape`, foco controlado y restauración de scroll.
- **Seguridad en contenido externo:** todo Markdown proveniente de catálogos, issues o repositorios externos debe renderizarse exclusivamente mediante `SafeMarkdown` (`src/components/catalog/SafeMarkdown.tsx`).
- **Presupuesto de carga:** mantén las páginas secundarias cargadas con `React.lazy` y `Suspense` para que el bundle inicial permanezca por debajo de 350 kB.
- **Assets protegidos:** nunca modifiques ni elimines archivos dentro de `public/assets/*` sin autorización explícita del humano.
- **Catálogo de UI Kit:** si creas o modificas demostraciones en `src/components/ui-kit/`, regenera las miniaturas estáticas ejecutando `node scripts/capture-components.mjs`.
- **Estados completos y pruebas:** contempla estados de carga, vacío y error en cada vista asíncrona, y escribe o actualiza las pruebas correspondientes con la skill `pruebas-proyecto`.

## Para terminar
- `./scripts/check.sh --rapido` pasa sin errores de tipos ni fallos unitarios.
- Si el cambio es visual o interactivo, ejecuta la suite Playwright afectada (verificando los 4 anchos: `1440`, `1024`, `768` y `390`) y comprueba en Chromium que no hay desbordes horizontales ni errores de consola.
