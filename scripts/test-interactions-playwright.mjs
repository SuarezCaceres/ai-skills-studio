/**
 * Prueba E2E de interacciones de navegación en Códice Studio (C1, C4).
 *
 * Verifica los recorridos reales entre la Portada (hero estilo Forge de `feat/hero-forge`), la barra
 * Notch (secciones sin sesión, módulos dentro de la app), el pie de página, el modal de acceso con
 * GitHub, el menú móvil (390px) y todos los módulos vigentes
 * (`boveda`, `catalogo`, `skills-sh`, `preview`, `codice-studio`), comprobando ausencia de
 * rutas muertas (`estudio`, `modelos-ia`, `evidencias`) y de UI retirada de Workspace/Modelos.
 *
 * Cero llamadas reales a `api.github.com`, `www.skills.sh` o `youtube.com`.
 *
 * Uso: node scripts/test-interactions-playwright.mjs
 */
import { build, preview } from 'vite';
import { chromium } from 'playwright';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TEST_CATALOG_REPO, TEST_CLIENT_ID, TEST_OAUTH_URL } from './lib/github-fixture.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PORT = 5186;
const OUT_DIR = join(tmpdir(), 'ai-skills-studio-interactions-e2e');

const EXPECTED_NAV_LABELS = ['Inicio', 'Skills', 'Catálogo', 'Explorar', 'Componentes', 'Páginas', 'Códice'];

const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

const MOCK_SKILLS_SH = [
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
];

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

