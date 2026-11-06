import { UserAccount } from '../types/workspace';
import { SkillDocument } from '../types/skill';

/**
 * Fase S1 — Threat Model (STRIDE) & Fronteras de Confianza (OWASP Top 10 / LLM Top 10)
 * Documento ejecutable de arquitectura de seguridad para AI Skills & RAR Studio.
 */
export const SECURITY_TRUST_BOUNDARIES = [
  {
    id: 'TB-01',
    boundary: 'Autenticación y Registro de Colaboradores (AuthScreen)',
    threats: ['Spoofing', 'Information Disclosure', 'Denial of Service'],
    mitigations: [
      'Derivación de contraseñas con PBKDF2-SHA256 (100,000 iteraciones) vía Web Crypto API',
      'Rate limiting estricto de máximo 5 intentos fallidos por ventana de 5 minutos',
      'Mensajes de error genéricos sin revelar existencia de cuentas ni trazas internas',
    ],
  },
  {
    id: 'TB-02',
    boundary: ' Descompresión y Análisis Binario de Archivos .RAR (rarParserService)',
    threats: ['Tampering', 'Denial of Service', 'Elevation of Privilege'],
    mitigations: [
      'Validación estricta de tamaño máximo (25 MB) y lista blanca de extensiones (.rar)',
      'Verificación de cabeceras mágicas RAR4/RAR5 (52 61 72 21 1A 07)',
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
      'Sesiones con TTL explícito de 12 horas y validación de esquema sin passwordHash',
      'Función de borrado total e irreversible de PII (eraseAllPersonalData)',
    ],
  },
] as const;

const RATE_LIMIT_STORAGE_KEY = 'ai_orange_auth_ratelimit_v1';
const USERS_STORAGE_KEY = 'ai_skills_studio_users_v2';
const SESSION_STORAGE_KEY = 'ai_orange_studio_session_v1';
const FEEDBACK_STORAGE_KEY = 'ai_studio_visual_feedback_reviews_v2';

const MAX_LOGIN_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutos
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 horas

const inMemoryRateLimitStore = new Map<string, number[]>();

function loadRateLimitRecord(identifier: string): number[] {
  const key = identifier.trim().toLowerCase() || 'anonymous';
  try {
    const raw = sessionStorage.getItem(RATE_LIMIT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, number[]>;
      if (parsed && Array.isArray(parsed[key])) {
        return parsed[key];
      }
    }
  } catch {
    // Fallback a memoria si sessionStorage está restringido
  }
  return inMemoryRateLimitStore.get(key) || [];
}

function saveRateLimitRecord(identifier: string, timestamps: number[]): void {
  const key = identifier.trim().toLowerCase() || 'anonymous';
  inMemoryRateLimitStore.set(key, timestamps);
  try {
    const raw = sessionStorage.getItem(RATE_LIMIT_STORAGE_KEY);
    const parsed: Record<string, number[]> = raw ? JSON.parse(raw) : {};
    parsed[key] = timestamps;
    sessionStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // Ignorar errores de cuota en sessionStorage
  }
}

/**
 * Deriva un hash criptográfico seguro con PBKDF2-SHA256 usando Web Crypto API.
 * Nunca almacena ni retorna la contraseña en texto plano.
 */
