import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { patientsAPI, professionalsAPI, appointmentsAPI, usersAPI, diagnosesAPI, prescriptionsAPI, labInvestigationsAPI } from '../../services/api'

const STATUS = {
  Scheduled: 'bg-blue-50 text-blue-700',
  Completed: 'bg-emerald-50 text-emerald-700',
  Cancelled: 'bg-slate-100 text-slate-600',
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ patients: 0, professionals: 0, appointments: 0, users: 0, diagnoses: 0, prescriptions: 0, lab_investigations: 0 })
  const [recentAppointments, setRecentAppointments] = useState([])
  const [pendingLab, setPendingLab] = useState(0)

  useEffect(() => {
    Promise.all([
      patientsAPI.list(),
      professionalsAPI.list(),
      appointmentsAPI.list(),
      usersAPI.list(),
      diagnosesAPI.list(),
      prescriptionsAPI.list(),
      labInvestigationsAPI.list(),
    ]).then(([p, pr, a, u, d, rx, lab]) => {
      setStats({
        patients: p.data.length,
        professionals: pr.data.length,
        appointments: a.data.length,
        users: u.data.length,
        diagnoses: d.data.length,
        prescriptions: rx.data.length,
        lab_investigations: lab.data.length,
      })
      const sorted = [...a.data].sort((x, y) => new Date(y.scheduled_at) - new Date(x.scheduled_at))
      setRecentAppointments(sorted.slice(0, 8))
      setPendingLab(lab.data.filter(l => l.status === 'Pending').length)
    }).catch(() => {})
  }, [])

  const cards = [
    { label: 'Patients',      value: stats.patients,           to: '/admin/patients' },
    { label: 'Professionals', value: stats.professionals,      to: '/admin/professionals' },
    { label: 'Users',         value: stats.users,              to: '/admin/users' },
    { label: 'Appointments',  value: stats.appointments,       to: '/admin/appointments' },
    { label: 'Diagnoses',     value: stats.diagnoses,          to: '/admin/diagnoses' },
    { label: 'Prescriptions', value: stats.prescriptions,      to: '/admin/prescriptions' },
    { label: 'Lab Orders',    value: stats.lab_investigations, to: '/admin/lab-investigations' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-800 mb-5">Admin Dashboard</h1>

      <div className="grid grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {cards.map(c => (
          <Link key={c.label} to={c.to} className="bg-white border border-slate-200 rounded-lg p-4 hover:border-slate-300 hover:shadow-sm transition-shadow text-center">
            <div className="text-2xl font-semibold text-slate-800">{c.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{c.label}</div>
          </Link>
        ))}
      </div>

      <div className="flex gap-5">
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Recent Appointments</h2>
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Date</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Patient</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {recentAppointments.map(a => (
                  <tr
                    key={a.appointment_id}
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => navigate(`/admin/appointments/${a.appointment_id}`)}
                  >
                    <td className="px-4 py-2.5 text-slate-700">{new Date(a.scheduled_at).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-slate-500">{a.patient_name || `#${a.patient_id}`}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded ${STATUS[a.status] || ''}`}>{a.status}</span>
                    </td>
                  </tr>
                ))}
                {recentAppointments.length === 0 && (
                  <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-400">No appointments.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="w-60 shrink-0 space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Link to="/admin/patients/new" className="block text-sm px-3 py-2 rounded border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">+ New Patient</Link>
              <Link to="/admin/professionals/new" className="block text-sm px-3 py-2 rounded border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">+ New Professional</Link>
              <Link to="/doctor/appointments/new" className="block text-sm px-3 py-2 rounded border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">Schedule Appointment</Link>
              <Link to="/admin/users" className="block text-sm px-3 py-2 rounded border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">Manage Users</Link>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Pending Lab Orders</div>
            <Link to="/admin/lab-investigations" className="text-2xl font-semibold text-amber-700 hover:text-amber-800">
              {pendingLab}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
