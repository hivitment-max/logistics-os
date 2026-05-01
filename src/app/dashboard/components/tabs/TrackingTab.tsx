'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

interface Order {
  id: string
  tracking_code: string
  status: string
  pickup_address: string
  delivery_address: string
  cargo_description: string
  price: number
  currency: string
  created_at: string
  drivers?: { full_name: string; phone: string } | null
  vehicles?: { plate_number: string; model: string } | null
}

export default function TrackingTab() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, pending, in_transit, delivered

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        drivers ( full_name, phone ),
        vehicles ( plate_number, model )
      `)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setOrders(data as Order[])
    }
    setLoading(false)
  }

  const filteredOrders = orders.filter(o => filter === 'all' || o.status === filter)

  if (loading) return <div className="flex items-center justify-center h-64"><span className="text-gray-400">იტვირთება...</span></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">📍 შეკვეთების მონიტორინგი</h2>
        <div className="flex gap-2">
          {[
            { id: 'all', label: 'ყველა' },
            { id: 'pending', label: '🕒 მოლოდინში' },
            { id: 'in_transit', label: '🚚 გზაში' },
            { id: 'delivered', label: '✅ მიწოდებული' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filter === f.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => {
            // სტატუსის პროგრესი (0-დან 100%-მდე)
            const getProgress = (status: string) => {
              switch (status) {
                case 'pending': return 20
                case 'in_transit': return 60
                case 'delivered': return 100
                case 'cancelled': return 0
                default: return 10
              }
            }
            const progress = getProgress(order.status)
            
            return (
              <div key={order.id} className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition">
                {/* სათაური */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-sm font-mono font-bold text-blue-400">{order.tracking_code}</span>
                    <div className="text-[10px] text-gray-500 mt-1">
                      შექმნილია: {new Date(order.created_at).toLocaleDateString('ka-GE')}
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded-full border ${
                    order.status === 'in_transit' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                    order.status === 'delivered' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                    'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                  }`}>
                    {order.status === 'pending' ? 'მოლოდინში' :
                     order.status === 'in_transit' ? 'გზაშია' :
                     order.status === 'delivered' ? 'მიწოდებულია' : order.status}
                  </span>
                </div>

                {/* მარშრუტი */}
                <div className="text-sm text-gray-300 mb-4 flex items-center gap-2">
                   <span className="text-gray-500">საწყისი:</span> <span className="truncate max-w-[150px]">{order.pickup_address}</span>
                   <span className="text-gray-600">→</span>
                   <span className="text-gray-500">დანიშნულება:</span> <span className="truncate max-w-[150px]">{order.delivery_address}</span>
                </div>

                {/* პროგრეს ბარი */}
                <div className="w-full bg-gray-700 rounded-full h-2 mb-4 overflow-hidden">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      order.status === 'delivered' ? 'bg-green-500' :
                      order.status === 'cancelled' ? 'bg-red-500' : 'bg-blue-500'
                    }`} 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>

                {/* დეტალები */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs border-t border-gray-700/50 pt-3">
                  <div>
                    <span className="block text-gray-500 mb-1">🚛 მანქანა</span>
                    <span className="text-white font-medium">{order.vehicles?.plate_number || '–'}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 mb-1">👨‍✈️ მძღოლი</span>
                    <span className="text-white font-medium">{order.drivers?.full_name || '–'}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 mb-1">📦 ტვირთი</span>
                    <span className="text-white font-medium truncate block">{order.cargo_description || '–'}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-gray-500 mb-1">💰 ღირებულება</span>
                    <span className="text-white font-bold">{order.price} {order.currency}</span>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-center py-10 bg-gray-800/40 rounded-xl border border-dashed border-gray-700">
            <span className="text-4xl block mb-2">🔍</span>
            <p className="text-gray-500">ამ სტატუსით შეკვეთები არ მოიძებნა</p>
          </div>
        )}
      </div>
    </div>
  )
}