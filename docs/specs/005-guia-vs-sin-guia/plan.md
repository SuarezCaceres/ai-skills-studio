# Plan · 005 · Guía vs. sin guía en la portada

> Estado: aprobado (ampliación C8–C12 aprobada el 2026-11-26, ver al final)

## Enfoque
Se reinterpreta el componente externo `spatial-product-showcase` con la tecnología real del proyecto: **React 19 + TypeScript + Tailwind v4 y animaciones CSS** (sin framer-motion ni shadcn). Se divide en **5 fases Zero-Conflict**:
- **Fase 0:** contratos y marcadores provisionales.
- **Fase 1:** 3 worktrees en paralelo (componente, captura y pruebas).
- **Fase 2:** integración.
- **Fase 3:** documentación.
- **Fase 4:** revisión independiente y PR.

Las coordenadas de la guía salen del **mismo script que hace la captura**, en porcentajes, así que foco y tooltip no se desalinean al escalar. Los hotspots se generan como **módulo TypeScript** y no como JSON, porque `tsconfig` no tiene `resolveJsonModule` y no hace falta tocarlo.

**Alternativas descartadas:**
- **framer-motion:** dependencia nueva que pone en riesgo el presupuesto de bundle `< 350 kB`.
- **Captura con `public/`:** el kit estático vive en `public/assets/` (zona blindada); `src/assets/` hace que Vite la versione y la emita a `dist/bundle/`.
- **Maqueta en JSX:** menos fiel que la captura real.
- **Registrar la pieza en el kit UI:** es una sección de portada, no un componente reutilizable.

## Rama base y requisito previo
- La 004 (`feat/004-retiro-workspace-inspector-codigo`) tiene cambios sin commitear en `InformativeLandingSection.tsx`. **La rama `feat/005-guia-vs-sin-guia` se crea después de commitear la 004**: desde `main` si la 004 ya se integró, o desde la punta commiteada de la 004 si aún no.
- Esta spec y este plan son archivos nuevos y no chocan con la 004. Se commitean como primer commit de la rama 005 (`docs(spec): define 005 guia vs sin guia`).

## Zonas blindadas y compatibilidad
- **Intactas (0 ediciones):** `public/assets/*`, `vite.config.ts`, `index.html`, `api/*`, `src/utils/securityHardening.ts`, `.github/workflows/*`, `docs/rules/*` y `tsconfig*.json`.
- **`package.json`:** sin dependencias nuevas. Solo se añade la suite a `"test"`.
- **CSS del kit estático:** usar `[display:grid]` en lugar de `grid` (lección de `docs/rules/frontend.md`). La sección reutiliza las clases de maquetación de la portada (`section`, `wrap`) para mantener el ritmo vertical.

## Contrato de la Fase 0 (congelado antes de paralelizar)

### Tipos: `src/types/guideShowcase.ts` *(nuevo)*
```ts
export type GuideMode = 'sin-guia' | 'con-guia';
export type GuideStepId = 'buscar' | 'filtrar' | 'abrir';

/** Caja en porcentajes (0–100) relativa a la captura completa. */
export interface GuideBox { x: number; y: number; w: number; h: number }

export interface GuideHotspot {
  id: GuideStepId;
  step: 1 | 2 | 3;
  box: GuideBox;
}

export interface GuideCaptureMeta {
  /** Tamaño real en px de la captura (para aspect-ratio). */
  width: number;
  height: number;
  hotspots: readonly [GuideHotspot, GuideHotspot, GuideHotspot];
}
```

### Archivos provisionales (los sustituye `wt2`)
- `src/assets/guide/catalogo.webp`: un placeholder carbón de `1280×800`, generado con canvas de Chromium.
- `src/data/guideShowcaseHotspots.ts`: `export const GUIDE_CAPTURE: GuideCaptureMeta` con cajas aproximadas y la cabecera `// Generado por scripts/capture-guide-showcase.mjs — no editar a mano`.

