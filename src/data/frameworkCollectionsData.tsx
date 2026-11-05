import React from 'react';
import { SpecificModelVersion } from '../types/workspace';
import {
  AngularBrandIcon,
  SpringBootBrandIcon,
  TailwindBrandIcon,
  TypeScriptBrandIcon,
  ReactBrandIcon,
  AstroBrandIcon,
  PythonBrandIcon,
  FigmaBrandIcon,
} from '../components/BrandIcons';

export interface ModelVersionPillItem {
  version: SpecificModelVersion;
  brand: 'Claude' | 'Gemini' | 'GPT';
  badge: string;
}

export interface FrameworkCollectionItem {
  id: string;
  name: string;
  category: 'frecuentes' | 'populares';
  categoryBadge: string;
  description: string;
  ctaLabel: string;
  filterTag: string;
  accentColor: string;
  secondaryColor: string;
  metrics: string;
  previewCards: Array<{
    title: string;
    subtitle: string;
    badge: SpecificModelVersion;
    aiBrand: 'Claude' | 'Gemini' | 'GPT';
    accent: string;
  }>;
  iconSvg: React.ReactNode;
}

export const MODEL_VERSION_PILLS: ModelVersionPillItem[] = [
  { version: 'Opus 5.5', brand: 'Claude', badge: 'Cortex Supremo' },
  { version: 'Opus 4.8', brand: 'Claude', badge: 'Estabilidad' },
  { version: 'Gemini 3.8', brand: 'Gemini', badge: '2M Contexto' },
  { version: 'Gemini 3.7', brand: 'Gemini', badge: 'Baja Latencia' },
  { version: 'Sonnet 5.5', brand: 'Claude', badge: '100% UI Code' },
  { version: 'GPT Astra', brand: 'GPT', badge: 'Futurista' },
  { version: 'GPT Luna', brand: 'GPT', badge: 'Lunar Dark' },
];

