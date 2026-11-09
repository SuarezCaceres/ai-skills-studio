import { chromium } from 'playwright';
import { resolve } from 'node:path';

const ARTIFACTS_DIR = 'C:/Users/mateo/.gemini/antigravity-cli/brain/94136421-d803-4bb6-a965-452b775191f5';
const TARGET_URL = 'http://localhost:5173/';

async function runVerification() {
  console.log('🚀 Starting Playwright verification of 3D Laptop AI Showcase...');
  const browser = await chromium.launch({ headless: true });

  const errors = [];
  const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.error('Console Error:', msg.text());
    }
  });

  try {
    // 1. Cargar la página inicial
    await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
    console.log('✅ Loaded Landing Page');

    // Centrar la laptop en el viewport
    await page.evaluate(() => {
      const el = document.querySelector('.hero__window');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await page.waitForTimeout(500);

    // 2. Capturar estado inicial centrado (Claude Opus 5.5)
    const heroWindow = page.locator('.hero__window');
    await heroWindow.screenshot({
      path: resolve(ARTIFACTS_DIR, 'laptop-hero-1440-claude.png'),
    });
    console.log('📸 Screenshot saved: laptop-hero-1440-claude.png');

    // 3. Probar hover sobre DeepSeek V3
    const deepSeekBtn = page.locator('button:has-text("DeepSeek V3")');
    await deepSeekBtn.hover({ force: true });
    await page.waitForTimeout(500);

    const benchmarkCard = page.locator('.hero__window').getByText('DeepSeek');
    const benchmarkVisible = await benchmarkCard.first().isVisible();
    console.log(`✅ Hover over DeepSeek V3 shows telemetry: ${benchmarkVisible}`);

    await heroWindow.screenshot({
      path: resolve(ARTIFACTS_DIR, 'laptop-hover-deepseek.png'),
    });
    console.log('📸 Screenshot saved: laptop-hover-deepseek.png');

    // 4. Clic en DeepSeek V3 para proyectar el haz azul y actualizar código en pantalla
    await deepSeekBtn.click({ force: true });
    await page.waitForTimeout(600);

    const deepSeekScreenCode = page.locator('.hero__window').getByText('deepSeekMoEEngine.ts');
    const hasMoEFile = await deepSeekScreenCode.first().isVisible();
    console.log(`✅ Laptop OLED screen updated to DeepSeek MoE diff: ${hasMoEFile}`);

    await heroWindow.screenshot({
      path: resolve(ARTIFACTS_DIR, 'laptop-active-deepseek.png'),
    });
    console.log('📸 Screenshot saved: laptop-active-deepseek.png');

    // 5. Clic en Gemini 3.8 Pro
    const geminiBtn = page.locator('button:has-text("Gemini 3.8 Pro")');
    await geminiBtn.click({ force: true });
    await page.waitForTimeout(600);

    const geminiScreenCode = page.locator('.hero__window').getByText('rarParserService.ts');
    const hasGeminiFile = await geminiScreenCode.first().isVisible();
    console.log(`✅ Laptop OLED screen updated to Gemini rarParser diff: ${hasGeminiFile}`);

    await heroWindow.screenshot({
      path: resolve(ARTIFACTS_DIR, 'laptop-active-gemini.png'),
    });
    console.log('📸 Screenshot saved: laptop-active-gemini.png');

    // 6. Clic en GPT Astra
    const gptBtn = page.locator('button:has-text("GPT Astra")');
    await gptBtn.click({ force: true });
    await page.waitForTimeout(600);

    const gptScreenCode = page.locator('.hero__window').getByText('github-workflow-standards');
    const hasGptFile = await gptScreenCode.first().isVisible();
    console.log(`✅ Laptop OLED screen updated to GPT Astra standards diff: ${hasGptFile}`);

    await heroWindow.screenshot({
      path: resolve(ARTIFACTS_DIR, 'laptop-active-gpt.png'),
    });
    console.log('📸 Screenshot saved: laptop-active-gpt.png');

    // 7. Pruebas responsivas: 1024px, 768px y 390px
    const viewports = [
      { name: '1024', width: 1024, height: 900 },
      { name: '768', width: 768, height: 950 },
      { name: '390', width: 390, height: 844 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.evaluate(() => {
        const el = document.querySelector('.hero__window');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
      });
      await page.waitForTimeout(500);

      await page.screenshot({
        path: resolve(ARTIFACTS_DIR, `laptop-responsive-${vp.name}.png`),
      });
      console.log(`📸 Screenshot saved: laptop-responsive-${vp.name}.png (${vp.width}x${vp.height})`);
    }

    console.log('🎉 Verification completed successfully!');
  } catch (err) {
    console.error('❌ Verification failed:', err);
    throw err;
  } finally {
    await browser.close();
  }
}

runVerification();
