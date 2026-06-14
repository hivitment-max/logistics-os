'use client'

import { useState, useEffect } from 'react'
import RouteMap from './RouteMap'
import { supabase } from '@/lib/supabase/client'
import { getCityCoordinates, calculateDistance } from '@/lib/locations'

interface Route {
  id: string
  trackingCode: string
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
  status: 'pending' | 'in_transit' | 'delivered'
  driverResponse: 'pending' | 'accepted' | 'rejected'
  createdAt: string
  assignedAt: string | null
}

export default function RouteOptimizer() {
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRoutes()
  }, [])

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
        .in('status', ['assigned', 'in_transit', 'delivered'])
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedRoutes: Route[] = (orders || []).map((order: any) => {
        const fromCity = order.pickup_city || 'თბილისი'
        const toCity = order.delivery_city || 'ბათუმი'
        
        return {
          id: order.id,
          trackingCode: order.tracking_code || 'N/A',
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
          status: order.status === 'assigned' ? 'pending' : 
                  order.status === 'in_transit' ? 'in_transit' : 'delivered',
          driverResponse: order.driver_response || 'pending',
          createdAt: order.created_at,
          assignedAt: order.assigned_at || null
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

  // რუკის ლოკაციები
  const mapLocations = routes.map((route) => ({
    id: route.id,
    name: `${route.trackingCode} - ${route.plateNumber}`,
    address: `${route.from} → ${route.to}`,
    lat: route.fromCoords.lat,
    lng: route.fromCoords.lng,
    type: 'stop' as const,
    status: route.status === 'in_transit' ? 'in_transit' : 
            route.status === 'delivered' ? 'completed' : 'pending',
    time: route.distance + ' კმ',
    routeId: route.id
  }))

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🚛</div>
          <p className="text-slate-600 font-medium">მარშრუტები იტვირთება...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.history.back()}
              className="p-2 hover:bg-white/50 rounded-lg transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">️ მარშრუტების ოპტიმიზაცია</h1>
              <p className="text-sm text-slate-500 mt-1">
                აქტიური მარშრუტები: {routes.filter(r => r.status === 'in_transit' || r.status === 'pending').length}
              </p>
            </div>
          </div>
          <button 
            onClick={loadRoutes}
            className="p-2 hover:bg-white/50 rounded-lg transition"
            title="განახლება"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Panel */}
          <div className="col-span-5 space-y-4">
            {/* Routes List */}
            <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-white/50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-700">აქტიური მარშრუტები</h2>
                  <p className="text-xs text-slate-500 mt-1"> სულ: {routes.length}</p>
                </div>
              </div>

              {/* Filters */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition ${
                    filter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  ყველა
                </button>
                <button
                  onClick={() => setFilter('active')}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition ${
                    filter === 'active' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  აქტიური
                </button>
                <button
                  onClick={() => setFilter('completed')}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition ${
                    filter === 'completed' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  დასრულებული
                </button>
              </div>

              {/* Routes */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredRoutes.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <div className="text-4xl mb-2">📭</div>
                    <p className="text-sm">მარშრუტები არ არის</p>
                  </div>
                ) : (
                  filteredRoutes.map((route) => (
                    <div
                      key={route.id}
                      onClick={() => setSelectedRoute(route.id)}
                      className={`p-3 rounded-xl border transition cursor-pointer ${
                        selectedRoute === route.id
                          ? 'bg-yellow-50 border-yellow-300 shadow-md'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-lg"></span>
                          <div>
                            <p className="text-sm font-bold text-slate-800">
                              {route.plateNumber}
                            </p>
                            <p className="text-xs text-slate-500">
                              {route.from} → {route.to}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              👨‍✈️ {route.driverName} · ⚖️ {route.weight} კგ
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-2 py-1 rounded text-[10px] font-medium ${
                            route.status === 'in_transit' ? 'bg-blue-100 text-blue-700' :
                            route.status === 'delivered' ? 'bg-green-100 text-green-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {route.status === 'in_transit' ? '🚚 გზაში' :
                             route.status === 'delivered' ? '✅ მიწოდებული' :
                             '⏳ ლოდინში'}
                          </span>
                          <p className="text-[10px] text-slate-500 mt-1">
                            📍 {route.distance} კმ
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Route Details */}
            {selectedRouteData && (
              <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-white/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-800">
                    {selectedRouteData.from} → {selectedRouteData.to}
                  </h3>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-700">{selectedRouteData.distance} კმ</p>
                    <p className="text-xs text-slate-500">{selectedRouteData.plateNumber}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-600">
                      <span className="font-semibold">📦 შეკვეთა:</span> {selectedRouteData.trackingCode}
                    </p>
                    <p className="text-xs text-slate-600">
                      <span className="font-semibold">👨‍✈️ მძღოლი:</span> {selectedRouteData.driverName}
                    </p>
                    <p className="text-xs text-slate-600">
                      <span className="font-semibold">📞 ტელეფონი:</span> {selectedRouteData.driverPhone}
                    </p>
                    <p className="text-xs text-slate-600">
                      <span className="font-semibold">⚖️ წონა:</span> {selectedRouteData.weight} კგ
                    </p>
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">მარშრუტის სტატუსი</h4>
                  {[
                    { time: new Date(selectedRouteData.createdAt).toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' }), event: 'შეკვეთა შეიქმნა', status: 'completed' as const },
                    { time: selectedRouteData.assignedAt ? new Date(selectedRouteData.assignedAt).toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' }) : '-', event: 'მანქანას მიემატა', status: selectedRouteData.assignedAt ? 'completed' : 'pending' as const },
                    { time: '-', event: 'მძღოლმა დაადასტურა', status: selectedRouteData.driverResponse === 'accepted' ? 'completed' : 'pending' as const },
                    { time: '-', event: 'გზაში', status: selectedRouteData.status === 'in_transit' ? 'current' : 'pending' as const },
                    { time: '-', event: 'მიწოდებული', status: selectedRouteData.status === 'delivered' ? 'completed' : 'pending' as const }
                  ].map((event, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-2 h-2 rounded-full ${
                          event.status === 'completed' ? 'bg-green-500' :
                          event.status === 'current' ? 'bg-blue-500 animate-pulse' :
                          'bg-slate-300'
                        }`}></div>
                        {idx < 4 && (
                          <div className="w-0.5 h-8 bg-slate-200 mt-1"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          event.status === 'completed' ? 'text-slate-800' :
                          event.status === 'current' ? 'text-blue-600 font-bold' :
                          'text-slate-500'
                        }`}>
                          {event.time}
                        </p>
                        <p className={`text-xs ${
                          event.status === 'completed' ? 'text-slate-600' :
                          event.status === 'current' ? 'text-blue-600' :
                          'text-slate-400'
                        }`}>
                          {event.event}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-white/50">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">აქტიური</h3>
                <p className="text-3xl font-bold text-blue-600">
                  {routes.filter(r => r.status === 'in_transit').length}
                </p>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-white/50">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">ლოდინში</h3>
                <p className="text-3xl font-bold text-yellow-600">
                  {routes.filter(r => r.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          {/* Right Panel - Map */}
          <div className="col-span-7">
            <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-white/50 overflow-hidden h-[800px]">
              {routes.length > 0 ? (
                <RouteMap
                  locations={mapLocations}
                  center={[42.0, 43.0]}
                  zoom={7}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500">
                  <div className="text-center">
                    <div className="text-6xl mb-4">️</div>
                    <p className="font-medium">მარშრუტები არ არის</p>
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