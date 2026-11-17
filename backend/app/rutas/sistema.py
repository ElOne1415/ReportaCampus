"""Estado del servidor, catálogos, fotos y archivos del frontend."""
from flask import Blueprint, abort, current_app, send_from_directory
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

@bp.get('/')
def inicio():
    return send_from_directory(current_app.config['CARPETA_FRONTEND'], 'index.html')


@bp.get('/<carpeta>/<path:ruta>')
def archivos(carpeta, ruta):
    # Cada carpeta se sirve por separado: "src/../backend" no puede salir de src/
    if carpeta not in ('src', 'public'):
        abort(404)
    return send_from_directory(current_app.config['CARPETA_FRONTEND'] / carpeta, ruta)
