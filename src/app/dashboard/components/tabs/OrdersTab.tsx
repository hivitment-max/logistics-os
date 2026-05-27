'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import LoadingTruck from '@/app/dashboard/components/ui/LoadingTruck'
import AddOrderModal from '../modals/AddOrderModal'
import OrderPreviewModal from '../modals/OrderPreviewModal'
import SendNotificationModal from '../modals/SendNotificationModal'
import CreateInvoiceModal from '../modals/CreateInvoiceModal'

interface OrdersTabProps {
  orders: any[]
  loading: boolean
  orderFilter: string
  setOrderFilter: (filter: string) => void
  onStatusChange: (orderId: string, newStatus: string) => void
  onEdit: (order: any) => void
  onDelete: (order: any) => void
  onAdd: () => void
  onCreateInvoice: (order: any) => void
  getStatusColor: (status: string) => string
  ActionButtons: React.ComponentType<{ onEdit: () => void; onDelete: () => void }>
  loadData?: () => void
}

export default function OrdersTab({ 
  orders, 
  loading, 
  orderFilter, 
  setOrderFilter, 
  onStatusChange, 
  onEdit, 
  onDelete, 
  onAdd, 
  onCreateInvoice, 
  getStatusColor, 
  ActionButtons,
  loadData
}: OrdersTabProps) {
  
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingOrder, setEditingOrder] = useState<any | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewOrder, setPreviewOrder] = useState<any | null>(null)
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [notificationOrder, setNotificationOrder] = useState<any | null>(null)
  
  // 🧾 ინვოისის მოდალის სტეიტები
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<any>(null)

  // 🔄 Realtime subscription შეკვეთების ცვლილებებისთვის
  useEffect(() => {
    if (!loadData) return
    
    const channel = supabase
      .channel('orders_realtime')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        () => {
          console.log('🔄 [ORDERS] Status changed, refreshing...')
          loadData()
        }
      )
      .subscribe()
    
    return () => { supabase.removeChannel(channel) }
  }, [loadData])

  if (loading) return <LoadingTruck message="შეკვეთები იტვირთება..." size="md" />
  
  const filteredOrders = orders.filter(o => orderFilter === 'all' || o.status === orderFilter)

  // ============================================================================
  // 🆕 განახლებული: მძღოლის პასუხის ბეჯი (სწორი ველებით)
  // ============================================================================
  const getDriverResponseBadge = (response: string | null, confirmedAt?: string, rejectedAt?: string) => {
    if (!response) return <span className="text-[10px] text-gray-500">–</span>
    
    // ვიღებთ სწორ თარიღს პასუხის ტიპის მიხედვით
    const respondedAt = response === 'accepted' ? confirmedAt : rejectedAt
    
    if (response === 'accepted') {
      return (
        <div className="flex flex-col items-start">
          <span className="px-2 py-0.5 rounded text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 font-medium">
            ✅ დადასტურებულია
          </span>
          {respondedAt && (
            <span className="text-[9px] text-gray-500 mt-0.5">
              {new Date(respondedAt).toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      )
    }
    if (response === 'rejected') {
      return (
        <div className="flex flex-col items-start">
          <span className="px-2 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 font-medium">
            ❌ უარყოფილია
          </span>
          {respondedAt && (
            <span className="text-[9px] text-gray-500 mt-0.5">
              {new Date(respondedAt).toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      )
    }
    return <span className="text-[10px] text-gray-500">{response}</span>
  }

  // ============================================================================
  // 🔄 HELPER: ბაზის მონაცემები → ფორმის ფორმატი
  // ============================================================================
  const mapDatabaseToForm = (order: any) => {
    const splitDateTime = (timestamp: string | null) => {
      if (!timestamp) return { date: '', time: '' }
      try {
        if (timestamp.includes('T')) {
          const [date, timePart] = timestamp.split('T')
          const time = timePart.split('.')[0].split('+')[0].split('-').slice(0,2).join('-')
          return { date, time: time.substring(0, 5) }
        }
        if (timestamp.includes(' ')) {
          const [date, time] = timestamp.split(' ')
          return { date, time: time.substring(0, 5) }
        }
        if (timestamp.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return { date: timestamp, time: '' }
        }
        return { date: '', time: '' }
      } catch {
        return { date: '', time: '' }
      }
    }
    const pickup = splitDateTime(order.scheduled_pickup_date)
    const delivery = splitDateTime(order.scheduled_delivery_date)
    return {
      pickup_address: order.pickup_address || '',
      pickup_date: pickup.date,
      pickup_time: pickup.time,
      pickup_contact: order.pickup_contact_person || '',
      pickup_phone: order.pickup_phone || '',
      delivery_address: order.delivery_address || '',
      delivery_date: delivery.date,
      delivery_time: delivery.time,
      delivery_contact: order.delivery_contact_person || '',
      delivery_phone: order.delivery_phone || '',
      cargo_description: order.cargo_description || '',
      cargo_type: order.cargo_type || 'standard',
      cargo_weight_kg: order.cargo_weight_kg?.toString() || '',
      cargo_volume_m3: order.cargo_volume_m3?.toString() || '',
      cargo_units: order.places_count?.toString() || order.cargo_units?.toString() || '',
      cargo_length_m: order.cargo_length_m?.toString() || '',
      cargo_width_m: order.cargo_width_m?.toString() || '',
      cargo_height_m: order.cargo_height_m?.toString() || '',
      packaging_type: order.packaging_type || 'box',
      returnable_packaging: !!order.returnable_packaging,
      price: order.price?.toString() || '',
      currency: order.currency || 'GEL',
      payment_terms: order.payment_terms || 'on_delivery',
      invoice_needed: !!order.invoice_needed,
      road_fee: order.road_fee?.toString() || '',
      outside_city_fee: order.outside_city_fee?.toString() || '',
      waiting_fee_per_hour: order.waiting_fee_per_hour?.toString() || '',
      extra_fees: order.extra_fees?.toString() || '',
      client_type: order.client_type || 'private',
      client_id: order.client_id || '',
      client_name: order.client_name || '',
      client_phone: order.client_phone || '',
      client_email: order.client_email || '',
      client_personal_id: order.client_personal_id || '',
      client_registration_number: order.client_registration_number || '',
      client_vat: order.client_vat || '',
      client_address: order.client_address || '',
      internal_notes: order.notes || order.internal_notes || '',
      special_requirements: order.special_requirements || '',
      needs_tail_lift: !!order.needs_tail_lift || !!order.requires_taillift,
      needs_straps: !!order.needs_straps,
      needs_bricklaying: !!order.needs_bricklaying,
      needs_two_cargo_handlers: !!order.needs_two_cargo_handlers,
      attachment: null,
      priority: order.priority || 'medium',
      status: order.status || 'pending',
      notify_client: order.notify_client !== false,
      tracking_code: order.tracking_code || '',
      created_at: order.created_at || new Date().toISOString(),
      driver_type: order.driver_type || 'internal',
      vehicle_type: order.vehicle_type || 'internal',
      driver_id: order.driver_id || '',
      external_driver_id: order.external_driver_id || '',
      vehicle_id: order.vehicle_id || '',
      external_vehicle_id: order.external_vehicle_id || '',
      external_driver_rate: order.external_driver_rate?.toString() || '0',
      external_vehicle_rate: order.external_vehicle_rate?.toString() || '0',
    }
  }

  // ============================================================================
  // 🔄 HELPER: ფორმის მონაცემები → ბაზის ფორმატი
  // ============================================================================
  const mapFormToDatabase = (form: any) => {
    const combineDateTime = (date: string, time: string) => {
      if (!date) return null
      if (time) return `${date}T${time}:00Z`
      return `${date}T00:00:00Z`
    }
    return {
      pickup_address: form.pickup_address || null,
      delivery_address: form.delivery_address || null,
      scheduled_pickup_date: combineDateTime(form.pickup_date, form.pickup_time),
      scheduled_delivery_date: combineDateTime(form.delivery_date, form.delivery_time),
      pickup_contact_person: form.pickup_contact || null,
      pickup_phone: form.pickup_phone || null,
      delivery_contact_person: form.delivery_contact || null,
      delivery_phone: form.delivery_phone || null,
      cargo_description: form.cargo_description || null,
      cargo_type: form.cargo_type || 'standard',
      cargo_weight_kg: parseFloat(form.cargo_weight_kg) || 0,
      cargo_volume_m3: parseFloat(form.cargo_volume_m3) || null,
      places_count: parseInt(form.cargo_units) || null,
      cargo_length_m: parseFloat(form.cargo_length_m) || null,
      cargo_width_m: parseFloat(form.cargo_width_m) || null,
      cargo_height_m: parseFloat(form.cargo_height_m) || null,
      packaging_type: form.packaging_type || 'box',
      returnable_packaging: !!form.returnable_packaging,
      price: parseFloat(form.price) || 0,
      currency: form.currency || 'GEL',
      payment_terms: form.payment_terms || 'on_delivery',
      invoice_needed: !!form.invoice_needed,
      road_fee: parseFloat(form.road_fee) || 0,
      outside_city_fee: parseFloat(form.outside_city_fee) || 0,
      waiting_fee_per_hour: parseFloat(form.waiting_fee_per_hour) || 0,
      extra_fees: parseFloat(form.extra_fees) || 0,
      client_type: form.client_type || 'private',
      client_name: form.client_name || null,
      client_phone: form.client_phone || null,
      client_email: form.client_email || null,
      client_personal_id: form.client_personal_id || null,
      client_registration_number: form.client_registration_number || null,
      client_vat: form.client_vat || null,
      client_address: form.client_address || null,
      client_id: form.client_id || null,
      notes: form.internal_notes || null,
      special_requirements: form.special_requirements || null,
      needs_tail_lift: !!form.needs_tail_lift,
      needs_straps: !!form.needs_straps,
      needs_bricklaying: !!form.needs_bricklaying,
      needs_two_cargo_handlers: !!form.needs_two_cargo_handlers,
      priority: form.priority || 'medium',
      status: form.status || 'pending',
      notify_client: !!form.notify_client,
      driver_type: form.driver_type || 'internal',
      vehicle_type: form.vehicle_type || 'internal',
      driver_id: form.driver_type === 'internal' ? (form.driver_id || null) : null,
      external_driver_id: form.driver_type === 'external' ? (form.external_driver_id || null) : null,
      vehicle_id: form.vehicle_type === 'internal' ? (form.vehicle_id || null) : null,
      external_vehicle_id: form.vehicle_type === 'external' ? (form.external_vehicle_id || null) : null,
      external_driver_rate: parseFloat(form.external_driver_rate) || 0,
      external_vehicle_rate: parseFloat(form.external_vehicle_rate) || 0,
      updated_at: new Date().toISOString(),
    }
  }

  const handleEditClick = (order: any) => {
    const formData = mapDatabaseToForm(order)
    setEditingOrder(formData)
    setShowEditModal(true)
  }

  const handleEditSave = (updatedData: any) => {
    const payload = mapFormToDatabase(updatedData)
    onEdit({ id: editingOrder?.id, tracking_code: editingOrder?.tracking_code, ...payload })
    setShowEditModal(false)
    setEditingOrder(null)
  }

  const handleDeleteClick = (order: any) => {
    if (confirm(`დარწმუნებული ხართ რომ გინდათ შეკვეთის ${order.tracking_code} წაშლა?`)) {
      onDelete(order)
    }
  }

  const handlePreviewClick = (order: any) => {
    setPreviewOrder(order)
    setShowPreviewModal(true)
  }

  const handleOpenNotification = (order: any) => {
    setNotificationOrder(order)
    setShowNotificationModal(true)
  }

  // ✅ ✅ ✅ განახლებული: შეტყობინება ღილაკებით (Inline Keyboard)
  const handleSendNotification = async (channels: string[]) => {
    console.log('🚀 [NOTIFICATION] Starting send process...')
    if (!notificationOrder) throw new Error('შეკვეთა არ არის არჩეული')

    const order = notificationOrder
    let chatId = order.drivers?.telegram_chat_id || order.external_drivers?.telegram_chat_id

    // თუ cache-ში არ არის, პირდაპირ ბაზიდან ამოვიღოთ
    if (!chatId) {
      console.log('🔄 [NOTIFICATION] Chat ID missing in cache. Fetching from DB...')
      const driverId = order.driver_type === 'external' ? order.external_driver_id : order.driver_id
      if (!driverId) throw new Error('მძღოლი არ არის მინიჭებული')

      const { data: driver } = await supabase
        .from('drivers')
        .select('telegram_chat_id, full_name')
        .eq('id', driverId)
        .single()

      if (driver?.telegram_chat_id) {
        chatId = driver.telegram_chat_id
        console.log(`✅ Chat ID found in DB: ${chatId}`)
      } else {
        console.warn('⚠️ Driver does not have a Telegram Chat ID')
        alert('⚠️ მძღოლს არ აქვს Telegram Chat ID. გთხოვთ დაამატოთ მძღოლის რედაქტირებისას.')
        return { success: false, error: 'Chat ID missing' }
      }
    }

    const token = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN
    if (!token) throw new Error('Bot token missing in .env.local')

    const message = `🚛 <b>ახალი შეკვეთა მინიჭებულია!</b>\n\n` +
      `📦 კოდი: <code>${order.tracking_code}</code>\n` +
      `📍 მარშრუტი: ${order.pickup_address} → ${order.delivery_address}\n` +
      `💰 თანხა: ${order.price} ${order.currency}`

    // ✅ ✅ ✅ ღილაკების კონფიგურაცია (Inline Keyboard)
    const reply_markup = {
      inline_keyboard: [
        [
          { text: '✅ მივიღე', callback_data: `acc:${order.id}` },
          { text: '❌ უარვყავი', callback_data: `rej:${order.id}` }
        ]
      ]
    }

    try {
      // 1️⃣ გაგზავნა Telegram-ზე ღილაკებით
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          chat_id: chatId, 
          text: message, 
          parse_mode: 'HTML',
          disable_web_page_preview: true,
          reply_markup: reply_markup  // ✅ ღილაკები
        })
      })
      const result = await res.json()
      if (!result.ok) throw new Error(result.description || 'Telegram API error')

      console.log('✅ Telegram message sent successfully!')

      // 2️⃣ ლოგის ჩაწერა ბაზაში
      await supabase.from('notifications').insert({
        order_id: order.id,
        driver_id: order.driver_type === 'internal' ? order.driver_id : null,
        external_driver_id: order.driver_type === 'external' ? order.external_driver_id : null,
        title: '🚛 ახალი შეკვეთა',
        message: `შეტყობინება გაგზავნილია Telegram-ზე`,
        channel: 'telegram',
        status: 'sent',
        metadata: { 
          chat_id: chatId, 
          telegram_message_id: result.result?.message_id,
          callback_data: `acc:${order.id}|rej:${order.id}`
        },
        sent_at: new Date().toISOString()
      })
      console.log('📝 Notification logged to DB')
      return { success: true }
    } catch (err: any) {
      console.error('❌ Notification failed:', err)
      return { success: false, error: err.message }
    }
  }

  // 🧾 ინვოისის შექმნის ღილაკის ლოგიკა
  const handleInvoiceClick = (order: any) => {
    setSelectedOrderForInvoice(order)
    setShowInvoiceModal(true)
  }

  return (
    <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl overflow-hidden">
      
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gray-800/80">
        <div className="flex items-center gap-3">
          <h2 className="text-xs font-bold uppercase text-gray-300">📦 შეკვეთები</h2>
          <select value={orderFilter} onChange={(e) => setOrderFilter(e.target.value)} className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-[10px] outline-none focus:border-blue-500 transition">
            <option value="all">ყველა</option>
            <option value="pending">ლოდინში</option>
            <option value="confirmed">✅ დადასტურებული</option>
            <option value="rejected">❌ უარყოფილი</option>
            <option value="in_transit">გზაში</option>
            <option value="delivered">მიწოდებული</option>
            <option value="cancelled">გაუქმებული</option>
          </select>
        </div>
        <button onClick={onAdd} className="bg-purple-600 hover:bg-purple-700 px-3 py-1.5 rounded text-[10px] font-semibold transition shadow-lg shadow-purple-500/20">+ ახალი</button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead className="text-gray-500 uppercase bg-gray-900/40">
            <tr>
              <th className="px-4 py-3 text-left">Tracking</th>
              <th className="px-4 py-3 text-left">მარშრუტი</th>
              <th className="px-4 py-3 text-left">ტვირთი</th>
              <th className="px-4 py-3 text-left">მძღოლი / მანქანა</th>
              <th className="px-4 py-3 text-left">ფასი</th>
              <th className="px-4 py-3 text-left">სტატუსი</th>
              {/* ✅ ახალი სვეტი: მძღოლის პასუხი */}
              <th className="px-4 py-3 text-left">მძღოლის პასუხი</th>
              <th className="px-4 py-3 text-right">მოქმედება</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/30">
            {filteredOrders.map(o => (
              <tr key={o.id} className="hover:bg-gray-700/20 transition">
                <td className="px-4 py-3 font-mono font-bold text-purple-400">{o.tracking_code}</td>
                <td className="px-4 py-3 text-[10px] text-gray-200">
                  📍 {o.pickup_address?.slice(0,15)}{o.pickup_address?.length > 15 ? '...' : ''}<br/>
                  🏁 {o.delivery_address?.slice(0,15)}{o.delivery_address?.length > 15 ? '...' : ''}
                </td>
                <td className="px-4 py-3 text-gray-300">
                  {o.cargo_description?.slice(0,20)}{o.cargo_description?.length > 20 ? '...' : ''}
                </td>
                <td className="px-4 py-3">
                  <div className="text-gray-300 flex items-center gap-1">
                    {o.drivers?.full_name || o.external_drivers?.full_name || '–'}
                    {o.driver_type === 'external' && <span className="text-[8px] px-1 py-0.5 bg-orange-500/20 text-orange-400 rounded">გარე</span>}
                  </div>
                  <div className="text-blue-400 text-[10px] flex items-center gap-1">
                    {o.vehicles?.plate_number || o.external_vehicles?.plate_number || '–'}
                    {o.vehicle_type === 'external' && <span className="text-[8px] px-1 py-0.5 bg-orange-500/20 text-orange-400 rounded">გარე</span>}
                  </div>
                </td>
                <td className="px-4 py-3 font-medium">{o.price} {o.currency}</td>
                <td className="px-4 py-3">
                  <select value={o.status} onChange={(e) => onStatusChange(o.id, e.target.value)} className={`px-2 py-0.5 rounded text-[10px] border bg-transparent outline-none cursor-pointer ${getStatusColor(o.status)}`}>
                    <option value="pending">ლოდინში</option>
                    <option value="confirmed">✅ დადასტურებულია</option>
                    <option value="rejected">❌ უარყოფილია</option>
                    <option value="in_transit">გზაში</option>
                    <option value="delivered">მიწოდებული</option>
                    <option value="cancelled">გაუქმებული</option>
                  </select>
                </td>
                {/* ✅ ახალი სვეტი: მძღოლის პასუხი - განახლებული */}
                <td className="px-4 py-3">
                  {getDriverResponseBadge(o.driver_response, o.driver_confirmed_at, o.driver_rejected_at)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end items-center gap-1">
                    <button onClick={() => handleEditClick(o)} className="p-1.5 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-md transition" title="რედაქტირება">✏️</button>
                    <button onClick={() => handlePreviewClick(o)} className="p-1.5 text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 rounded-md transition" title="Preview">👁️</button>
                    <button onClick={() => handleOpenNotification(o)} className="p-1.5 text-teal-400 bg-teal-500/10 hover:bg-teal-500/20 rounded-md transition" title="შეტყობინების გაგზავნა">📢</button>
                    {/* 🧾 ინვოისის ღილაკი - ახლა აქტიურია */}
                    <button 
                      onClick={() => handleInvoiceClick(o)} 
                      className="p-1.5 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-md transition" 
                      title="ინვოისის შექმნა"
                    >
                      🧾
                    </button>
                    <button onClick={() => handleDeleteClick(o)} className="p-1.5 text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-md transition" title="წაშლა">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredOrders.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">შეკვეთები არ არის</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ✏️ Edit Order Modal */}
      {showEditModal && editingOrder && (
        <AddOrderModal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setEditingOrder(null) }} orderForm={editingOrder} setOrderForm={setEditingOrder} onSubmit={handleEditSave} />
      )}

      {/* 👁️ Preview Modal */}
      {showPreviewModal && previewOrder && (
        <OrderPreviewModal isOpen={showPreviewModal} onClose={() => { setShowPreviewModal(false); setPreviewOrder(null) }} order={previewOrder} />
      )}

      {/* 🆕 შეტყობინების მოდალი */}
      {showNotificationModal && notificationOrder && (
        <SendNotificationModal isOpen={showNotificationModal} onClose={() => { setShowNotificationModal(false); setNotificationOrder(null) }} order={notificationOrder} onSend={handleSendNotification} logs={[]} />
      )}

      {/* 🧾 ინვოისის შექმნის მოდალი */}
      <CreateInvoiceModal 
        isOpen={showInvoiceModal} 
        onClose={() => { setShowInvoiceModal(false); setSelectedOrderForInvoice(null) }} 
        order={selectedOrderForInvoice} 
        onSuccess={() => { 
          // ოფციონალური: გადასვლა ინვოისების ტაბზე ან რეფრეში
          if (loadData) loadData()
        }} 
      />

    </div>
  )
}