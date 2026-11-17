"""Respuestas JSON con la misma forma que usan los servicios del frontend."""
from flask import jsonify


def ok(**datos):
    return jsonify({'ok': True, **datos})


def error(mensaje, codigo=400):
    return jsonify({'ok': False, 'error': mensaje}), codigo


def errores(por_campo, codigo=400):
    return jsonify({'ok': False, 'errores': por_campo}), codigo


SIN_PERMISO = 'No tienes permiso para hacer esto.'
SIN_SESION = 'Tu sesión terminó. Inicia sesión de nuevo.'
