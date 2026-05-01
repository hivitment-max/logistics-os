'use client'
import { useState, FormEvent } from 'react'

export default function NewOrderTab({ onCreateOrder }: any) {
  const [form, setForm] = useState({
    pickup_address: '', delivery_address: '', cargo_description: '',
    cargo_weight_kg: '', price: '', currency: 'GEL', notes: ''
  })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const newOrder = {
      ...form,
      tracking_code: `LOG-${Date.now().toString().slice(-6)}`,
      status: 'pending',
      created_at: new Date().toISOString()
    }
    onCreateOrder(newOrder)
  }

  return (
    <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-6">
      <h2 className="text-sm font-bold mb-4">🚀 ახალი შეკვეთა</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 mb-1">📍 ატვირთვის მისამართი</label>
            <input required className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-xs outline-none focus:border-blue-500"
              value={form.pickup_address} onChange={(e) => setForm({...form, pickup_address: e.target.value})} />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 mb-1">🏁 ჩატვირთვის მისამართი</label>
            <input required className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-xs outline-none focus:border-blue-500"
              value={form.delivery_address} onChange={(e) => setForm({...form, delivery_address: e.target.value})} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-semibold text-gray-400 mb-1">📦 ტვირთის აღწერა</label>
            <textarea required rows={3} className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-xs outline-none focus:border-blue-500 resize-none"
              value={form.cargo_description} onChange={(e) => setForm({...form, cargo_description: e.target.value})} />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 mb-1">⚖️ წონა (კგ)</label>
            <input type="number" className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-xs outline-none focus:border-blue-500"
              value={form.cargo_weight_kg} onChange={(e) => setForm({...form, cargo_weight_kg: e.target.value})} />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 mb-1">💰 ფასი</label>
            <input type="number" className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-xs outline-none focus:border-blue-500"
              value={form.price} onChange={(e) => setForm({...form, price: e.target.value})} />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 mb-1">💵 ვალუტა</label>
            <select className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-xs outline-none"
              value={form.currency} onChange={(e) => setForm({...form, currency: e.target.value})}>
              <option value="GEL">GEL</option><option value="USD">USD</option><option value="EUR">EUR</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-semibold text-gray-400 mb-1">📝 დამატებითი შენიშვნა</label>
            <textarea rows={2} className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-xs outline-none focus:border-blue-500 resize-none"
              value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} />
          </div>
        </div>
        <div className="flex gap-3 pt-4 border-t border-gray-700">
          <button type="submit" className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-bold transition">✅ შექმნა</button>
        </div>
      </form>
    </div>
  )
}