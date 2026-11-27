/**
 * Ids de las páginas de referencia. Vive aparte del catálogo para que `lessonsStore` (lógica pura que
 * se prueba en Node y puede acabar en el chunk inicial) sanee `pageIds` sin cargar textos ni plantillas.
 * Al añadir una página: su id aquí, su entrada en `pageCatalog.ts` y su archivo en `page-templates/`.
 */
export const PAGE_IDS = ['landing-saas', 'tienda-online', 'dashboard', 'login-registro', 'precios', 'blog-articulo'] as const;

export type PageId = (typeof PAGE_IDS)[number];

export const isPageId = (value: unknown): value is PageId =>
  typeof value === 'string' && (PAGE_IDS as readonly string[]).includes(value);
