from conftest import CLAVE, CORREOS


def test_login_correcto_y_usuario_actual(cliente):
    r = cliente.post('/api/auth/login', json={'correo': ' ADMIN@campus.edu.co ', 'contrasena': CLAVE})
    assert r.status_code == 200
    assert r.json['usuario']['rol'] == 'administrador'
    yo = cliente.get('/api/auth/yo', headers={'Authorization': 'Bearer ' + r.json['token']})
    assert yo.json['usuario']['id'] == 'u-001'


def test_login_valida_campos(cliente):
    r = cliente.post('/api/auth/login', json={})
    assert r.status_code == 400
    assert set(r.json['errores']) == {'correo', 'contrasena'}


def test_login_no_revela_si_el_correo_existe(cliente):
    mala = cliente.post('/api/auth/login', json={'correo': CORREOS['admin'], 'contrasena': 'otra'})
    nadie = cliente.post('/api/auth/login', json={'correo': 'nadie@campus.edu.co', 'contrasena': CLAVE})
    assert mala.status_code == nadie.status_code == 401
    assert mala.json == nadie.json


def test_cuenta_desactivada(cliente):
    r = cliente.post('/api/auth/login', json={'correo': 'mateo.sanchez@campus.edu.co', 'contrasena': CLAVE})
    assert r.status_code == 403
    assert 'desactivada' in r.json['error']


def test_token_invalido_o_ausente(cliente):
    assert cliente.get('/api/auth/yo').status_code == 401
    assert cliente.get('/api/auth/yo', headers={'Authorization': 'Bearer abc.def.ghi'}).status_code == 401


def test_token_vencido(app, cliente):
    app.config['JWT_HORAS'] = -1
    r = cliente.post('/api/auth/login', json={'correo': CORREOS['admin'], 'contrasena': CLAVE})
    assert cliente.get('/api/auth/yo', headers={'Authorization': 'Bearer ' + r.json['token']}).status_code == 401


def test_contrasenas_se_guardan_cifradas(app):
    from app.extensiones import db
    from app.modelos import Usuario
    with app.app_context():
        u = db.session.get(Usuario, 1)
        assert CLAVE not in u.clave_hash and u.clave_hash.startswith('pbkdf2:sha256')


def test_cambiar_contrasena(cliente, sesion):
    h = sesion('santiago')
    assert cliente.post('/api/auth/contrasena', headers=h, json={'actual': 'mal', 'nueva': 'Nueva2026'}).json['errores'] == {'actual': 'La contraseña actual no es correcta.'}
    assert 'nueva' in cliente.post('/api/auth/contrasena', headers=h, json={'actual': CLAVE, 'nueva': 'corta1'}).json['errores']
    assert 'nueva' in cliente.post('/api/auth/contrasena', headers=h, json={'actual': CLAVE, 'nueva': 'sololetras'}).json['errores']
    assert cliente.post('/api/auth/contrasena', headers=h, json={'actual': CLAVE, 'nueva': 'Nueva2026'}).json['ok']
    assert cliente.post('/api/auth/login', json={'correo': CORREOS['santiago'], 'contrasena': CLAVE}).status_code == 401
    assert cliente.post('/api/auth/login', json={'correo': CORREOS['santiago'], 'contrasena': 'Nueva2026'}).status_code == 200


def test_cuentas_demo(app, cliente):
    assert [u['rol'] for u in cliente.get('/api/auth/cuentas-demo').json['cuentas']] == ['estudiante', 'responsable', 'administrador']
    app.config['MOSTRAR_CUENTAS_DEMO'] = False
    assert cliente.get('/api/auth/cuentas-demo').json['cuentas'] == []
