'use client'

// ✅ React-ის საჭირო იმპორტები
import { useState, useCallback, useRef, FormEvent } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

// ✅ ჰუკების იმპორტები
import { useAdminData } from './hooks/useAdminData'
import { useVehicles } from './hooks/useVehicles'
import { useDrivers } from './hooks/useDrivers'
import { useOrders } from './hooks/useOrders'
import { useInvoices } from './hooks/useInvoices'
import { usePrivateClients } from './hooks/usePrivateClients'
import { useCompanies } from './hooks/useCompanies'

// 📂 TABS IMPORTS - გზები გამოსწორებულია (../ = ერთი დონით ზემოთ)
import OverviewTab from '../tabs/OverviewTab'
import KpiTab from '../tabs/KpiTab'
import VehiclesTab from '../tabs/VehiclesTab'
import DriversTab from '../tabs/DriversTab'
import OrdersTab from '../tabs/OrdersTab'
import InvoicesTab from '../tabs/InvoicesTab'
import TemplateBuilder from '../templates/TemplateBuilder'
import PrivateClientsTab from '../tabs/PrivateClientsTab'
import CompaniesTab from '../tabs/CompaniesTab'
import UsersTab from '../tabs/UsersTab'
import RolesTab from '../tabs/RolesTab'
import TrackingTab from '../tabs/TrackingTab'
import AuditTab from '../tabs/AuditTab'
import PayrollTab from '../tabs/PayrollTab'
import SettingsTab from '../tabs/SettingsTab' // ✅ ახალი: SettingsTab იმპორტი

// ============================================================================
// 🧩 Helper: FormField
// ============================================================================
const FormField = ({ label, hint, required, type = 'text', value, onChange, options, textarea }: any) => (
  <div className={textarea ? "col-span-1 md:col-span-2" : ""}>
    <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wide">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {textarea ? (
      <textarea rows={3} value={value} onChange={onChange} placeholder={hint} className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition resize-none" />
    ) : options ? (
      <select value={value ?? ''} onChange={onChange} className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500 transition">
        {options.map((opt: any) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    ) : (
      <input type={type} value={value ?? ''} onChange={onChange} placeholder={hint} required={required} className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" />
    )}
  </div>
)

// 🎨 Section Header Component
const SectionHeader = ({ title, icon, color }: { title: string, icon: string, color: string }) => (
  <div className={`flex items-center gap-2 mb-4 pb-2 border-b border-gray-700/50 ${color}`}>
    <span className="text-lg">{icon}</span>
    <h3 className="text-xs font-bold uppercase tracking-wider">{title}</h3>
  </div>
)

