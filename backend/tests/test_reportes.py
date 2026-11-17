from conftest import FOTO, REPORTE


def test_listar_requiere_sesion(cliente):
    assert cliente.get('/api/reportes').status_code == 401


def test_listar_y_filtrar(cliente, sesion):
    h = sesion('admin')
    todos = cliente.get('/api/reportes', headers=h).json['reportes']
    assert len(todos) == 819
    assert todos[0]['creado'] >= todos[-1]['creado'], 'más recientes primero'
    sin_asignar = cliente.get('/api/reportes?estado=Nuevo&responsableId=ninguno', headers=h).json['reportes']
    assert sin_asignar and all(r['estado'] == 'Nuevo' and r['responsableId'] is None for r in sin_asignar)
    assert all(r['autorId'] == 'u-007' for r in cliente.get('/api/reportes?autorId=u-007', headers=h).json['reportes'])
    assert [r['id'] for r in cliente.get('/api/reportes?texto=RC-0005', headers=h).json['reportes']] == ['RC-0005']
    assert all(r['ubicacion'] == 'biblioteca' or 'biblioteca' in r['titulo'].lower()
               for r in cliente.get('/api/reportes?texto=Biblioteca', headers=h).json['reportes'])


def test_crear_valida_y_guarda(cliente, sesion):
    h = sesion('valentina')
    r = cliente.post('/api/reportes', headers=h, json={'titulo': 'corto'})
    assert r.status_code == 400 and set(r.json['errores']) == {'categoria', 'ubicacion', 'titulo', 'descripcion', 'prioridad'}
    r = cliente.post('/api/reportes', headers=h, json=REPORTE)
    assert r.status_code == 201
    rep = r.json['reporte']
    assert rep['id'] == 'RC-0820' and rep['estado'] == 'Nuevo' and rep['autorId'] == 'u-007'
    assert cliente.get('/api/reportes/RC-0820', headers=h).json['reporte']['titulo'] == REPORTE['titulo']


def test_foto_se_guarda_y_se_valida(cliente, sesion, nuevo_reporte):
    rep = nuevo_reporte(fotoUrl=FOTO)
    ruta = rep['fotoUrl'].replace('http://localhost', '')
    assert cliente.get(ruta).data.startswith(b'\xff\xd8\xff')
    falsa = 'data:image/jpeg;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=='
    r = cliente.post('/api/reportes', headers=sesion('valentina'), json={**REPORTE, 'fotoUrl': falsa})
    assert r.status_code == 400 and 'foto' in r.json['errores']


def test_editar_solo_autor_y_en_nuevo(cliente, sesion, nuevo_reporte):
    rep = nuevo_reporte()
    url = '/api/reportes/' + rep['id']
    assert cliente.put(url, headers=sesion('santiago'), json=REPORTE).status_code == 403
    r = cliente.put(url, headers=sesion('valentina'), json={**REPORTE, 'titulo': 'Baño del tercer piso sin papel'})
    assert r.json['reporte']['titulo'] == 'Baño del tercer piso sin papel'
    assert r.json['reporte']['historial'][-1]['nota'] == 'El autor editó el reporte.'
    cliente.post(url + '/asignacion', headers=sesion('admin'), json={'responsableId': 'u-003'})
    assert cliente.put(url, headers=sesion('valentina'), json=REPORTE).status_code == 403
    assert cliente.delete(url, headers=sesion('valentina')).status_code == 403
    assert cliente.delete(url, headers=sesion('admin')).json['ok']
    assert cliente.get(url, headers=sesion('admin')).status_code == 404


