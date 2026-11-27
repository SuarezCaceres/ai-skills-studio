/**
 * Entra en los módulos de la app desde la portada sin sesión.
 *
 * Desde `feat/hero-forge`, el botón principal de la barra sin sesión es «Entrar con GitHub» (abre el
 * modal de acceso), así que las suites entran por el enlace «Skills del equipo» del pie, que lleva a
 * `boveda` igual que antes lo hacía ese botón.
 */
export async function enterApp(page) {
  await page.evaluate(() => {
    const link = [...document.querySelectorAll('footer a')].find((a) => a.textContent.trim() === 'Skills del equipo');
    if (!link) throw new Error('No se encontró el enlace «Skills del equipo» del pie de la portada.');
    link.click();
  });
}

/**
 * Pulsa «Entrar con GitHub» dentro del modal de acceso. Desde `feat/hero-forge` el acceso es un modal
 * que se abre encima de la vista actual, y esa vista puede tener su propio botón con el mismo nombre.
 */
export async function clickAuthSignIn(page) {
  await page.locator('[role="dialog"][aria-labelledby="auth-modal-heading"]').getByRole('button', { name: 'Entrar con GitHub' }).click();
}
