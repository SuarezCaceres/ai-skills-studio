import { CatalogError } from '../../services/githubCatalogService';

/** Qué se estaba haciendo cuando falló (cambia el mensaje de «no encontrado»). */
export type SharingOp = 'share' | 'update' | 'unshare' | 'list' | 'load';

export interface SharingFailure {
  code: string;
  /** Mensaje en español, listo para mostrar. */
  message: string;
  /** `true` si tiene sentido ofrecer «Reintentar». */
  retryable: boolean;
  /** `true` si lo que hace falta es volver a entrar con GitHub. */
  needsLogin: boolean;
}

const hhmm = (ms: number) => new Date(ms).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });

/** Traduce el error del servicio de clases compartidas a un mensaje claro y a lo que se puede hacer. */
export function describeSharingError(err: unknown, op: SharingOp): SharingFailure {
  if (!(err instanceof CatalogError)) {
    return { code: 'unknown', message: 'No se pudo completar la acción. Inténtalo de nuevo.', retryable: true, needsLogin: false };
  }
  switch (err.code) {
    case 'auth_required':
      return { code: err.code, message: 'Tu sesión de GitHub no está activa o expiró. Vuelve a entrar con GitHub para continuar.', retryable: false, needsLogin: true };
    case 'invalid_input':
      return { code: err.code, message: 'La clase no es válida o está incompleta. Revísala antes de compartirla.', retryable: false, needsLogin: false };
    case 'not_found':
      return {
        code: err.code,
        message:
          op === 'list' || op === 'load'
            ? 'Esta clase ya no está disponible.'
            : 'No se encontró lo que se había compartido (puede que se borrara en GitHub). Vuelve a compartir la clase.',
        retryable: false,
        needsLogin: false,
      };
    case 'rate_limit':
      return {
        code: err.code,
        message: err.retryAt ? `GitHub limitó las peticiones. Vuelve a intentarlo a partir de las ${hhmm(err.retryAt)}.` : 'GitHub limitó las peticiones. Espera un poco y vuelve a intentarlo.',
        retryable: true,
        needsLogin: false,
      };
    case 'forbidden':
      return {
        code: err.code,
        message: 'GitHub no te dejó hacerlo. Comprueba que tu cuenta puede crear el repositorio «codice-skills» y abrir Issues en el catálogo.',
        retryable: false,
        needsLogin: false,
      };
    case 'conflict':
      return { code: err.code, message: 'Hubo un conflicto al guardar en GitHub (el repositorio cambió a la vez). Inténtalo de nuevo.', retryable: true, needsLogin: false };
    case 'network':
      return { code: err.code, message: 'No hay conexión con GitHub. Revisa tu red e inténtalo otra vez.', retryable: true, needsLogin: false };
    case 'not_configured':
      return { code: err.code, message: 'Compartir clases todavía no está configurado en este despliegue.', retryable: false, needsLogin: false };
    case 'github':
      return { code: err.code, message: 'GitHub respondió con un error. Inténtalo de nuevo en un momento.', retryable: true, needsLogin: false };
    default:
      return { code: err.code, message: err.message || 'No se pudo completar la acción.', retryable: true, needsLogin: false };
  }
}
