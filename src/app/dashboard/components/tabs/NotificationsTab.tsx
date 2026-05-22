'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

interface NotificationsTabProps {
  showNotification: (msg: string) => void
}

export default function NotificationsTab({ showNotification }: NotificationsTabProps) {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deletingAll, setDeletingAll] = useState(false)
  const [filter, setFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('notifications')
        .select(`
          *,
          orders!inner(tracking_code),
          drivers!notifications_driver_id_fkey(full_name),
          external_drivers!notifications_external_driver_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (filter !== 'all') query = query.eq('channel', filter)
      if (statusFilter !== 'all') query = query.eq('status', statusFilter)
      
      const { data, error } = await query
      if (error) throw error
      setNotifications(data || [])
    } catch (err: any) {
      console.error('❌ Failed to fetch notifications:', err)
      showNotification(`❌ ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    
    const channel = supabase
      .channel('notifications_realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'notifications' },
        () => fetchNotifications()
      )
      .subscribe()
    
    return () => { supabase.removeChannel(channel) }
  }, [filter, statusFilter])

  // 🗑️ სათითაოდ წაშლა
  const handleDelete = async (id: string) => {
    if (!confirm('წავშალო ეს შეტყობინება?')) return
    
    setDeletingId(id)
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      setNotifications(prev => prev.filter(n => n.id !== id))
      showNotification('🗑️ წაიშალა')
    } catch (err: any) {
      console.error('❌ Delete failed:', err)
      showNotification(`❌ წაშლა ვერ მოხერხდა: ${err.message}`)
      fetchNotifications()
    } finally {
      setDeletingId(null)
    }
  }

  // 🗑️ ყველას წაშლა - ✅ შესწორებული ვერსია
  const handleDeleteAll = async () => {
    const count = notifications.length
    if (count === 0) {
      showNotification('⚠️ წასაშლელი ჩანაწერები არ არის')
      return
    }
    
    if (!confirm(`დარწმუნებული ხარ რომ გინდა ${count} შეტყობინების წაშლა?`)) return
    
    setDeletingAll(true)
    try {
      const idsToDelete = notifications.map(n => n.id)
      
      const { error } = await supabase
        .from('notifications')
        .delete()
        .in('id', idsToDelete) // ✅ ეს ქმნის WHERE კლაუზას
      
      if (error) throw error
      
      setNotifications([])
      showNotification(`🗑️ ${count} შეტყობინება წაიშალა!`)
      fetchNotifications()
      
    } catch (err: any) {
      console.error('❌ Delete all failed:', err)
      showNotification(`❌ წაშლა ვერ მოხერხდა: ${err.message}`)
      fetchNotifications()
    } finally {
      setDeletingAll(false)
    }
  }

  // 🔄 სტატუსის განახლება
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ status: newStatus })
        .eq('id', id)
      
      if (error) throw error
      
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, status: newStatus } : n
      ))
      showNotification('✅ განახლდა')
    } catch (err: any) {
      showNotification(`❌ ${err.message}`)
    }
  }

  const getStatusBadge = (status: string) => {
    const map: any = {
      unread: 'bg-blue-500/20 text-blue-400',
      read: 'bg-gray-500/20 text-gray-400',
      sent: 'bg-green-500/20 text-green-400',
      delivered: 'bg-emerald-500/20 text-emerald-400',
      failed: 'bg-red-500/20 text-red-400',
      pending: 'bg-yellow-500/20 text-yellow-400'
    }
    return map[status] || 'bg-gray-500/20 text-gray-400'
  }

  const getChannelIcon = (channel: string) => {
    const map: any = {
      telegram: '📱',
      dashboard: '🔔',
      email: '📧',
      sms: '💬'
    }
    return map[channel] || '📄'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-400">იტვირთება...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 🔝 Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-sm font-bold text-white">📢 შეტყობინებების ლოგები</h2>
          <p className="text-[10px] text-gray-500">ყველა შეტყობინება ერთ ადგილას</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleDeleteAll}
            disabled={deletingAll || notifications.length === 0}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-xs font-bold transition shadow-lg shadow-red-500/20 flex items-center gap-1"
          >
            {deletingAll ? '🔄' : '🗑️'} {deletingAll ? 'იშლება...' : `ყველას წაშლა (${notifications.length})`}
          </button>
          <button 
            onClick={fetchNotifications}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-bold transition"
          >
            🔄 განახლება
          </button>
        </div>
      </div>

      {/* 🔍 ფილტრები */}
      <div className="flex flex-wrap gap-2">
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white">
          <option value="all">ყველა არხი</option>
          <option value="telegram">📱 Telegram</option>
          <option value="dashboard">🔔 Dashboard</option>
          <option value="email">📧 Email</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white">
          <option value="all">ყველა სტატუსი</option>
          <option value="unread">🔵 წაუკითხავი</option>
          <option value="read">⚪ წაკითხული</option>
          <option value="sent">🟢 გაგზავნილი</option>
          <option value="failed">🔴 ვერ გაიგზავნა</option>
        </select>
      </div>

      {/* 📋 ცხრილი */}
      <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead className="text-gray-500 uppercase bg-gray-900/40">
              <tr>
                <th className="px-4 py-3 text-left">არხი</th>
                <th className="px-4 py-3 text-left">სათაური</th>
                <th className="px-4 py-3 text-left">შეტყობინება</th>
                <th className="px-4 py-3 text-left">სტატუსი</th>
                <th className="px-4 py-3 text-left">შეკვეთა</th>
                <th className="px-4 py-3 text-left">დრო</th>
                <th className="px-4 py-3 text-right">მოქმედება</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/30">
              {notifications.map(n => (
                <tr key={n.id} className="hover:bg-gray-700/20 transition">
                  <td className="px-4 py-3">
                    <span className="text-lg">{getChannelIcon(n.channel)}</span>
                    <span className="ml-1 text-gray-400">{n.channel}</span>
                  </td>
                  <td className="px-4 py-3 text-white font-medium max-w-[150px] truncate">{n.title}</td>
                  <td className="px-4 py-3 text-gray-400 max-w-[200px] truncate">{n.message}</td>
                  <td className="px-4 py-3">
                    <select value={n.status} onChange={(e) => handleStatusChange(n.id, e.target.value)} className={`px-2 py-0.5 rounded text-[9px] border bg-transparent outline-none cursor-pointer ${getStatusBadge(n.status)}`}>
                      <option value="unread">წაუკითხავი</option>
                      <option value="read">წაკითხული</option>
                      <option value="sent">გაგზავნილი</option>
                      <option value="delivered">მიწოდებული</option>
                      <option value="failed">ვერ გაიგზავნა</option>
                      <option value="pending">ლოდინში</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-[9px]">{n.orders?.tracking_code || n.order_id?.slice(0,8) + '...'}</td>
                  <td className="px-4 py-3 text-gray-500 text-[9px]">{new Date(n.created_at).toLocaleString('ka-GE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => handleDelete(n.id)} disabled={deletingId === n.id} className={`p-1.5 rounded transition ${deletingId === n.id ? 'text-gray-500 cursor-not-allowed' : 'text-red-400 hover:bg-red-500/20'}`} title="წაშლა">
                        {deletingId === n.id ? '🔄' : '🗑️'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {notifications.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">შეტყობინებები არ არის</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 📊 სტატისტიკა */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gray-800/40 border border-gray-700/40 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-blue-400">{notifications.filter(n => n.channel === 'telegram').length}</div>
          <div className="text-[9px] text-gray-400">Telegram</div>
        </div>
        <div className="bg-gray-800/40 border border-gray-700/40 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-purple-400">{notifications.filter(n => n.channel === 'dashboard').length}</div>
          <div className="text-[9px] text-gray-400">Dashboard</div>
        </div>
        <div className="bg-gray-800/40 border border-gray-700/40 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-green-400">{notifications.filter(n => n.status === 'sent' || n.status === 'delivered').length}</div>
          <div className="text-[9px] text-gray-400">წარმატებული</div>
        </div>
        <div className="bg-gray-800/40 border border-gray-700/40 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-red-400">{notifications.filter(n => n.status === 'failed').length}</div>
          <div className="text-[9px] text-gray-400">ვერ გაიგზავნა</div>
        </div>
      </div>
    </div>
  )
}