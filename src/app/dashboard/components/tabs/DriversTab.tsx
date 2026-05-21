'use client'

import { useState, useMemo } from 'react'

interface Driver {
  id: string
  full_name: string
  phone: string
  email?: string
  photo_url?: string
  license_number: string
  license_expiry?: string
  has_adr: boolean
  languages?: string | string[]
  employment_type: 'internal' | 'contractor'
  status: 'available' | 'on_route' | 'off' | 'inactive'
  current_location?: string
  assigned_vehicle?: { id: string; plate_number: string; model: string }
}

interface DriversTabProps {
  drivers: Driver[]
  loading: boolean
  onEdit: (driver: Driver) => void
  onDelete: (driver: Driver) => void
  onAdd: () => void
  onAssignVehicle?: (driverId: string, vehicleId: string) => void
  getStatusColor: (status: string) => string
  ActionButtons: React.FC<{ onEdit: () => void; onDelete: () => void; onPrint?: () => void }>
  onPrint?: (driver: Driver) => void
}

const StatCard = ({ title, value, icon, color }: { title: string; value: number; icon: string; color: string }) => (
  <div className="bg-gray-800/40 border border-gray-700/40 rounded-xl p-3 text-center transition hover:bg-gray-800/60">
    <div className={`text-2xl font-bold text-${color}-400`}>{icon} {value}</div>
    <div className="text-[10px] text-gray-400 mt-0.5 font-medium">{title}</div>
  </div>
)

const DriverCard = ({ driver, onEdit, onDelete, onCall, onEmail, onViewProfile }: any) => {
  const statusMap: any = {
    available: { label: 'ხელმისაწვდომი', gradient: 'from-green-400 to-emerald-500', glow: 'shadow-green-500/30', pulse: 'animate-pulse' },
    on_route: { label: 'რეისში', gradient: 'from-yellow-400 to-orange-500', glow: 'shadow-yellow-500/30', pulse: '' },
    off: { label: 'დასვენება', gradient: 'from-red-400 to-rose-500', glow: 'shadow-red-500/30', pulse: '' },
    inactive: { label: 'არააქტიური', gradient: 'from-gray-400 to-gray-500', glow: 'shadow-gray-500/30', pulse: '' },
  }
  const s = statusMap[driver.status] || statusMap.inactive

  return (
    <div onClick={onViewProfile} className={`group relative w-52 flex flex-col items-center p-4 bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-3xl hover:bg-gray-800/60 hover:border-gray-600 hover:shadow-2xl ${s.glow} hover:-translate-y-1.5 transition-all duration-500 ease-out cursor-pointer overflow-hidden`}>
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${s.gradient} opacity-80`}></div>
      <div className="relative mb-4">
        <div className={`absolute -inset-0.5 bg-gradient-to-br ${s.gradient} rounded-2xl blur opacity-40 group-hover:opacity-75 transition duration-500 ${s.pulse}`}></div>
        <div className="relative w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-700">
          {driver.photo_url ? <img src={driver.photo_url} alt={driver.full_name} className="w-full h-full object-cover" /> : <span className="text-xl font-bold text-white">{driver.full_name.charAt(0).toUpperCase()}</span>}
        </div>
        <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-900 bg-gradient-to-br ${s.gradient} ${s.pulse}`} title={s.label}></span>
      </div>
      <h3 className="text-sm font-bold text-white text-center truncate w-full mb-1 group-hover:text-blue-300 transition-colors">{driver.full_name}</h3>
      <a href={`tel:${driver.phone}`} onClick={(e:any)=>{e.stopPropagation(); onCall()}} className="text-[10px] text-gray-400 hover:text-blue-400 transition-colors mb-3 flex items-center justify-center gap-1"><span className="opacity-70">📞</span><span className="truncate max-w-[180px]">{driver.phone}</span></a>
      <div className="flex items-center justify-center gap-1.5 mb-4">
        {driver.has_adr && <span className="text-[10px] px-1.5 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20" title="ADR">⚠️</span>}
        {driver.languages && driver.languages.toString().trim() !== '' && <span className="text-[10px] px-1.5 py-1 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20" title="ენები">🗣️</span>}
        <span className={`text-[10px] px-1.5 py-1 rounded-lg border ${driver.employment_type === 'internal' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`} title={driver.employment_type === 'internal' ? 'კომპანია' : 'კონტრაქტი'}>{driver.employment_type === 'internal' ? '🏢' : '🤝'}</span>
      </div>
      <div className="space-y-1.5 w-full mb-4">
        {driver.current_location && <div className="flex items-center justify-center gap-1.5 text-[9px] text-gray-400"><span>📍</span><span className="truncate text-center">{driver.current_location}</span></div>}
        {driver.assigned_vehicle && <div className="flex items-center justify-center gap-1.5 text-[9px]"><span>🚛</span><span className="text-blue-400 truncate text-center">{driver.assigned_vehicle.plate_number}</span></div>}
      </div>
      <div className="flex items-center justify-center gap-2 pt-3 border-t border-gray-700/50 w-full opacity-0 group-hover:opacity-100 transition-opacity" onClick={e=>e.stopPropagation()}>
        <button onClick={onCall} className="p-2 rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500/20 transition" title="დარეკვა">📞</button>
        {driver.email && <button onClick={onEmail} className="p-2 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition" title="ემაილი">📧</button>}
        <button onClick={onEdit} className="p-2 rounded-xl bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition" title="რედაქტირება">✏️</button>
        <button onClick={onDelete} className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition" title="წაშლა">🗑️</button>
      </div>
    </div>
  )
}

