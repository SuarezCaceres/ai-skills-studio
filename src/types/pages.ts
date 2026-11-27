import type { ComponentType, LazyExoticComponent } from 'react';
import type { PageId } from '../data/pageIds';

export type { PageId } from '../data/pageIds';

export type PageCategory = 'Landing' | 'Tienda online' | 'Dashboard' | 'Autenticación' | 'Precios' | 'Blog';

/** Orden de los chips de categoría en la galería. */
export const PAGE_CATEGORIES: PageCategory[] = ['Landing', 'Tienda online', 'Dashboard', 'Autenticación', 'Precios', 'Blog'];

/** Datos de una página de referencia (sin vista previa ni código): sirven en Node y en el editor de clases. */
export interface PageTemplateMeta {
  id: PageId;
  /** Nombre del archivo en `src/components/page-templates/`, sin la extensión. */
  file: string;
  /** «Landing SaaS». */
  name: string;
  /** Cómo se le dice en la calle, en minúsculas: se muestra como «Le dicen: …». */
  nickname: string;
  category: PageCategory;
  /** Una o dos frases en español. */
  description: string;
  /** Prompt en inglés para pegar en una IA. */
  prompt: string;
  /** Ids de `COMPONENT_REGISTRY` que usa la plantilla. */
  componentIds: string[];
  /** Miniatura `pages/<id>.png`, relativa a la base de Vite. */
  thumbnail: string;
}

/** Una página del registro: sus datos, su vista en vivo diferida y el código real que se muestra. */
export interface PageTemplateEntry extends PageTemplateMeta {
  /** `src/components/page-templates/<file>.tsx`. */
  sourcePath: string;
  /** Export `Template` del archivo (carga diferida). */
  Preview: LazyExoticComponent<ComponentType>;
  /** Código TSX del archivo, importado con `?raw` para que nunca difiera de lo que se ve. */
  loadSource: () => Promise<string>;
}
