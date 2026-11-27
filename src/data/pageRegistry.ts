import { lazy, type ComponentType } from 'react';
import type { PageTemplateEntry, PageTemplateMeta } from '../types/pages';
import { PAGE_CATALOG } from './pageCatalog';

/**
 * Registro de las páginas de referencia: los datos de `pageCatalog.ts` más la vista en vivo diferida
 * y el código real (`?raw`) de `src/components/page-templates/<file>.tsx`. Cada plantilla exporta `Template`.
 */

type TemplateModule = { Template: ComponentType };

const previews = import.meta.glob<TemplateModule>('../components/page-templates/*.tsx');
const sources = import.meta.glob<string>('../components/page-templates/*.tsx', { query: '?raw', import: 'default' });

function toEntry(meta: PageTemplateMeta): PageTemplateEntry {
  const key = `../components/page-templates/${meta.file}.tsx`;
  const loadPreview = previews[key];
  const loadSource = sources[key];
  if (!loadPreview || !loadSource) throw new Error(`Falta la plantilla de la página «${meta.id}» (${key}).`);
  return {
    ...meta,
    sourcePath: `src/components/page-templates/${meta.file}.tsx`,
    Preview: lazy(() => loadPreview().then((m) => ({ default: m.Template }))),
    loadSource,
  };
}

export const PAGE_REGISTRY: PageTemplateEntry[] = PAGE_CATALOG.map(toEntry);

export function getPageEntry(id: string | null | undefined): PageTemplateEntry | undefined {
  return id ? PAGE_REGISTRY.find((entry) => entry.id === id) : undefined;
}

/** URL de la miniatura respetando la base de Vite (`./` en producción). */
export function pageThumbnailUrl(page: Pick<PageTemplateMeta, 'thumbnail'>): string {
  return `${import.meta.env.BASE_URL}${page.thumbnail}`;
}
