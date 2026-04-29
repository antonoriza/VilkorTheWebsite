import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './core/auth/AuthContext'
import LoginPage from './features/auth/LoginPage'
import ResidentDashboard from './features/dashboard/ResidentDashboard'
import AdminDashboard from './features/dashboard/AdminDashboard'
import AvisosPage from './features/avisos/AvisosPage'
import PagosPage from './features/pagos/PagosPage'
import PaqueteriaPage from './features/paqueteria/PaqueteriaPage'
import AmenidadesPage from './features/amenidades/AmenidadesPage'
import VotacionesPage from './features/votaciones/VotacionesPage'
import UsuariosPage from './features/usuarios/UsuariosPage'
import TicketsPage from './features/tickets/TicketsPage'
import AdminConfiguracion from './features/configuracion/AdminConfiguracion'
import ProfilePage from './features/profile/ProfilePage'
import DashboardLayout from './layouts/DashboardLayout'

import type { Role } from './core/auth/AuthContext'

/** Redirects to login if not authenticated, or to the correct home if wrong role */
function RequireRole({ allowed, children }: { allowed: Role[]; children: React.ReactElement }) {
  const { isAuthenticated, role } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!allowed.includes(role)) {
    const home = (role === 'super_admin' || role === 'administracion' || role === 'operador') ? '/admin' : '/dashboard'
    return <Navigate to={home} replace />
  }
  return children
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<DashboardLayout />}>
        {/* Resident-only home */}
        <Route path="/dashboard" element={
          <RequireRole allowed={['residente']}><ResidentDashboard /></RequireRole>
        } />
        {/* Admin / Staff home */}
        <Route path="/admin" element={
          <RequireRole allowed={['super_admin', 'administracion', 'operador']}><AdminDashboard /></RequireRole>
        } />
        {/* Admin-only management */}
        <Route path="/usuarios" element={
          <RequireRole allowed={['super_admin', 'administracion']}><UsuariosPage /></RequireRole>
        } />
        <Route path="/configuracion" element={
          <RequireRole allowed={['super_admin', 'administracion']}><AdminConfiguracion /></RequireRole>
        } />
        {/* Unified profile (all roles) */}
        <Route path="/mi-perfil" element={<ProfilePage />} />
        {/* Legacy resident settings redirect */}
        <Route path="/mi-configuracion" element={<Navigate to="/mi-perfil" replace />} />
        {/* Shared modules */}
        <Route path="/avisos" element={<AvisosPage />} />
        <Route path="/pagos" element={<PagosPage />} />
        <Route path="/adeudos" element={<Navigate to="/pagos" replace />} />
        <Route path="/paqueteria" element={<PaqueteriaPage />} />
        <Route path="/amenidades" element={<AmenidadesPage />} />
        <Route path="/asadores" element={<Navigate to="/amenidades" replace />} />
        <Route path="/votaciones" element={<VotacionesPage />} />
        <Route path="/tickets" element={<TicketsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App

