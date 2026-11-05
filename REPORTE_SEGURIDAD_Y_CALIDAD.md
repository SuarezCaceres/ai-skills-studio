# Reporte de Hallazgos y Modificaciones: `security-and-hardening` (S1–S4) y `code-review-and-quality` (C1–C4)

Este documento detalla **qué estaba mal o vulnerable en el código original**, **por qué representaba un riesgo o problema de calidad**, y **qué modificaciones exactas se aplicaron** en el proyecto [ai-skills-studio](file:///C:/Users/Sergio%20Suarez/Documents/ai-skills-studio).

---

## 1. Hallazgos de Seguridad Encontrados y Corregidos (`security-and-hardening`)

| ID | Severidad | Archivo Afectado | Qué estaba mal en el código (Antes) | Qué se modificó para corregirlo (Después) |
| :---: | :---: | :--- | :--- | :--- |
| **SEC-01** | **Critical** | [AuthScreen.tsx](file:///C:/Users/Sergio%20Suarez/Documents/ai-skills-studio/src/components/AuthScreen.tsx) | **Contraseñas en texto plano:** Al registrar o autenticar un usuario, la contraseña (`password`) se guardaba y comparaba en texto plano dentro de `localStorage` (`u.password === password`). | Se creó [`hashPasswordPBKDF2`](file:///C:/Users/Sergio%20Suarez/Documents/ai-skills-studio/src/utils/securityHardening.ts#L93-L141) usando `window.crypto.subtle` (`PBKDF2` + `SHA-256` con `100,000` iteraciones y salt único por email). Ahora solo se almacena y compara `passwordHash`. |
| **SEC-02** | **Critical** | [AuthScreen.tsx](file:///C:/Users/Sergio%20Suarez/Documents/ai-skills-studio/src/components/AuthScreen.tsx) | **Sin protección contra fuerza bruta (Rate Limiting) y enumeración de usuarios:** Se podían enviar intentos infinitos de login y el mensaje de error revelaba si el correo existía o no. | Se implementaron [`checkLoginRateLimit`](file:///C:/Users/Sergio%20Suarez/Documents/ai-skills-studio/src/utils/securityHardening.ts#L146-L166) y [`recordFailedLoginAttempt`](file:///C:/Users/Sergio%20Suarez/Documents/ai-skills-studio/src/utils/securityHardening.ts#L171-L178) (bloqueo tras **5 intentos fallidos en 5 minutos**) y se unificó el mensaje a `"Credenciales inválidas. Verifica tu correo y contraseña."`. |
| **SEC-03** | **Critical** | [rarParserService.ts](file:///C:/Users/Sergio%20Suarez/Documents/ai-skills-studio/src/services/rarParserService.ts) | **Riesgo de Denegación de Servicio (DoS) y Path Traversal en archivos `.RAR`:** `file.arrayBuffer()` leía archivos de cualquier tamaño en memoria sin límite previo, y los nombres de archivo extraídos del binario no filtraban secuencias `../` o `..\\`. | Se añadieron [`validateUploadFile`](file:///C:/Users/Sergio%20Suarez/Documents/ai-skills-studio/src/utils/securityHardening.ts#L252-L294) (límite estricto de **25 MB** y validación de extensión `.rar`) y [`sanitizeArchiveFilePath`](file:///C:/Users/Sergio%20Suarez/Documents/ai-skills-studio/src/utils/securityHardening.ts#L215-L247) que neutraliza secuencias `../`, rutas absolutas y bytes nulos (`\0`). |
| **SEC-04** | **Required** | [App.tsx](file:///C:/Users/Sergio%20Suarez/Documents/ai-skills-studio/src/App.tsx) y [NavbarActiveSkill.tsx](file:///C:/Users/Sergio%20Suarez/Documents/ai-skills-studio/src/components/NavbarActiveSkill.tsx) | **Sesiones sin expiración (TTL) y falta de borrado de datos personales (GDPR/CCPA):** La sesión en `localStorage` duraba indefinidamente sin fecha de caducidad y no existía acción para borrar los datos personales almacenados. | Se implementaron [`createSecureSessionPayload`](file:///C:/Users/Sergio%20Suarez/Documents/ai-skills-studio/src/utils/securityHardening.ts#L306-L325) y [`parseSecureSessionPayload`](file:///C:/Users/Sergio%20Suarez/Documents/ai-skills-studio/src/utils/securityHardening.ts#L329-L381) con **TTL de 12 horas** (`expiresAt`), además de [`eraseAllPersonalData`](file:///C:/Users/Sergio%20Suarez/Documents/ai-skills-studio/src/utils/securityHardening.ts#L423-L440) accesible desde el menú de Colaborador. |
| **SEC-05** | **Required** | [VoiceVisualFeedback.tsx](file:///C:/Users/Sergio%20Suarez/Documents/ai-skills-studio/src/components/VoiceVisualFeedback.tsx) | **Entradas de voz y reseñas sin sanitización de frontera:** El texto transcrito por `SpeechRecognition` o pegado en el `<textarea>` no tenía filtro de caracteres de control ni tope estricto en el estado. | Se aplicó [`sanitizeUserText(text, 500)`](file:///C:/Users/Sergio%20Suarez/Documents/ai-skills-studio/src/utils/securityHardening.ts#L193-L209) tanto a los fragmentos de voz en tiempo real (`finalChunk` / `interimChunk`) como al envío del formulario, eliminando etiquetas `<script>`/HTML y caracteres de control. |
| **SEC-06** | **Required** | [index.html](file:///C:/Users/Sergio%20Suarez/Documents/ai-skills-studio/index.html) y [vite.config.ts](file:///C:/Users/Sergio%20Suarez/Documents/ai-skills-studio/vite.config.ts) | **Ausencia de Content-Security-Policy (CSP) y cabeceras HTTP de seguridad:** La aplicación no declaraba política CSP ni cabeceras contra `MIME sniffing` o `Clickjacking`. | Se agregó la meta etiqueta `Content-Security-Policy` en [index.html](file:///C:/Users/Sergio%20Suarez/Documents/ai-skills-studio/index.html#L6-L10) y se configuraron `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy` y `Permissions-Policy` en [vite.config.ts](file:///C:/Users/Sergio%20Suarez/Documents/ai-skills-studio/vite.config.ts#L5-L19). |

---

## 2. Hallazgos de Calidad y Arquitectura Encontrados y Corregidos (`code-review-and-quality`)

| ID | Eje de Revisión | Archivo Afectado | Qué estaba mal en el código (Antes) | Qué se modificó para corregirlo (Después) |
| :---: | :---: | :--- | :--- | :--- |
| **CR-01** | **Architecture & Readability** | [InformativeLandingSection.tsx](file:///C:/Users/Sergio%20Suarez/Documents/ai-skills-studio/src/components/InformativeLandingSection.tsx) | **Archivo monolítico > 1,100 líneas:** `InformativeLandingSection.tsx` tenía **1,101 líneas** porque mezclaba más de 330 líneas de catálogos estáticos (`FRAMEWORK_COLLECTIONS`, `MODEL_VERSION_PILLS`) con la lógica de presentación. | Se extrajo el catálogo estático y sus tipos al nuevo módulo [frameworkCollectionsData.tsx](file:///C:/Users/Sergio%20Suarez/Documents/ai-skills-studio/src/data/frameworkCollectionsData.tsx) (349 líneas), reduciendo `InformativeLandingSection.tsx` a **768 líneas**. |
| **CR-02** | **Readability (Dead Code)** | [NavbarActiveSkill.tsx](file:///C:/Users/Sergio%20Suarez/Documents/ai-skills-studio/src/components/NavbarActiveSkill.tsx) y [App.tsx](file:///C:/Users/Sergio%20Suarez/Documents/ai-skills-studio/src/App.tsx) | **Código muerto (Dead Code):** Quedaba un componente vacío `export const NavbarActiveSkill = () => null` que aún se importaba y montaba en `App.tsx` junto con el estado sin uso `isSidebarCollapsed`. | Se eliminó el componente muerto `NavbarActiveSkill`, su montaje innecesario en `App.tsx` y el estado huérfano `isSidebarCollapsed`. |
| **CR-03** | **Correctness (Type Boundaries)** | [App.tsx](file:///C:/Users/Sergio%20Suarez/Documents/ai-skills-studio/src/App.tsx) | **Casts inseguros en `JSON.parse`:** Al leer `localStorage`, se hacía `JSON.parse(saved) as UserAccount` y `Array.isArray(parsed)` sin verificar que cada elemento tuviera las propiedades requeridas (`id`, `name`, `filename`, `uiSpec`, etc.). | Se implementó el Type Guard explícito [`isValidSkillDocumentArray`](file:///C:/Users/Sergio%20Suarez/Documents/ai-skills-studio/src/utils/securityHardening.ts#L387-L417) y [`parseSecureSessionPayload`](file:///C:/Users/Sergio%20Suarez/Documents/ai-skills-studio/src/utils/securityHardening.ts#L329-L381) para validar la forma exacta de los datos antes de hidratar React. |
| **CR-04** | **Performance** | [App.tsx](file:///C:/Users/Sergio%20Suarez/Documents/ai-skills-studio/src/App.tsx) y [vite.config.ts](file:///C:/Users/Sergio%20Suarez/Documents/ai-skills-studio/vite.config.ts) | **Bundle monolítico > 500 kB (Warning en build):** Todas las pestañas se importaban estáticamente al inicio, generando un único archivo `dist/assets/index.js` de **538.30 kB** y disparando la alerta de Vite. | Se aplicó `React.lazy` + `<Suspense>` en [App.tsx](file:///C:/Users/Sergio%20Suarez/Documents/ai-skills-studio/src/App.tsx#L22-L53) para las 5 vistas secundarias y `manualChunks` (`vendor-react`, `vendor-icons`) en [vite.config.ts](file:///C:/Users/Sergio%20Suarez/Documents/ai-skills-studio/vite.config.ts#L20-L29). El bundle principal bajó a **335.21 kB** (`-37.7%`) y desapareció la alerta. |

---

## 3. Comparativa de Código (Antes vs. Después)

### A. Hashing de Contraseñas y Rate Limiting ([AuthScreen.tsx](file:///C:/Users/Sergio%20Suarez/Documents/ai-skills-studio/src/components/AuthScreen.tsx))

```diff
- // ANTES: Comparación y almacenamiento de contraseña en texto plano sin límite de intentos
- const matched = users.find(
-   (u) => u.email.toLowerCase() === cleanEmail && u.password === password
- );
- if (!matched) {
-   setError('Credenciales inválidas. Verifica tu correo y contraseña o regístrate.');
-   return;
- }
+ // DESPUÉS: Verificación de Rate Limit + Derivación PBKDF2-SHA256 (100,000 iteraciones)
+ const rateStatus = checkLoginRateLimit(cleanEmail);
+ if (!rateStatus.allowed) {
+   setError(`Demasiados intentos fallidos. Espera ${rateStatus.retryAfterSeconds}s.`);
+   return;
+ }
+ const derivedHash = await hashPasswordPBKDF2(password, cleanEmail);
+ const matched = users.find(
+   (u) => u.email.toLowerCase() === cleanEmail && u.passwordHash === derivedHash
+ );
```

### B. Validación de Archivos `.RAR` y Prevención de Path Traversal ([rarParserService.ts](file:///C:/Users/Sergio%20Suarez/Documents/ai-skills-studio/src/services/rarParserService.ts))

```diff
- // ANTES: Lectura directa en memoria sin límite de tamaño ni sanitización de rutas internas
- const buffer = await file.arrayBuffer();
+ // DESPUÉS: Límite de 25 MB en frontera + sanitización anti-Path Traversal (../)
+ const validation = validateUploadFile(file, MAX_RAR_UPLOAD_BYTES, ['.rar']);
+ if (!validation.valid) {
+   throw new Error(validation.error || 'Archivo .RAR rechazado por política de seguridad.');
+ }
+ const buffer = await file.arrayBuffer();
+ ...
+ const safePath = sanitizeArchiveFilePath(rawCandidate);
```

### C. Code-Splitting con `React.lazy` y `<Suspense>` ([App.tsx](file:///C:/Users/Sergio%20Suarez/Documents/ai-skills-studio/src/App.tsx))

```diff
- // ANTES: Importación estática de todas las vistas (generaba un chunk de 538.30 kB)
- import { SkillManager } from './components/SkillManager';
- import { UnifiedProjectStudio } from './components/UnifiedProjectStudio';
- import { UIComponentPreview } from './components/UIComponentPreview';
- import { ContextEvidenceLogger } from './components/ContextEvidenceLogger';
- import { AIModelBenchmarkPanel } from './components/AIModelBenchmarkPanel';
+ // DESPUÉS: Carga bajo demanda por pestaña (reduce el bundle inicial a 335.21 kB)
+ const SkillManager = lazy(() =>
+   import('./components/SkillManager').then((m) => ({ default: m.SkillManager }))
+ );
+ const UnifiedProjectStudio = lazy(() =>
+   import('./components/UnifiedProjectStudio').then((m) => ({ default: m.UnifiedProjectStudio }))
+ );
+ const UIComponentPreview = lazy(() =>
+   import('./components/UIComponentPreview').then((m) => ({ default: m.UIComponentPreview }))
+ );
+ const ContextEvidenceLogger = lazy(() =>
+   import('./components/ContextEvidenceLogger').then((m) => ({ default: m.ContextEvidenceLogger }))
+ );
+ const AIModelBenchmarkPanel = lazy(() =>
+   import('./components/AIModelBenchmarkPanel').then((m) => ({ default: m.AIModelBenchmarkPanel }))
+ );
```

---

## 4. Lista Completa de Archivos Creados y Modificados

1. **[NEW]** [src/utils/securityHardening.ts](file:///C:/Users/Sergio%20Suarez/Documents/ai-skills-studio/src/utils/securityHardening.ts) — Módulo central de seguridad (STRIDE, `hashPasswordPBKDF2`, `checkLoginRateLimit`, `sanitizeUserText`, `sanitizeArchiveFilePath`, `validateUploadFile`, `createSecureSessionPayload`, `parseSecureSessionPayload`, `isValidSkillDocumentArray`, `eraseAllPersonalData`).
2. **[NEW]** [src/data/frameworkCollectionsData.tsx](file:///C:/Users/Sergio%20Suarez/Documents/ai-skills-studio/src/data/frameworkCollectionsData.tsx) — Datos estáticos de colecciones de frameworks e insignias de modelos extraídos para mantener los componentes limpios.
3. **[MODIFY]** [src/components/AuthScreen.tsx](file:///C:/Users/Sergio%20Suarez/Documents/ai-skills-studio/src/components/AuthScreen.tsx) — Migrado a hashes `PBKDF2-SHA256`, rate limiting y sanitización de entradas.
4. **[MODIFY]** [src/services/rarParserService.ts](file:///C:/Users/Sergio%20Suarez/Documents/ai-skills-studio/src/services/rarParserService.ts) — Validación de límite de 25 MB, cabeceras mágicas RAR y sanitización contra Path Traversal.
5. **[MODIFY]** [src/components/VoiceVisualFeedback.tsx](file:///C:/Users/Sergio%20Suarez/Documents/ai-skills-studio/src/components/VoiceVisualFeedback.tsx) — Sanitización de transcripciones de voz y reseñas escritas (`sanitizeUserText`).
6. **[MODIFY]** [src/components/InformativeLandingSection.tsx](file:///C:/Users/Sergio%20Suarez/Documents/ai-skills-studio/src/components/InformativeLandingSection.tsx) — Reducido de 1,101 a 768 líneas importando `frameworkCollectionsData.tsx`.
7. **[MODIFY]** [src/components/NavbarActiveSkill.tsx](file:///C:/Users/Sergio%20Suarez/Documents/ai-skills-studio/src/components/NavbarActiveSkill.tsx) — Eliminado alias de código muerto `NavbarActiveSkill` y añadido botón de borrado de datos personales (GDPR) en el menú de Colaborador.
8. **[MODIFY]** [src/App.tsx](file:///C:/Users/Sergio%20Suarez/Documents/ai-skills-studio/src/App.tsx) — Integrados Type Guards explícitos, sesiones con TTL de 12h y `React.lazy` + `<Suspense>`.
9. **[MODIFY]** [index.html](file:///C:/Users/Sergio%20Suarez/Documents/ai-skills-studio/index.html) — Añadida política `Content-Security-Policy` (CSP) y `referrer`.
10. **[MODIFY]** [vite.config.ts](file:///C:/Users/Sergio%20Suarez/Documents/ai-skills-studio/vite.config.ts) — Añadidas cabeceras HTTP de seguridad y `manualChunks` para optimización de carga.
