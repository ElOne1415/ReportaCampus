# Modelo de datos

Tablas de la base de datos (`backend/app/modelos.py`). El script para SQL Server está en [`backend/sql/esquema-sqlserver.sql`](../../backend/sql/esquema-sqlserver.sql). En el modo navegador se guardan los mismos datos como objetos JSON con los códigos `RC-0001` y `u-001`.

```mermaid
erDiagram
    USUARIOS ||--o{ REPORTES : "crea (autor_id)"
    USUARIOS ||--o{ REPORTES : "atiende (responsable_id)"
    USUARIOS ||--o{ RESPONSABLE_CATEGORIAS : atiende
    CATEGORIAS ||--o{ RESPONSABLE_CATEGORIAS : ""
    CATEGORIAS ||--o{ REPORTES : clasifica
    ZONAS ||--o{ REPORTES : ubica
    REPORTES ||--|{ HISTORIAL : tiene
    USUARIOS ||--o{ AUDITORIA : "hace"

    USUARIOS {
        int id PK "u-001"
        nvarchar nombre "60"
        varchar correo UK "80, minúsculas"
        varchar clave_hash "PBKDF2-SHA256"
        varchar rol "estudiante | responsable | administrador"
        nvarchar area "solo responsables"
        bit activo
        datetime2 creado
    }
    CATEGORIAS {
        varchar id PK "infraestructura, aseo, ..."
        nvarchar nombre
    }
    ZONAS {
        varchar id PK "bloque-a, biblioteca, ..."
        nvarchar nombre
        nvarchar detalle
    }
    RESPONSABLE_CATEGORIAS {
        int usuario_id PK, FK
        varchar categoria_id PK, FK
    }
    REPORTES {
        int id PK "RC-0001"
        nvarchar titulo "8 a 80"
        nvarchar descripcion "15 a 500"
        varchar categoria_id FK
        varchar zona_id FK
        varchar prioridad "Baja | Media | Alta"
        varchar estado "Nuevo | En proceso | Resuelto"
        int autor_id FK "NULL si se elimina la cuenta"
        nvarchar autor_nombre "copia del nombre"
        int responsable_id FK "NULL si no tiene"
        nvarchar responsable_nombre "copia: área – nombre"
        varchar foto_archivo "nombre aleatorio"
        bit foto_simulada "datos de demostración"
        int calificacion "1 a 5"
        nvarchar calificacion_comentario
        datetime2 creado
        datetime2 resuelto
    }
    HISTORIAL {
        int id PK
        int reporte_id FK "ON DELETE CASCADE"
        varchar estado
        nvarchar nota "300"
        nvarchar por_nombre
        int usuario_id
        datetime2 fecha
    }
    AUDITORIA {
        int id PK
        datetime2 fecha
        int usuario_id
        nvarchar usuario_nombre
        varchar accion "crear, asignar, resolver, ..."
        varchar entidad "reporte | usuario"
        varchar entidad_id "RC-0001 | u-001"
        nvarchar detalle
    }
```

Restricciones en la base de datos: rol, estado y prioridad con `CHECK`, calificación entre 1 y 5, correo único e índices por estado, responsable y autor.

Los nombres del autor y del responsable se copian en el reporte para que se conserven si la cuenta se elimina.
