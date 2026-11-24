# Referencias del proyecto

> **Qué contiene:** índice del material de consulta técnica (guías, patrones reales, fixtures y ejemplos canónicos) de Códice Studio (`ai-skills-studio`). Úsalo cuando necesites ver *cómo* implementar un patrón concreto sin duplicar documentación existente.

A diferencia de `docs/rules/`, este directorio **no define reglas nuevas**: enlaza a las fuentes de verdad que ya viven en el código y en `docs/`. En caso de discrepancia entre cualquier material de referencia y `docs/rules/`, **siempre prevalecen las reglas de `docs/rules/`**.

## Mapa de subcarpetas

| Carpeta | Índice | Qué encontrarás |
|---------|--------|-----------------|
| `frontend/` | [`frontend/README.md`](./frontend/README.md) | Sistema de diseño base, registro del UI Kit (`componentRegistry.ts`), los 20 componentes accesibles (`src/components/ui-kit/`) y el kit estático `tasteskill 2.5.1`. |
| `backend/` | [`backend/README.md`](./backend/README.md) | Puesta en marcha del repo catálogo y `codice-labeler.yml` (`docs/catalog-setup.md`), función OAuth en Vercel (`api/github-oauth.ts`), servicios Git Data API y plan de equipos (`docs/plans/PLAN_EQUIPOS.md`). |
| `testing/` | [`testing/README.md`](./testing/README.md) | Fixtures de GitHub simulado (`github-fixture.mjs` y `fake-github-classes.mjs`) y ejemplos canónicos de pruebas rápidas en Node puro frente a pruebas E2E con Playwright. |

## Criterios para añadir nuevas referencias
- Un archivo por tema con nombre descriptivo (`patron-carga-diferida.md`, nunca `notas.md`), sin copiar bloques largos que ya existan en el código: enlaza al archivo real.
- Empieza cada documento con una línea que indique de qué trata y cuándo conviene leerlo.
- Si una guía pasa a ser obligatoria en todas las sesiones, muévela a `docs/rules/`.
- Si describe un flujo repetible paso a paso, conviértelo en skill dentro de `.agents/skills/`.
