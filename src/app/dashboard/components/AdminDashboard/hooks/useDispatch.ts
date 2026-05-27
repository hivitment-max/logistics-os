import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface UseDispatchProps {
  showNotification: (msg: string) => void
  loadData: () => Promise<void>
  logAudit: (action: string, target: string, details: string) => Promise<void>
  orders?: any[]
  drivers?: any[]
  vehicles?: any[]
}

// 📱 Telegram შეტყობინების გაგზავნა (დამოუკიდებელი ფუნქცია)
const sendTelegramNotification = async (driverName: string, order: any) => {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID

  if (!token || !chatId) return

  const text = `🚛 <b>ახალი შეკვეთა მინიჭებულია!</b>\n\n` +
    `📦 კოდი: <code>${order.tracking_code}</code>\n` +
    `👨‍✈️ მძღოლი: ${driverName}\n` +
    `📍 მარშრუტი: ${order.pickup_address} → ${order.delivery_address}\n` +
    `📅 თარიღი: ${order.scheduled_pickup_date ? new Date(order.scheduled_pickup_date).toLocaleDateString('ka-GE') : '–'}\n` +
    `💰 თანხა: ${order.price} ${order.currency}`

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
    })
  } catch (err) {
    console.error('❌ Telegram შეტყობინება ვერ გაიგზავნა:', err)
  }
}

