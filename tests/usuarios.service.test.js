import { test } from 'node:test';
import assert from 'node:assert/strict';
import { entorno, ID } from './ayudas.js';

const NUEVO = { nombre: 'Luis Mora', correo: 'luis.mora@campus.edu.co', rol: 'responsable', area: 'Jardinería', categorias: ['servicios'] };

test('solo el administrador crea usuarios', async () => {
  const e = entorno();
  assert.equal((await e.usuarios.crear(NUEVO, e.usuarios.obtenerSync(ID.valentina))).ok, false);
  const res = await e.usuarios.crear(NUEVO, e.usuarios.obtenerSync(ID.admin));
  assert.equal(res.ok, true);
  assert.equal(res.usuario.id, 'u-017');
  assert.equal((await e.usuarios.crear(NUEVO, e.usuarios.obtenerSync(ID.admin))).errores.correo, 'Ya existe un usuario con ese correo.');
});

test('no se elimina ni desactiva a un responsable con reportes abiertos', async () => {
  const e = entorno();
  const admin = e.usuarios.obtenerSync(ID.admin);
  assert.ok(e.reportes.tieneAbiertosSync(ID.diana), 'Diana tiene reportes en proceso en los datos simulados');
  assert.match((await e.usuarios.eliminar(ID.diana, admin)).error, /reportes sin resolver/);
  assert.match((await e.usuarios.cambiarActivo(ID.diana, false, admin)).error, /reportes sin resolver/);
  assert.match((await e.usuarios.editar(ID.diana, { ...e.usuarios.obtenerSync(ID.diana), rol: 'estudiante' }, admin)).error, /reportes sin resolver/);
});

test('el administrador no se elimina ni se quita el rol si es el último', async () => {
  const e = entorno();
  const admin = e.usuarios.obtenerSync(ID.admin);
  assert.match((await e.usuarios.eliminar(ID.admin, admin)).error, /propia cuenta/);
  assert.match((await e.usuarios.cambiarActivo(ID.admin, false, admin)).error, /propia cuenta/);
  assert.match((await e.usuarios.editar(ID.admin, { ...admin, rol: 'estudiante' }, admin)).error, /al menos un administrador/);
});

test('desactivar y eliminar un estudiante', async () => {
  const e = entorno();
  const admin = e.usuarios.obtenerSync(ID.admin);
  const des = await e.usuarios.cambiarActivo(ID.santiago, false, admin);
  assert.equal(des.usuario.activo, false);
  assert.equal((await e.usuarios.eliminar(ID.santiago, admin)).ok, true);
  assert.equal(await e.usuarios.obtener(ID.santiago), null);
});

test('responsables() pone primero a quien atiende la categoría', async () => {
  const e = entorno();
  const lista = await e.usuarios.responsables('tecnologia');
  assert.equal(lista[0].nombre, 'Laura Gómez');
  assert.ok(lista.every((u) => u.rol === 'responsable' && u.activo));
});

test('restablecer vuelve a los usuarios iniciales', async () => {
  const e = entorno();
  const admin = e.usuarios.obtenerSync(ID.admin);
  await e.usuarios.crear(NUEVO, admin);
  await e.usuarios.restablecer(admin);
  assert.equal((await e.usuarios.listar()).length, 16);
});
