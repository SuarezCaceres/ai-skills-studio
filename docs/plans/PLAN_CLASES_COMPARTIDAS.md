# Plan · Clases compartidas: «Mis clases» y «Comunidad»

Resultado de la entrevista con el usuario. Es un plan, no está implementado. Parte de la rama `feat/codice-mejoras-y-limpieza` (videos en las clases), de la que depende.

## Decisiones tomadas

| Tema | Decisión |
| :--- | :--- |
| Quién ve las clases compartidas | **Solo quien tenga sesión de GitHub en la app.** Sin sesión, la pestaña Comunidad invita a entrar. Solo lectura: nadie edita ni borra las de otra persona. |
| Dónde viven | `classes/<slug>/` en `<login>/codice-skills` (el mismo repo público donde ya se suben las skills) + un Issue `[class]` en el repo catálogo para descubrirlas. Cada persona es dueña de lo suyo. |
| Cuándo se hace pública | **Botón «Compartir» explícito.** Subir una clase sigue siendo local y privado. Compartir pide confirmación y se puede retirar. |
| Cómo se navega | Dos vistas: **Mis clases** (las tuyas, editables, locales) y **Comunidad** (compartidas por cualquiera, solo lectura, con filtro por autor). |

> **Aviso de honestidad que la interfaz debe decir:** exigir sesión es un filtro de la app, no privacidad. Lo compartido queda en un repo **público** de GitHub y cualquiera puede leerlo ahí. El diálogo de «Compartir» lo dirá con esas palabras. Si algún día hace falta privacidad real, el camino es el de los equipos (`PLAN_EQUIPOS.md`) con repos privados.

## Decisiones que tomé yo (cámbialas si no te gustan)

- **Dos archivos por clase**, en un único commit: `clase.json` (título, resumen, nivel, etiquetas, skills, componentes, videos) y `CLASE.md` (la explicación). Así los videos se guardan estructurados y no hay que inventar un YAML.
- **El Issue ancla lleva los metadatos** en el marcador `<!-- codice:v1 {...} -->` (`kind: 'class'`), así la lista de Comunidad se arma **sin pedir los archivos**. El contenido se pide solo al abrir una clase.
- **Fijada a un commit** (`sha`), igual que las skills: lo que se ve es lo que se compartió. Para publicar cambios hay un botón «Actualizar lo compartido».
- **La autoría no se cree al marcador.** El autor es quien abrió el Issue, y solo se acepta si el repo del marcador es `<ese-login>/codice-skills`. Así nadie puede publicar una clase «a nombre de» otra persona apuntando a su repo.
- **Retirar** = commit que borra `classes/<slug>/` + cerrar el Issue. La clase local no se toca.
- **No se necesita un permiso nuevo de GitHub:** el alcance `public_repo` actual ya cubre escribir en repos públicos y abrir Issues.
- **Importar/exportar JSON no arrastra el estado de «compartida»:** una clase importada de otra persona nunca aparece como compartida por ti.

## Modelo de datos

`src/types/lessons.ts` (campo aditivo y opcional, la clave local sigue siendo `_v1`):

```ts
export interface LessonShare {
  repo: string;        // «<login>/codice-skills»
  slug: string;        // carpeta dentro de classes/
  issueNumber: number;
  sha: string;         // commit al que está fijada
  sharedAt: string;
  /** Hash del contenido compartido, para saber si hay cambios sin compartir. */
  contentHash: string;
}
// Lesson → shared?: LessonShare
```

`CommunityLesson` (solo lectura, nunca se guarda en `localStorage`): los campos de `Lesson` más `issueUrl` y `repoUrl`, sin `bodyMarkdown` hasta abrirla.

## Entregas

Cada entrega termina con `npx tsc -b`, `npm run build` y sus pruebas en verde, y con su commit en Conventional Commits. Todo lo visual pasa por la skill `ui-ux-pro-max` y por `design-system/…/MASTER.md`; carbón + acento cian `#0ea5e9`, `[display:grid]` en lugar de la clase `grid`.

### C1 · Contratos y lógica pura (sin red)

- `types/lessons.ts`: `LessonShare`, `CommunityLesson`. `types/catalog.ts`: ampliar `MarkerPayload.kind` con `'class'`.
- Nuevo `src/services/lessonSharing.ts`, todo puro y probable:
  - `buildSharedFiles(lesson)` → `{ 'classes/<slug>/clase.json', 'classes/<slug>/CLASE.md' }`.
  - `buildClassMarker(lesson, repo, slug, sha)` y `readClassMarker(body)`.
  - `toCommunityLesson(issue, marker)`: reutiliza `sanitizeLesson` (videos, etiquetas, ids) y **verifica la autoría** (login del Issue = dueño del repo del marcador); descarta lo que no cumpla.
  - `contentHash(lesson)` para detectar «cambios sin compartir».
- Pruebas (`scripts/test-lesson-sharing.mjs`): archivos generados, marcador ida y vuelta, autoría falsificada, `javascript:`/URLs en videos, tamaños, hash estable.
- Commit: `feat(lessons): add the pure logic to share lessons through github`.

### C2 · Servicio de GitHub

