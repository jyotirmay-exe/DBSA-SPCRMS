import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { patientsAPI, appointmentsAPI, medicalImagesAPI } from '../../services/api'

const BODY_PARTS = ['Chest', 'Abdomen', 'Skull', 'Spine', 'Pelvis', 'Left Hand', 'Right Hand', 'Left Leg', 'Right Leg', 'Other']

export default function ImageUploadForm() {
  const navigate = useNavigate()
  const fileRef = useRef(null)
  const [patients, setPatients] = useState([])
  const [appointments, setAppointments] = useState([])
  const [patientId, setPatientId] = useState('')
  const [appointmentId, setAppointmentId] = useState('')
  const [bodyPart, setBodyPart] = useState('Chest')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    patientsAPI.list().then(r => setPatients(r.data.filter(p => p.is_active))).catch(() => {})
  }, [])

  useEffect(() => {
    if (!patientId) { setAppointments([]); return }
    appointmentsAPI.list().then(r => {
      setAppointments(r.data.filter(a => a.patient_id === parseInt(patientId) && a.status !== 'Cancelled'))
    }).catch(() => {})
    setAppointmentId('')
  }, [patientId])

  function handleFile(e) {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    const url = URL.createObjectURL(f)
    setPreview(url)
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) { setError('Please select an image file.'); return }
    if (!patientId) { setError('Please select a patient.'); return }
    setError(''); setLoading(true)
    try {
      const fd = new FormData()
      fd.append('patient_id', patientId)
      if (appointmentId) fd.append('appointment_id', appointmentId)
      fd.append('body_part', bodyPart)
      fd.append('image', file)
      await medicalImagesAPI.upload(fd)
      setSuccess(true)
      setTimeout(() => navigate('/lab/dashboard'), 1500)
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full border border-slate-300 rounded px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400'
  const labelCls = 'block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1'

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-800 mb-5">Upload Medical Image</h1>
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-6 max-w-xl">
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        {success && <p className="text-green-600 text-sm mb-4">Image uploaded successfully! Redirecting…</p>}
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Patient *</label>
            <select required className={inputCls} value={patientId} onChange={e => setPatientId(e.target.value)}>
              <option value="">Select patient…</option>
              {patients.map(p => <option key={p.patient_id} value={p.patient_id}>{p.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Appointment (optional)</label>
            <select className={inputCls} value={appointmentId} onChange={e => setAppointmentId(e.target.value)} disabled={!patientId}>
              <option value="">None / standalone upload</option>
              {appointments.map(a => (
                <option key={a.appointment_id} value={a.appointment_id}>
                  {new Date(a.scheduled_at).toLocaleString()} — {a.appointment_id}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Body Part / Region</label>
            <select className={inputCls} value={bodyPart} onChange={e => setBodyPart(e.target.value)}>
              {BODY_PARTS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Image File * (JPEG / PNG, max 10 MB)</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,.jpg,.jpeg,.png"
              onChange={handleFile}
              className="w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
            />
          </div>
          {preview && (
            <div className="border border-slate-200 rounded overflow-hidden">
              <img src={preview} alt="Preview" className="w-full max-h-64 object-contain bg-black" />
            </div>
          )}
        </div>
        <div className="flex gap-3 mt-6">
          <button type="submit" disabled={loading || success} className="bg-slate-700 hover:bg-slate-800 text-white px-5 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50">
            {loading ? 'Uploading…' : 'Upload Image'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="border border-slate-300 text-slate-600 hover:bg-slate-50 px-5 py-2 rounded text-sm transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