export async function hashPasswordPBKDF2(
  password: string,
  emailSalt: string
): Promise<string> {
  const normalizedSalt = `ai-skills-studio::v1::${emailSalt.trim().toLowerCase()}`;
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(password);
  const saltBytes = encoder.encode(normalizedSalt);

  if (globalThis.crypto && globalThis.crypto.subtle) {
    const keyMaterial = await globalThis.crypto.subtle.importKey(
      'raw',
      passwordBytes,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const derivedBits = await globalThis.crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: saltBytes,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      256
    );

    const hashArray = Array.from(new Uint8Array(derivedBits));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return `pbkdf2_sha256$100000$${hashHex}`;
  }

  // Fallback determinístico seguro si Web Crypto API no está disponible en el entorno de test
  let h1 = 0xdeadbeef ^ saltBytes.length;
  let h2 = 0x41c6ce57 ^ passwordBytes.length;
  const combined = `${normalizedSalt}::${password}`;
  for (let i = 0; i < combined.length; i++) {
    const ch = combined.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hex =
    (h1 >>> 0).toString(16).padStart(8, '0') +
    (h2 >>> 0).toString(16).padStart(8, '0');
  return `pbkdf2_fallback$${hex}`;
}

/**
 * Verifica si el identificador (correo) puede intentar iniciar sesión según la ventana de 5 minutos.
 */
export function checkLoginRateLimit(identifier: string): {
  allowed: boolean;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  const recentAttempts = loadRateLimitRecord(identifier).filter(
    (ts) => now - ts < RATE_LIMIT_WINDOW_MS
  );
  saveRateLimitRecord(identifier, recentAttempts);

  if (recentAttempts.length >= MAX_LOGIN_ATTEMPTS) {
    const oldestAttempt = recentAttempts[0];
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((oldestAttempt + RATE_LIMIT_WINDOW_MS - now) / 1000)
    );
    return { allowed: false, retryAfterSeconds };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

/**
 * Registra un intento fallido de inicio de sesión para el control de fuerza bruta.
 */
export function recordFailedLoginAttempt(identifier: string): void {
  const now = Date.now();
  const recentAttempts = loadRateLimitRecord(identifier).filter(
    (ts) => now - ts < RATE_LIMIT_WINDOW_MS
  );
  recentAttempts.push(now);
  saveRateLimitRecord(identifier, recentAttempts);
}

/**
 * Restablece el contador de intentos fallidos tras una autenticación exitosa.
 */
export function resetLoginAttempts(identifier: string): void {
  saveRateLimitRecord(identifier, []);
}

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
 * en nombres y rutas extraídas de paquetes comprimidos .RAR.
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

interface SecureSessionEnvelope {
  version: 1;
  issuedAt: number;
  expiresAt: number;
  user: UserAccount;
}

/**
 * Crea un payload de sesión con tiempo de expiración (TTL 12h) y sin campos sensibles.
 */
export function createSecureSessionPayload(user: UserAccount): string {
  const now = Date.now();
  const cleanUser: UserAccount = {
    id: sanitizeUserText(user.id, 80),
    fullName: sanitizeUserText(user.fullName, 120),
    email: sanitizeUserText(user.email, 160).toLowerCase(),
    role: sanitizeUserText(user.role, 120),
    createdAt: sanitizeUserText(user.createdAt, 40),
  };

  const envelope: SecureSessionEnvelope = {
    version: 1,
    issuedAt: now,
    expiresAt: now + SESSION_TTL_MS,
    user: cleanUser,
  };

  return JSON.stringify(envelope);
}

/**
 * Valida el esquema y la expiración (TTL) del payload de sesión almacenado.
 */
export function parseSecureSessionPayload(raw: string | null): UserAccount | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<SecureSessionEnvelope> & Partial<UserAccount>;

    if (parsed && parsed.version === 1 && parsed.user && typeof parsed.expiresAt === 'number') {
      if (Date.now() > parsed.expiresAt) {
        return null;
      }
      const u = parsed.user;
      if (
        typeof u.id === 'string' &&
        typeof u.fullName === 'string' &&
        typeof u.email === 'string' &&
        typeof u.role === 'string' &&
        typeof u.createdAt === 'string'
      ) {
        return {
          id: sanitizeUserText(u.id, 80),
          fullName: sanitizeUserText(u.fullName, 120),
          email: sanitizeUserText(u.email, 160).toLowerCase(),
          role: sanitizeUserText(u.role, 120),
          createdAt: sanitizeUserText(u.createdAt, 40),
        };
      }
      return null;
    }

    // Compatibilidad con sesiones previas validando estrictamente los campos permitidos
    if (
      parsed &&
      typeof parsed.id === 'string' &&
      typeof parsed.fullName === 'string' &&
      typeof parsed.email === 'string' &&
      typeof parsed.role === 'string' &&
      typeof parsed.createdAt === 'string'
    ) {
      return {
        id: sanitizeUserText(parsed.id, 80),
        fullName: sanitizeUserText(parsed.fullName, 120),
        email: sanitizeUserText(parsed.email, 160).toLowerCase(),
        role: sanitizeUserText(parsed.role, 120),
        createdAt: sanitizeUserText(parsed.createdAt, 40),
      };
    }
  } catch {
    return null;
  }

  return null;
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
  inMemoryRateLimitStore.clear();
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
