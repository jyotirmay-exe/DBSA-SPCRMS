import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { appointmentsAPI } from '../../services/api'
import Breadcrumb from '../../components/Breadcrumb'

const STATUS = {
  Scheduled: 'bg-blue-50 text-blue-700',
  Completed: 'bg-emerald-50 text-emerald-700',
  Cancelled: 'bg-slate-100 text-slate-600',
}

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    appointmentsAPI.list()
      .then(r => setAppointments(r.data.sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at))))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <Breadcrumb items={[{ label: 'Admin Dashboard', to: '/admin/dashboard' }, { label: 'Appointments' }]} />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Appointments</h1>
        <Link to="/doctor/appointments/new" className="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded text-sm transition-colors">
          + Schedule
        </Link>
      </div>
      {loading ? <p className="text-slate-500">Loading…</p> : (
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Date / Time</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Patient</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Professional</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Notes</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {appointments.map(a => (
                <tr
                  key={a.appointment_id}
                  className="hover:bg-slate-50 cursor-pointer"
                  onClick={() => navigate(`/admin/appointments/${a.appointment_id}`)}
                >
                  <td className="px-4 py-3 text-slate-800">{new Date(a.scheduled_at).toLocaleString()}</td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <Link to={`/doctor/patients/${a.patient_id}`} className="text-slate-700 hover:underline">
                      {a.patient_name || `Patient #${a.patient_id}`}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{a.professional_name || `Dr. #${a.professional_id}`}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${STATUS[a.status] || ''}`}>{a.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{a.notes}</td>
                  <td className="px-4 py-3 text-right text-xs text-slate-400">View →</td>
                </tr>
              ))}
              {appointments.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No appointments.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
