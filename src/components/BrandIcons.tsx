import React from 'react';

interface IconProps {
  className?: string;
}

/**
 * Icono oficial estilizado de Anthropic Claude (Estrella orgánica de 12 rayos en terracota/naranja)
 */
export const ClaudeBrandIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
    <rect
      x="1.5"
      y="1.5"
      width="33"
      height="33"
      rx="9"
      fill="url(#claude_bg)"
      stroke="#0EA5E9"
      strokeOpacity="0.45"
      strokeWidth="1.2"
    />
    <g transform="translate(18, 18)">
      {Array.from({ length: 12 }).map((_, idx) => (
        <rect
          key={idx}
          x="-1.35"
          y="-10.5"
          width="2.7"
          height="8.4"
          rx="1.35"
          fill="url(#claude_spoke)"
          transform={`rotate(${idx * 30})`}
        />
      ))}
      <circle r="3.4" fill="#0EA5E9" />
    </g>
    <defs>
      <linearGradient id="claude_bg" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#0B081B" />
        <stop offset="100%" stopColor="#030712" />
      </linearGradient>
      <linearGradient id="claude_spoke" x1="0" y1="-10.5" x2="0" y2="-2" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="100%" stopColor="#818CF8" />
      </linearGradient>
    </defs>
  </svg>
);

/**
 * Icono oficial estilizado de Google Gemini (Estrella curva de 4 puntas con degradado azul-violeta-naranja + destello)
 */
export const GeminiBrandIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
    <rect
      x="1.5"
      y="1.5"
      width="33"
      height="33"
      rx="9"
      fill="url(#gemini_bg)"
      stroke="#60A5FA"
      strokeOpacity="0.45"
      strokeWidth="1.2"
    />
    <path
      d="M17.5 6.5C17.5 13.4 22.6 18.5 29.5 18.5C22.6 18.5 17.5 23.6 17.5 30.5C17.5 23.6 12.4 18.5 5.5 18.5C12.4 18.5 17.5 13.4 17.5 6.5Z"
      fill="url(#gemini_star)"
    />
    <path
      d="M27.2 6.2C27.2 8.6 29.1 10.5 31.5 10.5C29.1 10.5 27.2 12.4 27.2 14.8C27.2 12.4 25.3 10.5 22.9 10.5C25.3 10.5 27.2 8.6 27.2 6.2Z"
      fill="#38BDF8"
    />
    <defs>
      <linearGradient id="gemini_bg" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#0E1B38" />
        <stop offset="100%" stopColor="#090D1C" />
      </linearGradient>
      <linearGradient id="gemini_star" x1="6" y1="7" x2="29" y2="30" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="52%" stopColor="#A855F7" />
        <stop offset="100%" stopColor="#0EA5E9" />
      </linearGradient>
    </defs>
  </svg>
);

/**
 * Icono oficial estilizado de OpenAI GPT (Nudo hexagonal entrelazado de 6 pétalos)
 */
export const GPTBrandIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
    <rect
      x="1.5"
      y="1.5"
      width="33"
      height="33"
      rx="9"
      fill="url(#gpt_bg)"
      stroke="#10B981"
      strokeOpacity="0.45"
      strokeWidth="1.2"
    />
    <g transform="translate(18, 18)">
      {Array.from({ length: 6 }).map((_, idx) => (
        <g key={idx} transform={`rotate(${idx * 60})`}>
          <rect
            x="-3.6"
            y="-10.2"
            width="7.2"
            height="11.5"
            rx="3.6"
            stroke="#34D399"
            strokeWidth="1.9"
            fill="none"
          />
        </g>
      ))}
      <polygon
        points="0,-3.8 3.3,-1.9 3.3,1.9 0,3.8 -3.3,1.9 -3.3,-1.9"
        fill="#06231B"
        stroke="#6EE7B7"
        strokeWidth="1.3"
      />
    </g>
    <defs>
      <linearGradient id="gpt_bg" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#092920" />
        <stop offset="100%" stopColor="#061210" />
      </linearGradient>
    </defs>
  </svg>
);

