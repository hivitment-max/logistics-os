'use client'

import { useState } from 'react'

interface Vehicle {
  id: string
  plate_number: string
  model: string
  type: string
  body_type?: string
  capacity_kg?: number
  volume_m3?: number
  has_tail_lift?: boolean
  straps_count?: number
  adr_capable?: boolean
  has_refrigeration?: boolean
  status: string
  driver_name?: string
  driver_photo_url?: string
  current_load_kg?: number
  current_load_m3?: number
}

interface VehiclesTabProps {
  vehicles: Vehicle[]
  loading: boolean
  onEdit: (vehicle: Vehicle) => void
  onDelete: (vehicle: Vehicle) => void
  onAdd: () => void
  getStatusColor: (status: string) => string
  ActionButtons: React.FC<{ onEdit: () => void; onDelete: () => void; onPrint?: () => void }>
  onPrint?: (vehicle: Vehicle) => void
}

// 📊 ტევადობის პროგრეს-ბარი
const CapacityBar = ({ current, max, unit, color = 'bg-blue-500' }: { current: number; max: number; unit: string; color?: string }) => {
  if (!max) return null
  const percent = Math.min((current / max) * 100, 100)
  return (
    <div className="w-full mt-2">
      <div className="flex justify-between text-[9px] text-gray-400 mb-0.5">
        <span>დატვირთვა</span>
        <span>{current.toFixed(0)} / {max} {unit}</span>
      </div>
      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

// 🏷️ ტეგების კომპონენტი
const VehicleTags = ({ vehicle }: { vehicle: Vehicle }) => {
  const tags: { label: string; color: string }[] = []
  if (vehicle.adr_capable) tags.push({ label: '⚠️ ADR', color: 'bg-red-500/10 text-red-400 border-red-500/30' })
  if (vehicle.has_refrigeration) tags.push({ label: '❄️ მაცივარი', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' })
  if (vehicle.has_tail_lift) tags.push({ label: '🔽 ლიფტი', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' })
  if ((vehicle.straps_count || 0) >= 4) tags.push({ label: '🔗 ვედები', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' })
  if (vehicle.body_type) tags.push({ label: `📦 ${vehicle.body_type}`, color: 'bg-gray-500/10 text-gray-400 border-gray-500/30' })

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {tags.map((tag, i) => (
        <span key={i} className={`text-[9px] px-1.5 py-0.5 rounded border ${tag.color}`}>
          {tag.label}
        </span>
      ))}
    </div>
  )
}

export default function VehiclesTab({ 
  vehicles, 
  loading, 
  onEdit, 
  onDelete, 
  onAdd, 
  getStatusColor, 
  ActionButtons, 
  onPrint 
}: VehiclesTabProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredVehicles = vehicles.filter(v => 
    v.plate_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.driver_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-400">მანქანების ჩატვირთვა...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 🔍 საძიებო ველი და დამატების ღილაკი */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="🔍 ძებნა ნომრით, მოდელით ან მძღოლით..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition placeholder-gray-500"
          />
        </div>
        <button
          onClick={onAdd}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition shadow-lg shadow-blue-500/20 flex items-center gap-2"
        >
          <span>➕</span> ახალი მანქანა
        </button>
      </div>

      {/* 📊 სტატისტიკა */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-white">{vehicles.length}</div>
          <div className="text-[10px] text-gray-400">სულ მანქანა</div>
        </div>
        <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-green-400">{vehicles.filter(v => v.status === 'active').length}</div>
          <div className="text-[10px] text-gray-400">აქტიური</div>
        </div>
        <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-yellow-400">{vehicles.filter(v => v.status === 'idle').length}</div>
          <div className="text-[10px] text-gray-400">ლოდინში</div>
        </div>
        <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-red-400">{vehicles.filter(v => v.status === 'maintenance').length}</div>
          <div className="text-[10px] text-gray-400">რემონტში</div>
        </div>
      </div>

      {/* 🚛 მანქანების ბარათები */}
      {filteredVehicles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <span className="text-4xl mb-3 opacity-50">🚛</span>
          <p className="text-sm font-medium">მანქანები ვერ მოიძებნა</p>
          <p className="text-xs mt-1">სცადე საძიებო სიტყვის შეცვლა ან დაამატე ახალი მანქანა</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredVehicles.map((vehicle) => (
            <div key={vehicle.id} className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-4 hover:border-blue-500/30 transition-all duration-200 group relative">
              {/* ზედა ნაწილი: ნომერი და სტატუსი */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-sm font-bold text-white font-mono tracking-wide">{vehicle.plate_number}</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">{vehicle.model} • {vehicle.type}</p>
                </div>
                <span className={`text-[9px] px-2 py-0.5 rounded-full border ${getStatusColor(vehicle.status)}`}>
                  {vehicle.status === 'active' ? '🟢 აქტიური' : 
                   vehicle.status === 'idle' ? '🟡 ლოდინში' : 
                   vehicle.status === 'maintenance' ? '🔧 რემონტში' : '⚫ არააქტიური'}
                </span>
              </div>

              {/* მძღოლის ინფო */}
              {vehicle.driver_name && (
                <div className="flex items-center gap-2 mb-3 p-2 bg-gray-700/30 rounded-lg border border-gray-600/50">
                  {vehicle.driver_photo_url ? (
                    <img src={vehicle.driver_photo_url} alt={vehicle.driver_name} className="w-8 h-8 rounded-full object-cover border border-gray-600" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-xs font-bold text-white">
                      {vehicle.driver_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium text-white truncate">{vehicle.driver_name}</p>
                    <p className="text-[9px] text-gray-400">მძღოლი</p>
                  </div>
                </div>
              )}

              {/* ტევადობის ბარები */}
              <div className="space-y-2 mb-3">
                <CapacityBar 
                  current={vehicle.current_load_kg || 0} 
                  max={vehicle.capacity_kg || 0} 
                  unit="კგ" 
                  color={((vehicle.current_load_kg || 0) / (vehicle.capacity_kg || 1)) > 0.85 ? 'bg-red-500' : 'bg-green-500'}
                />
                <CapacityBar 
                  current={vehicle.current_load_m3 || 0} 
                  max={vehicle.volume_m3 || 0} 
                  unit="მ³" 
                  color={((vehicle.current_load_m3 || 0) / (vehicle.volume_m3 || 1)) > 0.85 ? 'bg-red-500' : 'bg-blue-500'}
                />
              </div>

              {/* ტეგები */}
              <VehicleTags vehicle={vehicle} />

              {/* Action Buttons */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <ActionButtons 
                  onEdit={() => onEdit(vehicle)} 
                  onDelete={() => onDelete(vehicle)} 
                  onPrint={onPrint ? () => onPrint(vehicle) : undefined}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}