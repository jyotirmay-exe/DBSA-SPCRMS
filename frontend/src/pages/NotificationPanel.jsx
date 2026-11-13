import { useEffect, useState } from 'react'
import { notificationsAPI } from '../services/api'
import Breadcrumb from '../components/Breadcrumb'

const TYPE_LABEL = {
  appointment_scheduled: 'Appointment',
  appointment_assigned: 'Appointment',
  appointment_cancelled: 'Appointment',
  lab_result_available: 'Lab Result',
  lab_result_entered: 'Lab Result',
  general: 'General',
}

export default function NotificationPanel() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  function load() {
    notificationsAPI.list().then(r => setNotifications(r.data)).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleMarkRead(id) {
    await notificationsAPI.markRead(id)
    load()
  }

  async function handleMarkAllRead() {
    await notificationsAPI.markAllRead()
    load()
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div>
      <Breadcrumb items={[{ label: 'Notifications' }]} />
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-semibold text-slate-800">
          Notifications
          {unreadCount > 0 && <span className="ml-2 text-sm font-normal text-slate-500">({unreadCount} unread)</span>}
        </h1>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="text-sm text-slate-600 hover:text-slate-800 hover:underline">
            Mark all read
          </button>
        )}
      </div>

      {loading ? <p className="text-slate-500">Loading…</p> : notifications.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-400">No notifications.</div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div
              key={n.notification_id}
              className={`bg-white border rounded-lg p-4 flex items-start gap-4 ${!n.is_read ? 'border-slate-300 bg-slate-50' : 'border-slate-200'}`}
            >
              <div className="shrink-0 mt-0.5">
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                  n.notification_type.startsWith('appointment') ? 'bg-blue-50 text-blue-700' :
                  n.notification_type.startsWith('lab_result') ? 'bg-emerald-50 text-emerald-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {TYPE_LABEL[n.notification_type] || 'Notice'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700">{n.message}</p>
                <p className="text-xs text-slate-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
              </div>
              {!n.is_read && (
                <button
                  onClick={() => handleMarkRead(n.notification_id)}
                  className="text-xs text-slate-500 hover:text-slate-700 hover:underline shrink-0"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
