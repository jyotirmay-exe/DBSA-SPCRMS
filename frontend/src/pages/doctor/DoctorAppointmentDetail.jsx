import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
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

export default function DoctorAppointmentDetail() {
  const { id } = useParams()
  const apptId = parseInt(id)
  const [appt, setAppt] = useState(null)
  const [diagnoses, setDiagnoses] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      appointmentsAPI.get(apptId),
      diagnosesAPI.list(),
      prescriptionsAPI.list(),
    ]).then(([a, d, rx]) => {
      setAppt(a.data)
      setDiagnoses(d.data.filter(x => x.appointment_id === apptId))
      setPrescriptions(rx.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [apptId])

  if (loading) return <p className="text-slate-500">Loading…</p>
  if (!appt) return <p className="text-slate-500">Appointment not found.</p>

  return (
    <div>
      <Breadcrumb items={[{ label: 'Appointments', to: '/doctor/appointments' }, { label: `Appointment #${id}` }]} />
      <h1 className="text-2xl font-semibold text-slate-800 mb-5">Appointment #{id}</h1>

      <div className="bg-white border border-slate-200 rounded-lg p-5 mb-6">
        <div className="grid grid-cols-2 gap-5 text-sm">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Date / Time</div>
            <div className="text-slate-800">{new Date(appt.scheduled_at).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Patient</div>
            <Link to={`/doctor/patients/${appt.patient_id}`} className="text-slate-700 hover:underline">
              {appt.patient_name || `Patient #${appt.patient_id}`}
            </Link>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Status</div>
            <span className={`text-xs px-2 py-0.5 rounded ${STATUS[appt.status] || ''}`}>{appt.status}</span>
          </div>
          {appt.notes && (
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Notes</div>
              <div className="text-slate-700">{appt.notes}</div>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <Link
          to={`/doctor/diagnoses/new?appointment_id=${apptId}&patient_id=${appt.patient_id}`}
          className="bg-slate-700 hover:bg-slate-800 text-white px-3 py-1.5 rounded text-sm transition-colors"
        >
          + Diagnosis
        </Link>
        <Link
          to={`/doctor/lab-orders/new?patient_id=${appt.patient_id}`}
          className="border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded text-sm transition-colors"
        >
          + Lab Order
        </Link>
      </div>

      <h2 className="text-base font-semibold text-slate-700 mb-3">Diagnoses</h2>
      {diagnoses.length === 0 ? (
        <p className="text-slate-400 text-sm">No diagnoses yet. Add one above.</p>
      ) : (
        diagnoses.map(d => {
          const rxList = prescriptions.filter(p => p.diagnosis_id === d.diagnosis_id)
          return (
            <div key={d.diagnosis_id} className="bg-white border border-slate-200 rounded-lg p-5 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-slate-800">{d.condition_name}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${SEVERITY[d.severity] || ''}`}>{d.severity}</span>
                <Link to={`/doctor/diagnoses/${d.diagnosis_id}`} className="ml-auto text-xs text-slate-500 hover:text-slate-700">View →</Link>
              </div>
              {d.description && <p className="text-sm text-slate-500 mb-2">{d.description}</p>}
              <p className="text-xs text-slate-400 mb-3">Recorded: {new Date(d.recorded_at).toLocaleDateString()}</p>

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
              <div className="mt-3">
                <Link
                  to={`/doctor/prescriptions/new?diagnosis_id=${d.diagnosis_id}&patient_id=${appt.patient_id}`}
                  className="text-sm text-slate-600 hover:text-slate-800 hover:underline"
                >
                  + Prescription
                </Link>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