export default function DriversTab({ drivers, loading, onEdit, onDelete, onAdd, getStatusColor, ActionButtons }: any) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({ status: '', adr: '', type: '' })

  const filteredDrivers = useMemo(() => {
    return drivers.filter((d: any) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        if (![d.full_name, d.phone, d.license_number, d.current_location].join('').toLowerCase().includes(term)) return false
      }
      if (filters.status && d.status !== filters.status) return false
      if (filters.adr === 'true' && !d.has_adr) return false
      if (filters.adr === 'false' && d.has_adr) return false
      if (filters.type && d.employment_type !== filters.type) return false
      return true
    })
  }, [drivers, searchTerm, filters])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div><span className="ml-3 text-gray-400">იტვირთება...</span></div>

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title="სულ" value={drivers.length} icon="👥" color="gray" />
        <StatCard title="ხელმისაწვდომი" value={drivers.filter((d:any)=>d.status==='available').length} icon="🟢" color="green" />
        <StatCard title="ADR" value={drivers.filter((d:any)=>d.has_adr).length} icon="⚠️" color="red" />
        <StatCard title="რეისში" value={drivers.filter((d:any)=>d.status==='on_route').length} icon="🟡" color="yellow" />
      </div>
      <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
        <input type="text" placeholder="🔍 ძებნა..." value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} className="w-full lg:w-80 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500" />
        <div className="flex flex-wrap gap-2">
          <select value={filters.status} onChange={(e:any)=>setFilters({...filters, status:e.target.value})} className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-xs text-white">
            <option value="">ყველა სტატუსი</option>
            <option value="available">🟢 ხელმისაწვდომი</option>
            <option value="on_route">🟡 რეისში</option>
            <option value="off">🔴 დასვენება</option>
          </select>
          <select value={filters.adr} onChange={(e:any)=>setFilters({...filters, adr:e.target.value})} className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-xs text-white">
            <option value="">ყველა</option>
            <option value="true">⚠️ ADR</option>
          </select>
        </div>
      </div>
      {filteredDrivers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500 bg-gray-800/30 border border-gray-700/30 rounded-xl">
          <span className="text-4xl mb-3 opacity-50">👨‍✈️</span>
          <p className="text-sm font-medium">მძღოლები ვერ მოიძებნა</p>
          <button onClick={onAdd} className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition">+ ახალი მძღოლი</button>
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-6 py-4">
          {filteredDrivers.map((driver:any) => (
            <DriverCard key={driver.id} driver={driver} onEdit={()=>onEdit(driver)} onDelete={()=>onDelete(driver)} onCall={()=>window.open(`tel:${driver.phone}`)} onEmail={()=>{}} onViewProfile={()=>{}} />
          ))}
        </div>
      )}
    </div>
  )
}