export function useDispatch({ 
  showNotification, 
  loadData, 
  logAudit,
  orders = [],
  drivers = [],
  vehicles = []
}: UseDispatchProps) {
  
  // 🎯 Modal State for assignment form
  const [assigningOrder, setAssigningOrder] = useState<any | null>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assignForm, setAssignForm] = useState({
    driver_id: '',
    vehicle_id: '',
    driver_type: 'internal' as 'internal' | 'external',
    vehicle_type: 'internal' as 'internal' | 'external',
    external_driver_id: '',
    external_vehicle_id: '',
    notes: ''
  })

  // 🔍 Helper: შეამოწმოს არის თუ არა მძღოლი/მანქანა ხელმისაწვდომი
  const checkAvailability = useCallback((driverId: string | null, vehicleId: string | null, pickupDate: string | null): { available: boolean; message: string } => {
    if (!pickupDate) return { available: true, message: '' }

    if (driverId) {
      const driver = drivers?.find((d: any) => d.id === driverId)
      if (driver && !driver.is_available) {
        const conflictingOrder = orders?.find((o: any) => 
          o.driver_id === driverId && 
          o.scheduled_pickup_date?.startsWith(pickupDate) &&
          o.status !== 'cancelled' && o.status !== 'delivered'
        )
        if (conflictingOrder) {
          return { available: false, message: `მძღოლი უკვე დაკავებულია ${pickupDate} თარიღზე (შეკვეთა: ${conflictingOrder.tracking_code})` }
        }
      }
    }

    if (vehicleId) {
      const vehicle = vehicles?.find((v: any) => v.id === vehicleId)
      if (vehicle && vehicle.status === 'in_use') {
        const conflictingOrder = orders?.find((o: any) => 
          o.vehicle_id === vehicleId && 
          o.scheduled_pickup_date?.startsWith(pickupDate) &&
          o.status !== 'cancelled' && o.status !== 'delivered'
        )
        if (conflictingOrder) {
          return { available: false, message: `მანქანა უკვე დაკავებულია ${pickupDate} თარიღზე (შეკვეთა: ${conflictingOrder.tracking_code})` }
        }
      }
    }

    return { available: true, message: '' }
  }, [drivers, vehicles, orders])

  // 🚛 მინიჭების ფუნქცია - ✅ განახლებული vehiclePlateNumber-ით
  const handleAssign = useCallback(async (
    orderId: string, 
    driverId: string | null, 
    vehicleId: string | null,
    pickupDate?: string | null,
    vehiclePlateNumber?: string | null  // ✅ ახალი პარამეტრი: მანქანის ნომერი
  ) => {
    const availability = checkAvailability(driverId, vehicleId, pickupDate || null)
    if (!availability.available) {
      showNotification(`⚠️ ${availability.message}`)
      return
    }

    const updatePayload: any = {
      driver_id: driverId || null,
      vehicle_id: vehicleId || null,
      assigned_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // ✅ თუ მანქანის ნომერი მოგვყვა, ვინახავთ მას ბაზაში
    if (vehiclePlateNumber) {
      updatePayload.vehicle_plate_number = vehiclePlateNumber
    }

    const order = orders?.find((o: any) => o.id === orderId)
    if (order?.status === 'pending') {
      updatePayload.status = 'assigned'
    } else if (order?.status === 'assigned' && driverId && vehicleId) {
      updatePayload.status = 'in_transit'
    }

    const { error: orderError, data: updatedOrder } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId)
      .select()

    if (orderError) {
      showNotification(`❌ შეცდომა შეკვეთის განახლებისას: ${orderError.message}`)
      return
    }

    if (driverId) {
      const driver = drivers?.find((d: any) => d.id === driverId)
      if (driver && driver.employment_type !== 'external') {
        await supabase.from('drivers').update({ 
          is_available: false, 
          current_order_id: orderId 
        }).eq('id', driverId)
      }
    }

    if (vehicleId) {
      const vehicle = vehicles?.find((v: any) => v.id === vehicleId)
      if (vehicle && vehicle.type !== 'external') {
        await supabase.from('vehicles').update({ 
          status: 'in_use', 
          assigned_order_id: orderId 
        }).eq('id', vehicleId)
      }
    }

    const driver = drivers?.find((d: any) => d.id === driverId)
    const vehicle = vehicles?.find((v: any) => v.id === vehicleId)
    await logAudit(
      'ORDER_ASSIGNED', 
      orderId, 
      `მინიჭებული: მძღოლი=${driver?.full_name || driverId || '-'}, მანქანა=${vehicle?.plate_number || vehicleId || '-'}`
    )
    
    await supabase.from('tracking_events').insert({
      order_id: orderId,
      event_type: 'assigned',
      location_name: 'დისპეტჩერი',
      notes: `შეკვეთა მინიჭებული: მძღოლი ${driver?.full_name || '-'}, მანქანა ${vehicle?.plate_number || '-'}`,
      created_at: new Date().toISOString()
    })

    // 📱 Telegram შეტყობინების გაგზავნა (ახალი ნაწილი)
    if (driverId) {
      const assignedDriver = drivers?.find(d => d.id === driverId)
      if (assignedDriver) {
        await sendTelegramNotification(assignedDriver.full_name, updatedOrder?.[0] || { ...order, id: orderId })
      }
    }

    showNotification(`✅ შეკვეთა მინიჭებულია: ${updatedOrder?.[0]?.tracking_code || orderId}`)
    await loadData()
  }, [showNotification, loadData, logAudit, orders, drivers, vehicles, checkAvailability])

  const openAssignModal = useCallback((order: any) => {
    setAssigningOrder(order)
    setAssignForm({
      driver_id: order.driver_id || '',
      vehicle_id: order.vehicle_id || '',
      driver_type: order.driver_type || 'internal',
      vehicle_type: order.vehicle_type || 'internal',
      external_driver_id: order.external_driver_id || '',
      external_vehicle_id: order.external_vehicle_id || '',
      notes: ''
    })
    setShowAssignModal(true)
  }, [])

  const handleAssignFromForm = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!assigningOrder) return

    const finalDriverId = assignForm.driver_type === 'internal' 
      ? (assignForm.driver_id || null) 
      : (assignForm.external_driver_id || null)
    
    const finalVehicleId = assignForm.vehicle_type === 'internal' 
      ? (assignForm.vehicle_id || null) 
      : (assignForm.external_vehicle_id || null)

    await handleAssign(
      assigningOrder.id, 
      finalDriverId, 
      finalVehicleId,
      assigningOrder.scheduled_pickup_date?.split('T')[0]
    )
    
    setShowAssignModal(false)
    setAssigningOrder(null)
  }, [assigningOrder, assignForm, handleAssign])

  const handleUnassign = useCallback(async (orderId: string) => {
    const order = orders?.find((o: any) => o.id === orderId)
    if (!order) return

    const { error } = await supabase.from('orders').update({
      driver_id: null,
      vehicle_id: null,
      external_driver_id: null,
      external_vehicle_id: null,
      status: 'pending',
      assigned_at: null,
      updated_at: new Date().toISOString()
    }).eq('id', orderId)

    if (error) {
      showNotification(`❌ ${error.message}`)
      return
    }

    if (order.driver_id && order.driver_type === 'internal') {
      await supabase.from('drivers').update({ 
        is_available: true, 
        current_order_id: null 
      }).eq('id', order.driver_id)
    }

    if (order.vehicle_id && order.vehicle_type === 'internal') {
      await supabase.from('vehicles').update({ 
        status: 'active', 
        assigned_order_id: null 
      }).eq('id', order.vehicle_id)
    }

    await logAudit('ORDER_UNASSIGNED', orderId, 'მინიჭება მოხსნილია')
    await supabase.from('tracking_events').insert({
      order_id: orderId,
      event_type: 'unassigned',
      location_name: 'დისპეტჩერი',
      notes: 'მინიჭება მოხსნილი ადმინისტრატორის მიერ',
      created_at: new Date().toISOString()
    })

    showNotification('✅ მინიჭება მოხსნილია')
    await loadData()
  }, [showNotification, loadData, logAudit, orders])

  const [dispatchFilter, setDispatchFilter] = useState({
    status: ['pending', 'assigned'],
    date_from: '',
    date_to: '',
    search: ''
  })

  const filteredOrdersForDispatch = useCallback(() => {
    let result = orders || []

    if (dispatchFilter.status.length > 0) {
      result = result.filter((o: any) => dispatchFilter.status.includes(o.status))
    }

    if (dispatchFilter.date_from) {
      result = result.filter((o: any) => o.scheduled_pickup_date >= dispatchFilter.date_from)
    }
    if (dispatchFilter.date_to) {
      result = result.filter((o: any) => o.scheduled_pickup_date <= dispatchFilter.date_to)
    }

    if (dispatchFilter.search) {
      const search = dispatchFilter.search.toLowerCase()
      result = result.filter((o: any) => 
        o.tracking_code?.toLowerCase().includes(search) ||
        o.pickup_address?.toLowerCase().includes(search) ||
        o.delivery_address?.toLowerCase().includes(search) ||
        o.client_name?.toLowerCase().includes(search)
      )
    }

    return result.sort((a: any, b: any) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1
      if (b.status === 'pending' && a.status !== 'pending') return 1
      return new Date(b.scheduled_pickup_date || 0).getTime() - new Date(a.scheduled_pickup_date || 0).getTime()
    })
  }, [orders, dispatchFilter])

  return {
    assigningOrder,
    showAssignModal,
    setShowAssignModal,
    assignForm,
    setAssignForm,
    handleAssign,
    handleAssignFromForm,
    openAssignModal,
    handleUnassign,
    dispatchFilter,
    setDispatchFilter,
    filteredOrdersForDispatch,
    checkAvailability
  }
}