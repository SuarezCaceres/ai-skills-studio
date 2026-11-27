import type { MouseEvent } from 'react';
import { ArrowRight, GitBranch, Github, Mail, MessagesSquare, Play, Search } from 'lucide-react';
import { Avatar } from '../ui-kit/Avatar';
import { Button } from '../ui-kit/Buttons';
import { Card } from '../ui-kit/Card';
import { Footer, type FooterColumn } from '../ui-kit/Footer';

/** La plantilla es inerte: ningún enlace navega. */
function blockLinks(event: MouseEvent<HTMLElement>) {
  if ((event.target as Element).closest('a')) event.preventDefault();
}

const NAV = ['Producto', 'Clientes', 'Precios', 'Documentación'];
const LOGOS = ['Norte', 'Albor', 'Cuarzo', 'Pliego', 'Ribera', 'Faro'];

const FEATURES = [
  {
    icon: Search,
    title: 'Encuentra cualquier decisión',
    text: 'Busca en especificaciones, notas de reunión y tickets a la vez. Cada resultado enlaza con su contexto.',
  },
  {
    icon: GitBranch,
    title: 'Documentos que siguen al código',
    text: 'Cada rama tiene su borrador. Al fusionar, la documentación se actualiza sola y nadie lee una versión vieja.',
  },
  {
    icon: MessagesSquare,
    title: 'Revisiones sin reuniones',
    text: 'Comenta en la línea exacta, asigna a quien decide y cierra el hilo cuando hay acuerdo.',
  },
];

const COLUMNS: FooterColumn[] = [
  { title: 'Producto', links: [{ label: 'Funciones', href: '#' }, { label: 'Precios', href: '#' }, { label: 'Novedades', href: '#' }] },
  { title: 'Recursos', links: [{ label: 'Guías', href: '#' }, { label: 'Plantillas', href: '#' }, { label: 'Estado', href: '#' }] },
  { title: 'Empresa', links: [{ label: 'Equipo', href: '#' }, { label: 'Contacto', href: '#' }] },
];

