"""API REST de reportes."""
from flask import Blueprint, g, request

from .. import serializar as S
from ..respuestas import error, errores, ok
from ..seguridad import requiere_permiso
from ..servicios import reportes as servicio
from ..servicios.reportes import Fallo

bp = Blueprint('reportes', __name__, url_prefix='/api/reportes')


@bp.errorhandler(Fallo)
def fallo(e):
    return errores(e.errores, e.codigo) if e.errores else error(e.mensaje, e.codigo)


def _cuerpo():
    return request.get_json(silent=True) or {}


def _reporte(codigo):
    return servicio.obtener(S.numero(codigo, 'RC-'))


@bp.get('')
@requiere_permiso('reportes.ver')
def listar():
    a = request.args
    filtros = {k: a.get(k) for k in ('estado', 'categoria', 'zona', 'prioridad', 'texto')}
    filtros['abiertos'] = a.get('abiertos') in ('1', 'true')
    if a.get('autorId'):
        filtros['autor'] = S.numero(a['autorId'], 'u-') or -1
    if a.get('responsableId'):
        filtros['responsable'] = 'ninguno' if a['responsableId'] == 'ninguno' else (S.numero(a['responsableId'], 'u-') or -1)
    return ok(reportes=[S.reporte(r) for r in servicio.listar(filtros)])


@bp.get('/<codigo>')
@requiere_permiso('reportes.ver')
def obtener(codigo):
    return ok(reporte=S.reporte(_reporte(codigo)))


@bp.post('')
@requiere_permiso('reportes.crear')
def crear():
    return ok(reporte=S.reporte(servicio.crear(_cuerpo(), g.usuario))), 201


@bp.put('/<codigo>')
@requiere_permiso('reportes.ver')
def editar(codigo):
    return ok(reporte=S.reporte(servicio.editar(_reporte(codigo), _cuerpo(), g.usuario)))


@bp.delete('/<codigo>')
@requiere_permiso('reportes.ver')
def eliminar(codigo):
    servicio.eliminar(_reporte(codigo), g.usuario)
    return ok()


@bp.post('/<codigo>/asignacion')
@requiere_permiso('reportes.asignar')
def asignar(codigo):
    r, sin_cambios = servicio.asignar(_reporte(codigo), S.numero(_cuerpo().get('responsableId'), 'u-'), g.usuario)
    return ok(reporte=S.reporte(r), sinCambios=sin_cambios)


@bp.post('/<codigo>/tomar')
@requiere_permiso('reportes.tomar')
def tomar(codigo):
    return ok(reporte=S.reporte(servicio.tomar(_reporte(codigo), g.usuario)))


@bp.post('/<codigo>/estado')
@requiere_permiso('reportes.cambiarEstado')
def estado(codigo):
    d = _cuerpo()
    return ok(reporte=S.reporte(servicio.cambiar_estado(_reporte(codigo), d.get('estado'), d.get('nota'), g.usuario)))


@bp.patch('/<codigo>/prioridad')
@requiere_permiso('reportes.cambiarPrioridad')
def prioridad(codigo):
    r, sin_cambios = servicio.cambiar_prioridad(_reporte(codigo), _cuerpo().get('prioridad'), g.usuario)
    return ok(reporte=S.reporte(r), sinCambios=sin_cambios)


@bp.post('/<codigo>/notas')
@requiere_permiso('reportes.comentar')
def notas(codigo):
    return ok(reporte=S.reporte(servicio.comentar(_reporte(codigo), _cuerpo().get('nota'), g.usuario)))


@bp.post('/<codigo>/calificacion')
@requiere_permiso('reportes.calificar')
def calificacion(codigo):
    d = _cuerpo()
    return ok(reporte=S.reporte(servicio.calificar(_reporte(codigo), d.get('puntaje'), d.get('comentario'), g.usuario)))
