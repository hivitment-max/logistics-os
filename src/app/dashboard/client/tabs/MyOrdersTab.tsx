'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

// ============================================================================
// 👁️ VIEW MODAL - შეკვეთის დეტალური ნახვა
// ============================================================================
const ViewOrderModal = ({ order, onClose, getStatusColor }: any) => {
  if (!order) return null

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#1a202c] border border-gray-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="sticky top-0 bg-[#1a202c] border-b border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <span className="text-xl">📦</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">შეკვეთის დეტალები</h3>
              <p className="text-[10px] text-gray-400 font-mono">{order.tracking_code}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl transition p-1 hover:bg-gray-700 rounded-lg">&times;</button>
        </div>

        <div className="p-6 space-y-4">
          {/* სტატუსი */}
          <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl border border-gray-700/50">
            <span className="text-[10px] text-gray-400 uppercase font-semibold">სტატუსი</span>
            <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${getStatusColor(order.status)}`}>
              {order.status === 'pending' && '⏳ '}
              {order.status === 'in_transit' && '🚚 '}
              {order.status === 'delivered' && '✅ '}
              {order.status === 'cancelled' && '❌ '}
              {order.status}
            </span>
          </div>

          {/* მარშრუტი */}
          <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-xl p-4">
            <h4 className="text-xs font-bold text-red-400 mb-3 flex items-center gap-2">📍 მარშრუტი</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-gray-500 mb-1">📤 ატვირთვა</p>
                <p className="text-white font-medium">{order.pickup_address}</p>
                <p className="text-gray-400 mt-1">{order.pickup_contact_person} • {order.pickup_phone}</p>
                {order.scheduled_pickup_date && (
                  <p className="text-gray-400">{new Date(order.scheduled_pickup_date).toLocaleString('ka-GE')}</p>
                )}
              </div>
              <div>
                <p className="text-gray-500 mb-1">📥 ჩატვირთვა</p>
                <p className="text-white font-medium">{order.delivery_address}</p>
                <p className="text-gray-400 mt-1">{order.delivery_contact_person} • {order.delivery_phone}</p>
                {order.scheduled_delivery_date && (
                  <p className="text-gray-400">{new Date(order.scheduled_delivery_date).toLocaleString('ka-GE')}</p>
                )}
              </div>
            </div>
          </div>

          {/* ტვირთი */}
          <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-4">
            <h4 className="text-xs font-bold text-yellow-400 mb-3 flex items-center gap-2">📦 ტვირთი</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div><p className="text-gray-500">აღწერა</p><p className="text-white font-medium">{order.cargo_description || '–'}</p></div>
              <div><p className="text-gray-500">ტიპი</p><p className="text-white font-medium">{order.cargo_type || '–'}</p></div>
              <div><p className="text-gray-500">წონა</p><p className="text-white font-medium">{order.cargo_weight_kg ? `${order.cargo_weight_kg} კგ` : '–'}</p></div>
              <div><p className="text-gray-500">მოცულობა</p><p className="text-white font-medium">{order.cargo_volume_m3 ? `${order.cargo_volume_m3} m³` : '–'}</p></div>
              <div><p className="text-gray-500">რაოდენობა</p><p className="text-white font-medium">{order.places_count || '–'}</p></div>
              <div><p className="text-gray-500">შეფუთვა</p><p className="text-white font-medium">{order.packaging_type || '–'}</p></div>
              <div><p className="text-gray-500">ღირებულება</p><p className="text-white font-medium">{order.declared_value ? `${order.declared_value} ₾` : '–'}</p></div>
            </div>
          </div>

          {/* ფინანსები */}
          <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-4">
            <h4 className="text-xs font-bold text-blue-400 mb-3 flex items-center gap-2">💰 ფინანსები</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div><p className="text-gray-500">ფასი</p><p className="text-white font-bold text-lg">{order.price} {order.currency}</p></div>
              <div><p className="text-gray-500">გადახდა</p><p className="text-white font-medium">{order.payment_terms || '–'}</p></div>
              <div><p className="text-gray-500">ინვოისი</p><p className="text-white font-medium">{order.invoice_needed ? '✅ კი' : '❌ არა'}</p></div>
              <div><p className="text-gray-500">დაზღვევა</p><p className="text-white font-medium">{order.insurance ? '✅ კი' : '❌ არა'}</p></div>
            </div>
          </div>

          {/* დამატებითი */}
          {(order.special_requirements || order.notes || (order.additional_services && order.additional_services.length > 0)) && (
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4">
              <h4 className="text-xs font-bold text-green-400 mb-3 flex items-center gap-2">📝 დამატებითი</h4>
              {order.special_requirements && (
                <div className="mb-2"><p className="text-gray-500 text-[10px]">მოთხოვნები</p><p className="text-white text-xs">{order.special_requirements}</p></div>
              )}
              {order.notes && (
                <div className="mb-2"><p className="text-gray-500 text-[10px]">შენიშვნები</p><p className="text-white text-xs">{order.notes}</p></div>
              )}
              {order.additional_services && order.additional_services.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {order.additional_services.map((s: string) => (
                    <span key={s} className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-[10px]">{s}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* დრო */}
          <div className="p-3 bg-gray-800/30 rounded-xl border border-gray-700/30">
            <div className="grid grid-cols-3 gap-3 text-[10px]">
              <div><p className="text-gray-500">შექმნა</p><p className="text-white">{new Date(order.created_at).toLocaleString('ka-GE')}</p></div>
              {order.updated_at && <div><p className="text-gray-500">განახლდა</p><p className="text-white">{new Date(order.updated_at).toLocaleString('ka-GE')}</p></div>}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-[#1a202c] border-t border-gray-700 px-6 py-4">
          <button onClick={onClose} className="w-full py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-bold text-white transition">
            დახურვა
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// ✏️ EDIT MODAL - შეკვეთის რედაქტირება
// ============================================================================
const EditOrderModal = ({ order, onClose, onSave }: any) => {
  const [form, setForm] = useState({
    cargo_description: order.cargo_description || '',
    cargo_weight_kg: order.cargo_weight_kg || '',
    cargo_volume_m3: order.cargo_volume_m3 || '',
    places_count: order.places_count || '',
    declared_value: order.declared_value || '',
    pickup_address: order.pickup_address || '',
    pickup_contact_person: order.pickup_contact_person || '',
    pickup_phone: order.pickup_phone || '',
    delivery_address: order.delivery_address || '',
    delivery_contact_person: order.delivery_contact_person || '',
    delivery_phone: order.delivery_phone || '',
    special_requirements: order.special_requirements || '',
    notes: order.notes || '',
    price: order.price || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const updateField = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setLoading(true)
    setError('')

    try {
      const updateData = {
        cargo_description: form.cargo_description,
        cargo_weight_kg: parseFloat(form.cargo_weight_kg) || null,
        cargo_volume_m3: parseFloat(form.cargo_volume_m3) || null,
        places_count: parseInt(form.places_count) || null,
        declared_value: parseFloat(form.declared_value) || null,
        pickup_address: form.pickup_address,
        pickup_contact_person: form.pickup_contact_person,
        pickup_phone: form.pickup_phone,
        delivery_address: form.delivery_address,
        delivery_contact_person: form.delivery_contact_person,
        delivery_phone: form.delivery_phone,
        special_requirements: form.special_requirements || null,
        notes: form.notes || null,
        price: parseFloat(form.price) || null,
        updated_at: new Date().toISOString(),
      }

      const { error: updateError } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', order.id)

      if (updateError) throw updateError

      onSave({ ...order, ...updateData })
    } catch (err: any) {
      setError(err.message || 'შეცდომა რედაქტირებისას')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#1a202c] border border-gray-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="sticky top-0 bg-[#1a202c] border-b border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
              <span className="text-xl">✏️</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">შეკვეთის რედაქტირება</h3>
              <p className="text-[10px] text-gray-400 font-mono">{order.tracking_code}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl transition p-1 hover:bg-gray-700 rounded-lg">&times;</button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
            ❌ {error}
          </div>
        )}

        <div className="p-6 space-y-4">
          {/* მარშრუტი */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 p-3 bg-gray-800/30 rounded-xl border border-gray-700/30">
              <h4 className="text-[10px] font-bold text-red-400 uppercase">📤 ატვირთვა</h4>
              <input value={form.pickup_address} onChange={(e) => updateField('pickup_address', e.target.value)} placeholder="მისამართი" className="w-full px-3 py-2 bg-gray-800/60 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500" />
              <div className="grid grid-cols-2 gap-2">
                <input value={form.pickup_contact_person} onChange={(e) => updateField('pickup_contact_person', e.target.value)} placeholder="კონტაქტი" className="w-full px-3 py-2 bg-gray-800/60 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500" />
                <input value={form.pickup_phone} onChange={(e) => updateField('pickup_phone', e.target.value)} placeholder="ტელეფონი" className="w-full px-3 py-2 bg-gray-800/60 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500" />
              </div>
            </div>
            <div className="space-y-2 p-3 bg-gray-800/30 rounded-xl border border-gray-700/30">
              <h4 className="text-[10px] font-bold text-green-400 uppercase">📥 ჩატვირთვა</h4>
              <input value={form.delivery_address} onChange={(e) => updateField('delivery_address', e.target.value)} placeholder="მისამართი" className="w-full px-3 py-2 bg-gray-800/60 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500" />
              <div className="grid grid-cols-2 gap-2">
                <input value={form.delivery_contact_person} onChange={(e) => updateField('delivery_contact_person', e.target.value)} placeholder="კონტაქტი" className="w-full px-3 py-2 bg-gray-800/60 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500" />
                <input value={form.delivery_phone} onChange={(e) => updateField('delivery_phone', e.target.value)} placeholder="ტელეფონი" className="w-full px-3 py-2 bg-gray-800/60 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500" />
              </div>
            </div>
          </div>

          {/* ტვირთი */}
          <div className="p-3 bg-gray-800/30 rounded-xl border border-gray-700/30 space-y-2">
            <h4 className="text-[10px] font-bold text-yellow-400 uppercase">📦 ტვირთი</h4>
            <textarea value={form.cargo_description} onChange={(e) => updateField('cargo_description', e.target.value)} placeholder="აღწერა" rows={2} className="w-full px-3 py-2 bg-gray-800/60 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500 resize-none" />
            <div className="grid grid-cols-4 gap-2">
              <input type="number" value={form.cargo_weight_kg} onChange={(e) => updateField('cargo_weight_kg', e.target.value)} placeholder="წონა (კგ)" className="w-full px-3 py-2 bg-gray-800/60 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500" />
              <input type="number" value={form.cargo_volume_m3} onChange={(e) => updateField('cargo_volume_m3', e.target.value)} placeholder="მოცულობა (მ³)" className="w-full px-3 py-2 bg-gray-800/60 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500" />
              <input type="number" value={form.places_count} onChange={(e) => updateField('places_count', e.target.value)} placeholder="რაოდენობა" className="w-full px-3 py-2 bg-gray-800/60 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500" />
              <input type="number" value={form.declared_value} onChange={(e) => updateField('declared_value', e.target.value)} placeholder="ღირებულება" className="w-full px-3 py-2 bg-gray-800/60 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500" />
            </div>
          </div>

          {/* ფასი და დამატებითი */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-gray-800/30 rounded-xl border border-gray-700/30">
              <h4 className="text-[10px] font-bold text-blue-400 uppercase mb-2">💰 ფასი</h4>
              <input type="number" value={form.price} onChange={(e) => updateField('price', e.target.value)} placeholder="ფასი" className="w-full px-3 py-2 bg-gray-800/60 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500" />
            </div>
            <div className="p-3 bg-gray-800/30 rounded-xl border border-gray-700/30">
              <h4 className="text-[10px] font-bold text-green-400 uppercase mb-2">📝 დამატებითი</h4>
              <textarea value={form.special_requirements} onChange={(e) => updateField('special_requirements', e.target.value)} placeholder="სპეციალური მოთხოვნები" rows={2} className="w-full px-3 py-2 bg-gray-800/60 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500 resize-none" />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-[#1a202c] border-t border-gray-700 px-6 py-4 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-bold text-white transition">
            გაუქმება
          </button>
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="flex-1 py-2.5 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 disabled:opacity-50 rounded-lg text-xs font-bold text-white transition"
          >
            {loading ? '⏳ ინახება...' : '💾 შენახვა'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// 🗑️ DELETE CONFIRMATION
// ============================================================================
const DeleteConfirmModal = ({ order, onClose, onConfirm }: any) => {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', order.id)

      if (error) throw error

      onConfirm(order.id)
    } catch (err: any) {
      alert('❌ შეცდომა წაშლისას: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#1a202c] border border-red-500/30 rounded-2xl w-full max-w-md shadow-2xl shadow-red-500/20" onClick={e => e.stopPropagation()}>
        <div className="p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full flex items-center justify-center border-2 border-red-500/30">
            <span className="text-4xl">🗑️</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">შეკვეთის წაშლა</h3>
          <p className="text-sm text-gray-400 mb-4">
            დარწმუნებული ხართ რომ გსურთ წაშალოთ შეკვეთა?
          </p>
          <div className="bg-gray-800/50 rounded-xl p-3 mb-6 text-left">
            <p className="text-xs text-gray-400">Tracking Code:</p>
            <p className="text-sm text-white font-mono font-bold">{order.tracking_code}</p>
            <p className="text-xs text-gray-400 mt-2">მარშრუტი:</p>
            <p className="text-xs text-white truncate">{order.pickup_address} → {order.delivery_address}</p>
          </div>
          <p className="text-[10px] text-red-400 mb-6">⚠️ ეს მოქმედება შეუქცევადია!</p>
          <div className="flex gap-3">
            <button 
              onClick={onClose} 
              className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-bold text-white transition"
            >
              გაუქმება
            </button>
            <button 
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 disabled:opacity-50 rounded-lg text-xs font-bold text-white transition shadow-lg shadow-red-500/20"
            >
              {loading ? '⏳ იშლება...' : '🗑️ წაშლა'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// 📦 MY ORDERS TAB - მთავარი კომპონენტი
// ============================================================================
export default function MyOrdersTab({ orders, loading, onStatusChange, onView, getStatusColor, ActionButtons, onUpdate, onDelete }: any) {
  const [viewOrder, setViewOrder] = useState<any>(null)
  const [editOrder, setEditOrder] = useState<any>(null)
  const [deleteOrder, setDeleteOrder] = useState<any>(null)
  const [filter, setFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  if (loading) return <div className="p-8 text-center text-gray-400">იტვირთება...</div>

  // ფილტრაცია
  const filteredOrders = orders.filter((o: any) => {
    const matchesFilter = filter === 'all' || o.status === filter
    const matchesSearch = !searchQuery || 
      o.tracking_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.cargo_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.pickup_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.delivery_address?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const handleEdit = (order: any) => {
    // მხოლოდ pending შეკვეთების რედაქტირება
    if (order.status !== 'pending') {
      alert('⚠️ მხოლოდ მოლოდინში მყოფი შეკვეთების რედაქტირებაა შესაძლებელი')
      return
    }
    setEditOrder(order)
  }

  const handleDelete = (order: any) => {
    // მხოლოდ pending შეკვეთების წაშლა
    if (order.status !== 'pending') {
      alert('⚠️ მხოლოდ მოლოდინში მყოფი შეკვეთების წაშლაა შესაძლებელი')
      return
    }
    setDeleteOrder(order)
  }

  const handleSaveEdit = (updatedOrder: any) => {
    setEditOrder(null)
    if (onUpdate) onUpdate(updatedOrder)
  }

  const handleConfirmDelete = (orderId: string) => {
    setDeleteOrder(null)
    if (onDelete) onDelete(orderId)
  }

  return (
    <div className="space-y-3">
      {/* Header + Controls */}
      <div className="bg-[#1a202c] border border-gray-700 rounded-xl p-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 ძიება (tracking code, მისამართი, ტვირთი...)"
              className="w-full px-3 py-2 pl-8 bg-gray-800/60 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500 transition"
            />
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs">🔍</span>
          </div>

          {/* Filter */}
          <div className="flex gap-1 flex-wrap">
            {[
              { id: 'all', label: '📋 ყველა', count: orders.length },
              { id: 'pending', label: '⏳ მოლოდინში', count: orders.filter((o: any) => o.status === 'pending').length },
              { id: 'in_transit', label: '🚚 გზაში', count: orders.filter((o: any) => o.status === 'in_transit').length },
              { id: 'delivered', label: '✅ მიწოდებული', count: orders.filter((o: any) => o.status === 'delivered').length },
              { id: 'cancelled', label: '❌ გაუქმებული', count: orders.filter((o: any) => o.status === 'cancelled').length },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition ${
                  filter === f.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
                }`}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-700/50 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase text-gray-300">📦 ჩემი შეკვეთები</h2>
          <span className="text-[10px] text-gray-500">{filteredOrders.length} შეკვეთა</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead className="text-gray-400 uppercase bg-gray-900/40">
              <tr>
                <th className="px-4 py-3 text-left">Tracking Code</th>
                <th className="px-4 py-3 text-left">ტვირთი</th>
                <th className="px-4 py-3 text-left">მარშრუტი</th>
                <th className="px-4 py-3 text-left">თარიღი</th>
                <th className="px-4 py-3 text-left">ფასი</th>
                <th className="px-4 py-3 text-left">სტატუსი</th>
                <th className="px-4 py-3 text-right">მოქმედება</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/30">
              {filteredOrders.map((o: any) => (
                <tr key={o.id} className="hover:bg-gray-700/20 transition">
                  <td className="px-4 py-3 font-mono text-blue-400 font-bold">{o.tracking_code}</td>
                  <td className="px-4 py-3 text-gray-300 max-w-[200px] truncate">{o.cargo_description}</td>
                  <td className="px-4 py-3 text-gray-400 max-w-[200px] truncate">{o.pickup_address?.slice(0,20)}... → {o.delivery_address?.slice(0,20)}...</td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{new Date(o.created_at).toLocaleDateString('ka-GE')}</td>
                  <td className="px-4 py-3 text-gray-300 font-semibold whitespace-nowrap">{o.price} {o.currency}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[9px] border ${getStatusColor(o.status)}`}>{o.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* 👁️ ნახვა */}
                      <button 
                        onClick={() => setViewOrder(o)}
                        className="p-1.5 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-md transition"
                        title="ნახვა"
                      >
                        👁️
                      </button>
                      
                      {/* ✏️ რედაქტირება - მხოლოდ pending */}
                      {o.status === 'pending' && (
                        <button 
                          onClick={() => handleEdit(o)}
                          className="p-1.5 text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20 rounded-md transition"
                          title="რედაქტირება"
                        >
                          ✏️
                        </button>
                      )}
                      
                      {/* 🗑️ წაშლა - მხოლოდ pending */}
                      {o.status === 'pending' && (
                        <button 
                          onClick={() => handleDelete(o)}
                          className="p-1.5 text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-md transition"
                          title="წაშლა"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    {orders.length === 0 ? '📭 შეკვეთები არ არის' : '🔍 შედეგი ვერ მოიძებნა'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {viewOrder && (
        <ViewOrderModal 
          order={viewOrder} 
          onClose={() => setViewOrder(null)} 
          getStatusColor={getStatusColor}
        />
      )}
      {editOrder && (
        <EditOrderModal 
          order={editOrder} 
          onClose={() => setEditOrder(null)}
          onSave={handleSaveEdit}
        />
      )}
      {deleteOrder && (
        <DeleteConfirmModal
          order={deleteOrder}
          onClose={() => setDeleteOrder(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  )
}