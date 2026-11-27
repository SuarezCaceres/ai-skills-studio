# Spec · 007 · Páginas de referencia

> Estado: aprobada (2026-11-27; decisiones cerradas con el humano el 2026-11-27 en una sesión de *grilling*, Q1–Q13)

## Problema
Componentes enseña piezas sueltas del kit (un botón, una tarjeta, un formulario), pero quien construye una interfaz con su IA suele partir de una **página completa**: una landing, una tienda, un panel. Hoy Códice Studio no tiene dónde ver cómo se ven esas páginas, copiar un prompt que las describa ni ver el código que las arma con el kit.

Además, quien graba una clase en Códice no puede decir «para este video usé esta página de referencia». Solo puede enlazar skills y componentes, y quien ve la clase no tiene a mano la página de la que se habla.

## Objetivo
- Una página nueva **«Páginas»**, al lado de Componentes, con una galería de plantillas de página hechas con el `ui-kit`. Al pulsar una se abre una ventana con la página en vivo (en escritorio o en móvil) y el botón **«Usar esta página»**, que da su prompt para la IA y su código real.
- Las **clases** pueden enlazar páginas de referencia. Quien ve la clase (y sus videos) abre la página en la misma ventana, sin salir de la clase.

## Alcance
- **Incluye:**
  - Ruta nueva `paginas` en `AppPageRoute`, con entrada «Páginas» justo después de «Componentes» en la barra de módulos y en el menú «UI y conocimiento» de la portada. Página y plantillas con carga diferida.
  - Registro fijo en el repositorio (`src/data/pageRegistry.ts`) con **6 plantillas**, una por categoría: **Landing SaaS**, **Tienda online**, **Dashboard**, **Login/registro**, **Precios** y **Blog/artículo**. Añadir otra es crear su archivo y una entrada en el registro.
  - Cada plantilla es un componente React propio, compuesto con piezas del `ui-kit` y Tailwind v4. Lo que el kit no tenga (barra de navegación, tabla) se escribe dentro de la propia plantilla. Declara los `componentIds` del kit que usa.
  - Galería con chips de categoría (con su número) y tarjetas con miniatura, nombre, apodo («Le dicen: …») y categoría.
  - Ventana modal accesible: vista en vivo de la plantilla dentro de un marco, selector **Escritorio / Móvil** (las plantillas reaccionan al ancho del marco con *container queries*), título, apodo y descripción en español, «Componentes que usa», «Clases que la usan», navegación a la anterior/siguiente y botón **«Usar esta página»** con dos pestañas:
    - **Prompt:** texto en inglés para pegar en una IA, con botón de copiar.
    - **Código:** el TSX real de la plantilla (importado con `?raw`, nunca difiere de lo que se ve), con botón de copiar.
  - Miniaturas generadas desde la propia plantilla (PNG `≤ 40 KB` en `public/pages/<id>.png`), como las del kit.
  - **Clases:** campo `pageIds` (máximo 5). Selector «Páginas de referencia» en el editor, junto al de componentes. En el detalle de la clase, chips que abren la misma modal encima de la clase. Funciona igual en las clases propias y en las de la pestaña Comunidad.
  - Compatibilidad: las clases guardadas, importadas por JSON o compartidas en GitHub sin `pageIds` se leen como `pageIds: []`. Los ids desconocidos se descartan al sanear.
  - Suite Playwright nueva en 4 anchos y casos nuevos en las suites de clases, conectados a `./scripts/check.sh`.
- **No incluye:**
  - Páginas subidas por la comunidad (GitHub, Issues, auditoría): queda para otra spec.
  - Asignar skills o modelos de IA a una página (el `AssignDrawer` de Componentes), descargar archivos o exportar un proyecto.
  - Fotos o imágenes externas dentro de las plantillas: se usan bloques gráficos locales (SVG o CSS).
  - Asociar páginas a una parte concreta de video (`LessonVideo`): la relación es con la clase completa.
  - Chips de páginas en `LessonCard` y filtros por página en las listas de clases o en Comunidad.
  - Componentes nuevos en `src/components/ui-kit/` ni cambios en `componentRegistry.ts`.
  - Dependencias nuevas o cambios en zonas blindadas (`public/assets/*`, `vite.config.ts`, CSP de `index.html`, `api/*`, `securityHardening.ts`, workflows) y en `docs/rules/*`.

## Historias de usuario
- Como persona que construye una interfaz con IA, quiero ver páginas completas de ejemplo y copiar su prompt para pedirle a mi IA algo parecido sin escribirlo desde cero.
- Como desarrolladora, quiero ver y copiar el código real de una página hecha con el kit para partir de él.
- Como persona que revisa una página, quiero verla en escritorio y en móvil y saber qué componentes del kit usa.
- Como autora de una clase, quiero marcar qué páginas de referencia usé al grabar sus videos.
- Como persona que ve una clase, quiero abrir la página de referencia sin salir de la clase ni perder el video.
- Como persona que navega con teclado o lector de pantalla, quiero abrir, recorrer y cerrar la ventana sin ratón.

