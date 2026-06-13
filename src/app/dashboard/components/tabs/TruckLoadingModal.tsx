'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'

interface Order {
  id: string
  tracking_code: string
  weight_kg: number
  volume_m3: number
  price: number
  from: string
  to: string
}

interface Slot {
  id: string
  code: string
  maxWeight: number
  currentWeight: number
  maxVolume: number
  currentVolume: number
  section: 'left' | 'center' | 'right'
  orderId?: string | null
  trackingCode?: string | null
}

type SlotWithFreeSpace = Slot & { freeSpace: number }

interface Recommendation {
  type: 'single' | 'combined' | 'none'
  slots: Slot[]
  message: string
}

interface TruckLoadingModalProps {
  truck: any
  orders: any[]
  onClose: () => void
  onSlotUpdate: () => void
}

const FALLBACK_SLOTS: Slot[] = [
  { id: 'ex-05', code: 'EX-05', maxWeight: 400, currentWeight: 0, maxVolume: 2.5, currentVolume: 0, section: 'left' },
  { id: 'ex-06', code: 'EX-06', maxWeight: 400, currentWeight: 0, maxVolume: 2.5, currentVolume: 0, section: 'left' },
  { id: 'bx-03', code: 'BX-03', maxWeight: 400, currentWeight: 0, maxVolume: 2.5, currentVolume: 0, section: 'left' },
  { id: 'bx-04', code: 'BX-04', maxWeight: 400, currentWeight: 0, maxVolume: 2.5, currentVolume: 0, section: 'left' },
  { id: 'bx-01', code: 'BX-01', maxWeight: 400, currentWeight: 0, maxVolume: 2.5, currentVolume: 0, section: 'left' },
  { id: 'bx-02', code: 'BX-02', maxWeight: 400, currentWeight: 0, maxVolume: 2.5, currentVolume: 0, section: 'left' },
  { id: 'ex-08', code: 'EX-08', maxWeight: 1550, currentWeight: 0, maxVolume: 8.0, currentVolume: 0, section: 'center' },
  { id: 'bx-07', code: 'BX-07', maxWeight: 1550, currentWeight: 0, maxVolume: 8.0, currentVolume: 0, section: 'center' },
  { id: 'ex-13', code: 'EX-13', maxWeight: 400, currentWeight: 0, maxVolume: 2.5, currentVolume: 0, section: 'right' },
  { id: 'ex-14', code: 'EX-14', maxWeight: 400, currentWeight: 0, maxVolume: 2.5, currentVolume: 0, section: 'right' },
  { id: 'ex-17', code: 'EX-17', maxWeight: 700, currentWeight: 0, maxVolume: 3.5, currentVolume: 0, section: 'right' },
  { id: 'bx-11', code: 'BX-11', maxWeight: 400, currentWeight: 0, maxVolume: 2.5, currentVolume: 0, section: 'right' },
  { id: 'bx-12', code: 'BX-12', maxWeight: 400, currentWeight: 0, maxVolume: 2.5, currentVolume: 0, section: 'right' },
  { id: 'bx-16', code: 'BX-16', maxWeight: 700, currentWeight: 0, maxVolume: 3.5, currentVolume: 0, section: 'right' },
  { id: 'bx-09', code: 'BX-09', maxWeight: 400, currentWeight: 0, maxVolume: 2.5, currentVolume: 0, section: 'right' },
  { id: 'bx-10', code: 'BX-10', maxWeight: 400, currentWeight: 0, maxVolume: 2.5, currentVolume: 0, section: 'right' },
  { id: 'bx-15', code: 'BX-15', maxWeight: 700, currentWeight: 0, maxVolume: 3.5, currentVolume: 0, section: 'right' },
]

