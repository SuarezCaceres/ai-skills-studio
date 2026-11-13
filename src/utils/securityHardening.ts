import { SkillDocument } from '../types/skill';

/**
 * Fase S1 — Threat Model (STRIDE) & Fronteras de Confianza (OWASP Top 10 / LLM Top 10)
 * Documento ejecutable de arquitectura de seguridad para Códice Studio (Workspace VFS).
 */
export const SECURITY_TRUST_BOUNDARIES = [
  {
    id: 'TB-01',
    boundary: 'Autenticación con GitHub (AuthScreen y función de Vercel)',
    threats: ['Spoofing', 'Information Disclosure', 'Elevation of Privilege'],
    mitigations: [
      'OAuth con PKCE y estado anti-CSRF de un solo uso; el client secret solo vive en la función serverless',
      'La función solo responde a los orígenes de ALLOWED_ORIGINS y valida code, redirect_uri y code_verifier',
      'Sin contraseñas ni cuentas locales: la identidad es la cuenta de GitHub',
    ],
  },
  {
    id: 'TB-02',
    boundary: 'Descompresión y Análisis Binario de Workspaces VFS (.zip, .skillbundle, .md y legado .rar)',
    threats: ['Tampering', 'Denial of Service', 'Elevation of Privilege'],
    mitigations: [
      'Validación estricta de tamaño máximo (25 MB) y lista blanca de extensiones permitidas',
      'Verificación de cabeceras binarias ZIP/DEFLATE y detección honesta de RAR4/RAR5',
      'Sanitización anti-Path Traversal (../, ..\\, rutas absolutas y bytes nulos)',
    ],
  },
  {
    id: 'TB-03',
    boundary: 'Dictado por Voz (Web Speech API) y Reseñas de Usuarios (VoiceVisualFeedback)',
    threats: ['Tampering (XSS)', 'Denial of Service', 'LLM01/LLM05 Untrusted Output'],
    mitigations: [
      'Sanitización de caracteres de control, etiquetas <script>/HTML y atributos inline',
      'Límite estricto de longitud (500 caracteres) en entradas de voz y texto',
    ],
  },
  {
    id: 'TB-04',
    boundary: 'Persistencia de Sesión y Privacidad de Datos Personales (GDPR / CCPA)',
    threats: ['Information Disclosure', 'Repudiation'],
    mitigations: [
      'El token de GitHub solo vive en memoria: no se guarda en localStorage, sessionStorage ni cookies',
      'Función de borrado total e irreversible de datos locales y copias de trabajo (eraseAllPersonalData)',
    ],
  },
] as const;

const RATE_LIMIT_STORAGE_KEY = 'ai_orange_auth_ratelimit_v1';
const USERS_STORAGE_KEY = 'ai_skills_studio_users_v2';
const SESSION_STORAGE_KEY = 'ai_orange_studio_session_v1';
const FEEDBACK_STORAGE_KEY = 'ai_studio_visual_feedback_reviews_v2';

/**
 * Sanitiza entradas de texto de usuario o transcripciones de voz:
 * - Elimina caracteres de control invisibles y bytes nulos
 * - Elimina etiquetas <script>, HTML potencialmente peligroso y esquemas javascript:
 * - Recorta a la longitud máxima permitida
 */
export function sanitizeUserText(input: string, maxLength = 500): string {
  if (!input || typeof input !== 'string') return '';

  const withoutControlChars = input.replace(
    // eslint-disable-next-line no-control-regex
    /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,
    ''
  );

  const withoutScripts = withoutControlChars
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<\/?[a-z][^>]*>/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/on\w+\s*=/gi, '');

  return withoutScripts.trim().slice(0, Math.max(1, maxLength));
}

/**
 * Previene ataques de Path Traversal (../, ..\, rutas absolutas o bytes nulos)
 * en nombres y rutas extraídas de paquetes comprimidos Workspace VFS (.ZIP / legado .RAR).
 */
