import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import LoginPage from './pages/auth/LoginPage'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import { ToastProvider } from './components/ui/Alert'

// Dashboard
import DashboardPage from './pages/dashboard/DashboardPage'
import ProfilePage   from './pages/dashboard/ProfilePage'

// Admin (Persona 5)
import AdminDashboardPage         from './pages/admin/AdminDashboardPage'
import AdminUsuariosPage          from './pages/admin/AdminUsuariosPage'
import AdminEstablecimientosPage from './pages/admin/AdminEstablecimientosPage'
import AdminEspecialidadesPage   from './pages/admin/AdminEspecialidadesPage'
import AdminRolesPage            from './pages/admin/AdminRolesPage'

// Pacientes
import PacientesListPage from './pages/Pacients/PacientesListPage';
import ExpedientePage from './pages/Pacients/ExpedientePage';
import PacienteFichaPage from './pages/Pacients/PacienteFichaPage';
import PacienteAntecedentesPage from './pages/Pacients/PacienteAntecedentesPage';

// Auditoría y Seguridad (Persona 5 - Corregido)
import AuditoriaPage from './pages/audit/AuditoriaPage'


const Unauthorized = () => (
  <div className="p-6 flex items-center justify-center text-[#DC2626] font-bold">
    403 — Acceso Denegado
  </div>
)

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/403"   element={<Unauthorized />} />

            <Route path="/" element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="perfil"    element={<ProfilePage />} />
                
                {/* ── Clínica ── */}
                <Route path="pacientes" element={<PacientesListPage />} />
                <Route path="pacientes/nuevo" element={<PacienteFichaPage />} />
                <Route path="pacientes/:id/editar" element={<PacienteFichaPage />} />
                <Route path="pacientes/:id/antecedentes" element={<PacienteAntecedentesPage />} />
                <Route path="expediente/:id" element={<ExpedientePage />} />

                {/* ── Admin (Módulos Persona 5) ── */}
                <Route path="admin"                 element={<AdminDashboardPage />} />
                <Route path="admin/usuarios"         element={<AdminUsuariosPage />} />
                <Route path="admin/establecimientos" element={<AdminEstablecimientosPage />} />
                <Route path="admin/especialidades"   element={<AdminEspecialidadesPage />} />
                <Route path="admin/roles"            element={<AdminRolesPage />} />

                {/* ── Auditoría y Seguridad (Módulos Persona 5) ── */}
                <Route path="audit/logs"       element={<AuditoriaPage />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App