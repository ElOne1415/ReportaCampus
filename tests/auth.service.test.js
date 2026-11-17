import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../src/config/config.js';
import { entorno, ID } from './ayudas.js';

test('inicia sesión con la contraseña de demostración (correo sin importar mayúsculas)', async () => {
  const e = entorno();
  const res = await e.auth.iniciarSesion(' Admin@Campus.edu.co ', CONFIG.CONTRASENA_DEMO);
  assert.equal(res.ok, true);
  assert.equal(e.auth.usuarioActual().id, ID.admin);
});

test('rechaza datos vacíos, contraseña incorrecta y cuentas inactivas', async () => {
  const e = entorno();
  const vacio = await e.auth.iniciarSesion('', '');
  assert.deepEqual(Object.keys(vacio.errores).sort(), ['contrasena', 'correo']);
  assert.equal((await e.auth.iniciarSesion('admin@campus.edu.co', 'otra')).error, 'El correo o la contraseña no son correctos.');
  assert.equal((await e.auth.iniciarSesion('nadie@campus.edu.co', CONFIG.CONTRASENA_DEMO)).error, 'El correo o la contraseña no son correctos.', 'no revela si el correo existe');
  assert.match((await e.auth.iniciarSesion('mateo.sanchez@campus.edu.co', CONFIG.CONTRASENA_DEMO)).error, /desactivada/);
  assert.equal(e.auth.usuarioActual(), null);
});

test('si la cuenta se desactiva, la sesión se cierra', async () => {
  const e = entorno();
  await e.auth.iniciarSesion('santiago.ramirez@campus.edu.co', CONFIG.CONTRASENA_DEMO);
  assert.equal(e.auth.usuarioActual().id, ID.santiago);
  await e.usuarios.cambiarActivo(ID.santiago, false, e.usuarios.obtenerSync(ID.admin));
  assert.equal(e.auth.usuarioActual(), null);
  assert.equal(e.almacenSesion.leer(CONFIG.CLAVES.sesion), null);
});

test('cerrarSesion borra la sesión', async () => {
  const e = entorno();
  await e.auth.iniciarSesion('admin@campus.edu.co', CONFIG.CONTRASENA_DEMO);
  e.auth.cerrarSesion();
  assert.equal(e.auth.usuarioActual(), null);
});
