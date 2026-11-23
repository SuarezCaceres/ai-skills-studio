# Stack del frontend

Las reglas obligatorias de interfaz, accesibilidad y diseño viven en `docs/rules/frontend.md`. Este documento describe las tecnologías, versiones y rutas reales del frontend de Códice Studio.

| Aspecto | Elección | Versión |
|---------|----------|---------|
| Lenguaje | TypeScript (`strict: true`, `target: ES2022`) | `~5.7.2` |
| Framework | React (`flushSync` inicial en `main.tsx` + `React.lazy` y `Suspense` en `App.tsx`) | `19.0.0` |
| Estilos / UI | Tailwind CSS vía `@tailwindcss/vite` (sin Preflight) + kit editorial estático `tasteskill 2.5.1` (`public/assets/`) | `^4.0.9` |
| Iconos | `lucide-react` + SVGs propios (`src/components/BrandIcons.tsx` y `public/assets/icons/`) | `^0.475.0` |
| Estado | React hooks (`useCatalog`, ruta `AppPageRoute` en `App.tsx`) + almacenes en `localStorage` saneados con *type guards* | Integrado |
| Cliente HTTP | `fetch` nativo encapsulado en `src/services/` (con caché TTL y control de *rate limit*) | Web API |
| Pruebas unitarias y de servicios | Scripts ESM en Node (`node:assert/strict` + compilación al vuelo con `esbuild`) | Node `20+` (`22+` recomendado en local) |
| Pruebas E2E / interfaz | Playwright sobre Chromium *headless* en 4 anchos obligatorios (`1440`, `1024`, `768`, `390`) | `^1.65.0` |
| Bundler y gestor de paquetes | Vite (`@vitejs/plugin-react`) gestionado con `npm` | Vite `^6.2.0` / Node `20+` |

## Comandos
| Acción | Comando |
|--------|---------|
| Desarrollo (servidor Vite en puerto `5173`) | `npm run dev` |
| Build de producción (tipos + bundle en `dist/`) | `npm run build` (`tsc -b && vite build`) |
| Lint | *Pendiente de configurar* (registrado en `docs/TASKS.md`) |
| Verificación de tipos | `npx tsc -b` |
| Pruebas rápidas (tipos + servicios en Node, sin navegador) | `./scripts/check.sh --rapido` |
| Verificación completa (tipos + build + 13 suites Node/Playwright) | `./scripts/check.sh` (o `npm test`) |
| Regenerar miniaturas `.png` de los 20 componentes del UI Kit | `node scripts/capture-components.mjs` |

## Estructura de carpetas en `src/` y `public/`
El código del cliente vive en la raíz bajo `src/` y los activos estáticos bajo `public/` (no existe carpeta `apps/web/`):

```text
src/
  main.tsx                    montaje inicial con flushSync sobre #root
  App.tsx                     navegación por estado (AppPageRoute), layout global y Suspense
  index.css                   importación de capas Tailwind v4 y estilos globales sin Preflight
  components/
    catalog/                  Catálogo comunitario, detalle de skill, publicación, votos, traducción y perfiles
    components/               Explorador del UI Kit, vista previa, código y cajón de asignaciones
    lessons/                  Códice -> Clases (editor, reproductor YouTube bajo demanda y pestaña Comunidad)
    studio/                   Barra de skill activa y estados vacíos del Studio
    ui-kit/                   20 componentes React accesibles autocontenidos (exportan Demo)
    *.tsx                     Vistas principales (CodiceStudio, UnifiedProjectStudio, InformativeLandingSection, AIModelBenchmarkPanel, etc.)
  config/                     Configuración de dominio (p. ej. team.ts)
  data/                       Catálogos estáticos (aiModelsData.ts, componentRegistry.ts, frameworkCollectionsData.tsx, stylePresets.ts)
  hooks/                      Hooks reutilizables de aplicación (useCatalog.ts)
  services/                   Clientes de GitHub, OAuth, subida de skills, compartición de clases, traducción, voz, RAR y YouTube
  types/                      Contratos TypeScript (catalog.ts, lessons.ts, skill.ts, uiComponents.ts, workspace.ts)
  utils/                      Endurecimiento de seguridad (securityHardening.ts) y copias de trabajo (workingCopy.ts)

public/
  assets/                     Kit editorial estático tasteskill 2.5.1 (system.css, system.js, backgrounds, components, diagrams, effects, icons, layout, moments, motion, objects, photos, scenes, ui)
  components/                 20 miniaturas PNG generadas para el catálogo de componentes UI
```

## Skills disponibles para el frontend
> **Prioridad:** las reglas de `docs/rules/frontend.md` mandan siempre sobre cualquier skill local o global de terceros.

| Skill | Para qué | Fuente |
|-------|----------|--------|
| `frontend-proyecto` | Convenciones específicas de UI, componentes, estilos y estado de este repositorio | `.agents/skills/frontend-proyecto/` |
| `github-workflow-standards` | Estándar obligatorio de commits semánticos y Pull Requests de 5 secciones | `.agents/skills/github-workflow-standards/` |
| `modern-web-guidance` | Consulta actualizada de APIs web modernas, CSS, formularios y accesibilidad | Plugin global (compatible; subordinada a `docs/rules/frontend.md`) |
| `ui-ux-pro-max` | Patrones de diseño de interfaces, contraste, jerarquía visual e interacción | Skill global (compatible; prevalece paleta carbón + cian `#0ea5e9` de `docs/rules/frontend.md`) |
