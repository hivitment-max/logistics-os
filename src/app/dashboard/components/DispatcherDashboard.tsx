'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import FleetManagement from './FleetManagement'

export default function DispatcherDashboard({ user, setNotification }: { 
  user: any, setNotification: (n: { type: 'success' | 'error'; message: string }) => void 
}) {
  const [activeTab, setActiveTab] = useState<'orders' | 'route' | 'live' | 'chat' | 'docs' | 'fleet'>('orders')
  const [orders, setOrders] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // ფილტრები
  const [filters, setFilters] = useState({ status: '', search: '' })
  
  // მოდალები & სელექცია
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showChatModal, setShowChatModal] = useState(false)
  const [showDocModal, setShowDocModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [orderForm, setOrderForm] = useState<any>({ stops: [{ address: '' }] })
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [chatInput, setChatInput] = useState('')

  // 📊 მონაცემების ჩატვირთვა
  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [ordersRes, driversRes, vehiclesRes] = await Promise.all([
        supabase.from('orders').select(`*, drivers(full_name, phone), vehicles(plate_number)`).order('created_at', { ascending: false }),
        supabase.from('drivers').select('*'),
        supabase.from('vehicles').select('*')
      ])
      if (ordersRes.data) setOrders(ordersRes.data)
      if (driversRes.data) setDrivers(driversRes.data)
      if (vehiclesRes.data) setVehicles(vehiclesRes.data)
    } catch (err: any) {
      setNotification({ type: 'error', message: `❌ ${err.message}` })
    } finally {
      setLoading(false)
    }
  }

  // 🔍 ფილტრაცია
  const filteredOrders = orders.filter(o => {
    const matchStatus = !filters.status || o.status === filters.status
    const matchSearch = !filters.search || 
      o.tracking_code?.toLowerCase().includes(filters.search.toLowerCase()) ||
      o.pickup_address?.toLowerCase().includes(filters.search.toLowerCase()) ||
      o.cargo_description?.toLowerCase().includes(filters.search.toLowerCase())
    return matchStatus && matchSearch
  })

  // ➕ შეკვეთის შექმნა
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const tracking_code = `LOG-${Date.now().toString().slice(-6)}`
      const { error } = await supabase.from('orders').insert([{
        ...orderForm,
        tracking_code,
        status: 'pending',
        route_stops: orderForm.stops.filter((s: any) => s.address.trim() !== '').map((s: any) => s.address),
        cargo_weight_kg: parseFloat(orderForm.cargo_weight_kg) || 0,
        pickup_address: orderForm.stops[0]?.address || '',
        delivery_address: orderForm.stops[orderForm.stops.length - 1]?.address || ''
      }])
      if (error) throw error
      setNotification({ type: 'success', message: '✅ შეკვეთა შეიქმნა!' })
      setShowOrderModal(false)
      setOrderForm({ stops: [{ address: '' }] })
      fetchData()
    } catch (err: any) {
      setNotification({ type: 'error', message: `❌ ${err.message}` })
    }
  }

  // 🚛 მძღოლის მინიჭება (ხელით ან ავტო)
  const handleAssign = async (auto = false) => {
    if (!selectedOrder) return
    let driverId = selectedOrder.driver_id
    
    if (auto) {
      const available = drivers.find(d => d.is_available)
      if (!available) {
        setNotification({ type: 'error', message: '❌ თავისუფალი მძღოლი არ არის!' })
        return
      }
      driverId = available.id
    }

    try {
      const { error } = await supabase.from('orders').update({ 
        driver_id: driverId, 
        status: driverId ? 'in_transit' : 'pending' 
      }).eq('id', selectedOrder.id)
      
      if (error) throw error
      
      await supabase.from('tracking_events').insert({
        order_id: selectedOrder.id,
        event_type: 'assigned',
        location_name: 'დისპეტჩერი',
        notes: driverId ? `მინიჭებული: ${drivers.find(d => d.id === driverId)?.full_name}` : 'მინიჭება მოხსნილი'
      })

      setNotification({ type: 'success', message: '✅ მინიჭება წარმატებულია!' })
      setShowAssignModal(false)
      setSelectedOrder(null)
      fetchData()
    } catch (err: any) {
      setNotification({ type: 'error', message: `❌ ${err.message}` })
    }
  }

  // 📡 სტატუსის განახლება
  const updateStatus = async (id: string, status: string) => {
    try {
      await supabase.from('orders').update({ status }).eq('id', id)
      await supabase.from('tracking_events').insert({ order_id: id, event_type: status, location_name: 'დისპეტჩერი', notes: `სტატუსი: ${status}` })
      setNotification({ type: 'success', message: `✅ სტატუსი: ${status}` })
      fetchData()
    } catch (err: any) {
      setNotification({ type: 'error', message: `❌ ${err.message}` })
    }
  }

  // 💬 ჩატის გახსნა/გაგზავნა
  const openChat = async (order: any) => {
    setSelectedOrder(order)
    setShowChatModal(true)
    const { data } = await supabase.from('tracking_events').select('*').eq('order_id', order.id).eq('event_type', 'chat').order('timestamp', { ascending: true })
    setChatMessages(data || [])
  }

  const sendChat = async () => {
    if (!chatInput.trim() || !selectedOrder) return
    const msg = { order_id: selectedOrder.id, event_type: 'chat', location_name: 'დისპეტჩერი', notes: chatInput, timestamp: new Date().toISOString() }
    await supabase.from('tracking_events').insert(msg)
    setChatMessages(prev => [...prev, msg])
    setChatInput('')
    // სიმულაცია: მძღოლის ავტო-პასუხი
    setTimeout(async () => {
      const reply = { order_id: selectedOrder.id, event_type: 'chat', location_name: 'მძღოლი', notes: 'მიღებულია, ვასრულებ!', timestamp: new Date().toISOString() }
      await supabase.from('tracking_events').insert(reply)
      setChatMessages(prev => [...prev, reply])
    }, 2000)
  }

  // 📄 CMR/Waybill ნახვა
  const openDoc = (order: any) => {
    setSelectedOrder(order)
    setShowDocModal(true)
  }

  // 📊 სტატისტიკა (ფინანსების გარეშე)
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    inTransit: orders.filter(o => o.status === 'in_transit').length,
    delivered: orders.filter(o => o.status === 'delivered').length
  }

  if (loading) return <div className="text-center py-20 text-gray-400">🔄 იტვირთება...</div>

  return (
    <div className="space-y-6">
      {/* 🏠 Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">📋 დისპეტჩერის პანელი</h2>
          <p className="text-gray-400">ოპერაციული მართვა • ფინანსები დამალულია</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['orders', 'route', 'live', 'chat', 'docs', 'fleet'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
              {{ orders: '📦 შეკვეთები', route: '🗺️ მარშრუტი', live: '📡 Live', chat: '💬 ჩატი', docs: '📄 დოკუმენტები', fleet: '🚛 ფლოტი' }[tab]}
            </button>
          ))}
          <button onClick={() => { setOrderForm({ stops: [{ address: '' }] }); setShowOrderModal(true) }} className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold">➕ ახალი</button>
        </div>
      </div>

      {/* 📊 KPI (ფინანსების გარეშე) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="სულ" value={stats.total.toString()} color="bg-gray-700" />
        <StatCard title="ლოდინში" value={stats.pending.toString()} color="bg-yellow-600" />
        <StatCard title="გზაში" value={stats.inTransit.toString()} color="bg-blue-600" />
        <StatCard title="მიწოდებული" value={stats.delivered.toString()} color="bg-green-600" />
      </div>

      {/* 📦 ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input placeholder="🔍 ძებნა..." value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg outline-none" />
            <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg outline-none">
              <option value="">ყველა სტატუსი</option>
              <option value="pending">ლოდინში</option>
              <option value="in_transit">გზაში</option>
              <option value="delivered">მიწოდებული</option>
            </select>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3">Tracking</th>
                  <th className="px-4 py-3">მარშრუტი</th>
                  <th className="px-4 py-3">ტვირთი</th>
                  <th className="px-4 py-3">მძღოლი/მანქანა</th>
                  <th className="px-4 py-3">სტატუსი</th>
                  <th className="px-4 py-3">მოქმედება</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(o => (
                  <tr key={o.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                    <td className="px-4 py-3 font-mono text-blue-400 font-bold">{o.tracking_code}</td>
                    <td className="px-4 py-3 text-xs">
                      <div>{o.pickup_address?.split(',')[0]}</div>
                      <div className="text-gray-500">→ {o.delivery_address?.split(',')[0]}</div>
                      {o.route_stops?.length > 2 && <div className="text-blue-400 mt-1">+{o.route_stops.length - 2} გაჩერება</div>}
                    </td>
                    <td className="px-4 py-3 text-xs">{o.cargo_description} ({o.cargo_weight_kg}kg)</td>
                    <td className="px-4 py-3 text-xs">
                      <div>{o.drivers?.full_name || '–'}</div>
                      <div className="text-gray-500">{o.vehicles?.plate_number || '–'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)} className={`px-2 py-1 rounded text-xs font-medium border-none outline-none cursor-pointer ${o.status === 'delivered' ? 'bg-green-600/20 text-green-400' : o.status === 'in_transit' ? 'bg-blue-600/20 text-blue-400' : 'bg-yellow-600/20 text-yellow-400'}`}>
                        <option value="pending">ლოდინში</option>
                        <option value="in_transit">გზაში</option>
                        <option value="delivered">მიწოდებული</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      {!o.driver_id && <button onClick={() => { setSelectedOrder(o); setShowAssignModal(true) }} className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs">🚛 მინიჭება</button>}
                      <button onClick={() => openChat(o)} className="px-2 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs">💬</button>
                      <button onClick={() => openDoc(o)} className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs">📄</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 🗺️ ROUTE PLANNER TAB */}
      {activeTab === 'route' && (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-xl font-bold mb-4">🗺️ მარშრუტის ოპტიმიზაცია</h3>
          <p className="text-gray-400 text-sm mb-4">აირჩიე შეკვეთები და სისტემა ავაწყობს ოპტიმალურ მარშრუტს (მრავალი გაჩერება).</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">არჩეული შეკვეთები</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {orders.filter(o => o.status === 'pending').slice(0, 5).map(o => (
                  <div key={o.id} className="flex justify-between items-center bg-gray-800 p-2 rounded">
                    <span className="text-xs">{o.tracking_code}</span>
                    <button className="text-blue-400 text-xs">➕ დამატება</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gray-700/50 p-4 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-600">
              <div className="text-center">
                <p className="text-3xl mb-2"></p>
                <p className="text-gray-300">მარშრუტის ვიზუალიზაცია</p>
                <p className="text-xs text-gray-500">Leaflet/Google Maps ინტეგრაცია</p>
              </div>
            </div>
          </div>
          <button className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium">🔄 მარშრუტის აგება</button>
        </div>
      )}

      {/* 📡 LIVE TRACKING TAB */}
      {activeTab === 'live' && (
        <div className="space-y-4">
          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-bold">📡 რეალური დროის თვალყური</h3>
            <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded text-sm animate-pulse">● LIVE</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-gray-800 rounded-xl border border-gray-700 h-96 flex items-center justify-center">
              <div className="text-center">
                <p className="text-4xl mb-2">🗺️</p>
                <p className="text-gray-300 font-semibold">Live Map View</p>
                <p className="text-xs text-gray-500">მძღოლების ლოკაცია + ETA</p>
              </div>
            </div>
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 space-y-3 overflow-y-auto max-h-96">
              {orders.filter(o => o.status === 'in_transit').map(o => (
                <div key={o.id} className="bg-gray-700/50 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono text-blue-400 text-xs">{o.tracking_code}</span>
                    <span className="text-xs text-gray-400">ETA: {o.scheduled_pickup_date ? new Date(o.scheduled_pickup_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'უცნობი'}</span>
                  </div>
                  <p className="text-xs text-gray-300">{o.drivers?.full_name} • {o.vehicles?.plate_number}</p>
                  <div className="mt-2 w-full bg-gray-600 rounded-full h-1.5">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.floor(Math.random() * 40) + 40}%` }}></div>
                  </div>
                </div>
              ))}
              {orders.filter(o => o.status === 'in_transit').length === 0 && <p className="text-gray-500 text-sm text-center py-8">გზაში მყოფი რეისები არ არის</p>}
            </div>
          </div>
        </div>
      )}

      {/* 💬 CHAT TAB */}
      {activeTab === 'chat' && (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-xl font-bold mb-4">💬 მძღოლებთან ჩატი</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[500px]">
            <div className="bg-gray-700/50 rounded-lg p-3 overflow-y-auto">
              <p className="text-xs text-gray-400 mb-2">აქტიური რეისები</p>
              {orders.filter(o => o.driver_id && o.status !== 'delivered').map(o => (
                <button key={o.id} onClick={() => openChat(o)} className="w-full text-left p-2 mb-1 bg-gray-800 rounded hover:bg-gray-600 text-xs">
                  {o.tracking_code} - {o.drivers?.full_name}
                </button>
              ))}
            </div>
            <div className="md:col-span-2 flex flex-col bg-gray-900 rounded-lg border border-gray-700">
              <div className="p-3 border-b border-gray-700 flex justify-between">
                <span className="font-medium">{selectedOrder?.tracking_code || 'აირჩიე რეისი'}</span>
                <span className="text-xs text-gray-400">{selectedOrder?.drivers?.full_name}</span>
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-2">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.location_name === 'დისპეტჩერი' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${msg.location_name === 'დისპეტჩერი' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                      <p>{msg.notes}</p>
                      <p className="text-[10px] opacity-60 mt-1 text-right">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
                {!selectedOrder && <p className="text-gray-500 text-center mt-10">აირჩიე რეისი ჩატისთვის</p>}
              </div>
              <div className="p-3 border-t border-gray-700 flex gap-2">
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} placeholder="შეტყობინება..." className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded outline-none text-sm" disabled={!selectedOrder} />
                <button onClick={sendChat} className="px-4 py-2 bg-blue-600 rounded text-sm" disabled={!selectedOrder}>➤</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📄 DOCUMENTS TAB */}
      {activeTab === 'docs' && (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-xl font-bold mb-4">📄 CMR & Waybill ნახვა</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-700/50 text-gray-400 uppercase text-xs">
                <tr><th className="px-4 py-3">Tracking</th><th className="px-4 py-3">მარშრუტი</th><th className="px-4 py-3">დოკუმენტი</th><th className="px-4 py-3">მოქმედება</th></tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} className="border-b border-gray-700">
                    <td className="px-4 py-3 font-mono text-blue-400">{o.tracking_code}</td>
                    <td className="px-4 py-3 text-xs">{o.pickup_address?.split(',')[0]} → {o.delivery_address?.split(',')[0]}</td>
                    <td className="px-4 py-3 text-xs">CMR / Waybill (ავტო-გენერირებული)</td>
                    <td className="px-4 py-3">
                      <button onClick={() => openDoc(o)} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs">👁️ ნახვა</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 🚛 FLEET TAB */}
      {activeTab === 'fleet' && <FleetManagement setNotification={setNotification} />}

      {/* ➕ MODALS */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowOrderModal(false)}>
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center"><h3 className="text-xl font-bold">➕ ახალი შეკვეთა</h3><button onClick={() => setShowOrderModal(false)} className="text-gray-400 text-2xl">&times;</button></div>
            <form onSubmit={handleCreateOrder} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-400">📍 გაჩერებები (მარშრუტი)</label>
                {orderForm.stops.map((stop: any, idx: number) => (
                  <div key={idx} className="flex gap-2">
                    <input required placeholder={`გაჩერება ${idx + 1}`} value={stop.address} onChange={e => { const newStops = [...orderForm.stops]; newStops[idx].address = e.target.value; setOrderForm({...orderForm, stops: newStops}) }} className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded outline-none text-sm" />
                    {idx > 0 && <button type="button" onClick={() => setOrderForm({...orderForm, stops: orderForm.stops.filter((_: any, i: number) => i !== idx)})} className="px-2 text-red-400">🗑️</button>}
                  </div>
                ))}
                <button type="button" onClick={() => setOrderForm({...orderForm, stops: [...orderForm.stops, { address: '' }] })} className="text-sm text-blue-400 hover:underline">+ გაჩერების დამატება</button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input required placeholder="📦 ტვირთის აღწერა" value={orderForm.cargo_description || ''} onChange={e => setOrderForm({...orderForm, cargo_description: e.target.value})} className="px-4 py-2 bg-gray-700 border border-gray-600 rounded outline-none" />
                <input type="number" placeholder="⚖️ წონა (კგ)" value={orderForm.cargo_weight_kg || ''} onChange={e => setOrderForm({...orderForm, cargo_weight_kg: e.target.value})} className="px-4 py-2 bg-gray-700 border border-gray-600 rounded outline-none" />
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-700"><button type="button" onClick={() => setShowOrderModal(false)} className="flex-1 py-3 bg-gray-700 rounded-xl">გაუქმება</button><button type="submit" className="flex-1 py-3 bg-green-600 rounded-xl">✅ შექმნა</button></div>
            </form>
          </div>
        </div>
      )}

      {showAssignModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowAssignModal(false)}>
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">🚛 მინიჭება: {selectedOrder.tracking_code}</h3>
            <div className="space-y-4">
              <select value={selectedOrder.driver_id || ''} onChange={e => setSelectedOrder({...selectedOrder, driver_id: e.target.value || null})} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded outline-none">
                <option value="">მძღოლის არჩევა</option>
                {drivers.filter(d => d.is_available).map(d => <option key={d.id} value={d.id}>{d.full_name} ({d.phone})</option>)}
              </select>
              <div className="flex gap-2">
                <button onClick={() => handleAssign(false)} className="flex-1 py-3 bg-blue-600 rounded-xl">💾 ხელით მინიჭება</button>
                <button onClick={() => handleAssign(true)} className="flex-1 py-3 bg-purple-600 rounded-xl">⚡ ავტო-მინიჭება</button>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="w-full py-2 bg-gray-700 rounded-lg">გაუქმება</button>
            </div>
          </div>
        </div>
      )}

      {showChatModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowChatModal(false)}>
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-lg h-[600px] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-700 flex justify-between"><h3 className="font-bold">💬 {selectedOrder.tracking_code}</h3><button onClick={() => setShowChatModal(false)} className="text-gray-400 text-2xl">&times;</button></div>
            <div className="flex-1 p-4 overflow-y-auto space-y-2">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.location_name === 'დისპეტჩერი' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-3 py-2 rounded text-sm ${msg.location_name === 'დისპეტჩერი' ? 'bg-blue-600 text-white' : 'bg-gray-700'}`}>
                    <p>{msg.notes}</p><p className="text-[10px] opacity-60 mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-gray-700 flex gap-2"><input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} placeholder="შეტყობინება..." className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded outline-none" /><button onClick={sendChat} className="px-4 bg-blue-600 rounded">➤</button></div>
          </div>
        </div>
      )}

      {showDocModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowDocModal(false)}>
          <div className="bg-white text-black rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-100">
              <h3 className="text-xl font-bold">📄 CMR / Waybill Preview</h3>
              <button onClick={() => setShowDocModal(false)} className="text-gray-500 text-2xl">&times;</button>
            </div>
            <div className="p-8 space-y-6 font-mono text-sm">
              <div className="flex justify-between border-b-2 border-black pb-2">
                <span className="font-bold text-lg">LOGISTICS OS</span>
                <span>CMR #: {selectedOrder.tracking_code}</span>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div><p className="font-bold">გამგზავნი:</p><p>{selectedOrder.pickup_address || 'N/A'}</p></div>
                <div><p className="font-bold">მიმღები:</p><p>{selectedOrder.delivery_address || 'N/A'}</p></div>
              </div>
              <div><p className="font-bold">ტვირთი:</p><p>{selectedOrder.cargo_description} | {selectedOrder.cargo_weight_kg} kg</p></div>
              <div className="border-t border-gray-300 pt-4"><p className="font-bold">გზის დეტალები:</p><p>{selectedOrder.route_stops?.join(' → ') || `${selectedOrder.pickup_address} → ${selectedOrder.delivery_address}`}</p></div>
              <div className="text-xs text-gray-500 mt-8 pt-4 border-t border-gray-300">ეს დოკუმენტი არის წინასწარი ნახვა. საბოლოო CMR გენერირდება მიწოდებისას.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ title, value, color }: { title: string; value: string; color: string }) {
  return <div className={`${color} p-4 rounded-xl shadow-lg`}><p className="text-white/80 text-xs">{title}</p><p className="text-2xl font-bold text-white mt-1">{value}</p></div>
}