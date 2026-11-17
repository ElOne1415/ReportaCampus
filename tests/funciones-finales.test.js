import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PERMISOS, puedeTomar, puedeCalificar } from '../src/models/roles.js';
import { validarCalificacion, superaMeta } from '../src/models/reporte.js';
import { validarContrasenaNueva } from '../src/models/usuario.js';
import { entorno, DATOS_VALIDOS, ID } from './ayudas.js';

test('la matriz de permisos es la misma en el frontend y en el backend', () => {
  const py = readFileSync(new URL('../backend/app/permisos.py', import.meta.url), 'utf8');
  const backend = {};
  for (const [, permiso, roles] of py.matchAll(/'([\w.]+)':\s*\{([^}]*)\}/g)) {
    backend[permiso] = roles.split(',').map((r) => ({ E: 'estudiante', R: 'responsable', A: 'administrador' })[r.trim()]).sort();
  }
  const frontend = Object.fromEntries(Object.entries(PERMISOS).map(([p, r]) => [p, [...r].sort()]));
  assert.deepEqual(frontend, backend);
});

test('validarCalificacion y superaMeta', () => {
  assert.equal(validarCalificacion(5, '').ok, true);
  assert.ok(validarCalificacion(0).errores.puntaje);
  assert.ok(validarCalificacion(3.5).errores.puntaje);
  assert.ok(validarCalificacion(4, 'x'.repeat(301)).errores.comentario);
  const ahora = new Date(2026, 10, 17, 12);
  assert.equal(superaMeta({ estado: 'En proceso', creado: new Date(2026, 10, 15, 11) }, 48, ahora), true);
  assert.equal(superaMeta({ estado: 'Resuelto', creado: new Date(2026, 10, 1) }, 48, ahora), false);
});

test('validarContrasenaNueva usa las mismas reglas del backend', () => {
  assert.equal(validarContrasenaNueva('corta1').errores.nueva, 'Usa al menos 8 caracteres.');
  assert.equal(validarContrasenaNueva('sololetras').errores.nueva, 'Combina letras y números.');
  assert.equal(validarContrasenaNueva('Clave2026', 'Clave2027').errores.confirmacion, 'Las contraseñas no coinciden.');
  assert.match(validarContrasenaNueva('Clave2026', 'Clave2026', 'Clave2026').errores.nueva, /distinta/);
  assert.equal(validarContrasenaNueva('Clave2026', 'Clave2026', 'otra').ok, true);
});

test('el responsable toma reportes nuevos solo de sus categorías', async () => {
  const e = entorno();
  const { reporte } = await e.reportes.crear(DATOS_VALIDOS, e.usuarios.obtenerSync(ID.valentina)); // aseo
  const diana = e.usuarios.obtenerSync(ID.diana); // infraestructura
  const ana = e.usuarios.obtenerSync(ID.ana); // aseo
  assert.equal(puedeTomar(diana, reporte), false);
  assert.equal((await e.reportes.tomar(reporte.id, diana)).ok, false);
  const r = await e.reportes.tomar(reporte.id, ana);
  assert.equal(r.reporte.estado, 'En proceso');
  assert.equal(r.reporte.responsableId, ID.ana);
  assert.equal((await e.reportes.tomar(reporte.id, ana)).ok, false, 'ya tiene responsable');
});

test('el autor califica una vez y la calificación se borra al reabrir', async () => {
  const e = entorno();
  const v = e.usuarios.obtenerSync(ID.valentina);
  const admin = e.usuarios.obtenerSync(ID.admin);
  const { reporte } = await e.reportes.crear(DATOS_VALIDOS, v);
  await e.reportes.asignar(reporte.id, ID.ana, admin);
  assert.equal((await e.reportes.calificar(reporte.id, 5, '', v)).ok, false, 'todavía no está resuelto');
  await e.reportes.cambiarEstado(reporte.id, 'Resuelto', 'Se repuso el papel y el jabón.', e.usuarios.obtenerSync(ID.ana));
  assert.equal(puedeCalificar(e.usuarios.obtenerSync(ID.santiago), reporte), false);
  assert.ok((await e.reportes.calificar(reporte.id, 9, '', v)).errores.puntaje);
  assert.deepEqual((await e.reportes.calificar(reporte.id, 4, ' Rápido ', v)).reporte.calificacion, { puntaje: 4, comentario: 'Rápido' });
  assert.equal((await e.reportes.calificar(reporte.id, 5, '', v)).ok, false, 'solo una vez');
  await e.reportes.cambiarEstado(reporte.id, 'En proceso', 'Volvió a pasar hoy.', admin);
  assert.equal((await e.reportes.obtener(reporte.id)).calificacion, null);
});

test('cambio de contraseña en modo local', async () => {
  const e = entorno();
  await e.auth.iniciarSesion('santiago.ramirez@campus.edu.co', 'campus2026');
  assert.ok((await e.auth.cambiarContrasena('mala', 'Clave2026')).errores.actual);
  assert.equal((await e.auth.cambiarContrasena('campus2026', 'Clave2026')).ok, true);
  e.auth.cerrarSesion();
  assert.equal((await e.auth.iniciarSesion('santiago.ramirez@campus.edu.co', 'campus2026')).ok, false);
  assert.equal((await e.auth.iniciarSesion('santiago.ramirez@campus.edu.co', 'Clave2026')).ok, true);
});

test('la auditoría local registra solo los cambios exitosos', async () => {
  const e = entorno();
  const v = e.usuarios.obtenerSync(ID.valentina);
  const admin = e.usuarios.obtenerSync(ID.admin);
  const { reporte } = await e.reportes.crear(DATOS_VALIDOS, v);
  await e.reportes.crear({ ...DATOS_VALIDOS, titulo: 'x' }, v); // inválido: no se registra
  await e.reportes.asignar(reporte.id, ID.ana, admin);
  await e.reportes.asignar(reporte.id, ID.ana, admin); // sin cambios: no se registra
  await e.usuarios.cambiarActivo(ID.santiago, false, admin);
  const r = await e.auditoria.listar(10);
  assert.deepEqual(r.map((x) => x.accion + ':' + x.entidadId), ['desactivar:u-008', 'asignar:' + reporte.id, 'crear:' + reporte.id]);
  assert.equal(r[2].usuario, 'Valentina Martínez');
  await assert.rejects(() => e.auditoria.listar(10, v), /permiso/);
});
