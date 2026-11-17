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

Versión en que quedó implementado cada uno: **v0.1–v0.2** (Fase I), **v0.3** (Fase II) y **v1.0** (entrega final). Todos funcionan con el servidor y en el modo navegador.

| Código | Requerimiento | Rol | Estado |
|---|---|---|---|
| RF-01 | Registrar un reporte con categoría, zona, título, descripción, prioridad y foto opcional, validando los campos. | Todos | v0.1, v0.2 (foto), v1.0 (foto guardada en el servidor) |
| RF-02 | Asignar a cada reporte un código consecutivo (RC-0001) y un historial de estados. | Sistema | v0.1 |
| RF-03 | Buscar reportes por texto y filtrarlos por estado, categoría, zona y responsable. | Todos | v0.1, v0.3 |
| RF-04 | Ver el detalle de un reporte con su historial. | Todos | v0.1 |
| RF-05 | Panel con indicadores, gráficas por periodo y metas de atención. | Todos | v0.1, v1.0 (meta de calificaciones) |
| RF-06 | Exportar a CSV la lista filtrada. | Responsable, administrador | v0.2, v0.3 |
| RF-07 | Iniciar y cerrar sesión; impedir el acceso a cuentas desactivadas. | Todos | v0.3 (simulado), **v1.0 (servidor con JWT)** |
| RF-08 | Mostrar el menú y las acciones según el rol, y proteger las rutas. | Sistema | v0.3 |
| RF-09 | Consultar los reportes propios con resumen por estado. | Estudiante | v0.3 |
| RF-10 | Editar o eliminar un reporte propio mientras está en estado Nuevo. | Estudiante | v0.3 |
| RF-11 | Consultar los reportes asignados ordenados por urgencia. | Responsable | v0.3 |
| RF-12 | Agregar notas y marcar como resuelto, con nota obligatoria. | Responsable, administrador | v0.3 |
| RF-13 | Asignar o reasignar el responsable, sugiriendo a quien atiende la categoría. | Administrador | v0.3 |
| RF-14 | Cambiar la prioridad, reabrir (con nota) y eliminar cualquier reporte. | Administrador | v0.3 |
| RF-15 | Filtrar reportes por responsable, incluidos los que no tienen. | Administrador | v0.3 |
| RF-16 | Crear, editar, activar, desactivar y eliminar usuarios con validación. | Administrador | v0.3 |
| RF-17 | Impedir eliminar o desactivar la propia cuenta, al último administrador o a un responsable con reportes abiertos. | Sistema | v0.3 |
| RF-18 | Conservar los datos. | Sistema | v0.3 (navegador), **v1.0 (base de datos)** |
| RF-19 | Autenticación con contraseña propia cifrada y token de sesión. | Todos | **v1.0** |
| RF-20 | Subir las fotos al servidor. | Todos | **v1.0** |
| RF-21 | Calificar la solución de un reporte resuelto (1 a 5 estrellas, una vez). | Estudiante | **v1.0** |
| RF-22 | Alertas de reportes con más de 48 horas sin resolver. | Responsable, administrador | **v1.0** |
| RF-23 | Registro de auditoría de las acciones que cambian datos. | Administrador | **v1.0** |
| RF-24 | Cambiar la contraseña. | Todos | **v1.0** |
| RF-25 | Tomar un reporte nuevo de la categoría propia sin esperar asignación. | Responsable | **v1.0** |
| RF-26 | API REST que expone todas las operaciones anteriores con los mismos permisos. | Sistema | **v1.0** |

## Requerimientos no funcionales