// ============================================================================
// 👑 ADMIN DASHBOARD
// ============================================================================
export default function AdminDashboard() {
  // ✅ ძირითადი მონაცემები და ლოგიკა
  const {
    activeTab, setActiveTab,
    notification, showNotification,
    loading,
    currentUser, handleSignOut,
    vehicles: vehiclesData, drivers, orders, invoices,
    externalDrivers, externalVehicles,
    privateClients, companies,
    loadData, logAudit
  } = useAdminData()

  // ✅ მანქანების მთელი ლოგიკა ახლა ამ ჰუკიდან მოდის
  const vehicles = useVehicles({ showNotification, loadData })

  // ✅ მძღოლების მთელი ლოგიკა ახლა ამ ჰუკიდან მოდის
  const driversHook = useDrivers({ showNotification, loadData, vehicles: vehiclesData })

  // ✅ შეკვეთების მთელი ლოგიკა ახლა ამ ჰუკიდან მოდის
  const ordersHook = useOrders({ 
    showNotification, 
    loadData, 
    logAudit,
    externalDrivers,
    externalVehicles,
    privateClients,
    companies
  })

  // ✅ ინვოისების მთელი ლოგიკა ახლა ამ ჰუკიდან მოდის
  const invoicesHook = useInvoices({ showNotification, loadData, logAudit, invoices })

  // ✅ კერძო პირების მთელი ლოგიკა ახლა ამ ჰუკიდან მოდის
  const privateClientsHook = usePrivateClients({ showNotification, loadData })

  // ✅ კომპანიების მთელი ლოგიკა ახლა ამ ჰუკიდან მოდის
  const companiesHook = useCompanies({ showNotification, loadData })

  const isAdmin = currentUser?.user_metadata?.role === 'admin'

  // ✅ განახლებული მენიუ
  const menuStructure = [
    { category: 'მთავარი', items: [{ id: 'overview', icon: '📈', label: 'მიმოხილვა' }, { id: 'kpi', icon: '🎯', label: 'KPI & ანალიტიკა' }]},
    { category: 'მომხმარებლები', items: [ ...(isAdmin ? [{ id: 'users', icon: '👥', label: 'მომხმარებლები' }] : []), { id: 'roles', icon: '🔑', label: 'როლები' } ]},
    { category: 'ფლოტი & რეისები', items: [{ id: 'vehicles', icon: '🚐', label: 'მანქანები' }, { id: 'drivers', icon: '👨‍✈️', label: 'მძღოლები' }, { id: 'orders', icon: '📦', label: 'შეკვეთები' }, { id: 'tracking', icon: '📍', label: 'ტრეკინგი' }]},
    { category: 'დამკვეთები', items: [{ id: 'private_clients', icon: '👤', label: 'კერძო პირი' }, { id: 'companies', icon: '🏢', label: 'კომპანია' }]},
    { category: 'ფინანსები', items: [{ id: 'invoices', icon: '🧾', label: 'ინვოისები' }, { id: 'invoice_templates', icon: '🎨', label: 'ინვოისის შაბლონები' }, { id: 'payroll', icon: '💸', label: 'Payroll' }]},
    { category: 'სისტემა', items: [{ id: 'audit', icon: '📜', label: 'აუდიტი' }, { id: 'api', icon: '🔌', label: 'API' }, { id: 'settings', icon: '⚙️', label: 'პარამეტრები' }]},
  ]

  // 🖨️ ActionButtons
  const ActionButtons = ({ onEdit, onDelete, onPrint }: { onEdit: () => void; onDelete: () => void; onPrint?: () => void }) => (
    <div className="flex items-center justify-end gap-1">
      {onPrint && <button onClick={onPrint} className="p-1.5 text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 rounded-md transition" title="დაბეჭდვა">🖨️</button>}
      <button onClick={onEdit} className="p-1.5 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-md transition" title="რედაქტირება">✏️</button>
      <button onClick={onDelete} className="p-1.5 text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-md transition" title="წაშლა">🗑️</button>
    </div>
  )

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': case 'delivered': case 'paid': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'idle': case 'pending': case 'sent': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'maintenance': case 'cancelled': case 'overdue': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'in_transit': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getCurrentItem = () => menuStructure.flatMap((g: any) => g.items).find((i: any) => i.id === activeTab) || { icon: '📄', label: 'გვერდი' }
  const currentItem = getCurrentItem()

  const renderContent = () => {
    if (activeTab === 'overview') return <OverviewTab orders={orders} invoices={invoices} vehicles={vehiclesData} drivers={drivers} getStatusColor={getStatusColor} onNavigateToVehicles={() => setActiveTab('vehicles')} onNavigateToKpi={() => setActiveTab('kpi')} />
    if (activeTab === 'kpi') return <KpiTab orders={orders} invoices={invoices} vehicles={vehiclesData} drivers={drivers} loading={loading} />
    
    if (activeTab === 'users') {
      if (!isAdmin) return <div className="flex flex-col items-center justify-center h-[60vh] text-center"><span className="text-6xl mb-4">🚫</span><h3 className="text-xl font-bold text-red-400">წვდომა აკრძალულია</h3><p className="text-gray-500 text-sm mt-2">მომხმარებლების მართვა მხოლოდ ადმინისტრატორს შეუძლია.</p></div>
      return <UsersTab setNotification={(n: any) => showNotification(n.message)} />
    }
    
    // ✅ Roles Tab
    if (activeTab === 'roles') return <RolesTab />
    
    // ✅ Tracking Tab
    if (activeTab === 'tracking') return <TrackingTab />
    
    // ✅ Audit Tab
    if (activeTab === 'audit') return <AuditTab />
    
    // ✅ Payroll Tab
    if (activeTab === 'payroll') return <PayrollTab />
    
    // ✅ ახალი: Settings Tab
    if (activeTab === 'settings') return <SettingsTab />
    
    // ✅ VehiclesTab
    if (activeTab === 'vehicles') return (
      <VehiclesTab 
        vehicles={vehiclesData} 
        loading={loading} 
        onEdit={vehicles.handleEditVehicleClick} 
        onDelete={vehicles.handleDeleteVehicleClick} 
        onAdd={() => vehicles.setShowAddVehicleModal(true)} 
        getStatusColor={getStatusColor} 
        ActionButtons={ActionButtons} 
        onPrint={invoicesHook.handlePrintVehicle} 
      />
    )
    
    // ✅ DriversTab
    if (activeTab === 'drivers') return (
      <DriversTab 
        drivers={drivers} 
        loading={loading} 
        onEdit={driversHook.handleEditDriverClick} 
        onDelete={driversHook.handleDeleteDriverClick} 
        onAdd={() => driversHook.setShowAddDriverModal(true)} 
        onAssignVehicle={driversHook.handleAssignVehicle} 
        getStatusColor={getStatusColor} 
        ActionButtons={ActionButtons} 
        onPrint={invoicesHook.handlePrintDriver} 
      />
    )
    
    // ✅ OrdersTab
    if (activeTab === 'orders') return (
      <OrdersTab 
        orders={orders} 
        loading={loading} 
        orderFilter={ordersHook.orderFilter} 
        setOrderFilter={ordersHook.setOrderFilter} 
        onStatusChange={ordersHook.handleStatusChange} 
        onEdit={ordersHook.handleEditOrderClick} 
        onDelete={ordersHook.handleDeleteOrderClick} 
        onAdd={() => ordersHook.setShowOrderModal(true)} 
        onCreateInvoice={invoicesHook.handleCreateInvoice} 
        getStatusColor={getStatusColor} 
        ActionButtons={ActionButtons} 
      />
    )
    
    // ✅ InvoicesTab
    if (activeTab === 'invoices') return (
      <InvoicesTab 
        invoices={invoices} 
        loading={loading} 
        invoiceFilter={invoicesHook.invoiceFilter} 
        setInvoiceFilter={invoicesHook.setInvoiceFilter} 
        onStatusChange={invoicesHook.handleInvoiceStatusChange} 
        onView={(i: any) => { invoicesHook.setSelectedInvoice(i); invoicesHook.setShowInvoiceModal(true); }} 
        onEmail={(i: any) => { invoicesHook.setSelectedInvoice(i); invoicesHook.setEmailTo(i.client_email || ''); invoicesHook.setShowEmailModal(true); }} 
        getStatusColor={getStatusColor} 
      />
    )
    
    // ✅ PrivateClientsTab
    if (activeTab === 'private_clients') return (
      <PrivateClientsTab 
        clients={privateClients} 
        loading={loading} 
        onEdit={privateClientsHook.handleEditPrivateClientClick} 
        onDelete={privateClientsHook.handleDeletePrivateClientClick} 
        onAdd={() => privateClientsHook.setShowAddPrivateClientModal(true)} 
        ActionButtons={ActionButtons} 
      />
    )
    
    // ✅ CompaniesTab
    if (activeTab === 'companies') return (
      <CompaniesTab 
        companies={companies} 
        loading={loading} 
        onEdit={companiesHook.handleEditCompanyClick} 
        onDelete={companiesHook.handleDeleteCompanyClick} 
        onAdd={() => companiesHook.setShowAddCompanyModal(true)} 
        ActionButtons={ActionButtons} 
      />
    )
    
    if (activeTab === 'invoice_templates') return <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-5 min-h-[600px]"><TemplateBuilder onSave={() => setActiveTab('invoices')} /></div>
    return <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-6 text-center"><h3 className="text-sm font-bold mb-1">{currentItem.label}</h3><p className="text-[10px] text-gray-500">კონტენტი მზადდება...</p></div>
  }

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      {notification && <div className="fixed top-3 right-3 z-50 bg-gray-800 border border-gray-600 text-white px-4 py-2 rounded-lg shadow-xl text-xs flex items-center gap-2">{notification}</div>}

      <aside className="w-52 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
        <div className="h-11 flex items-center px-3 border-b border-gray-800"><span className="text-xs font-bold text-blue-400 tracking-wide">🚛 LOGISTICS OS</span></div>
        <nav className="flex-1 overflow-y-auto py-2 px-1.5 space-y-0.5">
          {menuStructure.map((group: any) => (<div key={group.category} className="mb-2"><p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest px-2 mb-1">{group.category}</p>{group.items.map((item: any) => (<button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-all text-[11px] ${activeTab === item.id ? 'bg-blue-600/90 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-800/60 hover:text-gray-300'}`}><span className="text-sm w-4 text-center shrink-0">{item.icon}</span><span className="truncate">{item.label}</span></button>))}</div>))}
        </nav>
        <div className="p-3 border-t border-gray-800 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0"><div className="w-7 h-7 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 flex items-center justify-center text-[10px] font-bold shadow-md shrink-0">A</div><div className="flex-1 min-w-0"><p className="text-[10px] font-medium truncate text-gray-300">{currentUser?.email || 'admin@logistics.ge'}</p></div></div>
            <button onClick={handleSignOut} className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-lg transition">🚪</button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-gray-950 flex flex-col">
        <header className="sticky top-0 z-10 bg-gray-950/90 backdrop-blur border-b border-gray-800/50 px-5 py-2"><div className="flex justify-between items-center"><div><h1 className="text-sm font-bold flex items-center gap-2 text-gray-100">{currentItem.icon} {currentItem.label}</h1></div><button onClick={() => showNotification('🔔 ახალი შეტყობინებები')} className="relative p-1.5 hover:bg-gray-800 rounded-lg transition"><span className="text-lg leading-none">🔔</span></button></div></header>
        <div className="flex-1 p-4 space-y-4">{renderContent()}</div>
      </main>

      {/* 🚗 ADD VEHICLE MODAL */}
      {vehicles.showAddVehicleModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => vehicles.setShowAddVehicleModal(false)}>
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center bg-gray-800"><h3 className="text-sm font-bold text-white flex items-center gap-2">🚐 ახალი მანქანის რეგისტრაცია</h3><button onClick={() => vehicles.setShowAddVehicleModal(false)} className="text-gray-400 hover:text-white text-xl transition">&times;</button></div>
            <form onSubmit={vehicles.handleAddVehicle} className="p-5 overflow-y-auto space-y-5">
              <div className="bg-gray-900/20 p-4 rounded-xl border border-gray-700/50"><SectionHeader title="კრიტიკულად აუცილებელი (სავალდებულო)" icon="🔴" color="text-red-400" /><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><FormField label="სანომრე ნიშანი" hint="AA-123-BB" required value={vehicles.vehicleForm.plate_number} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, plate_number:e.target.value})} /><FormField label="VIN კოდი" hint="17 სიმბოლო" required value={vehicles.vehicleForm.vin_number} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, vin_number:e.target.value})} /><FormField label="ტექ. პასპორტი / სკანი" hint="ფაილის სახელი ან URL" required value={vehicles.vehicleForm.tech_passport} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, tech_passport:e.target.value})} /><FormField label="PTI ვადა" type="date" required value={vehicles.vehicleForm.pti_expiry} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, pti_expiry:e.target.value})} /><FormField label="სამოქალაქო დაზღვევა" hint="პოლისის ნომერი" required value={vehicles.vehicleForm.insurance_policy} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, insurance_policy:e.target.value})} /><FormField label="CMR დაზღვევა" hint="ტვირთის დაზღვევა" value={vehicles.vehicleForm.insurance_cmre_policy} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, insurance_cmre_policy:e.target.value})} /><FormField label="მფლობელი" hint="სახელი/კომპანია" required value={vehicles.vehicleForm.owner_name} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, owner_name:e.target.value})} /><FormField label="მფლობელის ტიპი" options={[{value:'company',label:'🏢 კომპანია'},{value:'individual',label:'👤 ფიზიკური პირი'}]} value={vehicles.vehicleForm.owner_type} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, owner_type:e.target.value})} /><FormField label="მინდობილობა" hint="თუ მძღოლი არ არის მესაკუთრე" value={vehicles.vehicleForm.power_of_attorney} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, power_of_attorney:e.target.value})} /></div></div>
              <div className="bg-gray-900/20 p-4 rounded-xl border border-gray-700/50"><SectionHeader title="საოპერაციო მონაცემები" icon="🟡" color="text-yellow-400" /><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><FormField label="მოდელი" required value={vehicles.vehicleForm.model} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, model:e.target.value})} /><FormField label="სატრანსპორტო ტიპი" required options={[{value:'truck',label:'🚛 სატვირთო'},{value:'van',label:'🚐 ფურგონი'},{value:'car',label:'🚗 მსუბუქი'}]} value={vehicles.vehicleForm.type} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, type:e.target.value})} /><FormField label="ძარის ტიპი" options={[{value:'tent',label:'🟦 ტენტი'},{value:'refrigerated',label:'❄️ მაცივარი'},{value:'container',label:'📦 კონტეინერი'},{value:'flatbed',label:'🔩 პლატფორმა'},{value:'bulk',label:'🌾 ნაყარი'}]} value={vehicles.vehicleForm.body_type} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, body_type:e.target.value})} /><FormField label="ტვირთამწეობა (კგ)" type="number" value={vehicles.vehicleForm.capacity_kg} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, capacity_kg:e.target.value})} /><FormField label="მოცულობა (m³)" type="number" value={vehicles.vehicleForm.volume_m3} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, volume_m3:e.target.value})} /><div className="grid grid-cols-3 gap-2"><FormField label="სიგრძე (მ)" type="number" value={vehicles.vehicleForm.length_m} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, length_m:e.target.value})} /><FormField label="სიგანე (მ)" type="number" value={vehicles.vehicleForm.width_m} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, width_m:e.target.value})} /><FormField label="სიმაღლე (მ)" type="number" value={vehicles.vehicleForm.height_m} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, height_m:e.target.value})} /></div><FormField label="ADR კლასი" hint="სახიფათო ტვირთი (1-9)" value={vehicles.vehicleForm.adr_class} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, adr_class:e.target.value})} /><FormField label="EURO სტანდარტი" options={[{value:'5',label:'EURO 5'},{value:'6',label:'EURO 6'},{value:'EEV',label:'EEV'}]} value={vehicles.vehicleForm.euro_standard} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, euro_standard:e.target.value})} /><div className="flex items-center gap-4 p-3 bg-gray-700/30 rounded-lg border border-gray-600 col-span-3"><div className="flex items-center gap-2"><input type="checkbox" checked={vehicles.vehicleForm.has_tail_lift} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, has_tail_lift:e.target.checked})} className="w-4 h-4 accent-blue-500" /><label className="text-xs text-gray-300">ლიფტი (Tail lift)</label></div><FormField label="ღვედების რაოდენობა" type="number" value={vehicles.vehicleForm.straps_count} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, straps_count:e.target.value})} /></div></div></div>
              <div className="bg-gray-900/20 p-4 rounded-xl border border-gray-700/50"><SectionHeader title="ტექნოლოგიური & მონიტორინგი" icon="🔵" color="text-blue-400" /><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><FormField label="GPS მოწყობილობის ID" value={vehicles.vehicleForm.gps_device_id} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, gps_device_id:e.target.value})} /><div className="flex items-center gap-2 p-3 bg-gray-700/30 rounded-lg border border-gray-600"><input type="checkbox" checked={vehicles.vehicleForm.has_fuel_sensor} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, has_fuel_sensor:e.target.checked})} className="w-4 h-4 accent-green-500" /><label className="text-xs text-gray-300">საწვავის კონტროლი</label></div><FormField label="ფოტოები (URL)" hint="გამოყოფილი მძიმით" textarea value={vehicles.vehicleForm.photo_urls} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, photo_urls:e.target.value})} /><FormField label="საბურავების სეზონი" options={[{value:'summer',label:'☀️ ზაფხული'},{value:'winter',label:'❄️ ზამთარი'},{value:'all_season',label:'🌤️ ყველა სეზონი'}]} value={vehicles.vehicleForm.tire_season} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, tire_season:e.target.value})} /><FormField label="საბურავების მდგომარეობა" options={[{value:'new',label:'🟢 ახალი'},{value:'good',label:'🟡 კარგი'},{value:'replace_soon',label:'🟠 მალე შესაცვლელი'},{value:'replace_now',label:'🔴 დაუყოვნებლივ'}]} value={vehicles.vehicleForm.tire_condition} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, tire_condition:e.target.value})} /><FormField label="სტატუსი" required options={[{value:'active',label:'🟢 აქტიური'},{value:'idle',label:'🟡 ოდინში'},{value:'maintenance',label:'🔧 რემონტში'},{value:'inactive',label:'⚫ არააქტიური'}]} value={vehicles.vehicleForm.status} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, status:e.target.value})} /></div></div>
              <div className="flex gap-3 pt-4 border-t border-gray-700 mt-2"><button type="button" onClick={() => vehicles.setShowAddVehicleModal(false)} className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-medium transition">გაუქმება</button><button type="submit" className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-bold transition shadow-lg shadow-blue-500/20">💾 შენახვა</button></div>
            </form>
          </div>
        </div>
      )}

      {/* 🚗 EDIT VEHICLE MODAL */}
      {vehicles.showEditVehicleModal && vehicles.editingVehicle && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => vehicles.setShowEditVehicleModal(false)}>
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center bg-gray-800"><h3 className="text-sm font-bold text-white flex items-center gap-2">🚐 მანქანის რედაქტირება</h3><button onClick={() => vehicles.setShowEditVehicleModal(false)} className="text-gray-400 hover:text-white text-xl transition">&times;</button></div>
            <form onSubmit={vehicles.handleSaveEditVehicle} className="p-5 overflow-y-auto space-y-6">
              <section><h4 className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-gray-700/50 pb-2">🔴 აუცილებელი ინფორმაცია</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><FormField label="სანომრე ნიშანი" hint="მაგ: AA-123-BB" required value={vehicles.editVehicleForm.plate_number} onChange={(e:any)=>vehicles.setEditVehicleForm({...vehicles.editVehicleForm, plate_number:e.target.value})} /><FormField label="მარკა და მოდელი" hint="მაგ: Mercedes Actros" required value={vehicles.editVehicleForm.model} onChange={(e:any)=>vehicles.setEditVehicleForm({...vehicles.editVehicleForm, model:e.target.value})} /></div></section>
              <div className="flex gap-3 pt-4 border-t border-gray-700 mt-2"><button type="button" onClick={() => vehicles.setShowEditVehicleModal(false)} className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-medium transition">გაუქმება</button><button type="submit" className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-bold transition shadow-lg shadow-blue-500/20">💾 განახლება</button></div>
            </form>
          </div>
        </div>
      )}

      {/* 🗑️ DELETE VEHICLE MODAL */}
      {vehicles.showDeleteVehicleModal && vehicles.deletingVehicle && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => vehicles.setShowDeleteVehicleModal(false)}>
          <div className="bg-gray-800 border border-red-500/30 rounded-2xl w-full max-w-sm p-6 text-center shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-3xl">🗑️</span></div>
            <h3 className="text-lg font-bold text-white mb-2">მანქანის წაშლა</h3>
            <div className="flex gap-3"><button onClick={() => vehicles.setShowDeleteVehicleModal(false)} className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl text-sm font-medium transition">არყოფა</button><button onClick={vehicles.confirmDeleteVehicle} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition shadow-lg shadow-red-500/20">ვადასტურებ</button></div>
          </div>
        </div>
      )}

      {/* 👨‍✈️ ADD DRIVER MODAL */}
      {driversHook.showAddDriverModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => driversHook.setShowAddDriverModal(false)}>
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center bg-gray-800"><h3 className="text-sm font-bold text-white flex items-center gap-2">👨‍✈️ ახალი მძღოლის რეგისტრაცია</h3><button onClick={() => driversHook.setShowAddDriverModal(false)} className="text-gray-400 hover:text-white text-xl transition">&times;</button></div>
            <form onSubmit={driversHook.handleAddDriver} className="p-5 overflow-y-auto space-y-6">
              <div className="flex bg-gray-700/30 p-1 rounded-lg mb-2">{['internal', 'contractor'].map(type => (<button type="button" key={type} onClick={() => driversHook.setDriverForm({...driversHook.driverForm, employment_type: type})} className={`flex-1 py-2 rounded-md text-[10px] font-bold uppercase tracking-wide transition ${driversHook.driverForm.employment_type === type ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'}`}>{type === 'internal' ? '🏢 კომპანიის მძღოლი' : '🤝 კონტრაქტით'}</button>))}</div>
              <div className="bg-gray-900/20 p-4 rounded-xl border border-gray-700/50"><SectionHeader title="კრიტიკულად აუცილებელი (სავალდებულო)" icon="🔴" color="text-red-400" /><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><FormField label="სრული სახელი" hint="სახელი და გვარი" required value={driversHook.driverForm.full_name} onChange={(e:any)=>driversHook.setDriverForm({...driversHook.driverForm, full_name:e.target.value})} /><FormField label="დაბადების თარიღი" type="date" required value={driversHook.driverForm.dob} onChange={(e:any)=>driversHook.setDriverForm({...driversHook.driverForm, dob:e.target.value})} /><FormField label="პირადი ნომერი / ID" hint="იდენტიფიკაციის ნომერი" required value={driversHook.driverForm.personal_id} onChange={(e:any)=>driversHook.setDriverForm({...driversHook.driverForm, personal_id:e.target.value})} /><FormField label="მობილური" hint="ვერიფიცირებული ნომერი" required value={driversHook.driverForm.phone} onChange={(e:any)=>driversHook.setDriverForm({...driversHook.driverForm, phone:e.target.value})} /><FormField label="ელ-ფოსტა" hint="contact@email.com" required type="email" value={driversHook.driverForm.email} onChange={(e:any)=>driversHook.setDriverForm({...driversHook.driverForm, email:e.target.value})} /><FormField label="მისამართი" hint="საცხოვრებელი ადგილი" required value={driversHook.driverForm.address} onChange={(e:any)=>driversHook.setDriverForm({...driversHook.driverForm, address:e.target.value})} /><FormField label="მართვის მოწმობა #" hint="ლიცენზიის ნომერი" required value={driversHook.driverForm.license_number} onChange={(e:any)=>driversHook.setDriverForm({...driversHook.driverForm, license_number:e.target.value})} /><FormField label="კატეგორია" required options={[{value:'B',label:'B'},{value:'C',label:'C'},{value:'C+E',label:'C+E'},{value:'D',label:'D'}]} value={driversHook.driverForm.license_category} onChange={(e:any)=>driversHook.setDriverForm({...driversHook.driverForm, license_category:e.target.value})} /><FormField label="ვადა" type="date" required value={driversHook.driverForm.license_expiry} onChange={(e:any)=>driversHook.setDriverForm({...driversHook.driverForm, license_expiry:e.target.value})} /><div className="md:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4 mt-2"><FormField label="📄 მოწმობის ფოტო" hint="URL / ფაილი" value={driversHook.driverForm.license_photo} onChange={(e:any)=>driversHook.setDriverForm({...driversHook.driverForm, license_photo:e.target.value})} /><FormField label="📄 ნასამართლეობა" hint="URL / ფაილი" value={driversHook.driverForm.criminal_record} onChange={(e:any)=>driversHook.setDriverForm({...driversHook.driverForm, criminal_record:e.target.value})} /><FormField label="📄 მართვის ისტორია" hint="URL / ფაილი" value={driversHook.driverForm.driving_record} onChange={(e:any)=>driversHook.setDriverForm({...driversHook.driverForm, driving_record:e.target.value})} /><FormField label="📄 სამედიცინო ცნობა" hint="URL / ფაილი" value={driversHook.driverForm.medical_cert} onChange={(e:any)=>driversHook.setDriverForm({...driversHook.driverForm, medical_cert:e.target.value})} /></div></div></div>
              <div className="bg-gray-900/20 p-4 rounded-xl border border-gray-700/50"><SectionHeader title="საოპერაციო და ფინანსური" icon="🟡" color="text-yellow-400" /><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><FormField label="გამოცდილება (წლები)" type="number" value={driversHook.driverForm.total_experience_years} onChange={(e:any)=>driversHook.setDriverForm({...driversHook.driverForm, total_experience_years:e.target.value})} /><div className="col-span-2"><label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wide">სპეციალური უნარები / გამოცდილება</label><textarea rows={1} value={driversHook.driverForm.special_experience} onChange={(e:any)=>driversHook.setDriverForm({...driversHook.driverForm, special_experience:e.target.value})} placeholder="მაგ: მაცივარ-კონტეინერი, საერთაშორისო რეისები..." className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition resize-none" /></div><div className="flex items-center gap-2 p-3 bg-gray-700/30 rounded-lg border border-gray-600"><input type="checkbox" checked={driversHook.driverForm.has_adr} onChange={(e:any)=>driversHook.setDriverForm({...driversHook.driverForm, has_adr:e.target.checked})} className="w-4 h-4 accent-green-500" /><label className="text-xs text-gray-300">ADR სერტიფიკატი (სახიფათო ტვირთი)</label></div>{driversHook.driverForm.has_adr && <FormField label="📄 ADR დოკუმენტი" hint="URL / ფაილი" value={driversHook.driverForm.adr_cert} onChange={(e:any)=>driversHook.setDriverForm({...driversHook.driverForm, adr_cert:e.target.value})} />}{driversHook.driverForm.employment_type === 'internal' && (<div className="col-span-3 mt-2 pt-4 border-t border-gray-700"><div className="flex items-center gap-2 mb-3"><input type="checkbox" checked={driversHook.driverForm.has_own_vehicle} onChange={(e:any)=>driversHook.setDriverForm({...driversHook.driverForm, has_own_vehicle:e.target.checked})} className="w-4 h-4 accent-blue-500" /><label className="text-xs text-gray-200 font-bold">მძღოლი ფლობს საკუთარ მანქანას</label></div>{driversHook.driverForm.has_own_vehicle && (<div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-blue-500/5 rounded-lg border border-blue-500/20"><FormField label="🚗 რეგისტრაციის #" hint="ტექ.პასპორტის ნომერი" value={driversHook.driverForm.vehicle_reg} onChange={(e:any)=>driversHook.setDriverForm({...driversHook.driverForm, vehicle_reg:e.target.value})} /><FormField label="📅 ტექ-ინსპექტირების ვადა" type="date" value={driversHook.driverForm.vehicle_insp_expiry} onChange={(e:any)=>driversHook.setDriverForm({...driversHook.driverForm, vehicle_insp_expiry:e.target.value})} /><FormField label="📄 დაზღვევის პოლისი" hint="პოლისის ნომერი" value={driversHook.driverForm.vehicle_insurance} onChange={(e:any)=>driversHook.setDriverForm({...driversHook.driverForm, vehicle_insurance:e.target.value})} /></div>)}</div>)}<div className="col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 mt-2 pt-4 border-t border-gray-700"><FormField label="IBAN ანგარიში" hint="GE0000000000000000" value={driversHook.driverForm.bank_iban} onChange={(e:any)=>driversHook.setDriverForm({...driversHook.driverForm, bank_iban:e.target.value})} /><FormField label="საგადასახადო სტატუსი" options={[{value:'individual',label:'ფიზიკური პირი'},{value:'entrepreneur',label:'ინდ. მეწარმე'},{value:'company',label:'კომპანია'}]} value={driversHook.driverForm.tax_status} onChange={(e:any)=>driversHook.setDriverForm({...driversHook.driverForm, tax_status:e.target.value})} /></div></div></div>
              <div className="bg-gray-900/20 p-4 rounded-xl border border-gray-700/50"><SectionHeader title="დამატებითი ინფორმაცია" icon="🔵" color="text-blue-400" /><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><FormField label="ენები" hint="მაგ: ინგლისური, რუსული" value={driversHook.driverForm.languages} onChange={(e:any)=>driversHook.setDriverForm({...driversHook.driverForm, languages:e.target.value})} /><FormField label="რეკომენდატორები" hint="წინა სამსახურის კონტაქტი" value={driversHook.driverForm.references} onChange={(e:any)=>driversHook.setDriverForm({...driversHook.driverForm, references:e.target.value})} /><FormField label="ფორმის ზომა" options={[{value:'S',label:'S'},{value:'M',label:'M'},{value:'L',label:'L'},{value:'XL',label:'XL'}]} value={driversHook.driverForm.uniform_size} onChange={(e:any)=>driversHook.setDriverForm({...driversHook.driverForm, uniform_size:e.target.value})} /><FormField label="📷 ფოტო-პროფილი" hint="URL" value={driversHook.driverForm.photo_url} onChange={(e:any)=>driversHook.setDriverForm({...driversHook.driverForm, photo_url:e.target.value})} /><div className="col-span-2"><label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wide">დამატებითი უნარები</label><textarea rows={2} value={driversHook.driverForm.extra_skills} onChange={(e:any)=>driversHook.setDriverForm({...driversHook.driverForm, extra_skills:e.target.value})} placeholder="მაგ: ავტომობილის ელემენტარული შეკეთება, ავტოამწე..." className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition resize-none" /></div></div></div>
              <div className="flex gap-3 pt-4 border-t border-gray-700 mt-2"><button type="button" onClick={() => driversHook.setShowAddDriverModal(false)} className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-medium transition">გაუქმება</button><button type="submit" className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 rounded-lg text-xs font-bold transition shadow-lg shadow-green-500/20">💾 რეგისტრაცია</button></div>
            </form>
          </div>
        </div>
      )}

      {/* 👨‍✈️ EDIT DRIVER MODAL */}
      {driversHook.showEditDriverModal && driversHook.editingDriver && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => driversHook.setShowEditDriverModal(false)}>
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center bg-gray-800"><h3 className="text-sm font-bold text-white flex items-center gap-2">👨‍✈️ მძღოლის რედაქტირება</h3><button onClick={() => driversHook.setShowEditDriverModal(false)} className="text-gray-400 hover:text-white text-xl transition">&times;</button></div>
            <form onSubmit={driversHook.handleSaveEditDriver} className="p-5 overflow-y-auto space-y-6">
              <section><h4 className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-gray-700/50 pb-2">🔴 პერსონალური ინფორმაცია</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><FormField label="სრული სახელი" hint="მაგ: ნიკა გიორგაძე" required value={driversHook.editDriverForm.full_name} onChange={(e:any)=>driversHook.setEditDriverForm({...driversHook.editDriverForm, full_name:e.target.value})} /><FormField label="ტელეფონის ნომერი" hint="მაგ: +995 555 123 456" required value={driversHook.editDriverForm.phone} onChange={(e:any)=>driversHook.setEditDriverForm({...driversHook.editDriverForm, phone:e.target.value})} /><FormField label="გადაუდებელი კონტაქტი" hint="სახელი და ტელეფონი" value={driversHook.editDriverForm.emergency_contact} onChange={(e:any)=>driversHook.setEditDriverForm({...driversHook.editDriverForm, emergency_contact:e.target.value})} /><FormField label="დასაქმების თარიღი" hint="კონტრაქტის დაწყება" type="date" value={driversHook.editDriverForm.hire_date} onChange={(e:any)=>driversHook.setEditDriverForm({...driversHook.editDriverForm, hire_date:e.target.value})} /></div></section>
              <section><h4 className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-gray-700/50 pb-2">🟡 ლიცენზია & კვალიფიკაცია</h4><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><FormField label="ლიცენზიის ნომერი" hint="მაგ: DL-2024-001" required value={driversHook.editDriverForm.license_number} onChange={(e:any)=>driversHook.setEditDriverForm({...driversHook.editDriverForm, license_number:e.target.value})} /><FormField label="ლიცენზიის კატეგორია" hint="მართვის უფლება" required options={[{value:'B',label:'B'},{value:'C',label:'C'},{value:'C+E',label:'C+E'},{value:'ADR',label:'ADR'}]} value={driversHook.editDriverForm.license_type} onChange={(e:any)=>driversHook.setEditDriverForm({...driversHook.editDriverForm, license_type:e.target.value})} /><FormField label="ლიცენზიის ვადა" hint="სავალდებულო" required type="date" value={driversHook.editDriverForm.license_expiry} onChange={(e:any)=>driversHook.setEditDriverForm({...driversHook.editDriverForm, license_expiry:e.target.value})} /><FormField label="სამედიცინო ცნობის ვადა" hint="ჯანმრთელობის მდგომარეობა" type="date" value={driversHook.editDriverForm.medical_expiry} onChange={(e:any)=>driversHook.setEditDriverForm({...driversHook.editDriverForm, medical_expiry:e.target.value})} /></div></section>
              <section><h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-gray-700/50 pb-2">🔵 მანქანა & ფინანსები</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><FormField label="მანქანის მინიჭება" hint="აირჩიე მანქანა ან დატოვე ცარიელი" options={[{value:'',label:'🚫 მანქანის გარეშე'}, ...vehiclesData.map((v: any) => ({value:v.id, label:`🚛 ${v.plate_number} - ${v.model}`}))]} value={driversHook.editDriverForm.vehicle_id} onChange={(e:any)=>driversHook.setEditDriverForm({...driversHook.editDriverForm, vehicle_id:e.target.value})} /><FormField label="დღიური განაკვეთი" hint="ხელფასი/კომისია (₾)" type="number" value={driversHook.editDriverForm.daily_rate} onChange={(e:any)=>driversHook.setEditDriverForm({...driversHook.editDriverForm, daily_rate:e.target.value})} /><div className="md:col-span-2 flex items-center gap-2 p-3 bg-gray-700/30 rounded-lg border border-gray-600"><input type="checkbox" checked={driversHook.editDriverForm.is_available} onChange={(e:any)=>driversHook.setEditDriverForm({...driversHook.editDriverForm, is_available:e.target.checked})} className="w-4 h-4 accent-green-500" /><label className="text-xs text-gray-300">🟢 მძღოლი ხელმისაწვდომია რეისებისთვის</label></div></div></section>
              <div className="flex gap-3 pt-4 border-t border-gray-700 mt-2"><button type="button" onClick={() => driversHook.setShowEditDriverModal(false)} className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-medium transition">გაუქმება</button><button type="submit" className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 rounded-lg text-xs font-bold transition shadow-lg shadow-green-500/20">💾 განახლება</button></div>
            </form>
          </div>
        </div>
      )}

      {/* 🗑️ DELETE DRIVER MODAL */}
      {driversHook.showDeleteDriverModal && driversHook.deletingDriver && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => driversHook.setShowDeleteDriverModal(false)}>
          <div className="bg-gray-800 border border-red-500/30 rounded-2xl w-full max-w-sm p-6 text-center shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-3xl">🗑️</span></div>
            <h3 className="text-lg font-bold text-white mb-2">მძღოლის წაშლა</h3>
            <div className="flex gap-3"><button onClick={() => driversHook.setShowDeleteDriverModal(false)} className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl text-sm font-medium transition">არყოფა</button><button onClick={driversHook.confirmDeleteDriver} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition shadow-lg shadow-red-500/20">ვადასტურებ</button></div>
          </div>
        </div>
      )}

      {/* 📦 ADD ORDER MODAL */}
      {ordersHook.showOrderModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => ordersHook.setShowOrderModal(false)}>
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center bg-gray-800"><h3 className="text-sm font-bold text-white flex items-center gap-2">📦 ახალი შეკვეთა</h3><button onClick={() => ordersHook.setShowOrderModal(false)} className="text-gray-400 hover:text-white text-xl transition">&times;</button></div>
            <form onSubmit={ordersHook.handleAddOrder} className="p-5 overflow-y-auto space-y-5">
              <section><h4 className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-gray-700/50 pb-2">🔴 მარშრუტი</h4><div className="grid grid-cols-1 gap-3"><FormField label="📍 ატვირთვის მისამართი" hint="მაგ: თბილისი, ვაჟა-ფშაველას გამზ. 10" required value={ordersHook.orderForm.pickup_address} onChange={(e:any)=>ordersHook.setOrderForm({...ordersHook.orderForm, pickup_address:e.target.value})} /><FormField label="🏁 ჩატვირთვის მისამართი" hint="მაგ: ბათუმი, რიყის ქ. 25" required value={ordersHook.orderForm.delivery_address} onChange={(e:any)=>ordersHook.setOrderForm({...ordersHook.orderForm, delivery_address:e.target.value})} /></div></section>
              <section><h4 className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-gray-700/50 pb-2">🟡 ტვირთი</h4><div className="grid grid-cols-1 md:grid-cols-3 gap-3"><FormField label="📦 აღწერა" hint="მაგ: 50 ყუთი ელექტრონიკა" required textarea value={ordersHook.orderForm.cargo_description} onChange={(e:any)=>ordersHook.setOrderForm({...ordersHook.orderForm, cargo_description:e.target.value})} /><FormField label="⚖️ წონა (კგ)" hint="მაგ: 500" type="number" value={ordersHook.orderForm.cargo_weight_kg} onChange={(e:any)=>ordersHook.setOrderForm({...ordersHook.orderForm, cargo_weight_kg:e.target.value})} /><FormField label="💰 ფასი" hint="მაგ: 250" type="number" value={ordersHook.orderForm.price} onChange={(e:any)=>ordersHook.setOrderForm({...ordersHook.orderForm, price:e.target.value})} /><FormField label="💵 ვალუტა" options={[{value:'GEL',label:'GEL'}, {value:'USD',label:'USD'}, {value:'EUR',label:'EUR'}]} value={ordersHook.orderForm.currency} onChange={(e:any)=>ordersHook.setOrderForm({...ordersHook.orderForm, currency:e.target.value})} /></div></section>
              <section><h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-gray-700/50 pb-2">🔵 მინიჭება</h4><div className="mb-3"><label className="block text-[10px] text-gray-400 mb-1">მძღოლის ტიპი</label><div className="flex gap-2 mb-2"><button type="button" onClick={() => ordersHook.setOrderForm((p: any) => ({...p, driver_type: 'internal', driver_id: '', external_driver_id: ''}))} className={`flex-1 py-1.5 rounded text-[10px] font-medium transition ${ordersHook.orderForm.driver_type === 'internal' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'}`}>🏢 საკუთარი</button><button type="button" onClick={() => ordersHook.setOrderForm((p: any) => ({...p, driver_type: 'external', driver_id: '', external_driver_id: ''}))} className={`flex-1 py-1.5 rounded text-[10px] font-medium transition ${ordersHook.orderForm.driver_type === 'external' ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-400'}`}>🤝 კონტრაქტით</button></div>{ordersHook.orderForm.driver_type === 'internal' ? (<select value={ordersHook.orderForm.driver_id} onChange={(e:any)=>ordersHook.setOrderForm((p: any) => ({...p, driver_id: e.target.value}))} className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-xs outline-none"><option value="">– საკუთარი მძღოლი –</option>{drivers.filter((d: any) => d.is_available).map((d: any) => <option key={d.id} value={d.id}>{d.full_name} ({d.phone})</option>)} </select>) : (<select value={ordersHook.orderForm.external_driver_id} onChange={(e:any)=>ordersHook.setOrderForm((p: any) => ({...p, external_driver_id: e.target.value}))} className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-xs outline-none"><option value="">– გარე მძღოლი –</option>{externalDrivers?.map((d: any) => <option key={d.id} value={d.id}>{d.full_name} ({d.phone})</option>) || <option>ჯერ არ არის დამატებული</option>}</select>)}</div><div><label className="block text-[10px] text-gray-400 mb-1">მანქანის ტიპი</label><div className="flex gap-2 mb-2"><button type="button" onClick={() => ordersHook.setOrderForm((p: any) => ({...p, vehicle_type: 'internal', vehicle_id: '', external_vehicle_id: ''}))} className={`flex-1 py-1.5 rounded text-[10px] font-medium transition ${ordersHook.orderForm.vehicle_type === 'internal' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'}`}>🏢 საკუთარი</button><button type="button" onClick={() => ordersHook.setOrderForm((p: any) => ({...p, vehicle_type: 'external', vehicle_id: '', external_vehicle_id: ''}))} className={`flex-1 py-1.5 rounded text-[10px] font-medium transition ${ordersHook.orderForm.vehicle_type === 'external' ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-400'}`}>🤝 კონტრაქტით</button></div>{ordersHook.orderForm.vehicle_type === 'internal' ? (<select value={ordersHook.orderForm.vehicle_id} onChange={(e:any)=>ordersHook.setOrderForm((p: any) => ({...p, vehicle_id: e.target.value}))} className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-xs outline-none"><option value="">– საკუთარი მანქანა –</option>{vehiclesData.filter((v: any) => v.status === 'active').map((v: any) => <option key={v.id} value={v.id}>{v.plate_number} - {v.model}</option>)} </select>) : (<select value={ordersHook.orderForm.external_vehicle_id} onChange={(e:any)=>ordersHook.setOrderForm((p: any) => ({...p, external_vehicle_id: e.target.value}))} className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-xs outline-none"><option value="">– გარე მანქანა –</option>{externalVehicles?.map((v: any) => <option key={v.id} value={v.id}>{v.plate_number} - {v.model}</option>) || <option>ჯერ არ არის დამატებული</option>}</select>)}</div></section>
              <section><h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-gray-700/50 pb-2">🔵 დამკვეთი</h4><div className="flex bg-gray-700/30 p-1 rounded-lg mb-3"><button type="button" onClick={() => ordersHook.setOrderForm((p: any) => ({...p, client_type: 'private', client_id: '', client_name: '', client_email: '', client_address: ''}))} className={`flex-1 py-1.5 rounded text-[10px] font-medium transition ${ordersHook.orderForm.client_type === 'private' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}>👤 კერძო პირი</button><button type="button" onClick={() => ordersHook.setOrderForm((p: any) => ({...p, client_type: 'company', client_id: '', client_name: '', client_email: '', client_address: ''}))} className={`flex-1 py-1.5 rounded text-[10px] font-medium transition ${ordersHook.orderForm.client_type === 'company' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}>🏢 კომპანია</button></div><div className="mb-3"><label className="block text-[10px] text-gray-400 mb-1">{ordersHook.orderForm.client_type === 'private' ? 'აირჩიე კერძო პირი' : 'აირჩიე კომპანია'}</label><select value={ordersHook.orderForm.client_id} onChange={(e) => { const selectedId = e.target.value; ordersHook.setOrderForm((p: any) => ({...p, client_id: selectedId})); if (selectedId) { if (ordersHook.orderForm.client_type === 'private') { const client = privateClients.find((c: any) => c.id === selectedId); if (client) { ordersHook.setOrderForm((p: any) => ({...p, client_name: client.full_name, client_email: client.email, client_address: client.address, client_personal_id: client.personal_id})) } } else { const company = companies.find((c: any) => c.id === selectedId); if (company) { ordersHook.setOrderForm((p: any) => ({...p, client_name: company.name, client_email: company.email, client_address: company.legal_address, client_registration_number: company.registration_number})) } } }}} className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-xs outline-none"><option value="">– აირჩიე {ordersHook.orderForm.client_type === 'private' ? 'კერძო პირი' : 'კომპანია'} –</option>{(ordersHook.orderForm.client_type === 'private' ? privateClients : companies).map((c: any) => (<option key={c.id} value={c.id}>{ordersHook.orderForm.client_type === 'private' ? c.full_name : c.name} {ordersHook.orderForm.client_type === 'private' ? ` (${c.personal_id})` : ` (${c.registration_number})`}</option>))}</select></div><div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-indigo-500/5 rounded-lg border border-indigo-500/20"><FormField label="სახელი / კომპანია" hint="ავტო-შევსებული" value={ordersHook.orderForm.client_name} onChange={(e:any)=>ordersHook.setOrderForm({...ordersHook.orderForm, client_name:e.target.value})} /><FormField label="ელ-ფოსტა" hint="ავტო-შევსებული" type="email" value={ordersHook.orderForm.client_email} onChange={(e:any)=>ordersHook.setOrderForm({...ordersHook.orderForm, client_email:e.target.value})} /><FormField label="მისამართი" hint="ავტო-შევსებული" textarea value={ordersHook.orderForm.client_address} onChange={(e:any)=>ordersHook.setOrderForm({...ordersHook.orderForm, client_address:e.target.value})} />{ordersHook.orderForm.client_type === 'private' ? (<FormField label="პირადი ნომერი" hint="ავტო-შევსებული" value={ordersHook.orderForm.client_personal_id} onChange={(e:any)=>ordersHook.setOrderForm({...ordersHook.orderForm, client_personal_id:e.target.value})} />) : (<FormField label="საიდ / რეგ. ნომერი" hint="ავტო-შევსებული" value={ordersHook.orderForm.client_registration_number} onChange={(e:any)=>ordersHook.setOrderForm({...ordersHook.orderForm, client_registration_number:e.target.value})} />)}</div><p className="text-[9px] text-gray-500 mt-2">💡 შენიშვნა: შეგიძლია ხელით შეცვალო ავტო-შევსებული მონაცემები, თუ საჭიროა.</p></section>
              <section><h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-gray-700/50 pb-2">🟣 დამატებითი</h4><FormField label="📝 შენიშვნა" hint="შიდა შენიშვნა ან დეტალები..." textarea value={ordersHook.orderForm.notes} onChange={(e:any)=>ordersHook.setOrderForm({...ordersHook.orderForm, notes:e.target.value})} /></section>
              <div className="flex gap-3 pt-4 border-t border-gray-700 mt-2"><button type="button" onClick={() => ordersHook.setShowOrderModal(false)} className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-medium transition">გაუქმება</button><button type="submit" className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-xs font-bold transition shadow-lg shadow-purple-500/20">✅ შექმნა</button></div>
            </form>
          </div>
        </div>
      )}

      {/* 📦 EDIT ORDER MODAL */}
      {ordersHook.showEditOrderModal && ordersHook.editingOrder && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => ordersHook.setShowEditOrderModal(false)}>
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center bg-gray-800"><h3 className="text-sm font-bold text-white flex items-center gap-2">📦 შეკვეთის რედაქტირება</h3><button onClick={() => ordersHook.setShowEditOrderModal(false)} className="text-gray-400 hover:text-white text-xl transition">&times;</button></div>
            <form onSubmit={ordersHook.handleSaveEditOrder} className="p-5 overflow-y-auto space-y-5">
              <section><h4 className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-gray-700/50 pb-2">🔴 მარშრუტი</h4><div className="grid grid-cols-1 gap-3"><FormField label="📍 ატვირთვის მისამართი" hint="მაგ: თბილისი, ვაჟა-ფშაველას გამზ. 10" required value={ordersHook.editOrderForm.pickup_address} onChange={(e:any)=>ordersHook.setEditOrderForm({...ordersHook.editOrderForm, pickup_address:e.target.value})} /><FormField label="🏁 ჩატვირთვის მისამართი" hint="მაგ: ბათუმი, რიყის ქ. 25" required value={ordersHook.editOrderForm.delivery_address} onChange={(e:any)=>ordersHook.setEditOrderForm({...ordersHook.editOrderForm, delivery_address:e.target.value})} /></div></section>
              <section><h4 className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-gray-700/50 pb-2">🟡 ტვირთი</h4><div className="grid grid-cols-1 md:grid-cols-3 gap-3"><FormField label="📦 აღწერა" hint="მაგ: 50 ყუთი ელექტრონიკა" required textarea value={ordersHook.editOrderForm.cargo_description} onChange={(e:any)=>ordersHook.setEditOrderForm({...ordersHook.editOrderForm, cargo_description:e.target.value})} /><FormField label="⚖️ წონა (კგ)" hint="მაგ: 500" type="number" value={ordersHook.editOrderForm.cargo_weight_kg} onChange={(e:any)=>ordersHook.setEditOrderForm({...ordersHook.editOrderForm, cargo_weight_kg:e.target.value})} /><FormField label="💰 ფასი" hint="მაგ: 250" type="number" value={ordersHook.editOrderForm.price} onChange={(e:any)=>ordersHook.setEditOrderForm({...ordersHook.editOrderForm, price:e.target.value})} /><FormField label="💵 ვალუტა" options={[{value:'GEL',label:'GEL'}, {value:'USD',label:'USD'}, {value:'EUR',label:'EUR'}]} value={ordersHook.editOrderForm.currency} onChange={(e:any)=>ordersHook.setEditOrderForm({...ordersHook.editOrderForm, currency:e.target.value})} /></div></section>
              <section><h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-gray-700/50 pb-2">🔵 მინიჭება</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><FormField label="👨‍✈️ მძღოლი" hint="აირჩიე ხელმისაწვდომი მძღოლი" options={[{value:'',label:'– არ არის მინიჭებული –'}, ...drivers.map((d: any) => ({value:d.id, label:`${d.full_name} - ${d.phone}`}))]} value={ordersHook.editOrderForm.driver_id} onChange={(e:any)=>ordersHook.setEditOrderForm({...ordersHook.editOrderForm, driver_id:e.target.value})} /><FormField label="🚐 მანქანა" hint="აირჩიე აქტიური მანქანა" options={[{value:'',label:'– არ არის მინიჭებული –'}, ...vehiclesData.map((v: any) => ({value:v.id, label:`${v.plate_number} - ${v.model}`}))]} value={ordersHook.editOrderForm.vehicle_id} onChange={(e:any)=>ordersHook.setEditOrderForm({...ordersHook.editOrderForm, vehicle_id:e.target.value})} /></div></section>
              <section><h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-gray-700/50 pb-2">🟣 დამატებითი</h4><FormField label="📝 შენიშვნა" hint="შიდა შენიშვნა ან დეტალები..." textarea value={ordersHook.editOrderForm.notes} onChange={(e:any)=>ordersHook.setEditOrderForm({...ordersHook.editOrderForm, notes:e.target.value})} /></section>
              <div className="flex gap-3 pt-4 border-t border-gray-700 mt-2"><button type="button" onClick={() => ordersHook.setShowEditOrderModal(false)} className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-medium transition">გაუქმება</button><button type="submit" className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-xs font-bold transition shadow-lg shadow-purple-500/20">💾 განახლება</button></div>
            </form>
          </div>
        </div>
      )}

      {/* 🗑️ DELETE ORDER MODAL */}
      {ordersHook.showDeleteOrderModal && ordersHook.deletingOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => ordersHook.setShowDeleteOrderModal(false)}>
          <div className="bg-gray-800 border border-red-500/30 rounded-2xl w-full max-w-sm p-6 text-center shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-3xl">🗑️</span></div>
            <h3 className="text-lg font-bold text-white mb-2">შეკვეთის წაშლა</h3>
            <p className="text-sm text-gray-400 mb-6">ნამდვილად გსურთ შეკვეთა <span className="text-white font-medium">{ordersHook.deletingOrder?.tracking_code}</span> წაშლა?<br/><span className="text-red-400 text-xs">ეს ქმედება შეუქცევადია.</span></p>
            <div className="flex gap-3"><button onClick={() => ordersHook.setShowDeleteOrderModal(false)} className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl text-sm font-medium transition">არყოფა</button><button onClick={ordersHook.confirmDeleteOrder} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition shadow-lg shadow-red-500/20">ვადასტურებ</button></div>
          </div>
        </div>
      )}

      {/* 🧾 INVOICE VIEW / PRINT MODAL */}
      {invoicesHook.showInvoiceModal && invoicesHook.selectedInvoice && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => invoicesHook.setShowInvoiceModal(false)}>
          <div className="bg-white text-gray-900 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="print:hidden px-6 py-4 border-b border-gray-200 flex justify-between items-center"><h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">🧾 ინვოისი: {invoicesHook.selectedInvoice.invoice_number}</h3><div className="flex gap-2"><button onClick={invoicesHook.handlePrint} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition">🖨️ დაბეჭდვა</button><button onClick={() => invoicesHook.setShowInvoiceModal(false)} className="text-gray-500 hover:text-gray-800 text-xl transition">&times;</button></div></div>
            <div className="p-8">
              <div className="flex justify-between items-start mb-8"><div><h1 className="text-3xl font-bold text-gray-900">INVOICE</h1><p className="text-gray-500 mt-1">Logistics OS Company Ltd.</p><p className="text-gray-500">Tbilisi, Georgia</p><p className="text-gray-500">support@logistics.ge</p></div><div className="text-right"><p className="text-lg font-bold text-gray-800">{invoicesHook.selectedInvoice.invoice_number}</p><p className="text-gray-500">Issue Date: {invoicesHook.selectedInvoice.issue_date}</p><p className="text-gray-500">Due Date: {invoicesHook.selectedInvoice.due_date}</p></div></div>
              <div className="mb-8 border-t border-b border-gray-200 py-4"><h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Bill To:</h3><p className="font-medium">{invoicesHook.selectedInvoice.client_name}</p><p className="text-gray-600">{invoicesHook.selectedInvoice.client_address}</p><p className="text-gray-600">{invoicesHook.selectedInvoice.client_email}</p></div>
              <table className="w-full mb-8"><thead><tr className="text-left text-xs font-bold text-gray-500 uppercase border-b border-gray-200"><th className="py-3">Description</th><th className="py-3 text-right">Qty</th><th className="py-3 text-right">Unit Price</th><th className="py-3 text-right">Total</th></tr></thead><tbody className="text-sm"><tr className="border-b border-gray-100"><td className="py-3">{(invoicesHook.selectedInvoice as any).orders?.cargo_description || 'Logistics Service'}</td><td className="py-3 text-right">1</td><td className="py-3 text-right">{invoicesHook.selectedInvoice.total_amount} {invoicesHook.selectedInvoice.currency}</td><td className="py-3 text-right font-bold">{invoicesHook.selectedInvoice.total_amount} {invoicesHook.selectedInvoice.currency}</td></tr></tbody></table>
              <div className="flex justify-end"><div className="w-1/2"><div className="flex justify-between py-2 border-t border-gray-200"><span className="font-bold text-gray-800">Total</span><span className="font-bold text-xl text-blue-600">{invoicesHook.selectedInvoice.total_amount} {invoicesHook.selectedInvoice.currency}</span></div></div></div>
              {invoicesHook.selectedInvoice.notes && (<div className="mt-8 p-4 bg-gray-50 rounded-lg text-xs text-gray-600"><strong>Notes:</strong> {invoicesHook.selectedInvoice.notes}</div>)}
            </div>
          </div>
        </div>
      )}

      {/* 📧 EMAIL MODAL */}
      {invoicesHook.showEmailModal && invoicesHook.selectedInvoice && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => invoicesHook.setShowEmailModal(false)}>
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-white mb-4">📧 ინვოისის გაგზავნა</h3>
            <div className="space-y-4"><FormField label="To (Email)" hint="მომხმარებლის ემაილი" required value={invoicesHook.emailTo} onChange={(e:any)=>invoicesHook.setEmailTo(e.target.value)} /><div className="flex gap-3 pt-2"><button type="button" onClick={() => invoicesHook.setShowEmailModal(false)} className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-medium transition">გაუქმება</button><button onClick={invoicesHook.handleSendEmail} className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-xs font-bold transition shadow-lg shadow-purple-500/20">📧 გაგზავნა</button></div></div>
          </div>
        </div>
      )}

      {/* 👤 ADD PRIVATE CLIENT MODAL */}
      {privateClientsHook.showAddPrivateClientModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => privateClientsHook.setShowAddPrivateClientModal(false)}>
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center bg-gray-800"><h3 className="text-sm font-bold text-white flex items-center gap-2">👤 ახალი კერძო პირი</h3><button onClick={() => privateClientsHook.setShowAddPrivateClientModal(false)} className="text-gray-400 hover:text-white text-xl transition">&times;</button></div>
            <form onSubmit={privateClientsHook.handleAddPrivateClient} className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><FormField label="სახელი და გვარი" hint="მაგ: გივი ბერიკაშვილი" required value={privateClientsHook.privateClientForm.full_name} onChange={(e:any)=>privateClientsHook.setPrivateClientForm({...privateClientsHook.privateClientForm, full_name:e.target.value})} /><FormField label="პირადი ნომერი" hint="მაგ: 01010101010" required value={privateClientsHook.privateClientForm.personal_id} onChange={(e:any)=>privateClientsHook.setPrivateClientForm({...privateClientsHook.privateClientForm, personal_id:e.target.value})} /><FormField label="ტელეფონი" hint="+995 5XX XXX XXX" required value={privateClientsHook.privateClientForm.phone} onChange={(e:any)=>privateClientsHook.setPrivateClientForm({...privateClientsHook.privateClientForm, phone:e.target.value})} /><FormField label="ელ-ფოსტა" hint="email@example.com" type="email" value={privateClientsHook.privateClientForm.email} onChange={(e:any)=>privateClientsHook.setPrivateClientForm({...privateClientsHook.privateClientForm, email:e.target.value})} /><FormField label="მისამართი" hint="საცხოვრებელი მისამართი" textarea value={privateClientsHook.privateClientForm.address} onChange={(e:any)=>privateClientsHook.setPrivateClientForm({...privateClientsHook.privateClientForm, address:e.target.value})} /><FormField label="შენიშვნა" hint="დამატებითი ინფო" textarea value={privateClientsHook.privateClientForm.notes} onChange={(e:any)=>privateClientsHook.setPrivateClientForm({...privateClientsHook.privateClientForm, notes:e.target.value})} /></div>
              <div className="flex gap-3 pt-4 border-t border-gray-700"><button type="button" onClick={() => privateClientsHook.setShowAddPrivateClientModal(false)} className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-medium transition">გაუქმება</button><button type="submit" className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-xs font-bold transition shadow-lg shadow-purple-500/20">💾 შენახვა</button></div>
            </form>
          </div>
        </div>
      )}

      {/* 👤 EDIT PRIVATE CLIENT MODAL */}
      {privateClientsHook.showEditPrivateClientModal && privateClientsHook.editingPrivateClient && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => privateClientsHook.setShowEditPrivateClientModal(false)}>
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center bg-gray-800"><h3 className="text-sm font-bold text-white flex items-center gap-2">👤 კერძო პირის რედაქტირება</h3><button onClick={() => privateClientsHook.setShowEditPrivateClientModal(false)} className="text-gray-400 hover:text-white text-xl transition">&times;</button></div>
            <form onSubmit={privateClientsHook.handleSaveEditPrivateClient} className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><FormField label="სახელი და გვარი" hint="მაგ: გივი ბერიკაშვილი" required value={privateClientsHook.editPrivateClientForm.full_name} onChange={(e:any)=>privateClientsHook.setEditPrivateClientForm({...privateClientsHook.editPrivateClientForm, full_name:e.target.value})} /><FormField label="პირადი ნომერი" hint="მაგ: 01010101010" required value={privateClientsHook.editPrivateClientForm.personal_id} onChange={(e:any)=>privateClientsHook.setEditPrivateClientForm({...privateClientsHook.editPrivateClientForm, personal_id:e.target.value})} /><FormField label="ტელეფონი" hint="+995 5XX XXX XXX" required value={privateClientsHook.editPrivateClientForm.phone} onChange={(e:any)=>privateClientsHook.setEditPrivateClientForm({...privateClientsHook.editPrivateClientForm, phone:e.target.value})} /><FormField label="ელ-ფოსტა" hint="email@example.com" type="email" value={privateClientsHook.editPrivateClientForm.email} onChange={(e:any)=>privateClientsHook.setEditPrivateClientForm({...privateClientsHook.editPrivateClientForm, email:e.target.value})} /><FormField label="მისამართი" hint="საცხოვრებელი მისამართი" textarea value={privateClientsHook.editPrivateClientForm.address} onChange={(e:any)=>privateClientsHook.setEditPrivateClientForm({...privateClientsHook.editPrivateClientForm, address:e.target.value})} /><FormField label="შენიშვნა" hint="დამატებითი ინფო" textarea value={privateClientsHook.editPrivateClientForm.notes} onChange={(e:any)=>privateClientsHook.setEditPrivateClientForm({...privateClientsHook.editPrivateClientForm, notes:e.target.value})} /></div>
              <div className="flex gap-3 pt-4 border-t border-gray-700"><button type="button" onClick={() => privateClientsHook.setShowEditPrivateClientModal(false)} className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-medium transition">გაუქმება</button><button type="submit" className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-xs font-bold transition shadow-lg shadow-purple-500/20">💾 განახლება</button></div>
            </form>
          </div>
        </div>
      )}

      {/* 🗑️ DELETE PRIVATE CLIENT MODAL */}
      {privateClientsHook.showDeletePrivateClientModal && privateClientsHook.deletingPrivateClient && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => privateClientsHook.setShowDeletePrivateClientModal(false)}>
          <div className="bg-gray-800 border border-red-500/30 rounded-2xl w-full max-w-sm p-6 text-center shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-3xl">🗑️</span></div>
            <h3 className="text-lg font-bold text-white mb-2">კერძო პირის წაშლა</h3>
            <p className="text-sm text-gray-400 mb-6">ნამდვილად გსურთ ჩანაწერის წაშლა?<br/><span className="text-red-400 text-xs">ეს ქმედება შეუქცევადია.</span></p>
            <div className="flex gap-3"><button onClick={() => privateClientsHook.setShowDeletePrivateClientModal(false)} className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl text-sm font-medium transition">არყოფა</button><button onClick={privateClientsHook.confirmDeletePrivateClient} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition shadow-lg shadow-red-500/20">ვადასტურებ</button></div>
          </div>
        </div>
      )}

      {/* 🏢 ADD COMPANY MODAL */}
      {companiesHook.showAddCompanyModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => companiesHook.setShowAddCompanyModal(false)}>
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center bg-gray-800"><h3 className="text-sm font-bold text-white flex items-center gap-2">🏢 ახალი კომპანია</h3><button onClick={() => companiesHook.setShowAddCompanyModal(false)} className="text-gray-400 hover:text-white text-xl transition">&times;</button></div>
            <form onSubmit={companiesHook.handleAddCompany} className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><FormField label="კომპანიის სახელი" hint="მაგ: შპს ლოჯისტიკა ჯი" required value={companiesHook.companyForm.name} onChange={(e:any)=>companiesHook.setCompanyForm({...companiesHook.companyForm, name:e.target.value})} /><FormField label="საიდ (რეგ. ნომერი)" hint="მაგ: 404040404" required value={companiesHook.companyForm.registration_number} onChange={(e:any)=>companiesHook.setCompanyForm({...companiesHook.companyForm, registration_number:e.target.value})} /><FormField label="საგადასახადო კოდი / VAT" hint="მაგ: 123456789" value={companiesHook.companyForm.vat_number} onChange={(e:any)=>companiesHook.setCompanyForm({...companiesHook.companyForm, vat_number:e.target.value})} /><FormField label="საკონტაქტო პირი" hint="ვინ არის კონტაქტი?" value={companiesHook.companyForm.contact_person} onChange={(e:any)=>companiesHook.setCompanyForm({...companiesHook.companyForm, contact_person:e.target.value})} /><FormField label="ტელეფონი" hint="+995 5XX XXX XXX" required value={companiesHook.companyForm.phone} onChange={(e:any)=>companiesHook.setCompanyForm({...companiesHook.companyForm, phone:e.target.value})} /><FormField label="ელ-ფოსტა" hint="email@company.ge" type="email" value={companiesHook.companyForm.email} onChange={(e:any)=>companiesHook.setCompanyForm({...companiesHook.companyForm, email:e.target.value})} /><FormField label="იურიდიული მისამართი" hint="ოფიციალური მისამართი" textarea value={companiesHook.companyForm.legal_address} onChange={(e:any)=>companiesHook.setCompanyForm({...companiesHook.companyForm, legal_address:e.target.value})} /><FormField label="შენიშვნა" hint="დამატებითი ინფო" textarea value={companiesHook.companyForm.notes} onChange={(e:any)=>companiesHook.setCompanyForm({...companiesHook.companyForm, notes:e.target.value})} /></div>
              <div className="flex gap-3 pt-4 border-t border-gray-700"><button type="button" onClick={() => companiesHook.setShowAddCompanyModal(false)} className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-medium transition">გაუქმება</button><button type="submit" className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-xs font-bold transition shadow-lg shadow-purple-500/20">💾 შენახვა</button></div>
            </form>
          </div>
        </div>
      )}

      {/* 🏢 EDIT COMPANY MODAL */}
      {companiesHook.showEditCompanyModal && companiesHook.editingCompany && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => companiesHook.setShowEditCompanyModal(false)}>
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center bg-gray-800"><h3 className="text-sm font-bold text-white flex items-center gap-2">🏢 კომპანიის რედაქტირება</h3><button onClick={() => companiesHook.setShowEditCompanyModal(false)} className="text-gray-400 hover:text-white text-xl transition">&times;</button></div>
            <form onSubmit={companiesHook.handleSaveEditCompany} className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><FormField label="კომპანიის სახელი" hint="მაგ: შპს ლოჯისტიკა ჯი" required value={companiesHook.editCompanyForm.name} onChange={(e:any)=>companiesHook.setEditCompanyForm({...companiesHook.editCompanyForm, name:e.target.value})} /><FormField label="საიდ (რეგ. ნომერი)" hint="მაგ: 404040404" required value={companiesHook.editCompanyForm.registration_number} onChange={(e:any)=>companiesHook.setEditCompanyForm({...companiesHook.editCompanyForm, registration_number:e.target.value})} /><FormField label="საგადასახადო კოდი / VAT" hint="მაგ: 123456789" value={companiesHook.editCompanyForm.vat_number} onChange={(e:any)=>companiesHook.setEditCompanyForm({...companiesHook.editCompanyForm, vat_number:e.target.value})} /><FormField label="საკონტაქტო პირი" hint="ვინ არის კონტაქტი?" value={companiesHook.editCompanyForm.contact_person} onChange={(e:any)=>companiesHook.setEditCompanyForm({...companiesHook.editCompanyForm, contact_person:e.target.value})} /><FormField label="ტელეფონი" hint="+995 5XX XXX XXX" required value={companiesHook.editCompanyForm.phone} onChange={(e:any)=>companiesHook.setEditCompanyForm({...companiesHook.editCompanyForm, phone:e.target.value})} /><FormField label="ელ-ფოსტა" hint="email@company.ge" type="email" value={companiesHook.editCompanyForm.email} onChange={(e:any)=>companiesHook.setEditCompanyForm({...companiesHook.editCompanyForm, email:e.target.value})} /><FormField label="იურიდიული მისამართი" hint="ოფიციალური მისამართი" textarea value={companiesHook.editCompanyForm.legal_address} onChange={(e:any)=>companiesHook.setEditCompanyForm({...companiesHook.editCompanyForm, legal_address:e.target.value})} /><FormField label="შენიშვნა" hint="დამატებითი ინფო" textarea value={companiesHook.editCompanyForm.notes} onChange={(e:any)=>companiesHook.setEditCompanyForm({...companiesHook.editCompanyForm, notes:e.target.value})} /></div>
              <div className="flex gap-3 pt-4 border-t border-gray-700"><button type="button" onClick={() => companiesHook.setShowEditCompanyModal(false)} className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-medium transition">გაუქმება</button><button type="submit" className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-xs font-bold transition shadow-lg shadow-purple-500/20">💾 განახლება</button></div>
            </form>
          </div>
        </div>
      )}

      {/* 🗑️ DELETE COMPANY MODAL */}
      {companiesHook.showDeleteCompanyModal && companiesHook.deletingCompany && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => companiesHook.setShowDeleteCompanyModal(false)}>
          <div className="bg-gray-800 border border-red-500/30 rounded-2xl w-full max-w-sm p-6 text-center shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-3xl">🗑️</span></div>
            <h3 className="text-lg font-bold text-white mb-2">კომპანიის წაშლა</h3>
            <p className="text-sm text-gray-400 mb-6">ნამდვილად გსურთ ჩანაწერის წაშლა?<br/><span className="text-red-400 text-xs">ეს ქმედება შეუქცევადია.</span></p>
            <div className="flex gap-3"><button onClick={() => companiesHook.setShowDeleteCompanyModal(false)} className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl text-sm font-medium transition">არყოფა</button><button onClick={companiesHook.confirmDeleteCompany} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition shadow-lg shadow-red-500/20">ვადასტურებ</button></div>
          </div>
        </div>
      )}
    </div>
  )
}