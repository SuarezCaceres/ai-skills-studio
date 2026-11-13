# WT1 — Datos, GitHub y autenticación (`feat/catalog-github-backend`)

## Reglas comunes (obligatorias)
- Lee primero `memories.md` (secciones 11 y la regla de commits/PR) y `src/types/catalog.ts`.
- Trabaja SOLO en los archivos propios listados abajo. No edites `src/App.tsx`, `src/types/catalog.ts` ni `src/types/workspace.ts`; si necesitas un cambio ahí, anótalo en el PR y no lo hagas tú.
- Commits en Conventional Commits: `<tipo>(<ámbito>): <descripción en imperativo>`; PR con las 5 secciones de `.github/pull_request_template.md`.
- Identidad visual: carbón `#0a0d14`/`#121722`, único acento cian `#0ea5e9`, sin violeta; Geist / Geist Mono; probar a 1440, 1024, 768 y 390 px.
- Todo contenido de skills externas es NO confiable: sanitizar el Markdown, nunca ejecutar nada.
- Antes de abrir PR: `npx tsc -b`, `npm run build` y `npm test` en verde.

## Archivos propios
`src/services/githubCatalogService.ts`, `src/services/githubAuthService.ts`, `src/hooks/useCatalog.ts`, `api/github-oauth.ts`, `docs/catalog-setup.md`, `src/components/AuthScreen.tsx`.

## Tareas
1. Implementar `CatalogApi` (ver `src/types/catalog.ts`) en `githubCatalogService.ts`:
   - `registerSkillFromUrl`: aceptar `https://github.com/usuario/repo[/tree/rama/ruta]` o `usuario/repo`; leer `SKILL.md` (frontmatter `name`/`description`), árbol de archivos, licencia y SHA por la API de GitHub; calcular `hasScripts`.
   - Resultados: crear y leer Issues del repo catálogo con etiquetas `result`, `model:*`, `verdict:*`, `skill:<id>`. El modelo debe ser un `SpecificModelVersion`.
   - Votos: reacciones 👍 sobre un Issue ancla por skill.
   - Lecturas públicas sin token; escrituras con token. Caché en memoria y `localStorage` con TTL; manejar el rate limit de GitHub con mensajes claros.
2. `useCatalog.ts`: hook que expone `CatalogApi` más la sesión (`GithubSession`).
3. OAuth: `githubAuthService.ts` (botón "Entrar con GitHub", estado anti-CSRF) y `api/github-oauth.ts` (función Vercel que intercambia el código por token; el `client secret` solo como variable de entorno, nunca en el repo; CORS limitado al dominio del sitio). El token vive en memoria, no en `localStorage`.
4. `AuthScreen.tsx`: retirar el usuario semilla precargado y el botón de acceso demo.
5. `docs/catalog-setup.md`: pasos para crear el repo catálogo, la OAuth App y el proyecto de Vercel.

## Hecho cuando
- Pegar una URL real registra la skill y aparece en `listSkills`.
- Un reporte de resultado crea un Issue verificable en GitHub.
- No hay credenciales en el repo ni en el bundle.
