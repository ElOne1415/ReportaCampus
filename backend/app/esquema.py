"""
Genera el script SQL del esquema para SQL Server a partir de los
modelos, sin necesidad de conectarse a un servidor.

Uso:  python -m app.esquema  > sql/esquema-sqlserver.sql
"""
from sqlalchemy.dialects import mssql
from sqlalchemy.schema import CreateIndex, CreateTable

from .extensiones import db
from . import modelos  # noqa: F401  (registra las tablas)


def generar():
    dialecto = mssql.dialect()
    partes = ['-- Esquema de ReportaCampus para SQL Server', '-- Generado con: python -m app.esquema', '']
    for tabla in db.metadata.sorted_tables:
        partes.append(str(CreateTable(tabla).compile(dialect=dialecto)).strip() + ';\n')
        for indice in sorted(tabla.indexes, key=lambda i: i.name):
            partes.append(str(CreateIndex(indice).compile(dialect=dialecto)).strip() + ';\n')
    # Sin espacios al final de las líneas
    return '\n'.join(linea.rstrip() for linea in '\n'.join(partes).split('\n')).rstrip()


if __name__ == '__main__':
    print(generar())
