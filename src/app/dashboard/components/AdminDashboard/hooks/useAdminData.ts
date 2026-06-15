import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

// 🔁 Retry helper - Supabase lock errors-ისთვის
async function withRetry<T>(
  fn: () => Promise<{ data: T | null; error: any }>,
  maxAttempts = 3,
  delayMs = 500
): Promise<{ data: T | null; error: any }> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await fn()
      if (!result.error) return result
      
      // თუ ეს lock error-ია, ვცადოთ ხელახლა
      const isLockError = 
        result.error?.message?.includes('Lock') ||
        result.error?.message?.includes('lock') ||
        result.error?.message?.includes('AbortError') ||
        result.error?.message?.includes('steal')
      
      if (isLockError && attempt < maxAttempts) {
        console.log(`🔄 [Retry ${attempt}/${maxAttempts}] Lock error detected, retrying in ${delayMs}ms...`)
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt))
        continue
      }
      
      return result
    } catch (err: any) {
      if (attempt < maxAttempts) {
        console.log(`🔄 [Retry ${attempt}/${maxAttempts}] Error: ${err.message}, retrying...`)
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt))
        continue
      }
      return { data: null, error: err }
    }
  }
  return { data: null, error: new Error('Max retries exceeded') }
}

export function useAdminData() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [notification, setNotification] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  
  // მონაცემების სტეიტები
  const [vehicles, setVehicles] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [externalDrivers, setExternalDrivers] = useState<any[]>([])
  const [externalVehicles, setExternalVehicles] = useState<any[]>([])
  const [privateClients, setPrivateClients] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])

  // ნოტიფიკაცია
  const showNotification = useCallback((msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 3000)
  }, [])

  // ავტორიზაცია & გამოსვლა
  useEffect(() => {
    supabase.auth.getUser().then((response) => setCurrentUser(response.data.user))
  }, [])

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }, [router])

  // მონაცემების ჩატვირთვა - retry logic-ით
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      // 🚗 vehicles (retry-ით)
      const vRes = await withRetry(() => 
        supabase.from('vehicles').select('*').order('created_at', { ascending: false })
      )
      console.log('🚗 vehicles:', vRes.error?.message || '✅ OK', vRes.data?.length || 0)
      if (vRes.data) setVehicles(vRes.data)

      // 👨‍✈️ drivers (retry-ით)
      const dRes = await withRetry(() => 
        supabase.from('drivers').select('*').order('created_at', { ascending: false })
      )
      console.log('👨‍✈️ drivers:', dRes.error?.message || '✅ OK', dRes.data?.length || 0)
      if (dRes.data) setDrivers(dRes.data)

      // 📦 orders (retry-ით)
      const oRes = await withRetry(() => 
        supabase.from('orders').select(`
          *,
          drivers:driver_id(full_name, phone),
          vehicles:vehicle_id(plate_number, model)
        `).order('created_at', { ascending: false })
      )
      console.log('📦 orders:', oRes.error?.message || '✅ OK', oRes.data?.length || 0)
      if (oRes.data) setOrders(oRes.data)

      // 🧾 invoices (retry-ით)
      const iRes = await withRetry(() => 
        supabase.from('invoices')
          .select(`
            *,
            order_id,
            orders:order_id(tracking_code, cargo_description)
          `)
          .order('created_at', { ascending: false })
      )
      console.log('🧾 invoices:', iRes.error?.message || '✅ OK', iRes.data?.length || 0)
      if (iRes.data) setInvoices(iRes.data)

      // 👨‍✈️ external_drivers (retry-ით)
      const extDRes = await withRetry(() => 
        supabase.from('external_drivers').select('*').order('created_at', { ascending: false })
      )
      console.log('👨‍✈️ external_drivers:', extDRes.error?.message || '✅ OK', extDRes.data?.length || 0)
      if (extDRes.data) setExternalDrivers(extDRes.data)

      // 🚗 external_vehicles (retry-ით)
      const extVRes = await withRetry(() => 
        supabase.from('external_vehicles').select('*').order('created_at', { ascending: false })
      )
      console.log('🚗 external_vehicles:', extVRes.error?.message || '✅ OK', extVRes.data?.length || 0)
      if (extVRes.data) setExternalVehicles(extVRes.data)

      // 👤 private_clients (retry-ით)
      const pcRes = await withRetry(() => 
        supabase.from('private_clients').select('*').order('created_at', { ascending: false })
      )
      console.log('👤 private_clients:', pcRes.error?.message || '✅ OK', pcRes.data?.length || 0)
      if (pcRes.data) setPrivateClients(pcRes.data)

      // 🏢 companies (retry-ით)
      const cRes = await withRetry(() => 
        supabase.from('companies').select('*').order('created_at', { ascending: false })
      )
      console.log('🏢 companies:', cRes.error?.message || '✅ OK', cRes.data?.length || 0)
      if (cRes.data) setCompanies(cRes.data)

    } catch (error: any) {
      console.error('❌ Failed to load data:', error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // ტაბის შეცვლისას მონაცემების განახლება
  useEffect(() => {
    const tabsThatNeedData = ['vehicles', 'drivers', 'orders', 'invoices', 'overview', 'kpi', 'invoice_templates', 'private_clients', 'companies', 'users']
    if (tabsThatNeedData.includes(activeTab)) {
      loadData()
    }
  }, [activeTab, loadData])

  // აუდიტის ლოგი
  const logAudit = useCallback(async (action: string, target: string, details: string) => {
    try {
      await supabase.from('audit_logs').insert([{
        action, 
        user_email: currentUser?.email || 'admin@logistics.ge', 
        target, 
        details, 
        timestamp: new Date().toISOString()
      }])
    } catch (err) { 
      console.warn('Audit log failed:', err) 
    }
  }, [currentUser])

  return {
    activeTab, setActiveTab,
    notification, showNotification,
    loading,
    currentUser, handleSignOut,
    vehicles, drivers, orders, invoices,
    externalDrivers, externalVehicles,
    privateClients, companies,
    loadData, logAudit
  }
}