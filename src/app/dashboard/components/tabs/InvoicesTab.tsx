'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import LoadingTruck from '@/app/dashboard/components/ui/LoadingTruck'

// ============================================================================
// 📋 TypeScript Interface
// ============================================================================
interface Invoice {
  id: string
  invoice_number: string
  order_id: string | null
  tracking_code: string | null
  client_name: string
  client_email: string | null
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

  // 🔄 დატვირთვა კომპონენტის ინიციალიზაციისას
  useEffect(() => {
    fetchInvoices()
  }, [])

  // 📡 რეალური მონაცემების წამოღება Supabase-დან
  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        console.warn('Invoices fetch error (using demo):', error.message)
        const demo = generateDemoInvoices()
        setInvoices(demo)
      } else if (data && data.length > 0) {
        setInvoices(data as Invoice[])
      } else {
        // ცარიელი ბაზა → დემო მონაცემები
        const demo = generateDemoInvoices()
        setInvoices(demo)
      }
    } catch (e: any) {
      console.error('Failed to fetch invoices:', e)
      const demo = generateDemoInvoices()
      setInvoices(demo)
    } finally {
      setLoading(false)
    }
  }

  // 🎭 დემო მონაცემები დეველოპმენტისთვის
  const generateDemoInvoices = (): Invoice[] => [
    { id: '1', invoice_number: 'INV-2026-008', order_id: 'ord_101', tracking_code: 'TRK-2026-001', client_name: 'შპს სოლე ტრანსი', client_email: 'info@soletrans.ge', total_amount: 800, currency: 'GEL', status: 'sent', issue_date: '2026-01-31', due_date: '2026-02-14', created_at: '2026-01-31T10:00:00Z', updated_at: '2026-01-31T10:00:00Z' },
    { id: '2', invoice_number: 'INV-2026-007', order_id: 'ord_102', tracking_code: 'TRK-2026-002', client_name: 'კერძო პირი - გიორგი', client_email: 'giorgi@email.com', total_amount: 350, currency: 'GEL', status: 'paid', issue_date: '2026-01-28', due_date: '2026-02-11', created_at: '2026-01-28T14:00:00Z', updated_at: '2026-01-29T09:00:00Z' },
    { id: '3', invoice_number: 'INV-2026-006', order_id: 'ord_103', tracking_code: 'TRK-2026-003', client_name: 'შპს ტრანს-ლოჯისტიკ', client_email: 'office@translog.ge', total_amount: 1200, currency: 'GEL', status: 'draft', issue_date: '2026-01-25', due_date: '2026-02-08', created_at: '2026-01-25T11:00:00Z', updated_at: '2026-01-25T11:00:00Z' },
    { id: '4', invoice_number: 'INV-2026-005', order_id: 'ord_104', tracking_code: 'TRK-2026-004', client_name: 'შპს გლობალ შიპინგი', client_email: 'finance@globalship.ge', total_amount: 550, currency: 'GEL', status: 'overdue', issue_date: '2026-01-10', due_date: '2026-01-24', created_at: '2026-01-10T08:00:00Z', updated_at: '2026-01-10T08:00:00Z' },
  ]

  // 🔍 ფილტრაცია
  const filteredInvoices = invoices.filter(i => {
    const matchesFilter = invoiceFilter === 'all' || i.status === invoiceFilter
    const matchesSearch = search === '' || 
      i.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      i.client_name.toLowerCase().includes(search.toLowerCase()) ||
      i.tracking_code?.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  // ✅ სტატუსის განახლება + აუდიტის ლოგი
  const handleStatusChange = async (invoiceId: string, newStatus: string) => {
    const invoice = invoices.find(inv => inv.id === invoiceId)
    if (!invoice) return

    setActionLoading(invoiceId)
    
    try {
      // 1. განახლება ბაზაში
      const { error: updateError } = await supabase
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', invoiceId)
      
      if (updateError) throw updateError

      // 2. აუდიტის ლოგის ჩაწერა
      const { error: auditError } = await supabase
        .from('audit_logs')
        .insert({
          user_email: (await supabase.auth.getUser()).data.user?.email || 'system',
          action: 'update',
          table_name: 'invoices',
          record_id: invoiceId,
          details: `ინვოისი #${invoice.invoice_number} სტატუსი შეიცვალა: ${invoice.status} → ${newStatus}`
        })
      
      if (auditError) console.warn('Audit log failed:', auditError.message)

      // 3. განახლება UI-ში
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

  // 🎨 სტატუსის ბეჯი
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <span className="bg-green-500/20 text-green-400 border-green-500/30 px-2 py-0.5 rounded text-[10px] border">✅ გადახდილი</span>
      case 'sent': return <span className="bg-blue-500/20 text-blue-400 border-blue-500/30 px-2 py-0.5 rounded text-[10px] border">📤 გაგზავნილი</span>
      case 'viewed': return <span className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30 px-2 py-0.5 rounded text-[10px] border">👁️ ნანახი</span>
      case 'partial_paid': return <span className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 px-2 py-0.5 rounded text-[10px] border">🔄 ნაწილობრივ</span>
      case 'draft': return <span className="bg-gray-500/20 text-gray-400 border-gray-500/30 px-2 py-0.5 rounded text-[10px] border">📝 დრაფტი</span>
      case 'overdue': return <span className="bg-red-500/20 text-red-400 border-red-500/30 px-2 py-0.5 rounded text-[10px] border">⚠️ ვადაგასული</span>
      case 'cancelled': return <span className="bg-red-500/20 text-red-400 border-red-500/30 px-2 py-0.5 rounded text-[10px] border">❌ გაუქმებული</span>
      default: return <span className="bg-gray-500/20 text-gray-400 border-gray-500/30 px-2 py-0.5 rounded text-[10px] border">{status}</span>
    }
  }

  if (loading) return <LoadingTruck message="ინვოისები იტვირთება..." size="md" />

  return (
    <div className="space-y-4">
      {/* ── HEADER: ტიტული, ძებნა, ფილტრი, ექსპორტი ── */}
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
                  {/* ინვოისის ნომერი */}
                  <td className="px-4 py-3 font-mono font-bold text-emerald-400">{i.invoice_number}</td>
                  
                  {/* შეკვეთის კოდი */}
                  <td className="px-4 py-3 text-gray-300 font-mono">
                    {i.tracking_code || '–'}
                  </td>
                  
                  {/* კლიენტის სახელი */}
                  <td className="px-4 py-3 text-gray-200 truncate max-w-[150px]" title={i.client_name}>
                    {i.client_name}
                  </td>
                  
                  {/* თანხა */}
                  <td className="px-4 py-3 text-right font-bold font-mono">
                    {formatCurrency(i.total_amount, i.currency)}
                  </td>
                  
                  {/* თარიღი */}
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                    {new Date(i.issue_date).toLocaleDateString('ka-GE')}
                  </td>
                  
                  {/* სტატუსი */}
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
                  
                  {/* მოქმედებები */}
                  <td className="px-4 py-3 text-right flex justify-end gap-1">
                    <button 
                      className="p-1.5 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-md transition" 
                      title="ნახვა/დაბეჭდვა"
                    >
                      🖨️
                    </button>
                    <button 
                      className="p-1.5 text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 rounded-md transition" 
                      title="Email-ით გაგზავნა"
                    >
                      📧
                    </button>
                  </td>
                </tr>
              ))}
              
              {/* ცარიელი მდგომარეობა */}
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
        <strong>📌 შენიშვნა:</strong> ინვოისების მონაცემები ინახება Supabase-ში. 
        სტატუსის ცვლილება აფიქსირებს აუდიტის ლოგში და ავტომატურად ანახლებს ინტერფეისს.
      </div>
    </div>
  )
}