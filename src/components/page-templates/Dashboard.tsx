import type { MouseEvent } from 'react';
import { BarChart3, Bell, FolderKanban, LayoutDashboard, Search, Settings, TrendingDown, TrendingUp, Users } from 'lucide-react';
import { Avatar } from '../ui-kit/Avatar';
import { Badge, type BadgeTone } from '../ui-kit/Badge';
import { IconButton } from '../ui-kit/Buttons';

/** La plantilla es inerte: ningún enlace navega. */
function blockLinks(event: MouseEvent<HTMLElement>) {
  if ((event.target as Element).closest('a')) event.preventDefault();
}

const NAV = [
  { label: 'Resumen', icon: LayoutDashboard, current: true },
  { label: 'Proyectos', icon: FolderKanban },
  { label: 'Clientes', icon: Users },
  { label: 'Informes', icon: BarChart3 },
  { label: 'Ajustes', icon: Settings },
];

const KPIS = [
  { label: 'Ingresos del mes', value: '48.320 €', delta: '+12,4 %', up: true },
  { label: 'Pedidos', value: '1.284', delta: '+5,1 %', up: true },
  { label: 'Clientes nuevos', value: '312', delta: '+8,9 %', up: true },
  { label: 'Tasa de abandono', value: '2,3 %', delta: '−0,4 pts', up: false },
];

const MONTHS = [
  { m: 'Ene', v: 31 }, { m: 'Feb', v: 28 }, { m: 'Mar', v: 36 }, { m: 'Abr', v: 34 },
  { m: 'May', v: 41 }, { m: 'Jun', v: 39 }, { m: 'Jul', v: 44 }, { m: 'Ago', v: 37 },
  { m: 'Sep', v: 46 }, { m: 'Oct', v: 45 }, { m: 'Nov', v: 48 },
];

type Status = 'Pagado' | 'Pendiente' | 'Reembolsado' | 'En revisión';
const STATUS_TONE: Record<Status, BadgeTone> = { Pagado: 'success', Pendiente: 'warning', Reembolsado: 'danger', 'En revisión': 'accent' };

const ACTIVITY: Array<{ id: string; client: string; amount: string; date: string; status: Status }> = [
  { id: 'P-2041', client: 'Marta Quiroga', amount: '320,00 €', date: '27 nov', status: 'Pagado' },
  { id: 'P-2040', client: 'Taller Nogal', amount: '1.150,00 €', date: '27 nov', status: 'Pendiente' },
  { id: 'P-2039', client: 'Iván Robles', amount: '89,90 €', date: '26 nov', status: 'Pagado' },
  { id: 'P-2038', client: 'Estudio Brisa', amount: '540,00 €', date: '26 nov', status: 'En revisión' },
  { id: 'P-2037', client: 'Nuria Peña', amount: '45,00 €', date: '25 nov', status: 'Reembolsado' },
];

function BarChart() {
  const max = Math.max(...MONTHS.map((d) => d.v));
  return (
    <figure className="m-0">
      <div role="img" aria-label="Ingresos por mes en miles de euros: de 31 en enero a 48 en noviembre" className="flex h-48 items-end gap-1.5 @lg:gap-3">
        {MONTHS.map((d, i) => (
          <div key={d.m} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
            <span
              className={`w-full rounded-t-md ${i === MONTHS.length - 1 ? 'bg-[#0ea5e9]' : 'bg-slate-700'}`}
              style={{ height: `${(d.v / max) * 100}%` }}
            />
            <span aria-hidden="true" className="text-[10px] text-slate-400 @lg:text-xs">
              {d.m}
            </span>
          </div>
        ))}
      </div>
      <figcaption className="mt-3 text-xs text-slate-400">En miles de euros. El mes en curso, en azul.</figcaption>
    </figure>
  );
}