## Criterios de aceptación
Cada criterio debe poder comprobarse con una prueba. Se copian a `docs/features.json`.
- **C1 · Ruta y navegación:** Dada la aplicación, cuando se elige «Páginas» en la barra de módulos (después de «Componentes»), entonces se muestra la página «Páginas» en `1440`, `1024`, `768` y `390` px, sin desbordamiento horizontal ni errores de consola o CSP.
- **C2 · Galería:** Dada la página «Páginas», entonces hay 6 tarjetas, una por categoría (Landing SaaS, Tienda online, Dashboard, Login/registro, Precios, Blog/artículo), cada una con miniatura local, nombre, apodo y categoría. Los chips de categoría muestran cuántas páginas tiene cada una, y al elegir uno solo quedan sus tarjetas («Todas» las vuelve a mostrar todas).
- **C3 · Modal accesible:** Dada la galería, cuando se activa una tarjeta con clic, Enter o Espacio, entonces se abre un `role="dialog"` con `aria-modal="true"`, nombrado por el título de la página, que muestra la plantilla en vivo, el apodo, la descripción y «Componentes que usa» con enlaces a Componentes. El foco queda atrapado dentro, Esc o el botón de cerrar la cierran y el foco vuelve a la tarjeta que la abrió. Las flechas ↑/↓ y los botones anterior/siguiente pasan a la página vecina dentro de la categoría filtrada, y aparece la posición («2 / 6»).
- **C4 · Escritorio y móvil:** Dada la modal abierta, cuando se elige «Móvil», entonces el marco se estrecha a unos 390 px y la plantilla cambia su composición (por ejemplo, la rejilla pasa a una columna) sin desbordar el marco. «Escritorio» la devuelve. En `390` px de ventana, el marco ocupa todo el ancho disponible sin desbordar.
- **C5 · Usar esta página:** Dada la modal, cuando se pulsa «Usar esta página», entonces aparecen las pestañas «Prompt» y «Código» (`role="tablist"`, navegables con flechas). «Prompt» muestra el prompt en inglés de esa página y «Código» el TSX real de su archivo en `src/components/page-templates/`. Cada una tiene un botón de copiar que escribe en el portapapeles exactamente ese texto y anuncia «Copiado» en una región `aria-live`.
- **C6 · Clases que la usan:** Dada una clase guardada con `pageIds` que incluye una página, cuando se abre esa página en la modal, entonces «Clases que la usan» lista esa clase. Si ninguna la usa, dice que todavía ninguna clase la usa.
- **C7 · Editor de clases:** Dado el editor de una clase, entonces hay un selector «Páginas de referencia» junto al de componentes que permite elegir hasta 5 páginas del registro. Al guardar, la clase conserva `pageIds`. Al pasar de 5 se muestra un error y no se guarda.
- **C8 · Detalle de la clase:** Dado el detalle de una clase (propia o de Comunidad) con páginas de referencia, entonces se ven como chips en una sección «Páginas de referencia». Al pulsar uno se abre la misma modal de C3 encima de la clase, y al cerrarla se sigue en la clase con el foco en el chip y el reproductor de video sin recargar.
- **C9 · Compatibilidad y saneo:** Dada una clase sin `pageIds` (guardada antes de esta funcionalidad, importada por JSON o leída de GitHub), entonces se lee como `pageIds: []` sin errores. Los ids que no están en el registro, repetidos o por encima del máximo se descartan. Exportar e importar por JSON conserva `pageIds`. La huella `contentHash` de una clase con `pageIds` vacío es idéntica a la que tenía antes de esta funcionalidad, así que las clases ya compartidas no aparecen con «cambios sin compartir».
- **C10 · Compartir:** Dada una clase con `pageIds` compartida en GitHub (simulado), cuando se lee desde Comunidad, entonces conserva sus `pageIds` y su detalle los muestra como en C8.
- **C11 · Presupuesto y seguridad:** Dado el build de producción, entonces `package.json` no gana dependencias, la página y las plantillas van en chunks diferidos, el chunk inicial sigue `< 350 kB` (o no crece más de `1 kB` respecto a la base si la base ya lo supera), las miniaturas pesan `≤ 40 KB` cada una y abrir la galería y las 6 plantillas no hace ninguna petición a dominios externos.
- **C12 · Miniaturas reproducibles:** Dado el script de capturas, cuando se ejecuta, entonces regenera las 6 miniaturas de `public/pages/` a partir de las propias plantillas, sin red externa.

> **Ajuste de C1 (2026-11-27, aprobado por el humano):** al integrar `feat/hero-forge` desaparece el desplegable «Módulos» de la portada, donde estaba el enlace «Páginas de referencia» del menú «UI y conocimiento». La entrada queda solo en la barra de módulos. C11 deja de comparar `package.json` con `main` (hero-forge añade `motion`) y comprueba en su lugar que el código de la 007 solo importa `react`, `react-dom` y `lucide-react`.

## Casos límite y errores
- **Id de página desconocido en una clase** (por ejemplo, una plantilla retirada): no se muestra el chip y no se rompe el detalle. El editor lo quita al guardar.
- **Portapapeles no disponible o denegado:** el botón de copiar avisa «No se pudo copiar, selecciona el texto» y el texto sigue seleccionable.
- **Error al cargar una plantilla diferida:** la modal muestra un aviso dentro del marco con opción de reintentar, sin cerrarse ni romper la página.
- **Filtro con una sola página:** anterior/siguiente se desactivan y la posición dice «1 / 1».
- **Movimiento reducido:** abrir y cerrar la modal y cambiar de Escritorio a Móvil es instantáneo, sin animación.
- **Modal abierta encima de una clase con video en reproducción:** el video no se desmonta. La modal no pausa ni reinicia el reproductor.
- **Plantilla con formularios (Login, Precios):** los envíos se bloquean (`preventDefault`); no navegan ni hacen peticiones.
- **Enlaces dentro de una plantilla:** son `#` inertes; nunca cambian la ruta de la aplicación.
- **Clase compartida por una versión anterior de la app:** no trae `pageIds` y se lee como `[]` (C9).

## Preguntas abiertas
- Ninguna. Q1–Q13 se cerraron en la sesión de *grilling* del 2026-11-27.
