'use client'
import LoadingTruck from '@/app/dashboard/components/ui/LoadingTruck'

interface VehiclesTabProps {
  vehicles: any[]
  loading: boolean
  onEdit: (vehicle: any) => void
  onDelete: (vehicle: any) => void
  onAdd: () => void
  getStatusColor: (status: string) => string
  ActionButtons: React.ComponentType<{ onEdit: () => void; onDelete: () => void; onPrint?: () => void }>
  onPrint?: (vehicle: any) => void
}

// 🎨 Helper: PTI ვადის სტატუსი
const getPTIStatus = (expiry: string) => {
  if (!expiry) return { label: '–', color: 'text-gray-400' }
  const expiryDate = new Date(expiry)
  const today = new Date()
  const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysLeft < 0) return { label: 'ვადაგასული', class: 'bg-red-500/15 text-red-400 border-red-500/20' }
  if (daysLeft <= 30) return { label: `${daysLeft}დ.`, class: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20' }
  return { label: `${daysLeft}დ.`, class: 'bg-green-500/15 text-green-400 border-green-500/20' }
}

// 🎨 Helper: ძარის ტიპის ემოჯი
const getBodyTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    'refrigerated': '❄️', 'tent': '🟦', 'container': '📦', 
    'flatbed': '🔩', 'bulk': '🌾', 'truck': '🚛', 'van': '🚐'
  }
  return icons[type] || '🚛'
}