export const FRAMEWORK_COLLECTIONS: FrameworkCollectionItem[] = [
  {
    id: 'fw-angular',
    name: 'Colección Angular Enterprise',
    category: 'frecuentes',
    categoryBadge: 'Más Frecuente',
    description:
      'Arquitecturas modulares con Signals, Standalone Components y rutas reactivas de uso diario en el estudio.',
    ctaLabel: 'Explorar en Skills',
    filterTag: 'angular',
    accentColor: '#FF6B00',
    secondaryColor: '#F43F5E',
    metrics: '42 Skills & Plantillas',
    previewCards: [
      {
        title: 'Angular Signals Core',
        subtitle: 'Estado reactivo limpio',
        badge: 'Opus 5.5',
        aiBrand: 'Claude',
        accent: '#FF6B00',
      },
      {
        title: 'Panel Enterprise UI',
        subtitle: 'Standalone + Guardas',
        badge: 'Sonnet 5.5',
        aiBrand: 'Claude',
        accent: '#F43F5E',
      },
      {
        title: 'Tutor Interactivo TS',
        subtitle: 'Guía paso a paso',
        badge: 'Gemini 3.8',
        aiBrand: 'Gemini',
        accent: '#F97316',
      },
    ],
    iconSvg: <AngularBrandIcon className="h-7 w-7" />,
  },
  {
    id: 'fw-springboot',
    name: 'Colección Spring Boot & API',
    category: 'frecuentes',
    categoryBadge: 'Más Frecuente',
    description:
      'Microservicios robustos en Java/Kotlin, seguridad JWT, contratos OpenAPI y empaquetado listo para producción.',
    ctaLabel: 'Explorar en Skills',
    filterTag: 'spring',
    accentColor: '#10B981',
    secondaryColor: '#FF6B00',
    metrics: '38 Arquitecturas Backend',
    previewCards: [
      {
        title: 'Spring Security JWT',
        subtitle: 'Roles Colaborador',
        badge: 'Opus 5.5',
        aiBrand: 'Claude',
        accent: '#10B981',
      },
      {
        title: 'Orquestador REST IA',
        subtitle: 'WebFlux + Streaming',
        badge: 'Gemini 3.8',
        aiBrand: 'Gemini',
        accent: '#FF6B00',
      },
      {
        title: 'Validador .RAR Core',
        subtitle: 'Inspección binaria',
        badge: 'Opus 4.8',
        aiBrand: 'Claude',
        accent: '#38BDF8',
      },
    ],
    iconSvg: <SpringBootBrandIcon className="h-7 w-7" />,
  },
  {
    id: 'fw-tailwind',
    name: 'Colección Tailwind CSS Nocturno',
    category: 'frecuentes',
    categoryBadge: 'Más Frecuente',
    description:
      'Sistemas de diseño en Azul Noche (#0A0F1D) y Naranja Vibrante (#FF6B00) con efectos de cristal y mallas SVG.',
    ctaLabel: 'Explorar en Skills',
    filterTag: 'ui-ux-pro-max',
    accentColor: '#38BDF8',
    secondaryColor: '#FF6B00',
    metrics: '64 Componentes UI/UX',
    previewCards: [
      {
        title: 'Azul Noche + Naranja',
        subtitle: 'Tokens #0A0F1D / #FF6B00',
        badge: 'Sonnet 5.5',
        aiBrand: 'Claude',
        accent: '#38BDF8',
      },
      {
        title: 'Malla Neuronal SVG',
        subtitle: 'Partículas flotantes',
        badge: 'GPT Luna',
        aiBrand: 'GPT',
        accent: '#FF6B00',
      },
      {
        title: 'Modales <dialog>',
        subtitle: 'Glassmorphism Pro',
        badge: 'Opus 5.5',
        aiBrand: 'Claude',
        accent: '#A855F7',
      },
    ],
    iconSvg: <TailwindBrandIcon className="h-7 w-7" />,
  },
  {
    id: 'fw-typescript',
    name: 'Colección TypeScript & Node Core',
    category: 'frecuentes',
    categoryBadge: 'Más Frecuente',
    description:
      'Contratos fuertemente tipados, analizadores de árboles de archivos .RAR y automatización de agentes CLI.',
    ctaLabel: 'Explorar en Skills',
    filterTag: 'typescript',
    accentColor: '#F97316',
    secondaryColor: '#38BDF8',
    metrics: '51 Módulos Tipados',
    previewCards: [
      {
        title: 'Parser .RAR Memoria',
        subtitle: '100% TypeScript estricto',
        badge: 'Gemini 3.8',
        aiBrand: 'Gemini',
        accent: '#F97316',
      },
      {
        title: 'Voice Speech Engine',
        subtitle: 'Reconocimiento ES',
        badge: 'GPT Astra',
        aiBrand: 'GPT',
        accent: '#38BDF8',
      },
      {
        title: 'SDK Multi-Agente',
        subtitle: 'Tipado extremo a extremo',
        badge: 'Opus 5.5',
        aiBrand: 'Claude',
        accent: '#10B981',
      },
    ],
    iconSvg: <TypeScriptBrandIcon className="h-7 w-7" />,
  },
  {
    id: 'fw-react-next',
    name: 'Colección React 19 & Next.js',
    category: 'populares',
    categoryBadge: 'Popular en Comunidad',
    description:
      'Interfaces reactivas de última generación con Server Actions, transiciones de vista y renderizado concurrente.',
    ctaLabel: 'Explorar en Skills',
    filterTag: 'react',
    accentColor: '#FF6B00',
    secondaryColor: '#38BDF8',
    metrics: '78 Plantillas Activas',
    previewCards: [
      {
        title: 'Laboratorio React 19',
        subtitle: 'Hooks + Custom Modals',
        badge: 'Sonnet 5.5',
        aiBrand: 'Claude',
        accent: '#FF6B00',
      },
      {
        title: 'Streaming AI Chat',
        subtitle: 'Baja latencia visual',
        badge: 'Gemini 3.8',
        aiBrand: 'Gemini',
        accent: '#38BDF8',
      },
      {
        title: 'Bento Grid Dinámico',
        subtitle: 'Diseño Apple Dark',
        badge: 'Opus 5.5',
        aiBrand: 'Claude',
        accent: '#10B981',
      },
    ],
    iconSvg: <ReactBrandIcon className="h-7 w-7" />,
  },
  {
    id: 'fw-astro',
    name: 'Colección Astro Islas & Docs',
    category: 'populares',
    categoryBadge: 'Popular en Comunidad',
    description:
      'Portales de documentación ultrarrápidos con arquitectura de islas interactivas y cero JavaScript innecesario.',
    ctaLabel: 'Explorar en Skills',
    filterTag: 'guia',
    accentColor: '#F97316',
    secondaryColor: '#A855F7',
    metrics: '29 Guías Interactivas',
    previewCards: [
      {
        title: 'Códice Docs Zero-JS',
        subtitle: '100/100 Lighthouse',
        badge: 'Gemini 3.7',
        aiBrand: 'Gemini',
        accent: '#F97316',
      },
      {
        title: 'Islas Interactivas',
        subtitle: 'Hidratación selectiva',
        badge: 'Sonnet 5.5',
        aiBrand: 'Claude',
        accent: '#A855F7',
      },
      {
        title: 'Visor Markdown Bilingüe',
        subtitle: 'Traducción 1-Clic',
        badge: 'Gemini 3.8',
        aiBrand: 'Gemini',
        accent: '#FF6B00',
      },
    ],
    iconSvg: <AstroBrandIcon className="h-7 w-7" />,
  },
  {
    id: 'fw-python-ai',
    name: 'Colección Python & Agentes MCP',
    category: 'populares',
    categoryBadge: 'Popular en Comunidad',
    description:
      'Conectores de contexto MCP, pipelines de evaluación de modelos y motores de búsqueda semántica para IA.',
    ctaLabel: 'Explorar en Skills',
    filterTag: 'mcp',
    accentColor: '#10B981',
    secondaryColor: '#38BDF8',
    metrics: '46 Agentes & Scripts',
    previewCards: [
      {
        title: 'Servidor MCP Activo',
        subtitle: 'Búsqueda de docs IA',
        badge: 'Opus 5.5',
        aiBrand: 'Claude',
        accent: '#10B981',
      },
      {
        title: 'Benchmarking Cortex',
        subtitle: '7 Versiones medidas',
        badge: 'GPT Astra',
        aiBrand: 'GPT',
        accent: '#38BDF8',
      },
      {
        title: 'Auditor de Prompts',
        subtitle: 'Validación automática',
        badge: 'Gemini 3.8',
        aiBrand: 'Gemini',
        accent: '#FF6B00',
      },
    ],
    iconSvg: <PythonBrandIcon className="h-7 w-7" />,
  },
  {
    id: 'fw-figma-design',
    name: 'Colección Sistemas UI/UX & Figma',
    category: 'populares',
    categoryBadge: 'Popular en Comunidad',
    description:
      'Tokens de diseño sincronizados, bibliotecas de componentes con estados hover y prototipos de alta fidelidad.',
    ctaLabel: 'Explorar en Skills',
    filterTag: 'ui',
    accentColor: '#A855F7',
    secondaryColor: '#FF6B00',
    metrics: '55 Kits de Interfaz',
    previewCards: [
      {
        title: 'Kit AI Orange Dark',
        subtitle: 'Variables cromáticas',
        badge: 'GPT Luna',
        aiBrand: 'GPT',
        accent: '#A855F7',
      },
      {
        title: 'Catálogo Hover Pro',
        subtitle: 'Demo + Prompt Modal',
        badge: 'Sonnet 5.5',
        aiBrand: 'Claude',
        accent: '#FF6B00',
      },
      {
        title: 'Mockups Ingeniería',
        subtitle: 'Haces de Luz + Dock',
        badge: 'Opus 5.5',
        aiBrand: 'Claude',
        accent: '#F97316',
      },
    ],
    iconSvg: <FigmaBrandIcon className="h-7 w-7" />,
  },
];