- Se añaden a `GithubCatalogApi`, como opcionales igual que `publishLocalSkill` (los helpers de commit viven dentro del cierre de `createGithubCatalogService`):
  - `shareLesson(lesson)`: asegura `<login>/codice-skills`, commit único con los dos archivos, Issue ancla con etiquetas `class` y `class:<id>`.
  - `updateSharedLesson(lesson)`: nuevo commit y marcador actualizado.
  - `unshareLesson(share)`: commit que borra la carpeta y cierra el Issue.
  - `listCommunityLessons()`: Issues con etiqueta `class`, paginados (hasta 300), solo metadatos.
  - `getCommunityLesson(id)`: pide `clase.json` y `CLASE.md` al `sha` fijado por la API de contenidos (el `connect-src` de la CSP solo permite `api.github.com`) y los sanea.
- Reutiliza `cachedGet`/TTL del catálogo. Con sesión el límite es de 5000/h.
- `shareLesson` es idempotente: si ya existe un Issue `[class]` de esa autora para ese `slug` (por ejemplo tras importar su copia de seguridad en otro navegador), lo actualiza en lugar de duplicarlo.
- `scripts/lib/github-fixture.mjs`: ampliar el GitHub simulado con Issues `[class]`, `contents` y `git/trees|commits|refs`.
- Pruebas contra el GitHub simulado: compartir, actualizar, retirar, listar, y errores (sin sesión, repo borrado, 404, límite de peticiones).
- Commit: `feat(lessons): share, update and unshare lessons from the github service`.

### C3 · Interfaz

- **Mis clases | Comunidad** como pestañas reales (`tablist`, con teclado de flechas) arriba de `LessonsSection`; «Mis clases» es la actual.
- **Compartir** (solo la autora, en el detalle y en la tarjeta): diálogo de confirmación con el aviso de honestidad, qué se publica, dónde y cómo retirarlo. Estados: *Privada* / *Compartida* / *Cambios sin compartir* (con «Actualizar lo compartido») / error con reintento. Retirar pide confirmación.
- **Comunidad**: lista con los mismos filtros que Mis clases más **Autor**; tarjeta idéntica con una etiqueta «De @login» (y «Tuya» si lo es); detalle de solo lectura sin Editar, Borrar ni Compartir; videos incluidos. Estados de carga, vacío («Todavía nadie compartió clases»), error y «Esta clase ya no está disponible».
- **Sin sesión**: Comunidad muestra una invitación a entrar con GitHub y nada más (no se hace ninguna petición).
- Accesibilidad: foco al cambiar de pestaña, `aria-live` para los estados de compartir/retirar, objetivos ≥ 44 px, `prefers-reduced-motion`.
- Commit: `feat(lessons): add the community view and the share flow`.

### C4 · Repo catálogo (necesita tu permiso y acción manual)

- El workflow `codice-labeler.yml` del repo `codice-skills-catalog` solo reconoce `kind` `skill` y `result`; hay que aceptar `class` y las etiquetas `class` y `class:<id>`. **Hasta hacerlo, los Issues de clases no reciben etiquetas y Comunidad sale vacía.**
- Yo dejo el YAML nuevo listo en `docs/catalog-setup.md`; **tú lo aplicas** en ese repo. No toco el repo catálogo sin que lo pidas.
- Commit: `docs(catalog): document the class labels for the labeler workflow`.

### C5 · Pruebas de interfaz y documentación

- `scripts/test-lessons-share.mjs` (en `npm test`): compartir con confirmación, aviso visible, estados, actualizar, retirar, Comunidad con clases de varias personas, filtro por autor, solo lectura (sin Editar/Borrar), sin sesión (sin peticiones), autoría falsificada ignorada, clase retirada, responsive en 1440/1024/768/390 y **nunca `api.github.com` ni YouTube reales**.
- `memories.md` (`docs: update memories.md …`) y la sección «Componentes y Clases» del README.

## Riesgos y cosas a vigilar

1. **No es privado.** Todo lo compartido es público en GitHub; la sesión solo filtra la app. El texto del diálogo no puede suavizarlo.
2. **Depende de un cambio manual en el repo catálogo** (C4). Sin él, Comunidad no lista nada aunque lo demás funcione.
3. **Contenido ajeno no fiable.** Markdown por `SafeMarkdown`, videos solo como IDs validados, enlaces solo `https:`, tamaños acotados, y descarte de entradas con autoría que no cuadre. No se renderiza nada que no pase por `sanitizeLesson`.
4. **Spam o contenido molesto.** Cualquiera con GitHub puede compartir. Para empezar la moderación es cerrar el Issue desde el repo catálogo; reportar/ocultar desde la app queda fuera de este plan.
5. **Cuota de la API.** Listar solo con metadatos y pedir el contenido al abrir mantiene el consumo bajo; aun así se cachea y se muestra el aviso de límite que ya usa el catálogo.
6. **Cambios después de compartir.** Se resuelve con el `sha` fijado y el botón «Actualizar lo compartido»; el `contentHash` evita que la persona crea que ya está publicado lo que editó.
7. **Equipos.** `PLAN_EQUIPOS.md` prevé equipos con su repo. Comunidad no depende de ellos y luego podrá filtrarse por equipo; no se mezclan hoy.
8. **Orden de ramas.** Esto se apoya en los videos. Conviene abrir el PR de `feat/codice-mejoras-y-limpieza` primero y trabajar C1–C5 en una rama nueva (`feat/codice-clases-compartidas`) que salga de ella o de `main` ya fusionado.
