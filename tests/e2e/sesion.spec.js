import { test, expect, entrarComo, salir, ruta, CLAVE } from './ayudas.js';

test('valida el formulario y rechaza credenciales incorrectas', async ({ page }) => {
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.locator('.error[data-for="lCorreo"]')).toHaveText('Escribe un correo válido.');
  await expect(page.locator('.error[data-for="lContrasena"]')).toHaveText('Escribe la contraseña.');
  await page.fill('#lCorreo', 'admin@campus.edu.co');
  await page.fill('#lContrasena', 'otra');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.locator('#loginError')).toHaveText('El correo o la contraseña no son correctos.');
  await page.fill('#lCorreo', 'mateo.sanchez@campus.edu.co');
  await page.fill('#lContrasena', CLAVE);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.locator('#loginError')).toContainText('desactivada');
});

test('cada rol llega a su página y ve su menú', async ({ page }) => {
  const casos = [
    ['estudiante', '#/mis-reportes', ['Mis reportes', 'Panel', 'Reportes', 'Zonas del campus', 'Nuevo reporte', 'Recomendaciones', 'Mi cuenta']],
    ['responsable', '#/asignados', ['Mis asignaciones', 'Panel', 'Reportes', 'Zonas del campus', 'Nuevo reporte', 'Recomendaciones', 'Mi cuenta']],
    ['administrador', '#/panel', ['Panel', 'Reportes', 'Zonas del campus', 'Nuevo reporte', 'Usuarios', 'Actividad', 'Recomendaciones', 'Mi cuenta']]
  ];
  for (const [rol, inicio, menu] of casos) {
    await entrarComo(page, rol);
    expect(ruta(page)).toBe(inicio);
    await expect(page.locator('#menu .nav-link')).toHaveText(menu);
    await salir(page);
  }
});

test('protege las rutas según la sesión y el rol', async ({ page }) => {
  await page.goto('/index.html#/zonas');
  await expect(page.locator('#login')).toBeVisible();
  await entrarComo(page, 'estudiante');
  expect(ruta(page)).toBe('#/zonas');
  await page.goto('/index.html#/usuarios');
  await expect(page.locator('#toast')).toHaveText('No tienes acceso a esa sección.');
  expect(ruta(page)).toBe('#/mis-reportes');
  await page.reload();
  await expect(page.locator('#usuarioNombre')).toHaveText('Valentina Martínez');
});

test('cambia la contraseña desde Mi cuenta', async ({ page }) => {
  await entrarComo(page, 'responsable');
  await page.locator('#usuarioNombre').click();
  await page.fill('#cActual', CLAVE);
  await page.fill('#cNueva', 'Clave2026x');
  await page.fill('#cConfirmar', 'Clave2026y');
  await page.getByRole('button', { name: 'Cambiar contraseña' }).click();
  await expect(page.locator('.error[data-for="cConfirmar"]')).toHaveText('Las contraseñas no coinciden.');
  await page.fill('#cConfirmar', 'Clave2026x');
  await page.getByRole('button', { name: 'Cambiar contraseña' }).click();
  await expect(page.locator('#toast')).toContainText('Tu contraseña se cambió');
  await salir(page);
  await page.fill('#lCorreo', 'diana.rojas@campus.edu.co');
  await page.fill('#lContrasena', 'Clave2026x');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL(/#\/asignados/);
});
