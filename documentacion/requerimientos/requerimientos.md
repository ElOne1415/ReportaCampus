# Requerimientos

## Problemática

En el campus, los daños, las fallas y los problemas de aseo o seguridad se reportan de palabra, por correo o en grupos de chat. Los reportes se pierden o se repiten, nadie sabe quién los está atendiendo y quien reporta no se entera de si se resolvió. Tampoco hay datos para saber cuánto se tarda la atención ni qué zonas concentran más problemas.

## Actores

| Rol | Descripción |
|---|---|
| Estudiante | Miembro de la comunidad que reporta incidencias y sigue su estado. |
| Responsable | Persona de una dependencia (Planta física, Servicios generales, Soporte TI, Seguridad, Mantenimiento) que atiende los reportes de sus categorías. |
| Administrador | Asigna responsables, gestiona todos los reportes y administra las cuentas. |

## Requerimientos funcionales

Estado: **v0.1** y **v0.2** = Fase I · **v0.3** = Fase II (esta entrega) · **Final** = entrega final.

| Código | Requerimiento | Rol | Estado |
|---|---|---|---|
| RF-01 | Registrar un reporte con categoría, zona, título, descripción, prioridad y foto opcional, validando los campos. | Todos | v0.1, v0.2 (foto) |
| RF-02 | Asignar a cada reporte un código consecutivo (RC-0001) y un historial de estados. | Sistema | v0.1 |
| RF-03 | Buscar reportes por texto y filtrarlos por estado, categoría y zona. | Todos | v0.1 |
| RF-04 | Ver el detalle de un reporte con su historial. | Todos | v0.1 |
| RF-05 | Panel con indicadores, gráficas por periodo y metas de atención. | Todos | v0.1 |
| RF-06 | Exportar a CSV la lista filtrada. | Responsable, administrador | v0.2 (limitado por rol en v0.3) |
| RF-07 | Iniciar y cerrar sesión; impedir el acceso a cuentas desactivadas. | Todos | v0.3 (simulado) · Final (servidor) |
| RF-08 | Mostrar el menú y las acciones según el rol, y proteger las rutas sin permiso. | Sistema | v0.3 |
| RF-09 | Consultar los reportes propios con resumen por estado. | Estudiante | v0.3 |
| RF-10 | Editar o eliminar un reporte propio mientras está en estado Nuevo. | Estudiante | v0.3 |
| RF-11 | Consultar los reportes asignados ordenados por urgencia. | Responsable | v0.3 |
| RF-12 | Agregar notas y marcar como resuelto un reporte asignado, con nota obligatoria de la solución. | Responsable, administrador | v0.3 |
| RF-13 | Asignar o reasignar el responsable de un reporte, sugiriendo a quien atiende la categoría. | Administrador | v0.3 |
| RF-14 | Cambiar la prioridad, reabrir (con nota) y eliminar cualquier reporte. | Administrador | v0.3 |
| RF-15 | Filtrar reportes por responsable, incluidos los que no tienen. | Administrador | v0.3 |
| RF-16 | Crear, editar, activar, desactivar y eliminar usuarios con validación (correo único, área y categorías del responsable). | Administrador | v0.3 |
| RF-17 | Impedir eliminar o desactivar al propio usuario, al último administrador o a un responsable con reportes abiertos. | Sistema | v0.3 |
| RF-18 | Conservar los datos al recargar la página. | Sistema | v0.2 (solo reportes propios) · v0.3 (todo, en el navegador) · Final (base de datos) |
| RF-19 | Autenticación con contraseña propia cifrada y token de sesión. | Todos | Final |
| RF-20 | Subir las fotos al servidor. | Todos | Final |
| RF-21 | Calificar la solución de un reporte resuelto. | Estudiante | Final |
| RF-22 | Alertas de reportes que superan las 48 horas sin resolver. | Responsable, administrador | Final |
| RF-23 | Registro de auditoría de las acciones del administrador. | Administrador | Final |
| RF-24 | Cambiar la contraseña. | Todos | Final |

## Requerimientos no funcionales

