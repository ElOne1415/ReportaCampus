"""
Carga los datos de demostración (backend/datos/semilla.json) en la base
de datos. Los mismos datos que usa el frontend en modo local.

Uso:
    flask --app run semilla            (borra todo y vuelve a cargar)
Al iniciar, si AUTO_SEMILLA=1 y la base está vacía, se carga sola.
"""
import json
from datetime import timedelta

import click
from flask import current_app
from sqlalchemy import select, func

from .extensiones import db
from .modelos import Auditoria, Categoria, Historial, Reporte, Usuario, Zona, ahora
from .seguridad import cifrar


def _leer():
    with open(current_app.config['SEMILLA'], encoding='utf-8') as f:
        return json.load(f)


def cargar(borrar_todo=True):
    datos = _leer()
    if borrar_todo:
        db.drop_all()
    db.create_all()

    # Corre las fechas por días completos para que la semilla quede al día
    # y cada reporte conserve su hora del día.
    from datetime import datetime
    exportado = datetime.fromisoformat(datos['exportadoEn'].replace('Z', '+00:00')).replace(tzinfo=None)
    referencia = exportado + timedelta(days=max(0, (ahora() - exportado).days))
    cuando = lambda horas: referencia - timedelta(hours=horas) if horas is not None else None

    categorias = {c['id']: Categoria(**c) for c in datos['categorias']}
    db.session.add_all(categorias.values())
    db.session.add_all(Zona(**z) for z in datos['zonas'])

    clave = cifrar(datos['contrasenaDemo'])  # todas las cuentas de demostración usan la misma
    usuarios = {}
    for u in datos['usuarios']:
        usuarios[u['id']] = Usuario(id=u['id'], nombre=u['nombre'], correo=u['correo'], clave_hash=clave, rol=u['rol'],
                                    area=u['area'], activo=u['activo'], creado=referencia - timedelta(days=200),
                                    categorias=[categorias[c] for c in u['categorias']])
    db.session.add_all(usuarios.values())
    db.session.flush()

    con_area = lambda u: f'{u.area} – {u.nombre}' if u and u.area else (u.nombre if u else None)
    por_nombre = {u.nombre: u.id for u in usuarios.values()}
    for r in datos['reportes']:
        resp = usuarios.get(r['responsable'])
        cal = r.get('calificacion') or {}
        reporte = Reporte(
            id=r['id'], titulo=r['titulo'], descripcion=r['descripcion'], categoria_id=r['categoria'], zona_id=r['zona'],
            prioridad=r['prioridad'], estado=r['estado'], autor_id=r['autor'], autor_nombre=r['autorNombre'],
            responsable_id=r['responsable'], responsable_nombre=con_area(resp), foto_simulada=r['fotoSimulada'],
            calificacion=cal.get('puntaje'), calificacion_comentario=cal.get('comentario') or None,
            creado=cuando(r['creadoHace']), resuelto=cuando(r['resueltoHace']),
            historial=[Historial(estado=h['estado'], nota=h['nota'], por_nombre=h['por'], usuario_id=por_nombre.get(h['por']),
                                 fecha=cuando(h['hace'])) for h in r['historial']]
        )
        db.session.add(reporte)
    db.session.commit()
    _ajustar_identidades()
    return len(datos['reportes']), len(datos['usuarios'])


def _ajustar_identidades():
    """En SQL Server los id se insertaron a mano; se reinicia el contador para los nuevos."""
    if db.engine.dialect.name == 'mssql':
        for tabla in ('usuarios', 'reportes'):
            db.session.execute(db.text(f"DBCC CHECKIDENT ('{tabla}', RESEED)"))
        db.session.commit()


def cargar_si_vacia():
    db.create_all()
    if db.session.scalar(select(func.count()).select_from(Usuario)) == 0:
        return cargar(borrar_todo=False)
    return None


@click.command('semilla')
def comando_semilla():
    """Borra la base de datos y carga los datos de demostración."""
    reportes, usuarios = cargar()
    click.echo(f'Datos cargados: {reportes} reportes y {usuarios} usuarios.')
