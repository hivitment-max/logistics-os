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
        // 1. სესიის შემოწმება
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (isCancelled) return
        if (sessionError || !session) { 
          router.push('/login')
          return 
        }
        
        // 2. ✅ ახალი ლოგიკა: როლის წაკითხვა პირდაპირ public.profiles ცხრილიდან
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()

        if (isCancelled) return
        
        if (profileError || !profile) {
          console.error('Profile fetch error:', profileError)
          // უსაფრთხოებისთვის, თუ პროფილი ვერ მოიძებნა, ნაგულისხმევად client-ს ვტოვებთ
          setRole('client')
          return
        }

        // 3. როლის დაყენება ბაზიდან მიღებული მნიშვნელობით
        setRole(profile.role as Role)

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

      <main className="w-full h-full pt-2">
        {role === 'admin' && <AdminDashboard />}
        {role === 'manager' && <ManagerDashboard />}
        {role === 'accountant' && <AccountantDashboard />}
        {role === 'dispatcher' && <DispatcherDashboard />}
        {role === 'driver' && <DriverDashboard />}
        {/* შენიშვნა: client-ისთვის ცალკე გვერდია, სადაც redirect-ით მიდის */}
      </main>
    </div>
  )
}