export function Template() {
  return (
    <div className="@container min-h-full w-full bg-[#0a0d14] font-sans text-slate-300" onClick={blockLinks}>
      <div className="flex min-h-full flex-col @3xl:flex-row">
        <aside className="border-b border-slate-800 bg-[#0d111a] @3xl:w-56 @3xl:shrink-0 @3xl:border-b-0 @3xl:border-r">
          <p className="m-0 flex items-center gap-2 px-5 py-4 text-base font-bold text-white">
            <span aria-hidden="true" className="h-3 w-3 rounded-sm bg-[#0ea5e9]" />
            Panel Brújula
          </p>
          <nav aria-label="Secciones" className="overflow-x-auto px-3 pb-3">
            <ul className="m-0 flex list-none gap-1 p-0 @3xl:flex-col">
              {NAV.map(({ label, icon: Icon, current }) => (
                <li key={label}>
                  <a
                    href="#"
                    aria-current={current ? 'page' : undefined}
                    className={`flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm no-underline focus-visible:outline-2 focus-visible:outline-[#0ea5e9] ${
                      current ? 'bg-[#0ea5e9]/15 font-semibold text-[#7dd3fc]' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon aria-hidden="true" className="h-4 w-4" />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="flex items-center gap-3 border-b border-slate-800 px-5 py-3">
            <form role="search" className="min-w-0 flex-1" onSubmit={(e) => e.preventDefault()}>
              <label htmlFor="panel-buscar" className="sr-only">
                Buscar en el panel
              </label>
              <div className="relative max-w-sm">
                <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="panel-buscar"
                  type="search"
                  placeholder="Buscar pedidos, clientes…"
                  className="h-9 w-full rounded-lg border border-slate-700 bg-[#121722] pl-9 pr-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#0ea5e9]"
                />
              </div>
            </form>
            <IconButton label="Notificaciones" variant="ghost">
              <Bell aria-hidden="true" className="h-4 w-4" />
            </IconButton>
            <Avatar name="Elena Sanz" size="sm" status="online" />
          </header>

          <main>
            <div className="flex flex-col gap-6 px-5 py-6">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <h1 className="m-0 text-2xl font-bold tracking-tight text-white">Resumen</h1>
                <p className="m-0 text-xs text-slate-400">Actualizado hoy a las 9:40</p>
              </div>

              <section aria-label="Indicadores clave" className="[display:grid] grid-cols-1 gap-3 @md:grid-cols-2 @5xl:grid-cols-4">
                {KPIS.map((k) => (
                  <article key={k.label} className="rounded-xl border border-slate-800 bg-[#121722] p-4">
                    <h2 className="m-0 text-xs font-medium text-slate-400">{k.label}</h2>
                    <p className="mb-0 mt-2 text-2xl font-bold text-white">{k.value}</p>
                    <p className={`mb-0 mt-1 flex flex-wrap items-center gap-x-1 whitespace-nowrap text-xs ${k.up ? 'text-emerald-300' : 'text-sky-300'}`}>
                      {k.up ? <TrendingUp aria-hidden="true" className="h-3.5 w-3.5" /> : <TrendingDown aria-hidden="true" className="h-3.5 w-3.5" />}
                      {k.delta} <span className="text-slate-400">frente al mes anterior</span>
                    </p>
                  </article>
                ))}
              </section>

              <section aria-labelledby="panel-ingresos" className="rounded-xl border border-slate-800 bg-[#121722] p-5">
                <h2 id="panel-ingresos" className="m-0 mb-4 text-base font-semibold text-white">
                  Ingresos de 2026
                </h2>
                <BarChart />
              </section>

              <section aria-labelledby="panel-actividad" className="rounded-xl border border-slate-800 bg-[#121722]">
                <h2 id="panel-actividad" className="m-0 px-5 pt-5 text-base font-semibold text-white">
                  Actividad reciente
                </h2>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 text-xs text-slate-400">
                        <th scope="col" className="px-5 py-2.5 font-medium">Pedido</th>
                        <th scope="col" className="px-5 py-2.5 font-medium">Cliente</th>
                        <th scope="col" className="hidden px-5 py-2.5 font-medium @xl:table-cell">Fecha</th>
                        <th scope="col" className="px-5 py-2.5 text-right font-medium">Importe</th>
                        <th scope="col" className="px-5 py-2.5 font-medium">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ACTIVITY.map((row) => (
                        <tr key={row.id} className="border-b border-slate-800/70 last:border-b-0">
                          <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-slate-400">{row.id}</td>
                          <td className="px-5 py-3 text-slate-100">{row.client}</td>
                          <td className="hidden whitespace-nowrap px-5 py-3 text-slate-400 @xl:table-cell">{row.date}</td>
                          <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-slate-100">{row.amount}</td>
                          <td className="px-5 py-3">
                            <Badge tone={STATUS_TONE[row.status]} dot>
                              {row.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
