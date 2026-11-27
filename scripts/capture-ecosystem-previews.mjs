/**
 * Genera las 5 capturas WebP reales de los módulos internos de Códice Studio (con sesión simulada)
 * para el selector interactivo de la sección #benchmarks (Ecosistema) en la portada.
 *
 * Usa GitHub y skills.sh simulados (cero llamadas a api.github.com ni www.skills.sh).
 * Uso: node scripts/capture-ecosystem-previews.mjs [--fuentes-de-reserva]
 */
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { mkdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GUIDE_FIXED_NOW, installGuideShowcaseGithub } from './lib/guide-showcase-fixture.mjs';
import { TEST_CATALOG_REPO, TEST_CLIENT_ID, TEST_OAUTH_URL } from './lib/github-fixture.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = resolve(ROOT, 'src', 'assets', 'ecosystem');
const PORT = 5196;
const WIDTH = 1280;
const HEIGHT = 800;
const MAX_BYTES = 75 * 1024;
const QUALITIES = [0.82, 0.76, 0.7, 0.64, 0.58, 0.52];
const FALLBACK_FONTS = process.argv.includes('--fuentes-de-reserva');

const CAPTURE_CSS =
  '*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}' +
  'div.pointer-events-none.fixed.inset-0.z-0{display:none!important}';

const MOCK_SKILLS_SH = [
  {
    source: 'vercel-labs/agent-skills',
    skillId: 'vercel-react-best-practices',
    name: 'vercel-react-best-practices',
    installs: 928903,
    weeklyInstalls: [21000, 22400, 25100],
    isOfficial: true,
  },
  {
    source: 'anthropics/skills',
    skillId: 'frontend-design',
    name: 'frontend-design',
    installs: 615420,
    weeklyInstalls: [14200, 15800, 17900],
    isOfficial: true,
  },
  {
    source: 'supabase/agent-skills',
    skillId: 'supabase-postgres-best-practices',
    name: 'supabase-postgres-best-practices',
    installs: 482100,
    weeklyInstalls: [11000, 12100, 13400],
    isOfficial: true,
  },
  {
    source: 'google-gemini/skills',
    skillId: 'gemini-api-dev',
    name: 'gemini-api-dev',
    installs: 341850,
    weeklyInstalls: [8900, 9600, 10800],
    isOfficial: true,
  },
  {
    source: 'nestjs/agent-skills',
    skillId: 'nestjs-best-practices',
    name: 'nestjs-best-practices',
    installs: 219400,
    weeklyInstalls: [5100, 5800, 6400],
  },
  {
    source: 'trailofbits/skills',
    skillId: 'security-audit',
    name: 'security-audit',
    installs: 194300,
    weeklyInstalls: [4300, 4900, 5600],
  },
];

async function pngToWebp(browser, png) {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    for (const quality of QUALITIES) {
      const dataUrl = await page.evaluate(
        async ({ b64, q }) => {
          const blob = await (await fetch(`data:image/png;base64,${b64}`)).blob();
          const bitmap = await createImageBitmap(blob);
          const canvas = document.createElement('canvas');
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          canvas.getContext('2d').drawImage(bitmap, 0, 0);
          return canvas.toDataURL('image/webp', q);
        },
        { b64: png.toString('base64'), q: quality }
      );
      const buffer = Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');
      if (buffer.length <= MAX_BYTES) return { buffer, quality };
    }
    throw new Error(`El WebP superó el límite de ${MAX_BYTES / 1024} KB.`);
  } finally {
    await context.close();
  }
}

async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      [...document.images].map((img) =>
        img.complete ? null : new Promise((ok) => ((img.onload = ok), (img.onerror = ok)))
      )
    );
  });
  await page.evaluate(() => new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok))));
  await page.mouse.move(WIDTH - 1, HEIGHT - 1);
  await page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur());
}

