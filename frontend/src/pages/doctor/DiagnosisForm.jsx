import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { diagnosesAPI, appointmentsAPI } from '../../services/api'

const SEVERITIES = ['Mild', 'Moderate', 'Severe']

export default function DiagnosisForm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const patientId = searchParams.get('patient_id') || ''
  const appointmentIdParam = searchParams.get('appointment_id') || ''
  const [form, setForm] = useState({ appointment_id: appointmentIdParam, patient_id: patientId, condition_name: '', description: '', severity: 'Mild' })
  const [appointments, setAppointments] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    appointmentsAPI.list().then(r => {
      const relevant = r.data.filter(a => a.status !== 'Cancelled' && (!patientId || a.patient_id === parseInt(patientId)))
      setAppointments(relevant)
    }).catch(() => {})
  }, [patientId])

  function set(field) {
    return e => setForm({ ...form, [field]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await diagnosesAPI.create(form)
      navigate(patientId ? `/doctor/patients/${patientId}` : '/doctor/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save diagnosis.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full border border-slate-300 rounded px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400'
  const labelCls = 'block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1'

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-800 mb-5">Record Diagnosis</h1>
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-6">
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className={labelCls}>Appointment *</label>
            <select required className={inputCls} value={form.appointment_id} onChange={set('appointment_id')}>
              <option value="">Select appointment…</option>
              {appointments.map(a => (
                <option key={a.appointment_id} value={a.appointment_id}>
                  {new Date(a.scheduled_at).toLocaleString()} — {a.patient_name || a.patient_id}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Condition Name *</label>
            <input required className={inputCls} value={form.condition_name} onChange={set('condition_name')} />
          </div>
          <div>
            <label className={labelCls}>Severity</label>
            <select className={inputCls} value={form.severity} onChange={set('severity')}>
              {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Description</label>
            <textarea className={`${inputCls} resize-none`} rows={3} value={form.description} onChange={set('description')} />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button type="submit" disabled={loading} className="bg-slate-700 hover:bg-slate-800 text-white px-5 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50">
            {loading ? 'Saving…' : 'Save Diagnosis'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="border border-slate-300 text-slate-600 hover:bg-slate-50 px-5 py-2 rounded text-sm transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
