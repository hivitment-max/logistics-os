'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

// ============================================================================
// 📋 TypeScript Interfaces
// ============================================================================

interface PayrollRecord {
  id: string
  driver_id: string
  driver_name: string
  driver_type: 'internal' | 'external'
  order_id: string | null
  tracking_code: string | null
  amount: number
  bonus_amount: number
  penalty_amount: number
  net_amount: number
  currency: string
  commission_percent: number
  payment_method: 'cash' | 'bank_transfer' | 'card' | 'other'
  payment_reference: string | null
  status: 'pending' | 'approved' | 'paid' | 'overdue' | 'cancelled'
  period_start: string
  period_end: string
  paid_at: string | null
  approved_by: string | null
  telegram_notified_at: string | null
  notes: string | null
  created_at: string
}

interface DriverSummary {
  driver_id: string
  driver_name: string
  driver_type: string
  total_earnings: number
  bonus_total: number
  penalty_total: number
  net_total: number
  paid_amount: number
  pending_amount: number
  trips_count: number
}

interface Driver {
  id: string
  full_name: string
  phone: string
  telegram_chat_id?: string
  type?: string
}

// ============================================================================
// 🧩 MAIN COMPONENT
// ============================================================================

export default function PayrollTab() {
  const [records, setRecords] = useState<PayrollRecord[]>([])
  const [summaries, setSummaries] = useState<DriverSummary[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // 🔍 Filters
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedDriver, setSelectedDriver] = useState<string>('all')
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month' | 'year' | 'custom'>('all')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  // 🪟 Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState<PayrollRecord | null>(null)
  const [detailsRecord, setDetailsRecord] = useState<PayrollRecord | null>(null)

  // 📊 Stats
  const [stats, setStats] = useState({
    totalRecords: 0,
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    bonusTotal: 0,
    penaltyTotal: 0,
    netTotal: 0,
    thisMonthPaid: 0,
    thisMonthPending: 0,
  })

  const reportRef = useRef<HTMLDivElement>(null)

  // ============================================================================
  // 🔄 DATA LOADING
  // ============================================================================

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    await Promise.all([fetchPayrollData(), fetchDrivers()])
  }

  const fetchDrivers = async () => {
    try {
      const { data } = await supabase
        .from('drivers')
        .select('id, full_name, phone, telegram_chat_id, type')
        .eq('is_active', true)
        .order('full_name')
      if (data) setDrivers(data as Driver[])
    } catch (e) {
      console.error('Drivers fetch error:', e)
    }
  }

  const fetchPayrollData = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('payroll')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500)

      if (error) throw error

      if (data && data.length > 0) {
        const normalized = data.map((r: any) => ({
          ...r,
          bonus_amount: parseFloat(r.bonus_amount || 0),
          penalty_amount: parseFloat(r.penalty_amount || 0),
          net_amount: parseFloat(r.net_amount || r.amount),
          amount: parseFloat(r.amount),
          commission_percent: parseFloat(r.commission_percent || 0),
        }))
        setRecords(normalized as PayrollRecord[])
        calculateSummaries(normalized)
        calculateStats(normalized)
      } else {
        setRecords([])
        setSummaries([])
        calculateStats([])
      }
    } catch (e: any) {
      console.error('Payroll fetch error:', e)
      alert('შეცდომა: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  // ============================================================================
  // 📊 CALCULATIONS
  // ============================================================================

  const calculateSummaries = (data: PayrollRecord[]) => {
    const map = new Map<string, DriverSummary>()
    
    data.forEach(r => {
      const existing = map.get(r.driver_id)
      const net = r.net_amount || (r.amount + (r.bonus_amount || 0) - (r.penalty_amount || 0))
      
      if (existing) {
        existing.total_earnings += r.amount
        existing.bonus_total += r.bonus_amount || 0
        existing.penalty_total += r.penalty_amount || 0
        existing.net_total += net
        if (r.status === 'paid') existing.paid_amount += net
        else if (r.status !== 'cancelled') existing.pending_amount += net
        existing.trips_count += 1
      } else {
        map.set(r.driver_id, {
          driver_id: r.driver_id,
          driver_name: r.driver_name,
          driver_type: r.driver_type || 'internal',
          total_earnings: r.amount,
          bonus_total: r.bonus_amount || 0,
          penalty_total: r.penalty_amount || 0,
          net_total: net,
          paid_amount: r.status === 'paid' ? net : 0,
          pending_amount: r.status !== 'paid' && r.status !== 'cancelled' ? net : 0,
          trips_count: 1
        })
      }
    })
    
    setSummaries(Array.from(map.values()))
  }

  const calculateStats = (data: PayrollRecord[]) => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    
    let totalAmount = 0, paidAmount = 0, pendingAmount = 0, overdueAmount = 0
    let bonusTotal = 0, penaltyTotal = 0, netTotal = 0
    let thisMonthPaid = 0, thisMonthPending = 0

    data.forEach(r => {
      if (r.status === 'cancelled') return
      const net = r.net_amount || (r.amount + (r.bonus_amount || 0) - (r.penalty_amount || 0))
      totalAmount += net
      bonusTotal += r.bonus_amount || 0
      penaltyTotal += r.penalty_amount || 0
      netTotal += net

      if (r.status === 'paid') {
        paidAmount += net
        if (r.paid_at && new Date(r.paid_at) >= monthStart) {
          thisMonthPaid += net
        }
      } else if (r.status === 'overdue') {
        overdueAmount += net
      } else {
        pendingAmount += net
        thisMonthPending += net
      }
    })

    setStats({
      totalRecords: data.length,
      totalAmount,
      paidAmount,
      pendingAmount,
      overdueAmount,
      bonusTotal,
      penaltyTotal,
      netTotal,
      thisMonthPaid,
      thisMonthPending,
    })
  }

  // ============================================================================
  // 🔍 FILTERING
  // ============================================================================

  const filteredRecords = records.filter(record => {
    // Status filter
    if (filter !== 'all' && record.status !== filter) return false
    
    // Driver filter
    if (selectedDriver !== 'all' && record.driver_id !== selectedDriver) return false
    
    // Search
    if (search) {
      const s = search.toLowerCase()
      const match = 
        record.driver_name.toLowerCase().includes(s) ||
        record.tracking_code?.toLowerCase().includes(s) ||
        record.notes?.toLowerCase().includes(s) ||
        record.payment_reference?.toLowerCase().includes(s)
      if (!match) return false
    }

    // Date filter
    if (dateRange !== 'all') {
      const recordDate = new Date(record.created_at)
      const now = new Date()
      
      if (dateRange === 'today') {
        if (recordDate.toDateString() !== now.toDateString()) return false
      } else if (dateRange === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        if (recordDate < weekAgo) return false
      } else if (dateRange === 'month') {
        if (recordDate.getMonth() !== now.getMonth() || recordDate.getFullYear() !== now.getFullYear()) return false
      } else if (dateRange === 'year') {
        if (recordDate.getFullYear() !== now.getFullYear()) return false
      } else if (dateRange === 'custom') {
        if (customStart && recordDate < new Date(customStart)) return false
        if (customEnd && recordDate > new Date(customEnd + 'T23:59:59')) return false
      }
    }

    return true
  })

  // ============================================================================
  // 💾 CRUD OPERATIONS
  // ============================================================================

  const handleAddRecord = async (data: any) => {
    try {
      const net = data.amount + (data.bonus_amount || 0) - (data.penalty_amount || 0)
      
      const payload = {
        driver_id: data.driver_id,
        driver_name: data.driver_name,
        driver_type: data.driver_type || 'internal',
        order_id: data.order_id || null,
        tracking_code: data.tracking_code || null,
        amount: data.amount,
        bonus_amount: data.bonus_amount || 0,
        penalty_amount: data.penalty_amount || 0,
        net_amount: net,
        currency: data.currency || 'GEL',
        commission_percent: data.commission_percent || 0,
        payment_method: data.payment_method || 'cash',
        payment_reference: data.payment_reference || null,
        status: data.status || 'pending',
        period_start: data.period_start,
        period_end: data.period_end,
        notes: data.notes || null,
        created_at: new Date().toISOString(),
      }

      const { error } = await supabase.from('payroll').insert([payload])
      if (error) throw error

      await logAudit('create', 'payroll', data.driver_name, `ახალი ანგარიშსწორება: ${net} ${data.currency}`)
      await fetchPayrollData()
      setShowAddModal(false)
      alert('✅ ანგარიშსწორება წარმატებით დაემატა!')
    } catch (e: any) {
      console.error('Add error:', e)
      alert('შეცდომა: ' + e.message)
    }
  }

  const handleEditRecord = async (data: any) => {
    if (!editingRecord) return
    try {
      const net = data.amount + (data.bonus_amount || 0) - (data.penalty_amount || 0)
      
      const payload = {
        driver_id: data.driver_id,
        driver_name: data.driver_name,
        driver_type: data.driver_type || 'internal',
        order_id: data.order_id || null,
        tracking_code: data.tracking_code || null,
        amount: data.amount,
        bonus_amount: data.bonus_amount || 0,
        penalty_amount: data.penalty_amount || 0,
        net_amount: net,
        currency: data.currency || 'GEL',
        commission_percent: data.commission_percent || 0,
        payment_method: data.payment_method || 'cash',
        payment_reference: data.payment_reference || null,
        status: data.status,
        period_start: data.period_start,
        period_end: data.period_end,
        notes: data.notes || null,
        paid_at: data.status === 'paid' ? (data.paid_at || new Date().toISOString()) : null,
      }

      const { error } = await supabase.from('payroll').update(payload).eq('id', editingRecord.id)
      if (error) throw error

      await logAudit('update', 'payroll', editingRecord.id, `რედაქტირებულია ანგარიშსწორება`)
      await fetchPayrollData()
      setShowEditModal(false)
      setEditingRecord(null)
    } catch (e: any) {
      alert('შეცდომა: ' + e.message)
    }
  }

  const handleDeleteRecord = async (record: PayrollRecord) => {
    if (!confirm(`წავშალოთ ანგარიშსწორება ${record.driver_name} - ${formatCurrency(record.net_amount || record.amount, record.currency)}?`)) return
    
    setActionLoading(record.id)
    try {
      const { error } = await supabase.from('payroll').delete().eq('id', record.id)
      if (error) throw error

      await logAudit('delete', 'payroll', record.id, `წაშლილია: ${record.driver_name}`)
      await fetchPayrollData()
    } catch (e: any) {
      alert('შეცდომა: ' + e.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleMarkAsPaid = async (record: PayrollRecord, paymentMethod?: string, reference?: string) => {
    setActionLoading(record.id)
    try {
      const { error } = await supabase
        .from('payroll')
        .update({ 
          status: 'paid', 
          paid_at: new Date().toISOString(),
          payment_method: paymentMethod || record.payment_method,
          payment_reference: reference || record.payment_reference,
        })
        .eq('id', record.id)
      
      if (error) throw error

      await logAudit('update', 'payroll', record.id, `გადახდილი: ${record.driver_name} - ${formatCurrency(record.net_amount || record.amount, record.currency)}`)
      await fetchPayrollData()
    } catch (e: any) {
      alert('შეცდომა: ' + e.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleMarkAsOverdue = async (record: PayrollRecord) => {
    setActionLoading(record.id)
    try {
      const { error } = await supabase
        .from('payroll')
        .update({ status: 'overdue' })
        .eq('id', record.id)
      
      if (error) throw error
      await fetchPayrollData()
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
    const headers = ['მძღოლი', 'ტიპი', 'ტრეკინგი', 'თანხა', 'ბონუსი', 'ჯარიმა', 'ჯამი', 'ვალუტა', 'კომისია', 'გადახდის მეთოდი', 'სტატუსი', 'პერიოდი', 'გადახდის თარიღი', 'შენიშვნა']
    const rows = filteredRecords.map(r => [
      r.driver_name,
      r.driver_type === 'external' ? 'გარე' : 'შიდა',
      r.tracking_code || '-',
      r.amount.toString(),
      (r.bonus_amount || 0).toString(),
      (r.penalty_amount || 0).toString(),
      (r.net_amount || r.amount).toString(),
      r.currency,
      `${r.commission_percent}%`,
      getPaymentMethodLabel(r.payment_method),
      getStatusLabel(r.status),
      `${r.period_start} - ${r.period_end}`,
      r.paid_at ? new Date(r.paid_at).toLocaleDateString('ka-GE') : '-',
      r.notes || '-'
    ])
    
    const csv = '\uFEFF' + [headers.join(','), ...rows.map(row => row.map(v => `"${v}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payroll-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const generateDriverReport = async (summary: DriverSummary) => {
    if (!reportRef.current) return
    
    // შევქმნათ დროებითი HTML ანგარიშისთვის
    const driverRecords = records.filter(r => r.driver_id === summary.driver_id)
    
    const tempDiv = document.createElement('div')
    tempDiv.style.cssText = 'position: absolute; left: -9999px; top: 0; background: white; color: black; padding: 20px; width: 800px; font-family: Arial, sans-serif;'
    tempDiv.innerHTML = `
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="margin: 0; color: #1e40af;">🚛 LOGISTICS OS</h1>
        <h2 style="margin: 10px 0; color: #333;">მძღოლის ანგარიში</h2>
        <p style="color: #666;">გენერირებულია: ${new Date().toLocaleString('ka-GE')}</p>
      </div>
      
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="margin-top: 0;">👤 მძღოლი: ${summary.driver_name}</h3>
        <p><strong>ტიპი:</strong> ${summary.driver_type === 'external' ? 'გარე მძღოლი' : 'შიდა მძღოლი'}</p>
        <p><strong>რეისების რაოდენობა:</strong> ${summary.trips_count}</p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px;">
        <div style="background: #dbeafe; padding: 15px; border-radius: 8px; text-align: center;">
          <div style="font-size: 12px; color: #1e40af;">ჯამური</div>
          <div style="font-size: 20px; font-weight: bold;">${formatCurrency(summary.net_total, 'GEL')}</div>
        </div>
        <div style="background: #d1fae5; padding: 15px; border-radius: 8px; text-align: center;">
          <div style="font-size: 12px; color: #065f46;">გადახდილი</div>
          <div style="font-size: 20px; font-weight: bold;">${formatCurrency(summary.paid_amount, 'GEL')}</div>
        </div>
        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; text-align: center;">
          <div style="font-size: 12px; color: #92400e;">დარჩენილი</div>
          <div style="font-size: 20px; font-weight: bold;">${formatCurrency(summary.pending_amount, 'GEL')}</div>
        </div>
      </div>

      <h3>📋 დეტალური ჩანაწერები</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <thead>
          <tr style="background: #1e40af; color: white;">
            <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">თარიღი</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">ტრეკინგი</th>
            <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">თანხა</th>
            <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">ბონუსი</th>
            <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">ჯარიმა</th>
            <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">ჯამი</th>
            <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">სტატუსი</th>
          </tr>
        </thead>
        <tbody>
          ${driverRecords.map(r => `
            <tr>
              <td style="padding: 6px; border: 1px solid #ddd;">${new Date(r.created_at).toLocaleDateString('ka-GE')}</td>
              <td style="padding: 6px; border: 1px solid #ddd;">${r.tracking_code || '-'}</td>
              <td style="padding: 6px; border: 1px solid #ddd; text-align: right;">${formatCurrency(r.amount, r.currency)}</td>
              <td style="padding: 6px; border: 1px solid #ddd; text-align: right; color: green;">${r.bonus_amount ? '+' + formatCurrency(r.bonus_amount, r.currency) : '-'}</td>
              <td style="padding: 6px; border: 1px solid #ddd; text-align: right; color: red;">${r.penalty_amount ? '-' + formatCurrency(r.penalty_amount, r.currency) : '-'}</td>
              <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-weight: bold;">${formatCurrency(r.net_amount || r.amount, r.currency)}</td>
              <td style="padding: 6px; border: 1px solid #ddd; text-align: center;">${getStatusLabel(r.status)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #ddd; text-align: center; color: #666; font-size: 11px;">
        <p>ეს ანგარიში ავტომატურად არის გენერირებული Logistics OS სისტემის მიერ</p>
      </div>
    `
    
    document.body.appendChild(tempDiv)
    
    try {
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
      
      pdf.save(`payroll-${summary.driver_name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (e: any) {
      alert('PDF გენერაციის შეცდომა: ' + e.message)
    } finally {
      document.body.removeChild(tempDiv)
    }
  }

  // ============================================================================
  // 💬 TELEGRAM NOTIFICATION
  // ============================================================================

  const sendTelegramNotification = async (record: PayrollRecord) => {
    const driver = drivers.find(d => d.id === record.driver_id)
    if (!driver?.telegram_chat_id) {
      alert('⚠️ მძღოლს არ აქვს Telegram Chat ID')
      return
    }

    setActionLoading(record.id)
    try {
      const token = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN
      if (!token) throw new Error('Bot token missing')

      const message = `💰 <b>ანგარიშსწორება</b>\n\n` +
        `👤 ${record.driver_name}\n` +
        `💵 თანხა: <b>${formatCurrency(record.net_amount || record.amount, record.currency)}</b>\n` +
        `${record.bonus_amount ? `🎁 ბონუსი: ${formatCurrency(record.bonus_amount, record.currency)}\n` : ''}` +
        `${record.penalty_amount ? `⚠️ ჯარიმა: ${formatCurrency(record.penalty_amount, record.currency)}\n` : ''}` +
        `📅 პერიოდი: ${new Date(record.period_start).toLocaleDateString('ka-GE')} – ${new Date(record.period_end).toLocaleDateString('ka-GE')}\n` +
        `${record.tracking_code ? `📋 ტრეკინგი: ${record.tracking_code}\n` : ''}` +
        `\nსტატუსი: ${record.status === 'paid' ? '✅ გადახდილია' : '⏳ ლოდინში'}`

      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: driver.telegram_chat_id,
          text: message,
          parse_mode: 'HTML'
        })
      })

      const result = await res.json()
      if (!result.ok) throw new Error(result.description)

      await supabase
        .from('payroll')
        .update({ telegram_notified_at: new Date().toISOString() })
        .eq('id', record.id)

      alert('✅ შეტყობინება გაგზავნილია!')
      await fetchPayrollData()
    } catch (e: any) {
      alert('შეცდომა: ' + e.message)
    } finally {
      setActionLoading(null)
    }
  }

  // ============================================================================
  // ⚡ AUTO-GENERATE FROM ORDERS
  // ============================================================================

  const generateFromOrders = async () => {
    setShowGenerateModal(true)
  }

  const executeGenerateFromOrders = async (selectedOrders: any[], commissionPercent: number) => {
    setActionLoading('generate')
    try {
      const today = new Date().toISOString().split('T')[0]
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      
      let created = 0
      for (const order of selectedOrders) {
        const amount = (parseFloat(order.price || 0) * commissionPercent) / 100
        if (amount <= 0) continue

        const driverId = order.driver_type === 'external' ? order.external_driver_id : order.driver_id
        const driver = drivers.find(d => d.id === driverId)
        if (!driver) continue

        const payload = {
          driver_id: driver.id,
          driver_name: driver.full_name,
          driver_type: order.driver_type || 'internal',
          order_id: order.id,
          tracking_code: order.tracking_code,
          amount: amount,
          bonus_amount: 0,
          penalty_amount: 0,
          net_amount: amount,
          currency: order.currency || 'GEL',
          commission_percent: commissionPercent,
          payment_method: 'cash',
          status: 'pending',
          period_start: weekAgo,
          period_end: today,
          created_at: new Date().toISOString(),
        }

        const { error } = await supabase.from('payroll').insert([payload])
        if (!error) created++
      }

      await logAudit('create', 'payroll', 'batch', `ავტო-გენერაცია: ${created} ჩანაწერი`)
      await fetchPayrollData()
      setShowGenerateModal(false)
      alert(`✅ შეიქმნა ${created} ანგარიშსწორება!`)
    } catch (e: any) {
      alert('შეცდომა: ' + e.message)
    } finally {
      setActionLoading(null)
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
    } catch (e) {
      console.warn('Audit log failed')
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    const symbols: Record<string, string> = { GEL: '₾', USD: '$', EUR: '€', RUB: '₽' }
    return `${amount.toLocaleString('ka-GE', { maximumFractionDigits: 2 })} ${symbols[currency] || currency}`
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: '🕒 ლოდინში',
      approved: '✅ დამტკიცებული',
      paid: '💰 გადახდილი',
      overdue: '⚠️ გადავადებული',
      cancelled: '❌ გაუქმებული'
    }
    return labels[status] || status
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      paid: 'bg-green-500/20 text-green-400 border-green-500/30',
      approved: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      overdue: 'bg-red-500/20 text-red-400 border-red-500/30',
      cancelled: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    }
    return (
      <span className={`${styles[status] || styles.pending} px-2 py-0.5 rounded text-[10px] border font-medium`}>
        {getStatusLabel(status)}
      </span>
    )
  }

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: '💵 ნაღდი',
      bank_transfer: '🏦 ბანკი',
      card: '💳 ბარათი',
      other: '📦 სხვა'
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
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-xs text-gray-400">იტვირთება ანგარიშსწორების მონაცემები...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      
      {/* ═══════════════ HEADER ═══════════════ */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">💸 ანგარიშსწორება (Payroll)</h2>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-xs font-medium transition flex items-center gap-1"
          >
            ➕ ახალი
          </button>
          <button
            onClick={generateFromOrders}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-xs font-medium transition flex items-center gap-1"
            title="შეკვეთებიდან ავტომატური გენერაცია"
          >
            ⚡ ავტო-გენერაცია
          </button>
          <button
            onClick={exportToCSV}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-xs font-medium transition flex items-center gap-1"
          >
            📥 CSV
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
        <StatCard icon="💰" label="სულ ჯამი" value={formatCurrency(stats.netTotal, 'GEL')} color="blue" />
        <StatCard icon="✅" label="გადახდილი" value={formatCurrency(stats.paidAmount, 'GEL')} color="green" />
        <StatCard icon="⏳" label="ლოდინში" value={formatCurrency(stats.pendingAmount, 'GEL')} color="yellow" />
        <StatCard icon="⚠️" label="გადავადებული" value={formatCurrency(stats.overdueAmount, 'GEL')} color="red" />
        <StatCard icon="🎁" label="ბონუსები" value={formatCurrency(stats.bonusTotal, 'GEL')} color="purple" />
        <StatCard icon="⚡" label="ამ თვეში" value={formatCurrency(stats.thisMonthPaid, 'GEL')} color="emerald" />
      </div>

      {/* ═══════════════ FILTERS ═══════════════ */}
      <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-3 flex flex-wrap gap-2 items-center">
        <input
          type="text"
          placeholder="🔍 ძებნა (მძღოლი, ტრეკინგი, შენიშვნა)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-1.5 bg-gray-900/50 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500 flex-1 min-w-[200px]"
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-1.5 bg-gray-900/50 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500">
          <option value="all">ყველა სტატუსი</option>
          <option value="pending">🕒 ლოდინში</option>
          <option value="approved">✅ დამტკიცებული</option>
          <option value="paid">💰 გადახდილი</option>
          <option value="overdue">⚠️ გადავადებული</option>
          <option value="cancelled">❌ გაუქმებული</option>
        </select>
        <select value={selectedDriver} onChange={(e) => setSelectedDriver(e.target.value)}
          className="px-3 py-1.5 bg-gray-900/50 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500">
          <option value="all">ყველა მძღოლი</option>
          {summaries.map(s => <option key={s.driver_id} value={s.driver_id}>{s.driver_name}</option>)}
        </select>
        <select value={dateRange} onChange={(e) => setDateRange(e.target.value as any)}
          className="px-3 py-1.5 bg-gray-900/50 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500">
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

      {/* ═══════════════ DRIVER SUMMARIES ═══════════════ */}
      {summaries.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">👥 მძღოლების შეჯამება</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {summaries.map(summary => (
              <div key={summary.driver_id} className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 border border-gray-700 rounded-xl p-4 hover:border-blue-500/50 transition group">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-white">{summary.driver_name}</h4>
                    <p className="text-[10px] text-gray-500">
                      {summary.driver_type === 'external' ? '🟠 გარე' : '🔵 შიდა'} • {summary.trips_count} რეისი
                    </p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => generateDriverReport(summary)}
                      className="p-1 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded text-[10px]"
                      title="PDF ანგარიში"
                    >
                      📄
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">ჯამური:</span>
                    <span className="font-bold text-white">{formatCurrency(summary.net_total, 'GEL')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">გადახდილი:</span>
                    <span className="text-green-400">{formatCurrency(summary.paid_amount, 'GEL')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">დარჩენილი:</span>
                    <span className="text-yellow-400">{formatCurrency(summary.pending_amount, 'GEL')}</span>
                  </div>
                  {(summary.bonus_total > 0 || summary.penalty_total > 0) && (
                    <div className="pt-1.5 border-t border-gray-700 flex justify-between text-[10px]">
                      <span className="text-purple-400">🎁 +{formatCurrency(summary.bonus_total, 'GEL')}</span>
                      <span className="text-red-400">⚠️ -{formatCurrency(summary.penalty_total, 'GEL')}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════ RECORDS TABLE ═══════════════ */}
      <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead className="text-gray-500 uppercase bg-gray-900/40">
              <tr>
                <th className="px-3 py-3 text-left font-semibold">მძღოლი</th>
                <th className="px-3 py-3 text-left font-semibold">ტრეკინგი</th>
                <th className="px-3 py-3 text-right font-semibold">თანხა</th>
                <th className="px-3 py-3 text-right font-semibold">ბონუსი</th>
                <th className="px-3 py-3 text-right font-semibold">ჯარიმა</th>
                <th className="px-3 py-3 text-right font-semibold">ჯამი</th>
                <th className="px-3 py-3 text-center font-semibold">მეთოდი</th>
                <th className="px-3 py-3 text-center font-semibold">სტატუსი</th>
                <th className="px-3 py-3 text-left font-semibold">პერიოდი</th>
                <th className="px-3 py-3 text-right font-semibold">ქმედება</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/30">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-700/20 transition">
                  <td className="px-3 py-2.5">
                    <div className="text-white font-medium">{record.driver_name}</div>
                    <div className="text-[9px] text-gray-500">
                      {record.driver_type === 'external' ? '🟠 გარე' : '🔵 შიდა'}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-blue-400 font-mono">
                    {record.tracking_code || <span className="text-gray-600">–</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right text-white">
                    {formatCurrency(record.amount, record.currency)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-purple-400">
                    {record.bonus_amount > 0 ? `+${formatCurrency(record.bonus_amount, record.currency)}` : <span className="text-gray-600">–</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right text-red-400">
                    {record.penalty_amount > 0 ? `-${formatCurrency(record.penalty_amount, record.currency)}` : <span className="text-gray-600">–</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold text-white">
                    {formatCurrency(record.net_amount || record.amount, record.currency)}
                  </td>
                  <td className="px-3 py-2.5 text-center text-[10px] text-gray-400">
                    {getPaymentMethodLabel(record.payment_method)}
                  </td>
                  <td className="px-3 py-2.5 text-center">{getStatusBadge(record.status)}</td>
                  <td className="px-3 py-2.5 text-[10px] text-gray-400 whitespace-nowrap">
                    {new Date(record.period_start).toLocaleDateString('ka-GE')} – {new Date(record.period_end).toLocaleDateString('ka-GE')}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => { setDetailsRecord(record); setShowDetailsModal(true) }}
                        className="p-1 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded transition"
                        title="დეტალები"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => { setEditingRecord(record); setShowEditModal(true) }}
                        className="p-1 text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20 rounded transition"
                        title="რედაქტირება"
                      >
                        ✏️
                      </button>
                      {record.status !== 'paid' && record.status !== 'cancelled' && (
                        <button
                          onClick={() => handleMarkAsPaid(record)}
                          disabled={actionLoading === record.id}
                          className="p-1 text-green-400 bg-green-500/10 hover:bg-green-500/20 disabled:opacity-50 rounded transition"
                          title="გადახდილად მონიშვნა"
                        >
                          💰
                        </button>
                      )}
                      {record.status === 'pending' && (
                        <button
                          onClick={() => handleMarkAsOverdue(record)}
                          disabled={actionLoading === record.id}
                          className="p-1 text-red-400 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-50 rounded transition"
                          title="გადავადებულად მონიშვნა"
                        >
                          ⚠️
                        </button>
                      )}
                      {record.status === 'paid' && (
                        <button
                          onClick={() => sendTelegramNotification(record)}
                          disabled={actionLoading === record.id}
                          className="p-1 text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 disabled:opacity-50 rounded transition"
                          title="Telegram შეტყობინება"
                        >
                          💬
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteRecord(record)}
                        disabled={actionLoading === record.id}
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
        {filteredRecords.length === 0 && (
          <div className="p-8 text-center text-gray-500 text-xs">
            {records.length === 0 ? '💸 ანგარიშსწორების ჩანაწერები არ მოიძებნა' : '🔍 ფილტრის შედეგები ცარიელია'}
          </div>
        )}
      </div>

      {/* ═══════════════ MODALS ═══════════════ */}
      {showAddModal && (
        <PayrollFormModal
          mode="add"
          drivers={drivers}
          onSave={handleAddRecord}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {showEditModal && editingRecord && (
        <PayrollFormModal
          mode="edit"
          drivers={drivers}
          record={editingRecord}
          onSave={handleEditRecord}
          onClose={() => { setShowEditModal(false); setEditingRecord(null) }}
        />
      )}

      {showDetailsModal && detailsRecord && (
        <PayrollDetailsModal
          record={detailsRecord}
          onClose={() => { setShowDetailsModal(false); setDetailsRecord(null) }}
          onEdit={() => {
            setEditingRecord(detailsRecord)
            setShowDetailsModal(false)
            setShowEditModal(true)
          }}
          onMarkPaid={() => handleMarkAsPaid(detailsRecord)}
          onSendTelegram={() => sendTelegramNotification(detailsRecord)}
        />
      )}

      {showGenerateModal && (
        <GenerateFromOrdersModal
          drivers={drivers}
          onClose={() => setShowGenerateModal(false)}
          onGenerate={executeGenerateFromOrders}
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
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
    green: 'from-green-500/20 to-green-600/10 border-green-500/30',
    yellow: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30',
    red: 'from-red-500/20 to-red-600/10 border-red-500/30',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
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
// 📝 PAYROLL FORM MODAL (ADD / EDIT)
// ============================================================================

const PayrollFormModal = ({ mode, drivers, record, onSave, onClose }: any) => {
  const [form, setForm] = useState({
    driver_id: record?.driver_id || '',
    driver_name: record?.driver_name || '',
    driver_type: record?.driver_type || 'internal',
    order_id: record?.order_id || '',
    tracking_code: record?.tracking_code || '',
    amount: record?.amount?.toString() || '',
    bonus_amount: record?.bonus_amount?.toString() || '0',
    penalty_amount: record?.penalty_amount?.toString() || '0',
    currency: record?.currency || 'GEL',
    commission_percent: record?.commission_percent?.toString() || '0',
    payment_method: record?.payment_method || 'cash',
    payment_reference: record?.payment_reference || '',
    status: record?.status || 'pending',
    period_start: record?.period_start || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    period_end: record?.period_end || new Date().toISOString().split('T')[0],
    paid_at: record?.paid_at?.split('T')[0] || '',
    notes: record?.notes || '',
  })

  const handleDriverChange = (driverId: string) => {
    const driver = drivers.find((d: Driver) => d.id === driverId)
    if (driver) {
      setForm({
        ...form,
        driver_id: driver.id,
        driver_name: driver.full_name,
        driver_type: driver.type || 'internal',
      })
    }
  }

  const amount = parseFloat(form.amount) || 0
  const bonus = parseFloat(form.bonus_amount) || 0
  const penalty = parseFloat(form.penalty_amount) || 0
  const net = amount + bonus - penalty

  const handleSubmit = () => {
    if (!form.driver_id) return alert('აირჩიეთ მძღოლი')
    if (!form.amount || parseFloat(form.amount) <= 0) return alert('შეიყვანეთ თანხა')
    if (!form.period_start || !form.period_end) return alert('შეავსეთ პერიოდი')

    onSave({
      ...form,
      amount: parseFloat(form.amount),
      bonus_amount: parseFloat(form.bonus_amount) || 0,
      penalty_amount: parseFloat(form.penalty_amount) || 0,
      commission_percent: parseFloat(form.commission_percent) || 0,
      paid_at: form.paid_at ? new Date(form.paid_at).toISOString() : null,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-3xl my-8" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
          <h3 className="text-sm font-bold text-white">
            {mode === 'add' ? '➕ ახალი ანგარიშსწორება' : '✏️ რედაქტირება'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">&times;</button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* მძღოლი */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase">მძღოლი *</label>
              <select
                value={form.driver_id}
                onChange={(e) => handleDriverChange(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500"
              >
                <option value="">აირჩიეთ მძღოლი...</option>
                {drivers.map((d: Driver) => (
                  <option key={d.id} value={d.id}>{d.full_name} {d.type === 'external' ? '(გარე)' : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase">სტატუსი</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500"
              >
                <option value="pending">🕒 ლოდინში</option>
                <option value="approved">✅ დამტკიცებული</option>
                <option value="paid">💰 გადახდილი</option>
                <option value="overdue">⚠️ გადავადებული</option>
                <option value="cancelled">❌ გაუქმებული</option>
              </select>
            </div>
          </div>

          {/* ტრეკინგი */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase">შეკვეთის ID</label>
              <input
                type="text"
                value={form.order_id}
                onChange={(e) => setForm({ ...form, order_id: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500"
                placeholder="არასავალდებულო"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase">ტრეკინგი</label>
              <input
                type="text"
                value={form.tracking_code}
                onChange={(e) => setForm({ ...form, tracking_code: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500"
                placeholder="TRK-..."
              />
            </div>
          </div>

          {/* ფინანსები */}
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-3">💰 ფინანსები</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 mb-1">თანხა *</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-purple-400 mb-1">🎁 ბონუსი</label>
                <input
                  type="number"
                  value={form.bonus_amount}
                  onChange={(e) => setForm({ ...form, bonus_amount: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-purple-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-red-400 mb-1">⚠️ ჯარიმა</label>
                <input
                  type="number"
                  value={form.penalty_amount}
                  onChange={(e) => setForm({ ...form, penalty_amount: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-red-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 mb-1">ვალუტა</label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500"
                >
                  <option value="GEL">🇬🇪 GEL</option>
                  <option value="USD">🇺🇸 USD</option>
                  <option value="EUR">🇪🇺 EUR</option>
                  <option value="RUB">🇷🇺 RUB</option>
                </select>
              </div>
            </div>
            
            {/* ჯამი */}
            <div className="mt-3 pt-3 border-t border-gray-700 flex justify-between items-center">
              <span className="text-xs text-gray-400">კომისია %:</span>
              <input
                type="number"
                value={form.commission_percent}
                onChange={(e) => setForm({ ...form, commission_percent: e.target.value })}
                className="w-20 px-2 py-1 bg-gray-900 border border-gray-700 rounded text-xs text-white outline-none"
              />
            </div>
            <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg flex justify-between items-center">
              <span className="text-xs text-blue-400 font-semibold">💵 ჯამი (თანხა + ბონუსი - ჯარიმა):</span>
              <span className="text-lg font-bold text-white">{net.toLocaleString('ka-GE')} {form.currency}</span>
            </div>
          </div>

          {/* გადახდის დეტალები */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase">გადახდის მეთოდი</label>
              <select
                value={form.payment_method}
                onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500"
              >
                <option value="cash">💵 ნაღდი ფული</option>
                <option value="bank_transfer">🏦 ბანკის გადარიცხვა</option>
                <option value="card">💳 ბარათი</option>
                <option value="other">📦 სხვა</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase">გადახდის ნომერი</label>
              <input
                type="text"
                value={form.payment_reference}
                onChange={(e) => setForm({ ...form, payment_reference: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500"
                placeholder="მაგ: TR-123456"
              />
            </div>
          </div>

          {/* პერიოდი */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase">პერიოდის დასაწყისი *</label>
              <input
                type="date"
                value={form.period_start}
                onChange={(e) => setForm({ ...form, period_start: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase">პერიოდის დასასრული *</label>
              <input
                type="date"
                value={form.period_end}
                onChange={(e) => setForm({ ...form, period_end: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500"
              />
            </div>
            {form.status === 'paid' && (
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase">გადახდის თარიღი</label>
                <input
                  type="date"
                  value={form.paid_at}
                  onChange={(e) => setForm({ ...form, paid_at: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500"
                />
              </div>
            )}
          </div>

          {/* შენიშვნა */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase">შენიშვნა</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500 resize-none"
              placeholder="დამატებითი ინფორმაცია..."
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-700 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-medium text-white">გაუქმება</button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg text-xs font-bold text-white shadow-lg"
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

const PayrollDetailsModal = ({ record, onClose, onEdit, onMarkPaid, onSendTelegram }: any) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
          <h3 className="text-sm font-bold text-white">📋 ანგარიშსწორების დეტალები</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">&times;</button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] text-gray-500 uppercase">მძღოლი</div>
              <div className="text-sm font-bold text-white">{record.driver_name}</div>
              <div className="text-[10px] text-gray-500">{record.driver_type === 'external' ? '🟠 გარე' : '🔵 შიდა'}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 uppercase">სტატუსი</div>
              <div className="mt-1">{getStatusBadge(record.status)}</div>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-3">💰 ფინანსები</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">თანხა:</span>
                <span className="text-white font-medium">{formatCurrency(record.amount, record.currency)}</span>
              </div>
              {record.bonus_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-purple-400">🎁 ბონუსი:</span>
                  <span className="text-purple-400">+{formatCurrency(record.bonus_amount, record.currency)}</span>
                </div>
              )}
              {record.penalty_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-red-400">⚠️ ჯარიმა:</span>
                  <span className="text-red-400">-{formatCurrency(record.penalty_amount, record.currency)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-700">
                <span className="text-white font-bold">ჯამი:</span>
                <span className="text-white font-bold text-lg">{formatCurrency(record.net_amount || record.amount, record.currency)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-[10px] text-gray-500 uppercase">ტრეკინგი</div>
              <div className="text-blue-400 font-mono">{record.tracking_code || '–'}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 uppercase">კომისია</div>
              <div className="text-white">{record.commission_percent}%</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 uppercase">გადახდის მეთოდი</div>
              <div className="text-white">{getPaymentMethodLabel(record.payment_method)}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 uppercase">გადახდის ნომერი</div>
              <div className="text-white">{record.payment_reference || '–'}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 uppercase">პერიოდი</div>
              <div className="text-white">
                {new Date(record.period_start).toLocaleDateString('ka-GE')} – {new Date(record.period_end).toLocaleDateString('ka-GE')}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 uppercase">გადახდის თარიღი</div>
              <div className="text-white">{record.paid_at ? new Date(record.paid_at).toLocaleString('ka-GE') : '–'}</div>
            </div>
          </div>

          {record.notes && (
            <div>
              <div className="text-[10px] text-gray-500 uppercase mb-1">შენიშვნა</div>
              <div className="text-xs text-gray-300 bg-gray-800/50 p-3 rounded-lg">{record.notes}</div>
            </div>
          )}

          <div className="text-[10px] text-gray-500 pt-2 border-t border-gray-700">
            შექმნილია: {new Date(record.created_at).toLocaleString('ka-GE')}
            {record.telegram_notified_at && <span className="ml-3 text-cyan-400">💬 Telegram: {new Date(record.telegram_notified_at).toLocaleString('ka-GE')}</span>}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-700 flex justify-end gap-2">
          <button onClick={onEdit} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-xs font-medium text-white flex items-center gap-1">
            ✏️ რედაქტირება
          </button>
          {record.status !== 'paid' && record.status !== 'cancelled' && (
            <button onClick={onMarkPaid} className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-xs font-medium text-white flex items-center gap-1">
              💰 გადახდა
            </button>
          )}
          {record.status === 'paid' && (
            <button onClick={onSendTelegram} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-xs font-medium text-white flex items-center gap-1">
              💬 Telegram
            </button>
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
// ⚡ GENERATE FROM ORDERS MODAL
// ============================================================================

const GenerateFromOrdersModal = ({ drivers, onClose, onGenerate }: any) => {
  const [selectedOrders, setSelectedOrders] = useState<any[]>([])
  const [commissionPercent, setCommissionPercent] = useState('20')
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDeliveredOrders()
  }, [])

  const loadDeliveredOrders = async () => {
    try {
      const { data } = await supabase
        .from('orders')
        .select('id, tracking_code, price, currency, driver_id, external_driver_id, driver_type, status, delivered_at')
        .in('status', ['delivered'])
        .order('delivered_at', { ascending: false })
        .limit(100)
      
      if (data) setOrders(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const toggleOrder = (order: any) => {
    const exists = selectedOrders.find(o => o.id === order.id)
    if (exists) {
      setSelectedOrders(selectedOrders.filter(o => o.id !== order.id))
    } else {
      setSelectedOrders([...selectedOrders, order])
    }
  }

  const totalCommission = selectedOrders.reduce((sum, o) => {
    return sum + ((parseFloat(o.price || 0) * parseFloat(commissionPercent)) / 100)
  }, 0)

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-white">⚡ ავტო-გენერაცია შეკვეთებიდან</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">აირჩიეთ მიწოდებული შეკვეთები და გამოთვალეთ ანაზღაურება</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">&times;</button>
        </div>

        <div className="p-4 bg-indigo-500/10 border-b border-indigo-500/30 flex items-center gap-4">
          <label className="text-xs text-white font-medium">კომისია %:</label>
          <input
            type="number"
            value={commissionPercent}
            onChange={(e) => setCommissionPercent(e.target.value)}
            className="w-20 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-indigo-500"
          />
          <div className="ml-auto text-xs text-gray-300">
            არჩეული: <span className="font-bold text-white">{selectedOrders.length}</span> • 
            ჯამი: <span className="font-bold text-green-400">{totalCommission.toLocaleString('ka-GE')} GEL</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-400 text-xs">იტვირთება...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-xs">მიწოდებული შეკვეთები არ მოიძებნა</div>
          ) : (
            <div className="space-y-2">
              {orders.map(order => {
                const driverId = order.driver_type === 'external' ? order.external_driver_id : order.driver_id
                const driver = drivers.find((d: Driver) => d.id === driverId)
                const commission = (parseFloat(order.price || 0) * parseFloat(commissionPercent)) / 100
                const isSelected = selectedOrders.find(o => o.id === order.id)

                return (
                  <div
                    key={order.id}
                    onClick={() => toggleOrder(order)}
                    className={`p-3 rounded-lg border cursor-pointer transition ${
                      isSelected 
                        ? 'bg-indigo-500/20 border-indigo-500' 
                        : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-xs font-bold text-white">{order.tracking_code}</div>
                        <div className="text-[10px] text-gray-400">
                          {driver?.full_name || 'უცნობი მძღოლი'} • {order.price} {order.currency}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-green-400">{commission.toLocaleString('ka-GE')} GEL</div>
                        <div className="text-[10px] text-gray-500">
                          {order.delivered_at ? new Date(order.delivered_at).toLocaleDateString('ka-GE') : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-700 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-medium text-white">გაუქმება</button>
          <button
            onClick={() => onGenerate(selectedOrders, parseFloat(commissionPercent))}
            disabled={selectedOrders.length === 0}
            className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 rounded-lg text-xs font-bold text-white shadow-lg"
          >
            ⚡ გენერაცია ({selectedOrders.length})
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
    paid: 'bg-green-500/20 text-green-400 border-green-500/30',
    approved: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    overdue: 'bg-red-500/20 text-red-400 border-red-500/30',
    cancelled: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  }
  const labels: Record<string, string> = {
    pending: '🕒 ლოდინში', approved: '✅ დამტკიცებული', paid: '💰 გადახდილი',
    overdue: '⚠️ გადავადებული', cancelled: '❌ გაუქმებული'
  }
  return (
    <span className={`${styles[status] || styles.pending} px-2 py-0.5 rounded text-[10px] border font-medium`}>
      {labels[status] || status}
    </span>
  )
}

const getPaymentMethodLabel = (method: string) => {
  const labels: Record<string, string> = {
    cash: '💵 ნაღდი', bank_transfer: '🏦 ბანკი', card: '💳 ბარათი', other: '📦 სხვა'
  }
  return labels[method] || method
}