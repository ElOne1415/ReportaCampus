"""
Validaciones de los datos que llegan a la API. Los mensajes son los
mismos que muestra el frontend (src/models/reporte.js y usuario.js).
"""
import re

from .modelos import PRIORIDADES, ROLES

LIMITES = {'titulo_min': 8, 'titulo_max': 80, 'desc_min': 15, 'desc_max': 500}
NOTA_MIN = 10
CORREO = re.compile(r'^[^\s@]+@[^\s@]+\.[^\s@]{2,}$')
TRANSICIONES = {'Nuevo': ['En proceso'], 'En proceso': ['Resuelto'], 'Resuelto': ['En proceso']}


def _texto(d, clave):
    v = d.get(clave)
    return v.strip() if isinstance(v, str) else ''


def validar_reporte(d, categorias, zonas):
    errores = {}
    titulo, descripcion = _texto(d, 'titulo'), _texto(d, 'descripcion')
    if d.get('categoria') not in categorias:
        errores['categoria'] = 'Elige una categoría.'
    if d.get('ubicacion') not in zonas:
        errores['ubicacion'] = 'Elige la zona.'
    if len(titulo) < LIMITES['titulo_min']:
        errores['titulo'] = f"Escribe al menos {LIMITES['titulo_min']} caracteres."
    elif len(titulo) > LIMITES['titulo_max']:
        errores['titulo'] = f"Máximo {LIMITES['titulo_max']} caracteres."
    if len(descripcion) < LIMITES['desc_min']:
        errores['descripcion'] = f"Escribe al menos {LIMITES['desc_min']} caracteres."
    elif len(descripcion) > LIMITES['desc_max']:
        errores['descripcion'] = f"Máximo {LIMITES['desc_max']} caracteres."
    if d.get('prioridad') not in PRIORIDADES:
        errores['prioridad'] = 'Elige la prioridad.'
    return errores


def validar_cambio_estado(r, nuevo, nota):
    if nuevo not in TRANSICIONES.get(r.estado, []):
        return f'Un reporte {r.estado.lower()} no puede pasar a {str(nuevo).lower()}.'
    if nuevo == 'En proceso' and not r.responsable_id:
        return 'Asigna un responsable antes de ponerlo en proceso.'
    texto = (nota or '').strip()
    if nuevo == 'Resuelto' and len(texto) < NOTA_MIN:
        return f'Describe la solución (mínimo {NOTA_MIN} caracteres).'
    if r.estado == 'Resuelto' and len(texto) < NOTA_MIN:
        return f'Explica por qué se reabre (mínimo {NOTA_MIN} caracteres).'
    return None


def validar_usuario(d, correo_existente, categorias):
    """correo_existente(correo) -> True si otro usuario ya lo usa."""
    errores = {}
    nombre = _texto(d, 'nombre')
    correo = _texto(d, 'correo').lower()
    if len(nombre) < 3:
        errores['nombre'] = 'Escribe el nombre completo (mínimo 3 caracteres).'
    elif len(nombre) > 60:
        errores['nombre'] = 'Máximo 60 caracteres.'
    if not CORREO.match(correo) or len(correo) > 80:
        errores['correo'] = 'Escribe un correo válido.'
    elif correo_existente(correo):
        errores['correo'] = 'Ya existe un usuario con ese correo.'
    if d.get('rol') not in ROLES:
        errores['rol'] = 'Elige un rol.'
    if d.get('rol') == 'responsable':
        if len(_texto(d, 'area')) < 3:
            errores['area'] = 'Escribe el área o dependencia.'
        cats = [c for c in (d.get('categorias') or []) if c in categorias]
        if not cats:
            errores['categorias'] = 'Elige al menos una categoría que atiende.'
    return errores


def validar_contrasena_nueva(nueva):
    """Mínimo 8 caracteres con al menos una letra y un número."""
    if not isinstance(nueva, str) or len(nueva) < 8:
        return 'Usa al menos 8 caracteres.'
    if len(nueva) > 72:
        return 'Máximo 72 caracteres.'
    if not re.search(r'[A-Za-zÁÉÍÓÚáéíóúÑñ]', nueva) or not re.search(r'\d', nueva):
        return 'Combina letras y números.'
    return None
