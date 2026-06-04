'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

// ============================================================================
// 📋 TypeScript Interfaces
// ============================================================================

interface TripExpense {
  id: string
  order_id: string | null
  tracking_code: string | null
  driver_id: string
  driver_name: string
  vehicle_id: string | null
  category: 'fuel' | 'toll' | 'repair' | 'food' | 'tire' | 'parking' | 'maintenance' | 'insurance' | 'other'
  amount: number
  currency: string
  receipt_url: string | null
  receipt_image_url: string | null
  description: string | null
  location: string | null
  mileage: number | null
  expense_date: string
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'fuel_card' | 'other'
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
  rejected_count: number
}

interface Driver {
  id: string
  full_name: string
  phone: string
}

interface Vehicle {
  id: string
  plate_number: string
  brand?: string
  model?: string
}

// ============================================================================
// 🧩 Main Component
// ============================================================================

export default function ExpensesTab() {
  const [expenses, setExpenses] = useState<TripExpense[]>([])
  const [summaries, setSummaries] = useState<ExpenseSummary[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  // 🔍 Filters
  const [filter, setFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedDriver, setSelectedDriver] = useState('all')
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month' | 'year' | 'custom'>('all')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  // 🪟 Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState<TripExpense | null>(null)
  const [detailsExpense, setDetailsExpense] = useState<TripExpense | null>(null)

  // 📊 Stats
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    thisMonth: 0,
    lastMonth: 0,
    avgPerTrip: 0,
  })

  // ============================================================================
  // 🔄 DATA LOADING
  // ============================================================================

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    await Promise.all([fetchExpenses(), fetchDrivers(), fetchVehicles()])
  }

  const fetchDrivers = async () => {
    try {
      const { data } = await supabase
        .from('drivers')
        .select('id, full_name, phone')
        .eq('is_active', true)
        .order('full_name')
      if (data) setDrivers(data as Driver[])
    } catch (e) { console.error(e) }
  }

  const fetchVehicles = async () => {
    try {
      const { data } = await supabase
        .from('vehicles')
        .select('id, plate_number, brand, model')
        .eq('is_active', true)
        .order('plate_number')
      if (data) setVehicles(data as Vehicle[])
    } catch (e) { console.error(e) }
  }

  const fetchExpenses = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('trip_expenses')
        .select('*, orders(tracking_code)')
        .order('created_at', { ascending: false })
        .limit(500)

      if (error) throw error

      if (data && data.length > 0) {
        const normalized = data.map((item: any) => ({
          ...item,
          tracking_code: item.orders?.tracking_code || item.tracking_code || null,
          amount: parseFloat(item.amount || 0),
          mileage: item.mileage ? parseInt(item.mileage) : null,
        })) as TripExpense[]
        
        setExpenses(normalized)
        calculateSummaries(normalized)
        calculateStats(normalized)
      } else {
        setExpenses([])
        setSummaries([])
        calculateStats([])
      }
    } catch (e: any) {
      console.error('Expenses fetch error:', e)
      alert('შეცდომა: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  // ============================================================================
  // 📊 CALCULATIONS
  // ============================================================================

  const calculateSummaries = (data: TripExpense[]) => {
    const map = new Map<string, ExpenseSummary>()
    
    data.forEach(exp => {
      const existing = map.get(exp.category)
      if (existing) {
        existing.total_amount += exp.amount
        if (exp.status === 'pending') existing.pending_count++
        if (exp.status === 'approved') existing.approved_count++
        if (exp.status === 'rejected') existing.rejected_count++
      } else {
        map.set(exp.category, {
          category: exp.category,
          total_amount: exp.amount,
          pending_count: exp.status === 'pending' ? 1 : 0,
          approved_count: exp.status === 'approved' ? 1 : 0,
          rejected_count: exp.status === 'rejected' ? 1 : 0,
        })
      }
    })
    
    setSummaries(Array.from(map.values()).sort((a, b) => b.total_amount - a.total_amount))
  }

  const calculateStats = (data: TripExpense[]) => {
    const now = new Date()
    const thisMonth = now.getMonth()
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1
    const thisYear = now.getFullYear()
    const lastYear = thisMonth === 0 ? thisYear - 1 : thisYear

    let total = 0, approved = 0, pending = 0, rejected = 0
    let thisMonthTotal = 0, lastMonthTotal = 0
    const tripSet = new Set<string>()

    data.forEach(e => {
      total += e.amount
      tripSet.add(e.tracking_code || e.id)
      
      if (e.status === 'approved') approved += e.amount
      else if (e.status === 'pending') pending += e.amount
      else if (e.status === 'rejected') rejected += e.amount

      const expDate = new Date(e.expense_date || e.created_at)
      if (expDate.getMonth() === thisMonth && expDate.getFullYear() === thisYear) {
        thisMonthTotal += e.amount
      }
      if (expDate.getMonth() === lastMonth && expDate.getFullYear() === lastYear) {
        lastMonthTotal += e.amount
      }
    })

    setStats({
      total, approved, pending, rejected,
      thisMonth: thisMonthTotal,
      lastMonth: lastMonthTotal,
      avgPerTrip: tripSet.size > 0 ? total / tripSet.size : 0,
    })
  }

  // ============================================================================
  // 🔍 FILTERING
  // ============================================================================

  const filteredExpenses = expenses.filter(exp => {
    if (filter !== 'all' && exp.status !== filter) return false
    if (categoryFilter !== 'all' && exp.category !== categoryFilter) return false
    if (selectedDriver !== 'all' && exp.driver_id !== selectedDriver) return false
    
    if (search) {
      const s = search.toLowerCase()
      const match = 
        exp.driver_name.toLowerCase().includes(s) ||
        exp.tracking_code?.toLowerCase().includes(s) ||
        exp.description?.toLowerCase().includes(s) ||
        exp.location?.toLowerCase().includes(s)
      if (!match) return false
    }

    if (dateRange !== 'all') {
      const expDate = new Date(exp.expense_date || exp.created_at)
      const now = new Date()
      
      if (dateRange === 'today') {
        if (expDate.toDateString() !== now.toDateString()) return false
      } else if (dateRange === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        if (expDate < weekAgo) return false
      } else if (dateRange === 'month') {
        if (expDate.getMonth() !== now.getMonth() || expDate.getFullYear() !== now.getFullYear()) return false
      } else if (dateRange === 'year') {
        if (expDate.getFullYear() !== now.getFullYear()) return false
      } else if (dateRange === 'custom') {
        if (customStart && expDate < new Date(customStart)) return false
        if (customEnd && expDate > new Date(customEnd + 'T23:59:59')) return false
      }
    }

    return true
  })

  // ============================================================================
  // 💾 CRUD OPERATIONS
  // ============================================================================

  const handleAddExpense = async (data: any) => {
    try {
      let receiptUrl = null
      let receiptImageUrl = null
      
      // ჩეკის ატვირთვა
      if (data.receipt_file) {
        const fileExt = data.receipt_file.name.split('.').pop()
        const fileName = `receipt-${Date.now()}.${fileExt}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(fileName, data.receipt_file)
        
        if (uploadError) throw uploadError
        
        const { data: urlData } = supabase.storage
          .from('receipts')
          .getPublicUrl(fileName)
        
        receiptImageUrl = urlData.publicUrl
      }

      const payload = {
        order_id: data.order_id || null,
        driver_id: data.driver_id,
        driver_name: data.driver_name,
        vehicle_id: data.vehicle_id || null,
        category: data.category,
        amount: data.amount,
        currency: data.currency || 'GEL',
        description: data.description || null,
        location: data.location || null,
        mileage: data.mileage || null,
        expense_date: data.expense_date || new Date().toISOString().split('T')[0],
        payment_method: data.payment_method || 'cash',
        receipt_url: data.receipt_url || null,
        receipt_image_url: receiptImageUrl,
        status: 'pending',
        created_at: new Date().toISOString(),
      }

      const { error } = await supabase.from('trip_expenses').insert([payload])
      if (error) throw error

      await logAudit('create', 'trip_expenses', data.driver_name, `ახალი ხარჯი: ${data.amount} ${data.currency} - ${data.category}`)
      await fetchExpenses()
      setShowAddModal(false)
      alert('✅ ხარჯი წარმატებით დაემატა!')
    } catch (e: any) {
      alert('შეცდომა: ' + e.message)
    }
  }

  const handleEditExpense = async (data: any) => {
    if (!editingExpense) return
    try {
      const payload = {
        order_id: data.order_id || null,
        driver_id: data.driver_id,
        driver_name: data.driver_name,
        vehicle_id: data.vehicle_id || null,
        category: data.category,
        amount: data.amount,
        currency: data.currency || 'GEL',
        description: data.description || null,
        location: data.location || null,
        mileage: data.mileage || null,
        expense_date: data.expense_date,
        payment_method: data.payment_method,
        receipt_url: data.receipt_url || null,
      }

      const { error } = await supabase.from('trip_expenses').update(payload).eq('id', editingExpense.id)
      if (error) throw error

      await logAudit('update', 'trip_expenses', editingExpense.id, `რედაქტირებულია ხარჯი`)
      await fetchExpenses()
      setShowEditModal(false)
      setEditingExpense(null)
    } catch (e: any) {
      alert('შეცდომა: ' + e.message)
    }
  }

  const handleDeleteExpense = async (expense: TripExpense) => {
    if (!confirm(`წავშალოთ ხარჯი ${expense.driver_name} - ${formatCurrency(expense.amount, expense.currency)}?`)) return
    
    setActionLoading(expense.id)
    try {
      const { error } = await supabase.from('trip_expenses').delete().eq('id', expense.id)
      if (error) throw error
      await logAudit('delete', 'trip_expenses', expense.id, `წაშლილია: ${expense.driver_name}`)
      await fetchExpenses()
    } catch (e: any) {
      alert('შეცდომა: ' + e.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleApprove = async (expenseId: string) => {
    setActionLoading(expenseId)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error } = await supabase
        .from('trip_expenses')
        .update({ 
          status: 'approved', 
          approved_by: user?.email,
          approved_at: new Date().toISOString()
        })
        .eq('id', expenseId)
      
      if (error) throw error
      await logAudit('approve', 'trip_expenses', expenseId, `ხარჯი დამტკიცებულია`)
      await fetchExpenses()
    } catch (e: any) {
      alert('შეცდომა: ' + e.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (expenseId: string) => {
    setActionLoading(expenseId)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error } = await supabase
        .from('trip_expenses')
        .update({ 
          status: 'rejected', 
          approved_by: user?.email,
          approved_at: new Date().toISOString()
        })
        .eq('id', expenseId)
      
      if (error) throw error
      await logAudit('reject', 'trip_expenses', expenseId, `ხარჯი უარყოფილია`)
      await fetchExpenses()
    } catch (e: any) {
      alert('შეცდომა: ' + e.message)
    } finally {
      setActionLoading(null)
    }
  }

  // ============================================================================
  // 📤 EXPORT & REPORTS
  // ============================================================================

  const exportToCSV = () => {
    const headers = ['თარიღი', 'მძღოლი', 'ტრეკინგი', 'კატეგორია', 'თანხა', 'ვალუტა', 'მეთოდი', 'მდებარეობა', 'კილომეტრაჟი', 'აღწერა', 'სტატუსი', 'ჩეკი']
    const rows = filteredExpenses.map(e => [
      e.expense_date || new Date(e.created_at).toLocaleDateString('ka-GE'),
      e.driver_name,
      e.tracking_code || '-',
      getCategoryLabel(e.category),
      e.amount.toString(),
      e.currency,
      getPaymentMethodLabel(e.payment_method),
      e.location || '-',
      e.mileage?.toString() || '-',
      e.description || '-',
      getStatusLabel(e.status),
      e.receipt_image_url || e.receipt_url || '-'
    ])
    
    const csv = '\uFEFF' + [headers.join(','), ...rows.map(row => row.map(v => `"${v}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportToPDF = async () => {
    try {
      const tempDiv = document.createElement('div')
      tempDiv.style.cssText = 'position: absolute; left: -9999px; top: 0; background: white; color: black; padding: 20px; width: 800px; font-family: Arial, sans-serif;'
      
      tempDiv.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="margin: 0; color: #7c3aed;">🛣️ LOGISTICS OS</h1>
          <h2 style="margin: 10px 0; color: #333;">ხარჯების ანგარიში</h2>
          <p style="color: #666;">გენერირებულია: ${new Date().toLocaleString('ka-GE')}</p>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px;">
          <div style="background: #ede9fe; padding: 15px; border-radius: 8px; text-align: center;">
            <div style="font-size: 12px; color: #6d28d9;">სულ ხარჯები</div>
            <div style="font-size: 20px; font-weight: bold;">${formatCurrency(stats.total, 'GEL')}</div>
          </div>
          <div style="background: #d1fae5; padding: 15px; border-radius: 8px; text-align: center;">
            <div style="font-size: 12px; color: #065f46;">დამტკიცებული</div>
            <div style="font-size: 20px; font-weight: bold;">${formatCurrency(stats.approved, 'GEL')}</div>
          </div>
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; text-align: center;">
            <div style="font-size: 12px; color: #92400e;">ლოდინში</div>
            <div style="font-size: 20px; font-weight: bold;">${formatCurrency(stats.pending, 'GEL')}</div>
          </div>
        </div>

        <h3>📋 დეტალური ჩანაწერები (${filteredExpenses.length})</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <thead>
            <tr style="background: #7c3aed; color: white;">
              <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">თარიღი</th>
              <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">მძღოლი</th>
              <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">კატეგორია</th>
              <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">თანხა</th>
              <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">სტატუსი</th>
            </tr>
          </thead>
          <tbody>
            ${filteredExpenses.map(e => `
              <tr>
                <td style="padding: 6px; border: 1px solid #ddd;">${e.expense_date || '-'}</td>
                <td style="padding: 6px; border: 1px solid #ddd;">${e.driver_name}</td>
                <td style="padding: 6px; border: 1px solid #ddd;">${getCategoryIcon(e.category)} ${getCategoryLabel(e.category)}</td>
                <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-weight: bold;">${formatCurrency(e.amount, e.currency)}</td>
                <td style="padding: 6px; border: 1px solid #ddd; text-align: center;">${getStatusLabel(e.status)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #ddd; text-align: center; color: #666; font-size: 11px;">
          <p>ეს ანგარიში ავტომატურად არის გენერირებული Logistics OS სისტემის მიერ</p>
        </div>
      `
      
      document.body.appendChild(tempDiv)
      
      const canvas = await html2canvas(tempDiv, { scale: 2, backgroundColor: '#ffffff' })
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      const imgData = canvas.toDataURL('image/png')
      
      let heightLeft = imgHeight
      let position = 0
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= 297
      
      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= 297
      }
      
      pdf.save(`expenses-report-${new Date().toISOString().split('T')[0]}.pdf`)
      document.body.removeChild(tempDiv)
    } catch (e: any) {
      alert('PDF გენერაციის შეცდომა: ' + e.message)
    }
  }

  // ============================================================================
  // 📝 HELPERS
  // ============================================================================

  const logAudit = async (action: string, table: string, recordId: string, details: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('audit_logs').insert({
        user_email: user?.email || 'system',
        action, table_name: table, record_id: recordId, details
      })
    } catch (e) { console.warn('Audit log failed') }
  }

  const formatCurrency = (amount: number, currency: string) => {
    const symbols: Record<string, string> = { GEL: '₾', USD: '$', EUR: '€', RUB: '₽' }
    return `${amount.toLocaleString('ka-GE', { maximumFractionDigits: 2 })} ${symbols[currency] || currency}`
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: '🕒 ლოდინში', approved: '✅ დამტკიცებული', rejected: '❌ უარყოფილი'
    }
    return labels[status] || status
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      approved: 'bg-green-500/20 text-green-400 border-green-500/30',
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
    }
    return (
      <span className={`${styles[status] || styles.pending} px-2 py-0.5 rounded text-[10px] border font-medium`}>
        {getStatusLabel(status)}
      </span>
    )
  }

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      fuel: '⛽', toll: '🛣️', repair: '🔧', food: '🍔', tire: '🛞', 
      parking: '🅿️', maintenance: '🛠️', insurance: '🛡️', other: '📦'
    }
    return icons[category] || '📦'
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      fuel: 'საწვავი', toll: 'ტოლი', repair: 'შეკეთება', food: 'კვება', tire: 'საბურავი',
      parking: 'პარკინგი', maintenance: 'ტექ. მომსახურება', insurance: 'დაზღვევა', other: 'სხვა'
    }
    return labels[category] || category
  }

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: '💵 ნაღდი', card: '💳 ბარათი', bank_transfer: '🏦 ბანკი',
      fuel_card: '⛽ საწვავის ბარათი', other: '📦 სხვა'
    }
    return labels[method] || method
  }

  // ============================================================================
  // 🎨 RENDER
  // ============================================================================

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
    <div className="space-y-5">
      
      {/* ═══════════════ HEADER ═══════════════ */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">🛣️ რეისის ხარჯები</h2>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-xs font-medium transition flex items-center gap-1"
          >
            ➕ ახალი ხარჯი
          </button>
          <button
            onClick={exportToCSV}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-xs font-medium transition flex items-center gap-1"
          >
            📥 CSV
          </button>
          <button
            onClick={exportToPDF}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-xs font-medium transition flex items-center gap-1"
          >
            📄 PDF
          </button>
          <button
            onClick={fetchAll}
            disabled={loading}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-xs font-medium transition"
          >
            🔄
          </button>
        </div>
      </div>

      {/* ═══════════════ STATS CARDS ═══════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon="💰" label="სულ ხარჯები" value={formatCurrency(stats.total, 'GEL')} color="purple" />
        <StatCard icon="✅" label="დამტკიცებული" value={formatCurrency(stats.approved, 'GEL')} color="green" />
        <StatCard icon="⏳" label="ლოდინში" value={formatCurrency(stats.pending, 'GEL')} color="yellow" />
        <StatCard icon="❌" label="უარყოფილი" value={formatCurrency(stats.rejected, 'GEL')} color="red" />
        <StatCard icon="📅" label="ამ თვეში" value={formatCurrency(stats.thisMonth, 'GEL')} color="blue" />
        <StatCard icon="📊" label="საშ. რეისზე" value={formatCurrency(stats.avgPerTrip, 'GEL')} color="emerald" />
      </div>

      {/* ═══════════════ FILTERS ═══════════════ */}
      <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-3 flex flex-wrap gap-2 items-center">
        <input
          type="text"
          placeholder="🔍 ძებნა (მძღოლი, ტრეკინგი, აღწერა, მდებარეობა)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-1.5 bg-gray-900/50 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-purple-500 flex-1 min-w-[200px]"
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-1.5 bg-gray-900/50 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-purple-500">
          <option value="all">ყველა სტატუსი</option>
          <option value="pending">🕒 ლოდინში</option>
          <option value="approved">✅ დამტკიცებული</option>
          <option value="rejected">❌ უარყოფილი</option>
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-1.5 bg-gray-900/50 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-purple-500">
          <option value="all">ყველა კატეგორია</option>
          {['fuel', 'toll', 'repair', 'food', 'tire', 'parking', 'maintenance', 'insurance', 'other'].map(cat => (
            <option key={cat} value={cat}>{getCategoryIcon(cat)} {getCategoryLabel(cat)}</option>
          ))}
        </select>
        <select value={selectedDriver} onChange={(e) => setSelectedDriver(e.target.value)}
          className="px-3 py-1.5 bg-gray-900/50 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-purple-500">
          <option value="all">ყველა მძღოლი</option>
          {drivers.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
        </select>
        <select value={dateRange} onChange={(e) => setDateRange(e.target.value as any)}
          className="px-3 py-1.5 bg-gray-900/50 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-purple-500">
          <option value="all">📅 ყველა დრო</option>
          <option value="today">დღეს</option>
          <option value="week">ბოლო 7 დღე</option>
          <option value="month">ამ თვე</option>
          <option value="year">ამ წელი</option>
          <option value="custom">მორგებული</option>
        </select>
        {dateRange === 'custom' && (
          <>
            <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)}
              className="px-2 py-1.5 bg-gray-900/50 border border-gray-700 rounded-lg text-xs text-white" />
            <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2 py-1.5 bg-gray-900/50 border border-gray-700 rounded-lg text-xs text-white" />
          </>
        )}
      </div>

      {/* ═══════════════ CATEGORY SUMMARIES ═══════════════ */}
      {summaries.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">📊 კატეგორიების მიხედვით</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {summaries.map(summary => (
              <div key={summary.category} className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 border border-gray-700 rounded-xl p-3 text-center hover:border-purple-500/50 transition">
                <div className="text-2xl mb-1">{getCategoryIcon(summary.category)}</div>
                <div className="text-[10px] text-gray-400 uppercase font-semibold">{getCategoryLabel(summary.category)}</div>
                <div className="text-sm font-bold text-white mt-1">{formatCurrency(summary.total_amount, 'GEL')}</div>
                <div className="text-[9px] text-gray-500 mt-1 flex justify-center gap-2">
                  <span className="text-green-400">{summary.approved_count}✅</span>
                  <span className="text-yellow-400">{summary.pending_count}🕒</span>
                  <span className="text-red-400">{summary.rejected_count}❌</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════ EXPENSES TABLE ═══════════════ */}
      <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead className="text-gray-500 uppercase bg-gray-900/40">
              <tr>
                <th className="px-3 py-3 text-left font-semibold">თარიღი</th>
                <th className="px-3 py-3 text-left font-semibold">მძღოლი</th>
                <th className="px-3 py-3 text-left font-semibold">ტრეკინგი</th>
                <th className="px-3 py-3 text-left font-semibold">კატეგორია</th>
                <th className="px-3 py-3 text-right font-semibold">თანხა</th>
                <th className="px-3 py-3 text-center font-semibold">მეთოდი</th>
                <th className="px-3 py-3 text-center font-semibold">ჩეკი</th>
                <th className="px-3 py-3 text-center font-semibold">სტატუსი</th>
                <th className="px-3 py-3 text-right font-semibold">ქმედება</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/30">
              {filteredExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-700/20 transition">
                  <td className="px-3 py-2.5 text-[10px] text-gray-400 whitespace-nowrap">
                    {new Date(expense.expense_date || expense.created_at).toLocaleDateString('ka-GE')}
                    {expense.location && (
                      <div className="text-[9px] text-gray-600">📍 {expense.location}</div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-[10px] text-white font-medium">{expense.driver_name}</td>
                  <td className="px-3 py-2.5 text-[10px] text-blue-400 font-mono">{expense.tracking_code || '–'}</td>
                  <td className="px-3 py-2.5 text-[10px]">
                    <span className="flex items-center gap-1">
                      {getCategoryIcon(expense.category)} {getCategoryLabel(expense.category)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold text-white">
                    {formatCurrency(expense.amount, expense.currency)}
                    {expense.mileage && (
                      <div className="text-[9px] text-gray-500 font-normal">{expense.mileage} კმ</div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center text-[10px] text-gray-400">
                    {getPaymentMethodLabel(expense.payment_method)}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {(expense.receipt_image_url || expense.receipt_url) ? (
                      <a 
                        href={expense.receipt_image_url || expense.receipt_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-400 hover:text-blue-300 text-sm"
                        title="ჩეკის ნახვა"
                      >
                        📎
                      </a>
                    ) : (
                      <span className="text-gray-600">–</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">{getStatusBadge(expense.status)}</td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => { setDetailsExpense(expense); setShowDetailsModal(true) }}
                        className="p-1 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded transition"
                        title="დეტალები"
                      >
                        👁️
                      </button>
                      {expense.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleApprove(expense.id)}
                            disabled={actionLoading === expense.id}
                            className="p-1 text-green-400 bg-green-500/10 hover:bg-green-500/20 disabled:opacity-50 rounded transition"
                            title="დამტკიცება"
                          >
                            ✅
                          </button>
                          <button
                            onClick={() => handleReject(expense.id)}
                            disabled={actionLoading === expense.id}
                            className="p-1 text-red-400 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-50 rounded transition"
                            title="უარყოფა"
                          >
                            ❌
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => { setEditingExpense(expense); setShowEditModal(true) }}
                          className="p-1 text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20 rounded transition"
                          title="რედაქტირება"
                        >
                          ✏️
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteExpense(expense)}
                        disabled={actionLoading === expense.id}
                        className="p-1 text-red-400 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-50 rounded transition"
                        title="წაშლა"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredExpenses.length === 0 && (
          <div className="p-8 text-center text-gray-500 text-xs">
            {expenses.length === 0 ? '🛣️ ხარჯების ჩანაწერები არ მოიძებნა' : '🔍 ფილტრის შედეგები ცარიელია'}
          </div>
        )}
      </div>

      {/* ═══════════════ MODALS ═══════════════ */}
      {showAddModal && (
        <ExpenseFormModal
          mode="add"
          drivers={drivers}
          vehicles={vehicles}
          onSave={handleAddExpense}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {showEditModal && editingExpense && (
        <ExpenseFormModal
          mode="edit"
          drivers={drivers}
          vehicles={vehicles}
          expense={editingExpense}
          onSave={handleEditExpense}
          onClose={() => { setShowEditModal(false); setEditingExpense(null) }}
        />
      )}

      {showDetailsModal && detailsExpense && (
        <ExpenseDetailsModal
          expense={detailsExpense}
          onClose={() => { setShowDetailsModal(false); setDetailsExpense(null) }}
          onEdit={() => {
            setEditingExpense(detailsExpense)
            setShowDetailsModal(false)
            setShowEditModal(true)
          }}
          onApprove={() => handleApprove(detailsExpense.id)}
          onReject={() => handleReject(detailsExpense.id)}
        />
      )}
    </div>
  )
}

// ============================================================================
// 📊 STAT CARD COMPONENT
// ============================================================================

const StatCard = ({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) => {
  const colors: Record<string, string> = {
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
    green: 'from-green-500/20 to-green-600/10 border-green-500/30',
    yellow: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30',
    red: 'from-red-500/20 to-red-600/10 border-red-500/30',
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
    emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30',
  }
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-3`}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-sm">{icon}</span>
        <span className="text-[10px] text-gray-400 uppercase font-semibold">{label}</span>
      </div>
      <div className="text-sm font-bold text-white truncate">{value}</div>
    </div>
  )
}

// ============================================================================
// 📝 EXPENSE FORM MODAL (ADD / EDIT)
// ============================================================================

const ExpenseFormModal = ({ mode, drivers, vehicles, expense, onSave, onClose }: any) => {
  const [form, setForm] = useState({
    driver_id: expense?.driver_id || '',
    driver_name: expense?.driver_name || '',
    order_id: expense?.order_id || '',
    vehicle_id: expense?.vehicle_id || '',
    category: expense?.category || 'fuel',
    amount: expense?.amount?.toString() || '',
    currency: expense?.currency || 'GEL',
    description: expense?.description || '',
    location: expense?.location || '',
    mileage: expense?.mileage?.toString() || '',
    expense_date: expense?.expense_date || new Date().toISOString().split('T')[0],
    payment_method: expense?.payment_method || 'cash',
    receipt_url: expense?.receipt_url || '',
    receipt_file: null as File | null,
  })

  const handleDriverChange = (driverId: string) => {
    const driver = drivers.find((d: Driver) => d.id === driverId)
    if (driver) {
      setForm({ ...form, driver_id: driver.id, driver_name: driver.full_name })
    }
  }

  const handleSubmit = () => {
    if (!form.driver_id) return alert('აირჩიეთ მძღოლი')
    if (!form.amount || parseFloat(form.amount) <= 0) return alert('შეიყვანეთ თანხა')
    if (!form.expense_date) return alert('შეიყვანეთ თარიღი')

    onSave({
      ...form,
      amount: parseFloat(form.amount),
      mileage: form.mileage ? parseInt(form.mileage) : null,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-3xl my-8" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
          <h3 className="text-sm font-bold text-white">
            {mode === 'add' ? '➕ ახალი ხარჯი' : '✏️ რედაქტირება'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">&times;</button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* მძღოლი და თარიღი */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase">მძღოლი *</label>
              <select
                value={form.driver_id}
                onChange={(e) => handleDriverChange(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-purple-500"
              >
                <option value="">აირჩიეთ მძღოლი...</option>
                {drivers.map((d: Driver) => (
                  <option key={d.id} value={d.id}>{d.full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase">თარიღი *</label>
              <input
                type="date"
                value={form.expense_date}
                onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* კატეგორია და თანხა */}
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-3">💰 ფინანსები</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 mb-1">კატეგორია *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-purple-500"
                >
                  {['fuel', 'toll', 'repair', 'food', 'tire', 'parking', 'maintenance', 'insurance', 'other'].map(cat => (
                    <option key={cat} value={cat}>{getCategoryIcon(cat)} {getCategoryLabel(cat)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 mb-1">თანხა *</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-purple-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 mb-1">ვალუტა</label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-purple-500"
                >
                  <option value="GEL">🇬🇪 GEL</option>
                  <option value="USD">🇺🇸 USD</option>
                  <option value="EUR">🇪🇺 EUR</option>
                  <option value="RUB">🇷🇺 RUB</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 mb-1">გადახდის მეთოდი</label>
                <select
                  value={form.payment_method}
                  onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-purple-500"
                >
                  <option value="cash">💵 ნაღდი</option>
                  <option value="card">💳 ბარათი</option>
                  <option value="bank_transfer">🏦 ბანკი</option>
                  <option value="fuel_card">⛽ საწვავის ბარათი</option>
                  <option value="other">📦 სხვა</option>
                </select>
              </div>
            </div>
          </div>

          {/* დეტალები */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase">მანქანა</label>
              <select
                value={form.vehicle_id}
                onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-purple-500"
              >
                <option value="">არ არის მითითებული</option>
                {vehicles.map((v: Vehicle) => (
                  <option key={v.id} value={v.id}>{v.plate_number} {v.brand ? `(${v.brand})` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase">კილომეტრაჟი</label>
              <input
                type="number"
                value={form.mileage}
                onChange={(e) => setForm({ ...form, mileage: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-purple-500"
                placeholder="მაგ: 150"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase">📍 მდებარეობა</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-purple-500"
                placeholder="მაგ: თბილისი, დიდუბე"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase">შეკვეთის ID</label>
              <input
                type="text"
                value={form.order_id}
                onChange={(e) => setForm({ ...form, order_id: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-purple-500"
                placeholder="არასავალდებულო"
              />
            </div>
          </div>

          {/* აღწერა */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase">აღწერა</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-purple-500 resize-none"
              placeholder="დამატებითი ინფორმაცია..."
            />
          </div>

          {/* ჩეკის ატვირთვა */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase">📎 ჩეკის ფოტო</label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setForm({ ...form, receipt_file: e.target.files?.[0] || null })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-purple-500 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-purple-600 file:text-white file:text-xs file:cursor-pointer"
            />
            {form.receipt_url && (
              <div className="mt-2 text-[10px] text-gray-400">
                არსებული: <a href={form.receipt_url} target="_blank" className="text-blue-400 underline">ნახვა</a>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-700 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-medium text-white">გაუქმება</button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg text-xs font-bold text-white shadow-lg"
          >
            {mode === 'add' ? '➕ დამატება' : '💾 შენახვა'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// 👁️ DETAILS MODAL
// ============================================================================

const ExpenseDetailsModal = ({ expense, onClose, onEdit, onApprove, onReject }: any) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
          <h3 className="text-sm font-bold text-white">📋 ხარჯის დეტალები</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">&times;</button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] text-gray-500 uppercase">მძღოლი</div>
              <div className="text-sm font-bold text-white">{expense.driver_name}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 uppercase">სტატუსი</div>
              <div className="mt-1">{getStatusBadge(expense.status)}</div>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-3">💰 ფინანსები</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">კატეგორია:</span>
                <span className="text-white font-medium">{getCategoryIcon(expense.category)} {getCategoryLabel(expense.category)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">თანხა:</span>
                <span className="text-white font-bold text-lg">{formatCurrency(expense.amount, expense.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">გადახდის მეთოდი:</span>
                <span className="text-white">{getPaymentMethodLabel(expense.payment_method)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-[10px] text-gray-500 uppercase">თარიღი</div>
              <div className="text-white">{new Date(expense.expense_date || expense.created_at).toLocaleDateString('ka-GE')}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 uppercase">მდებარეობა</div>
              <div className="text-white">{expense.location || '–'}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 uppercase">ტრეკინგი</div>
              <div className="text-blue-400 font-mono">{expense.tracking_code || '–'}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 uppercase">კილომეტრაჟი</div>
              <div className="text-white">{expense.mileage ? `${expense.mileage} კმ` : '–'}</div>
            </div>
          </div>

          {expense.description && (
            <div>
              <div className="text-[10px] text-gray-500 uppercase mb-1">აღწერა</div>
              <div className="text-xs text-gray-300 bg-gray-800/50 p-3 rounded-lg">{expense.description}</div>
            </div>
          )}

          {(expense.receipt_image_url || expense.receipt_url) && (
            <div>
              <div className="text-[10px] text-gray-500 uppercase mb-1">📎 ჩეკი</div>
              <a 
                href={expense.receipt_image_url || expense.receipt_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-xs text-blue-400 hover:bg-blue-500/20 transition"
              >
                🔗 ჩეკის ნახვა
              </a>
            </div>
          )}

          <div className="text-[10px] text-gray-500 pt-2 border-t border-gray-700">
            შექმნილია: {new Date(expense.created_at).toLocaleString('ka-GE')}
            {expense.approved_at && (
              <span className="ml-3">
                {expense.status === 'approved' ? '✅' : '❌'} {expense.approved_by} • {new Date(expense.approved_at).toLocaleString('ka-GE')}
              </span>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-700 flex justify-end gap-2">
          <button onClick={onEdit} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-xs font-medium text-white flex items-center gap-1">
            ✏️ რედაქტირება
          </button>
          {expense.status === 'pending' && (
            <>
              <button onClick={onApprove} className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-xs font-medium text-white flex items-center gap-1">
                ✅ დამტკიცება
              </button>
              <button onClick={onReject} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-xs font-medium text-white flex items-center gap-1">
                ❌ უარყოფა
              </button>
            </>
          )}
          <button onClick={onClose} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-medium text-white">
            დახურვა
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// 🎨 HELPER FUNCTIONS (მოდალებისთვის)
// ============================================================================

const formatCurrency = (amount: number, currency: string) => {
  const symbols: Record<string, string> = { GEL: '₾', USD: '$', EUR: '€', RUB: '₽' }
  return `${amount.toLocaleString('ka-GE', { maximumFractionDigits: 2 })} ${symbols[currency] || currency}`
}

const getStatusBadge = (status: string) => {
  const styles: Record<string, string> = {
    approved: 'bg-green-500/20 text-green-400 border-green-500/30',
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  }
  const labels: Record<string, string> = {
    pending: '🕒 ლოდინში', approved: '✅ დამტკიცებული', rejected: '❌ უარყოფილი'
  }
  return (
    <span className={`${styles[status] || styles.pending} px-2 py-0.5 rounded text-[10px] border font-medium`}>
      {labels[status] || status}
    </span>
  )
}

const getCategoryIcon = (category: string) => {
  const icons: Record<string, string> = {
    fuel: '⛽', toll: '🛣️', repair: '🔧', food: '🍔', tire: '🛞',
    parking: '🅿️', maintenance: '🛠️', insurance: '🛡️', other: '📦'
  }
  return icons[category] || '📦'
}

const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    fuel: 'საწვავი', toll: 'ტოლი', repair: 'შეკეთება', food: 'კვება', tire: 'საბურავი',
    parking: 'პარკინგი', maintenance: 'ტექ. მომსახურება', insurance: 'დაზღვევა', other: 'სხვა'
  }
  return labels[category] || category
}

const getPaymentMethodLabel = (method: string) => {
  const labels: Record<string, string> = {
    cash: '💵 ნაღდი', card: '💳 ბარათი', bank_transfer: '🏦 ბანკი',
    fuel_card: '⛽ საწვავის ბარათი', other: '📦 სხვა'
  }
  return labels[method] || method
}