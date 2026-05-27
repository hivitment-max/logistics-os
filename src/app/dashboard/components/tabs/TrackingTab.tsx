'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import LoadingTruck from '@/app/dashboard/components/ui/LoadingTruck'

interface Order {
  id: string
  tracking_code: string
  status: string
  pickup_address: string
  delivery_address: string
  cargo_description: string
  price: number
  currency: string
  created_at: string
  drivers?: { full_name: string; phone: string } | null
  vehicles?: { plate_number: string; model: string } | null
}

interface TrackingEvent {
  id: string
  order_id: string
  driver_id: string | null
  vehicle_id: string | null
  event_type: string
  event_data: any
  latitude: number | null
  longitude: number | null
  source: string
  created_at: string
}

// 🎨 სტატუსების პრემიუმ კონფიგურაცია
const STATUS_CONFIG = [
  { key: 'assigned', icon: '📋', label: 'მინიჭებულია', desc: 'შეკვეთა დამუშავებულია', color: 'from-blue-500 to-cyan-400', glow: 'shadow-[0_0_20px_rgba(59,130,246,0.5)]', step: 1 },
  { key: 'en_route', icon: '🚗', label: 'მიემართება', desc: 'მძღოლი ატვირთვისკენ', color: 'from-indigo-500 to-purple-400', glow: 'shadow-[0_0_20px_rgba(99,102,241,0.5)]', step: 2 },
  { key: 'loaded', icon: '📦', label: 'ჩატვირთულია', desc: 'ტვირთი დატვირთულია', color: 'from-emerald-500 to-teal-400', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.5)]', step: 3 },
  { key: 'in_transit', icon: '🛣️', label: 'გზაში', desc: 'ტრანზიტში / მოძრაობს', color: 'from-cyan-500 to-sky-400', glow: 'shadow-[0_0_20px_rgba(6,182,212,0.5)]', step: 4 },
  { key: 'border_crossed', icon: '🌍', label: 'საზღვარი', desc: 'საზღვარი გადაკვეთილია', color: 'from-purple-500 to-pink-400', glow: 'shadow-[0_0_20px_rgba(168,85,247,0.5)]', step: 5 },
  { key: 'arrived', icon: '📍', label: 'ადგილზე', desc: 'დანიშნულების ადგილას', color: 'from-orange-500 to-amber-400', glow: 'shadow-[0_0_20px_rgba(249,115,22,0.5)]', step: 6 },
  { key: 'delivered', icon: '📥', label: 'ჩაბარებულია', desc: 'ტვირთი ჩაბარებულია', color: 'from-green-500 to-lime-400', glow: 'shadow-[0_0_20px_rgba(34,197,94,0.5)]', step: 7 },
  { key: 'completed', icon: '💰', label: 'დასრულებული', desc: 'ანგარიშსწორება დასრულდა', color: 'from-yellow-500 to-amber-400', glow: 'shadow-[0_0_20px_rgba(234,179,8,0.5)]', step: 8 },
] as const

