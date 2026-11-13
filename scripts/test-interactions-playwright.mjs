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

// GitHub simulado: el build puede traer el catálogo real configurado y las pruebas no deben
// gastar la cuota anónima (60/h por IP). Catálogo vacío y perfiles sin avatar.
async function fakeGithub(route) {
  const { pathname } = new URL(route.request().url());
  if (pathname.startsWith('/users/')) {
    const login = pathname.split('/')[2];
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ login, name: null }) });
  }
  return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
}
  await page.route('https://api.github.com/**', fakeGithub);

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

    // 3. Skills: ahora es la interfaz del equipo
    const skillsNavLink = page.locator('.nav__links a:has-text("Skills")');
    await skillsNavLink.click();
    await page.locator('#team-heading').waitFor();
    const headingText = await page.locator('#team-heading').innerText();
    console.log(`4️⃣ Skills del equipo loaded: "${headingText}"`);
    // La lista tarda un instante en cargar: se espera al estado vacío en vez de comprobarlo al vuelo.
    await page.locator('text=Nadie del equipo ha subido skills todavía').waitFor({ timeout: 8000 }).catch(() => {
      throw new Error('La vista del equipo debía mostrar el estado vacío con el catálogo simulado vacío');
    });
    console.log('   Estado vacío del equipo correcto');

    // 5. Módulos que exigen una skill abierta en el estudio
    for (const [link, module] of [['Componentes', 'Componentes'], ['Modelos', 'Modelos']]) {
      await page.locator(`.nav__links a:has-text("${link}")`).click();
      await page.locator('#no-skill-heading').waitFor();
      const title = await page.locator('#no-skill-heading').innerText();
      if (!title.includes(`${module} necesita una skill`)) {
        throw new Error(`Estado vacío inesperado en ${link}: "${title}"`);
      }
      console.log(`5️⃣ ${link} sin skill muestra su estado vacío`);
    }

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
