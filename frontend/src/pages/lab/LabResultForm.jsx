import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { labResultsAPI, labInvestigationsAPI } from '../../services/api'

export default function LabResultForm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const investigationId = searchParams.get('investigation_id') || ''
  const [form, setForm] = useState({ investigation_id: investigationId, result_value: '', unit: '', reference_range: '', result_status: 'Normal' })
  const [investigation, setInvestigation] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (investigationId) {
      labInvestigationsAPI.get(investigationId).then(r => setInvestigation(r.data)).catch(() => {})
    }
  }, [investigationId])

  function set(field) {
    return e => setForm({ ...form, [field]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await labResultsAPI.create(form)
      navigate('/lab/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save result.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full border border-slate-300 rounded px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400'
  const labelCls = 'block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1'

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-800 mb-5">Enter Lab Results</h1>
      {investigation && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Investigation</div>
          <div className="text-slate-800 font-medium">{investigation.test_name}</div>
          <div className="text-slate-500 text-sm">{investigation.test_type}{investigation.patient_name ? ` · ${investigation.patient_name}` : ''}</div>
          {investigation.notes && <div className="text-slate-500 text-sm mt-1">{investigation.notes}</div>}
        </div>
      )}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-6">
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {!investigationId && (
            <div className="md:col-span-2">
              <label className={labelCls}>Investigation ID *</label>
              <input required className={inputCls} value={form.investigation_id} onChange={set('investigation_id')} />
            </div>
          )}
          <div>
            <label className={labelCls}>Result Value *</label>
            <input required className={inputCls} value={form.result_value} onChange={set('result_value')} />
          </div>
          <div>
            <label className={labelCls}>Unit</label>
            <input className={inputCls} placeholder="e.g. mg/dL" value={form.unit} onChange={set('unit')} />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Reference Range</label>
            <input className={inputCls} placeholder="e.g. 70-100 mg/dL" value={form.reference_range} onChange={set('reference_range')} />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Status</label>
            <select className={inputCls} value={form.result_status} onChange={set('result_status')}>
              <option value="Normal">Normal</option>
              <option value="Abnormal">Abnormal</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button type="submit" disabled={loading} className="bg-slate-700 hover:bg-slate-800 text-white px-5 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50">
            {loading ? 'Saving…' : 'Submit Results'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="border border-slate-300 text-slate-600 hover:bg-slate-50 px-5 py-2 rounded text-sm transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
