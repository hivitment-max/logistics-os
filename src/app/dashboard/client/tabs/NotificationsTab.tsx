export default function NotificationsTab({ notifications, onMarkRead }: any) {
  return (
    <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-6">
      <h2 className="text-sm font-bold mb-4">🔔 შეტყობინებები</h2>
      <div className="space-y-3">
        {notifications.map((n:any) => (
          <div key={n.id} className={`p-4 rounded-lg border ${n.read ? 'bg-gray-900/20 border-gray-700/30' : 'bg-blue-500/10 border-blue-500/30'}`}>
            <div className="flex justify-between items-start mb-1">
              <span className="text-xs font-semibold text-blue-400">{n.title || 'შეტყობინება'}</span>
              <span className="text-[10px] text-gray-500">{new Date(n.created_at).toLocaleString('ka-GE')}</span>
            </div>
            <p className="text-sm text-gray-300">{n.message}</p>
            {!n.read && (
              <button onClick={() => onMarkRead(n.id)} className="mt-2 text-[10px] text-blue-400 hover:text-blue-300 underline">
                მონიშნე, როგორც წაკითხული
              </button>
            )}
          </div>
        ))}
        {notifications.length === 0 && <p className="text-center text-gray-500 py-8">ახალი შეტყობინებები არ არის 🎉</p>}
      </div>
    </div>
  )
}