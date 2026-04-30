import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import LoginPage from './pages/auth/LoginPage'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import { ToastProvider } from './components/ui/Alert'

// Errors
import UnauthorizedPage from './pages/errors/UnauthorizedPage'
import ErrorPage from './pages/errors/ErrorPage'

// Dashboard
import DashboardPage from './pages/dashboard/DashboardPage'
import ProfilePage from './pages/dashboard/ProfilePage'

// Admin
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminUsuariosPage from './pages/admin/AdminUsuariosPage'
import AdminEstablecimientosPage from './pages/admin/AdminEstablecimientosPage'
import AdminEspecialidadesPage from './pages/admin/AdminEspecialidadesPage'
import AdminRolesPage from './pages/admin/AdminRolesPage'

// Pacientes
import PacientesListPage from './pages/Pacients/PacientesListPage';
import ExpedientePage from './pages/Pacients/ExpedientePage';
import PacienteFichaPage from './pages/Pacients/PacienteFichaPage';
import PacienteAntecedentesPage from './pages/Pacients/PacienteAntecedentesPage';

// Auditoría
import AuditoriaPage from './pages/audit/AuditoriaPage';

// Consulta
import NuevaConsultaPage from './pages/consulta/NuevaConsultaPage'
import TriajePage from './pages/consulta/TriajePage'

// Referencias
import ReferenciasListPage from './pages/references/ReferenciasListaPage';
import ReferenciaDetallePage from './pages/references/ReferenciasDetallePage';
import ReferenciasFichaPage from './pages/references/ReferenciasFichaPage'

// Documentos
import DocumentosPage from './pages/documentos/DocumentosPage'


function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/403" element={<UnauthorizedPage />} />
            <Route path="/404" element={<ErrorPage code="404" title="Página no encontrada" />} />

            <Route path="/" element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="perfil" element={<ProfilePage />} />

                {/* Clínica (Protección por Módulo) */}
                <Route element={<ProtectedRoute module="PACIENTES" />}>
                  <Route path="pacientes" element={<PacientesListPage />} />
                  <Route element={<ProtectedRoute module="PACIENTES" action="puede_crear" />}>
                    <Route path="pacientes/nuevo" element={<PacienteFichaPage />} />
                  </Route>
                  <Route path="pacientes/:id/editar" element={<PacienteFichaPage />} />
                  <Route path="pacientes/:id/antecedentes" element={<PacienteAntecedentesPage />} />
                </Route>

                <Route element={<ProtectedRoute module="EXPEDIENTE" />}>
                  <Route path="expediente/:id" element={<ExpedientePage />} />
                </Route>

                <Route element={<ProtectedRoute module="ENCUENTROS" />}>
                  <Route path="consulta/nueva" element={<NuevaConsultaPage />} />
                  <Route path="referencias" element={<ReferenciasListPage />} />
                  <Route path="referencias/:id" element={<ReferenciaDetallePage />} />
                  <Route path="referencias/nueva" element={<ReferenciasFichaPage />} />
                  <Route path="referencias/:id/editar" element={<ReferenciasFichaPage />} />
                </Route>

                {/* Accesible para enfermería sin módulo específico (o agregar módulo TRIAJE) */}
                <Route path="consulta/triaje" element={<TriajePage />} />

                <Route element={<ProtectedRoute module="ESTUDIOS" />}>
                  <Route path="documentos" element={<DocumentosPage />} />
                </Route>

                {/* Sistema (Protección por Módulo) */}
                <Route element={<ProtectedRoute module="ADMIN" />}>
                  <Route path="admin"                 element={<AdminDashboardPage />} />
                  <Route path="admin/usuarios"         element={<AdminUsuariosPage />} />
                  <Route path="admin/establecimientos" element={<AdminEstablecimientosPage />} />
                  <Route path="admin/especialidades" element={<AdminEspecialidadesPage />} />
                  <Route path="admin/roles" element={<AdminRolesPage />} />
                </Route>

                <Route element={<ProtectedRoute module="AUDITORIA" />}>
                  <Route path="audit/logs" element={<AuditoriaPage />} />
                </Route>

                <Route path="*" element={<ErrorPage code="404" title="Recurso no encontrado" />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App