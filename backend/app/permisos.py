"""
Matriz de permisos por rol. Es la misma de src/models/roles.js:
si se cambia una, hay que cambiar la otra.
"""
E, R, A = 'estudiante', 'responsable', 'administrador'

PERMISOS = {
    'panel.ver':                 {E, R, A},
    'reportes.ver':              {E, R, A},
    'reportes.crear':            {E, R, A},
    'reportes.propios':          {E},
    'reportes.calificar':        {E},
    'reportes.asignados':        {R},
    'reportes.tomar':            {R},
    'reportes.exportar':         {R, A},
    'reportes.cambiarEstado':    {R, A},
    'reportes.comentar':         {R, A},
    'reportes.asignar':          {A},
    'reportes.cambiarPrioridad': {A},
    'reportes.eliminar':         {A},
    'usuarios.gestionar':        {A},
    'auditoria.ver':             {A},
    'datos.restablecer':         {A},
}


def puede(usuario, permiso):
    return bool(usuario) and usuario.activo and usuario.rol in PERMISOS.get(permiso, set())


def _es_autor(u, r):
    return u is not None and r.autor_id == u.id


def _es_responsable_de(u, r):
    return u is not None and u.rol == R and r.responsable_id == u.id


def puede_editar(u, r):
    return puede(u, 'reportes.crear') and _es_autor(u, r) and r.estado == 'Nuevo'


def puede_eliminar(u, r):
    return puede(u, 'reportes.eliminar') or (_es_autor(u, r) and r.estado == 'Nuevo' and u.activo)


def puede_cambiar_estado(u, r):
    return puede(u, 'reportes.cambiarEstado') and (u.rol == A or _es_responsable_de(u, r))


def puede_comentar(u, r):
    return puede(u, 'reportes.comentar') and (u.rol == A or _es_responsable_de(u, r))


def puede_tomar(u, r):
    return puede(u, 'reportes.tomar') and r.estado == 'Nuevo' and r.responsable_id is None and \
        r.categoria_id in {c.id for c in u.categorias}


def puede_calificar(u, r):
    return puede(u, 'reportes.calificar') and _es_autor(u, r) and r.estado == 'Resuelto' and r.calificacion is None