// 🧠 BEST FIT ალგორითმი - ყველაზე პატარა შესაფერის სლოტს ირჩევს
function findBestSlots(orderWeight: number, slots: Slot[]): Recommendation {
  // 1. თავისუფალი სლოტები
  const freeSlots: SlotWithFreeSpace[] = slots
    .map(s => ({ ...s, freeSpace: s.maxWeight - s.currentWeight }))
    .filter(s => s.freeSpace > 0)

  if (freeSlots.length === 0) {
    return { type: 'none', slots: [], message: '❌ ყველა სლოტი სავსეა!' }
  }

  // 2. BEST FIT - ვპოულობთ ყველა შესაფერის სლოტს სადაც ტვირთი ეტევა
  const fittingSlots = freeSlots.filter(s => s.freeSpace >= orderWeight)
  
  if (fittingSlots.length > 0) {
    // ვიღებთ სლოტს სადაც დარჩენილი ადგილი ყველაზე ნაკლებია (მინიმალური waste)
    const bestSlot = fittingSlots.reduce((best, current) => 
      current.freeSpace < best.freeSpace ? current : best
    )
    const waste = bestSlot.freeSpace - orderWeight
    return {
      type: 'single',
      slots: [bestSlot],
      message: `💡 რეკომენდებული: ${bestSlot.code} (${bestSlot.freeSpace} კგ, დარჩება ${waste} კგ)`
    }
  }

  // 3. BEST FIT MULTIPLE - თუ ერთ სლოტში არ ეტევა, ვიყენებთ რამდენიმეს
  // ჯერ დიდ სლოტებს ვალაგებთ (დიდიდან პატარისკენ)
  const sortedBySize = [...freeSlots].sort((a, b) => b.freeSpace - a.freeSpace)
  
  const ffdResult: SlotWithFreeSpace[] = []
  let remaining = orderWeight
  
  for (const slot of sortedBySize) {
    if (remaining <= 0) break
    ffdResult.push(slot)
    remaining -= slot.freeSpace
  }
  
  if (remaining <= 0) {
    const total = ffdResult.reduce((sum, s) => sum + s.freeSpace, 0)
    const codes = ffdResult.map(s => s.code).join(' + ')
    return {
      type: 'combined',
      slots: ffdResult,
      message: `💡 რეკომენდებული: ${codes} (${total} კგ ჯამში)`
    }
  }

  // 4. ვერ მოიძებნა საკმარისი ადგილი
  const totalFree = freeSlots.reduce((sum, s) => sum + s.freeSpace, 0)
  return {
    type: 'none',
    slots: [],
    message: `❌ არ არის საკმარისი ადგილი! სულ თავისუფალია: ${totalFree} კგ, საჭიროა: ${orderWeight} კგ`
  }
}

