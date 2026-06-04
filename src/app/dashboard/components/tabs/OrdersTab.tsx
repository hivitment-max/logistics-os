// src/app/dashboard/components/tabs/OrdersTab.tsx
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

// ============================================================================
// 🎖️ DriverResponseBadge Component
// ============================================================================
const DriverResponseBadge = ({ order }: { order: any }) => {
  if (!order.driver_id && !order.external_driver_id) {
    return <span className="text-[9px] text-gray-500">—</span>
  }

  if (order.delivered_at) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-medium">
        🏁 მიწოდებულია
      </span>
    )
  }
  
  if (order.arrived_at) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-medium">
        📍 ადგილზეა
      </span>
    )
  }

  if (order.border_crossing_at) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-medium">
        🌍 საზღვარზეა
      </span>
    )
  }

  if (order.in_transit_at) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[9px] font-medium">
        🛣️ ტრანზიტშია
      </span>
    )
  }

  if (order.loaded_at) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[9px] font-medium">
        📦 ჩატვირთულია
      </span>
    )
  }

  if (order.en_route_at) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[9px] font-medium">
        🚗 გზაშია
      </span>
    )
  }

  if (order.instructions_sent_at && order.driver_response === 'accepted') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-medium animate-pulse">
        🟡 ელოდება გასვლას
      </span>
    )
  }

  if (order.driver_response === 'accepted') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-medium">
        ✅ დაადასტურა
      </span>
    )
  }

  if (order.driver_response === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-medium">
        ❌ უარყო
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-medium animate-pulse">
      ⏳ მოლოდინში
    </span>
  )
}

// ============================================================================
// 🔄 RefreshIcon Component
// ============================================================================
const RefreshIcon = ({ spinning }: { spinning?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={spinning ? 'animate-spin' : ''}>
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 21h5v-5" />
  </svg>
)

const ReminderIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)

const InstructionsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
)

// ============================================================================
// 📋 INITIAL ORDER FORM
// ============================================================================
const getInitialOrderForm = () => ({
  pickup_address: '', pickup_date: '', pickup_time: '', pickup_contact: '', pickup_phone: '',
  delivery_address: '', delivery_date: '', delivery_time: '', delivery_contact: '', delivery_phone: '',
  cargo_description: '', cargo_type: 'standard', cargo_weight_kg: '', cargo_volume_m3: '',
  cargo_units: '', cargo_length_m: '', cargo_width_m: '', cargo_height_m: '',
  packaging_type: 'box', returnable_packaging: false,
  price: '', currency: 'GEL', payment_terms: 'on_delivery', invoice_needed: false,
  road_fee: '', outside_city_fee: '', waiting_fee_per_hour: '', extra_fees: '',
  client_type: 'private', client_id: '', client_name: '', client_phone: '', client_email: '',
  client_personal_id: '', client_registration_number: '', client_vat: '', client_address: '',
  internal_notes: '', special_requirements: '',
  needs_tail_lift: false, needs_straps: false, needs_bricklaying: false, needs_two_cargo_handlers: false,
  attachment: null,
  priority: 'medium', status: 'pending', notify_client: true,
  tracking_code: '', created_at: new Date().toISOString(),
  driver_type: 'internal', vehicle_type: 'internal',
  driver_id: '', external_driver_id: '', vehicle_id: '', external_vehicle_id: '',
  external_driver_rate: '0', external_vehicle_rate: '0',
  transport_type: '', container_number: '',
})

