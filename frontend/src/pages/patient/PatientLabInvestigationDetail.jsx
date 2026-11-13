import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { labInvestigationsAPI, labResultsAPI } from '../../services/api'
import Breadcrumb from '../../components/Breadcrumb'

const STATUS = {
  Pending: 'bg-amber-50 text-amber-700',
  Completed: 'bg-emerald-50 text-emerald-700',
}

export default function PatientLabInvestigationDetail() {
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
        { label: 'My Health', to: '/patient/dashboard' },
        { label: investigation.test_name },
      ]} />
      <h1 className="text-2xl font-semibold text-slate-800 mb-5">{investigation.test_name}</h1>

      <div className="bg-white border border-slate-200 rounded-lg p-5 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5 text-sm">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Type</div>
            <div className="text-slate-800">{investigation.test_type}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Ordered</div>
            <div className="text-slate-800">{new Date(investigation.ordered_at).toLocaleDateString()}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Status</div>
            <span className={`text-xs px-2 py-0.5 rounded ${STATUS[investigation.status] || ''}`}>{investigation.status}</span>
          </div>
        </div>
      </div>

      <h2 className="text-base font-semibold text-slate-700 mb-3">Result</h2>
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        {result ? (
          <div className="space-y-3">
            <div>
              <span className="text-2xl font-semibold text-slate-800">{result.result_value}</span>
              {result.unit && <span className="text-slate-500 ml-2">{result.unit}</span>}
            </div>
            {result.reference_range && (
              <div className="text-sm text-slate-500">Normal range: {result.reference_range}</div>
            )}
            <div className="text-xs text-slate-400">
              {result.result_status} · Tested: {new Date(result.entered_at).toLocaleString()}
            </div>
          </div>
        ) : (
          <p className="text-slate-400 text-sm">Results not yet available.</p>
        )}
      </div>
    </div>
  )
}
