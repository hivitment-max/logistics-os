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
  onPrint?: (vehicle: any) => void // ✅ ახალი პროპი - Print ფუნქციისთვის
}

// 🎨 Helper: PTI ვადის სტატუსი
const getPTIStatus = (expiry: string) => {
  if (!expiry) return { label: '–', color: 'text-gray-400' }
  const expiryDate = new Date(expiry)
  const today = new Date()
  const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysLeft < 0) return { label: '🔴 ვადაგასული', color: 'text-red-400 bg-red-500/10 px-2 py-0.5 rounded' }
  if (daysLeft <= 30) return { label: `🟡 ${daysLeft} დღე`, color: 'text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded' }
  return { label: `🟢 ${daysLeft} დღე`, color: 'text-green-400 bg-green-500/10 px-2 py-0.5 rounded' }
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
      
      {/* 📱 მობილური/ტაბლეტის ხედვა */}
      <div className="lg:hidden divide-y divide-gray-700/30">
        {vehicles.map(v => (
          <div key={v.id} className="p-4 hover:bg-gray-700/20 transition">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-mono font-bold text-blue-400 text-sm">{v.plate_number}</p>
                <p className="text-gray-300 text-xs">{v.model}</p>
              </div>
              <span className={`px-2 py-0.5 rounded text-[9px] border ${getStatusColor(v.status)}`}>{v.status}</span>
            </div>
            
            {/* 🟡 Medium Priority - ოპერაციული */}
            <div className="grid grid-cols-2 gap-2 mb-2 text-[10px]">
              <div className="flex items-center gap-1 text-gray-400">
                {getBodyTypeIcon(v.body_type)} {v.body_type || '–'}
              </div>
              <div className="text-gray-400">{v.capacity_kg ? `${(v.capacity_kg/1000).toFixed(1)}ტ` : '–'}</div>
              <div className="text-gray-400">EURO {v.euro_standard || '–'}</div>
              <div className={v.adr_class ? 'text-orange-400' : 'text-gray-500'}>
                {v.adr_class ? `ADR ${v.adr_class}` : '–'}
              </div>
            </div>
            
            {/* 🔴 High Priority - კრიტიკული */}
            <div className="flex items-center justify-between text-[10px]">
              <span className={getPTIStatus(v.pti_expiry).color}>
                PTI: {getPTIStatus(v.pti_expiry).label}
              </span>
              <ActionButtons 
                onEdit={() => onEdit(v)} 
                onDelete={() => onDelete(v)} 
                onPrint={onPrint ? () => onPrint(v) : undefined} // ✅ Print ღილაკის გადაცემა
              />
            </div>
            
            {/* 🔵 Low Priority - დამატებითი (მალე ჩანს) */}
            {(v.gps_device_id || v.has_fuel_sensor) && (
              <div className="mt-2 pt-2 border-t border-gray-700/50 flex gap-2 text-[9px] text-gray-500">
                {v.gps_device_id && <span>📡 GPS</span>}
                {v.has_fuel_sensor && <span>⛽ FuelSensor</span>}
              </div>
            )}
          </div>
        ))}
        {vehicles.length === 0 && <p className="p-8 text-center text-gray-500 text-sm">მანქანები არ არის</p>}
      </div>

      {/* 💻 დესკტოპის ხედვა - სრული ცხრილი */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead className="text-gray-500 uppercase bg-gray-900/40">
            <tr>
              {/* 🔴 High Priority */}
              <th className="px-4 py-3 text-left">სანომრე</th>
              <th className="px-4 py-3 text-left">VIN</th>
              <th className="px-4 py-3 text-left">PTI ვადა</th>
              <th className="px-4 py-3 text-left">დაზღვევა</th>
              
              {/* 🟡 Medium Priority */}
              <th className="px-4 py-3 text-left">მოდელი / ძარა</th>
              <th className="px-4 py-3 text-left">ტევადობა</th>
              <th className="px-4 py-3 text-left">გაბარიტები</th>
              <th className="px-4 py-3 text-left">ADR / EURO</th>
              <th className="px-4 py-3 text-left">სპეც. აღჭურვილობა</th>
              
              {/* 🔵 Low Priority */}
              <th className="px-4 py-3 text-left">GPS / Fuel</th>
              <th className="px-4 py-3 text-left">საბურავები</th>
              
              {/* Common */}
              <th className="px-4 py-3 text-left">მფლობელი</th>
              <th className="px-4 py-3 text-left">სტატუსი</th>
              <th className="px-4 py-3 text-right">მოქმედება</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/30">
            {vehicles.map(v => {
              const pti = getPTIStatus(v.pti_expiry)
              return (
                <tr key={v.id} className="hover:bg-gray-700/20 transition group">
                  {/* 🔴 High Priority */}
                  <td className="px-4 py-3 font-mono font-bold text-blue-400">{v.plate_number}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-[9px]">{v.vin_number?.slice(0,8)}...</td>
                  <td className="px-4 py-3">
                    <span className={pti.color} title={v.pti_expiry || 'არ არის მითითებული'}>
                      {pti.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      {v.insurance_policy && <span className="text-green-400">🟢 სამოქალაქო</span>}
                      {v.insurance_cmre_policy && <span className="text-blue-400 block">🔵 CMR</span>}
                      {!v.insurance_policy && <span className="text-gray-500">–</span>}
                    </div>
                  </td>
                  
                  {/* 🟡 Medium Priority */}
                  <td className="px-4 py-3">
                    <div className="text-gray-200">{v.model}</div>
                    <div className="text-gray-400 text-[9px]">{getBodyTypeIcon(v.body_type)} {v.body_type}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {v.capacity_kg ? `${(v.capacity_kg/1000).toFixed(1)}ტ` : '–'}
                    {v.volume_m3 && <span className="block text-[9px]">{v.volume_m3}m³</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-[9px]">
                    {v.length_m && `${v.length_m}×${v.width_m}×${v.height_m}მ`}
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      {v.adr_class && <span className="text-orange-400 text-[9px]">ADR Cl.{v.adr_class}</span>}
                      <span className="text-gray-400 text-[9px]">EURO {v.euro_standard || '–'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-[9px]">
                    <div className="space-y-0.5">
                      {v.has_tail_lift && <span>⬇️ TailLift</span>}
                      {v.straps_count && <span>{v.straps_count}x 🪢</span>}
                      {!v.has_tail_lift && !v.straps_count && <span>–</span>}
                    </div>
                  </td>
                  
                  {/* 🔵 Low Priority */}
                  <td className="px-4 py-3 text-gray-400 text-[9px]">
                    <div className="space-y-0.5">
                      {v.gps_device_id && <span className="text-purple-400">📡 {v.gps_device_id.slice(0,6)}...</span>}
                      {v.has_fuel_sensor && <span className="text-green-400">⛽ Sensor</span>}
                      {!v.gps_device_id && !v.has_fuel_sensor && <span>–</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-[9px]">
                    <div className="space-y-0.5">
                      {v.tire_season && <span>{v.tire_season === 'winter' ? '❄️' : v.tire_season === 'summer' ? '☀️' : '🌤️'}</span>}
                      {v.tire_condition && <span className={v.tire_condition === 'replace_now' ? 'text-red-400' : ''}>{v.tire_condition}</span>}
                    </div>
                  </td>
                  
                  {/* Common */}
                  <td className="px-4 py-3 text-gray-300">
                    <div className="text-[9px]">{v.owner_name}</div>
                    <div className="text-[8px] text-gray-500">{v.owner_type === 'company' ? '🏢' : '👤'}</div>
                  </td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-[9px] border ${getStatusColor(v.status)}`}>{v.status}</span></td>
                  <td className="px-4 py-3 text-right">
                    <ActionButtons 
                      onEdit={() => onEdit(v)} 
                      onDelete={() => onDelete(v)} 
                      onPrint={onPrint ? () => onPrint(v) : undefined} // ✅ Print ღილაკის გადაცემა
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