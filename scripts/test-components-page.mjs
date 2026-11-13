/**
 * Prueba de la página Componentes (E1): lista lateral, filtros, detalle con vista previa en vivo
 * y código real, estado «No asignado» y comportamiento de teclado de los componentes del kit.
 *
 * Usa `vite preview` sobre `dist/` (hay que compilar antes: `npm run build`) y SIMULA
 * `https://api.github.com` para no gastar la cuota anónima (60 peticiones/h por IP).
 *
 * Uso: node scripts/test-components-page.mjs
 */
import { preview } from 'vite';
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PORT = 5188;
const SHOTS_DIR = resolve(ROOT, 'shots', 'components');
const EXPECTED = [
  'Accordion', 'Alerts', 'Avatar', 'Badge', 'Banner', 'Bottom Navigation', 'Breadcrumb', 'Buttons', 'Button Group',
  'Card', 'Carousel', 'Chat Bubble', 'Clipboard', 'Datepicker', 'Device Mockups', 'Drawer', 'Dropdowns', 'Footer',
  'Forms', 'Gallery',
];

const failures = [];
function check(name, ok, detail = '') {
  console.log(`  ${ok ? 'ok ' : 'FALLA'}  ${name}${ok || !detail ? '' : ` — ${detail}`}`);
  if (!ok) failures.push(name);
}

async function fakeGithub(route) {
  const { pathname } = new URL(route.request().url());
  if (pathname.startsWith('/users/')) {
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ login: pathname.split('/')[2], name: null }) });
  }
  return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
}

