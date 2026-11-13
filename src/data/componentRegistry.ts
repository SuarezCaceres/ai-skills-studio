import { lazy, type ComponentType } from 'react';
import { UI_COMPONENT_CATEGORIES, type UiComponentCategory, type UiComponentEntry, type UiComponentMeta } from '../types/uiComponents';

/**
 * Registro de los componentes del kit. Para añadir uno:
 *   1. crea `src/components/ui-kit/<Archivo>.tsx` y exporta una función `Demo` (la vista previa en vivo);
 *   2. añade una línea a `META` con su `file` (sin extensión).
 * La página Componentes, el código mostrado y las miniaturas salen de aquí: no hay que tocarlas.
 */

type KitModule = { Demo: ComponentType };

const previews = import.meta.glob<KitModule>('../components/ui-kit/*.tsx');
const sources = import.meta.glob<string>('../components/ui-kit/*.tsx', { query: '?raw', import: 'default' });

interface KitMeta extends Omit<UiComponentMeta, 'thumbnail'> {
  /** Nombre del archivo en `ui-kit/`, sin la extensión. */
  file: string;
}

const META: KitMeta[] = [
  {
    id: 'accordion',
    file: 'Accordion',
    name: 'Accordion',
    category: 'Contenedores',
    description: 'Secciones plegables con un panel abierto a la vez o varios a la vez.',
    a11y: [
      'Cada cabecera es un botón con aria-expanded y aria-controls.',
      'Flecha arriba/abajo, Inicio y Fin mueven el foco entre cabeceras.',
      'Los paneles son regiones nombradas por su cabecera.',
    ],
  },
  {
    id: 'alerts',
    file: 'Alerts',
    name: 'Alerts',
    category: 'Feedback',
    description: 'Avisos en línea de información, éxito, advertencia y error, con cierre y acción opcionales.',
    a11y: [
      'Advertencia y error usan role="alert"; información y éxito, role="status".',
      'El botón de cerrar nombra el aviso al que afecta.',
      'El color nunca es el único portador del significado: cada variante lleva icono y título.',
    ],
  },
  {
    id: 'avatar',
    file: 'Avatar',
    name: 'Avatar',
    category: 'Datos',
    description: 'Imagen de perfil con iniciales de respaldo, cuatro tamaños, indicador de estado y grupo apilado.',
    a11y: [
      'La imagen lleva alt con el nombre; las iniciales usan role="img" con aria-label.',
      'El estado (en línea, ausente…) se dice con texto oculto, no solo con color.',
      'Si la imagen falla al cargar, se cambia a las iniciales sin saltos.',
    ],
  },
  {
    id: 'badge',
    file: 'Badge',
    name: 'Badge',
    category: 'Feedback',
    description: 'Insignias para estados, categorías y etiquetas que se pueden quitar, y contadores.',
    a11y: [
      'El botón de quitar una etiqueta nombra qué etiqueta quita.',
      'El contador añade texto oculto que explica a qué se refiere el número.',
      'El contraste de cada tono supera AA sobre el fondo carbón.',
    ],
  },
  {
    id: 'banner',
    file: 'Banner',
    name: 'Banner',
    category: 'Feedback',
    description: 'Anuncio a todo el ancho con enlace de acción y cierre opcional.',
    a11y: [
      'Es una región con nombre, no una alerta: no interrumpe la lectura.',
      'El botón de cerrar dice qué banner cierra.',
      'El enlace de acción es un <a> real, con foco visible.',
    ],
  },
  {
    id: 'bottom-navigation',
    file: 'BottomNavigation',
    name: 'Bottom Navigation',
    category: 'Navegación',
    description: 'Barra de navegación inferior para móvil con iconos, etiquetas y contadores.',
    a11y: [
      'Es un <nav> con nombre; el destino actual lleva aria-current="page".',
      'Roving tabindex: una sola parada de Tab; flechas, Inicio y Fin mueven el foco.',
      'Objetivos táctiles de al menos 56 px de alto.',
    ],
  },
  {
    id: 'breadcrumb',
    file: 'Breadcrumb',
    name: 'Breadcrumb',
    category: 'Navegación',
    description: 'Migas de pan con la página actual marcada y plegado de los niveles intermedios.',
    a11y: [
      '<nav aria-label="Migas de pan"> con una lista ordenada.',
      'La página actual no es un enlace y lleva aria-current="page".',
      'El botón «…» dice cuántos niveles oculta.',
    ],
  },
  {
    id: 'buttons',
    file: 'Buttons',
    name: 'Buttons',
    category: 'Formularios',
    description: 'Botones en cuatro variantes y tres tamaños, con estado de carga y versión de solo icono.',
    a11y: [
      'Todo botón declara type; el de solo icono exige un nombre accesible.',
      'Mientras carga usa aria-busy, queda desactivado y anuncia «Cargando».',
      'Foco visible de 2 px con desfase y movimiento reducido en el spinner.',
    ],
  },
  {
    id: 'button-group',
    file: 'ButtonGroup',
    name: 'Button Group',
    category: 'Formularios',
    description: 'Control segmentado de opción única, interruptores independientes y selector de vista.',
    a11y: [
      'El control segmentado sigue el patrón radiogroup: flechas cambian la opción.',
      'Los interruptores usan aria-pressed y nombre accesible.',
      'Cada grupo tiene role="group" con etiqueta.',
    ],
  },
  {
    id: 'card',
    file: 'Card',
    name: 'Card',
    category: 'Contenedores',
    description: 'Tarjeta con cabecera, pie y modo interactivo en el que todo el área es clicable.',
    a11y: [
      'El título es el único control que cubre la tarjeta; no hay controles anidados.',
      'El nivel del encabezado es configurable para respetar la jerarquía.',
      'Las ilustraciones decorativas llevan aria-hidden.',
    ],
  },
  {
    id: 'carousel',
    file: 'Carousel',
    name: 'Carousel',
    category: 'Datos',
    description: 'Carrusel con flechas, puntos, avance automático opcional y pausa.',
    a11y: [
      'Región con aria-roledescription="carousel"; cada diapositiva es un grupo «N de M».',
      'El avance automático se detiene con foco, con el ratón encima y con prefers-reduced-motion.',
      'Las diapositivas fuera de vista son inertes: no reciben foco.',
    ],
  },
  {
    id: 'chat-bubble',
    file: 'ChatBubble',
    name: 'Chat Bubble',
    category: 'Comunicación',
    description: 'Burbujas de conversación propias y ajenas, estado de lectura e indicador de «escribiendo».',
    a11y: [
      'La lista es un role="log" con aria-live="polite".',
      'Cada burbuja indica quién habla con texto oculto.',
      'El estado de lectura se anuncia con texto, no solo con el icono.',
    ],
  },
  {
    id: 'clipboard',
    file: 'Clipboard',
    name: 'Clipboard',
    category: 'Feedback',
    description: 'Botón, campo y bloque de código con copiado al portapapeles y confirmación.',
    a11y: [
      'El resultado se anuncia en una región role="status".',
      'Hay un respaldo para navegadores sin la API del portapapeles.',
      'El campo de solo lectura se selecciona entero al recibir foco.',
    ],
  },
  {
    id: 'datepicker',
    file: 'Datepicker',
    name: 'Datepicker',
    category: 'Formularios',
    description: 'Selector de fecha con campo escribible, calendario mensual y límites mínimo y máximo.',
    a11y: [
      'Calendario con role="grid"; flechas, Inicio, Fin, RePág y AvPág mueven el foco.',
      'Cada día tiene un nombre completo («lunes, 3 de marzo de 2025»).',
      'Escape cierra y devuelve el foco al botón; los errores se anuncian con role="alert".',
    ],
  },
  {
    id: 'device-mockups',
    file: 'DeviceMockups',
    name: 'Device Mockups',
    category: 'Contenedores',
    description: 'Marcos de teléfono, portátil y navegador dibujados con CSS para enseñar una pantalla.',
    a11y: [
      'Cada marco es una <figure> con una descripción de lo que muestra.',
      'La decoración (isla, bisel, puntos) está oculta a los lectores de pantalla.',
      'No usa imágenes: no depende de recursos externos.',
    ],
  },
  {
    id: 'drawer',
    file: 'Drawer',
    name: 'Drawer',
    category: 'Contenedores',
    description: 'Panel lateral modal por la izquierda o la derecha, con pie de acciones.',
    a11y: [
      'role="dialog" con aria-modal y título enlazado.',
      'El foco entra al abrir, se queda dentro con Tab y vuelve al botón al cerrar.',
      'Escape y el fondo cierran el panel.',
    ],
  },
  {
    id: 'dropdowns',
    file: 'Dropdowns',
    name: 'Dropdowns',
    category: 'Navegación',
    description: 'Menú de acciones con iconos, separadores, opción desactivada y acción destructiva.',
    a11y: [
      'Patrón menu: aria-haspopup, aria-expanded y role="menuitem".',
      'Flechas, Inicio, Fin y la primera letra recorren las opciones.',
      'Escape cierra y devuelve el foco; clic fuera también cierra.',
    ],
  },
  {
    id: 'footer',
    file: 'Footer',
    name: 'Footer',
    category: 'Navegación',
    description: 'Pie de página con marca, columnas de enlaces, redes y aviso legal.',
    a11y: [
      '<footer> (contentinfo) con una <nav> nombrada por columna.',
      'Los iconos de redes llevan aria-label.',
      'Las columnas se apilan en pantallas estrechas sin desbordar.',
    ],
  },
  {
    id: 'forms',
    file: 'Forms',
    name: 'Forms',
    category: 'Formularios',
    description: 'Formulario con etiquetas, ayudas, validación y resumen de errores.',
    a11y: [
      'Cada control tiene <label>, y aria-describedby apunta a su ayuda o error.',
      'aria-invalid y aria-required reflejan el estado; el obligatorio también se dice con texto.',
      'Al enviar con errores, un role="alert" resume y el foco va al primer campo con fallo.',
    ],
  },
  {
    id: 'gallery',
    file: 'Gallery',
    name: 'Gallery',
    category: 'Datos',
    description: 'Cuadrícula de miniaturas con visor ampliado y navegación por teclado.',
    a11y: [
      'Cada miniatura es un botón con el alt real de la imagen.',
      'El visor es un dialog modal: flechas cambian de imagen, Escape cierra.',
      'El foco vuelve a la miniatura de origen al cerrar.',
    ],
  },
];

