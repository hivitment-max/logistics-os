'use client'

import { useState, useEffect, useCallback, useRef, FormEvent } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

// 📂 TABS IMPORTS
import OverviewTab from './tabs/OverviewTab'
import KpiTab from './tabs/KpiTab'
import VehiclesTab from './tabs/VehiclesTab'
import DriversTab from './tabs/DriversTab'
import OrdersTab from './tabs/OrdersTab'
import InvoicesTab from './tabs/InvoicesTab'
import TemplateBuilder from './templates/TemplateBuilder'

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
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [notification, setNotification] = useState<string | null>(null)
  
  const [vehicles, setVehicles] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [externalDrivers, setExternalDrivers] = useState<any[]>([])
  const [externalVehicles, setExternalVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)

  // 🚗 Vehicle States
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<any | null>(null)
  const [showEditVehicleModal, setShowEditVehicleModal] = useState(false)
  const [editVehicleForm, setEditVehicleForm] = useState<any>({})
  const [deletingVehicle, setDeletingVehicle] = useState<any | null>(null)
  const [showDeleteVehicleModal, setShowDeleteVehicleModal] = useState(false)
  
  // 🆕 განახლებული vehicleForm - 3-იერარქიული სტრუქტურა
  const [vehicleForm, setVehicleForm] = useState({
    // 🔴 High Priority
    plate_number: '', vin_number: '', tech_passport: '', pti_expiry: '',
    insurance_policy: '', insurance_cmre_policy: '', owner_name: '',
    owner_type: 'company', power_of_attorney: '',
    // 🟡 Medium Priority
    model: '', type: 'truck', body_type: 'tent', capacity_kg: '',
    volume_m3: '', length_m: '', width_m: '', height_m: '',
    adr_class: '', euro_standard: '6', has_tail_lift: false, straps_count: '',
    // 🔵 Low Priority
    gps_device_id: '', has_fuel_sensor: false, photo_urls: '',
    tire_season: 'all_season', tire_condition: 'good',
    // 📦 Legacy/Extra
    status: 'active', year_manufactured: '', mileage: '',
    fuel_type: 'diesel', color: '', last_service_date: '',
    next_service_date: '', insurance_expiry: '', notes: ''
  })

  // 👨‍✈️ Driver States
  const [showAddDriverModal, setShowAddDriverModal] = useState(false)
  const [editingDriver, setEditingDriver] = useState<any | null>(null)
  const [showEditDriverModal, setShowEditDriverModal] = useState(false)
  const [editDriverForm, setEditDriverForm] = useState<any>({})
  const [deletingDriver, setDeletingDriver] = useState<any | null>(null)
  const [showDeleteDriverModal, setShowDeleteDriverModal] = useState(false)

  // 🆕 განახლებული მძღოლის ფორმა (იერარქიული სტრუქტურა)
  const [driverForm, setDriverForm] = useState({
    // ტიპი
    employment_type: 'internal',
    // 1. High Priority
    full_name: '', dob: '', personal_id: '',
    phone: '', email: '', address: '',
    license_number: '', license_category: 'C', license_expiry: '',
    license_photo: '', criminal_record: '', driving_record: '', medical_cert: '',
    // 2. Medium Priority
    total_experience_years: '', special_experience: '', has_adr: false, adr_cert: '',
    has_own_vehicle: false, vehicle_reg: '', vehicle_insp_expiry: '', vehicle_insurance: '',
    bank_iban: '', tax_status: 'individual',
    // 3. Low Priority
    languages: '', references: '', uniform_size: 'M', photo_url: '', extra_skills: '',
    // Legacy/Helper
    is_available: true, hire_date: '', daily_rate: '', emergency_contact: ''
  })
  
  // 📦 Order States
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [editingOrder, setEditingOrder] = useState<any | null>(null)
  const [showEditOrderModal, setShowEditOrderModal] = useState(false)
  const [editOrderForm, setEditOrderForm] = useState<any>({})
  const [deletingOrder, setDeletingOrder] = useState<any | null>(null)
  const [showDeleteOrderModal, setShowDeleteOrderModal] = useState(false)
  const [orderFilter, setOrderFilter] = useState('all')
  
  const [orderForm, setOrderForm] = useState({
    pickup_address: '', delivery_address: '', cargo_description: '',
    cargo_weight_kg: '', price: '', currency: 'GEL',
    driver_type: 'internal', driver_id: '', external_driver_id: '',
    vehicle_type: 'internal', vehicle_id: '', external_vehicle_id: '',
    client_id: '', client_name: '', client_email: '', client_address: '', notes: ''
  })

  // 🧾 Invoice States
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailTo, setEmailTo] = useState('')
  const [invoiceFilter, setInvoiceFilter] = useState('all')
  const printRef = useRef<HTMLDivElement>(null)

  const showNotification = useCallback((msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 3000)
  }, [])

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }, [router])

  useEffect(() => {
    supabase.auth.getUser().then((response) => setCurrentUser(response.data.user))
  }, [])

  useEffect(() => {
    if (['vehicles', 'drivers', 'orders', 'invoices', 'overview', 'kpi', 'invoice_templates'].includes(activeTab)) loadData()
  }, [activeTab])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [vRes, dRes, oRes, iRes, extDRes, extVRes] = await Promise.all([
        supabase.from('vehicles').select('*').order('created_at', { ascending: false }),
        supabase.from('drivers').select('*').order('created_at', { ascending: false }),
        supabase.from('orders').select('*, drivers(full_name, phone), vehicles(plate_number, model)').order('created_at', { ascending: false }),
        supabase.from('invoices').select('*, orders(tracking_code, cargo_description)').order('created_at', { ascending: false }),
        supabase.from('external_drivers').select('*').order('created_at', { ascending: false }),
        supabase.from('external_vehicles').select('*').order('created_at', { ascending: false })
      ])
      if (vRes.data) setVehicles(vRes.data)
      if (dRes.data) setDrivers(dRes.data)
      if (oRes.data) setOrders(oRes.data)
      if (iRes.data) setInvoices(iRes.data)
      if (extDRes.data) setExternalDrivers(extDRes.data)
      if (extVRes.data) setExternalVehicles(extVRes.data)
    } finally { setLoading(false) }
  }, [])

  const logAudit = useCallback(async (action: string, target: string, details: string) => {
    try {
      await supabase.from('audit_logs').insert([{
        action, user_email: currentUser?.email || 'admin@logistics.ge', target, details, timestamp: new Date().toISOString()
      }])
    } catch (err) { console.warn('Audit log failed:', err) }
  }, [currentUser])

  const generateInvoiceNumber = () => `INV-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`

  const handleCreateInvoice = useCallback(async (order: any) => {
    const existing = invoices.find(i => i.order_id === order.id)
    if (existing) {
      if (!confirm(`ამ შეკვეთისთვის ინვოისი უკვე არსებობს (${existing.invoice_number}). გნებავთ ნახვა?`)) return
      setSelectedInvoice(existing)
      setShowInvoiceModal(true)
      return
    }

    const invoiceNumber = generateInvoiceNumber()
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 14)
    
    const invoiceData = {
      invoice_number: invoiceNumber, order_id: order.id, tracking_code: order.tracking_code,
      client_name: order.client_name || 'კლიენტი', client_email: order.client_email || '',
      client_address: order.client_address || '', total_amount: parseFloat(order.price) || 0,
      currency: order.currency || 'GEL', status: 'pending', issue_date: new Date().toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0], notes: `შეკვეთა: ${order.cargo_description}`
    }

    const { error, data } = await supabase.from('invoices').insert([invoiceData]).select()
    if (error) showNotification(`❌ ${error.message}`)
    else {
      await supabase.from('invoice_items').insert([{
        invoice_id: data[0].id, description: `ტრანსპორტირება: ${order.cargo_description}`,
        quantity: 1, unit_price: parseFloat(order.price) || 0, total: parseFloat(order.price) || 0
      }])
      await logAudit('INVOICE_CREATED', invoiceNumber, `შეიქმნა შეკვეთისთვის: ${order.tracking_code}`)
      showNotification(`✅ ინვოისი შეიქმნა: ${invoiceNumber}`)
      loadData()
    }
  }, [invoices, showNotification, logAudit, loadData])

  const handlePrint = useCallback(() => window.print(), [])
  const handleSendEmail = useCallback(async () => {
    if (!selectedInvoice || !emailTo) return
    showNotification(`📧 ინვოისი გაიგზავნა: ${emailTo}`)
    setShowEmailModal(false)
    setEmailTo('')
    await logAudit('INVOICE_EMAIL_SENT', selectedInvoice.invoice_number, `გაიგზავნა: ${emailTo}`)
  }, [selectedInvoice, emailTo, showNotification, logAudit])

  // ============================================================================
  // 🖨️ PRINT HANDLERS - ახალი ფუნქციები
  // ============================================================================

  // 🧑‍✈️ მძღოლის პროფილის დაბეჭდვა
  const handlePrintDriver = useCallback((driver: any) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>მძღოლის პროფილი - ${driver.full_name}</title>
        <style>
          @media print {
            body { font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 11px; color: #1f2937; margin: 20px; }
            .header { border-bottom: 3px solid #2563eb; padding-bottom: 10px; margin-bottom: 20px; }
            .section { margin-bottom: 15px; page-break-inside: avoid; }
            .section-title { font-weight: bold; color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 8px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 20px; }
            .field { margin-bottom: 4px; }
            .label { font-weight: 600; color: #6b7280; }
            .value { margin-left: 5px; }
            .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; }
            .badge-green { background: #dcfce7; color: #166534; }
            .badge-yellow { background: #fef3c7; color: #92400e; }
            .badge-red { background: #fee2e2; color: #991b1b; }
            .footer { margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 10px; font-size: 9px; color: #6b7280; text-align: center; }
            @page { margin: 15mm; size: A4; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0; font-size: 18px;">👨‍✈️ მძღოლის პროფილი</h1>
          <p style="margin: 5px 0 0 0; color: #6b7280;">Logistics OS • ${new Date().toLocaleDateString('ka-GE')}</p>
        </div>

        <div class="section">
          <div class="section-title">🔴 პერსონალური ინფორმაცია</div>
          <div class="grid">
            <div class="field"><span class="label">სახელი:</span><span class="value">${driver.full_name || '–'}</span></div>
            <div class="field"><span class="label">დაბ. თარიღი:</span><span class="value">${driver.dob || '–'}</span></div>
            <div class="field"><span class="label">პირადი ნომერი:</span><span class="value">${driver.personal_id || '–'}</span></div>
            <div class="field"><span class="label">ტელეფონი:</span><span class="value">${driver.phone || '–'}</span></div>
            <div class="field"><span class="label">ელ-ფოსტა:</span><span class="value">${driver.email || '–'}</span></div>
            <div class="field"><span class="label">მისამართი:</span><span class="value">${driver.address || '–'}</span></div>
            <div class="field"><span class="label">დასაქმების ტიპი:</span><span class="value">${driver.employment_type === 'internal' ? '🏢 კომპანია' : '🤝 კონტრაქტით'}</span></div>
            <div class="field"><span class="label">ხელმისაწვდომი:</span><span class="value">${driver.is_available ? '🟢 კი' : '🔴 არა'}</span></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">🟡 ლიცენზია & კვალიფიკაცია</div>
          <div class="grid">
            <div class="field"><span class="label">ლიცენზია #:</span><span class="value">${driver.license_number || '–'}</span></div>
            <div class="field"><span class="label">კატეგორია:</span><span class="value">${driver.license_category || '–'}</span></div>
            <div class="field"><span class="label">ვადა:</span><span class="value">${driver.license_expiry || '–'}</span></div>
            <div class="field"><span class="label">გამოცდილება:</span><span class="value">${driver.total_experience_years ? `${driver.total_experience_years} წელი` : '–'}</span></div>
            <div class="field"><span class="label">ADR:</span><span class="value">${driver.has_adr ? '✅ აქვს' : '❌ არ აქვს'}</span></div>
            <div class="field"><span class="label">სპეც. უნარები:</span><span class="value">${driver.special_experience || '–'}</span></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">🔵 ფინანსური & დამატებითი</div>
          <div class="grid">
            <div class="field"><span class="label">IBAN:</span><span class="value">${driver.bank_iban || '–'}</span></div>
            <div class="field"><span class="label">საგადასახადო:</span><span class="value">${driver.tax_status || '–'}</span></div>
            <div class="field"><span class="label">დღიური განაკვეთი:</span><span class="value">${driver.daily_rate ? `${driver.daily_rate} ₾` : '–'}</span></div>
            <div class="field"><span class="label">ენები:</span><span class="value">${driver.languages || '–'}</span></div>
            <div class="field"><span class="label">ფორმის ზომა:</span><span class="value">${driver.uniform_size || '–'}</span></div>
            <div class="field"><span class="label">დამატებითი:</span><span class="value">${driver.extra_skills || '–'}</span></div>
          </div>
        </div>

        ${driver.has_own_vehicle ? `
        <div class="section">
          <div class="section-title">🚗 საკუთარი მანქანა</div>
          <div class="grid">
            <div class="field"><span class="label">რეგისტრაცია:</span><span class="value">${driver.vehicle_reg || '–'}</span></div>
            <div class="field"><span class="label">ტექ. ვადა:</span><span class="value">${driver.vehicle_insp_expiry || '–'}</span></div>
            <div class="field"><span class="label">დაზღვევა:</span><span class="value">${driver.vehicle_insurance || '–'}</span></div>
          </div>
        </div>` : ''}

        <div class="footer">
          <p>დოკუმენტი გენერირებულია: ${new Date().toLocaleString('ka-GE')} • Logistics OS Platform</p>
          <p style="margin-top: 5px;">ეს არის ოფიციალური ჩანაწერი სისტემიდან. თუ გაქვთ შეკითხვები, დაუკავშირდით: support@logistics.ge</p>
        </div>

        <script>window.onload = () => { window.print(); }</script>
      </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
  }, [])

  // 🚐 მანქანის პროფილის დაბეჭდვა
  const handlePrintVehicle = useCallback((vehicle: any) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const getPTIStatus = (expiry: string) => {
      if (!expiry) return { label: '–', class: '' }
      const days = Math.ceil((new Date(expiry).getTime() - Date.now()) / (1000*60*60*24))
      if (days < 0) return { label: '🔴 ვადაგასული', class: 'badge-red' }
      if (days <= 30) return { label: `🟡 ${days}დ. დარჩა`, class: 'badge-yellow' }
      return { label: `🟢 მოქმედია`, class: 'badge-green' }
    }

    const pti = getPTIStatus(vehicle.pti_expiry)

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>მანქანის პროფილი - ${vehicle.plate_number}</title>
        <style>
          @media print {
            body { font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 11px; color: #1f2937; margin: 20px; }
            .header { border-bottom: 3px solid #2563eb; padding-bottom: 10px; margin-bottom: 20px; }
            .section { margin-bottom: 15px; page-break-inside: avoid; }
            .section-title { font-weight: bold; color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 8px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 20px; }
            .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px 15px; }
            .field { margin-bottom: 4px; }
            .label { font-weight: 600; color: #6b7280; }
            .value { margin-left: 5px; }
            .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; }
            .badge-green { background: #dcfce7; color: #166534; }
            .badge-yellow { background: #fef3c7; color: #92400e; }
            .badge-red { background: #fee2e2; color: #991b1b; }
            .badge-blue { background: #dbeafe; color: #1e40af; }
            .footer { margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 10px; font-size: 9px; color: #6b7280; text-align: center; }
            @page { margin: 15mm; size: A4; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0; font-size: 18px;">🚐 მანქანის პროფილი</h1>
          <p style="margin: 5px 0 0 0; color: #6b7280;">Logistics OS • ${new Date().toLocaleDateString('ka-GE')}</p>
        </div>

        <div class="section">
          <div class="section-title">🔴 იდენტიფიკაცია & სამართლებრივი</div>
          <div class="grid">
            <div class="field"><span class="label">სანომრე:</span><span class="value" style="font-weight:bold; color:#2563eb">${vehicle.plate_number || '–'}</span></div>
            <div class="field"><span class="label">VIN:</span><span class="value">${vehicle.vin_number || '–'}</span></div>
            <div class="field"><span class="label">ტექ. პასპორტი:</span><span class="value">${vehicle.tech_passport || '–'}</span></div>
            <div class="field"><span class="label">PTI ვადა:</span><span class="value ${pti.class}">${pti.label}</span></div>
            <div class="field"><span class="label">სამოქალაქო დაზღვევა:</span><span class="value">${vehicle.insurance_policy ? '✅ აქვს' : '❌ არ აქვს'}</span></div>
            <div class="field"><span class="label">CMR დაზღვევა:</span><span class="value">${vehicle.insurance_cmre_policy ? '✅ აქვს' : '❌ არ აქვს'}</span></div>
            <div class="field"><span class="label">მფლობელი:</span><span class="value">${vehicle.owner_name || '–'} ${vehicle.owner_type === 'company' ? '(🏢)' : '(👤)'}</span></div>
            <div class="field"><span class="label">მინდობილობა:</span><span class="value">${vehicle.power_of_attorney || '–'}</span></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">🟡 ტექნიკური პარამეტრები</div>
          <div class="grid-3">
            <div class="field"><span class="label">მოდელი:</span><span class="value">${vehicle.model || '–'}</span></div>
            <div class="field"><span class="label">ტიპი:</span><span class="value">${vehicle.type || '–'}</span></div>
            <div class="field"><span class="label">ძარა:</span><span class="value">${vehicle.body_type || '–'}</span></div>
            <div class="field"><span class="label">ტევადობა:</span><span class="value">${vehicle.capacity_kg ? `${(vehicle.capacity_kg/1000).toFixed(1)}ტ` : '–'}</span></div>
            <div class="field"><span class="label">მოცულობა:</span><span class="value">${vehicle.volume_m3 ? `${vehicle.volume_m3}m³` : '–'}</span></div>
            <div class="field"><span class="label">გაბარიტები:</span><span class="value">${vehicle.length_m && vehicle.width_m && vehicle.height_m ? `${vehicle.length_m}×${vehicle.width_m}×${vehicle.height_m}მ` : '–'}</span></div>
            <div class="field"><span class="label">ADR:</span><span class="value">${vehicle.adr_class ? `კლ. ${vehicle.adr_class}` : '–'}</span></div>
            <div class="field"><span class="label">EURO:</span><span class="value">${vehicle.euro_standard ? `EURO ${vehicle.euro_standard}` : '–'}</span></div>
            <div class="field"><span class="label">Tail Lift:</span><span class="value">${vehicle.has_tail_lift ? '✅ აქვს' : '❌ არ აქვს'}</span></div>
            <div class="field"><span class="label">ღვედები:</span><span class="value">${vehicle.straps_count ? `${vehicle.straps_count} ცალი` : '–'}</span></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">🔵 ტექნოლოგიური & მონიტორინგი</div>
          <div class="grid">
            <div class="field"><span class="label">GPS ID:</span><span class="value">${vehicle.gps_device_id || '–'}</span></div>
            <div class="field"><span class="label">საწვავის სენსორი:</span><span class="value">${vehicle.has_fuel_sensor ? '✅ აქვს' : '❌ არ აქვს'}</span></div>
            <div class="field"><span class="label">საბურავების სეზონი:</span><span class="value">${vehicle.tire_season === 'winter' ? '❄️ ზამთარი' : vehicle.tire_season === 'summer' ? '☀️ ზაფხული' : '🌤️ ყველა'}</span></div>
            <div class="field"><span class="label">საბურავების მდგომ.:</span><span class="value">${vehicle.tire_condition || '–'}</span></div>
            <div class="field"><span class="label">სტატუსი:</span><span class="value"><span class="badge ${vehicle.status === 'active' ? 'badge-green' : vehicle.status === 'maintenance' ? 'badge-red' : 'badge-yellow'}">${vehicle.status}</span></span></div>
          </div>
        </div>

        ${vehicle.notes ? `
        <div class="section">
          <div class="section-title">📝 შენიშვნები</div>
          <p style="margin: 0; white-space: pre-wrap;">${vehicle.notes}</p>
        </div>` : ''}

        <div class="footer">
          <p>დოკუმენტი გენერირებულია: ${new Date().toLocaleString('ka-GE')} • Logistics OS Platform</p>
          <p style="margin-top: 5px;">ეს არის ოფიციალური ჩანაწერი სისტემიდან. თუ გაქვთ შეკითხვები, დაუკავშირდით: support@logistics.ge</p>
        </div>

        <script>window.onload = () => { window.print(); }</script>
      </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
  }, [])

  // 🚗 HANDLERS - ✅ განახლებული ახალი ველებით
  const handleAddVehicle = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 🔧 თარიღის ველების კონვერტაცია: "" → null
    const payload = {
      ...vehicleForm,
      pti_expiry: vehicleForm.pti_expiry || null,
      insurance_expiry: vehicleForm.insurance_expiry || null,
      last_service_date: vehicleForm.last_service_date || null,
      next_service_date: vehicleForm.next_service_date || null,
      
      year_manufactured: vehicleForm.year_manufactured ? parseInt(vehicleForm.year_manufactured) : null,
      capacity_kg: vehicleForm.capacity_kg ? parseInt(vehicleForm.capacity_kg) : null,
      mileage: vehicleForm.mileage ? parseInt(vehicleForm.mileage) : null,
      volume_m3: vehicleForm.volume_m3 ? parseFloat(vehicleForm.volume_m3) : null,
      length_m: vehicleForm.length_m ? parseFloat(vehicleForm.length_m) : null,
      width_m: vehicleForm.width_m ? parseFloat(vehicleForm.width_m) : null,
      height_m: vehicleForm.height_m ? parseFloat(vehicleForm.height_m) : null,
      straps_count: vehicleForm.straps_count ? parseInt(vehicleForm.straps_count) : 0,
      has_tail_lift: Boolean(vehicleForm.has_tail_lift),
      has_fuel_sensor: Boolean(vehicleForm.has_fuel_sensor)
    }
    
    const { error } = await supabase.from('vehicles').insert([payload])
    if (error) showNotification(`❌ ${error.message}`)
    else {
      showNotification('✅ მანქანა წარმატებით დაემატა!')
      setShowAddVehicleModal(false)
      setVehicleForm({ 
        plate_number: '', model: '', type: 'truck', status: 'active', vin_number: '', 
        year_manufactured: '', capacity_kg: '', mileage: '', fuel_type: 'diesel', color: '', 
        last_service_date: '', next_service_date: '', insurance_expiry: '', insurance_policy: '', 
        tech_passport: '', notes: '', pti_expiry: '', volume_m3: '', 
        length_m: '', width_m: '', height_m: '', straps_count: '', has_tail_lift: false, 
        has_fuel_sensor: false, insurance_cmre_policy: '', owner_name: '', owner_type: 'company', 
        power_of_attorney: '', body_type: 'tent', adr_class: '', euro_standard: '6', 
        gps_device_id: '', photo_urls: '', tire_season: 'all_season', tire_condition: 'good' 
      })
      loadData()
    }
  }, [vehicleForm, showNotification, loadData])

  const handleEditVehicleClick = (vehicle: any) => { setEditingVehicle(vehicle); setEditVehicleForm({ ...vehicle }); setShowEditVehicleModal(true) }
  const handleSaveEditVehicle = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingVehicle) return
    
    const payload = {
      ...editVehicleForm,
      pti_expiry: editVehicleForm.pti_expiry || null,
      insurance_expiry: editVehicleForm.insurance_expiry || null,
      last_service_date: editVehicleForm.last_service_date || null,
      next_service_date: editVehicleForm.next_service_date || null,
      vehicle_insp_expiry: editVehicleForm.vehicle_insp_expiry || null,
      year_manufactured: editVehicleForm.year_manufactured ? parseInt(editVehicleForm.year_manufactured) : null,
      capacity_kg: editVehicleForm.capacity_kg ? parseInt(editVehicleForm.capacity_kg) : null,
      mileage: editVehicleForm.mileage ? parseInt(editVehicleForm.mileage) : null
    }
    
    const { error } = await supabase.from('vehicles').update(payload).eq('id', editingVehicle.id)
    if (error) showNotification(`❌ ${error.message}`)
    else { showNotification('✅ მანქანა განახლდა!'); setShowEditVehicleModal(false); setEditingVehicle(null); loadData() }
  }, [editingVehicle, editVehicleForm, showNotification, loadData])

  const handleDeleteVehicleClick = (vehicle: any) => { setDeletingVehicle(vehicle); setShowDeleteVehicleModal(true) }
  const confirmDeleteVehicle = useCallback(async () => {
    if (!deletingVehicle) return
    const { error } = await supabase.from('vehicles').delete().eq('id', deletingVehicle.id)
    if (error) showNotification(`❌ ${error.message}`)
    else { showNotification('🗑️ წაიშალა!'); setShowDeleteVehicleModal(false); setDeletingVehicle(null); loadData() }
  }, [deletingVehicle, showNotification, loadData])

  // 👨‍✈️ DRIVER HANDLERS - ✅ გამოსწორებული თარიღის ლოგიკით
  const handleAddDriver = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 🔧 თარიღის ველების კონვერტაცია: "" → null
    const payload = {
      ...driverForm,
      dob: driverForm.dob || null,
      license_expiry: driverForm.license_expiry || null,
      vehicle_insp_expiry: driverForm.vehicle_insp_expiry || null,
      hire_date: driverForm.hire_date || null,
      
      daily_rate: driverForm.daily_rate ? parseFloat(driverForm.daily_rate) : null,
      is_available: Boolean(driverForm.is_available),
      total_experience_years: driverForm.total_experience_years ? parseInt(driverForm.total_experience_years) : null,
      has_adr: Boolean(driverForm.has_adr),
      has_own_vehicle: Boolean(driverForm.has_own_vehicle)
    }
    
    const { error } = await supabase.from('drivers').insert([payload])
    if (error) showNotification(`❌ ${error.message}`)
    else {
      showNotification('✅ მძღოლი წარმატებით დაემატა!')
      setShowAddDriverModal(false)
      setDriverForm(p => ({ ...p, full_name: '', dob: '', personal_id: '', phone: '', email: '', address: '', license_number: '', license_category: 'C', license_expiry: '', license_photo: '', criminal_record: '', driving_record: '', medical_cert: '', total_experience_years: '', special_experience: '', has_adr: false, adr_cert: '', has_own_vehicle: false, vehicle_reg: '', vehicle_insp_expiry: '', vehicle_insurance: '', bank_iban: '', tax_status: 'individual', languages: '', references: '', uniform_size: 'M', photo_url: '', extra_skills: '', employment_type: 'internal', hire_date: '', emergency_contact: '' }))
      loadData()
    }
  }, [driverForm, showNotification, loadData])

  const handleEditDriverClick = (driver: any) => { setEditingDriver(driver); setEditDriverForm({ ...driver }); setShowEditDriverModal(true) }
  const handleSaveEditDriver = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDriver) return
    
    const payload = {
      ...editDriverForm,
      dob: editDriverForm.dob || null,
      license_expiry: editDriverForm.license_expiry || null,
      vehicle_insp_expiry: editDriverForm.vehicle_insp_expiry || null,
      hire_date: editDriverForm.hire_date || null,
      
      daily_rate: editDriverForm.daily_rate ? parseFloat(editDriverForm.daily_rate) : null,
      has_adr: Boolean(editDriverForm.has_adr),
      has_own_vehicle: Boolean(editDriverForm.has_own_vehicle)
    }
    
    const { error } = await supabase.from('drivers').update(payload).eq('id', editingDriver.id)
    if (error) showNotification(`❌ ${error.message}`)
    else { showNotification('✅ მძღოლი განახლდა!'); setShowEditDriverModal(false); setEditingDriver(null); loadData() }
  }, [editingDriver, editDriverForm, showNotification, loadData])

  const handleDeleteDriverClick = (driver: any) => { setDeletingDriver(driver); setShowDeleteDriverModal(true) }
  const confirmDeleteDriver = useCallback(async () => {
    if (!deletingDriver) return
    const { error } = await supabase.from('drivers').delete().eq('id', deletingDriver.id)
    if (error) showNotification(`❌ ${error.message}`)
    else { showNotification('🗑️ წაიშალა!'); setShowDeleteDriverModal(false); setDeletingDriver(null); loadData() }
  }, [deletingDriver, showNotification, loadData])

  const handleAssignVehicle = useCallback(async (driverId: string, vehicleId: string) => {
    const { error } = await supabase.from('drivers').update({ vehicle_id: vehicleId || null }).eq('id', driverId)
    if (error) showNotification(`❌ ${error.message}`)
    else { showNotification(vehicleId ? '✅ მიენიჭა!' : '🚫 მოხსნილია!'); loadData() }
  }, [showNotification, loadData])

  // 📦 ORDER HANDLERS
  const handleAddOrder = useCallback(async (e: FormEvent) => {
    e.preventDefault()
    const tracking_code = `LOG-${Date.now().toString().slice(-6)}`
    let extDriverRate = 0, extVehicleRate = 0
    if (orderForm.driver_type === 'external' && orderForm.external_driver_id) {
      const d = externalDrivers.find(d => d.id === orderForm.external_driver_id)
      extDriverRate = d?.rate_per_km || 0
    }
    if (orderForm.vehicle_type === 'external' && orderForm.external_vehicle_id) {
      const v = externalVehicles.find(v => v.id === orderForm.external_vehicle_id)
      extVehicleRate = v?.rate_per_km || 0
    }

    const payload = {
      pickup_address: orderForm.pickup_address, delivery_address: orderForm.delivery_address,
      cargo_description: orderForm.cargo_description, cargo_weight_kg: parseFloat(orderForm.cargo_weight_kg) || 0,
      price: parseFloat(orderForm.price) || 0, currency: orderForm.currency,
      client_name: orderForm.client_name, client_email: orderForm.client_email, client_address: orderForm.client_address,
      notes: orderForm.notes, tracking_code, status: 'pending',
      driver_type: orderForm.driver_type, vehicle_type: orderForm.vehicle_type,
      driver_id: orderForm.driver_type === 'internal' ? orderForm.driver_id || null : null,
      external_driver_id: orderForm.driver_type === 'external' ? orderForm.external_driver_id || null : null,
      vehicle_id: orderForm.vehicle_type === 'internal' ? orderForm.vehicle_id || null : null,
      external_vehicle_id: orderForm.vehicle_type === 'external' ? orderForm.external_vehicle_id || null : null,
      external_driver_rate: extDriverRate, external_vehicle_rate: extVehicleRate,
      client_id: orderForm.client_id || null
    }

    const { error } = await supabase.from('orders').insert([payload])
    if (error) showNotification(`❌ ${error.message}`)
    else {
      await supabase.from('tracking_events').insert({ order_id: tracking_code, event_type: 'created', location_name: 'ადმინ პანელი', notes: `შეკვეთა შეიქმნა: ${orderForm.cargo_description}` })
      await logAudit('ORDER_CREATED', tracking_code, `შეიქმნა ადმინისტრატორის მიერ`)
      showNotification(`✅ შეკვეთა შეიქმნა: ${tracking_code}`)
      setShowOrderModal(false)
      setOrderForm({ pickup_address: '', delivery_address: '', cargo_description: '', cargo_weight_kg: '', price: '', currency: 'GEL', driver_type: 'internal', driver_id: '', external_driver_id: '', vehicle_type: 'internal', vehicle_id: '', external_vehicle_id: '', client_id: '', client_name: '', client_email: '', client_address: '', notes: '' })
      loadData()
    }
  }, [orderForm, externalDrivers, externalVehicles, showNotification, loadData, logAudit])

  const handleEditOrderClick = (order: any) => { setEditingOrder(order); setEditOrderForm({ ...order }); setShowEditOrderModal(true) }
  const handleSaveEditOrder = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingOrder) return
    const { drivers: _d, vehicles: _v, created_at: _ca, updated_at: _ua, id: _id, tracking_code: _tc, ...cleanForm } = editOrderForm
    const payload = { ...cleanForm, cargo_weight_kg: parseFloat(cleanForm.cargo_weight_kg) || 0, price: parseFloat(cleanForm.price) || 0, driver_id: cleanForm.driver_id || null, vehicle_id: cleanForm.vehicle_id || null, client_id: cleanForm.client_id || null }
    const { error } = await supabase.from('orders').update(payload).eq('id', editingOrder.id)
    if (error) showNotification(`❌ ${error.message}`)
    else { await logAudit('ORDER_UPDATED', editingOrder.tracking_code, `განახლდა`); showNotification('✅ განახლდა!'); setShowEditOrderModal(false); setEditingOrder(null); loadData() }
  }, [editingOrder, editOrderForm, showNotification, loadData, logAudit])
  
  const handleDeleteOrderClick = (order: any) => { setDeletingOrder(order); setShowDeleteOrderModal(true) }
  const confirmDeleteOrder = useCallback(async () => {
    if (!deletingOrder) return
    const { error } = await supabase.from('orders').delete().eq('id', deletingOrder.id)
    if (error) showNotification(`❌ ${error.message}`)
    else { 
      await logAudit('ORDER_DELETED', deletingOrder.tracking_code, `წაიშალა`); 
      showNotification('🗑️ შეკვეთა წაიშალა!'); 
      setShowDeleteOrderModal(false); 
      setDeletingOrder(null); 
      loadData(); 
    }
  }, [deletingOrder, showNotification, loadData, logAudit])
  
  const handleStatusChange = useCallback(async (orderId: string, newStatus: string) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
    if (error) showNotification(`❌ ${error.message}`)
    else {
      const order = orders.find(o => o.id === orderId)
      if (order) {
        await supabase.from('tracking_events').insert({ order_id: order.tracking_code, event_type: 'status_changed', location_name: 'ადმინ პანელი', notes: `სტატუსი: ${order.status} → ${newStatus}` })
        await logAudit('STATUS_CHANGED', order.tracking_code, `სტატუსი: ${newStatus}`)
      }
      showNotification(`✅ სტატუსი: ${newStatus}`)
      loadData()
    }
  }, [orders, showNotification, loadData, logAudit])

  const handleInvoiceStatusChange = useCallback(async (invoiceId: any, newStatus: string) => {
    const { error } = await supabase.from('invoices').update({ status: newStatus }).eq('id', invoiceId)
    if (error) showNotification(`❌ ${error.message}`)
    else {
      const invoice = invoices.find(i => i.id === invoiceId)
      if (invoice) {
        await logAudit('INVOICE_STATUS_CHANGED', invoice.invoice_number || 'INVOICE', `სტატუსი: ${invoice.status} → ${newStatus}`)
      }
      showNotification(`✅ ინვოისის სტატუსი შეიცვალა: ${newStatus}`)
      loadData()
    }
  }, [invoices, showNotification, loadData, logAudit])

  const menuStructure = [
    { category: 'მთავარი', items: [{ id: 'overview', icon: '📈', label: 'მიმოხილვა' }, { id: 'kpi', icon: '🎯', label: 'KPI & ანალიტიკა' }]},
    { category: 'მომხმარებლები', items: [{ id: 'users', icon: '👥', label: 'მომხმარებლები' }, { id: 'roles', icon: '🔑', label: 'როლები' }]},
    { category: 'ფლოტი & რეისები', items: [{ id: 'vehicles', icon: '🚐', label: 'მანქანები' }, { id: 'drivers', icon: '👨‍✈️', label: 'მძღოლები' }, { id: 'orders', icon: '📦', label: 'შეკვეთები' }, { id: 'tracking', icon: '📍', label: 'ტრეკინგი' }]},
    { category: 'ფინანსები', items: [{ id: 'invoices', icon: '🧾', label: 'ინვოისები' }, { id: 'invoice_templates', icon: '🎨', label: 'ინვოისის შაბლონები' }, { id: 'payroll', icon: '💸', label: 'Payroll' }]},
    { category: 'სისტემა', items: [{ id: 'audit', icon: '📜', label: 'აუდიტი' }, { id: 'api', icon: '🔌', label: 'API' }, { id: 'settings', icon: '⚙️', label: 'პარამეტრები' }]},
  ]

  // 🖨️ განახლებული ActionButtons - დაემატა onPrint პროპი
  const ActionButtons = ({ 
    onEdit, 
    onDelete, 
    onPrint 
  }: { 
    onEdit: () => void; 
    onDelete: () => void; 
    onPrint?: () => void; 
  }) => (
    <div className="flex items-center justify-end gap-1">
      {onPrint && (
        <button onClick={onPrint} className="p-1.5 text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 rounded-md transition" title="დაბეჭდვა">🖨️</button>
      )}
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

  const getCurrentItem = () => menuStructure.flatMap(g => g.items).find(i => i.id === activeTab) || { icon: '📄', label: 'გვერდი' }
  const currentItem = getCurrentItem()

  const renderContent = () => {
    if (activeTab === 'overview') return (
      <OverviewTab orders={orders} invoices={invoices} vehicles={vehicles} drivers={drivers} getStatusColor={getStatusColor} onNavigateToVehicles={() => setActiveTab('vehicles')} onNavigateToKpi={() => setActiveTab('kpi')} />
    )
    if (activeTab === 'kpi') return <KpiTab orders={orders} invoices={invoices} vehicles={vehicles} drivers={drivers} loading={loading} />
    
    // 🚗 Vehicles Tab - გადაეცა onPrint
    if (activeTab === 'vehicles') return (
      <VehiclesTab 
        vehicles={vehicles}
        loading={loading}
        onEdit={handleEditVehicleClick}
        onDelete={handleDeleteVehicleClick}
        onAdd={() => setShowAddVehicleModal(true)}
        getStatusColor={getStatusColor}
        ActionButtons={ActionButtons}
        onPrint={handlePrintVehicle} // ✅ ახალი
      />
    )
    
    // 👨‍✈️ Drivers Tab - გადაეცა onPrint
    if (activeTab === 'drivers') return (
      <DriversTab 
        drivers={drivers}
        loading={loading}
        onEdit={handleEditDriverClick}
        onDelete={handleDeleteDriverClick}
        onAdd={() => setShowAddDriverModal(true)}
        onAssignVehicle={handleAssignVehicle}
        getStatusColor={getStatusColor}
        ActionButtons={ActionButtons}
        onPrint={handlePrintDriver} // ✅ ახალი
      />
    )
    
    if (activeTab === 'orders') return <OrdersTab orders={orders} loading={loading} orderFilter={orderFilter} setOrderFilter={setOrderFilter} onStatusChange={handleStatusChange} onEdit={handleEditOrderClick} onDelete={handleDeleteOrderClick} onAdd={() => setShowOrderModal(true)} onCreateInvoice={handleCreateInvoice} getStatusColor={getStatusColor} ActionButtons={ActionButtons} />
    if (activeTab === 'invoices') return <InvoicesTab invoices={invoices} loading={loading} invoiceFilter={invoiceFilter} setInvoiceFilter={setInvoiceFilter} onStatusChange={handleInvoiceStatusChange} onView={(i) => { setSelectedInvoice(i); setShowInvoiceModal(true); }} onEmail={(i) => { setSelectedInvoice(i); setEmailTo(i.client_email || ''); setShowEmailModal(true); }} getStatusColor={getStatusColor} />
    if (activeTab === 'invoice_templates') return <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-5 min-h-[600px]"><TemplateBuilder onSave={() => setActiveTab('invoices')} /></div>
    return (<div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-6 text-center"><h3 className="text-sm font-bold mb-1">{currentItem.label}</h3><p className="text-[10px] text-gray-500">კონტენტი მზადდება...</p></div>)
  }

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      {notification && <div className="fixed top-3 right-3 z-50 bg-gray-800 border border-gray-600 text-white px-4 py-2 rounded-lg shadow-xl text-xs flex items-center gap-2">{notification}</div>}

      <aside className="w-52 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
        <div className="h-11 flex items-center px-3 border-b border-gray-800"><span className="text-xs font-bold text-blue-400 tracking-wide">🚛 LOGISTICS OS</span></div>
        <nav className="flex-1 overflow-y-auto py-2 px-1.5 space-y-0.5">
          {menuStructure.map((group) => (<div key={group.category} className="mb-2"><p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest px-2 mb-1">{group.category}</p>{group.items.map((item) => (<button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-all text-[11px] ${activeTab === item.id ? 'bg-blue-600/90 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-800/60 hover:text-gray-300'}`}><span className="text-sm w-4 text-center shrink-0">{item.icon}</span><span className="truncate">{item.label}</span></button>))}</div>))}
        </nav>
        <div className="p-3 border-t border-gray-800 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0"><div className="w-7 h-7 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 flex items-center justify-center text-[10px] font-bold shadow-md shrink-0">A</div><div className="flex-1 min-w-0"><p className="text-[10px] font-medium truncate text-gray-300">admin@logistics.ge</p></div></div>
            <button onClick={handleSignOut} className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-lg transition">🚪</button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-gray-950 flex flex-col">
        <header className="sticky top-0 z-10 bg-gray-950/90 backdrop-blur border-b border-gray-800/50 px-5 py-2"><div className="flex justify-between items-center"><div><h1 className="text-sm font-bold flex items-center gap-2 text-gray-100">{currentItem.icon} {currentItem.label}</h1></div><button onClick={() => showNotification('🔔 ახალი შეტყობინებები')} className="relative p-1.5 hover:bg-gray-800 rounded-lg transition"><span className="text-lg leading-none">🔔</span></button></div></header>
        <div className="flex-1 p-4 space-y-4">{renderContent()}</div>
      </main>

      {/* 🚗 ADD VEHICLE MODAL - ახალი 3-საფეხურიანი სტრუქტურა */}
      {showAddVehicleModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowAddVehicleModal(false)}>
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">🚐 ახალი მანქანის რეგისტრაცია</h3>
              <button onClick={() => setShowAddVehicleModal(false)} className="text-gray-400 hover:text-white text-xl transition">&times;</button>
            </div>
            <form onSubmit={handleAddVehicle} className="p-5 overflow-y-auto space-y-5">
              
              {/* 1. High Priority */}
              <div className="bg-gray-900/20 p-4 rounded-xl border border-gray-700/50">
                <SectionHeader title="კრიტიკულად აუცილებელი (სავალდებულო)" icon="🔴" color="text-red-400" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField label="სანომრე ნიშანი" hint="AA-123-BB" required value={vehicleForm.plate_number} onChange={(e:any)=>setVehicleForm({...vehicleForm, plate_number:e.target.value})} />
                  <FormField label="VIN კოდი" hint="17 სიმბოლო" required value={vehicleForm.vin_number} onChange={(e:any)=>setVehicleForm({...vehicleForm, vin_number:e.target.value})} />
                  <FormField label="ტექ. პასპორტი / სკანი" hint="ფაილის სახელი ან URL" required value={vehicleForm.tech_passport} onChange={(e:any)=>setVehicleForm({...vehicleForm, tech_passport:e.target.value})} />
                  <FormField label="PTI ვადა" type="date" required value={vehicleForm.pti_expiry} onChange={(e:any)=>setVehicleForm({...vehicleForm, pti_expiry:e.target.value})} />
                  <FormField label="სამოქალაქო დაზღვევა" hint="პოლისის ნომერი" required value={vehicleForm.insurance_policy} onChange={(e:any)=>setVehicleForm({...vehicleForm, insurance_policy:e.target.value})} />
                  <FormField label="CMR დაზღვევა" hint="ტვირთის დაზღვევა" value={vehicleForm.insurance_cmre_policy} onChange={(e:any)=>setVehicleForm({...vehicleForm, insurance_cmre_policy:e.target.value})} />
                  <FormField label="მფლობელი" hint="სახელი/კომპანია" required value={vehicleForm.owner_name} onChange={(e:any)=>setVehicleForm({...vehicleForm, owner_name:e.target.value})} />
                  <FormField label="მფლობელის ტიპი" options={[{value:'company',label:'🏢 კომპანია'},{value:'individual',label:'👤 ფიზიკური პირი'}]} value={vehicleForm.owner_type} onChange={(e:any)=>setVehicleForm({...vehicleForm, owner_type:e.target.value})} />
                  <FormField label="მინდობილობა" hint="თუ მძღოლი არ არის მესაკუთრე" value={vehicleForm.power_of_attorney} onChange={(e:any)=>setVehicleForm({...vehicleForm, power_of_attorney:e.target.value})} />
                </div>
              </div>

              {/* 2. Medium Priority */}
              <div className="bg-gray-900/20 p-4 rounded-xl border border-gray-700/50">
                <SectionHeader title="საოპერაციო მონაცემები" icon="🟡" color="text-yellow-400" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField label="მოდელი" required value={vehicleForm.model} onChange={(e:any)=>setVehicleForm({...vehicleForm, model:e.target.value})} />
                  <FormField label="სატრანსპორტო ტიპი" required options={[{value:'truck',label:'🚛 სატვირთო'},{value:'van',label:'🚐 ფურგონი'},{value:'car',label:'🚗 მსუბუქი'}]} value={vehicleForm.type} onChange={(e:any)=>setVehicleForm({...vehicleForm, type:e.target.value})} />
                  <FormField label="ძარის ტიპი" options={[{value:'tent',label:'🟦 ტენტი'},{value:'refrigerated',label:'❄️ მაცივარი'},{value:'container',label:'📦 კონტეინერი'},{value:'flatbed',label:'🔩 პლატფორმა'},{value:'bulk',label:'🌾 ნაყარი'}]} value={vehicleForm.body_type} onChange={(e:any)=>setVehicleForm({...vehicleForm, body_type:e.target.value})} />
                  <FormField label="ტვირთამწეობა (კგ)" type="number" value={vehicleForm.capacity_kg} onChange={(e:any)=>setVehicleForm({...vehicleForm, capacity_kg:e.target.value})} />
                  <FormField label="მოცულობა (m³)" type="number" value={vehicleForm.volume_m3} onChange={(e:any)=>setVehicleForm({...vehicleForm, volume_m3:e.target.value})} />
                  <div className="grid grid-cols-3 gap-2">
                    <FormField label="სიგრძე (მ)" type="number" value={vehicleForm.length_m} onChange={(e:any)=>setVehicleForm({...vehicleForm, length_m:e.target.value})} />
                    <FormField label="სიგანე (მ)" type="number" value={vehicleForm.width_m} onChange={(e:any)=>setVehicleForm({...vehicleForm, width_m:e.target.value})} />
                    <FormField label="სიმაღლე (მ)" type="number" value={vehicleForm.height_m} onChange={(e:any)=>setVehicleForm({...vehicleForm, height_m:e.target.value})} />
                  </div>
                  <FormField label="ADR კლასი" hint="სახიფათო ტვირთი (1-9)" value={vehicleForm.adr_class} onChange={(e:any)=>setVehicleForm({...vehicleForm, adr_class:e.target.value})} />
                  <FormField label="EURO სტანდარტი" options={[{value:'5',label:'EURO 5'},{value:'6',label:'EURO 6'},{value:'EEV',label:'EEV'}]} value={vehicleForm.euro_standard} onChange={(e:any)=>setVehicleForm({...vehicleForm, euro_standard:e.target.value})} />
                  <div className="flex items-center gap-4 p-3 bg-gray-700/30 rounded-lg border border-gray-600 col-span-3">
                    <div className="flex items-center gap-2"><input type="checkbox" checked={vehicleForm.has_tail_lift} onChange={(e:any)=>setVehicleForm({...vehicleForm, has_tail_lift:e.target.checked})} className="w-4 h-4 accent-blue-500" /><label className="text-xs text-gray-300">ლიფტი (Tail lift)</label></div>
                    <FormField label="ღვედების რაოდენობა" type="number" value={vehicleForm.straps_count} onChange={(e:any)=>setVehicleForm({...vehicleForm, straps_count:e.target.value})} />
                  </div>
                </div>
              </div>

              {/* 3. Low Priority */}
              <div className="bg-gray-900/20 p-4 rounded-xl border border-gray-700/50">
                <SectionHeader title="ტექნოლოგიური & მონიტორინგი" icon="🔵" color="text-blue-400" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField label="GPS მოწყობილობის ID" value={vehicleForm.gps_device_id} onChange={(e:any)=>setVehicleForm({...vehicleForm, gps_device_id:e.target.value})} />
                  <div className="flex items-center gap-2 p-3 bg-gray-700/30 rounded-lg border border-gray-600"><input type="checkbox" checked={vehicleForm.has_fuel_sensor} onChange={(e:any)=>setVehicleForm({...vehicleForm, has_fuel_sensor:e.target.checked})} className="w-4 h-4 accent-green-500" /><label className="text-xs text-gray-300">საწვავის კონტროლი</label></div>
                  <FormField label="ფოტოები (URL)" hint="გამოყოფილი მძიმით" textarea value={vehicleForm.photo_urls} onChange={(e:any)=>setVehicleForm({...vehicleForm, photo_urls:e.target.value})} />
                  <FormField label="საბურავების სეზონი" options={[{value:'summer',label:'☀️ ზაფხული'},{value:'winter',label:'❄️ ზამთარი'},{value:'all_season',label:'🌤️ ყველა სეზონი'}]} value={vehicleForm.tire_season} onChange={(e:any)=>setVehicleForm({...vehicleForm, tire_season:e.target.value})} />
                  <FormField label="საბურავების მდგომარეობა" options={[{value:'new',label:'🟢 ახალი'},{value:'good',label:'🟡 კარგი'},{value:'replace_soon',label:'🟠 მალე შესაცვლელი'},{value:'replace_now',label:'🔴 დაუყოვნებლივ'}]} value={vehicleForm.tire_condition} onChange={(e:any)=>setVehicleForm({...vehicleForm, tire_condition:e.target.value})} />
                  <FormField label="სტატუსი" required options={[{value:'active',label:'🟢 აქტიური'},{value:'idle',label:'🟡 ოდინში'},{value:'maintenance',label:'🔧 რემონტში'},{value:'inactive',label:'⚫ არააქტიური'}]} value={vehicleForm.status} onChange={(e:any)=>setVehicleForm({...vehicleForm, status:e.target.value})} />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-700 mt-2">
                <button type="button" onClick={() => setShowAddVehicleModal(false)} className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-medium transition">გაუქმება</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-bold transition shadow-lg shadow-blue-500/20">💾 შენახვა</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🚗 EDIT VEHICLE MODAL */}
      {showEditVehicleModal && editingVehicle && (<div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowEditVehicleModal(false)}><div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}><div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center bg-gray-800"><h3 className="text-sm font-bold text-white flex items-center gap-2">🚐 მანქანის რედაქტირება</h3><button onClick={() => setShowEditVehicleModal(false)} className="text-gray-400 hover:text-white text-xl transition">&times;</button></div><form onSubmit={handleSaveEditVehicle} className="p-5 overflow-y-auto space-y-6"><section><h4 className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-gray-700/50 pb-2">🔴 აუცილებელი ინფორმაცია</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><FormField label="სანომრე ნიშანი" hint="მაგ: AA-123-BB" required value={editVehicleForm.plate_number} onChange={(e:any)=>setEditVehicleForm({...editVehicleForm, plate_number:e.target.value})} /><FormField label="მარკა და მოდელი" hint="მაგ: Mercedes Actros" required value={editVehicleForm.model} onChange={(e:any)=>setEditVehicleForm({...editVehicleForm, model:e.target.value})} /></div></section><div className="flex gap-3 pt-4 border-t border-gray-700 mt-2"><button type="button" onClick={() => setShowEditVehicleModal(false)} className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-medium transition">გაუქმება</button><button type="submit" className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-bold transition shadow-lg shadow-blue-500/20">💾 განახლება</button></div></form></div></div>)}

      {/* 🗑️ DELETE VEHICLE MODAL */}
      {showDeleteVehicleModal && deletingVehicle && (<div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteVehicleModal(false)}><div className="bg-gray-800 border border-red-500/30 rounded-2xl w-full max-w-sm p-6 text-center shadow-2xl" onClick={e => e.stopPropagation()}><div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-3xl">🗑️</span></div><h3 className="text-lg font-bold text-white mb-2">მანქანის წაშლა</h3><div className="flex gap-3"><button onClick={() => setShowDeleteVehicleModal(false)} className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl text-sm font-medium transition">არყოფა</button><button onClick={confirmDeleteVehicle} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition shadow-lg shadow-red-500/20">ვადასტურებ</button></div></div></div>)}

      {/* 👨‍✈️ ADD DRIVER MODAL - ახალი იერარქიული სტრუქტურა */}
      {showAddDriverModal && (<div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowAddDriverModal(false)}><div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}><div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center bg-gray-800"><h3 className="text-sm font-bold text-white flex items-center gap-2">👨‍✈️ ახალი მძღოლის რეგისტრაცია</h3><button onClick={() => setShowAddDriverModal(false)} className="text-gray-400 hover:text-white text-xl transition">&times;</button></div>
        <form onSubmit={handleAddDriver} className="p-5 overflow-y-auto space-y-6">
          {/* ტიპის გადამრთველი */}
          <div className="flex bg-gray-700/30 p-1 rounded-lg mb-2">
             {['internal', 'contractor'].map(type => (
               <button type="button" key={type} onClick={() => setDriverForm({...driverForm, employment_type: type})}
                 className={`flex-1 py-2 rounded-md text-[10px] font-bold uppercase tracking-wide transition ${driverForm.employment_type === type ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'}`}>
                 {type === 'internal' ? '🏢 კომპანიის მძღოლი' : '🤝 კონტრაქტით'}
               </button>
             ))}
          </div>

          {/* 1. High Priority */}
          <div className="bg-gray-900/20 p-4 rounded-xl border border-gray-700/50">
            <SectionHeader title="კრიტიკულად აუცილებელი (სავალდებულო)" icon="🔴" color="text-red-400" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="სრული სახელი" hint="სახელი და გვარი" required value={driverForm.full_name} onChange={(e:any)=>setDriverForm({...driverForm, full_name:e.target.value})} />
              <FormField label="დაბადების თარიღი" type="date" required value={driverForm.dob} onChange={(e:any)=>setDriverForm({...driverForm, dob:e.target.value})} />
              <FormField label="პირადი ნომერი / ID" hint="იდენტიფიკაციის ნომერი" required value={driverForm.personal_id} onChange={(e:any)=>setDriverForm({...driverForm, personal_id:e.target.value})} />
              <FormField label="მობილური" hint="ვერიფიცირებული ნომერი" required value={driverForm.phone} onChange={(e:any)=>setDriverForm({...driverForm, phone:e.target.value})} />
              <FormField label="ელ-ფოსტა" hint="contact@email.com" required type="email" value={driverForm.email} onChange={(e:any)=>setDriverForm({...driverForm, email:e.target.value})} />
              <FormField label="მისამართი" hint="საცხოვრებელი ადგილი" required value={driverForm.address} onChange={(e:any)=>setDriverForm({...driverForm, address:e.target.value})} />
              <FormField label="მართვის მოწმობა #" hint="ლიცენზიის ნომერი" required value={driverForm.license_number} onChange={(e:any)=>setDriverForm({...driverForm, license_number:e.target.value})} />
              <FormField label="კატეგორია" required options={[{value:'B',label:'B'},{value:'C',label:'C'},{value:'C+E',label:'C+E'},{value:'D',label:'D'}]} value={driverForm.license_category} onChange={(e:any)=>setDriverForm({...driverForm, license_category:e.target.value})} />
              <FormField label="ვადა" type="date" required value={driverForm.license_expiry} onChange={(e:any)=>setDriverForm({...driverForm, license_expiry:e.target.value})} />
              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
                 <FormField label="📄 მოწმობის ფოტო" hint="URL / ფაილი" value={driverForm.license_photo} onChange={(e:any)=>setDriverForm({...driverForm, license_photo:e.target.value})} />
                 <FormField label="📄 ნასამართლეობა" hint="URL / ფაილი" value={driverForm.criminal_record} onChange={(e:any)=>setDriverForm({...driverForm, criminal_record:e.target.value})} />
                 <FormField label="📄 მართვის ისტორია" hint="URL / ფაილი" value={driverForm.driving_record} onChange={(e:any)=>setDriverForm({...driverForm, driving_record:e.target.value})} />
                 <FormField label="📄 სამედიცინო ცნობა" hint="URL / ფაილი" value={driverForm.medical_cert} onChange={(e:any)=>setDriverForm({...driverForm, medical_cert:e.target.value})} />
              </div>
            </div>
          </div>

          {/* 2. Medium Priority */}
          <div className="bg-gray-900/20 p-4 rounded-xl border border-gray-700/50">
            <SectionHeader title="საოპერაციო და ფინანსური" icon="🟡" color="text-yellow-400" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="გამოცდილება (წლები)" type="number" value={driverForm.total_experience_years} onChange={(e:any)=>setDriverForm({...driverForm, total_experience_years:e.target.value})} />
              <div className="col-span-2">
                 <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wide">სპეციალური უნარები / გამოცდილება</label>
                 <textarea rows={1} value={driverForm.special_experience} onChange={(e:any)=>setDriverForm({...driverForm, special_experience:e.target.value})} placeholder="მაგ: მაცივარ-კონტეინერი, საერთაშორისო რეისები..." className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition resize-none" />
              </div>
              <div className="flex items-center gap-2 p-3 bg-gray-700/30 rounded-lg border border-gray-600">
                <input type="checkbox" checked={driverForm.has_adr} onChange={(e:any)=>setDriverForm({...driverForm, has_adr:e.target.checked})} className="w-4 h-4 accent-green-500" />
                <label className="text-xs text-gray-300">ADR სერტიფიკატი (სახიფათო ტვირთი)</label>
              </div>
              {driverForm.has_adr && <FormField label="📄 ADR დოკუმენტი" hint="URL / ფაილი" value={driverForm.adr_cert} onChange={(e:any)=>setDriverForm({...driverForm, adr_cert:e.target.value})} />}
              
              {driverForm.employment_type === 'internal' && (
                 <div className="col-span-3 mt-2 pt-4 border-t border-gray-700">
                   <div className="flex items-center gap-2 mb-3">
                     <input type="checkbox" checked={driverForm.has_own_vehicle} onChange={(e:any)=>setDriverForm({...driverForm, has_own_vehicle:e.target.checked})} className="w-4 h-4 accent-blue-500" />
                     <label className="text-xs text-gray-200 font-bold">მძღოლი ფლობს საკუთარ მანქანას</label>
                   </div>
                   {driverForm.has_own_vehicle && (
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-blue-500/5 rounded-lg border border-blue-500/20">
                       <FormField label="🚗 რეგისტრაციის #" hint="ტექ.პასპორტის ნომერი" value={driverForm.vehicle_reg} onChange={(e:any)=>setDriverForm({...driverForm, vehicle_reg:e.target.value})} />
                       <FormField label="📅 ტექ-ინსპექტირების ვადა" type="date" value={driverForm.vehicle_insp_expiry} onChange={(e:any)=>setDriverForm({...driverForm, vehicle_insp_expiry:e.target.value})} />
                       <FormField label="📄 დაზღვევის პოლისი" hint="პოლისის ნომერი" value={driverForm.vehicle_insurance} onChange={(e:any)=>setDriverForm({...driverForm, vehicle_insurance:e.target.value})} />
                     </div>
                   )}
                 </div>
              )}

              <div className="col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 mt-2 pt-4 border-t border-gray-700">
                 <FormField label="IBAN ანგარიში" hint="GE0000000000000000" value={driverForm.bank_iban} onChange={(e:any)=>setDriverForm({...driverForm, bank_iban:e.target.value})} />
                 <FormField label="საგადასახადო სტატუსი" options={[{value:'individual',label:'ფიზიკური პირი'},{value:'entrepreneur',label:'ინდ. მეწარმე'},{value:'company',label:'კომპანია'}]} value={driverForm.tax_status} onChange={(e:any)=>setDriverForm({...driverForm, tax_status:e.target.value})} />
              </div>
            </div>
          </div>

          {/* 3. Low Priority */}
          <div className="bg-gray-900/20 p-4 rounded-xl border border-gray-700/50">
            <SectionHeader title="დამატებითი ინფორმაცია" icon="🔵" color="text-blue-400" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="ენები" hint="მაგ: ინგლისური, რუსული" value={driverForm.languages} onChange={(e:any)=>setDriverForm({...driverForm, languages:e.target.value})} />
              <FormField label="რეკომენდატორები" hint="წინა სამსახურის კონტაქტი" value={driverForm.references} onChange={(e:any)=>setDriverForm({...driverForm, references:e.target.value})} />
              <FormField label="ფორმის ზომა" options={[{value:'S',label:'S'},{value:'M',label:'M'},{value:'L',label:'L'},{value:'XL',label:'XL'}]} value={driverForm.uniform_size} onChange={(e:any)=>setDriverForm({...driverForm, uniform_size:e.target.value})} />
              <FormField label="📷 ფოტო-პროფილი" hint="URL" value={driverForm.photo_url} onChange={(e:any)=>setDriverForm({...driverForm, photo_url:e.target.value})} />
              <div className="col-span-2">
                <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wide">დამატებითი უნარები</label>
                <textarea rows={2} value={driverForm.extra_skills} onChange={(e:any)=>setDriverForm({...driverForm, extra_skills:e.target.value})} placeholder="მაგ: ავტომობილის ელემენტარული შეკეთება, ავტოამწე..." className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition resize-none" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-700 mt-2"><button type="button" onClick={() => setShowAddDriverModal(false)} className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-medium transition">გაუქმება</button><button type="submit" className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 rounded-lg text-xs font-bold transition shadow-lg shadow-green-500/20">💾 რეგისტრაცია</button></div>
        </form>
      </div></div>)}

      {/* 👨‍✈️ EDIT DRIVER MODAL */}
      {showEditDriverModal && editingDriver && (<div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowEditDriverModal(false)}><div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}><div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center bg-gray-800"><h3 className="text-sm font-bold text-white flex items-center gap-2">👨‍✈️ მძღოლის რედაქტირება</h3><button onClick={() => setShowEditDriverModal(false)} className="text-gray-400 hover:text-white text-xl transition">&times;</button></div><form onSubmit={handleSaveEditDriver} className="p-5 overflow-y-auto space-y-6"><section><h4 className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-gray-700/50 pb-2">🔴 პერსონალური ინფორმაცია</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><FormField label="სრული სახელი" hint="მაგ: ნიკა გიორგაძე" required value={editDriverForm.full_name} onChange={(e:any)=>setEditDriverForm({...editDriverForm, full_name:e.target.value})} /><FormField label="ტელეფონის ნომერი" hint="მაგ: +995 555 123 456" required value={editDriverForm.phone} onChange={(e:any)=>setEditDriverForm({...editDriverForm, phone:e.target.value})} /><FormField label="გადაუდებელი კონტაქტი" hint="სახელი და ტელეფონი" value={editDriverForm.emergency_contact} onChange={(e:any)=>setEditDriverForm({...editDriverForm, emergency_contact:e.target.value})} /><FormField label="დასაქმების თარიღი" hint="კონტრაქტის დაწყება" type="date" value={editDriverForm.hire_date} onChange={(e:any)=>setEditDriverForm({...editDriverForm, hire_date:e.target.value})} /></div></section><section><h4 className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-gray-700/50 pb-2">🟡 ლიცენზია & კვალიფიკაცია</h4><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><FormField label="ლიცენზიის ნომერი" hint="მაგ: DL-2024-001" required value={editDriverForm.license_number} onChange={(e:any)=>setEditDriverForm({...editDriverForm, license_number:e.target.value})} /><FormField label="ლიცენზიის კატეგორია" hint="მართვის უფლება" required options={[{value:'B',label:'B'},{value:'C',label:'C'},{value:'C+E',label:'C+E'},{value:'ADR',label:'ADR'}]} value={editDriverForm.license_type} onChange={(e:any)=>setEditDriverForm({...editDriverForm, license_type:e.target.value})} /><FormField label="ლიცენზიის ვადა" hint="სავალდებულო" required type="date" value={editDriverForm.license_expiry} onChange={(e:any)=>setEditDriverForm({...editDriverForm, license_expiry:e.target.value})} /><FormField label="სამედიცინო ცნობის ვადა" hint="ჯანმრთელობის მდგომარეობა" type="date" value={editDriverForm.medical_expiry} onChange={(e:any)=>setEditDriverForm({...editDriverForm, medical_expiry:e.target.value})} /></div></section><section><h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-gray-700/50 pb-2">🔵 მანქანა & ფინანსები</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><FormField label="მანქანის მინიჭება" hint="აირჩიე მანქანა ან დატოვე ცარიელი" options={[{value:'',label:'🚫 მანქანის გარეშე'}, ...vehicles.map(v => ({value:v.id, label:`🚛 ${v.plate_number} - ${v.model}`}))]} value={editDriverForm.vehicle_id} onChange={(e:any)=>setEditDriverForm({...editDriverForm, vehicle_id:e.target.value})} /><FormField label="დღიური განაკვეთი" hint="ხელფასი/კომისია (₾)" type="number" value={editDriverForm.daily_rate} onChange={(e:any)=>setEditDriverForm({...editDriverForm, daily_rate:e.target.value})} /><div className="md:col-span-2 flex items-center gap-2 p-3 bg-gray-700/30 rounded-lg border border-gray-600"><input type="checkbox" checked={editDriverForm.is_available} onChange={(e:any)=>setEditDriverForm({...editDriverForm, is_available:e.target.checked})} className="w-4 h-4 accent-green-500" /><label className="text-xs text-gray-300">🟢 მძღოლი ხელმისაწვდომია რეისებისთვის</label></div></div></section><div className="flex gap-3 pt-4 border-t border-gray-700 mt-2"><button type="button" onClick={() => setShowEditDriverModal(false)} className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-medium transition">გაუქმება</button><button type="submit" className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 rounded-lg text-xs font-bold transition shadow-lg shadow-green-500/20">💾 განახლება</button></div></form></div></div>)}

      {/* 🗑️ DELETE DRIVER MODAL */}
      {showDeleteDriverModal && deletingDriver && (<div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteDriverModal(false)}><div className="bg-gray-800 border border-red-500/30 rounded-2xl w-full max-w-sm p-6 text-center shadow-2xl" onClick={e => e.stopPropagation()}><div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-3xl">🗑️</span></div><h3 className="text-lg font-bold text-white mb-2">მძღოლის წაშლა</h3><div className="flex gap-3"><button onClick={() => setShowDeleteDriverModal(false)} className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl text-sm font-medium transition">არყოფა</button><button onClick={confirmDeleteDriver} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition shadow-lg shadow-red-500/20">ვადასტურებ</button></div></div></div>)}

      {/* 📦 ADD ORDER MODAL */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowOrderModal(false)}>
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">📦 ახალი შეკვეთა</h3>
              <button onClick={() => setShowOrderModal(false)} className="text-gray-400 hover:text-white text-xl transition">&times;</button>
            </div>
            <form onSubmit={handleAddOrder} className="p-5 overflow-y-auto space-y-5">
              <section><h4 className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-gray-700/50 pb-2">🔴 მარშრუტი</h4><div className="grid grid-cols-1 gap-3"><FormField label="📍 ატვირთვის მისამართი" hint="მაგ: თბილისი, ვაჟა-ფშაველას გამზ. 10" required value={orderForm.pickup_address} onChange={(e:any)=>setOrderForm({...orderForm, pickup_address:e.target.value})} /><FormField label="🏁 ჩატვირთვის მისამართი" hint="მაგ: ბათუმი, რიყის ქ. 25" required value={orderForm.delivery_address} onChange={(e:any)=>setOrderForm({...orderForm, delivery_address:e.target.value})} /></div></section>
              <section><h4 className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-gray-700/50 pb-2">🟡 ტვირთი</h4><div className="grid grid-cols-1 md:grid-cols-3 gap-3"><FormField label="📦 აღწერა" hint="მაგ: 50 ყუთი ელექტრონიკა" required textarea value={orderForm.cargo_description} onChange={(e:any)=>setOrderForm({...orderForm, cargo_description:e.target.value})} /><FormField label="⚖️ წონა (კგ)" hint="მაგ: 500" type="number" value={orderForm.cargo_weight_kg} onChange={(e:any)=>setOrderForm({...orderForm, cargo_weight_kg:e.target.value})} /><FormField label="💰 ფასი" hint="მაგ: 250" type="number" value={orderForm.price} onChange={(e:any)=>setOrderForm({...orderForm, price:e.target.value})} /><FormField label="💵 ვალუტა" options={[{value:'GEL',label:'GEL'}, {value:'USD',label:'USD'}, {value:'EUR',label:'EUR'}]} value={orderForm.currency} onChange={(e:any)=>setOrderForm({...orderForm, currency:e.target.value})} /></div></section>
              
              {/* 🔵 მინიჭება - ახალი ლოგიკით */}
              <section>
                <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-gray-700/50 pb-2">🔵 მინიჭება</h4>
                <div className="mb-3">
                  <label className="block text-[10px] text-gray-400 mb-1">მძღოლის ტიპი</label>
                  <div className="flex gap-2 mb-2">
                    <button type="button" onClick={() => setOrderForm(p => ({...p, driver_type: 'internal', driver_id: '', external_driver_id: ''}))}
                      className={`flex-1 py-1.5 rounded text-[10px] font-medium transition ${orderForm.driver_type === 'internal' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'}`}>🏢 საკუთარი</button>
                    <button type="button" onClick={() => setOrderForm(p => ({...p, driver_type: 'external', driver_id: '', external_driver_id: ''}))}
                      className={`flex-1 py-1.5 rounded text-[10px] font-medium transition ${orderForm.driver_type === 'external' ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-400'}`}>🤝 კონტრაქტით</button>
                  </div>
                  {orderForm.driver_type === 'internal' ? (
                    <select value={orderForm.driver_id} onChange={(e:any)=>setOrderForm(p => ({...p, driver_id: e.target.value}))} className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-xs outline-none">
                      <option value="">– საკუთარი მძღოლი –</option>
                      {drivers.filter(d => d.is_available).map(d => <option key={d.id} value={d.id}>{d.full_name} ({d.phone})</option>)}
                    </select>
                  ) : (
                    <select value={orderForm.external_driver_id} onChange={(e:any)=>setOrderForm(p => ({...p, external_driver_id: e.target.value}))} className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-xs outline-none">
                      <option value="">– გარე მძღოლი –</option>
                      {externalDrivers?.map(d => <option key={d.id} value={d.id}>{d.full_name} ({d.phone})</option>) || <option>ჯერ არ არის დამატებული</option>}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">მანქანის ტიპი</label>
                  <div className="flex gap-2 mb-2">
                    <button type="button" onClick={() => setOrderForm(p => ({...p, vehicle_type: 'internal', vehicle_id: '', external_vehicle_id: ''}))}
                      className={`flex-1 py-1.5 rounded text-[10px] font-medium transition ${orderForm.vehicle_type === 'internal' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'}`}>🏢 საკუთარი</button>
                    <button type="button" onClick={() => setOrderForm(p => ({...p, vehicle_type: 'external', vehicle_id: '', external_vehicle_id: ''}))}
                      className={`flex-1 py-1.5 rounded text-[10px] font-medium transition ${orderForm.vehicle_type === 'external' ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-400'}`}>🤝 კონტრაქტით</button>
                  </div>
                  {orderForm.vehicle_type === 'internal' ? (
                    <select value={orderForm.vehicle_id} onChange={(e:any)=>setOrderForm(p => ({...p, vehicle_id: e.target.value}))} className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-xs outline-none">
                      <option value="">– საკუთარი მანქანა –</option>
                      {vehicles.filter(v => v.status === 'active').map(v => <option key={v.id} value={v.id}>{v.plate_number} - {v.model}</option>)}
                    </select>
                  ) : (
                    <select value={orderForm.external_vehicle_id} onChange={(e:any)=>setOrderForm(p => ({...p, external_vehicle_id: e.target.value}))} className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-xs outline-none">
                      <option value="">– გარე მანქანა –</option>
                      {externalVehicles?.map(v => <option key={v.id} value={v.id}>{v.plate_number} - {v.model}</option>) || <option>ჯერ არ არის დამატებული</option>}
                    </select>
                  )}
                </div>
              </section>
              
              <section><h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-gray-700/50 pb-2">🟣 დამატებითი</h4><FormField label="📝 შენიშვნა" hint="შიდა შენიშვნა ან დეტალები..." textarea value={orderForm.notes} onChange={(e:any)=>setOrderForm({...orderForm, notes:e.target.value})} /></section>
              <div className="flex gap-3 pt-4 border-t border-gray-700 mt-2">
                <button type="button" onClick={() => setShowOrderModal(false)} className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-medium transition">გაუქმება</button>
                <button type="submit" className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-xs font-bold transition shadow-lg shadow-purple-500/20">✅ შექმნა</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📦 EDIT ORDER MODAL */}
      {showEditOrderModal && editingOrder && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowEditOrderModal(false)}>
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">📦 შეკვეთის რედაქტირება</h3>
              <button onClick={() => setShowEditOrderModal(false)} className="text-gray-400 hover:text-white text-xl transition">&times;</button>
            </div>
            <form onSubmit={handleSaveEditOrder} className="p-5 overflow-y-auto space-y-5">
              <section><h4 className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-gray-700/50 pb-2">🔴 მარშრუტი</h4><div className="grid grid-cols-1 gap-3"><FormField label="📍 ატვირთვის მისამართი" hint="მაგ: თბილისი, ვაჟა-ფშაველას გამზ. 10" required value={editOrderForm.pickup_address} onChange={(e:any)=>setEditOrderForm({...editOrderForm, pickup_address:e.target.value})} /><FormField label="🏁 ჩატვირთვის მისამართი" hint="მაგ: ბათუმი, რიყის ქ. 25" required value={editOrderForm.delivery_address} onChange={(e:any)=>setEditOrderForm({...editOrderForm, delivery_address:e.target.value})} /></div></section>
              <section><h4 className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-gray-700/50 pb-2">🟡 ტვირთი</h4><div className="grid grid-cols-1 md:grid-cols-3 gap-3"><FormField label="📦 აღწერა" hint="მაგ: 50 ყუთი ელექტრონიკა" required textarea value={editOrderForm.cargo_description} onChange={(e:any)=>setEditOrderForm({...editOrderForm, cargo_description:e.target.value})} /><FormField label="⚖️ წონა (კგ)" hint="მაგ: 500" type="number" value={editOrderForm.cargo_weight_kg} onChange={(e:any)=>setEditOrderForm({...editOrderForm, cargo_weight_kg:e.target.value})} /><FormField label="💰 ფასი" hint="მაგ: 250" type="number" value={editOrderForm.price} onChange={(e:any)=>setEditOrderForm({...editOrderForm, price:e.target.value})} /><FormField label="💵 ვალუტა" options={[{value:'GEL',label:'GEL'}, {value:'USD',label:'USD'}, {value:'EUR',label:'EUR'}]} value={editOrderForm.currency} onChange={(e:any)=>setEditOrderForm({...editOrderForm, currency:e.target.value})} /></div></section>
              <section><h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-gray-700/50 pb-2">🔵 მინიჭება</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><FormField label="👨‍✈️ მძღოლი" hint="აირჩიე ხელმისაწვდომი მძღოლი" options={[{value:'',label:'– არ არის მინიჭებული –'}, ...drivers.map(d => ({value:d.id, label:`${d.full_name} - ${d.phone}`}))]} value={editOrderForm.driver_id} onChange={(e:any)=>setEditOrderForm({...editOrderForm, driver_id:e.target.value})} /><FormField label="🚐 მანქანა" hint="აირჩიე აქტიური მანქანა" options={[{value:'',label:'– არ არის მინიჭებული –'}, ...vehicles.map(v => ({value:v.id, label:`${v.plate_number} - ${v.model}`}))]} value={editOrderForm.vehicle_id} onChange={(e:any)=>setEditOrderForm({...editOrderForm, vehicle_id:e.target.value})} /></div></section>
              <section><h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-gray-700/50 pb-2">🟣 დამატებითი</h4><FormField label="📝 შენიშვნა" hint="შიდა შენიშვნა ან დეტალები..." textarea value={editOrderForm.notes} onChange={(e:any)=>setEditOrderForm({...editOrderForm, notes:e.target.value})} /></section>
              <div className="flex gap-3 pt-4 border-t border-gray-700 mt-2">
                <button type="button" onClick={() => setShowEditOrderModal(false)} className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-medium transition">გაუქმება</button>
                <button type="submit" className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-xs font-bold transition shadow-lg shadow-purple-500/20">💾 განახლება</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🗑️ DELETE ORDER MODAL */}
      {showDeleteOrderModal && deletingOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteOrderModal(false)}>
          <div className="bg-gray-800 border border-red-500/30 rounded-2xl w-full max-w-sm p-6 text-center shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-3xl">🗑️</span></div>
            <h3 className="text-lg font-bold text-white mb-2">შეკვეთის წაშლა</h3>
            <p className="text-sm text-gray-400 mb-6">ნამდვილად გსურთ შეკვეთა <span className="text-white font-medium">{deletingOrder.tracking_code}</span> წაშლა?<br/><span className="text-red-400 text-xs">ეს ქმედება შეუქცევადია.</span></p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteOrderModal(false)} className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl text-sm font-medium transition">არყოფა</button>
              <button onClick={confirmDeleteOrder} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition shadow-lg shadow-red-500/20">ვადასტურებ</button>
            </div>
          </div>
        </div>
      )}

      {/* 🧾 INVOICE VIEW / PRINT MODAL */}
      {showInvoiceModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setShowInvoiceModal(false)}>
          <div className="bg-white text-gray-900 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="print:hidden px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">🧾 ინვოისი: {selectedInvoice.invoice_number}</h3>
              <div className="flex gap-2">
                <button onClick={handlePrint} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition">🖨️ დაბეჭდვა</button>
                <button onClick={() => setShowInvoiceModal(false)} className="text-gray-500 hover:text-gray-800 text-xl transition">&times;</button>
              </div>
            </div>
            <div ref={printRef} className="p-8">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">INVOICE</h1>
                  <p className="text-gray-500 mt-1">Logistics OS Company Ltd.</p>
                  <p className="text-gray-500">Tbilisi, Georgia</p>
                  <p className="text-gray-500">support@logistics.ge</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-800">{selectedInvoice.invoice_number}</p>
                  <p className="text-gray-500">Issue Date: {selectedInvoice.issue_date}</p>
                  <p className="text-gray-500">Due Date: {selectedInvoice.due_date}</p>
                </div>
              </div>
              <div className="mb-8 border-t border-b border-gray-200 py-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Bill To:</h3>
                <p className="font-medium">{selectedInvoice.client_name}</p>
                <p className="text-gray-600">{selectedInvoice.client_address}</p>
                <p className="text-gray-600">{selectedInvoice.client_email}</p>
              </div>
              <table className="w-full mb-8">
                <thead><tr className="text-left text-xs font-bold text-gray-500 uppercase border-b border-gray-200"><th className="py-3">Description</th><th className="py-3 text-right">Qty</th><th className="py-3 text-right">Unit Price</th><th className="py-3 text-right">Total</th></tr></thead>
                <tbody className="text-sm"><tr className="border-b border-gray-100"><td className="py-3">{selectedInvoice.orders?.cargo_description || 'Logistics Service'}</td><td className="py-3 text-right">1</td><td className="py-3 text-right">{selectedInvoice.total_amount} {selectedInvoice.currency}</td><td className="py-3 text-right font-bold">{selectedInvoice.total_amount} {selectedInvoice.currency}</td></tr></tbody>
              </table>
              <div className="flex justify-end"><div className="w-1/2"><div className="flex justify-between py-2 border-t border-gray-200"><span className="font-bold text-gray-800">Total</span><span className="font-bold text-xl text-blue-600">{selectedInvoice.total_amount} {selectedInvoice.currency}</span></div></div></div>
              {selectedInvoice.notes && (<div className="mt-8 p-4 bg-gray-50 rounded-lg text-xs text-gray-600"><strong>Notes:</strong> {selectedInvoice.notes}</div>)}
            </div>
          </div>
        </div>
      )}

      {/* 📧 EMAIL MODAL */}
      {showEmailModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowEmailModal(false)}>
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-white mb-4">📧 ინვოისის გაგზავნა</h3>
            <div className="space-y-4">
              <FormField label="To (Email)" hint="მომხმარებლის ემაილი" required value={emailTo} onChange={(e:any)=>setEmailTo(e.target.value)} />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEmailModal(false)} className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-medium transition">გაუქმება</button>
                <button onClick={handleSendEmail} className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-xs font-bold transition shadow-lg shadow-purple-500/20">📧 გაგზავნა</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}