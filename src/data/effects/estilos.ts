import type { EffectMeta } from './types';

/** Efectos del grupo «Estilos», en el orden en que se muestran. */
export const EFFECT_STYLES: EffectMeta[] = [
  {
    id: 'glassmorphism',
    kind: 'efecto',
    file: 'Glassmorphism',
    name: 'Glassmorphism',
    category: 'Estilos',
    nickname: 'el efecto vidrio esmerilado',
    description:
      'Tarjetas translúcidas que desenfocan lo que tienen detrás, como un cristal esmerilado. Necesita un fondo con color o con manchas para lucir.',
    prompt:
      'Aplica glassmorphism a las tarjetas: fondo blanco al 10 % de opacidad, desenfoque de fondo de 20 px (backdrop-filter: blur(20px)), borde de 1 px blanco al 25 %, esquinas de 16 px y una sombra suave (0 8px 32px negro al 30 %). Colócalas sobre un fondo oscuro con tres manchas circulares grandes de color verde, rosa y azul. Si el navegador no soporta backdrop-filter, usa un fondo oscuro casi opaco para que el texto siga legible.',
    a11y: [
      'Las manchas de color van oscurecidas para que el texto blanco mantenga un contraste AA sobre cualquier zona de la tarjeta.',
      'Con @supports not (backdrop-filter) la tarjeta pasa a un fondo oscuro casi opaco y sigue siendo legible sin desenfoque.',
      'El botón es un <button> real con anillo de foco cian visible; las manchas son decorativas (aria-hidden) y la transición se anula con movimiento reducido.',
    ],
  },
  {
    id: 'neo-brutalism',
    kind: 'efecto',
    file: 'NeoBrutalism',
    name: 'Neo-brutalism',
    category: 'Estilos',
    nickname: 'el estilo crudo y llamativo',
    description:
      'Bordes negros gruesos, colores planos y sombras duras sin desenfoque. Ideal para marcas jóvenes y páginas que quieren llamar la atención.',
    prompt:
      'Diseña la interfaz en estilo neo-brutalista: fondo crema claro (#f4efe4), tarjetas blancas con borde negro de 3 px, sin esquinas redondeadas y una sombra dura sin desenfoque de 6 px hacia abajo y a la derecha (box-shadow: 6px 6px 0 #000). Usa colores planos y saturados como amarillo #facc15 y rosa #ff90e8, tipografía sans muy gruesa en mayúsculas para los titulares, y botones con sombra de 4 px que al pulsarlos se desplazan 4 px y pierden la sombra, como si se hundieran.',
    a11y: [
      'El texto es negro sobre blanco, amarillo o rosa, con contrastes muy por encima de AA.',
      'El botón es un <button> real; al pulsarlo se hunde sin cambiar de tamaño, y su foco de teclado es un contorno cian de 2 px separado del borde negro.',
      'Con movimiento reducido el hundimiento ocurre sin transición.',
    ],
  },
  {
    id: 'mesh-gradient',
    kind: 'efecto',
    file: 'MeshGradient',
    name: 'Mesh gradient',
    category: 'Estilos',
    nickname: 'el degradado que parece líquido',
    description:
      'Varias manchas de color que se funden entre sí, como pintura líquida. Funciona muy bien como fondo de portadas y cabeceras.',
    prompt:
      'Crea un fondo de mesh gradient solo con CSS: un color base claro (#fdf2f8) y cinco radial-gradient superpuestos en distintos puntos (azul cielo #38bdf8 arriba a la izquierda, rosa #f472b6 arriba a la derecha, amarillo #facc15 abajo a la derecha, verde #34d399 abajo a la izquierda y cian claro #a5f3fc en el centro), cada uno desvaneciéndose a transparente entre el 45 % y el 55 %. Pon encima un titular grande en negrita de unos 36 px en azul casi negro (#0f172a), alineado abajo a la izquierda, con esquinas del bloque de 20 px.',
    a11y: [
      'Todos los colores del degradado son claros, así que el texto en azul casi negro (#0f172a) supera el contraste AA en cualquier punto.',
      'Es un fondo estático: no hay movimiento ni controles que enfocar.',
      'El efecto es solo CSS, sin imágenes que necesiten texto alternativo.',
    ],
  },
  {
    id: 'grain-texture',
    kind: 'efecto',
    file: 'GrainTexture',
    name: 'Grain texture',
    category: 'Estilos',
    nickname: 'el granito de película',
    description:
      'Un ruido fino encima de un degradado, como el grano de una foto analógica. Quita el aspecto plano y digital a fondos y portadas.',
    prompt:
      'Añade textura de grano a la sección: un degradado lineal a 135 grados de azul noche (#0f172a) a granate (#831843) y a teja (#c2410c), y encima una capa de ruido hecha con un SVG en línea con feTurbulence (fractalNoise, baseFrequency 0.9, 3 octavas) como data URI, repetida en mosaico de 160 px, al 45 % de opacidad y con mix-blend-mode: overlay. La capa de ruido va en un pseudoelemento por debajo del texto y con pointer-events: none; el texto, en blanco y grande.',
    a11y: [
      'El grano va en una capa por debajo del texto, así que no ensucia las letras; el texto blanco mantiene contraste AA sobre las zonas oscuras del degradado.',
      'La capa de ruido es un pseudoelemento decorativo con pointer-events: none: no se anuncia ni bloquea clics.',
      'No hay animación: la textura es estática.',
    ],
  },
  {
    id: 'claymorphism',
    kind: 'efecto',
    file: 'Claymorphism',
    name: 'Claymorphism',
    category: 'Estilos',
    nickname: 'el estilo de plastilina',
    description:
      'Formas muy redondeadas en colores pastel que parecen de plastilina, con volumen por dentro y por fuera. Va bien en apps infantiles, juegos y productos amables.',
    prompt:
      'Aplica claymorphism: fondo azul muy claro (#e8f0fb), tarjetas casi blancas con esquinas de 32 px y tres sombras a la vez (una exterior suave de 12 px 16 px 32 px al 18 %, una interior oscura abajo a la derecha y una interior blanca arriba a la izquierda). Añade formas redondeadas en pastel (rosa #fbcfe8, menta #bbf7d0, celeste #bae6fd) con el mismo tipo de sombras, y un botón rosa en forma de píldora que al pulsarlo se reduce un 3 % e invierte las sombras interiores, como si se aplastara.',
    a11y: [
      'El texto va en gris pizarra oscuro sobre fondos pastel y el botón usa un granate muy oscuro sobre rosa, ambos con contraste AA.',
      'El botón es un <button> real con anillo de foco cian; las formas de colores son decorativas (aria-hidden).',
      'Con movimiento reducido el botón se aplasta sin transición.',
    ],
  },
  {
    id: 'dark-premium',
    kind: 'efecto',
    file: 'DarkPremium',
    name: 'Dark mode premium',
    category: 'Estilos',
    nickname: 'el estilo oscuro y elegante',
    description:
      'Modo oscuro sobrio con superficies casi negras en varios niveles, bordes finos y tipografía ligera. Es el aspecto típico de paneles y productos de gama alta.',
    prompt:
      'Diseña un panel en modo oscuro premium: fondo #09090b, tarjeta #111113 y paneles interiores #18181b, cada nivel con un borde de 1 px blanco al 6-12 % y esquinas de 12-16 px. Usa tipografía fina (peso 300) y grande para la cifra principal, etiquetas en mayúsculas pequeñas con espaciado de letras en gris #a1a1aa, y un único color de acento verde (#4ade80) solo para la variación positiva. Nada de brillos neón ni degradados llamativos.',
    a11y: [
      'El texto secundario (#a1a1aa) y el verde del dato tienen contraste AA sobre las superficies casi negras.',
      'La minigráfica es decorativa (aria-hidden): la cifra y su variación ya están en texto.',
      'El botón es un <button> real con anillo de foco cian; su cambio de color al pasar el ratón no se anima con movimiento reducido.',
    ],
  },
  {
    id: 'swiss-style',
    kind: 'efecto',
    file: 'SwissStyle',
    name: 'Swiss style',
    category: 'Estilos',
    nickname: 'el diseño suizo',
    description:
      'Rejilla visible, tipografía sans grande alineada a la izquierda y un solo color de acento. Transmite orden y claridad; ideal para portafolios, carteles y webs de estudios.',
    prompt:
      'Maqueta la sección en estilo suizo (tipográfico internacional): fondo blanco roto (#f5f5f0), texto negro y un único color de acento rojo (#c8102e). Usa una rejilla de 6 columnas con huecos de 12 px y deja ver las columnas con líneas de 1 px negro al 8 %. Titular en Helvetica o Arial negrita, muy grande (unos 58 px), con interlineado 0,95, alineado a la izquierda y ocupando 5 columnas; un cuadrado rojo macizo en la sexta columna, un filete negro de 2 px y textos pequeños numerados.',
    a11y: [
      'El texto negro sobre blanco roto supera con holgura el contraste AA, y el rojo elegido (#c8102e) también lo cumple para el número pequeño.',
      'Las líneas de la retícula y el cuadrado rojo son decorativos (aria-hidden); el titular es un encabezado real.',
      'No hay movimiento ni controles; el tamaño del titular se adapta al ancho con unidades de contenedor.',
    ],
  },
  {
    id: 'editorial',
    kind: 'efecto',
    file: 'Editorial',
    name: 'Editorial',
    category: 'Estilos',
    nickname: 'el estilo de revista',
    description:
      'Maqueta de revista: titular serif grande, entradilla en cursiva, capitular y texto en columnas. Perfecto para blogs, artículos largos y newsletters.',
    prompt:
      'Maqueta el artículo en estilo editorial de revista: fondo crema (#faf7f2) y texto casi negro (#1c1917). Titular en serif (Georgia) de unos 34 px con peso normal, un antetítulo en mayúsculas pequeñas color granate (#9f1239), entradilla en cursiva de 16 px y un filete doble de líneas finas debajo. El cuerpo en dos columnas de mínimo 180 px con 24 px de separación y una línea fina entre ellas, texto justificado de 14 px, y una capitular granate de unos 54 px que ocupe tres líneas en el primer párrafo.',
    a11y: [
      'El texto casi negro sobre crema y el granate del antetítulo superan el contraste AA.',
      'Las columnas pasan a una sola en pantallas estrechas, así que nunca hay que hacer scroll horizontal para leer.',
      'La capitular es la primera letra real del párrafo (::first-letter): los lectores de pantalla leen la palabra completa.',
    ],
  },
];
