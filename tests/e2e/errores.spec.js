import { test, expect, entrarComo } from './ayudas.js';

// Estas pruebas simulan fallos del servidor, así que solo aplican al proyecto con backend
test.beforeEach(({}, info) => test.skip(info.project.name !== 'servidor', 'Solo con servidor'));

test('sin conexión con la API la página lo explica y permite reintentar', async ({ page }) => {
  await entrarComo(page, 'administrador');
  await page.route('**/api/usuarios**', (r) => r.abort('failed'));
  await page.getByRole('link', { name: 'Usuarios' }).click();
  await expect(page.locator('#usuarios .page-error')).toContainText('No se pudo conectar con el servidor');
  await page.unroute('**/api/usuarios**');
  await page.getByRole('button', { name: 'Reintentar' }).click();
  await expect(page.locator('#usuarios .page-error')).toHaveCount(0);
  await expect(page.locator('#uConteo')).toHaveText('16 usuarios');
});

test('un error del servidor al enviar se muestra sin perder el formulario', async ({ page }) => {
  await entrarComo(page, 'estudiante');
  await page.route('**/api/reportes', (r) => (r.request().method() === 'POST'
    ? r.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ ok: false, error: 'Ocurrió un error en el servidor. Intenta de nuevo.' }) })
    : r.continue()));
  await page.goto('/index.html#/nuevo');
  await page.selectOption('#rCategoria', 'aseo');
  await page.selectOption('#rZona', 'biblioteca');
  await page.fill('#rTitulo', 'Baño del segundo piso sin agua');
  await page.fill('#rDesc', 'Los lavamanos del baño de mujeres no tienen agua desde la mañana.');
  await page.getByRole('button', { name: 'Enviar reporte' }).click();
  await expect(page.locator('#toast')).toHaveText('Ocurrió un error en el servidor. Intenta de nuevo.');
  await expect(page.locator('#rTitulo')).toHaveValue('Baño del segundo piso sin agua');
  await expect(page.getByRole('button', { name: 'Enviar reporte' })).toBeEnabled();
});

test('si el token deja de valer vuelve al inicio de sesión', async ({ page }) => {
  await entrarComo(page, 'administrador');
  await page.evaluate(() => {
    const s = JSON.parse(sessionStorage.getItem('reportacampus.sesion'));
    s.token = 'token.no.valido';
    sessionStorage.setItem('reportacampus.sesion', JSON.stringify(s));
  });
  await page.getByRole('link', { name: 'Usuarios' }).click();
  await expect(page.locator('#login')).toBeVisible();
  await expect(page.locator('#toast')).toHaveText('Tu sesión terminó. Inicia sesión de nuevo.');
});
