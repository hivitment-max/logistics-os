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

  // მონაცემების ჩატვირთვა
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [vRes, dRes, oRes, iRes, extDRes, extVRes, pcRes, cRes] = await Promise.all([
        supabase.from('vehicles').select('*').order('created_at', { ascending: false }),
        supabase.from('drivers').select('*').order('created_at', { ascending: false }),
        supabase.from('orders').select('*, drivers(full_name, phone), vehicles(plate_number, model)').order('created_at', { ascending: false }),
        
        // ✅ ახლა ვაბრუნებთ orders-თან კავშირს (order_id არსებობს ბაზაში):
        supabase.from('invoices')
          .select(`
            *,
            order_id,
            orders (
              tracking_code,
              cargo_description
            )
          `)
          .order('created_at', { ascending: false }),
        
        supabase.from('external_drivers').select('*').order('created_at', { ascending: false }),
        supabase.from('external_vehicles').select('*').order('created_at', { ascending: false }),
        supabase.from('private_clients').select('*').order('created_at', { ascending: false }),
        supabase.from('companies').select('*').order('created_at', { ascending: false })
      ])
      
      if (vRes.data) setVehicles(vRes.data)
      if (dRes.data) setDrivers(dRes.data)
      if (oRes.data) setOrders(oRes.data)
      if (iRes.data) setInvoices(iRes.data)
      if (extDRes.data) setExternalDrivers(extDRes.data)
      if (extVRes.data) setExternalVehicles(extVRes.data)
      if (pcRes.data) setPrivateClients(pcRes.data)
      if (cRes.data) setCompanies(cRes.data)
    } catch (error) {
      console.error('❌ Failed to load data:', error)
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