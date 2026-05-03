import apiClient from './client'

const toArray = (data) =>
  Array.isArray(data) ? data
  : data?.data ?? data?.items ?? data?.usuarios
  ?? data?.establecimientos ?? data?.roles ?? []

// ── Métricas (mock — no existe endpoint) ──────────────────
export async function fetchAdminMetrics() {
  return {
    usuarios_activos: null,
    total_establecimientos: null,
    sin_2fa: null,
    bloqueadas: null,
    nuevos_hoy: 0,
    configuraciones_pendientes: 0,
  }
}

// ── Usuarios ───────────────────────────────────────────────
export async function fetchUsuarios() {
  const { data } = await apiClient.get('/admin/usuarios')
  return toArray(data)
}

export async function crearUsuario(payload) {
  const { data } = await apiClient.post('/admin/usuarios', payload)
  return data
}

export async function editarUsuario(id, payload) {
  const { data } = await apiClient.patch(`/admin/usuarios/${id}`, payload)
  return data
}

export async function cambiarEstadoUsuario(id, activo) {
  const { data } = await apiClient.patch(`/admin/usuarios/${id}`, { activo })
  return data
}

export async function forzarPassword(id) {
  const { data } = await apiClient.patch(`/admin/usuarios/${id}`, { forzar_cambio_password: true })
  return data
}

// ── Establecimientos ───────────────────────────────────────
export async function fetchEstablecimientos() {
  const { data } = await apiClient.get('/admin/establecimientos')
  return toArray(data)
}

export async function crearEstablecimiento(payload) {
  const { data } = await apiClient.post('/admin/establecimientos', payload)
  return data
}

export async function editarEstablecimiento(id, payload) {
  const { data } = await apiClient.patch(`/admin/establecimientos/${id}`, payload)
  return data
}

// ── Roles ──────────────────────────────────────────────────
export async function fetchRoles() {
  const { data } = await apiClient.get('/admin/roles')
  return toArray(data)
}

// ── Especialidades ─────────────────────────────────────────
export async function fetchCatalogoEspecialidades() {
  const { data } = await apiClient.get('/admin/especialidades')
  return toArray(data)
}

export async function fetchEspecialidadesEstablecimiento(idEstab) {
  const { data } = await apiClient.get(`/admin/establecimientos/${idEstab}/especialidades`)
  return toArray(data)
}

export async function addEspecialidadEstablecimiento(idEstab, idEsp) {
  const { data } = await apiClient.post(`/admin/establecimientos/${idEstab}/especialidades`, { id_especialidad: idEsp })
  return data
}

export async function removeEspecialidadEstablecimiento(idEstab, idEsp) {
  const { data } = await apiClient.delete(`/admin/establecimientos/${idEstab}/especialidades/${idEsp}`)
  return data
}

// ── Auditoría ──────────────────────────────────────────────
export async function fetchAuditoria(params = {}) {
  const { data } = await apiClient.get('/auditoria/accesos', { params })
  return toArray(data)
}

export async function fetchIncidentes(params = {}) {
  const { data } = await apiClient.get('/auditoria/incidentes', { params })
  return toArray(data)
}
