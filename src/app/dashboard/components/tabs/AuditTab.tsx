'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

interface AuditLog {
  id: string
  created_at: string
  user_email: string
  action: 'create' | 'update' | 'delete' | 'login' | 'logout'
  table_name: string
  record_id: string | null
  details: string
}

export default function AuditTab() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, create, update, delete, login
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    setLoading(true)
    // ცდა: წავიღოთ რეალური აუდიტის ლოგები (თუ არსებობს audit_logs ცხრილი)
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (!error && data) {
      setLogs(data as AuditLog[])
    } else {
      // დემო მონაცემები (თუ ცხრილი არ არსებობს)
      setLogs(generateDemoLogs())
    }
    setLoading(false)
  }

  // დემო ლოგები დეველოპმენტისთვის
  const generateDemoLogs = (): AuditLog[] => [
    { id: '1', created_at: new Date().toISOString(), user_email: 'admin@logistics.ge', action: 'login', table_name: 'auth', record_id: null, details: 'ადმინი შევიდა სისტემაში' },
    { id: '2', created_at: new Date(Date.now() - 3600000).toISOString(), user_email: 'admin@logistics.ge', action: 'create', table_name: 'orders', record_id: 'ord_123', details: 'შეიქმნა ახალი შეკვეთა #TRK-2024-001' },
    { id: '3', created_at: new Date(Date.now() - 7200000).toISOString(), user_email: 'admin@logistics.ge', action: 'update', table_name: 'orders', record_id: 'ord_122', details: 'შეკვეთის სტატუსი შეიცვალა: pending → in_transit' },
    { id: '4', created_at: new Date(Date.now() - 10800000).toISOString(), user_email: 'admin@logistics.ge', action: 'create', table_name: 'drivers', record_id: 'drv_456', details: 'დამატებული ახალი მძღოლი: ნიკა გიორგაძე' },
    { id: '5', created_at: new Date(Date.now() - 14400000).toISOString(), user_email: 'admin@logistics.ge', action: 'update', table_name: 'vehicles', record_id: 'veh_789', details: 'მანქანის სტატუსი: active → maintenance' },
    { id: '6', created_at: new Date(Date.now() - 18000000).toISOString(), user_email: 'admin@logistics.ge', action: 'delete', table_name: 'private_clients', record_id: 'clt_111', details: 'წაიშალა კლიენტი: გივი ბერიკაშვილი' },
    { id: '7', created_at: new Date(Date.now() - 21600000).toISOString(), user_email: 'admin@logistics.ge', action: 'create', table_name: 'invoices', record_id: 'inv_2024_001', details: 'გამოწერილი ინვოისი #INV-2024-001' },
    { id: '8', created_at: new Date(Date.now() - 25200000).toISOString(), user_email: 'admin@logistics.ge', action: 'logout', table_name: 'auth', record_id: null, details: 'ადმინი გავიდა სისტემიდან' },
  ]

  const filteredLogs = logs.filter(log => {
    const matchesFilter = filter === 'all' || log.action === filter
    const matchesSearch = search === '' || 
      log.user_email.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.table_name.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'create': return <span className="bg-green-500/20 text-green-400 border-green-500/30 px-2 py-0.5 rounded text-[10px] border">➕ შექმნა</span>
      case 'update': return <span className="bg-blue-500/20 text-blue-400 border-blue-500/30 px-2 py-0.5 rounded text-[10px] border">✏️ განახლება</span>
      case 'delete': return <span className="bg-red-500/20 text-red-400 border-red-500/30 px-2 py-0.5 rounded text-[10px] border">🗑️ წაშლა</span>
      case 'login': return <span className="bg-purple-500/20 text-purple-400 border-purple-500/30 px-2 py-0.5 rounded text-[10px] border">🔐 შესვლა</span>
      case 'logout': return <span className="bg-gray-500/20 text-gray-400 border-gray-500/30 px-2 py-0.5 rounded text-[10px] border">🚪 გასვლა</span>
      default: return <span className="bg-gray-500/20 text-gray-400 border-gray-500/30 px-2 py-0.5 rounded text-[10px] border">{action}</span>
    }
  }

  const getTableIcon = (table: string) => {
    switch (table) {
      case 'orders': return '📦'
      case 'drivers': return '👨‍✈️'
      case 'vehicles': return '🚐'
      case 'invoices': return '🧾'
      case 'private_clients': return '👤'
      case 'companies': return '🏢'
      case 'auth': return '🔐'
      default: return '📋'
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><span className="text-gray-400">იტვირთება აუდიტის ლოგები...</span></div>

  return (
    <div className="space-y-6">
      {/* 🔍 ფილტრები და ძებნა */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">📜 აუდიტის ლოგები</h2>
        
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
            <option value="all">ყველა მოქმედება</option>
            <option value="create">➕ შექმნა</option>
            <option value="update">✏️ განახლება</option>
            <option value="delete">🗑️ წაშლა</option>
            <option value="login">🔐 შესვლა</option>
            <option value="logout">🚪 გასვლა</option>
          </select>
          <button
            onClick={fetchLogs}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-medium transition"
          >
            🔄 განახლება
          </button>
        </div>
      </div>

      {/* 📊 სტატისტიკა */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'სულ', value: logs.length, color: 'text-white' },
          { label: 'შექმნილი', value: logs.filter(l => l.action === 'create').length, color: 'text-green-400' },
          { label: 'განახლებული', value: logs.filter(l => l.action === 'update').length, color: 'text-blue-400' },
          { label: 'წაშლილი', value: logs.filter(l => l.action === 'delete').length, color: 'text-red-400' },
          { label: 'სესიები', value: logs.filter(l => ['login', 'logout'].includes(l.action)).length, color: 'text-purple-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-gray-800/60 border border-gray-700 rounded-xl p-3 text-center">
            <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-[10px] text-gray-400 uppercase">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* 📋 ლოგების ცხრილი */}
      <div className="bg-gray-800/60 border border-gray-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-700/50 text-gray-300">
              <tr>
                <th className="px-4 py-3 text-left">დრო</th>
                <th className="px-4 py-3 text-left">მომხმარებელი</th>
                <th className="px-4 py-3 text-left">მოქმედება</th>
                <th className="px-4 py-3 text-left">ცხრილი</th>
                <th className="px-4 py-3 text-left">დეტალები</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-700/20 transition">
                  <td className="px-4 py-3 text-[10px] text-gray-400 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('ka-GE')}
                  </td>
                  <td className="px-4 py-3 text-[10px] text-white truncate max-w-[120px]">
                    {log.user_email}
                  </td>
                  <td className="px-4 py-3">{getActionBadge(log.action)}</td>
                  <td className="px-4 py-3 text-[10px] text-gray-300">
                    <span className="mr-1">{getTableIcon(log.table_name)}</span>
                    {log.table_name}
                  </td>
                  <td className="px-4 py-3 text-[10px] text-gray-400 truncate max-w-[200px]">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredLogs.length === 0 && (
          <div className="p-8 text-center text-gray-500 text-xs">
            {logs.length === 0 ? 'ლოგები არ მოიძებნა' : 'ფილტრის შედეგები ცარიელია'}
          </div>
        )}
      </div>

      {/* ℹ️ ინფო ბლოკი */}
      <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4 text-[10px] text-gray-400">
        <strong>📌 შენიშვნა:</strong> აუდიტის ლოგები ავტომატურად იწერება ყველა მნიშვნელოვან მოქმედებაზე. 
        ლოგების შესანახად საჭიროა <code className="bg-gray-700 px-1 rounded">audit_logs</code> ცხრილი Supabase-ში.
      </div>
    </div>
  )
}