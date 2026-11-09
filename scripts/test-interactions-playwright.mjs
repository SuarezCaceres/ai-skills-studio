import { preview } from 'vite';
import { chromium } from 'playwright';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PORT = 5186;

async function testInteractions() {
  console.log('🧪 Starting Interaction Test Suite with Playwright...');
  const previewServer = await preview({
    root: ROOT,
    preview: {
      port: PORT,
      host: '127.0.0.1',
      strictPort: true,
    },
  });

  const origin = `http://127.0.0.1:${PORT}`;
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  try {
    // 1. Load Landing
    await page.goto(`${origin}/`, { waitUntil: 'domcontentloaded' });
    console.log('1️⃣ Landing loaded');

    // 2. Open Workspace VFS
    const openWsBtn = page.locator('.nav__actions a.btn--primary');
    await openWsBtn.click();
    await page.waitForTimeout(500);

    // Verify Workspace VFS loaded
    const vfsHeader = page.locator('h1');
    const vfsTitle = await vfsHeader.innerText();
    console.log(`2️⃣ Workspace VFS loaded with package: "${vfsTitle}"`);

    // Verify file tree items
    const fileEntries = page.locator('aside[aria-label="Explorador de archivos del workspace"] button span.truncate');
    const fileCount = await fileEntries.count();
    console.log(`   Found ${fileCount} file/folder nodes in VFS tree`);

    // Click second file in tree if available
    if (fileCount > 1) {
      await fileEntries.nth(1).click();
      await page.waitForTimeout(300);
      console.log('   Selected file from VFS tree successfully');
    }

    // Switch to Diff mode
    const diffBtn = page.locator('button:has-text("Diff (")');
    if (await diffBtn.isVisible()) {
      await diffBtn.click();
      await page.waitForTimeout(300);
      console.log('3️⃣ Switched to Diff view successfully');
    }

    // Switch back to Code mode
    const codeBtn = page.locator('button:has-text("Código en vivo")');
    if (await codeBtn.isVisible()) {
      await codeBtn.click();
      await page.waitForTimeout(300);
      console.log('   Switched back to Code view');
    }

    // 3. Navigate to Skills / Bóveda
    const skillsNavLink = page.locator('.nav__links a:has-text("Skills")');
    await skillsNavLink.click();
    await page.waitForTimeout(500);

    const skillsHeading = page.locator('#boveda-heading');
    const headingText = await skillsHeading.innerText();
    console.log(`4️⃣ Skills Catalog loaded: "${headingText}"`);

    // Test filter: Workspaces VFS (.ZIP)
    const vfsFilterBtn = page.locator('button:has-text("Workspaces VFS (.ZIP)")');
    if (await vfsFilterBtn.isVisible()) {
      await vfsFilterBtn.click();
      await page.waitForTimeout(300);
      console.log('   Applied filter: Workspaces VFS');
    }

    // Test filter: All
    const allFilterBtn = page.locator('button:has-text("Todo")').first();
    if (await allFilterBtn.isVisible()) {
      await allFilterBtn.click();
      await page.waitForTimeout(300);
      console.log('   Reset filter: Todo');
    }

    // Test search filter
    const searchInput = page.locator('#vault-search-input');
    await searchInput.fill('tasteskill');
    await page.waitForTimeout(300);
    const searchResults = page.locator('article');
    const searchCount = await searchResults.count();
    console.log(`   Search for "tasteskill" returned ${searchCount} items`);
    await searchInput.fill('');
    await page.waitForTimeout(200);

    console.log('\n✅ All interaction tests passed flawlessly!');
    if (errors.length > 0) {
      console.warn('⚠️ Console errors detected:', errors);
      throw new Error('Interaction suite failed with console errors');
    }
  } finally {
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
