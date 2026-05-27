'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

// ============================================================================
// 📋 TypeScript Interfaces
// ============================================================================
interface TripExpense {
  id: string
  order_id: string | null
  tracking_code: string | null
  driver_id: string
  driver_name: string
  category: 'fuel' | 'toll' | 'repair' | 'food' | 'tire' | 'other'
  amount: number
  currency: string
  receipt_url: string | null
  description: string | null
  status: 'pending' | 'approved' | 'rejected'
  approved_by: string | null
  approved_at: string | null
  created_at: string
}

interface ExpenseSummary {
  category: string
  total_amount: number
  pending_count: number
  approved_count: number
}

// ============================================================================
// 🧩 Main Component
// ============================================================================
export default function ExpensesTab() {
  const [expenses, setExpenses] = useState<TripExpense[]>([])
  const [summaries, setSummaries] = useState<ExpenseSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  // 🔄 დატვირთვა კომპონენტის ინიციალიზაციისას
  useEffect(() => {
    fetchExpenses()
  }, [])

  // 📡 რეალური მონაცემების წამოღება Supabase-დან
  const fetchExpenses = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('trip_expenses')
        .select(`
          *,
          orders (tracking_code)
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        console.warn('Expenses fetch error (using demo):', error.message)
        const demo = generateDemoExpenses()
        setExpenses(demo)
        calculateSummaries(demo)
      } else if (data && data.length > 0) {
        // მონაცემების ნორმალიზაცია
        const normalized = data.map(item => ({
          ...item,
          tracking_code: item.orders?.tracking_code || null
        })) as TripExpense[]
        setExpenses(normalized)
        calculateSummaries(normalized)
      } else {
        const demo = generateDemoExpenses()
        setExpenses(demo)
        calculateSummaries(demo)
      }
    } catch (e: any) {
      console.error('Failed to fetch expenses:', e)
      const demo = generateDemoExpenses()
      setExpenses(demo)
      calculateSummaries(demo)
    } finally {
      setLoading(false)
    }
  }

  // 🎭 დემო მონაცემები დეველოპმენტისთვის
  const generateDemoExpenses = (): TripExpense[] => [
    { id: '1', order_id: 'ord_101', tracking_code: 'TRK-2024-001', driver_id: 'drv_001', driver_name: 'ნიკა გიორგაძე', category: 'fuel', amount: 120, currency: 'GEL', receipt_url: 'https://example.com/receipt1.jpg', description: 'საწვავი - თბილისი', status: 'approved', approved_by: 'admin@logistics.ge', approved_at: '2024-01-15T14:30:00Z', created_at: '2024-01-15T10:00:00Z' },
    { id: '2', order_id: 'ord_101', tracking_code: 'TRK-2024-001', driver_id: 'drv_001', driver_name: 'ნიკა გიორგაძე', category: 'toll', amount: 15, currency: 'GEL', receipt_url: null, description: 'ტოლი - გორის გზა', status: 'pending', approved_by: null, approved_at: null, created_at: '2024-01-15T12:00:00Z' },
    { id: '3', order_id: 'ord_102', tracking_code: 'TRK-2024-002', driver_id: 'drv_002', driver_name: 'ლევან მამულაშვილი', category: 'repair', amount: 85, currency: 'GEL', receipt_url: 'https://example.com/receipt3.jpg', description: 'საბურავის შეკეთება', status: 'rejected', approved_by: 'admin@logistics.ge', approved_at: '2024-01-14T16:00:00Z', created_at: '2024-01-14T09:00:00Z' },
    { id: '4', order_id: 'ord_103', tracking_code: 'TRK-2024-003', driver_id: 'drv_001', driver_name: 'ნიკა გიორგაძე', category: 'food', amount: 25, currency: 'GEL', receipt_url: null, description: 'სადილი რეისზე', status: 'pending', approved_by: null, approved_at: null, created_at: '2024-01-16T13:00:00Z' },
    { id: '5', order_id: 'ord_104', tracking_code: 'TRK-2024-004', driver_id: 'drv_003', driver_name: 'გიორგი კობერიძე', category: 'tire', amount: 200, currency: 'GEL', receipt_url: 'https://example.com/receipt5.jpg', description: 'ახალი საბურავი', status: 'approved', approved_by: 'admin@logistics.ge', approved_at: '2024-01-13T11:00:00Z', created_at: '2024-01-13T08:00:00Z' },
  ]

  // 📊 კატეგორიების მიხედვით ჯამების გამოთვლა
  const calculateSummaries = (data: TripExpense[]) => {
    const summaryMap = new Map<string, ExpenseSummary>()
    
    data.forEach(expense => {
      const existing = summaryMap.get(expense.category)
      if (existing) {
        existing.total_amount += expense.amount
        if (expense.status === 'pending') existing.pending_count += 1
        if (expense.status === 'approved') existing_approved_count += 1
      } else {
        summaryMap.set(expense.category, {
          category: expense.category,
          total_amount: expense.amount,
          pending_count: expense.status === 'pending' ? 1 : 0,
          approved_count: expense.status === 'approved' ? 1 : 0
        })
      }
    })
    
    setSummaries(Array.from(summaryMap.values()))
  }

  // 🔍 ფილტრაცია
  const filteredExpenses = expenses.filter(expense => {
    const matchesStatus = filter === 'all' || expense.status === filter
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter
    const matchesSearch = search === '' || 
      expense.driver_name.toLowerCase().includes(search.toLowerCase()) ||
      expense.tracking_code?.toLowerCase().includes(search.toLowerCase()) ||
      expense.description?.toLowerCase().includes(search.toLowerCase())
    return matchesStatus && matchesCategory && matchesSearch
  })

  // ✅ ხარჯის დამტკიცება + აუდიტის ლოგი
  const handleApprove = async (expenseId: string) => {
    const expense = expenses.find(e => e.id === expenseId)
    if (!expense) return

    setActionLoading(expenseId)
    
    try {
      // 1. განახლება ბაზაში
      const { error: updateError } = await supabase
        .from('trip_expenses')
        .update({ 
          status: 'approved', 
          approved_by: (await supabase.auth.getUser()).data.user?.email,
          approved_at: new Date().toISOString()
        })
        .eq('id', expenseId)
      
      if (updateError) throw updateError

      // 2. აუდიტის ლოგის ჩაწერა
      const { error: auditError } = await supabase
        .from('audit_logs')
        .insert({
          user_email: (await supabase.auth.getUser()).data.user?.email || 'system',
          action: 'approve',
          table_name: 'trip_expenses',
          record_id: expenseId,
          details: `ხარჯი #${expense.tracking_code || expenseId} დამტკიცებულია. კატეგორია: ${expense.category}, თანხა: ${expense.amount} ${expense.currency}`
        })
      
      if (auditError) console.warn('Audit log failed:', auditError.message)

      // 3. განახლება UI-ში
      await fetchExpenses()
      
    } catch (e: any) {
      console.error('Failed to approve expense:', e)
      alert('შეცდომა დამტკიცებისას: ' + e.message)
    } finally {
      setActionLoading(null)
    }
  }

  // ❌ ხარჯის უარყოფა + აუდიტის ლოგი
  const handleReject = async (expenseId: string) => {
    const expense = expenses.find(e => e.id === expenseId)
    if (!expense) return

    setActionLoading(expenseId)
    
    try {
      const { error: updateError } = await supabase
        .from('trip_expenses')
        .update({ 
          status: 'rejected', 
          approved_by: (await supabase.auth.getUser()).data.user?.email,
          approved_at: new Date().toISOString()
        })
        .eq('id', expenseId)
      
      if (updateError) throw updateError

      const { error: auditError } = await supabase
        .from('audit_logs')
        .insert({
          user_email: (await supabase.auth.getUser()).data.user?.email || 'system',
          action: 'reject',
          table_name: 'trip_expenses',
          record_id: expenseId,
          details: `ხარჯი #${expense.tracking_code || expenseId} უარყოფილია. კატეგორია: ${expense.category}`
        })
      
      if (auditError) console.warn('Audit log failed:', auditError.message)
      await fetchExpenses()
      
    } catch (e: any) {
      console.error('Failed to reject expense:', e)
      alert('შეცდომა უარყოფისას: ' + e.message)
    } finally {
      setActionLoading(null)
    }
  }

  // 📥 CSV ექსპორტი
  const exportToCSV = () => {
    const headers = ['მძღოლი', 'ტრეკინგი', 'კატეგორია', 'თანხა', 'ვალუტა', 'აღწერა', 'სტატუსი', 'ჩეკი', 'თარიღი']
    const rows = filteredExpenses.map(e => [
      e.driver_name,
      e.tracking_code || '-',
      e.category,
      e.amount.toString(),
      e.currency,
      e.description || '-',
      e.status,
      e.receipt_url || '-',
      new Date(e.created_at).toLocaleDateString('ka-GE')
    ])
    
    const csv = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `expenses-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // 💱 ვალუტის ფორმატირება
  const formatCurrency = (amount: number, currency: string) => {
    const symbols: Record<string, string> = { GEL: '₾', USD: '$', EUR: '€' }
    return `${symbols[currency] || currency} ${amount.toLocaleString('ka-GE', { minimumFractionDigits: 2 })}`
  }

  // 🎨 კატეგორიის იკონა
  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      fuel: '⛽', toll: '🛣️', repair: '🔧', food: '🍔', tire: '🛞', other: '📦'
    }
    return icons[category] || '📦'
  }

  // 🎨 სტატუსის ბეჯი
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <span className="bg-green-500/20 text-green-400 border-green-500/30 px-2 py-0.5 rounded text-[10px] border">✅ დამტკიცებული</span>
      case 'pending': return <span className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 px-2 py-0.5 rounded text-[10px] border">🕒 ლოდინში</span>
      case 'rejected': return <span className="bg-red-500/20 text-red-400 border-red-500/30 px-2 py-0.5 rounded text-[10px] border">❌ უარყოფილი</span>
      default: return <span className="bg-gray-500/20 text-gray-400 border-gray-500/30 px-2 py-0.5 rounded text-[10px] border">{status}</span>
    }
  }

  // 📋 კატეგორიის ლეიბლი
  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      fuel: 'საწვავი', toll: 'ტოლი', repair: 'შეკეთება', food: 'კვება', tire: 'საბურავი', other: 'სხვა'
    }
    return labels[category] || category
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-xs text-gray-400">იტვირთება ხარჯების მონაცემები...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 🔍 ფილტრები და ექსპორტი */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">🛣️ რეისის ხარჯები</h2>
        
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="🔍 ძებნა..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-purple-500 w-40"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-purple-500"
          >
            <option value="all">ყველა სტატუსი</option>
            <option value="pending">🕒 ლოდინში</option>
            <option value="approved">✅ დამტკიცებული</option>
            <option value="rejected">❌ უარყოფილი</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-purple-500"
          >
            <option value="all">ყველა კატეგორია</option>
            {['fuel', 'toll', 'repair', 'food', 'tire', 'other'].map(cat => (
              <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
            ))}
          </select>
          <button
            onClick={exportToCSV}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-xs font-medium transition flex items-center gap-1"
          >
            📥 CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-xs font-medium transition flex items-center gap-1"
          >
            ➕ ახალი
          </button>
          <button
            onClick={fetchExpenses}
            disabled={loading}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-xs font-medium transition"
          >
            🔄 განახლება
          </button>
        </div>
      </div>

      {/* 📊 კატეგორიების შეჯამება */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {summaries.map(summary => (
          <div key={summary.category} className="bg-gray-800/60 border border-gray-700 rounded-xl p-3 text-center">
            <div className="text-2xl mb-1">{getCategoryIcon(summary.category)}</div>
            <div className="text-[10px] text-gray-400 uppercase">{getCategoryLabel(summary.category)}</div>
            <div className="text-sm font-bold text-white mt-1">{formatCurrency(summary.total_amount, 'GEL')}</div>
            <div className="text-[9px] text-gray-500 mt-1">
              {summary.approved_count}✅ / {summary.pending_count}🕒
            </div>
          </div>
        ))}
      </div>

      {/* 📋 დეტალური ცხრილი */}
      <div className="bg-gray-800/60 border border-gray-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-700/50 text-gray-300">
              <tr>
                <th className="px-4 py-3 text-left">თარიღი</th>
                <th className="px-4 py-3 text-left">მძღოლი</th>
                <th className="px-4 py-3 text-left">ტრეკინგი</th>
                <th className="px-4 py-3 text-left">კატეგორია</th>
                <th className="px-4 py-3 text-right">თანხა</th>
                <th className="px-4 py-3 text-center">ჩეკი</th>
                <th className="px-4 py-3 text-center">სტატუსი</th>
                <th className="px-4 py-3 text-right">ქმედება</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {filteredExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-700/20 transition">
                  <td className="px-4 py-3 text-[10px] text-gray-400 whitespace-nowrap">
                    {new Date(expense.created_at).toLocaleDateString('ka-GE')}
                  </td>
                  <td className="px-4 py-3 text-[10px] text-white">{expense.driver_name}</td>
                  <td className="px-4 py-3 text-[10px] text-blue-400 font-mono">{expense.tracking_code || '–'}</td>
                  <td className="px-4 py-3 text-[10px]">
                    <span className="flex items-center gap-1">
                      {getCategoryIcon(expense.category)} {getCategoryLabel(expense.category)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-white">{formatCurrency(expense.amount, expense.currency)}</td>
                  <td className="px-4 py-3 text-center">
                    {expense.receipt_url ? (
                      <a href={expense.receipt_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300" title="ჩეკის ნახვა">
                        📎
                      </a>
                    ) : (
                      <span className="text-gray-600" title="ჩეკი არ არის">–</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">{getStatusBadge(expense.status)}</td>
                  <td className="px-4 py-3 text-right">
                    {expense.status === 'pending' ? (
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleApprove(expense.id)}
                          disabled={actionLoading === expense.id}
                          className="p-1.5 text-green-400 bg-green-500/10 hover:bg-green-500/20 rounded transition disabled:opacity-50"
                          title="დამტკიცება"
                        >
                          {actionLoading === expense.id ? (
                            <div className="w-3 h-3 border border-green-400/50 border-t-green-400 rounded-full animate-spin"></div>
                          ) : '✅'}
                        </button>
                        <button
                          onClick={() => handleReject(expense.id)}
                          disabled={actionLoading === expense.id}
                          className="p-1.5 text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded transition disabled:opacity-50"
                          title="უარყოფა"
                        >
                          {actionLoading === expense.id ? (
                            <div className="w-3 h-3 border border-red-400/50 border-t-red-400 rounded-full animate-spin"></div>
                          ) : '❌'}
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-500 text-[10px]">დასრულებული</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredExpenses.length === 0 && (
          <div className="p-8 text-center text-gray-500 text-xs">
            {expenses.length === 0 ? 'ხარჯების ჩანაწერები არ მოიძებნა' : 'ფილტრის შედეგები ცარიელია'}
          </div>
        )}
      </div>

      {/* ℹ️ ინფო ბლოკი */}
      <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4 text-[10px] text-gray-400">
        <strong>📌 შენიშვნა:</strong> ხარჯების ჩანაწერები ინახება Supabase-ში. 
        დამტკიცება/უარყოფა აფიქსირებს მომხმარებელს, თარიღს და იწერება აუდიტის ლოგში.
        დამტკიცებული ხარჯები ავტომატურად ჩაითვლება მძღოლის ანგარიშსწორებაში.
      </div>

      {/* ➕ Add Expense Modal (საბაზისო ვერსია) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-white mb-4">➕ ახალი ხარჯის დამატება</h3>
            <p className="text-xs text-gray-400 mb-4">ხარჯის დამატება შესაძლებელია შეკვეთის დეტალებიდან ან მძღოლის პროფილიდან.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs text-white transition">დახურვა</button>
              <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-xs text-white transition">შექმნა →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}