async function openComponents(page, origin) {
  await page.goto(`${origin}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(400);
  await page.evaluate(() => document.querySelector('.nav__actions a.btn--primary')?.click());
  await page.waitForTimeout(400);
  await page.evaluate(() =>
    [...document.querySelectorAll('nav[aria-label="Módulos del estudio"] a')].find((a) => a.textContent.includes('Componentes'))?.click()
  );
  await page.locator('#components-heading').waitFor();
}

/** Abre la lista en móvil si está plegada y elige el componente por su nombre. */
async function pick(page, name) {
  const toggle = page.locator('button[aria-controls="component-list-panel"]');
  if (await toggle.isVisible()) {
    if ((await toggle.getAttribute('aria-expanded')) !== 'true') await toggle.click();
  }
  await page.locator('nav[aria-label="Componentes"] button', { hasText: new RegExp(`^${name}`) }).click();
  await page.locator('#component-name', { hasText: name }).waitFor();
}

const stage = (page) => page.locator('[data-preview-stage]');

async function main() {
  mkdirSync(SHOTS_DIR, { recursive: true });
  const server = await preview({ root: ROOT, preview: { port: PORT, host: '127.0.0.1', strictPort: true } });
  const origin = `http://127.0.0.1:${PORT}`;
  const browser = await chromium.launch({ headless: true });
  const errors = [];

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
    await context.route('https://api.github.com/**', fakeGithub);
    const page = await context.newPage();
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(String(e)));
    await openComponents(page, origin);

    console.log('\nLista y estado inicial');
    check('Componentes no pide ninguna skill abierta', (await page.locator('#no-skill-heading').count()) === 0);
    const rowNames = await page.locator('nav[aria-label="Componentes"] ul button > span:first-child').allInnerTexts();
    check('la lista trae los 20 componentes', rowNames.length === 20, `hay ${rowNames.length}`);
    check('están todos los nombres pedidos', EXPECTED.every((n) => rowNames.includes(n)), rowNames.join(', '));
    check('el primero queda elegido (aria-current)', (await page.locator('nav[aria-label="Componentes"] button[aria-current="true"]').count()) === 1);
    const unassignedRows = await page.locator('nav[aria-label="Componentes"] ul button', { hasText: 'No asignado' }).count();
    check('cada fila dice "No asignado"', unassignedRows === 20, `${unassignedRows} de 20`);
    check('el detalle dice "No asignado"', (await page.locator('#sec-assignment').locator('xpath=..').innerText()).includes('No asignado'));

    console.log('\nFiltros');
    await page.getByRole('button', { name: 'Con skill' }).click();
    check('"Con skill" no deja ninguno y lo explica', (await page.getByText('Ningún componente coincide con los filtros.').count()) === 1);
    await page.getByRole('button', { name: 'Con modelo' }).click();
    check('"Con modelo" no deja ninguno', (await page.locator('nav[aria-label="Componentes"] ul button').count()) === 0);
    await page.getByRole('button', { name: 'No asignados' }).click();
    check('"No asignados" deja los 20', (await page.locator('nav[aria-label="Componentes"] ul button').count()) === 20);
    await page.getByRole('button', { name: 'Todos', exact: true }).click();
    await page.getByLabel('Buscar componente').fill('accordion');
    check('el buscador filtra por nombre', (await page.locator('nav[aria-label="Componentes"] ul button').count()) === 1);
    await page.getByLabel('Buscar componente').fill('');
    await page.getByLabel('Filtrar por categoría').selectOption('Navegación');
    const navRows = await page.locator('nav[aria-label="Componentes"] ul button > span:first-child').allInnerTexts();
    check('el filtro de categoría deja solo Navegación', navRows.sort().join() === ['Bottom Navigation', 'Breadcrumb', 'Dropdowns', 'Footer'].sort().join(), navRows.join(', '));
    await page.getByLabel('Filtrar por categoría').selectOption('todas');

    console.log('\nTeclado en la lista');
    const order = await page.locator('nav[aria-label="Componentes"] ul button > span:first-child').allInnerTexts();
    await page.locator('nav[aria-label="Componentes"] ul button').first().focus();
    await page.keyboard.press('Home');
    check('Inicio elige el primero de la lista', (await page.locator('#component-name').innerText()) === order[0], order[0]);
    await page.keyboard.press('ArrowDown');
    check('flecha abajo elige el siguiente', (await page.locator('#component-name').innerText()) === order[1], order[1]);
    await page.keyboard.press('ArrowUp');
    check('flecha arriba vuelve al anterior', (await page.locator('#component-name').innerText()) === order[0]);
    await page.keyboard.press('End');
    check('Fin elige el último', (await page.locator('#component-name').innerText()) === order[order.length - 1], order[order.length - 1]);

    console.log('\nCada componente: vista previa en vivo + código real');
    for (const name of EXPECTED) {
      await pick(page, name);
      await page.locator('section[aria-labelledby="sec-code"] pre code').waitFor();
      const rendered = await stage(page).evaluate((el) => el.innerText.trim().length > 0 || el.querySelector('svg, img, button') !== null);
      const code = await page.locator('section[aria-labelledby="sec-code"] pre code').innerText();
      check(`${name}: se ve en vivo y muestra su código`, rendered && code.includes('export function Demo'));
    }

    console.log('\nCopiar código');
    await pick(page, 'Accordion');
    await page.getByRole('button', { name: 'Copiar código' }).first().click();
    const copied = await page.getByRole('button', { name: 'Copiado' }).first().waitFor({ timeout: 1500 }).then(() => true, () => false);
    check('"Copiar código" confirma con "Copiado"', copied);
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    check('el portapapeles tiene el código del archivo', clip.includes('export function Accordion'));

    console.log('\nComportamiento de los componentes');
    // Accordion
    await pick(page, 'Accordion');
    const acc = stage(page).getByRole('button', { name: '¿Qué es un hook?' }).first();
    await acc.click();
    check('Accordion: el clic abre el panel (aria-expanded)', (await acc.getAttribute('aria-expanded')) === 'true');
    await acc.focus();
    await page.keyboard.press('ArrowDown');
    check('Accordion: flecha abajo mueve el foco a la cabecera siguiente', (await page.evaluate(() => document.activeElement?.textContent)).includes('worktree'));

    // Alerts
    await pick(page, 'Alerts');
    check('Alerts: error usa role=alert y éxito role=status', (await stage(page).locator('[role="alert"]').count()) === 2 && (await stage(page).locator('[role="status"]').count()) >= 2);
    await stage(page).getByRole('button', { name: /Cerrar aviso: Skill subida/ }).click();
    check('Alerts: cerrar quita el aviso', (await stage(page).getByText('Skill subida').count()) === 0);

    // Dropdowns
    await pick(page, 'Dropdowns');
    const menuBtn = stage(page).getByRole('button', { name: 'Acciones de la clase' });
    await menuBtn.focus();
    await page.keyboard.press('ArrowDown');
    check('Dropdowns: flecha abajo abre el menú y enfoca la primera opción', (await page.evaluate(() => document.activeElement?.textContent)) === 'Editar');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    check('Dropdowns: salta la opción desactivada', (await page.evaluate(() => document.activeElement?.textContent)) === 'Eliminar');
    await page.keyboard.press('Escape');
    check('Dropdowns: Escape cierra y devuelve el foco al botón', (await stage(page).getByRole('menu').count()) === 0 && (await page.evaluate(() => document.activeElement?.textContent)).includes('Acciones'));
    await menuBtn.click();
    await stage(page).getByRole('menuitem', { name: 'Duplicar' }).click();
    check('Dropdowns: elegir una opción la anuncia', (await stage(page).getByText('Elegiste: Duplicar').count()) === 1);

    // Drawer
    await pick(page, 'Drawer');
    const openDrawer = stage(page).getByRole('button', { name: /Abrir filtros/ });
    await openDrawer.click();
    check('Drawer: abre un dialog modal con foco dentro', (await stage(page).getByRole('dialog').count()) === 1 && (await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))));
    for (let i = 0; i < 8; i++) await page.keyboard.press('Tab');
    check('Drawer: Tab no saca el foco del panel', await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]')));
    await page.keyboard.press('Escape');
    check('Drawer: Escape cierra y el foco vuelve al botón que lo abrió', (await stage(page).getByRole('dialog').count()) === 0 && (await page.evaluate(() => document.activeElement?.textContent)).includes('Abrir filtros'));

    // Datepicker
    await pick(page, 'Datepicker');
    await stage(page).getByRole('button', { name: 'Elegir fecha' }).first().click();
    check('Datepicker: abre un calendario (grid) con el foco en un día', (await stage(page).getByRole('grid').count()) === 1 && (await page.evaluate(() => document.activeElement?.closest('[role="grid"]') !== null)));
    const before = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
    await page.keyboard.press('ArrowRight');
    const after = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
    check('Datepicker: flecha derecha avanza un día', before !== after && !!after, `${before} → ${after}`);
    await page.keyboard.press('Enter');
    check('Datepicker: Enter elige el día y cierra', (await stage(page).getByRole('grid').count()) === 0 && (await stage(page).locator('input').first().inputValue()) !== '');
    const input = stage(page).locator('input').first();
    await input.fill('31/02/2025');
    await input.blur();
    check('Datepicker: una fecha imposible muestra un error accesible', (await stage(page).getByRole('alert').count()) === 1);

    // Carousel
    await pick(page, 'Carousel');
    await stage(page).getByRole('button', { name: 'Diapositiva siguiente' }).click();
    check('Carousel: siguiente marca el segundo punto', (await stage(page).getByRole('button', { name: 'Ir a la diapositiva 2' }).getAttribute('aria-current')) === 'true');

    // Gallery
    await pick(page, 'Gallery');
    await stage(page).getByRole('button', { name: /Burbujas de luz/ }).click();
    check('Gallery: abre el visor', (await stage(page).getByRole('dialog').count()) === 1);
    await page.keyboard.press('ArrowRight');
    check('Gallery: flecha derecha cambia de imagen', (await stage(page).getByText(/3\/6/).count()) === 1);
    await page.keyboard.press('Escape');
    check('Gallery: Escape cierra y devuelve el foco', (await stage(page).getByRole('dialog').count()) === 0 && (await page.evaluate(() => document.activeElement?.tagName)) === 'BUTTON');

    // Forms
    await pick(page, 'Forms');
    await stage(page).getByRole('button', { name: 'Enviar clase' }).click();
    check('Forms: enviar vacío muestra un resumen role=alert', (await stage(page).getByRole('alert').count()) === 1);
    const focusedTitle = await page.waitForFunction(() => document.activeElement?.getAttribute('name') === 'title', null, { timeout: 1500 }).then(() => true, () => false);
    check('Forms: el foco va al primer campo con error', focusedTitle);
    check('Forms: el campo con error lleva aria-invalid y aria-describedby', (await stage(page).locator('input[name="title"]').getAttribute('aria-invalid')) === 'true' && !!(await stage(page).locator('input[name="title"]').getAttribute('aria-describedby')));

    // Chat
    await pick(page, 'Chat Bubble');
    await stage(page).getByLabel('Escribe un mensaje').fill('Hola equipo');
    await stage(page).getByRole('button', { name: 'Enviar mensaje' }).click();
    check('Chat Bubble: el mensaje enviado aparece en el registro', (await stage(page).getByRole('log').getByText('Hola equipo').count()) === 1);

    // Clipboard
    await pick(page, 'Clipboard');
    await stage(page).getByRole('button', { name: 'Copiar', exact: true }).first().click();
    const announced = await stage(page).getByText('Copiado al portapapeles').waitFor({ timeout: 1500 }).then(() => true, () => false);
    check('Clipboard: copiar anuncia el resultado', announced);

    // Bottom navigation + breadcrumb
    await pick(page, 'Bottom Navigation');
    await stage(page).getByRole('button', { name: /Clases/ }).click();
    check('Bottom Navigation: la sección activa lleva aria-current=page', (await stage(page).getByRole('button', { name: /Clases/ }).getAttribute('aria-current')) === 'page');
    await pick(page, 'Breadcrumb');
    await stage(page).getByRole('button', { name: /niveles ocultos/ }).click();
    check('Breadcrumb: el botón «…» despliega los niveles ocultos', (await stage(page).getByText('SuarezCaceres').count()) === 1);

    // Reiniciar
    await pick(page, 'Alerts');
    await page.getByRole('button', { name: 'Reiniciar' }).click();
    check('Reiniciar restaura la vista previa', (await stage(page).getByText('Skill subida').count()) === 1);

    console.log('\nCapturas y responsive');
    for (const [name, width, height] of [['1440', 1440, 900], ['1024', 1024, 768], ['768', 768, 1024], ['390', 390, 844]]) {
      await page.setViewportSize({ width, height });
      await openComponents(page, origin);
      await pick(page, 'Accordion');
      await page.waitForTimeout(300);
      await page.screenshot({ path: resolve(SHOTS_DIR, `componentes-${name}.png`), fullPage: true });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      check(`sin desborde horizontal a ${name} px`, overflow <= 0, `${overflow}px`);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await openComponents(page, origin);
    const toggle = page.locator('button[aria-controls="component-list-panel"]');
    check('en móvil la lista está plegada tras un botón', (await toggle.isVisible()) && (await toggle.getAttribute('aria-expanded')) === 'false');
    await toggle.click();
    check('en móvil el botón despliega la lista', (await page.locator('nav[aria-label="Componentes"]').isVisible()));

    check('sin errores de consola', errors.length === 0, errors.slice(0, 3).join(' | '));
  } finally {
    await browser.close();
    await server.close();
  }

  if (failures.length > 0) {
    console.error(`\n${failures.length} comprobación(es) fallaron:\n - ${failures.join('\n - ')}`);
    process.exit(1);
  }
  console.log('\nPágina Componentes: todo en verde.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
