# Navegación por rol

Menú y página de inicio de cada rol (`src/config/rutas.js`).

```mermaid
flowchart TD
    L["#/login"] -->|estudiante| MR["#/mis-reportes"]
    L -->|responsable| AS["#/asignados"]
    L -->|administrador| P["#/panel"]

    subgraph Estudiante
        MR --- E2["Panel · Reportes · Zonas · Nuevo reporte · Recomendaciones · Mi cuenta"]
    end
    subgraph Responsable
        AS --- R2["Panel · Reportes (+ Exportar CSV) · Zonas · Nuevo reporte · Recomendaciones · Mi cuenta"]
    end
    subgraph Administrador
        P --- A2["Reportes (+ filtro por responsable, Exportar CSV) · Zonas · Nuevo reporte · Usuarios · Actividad · Recomendaciones · Mi cuenta"]
    end
```

| Situación | Resultado |
|---|---|
| Sin sesión, abre `#/zonas` | Va a `#/login`; después de entrar vuelve a `#/zonas`. |
| Estudiante abre `#/usuarios` o `#/actividad` | Vuelve a `#/mis-reportes` con el aviso *No tienes acceso a esa sección*. |
| Con sesión abre `#/login` | Va a la página de inicio de su rol. |
| El servidor responde 401 | Cierra la sesión y vuelve a `#/login` con *Tu sesión terminó*. |
| Ruta que no existe | Va a la página de inicio (o al inicio de sesión). |