function toEntry(meta: KitMeta): UiComponentEntry {
  const path = `../components/ui-kit/${meta.file}.tsx`;
  const loadPreview = previews[path];
  const loadSource = sources[path];
  if (!loadPreview || !loadSource) {
    throw new Error(`Falta el archivo ui-kit/${meta.file}.tsx del componente «${meta.id}».`);
  }
  const { file: _file, ...rest } = meta;
  return {
    ...rest,
    thumbnail: `components/${meta.id}.png`,
    sourcePath: `src/components/ui-kit/${meta.file}.tsx`,
    Preview: lazy(() => loadPreview().then((m) => ({ default: m.Demo }))),
    loadSource,
  };
}

/** Todos los componentes del kit, en el orden en que se declaran. */
export const COMPONENT_REGISTRY: UiComponentEntry[] = META.map(toEntry);

export function getComponentEntry(id: string | null | undefined): UiComponentEntry | undefined {
  return id ? COMPONENT_REGISTRY.find((entry) => entry.id === id) : undefined;
}

export function componentsByCategory(entries: UiComponentEntry[] = COMPONENT_REGISTRY): Array<{ category: UiComponentCategory; entries: UiComponentEntry[] }> {
  return UI_COMPONENT_CATEGORIES.map((category) => ({
    category,
    entries: entries.filter((entry) => entry.category === category),
  })).filter((group) => group.entries.length > 0);
}

/** URL de la miniatura respetando la base de Vite (`./` en producción). */
export function thumbnailUrl(entry: Pick<UiComponentEntry, 'thumbnail'>): string {
  return `${import.meta.env.BASE_URL}${entry.thumbnail}`;
}
