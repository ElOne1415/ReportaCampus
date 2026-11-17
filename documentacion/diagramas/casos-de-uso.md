# Casos de uso por rol

Estado final (v1.0.0). Todos los casos están implementados con el servidor y en el modo navegador.

```mermaid
flowchart LR
    E((Estudiante))
    R((Responsable))
    A((Administrador))

    subgraph Comunes["Todos los roles"]
        CU1[Iniciar y cerrar sesión]
        CU2[Cambiar su contraseña]
        CU3[Ver panel de indicadores]
        CU4[Buscar y filtrar reportes]
        CU5[Ver detalle e historial]
        CU6[Ver zonas del campus]
        CU7[Crear reporte con foto]
    end

    subgraph Est["Estudiante"]
        CU8[Ver mis reportes por estado]
        CU9[Editar o eliminar mi reporte en Nuevo]
        CU10[Calificar la solución de 1 a 5]
    end

    subgraph Resp["Responsable"]
        CU11[Ver mis asignaciones por urgencia]
        CU12[Ver alertas de más de 48 horas]
        CU13[Tomar reportes nuevos de mi categoría]
        CU14[Agregar notas y resolver con nota]
        CU15[Exportar CSV]
    end

    subgraph Adm["Administrador"]
        CU16[Asignar o reasignar responsable]
        CU17[Cambiar prioridad, reabrir y eliminar]
        CU18[Gestionar usuarios]
        CU19[Ver la actividad]
        CU20[Restablecer datos de demostración]
    end

    E --- Comunes
    R --- Comunes
    A --- Comunes
    E --- Est
    R --- Resp
    A --- Adm
    A --- CU14
    A --- CU15
```

| Caso | Rol | Endpoint del backend |
|---|---|---|
| Iniciar sesión | Todos | `POST /api/auth/login` |
| Cambiar contraseña | Todos | `POST /api/auth/contrasena` |
| Crear reporte con foto | Todos | `POST /api/reportes` |
| Editar o eliminar reporte propio | Estudiante | `PUT` / `DELETE /api/reportes/{id}` |
| Calificar la solución | Estudiante | `POST /api/reportes/{id}/calificacion` |
| Tomar reporte | Responsable | `POST /api/reportes/{id}/tomar` |
| Agregar nota / resolver / reabrir | Responsable asignado, administrador | `POST /api/reportes/{id}/notas`, `/estado` |
| Asignar responsable | Administrador | `POST /api/reportes/{id}/asignacion` |
| Cambiar prioridad | Administrador | `PATCH /api/reportes/{id}/prioridad` |
| Gestionar usuarios | Administrador | `/api/usuarios` |
| Ver actividad | Administrador | `GET /api/auditoria` |
