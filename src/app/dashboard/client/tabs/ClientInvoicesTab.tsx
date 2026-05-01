export default function ClientInvoicesTab({ invoices, loading, onView, onDownload, getStatusColor, ActionButtons }: any) {
  if (loading) return <div className="p-8 text-center text-gray-400">იტვირთება...</div>
  
  return (
    <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-700/50">
        <h2 className="text-xs font-bold uppercase text-gray-300">🧾 ინვოისები</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead className="text-gray-400 uppercase bg-gray-900/40">
            <tr>
              <th className="px-4 py-3 text-left">ინვოისი #</th>
              <th className="px-4 py-3 text-left">თარიღი</th>
              <th className="px-4 py-3 text-left">შეკვეთა</th>
              <th className="px-4 py-3 text-right">თანხა</th>
              <th className="px-4 py-3 text-left">სტატუსი</th>
              <th className="px-4 py-3 text-right">მოქმედება</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/30">
            {invoices.map((i:any) => (
              <tr key={i.id} className="hover:bg-gray-700/20 transition">
                <td className="px-4 py-3 font-mono text-purple-400">{i.invoice_number}</td>
                <td className="px-4 py-3 text-gray-400">{i.issue_date}</td>
                <td className="px-4 py-3 text-gray-300">{i.tracking_code}</td>
                <td className="px-4 py-3 text-right font-semibold">{i.total_amount} {i.currency}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-[9px] border ${getStatusColor(i.status)}`}>{i.status}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <ActionButtons onView={() => onView(i)} onPrint={() => onDownload(i)} />
                </td>
              </tr>
            ))}
            {invoices.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">ინვოისები არ არის</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}