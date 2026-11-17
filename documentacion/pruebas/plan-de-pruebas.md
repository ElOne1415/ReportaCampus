# Plan y resultados de pruebas — Fase II (v0.3.0)

## 1. Pruebas unitarias automáticas

Se ejecutan con el ejecutor de pruebas incluido en Node.js (`node:test`), sin instalar paquetes:

```bash
npm test
```

| Archivo | Qué prueba |
|---|---|
| `tests/reporte.test.js` | Validación de reportes, código consecutivo, filtros, transiciones de estado y nota obligatoria. |
| `tests/roles.test.js` | Matriz de permisos y reglas por reporte (autor, responsable asignado, administrador). |
| `tests/usuario.test.js` | Validación de usuarios: correo válido y único, campos del responsable, normalización. |
| `tests/reportes.service.test.js` | Crear, editar, eliminar, asignar, resolver, reabrir, prioridad; permisos; persistencia al recargar; migración de la v0.2. |
| `tests/usuarios.service.test.js` | Crear usuarios, correo duplicado, reglas para no eliminar o desactivar cuentas críticas, restablecer. |
| `tests/auth.service.test.js` | Inicio de sesión correcto, credenciales incorrectas, cuenta inactiva, cierre de sesión. |
| `tests/utilidades.test.js` | Router, CSV, escape de HTML, periodos, datos simulados deterministas y orden por urgencia. |

**Resultado:** 45 pruebas, 45 correctas, 0 fallidas. Salida completa en [`resultados-pruebas-unitarias.txt`](resultados-pruebas-unitarias.txt).

## 2. Pruebas funcionales en el navegador

Entorno: Google Chrome actualizado, servidor local (`python3 -m http.server`), almacenamiento del navegador vacío al empezar. Tamaños: 1366 px (computador), 820 px (tableta), 390 px y 360 px (celular).

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

## 3. Evidencias

Capturas de la Fase II en [`evidencias/fase-2/`](evidencias/fase-2/); las de la Fase I siguen en [`evidencias/fase-1/`](evidencias/fase-1/).

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

## 4. Pendiente para la entrega final

- Pruebas automáticas de extremo a extremo en el navegador (Playwright) para los flujos P-01 a P-40.
- Pruebas de la API (pytest) y de integración con SQL Server.
- Revisión de accesibilidad con una herramienta automática (Lighthouse o axe).
