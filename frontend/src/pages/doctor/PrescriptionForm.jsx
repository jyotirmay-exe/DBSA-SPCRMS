import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { prescriptionsAPI, diagnosesAPI } from '../../services/api'

export default function PrescriptionForm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const patientId = searchParams.get('patient_id') || ''
  const diagnosisIdParam = searchParams.get('diagnosis_id') || ''
  const [form, setForm] = useState({ diagnosis_id: diagnosisIdParam, patient_id: patientId, medication_name: '', dosage: '', frequency: '', duration: '', notes: '' })
  const [diagnoses, setDiagnoses] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (patientId) {
      diagnosesAPI.list(patientId).then(r => setDiagnoses(r.data)).catch(() => {})
    }
  }, [patientId])

  function set(field) {
    return e => setForm({ ...form, [field]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await prescriptionsAPI.create({
        ...form,
        diagnosis_id: parseInt(form.diagnosis_id, 10),
        patient_id: parseInt(form.patient_id, 10),
      })
      navigate(patientId ? `/doctor/patients/${patientId}` : '/doctor/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save prescription.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full border border-slate-300 rounded px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400'
  const labelCls = 'block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1'

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-800 mb-5">Create Prescription</h1>
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-6">
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className={labelCls}>Linked Diagnosis *</label>
            <select required className={inputCls} value={form.diagnosis_id} onChange={set('diagnosis_id')}>
              <option value="">Select diagnosis…</option>
              {diagnoses.map(d => <option key={d.diagnosis_id} value={d.diagnosis_id}>{d.condition_name}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Medication Name *</label>
            <input required className={inputCls} value={form.medication_name} onChange={set('medication_name')} />
          </div>
          <div>
            <label className={labelCls}>Dosage</label>
            <input className={inputCls} placeholder="e.g. 500mg" value={form.dosage} onChange={set('dosage')} />
          </div>
          <div>
            <label className={labelCls}>Frequency</label>
            <input className={inputCls} placeholder="e.g. Twice daily" value={form.frequency} onChange={set('frequency')} />
          </div>
          <div>
            <label className={labelCls}>Duration</label>
            <input className={inputCls} placeholder="e.g. 7 days" value={form.duration} onChange={set('duration')} />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Notes</label>
            <textarea className={`${inputCls} resize-none`} rows={2} value={form.notes} onChange={set('notes')} />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button type="submit" disabled={loading} className="bg-slate-700 hover:bg-slate-800 text-white px-5 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50">
            {loading ? 'Saving…' : 'Save Prescription'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="border border-slate-300 text-slate-600 hover:bg-slate-50 px-5 py-2 rounded text-sm transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
