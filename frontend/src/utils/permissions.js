// utilerías de permisos y RBAC (Role Based Access Control)

// Este diccionario debería poblarse al vuelo desde la DB (permisos_rol),
// pero para agilizar el frontend se maneja una copia cacheada.

const rolePermissionsMatrix = {
    SUPERADMIN: {
        PACIENTES: { _all: true },
        EXPEDIENTE: { _all: true },
        ENCUENTROS: { _all: true },
        ESTUDIOS: { _all: true },
        FARMACIA: { _all: true },
        ADMIN: { _all: true },
        AUDITORIA: { _all: true },
    },
    MEDICO_GENERAL: {
        PACIENTES: { puede_leer: true, puede_editar: true }, // No puede_crear
        EXPEDIENTE: { _all: true, puede_eliminar: false },
        ENCUENTROS: { _all: true, puede_eliminar: false },
        FARMACIA: { _all: true, puede_eliminar: false },
    },
    RECEPCIONISTA: {
        PACIENTES: { puede_leer: true, puede_crear: true, puede_editar: true, puede_eliminar: false },
        ENCUENTROS: { puede_leer: true } // solo para ver adónde mandar al paciente
    }
};

export function canAccess(roleCode, moduleCode, requiredAction = 'puede_leer') {
    if (!roleCode || !moduleCode) return false;

    const rolePerms = rolePermissionsMatrix[roleCode];
    if (!rolePerms) return false;

    const modPerms = rolePerms[moduleCode];
    if (!modPerms) return false;

    if (modPerms._all) return true;

    return !!modPerms[requiredAction];
}
