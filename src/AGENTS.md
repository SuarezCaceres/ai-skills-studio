# src/ — Frontend de Códice Studio

1. Antes de editar código en `src/`, lee `docs/stack/frontend.md` y `docs/rules/frontend.md`.
2. Si tocas sesiones OAuth, renderizado de Markdown externo o lectura/publicación de archivos, lee también `docs/rules/security.md`.
3. Activa y sigue la skill `frontend-proyecto` (`.agents/skills/frontend-proyecto/SKILL.md`).
4. Respeta la paleta carbón + cian `#0ea5e9` (cero violeta, naranja o emojis), usa `[display:grid]` en lugar de `.grid` y monta portales en `document.body`.
5. Renderiza todo Markdown externo mediante `SafeMarkdown` y mantén las páginas secundarias con `React.lazy` (< 350 kB en el bundle inicial).
6. **Prohibido** modificar o eliminar archivos dentro de `public/assets/*` sin autorización explícita del humano.
7. Si cambias componentes en `src/components/ui-kit/`, regenera sus miniaturas con `node scripts/capture-components.mjs`.
