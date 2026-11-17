"""Inicio de sesión, usuario actual y cambio de contraseña."""
from flask import Blueprint, current_app, g, request
from sqlalchemy import select

from .. import serializar
from ..extensiones import db
from ..modelos import Usuario
from ..respuestas import error, errores, ok
from ..seguridad import cifrar, crear_token, requiere_sesion, verificar
from ..servicios.auditoria import registrar
from ..validacion import CORREO, validar_contrasena_nueva

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Una cuenta de cada rol para entrar con un clic (solo si MOSTRAR_CUENTAS_DEMO=1)
CUENTAS_DEMO = ('valentina.martinez@campus.edu.co', 'diana.rojas@campus.edu.co', 'admin@campus.edu.co')

# Hash de referencia para tardar lo mismo cuando el correo no existe
_HASH_FALSO = None


@bp.post('/login')
def login():
    global _HASH_FALSO
    d = request.get_json(silent=True) or {}
    correo = str(d.get('correo') or '').strip().lower()
    contrasena = d.get('contrasena') or ''
    faltan = {}
    if not CORREO.match(correo):
        faltan['correo'] = 'Escribe un correo válido.'
    if not contrasena:
        faltan['contrasena'] = 'Escribe la contraseña.'
    if faltan:
        return errores(faltan)

    u = db.session.scalar(select(Usuario).where(Usuario.correo == correo))
    if u is None:
        _HASH_FALSO = _HASH_FALSO or cifrar('no-existe')
        verificar(_HASH_FALSO, contrasena)
        return error('El correo o la contraseña no son correctos.', 401)
    if not verificar(u.clave_hash, contrasena):
        return error('El correo o la contraseña no son correctos.', 401)
    if not u.activo:
        return error('Esta cuenta está desactivada. Habla con el administrador.', 403)
    return ok(token=crear_token(u), usuario=serializar.usuario(u))


@bp.get('/yo')
@requiere_sesion
def yo():
    return ok(usuario=serializar.usuario(g.usuario))


@bp.post('/contrasena')
@requiere_sesion
def cambiar_contrasena():
    d = request.get_json(silent=True) or {}
    if not verificar(g.usuario.clave_hash, d.get('actual') or ''):
        return errores({'actual': 'La contraseña actual no es correcta.'})
    problema = validar_contrasena_nueva(d.get('nueva'))
    if problema:
        return errores({'nueva': problema})
    if d.get('nueva') == d.get('actual'):
        return errores({'nueva': 'La nueva contraseña debe ser distinta de la actual.'})
    g.usuario.clave_hash = cifrar(d['nueva'])
    registrar(g.usuario, 'cambiar_contrasena', 'usuario', serializar.codigo_usuario(g.usuario.id))
    db.session.commit()
    return ok()


@bp.get('/cuentas-demo')
def cuentas_demo():
    if not current_app.config['MOSTRAR_CUENTAS_DEMO']:
        return ok(cuentas=[])
    lista = db.session.scalars(select(Usuario).where(Usuario.correo.in_(CUENTAS_DEMO), Usuario.activo.is_(True))).all()
    orden = {c: i for i, c in enumerate(CUENTAS_DEMO)}
    return ok(cuentas=[serializar.usuario(u) for u in sorted(lista, key=lambda u: orden[u.correo])])
