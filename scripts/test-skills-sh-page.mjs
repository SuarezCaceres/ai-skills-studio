/**
 * Prueba E2E de la sección «Explorar» (skills.sh) e inspección en vista previa
 * fijada a `commitSha` en navegador real + 4 anchos obligatorios (C3, C4).
 *
 * Compila la app en un directorio temporal con proxy simulado derivado de
 * `VITE_GITHUB_OAUTH_URL`, intercepta TODA red externa (proxy, GitHub API,
 * OAuth, avatares) y falla inmediatamente si el cliente intenta contactar
 * directamente `https://www.skills.sh`.
 *
 * Uso: node scripts/test-skills-sh-page.mjs
 */
import { build, preview } from 'vite';
import { chromium } from 'playwright';
import { mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PORT = 5193;
const OUT_DIR = join(tmpdir(), 'ai-skills-studio-skills-sh-e2e');
const SHOTS_DIR = resolve(ROOT, 'shots', 'skills-sh');

const SHA = 'b'.repeat(40);
const SYNCED_AT = '2026-11-24T12:00:00.000Z';
const AVATAR = 'https://avatars.githubusercontent.com/u/1?v=4';
const TEAM_LOGIN = 'SuarezCaceres';

const REACT_SKILL_MD = [
  '---',
  'name: vercel-react-best-practices',
  'description: Best practices for React and Next.js applications.',
  '---',
  '',
  '# Vercel React Best Practices',
  '',
  'Prefer server components and avoid unnecessary client waterfalls.',
].join('\n');

const GUIDE_MD = [
  '# React Reference Guide',
  '',
  'Keep client bundles small and memoize wisely.',
].join('\n');

const ALL_TIME_SKILLS = [
  {
    source: 'vercel-labs/agent-skills',
    skillId: 'vercel-react-best-practices',
    name: 'vercel-react-best-practices',
    installs: 928903,
    weeklyInstalls: [21000, 22000, 25000],
    isOfficial: true,
  },
  {
    source: 'uizze.sh',
    skillId: 'ui-taste',
    name: 'ui-taste',
    installs: 615000,
    change: 320,
  },
  {
    source: 'mattpocock/skills',
    skillId: 'tdd',
    name: 'tdd',
    installs: 450000,
  },
];

const TRENDING_SKILLS = [
  {
    source: 'vercel-labs/skills',
    skillId: 'find-skills',
    name: 'find-skills',
    installs: 21500,
    change: 840,
    isOfficial: true,
  },
  {
    source: 'uizze.sh',
    skillId: 'ui-taste',
    name: 'ui-taste',
    installs: 19525,
    change: 598,
  },
  {
    source: 'vercel-labs/agent-skills',
    skillId: 'vercel-react-best-practices',
    name: 'vercel-react-best-practices',
    installs: 14200,
    change: 210,
    isOfficial: true,
  },
];

const HOT_SKILLS = [
  {
    source: 'vercel-labs/agent-skills',
    skillId: 'vercel-react-best-practices',
    name: 'vercel-react-best-practices',
    installs: 320,
    installsYesterday: 180,
    change: 140,
    isOfficial: true,
  },
];

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization,content-type,accept,x-github-api-version,*',
  'access-control-allow-methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
  'access-control-expose-headers': 'x-ratelimit-remaining,x-ratelimit-reset,retry-after',
};

const json = (body, status = 200) => ({
  status,
  headers: CORS,
  contentType: 'application/json',
  body: JSON.stringify(body),
});

let passed = 0;
const failures = [];

function check(name, ok, detail = '') {
  if (ok) passed++;
  console.log(`  ${ok ? 'ok ' : 'FALLA'}  ${name}${ok || !detail ? '' : ` — ${detail}`}`);
  if (!ok) failures.push(detail ? `${name} (${detail})` : name);
}

