from app.esquema import generar


def test_salud(cliente):
    r = cliente.get('/api/salud').json
    assert r['ok'] and r['baseDatos'] == 'sqlite'


def test_catalogos(cliente):
    r = cliente.get('/api/catalogos').json
    assert len(r['categorias']) == 6 and len(r['zonas']) == 8


def test_sirve_el_frontend_pero_no_otros_archivos(cliente):
    assert b'ReportaCampus' in cliente.get('/').data
    assert cliente.get('/src/main.js').status_code == 200
    assert cliente.get('/public/img/logo.svg').status_code == 200
    for ruta in ('/backend/.env.example', '/backend/run.py', '/README.md', '/.git/config', '/src/../backend/run.py', '/src/%2e%2e/backend/run.py', '/public/../README.md'):
        assert cliente.get(ruta).status_code == 404, ruta


def test_errores_en_json(cliente):
    r = cliente.get('/api/no-existe')
    assert r.status_code == 404 and r.json == {'ok': False, 'error': 'No se encontró el recurso.'}
    assert cliente.delete('/api/salud').json['error'] == 'Método no permitido.'


def test_peticion_muy_grande(cliente, sesion):
    r = cliente.post('/api/reportes', headers=sesion('valentina'), data='x' * (5 * 1024 * 1024), content_type='application/json')
    assert r.status_code == 413


def test_esquema_sql_server():
    sql = generar()
    assert 'CREATE TABLE reportes' in sql and 'NVARCHAR(500)' in sql and 'DATETIME2' in sql and 'IDENTITY' in sql
