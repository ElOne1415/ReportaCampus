"""
Autenticación: contraseñas cifradas y tokens de sesión (JWT).

- Las contraseñas se guardan con werkzeug (PBKDF2 con sal), nunca en texto.
- Al iniciar sesión se entrega un token firmado con SECRET_KEY que vence
  en JWT_HORAS. El frontend lo envía en la cabecera Authorization.
- En cada petición se vuelve a leer el usuario: si se desactivó o se
  eliminó, el token deja de servir.
"""
from datetime import timedelta
from functools import wraps

import jwt
from flask import current_app, g, request
from werkzeug.security import check_password_hash, generate_password_hash

from .extensiones import db
from .modelos import Usuario, ahora
from .permisos import puede
from .respuestas import error, SIN_PERMISO, SIN_SESION

ALGORITMO = 'HS256'


def cifrar(contrasena):
    return generate_password_hash(contrasena, method='pbkdf2:sha256:600000')


def verificar(clave_hash, contrasena):
    return bool(clave_hash) and check_password_hash(clave_hash, contrasena or '')


def crear_token(usuario):
    inicio = ahora()
    datos = {'sub': str(usuario.id), 'rol': usuario.rol, 'iat': inicio, 'exp': inicio + timedelta(hours=current_app.config['JWT_HORAS'])}
    return jwt.encode(datos, current_app.config['SECRET_KEY'], algorithm=ALGORITMO)


def usuario_del_token():
    cabecera = request.headers.get('Authorization', '')
    if not cabecera.startswith('Bearer '):
        return None
    try:
        datos = jwt.decode(cabecera[7:], current_app.config['SECRET_KEY'], algorithms=[ALGORITMO])
    except jwt.PyJWTError:
        return None
    u = db.session.get(Usuario, int(datos.get('sub', 0)))
    return u if u and u.activo else None


def requiere_sesion(f):
    @wraps(f)
    def envoltura(*args, **kwargs):
        g.usuario = usuario_del_token()
        if g.usuario is None:
            return error(SIN_SESION, 401)
        return f(*args, **kwargs)
    return envoltura


def requiere_permiso(permiso):
    def decorador(f):
        @wraps(f)
        @requiere_sesion
        def envoltura(*args, **kwargs):
            if not puede(g.usuario, permiso):
                return error(SIN_PERMISO, 403)
            return f(*args, **kwargs)
        return envoltura
    return decorador
