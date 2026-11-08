import { preview } from 'vite';
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PORT = 5185;
const SHOTS_DIR = resolve(ROOT, 'shots', 'audit');

mkdirSync(SHOTS_DIR, { recursive: true });

async function runAudit() {
  console.log('⚡ Launching Vite preview server via Programmatic Node API on port', PORT);
  const previewServer = await preview({
    root: ROOT,
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

  const viewports = [
    { name: '1440', width: 1440, height: 900 },
    { name: '1024', width: 1024, height: 768 },
    { name: '768', width: 768, height: 1024 },
    { name: '390', width: 390, height: 844 },
  ];

  const results = {
    workspace: {},
    skills: {},
    errors: [],
  };

  try {
    for (const vp of viewports) {
      console.log(`\n📸 Auditing Viewport ${vp.name} (${vp.width}x${vp.height})...`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const page = await context.newPage();

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          results.errors.push(`[${vp.name}] ${msg.text()}`);
        }
      });

      // 1. Audit Workspace VFS
      await page.goto(`${origin}/`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(400);

      // Open workspace module via top nav button or action button
      await page.evaluate(() => {
        const openBtn = document.querySelector('.nav__actions a.btn--primary, a[href="#workspace"]');
        if (openBtn) openBtn.click();
      });
      await page.waitForTimeout(600);

      const wsPath = resolve(SHOTS_DIR, `workspace-${vp.name}.png`);
      await page.screenshot({ path: wsPath, fullPage: false });
      console.log(`   Captured Workspace VFS: ${wsPath}`);
      results.workspace[vp.name] = wsPath;

      // 2. Audit Skills / Boveda
      await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('.nav__links a, button'));
        const skillsLink = links.find((el) => {
          const t = el.textContent || '';
          return t.includes('Skills') || t.includes('Bóveda') || t.includes('BÃ³veda');
        });
        if (skillsLink) skillsLink.click();
      });
      await page.waitForTimeout(600);

      const skillsPath = resolve(SHOTS_DIR, `skills-${vp.name}.png`);
      await page.screenshot({ path: skillsPath, fullPage: false });
      console.log(`   Captured Skills: ${skillsPath}`);
      results.skills[vp.name] = skillsPath;

      await context.close();
    }

    console.log('\n📊 Audit Finished. Errors detected:', results.errors.length);
    if (results.errors.length > 0) {
      console.warn('Sample errors:', results.errors.slice(0, 5));
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
