import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { appointmentsAPI, labInvestigationsAPI } from '../../services/api'
import Breadcrumb from '../../components/Breadcrumb'

const STATUS = {
  Scheduled: 'bg-blue-50 text-blue-700',
  Completed: 'bg-emerald-50 text-emerald-700',
  Cancelled: 'bg-slate-100 text-slate-600',
  Pending: 'bg-amber-50 text-amber-700',
}

export default function PatientDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [labOrders, setLabOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const patientId = user?.linked_id

  useEffect(() => {
    if (!patientId) return
    Promise.all([
      appointmentsAPI.list(),
      labInvestigationsAPI.list({ patient_id: patientId }),
    ]).then(([a, lab]) => {
      setAppointments(
        a.data
          .filter(x => x.patient_id === patientId)
          .sort((x, y) => new Date(y.scheduled_at) - new Date(x.scheduled_at))
      )
      setLabOrders(lab.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [patientId])

  if (loading) return <p className="text-slate-500">Loading…</p>

  return (
    <div>
      <Breadcrumb items={[{ label: 'My Health' }]} />
      <h1 className="text-2xl font-semibold text-slate-800 mb-6">My Health Record</h1>

      <section className="mb-8">
        <h2 className="text-base font-semibold text-slate-700 mb-3">My Appointments</h2>
        {appointments.length === 0 ? (
          <p className="text-slate-400 text-sm">No appointments.</p>
        ) : (
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Date & Time</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Notes</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {appointments.map(a => (
                  <tr
                    key={a.appointment_id}
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => navigate(`/patient/appointments/${a.appointment_id}`)}
                  >
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {new Date(a.scheduled_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${STATUS[a.status] || ''}`}>{a.status}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{a.notes || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs text-slate-400">View →</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-base font-semibold text-slate-700 mb-3">My Lab Results</h2>
        {labOrders.length === 0 ? (
          <p className="text-slate-400 text-sm">No lab results.</p>
        ) : (
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Test</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Ordered</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {labOrders.map(l => (
                  <tr
                    key={l.investigation_id}
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => navigate(`/patient/lab-investigations/${l.investigation_id}`)}
                  >
                    <td className="px-4 py-3 font-medium text-slate-800">{l.test_name}</td>
                    <td className="px-4 py-3 text-slate-500">{l.test_type}</td>
                    <td className="px-4 py-3 text-slate-500">{new Date(l.ordered_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${STATUS[l.status] || ''}`}>{l.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs text-slate-400">View →</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
