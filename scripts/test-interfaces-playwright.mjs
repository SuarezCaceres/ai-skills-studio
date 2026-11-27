/**
 * Auditoría visual, estructural y de accesibilidad en Chromium real (C1, C4).
 *
 * Recorre las vistas activas de Códice Studio (Portada, Navbar, Skills del equipo `boveda`,
 * Catálogo comunitario `catalogo`, Explorar `skills-sh`, Componentes `preview` y Códice `codice-studio`)
 * en los 4 anchos obligatorios (`1440`, `1024`, `768`, `390` px), verificando:
 * - Cero desbordamiento horizontal.
 * - Cero errores de consola, página o CSP (`connect-src`).
 * - Cero menciones a módulos retirados (`Workspace VFS`, `.rar`, `7 modelos`, `Presets UI`, `Abrir en estudio`).
 * - Cero rutas muertas (`estudio`, `modelos-ia`, `evidencias`) en barra superior, menú y pie.
 * - Cero peticiones reales a `api.github.com`, `www.skills.sh` o `youtube.com`.
 *
 * Uso: node scripts/test-interfaces-playwright.mjs
 */
import { build, preview } from 'vite';
import { chromium } from 'playwright';
import { mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TEST_CATALOG_REPO, TEST_CLIENT_ID, TEST_OAUTH_URL } from './lib/github-fixture.mjs';
import { enterApp } from './lib/enter-app.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PORT = 5185;
const OUT_DIR = join(tmpdir(), 'ai-skills-studio-interfaces-e2e');
const SHOTS_DIR = resolve(ROOT, 'shots', 'audit');

mkdirSync(SHOTS_DIR, { recursive: true });

const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '1024', width: 1024, height: 768 },
  { name: '768', width: 768, height: 1024 },
  { name: '390', width: 390, height: 844 },
];

const EXPECTED_NAV_LABELS = ['Inicio', 'Skills', 'Catálogo', 'Explorar', 'Componentes', 'Páginas', 'Códice'];

const FORBIDDEN_TEXT_PATTERNS = [
  { label: 'Workspace VFS', re: /Workspace\s*VFS/i },
  { label: 'extensión .rar', re: /\.rar\b/i },
  { label: '7 modelos', re: /7\s+modelos/i },
  { label: 'Abrir en estudio/Workspace', re: /Abrir\s+en\s+(?:estudio|Workspace)/i },
  { label: 'Explorador de archivos del workspace', re: /Explorador\s+de\s+archivos\s+del\s+workspace/i },
  { label: 'Presets UI', re: /Presets\s+UI/i },
  { label: 'comparador de modelos', re: /comparador.*modelos/i },
];

