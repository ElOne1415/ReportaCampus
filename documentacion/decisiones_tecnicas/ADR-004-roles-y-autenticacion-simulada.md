# ADR-004. Roles con matriz de permisos y autenticación simulada

**Estado:** aceptada · Fase II

## Contexto

La Fase I anunció tres roles para las siguientes entregas: estudiante, responsable y administrador. La Fase II debe implementarlos, pero no se exige todavía autenticación real ni base de datos.

## Decisión

- Los roles y sus permisos se definen en una sola tabla (`PERMISOS` en `src/models/roles.js`). La función `puede(usuario, permiso)` responde si un rol tiene un permiso general.
- Las reglas que dependen de un reporte concreto se escriben aparte: `puedeEditarReporte`, `puedeEliminarReporte`, `puedeCambiarEstado` y `puedeComentar`.
- El inicio de sesión es **simulado**: comprueba que el correo exista, que la cuenta esté activa y que la contraseña sea la de demostración (`campus2026`, en `src/config/config.js`). La página muestra una cuenta de cada rol para entrar con un clic.
- La sesión guarda solo el id del usuario en `sessionStorage` y se valida en cada carga: si la cuenta se desactivó o se eliminó, la sesión se cierra.
- El mensaje de error no dice si el correo existe, para no dar pistas (igual que hará el backend).

## Consecuencias

- Cualquiera puede ver la contraseña de demostración y cambiar sus datos desde las herramientas del navegador. Es aceptable porque los datos son de prueba y viven en su propio navegador. No se deben usar datos reales en esta versión.
- En la entrega final la contraseña de cada usuario se guardará cifrada en la base de datos y la validará la API (ADR-005). La matriz de permisos se repetirá en el backend con los mismos nombres.

## Actualización (v1.0)

Con el servidor, la autenticación ya es real: contraseñas cifradas con PBKDF2, token JWT de 8 horas y permisos revisados en cada petición. La simulación queda solo para el modo navegador de GitHub Pages, donde ahora cada usuario también puede cambiar su contraseña (se guarda una huella SHA-256 en el navegador). Ver el [manual técnico](../manual_tecnico/manual-tecnico.md#8-seguridad).
