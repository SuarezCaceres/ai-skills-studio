import type { UiComponentMeta } from '../../types/uiComponents';

/**
 * Metadatos de un efecto (estilo o animación). Se registra en `componentRegistry.ts` igual que un
 * componente del kit, pero su demo vive en `src/components/effects/<file>.tsx`.
 */
export interface EffectMeta extends Omit<UiComponentMeta, 'thumbnail' | 'nickname' | 'prompt' | 'kind' | 'category'> {
  kind: 'efecto';
  category: 'Estilos' | 'Animaciones';
  /** Nombre del archivo en `effects/`, sin la extensión. */
  file: string;
  /** Cómo se le dice en lenguaje llano, en minúscula y con artículo: «el efecto vidrio esmerilado». */
  nickname: string;
  /** Prompt en español, listo para pegar en una IA (2–4 frases concretas: medidas, colores, tiempos). */
  prompt: string;
}
