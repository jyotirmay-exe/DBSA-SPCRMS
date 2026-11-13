import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'

import LoginPage from './pages/LoginPage'

import AdminDashboard from './pages/admin/AdminDashboard'
import UserManagement from './pages/admin/UserManagement'
import PatientList from './pages/admin/PatientList'
import PatientForm from './pages/admin/PatientForm'
import ProfessionalList from './pages/admin/ProfessionalList'
import ProfessionalForm from './pages/admin/ProfessionalForm'
import AdminAppointments from './pages/admin/AdminAppointments'
import AdminAppointmentDetail from './pages/admin/AdminAppointmentDetail'
import AdminDiagnoses from './pages/admin/AdminDiagnoses'
import AdminDiagnosisDetail from './pages/admin/AdminDiagnosisDetail'
import AdminPrescriptions from './pages/admin/AdminPrescriptions'
import AdminPrescriptionDetail from './pages/admin/AdminPrescriptionDetail'
import AdminLabInvestigations from './pages/admin/AdminLabInvestigations'
import AdminLabInvestigationDetail from './pages/admin/AdminLabInvestigationDetail'

import DoctorDashboard from './pages/doctor/DoctorDashboard'
import AppointmentList from './pages/doctor/AppointmentList'
import AppointmentForm from './pages/doctor/AppointmentForm'
import PatientRecord from './pages/doctor/PatientRecord'
import DiagnosisForm from './pages/doctor/DiagnosisForm'
import PrescriptionForm from './pages/doctor/PrescriptionForm'
import LabOrderForm from './pages/doctor/LabOrderForm'
import DoctorAppointmentDetail from './pages/doctor/DoctorAppointmentDetail'
import DoctorDiagnosisDetail from './pages/doctor/DoctorDiagnosisDetail'

import LabDashboard from './pages/lab/LabDashboard'
import LabResultForm from './pages/lab/LabResultForm'
import LabInvestigationDetail from './pages/lab/LabInvestigationDetail'

import PatientDashboard from './pages/patient/PatientDashboard'
import PatientAppointmentDetail from './pages/patient/PatientAppointmentDetail'
import PatientDiagnosisDetail from './pages/patient/PatientDiagnosisDetail'
import PatientLabInvestigationDetail from './pages/patient/PatientLabInvestigationDetail'

import NotificationPanel from './pages/NotificationPanel'

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto min-w-0">{children}</main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Admin routes */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute roles={['admin']}>
              <Layout><AdminDashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute roles={['admin']}>
              <Layout><UserManagement /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/patients" element={
            <ProtectedRoute roles={['admin']}>
              <Layout><PatientList /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/patients/new" element={
            <ProtectedRoute roles={['admin']}>
              <Layout><PatientForm /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/patients/:id/edit" element={
            <ProtectedRoute roles={['admin']}>
              <Layout><PatientForm /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/professionals" element={
            <ProtectedRoute roles={['admin']}>
              <Layout><ProfessionalList /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/professionals/new" element={
            <ProtectedRoute roles={['admin']}>
              <Layout><ProfessionalForm /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/professionals/:id/edit" element={
            <ProtectedRoute roles={['admin']}>
              <Layout><ProfessionalForm /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/appointments" element={
            <ProtectedRoute roles={['admin']}>
              <Layout><AdminAppointments /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/appointments/:id" element={
            <ProtectedRoute roles={['admin']}>
              <Layout><AdminAppointmentDetail /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/diagnoses" element={
            <ProtectedRoute roles={['admin']}>
              <Layout><AdminDiagnoses /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/diagnoses/:id" element={
            <ProtectedRoute roles={['admin']}>
              <Layout><AdminDiagnosisDetail /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/prescriptions" element={
            <ProtectedRoute roles={['admin']}>
              <Layout><AdminPrescriptions /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/prescriptions/:id" element={
            <ProtectedRoute roles={['admin']}>
              <Layout><AdminPrescriptionDetail /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/lab-investigations" element={
            <ProtectedRoute roles={['admin']}>
              <Layout><AdminLabInvestigations /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/lab-investigations/:id" element={
            <ProtectedRoute roles={['admin']}>
              <Layout><AdminLabInvestigationDetail /></Layout>
            </ProtectedRoute>
          } />

          {/* Doctor routes */}
          <Route path="/doctor/dashboard" element={
            <ProtectedRoute roles={['doctor']}>
              <Layout><DoctorDashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/doctor/appointments" element={
            <ProtectedRoute roles={['doctor', 'admin']}>
              <Layout><AppointmentList /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/doctor/appointments/new" element={
            <ProtectedRoute roles={['doctor', 'admin']}>
              <Layout><AppointmentForm /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/doctor/appointments/:id" element={
            <ProtectedRoute roles={['doctor', 'admin']}>
              <Layout><DoctorAppointmentDetail /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/doctor/patients/:id" element={
            <ProtectedRoute roles={['doctor', 'admin']}>
              <Layout><PatientRecord /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/doctor/diagnoses/new" element={
            <ProtectedRoute roles={['doctor']}>
              <Layout><DiagnosisForm /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/doctor/diagnoses/:id" element={
            <ProtectedRoute roles={['doctor', 'admin']}>
              <Layout><DoctorDiagnosisDetail /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/doctor/prescriptions/new" element={
            <ProtectedRoute roles={['doctor']}>
              <Layout><PrescriptionForm /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/doctor/lab-orders/new" element={
            <ProtectedRoute roles={['doctor']}>
              <Layout><LabOrderForm /></Layout>
            </ProtectedRoute>
          } />

          {/* Lab routes */}
          <Route path="/lab/dashboard" element={
            <ProtectedRoute roles={['lab_technician']}>
              <Layout><LabDashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/lab/results/new" element={
            <ProtectedRoute roles={['lab_technician']}>
              <Layout><LabResultForm /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/lab/investigations/:id" element={
            <ProtectedRoute roles={['lab_technician']}>
              <Layout><LabInvestigationDetail /></Layout>
            </ProtectedRoute>
          } />

          {/* Patient routes */}
          <Route path="/patient/dashboard" element={
            <ProtectedRoute roles={['patient']}>
              <Layout><PatientDashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/patient/appointments/:id" element={
            <ProtectedRoute roles={['patient']}>
              <Layout><PatientAppointmentDetail /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/patient/diagnoses/:id" element={
            <ProtectedRoute roles={['patient']}>
              <Layout><PatientDiagnosisDetail /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/patient/lab-investigations/:id" element={
            <ProtectedRoute roles={['patient']}>
              <Layout><PatientLabInvestigationDetail /></Layout>
            </ProtectedRoute>
          } />

          {/* Shared */}
          <Route path="/notifications" element={
            <ProtectedRoute roles={['admin', 'doctor', 'lab_technician', 'patient']}>
              <Layout><NotificationPanel /></Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
