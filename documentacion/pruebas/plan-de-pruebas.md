# Plan y resultados de pruebas — versión final (v1.0.0)

## 1. Estrategia

Las pruebas se organizan en cuatro niveles, de las más rápidas y aisladas a las que prueban el sistema completo:

| Nivel | Qué prueba | Herramienta | Dónde |
|---|---|---|---|
| 1. Unitarias del frontend | Modelos, permisos, validaciones, servicios locales, cliente de la API con `fetch` simulado, router, CSV y periodos. Incluye una prueba que compara la matriz de permisos del frontend con la del backend. | `node:test` | `tests/*.test.js` |
| 2. Backend | Cada endpoint: autenticación, permisos por rol, validaciones, transiciones de estado, fotos, reglas de cuentas, auditoría, errores en JSON, archivos que se pueden servir y esquema de SQL Server. Cada prueba usa una base SQLite nueva. | pytest | `backend/tests/` |
| 3. De extremo a extremo | Flujos completos en Chrome de los tres roles, rutas protegidas, diseño adaptable y manejo de errores. Cada caso corre **dos veces**: en modo navegador y con el backend Flask (integración frontend + API + base de datos). | Playwright | `tests/e2e/` |
| 4. Manuales | Revisión visual en computador, tableta y celular y los casos de la sección 4. | Chrome | capturas en `evidencias/` |

