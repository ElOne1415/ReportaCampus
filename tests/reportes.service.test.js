import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearServicios } from '../src/services/index.js';
import { almacenMemoria } from '../src/services/almacenamiento.js';
import { CONFIG } from '../src/config/config.js';
import { entorno, DATOS_VALIDOS, ID } from './ayudas.js';

test('los datos simulados se generan una vez y se guardan', async () => {
  const e = entorno();
  const lista = await e.reportes.listar();
  assert.ok(lista.length > 700);
  assert.ok(Array.isArray(e.almacen.leer(CONFIG.CLAVES.reportes)));
  assert.ok(lista.every((x) => x.autorId && x.historial.length >= 1));
});

test('un estudiante crea un reporte y queda guardado al recargar', async () => {
  const e = entorno();
  const v = e.usuarios.obtenerSync(ID.valentina);
  const res = await e.reportes.crear(DATOS_VALIDOS, v);
  assert.equal(res.ok, true);
  assert.equal(res.reporte.estado, 'Nuevo');

  // Simula recargar la página: servicios nuevos sobre el mismo almacén
  const otra = crearServicios({ almacen: e.almacen, almacenSesion: almacenMemoria() });
  const r = await otra.reportes.obtener(res.reporte.id);
  assert.equal(r.titulo, DATOS_VALIDOS.titulo);
  assert.ok(r.creado instanceof Date, 'las fechas se recuperan como Date');
});

test('crear devuelve los errores de validación sin guardar nada', async () => {
  const e = entorno();
  const antes = (await e.reportes.listar()).length;
  const res = await e.reportes.crear({ ...DATOS_VALIDOS, titulo: 'x' }, e.usuarios.obtenerSync(ID.valentina));
  assert.equal(res.ok, false);
  assert.ok(res.errores.titulo);
  assert.equal((await e.reportes.listar()).length, antes);
});

test('el autor edita y elimina su reporte solo mientras está en Nuevo', async () => {
  const e = entorno();
  const v = e.usuarios.obtenerSync(ID.valentina);
  const s = e.usuarios.obtenerSync(ID.santiago);
  const admin = e.usuarios.obtenerSync(ID.admin);
  const { reporte } = await e.reportes.crear(DATOS_VALIDOS, v);

  assert.equal((await e.reportes.editar(reporte.id, { ...DATOS_VALIDOS, titulo: 'Otro título distinto' }, s)).ok, false, 'otro estudiante no puede');
  const ed = await e.reportes.editar(reporte.id, { ...DATOS_VALIDOS, titulo: 'Baño del tercer piso sin papel' }, v);
  assert.equal(ed.ok, true);
  assert.equal(ed.reporte.historial.at(-1).nota, 'El autor editó el reporte.');

  await e.reportes.asignar(reporte.id, ID.ana, admin);
  assert.equal((await e.reportes.editar(reporte.id, DATOS_VALIDOS, v)).ok, false, 'ya está en proceso');
  assert.equal((await e.reportes.eliminar(reporte.id, v)).ok, false);
  assert.equal((await e.reportes.eliminar(reporte.id, admin)).ok, true, 'el administrador sí puede');
  assert.equal(await e.reportes.obtener(reporte.id), null);
});

test('asignar pone el reporte en proceso y solo acepta responsables activos', async () => {
  const e = entorno();
  const admin = e.usuarios.obtenerSync(ID.admin);
  const { reporte } = await e.reportes.crear(DATOS_VALIDOS, e.usuarios.obtenerSync(ID.valentina));

  assert.equal((await e.reportes.asignar(reporte.id, ID.ana, e.usuarios.obtenerSync(ID.diana))).ok, false, 'un responsable no asigna');
  assert.equal((await e.reportes.asignar(reporte.id, ID.valentina, admin)).ok, false, 'un estudiante no puede ser responsable');
  const res = await e.reportes.asignar(reporte.id, ID.ana, admin);
  assert.equal(res.ok, true);
  assert.equal(res.reporte.estado, 'En proceso');
  assert.equal(res.reporte.responsableId, ID.ana);
  assert.match(res.reporte.historial.at(-1).nota, /Asignado a Servicios generales – Ana Torres/);
  const re = await e.reportes.asignar(reporte.id, ID.diana, admin);
  assert.match(re.reporte.historial.at(-1).nota, /^Reasignado/);
});

