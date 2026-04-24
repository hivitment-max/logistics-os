'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

import AdminDashboard from './components/AdminDashboard'
import ManagerDashboard from './components/ManagerDashboard'
import AccountantDashboard from './components/AccountantDashboard'
import DispatcherDashboard from './components/DispatcherDashboard'
import DriverDashboard from './components/DriverDashboard'
import ClientDashboard from './components/ClientDashboard'

type Role = 'admin' | 'manager' | 'accountant' | 'dispatcher' | 'driver' | 'client' | 'loading'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<Role>('loading')
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  useEffect(() => {
    let isCancelled = false
    const init = async () => {
      try {
        const { data: { session }, error: authError } = await supabase.auth.getSession()
        if (isCancelled) return
        if (authError || !session) { router.push('/login'); return }
        setUser(session.user)
        const userRole = (session.user.user_metadata?.role || 'client') as Role
        setRole(userRole)
      } catch (err: any) {
        console.error('Init error:', err.message)
        if (!isCancelled) setRole('client')
      }
    }
    init()
    return () => { isCancelled = true }
  }, [router])

  if (role === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-2xl animate-pulse">🔄 იტვირთება...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg text-white font-medium transition-all ${
          notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {notification.message}
        </div>
      )}

      <main className="w-full h-full">
        {role === 'admin' && <AdminDashboard />}
        {role === 'manager' && <ManagerDashboard user={user} setNotification={setNotification} />}
        {role === 'accountant' && <AccountantDashboard user={user} setNotification={setNotification} />}
        {role === 'dispatcher' && <DispatcherDashboard user={user} setNotification={setNotification} />}
        {role === 'driver' && <DriverDashboard user={user} setNotification={setNotification} />}
        {role === 'client' && <ClientDashboard user={user} setNotification={setNotification} />}
      </main>
    </div>
  )
}
