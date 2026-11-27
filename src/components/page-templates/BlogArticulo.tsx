import type { MouseEvent } from 'react';
import { Clock } from 'lucide-react';
import { Avatar } from '../ui-kit/Avatar';
import { Breadcrumb } from '../ui-kit/Breadcrumb';
import { Card } from '../ui-kit/Card';

/** La plantilla es inerte: ningún enlace navega. */
function blockLinks(event: MouseEvent<HTMLElement>) {
  if ((event.target as Element).closest('a')) event.preventDefault();
}

const RELATED = [
  { title: 'Cómo escribir un buen mensaje de commit', minutes: 5, text: 'Tres reglas sencillas para que tu historial se lea como un diario del proyecto.' },
  { title: 'Revisiones de código que no queman al equipo', minutes: 7, text: 'Qué comentar, qué dejar pasar y cómo decirlo para que la revisión sume.' },
  { title: 'Ramas cortas: menos conflictos, más entregas', minutes: 6, text: 'Por qué fusionar a menudo reduce el riesgo en lugar de aumentarlo.' },
];

/** Portada geométrica en SVG: ramas que se separan y vuelven a unirse. */
function Cover() {
  return (
    <svg viewBox="0 0 800 340" role="img" aria-label="Ilustración: varias ramas que salen de una línea principal y vuelven a unirse" className="block h-auto w-full rounded-2xl border border-slate-800 bg-[#0d111a]">
      <g fill="none" strokeWidth="6" strokeLinecap="round">
        <path d="M40 170H760" className="stroke-slate-600" />
        <path d="M160 170c60 0 60-90 120-90h160c60 0 60 90 120 90" className="stroke-[#0ea5e9]" />
        <path d="M260 170c50 0 50 80 100 80h120c50 0 50-80 100-80" className="stroke-slate-500" />
      </g>
      {[160, 280, 440, 560, 360, 480].map((x, i) => (
        <circle key={x} cx={x} cy={[170, 80, 80, 170, 250, 250][i]} r="13" className={i < 4 ? 'fill-[#0a0d14] stroke-[#0ea5e9]' : 'fill-[#0a0d14] stroke-slate-400'} strokeWidth="5" />
      ))}
    </svg>
  );
}

function Thumb({ index }: { index: number }) {
  return (
    <div aria-hidden="true" className="flex h-28 items-center justify-center gap-2 bg-[#171d2b]">
      {[0, 1, 2].map((i) => (
        <span key={i} className={`rounded-full ${i === index ? 'h-10 w-10 bg-[#0ea5e9]/60' : 'h-6 w-6 bg-slate-600'}`} />
      ))}
    </div>
  );
}