test('el responsable asignado resuelve con nota; otro responsable no puede', async () => {
  const e = entorno();
  const admin = e.usuarios.obtenerSync(ID.admin);
  const ana = e.usuarios.obtenerSync(ID.ana);
  const diana = e.usuarios.obtenerSync(ID.diana);
  const { reporte } = await e.reportes.crear(DATOS_VALIDOS, e.usuarios.obtenerSync(ID.valentina));
  await e.reportes.asignar(reporte.id, ID.ana, admin);

  assert.equal((await e.reportes.cambiarEstado(reporte.id, 'Resuelto', 'Se repuso el papel.', diana)).ok, false);
  assert.match((await e.reportes.cambiarEstado(reporte.id, 'Resuelto', 'ok', ana)).error, /Describe la solución/);
  assert.equal((await e.reportes.comentar(reporte.id, 'Voy en camino al baño.', ana)).ok, true);
  const res = await e.reportes.cambiarEstado(reporte.id, 'Resuelto', 'Se repuso el papel y el jabón.', ana);
  assert.equal(res.ok, true);
  assert.ok(res.reporte.resuelto instanceof Date);

  assert.match((await e.reportes.cambiarEstado(reporte.id, 'En proceso', 'Volvió a pasar hoy.', ana)).error, /Solo el administrador/);
  const reabierto = await e.reportes.cambiarEstado(reporte.id, 'En proceso', 'Volvió a pasar hoy.', admin);
  assert.equal(reabierto.reporte.estado, 'En proceso');
  assert.equal(reabierto.reporte.resuelto, null);
});

test('cambiarPrioridad es solo del administrador y queda en el historial', async () => {
  const e = entorno();
  const admin = e.usuarios.obtenerSync(ID.admin);
  const v = e.usuarios.obtenerSync(ID.valentina);
  const { reporte } = await e.reportes.crear(DATOS_VALIDOS, v);
  assert.equal((await e.reportes.cambiarPrioridad(reporte.id, 'Alta', v)).ok, false);
  assert.equal((await e.reportes.cambiarPrioridad(reporte.id, 'Altísima', admin)).ok, false);
  const res = await e.reportes.cambiarPrioridad(reporte.id, 'Alta', admin);
  assert.equal(res.reporte.prioridad, 'Alta');
  assert.equal(res.reporte.historial.at(-1).nota, 'Prioridad cambiada de Media a Alta.');
});

test('los reportes de la versión 0.2 se migran a la estudiante de demostración', async () => {
  const almacen = almacenMemoria();
  almacen.escribir(CONFIG.CLAVES.reportesV2, [{
    id: 'RC-0814', titulo: 'Reporte viejo', descripcion: 'Creado con la v0.2 del prototipo.', categoria: 'aseo', ubicacion: 'bloque-a',
    prioridad: 'Media', estado: 'Nuevo', creado: new Date().toISOString(), resuelto: null, responsable: null, autor: 'Estudiante', propio: true,
    historial: [{ estado: 'Nuevo', fecha: new Date().toISOString(), nota: 'x', por: 'Estudiante' }]
  }]);
  const s = crearServicios({ almacen, almacenSesion: almacenMemoria() });
  const migrado = (await s.reportes.listar({ texto: 'Reporte viejo' }))[0];
  assert.equal(migrado.autorId, ID.valentina);
  assert.equal(migrado.propio, undefined);
  assert.equal(almacen.leer(CONFIG.CLAVES.reportesV2), null, 'la clave antigua se borra');
});
