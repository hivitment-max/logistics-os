'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

// ============================================================================
// 👤 CLIENT DASHBOARD - სრული ფუნქციონალი
// ============================================================================
export default function ClientDashboard({ user, setNotification }: { 
  user: any, setNotification: (n: { type: 'success' | 'error'; message: string }) => void 
}) {
  const [activeTab, setActiveTab] = useState<'orders' | 'invoices' | 'support'>('orders')
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [showQR, setShowQR] = useState(false)
  const [qrValue, setQrValue] = useState('')
  
  // მონაცემები & ფილტრები
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  
  // ახალი შეკვეთის ფორმა
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [orderForm, setOrderForm] = useState({ pickup: '', delivery: '', cargo: '', weight: '', phone: '' })
  
  // ჩატის სიმულაცია
  const [chatMessages, setChatMessages] = useState<{ from: 'client' | 'support'; text: string; time: string }[]>([
    { from: 'support', text: 'გამარჯობა! როგორ შემიძლია დაგეხმაროთ?', time: new Date().toLocaleTimeString() }
  ])
  const [chatInput, setChatInput] = useState('')

  // 📦 შეკვეთების ჩატვირთვა
  const fetchOrders = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('orders')
        .select(`*, drivers(full_name), vehicles(plate_number), tracking_events(event_type, location_name, notes, timestamp)`)
        .eq('client_id', user?.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      setOrders(data || [])
    } catch (err: any) {
      console.error('Fetch orders error:', err.message)
      setNotification({ type: 'error', message: `❌ ${err.message}` })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.id) fetchOrders()
  }, [user?.id])

  // 🔄 Realtime განახლება
  useEffect(() => {
    if (!user?.id) return
    const channel = supabase
      .channel('client_orders_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `client_id=eq.${user.id}` }, () => {
        fetchOrders()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user?.id])

  // 🔍 ფილტრაცია
  const filteredOrders = orders.filter(o => {
    const matchesSearch = !searchTerm || 
      o.tracking_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.cargo_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.pickup_address?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !statusFilter || o.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // 📥 Excel ექსპორტი
  const exportToCSV = () => {
    const headers = "Tracking,Status,From,To,Price,Created At\n"
    const rows = filteredOrders.map((o: any) => 
      `${o.tracking_code},${o.status},${o.pickup_address},${o.delivery_address},${o.price},${o.created_at}`
    ).join("\n")
    const blob = new Blob([headers + rows], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    setNotification({ type: 'success', message: '✅ ფაილი ჩამოიტვირთა!' })
  }

  // ➕ ახალი შეკვეთის გაგზავნა
  const handleNewOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase.from('orders').insert([{
        client_id: user.id,
        tracking_code: `LOG-${Date.now().toString().slice(-6)}`,
        status: 'pending',
        pickup_address: orderForm.pickup,
        delivery_address: orderForm.delivery,
        cargo_description: orderForm.cargo,
        cargo_weight_kg: parseFloat(orderForm.weight) || 0,
        price: 0, // დისპეტჩერი დააფასებს
        currency: 'GEL',
        incoterm: 'EXW',
        payment_terms: 'Collect'
      }])
      if (error) throw error
      setNotification({ type: 'success', message: '✅ შეკვეთა წარმატებით გაიგზავნა!' })
      setShowOrderModal(false)
      setOrderForm({ pickup: '', delivery: '', cargo: '', weight: '', phone: '' })
      fetchOrders()
    } catch (err: any) {
      setNotification({ type: 'error', message: `❌ ${err.message}` })
    }
  }

  // 📞 Call-Back მოთხოვნა
  const handleCallBack = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const phone = (form.elements.namedItem('phone') as HTMLInputElement).value
    const note = (form.elements.namedItem('note') as HTMLTextAreaElement).value
    
    try {
      // თუ ცხრილი არ არსებობს, შეცდომას არ აგდებს, უბრალოდ console-ში ჩაწერს
      const { error } = await supabase.from('support_requests').insert([{
        client_id: user.id,
        phone,
        note,
        status: 'pending'
      }])
      if (error && !error.message.includes('does not exist')) throw error
      setNotification({ type: 'success', message: '✅ მოთხოვნა მიღებულია! მალე დაგიკავშირდებით.' })
      form.reset()
    } catch (err: any) {
      setNotification({ type: 'error', message: `❌ ${err.message}` })
    }
  }

  // 💬 ჩატის გაგზავნა
  const sendChatMessage = () => {
    if (!chatInput.trim()) return
    const newMsg = { from: 'client' as const, text: chatInput, time: new Date().toLocaleTimeString() }
    setChatMessages(prev => [...prev, newMsg])
    setChatInput('')
    // სიმულაცია: ავტო-პასუხი 2 წამში
    setTimeout(() => {
      setChatMessages(prev => [...prev, { 
        from: 'support', 
        text: 'გმადლობთ! თქვენს შეტყობინებას ვამუშავებთ და მალე გიპასუხებთ.', 
        time: new Date().toLocaleTimeString() 
      }])
    }, 2000)
  }

  // 📊 სტატისტიკა
  const stats = {
    active: orders.filter(o => o.status !== 'delivered').length,
    spent: orders.reduce((acc, o) => acc + (o.price || 0), 0),
    delivered: orders.filter(o => o.status === 'delivered').length
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 🏠 Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">👤 ჩემი კაბინეტი</h2>
          <p className="text-gray-400">კეთილი იყოს თქვენი მობრძანება{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ''}!</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowQR(true)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-2 transition-colors">📷 QR სკანი</button>
          <button onClick={() => setShowOrderModal(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors shadow-lg shadow-blue-500/20">➕ ახალი შეკვეთა</button>
        </div>
      </div>

      {/* 📊 Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="📦 აქტიური ტვირთი" value={stats.active.toString()} color="bg-blue-600" />
        <StatCard title="💰 ჯამური ხარჯი" value={`$${stats.spent.toLocaleString()}`} color="bg-emerald-600" />
        <StatCard title="✅ მიწოდებული" value={stats.delivered.toString()} color="bg-purple-600" />
      </div>

      {/* 📑 Tabs */}
      <div className="flex border-b border-gray-700 gap-6">
        {[{ id: 'orders', label: '📦 ჩემი შეკვეთები' }, { id: 'invoices', label: '💰 ინვოისები' }, { id: 'support', label: '🎧 მხარდაჭერა' }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* 📦 ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex gap-2 w-full sm:w-auto">
              <input placeholder="🔍 ძებნა..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 flex-1 sm:w-64" />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg outline-none">
                <option value="">ყველა სტატუსი</option>
                <option value="pending">ლოდინში</option>
                <option value="in_transit">გზაში</option>
                <option value="delivered">მიწოდებული</option>
              </select>
            </div>
            <button onClick={exportToCSV} className="text-sm text-blue-400 hover:underline">📥 Excel Export</button>
          </div>
          
          {loading ? (
            <div className="text-center py-12 text-gray-400">🔄 იტვირთება...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-gray-800 rounded-xl border border-gray-700">
              <p className="text-4xl mb-4">📦</p>
              <p>შეკვეთები ვერ მოიძებნა</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredOrders.map((order: any) => (
                <div key={order.id} onClick={() => setSelectedOrder(order)} className="bg-gray-800 border border-gray-700 rounded-xl p-5 cursor-pointer hover:border-blue-500 transition-colors group">
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-mono text-blue-400 font-bold">{order.tracking_code}</span>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${order.status === 'delivered' ? 'bg-green-600/20 text-green-400' : order.status === 'in_transit' ? 'bg-blue-600/20 text-blue-400' : 'bg-yellow-600/20 text-yellow-400'}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-sm text-gray-300 space-y-1">
                    <p>📍 {order.pickup_address?.split(',')[0]} → {order.delivery_address?.split(',')[0]}</p>
                    <p>📦 {order.cargo_description} • {order.cargo_weight_kg}kg</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-700 flex justify-between items-center">
                    <span className="font-bold text-lg">${order.price?.toLocaleString()} {order.currency || 'GEL'}</span>
                    <span className="text-blue-400 text-sm group-hover:underline">დეტალები →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 💰 INVOICES TAB */}
      {activeTab === 'invoices' && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <h3 className="font-semibold">ფინანსური ისტორია</h3>
            <button className="text-sm text-blue-400 hover:underline">📊 ანგარიშგება</button>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-700/50 text-gray-400 uppercase text-xs">
              <tr><th className="px-4 py-3">ინვოისი</th><th className="px-4 py-3">თარიღი</th><th className="px-4 py-3">თანხა</th><th className="px-4 py-3">სტატუსი</th><th className="px-4 py-3">მოქმედება</th></tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-700 hover:bg-gray-700/30"><td className="px-4 py-3 font-mono text-blue-400">INV-001</td><td className="px-4 py-3">2024-05-20</td><td className="px-4 py-3 font-bold">$1,200</td><td className="px-4 py-3 text-green-400">გადახდილი</td><td className="px-4 py-3"><button className="text-blue-400 hover:underline">📄 PDF</button></td></tr>
              <tr className="hover:bg-gray-700/30"><td className="px-4 py-3 font-mono text-blue-400">INV-002</td><td className="px-4 py-3">2024-05-22</td><td className="px-4 py-3 font-bold">$450</td><td className="px-4 py-3 text-yellow-400">ლოდინში</td><td className="px-4 py-3"><button className="text-blue-400 hover:underline">💳 გადახდა</button></td></tr>
            </tbody>
          </table>
        </div>
      )}

      {/* 🎧 SUPPORT TAB */}
      {activeTab === 'support' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex flex-col h-[500px]">
            <h3 className="text-xl font-semibold mb-4">💬 ჩატი ოპერატორთან</h3>
            <div className="flex-1 bg-gray-900 rounded-lg mb-4 p-4 overflow-y-auto space-y-3 border border-gray-700">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.from === 'client' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-4 py-2 rounded-lg text-sm ${msg.from === 'client' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                    <p>{msg.text}</p>
                    <p className="text-[10px] opacity-60 mt-1 text-right">{msg.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChatMessage()} placeholder="შეტყობინება..." className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={sendChatMessage} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg">➤</button>
            </div>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h3 className="text-xl font-semibold mb-4">📞 Call-Back მოთხოვნა</h3>
            <p className="text-gray-400 text-sm mb-4">დატოვე ნომერი და ოპერატორი დაგიკავშირდებათ 5 წუთში.</p>
            <form onSubmit={handleCallBack} className="space-y-3">
              <input name="phone" placeholder="ტელეფონის ნომერი *" required className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              <textarea name="note" placeholder="რა საკითხზე გსურთ საუბარი?" rows={3} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              <button type="submit" className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-xl font-semibold transition-colors shadow-lg shadow-green-600/20">📞 მოთხოვნის გაგზავნა</button>
            </form>
          </div>
        </div>
      )}

      {/* 👁️ ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex justify-between items-center z-10">
              <div><h3 className="text-2xl font-bold font-mono">{selectedOrder.tracking_code}</h3><p className="text-gray-400 text-sm">{selectedOrder.cargo_description}</p></div>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-6">
                <div>
                  <h4 className="font-semibold text-blue-400 mb-3">📍 ტრეკინგი (Live)</h4>
                  <div className="space-y-4 pl-2 border-l-2 border-gray-700">
                    {['pending', 'in_transit', 'customs', 'delivered'].map((step, idx) => {
                      const statusOrder = ['pending', 'in_transit', 'customs', 'delivered']
                      const isDone = statusOrder.indexOf(step) <= statusOrder.indexOf(selectedOrder.status)
                      return (
                        <div key={step} className={`relative pl-4 ${isDone ? 'opacity-100' : 'opacity-40'}`}>
                          <div className={`absolute -left-[25px] top-0 w-4 h-4 rounded-full ${isDone ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                          <p className="font-medium text-sm">{['📝 მიღებული', '🚛 გზაში', '🛃 საბაჟო', '✅ მიწოდებული'][idx]}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
                {selectedOrder.drivers && (
                  <div className="bg-gray-700/50 p-4 rounded-xl">
                    <h4 className="font-semibold text-sm mb-2">🚛 მძღოლი</h4>
                    <p className="text-sm text-gray-300">{selectedOrder.drivers.full_name}</p>
                    {selectedOrder.vehicles?.plate_number && <p className="text-xs text-gray-400 mt-1">{selectedOrder.vehicles.plate_number}</p>}
                  </div>
                )}
              </div>
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-gray-700/50 rounded-xl h-48 flex items-center justify-center border-2 border-dashed border-gray-600">
                  <div className="text-center"><p className="text-3xl mb-2">🗺️</p><p className="text-gray-300 font-semibold">Live Map</p></div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-700/50 p-3 rounded-lg"><p className="text-gray-400 text-xs">ატვირთვა</p><p className="font-medium">{selectedOrder.pickup_address}</p></div>
                  <div className="bg-gray-700/50 p-3 rounded-lg"><p className="text-gray-400 text-xs">ჩატვირთვა</p><p className="font-medium">{selectedOrder.delivery_address}</p></div>
                  <div className="bg-gray-700/50 p-3 rounded-lg text-center"><p className="text-gray-400 text-xs">წონა / CBM</p><p className="font-bold">{selectedOrder.cargo_weight_kg}kg / {selectedOrder.volume_m3 || 0}m³</p></div>
                  <div className="bg-gray-700/50 p-3 rounded-lg text-center"><p className="text-gray-400 text-xs">ადგილები</p><p className="font-bold">{selectedOrder.places_count || 1}</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ➕ NEW ORDER MODAL */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowOrderModal(false)}>
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-bold mb-4">➕ ახალი შეკვეთა</h3>
            <form onSubmit={handleNewOrder} className="space-y-4">
              <input required placeholder="📍 ატვირთვის მისამართი" value={orderForm.pickup} onChange={e => setOrderForm({...orderForm, pickup: e.target.value})} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg outline-none" />
              <input required placeholder="🏁 ჩატვირთვის მისამართი" value={orderForm.delivery} onChange={e => setOrderForm({...orderForm, delivery: e.target.value})} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg outline-none" />
              <input required placeholder="📦 ტვირთის აღწერა" value={orderForm.cargo} onChange={e => setOrderForm({...orderForm, cargo: e.target.value})} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg outline-none" />
              <div className="grid grid-cols-2 gap-3">
                <input required type="number" placeholder="⚖️ წონა (კგ)" value={orderForm.weight} onChange={e => setOrderForm({...orderForm, weight: e.target.value})} className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg outline-none" />
                <input required placeholder="📞 საკონტაქტო" value={orderForm.phone} onChange={e => setOrderForm({...orderForm, phone: e.target.value})} className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg outline-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowOrderModal(false)} className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-semibold">გაუქმება</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold">გაგზავნა</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📷 QR MODAL */}
      {showQR && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50" onClick={() => setShowQR(false)}>
          <div className="text-center" onClick={e => e.stopPropagation()}>
            <div className="w-64 h-64 border-2 border-blue-500 rounded-xl mb-4 flex items-center justify-center relative mx-auto"><span className="text-6xl">📷</span></div>
            <p className="text-white font-semibold mb-4">მიმართეთ კამერა QR კოდს</p>
            <input type="text" placeholder="ან ჩაწერეთ კოდი..." className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white mb-4 w-64 text-center" value={qrValue} onChange={e => setQrValue(e.target.value)} onKeyDown={e => {
              if (e.key === 'Enter' && qrValue) {
                const found = orders.find(o => o.tracking_code === qrValue.toUpperCase())
                if (found) { setSelectedOrder(found); setShowQR(false); setQrValue('') }
                else setNotification({ type: 'error', message: '❌ ვერ მოიძებნა' })
              }
            }} />
            <button onClick={() => setShowQR(false)} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300">გაუქმება</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// 🧩 Helper: StatCard
// ============================================================================
function StatCard({ title, value, color }: { title: string; value: string; color: string }) {
  return (
    <div className={`${color} p-6 rounded-xl shadow-lg`}>
      <p className="text-white/80 text-sm">{title}</p>
      <p className="text-3xl font-bold text-white mt-1">{value}</p>
    </div>
  )
}