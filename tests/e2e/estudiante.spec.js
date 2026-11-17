import { test, expect, entrarComo } from './ayudas.js';

test('crea, edita y elimina un reporte propio', async ({ page }) => {
  await entrarComo(page, 'estudiante');
  await page.getByRole('link', { name: 'Nuevo reporte' }).first().click();
  await page.getByRole('button', { name: 'Enviar reporte' }).click();
  await expect(page.locator('#form .error.show')).toHaveCount(4);

  await page.selectOption('#rCategoria', 'aseo');
  await page.selectOption('#rZona', 'biblioteca');
  await page.fill('#rTitulo', 'Baño del segundo piso sin agua');
  await page.fill('#rDesc', 'Los lavamanos del baño de mujeres no tienen agua desde la mañana.');
  await page.getByRole('button', { name: 'Enviar reporte' }).click();
  await expect(page.locator('#toast')).toContainText('Tu código es RC-0820');
  await expect(page).toHaveURL(/#\/mis-reportes/);

  await page.locator('#tablaMis tr.is-new').click();
  await page.getByRole('button', { name: 'Editar' }).click();
  await page.fill('#rTitulo', 'Baño del segundo piso sin agua ni jabón');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.locator('#toast')).toHaveText('Se guardaron los cambios de RC-0820.');

  await page.locator('#tablaMis tr.is-new').click();
  await expect(page.locator('#dHistorial')).toContainText('El autor editó el reporte.');
  await page.getByRole('button', { name: 'Eliminar reporte' }).click();
  await page.locator('#cSi').click();
  await expect(page.locator('#toast')).toHaveText('Se eliminó el reporte RC-0820.');
});

test('califica la solución de un reporte resuelto', async ({ page }) => {
  await entrarComo(page, 'estudiante');
  await expect(page.locator('#misPorCalificar')).toContainText('sin calificar');
  await page.locator('#misResumen [data-estado="Resuelto"]').click();
  const filas = page.locator('#tablaMis tbody tr');
  for (let i = 0; i < await filas.count(); i++) {
    await filas.nth(i).click();
    if (await page.locator('[data-accion="calificar"]').count()) break;
    await page.locator('#dCerrar').click();
  }
  await page.locator('[data-accion="calificar"]').click();
  await expect(page.locator('[data-error-cal]')).toHaveText('Elige de 1 a 5 estrellas.');
  await page.locator('label[for="estrella5"]').click();
  await page.fill('[data-campo="comentario"]', 'Muy rápido');
  await page.locator('[data-accion="calificar"]').click();
  await expect(page.locator('#dDatos')).toContainText('5 de 5 · «Muy rápido»');
  await expect(page.locator('[data-accion="calificar"]')).toHaveCount(0);
});
