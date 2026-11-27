import type { ComponentType, LazyExoticComponent } from 'react';

export type UiComponentCategory =
  | 'Navegación'
  | 'Feedback'
  | 'Datos'
  | 'Formularios'
  | 'Contenedores'
  | 'Comunicación'
  | 'Estilos'
  | 'Animaciones';

/** Qué es una entrada del registro: una pieza del kit (`ui-kit/`) o un efecto visual (`effects/`). */
export type UiEntryKind = 'componente' | 'efecto';

/** Orden en que se agrupan las categorías del kit en la lista lateral (pestaña «Componentes»). */
export const UI_COMPONENT_CATEGORIES: UiComponentCategory[] = [
  'Navegación',
  'Feedback',
  'Formularios',
  'Datos',
  'Contenedores',
  'Comunicación',
];

/** Orden de las categorías de la pestaña «Efectos». */
export const UI_EFFECT_CATEGORIES: UiComponentCategory[] = ['Estilos', 'Animaciones'];

/** Categorías de cada tipo de entrada, en el orden en que se muestran. */
export const CATEGORIES_BY_KIND: Record<UiEntryKind, UiComponentCategory[]> = {
  componente: UI_COMPONENT_CATEGORIES,
  efecto: UI_EFFECT_CATEGORIES,
};

/** Datos descriptivos de un componente del kit (sin código ni vista previa). */
export interface UiComponentMeta {
  /** Identificador estable, por ejemplo `accordion`. Lo usan las clases y las asignaciones. */
  id: string;
  kind: UiEntryKind;
  name: string;
  category: UiComponentCategory;
  description: string;
  /** Solo efectos: cómo se le dice en lenguaje llano, p. ej. «el efecto vidrio esmerilado». */
  nickname?: string;
  /** Solo efectos: prompt en español, listo para pegar en una IA. */
  prompt?: string;
  /** Qué hace el componente por accesibilidad (teclado, ARIA, movimiento reducido…). */
  a11y: string[];
  /** Ruta de la miniatura generada a partir del propio componente (relativa a la base). */
  thumbnail: string;
}

/** Un componente del registro: sus datos, su demo en vivo y el código real que se muestra. */
export interface UiComponentEntry extends UiComponentMeta {
  /** Ruta del archivo del componente en el repositorio, para mostrarla junto al código. */
  sourcePath: string;
  /** Demo en vivo (carga diferida) con las variantes del componente. */
  Preview: LazyExoticComponent<ComponentType>;
  /** Código TSX del archivo `ui-kit/<Nombre>.tsx`, importado con `?raw` para que nunca difiera de lo que se ve. */
  loadSource: () => Promise<string>;
}

/** Skills y modelos de IA asignados a un componente. */
export interface ComponentAssignment {
  componentId: string;
  /** `CatalogSkill.id` (`owner/repo/ruta`). */
  skillIds: string[];
  /** `AI_BENCHMARK_MODELS[].id`. */
  modelIds: string[];
  note?: string;
  updatedAt: string;
}
