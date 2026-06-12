import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

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

  // მონაცემების ჩატვირთვა - ცალ-ცალკე რომ ერთმა error-მა სხვები არ დაბლოკოს
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      // 🚗 vehicles
      const vRes = await supabase.from('vehicles').select('*').order('created_at', { ascending: false })
      console.log('🚗 vehicles:', vRes.error?.message || '✅ OK', vRes.data?.length || 0)
      if (vRes.data) setVehicles(vRes.data)

      // 👨‍✈️ drivers
      const dRes = await supabase.from('drivers').select('*').order('created_at', { ascending: false })
      console.log('👨‍✈️ drivers:', dRes.error?.message || '✅ OK', dRes.data?.length || 0)
      if (dRes.data) setDrivers(dRes.data)

      // 📦 orders - ✅ განახლებული: დავაკონკრეტეთ FK-ები (ეს იყო მთავარი პრობლემა!)
      const oRes = await supabase.from('orders').select(`
        *,
        drivers:driver_id(full_name, phone),
        vehicles:vehicle_id(plate_number, model)
      `).order('created_at', { ascending: false })
      console.log('📦 orders:', oRes.error?.message || '✅ OK', oRes.data?.length || 0)
      if (oRes.data) setOrders(oRes.data)

      // 🧾 invoices - ✅ განახლებული: დავაკონკრეტეთ FK
      const iRes = await supabase.from('invoices')
        .select(`
          *,
          order_id,
          orders:order_id(tracking_code, cargo_description)
        `)
        .order('created_at', { ascending: false })
      console.log('🧾 invoices:', iRes.error?.message || '✅ OK', iRes.data?.length || 0)
      if (iRes.data) setInvoices(iRes.data)

      // 👨‍✈️ external_drivers
      const extDRes = await supabase.from('external_drivers').select('*').order('created_at', { ascending: false })
      console.log('👨‍✈️ external_drivers:', extDRes.error?.message || '✅ OK', extDRes.data?.length || 0)
      if (extDRes.data) setExternalDrivers(extDRes.data)

      // 🚗 external_vehicles
      const extVRes = await supabase.from('external_vehicles').select('*').order('created_at', { ascending: false })
      console.log('🚗 external_vehicles:', extVRes.error?.message || '✅ OK', extVRes.data?.length || 0)
      if (extVRes.data) setExternalVehicles(extVRes.data)

      // 👤 private_clients
      const pcRes = await supabase.from('private_clients').select('*').order('created_at', { ascending: false })
      console.log('👤 private_clients:', pcRes.error?.message || '✅ OK', pcRes.data?.length || 0)
      if (pcRes.data) setPrivateClients(pcRes.data)

      // 🏢 companies
      const cRes = await supabase.from('companies').select('*').order('created_at', { ascending: false })
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