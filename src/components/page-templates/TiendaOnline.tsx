import { useState, type MouseEvent, type ReactNode } from 'react';
import { Heart, Search, ShoppingBag, SlidersHorizontal, Star } from 'lucide-react';
import { Badge } from '../ui-kit/Badge';
import { Button, IconButton } from '../ui-kit/Buttons';
import { Card } from '../ui-kit/Card';

/** La plantilla es inerte: ningún enlace navega. */
function blockLinks(event: MouseEvent<HTMLElement>) {
  if ((event.target as Element).closest('a')) event.preventDefault();
}

type Shape = 'mug' | 'lamp' | 'bottle' | 'plant' | 'bag' | 'clock' | 'chair' | 'vase';

interface Product {
  name: string;
  price: number;
  rating: number;
  reviews: number;
  shape: Shape;
  tag?: string;
}

const PRODUCTS: Product[] = [
  { name: 'Taza de gres esmaltado', price: 18, rating: 4.8, reviews: 214, shape: 'mug', tag: 'Más vendido' },
  { name: 'Lámpara de mesa Arco', price: 74, rating: 4.6, reviews: 88, shape: 'lamp' },
  { name: 'Botella térmica 750 ml', price: 29, rating: 4.7, reviews: 302, shape: 'bottle' },
  { name: 'Maceta de barro con plato', price: 22, rating: 4.4, reviews: 51, shape: 'plant', tag: 'Nuevo' },
  { name: 'Bolsa de lona encerada', price: 46, rating: 4.9, reviews: 129, shape: 'bag' },
  { name: 'Reloj de pared Minuto', price: 39, rating: 4.3, reviews: 40, shape: 'clock' },
  { name: 'Taburete de roble', price: 95, rating: 4.5, reviews: 63, shape: 'chair' },
  { name: 'Jarrón de vidrio soplado', price: 34, rating: 4.6, reviews: 77, shape: 'vase', tag: 'Nuevo' },
];

const CATEGORIES = ['Todo', 'Cocina', 'Iluminación', 'Salón', 'Exterior'];
const euro = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

/** Silueta del producto en SVG (sin imágenes externas). */
function ProductArt({ shape }: { shape: Shape }) {
  const art: Record<Shape, ReactNode> = {
    mug: <><rect x="30" y="34" width="34" height="38" rx="5" /><path d="M64 44h6a8 8 0 0 1 0 16h-6" fill="none" strokeWidth="5" /></>,
    lamp: <><path d="M34 26h32l8 22H26Z" /><rect x="48" y="48" width="4" height="26" /><rect x="36" y="74" width="28" height="5" rx="2" /></>,
    bottle: <><rect x="42" y="18" width="16" height="8" rx="2" /><rect x="38" y="26" width="24" height="54" rx="8" /></>,
    plant: <><path d="M50 50c-14-4-18-18-14-26 10 2 16 12 14 26Zm0 0c12-6 14-18 10-24-8 3-12 12-10 24Z" /><path d="M34 52h32l-5 26H39Z" /></>,
    bag: <><path d="M38 38v-6a12 12 0 0 1 24 0v6" fill="none" strokeWidth="4" /><rect x="28" y="38" width="44" height="40" rx="4" /></>,
    clock: <><circle cx="50" cy="50" r="28" /><path d="M50 34v17l10 6" fill="none" strokeWidth="4" className="stroke-[#121722]" /></>,
    chair: <><rect x="30" y="40" width="40" height="8" rx="3" /><path d="M34 48l-4 30h5l4-30Zm32 0 4 30h-5l-4-30Z" /></>,
    vase: <path d="M42 22h16v8c10 8 12 20 8 34-2 8-6 14-16 14s-14-6-16-14c-4-14-2-26 8-34Z" />,
  };
  return (
    <div className="flex aspect-[4/3] items-center justify-center bg-[#171d2b]">
      <svg aria-hidden="true" viewBox="0 0 100 100" className="h-3/4 w-3/4 fill-slate-500 stroke-slate-500">
        {art[shape]}
      </svg>
    </div>
  );
}

