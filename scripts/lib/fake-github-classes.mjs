/**
 * GitHub simulado como **máquina de estado pura** para las pruebas de clases compartidas.
 *
 * No toca la red: `handle({ method, url, headers, body })` recibe una petición a `api.github.com` y
 * devuelve `{ status, headers, json | text }`. Se usa de dos formas:
 *  - en pruebas de Node, a través de `createFakeFetch(machine)` (un `fetch` global simulado);
 *  - en pruebas de navegador, conectada a Playwright desde `scripts/lib/github-fixture.mjs`.
 *
 * Soporta lo que usa `githubCatalogService` para compartir clases: repos, API de Git (blobs, árboles,
 * commits y refs), contenidos en crudo, y los Issues del repo catálogo (crear, listar con `labels`,
 * `state` y `creator`, y PATCH). Se pueden inyectar errores (401, 403 con límite de peticiones, 404,
 * 5xx o red caída) y se cuentan las peticiones.
 */
import { createHash } from 'node:crypto';

const sha1 = (text) => createHash('sha1').update(text).digest('hex');
const AVATAR = 'https://avatars.githubusercontent.com/u/1?v=4';
const MARKER = /<!--\s*codice:v1\s+(\{[\s\S]*?\})\s*-->/;

export const FAKE_CATALOG_REPO = 'test/catalog';
export const FAKE_DEFAULT_TOKEN = 'ghu_test_token_0123456789';
export const FAKE_DEFAULT_LOGIN = 'SuarezCaceres';

const reply = (status, json, headers = {}) => ({ status, headers, json });
const notFound = () => reply(404, { message: 'Not Found' });

/**
 * @param {object} [options]
 * @param {string} [options.catalogRepo]  repo catálogo (por defecto `test/catalog`)
 * @param {Record<string,string>} [options.tokens]  token → login (se suma al de prueba por defecto)
 * @param {boolean} [options.labeler=true]  simula el workflow `codice-labeler`: aplica las etiquetas del marcador
 * @param {string[]} [options.labelerKinds]  tipos de marcador que reconoce el workflow (antes de C4: skill y result)
 * @param {number} [options.firstIssueNumber=1]  número del primer Issue (el fixture de navegador usa 100)
 */