export function sanitizeArchiveFilePath(rawPath: string): string {
  if (!rawPath || typeof rawPath !== 'string') {
    return 'src/ExtractedModule.tsx';
  }

  const normalized = rawPath
    .replace(/\0/g, '')
    .replace(/\\/g, '/')
    .replace(/^[a-zA-Z]:/, '')
    .replace(/^\/+/, '');

  const safeSegments = normalized
    .split('/')
    .map((segment) => segment.trim())
    .filter(
      (segment) =>
        segment.length > 0 &&
        segment !== '.' &&
        segment !== '..' &&
        !segment.includes('..')
    )
    .map((segment) => segment.replace(/[^a-zA-Z0-9._-]/g, '_'));

  if (safeSegments.length === 0) {
    return 'src/ExtractedModule.tsx';
  }

  if (safeSegments.length === 1) {
    return `src/${safeSegments[0]}`;
  }

  return safeSegments.slice(0, 6).join('/');
}

/**
 * Valida un archivo subido en la frontera del sistema (extensión, tamaño máximo y nombre seguro).
 */
export function validateUploadFile(
  file: File,
  maxBytes: number,
  allowedExtensions: string[]
): { valid: boolean; error?: string } {
  if (!file || typeof file.name !== 'string') {
    return { valid: false, error: 'No se recibió un archivo válido para procesar.' };
  }

  if (file.size <= 0) {
    return { valid: false, error: 'El archivo seleccionado está vacío (0 bytes).' };
  }

  if (file.size > maxBytes) {
    const maxMb = Math.round((maxBytes / (1024 * 1024)) * 10) / 10;
    return {
      valid: false,
      error: `El archivo supera el límite de seguridad permitido (${maxMb} MB máximo).`,
    };
  }

  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    return {
      valid: false,
      error: 'Nombre de archivo rechazado por contener secuencias de ruta no permitidas.',
    };
  }

  const lowerName = file.name.toLowerCase();
  const normalizedExts = allowedExtensions.map((ext) =>
    ext.startsWith('.') ? ext.toLowerCase() : `.${ext.toLowerCase()}`
  );

  const hasAllowedExtension = normalizedExts.some((ext) => lowerName.endsWith(ext));
  if (!hasAllowedExtension) {
    return {
      valid: false,
      error: `Formato no permitido. Solo se aceptan paquetes con extensión: ${normalizedExts.join(', ')}.`,
    };
  }

  return { valid: true };
}

/**
 * Type Guard explícito en la frontera de persistencia (localStorage) para validar
 * que la lista de documentos SkillDocument hidratada cumpla el contrato estructural.
 */
export function isValidSkillDocumentArray(
  value: unknown
): value is SkillDocument[] {
  if (!Array.isArray(value) || value.length === 0) {
    return false;
  }

  return value.every((item) => {
    if (!item || typeof item !== 'object') return false;
    const candidate = item as Record<string, unknown>;
    const uiSpec = candidate.uiSpec as Record<string, unknown> | undefined;
    const ficha = candidate.ficha as Record<string, unknown> | undefined;

    return (
      typeof candidate.id === 'string' &&
      candidate.id.trim().length > 0 &&
      typeof candidate.filename === 'string' &&
      typeof candidate.name === 'string' &&
      candidate.name.trim().length > 0 &&
      typeof candidate.summary === 'string' &&
      typeof candidate.category === 'string' &&
      typeof candidate.markdownContent === 'string' &&
      Array.isArray(candidate.tags) &&
      Boolean(ficha && typeof ficha === 'object') &&
      Boolean(uiSpec && typeof uiSpec === 'object' && Array.isArray(uiSpec.items)) &&
      Array.isArray(candidate.models) &&
      Array.isArray(candidate.screenshots) &&
      Array.isArray(candidate.codeSnippets)
    );
  });
}

/**
 * Cumplimiento GDPR / CCPA: Elimina de forma completa e irreversible todos los datos personales,
 * cuentas locales, sesiones activas, reseñas de voz y contadores de autenticación.
 */
export function eraseAllPersonalData(): void {
  try {
    localStorage.removeItem(USERS_STORAGE_KEY);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem('ai_skills_studio_session_v1');
    localStorage.removeItem(FEEDBACK_STORAGE_KEY);
  } catch {
    // Ignorar si localStorage está bloqueado
  }
  try {
    sessionStorage.removeItem(RATE_LIMIT_STORAGE_KEY);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem('ai_skills_studio_session_v1');
  } catch {
    // Ignorar si sessionStorage está bloqueado
  }
}
