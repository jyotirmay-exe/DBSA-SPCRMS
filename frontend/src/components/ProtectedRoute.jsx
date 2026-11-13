import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const ROLE_HOME = {
  admin: '/admin/dashboard',
  doctor: '/doctor/dashboard',
  lab_technician: '/lab/dashboard',
  patient: '/patient/dashboard',
}

export default function ProtectedRoute({ children, roles }) {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={ROLE_HOME[user.role] || '/login'} replace />
  }

  return children
}
