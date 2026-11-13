import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { labInvestigationsAPI, labResultsAPI } from '../../services/api'
import Breadcrumb from '../../components/Breadcrumb'

const STATUS = {
  Pending: 'bg-amber-50 text-amber-700',
  Completed: 'bg-emerald-50 text-emerald-700',
}

export default function AdminLabInvestigationDetail() {
  const { id } = useParams()
  const invId = parseInt(id)
  const [investigation, setInvestigation] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      labInvestigationsAPI.get(invId),
      labResultsAPI.getByInvestigation(invId).catch(() => null),
    ]).then(([inv, res]) => {
      setInvestigation(inv.data)
      setResult(res ? (res.data[0] || null) : null)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [invId])

  if (loading) return <p className="text-slate-500">Loading…</p>
  if (!investigation) return <p className="text-slate-500">Investigation not found.</p>

  return (
    <div>
      <Breadcrumb items={[
        { label: 'Admin Dashboard', to: '/admin/dashboard' },
        { label: 'Lab Investigations', to: '/admin/lab-investigations' },
        { label: `Investigation #${id}` },
      ]} />

      <h1 className="text-2xl font-semibold text-slate-800 mb-5">{investigation.test_name}</h1>

      <div className="bg-white border border-slate-200 rounded-lg p-5 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 text-sm">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Test Type</div>
            <div className="text-slate-800">{investigation.test_type}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Status</div>
            <span className={`text-xs px-2 py-0.5 rounded ${STATUS[investigation.status] || ''}`}>{investigation.status}</span>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Patient</div>
            <div className="text-slate-800">{investigation.patient_name || `#${investigation.patient_id}`}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Ordered</div>
            <div className="text-slate-800">{new Date(investigation.ordered_at).toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      <h2 className="text-base font-semibold text-slate-700 mb-3">Result</h2>
      {result ? (
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5 text-sm">
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Value</div>
              <div className="text-slate-800 font-medium">{result.result_value} {result.unit}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Reference Range</div>
              <div className="text-slate-800">{result.reference_range || '—'}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Tested</div>
              <div className="text-slate-800">{new Date(result.entered_at).toLocaleDateString()}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Result Status</div>
              <div className="text-slate-800">{result.result_status}</div>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-slate-400 text-sm">No result recorded yet.</p>
      )}
    </div>
  )
}
