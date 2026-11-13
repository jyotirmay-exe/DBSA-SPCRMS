import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { prescriptionsAPI } from '../../services/api'
import Breadcrumb from '../../components/Breadcrumb'

export default function AdminPrescriptions() {
  const [rows, setRows] = useState([])
  const navigate = useNavigate()
  useEffect(() => { prescriptionsAPI.list().then(r => setRows(r.data)).catch(() => {}) }, [])

  return (
    <div>
      <Breadcrumb items={[{ label: 'Admin Dashboard', to: '/admin/dashboard' }, { label: 'Prescriptions' }]} />
      <h1 className="text-2xl font-semibold text-slate-800 mb-6">All Prescriptions</h1>
      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Medication</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Dosage · Frequency · Duration</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">For Condition</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Appointment Date</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Patient</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map(rx => (
              <tr key={rx.prescription_id} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/admin/prescriptions/${rx.prescription_id}`)}>
                <td className="px-4 py-3 font-medium text-slate-800">{rx.medication_name}</td>
                <td className="px-4 py-3 text-slate-500">{rx.dosage} · {rx.frequency} · {rx.duration}</td>
                <td className="px-4 py-3 text-slate-600">{rx.condition_name || '—'}</td>
                <td className="px-4 py-3 text-slate-500">{rx.appointment_date || '—'}</td>
                <td className="px-4 py-3 text-slate-700">{rx.patient_name || `#${rx.patient_id}`}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No prescriptions.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
