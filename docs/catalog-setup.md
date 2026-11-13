# Puesta en marcha del catálogo comunitario de skills

Esta guía deja listo el backend del catálogo (GitHub + OAuth + Vercel). Son pasos **manuales** que debe hacer el dueño del proyecto: el código del repo no crea cuentas, repos, OAuth Apps ni proyectos, y **nunca** debe contener credenciales.

Arquitectura en una línea: el navegador lee y escribe en la API de GitHub; el único secreto (el *client secret* de la OAuth App) vive en una función serverless de Vercel que solo intercambia el código de login por un token.

```
Navegador ──(lecturas públicas, sin token)──────────────► api.github.com
Navegador ──(código OAuth)──► Vercel api/github-oauth ──► github.com/login/oauth  (aquí está el client secret)
Navegador ──(escrituras con el token en memoria)────────► api.github.com  (Issues y reacciones del repo catálogo)
```

## 1. Repo catálogo (GitHub)

1. Crea un repositorio **público** (por ejemplo `TU_USUARIO/codice-skills-catalog`). Puede estar casi vacío: solo guarda Issues.
2. En *Settings → General → Features* deja activados **Issues**. Desactiva Wikis y Projects si no los usas.
3. Añade el workflow de etiquetado `.github/workflows/codice-labeler.yml` (ver abajo). Es **imprescindible**: GitHub descarta las etiquetas que pone un usuario sin permiso de *triage*, y el catálogo se lee por etiquetas (`skill`, `result`, `model:*`, `verdict:*`, `skill:<id>`). El workflow las aplica con el `GITHUB_TOKEN` del repo, validándolas.
4. (Opcional) Crea las etiquetas `skill` y `result` con el color que prefieras; el resto se crean solas.

### Qué guarda cada Issue

| Tipo | Título | Etiquetas | Uso |
| :--- | :--- | :--- | :--- |
| Ancla de skill | `[skill] usuario/repo/ruta` | `skill`, `skill:<id>` | Registro de la skill. Sus reacciones 👍 son los votos. |
| Resultado | `[result] <skill> · <modelo> · <veredicto>` | `result`, `model:<modelo>`, `verdict:<worked/partial/failed>`, `skill:<id>` | Reporte "funcionó con el modelo X". |
| Clase compartida | `[class] <login>/<id>` | `class`, `class:<id>` | Clase de Códice compartida por su autora (pestaña *Comunidad*). El marcador lleva los metadatos y apunta a `classes/<id>/` de `<login>/codice-skills`. |

Si el id supera los 50 caracteres (límite de GitHub para etiquetas) se usa `skill:h-<hash>` (y `class:h-<hash>` en las clases). Cada Issue lleva en el cuerpo un marcador `<!-- codice:v1 {...} -->` con los datos estructurados; el workflow y la app lo leen y validan.

### Workflow `codice-labeler.yml`

```yaml
name: codice-labeler
on:
  issues:
    types: [opened]
permissions:
  issues: write
jobs:
  label:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/github-script@v7
        with:
          script: |
            const issue = context.payload.issue;
            const m = /<!--\s*codice:v1\s+(\{[\s\S]*?\})\s*-->/.exec(issue.body || '');
            if (!m) return;
            let p;
            try { p = JSON.parse(m[1]); } catch { return; }
            if (p.kind !== 'skill' && p.kind !== 'result' && p.kind !== 'class') return;
            if (!issue.title.startsWith(`[${p.kind}] `)) return;

            // Una clase solo vale si apunta al `codice-skills` de quien abrió el Issue (evita suplantaciones).
            if (p.kind === 'class') {
              const repo = String(p.data && p.data.repo || '').toLowerCase();
              if (repo !== `${issue.user.login}/codice-skills`.toLowerCase()) return;
            }

            const models = ['Opus 5.5','Opus 4.8','Gemini 3.8','Gemini 3.7','Sonnet 5.5','GPT Astra','GPT Luna','DeepSeek V3'];
            const verdicts = ['worked','partial','failed'];
            const ok = (l) =>
              typeof l === 'string' && l.length <= 50 && (
                l === p.kind ||
                (p.kind !== 'class' && l.startsWith('skill:')) ||
                (p.kind === 'class' && /^class:[a-z0-9-]{1,44}$/.test(l)) ||
                (p.kind === 'result' && l.startsWith('model:') && models.includes(l.slice(6))) ||
                (p.kind === 'result' && l.startsWith('verdict:') && verdicts.includes(l.slice(8)))
              );
            const labels = (Array.isArray(p.labels) ? p.labels : []).filter(ok);
            if (!labels.includes(p.kind)) return;
            await github.rest.issues.addLabels({ ...context.repo, issue_number: issue.number, labels });
```

