import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { labInvestigationsAPI, labResultsAPI } from '../../services/api'
import Breadcrumb from '../../components/Breadcrumb'
import PatientMediaViewer from '../shared/PatientMediaViewer'

const STATUS = {
  Pending: 'bg-amber-50 text-amber-700',
  Completed: 'bg-emerald-50 text-emerald-700',
}

export default function LabInvestigationDetail() {
  const { id } = useParams()
  const [investigation, setInvestigation] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      labInvestigationsAPI.get(parseInt(id)),
      labResultsAPI.getByInvestigation(parseInt(id)).catch(() => null),
    ]).then(([inv, res]) => {
      setInvestigation(inv.data)
      setResult(res ? (res.data[0] || null) : null)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="text-slate-500">Loading…</p>
  if (!investigation) return <p className="text-slate-500">Investigation not found.</p>

  return (
    <div>
      <Breadcrumb items={[
        { label: 'Lab Dashboard', to: '/lab/dashboard' },
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
        {investigation.status === 'Pending' && (
          <div className="mt-5 pt-4 border-t border-slate-100">
            <Link
              to={`/lab/results/new?investigation_id=${id}`}
              className="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded text-sm transition-colors inline-block"
            >
              Enter Results →
            </Link>
          </div>
        )}
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
          <p className="text-slate-400 text-sm">No result recorded yet.</p>
        )}
      </div>

      {investigation.patient_id && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 mt-6">
          <PatientMediaViewer patientId={investigation.patient_id} />
        </div>
      )}
    </div>
  )
}
