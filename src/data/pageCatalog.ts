import type { PageTemplateMeta } from '../types/pages';

/**
 * Catálogo fijo de páginas de referencia (solo datos: sin `import.meta.glob`, se puede importar en Node).
 * La vista en vivo y el código salen de `pageRegistry.ts`; las miniaturas, de `scripts/capture-pages.mjs`.
 */
type CatalogInput = Omit<PageTemplateMeta, 'thumbnail'>;

const INPUT: CatalogInput[] = [
  {
    id: 'landing-saas',
    file: 'LandingSaas',
    name: 'Landing SaaS',
    nickname: 'la portada de un producto',
    category: 'Landing',
    description: 'Portada de un producto digital: promesa, prueba social, funciones y una llamada a la acción.',
    prompt:
      'SaaS landing page: sticky nav, hero with headline, subcopy and two CTAs, logo strip, three feature cards, testimonial and footer.',
    componentIds: ['buttons', 'card', 'footer'],
  },
  {
    id: 'tienda-online',
    file: 'TiendaOnline',
    name: 'Tienda online',
    nickname: 'el listado de productos',
    category: 'Tienda online',
    description: 'Listado de productos con filtros, tarjetas con precio y valoración, y botón para añadir al carrito.',
    prompt:
      'Product listing page: store header, filter and sort bar, responsive grid of product cards with image, name, price, rating stars and an add-to-cart button.',
    componentIds: ['card', 'buttons', 'badge'],
  },
  {
    id: 'dashboard',
    file: 'Dashboard',
    name: 'Dashboard',
    nickname: 'el panel de control',
    category: 'Dashboard',
    description: 'Panel con navegación lateral, métricas clave, un gráfico y una tabla de actividad reciente.',
    prompt:
      'Admin dashboard: sidebar navigation, top bar with search and avatar, four KPI cards, a bar chart and a recent activity table.',
    componentIds: ['avatar', 'badge', 'card'],
  },
  {
    id: 'login-registro',
    file: 'LoginRegistro',
    name: 'Login / registro',
    nickname: 'la pantalla de entrar',
    category: 'Autenticación',
    description: 'Pantalla dividida para entrar o crear cuenta, con formulario accesible y acceso con un proveedor.',
    prompt:
      'Split-screen sign-in page: brand panel on one side, form with email, password, remember me, primary button and a social sign-in option on the other.',
    componentIds: ['forms', 'buttons'],
  },
  {
    id: 'precios',
    file: 'Precios',
    name: 'Precios',
    nickname: 'la tabla de planes',
    category: 'Precios',
    description: 'Tres planes con el recomendado destacado, cambio mensual o anual y preguntas frecuentes.',
    prompt:
      'Pricing page: monthly/yearly toggle, three plan cards with the middle one highlighted, feature checklists, CTA buttons and an FAQ accordion.',
    componentIds: ['buttons', 'badge', 'accordion'],
  },
  {
    id: 'blog-articulo',
    file: 'BlogArticulo',
    name: 'Blog / artículo',
    nickname: 'la página de un artículo',
    category: 'Blog',
    description: 'Artículo con migas de pan, autor, cuerpo legible y artículos relacionados.',
    prompt:
      'Blog article page: breadcrumb, title, author with avatar and reading time, cover block, readable body column and related article cards.',
    componentIds: ['breadcrumb', 'avatar', 'card'],
  },
];

export const PAGE_CATALOG: PageTemplateMeta[] = INPUT.map((p) => ({ ...p, thumbnail: `pages/${p.id}.png` }));

export function getPageMeta(id: string | null | undefined): PageTemplateMeta | undefined {
  return id ? PAGE_CATALOG.find((p) => p.id === id) : undefined;
}