### Contrato de DOM (lo consumen `wt1` y `wt3`)
| Elemento | Atributos fijos |
|---|---|
| Sección | `<section id="guia" aria-labelledby="guia-h" data-mode="sin-guia\|con-guia">` |
| Título | `<h2 id="guia-h">` |
| Selector | `role="radiogroup"` + `aria-label="Modo de la vista previa"`, con dos `role="radio"` de nombre accesible «Sin guía» / «Con guía»; flechas ←/→ cambian de opción (*roving tabindex*) |
| Marco | `figure[data-testid="guia-marco"]` con `img` (`alt` descriptivo), `data-paused="true\|false"` |
| Marcadores | `[data-testid="guia-paso"][data-step="1\|2\|3"]`, solo en el DOM en modo «Con guía» |
| Tooltip | `[data-testid="guia-tooltip"]` con texto «Paso N de 3 · …» |
| Anuncio | `[data-testid="guia-anuncio"]` con `aria-live="polite"` |
| Lista | `ul[data-testid="guia-lista"]` (obstáculos o ventajas según el modo) |
| CTA | `button` de nombre «Ir al catálogo» (`type="button"`) |

**Avance:** intervalo de `3500 ms`. Las pruebas lo controlan con `page.clock`.

## Fases y asignación de worktrees (Zero-Conflict)

| Fase | Worktree / Responsable | Propiedad exclusiva de archivos | Entregable y criterio |
|---|---|---|---|
| **Fase 0 · Contratos** *(Secuencial · Orquestador)* | `feat/005-guia-vs-sin-guia` | `src/types/guideShowcase.ts` *(nuevo)*, `src/data/guideShowcaseHotspots.ts` *(nuevo, provisional)*, `src/assets/guide/catalogo.webp` *(nuevo, provisional)*, `docs/specs/005-guia-vs-sin-guia/*`, `docs/features.json` | Tipos y contrato de DOM congelados. Placeholders que compilan. `npx tsc -b && ./scripts/check.sh --rapido` en verde. |
| **Fase 1 · Oleada A** *(Paralelo)* | `feat/wt1-guia-componente` · skill `frontend-proyecto` | `src/components/GuideContrastShowcase.tsx` *(nuevo)*, `src/data/guideShowcaseCopy.ts` *(nuevo: textos, listas y tooltips por paso)*, `src/index.css` *(solo añadir bloque `/* 005 guía */`)*, `src/components/InformativeLandingSection.tsx` *(solo montar la sección tras el hero)* | Sección completa según el contrato de DOM: selector accesible, modo atenuado/iluminado, foco + tooltip porcentuales, avance pausable (hover, `focus-within`, `visibilitychange`), `prefers-reduced-motion` con los 3 marcadores estáticos, apilado en móvil, fallback si falla la imagen, limpieza de temporizadores y CTA `onNavigatePage('catalogo')`. Paleta solo con `--p-*` y `#0ea5e9`, sin degradados. `npm run build` en verde (C1–C6). |
| **Fase 1 · Oleada B** *(Paralelo)* | `feat/wt2-guia-captura` · skill `pruebas-proyecto` | `scripts/capture-guide-showcase.mjs` *(nuevo)*, `scripts/lib/guide-showcase-fixture.mjs` *(nuevo: catálogo simulado de ~6 skills plausibles)*, `src/assets/guide/catalogo.webp` *(sustituye el placeholder)*, `src/data/guideShowcaseHotspots.ts` *(regenerado)* | Script al estilo de `capture-components.mjs`: Vite en un puerto propio, Chromium en `1280×800`, GitHub interceptado (falla si algo escapa a `api.github.com`), animaciones desactivadas y fondo decorativo oculto. Mide las cajas del buscador (`aria-label="Buscar en el catálogo"`), las categorías (`role="group"` + `aria-label="Categorías"`) y la primera tarjeta, y las escribe en %. Convierte a WebP con `canvas.toDataURL('image/webp')` (sin dependencias) y falla si supera 60 KB (C7, parte de C6). |
| **Fase 1 · Oleada C** *(Paralelo)* | `feat/wt3-guia-pruebas` · skill `pruebas-proyecto` | `scripts/test-guide-showcase.mjs` *(nuevo)*, `scripts/check.sh` *(añadir a `TEST_E2E_CMD`)*, `package.json` *(solo el script `"test"`)* | Suite E2E (build + preview, GitHub simulado con `installFakeGithub`) en `1440/1024/768/390`. Cubre C1–C5 con `page.clock` para el avance y `reducedMotion: 'reduce'` para C4. Para C6: cero peticiones fuera del origen local en la sección, WebP ≤ 60 KB, chunk inicial < 350 kB leído de `dist/` y sin colores de acento fuera de la paleta en estilos computados. Para C7: valida que los hotspots estén en `0–100 %`. Se escribe contra el contrato de DOM y se valida con `node --check` (ejecución real en la Fase 2). |
| **Fase 2 · Integración** *(Secuencial · Orquestador)* | Merge `wt1` + `wt2` + `wt3` → `feat/005-guia-vs-sin-guia` | Corrección de desajustes en los archivos de cualquiera de los tres (ya no hay paralelismo) | `./scripts/check.sh` completo en verde. Prueba visual en Chromium en los 4 anchos: foco alineado sobre la captura real y tooltip dentro del marco. Commit `feat(landing): añade seccion guia vs sin guia`. |
| **Fase 3 · Documentación** *(Secuencial · Orquestador)* | `feat/005-guia-vs-sin-guia` | `docs/project/ARCHITECTURE.md`, `docs/features.json`, `docs/TASKS.md`, `docs/PROGRESS.md` | Sección y script de captura documentados; criterios en `pasa: true` solo con prueba en verde; estado `revision`. |
| **Fase 4 · Revisión y PR** | Subagente `revisor` + Orquestador | Solo lectura | Auditoría contra spec, `docs/rules/*` y zonas blindadas (incluye `git diff main -- package.json vite.config.ts index.html public/assets`). Corregir bloqueantes, `./scripts/check.sh` y PR de 5 secciones (`github-workflow-standards`). |

