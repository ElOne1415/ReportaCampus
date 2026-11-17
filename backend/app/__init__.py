"""
Backend de ReportaCampus (Flask).

create_app() arma la aplicación:
  - /api/...  API REST en JSON (rutas/)
  - /         el frontend (index.html, src/, public/) en modo API
"""
import logging

from dotenv import load_dotenv
from flask import Flask, request
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

load_dotenv()

from .config import Config, completar  # noqa: E402  (después de leer .env)
from .extensiones import db  # noqa: E402
from .respuestas import error  # noqa: E402


def create_app(config=None):
    app = Flask(__name__, static_folder=None)
    app.config.from_object(Config)
    if config:
        app.config.update(config)
    completar(app.config)
    if app.config.get('CLAVE_TEMPORAL') and not app.config.get('TESTING'):
        app.logger.warning('SECRET_KEY no está configurada: se usa una clave temporal y las sesiones se cierran al reiniciar.')

    db.init_app(app)
    CORS(app, resources={r'/api/*': {'origins': app.config['CORS_ORIGENES']}}, allow_headers=['Content-Type', 'Authorization'])

    from .rutas import auth, reportes, sistema
    for modulo in (auth, reportes, sistema):
        app.register_blueprint(modulo.bp)

    from .semilla import comando_semilla, cargar_si_vacia
    app.cli.add_command(comando_semilla)

    _errores_json(app)

    with app.app_context():
        if app.config['AUTO_SEMILLA']:
            cargado = cargar_si_vacia()
            if cargado and not app.config.get('TESTING'):
                app.logger.info('Datos de demostración cargados: %s reportes y %s usuarios.', *cargado)
        else:
            db.create_all()
    return app


def _errores_json(app):
    """Las rutas /api siempre responden JSON, también cuando algo falla."""
    @app.errorhandler(HTTPException)
    def http(e):
        if request.path.startswith('/api/'):
            mensajes = {404: 'No se encontró el recurso.', 405: 'Método no permitido.', 413: 'La petición es demasiado grande.'}
            return error(mensajes.get(e.code, e.description), e.code)
        return e

    @app.errorhandler(Exception)
    def inesperado(e):
        db.session.rollback()
        logging.getLogger(__name__).exception('Error no controlado')
        return error('Ocurrió un error en el servidor. Intenta de nuevo.', 500)
