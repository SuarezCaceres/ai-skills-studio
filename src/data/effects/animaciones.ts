import type { EffectMeta } from './types';

/** Efectos del grupo «Animaciones», en el orden en que se muestran. */
export const EFFECT_ANIMATIONS: EffectMeta[] = [
  {
    id: 'fade-up',
    kind: 'efecto',
    file: 'FadeUp',
    name: 'Fade-up al hacer scroll',
    category: 'Animaciones',
    nickname: 'la aparición al bajar',
    description:
      'Cada bloque aparece subiendo un poco y ganando opacidad justo cuando entra en pantalla. Sirve para dar ritmo a páginas largas sin distraer.',
    prompt:
      'Haz que cada tarjeta aparezca al entrar en pantalla: parte con opacidad 0 y 24 px más abajo y llega a su sitio en 600 ms con cubic-bezier(0.22, 1, 0.36, 1). Usa IntersectionObserver con un umbral del 25 % y deja de observar cada tarjeta en cuanto aparece, para que la animación ocurra una sola vez. Con prefers-reduced-motion: reduce muéstralas ya visibles, sin transición ni desplazamiento.',
    a11y: [
      'La caja con scroll propio es una región con nombre y se puede enfocar con Tab para desplazarla con las flechas.',
      'El contenido está en el HTML desde el principio: los lectores de pantalla lo leen entero aunque aún no haya aparecido.',
      'Con movimiento reducido no hay observador ni transición: todas las tarjetas se ven desde el inicio.',
    ],
  },
  {
    id: 'stagger',
    kind: 'efecto',
    file: 'Stagger',
    name: 'Stagger',
    category: 'Animaciones',
    nickname: 'la cascada',
    description:
      'Los elementos de una lista o rejilla aparecen uno detrás de otro, con un pequeño retraso entre cada uno. Úsalo al cargar una colección para que se lea en orden.',
    prompt:
      'Anima la entrada de los 6 elementos de la rejilla en cascada: cada uno pasa de opacidad 0, 16 px más abajo y escala 0,97 a su estado normal en 500 ms con cubic-bezier(0.22, 1, 0.36, 1). Escalona el inicio con animation-delay: calc(var(--i) * 90ms), pasando el índice de cada elemento en la variable CSS --i, y usa animation-fill-mode: both. Con prefers-reduced-motion: reduce quita la animación y muestra todos los elementos a la vez.',
    a11y: [
      'Es una lista real (<ul>), así que los lectores anuncian cuántos elementos tiene.',
      'Los iconos son decorativos y llevan aria-hidden; el nombre de cada elemento es texto visible.',
      'Con movimiento reducido no hay animación: la rejilla aparece completa de una vez.',
    ],
  },
  {
    id: 'marquee',
    kind: 'efecto',
    file: 'Marquee',
    name: 'Marquee',
    category: 'Animaciones',
    nickname: 'la cinta infinita',
    description:
      'Una banda de palabras o logotipos que se desliza en bucle sin fin. Va bien para enseñar clientes, tecnologías o etiquetas sin ocupar mucho espacio.',
    prompt:
      'Crea una cinta horizontal que se desplace en bucle infinito: duplica el contenido dentro de un carril con width: max-content y anímalo de translateX(0) a translateX(-50%) en 24 s con timing lineal, para que no se note la costura. Desvanece los extremos con mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent) y pausa la animación con animation-play-state: paused en :hover y :focus-within. Marca la copia con aria-hidden="true" y, con prefers-reduced-motion: reduce, deja la cinta quieta mostrando la primera tanda.',
    a11y: [
      'La copia duplicada lleva aria-hidden: los lectores de pantalla oyen cada palabra una sola vez.',
      'La cinta se puede enfocar con Tab y se detiene con el foco o con el ratón encima.',
      'Con movimiento reducido no se mueve: queda fija mostrando la primera tanda.',
    ],
  },
  {
    id: 'shimmer',
    kind: 'efecto',
    file: 'Shimmer',
    name: 'Shimmer',
    category: 'Animaciones',
    nickname: 'el brillo de carga',
    description:
      'Tarjetas esqueleto con la forma del contenido y un brillo que las recorre mientras carga. Hace la espera más corta que un simple spinner.',
    prompt:
      'Dibuja tarjetas esqueleto con la forma del contenido final (avatar redondo, dos líneas de título, una imagen y dos líneas de texto) en gris azulado #1a2130 sobre una tarjeta #121722. Añade un brillo que las recorra de izquierda a derecha: un linear-gradient de 90° con una franja más clara (#2b3649) en el centro, background-size: 400% 100% y background-position animada de 100% a 0% en 1,6 s lineal e infinita. Envuelve todo en role="status" con aria-busy="true" y un texto oculto «Cargando…», y con prefers-reduced-motion: reduce deja los huesos grises y quietos.',
    a11y: [
      'El contenedor es role="status" con aria-busy y un texto oculto que anuncia «Cargando las tarjetas…».',
      'Las formas del esqueleto son decorativas y llevan aria-hidden.',
      'Con movimiento reducido el brillo se detiene y los huesos quedan en gris liso.',
    ],
  },
  {
    id: 'hover-lift',
    kind: 'efecto',
    file: 'HoverLift',
    name: 'Hover lift',
    category: 'Animaciones',
    nickname: 'la tarjeta que se levanta',
    description:
      'La tarjeta sube un poco y gana sombra al pasar el ratón o al llegar con el teclado. Indica que se puede pulsar sin cambiar el diseño.',
    prompt:
      'Haz que las tarjetas clicables se levanten al pasar el ratón y al recibir foco con el teclado: en :hover y :focus-visible, translateY(-6px), borde cian #0ea5e9 y una sombra 0 18px 32px -14px rgba(14, 165, 233, 0.45), todo con una transición de 220 ms y cubic-bezier(0.2, 0.8, 0.2, 1). Las tarjetas deben ser botones reales con foco visible (outline de 2 px #0ea5e9 y 2 px de separación). Con prefers-reduced-motion: reduce quita la transición y el desplazamiento, pero conserva el cambio de borde y sombra.',
    a11y: [
      'Cada tarjeta es un <button> con aria-pressed: se alcanza con Tab y se elige con Intro o Espacio.',
      'El mismo realce aparece con :focus-visible, no solo con el ratón, junto a un anillo de foco cian.',
      'Con movimiento reducido la tarjeta no sube: solo cambian el borde y la sombra.',
    ],
  },
  {
    id: 'typewriter',
    kind: 'efecto',
    file: 'Typewriter',
    name: 'Typewriter',
    category: 'Animaciones',
    nickname: 'la máquina de escribir',
    description:
      'Un texto que se escribe letra a letra con un cursor que parpadea. Funciona bien en titulares o demos de prompts, con frases cortas.',
    prompt:
      'Escribe la frase letra a letra, una cada 45 ms, con un setTimeout encadenado en un useEffect que se limpie al desmontar, y un cursor de 2 px de ancho en cian #0ea5e9 que parpadee cada segundo con steps(1). Reserva el alto final apilando el texto completo invisible debajo del animado para que nada salte. Pon el texto completo en un span solo para lectores y marca el animado con aria-hidden="true"; con prefers-reduced-motion: reduce muestra la frase entera desde el inicio y el cursor fijo.',
    a11y: [
      'Los lectores de pantalla leen la frase completa de una vez desde un texto oculto; la versión animada lleva aria-hidden.',
      'El bloque reserva su alto final, así que el contenido de debajo no se mueve mientras se escribe.',
      'Con movimiento reducido la frase aparece entera, sin temporizadores, y el cursor no parpadea.',
    ],
  },
  {
    id: 'gradient-border',
    kind: 'efecto',
    file: 'GradientBorder',
    name: 'Borde degradado giratorio',
    category: 'Animaciones',
    nickname: 'el borde que gira',
    description:
      'Una tarjeta cuyo borde lleva un destello de color que da vueltas sin parar. Destaca una opción recomendada o una novedad sin tapar el contenido.',
    prompt:
      'Dale a la tarjeta un borde de 2 px con un destello que gire: registra --angle con @property (syntax "<angle>", valor inicial 0deg) y usa tres fondos, el relleno #121722 en padding-box, un conic-gradient(from var(--angle), transparent, #0ea5e9 70deg, #67e8f9 110deg, transparent 180deg) en border-box y un borde base #1e293b debajo. Anima --angle de 0deg a 360deg en 4 s, lineal e infinito. Con prefers-reduced-motion: reduce detén la animación y deja el destello quieto.',
    a11y: [
      'El borde es solo decoración en el fondo: el texto de la tarjeta conserva su contraste sobre #121722.',
      'El icono es decorativo y lleva aria-hidden.',
      'Con movimiento reducido el destello se queda quieto en su posición inicial.',
    ],
  },
  {
    id: 'count-up',
    kind: 'efecto',
    file: 'CountUp',
    name: 'Contador numérico',
    category: 'Animaciones',
    nickname: 'el contador que sube',
    description:
      'Cifras que suben de 0 a su valor con una frenada suave al final. Da peso a estadísticas o resultados en una portada.',
    prompt:
      'Anima cada cifra de 0 a su valor final en 1,6 s con requestAnimationFrame y una curva easeOutCubic (1 - (1 - t)^3), redondeando en cada fotograma y cancelando el frame al desmontar. Usa font-variant-numeric: tabular-nums para que los números no bailen y formatea con Intl.NumberFormat("es-ES"). Pon la cifra final en un texto solo para lectores y marca la animada con aria-hidden="true"; con prefers-reduced-motion: reduce muestra directamente el valor final, sin requestAnimationFrame.',
    a11y: [
      'Los lectores de pantalla oyen solo la cifra final, no cada paso intermedio: la animada lleva aria-hidden.',
      'Cada dato es un par <dt>/<dd> dentro de una lista de definiciones, con su etiqueta en texto.',
      'Con movimiento reducido las cifras aparecen ya en su valor final, sin animación.',
    ],
  },
  {
    id: 'magnetic-button',
    kind: 'efecto',
    file: 'MagneticButton',
    name: 'Botón magnético',
    category: 'Animaciones',
    nickname: 'el botón imán',
    description:
      'El botón se acerca al puntero cuando este pasa cerca y vuelve a su sitio al alejarse. Da un toque juguetón a la llamada a la acción principal.',
    prompt:
      'Haz un botón magnético: escucha pointermove en la zona que lo rodea, mide la distancia del puntero al centro de un ancla que no se mueve y, si está a menos de 140 px, desplaza el botón con transform: translate() un 35 % de esa distancia; al salir de la zona o del radio, vuelve a translate(0, 0). Suaviza el movimiento con transition: transform 250ms cubic-bezier(0.2, 0.8, 0.2, 1) e ignora los punteros táctiles. Con teclado no se mueve, solo muestra un foco visible, y con prefers-reduced-motion: reduce no hay desplazamiento.',
    a11y: [
      'Es un <button> real: con teclado se enfoca y se pulsa como cualquier otro, sin moverse.',
      'El anillo de foco cian de 2 px es visible aunque el botón no se desplace.',
      'Con movimiento reducido o en pantallas táctiles el botón se queda quieto.',
    ],
  },
  {
    id: 'text-reveal',
    kind: 'efecto',
    file: 'TextReveal',
    name: 'Revelado de texto',
    category: 'Animaciones',
    nickname: 'el texto que emerge',
    description:
      'Las palabras del titular salen desde abajo de una máscara invisible, una detrás de otra. Úsalo en la cabecera de una portada o de una sección importante.',
    prompt:
      'Revela el titular palabra a palabra: envuelve cada palabra en un span con display: inline-block y overflow: hidden (la máscara) y, dentro, otro span que pase de translateY(110%) a translateY(0) en 700 ms con cubic-bezier(0.22, 1, 0.36, 1) y animation-fill-mode: both. Escalona las palabras 70 ms con animation-delay: calc(var(--i) * 70ms) y haz aparecer el subtítulo con un fundido al final. Pon el titular completo en un texto solo para lectores con la versión troceada en aria-hidden="true" y, con prefers-reduced-motion: reduce, muestra el texto en su sitio sin animación.',
    a11y: [
      'Los lectores de pantalla leen el titular entero de una vez desde un texto oculto; las palabras troceadas llevan aria-hidden.',
      'Sigue siendo un encabezado real (<h3>), así que la estructura de la página no cambia.',
      'Con movimiento reducido el titular y el subtítulo aparecen en su sitio, sin animación.',
    ],
  },
];
