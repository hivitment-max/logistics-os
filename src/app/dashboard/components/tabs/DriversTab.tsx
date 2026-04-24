'use client'
import LoadingTruck from '@/app/dashboard/components/ui/LoadingTruck'

interface DriversTabProps {
  drivers: any[]
  loading: boolean
  onEdit: (driver: any) => void
  onDelete: (driver: any) => void
  onAdd: () => void
  onAssignVehicle: (driverId: string, vehicleId: string) => void
  getStatusColor: (status: string) => string
  ActionButtons: React.ComponentType<{ onEdit: () => void; onDelete: () => void; onPrint?: () => void }>
  onPrint?: (driver: any) => void // ✅ ახალი პროპი - Print ფუნქციისთვის
}

export default function DriversTab({ 
  drivers, loading, onEdit, onDelete, onAdd, onAssignVehicle, getStatusColor, ActionButtons, onPrint 
}: DriversTabProps) {
  if (loading) return <LoadingTruck message="მძღოლები იტვირთება..." size="md" />

  return (
    <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-700/50 flex justify-between items-center bg-gray-800/80">
        <h2 className="text-xs font-bold uppercase text-gray-300">👨‍✈️ მძღოლები</h2>
        <button onClick={onAdd} className="bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded text-[10px] font-semibold transition">+ ახალი</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead className="text-gray-500 uppercase bg-gray-900/40">
            <tr>
              <th className="px-4 py-3 text-left">სახელი</th>
              <th className="px-4 py-3 text-left">ტელეფონი</th>
              <th className="px-4 py-3 text-left">ლიცენზია</th>
              <th className="px-4 py-3 text-left">კატეგორია</th>
              <th className="px-4 py-3 text-left">სტატუსი</th>
              <th className="px-4 py-3 text-left">მანქანა</th>
              <th className="px-4 py-3 text-right">მოქმედება</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/30">
            {drivers.map(d => (
              <tr key={d.id} className="hover:bg-gray-700/20 transition">
                <td className="px-4 py-3 font-medium text-gray-200">{d.full_name}</td>
                <td className="px-4 py-3 text-gray-400">{d.phone}</td>
                <td className="px-4 py-3 text-gray-400 font-mono text-[10px]">{d.license_number?.slice(0,10)}...</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-[9px] bg-blue-500/20 text-blue-400 border border-blue-500/30">{d.license_category}</span></td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] border ${getStatusColor(d.is_available ? 'active' : 'idle')}`}>
                    {d.is_available ? '🟢 აქტიური' : '🟡 არააქტიური'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400">{d.vehicles?.plate_number || '–'}</td>
                <td className="px-4 py-3 text-right">
                  <ActionButtons 
                    onEdit={() => onEdit(d)} 
                    onDelete={() => onDelete(d)} 
                    onPrint={onPrint ? () => onPrint(d) : undefined} // ✅ Print ღილაკის გადაცემა
                  />
                </td>
              </tr>
            ))}
            {drivers.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">მძღოლები არ არის</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}