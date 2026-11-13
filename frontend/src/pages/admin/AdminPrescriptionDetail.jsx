import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { prescriptionsAPI } from '../../services/api'
import Breadcrumb from '../../components/Breadcrumb'

export default function AdminPrescriptionDetail() {
  const { id } = useParams()
  const [rx, setRx] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    prescriptionsAPI.get(parseInt(id)).then(r => setRx(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="text-slate-500">Loading…</p>
  if (!rx) return <p className="text-slate-500">Prescription not found.</p>

  return (
    <div>
      <Breadcrumb items={[
        { label: 'Admin Dashboard', to: '/admin/dashboard' },
        { label: 'Prescriptions', to: '/admin/prescriptions' },
        { label: `Prescription #${id}` },
      ]} />

      <h1 className="text-2xl font-semibold text-slate-800 mb-5">{rx.medication_name}</h1>

      <div className="bg-white border border-slate-200 rounded-lg p-5 mb-5">
        <div className="grid grid-cols-3 gap-5 text-sm">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Dosage</div>
            <div className="text-slate-800">{rx.dosage}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Frequency</div>
            <div className="text-slate-800">{rx.frequency}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Duration</div>
            <div className="text-slate-800">{rx.duration}</div>
          </div>
        </div>
        {rx.notes && (
          <div className="text-sm text-slate-600 border-t border-slate-100 pt-4 mt-4">{rx.notes}</div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-5 text-sm">
        <h2 className="text-base font-semibold text-slate-700 mb-4">Clinical Context</h2>
        <div className="grid grid-cols-2 gap-5">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Prescribed for</div>
            {rx.condition_name ? (
              <Link to={`/admin/diagnoses/${rx.diagnosis_id}`} className="text-slate-700 hover:underline">
                {rx.condition_name}
              </Link>
            ) : <span className="text-slate-400">—</span>}
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Appointment date</div>
            <div className="text-slate-800">{rx.appointment_date || '—'}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Patient</div>
            <div className="text-slate-800">{rx.patient_name || `#${rx.patient_id}`}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
