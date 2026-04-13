import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import ResidentDashboard from './pages/ResidentDashboard'
import AdminDashboard from './pages/AdminDashboard'
import DashboardLayout from './layouts/DashboardLayout'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<ResidentDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
