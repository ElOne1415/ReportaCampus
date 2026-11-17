"""Estado del servidor, catálogos, fotos y archivos del frontend."""
from flask import Blueprint, abort, current_app, make_response, send_from_directory
from sqlalchemy import select

from ..extensiones import db
from ..modelos import Categoria, Zona
from ..respuestas import ok

bp = Blueprint('sistema', __name__)


@bp.get('/api/salud')
def salud():
    """El frontend llama aquí al cargar para saber si hay servidor."""
    db.session.execute(select(1))
    return ok(version=current_app.config['VERSION'], baseDatos=db.engine.dialect.name)


@bp.get('/api/catalogos')
def catalogos():
    return ok(
        categorias=[{'id': c.id, 'nombre': c.nombre} for c in db.session.scalars(select(Categoria))],
        zonas=[{'id': z.id, 'nombre': z.nombre, 'detalle': z.detalle} for z in db.session.scalars(select(Zona))]
    )


@bp.get('/api/fotos/<path:nombre>')
def foto(nombre):
    return send_from_directory(current_app.config['CARPETA_FOTOS'], nombre, max_age=86400)


# ---------- Frontend ----------
# Solo se publican index.html, src/ y public/; nunca backend/, .env ni otros archivos.

MARCA_API = '<meta name="reportacampus-api" content="api">'


@bp.get('/')
@bp.get('/index.html')
def inicio():
    """index.html con una marca que le indica al frontend que use esta API."""
    html = (current_app.config['CARPETA_FRONTEND'] / 'index.html').read_text(encoding='utf-8')
    respuesta = make_response(html.replace('</head>', '  ' + MARCA_API + '\n</head>', 1))
    respuesta.headers['Content-Type'] = 'text/html; charset=utf-8'
    respuesta.headers['Cache-Control'] = 'no-cache'
    return respuesta


@bp.get('/<carpeta>/<path:ruta>')
def archivos(carpeta, ruta):
    # Cada carpeta se sirve por separado: "src/../backend" no puede salir de src/
    if carpeta not in ('src', 'public'):
        abort(404)
    return send_from_directory(current_app.config['CARPETA_FRONTEND'] / carpeta, ruta)
