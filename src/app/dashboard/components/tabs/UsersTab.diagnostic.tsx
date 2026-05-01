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
// 🔍 DIAGNOSTIC USERS TAB COMPONENT
// ============================================================================
export default function UsersTabDiagnostic({ setNotification }: UsersTabProps) {
  const [users, setUsers] = useState<SystemUser[]>([])
  const [loading, setLoading] = useState(true)
  const [diagnostics, setDiagnostics] = useState<{
    step: string
    status: 'pending' | 'success' | 'error'
    message: string
    data?: any
  }[]>([])
  const [rawData, setRawData] = useState<any>(null)
  const [connectionTest, setConnectionTest] = useState<{
    supabaseUrl: string
    isConnected: boolean
    currentUser: any
    userRole: string | null
  } | null>(null)

  // 🔔 ნოტიფიკაციის ფუნქცია
  const showLocalNotification = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message: msg })
  }, [setNotification])

  // 🧪 დიაგნოსტიკის დამატება
  const addDiagnostic = useCallback((step: string, status: 'pending' | 'success' | 'error', message: string, data?: any) => {
    console.log(`[DIAGNOSTIC] ${step}: ${status} - ${message}`, data)
    setDiagnostics(prev => [...prev, { step, status, message, data }])
  }, [])

  // 🔌 კავშირის ტესტირება
  const testConnection = async () => {
    addDiagnostic('🔌 Supabase კავშირი', 'pending', 'კავშირის შემოწმება...')
    try {
      // ✅ სწორი დესტრუქტურიზაცია: getUser() აბრუნებს { data: { user }, error }
      const { data, error } = await supabase.auth.getUser()
      
      if (error) {
        addDiagnostic('🔌 Supabase კავშირი', 'error', `ავტორიზაციის შეცდომა: ${error.message}`, error)
        return null
      }
      
      const user = data?.user
      const role = user?.user_metadata?.role || user?.app_metadata?.role || null
      
      setConnectionTest({
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'unknown',
        isConnected: true,
        currentUser: user ? { id: user.id, email: user.email } : null,
        userRole: role
      })
      
      addDiagnostic('🔌 Supabase კავშირი', 'success', `✅ დაკავშირებულია. როლი: ${role || 'არ არის მითითებული'}`, {
        userId: user?.id,
        email: user?.email,
        role: role
      })
      
      return { user, role }
    } catch (err: any) {
      addDiagnostic('🔌 Supabase კავშირი', 'error', `კრიტიკული შეცდომა: ${err.message}`, err)
      return null
    }
  }

  // 🗄️ ცხრილის არსებობის შემოწმება
  const testTableExists = async () => {
    addDiagnostic('🗄️ ცხრილი "profiles"', 'pending', 'ცხრილის არსებობის შემოწმება...')
    try {
      const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true })
      
      if (error) {
        addDiagnostic('🗄️ ცხრილი "profiles"', 'error', `ცხრილი არ არსებობს ან არ არის წვდომა: ${error.message}`, error)
        return false
      }
      
      addDiagnostic('🗄️ ცხრილი "profiles"', 'success', '✅ ცხრილი არსებობს და ხელმისაწვდომია', { count: data })
      return true
    } catch (err: any) {
      addDiagnostic('🗄️ ცხრილი "profiles"', 'error', `შეცდომა: ${err.message}`, err)
      return false
    }
  }

  // 🔐 RLS პოლიტიკების ტესტირება
  const testRLSPolicies = async (userRole: string | null) => {
    addDiagnostic('🔐 RLS პოლიტიკები', 'pending', `პოლიტიკების შემოწმება (როლი: ${userRole || 'null'})...`)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role')
        .limit(1)
      
      if (error) {
        if (error.code === 'PGRST301' || error.message?.includes('permission denied')) {
          addDiagnostic('🔐 RLS პოლიტიკები', 'error', '❌ RLS ბლოკავს წვდომას! პოლიტიკა არ არის სწორად კონფიგურირებული.', error)
        } else {
          addDiagnostic('🔐 RLS პოლიტიკები', 'error', `სხვა შეცდომა: ${error.message}`, error)
        }
        return false
      }
      
      addDiagnostic('🔐 RLS პოლიტიკები', 'success', '✅ RLS საშუალებას აძლევს მონაცემების წაკითხვას', { sample: data?.[0] || 'ცარიელი' })
      return true
    } catch (err: any) {
      addDiagnostic('🔐 RLS პოლიტიკები', 'error', `შეცდომა: ${err.message}`, err)
      return false
    }
  }

  // 📊 მონაცემების ჩატვირთვა + დიაგნოსტიკა
  const fetchUsersWithDiagnostics = async () => {
    setLoading(true)
    setDiagnostics([])
    
    addDiagnostic('🚀 დასაწყისი', 'pending', 'დიაგნოსტიკა იწყება...')
    
    // 1. კავშირის ტესტი
    const connection = await testConnection()
    if (!connection) {
      setLoading(false)
      return
    }
    
    // 2. ცხრილის ტესტი
    const tableExists = await testTableExists()
    if (!tableExists) {
      setLoading(false)
      return
    }
    
    // 3. RLS ტესტი
    const rlsOk = await testRLSPolicies(connection.role)
    
    // 4. მთავარი მონაცემების ჩატვირთვა
    addDiagnostic('📥 მონაცემების ჩატვირთვა', 'pending', 'profiles ცხრილიდან მონაცემების მიღება...')
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role, status, created_at, last_sign_in, user_metadata')
        .order('created_at', { ascending: false })
      
      if (error) {
        addDiagnostic('📥 მონაცემების ჩატვირთვა', 'error', `Supabase შეცდომა: ${error.message}`, error)
        setUsers([])
        setLoading(false)
        return
      }
      
      setRawData(data)
      addDiagnostic('📥 მონაცემების ჩატვირთვა', 'success', `✅ მიღებულია ${data?.length || 0} ჩანაწერი`, { count: data?.length })
      
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
        addDiagnostic('✨ ნორმალიზაცია', 'success', `✅ ${normalized.length} მომხმარე დამუშავებულია`)
      } else {
        setUsers([])
        addDiagnostic('⚠️ შედეგი', 'success', '📭 ცხრილი ცარიელია (არ არის დარეგისტრირებული მომხმარეები)')
      }
      
    } catch (err: any) {
      addDiagnostic('💥 კრიტიკული შეცდომა', 'error', `გამონაკლისი: ${err.message}`, err)
      setUsers([])
    } finally {
      setLoading(false)
      addDiagnostic('🏁 დასასრული', 'success', 'დიაგნოსტიკა დასრულდა')
    }
  }

  // 🔄 ავტომატური დიაგნოსტიკა დატვირთვისას
  useEffect(() => {
    fetchUsersWithDiagnostics()
  }, [])

  // 🎨 Helper კომპონენტები
  const StatusBadge = ({ status }: { status: 'pending' | 'success' | 'error' }) => {
    const colors = {
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      success: 'bg-green-500/20 text-green-400 border-green-500/30',
      error: 'bg-red-500/20 text-red-400 border-red-500/30'
    }
    const icons: Record<string, string> = { pending: '⏳', success: '✅', error: '❌' }
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${colors[status]}`}>
        {icons[status]} {status}
      </span>
    )
  }

  if (loading && diagnostics.length === 0) {
    return <div className="p-8 text-center text-gray-400">🔍 დიაგნოსტიკა იწყება...</div>
  }

  return (
    <div className="space-y-4">
      {/* 🔍 დიაგნოსტიკის პანელი */}
      <div className="bg-gray-800/80 border border-blue-500/30 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-blue-400">🔍 დიაგნოსტიკა: მომხმარებლების ტაბი</h2>
          <button onClick={fetchUsersWithDiagnostics} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-semibold transition">🔄 ხელახლა გაშვება</button>
        </div>
        
        {/* კავშირის ინფო */}
        {connectionTest && (
          <div className="mb-3 p-3 bg-gray-900/50 rounded-lg text-xs space-y-1">
            <p><strong>Supabase URL:</strong> {connectionTest.supabaseUrl}</p>
            <p><strong>დაკავშირებული:</strong> {connectionTest.isConnected ? '✅ კი' : '❌ არა'}</p>
            <p><strong>მიმდინარე მომხმარე:</strong> {connectionTest.currentUser?.email || '–'}</p>
            <p><strong>როლი:</strong> <span className={connectionTest.userRole ? 'text-green-400' : 'text-red-400'}>{connectionTest.userRole || '⚠️ არ არის მითითებული'}</span></p>
          </div>
        )}
        
        {/* ნაბიჯების ლოგი */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {diagnostics.map((d, i) => (
            <div key={i} className="flex items-start gap-2 p-2 bg-gray-900/30 rounded">
              <StatusBadge status={d.status} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-200">{d.step}</p>
                <p className="text-gray-400 text-[10px]">{d.message}</p>
                {d.data && (
                  <pre className="mt-1 p-2 bg-black/30 rounded text-[9px] text-gray-500 overflow-x-auto">
                    {JSON.stringify(d.data, null, 2).slice(0, 200)}
                    {JSON.stringify(d.data).length > 200 ? '...' : ''}
                  </pre>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 📊 ნედლი მონაცემები (თუ არსებობს) */}
      {rawData && rawData.length > 0 && (
        <details className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-4">
          <summary className="cursor-pointer font-medium text-gray-300 mb-2">📦 ნახე ნედლი მონაცემები ({rawData.length} ჩანაწერი)</summary>
          <pre className="p-3 bg-black/30 rounded text-[9px] text-gray-400 overflow-x-auto max-h-48">
            {JSON.stringify(rawData.slice(0, 3), null, 2)}
            {rawData.length > 3 && `\n... და კიდევ ${rawData.length - 3} ჩანაწერი`}
          </pre>
        </details>
      )}

      {/* 👥 მომხმარეების ცხრილი (თუ არის მონაცემები) */}
      {users.length > 0 && (
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead className="text-gray-400 uppercase bg-gray-900/40">
                <tr>
                  <th className="px-4 py-3 text-left">მომხმარე</th>
                  <th className="px-4 py-3 text-left">როლი</th>
                  <th className="px-4 py-3 text-left">სტატუსი</th>
                  <th className="px-4 py-3 text-left">რეგისტრაცია</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/30">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-700/20 transition">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-200">{user.user_metadata?.full_name || '–'}</p>
                      <p className="text-gray-500 text-[9px]">{user.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-gray-700/50 rounded text-[10px] text-gray-300">{user.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={user.status as any} />
                    </td>
                    <td className="px-4 py-3 text-gray-400">{new Date(user.created_at).toLocaleDateString('ka-GE')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ⚠️ თუ ცარიელია */}
      {users.length === 0 && (
        <div className="bg-gray-800/60 border border-yellow-500/30 rounded-xl p-6 text-center">
          <p className="text-yellow-400 font-medium mb-2">⚠️ მომხმარეები არ ჩანს</p>
          <p className="text-gray-500 text-sm">
            {diagnostics.some(d => d.status === 'error') 
              ? 'შეამოწმე დიაგნოსტიკის ლოგი ზემოთ შეცდომებისთვის' 
              : 'ალბათ "profiles" ცხრილი ცარიელია. გაუშვი სინქრონიზაციის სკრიპტი Supabase-ში.'}
          </p>
        </div>
      )}

      {/* 🔧 სწრაფი ფიქსების ბმულები */}
      <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-4">
        <h3 className="font-medium text-gray-300 mb-2">🔧 სწრაფი ფიქსები:</h3>
        <ul className="text-[10px] text-gray-400 space-y-1">
          <li>• <strong>Supabase SQL Editor:</strong> <a href="https://supabase.com/dashboard/project/_/sql" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">გახსენი</a></li>
          <li>• <strong>სინქრონიზაციის სკრიპტი:</strong> გაუშვი <code className="bg-gray-700 px-1 rounded">INSERT INTO profiles SELECT FROM auth.users...</code></li>
          <li>• <strong>RLS პოლიტიკა:</strong> დარწმუნდი რომ <code className="bg-gray-700 px-1 rounded">(auth.jwt()-&gt;&gt;&apos;role&apos;) = &apos;admin&apos;</code> მუშაობს</li>
          <li>• <strong>მეტამონაცემები:</strong> განაახლე ადმინის როლი: <code className="bg-gray-700 px-1 rounded">UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || {`{"role":"admin"}`} WHERE email = &apos;...&apos;</code></li>
        </ul>
      </div>
    </div>
  )
}