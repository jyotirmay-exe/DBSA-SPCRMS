import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { appointmentsAPI, diagnosesAPI, prescriptionsAPI } from '../../services/api'
import Breadcrumb from '../../components/Breadcrumb'

const STATUS = {
  Scheduled: 'bg-blue-50 text-blue-700',
  Completed: 'bg-emerald-50 text-emerald-700',
  Cancelled: 'bg-slate-100 text-slate-600',
}
const SEVERITY = {
  Mild: 'bg-slate-100 text-slate-600',
  Moderate: 'bg-amber-50 text-amber-700',
  Severe: 'bg-red-50 text-red-700',
}

export default function PatientAppointmentDetail() {
  const { id } = useParams()
  const apptId = parseInt(id)
  const [appointment, setAppointment] = useState(null)
  const [diagnoses, setDiagnoses] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      appointmentsAPI.list(),
      diagnosesAPI.list(),
      prescriptionsAPI.list(),
    ]).then(([a, d, rx]) => {
      setAppointment(a.data.find(x => x.appointment_id === apptId) || null)
      setDiagnoses(d.data.filter(x => x.appointment_id === apptId))
      setPrescriptions(rx.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [apptId])

  if (loading) return <p className="text-slate-500">Loading…</p>
  if (!appointment) return <p className="text-slate-500">Appointment not found.</p>

  return (
    <div>
      <Breadcrumb items={[
        { label: 'My Health', to: '/patient/dashboard' },
        { label: `Appointment #${id}` },
      ]} />
      <h1 className="text-2xl font-semibold text-slate-800 mb-5">
        {new Date(appointment.scheduled_at).toLocaleString()}
      </h1>

      <div className="bg-white border border-slate-200 rounded-lg p-5 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <span className={`text-xs px-2 py-0.5 rounded ${STATUS[appointment.status] || ''}`}>{appointment.status}</span>
        </div>
        {appointment.notes && <p className="text-sm text-slate-600">{appointment.notes}</p>}
      </div>

      <h2 className="text-base font-semibold text-slate-700 mb-3">Diagnoses</h2>
      {diagnoses.length === 0 ? (
        <p className="text-slate-400 text-sm">No diagnoses recorded for this appointment.</p>
      ) : (
        <div className="space-y-3">
          {diagnoses.map(diag => {
            const rxList = prescriptions.filter(p => p.diagnosis_id === diag.diagnosis_id)
            return (
              <div key={diag.diagnosis_id} className="bg-white border border-slate-200 rounded-lg p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{diag.condition_name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${SEVERITY[diag.severity] || ''}`}>{diag.severity}</span>
                  </div>
                  <Link to={`/patient/diagnoses/${diag.diagnosis_id}`} className="text-xs text-slate-500 hover:text-slate-700">View →</Link>
                </div>
                {diag.description && <p className="text-sm text-slate-500 mb-2">{diag.description}</p>}
                <p className="text-xs text-slate-400 mb-3">Recorded {new Date(diag.recorded_at).toLocaleDateString()}</p>
                {rxList.length > 0 && (
                  <div className="border-t border-slate-100 pt-3 space-y-1">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Prescriptions</p>
                    {rxList.map(rx => (
                      <div key={rx.prescription_id} className="text-sm text-slate-700">
                        <span className="font-medium">{rx.medication_name}</span>
                        <span className="text-slate-500"> · {rx.dosage} · {rx.frequency} · {rx.duration}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
