'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

interface PayrollRecord {
  id: string
  driver_id: string
  driver_name: string
  order_id: string | null
  tracking_code: string | null
  amount: number
  currency: string
  commission_percent: number
  status: 'pending' | 'paid' | 'overdue'
  period_start: string
  period_end: string
  paid_at: string | null
  notes: string | null
  created_at: string
}

interface DriverSummary {
  driver_id: string
  driver_name: string
  total_earnings: number
  paid_amount: number
  pending_amount: number
  trips_count: number
}

export default function PayrollTab() {
  const [records, setRecords] = useState<PayrollRecord[]>([])
  const [summaries, setSummaries] = useState<DriverSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedDriver, setSelectedDriver] = useState<string>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // 🔄 დატვირთვა კომპონენტის ინიციალიზაციისას
  useEffect(() => {
    fetchPayrollData()
  }, [])

  // 📡 რეალური მონაცემების წამოღება Supabase-დან
  const fetchPayrollData = async () => {
    setLoading(true)
    try {
      const { data: payrollData, error } = await supabase
        .from('payroll')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        console.warn('Payroll fetch error (using demo):', error.message)
        // დემო მონაცემები თუ ბაზა ცარიელია ან შეცდომა
        const demo = generateDemoPayroll()
        setRecords(demo)
        calculateSummaries(demo)
      } else if (payrollData && payrollData.length > 0) {
        setRecords(payrollData as PayrollRecord[])
        calculateSummaries(payrollData as PayrollRecord[])
      } else {
        // ცარიელი ბაზა → დემო
        const demo = generateDemoPayroll()
        setRecords(demo)
        calculateSummaries(demo)
      }
    } catch (e: any) {
      console.error('Failed to fetch payroll:', e)
      const demo = generateDemoPayroll()
      setRecords(demo)
      calculateSummaries(demo)
    } finally {
      setLoading(false)
    }
  }

  // 🎭 დემო მონაცემები დეველოპმენტისთვის
  const generateDemoPayroll = (): PayrollRecord[] => [
    { id: '1', driver_id: 'drv_001', driver_name: 'ნიკა გიორგაძე', order_id: 'ord_101', tracking_code: 'TRK-2024-001', amount: 150, currency: 'GEL', commission_percent: 20, status: 'paid', period_start: '2024-01-01', period_end: '2024-01-07', paid_at: '2024-01-08', notes: 'კვირეული ანგარიშსწორება', created_at: '2024-01-08T10:00:00Z' },
    { id: '2', driver_id: 'drv_001', driver_name: 'ნიკა გიორგაძე', order_id: 'ord_102', tracking_code: 'TRK-2024-002', amount: 200, currency: 'GEL', commission_percent: 20, status: 'pending', period_start: '2024-01-08', period_end: '2024-01-14', paid_at: null, notes: null, created_at: '2024-01-15T10:00:00Z' },
    { id: '3', driver_id: 'drv_002', driver_name: 'ლევან მამულაშვილი', order_id: 'ord_103', tracking_code: 'TRK-2024-003', amount: 180, currency: 'GEL', commission_percent: 20, status: 'paid', period_start: '2024-01-01', period_end: '2024-01-07', paid_at: '2024-01-08', notes: 'კვირეული ანგარიშსწორება', created_at: '2024-01-08T10:00:00Z' },
    { id: '4', driver_id: 'drv_002', driver_name: 'ლევან მამულაშვილი', order_id: 'ord_104', tracking_code: 'TRK-2024-004', amount: 220, currency: 'GEL', commission_percent: 20, status: 'pending', period_start: '2024-01-08', period_end: '2024-01-14', paid_at: null, notes: null, created_at: '2024-01-15T10:00:00Z' },
    { id: '5', driver_id: 'drv_003', driver_name: 'გიორგი კობერიძე', order_id: 'ord_105', tracking_code: 'TRK-2024-005', amount: 175, currency: 'GEL', commission_percent: 20, status: 'overdue', period_start: '2023-12-25', period_end: '2023-12-31', paid_at: null, notes: 'გადახდა გადავადებულია', created_at: '2024-01-02T10:00:00Z' },
  ]

  // 📊 ჯამების გამოთვლა მძღოლების მიხედვით
  const calculateSummaries = (data: PayrollRecord[]) => {
    const summaryMap = new Map<string, DriverSummary>()
    
    data.forEach(record => {
      const existing = summaryMap.get(record.driver_id)
      if (existing) {
        existing.total_earnings += record.amount
        if (record.status === 'paid') {
          existing.paid_amount += record.amount
        } else {
          existing.pending_amount += record.amount
        }
        existing.trips_count += 1
      } else {
        summaryMap.set(record.driver_id, {
          driver_id: record.driver_id,
          driver_name: record.driver_name,
          total_earnings: record.amount,
          paid_amount: record.status === 'paid' ? record.amount : 0,
          pending_amount: record.status !== 'paid' ? record.amount : 0,
          trips_count: 1
        })
      }
    })
    
    setSummaries(Array.from(summaryMap.values()))
  }

  // 🔍 ფილტრაცია
  const filteredRecords = records.filter(record => {
    const matchesFilter = filter === 'all' || record.status === filter
    const matchesDriver = selectedDriver === 'all' || record.driver_id === selectedDriver
    const matchesSearch = search === '' || 
      record.driver_name.toLowerCase().includes(search.toLowerCase()) ||
      record.tracking_code?.toLowerCase().includes(search.toLowerCase()) ||
      record.notes?.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesDriver && matchesSearch
  })

  // ✅ გადახდის მონიშვნა + აუდიტის ლოგი
  const handleMarkAsPaid = async (recordId: string) => {
    const record = records.find(r => r.id === recordId)
    if (!record) return

    setActionLoading(recordId)
    
    try {
      // 1. განახლება ბაზაში
      const { error: updateError } = await supabase
        .from('payroll')
        .update({ 
          status: 'paid', 
          paid_at: new Date().toISOString() 
        })
        .eq('id', recordId)
      
      if (updateError) throw updateError

      // 2. აუდიტის ლოგის ჩაწერა
      const { error: auditError } = await supabase
        .from('audit_logs')
        .insert({
          user_email: (await supabase.auth.getUser()).data.user?.email || 'system',
          action: 'update',
          table_name: 'payroll',
          record_id: recordId,
          details: `ანგარიშსწორება #${record.tracking_code || recordId} მონიშნულია როგორც გადახდილი. თანხა: ${record.amount} ${record.currency}`
        })
      
      if (auditError) {
        console.warn('Audit log failed:', auditError.message)
        // არ ვაბლოკირებთ მთავარ ოპერაციას
      }

      // 3. განახლება UI-ში
      await fetchPayrollData()
      
    } catch (e: any) {
      console.error('Failed to mark as paid:', e)
      alert('შეცდომა გადახდის მონიშვნისას: ' + e.message)
    } finally {
      setActionLoading(null)
    }
  }

  // 📥 CSV ექსპორტი
  const exportToCSV = () => {
    const headers = ['მძღოლი', 'ტრეკინგი', 'თანხა', 'ვალუტა', 'კომისია', 'სტატუსი', 'პერიოდი', 'გადახდის თარიღი', 'შენიშვნა']
    const rows = filteredRecords.map(r => [
      r.driver_name,
      r.tracking_code || '-',
      r.amount.toString(),
      r.currency,
      `${r.commission_percent}%`,
      r.status,
      `${r.period_start} - ${r.period_end}`,
      r.paid_at || '-',
      r.notes || '-'
    ])
    
    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payroll-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // 💱 ვალუტის ფორმატირება
  const formatCurrency = (amount: number, currency: string) => {
    const symbols: Record<string, string> = { GEL: '₾', USD: '$', EUR: '€' }
    return `${symbols[currency] || currency} ${amount.toLocaleString('ka-GE')}`
  }

  // 🎨 სტატუსის ბეჯი
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <span className="bg-green-500/20 text-green-400 border-green-500/30 px-2 py-0.5 rounded text-[10px] border">✅ გადახდილი</span>
      case 'pending': return <span className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 px-2 py-0.5 rounded text-[10px] border">🕒 ლოდინში</span>
      case 'overdue': return <span className="bg-red-500/20 text-red-400 border-red-500/30 px-2 py-0.5 rounded text-[10px] border">⚠️ გადავადებული</span>
      default: return <span className="bg-gray-500/20 text-gray-400 border-gray-500/30 px-2 py-0.5 rounded text-[10px] border">{status}</span>
    }
  }

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
    <div className="space-y-6">
      {/* 🔍 ფილტრები და ექსპორტი */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">💸 ანგარიშსწორება (Payroll)</h2>
        
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="🔍 ძებნა..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500 w-40"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500"
          >
            <option value="all">ყველა სტატუსი</option>
            <option value="pending">🕒 ლოდინში</option>
            <option value="paid">✅ გადახდილი</option>
            <option value="overdue">⚠️ გადავადებული</option>
          </select>
          <select
            value={selectedDriver}
            onChange={(e) => setSelectedDriver(e.target.value)}
            className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500"
          >
            <option value="all">ყველა მძღოლი</option>
            {[...new Set(records.map(r => r.driver_id))].map(driverId => {
              const driver = records.find(r => r.driver_id === driverId)
              return <option key={driverId} value={driverId}>{driver?.driver_name}</option>
            })}
          </select>
          <button
            onClick={exportToCSV}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-xs font-medium transition flex items-center gap-1"
          >
            📥 CSV
          </button>
          <button
            onClick={fetchPayrollData}
            disabled={loading}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-xs font-medium transition"
          >
            🔄 განახლება
          </button>
        </div>
      </div>

      {/* 📊 მძღოლების შეჯამება */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {summaries.map(summary => (
          <div key={summary.driver_id} className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
            <div className="flex justify-between items-start mb-3">
              <h4 className="text-sm font-bold text-white">{summary.driver_name}</h4>
              <span className="text-[10px] text-gray-400">{summary.trips_count} რეისი</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">ჯამური:</span>
                <span className="font-bold text-white">{formatCurrency(summary.total_earnings, 'GEL')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">გადახდილი:</span>
                <span className="text-green-400">{formatCurrency(summary.paid_amount, 'GEL')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">ლოდინში:</span>
                <span className="text-yellow-400">{formatCurrency(summary.pending_amount, 'GEL')}</span>
              </div>
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
                <th className="px-4 py-3 text-left">მძღოლი</th>
                <th className="px-4 py-3 text-left">ტრეკინგი</th>
                <th className="px-4 py-3 text-right">თანხა</th>
                <th className="px-4 py-3 text-center">კომისია</th>
                <th className="px-4 py-3 text-center">სტატუსი</th>
                <th className="px-4 py-3 text-left">პერიოდი</th>
                <th className="px-4 py-3 text-right">ქმედება</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-700/20 transition">
                  <td className="px-4 py-3 text-[10px] text-white">{record.driver_name}</td>
                  <td className="px-4 py-3 text-[10px] text-blue-400 font-mono">{record.tracking_code || '–'}</td>
                  <td className="px-4 py-3 text-right font-medium text-white">{formatCurrency(record.amount, record.currency)}</td>
                  <td className="px-4 py-3 text-center text-[10px] text-gray-400">{record.commission_percent}%</td>
                  <td className="px-4 py-3 text-center">{getStatusBadge(record.status)}</td>
                  <td className="px-4 py-3 text-[10px] text-gray-400">
                    {new Date(record.period_start).toLocaleDateString('ka-GE')} – {new Date(record.period_end).toLocaleDateString('ka-GE')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {record.status !== 'paid' ? (
                      <button
                        onClick={() => handleMarkAsPaid(record.id)}
                        disabled={actionLoading === record.id}
                        className="px-2 py-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded text-[10px] text-white transition flex items-center gap-1"
                      >
                        {actionLoading === record.id ? (
                          <><div className="w-2 h-2 border border-white/50 border-t-white rounded-full animate-spin"></div> ინახება...</>
                        ) : (
                          <>✅ გადახდა</>
                        )}
                      </button>
                    ) : (
                      <span className="text-[10px] text-green-400">✓ გადახდილი</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredRecords.length === 0 && (
          <div className="p-8 text-center text-gray-500 text-xs">
            {records.length === 0 ? 'ანგარიშსწორების ჩანაწერები არ მოიძებნა' : 'ფილტრის შედეგები ცარიელია'}
          </div>
        )}
      </div>

      {/* ℹ️ ინფო ბლოკი */}
      <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4 text-[10px] text-gray-400">
        <strong>📌 შენიშვნა:</strong> ანგარიშსწორების ჩანაწერები ინახება Supabase-ში. 
        გადახდის მონიშვნა აფიქსირებს თარიღს, ცვლის სტატუსს და იწერება აუდიტის ლოგში.
      </div>
    </div>
  )
}