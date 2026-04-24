'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts'
import FleetManagement from './FleetManagement'

// ============================================================================
// 📦 ტიპები
// ============================================================================
type ManagerTab = 'kpi' | 'fleet' | 'dispatch' | 'clients' | 'financials'
type AlertType = 'danger' | 'warning' | 'info'

interface ComplianceAlert {
  type: AlertType
  message: string
  target: string
  date: string
}

export default function ManagerDashboard({ user, setNotification }: { 
  user: any, setNotification: (n: { type: 'success' | 'error'; message: string }) => void 
}) {
  const [activeTab, setActiveTab] = useState<ManagerTab>('kpi')
  const [loading, setLoading] = useState(true)
  
  // მონაცემები
  const [complianceAlerts, setComplianceAlerts] = useState<ComplianceAlert[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [pettyCash, setPettyCash] = useState<any[]>([])
  
  // ანალიტიკა
  const [kpiData, setKpiData] = useState({
    totalOrders: 0, onTimeRate: 0, fleetUtilization: 0, activeClients: 0,
    monthlyRevenue: 0, monthlyExpenses: 0, netProfit: 0
  })
  const [revenueByClient, setRevenueByClient] = useState<any[]>([])
  const [profitTrend, setProfitTrend] = useState<any[]>([])

  // 📊 მონაცემების ჩატვირთვა
  useEffect(() => {
    loadManagerData()
  }, [])

  const loadManagerData = async () => {
    setLoading(true)
    try {
      // 1. შეკვეთები & KPI ბაზა
      const ordersResponse = await supabase
        .from('orders')
        .select(`*, drivers(full_name), vehicles(plate_number)`)
        .order('created_at', { ascending: false })
      setOrders(ordersResponse.data || [])

      // 2. მძღოლები & მანქანები (კომპლაენსისთვის)
      const driversResponse = await supabase.from('drivers').select('*')
      const vehiclesResponse = await supabase.from('vehicles').select('*')
      
      // კომპლაენსი გაფრთხილებები
      const alerts: ComplianceAlert[] = []
      const today = new Date()
      const warningDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
      const dangerDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

      driversResponse.data?.forEach((d: any) => {
        if (d.license_expiry) {
          const exp = new Date(d.license_expiry)
          if (exp < dangerDate) alerts.push({ type: 'danger', message: `მძღოლი ${d.full_name}: ლიცენზია იწურება! (${d.license_expiry})`, target: 'license', date: d.license_expiry })
          else if (exp < warningDate) alerts.push({ type: 'warning', message: `მძღოლი ${d.full_name}: ლიცენზია მალე იწურება (${d.license_expiry})`, target: 'license', date: d.license_expiry })
        }
      })
      vehiclesResponse.data?.forEach((v: any) => {
        if (v.insurance_expiry) {
          const exp = new Date(v.insurance_expiry)
          if (exp < dangerDate) alerts.push({ type: 'danger', message: `მანქანა ${v.plate_number}: დაზღვევა იწურება! (${v.insurance_expiry})`, target: 'insurance', date: v.insurance_expiry })
          else if (exp < warningDate) alerts.push({ type: 'warning', message: `მანქანა ${v.plate_number}: დაზღვევა მალე იწურება (${v.insurance_expiry})`, target: 'insurance', date: v.insurance_expiry })
        }
        if (v.next_maintenance) {
          const maint = new Date(v.next_maintenance)
          if (maint < warningDate) alerts.push({ type: 'info', message: `მანქანა ${v.plate_number}: ტექმომსახურება მალეა (${v.next_maintenance})`, target: 'maintenance', date: v.next_maintenance })
        }
      })
      setComplianceAlerts(alerts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()))

      // 3. კლიენტები (სიმულაცია/ბაზიდან)
      const usersResponse = await supabase.from('auth.users').select('id, email, created_at').limit(10)
      setClients(usersResponse.data?.map((u: any, i: number) => ({
        id: u.id, name: `კლიენტი ${i + 1}`, email: u.email, status: i % 3 === 0 ? 'VIP' : 'აქტიური',
        totalOrders: Math.floor(Math.random() * 15) + 2, totalSpent: Math.floor(Math.random() * 8000) + 1200
      })) || [])

      // 4. ინვოისები & Petty Cash
      setInvoices([
        { id: 'INV-001', client: 'კლიენტი 1', amount: 12500, status: 'ლოდინში', date: '2024-05-20' },
        { id: 'INV-002', client: 'კლიენტი 2', amount: 8400, status: 'დამტკიცებული', date: '2024-05-18' },
        { id: 'INV-003', client: 'კლიენტი 3', amount: 3200, status: 'უარყოფილი', date: '2024-05-15' },
      ])
      setPettyCash([
        { id: 1, type: 'მძღოლის ხარჯი', amount: 120, date: '2024-05-21', status: 'გაცემული' },
        { id: 2, type: 'ოფისის ხარჯი', amount: 45, date: '2024-05-20', status: 'ლოდინში' },
      ])

      // 5. ანალიტიკა (სიმულაცია რეალური მონაცემებით)
      const delivered = ordersResponse.data?.filter((o: any) => o.status === 'delivered') || []
      const inTransit = ordersResponse.data?.filter((o: any) => o.status === 'in_transit') || []
      const totalRev = delivered.reduce((sum: number, o: any) => sum + (o.price || 0), 0)
      const totalExp = Math.floor(totalRev * 0.65) // სიმულაცია
      
      setKpiData({
        totalOrders: ordersResponse.data?.length || 0,
        onTimeRate: Math.floor(Math.random() * 15) + 85,
        fleetUtilization: Math.floor((inTransit.length / Math.max(vehiclesResponse.data?.length || 1, 1)) * 100),
        activeClients: clients.length,
        monthlyRevenue: totalRev,
        monthlyExpenses: totalExp,
        netProfit: totalRev - totalExp
      })

      // შემოსავალი კლიენტების მიხედვით
      setRevenueByClient([
        { name: 'კლიენტი 1', revenue: 12500, profit: 4200 },
        { name: 'კლიენტი 2', revenue: 8400, profit: 2800 },
        { name: 'კლიენტი 3', revenue: 5600, profit: 1900 },
        { name: 'კლიენტი 4', revenue: 3200, profit: 900 },
        { name: 'სხვა', revenue: 2100, profit: 600 },
      ])

      // P&L ტრენდი
      setProfitTrend([
        { month: 'იან', revenue: 18000, expenses: 12000 },
        { month: 'თებ', revenue: 22000, expenses: 14500 },
        { month: 'მარ', revenue: 19500, expenses: 13000 },
        { month: 'აპრ', revenue: 25000, expenses: 16000 },
        { month: 'მაი', revenue: totalRev || 21000, expenses: totalExp || 13500 },
      ])

    } catch (err: any) {
      console.error('Manager load error:', err)
      setNotification({ type: 'error', message: `❌ ${err.message}` })
    } finally {
      setLoading(false)
    }
  }

  // 💰 ინვოისის დამტკიცება
  const approveInvoice = (id: string, action: 'approve' | 'reject') => {
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: action === 'approve' ? 'დამტკიცებული' : 'უარყოფილი' } : inv))
    setNotification({ type: 'success', message: action === 'approve' ? '✅ ინვოისი დამტკიცდა' : '❌ ინვოისი უარყოფილია' })
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white text-xl animate-pulse">🔄 იტვირთება...</div>

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-6 space-y-6">
      {/* 🏠 Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">📈 მენეჯერის პანელი</h1>
          <p className="text-gray-400">ოპერაციული ზედამხედველობა • ნაწილობრივი ფინანსური წვდომა</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['kpi', 'fleet', 'dispatch', 'clients', 'financials'] as ManagerTab[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
              {{ kpi: '📊 KPI & ანგარიშები', fleet: '🚛 ფლოტი', dispatch: '📦 დისპეტჩინგი', clients: '👥 კლიენტები', financials: '💰 ფინანსები' }[tab]}
            </button>
          ))}
        </div>
      </div>

      {/* 🚨 კომპლაენსი გაფრთხილებები */}
      {complianceAlerts.length > 0 && (
        <div className="bg-red-900/20 border border-red-500/40 rounded-xl p-4 space-y-2">
          <h3 className="font-bold text-red-400 flex items-center gap-2">⚠️ ყურადღება! ვადები იწურება:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {complianceAlerts.slice(0, 4).map((alert, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-lg text-sm ${alert.type === 'danger' ? 'bg-red-600/20 text-red-300' : alert.type === 'warning' ? 'bg-yellow-600/20 text-yellow-300' : 'bg-blue-600/20 text-blue-300'}`}>
                <span>{alert.type === 'danger' ? '🔴' : alert.type === 'warning' ? '🟡' : '🔵'}</span>
                <span>{alert.message}</span>
              </div>
            ))}
            {complianceAlerts.length > 4 && <p className="text-gray-400 text-xs py-2">+ {complianceAlerts.length - 4} დამატებითი გაფრთხილება</p>}
          </div>
        </div>
      )}

      {/* 📊 KPI TAB */}
      {activeTab === 'kpi' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="სულ შეკვეთა" value={kpiData.totalOrders.toString()} color="bg-gray-700" />
            <StatCard title="On-Time %" value={`${kpiData.onTimeRate}%`} color="bg-green-600" />
            <StatCard title="ფლოტის დატვირთვა" value={`${kpiData.fleetUtilization}%`} color="bg-blue-600" />
            <StatCard title="აქტიური კლიენტები" value={kpiData.activeClients.toString()} color="bg-purple-600" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">💰 შემოსავალი კლიენტების მიხედვით</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={revenueByClient}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                  <Bar dataKey="revenue" name="შემოსავალი" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profit" name="მოგება" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">📈 P&L ტრენდი (ბოლო 5 თვე)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={profitTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" name="შემოსავალი" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="expenses" name="ხარჯები" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
              <p className="text-gray-400 text-sm">თვიური შემოსავალი</p>
              <p className="text-2xl font-bold text-green-400">${kpiData.monthlyRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
              <p className="text-gray-400 text-sm">თვიური ხარჯები</p>
              <p className="text-2xl font-bold text-red-400">${kpiData.monthlyExpenses.toLocaleString()}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
              <p className="text-gray-400 text-sm">წმინდა მოგება</p>
              <p className="text-2xl font-bold text-purple-400">${kpiData.netProfit.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* 🚛 FLEET TAB */}
      {activeTab === 'fleet' && (
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
          <h3 className="text-xl font-bold mb-4">🚛 ფლოტის სრული მართვა</h3>
          <FleetManagement setNotification={setNotification} />
        </div>
      )}

      {/* 📦 DISPATCH TAB */}
      {activeTab === 'dispatch' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">📦 შეკვეთების ზედამხედველობა</h3>
            <span className="text-sm text-gray-400">{orders.length} სულ რეისი</span>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3">Tracking</th>
                  <th className="px-4 py-3">მარშრუტი</th>
                  <th className="px-4 py-3">მძღოლი/მანქანა</th>
                  <th className="px-4 py-3">სტატუსი</th>
                  <th className="px-4 py-3">ფასი</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                    <td className="px-4 py-3 font-mono text-blue-400">{o.tracking_code}</td>
                    <td className="px-4 py-3 text-xs">
                      <div>{o.pickup_address?.split(',')[0]}</div>
                      <div className="text-gray-500">→ {o.delivery_address?.split(',')[0]}</div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div>{o.drivers?.full_name || '–'}</div>
                      <div className="text-gray-500">{o.vehicles?.plate_number || '–'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${o.status === 'delivered' ? 'bg-green-600/20 text-green-400' : o.status === 'in_transit' ? 'bg-blue-600/20 text-blue-400' : 'bg-yellow-600/20 text-yellow-400'}`}>
                        {o.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">${o.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 👥 CLIENTS TAB */}
      {activeTab === 'clients' && (
        <div className="space-y-6">
          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold">👥 კლიენტების პორტალი & მართვა</h3>
              <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm">➕ ახალი კლიენტი</button>
            </div>
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-700/50 text-gray-400 uppercase text-xs">
                <tr><th className="px-4 py-3">კლიენტი</th><th className="px-4 py-3">სტატუსი</th><th className="px-4 py-3">რეისები</th><th className="px-4 py-3">ჯამური ხარჯი</th><th className="px-4 py-3">მოქმედება</th></tr>
              </thead>
              <tbody>
                {clients.map(c => (
                  <tr key={c.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                    <td className="px-4 py-3"><div className="font-medium">{c.name}</div><div className="text-xs text-gray-500">{c.email}</div></td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs ${c.status === 'VIP' ? 'bg-purple-600/20 text-purple-400' : 'bg-blue-600/20 text-blue-400'}`}>{c.status}</span></td>
                    <td className="px-4 py-3">{c.totalOrders}</td>
                    <td className="px-4 py-3 font-bold">${c.totalSpent.toLocaleString()}</td>
                    <td className="px-4 py-3 flex gap-2">
                      <button className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs">💬 ჩატი</button>
                      <button className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs">👁️ პროფილი</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 💰 FINANCIALS TAB (შეზღუდული წვდომა) */}
      {activeTab === 'financials' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ინვოისების დამტკიცება */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-700"><h3 className="text-lg font-semibold">🧾 ინვოისების ნახვა & დამტკიცება</h3></div>
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-700/50 text-gray-400 uppercase text-xs">
                <tr><th className="px-4 py-3">ინვოისი</th><th className="px-4 py-3">კლიენტი</th><th className="px-4 py-3">თანხა</th><th className="px-4 py-3">სტატუსი</th><th className="px-4 py-3">მოქმედება</th></tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id} className="border-b border-gray-700">
                    <td className="px-4 py-3 font-mono text-blue-400">{inv.id}</td>
                    <td className="px-4 py-3">{inv.client}</td>
                    <td className="px-4 py-3 font-bold">${inv.amount.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${inv.status === 'დამტკიცებული' ? 'bg-green-600/20 text-green-400' : inv.status === 'უარყოფილი' ? 'bg-red-600/20 text-red-400' : 'bg-yellow-600/20 text-yellow-400'}`}>{inv.status}</span>
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      {inv.status === 'ლოდინში' && (
                        <>
                          <button onClick={() => approveInvoice(inv.id, 'approve')} className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs">✅ დამტკიცება</button>
                          <button onClick={() => approveInvoice(inv.id, 'reject')} className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs">❌ უარყოფა</button>
                        </>
                      )}
                      <button className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs">📄 ნახვა</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Petty Cash ანგარიშები */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-700"><h3 className="text-lg font-semibold">🏦 Petty Cash ანგარიშები</h3></div>
            <div className="p-4 grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-700/50 p-3 rounded-lg text-center"><p className="text-gray-400 text-xs">ხელმისაწვდომი</p><p className="text-xl font-bold text-green-400">₾ 2,450</p></div>
              <div className="bg-gray-700/50 p-3 rounded-lg text-center"><p className="text-gray-400 text-xs">ლოდინში</p><p className="text-xl font-bold text-yellow-400">₾ 320</p></div>
            </div>
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-700/50 text-gray-400 uppercase text-xs">
                <tr><th className="px-4 py-3">ტიპი</th><th className="px-4 py-3">თანხა</th><th className="px-4 py-3">თარიღი</th><th className="px-4 py-3">სტატუსი</th></tr>
              </thead>
              <tbody>
                {pettyCash.map(pc => (
                  <tr key={pc.id} className="border-b border-gray-700">
                    <td className="px-4 py-3">{pc.type}</td>
                    <td className="px-4 py-3 font-bold">₾ {pc.amount}</td>
                    <td className="px-4 py-3 text-gray-400">{pc.date}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs ${pc.status === 'გაცემული' ? 'bg-green-600/20 text-green-400' : 'bg-yellow-600/20 text-yellow-400'}`}>{pc.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// 🧩 Helper: StatCard
// ============================================================================
function StatCard({ title, value, color }: { title: string; value: string; color: string }) {
  return (
    <div className={`${color} p-4 rounded-xl shadow-lg`}>
      <p className="text-white/80 text-xs font-medium">{title}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
    </div>
  )
}