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

export default function AdminAppointmentDetail() {
  const { id } = useParams()
  const apptId = parseInt(id)
  const [appointment, setAppointment] = useState(null)
  const [diagnoses, setDiagnoses] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      appointmentsAPI.get(apptId),
      diagnosesAPI.list(),
      prescriptionsAPI.list(),
    ]).then(([a, d, rx]) => {
      setAppointment(a.data)
      setDiagnoses(d.data.filter(diag => diag.appointment_id === apptId))
      setPrescriptions(rx.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [apptId])

  if (loading) return <p className="text-slate-500">Loading…</p>
  if (!appointment) return <p className="text-slate-500">Appointment not found.</p>

  return (
    <div>
      <Breadcrumb items={[
        { label: 'Admin Dashboard', to: '/admin/dashboard' },
        { label: 'Appointments', to: '/admin/appointments' },
        { label: `Appointment #${id}` },
      ]} />

      <h1 className="text-2xl font-semibold text-slate-800 mb-5">Appointment #{id}</h1>

      <div className="bg-white border border-slate-200 rounded-lg p-5 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 text-sm">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Date / Time</div>
            <div className="text-slate-800">{new Date(appointment.scheduled_at).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Patient</div>
            <Link to={`/doctor/patients/${appointment.patient_id}`} className="text-slate-700 hover:underline">
              {appointment.patient_name || `Patient #${appointment.patient_id}`}
            </Link>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Professional</div>
            <div className="text-slate-800">{appointment.professional_name || `Dr. #${appointment.professional_id}`}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Status</div>
            <span className={`text-xs px-2 py-0.5 rounded ${STATUS[appointment.status] || ''}`}>{appointment.status}</span>
          </div>
        </div>
        {appointment.notes && (
          <div className="mt-4 pt-4 border-t border-slate-100 text-sm text-slate-600">{appointment.notes}</div>
        )}
      </div>

      <h2 className="text-base font-semibold text-slate-700 mb-3">Diagnoses</h2>
      {diagnoses.length === 0 ? (
        <p className="text-slate-400 text-sm">No diagnoses recorded for this appointment.</p>
      ) : (
        diagnoses.map(diag => {
          const rxList = prescriptions.filter(p => p.diagnosis_id === diag.diagnosis_id)
          return (
            <div key={diag.diagnosis_id} className="bg-white border border-slate-200 rounded-lg p-5 mb-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-slate-800">{diag.condition_name}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${SEVERITY[diag.severity] || ''}`}>{diag.severity}</span>
                <Link to={`/admin/diagnoses/${diag.diagnosis_id}`} className="ml-auto text-xs text-slate-500 hover:text-slate-700">
                  View diagnosis →
                </Link>
              </div>
              {diag.description && <p className="text-slate-500 text-sm mb-1">{diag.description}</p>}
              <p className="text-xs text-slate-400 mb-3">Recorded: {new Date(diag.recorded_at).toLocaleDateString()}</p>

              {rxList.length > 0 && (
                <div className="border-t border-slate-100 pt-3">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Prescriptions</div>
                  <div className="space-y-1">
                    {rxList.map(rx => (
                      <div key={rx.prescription_id} className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-slate-800">{rx.medication_name}</span>
                        <span className="text-slate-500">· {rx.dosage} · {rx.frequency} · {rx.duration}</span>
                        <Link to={`/admin/prescriptions/${rx.prescription_id}`} className="ml-auto text-xs text-slate-500 hover:text-slate-700">
                          View →
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