## Matriz de pruebas
| Criterio | Tipo | Dónde |
|---|---|---|
| C1 | E2E Playwright, 4 anchos | `scripts/test-guide-showcase.mjs` |
| C2 | E2E | `scripts/test-guide-showcase.mjs` |
| C3 | E2E (clic + teclado + `aria-live`) | `scripts/test-guide-showcase.mjs` |
| C4 | E2E con `page.clock` + contexto `reducedMotion: 'reduce'` | `scripts/test-guide-showcase.mjs` |
| C5 | E2E | `scripts/test-guide-showcase.mjs` |
| C6a | E2E (red, tamaño del WebP, chunk diferido propio, no regresión del chunk inicial, estilos computados) + revisión de `package.json` | `scripts/test-guide-showcase.mjs`, `revisor` |
| C6b | Medida del chunk inicial en `dist/` (hoy solo `aviso`: deuda preexistente) | `scripts/test-guide-showcase.mjs` |
| C7 | Ejecución del script + validación de hotspots | `scripts/capture-guide-showcase.mjs` (falla por sí solo si hay red real o > 60 KB) + `scripts/test-guide-showcase.mjs` |

## Pasos ejecutables (un commit limpio por hito)
1. **Previo:** commitear la 004 y crear `feat/005-guia-vs-sin-guia` → commit `docs(spec): define 005 guia vs sin guia`.
2. **Fase 0:** tipos y placeholders; `npx tsc -b && ./scripts/check.sh --rapido` → commit `feat(contracts): congela contrato de la seccion guia`.
3. **Fase 1:** lanzar en paralelo `wt1`, `wt2` y `wt3` (worktrees aislados, cada uno con su lista de archivos). `wt1` y `wt2` validan con `npm run build`; `wt3`, con `node --check`. Cada uno commitea en su rama `feat/wt<N>-…`.
4. **Fase 2:** fusionar las tres ramas, `./scripts/check.sh` completo y prueba visual → commit `feat(landing): añade seccion guia vs sin guia`.
5. **Fase 3:** documentación → commit `docs: registra 005 en arquitectura y progreso`.
6. **Fase 4:** `revisor` independiente, correcciones y PR de 5 secciones.