export default function OrdersTab({ 
  orders, loading, orderFilter, setOrderFilter, onStatusChange, onEdit, onDelete,
  onAdd, onCreateInvoice, getStatusColor, ActionButtons, loadData
}: OrdersTabProps) {
  
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingOrder, setEditingOrder] = useState<any | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewOrder, setPreviewOrder] = useState<any | null>(null)
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [notificationOrder, setNotificationOrder] = useState<any | null>(null)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<any>(null)
  
  // 📋 Instructions modal state
  const [showInstructionsModal, setShowInstructionsModal] = useState(false)
  const [instructionsOrder, setInstructionsOrder] = useState<any | null>(null)
  const [instructionsText, setInstructionsText] = useState('')
  const [sendingInstructions, setSendingInstructions] = useState(false)
  
  // 🔄 Refresh state
  const [isRefreshing, setIsRefreshing] = useState(false)

  // 🆕 CLIENTS STATE - კლიენტების ჩატვირთვა dropdown-ისთვის
  const [privateClients, setPrivateClients] = useState<any[]>([])
  const [companiesList, setCompaniesList] = useState<any[]>([])
  
  // 🆕 ADD ORDER MODAL STATE - ახალი შეკვეთის მოდალი აქვე
  const [showAddModal, setShowAddModal] = useState(false)
  const [newOrderForm, setNewOrderForm] = useState<any>(getInitialOrderForm())

  // 🆕 კლიენტების ჩატვირთვა
  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    try {
      const [privateRes, companiesRes] = await Promise.all([
        supabase.from('private_clients').select('*').eq('is_active', true).order('full_name', { ascending: true }),
        supabase.from('companies').select('*').eq('is_active', true).order('name', { ascending: true })
      ])
      if (privateRes.data) setPrivateClients(privateRes.data)
      if (companiesRes.data) setCompaniesList(companiesRes.data)
      console.log(`✅ ჩაიტვირთა: ${privateRes.data?.length || 0} კერძო პირი, ${companiesRes.data?.length || 0} კომპანია`)
    } catch (e: any) {
      console.error('❌ კლიენტების ჩატვირთვა ვერ მოხერხდა:', e)
    }
  }

  // 🔄 Realtime subscription
  useEffect(() => {
    if (!loadData) return
    const channel = supabase
      .channel('orders_realtime')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        () => {
          console.log('🔄 [ORDERS] Status changed, refreshing...')
          loadData()
          loadClients() // კლიენტებიც განვაახლოთ
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadData])

  // 🔄 Refresh handler
  const handleRefresh = async () => {
    if (!loadData || isRefreshing) return
    setIsRefreshing(true)
    try {
      await loadData()
      await loadClients()
      console.log('✅ [ORDERS] Data refreshed')
    } catch (err) {
      console.error('❌ [ORDERS] Refresh failed:', err)
    } finally {
      setIsRefreshing(false)
    }
  }

  // 🆕 ახალი შეკვეთის გახსნა
  const handleAddClick = () => {
    setNewOrderForm(getInitialOrderForm())
    setShowAddModal(true)
  }

  // 🆕 ახალი შეკვეთის შენახვა
  const handleAddSubmit = async () => {
    try {
      const payload = mapFormToDatabase(newOrderForm)
      
      const { data, error } = await supabase
        .from('orders')
        .insert([payload])
        .select()
        .single()
      
      if (error) throw error
      
      console.log('✅ ახალი შეკვეთა შეიქმნა:', data.tracking_code)
      setShowAddModal(false)
      setNewOrderForm(getInitialOrderForm())
      
      if (loadData) loadData()
      await loadClients()
      
      alert(`✅ შეკვეთა წარმატებით შეიქმნა!\n📋 კოდი: ${data.tracking_code}`)
    } catch (e: any) {
      console.error('❌ შეკვეთის შექმნა ვერ მოხერხდა:', e)
      alert(`შეცდომა: ${e.message}`)
    }
  }

  // ⏰ Send reminder to driver
  const sendReminder = async (order: any) => {
    if (!confirm(`გავუგზავნოთ შეხსენება მძღოლს შეკვეთისთვის #${order.tracking_code}?`)) return

    const driverId = order.driver_type === 'external' ? order.external_driver_id : order.driver_id
    if (!driverId) { alert('მძღოლი არ არის მინიჭებული'); return }

    try {
      const { data: driver } = await supabase.from('drivers').select('id, telegram_chat_id, full_name').eq('id', driverId).single()
      if (!driver?.telegram_chat_id) { alert('⚠️ მძღოლს არ აქვს Telegram Chat ID'); return }

      const token = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN
      if (!token) throw new Error('Bot token missing')

      const message = `⏰ <b>შეხსენება!</b>\n\nშეკვეთა #${order.tracking_code} ჯერ კიდევ ლოდინშია.\n📍 მარშრუტი: ${order.pickup_address} → ${order.delivery_address}\nგთხოვთ, უპასუხოთ! ✅ ან ❌`

      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: driver.telegram_chat_id, text: message, parse_mode: 'HTML',
          reply_markup: { inline_keyboard: [[{ text: '✅ მივიღე', callback_data: `acc:${order.id}` }], [{ text: '❌ უარვყავი', callback_data: `rej:${order.id}` }]] }
        })
      })

      const result = await res.json()
      if (!result.ok) throw new Error(result.description)

      await supabase.from('notifications').insert({
        order_id: order.id,
        driver_id: order.driver_type === 'internal' ? driver.id : null,
        external_driver_id: order.driver_type === 'external' ? driver.id : null,
        title: '⏰ შეხსენება', message: 'გაგზავნილია ადმინის მიერ', channel: 'telegram', status: 'sent',
        metadata: { type: 'reminder', sent_by: 'admin' }, sent_at: new Date().toISOString()
      })

      alert('✅ შეხსენება გაგზავნილია!')
    } catch (err: any) {
      console.error('❌ Reminder failed:', err)
      alert(`შეცდომა: ${err.message}`)
    }
  }

  const sendEnRouteReminder = async (order: any) => {
    if (!confirm(`გავუგზავნოთ შეხსენება მძღოლს შეკვეთისთვის #${order.tracking_code}?`)) return

    const driverId = order.driver_type === 'external' ? order.external_driver_id : order.driver_id
    if (!driverId) { alert('მძღოლი არ არის მინიჭებული'); return }

    try {
      const { data: driver } = await supabase.from('drivers').select('id, telegram_chat_id, full_name').eq('id', driverId).single()
      if (!driver?.telegram_chat_id) { alert('⚠️ მძღოლს არ აქვს Telegram Chat ID'); return }

      const token = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN
      if (!token) throw new Error('Bot token missing')

      if (order.instruction_message_id) {
        try {
          const messageId = parseInt(order.instruction_message_id)
          if (!isNaN(messageId)) {
            await fetch(`https://api.telegram.org/bot${token}/editMessageReplyMarkup`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: driver.telegram_chat_id, message_id: messageId, reply_markup: { inline_keyboard: [] } })
            })
          }
        } catch (editErr) { console.warn('⚠️ Could not edit old message') }
      }

      const reminderMessage = `🔔 <b>შეხსენება!</b>\n\nშეკვეთა #${order.tracking_code} ჯერ კიდევ ლოდინშია.\nგთხოვთ, დააჭირეთ ქვემოთ მოცემულ ღილაკს, როცა რეალურად დაიძრებით მისამართზე:\n\n📍 ${order.pickup_address}`

      const newRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: driver.telegram_chat_id, text: reminderMessage, parse_mode: 'HTML',
          reply_markup: { inline_keyboard: [[{ text: '🚗 მივდივარ ატვირთვაზე', callback_data: `en_route:${order.id}` }]] }
        })
      })

      const newResult = await newRes.json()
      if (!newRes.ok) throw new Error(newResult.description)

      await supabase.from('orders').update({ instruction_message_id: newResult.result?.message_id?.toString() }).eq('id', order.id)
      alert('✅ შეხსენება გაგზავნილია!')
    } catch (err: any) {
      console.error('❌ En-route reminder failed:', err)
      alert(`შეცდომა: ${err.message}`)
    }
  }

  const handleSendInstructions = async () => {
    if (!instructionsOrder) return
    if (!instructionsText.trim()) { alert('გთხოვთ, შეიყვანოთ ინსტრუქცია'); return }

    setSendingInstructions(true)
    try {
      const order = instructionsOrder
      const driverId = order.driver_type === 'external' ? order.external_driver_id : order.driver_id
      if (!driverId) throw new Error('მძღოლი არ არის მინიჭებული')

      const { data: driver } = await supabase.from('drivers').select('id, telegram_chat_id, full_name').eq('id', driverId).single()
      if (!driver?.telegram_chat_id) throw new Error('მძღოლს არ აქვს Telegram Chat ID')

      const message = `📋 *დეტალური ინსტრუქცია შეკვეთისთვის #${order.tracking_code}*\n\n📍 მისამართი: ${order.pickup_address}\n${order.pickup_contact_person ? `👤 კონტაქტი: ${order.pickup_contact_person}\n` : ''}${order.pickup_phone ? `📞 ტელ: ${order.pickup_phone}\n` : ''}${order.scheduled_pickup_date ? `🕒 დრო: ${new Date(order.scheduled_pickup_date).toLocaleString('ka-GE')}\n` : ''}\n📝 დამატებითი შენიშვნები:\n${instructionsText}\n\nგთხოვთ, დაადასტუროთ რომ მიდიხართ:`

      const inline_keyboard = [[{ text: '🚗 მივდივარ ატვირთვაზე', callback_data: `en_route:${order.id}` }]]

      const token = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN
      if (!token) throw new Error('Bot token missing')

      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: driver.telegram_chat_id, text: message, parse_mode: 'Markdown', reply_markup: { inline_keyboard } })
      })

      const result = await res.json()
      if (!result.ok) throw new Error(result.description)

      const { error: updateError } = await supabase.from('orders').update({
        instructions_sent_at: new Date().toISOString(), instructions_content: instructionsText,
        instruction_message_id: result.result?.message_id?.toString()
      }).eq('id', order.id)

      if (updateError) throw updateError

      await supabase.from('notifications').insert({
        order_id: order.id,
        driver_id: order.driver_type === 'internal' ? driver.id : null,
        external_driver_id: order.driver_type === 'external' ? driver.id : null,
        title: '📋 ინსტრუქცია გაგზავნილია',
        message: `დისპეტჩერმა გაუგზავნა დეტალური ინსტრუქცია მძღოლს ${driver.full_name}`,
        channel: 'telegram', status: 'sent',
        metadata: { type: 'instructions', telegram_message_id: result.result?.message_id },
        sent_at: new Date().toISOString()
      })

      alert('✅ ინსტრუქცია გაგზავნილია!')
      setShowInstructionsModal(false)
      setInstructionsOrder(null)
      setInstructionsText('')
      if (loadData) loadData()
    } catch (err: any) {
      console.error('❌ Failed to send instructions:', err)
      alert(`შეცდომა: ${err.message}`)
    } finally {
      setSendingInstructions(false)
    }
  }

  const handleOpenInstructions = (order: any) => {
    setInstructionsOrder(order)
    setInstructionsText('')
    setShowInstructionsModal(true)
  }

  if (loading) return <LoadingTruck message="შეკვეთები იტვირთება..." size="md" />
  
  const filteredOrders = orders.filter(o => orderFilter === 'all' || o.status === orderFilter)

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
        if (timestamp.match(/^\d{4}-\d{2}-\d{2}$/)) return { date: timestamp, time: '' }
        return { date: '', time: '' }
      } catch { return { date: '', time: '' } }
    }
    const pickup = splitDateTime(order.scheduled_pickup_date)
    const delivery = splitDateTime(order.scheduled_delivery_date)
    return {
      pickup_address: order.pickup_address || '', pickup_date: pickup.date, pickup_time: pickup.time,
      pickup_contact: order.pickup_contact_person || '', pickup_phone: order.pickup_phone || '',
      delivery_address: order.delivery_address || '', delivery_date: delivery.date, delivery_time: delivery.time,
      delivery_contact: order.delivery_contact_person || '', delivery_phone: order.delivery_phone || '',
      cargo_description: order.cargo_description || '', cargo_type: order.cargo_type || 'standard',
      cargo_weight_kg: order.cargo_weight_kg?.toString() || '', cargo_volume_m3: order.cargo_volume_m3?.toString() || '',
      cargo_units: order.places_count?.toString() || order.cargo_units?.toString() || '',
      cargo_length_m: order.cargo_length_m?.toString() || '', cargo_width_m: order.cargo_width_m?.toString() || '',
      cargo_height_m: order.cargo_height_m?.toString() || '',
      packaging_type: order.packaging_type || 'box', returnable_packaging: !!order.returnable_packaging,
      price: order.price?.toString() || '', currency: order.currency || 'GEL',
      payment_terms: order.payment_terms || 'on_delivery', invoice_needed: !!order.invoice_needed,
      road_fee: order.road_fee?.toString() || '', outside_city_fee: order.outside_city_fee?.toString() || '',
      waiting_fee_per_hour: order.waiting_fee_per_hour?.toString() || '', extra_fees: order.extra_fees?.toString() || '',
      client_type: order.client_type || 'private', client_id: order.client_id || '',
      client_name: order.client_name || '', client_phone: order.client_phone || '',
      client_email: order.client_email || '', client_personal_id: order.client_personal_id || '',
      client_registration_number: order.client_registration_number || '', client_vat: order.client_vat || '',
      client_address: order.client_address || '',
      internal_notes: order.notes || order.internal_notes || '', special_requirements: order.special_requirements || '',
      needs_tail_lift: !!order.needs_tail_lift || !!order.requires_taillift,
      needs_straps: !!order.needs_straps, needs_bricklaying: !!order.needs_bricklaying,
      needs_two_cargo_handlers: !!order.needs_two_cargo_handlers,
      attachment: null, priority: order.priority || 'medium', status: order.status || 'pending',
      notify_client: order.notify_client !== false, tracking_code: order.tracking_code || '',
      created_at: order.created_at || new Date().toISOString(),
      driver_type: order.driver_type || 'internal', vehicle_type: order.vehicle_type || 'internal',
      driver_id: order.driver_id || '', external_driver_id: order.external_driver_id || '',
      vehicle_id: order.vehicle_id || '', external_vehicle_id: order.external_vehicle_id || '',
      external_driver_rate: order.external_driver_rate?.toString() || '0',
      external_vehicle_rate: order.external_vehicle_rate?.toString() || '0',
      transport_type: order.transport_type || '', container_number: order.container_number || '',
    }
  }

  const mapFormToDatabase = (form: any) => {
    const combineDateTime = (date: string, time: string) => {
      if (!date) return null
      if (time) return `${date}T${time}:00Z`
      return `${date}T00:00:00Z`
    }
    return {
      pickup_address: form.pickup_address || null, delivery_address: form.delivery_address || null,
      scheduled_pickup_date: combineDateTime(form.pickup_date, form.pickup_time),
      scheduled_delivery_date: combineDateTime(form.delivery_date, form.delivery_time),
      pickup_contact_person: form.pickup_contact || null, pickup_phone: form.pickup_phone || null,
      delivery_contact_person: form.delivery_contact || null, delivery_phone: form.delivery_phone || null,
      cargo_description: form.cargo_description || null, cargo_type: form.cargo_type || 'standard',
      cargo_weight_kg: parseFloat(form.cargo_weight_kg) || 0, cargo_volume_m3: parseFloat(form.cargo_volume_m3) || null,
      places_count: parseInt(form.cargo_units) || null,
      cargo_length_m: parseFloat(form.cargo_length_m) || null, cargo_width_m: parseFloat(form.cargo_width_m) || null,
      cargo_height_m: parseFloat(form.cargo_height_m) || null,
      packaging_type: form.packaging_type || 'box', returnable_packaging: !!form.returnable_packaging,
      price: parseFloat(form.price) || 0, currency: form.currency || 'GEL',
      payment_terms: form.payment_terms || 'on_delivery', invoice_needed: !!form.invoice_needed,
      road_fee: parseFloat(form.road_fee) || 0, outside_city_fee: parseFloat(form.outside_city_fee) || 0,
      waiting_fee_per_hour: parseFloat(form.waiting_fee_per_hour) || 0, extra_fees: parseFloat(form.extra_fees) || 0,
      client_type: form.client_type || 'private', client_name: form.client_name || null,
      client_phone: form.client_phone || null, client_email: form.client_email || null,
      client_personal_id: form.client_personal_id || null, client_registration_number: form.client_registration_number || null,
      client_vat: form.client_vat || null, client_address: form.client_address || null,
      client_id: form.client_id || null,
      notes: form.internal_notes || null, special_requirements: form.special_requirements || null,
      needs_tail_lift: !!form.needs_tail_lift, needs_straps: !!form.needs_straps,
      needs_bricklaying: !!form.needs_bricklaying, needs_two_cargo_handlers: !!form.needs_two_cargo_handlers,
      priority: form.priority || 'medium', status: form.status || 'pending', notify_client: !!form.notify_client,
      driver_type: form.driver_type || 'internal', vehicle_type: form.vehicle_type || 'internal',
      driver_id: form.driver_type === 'internal' ? (form.driver_id || null) : null,
      external_driver_id: form.driver_type === 'external' ? (form.external_driver_id || null) : null,
      vehicle_id: form.vehicle_type === 'internal' ? (form.vehicle_id || null) : null,
      external_vehicle_id: form.vehicle_type === 'external' ? (form.external_vehicle_id || null) : null,
      external_driver_rate: parseFloat(form.external_driver_rate) || 0,
      external_vehicle_rate: parseFloat(form.external_vehicle_rate) || 0,
      transport_type: form.transport_type || null, container_number: form.container_number || null,
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

  const handleSendNotification = async (channels: string[]) => {
    if (!notificationOrder) throw new Error('შეკვეთა არ არის არჩეული')
    const order = notificationOrder
    
    const driverId = order.driver_type === 'external' ? order.external_driver_id : order.driver_id
    if (!driverId) throw new Error('მძღოლი არ არის მინიჭებული')
    
    const { data: driver } = await supabase.from('drivers').select('id, telegram_chat_id, full_name').eq('id', driverId).single()
    
    if (!driver?.telegram_chat_id) {
      alert('⚠️ მძღოლს არ აქვს Telegram Chat ID')
      return { success: false, error: 'Chat ID missing' }
    }
    
    const chatId = driver.telegram_chat_id
    const token = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN
    if (!token) throw new Error('Bot token missing')
    
    const message = `🚛 <b>ახალი შეკვეთა მინიჭებულია!</b>\n\n📦 კოდი: <code>${order.tracking_code}</code>\n📍 მარშრუტი: ${order.pickup_address} → ${order.delivery_address}\n💰 თანხა: ${order.price} ${order.currency}`
    
    const reply_markup = {
      inline_keyboard: [[
        { text: '✅ მივიღე', callback_data: `acc:${order.id}` },
        { text: '❌ უარვყავი', callback_data: `rej:${order.id}` }
      ]]
    }
    
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML', disable_web_page_preview: true, reply_markup })
      })
      
      const result = await res.json()
      if (!result.ok) throw new Error(result.description)
      
      await supabase.from('notifications').insert({
        order_id: order.id,
        driver_id: order.driver_type === 'internal' ? driver.id : null,
        external_driver_id: order.driver_type === 'external' ? driver.id : null,
        title: '🚛 ახალი შეკვეთა', message: `შეტყობინება გაგზავნილია Telegram-ზე`,
        channel: 'telegram', status: 'sent',
        metadata: { chat_id: chatId, telegram_message_id: result.result?.message_id },
        sent_at: new Date().toISOString()
      })
      
      return { success: true }
    } catch (err: any) {
      console.error('❌ Notification failed:', err)
      return { success: false, error: err.message }
    }
  }

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
        
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} disabled={isRefreshing || !loadData}
            className={`p-2 rounded-lg transition flex items-center justify-center ${isRefreshing || !loadData ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-600 hover:bg-gray-500 text-gray-200'}`}
            title="მონაცემების განახლება">
            <RefreshIcon spinning={isRefreshing} />
          </button>
          
          {/* 🆕 ახალი შეკვეთის ღილაკი - ახლა აქ იხსნება მოდალი */}
          <button 
            onClick={handleAddClick} 
            className="bg-purple-600 hover:bg-purple-700 px-3 py-1.5 rounded text-[10px] font-semibold transition shadow-lg shadow-purple-500/20"
          >
            + ახალი
          </button>
        </div>
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
              <th className="px-4 py-3 text-left">მძღოლის პასუხი</th>
              <th className="px-4 py-3 text-left">ლოდინში</th>
              <th className="px-4 py-3 text-right">მოქმედება</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/30">
            {filteredOrders.map(o => {
              const minutesElapsed = Math.floor((new Date().getTime() - new Date(o.created_at).getTime()) / 60000)
              const waitingColor = minutesElapsed > 30 ? 'text-red-400 font-bold' : minutesElapsed > 15 ? 'text-amber-400' : 'text-gray-400'
              const canSendInstructions = o.status === 'confirmed' && o.driver_response === 'accepted' && !o.instructions_sent_at && (o.driver_id || o.external_driver_id)

              return (
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
                  <td className="px-4 py-3"><DriverResponseBadge order={o} /></td>
                  <td className={`px-4 py-3 text-[10px] ${waitingColor}`}>
                    {o.status === 'pending' && !o.driver_response ? <span title="წუთები ლოდინში">{minutesElapsed} წთ</span> : <span className="text-gray-600">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end items-center gap-1">
                      <button onClick={() => handleEditClick(o)} className="p-1.5 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-md transition" title="რედაქტირება">✏️</button>
                      <button onClick={() => handlePreviewClick(o)} className="p-1.5 text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 rounded-md transition" title="Preview">👁️</button>
                      <button onClick={() => handleOpenNotification(o)} className="p-1.5 text-teal-400 bg-teal-500/10 hover:bg-teal-500/20 rounded-md transition" title="შეტყობინების გაგზავნა">📢</button>
                      <button onClick={() => handleInvoiceClick(o)} className="p-1.5 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-md transition" title="ინვოისის შექმნა">🧾</button>
                      
                      {canSendInstructions && (
                        <button onClick={() => handleOpenInstructions(o)} className="p-1.5 text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 rounded-md transition" title="გაგზავნა ინსტრუქცია">
                          <InstructionsIcon />
                        </button>
                      )}
                      
                      {o.instructions_sent_at && !o.en_route_at && o.driver_response === 'accepted' && (
                        <button onClick={() => sendEnRouteReminder(o)} className="p-1.5 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 rounded-md transition" title="გაგზავნა შეხსენება: მიდიხარ?">🔔</button>
                      )}
                      
                      {o.status === 'pending' && !o.driver_response && o.driver_id && (
                        <button onClick={() => sendReminder(o)} className="p-1.5 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 rounded-md transition" title="გაგზავნა შეხსენება">
                          <ReminderIcon />
                        </button>
                      )}
                      <button onClick={() => handleDeleteClick(o)} className="p-1.5 text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-md transition" title="წაშლა">🗑️</button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filteredOrders.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">შეკვეთები არ არის</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 📋 Instructions Modal */}
      {showInstructionsModal && instructionsOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowInstructionsModal(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white">📋 ინსტრუქციის გაგზავნა</h3>
                <p className="text-sm text-gray-400">შეკვეთა: <span className="font-mono text-cyan-400">{instructionsOrder.tracking_code}</span></p>
              </div>
              <button onClick={() => setShowInstructionsModal(false)} className="p-2 text-gray-400 hover:text-white transition">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 space-y-2">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">📦 შეკვეთის დეტალები</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">მარშრუტი:</span><br/><span className="text-white">{instructionsOrder.pickup_address} → {instructionsOrder.delivery_address}</span></div>
                  <div><span className="text-gray-500">დრო:</span><br/><span className="text-white">{instructionsOrder.scheduled_pickup_date ? new Date(instructionsOrder.scheduled_pickup_date).toLocaleString('ka-GE') : '–'}</span></div>
                  <div><span className="text-gray-500">ტვირთი:</span><br/><span className="text-white">{instructionsOrder.cargo_description}</span></div>
                  <div><span className="text-gray-500">ფასი:</span><br/><span className="text-white font-medium">{instructionsOrder.price} {instructionsOrder.currency}</span></div>
                  <div><span className="text-gray-500">კონტაქტი:</span><br/><span className="text-white">{instructionsOrder.pickup_contact_person || '–'} {instructionsOrder.pickup_phone ? `(${instructionsOrder.pickup_phone})` : ''}</span></div>
                  <div><span className="text-gray-500">მძღოლი:</span><br/><span className="text-white">{instructionsOrder.drivers?.full_name || instructionsOrder.external_drivers?.full_name || '–'}</span></div>
                </div>
                {instructionsOrder.internal_notes && (
                  <div className="pt-2 border-t border-gray-700">
                    <span className="text-gray-500 text-xs">📝 შიდა შენიშვნა:</span>
                    <p className="text-sm text-gray-300 mt-1">{instructionsOrder.internal_notes}</p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">✍️ დამატებითი ინსტრუქცია მძღოლისთვის (აუცილებელი)</label>
                <textarea
                  value={instructionsText}
                  onChange={(e) => setInstructionsText(e.target.value)}
                  placeholder="მაგალითად:• შესასვლელი: მთავარი კარი, მე-3 სართული• პარკინგი: #5, სატვირთოების ზონა• კონტაქტი ადგილზე: გიორგი 555 123 456"
                  className="w-full h-32 px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white outline-none focus:border-cyan-500 transition placeholder-gray-500 resize-none"
                />
                <p className="text-[10px] text-gray-500 mt-1">💡 მძღოლი მიიღებს ამ ტექსტს + ღილაკს "[🚗 მივდივარ ატვირთვაზე]"</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-700 flex justify-end gap-3">
              <button onClick={() => setShowInstructionsModal(false)} className="px-4 py-2 text-gray-400 hover:text-white transition text-sm">გაუქმება</button>
              <button onClick={handleSendInstructions} disabled={sendingInstructions || !instructionsText.trim()}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${sendingInstructions || !instructionsText.trim() ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_16px_rgba(34,211,238,0.3)]'}`}>
                {sendingInstructions ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />იგზავნება...</>) : (<>📤 გაგზავნა</>)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🆕 ADD ORDER MODAL - ახლა აქვეა კლიენტების მონაცემებით */}
      {showAddModal && (
        <AddOrderModal 
          isOpen={showAddModal} 
          onClose={() => { setShowAddModal(false); setNewOrderForm(getInitialOrderForm()) }} 
          orderForm={newOrderForm} 
          setOrderForm={setNewOrderForm} 
          onSubmit={handleAddSubmit}
          clients={privateClients}
          companies={companiesList}
        />
      )}

      {/* EDIT ORDER MODAL - კლიენტების მონაცემებით */}
      {showEditModal && editingOrder && (
        <AddOrderModal 
          isOpen={showEditModal} 
          onClose={() => { setShowEditModal(false); setEditingOrder(null) }} 
          orderForm={editingOrder} 
          setOrderForm={setEditingOrder} 
          onSubmit={handleEditSave}
          clients={privateClients}
          companies={companiesList}
        />
      )}

      {showPreviewModal && previewOrder && (
        <OrderPreviewModal isOpen={showPreviewModal} onClose={() => { setShowPreviewModal(false); setPreviewOrder(null) }} order={previewOrder} />
      )}
      {showNotificationModal && notificationOrder && (
        <SendNotificationModal isOpen={showNotificationModal} onClose={() => { setShowNotificationModal(false); setNotificationOrder(null) }} order={notificationOrder} onSend={handleSendNotification} logs={[]} />
      )}
      <CreateInvoiceModal 
        isOpen={showInvoiceModal} 
        onClose={() => { setShowInvoiceModal(false); setSelectedOrderForInvoice(null) }} 
        order={selectedOrderForInvoice} 
        onSuccess={() => { if (loadData) loadData() }} 
      />
    </div>
  )
}