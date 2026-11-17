import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validarReporte, siguienteCodigo, filtrarReportes, validarCambioEstado, crearReporte } from '../src/models/reporte.js';
import { DATOS_VALIDOS } from './ayudas.js';

test('validarReporte acepta datos completos', () => {
  assert.deepEqual(validarReporte(DATOS_VALIDOS), { ok: true, errores: {} });
});

test('validarReporte marca cada campo obligatorio', () => {
  const r = validarReporte({ categoria: 'x', ubicacion: '', titulo: 'corto', descripcion: 'poco', prioridad: 'Urgentísima' });
  assert.equal(r.ok, false);
  assert.deepEqual(Object.keys(r.errores).sort(), ['categoria', 'descripcion', 'prioridad', 'titulo', 'ubicacion']);
});

test('validarReporte ignora los espacios al medir el texto', () => {
  const r = validarReporte({ ...DATOS_VALIDOS, titulo: '   abc    ' });
  assert.equal(r.errores.titulo, 'Escribe al menos 8 caracteres.');
});

test('validarReporte limita el largo del título y la descripción', () => {
  const r = validarReporte({ ...DATOS_VALIDOS, titulo: 'a'.repeat(81), descripcion: 'b'.repeat(501) });
  assert.match(r.errores.titulo, /Máximo 80/);
  assert.match(r.errores.descripcion, /Máximo 500/);
});

test('siguienteCodigo continúa el consecutivo', () => {
  assert.equal(siguienteCodigo([]), 'RC-0001');
  assert.equal(siguienteCodigo([{ id: 'RC-0009' }, { id: 'RC-0120' }, { id: 'RC-0002' }]), 'RC-0121');
});

test('crearReporte deja el reporte en Nuevo con autor e historial', () => {
  const r = crearReporte({ ...DATOS_VALIDOS, titulo: '  Título con espacios  ' }, { id: 'u-007', nombre: 'Valentina' }, 'RC-0001');
  assert.equal(r.estado, 'Nuevo');
  assert.equal(r.titulo, 'Título con espacios');
  assert.equal(r.autorId, 'u-007');
  assert.equal(r.responsableId, null);
  assert.equal(r.historial.length, 1);
});

test('filtrarReportes combina texto, estado, zona, autor y responsable', () => {
  const lista = [
    { id: 'RC-0001', titulo: 'Gotera', estado: 'Nuevo', categoria: 'infraestructura', ubicacion: 'bloque-a', prioridad: 'Alta', autorId: 'u-007', responsableId: null },
    { id: 'RC-0002', titulo: 'Wi-Fi caído', estado: 'En proceso', categoria: 'tecnologia', ubicacion: 'biblioteca', prioridad: 'Media', autorId: 'u-008', responsableId: 'u-004' },
    { id: 'RC-0003', titulo: 'Gotera grande', estado: 'Resuelto', categoria: 'infraestructura', ubicacion: 'bloque-a', prioridad: 'Baja', autorId: 'u-007', responsableId: 'u-002' }
  ];
  const ids = (f) => filtrarReportes(lista, f).map((x) => x.id);
  assert.deepEqual(ids({ texto: 'gotera' }), ['RC-0001', 'RC-0003']);
  assert.deepEqual(ids({ texto: 'biblioteca' }), ['RC-0002'], 'busca también por el nombre de la zona');
  assert.deepEqual(ids({ estado: 'Resuelto' }), ['RC-0003']);
  assert.deepEqual(ids({ abiertos: true }), ['RC-0001', 'RC-0002']);
  assert.deepEqual(ids({ autorId: 'u-007', zona: 'bloque-a' }), ['RC-0001', 'RC-0003']);
  assert.deepEqual(ids({ responsableId: 'ninguno' }), ['RC-0001']);
  assert.deepEqual(ids({ responsableId: 'u-004' }), ['RC-0002']);
  assert.deepEqual(ids({}), ['RC-0001', 'RC-0002', 'RC-0003']);
});

test('validarCambioEstado solo permite las transiciones definidas', () => {
  const nuevo = { estado: 'Nuevo', responsableId: null };
  assert.match(validarCambioEstado(nuevo, 'Resuelto', 'Se arregló todo'), /no puede pasar a resuelto/);
  assert.match(validarCambioEstado(nuevo, 'En proceso', ''), /Asigna un responsable/);
  assert.equal(validarCambioEstado({ estado: 'Nuevo', responsableId: 'u-002' }, 'En proceso', ''), null);
});

test('validarCambioEstado pide nota al resolver y al reabrir', () => {
  assert.match(validarCambioEstado({ estado: 'En proceso', responsableId: 'u-002' }, 'Resuelto', 'listo'), /Describe la solución/);
  assert.equal(validarCambioEstado({ estado: 'En proceso', responsableId: 'u-002' }, 'Resuelto', 'Se cambió la lámpara.'), null);
  assert.match(validarCambioEstado({ estado: 'Resuelto', responsableId: 'u-002' }, 'En proceso', ''), /por qué se reabre/);
});
