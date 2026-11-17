NUEVO = {'nombre': 'Luis Mora', 'correo': 'luis.mora@campus.edu.co', 'rol': 'responsable', 'area': 'Jardinería', 'categorias': ['servicios']}


def test_solo_admin_gestiona(cliente, sesion):
    assert cliente.get('/api/usuarios', headers=sesion('valentina')).status_code == 403
    assert cliente.post('/api/usuarios', headers=sesion('diana'), json=NUEVO).status_code == 403
    assert len(cliente.get('/api/usuarios', headers=sesion('admin')).json['usuarios']) == 16


def test_crear_editar_desactivar_eliminar(cliente, sesion):
    h = sesion('admin')
    r = cliente.post('/api/usuarios', headers=h, json=NUEVO)
    assert r.status_code == 201 and r.json['usuario']['id'] == 'u-017'
    assert cliente.post('/api/usuarios', headers=h, json=NUEVO).json['errores']['correo'] == 'Ya existe un usuario con ese correo.'
    assert cliente.post('/api/auth/login', json={'correo': NUEVO['correo'], 'contrasena': 'campus2026'}).status_code == 200
    u = cliente.put('/api/usuarios/u-017', headers=h, json={**NUEVO, 'rol': 'estudiante'}).json['usuario']
    assert u['rol'] == 'estudiante' and u['area'] == '' and u['categorias'] == []
    assert cliente.patch('/api/usuarios/u-017/activo', headers=h, json={'activo': False}).json['usuario']['activo'] is False
    assert cliente.post('/api/auth/login', json={'correo': NUEVO['correo'], 'contrasena': 'campus2026'}).status_code == 403
    assert cliente.delete('/api/usuarios/u-017', headers=h).json['ok']
    assert cliente.get('/api/usuarios/u-017', headers=h).status_code == 404


def test_validaciones(cliente, sesion):
    r = cliente.post('/api/usuarios', headers=sesion('admin'), json={'nombre': 'Al', 'correo': 'malo', 'rol': 'responsable'})
    assert set(r.json['errores']) == {'nombre', 'correo', 'area', 'categorias'}


def test_reglas_de_cuentas_criticas(cliente, sesion):
    h = sesion('admin')
    assert 'propia cuenta' in cliente.delete('/api/usuarios/u-001', headers=h).json['error']
    assert 'propia cuenta' in cliente.patch('/api/usuarios/u-001/activo', headers=h, json={'activo': False}).json['error']
    admin = cliente.get('/api/usuarios/u-001', headers=h).json['usuario']
    assert 'al menos un administrador' in cliente.put('/api/usuarios/u-001', headers=h, json={**admin, 'rol': 'estudiante'}).json['error']
    # Diana tiene reportes en proceso
    assert 'sin resolver' in cliente.delete('/api/usuarios/u-002', headers=h).json['error']
    assert 'sin resolver' in cliente.patch('/api/usuarios/u-002/activo', headers=h, json={'activo': False}).json['error']


def test_eliminar_autor_conserva_sus_reportes(cliente, sesion, nuevo_reporte):
    rep = nuevo_reporte('santiago')
    h = sesion('admin')
    assert cliente.delete('/api/usuarios/u-008', headers=h).json['ok']
    r = cliente.get('/api/reportes/' + rep['id'], headers=h).json['reporte']
    assert r['autor'] == 'Santiago Ramírez' and r['autorId'] is None


def test_token_de_cuenta_desactivada_deja_de_servir(cliente, sesion):
    hv = sesion('santiago')
    cliente.patch('/api/usuarios/u-008/activo', headers=sesion('admin'), json={'activo': False})
    assert cliente.get('/api/reportes', headers=hv).status_code == 401


def test_responsables_por_categoria(cliente, sesion):
    nombres = [u['nombre'] for u in cliente.get('/api/usuarios/responsables?categoria=tecnologia', headers=sesion('admin')).json['usuarios']]
    assert nombres[0] == 'Laura Gómez' and len(nombres) == 5


def test_auditoria_y_restablecer(cliente, sesion, nuevo_reporte):
    nuevo_reporte()
    h = sesion('admin')
    assert cliente.get('/api/auditoria', headers=sesion('diana')).status_code == 403
    registros = cliente.get('/api/auditoria?limite=1', headers=h).json['registros']
    assert registros[0]['accion'] == 'crear' and registros[0]['usuario'] == 'Valentina Martínez'
    assert cliente.post('/api/datos/restablecer', headers=h).json == {'ok': True, 'reportes': 819, 'usuarios': 16}
    assert cliente.get('/api/reportes/RC-0820', headers=sesion('admin')).status_code == 404
