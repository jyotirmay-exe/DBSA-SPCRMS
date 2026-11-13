import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { diagnosesAPI } from '../../services/api'
import Breadcrumb from '../../components/Breadcrumb'

const SEVERITY = {
  Mild: 'bg-slate-100 text-slate-600',
  Moderate: 'bg-amber-50 text-amber-700',
  Severe: 'bg-red-50 text-red-700',
}

export default function AdminDiagnoses() {
  const [rows, setRows] = useState([])
  const navigate = useNavigate()
  useEffect(() => { diagnosesAPI.list().then(r => setRows(r.data)).catch(() => {}) }, [])

  return (
    <div>
      <Breadcrumb items={[{ label: 'Admin Dashboard', to: '/admin/dashboard' }, { label: 'Diagnoses' }]} />
      <h1 className="text-2xl font-semibold text-slate-800 mb-6">All Diagnoses</h1>
      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Condition</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Severity</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Patient</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Appointment</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Recorded</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map(d => (
              <tr key={d.diagnosis_id} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/admin/diagnoses/${d.diagnosis_id}`)}>
                <td className="px-4 py-3 font-medium text-slate-800">{d.condition_name}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${SEVERITY[d.severity] || ''}`}>{d.severity}</span>
                </td>
                <td className="px-4 py-3 text-slate-700">{d.patient_name || `#${d.patient_id}`}</td>
                <td className="px-4 py-3 text-slate-500">#{d.appointment_id}</td>
                <td className="px-4 py-3 text-slate-500">{new Date(d.recorded_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No diagnoses.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