| Código | Requerimiento | Cómo se cumple |
|---|---|---|
| RNF-01 | Diseño adaptable a computador, tableta y celular. | *Media queries* en `src/styles/responsive.css`; una prueba de Playwright revisa que no haya desplazamiento horizontal a 1366, 820, 390 y 360 px en todas las páginas de los tres roles. |
| RNF-02 | Seguridad. | Contraseñas con PBKDF2, tokens JWT con vencimiento, permisos revisados en el servidor, fotos validadas por contenido, solo se publican `index.html`, `src/` y `public/`, texto escapado antes de mostrarlo y `.env` fuera del repositorio. Ver el [manual técnico](../manual_tecnico/manual-tecnico.md#8-seguridad). |
| RNF-03 | Manejo de errores. | Respuestas de error con la misma forma en todas las capas, avisos en rojo, error en la página con **Reintentar**, cierre de sesión al vencer el token y formularios que conservan lo escrito. |
| RNF-04 | Tiempo de respuesta razonable. | La lista completa de 819 reportes responde en unos 0,1 s con SQLite y se reutiliza 20 s en el navegador; las fotos se reducen a 640 px antes de enviarse; barra de carga si una página tarda más de 150 ms. |
| RNF-05 | Accesibilidad básica. | HTML semántico, foco en el título al cambiar de página, `aria-current` en el menú, estados con texto además de color, errores asociados a cada campo, avisos anunciados y botones con nombre accesible. |
| RNF-06 | Publicable en GitHub Pages. | Rutas por hash y rutas relativas; sin backend, funciona con datos de demostración. |
| RNF-07 | Portabilidad de la base de datos. | SQLAlchemy con el mismo código para SQLite y SQL Server; esquema de SQL Server generado desde los modelos. |
| RNF-08 | Mantenibilidad. | Capas separadas en frontend y backend, configuración fuera del código, dependencias fijadas y 123 pruebas automáticas. |

## Matriz de roles y permisos

Definida en `src/models/roles.js` y, con los mismos nombres, en `backend/app/permisos.py`.

| Permiso | Estudiante | Responsable | Administrador |
|---|:---:|:---:|:---:|
| Ver panel, reportes, zonas y recomendaciones | ✓ | ✓ | ✓ |
| Crear reportes | ✓ | ✓ | ✓ |
| Mis reportes | ✓ | | |
| Editar / eliminar reporte propio (solo en Nuevo) | ✓ | | |
| Mis asignaciones | | ✓ | |
| Agregar notas y resolver (solo reportes asignados) | | ✓ | ✓ (cualquiera) |
| Tomar reportes nuevos de su categoría | | ✓ | |
| Calificar la solución de un reporte propio | ✓ | | |
| Exportar CSV | | ✓ | ✓ |
| Asignar responsable y cambiar prioridad | | | ✓ |
| Reabrir y eliminar cualquier reporte | | | ✓ |
| Gestionar usuarios | | | ✓ |
| Ver la actividad (auditoría) | | | ✓ |
| Restablecer datos de demostración | | | ✓ |

## Historias de usuario

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

**HU-06. Calificar la atención.** Como estudiante quiero calificar cómo resolvieron mi reporte, para que el equipo sepa si la solución sirvió.
- En un reporte mío resuelto aparece *¿Cómo quedó la solución?* con 1 a 5 estrellas y un comentario opcional.
- Solo puedo calificar una vez; si el administrador lo reabre, puedo volver a calificarlo cuando se resuelva.

**HU-07. Tomar trabajo disponible.** Como responsable quiero tomar los reportes nuevos de mi área sin esperar a que me los asignen.
- *Mis asignaciones* muestra los reportes nuevos sin responsable de mis categorías.
- Al tomar uno pasa a En proceso a mi cargo y queda en el historial.

**HU-08. No dejar reportes olvidados.** Como responsable quiero ver cuáles llevan más de 48 horas abiertos.
- Esos reportes llevan la etiqueta *Más de 48 h* y un aviso arriba de mis asignaciones.

**HU-09. Saber quién hizo qué.** Como administrador quiero ver un registro de las acciones.
- *Actividad* muestra fecha, usuario, acción, elemento y detalle, con búsqueda y filtro.

**HU-10. Proteger mi cuenta.** Como usuario quiero cambiar mi contraseña.
- En *Mi cuenta* escribo la actual y la nueva dos veces; la nueva debe tener 8 caracteres o más, con letras y números.
