import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { professionalsAPI } from '../../services/api'

export default function ProfessionalList() {
  const [professionals, setProfessionals] = useState([])
  const [loading, setLoading] = useState(true)

  function load() {
    professionalsAPI.list().then(r => setProfessionals(r.data)).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleDeactivate(id) {
    if (!confirm('Deactivate this professional?')) return
    await professionalsAPI.deactivate(id)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Healthcare Professionals</h1>
        <Link to="/admin/professionals/new" className="bg-green-700 text-white px-4 py-2 rounded text-sm hover:bg-green-800">
          + New Professional
        </Link>
      </div>
      {loading ? <p>Loading…</p> : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Role</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Specialization</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Contact</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {professionals.map(p => (
                <tr key={p.professional_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{p.full_name}</td>
                  <td className="px-4 py-3">
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded">{p.role}</span>
                  </td>
                  <td className="px-4 py-3">{p.specialization}</td>
                  <td className="px-4 py-3">{p.contact_number}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${p.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {p.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <Link to={`/admin/professionals/${p.professional_id}/edit`} className="text-blue-600 hover:underline text-xs">Edit</Link>
                    {p.is_active && (
                      <button onClick={() => handleDeactivate(p.professional_id)} className="text-red-600 hover:underline text-xs">
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {professionals.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">No professionals found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