export function Template() {
  return (
    <div className="@container min-h-full w-full bg-[#0a0d14] font-sans text-slate-300" onClick={blockLinks}>
      <header className="border-b border-slate-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
          <a href="#" className="text-base font-bold text-white no-underline">
            Bitácora <span className="font-normal text-slate-400">de ingeniería</span>
          </a>
          <nav aria-label="Secciones del blog" className="hidden @xl:block">
            <ul className="m-0 flex list-none gap-5 p-0 text-sm">
              {['Guías', 'Opinión', 'Novedades'].map((s) => (
                <li key={s}>
                  <a href="#" className="rounded-sm text-slate-300 no-underline hover:text-white focus-visible:outline-2 focus-visible:outline-[#0ea5e9]">
                    {s}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main>
        <div className="mx-auto max-w-5xl px-5 py-10">
          <article>
            <div className="mx-auto max-w-[65ch]">
              <Breadcrumb items={[{ label: 'Inicio', href: '#' }, { label: 'Guías', href: '#' }, { label: 'Trabajar con ramas' }]} />
              <h1 className="m-0 mt-6 text-3xl font-bold leading-tight tracking-tight text-white @3xl:text-4xl">
                Trabajar con ramas sin perder la cabeza
              </h1>
              <p className="mb-0 mt-4 text-lg leading-relaxed text-slate-400">
                Una guía práctica para equipos pequeños que quieren entregar a menudo sin pisarse los cambios.
              </p>
              <div className="mt-6 flex items-center gap-3">
                <Avatar name="Pablo Ortega" />
                <p className="m-0 text-sm">
                  <span className="block font-semibold text-white">Pablo Ortega</span>
                  <span className="flex flex-wrap items-center gap-x-2 text-slate-400">
                    <time dateTime="2026-11-20">20 de noviembre de 2026</time>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 text-slate-400">
                      <Clock aria-hidden="true" className="h-3.5 w-3.5" />8 min de lectura
                    </span>
                  </span>
                </p>
              </div>
            </div>

            <div className="mx-auto mt-8 max-w-4xl">
              <Cover />
            </div>

            <div className="mx-auto mt-10 flex max-w-[65ch] flex-col gap-5 text-base leading-[1.75] text-slate-300">
              <p className="m-0">
                Todo equipo que crece llega al mismo punto: dos personas tocan el mismo archivo, alguien fusiona un viernes por
                la tarde y el lunes nadie sabe qué versión es la buena. No es un problema de herramientas, es un problema de
                acuerdos.
              </p>
              <p className="m-0">
                La buena noticia es que bastan tres hábitos para evitar casi todos los sustos. Ninguno requiere configurar nada
                nuevo; solo decidirlo juntos y escribirlo donde todo el mundo lo vea.
              </p>
              <h2 className="m-0 mt-4 text-2xl font-bold tracking-tight text-white">1. Una rama, una idea</h2>
              <p className="m-0">
                Si no puedes resumir la rama en una frase, probablemente son dos ramas. Las ramas pequeñas se revisan en minutos,
                se entienden sin contexto y, si algo sale mal, se deshacen sin arrastrar trabajo ajeno.
              </p>
              <blockquote className="m-0 border-l-2 border-[#0ea5e9] pl-5 text-lg italic text-slate-200">
                Fusionar a menudo no es arriesgado. Lo arriesgado es pasar dos semanas sin hacerlo.
              </blockquote>
              <h2 className="m-0 mt-4 text-2xl font-bold tracking-tight text-white">2. Nombres que se explican solos</h2>
              <p className="m-0">
                Un prefijo y una descripción corta bastan: <code className="whitespace-nowrap rounded bg-[#171d2b] px-1.5 py-0.5 font-mono text-sm text-sky-200">fix/login-sin-correo</code>{' '}
                dice más que <code className="whitespace-nowrap rounded bg-[#171d2b] px-1.5 py-0.5 font-mono text-sm text-sky-200">rama-pablo-3</code>. Cuando
                alguien vea la lista de ramas, sabrá qué hay en cada una sin abrirla.
              </p>
              <h2 className="m-0 mt-4 text-2xl font-bold tracking-tight text-white">3. La rama principal siempre funciona</h2>
              <p className="m-0">
                Es el único acuerdo innegociable. Si la rama principal se rompe, arreglarla pasa por delante de cualquier otra
                tarea. Así cualquiera puede empezar una rama nueva con la tranquilidad de partir de algo que funciona.
              </p>
            </div>
          </article>

          <section aria-labelledby="blog-relacionados" className="mt-16 border-t border-slate-800 pt-10">
            <h2 id="blog-relacionados" className="m-0 text-xl font-bold tracking-tight text-white">
              Sigue leyendo
            </h2>
            <div className="mt-6 [display:grid] gap-4 @3xl:grid-cols-3">
              {RELATED.map((post, i) => (
                <Card
                  key={post.title}
                  title={post.title}
                  media={<Thumb index={i} />}
                  onOpen={() => undefined}
                  footer={
                    <span className="inline-flex items-center gap-1 text-slate-400">
                      <Clock aria-hidden="true" className="h-3.5 w-3.5" />
                      {post.minutes} min de lectura
                    </span>
                  }
                >
                  {post.text}
                </Card>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
