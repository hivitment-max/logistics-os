'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import LoadingTruck from '@/app/dashboard/components/ui/LoadingTruck'
import InvoiceViewModal from '../modals/InvoiceViewModal'

// ============================================================================
// 📋 TypeScript Interface
// ============================================================================
interface Invoice {
  id: string
  invoice_number: string
  order_id: string | null
  template_id: string | null
  tracking_code: string | null
  client_name: string
  client_email: string | null
  client_tax_id: string | null
  client_address: string | null
  subtotal: number
  vat_amount: number
  total_amount: number
  currency: string
  status: 'draft' | 'sent' | 'viewed' | 'partial_paid' | 'paid' | 'overdue' | 'cancelled'
  issue_date: string
  due_date: string | null
  created_at: string
  updated_at: string
}

// ============================================================================
// 🧩 Main Component
// ============================================================================
export default function InvoicesTab() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [invoiceFilter, setInvoiceFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)

  // 🔄 Realtime subscription - ავტომატური განახლება
  useEffect(() => {
    fetchInvoices()

    const channel = supabase
      .channel('invoices_realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'invoices' },
        () => {
          console.log('🔄 [INVOICES] ცვლილება დაფიქსირდა, განახლება...')
          fetchInvoices()
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  // 📡 ინვოისების ჩატვირთვა Supabase-დან
  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        console.error('Invoices fetch error:', error.message)
        setInvoices([])
      } else {
        setInvoices((data as Invoice[]) || [])
      }
    } catch (e: any) {
      console.error('Failed to fetch invoices:', e)
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }

  // 👁️ ინვოისის ნახვა
  const handleViewInvoice = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId)
    setShowViewModal(true)
  }

  // 🗑️ ინვოისის წაშლა (უსაფრთხოების წესებით)
  const handleDeleteInvoice = async (invoiceId: string) => {
    const invoice = invoices.find(inv => inv.id === invoiceId)
    if (!invoice) return

    // ფინანსური ჩანაწერები არ იშლება
    if (invoice.status === 'paid' || invoice.status === 'partial_paid') {
      alert(`⚠️ ინვოისი #${invoice.invoice_number} არ შეიძლება წაიშალოს!\n\nსტატუსი: "${invoice.status}" - ეს ფინანსური ჩანაწერია.`)
      return
    }

    // გაფრთხილება სტატუსის მიხედვით
    let warningMessage = ''
    if (invoice.status === 'sent' || invoice.status === 'viewed') {
      warningMessage = `\n\n⚠️ ყურადღება: ეს ინვოისი უკვე გაგზავნილია კლიენტთან (${invoice.client_name})!`
    } else if (invoice.status === 'overdue') {
      warningMessage = `\n\n⚠️ ყურადღება: ეს ინვოისი ვადაგასულია!`
    }

    const confirmed = confirm(
      `🗑️ ინვოისის წაშლა\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `ნომერი: #${invoice.invoice_number}\n` +
      `კლიენტი: ${invoice.client_name}\n` +
      `თანხა: ${formatCurrency(invoice.total_amount, invoice.currency)}\n` +
      `სტატუსი: ${invoice.status}\n` +
      warningMessage +
      `\n\n❗ ეს მოქმედება შეუქცევადია!\n\n` +
      `დარწმუნებული ხართ?`
    )

    if (!confirmed) return

    setActionLoading(invoiceId)

    try {
      const { error: deleteError } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId)

      if (deleteError) throw deleteError

      // აუდიტის ლოგი
      await supabase.from('audit_logs').insert({
        user_email: (await supabase.auth.getUser()).data.user?.email || 'system',
        action: 'delete',
        table_name: 'invoices',
        record_id: invoiceId,
        details: `წაიშალა ინვოისი #${invoice.invoice_number} (კლიენტი: ${invoice.client_name}, თანხა: ${invoice.total_amount} ${invoice.currency})`
      })

      await fetchInvoices()

    } catch (e: any) {
      console.error('Failed to delete invoice:', e)
      alert('შეცდომა წაშლისას: ' + e.message)
    } finally {
      setActionLoading(null)
    }
  }

  // ✅ სტატუსის განახლება
  const handleStatusChange = async (invoiceId: string, newStatus: string) => {
    const invoice = invoices.find(inv => inv.id === invoiceId)
    if (!invoice) return

    setActionLoading(invoiceId)
    
    try {
      const { error: updateError } = await supabase
        .from('invoices')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', invoiceId)
      
      if (updateError) throw updateError

      // აუდიტის ლოგი
      await supabase.from('audit_logs').insert({
        user_email: (await supabase.auth.getUser()).data.user?.email || 'system',
        action: 'update',
        table_name: 'invoices',
        record_id: invoiceId,
        details: `ინვოისი #${invoice.invoice_number} სტატუსი: ${invoice.status} → ${newStatus}`
      })

      await fetchInvoices()
      
    } catch (e: any) {
      console.error('Failed to update invoice status:', e)
      alert('შეცდომა სტატუსის განახლებისას: ' + e.message)
    } finally {
      setActionLoading(null)
    }
  }

  // 📥 CSV ექსპორტი
  const exportToCSV = () => {
    const headers = ['ნომერი', 'ტრეკინგი', 'კლიენტი', 'თანხა', 'ვალუტა', 'სტატუსი', 'თარიღი', 'ვადა']
    const rows = filteredInvoices.map(i => [
      i.invoice_number,
      i.tracking_code || '-',
      i.client_name,
      i.total_amount.toString(),
      i.currency,
      i.status,
      new Date(i.issue_date).toLocaleDateString('ka-GE'),
      i.due_date ? new Date(i.due_date).toLocaleDateString('ka-GE') : '-'
    ])
    
    const csv = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoices-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // 💱 ვალუტის ფორმატირება
  const formatCurrency = (amount: number, currency: string) => {
    const symbols: Record<string, string> = { GEL: '₾', USD: '$', EUR: '€' }
    return `${symbols[currency] || currency} ${amount.toLocaleString('ka-GE', { minimumFractionDigits: 2 })}`
  }

  // 🔍 ფილტრაცია
  const filteredInvoices = invoices.filter(i => {
    const matchesFilter = invoiceFilter === 'all' || i.status === invoiceFilter
    const matchesSearch = search === '' || 
      i.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      i.client_name.toLowerCase().includes(search.toLowerCase()) ||
      i.tracking_code?.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  // 🗑️ წაშლის უფლების შემოწმება
  const canDeleteInvoice = (status: string) => {
    return status !== 'paid' && status !== 'partial_paid'
  }

  if (loading) return <LoadingTruck message="ინვოისები იტვირთება..." size="md" />

  return (
    <div className="space-y-4">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-lg font-bold text-gray-100">🧾 ინვოისები</h2>
        
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="🔍 ძებნა..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500 w-40"
          />
          <select
            value={invoiceFilter}
            onChange={(e) => setInvoiceFilter(e.target.value)}
            className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500"
          >
            <option value="all">ყველა სტატუსი</option>
            <option value="draft">📝 დრაფტი</option>
            <option value="sent">📤 გაგზავნილი</option>
            <option value="viewed">👁️ ნანახი</option>
            <option value="partial_paid">🔄 ნაწილობრივ</option>
            <option value="paid">✅ გადახდილი</option>
            <option value="overdue">⚠️ ვადაგასული</option>
            <option value="cancelled">❌ გაუქმებული</option>
          </select>
          <button
            onClick={exportToCSV}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-xs font-medium transition flex items-center gap-1"
          >
            📥 CSV
          </button>
          <button
            onClick={fetchInvoices}
            disabled={loading}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-xs font-medium transition"
          >
            🔄 განახლება
          </button>
        </div>
      </div>
      
      {/* ── TABLE ── */}
      <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead className="text-gray-500 uppercase bg-gray-900/40">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">№</th>
                <th className="px-4 py-3 text-left font-semibold">ტრეკინგი</th>
                <th className="px-4 py-3 text-left font-semibold">კლიენტი</th>
                <th className="px-4 py-3 text-right font-semibold">თანხა</th>
                <th className="px-4 py-3 text-left font-semibold">თარიღი</th>
                <th className="px-4 py-3 text-center font-semibold">სტატუსი</th>
                <th className="px-4 py-3 text-right font-semibold">მოქმედება</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/30">
              {filteredInvoices.map(i => (
                <tr key={i.id} className="hover:bg-gray-700/20 transition">
                  <td className="px-4 py-3 font-mono font-bold text-emerald-400">{i.invoice_number}</td>
                  <td className="px-4 py-3 text-gray-300 font-mono">{i.tracking_code || '–'}</td>
                  <td className="px-4 py-3 text-gray-200 truncate max-w-[150px]" title={i.client_name}>
                    {i.client_name}
                  </td>
                  <td className="px-4 py-3 text-right font-bold font-mono">
                    {formatCurrency(i.total_amount, i.currency)}
                  </td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                    {new Date(i.issue_date).toLocaleDateString('ka-GE')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <select 
                      value={i.status} 
                      onChange={(e) => handleStatusChange(i.id, e.target.value)}
                      disabled={actionLoading === i.id}
                      className={`px-2 py-0.5 rounded text-[10px] border bg-transparent outline-none cursor-pointer disabled:opacity-50 ${
                        i.status === 'paid' ? 'text-green-400 border-green-500/30' :
                        i.status === 'sent' ? 'text-blue-400 border-blue-500/30' :
                        i.status === 'overdue' ? 'text-red-400 border-red-500/30' :
                        'text-gray-400 border-gray-500/30'
                      }`}
                    >
                      <option value="draft">დრაფტი</option>
                      <option value="sent">გაგზავნილი</option>
                      <option value="viewed">ნანახი</option>
                      <option value="partial_paid">ნაწილობრივ</option>
                      <option value="paid">გადახდილი</option>
                      <option value="overdue">ვადაგასული</option>
                      <option value="cancelled">გაუქმებული</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button 
                        onClick={() => handleViewInvoice(i.id)}
                        disabled={actionLoading === i.id}
                        className="p-1.5 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 disabled:opacity-50 rounded-md transition" 
                        title="ნახვა/დაბეჭდვა"
                      >
                        🖨️
                      </button>
                      <button 
                        onClick={() => handleDeleteInvoice(i.id)}
                        disabled={actionLoading === i.id || !canDeleteInvoice(i.status)}
                        className={`p-1.5 rounded-md transition ${
                          canDeleteInvoice(i.status)
                            ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20'
                            : 'text-gray-600 bg-gray-500/5 cursor-not-allowed'
                        } disabled:opacity-50`}
                        title={canDeleteInvoice(i.status) ? 'წაშლა' : '🔒 ფინანსური ჩანაწერი - წაშლა აკრძალულია'}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-2xl">📭</span>
                      <p>ინვოისები არ არის</p>
                      <p className="text-[10px] text-gray-600">
                        {invoiceFilter !== 'all' ? `ფილტრი: "${invoiceFilter}"` : 'შექმენი ახალი ინვოისი შეკვეთიდან'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ℹ️ ინფო ბლოკი */}
      <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4 text-[10px] text-gray-400">
        <strong>📌 შენიშვნა:</strong> ყველა ცვლილება (სტატუსი, წაშლა) ავტომატურად ფიქსირდება აუდიტის ლოგში.
        <span className="text-red-400 ml-1">🔒 გადახდილი ინვოისების წაშლა აკრძალულია.</span>
      </div>

      {/* 👁️ ინვოისის ნახვის მოდალი */}
      <InvoiceViewModal 
        isOpen={showViewModal} 
        onClose={() => {
          setShowViewModal(false)
          setSelectedInvoiceId(null)
        }} 
        invoiceId={selectedInvoiceId} 
      />
    </div>
  )
}