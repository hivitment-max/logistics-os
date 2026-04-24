'use client'
import LoadingTruck from '@/app/dashboard/components/ui/LoadingTruck'

interface InvoicesTabProps {
  invoices: any[]
  loading: boolean
  invoiceFilter: string
  setInvoiceFilter: (filter: string) => void
  onStatusChange: (invoiceId: string, newStatus: string) => void
  onView: (invoice: any) => void
  onEmail: (invoice: any) => void
  getStatusColor: (status: string) => string
}

export default function InvoicesTab({ 
  invoices, loading, invoiceFilter, setInvoiceFilter, onStatusChange, onView, onEmail, getStatusColor 
}: InvoicesTabProps) {
  if (loading) return <LoadingTruck message="ინვოისები იტვირთება..." size="md" />
  const filteredInvoices = invoices.filter(i => invoiceFilter === 'all' || i.status === invoiceFilter)

  return (
    <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-700/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gray-800/80">
        <div className="flex items-center gap-3"><h2 className="text-xs font-bold uppercase text-gray-300">🧾 ინვოისები</h2><select value={invoiceFilter} onChange={(e) => setInvoiceFilter(e.target.value)} className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-[10px] outline-none"><option value="all">ყველა</option><option value="pending">ლოდინში</option><option value="sent">გაგზავნილი</option><option value="paid">გადახდილი</option><option value="overdue">ვადაგასული</option></select></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead className="text-gray-500 uppercase bg-gray-900/40"><tr><th className="px-4 py-3 text-left">№</th><th className="px-4 py-3 text-left">შეკვეთა</th><th className="px-4 py-3 text-left">კლიენტი</th><th className="px-4 py-3 text-left">თანხა</th><th className="px-4 py-3 text-left">თარიღი</th><th className="px-4 py-3 text-left">სტატუსი</th><th className="px-4 py-3 text-right">მოქმედება</th></tr></thead>
          <tbody className="divide-y divide-gray-700/30">
            {filteredInvoices.map(i => (
              <tr key={i.id} className="hover:bg-gray-700/20 transition">
                <td className="px-4 py-3 font-mono font-bold text-emerald-400">{i.invoice_number}</td>
                <td className="px-4 py-3 text-gray-300">{i.orders?.tracking_code || '–'}</td>
                <td className="px-4 py-3 text-gray-200">{i.client_name}</td>
                <td className="px-4 py-3 font-bold">{i.total_amount} {i.currency}</td>
                <td className="px-4 py-3 text-gray-400">{i.issue_date}</td>
                <td className="px-4 py-3"><select value={i.status} onChange={(e) => onStatusChange(i.id, e.target.value)} className={`px-2 py-0.5 rounded text-[10px] border bg-transparent outline-none ${getStatusColor(i.status)}`}><option value="pending">ლოდინში</option><option value="sent">გაგზავნილი</option><option value="paid">გადახდილი</option><option value="overdue">ვადაგასული</option></select></td>
                <td className="px-4 py-3 text-right flex justify-end gap-1"><button onClick={() => onView(i)} className="p-1.5 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-md transition" title="ნახვა/დაბეჭდვა">🖨️</button><button onClick={() => onEmail(i)} className="p-1.5 text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 rounded-md transition" title="Email-ით გაგზავნა">📧</button></td>
              </tr>
            ))}
            {filteredInvoices.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">ინვოისები არ არის</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}