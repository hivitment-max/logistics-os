'use client'

interface OverviewTabProps {
  orders: any[]
  invoices: any[]
  vehicles: any[]
  drivers: any[]
  getStatusColor: (status: string) => string
  onNavigateToVehicles: () => void
  onNavigateToKpi: () => void
}

export default function OverviewTab({ 
  orders, 
  invoices, 
  vehicles, 
  getStatusColor,
  onNavigateToVehicles,
  onNavigateToKpi
}: OverviewTabProps) {

  // 🔍 უახლესი შეკვეთა Pipeline-ისთვის
  const latestOrder = orders.length > 0 
    ? [...orders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] 
    : null

  // 📋 სიების მომზადება
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  const availableVehicles = vehicles
    .filter(v => v.status === 'active' && !v.driver_id)
    .slice(0, 5)

  // 🚀 სრული 7-ნაბიჯიანი Pipeline
  const workflowSteps = [
    { id: 'created', label: 'შეკვეთა', icon: '📦', detail: latestOrder?.tracking_code || '–' },
    { id: 'driver', label: 'მძღოლი', icon: '👨‍✈️', detail: latestOrder?.drivers?.full_name || 'მინიჭებული არ არის' },
    { id: 'vehicle', label: 'მანქანა', icon: '🚐', detail: latestOrder?.vehicles?.plate_number || 'მინიჭებული არ არის' },
    { id: 'confirmed', label: 'დადასტურება', icon: '✅', detail: latestOrder?.status === 'confirmed' ? 'მზადაა' : 'ლოდინში' },
    { id: 'transit', label: 'გზაში', icon: '🛣️', detail: latestOrder?.status === 'in_transit' ? 'მიმავალია' : '–' },
    { id: 'loaded', label: 'ჩატვირთვა', icon: '📦⬆️', detail: latestOrder?.status === 'picked_up' ? 'აღებულია' : '–' },
    { id: 'delivered', label: 'მიწოდება', icon: '🏁', detail: latestOrder?.status === 'delivered' ? 'შესრულდა' : '–' }
  ]

  const getCurrentStepIndex = () => {
    if (!latestOrder) return 0
    if (latestOrder.status === 'delivered') return 6
    if (latestOrder.tracking_events?.some((e: any) => e.event_type === 'picked_up') || latestOrder.status === 'picked_up') return 5
    if (latestOrder.status === 'in_transit') return 4
    if (latestOrder.status === 'confirmed') return 3
    if (latestOrder.vehicle_id) return 2
    if (latestOrder.driver_id) return 1
    return 0
  }
  const currentStep = getCurrentStepIndex()

  return (
    <div className="space-y-6">
      {/* 🎯 Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'შეკვეთები', value: orders.length, icon: '📦', color: 'from-blue-500 to-blue-600', action: onNavigateToVehicles },
          { label: 'აქტიური', value: vehicles.filter(v => ['active', 'in_transit', 'გზაში'].includes(v.status)).length, icon: '🚛', color: 'from-green-500 to-green-600', action: onNavigateToVehicles },
          { label: 'ინვოისები', value: invoices.length, icon: '🧾', color: 'from-purple-500 to-purple-600', action: onNavigateToVehicles },
          { label: 'KPI', value: 'ნახვა', icon: '🎯', color: 'from-orange-500 to-orange-600', action: onNavigateToKpi }
        ].map((stat, i) => (
          <button 
            key={i} 
            onClick={stat.action}
            className={`bg-gradient-to-br ${stat.color} rounded-xl p-4 shadow-md hover:scale-[1.02] transition-transform text-left`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white/70 text-[10px] font-medium uppercase">{stat.label}</p>
                <p className="text-xl font-bold mt-0.5 text-white">{stat.value}</p>
              </div>
              <div className="p-1 bg-white/20 rounded text-sm">{stat.icon}</div>
            </div>
          </button>
        ))}
      </div>

      {/* 🚀 სრული Order Pipeline (7 ნაბიჯი) */}
      {latestOrder ? (
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-5 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-bold text-gray-300 flex items-center gap-2">
              📍 პროცესის ხილვადობა: <span className="text-purple-400 font-mono">{latestOrder.tracking_code}</span>
            </h2>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(latestOrder.status)}`}>
              {latestOrder.status.toUpperCase()}
            </span>
          </div>
          
          <div className="flex items-start justify-between gap-2 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
            {workflowSteps.map((step, index) => {
              const isCompleted = index < currentStep
              const isActive = index === currentStep

              return (
                <div key={step.id} className="flex flex-col items-center min-w-[90px] relative group snap-center">
                  {/* დამაკავშირებელი ხაზი */}
                  {index < workflowSteps.length - 1 && (
                    <div className={`absolute top-8 left-1/2 w-full h-[3px] ${isCompleted ? 'bg-green-500' : 'bg-gray-700'}`} style={{ width: 'calc(100% + 8px)' }}></div>
                  )}
                  
                  {/* ბარათი */}
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl transition-all duration-300 border-2 cursor-pointer relative z-10 ${
                    isCompleted 
                      ? 'bg-green-500/10 border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.2)]' 
                      : isActive 
                        ? 'bg-blue-500/15 border-blue-400 shadow-[0_0_25px_rgba(59,130,246,0.3)] scale-105 ring-2 ring-blue-400/30' 
                        : 'bg-gray-800/50 border-gray-700 opacity-40 grayscale'
                  }`}>
                    {step.icon}
                    {isCompleted && <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold border-2 border-gray-900">✓</div>}
                  </div>
                  
                  {/* ტექსტი */}
                  <div className="mt-3 text-center">
                    <p className={`text-[11px] font-bold transition-colors ${isActive ? 'text-blue-400' : isCompleted ? 'text-green-400' : 'text-gray-500'}`}>
                      {step.label}
                    </p>
                    <p className="text-[9px] text-gray-400 mt-1 max-w-[80px] truncate mx-auto" title={step.detail}>
                      {step.detail}
                    </p>
                  </div>

                  {/* Hover Tooltip */}
                  <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl border border-gray-700 z-20">
                    {step.detail}
                  </div>
                </div>
              )
            })}
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-700/50 flex justify-between text-[10px] text-gray-500">
            <span>📅 შექმნის თარიღი: {latestOrder.created_at ? new Date(latestOrder.created_at).toLocaleDateString() : '–'}</span>
            <span>📍 მარშრუტი: {latestOrder.pickup_address?.slice(0, 15)}... → {latestOrder.delivery_address?.slice(0, 15)}...</span>
          </div>
        </div>
      ) : (
        <div className="bg-gray-800/40 border border-dashed border-gray-700 rounded-xl p-6 text-center text-gray-500">
          ჯერ არ არის შეკვეთები. <button onClick={onNavigateToVehicles} className="text-blue-400 hover:underline">შექმენი პირველი</button> 🚀
        </div>
      )}

      {/* 📦 და 🚐 ცხრილები */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ბოლო შეკვეთები */}
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-700/50 flex justify-between items-center bg-gray-800/80">
            <h2 className="text-xs font-bold uppercase text-gray-300">📦 ბოლო შეკვეთები</h2>
            <button onClick={onNavigateToVehicles} className="text-[10px] text-blue-400 hover:text-blue-300">ყველა →</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead className="text-gray-500 uppercase bg-gray-900/40"><tr><th className="px-4 py-3 text-left">Tracking</th><th className="px-4 py-3 text-left">სტატუსი</th><th className="px-4 py-3 text-left">ფასი</th></tr></thead>
              <tbody className="divide-y divide-gray-700/30">
                {recentOrders.map(o => (
                  <tr key={o.id} className="hover:bg-gray-700/20"><td className="px-4 py-3 font-mono font-bold text-purple-400">{o.tracking_code}</td><td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-[10px] border ${getStatusColor(o.status)}`}>{o.status}</span></td><td className="px-4 py-3 font-medium">{o.price} {o.currency}</td></tr>
                ))}
                {recentOrders.length === 0 && <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-500">–</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* მზა მანქანები */}
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-700/50 flex justify-between items-center bg-gray-800/80">
            <h2 className="text-xs font-bold uppercase text-gray-300">🚐 მზა მანქანები</h2>
            <button onClick={onNavigateToVehicles} className="text-[10px] text-blue-400 hover:text-blue-300">ყველა →</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead className="text-gray-500 uppercase bg-gray-900/40"><tr><th className="px-4 py-3 text-left">სანომრე</th><th className="px-4 py-3 text-left">მოდელი</th><th className="px-4 py-3 text-right">მოქმედება</th></tr></thead>
              <tbody className="divide-y divide-gray-700/30">
                {availableVehicles.map(v => (
                  <tr key={v.id} className="hover:bg-gray-700/20"><td className="px-4 py-3 font-mono font-bold text-blue-400">{v.plate_number}</td><td className="px-4 py-3 text-gray-200">{v.model}</td><td className="px-4 py-3 text-right"><button onClick={onNavigateToVehicles} className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded text-[9px] transition">მინიჭება</button></td></tr>
                ))}
                {availableVehicles.length === 0 && <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-500">ყველა დაკავებულია</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}