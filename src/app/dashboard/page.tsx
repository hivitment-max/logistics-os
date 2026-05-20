'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

import AdminDashboard from './components/AdminDashboard'
import ManagerDashboard from './components/ManagerDashboard'
import AccountantDashboard from './components/AccountantDashboard'
import DispatcherDashboard from './components/DispatcherDashboard'
import DriverDashboard from './components/DriverDashboard'

type Role = 'admin' | 'manager' | 'accountant' | 'dispatcher' | 'driver' | 'client' | 'loading'

export default function DashboardPage() {
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
    if (role === 'client') {
      router.push('/dashboard/client')
    }
  }, [role, router])

  useEffect(() => {
    let isCancelled = false
    const init = async () => {
      try {
        // ✅ TS-უსაფრთხო გზა: ჯერ ვიღებთ მთლიან response-ს
        const response = await supabase.auth.getSession()
        const session = response.data?.session
        const error = response.error
        
        if (isCancelled) return
        if (error || !session) { router.push('/login'); return }
        
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

      {/* 🧪 TEST MARKER - ახალი დეპლოის ვერიფიკაცია */}
      <div style={{position:'fixed',top:0,left:0,right:0,zIndex:9999,background:'linear-gradient(90deg,#dc2626,#ef4444)',color:'white',padding:'8px 16px',textAlign:'center',fontWeight:'bold',fontSize:'14px',boxShadow:'0 2px 8px rgba(0,0,0,0.3)'}}>
        ✅ TEST 123 - NEW DEPLOY - {new Date().toLocaleDateString('ka-GE')} - v2.0
      </div>

      <main className="w-full h-full pt-10">
        {role === 'admin' && <AdminDashboard />}
        {role === 'manager' && <ManagerDashboard />}
        {role === 'accountant' && <AccountantDashboard />}
        {role === 'dispatcher' && <DispatcherDashboard />}
        {role === 'driver' && <DriverDashboard />}
      </main>
    </div>
  )
}