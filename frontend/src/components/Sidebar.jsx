import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const NAV = {
  admin: [
    { label: 'Dashboard', to: '/admin/dashboard' },
    { label: 'Appointments', to: '/admin/appointments' },
    { label: 'Patients', to: '/admin/patients' },
    { label: 'Professionals', to: '/admin/professionals' },
    { label: 'Users', to: '/admin/users' },
    { divider: true },
    { label: 'Diagnoses', to: '/admin/diagnoses' },
    { label: 'Prescriptions', to: '/admin/prescriptions' },
    { label: 'Lab Investigations', to: '/admin/lab-investigations' },
    { divider: true },
    { label: 'Notifications', to: '/notifications' },
  ],
  doctor: [
    { label: 'Dashboard', to: '/doctor/dashboard' },
    { label: 'Appointments', to: '/doctor/appointments' },
    { divider: true },
    { label: 'Notifications', to: '/notifications' },
  ],
  lab_technician: [
    { label: 'Dashboard', to: '/lab/dashboard' },
    { divider: true },
    { label: 'Notifications', to: '/notifications' },
  ],
  patient: [
    { label: 'My Health', to: '/patient/dashboard' },
    { divider: true },
    { label: 'Notifications', to: '/notifications' },
  ],
}

export default function Sidebar() {
  const { user } = useAuth()
  const location = useLocation()
  const items = NAV[user?.role] || []

  return (
    <aside className="w-52 bg-slate-800 shrink-0 flex flex-col" style={{ minHeight: 'calc(100vh - 48px)' }}>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {items.map((item, i) =>
          item.divider ? (
            <hr key={i} className="border-slate-700 my-2" />
          ) : (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center px-3 py-2 rounded text-sm transition-colors ${
                location.pathname === item.to || location.pathname.startsWith(item.to + '/')
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          )
        )}
      </nav>
    </aside>
  )
}