> **Si ya tenías `codice-labeler.yml` (de antes de las clases compartidas), sustituye su contenido por el de arriba.** Es un cambio **manual** en el repo catálogo: la app no puede hacerlo por ti. Hasta que lo apliques, compartir una clase sí publica sus archivos y abre su Issue, pero el Issue no recibe la etiqueta `class` y la pestaña *Comunidad* sale vacía. Para comprobarlo: comparte una clase y verifica en el repo catálogo que su Issue `[class] <login>/<id>` tiene las etiquetas `class` y `class:<id>`.

Notas: solo reacciona a `opened` (no a ediciones) y nunca interpola el contenido del Issue en una shell. Si algún día el volumen de spam lo exige, puedes bloquear Issues (*lock*) o exigir cuentas con cierta antigüedad.

## 2. OAuth App (GitHub)

1. GitHub → *Settings → Developer settings → OAuth Apps → New OAuth App*.
2. **Homepage URL**: la URL pública del sitio, p. ej. `https://suarezcaceres.github.io/ai-skills-studio/`.
3. **Authorization callback URL**: la **misma URL del sitio** (la app vuelve a su propia página con `?code=...&state=...`). GitHub ahora admite varias *Redirect URIs* en la misma OAuth App: añade también `http://localhost:5173/` para desarrollo local (y `ALLOWED_ORIGINS` en Vercel debe incluir ambos orígenes).
4. Copia el **Client ID** (público) y genera un **Client secret** (privado: solo irá a Vercel).
5. Permisos: la app pide el alcance `public_repo`, necesario para crear Issues y reacciones en un repo público. Es un alcance amplio (escritura en los repos públicos de quien entra); está documentado para que los usuarios lo sepan. Pueden revocarlo en *GitHub → Settings → Applications*.

## 3. Proyecto de Vercel (función `api/github-oauth.ts`)

1. En Vercel: *Add New → Project* e importa este repositorio. Como el sitio se publica en GitHub Pages, Vercel solo se usa para la función: *Framework Preset* **Other**, sin *Build Command*.
2. En *Settings → Environment Variables* define (entorno Production, y Preview si lo quieres):

   | Variable | Valor |
   | :--- | :--- |
   | `GITHUB_CLIENT_ID` | Client ID de la OAuth App |
   | `GITHUB_CLIENT_SECRET` | Client secret de la OAuth App |
   | `ALLOWED_ORIGINS` | Orígenes del sitio separados por comas, sin barra final: `https://suarezcaceres.github.io,http://localhost:5173` |

3. Despliega. La función quedará en `https://TU-PROYECTO.vercel.app/api/github-oauth`.
4. Prueba rápida (debe responder `403 origin_not_allowed` sin cabecera `Origin`, lo que confirma que el CORS cierra el paso):
   `curl -i -X POST https://TU-PROYECTO.vercel.app/api/github-oauth`

La función solo acepta `POST`/`OPTIONS` desde los orígenes permitidos, valida `code`, `redirect_uri` (debe pertenecer a un origen permitido) y `code_verifier`, y responde únicamente `access_token`, `token_type` y `scope`.

## 4. Variables del frontend (públicas)

Son valores públicos (se incrustan en el bundle); **no** pongas aquí ningún secreto.

