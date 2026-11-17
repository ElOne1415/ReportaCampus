import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validarUsuario, construirUsuario, siguienteIdUsuario, nombreConArea } from '../src/models/usuario.js';

const existentes = [{ id: 'u-001', correo: 'admin@campus.edu.co' }];

test('validarUsuario acepta un estudiante sin área', () => {
  assert.equal(validarUsuario({ nombre: 'Ana Ruiz', correo: 'ana@campus.edu.co', rol: 'estudiante' }, existentes).ok, true);
});

test('validarUsuario exige correo válido y único (sin importar mayúsculas)', () => {
  assert.equal(validarUsuario({ nombre: 'Ana Ruiz', correo: 'ana@', rol: 'estudiante' }).errores.correo, 'Escribe un correo válido.');
  assert.equal(validarUsuario({ nombre: 'Ana Ruiz', correo: ' ADMIN@campus.edu.co ', rol: 'estudiante' }, existentes).errores.correo, 'Ya existe un usuario con ese correo.');
  assert.equal(validarUsuario({ nombre: 'Paola M', correo: 'admin@campus.edu.co', rol: 'administrador' }, existentes, 'u-001').ok, true, 'al editar no choca consigo mismo');
});

test('validarUsuario pide área y categorías al responsable', () => {
  const r = validarUsuario({ nombre: 'Luis Mora', correo: 'luis@campus.edu.co', rol: 'responsable', area: '', categorias: ['inventada'] });
  assert.ok(r.errores.area);
  assert.ok(r.errores.categorias);
});

test('validarUsuario rechaza roles desconocidos y nombres cortos', () => {
  const r = validarUsuario({ nombre: 'Al', correo: 'al@campus.edu.co', rol: 'superusuario' });
  assert.ok(r.errores.nombre);
  assert.ok(r.errores.rol);
});

test('construirUsuario normaliza el correo y limpia campos que no aplican', () => {
  const u = construirUsuario({ nombre: ' Ana Ruiz ', correo: ' ANA@Campus.edu.co', rol: 'estudiante', area: 'Algo', categorias: ['aseo'] }, 'u-020');
  assert.equal(u.correo, 'ana@campus.edu.co');
  assert.equal(u.nombre, 'Ana Ruiz');
  assert.equal(u.area, '');
  assert.deepEqual(u.categorias, []);
  assert.equal(u.activo, true);
});

test('siguienteIdUsuario y nombreConArea', () => {
  assert.equal(siguienteIdUsuario([{ id: 'u-001' }, { id: 'u-016' }]), 'u-017');
  assert.equal(nombreConArea({ nombre: 'Diana Rojas', area: 'Planta física' }), 'Planta física – Diana Rojas');
  assert.equal(nombreConArea(null), 'Sin asignar');
});
