# Spec · 006 · Efectos: estilos y animaciones en Componentes

> Estado: aprobada

## Problema
La página **Componentes** solo enseña piezas de interfaz (botones, formularios, navegación…). Quien quiere pedirle a una IA un *look* concreto («vidrio esmerilado», «neo-brutalismo») o un movimiento concreto («marquee», «shimmer») no tiene dónde ver cómo es ni con qué palabras pedirlo. Acaba describiéndolo a ojo y la IA devuelve otra cosa.

## Objetivo
Dentro de Componentes aparece una pestaña **Efectos** con dos grupos, **Estilos** y **Animaciones**. Cada efecto se abre con un **cuadro en vivo** que muestra cómo se ve o cómo se mueve, una explicación corta, un **prompt en español listo para copiar** y pegar en una IA, y el código real del efecto. Igual que los componentes, se le pueden asignar skills y modelos y lo pueden mencionar las clases.

## Alcance
- **Incluye:**
  - Selector «Componentes | Efectos» arriba de la página Componentes; por defecto, «Componentes».
  - **8 estilos:** Glassmorphism, Neo-brutalism, Mesh gradient, Grain texture, Claymorphism, Dark mode premium, Swiss style, Editorial.
  - **10 animaciones:** Fade-up al hacer scroll, Stagger (aparición escalonada), Marquee, Shimmer/skeleton, Hover lift, Typewriter, Borde degradado giratorio, Contador numérico, Botón magnético, Revelado de texto.
  - Por efecto: nombre, apodo en lenguaje llano («Le dicen: el efecto vidrio esmerilado»), descripción, cuadro en vivo, prompt en español copiable, código real (`?raw`), notas de accesibilidad, miniatura generada y asignación de skills/modelos (mismo flujo que los componentes).
  - Las animaciones que ocurren una sola vez (Fade-up, Stagger, Typewriter, Contador, Revelado de texto) llevan un botón **«Repetir»**.
  - Respeto de `prefers-reduced-motion`: las animaciones muestran su estado final quieto.
- **No incluye:**
  - Prompts en inglés ni traducción automática.
  - Editor o ajustes de los efectos (colores, velocidad…).
  - Librerías de animación nuevas (framer-motion, GSAP…): todo con CSS y React propios.
  - Cambios en Catálogo, Códice, portada o `api/`.

## Historias de usuario
- Como persona del equipo, quiero ver en vivo cómo es un estilo o una animación para saber si es lo que busco.
- Como persona del equipo, quiero copiar un prompt en español que lo describa con precisión para pegarlo en mi IA y obtener ese efecto.
- Como autor de una clase, quiero enlazar un efecto desde la clase igual que enlazo un componente.

## Criterios de aceptación
- **C1:** Dada la página Componentes, cuando se pulsa «Efectos» en el selector (clic o teclado), entonces la lista lateral muestra solo los grupos **Estilos** (8) y **Animaciones** (10) en ese orden, las cifras de cabecera cuentan efectos, y al volver a «Componentes» se ve el kit de siempre sin efectos mezclados; sin desbordamiento ni errores de consola/CSP en 1440/1024/768/390 px.
- **C2:** Dado cualquiera de los 18 efectos, cuando se elige, entonces el detalle muestra su apodo, nombre, descripción, cuadro en vivo, prompt en español no vacío, código real, notas de accesibilidad y miniatura (≤ 40 KB).
- **C3:** Dado el prompt de un efecto, cuando se pulsa su botón de copiar, entonces el portapapeles recibe exactamente ese prompt y se anuncia la copia de forma accesible.
- **C4:** Dada una animación de una sola vez, cuando se pulsa «Repetir», entonces vuelve a empezar; y con `prefers-reduced-motion: reduce` ninguna animación se mueve (sin `animation`/`transition` activas en el cuadro) y se ve su estado final.
- **C5:** Dado un efecto elegido desde fuera de la pestaña (por ejemplo, desde una clase), cuando se abre Componentes, entonces se activa sola la pestaña «Efectos» con ese efecto marcado; y asignar/desasignar skills o modelos funciona igual que con un componente.
- **C6:** Sin dependencias nuevas ni peticiones externas, las demos se cargan en chunks diferidos, el chunk inicial no crece respecto a `main` (< 350 kB) y las suites existentes de Componentes siguen en verde.

## Casos límite y errores
- Si la demo de un efecto falla, se ve el aviso «No se pudo dibujar…» con «Reintentar», como en los componentes.
- Si el portapapeles no está disponible, el botón de copiar avisa del fallo (comportamiento actual de `CopyButton`).
- Glassmorphism necesita fondo de color: la demo trae su propio fondo, no depende del de la página.
- `backdrop-filter` no soportado: la tarjeta cae a un fondo translúcido sin desenfoque y sigue legible.
- Una asignación guardada antes con un id que no existe sigue sin romper nada (comportamiento actual).
- Al cambiar de pestaña con filtros puestos (buscador, categoría), los filtros se limpian para no dejar la lista vacía.

## Preguntas abiertas
- Ninguna. Decisiones del humano (2026-11-27): pestaña «Efectos» dentro de Componentes; 8 estilos + 10 animaciones; prompt en español copiable.
