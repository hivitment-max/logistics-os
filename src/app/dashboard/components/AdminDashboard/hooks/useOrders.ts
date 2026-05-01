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

  // 📝 Add Form State
  const [orderForm, setOrderForm] = useState({
    pickup_address: '', delivery_address: '', cargo_description: '', cargo_weight_kg: '', price: '', currency: 'GEL',
    driver_type: 'internal', driver_id: '', external_driver_id: '', vehicle_type: 'internal', vehicle_id: '', external_vehicle_id: '',
    client_type: 'private', client_id: '', client_name: '', client_email: '', client_address: '', client_personal_id: '', client_registration_number: '', notes: ''
  })

  // 🔧 Handlers
  const handleAddOrder = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    const tracking_code = `LOG-${Date.now().toString().slice(-6)}`
    let extDriverRate = 0, extVehicleRate = 0
    if (orderForm.driver_type === 'external' && orderForm.external_driver_id) { 
      const d = externalDrivers.find((d: any) => d.id === orderForm.external_driver_id); 
      extDriverRate = d?.rate_per_km || 0 
    }
    if (orderForm.vehicle_type === 'external' && orderForm.external_vehicle_id) { 
      const v = externalVehicles.find((v: any) => v.id === orderForm.external_vehicle_id); 
      extVehicleRate = v?.rate_per_km || 0 
    }
    
    let finalClientName = orderForm.client_name, finalClientEmail = orderForm.client_email, finalClientAddress = orderForm.client_address, finalClientId = orderForm.client_id || null
    if (orderForm.client_id) {
      if (orderForm.client_type === 'private') { 
        const client = privateClients.find((c: any) => c.id === orderForm.client_id); 
        if (client) { finalClientName = client.full_name; finalClientEmail = client.email; finalClientAddress = client.address } 
      } else { 
        const company = companies.find((c: any) => c.id === orderForm.client_id); 
        if (company) { finalClientName = company.name; finalClientEmail = company.email; finalClientAddress = company.legal_address } 
      }
    }
    
    const payload = { 
      pickup_address: orderForm.pickup_address, delivery_address: orderForm.delivery_address, 
      cargo_description: orderForm.cargo_description, 
      cargo_weight_kg: parseFloat(orderForm.cargo_weight_kg as string) || 0, 
      price: parseFloat(orderForm.price as string) || 0, currency: orderForm.currency, 
      client_name: finalClientName, client_email: finalClientEmail, client_address: finalClientAddress, 
      notes: orderForm.notes, tracking_code, status: 'pending', 
      driver_type: orderForm.driver_type, vehicle_type: orderForm.vehicle_type,
      driver_id: orderForm.driver_type === 'internal' ? orderForm.driver_id || null : null,
      external_driver_id: orderForm.driver_type === 'external' ? orderForm.external_driver_id || null : null,
      vehicle_id: orderForm.vehicle_type === 'internal' ? orderForm.vehicle_id || null : null,
      external_vehicle_id: orderForm.vehicle_type === 'external' ? orderForm.external_vehicle_id || null : null,
      external_driver_rate: extDriverRate, external_vehicle_rate: extVehicleRate, 
      client_id: finalClientId 
    }
    
    const { error } = await supabase.from('orders').insert([payload])
    if (error) { showNotification(`❌ ${error.message}`); return }
    
    await supabase.from('tracking_events').insert({ order_id: tracking_code, event_type: 'created', location_name: 'ადმინ პანელი', notes: `შეკვეთა შეიქმნა: ${orderForm.cargo_description}` })
    await logAudit('ORDER_CREATED', tracking_code, `შეიქმნა ადმინისტრატორის მიერ`)
    showNotification(`✅ შეკვეთა შეიქმნა: ${tracking_code}`); setShowOrderModal(false)
    setOrderForm({ pickup_address: '', delivery_address: '', cargo_description: '', cargo_weight_kg: '', price: '', currency: 'GEL', driver_type: 'internal', driver_id: '', external_driver_id: '', vehicle_type: 'internal', vehicle_id: '', external_vehicle_id: '', client_type: 'private', client_id: '', client_name: '', client_email: '', client_address: '', client_personal_id: '', client_registration_number: '', notes: '' })
    loadData()
  }, [orderForm, externalDrivers, externalVehicles, privateClients, companies, showNotification, loadData, logAudit])

  const handleEditOrderClick = useCallback((order: any) => {
    setEditingOrder(order); setEditOrderForm({ ...order }); setShowEditOrderModal(true)
  }, [])

  const handleSaveEditOrder = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingOrder) return
    const { drivers: _d, vehicles: _v, created_at: _ca, updated_at: _ua, id: _id, tracking_code: _tc, ...cleanForm } = editOrderForm
    const payload = { 
      ...cleanForm, 
      cargo_weight_kg: parseFloat(cleanForm.cargo_weight_kg as string) || 0, 
      price: parseFloat(cleanForm.price as string) || 0, 
      driver_id: cleanForm.driver_id || null, 
      vehicle_id: cleanForm.vehicle_id || null, 
      client_id: cleanForm.client_id || null 
    }
    const { error } = await supabase.from('orders').update(payload).eq('id', editingOrder.id)
    if (error) { showNotification(`❌ ${error.message}`); return }
    await logAudit('ORDER_UPDATED', editingOrder.tracking_code, `განახლდა`); 
    showNotification('✅ განახლდა!'); setShowEditOrderModal(false); setEditingOrder(null); loadData()
  }, [editingOrder, editOrderForm, showNotification, loadData, logAudit])

  const handleDeleteOrderClick = useCallback((order: any) => {
    setDeletingOrder(order); setShowDeleteOrderModal(true)
  }, [])

  const confirmDeleteOrder = useCallback(async () => {
    if (!deletingOrder) return
    const { error } = await supabase.from('orders').delete().eq('id', deletingOrder.id)
    if (error) { showNotification(`❌ ${error.message}`); return }
    await logAudit('ORDER_DELETED', deletingOrder.tracking_code, `წაიშალა`); 
    showNotification('🗑️ შეკვეთა წაიშალა!'); setShowDeleteOrderModal(false); setDeletingOrder(null); loadData()
  }, [deletingOrder, showNotification, loadData, logAudit])

  const handleStatusChange = useCallback(async (orderId: string, newStatus: string) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
    if (error) { showNotification(`❌ ${error.message}`); return }
    // Note: orders list would need to be passed or fetched here for tracking_events
    showNotification(`✅ სტატუსი: ${newStatus}`); loadData()
  }, [showNotification, loadData])

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
    // Handlers
    handleAddOrder,
    handleEditOrderClick,
    handleSaveEditOrder,
    handleDeleteOrderClick,
    confirmDeleteOrder,
    handleStatusChange
  }
}