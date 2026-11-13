import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { appointmentsAPI } from '../../services/api'
import Breadcrumb from '../../components/Breadcrumb'

const STATUS = {
  Scheduled: 'bg-blue-50 text-blue-700',
  Completed: 'bg-emerald-50 text-emerald-700',
  Cancelled: 'bg-slate-100 text-slate-600',
}

export default function AppointmentList() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  function load() {
    appointmentsAPI.list().then(r => setAppointments(r.data)).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleStatusChange(e, id, status) {
    e.stopPropagation()
    await appointmentsAPI.updateStatus(id, status)
    load()
  }

  return (
    <div>
      <Breadcrumb items={[{ label: 'Appointments' }]} />
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
                <th className="px-4 py-3 text-left font-medium text-slate-600">Patient</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Date & Time</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Notes</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {appointments.map(a => (
                <tr
                  key={a.appointment_id}
                  className="hover:bg-slate-50 cursor-pointer"
                  onClick={() => navigate(`/doctor/appointments/${a.appointment_id}`)}
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/doctor/patients/${a.patient_id}`}
                      className="text-slate-700 hover:underline"
                      onClick={e => e.stopPropagation()}
                    >
                      {a.patient_name || `Patient #${a.patient_id}`}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{new Date(a.scheduled_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${STATUS[a.status] || ''}`}>{a.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{a.notes}</td>
                  <td className="px-4 py-3">
                    {a.status === 'Scheduled' && (
                      <div className="flex gap-3">
                        <button onClick={(e) => handleStatusChange(e, a.appointment_id, 'Completed')} className="text-emerald-700 hover:underline text-xs">Complete</button>
                        <button onClick={(e) => handleStatusChange(e, a.appointment_id, 'Cancelled')} className="text-red-600 hover:underline text-xs">Cancel</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {appointments.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">No appointments.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
