import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { diagnosesAPI, prescriptionsAPI } from '../../services/api'
import Breadcrumb from '../../components/Breadcrumb'

const SEVERITY = {
  Mild: 'bg-slate-100 text-slate-600',
  Moderate: 'bg-amber-50 text-amber-700',
  Severe: 'bg-red-50 text-red-700',
}

export default function PatientDiagnosisDetail() {
  const { id } = useParams()
  const diagId = parseInt(id)
  const [diagnosis, setDiagnosis] = useState(null)
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      diagnosesAPI.get(diagId),
      prescriptionsAPI.list(),
    ]).then(([d, rx]) => {
      setDiagnosis(d.data)
      setPrescriptions(rx.data.filter(x => x.diagnosis_id === diagId))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [diagId])

  if (loading) return <p className="text-slate-500">Loading…</p>
  if (!diagnosis) return <p className="text-slate-500">Diagnosis not found.</p>

  return (
    <div>
      <Breadcrumb items={[
        { label: 'My Health', to: '/patient/dashboard' },
        { label: `Appointment #${diagnosis.appointment_id}`, to: `/patient/appointments/${diagnosis.appointment_id}` },
        { label: diagnosis.condition_name },
      ]} />
      <h1 className="text-2xl font-semibold text-slate-800 mb-5">{diagnosis.condition_name}</h1>

      <div className="bg-white border border-slate-200 rounded-lg p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs px-2 py-0.5 rounded ${SEVERITY[diagnosis.severity] || ''}`}>{diagnosis.severity}</span>
          <span className="text-xs text-slate-400">Recorded {new Date(diagnosis.recorded_at).toLocaleDateString()}</span>
        </div>
        {diagnosis.description && <p className="text-sm text-slate-600">{diagnosis.description}</p>}
      </div>

      <h2 className="text-base font-semibold text-slate-700 mb-3">Prescriptions</h2>
      {prescriptions.length === 0 ? (
        <p className="text-slate-400 text-sm">No prescriptions for this diagnosis.</p>
      ) : (
        <div className="space-y-2">
          {prescriptions.map(rx => (
            <div key={rx.prescription_id} className="bg-white border border-slate-200 rounded-lg p-5">
              <div className="font-medium text-slate-800 mb-1">{rx.medication_name}</div>
              <div className="text-sm text-slate-500">{rx.dosage} · {rx.frequency} · {rx.duration}</div>
              {rx.notes && <div className="text-xs text-slate-400 mt-1">{rx.notes}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