export default function TrackingTab() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [events, setEvents] = useState<TrackingEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)

  // 📦 შეკვეთების ჩატვირთვა
  useEffect(() => { fetchOrders() }, [])

  // 🔄 ტრეკინგის მოვლენები + Realtime
  useEffect(() => {
    if (!selectedOrder) { setEvents([]); return }
    fetchTrackingEvents(selectedOrder.id)
    
    const channel = supabase
      .channel(`tracking_${selectedOrder.id}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'tracking_events', filter: `order_id=eq.${selectedOrder.id}` },
        (payload) => setEvents(prev => [...prev, payload.new as TrackingEvent])
      )
      .subscribe()
    
    return () => { supabase.removeChannel(channel) }
  }, [selectedOrder])

  const fetchOrders = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('orders')
      .select(`*, drivers ( full_name, phone ), vehicles ( plate_number, model )`)
      .order('created_at', { ascending: false })
    if (!error && data) setOrders(data as Order[])
    setLoading(false)
  }

  const fetchTrackingEvents = async (orderId: string) => {
    setEventsLoading(true)
    const { data, error } = await supabase
      .from('tracking_events')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })
    if (!error && data) setEvents(data as TrackingEvent[])
    setEventsLoading(false)
  }

  const filteredOrders = useMemo(() => {
    const active = orders.filter(o => o.status && !['cancelled', 'completed'].includes(o.status.toLowerCase()))
    return filter === 'all' ? active : active.filter(o => o.status === filter)
  }, [orders, filter])

  const progress = useMemo(() => {
    if (!selectedOrder || events.length === 0) return 0
    const latest = events[events.length - 1].event_type
    const config = STATUS_CONFIG.find(c => c.key === latest || latest.includes(c.key))
    return config ? (config.step / STATUS_CONFIG.length) * 100 : 0
  }, [selectedOrder, events])

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingTruck message="იტვირთება..." /></div>

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col lg:flex-row gap-6">
      
      {/* 🗂️ SIDEBAR: შეკვეთების სია - გლასმორფიზმი */}
      <aside className="lg:w-80 xl:w-96 flex flex-col bg-gradient-to-br from-gray-900/80 to-gray-800/60 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 bg-gradient-to-r from-blue-600/10 to-transparent">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <span className="text-lg">📍</span> აქტიური მარშრუტები
            </h2>
            <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
              {filteredOrders.length}
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 py-3 border-b border-white/5 flex gap-1.5">
          {[
            { id: 'all', label: 'ყველა', icon: '📋' },
            { id: 'pending', label: '🕒', icon: '🕒' },
            { id: 'in_transit', label: '🚚', icon: '🚚' },
            { id: 'delivered', label: '✅', icon: '✅' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all duration-200 ${
                filter === f.id 
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25 scale-[1.02]' 
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200'
              }`}
            >
              {f.icon}
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <span className="text-3xl mb-2 opacity-30">🔍</span>
              <p className="text-[10px] text-gray-500">აქტიური შეკვეთები არ არის</p>
            </div>
          ) : (
            filteredOrders.map(order => {
              const isActive = selectedOrder?.id === order.id
              const statusCfg = STATUS_CONFIG.find(c => c.key === order.status || order.status.includes(c.key)) || STATUS_CONFIG[0]
              
              return (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 group relative overflow-hidden
                    ${isActive 
                      ? 'bg-gradient-to-br from-blue-600/20 to-cyan-600/10 border-blue-500/40 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/30' 
                      : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                    }`}
                >
                  {/* აქტიური ინდიკატორი */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-l-2xl"></div>
                  )}
                  
                  {/* Tracking Code + Status */}
                  <div className="flex justify-between items-start mb-2 pl-1">
                    <span className="text-xs font-bold font-mono text-white tracking-wide">{order.tracking_code}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full border backdrop-blur-sm ${
                      order.status === 'in_transit' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                      order.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                      'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>
                      {order.status === 'pending' ? 'ლოდინში' :
                       order.status === 'in_transit' ? 'გზაში' :
                       order.status === 'delivered' ? 'მიწოდებული' : order.status}
                    </span>
                  </div>
                  
                  {/* Route */}
                  <div className="pl-1 mb-3">
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                      <span className="text-emerald-400">📍</span>
                      <span className="truncate max-w-[120px]">{order.pickup_city || order.pickup_address?.slice(0,12)}</span>
                      <span className="text-gray-600">→</span>
                      <span className="text-rose-400">🏁</span>
                      <span className="truncate max-w-[120px]">{order.delivery_city || order.delivery_address?.slice(0,12)}</span>
                    </div>
                  </div>
                  
                  {/* Footer: Driver + Price */}
                  <div className="pl-1 pt-2 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[9px] font-bold text-white">
                        {order.drivers?.full_name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <span className="text-[9px] text-gray-400 truncate max-w-[100px]">{order.drivers?.full_name || '–'}</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400">{order.price} {order.currency}</span>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </aside>

      {/* 🗺️ MAIN: ტაიმლაინი & დეტალები */}
      <main className="flex-1 flex flex-col bg-gradient-to-br from-gray-900/80 to-gray-800/60 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        {selectedOrder ? (
          <>
            {/* Header with Progress */}
            <header className="px-6 py-5 border-b border-white/10 bg-gradient-to-r from-emerald-600/10 to-transparent">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-sm font-bold text-white tracking-wide">{selectedOrder.tracking_code}</h3>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full border ${
                      selectedOrder.status === 'in_transit' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 animate-pulse' :
                      selectedOrder.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                      'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 flex items-center gap-1">
                    <span className="text-emerald-400">📍</span> {selectedOrder.pickup_address?.slice(0,20)}... 
                    <span className="text-gray-600">→</span> 
                    <span className="text-rose-400">🏁</span> {selectedOrder.delivery_address?.slice(0,20)}...
                  </p>
                </div>
                
                {/* Progress Ring */}
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-700" />
                      <circle cx="32" cy="32" r="28" stroke="url(#gradient)" strokeWidth="4" fill="transparent" 
                        strokeDasharray={175.9} strokeDashoffset={175.9 - (175.9 * progress) / 100} 
                        className="transition-all duration-700 ease-out" strokeLinecap="round" />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="50%" stopColor="#06b6d4" />
                          <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold text-white">{Math.round(progress)}%</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-gray-500 uppercase tracking-wide">მიმდინარე პროგრესი</p>
                    <p className="text-[10px] text-gray-400">{events.length} განახლება</p>
                  </div>
                </div>
              </div>
            </header>

            {/* Timeline */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {eventsLoading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs text-gray-400">იტვირთება ტაიმლაინი...</span>
                  </div>
                </div>
              ) : events.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 flex items-center justify-center mb-4 animate-pulse">
                    <span className="text-3xl">📡</span>
                  </div>
                  <p className="text-sm font-medium text-white">ჯერ არ არის განახლებები</p>
                  <p className="text-[10px] text-gray-500 mt-1.5 max-w-xs">მძღოლი Telegram-დან ან ადმინი პანელიდან განაახლებს სტატუსს</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Vertical Line */}
                  <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-blue-500/50 via-cyan-500/30 to-transparent"></div>
                  
                  {/* Events */}
                  <div className="space-y-6">
                    {events.map((event, idx) => {
                      const config = STATUS_CONFIG.find(c => c.key === event.event_type || event.event_type.includes(c.key)) || 
                                     { icon: '📌', label: event.event_type, desc: '', color: 'from-gray-500 to-gray-400', glow: '', step: 0 }
                      const isLatest = idx === events.length - 1
                      
                      return (
                        <div key={event.id} className={`relative flex gap-4 ${isLatest ? '' : 'opacity-90'}`}>
                          {/* Icon Circle with Glow */}
                          <div className={`relative flex-shrink-0 z-10`}>
                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${config.color} ${config.glow} flex items-center justify-center text-lg shadow-lg transition-transform hover:scale-110`}>
                              {config.icon}
                            </div>
                            {isLatest && (
                              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 animate-ping opacity-30"></div>
                            )}
                          </div>
                          
                          {/* Content Card */}
                          <div className={`flex-1 pb-6 ${isLatest ? '' : 'border-l-2 border-dashed border-gray-700/50 pl-4'}`}>
                            <div className={`p-4 rounded-2xl backdrop-blur-sm border transition-all duration-300 ${
                              isLatest 
                                ? 'bg-gradient-to-br from-blue-600/10 to-cyan-600/5 border-blue-500/30 shadow-lg shadow-blue-500/5' 
                                : 'bg-white/5 border-white/10 hover:border-white/20'
                            }`}>
                              <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
                                <div>
                                  <h4 className="text-xs font-semibold text-white">{config.label}</h4>
                                  <p className="text-[9px] text-gray-500">{config.desc}</p>
                                </div>
                                <span className="text-[9px] text-gray-500 bg-gray-900/50 px-2 py-1 rounded-lg border border-white/5">
                                  {new Date(event.created_at).toLocaleString('ka-GE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              
                              {/* Source Badge + Location */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full border backdrop-blur-sm ${
                                  event.source === 'telegram' 
                                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' 
                                    : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                                }`}>
                                  {event.source === 'telegram' ? '📱 Telegram' : '👨‍💼 ადმინი'}
                                </span>
                                {event.latitude && event.longitude && (
                                  <span className="text-[8px] px-2 py-0.5 rounded-full bg-gray-900/30 text-gray-400 border border-gray-700/50">
                                    📍 {event.latitude.toFixed(3)}, {event.longitude.toFixed(3)}
                                  </span>
                                )}
                              </div>
                              
                              {/* Note */}
                              {event.event_data?.note && (
                                <p className="text-[10px] text-gray-400 mt-3 p-2.5 rounded-xl bg-gray-900/30 border-l-2 border-blue-500/50 italic">
                                  💬 "{event.event_data.note}"
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          // Empty State - Premium Design
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-600/20 to-cyan-600/10 border border-blue-500/30 flex items-center justify-center shadow-2xl shadow-blue-500/10">
                <span className="text-4xl animate-bounce">🗺️</span>
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-3xl blur-xl opacity-50 animate-pulse"></div>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">აირჩიე შეკვეთა</h3>
            <p className="text-[10px] text-gray-500 max-w-xs leading-relaxed">
              მარცხენა სიიდან შეკვეთის არჩევისას აქ გამოჩნდება მარშრუტის სრული ტაიმლაინი, რეალური დროის განახლებები და პროგრესი
            </p>
            <div className="mt-6 flex items-center gap-2 text-[9px] text-gray-600">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span>Realtime განახლებები ჩართულია</span>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}