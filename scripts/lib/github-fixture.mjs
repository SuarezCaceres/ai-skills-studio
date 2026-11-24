/**
 * GitHub simulado para las pruebas de interfaz que necesitan un catálogo con una skill del equipo
 * y una sesión iniciada. Nada de esto toca `api.github.com` real (cuota anónima: 60 peticiones/h por IP).
 *
 * Clases compartidas (C5): `installFakeGithub(context, { classes: true })` añade la máquina de estado de
 *   `fake-github-classes.mjs` (repos, API de Git, contenidos e Issues de clases) y devuelve la máquina para
 *   sembrar estado, inyectar errores y contar peticiones. Sin esa opción nada cambia.
 *
 * Uso:
 *   process.env.VITE_CATALOG_REPO = TEST_CATALOG_REPO; process.env.VITE_GITHUB_CLIENT_ID = ...; (antes de compilar)
 *   await installFakeGithub(context);   // API, avatares, autorización y canje del código
 */

import { createFakeGithubClasses } from './fake-github-classes.mjs';

export const TEST_CATALOG_REPO = 'test/catalog';
export const TEST_CLIENT_ID = 'test-client-id';
export const TEST_OAUTH_URL = 'https://oauth.example.test/api/github-oauth';
export const TEAM_LOGIN = 'SuarezCaceres';
export const SKILL_ID = 'acme/tools/demo';
export const SKILL_NAME = 'demo-skill';

const SHA = 'a'.repeat(40);
const SKILL_MD = ['---', `name: ${SKILL_NAME}`, 'description: Demo skill used by the UI tests.', '---', '', '# Demo skill', '', 'Texto de prueba.'].join('\n');
const AVATAR = 'https://avatars.githubusercontent.com/u/1?v=4';

const marker = {
  kind: 'skill',
  labels: ['skill', `skill:${SKILL_ID}`],
  data: {
    repo: 'acme/tools',
    skillPath: 'demo',
    name: SKILL_NAME,
    description: 'Demo skill used by the UI tests.',
    authorLogin: 'acme',
    license: 'MIT',
    category: 'demo',
    hasScripts: false,
    commitSha: SHA,
  },
};

const anchorIssue = {
  number: 1,
  html_url: `https://github.com/${TEST_CATALOG_REPO}/issues/1`,
  body: `<!-- codice:v1 ${JSON.stringify(marker)} -->\nSkill registrada`,
  created_at: '2026-11-01T10:00:00Z',
  user: { login: TEAM_LOGIN, avatar_url: AVATAR },
  labels: ['skill', `skill:${SKILL_ID}`],
  reactions: { '+1': 0 },
};

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization,content-type,accept,x-github-api-version,*',
  'access-control-allow-methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
  // La app lee estas cabeceras para avisar del límite de peticiones.
  'access-control-expose-headers': 'x-ratelimit-remaining,x-ratelimit-reset,retry-after',
};

const json = (body, status = 200) => ({ status, headers: CORS, contentType: 'application/json', body: JSON.stringify(body) });

// PNG de 1×1 para que los avatares no dependan de la red.
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

/** ¿Esta petición es de clases compartidas (y no del catálogo de skills de siempre)? */
function isClassRequest(machine, request) {
  const url = new URL(request.url());
  const p = url.pathname;
  if (p === '/user/repos') return true;
  if (/^\/repos\/[^/]+\/codice-skills(\/|$)/i.test(p)) return true;
  const issues = `/repos/${TEST_CATALOG_REPO}/issues`;
  if (p === issues) {
    if (request.method() !== 'GET') return true;
    return (url.searchParams.get('labels') ?? '').split(',').includes('class') || url.searchParams.has('creator');
  }
  // El Issue #1 sigue siendo el ancla de la skill de prueba; los de clases salen de la máquina.
  const number = p.startsWith(`${issues}/`) ? Number(p.slice(issues.length + 1)) : NaN;
  return Number.isInteger(number) && machine.hasIssue(number);
}

