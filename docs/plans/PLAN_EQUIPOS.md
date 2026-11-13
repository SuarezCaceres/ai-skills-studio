# Plan · Equipos de trabajo (Fases 5 y 6)

Resultado de la entrevista `/grill-me` con el usuario. Es un plan, no está implementado.

## Decisiones tomadas

| Tema | Decisión |
| :--- | :--- |
| Dónde vive el equipo | Repo público del administrador `<admin>/<equipo>-skills` con `equipo.json` (fuente de verdad) + Issue de tipo `team` en `codice-skills-catalog` para descubrirlo. Directorio público de equipos. |
| Roles | Administradores y miembros. Un administrador puede nombrar a otros administradores. |
| Cómo se une una persona | **Un código por persona, de un solo uso, que caduca a los 7 días.** El admin escribe el usuario de GitHub; GitHub manda la invitación al repo al correo vinculado; la persona la acepta (la app puede aceptarla por API) y escribe el código en la app para confirmar. La app no envía correos: el admin copia el código y lo pasa por su canal. |
| Varios equipos | Una persona puede estar en varios; selector de equipo en Skills. |
| Panel de admin (v1) | Ver miembros y roles · invitar con código (ver y cancelar pendientes) · ascender a admin y quitar miembros · editar y archivar el equipo. |
| Pregunta al iniciar sesión | Solo si no tiene equipo y no eligió "Ahora no". Tres opciones: Unirme con un código · Crear un equipo (ser administrador) · Ahora no. Queda siempre en el menú de la cuenta. |
| Dónde va una skill nueva | Selector en el diálogo de subir: repo personal o un equipo del que es miembro. |
| Skills del equipo y autores | Viven en el repo común. Quienes trabajaron en cada una salen del historial de commits de su carpeta (`GET /repos/{o}/{r}/commits?path=skills/<slug>`), con avatar. No se puede falsificar. |
| Lo que ya existe | Desaparece la lista fija `src/config/team.ts`. Las 6 skills actuales se quedan en el Catálogo general. La pestaña Skills pasa a "Mis equipos" y el equipo del usuario se crea desde la app. |
| Entregas | Fase 5: equipos y miembros. Fase 6: skills del equipo. |

## Modelo de datos

`<admin>/<slug>-skills/equipo.json`:

```json
{
  "version": 1,
  "nombre": "Equipo Códice",
  "descripcion": "…",
  "archivado": false,
  "admins": ["SuarezCaceres"],
  "miembros": [{ "login": "otra-persona", "desde": "2026-11-20T00:00:00Z" }],
  "invitaciones": [{ "login": "nueva-persona", "codigoHash": "sha256:…", "sal": "…", "caduca": "2026-11-27T00:00:00Z" }]
}
```

- Issue en el catálogo: `[team] <owner>/<repo>`, etiqueta `team`, marcador `<!-- codice:v1 {kind:'team',…} -->`. **Un equipo solo es válido si el autor del Issue figura en `admins` de su `equipo.json`** (se comprueba al leer); así nadie puede inventar un equipo ajeno.
- El código se guarda solo como hash con sal. Debe ser largo (≥ 10 caracteres base32). Una invitación es de una sola persona, así que un código filtrado no sirve a otra.
- Los permisos reales son los de GitHub: miembros = colaboradores con escritura; admins = colaboradores con permiso `admin`. `equipo.json` es lo que la app muestra; GitHub es lo que manda.

## Flujos

1. **Crear equipo (admin):** nombre y descripción → crear repo público `<slug>-skills` → commit con `equipo.json` y README → Issue `team` en el catálogo.
2. **Invitar:** admin escribe un login → `PUT /repos/{o}/{r}/collaborators/{login}` (GitHub envía el correo) → se añade la invitación con `codigoHash` a `equipo.json` → la app muestra el código **una sola vez** para copiarlo.
3. **Unirse:** la persona ve la invitación (`GET /user/repository_invitations`), escribe el código; la app comprueba el hash y la caducidad, acepta la invitación (`PATCH /user/repository_invitations/{id}`) y registra su ingreso. Como no puede escribir `equipo.json` antes de ser colaborador, lo hace justo después de aceptar; si falla, el admin lo sincroniza al abrir el panel.
4. **Roles y bajas:** ascender = permiso `admin` + `admins`; quitar = `DELETE …/collaborators/{login}` + sacarlo de `miembros`. El último administrador no puede irse sin nombrar a otro.
5. **Archivar:** `archivado: true` y el equipo pasa a solo lectura.
6. **Pregunta al iniciar sesión:** tras el login, si no hay equipos y no hay "Ahora no" en `localStorage` (por cuenta), mostrar la pantalla de tres opciones.

## Fase 5 · Equipos y miembros

1. Servicio `teamService` (leer equipos del catálogo, validar `equipo.json`, crear equipo, invitar, unirse, roles, bajas, archivar) con pruebas en Node contra un GitHub simulado, como `test-skill-upload.mjs`.
2. Pantalla de inicio de sesión: las tres opciones y "Ahora no".
3. Páginas: directorio de equipos, página del equipo (miembros con avatar y rol) y panel de administración.
4. Pestaña Skills → "Mis equipos" con selector.
5. Retirar `src/config/team.ts` y sus usos (`TeamSkillsPage`, perfil).
6. Pruebas de interfaz con GitHub interceptado y recorrido real con la cuenta del usuario.

## Fase 6 · Skills del equipo

1. Selector "¿Dónde?" en `PublishSkillDialog` (personal o equipo): publica en el repo común y registra la skill con el equipo.
2. Edición entre miembros: `commitSkillChanges` ya existe, pero hoy exige repo propio; ampliar a repos de equipo donde se es colaborador.
3. Autores por commits en el detalle y las tarjetas de la skill; contribuyentes en el perfil de cada miembro.
4. El estudio ("Abrir en estudio") y las asignaciones de Componentes / Clases siguen funcionando con skills de equipo.

## Riesgos y cosas a verificar al empezar

- Confirmar en la práctica que `public_repo` basta para invitar colaboradores, darles permiso `admin` y aceptar invitaciones por API. Si no basta, habría que ampliar el permiso de la OAuth App (los usuarios deberán volver a autorizar).
- Si el administrador creador se va, el repo queda en su cuenta: documentar la transferencia manual en GitHub.
- Todo es público: un "equipo privado" no existe; es un directorio abierto con acceso de escritura controlado.
- Límite anónimo de GitHub (60/h): leer el directorio y varios `equipo.json` consume peticiones; con sesión no es problema. Cachear.
- El login de GitHub en desarrollo solo funciona en `http://localhost:5173`.
- Se coordina con la terminal 2 solo si toca `App.tsx` o `PublishSkillDialog`; sus archivos propios (Componentes, Clases) no se cruzan.
