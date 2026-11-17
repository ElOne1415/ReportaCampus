import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearCliente, consulta, MENSAJES } from '../src/services/api/cliente.js';
import { crearServiciosApi } from '../src/services/index.js';
import { almacenMemoria } from '../src/services/almacenamiento.js';
import { CONFIG } from '../src/config/config.js';

/** fetch falso: responde según la ruta y guarda las peticiones. */
function fetchFalso(respuestas) {
  const llamadas = [];
  const fn = async (url, op) => {
    llamadas.push({ url, ...op, cuerpo: op.body ? JSON.parse(op.body) : undefined });
    const r = respuestas[op.method + ' ' + url.replace('http://api', '')] || respuestas['*'];
    if (r instanceof Error) throw r;
    return { status: r.estado || 200, json: async () => { if (r.sinJson) throw new Error('no json'); return r.cuerpo; } };
  };
  fn.llamadas = llamadas;
  return fn;
}

test('el cliente envía el token y el cuerpo en JSON', async () => {
  const sesion = almacenMemoria();
  sesion.escribir(CONFIG.CLAVES.sesion, { token: 'abc' });
  const f = fetchFalso({ 'POST /reportes': { cuerpo: { ok: true } } });
  const c = crearCliente({ base: 'http://api', almacenSesion: sesion, fetchFn: f });
  assert.equal((await c.post('/reportes', { titulo: 'x' })).ok, true);
  assert.equal(f.llamadas[0].headers.Authorization, 'Bearer abc');
  assert.deepEqual(f.llamadas[0].cuerpo, { titulo: 'x' });
});

test('el cliente traduce los fallos de red y las respuestas sin JSON', async () => {
  const c1 = crearCliente({ base: 'http://api', almacenSesion: almacenMemoria(), fetchFn: fetchFalso({ '*': new TypeError('Failed to fetch') }) });
  assert.deepEqual(await c1.get('/x'), { ok: false, error: MENSAJES.red, red: true });
  const c2 = crearCliente({ base: 'http://api', almacenSesion: almacenMemoria(), fetchFn: fetchFalso({ '*': { estado: 502, sinJson: true } }) });
  assert.equal((await c2.get('/x')).error, MENSAJES.servidor);
});

test('un 401 con sesión avisa que la sesión venció', async () => {
  const sesion = almacenMemoria();
  sesion.escribir(CONFIG.CLAVES.sesion, { token: 'vencido' });
  let aviso = null;
  const c = crearCliente({ base: 'http://api', almacenSesion: sesion, alVencerSesion: (m) => { aviso = m; },
    fetchFn: fetchFalso({ '*': { estado: 401, cuerpo: { ok: false, error: 'Tu sesión terminó.' } } }) });
  const r = await c.get('/reportes');
  assert.equal(r.ok, false);
  assert.equal(aviso, 'Tu sesión terminó.');
});

test('consulta omite los valores vacíos', () => {
  assert.equal(consulta({ texto: 'baño', rol: '', activo: undefined, x: false }), '?texto=ba%C3%B1o');
  assert.equal(consulta({}), '');
});

test('los servicios de la API convierten las fechas y guardan el token', async () => {
  const sesion = almacenMemoria();
  const reporte = { id: 'RC-0001', titulo: 'Gotera', estado: 'Nuevo', creado: '2026-11-17T10:00:00Z', resuelto: null, historial: [{ estado: 'Nuevo', fecha: '2026-11-17T10:00:00Z' }] };
  const f = fetchFalso({
    'POST /auth/login': { cuerpo: { ok: true, token: 't1', usuario: { id: 'u-007', nombre: 'Valentina', rol: 'estudiante' } } },
    'GET /reportes': { cuerpo: { ok: true, reportes: [reporte] } },
    'POST /reportes/RC-0001/tomar': { cuerpo: { ok: true, reporte: { ...reporte, estado: 'En proceso', responsableNombre: 'Planta física – Diana Rojas' } } }
  });
  const s = crearServiciosApi({ base: 'http://api', almacenSesion: sesion, fetchFn: f });
  assert.equal((await s.auth.iniciarSesion('valentina@x.co', 'clave')).ok, true);
  assert.equal(s.auth.usuarioActual().id, 'u-007');
  assert.equal(sesion.leer(CONFIG.CLAVES.sesion).token, 't1');
  const lista = await s.reportes.listar();
  assert.ok(lista[0].creado instanceof Date);
  assert.equal((await s.reportes.listar({ estado: 'Resuelto' })).length, 0, 'los filtros se aplican sobre la copia');
  const r = await s.reportes.tomar('RC-0001');
  assert.equal(r.reporte.estado, 'En proceso');
  assert.equal(s.reportes.nombreResponsable(r.reporte), 'Planta física – Diana Rojas');
  assert.equal((await s.reportes.listar())[0].estado, 'En proceso', 'la copia se actualiza con la respuesta');
  assert.equal(f.llamadas.filter((l) => l.url.endsWith('/reportes')).length, 1, 'la lista se pidió una sola vez');
});
