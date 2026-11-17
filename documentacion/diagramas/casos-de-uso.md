# Casos de uso por rol

Qué puede hacer cada rol en la versión 0.3.0. Los casos marcados con *(entrega final)* están previstos pero no implementados.

```mermaid
flowchart LR
    E((Estudiante))
    R((Responsable))
    A((Administrador))

    subgraph Comunes["Todos los roles"]
        CU1[Iniciar y cerrar sesión]
        CU2[Ver panel de indicadores]
        CU3[Buscar y filtrar reportes]
        CU4[Ver detalle e historial]
        CU5[Ver zonas del campus]
        CU6[Crear reporte con foto]
    end

    subgraph Est["Estudiante"]
        CU7[Ver mis reportes por estado]
        CU8[Editar mi reporte en estado Nuevo]
        CU9[Eliminar mi reporte en estado Nuevo]
    end

    subgraph Resp["Responsable"]
        CU10[Ver mis asignaciones por urgencia]
        CU11[Agregar nota de avance]
        CU12[Marcar como resuelto con nota]
        CU13[Exportar CSV]
    end

    subgraph Adm["Administrador"]
        CU14[Asignar o reasignar responsable]
        CU15[Cambiar prioridad]
        CU16[Reabrir reporte con nota]
        CU17[Eliminar cualquier reporte]
        CU18[Crear, editar, activar/desactivar y eliminar usuarios]
        CU19[Restablecer datos de demostración]
    end

    E --- Comunes
    R --- Comunes
    A --- Comunes
    E --- Est
    R --- Resp
    A --- Adm
    A --- CU11
    A --- CU12
    A --- CU13
```

## Casos previstos para la entrega final

| Caso | Rol |
|---|---|
| Iniciar sesión con contraseña propia validada por el servidor | Todos |
| Cambiar la contraseña | Todos |
| Subir la foto al servidor en lugar de guardarla en el navegador | Todos |
| Calificar la solución de un reporte resuelto | Estudiante |
| Tomar un reporte nuevo de su categoría sin esperar asignación | Responsable |
| Ver alertas de reportes que superan las 48 horas | Responsable y administrador |
| Consultar el registro de auditoría | Administrador |
