# Spec · 005 · Guía vs. sin guía en la portada

> Estado: aprobada (ampliación C8–C12 aprobada el 2026-11-26)

## Problema
Quien llega por primera vez a Códice Studio se encuentra con un Catálogo lleno de controles (buscador, chips de categorías, tarjetas, acciones de auditoría e inspección) sin saber por dónde empezar. La portada explica *qué* hace el producto, pero no transmite *cómo se siente* usarlo con alguien que te acompañe paso a paso frente a usarlo a ciegas.

El punto de partida fue un componente externo de exhibición de producto (`spatial-product-showcase`: auriculares izquierdo/derecho con framer-motion, shadcn, degradados azul/esmeralda e imágenes de un CDN de terceros). Su **idea de interacción** (un selector de dos lados que transforma la escena) encaja; su **tecnología y estética no**: framer-motion no está instalado y comprometería el presupuesto de bundle `< 350 kB`, shadcn y `/components/ui` no existen en este proyecto, y la paleta viola `docs/rules/frontend.md` (Cyber Dark con único acento cian `#0ea5e9`, sin degradados decorativos ni brillos neón).

## Objetivo
Añadir a la portada una sección **ilustrativa** que muestre la **misma pantalla real del Catálogo** en dos modos conmutables:
- **Sin guía:** la página tal cual, atenuada, con los obstáculos que siente alguien nuevo.
- **Con guía:** la misma captura iluminada en cian, con un foco y un tooltip que recorren automáticamente 3 pasos (buscar → filtrar por categoría → abrir una skill), como si alguien te enseñara a usarla.

La sección termina con una acción **«Ir al catálogo»**. No se construye un recorrido guiado real dentro de la app (queda como posible spec futura).

## Alcance
- **Incluye:**
  - Componente propio `GuideContrastShowcase` (React 19 + TypeScript + Tailwind v4, animaciones solo con CSS) montado en `InformativeLandingSection` justo después del hero y antes de «Inspección bajo demanda».
  - Cabecera: etiqueta «Primeros pasos», título «La misma página, con y sin alguien que te guíe» y subtítulo «Sin guía, cada botón es una incógnita. Con guía, sabes qué hacer en cada paso.» (pulibles en revisión).
  - Selector accesible de dos opciones **«Sin guía» / «Con guía»** dentro de la sección (no fijo a la ventana), con estado inicial «Sin guía» y cambio solo manual.
  - Captura real del Catálogo dentro de un marco de navegador, generada por un script reproducible con GitHub simulado y guardada como WebP local en `src/assets/guide/`, junto a las coordenadas de los 3 puntos de interés en un módulo TypeScript generado (`src/data/guideShowcaseHotspots.ts`).
  - Lista cualitativa de diferencias por modo (sin porcentajes ni métricas inventadas).
  - Botón «Ir al catálogo» que navega con `onNavigatePage('catalogo')`.
  - Suite Playwright nueva en 4 anchos conectada a `./scripts/check.sh`.
- **No incluye:**
  - Un recorrido guiado real (tour/onboarding) dentro de Catálogo u otras páginas.
  - Dependencias nuevas (`framer-motion`, `shadcn`, librerías de tours o de imágenes).
  - Imágenes remotas o de terceros; cambios en zonas blindadas (`public/assets/*`, `vite.config.ts`, CSP de `index.html`, `api/*`, `securityHardening.ts`, workflows) ni en `docs/rules/*`.
  - Registrar la pieza en el kit UI (`src/components/ui-kit/`, `componentRegistry.ts`): es una sección de portada, no un componente reutilizable del kit.

## Historias de usuario
- Como visitante nuevo de la portada, quiero comparar cómo se ve el Catálogo sin ayuda y con alguien que me guía para entender rápido qué pasos seguir.
- Como visitante que navega con teclado o lector de pantalla, quiero cambiar de modo y escuchar en qué paso está la guía sin depender del ratón ni de la animación.
- Como visitante con movimiento reducido activado, quiero ver los pasos de la guía sin animaciones automáticas.
- Como persona del equipo de Códice, quiero regenerar la captura con un solo comando cuando cambie el Catálogo, sin tocar GitHub real.

