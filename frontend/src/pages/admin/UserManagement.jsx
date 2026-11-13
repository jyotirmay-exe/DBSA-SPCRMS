import { useEffect, useState } from 'react'
import { usersAPI, patientsAPI, professionalsAPI } from '../../services/api'

const ROLES = ['admin', 'doctor', 'lab_technician', 'patient']

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', role: 'patient', linked_id: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [patients, setPatients] = useState([])
  const [professionals, setProfessionals] = useState([])

  function load() {
    usersAPI.list().then(r => setUsers(r.data)).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    patientsAPI.list().then(r => setPatients(r.data)).catch(() => {})
    professionalsAPI.list().then(r => setProfessionals(r.data)).catch(() => {})
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    setError(''); setSuccess('')
    try {
      const payload = { ...form }
      if (payload.linked_id === '' || payload.linked_id === undefined) {
        payload.linked_id = null
      } else {
        payload.linked_id = parseInt(payload.linked_id, 10)
      }
      await usersAPI.create(payload)
      setSuccess('User created.')
      setForm({ email: '', password: '', role: 'patient', linked_id: '' })
      setShowForm(false)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create user.')
    }
  }

  async function handleDeactivate(id) {
    if (!confirm('Deactivate this user?')) return
    await usersAPI.deactivate(id)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
          {showForm ? 'Cancel' : '+ New User'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-slate-200 rounded-lg p-5 mb-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Create User</h2>
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          {success && <p className="text-green-600 text-sm mb-3">{success}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Email *</label>
              <input className="w-full border border-slate-300 rounded px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400" type="email" required
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Password *</label>
              <input className="w-full border border-slate-300 rounded px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400" type="password" required
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Role *</label>
              <select className="w-full border border-slate-300 rounded px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                value={form.role} onChange={e => setForm({ ...form, role: e.target.value, linked_id: '' })}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                {form.role === 'patient' ? 'Linked Patient' : form.role === 'admin' ? 'No Link Required' : 'Linked Professional'}
              </label>
              {form.role === 'patient' ? (
                <select className="w-full border border-slate-300 rounded px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  value={form.linked_id} onChange={e => setForm({ ...form, linked_id: e.target.value })}>
                  <option value="">Select patient…</option>
                  {patients.map(p => <option key={p.patient_id} value={p.patient_id}>{p.full_name} (#{p.patient_id})</option>)}
                </select>
              ) : form.role === 'doctor' ? (
                <select className="w-full border border-slate-300 rounded px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  value={form.linked_id} onChange={e => setForm({ ...form, linked_id: e.target.value })}>
                  <option value="">Select doctor…</option>
                  {professionals.filter(p => p.role === 'Doctor').map(p => <option key={p.professional_id} value={p.professional_id}>{p.full_name} (#{p.professional_id})</option>)}
                </select>
              ) : form.role === 'lab_technician' ? (
                <select className="w-full border border-slate-300 rounded px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  value={form.linked_id} onChange={e => setForm({ ...form, linked_id: e.target.value })}>
                  <option value="">Select lab technician…</option>
                  {professionals.filter(p => p.role === 'Lab Technician').map(p => <option key={p.professional_id} value={p.professional_id}>{p.full_name} (#{p.professional_id})</option>)}
                </select>
              ) : (
                <input disabled className="w-full border border-slate-200 rounded px-3 py-2 text-sm text-slate-400 bg-slate-50" placeholder="N/A" />
              )}
            </div>
          </div>
          <button type="submit" className="mt-4 bg-slate-700 hover:bg-slate-800 text-white px-5 py-2 rounded text-sm font-medium transition-colors">
            Create User
          </button>
        </form>
      )}

      {loading ? <p>Loading…</p> : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Role</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map(u => (
                <tr key={u.user_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">{u.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.is_active && (
                      <button onClick={() => handleDeactivate(u.user_id)} className="text-red-600 hover:underline text-xs">
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
