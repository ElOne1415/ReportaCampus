import { test } from 'node:test';
import assert from 'node:assert/strict';
import { puede, puedeEditarReporte, puedeEliminarReporte, puedeCambiarEstado, puedeComentar, PERMISOS, LISTA_ROLES } from '../src/models/roles.js';

const estudiante = { id: 'u-007', rol: 'estudiante', activo: true };
const otroEstudiante = { id: 'u-008', rol: 'estudiante', activo: true };
const responsable = { id: 'u-002', rol: 'responsable', activo: true };
const otroResponsable = { id: 'u-003', rol: 'responsable', activo: true };
const admin = { id: 'u-001', rol: 'administrador', activo: true };

const reporte = (estado, extra = {}) => ({ id: 'RC-0001', estado, autorId: 'u-007', responsableId: 'u-002', ...extra });

test('cada permiso usa solo roles conocidos', () => {
  Object.values(PERMISOS).forEach((roles) => roles.forEach((r) => assert.ok(LISTA_ROLES.includes(r), r)));
});

test('puede revisa el rol y que la cuenta esté activa', () => {
  assert.equal(puede(estudiante, 'reportes.crear'), true);
  assert.equal(puede(estudiante, 'usuarios.gestionar'), false);
  assert.equal(puede(responsable, 'reportes.asignados'), true);
  assert.equal(puede(responsable, 'reportes.asignar'), false);
  assert.equal(puede(admin, 'usuarios.gestionar'), true);
  assert.equal(puede({ ...admin, activo: false }, 'usuarios.gestionar'), false);
  assert.equal(puede(null, 'panel.ver'), false);
  assert.equal(puede(admin, 'permiso.inexistente'), false);
});

test('solo el autor edita su reporte y solo mientras está en Nuevo', () => {
  assert.equal(puedeEditarReporte(estudiante, reporte('Nuevo', { responsableId: null })), true);
  assert.equal(puedeEditarReporte(estudiante, reporte('En proceso')), false);
  assert.equal(puedeEditarReporte(otroEstudiante, reporte('Nuevo')), false);
  assert.equal(puedeEditarReporte(admin, reporte('Nuevo')), false);
});

test('el autor elimina en Nuevo; el administrador, siempre', () => {
  assert.equal(puedeEliminarReporte(estudiante, reporte('Nuevo')), true);
  assert.equal(puedeEliminarReporte(estudiante, reporte('Resuelto')), false);
  assert.equal(puedeEliminarReporte(otroEstudiante, reporte('Nuevo')), false);
  assert.equal(puedeEliminarReporte(responsable, reporte('En proceso')), false);
  assert.equal(puedeEliminarReporte(admin, reporte('Resuelto')), true);
});

test('el responsable cambia el estado solo de sus reportes', () => {
  assert.equal(puedeCambiarEstado(responsable, reporte('En proceso')), true);
  assert.equal(puedeCambiarEstado(otroResponsable, reporte('En proceso')), false);
  assert.equal(puedeCambiarEstado(estudiante, reporte('En proceso')), false);
  assert.equal(puedeCambiarEstado(admin, reporte('En proceso')), true);
  assert.equal(puedeComentar(otroResponsable, reporte('En proceso')), false);
  assert.equal(puedeComentar(responsable, reporte('En proceso')), true);
});
