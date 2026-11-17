"""Registro de auditoría de las acciones que cambian datos."""
from ..extensiones import db
from ..modelos import Auditoria


def registrar(usuario, accion, entidad, entidad_id, detalle=''):
    db.session.add(Auditoria(
        usuario_id=usuario.id if usuario else None,
        usuario_nombre=usuario.nombre if usuario else 'Sistema',
        accion=accion, entidad=entidad, entidad_id=str(entidad_id), detalle=(detalle or '')[:300]
    ))