## Riesgos
- **El placeholder desalinea a `wt1` durante la Fase 1:** el foco se verá desplazado hasta integrar la captura real. Es aceptable, porque las coordenadas son porcentuales y la alineación se comprueba en la Fase 2.
- **Soporte de `canvas.toDataURL('image/webp')`:** Chromium lo soporta. Si devolviera PNG, el script falla con un mensaje claro en vez de guardar un formato equivocado.
- **Captura no determinista (fuentes, fecha, datos):** fijar la fecha como en `capture-components.mjs`, esperar a `document.fonts.ready` y usar el fixture propio de `wt2`.
- **Choque con estilos del kit estático (`.grid`, `.section`):** usar `[display:grid]` y comprobar en los 4 anchos.
- **Duración de la suite E2E:** `page.clock` evita esperas reales de 3,5 s; objetivo < 30 s.
- **La 004 sigue abierta:** si cambia `InformativeLandingSection.tsx` después de crear la 005, hay que rebasar antes de la Fase 2.

---

# Ampliación 2026-11-26 · Rediseño en espejo (C8–C12)

> Estado: **aprobado** (2026-11-26).

## Requisito previo: rebase sobre la 004
La 005 parte de `9f7580d`. Antes de tocar código se rebasa `feat/005-guia-vs-sin-guia` sobre la punta final de `feat/004-retiro-workspace-inspector-codigo`, una vez publicada en su PR. Los conflictos previsibles son `InformativeLandingSection.tsx` (montaje de `#guia`) y los documentos de `docs/`. `180a2a9` (tipo `test`) no se reescribe: se corrige con squash al fusionar el PR.

## Enfoque
- La sección se divide en **piezas con propiedad disjunta**:
  - `GuideContrastShowcase` (orquestación, estado y maquetación).
  - `GuideCaptureFrame` (marco de navegador con la captura, el foco y el tooltip, extraído tal cual del componente actual).
  - `GuideMediaSlot` (escenario: círculo, halo, anillo y píldora; recibe el medio como `children`).
  - `GuideModePanel` (texto del modo y tarjeta de barras).
- **Estilos:** cada pieza importa su propio CSS (`src/components/guide/*.css`) para que vaya en el chunk diferido y no haya choques en `src/index.css`. El bloque `/* 005 guía */` actual de `index.css` se migra en la Fase 0.
- **Reloj único:** el avance pasa de `setInterval` a un `setTimeout` que guarda el **tiempo restante**. Así, la barra CSS (`animation-play-state: paused`) y el JS no se desincronizan al pausar. La barra recibe `--guia-dur` (duración) y `--guia-delay` (desfase negativo = tiempo ya transcurrido) para retomar en su punto. Las pruebas lo controlan con `page.clock`, igual que ahora.
- **Espejo:** en `≥ lg` (1024 px), una rejilla de 2 columnas con `order` y una transición CSS `transform + opacity` (~500 ms) disparada por `data-mode`. Por debajo de `lg`, columna única con el escenario arriba. Se usa `[display:grid]`.
- **Animaciones:** solo `@keyframes` (giro del anillo, latido del punto, llenado de barras, fundido del espejo). Todas se anulan bajo `@media (prefers-reduced-motion: reduce)` y además con `data-reduced="true"` en la sección.
- Sin dependencias nuevas. Iconos de `lucide-react` (`Check`, `CircleHelp`, `ChevronRight`, `Pause`, `Play`).

## Contrato de la Fase 0 (congelado antes de paralelizar)

