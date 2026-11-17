"""
Operaciones sobre reportes. Cada función revisa los permisos del usuario
y devuelve el reporte modificado o lanza Fallo con el mensaje y el código
HTTP. Las reglas son las mismas del servicio local del frontend.
"""
from sqlalchemy import or_, select

from .. import permisos as P
from ..extensiones import db
from ..modelos import PRIORIDADES, Categoria, Historial, Reporte, Usuario, Zona, ahora
from ..serializar import codigo_reporte, nombre_con_area
from ..validacion import NOTA_MIN, validar_cambio_estado, validar_reporte
from . import fotos
from .auditoria import registrar


class Fallo(Exception):
    def __init__(self, mensaje=None, codigo=400, errores=None):
        super().__init__(mensaje)
        self.mensaje, self.codigo, self.errores = mensaje, codigo, errores


SIN_PERMISO = 'No tienes permiso para hacer esto.'


def _catalogos():
    return set(db.session.scalars(select(Categoria.id))), set(db.session.scalars(select(Zona.id)))


def _historial(r, usuario, nota, estado=None):
    r.historial.append(Historial(estado=estado or r.estado, nota=nota, por_nombre=usuario.nombre, usuario_id=usuario.id, fecha=ahora()))


def obtener(numero):
    r = db.session.get(Reporte, numero) if numero else None
    if r is None:
        raise Fallo('El reporte no existe.', 404)
    return r


def listar(f):
    q = select(Reporte).order_by(Reporte.creado.desc())
    for campo, columna in (('estado', Reporte.estado), ('categoria', Reporte.categoria_id), ('zona', Reporte.zona_id), ('prioridad', Reporte.prioridad)):
        if f.get(campo):
            q = q.where(columna == f[campo])
    if f.get('abiertos'):
        q = q.where(Reporte.estado != 'Resuelto')
    if f.get('autor') is not None:
        q = q.where(Reporte.autor_id == f['autor'])
    if f.get('responsable') == 'ninguno':
        q = q.where(Reporte.responsable_id.is_(None))
    elif f.get('responsable') is not None:
        q = q.where(Reporte.responsable_id == f['responsable'])
    texto = (f.get('texto') or '').strip()
    if texto:
        patron = f'%{texto}%'
        zonas = select(Zona.id).where(Zona.nombre.ilike(patron))
        condicion = [Reporte.titulo.ilike(patron), Reporte.zona_id.in_(zonas)]
        digitos = ''.join(ch for ch in texto if ch.isdigit())
        if digitos and texto.upper().replace('-', '').replace('RC', '').strip().isdigit():
            condicion.append(Reporte.id == int(digitos))
        q = q.where(or_(*condicion))
    return db.session.scalars(q).unique().all()


def _datos_validos(d):
    categorias, zonas = _catalogos()
    errores = validar_reporte(d, categorias, zonas)
    if errores:
        raise Fallo(errores=errores)


def _aplicar_foto(r, valor):
    """data URL nueva -> se guarda; None -> se quita; URL existente o ausente -> se conserva."""
    if isinstance(valor, str) and valor.startswith('data:'):
        try:
            nuevo = fotos.guardar_data_url(valor)
        except fotos.FotoInvalida as e:
            raise Fallo(errores={'foto': str(e)})
        fotos.borrar(r.foto_archivo)
        r.foto_archivo = nuevo
    elif valor is None:
        fotos.borrar(r.foto_archivo)
        r.foto_archivo = None
        r.foto_simulada = False


def crear(d, usuario):
    if not P.puede(usuario, 'reportes.crear'):
        raise Fallo(SIN_PERMISO, 403)
    _datos_validos(d)
    r = Reporte(titulo=d['titulo'].strip(), descripcion=d['descripcion'].strip(), categoria_id=d['categoria'], zona_id=d['ubicacion'],
                prioridad=d['prioridad'], estado='Nuevo', autor_id=usuario.id, autor_nombre=usuario.nombre, creado=ahora())
    if d.get('fotoUrl'):
        _aplicar_foto(r, d['fotoUrl'])
    _historial(r, usuario, 'Reporte enviado desde la plataforma.', 'Nuevo')
    db.session.add(r)
    db.session.flush()
    registrar(usuario, 'crear', 'reporte', codigo_reporte(r.id), r.titulo)
    db.session.commit()
    return r


def editar(r, d, usuario):
    if not P.puede_editar(usuario, r):
        raise Fallo('Solo puedes editar tus reportes mientras están en estado Nuevo.', 403)
    _datos_validos(d)
    r.titulo, r.descripcion = d['titulo'].strip(), d['descripcion'].strip()
    r.categoria_id, r.zona_id, r.prioridad = d['categoria'], d['ubicacion'], d['prioridad']
    if 'fotoUrl' in d:
        _aplicar_foto(r, d['fotoUrl'])
    _historial(r, usuario, 'El autor editó el reporte.')
    registrar(usuario, 'editar', 'reporte', codigo_reporte(r.id))
    db.session.commit()
    return r


