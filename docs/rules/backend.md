# Reglas del backend

Códice Studio opera sin servidor monolítico ni base de datos propia. En este repositorio, las reglas de backend gobiernan **dos fronteras críticas**:
1. La función serverless **`api/github-oauth.ts`** desplegada en Vercel (único punto con credenciales privadas).
2. La **capa de servicios cliente-servidor** que utiliza GitHub como almacén comunitario e identidad (`src/services/githubCatalogService.ts`, `src/services/githubAuthService.ts`, `src/services/skillUploadService.ts` y `src/services/lessonSharing.ts`).

El detalle de arquitectura e infraestructura está en `docs/stack/backend.md`.

## Función `api/github-oauth.ts` (Zona blindada)
- **CORS estricto por lista blanca:** valida siempre la cabecera `Origin` contra `ALLOWED_ORIGINS` (tanto en `OPTIONS` como en `POST`) antes de ejecutar cualquier lógica. Si el origen no coincide exactamente, responde `403` (`origin_not_allowed`).
- **Acotación y validación en el borde:**
  - Limita el tamaño bruto de la petición a `MAX_BODY_BYTES = 2048` antes de parsear JSON (`413 payload_too_large`).
  - Valida `code` (`/^[A-Za-z0-9_-]{10,100}$/`), `redirect_uri` (longitud acotada y origen perteneciente a `ALLOWED_ORIGINS`) y `code_verifier` de PKCE (`/^[A-Za-z0-9._~-]{43,128}$/`).
- **Respuesta mínima y sin caché:** devuelve exclusivamente `{ access_token, token_type, scope }` con cabeceras `Cache-Control: no-store` y `X-Content-Type-Options: nosniff`.
- **Opacidad de errores internos:** ante fallos de validación o del intercambio con GitHub, responde con códigos estables y genéricos (`invalid_code`, `invalid_redirect_uri`, `invalid_code_verifier`, `exchange_failed`, `github_unreachable`) sin registrar tokens ni reenviar trazas o mensajes crudos de GitHub.

## Integridad y autoría en GitHub Issues y Repositorios
- **Prohibido confiar en el marcador HTML para atribuir autoría:** el bloque `<!-- codice:v1 {...} -->` del cuerpo de un Issue es solo una instantánea de metadatos editable por quien abre el Issue. La identidad real del autor se determina **siempre** a partir de `issue.user.login` verificado por GitHub, exigiendo que el repositorio referenciado coincida con `<login>/codice-skills` (o, en flujos de equipos, que el usuario figure explícitamente en `admins` dentro de `equipo.json`).
- **Lecturas inmutables fijadas por SHA:** las skills instalables y las clases compartidas del catálogo se leen siempre apuntando a un `commitSha` concreto de 40 caracteres hexadecimales, nunca a una rama flotante (`main`), salvo cuando la persona ejecuta explícitamente la sincronización controlada (`syncSkillToLatest`).
- **Escrituras atómicas y control de concurrencia:** publicar o editar archivos en `<login>/codice-skills` debe hacerse en un **único commit atómico** mediante la Git Data API (blobs, tree, commit y actualización de referencia), fijando siempre modo de archivo regular sin bit ejecutable (`100644`), comprobando `expectBase64` o el SHA previo de la cabeza y lanzando error tipado `conflict` antes de sobrescribir cambios externos.

## Cuota, paginación y caché frente a la API de GitHub
- Respeta los límites de peticiones de GitHub (**60 req/h** sin sesión y **5000 req/h** con token OAuth): acota el número máximo de páginas al listar Issues (`MAX_ISSUE_PAGES`), cachea las lecturas en memoria/almacenamiento con TTL y sirve la última instantánea cacheada como respaldo degradado si GitHub responde con `rate_limit`.
- **Consistencia tras escritura (`read-your-writes`):** GitHub aplica caché HTTP (`Cache-Control: max-age=60`) y ligero retardo de indexación en listados de Issues. Tras publicar, votar o actualizar un Issue propio, relee evitando caché obsoleta y combina el listado con `recentAnchors` en memoria para que el cambio aparezca de inmediato sin duplicados.

## Contratos y manejo de errores
- Mantén sincronizados los contratos en `src/types/catalog.ts` y `src/types/lessons.ts` en el mismo cambio que modifique un servicio.
- Traduce los fallos HTTP o de red a errores de dominio tipados (`CatalogError`, `AuthError`, `UploadError`) con códigos semánticos para que la interfaz muestre mensajes accionables en español.

## Lecciones aprendidas
- 2026-11 · Retraso e inconsistencia de `max-age=60` al listar GitHub Issues recién creados → Forzar relectura sin caché HTTP tras escrituras propias y fusionar temporalmente con `recentAnchors` hasta que la API pública refleje el Issue.
- 2026-11 · Rechazo de OAuth en desarrollo al abrir `127.0.0.1` o IP de red local → Usar siempre `http://localhost:5173` en desarrollo local para que el `Origin` y el `redirect_uri` coincidan exactamente con la OAuth App y con `ALLOWED_ORIGINS`.
