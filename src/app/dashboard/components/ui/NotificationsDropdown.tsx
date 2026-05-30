// src/app/dashboard/components/ui/NotificationsDropdown.tsx
'use client'

// ✅ ტიპის განსაზღვრა ადგილზე - აღარ გვჭირდება იმპორტი!
export type DashboardNotification = {
  id: string
  title: string
  message: string
  status: 'unread' | 'read'
  created_at: string
  read_at: string | null
  channel: string
  order_id?: string | null
  [key: string]: any  // დამატებითი ველებისთვის
}

interface NotificationsDropdownProps {
  notifications: DashboardNotification[]
  isOpen: boolean
  onClose: () => void
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onNotificationClick: (notification: DashboardNotification) => void
}

export default function NotificationsDropdown({
  notifications,
  isOpen,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onNotificationClick,
}: NotificationsDropdownProps) {
  if (!isOpen) return null

  const unreadCount = notifications.filter((n) => n.status === 'unread').length

  return (
    <div
      className="fixed top-12 right-4 z-50 w-80 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-4 py-3 border-b border-gray-700 flex justify-between items-center bg-gray-800">
        <h3 className="text-xs font-bold text-white flex items-center gap-2">🔔 შეტყობინებები</h3>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllAsRead}
            className="text-[9px] text-blue-400 hover:text-blue-300 transition"
          >
            ყველას წაკითხვა
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-xs">ახალი შეტყობინებები არ არის</div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => {
                onMarkAsRead(notif.id)
                onNotificationClick(notif)
              }}
              className={`p-3 border-b border-gray-700/50 hover:bg-gray-700/30 cursor-pointer transition ${
                notif.status === 'unread' ? 'bg-blue-500/5 border-l-2 border-l-blue-500' : ''
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg shrink-0">
                  {notif.title?.startsWith('✅')
                    ? '✅'
                    : notif.title?.startsWith('❌')
                    ? '❌'
                    : '🔔'}
                </span>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-[10px] font-medium ${
                      notif.status === 'unread' ? 'text-white' : 'text-gray-300'
                    }`}
                  >
                    {notif.title}
                  </p>
                  <p
                    className="text-[9px] text-gray-400 mt-0.5 line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: notif.message }}
                  />
                  <p className="text-[8px] text-gray-500 mt-1">
                    {new Date(notif.created_at).toLocaleTimeString('ka-GE', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                {notif.status === 'unread' && (
                  <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1"></span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {notifications.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-700 bg-gray-800/50">
          <button
            onClick={() => {
              onClose()
              // ✅ შევქმენით dummy ობიექტი რომ TypeScript-მა არ დაგვბლოკოს
              onNotificationClick({ 
                id: 'all', 
                title: '', 
                message: '', 
                channel: 'dashboard', 
                status: 'read', 
                order_id: null, 
                created_at: '', 
                read_at: null 
              })
            }}
            className="w-full text-[9px] text-blue-400 hover:text-blue-300 transition text-center"
          >
            ყველა შეკვეთის ნახვა →
          </button>
        </div>
      )}
    </div>
  )
}