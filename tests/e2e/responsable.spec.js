import { test, expect, entrarComo } from './ayudas.js';

test('toma un reporte de su categoría y lo resuelve con nota', async ({ page }) => {
  await entrarComo(page, 'responsable');
  await expect(page.locator('#asigVencidos')).toContainText('más de 48 horas');
  await expect(page.locator('#tablaAsignados .overdue')).toHaveCount(1);

  await page.locator('#tablaDisponibles tbody tr[data-id]').first().click();
  await page.getByRole('button', { name: 'Tomar reporte' }).click();
  await expect(page.locator('#toast')).toContainText('quedó a tu cargo');
  await expect(page.locator('#dHistorial')).toContainText('Tomado por Planta física – Diana Rojas.');

  await page.getByRole('button', { name: 'Marcar como resuelto' }).click();
  await expect(page.locator('[data-error]')).toHaveText('Describe la solución (mínimo 10 caracteres).');
  await page.fill('[data-campo="nota"]', 'Se cambió la chapa y se probó la puerta.');
  await page.getByRole('button', { name: 'Marcar como resuelto' }).click();
  await expect(page.locator('#dCodigo')).toContainText('Resuelto');
  await expect(page.locator('#dAcciones')).toBeHidden();
});

test('no ve acciones en reportes de otros responsables', async ({ page }) => {
  await entrarComo(page, 'responsable');
  await page.getByRole('link', { name: 'Reportes' }).click();
  await page.fill('#fTexto', 'Wi-Fi en la sala 2');
  await expect(page.locator('#tablaReportes .table__count')).toHaveText('1 de 1 reportes');
  await page.locator('#tablaReportes tbody tr[data-id]').first().click();
  await expect(page.locator('#dTitulo')).toHaveText('Sin conexión Wi-Fi en la sala 2');
  await expect(page.locator('#dAcciones')).toBeHidden();
});
