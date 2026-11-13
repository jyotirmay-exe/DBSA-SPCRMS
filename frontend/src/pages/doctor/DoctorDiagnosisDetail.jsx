import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { diagnosesAPI, prescriptionsAPI } from '../../services/api'
import Breadcrumb from '../../components/Breadcrumb'

const SEVERITY = {
  Mild: 'bg-slate-100 text-slate-600',
  Moderate: 'bg-amber-50 text-amber-700',
  Severe: 'bg-red-50 text-red-700',
}

export default function DoctorDiagnosisDetail() {
  const { id } = useParams()
  const diagId = parseInt(id)
  const [diag, setDiag] = useState(null)
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      diagnosesAPI.get(diagId),
      prescriptionsAPI.list(),
    ]).then(([d, rx]) => {
      setDiag(d.data)
      setPrescriptions(rx.data.filter(p => p.diagnosis_id === diagId))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [diagId])

  if (loading) return <p className="text-slate-500">Loading…</p>
  if (!diag) return <p className="text-slate-500">Diagnosis not found.</p>

  return (
    <div>
      <Breadcrumb items={[{ label: 'Appointments', to: '/doctor/appointments' }, { label: `Diagnosis #${id}` }]} />

      <div className="bg-white border border-slate-200 rounded-lg p-5 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <h1 className="text-xl font-semibold text-slate-800">{diag.condition_name}</h1>
          <span className={`text-xs px-2 py-0.5 rounded ${SEVERITY[diag.severity] || ''}`}>{diag.severity}</span>
        </div>
        {diag.description && <p className="text-slate-600 text-sm mb-3">{diag.description}</p>}
        <p className="text-xs text-slate-400 mb-4">Recorded: {new Date(diag.recorded_at).toLocaleDateString()}</p>
        <div className="flex gap-4 text-sm">
          <Link to={`/doctor/patients/${diag.patient_id}`} className="text-slate-600 hover:underline">Patient record →</Link>
          <Link to={`/doctor/appointments/${diag.appointment_id}`} className="text-slate-600 hover:underline">Appointment →</Link>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-slate-700">Prescriptions</h2>
        <Link
          to={`/doctor/prescriptions/new?diagnosis_id=${diagId}&patient_id=${diag.patient_id}`}
          className="bg-slate-700 hover:bg-slate-800 text-white px-3 py-1.5 rounded text-sm transition-colors"
        >
          + Prescription
        </Link>
      </div>

      {prescriptions.length === 0 ? (
        <p className="text-slate-400 text-sm">No prescriptions for this diagnosis.</p>
      ) : (
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Medication</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Dosage</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Frequency</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Duration</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {prescriptions.map(rx => (
                <tr key={rx.prescription_id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{rx.medication_name}</td>
                  <td className="px-4 py-3 text-slate-500">{rx.dosage}</td>
                  <td className="px-4 py-3 text-slate-500">{rx.frequency}</td>
                  <td className="px-4 py-3 text-slate-500">{rx.duration}</td>
                  <td className="px-4 py-3 text-slate-400">{rx.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
