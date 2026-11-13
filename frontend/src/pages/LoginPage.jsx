import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const ROLE_HOME = {
  admin: '/admin/dashboard',
  doctor: '/doctor/dashboard',
  lab_technician: '/lab/dashboard',
  patient: '/patient/dashboard',
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(email, password)
      navigate(ROLE_HOME[user.role] || '/login')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Check credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="bg-white border border-slate-200 rounded-xl p-8 w-full max-w-sm shadow-sm">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-slate-800">SPCRMS</h1>
          <p className="text-sm text-slate-500 mt-0.5">Hospital Records Management</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5 uppercase tracking-wide">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="border border-slate-300 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800 placeholder-slate-400"
              placeholder="you@hospital.org"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5 uppercase tracking-wide">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="border border-slate-300 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-700 hover:bg-slate-800 text-white py-2 rounded text-sm font-medium disabled:opacity-50 transition-colors mt-2"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