export function createFakeGithubClasses(options = {}) {
  const catalogRepo = options.catalogRepo ?? FAKE_CATALOG_REPO;
  const tokens = new Map(Object.entries({ [FAKE_DEFAULT_TOKEN]: FAKE_DEFAULT_LOGIN, ...(options.tokens ?? {}) }));
  let labeler = options.labeler ?? true;
  let labelerKinds = options.labelerKinds ?? ['skill', 'result', 'class'];
  let nextIssue = options.firstIssueNumber ?? 1;
  let tick = 0;
  const now = () => new Date(Date.UTC(2026, 10, 15, 10, 0, 0) + tick++ * 60_000).toISOString();

  /** `owner/name` en minúsculas → repo. */
  const repos = new Map();
  const blobs = new Map(); // sha → texto
  const trees = new Map(); // sha → Map(ruta → sha de blob)
  const commits = new Map(); // sha → { tree, parents, message }
  const issues = [];
  const calls = [];
  const rules = [];

  const keyOf = (owner, name) => `${owner}/${name}`.toLowerCase();

  /* ---------------- Objetos de Git ---------------- */

  function putBlob(text) {
    const sha = sha1(`blob\0${text}`);
    blobs.set(sha, text);
    return sha;
  }
  function putTree(entries) {
    const sorted = [...entries.entries()].sort(([a], [b]) => (a < b ? -1 : 1));
    const sha = sha1(`tree\0${JSON.stringify(sorted)}`);
    trees.set(sha, new Map(sorted));
    return sha;
  }
  function putCommit(tree, parents, message) {
    const sha = sha1(`commit\0${tree}\0${parents.join(',')}\0${message}\0${tick++}`);
    commits.set(sha, { tree, parents, message });
    return sha;
  }

  /** Crea un repo con un commit inicial. Sirve para sembrar estado y para `POST /user/repos`. */
  function seedRepo(owner, name, files = { 'README.md': `# ${name}\n` }, extra = {}) {
    const entries = new Map(Object.entries(files).map(([path, text]) => [path, putBlob(text)]));
    const commit = putCommit(putTree(entries), [], 'Initial commit');
    const repo = { owner, name, private: Boolean(extra.private), default_branch: 'main', refs: { main: commit } };
    repos.set(keyOf(owner, name), repo);
    return commit;
  }

  const getRepo = (owner, name) => repos.get(keyOf(owner, name));
  const headOf = (repo) => repo.refs[repo.default_branch];
  const treeAt = (sha) => trees.get(commits.get(sha)?.tree);

  /* ---------------- Issues ---------------- */

  const avatarFor = (login) => (login ? AVATAR : undefined);
  const issueJson = (i) => ({
    number: i.number,
    html_url: `https://github.com/${catalogRepo}/issues/${i.number}`,
    title: i.title,
    body: i.body,
    state: i.state,
    created_at: i.created_at,
    updated_at: i.updated_at,
    user: { login: i.login, avatar_url: avatarFor(i.login) },
    labels: i.labels.map((name) => ({ name })),
    ...(i.pull_request ? { pull_request: {} } : {}),
  });

  /** Etiquetas que aplicaría el workflow: las del marcador, solo de tipos conocidos y de ≤ 50 caracteres. */
  function labelsFromMarker(body) {
    if (!labeler) return [];
    const m = MARKER.exec(body ?? '');
    if (!m) return [];
    try {
      const marker = JSON.parse(m[1]);
      if (!labelerKinds.includes(marker.kind) || !Array.isArray(marker.labels)) return [];
      return marker.labels.filter((l) => typeof l === 'string' && l.length <= 50);
    } catch {
      return [];
    }
  }

  /** Siembra un Issue tal cual (para clases de otras personas, Issues sin marcador, etc.). */
  function seedIssue({ login, title = '[class] x', body = '', labels = [], state = 'open', createdAt, updatedAt, pull_request = false, number }) {
    const created = createdAt ?? now();
    const issue = {
      number: number ?? nextIssue++,
      login,
      title,
      body,
      labels,
      state,
      created_at: created,
      updated_at: updatedAt ?? created,
      pull_request,
    };
    if (number !== undefined && number >= nextIssue) nextIssue = number + 1;
    issues.push(issue);
    return issue.number;
  }

  /* ---------------- Errores inyectables ---------------- */

  /**
   * Hace fallar las próximas peticiones que coincidan (`"METODO /ruta?query"` contra `match`).
   * `kind`: `unauthorized` (401), `rate-limit` (403 con cabeceras de límite), `forbidden` (403),
   * `not-found` (404), `server` (500) o `network` (lanza como un `fetch` sin conexión).
   */
  function failNext({ match, kind = 'server', times = 1, status }) {
    rules.push({ match, kind, remaining: times, status });
  }

  function applyRule(label) {
    for (const rule of rules) {
      if (rule.remaining <= 0) continue;
      const hit = rule.match instanceof RegExp ? rule.match.test(label) : label.includes(rule.match);
      if (!hit) continue;
      rule.remaining--;
      switch (rule.kind) {
        case 'network':
          throw new TypeError('Failed to fetch');
        case 'unauthorized':
          return reply(401, { message: 'Bad credentials' });
        case 'rate-limit':
          return reply(rule.status ?? 403, { message: 'API rate limit exceeded' }, {
            'x-ratelimit-remaining': '0',
            'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 600),
          });
        case 'forbidden':
          return reply(403, { message: 'Resource not accessible by integration' });
        case 'not-found':
          return reply(404, { message: 'Not Found' });
        default:
          return reply(rule.status ?? 500, { message: 'Server Error' });
      }
    }
    return null;
  }

  /* ---------------- Manejador de peticiones ---------------- */

  function handle({ method = 'GET', url, headers = {}, body }) {
    const u = new URL(url);
    const verb = method.toUpperCase();
    calls.push({ method: verb, path: u.pathname, query: u.search });
    const injected = applyRule(`${verb} ${u.pathname}${u.search}`);
    if (injected) return injected;
    if (verb === 'OPTIONS') return reply(204, undefined);

    const lower = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), String(v)]));
    const auth = /^Bearer (.+)$/i.exec(lower.authorization ?? '');
    let caller = null;
    if (auth) {
      caller = tokens.get(auth[1]) ?? null;
      if (!caller) return reply(401, { message: 'Bad credentials' });
    }
    const needAuth = () => (caller ? null : reply(401, { message: 'Requires authentication' }));
    const segs = u.pathname.split('/').filter(Boolean).map(decodeURIComponent);
    const raw = /raw/i.test(lower.accept ?? '');

    // POST /user/repos
    if (verb === 'POST' && u.pathname === '/user/repos') {
      const denied = needAuth();
      if (denied) return denied;
      const name = body?.name;
      if (typeof name !== 'string' || !name) return reply(422, { message: 'Repository creation failed.' });
      if (getRepo(caller, name)) return reply(422, { message: 'name already exists on this account' });
      seedRepo(caller, name, { 'README.md': `# ${name}\n` });
      const repo = getRepo(caller, name);
      return reply(201, { private: repo.private, default_branch: repo.default_branch, owner: { login: caller } });
    }

    if (segs[0] !== 'repos' || segs.length < 3) return notFound();
    const [, owner, name, ...rest] = segs;

    // Issues del repo catálogo
    if (keyOf(owner, name) === catalogRepo.toLowerCase() && rest[0] === 'issues') return handleIssues(verb, u, rest, body, caller, needAuth);

    const repo = getRepo(owner, name);
    if (!repo) return notFound();
    const ownsRepo = caller && caller.toLowerCase() === owner.toLowerCase();

    if (rest.length === 0 && verb === 'GET') {
      return reply(200, { private: repo.private, default_branch: repo.default_branch, owner: { login: repo.owner } });
    }

    // GET /git/ref/heads/<rama>
    if (verb === 'GET' && rest[0] === 'git' && rest[1] === 'ref' && rest[2] === 'heads') {
      const sha = repo.refs[rest.slice(3).join('/')];
      return sha ? reply(200, { object: { sha } }) : notFound();
    }
    // GET /git/commits/<sha>
    if (verb === 'GET' && rest[0] === 'git' && rest[1] === 'commits' && rest[2]) {
      const c = commits.get(rest[2]);
      return c ? reply(200, { sha: rest[2], tree: { sha: c.tree } }) : notFound();
    }
    // GET /git/trees/<sha>?recursive=1
    if (verb === 'GET' && rest[0] === 'git' && rest[1] === 'trees' && rest[2]) {
      const t = trees.get(rest[2]);
      if (!t) return notFound();
      return reply(200, {
        tree: [...t.entries()].map(([path, sha]) => ({ path, type: 'blob', mode: '100644', sha, size: blobs.get(sha)?.length ?? 0 })),
        truncated: false,
      });
    }
    // GET /contents/<ruta>?ref=
    if (verb === 'GET' && rest[0] === 'contents') {
      const path = rest.slice(1).join('/');
      const ref = u.searchParams.get('ref') ?? repo.default_branch;
      const commitSha = repo.refs[ref] ?? (commits.has(ref) ? ref : null);
      const blob = commitSha ? treeAt(commitSha)?.get(path) : undefined;
      if (!blob) return notFound();
      return raw
        ? { status: 200, headers: {}, text: blobs.get(blob) }
        : reply(200, { path, sha: blob, encoding: 'base64', content: Buffer.from(blobs.get(blob), 'utf8').toString('base64') });
    }

    // Escrituras en el repo: solo su dueño
    if (verb !== 'GET') {
      const denied = needAuth();
      if (denied) return denied;
      if (!ownsRepo) return reply(403, { message: 'Resource not accessible by integration' });
    }

    if (verb === 'POST' && rest[0] === 'git' && rest[1] === 'blobs') {
      const text = body?.encoding === 'base64' ? Buffer.from(String(body.content ?? ''), 'base64').toString('utf8') : String(body?.content ?? '');
      return reply(201, { sha: putBlob(text) });
    }
    if (verb === 'POST' && rest[0] === 'git' && rest[1] === 'trees') {
      const base = trees.get(body?.base_tree);
      if (body?.base_tree && !base) return reply(422, { message: 'base_tree not found' });
      const entries = new Map(base ?? []);
      for (const item of body?.tree ?? []) {
        if (item.sha === null) {
          if (!entries.has(item.path)) return reply(422, { message: `GitRPC::BadObjectState: ${item.path} does not exist` });
          entries.delete(item.path);
        } else {
          if (!blobs.has(item.sha)) return reply(422, { message: 'Tree.sha: blob not found' });
          entries.set(item.path, item.sha);
        }
      }
      return reply(201, { sha: putTree(entries) });
    }
    if (verb === 'POST' && rest[0] === 'git' && rest[1] === 'commits') {
      if (!trees.has(body?.tree)) return reply(422, { message: 'Tree SHA does not exist' });
      const parents = body?.parents ?? [];
      if (parents.some((p) => !commits.has(p))) return reply(422, { message: 'Parent commit does not exist' });
      return reply(201, { sha: putCommit(body.tree, parents, String(body?.message ?? '')) });
    }
    if (verb === 'PATCH' && rest[0] === 'git' && rest[1] === 'refs' && rest[2] === 'heads') {
      const branch = rest.slice(3).join('/');
      const current = repo.refs[branch];
      const next = commits.get(body?.sha);
      if (!current) return notFound();
      if (!next) return reply(422, { message: 'Object does not exist' });
      if (!body?.force && !next.parents.includes(current)) return reply(422, { message: 'Update is not a fast forward' });
      repo.refs[branch] = body.sha;
      return reply(200, { ref: `refs/heads/${branch}`, object: { sha: body.sha } });
    }
    return notFound();
  }

  function handleIssues(verb, u, rest, body, caller, needAuth) {
    // GET /issues
    if (verb === 'GET' && rest.length === 1) {
      const wanted = (u.searchParams.get('labels') ?? '').split(',').filter(Boolean);
      const state = u.searchParams.get('state') ?? 'open';
      const creator = u.searchParams.get('creator')?.toLowerCase();
      const perPage = Math.min(Number(u.searchParams.get('per_page')) || 30, 100);
      const page = Math.max(Number(u.searchParams.get('page')) || 1, 1);
      const asc = u.searchParams.get('direction') === 'asc';
      const list = issues
        .filter((i) => state === 'all' || i.state === state)
        .filter((i) => !creator || i.login.toLowerCase() === creator)
        .filter((i) => wanted.every((l) => i.labels.includes(l)))
        .sort((a, b) => (Date.parse(a.created_at) - Date.parse(b.created_at) || a.number - b.number) * (asc ? 1 : -1));
      return reply(200, list.slice((page - 1) * perPage, page * perPage).map(issueJson));
    }
    // POST /issues
    if (verb === 'POST' && rest.length === 1) {
      const denied = needAuth();
      if (denied) return denied;
      const created = now();
      const number = nextIssue++;
      // Un usuario sin permiso de triage no puede poner etiquetas: solo las aplica el workflow.
      const issue = {
        number,
        login: caller,
        title: String(body?.title ?? ''),
        body: String(body?.body ?? ''),
        labels: labelsFromMarker(body?.body),
        state: 'open',
        created_at: created,
        updated_at: created,
        pull_request: false,
      };
      issues.push(issue);
      return reply(201, issueJson(issue));
    }
    const number = Number(rest[1]);
    const issue = issues.find((i) => i.number === number);
    if (rest.length === 2 && verb === 'GET') return issue ? reply(200, issueJson(issue)) : notFound();
    if (rest.length === 2 && verb === 'PATCH') {
      const denied = needAuth();
      if (denied) return denied;
      if (!issue) return notFound();
      if (issue.login.toLowerCase() !== caller.toLowerCase()) return reply(403, { message: 'Must have push access to modify this issue' });
      if (typeof body?.title === 'string') issue.title = body.title;
      if (typeof body?.body === 'string') issue.body = body.body;
      if (body?.state === 'open' || body?.state === 'closed') issue.state = body.state;
      issue.updated_at = now();
      return reply(200, issueJson(issue));
    }
    return notFound();
  }

  /* ---------------- Utilidades para las pruebas ---------------- */

  const countCalls = (pattern) =>
    calls.filter((c) => {
      const label = `${c.method} ${c.path}${c.query}`;
      return pattern instanceof RegExp ? pattern.test(label) : label.includes(pattern);
    }).length;

  return {
    handle,
    seedRepo,
    seedIssue,
    failNext,
    calls,
    countCalls,
    clearRules: () => (rules.length = 0),
    resetCalls: () => (calls.length = 0),
    setLabeler: (on) => (labeler = on),
    setLabelerKinds: (kinds) => (labelerKinds = kinds),
    /** Todos los Issues (incluidos los cerrados) tal como los devuelve la API. */
    get issues() {
      return issues.map(issueJson);
    },
    hasIssue: (number) => issues.some((i) => i.number === number),
    /** Archivos de la rama por defecto de un repo: `{ ruta: texto }`, o `null` si el repo no existe. */
    repoFiles(ownerRepo) {
      const [o, n] = ownerRepo.split('/');
      const repo = getRepo(o, n);
      if (!repo) return null;
      const t = treeAt(headOf(repo));
      return Object.fromEntries([...(t ?? new Map()).entries()].map(([p, sha]) => [p, blobs.get(sha)]));
    },
    head(ownerRepo) {
      const [o, n] = ownerRepo.split('/');
      const repo = getRepo(o, n);
      return repo ? headOf(repo) : null;
    },
    /** Cuántos commits hay en la historia de la rama por defecto. */
    commitCount(ownerRepo) {
      const [o, n] = ownerRepo.split('/');
      const repo = getRepo(o, n);
      if (!repo) return 0;
      let count = 0;
      for (let sha = headOf(repo); sha; sha = commits.get(sha)?.parents[0]) count++;
      return count;
    },
    deleteRepo(ownerRepo) {
      const [o, n] = ownerRepo.split('/');
      repos.delete(keyOf(o, n));
    },
    deleteIssue(number) {
      const i = issues.findIndex((x) => x.number === number);
      if (i >= 0) issues.splice(i, 1);
    },
  };
}

/**
 * `fetch` simulado para pruebas en Node: traduce cada petición a `machine.handle` y devuelve una
 * `Response`. Una excepción de la máquina (red caída) se convierte en un `fetch` que rechaza.
 */
export function createFakeFetch(machine) {
  return async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const headers = {};
    new Headers(init.headers ?? {}).forEach((v, k) => (headers[k] = v));
    let body;
    if (typeof init.body === 'string' && init.body) {
      try {
        body = JSON.parse(init.body);
      } catch {
        body = init.body;
      }
    }
    const out = machine.handle({ method: init.method ?? 'GET', url, headers, body });
    const status = out.status;
    if (status === 204 || (out.json === undefined && out.text === undefined)) return new Response(null, { status, headers: out.headers });
    if (out.text !== undefined) return new Response(out.text, { status, headers: { 'content-type': 'text/plain', ...out.headers } });
    return new Response(JSON.stringify(out.json), { status, headers: { 'content-type': 'application/json', ...out.headers } });
  };
}