Cómo ejecutarlas: [manual técnico, sección 9](../manual_tecnico/manual-tecnico.md#9-pruebas).

## 2. Resultados automáticos

| Batería | Resultado | Salida completa |
|---|---|---|
| `npm test` | **57 de 57** correctas | [`resultados/frontend-unitarias.txt`](resultados/frontend-unitarias.txt) |
| `pytest` | **33 de 33** correctas | [`resultados/backend-pytest.txt`](resultados/backend-pytest.txt) |
| `npm run test:e2e` | **33 de 33** correctas (3 omitidas en modo navegador porque simulan fallos del servidor) | [`resultados/e2e-playwright.txt`](resultados/e2e-playwright.txt) |

**Total: 123 pruebas automáticas.**

### Casos de extremo a extremo

| Archivo | Casos |
|---|---|
| `sesion.spec.js` | Validación del inicio de sesión y credenciales incorrectas o desactivadas; página de inicio y menú de cada rol; rutas protegidas y regreso a la página pedida; cambio de contraseña. |
| `estudiante.spec.js` | Crear con validación, editar y eliminar un reporte; calificar una solución. |
| `responsable.spec.js` | Alerta de 48 horas, tomar un reporte disponible y resolverlo con nota; sin acciones en reportes ajenos. |
| `administrador.spec.js` | Asignar desde el enlace del panel, cambiar prioridad y verlo en Actividad; crear usuario con validación y regla de responsable con reportes abiertos. |
| `adaptable.spec.js` | Sin desplazamiento horizontal a 1366, 820, 390 y 360 px en las páginas de los tres roles; menú en celular. |
| `errores.spec.js` (solo con servidor) | Sin conexión con la API → error en la página y **Reintentar**; error 500 al enviar → aviso sin perder el formulario; token no válido → vuelve al inicio de sesión. |

Además, en todos los casos se revisa que la página no tenga errores de JavaScript.

## 3. Errores encontrados por las pruebas y corregidos

| Prueba que lo encontró | Problema | Corrección (commit) |
|---|---|---|
| `test_sistema.py` | La ruta `/src/../backend/run.py` devolvía un archivo del backend. | Cada carpeta del frontend se sirve por separado (`fix(backend): impedir que una ruta con .. salga de src/ o public/`). |
| `adaptable.spec.js` | *Mi cuenta* medía 439 px de ancho en un celular de 390 px por el correo largo. | Columna que puede encogerse y texto que se parte (`fix: desbordamiento de Mi cuenta…`). |
| `adaptable.spec.js` | En celular el botón *Salir* no tenía nombre para lectores de pantalla. | `aria-label="Cerrar sesión"` (mismo commit). |
| Prueba de integración manual | En GitHub Pages, la detección del servidor dejaba un error 404 en la consola en cada carga. | El backend marca la página que entrega y el frontend ya no hace la petición de prueba ([ADR-007](../decisiones_tecnicas/ADR-007-fuente-de-datos-automatica.md)). |
| `estudiante.spec.js` | La prueba de calificar fallaba a veces con el servidor porque buscaba el botón antes de que abriera el detalle. | La prueba espera a que el detalle muestre el reporte. |

## 4. Casos funcionales

Los casos P-01 a P-40 vienen de la Fase II. En la versión final se repitieron **en los dos modos** (navegador y servidor) con los mismos resultados; la mayoría también están automatizados en el nivel 3.

### Inicio de sesión y permisos

| # | Caso | Resultado esperado | Resultado |
|---|---|---|---|
| P-01 | Enviar el formulario vacío | Mensajes en correo y contraseña | Correcto |
| P-02 | Contraseña incorrecta | *El correo o la contraseña no son correctos.* | Correcto |
| P-03 | Cuenta desactivada (mateo.sanchez) | *Esta cuenta está desactivada…* | Correcto |
| P-04 | Entrar con cada cuenta de demostración | Estudiante → Mis reportes; responsable → Mis asignaciones; administrador → Panel | Correcto |
| P-05 | Abrir `#/zonas` sin sesión | Pide iniciar sesión y luego abre Zonas | Correcto |
| P-06 | Estudiante abre `#/usuarios` | Vuelve a Mis reportes con *No tienes acceso a esa sección* | Correcto |
| P-07 | Recargar la página con sesión | La sesión se conserva | Correcto |
| P-08 | Cerrar sesión | Vuelve al inicio de sesión y oculta la barra del usuario | Correcto |
| P-09 | Menú de cada rol | Solo aparecen las secciones permitidas | Correcto |

### Estudiante

| # | Caso | Resultado esperado | Resultado |
|---|---|---|---|
| P-10 | Resumen por estado | Conteos correctos; clic filtra la lista | Correcto |
| P-11 | Crear reporte | Vuelve a Mis reportes con el reporte resaltado y el código en el aviso | Correcto |
| P-12 | Editar reporte Nuevo | Formulario precargado; validación; cambio en el historial | Correcto |
| P-13 | Eliminar reporte Nuevo | Pide confirmación; *Cancelar* no borra; *Eliminar* sí | Correcto |
| P-14 | Reporte En proceso o Resuelto | No muestra Editar ni Eliminar | Correcto |
| P-15 | `#/nuevo?editar=` con un reporte ajeno | *Ese reporte ya no se puede editar* | Correcto |
| P-16 | Botón Exportar CSV | No aparece para el estudiante | Correcto |

### Responsable

| # | Caso | Resultado esperado | Resultado |
|---|---|---|---|
| P-17 | Mis asignaciones | Área en el subtítulo; urgentes y antiguos primero | Correcto |
| P-18 | Resolver sin nota | *Describe la solución (mínimo 10 caracteres).* | Correcto |
| P-19 | Agregar nota | Aparece en el historial con su nombre | Correcto |
| P-20 | Resolver con nota | Pasa a Resuelto y desaparece de En proceso | Correcto |
| P-21 | Reporte de otro responsable | Sin acciones | Correcto |

### Administrador

| # | Caso | Resultado esperado | Resultado |
|---|---|---|---|
| P-22 | Enlace *Asignar* del panel | Lista de reportes nuevos sin responsable | Correcto |
| P-23 | Asignar sin elegir responsable | *Elige un responsable.* | Correcto |
| P-24 | Asignar | Pasa a En proceso; el botón cambia a Reasignar; la lista se actualiza | Correcto |
| P-25 | Cambiar prioridad | Queda en el historial | Correcto |
| P-26 | Resolver y reabrir | Reabrir exige nota | Correcto |
| P-27 | Eliminar reporte | Pide confirmación y cierra el detalle | Correcto |
| P-28 | Filtro por responsable | Muestra solo sus reportes; *Sin asignar* funciona | Correcto |
| P-29 | Crear usuario vacío | Errores en nombre, correo y rol | Correcto |
| P-30 | Crear responsable con correo repetido y sin área | Tres errores por campo | Correcto |
| P-31 | Crear, editar, desactivar y eliminar usuario | Cada acción con su aviso | Correcto |
| P-32 | Eliminar o desactivar a Diana Rojas (tiene reportes abiertos) | Se rechaza con el motivo | Correcto |
| P-33 | Quitarse el rol de administrador siendo el único | *Debe quedar al menos un administrador activo.* | Correcto |
| P-34 | Desactivar a una estudiante y tratar de entrar con ella | No aparece en las cuentas rápidas y el inicio de sesión se rechaza | Correcto |
| P-35 | Restablecer datos | Vuelven los 16 usuarios y los reportes iniciales | Correcto |

### Generales

| # | Caso | Resultado esperado | Resultado |
|---|---|---|---|
| P-36 | Consola del navegador en todos los flujos | Sin errores | Correcto |
| P-37 | Desplazamiento horizontal en 1366, 820, 390 y 360 px | Ninguno | Correcto |
| P-38 | Botones Atrás y Adelante del navegador | Cambian de página | Correcto |
| P-39 | Panel, gráficas, filtros, zonas y exportación de la Fase I | Siguen funcionando | Correcto |
| P-40 | Reportes creados con la v0.2 | Se migran a Mis reportes de la estudiante de demostración | Correcto |

### Funciones de la entrega final

| # | Caso | Resultado esperado | Navegador | Servidor |
|---|---|---|---|---|
| P-41 | Abrir la página desde `python run.py` | Pie: *Datos del servidor (SQLite)* | — | Correcto |
| P-42 | Abrir la página publicada o con `npm start` | Pie: *Demostración…*; sin errores en la consola | Correcto | — |
| P-43 | Crear un reporte con foto | La foto se ve en el detalle (en el servidor se guarda en `instancia/fotos`) | Correcto | Correcto |
| P-44 | Calificar sin elegir estrellas | *Elige de 1 a 5 estrellas.* | Correcto | Correcto |
| P-45 | Calificar con 4 estrellas y comentario | Se ve en el detalle y desaparece el formulario | Correcto | Correcto |
| P-46 | Reabrir un reporte calificado | La calificación se borra | Correcto | Correcto |
| P-47 | Responsable con un reporte de más de 48 h | Aviso y etiqueta *Más de 48 h*; el panel los cuenta | Correcto | Correcto |
| P-48 | Tomar un reporte disponible | Pasa a En proceso a su cargo; sale de *Disponibles* | Correcto | Correcto |
| P-49 | Tomar un reporte de otra categoría (por la API) | 403 | — | Correcto |
| P-50 | Cambiar contraseña con confirmación distinta, actual incorrecta y luego bien | Mensajes por campo; después entra solo con la nueva | Correcto | Correcto |
| P-51 | Actividad después de asignar, cambiar prioridad y desactivar | Las tres acciones, con filtro y enlace al reporte | Correcto | Correcto |
| P-52 | Responsable abre `#/actividad` | Vuelve a su inicio | Correcto | Correcto |
| P-53 | Detener el backend y abrir Usuarios | *No se pudieron cargar los datos* y **Reintentar**; al reiniciar el backend, Reintentar carga la lista | — | Correcto |
| P-54 | Detener el backend y enviar un reporte | Aviso rojo; el formulario conserva lo escrito y el botón vuelve a habilitarse | — | Correcto |
| P-55 | Token alterado en `sessionStorage` | Vuelve al inicio de sesión con *Tu sesión terminó* | — | Correcto |
| P-56 | Pulsar dos veces *Enviar reporte* rápido | Solo se crea un reporte (el botón se desactiva) | Correcto | Correcto |
| P-57 | `GET /backend/.env.example`, `/README.md`, `/src/../backend/run.py` en el servidor | 404 | — | Correcto |
| P-58 | `flask --app run semilla` y `gunicorn "run:app"` | Cargan los datos y responden en `/api/salud` | — | Correcto |

## 5. Evidencias

- [`evidencias/final/`](evidencias/final/): versión final con el backend.
- [`evidencias/fase-2/`](evidencias/fase-2/): roles y permisos (Fase II).
- [`evidencias/fase-1/`](evidencias/fase-1/): prototipo inicial (Fase I).

| Archivo (final) | Qué muestra |
|---|---|
| `37-servidor-inicio-sesion.png` | Inicio de sesión servido por el backend |
| `38-estudiante-por-calificar.png` | Mis reportes con el aviso de reportes por calificar |
| `39-estudiante-calificar.png` | Calificación de la solución |
| `40-foto-guardada-en-servidor.png` | Reporte nuevo con la foto guardada en el servidor |
| `41-responsable-alerta-y-disponibles.png` | Alerta de 48 horas y reportes disponibles para tomar |
| `42-responsable-tomar-reporte.png` | Botón Tomar reporte |
| `43-administrador-panel-final.png` | Panel con la meta de calificaciones |
| `44-administrador-actividad.png` | Registro de actividad |
| `45-mi-cuenta-validacion.png` | Validación del cambio de contraseña |
| `46-error-sin-conexion.png` | Error de conexión con Reintentar |
| `47-movil-asignaciones-final.png` | Mis asignaciones en celular |
| `48-movil-mi-cuenta.png` | Mi cuenta en celular |
| `49-movil-actividad.png` | Actividad en celular |

<details>
<summary>Evidencias de la Fase II</summary>

| Archivo | Qué muestra |
|---|---|
| `17-inicio-sesion.png` | Inicio de sesión con las cuentas de demostración |
| `18-inicio-sesion-error.png` | Contraseña incorrecta |
| `19-estudiante-mis-reportes.png` | Mis reportes con resumen por estado |
| `20-estudiante-detalle-acciones.png` | Detalle con Editar y Eliminar |
| `21-estudiante-editar-validacion.png` | Edición con error de validación |
| `22-responsable-asignaciones.png` | Mis asignaciones ordenadas por urgencia |
| `23-responsable-resolver-validacion.png` | Resolver sin nota |
| `24-responsable-reporte-resuelto.png` | Reporte resuelto con la nota en el historial |
| `25-administrador-panel.png` | Panel con el enlace para asignar |
| `26-administrador-sin-asignar.png` | Reportes nuevos sin responsable |
| `27-administrador-asignar.png` | Gestión del reporte: responsable sugerido, prioridad y eliminar |
| `28-administrador-usuarios.png` | Lista de usuarios |
| `29-administrador-usuario-validacion.png` | Validación del formulario de usuario |
| `30-ruta-protegida.png` | Estudiante que intenta abrir Usuarios |
| `31-movil-inicio-sesion.png` | Inicio de sesión en celular |
| `32-movil-mis-reportes.png` | Mis reportes en celular |
| `33-movil-menu-estudiante.png` | Menú del estudiante en celular |
| `34-movil-asignaciones.png` | Mis asignaciones en celular |
| `35-movil-usuarios.png` | Usuarios en celular |
| `36-tableta-panel-administrador.png` | Panel en tableta |

</details>

## 6. Limitaciones de las pruebas

- La conexión con un **SQL Server real** no se probó: el esquema se genera y se valida con el dialecto de SQL Server, pero las pruebas usan SQLite.
- No hay pruebas de carga ni una auditoría automática de accesibilidad (Lighthouse o axe).
- Las pruebas de extremo a extremo se corrieron en Chrome; Firefox y Safari se revisaron a mano solo en la Fase I.
