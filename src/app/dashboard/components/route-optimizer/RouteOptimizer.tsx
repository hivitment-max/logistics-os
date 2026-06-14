'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase/client'
import { getCityCoordinates, calculateDistance } from '@/lib/locations'

const RouteMap = dynamic(() => import('./RouteMap'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 rounded-2xl flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-bounce">🗺️</div>
        <p className="text-slate-600 font-medium">რუკა იტვირთება...</p>
      </div>
    </div>
  )
})

interface Route {
  id: string
  trackingCode: string
  source: string
  vehicleId: string
  plateNumber: string
  driverName: string
  driverPhone: string
  from: string
  to: string
  fromCoords: { lat: number; lng: number }
  toCoords: { lat: number; lng: number }
  distance: number
  weight: number
  price: number
  status: 'pending' | 'in_transit' | 'delivered'
  driverResponse: 'pending' | 'accepted' | 'rejected'
  createdAt: string
  assignedAt: string | null
  driverNotifiedAt: string | null
  driverConfirmedAt: string | null
  instructionsSentAt: string | null
  enRouteAt: string | null
  deliveredAt: string | null
}

export default function RouteOptimizer() {
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [showDebug, setShowDebug] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    loadRoutes()
  }, [])

  const handleStartRoute = async (orderId: string) => {
    setUpdating(orderId)
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'in_transit',
          en_route_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (error) throw error
      await loadRoutes()
    } catch (error: any) {
      alert(`❌ შეცდომა: ${error.message}`)
    } finally {
      setUpdating(null)
    }
  }

  const handleCompleteRoute = async (orderId: string) => {
    setUpdating(orderId)
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'delivered',
          delivered_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (error) throw error
      await loadRoutes()
    } catch (error: any) {
      alert(`❌ შეცდომა: ${error.message}`)
    } finally {
      setUpdating(null)
    }
  }

  const loadRoutes = async () => {
    try {
      setLoading(true)
      
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          vehicle:vehicle_id(plate_number, model),
          driver:driver_id(full_name, phone)
        `)
        .in('status', ['assigned', 'in_transit', 'delivered', 'pending', 'new', 'confirmed'])
        .order('created_at', { ascending: false })

      if (error) {
        setDebugInfo({ error: error.message, orders: [] })
        throw error
      }

      setDebugInfo({
        totalOrders: orders?.length || 0,
        orders: orders?.map(o => ({
          id: o.id,
          tracking: o.tracking_code,
          status: o.status,
          source: o.source,
          vehicle: o.vehicle?.plate_number,
          driver: o.driver?.full_name,
          from: o.pickup_city,
          to: o.delivery_city
        })) || []
      })

      const formattedRoutes: Route[] = (orders || []).map((order: any) => {
        const fromCity = order.pickup_city || order.pickup_address || 'თბილისი'
        const toCity = order.delivery_city || order.delivery_address || 'ბათუმი'
        
        let normalizedStatus: 'pending' | 'in_transit' | 'delivered' = 'pending'
        const status = order.status?.toLowerCase()
        
        if (status === 'in_transit' || status === 'გზაშია' || status === 'in transit' || status === 'en_route') {
          normalizedStatus = 'in_transit'
        } else if (status === 'delivered' || status === 'მიწოდებული' || status === 'completed') {
          normalizedStatus = 'delivered'
        }

        return {
          id: order.id,
          trackingCode: order.tracking_code || 'N/A',
          source: order.source || (order.client_id ? 'customer' : 'admin'),
          vehicleId: order.vehicle_id || 'N/A',
          plateNumber: order.vehicle?.plate_number || 'N/A',
          driverName: order.driver?.full_name || 'მძღოლი არ არის',
          driverPhone: order.driver?.phone || '-',
          from: fromCity,
          to: toCity,
          fromCoords: getCityCoordinates(fromCity),
          toCoords: getCityCoordinates(toCity),
          distance: calculateDistance(
            getCityCoordinates(fromCity).lat,
            getCityCoordinates(fromCity).lng,
            getCityCoordinates(toCity).lat,
            getCityCoordinates(toCity).lng
          ),
          weight: parseFloat(order.cargo_weight_kg) || 0,
          price: parseFloat(order.price) || 0,
          status: normalizedStatus,
          driverResponse: (order.driver_response || 'pending') as 'pending' | 'accepted' | 'rejected',
          createdAt: order.created_at,
          assignedAt: order.assigned_at || null,
          driverNotifiedAt: order.driver_notified_at || null,
          driverConfirmedAt: order.driver_confirmed_at || null,
          instructionsSentAt: order.instructions_sent_at || null,
          enRouteAt: order.en_route_at || null,
          deliveredAt: order.delivered_at || null
        }
      })

      setRoutes(formattedRoutes)
    } catch (error: any) {
      console.error('❌ Failed to load routes:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredRoutes = filter === 'all' ? routes : 
    filter === 'active' ? routes.filter(r => r.status === 'in_transit' || r.status === 'pending') :
    routes.filter(r => r.status === 'delivered')

  const selectedRouteData = routes.find(r => r.id === selectedRoute)

  const mapLocations = routes.flatMap((route) => [
    {
      id: `${route.id}-pickup`,
      name: `📍 ${route.from}`,
      address: route.from,
      lat: route.fromCoords.lat,
      lng: route.fromCoords.lng,
      type: 'pickup' as const,
      status: 'completed' as const,
      time: route.distance + ' კმ',
      routeId: route.id
    },
    {
      id: `${route.id}-delivery`,
      name: `🏁 ${route.to}`,
      address: route.to,
      lat: route.toCoords.lat,
      lng: route.toCoords.lng,
      type: 'delivery' as const,
      status: route.status === 'delivered' ? 'completed' as const : 'pending' as const,
      time: route.trackingCode,
      routeId: route.id
    },
    {
      id: `${route.id}-vehicle`,
      name: `🚛 ${route.plateNumber}`,
      address: `${route.driverName}`,
      lat: route.fromCoords.lat + (route.toCoords.lat - route.fromCoords.lat) * 0.5,
      lng: route.fromCoords.lng + (route.toCoords.lng - route.fromCoords.lng) * 0.5,
      type: 'vehicle' as const,
      status: route.status === 'in_transit' ? 'in_transit' as const : 'pending' as const,
      time: `${route.weight} კგ`,
      routeId: route.id
    }
  ])

  const routePaths = routes.map((route) => ({
    id: route.id,
    path: [
      [route.fromCoords.lat, route.fromCoords.lng] as [number, number],
      [route.toCoords.lat, route.toCoords.lng] as [number, number]
    ],
    color: selectedRoute === route.id ? '#f59e0b' : '#3b82f6'
  }))

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🚛</div>
          <p className="text-slate-600 font-medium">მარშრუტები იტვირთება...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 flex flex-col overflow-hidden">
      {/* 🎨 ლამაზი გარშემორტყმული კონტეინერი */}
      <div className="flex-1 m-4 bg-white rounded-3xl shadow-2xl border border-slate-200/60 overflow-hidden flex flex-col backdrop-blur-sm">
        
        {/* 🎯 Header - Fixed */}
        <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-6 py-4 flex items-center justify-between shrink-0 shadow-lg">
          {/* Decorative elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-blue-300 rounded-full blur-3xl"></div>
          </div>
          
          <div className="flex items-center gap-4 relative z-10">
            <button 
              onClick={() => window.history.back()}
              className="p-2 hover:bg-white/20 rounded-xl transition backdrop-blur-sm"
              title="უკან დაბრუნება"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                🗺️ მარშრუტების ოპტიმიზაცია
              </h1>
              <p className="text-xs text-blue-100 mt-0.5">
                აქტიური: {routes.filter(r => r.status === 'in_transit' || r.status === 'pending').length} · 
                სულ: {routes.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 relative z-10">
            <button 
              onClick={() => setShowDebug(!showDebug)}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-xl transition text-xs font-medium border border-white/20"
            >
              🔍 Debug
            </button>
            <button 
              onClick={loadRoutes}
              className="p-2 hover:bg-white/20 backdrop-blur-sm rounded-xl transition border border-white/20"
              title="განახლება"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            
            {/* ❌ დახურვის ღილაკი - მარჯვენა ზედა კუთხეში */}
            <button 
              onClick={() => window.history.back()}
              className="w-10 h-10 bg-white/10 hover:bg-red-500/80 backdrop-blur-sm rounded-full flex items-center justify-center transition group border border-white/20 hover:border-red-400"
              title="დახურვა"
            >
              <svg className="w-5 h-5 text-white group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 📊 Stats Bar - Fixed */}
        <div className="bg-white border-b border-slate-200 px-6 py-3 shrink-0">
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-3 border border-blue-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-medium text-blue-700 uppercase tracking-wide">აქტიური</p>
                  <p className="text-xl font-bold text-blue-600">{routes.filter(r => r.status === 'in_transit').length}</p>
                </div>
                <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <span className="text-lg">🚚</span>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-amber-100/50 rounded-xl p-3 border border-yellow-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-medium text-yellow-700 uppercase tracking-wide">ლოდინში</p>
                  <p className="text-xl font-bold text-yellow-600">{routes.filter(r => r.status === 'pending').length}</p>
                </div>
                <div className="w-10 h-10 bg-yellow-500/10 rounded-full flex items-center justify-center">
                  <span className="text-lg">⏳</span>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-100/50 rounded-xl p-3 border border-green-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-medium text-green-700 uppercase tracking-wide">დასრულებული</p>
                  <p className="text-xl font-bold text-green-600">{routes.filter(r => r.status === 'delivered').length}</p>
                </div>
                <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                  <span className="text-lg">✅</span>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-indigo-100/50 rounded-xl p-3 border border-purple-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-medium text-purple-700 uppercase tracking-wide">სულ</p>
                  <p className="text-xl font-bold text-purple-600">{routes.length}</p>
                </div>
                <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center">
                  <span className="text-lg">🗺️</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 🔍 Debug Panel - Collapsible */}
        {showDebug && debugInfo && (
          <div className="bg-purple-50 border-b-2 border-purple-200 px-6 py-3 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-purple-900">🔍 Debug Info</h3>
              <button 
                onClick={() => setShowDebug(false)}
                className="text-purple-600 hover:text-purple-800"
              >
                ✕
              </button>
            </div>
            <div className="flex gap-4 text-xs">
              <span className="font-medium">ბაზაში: <span className="text-purple-700 font-bold">{debugInfo.totalOrders}</span></span>
              <span className="font-medium">ფორმატირებული: <span className="text-blue-700 font-bold">{routes.length}</span></span>
            </div>
          </div>
        )}

        {/* 🎯 Main Content - Scrollable */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full grid grid-cols-12 gap-4 p-4">
            
            {/* Left Panel - Scrollable */}
            <div className="col-span-5 flex flex-col min-h-0 gap-4">
              
              {/* Routes List - Scrollable */}
              <div className="flex-1 min-h-0 bg-white rounded-2xl shadow-md border border-slate-200/60 flex flex-col overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                      მარშრუტები
                    </h2>
                    <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                      {filteredRoutes.length} / {routes.length}
                    </span>
                  </div>
                  
                  {/* Filters */}
                  <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                    {(['all', 'active', 'completed'] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`flex-1 px-3 py-1.5 rounded-md text-[11px] font-medium transition ${
                          filter === f 
                            ? 'bg-white text-slate-800 shadow-sm' 
                            : 'text-slate-600 hover:text-slate-800'
                        }`}
                      >
                        {f === 'all' ? 'ყველა' : f === 'active' ? 'აქტიური' : 'დასრულებული'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scrollable Routes */}
                <div className="flex-1 overflow-y-auto scrollbar-hide p-2 space-y-2">
                  {filteredRoutes.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center py-8 text-slate-400">
                        <div className="text-4xl mb-2">📭</div>
                        <p className="text-sm">მარშრუტები არ არის</p>
                      </div>
                    </div>
                  ) : (
                    filteredRoutes.map((route) => (
                      <div
                        key={route.id}
                        onClick={() => setSelectedRoute(route.id)}
                        className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${
                          selectedRoute === route.id
                            ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-400 shadow-md scale-[1.02]'
                            : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                              route.status === 'in_transit' ? 'bg-blue-100' :
                              route.status === 'delivered' ? 'bg-green-100' :
                              'bg-yellow-100'
                            }`}>
                              <span className="text-base">🚛</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-slate-800 truncate">
                                {route.plateNumber}
                              </p>
                              <p className="text-[11px] text-slate-500 truncate">
                                {route.from} → {route.to}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                              route.source === 'customer' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {route.source === 'customer' ? '👤 კლიენტი' : '👨‍💼 ადმინი'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                              route.status === 'in_transit' ? 'bg-blue-100 text-blue-700' :
                              route.status === 'delivered' ? 'bg-green-100 text-green-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {route.status === 'in_transit' ? '🚚 გზაში' :
                               route.status === 'delivered' ? '✅ მიწოდებული' :
                               '⏳ ლოდინში'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-100">
                          <span>👨‍✈️ {route.driverName}</span>
                          <span>⚖️ {route.weight}კგ · 💰 {route.price}₾</span>
                        </div>
                        
                        {/* Telegram Status Badges */}
                        <div className="mt-2 flex gap-1 flex-wrap">
                          {route.driverNotifiedAt && (
                            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[9px] font-medium">📩 გაგზ.</span>
                          )}
                          {route.driverConfirmedAt && (
                            <span className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded-md text-[9px] font-medium">✓ დადასტ.</span>
                          )}
                          {route.instructionsSentAt && (
                            <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded-md text-[9px] font-medium">📖 ინსტრ.</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Route Details - Scrollable, only when selected */}
              {selectedRouteData && (
                <div className="flex-shrink-0 max-h-[45%] bg-white rounded-2xl shadow-md border border-slate-200/60 flex flex-col overflow-hidden">
                  {/* Details Header */}
                  <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-3 shrink-0 flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-white truncate">
                        {selectedRouteData.from} → {selectedRouteData.to}
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {selectedRouteData.trackingCode} · {selectedRouteData.distance} კმ
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedRoute(null)}
                      className="w-6 h-6 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white text-xs"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Scrollable Details Content */}
                  <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-3">
                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-50 rounded-lg p-2">
                        <p className="text-[9px] text-slate-500 uppercase">შეკვეთა</p>
                        <p className="text-xs font-bold text-slate-800">{selectedRouteData.trackingCode}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2">
                        <p className="text-[9px] text-slate-500 uppercase">მანქანა</p>
                        <p className="text-xs font-bold text-slate-800">{selectedRouteData.plateNumber}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2">
                        <p className="text-[9px] text-slate-500 uppercase">მძღოლი</p>
                        <p className="text-xs font-bold text-slate-800 truncate">{selectedRouteData.driverName}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2">
                        <p className="text-[9px] text-slate-500 uppercase">ტელეფონი</p>
                        <p className="text-xs font-bold text-slate-800">{selectedRouteData.driverPhone}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2">
                        <p className="text-[9px] text-slate-500 uppercase">წონა</p>
                        <p className="text-xs font-bold text-slate-800">{selectedRouteData.weight} კგ</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2">
                        <p className="text-[9px] text-slate-500 uppercase">ფასი</p>
                        <p className="text-xs font-bold text-blue-600">{selectedRouteData.price} ₾</p>
                      </div>
                    </div>

                    {/* Telegram Status */}
                    <div className="space-y-1.5">
                      <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">📱 Telegram</h4>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-[11px]">
                          <span className="text-slate-600">📩 შეტყობინება</span>
                          <span className="font-medium text-slate-800">
                            {selectedRouteData.driverNotifiedAt 
                              ? new Date(selectedRouteData.driverNotifiedAt).toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })
                              : '❌'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50 text-[11px]">
                          <span className="text-blue-700">✓ დადასტურება</span>
                          <span className="font-medium text-blue-800">
                            {selectedRouteData.driverConfirmedAt 
                              ? new Date(selectedRouteData.driverConfirmedAt).toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })
                              : '⏳'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-purple-50 text-[11px]">
                          <span className="text-purple-700">📖 ინსტრუქცია</span>
                          <span className="font-medium text-purple-800">
                            {selectedRouteData.instructionsSentAt 
                              ? new Date(selectedRouteData.instructionsSentAt).toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })
                              : selectedRouteData.driverConfirmedAt ? '⚡ მზადაა' : '⏳'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      {selectedRouteData.status === 'pending' && selectedRouteData.driverConfirmedAt && (
                        <button
                          onClick={() => handleStartRoute(selectedRouteData.id)}
                          disabled={updating === selectedRouteData.id}
                          className="w-full px-3 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-bold text-xs transition shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                        >
                          {updating === selectedRouteData.id ? (
                            <><span className="animate-spin">⏳</span>იტვირთება...</>
                          ) : (
                            <><span>🚀</span>მარშრუტის დაწყება</>
                          )}
                        </button>
                      )}

                      {selectedRouteData.status === 'in_transit' && (
                        <button
                          onClick={() => handleCompleteRoute(selectedRouteData.id)}
                          disabled={updating === selectedRouteData.id}
                          className="w-full px-3 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-bold text-xs transition shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
                        >
                          {updating === selectedRouteData.id ? (
                            <><span className="animate-spin">⏳</span>იტვირთება...</>
                          ) : (
                            <><span>✅</span>მიწოდებული</>
                          )}
                        </button>
                      )}

                      {selectedRouteData.status === 'delivered' && (
                        <div className="w-full px-3 py-2.5 bg-green-50 border-2 border-green-300 text-green-700 rounded-xl font-bold text-xs text-center">
                          ✅ დასრულებულია
                        </div>
                      )}
                    </div>

                    {/* Timeline */}
                    <div className="space-y-1.5">
                      <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">⏱️ Timeline</h4>
                      <div className="space-y-1">
                        {[
                          { time: new Date(selectedRouteData.createdAt).toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' }), event: 'შეკვეთა შეიქმნა', status: 'completed' as const },
                          { time: selectedRouteData.assignedAt ? new Date(selectedRouteData.assignedAt).toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' }) : '-', event: 'მანქანას მიემატა', status: selectedRouteData.assignedAt ? 'completed' : 'pending' as const },
                          { time: selectedRouteData.driverConfirmedAt ? new Date(selectedRouteData.driverConfirmedAt).toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' }) : '-', event: 'მძღოლმა დაადასტურა', status: selectedRouteData.driverConfirmedAt ? 'completed' : 'pending' as const },
                          { time: selectedRouteData.enRouteAt ? new Date(selectedRouteData.enRouteAt).toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' }) : '-', event: 'გზაში', status: selectedRouteData.status === 'in_transit' ? 'current' : selectedRouteData.status === 'delivered' ? 'completed' : 'pending' as const },
                          { time: selectedRouteData.deliveredAt ? new Date(selectedRouteData.deliveredAt).toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' }) : '-', event: 'მიწოდებული', status: selectedRouteData.status === 'delivered' ? 'completed' : 'pending' as const }
                        ].map((event, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-[11px]">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${
                              event.status === 'completed' ? 'bg-green-500' :
                              event.status === 'current' ? 'bg-blue-500 animate-pulse' :
                              'bg-slate-300'
                            }`}></div>
                            <span className={`font-mono w-10 shrink-0 ${
                              event.status === 'completed' ? 'text-slate-800' :
                              event.status === 'current' ? 'text-blue-600 font-bold' :
                              'text-slate-400'
                            }`}>{event.time}</span>
                            <span className={`truncate ${
                              event.status === 'completed' ? 'text-slate-600' :
                              event.status === 'current' ? 'text-blue-600 font-medium' :
                              'text-slate-400'
                            }`}>{event.event}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Panel - Map */}
            <div className="col-span-7 bg-white rounded-2xl shadow-md border border-slate-200/60 overflow-hidden">
              {routes.length > 0 ? (
                <RouteMap
                  locations={mapLocations}
                  routePaths={routePaths}
                  center={[42.0, 43.0]}
                  zoom={7}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🗺️</div>
                    <p className="font-medium text-slate-600">მარშრუტები არ არის</p>
                    <p className="text-sm mt-2">შექმენი შეკვეთა და მიუბმი მანქანას</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}