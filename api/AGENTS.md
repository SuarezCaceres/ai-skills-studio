# api/ — Función Serverless OAuth (Vercel)

1. Antes de editar `api/github-oauth.ts`, lee `docs/stack/backend.md`, `docs/rules/backend.md`, `docs/rules/security.md` y `docs/catalog-setup.md`.
2. Activa y sigue la skill `backend-proyecto` (`.agents/skills/backend-proyecto/SKILL.md`).
3. Este archivo es el **único** punto con acceso a `GITHUB_CLIENT_SECRET`: jamás registres secretos ni tokens en logs, respuestas de error o código.
4. Nunca leas ni commitees archivos `.env` o `.env.local`.
5. Mantén la validación estricta de entrada (`MAX_BODY_BYTES`, `code`, `redirect_uri`, `code_verifier?`) y cabeceras `Cache-Control: no-store`.
6. **Pide confirmación humana explícita** antes de alterar la validación de orígenes CORS (`ALLOWED_ORIGINS`) o el flujo/contrato de intercambio OAuth con GitHub.