async function main() {
  process.env.VITE_CATALOG_REPO = TEST_CATALOG_REPO;
  process.env.VITE_GITHUB_CLIENT_ID = TEST_CLIENT_ID;
  process.env.VITE_GITHUB_OAUTH_URL = TEST_OAUTH_URL;

  mkdirSync(OUT_DIR, { recursive: true });
  // Si las capturas aún no existen, crea stubs mínimos para que Vite resuelva los imports antes de sobrescribirlas.
  const STUB_WEBP = Buffer.from('UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=', 'base64');
  for (const name of ['skills-equipo.webp', 'catalogo.webp', 'explorar.webp', 'componentes.webp', 'codice.webp']) {
    const p = resolve(OUT_DIR, name);
    try {
      statSync(p);
    } catch {
      writeFileSync(p, STUB_WEBP);
    }
  }

  const server = await createServer({
    root: ROOT,
    logLevel: 'error',
    server: { port: PORT, host: '127.0.0.1', strictPort: true },
  });
  await server.listen();
  const origin = `http://127.0.0.1:${PORT}`;
  const browser = await chromium.launch({ headless: true });

  mkdirSync(OUT_DIR, { recursive: true });

  try {
    const context = await browser.newContext({
      viewport: { width: WIDTH, height: HEIGHT },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    });
    await context.clock.setFixedTime(GUIDE_FIXED_NOW);

    const guard = await installGuideShowcaseGithub(context, {
      localOrigin: origin,
      fallbackFonts: FALLBACK_FONTS,
    });

    // En Playwright las rutas son LIFO (la última registrada se evalúa primero):
    // registramos aquí /api/skills-sh y el flujo OAuth simulado (sin red real).
    const CORS = {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'authorization,content-type,accept,x-github-api-version,*',
      'access-control-allow-methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
    };
    await context.route(`${origin}/api/skills-sh*`, (route) => {
      const url = new URL(route.request().url());
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          mode: url.searchParams.get('mode') || 'list',
          view: url.searchParams.get('view') || 'all-time',
          page: Number(url.searchParams.get('page') || '0'),
          skills: MOCK_SKILLS_SH,
          total: MOCK_SKILLS_SH.length,
          count: MOCK_SKILLS_SH.length,
          hasMore: false,
          syncedAt: '2026-11-15T12:00:00.000Z',
        }),
      });
    });
    await context.route('https://github.com/login/oauth/authorize**', (route) => {
      const params = new URL(route.request().url()).searchParams;
      const redirect = new URL(params.get('redirect_uri'));
      redirect.searchParams.set('code', 'test-code');
      redirect.searchParams.set('state', params.get('state'));
      return route.fulfill({ status: 302, headers: { location: redirect.toString() } });
    });
    await context.route('https://oauth.example.test/**', (route) => {
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
      return route.fulfill({
        status: 200,
        headers: CORS,
        contentType: 'application/json',
        body: JSON.stringify({ access_token: 'ghu_test_token_0123456789', expires_in: 28800 }),
      });
    });
    await context.route('https://api.github.com/users/*', (route) => {
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
      const login = new URL(route.request().url()).pathname.split('/')[2] || 'SuarezCaceres';
      return route.fulfill({
        status: 200,
        headers: CORS,
        contentType: 'application/json',
        body: JSON.stringify({
          login,
          name: login === 'SuarezCaceres' ? 'Sergio Suárez' : login,
          avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4',
        }),
      });
    });
    await context.route('https://api.github.com/user', (route) => {
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
      return route.fulfill({
        status: 200,
        headers: CORS,
        contentType: 'application/json',
        body: JSON.stringify({
          login: 'SuarezCaceres',
          name: 'Sergio Suárez',
          avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4',
        }),
      });
    });

    const page = await context.newPage();
    page.on('pageerror', (e) => console.error('PAGEERROR:', e));
    page.on('console', (m) => {
      if (m.type() === 'error') console.error('CONSOLE:', m.text());
    });
    // Siembra 2 clases técnicas de ejemplo en localStorage para que la captura de Códice muestre tarjetas reales.
    await context.addInitScript(() => {
      const seed = [
        {
          id: 'auditoria-commitsha-skills',
          title: 'Auditoría segura de directivas SKILL.md por commitSha',
          summary: 'Cómo inspeccionar scripts externos bajo demanda sin ejecutarlos y fijar cada lectura al SHA auditado.',
          body: '# Auditoría por commitSha\n\nRevisa siempre `SKILL.md` y sus scripts antes de instalar en Claude Code, Cursor o Gemini CLI.',
          level: 'intermedio',
          tags: ['seguridad', 'commitSha', 'github'],
          skills: ['lucia-ferrer/skills-frontend/accesibilidad-wcag'],
          components: ['buttons', 'drawer'],
          videos: [],
          author: { login: 'SuarezCaceres', name: 'Sergio Suárez' },
          createdAt: '2026-11-12T10:00:00.000Z',
          updatedAt: '2026-11-14T15:30:00.000Z',
        },
        {
          id: 'componentes-accesibles-teclado',
          title: 'Patrones WCAG 2.2 AA para componentes UI interactivos',
          summary: 'Lista de verificación práctica de foco visible, roles ARIA y navegación completa por teclado en React 19.',
          body: '# Accesibilidad en el Kit UI\n\nCada componente se prueba con teclado y lectores de pantalla antes de entrar al estudio.',
          level: 'inicial',
          tags: ['accesibilidad', 'ui-kit', 'react'],
          skills: ['marco-ibanez/pruebas-e2e/playwright-cuatro-anchos'],
          components: ['accordion', 'dropdowns'],
          videos: [],
          author: { login: 'SuarezCaceres', name: 'Sergio Suárez' },
          createdAt: '2026-11-10T09:00:00.000Z',
          updatedAt: '2026-11-11T12:00:00.000Z',
        },
      ];
      localStorage.setItem('ai_skills_studio_lessons_v1', JSON.stringify(seed));
    });
    await page.goto(`${origin}/`, { waitUntil: 'domcontentloaded' });
    await page.locator('#hero-h').waitFor({ timeout: 10_000 });

    // Inicia sesión simulada con GitHub para que las capturas reflejen la vista interna autenticada.
    await page.locator('header.nav a[aria-label="Entrar con GitHub"]').click();
    await page.locator('.auth-modal-cta').waitFor({ state: 'visible', timeout: 5_000 });
    await page.locator('.auth-modal-cta').click();
    await page.locator('nav[aria-label="Módulos del estudio"]').waitFor({ state: 'visible', timeout: 10_000 });

    await page.addStyleTag({ content: CAPTURE_CSS });

    // Fuerza la carga de Geist y Geist Mono reales si no estamos en modo reserva.
    await page.evaluate(async () => {
      await Promise.allSettled(['400 16px Geist', '600 16px Geist', '400 16px "Geist Mono"'].map((f) => document.fonts.load(f)));
      await document.fonts.ready;
    });

    const views = [
      {
        file: 'skills-equipo.webp',
        navLabel: 'Skills',
        waitFor: async () => {
          await page.locator('#team-heading').waitFor({ timeout: 10_000 });
          await page.locator('section[aria-labelledby="team-heading"] article, main article').first().waitFor({ timeout: 10_000 }).catch(() => {});
        },
      },
      {
        file: 'catalogo.webp',
        navLabel: 'Catálogo',
        waitFor: async () => {
          await page.locator('#catalog-page-heading').waitFor({ timeout: 10_000 });
          await page.locator('section[aria-labelledby="catalog-page-heading"] ul article').first().waitFor({ timeout: 10_000 });
        },
      },
      {
        file: 'explorar.webp',
        navLabel: 'Explorar',
        waitFor: async () => {
          await page.locator('#skills-sh-heading').waitFor({ timeout: 10_000 });
          await page.locator('section[aria-labelledby="skills-sh-heading"] article').first().waitFor({ timeout: 10_000 });
        },
      },
      {
        file: 'componentes.webp',
        navLabel: 'Componentes',
        waitFor: async () => {
          await page.locator('#components-heading').waitFor({ timeout: 10_000 });
          await page.locator('#component-name').waitFor({ timeout: 10_000 });
        },
      },
      {
        file: 'codice.webp',
        navLabel: 'Códice',
        waitFor: async () => {
          await page.locator('#lessons-heading').waitFor({ timeout: 20_000 });
        },
      },
    ];

    for (const v of views) {
      await page.locator('nav[aria-label="Módulos del estudio"] a', { hasText: new RegExp(`^${v.navLabel}$`) }).click();
      await v.waitFor();
      // Oculta visualmente el toast de bienvenida sin mutar el árbol React.
      await page.evaluate(() => {
        document.querySelectorAll('[role="status"]').forEach((el) => {
          if ((el.textContent || '').includes('Sesión iniciada')) el.style.display = 'none';
        });
      });
      await page.waitForTimeout(250);
      await settle(page);
      const png = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
      const webp = await pngToWebp(browser, png);
      const dest = resolve(OUT_DIR, v.file);
      writeFileSync(dest, webp.buffer);
      const kb = (statSync(dest).size / 1024).toFixed(1);
      console.log(`  ok  src/assets/ecosystem/${v.file.padEnd(20)} ${kb} KB (q=${webp.quality})`);
    }

    guard.assertNoRealNetwork();
    await context.close();
    console.log('\n5 capturas del ecosistema generadas correctamente.');
  } finally {
    await browser.close();
    await server.close();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
