# Modelo de datos

Estructura de los objetos que guarda la aplicación en esta fase. En la entrega final cada entidad será una tabla de SQL Server (ver [ADR-005](../decisiones_tecnicas/ADR-005-estrategia-backend.md)).

```mermaid
erDiagram
    USUARIO ||--o{ REPORTE : "crea (autorId)"
    USUARIO ||--o{ REPORTE : "atiende (responsableId)"
    REPORTE ||--|{ HISTORIAL : tiene
    CATEGORIA ||--o{ REPORTE : clasifica
    ZONA ||--o{ REPORTE : ubica
    USUARIO }o--o{ CATEGORIA : "atiende (responsables)"

    USUARIO {
        string id "u-001"
        string nombre
        string correo "único, en minúsculas"
        string rol "estudiante | responsable | administrador"
        string area "solo responsables"
        string[] categorias "solo responsables"
        bool activo
        date creado
    }
    REPORTE {
        string id "RC-0001, consecutivo"
        string titulo "8 a 80 caracteres"
        string descripcion "15 a 500 caracteres"
        string categoria
        string ubicacion "id de la zona"
        string prioridad "Baja | Media | Alta"
        string estado "Nuevo | En proceso | Resuelto"
        date creado
        date resuelto "null si no está resuelto"
        string autorId
        string autor "nombre al momento de crear"
        string responsableId "null si no tiene"
        string fotoUrl "data URL JPEG de 640 px o null"
    }
    HISTORIAL {
        string estado
        date fecha
        string nota
        string por "nombre de quien hizo el cambio"
    }
    CATEGORIA {
        string id "infraestructura, aseo, ..."
        string nombre
    }
    ZONA {
        string id "bloque-a, biblioteca, ..."
        string nombre
        string detalle
    }
```

Las categorías y zonas son catálogos fijos en `src/models/catalogos.js`.