def eliminar(r, usuario):
    if not P.puede_eliminar(usuario, r):
        raise Fallo('Solo puedes eliminar tus reportes mientras están en estado Nuevo.', 403)
    fotos.borrar(r.foto_archivo)
    registrar(usuario, 'eliminar', 'reporte', codigo_reporte(r.id), r.titulo)
    db.session.delete(r)
    db.session.commit()


def asignar(r, responsable_numero, usuario):
    if not P.puede(usuario, 'reportes.asignar'):
        raise Fallo(SIN_PERMISO, 403)
    resp = db.session.get(Usuario, responsable_numero) if responsable_numero else None
    if not resp or resp.rol != 'responsable' or not resp.activo:
        raise Fallo('Elige un responsable activo.')
    if r.estado == 'Resuelto':
        raise Fallo('Reabre el reporte antes de cambiar el responsable.')
    if r.responsable_id == resp.id:
        return r, True
    nota = ('Reasignado a ' if r.responsable_id else 'Asignado a ') + nombre_con_area(resp) + '.'
    r.responsable_id, r.responsable_nombre = resp.id, nombre_con_area(resp)
    if r.estado == 'Nuevo':
        r.estado = 'En proceso'
    _historial(r, usuario, nota)
    registrar(usuario, 'asignar', 'reporte', codigo_reporte(r.id), nota)
    db.session.commit()
    return r, False


def tomar(r, usuario):
    """El responsable toma un reporte nuevo de una de sus categorías."""
    if not P.puede_tomar(usuario, r):
        raise Fallo('Solo puedes tomar reportes nuevos sin asignar de tus categorías.', 403)
    r.responsable_id, r.responsable_nombre, r.estado = usuario.id, nombre_con_area(usuario), 'En proceso'
    _historial(r, usuario, 'Tomado por ' + nombre_con_area(usuario) + '.')
    registrar(usuario, 'tomar', 'reporte', codigo_reporte(r.id))
    db.session.commit()
    return r


def cambiar_estado(r, estado, nota, usuario):
    if not P.puede_cambiar_estado(usuario, r):
        raise Fallo(SIN_PERMISO, 403)
    if r.estado == 'Resuelto' and usuario.rol != 'administrador':
        raise Fallo('Solo el administrador puede reabrir un reporte.', 403)
    problema = validar_cambio_estado(r, estado, nota)
    if problema:
        raise Fallo(problema)
    texto = (nota or '').strip()
    r.estado = estado
    r.resuelto = ahora() if estado == 'Resuelto' else None
    if estado != 'Resuelto':
        r.calificacion, r.calificacion_comentario = None, None
    _historial(r, usuario, texto or ('Reporte resuelto.' if estado == 'Resuelto' else 'Reporte en atención.'))
    registrar(usuario, 'reabrir' if estado == 'En proceso' else 'resolver', 'reporte', codigo_reporte(r.id), texto)
    db.session.commit()
    return r


def cambiar_prioridad(r, prioridad, usuario):
    if not P.puede(usuario, 'reportes.cambiarPrioridad'):
        raise Fallo(SIN_PERMISO, 403)
    if prioridad not in PRIORIDADES:
        raise Fallo('Prioridad no válida.')
    if r.prioridad == prioridad:
        return r, True
    _historial(r, usuario, f'Prioridad cambiada de {r.prioridad} a {prioridad}.')
    r.prioridad = prioridad
    registrar(usuario, 'prioridad', 'reporte', codigo_reporte(r.id), prioridad)
    db.session.commit()
    return r, False


def comentar(r, nota, usuario):
    if not P.puede_comentar(usuario, r):
        raise Fallo(SIN_PERMISO, 403)
    texto = (nota or '').strip()
    if len(texto) < NOTA_MIN:
        raise Fallo(f'Escribe al menos {NOTA_MIN} caracteres.')
    if len(texto) > 300:
        raise Fallo('Máximo 300 caracteres.')
    _historial(r, usuario, texto)
    db.session.commit()
    return r


def calificar(r, puntaje, comentario, usuario):
    """El autor califica la solución (1 a 5) una sola vez, cuando el reporte está resuelto."""
    if not P.puede_calificar(usuario, r):
        raise Fallo('Solo el autor puede calificar su reporte resuelto, una vez.', 403)
    if not isinstance(puntaje, int) or isinstance(puntaje, bool) or not 1 <= puntaje <= 5:
        raise Fallo(errores={'puntaje': 'Elige de 1 a 5 estrellas.'})
    comentario = (comentario or '').strip()
    if len(comentario) > 300:
        raise Fallo(errores={'comentario': 'Máximo 300 caracteres.'})
    r.calificacion, r.calificacion_comentario = puntaje, comentario or None
    _historial(r, usuario, f'Calificó la solución con {puntaje} de 5.' + (f' «{comentario}»' if comentario else ''))
    registrar(usuario, 'calificar', 'reporte', codigo_reporte(r.id), str(puntaje))
    db.session.commit()
    return r


def tiene_abiertos(responsable_id):
    return db.session.scalar(select(Reporte.id).where(Reporte.responsable_id == responsable_id, Reporte.estado != 'Resuelto').limit(1)) is not None