async function openExplorar(page, origin) {
  await page.goto(`${origin}/`, { waitUntil: 'domcontentloaded' });
  await page.locator('.nav__actions a.btn--primary').waitFor({ timeout: 8000 });
  await page.evaluate(() => document.querySelector('.nav__actions a.btn--primary')?.click());
  await page.locator('nav[aria-label="Módulos del estudio"]').waitFor({ state: 'attached', timeout: 8000 });
  await page.evaluate(() =>
    [...document.querySelectorAll('nav[aria-label="Módulos del estudio"] a')]
      .find((a) => a.textContent?.trim() === 'Explorar')
      ?.click()
  );
  await page.locator('#skills-sh-heading').waitFor({ timeout: 10000 });
}

async function main() {
  rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(SHOTS_DIR, { recursive: true });

  const prevEnv = {
    VITE_GITHUB_OAUTH_URL: process.env.VITE_GITHUB_OAUTH_URL,
    VITE_SKILLS_SH_PROXY_URL: process.env.VITE_SKILLS_SH_PROXY_URL,
    VITE_CATALOG_REPO: process.env.VITE_CATALOG_REPO,
    VITE_GITHUB_CLIENT_ID: process.env.VITE_GITHUB_CLIENT_ID,
  };

  process.env.VITE_GITHUB_OAUTH_URL = 'https://fake-vercel.test/api/github-oauth';
  process.env.VITE_SKILLS_SH_PROXY_URL = '';
  process.env.VITE_CATALOG_REPO = 'test/catalog';
  process.env.VITE_GITHUB_CLIENT_ID = 'test-client-id';

  let server;
  let browser;
  const directSkillsShHits = [];
  const unexpectedExternalHits = [];

  try {
    console.log('Compilando la app con proxy simulado de skills.sh...');
    await build({
      root: ROOT,
      logLevel: 'error',
      build: { outDir: OUT_DIR, emptyOutDir: true },
    });

    server = await preview({
      root: ROOT,
      build: { outDir: OUT_DIR },
      preview: { port: PORT, host: '127.0.0.1', strictPort: true },
    });
    const origin = `http://127.0.0.1:${PORT}`;
    browser = await chromium.launch({ headless: true });

    let proxyDown = false;
    const proxyRequests = [];
    const githubContentRequests = [];
    const catalogIssues = [];
    let nextIssueNumber = 1;

    async function installRoutes(context) {
      await context.addInitScript(() => {
        // Sin ventana emergente: la app cae al modo «redirección» para el OAuth simulado.
        window.open = () => null;
        // Traductor nativo simulado (evita llamadas externas a Gemini).
        delete self.LanguageDetector;
        self.Translator = {
          async availability() {
            return 'available';
          },
          async create() {
            return {
              async translate(text) {
                if (text.includes('Vercel React Best Practices')) {
                  return text.replace('Vercel React Best Practices', 'Mejores prácticas de Vercel React');
                }
                if (text.includes('Prefer server components')) {
                  return 'Prefiere componentes de servidor y evita cascadas innecesarias en el cliente.';
                }
                return `[ES] ${text}`;
              },
            };
          },
        };
      });

      // Catch-all externo: registrado primero para ejecutarse al final (Playwright evalúa routes en orden LIFO),
      // después de **/api/skills-sh**, **/api/github-oauth** y los mocks específicos.
      await context.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|api\.github\.com|avatars\.githubusercontent\.com|fonts\.googleapis\.com|fonts\.gstatic\.com|www\.skills\.sh|github\.com\/login\/oauth\/authorize|[^/]+\/api\/(?:skills-sh|github-oauth)(?:$|[/?#]))/, (route) => {
        unexpectedExternalHits.push(route.request().url());
        return route.abort();
      });

      await context.route('https://www.skills.sh/**', (route) => {
        directSkillsShHits.push(route.request().url());
        return route.abort();
      });

      await context.route('https://github.com/login/oauth/authorize**', (route) => {
        const params = new URL(route.request().url()).searchParams;
        const redirect = new URL(params.get('redirect_uri'));
        redirect.searchParams.set('code', 'test-code');
        redirect.searchParams.set('state', params.get('state'));
        return route.fulfill({ status: 302, headers: { location: redirect.toString() } });
      });

      await context.route('**/api/github-oauth**', (route) => {
        if (route.request().method() === 'OPTIONS') {
          return route.fulfill({ status: 204, headers: CORS });
        }
        return route.fulfill(
          json({ access_token: 'ghu_test_token_0123456789', expires_in: 28800 })
        );
      });

      await context.route('**/api/skills-sh**', (route) => {
        const url = new URL(route.request().url());
        proxyRequests.push(url.search);
        if (proxyDown) {
          return route.fulfill(json({ error: 'upstream_unavailable' }, 502));
        }
        const mode = url.searchParams.get('mode');
        if (mode === 'list') {
          const view = url.searchParams.get('view') || 'all-time';
          const pageNum = Number(url.searchParams.get('page') || '0');
          const map = {
            'all-time': { skills: ALL_TIME_SKILLS, total: 9905 },
            trending: { skills: TRENDING_SKILLS, total: 9988 },
            hot: { skills: HOT_SKILLS, total: 9995 },
          };
          const selected = map[view] ?? map['all-time'];
          return route.fulfill(
            json({
              mode: 'list',
              view,
              page: pageNum,
              skills: selected.skills,
              total: selected.total,
              hasMore: false,
              syncedAt: SYNCED_AT,
            })
          );
        }
        if (mode === 'search') {
          const q = (url.searchParams.get('q') || '').toLowerCase();
          const pool = [...ALL_TIME_SKILLS, ...TRENDING_SKILLS];
          const dedup = new Map();
          for (const item of pool) {
            const id = `${item.source}/${item.skillId}`;
            if (!dedup.has(id)) dedup.set(id, item);
          }
          const matches = [...dedup.values()].filter(
            (s) =>
              s.name.toLowerCase().includes(q) ||
              s.skillId.toLowerCase().includes(q) ||
              s.source.toLowerCase().includes(q)
          );
          return route.fulfill(
            json({
              mode: 'search',
              query: q,
              skills: matches,
              count: matches.length,
              syncedAt: SYNCED_AT,
            })
          );
        }
        return route.fulfill(json({ error: 'invalid_mode' }, 400));
      });

      await context.route('https://api.github.com/**', (route) => {
        const req = route.request();
        if (req.method() === 'OPTIONS') {
          return route.fulfill({ status: 204, headers: CORS });
        }
        const url = new URL(req.url());
        const p = url.pathname;
        if (p === '/user') {
          return route.fulfill(json({ login: TEAM_LOGIN, avatar_url: AVATAR }));
        }
        if (p === `/users/${TEAM_LOGIN}`) {
          return route.fulfill(json({ login: TEAM_LOGIN, name: 'Sergio Mateo', avatar_url: AVATAR }));
        }
        if (p === '/repos/test/catalog/issues') {
          if (req.method() === 'POST') {
            const payload = req.postDataJSON() ?? {};
            const issueNumber = nextIssueNumber++;
            const created = {
              number: issueNumber,
              html_url: `https://github.com/test/catalog/issues/${issueNumber}`,
              title: payload.title ?? '',
              body: payload.body ?? '',
              created_at: SYNCED_AT,
              user: { login: TEAM_LOGIN, avatar_url: AVATAR },
              labels: Array.isArray(payload.labels)
                ? payload.labels.map((name) => ({ name }))
                : [],
              reactions: { '+1': 0 },
            };
            catalogIssues.unshift(created);
            return route.fulfill(json(created, 201));
          }
          const labels = url.searchParams.get('labels') ?? '';
          return route.fulfill(json(labels.includes('result') ? [] : catalogIssues));
        }
        if (p.startsWith('/repos/test/catalog/issues/')) {
          const rest = p.slice('/repos/test/catalog/issues/'.length);
          if (rest.endsWith('/reactions')) {
            return route.fulfill(json([]));
          }
          const num = Number(rest);
          const found = catalogIssues.find((issue) => issue.number === num);
          return found ? route.fulfill(json(found)) : route.fulfill(json({ message: 'Not Found' }, 404));
        }
        if (p === '/repos/vercel-labs/agent-skills') {
          return route.fulfill(
            json({
              private: false,
              default_branch: 'main',
              topics: ['react', 'nextjs'],
              license: { spdx_id: 'MIT' },
              owner: { login: 'vercel-labs', avatar_url: AVATAR },
            })
          );
        }
        if (p === '/repos/vercel-labs/agent-skills/commits/main') {
          return route.fulfill({ status: 200, headers: CORS, contentType: 'text/plain', body: SHA });
        }
        if (p === `/repos/vercel-labs/agent-skills/git/trees/${SHA}`) {
          return route.fulfill(
            json({
              tree: [
                {
                  path: 'skills/vercel-react-best-practices/SKILL.md',
                  type: 'blob',
                  mode: '100644',
                  size: REACT_SKILL_MD.length,
                },
                {
                  path: 'skills/vercel-react-best-practices/references/guide.md',
                  type: 'blob',
                  mode: '100644',
                  size: GUIDE_MD.length,
                },
                {
                  path: 'skills/web-design-guidelines/SKILL.md',
                  type: 'blob',
                  mode: '100644',
                  size: 40,
                },
              ],
            })
          );
        }
        if (p === '/repos/vercel-labs/agent-skills/contents/skills/vercel-react-best-practices/SKILL.md') {
          const ref = url.searchParams.get('ref');
          githubContentRequests.push({ path: p, ref });
          if (ref !== SHA) return route.fulfill(json({ message: 'Missing or mismatched ref' }, 404));
          return route.fulfill({ status: 200, headers: CORS, contentType: 'text/plain', body: REACT_SKILL_MD });
        }
        if (p === '/repos/vercel-labs/agent-skills/contents/skills/vercel-react-best-practices/references/guide.md') {
          const ref = url.searchParams.get('ref');
          githubContentRequests.push({ path: p, ref });
          if (ref !== SHA) return route.fulfill(json({ message: 'Missing or mismatched ref' }, 404));
          return route.fulfill({ status: 200, headers: CORS, contentType: 'text/plain', body: GUIDE_MD });
        }
        return route.fulfill(json({ message: 'Not Found' }, 404));
      });

      await context.route('https://avatars.githubusercontent.com/**', (route) =>
        route.fulfill({ status: 200, contentType: 'image/png', body: PNG })
      );

      await context.route('https://fonts.googleapis.com/**', (route) =>
        route.fulfill({ status: 200, contentType: 'text/css; charset=utf-8', body: '' })
      );

      await context.route('https://fonts.gstatic.com/**', (route) =>
        route.fulfill({ status: 200, contentType: 'font/woff2', body: '' })
      );
    }

    /* ---------------------------------------------------------------- */
    /* Recorrido completo en escritorio (1440x900)                      */
    /* ---------------------------------------------------------------- */
    console.log('\nRecorrido completo en escritorio (1440x900)');
    const desktopCtx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      permissions: ['clipboard-read', 'clipboard-write'],
    });
    await installRoutes(desktopCtx);
    const page = await desktopCtx.newPage();

    const errors = [];
    let allow502ConsoleError = false;
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      const text = msg.text();
      if (allow502ConsoleError && /502|Failed to load resource/i.test(text)) return;
      errors.push(text);
    });
    page.on('pageerror', (err) => errors.push(String(err)));

    // 1. Navegación inicial a Explorar
    await openExplorar(page, origin);
    const section = page.locator('section[aria-labelledby="skills-sh-heading"]');
    await section.locator('article').first().waitFor({ timeout: 8000 });

    // 2. Estado En vivo, título, atribución, tarjetas, badges y copia npx
    check(
      'muestra el título "Explorar skills de skills.sh"',
      (await page.locator('#skills-sh-heading').innerText()).trim() === 'Explorar skills de skills.sh'
    );
    check(
      'muestra indicador de estado "En vivo"',
      await section.locator('[role="status"]', { hasText: 'En vivo' }).first().isVisible()
    );
    const attributionHref = await section.locator('header a[href="https://www.skills.sh"]').first().getAttribute('href');
    check('incluye atribución enlazada a https://www.skills.sh', attributionHref === 'https://www.skills.sh');

    const firstCard = section.locator('article').first();
    const firstCardText = await firstCard.innerText();
    check('la primera tarjeta muestra posición #1 y badge Oficial', firstCardText.includes('#1') && firstCardText.includes('Oficial'));
    check(
      'la tarjeta GitHub muestra botones "Inspeccionar" e "Importar" y ningún botón obsoleto de Workspace',
      (await firstCard.getByRole('button', { name: 'Inspeccionar vercel-react-best-practices' }).isVisible()) &&
        (await firstCard.getByRole('button', { name: 'Importar vercel-react-best-practices al catálogo comunitario' }).isVisible()) &&
        (await firstCard.getByRole('button', { name: /Workspace/i }).count()) === 0
    );

    const wellKnownCard = section.locator('article', { hasText: 'ui-taste' });
    await wellKnownCard.waitFor({ timeout: 5000 });
    const wkText = await wellKnownCard.innerText();
    check('la tarjeta .well-known muestra el badge "Fuente .well-known"', wkText.includes('Fuente .well-known'));
    check(
      'la tarjeta .well-known mantiene su aviso sin acciones rotas ni botón "Inspeccionar"',
      wkText.includes('Fuente externa (.well-known)') &&
        (await wellKnownCard.locator('a[href*="github.com"]').count()) === 0 &&
        (await wellKnownCard.getByRole('button', { name: /Inspeccionar/i }).count()) === 0 &&
        (await wellKnownCard.getByRole('button', { name: /Importar/i }).count()) === 0 &&
        (await wellKnownCard.getByRole('button', { name: /Workspace/i }).count()) === 0
    );

    const copyBtn = firstCard.getByRole('button', { name: /Copiar comando npx de vercel-react-best-practices/ });
    await copyBtn.click();
    await firstCard.getByText('Copiado', { exact: true }).waitFor({ timeout: 3000 });
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    check(
      'copiar comando npx confirma "Copiado" y copia el comando exacto',
      clipboardText === 'npx skills add vercel-labs/agent-skills --skill vercel-react-best-practices',
      clipboardText
    );
    await page.screenshot({ path: join(SHOTS_DIR, 'explorar-1440.png') });

    // 3. Pestaña Tendencia, filtro Solo oficiales y búsqueda react
    await section.getByRole('button', { name: 'Tendencia' }).click();
    await section.locator('article', { hasText: 'find-skills' }).waitFor({ timeout: 8000 });
    check(
      'cambiar a pestaña Tendencia carga las skills trending',
      await section.locator('article', { hasText: 'find-skills' }).isVisible()
    );

    await section.getByRole('button', { name: 'Solo oficiales' }).click();
    check(
      'activar Solo oficiales oculta las skills no oficiales',
      (await section.locator('article', { hasText: 'ui-taste' }).count()) === 0 &&
        (await section.locator('article', { hasText: 'find-skills' }).count()) === 1
    );

    const searchInput = page.locator('#skills-sh-search');
    await searchInput.fill('react');
    await section.locator('[role="status"]', { hasText: /para «react»/ }).waitFor({ timeout: 8000 });
    const reactCard = section.locator('article', { hasText: 'vercel-react-best-practices' });
    check(
      'buscar "react" muestra resultados filtrados',
      (await reactCard.count()) === 1 && (await section.locator('article').count()) === 1
    );

    // 4. Inspeccionar desde una skill GitHub -> vista previa de solo lectura fijada a commitSha (C3)
    const shortSha = SHA.slice(0, 7);
    await reactCard.getByRole('button', { name: 'Inspeccionar vercel-react-best-practices' }).click();
    const detailSection = page.locator('section[aria-label="Detalle de skill"]');
    await detailSection.locator('h1', { hasText: 'vercel-react-best-practices' }).waitFor({ timeout: 10000 });

    const previewBadge = detailSection.getByText(`Vista previa · skills.sh · ${shortSha}`);
    await previewBadge.waitFor({ timeout: 5000 });
    const previewAside = detailSection.locator('aside[aria-label="Ficha de la skill"]');
    const previewAsideText = await previewAside.innerText();
    const skillArticle = detailSection.locator('article[aria-label="Contenido de SKILL.md"]');
    const installSection = previewAside.locator('section[aria-label="Instalar la skill"]');

    check(
      'Inspeccionar abre SkillDetailPage en modo vista previa fijada a commitSha con SKILL.md y AuditBadge',
      (await previewBadge.isVisible()) &&
        previewAsideText.includes('Solo lectura fijada al commit') &&
        previewAsideText.includes(shortSha) &&
        (await previewAside.locator('[data-audit-level="clean"]').first().isVisible()) &&
        (await installSection.locator('[data-audit-level="clean"]').isVisible()) &&
        (await skillArticle.innerText()).includes('Prefer server components and avoid unnecessary client waterfalls.')
    );
    check(
      'la vista previa muestra comando npx, panel de instalación fijado al commit y botón "Importar al catálogo"',
      previewAsideText.includes('npx skills add vercel-labs/agent-skills --skill vercel-react-best-practices') &&
        (await previewAside.getByRole('button', { name: 'Copiar npx' }).isVisible()) &&
        (await previewAside.getByRole('button', { name: 'Importar al catálogo' }).isVisible()) &&
        (await installSection.isVisible()) &&
        (await installSection.locator('pre').innerText()).includes(SHA)
    );
    check(
      'en vista previa oculta votos y reportes de resultados',
      (await detailSection.getByRole('button', { name: /^(Votar|Votada)\b/ }).count()) === 0 &&
        (await detailSection.locator('#results-heading').count()) === 0 &&
        (await detailSection.getByRole('heading', { name: 'Reporta tu resultado' }).count()) === 0
    );

    // 4b. Traducción al español en vista previa
    await detailSection.getByRole('button', { name: 'Traducir al español' }).click();
    const translatedArticle = detailSection.locator('article[aria-label="Contenido de SKILL.md traducido al español"]');
    await translatedArticle.waitFor({ timeout: 8000 });
    const translatedText = await translatedArticle.innerText();
    check(
      'traducir al español traduce el SKILL.md en la vista previa y permite volver al original',
      translatedText.includes('Mejores prácticas de Vercel React') &&
        translatedText.includes('Prefiere componentes de servidor') &&
        (await detailSection.getByRole('button', { name: 'Ver original' }).isVisible())
    );
    await detailSection.getByRole('button', { name: 'Ver original' }).click();
    await skillArticle.waitFor({ timeout: 5000 });

    // 4c. Pestaña Archivos con descarga bajo demanda fijada a commitSha
    await detailSection.getByRole('tab', { name: /Archivos/ }).click();
    const fileList = detailSection.locator('ul[aria-label="Archivos de la skill"]');
    await fileList.waitFor({ timeout: 5000 });
    await fileList.getByRole('button', { name: /references\/guide\.md/ }).click();
    const guidePre = detailSection.locator('pre[aria-label="Contenido de references/guide.md"]');
    await guidePre.waitFor({ timeout: 8000 });
    const guideText = await guidePre.innerText();
    const filesTabPanel = detailSection.locator('[role="tabpanel"][aria-labelledby$="-tab-archivos"]');
    const ghFileHref = await filesTabPanel
      .locator('a', { hasText: `Ver en GitHub (${shortSha})` })
      .getAttribute('href');
    check(
      'la pestaña Archivos descarga bajo demanda el archivo fijado a commitSha como texto con copia y enlace a GitHub',
      guideText.includes('# React Reference Guide') &&
        guideText.includes('Keep client bundles small') &&
        (await filesTabPanel.getByRole('button', { name: 'Copiar', exact: true }).isVisible()) &&
        ghFileHref === `https://github.com/vercel-labs/agent-skills/blob/${SHA}/skills/vercel-react-best-practices/references/guide.md` &&
        githubContentRequests.some((r) => r.path.endsWith('/SKILL.md') && r.ref === SHA) &&
        githubContentRequests.some((r) => r.path.endsWith('/references/guide.md') && r.ref === SHA),
      `refs=${JSON.stringify(githubContentRequests)}`
    );
    await page.screenshot({ path: join(SHOTS_DIR, 'vista-previa-1440.png'), fullPage: true });

    // 5. Regresar a Explorar limpia la vista previa y vuelve a skills.sh
    await detailSection.getByRole('button', { name: 'Explorar', exact: true }).click();
    await page.locator('#skills-sh-heading').waitFor({ timeout: 8000 });
    check(
      'el botón de regreso a Explorar vuelve a skills.sh limpiando la vista previa',
      (await page.locator('#skills-sh-heading').isVisible()) &&
        (await page.locator('section[aria-label="Detalle de skill"]').count()) === 0 &&
        (await page.locator(`text=Vista previa · skills.sh · ${shortSha}`).count()) === 0
    );

    // 6. Con proxy 502 al pulsar Actualizar -> degradación a Copia de respaldo
    proxyDown = true;
    allow502ConsoleError = true;
    await page.locator('button[aria-label="Actualizar directorio de skills.sh"]').click();

    await section.locator('[role="status"]', { hasText: 'Copia de respaldo' }).first().waitFor({ timeout: 8000 });
    check(
      'ante proxy 502 al actualizar, degrada a Copia de respaldo con banner visible',
      (await section.getByRole('button', { name: 'Reintentar en vivo' }).isVisible()) &&
        (await section.locator('article').count()) > 0
    );

    await page.locator('#skills-sh-search').fill('react');
    await section.locator('[role="status"]', { hasText: /para «react»/ }).waitFor({ timeout: 8000 });
    check(
      'en modo Copia de respaldo la búsqueda local sobre snapshot devuelve coincidencias',
      (await section.locator('article', { hasText: 'vercel-react-best-practices' }).count()) >= 1
    );
    proxyDown = false;
    allow502ConsoleError = false;

    // 7. Sesión simulada e «Importar al catálogo» desde vista previa -> transición al detalle registrado
    await section.getByRole('button', { name: 'Entrar con GitHub' }).click();
    await page.getByRole('button', { name: 'Entrar con GitHub' }).click();
    await page.locator(`.nav__actions a[aria-label="Sesión de ${TEAM_LOGIN}"]`).waitFor({ timeout: 15000 });
    await page.waitForFunction(() => !location.search.includes('code='), null, { timeout: 5000 });

    await page.evaluate(() => document.querySelector('.nav__actions a.btn--primary')?.click());
    await page.locator('nav[aria-label="Módulos del estudio"]').waitFor({ state: 'attached', timeout: 8000 });
    await page.evaluate(() =>
      [...document.querySelectorAll('nav[aria-label="Módulos del estudio"] a')]
        .find((a) => a.textContent?.trim() === 'Explorar')
        ?.click()
    );
    await page.locator('#skills-sh-heading').waitFor({ timeout: 10000 });
    await section.locator('article', { hasText: 'vercel-react-best-practices' }).waitFor({ timeout: 8000 });
    check(
      'tras iniciar sesión simulada, Explorar muestra la sesión activa @SuarezCaceres',
      await section.getByText(`@${TEAM_LOGIN}`).isVisible()
    );

    await section
      .locator('article', { hasText: 'vercel-react-best-practices' })
      .getByRole('button', { name: 'Inspeccionar vercel-react-best-practices' })
      .click();
    await detailSection.getByRole('button', { name: 'Importar al catálogo' }).waitFor({ timeout: 10000 });
    await detailSection.getByRole('button', { name: 'Importar al catálogo' }).click();

    await detailSection.locator('#results-heading').waitFor({ timeout: 10000 });
    await detailSection.getByText('Subida por').first().waitFor({ timeout: 8000 });
    check(
      'Importar al catálogo registra la skill en el catálogo y transiciona al detalle con votos y reportes',
      catalogIssues.length === 1 &&
        catalogIssues[0].body.includes('vercel-labs/agent-skills') &&
        catalogIssues[0].body.includes(SHA) &&
        (await detailSection.getByRole('button', { name: 'Importar al catálogo' }).count()) === 0 &&
        (await detailSection.getByText(`Vista previa · skills.sh · ${shortSha}`).count()) === 0 &&
        (await detailSection.getByText(`@${TEAM_LOGIN}`).first().isVisible()) &&
        (await detailSection.getByRole('button', { name: /^Votar\b/ }).isVisible()) &&
        (await detailSection.locator('#results-heading').isVisible()) &&
        (await detailSection.getByRole('heading', { name: 'Reporta tu resultado' }).isVisible())
    );
    await detailSection.getByRole('button', { name: 'Explorar', exact: true }).click();
    await page.locator('#skills-sh-heading').waitFor({ timeout: 8000 });
    check(
      'desde el detalle registrado, el botón Explorar regresa a skills.sh',
      await page.locator('#skills-sh-heading').isVisible()
    );

    const cspErrors = errors.filter((e) => /Content Security Policy|Refused to connect/i.test(e));
    check('la CSP no bloquea ninguna petición en escritorio', cspErrors.length === 0, cspErrors.join(' | '));
    check('sin errores de consola ni pageerror en escritorio', errors.length === 0, errors.join(' | '));

    await desktopCtx.close();

    /* ---------------------------------------------------------------- */
    /* Recorrido responsive en los 4 anchos obligatorios                */
    /* ---------------------------------------------------------------- */
    console.log('\nRecorrido responsive en 4 anchos (1440, 1024, 768, 390)');
    proxyDown = false;
    const viewports = [
      { width: 1440, height: 900 },
      { width: 1024, height: 768 },
      { width: 768, height: 1024 },
      { width: 390, height: 844 },
    ];

    for (const vp of viewports) {
      const ctx = await browser.newContext({ viewport: vp });
      await installRoutes(ctx);
      const vpPage = await ctx.newPage();
      const vpErrors = [];
      vpPage.on('console', (m) => m.type() === 'error' && vpErrors.push(m.text()));
      vpPage.on('pageerror', (e) => vpErrors.push(String(e)));

      await openExplorar(vpPage, origin);
      const vpSection = vpPage.locator('section[aria-labelledby="skills-sh-heading"]');
      await vpSection.locator('article').first().waitFor({ timeout: 8000 });

      const layout = await vpPage.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        cards: document.querySelectorAll('section[aria-labelledby="skills-sh-heading"] article').length,
      }));

      check(
        `${vp.width}x${vp.height}: encabezado y tarjetas visibles sin desborde horizontal`,
        (await vpPage.locator('#skills-sh-heading').isVisible()) &&
          layout.cards >= 3 &&
          layout.scrollWidth <= layout.innerWidth + 2 &&
          (await vpSection.getByRole('button', { name: /Inspeccionar/i }).count()) >= 2 &&
          (await vpSection.getByRole('button', { name: /Workspace/i }).count()) === 0,
        `scrollWidth=${layout.scrollWidth}, innerWidth=${layout.innerWidth}, cards=${layout.cards}`
      );
      check(
        `${vp.width}x${vp.height}: sin errores de consola ni pageerror`,
        vpErrors.length === 0,
        vpErrors.join(' | ')
      );
      await vpPage.screenshot({ path: join(SHOTS_DIR, `explorar-${vp.width}.png`) });
      await ctx.close();
    }

    check(
      'el cliente nunca contacta directamente https://www.skills.sh',
      directSkillsShHits.length === 0,
      directSkillsShHits.join(', ')
    );
    check(
      'sin fugas de red hacia orígenes externos no interceptados',
      unexpectedExternalHits.length === 0,
      unexpectedExternalHits.join(', ')
    );
  } finally {
    if (browser) await browser.close();
    if (server) await server.close?.();
    rmSync(OUT_DIR, { recursive: true, force: true });
    for (const [k, v] of Object.entries(prevEnv)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }

  console.log(`\n${passed} comprobaciones correctas${failures.length ? `, ${failures.length} fallaron` : ''}`);
  if (failures.length > 0) {
    console.error(`Fallos: ${failures.join('; ')}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