const DEAD_NAV_LABEL_RE = /^(?:Workspace|Workspace\s*VFS|Modelos|Capturas|Presets\s*UI)$/i;
const DEAD_ROUTE_RE = /(?:^|[#/])(?:estudio|modelos-ia|evidencias)(?:$|[/?#])/i;

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
      const mode = url.searchParams.get('mode');
      if (mode === 'search') {
        return route.fulfill(
          json({
            mode: 'search',
            query: url.searchParams.get('q') || '',
            skills: MOCK_SKILLS_SH,
            count: MOCK_SKILLS_SH.length,
            syncedAt: '2026-11-26T12:00:00.000Z',
          })
        );
      }
      return route.fulfill(
        json({
          mode: 'list',
          view: url.searchParams.get('view') || 'all-time',
          page: Number(url.searchParams.get('page') || '0'),
          skills: MOCK_SKILLS_SH,
          total: MOCK_SKILLS_SH.length,
          hasMore: false,
          syncedAt: '2026-11-26T12:00:00.000Z',
        })
      );
    }

    if (pathname === '/api/github-oauth' || pathname.startsWith('/api/github-oauth/')) {
      if (req.method() === 'OPTIONS') {
        return route.fulfill({ status: 204, headers: CORS });
      }
      return route.fulfill(json({ ok: true, mocked: 'oauth_mocked_in_audit' }, 200));
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

async function openMobileMenuIfCollapsed(page) {
  const toggle = page.locator('.nav__toggle');
  if (await toggle.isVisible()) {
    const expanded = await toggle.getAttribute('aria-expanded');
    if (expanded !== 'true') {
      await toggle.click();
      await page.locator('.nav.is-open').waitFor({ timeout: 3000 });
    }
  }
}

async function closeMobileMenuIfOpen(page) {
  const isOpen = (await page.locator('.nav.is-open').count()) > 0;
  if (isOpen) {
    await page.keyboard.press('Escape');
    await page.locator('.nav.is-open').waitFor({ state: 'detached', timeout: 3000 }).catch(() => {});
  }
}

async function checkViewportInvariants(page, vpName, viewLabel, failures, { strictWorkspaceWord = false } = {}) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  if (overflow > 0) {
    failures.push(`[${vpName}] ${viewLabel}: desbordamiento horizontal de ${overflow}px`);
  }

  const bodyText = await page.evaluate(() => document.body.innerText || '');
  for (const { label, re } of FORBIDDEN_TEXT_PATTERNS) {
    if (re.test(bodyText)) {
      failures.push(`[${vpName}] ${viewLabel}: texto obsoleto detectado (${label})`);
    }
  }
  if (strictWorkspaceWord && /\bWorkspace\b/i.test(bodyText)) {
    failures.push(`[${vpName}] ${viewLabel}: mención residual a "Workspace"`);
  }

  const navAndFooterLinks = await page.evaluate(() => {
    const els = document.querySelectorAll('header.nav a, header.nav button, footer#contact a');
    return Array.from(els).map((el) => ({
      text: (el.textContent || '').replace(/\s+/g, ' ').trim(),
      href: el.getAttribute('href') || '',
    }));
  });

  for (const item of navAndFooterLinks) {
    if (DEAD_NAV_LABEL_RE.test(item.text)) {
      failures.push(`[${vpName}] ${viewLabel}: enlace/botón de módulo retirado "${item.text}"`);
    }
    if (DEAD_ROUTE_RE.test(item.href)) {
      failures.push(`[${vpName}] ${viewLabel}: ruta muerta en href "${item.href}"`);
    }
  }
}

async function clickIdeNavLink(page, shortLabel) {
  await openMobileMenuIfCollapsed(page);
  const link = page
    .locator('nav[aria-label="Módulos del estudio"] a')
    .filter({ hasText: new RegExp(`^\\s*${shortLabel}\\s*$`) });
  await link.click();
}

async function runAudit() {
  console.log('⚡ Launching Vite preview server via Programmatic Node API on port', PORT);
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
  console.log('✅ Vite preview ready at', origin);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const results = {
    portada: {},
    boveda: {},
    catalogo: {},
    explorar: {},
    componentes: {},
    paginas: {},
    codice: {},
    errors: [],
    externalLeaks: [],
    failures: [],
  };

  try {
    for (const vp of VIEWPORTS) {
      console.log(`\n📸 Auditing Viewport ${vp.name} (${vp.width}x${vp.height})...`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      await installNetworkMocks(context, results.externalLeaks);
      const page = await context.newPage();

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          results.errors.push(`[${vp.name}] console.error: ${msg.text()}`);
        }
      });
      page.on('pageerror', (err) => {
        results.errors.push(`[${vp.name}] pageerror: ${String(err)}`);
      });

      // 1. Portada (`inicio`) + Navbar de portada + Pie de página
      await page.goto(`${origin}/`, { waitUntil: 'domcontentloaded' });
      await page.locator('#hero-h').waitFor({ timeout: 8000 });
      await page.waitForTimeout(350);

      await checkViewportInvariants(page, vp.name, 'Portada', results.failures, {
        strictWorkspaceWord: true,
      });

      // Las suites sirven Google Fonts vacías, así que la portada se mide con fuentes de sistema más
      // estrechas que Geist/Geist Mono reales (con ellas la ficha del portátil llegó a 403 px a 390).
      // Se ensancha el texto para que el desbordamiento con la fuente real no pase inadvertido.
      const wideFontStyle = await page.addStyleTag({ content: 'html *{letter-spacing:0.08em !important}' });
      const wideFontOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      if (wideFontOverflow > 0) {
        results.failures.push(
          `[${vp.name}] Portada con métricas de fuente web más anchas desborda ${wideFontOverflow}px`
        );
      }
      await wideFontStyle.evaluate((el) => el.remove());

      if (vp.width < 1024) {
        await openMobileMenuIfCollapsed(page);
        const drawerOverflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth
        );
        if (drawerOverflow > 0) {
          results.failures.push(`[${vp.name}] Menú móvil abierto desborda ${drawerOverflow}px`);
        }
        await closeMobileMenuIfOpen(page);
      }

      const portadaPath = resolve(SHOTS_DIR, `portada-${vp.name}.png`);
      await page.screenshot({ path: portadaPath, fullPage: false });
      results.portada[vp.name] = portadaPath;
      console.log(`   Captured Portada: ${portadaPath}`);

      // 2. Skills del equipo (`boveda`) vía CTA primario de Navbar (.nav__actions a.btn--primary)
      await openMobileMenuIfCollapsed(page);
      await enterApp(page);
      await page.locator('#team-heading').waitFor({ timeout: 8000 });
      await page.waitForTimeout(300);

      const navLabels = await page
        .locator('nav[aria-label="Módulos del estudio"] a')
        .allTextContents();
      const normalizedNav = navLabels.map((s) => s.trim());
      if (normalizedNav.join('|') !== EXPECTED_NAV_LABELS.join('|')) {
        results.failures.push(
          `[${vp.name}] Navbar IDE inesperado: [${normalizedNav.join(', ')}]`
        );
      }

      await checkViewportInvariants(page, vp.name, 'Skills del equipo (boveda)', results.failures, {
        strictWorkspaceWord: true,
      });
      const bovedaPath = resolve(SHOTS_DIR, `boveda-${vp.name}.png`);
      await page.screenshot({ path: bovedaPath, fullPage: false });
      results.boveda[vp.name] = bovedaPath;
      console.log(`   Captured Skills del equipo (boveda): ${bovedaPath}`);

      // 3. Catálogo comunitario (`catalogo`)
      await clickIdeNavLink(page, 'Catálogo');
      await page.locator('#catalog-page-heading').waitFor({ timeout: 8000 });
      await page.waitForTimeout(300);
      await checkViewportInvariants(page, vp.name, 'Catálogo (catalogo)', results.failures, {
        strictWorkspaceWord: true,
      });
      const catalogoPath = resolve(SHOTS_DIR, `catalogo-${vp.name}.png`);
      await page.screenshot({ path: catalogoPath, fullPage: false });
      results.catalogo[vp.name] = catalogoPath;
      console.log(`   Captured Catálogo (catalogo): ${catalogoPath}`);

      // 4. Explorar (`skills-sh`)
      await clickIdeNavLink(page, 'Explorar');
      await page.locator('#skills-sh-heading').waitFor({ timeout: 8000 });
      await page.locator('section[aria-labelledby="skills-sh-heading"] article').first().waitFor({ timeout: 8000 });
      await page.waitForTimeout(250);
      await checkViewportInvariants(page, vp.name, 'Explorar (skills-sh)', results.failures, {
        strictWorkspaceWord: false,
      });
      const explorarPath = resolve(SHOTS_DIR, `explorar-${vp.name}.png`);
      await page.screenshot({ path: explorarPath, fullPage: false });
      results.explorar[vp.name] = explorarPath;
      console.log(`   Captured Explorar (skills-sh): ${explorarPath}`);

      // 5. Componentes (`preview`)
      await clickIdeNavLink(page, 'Componentes');
      await page.locator('#components-heading').waitFor({ timeout: 8000 });
      await page.waitForTimeout(250);
      if ((await page.locator('#no-skill-heading').count()) !== 0) {
        results.failures.push(`[${vp.name}] Componentes mostró #no-skill-heading`);
      }
      await checkViewportInvariants(page, vp.name, 'Componentes (preview)', results.failures, {
        strictWorkspaceWord: true,
      });
      const componentesPath = resolve(SHOTS_DIR, `componentes-${vp.name}.png`);
      await page.screenshot({ path: componentesPath, fullPage: false });
      results.componentes[vp.name] = componentesPath;
      console.log(`   Captured Componentes (preview): ${componentesPath}`);

      // 5b. Páginas (`paginas`, spec 007)
      await clickIdeNavLink(page, 'Páginas');
      await page.locator('#pages-heading').waitFor({ timeout: 8000 });
      await page.waitForTimeout(250);
      await checkViewportInvariants(page, vp.name, 'Páginas (paginas)', results.failures, {
        strictWorkspaceWord: true,
      });
      const paginasPath = resolve(SHOTS_DIR, `paginas-${vp.name}.png`);
      await page.screenshot({ path: paginasPath, fullPage: false });
      results.paginas[vp.name] = paginasPath;
      console.log(`   Captured Páginas (paginas): ${paginasPath}`);

      // 6. Códice (`codice-studio`)
      await clickIdeNavLink(page, 'Códice');
      await page.locator('#lessons-heading').waitFor({ timeout: 8000 });
      await page.waitForTimeout(250);
      await checkViewportInvariants(page, vp.name, 'Códice (codice-studio)', results.failures, {
        strictWorkspaceWord: true,
      });
      const codicePath = resolve(SHOTS_DIR, `codice-${vp.name}.png`);
      await page.screenshot({ path: codicePath, fullPage: false });
      results.codice[vp.name] = codicePath;
      console.log(`   Captured Códice (codice-studio): ${codicePath}`);

      await context.close();
    }

    const cspErrors = results.errors.filter((e) =>
      /Content Security Policy|Refused to connect|Refused to load/i.test(e)
    );

    console.log('\n📊 Audit Summary:');
    console.log('   Errors:', results.errors.length, '| CSP errors:', cspErrors.length);
    console.log('   External network leaks:', results.externalLeaks.length);
    console.log('   Invariant failures:', results.failures.length);

    if (results.errors.length > 0) {
      console.error('❌ Console/Page errors:', results.errors.slice(0, 10));
    }
    if (results.externalLeaks.length > 0) {
      console.error('❌ External network leaks:', results.externalLeaks);
    }
    if (results.failures.length > 0) {
      console.error('❌ Invariant failures:\n - ' + results.failures.join('\n - '));
    }

    if (
      results.errors.length > 0 ||
      cspErrors.length > 0 ||
      results.externalLeaks.length > 0 ||
      results.failures.length > 0
    ) {
      throw new Error('Interface audit failed');
    }
  } finally {
    await browser.close();
    await previewServer.close();
    console.log('🛑 Server closed cleanly.');
  }
}

runAudit()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Audit failed:', err);
    process.exit(1);
  });
