import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { labInvestigationsAPI } from '../../services/api'
import Breadcrumb from '../../components/Breadcrumb'

const STATUS = {
  Pending: 'bg-amber-50 text-amber-700',
  Completed: 'bg-emerald-50 text-emerald-700',
}

export default function AdminLabInvestigations() {
  const [rows, setRows] = useState([])
  const navigate = useNavigate()
  useEffect(() => { labInvestigationsAPI.list().then(r => setRows(r.data)).catch(() => {}) }, [])

  return (
    <div>
      <Breadcrumb items={[{ label: 'Admin Dashboard', to: '/admin/dashboard' }, { label: 'Lab Investigations' }]} />
      <h1 className="text-2xl font-semibold text-slate-800 mb-6">All Lab Investigations</h1>
      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Test Name</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Type</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Patient</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Ordered</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map(l => (
              <tr key={l.investigation_id} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/admin/lab-investigations/${l.investigation_id}`)}>
                <td className="px-4 py-3 font-medium text-slate-800">{l.test_name}</td>
                <td className="px-4 py-3 text-slate-500">{l.test_type}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${STATUS[l.status] || ''}`}>{l.status}</span>
                </td>
                <td className="px-4 py-3 text-slate-700">{l.patient_name || `#${l.patient_id}`}</td>
                <td className="px-4 py-3 text-slate-500">{new Date(l.ordered_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No investigations.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
