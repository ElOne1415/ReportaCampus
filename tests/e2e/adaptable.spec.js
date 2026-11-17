import { test, expect, entrarComo } from './ayudas.js';

const ANCHOS = [1366, 820, 390, 360];
const PAGINAS = { estudiante: ['mis-reportes', 'nuevo', 'cuenta'], responsable: ['asignados', 'reportes'], administrador: ['panel', 'reportes', 'usuarios', 'actividad', 'zonas'] };

for (const ancho of ANCHOS) {
  test(`sin desplazamiento horizontal a ${ancho} px`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: ancho, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(ancho);
    for (const [rol, paginas] of Object.entries(PAGINAS)) {
      await entrarComo(page, rol);
      for (const p of paginas) {
        await page.goto('/index.html#/' + p);
        await expect(page.locator('[data-pagina="' + p + '"]')).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth), p + ' a ' + ancho + ' px').toBeLessThanOrEqual(ancho);
      }
      await page.getByRole('button', { name: /Cerrar sesión|Salir/ }).click();
    }
  });
}

test('el menú se abre y se cierra en celular', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await entrarComo(page, 'estudiante');
  await page.locator('#menuBtn').click();
  await expect(page.locator('#sidebar')).toHaveClass(/open/);
  await page.locator('#sidebar').getByRole('link', { name: 'Zonas del campus' }).click();
  await expect(page.locator('#sidebar')).not.toHaveClass(/open/);
  await expect(page).toHaveURL(/#\/zonas/);
});