def test_asignar_tomar_resolver_calificar(cliente, sesion, nuevo_reporte):
    rep = nuevo_reporte()
    url = '/api/reportes/' + rep['id']
    # Diana atiende infraestructura: no puede tomar uno de aseo; Ana sí
    assert cliente.post(url + '/tomar', headers=sesion('diana')).status_code == 403
    r = cliente.post(url + '/tomar', headers=sesion('ana')).json['reporte']
    assert r['estado'] == 'En proceso' and r['responsableId'] == 'u-003'
    assert cliente.post(url + '/tomar', headers=sesion('ana')).status_code == 403, 'ya no está libre'
    # Otro responsable no puede resolverlo
    assert cliente.post(url + '/estado', headers=sesion('diana'), json={'estado': 'Resuelto', 'nota': 'Se repuso todo.'}).status_code == 403
    assert 'Describe la solución' in cliente.post(url + '/estado', headers=sesion('ana'), json={'estado': 'Resuelto', 'nota': 'ok'}).json['error']
    r = cliente.post(url + '/estado', headers=sesion('ana'), json={'estado': 'Resuelto', 'nota': 'Se repuso el papel y el jabón.'}).json['reporte']
    assert r['estado'] == 'Resuelto' and r['resuelto']
    # Calificación del autor, una sola vez
    assert cliente.post(url + '/calificacion', headers=sesion('santiago'), json={'puntaje': 5}).status_code == 403
    assert 'puntaje' in cliente.post(url + '/calificacion', headers=sesion('valentina'), json={'puntaje': 0}).json['errores']
    r = cliente.post(url + '/calificacion', headers=sesion('valentina'), json={'puntaje': 4, 'comentario': 'Rápido'}).json['reporte']
    assert r['calificacion'] == {'puntaje': 4, 'comentario': 'Rápido'}
    assert cliente.post(url + '/calificacion', headers=sesion('valentina'), json={'puntaje': 5}).status_code == 403
    # Solo el administrador reabre, y la calificación se borra
    assert cliente.post(url + '/estado', headers=sesion('ana'), json={'estado': 'En proceso', 'nota': 'Volvió a pasar hoy.'}).status_code == 403
    r = cliente.post(url + '/estado', headers=sesion('admin'), json={'estado': 'En proceso', 'nota': 'Volvió a pasar hoy.'}).json['reporte']
    assert r['estado'] == 'En proceso' and r['calificacion'] is None and r['resuelto'] is None


def test_transiciones_invalidas(cliente, sesion, nuevo_reporte):
    url = '/api/reportes/' + nuevo_reporte()['id']
    r = cliente.post(url + '/estado', headers=sesion('admin'), json={'estado': 'Resuelto', 'nota': 'Se arregló todo.'})
    assert r.status_code == 400 and 'no puede pasar' in r.json['error']


def test_asignar_y_prioridad_solo_admin(cliente, sesion, nuevo_reporte):
    url = '/api/reportes/' + nuevo_reporte()['id']
    assert cliente.post(url + '/asignacion', headers=sesion('diana'), json={'responsableId': 'u-003'}).status_code == 403
    assert cliente.post(url + '/asignacion', headers=sesion('admin'), json={'responsableId': 'u-007'}).json['error'] == 'Elige un responsable activo.'
    r = cliente.post(url + '/asignacion', headers=sesion('admin'), json={'responsableId': 'u-003'}).json
    assert r['reporte']['responsableNombre'] == 'Servicios generales – Ana Torres'
    assert cliente.post(url + '/asignacion', headers=sesion('admin'), json={'responsableId': 'u-003'}).json['sinCambios'] is True
    assert cliente.patch(url + '/prioridad', headers=sesion('valentina'), json={'prioridad': 'Alta'}).status_code == 403
    assert cliente.patch(url + '/prioridad', headers=sesion('admin'), json={'prioridad': 'Urgente'}).status_code == 400
    r = cliente.patch(url + '/prioridad', headers=sesion('admin'), json={'prioridad': 'Alta'}).json['reporte']
    assert r['historial'][-1]['nota'] == 'Prioridad cambiada de Media a Alta.'


def test_notas(cliente, sesion, nuevo_reporte):
    url = '/api/reportes/' + nuevo_reporte()['id']
    cliente.post(url + '/asignacion', headers=sesion('admin'), json={'responsableId': 'u-003'})
    assert cliente.post(url + '/notas', headers=sesion('valentina'), json={'nota': 'Una nota cualquiera'}).status_code == 403
    assert cliente.post(url + '/notas', headers=sesion('ana'), json={'nota': 'corta'}).status_code == 400
    assert cliente.post(url + '/notas', headers=sesion('ana'), json={'nota': 'Voy en camino al baño.'}).json['reporte']['historial'][-1]['por'] == 'Ana Torres'


def test_codigo_invalido(cliente, sesion):
    h = sesion('admin')
    assert cliente.get('/api/reportes/RC-9999', headers=h).status_code == 404
    assert cliente.get('/api/reportes/hola', headers=h).status_code == 404
