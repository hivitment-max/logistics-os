'use client'

interface HeaderProps {
  title: string
  icon: string
  onNotificationsToggle: () => void
  unreadCount: number
}

export default function Header({ title, icon, onNotificationsToggle, unreadCount }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-gray-950/90 backdrop-blur border-b border-gray-800/50 px-5 py-2">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-sm font-bold flex items-center gap-2 text-gray-100">
            {icon} {title}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onNotificationsToggle}
            className="relative p-1.5 hover:bg-gray-800 rounded-lg transition"
            title="შეტყობინებები"
          >
            <span className="text-lg leading-none">🔔</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-[9px] text-white rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}