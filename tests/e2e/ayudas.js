/* Utilidades de las pruebas de extremo a extremo */
import { test as base, expect } from '@playwright/test';

export const CLAVE = 'campus2026';
const CUENTA = { estudiante: 1, responsable: 2, administrador: 3 };

/** Antes de cada prueba: datos de demostración limpios y errores de la página vigilados. */
export const test = base.extend({
  errores: [async ({ page }, use) => {
    const lista = [];
    page.on('pageerror', (e) => lista.push(e.message));
    await use(lista);
    expect(lista, 'errores de JavaScript en la página').toEqual([]);
  }, { auto: true }],

  preparado: [async ({ page, request, baseURL }, use, info) => {
    if (info.project.name === 'servidor') {
      const login = await request.post(baseURL + '/api/auth/login', { data: { correo: 'admin@campus.edu.co', contrasena: CLAVE } });
      const { token } = await login.json();
      const r = await request.post(baseURL + '/api/datos/restablecer', { headers: { Authorization: 'Bearer ' + token } });
      expect(r.ok()).toBeTruthy();
    }
    await page.goto('/index.html');
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await page.reload();
    await use(true);
  }, { auto: true }]
});

export { expect };

/** Entra con la cuenta de demostración del rol indicado. */
export async function entrarComo(page, rol) {
  await page.locator('#cuentasDemo .account').nth(CUENTA[rol] - 1).click();
  await expect(page.locator('#usuarioActual')).toBeVisible();
}

export async function salir(page) {
  await page.getByRole('button', { name: /Cerrar sesión|Salir/ }).click();
  await expect(page.locator('#login')).toBeVisible();
}

export const ruta = (page) => new URL(page.url()).hash;
