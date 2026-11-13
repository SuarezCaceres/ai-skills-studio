# Plan · Códice: videos de YouTube en las clases y limpieza de Studio Engine

Rama: `feat/codice-mejoras-y-limpieza` (sale de `origin/main`). Es un plan, no está implementado.

## Decisiones tomadas

| Tema | Decisión |
| :--- | :--- |
| Reproducción | Reproductor incrustado dentro de la app (iframe de `youtube-nocookie.com`). |
| Cuántos videos | Una clase tiene **0 o más partes** de video, ordenadas («Parte 1», «Parte 2»…). El video es opcional: las clases actuales siguen siendo válidas. |
| Nombre de cada parte | Link + título **opcional**. Si queda vacío se muestra «Parte N» según el orden. |
| Links aceptados | `youtube.com/watch?v=`, `youtu.be/`, `shorts/`, `embed/`, `live/` y listas de reproducción (`/playlist?list=`). |
| Quién gestiona los videos | **Solo quien subió la clase** (el administrador que la crea): añade, reordena y borra las partes. Es la misma regla que ya existe para editar y borrar; no se crean permisos nuevos ni se usa `team.ts`. |
| Dónde se ve | Detalle de la clase (reproductor + lista de partes) y miniatura de la primera parte, con el número de partes, en la tarjeta de la lista. |
| Studio Engine | Se quita **pestaña y código**. Códice queda con Clases como única vista, sin selector de pestañas. |

## Decisiones que tomé yo (cámbialas si no te gustan)

- **Se guarda el ID, no el link.** Al pegar un link se extrae `kind` (`video` o `playlist`) y el `id` validado (11 caracteres `[A-Za-z0-9_-]` para video; `[A-Za-z0-9_-]{10,64}` para lista). El `src` del iframe se construye solo a partir de ese ID. Así un JSON importado no puede meter una URL arbitraria en el iframe.
- **Solo hosts de YouTube:** `youtube.com`, `www.`, `m.`, `youtu.be` y `youtube-nocookie.com`. Cualquier otro se rechaza con un mensaje claro.
- **Link con `v=` y `list=` a la vez:** se toma como video suelto. Una lista solo se crea con `/playlist?list=`.
- **Carga diferida:** el detalle muestra la miniatura con un botón de play y solo crea el iframe al hacer clic. Menos peticiones a terceros y pruebas deterministas.
- **Límite:** 12 partes por clase; título de parte de hasta 80 caracteres.
- **Sin migración:** `videos` es un campo nuevo y opcional, así que la clave `ai_skills_studio_lessons_v1` y el formato de exportación `version: 1` se mantienen. Una clase exportada con videos e importada en una versión vieja los pierde sin error.

## Modelo de datos

`src/types/lessons.ts`:

```ts
export interface LessonVideo {
  /** Identificador único dentro de la clase (para reordenar y borrar). */
  id: string;
  kind: 'video' | 'playlist';
  /** ID de YouTube ya validado (nunca la URL completa). */
  youtubeId: string;
  /** Opcional. Vacío = «Parte N». */
  title: string;
}

// Lesson  → videos: LessonVideo[]      (por defecto [])
// LessonDraft → videos: LessonVideo[]
```

## Entregas

Cada entrega termina con `npx tsc -b`, `npm run build` y las pruebas que toca en verde, y con su commit en Conventional Commits.

### E1 · Quitar Studio Engine

- `src/components/CodiceStudio.tsx` (653 líneas): borrar `SAMPLE_SKILLS`, el estado del Engine (`selectedSkillId`, `activeTab`, `selectedCategory`, `searchFilter`, `copied`, `isExecuting`, `executionOutput`), `handleCopyCode`, `handleRunInference`, el bloque `section === 'engine'`, el selector de pestañas y los botones «Live Sync» / «Run Pipeline». Quedan la cabecera y `LessonsSection`.
- Retirar los imports de `lucide-react` que dejen de usarse.
- El contenedor deja de ser `role="tabpanel"` (ya no hay `tablist`); conserva su región accesible.
- Revisar el subtítulo de la cabecera («WORKSPACE VFS & CLASES DEL EQUIPO»): sigue hablando de VFS, que ya no está en esta vista.
- `scripts/test-lessons.mjs` líneas ~105–110: cambiar «hay dos pestañas reales» y «Studio Engine conserva su contenido» por una comprobación de que no existe `Studio Engine` ni `tablist` y de que Clases se ve directamente.
- `memories.md` (línea ~286): actualizar la descripción de las pestañas de Códice.
- Commit: `refactor(codice): remove the studio engine tab and its sample content`.

