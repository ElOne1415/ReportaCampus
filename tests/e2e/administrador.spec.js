import { test, expect, entrarComo } from './ayudas.js';

test('asigna un reporte nuevo y cambia su prioridad', async ({ page }) => {
  await entrarComo(page, 'administrador');
  await page.locator('#sAbiertosNote a').click();
  await expect(page.locator('#fResponsable')).toHaveValue('ninguno');
  await page.locator('#tablaReportes tbody tr[data-id]').first().click();
  await page.getByRole('button', { name: 'Asignar' }).click();
  await expect(page.locator('[data-error-admin]')).toHaveText('Elige un responsable.');
  await page.selectOption('[data-campo="responsable"]', { index: 1 });
  await page.getByRole('button', { name: 'Asignar' }).click();
  await expect(page.locator('#toast')).toContainText('quedó a cargo de');
  await expect(page.locator('#dCodigo')).toContainText('En proceso');
  await page.selectOption('[data-campo="prioridad"]', 'Alta');
  await page.getByRole('button', { name: 'Cambiar prioridad' }).click();
  await expect(page.locator('#dHistorial')).toContainText('Prioridad cambiada de');
  await page.locator('#dCerrar').click();
  await page.getByRole('link', { name: 'Actividad' }).click();
  await expect(page.locator('#aTabla tr').first()).toContainText('Cambió la prioridad');
});

test('gestiona usuarios con validación y reglas de cuentas', async ({ page }) => {
  await entrarComo(page, 'administrador');
  await page.getByRole('link', { name: 'Usuarios' }).click();
  await page.getByRole('button', { name: 'Nuevo usuario' }).click();
  await page.selectOption('#uRolForm', 'responsable');
  await page.fill('#uCorreo', 'diana.rojas@campus.edu.co');
  await page.getByRole('button', { name: 'Crear usuario' }).click();
  await expect(page.locator('.error[data-for="uCorreo"]')).toHaveText('Ya existe un usuario con ese correo.');
  await expect(page.locator('.error[data-for="uArea"]')).toBeVisible();

  await page.fill('#uNombre', 'Pedro Gil');
  await page.fill('#uCorreo', 'pedro.gil@campus.edu.co');
  await page.fill('#uArea', 'Jardinería');
  await page.locator('#uCategorias input[value="servicios"]').check();
  await page.getByRole('button', { name: 'Crear usuario' }).click();
  await expect(page.locator('#toast')).toHaveText('Se creó la cuenta de Pedro Gil.');

  await page.fill('#uTexto', 'diana');
  await expect(page.locator('#uConteo')).toHaveText('1 usuario de 17');
  await page.locator('#uTabla [data-accion="eliminar"]').click();
  await page.locator('#cSi').click();
  await expect(page.locator('#toast')).toContainText('reportes sin resolver');
});
