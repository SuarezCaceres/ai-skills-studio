import { Github, Mail, Rss, type LucideIcon } from 'lucide-react';

export interface FooterColumn {
  title: string;
  links: Array<{ label: string; href: string }>;
}

export interface FooterSocial {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface FooterProps {
  brand: string;
  tagline: string;
  columns: FooterColumn[];
  social?: FooterSocial[];
  legal: string;
}

const LINK =
  'rounded-sm text-slate-400 transition-colors hover:text-[#38bdf8] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]';

/**
 * Pie de página con `<footer>` (rol `contentinfo`). Cada columna es una `<nav>` con su propio nombre,
 * así el lector de pantalla las distingue. Las redes llevan nombre accesible porque son solo iconos.
 */
export function Footer({ brand, tagline, columns, social = [], legal }: FooterProps) {
  return (
    <footer className="w-full rounded-xl border border-slate-800 bg-[#0d111a] px-6 py-8">
      <div className="[display:grid] gap-8 sm:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
        <div className="min-w-0">
          <p className="m-0 flex items-center gap-2 text-base font-bold text-white">
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-[#0ea5e9]" />
            {brand}
          </p>
          <p className="mb-0 mt-2 max-w-xs text-sm leading-relaxed text-slate-400">{tagline}</p>
          {social.length > 0 && (
            <ul className="mb-0 mt-4 flex list-none gap-2 p-0">
              {social.map(({ label, href, icon: Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    aria-label={label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 text-slate-300 transition-colors hover:border-[#0ea5e9] hover:text-[#38bdf8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]"
                  >
                    <Icon aria-hidden="true" className="h-4 w-4" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="m-0 mb-3 font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-500">{column.title}</h2>
            <ul className="m-0 flex list-none flex-col gap-2 p-0 text-sm">
              {column.links.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className={LINK}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <p className="mb-0 mt-8 border-t border-slate-800 pt-4 text-xs text-slate-500">{legal}</p>
    </footer>
  );
}

const COLUMNS: FooterColumn[] = [
  {
    title: 'Producto',
    links: [
      { label: 'Skills del equipo', href: '#skills' },
      { label: 'Clases', href: '#clases' },
      { label: 'Componentes', href: '#componentes' },
    ],
  },
  {
    title: 'Aprender',
    links: [
      { label: '¿Qué es un hook?', href: '#hook' },
      { label: 'Worktrees', href: '#worktrees' },
      { label: 'Guía de estilo', href: '#estilo' },
    ],
  },
  {
    title: 'Equipo',
    links: [
      { label: 'Quiénes somos', href: '#equipo' },
      { label: 'Contacto', href: '#contacto' },
    ],
  },
];

/** Demo del registro. Los enlaces apuntan a anclas ficticias, así que se evita la navegación. */
export function Demo() {
  return (
    <div className="w-full" onClickCapture={(event) => (event.target as HTMLElement).closest('a') && event.preventDefault()}>
      <Footer
        brand="Códice Studio"
        tagline="Skills, clases y componentes del equipo en un solo lugar."
        columns={COLUMNS}
        social={[
          { label: 'GitHub', href: '#github', icon: Github },
          { label: 'Correo', href: '#correo', icon: Mail },
          { label: 'RSS', href: '#rss', icon: Rss },
        ]}
        legal="© 2026 Códice Studio. Hecho por el equipo."
      />
    </div>
  );
}
