import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { diagnosesAPI, prescriptionsAPI } from '../../services/api'
import Breadcrumb from '../../components/Breadcrumb'

const SEVERITY = {
  Mild: 'bg-slate-100 text-slate-600',
  Moderate: 'bg-amber-50 text-amber-700',
  Severe: 'bg-red-50 text-red-700',
}

export default function AdminDiagnosisDetail() {
  const { id } = useParams()
  const diagId = parseInt(id)
  const navigate = useNavigate()
  const [diagnosis, setDiagnosis] = useState(null)
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      diagnosesAPI.get(diagId),
      prescriptionsAPI.list(),
    ]).then(([d, rx]) => {
      setDiagnosis(d.data)
      setPrescriptions(rx.data.filter(p => p.diagnosis_id === diagId))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [diagId])

  if (loading) return <p className="text-slate-500">Loading…</p>
  if (!diagnosis) return <p className="text-slate-500">Diagnosis not found.</p>

  return (
    <div>
      <Breadcrumb items={[
        { label: 'Admin Dashboard', to: '/admin/dashboard' },
        { label: 'Diagnoses', to: '/admin/diagnoses' },
        { label: `Diagnosis #${id}` },
      ]} />

      <h1 className="text-2xl font-semibold text-slate-800 mb-5">{diagnosis.condition_name}</h1>

      <div className="bg-white border border-slate-200 rounded-lg p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs px-2 py-0.5 rounded ${SEVERITY[diagnosis.severity] || ''}`}>{diagnosis.severity}</span>
          <span className="text-xs text-slate-400">Recorded: {new Date(diagnosis.recorded_at).toLocaleDateString()}</span>
        </div>
        {diagnosis.description && <p className="text-sm text-slate-600 mb-4">{diagnosis.description}</p>}
        <div className="grid grid-cols-2 gap-5 text-sm border-t border-slate-100 pt-4">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Patient</div>
            <div className="text-slate-800">{diagnosis.patient_name || `#${diagnosis.patient_id}`}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Appointment</div>
            <Link to={`/admin/appointments/${diagnosis.appointment_id}`} className="text-slate-700 hover:underline">
              #{diagnosis.appointment_id}
            </Link>
          </div>
        </div>
      </div>

      <h2 className="text-base font-semibold text-slate-700 mb-3">Prescriptions</h2>
      {prescriptions.length === 0 ? (
        <p className="text-slate-400 text-sm">No prescriptions for this diagnosis.</p>
      ) : (
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Medication</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Dosage</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Frequency</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Duration</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {prescriptions.map(rx => (
                <tr
                  key={rx.prescription_id}
                  className="hover:bg-slate-50 cursor-pointer"
                  onClick={() => navigate(`/admin/prescriptions/${rx.prescription_id}`)}
                >
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
