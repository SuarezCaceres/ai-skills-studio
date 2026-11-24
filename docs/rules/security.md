# Reglas de seguridad

Estas reglas protegen a las personas usuarias, sus tokens de GitHub y la integridad del catálogo comunitario de Códice Studio. Su cumplimiento es estricto e innegociable.

## Secretos y variables de entorno
- **Ningún secreto en el código ni en `VITE_*`:** toda variable con prefijo `VITE_*` es pública y Vite la incrusta literalmente en el bundle JavaScript distribuido al navegador. Solo pueden ir en `VITE_*` valores públicos (`VITE_CATALOG_REPO`, `VITE_GITHUB_CLIENT_ID`, `VITE_GITHUB_OAUTH_URL`).
- **`GITHUB_CLIENT_SECRET` vive únicamente en Vercel:** solo la función serverless `api/github-oauth.ts` puede leerlo desde el entorno de ejecución del servidor. En `.env.example` solo se documentan nombres de variables y ejemplos inocuos.
- **Prohibición de lectura y commit de `.env`:** ningún agente de IA puede leer `.env` ni `.env.local`, ni volcar variables sensibles en logs, pruebas o mensajes de error. El repositorio bloquea activamente estas acciones mediante `.githooks/pre-commit` y `.claude/hooks/guard.sh`.

## Identidad, OAuth y sesión en memoria
- **Autenticación exclusiva con GitHub OAuth + PKCE:** el inicio de sesión (`src/services/githubAuthService.ts`) exige flujo de código con PKCE (`S256`) y parámetro `state` aleatorio anti-CSRF de un solo uso con expiración corta (`TTL = 10 min`) validado con comparación en tiempo constante.
- **Token exclusivamente en memoria:** el `access_token` de GitHub vive **únicamente en memoria de ejecución** de la pestaña actual. Está terminantemente prohibido persistirlo en `localStorage`, `sessionStorage`, `IndexedDB`, cookies, parámetros de URL o logs.
- **Derecho de borrado local:** debe mantenerse siempre funcional `eraseAllPersonalData()` (`src/utils/securityHardening.ts`) para limpiar de forma inmediata e irreversible sesiones locales residuales, preferencias y copias de trabajo.

## Contenido externo no confiable y prevención de XSS
- Todo archivo `SKILL.md`, `CLASE.md`, descripción o marcador de GitHub Issue, archivo extraído en el VFS o JSON importado se trata como **entrada hostil no confiable**.
- **Renderizado seguro de Markdown:** cualquier Markdown externo debe renderizarse exclusivamente mediante `SafeMarkdown` (`src/components/catalog/SafeMarkdown.tsx`), que construye elementos de React sin usar `dangerouslySetInnerHTML`, recorta documentos gigantes (`MAX_MARKDOWN_CHARS`), no carga imágenes remotas arbitrarias y restringe enlaces a esquemas `http:`/`https:` con `rel="noopener noreferrer nofollow ugc"`.
- Prohibido introducir `dangerouslySetInnerHTML`, `eval`, `new Function` o inyección de HTML crudo. Las entradas de texto libre o dictado por voz deben pasar por `sanitizeUserText` (`src/utils/securityHardening.ts`).

## Archivos comprimidos y subida local de skills
- **Inspección de paquetes en memoria (`src/services/rarParserService.ts` y `src/utils/securityHardening.ts`):**
  - Mantener la sanitización anti-*Path Traversal* (`sanitizeArchiveFilePath`), rechazando segmentos `..`, rutas absolutas (`/` o unidades `C:`), barras invertidas y bytes nulos (`\0`).
  - Mantener la validación de frontera (`validateUploadFile`) con lista blanca de extensiones permitidas y límite máximo estricto de **25 MB** por paquete (`.zip`, `.skillbundle`, `.rar`).
- **Publicación de skills al catálogo (`src/services/skillUploadService.ts`):**
  - Mantener los topes de `UPLOAD_LIMITS`: máximo **50 archivos**, **1 MB por archivo** y **5 MB totales**.
  - Excluir automáticamente carpetas y archivos sensibles o residuales (`.git`, `node_modules`, `.env*`, `.DS_Store`, `Thumbs.db`, `__MACOSX`).
  - Mantener activo el escáner preventivo de credenciales (`SECRET_PATTERNS`) que aborta la subida ante claves privadas (`PRIVATE KEY`) o tokens reconocibles (`ghp_` / `github_pat_`, `AKIA`, `sk-`, tokens `xox*` de Slack, claves `AIza` de Google) **informando del tipo de hallazgo sin imprimir jamás el secreto detectado**.

## CSP, cabeceras e incrustaciones (`index.html` y `vite.config.ts`)
- Mantener la política `Content-Security-Policy` de `index.html` con `default-src 'self'`, `object-src 'none'`, `base-uri 'self'` y `frame-src https://www.youtube-nocookie.com`.
- Todo `<iframe>` de vídeo en clases debe usar el dominio `youtube-nocookie.com` e incluir atributos `sandbox` mínimos necesarios y `referrerPolicy="strict-origin-when-cross-origin"`.
- La directiva `connect-src` se rellena exclusivamente mediante el plugin `cspConnectSrc` en `vite.config.ts` (`'self'`, `https://api.github.com`, `https://generativelanguage.googleapis.com` y el origen HTTPS/localhost de `VITE_GITHUB_OAUTH_URL`). **Si cualquier cambio necesita abrir la CSP a otro origen de red, detente y solicita autorización humana explícita.**
- Conservar las cabeceras de endurecimiento HTTP (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), geolocation=(), payment=()`).

## Dependencias y ejecución de código
- Pide autorización antes de añadir cualquier dependencia externa (`AGENTS.md`) y prioriza implementaciones nativas auditables.
- Nunca ejecutes en cliente ni en servidor scripts (`.sh`, `.ps1`, `.py`, `.js`) contenidos dentro de skills o paquetes inspeccionados: Códice Studio solo los muestra como texto inerte.

## Lecciones aprendidas
- 2026-11 · Riesgo de exponer secretos accidentales al publicar carpetas locales en repos públicos `<login>/codice-skills` → Bloquear archivos `.env*` y escanear patrones de claves/tokens en cliente antes de crear blobs en GitHub, mostrando solo la categoría detectada y nunca el valor.
- 2026-11 · Persistencia accidental de credenciales OAuth en almacenamiento web → Mantener `currentSession` únicamente en variable de módulo en memoria dentro de `githubAuthService.ts` para que cerrar o recargar la pestaña invalide el alcance del token en el navegador.
