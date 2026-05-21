'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// ✅ ჰუკების იმპორტები
import { useAdminData } from './hooks/useAdminData'
import { useVehicles } from './hooks/useVehicles'
import { useDrivers } from './hooks/useDrivers'
import { useOrders } from './hooks/useOrders'
import { useInvoices } from './hooks/useInvoices'
import { usePrivateClients } from './hooks/usePrivateClients'
import { useCompanies } from './hooks/useCompanies'
import { useDispatch } from './hooks/useDispatch'

// 📂 TABS IMPORTS
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
import SettingsTab from '../tabs/SettingsTab'
import DispatchTab from '../tabs/DispatchTab'

// ✅ ახალი: AddOrderModal იმპორტი
import AddOrderModal from '../modals/AddOrderModal'

// ============================================================================
// 🧩 Helper: FormField
// ============================================================================
const FormField = ({ label, hint, required, type = 'text', value, onChange, options, textarea, checkbox }: any) => {
  if (checkbox) {
    return (
      <div className="flex items-center gap-2 p-3 bg-gray-700/30 rounded-lg border border-gray-600">
        <input type="checkbox" checked={value} onChange={onChange} className="w-4 h-4 accent-blue-500" />
        <label className="text-xs text-gray-300">{label}</label>
      </div>
    )
  }
  return (
    <div className={textarea ? "col-span-1 md:col-span-2" : ""}>
      <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wide">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {textarea ? (
        <textarea rows={3} value={value} onChange={onChange} placeholder={hint} className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition resize-none" />
      ) : options ? (
        <select value={value ?? ''} onChange={onChange} className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500 transition">
          <option value="">აირჩიე...</option>
          {options.map((opt: any) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      ) : (
        <input type={type} value={value ?? ''} onChange={onChange} placeholder={hint} required={required} className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" />
      )}
    </div>
  )
}

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
  const router = useRouter()

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

  const vehicles = useVehicles({ showNotification, loadData })
  const driversHook = useDrivers({ showNotification, loadData, vehicles: vehiclesData })
  const ordersHook = useOrders({ showNotification, loadData, logAudit, externalDrivers, externalVehicles, privateClients, companies })
  const invoicesHook = useInvoices({ showNotification, loadData, logAudit, invoices })
  const privateClientsHook = usePrivateClients({ showNotification, loadData })
  const companiesHook = useCompanies({ showNotification, loadData })
  
