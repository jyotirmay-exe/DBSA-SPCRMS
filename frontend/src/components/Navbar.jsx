import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <header className="h-12 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-5 shrink-0">
      <span className="text-white font-semibold text-sm tracking-wide">SPCRMS</span>
      <div className="flex items-center gap-4 text-sm">
        {user && <span className="text-slate-400 text-xs">{user.email}</span>}
        {user && (
          <button onClick={handleLogout} className="text-slate-300 hover:text-white transition-colors">
            Sign out
          </button>
        )}
      </div>
    </header>
  )
}