export default function TruckLoadingModal({ truck, orders, onClose, onSlotUpdate }: TruckLoadingModalProps) {
  const [slots, setSlots] = useState<Slot[]>([])
  const [initialSlots, setInitialSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [draggedOrder, setDraggedOrder] = useState<Order | null>(null)
  const [draggedSlotId, setDraggedSlotId] = useState<string | null>(null)
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [assignedOrderIds, setAssignedOrderIds] = useState<Set<string>>(new Set())

  const handleRemoveOrder = async (slotId: string) => {
    const slot = slots.find(s => s.id === slotId)
    if (!slot || !slot.orderId) return
    
    setSlots(slots.map(s => s.id === slotId ? {
      ...s,
      currentWeight: 0,
      currentVolume: 0,
      orderId: null,
      trackingCode: null
    } : s))
    
    setAssignedOrderIds(prev => {
      const newSet = new Set(prev)
      newSet.delete(slot.orderId!)
      return newSet
    })
    
    setHasChanges(true)
    setSuccess(`🔄 შეკვეთა ${slot.trackingCode} მოშორებულია სლოტიდან (დააჭირე დადასტურებას)`)
    setTimeout(() => setSuccess(null), 2500)
  }

  const handleSlotDragStart = (slot: Slot) => {
    if (!slot.orderId) return
    setDraggedSlotId(slot.id)
    setDraggedOrder({
      id: slot.orderId,
      tracking_code: slot.trackingCode || '',
      weight_kg: slot.currentWeight,
      volume_m3: slot.currentVolume,
      price: 0,
      from: '',
      to: ''
    })
  }

  const handleDropToOrdersList = async (e: React.DragEvent) => {
    e.preventDefault()
    if (draggedSlotId) {
      await handleRemoveOrder(draggedSlotId)
      setDraggedSlotId(null)
      setDraggedOrder(null)
    }
  }

  useEffect(() => {
    const loadSlots = async () => {
      try {
        console.log('🔄 Loading slots for vehicle:', truck?.id)
        
        if (!truck?.id) {
          console.warn('⚠️ No vehicle ID, using fallback')
          setSlots(FALLBACK_SLOTS)
          setInitialSlots(FALLBACK_SLOTS)
          setLoading(false)
          return
        }

        console.log('🔄 Creating proportional slots based on vehicle capacity...')
        
        const totalWeight = parseFloat(truck.capacity_kg) || 10000
        const totalVolume = parseFloat(truck.volume_m3 || truck.capacity_m3) || 45

        const leftSlotWeight = Math.max(1, Math.round((totalWeight * 0.30) / 6))
        const leftSlotVolume = Math.max(0.1, parseFloat(((totalVolume * 0.30) / 6).toFixed(2)))

        const centerSlotWeight = Math.max(1, Math.round((totalWeight * 0.40) / 2))
        const centerSlotVolume = Math.max(0.1, parseFloat(((totalVolume * 0.40) / 2).toFixed(2)))

        const rightSlotWeight = Math.max(1, Math.round((totalWeight * 0.30) / 9))
        const rightSlotVolume = Math.max(0.1, parseFloat(((totalVolume * 0.30) / 9).toFixed(2)))

        console.log(`📊 Vehicle Capacity: ${totalWeight}kg / ${totalVolume}m³`)
        console.log(`📦 Slot Sizes -> Left: ${leftSlotWeight}kg/${leftSlotVolume}m³, Center: ${centerSlotWeight}kg/${centerSlotVolume}m³, Right: ${rightSlotWeight}kg/${rightSlotVolume}m³`)

        const slotConfigs = [
          { code: 'EX-05', weight: leftSlotWeight, volume: leftSlotVolume, x: 0, y: 0 },
          { code: 'EX-06', weight: leftSlotWeight, volume: leftSlotVolume, x: 1, y: 0 },
          { code: 'BX-03', weight: leftSlotWeight, volume: leftSlotVolume, x: 0, y: 1 },
          { code: 'BX-04', weight: leftSlotWeight, volume: leftSlotVolume, x: 1, y: 1 },
          { code: 'BX-01', weight: leftSlotWeight, volume: leftSlotVolume, x: 0, y: 2 },
          { code: 'BX-02', weight: leftSlotWeight, volume: leftSlotVolume, x: 1, y: 2 },
          { code: 'EX-08', weight: centerSlotWeight, volume: centerSlotVolume, x: 2, y: 0 },
          { code: 'BX-07', weight: centerSlotWeight, volume: centerSlotVolume, x: 2, y: 1 },
          { code: 'EX-13', weight: rightSlotWeight, volume: rightSlotVolume, x: 3, y: 0 },
          { code: 'EX-14', weight: rightSlotWeight, volume: rightSlotVolume, x: 4, y: 0 },
          { code: 'EX-17', weight: rightSlotWeight, volume: rightSlotVolume, x: 5, y: 0 },
          { code: 'BX-11', weight: rightSlotWeight, volume: rightSlotVolume, x: 3, y: 1 },
          { code: 'BX-12', weight: rightSlotWeight, volume: rightSlotVolume, x: 4, y: 1 },
          { code: 'BX-16', weight: rightSlotWeight, volume: rightSlotVolume, x: 5, y: 1 },
          { code: 'BX-09', weight: rightSlotWeight, volume: rightSlotVolume, x: 3, y: 2 },
          { code: 'BX-10', weight: rightSlotWeight, volume: rightSlotVolume, x: 4, y: 2 },
          { code: 'BX-15', weight: rightSlotWeight, volume: rightSlotVolume, x: 5, y: 2 },
        ]
        
        const defaultSlots = slotConfigs.map(s => ({
          vehicle_id: truck.id,
          position_code: s.code,
          max_weight_kg: s.weight,
          current_weight_kg: 0,
          max_volume_m3: s.volume,
          current_volume_m3: 0,
          position_x: s.x,
          position_y: s.y,
          is_occupied: false,
        }))

        const { error: deleteError } = await supabase
          .from('cargo_slots')
          .delete()
          .eq('vehicle_id', truck.id)

        if (deleteError) {
          console.error('❌ Error deleting old slots:', deleteError)
        }

        const { data: insertedData, error: insertError } = await supabase
          .from('cargo_slots')
          .insert(defaultSlots)
          .select()

        if (insertError) {
          console.error('❌ Error creating slots:', insertError)
          setLoadError(`Slots შექმნის შეცდომა: ${insertError.message}`)
          setSlots(FALLBACK_SLOTS)
          setInitialSlots(FALLBACK_SLOTS)
        } else {
          console.log(`✅ Created ${insertedData?.length} proportional slots`)
          
          const formattedSlots: Slot[] = (insertedData || []).map((slot: any) => ({
            id: slot.id,
            code: slot.position_code,
            maxWeight: parseFloat(slot.max_weight_kg) || 0,
            currentWeight: parseFloat(slot.current_weight_kg) || 0,
            maxVolume: parseFloat(slot.max_volume_m3) || 0,
            currentVolume: parseFloat(slot.current_volume_m3) || 0,
            section: slot.position_x < 2 ? 'left' : slot.position_x < 3 ? 'center' : 'right',
            orderId: null,
            trackingCode: null,
          }))
          
          setSlots(formattedSlots)
          setInitialSlots(formattedSlots)
        }
        
        setLoading(false)

      } catch (err: any) {
        console.error('❌ Exception:', err)
        setLoadError(`Exception: ${err.message}`)
        setSlots(FALLBACK_SLOTS)
        setInitialSlots(FALLBACK_SLOTS)
        setLoading(false)
      }
    }

    loadSlots()
  }, [truck?.id])

  const availableOrders: Order[] = useMemo(() => {
    return (orders || [])
      .filter((o: any) => 
        !o.assigned_slot_id && 
        !assignedOrderIds.has(o.id) &&
        ['pending', 'new', 'assigned'].includes(o.status)
      )
      .map((o: any) => ({
        id: o.id,
        tracking_code: o.tracking_code,
        weight_kg: parseFloat(o.cargo_weight_kg) || 0,
        volume_m3: parseFloat(o.cargo_volume_m3) || 0,
        price: parseFloat(o.price) || 0,
        from: o.pickup_city || 'თბილისი',
        to: o.delivery_city || 'ბათუმი',
      }))
  }, [orders, assignedOrderIds])

  const handleDragStart = (order: Order) => {
    setDraggedOrder(order)
    setDraggedSlotId(null)
    const rec = findBestSlots(order.weight_kg, slots)
    setRecommendation(rec)
    console.log(`🧠 Best Fit for ${order.weight_kg}kg:`, rec.message)
  }

  const handleDragEnd = () => {
    setDraggedOrder(null)
    setDraggedSlotId(null)
    setRecommendation(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  // ✅ მხოლოდ UI-ში ვცვლით, ბაზაში არა
  const handleDrop = async (slotId: string) => {
    if (draggedSlotId) {
      return
    }
    
    if (!draggedOrder || !recommendation) return

    const isRecommended = recommendation.slots.some(s => s.id === slotId)
    if (!isRecommended) {
      setError(`⚠️ ეს სლოტი არ არის რეკომენდებული! ${recommendation.message}`)
      setTimeout(() => setError(null), 3000)
      return
    }

    let remainingWeight = draggedOrder.weight_kg
    let remainingVolume = draggedOrder.volume_m3
    
    // ✅ ჯერ დიდ სლოტებს ვავსებთ (descending order)
    const sortedRecommended = [...recommendation.slots].sort((a, b) => b.maxWeight - a.maxWeight)
    
    console.log(`📦 Dropping ${draggedOrder.weight_kg}kg into slots:`, sortedRecommended.map(s => s.code))
    
    const updatedSlots = slots.map(s => {
      const recSlot = sortedRecommended.find(rs => rs.id === s.id)
      if (!recSlot) return s
      
      if (remainingWeight <= 0) return s
      
      const freeSpace = s.maxWeight - s.currentWeight
      const toAdd = Math.min(freeSpace, remainingWeight)
      remainingWeight -= toAdd
      
      const volumeToAdd = (toAdd / draggedOrder.weight_kg) * draggedOrder.volume_m3
      const freeVolume = s.maxVolume - s.currentVolume
      const actualVolumeToAdd = Math.min(freeVolume, volumeToAdd)
      remainingVolume -= actualVolumeToAdd
      
      console.log(`  → ${s.code}: +${toAdd}kg (total: ${s.currentWeight + toAdd}/${s.maxWeight})`)
      
      return { 
        ...s, 
        currentWeight: s.currentWeight + toAdd,
        currentVolume: s.currentVolume + actualVolumeToAdd,
        orderId: draggedOrder.id,
        trackingCode: draggedOrder.tracking_code,
      }
    })

    setSlots(updatedSlots)
    setAssignedOrderIds(prev => new Set([...prev, draggedOrder.id]))
    setDraggedOrder(null)
    setRecommendation(null)
    setHasChanges(true)
    
    setSuccess(`🔄 ${draggedOrder.tracking_code} ჩაემატა სლოტებში (დააჭირე დადასტურებას)`)
    setTimeout(() => setSuccess(null), 2500)
  }

  // ✅ დადასტურება - ინახავს ბაზაში
  const handleConfirmLoading = async () => {
    setConfirming(true)
    
    try {
      // 1. ვინახოთ სლოტების ცვლილებები
      for (const slot of slots) {
        const initialSlot = initialSlots.find(s => s.id === slot.id)
        if (initialSlot && (
          initialSlot.currentWeight !== slot.currentWeight || 
          initialSlot.currentVolume !== slot.currentVolume ||
          initialSlot.orderId !== slot.orderId
        )) {
          await supabase
            .from('cargo_slots')
            .update({ 
              current_weight_kg: slot.currentWeight,
              current_volume_m3: slot.currentVolume,
              is_occupied: slot.currentWeight > 0,
              order_id: slot.orderId
            })
            .eq('id', slot.id)
        }
      }

      // 2. ვინახოთ შეკვეთების მიბმა მანქანაზე
      const assignedOrders = slots
        .filter(s => s.orderId && s.currentWeight > 0)
        .map(s => s.orderId)
      
      for (const orderId of assignedOrders) {
        await supabase
          .from('orders')
          .update({ 
            assigned_truck_id: truck.id,
            assigned_slot_id: slots.find(s => s.orderId === orderId)?.id || null
          })
          .eq('id', orderId)
      }

      setHasChanges(false)
      setSuccess('✅ წარმატებით დადასტურდა!')
      setTimeout(() => {
        setSuccess(null)
        onSlotUpdate()
        onClose()
      }, 1500)
      
    } catch (err: any) {
      console.error('❌ Confirm error:', err)
      setError(`❌ შეცდომა: ${err.message}`)
      setTimeout(() => setError(null), 3000)
    } finally {
      setConfirming(false)
    }
  }

  // ✅ გაუქმება - აბრუნებს საწყის state-ს
  const handleCancelLoading = () => {
    setSlots(initialSlots)
    setAssignedOrderIds(new Set())
    setHasChanges(false)
    setSuccess('↩️ ცვლილებები გაუქმდა')
    setTimeout(() => setSuccess(null), 2000)
  }

  const getFill = (slot: Slot) => slot.maxWeight > 0 ? (slot.currentWeight / slot.maxWeight) * 100 : 0

  const getSlotStyle = (slot: Slot) => {
    const fill = getFill(slot)
    const isRecommended = recommendation?.slots.some(s => s.id === slot.id)
    const hasOrder = !!slot.orderId
    
    if (isRecommended) {
      return 'bg-green-100 border-green-500 text-green-700 animate-pulse shadow-lg shadow-green-500/30'
    }
    if (hasOrder) {
      return 'bg-purple-100 border-purple-500 text-purple-700 shadow-md shadow-purple-500/20'
    }
    if (fill === 0) return 'bg-slate-50 border-slate-200 text-slate-600'
    if (fill < 50) return 'bg-blue-100 border-blue-300 text-slate-700'
    if (fill < 100) return 'bg-blue-300 border-blue-400 text-white'
    return 'bg-blue-600 border-blue-500 text-white'
  }

  const totalWeight = slots.reduce((sum, s) => sum + s.currentWeight, 0)
  const maxWeight = slots.reduce((sum, s) => sum + s.maxWeight, 0)
  const totalVolume = slots.reduce((sum, s) => sum + s.currentVolume, 0)
  const maxVolume = slots.reduce((sum, s) => sum + s.maxVolume, 0)
  const capacityPercent = maxWeight > 0 ? Math.round((totalWeight / maxWeight) * 100) : 0
  const usedSlots = slots.filter(s => s.currentWeight > 0).length

  const renderSlot = (slot: Slot) => {
    const fill = getFill(slot)
    const hasOrder = !!slot.orderId
    
    return (
      <div
        key={slot.id}
        onDragOver={handleDragOver}
        onDrop={() => handleDrop(slot.id)}
        draggable={hasOrder}
        onDragStart={hasOrder ? () => handleSlotDragStart(slot) : undefined}
        onDragEnd={handleDragEnd}
        className={`relative rounded-lg border-2 flex flex-col justify-between p-2 h-[90px] transition-all overflow-hidden ${getSlotStyle(slot)} ${hasOrder ? 'cursor-grab active:cursor-grabbing' : ''}`}
        title={hasOrder ? `📦 ${slot.trackingCode} - გადაათრიე ამოსაღებად` : ''}
      >
        <div 
          className="absolute bottom-0 left-0 right-0 bg-blue-500/30 transition-all duration-500"
          style={{ height: `${fill}%` }}
        />
        <span className="text-[9px] font-mono font-bold relative z-10">{slot.code}</span>
        
        {hasOrder ? (
          <div className="flex-1 flex flex-col items-center justify-center relative z-10">
            <span className="text-[10px] font-bold text-purple-700 truncate max-w-full">
              📦 {slot.trackingCode}
            </span>
            <button
              onClick={(e) => { 
                e.stopPropagation()
                handleRemoveOrder(slot.id) 
              }}
              className="mt-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs font-bold flex items-center justify-center shadow-md transition-all hover:scale-110"
              title="შეკვეთის ამოღება"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center relative z-10 text-2xl">
            {fill === 100 ? '👁️' : fill > 0 ? '📦' : '+'}
          </div>
        )}
        
        <span className="text-[10px] font-bold relative z-10">
          {slot.currentWeight}/{slot.maxWeight} კგ
        </span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100]">
        <div className="bg-white rounded-2xl p-8 text-center">
          <div className="text-4xl mb-4 animate-bounce">🚛</div>
          <p className="text-lg font-bold">იტვირთება...</p>
          <p className="text-xs text-slate-500 mt-2">სლოტების პროპორციული შექმნა</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      
      {loadError && (
        <div className="fixed top-4 left-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-lg z-[300] text-xs">
          ⚠️ {loadError}
        </div>
      )}

      {error && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-xl shadow-2xl z-[200] font-bold animate-pulse">
          {error}
        </div>
      )}

      {success && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-xl shadow-2xl z-[200] font-bold animate-pulse">
          {success}
        </div>
      )}

      {recommendation && draggedOrder && !draggedSlotId && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl shadow-2xl z-[200] font-bold ${
          recommendation.type === 'none' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
        }`}>
          {recommendation.message}
        </div>
      )}

      <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col border border-white">
        
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center text-2xl shadow-lg">
              🚛
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">
                {truck?.plate_number || 'TR-001'} — {truck?.model || 'MAN TGX'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                ტევადობა: {truck?.capacity_kg || 10000} კგ · გადაათრიე შეკვეთა სლოტში
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {hasChanges && (
              <button
                onClick={handleCancelLoading}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold text-sm transition flex items-center gap-2"
              >
                <span>↩️</span>
                <span>გაუქმება</span>
              </button>
            )}
            
            {hasChanges && (
              <button
                onClick={handleConfirmLoading}
                disabled={confirming}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg font-bold text-sm transition shadow-lg shadow-green-500/20 flex items-center gap-2"
              >
                {confirming ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>ინახება...</span>
                  </>
                ) : (
                  <>
                    <span>✅</span>
                    <span>დადასტურება</span>
                  </>
                )}
              </button>
            )}
            
            <button
              onClick={hasChanges ? handleCancelLoading : onClose}
              className="w-10 h-10 rounded-full bg-slate-100 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition text-slate-600 font-bold text-xl"
              title={hasChanges ? 'გაუქმება და დახურვა' : 'დახურვა'}
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          <div className="grid grid-cols-12 gap-6">
            
            <div className="col-span-7">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <h3 className="text-sm font-black text-slate-700 mb-4 flex items-center gap-2">
                  📦 ტრუკის განლაგება
                </h3>

                <div className="bg-slate-200 border-2 border-slate-400 rounded-r-2xl rounded-l-md p-3 relative">
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-slate-500 rounded-t" />
                  <div className="absolute right-0 inset-y-0 w-1.5 bg-slate-500 rounded-r" />

                  <div className="bg-white p-3 rounded-xl border border-slate-300 flex gap-2">
                    <div className="w-[28%] grid grid-cols-2 gap-2">
                      {slots.filter(s => s.section === 'left').map(renderSlot)}
                    </div>
                    <div className="w-[44%] flex flex-col gap-2">
                      {slots.filter(s => s.section === 'center').map(renderSlot)}
                    </div>
                    <div className="w-[28%] grid grid-cols-3 gap-2">
                      {slots.filter(s => s.section === 'right').map(renderSlot)}
                    </div>
                  </div>

                  <div className="flex gap-1 mt-3 px-1">
                    {Array.from({ length: 18 }).map((_, i) => (
                      <div key={i} className={`h-1.5 flex-1 rounded-sm ${i % 2 === 0 ? 'bg-rose-500' : 'bg-slate-100'}`} />
                    ))}
                  </div>
                </div>

                <div className="relative h-12 mt-1">
                  <div className="absolute top-0 inset-x-4 h-2 bg-slate-700 rounded-b" />
                  <div className="flex gap-3 ml-[28%] -mt-1 relative z-10">
                    {[1, 2].map(w => (
                      <div key={w} className="w-10 h-10 bg-slate-800 rounded-full border-4 border-slate-500 flex items-center justify-center">
                        <div className="w-3 h-3 bg-slate-400 rounded-full" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-5">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 h-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-black text-slate-700 flex items-center gap-2">
                    📋 ხელმისაწვდომი შეკვეთები
                  </h3>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                    {availableOrders.length}
                  </span>
                </div>

                <div 
                  onDragOver={handleDragOver}
                  onDrop={handleDropToOrdersList}
                  className="space-y-2 overflow-y-auto max-h-[400px] min-h-[100px] p-2 rounded-lg border-2 border-dashed border-slate-200 transition-all hover:border-blue-400 hover:bg-blue-50/30"
                >
                  {availableOrders.length === 0 && !draggedSlotId && (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-2">✅</div>
                      <p className="text-sm text-slate-500">ყველა შეკვეთა განაწილებულია!</p>
                      <p className="text-xs text-slate-400 mt-2">🔄 სლოტიდან გადაათრიე აქ უკან ამოსაღებად</p>
                    </div>
                  )}
                  {availableOrders.length === 0 && draggedSlotId && (
                    <div className="text-center py-8 bg-blue-100 rounded-lg animate-pulse">
                      <div className="text-4xl mb-2"></div>
                      <p className="text-sm text-blue-700 font-bold">გაუშვი აქ ამოსაღებად!</p>
                    </div>
                  )}
                  {availableOrders.map(order => (
                    <div
                      key={order.id}
                      draggable
                      onDragStart={() => handleDragStart(order)}
                      onDragEnd={handleDragEnd}
                      className={`p-3 rounded-xl border-2 cursor-move transition-all ${
                        draggedOrder?.id === order.id
                          ? 'bg-blue-100 border-blue-400 opacity-50 scale-95'
                          : 'bg-slate-50 border-slate-200 hover:border-blue-400 hover:shadow-md'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold text-slate-800 font-mono">{order.tracking_code}</span>
                        <span className="text-xs text-yellow-600 font-bold">{order.price} ₾</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mb-1">
                        📍 {order.from} → {order.to}
                      </div>
                      <div className="flex gap-2 text-[10px] text-slate-600 font-medium">
                        <span>⚖️ {order.weight_kg} კგ</span>
                        <span>📐 {order.volume_m3} m³</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">⚖️ ტვირთი</div>
              <div className="text-lg font-black text-slate-800">
                {totalWeight.toLocaleString()} <span className="text-xs text-slate-400">/ {maxWeight.toLocaleString()} კგ</span>
              </div>
              <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${capacityPercent}%` }}
                />
              </div>
              <div className="text-right text-[10px] font-bold text-slate-500 mt-1">{capacityPercent}%</div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">📦 Slots</div>
              <div className="text-lg font-black text-slate-800">
                {usedSlots} <span className="text-xs text-slate-400">/ {slots.length}</span>
              </div>
              <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: `${slots.length > 0 ? (usedSlots / slots.length) * 100 : 0}%` }}
                />
              </div>
              <div className="text-right text-[10px] font-bold text-slate-500 mt-1">
                {slots.length > 0 ? Math.round((usedSlots / slots.length) * 100) : 0}%
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="text-[10px] font-bold text-blue-700 mb-1">💡 ინსტრუქცია</div>
              <ol className="text-[10px] text-slate-600 space-y-0.5 list-decimal list-inside">
                <li>აირჩიე შეკვეთა მარჯვნივ</li>
                <li>🧠 სისტემა ავტომატურად იპოვის ოპტიმალურ სლოტს</li>
                <li>გადაათრიე მწვანე სლოტ(ებ)ში</li>
                <li>✅ დააჭირე "დადასტურება" შენახვისთვის</li>
              </ol>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}