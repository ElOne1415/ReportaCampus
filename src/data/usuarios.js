/* ==========================================================
   ReportaCampus · Usuarios de demostración
   ----------------------------------------------------------
   Cuentas para probar cada rol. Todas usan la contraseña de
   demostración definida en src/config/config.js. En la entrega
   final las cuentas y las contraseñas (cifradas) vivirán en la
   base de datos.
   ========================================================== */

export const USUARIOS_DEMO = Object.freeze([
  { id: 'u-001', nombre: 'Paola Méndez',       correo: 'admin@campus.edu.co',               rol: 'administrador', area: '', categorias: [] },
  { id: 'u-002', nombre: 'Diana Rojas',        correo: 'diana.rojas@campus.edu.co',         rol: 'responsable', area: 'Planta física',       categorias: ['infraestructura'] },
  { id: 'u-003', nombre: 'Ana Torres',         correo: 'ana.torres@campus.edu.co',          rol: 'responsable', area: 'Servicios generales', categorias: ['aseo'] },
  { id: 'u-004', nombre: 'Laura Gómez',        correo: 'laura.gomez@campus.edu.co',         rol: 'responsable', area: 'Soporte TI',          categorias: ['tecnologia'] },
  { id: 'u-005', nombre: 'Jorge Peña',         correo: 'jorge.pena@campus.edu.co',          rol: 'responsable', area: 'Seguridad',           categorias: ['seguridad'] },
  { id: 'u-006', nombre: 'Carlos Ruiz',        correo: 'carlos.ruiz@campus.edu.co',         rol: 'responsable', area: 'Mantenimiento',       categorias: ['mobiliario', 'servicios'] },
  { id: 'u-007', nombre: 'Valentina Martínez', correo: 'valentina.martinez@campus.edu.co',  rol: 'estudiante', area: '', categorias: [] },
  { id: 'u-008', nombre: 'Santiago Ramírez',   correo: 'santiago.ramirez@campus.edu.co',    rol: 'estudiante', area: '', categorias: [] },
  { id: 'u-009', nombre: 'Camila Pérez',       correo: 'camila.perez@campus.edu.co',        rol: 'estudiante', area: '', categorias: [] },
  { id: 'u-010', nombre: 'Andrés López',       correo: 'andres.lopez@campus.edu.co',        rol: 'estudiante', area: '', categorias: [] },
  { id: 'u-011', nombre: 'Mariana García',     correo: 'mariana.garcia@campus.edu.co',      rol: 'estudiante', area: '', categorias: [] },
  { id: 'u-012', nombre: 'Daniel Castro',      correo: 'daniel.castro@campus.edu.co',       rol: 'estudiante', area: '', categorias: [] },
  { id: 'u-013', nombre: 'Sofía Herrera',      correo: 'sofia.herrera@campus.edu.co',       rol: 'estudiante', area: '', categorias: [] },
  { id: 'u-014', nombre: 'Juan Díaz',          correo: 'juan.diaz@campus.edu.co',           rol: 'estudiante', area: '', categorias: [] },
  { id: 'u-015', nombre: 'Laura Vargas',       correo: 'laura.vargas@campus.edu.co',        rol: 'estudiante', area: '', categorias: [] },
  { id: 'u-016', nombre: 'Mateo Sánchez',      correo: 'mateo.sanchez@campus.edu.co',       rol: 'estudiante', area: '', categorias: [], activo: false }
]);

/** Responsable de cada categoría en los datos simulados */
export const RESPONSABLE_POR_CATEGORIA = Object.freeze({
  infraestructura: 'u-002',
  aseo: 'u-003',
  tecnologia: 'u-004',
  seguridad: 'u-005',
  mobiliario: 'u-006',
  servicios: 'u-006'
});

/** Estudiantes que aparecen como autores de los reportes simulados */
export const AUTORES_DEMO = Object.freeze(['u-007', 'u-008', 'u-009', 'u-010', 'u-011', 'u-012', 'u-013', 'u-014', 'u-015', 'u-016']);

/** Usuarios iniciales listos para guardar (con activo y fecha de creación). */
export function generarUsuarios(ahora) {
  return USUARIOS_DEMO.map((u) => ({ ...u, categorias: [...u.categorias], activo: u.activo !== false, creado: new Date(ahora.getTime() - 200 * 86400000) }));
}
