'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
export default function DriverDashboard({ user, setNotification }: { 
  user: any, setNotification: (n: { type: 'success' | 'error'; message: string }) => void 
}) {
  const [activeTab, setActiveTab] = useState<'tasks' | 'chat' | 'expenses'>('tasks')
  const [driver, setDriver] = useState<any>(null)
  const [currentVehicle, setCurrentVehicle] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // მოდალები & ფორმები
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [showPODModal, setShowPODModal] = useState(false)
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [podNotes, setPodNotes] = useState('')
  const [podSigned, setPodSigned] = useState(false)
  const [expenseForm, setExpenseForm] = useState({ amount: '', category: 'საწვავი', description: '', isAdvance: false })
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [chatInput, setChatInput] = useState('')

  // 📡 მონაცემების ჩატვირთვა
  useEffect(() => {
    if (!user?.id) return
    const loadData = async () => {
      setLoading(true)
      try {
        // 1. მძღოლის პროფილი
        const { data: drv, error: drvErr } = await supabase
          .from('drivers')
          .select('*')
          .eq('user_id', user.id)
          .single()
        if (drvErr || !drv) throw new Error('მძღოლის პროფილი ვერ მოიძებნა')
        setDriver(drv)

        // 2. აქტიური შეკვეთები (მხოლოდ ამ მძღოლის)
        const { data: ordersData } = await supabase
          .from('orders')
          .select(`
            *,
            vehicles (plate_number, model, type, capacity_kg, next_maintenance, insurance_expiry, status)
          `)
          .eq('driver_id', drv.id)
          .in('status', ['pending', 'in_transit'])
          .order('created_at', { ascending: false })
        
        setOrders(ordersData || [])

        // 3. მიმდინარე მანქანა (აქტიური რეისიდან ან ბოლო მინიჭებიდან)
        const activeOrder = ordersData?.find(o => o.status === 'in_transit') || ordersData?.[0]
        if (activeOrder?.vehicles) setCurrentVehicle(activeOrder.vehicles)
        
      } catch (err: any) {
        setNotification({ type: 'error', message: `❌ ${err.message}` })
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [user?.id])

  // 🚦 სტატუსის განახლება
  const updateStatus = async (orderId: string, newStatus: string, notes = '') => {
    try {
      await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
      await supabase.from('tracking_events').insert({
        order_id: orderId, event_type: newStatus, location_name: 'მძღოლი',
        notes: notes || `სტატუსი: ${newStatus}`
      })
      setNotification({ type: 'success', message: `✅ სტატუსი განახლდა: ${newStatus}` })
      // რეფრეში
      const ordersResponse = await supabase.from('orders').select(`*, vehicles(plate_number, model, type, capacity_kg, next_maintenance, insurance_expiry, status)`).eq('driver_id', driver.id).in('status', ['pending', 'in_transit']).order('created_at', { ascending: false })
      setOrders(ordersResponse.data || [])
      const activeOrder = ordersResponse.data?.find((o: any) => o.status === 'in_transit') || ordersResponse.data?.[0]
      setCurrentVehicle(activeOrder?.vehicles || null)
      setShowPODModal(false)
      setShowPhotoModal(false)
      setSelectedOrder(null)
    } catch (err: any) {
      setNotification({ type: 'error', message: `❌ ${err.message}` })
    }
  }

  // 🚨 SOS
  const triggerSOS = async () => {
    if (!selectedOrder) return
    try {
      await supabase.from('tracking_events').insert({
        order_id: selectedOrder.id, event_type: 'sos', location_name: 'მძღოლი',
        notes: '🚨 SOS გამოძახება! გადაუდებელი დახმარება საჭიროა.'
      })
      setNotification({ type: 'error', message: '🚨 SOS გაგზავნილია! დისპეტჩერი მალე დაგიკავშირდებათ.' })
    } catch (err: any) {
      setNotification({ type: 'error', message: `❌ ${err.message}` })
    }
  }

  // 💬 ჩატი
  const sendChat = async () => {
    if (!chatInput.trim()) return
    const msg = { event_type: 'chat', location_name: 'მძღოლი', notes: chatInput, timestamp: new Date().toISOString() }
    setChatMessages(prev => [...prev, msg])
    setChatInput('')
    setTimeout(() => {
      setChatMessages(prev => [...prev, { event_type: 'chat', location_name: 'დისპეტჩერი', notes: 'მიღებულია! ვაკონტროლებ.', timestamp: new Date().toISOString() }])
    }, 2000)
  }

  // 💸 ხარჯი
  const addExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    const newExpense = {
      id: Date.now(), amount: parseFloat(expenseForm.amount), category: expenseForm.category,
      description: expenseForm.description, date: new Date().toISOString().split('T')[0],
      status: expenseForm.isAdvance ? 'ავანსის მოთხოვნა' : 'ლოდინში'
    }
    // სიმულაცია: რეალურად აქ უნდა იყოს supabase.from('driver_expenses').insert(...)
    setNotification({ type: 'success', message: '✅ ხარჯი/ავანსი ჩაიწერა!' })
    setShowExpenseModal(false)
    setExpenseForm({ amount: '', category: 'საწვავი', description: '', isAdvance: false })
  }

  // 📍 ნავიგაცია
  const openNavigation = (address: string) => {
    if (!address) return
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`, '_blank')
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white text-xl animate-pulse">🔄 იტვირთება...</div>
  if (!driver) return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white text-center p-6">⚠️ მძღოლის პროფილი ვერ მოიძებნა. დაუკავშირდით ადმინისტრაციას.</div>

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-6">
      {/* 🏠 Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-700">
        <div>
          <h1 className="text-2xl font-bold">🚛 მძღოლის პანელი</h1>
          <p className="text-sm text-gray-400">ბრაუზერის ვერსია • Telegram Mini App მალე იქნება</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${driver.is_available ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
            {driver.is_available ? '🟢 თავისუფალი' : '🔴 რეისში'}
          </span>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm">🔄 განახლება</button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 👤 LEFT: Profile & Vehicle Info */}
        <div className="space-y-6">
          {/* Driver Profile Card */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-xl font-bold">
                {driver.full_name?.[0] || 'მ'}
              </div>
              <div>
                <h3 className="text-lg font-bold">{driver.full_name}</h3>
                <p className="text-sm text-gray-400">{driver.phone}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-700/50 p-2 rounded"><p className="text-gray-400 text-xs">ლიცენზია</p><p className="font-medium">{driver.license_type} • {driver.license_number || '–'}</p></div>
              <div className="bg-gray-700/50 p-2 rounded"><p className="text-gray-400 text-xs">ვადა</p><p className="font-medium">{driver.license_expiry || '–'}</p></div>
              <div className="bg-gray-700/50 p-2 rounded"><p className="text-gray-400 text-xs">დასაქმება</p><p className="font-medium">{driver.hire_date || '–'}</p></div>
              <div className="bg-gray-700/50 p-2 rounded"><p className="text-gray-400 text-xs">რეიტინგი</p><p className="font-medium text-yellow-400">⭐ {driver.rating || '5.0'}</p></div>
            </div>
          </div>

          {/* 🚐 Current Vehicle Card */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <h4 className="font-semibold mb-3 flex items-center gap-2">🚐 მიმდინარე ტრანსპორტი</h4>
            {currentVehicle ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-blue-400">{currentVehicle.plate_number}</span>
                  <span className={`px-2 py-1 rounded text-xs ${currentVehicle.status === 'active' ? 'bg-green-600/20 text-green-400' : 'bg-orange-600/20 text-orange-400'}`}>
                    {currentVehicle.status === 'active' ? 'აქტიური' : 'სერვისში'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-700/50 p-2 rounded"><p className="text-gray-400 text-xs">მოდელი</p><p>{currentVehicle.model}</p></div>
                  <div className="bg-gray-700/50 p-2 rounded"><p className="text-gray-400 text-xs">ტიპი</p><p>{currentVehicle.type}</p></div>
                  <div className="bg-gray-700/50 p-2 rounded"><p className="text-gray-400 text-xs">ტევადობა</p><p>{currentVehicle.capacity_kg} კგ</p></div>
                  <div className="bg-gray-700/50 p-2 rounded"><p className="text-gray-400 text-xs">გარბენი</p><p>{currentVehicle.mileage || '0'} კმ</p></div>
                  <div className="bg-gray-700/50 p-2 rounded"><p className="text-gray-400 text-xs">ტექმომსახურება</p><p className={currentVehicle.next_maintenance ? 'text-yellow-400' : ''}>{currentVehicle.next_maintenance || '–'}</p></div>
                  <div className="bg-gray-700/50 p-2 rounded"><p className="text-gray-400 text-xs">დაზღვევა</p><p className={currentVehicle.insurance_expiry ? 'text-green-400' : ''}>{currentVehicle.insurance_expiry || '–'}</p></div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 bg-gray-700/30 rounded-lg">
                <p className="text-2xl mb-2">️</p>
                <p className="text-sm">მანქანა დროებით არ არის მინიჭებული</p>
                <p className="text-xs mt-1">დაელოდეთ დისპეტჩერის მინიჭებას</p>
              </div>
            )}
          </div>
        </div>

        {/* 📦 RIGHT: Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="flex border-b border-gray-700 gap-6">
            {[{ id: 'tasks', label: '📦 აქტიური რეისები' }, { id: 'chat', label: '💬 ჩატი' }, { id: 'expenses', label: '💰 ხარჯები/ავანსი' }].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`pb-3 px-1 text-sm font-medium border-b-2 transition ${activeTab === tab.id ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white'}`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* 📦 TASKS */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="text-center py-16 bg-gray-800 rounded-xl border border-gray-700">
                  <p className="text-4xl mb-3">📭</p>
                  <p className="text-gray-400">ამ ეტაპზე აქტიური რეისები არ გაქვს</p>
                  <p className="text-xs text-gray-500 mt-2">დისპეტჩერი მალე მინიჭებთ ახალ დავალებას</p>
                </div>
              ) : (
                orders.map(order => (
                  <div key={order.id} className="bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-blue-500/50 transition">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3 mb-4">
                      <div>
                        <span className="font-mono text-blue-400 font-bold text-lg">{order.tracking_code}</span>
                        <p className="text-sm text-gray-400 mt-1">📦 {order.cargo_description} • {order.cargo_weight_kg}kg</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold self-start ${
                        order.status === 'in_transit' ? 'bg-blue-600/20 text-blue-400' : 'bg-yellow-600/20 text-yellow-400'
                      }`}>
                        {order.status === 'pending' ? '⏳ მომზადება' : '🚚 გზაში'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-gray-700/50 p-3 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">🟢 ატვირთვა</p>
                        <p className="text-sm font-medium">{order.pickup_address}</p>
                      </div>
                      <div className="bg-gray-700/50 p-3 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">🔴 ჩატვირთვა</p>
                        <p className="text-sm font-medium">{order.delivery_address}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-700">
                      <button onClick={() => openNavigation(order.delivery_address)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm flex items-center gap-1">📍 ნავიგაცია</button>
                      <button onClick={() => { setSelectedOrder(order); setShowPhotoModal(true) }} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm flex items-center gap-1">📸 ფოტო</button>
                      {order.status === 'pending' && (
                        <button onClick={() => updateStatus(order.id, 'in_transit', 'ატვირთვა დასრულდა, გზაში ვარ')} className="ml-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold shadow-lg shadow-blue-500/20">🚚 გზაში ვარ</button>
                      )}
                      {order.status === 'in_transit' && (
                        <button onClick={() => { setSelectedOrder(order); setShowPODModal(true) }} className="ml-auto px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-bold shadow-lg shadow-green-500/20">✅ ჩავაბარე</button>
                      )}
                      <button onClick={() => { setSelectedOrder(order); triggerSOS() }} className="px-4 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30 rounded-lg font-bold">🚨 SOS</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 💬 CHAT */}
          {activeTab === 'chat' && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl flex flex-col h-[500px]">
              <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                <h3 className="font-semibold">💬 ჩატი დისპეტჩერთან</h3>
                <span className="text-xs text-gray-400">რეალურ დროში</span>
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {chatMessages.length === 0 && <p className="text-center text-gray-500 mt-10">შეტყობინებები არ არის</p>}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.location_name === 'მძღოლი' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-4 py-2 rounded-xl text-sm ${msg.location_name === 'მძღოლი' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                      <p>{msg.notes}</p>
                      <p className="text-[10px] opacity-60 mt-1 text-right">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-gray-700 flex gap-2">
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} placeholder="შეტყობინება..." className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                <button onClick={sendChat} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg">➤</button>
              </div>
            </div>
          )}

          {/* 💸 EXPENSES */}
          {activeTab === 'expenses' && (
            <div className="space-y-4">
              <div className="bg-emerald-600/20 border border-emerald-500/30 p-6 rounded-xl flex justify-between items-center">
                <div>
                  <p className="text-emerald-400 text-sm">ხელმისაწვდომი ბალანსი / ავანსი</p>
                  <p className="text-3xl font-bold text-white mt-1">₾ 350.00</p>
                </div>
                <button onClick={() => setShowExpenseModal(true)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-semibold">➕ ახალი ჩანაწერი</button>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-700/50 text-gray-400 uppercase text-xs">
                    <tr><th className="px-4 py-3">თარიღი</th><th className="px-4 py-3">კატეგორია</th><th className="px-4 py-3">აღწერა</th><th className="px-4 py-3">თანხა</th><th className="px-4 py-3">სტატუსი</th></tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-700"><td className="px-4 py-3">2024-05-20</td><td className="px-4 py-3">⛽ საწვავი</td><td className="px-4 py-3 text-gray-300">დიზელის შევსება</td><td className="px-4 py-3 font-bold">₾ 120</td><td className="px-4 py-3 text-green-400">დადასტურებული</td></tr>
                    <tr><td className="px-4 py-3">2024-05-21</td><td className="px-4 py-3">🍔 კვება</td><td className="px-4 py-3 text-gray-300">სადღეღამისო</td><td className="px-4 py-3 font-bold">₾ 45</td><td className="px-4 py-3 text-yellow-400">ლოდინში</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ✅ POD MODAL */}
      {showPODModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowPODModal(false)}>
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-lg p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-center">✅ მიწოდების დადასტურება (POD)</h3>
            <div className="bg-gray-700/50 p-4 rounded-lg text-sm space-y-1">
              <p><span className="text-gray-400">რეისი:</span> {selectedOrder.tracking_code}</p>
              <p><span className="text-gray-400">მისამართი:</span> {selectedOrder.delivery_address}</p>
            </div>
            <div className="border-2 border-dashed border-gray-600 rounded-xl p-6 text-center bg-gray-700/30">
              <p className="text-3xl mb-2">✍️</p>
              <p className="text-sm text-gray-300">მიმღების ხელმოწერა (სიმულაცია)</p>
              <button onClick={() => setPodSigned(true)} className={`mt-3 px-4 py-2 rounded-lg text-sm font-medium transition ${podSigned ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'}`}>
                {podSigned ? '✅ ხელმოწერილია' : '📝 ხელმოწერა'}
              </button>
            </div>
            <textarea placeholder="დამატებითი შენიშვნა" value={podNotes} onChange={e => setPodNotes(e.target.value)} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl outline-none resize-none h-20" />
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button onClick={() => setShowPODModal(false)} className="py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-semibold">გაუქმება</button>
              <button onClick={() => updateStatus(selectedOrder.id, 'delivered', podNotes || 'წარმატებით მიწოდებული')} disabled={!podSigned} className={`py-3 rounded-xl font-bold ${podSigned ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 cursor-not-allowed'}`}>დადასტურება</button>
            </div>
          </div>
        </div>
      )}

      {/* 📸 PHOTO MODAL */}
      {showPhotoModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowPhotoModal(false)}>
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-sm p-6 text-center space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold">📸 ტვირთის ფოტო</h3>
            <div className="bg-gray-700/50 h-48 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-600">
              <p className="text-gray-400">📷 კამერა / გალერეა</p>
            </div>
            <button onClick={() => { updateStatus(selectedOrder.id, selectedOrder.status, 'ფოტო ატვირთულია'); setShowPhotoModal(false) }} className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold">📤 ატვირთვა</button>
            <button onClick={() => setShowPhotoModal(false)} className="w-full py-2 text-gray-400 hover:text-white text-sm">გაუქმება</button>
          </div>
        </div>
      )}

      {/* 💸 EXPENSE MODAL */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowExpenseModal(false)}>
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-center">💰 ახალი ხარჯი / ავანსი</h3>
            <form onSubmit={addExpense} className="space-y-3">
              <input required type="number" step="0.01" placeholder="თანხა (₾)" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl outline-none" />
              <select value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl outline-none">
                <option value="საწვავი">⛽ საწვავი</option><option value="კვება">🍔 კვება</option><option value="გზის გადასახადი">🛣️ გზის გადასახადი</option><option value="სხვა">📦 სხვა</option>
              </select>
              <input placeholder="აღწერა" value={expenseForm.description} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl outline-none" />
              <label className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-xl cursor-pointer">
                <input type="checkbox" checked={expenseForm.isAdvance} onChange={e => setExpenseForm({...expenseForm, isAdvance: e.target.checked})} className="w-5 h-5 accent-blue-500" />
                <span className="text-sm">🏦 ავანსის მოთხოვნაა</span>
              </label>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button type="button" onClick={() => setShowExpenseModal(false)} className="py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-semibold">გაუქმება</button>
                <button type="submit" className="py-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold">💾 შენახვა</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}