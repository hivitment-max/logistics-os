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

  // 📝 Add Form State - ✅ დამატებულია telegram ველები
  const [driverForm, setDriverForm] = useState({
    employment_type: 'internal',
    full_name: '', dob: '', personal_id: '', phone: '', email: '', address: '',
    license_number: '', license_category: 'C', license_expiry: '', license_photo: '', criminal_record: '', driving_record: '', medical_cert: '',
    total_experience_years: '', special_experience: '', has_adr: false, adr_cert: '', has_own_vehicle: false, vehicle_reg: '', vehicle_insp_expiry: '', vehicle_insurance: '',
    bank_iban: '', tax_status: 'individual', languages: '', references: '', uniform_size: 'M', photo_url: '', extra_skills: '',
    is_available: true, hire_date: '', daily_rate: '', emergency_contact: '',
    // ✅ ახალი: Telegram შეტყობინებებისთვის
    telegram_chat_id: '',
    telegram_username: ''
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
      // ✅ Telegram ველები (ცარიელი თუ არ არის შევსებული)
      telegram_chat_id: driverForm.telegram_chat_id || null,
      telegram_username: driverForm.telegram_username || null
    }
    const { error } = await supabase.from('drivers').insert([payload])
    if (error) { showNotification(`❌ ${error.message}`); return }
    
    showNotification('✅ მძღოლი წარმატებით დაემატა!')
    setShowAddDriverModal(false)
    // 🔄 ფორმის რესეტი - დავამატეთ telegram ველებიც
    setDriverForm((p: any) => ({ 
      ...p, 
      full_name: '', dob: '', personal_id: '', phone: '', email: '', address: '', 
      license_number: '', license_category: 'C', license_expiry: '', license_photo: '', criminal_record: '', driving_record: '', medical_cert: '', 
      total_experience_years: '', special_experience: '', has_adr: false, adr_cert: '', has_own_vehicle: false, vehicle_reg: '', vehicle_insp_expiry: '', vehicle_insurance: '', 
      bank_iban: '', tax_status: 'individual', languages: '', references: '', uniform_size: 'M', photo_url: '', extra_skills: '', 
      employment_type: 'internal', hire_date: '', emergency_contact: '',
      // ✅ რესეტი ტელეგრამის ველებისთვისაც
      telegram_chat_id: '',
      telegram_username: ''
    }))
    loadData()
  }, [driverForm, showNotification, loadData])

  const handleEditDriverClick = useCallback((driver: any) => {
    setEditingDriver(driver); 
    // ✅ დარწმუნდით რომ telegram ველებიც გადაიცემა
    setEditDriverForm({ 
      ...driver,
      telegram_chat_id: driver.telegram_chat_id || '',
      telegram_username: driver.telegram_username || ''
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
      // ✅ Telegram ველები განახლებისას
      telegram_chat_id: editDriverForm.telegram_chat_id || null,
      telegram_username: editDriverForm.telegram_username || null
    }
    const { error } = await supabase.from('drivers').update(payload).eq('id', editingDriver.id)
    if (error) { showNotification(`❌ ${error.message}`); return }
    showNotification('✅ მძღოლი განახლდა!'); setShowEditDriverModal(false); setEditingDriver(null); loadData()
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