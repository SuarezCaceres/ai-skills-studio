/**
 * Verificación interactiva de `ComputerLightBeamShowcase` en la portada (C1, C4).
 *
 * Comprueba las 4 diapositivas vigentes (`Catálogo + Inspector`, `Explorar skills.sh`,
 * `Componentes UI`, `Códice`), hover de telemetría, hotspots de Touch ID y Trackpad,
 * navegación real desde la pantalla OLED hacia cada módulo activo y diseño responsive
 * en los 4 anchos (`1440`, `1024`, `768`, `390` px).
 *
 * Verifica también que no existen referencias residuales a `rarParserService.ts`,
 * modelos antiguos del comparador (`Claude Opus 5.5`, `DeepSeek V3`, `Gemini 3.8 Pro`,
 * `GPT Astra`) ni `Workspace VFS`.
 *
 * Cero llamadas reales a `api.github.com`, `www.skills.sh` o `youtube.com`.
 *
 * Uso: node scripts/verify-laptop-showcase.mjs
 */
import { build, preview } from 'vite';
import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PORT = 5194;
const SHOTS_DIR = resolve(ROOT, 'shots', 'laptop');

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

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

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
      return route.fulfill(json({ ok: true, mocked: 'oauth_mocked' }, 200));
    }

    if (hostname === '127.0.0.1' || hostname === 'localhost') {
      return route.continue();
    }

    if (hostname === 'api.github.com') {
      if (req.method() === 'OPTIONS') {
        return route.fulfill({ status: 204, headers: CORS });
      }
      if (pathname.startsWith('/users/')) {
        return route.fulfill(json({ login: pathname.split('/')[2], name: null }));
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

async function runVerification() {
  console.log('🚀 Starting Playwright verification of 3D Laptop Showcase...');
  mkdirSync(SHOTS_DIR, { recursive: true });

  let previewServer = null;
  let targetUrl = process.env.TARGET_URL || '';

  if (!targetUrl) {
    if (!existsSync(resolve(ROOT, 'dist', 'index.html'))) {
      console.log('📦 Building dist/ before preview...');
      await build({ root: ROOT, logLevel: 'error' });
    }
    previewServer = await preview({
      root: ROOT,
      preview: {
        port: PORT,
        host: '127.0.0.1',
        strictPort: true,
      },
    });
    targetUrl = `http://127.0.0.1:${PORT}/`;
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } });
  const externalLeaks = [];
  await installNetworkMocks(context, externalLeaks);

  const errors = [];
  const page = await context.newPage();
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(`console.error: ${msg.text()}`);
      console.error('Console Error:', msg.text());
    }
  });
  page.on('pageerror', (err) => {
    errors.push(`pageerror: ${String(err)}`);
  });

  const scrollLaptopIntoView = async () => {
    await page.evaluate(() => {
      const el = document.querySelector('.hero__window');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await page.waitForTimeout(300);
  };

  try {
    // 1. Cargar la página inicial
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
    await page.locator('.hero__window').waitFor({ timeout: 8000 });
    await scrollLaptopIntoView();
    console.log('✅ Loaded Landing Page');

    const heroWindow = page.locator('.hero__window');
    const initialWindowText = await heroWindow.innerText();
    for (const obsolete of [
      'rarParserService.ts',
      'deepSeekMoEEngine.ts',
      'DeepSeek V3',
      'Claude Opus 5.5',
      'Gemini 3.8 Pro',
      'GPT Astra',
      'Workspace VFS',
    ]) {
      assert(
        !initialWindowText.includes(obsolete),
        `Texto obsoleto encontrado en el escaparate del portátil: "${obsolete}"`
      );
    }

    // Verificar árbol de archivos de la vista previa en OLED
    for (const fileItem of ['SKILL.md', 'FilesPanel.tsx', 'AuditBadge.tsx', 'Drawer.tsx', 'LessonEditor.tsx']) {
      assert(
        await heroWindow.getByText(fileItem).first().isVisible(),
        `Falta el archivo "${fileItem}" en el visor OLED del portátil`
      );
    }

    // 2. Estado inicial: Catálogo + Inspector
    const catalogoBtn = heroWindow.getByRole('button', { name: /Catálogo \+ Inspector/ });
    assert(
      (await catalogoBtn.getAttribute('aria-pressed')) === 'true',
      'La diapositiva inicial debe ser "Catálogo + Inspector"'
    );
    assert(
      await heroWindow.getByText('catalogo-commit-sha').first().isVisible(),
      'La pantalla OLED inicial debe mostrar "catalogo-commit-sha"'
    );
    await heroWindow.screenshot({
      path: resolve(SHOTS_DIR, 'laptop-hero-1440-catalogo.png'),
    });
    console.log('📸 Screenshot saved: laptop-hero-1440-catalogo.png');

    // 3. Hover sobre Explorar skills.sh actualiza la telemetría flotante sin cambiar la selección fija
    const explorarBtn = heroWindow.getByRole('button', { name: /Explorar skills\.sh/ });
    await explorarBtn.hover({ force: true });
    await page.waitForTimeout(300);
    assert(
      await heroWindow.getByText('Inspección unificada').first().isVisible(),
      'El hover sobre "Explorar skills.sh" debe mostrar "Inspección unificada"'
    );
    assert(
      (await catalogoBtn.getAttribute('aria-pressed')) === 'true',
      'El hover no debe cambiar aria-pressed de "Catálogo + Inspector"'
    );
    await heroWindow.screenshot({
      path: resolve(SHOTS_DIR, 'laptop-hover-explorar.png'),
    });
    console.log('📸 Screenshot saved: laptop-hover-explorar.png');

    // 4. Clic en Explorar skills.sh
    await explorarBtn.click({ force: true });
    await page.waitForTimeout(350);
    assert(
      (await explorarBtn.getAttribute('aria-pressed')) === 'true',
      '"Explorar skills.sh" debe quedar seleccionado tras hacer clic'
    );
    assert(
      (await heroWindow.getByText('SkillsShPage.tsx').first().isVisible()) &&
        (await heroWindow.getByText('explorar-skills-sh').first().isVisible()),
      'La pantalla OLED debe actualizarse a SkillsShPage.tsx y explorar-skills-sh'
    );
    await heroWindow.screenshot({
      path: resolve(SHOTS_DIR, 'laptop-active-explorar.png'),
    });
    console.log('📸 Screenshot saved: laptop-active-explorar.png');

    // 5. Clic en Componentes UI
    const componentesBtn = heroWindow.getByRole('button', { name: /Componentes UI/ });
    await componentesBtn.click({ force: true });
    await page.waitForTimeout(350);
    assert(
      (await componentesBtn.getAttribute('aria-pressed')) === 'true',
      '"Componentes UI" debe quedar seleccionado tras hacer clic'
    );
    assert(
      (await heroWindow.getByText('Drawer.tsx').first().isVisible()) &&
        (await heroWindow.getByText('ui-kit-accesible').first().isVisible()),
      'La pantalla OLED debe actualizarse a Drawer.tsx y ui-kit-accesible'
    );
    await heroWindow.screenshot({
      path: resolve(SHOTS_DIR, 'laptop-active-componentes.png'),
    });
    console.log('📸 Screenshot saved: laptop-active-componentes.png');

    // 6. Clic en Códice
    const codiceBtn = heroWindow.getByRole('button', { name: /Códice\s*Clases/ });
    await codiceBtn.click({ force: true });
    await page.waitForTimeout(350);
    assert(
      (await codiceBtn.getAttribute('aria-pressed')) === 'true',
      '"Códice" debe quedar seleccionado tras hacer clic'
    );
    assert(
      (await heroWindow.getByText('LessonEditor.tsx').first().isVisible()) &&
        (await heroWindow.getByText('codice-clases-equipo').first().isVisible()),
      'La pantalla OLED debe actualizarse a LessonEditor.tsx y codice-clases-equipo'
    );
    await heroWindow.screenshot({
      path: resolve(SHOTS_DIR, 'laptop-active-codice.png'),
    });
    console.log('📸 Screenshot saved: laptop-active-codice.png');

    // 7. Hotspots de Touch ID (cicla al siguiente módulo) y Trackpad
    const touchIdBtn = heroWindow.getByRole('button', {
      name: 'Touch ID: cambiar al siguiente flujo del estudio',
    });
    await touchIdBtn.click({ force: true });
    await page.waitForTimeout(350);
    assert(
      (await catalogoBtn.getAttribute('aria-pressed')) === 'true',
      'Touch ID debe ciclar desde Códice de vuelta a "Catálogo + Inspector"'
    );
    await heroWindow.getByRole('button', { name: 'Trackpad interactivo' }).click({ force: true });
    await page.waitForTimeout(250);
    console.log('✅ Touch ID & Trackpad hotspots verified');

    // 8. Navegación desde el CTA de la pantalla OLED hacia cada módulo activo
    const ctaRoutes = [
      { slideBtn: /Catálogo \+ Inspector/, cta: 'Abrir en Catálogo', heading: '#team-heading' },
      { slideBtn: /Explorar skills\.sh/, cta: 'Ir a Explorar', heading: '#skills-sh-heading' },
      { slideBtn: /Componentes UI/, cta: 'Ver Componentes', heading: '#components-heading' },
      { slideBtn: /Códice\s*Clases/, cta: 'Abrir Códice', heading: '#lessons-heading' },
    ];

    for (const step of ctaRoutes) {
      await scrollLaptopIntoView();
      await heroWindow.getByRole('button', { name: step.slideBtn }).click({ force: true });
      await page.waitForTimeout(250);
      await heroWindow.getByRole('button', { name: step.cta }).click();
      await page.locator(step.heading).waitFor({ timeout: 8000 });
      console.log(`✅ CTA "${step.cta}" navigated to ${step.heading}`);
      await page.locator('header.nav a.nav__logo').click();
      await page.locator('.hero__window').waitFor({ timeout: 8000 });
    }

    // 9. Pruebas responsivas en los 4 anchos (1440, 1024, 768, 390)
    const viewports = [
      { name: '1440', width: 1440, height: 900 },
      { name: '1024', width: 1024, height: 900 },
      { name: '768', width: 768, height: 950 },
      { name: '390', width: 390, height: 844 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await scrollLaptopIntoView();
      assert(await heroWindow.isVisible(), `.hero__window debe ser visible a ${vp.name}px`);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      assert(overflow <= 0, `Desbordamiento horizontal de ${overflow}px en ${vp.name}px`);
      await page.screenshot({
        path: resolve(SHOTS_DIR, `laptop-responsive-${vp.name}.png`),
      });
      console.log(`📸 Screenshot saved: laptop-responsive-${vp.name}.png (${vp.width}x${vp.height})`);
    }

    const cspErrors = errors.filter((e) =>
      /Content Security Policy|Refused to connect|Refused to load/i.test(e)
    );
    assert(cspErrors.length === 0, `Errores CSP detectados: ${cspErrors.join(' | ')}`);
    assert(externalLeaks.length === 0, `Fugas de red externa: ${externalLeaks.join(' | ')}`);
    assert(errors.length === 0, `Errores de consola/página: ${errors.join(' | ')}`);

    console.log('🎉 Verification completed successfully!');
  } catch (err) {
    console.error('❌ Verification failed:', err);
    throw err;
  } finally {
    await context.close();
    await browser.close();
    if (previewServer) {
      await previewServer.close();
    }
  }
}

runVerification()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
