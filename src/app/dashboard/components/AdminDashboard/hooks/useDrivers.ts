import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

interface UseDriversProps {
  showNotification: (msg: string) => void
  loadData: () => Promise<void>
  vehicles: any[] // მანქანების სია მინიჭებისთვის
}

export function useDrivers({ showNotification, loadData, vehicles }: UseDriversProps) {
  // 👨‍✈️ Modal States
  const [showAddDriverModal, setShowAddDriverModal] = useState(false)
  const [editingDriver, setEditingDriver] = useState<any | null>(null)
  const [showEditDriverModal, setShowEditDriverModal] = useState(false)
  const [editDriverForm, setEditDriverForm] = useState<any>({})
  const [deletingDriver, setDeletingDriver] = useState<any | null>(null)
  const [showDeleteDriverModal, setShowDeleteDriverModal] = useState(false)

  // 📝 Add Form State - ✅ განახლებული ყველა ახალი ველით
  const [driverForm, setDriverForm] = useState({
    // 🔴 არსებული ველები
    employment_type: 'internal',
    full_name: '', dob: '', personal_id: '', phone: '', email: '', address: '',
    license_number: '', license_category: 'C', license_expiry: '', license_photo: '', criminal_record: '', driving_record: '', medical_cert: '',
    total_experience_years: '', special_experience: '', has_adr: false, adr_cert: '', has_own_vehicle: false, vehicle_reg: '', vehicle_insp_expiry: '', vehicle_insurance: '',
    bank_iban: '', tax_status: 'individual', languages: '', references: '', uniform_size: 'M', photo_url: '', extra_skills: '',
    is_available: true, hire_date: '', daily_rate: '', emergency_contact: '',
    
    // 🔔 Telegram შეტყობინებებისთვის
    telegram_chat_id: '',
    telegram_username: '',
    
    // 💰 ახალი: ფინანსური დეტალები (Payroll-ისთვის)
    rate_per_km: '',              // ტარიფი კმ-ზე (მაგ: 0.50)
    commission_percent: '20',     // კომისია % (მაგ: 20)
    base_salary: '',              // ფიქსირებული/ავანსი
    payment_method: 'bank_transfer', // bank_transfer | cash | card
    bank_name: '',                // ბანკის სახელი
    bank_account: '',             // IBAN ანგარიში
    
    // 🔔 ახალი: შეტყობინებების პრეფერენციები
    notify_order_assign: true,    // შეტყობინება შეკვეთის მინიჭებისას
    notify_payment: true,         // შეტყობინება ანგარიშსწორებისას
    notify_promo: false,          // აქციები/სიახლეები
  })

  // 🔧 Handlers
  const handleAddDriver = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    const payload = { 
      ...driverForm, 
      dob: driverForm.dob || null, 
      license_expiry: driverForm.license_expiry || null, 
      vehicle_insp_expiry: driverForm.vehicle_insp_expiry || null, 
      hire_date: driverForm.hire_date || null, 
      daily_rate: driverForm.daily_rate ? parseFloat(driverForm.daily_rate as string) : null, 
      is_available: Boolean(driverForm.is_available), 
      total_experience_years: driverForm.total_experience_years ? parseInt(driverForm.total_experience_years as string) : null, 
      has_adr: Boolean(driverForm.has_adr), 
      has_own_vehicle: Boolean(driverForm.has_own_vehicle),
      
      // ✅ Telegram ველები
      telegram_chat_id: driverForm.telegram_chat_id || null,
      telegram_username: driverForm.telegram_username || null,
      
      // 💰 ფინანსური ველები (ნულოვანი თუ ცარიელია)
      rate_per_km: driverForm.rate_per_km ? parseFloat(driverForm.rate_per_km) : 0,
      commission_percent: driverForm.commission_percent ? parseFloat(driverForm.commission_percent) : 20,
      base_salary: driverForm.base_salary ? parseFloat(driverForm.base_salary) : 0,
      payment_method: driverForm.payment_method || 'bank_transfer',
      bank_name: driverForm.bank_name || null,
      bank_account: driverForm.bank_account || null,
      
      // 🔔 შეტყობინებების პრეფერენციები (ბულეანი)
      notify_order_assign: Boolean(driverForm.notify_order_assign),
      notify_payment: Boolean(driverForm.notify_payment),
      notify_promo: Boolean(driverForm.notify_promo),
    }
    
    const { error } = await supabase.from('drivers').insert([payload])
    if (error) { showNotification(`❌ ${error.message}`); return }
    
    showNotification('✅ მძღოლი წარმატებით დაემატა!')
    setShowAddDriverModal(false)
    
    // 🔄 ფორმის რესეტი - ყველა ახალი ველით
    setDriverForm((p: any) => ({ 
      ...p, 
      full_name: '', dob: '', personal_id: '', phone: '', email: '', address: '', 
      license_number: '', license_category: 'C', license_expiry: '', license_photo: '', criminal_record: '', driving_record: '', medical_cert: '', 
      total_experience_years: '', special_experience: '', has_adr: false, adr_cert: '', has_own_vehicle: false, vehicle_reg: '', vehicle_insp_expiry: '', vehicle_insurance: '', 
      bank_iban: '', tax_status: 'individual', languages: '', references: '', uniform_size: 'M', photo_url: '', extra_skills: '', 
      employment_type: 'internal', hire_date: '', emergency_contact: '',
      // 🔔 Telegram
      telegram_chat_id: '',
      telegram_username: '',
      // 💰 ფინანსური
      rate_per_km: '',
      commission_percent: '20',
      base_salary: '',
      payment_method: 'bank_transfer',
      bank_name: '',
      bank_account: '',
      // 🔔 შეტყობინებები
      notify_order_assign: true,
      notify_payment: true,
      notify_promo: false,
    }))
    loadData()
  }, [driverForm, showNotification, loadData])

  const handleEditDriverClick = useCallback((driver: any) => {
    setEditingDriver(driver); 
    // ✅ ყველა ახალი ველის გადაცემა რედაქტირებისთვის
    setEditDriverForm({ 
      ...driver,
      telegram_chat_id: driver.telegram_chat_id || '',
      telegram_username: driver.telegram_username || '',
      rate_per_km: driver.rate_per_km?.toString() || '',
      commission_percent: driver.commission_percent?.toString() || '20',
      base_salary: driver.base_salary?.toString() || '',
      payment_method: driver.payment_method || 'bank_transfer',
      bank_name: driver.bank_name || '',
      bank_account: driver.bank_account || '',
      notify_order_assign: driver.notify_order_assign ?? true,
      notify_payment: driver.notify_payment ?? true,
      notify_promo: driver.notify_promo ?? false,
    }); 
    setShowEditDriverModal(true)
  }, [])

  const handleSaveEditDriver = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDriver) return
    
    const payload = { 
      ...editDriverForm, 
      dob: editDriverForm.dob || null, 
      license_expiry: editDriverForm.license_expiry || null, 
      vehicle_insp_expiry: editDriverForm.vehicle_insp_expiry || null, 
      hire_date: editDriverForm.hire_date || null, 
      daily_rate: editDriverForm.daily_rate ? parseFloat(editDriverForm.daily_rate as string) : null, 
      has_adr: Boolean(editDriverForm.has_adr), 
      has_own_vehicle: Boolean(editDriverForm.has_own_vehicle),
      
      // ✅ Telegram ველები
      telegram_chat_id: editDriverForm.telegram_chat_id || null,
      telegram_username: editDriverForm.telegram_username || null,
      
      // 💰 ფინანსური ველები
      rate_per_km: editDriverForm.rate_per_km ? parseFloat(editDriverForm.rate_per_km) : 0,
      commission_percent: editDriverForm.commission_percent ? parseFloat(editDriverForm.commission_percent) : 20,
      base_salary: editDriverForm.base_salary ? parseFloat(editDriverForm.base_salary) : 0,
      payment_method: editDriverForm.payment_method || 'bank_transfer',
      bank_name: editDriverForm.bank_name || null,
      bank_account: editDriverForm.bank_account || null,
      
      // 🔔 შეტყობინებების პრეფერენციები
      notify_order_assign: Boolean(editDriverForm.notify_order_assign),
      notify_payment: Boolean(editDriverForm.notify_payment),
      notify_promo: Boolean(editDriverForm.notify_promo),
    }
    
    const { error } = await supabase.from('drivers').update(payload).eq('id', editingDriver.id)
    if (error) { showNotification(`❌ ${error.message}`); return }
    
    showNotification('✅ მძღოლი განახლდა!'); 
    setShowEditDriverModal(false); 
    setEditingDriver(null); 
    loadData()
  }, [editingDriver, editDriverForm, showNotification, loadData])

  const handleDeleteDriverClick = useCallback((driver: any) => {
    setDeletingDriver(driver); setShowDeleteDriverModal(true)
  }, [])

  const confirmDeleteDriver = useCallback(async () => {
    if (!deletingDriver) return
    const { error } = await supabase.from('drivers').delete().eq('id', deletingDriver.id)
    if (error) { showNotification(`❌ ${error.message}`); return }
    showNotification('🗑️ წაიშალა!'); setShowDeleteDriverModal(false); setDeletingDriver(null); loadData()
  }, [deletingDriver, showNotification, loadData])

  const handleAssignVehicle = useCallback(async (driverId: string, vehicleId: string) => {
    const { error } = await supabase.from('drivers').update({ vehicle_id: vehicleId || null }).eq('id', driverId)
    if (error) { showNotification(`❌ ${error.message}`); return }
    showNotification(vehicleId ? '✅ მიენიჭა!' : '🚫 მოხსნილია!'); loadData()
  }, [showNotification, loadData])

  return {
    // Modal States
    showAddDriverModal, setShowAddDriverModal,
    showEditDriverModal, setShowEditDriverModal,
    showDeleteDriverModal, setShowDeleteDriverModal,
    editingDriver, setEditingDriver,
    editDriverForm, setEditDriverForm,
    deletingDriver, setDeletingDriver,
    // Form
    driverForm, setDriverForm,
    // Handlers
    handleAddDriver,
    handleEditDriverClick,
    handleSaveEditDriver,
    handleDeleteDriverClick,
    confirmDeleteDriver,
    handleAssignVehicle
  }
}