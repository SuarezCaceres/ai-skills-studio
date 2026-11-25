/**
 * Textos de la sección «Guía vs. sin guía» de la portada (spec 005).
 * Todo es cualitativo: sin porcentajes ni métricas inventadas.
 */
import type { GuideMode, GuideStepId } from '../types/guideShowcase';

export const GUIDE_COPY = {
  label: 'Primeros pasos',
  title: 'La misma página, con y sin alguien que te guíe',
  subtitle:
    'Sin guía, cada botón es una incógnita. Con guía, sabes qué hacer en cada paso.',
  selectorLabel: 'Modo de la vista previa',
  modes: {
    'sin-guia': 'Sin guía',
    'con-guia': 'Con guía',
  } satisfies Record<GuideMode, string>,
  frameUrl: 'codice-oauth.vercel.app/catalogo',
  imageAlt:
    'Captura del Catálogo de Códice Studio con el buscador, las categorías y las primeras tarjetas de skills.',
  captions: {
    'sin-guia': 'El Catálogo tal cual: muchos controles y ninguna pista.',
    'con-guia': 'El mismo Catálogo, con un foco que te lleva de la mano.',
  } satisfies Record<GuideMode, string>,
  listLabels: {
    'sin-guia': 'Lo que pasa sin guía',
    'con-guia': 'Lo que cambia con guía',
  } satisfies Record<GuideMode, string>,
  cta: 'Ir al catálogo',
  stepsListLabel: 'Los tres pasos de la guía',
  announceStatic: 'Guía de 3 pasos',
  announceNoGuide: 'Vista sin guía',
} as const;

export const GUIDE_STEP_TEXT: Record<GuideStepId, string> = {
  buscar: 'Empieza aquí: escribe lo que necesitas, como «auditoría» o «React».',
  filtrar: 'Acota por categoría para ver solo lo relevante.',
  abrir: 'Abre una skill para leer su SKILL.md y auditar su código.',
};

export const GUIDE_LISTS: Record<GuideMode, readonly [string, string, string]> = {
  'sin-guia': [
    'No sabes por dónde empezar',
    'Los controles no explican para qué sirven',
    'Abres skills al azar sin saber qué revisar',
  ],
  'con-guia': [
    'Cada paso te dice qué hacer y por qué',
    'El foco señala el control exacto',
    'Llegas a auditar una skill en tres pasos',
  ],
};

export const GUIDE_TOTAL_STEPS = 3;

/** Texto visible del tooltip: «Paso N de 3 · …». */
export const guideTooltipText = (step: number, text: string): string =>
  `Paso ${step} de ${GUIDE_TOTAL_STEPS} · ${text}`;

/** Texto de la región `aria-live`: «Paso N de 3: …». */
export const guideAnnouncementText = (step: number, text: string): string =>
  `Paso ${step} de ${GUIDE_TOTAL_STEPS}: ${text}`;
