export default function ClientOverviewTab({ orders, invoices, trackingData, getStatusColor, onNavigateToOrders, onNavigateToNewOrder }: any) {
  return (
    <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-6">
      <h2 className="text-sm font-bold mb-4">📊 მიმოხილვა</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-900/40 p-4 rounded-lg border border-gray-700/50">
          <p className="text-[10px] text-gray-400 uppercase">აქტიური შეკვეთები</p>
          <p className="text-2xl font-bold text-blue-400">{orders.filter((o:any) => o.status === 'pending' || o.status === 'in_transit').length}</p>
        </div>
        <div className="bg-gray-900/40 p-4 rounded-lg border border-gray-700/50">
          <p className="text-[10px] text-gray-400 uppercase">მიწოდებული</p>
          <p className="text-2xl font-bold text-green-400">{orders.filter((o:any) => o.status === 'delivered').length}</p>
        </div>
        <div className="bg-gray-900/40 p-4 rounded-lg border border-gray-700/50">
          <p className="text-[10px] text-gray-400 uppercase">გადაუხდელი ინვოისი</p>
          <p className="text-2xl font-bold text-yellow-400">{invoices.filter((i:any) => i.status === 'pending').length}</p>
        </div>
        <div className="bg-gray-900/40 p-4 rounded-lg border border-gray-700/50">
          <p className="text-[10px] text-gray-400 uppercase">საერთო ღირებულება</p>
          <p className="text-2xl font-bold text-purple-400">{invoices.reduce((sum:any, i:any) => sum + (i.total_amount || 0), 0)} ₾</p>
        </div>
      </div>
      
      <div className="flex gap-3">
        <button onClick={onNavigateToNewOrder} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-semibold transition">🚀 ახალი შეკვეთა</button>
        <button onClick={onNavigateToOrders} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-semibold transition">📦 ყველა შეკვეთა</button>
      </div>
    </div>
  )
}