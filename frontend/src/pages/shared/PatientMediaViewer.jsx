import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { medicalImagesAPI, ecgAPI } from '../../services/api'

const MAX_CHART_POINTS = 2000

function parseEcgCsv(text) {
  const lines = text.split('\n').filter(l => l.trim())
  if (!lines.length) return []
  // detect header
  const firstCols = lines[0].split(',')
  const startIdx = isNaN(parseFloat(firstCols[0])) ? 1 : 0
  const data = []
  for (let i = startIdx; i < lines.length; i++) {
    const cols = lines[i].split(',')
    if (cols.length < 2) continue
    const t = parseFloat(cols[0])
    const mv = parseFloat(cols[1])
    if (!isNaN(t) && !isNaN(mv)) data.push({ t, mv })
  }
  // downsample if too large
  if (data.length <= MAX_CHART_POINTS) return data
  const step = Math.ceil(data.length / MAX_CHART_POINTS)
  return data.filter((_, i) => i % step === 0)
}

function ECGChart({ recordId }) {
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    ecgAPI.fetchBlob(recordId)
      .then(r => r.data.text())
      .then(text => setData(parseEcgCsv(text)))
      .catch(() => setErr('Failed to load ECG data.'))
  }, [recordId])

  if (err) return <p className="text-red-500 text-sm">{err}</p>
  if (!data) return <p className="text-slate-400 text-sm">Loading ECG…</p>
  if (!data.length) return <p className="text-slate-400 text-sm">No data points found in CSV.</p>

  return (
    <div className="bg-slate-950 rounded p-2">
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="t" type="number" domain={['auto', 'auto']} tickFormatter={v => `${(v / 1000).toFixed(1)}s`} tick={{ fill: '#9ca3af', fontSize: 10 }} />
          <YAxis dataKey="mv" domain={['auto', 'auto']} tick={{ fill: '#9ca3af', fontSize: 10 }} tickFormatter={v => v.toFixed(2)} />
          <Tooltip
            formatter={(v) => [`${v.toFixed(3)} mV`, 'Lead II']}
            labelFormatter={(t) => `${(t / 1000).toFixed(3)}s`}
            contentStyle={{ backgroundColor: '#1e293b', border: 'none', fontSize: 12 }}
            itemStyle={{ color: '#34d399' }}
            labelStyle={{ color: '#94a3b8' }}
          />
          <Line type="linear" dataKey="mv" stroke="#34d399" dot={false} strokeWidth={1} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function ImageThumbnail({ image }) {
  const [blobUrl, setBlobUrl] = useState(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    let url
    medicalImagesAPI.fetchBlob(image.image_id)
      .then(r => {
        url = URL.createObjectURL(r.data)
        setBlobUrl(url)
      })
      .catch(() => {})
    return () => { if (url) URL.revokeObjectURL(url) }
  }, [image.image_id])

  return (
    <div className="border border-slate-200 rounded overflow-hidden">
      <div
        className="relative bg-black cursor-pointer"
        style={{ height: 120 }}
        onClick={() => setExpanded(v => !v)}
      >
        {blobUrl
          ? <img src={blobUrl} alt={image.metadata?.file_name || 'X-ray'} className="w-full h-full object-contain" />
          : <div className="flex items-center justify-center h-full text-slate-500 text-xs">Loading…</div>
        }
      </div>
      {expanded && blobUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setExpanded(false)}>
          <img src={blobUrl} alt={image.metadata?.file_name} className="max-w-[90vw] max-h-[90vh] object-contain rounded shadow-2xl" />
        </div>
      )}
      <div className="px-2 py-1 bg-slate-50 text-xs text-slate-500 truncate">
        {image.metadata?.body_part || 'X-Ray'} · {image.metadata?.file_name}
      </div>
    </div>
  )
}

export default function PatientMediaViewer({ patientId }) {
  const [images, setImages] = useState([])
  const [ecgs, setEcgs] = useState([])
  const [loadingImg, setLoadingImg] = useState(true)
  const [loadingEcg, setLoadingEcg] = useState(true)

  useEffect(() => {
    if (!patientId) return
    medicalImagesAPI.listByPatient(patientId)
      .then(r => setImages(r.data))
      .catch(() => {})
      .finally(() => setLoadingImg(false))
    ecgAPI.listByPatient(patientId)
      .then(r => setEcgs(r.data))
      .catch(() => {})
      .finally(() => setLoadingEcg(false))
  }, [patientId])

  return (
    <div className="space-y-6">
      {/* Medical Images */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">Medical Images</h3>
        {loadingImg
          ? <p className="text-slate-400 text-sm">Loading…</p>
          : !images.length
            ? <p className="text-slate-400 text-sm">No images on file.</p>
            : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {images.map(img => <ImageThumbnail key={img.image_id} image={img} />)}
              </div>
            )
        }
      </div>

      {/* ECG Records */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">ECG Recordings</h3>
        {loadingEcg
          ? <p className="text-slate-400 text-sm">Loading…</p>
          : !ecgs.length
            ? <p className="text-slate-400 text-sm">No ECG recordings on file.</p>
            : (
              <div className="space-y-4">
                {ecgs.map(ecg => (
                  <div key={ecg.record_id} className="border border-slate-200 rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-slate-600">
                        {ecg.metadata?.file_name || `ECG #${ecg.record_id}`}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(ecg.recorded_at).toLocaleString()} · {ecg.metadata?.sample_rate} Hz
                      </span>
                    </div>
                    <ECGChart recordId={ecg.record_id} />
                  </div>
                ))}
              </div>
            )
        }
      </div>
    </div>
  )
}
