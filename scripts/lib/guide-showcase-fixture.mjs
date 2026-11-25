/**
 * GitHub simulado para la captura de la sección «Guía vs. sin guía» (spec 005).
 *
 * Sirve un catálogo de 6 skills plausibles y variadas (cuatro categorías, tres personas que las suben) para que
 * el buscador, los chips y las tarjetas de la captura tengan sentido. Reutiliza de `github-fixture.mjs` las
 * constantes y `installFakeGithub` (avatares, autorización, canje del código y `window.open` anulado); solo
 * sustituye las respuestas de `api.github.com`, porque `installFakeGithub` no admite datos propios.
 *
 * Aislamiento de red: lo que no atiende el fixture NO sale a internet. Se registra en `report.unhandled` y el
 * script de captura falla con un mensaje claro. Solo se permite el origen local de Vite.
 *
 * Uso:
 *   const guard = await installGuideShowcaseGithub(context, { localOrigin });
 *   ...navegar y capturar...
 *   guard.assertNoRealNetwork();   // lanza si algo escapó del fixture
 */
import { installFakeGithub, TEST_CATALOG_REPO } from './github-fixture.mjs';

export { TEST_CATALOG_REPO as GUIDE_CATALOG_REPO };

/** Fecha de referencia de la captura (la misma que fija `capture-components.mjs`). */
export const GUIDE_FIXED_NOW = new Date('2026-11-15T12:00:00');

const sha = (seed) => seed.repeat(40).slice(0, 40);

/**
 * Skills del catálogo simulado. `uploader` es quien las registra en el repo catálogo (autor del Issue);
 * `repo` es el repo de origen. Del más reciente al más antiguo: la primera es la primera tarjeta de la captura.
 */
export const GUIDE_SKILLS = [
  {
    number: 6,
    repo: 'lucia-ferrer/skills-frontend',
    skillPath: 'accesibilidad-wcag',
    name: 'accesibilidad-wcag',
    description: 'Revisa componentes React contra WCAG 2.2 AA y propone correcciones de foco, contraste y etiquetas.',
    category: 'frontend',
    license: 'MIT',
    hasScripts: false,
    uploader: 'lucia-ferrer',
    commitSha: sha('a1b2c3d4e5'),
    createdAt: '2026-11-12T09:30:00Z',
    votes: 14,
  },
  {
    number: 5,
    repo: 'marco-ibanez/pruebas-e2e',
    skillPath: 'playwright-cuatro-anchos',
    name: 'playwright-cuatro-anchos',
    description: 'Genera pruebas E2E con Playwright en cuatro anchos y con la red simulada, sin tocar servicios reales.',
    category: 'pruebas',
    license: 'Apache-2.0',
    hasScripts: true,
    uploader: 'marco-ibanez',
    commitSha: sha('b2c3d4e5f6'),
    createdAt: '2026-11-09T16:10:00Z',
    votes: 9,
  },
  {
    number: 4,
    repo: 'SuarezCaceres/codice-skills',
    skillPath: 'skills/commits-semanticos',
    name: 'commits-semanticos',
    description: 'Redacta commits con Conventional Commits en español y pull requests con secciones claras y verificables.',
    category: 'documentación',
    license: 'MIT',
    hasScripts: false,
    uploader: 'SuarezCaceres',
    commitSha: sha('c3d4e5f6a7'),
    createdAt: '2026-11-05T11:45:00Z',
    votes: 21,
  },
  {
    number: 3,
    repo: 'marco-ibanez/pruebas-e2e',
    skillPath: 'auditor-de-secretos',
    name: 'auditor-de-secretos',
    description: 'Detecta claves, tokens y credenciales filtradas en un repositorio antes de publicar una skill.',
    category: 'seguridad',
    license: 'MIT',
    hasScripts: true,
    uploader: 'marco-ibanez',
    commitSha: sha('d4e5f6a7b8'),
    createdAt: '2026-10-29T08:20:00Z',
    votes: 17,
  },
  {
    number: 2,
    repo: 'lucia-ferrer/skills-frontend',
    skillPath: 'tokens-tailwind',
    name: 'tokens-tailwind',
    description: 'Convierte un sistema de diseño en tokens de Tailwind v4 coherentes, con modo oscuro y escala tipográfica.',
    category: 'frontend',
    license: 'MIT',
    hasScripts: false,
    uploader: 'lucia-ferrer',
    commitSha: sha('e5f6a7b8c9'),
    createdAt: '2026-10-22T14:05:00Z',
    votes: 6,
  },
  {
    number: 1,
    repo: 'SuarezCaceres/codice-skills',
    skillPath: 'skills/pruebas-unitarias-node',
    name: 'pruebas-unitarias-node',
    description: 'Escribe pruebas unitarias en Node con aserciones estrictas, estructura AAA y nombres que describen la regla.',
    category: 'pruebas',
    license: 'MIT',
    hasScripts: false,
    uploader: 'SuarezCaceres',
    commitSha: sha('f6a7b8c9d0'),
    createdAt: '2026-10-15T10:00:00Z',
    votes: 11,
  },
];

const AVATAR_HOST = 'https://avatars.githubusercontent.com';
/** Identificador numérico estable por persona: el avatar se sirve como `/u/<id>`. */
const UPLOADER_IDS = { SuarezCaceres: 1, 'lucia-ferrer': 2, 'marco-ibanez': 3 };
/** Tonos apagados de la paleta Cyber Dark para los avatares simulados (nada de imágenes de terceros). */
const AVATAR_TONES = { 1: '#0e4f6e', 2: '#334155', 3: '#3f3f5a' };

