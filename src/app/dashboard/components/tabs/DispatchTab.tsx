'use client'

import { useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'

// ✅ განახლებული: დამატებულია vehiclePlateNumber პარამეტრი
interface DispatchTabProps {
  orders: any[]
  drivers: any[]
  vehicles: any[]
  onAssign: (
    orderId: string, 
    driverId: string | null, 
    vehicleId: string | null, 
    pickupDate?: string | null,
    vehiclePlateNumber?: string | null  // ✅ ახალი პარამეტრი: მანქანის ნომერი
  ) => Promise<void>
  onUnassign?: (orderId: string) => Promise<void>
  onViewOrder: (order: any) => void
  getStatusColor: (status: string) => string
}

export default function DispatchTab({ 
  orders, 
  drivers, 
  vehicles, 
  onAssign, 
  onUnassign,
  onViewOrder,
  getStatusColor 
}: DispatchTabProps) {
  
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [pendingDriverId, setPendingDriverId] = useState<string | null>(null)
  const [pendingVehicleId, setPendingVehicleId] = useState<string | null>(null)
  const [driverType, setDriverType] = useState<'internal' | 'external'>('internal')
  const [vehicleType, setVehicleType] = useState<'internal' | 'external'>('internal')
  const [pendingExternalDriverId, setPendingExternalDriverId] = useState<string | null>(null)
  const [pendingExternalVehicleId, setPendingExternalVehicleId] = useState<string | null>(null)
  const [assigning, setAssigning] = useState(false)
  const [validationMsg, setValidationMsg] = useState<string | null>(null)

  // 🔍 ფილტრი: მხოლოდ 'pending', 'new', 'assigned' შეკვეთები
  const pendingOrders = useMemo(() => 
    orders.filter(o => ['pending', 'new', 'assigned'].includes(o.status)), 
  [orders])
  
  // 🧮 ტრანსპორტის დატვირთვის გამოთვლა
  const getVehicleLoad = (vehicleId: string) => {
    const assignedOrders = orders.filter(o => 
      (o.vehicle_id === vehicleId || o.external_vehicle_id === vehicleId) && 
      ['dispatched', 'in_transit', 'assigned'].includes(o.status)
    );
    const weight = assignedOrders.reduce((sum, o) => sum + (parseFloat(o.cargo_weight_kg) || 0), 0);
    const volume = assignedOrders.reduce((sum, o) => sum + (parseFloat(o.cargo_volume_m3) || 0), 0);
    return { weight, volume, assignedOrders };
  }

  // ✅ ✅ ✅ ახალი: შემოწმება არის თუ არა რესურსი დაკავებული
  const isVehicleBusy = (vehicleId: string) => {
    return orders.some(o => 
      o.vehicle_id === vehicleId && 
      ['assigned', 'in_transit', 'dispatched'].includes(o.status)
    );
  };

  const isDriverBusy = (driverId: string) => {
    return orders.some(o => 
      o.driver_id === driverId && 
      ['assigned', 'in_transit', 'dispatched'].includes(o.status)
    );
  };

  // ✅ მანქანის არჩევის ლოგიკა + ვალიდაცია
  const handleVehicleSelect = (vehicleId: string, isExternal: boolean = false) => {
    if (!selectedOrder) {
      setValidationMsg('⚠️ ჯერ აუცილებელია შეკვეთის არჩევა')
      setTimeout(() => setValidationMsg(null), 3000)
      return
    }

    const vehicle = isExternal 
      ? { ...vehicles.find(v => v.id === vehicleId), is_external: true }
      : vehicles.find(v => v.id === vehicleId)

    if (vehicle && selectedOrder) {
      // აღჭურვილობის ვალიდაცია
      if (selectedOrder.needs_tail_lift && !vehicle.has_tail_lift) {
        setValidationMsg('⚠️ ამ მანქანას არ აქვს ლიფტი')
        setTimeout(() => setValidationMsg(null), 3000)
        return
      }
      if (selectedOrder.needs_straps && (vehicle.straps_count || 0) < 4) {
        setValidationMsg('⚠️ არასაკმარისი ღვედები')
        setTimeout(() => setValidationMsg(null), 3000)
        return
      }
      if (selectedOrder.is_dangerous && !vehicle.adr_capable) {
        setValidationMsg('⚠️ არ შეესაბამება ADR მოთხოვნებს')
        setTimeout(() => setValidationMsg(null), 3000)
        return
      }
      if (selectedOrder.body_type === 'refrigerated' && vehicle.body_type !== 'refrigerated') {
        setValidationMsg('⚠️ საჭიროა მაცივრიანი მანქანა')
        setTimeout(() => setValidationMsg(null), 3000)
        return
      }
    }

    if (isExternal) {
      setPendingExternalVehicleId(vehicleId)
      setPendingVehicleId(null)
      setVehicleType('external')
    } else {
      setPendingVehicleId(vehicleId)
      setPendingExternalVehicleId(null)
      setVehicleType('internal')
    }
  }

  // ✅ მძღოლის არჩევის ლოგიკა + ADR ვალიდაცია
  const handleDriverSelect = (driverId: string, isExternal: boolean = false) => {
    if (!selectedOrder) {
      setValidationMsg('⚠️ ჯერ აუცილებელია შეკვეთის არჩევა')
      setTimeout(() => setValidationMsg(null), 3000)
      return
    }

    const driver = isExternal 
      ? { ...drivers.find(d => d.id === driverId), is_external: true }
      : drivers.find(d => d.id === driverId)

    if (driver && selectedOrder?.is_dangerous && !driver.has_adr) {
      setValidationMsg('⚠️ მძღოლს არ აქვს ADR სერტიფიკატი')
      setTimeout(() => setValidationMsg(null), 3000)
      return
    }

    if (isExternal) {
      setPendingExternalDriverId(driverId)
      setPendingDriverId(null)
      setDriverType('external')
    } else {
      setPendingDriverId(driverId)
      setPendingExternalDriverId(null)
      setDriverType('internal')
    }
  }

  // 🧠 ჭკვიანი ფილტრი: ტევადობა + აღჭურვილობა + ტიპი
  const displayVehicles = useMemo(() => {
    if (!selectedOrder) return vehicles.filter(v => ['active', 'idle'].includes(v.status))
    
    const orderWeight = parseFloat(selectedOrder.cargo_weight_kg) || 0
    const orderVolume = parseFloat(selectedOrder.cargo_volume_m3) || 0

    return vehicles.filter(v => {
      if (!['active', 'idle'].includes(v.status)) return false
      
      const load = getVehicleLoad(v.id)
      const capWeight = parseFloat(v.capacity_kg) || 0
      const capVol = parseFloat(v.volume_m3) || 0

      // ტევადობა
      if (capWeight > 0 && load.weight + orderWeight > capWeight) return false
      if (capVol > 0 && load.volume + orderVolume > capVol) return false
      
      // აღჭურვილობა
      if (selectedOrder.needs_tail_lift && !v.has_tail_lift) return false
      if (selectedOrder.needs_straps && (v.straps_count || 0) < 4) return false
      if (selectedOrder.is_dangerous && !v.adr_capable) return false
      
      // ძარის ტიპი
      if (selectedOrder.body_type === 'refrigerated' && v.body_type !== 'refrigerated') return false
      if (selectedOrder.body_type === 'tent' && !['tent', 'refrigerated'].includes(v.body_type)) return false
      
      return true
    })
  }, [vehicles, selectedOrder, orders])

  // 🧠 მძღოლების ფილტრი: ADR და ხელმისაწვდომობა
  const displayDrivers = useMemo(() => {
    if (!selectedOrder) return drivers.filter(d => d.is_available && !d.current_order_id)
    
    return drivers.filter(d => {
      if (!d.is_available || d.current_order_id) return false
      if (selectedOrder.is_dangerous && !d.has_adr) return false
      return true
    })
  }, [drivers, selectedOrder])

  // 🧠 გარე მძღოლების/მანქანების ფილტრი (სულ მარტივი - ყველა აქტიური)
  const externalDrivers = useMemo(() => 
    drivers.filter(d => d.employment_type === 'external' || d.is_external), 
  [drivers])
  
  const externalVehicles = useMemo(() => 
    vehicles.filter(v => v.owner_type === 'contractor' || v.is_external), 
  [vehicles])

  // 📊 დატვირთვის პროგრეს-ბარი
  const CapacityBar = ({ current, max, unit }: { current: number, max: number, unit: string }) => {
    if (max === 0) return null
    const percent = Math.min((current / max) * 100, 100)
    const color = percent < 50 ? 'bg-green-500' : percent < 85 ? 'bg-yellow-500' : 'bg-red-500'
    const remaining = max - current
    
    return (
      <div className="w-full mt-2">
        <div className="flex justify-between text-[9px] text-gray-400 mb-0.5">
          <span>ტევადობა</span>
          <span>{remaining.toFixed(0)} {unit} თავისუფალი</span>
        </div>
        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div className={`h-full ${color} transition-all duration-500 ease-out`} style={{ width: `${percent}%` }} />
        </div>
      </div>
    )
  }

  // ✅ ✅ ✅ ახალი: ჭკვიანი ლოგიკა მანქანის ნომრის მისაღებად
  const getVehiclePlateNumber = (vehicleId: string | null, isExternal: boolean): string | null => {
    if (!vehicleId) return null
    
    const source = isExternal ? externalVehicles : vehicles
    const vehicle = source.find(v => v.id === vehicleId)
    
    return vehicle?.plate_number || null
  }

  // ✅ დადასტურების ლოგიკა - განახლებული vehiclePlateNumber-ით
  const handleConfirmAssign = async () => {
    if (!selectedOrder) return
    
    // განვსაზღვროთ რომელი ID გამოვიყენოთ
    const finalDriverId = driverType === 'internal' ? pendingDriverId : pendingExternalDriverId
    const finalVehicleId = vehicleType === 'internal' ? pendingVehicleId : pendingExternalVehicleId
    const isVehicleExternal = vehicleType === 'external'
    
    if (!finalDriverId && !finalVehicleId) {
      setValidationMsg('⚠️ აუცილებელია მძღოლის ან/და მანქანის არჩევა')
      setTimeout(() => setValidationMsg(null), 3000)
      return
    }

    // ✅ ვიღებთ მანქანის ნომერს (თუ მანქანაა არჩეული)
    const vehiclePlateNumber = finalVehicleId 
      ? getVehiclePlateNumber(finalVehicleId, isVehicleExternal)
      : null

    setValidationMsg(null)
    setAssigning(true)
    
    try {
      const pickupDate = selectedOrder.scheduled_pickup_date?.split('T')[0] || null
      
      // ✅ გავუგზავნოთ მანქანის ნომერი მშობელ კომპონენტს (5-ე პარამეტრი)
      await onAssign(selectedOrder.id, finalDriverId, finalVehicleId, pickupDate, vehiclePlateNumber)
      
      // რესეტი
      setSelectedOrder(null)
      setPendingDriverId(null)
      setPendingVehicleId(null)
      setPendingExternalDriverId(null)
      setPendingExternalVehicleId(null)
    } catch (error) {
      console.error('Assignment failed:', error)
      setValidationMsg('❌ შეცდომა მინიჭებისას')
      setTimeout(() => setValidationMsg(null), 3000)
    } finally {
      setAssigning(false)
    }
  }

  // ❌ მინიჭების მოხსნა - ✅ განახლებული: ასუფთავებს მძღოლის პასუხის ველებს
  const handleUnassignClick = async () => {
    if (!selectedOrder || !onUnassign) return
    if (!confirm(`დარწმუნებული ხართ რომ გინდათ მინიჭების მოხსნა შეკვეთიდან ${selectedOrder.tracking_code}?`)) return
    
    try {
      // 1️⃣ ჯერ გამოვიძახოთ მშობლის onUnassign (თუ არსებობს)
      await onUnassign(selectedOrder.id)
      
      // 2️⃣ ✅ ✅ ✅ ახალი: გავასუფთავოთ მძღოლის პასუხის ველები ბაზაში
      // ეს აუცილებელია რომ "მძღოლის პასუხი" სვეტი გასუფთავდეს OrdersTab-ში
      await supabase.from('orders').update({
        driver_response: null,              // ✅ წავშალოთ პასუხი (accepted/rejected)
        driver_confirmed_at: null,          // ✅ წავშალოთ დადასტურების დრო
        driver_rejected_at: null,           // ✅ წავშალოთ უარყოფის დრო
        driver_confirmed_via: null,         // ✅ ოფციონალური: წყარო
        updated_at: new Date().toISOString()
      }).eq('id', selectedOrder.id)
      
      console.log(`✅ [UNASSIGN] Cleared driver response for order ${selectedOrder.id}`)
      
      // 3️⃣ რესეტი ლოკალურ სტეიტში
      setSelectedOrder(null)
      setPendingDriverId(null)
      setPendingVehicleId(null)
      setPendingExternalDriverId(null)
      setPendingExternalVehicleId(null)
      
    } catch (error) {
      console.error('❌ Unassign failed:', error)
      setValidationMsg('❌ შეცდომა მოხსნისას')
      setTimeout(() => setValidationMsg(null), 3000)
    }
  }

  // 🎨 კოლონის ჰედერი
  const ColumnHeader = ({ title, icon, color }: { title: string, icon: string, color: string }) => (
    <div className={`px-4 py-3 border-b border-white/5 backdrop-blur-md bg-gradient-to-r ${color} flex items-center gap-2`}>
      <span className="text-lg filter drop-shadow-md">{icon}</span>
      <h3 className="text-xs font-bold uppercase tracking-wider text-white/90">{title}</h3>
    </div>
  )

  // 🎨 ბარათის სტილი
  const CardBase = `
    flex flex-col h-[calc(100vh-180px)] 
    bg-gray-800/60 border border-white/5 rounded-2xl overflow-hidden
    shadow-[0_8px_30px_rgb(0,0,0,0.4)] backdrop-blur-sm
    hover:shadow-[0_12px_40px_rgb(0,0,0,0.5)] hover:border-white/10
    transition-all duration-300 ease-out
  `

  // ✅ ✅ ✅ ახალი: ლამაზი, პრემიუმ ბეჯი თემატური იკონებით
  const BusyBadge = ({ isBusy, type }: { isBusy: boolean, type: 'vehicle' | 'driver' }) => {
    if (!isBusy) return null;
    
    // კონფიგურაცია: თემატური იკონები + ტექსტები
    const config = type === 'vehicle' 
      ? { 
          icon: '🛣️', 
          tooltip: 'ეს მანქანა უკვე გზაშია აქტიური შეკვეთით', 
          label: 'გზაში',
          gradient: 'from-emerald-600 to-teal-600',
          hoverGradient: 'hover:from-emerald-500 hover:to-teal-500'
        }
      : { 
          icon: '🧭', 
          tooltip: 'ეს მძღოლი უკვე რეისშია და ვერ მიიღებს ახალ შეკვეთას', 
          label: 'რეისში',
          gradient: 'from-emerald-600 to-teal-600',
          hoverGradient: 'hover:from-emerald-500 hover:to-teal-500'
        };
    
    return (
      <div className="group relative">
        {/* ✅ ლამაზი, ამოწეული ბეჯი: მწვანე კანტი + გრადიენტი + 3D ეფექტი */}
        <div className={`
          w-7 h-7 rounded-full 
          bg-gradient-to-br ${config.gradient} ${config.hoverGradient}
          border-2 border-emerald-400/80
          text-white flex items-center justify-center text-sm
          shadow-[0_4px_0_rgb(6,78,59),0_6px_12px_rgba(0,0,0,0.3)]
          hover:shadow-[0_2px_0_rgb(6,78,59),0_4px_8px_rgba(0,0,0,0.3)]
          hover:-translate-y-0.5
          active:shadow-[0_0_0_rgb(6,78,59),0_0_0_rgba(0,0,0,0)]
          active:translate-y-1
          cursor-help
          transition-all duration-150 ease-out
          backdrop-blur-sm
        `}>
          {config.icon}
        </div>
        
        {/* ✅ ტულტიპი: ჩნდება Hover-ზე, ლამაზი დიზაინით */}
        <div className="absolute top-full right-0 mt-2 w-52 p-3 bg-gray-900/95 border border-emerald-500/30 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{config.icon}</span>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">{config.label}</span>
          </div>
          <p className="text-[10px] text-gray-300 leading-relaxed">{config.tooltip}</p>
          {/* ✅ დეკორატიული ისარი ზემოთ */}
          <div className="absolute -top-1.5 right-3 w-3 h-3 bg-gray-900/95 border-t border-l border-emerald-500/30 transform rotate-45"></div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 p-1 relative">
      
      {/* ✅ ვალიდაციის შეტყობინება */}
      {validationMsg && (
        <div className="fixed top-4 right-4 z-50 bg-red-500/90 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-bounce">
          <span className="text-lg">⚠️</span>
          <span className="text-sm font-medium">{validationMsg}</span>
        </div>
      )}

      {/* 🟡 სვეტი 1: შემოსული შეკვეთები */}
      <div className={CardBase}>
        <ColumnHeader title="შემოსული შეკვეთები" icon="📦" color="from-yellow-600/20 to-yellow-800/5" />
        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
          {pendingOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center">
              <span className="text-3xl mb-2 opacity-50">📦</span>
              <p className="text-xs">ახალი შეკვეთები არ არის</p>
            </div>
          ) : pendingOrders.map(order => (
            <button
              key={order.id}
              onClick={() => {
                setSelectedOrder((prev: any) => prev?.id === order.id ? null : order)
                setPendingDriverId(null)
                setPendingVehicleId(null)
                setPendingExternalDriverId(null)
                setPendingExternalVehicleId(null)
                setValidationMsg(null)
              }}
              className={`w-full text-left p-3 rounded-xl border transition-all duration-200 group relative overflow-hidden
                ${selectedOrder?.id === order.id 
                  ? 'bg-yellow-500/10 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.15)] ring-1 ring-yellow-500/30' 
                  : 'bg-gray-900/40 border-gray-700/50 hover:border-yellow-500/30 hover:bg-gray-800/60'
                }`}
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${selectedOrder?.id === order.id ? 'bg-yellow-500' : 'bg-transparent'}`}></div>
              <div className="flex justify-between items-start mb-2 pl-2">
                <div>
                  <span className="text-xs font-bold text-white font-mono">{order.tracking_code}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-md ml-2 ${getStatusColor(order.status)}`}>
                    {order.status === 'pending' ? 'ლოდინში' : order.status === 'assigned' ? 'მინიჭებული' : 'ახალი'}
                  </span>
                </div>
              </div>
              <div className="pl-2 mb-2">
                <div className="flex items-center gap-1.5 text-[10px] text-gray-300">
                  <span className="text-green-400 font-bold text-xs">📍</span>
                  <span className="truncate font-medium">{order.pickup_city || 'თბილისი'}</span>
                  <span className="text-gray-500">→</span>
                  <span className="truncate font-medium">{order.delivery_city || 'ბათუმი'}</span>
                </div>
              </div>
              <div className="pl-2 pt-2 border-t border-white/5 flex items-center justify-between text-[9px] text-gray-400 mb-2">
                <div className="flex gap-2">
                  <span>⚖️ <span className="text-white">{order.cargo_weight_kg || 0}</span> კგ</span>
                  <span>📐 <span className="text-white">{order.cargo_volume_m3 || 0}</span> m³</span>
                </div>
                <span className="text-yellow-400 font-bold">{order.price} ₾</span>
              </div>
              <div className="pl-2 flex flex-wrap gap-1.5">
                {order.is_dangerous && <span className="text-[9px] px-1.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded">⚠️ ADR</span>}
                {order.body_type === 'refrigerated' && <span className="text-[9px] px-1.5 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded">❄️ მაცივარი</span>}
                {order.needs_tail_lift && <span className="text-[9px] px-1.5 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded">🔽 ლიფტი</span>}
                {order.needs_straps && <span className="text-[9px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded">🔗 ღვედები</span>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 🚛 სვეტი 2: ხელმისაწვდომი ტრანსპორტი */}
      <div className={CardBase}>
        <ColumnHeader title="ხელმისაწვდომი ტრანსპორტი" icon="🚛" color="from-indigo-600/20 to-indigo-800/5" />
        
        {/* ტაბები: შიდა / გარე */}
        <div className="px-3 py-2 border-b border-white/5 flex gap-1 bg-gray-900/30">
          <button 
            onClick={() => setVehicleType('internal')}
            className={`flex-1 py-1.5 rounded text-[9px] font-bold transition ${vehicleType === 'internal' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
          >
            🏢 შიდა
          </button>
          <button 
            onClick={() => setVehicleType('external')}
            className={`flex-1 py-1.5 rounded text-[9px] font-bold transition ${vehicleType === 'external' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
          >
            🤝 გარე
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
          {vehicleType === 'internal' ? (
            // შიდა მანქანები
            displayVehicles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center">
                <span className="text-3xl mb-2 opacity-50">🚛</span>
                <p className="text-xs">{selectedOrder ? 'შესაფერისი მანქანა არ არის' : 'თავისუფალი ტრანსპორტი არ არის'}</p>
              </div>
            ) : displayVehicles.map(vehicle => {
              const load = getVehicleLoad(vehicle.id)
              const capWeight = parseFloat(vehicle.capacity_kg) || 0
              const capVol = parseFloat(vehicle.volume_m3) || 0
              const typeIcon = vehicle.type === 'truck' ? '🚛' : vehicle.type === 'van' ? '🚐' : '🚗'
              const busy = isVehicleBusy(vehicle.id)

              return (
                <button
                  key={vehicle.id}
                  onClick={() => handleVehicleSelect(vehicle.id, false)}
                  className={`w-full p-3 rounded-xl border transition-all duration-200 text-left relative
                    ${busy ? 'opacity-80' : ''}
                    ${pendingVehicleId === vehicle.id 
                      ? 'bg-indigo-500/10 border-indigo-500/50 ring-1 ring-indigo-500/30' 
                      : 'bg-gray-900/40 border-gray-700/50 hover:border-indigo-500/30'
                    }`}
                >
                  {/* ✅ ბეჯი მარჯვენა ზედა კუთხეში */}
                  <div className="absolute top-3 right-3 z-10">
                    <BusyBadge isBusy={busy} type="vehicle" />
                  </div>

                  <div className="flex justify-between items-start gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg leading-none shrink-0">{typeIcon}</span>
                      <p className="text-xs text-white font-bold font-mono truncate">{vehicle.plate_number}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 truncate pl-6">{vehicle.model || 'მოდელი'}</p>
                  {(capWeight > 0 || capVol > 0) && (
                    <div className="mt-2 space-y-1">
                      <CapacityBar current={load.weight} max={capWeight} unit="კგ" />
                      <CapacityBar current={load.volume} max={capVol} unit="m³" />
                    </div>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1 pl-6">
                    {vehicle.has_tail_lift && <span className="text-[8px] px-1 py-0.5 bg-purple-500/10 text-purple-400 rounded">🔽</span>}
                    {(vehicle.straps_count || 0) >= 4 && <span className="text-[8px] px-1 py-0.5 bg-blue-500/10 text-blue-400 rounded">🔗</span>}
                    {vehicle.adr_capable && <span className="text-[8px] px-1 py-0.5 bg-red-500/10 text-red-400 rounded">⚠️</span>}
                  </div>
                </button>
              )
            })
          ) : (
            // გარე მანქანები
            externalVehicles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center">
                <span className="text-3xl mb-2 opacity-50">🚛</span>
                <p className="text-xs">გარე მანქანები არ არის</p>
              </div>
            ) : externalVehicles.map(vehicle => {
              const busy = isVehicleBusy(vehicle.id)
              return (
                <button
                  key={vehicle.id}
                  onClick={() => handleVehicleSelect(vehicle.id, true)}
                  className={`w-full p-3 rounded-xl border transition-all duration-200 text-left relative
                    ${busy ? 'opacity-80' : ''}
                    ${pendingExternalVehicleId === vehicle.id 
                      ? 'bg-orange-500/10 border-orange-500/50 ring-1 ring-orange-500/30' 
                      : 'bg-gray-900/40 border-gray-700/50 hover:border-orange-500/30'
                    }`}
                >
                  {/* ✅ ბეჯი მარჯვენა ზედა კუთხეში */}
                  <div className="absolute top-3 right-3 z-10">
                    <BusyBadge isBusy={busy} type="vehicle" />
                  </div>

                  <div className="flex justify-between items-start gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg leading-none shrink-0">🚛</span>
                      <p className="text-xs text-white font-bold font-mono truncate">{vehicle.plate_number}</p>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded">გარე</span>
                  </div>
                  <p className="text-[10px] text-gray-400 truncate pl-6">{vehicle.model || 'მოდელი'}</p>
                  <p className="text-[9px] text-orange-400 pl-6 mt-1">💰 {vehicle.rate_per_km || 0} ₾/კმ</p>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* 👨‍✈️ სვეტი 3: ხელმისაწვდომი მძღოლები */}
      <div className={CardBase}>
        <ColumnHeader title="ხელმისაწვდომი მძღოლები" icon="👨‍✈️" color="from-blue-600/20 to-blue-800/5" />
        
        {/* ტაბები: შიდა / გარე */}
        <div className="px-3 py-2 border-b border-white/5 flex gap-1 bg-gray-900/30">
          <button 
            onClick={() => setDriverType('internal')}
            className={`flex-1 py-1.5 rounded text-[9px] font-bold transition ${driverType === 'internal' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
          >
            🏢 შიდა
          </button>
          <button 
            onClick={() => setDriverType('external')}
            className={`flex-1 py-1.5 rounded text-[9px] font-bold transition ${driverType === 'external' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
          >
            🤝 გარე
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
          {driverType === 'internal' ? (
            // შიდა მძღოლები
            displayDrivers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center">
                <span className="text-3xl mb-2 opacity-50">👨‍✈️</span>
                <p className="text-xs">{selectedOrder?.is_dangerous ? 'ADR მძღოლი არ არის' : 'თავისუფალი მძღოლი არ არის'}</p>
              </div>
            ) : displayDrivers.map(driver => {
              const busy = isDriverBusy(driver.id)
              return (
                <button
                  key={driver.id}
                  onClick={() => handleDriverSelect(driver.id, false)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-200 text-left relative
                    ${busy ? 'opacity-80' : ''}
                    ${pendingDriverId === driver.id 
                      ? 'bg-blue-500/10 border-blue-500/50 ring-1 ring-blue-500/30' 
                      : 'bg-gray-900/40 border-gray-700/50 hover:border-blue-500/30'
                    }`}
                >
                  {/* ✅ ბეჯი მარჯვენა ზედა კუთხეში */}
                  <div className="absolute top-2 right-3 z-10">
                    <BusyBadge isBusy={busy} type="driver" />
                  </div>

                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-sm font-bold text-white shadow-md shrink-0">
                    {driver.full_name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-xs text-white font-medium truncate">{driver.full_name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {driver.has_adr && <span className="text-[9px] px-1.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded">⚠️ ADR</span>}
                    </div>
                  </div>
                  {pendingDriverId === driver.id && <span className="text-blue-400 text-lg">✓</span>}
                </button>
              )
            })
          ) : (
            // გარე მძღოლები
            externalDrivers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center">
                <span className="text-3xl mb-2 opacity-50">👨‍✈️</span>
                <p className="text-xs">გარე მძღოლები არ არის</p>
              </div>
            ) : externalDrivers.map(driver => {
              const busy = isDriverBusy(driver.id)
              return (
                <button
                  key={driver.id}
                  onClick={() => handleDriverSelect(driver.id, true)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-200 text-left relative
                    ${busy ? 'opacity-80' : ''}
                    ${pendingExternalDriverId === driver.id 
                      ? 'bg-orange-500/10 border-orange-500/50 ring-1 ring-orange-500/30' 
                      : 'bg-gray-900/40 border-gray-700/50 hover:border-orange-500/30'
                    }`}
                >
                  {/* ✅ ბეჯი მარჯვენა ზედა კუთხეში */}
                  <div className="absolute top-2 right-3 z-10">
                    <BusyBadge isBusy={busy} type="driver" />
                  </div>

                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-yellow-400 flex items-center justify-center text-sm font-bold text-white shadow-md shrink-0">
                    {driver.full_name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-xs text-white font-medium truncate">{driver.full_name}</p>
                    <p className="text-[9px] text-orange-400">💰 {driver.rate_per_km || 0} ₾/კმ</p>
                  </div>
                  {driver.has_adr && <span className="text-[9px] px-1.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded">⚠️</span>}
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* 🔗 სვეტი 4: მინიჭების დადასტურება */}
      <div className={CardBase}>
        <ColumnHeader title="მინიჭების დადასტურება" icon="🔗" color="from-green-600/20 to-green-800/5" />
        <div className="flex-1 overflow-y-auto p-4 flex flex-col custom-scrollbar">
          {selectedOrder ? (
            <div className="flex flex-col h-full">
              {/* შეკვეთის ინფო */}
              <div className="p-3 bg-gray-900/60 rounded-xl border border-white/5 mb-4">
                <p className="text-[9px] text-gray-400 uppercase mb-1 tracking-wider">არჩეული შეკვეთა</p>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-white font-mono">{selectedOrder.tracking_code}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div className="space-y-1 text-[10px] text-gray-300">
                  <p className="truncate">📍 {selectedOrder.pickup_city || selectedOrder.pickup_address}</p>
                  <p className="truncate">🏁 {selectedOrder.delivery_city || selectedOrder.delivery_address}</p>
                </div>
                <div className="flex justify-between mt-2 pt-2 border-t border-white/5 text-xs">
                  <span className="text-gray-400">⚖️ {selectedOrder.cargo_weight_kg || 0} კგ</span>
                  <span className="text-gray-400">📐 {selectedOrder.cargo_volume_m3 || 0} m³</span>
                </div>
                <p className="text-sm font-bold text-green-400 mt-2">💰 {selectedOrder.price} {selectedOrder.currency}</p>
              </div>

              {/* არჩეული რესურსები */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between p-2.5 bg-gray-900/40 rounded-lg border border-white/5">
                  <span className="text-[10px] text-gray-400">👨‍✈️ მძღოლი</span>
                  <span className="text-xs text-white font-medium">
                    {driverType === 'internal' 
                      ? (pendingDriverId ? drivers.find(d => d.id === pendingDriverId)?.full_name : '—')
                      : (pendingExternalDriverId ? externalDrivers.find(d => d.id === pendingExternalDriverId)?.full_name : '—')
                    }
                    {driverType === 'external' && pendingExternalDriverId && <span className="text-[9px] text-orange-400 ml-1">(გარე)</span>}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-gray-900/40 rounded-lg border border-white/5">
                  <span className="text-[10px] text-gray-400">🚛 ტრანსპორტი</span>
                  <span className="text-xs text-white font-medium font-mono">
                    {vehicleType === 'internal' 
                      ? (pendingVehicleId ? vehicles.find(v => v.id === pendingVehicleId)?.plate_number : '—')
                      : (pendingExternalVehicleId ? externalVehicles.find(v => v.id === pendingExternalVehicleId)?.plate_number : '—')
                    }
                    {vehicleType === 'external' && pendingExternalVehicleId && <span className="text-[9px] text-orange-400 ml-1">(გარე)</span>}
                  </span>
                </div>
              </div>

              {/* ღილაკები */}
              <div className="mt-auto space-y-2">
                {selectedOrder.driver_id || selectedOrder.vehicle_id ? (
                  <button 
                    onClick={handleUnassignClick}
                    disabled={assigning}
                    className="w-full py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-xl text-xs font-medium transition"
                  >
                    ❌ მინიჭების მოხსნა
                  </button>
                ) : null}
                
                <button 
                  onClick={handleConfirmAssign} 
                  disabled={assigning || (!pendingDriverId && !pendingExternalDriverId && !pendingVehicleId && !pendingExternalVehicleId)} 
                  className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
                >
                  {assigning ? <><span className="animate-spin">⏳</span> მიმდინარეობს...</> : <>✅ მინიჭების დადასტურება</>}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500">
              <div className="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center mb-3 border border-white/5">
                <span className="text-2xl">👈</span>
              </div>
              <p className="text-sm font-medium text-gray-300">აირჩიე შეკვეთა</p>
              <p className="text-[10px] mt-1 max-w-[200px]">შეკვეთის არჩევისას სისტემა ავტომატურად დატოვებს შესაბამის რესურსებს</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}