export default function VehiclesTab({ 
  vehicles, loading, onEdit, onDelete, onAdd, getStatusColor, ActionButtons, onPrint 
}: VehiclesTabProps) {
  if (loading) return <LoadingTruck message="ავტოპარკი იტვირთება..." size="md" />

  return (
    <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-700/50 flex justify-between items-center bg-gray-800/80">
        <h2 className="text-xs font-bold uppercase text-gray-300">🚐 ავტოპარკი</h2>
        <button onClick={onAdd} className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded text-[10px] font-semibold transition">+ ახალი</button>
      </div>

      {/* 💻 დესკტოპის ხედვა - მხოლოდ ეს არის დარჩენილი */}
      <div className="block overflow-x-auto">
        <table className="w-full text-[10px] table-fixed">
          <thead className="text-gray-400 uppercase bg-gray-900/40 text-[9px] tracking-wider">
            <tr>
              <th className="px-3 py-3 text-left w-[90px]">სანომრე</th>
              <th className="px-3 py-3 text-left w-[100px]">VIN</th>
              <th className="px-3 py-3 text-left w-[70px]">PTI</th>
              <th className="px-3 py-3 text-left w-[110px]">დაზღვევა</th>
              <th className="px-3 py-3 text-left w-[100px]">მოდელი / ძარა</th>
              <th className="px-3 py-3 text-left w-[65px]">ტევად.</th>
              <th className="px-3 py-3 text-left w-[75px]">გაბარიტ.</th>
              <th className="px-3 py-3 text-left w-[75px]">ADR/EURO</th>
              <th className="px-3 py-3 text-left w-[85px]">აღჭურვ.</th>
              <th className="px-3 py-3 text-left w-[85px]">GPS/Fuel</th>
              <th className="px-3 py-3 text-left w-[70px]">საბურ.</th>
              <th className="px-3 py-3 text-left w-[95px]">მფლობელი</th>
              <th className="px-3 py-3 text-left w-[65px]">სტატუსი</th>
              <th className="px-3 py-3 text-right w-[90px]">მოქმედება</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/30">
            {vehicles.map(v => {
              const pti = getPTIStatus(v.pti_expiry)
              return (
                <tr key={v.id} className="hover:bg-gray-700/20 transition group">
                  {/* 🔴 High Priority */}
                  <td className="px-3 py-2 whitespace-nowrap font-mono font-bold text-blue-400 truncate" title={v.plate_number}>
                    {v.plate_number}
                  </td>
                  
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="group relative inline-block cursor-help">
                      <span className="text-gray-400 font-mono text-[9px] truncate block max-w-[90px]">
                        {v.vin_number?.slice(0,8)}...
                      </span>
                      <div className="hidden group-hover:block absolute z-50 bg-gray-900 border border-gray-700 text-white text-[10px] px-2 py-1.5 rounded shadow-xl -mt-7 left-0 whitespace-nowrap pointer-events-none">
                        VIN: {v.vin_number || '–'}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-3 py-2 whitespace-nowrap">
                    {v.pti_expiry ? (
                      <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[9px] font-medium border ${pti.class}`} title={v.pti_expiry}>
                        {pti.label}
                      </span>
                    ) : <span className="text-gray-500">–</span>}
                  </td>
                  
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {v.insurance_policy && <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[9px] font-medium border border-emerald-500/20">სამოქალაქო</span>}
                      {v.insurance_cmre_policy && <span className="px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 text-[9px] font-medium border border-blue-500/20">CMR</span>}
                      {!v.insurance_policy && !v.insurance_cmre_policy && <span className="text-gray-500 text-[9px]">–</span>}
                    </div>
                  </td>
                  
                  {/* 🟡 Medium Priority */}
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-gray-200 truncate" title={v.model}>{v.model}</div>
                    <div className="text-gray-400 text-[9px]">{getBodyTypeIcon(v.body_type)} {v.body_type}</div>
                  </td>
                  
                  <td className="px-3 py-2 whitespace-nowrap text-gray-400">
                    {v.capacity_kg ? `${(v.capacity_kg/1000).toFixed(1)}ტ` : '–'}
                  </td>
                  
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="group relative inline-block cursor-help">
                      <span className="text-gray-400 text-[9px]">
                        {v.length_m ? `${v.length_m}×${v.width_m}მ` : '–'}
                      </span>
                      <div className="hidden group-hover:block absolute z-50 bg-gray-900 border border-gray-700 text-white text-[10px] px-2 py-1.5 rounded shadow-xl -mt-7 left-0 whitespace-nowrap pointer-events-none">
                        {v.length_m && v.width_m && v.height_m ? `${v.length_m}×${v.width_m}×${v.height_m}მ • ${v.volume_m3 || '–'}m³` : '–'}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {v.adr_class && <span className="text-orange-400 text-[9px]">ADR {v.adr_class}</span>}
                      <span className="text-gray-400 text-[9px]">EU{v.euro_standard || '–'}</span>
                    </div>
                  </td>
                  
                  <td className="px-3 py-2 whitespace-nowrap text-gray-400 text-[9px]">
                    <div className="flex items-center gap-1.5">
                      {v.has_tail_lift && <span title="Tail Lift">⬇️</span>}
                      {v.straps_count && <span title="ღვედები">{v.straps_count}🪢</span>}
                      {!v.has_tail_lift && !v.straps_count && <span>–</span>}
                    </div>
                  </td>
                  
                  {/* 🔵 Low Priority */}
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="group relative inline-block cursor-help">
                      <div className="flex items-center gap-1.5">
                        {v.gps_device_id && <span className="text-purple-400" title="აქვს GPS">📡</span>}
                        {v.has_fuel_sensor && <span className="text-green-400" title="აქვს საწვავის სენსორი">⛽</span>}
                        {!v.gps_device_id && !v.has_fuel_sensor && <span className="text-gray-500">–</span>}
                      </div>
                      <div className="hidden group-hover:block absolute z-50 bg-gray-900 border border-gray-700 text-white text-[10px] px-2 py-1.5 rounded shadow-xl -mt-7 left-0 whitespace-nowrap pointer-events-none">
                        GPS: {v.gps_device_id || '–'}<br/>
                        Fuel Sensor: {v.has_fuel_sensor ? '✅' : '❌'}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-3 py-2 whitespace-nowrap text-gray-400 text-[9px]">
                    <div className="flex items-center gap-1.5">
                      {v.tire_season && <span>{v.tire_season === 'winter' ? '❄️' : v.tire_season === 'summer' ? '☀️' : '🌤️'}</span>}
                      <span className={v.tire_condition === 'replace_now' ? 'text-red-400' : v.tire_condition === 'replace_soon' ? 'text-orange-400' : ''}>
                        {v.tire_condition === 'new' ? 'ახალი' : v.tire_condition === 'good' ? 'კარგი' : v.tire_condition === 'replace_soon' ? 'მალე' : 'ცვეთილი'}
                      </span>
                    </div>
                  </td>
                  
                  {/* Common */}
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="group relative inline-block cursor-help">
                      <span className="text-gray-300 text-[9px] truncate block max-w-[85px]" title={v.owner_name}>
                        {v.owner_name}
                      </span>
                      <div className="hidden group-hover:block absolute z-50 bg-gray-900 border border-gray-700 text-white text-[10px] px-2 py-1.5 rounded shadow-xl -mt-7 left-0 whitespace-nowrap pointer-events-none">
                        {v.owner_name}<br/>
                        ტიპი: {v.owner_type === 'company' ? '🏢 კომპანია' : '👤 ფიზიკური'}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[9px] border ${getStatusColor(v.status)}`}>
                      {v.status === 'active' ? 'აქტიური' : v.status === 'maintenance' ? 'რემონტი' : 'ოდინში'}
                    </span>
                  </td>
                  
                  <td className="px-3 py-2 whitespace-nowrap text-right">
                    <ActionButtons 
                      onEdit={() => onEdit(v)} 
                      onDelete={() => onDelete(v)} 
                      onPrint={onPrint ? () => onPrint(v) : undefined}
                    />
                  </td>
                </tr>
              )
            })}
            {vehicles.length === 0 && (
              <tr><td colSpan={14} className="px-4 py-8 text-center text-gray-500">მანქანები არ არის</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}