/**
 * Icono oficial de Angular (Escudo hexagonal bicolor rojo/naranja con la A geométrica)
 */
export const AngularBrandIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
    <rect
      x="1.5"
      y="1.5"
      width="33"
      height="33"
      rx="9"
      fill="#1A0B12"
      stroke="#F43F5E"
      strokeOpacity="0.45"
      strokeWidth="1.2"
    />
    <path
      d="M18 5.5L6.8 9.5L8.5 24.3L18 29.8L27.5 24.3L29.2 9.5L18 5.5Z"
      fill="url(#ng_shield)"
    />
    <path
      d="M18 5.5V29.8L27.5 24.3L29.2 9.5L18 5.5Z"
      fill="#C3002F"
      fillOpacity="0.55"
    />
    <path
      d="M18 8.6L10.9 24.2H13.6L15.1 20.5H20.9L22.4 24.2H25.1L18 8.6ZM20 18.1H16L18 13.3L20 18.1Z"
      fill="#FFFFFF"
    />
    <defs>
      <linearGradient id="ng_shield" x1="7" y1="6" x2="29" y2="29" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FF3162" />
        <stop offset="55%" stopColor="#DD0031" />
        <stop offset="100%" stopColor="#0EA5E9" />
      </linearGradient>
    </defs>
  </svg>
);

/**
 * Icono oficial de Spring Boot (Hexágono verde con símbolo de encendido/hoja)
 */
export const SpringBootBrandIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
    <rect
      x="1.5"
      y="1.5"
      width="33"
      height="33"
      rx="9"
      fill="#0B1F11"
      stroke="#6DB33F"
      strokeOpacity="0.5"
      strokeWidth="1.2"
    />
    <polygon
      points="18,5.5 28.5,11.6 28.5,24.4 18,30.5 7.5,24.4 7.5,11.6"
      fill="url(#spring_hex)"
    />
    <path
      d="M18 10.5V17.5"
      stroke="#FFFFFF"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path
      d="M13.6 13.2C11.9 14.5 10.9 16.5 10.9 18.8C10.9 22.7 14.1 25.9 18 25.9C21.9 25.9 25.1 22.7 25.1 18.8C25.1 16.5 24.1 14.5 22.4 13.2"
      stroke="#FFFFFF"
      strokeWidth="2.3"
      strokeLinecap="round"
    />
    <defs>
      <linearGradient id="spring_hex" x1="8" y1="6" x2="28" y2="30" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#7ED348" />
        <stop offset="100%" stopColor="#4F8F28" />
      </linearGradient>
    </defs>
  </svg>
);

/**
 * Icono oficial de Tailwind CSS (Doble onda cian)
 */
export const TailwindBrandIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
    <rect
      x="1.5"
      y="1.5"
      width="33"
      height="33"
      rx="9"
      fill="#081C29"
      stroke="#38BDF8"
      strokeOpacity="0.45"
      strokeWidth="1.2"
    />
    <path
      d="M18 11C14.7 11 12.6 12.7 11.8 16C13 14.3 14.5 13.7 16.2 14.1C17.1 14.3 17.8 15 18.6 15.8C19.8 17 21.2 18.5 24.3 18.5C27.6 18.5 29.7 16.8 30.5 13.5C29.3 15.2 27.8 15.8 26.1 15.4C25.2 15.2 24.5 14.5 23.7 13.7C22.5 12.5 21.1 11 18 11ZM11.8 18.5C8.5 18.5 6.4 20.2 5.6 23.5C6.8 21.8 8.3 21.2 10 21.6C10.9 21.8 11.6 22.5 12.4 23.3C13.6 24.5 15 26 18.1 26C21.4 26 23.5 24.3 24.3 21C23.1 22.7 21.6 23.3 19.9 22.9C19 22.7 18.3 22 17.5 21.2C16.3 20 14.9 18.5 11.8 18.5Z"
      fill="url(#tw_wave)"
    />
    <defs>
      <linearGradient id="tw_wave" x1="6" y1="11" x2="30" y2="26" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="100%" stopColor="#0284C7" />
      </linearGradient>
    </defs>
  </svg>
);

