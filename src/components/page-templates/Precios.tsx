import { useState, type MouseEvent } from 'react';
import { Check } from 'lucide-react';
import { Accordion, type AccordionItem } from '../ui-kit/Accordion';
import { Badge } from '../ui-kit/Badge';
import { Button } from '../ui-kit/Buttons';

/** La plantilla es inerte: ningún enlace navega. */
function blockLinks(event: MouseEvent<HTMLElement>) {
  if ((event.target as Element).closest('a')) event.preventDefault();
}

type Billing = 'mensual' | 'anual';

interface Plan {
  name: string;
  summary: string;
  monthly: number;
  features: string[];
  cta: string;
  featured?: boolean;
}

const PLANS: Plan[] = [
  {
    name: 'Inicial',
    summary: 'Para probar la herramienta con un proyecto personal.',
    monthly: 0,
    features: ['1 proyecto', '3 personas', 'Historial de 7 días', 'Soporte por la comunidad'],
    cta: 'Empezar gratis',
  },
  {
    name: 'Equipo',
    summary: 'Para equipos que publican cada semana.',
    monthly: 24,
    features: ['Proyectos ilimitados', 'Hasta 25 personas', 'Historial de 90 días', 'Revisiones con aprobación', 'Soporte por correo en 24 h'],
    cta: 'Probar 14 días gratis',
    featured: true,
  },
  {
    name: 'Empresa',
    summary: 'Para organizaciones con requisitos de seguridad.',
    monthly: 59,
    features: ['Todo lo del plan Equipo', 'Personas ilimitadas', 'Inicio de sesión único', 'Registro de auditoría', 'Gestor de cuenta dedicado'],
    cta: 'Hablar con ventas',
  },
];

const FAQ: AccordionItem[] = [
  { id: 'cambio', title: '¿Puedo cambiar de plan más adelante?', content: 'Sí. Al subir de plan pagas la parte proporcional; al bajar, el saldo se descuenta de la siguiente factura.' },
  { id: 'anual', title: '¿Cómo funciona el descuento anual?', content: 'Pagando un año por adelantado te ahorras dos meses: el precio mensual equivalente baja un 17 %.' },
  { id: 'prueba', title: '¿Necesito tarjeta para la prueba?', content: 'No. La prueba de 14 días no pide datos de pago y, al terminar, vuelves al plan Inicial si no eliges otro.' },
  { id: 'factura', title: '¿Emitís facturas con IVA?', content: 'Sí. Cada cobro genera una factura con los datos fiscales que indiques en Ajustes > Facturación.' },
];

const euro = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

function price(plan: Plan, billing: Billing) {
  return billing === 'anual' ? Math.round((plan.monthly * 10) / 12) : plan.monthly;
}

export function Template() {
  const [billing, setBilling] = useState<Billing>('mensual');

  return (
    <div className="@container min-h-full w-full bg-[#0a0d14] font-sans text-slate-300" onClick={blockLinks}>
      <main>
        <div className="mx-auto max-w-6xl px-5 py-14">
          <header className="mx-auto max-w-2xl text-center">
            <p className="m-0 text-xs font-semibold uppercase tracking-wider text-[#38bdf8]">Precios</p>
            <h1 className="m-0 mt-3 text-4xl font-bold tracking-tight text-white">Un plan para cada etapa de tu equipo</h1>
            <p className="mb-0 mt-4 text-base leading-relaxed text-slate-400">Empieza gratis y paga solo cuando lo necesites. Sin permanencia.</p>
          </header>

          <fieldset className="mx-auto mt-8 flex w-fit items-center gap-1 rounded-full border border-slate-700 bg-[#121722] p-1">
            <legend className="sr-only">Periodo de facturación</legend>
            {(['mensual', 'anual'] as const).map((b) => (
              <label
                key={b}
                className={`flex h-9 cursor-pointer items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[#0ea5e9] ${
                  billing === b ? 'bg-[#0ea5e9] text-[#0a0d14]' : 'text-slate-300 hover:text-white'
                }`}
              >
                <input type="radio" name="precios-periodo" value={b} checked={billing === b} onChange={() => setBilling(b)} className="sr-only" />
                {b === 'mensual' ? 'Mensual' : 'Anual'}
                {b === 'anual' && <span className={billing === 'anual' ? 'text-[#0a0d14]' : 'text-emerald-300'}>−17 %</span>}
              </label>
            ))}
          </fieldset>

          <ul className="m-0 mt-10 [display:grid] list-none items-stretch gap-5 p-0 @4xl:grid-cols-3">
            {PLANS.map((plan) => {
              const amount = price(plan, billing);
              return (
                <li
                  key={plan.name}
                  className={`relative flex min-w-0 flex-col rounded-2xl border p-6 ${
                    plan.featured ? 'border-[#0ea5e9] bg-[#0f1a2a] @4xl:-my-3 @4xl:py-9' : 'border-slate-800 bg-[#121722]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="m-0 text-lg font-semibold text-white">{plan.name}</h2>
                    {plan.featured && (
                      <Badge tone="accent" variant="solid">
                        Recomendado
                      </Badge>
                    )}
                  </div>
                  <p className="mb-0 mt-2 text-sm leading-relaxed text-slate-400">{plan.summary}</p>
                  <p className="mb-0 mt-6 flex items-baseline gap-1.5">
                    <span className="text-4xl font-bold tracking-tight text-white">{euro.format(amount)}</span>
                    <span className="text-sm text-slate-400">por persona y mes</span>
                  </p>
                  <p className="mb-0 mt-1 min-h-5 text-xs text-slate-400">
                    {plan.monthly === 0 ? 'Gratis para siempre' : billing === 'anual' ? `${euro.format(plan.monthly * 10)} al año por persona` : 'Facturado cada mes'}
                  </p>
                  <Button variant={plan.featured ? 'primary' : 'secondary'} className="mt-6 w-full">
                    {plan.cta}
                  </Button>
                  <ul className="mb-0 mt-6 flex list-none flex-col gap-2.5 p-0 text-sm" aria-label={`Incluye el plan ${plan.name}`}>
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-slate-300">
                        <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#38bdf8]" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>

          <section aria-labelledby="precios-faq" className="mx-auto mt-20 max-w-3xl">
            <h2 id="precios-faq" className="m-0 mb-6 text-2xl font-bold tracking-tight text-white">
              Preguntas frecuentes
            </h2>
            <Accordion items={FAQ} defaultOpen={['cambio']} />
            <p className="mb-0 mt-6 text-sm text-slate-400">
              ¿Te queda alguna duda?{' '}
              <a href="#" className="rounded-sm font-medium text-[#38bdf8] no-underline hover:underline focus-visible:outline-2 focus-visible:outline-[#0ea5e9]">
                Escríbenos
              </a>{' '}
              y te respondemos en menos de un día.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
