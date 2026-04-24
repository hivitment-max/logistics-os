'use client'
import LoadingTruck from '@/app/dashboard/components/ui/LoadingTruck'

interface OrdersTabProps {
  orders: any[]
  loading: boolean
  orderFilter: string
  setOrderFilter: (filter: string) => void
  onStatusChange: (orderId: string, newStatus: string) => void
  onEdit: (order: any) => void
  onDelete: (order: any) => void
  onAdd: () => void
  onCreateInvoice: (order: any) => void
  getStatusColor: (status: string) => string
  ActionButtons: React.ComponentType<{ onEdit: () => void; onDelete: () => void }>
}

export default function OrdersTab({ 
  orders, loading, orderFilter, setOrderFilter, onStatusChange, onEdit, onDelete, onAdd, onCreateInvoice, getStatusColor, ActionButtons 
}: OrdersTabProps) {
  if (loading) return <LoadingTruck message="შეკვეთები იტვირთება..." size="md" />
  const filteredOrders = orders.filter(o => orderFilter === 'all' || o.status === orderFilter)

  return (
    <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-700/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gray-800/80">
        <div className="flex items-center gap-3">
          <h2 className="text-xs font-bold uppercase text-gray-300">📦 შეკვეთები</h2>
          <select value={orderFilter} onChange={(e) => setOrderFilter(e.target.value)} className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-[10px] outline-none">
            <option value="all">ყველა</option>
            <option value="pending">ლოდინში</option>
            <option value="in_transit">გზაში</option>
            <option value="delivered">მიწოდებული</option>
            <option value="cancelled">გაუქმებული</option>
          </select>
        </div>
        <button onClick={onAdd} className="bg-purple-600 hover:bg-purple-700 px-3 py-1.5 rounded text-[10px] font-semibold transition">+ ახალი</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead className="text-gray-500 uppercase bg-gray-900/40">
            <tr>
              <th className="px-4 py-3 text-left">Tracking</th>
              <th className="px-4 py-3 text-left">მარშრუტი</th>
              <th className="px-4 py-3 text-left">ტვირთი</th>
              <th className="px-4 py-3 text-left">მძღოლი / მანქანა</th>
              <th className="px-4 py-3 text-left">ფასი</th>
              <th className="px-4 py-3 text-left">სტატუსი</th>
              <th className="px-4 py-3 text-right">მოქმედება</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/30">
            {filteredOrders.map(o => (
              <tr key={o.id} className="hover:bg-gray-700/20 transition">
                <td className="px-4 py-3 font-mono font-bold text-purple-400">{o.tracking_code}</td>
                <td className="px-4 py-3 text-[10px] text-gray-200">📍 {o.pickup_address?.slice(0,15)}...<br/>🏁 {o.delivery_address?.slice(0,15)}...</td>
                <td className="px-4 py-3 text-gray-300">{o.cargo_description?.slice(0,15)}...</td>
                <td className="px-4 py-3">
                  <div className="text-gray-300 flex items-center gap-1">
                    {o.drivers?.full_name || o.external_drivers?.full_name || '–'}
                    {o.driver_type === 'external' && <span className="text-[8px] px-1 py-0.5 bg-orange-500/20 text-orange-400 rounded">გარე</span>}
                  </div>
                  <div className="text-blue-400 text-[10px] flex items-center gap-1">
                    {o.vehicles?.plate_number || o.external_vehicles?.plate_number || '–'}
                    {o.vehicle_type === 'external' && <span className="text-[8px] px-1 py-0.5 bg-orange-500/20 text-orange-400 rounded">გარე</span>}
                  </div>
                </td>
                <td className="px-4 py-3 font-medium">{o.price} {o.currency}</td>
                <td className="px-4 py-3">
                  <select value={o.status} onChange={(e) => onStatusChange(o.id, e.target.value)} className={`px-2 py-0.5 rounded text-[10px] border bg-transparent outline-none ${getStatusColor(o.status)}`}>
                    <option value="pending">ლოდინში</option>
                    <option value="in_transit">გზაში</option>
                    <option value="delivered">მიწოდებული</option>
                    <option value="cancelled">გაუქმებული</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-right flex justify-end gap-1">
                  <ActionButtons onEdit={() => onEdit(o)} onDelete={() => onDelete(o)} />
                  <button onClick={() => onCreateInvoice(o)} className="p-1.5 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-md transition" title="ინვოისის შექმნა">🧾</button>
                </td>
              </tr>
            ))}
            {filteredOrders.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">შეკვეთები არ არის</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}