## Criterios de aceptación
Cada criterio debe poder comprobarse con una prueba. Se copian a `docs/features.json`.
- **C1:** Dada la portada, cuando se carga en `1440`, `1024`, `768` y `390` px, entonces la sección `#guia` aparece inmediatamente después del hero y antes de `#inspector`, con su título, la captura local del Catálogo dentro del marco y el selector, sin desbordamiento horizontal ni errores de consola o CSP.
- **C2:** Dada la sección recién cargada, entonces el modo activo es «Sin guía» (`aria-checked="true"`), la captura se muestra atenuada, se ve la lista de obstáculos y no hay ningún marcador de paso visible.
- **C3:** Dada la sección en «Sin guía», cuando el usuario elige «Con guía» con clic o con teclado (flechas + Espacio/Enter), entonces el selector refleja el cambio, la captura se ilumina, aparecen el foco y el tooltip del paso 1 de 3 sobre el buscador, la lista cambia a las ventajas y una región `aria-live="polite"` anuncia «Paso 1 de 3: …».
- **C4:** Dado el modo «Con guía», cuando transcurre el intervalo de avance, entonces la guía pasa 1 → 2 → 3 → 1 actualizando foco, tooltip y anuncio; al pasar el ratón o mover el foco dentro del marco el avance se pausa y se reanuda al salir; con `prefers-reduced-motion: reduce` se muestran los 3 marcadores numerados a la vez sin avance automático.
- **C5:** Dada la sección, cuando el usuario pulsa «Ir al catálogo», entonces la aplicación muestra la página del Catálogo.
- **C6a:** Dado el build de producción, entonces `package.json` no gana dependencias, la sección no hace peticiones a dominios externos, la captura pesa `≤ 60 KB`, la sección se carga en un chunk diferido propio sin engordar el chunk inicial respecto a la base (`≤ base + 2 kB`) y los colores de acento usados son exclusivamente el cian `#0ea5e9` sobre la paleta Cyber Dark.
- **C6b:** Dado el build de producción, entonces el chunk inicial pesa `< 350 kB`. *Depende de la deuda preexistente del bundle registrada en `docs/TASKS.md` (la base `9f7580d` ya pesaba 382,3 kB); queda abierto hasta pagarla.*
- **C7:** Dado el script `node scripts/capture-guide-showcase.mjs`, cuando se ejecuta, entonces regenera `src/assets/guide/catalogo.webp` y `src/data/guideShowcaseHotspots.ts` con GitHub interceptado (cero peticiones a `api.github.com`), y las 3 cajas de puntos de interés quedan dentro del rango `0–100 %` de la captura.

## Ampliación 2026-11-26 · Rediseño en espejo (C8–C12)

> Estado de la ampliación: **aprobada** (2026-11-26). Decisiones cerradas con el humano el 2026-11-26.

Se rediseña la composición de `#guia` tomando como **referencia de composición e interacción** un showcase de producto con selector Left/Right: objeto centrado sobre un círculo con halo, anillo exterior punteado que gira, píldora de estado bajo el círculo, tarjeta con barras de carga y un enlace, y selector en píldora centrado debajo. Al cambiar de lado, los bloques se intercambian en espejo. **No** se copia su tecnología (framer-motion, shadcn, imágenes de CDN) ni su paleta (azul/esmeralda). La captura del Catálogo y la guía de 3 pasos (foco, tooltip, `aria-live` y pausa) **se conservan**.

**Cambios respecto a lo anterior:**
- La lista de obstáculos/ventajas se sustituye por una **tarjeta de barras**. Se conserva `ul[data-testid="guia-lista"]` como lista de filas de la tarjeta, así que C2 («se ve la lista de obstáculos») y C3 («la lista cambia a las ventajas») se comprueban sobre esa tarjeta.
- El botón «Pausar guía»/«Reanudar guía» y el CTA «Ir al catálogo ›» pasan **dentro de la tarjeta**. El nombre accesible del CTA sigue siendo «Ir al catálogo»; la flecha es decorativa.
- La cabecera («Primeros pasos», título y subtítulo) va centrada arriba, y el selector «Sin guía | Con guía» queda centrado debajo, en una fila propia (bajo el escenario en móvil y bajo las dos columnas en `≥ 1024` px, para que no salte de lado al pulsarlo), con el mismo `role="radiogroup"`.
- **Excepción de paleta:** solo en «Con guía» se permite un halo radial sutil cian (opacidad `≤ 15 %`) detrás del círculo. El humano autorizó registrarla en `docs/rules/frontend.md`, acotada a esta sección.

