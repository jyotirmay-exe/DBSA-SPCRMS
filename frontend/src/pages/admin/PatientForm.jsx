import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { patientsAPI } from '../../services/api'

const EMPTY = { full_name: '', date_of_birth: '', gender: 'Male', contact_number: '', email: '', address: '' }

export default function PatientForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (id) {
      patientsAPI.get(id).then(r => setForm(r.data)).catch(() => {})
    }
  }, [id])

  function set(field) {
    return e => setForm({ ...form, [field]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      if (id) {
        await patientsAPI.update(id, form)
      } else {
        await patientsAPI.create(form)
      }
      navigate('/admin/patients')
    } catch (err) {
      setError(err.response?.data?.detail || 'Save failed.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full border border-slate-300 rounded px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400'
  const labelCls = 'block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1'

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-800 mb-5">{id ? 'Edit Patient' : 'New Patient'}</h1>
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-6">
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelCls}>Full Name *</label>
            <input required className={inputCls} value={form.full_name} onChange={set('full_name')} />
          </div>
          <div>
            <label className={labelCls}>Gender *</label>
            <select required className={inputCls} value={form.gender} onChange={set('gender')}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Date of Birth *</label>
            <input required type="date" className={inputCls} value={form.date_of_birth} onChange={set('date_of_birth')} />
          </div>
          <div>
            <label className={labelCls}>Contact Number</label>
            <input className={inputCls} value={form.contact_number} onChange={set('contact_number')} />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input type="email" className={inputCls} value={form.email} onChange={set('email')} />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Address</label>
            <textarea className={`${inputCls} resize-none`} rows={2} value={form.address} onChange={set('address')} />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button type="submit" disabled={loading} className="bg-slate-700 hover:bg-slate-800 text-white px-5 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50">
            {loading ? 'Saving…' : id ? 'Update' : 'Create'}
          </button>
          <button type="button" onClick={() => navigate('/admin/patients')} className="border border-slate-300 text-slate-600 hover:bg-slate-50 px-5 py-2 rounded text-sm transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