### Tipos (añadidos a `src/types/guideShowcase.ts`)
```ts
export type GuideStep = 1 | 2 | 3;
export type GuideRowState = 'atascada' | 'pendiente' | 'activa' | 'completa';

export interface GuideMediaSlotProps {
  mode: GuideMode;
  reduced: boolean;
  /** Paso activo (solo relevante en «Con guía» sin movimiento reducido). */
  step: GuideStep;
  /** Medio centrado sobre el círculo: hoy, <GuideCaptureFrame>; en el futuro, un video por modo. */
  children: React.ReactNode;
}

export interface GuideModePanelProps {
  mode: GuideMode;
  reduced: boolean;
  step: GuideStep;
  /** La guía está pausada por cualquier causa (congela la barra activa). */
  paused: boolean;
  /** Pausa manual (estado del botón, aria-pressed). */
  userPaused: boolean;
  /** ms ya transcurridos del paso activo al pausar o reanudar (para --guia-delay). */
  elapsedMs: number;
  /** Cambia cuando el paso arranca de nuevo (reinicia la animación de la barra). */
  cycleKey: number;
  onTogglePause: () => void;
  onOpenCatalog: () => void;
}
```

### Textos nuevos (añadidos a `src/data/guideShowcaseCopy.ts`)
- `GUIDE_STEP_LABELS: Record<GuideStepId, string>` = «1 · Buscar», «2 · Filtrar por categoría», «3 · Abrir una skill».
- `GUIDE_COPY.status`: «A ciegas» en «Sin guía», «Guiado · Paso N de 3» en «Con guía» y «Guiado · 3 pasos» con movimiento reducido.
- No se añaden más textos: etiqueta = `GUIDE_COPY.modes[mode]`, título = `GUIDE_COPY.listLabels[mode]` y descripción = `GUIDE_COPY.captions[mode]`.

### Contrato de DOM (además del de la Fase 0 original, que se mantiene)
| Elemento | Atributos fijos |
|---|---|
| Sección | `section#guia[data-mode][data-reduced="true\|false"]` |
| Escenario (C9) | `[data-testid="guia-escenario"][data-mode]` que contiene `figure[data-testid="guia-marco"]` |
| Anillo (C9) | `[data-testid="guia-anillo"][data-girando="true\|false"]`, `aria-hidden` |
| Halo (C9) | `[data-testid="guia-halo"]`, `aria-hidden`, solo en «Con guía» |
| Píldora (C10) | `[data-testid="guia-estado"]` con el texto del estado |
| Panel (C8) | `[data-testid="guia-panel"]` con la etiqueta, el título `h3` y la descripción del modo |
| Tarjeta (C11) | `[data-testid="guia-tarjeta"]` que contiene `ul[data-testid="guia-lista"]` |
| Fila (C11) | `li[data-testid="guia-fila"][data-estado="atascada\|pendiente\|activa\|completa"]` |
| Barra (C11) | `[data-testid="guia-barra"]` dentro de cada fila, `aria-hidden` |
| Pausa | `button[data-testid="guia-pausa"][aria-pressed]` dentro de la tarjeta |
| CTA | `button` de nombre accesible «Ir al catálogo» dentro de la tarjeta (la `›` es `aria-hidden`) |

## Fases y asignación (Zero-Conflict)