/**
 * Icono oficial de TypeScript (Placa azul #3178C6 con monograma TS)
 */
export const TypeScriptBrandIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
    <rect
      x="1.5"
      y="1.5"
      width="33"
      height="33"
      rx="9"
      fill="#3178C6"
      stroke="#60A5FA"
      strokeOpacity="0.5"
      strokeWidth="1.2"
    />
    <path
      d="M15.8 18.2H12.3V28.5H9.6V18.2H6.1V15.9H15.8V18.2ZM21.8 28.7C19.8 28.7 18.2 28.1 17.3 27.3L18.4 25.1C19.3 25.8 20.5 26.3 21.8 26.3C23.1 26.3 23.9 25.7 23.9 24.9C23.9 24 23.1 23.6 21.4 22.9C19.1 22 17.8 20.9 17.8 19C17.8 16.9 19.5 15.5 22.3 15.5C24 15.5 25.4 15.9 26.3 16.5L25.2 18.7C24.4 18.2 23.3 17.8 22.3 17.8C21.1 17.8 20.4 18.3 20.4 19C20.4 19.8 21.1 20.2 22.9 20.9C25.3 21.9 26.6 22.9 26.6 24.9C26.6 27.2 24.7 28.7 21.8 28.7Z"
      fill="#FFFFFF"
    />
  </svg>
);

/**
 * Icono oficial de React 19 (Átomo de 3 órbitas elípticas)
 */
export const ReactBrandIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
    <rect
      x="1.5"
      y="1.5"
      width="33"
      height="33"
      rx="9"
      fill="#081B26"
      stroke="#38BDF8"
      strokeOpacity="0.45"
      strokeWidth="1.2"
    />
    <g transform="translate(18, 18)">
      <circle r="2.4" fill="#61DAFB" />
      <ellipse rx="11" ry="4.2" stroke="#61DAFB" strokeWidth="1.5" />
      <ellipse
        rx="11"
        ry="4.2"
        stroke="#61DAFB"
        strokeWidth="1.5"
        transform="rotate(60)"
      />
      <ellipse
        rx="11"
        ry="4.2"
        stroke="#61DAFB"
        strokeWidth="1.5"
        transform="rotate(120)"
      />
    </g>
  </svg>
);

/**
 * Icono oficial de Astro (A espacial con llama naranja-magenta)
 */
export const AstroBrandIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
    <rect
      x="1.5"
      y="1.5"
      width="33"
      height="33"
      rx="9"
      fill="#160B24"
      stroke="#38BDF8"
      strokeOpacity="0.45"
      strokeWidth="1.2"
    />
    <path
      d="M18 6.5L9.2 25.5H13.8L15.6 21.2H20.4L22.2 25.5H26.8L18 6.5ZM16.5 18L18 14L19.5 18H16.5Z"
      fill="#FFFFFF"
    />
    <path
      d="M14.8 24.5C14.8 27.1 16.4 29.2 18 30.2C19.6 29.2 21.2 27.1 21.2 24.5C19.9 25.5 16.1 25.5 14.8 24.5Z"
      fill="url(#astro_flame)"
    />
    <defs>
      <linearGradient id="astro_flame" x1="15" y1="24" x2="21" y2="30" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#0EA5E9" />
        <stop offset="100%" stopColor="#EC4899" />
      </linearGradient>
    </defs>
  </svg>
);

/**
 * Icono oficial de Python (Doble serpiente azul y dorada)
 */
