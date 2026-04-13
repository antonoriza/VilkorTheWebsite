import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import ResidentDashboard from './pages/ResidentDashboard'
import AdminDashboard from './pages/AdminDashboard'
import Avisos from './pages/Avisos'
import Pagos from './pages/Pagos'
import Paqueteria from './pages/Paqueteria'
import Asadores from './pages/Asadores'
import Votaciones from './pages/Votaciones'
import DashboardLayout from './layouts/DashboardLayout'

/** Redirects to login if not authenticated, or to the correct home if wrong role */
function RequireRole({ allowed, children }: { allowed: ('resident' | 'admin')[]; children: React.ReactElement }) {
  const { isAuthenticated, role } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!allowed.includes(role)) {
    return <Navigate to={role === 'admin' ? '/admin' : '/dashboard'} replace />
  }
  return children
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<DashboardLayout />}>
        {/* Resident-only home */}
        <Route path="/dashboard" element={
          <RequireRole allowed={['resident']}><ResidentDashboard /></RequireRole>
        } />
        {/* Admin-only home */}
        <Route path="/admin" element={
          <RequireRole allowed={['admin']}><AdminDashboard /></RequireRole>
        } />
        {/* Shared modules — both roles can access */}
        <Route path="/avisos" element={<Avisos />} />
        <Route path="/pagos" element={<Pagos />} />
        <Route path="/paqueteria" element={<Paqueteria />} />
        <Route path="/asadores" element={<Asadores />} />
        <Route path="/votaciones" element={<Votaciones />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
