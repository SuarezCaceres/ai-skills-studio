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
    description: 'Portada de un producto digital: promesa con dos llamadas a la acción, logos de clientes, tres funciones, un testimonio y el pie.',
    prompt:
      'SaaS landing page: sticky top nav with logo, links and a sign-up button; a two-column hero with headline, subcopy, primary and secondary CTAs next to a product screenshot; a strip of six client logos; three feature cards with icons; a customer testimonial with avatar; and a multi-column footer.',
    componentIds: ['avatar', 'buttons', 'card', 'footer'],
  },
  {
    id: 'tienda-online',
    file: 'TiendaOnline',
    name: 'Tienda online',
    nickname: 'el listado de productos',
    category: 'Tienda online',
    description: 'Listado de productos con buscador, categorías y orden, y una rejilla de tarjetas con precio, valoración y botón para añadir al carrito.',
    prompt:
      'Product listing page: store header with logo, search field and cart button; a filter and sort bar with category chips and a sort select; a responsive grid of eight product cards (1–2 columns on mobile, 4 on desktop), each with an illustration, optional badge, name, price, star rating and an add-to-cart button that updates the cart count.',
    componentIds: ['badge', 'buttons', 'card'],
  },
  {
    id: 'dashboard',
    file: 'Dashboard',
    name: 'Dashboard',
    nickname: 'el panel de control',
    category: 'Dashboard',
    description: 'Panel de administración con navegación lateral, buscador, cuatro indicadores, un gráfico de barras y una tabla de actividad con estados.',
    prompt:
      'Admin dashboard: left sidebar navigation that becomes a horizontal scrollable bar on mobile; top bar with search, notifications button and user avatar; four KPI cards with month-over-month change; an accessible monthly revenue bar chart; and a recent orders table with status badges.',
    componentIds: ['avatar', 'badge', 'buttons'],
  },
  {
    id: 'login-registro',
    file: 'LoginRegistro',
    name: 'Login / registro',
    nickname: 'la pantalla de entrar',
    category: 'Autenticación',
    description: 'Pantalla dividida para entrar o crear cuenta: panel de marca a un lado y, al otro, un formulario accesible con acceso mediante un proveedor externo.',
    prompt:
      'Split-screen sign-in page: brand panel with illustration and tagline on the left (hidden on mobile); on the right a form with a sign-in/sign-up switch, a "Continue with GitHub" button, email and password fields with show-password toggle, a remember-me checkbox, a forgot-password link and a full-width submit button.',
    componentIds: ['buttons', 'forms'],
  },
  {
    id: 'precios',
    file: 'Precios',
    name: 'Precios',
    nickname: 'la tabla de planes',
    category: 'Precios',
    description: 'Tres planes con el recomendado destacado, cambio entre pago mensual y anual, y preguntas frecuentes en un acordeón.',
    prompt:
      'Pricing page: centered header; a monthly/yearly segmented toggle that recalculates prices with a 17% yearly discount; three plan cards with the middle one highlighted and a "Recommended" badge, each with price, billing note, CTA button and feature checklist; and an FAQ accordion.',
    componentIds: ['accordion', 'badge', 'buttons'],
  },
  {
    id: 'blog-articulo',
    file: 'BlogArticulo',
    name: 'Blog / artículo',
    nickname: 'la página de un artículo',
    category: 'Blog',
    description: 'Artículo de blog con migas de pan, autor y tiempo de lectura, portada ilustrada, cuerpo a 65 caracteres por línea y tres artículos relacionados.',
    prompt:
      'Blog article page: simple header; breadcrumb, title, lead paragraph and author row with avatar, date and reading time; a wide SVG cover; a readable ~65ch body with subheadings, a pull quote and inline code; and three related article cards.',
    componentIds: ['avatar', 'breadcrumb', 'card'],
  },
];

export const PAGE_CATALOG: PageTemplateMeta[] = INPUT.map((p) => ({ ...p, thumbnail: `pages/${p.id}.png` }));

export function getPageMeta(id: string | null | undefined): PageTemplateMeta | undefined {
  return id ? PAGE_CATALOG.find((p) => p.id === id) : undefined;
}
