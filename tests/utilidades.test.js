import { test } from 'node:test';
import assert from 'node:assert/strict';
import { leerHash, crearHash } from '../src/router.js';
import { aCSV } from '../src/utils/csv.js';
import { intervalos, serieTendencia } from '../src/utils/periodos.js';
import { generarReportes } from '../src/data/semilla.js';
import { esc } from '../src/utils/formato.js';
import { ordenarPorUrgencia } from '../src/pages/asignados.js';

test('leerHash y crearHash son inversos', () => {
  assert.deepEqual(leerHash('#/reportes?zona=biblioteca&estado=Nuevo'), { nombre: 'reportes', params: { zona: 'biblioteca', estado: 'Nuevo' } });
  assert.deepEqual(leerHash(''), { nombre: '', params: {} });
  assert.equal(crearHash('reportes', { zona: 'biblioteca', estado: '', texto: null }), '#/reportes?zona=biblioteca');
  assert.equal(crearHash('panel'), '#/panel');
});

test('aCSV usa punto y coma, BOM y escapa comillas', () => {
  const csv = aCSV([['Código', 'Título'], ['RC-0001', 'Dice "hola"; adiós']]);
  assert.ok(csv.startsWith('﻿'));
  assert.equal(csv.slice(1), '"Código";"Título"\r\n"RC-0001";"Dice ""hola""; adiós"');
});

test('esc evita insertar HTML', () => {
  assert.equal(esc('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
});

test('intervalos: 7 días, 4 semanas y 6 meses', () => {
  const ahora = new Date(2026, 10, 17, 10, 0);
  assert.equal(intervalos('semana', ahora).length, 7);
  assert.equal(intervalos('mes', ahora).length, 4);
  const sem = intervalos('semestre', ahora);
  assert.equal(sem.length, 6);
  assert.equal(sem[0].desde.getMonth(), 5, 'empieza en junio');
});

test('serieTendencia cuenta recibidos y resueltos por intervalo', () => {
  const ahora = new Date(2026, 10, 17, 10, 0);
  const hoy = new Date(2026, 10, 17, 8, 0);
  const s = serieTendencia('semana', [{ creado: hoy, resuelto: null }, { creado: new Date(2026, 10, 16, 9), resuelto: hoy }], ahora);
  assert.deepEqual(s.creados.slice(-2), [1, 1]);
  assert.deepEqual(s.resueltos.slice(-2), [0, 1]);
});

test('los datos simulados son deterministas', () => {
  const ahora = new Date(2026, 10, 17, 10, 0);
  const a = generarReportes(ahora, 20262, 370);
  const b = generarReportes(ahora, 20262, 370);
  assert.deepEqual(a.map((x) => x.id + x.titulo), b.map((x) => x.id + x.titulo));
  assert.ok(a.every((x, i) => i === 0 || a[i - 1].creado >= x.creado), 'más recientes primero');
});

test('ordenarPorUrgencia: abiertos, prioridad alta y más antiguos primero', () => {
  const d = (h) => new Date(2026, 10, 17, h);
  const lista = [
    { id: 'A', estado: 'Resuelto', prioridad: 'Alta', creado: d(1), resuelto: d(2) },
    { id: 'B', estado: 'En proceso', prioridad: 'Media', creado: d(1) },
    { id: 'C', estado: 'En proceso', prioridad: 'Alta', creado: d(5) },
    { id: 'D', estado: 'En proceso', prioridad: 'Alta', creado: d(3) }
  ];
  assert.deepEqual(ordenarPorUrgencia(lista).map((x) => x.id), ['D', 'C', 'B', 'A']);
});
