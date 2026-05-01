'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

// ============================================================================
// 📦 ტიპები
// ============================================================================
export interface SystemUser {
  id: string
  email: string
  role: string
  status: 'active' | 'blocked' | 'pending'
  created_at: string
  last_sign_in: string | null
  user_metadata: Record<string, any>
}

interface UsersTabProps {
  setNotification: (n: { type: 'success' | 'error'; message: string }) => void
}

// ============================================================================
// 👥 USERS TAB COMPONENT
// ============================================================================
export default function UsersTab({ setNotification }: UsersTabProps) {
  const [users, setUsers] = useState<SystemUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  
  // მოდალები
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null)
  const [editForm, setEditForm] = useState({ role: '', status: 'active', full_name: '', phone: '' })

  // 🔔 ნოტიფიკაციის ფუნქცია
  const showLocalNotification = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message: msg })
  }, [setNotification])

  // 📊 მომხმარეების ჩატვირთვა
  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role, status, created_at, last_sign_in, user_metadata')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Profiles fetch error:', error)
        showLocalNotification(`❌ ${error.message}`, 'error')
        setUsers([])
        return
      }
      
      if (data && data.length > 0) {
        const normalized = data.map((u: any) => ({
          id: u.id || '',
          email: u.email || '–',
          role: u.role || 'client',
          status: (u.status === 'active' || u.status === 'blocked' || u.status === 'pending') ? u.status : 'active',
          created_at: u.created_at || new Date().toISOString(),
          last_sign_in: u.last_sign_in || null,
          user_metadata: u.user_metadata || {}
        }))
        setUsers(normalized as SystemUser[])
      } else {
        setUsers([])
        showLocalNotification('📭 ჯერ არ არის დარეგისტრირებული მომხმარეები', 'success')
      }
    } catch (err: any) {
      console.error('Users fetch error:', err)
      showLocalNotification(`❌ ${err.message || 'მონაცემების ჩატვირთვა ვერ მოხერხდა'}`, 'error')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  // 🔍 ფილტრაცია
  const filteredUsers = users.filter(u => {
    const matchesSearch = !search || 
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.user_metadata?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.user_metadata?.phone?.includes(search)
    const matchesRole = filterRole === 'all' || u.role === filterRole
    const matchesStatus = filterStatus === 'all' || u.status === filterStatus
    return matchesSearch && matchesRole && matchesStatus
  })

  // ✏️ რედაქტირების მომზადება
  const openEditModal = (user: SystemUser) => {
    setSelectedUser(user)
    setEditForm({
      role: user.role,
      status: user.status,
      full_name: user.user_metadata?.full_name || '',
      phone: user.user_metadata?.phone || ''
    })
    setShowEditModal(true)
  }

  // ✏️ რედაქტირების შენახვა
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          role: editForm.role,
          status: editForm.status,
          user_metadata: { 
            ...selectedUser.user_metadata, 
            full_name: editForm.full_name, 
            phone: editForm.phone 
          }
        })
        .eq('id', selectedUser.id)
      
      if (error) throw error
      
      showLocalNotification('✅ მომხმარე განახლდა!')
      setShowEditModal(false)
      fetchUsers()
    } catch (err: any) {
      showLocalNotification(`❌ ${err.message}`, 'error')
    }
  }

  // 🗑️ წაშლის მომზადება
  const openDeleteModal = (user: SystemUser) => {
    setSelectedUser(user)
    setShowDeleteModal(true)
  }

  // 🗑️ წაშლის დადასტურება
  const handleDelete = async () => {
    if (!selectedUser) return
    
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', selectedUser.id)
      if (error) throw error
      
      showLocalNotification('🗑️ მომხმარე წაიშალა!')
      setShowDeleteModal(false)
      fetchUsers()
    } catch (err: any) {
      showLocalNotification(`❌ ${err.message}`, 'error')
    }
  }

  // 🔄 სტატუსის სწრაფი შეცვლა
  const toggleStatus = async (user: SystemUser) => {
    try {
      const newStatus = user.status === 'active' ? 'blocked' : 'active'
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', user.id)
      
      if (error) throw error
      
      showLocalNotification(`✅ სტატუსი: ${newStatus === 'active' ? 'განბლოკილი' : 'დაბლოკილი'}`)
      fetchUsers()
    } catch (err: any) {
      showLocalNotification(`❌ ${err.message}`, 'error')
    }
  }

  // 🎨 Helper: სტატუსის ბეჯი
  const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
      active: 'bg-green-600/20 text-green-400 border-green-500/30',
      blocked: 'bg-red-600/20 text-red-400 border-red-500/30',
      pending: 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30'
    }
    const labels: Record<string, string> = {
      active: '🟢 აქტიური',
      blocked: '🔴 დაბლოკილი',
      pending: '🟡 ლოდინში'
    }
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    )
  }

  // 🎨 Helper: როლის ბეჯი
  const RoleBadge = ({ role }: { role: string }) => {
    const icons: Record<string, string> = {
      admin: '👑', manager: '📋', accountant: '💰', dispatcher: '📦', driver: '🚛', client: '👤', user: '👤'
    }
    return (
      <span className="px-2 py-0.5 bg-gray-700/50 rounded text-[10px] text-gray-300">
        {icons[role] || '👤'} {role}
      </span>
    )
  }

  if (loading) return <div className="p-8 text-center text-gray-400">🔄 მომხმარებლები იტვირთება...</div>

  return (
    <div className="space-y-4">
      {/* 🔍 Header & Filters */}
      <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold">👥 მომხმარებლების მართვა</h2>
            <p className="text-xs text-gray-400">{filteredUsers.length} მომხმარე {filterRole !== 'all' || filterStatus !== 'all' ? '(ფილტრით)' : ''}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={fetchUsers} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs transition">🔄 განახლება</button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input 
            placeholder="🔍 ძებნა (email, სახელი, ტელეფონი)..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-xs outline-none focus:border-blue-500 md:col-span-2"
          />
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-xs outline-none">
            <option value="all">ყველა როლი</option>
            <option value="admin">👑 Admin</option>
            <option value="manager">📋 Manager</option>
            <option value="accountant">💰 Accountant</option>
            <option value="dispatcher">📦 Dispatcher</option>
            <option value="driver">🚛 Driver</option>
            <option value="client">👤 Client</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-xs outline-none">
            <option value="all">ყველა სტატუსი</option>
            <option value="active">🟢 აქტიური</option>
            <option value="blocked">🔴 დაბლოკილი</option>
            <option value="pending">🟡 ლოდინში</option>
          </select>
        </div>
      </div>

      {/* 📋 Users Table */}
      <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead className="text-gray-400 uppercase bg-gray-900/40">
              <tr>
                <th className="px-4 py-3 text-left">მომხმარე</th>
                <th className="px-4 py-3 text-left">როლი</th>
                <th className="px-4 py-3 text-left">სტატუსი</th>
                <th className="px-4 py-3 text-left">რეგისტრაცია</th>
                <th className="px-4 py-3 text-left">ბოლო შესვლა</th>
                <th className="px-4 py-3 text-right">მოქმედება</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/30">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-700/20 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-[10px] font-bold">
                        {user.user_metadata?.full_name?.[0] || user.email?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-200">{user.user_metadata?.full_name || '–'}</p>
                        <p className="text-gray-500 text-[9px]">{user.email || '–'}</p>
                        {user.user_metadata?.phone && <p className="text-gray-600 text-[9px]">{user.user_metadata.phone}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><RoleBadge role={user.role} /></td>
                  <td className="px-4 py-3"><StatusBadge status={user.status} /></td>
                  <td className="px-4 py-3 text-gray-400">{user.created_at ? new Date(user.created_at).toLocaleDateString('ka-GE') : '–'}</td>
                  <td className="px-4 py-3 text-gray-400">{user.last_sign_in ? new Date(user.last_sign_in).toLocaleDateString('ka-GE') : '–'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => toggleStatus(user)} className="p-1.5 text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 rounded transition" title={user.status === 'active' ? 'დაბლოკვა' : 'განბლოკვა'}>
                        {user.status === 'active' ? '🚫' : '✅'}
                      </button>
                      <button onClick={() => openEditModal(user)} className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition" title="რედაქტირება">✏️</button>
                      <button onClick={() => openDeleteModal(user)} className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition" title="წაშლა">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                  {users.length === 0 ? '📭 მომხმარეები ვერ მოიძებნა' : '🔍 ფილტრის შედეგები ცარიელია'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✏️ EDIT MODAL */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">✏️ მომხმარის რედაქტირება</h3>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-[10px] text-gray-400 mb-1">Email (შეუცვლელი)</label>
                <input disabled value={selectedUser.email || ''} className="w-full px-3 py-2 bg-gray-700/30 border border-gray-600 rounded-lg text-xs text-gray-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">სახელი</label>
                  <input value={editForm.full_name} onChange={(e) => setEditForm({...editForm, full_name: e.target.value})} className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-xs outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">ტელეფონი</label>
                  <input value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-xs outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">როლი</label>
                  <select value={editForm.role} onChange={(e) => setEditForm({...editForm, role: e.target.value})} className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-xs outline-none">
                    <option value="admin">👑 Admin</option>
                    <option value="manager">📋 Manager</option>
                    <option value="accountant">💰 Accountant</option>
                    <option value="dispatcher">📦 Dispatcher</option>
                    <option value="driver">🚛 Driver</option>
                    <option value="client">👤 Client</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">სტატუსი</label>
                  <select value={editForm.status} onChange={(e) => setEditForm({...editForm, status: e.target.value})} className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-xs outline-none">
                    <option value="active">🟢 აქტიური</option>
                    <option value="blocked">🔴 დაბლოკილი</option>
                    <option value="pending">🟡 ლოდინში</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-700">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-medium transition">გაუქმება</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-bold transition">💾 შენახვა</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🗑️ DELETE MODAL */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-gray-800 border border-red-500/30 rounded-2xl w-full max-w-sm p-6 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🗑️</span>
            </div>
            <h3 className="text-lg font-bold mb-2">მომხმარის წაშლა</h3>
            <p className="text-sm text-gray-400 mb-6">
              ნამდვილად გსურთ <span className="text-white font-medium">{selectedUser.email || selectedUser.id}</span> წაშლა?<br/>
              <span className="text-red-400 text-xs">ეს ქმედება შეუქცევადია.</span>
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-medium transition">არყოფა</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg text-xs font-bold transition">ვადასტურებ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}