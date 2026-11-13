import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { patientsAPI } from '../../services/api'

export default function PatientList() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  function load() {
    patientsAPI.list().then(r => setPatients(r.data)).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleDeactivate(id) {
    if (!confirm('Deactivate this patient?')) return
    await patientsAPI.deactivate(id)
    load()
  }

  const filtered = patients.filter(p =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Patients</h1>
        <Link to="/admin/patients/new" className="bg-blue-700 text-white px-4 py-2 rounded text-sm hover:bg-blue-800">
          + New Patient
        </Link>
      </div>
      <input
        className="w-full max-w-sm border rounded px-3 py-2 text-sm mb-4"
        placeholder="Search by name or email…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      {loading ? <p>Loading…</p> : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">DOB</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Gender</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Contact</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(p => (
                <tr key={p.patient_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link to={`/doctor/patients/${p.patient_id}`} className="text-blue-700 hover:underline font-medium">
                      {p.full_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{p.date_of_birth}</td>
                  <td className="px-4 py-3 capitalize">{p.gender}</td>
                  <td className="px-4 py-3">{p.contact_number}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${p.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {p.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <Link to={`/admin/patients/${p.patient_id}/edit`} className="text-blue-600 hover:underline text-xs">Edit</Link>
                    {p.is_active && (
                      <button onClick={() => handleDeactivate(p.patient_id)} className="text-red-600 hover:underline text-xs">
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">No patients found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