| Variable | Ejemplo |
| :--- | :--- |
| `VITE_CATALOG_REPO` | `TU_USUARIO/codice-skills-catalog` |
| `VITE_GITHUB_CLIENT_ID` | Client ID de la OAuth App |
| `VITE_GITHUB_OAUTH_URL` | `https://TU-PROYECTO.vercel.app/api/github-oauth` |

- **Local**: crea `.env.local` (ignorado por git) con las tres variables y ejecuta `npm run dev`.
- **GitHub Pages**: define las tres como *Repository variables* (*Settings → Secrets and variables → Actions → Variables*) y pásalas al paso `Build` de `.github/workflows/deploy.yml` con `env: VITE_CATALOG_REPO: ${{ vars.VITE_CATALOG_REPO }}` (y las otras dos). Ese paso ya está en `.github/workflows/deploy.yml`: solo falta definir las variables en el repo.

## 5. Política de seguridad de contenido (CSP)

El `index.html` usa `default-src 'self'`, así que sin `connect-src` el navegador bloquearía las peticiones a GitHub. `vite.config.ts` rellena esa directiva al compilar (con `api.github.com`, la API de Gemini y el origen de `VITE_GITHUB_OAUTH_URL`), así que no hay que editar nada a mano. El resultado equivale a:

```
connect-src 'self' https://api.github.com https://TU-PROYECTO.vercel.app;
```

(La ventana emergente de login navega a `github.com`, pero eso no pasa por `connect-src`.) Si cambias la URL de la función de Vercel, vuelve a compilar para que el CSP la incluya.

## 6. Verificación manual (checklist)

1. Con las variables definidas, abre la app y pulsa **Entrar con GitHub**: se abre la ventana de GitHub, autorizas y la ventana se cierra; la app queda como colaborador. Si el navegador bloquea la ventana, la pestaña se redirige y la sesión se completa al volver.
2. Pega la URL de un repo con un `SKILL.md` (por ejemplo `https://github.com/usuario/repo/tree/main/mi-skill`): debe crearse un Issue `[skill] ...` en el repo catálogo, con las etiquetas aplicadas por el workflow, y la skill debe aparecer en `listSkills`.
3. Reporta un resultado: debe aparecer un Issue `[result] ...` con las etiquetas `model:*` y `verdict:*`.
4. Vota con 👍: la reacción se ve en el Issue ancla.
5. Revisa que `git grep -i "client_secret\|ghp_\|gho_"` no encuentre credenciales y que el bundle de `dist/` no contenga el secreto.

## Comportamiento y límites que conviene conocer

- **Límite de peticiones**: sin sesión, GitHub permite 60 por hora por IP; las pruebas automáticas contra GitHub real comparten esa cuota con quien las lanza. Con sesión, las lecturas públicas también llevan el token y cuentan en el límite de 5000/h de la persona. Tras votar, la app relee sin la caché HTTP del navegador (GitHub responde con `max-age=60`). El servicio cachea en memoria y `localStorage` (TTL de 30 s a 24 h según el dato) y, si se agota el límite, reutiliza la caché caducada y muestra un mensaje con la hora de renovación. Iniciar sesión sube el límite a 5000/h.
- **Token solo en memoria**: no se guarda en `localStorage`, `sessionStorage` ni cookies. Recargar la página cierra la sesión.
- **Estado anti-CSRF y PKCE**: cada intento usa un `state` aleatorio de un solo uso (caduca a los 10 min) y un `code_verifier` PKCE.
- **Contenido no confiable**: el `SKILL.md` y los archivos de repos externos se leen como texto, con límite de tamaño, y nunca se ejecutan. El Markdown debe sanitizarse antes de renderizarlo.
- **Solo repos públicos**: los repos privados se rechazan al registrar. La skill se lee fijada a un commit (SHA) concreto.
- **Etiquetas asíncronas**: tras crear un Issue, el workflow tarda unos segundos en etiquetarlo; un resultado recién reportado puede tardar un poco en aparecer en `listResults`.
- **Cerrar sesión**: la app solo descarta el token local; no revoca la autorización en GitHub (el usuario puede hacerlo en *Settings → Applications*).