function Stars({ rating, reviews }: { rating: number; reviews: number }) {
  return (
    <p className="m-0 flex items-center gap-1.5 text-xs text-slate-400">
      <span className="flex" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} className={`h-3.5 w-3.5 ${n <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
        ))}
      </span>
      <span className="sr-only">Valoración: {rating.toLocaleString('es-ES')} de 5,</span>
      <span>
        ({reviews}<span className="sr-only"> opiniones</span>)
      </span>
    </p>
  );
}

export function Template() {
  const [category, setCategory] = useState('Todo');
  const [cart, setCart] = useState(0);

  return (
    <div className="@container min-h-full w-full bg-[#0a0d14] font-sans text-slate-300" onClick={blockLinks}>
      <header className="border-b border-slate-800 bg-[#0d111a]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-5 py-4">
          <a href="#" className="text-lg font-bold tracking-tight text-white no-underline">
            Casa Alba
          </a>
          <form role="search" className="order-last w-full @3xl:order-none @3xl:ml-6 @3xl:w-auto @3xl:flex-1" onSubmit={(e) => e.preventDefault()}>
            <label htmlFor="tienda-buscar" className="sr-only">
              Buscar productos
            </label>
            <div className="relative">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="tienda-buscar"
                type="search"
                placeholder="Buscar en la tienda"
                className="h-10 w-full rounded-full border border-slate-700 bg-[#0a0d14] pl-9 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#0ea5e9]"
              />
            </div>
          </form>
          <div className="ml-auto flex items-center gap-2">
            <IconButton label="Favoritos" variant="ghost">
              <Heart aria-hidden="true" className="h-4 w-4" />
            </IconButton>
            <Button variant="secondary" size="sm" icon={<ShoppingBag aria-hidden="true" className="h-4 w-4" />}>
              Carrito <span aria-live="polite">({cart})</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        <h1 className="m-0 text-3xl font-bold tracking-tight text-white">Objetos para casa</h1>
        <p className="mb-0 mt-2 max-w-[60ch] text-sm leading-relaxed text-slate-400">
          Piezas hechas en pequeños talleres, pensadas para usarse a diario. Envío gratis desde 50 €.
        </p>

        <div className="mt-6 flex flex-col gap-3 border-y border-slate-800 py-3 @3xl:flex-row @3xl:items-center @3xl:justify-between">
          <div role="group" aria-label="Categorías" className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={category === c}
                onClick={() => setCategory(c)}
                className={`h-8 cursor-pointer rounded-full border px-3 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9] ${
                  category === c ? 'border-[#0ea5e9] bg-[#0ea5e9]/15 text-[#7dd3fc]' : 'border-slate-700 bg-transparent text-slate-300 hover:border-slate-500'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" icon={<SlidersHorizontal aria-hidden="true" className="h-4 w-4" />}>
              Filtrar
            </Button>
            <label htmlFor="tienda-orden" className="text-xs text-slate-400">
              Ordenar por
            </label>
            <select
              id="tienda-orden"
              className="h-8 rounded-lg border border-slate-700 bg-[#0a0d14] px-2 text-xs text-white outline-none focus:border-[#0ea5e9]"
            >
              <option>Relevancia</option>
              <option>Precio: de menor a mayor</option>
              <option>Precio: de mayor a menor</option>
              <option>Mejor valorados</option>
            </select>
          </div>
        </div>

        <p className="mb-0 mt-4 text-xs text-slate-400">{PRODUCTS.length} productos</p>
        <ul data-testid="tienda-rejilla" className="m-0 mt-3 [display:grid] list-none grid-cols-1 gap-4 p-0 @xs:grid-cols-2 @2xl:grid-cols-3 @4xl:grid-cols-4">
          {PRODUCTS.map((p) => (
            <li key={p.name} className="[display:grid] min-w-0">
              <Card
                title={p.name}
                headingLevel={2}
                media={
                  <div className="relative">
                    <ProductArt shape={p.shape} />
                    {p.tag && (
                      <span className="absolute left-3 top-3">
                        <Badge tone={p.tag === 'Nuevo' ? 'accent' : 'success'} variant="solid">
                          {p.tag}
                        </Badge>
                      </span>
                    )}
                  </div>
                }
                footer={
                  <Button size="sm" className="w-full" onClick={() => setCart((n) => n + 1)}>
                    Añadir al carrito<span className="sr-only">: {p.name}</span>
                  </Button>
                }
              >
                <p className="m-0 text-base font-semibold text-white">{euro.format(p.price)}</p>
                <div className="mt-1">
                  <Stars rating={p.rating} reviews={p.reviews} />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