/** Captura del producto dibujada con divs: un índice, un documento y un comentario. */
function ProductShot() {
  return (
    <div aria-hidden="true" className="w-full min-w-0 overflow-hidden rounded-2xl border border-slate-800 bg-[#121722] shadow-2xl shadow-black/40">
      <div className="flex items-center gap-1.5 border-b border-slate-800 px-4 py-3">
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-2.5 w-2.5 rounded-full bg-slate-700" />
        ))}
        <span className="ml-3 h-2 w-32 rounded bg-slate-800" />
      </div>
      <div className="[display:grid] grid-cols-[5rem_minmax(0,1fr)] gap-4 p-4 @md:grid-cols-[7rem_minmax(0,1fr)]">
        <div className="flex flex-col gap-2">
          {[70, 90, 60, 80, 50].map((w, i) => (
            <span key={i} className={`h-2 rounded ${i === 1 ? 'bg-[#0ea5e9]/70' : 'bg-slate-800'}`} style={{ width: `${w}%` }} />
          ))}
        </div>
        <div className="flex flex-col gap-2.5">
          <span className="h-3 w-2/3 rounded bg-slate-600" />
          {[100, 95, 88, 100, 72].map((w, i) => (
            <span key={i} className="h-2 rounded bg-slate-800" style={{ width: `${w}%` }} />
          ))}
          <div className="mt-2 rounded-lg border border-[#0ea5e9]/40 bg-[#0ea5e9]/10 p-3">
            <span className="block h-2 w-1/2 rounded bg-[#38bdf8]/60" />
            <span className="mt-2 block h-2 w-4/5 rounded bg-slate-700" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function Template() {
  return (
    <div className="@container min-h-full w-full bg-[#0a0d14] font-sans text-slate-300" onClick={blockLinks}>
      <header className="sticky top-0 z-10 border-b border-slate-800/80 bg-[#0a0d14]/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
          <a href="#" className="flex items-center gap-2 text-base font-bold text-white no-underline">
            <span aria-hidden="true" className="h-3 w-3 rounded-sm bg-[#0ea5e9]" />
            Trazo
          </a>
          <nav aria-label="Principal" className="hidden @3xl:block">
            <ul className="m-0 flex list-none gap-6 p-0 text-sm">
              {NAV.map((item) => (
                <li key={item}>
                  <a href="#" className="rounded-sm text-slate-300 no-underline hover:text-white focus-visible:outline-2 focus-visible:outline-[#0ea5e9]">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="hidden @md:inline-flex">
              Entrar
            </Button>
            <Button size="sm">Probar gratis</Button>
          </div>
        </div>
      </header>

      {/* Las secciones van dentro de un div: así no heredan la altura de pantalla que el kit estático da a `main > section`. */}
      <main>
        <div>
          <section className="mx-auto [display:grid] max-w-6xl items-center gap-10 px-5 py-14 @4xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] @4xl:py-20">
            <div className="flex min-w-0 flex-col items-start gap-5">
              <p className="m-0 rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">Nuevo: borradores por rama</p>
              <h1 className="m-0 text-4xl font-bold leading-tight tracking-tight text-white @3xl:text-5xl">
                La documentación de tu equipo, al día con cada cambio.
              </h1>
              <p className="m-0 max-w-[52ch] text-base leading-relaxed text-slate-400">
                Trazo reúne especificaciones, decisiones y revisiones en un solo sitio y las mantiene sincronizadas con tu
                repositorio. Menos «¿cuál es la versión buena?», más tiempo para construir.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" icon={<ArrowRight aria-hidden="true" className="h-4 w-4" />}>
                  Empezar gratis
                </Button>
                <Button size="lg" variant="secondary" icon={<Play aria-hidden="true" className="h-4 w-4" />}>
                  Ver demo de 2 min
                </Button>
              </div>
              <p className="m-0 text-xs text-slate-400">Gratis hasta 10 personas. Sin tarjeta.</p>
            </div>
            <ProductShot />
          </section>

          <section aria-labelledby="landing-logos" className="border-y border-slate-800/80 bg-[#0d111a] px-5 py-8">
            <h2 id="landing-logos" className="m-0 text-center text-xs font-medium uppercase tracking-wider text-slate-400">
              Equipos que ya escriben con Trazo
            </h2>
            <ul className="mx-auto mb-0 mt-5 flex max-w-5xl list-none flex-wrap items-center justify-center gap-x-10 gap-y-4 p-0">
              {LOGOS.map((logo, i) => (
                <li key={logo} className="flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-400">
                  <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5 fill-slate-500">
                    {i % 3 === 0 ? <circle cx="10" cy="10" r="8" /> : i % 3 === 1 ? <rect x="2" y="2" width="16" height="16" rx="4" /> : <path d="M10 2 18 18H2Z" />}
                  </svg>
                  {logo}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="landing-features" className="mx-auto max-w-6xl px-5 py-16">
            <h2 id="landing-features" className="m-0 max-w-[30ch] text-3xl font-bold tracking-tight text-white">
              Todo lo que tu equipo sabe, en un lugar que no se queda viejo
            </h2>
            <div className="mt-8 [display:grid] gap-4 @3xl:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <Card
                  key={title}
                  title={title}
                  media={
                    <div className="px-4 pt-4">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#0ea5e9]/40 bg-[#0ea5e9]/10 text-[#38bdf8]">
                        <Icon aria-hidden="true" className="h-5 w-5" />
                      </span>
                    </div>
                  }
                >
                  {text}
                </Card>
              ))}
            </div>
          </section>

          <section aria-labelledby="landing-quote" className="mx-auto max-w-4xl px-5 pb-16">
            <h2 id="landing-quote" className="sr-only">
              Lo que dicen nuestros clientes
            </h2>
            <figure className="m-0 rounded-2xl border border-slate-800 bg-[#121722] p-6 @3xl:p-8">
              <blockquote className="m-0 text-lg leading-relaxed text-slate-100 @3xl:text-xl">
                «Antes cada incorporación nos costaba dos semanas de preguntas. Con Trazo, la gente nueva lee las decisiones
                en su contexto y abre su primer cambio el tercer día.»
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <Avatar name="Lucía Ferrer" />
                <span className="text-sm">
                  <span className="block font-semibold text-white">Lucía Ferrer</span>
                  <span className="text-slate-400">Responsable de ingeniería en Cuarzo</span>
                </span>
              </figcaption>
            </figure>
          </section>
        </div>
      </main>

      {/* El Footer del kit reparte columnas según la ventana; aquí se fuerza según el contenedor. */}
      <div className="mx-auto max-w-6xl px-5 pb-8 [&_footer>div]:!grid-cols-2 @3xl:[&_footer>div]:!grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
        <Footer
          brand="Trazo"
          tagline="Documentación viva para equipos de producto."
          columns={COLUMNS}
          social={[
            { label: 'Trazo en GitHub', href: '#', icon: Github },
            { label: 'Escríbenos', href: '#', icon: Mail },
          ]}
          legal="© 2026 Trazo. Hecho por un equipo pequeño."
        />
      </div>
    </div>
  );
}
