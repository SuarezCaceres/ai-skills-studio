# Instrucciones para esta terminal (léelas completas antes de hacer nada)

Eres el agente del worktree **WT4**. Tu trabajo está en:

- Carpeta: `C:\Users\Sergio Suarez\Documents\proyctos\ai-skills-studio-wt-clases-componentes`
- Rama: `feat/codice-clases-componentes`
- Servidor de desarrollo: `npm run dev -- --port 5180 --strictPort` (abre http://localhost:5180/)

Trabaja **solo** en esa carpeta. **No entres** al repo principal `C:\Users\Sergio Suarez\Documents\proyctos\ai-skills-studio`: otra sesión lo usa. Las dependencias (`npm ci`) y `.env.local` ya están listos. La rama no tiene upstream a propósito: no hagas `push` a `main`.

## Paso 1 · Lee el documento completo

`docs/agents/WT4_CLASES_COMPONENTES.md` (en esta misma carpeta). Ahí están el contexto del código, los modelos de datos, las reglas del proyecto, las entregas y el criterio de "hecho". Síguelo.

## Paso 2 · Qué pidió el usuario

**A) Pestaña "Códice" → "Clases".** Una interfaz para **subir clases** que expliquen lo que se ha hecho en el equipo, por ejemplo "¿Qué es un hook?", "Cómo trabajar con worktrees" o "Cómo trabajé con esta skill". Al crear una clase se debe poder **seleccionar la skill ya subida al proyecto** y **los componentes usados**. Las píldoras decorativas actuales (Studio Engine, Skills Vault, Model Matrix, Synaptic Hooks) se eliminan o se conectan a contenido real.

**B) Pestaña "Componentes", rehecha desde cero.** Componentes **reales** (impleméntalos tú; no copies código ni imágenes de librerías de terceros), con **imágenes generadas a partir de los propios componentes**, y cada uno con su **skill asignada o su modelo de IA**. Si no tiene, debe decir explícitamente **"No asignado"**. Con una **lista lateral para escoger** el componente (Accordion, Alerts, Avatar, Badge, Banner, Bottom Navigation, Breadcrumb, Buttons, Button Group, Card, Carousel, Chat Bubble, Clipboard, Datepicker, Device Mockups, Drawer, Dropdowns, Footer, Forms, Gallery…).

`StylePresetCatalog.tsx` **no se borra**: lo usa el Workspace.

## Paso 3 · Cómo trabajar

- Hazlo por entregas **E1 → E4** (sección 8 del documento) y empieza por **E1**.
- Antes de cada entrega: `npx tsc -b`, `npm run build` y `npm test` en verde, con pruebas nuevas y capturas en 1440, 1024, 768 y 390 px.
- Identidad visual: carbón `#0a0d14` / `#121722` y **un solo acento cian `#0ea5e9`**, sin violeta. Usa `[display:grid]`, no la clase `grid`.
- **Los tests y las capturas nunca deben tocar `api.github.com` real** (límite de 60 peticiones/h por IP): intercéptalo.
- Commits atómicos en Conventional Commits. **No hagas `push`, PR ni merge hasta que el usuario lo pida.**
- Pregunta al usuario antes de: la entrega E5 (clases compartidas por GitHub) y cualquier cambio al repo `codice-skills-catalog`, añadir dependencias de npm, o cambiar los modelos de datos de `CatalogSkill` / `SkillDocument`.

## Paso 4 · Mantente al día con `main`

Si el usuario te avisa de que `main` avanzó (por ejemplo la Fase 3: subir skills desde el equipo local), integra con:

```
git fetch github
git merge github/main
```

No debería haber conflictos con tus archivos propios; si los hay en `App.tsx`, resuélvelos conservando ambos cambios.

## Paso 5 · Cuando tengas algo que ver

Avisa al usuario con lo que está listo en http://localhost:5180/ y qué entrega cerraste.
