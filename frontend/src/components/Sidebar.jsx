import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useEffect, useState } from 'react'
import { notificationsAPI } from '../services/api'

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
    { label: 'Notifications', to: '/notifications', badge: true },
  ],
  doctor: [
    { label: 'Dashboard', to: '/doctor/dashboard' },
    { label: 'Appointments', to: '/doctor/appointments' },
    { divider: true },
    { label: 'Notifications', to: '/notifications', badge: true },
  ],
  lab_technician: [
    { label: 'Dashboard', to: '/lab/dashboard' },
    { divider: true },
    { label: 'Upload X-Ray', to: '/lab/images/upload' },
    { label: 'Upload ECG', to: '/lab/ecg/upload' },
    { divider: true },
    { label: 'Notifications', to: '/notifications', badge: true },
  ],
  patient: [
    { label: 'My Health', to: '/patient/dashboard' },
    { divider: true },
    { label: 'Notifications', to: '/notifications', badge: true },
  ],
}

export default function Sidebar() {
  const { user } = useAuth()
  const location = useLocation()
  const items = NAV[user?.role] || []
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!user) return
    function fetchCount() {
      notificationsAPI.unreadCount().then(r => setUnread(r.data.count)).catch(() => {})
    }
    fetchCount()
    const id = setInterval(fetchCount, 30000)
    return () => clearInterval(id)
  }, [user])

  // reset badge when user navigates to notifications page
  useEffect(() => {
    if (location.pathname === '/notifications') setUnread(0)
  }, [location.pathname])

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
              className={`flex items-center justify-between px-3 py-2 rounded text-sm transition-colors ${
                location.pathname === item.to || location.pathname.startsWith(item.to + '/')
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <span>{item.label}</span>
              {item.badge && unread > 0 && (
                <span className="bg-red-500 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center leading-none">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </Link>
          )
        )}
      </nav>
    </aside>
  )
}