// ✅ FIX: Added required logAudit prop to useDispatch
const dispatchHook = useDispatch({ showNotification, loadData, logAudit })

  const isAdmin = currentUser?.user_metadata?.role === 'admin'

  const menuStructure = [
    { category: 'მთავარი', items: [{ id: 'overview', icon: '📈', label: 'მიმოხილვა' }, { id: 'kpi', icon: '🎯', label: 'KPI & ანალიტიკა' }]},
    { category: 'მომხმარებლები', items: [ ...(isAdmin ? [{ id: 'users', icon: '👥', label: 'მომხმარებლები' }] : []), { id: 'roles', icon: '🔑', label: 'როლები' } ]},
    { category: 'ფლოტი & რეისები', items: [
      { id: 'dispatch', icon: '🚀', label: 'დისპეტჩერი' },
      { id: 'vehicles', icon: '🚐', label: 'მანქანები' }, 
      { id: 'drivers', icon: '👨‍✈️', label: 'მძღოლები' }, 
      { id: 'orders', icon: '📦', label: 'შეკვეთები' }, 
      { id: 'tracking', icon: '📍', label: 'ტრეკინგი' }
    ]},
    { category: 'დამკვეთები', items: [{ id: 'private_clients', icon: '👤', label: 'კერძო პირი' }, { id: 'companies', icon: '🏢', label: 'კომპანია' }]},
    { category: 'ფინანსები', items: [{ id: 'invoices', icon: '🧾', label: 'ინვოისები' }, { id: 'invoice_templates', icon: '🎨', label: 'ინვოისის შაბლონები' }, { id: 'payroll', icon: '💸', label: 'Payroll' }]},
    { category: 'სისტემა', items: [{ id: 'audit', icon: '📜', label: 'აუდიტი' }, { id: 'api', icon: '🔌', label: 'API' }, { id: 'settings', icon: '⚙️', label: 'პარამეტრები' }]},
  ]

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
    if (activeTab === 'dispatch') return <DispatchTab orders={orders} drivers={drivers} vehicles={vehiclesData} onAssign={dispatchHook.handleAssign} onViewOrder={(order: any) => { setActiveTab('orders'); ordersHook.handleEditOrderClick(order) }} getStatusColor={getStatusColor} />
    if (activeTab === 'overview') return <OverviewTab orders={orders} invoices={invoices} vehicles={vehiclesData} drivers={drivers} getStatusColor={getStatusColor} onNavigateToVehicles={() => setActiveTab('vehicles')} onNavigateToKpi={() => setActiveTab('kpi')} />
    if (activeTab === 'kpi') return <KpiTab orders={orders} invoices={invoices} vehicles={vehiclesData} drivers={drivers} loading={loading} />
    
    if (activeTab === 'users') {
      if (!isAdmin) return <div className="flex flex-col items-center justify-center h-[60vh] text-center"><span className="text-6xl mb-4">🚫</span><h3 className="text-xl font-bold text-red-400">წვდომა აკრძალულია</h3><p className="text-gray-500 text-sm mt-2">მომხმარებლების მართვა მხოლოდ ადმინისტრატორს შეუძლია.</p></div>
      return <UsersTab setNotification={(n: any) => showNotification(n.message)} />
    }
    
    if (activeTab === 'roles') return <RolesTab />
    if (activeTab === 'tracking') return <TrackingTab />
    if (activeTab === 'audit') return <AuditTab />
    if (activeTab === 'payroll') return <PayrollTab />
    if (activeTab === 'settings') return <SettingsTab />
    
    if (activeTab === 'vehicles') return (
      <VehiclesTab vehicles={vehiclesData} loading={loading} onEdit={vehicles.handleEditVehicleClick} onDelete={vehicles.handleDeleteVehicleClick} onAdd={() => vehicles.setShowAddVehicleModal(true)} getStatusColor={getStatusColor} ActionButtons={ActionButtons} onPrint={invoicesHook.handlePrintVehicle} />
    )
    
    if (activeTab === 'drivers') return (
      <DriversTab drivers={drivers} loading={loading} onEdit={driversHook.handleEditDriverClick} onDelete={driversHook.handleDeleteDriverClick} onAdd={() => driversHook.setShowAddDriverModal(true)} onAssignVehicle={driversHook.handleAssignVehicle} getStatusColor={getStatusColor} ActionButtons={ActionButtons} onPrint={invoicesHook.handlePrintDriver} />
    )
    
    if (activeTab === 'orders') return (
      <OrdersTab orders={orders} loading={loading} orderFilter={ordersHook.orderFilter} setOrderFilter={ordersHook.setOrderFilter} onStatusChange={ordersHook.handleStatusChange} onEdit={ordersHook.handleEditOrderClick} onDelete={ordersHook.handleDeleteOrderClick} onAdd={() => ordersHook.setShowOrderModal(true)} onCreateInvoice={invoicesHook.handleCreateInvoice} getStatusColor={getStatusColor} ActionButtons={ActionButtons} />
    )
    
    if (activeTab === 'invoices') return (
      <InvoicesTab invoices={invoices} loading={loading} invoiceFilter={invoicesHook.invoiceFilter} setInvoiceFilter={invoicesHook.setInvoiceFilter} onStatusChange={invoicesHook.handleInvoiceStatusChange} onView={(i: any) => { invoicesHook.setSelectedInvoice(i); invoicesHook.setShowInvoiceModal(true); }} onEmail={(i: any) => { invoicesHook.setSelectedInvoice(i); invoicesHook.setEmailTo(i.client_email || ''); invoicesHook.setShowEmailModal(true); }} getStatusColor={getStatusColor} />
    )
    
    if (activeTab === 'private_clients') return (
      <PrivateClientsTab clients={privateClients} loading={loading} onEdit={privateClientsHook.handleEditPrivateClientClick} onDelete={privateClientsHook.handleDeletePrivateClientClick} onAdd={() => privateClientsHook.setShowAddPrivateClientModal(true)} ActionButtons={ActionButtons} />
    )
    
    if (activeTab === 'companies') return (
      <CompaniesTab companies={companies} loading={loading} onEdit={companiesHook.handleEditCompanyClick} onDelete={companiesHook.handleDeleteCompanyClick} onAdd={() => companiesHook.setShowAddCompanyModal(true)} ActionButtons={ActionButtons} />
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

      {/* 🚗 ADD VEHICLE MODAL - სრული ვერსია ყველა ველით */}
      {vehicles.showAddVehicleModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => vehicles.setShowAddVehicleModal(false)}>
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">🚐 ახალი მანქანის რეგისტრაცია</h3>
              <button onClick={() => vehicles.setShowAddVehicleModal(false)} className="text-gray-400 hover:text-white text-xl transition">&times;</button>
            </div>
            <form onSubmit={vehicles.handleAddVehicle} className="p-5 overflow-y-auto space-y-6">
              
              {/* 🔴 სექცია 1: კრიტიკულად აუცილებელი */}
              <div className="bg-gray-900/20 p-4 rounded-xl border border-gray-700/50">
                <SectionHeader title="🔴 კრიტიკულად აუცილებელი (სავალდებულო)" icon="📋" color="text-red-400" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField label="სანომრე ნიშანი" hint="მაგ: AA-123-BB" required value={vehicles.vehicleForm.plate_number} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, plate_number:e.target.value})} />
                  <FormField label="VIN კოდი" hint="17 სიმბოლო" required value={vehicles.vehicleForm.vin_number} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, vin_number:e.target.value})} />
                  <FormField label="ტექ. პასპორტი / სკანი" hint="ფაილის სახელი ან URL" required value={vehicles.vehicleForm.tech_passport} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, tech_passport:e.target.value})} />
                  <FormField label="PTI ვადა (ტექ. დათვალიერება)" type="date" required value={vehicles.vehicleForm.pti_expiry} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, pti_expiry:e.target.value})} />
                  <FormField label="სამოქალაქო დაზღვევა" hint="პოლისის ნომერი" required value={vehicles.vehicleForm.insurance_policy} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, insurance_policy:e.target.value})} />
                  <FormField label="CMR დაზღვევა (ტვირთი)" hint="პოლისის ნომერი" value={vehicles.vehicleForm.insurance_cmre_policy} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, insurance_cmre_policy:e.target.value})} />
                  <FormField label="მფლობელი (სახელი/კომპანია)" hint="ვინ არის მესაკუთრე" required value={vehicles.vehicleForm.owner_name} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, owner_name:e.target.value})} />
                  <FormField label="მფლობელის ტიპი" options={[{value:'company',label:'🏢 კომპანია'},{value:'individual',label:'👤 ფიზიკური პირი'}]} value={vehicles.vehicleForm.owner_type} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, owner_type:e.target.value})} />
                  <FormField label="მინდობილობა" hint="თუ მძღოლი არ არის მესაკუთრე" value={vehicles.vehicleForm.power_of_attorney} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, power_of_attorney:e.target.value})} />
                </div>
              </div>

              {/* 🟡 სექცია 2: საოპერაციო მონაცემები */}
              <div className="bg-gray-900/20 p-4 rounded-xl border border-gray-700/50">
                <SectionHeader title="🟡 საოპერაციო მონაცემები" icon="⚙️" color="text-yellow-400" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField label="მოდელი" hint="მაგ: Mercedes Actros" required value={vehicles.vehicleForm.model} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, model:e.target.value})} />
                  <FormField label="სატრანსპორტო ტიპი" required options={[{value:'truck',label:'🚛 სატვირთო'},{value:'van',label:'🚐 ფურგონი'},{value:'car',label:'🚗 მსუბუქი'}]} value={vehicles.vehicleForm.type} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, type:e.target.value})} />
                  <FormField label="ძარის ტიპი" options={[{value:'tent',label:'🟦 ტენტი'},{value:'refrigerated',label:'❄️ მაცივარი'},{value:'container',label:'📦 კონტეინერი'},{value:'flatbed',label:'🔩 პლატფორმა'},{value:'bulk',label:'🌾 ნაყარი'},{value:'standard',label:'📦 სტანდარტული'}]} value={vehicles.vehicleForm.body_type} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, body_type:e.target.value})} />
                  <FormField label="ტვირთამწეობა (კგ)" type="number" hint="მაგ: 20000" value={vehicles.vehicleForm.capacity_kg} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, capacity_kg:e.target.value})} />
                  <FormField label="მოცულობა (m³)" type="number" hint="მაგ: 86" value={vehicles.vehicleForm.volume_m3} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, volume_m3:e.target.value})} />
                  <div className="grid grid-cols-3 gap-2">
                    <FormField label="სიგრძე (მ)" type="number" value={vehicles.vehicleForm.length_m} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, length_m:e.target.value})} />
                    <FormField label="სიგანე (მ)" type="number" value={vehicles.vehicleForm.width_m} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, width_m:e.target.value})} />
                    <FormField label="სიმაღლე (მ)" type="number" value={vehicles.vehicleForm.height_m} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, height_m:e.target.value})} />
                  </div>
                  <FormField label="ADR კლასი" hint="სახიფათო ტვირთი 1-9" value={vehicles.vehicleForm.adr_class} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, adr_class:e.target.value})} />
                  <FormField label="EURO სტანდარტი" options={[{value:'5',label:'EURO 5'},{value:'6',label:'EURO 6'},{value:'EEV',label:'EEV'}]} value={vehicles.vehicleForm.euro_standard} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, euro_standard:e.target.value})} />
                  <FormField label="ღვედების რაოდენობა" type="number" hint="მაგ: 8" value={vehicles.vehicleForm.straps_count} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, straps_count:e.target.value})} />
                  <FormField checkbox label="აქვს ლიფტი (Tail lift)" value={vehicles.vehicleForm.has_tail_lift} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, has_tail_lift:e.target.checked})} />
                  <FormField checkbox label="აქვს მაცივარი" value={vehicles.vehicleForm.has_refrigeration} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, has_refrigeration:e.target.checked})} />
                </div>
              </div>

              {/* 🔵 სექცია 3: ტექნოლოგიური & მონიტორინგი */}
              <div className="bg-gray-900/20 p-4 rounded-xl border border-gray-700/50">
                <SectionHeader title="🔵 ტექნოლოგიური & მონიტორინგი" icon="📡" color="text-blue-400" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField label="GPS მოწყობილობის ID" hint="ტრეკინგის ნომერი" value={vehicles.vehicleForm.gps_device_id} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, gps_device_id:e.target.value})} />
                  <FormField checkbox label="აქვს საწვავის სენსორი" value={vehicles.vehicleForm.has_fuel_sensor} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, has_fuel_sensor:e.target.checked})} />
                  <FormField label="ფოტოები (URL-ები)" hint="გამოყოფილი მძიმით" textarea value={vehicles.vehicleForm.photo_urls} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, photo_urls:e.target.value})} />
                  <FormField label="საბურავების სეზონი" options={[{value:'summer',label:'☀️ ზაფხული'},{value:'winter',label:'❄️ ზამთარი'},{value:'all_season',label:'🌤️ ყველა სეზონი'}]} value={vehicles.vehicleForm.tire_season} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, tire_season:e.target.value})} />
                  <FormField label="საბურავების მდგომარეობა" options={[{value:'new',label:'🟢 ახალი'},{value:'good',label:'🟡 კარგი'},{value:'replace_soon',label:'🟠 მალე შესაცვლელი'},{value:'replace_now',label:'🔴 დაუყოვნებლივ'}]} value={vehicles.vehicleForm.tire_condition} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, tire_condition:e.target.value})} />
                  <FormField label="სტატუსი" required options={[{value:'active',label:'🟢 აქტიური'},{value:'idle',label:'🟡 ლოდინში'},{value:'maintenance',label:'🔧 რემონტში'},{value:'inactive',label:'⚫ არააქტიური'}]} value={vehicles.vehicleForm.status} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, status:e.target.value})} />
                </div>
              </div>

              {/* 🟣 სექცია 4: დამატებითი */}
              <div className="bg-gray-900/20 p-4 rounded-xl border border-gray-700/50">
                <SectionHeader title="🟣 დამატებითი ინფორმაცია" icon="📝" color="text-purple-400" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="შენიშვნები" hint="შიდა შენიშვნა ან დეტალები..." textarea value={vehicles.vehicleForm.notes} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, notes:e.target.value})} />
                  <FormField label="დამატებითი აღჭურვილობა" hint="მაგ: ავტოამწე, GPS ტრეკერი..." textarea value={vehicles.vehicleForm.extra_equipment} onChange={(e:any)=>vehicles.setVehicleForm({...vehicles.vehicleForm, extra_equipment:e.target.value})} />
                </div>
              </div>

              {/* ღილაკები */}
              <div className="flex gap-3 pt-4 border-t border-gray-700 mt-2">
                <button type="button" onClick={() => vehicles.setShowAddVehicleModal(false)} className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-medium transition">გაუქმება</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-bold transition shadow-lg shadow-blue-500/20">💾 შენახვა</button>
              </div>
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
              <div className="bg-gray-900/20 p-4 rounded-xl border border-gray-700/50"><SectionHeader title="კრიტიკულად აუცილებელი" icon="🔴" color="text-red-400" /><div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label="სრული სახელი" hint="სახელი და გვარი" required value={driversHook.driverForm.full_name} onChange={(e:any)=>driversHook.setDriverForm({...driversHook.driverForm, full_name:e.target.value})} />
                <FormField label="დაბადების თარიღი" type="date" required value={driversHook.driverForm.dob} onChange={(e:any)=>driversHook.setDriverForm({...driversHook.driverForm, dob:e.target.value})} />
                <FormField label="პირადი ნომერი" hint="ID" required value={driversHook.driverForm.personal_id} onChange={(e:any)=>driversHook.setDriverForm({...driversHook.driverForm, personal_id:e.target.value})} />
                <FormField label="მობილური" hint="ვერიფიცირებული" required value={driversHook.driverForm.phone} onChange={(e:any)=>driversHook.setDriverForm({...driversHook.driverForm, phone:e.target.value})} />
                <FormField label="ელ-ფოსტა" hint="contact@email.com" required type="email" value={driversHook.driverForm.email} onChange={(e:any)=>driversHook.setDriverForm({...driversHook.driverForm, email:e.target.value})} />
                <FormField label="მისამართი" hint="საცხოვრებელი" required value={driversHook.driverForm.address} onChange={(e:any)=>driversHook.setDriverForm({...driversHook.driverForm, address:e.target.value})} />
                <FormField label="მართვის მოწმობა #" hint="ლიცენზია" required value={driversHook.driverForm.license_number} onChange={(e:any)=>driversHook.setDriverForm({...driversHook.driverForm, license_number:e.target.value})} />
                <FormField label="კატეგორია" required options={[{value:'B',label:'B'},{value:'C',label:'C'},{value:'C+E',label:'C+E'},{value:'D',label:'D'}]} value={driversHook.driverForm.license_category} onChange={(e:any)=>driversHook.setDriverForm({...driversHook.driverForm, license_category:e.target.value})} />
                <FormField label="ვადა" type="date" required value={driversHook.driverForm.license_expiry} onChange={(e:any)=>driversHook.setDriverForm({...driversHook.driverForm, license_expiry:e.target.value})} />
              </div></div>
              <div className="bg-gray-900/20 p-4 rounded-xl border border-gray-700/50"><SectionHeader title="საოპერაციო და ფინანსური" icon="🟡" color="text-yellow-400" /><div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label="გამოცდილება (წლები)" type="number" value={driversHook.driverForm.total_experience_years} onChange={(e:any)=>driversHook.setDriverForm({...driversHook.driverForm, total_experience_years:e.target.value})} />
                <div className="col-span-2"><label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wide">სპეციალური უნარები</label><textarea rows={1} value={driversHook.driverForm.special_experience} onChange={(e:any)=>driversHook.setDriverForm({...driversHook.driverForm, special_experience:e.target.value})} placeholder="მაგ: მაცივარი..." className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500 transition resize-none" /></div>
                <FormField checkbox label="ADR სერტიფიკატი" value={driversHook.driverForm.has_adr} onChange={(e:any)=>driversHook.setDriverForm({...driversHook.driverForm, has_adr:e.target.checked})} />
              </div></div>
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
              <section><h4 className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-gray-700/50 pb-2">🔴 პერსონალური</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><FormField label="სრული სახელი" required value={driversHook.editDriverForm.full_name} onChange={(e:any)=>driversHook.setEditDriverForm({...driversHook.editDriverForm, full_name:e.target.value})} /><FormField label="ტელეფონი" required value={driversHook.editDriverForm.phone} onChange={(e:any)=>driversHook.setEditDriverForm({...driversHook.editDriverForm, phone:e.target.value})} /></div></section>
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

      {/* 📦 ADD ORDER MODAL (გამოყოფილი კომპონენტი) */}
      <AddOrderModal
        isOpen={ordersHook.showOrderModal}
        onClose={() => ordersHook.setShowOrderModal(false)}
        orderForm={ordersHook.orderForm}
        setOrderForm={ordersHook.setOrderForm}
        onSubmit={ordersHook.handleAddOrder}
      />

      {/* 📦 EDIT ORDER MODAL */}
      {ordersHook.showEditOrderModal && ordersHook.editingOrder && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => ordersHook.setShowEditOrderModal(false)}>
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center bg-gray-800"><h3 className="text-sm font-bold text-white flex items-center gap-2">📦 შეკვეთის რედაქტირება</h3><button onClick={() => ordersHook.setShowEditOrderModal(false)} className="text-gray-400 hover:text-white text-xl transition">&times;</button></div>
            <form onSubmit={ordersHook.handleSaveEditOrder} className="p-5 overflow-y-auto space-y-5">
              <section><h4 className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-gray-700/50 pb-2">🔴 მარშრუტი</h4><div className="grid grid-cols-1 gap-3"><FormField label="📍 ატვირთვის მისამართი" required value={ordersHook.editOrderForm.pickup_address} onChange={(e:any)=>ordersHook.setEditOrderForm({...ordersHook.editOrderForm, pickup_address:e.target.value})} /><FormField label="🏁 ჩატვირთვის მისამართი" required value={ordersHook.editOrderForm.delivery_address} onChange={(e:any)=>ordersHook.setEditOrderForm({...ordersHook.editOrderForm, delivery_address:e.target.value})} /></div></section>
              <section><h4 className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-gray-700/50 pb-2">🟡 ტვირთი</h4><div className="grid grid-cols-1 md:grid-cols-3 gap-3"><FormField label="📦 აღწერა" required textarea value={ordersHook.editOrderForm.cargo_description} onChange={(e:any)=>ordersHook.setEditOrderForm({...ordersHook.editOrderForm, cargo_description:e.target.value})} /><FormField label="⚖️ წონა (კგ)" type="number" value={ordersHook.editOrderForm.cargo_weight_kg} onChange={(e:any)=>ordersHook.setEditOrderForm({...ordersHook.editOrderForm, cargo_weight_kg:e.target.value})} /><FormField label="💰 ფასი" type="number" value={ordersHook.editOrderForm.price} onChange={(e:any)=>ordersHook.setEditOrderForm({...ordersHook.editOrderForm, price:e.target.value})} /></div></section>
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
            <div className="flex gap-3"><button onClick={() => ordersHook.setShowDeleteOrderModal(false)} className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl text-sm font-medium transition">არყოფა</button><button onClick={ordersHook.confirmDeleteOrder} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition shadow-lg shadow-red-500/20">ვადასტურებ</button></div>
          </div>
        </div>
      )}

      {/* 🧾 INVOICE MODAL */}
      {invoicesHook.showInvoiceModal && invoicesHook.selectedInvoice && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => invoicesHook.setShowInvoiceModal(false)}>
          <div className="bg-white text-gray-900 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="print:hidden px-6 py-4 border-b border-gray-200 flex justify-between items-center"><h3 className="text-lg font-bold text-gray-800">🧾 ინვოისი: {invoicesHook.selectedInvoice.invoice_number}</h3><button onClick={() => invoicesHook.setShowInvoiceModal(false)} className="text-gray-500 hover:text-gray-800 text-xl transition">&times;</button></div>
            <div className="p-8">
              <div className="flex justify-between items-start mb-8"><div><h1 className="text-3xl font-bold text-gray-900">INVOICE</h1><p className="text-gray-500 mt-1">Logistics OS</p></div><div className="text-right"><p className="text-lg font-bold">{invoicesHook.selectedInvoice.invoice_number}</p><p className="text-gray-500">Date: {invoicesHook.selectedInvoice.issue_date}</p></div></div>
              <div className="mb-8 border-t border-b border-gray-200 py-4"><h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Bill To:</h3><p className="font-medium">{invoicesHook.selectedInvoice.client_name}</p><p className="text-gray-600">{invoicesHook.selectedInvoice.client_address}</p></div>
              <table className="w-full mb-8"><thead><tr className="text-left text-xs font-bold text-gray-500 uppercase border-b border-gray-200"><th className="py-3">Description</th><th className="py-3 text-right">Total</th></tr></thead><tbody className="text-sm"><tr className="border-b border-gray-100"><td className="py-3">Logistics Service</td><td className="py-3 text-right font-bold">{invoicesHook.selectedInvoice.total_amount} {invoicesHook.selectedInvoice.currency}</td></tr></tbody></table>
              <div className="flex justify-end"><div className="w-1/2"><div className="flex justify-between py-2 border-t border-gray-200"><span className="font-bold text-gray-800">Total</span><span className="font-bold text-xl text-blue-600">{invoicesHook.selectedInvoice.total_amount} {invoicesHook.selectedInvoice.currency}</span></div></div></div>
            </div>
          </div>
        </div>
      )}

      {/* 📧 EMAIL MODAL */}
      {invoicesHook.showEmailModal && invoicesHook.selectedInvoice && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => invoicesHook.setShowEmailModal(false)}>
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-white mb-4">📧 ინვოისის გაგზავნა</h3>
            <div className="space-y-4"><FormField label="To (Email)" required value={invoicesHook.emailTo} onChange={(e:any)=>invoicesHook.setEmailTo(e.target.value)} /><div className="flex gap-3 pt-2"><button type="button" onClick={() => invoicesHook.setShowEmailModal(false)} className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-medium transition">გაუქმება</button><button onClick={invoicesHook.handleSendEmail} className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-xs font-bold transition shadow-lg shadow-purple-500/20">📧 გაგზავნა</button></div></div>
          </div>
        </div>
      )}

      {/* 👤 ADD PRIVATE CLIENT MODAL */}
      {privateClientsHook.showAddPrivateClientModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => privateClientsHook.setShowAddPrivateClientModal(false)}>
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center bg-gray-800"><h3 className="text-sm font-bold text-white flex items-center gap-2">👤 ახალი კერძო პირი</h3><button onClick={() => privateClientsHook.setShowAddPrivateClientModal(false)} className="text-gray-400 hover:text-white text-xl transition">&times;</button></div>
            <form onSubmit={privateClientsHook.handleAddPrivateClient} className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><FormField label="სახელი და გვარი" required value={privateClientsHook.privateClientForm.full_name} onChange={(e:any)=>privateClientsHook.setPrivateClientForm({...privateClientsHook.privateClientForm, full_name:e.target.value})} /><FormField label="პირადი ნომერი" required value={privateClientsHook.privateClientForm.personal_id} onChange={(e:any)=>privateClientsHook.setPrivateClientForm({...privateClientsHook.privateClientForm, personal_id:e.target.value})} /><FormField label="ტელეფონი" required value={privateClientsHook.privateClientForm.phone} onChange={(e:any)=>privateClientsHook.setPrivateClientForm({...privateClientsHook.privateClientForm, phone:e.target.value})} /><FormField label="ელ-ფოსტა" type="email" value={privateClientsHook.privateClientForm.email} onChange={(e:any)=>privateClientsHook.setPrivateClientForm({...privateClientsHook.privateClientForm, email:e.target.value})} /></div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><FormField label="სახელი და გვარი" required value={privateClientsHook.editPrivateClientForm.full_name} onChange={(e:any)=>privateClientsHook.setEditPrivateClientForm({...privateClientsHook.editPrivateClientForm, full_name:e.target.value})} /><FormField label="პირადი ნომერი" required value={privateClientsHook.editPrivateClientForm.personal_id} onChange={(e:any)=>privateClientsHook.setEditPrivateClientForm({...privateClientsHook.editPrivateClientForm, personal_id:e.target.value})} /><FormField label="ტელეფონი" required value={privateClientsHook.editPrivateClientForm.phone} onChange={(e:any)=>privateClientsHook.setEditPrivateClientForm({...privateClientsHook.editPrivateClientForm, phone:e.target.value})} /><FormField label="ელ-ფოსტა" type="email" value={privateClientsHook.editPrivateClientForm.email} onChange={(e:any)=>privateClientsHook.setEditPrivateClientForm({...privateClientsHook.editPrivateClientForm, email:e.target.value})} /></div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><FormField label="კომპანიის სახელი" required value={companiesHook.companyForm.name} onChange={(e:any)=>companiesHook.setCompanyForm({...companiesHook.companyForm, name:e.target.value})} /><FormField label="საიდ (რეგ. ნომერი)" required value={companiesHook.companyForm.registration_number} onChange={(e:any)=>companiesHook.setCompanyForm({...companiesHook.companyForm, registration_number:e.target.value})} /><FormField label="საგადასახადო კოდი / VAT" value={companiesHook.companyForm.vat_number} onChange={(e:any)=>companiesHook.setCompanyForm({...companiesHook.companyForm, vat_number:e.target.value})} /><FormField label="საკონტაქტო პირი" value={companiesHook.companyForm.contact_person} onChange={(e:any)=>companiesHook.setCompanyForm({...companiesHook.companyForm, contact_person:e.target.value})} /><FormField label="ტელეფონი" required value={companiesHook.companyForm.phone} onChange={(e:any)=>companiesHook.setCompanyForm({...companiesHook.companyForm, phone:e.target.value})} /><FormField label="ელ-ფოსტა" type="email" value={companiesHook.companyForm.email} onChange={(e:any)=>companiesHook.setCompanyForm({...companiesHook.companyForm, email:e.target.value})} /></div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><FormField label="კომპანიის სახელი" required value={companiesHook.editCompanyForm.name} onChange={(e:any)=>companiesHook.setEditCompanyForm({...companiesHook.editCompanyForm, name:e.target.value})} /><FormField label="საიდ (რეგ. ნომერი)" required value={companiesHook.editCompanyForm.registration_number} onChange={(e:any)=>companiesHook.setEditCompanyForm({...companiesHook.editCompanyForm, registration_number:e.target.value})} /><FormField label="საგადასახადო კოდი / VAT" value={companiesHook.editCompanyForm.vat_number} onChange={(e:any)=>companiesHook.setEditCompanyForm({...companiesHook.editCompanyForm, vat_number:e.target.value})} /><FormField label="საკონტაქტო პირი" value={companiesHook.editCompanyForm.contact_person} onChange={(e:any)=>companiesHook.setEditCompanyForm({...companiesHook.editCompanyForm, contact_person:e.target.value})} /><FormField label="ტელეფონი" required value={companiesHook.editCompanyForm.phone} onChange={(e:any)=>companiesHook.setEditCompanyForm({...companiesHook.editCompanyForm, phone:e.target.value})} /><FormField label="ელ-ფოსტა" type="email" value={companiesHook.editCompanyForm.email} onChange={(e:any)=>companiesHook.setEditCompanyForm({...companiesHook.editCompanyForm, email:e.target.value})} /></div>
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
            <div className="flex gap-3"><button onClick={() => companiesHook.setShowDeleteCompanyModal(false)} className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl text-sm font-medium transition">არყოფა</button><button onClick={companiesHook.confirmDeleteCompany} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition shadow-lg shadow-red-500/20">ვადასტურებ</button></div>
          </div>
        </div>
      )}
    </div>
  )
}