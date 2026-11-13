import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (email, password) => {
    const params = new URLSearchParams()
    params.append('username', email)
    params.append('password', password)
    return api.post('/auth/login', params, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
  },
  me: () => api.get('/auth/me'),
}

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersAPI = {
  list: () => api.get('/auth/users'),
  create: (data) => api.post('/auth/users', data),
  update: (id, data) => api.put(`/auth/users/${id}`, data),
  deactivate: (id) => api.put(`/auth/users/${id}`, { is_active: false }),
  resetPassword: (id, new_password) => api.post(`/auth/users/${id}/reset-password`, { new_password }),
}

// ── Patients ──────────────────────────────────────────────────────────────────
export const patientsAPI = {
  list: () => api.get('/patients'),
  get: (id) => api.get(`/patients/${id}`),
  create: (data) => api.post('/patients', data),
  update: (id, data) => api.put(`/patients/${id}`, data),
  deactivate: (id) => api.put(`/patients/${id}`, { is_active: false }),
}

// ── Professionals ─────────────────────────────────────────────────────────────
export const professionalsAPI = {
  list: () => api.get('/professionals'),
  get: (id) => api.get(`/professionals/${id}`),
  create: (data) => api.post('/professionals', data),
  update: (id, data) => api.put(`/professionals/${id}`, data),
  deactivate: (id) => api.put(`/professionals/${id}`, { is_active: false }),
}

// ── Appointments ──────────────────────────────────────────────────────────────
export const appointmentsAPI = {
  list: () => api.get('/appointments'),
  get: (id) => api.get(`/appointments/${id}`),
  create: (data) => api.post('/appointments', data),
  updateStatus: (id, status) => api.put(`/appointments/${id}`, { status }),
  cancel: (id) => api.put(`/appointments/${id}`, { status: 'Cancelled' }),
}

// ── Diagnoses ─────────────────────────────────────────────────────────────────
export const diagnosesAPI = {
  list: (patientId) => api.get('/diagnoses', { params: { patient_id: patientId } }),
  get: (id) => api.get(`/diagnoses/${id}`),
  create: (data) => api.post('/diagnoses', data),
  update: (id, data) => api.put(`/diagnoses/${id}`, data),
}

// ── Prescriptions ─────────────────────────────────────────────────────────────
export const prescriptionsAPI = {
  list: (patientId) => api.get('/prescriptions', { params: { patient_id: patientId } }),
  get: (id) => api.get(`/prescriptions/${id}`),
  create: (data) => api.post('/prescriptions', data),
  update: (id, data) => api.put(`/prescriptions/${id}`, data),
}

// ── Lab Investigations ────────────────────────────────────────────────────────
export const labInvestigationsAPI = {
  list: (params) => api.get('/lab-investigations', { params }),
  pending: () => api.get('/lab-investigations', { params: { status: 'Pending' } }),
  get: (id) => api.get(`/lab-investigations/${id}`),
  create: (data) => api.post('/lab-investigations', data),
}

// ── Lab Results ───────────────────────────────────────────────────────────────
export const labResultsAPI = {
  getByInvestigation: (investigationId) => api.get('/lab-results', { params: { investigation_id: investigationId } }),
  create: (data) => api.post('/lab-results', data),
}

// ── Clinical Records ──────────────────────────────────────────────────────────
export const clinicalRecordsAPI = {
  getByPatient: (patientId) => api.get(`/clinical-records`, { params: { patient_id: patientId } }),
}

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationsAPI = {
  list: () => api.get('/notifications'),
  unreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
}

export default api
