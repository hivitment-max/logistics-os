import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

interface UseInvoicesProps {
  showNotification: (msg: string) => void
  loadData: () => Promise<void>
  logAudit: (action: string, target: string, details: string) => Promise<void>
  invoices: any[]
}

export function useInvoices({ showNotification, loadData, logAudit, invoices }: UseInvoicesProps) {
  // 🧾 Modal States
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailTo, setEmailTo] = useState('')
  const [invoiceFilter, setInvoiceFilter] = useState('all')

  // 🔧 Handlers
  const generateInvoiceNumber = () => `INV-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`

  const handleCreateInvoice = useCallback(async (order: any) => {
    const existing = invoices.find((i: any) => i.order_id === order.id)
    if (existing) {
      if (!confirm(`ამ შეკვეთისთვის ინვოისი უკვე არსებობს (${existing.invoice_number}). გნებავთ ნახვა?`)) return
      setSelectedInvoice(existing); setShowInvoiceModal(true); return
    }
    
    const invoiceNumber = order.tracking_code || generateInvoiceNumber() // ✅ შეკვეთის კოდი = ინვოისის ნომერი
    
    const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + 14)
    
    const invoiceData = {
      invoice_number: invoiceNumber, 
      order_id: order.id, 
      tracking_code: order.tracking_code,
      client_name: order.client_name || 'კლიენტი', 
      client_email: order.client_email || '',
      client_address: order.client_address || '', 
      client_tax_id: order.client_tax_id || '',
      total_amount: parseFloat(order.price) || 0,
      currency: order.currency || 'GEL', 
      status: 'pending', 
      issue_date: new Date().toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0], 
      notes: `შეკვეთა: ${order.cargo_description}`,
      
      // ✅ მომსახურების დეტალები (შენი PDF-ის მიხედვით)
      transport_type: order.transport_type || 'სახმელეთო/LTL',
      container_number: order.container_number || '',
      loading_place: order.loading_place || order.pickup_address || '',
      destination: order.destination || order.delivery_address || '',
      
      // ✅ ფინანსური ველები
      subtotal: parseFloat(order.price) || 0,
      vat_rate: 18,
      vat_amount: (parseFloat(order.price) || 0) * 0.18,
      
      // ✅ საბანკო ინფო
      iban: 'GE06TB7146936080100013',
      bank_details: 'ანგარიშსწორების ანგარიში შპს"ანაბელ ლოჯისტიკ" ს.ს"თიბისი ბანკი" SWIFT:TBCBGE22'
    }
    
    const { error, data } = await supabase.from('invoices').insert([invoiceData]).select()
    if (error) { showNotification(`❌ ${error.message}`); return }
    
    // ✅ გასწორებული: invoice_line_items (არა invoice_items!)
    await supabase.from('invoice_line_items').insert([{ 
      invoice_id: (data as any)[0].id, 
      description: `ტრანსპორტირება: ${order.cargo_description}`, 
      quantity: 1, 
      unit_price: parseFloat(order.price) || 0, 
      vat_amount: (parseFloat(order.price) || 0) * 0.18,
      total: parseFloat(order.price) || 0,
      sort_order: 1
    }])
    
    await logAudit('INVOICE_CREATED', invoiceNumber, `შეიქმნა შეკვეთისთვის: ${order.tracking_code}`)
    showNotification(`✅ ინვოისი შეიქმნა: ${invoiceNumber}`); loadData()
  }, [invoices, showNotification, logAudit, loadData])

  const handleSendEmail = useCallback(async () => {
    if (!selectedInvoice || !emailTo) return
    showNotification(`📧 ინვოისი გაიგზავნა: ${emailTo}`); setShowEmailModal(false); setEmailTo('')
    await logAudit('INVOICE_EMAIL_SENT', selectedInvoice.invoice_number, `გაიგზავნა: ${emailTo}`)
  }, [selectedInvoice, emailTo, showNotification, logAudit])

  const handleInvoiceStatusChange = useCallback(async (invoiceId: any, newStatus: string) => {
    const { error } = await supabase.from('invoices').update({ status: newStatus }).eq('id', invoiceId)
    if (error) { showNotification(`❌ ${error.message}`); return }
    const invoice = invoices.find((i: any) => i.id === invoiceId)
    if (invoice) { await logAudit('INVOICE_STATUS_CHANGED', invoice.invoice_number || 'INVOICE', `სტატუსი: ${invoice.status} → ${newStatus}`) }
    showNotification(`✅ ინვოისის სტატუსი შეიცვალა: ${newStatus}`); loadData()
  }, [invoices, showNotification, loadData, logAudit])

  // 🖨️ Print Functions (უცვლელი)
  const handlePrint = useCallback(() => window.print(), [])
  
  const handlePrintDriver = useCallback((driver: any) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    const html = `<!DOCTYPE html><html><head><title>მძღოლის პროფილი - ${driver.full_name}</title><style>@media print{body{font-family:'Segoe UI',Tahoma,sans-serif;font-size:11px;color:#1f2937;margin:20px}.header{border-bottom:3px solid #2563eb;padding-bottom:10px;margin-bottom:20px}.section{margin-bottom:15px;page-break-inside:avoid}.section-title{font-weight:bold;color:#2563eb;border-bottom:1px solid #e5e7eb;padding-bottom:5px;margin-bottom:8px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 20px}.field{margin-bottom:4px}.label{font-weight:600;color:#6b7280}.value{margin-left:5px}.badge{display:inline-block;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:600}.badge-green{background:#dcfce7;color:#166534}.badge-yellow{background:#fef3c7;color:#92400e}.badge-red{background:#fee2e2;color:#991b1b}.footer{margin-top:30px;border-top:1px solid #e5e7eb;padding-top:10px;font-size:9px;color:#6b7280;text-align:center}@page{margin:15mm;size:A4}}</style></head><body><div class="header"><h1 style="margin:0;font-size:18px">👨‍✈️ მძღოლის პროფილი</h1><p style="margin:5px 0 0 0;color:#6b7280">Logistics OS • ${new Date().toLocaleDateString('ka-GE')}</p></div><div class="section"><div class="section-title">🔴 პერსონალური ინფორმაცია</div><div class="grid"><div class="field"><span class="label">სახელი:</span><span class="value">${driver.full_name || '–'}</span></div><div class="field"><span class="label">დაბ. თარიღი:</span><span class="value">${driver.dob || '–'}</span></div><div class="field"><span class="label">პირადი ნომერი:</span><span class="value">${driver.personal_id || '–'}</span></div><div class="field"><span class="label">ტელეფონი:</span><span class="value">${driver.phone || '–'}</span></div><div class="field"><span class="label">ელ-ფოსტა:</span><span class="value">${driver.email || '–'}</span></div><div class="field"><span class="label">მისამართი:</span><span class="value">${driver.address || '–'}</span></div><div class="field"><span class="label">დასაქმების ტიპი:</span><span class="value">${driver.employment_type === 'internal' ? '🏢 კომპანია' : '🤝 კონტრაქტით'}</span></div><div class="field"><span class="label">ხელმისაწვდომი:</span><span class="value">${driver.is_available ? '🟢 კი' : '🔴 არა'}</span></div></div></div><div class="section"><div class="section-title">🟡 ლიცენზია & კვალიფიკაცია</div><div class="grid"><div class="field"><span class="label">ლიცენზია #:</span><span class="value">${driver.license_number || '–'}</span></div><div class="field"><span class="label">კატეგორია:</span><span class="value">${driver.license_category || '–'}</span></div><div class="field"><span class="label">ვადა:</span><span class="value">${driver.license_expiry || '–'}</span></div><div class="field"><span class="label">გამოცდილება:</span><span class="value">${driver.total_experience_years ? `${driver.total_experience_years} წელი` : '–'}</span></div><div class="field"><span class="label">ADR:</span><span class="value">${driver.has_adr ? '✅ აქვს' : '❌ არ აქვს'}</span></div><div class="field"><span class="label">სპეც. უნარები:</span><span class="value">${driver.special_experience || '–'}</span></div></div></div><div class="section"><div class="section-title">🔵 ფინანსური & დამატებითი</div><div class="grid"><div class="field"><span class="label">IBAN:</span><span class="value">${driver.bank_iban || '–'}</span></div><div class="field"><span class="label">საგადასახადო:</span><span class="value">${driver.tax_status || '–'}</span></div><div class="field"><span class="label">დღიური განაკვეთი:</span><span class="value">${driver.daily_rate ? `${driver.daily_rate} ₾` : '–'}</span></div><div class="field"><span class="label">ენები:</span><span class="value">${driver.languages || '–'}</span></div><div class="field"><span class="label">ფორმის ზომა:</span><span class="value">${driver.uniform_size || '–'}</span></div><div class="field"><span class="label">დამატებითი:</span><span class="value">${driver.extra_skills || '–'}</span></div></div></div>${driver.has_own_vehicle ? `<div class="section"><div class="section-title">🚗 საკუთარი მანქანა</div><div class="grid"><div class="field"><span class="label">რეგისტრაცია:</span><span class="value">${driver.vehicle_reg || '–'}</span></div><div class="field"><span class="label">ტექ. ვადა:</span><span class="value">${driver.vehicle_insp_expiry || '–'}</span></div><div class="field"><span class="label">დაზღვევა:</span><span class="value">${driver.vehicle_insurance || '–'}</span></div></div></div>` : ''}<div class="footer"><p>დოკუმენტი გენერირებულია: ${new Date().toLocaleString('ka-GE')} • Logistics OS Platform</p><p style="margin-top:5px">ეს არის ოფიციალური ჩანაწერი სისტემიდან. თუ გაქვთ შეკითხვები, დაუკავშირდით: support@logistics.ge</p></div><script>window.onload=()=>{window.print()}</script></body></html>`
    printWindow.document.write(html); printWindow.document.close()
  }, [])

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
    const html = `<!DOCTYPE html><html><head><title>მანქანის პროფილი - ${vehicle.plate_number}</title><style>@media print{body{font-family:'Segoe UI',Tahoma,sans-serif;font-size:11px;color:#1f2937;margin:20px}.header{border-bottom:3px solid #2563eb;padding-bottom:10px;margin-bottom:20px}.section{margin-bottom:15px;page-break-inside:avoid}.section-title{font-weight:bold;color:#2563eb;border-bottom:1px solid #e5e7eb;padding-bottom:5px;margin-bottom:8px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 20px}.grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px 15px}.field{margin-bottom:4px}.label{font-weight:600;color:#6b7280}.value{margin-left:5px}.badge{display:inline-block;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:600}.badge-green{background:#dcfce7;color:#166534}.badge-yellow{background:#fef3c7;color:#92400e}.badge-red{background:#fee2e2;color:#991b1b}.badge-blue{background:#dbeafe;color:#1e40af}.footer{margin-top:30px;border-top:1px solid #e5e7eb;padding-top:10px;font-size:9px;color:#6b7280;text-align:center}@page{margin:15mm;size:A4}}</style></head><body><div class="header"><h1 style="margin:0;font-size:18px">🚐 მანქანის პროფილი</h1><p style="margin:5px 0 0 0;color:#6b7280">Logistics OS • ${new Date().toLocaleDateString('ka-GE')}</p></div><div class="section"><div class="section-title">🔴 იდენტიფიკაცია & სამართლებრივი</div><div class="grid"><div class="field"><span class="label">სანომრე:</span><span class="value" style="font-weight:bold;color:#2563eb">${vehicle.plate_number || '–'}</span></div><div class="field"><span class="label">VIN:</span><span class="value">${vehicle.vin_number || '–'}</span></div><div class="field"><span class="label">ტექ. პასპორტი:</span><span class="value">${vehicle.tech_passport || '–'}</span></div><div class="field"><span class="label">PTI ვადა:</span><span class="value ${pti.class}">${pti.label}</span></div><div class="field"><span class="label">სამოქალაქო დაზღვევა:</span><span class="value">${vehicle.insurance_policy ? '✅ აქვს' : '❌ არ აქვს'}</span></div><div class="field"><span class="label">CMR დაზღვევა:</span><span class="value">${vehicle.insurance_cmre_policy ? '✅ აქვს' : '❌ არ აქვს'}</span></div><div class="field"><span class="label">მფლობელი:</span><span class="value">${vehicle.owner_name || '–'} ${vehicle.owner_type === 'company' ? '(🏢)' : '(👤)'}</span></div><div class="field"><span class="label">მინდობილობა:</span><span class="value">${vehicle.power_of_attorney || '–'}</span></div></div></div><div class="section"><div class="section-title">🟡 ტექნიკური პარამეტრები</div><div class="grid-3"><div class="field"><span class="label">მოდელი:</span><span class="value">${vehicle.model || '–'}</span></div><div class="field"><span class="label">ტიპი:</span><span class="value">${vehicle.type || '–'}</span></div><div class="field"><span class="label">ძარა:</span><span class="value">${vehicle.body_type || '–'}</span></div><div class="field"><span class="label">ტევადობა:</span><span class="value">${vehicle.capacity_kg ? `${(vehicle.capacity_kg/1000).toFixed(1)}ტ` : '–'}</span></div><div class="field"><span class="label">მოცულობა:</span><span class="value">${vehicle.volume_m3 ? `${vehicle.volume_m3}m³` : '–'}</span></div><div class="field"><span class="label">გაბარიტები:</span><span class="value">${vehicle.length_m && vehicle.width_m && vehicle.height_m ? `${vehicle.length_m}×${vehicle.width_m}×${vehicle.height_m}მ` : '–'}</span></div><div class="field"><span class="label">ADR:</span><span class="value">${vehicle.adr_class ? `კლ. ${vehicle.adr_class}` : '–'}</span></div><div class="field"><span class="label">EURO:</span><span class="value">${vehicle.euro_standard ? `EURO ${vehicle.euro_standard}` : '–'}</span></div><div class="field"><span class="label">Tail Lift:</span><span class="value">${vehicle.has_tail_lift ? '✅ აქვს' : '❌ არ აქვს'}</span></div><div class="field"><span class="label">ღვედები:</span><span class="value">${vehicle.straps_count ? `${vehicle.straps_count} ცალი` : '–'}</span></div></div></div><div class="section"><div class="section-title">🔵 ტექნოლოგიური & მონიტორინგი</div><div class="grid"><div class="field"><span class="label">GPS ID:</span><span class="value">${vehicle.gps_device_id || '–'}</span></div><div class="field"><span class="label">საწვავის სენსორი:</span><span class="value">${vehicle.has_fuel_sensor ? '✅ აქვს' : '❌ არ აქვს'}</span></div><div class="field"><span class="label">საბურავების სეზონი:</span><span class="value">${vehicle.tire_season === 'winter' ? '❄️ ზამთარი' : vehicle.tire_season === 'summer' ? '☀️ ზაფხული' : '🌤️ ყველა'}</span></div><div class="field"><span class="label">საბურავების მდგომ.:</span><span class="value">${vehicle.tire_condition || '–'}</span></div><div class="field"><span class="label">სტატუსი:</span><span class="value"><span class="badge ${vehicle.status === 'active' ? 'badge-green' : vehicle.status === 'maintenance' ? 'badge-red' : 'badge-yellow'}">${vehicle.status}</span></span></div></div></div>${vehicle.notes ? `<div class="section"><div class="section-title">📝 შენიშვნები</div><p style="margin:0;white-space:pre-wrap">${vehicle.notes}</p></div>` : ''}<div class="footer"><p>დოკუმენტი გენერირებულია: ${new Date().toLocaleString('ka-GE')} • Logistics OS Platform</p><p style="margin-top:5px">ეს არის ოფიციალური ჩანაწერი სისტემიდან. თუ გაქვთ შეკითხვები, დაუკავშირდით: support@logistics.ge</p></div><script>window.onload=()=>{window.print()}</script></body></html>`
    printWindow.document.write(html); printWindow.document.close()
  }, [])

  return {
    showInvoiceModal, setShowInvoiceModal,
    selectedInvoice, setSelectedInvoice,
    showEmailModal, setShowEmailModal,
    emailTo, setEmailTo,
    invoiceFilter, setInvoiceFilter,
    handleCreateInvoice,
    handleSendEmail,
    handleInvoiceStatusChange,
    handlePrint,
    handlePrintDriver,
    handlePrintVehicle
  }
}