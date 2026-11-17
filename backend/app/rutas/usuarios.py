"""API REST de usuarios, auditoría y datos de demostración (administrador)."""
from flask import Blueprint, g, request
from sqlalchemy import select

from .. import serializar as S
from ..extensiones import db
from ..modelos import Auditoria
from ..respuestas import error, errores, ok
from ..seguridad import requiere_permiso
from ..servicios import usuarios as servicio
from ..servicios.reportes import Fallo
from ..semilla import cargar

bp = Blueprint('usuarios', __name__, url_prefix='/api')


@bp.errorhandler(Fallo)
def fallo(e):
    return errores(e.errores, e.codigo) if e.errores else error(e.mensaje, e.codigo)


def _usuario(codigo):
    return servicio.obtener(S.numero(codigo, 'u-'))


@bp.get('/usuarios')
@requiere_permiso('usuarios.gestionar')
def listar():
    return ok(usuarios=[S.usuario(u) for u in servicio.listar(request.args)])


@bp.get('/usuarios/responsables')
@requiere_permiso('reportes.asignar')
def responsables():
    return ok(usuarios=[S.usuario(u) for u in servicio.responsables(request.args.get('categoria'))])


@bp.get('/usuarios/<codigo>')
@requiere_permiso('usuarios.gestionar')
def obtener(codigo):
    return ok(usuario=S.usuario(_usuario(codigo)))


@bp.post('/usuarios')
@requiere_permiso('usuarios.gestionar')
def crear():
    return ok(usuario=S.usuario(servicio.crear(request.get_json(silent=True) or {}, g.usuario))), 201


@bp.put('/usuarios/<codigo>')
@requiere_permiso('usuarios.gestionar')
def editar(codigo):
    return ok(usuario=S.usuario(servicio.editar(_usuario(codigo), request.get_json(silent=True) or {}, g.usuario)))


@bp.patch('/usuarios/<codigo>/activo')
@requiere_permiso('usuarios.gestionar')
def activo(codigo):
    valor = (request.get_json(silent=True) or {}).get('activo')
    if not isinstance(valor, bool):
        return error('Indica si la cuenta queda activa (true o false).')
    return ok(usuario=S.usuario(servicio.cambiar_activo(_usuario(codigo), valor, g.usuario)))


@bp.delete('/usuarios/<codigo>')
@requiere_permiso('usuarios.gestionar')
def eliminar(codigo):
    servicio.eliminar(_usuario(codigo), g.usuario)
    return ok()


@bp.get('/auditoria')
@requiere_permiso('auditoria.ver')
def auditoria():
    limite = min(max(request.args.get('limite', 50, type=int), 1), 200)
    filas = db.session.scalars(select(Auditoria).order_by(Auditoria.id.desc()).limit(limite))
    return ok(registros=[{
        'fecha': S.fecha(a.fecha), 'usuario': a.usuario_nombre, 'accion': a.accion,
        'entidad': a.entidad, 'entidadId': a.entidad_id, 'detalle': a.detalle
    } for a in filas])


@bp.post('/datos/restablecer')
@requiere_permiso('datos.restablecer')
def restablecer():
    """Vuelve a los datos de demostración (borra todo lo demás)."""
    db.session.remove()
    reportes, usuarios = cargar()
    return ok(reportes=reportes, usuarios=usuarios)