| Código | Requerimiento | Cómo se cumple en la v0.3 |
|---|---|---|
| RNF-01 | Diseño adaptable a computador, tableta y celular. | *Media queries* en `src/styles/responsive.css`; probado en 1366, 820, 390 y 360 px sin desplazamiento horizontal. |
| RNF-02 | Funciona sin instalar dependencias ni conexión a internet. | Chart.js y la tipografía están en `public/`. Solo hace falta un servidor local por los módulos ES. |
| RNF-03 | Publicable en GitHub Pages. | Rutas por hash, rutas relativas y sin compilación. |
| RNF-04 | Accesibilidad básica. | HTML semántico, enlace para saltar al contenido, foco visible, foco en el título al cambiar de página, `aria-current` en el menú, estados con texto además del color, mensajes de error asociados a cada campo. |
| RNF-05 | Seguridad básica de la interfaz. | Todo texto escrito por usuarios se escapa antes de insertarlo como HTML (`esc`). Los permisos se revisan en los servicios, no solo en la interfaz. |
| RNF-06 | Código mantenible. | Capas separadas, módulos con una responsabilidad, comentarios en español y 45 pruebas unitarias. |
| RNF-07 | Preparado para el backend. | Servicios asíncronos con la misma forma de respuesta que tendrá la API; configuración `FUENTE_DATOS`. |

## Matriz de roles y permisos

Definida en `src/models/roles.js`.

| Permiso | Estudiante | Responsable | Administrador |
|---|:---:|:---:|:---:|
| Ver panel, reportes, zonas y recomendaciones | ✓ | ✓ | ✓ |
| Crear reportes | ✓ | ✓ | ✓ |
| Mis reportes | ✓ | | |
| Editar / eliminar reporte propio (solo en Nuevo) | ✓ | | |
| Mis asignaciones | | ✓ | |
| Agregar notas y resolver (solo reportes asignados) | | ✓ | ✓ (cualquiera) |
| Exportar CSV | | ✓ | ✓ |
| Asignar responsable y cambiar prioridad | | | ✓ |
| Reabrir y eliminar cualquier reporte | | | ✓ |
| Gestionar usuarios | | | ✓ |
| Restablecer datos de demostración | | | ✓ |

## Historias de usuario de la Fase II

**HU-01. Ver mis reportes.** Como estudiante quiero ver todos mis reportes y cuántos hay en cada estado, para saber cuáles siguen pendientes.
- Al iniciar sesión llego a *Mis reportes*.
- Veo el total y los conteos de Nuevos, En proceso y Resueltos; al hacer clic en uno se filtra la lista.

**HU-02. Corregir un reporte.** Como estudiante quiero editar o eliminar un reporte que acabo de enviar, por si me equivoqué.
- Solo veo *Editar* y *Eliminar reporte* en mis reportes en estado Nuevo.
- La edición valida igual que la creación y queda en el historial.
- Eliminar pide confirmación.

**HU-03. Atender mis asignaciones.** Como responsable quiero ver primero los reportes urgentes y los más antiguos, para atender en el orden correcto.
- Al iniciar sesión llego a *Mis asignaciones*, filtrado por En proceso.
- Puedo agregar notas y marcar como resuelto; para resolver tengo que describir la solución.
- En reportes de otros responsables no veo acciones.

**HU-04. Asignar reportes.** Como administrador quiero ver los reportes sin responsable y asignarlos a quien atiende esa categoría.
- Desde el panel, *Asignar* abre la lista de reportes nuevos sin responsable.
- En el detalle, la lista de responsables muestra primero a quien atiende la categoría.
- Al asignar, el reporte pasa a En proceso y queda en el historial.

**HU-05. Gestionar cuentas.** Como administrador quiero crear y desactivar cuentas, para controlar quién usa la plataforma.
- El formulario valida nombre, correo único y rol; si el rol es responsable pide área y categorías.
- Una cuenta desactivada no puede iniciar sesión.
- No puedo eliminar ni desactivar mi propia cuenta ni a un responsable con reportes abiertos.