const avatarUrl = (login) => `${AVATAR_HOST}/u/${UPLOADER_IDS[login]}?v=4`;

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization,content-type,accept,x-github-api-version,*',
  'access-control-allow-methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
  'access-control-expose-headers': 'x-ratelimit-remaining,x-ratelimit-reset,retry-after',
};
const json = (body, status = 200) => ({ status, headers: CORS, contentType: 'application/json', body: JSON.stringify(body) });

function anchorIssue(skill) {
  const id = `${skill.repo}/${skill.skillPath}`;
  const marker = {
    kind: 'skill',
    labels: ['skill', `skill:${id}`],
    data: {
      repo: skill.repo,
      skillPath: skill.skillPath,
      name: skill.name,
      description: skill.description,
      authorLogin: skill.repo.split('/')[0],
      license: skill.license,
      category: skill.category,
      hasScripts: skill.hasScripts,
      commitSha: skill.commitSha,
    },
  };
  return {
    number: skill.number,
    html_url: `https://github.com/${TEST_CATALOG_REPO}/issues/${skill.number}`,
    body: `<!-- codice:v1 ${JSON.stringify(marker)} -->\nSkill registrada`,
    created_at: skill.createdAt,
    user: { login: skill.uploader, avatar_url: avatarUrl(skill.uploader) },
    labels: ['skill', `skill:${id}`],
    reactions: { '+1': skill.votes },
  };
}

const ISSUES = GUIDE_SKILLS.map(anchorIssue);

/** Avatar simulado: círculo apagado con la inicial. Se sirve como SVG para no depender de la red. */
function avatarSvg(id) {
  const tone = AVATAR_TONES[id] ?? '#334155';
  const login = Object.keys(UPLOADER_IDS).find((l) => UPLOADER_IDS[l] === id) ?? '?';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">` +
    `<rect width="64" height="64" fill="${tone}"/>` +
    `<text x="32" y="43" font-family="sans-serif" font-size="30" font-weight="700" text-anchor="middle" fill="#e2e8f0">${login[0].toUpperCase()}</text>` +
    `</svg>`
  );
}

/** Respuestas de `api.github.com` para el listado del catálogo. Devuelve `null` si la ruta no se contempla. */
function catalogApi(url) {
  const p = url.pathname;
  const labels = url.searchParams.get('labels') ?? '';
  if (p === `/repos/${TEST_CATALOG_REPO}/issues`) return json(labels.split(',').includes('skill') ? ISSUES : []);
  const one = new RegExp(`^/repos/${TEST_CATALOG_REPO}/issues/(\\d+)$`).exec(p);
  if (one) {
    const issue = ISSUES.find((i) => i.number === Number(one[1]));
    return issue ? json(issue) : json({ message: 'Not Found' }, 404);
  }
  if (new RegExp(`^/repos/${TEST_CATALOG_REPO}/issues/\\d+/reactions$`).test(p)) return json([]);
  return null;
}

/**
 * Instala el GitHub simulado en un contexto de Playwright y vigila la red.
 * @param {import('playwright').BrowserContext} context
 * @param {{ localOrigin: string }} options Origen local (Vite) que sí puede recibir peticiones.
 */
export async function installGuideShowcaseGithub(context, { localOrigin }) {
  const report = { served: 0, unhandled: [] };
  const fail = (request, why) => report.unhandled.push(`${request.method()} ${request.url()} (${why})`);

  // 1) Red de seguridad (la de menor prioridad: Playwright consulta primero las rutas registradas después).
  await context.route(
    (url) => /^https?:$/.test(url.protocol) && url.origin !== localOrigin,
    (route) => {
      fail(route.request(), 'dominio externo sin fixture');
      return route.abort('blockedbyclient');
    }
  );
  // 2) Avatares, autorización, canje del código y `window.open` anulado (los de `github-fixture.mjs`).
  await installFakeGithub(context);
  // 3) Nuestros datos: sustituyen a los de `installFakeGithub` para `api.github.com` y los avatares.
  await context.route('https://api.github.com/**', (route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    const reply = request.method() === 'GET' ? catalogApi(new URL(request.url())) : null;
    if (!reply) {
      fail(request, 'api.github.com sin respuesta en el fixture');
      return route.fulfill(json({ message: 'Not Found' }, 404));
    }
    report.served++;
    return route.fulfill(reply);
  });
  await context.route(`${AVATAR_HOST}/**`, (route) => {
    const id = Number(/\/u\/(\d+)/.exec(new URL(route.request().url()).pathname)?.[1]);
    report.served++;
    return route.fulfill({ status: 200, contentType: 'image/svg+xml', body: avatarSvg(id) });
  });
  // 4) Tipografías de Google: la CSP de la app las permite, pero la captura no debe depender de internet.
  //    Se responde CSS vacío y la página usa sus fuentes de reserva, iguales en cualquier máquina.
  await context.route('https://fonts.googleapis.com/**', (route) => {
    report.served++;
    return route.fulfill({ status: 200, contentType: 'text/css', body: '/* sin tipografías remotas */' });
  });
  await context.route('https://fonts.gstatic.com/**', (route) => {
    report.served++;
    return route.fulfill({ status: 204 });
  });

  return {
    report,
    /** Lanza si alguna petición escapó del fixture: se cumple «cero peticiones reales». */
    assertNoRealNetwork() {
      if (report.unhandled.length > 0) {
        throw new Error(
          'Peticiones que el fixture no atiende (la captura no puede tocar la red real):\n  - ' +
            [...new Set(report.unhandled)].join('\n  - ')
        );
      }
    },
  };
}
