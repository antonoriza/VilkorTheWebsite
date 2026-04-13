import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import ResidentDashboard from './pages/ResidentDashboard'
import AdminDashboard from './pages/AdminDashboard'
import Avisos from './pages/Avisos'
import Pagos from './pages/Pagos'
import Paqueteria from './pages/Paqueteria'
import Asadores from './pages/Asadores'
import Votaciones from './pages/Votaciones'
import DashboardLayout from './layouts/DashboardLayout'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<ResidentDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
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
