# Navegación por rol

Menú lateral y página de inicio de cada rol. Las rutas y sus permisos están en `src/config/rutas.js`.

```mermaid
flowchart TD
    L["#/login<br/>Inicio de sesión"] -->|estudiante| MR["#/mis-reportes"]
    L -->|responsable| AS["#/asignados"]
    L -->|administrador| P["#/panel"]

    subgraph Menú del estudiante
        MR --- P1["Panel"] --- RE1["Reportes"] --- Z1["Zonas"] --- N1["Nuevo reporte"] --- RC1["Recomendaciones"]
    end
    subgraph Menú del responsable
        AS --- P2["Panel"] --- RE2["Reportes + Exportar CSV"] --- Z2["Zonas"] --- N2["Nuevo reporte"] --- RC2["Recomendaciones"]
    end
    subgraph Menú del administrador
        P --- RE3["Reportes + filtro por responsable + Exportar CSV"] --- Z3["Zonas"] --- N3["Nuevo reporte"] --- U3["Usuarios"] --- RC3["Recomendaciones"]
    end
```

| Situación | Resultado |
|---|---|
| Sin sesión, abre `#/zonas` | Va a `#/login`; después de entrar vuelve a `#/zonas`. |
| Estudiante abre `#/usuarios` | Vuelve a `#/mis-reportes` con el aviso *No tienes acceso a esa sección*. |
| Con sesión abre `#/login` | Va a la página de inicio de su rol. |
| Ruta que no existe | Va a la página de inicio (o al inicio de sesión). |
| Enlace de la v0.2 (`#zonas`) | Abre la página correspondiente. |
