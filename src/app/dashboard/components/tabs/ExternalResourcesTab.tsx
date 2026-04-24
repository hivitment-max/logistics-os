'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import LoadingTruck from '@/app/dashboard/components/ui/LoadingTruck'

interface ExternalResourcesTabProps {
  loading: boolean
}

export default function ExternalResourcesTab({ loading }: ExternalResourcesTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'drivers' | 'vehicles'>('drivers')
  const [extDrivers, setExtDrivers] = useState<any[]>([])
  const [extVehicles, setExtVehicles] = useState<any[]>([])
  const [showDriverForm, setShowDriverForm] = useState(false)
  const [showVehicleForm, setShowVehicleForm] = useState(false)

  const loadExternalResources = async () => {
    const [dRes, vRes] = await Promise.all([
      supabase.from('external_drivers').select('*').order('created_at', { ascending: false }),
      supabase.from('external_vehicles').select('*').order('created_at', { ascending: false })
    ])
    if (dRes.data) setExtDrivers(dRes.data)
    if (vRes.data) setExtVehicles(vRes.data)
  }

  useEffect(() => { loadExternalResources() }, [])

  const handleAddExtDriver = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = new FormData(e.target as HTMLFormElement)
    const { error } = await supabase.from('external_drivers').insert({
      full_name: form.get('full_name'),
      phone: form.get('phone'),
      license_number: form.get('license_number'),
      license_type: form.get('license_type'),
      rate_per_km: parseFloat(form.get('rate_per_km') as string) || 0,
      notes: form.get('notes')
    })
    if (!error) { loadExternalResources(); setShowDriverForm(false) }
  }

  const handleAddExtVehicle = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = new FormData(e.target as HTMLFormElement)
    const { error } = await supabase.from('external_vehicles').insert({
      plate_number: form.get('plate_number'),
      model: form.get('model'),
      type: form.get('type'),
      owner_name: form.get('owner_name'),
      rate_per_km: parseFloat(form.get('rate_per_km') as string) || 0,
      notes: form.get('notes')
    })
    if (!error) { loadExternalResources(); setShowVehicleForm(false) }
  }

  if (loading) return <LoadingTruck message="გარე რესურსები იტვირთება..." size="md" />

  return (
    <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-700/50 flex justify-between items-center bg-gray-800/80">
        <div className="flex gap-3">
          <button onClick={() => setActiveSubTab('drivers')} className={`px-3 py-1.5 rounded text-[10px] font-semibold transition ${activeSubTab === 'drivers' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}>👨‍✈️ გარე მძღოლები</button>
          <button onClick={() => setActiveSubTab('vehicles')} className={`px-3 py-1.5 rounded text-[10px] font-semibold transition ${activeSubTab === 'vehicles' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}>🚐 გარე მანქანები</button>
        </div>
        <button onClick={() => activeSubTab === 'drivers' ? setShowDriverForm(true) : setShowVehicleForm(true)} className="bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded text-[10px] font-semibold transition">+ დამატება</button>
      </div>

      {activeSubTab === 'drivers' && (
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead className="text-gray-500 uppercase bg-gray-900/40"><tr><th className="px-4 py-3 text-left">სახელი</th><th className="px-4 py-3 text-left">ტელეფონი</th><th className="px-4 py-3 text-left">ლიცენზია</th><th className="px-4 py-3 text-left">ფასი/კმ</th></tr></thead>
            <tbody className="divide-y divide-gray-700/30">
              {extDrivers.map(d => (
                <tr key={d.id} className="hover:bg-gray-700/20"><td className="px-4 py-3 text-gray-200">{d.full_name}</td><td className="px-4 py-3 text-gray-400">{d.phone}</td><td className="px-4 py-3 text-gray-400">{d.license_type} • {d.license_number}</td><td className="px-4 py-3 font-medium">{d.rate_per_km} ₾</td></tr>
              ))}
              {extDrivers.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">გარე მძღოლები არ არის</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {activeSubTab === 'vehicles' && (
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead className="text-gray-500 uppercase bg-gray-900/40"><tr><th className="px-4 py-3 text-left">სანომრე</th><th className="px-4 py-3 text-left">მოდელი</th><th className="px-4 py-3 text-left">მფლობელი</th><th className="px-4 py-3 text-left">ფასი/კმ</th></tr></thead>
            <tbody className="divide-y divide-gray-700/30">
              {extVehicles.map(v => (
                <tr key={v.id} className="hover:bg-gray-700/20"><td className="px-4 py-3 font-mono font-bold text-blue-400">{v.plate_number}</td><td className="px-4 py-3 text-gray-200">{v.model}</td><td className="px-4 py-3 text-gray-400">{v.owner_name}</td><td className="px-4 py-3 font-medium">{v.rate_per_km} ₾</td></tr>
              ))}
              {extVehicles.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">გარე მანქანები არ არის</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* მოდალები დამატებისთვის */}
      {showDriverForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-md p-5">
            <h3 className="text-sm font-bold text-white mb-4">👨‍✈️ გარე მძღოლის დამატება</h3>
            <form onSubmit={handleAddExtDriver} className="space-y-3">
              <input name="full_name" placeholder="სრული სახელი" required className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-xs text-white" />
              <input name="phone" placeholder="ტელეფონი" className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-xs text-white" />
              <input name="license_number" placeholder="ლიცენზიის ნომერი" className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-xs text-white" />
              <select name="license_type" className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-xs text-white">
                <option value="B">B</option><option value="C">C</option><option value="C+E">C+E</option>
              </select>
              <input name="rate_per_km" type="number" placeholder="ფასი ჯამზე (₾/კმ)" step="0.01" className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-xs text-white" />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowDriverForm(false)} className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded text-xs">გაუქმება</button>
                <button type="submit" className="flex-1 py-2 bg-green-600 hover:bg-green-700 rounded text-xs font-bold">შენახვა</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showVehicleForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-md p-5">
            <h3 className="text-sm font-bold text-white mb-4">🚐 გარე მანქანის დამატება</h3>
            <form onSubmit={handleAddExtVehicle} className="space-y-3">
              <input name="plate_number" placeholder="სანომრე ნიშანი" required className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-xs text-white" />
              <input name="model" placeholder="მარკა/მოდელი" className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-xs text-white" />
              <select name="type" className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-xs text-white">
                <option value="truck">სატვირთო</option><option value="van">ფურგონი</option><option value="car">მსუბუქი</option>
              </select>
              <input name="owner_name" placeholder="მფლობელის სახელი" className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-xs text-white" />
              <input name="rate_per_km" type="number" placeholder="ფასი ჯამზე (₾/კმ)" step="0.01" className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-xs text-white" />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowVehicleForm(false)} className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded text-xs">გაუქმება</button>
                <button type="submit" className="flex-1 py-2 bg-green-600 hover:bg-green-700 rounded text-xs font-bold">შენახვა</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}