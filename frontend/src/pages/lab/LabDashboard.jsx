import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { labInvestigationsAPI } from '../../services/api'
import Breadcrumb from '../../components/Breadcrumb'

const STATUS = {
  Pending: 'bg-amber-50 text-amber-700',
  Completed: 'bg-emerald-50 text-emerald-700',
}

function InvestigationsTable({ investigations, navigate, showEnterResults }) {
  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-slate-600">Test</th>
            <th className="px-4 py-3 text-left font-medium text-slate-600">Type</th>
            <th className="px-4 py-3 text-left font-medium text-slate-600">Patient</th>
            <th className="px-4 py-3 text-left font-medium text-slate-600">Ordered</th>
            <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
            {showEnterResults && <th className="px-4 py-3 text-left font-medium text-slate-600">Action</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {investigations.map(inv => (
            <tr
              key={inv.investigation_id}
              className="hover:bg-slate-50 cursor-pointer"
              onClick={() => navigate(`/lab/investigations/${inv.investigation_id}`)}
            >
              <td className="px-4 py-3 font-medium text-slate-800">{inv.test_name}</td>
              <td className="px-4 py-3 text-slate-500">{inv.test_type}</td>
              <td className="px-4 py-3 text-slate-500">{inv.patient_name || `Patient #${inv.patient_id}`}</td>
              <td className="px-4 py-3 text-slate-500">{new Date(inv.ordered_at).toLocaleDateString()}</td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-0.5 rounded ${STATUS[inv.status] || ''}`}>{inv.status}</span>
              </td>
              {showEnterResults && (
                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                  <Link
                    to={`/lab/results/new?investigation_id=${inv.investigation_id}`}
                    className="bg-slate-700 hover:bg-slate-800 text-white px-3 py-1 rounded text-xs transition-colors"
                  >
                    Enter Results
                  </Link>
                </td>
              )}
            </tr>
          ))}
          {investigations.length === 0 && (
            <tr><td colSpan={showEnterResults ? 6 : 5} className="px-4 py-6 text-center text-slate-400">No investigations.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export default function LabDashboard() {
  const [pending, setPending] = useState([])
  const [all, setAll] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  function load() {
    Promise.all([
      labInvestigationsAPI.pending(),
      labInvestigationsAPI.list(),
    ]).then(([p, a]) => {
      setPending(p.data)
      setAll(a.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  return (
    <div>
      <Breadcrumb items={[{ label: 'Lab Dashboard' }]} />
      <h1 className="text-2xl font-semibold text-slate-800 mb-5">Lab Dashboard</h1>
      {loading ? <p className="text-slate-500">Loading…</p> : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 max-w-xs">
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="text-2xl font-semibold text-amber-700">{pending.length}</div>
              <div className="text-xs text-slate-500 mt-0.5">Pending</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="text-2xl font-semibold text-slate-800">{all.length}</div>
              <div className="text-xs text-slate-500 mt-0.5">Total</div>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Pending Orders</h2>
            <InvestigationsTable investigations={pending} navigate={navigate} showEnterResults={true} />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-700 mb-3">All Investigations</h2>
            <InvestigationsTable investigations={all} navigate={navigate} showEnterResults={false} />
          </div>
        </div>
      )}
    </div>
  )
}
