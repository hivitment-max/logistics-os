'use client'
import { useState, useMemo } from 'react'

interface DispatchTabProps {
  orders: any[]
  drivers: any[]
  vehicles: any[]
  onAssign: (orderId: string, driverId: string | null, vehicleId: string | null) => Promise<void>
  onViewOrder: (order: any) => void
  getStatusColor: (status: string) => string
}

export default function DispatchTab({ 
  orders, 
  drivers, 
  vehicles, 
  onAssign, 
  onViewOrder,
  getStatusColor 
}: DispatchTabProps) {
  
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [pendingDriverId, setPendingDriverId] = useState<string | null>(null)
  const [pendingVehicleId, setPendingVehicleId] = useState<string | null>(null)
  const [assigning, setAssigning] = useState(false)
  const [capacityError, setCapacityError] = useState<string | null>(null)
  const [validationMsg, setValidationMsg] = useState<string | null>(null)

  // 🔍 ფილტრი: მხოლოდ 'pending' და 'new'
  const pendingOrders = useMemo(() => 
    orders.filter(o => o.status === 'pending' || o.status === 'new'), 
  [orders])
  
  // 🧮 ტრანსპორტის დატვირთვის გამოთვლა
  const getVehicleLoad = (vehicleId: string) => {
    const assignedOrders = orders.filter(o => 
      (o.vehicle_id === vehicleId || o.external_vehicle_id === vehicleId) && 
      ['dispatched', 'in_transit'].includes(o.status)
    );
    const weight = assignedOrders.reduce((sum, o) => sum + (parseFloat(o.cargo_weight_kg) || 0), 0);
    const volume = assignedOrders.reduce((sum, o) => sum + (parseFloat(o.cargo_volume_m3) || 0), 0);
    return { weight, volume, assignedOrders };
  }

  // ✅ მანქანის არჩევის ლოგიკა + ვალიდაცია + აღჭურვილობის შემოწმება
  const handleVehicleSelect = (vehicleId: string) => {
    if (!selectedOrder) {
      setValidationMsg('⚠️ ჯერ აუცილებელია შეკვეთის არჩევა "შემოსული შეკვეთები" განყოფილებიდან');
      setTimeout(() => setValidationMsg(null), 3000);
      return;
    }

    // ✅ აღჭურვილობის ვალიდაცია: თუ მანქანა არ აკმაყოფილებს მოთხოვნას
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle && selectedOrder) {
      if (selectedOrder.needs_tail_lift && !vehicle.has_tail_lift) {
        setValidationMsg('⚠️ ამ მანქანას არ აქვს ლიფტი, რომელიც შეკვეთას სჭირდება');
        setTimeout(() => setValidationMsg(null), 3000);
        return;
      }
      if (selectedOrder.needs_straps && (vehicle.straps_count || 0) < 4) {
        setValidationMsg('⚠️ ამ მანქანას არ აქვს საკმარისი ღვედები');
        setTimeout(() => setValidationMsg(null), 3000);
        return;
      }
      if (selectedOrder.is_dangerous && !vehicle.adr_capable) {
        setValidationMsg('⚠️ ამ მანქანას არ შეუძლია სახიფათო ტვირთის გადაზიდვა');
        setTimeout(() => setValidationMsg(null), 3000);
        return;
      }
      if (selectedOrder.body_type === 'refrigerated' && vehicle.body_type !== 'refrigerated') {
        setValidationMsg('⚠️ ამ შეკვეთას სჭირდება მაცივრიანი მანქანა');
        setTimeout(() => setValidationMsg(null), 3000);
        return;
      }
    }

    setPendingVehicleId(vehicleId);
    setCapacityError(null);

    const activeOrdersOnVehicle = orders.filter(o => 
      (o.vehicle_id === vehicleId || o.external_vehicle_id === vehicleId) && 
      ['dispatched', 'in_transit'].includes(o.status)
    );

    if (activeOrdersOnVehicle.length > 0) {
      const existingDriverId = activeOrdersOnVehicle[0].driver_id;
      if (existingDriverId) setPendingDriverId(existingDriverId);
    }
  }

  // ✅ მძღოლის არჩევის ლოგიკა + ვალიდაცია + ADR შემოწმება
  const handleDriverSelect = (driverId: string) => {
    if (!selectedOrder) {
      setValidationMsg('⚠️ ჯერ აუცილებელია შეკვეთის არჩევა "შემოსული შეკვეთები" განყოფილებიდან');
      setTimeout(() => setValidationMsg(null), 3000);
      return;
    }

    // ✅ ADR ვალიდაცია: თუ შეკვეთაა სახიფათო, მძღოლს უნდა ჰქონდეს ADR
    const driver = drivers.find(d => d.id === driverId);
    if (driver && selectedOrder?.is_dangerous && !driver.has_adr) {
      setValidationMsg('⚠️ ამ მძღოლს არ აქვს ADR სერტიფიკატი სახიფათო ტვირთისთვის');
      setTimeout(() => setValidationMsg(null), 3000);
      return;
    }

    setPendingDriverId(driverId);
  }

  // 🧠 ჭკვიანი ფილტრი: ტევადობა + აღჭურვილობა + ტიპი
  const displayVehicles = useMemo(() => {
    if (!selectedOrder) return vehicles.filter(v => v.status === 'active' || v.status === 'idle');
    
    const orderWeight = parseFloat(selectedOrder.cargo_weight_kg) || 0;
    const orderVolume = parseFloat(selectedOrder.cargo_volume_m3) || 0;

    return vehicles.filter(v => {
      if (v.status !== 'active' && v.status !== 'idle') return false;
      
      const load = getVehicleLoad(v.id);
      const capWeight = parseFloat(v.capacity_kg) || 0;
      const capVol = parseFloat(v.volume_m3) || 0;

      // 🔹 ტევადობა
      if (capWeight > 0 && load.weight + orderWeight > capWeight) return false;
      if (capVol > 0 && load.volume + orderVolume > capVol) return false;
      
      // 🔹 აღჭურვილობის შესაბამისობა
      if (selectedOrder.needs_tail_lift === true && v.has_tail_lift !== true) return false;
      if (selectedOrder.needs_straps === true && (v.straps_count || 0) < 4) return false;
      if (selectedOrder.is_dangerous === true && v.adr_capable !== true) return false;
      
      // 🔹 ძარის ტიპის შესაბამისობა
      if (selectedOrder.body_type && selectedOrder.body_type !== 'standard') {
        if (selectedOrder.body_type === 'refrigerated' && v.body_type !== 'refrigerated') return false;
        if (selectedOrder.body_type === 'tent' && v.body_type !== 'tent' && v.body_type !== 'refrigerated') return false;
        if (selectedOrder.body_type === 'container' && v.body_type !== 'container') return false;
        if (selectedOrder.body_type === 'flatbed' && v.body_type !== 'flatbed') return false;
        if (selectedOrder.body_type === 'bulk' && v.body_type !== 'bulk') return false;
      }
      
      return true;
    });
  }, [vehicles, selectedOrder, orders]);

  // 🧠 მძღოლების ჭკვიანი ფილტრი: ADR და სხვა კრიტერიუმები
  const displayDrivers = useMemo(() => {
    if (!selectedOrder) return drivers.filter(d => d.is_available && !d.current_order_id);
    
    return drivers.filter(d => {
      if (!d.is_available || d.current_order_id) return false;
      
      // 🔹 ADR ფილტრი
      if (selectedOrder.is_dangerous === true && d.has_adr !== true) return false;
      
      return true;
    });
  }, [drivers, selectedOrder]);

  // 📊 დატვირთვის პროგრეს-ბარი
  const CapacityBar = ({ current, max, unit }: { current: number, max: number, unit: string }) => {
    if (max === 0) return null;
    const percent = Math.min((current / max) * 100, 100);
    const color = percent < 50 ? 'bg-green-500' : percent < 85 ? 'bg-yellow-500' : 'bg-red-500';
    const remaining = max - current;
    
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
    );
  }

  // ✅ დადასტურების ლოგიკა
  const handleConfirmAssign = async () => {
    if (!selectedOrder || !pendingDriverId || !pendingVehicleId) return
    
    setCapacityError(null);
    setAssigning(true);
    try {
      await onAssign(selectedOrder.id, pendingDriverId, pendingVehicleId);
      setSelectedOrder(null);
      setPendingDriverId(null);
      setPendingVehicleId(null);
    } catch (error) {
      console.error('Assignment failed:', error);
    } finally {
      setAssigning(false);
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
    hover:-translate-y-0.5 hover:scale-[1.005]
  `

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
                setSelectedOrder((prev: any) => prev?.id === order.id ? null : order);
                setPendingDriverId(null);
                setPendingVehicleId(null);
                setCapacityError(null);
                setValidationMsg(null);
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
                    {order.status === 'pending' ? 'ლოდინში' : 'ახალი'}
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
                {order.is_dangerous === true && (
                  <span className="text-[9px] px-1.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded flex items-center gap-1">⚠️ სახიფათო</span>
                )}
                {order.body_type === 'refrigerated' && (
                  <span className="text-[9px] px-1.5 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded flex items-center gap-1">❄️ მაცივარი</span>
                )}
                {order.is_oversized === true && (
                  <span className="text-[9px] px-1.5 py-0.5 bg-orange-500/10 text-orange-400 border border-orange-500/30 rounded flex items-center gap-1">📏 გაბარიტი</span>
                )}
                {order.needs_tail_lift === true && (
                  <span className="text-[9px] px-1.5 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded flex items-center gap-1">🔽 ლიფტი</span>
                )}
                {order.needs_straps === true && (
                  <span className="text-[9px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded flex items-center gap-1">🔗 ღვედები</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 🚛 სვეტი 2: ხელმისაწვდომი ტრანსპორტი (ჭკვიანი ფილტრით) */}
      <div className={CardBase}>
        <ColumnHeader title="ხელმისაწვდომი ტრანსპორტი" icon="🚛" color="from-indigo-600/20 to-indigo-800/5" />
        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
          {displayVehicles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center">
              <span className="text-3xl mb-2 opacity-50">🚛</span>
              <p className="text-xs">
                {selectedOrder ? 'ამ ტვირთისთვის შესაფერისი მანქანა არ არის' : 'თავისუფალი ტრანსპორტი არ არის'}
              </p>
            </div>
          ) : displayVehicles.map(vehicle => {
            const isOwned = vehicle.owner_type === 'company' || !vehicle.owner_type;
            const load = getVehicleLoad(vehicle.id);
            const capWeight = parseFloat(vehicle.capacity_kg) || 0;
            const capVol = parseFloat(vehicle.volume_m3) || 0;
            const typeIcon = vehicle.type === 'truck' ? '🚛' : vehicle.type === 'van' ? '🚐' : '🚗';

            return (
              <button
                key={vehicle.id}
                onClick={() => handleVehicleSelect(vehicle.id)}
                className={`w-full p-3 rounded-xl border transition-all duration-200 text-left group
                  ${pendingVehicleId === vehicle.id 
                    ? 'bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/30' 
                    : 'bg-gray-900/40 border-gray-700/50 hover:border-indigo-500/30 hover:bg-gray-800/60'
                  }`}
              >
                <div className="flex justify-between items-start gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg leading-none shrink-0">{typeIcon}</span>
                    <p className="text-xs text-white font-bold font-mono truncate">{vehicle.plate_number}</p>
                  </div>
                  <div className="relative group/badge cursor-help shrink-0">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border shadow-sm transition-colors
                      ${isOwned ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-orange-500/10 border-orange-500/30 text-orange-400'}`}>
                      {isOwned ? '🏢' : '🤝'}
                    </div>
                    <div className="absolute right-0 top-7 w-max px-2 py-1 bg-gray-900 border border-gray-700 rounded text-[10px] text-white opacity-0 group-hover/badge:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                      {isOwned ? 'კომპანიის საკუთრება' : 'კონტრაქტით'}
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 truncate pl-6">{vehicle.model || 'მოდელი'}</p>
                {load.assignedOrders?.length > 0 && (
                  <div className="mt-1 text-[9px] text-indigo-400 font-bold flex items-center gap-1 pl-6">🔒 მიმდინარე რეისი ({load.assignedOrders.length})</div>
                )}
                {(capWeight > 0 || capVol > 0) && (
                  <div className="mt-2 space-y-1">
                    <CapacityBar current={load.weight} max={capWeight} unit="კგ" />
                    <CapacityBar current={load.volume} max={capVol} unit="m³" />
                  </div>
                )}
                {/* ✅ აღჭურვილობის ინდიკატორები */}
                <div className="mt-2 flex flex-wrap gap-1 pl-6">
                  {vehicle.has_tail_lift && <span className="text-[8px] px-1 py-0.5 bg-purple-500/10 text-purple-400 rounded">🔽</span>}
                  {(vehicle.straps_count || 0) >= 4 && <span className="text-[8px] px-1 py-0.5 bg-blue-500/10 text-blue-400 rounded">🔗</span>}
                  {vehicle.adr_capable && <span className="text-[8px] px-1 py-0.5 bg-red-500/10 text-red-400 rounded">⚠️</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 👨‍✈️ სვეტი 3: ხელმისაწვდომი მძღოლები (ADR ფილტრით) */}
      <div className={CardBase}>
        <ColumnHeader title="ხელმისაწვდომი მძღოლები" icon="👨‍✈️" color="from-blue-600/20 to-blue-800/5" />
        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
          {displayDrivers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center">
              <span className="text-3xl mb-2 opacity-50">👨‍✈️</span>
              <p className="text-xs">
                {selectedOrder?.is_dangerous ? 'ADR სერტიფიცირებული მძღოლი არ არის' : 'თავისუფალი მძღოლი არ არის'}
              </p>
            </div>
          ) : displayDrivers.map(driver => {
            const isInternal = driver.employment_type === 'internal' || !driver.employment_type;
            const isAutoSelected = pendingVehicleId && getVehicleLoad(pendingVehicleId).assignedOrders?.[0]?.driver_id === driver.id;

            return (
              <button
                key={driver.id}
                onClick={() => handleDriverSelect(driver.id)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-200 text-left group
                  ${pendingDriverId === driver.id 
                    ? 'bg-blue-500/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/30' 
                    : 'bg-gray-900/40 border-gray-700/50 hover:border-blue-500/30 hover:bg-gray-800/60'
                  }`}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-sm font-bold text-white shadow-md shrink-0 overflow-hidden">
                  {driver.photo_url ? (
                    <img src={driver.photo_url} alt={driver.full_name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; e.currentTarget.parentElement!.innerHTML = driver.full_name?.charAt(0).toUpperCase() || '?'; }} />
                  ) : (driver.full_name?.charAt(0).toUpperCase() || '?')}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs text-white font-medium truncate leading-tight">{driver.full_name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[10px] ${isInternal ? 'text-blue-400' : 'text-orange-400'}`}>{isInternal ? '🏢 კომპანია' : '🤝 კონტრაქტი'}</span>
                    {driver.has_adr && <span className="text-[9px] px-1.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded">⚠️ ADR</span>}
                    {isAutoSelected && <span className="text-[9px] text-green-400 font-bold animate-pulse ml-auto">ავტო</span>}
                  </div>
                </div>
                <div className="shrink-0">{pendingDriverId === driver.id && <span className="text-blue-400 text-lg animate-pulse">✓</span>}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 🔗 სვეტი 4: მინიჭების დადასტურება */}
      <div className={CardBase}>
        <ColumnHeader title="მინიჭების დადასტურება" icon="🔗" color="from-green-600/20 to-green-800/5" />
        <div className="flex-1 overflow-y-auto p-4 flex flex-col custom-scrollbar">
          {selectedOrder ? (
            <div className="flex flex-col h-full">
              <div className="p-3 bg-gray-900/60 rounded-xl border border-white/5 mb-4 shadow-inner">
                <p className="text-[9px] text-gray-400 uppercase mb-1 tracking-wider">არჩეული შეკვეთა</p>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-white font-mono">{selectedOrder.tracking_code}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${getStatusColor(selectedOrder.status)}`}>{selectedOrder.status}</span>
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
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between p-2.5 bg-gray-900/40 rounded-lg border border-white/5">
                  <span className="text-[10px] text-gray-400">👨‍✈️ მძღოლი</span>
                  <span className="text-xs text-white font-medium flex items-center gap-1">
                    {pendingDriverId ? drivers.find(d => d.id === pendingDriverId)?.full_name : '—'}
                    {pendingDriverId && getVehicleLoad(pendingVehicleId || '').assignedOrders?.[0]?.driver_id === pendingDriverId && <span className="text-[9px] bg-green-500/20 text-green-400 px-1 rounded">ავტო</span>}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-gray-900/40 rounded-lg border border-white/5">
                  <span className="text-[10px] text-gray-400">🚛 ტრანსპორტი</span>
                  <span className="text-xs text-white font-medium font-mono">{pendingVehicleId ? displayVehicles.find(v => v.id === pendingVehicleId)?.plate_number : '—'}</span>
                </div>
              </div>
              {capacityError && <div className="mb-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-[10px] text-red-400 text-center animate-pulse">{capacityError}</div>}
              <button onClick={handleConfirmAssign} disabled={assigning || !pendingDriverId || !pendingVehicleId} className="mt-auto w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all duration-300 shadow-lg shadow-green-500/20 hover:shadow-green-500/40 hover:-translate-y-0.5 flex items-center justify-center gap-2">
                {assigning ? <><span className="animate-spin">⏳</span> მიმდინარეობს...</> : <>✅ მინიჭების დადასტურება</>}
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500">
              <div className="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center mb-3 border border-white/5 shadow-inner"><span className="text-2xl">👈</span></div>
              <p className="text-sm font-medium text-gray-300">აირჩიე შეკვეთა</p>
              <p className="text-[10px] mt-1 max-w-[200px]">შეკვეთის არჩევისას, სისტემა ავტომატურად დატოვებს მხოლოდ იმ რესურსებს, რომლებიც აკმაყოფილებენ მოთხოვნებს</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}