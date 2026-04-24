'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function FleetManagement({ setNotification }: { setNotification: any }) {
  const [activeTab, setActiveTab] = useState<'drivers' | 'vehicles'>('drivers')
  const [drivers, setDrivers] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // მოდალების მართვა
  const [showDriverModal, setShowDriverModal] = useState(false)
  const [showVehicleModal, setShowVehicleModal] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)

  // მონაცემების ჩატვირთვა
  const fetchData = async () => {
    setLoading(true)
    const [driversRes, vehiclesRes] = await Promise.all([
      supabase.from('drivers').select('*').order('created_at', { ascending: false }),
      supabase.from('vehicles').select('*').order('created_at', { ascending: false })
    ])
    if (driversRes.data) setDrivers(driversRes.data)
    if (vehiclesRes.data) setVehicles(vehiclesRes.data)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  // ვადების შემოწმება (ალერტები)
  const getExpiryAlerts = () => {
    const today = new Date()
    const alerts: string[] = []
    
    drivers.forEach(d => {
      if (d.license_expiry && new Date(d.license_expiry) < new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)) {
        alerts.push(`⚠️ მძღოლი ${d.full_name}: მართვის მოწმობის ვადა მთავრდება!`)
      }
    })
    vehicles.forEach(v => {
      if (v.insurance_expiry && new Date(v.insurance_expiry) < new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)) {
        alerts.push(`⚠️ მანქანა ${v.plate_number}: დაზღვევის ვადა მთავრდება!`)
      }
    })
    return alerts
  }

  const alerts = getExpiryAlerts()

  // დამახსოვრების ლოგიკა
  const handleSaveDriver = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)
    const data = Object.fromEntries(formData.entries())
    
    // ვადების ფორმატირება
    data.license_expiry = data.license_expiry || ''
    data.date_of_birth = data.date_of_birth || ''

    const { error } = editItem 
      ? await supabase.from('drivers').update(data).eq('id', editItem.id)
      : await supabase.from('drivers').insert([data])

    if (error) {
      setNotification({ type: 'error', message: `❌ ${error.message}` })
    } else {
      setNotification({ type: 'success', message: editItem ? '✅ განახლდა' : '✅ შეიქმნა' })
      setShowDriverModal(false)
      setEditItem(null)
      fetchData()
    }
  }

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)
    const data = Object.fromEntries(formData.entries())

    const { error } = editItem
      ? await supabase.from('vehicles').update(data).eq('id', editItem.id)
      : await supabase.from('vehicles').insert([data])

    if (error) {
      setNotification({ type: 'error', message: `❌ ${error.message}` })
    } else {
      setNotification({ type: 'success', message: editItem ? '✅ განახლდა' : '✅ შეიქმნა' })
      setShowVehicleModal(false)
      setEditItem(null)
      fetchData()
    }
  }

  if (loading) return <div className="text-center py-10">🔄 იტვირთება...</div>

  return (
    <div className="space-y-6">
      {/* 🔔 ალერტები (ვადები) */}
      {alerts.length > 0 && (
        <div className="bg-red-900/30 border border-red-500/50 p-4 rounded-xl">
          <h4 className="text-red-400 font-bold mb-2">⚠️ ყურადღება! ვადები მთავრდება:</h4>
          <ul className="list-disc pl-5 text-sm text-red-300">
            {alerts.map((alert, i) => <li key={i}>{alert}</li>)}
          </ul>
        </div>
      )}

      {/* 📑 ტაბები */}
      <div className="flex border-b border-gray-700 gap-6">
        <button onClick={() => setActiveTab('drivers')} className={`pb-3 px-1 font-medium border-b-2 ${activeTab === 'drivers' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400'}`}>🚛 მძღოლები</button>
        <button onClick={() => setActiveTab('vehicles')} className={`pb-3 px-1 font-medium border-b-2 ${activeTab === 'vehicles' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400'}`}>🚐 მანქანები</button>
      </div>

      {/* 🚛 DRIVERS TAB */}
      {activeTab === 'drivers' && (
        <div>
          <div className="flex justify-between mb-4">
            <h3 className="text-xl font-bold">მძღოლების ბაზა ({drivers.length})</h3>
            <button onClick={() => { setEditItem(null); setShowDriverModal(true) }} className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700">➕ ახალი მძღოლი</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {drivers.map(d => (
              <div key={d.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 hover:border-blue-500 transition">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-lg">{d.full_name}</h4>
                    <p className="text-sm text-gray-400">📞 {d.phone}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${d.is_available ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
                    {d.is_available ? '🟢 თავისუფალი' : '🔴 დაკავებული'}
                  </span>
                </div>
                <div className="text-sm text-gray-300 space-y-1 mt-3">
                  <p>📜 ლიცენზია: {d.license_type} ({d.license_number})</p>
                  <p>📅 ვადა: {d.license_expiry || 'N/A'}</p>
                  <p>⭐ რეიტინგი: {d.rating || '5.0'}</p>
                </div>
                <button onClick={() => { setEditItem(d); setShowDriverModal(true) }} className="mt-3 w-full py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm">✏️ რედაქტირება</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🚐 VEHICLES TAB */}
      {activeTab === 'vehicles' && (
        <div>
          <div className="flex justify-between mb-4">
            <h3 className="text-xl font-bold">ავტოპარკი ({vehicles.length})</h3>
            <button onClick={() => { setEditItem(null); setShowVehicleModal(true) }} className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700">➕ ახალი მანქანა</button>
          </div>
          <div className="overflow-x-auto bg-gray-800 rounded-xl border border-gray-700">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-700/50 text-gray-400 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">მანქანა</th>
                  <th className="px-4 py-3">მონაცემები</th>
                  <th className="px-4 py-3">ტექნიკური</th>
                  <th className="px-4 py-3">სტატუსი</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map(v => (
                  <tr key={v.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                    <td className="px-4 py-3">
                      <p className="font-bold">{v.plate_number}</p>
                      <p className="text-gray-400">{v.model} ({v.type})</p>
                    </td>
                    <td className="px-4 py-3">
                      <p>ტევადობა: {v.capacity_kg} კგ</p>
                      <p className="text-gray-400 text-xs">VIN: {v.vin_number || '-'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p>გარბენი: {v.mileage || 0} კმ</p>
                      <p className="text-red-400 text-xs">დაზღვევა: {v.insurance_expiry || '-'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${v.status === 'active' ? 'bg-green-600/20 text-green-400' : 'bg-orange-600/20 text-orange-400'}`}>
                        {v.status === 'active' ? 'აქტიური' : 'რემონტი'}
                      </span>
                      <button onClick={() => { setEditItem(v); setShowVehicleModal(true) }} className="ml-2 text-blue-400 hover:underline text-xs">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ➕ DRIVER MODAL */}
      {showDriverModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowDriverModal(false)}>
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">🚛 {editItem ? 'რედაქტირება' : 'ახალი მძღოლი'}</h3>
              <button onClick={() => setShowDriverModal(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <form onSubmit={handleSaveDriver} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input name="full_name" required defaultValue={editItem?.full_name} placeholder="სრული სახელი" className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg outline-none" />
                <input name="phone" required defaultValue={editItem?.phone} placeholder="ტელეფონი" className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg outline-none" />
                <input name="license_number" required defaultValue={editItem?.license_number} placeholder="ლიცენზიის ნომერი" className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg outline-none" />
                <select name="license_type" defaultValue={editItem?.license_type || 'C'} className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg outline-none">
                  <option value="B">კატეგორია B</option>
                  <option value="C">კატეგორია C</option>
                  <option value="C+E">კატეგორია C+E</option>
                  <option value="ADR">ADR (სახიფათო)</option>
                </select>
                <div>
                  <label className="text-xs text-gray-400">ლიცენზიის ვადა</label>
                  <input type="date" name="license_expiry" defaultValue={editItem?.license_expiry} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg outline-none" />
                </div>
                <div>
                  <label className="text-xs text-gray-400">დაბადების თარიღი</label>
                  <input type="date" name="date_of_birth" defaultValue={editItem?.date_of_birth} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg outline-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowDriverModal(false)} className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-semibold">გაუქმება</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold">💾 შენახვა</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ➕ VEHICLE MODAL */}
      {showVehicleModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowVehicleModal(false)}>
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">🚐 {editItem ? 'რედაქტირება' : 'ახალი მანქანა'}</h3>
              <button onClick={() => setShowVehicleModal(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <form onSubmit={handleSaveVehicle} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input name="plate_number" required defaultValue={editItem?.plate_number} placeholder="სანომრე ნიშანი" className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg outline-none" />
                <input name="model" required defaultValue={editItem?.model} placeholder="მარკა/მოდელი" className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg outline-none" />
                <input name="vin_number" defaultValue={editItem?.vin_number} placeholder="VIN კოდი" className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg outline-none" />
                <input name="capacity_kg" type="number" defaultValue={editItem?.capacity_kg} placeholder="ტევადობა (კგ)" className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg outline-none" />
                <input name="mileage" type="number" defaultValue={editItem?.mileage} placeholder="გარბენი (კმ)" className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg outline-none" />
                <select name="type" defaultValue={editItem?.type || 'truck'} className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg outline-none">
                  <option value="truck">სატვირთო</option>
                  <option value="van">ფურგონი</option>
                  <option value="car">მსუბუქი</option>
                </select>
                <div>
                  <label className="text-xs text-gray-400">დაზღვევის ვადა</label>
                  <input type="date" name="insurance_expiry" defaultValue={editItem?.insurance_expiry} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg outline-none" />
                </div>
                <div>
                  <label className="text-xs text-gray-400">მომდევნო ტექმომსახურება</label>
                  <input type="date" name="next_maintenance" defaultValue={editItem?.next_maintenance} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg outline-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowVehicleModal(false)} className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-semibold">გაუქმება</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold">💾 შენახვა</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}