async function viaMachine(route, machine) {
  const request = route.request();
  let body;
  const data = request.postData();
  if (data) {
    try {
      body = JSON.parse(data);
    } catch {
      body = data;
    }
  }
  let out;
  try {
    out = machine.handle({ method: request.method(), url: request.url(), headers: request.headers(), body });
  } catch {
    return route.abort('failed'); // red caída inyectada
  }
  const headers = { ...CORS, ...out.headers };
  if (out.text !== undefined) return route.fulfill({ status: out.status, headers, contentType: 'text/plain', body: out.text });
  if (out.json !== undefined) return route.fulfill({ status: out.status, headers, contentType: 'application/json', body: JSON.stringify(out.json) });
  return route.fulfill({ status: out.status, headers });
}

async function githubApi(route, machine) {
  if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
  if (machine && isClassRequest(machine, route.request())) return viaMachine(route, machine);
  const url = new URL(route.request().url());
  const p = url.pathname;
  const labels = url.searchParams.get('labels') ?? '';
  if (p === `/repos/${TEST_CATALOG_REPO}/issues`) return route.fulfill(json(labels.includes('result') ? [] : [anchorIssue]));
  if (p === `/repos/${TEST_CATALOG_REPO}/issues/1`) return route.fulfill(json(anchorIssue));
  if (p === `/repos/${TEST_CATALOG_REPO}/issues/1/reactions`) return route.fulfill(json([]));
  if (p === '/user') return route.fulfill(json({ login: TEAM_LOGIN, avatar_url: AVATAR }));
  if (p === `/users/${TEAM_LOGIN}`) return route.fulfill(json({ login: TEAM_LOGIN, name: 'Sergio Mateo', avatar_url: AVATAR }));
  if (p.startsWith('/users/')) return route.fulfill(json({ login: p.split('/')[2], name: null }));
  if (p === '/repos/acme/tools') {
    return route.fulfill(json({ private: false, default_branch: 'main', topics: ['demo'], license: { spdx_id: 'MIT' }, owner: { login: 'acme' } }));
  }
  if (p === `/repos/acme/tools/git/trees/${SHA}`) {
    return route.fulfill(json({ tree: [{ path: 'demo/SKILL.md', type: 'blob', mode: '100644', size: SKILL_MD.length }] }));
  }
  if (p === '/repos/acme/tools/contents/demo/SKILL.md') {
    return route.fulfill({ status: 200, headers: CORS, contentType: 'text/plain', body: SKILL_MD });
  }
  return route.fulfill(json({ message: 'Not Found' }, 404));
}

/**
 * Intercepta la API de GitHub, los avatares y el flujo de inicio de sesión. El navegador abre la
 * autorización de GitHub en la misma pestaña (la ventana emergente se anula) y se le responde con una
 * redirección a la app con `?code&state`; el canje del código lo contesta un token de prueba.
 */
export async function installFakeGithub(context, options = {}) {
  const machine = options.classes
    ? createFakeGithubClasses({ catalogRepo: TEST_CATALOG_REPO, firstIssueNumber: 100, ...(options.classes === true ? {} : options.classes) })
    : null;
  await context.route('https://api.github.com/**', (route) => githubApi(route, machine));
  await context.route('https://avatars.githubusercontent.com/**', (route) => route.fulfill({ status: 200, contentType: 'image/png', body: PNG }));
  await context.route('https://github.com/login/oauth/authorize**', (route) => {
    const params = new URL(route.request().url()).searchParams;
    const redirect = new URL(params.get('redirect_uri'));
    redirect.searchParams.set('code', 'test-code');
    redirect.searchParams.set('state', params.get('state'));
    return route.fulfill({ status: 302, headers: { location: redirect.toString() } });
  });
  await context.route('https://oauth.example.test/**', (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    return route.fulfill(json({ access_token: 'ghu_test_token_0123456789', expires_in: 28800 }));
  });
  // Sin ventana emergente: la app cae al modo «redirección», que es el que se simula aquí.
  await context.addInitScript(() => {
    window.open = () => null;
  });
  return machine;
}

/** Atajo: GitHub simulado con clases compartidas. Devuelve la máquina de estado para sembrar y comprobar. */
export async function installFakeGithubClasses(context, machineOptions = {}) {
  return installFakeGithub(context, { classes: machineOptions });
}

export { createFakeGithubClasses } from './fake-github-classes.mjs';