### E2 · Modelo, parser y almacén

- Nuevo `src/services/youtube.ts`: `parseYouTubeLink(text)` → `{ kind, youtubeId } | { error }`, `embedUrl(video)`, `thumbnailUrl(video)` (`https://i.ytimg.com/vi/<id>/hqdefault.jpg`; para listas se usa la miniatura del primer video si se conoce, si no un marcador).
- `src/services/lessonsStore.ts`: añadir `videos` a `LIMITS`, `sanitizeLesson` (descarta partes con ID inválido y recorta a 12), `validateDraft` (error `videos`), `createLesson`, `updateLesson`.
- Los permisos no cambian: `canManageLesson` (solo el autor) gobierna también los videos.
- Pruebas en `scripts/test-lessons-store.mjs`: los 5 formatos de link, listas, hosts ajenos, IDs malformados, `javascript:`/`data:`, límite de 12, clase antigua sin `videos`, importar/exportar con y sin videos, un usuario que no es el autor no puede cambiar `videos`.
- Commit: `feat(lessons): add youtube video parts to the lesson model`.

### E3 · CSP y reproductor

- `index.html`: añadir `frame-src https://www.youtube-nocookie.com;` a la CSP (hoy `default-src 'self'` bloquearía el iframe). `img-src` ya admite `https:`, así que las miniaturas funcionan. No hace falta tocar `vite.config.ts`.
- Nuevo `src/components/lessons/VideoPlayer.tsx`: miniatura + botón de play accesible; al activar, crea el `<iframe>` con `src` = `embedUrl`, `title`, `loading="lazy"`, `referrerPolicy="strict-origin-when-cross-origin"`, `allow="encrypted-media; picture-in-picture"`, `allowFullScreen` y `sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"`. Comprobar en el navegador que YouTube sigue reproduciendo con ese `sandbox`; si no, quitar solo lo que sea necesario.
- `LessonDetail.tsx`: sección «Videos» con el reproductor de la parte activa y la lista de partes (nombre, orden); cambiar de parte reemplaza el reproductor.
- Commit: `feat(lessons): play youtube parts inside the lesson detail`.

### E4 · Gestión de partes y tarjeta

- `LessonEditor.tsx`: sección «Videos» con campo para pegar el link (validación en vivo con el error del parser), título opcional, añadir, reordenar (subir/bajar con botones, accesible por teclado) y borrar.
- Las partes se gestionan desde el mismo editor, que ya solo ven el autor (Editar y Borrar). No hay una vía aparte para otras personas.
- `LessonCard.tsx`: miniatura de la primera parte y «N partes» cuando hay más de una.
- Commit: `feat(lessons): manage video parts and show them on lesson cards`.

### E5 · Pruebas de interfaz y documentación

- `scripts/test-lessons.mjs`: crear una clase con una parte, añadir una segunda, reordenar, borrar, ver la miniatura en la tarjeta, reproducir, comprobar que otra persona con sesión ve los videos pero no los controles, y responsive en 1440, 1024, 768 y 390 px.
- **Las pruebas nunca deben tocar YouTube real:** interceptar `youtube-nocookie.com` y `i.ytimg.com` y responder con una página y una imagen vacías, igual que ya se hace con `api.github.com`.
- `memories.md` (`docs: update memories.md ...`) y, si procede, la sección «Componentes y Clases» del `README.md`.
- Ejecutar `npm test` completo antes de abrir el PR, que usa la plantilla de 5 secciones de `.github/pull_request_template.md`.

## Riesgos y cosas a vigilar

1. **Las clases viven en `localStorage` de cada navegador.** Otra persona solo ve una clase con videos si la importa por JSON; hasta que existan las clases compartidas por GitHub (la antigua E5 del brief WT4), los videos no llegan al resto del equipo por sí solos.
2. **La CSP:** `frame-src` abre una puerta a un tercero. Se limita a `www.youtube-nocookie.com`; no usar `youtube.com`.
3. **Listas de reproducción:** el iframe de una lista no permite saber de antemano cuántos videos tiene ni su miniatura. La tarjeta mostrará un marcador y no «N videos».
4. **Estilo:** carbón + acento cian `#0ea5e9`, `[display:grid]` en lugar de la clase `grid`, sin iconos emoji en controles.
