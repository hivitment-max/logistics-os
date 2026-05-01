export default function TrackingTab({ trackingData, onRefresh }: any) {
  return (
    <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-bold">📍 ტრეკინგი</h2>
        <button onClick={onRefresh} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs transition">🔄 განახლება</button>
      </div>
      <div className="space-y-3">
        {trackingData.map((t:any, i:number) => (
          <div key={i} className="p-4 bg-gray-900/40 rounded-lg border border-gray-700/50">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-blue-400">{t.event_type}</span>
              <span className="text-[10px] text-gray-500">{new Date(t.created_at).toLocaleString('ka-GE')}</span>
            </div>
            <p className="text-sm text-gray-300">{t.notes || t.location_name}</p>
            {t.latitude && t.longitude && (
              <div className="mt-2 p-3 bg-gray-800 rounded text-[10px] font-mono">
                📍 {t.latitude}, {t.longitude}
              </div>
            )}
          </div>
        ))}
        {trackingData.length === 0 && <p className="text-center text-gray-500 py-8">ტრეკინგის მონაცემები არ არის</p>}
      </div>
    </div>
  )
}