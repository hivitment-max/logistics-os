import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

interface UseOrdersProps {
  showNotification: (msg: string) => void
  loadData: () => Promise<void>
  logAudit: (action: string, target: string, details: string) => Promise<void>
  externalDrivers: any[]
  externalVehicles: any[]
  privateClients: any[]
  companies: any[]
}

export function useOrders({ 
  showNotification, 
  loadData, 
  logAudit,
  externalDrivers,
  externalVehicles,
  privateClients,
  companies
}: UseOrdersProps) {
  // 📦 Modal States
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [editingOrder, setEditingOrder] = useState<any | null>(null)
  const [showEditOrderModal, setShowEditOrderModal] = useState(false)
  const [editOrderForm, setEditOrderForm] = useState<any>({})
  const [deletingOrder, setDeletingOrder] = useState<any | null>(null)
  const [showDeleteOrderModal, setShowDeleteOrderModal] = useState(false)
  const [orderFilter, setOrderFilter] = useState('all')

  // 📝 Add Form State - სრული ვერსია (ფორმის ველები)
  const initialOrderForm = {
    // 🔴 მარშრუტი
    pickup_address: '',
    pickup_date: '',
    pickup_time: '',
    pickup_contact: '',
    pickup_phone: '',
    delivery_address: '',
    delivery_date: '',
    delivery_time: '',
    delivery_contact: '',
    delivery_phone: '',
    
    // 🟡 ტვირთი
    cargo_description: '',
    cargo_type: 'standard',
    cargo_weight_kg: '',
    cargo_volume_m3: '',
    cargo_units: '',
    cargo_length_m: '',
    cargo_width_m: '',
    cargo_height_m: '',
    packaging_type: 'box',
    returnable_packaging: false,
    
    // 🔵 ფინანსები
    price: '',
    currency: 'GEL',
    payment_terms: 'on_delivery',
    invoice_needed: false,
    road_fee: '',
    outside_city_fee: '',
    waiting_fee_per_hour: '',
    extra_fees: '',
    
    // 🟣 დამკვეთი
    client_type: 'private',
    client_id: '',
    client_name: '',
    client_phone: '',
    client_email: '',
    client_personal_id: '',
    client_registration_number: '',
    client_vat: '',
    client_address: '',
    
    // 🟢 დამატებითი
    internal_notes: '',
    special_requirements: '',
    needs_tail_lift: false,
    needs_straps: false,
    needs_bricklaying: false,
    needs_two_cargo_handlers: false,
    attachment: null,
    
    // 🟤 პრიორიტეტი & სტატუსი
    priority: 'medium',
    status: 'pending',
    notify_client: true,
    
    // 🤖 სისტემური (ავტომატური)
    tracking_code: '',
    created_at: new Date().toISOString(),
    
    // 🚛 მძღოლი/მანქანა
    driver_type: 'internal',
    vehicle_type: 'internal',
    driver_id: '',
    external_driver_id: '',
    vehicle_id: '',
    external_vehicle_id: '',
    external_driver_rate: 0,
    external_vehicle_rate: 0,
  }

  const [orderForm, setOrderForm] = useState(initialOrderForm)

  // 🔄 Helper: ფორმის რესეტი
  const resetOrderForm = useCallback(() => {
    setOrderForm({ ...initialOrderForm, created_at: new Date().toISOString() })
  }, [])

  // 🎯 Helper: ფორმის მონაცემების გადაქცევა ბაზის ფორმატში (მიმაპინგი)
  const mapFormToDatabase = useCallback((form: any) => {
    const combineDateTime = (date: string, time: string) => {
      if (!date) return null
      if (time) return `${date}T${time}:00Z`
      return `${date}T00:00:00Z`
    }

    return {
      // 🔴 მარშრუტი
      pickup_address: form.pickup_address || null,
      pickup_contact_person: form.pickup_contact || null,
      pickup_phone: form.pickup_phone || null,
      scheduled_pickup_date: combineDateTime(form.pickup_date, form.pickup_time),
      delivery_address: form.delivery_address || null,
      delivery_contact_person: form.delivery_contact || null,
      delivery_phone: form.delivery_phone || null,
      scheduled_delivery_date: combineDateTime(form.delivery_date, form.delivery_time),
      pickup_city: form.pickup_city || null,
      delivery_city: form.delivery_city || null,
      
      // 🟡 ტვირთი
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
      volume_m3: parseFloat(form.cargo_volume_m3) || null,
      hs_code: form.hs_code || null,
      incoterm: form.incoterm || 'EXW',
      declared_value: parseFloat(form.declared_value) || null,
      is_dangerous: form.cargo_type === 'adr' || !!form.is_dangerous,
      is_hazardous: form.cargo_type === 'adr' || !!form.is_hazardous,
      is_temp_controlled: form.cargo_type === 'refrigerated' || !!form.is_temp_controlled,
      temperature_range: form.temperature_range || null,
      body_type: form.body_type || null,
      is_oversized: !!form.is_oversized,
      route_stops: form.route_stops || [],
      
      // 🔵 ფინანსები
      price: parseFloat(form.price) || 0,
      currency: form.currency || 'GEL',
      payment_terms: form.payment_terms || 'on_delivery',
      invoice_needed: !!form.invoice_needed,
      road_fee: parseFloat(form.road_fee) || 0,
      outside_city_fee: parseFloat(form.outside_city_fee) || 0,
      waiting_fee_per_hour: parseFloat(form.waiting_fee_per_hour) || 0,
      extra_fees: parseFloat(form.extra_fees) || 0,
      
      // 🟣 დამკვეთი
      client_type: form.client_type || 'private',
      client_name: form.client_name || null,
      client_phone: form.client_phone || null,
      client_email: form.client_email || null,
      client_address: form.client_address || null,
      client_personal_id: form.client_personal_id || null,
      client_registration_number: form.client_registration_number || null,
      client_vat: form.client_vat || null,
      client_id: form.client_id || null,
      notify_party_name: form.notify_party_name || null,
      notify_party_phone: form.notify_party_phone || null,
      
      // 🟢 დამატებითი
      notes: form.internal_notes || null,
      special_requirements: form.special_requirements || null,
      needs_tail_lift: !!form.needs_tail_lift,
      needs_straps: !!form.needs_straps,
      needs_bricklaying: !!form.needs_bricklaying,
      needs_two_cargo_handlers: !!form.needs_two_cargo_handlers,
      requires_taillift: !!form.needs_tail_lift,
      is_hard_deadline: !!form.is_hard_deadline,
      
      // 🟤 პრიორიტეტი & სტატუსი
      priority: form.priority || 'medium',
      status: form.status || 'pending',
      notify_client: !!form.notify_client,
      
      // 🤖 სისტემური
      tracking_code: form.tracking_code,
      created_by: form.created_by || null,
      created_at: form.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      
      // 🚛 მძღოლი/მანქანა
      driver_type: form.driver_type || 'internal',
      vehicle_type: form.vehicle_type || 'internal',
      driver_id: form.driver_type === 'internal' ? (form.driver_id || null) : null,
      external_driver_id: form.driver_type === 'external' ? (form.external_driver_id || null) : null,
      vehicle_id: form.vehicle_type === 'internal' ? (form.vehicle_id || null) : null,
      external_vehicle_id: form.vehicle_type === 'external' ? (form.external_vehicle_id || null) : null,
      external_driver_rate: parseFloat(form.external_driver_rate) || 0,
      external_vehicle_rate: parseFloat(form.external_vehicle_rate) || 0,
      assigned_at: form.assigned_at || null,
    }
  }, [])

  // 🎯 Helper: ბაზის მონაცემების გადაქცევა ფორმის ფორმატში (რევერს-მიმაპინგი)
  const mapDatabaseToForm = useCallback((db: any) => {
    const splitDateTime = (timestamp: string | null) => {
      if (!timestamp) return { date: '', time: '' }
      const date = timestamp.split('T')[0]
      const time = timestamp.split('T')[1]?.split('.')[0] || ''
      return { date, time }
    }

    const pickup = splitDateTime(db.scheduled_pickup_date)
    const delivery = splitDateTime(db.scheduled_delivery_date)

    return {
      // 🔴 მარშრუტი
      pickup_address: db.pickup_address || '',
      pickup_date: pickup.date,
      pickup_time: pickup.time,
      pickup_contact: db.pickup_contact_person || '',
      pickup_phone: db.pickup_phone || '',
      delivery_address: db.delivery_address || '',
      delivery_date: delivery.date,
      delivery_time: delivery.time,
      delivery_contact: db.delivery_contact_person || '',
      delivery_phone: db.delivery_phone || '',
      pickup_city: db.pickup_city || '',
      delivery_city: db.delivery_city || '',
      
      // 🟡 ტვირთი
      cargo_description: db.cargo_description || '',
      cargo_type: db.cargo_type || 'standard',
      cargo_weight_kg: db.cargo_weight_kg?.toString() || '',
      cargo_volume_m3: db.cargo_volume_m3?.toString() || '',
      cargo_units: db.places_count?.toString() || '',
      cargo_length_m: db.cargo_length_m?.toString() || '',
      cargo_width_m: db.cargo_width_m?.toString() || '',
      cargo_height_m: db.cargo_height_m?.toString() || '',
      packaging_type: db.packaging_type || 'box',
      returnable_packaging: !!db.returnable_packaging,
      volume_m3: db.volume_m3?.toString() || '',
      hs_code: db.hs_code || '',
      incoterm: db.incoterm || 'EXW',
      declared_value: db.declared_value?.toString() || '',
      is_dangerous: !!db.is_dangerous,
      is_hazardous: !!db.is_hazardous,
      is_temp_controlled: !!db.is_temp_controlled,
      temperature_range: db.temperature_range || '',
      body_type: db.body_type || '',
      is_oversized: !!db.is_oversized,
      route_stops: db.route_stops || [],
      
      // 🔵 ფინანსები
      price: db.price?.toString() || '',
      currency: db.currency || 'GEL',
      payment_terms: db.payment_terms || 'on_delivery',
      invoice_needed: !!db.invoice_needed,
      road_fee: db.road_fee?.toString() || '',
      outside_city_fee: db.outside_city_fee?.toString() || '',
      waiting_fee_per_hour: db.waiting_fee_per_hour?.toString() || '',
      extra_fees: db.extra_fees?.toString() || '',
      
      // 🟣 დამკვეთი
      client_type: db.client_type || 'private',
      client_name: db.client_name || '',
      client_phone: db.client_phone || '',
      client_email: db.client_email || '',
      client_address: db.client_address || '',
      client_personal_id: db.client_personal_id || '',
      client_registration_number: db.client_registration_number || '',
      client_vat: db.client_vat || '',
      client_id: db.client_id || '',
      notify_party_name: db.notify_party_name || '',
      notify_party_phone: db.notify_party_phone || '',
      
      // 🟢 დამატებითი
      internal_notes: db.notes || '',
      special_requirements: db.special_requirements || '',
      needs_tail_lift: !!db.needs_tail_lift,
      needs_straps: !!db.needs_straps,
      needs_bricklaying: !!db.needs_bricklaying,
      needs_two_cargo_handlers: !!db.needs_two_cargo_handlers,
      requires_taillift: !!db.requires_taillift,
      is_hard_deadline: !!db.is_hard_deadline,
      
      // 🟤 პრიორიტეტი & სტატუსი
      priority: db.priority || 'medium',
      status: db.status || 'pending',
      notify_client: !!db.notify_client,
      
      // 🤖 სისტემური
      tracking_code: db.tracking_code || '',
      created_at: db.created_at || new Date().toISOString(),
      updated_at: db.updated_at || new Date().toISOString(),
      created_by: db.created_by || null,
      
      // 🚛 მძღოლი/მანქანა
      driver_type: db.driver_type || 'internal',
      vehicle_type: db.vehicle_type || 'internal',
      driver_id: db.driver_id || '',
      external_driver_id: db.external_driver_id || '',
      vehicle_id: db.vehicle_id || '',
      external_vehicle_id: db.external_vehicle_id || '',
      external_driver_rate: db.external_driver_rate?.toString() || '0',
      external_vehicle_rate: db.external_vehicle_rate?.toString() || '0',
      assigned_at: db.assigned_at || null,
    }
  }, [])

  // 🔧 Handlers
  const handleAddOrder = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    const requiredFields = ['pickup_address', 'delivery_address', 'cargo_description', 'price', 'client_name', 'client_phone']
    for (const field of requiredFields) {
      if (!orderForm[field as keyof typeof orderForm]?.toString().trim()) {
        showNotification(`❌ ველი "${field}" სავალდებულოა`)
        return
      }
    }
    
    const tracking_code = `LOG-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`
    
    let extDriverRate = 0, extVehicleRate = 0
    if (orderForm.driver_type === 'external' && orderForm.external_driver_id) { 
      const d = externalDrivers.find((d: any) => d.id === orderForm.external_driver_id); 
      extDriverRate = d?.rate_per_km || 0 
    }
    if (orderForm.vehicle_type === 'external' && orderForm.external_vehicle_id) { 
      const v = externalVehicles.find((v: any) => v.id === orderForm.external_vehicle_id); 
      extVehicleRate = v?.rate_per_km || 0 
    }
    
    let finalClientName = orderForm.client_name
    let finalClientEmail = orderForm.client_email
    let finalClientAddress = orderForm.client_address
    let finalClientId = orderForm.client_id || null
    
    if (orderForm.client_id) {
      if (orderForm.client_type === 'private') { 
        const client = privateClients.find((c: any) => c.id === orderForm.client_id); 
        if (client) { 
          finalClientName = client.full_name || client.name; 
          finalClientEmail = client.email; 
          finalClientAddress = client.address 
        } 
      } else { 
        const company = companies.find((c: any) => c.id === orderForm.client_id); 
        if (company) { 
          finalClientName = company.name; 
          finalClientEmail = company.email; 
          finalClientAddress = company.legal_address 
        } 
      }
    }
    
    const payload = mapFormToDatabase({ 
      ...orderForm, 
      tracking_code,
      client_name: finalClientName,
      client_email: finalClientEmail,
      client_address: finalClientAddress,
      client_id: finalClientId,
      external_driver_rate: extDriverRate,
      external_vehicle_rate: extVehicleRate,
    })
    
    const { error, data } = await supabase.from('orders').insert([payload]).select()
    if (error) { 
      console.error('Order insert error:', error)
      showNotification(`❌ შეცდომა: ${error.message}`); 
      return 
    }
    
    await supabase.from('tracking_events').insert({ 
      order_id: data?.[0]?.id, 
      event_type: 'created', 
      location_name: 'ადმინ პანელი', 
      notes: `შეკვეთა შეიქმნა: ${orderForm.cargo_description}`,
      created_at: new Date().toISOString()
    })
    
    await logAudit('ORDER_CREATED', tracking_code, `შეიქმნა ადმინისტრატორის მიერ | მარშრუტი: ${orderForm.pickup_address} → ${orderForm.delivery_address}`)
    
    showNotification(`✅ შეკვეთა შეიქმნა: ${tracking_code}`)
    setShowOrderModal(false)
    resetOrderForm()
    loadData()
  }, [orderForm, externalDrivers, externalVehicles, privateClients, companies, showNotification, loadData, logAudit, resetOrderForm, mapFormToDatabase])

  const handleEditOrderClick = useCallback((order: any) => {
    setEditingOrder(order)
    setEditOrderForm(mapDatabaseToForm(order))
    setShowEditOrderModal(true)
  }, [mapDatabaseToForm])

  // ✅ FIX: TypeScript error - removed destructuring of id from payload
  const handleSaveEditOrder = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingOrder) return
    
    // 🔄 მიმაპინგი ფორმა → ბაზა
    const payload = mapFormToDatabase(editOrderForm)
    
    // ✅ FIX: payload already has correct format for update, no need to destructure id
    // mapFormToDatabase doesn't return id/tracking_code/created_at, so we use editingOrder?.id directly
    const { error } = await supabase.from('orders').update(payload).eq('id', editingOrder?.id)
    
    if (error) { 
      console.error('Order update error:', error)
      showNotification(`❌ ${error.message}`); 
      return 
    }
    
    await logAudit('ORDER_UPDATED', editingOrder?.tracking_code || 'unknown', `განახლდა ადმინისტრატორის მიერ`)
    showNotification('✅ შეკვეთა განახლდა!')
    setShowEditOrderModal(false)
    setEditingOrder(null)
    loadData()
  }, [editingOrder, editOrderForm, showNotification, loadData, logAudit, mapFormToDatabase])

  const handleDeleteOrderClick = useCallback((order: any) => {
    setDeletingOrder(order)
    setShowDeleteOrderModal(true)
  }, [])

  const confirmDeleteOrder = useCallback(async () => {
    if (!deletingOrder) return
    
    const { error } = await supabase.from('orders').delete().eq('id', deletingOrder.id)
    if (error) { 
      showNotification(`❌ ${error.message}`); 
      return 
    }
    
    await logAudit('ORDER_DELETED', deletingOrder.tracking_code, `წაიშალა ადმინისტრატორის მიერ`)
    showNotification('🗑️ შეკვეთა წაიშალა!')
    setShowDeleteOrderModal(false)
    setDeletingOrder(null)
    loadData()
  }, [deletingOrder, showNotification, loadData, logAudit])

  const handleStatusChange = useCallback(async (orderId: string, newStatus: string) => {
    const { error } = await supabase.from('orders').update({ 
      status: newStatus,
      updated_at: new Date().toISOString()
    }).eq('id', orderId)
    
    if (error) { 
      showNotification(`❌ ${error.message}`); 
      return 
    }
    
    await supabase.from('tracking_events').insert({
      order_id: orderId,
      event_type: 'status_change',
      location_name: 'ადმინ პანელი',
      notes: `სტატუსი შეიცვალა: ${newStatus}`,
      created_at: new Date().toISOString()
    })
    
    showNotification(`✅ სტატუსი განახლდა: ${newStatus}`)
    loadData()
  }, [showNotification, loadData])

  // 🎯 Public API
  return {
    // Modal States
    showOrderModal, setShowOrderModal,
    showEditOrderModal, setShowEditOrderModal,
    showDeleteOrderModal, setShowDeleteOrderModal,
    editingOrder, setEditingOrder,
    editOrderForm, setEditOrderForm,
    deletingOrder, setDeletingOrder,
    orderFilter, setOrderFilter,
    
    // Form
    orderForm, setOrderForm,
    resetOrderForm,
    
    // Handlers
    handleAddOrder,
    handleEditOrderClick,
    handleSaveEditOrder,
    handleDeleteOrderClick,
    confirmDeleteOrder,
    handleStatusChange,
    
    // Helpers
    mapFormToDatabase,
    mapDatabaseToForm,
  }
}