export const PythonBrandIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
    <rect
      x="1.5"
      y="1.5"
      width="33"
      height="33"
      rx="9"
      fill="#0D192B"
      stroke="#38BDF8"
      strokeOpacity="0.4"
      strokeWidth="1.2"
    />
    <path
      d="M17.8 6.5C12.8 6.5 13.1 8.7 13.1 8.7V11H18V11.8H11.2C11.2 11.8 6.8 11.3 6.8 17.2C6.8 23.1 10.6 22.9 10.6 22.9H12.9V20.1C12.9 20.1 12.8 16.3 16.6 16.3H21.6C21.6 16.3 25.2 16.4 25.2 12.8V8.9C25.2 8.9 25.7 6.5 17.8 6.5ZM15.1 8.1C15.7 8.1 16.1 8.5 16.1 9.1C16.1 9.7 15.7 10.1 15.1 10.1C14.5 10.1 14.1 9.7 14.1 9.1C14.1 8.5 14.5 8.1 15.1 8.1Z"
      fill="#387EB8"
    />
    <path
      d="M18.2 29.5C23.2 29.5 22.9 27.3 22.9 27.3V25H18V24.2H24.8C24.8 24.2 29.2 24.7 29.2 18.8C29.2 12.9 25.4 13.1 25.4 13.1H23.1V15.9C23.1 15.9 23.2 19.7 19.4 19.7H14.4C14.4 19.7 10.8 19.6 10.8 23.2V27.1C10.8 27.1 10.3 29.5 18.2 29.5ZM20.9 27.9C20.3 27.9 19.9 27.5 19.9 26.9C19.9 26.3 20.3 25.9 20.9 25.9C21.5 25.9 21.9 26.3 21.9 26.9C21.9 27.5 21.5 27.9 20.9 27.9Z"
      fill="#FFE052"
    />
  </svg>
);

/**
 * Icono oficial de Figma (5 bloques geométricos multicolores)
 */
export const FigmaBrandIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
    <rect
      x="1.5"
      y="1.5"
      width="33"
      height="33"
      rx="9"
      fill="#14111F"
      stroke="#A855F7"
      strokeOpacity="0.45"
      strokeWidth="1.2"
    />
    <path d="M14 7.5A3.5 3.5 0 0014 14.5H17.5V7.5H14Z" fill="#F24E1E" />
    <path d="M17.5 7.5H21A3.5 3.5 0 1121 14.5H17.5V7.5Z" fill="#FF7262" />
    <path d="M14 14.5A3.5 3.5 0 0014 21.5H17.5V14.5H14Z" fill="#A259FF" />
    <circle cx="21" cy="18" r="3.5" fill="#1ABCFE" />
    <path d="M14 21.5A3.5 3.5 0 1017.5 25V21.5H14Z" fill="#0ACF83" />
  </svg>
);

/**
 * Icono oficial estilizado de Obsidian (Cristal amatista facetado con destello púrpura/violeta)
 */
export const ObsidianBrandIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
    <rect
      x="1.5"
      y="1.5"
      width="33"
      height="33"
      rx="9"
      fill="#130D24"
      stroke="#A855F7"
      strokeOpacity="0.45"
      strokeWidth="1.2"
    />
    <g transform="translate(6, 5)">
      {/* Faceta Superior Izquierda */}
      <path
        d="M12 2L4 10L10 13L16 6L12 2Z"
        fill="#9333EA"
        fillOpacity="0.85"
      />
      {/* Faceta Superior Derecha */}
      <path
        d="M12 2L16 6L20 12L17 14L12 2Z"
        fill="#C084FC"
        fillOpacity="0.95"
      />
      {/* Faceta Central Lumínica */}
      <path
        d="M16 6L10 13L14 20L17 14L16 6Z"
        fill="#A855F7"
      />
      {/* Faceta Inferior Frontal */}
      <path
        d="M10 13L4 10L6 21L14 24L10 13Z"
        fill="#7C3AED"
      />
      {/* Faceta Inferior Punta */}
      <path
        d="M10 13L14 20L14 24L10 13Z"
        fill="#6B21A8"
      />
      {/* Faceta Derecha Inferior */}
      <path
        d="M17 14L20 12L18 20L14 24L14 20L17 14Z"
        fill="#581C87"
      />
    </g>
  </svg>
);
