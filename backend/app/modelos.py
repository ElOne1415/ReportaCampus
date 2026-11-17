"""
Modelos de la base de datos (SQLAlchemy).

Funcionan igual con SQLite (desarrollo y pruebas) y con SQL Server
(mssql+pyodbc). El esquema para SQL Server se genera con
`python -m app.esquema` en backend/sql/esquema-sqlserver.sql.
"""
from datetime import datetime, timezone

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Integer, String, Table, Column, Index, Unicode
from sqlalchemy.dialects import mssql
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .extensiones import db

ROLES = ('estudiante', 'responsable', 'administrador')
ESTADOS = ('Nuevo', 'En proceso', 'Resuelto')
PRIORIDADES = ('Baja', 'Media', 'Alta')


# Texto con tildes: NVARCHAR en SQL Server. Fechas: DATETIME2 en SQL Server.
Texto = Unicode
Fecha = DateTime().with_variant(mssql.DATETIME2(), 'mssql')


def ahora():
    """Fecha y hora actual en UTC sin zona (se guarda así en la base de datos)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


responsable_categorias = Table(
    'responsable_categorias', db.metadata,
    Column('usuario_id', Integer, ForeignKey('usuarios.id', ondelete='CASCADE'), primary_key=True),
    Column('categoria_id', String(20), ForeignKey('categorias.id'), primary_key=True),
)


class Categoria(db.Model):
    __tablename__ = 'categorias'
    id: Mapped[str] = mapped_column(String(20), primary_key=True)
    nombre: Mapped[str] = mapped_column(Texto(40))


class Zona(db.Model):
    __tablename__ = 'zonas'
    id: Mapped[str] = mapped_column(String(20), primary_key=True)
    nombre: Mapped[str] = mapped_column(Texto(40))
    detalle: Mapped[str] = mapped_column(Texto(60), default='')


class Usuario(db.Model):
    __tablename__ = 'usuarios'
    __table_args__ = (CheckConstraint("rol IN ('estudiante','responsable','administrador')", name='ck_usuarios_rol'),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nombre: Mapped[str] = mapped_column(Texto(60))
    correo: Mapped[str] = mapped_column(String(80), unique=True)
    clave_hash: Mapped[str] = mapped_column(String(255))
    rol: Mapped[str] = mapped_column(String(15))
    area: Mapped[str] = mapped_column(Texto(40), default='')
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    creado: Mapped[datetime] = mapped_column(Fecha, default=ahora)

    categorias: Mapped[list[Categoria]] = relationship(secondary=responsable_categorias, lazy='selectin', order_by=Categoria.id)


class Reporte(db.Model):
    __tablename__ = 'reportes'
    __table_args__ = (
        CheckConstraint("estado IN ('Nuevo','En proceso','Resuelto')", name='ck_reportes_estado'),
        CheckConstraint("prioridad IN ('Baja','Media','Alta')", name='ck_reportes_prioridad'),
        CheckConstraint('calificacion IS NULL OR (calificacion BETWEEN 1 AND 5)', name='ck_reportes_calificacion'),
        Index('ix_reportes_estado', 'estado'),
        Index('ix_reportes_responsable', 'responsable_id', 'estado'),
        Index('ix_reportes_autor', 'autor_id'),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    titulo: Mapped[str] = mapped_column(Texto(80))
    descripcion: Mapped[str] = mapped_column(Texto(500))
    categoria_id: Mapped[str] = mapped_column(String(20), ForeignKey('categorias.id'))
    zona_id: Mapped[str] = mapped_column(String(20), ForeignKey('zonas.id'))
    prioridad: Mapped[str] = mapped_column(String(5))
    estado: Mapped[str] = mapped_column(String(10), default='Nuevo')
    # El nombre del autor se copia para conservarlo si su cuenta se elimina
    autor_id: Mapped[int | None] = mapped_column(Integer, ForeignKey('usuarios.id', ondelete='SET NULL'), nullable=True)
    autor_nombre: Mapped[str] = mapped_column(Texto(60))
    responsable_id: Mapped[int | None] = mapped_column(Integer, ForeignKey('usuarios.id', ondelete='NO ACTION'), nullable=True)
    # "Planta física – Diana Rojas" al momento de asignar (se conserva si se elimina la cuenta)
    responsable_nombre: Mapped[str | None] = mapped_column(Texto(110), nullable=True)
    foto_archivo: Mapped[str | None] = mapped_column(String(200), nullable=True)
    foto_simulada: Mapped[bool] = mapped_column(Boolean, default=False)
    calificacion: Mapped[int | None] = mapped_column(Integer, nullable=True)
    calificacion_comentario: Mapped[str | None] = mapped_column(Texto(300), nullable=True)
    creado: Mapped[datetime] = mapped_column(Fecha, default=ahora)
    resuelto: Mapped[datetime | None] = mapped_column(Fecha, nullable=True)

    responsable: Mapped[Usuario | None] = relationship(foreign_keys=[responsable_id], lazy='joined')
    historial: Mapped[list['Historial']] = relationship(back_populates='reporte', cascade='all, delete-orphan',
                                                        order_by='Historial.id', lazy='selectin')


class Historial(db.Model):
    __tablename__ = 'historial'
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    reporte_id: Mapped[int] = mapped_column(Integer, ForeignKey('reportes.id', ondelete='CASCADE'), index=True)
    estado: Mapped[str] = mapped_column(String(10))
    nota: Mapped[str] = mapped_column(Texto(300))
    por_nombre: Mapped[str] = mapped_column(Texto(60))
    usuario_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    fecha: Mapped[datetime] = mapped_column(Fecha, default=ahora)

    reporte: Mapped[Reporte] = relationship(back_populates='historial')


class Auditoria(db.Model):
    """Registro de las acciones que cambian datos."""
    __tablename__ = 'auditoria'
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    fecha: Mapped[datetime] = mapped_column(Fecha, default=ahora, index=True)
    usuario_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    usuario_nombre: Mapped[str] = mapped_column(Texto(60))
    accion: Mapped[str] = mapped_column(String(40))
    entidad: Mapped[str] = mapped_column(String(20))
    entidad_id: Mapped[str] = mapped_column(String(20))
    detalle: Mapped[str] = mapped_column(Texto(300), default='')