| Fase | Responsable | Propiedad exclusiva de archivos | Entregable |
|---|---|---|---|
| **B · Rebase** *(Orquestador)* | `feat/005-guia-vs-sin-guia` | Resolución de conflictos | Rama sobre la 004 final; `./scripts/check.sh --rapido` en verde |
| **0 · Contratos** *(Orquestador)* | `feat/005-guia-vs-sin-guia` | `src/types/guideShowcase.ts`, `src/data/guideShowcaseCopy.ts`, `src/components/GuideContrastShowcase.tsx` (reloj con tiempo restante y maquetación en espejo), `src/components/guide/GuideCaptureFrame.tsx` *(extraído)*, stubs de `GuideMediaSlot.tsx` y `GuideModePanel.tsx`, migración del bloque CSS de `index.css`, excepción en `docs/rules/frontend.md`, spec/plan, `docs/features.json` | Compila, la portada se ve con los stubs y `check.sh --rapido` está en verde. Commit `feat(contracts): congela contrato del rediseño de la guía` |
| **C · wt1** *(paralelo)* | `feat/wt1-guia-escenario` · `frontend-proyecto` + `ui-ux-pro-max` | `src/components/guide/GuideMediaSlot.tsx`, `src/components/guide/guideStage.css` | Círculo, anillo punteado (quieto y gris / girando y cian), halo `≤ 15 %` solo en «Con guía», píldora con punto que late, recorte sin desbordar a 390 px, movimiento reducido (C9, C10, C12) |
| **C · wt2** *(paralelo)* | `feat/wt2-guia-tarjeta` · `frontend-proyecto` + `ui-ux-pro-max` | `src/components/guide/GuideModePanel.tsx`, `src/components/guide/guideCard.css` | Texto del modo y tarjeta de barras (atascadas con «?» / pasos que se llenan con `--guia-dur` y `--guia-delay`, ✓ en completadas), pausa y CTA dentro de la tarjeta, movimiento reducido (C11, C12) |
| **C · wt3** *(paralelo)* | `feat/wt3-guia-pruebas-espejo` · `pruebas-proyecto` | `scripts/test-guide-showcase.mjs` | Adaptar C2/C3 a la tarjeta y añadir C8 (posición x del escenario frente al panel en 1440/1024, apilado en 768/390), C9 (`data-girando`, halo, opacidad), C10 (texto de la píldora sincronizado con el paso), C11 (estados de fila con `page.clock`, congelación al pausar y retoma del tiempo restante) y C12 (contexto `reducedMotion`). Validación con `node --check` |
| **D · Integración y cierre** *(Orquestador + `revisor`)* | `feat/005-guia-vs-sin-guia` | Ajustes en cualquier archivo de la 005 | Fusión de wt1–wt3, `./scripts/check.sh` completo, revisión visual en 4 anchos, `revisor` independiente, `docs/features.json` (C8–C12), `ARCHITECTURE.md`, `TASKS.md` y `PROGRESS.md` |
| **E · PR** | Orquestador | — | Cuando la 004 esté en `main`: rebase, `check.sh` y PR de 5 secciones con squash |

## Matriz de pruebas (ampliación)
| Criterio | Tipo | Dónde |
|---|---|---|
| C8 | E2E: `boundingBox().x` del escenario frente al panel por modo en 1440/1024; apilado y `scrollWidth ≤ innerWidth` en 768/390 | `scripts/test-guide-showcase.mjs` |
| C9 | E2E: `data-girando`, presencia del halo y opacidad computada `≤ 0,15`, marco dentro del escenario | `scripts/test-guide-showcase.mjs` |
| C10 | E2E: texto de la píldora por modo y por paso con `page.clock` | `scripts/test-guide-showcase.mjs` |
| C11 | E2E con `page.clock`: `data-estado` de las filas en los pasos 1→2→3→1; con la pausa, el paso no avanza; al reanudar avanza tras el tiempo restante (< intervalo completo) | `scripts/test-guide-showcase.mjs` |
| C12 | E2E en contexto `reducedMotion: 'reduce'`: `animation-name: none` en el anillo, el punto y las barras; 3 marcadores; píldora «Guiado · 3 pasos» | `scripts/test-guide-showcase.mjs` |

## Riesgos (ampliación)
- **El reloj con tiempo restante y `page.clock`:** `Date.now()` está bajo `page.clock`, así que se usa para medir el tiempo transcurrido.
- **Un CSS importado desde un componente diferido** puede pasar un instante sin estilo (FOUC) al cargar el chunk. Es aceptable: la sección ya está bajo `Suspense`.
- **El escaneo de paleta (C6a)** puede marcar el gris pizarra o el halo: el gris tiene croma bajo y el halo es cian, así que debería pasar; si no, se ajusta el umbral solo en la prueba, justificándolo.
- **El chunk inicial** no cambia: todo el código nuevo vive en el chunk diferido de la sección.
