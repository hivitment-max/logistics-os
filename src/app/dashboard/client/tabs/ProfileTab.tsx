'use client'
import { useState, FormEvent } from 'react'

export default function ProfileTab({ user, onUpdate }: any) {
  const [form, setForm] = useState({
    full_name: user?.user_metadata?.full_name || '',
    phone: user?.user_metadata?.phone || '',
    address: user?.user_metadata?.address || ''
  })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await onUpdate(form)
  }

  return (
    <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-6 max-w-2xl">
      <h2 className="text-sm font-bold mb-4">👤 პროფილი</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] font-semibold text-gray-400 mb-1">Email</label>
          <input disabled value={user?.email} className="w-full px-3 py-2 bg-gray-700/30 border border-gray-600 rounded-lg text-xs text-gray-500" />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-gray-400 mb-1">სახელი და გვარი</label>
          <input className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-xs outline-none focus:border-blue-500"
            value={form.full_name} onChange={(e) => setForm({...form, full_name: e.target.value})} />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-gray-400 mb-1">ტელეფონი</label>
          <input className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-xs outline-none focus:border-blue-500"
            value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-gray-400 mb-1">მისამართი</label>
          <textarea rows={3} className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-xs outline-none focus:border-blue-500 resize-none"
            value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} />
        </div>
        <div className="flex gap-3 pt-4 border-t border-gray-700">
          <button type="submit" className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-bold transition">💾 შენახვა</button>
        </div>
      </form>
    </div>
  )
}