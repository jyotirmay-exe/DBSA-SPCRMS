import { useEffect, useState } from 'react'
import { appointmentsAPI, diagnosesAPI, prescriptionsAPI } from '../../services/api'

function ChevronIcon({ open }) {
  return (
    <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}

function PrescriptionRow({ rx }) {
  return (
    <div className="ml-12 pl-4 border-l-2 border-purple-100 py-2 text-sm flex gap-6">
      <span className="font-medium text-purple-900 w-44 shrink-0">{rx.medication_name}</span>
      <span className="text-gray-500">{rx.dosage}</span>
      <span className="text-gray-500">{rx.frequency}</span>
      <span className="text-gray-500">{rx.duration}</span>
      {rx.notes && <span className="text-gray-400 italic">{rx.notes}</span>}
    </div>
  )
}

function DiagnosisRow({ diag, prescriptions }) {
  const [open, setOpen] = useState(false)
  const rxList = prescriptions.filter(p => p.diagnosis_id === diag.diagnosis_id)
  const severityColor = { Mild: 'bg-green-100 text-green-800', Moderate: 'bg-yellow-100 text-yellow-800', Severe: 'bg-red-100 text-red-800' }

  return (
    <div className="ml-6 border-l-2 border-blue-100">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-blue-50 text-left"
      >
        <ChevronIcon open={open} />
        <span className="font-medium text-sm text-blue-900 flex-1">{diag.condition_name}</span>
        <span className={`text-xs px-2 py-0.5 rounded ${severityColor[diag.severity] || ''}`}>{diag.severity}</span>
        <span className="text-xs text-gray-400 ml-2">{rxList.length} prescription{rxList.length !== 1 ? 's' : ''}</span>
      </button>
      {open && (
        <div className="pb-2">
          {diag.description && (
            <p className="ml-12 pl-4 text-xs text-gray-500 italic mb-1">{diag.description}</p>
          )}
          {rxList.length === 0
            ? <p className="ml-12 pl-4 text-xs text-gray-400 py-1">No prescriptions.</p>
            : rxList.map(rx => <PrescriptionRow key={rx.prescription_id} rx={rx} />)
          }
        </div>
      )}
    </div>
  )
}

function AppointmentRow({ appt, diagnoses, prescriptions }) {
  const [open, setOpen] = useState(false)
  const diagList = diagnoses.filter(d => d.appointment_id === appt.appointment_id)
  const statusColor = { Scheduled: 'bg-blue-100 text-blue-800', Completed: 'bg-green-100 text-green-800', Cancelled: 'bg-red-100 text-red-800' }

  return (
    <div className="border rounded-lg mb-3 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 text-left"
      >
        <ChevronIcon open={open} />
        <span className="font-semibold text-sm flex-1">
          {new Date(appt.scheduled_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          {' · '}
          <span className="font-normal text-gray-600">Patient #{appt.patient_id}</span>
          {appt.notes && <span className="font-normal text-gray-400"> — {appt.notes}</span>}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded ${statusColor[appt.status] || ''}`}>{appt.status}</span>
        <span className="text-xs text-gray-400">{diagList.length} diagnosis{diagList.length !== 1 ? 'es' : ''}</span>
      </button>
      {open && (
        <div className="py-2">
          {diagList.length === 0
            ? <p className="ml-6 pl-4 text-sm text-gray-400 py-2">No diagnoses recorded.</p>
            : diagList.map(d => (
                <DiagnosisRow key={d.diagnosis_id} diag={d} prescriptions={prescriptions} />
              ))
          }
        </div>
      )}
    </div>
  )
}

export default function AdminClinical() {
  const [appointments, setAppointments] = useState([])
  const [diagnoses, setDiagnoses] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      appointmentsAPI.list(),
      diagnosesAPI.list(),
      prescriptionsAPI.list(),
    ]).then(([a, d, rx]) => {
      setAppointments(a.data.sort((x, y) => new Date(y.scheduled_at) - new Date(x.scheduled_at)))
      setDiagnoses(d.data)
      setPrescriptions(rx.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <p>Loading…</p>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Clinical Records</h1>
      <p className="text-sm text-gray-500 mb-6">Appointments → Diagnoses → Prescriptions</p>
      {appointments.length === 0
        ? <p className="text-gray-400">No appointments.</p>
        : appointments.map(a => (
            <AppointmentRow
              key={a.appointment_id}
              appt={a}
              diagnoses={diagnoses}
              prescriptions={prescriptions}
            />
          ))
      }
    </div>
  )
}
