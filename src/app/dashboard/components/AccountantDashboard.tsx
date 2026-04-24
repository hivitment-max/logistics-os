'use client'

import { useState, useEffect, FormEvent } from 'react'
import { supabase } from '@/lib/supabase/client'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area 
} from 'recharts'

// ============================================================================
// 🧩 Types & Helpers
// ============================================================================
type TabType = 'overview' | 'invoices' | 'expenses' | 'payroll' | 'reports' | 'settings'
type ModalType = 'invoice' | 'expense' | 'payroll' | null
type Currency = 'GEL' | 'USD' | 'EUR'

// ============================================================================
// 💰 ACCOUNTANT DASHBOARD
// ============================================================================
export default function AccountantDashboard({ user, setNotification }: { 
  user: any, 
  setNotification: (n: { type: 'success' | 'error'; message: string }) => void 
}) {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [loading, setLoading] = useState(true)
  const [currency, setCurrency] = useState<Currency>('GEL')
  
  // Data State
  const [financialData, setFinancialData] = useState<Record<string, number>>({})
  const [invoices, setInvoices] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [payroll, setPayroll] = useState<any[]>([])
  const [exchangeRates, setExchangeRates] = useState({ EUR: 2.95, USD: 2.70 })
  
  // UI State
  const [modalType, setModalType] = useState<ModalType>(null)
  const [form, setForm] = useState<Record<string, any>>({})

  // 📊 Fetch Data
  useEffect(() => {
    fetchFinancialData()
  }, [currency])

  const fetchFinancialData = async () => {
    setLoading(true)
    try {
      const { data: orders } = await supabase
        .from('orders')
        .select('price, currency, status, created_at, tracking_code, cargo_weight_kg')
        .order('created_at', { ascending: true })

      const mockExpenses = [
        { id: 'EXP-001', category: 'საწვავი', description: 'დიზელის შევსება - Isuzu NQR', amount: 450, currency: 'GEL', date: '2024-05-18', reconciled: true },
        { id: 'EXP-002', category: 'ტექმომსახურება', description: 'ზეთისა და ფილტრის შეცვლა', amount: 280, currency: 'GEL', date: '2024-05-15', reconciled: true },
        { id: 'EXP-003', category: 'ხელფასები', description: 'მძღოლების ხელფასი - მაისი', amount: 3200, currency: 'GEL', date: '2024-05-01', reconciled: false },
        { id: 'EXP-004', category: 'დაზღვევა', description: 'ავტოპარკის დაზღვევა', amount: 850, currency: 'EUR', date: '2024-05-10', reconciled: true },
      ]

      const generatedInvoices = (orders || []).map((order: any, idx: number) => {
        const vatRate = 0.18
        const baseAmount = order.price || 0
        const vatAmount = baseAmount * vatRate
        
        return {
          id: `INV-${String(idx + 1).padStart(4, '0')}`,
          type: order.status === 'delivered' ? 'Tax Invoice' : 'Proforma Invoice',
          client: `კლიენტი #${idx + 1}`,
          tracking_code: order.tracking_code,
          baseAmount,
          vatRate: vatRate * 100,
          vatAmount,
          total: baseAmount + vatAmount,
          currency: order.currency || 'GEL',
          status: order.status === 'delivered' ? 'გადახდილი' : 'ლოდინში',
          dueDate: new Date(new Date(order.created_at).getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          created: order.created_at,
          description: `ტვირთი: ${order.cargo_description}, წონა: ${order.cargo_weight_kg}kg`
        }
      })

      const mockPayroll = [
        { id: 'PAY-001', driver: 'ნიკა გიორგაძე', baseSalary: 1500, commission: 320, kpiBonus: 150, penalty: 0, total: 1970, currency: 'GEL', month: '2024-05', status: 'გადახდილი' },
        { id: 'PAY-002', driver: 'ლუკა მამულაშვილი', baseSalary: 1500, commission: 280, kpiBonus: 100, penalty: 50, total: 1830, currency: 'GEL', month: '2024-05', status: 'ლოდინში' },
      ]

      const totalRevenue = generatedInvoices.filter((i: any) => i.status === 'გადახდილი').reduce((sum: number, i: any) => sum + i.total, 0)
      const totalExpensesVal = mockExpenses.reduce((sum, e) => sum + (e.currency === currency ? e.amount : e.amount * (exchangeRates as any)[e.currency]), 0)
      const vatCollected = generatedInvoices.filter((i: any) => i.status === 'გადახდილი').reduce((sum: number, i: any) => sum + i.vatAmount, 0)

      setFinancialData({ totalRevenue, totalExpenses: totalExpensesVal, vatCollected, netProfit: totalRevenue - totalExpensesVal })
      setInvoices(generatedInvoices.reverse())
      setExpenses(mockExpenses)
      setPayroll(mockPayroll)
      
    } catch (err: any) {
      console.error('Financial fetch error:', err.message)
      setNotification({ type: 'error', message: `❌ ${err.message}` })
    } finally {
      setLoading(false)
    }
  }

  // 🧾 Handlers
  const handleSaveInvoice = async (e: FormEvent) => {
    e.preventDefault()
    const vatRate = 0.18
    const baseAmount = parseFloat(form.baseAmount) || 0
    const newInvoice = {
      id: form.id || `INV-${String(invoices.length + 1).padStart(4, '0')}`,
      type: form.type || 'Tax Invoice',
      client: form.client,
      tracking_code: form.tracking_code,
      baseAmount,
      vatRate: vatRate * 100,
      vatAmount: baseAmount * vatRate,
      total: baseAmount * (1 + vatRate),
      currency: form.currency || 'GEL',
      status: form.status || 'ლოდინში',
      dueDate: form.dueDate,
      created: new Date().toISOString(),
      description: form.description
    }
    
    if (form.id) {
      setInvoices(prev => prev.map(inv => inv.id === form.id ? newInvoice : inv))
      setNotification({ type: 'success', message: '✅ ინვოისი განახლდა!' })
    } else {
      setInvoices(prev => [newInvoice, ...prev])
      setNotification({ type: 'success', message: '✅ ინვოისი შეიქმნა!' })
    }
    setModalType(null)
    setForm({})
  }

  const toggleReconciled = (id: string) => {
    setExpenses(prev => prev.map(exp => exp.id === id ? { ...exp, reconciled: !exp.reconciled } : exp))
    setNotification({ type: 'success', message: '✅ რეკონცილიაცია განახლდა!' })
  }

  const handlePayrollAction = (id: string, action: 'pay' | 'payslip') => {
    if (action === 'pay') {
      setPayroll(prev => prev.map(p => p.id === id ? { ...p, status: 'გადახდილი' } : p))
      setNotification({ type: 'success', message: '✅ ხელფასი გადახდილია!' })
    } else {
      const payslip = payroll.find(p => p.id === id)
      alert(`🧾 PAYSLIP\n\nმძღოლი: ${payslip?.driver}\nბაზა: ${payslip?.baseSalary} GEL\nკომისია: +${payslip?.commission}\nKPI: +${payslip?.kpiBonus}\nჯარიმა: -${payslip?.penalty}\n\nსულ: ${payslip?.total} GEL`)
    }
  }

  const exportData = (type: 'excel' | 'pdf', dataType: string) => {
    setNotification({ type: 'success', message: `📥 ${type.toUpperCase()} ექსპორტი იწყება...` })
    setTimeout(() => setNotification({ type: 'success', message: '✅ ფაილი ჩამოიტვირთა!' }), 1500)
  }

  const convertAmount = (amount: number, from: string) => {
    if (from === currency) return amount
    if (from === 'GEL') return amount / (exchangeRates as any)[currency]
    return amount * (exchangeRates as any)[from] / (exchangeRates as any)[currency]
  }

  // 🧩 Helper Component: StatCard
  const StatCard = ({ title, value, sub, color, icon }: any) => (
    <div className={`${color} p-4 rounded-xl shadow-lg`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-white/80">{title}</p>
          <p className="text-xl font-bold text-white mt-1">{value}</p>
          <p className="text-xs text-white/60 mt-1">{sub}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  )

  if (loading) return <div className="text-center py-20 text-gray-400">🔄 ფინანსური მონაცემები იტვირთება...</div>

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 🏠 Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">💰 ფინანსური პანელი</h2>
          <p className="text-gray-400">ბუღალტერია, Payroll & ანგარიშგება</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg outline-none text-sm">
            <option value="GEL">🇬🇪 GEL</option>
            <option value="USD">🇺🇸 USD</option>
            <option value="EUR">🇪🇺 EUR</option>
          </select>
          <button onClick={() => setModalType('invoice')} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors shadow-lg shadow-blue-500/20">➕ ახალი დოკუმენტი</button>
        </div>
      </div>

      {/* 📊 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="💵 შემოსავალი" value={`${currency} ${(financialData.totalRevenue || 0).toLocaleString()}`} sub="გადახდილი ინვოისები" color="bg-emerald-600" icon="📈" />
        <StatCard title="⏳ ლოდინში" value={`${currency} ${(invoices.filter(i => i.status === 'ლოდინში').reduce((sum, i) => sum + i.total, 0)).toLocaleString()}`} sub="გადასახდელი" color="bg-blue-600" icon="⏰" />
        <StatCard title="📉 ხარჯები" value={`${currency} ${(financialData.totalExpenses || 0).toLocaleString()}`} sub="ოპერაციული" color="bg-orange-600" icon="💸" />
        <StatCard title="🧾 VAT (18%)" value={`${currency} ${(financialData.vatCollected || 0).toLocaleString()}`} sub="ასაკრეფი" color="bg-purple-600" icon="🏛️" />
      </div>

      {/* 📑 Tabs */}
      <div className="flex border-b border-gray-700 gap-4 overflow-x-auto pb-2">
        {[
          { id: 'overview', label: '📊 მიმოხილვა' },
          { id: 'invoices', label: '🧾 ინვოისები' },
          { id: 'expenses', label: '💸 ხარჯები & ბანკი' },
          { id: 'payroll', label: '👥 Payroll' },
          { id: 'reports', label: '📈 ანგარიშგება' },
          { id: 'settings', label: '⚙️ პარამეტრები' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as TabType)} className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* 📊 OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">📈 ფულადი ნაკადები (თვიური)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={[{ month: 'Jan', income: 4000, expenses: 2400 }, { month: 'Feb', income: 3000, expenses: 1398 }, { month: 'Mar', income: 2000, expenses: 9800 }, { month: 'Apr', income: 2780, expenses: 3908 }, { month: 'May', income: 1890, expenses: 4800 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="income" name="შემოსავალი" stroke="#10b981" fill="#10b981/20" strokeWidth={2} />
                <Area type="monotone" dataKey="expenses" name="ხარჯები" stroke="#ef4444" fill="#ef4444/20" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4">
            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
              <h4 className="font-semibold mb-3">💱 ვალუტის კურსები</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>🇪🇺 1 EUR</span><span className="font-mono">= {exchangeRates.EUR} GEL</span></div>
                <div className="flex justify-between"><span>🇺🇸 1 USD</span><span className="font-mono">= {exchangeRates.USD} GEL</span></div>
              </div>
            </div>
            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
              <h4 className="font-semibold mb-3">⚡ სწრაფი მოქმედებები</h4>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => { setForm({ type: 'Tax Invoice' }); setModalType('invoice') }} className="px-3 py-2 bg-blue-600/20 text-blue-400 rounded-lg text-sm hover:bg-blue-600/30 transition">🧾 Tax Invoice</button>
                <button onClick={() => { setForm({ type: 'Proforma Invoice' }); setModalType('invoice') }} className="px-3 py-2 bg-purple-600/20 text-purple-400 rounded-lg text-sm hover:bg-purple-600/30 transition">📄 Proforma</button>
                <button onClick={() => { setForm({ type: 'Credit Note' }); setModalType('invoice') }} className="px-3 py-2 bg-green-600/20 text-green-400 rounded-lg text-sm hover:bg-green-600/30 transition">🔄 Credit Note</button>
                <button onClick={() => exportData('excel', 'invoices')} className="px-3 py-2 bg-gray-600/20 text-gray-300 rounded-lg text-sm hover:bg-gray-600/30 transition">📥 Excel Export</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🧾 INVOICES TAB */}
      {activeTab === 'invoices' && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-700 flex justify-between items-center flex-wrap gap-2">
            <div className="flex gap-2">
              <input placeholder="🔍 ძებნა..." className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-sm outline-none" />
              <select className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-sm outline-none">
                <option>ყველა ტიპი</option>
                <option>Tax Invoice</option>
                <option>Proforma</option>
                <option>Credit Note</option>
                <option>Debit Note</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={() => exportData('pdf', 'invoices')} className="px-3 py-1.5 bg-red-600/20 text-red-400 rounded-lg text-sm hover:bg-red-600/30">📄 PDF</button>
              <button onClick={() => exportData('excel', 'invoices')} className="px-3 py-1.5 bg-green-600/20 text-green-400 rounded-lg text-sm hover:bg-green-600/30">📊 Excel</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-700/50 text-gray-400 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">დოკუმენტი</th>
                  <th className="px-4 py-3">ტიპი</th>
                  <th className="px-4 py-3">კლიენტი/ტრეკინგი</th>
                  <th className="px-4 py-3">თანხა + VAT</th>
                  <th className="px-4 py-3">ვალუტა</th>
                  <th className="px-4 py-3">ვადის თარიღი</th>
                  <th className="px-4 py-3">სტატუსი</th>
                  <th className="px-4 py-3">მოქმედება</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-gray-700 hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-blue-400">{inv.id}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs ${inv.type === 'Tax Invoice' ? 'bg-blue-600/20 text-blue-400' : inv.type === 'Proforma Invoice' ? 'bg-purple-600/20 text-purple-400' : 'bg-gray-600/20 text-gray-400'}`}>{inv.type}</span></td>
                    <td className="px-4 py-3">
                      <div className="text-gray-300">{inv.client}</div>
                      <div className="text-xs text-gray-500">{inv.tracking_code}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold">{currency} {(convertAmount(inv.total, inv.currency)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div className="text-xs text-gray-500">VAT ({inv.vatRate}%): {currency} {(convertAmount(inv.vatAmount, inv.currency)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{inv.currency}</td>
                    <td className="px-4 py-3 text-gray-300">{inv.dueDate}</td>
                    <td className="px-4 py-3">
                      <select value={inv.status} onChange={(e) => {
                        setInvoices(prev => prev.map(i => i.id === inv.id ? { ...i, status: e.target.value } : i))
                        setNotification({ type: 'success', message: '✅ სტატუსი განახლდა!' })
                      }} className={`px-2 py-1 rounded text-xs font-medium border-none outline-none cursor-pointer ${inv.status === 'გადახდილი' ? 'bg-green-600/20 text-green-400' : 'bg-yellow-600/20 text-yellow-400'}`}>
                        <option value="ლოდინში">ლოდინში</option>
                        <option value="გადახდილი">გადახდილი</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      <button onClick={() => { setForm(inv); setModalType('invoice') }} className="text-blue-400 hover:underline text-xs">✏️</button>
                      <button className="text-gray-400 hover:text-white text-xs">🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 💸 EXPENSES & BANK TAB */}
      {activeTab === 'expenses' && (
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h3 className="font-semibold">💸 ოპერაციული ხარჯები</h3>
              <button onClick={() => { setForm({}); setModalType('expense') }} className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 rounded-lg text-sm">➕ ხარჯის დამატება</button>
            </div>
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-700/50 text-gray-400 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">კოდი</th>
                  <th className="px-4 py-3">კატეგორია</th>
                  <th className="px-4 py-3">აღწერა</th>
                  <th className="px-4 py-3">თანხა</th>
                  <th className="px-4 py-3">ვალუტა</th>
                  <th className="px-4 py-3">თარიღი</th>
                  <th className="px-4 py-3">რეკონცილიაცია</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr key={exp.id} className="border-b border-gray-700 hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-orange-400">{exp.id}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-gray-700 rounded text-xs">{exp.category}</span></td>
                    <td className="px-4 py-3 text-gray-300">{exp.description}</td>
                    <td className="px-4 py-3 font-bold text-red-400">-{currency} {convertAmount(exp.amount, exp.currency).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-gray-300">{exp.currency}</td>
                    <td className="px-4 py-3 text-gray-300">{exp.date}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleReconciled(exp.id)} className={`px-3 py-1 rounded text-xs font-medium transition ${exp.reconciled ? 'bg-green-600/20 text-green-400' : 'bg-gray-600/20 text-gray-400 hover:bg-green-600/30'}`}>
                        {exp.reconciled ? '✅ შეთანხმებული' : '⏳ შეუსაბამო'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 👥 PAYROLL TAB */}
      {activeTab === 'payroll' && (
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h3 className="font-semibold">👥 მძღოლების Payroll - მაისი 2024</h3>
              <button className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-sm">📥 ყველას Payslip</button>
            </div>
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-700/50 text-gray-400 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">მძღოლი</th>
                  <th className="px-4 py-3">ბაზა</th>
                  <th className="px-4 py-3">კომისია</th>
                  <th className="px-4 py-3">KPI ბონუსი</th>
                  <th className="px-4 py-3">ჯარიმა</th>
                  <th className="px-4 py-3">სულ</th>
                  <th className="px-4 py-3">სტატუსი</th>
                  <th className="px-4 py-3">მოქმედება</th>
                </tr>
              </thead>
              <tbody>
                {payroll.map((p) => (
                  <tr key={p.id} className="border-b border-gray-700 hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{p.driver}</td>
                    <td className="px-4 py-3">{p.baseSalary} {p.currency}</td>
                    <td className="px-4 py-3 text-green-400">+{p.commission}</td>
                    <td className="px-4 py-3 text-green-400">+{p.kpiBonus}</td>
                    <td className="px-4 py-3 text-red-400">-{p.penalty}</td>
                    <td className="px-4 py-3 font-bold">{p.total} {p.currency}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${p.status === 'გადახდილი' ? 'bg-green-600/20 text-green-400' : 'bg-yellow-600/20 text-yellow-400'}`}>{p.status}</span>
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      {p.status !== 'გადახდილი' && (
                        <button onClick={() => handlePayrollAction(p.id, 'pay')} className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs">💳 გადახდა</button>
                      )}
                      <button onClick={() => handlePayrollAction(p.id, 'payslip')} className="px-2 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs">🧾 Payslip</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 📈 REPORTS TAB */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">📊 P&L მარშრუტის მიხედვით</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={[{ route: 'თბილისი→ბათუმი', profit: 800 }, { route: 'ფოთი→სენაკი', profit: 450 }, { route: 'ქუთაისი→თბილისი', profit: -120 }, { route: 'ბულგარეთი→ფოთი', profit: 320 }]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="route" stroke="#9ca3af" angle={-45} textAnchor="end" height={60} />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                  <Bar dataKey="profit" name="მოგება" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">🧾 VAT ანგარიშგება</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-700"><span>ასაკრეფი VAT (გადახდილი ინვოისები)</span><span className="font-bold text-green-400">+{currency} {(financialData.vatCollected || 0).toLocaleString()}</span></div>
                <div className="flex justify-between py-2 border-b border-gray-700"><span>დასაქვითავი VAT (ხარჯები)</span><span className="font-bold text-red-400">-{currency} {(financialData.totalExpenses! * 0.18).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                <div className="flex justify-between py-3 bg-gray-700/50 rounded-lg px-3"><span className="font-semibold">გადასახდელი თანხა</span><span className="font-bold text-lg">{currency} {Math.max(0, (financialData.vatCollected || 0) - (financialData.totalExpenses! * 0.18)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
              </div>
              <button onClick={() => exportData('pdf', 'vat')} className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium">📄 VAT Report PDF</button>
            </div>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">📥 მონაცემების ექსპორტი</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'ყველა ინვოისი', type: 'invoices' },
                { label: 'ხარჯები', type: 'expenses' },
                { label: 'Payroll', type: 'payroll' },
                { label: 'სრული ანგარიშგება', type: 'full' }
              ].map((item) => (
                <div key={item.type} className="space-y-2">
                  <p className="text-sm text-gray-400">{item.label}</p>
                  <div className="flex gap-2">
                    <button onClick={() => exportData('excel', item.type as any)} className="flex-1 py-2 bg-green-600/20 text-green-400 rounded-lg text-sm hover:bg-green-600/30 transition">📊 Excel</button>
                    <button onClick={() => exportData('pdf', item.type as any)} className="flex-1 py-2 bg-red-600/20 text-red-400 rounded-lg text-sm hover:bg-red-600/30 transition">📄 PDF</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ⚙️ SETTINGS TAB */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">💱 ვალუტის კურსები</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">1 EUR = ? GEL</label>
                <input type="number" step="0.01" value={exchangeRates.EUR} onChange={(e) => setExchangeRates(prev => ({ ...prev, EUR: parseFloat(e.target.value) }))} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">1 USD = ? GEL</label>
                <input type="number" step="0.01" value={exchangeRates.USD} onChange={(e) => setExchangeRates(prev => ({ ...prev, USD: parseFloat(e.target.value) }))} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button onClick={() => setNotification({ type: 'success', message: '✅ კურსები განახლდა!' })} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium">💾 შენახვა</button>
            </div>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">🧾 გადასახადის პარამეტრები</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">VAT განაკვეთი (%)</label>
                <input type="number" defaultValue={18} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg outline-none" disabled />
                <p className="text-xs text-gray-500 mt-1">საქართველოში სტანდარტული VAT: 18%</p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">ინვოისის ნომერაციის პრეფიქსი</label>
                <input type="text" defaultValue="INV" className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg outline-none" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ➕ INVOICE MODAL */}
      {modalType === 'invoice' && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setModalType(null)}>
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex justify-between items-center z-10">
              <h3 className="text-2xl font-bold">🧾 {form.id ? 'ინვოისის რედაქტირება' : 'ახალი დოკუმენტი'}</h3>
              <button onClick={() => setModalType(null)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <form onSubmit={handleSaveInvoice} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">დოკუმენტის ტიპი</label>
                  <select value={form.type || 'Tax Invoice'} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg outline-none">
                    <option value="Tax Invoice">🧾 Tax Invoice</option>
                    <option value="Proforma Invoice">📄 Proforma Invoice</option>
                    <option value="Credit Note">🔄 Credit Note</option>
                    <option value="Debit Note">📝 Debit Note</option>
                    <option value="Payment Receipt">💳 Payment Receipt</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">ვალუტა</label>
                  <select value={form.currency || 'GEL'} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg outline-none">
                    <option value="GEL">🇬🇪 GEL</option>
                    <option value="USD">🇺🇸 USD</option>
                    <option value="EUR">🇪🇺 EUR</option>
                  </select>
                </div>
              </div>
              <input required placeholder="კლიენტის სახელი / კომპანია" value={form.client || ''} onChange={(e) => setForm({ ...form, client: e.target.value })} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg outline-none" />
              <input placeholder="შეკვეთის/ტრეკინგის კოდი" value={form.tracking_code || ''} onChange={(e) => setForm({ ...form, tracking_code: e.target.value })} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg outline-none" />
              <div className="grid grid-cols-2 gap-4">
                <input required type="number" step="0.01" placeholder="თანხა (VAT-ის გარეშე)" value={form.baseAmount || ''} onChange={(e) => setForm({ ...form, baseAmount: e.target.value })} className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg outline-none" />
                <input required type="date" value={form.dueDate || ''} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg outline-none" />
              </div>
              {form.baseAmount && (
                <div className="bg-gray-700/50 p-4 rounded-lg text-sm space-y-1">
                  <div className="flex justify-between"><span>ბაზა:</span><span>{currency} {parseFloat(form.baseAmount).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>VAT (18%):</span><span>{currency} {(parseFloat(form.baseAmount) * 0.18).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                  <div className="flex justify-between font-bold border-t border-gray-600 pt-2"><span>სულ:</span><span>{currency} {(parseFloat(form.baseAmount) * 1.18).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                </div>
              )}
              <textarea placeholder="აღწერა / დეტალები" rows={3} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg outline-none resize-none" />
              <div className="flex gap-3 pt-4 border-t border-gray-700">
                <button type="button" onClick={() => setModalType(null)} className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-semibold">გაუქმება</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold">💾 შენახვა</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}