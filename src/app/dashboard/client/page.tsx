'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import LoadingTruck from '@/app/dashboard/components/ui/LoadingTruck'

// 📂 TABS IMPORTS
import ClientOverviewTab from './tabs/ClientOverviewTab'
import MyOrdersTab from './tabs/MyOrdersTab'
import NewOrderTab from './tabs/NewOrderTab'
import TrackingTab from './tabs/TrackingTab'
import ClientInvoicesTab from './tabs/ClientInvoicesTab'
import ProfileTab from './tabs/ProfileTab'
import NotificationsTab from './tabs/NotificationsTab'
import SettingsTab from './tabs/SettingsTab'

// ============================================================================
// 👤 CLIENT SIDEBAR COMPONENT
// ============================================================================
const ClientSidebar = ({ activeTab, setActiveTab, onSignOut }: {
  activeTab: string
  setActiveTab: (tab: string) => void
  onSignOut: () => void
}) => {
  const menuItems = [
    { id: 'overview', icon: '📊', label: 'მიმოხილვა' },
    { id: 'my_orders', icon: '📦', label: 'ჩემი შეკვეთები' },
    { id: 'new_order', icon: '🚀', label: 'ახალი შეკვეთა' },
    { id: 'tracking', icon: '📍', label: 'ტრეკინგი' },
    { id: 'invoices', icon: '🧾', label: 'ინვოისები' },
    { id: 'profile', icon: '👤', label: 'პროფილი' },
    { id: 'notifications', icon: '🔔', label: 'შეტყობინებები' },
    { id: 'settings', icon: '⚙️', label: 'პარამეტრები' },
  ]

  return (
    <aside className="w-52 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
      <div className="h-11 flex items-center px-3 border-b border-gray-800">
        <span className="text-xs font-bold text-blue-400 tracking-wide">🚛 LOGISTICS OS</span>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-2 px-1.5 space-y-0.5">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-all text-[11px] ${
              activeTab === item.id 
                ? 'bg-blue-600/90 text-white shadow-sm' 
                : 'text-gray-500 hover:bg-gray-800/60 hover:text-gray-300'
            }`}
          >
            <span className="text-sm w-4 text-center shrink-0">{item.icon}</span>
            <span className="truncate">{item.label}</span>
          </button>
        ))}
      </nav>
      
      <div className="p-3 border-t border-gray-800 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* ✅ მრგვალი იკონკა - ახლა clickable! */}
            <button
              onClick={() => setActiveTab('profile')}
              className="w-7 h-7 rounded-full bg-gradient-to-tr from-green-400 to-emerald-500 flex items-center justify-center text-[10px] font-bold shadow-md shrink-0 hover:scale-110 transition-transform cursor-pointer"
              title="პროფილი"
            >
              👤
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium truncate text-gray-300">კლიენტი</p>
            </div>
          </div>
          <button onClick={onSignOut} className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-lg transition" title="გასვლა">🚪</button>
        </div>
      </div>
    </aside>
  )
}

// ============================================================================
// 👤 CLIENT DASHBOARD MAIN COMPONENT
// ============================================================================
export default function ClientDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [notification, setNotification] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  
  // 📦 Data States
  const [orders, setOrders] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [trackingData, setTrackingData] = useState<any[]>([])

  const showNotification = useCallback((msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 3000)
  }, [])

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('userRole')
    router.push('/login')
  }, [router])

  // 🔐 როლის და მონაცემების ჩატვირთვა
  useEffect(() => {
    const loadClientData = async () => {
      try {
        const response = await supabase.auth.getSession()
        const session = response.data?.session
        const error = response.error
        
        if (!session || error) {
          router.push('/login')
          return
        }

        setCurrentUser(session.user)

        // 🔵 ჩავტვირთოთ მხოლოდ ამ კლიენტის მონაცემები
        const [oRes, iRes, tRes] = await Promise.all([
          supabase.from('orders').select('*').eq('client_email', session.user.email).order('created_at', { ascending: false }),
          supabase.from('invoices').select('*').eq('client_email', session.user.email).order('created_at', { ascending: false }),
          supabase.from('tracking_events').select('*').eq('client_email', session.user.email).order('created_at', { ascending: false }).limit(10),
        ])
        
        if (oRes.data) setOrders(oRes.data)
        if (iRes.data) setInvoices(iRes.data)
        if (tRes.data) setTrackingData(tRes.data)

      } catch (error) {
        console.error('❌ [ClientDashboard] Error:', error)
        showNotification('❌ მონაცემების ჩატვირთვა ვერ მოხერხდა')
      } finally {
        setLoading(false)
      }
    }

    loadClientData()
  }, [router, showNotification])

  // 🔵 Helper: სტატუსის ფერი
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered': case 'paid': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'pending': case 'in_transit': case 'sent': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'cancelled': case 'overdue': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  // 🔵 Helper: ActionButtons
  const ActionButtons = ({ onView, onPrint }: { onView?: () => void; onPrint?: () => void }) => (
    <div className="flex items-center justify-end gap-1">
      {onPrint && (
        <button onClick={onPrint} className="p-1.5 text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 rounded-md transition" title="დაბეჭდვა">🖨️</button>
      )}
      {onView && (
        <button onClick={onView} className="p-1.5 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-md transition" title="ნახვა">👁️</button>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <LoadingTruck message="კლიენტის პანელი იტვირთება..." size="lg" />
      </div>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <ClientOverviewTab orders={orders} invoices={invoices} trackingData={trackingData} getStatusColor={getStatusColor} onNavigateToOrders={() => setActiveTab('my_orders')} onNavigateToNewOrder={() => setActiveTab('new_order')} />
      
      // ✅ განახლებული MyOrdersTab - ახალი props-ებით
      case 'my_orders':
        return (
          <MyOrdersTab 
            orders={orders} 
            loading={loading} 
            onStatusChange={() => {}} 
            onView={(o: any) => showNotification(`👁️ შეკვეთა: ${o.tracking_code}`)} 
            getStatusColor={getStatusColor} 
            ActionButtons={ActionButtons}
            // 🆕 ახალი props: რედაქტირებისას orders-ის განახლება
            onUpdate={(updatedOrder: any) => {
              setOrders(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o))
              showNotification('✅ შეკვეთა განახლდა!')
            }}
            // 🆕 ახალი props: წაშლისას orders-დან ამოღება
            onDelete={(orderId: string) => {
              setOrders(orders.filter(o => o.id !== orderId))
              showNotification('🗑️ შეკვეთა წაიშალა!')
            }}
          />
        )
      
      case 'new_order':
        return <NewOrderTab onCreateOrder={(order: any) => { showNotification('✅ შეკვეთა შეიქმნა!'); setOrders([order, ...orders]); setActiveTab('my_orders'); }} />
      case 'tracking':
        return <TrackingTab trackingData={trackingData} onRefresh={() => {}} />
      case 'invoices':
        return <ClientInvoicesTab invoices={invoices} loading={loading} onView={(i: any) => showNotification(`🧾 ინვოისი: ${i.invoice_number}`)} onDownload={(i: any) => showNotification(`📥 ჩამოტვირთვა: ${i.invoice_number}`)} getStatusColor={getStatusColor} ActionButtons={ActionButtons} />
      case 'profile':
        return <ProfileTab user={currentUser} onUpdate={(data: any) => { showNotification('✅ პროფილი განახლდა!'); setCurrentUser({ ...currentUser, ...data }); }} />
      case 'notifications':
        return <NotificationsTab notifications={notifications} onMarkRead={(id: any) => setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n))} />
      case 'settings':
        return <SettingsTab user={currentUser} onSignOut={handleSignOut} />
      default:
        return <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-6 text-center"><h3 className="text-sm font-bold mb-1">გვერდი მზადდება...</h3><p className="text-[10px] text-gray-500">მალე დაემატება</p></div>
    }
  }

  const getCurrentItem = () => {
    const items = [
      { id: 'overview', icon: '📊', label: 'მიმოხილვა' },
      { id: 'my_orders', icon: '📦', label: 'ჩემი შეკვეთები' },
      { id: 'new_order', icon: '🚀', label: 'ახალი შეკვეთა' },
      { id: 'tracking', icon: '📍', label: 'ტრეკინგი' },
      { id: 'invoices', icon: '🧾', label: 'ინვოისები' },
      { id: 'profile', icon: '👤', label: 'პროფილი' },
      { id: 'notifications', icon: '🔔', label: 'შეტყობინებები' },
      { id: 'settings', icon: '⚙️', label: 'პარამეტრები' },
    ]
    return items.find(i => i.id === activeTab) || { icon: '📄', label: 'გვერდი' }
  }
  const currentItem = getCurrentItem()

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      {notification && (
        <div className="fixed top-3 right-3 z-50 bg-gray-800 border border-gray-600 text-white px-4 py-2 rounded-lg shadow-xl text-xs flex items-center gap-2 animate-pulse">
          {notification}
        </div>
      )}

      <ClientSidebar activeTab={activeTab} setActiveTab={setActiveTab} onSignOut={handleSignOut} />

      <main className="flex-1 overflow-y-auto bg-gray-950 flex flex-col">
        <header className="sticky top-0 z-10 bg-gray-950/90 backdrop-blur border-b border-gray-800/50 px-5 py-2">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-sm font-bold flex items-center gap-2 text-gray-100">
                {currentItem.icon} {currentItem.label}
              </h1>
            </div>
            <button onClick={() => showNotification('🔔 ახალი შეტყობინებები')} className="relative p-1.5 hover:bg-gray-800 rounded-lg transition">
              <span className="text-lg leading-none">🔔</span>
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
          </div>
        </header>
        
        <div className="flex-1 p-4 space-y-4">
          {renderContent()}
        </div>
      </main>
    </div>
  )
}