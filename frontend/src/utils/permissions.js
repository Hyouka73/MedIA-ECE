/**
 * Utilería de permisos dinámica para MedIA.
 * Valida el acceso basándose en la matriz de permisos devuelta por el backend.
 * 
 * @param {Object} userPermissions - Matriz de permisos (user.permisos)
 * @param {string} moduleCode - Código del módulo (ej: 'PACIENTES')
 * @param {string} requiredAction - Acción requerida ('puede_leer', 'puede_crear', 'puede_editar', 'puede_eliminar')
 * @returns {boolean}
 */
export function canAccess(userPermissions, moduleCode, requiredAction = 'puede_leer') {
    if (!userPermissions || !moduleCode) return false;

    const modPerms = userPermissions[moduleCode];
    if (!modPerms) return false;

    // Retorna true solo si la acción específica está permitida (true)
    return !!modPerms[requiredAction];
}
