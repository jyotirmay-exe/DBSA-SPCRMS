import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { appointmentsAPI, patientsAPI, professionalsAPI } from '../../services/api'

export default function AppointmentForm() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ patient_id: '', professional_id: '', scheduled_at: '', notes: '' })
  const [patients, setPatients] = useState([])
  const [professionals, setProfessionals] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    patientsAPI.list().then(r => setPatients(r.data.filter(p => p.is_active))).catch(() => {})
    professionalsAPI.list().then(r => setProfessionals(r.data.filter(p => p.is_active && p.role === 'Doctor'))).catch(() => {})
  }, [])

  function set(field) {
    return e => setForm({ ...form, [field]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await appointmentsAPI.create({
        ...form,
        patient_id: parseInt(form.patient_id, 10),
        professional_id: parseInt(form.professional_id, 10),
      })
      navigate('/doctor/appointments')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to schedule appointment.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full border border-slate-300 rounded px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400'
  const labelCls = 'block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1'

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-800 mb-5">Schedule Appointment</h1>
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-6">
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelCls}>Patient *</label>
            <select required className={inputCls} value={form.patient_id} onChange={set('patient_id')}>
              <option value="">Select patient…</option>
              {patients.map(p => <option key={p.patient_id} value={p.patient_id}>{p.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Doctor *</label>
            <select required className={inputCls} value={form.professional_id} onChange={set('professional_id')}>
              <option value="">Select doctor…</option>
              {professionals.map(p => <option key={p.professional_id} value={p.professional_id}>{p.full_name} — {p.specialization}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Date & Time *</label>
            <input required type="datetime-local" className={inputCls} value={form.scheduled_at} onChange={set('scheduled_at')} />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Notes</label>
            <textarea className={`${inputCls} resize-none`} rows={3} value={form.notes} onChange={set('notes')} />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button type="submit" disabled={loading} className="bg-slate-700 hover:bg-slate-800 text-white px-5 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50">
            {loading ? 'Scheduling…' : 'Schedule'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="border border-slate-300 text-slate-600 hover:bg-slate-50 px-5 py-2 rounded text-sm transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
