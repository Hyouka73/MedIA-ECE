import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import LoginPage from './pages/auth/LoginPage'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

import DashboardPage from './pages/dashboard/DashboardPage'
import ProfilePage from './pages/dashboard/ProfilePage'

// Placeholders for Pages
const Unauthorized = () => <div className="p-6 flex items-center justify-center text-red-500 font-bold">403 Acceso Denegado</div>

import { ToastProvider } from './components/ui/Alert'

function App() {
    return (
        <AuthProvider>
            <ToastProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/403" element={<Unauthorized />} />

                        {/* Rutas Protegidas (Layout principal) */}
                        <Route path="/" element={<ProtectedRoute />}>
                            <Route element={<MainLayout />}>
                                <Route index element={<Navigate to="/dashboard" replace />} />
                                <Route path="dashboard" element={<DashboardPage />} />
                                <Route path="perfil" element={<ProfilePage />} />
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