async function installNetworkMocks(context, externalLeaks) {
  await context.route(/^https?:\/\//, (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const { hostname, pathname } = url;

    if (hostname === 'www.skills.sh' || hostname === 'skills.sh' || hostname.endsWith('.skills.sh')) {
      externalLeaks.push(`direct skills.sh: ${req.url()}`);
      return route.abort();
    }

    if (
      hostname === 'www.youtube.com' ||
      hostname === 'youtube.com' ||
      hostname === 'www.youtube-nocookie.com' ||
      hostname === 'youtube-nocookie.com' ||
      hostname === 'i.ytimg.com'
    ) {
      externalLeaks.push(`youtube: ${req.url()}`);
      return route.abort();
    }

    if (pathname === '/api/skills-sh' || pathname.startsWith('/api/skills-sh/')) {
      if (req.method() === 'OPTIONS') {
        return route.fulfill({ status: 204, headers: CORS });
      }
      return route.fulfill(
        json({
          mode: url.searchParams.get('mode') || 'list',
          view: url.searchParams.get('view') || 'all-time',
          page: Number(url.searchParams.get('page') || '0'),
          skills: MOCK_SKILLS_SH,
          total: MOCK_SKILLS_SH.length,
          count: MOCK_SKILLS_SH.length,
          hasMore: false,
          syncedAt: '2026-11-26T12:00:00.000Z',
        })
      );
    }

    if (pathname === '/api/github-oauth' || pathname.startsWith('/api/github-oauth/')) {
      if (req.method() === 'OPTIONS') {
        return route.fulfill({ status: 204, headers: CORS });
      }
      return route.fulfill(json({ ok: true, mocked: 'oauth_mocked_in_interactions' }, 200));
    }

    if (hostname === '127.0.0.1' || hostname === 'localhost') {
      return route.continue();
    }

    if (hostname === 'api.github.com') {
      if (req.method() === 'OPTIONS') {
        return route.fulfill({ status: 204, headers: CORS });
      }
      if (pathname.startsWith('/users/')) {
        const login = pathname.split('/')[2];
        return route.fulfill(json({ login, name: null }));
      }
      return route.fulfill(json([]));
    }

    if (hostname === 'avatars.githubusercontent.com') {
      return route.fulfill({ status: 200, contentType: 'image/png', body: PNG_1X1 });
    }

    if (hostname === 'fonts.googleapis.com') {
      return route.fulfill({ status: 200, contentType: 'text/css; charset=utf-8', body: '' });
    }

    if (hostname === 'fonts.gstatic.com') {
      return route.fulfill({ status: 200, contentType: 'font/woff2', body: '' });
    }

    externalLeaks.push(`unexpected external: ${req.url()}`);
    return route.abort();
  });
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function testInteractions() {
  console.log('🧪 Starting Interaction Test Suite with Playwright...');
  // Compila su propio dist con el GitHub simulado: no depende de `.env.local` ni de `npm run build`.
  process.env.VITE_CATALOG_REPO = TEST_CATALOG_REPO;
  process.env.VITE_GITHUB_CLIENT_ID = TEST_CLIENT_ID;
  process.env.VITE_GITHUB_OAUTH_URL = TEST_OAUTH_URL;
  process.env.VITE_SKILLS_SH_PROXY_URL = '';
  rmSync(OUT_DIR, { recursive: true, force: true });
  await build({ root: ROOT, logLevel: 'error', build: { outDir: OUT_DIR, emptyOutDir: true } });
  const previewServer = await preview({
    root: ROOT,
    build: { outDir: OUT_DIR },
    preview: {
      port: PORT,
      host: '127.0.0.1',
      strictPort: true,
    },
  });

  const origin = `http://127.0.0.1:${PORT}`;
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const externalLeaks = [];
  await installNetworkMocks(context, externalLeaks);
  const page = await context.newPage();

  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
  });
  page.on('pageerror', (err) => errors.push(`pageerror: ${String(err)}`));

  const returnToLanding = async () => {
    await page.locator('header.nav a.nav__logo').click();
    await page.locator('#hero-h').waitFor({ timeout: 8000 });
  };

  try {
    // 1. Carga de Portada y validación de enlaces activos (sin rutas muertas)
    await page.goto(`${origin}/`, { waitUntil: 'domcontentloaded' });
    await page.locator('#hero-h').waitFor({ timeout: 8000 });
    const heroTitle = await page.locator('#hero-h').innerText();
    assert(heroTitle.includes('Clases en video'), `Título inesperado en hero: "${heroTitle}"`);
    const sectionLinks = (await page.locator('header.nav nav[aria-label="Principal"] a').allInnerTexts()).map((t) => t.trim());
    assert(
      sectionLinks.join('|') === 'Guía|Inspector|Capacidades|Ecosistema|Preguntas',
      `Secciones de la barra sin sesión inesperadas: [${sectionLinks.join(', ')}]`
    );
    console.log('1️⃣ Landing loaded');

    const landingLinks = await page.evaluate(() =>
      Array.from(document.querySelectorAll('header.nav a, footer#contact a, main a')).map((a) => ({
        text: (a.textContent || '').replace(/\s+/g, ' ').trim(),
        href: a.getAttribute('href') || '',
      }))
    );
    for (const link of landingLinks) {
      assert(
        !/^(?:Workspace|Workspace VFS|Modelos|Capturas|Presets UI)$/i.test(link.text),
        `Enlace de módulo retirado en portada: "${link.text}"`
      );
      assert(
        !/(?:^|[#/])(?:estudio|modelos-ia|evidencias)(?:$|[/?#])/i.test(link.href),
        `Href con ruta muerta en portada: "${link.href}"`
      );
    }

    // 2. Sin sesión, el CTA primario de la barra es «Entrar con GitHub»; a los módulos se entra desde
    //    la portada: «Skills del equipo» del pie lleva al Catálogo del equipo (`boveda`).
    const navPrimaryCta = page.locator('.nav__actions a.btn--primary');
    const ctaLabel = ((await navPrimaryCta.getAttribute('aria-label')) || (await navPrimaryCta.innerText())).trim();
    assert(ctaLabel === 'Entrar con GitHub', `CTA primario sin sesión inesperado: "${ctaLabel}"`);
    await page.locator('footer#contact a', { hasText: 'Skills del equipo' }).click();
    await page.locator('#team-heading').waitFor({ timeout: 8000 });
    const headingText = await page.locator('#team-heading').innerText();
    console.log(`2️⃣ Footer «Skills del equipo» opened Skills del equipo (boveda): "${headingText}"`);

    assert(
      (await page.locator('aside[aria-label="Explorador de archivos del workspace"]').count()) === 0,
      'El explorador obsoleto del Workspace no debe existir'
    );
    assert(
      (await page.locator('button:has-text("Abrir en estudio")').count()) === 0,
      'No debe existir el botón "Abrir en estudio"'
    );
    await page.locator('text=Nadie del equipo ha subido skills todavía').waitFor({ timeout: 8000 });
    console.log('   Estado vacío del equipo correcto con GitHub simulado');

    // Verificar lista exacta de módulos en el navbar interno
    const ideNavTexts = (
      await page.locator('nav[aria-label="Módulos del estudio"] a').allInnerTexts()
    ).map((t) => t.trim());
    assert(
      ideNavTexts.join('|') === EXPECTED_NAV_LABELS.join('|'),
      `Navbar de módulos inesperado: [${ideNavTexts.join(', ')}]`
    );

    // 3. Navegación entre módulos vigentes desde la barra superior
    // 3A. Catálogo comunitario (`catalogo`)
    await page.locator('nav[aria-label="Módulos del estudio"] a', { hasText: /^Catálogo$/ }).click();
    await page.locator('#catalog-page-heading').waitFor({ timeout: 8000 });
    assert(
      (await page
        .locator('nav[aria-label="Módulos del estudio"] a', { hasText: /^Catálogo$/ })
        .getAttribute('aria-current')) === 'page',
      'Catálogo debe marcar aria-current="page"'
    );
    console.log('3️⃣ Catálogo comunitario (catalogo) loaded');

    // 3B. Explorar (`skills-sh`)
    await page.locator('nav[aria-label="Módulos del estudio"] a', { hasText: /^Explorar$/ }).click();
    await page.locator('#skills-sh-heading').waitFor({ timeout: 8000 });
    const skillsShSection = page.locator('section[aria-labelledby="skills-sh-heading"]');
    await skillsShSection.locator('article').first().waitFor({ timeout: 8000 });
    assert(
      (await skillsShSection.getByRole('button', { name: /Abrir .* en Workspace/i }).count()) === 0,
      'Explorar no debe mostrar botones "Abrir ... en Workspace"'
    );
    assert(
      (await skillsShSection.getByRole('button', { name: /Inspeccionar/i }).count()) >= 1,
      'Explorar debe ofrecer el botón "Inspeccionar" en tarjetas de GitHub'
    );
    console.log('4️⃣ Explorar (skills-sh) loaded with Inspeccionar');

    // 3C. Componentes (`preview`)
    await page
      .locator('nav[aria-label="Módulos del estudio"] a', { hasText: /^Componentes$/ })
      .click();
    await page.locator('#components-heading').waitFor({ timeout: 8000 });
    assert(
      (await page.locator('#no-skill-heading').count()) === 0,
      'Componentes no debe pedir ninguna skill abierta'
    );
    const secondComponentBtn = page.locator('nav[aria-label="Componentes"] ul button').nth(1);
    await secondComponentBtn.click();
    const selectedComponentName = (await page.locator('#component-name').innerText()).trim();
    assert(selectedComponentName.length > 0, 'Seleccionar un componente debe actualizar su detalle');
    console.log(`5️⃣ Componentes (preview) loaded & interactive (${selectedComponentName})`);

    // 3D. Códice (`codice-studio`)
    await page.locator('nav[aria-label="Módulos del estudio"] a', { hasText: /^Códice$/ }).click();
    await page.locator('#lessons-heading').waitFor({ timeout: 8000 });
    await page.getByRole('tab', { name: 'Comunidad' }).click();
    assert(
      (await page.getByRole('tab', { name: 'Comunidad' }).getAttribute('aria-selected')) === 'true',
      'La pestaña Comunidad en Códice debe activarse'
    );
    await page.getByRole('tab', { name: 'Mis clases' }).click();
    console.log('6️⃣ Códice (codice-studio) loaded with tabs');

    // 3E. Regreso a Portada desde "Inicio" del navbar
    await page.locator('nav[aria-label="Módulos del estudio"] a', { hasText: /^Inicio$/ }).click();
    await page.locator('#hero-h').waitFor({ timeout: 8000 });

    // 4. Navegación desde enlaces de Portada y Pie de página (`#contact`)
    await page.locator('a.fg-cta-primary', { hasText: 'Ver el ecosistema' }).click();
    await page.waitForFunction(() => location.hash === '#benchmarks', null, { timeout: 8000 });
    assert((await page.locator('#hero-h').count()) === 1, '«Ver el ecosistema» debe quedarse en la portada');

    await page.locator('footer#contact a', { hasText: 'Catálogo comunitario' }).click();
    await page.locator('#catalog-page-heading').waitFor({ timeout: 8000 });
    await returnToLanding();

    await page.locator('#inspector a.link').click();
    await page.locator('#team-heading').waitFor({ timeout: 8000 });
    await returnToLanding();

    await page.locator('#capabilities a.link').click();
    await page.locator('#lessons-heading').waitFor({ timeout: 8000 });
    await returnToLanding();

    // El CTA del pie abre el modal de acceso encima de la portada (sin desmontarla).
    await page.locator('footer#contact a.btn--primary').click();
    await page.locator('#auth-modal-heading').waitFor({ timeout: 8000 });
    assert((await page.locator('#hero-h').count()) === 1, 'El modal de acceso no debe desmontar la portada');
    await page.getByRole('button', { name: 'Cerrar ventana de acceso' }).click();
    await page.locator('#auth-modal-heading').waitFor({ state: 'detached', timeout: 5000 });

    await page.locator('footer#contact a', { hasText: 'Códice de clases' }).click();
    await page.locator('#lessons-heading').waitFor({ timeout: 8000 });
    await returnToLanding();

    await page.locator('footer#contact a', { hasText: 'Explorar skills.sh' }).click();
    await page.locator('#skills-sh-heading').waitFor({ timeout: 8000 });
    await returnToLanding();

    await page.locator('footer#contact a', { hasText: 'Componentes UI' }).click();
    await page.locator('#components-heading').waitFor({ timeout: 8000 });
    await returnToLanding();
    console.log('7️⃣ Landing & footer CTAs navigate cleanly to active modules and back');

    // 5. Pantalla de acceso y regreso en Modo Visitante
    await page.locator('header.nav a[aria-label="Entrar con GitHub"]').click();
    await page.getByRole('heading', { name: /Entra con tu cuenta de GitHub/i }).waitFor({ timeout: 8000 });
    await page.getByRole('button', { name: /Volver al Códice en Modo Visitante/i }).click();
    await page.locator('#auth-modal-heading').waitFor({ state: 'detached', timeout: 5000 });
    await page.locator('#hero-h').waitFor({ timeout: 8000 });
    await page.locator('header.nav a[aria-label="Entrar con GitHub"]').click();
    await page.locator('#auth-modal-heading').waitFor({ timeout: 8000 });
    await page.keyboard.press('Escape');
    await page.locator('#auth-modal-heading').waitFor({ state: 'detached', timeout: 5000 });
    console.log('8️⃣ Auth modal opens over the landing and closes (visitor mode, Esc)');

    // 6. Menú móvil en 390px (.nav__toggle -> .nav.is-open)
    await page.setViewportSize({ width: 390, height: 844 });
    const navToggle = page.locator('.nav__toggle');
    await navToggle.waitFor({ state: 'visible', timeout: 5000 });
    await navToggle.click();
    await page.locator('.nav.is-open').waitFor({ timeout: 3000 });
    const mobileSections = (await page.locator('.nav.is-open nav[aria-label="Principal"] a').allInnerTexts()).map((t) => t.trim());
    assert(mobileSections.includes('Capacidades'), `Menú móvil sin sesión inesperado: [${mobileSections.join(', ')}]`);
    await page.locator('.nav.is-open nav[aria-label="Principal"] a', { hasText: /^Capacidades$/ }).click();
    await page.waitForFunction(() => location.hash === '#capabilities', null, { timeout: 5000 });
    assert(
      (await page.locator('.nav.is-open').count()) === 0,
      'El menú móvil debe cerrarse tras navegar'
    );
    await page.locator('footer#contact a', { hasText: 'Skills del equipo' }).click();
    await page.locator('#team-heading').waitFor({ timeout: 8000 });
    await navToggle.click();
    await page.locator('.nav.is-open').waitFor({ timeout: 3000 });
    await page
      .locator('.nav.is-open nav[aria-label="Módulos del estudio"] a', { hasText: /^Componentes$/ })
      .click();
    await page.locator('#components-heading').waitFor({ timeout: 8000 });
    assert(
      (await page.locator('.nav.is-open').count()) === 0,
      'El menú móvil debe cerrarse tras abrir Componentes'
    );
    console.log('9️⃣ Mobile drawer navigation (390px) works cleanly');

    const cspErrors = errors.filter((e) =>
      /Content Security Policy|Refused to connect|Refused to load/i.test(e)
    );
    assert(cspErrors.length === 0, `Errores CSP detectados: ${cspErrors.join(' | ')}`);
    assert(externalLeaks.length === 0, `Fugas de red externa: ${externalLeaks.join(' | ')}`);
    assert(errors.length === 0, `Errores de consola/página: ${errors.join(' | ')}`);

    console.log('\n✅ All interaction tests passed flawlessly!');
  } finally {
    await context.close();
    await browser.close();
    await previewServer.close();
    console.log('🛑 Server closed cleanly.');
  }
}

testInteractions()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test suite failed:', err);
    process.exit(1);
  });
