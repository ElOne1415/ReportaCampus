"""
Fotos de los reportes. El frontend envía la imagen ya reducida como
data URL (data:image/jpeg;base64,...). Aquí se valida que de verdad
sea una imagen JPEG, PNG o WebP y que no pase del tamaño máximo, y se
guarda en CARPETA_FOTOS con un nombre aleatorio.
"""
import base64
import binascii
import secrets

from flask import current_app

FIRMAS = {b'\xff\xd8\xff': 'jpg', b'\x89PNG\r\n\x1a\n': 'png', b'RIFF': 'webp'}


class FotoInvalida(ValueError):
    pass


def guardar_data_url(data_url):
    if not isinstance(data_url, str) or not data_url.startswith('data:image/') or ';base64,' not in data_url:
        raise FotoInvalida('La foto debe ser una imagen.')
    try:
        contenido = base64.b64decode(data_url.split(';base64,', 1)[1], validate=True)
    except (binascii.Error, ValueError):
        raise FotoInvalida('No se pudo leer la imagen.')
    if len(contenido) > current_app.config['FOTO_MAX_BYTES']:
        raise FotoInvalida('La foto es demasiado grande.')
    extension = next((ext for firma, ext in FIRMAS.items() if contenido.startswith(firma)), None)
    if extension == 'webp' and contenido[8:12] != b'WEBP':
        extension = None
    if not extension:
        raise FotoInvalida('La foto debe ser JPEG, PNG o WebP.')
    carpeta = current_app.config['CARPETA_FOTOS']
    carpeta.mkdir(parents=True, exist_ok=True)
    nombre = secrets.token_hex(12) + '.' + extension
    (carpeta / nombre).write_bytes(contenido)
    return nombre


def borrar(nombre):
    if nombre:
        ruta = current_app.config['CARPETA_FOTOS'] / nombre
        if ruta.is_file():
            ruta.unlink()
