import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { patientsAPI, diagnosesAPI, prescriptionsAPI, labInvestigationsAPI, appointmentsAPI } from '../../services/api'
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

function Section({ title, children }) {
  return (
    <div className="mb-8">
      <h2 className="text-base font-semibold text-slate-700 mb-3 border-b border-slate-200 pb-2">{title}</h2>
      {children}
    </div>
  )
}

export default function PatientRecord() {
  const { id } = useParams()
  const [patient, setPatient] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [diagnoses, setDiagnoses] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [labOrders, setLabOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      patientsAPI.get(id),
      appointmentsAPI.list(),
      diagnosesAPI.list(id),
      prescriptionsAPI.list(id),
      labInvestigationsAPI.list({ patient_id: id }),
    ]).then(([p, a, d, rx, lab]) => {
      setPatient(p.data)
      setAppointments(a.data.filter(x => x.patient_id === parseInt(id)))
      setDiagnoses(d.data)
      setPrescriptions(rx.data)
      setLabOrders(lab.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="text-slate-500">Loading…</p>
  if (!patient) return <p className="text-slate-500">Patient not found.</p>

  return (
    <div>
      <Breadcrumb items={[{ label: 'Appointments', to: '/doctor/appointments' }, { label: patient.full_name }]} />
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">{patient.full_name}</h1>
          <p className="text-slate-500 text-sm mt-0.5">DOB: {patient.date_of_birth} · {patient.gender} · {patient.contact_number}</p>
          <p className="text-slate-500 text-sm">{patient.email}</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/doctor/diagnoses/new?patient_id=${id}`} className="bg-slate-700 hover:bg-slate-800 text-white px-3 py-1.5 rounded text-sm transition-colors">
            + Diagnosis
          </Link>
          <Link to={`/doctor/prescriptions/new?patient_id=${id}`} className="border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded text-sm transition-colors">
            + Prescription
          </Link>
          <Link to={`/doctor/lab-orders/new?patient_id=${id}`} className="border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded text-sm transition-colors">
            + Lab Order
          </Link>
        </div>
      </div>

      <Section title="Appointments">
        {appointments.length === 0 ? <p className="text-slate-400 text-sm">None.</p> : (
          <div className="space-y-2">
            {appointments.map(a => (
              <div key={a.appointment_id} className="bg-white border border-slate-200 rounded-lg p-3 text-sm flex justify-between items-center">
                <span className="font-medium text-slate-800">{new Date(a.scheduled_at).toLocaleString()}</span>
                <span className="text-slate-500 flex-1 mx-4 truncate">{a.notes}</span>
                <span className={`text-xs px-2 py-0.5 rounded mr-3 ${STATUS[a.status] || ''}`}>{a.status}</span>
                <Link to={`/doctor/appointments/${a.appointment_id}`} className="text-slate-500 hover:text-slate-700 text-xs">View →</Link>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Diagnoses">
        {diagnoses.length === 0 ? <p className="text-slate-400 text-sm">None.</p> : (
          <div className="space-y-2">
            {diagnoses.map(d => (
              <div key={d.diagnosis_id} className="bg-white border border-slate-200 rounded-lg p-3 text-sm flex justify-between items-start">
                <div>
                  <div className="font-medium text-slate-800">{d.condition_name}</div>
                  <div className="text-slate-500 mt-0.5">{d.description}</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-xs px-2 py-0.5 rounded ${SEVERITY[d.severity] || ''}`}>{d.severity}</span>
                    <span className="text-xs text-slate-400">{new Date(d.recorded_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <Link to={`/doctor/diagnoses/${d.diagnosis_id}`} className="text-slate-500 hover:text-slate-700 text-xs ml-4 shrink-0">View →</Link>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Prescriptions">
        {prescriptions.length === 0 ? <p className="text-slate-400 text-sm">None.</p> : (
          <div className="space-y-2">
            {prescriptions.map(rx => (
              <div key={rx.prescription_id} className="bg-white border border-slate-200 rounded-lg p-3 text-sm">
                <div className="font-medium text-slate-800">{rx.medication_name}</div>
                <div className="text-slate-500 mt-0.5">{rx.dosage} · {rx.frequency} · {rx.duration}</div>
                {rx.notes && <div className="text-xs text-slate-400 mt-1">{rx.notes}</div>}
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Lab Investigations">
        {labOrders.length === 0 ? <p className="text-slate-400 text-sm">None.</p> : (
          <div className="space-y-2">
            {labOrders.map(l => (
              <div key={l.investigation_id} className="bg-white border border-slate-200 rounded-lg p-3 text-sm">
                <div className="font-medium text-slate-800">{l.test_name}</div>
                <div className="text-slate-500 mt-0.5">{l.test_type}</div>
                <div className="text-xs text-slate-400 mt-1">Status: {l.status} · Ordered: {new Date(l.ordered_at).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}