**Criterios nuevos:**
- **C8 · Espejo:** Dada la sección en `≥ 1024` px, cuando el modo es «Sin guía», entonces el escenario queda a la izquierda y el bloque de texto y la tarjeta a la derecha; cuando es «Con guía», se intercambian (texto a la izquierda, escenario a la derecha). En `768` y `390` px no hay espejo: todo se apila con el escenario arriba, sin desbordamiento horizontal. El cambio de modo desliza y funde los bloques en unos `500 ms` solo con CSS; con `prefers-reduced-motion: reduce`, el cambio es instantáneo.
- **C9 · `GuideMediaSlot`:** Dada la sección, entonces el medio (marco de navegador 16:9 con la captura y su capa de guía) se renderiza dentro de un componente aislado `GuideMediaSlot` (`[data-testid="guia-escenario"]`), centrado encima de un círculo con un anillo punteado (`[data-testid="guia-anillo"]`) que asoma por los bordes. En «Sin guía», el anillo es gris pizarra, está quieto (`data-girando="false"`), no hay halo y la captura sigue atenuada. En «Con guía», el anillo es cian, gira despacio (`data-girando="true"`) y aparece el halo (`[data-testid="guia-halo"]`, opacidad `≤ 0,15`). El slot recibe el medio como hijo, de modo que en el futuro pueda recibir un video por modo sin tocar el escenario (hoy **no** se implementa video).
- **C10 · Píldora de estado:** Dada la sección, entonces bajo el círculo hay una píldora `[data-testid="guia-estado"]` que dice «A ciegas» con un punto gris quieto en «Sin guía» y «Guiado · Paso N de 3» con un punto cian que late en «Con guía». N coincide con el paso activo del foco y del tooltip.
- **C11 · Tarjeta de barras:** Dada la tarjeta `[data-testid="guia-tarjeta"]`, entonces:
  - En «Sin guía» muestra 3 filas con los obstáculos de `GUIDE_LISTS['sin-guia']`, cada una con una barra «atascada» (`data-estado="atascada"`) y un «?».
  - En «Con guía» muestra 3 filas «1 · Buscar», «2 · Filtrar por categoría» y «3 · Abrir una skill», cada una con su ventaja de `GUIDE_LISTS['con-guia']` debajo. La fila del paso activo tiene `data-estado="activa"` y su barra se llena durante `GUIDE_STEP_INTERVAL_MS`, sincronizada con el avance automático. Las filas anteriores quedan `completa` con ✓ y las siguientes, `pendiente`. Al volver al paso 1, todas se reinician.
  - Al pausar (ratón, foco, botón, pestaña oculta o sección fuera de pantalla) la barra se congela y, al reanudar, el avance retoma el **tiempo restante** en lugar de reiniciar el intervalo.
  - Dentro de la tarjeta están el botón «Pausar guía»/«Reanudar guía» (solo en «Con guía» y sin movimiento reducido) y el botón «Ir al catálogo ›». No hay porcentajes ni métricas.
- **C12 · Movimiento reducido:** Dado `prefers-reduced-motion: reduce`, entonces el anillo nunca gira, el punto de la píldora no late, las barras se muestran llenas sin animar, el cambio de modo es instantáneo, en «Con guía» se ven los 3 marcadores estáticos y la píldora dice «Guiado · 3 pasos».

## Casos límite y errores
- **La imagen no carga:** el marco muestra un fondo `--p-surface` con el texto alternativo y la sección sigue siendo usable (selector, listas y CTA).
- **Pantalla estrecha (`390` px):** marco y texto se apilan; el tooltip nunca se sale del marco (se coloca arriba/abajo según espacio) y el foco escala con la captura porque las coordenadas son porcentuales.
- **Pestaña oculta:** el avance automático se detiene con `visibilitychange` para no acumular saltos.
- **Volver a «Sin guía»:** se detiene el temporizador y la guía se reinicia en el paso 1 la próxima vez.
- **Pausa a mitad de paso (C11):** la barra del paso activo se congela en su punto y el avance retoma el tiempo restante al reanudar; nunca salta dos pasos ni reinicia el paso a cero.
- **Escenario estrecho (`390` px):** el círculo y el anillo se recortan dentro del escenario (`overflow` controlado) y nunca generan desbordamiento horizontal del documento.
- **Desmontaje del componente** (navegar fuera de la portada): se limpian temporizadores y oyentes.
- **El Catálogo cambia de aspecto en el futuro:** la captura queda desactualizada hasta regenerarla con el script; los hotspots salen del mismo script, así que no se desalinean.

## Preguntas abiertas
- Ninguna. El 2026-11-25 C6 se dividió en C6a y C6b (decisión del humano) porque el presupuesto del chunk inicial ya se incumplía antes de la 005. Decisiones tomadas en la entrevista del 2026-11-25: solo ilustración (P1a), en la portada tras el hero (P2), pantalla del Catálogo (P3), captura real con capa de guía en JSX (P4a), lista cualitativa sin porcentajes (P5), CSS sin framer-motion (P6), paleta Cyber Dark con selector dentro de la sección (P7), spec propia en rama `feat/005-guia-vs-sin-guia` tras cerrar la 004 (P8), una captura con 3 pasos (P9a), avance automático pausable (P10a), inicio «Sin guía» con cambio manual (P11), CTA «Ir al catálogo» (P12) y textos de cabecera propuestos (P13).
