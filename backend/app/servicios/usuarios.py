"""Gestión de usuarios (solo administrador). Mismas reglas del frontend."""
from flask import current_app
from sqlalchemy import func, or_, select, update

from ..extensiones import db
from ..modelos import Categoria, Reporte, Usuario
from ..serializar import codigo_usuario
from ..seguridad import cifrar
from ..validacion import validar_usuario
from .auditoria import registrar
from .reportes import Fallo, tiene_abiertos

MSG_ABIERTOS = 'Este responsable tiene reportes sin resolver. Reasígnalos antes de {}.'


def obtener(numero):
    u = db.session.get(Usuario, numero) if numero else None
    if u is None:
        raise Fallo('El usuario no existe.', 404)
    return u


def listar(f):
    q = select(Usuario).order_by(Usuario.id)
    if f.get('rol'):
        q = q.where(Usuario.rol == f['rol'])
    if f.get('activo') in ('si', 'no'):
        q = q.where(Usuario.activo.is_(f['activo'] == 'si'))
    texto = (f.get('texto') or '').strip()
    if texto:
        p = f'%{texto}%'
        q = q.where(or_(Usuario.nombre.ilike(p), Usuario.correo.ilike(p), Usuario.area.ilike(p)))
    return db.session.scalars(q).all()


def responsables(categoria=None):
    lista = db.session.scalars(select(Usuario).where(Usuario.rol == 'responsable', Usuario.activo.is_(True))).all()
    return sorted(lista, key=lambda u: (categoria not in {c.id for c in u.categorias}, u.nombre))


def _admins_activos():
    return db.session.scalar(select(func.count()).select_from(Usuario).where(Usuario.rol == 'administrador', Usuario.activo.is_(True)))


def _validar(d, id_actual=None):
    categorias = {c.id: c for c in db.session.scalars(select(Categoria))}
    existe = lambda correo: db.session.scalar(select(Usuario.id).where(Usuario.correo == correo, Usuario.id != (id_actual or 0))) is not None
    errores = validar_usuario(d, existe, categorias)
    if errores:
        raise Fallo(errores=errores)
    return categorias


def _aplicar(u, d, categorias):
    u.nombre = d['nombre'].strip()
    u.correo = d['correo'].strip().lower()
    u.rol = d['rol']
    es_resp = d['rol'] == 'responsable'
    u.area = d.get('area', '').strip() if es_resp else ''
    u.categorias = [categorias[c] for c in (d.get('categorias') or []) if c in categorias] if es_resp else []


def crear(d, actor):
    categorias = _validar(d)
    u = Usuario(clave_hash=cifrar(current_app.config.get('CONTRASENA_INICIAL', 'campus2026')), activo=True)
    _aplicar(u, d, categorias)
    db.session.add(u)
    db.session.flush()
    registrar(actor, 'crear', 'usuario', codigo_usuario(u.id), f'{u.nombre} ({u.rol})')
    db.session.commit()
    return u


def editar(u, d, actor):
    categorias = _validar(d, u.id)
    if u.rol == 'responsable' and d.get('rol') != 'responsable' and tiene_abiertos(u.id):
        raise Fallo(MSG_ABIERTOS.format('cambiar su rol'))
    if u.rol == 'administrador' and d.get('rol') != 'administrador' and u.activo and _admins_activos() == 1:
        raise Fallo('Debe quedar al menos un administrador activo.')
    _aplicar(u, d, categorias)
    registrar(actor, 'editar', 'usuario', codigo_usuario(u.id), u.nombre)
    db.session.commit()
    return u


def cambiar_activo(u, activo, actor):
    if u.id == actor.id and not activo:
        raise Fallo('No puedes desactivar tu propia cuenta.')
    if not activo and u.rol == 'responsable' and tiene_abiertos(u.id):
        raise Fallo(MSG_ABIERTOS.format('desactivarlo'))
    if not activo and u.rol == 'administrador' and u.activo and _admins_activos() == 1:
        raise Fallo('Debe quedar al menos un administrador activo.')
    u.activo = bool(activo)
    registrar(actor, 'activar' if activo else 'desactivar', 'usuario', codigo_usuario(u.id), u.nombre)
    db.session.commit()
    return u


def eliminar(u, actor):
    if u.id == actor.id:
        raise Fallo('No puedes eliminar tu propia cuenta.')
    if u.rol == 'responsable' and tiene_abiertos(u.id):
        raise Fallo(MSG_ABIERTOS.format('eliminarlo'))
    if u.rol == 'administrador' and u.activo and _admins_activos() == 1:
        raise Fallo('Debe quedar al menos un administrador activo.')
    # Los reportes se conservan con el nombre guardado del autor y del responsable
    db.session.execute(update(Reporte).where(Reporte.autor_id == u.id).values(autor_id=None))
    db.session.execute(update(Reporte).where(Reporte.responsable_id == u.id).values(responsable_id=None))
    registrar(actor, 'eliminar', 'usuario', codigo_usuario(u.id), u.nombre)
    db.session.delete(u)
    db.session.commit()
