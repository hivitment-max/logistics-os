export default function MyOrdersTab({ orders, loading, onStatusChange, onView, getStatusColor, ActionButtons }: any) {
  if (loading) return <div className="p-8 text-center text-gray-400">იტვირთება...</div>
  
  return (
    <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-700/50">
        <h2 className="text-xs font-bold uppercase text-gray-300">📦 ჩემი შეკვეთები</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead className="text-gray-400 uppercase bg-gray-900/40">
            <tr>
              <th className="px-4 py-3 text-left">Tracking Code</th>
              <th className="px-4 py-3 text-left">ტვირთი</th>
              <th className="px-4 py-3 text-left">მარშრუტი</th>
              <th className="px-4 py-3 text-left">ფასი</th>
              <th className="px-4 py-3 text-left">სტატუსი</th>
              <th className="px-4 py-3 text-right">მოქმედება</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/30">
            {orders.map((o:any) => (
              <tr key={o.id} className="hover:bg-gray-700/20 transition">
                <td className="px-4 py-3 font-mono text-blue-400">{o.tracking_code}</td>
                <td className="px-4 py-3 text-gray-300">{o.cargo_description}</td>
                <td className="px-4 py-3 text-gray-400">{o.pickup_address?.slice(0,20)}... → {o.delivery_address?.slice(0,20)}...</td>
                <td className="px-4 py-3 text-gray-300 font-semibold">{o.price} {o.currency}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-[9px] border ${getStatusColor(o.status)}`}>{o.status}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <ActionButtons onView={() => onView(o)} />
                </td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">შეკვეთები არ არის</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}