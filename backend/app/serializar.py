"""
Convierte los modelos al formato JSON que espera el frontend
(mismos nombres de campos que los datos locales: RC-0001, u-001...).
"""
from flask import request


def codigo_reporte(n):
    return f'RC-{n:04d}'


def codigo_usuario(n):
    return f'u-{n:03d}' if n is not None else None


def numero(codigo, prefijo):
    """'RC-0012' -> 12 ; 'u-003' -> 3 ; None si no es válido."""
    if not isinstance(codigo, str) or not codigo.startswith(prefijo):
        return None
    try:
        return int(codigo[len(prefijo):])
    except ValueError:
        return None


def fecha(f):
    return f.isoformat(timespec='seconds') + 'Z' if f else None


def nombre_con_area(u):
    if u is None:
        return None
    return f'{u.area} – {u.nombre}' if u.area else u.nombre


def usuario(u):
    return {
        'id': codigo_usuario(u.id), 'nombre': u.nombre, 'correo': u.correo, 'rol': u.rol,
        'area': u.area or '', 'categorias': [c.id for c in u.categorias], 'activo': u.activo, 'creado': fecha(u.creado)
    }


def url_foto(archivo):
    return request.host_url.rstrip('/') + '/api/fotos/' + archivo if archivo else None


def reporte(r):
    responsable = nombre_con_area(r.responsable) if r.responsable else r.responsable_nombre
    return {
        'id': codigo_reporte(r.id), 'titulo': r.titulo, 'descripcion': r.descripcion,
        'categoria': r.categoria_id, 'ubicacion': r.zona_id, 'prioridad': r.prioridad, 'estado': r.estado,
        'creado': fecha(r.creado), 'resuelto': fecha(r.resuelto),
        'autorId': codigo_usuario(r.autor_id), 'autor': r.autor_nombre,
        'responsableId': codigo_usuario(r.responsable_id), 'responsableNombre': responsable if r.responsable_id else None,
        'foto': bool(r.foto_archivo) or r.foto_simulada, 'fotoUrl': url_foto(r.foto_archivo),
        'calificacion': {'puntaje': r.calificacion, 'comentario': r.calificacion_comentario or ''} if r.calificacion else None,
        'historial': [{'estado': h.estado, 'fecha': fecha(h.fecha), 'nota': h.nota, 'por': h.por_nombre} for h in r.historial]
    }
