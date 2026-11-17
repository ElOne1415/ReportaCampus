"""Configuración del backend leída de variables de entorno (archivo .env)."""
import os
import secrets
from pathlib import Path

RAIZ_BACKEND = Path(__file__).resolve().parent.parent
RAIZ_PROYECTO = RAIZ_BACKEND.parent
INSTANCIA = RAIZ_BACKEND / 'instancia'


def _bool(nombre, defecto):
    return os.environ.get(nombre, str(int(defecto))).strip().lower() in ('1', 'true', 'si', 'sí', 'yes')


def _lista(nombre, defecto):
    return [x.strip() for x in os.environ.get(nombre, defecto).split(',') if x.strip()]


def _url_base_datos():
    url = os.environ.get('DATABASE_URL', 'sqlite:///reportacampus.db')
    # Las rutas relativas de SQLite se guardan dentro de backend/instancia/
    if url.startswith('sqlite:///') and not url.startswith('sqlite:////') and ':memory:' not in url:
        INSTANCIA.mkdir(exist_ok=True)
        url = 'sqlite:///' + str(INSTANCIA / url[len('sqlite:///'):])
    return url


class Config:
    VERSION = '1.0.0'

    SECRET_KEY = os.environ.get('SECRET_KEY') or ''
    SQLALCHEMY_DATABASE_URI = _url_base_datos()
    SQLALCHEMY_ENGINE_OPTIONS = {'pool_pre_ping': True}
    JWT_HORAS = float(os.environ.get('JWT_HORAS', 8))
    CORS_ORIGENES = _lista('CORS_ORIGENES', 'http://localhost:8080,http://127.0.0.1:8080,https://elone1415.github.io')
    AUTO_SEMILLA = _bool('AUTO_SEMILLA', True)
    MOSTRAR_CUENTAS_DEMO = _bool('MOSTRAR_CUENTAS_DEMO', True)

    # Fotos de los reportes
    CARPETA_FOTOS = Path(os.environ.get('CARPETA_FOTOS', INSTANCIA / 'fotos'))
    FOTO_MAX_BYTES = int(os.environ.get('FOTO_MAX_BYTES', 1_500_000))
    MAX_CONTENT_LENGTH = 4 * 1024 * 1024  # tamaño máximo de una petición

    # Carpeta del frontend que sirve Flask en "/" (index.html, src/, public/)
    CARPETA_FRONTEND = RAIZ_PROYECTO
    SEMILLA = RAIZ_BACKEND / 'datos' / 'semilla.json'


def completar(config):
    """Genera una clave temporal si no se configuró SECRET_KEY (solo desarrollo)."""
    if not config.get('SECRET_KEY') or config['SECRET_KEY'] == 'cambia-esta-clave':
        config['SECRET_KEY'] = secrets.token_hex(32)
        config['CLAVE_TEMPORAL'] = True
