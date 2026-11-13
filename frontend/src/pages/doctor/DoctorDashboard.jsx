import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { appointmentsAPI } from '../../services/api'

const STATUS = {
  Scheduled: 'bg-blue-50 text-blue-700',
  Completed: 'bg-emerald-50 text-emerald-700',
  Cancelled: 'bg-slate-100 text-slate-600',
}

export default function DoctorDashboard() {
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    appointmentsAPI.list().then(r => setAppointments(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const today = new Date().toISOString().split('T')[0]
  const todayAppts = appointments.filter(a => a.scheduled_at?.startsWith(today))
  const scheduled = appointments.filter(a => a.status === 'Scheduled')
  const completed = appointments.filter(a => a.status === 'Completed').length
  const recent = [...appointments].sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at)).slice(0, 10)

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-semibold text-slate-800">Dashboard</h1>
        <Link to="/doctor/appointments/new" className="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded text-sm transition-colors">
          + Schedule Appointment
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-2xl font-semibold text-slate-800">{scheduled.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">Scheduled</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-2xl font-semibold text-slate-800">{todayAppts.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">Today</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-2xl font-semibold text-slate-800">{completed}</div>
          <div className="text-xs text-slate-500 mt-0.5">Completed</div>
        </div>
      </div>

      {loading ? <p className="text-slate-500">Loading…</p> : (
        <div className="flex gap-5">
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Today's Appointments</h2>
            <div className="rounded-lg border border-slate-200 overflow-hidden mb-5">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Patient</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Time</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {todayAppts.map(a => (
                    <tr key={a.appointment_id} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/doctor/appointments/${a.appointment_id}`)}>
                      <td className="px-4 py-2.5">
                        <Link to={`/doctor/patients/${a.patient_id}`} className="text-slate-700 hover:underline" onClick={e => e.stopPropagation()}>
                          {a.patient_name || `Patient #${a.patient_id}`}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-slate-700">{new Date(a.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="px-4 py-2.5"><span className={`text-xs px-2 py-0.5 rounded ${STATUS[a.status] || ''}`}>{a.status}</span></td>
                      <td className="px-4 py-2.5 text-slate-500 max-w-xs truncate">{a.notes}</td>
                    </tr>
                  ))}
                  {todayAppts.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-5 text-center text-slate-400">No appointments today.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <h2 className="text-sm font-semibold text-slate-700 mb-3">Recent Appointments</h2>
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Patient</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Date & Time</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {recent.map(a => (
                    <tr key={a.appointment_id} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/doctor/appointments/${a.appointment_id}`)}>
                      <td className="px-4 py-2.5">
                        <Link to={`/doctor/patients/${a.patient_id}`} className="text-slate-700 hover:underline" onClick={e => e.stopPropagation()}>
                          {a.patient_name || `Patient #${a.patient_id}`}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-slate-700">{new Date(a.scheduled_at).toLocaleString()}</td>
                      <td className="px-4 py-2.5"><span className={`text-xs px-2 py-0.5 rounded ${STATUS[a.status] || ''}`}>{a.status}</span></td>
                    </tr>
                  ))}
                  {recent.length === 0 && (
                    <tr><td colSpan={3} className="px-4 py-5 text-center text-slate-400">No appointments.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="w-52 shrink-0">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Quick Actions</h2>
            <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2">
              <Link to="/doctor/appointments/new" className="block text-sm px-3 py-2 rounded border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">+ Schedule Appointment</Link>
              <Link to="/doctor/appointments" className="block text-sm px-3 py-2 rounded border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">All Appointments</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
