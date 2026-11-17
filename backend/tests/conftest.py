"""Cada prueba usa una base SQLite nueva con los datos de demostración."""
import base64

import pytest

from app import create_app

CLAVE = 'campus2026'
CORREOS = {
    'admin': 'admin@campus.edu.co',
    'diana': 'diana.rojas@campus.edu.co',      # responsable de infraestructura
    'ana': 'ana.torres@campus.edu.co',         # responsable de aseo
    'valentina': 'valentina.martinez@campus.edu.co',
    'santiago': 'santiago.ramirez@campus.edu.co',
}
REPORTE = {
    'categoria': 'aseo', 'ubicacion': 'biblioteca', 'prioridad': 'Media',
    'titulo': 'Baño sin papel ni jabón', 'descripcion': 'El baño del segundo piso no tiene papel desde la mañana.',
}
# JPEG mínimo válido (1x1 px)
JPEG = base64.b64decode(
    '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////'
    '2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQAB'
    'AQAAAAAAAAAAAAAAAAAAAAP/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEA'
    'AhEDEQA/AKAA/9k=')
FOTO = 'data:image/jpeg;base64,' + base64.b64encode(JPEG).decode()


@pytest.fixture
def app(tmp_path):
    return create_app({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': f'sqlite:///{tmp_path / "prueba.db"}',
        'CARPETA_FOTOS': tmp_path / 'fotos',
        'SECRET_KEY': 'clave-de-pruebas',
    })


@pytest.fixture
def cliente(app):
    return app.test_client()


@pytest.fixture
def sesion(cliente):
    """sesion('admin') -> cabeceras con el token de esa cuenta."""
    def entrar(quien):
        r = cliente.post('/api/auth/login', json={'correo': CORREOS[quien], 'contrasena': CLAVE})
        assert r.status_code == 200, r.json
        return {'Authorization': 'Bearer ' + r.json['token']}
    return entrar


@pytest.fixture
def nuevo_reporte(cliente, sesion):
    def crear(quien='valentina', **cambios):
        r = cliente.post('/api/reportes', headers=sesion(quien), json={**REPORTE, **cambios})
        assert r.status_code == 201, r.json
        return r.json['reporte']
    return crear
