import React, { useCallback, useSyncExternalStore } from 'react';
import { WorkshopLight } from './WorkshopLight';

const useMediaQuery = (query: string): boolean => {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query]
  );

  return useSyncExternalStore(
    subscribe,
    () =>
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia(query).matches
        : false,
    () => false
  );
};

/**
 * Fondo atmosférico WebGL2 fijo y continuo para toda la portada (activePage === 'inicio').
 * Mantiene el haz de luz cian #0ea5e9 y polvo sutil acompañando el scroll,
 * mientras las vistas internas/autenticadas conservan NeuralAtmosphereBackground.
 */
export const LandingWorkshopBackdrop: React.FC = () => {
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const finePointer = useMediaQuery('(hover: hover) and (pointer: fine)');

  return <WorkshopLight reduceMotion={reduceMotion} finePointer={finePointer} fixed />;
};

export default LandingWorkshopBackdrop;
