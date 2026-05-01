import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

interface UseVehiclesProps {
  showNotification: (msg: string) => void
  loadData: () => Promise<void>
}

export function useVehicles({ showNotification, loadData }: UseVehiclesProps) {
  // 🚗 Modal States
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<any | null>(null)
  const [showEditVehicleModal, setShowEditVehicleModal] = useState(false)
  const [editVehicleForm, setEditVehicleForm] = useState<any>({})
  const [deletingVehicle, setDeletingVehicle] = useState<any | null>(null)
  const [showDeleteVehicleModal, setShowDeleteVehicleModal] = useState(false)

  // 📝 Add Form State
  const [vehicleForm, setVehicleForm] = useState({
    plate_number: '', vin_number: '', tech_passport: '', pti_expiry: '',
    insurance_policy: '', insurance_cmre_policy: '', owner_name: '', owner_type: 'company', power_of_attorney: '',
    model: '', type: 'truck', body_type: 'tent', capacity_kg: '', volume_m3: '', length_m: '', width_m: '', height_m: '',
    adr_class: '', euro_standard: '6', has_tail_lift: false, straps_count: '',
    gps_device_id: '', has_fuel_sensor: false, photo_urls: '', tire_season: 'all_season', tire_condition: 'good',
    status: 'active', year_manufactured: '', mileage: '', fuel_type: 'diesel', color: '',
    last_service_date: '', next_service_date: '', insurance_expiry: '', notes: ''
  })

  // 🔧 Handlers
  const handleAddVehicle = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      ...vehicleForm,
      pti_expiry: vehicleForm.pti_expiry || null, insurance_expiry: vehicleForm.insurance_expiry || null,
      last_service_date: vehicleForm.last_service_date || null, next_service_date: vehicleForm.next_service_date || null,
      year_manufactured: vehicleForm.year_manufactured ? parseInt(vehicleForm.year_manufactured as string) : null,
      capacity_kg: vehicleForm.capacity_kg ? parseInt(vehicleForm.capacity_kg as string) : null,
      mileage: vehicleForm.mileage ? parseInt(vehicleForm.mileage as string) : null,
      volume_m3: vehicleForm.volume_m3 ? parseFloat(vehicleForm.volume_m3 as string) : null,
      length_m: vehicleForm.length_m ? parseFloat(vehicleForm.length_m as string) : null,
      width_m: vehicleForm.width_m ? parseFloat(vehicleForm.width_m as string) : null,
      height_m: vehicleForm.height_m ? parseFloat(vehicleForm.height_m as string) : null,
      straps_count: vehicleForm.straps_count ? parseInt(vehicleForm.straps_count as string) : 0,
      has_tail_lift: Boolean(vehicleForm.has_tail_lift), has_fuel_sensor: Boolean(vehicleForm.has_fuel_sensor)
    }
    const { error } = await supabase.from('vehicles').insert([payload])
    if (error) { showNotification(`❌ ${error.message}`); return }
    
    showNotification('✅ მანქანა წარმატებით დაემატა!')
    setShowAddVehicleModal(false)
    setVehicleForm({
      plate_number: '', model: '', type: 'truck', status: 'active', vin_number: '', year_manufactured: '', capacity_kg: '', mileage: '', fuel_type: 'diesel', color: '', last_service_date: '', next_service_date: '', insurance_expiry: '', insurance_policy: '', tech_passport: '', notes: '', pti_expiry: '', volume_m3: '', length_m: '', width_m: '', height_m: '', straps_count: '', has_tail_lift: false, has_fuel_sensor: false, insurance_cmre_policy: '', owner_name: '', owner_type: 'company', power_of_attorney: '', body_type: 'tent', adr_class: '', euro_standard: '6', gps_device_id: '', photo_urls: '', tire_season: 'all_season', tire_condition: 'good'
    })
    loadData()
  }, [vehicleForm, showNotification, loadData])

  const handleEditVehicleClick = useCallback((vehicle: any) => {
    setEditingVehicle(vehicle); setEditVehicleForm({ ...vehicle }); setShowEditVehicleModal(true)
  }, [])

  const handleSaveEditVehicle = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingVehicle) return
    const payload = { ...editVehicleForm, pti_expiry: editVehicleForm.pti_expiry || null, insurance_expiry: editVehicleForm.insurance_expiry || null, last_service_date: editVehicleForm.last_service_date || null, next_service_date: editVehicleForm.next_service_date || null, vehicle_insp_expiry: editVehicleForm.vehicle_insp_expiry || null, year_manufactured: editVehicleForm.year_manufactured ? parseInt(editVehicleForm.year_manufactured as string) : null, capacity_kg: editVehicleForm.capacity_kg ? parseInt(editVehicleForm.capacity_kg as string) : null, mileage: editVehicleForm.mileage ? parseInt(editVehicleForm.mileage as string) : null }
    const { error } = await supabase.from('vehicles').update(payload).eq('id', editingVehicle.id)
    if (error) { showNotification(`❌ ${error.message}`); return }
    showNotification('✅ მანქანა განახლდა!'); setShowEditVehicleModal(false); setEditingVehicle(null); loadData()
  }, [editingVehicle, editVehicleForm, showNotification, loadData])

  const handleDeleteVehicleClick = useCallback((vehicle: any) => {
    setDeletingVehicle(vehicle); setShowDeleteVehicleModal(true)
  }, [])

  const confirmDeleteVehicle = useCallback(async () => {
    if (!deletingVehicle) return
    const { error } = await supabase.from('vehicles').delete().eq('id', deletingVehicle.id)
    if (error) { showNotification(`❌ ${error.message}`); return }
    showNotification('🗑️ წაიშალა!'); setShowDeleteVehicleModal(false); setDeletingVehicle(null); loadData()
  }, [deletingVehicle, showNotification, loadData])

  return {
    // Modal States
    showAddVehicleModal, setShowAddVehicleModal,
    showEditVehicleModal, setShowEditVehicleModal,
    showDeleteVehicleModal, setShowDeleteVehicleModal,
    editingVehicle, setEditingVehicle,
    editVehicleForm, setEditVehicleForm,
    deletingVehicle, setDeletingVehicle,
    // Form
    vehicleForm, setVehicleForm,
    // Handlers
    handleAddVehicle,
    handleEditVehicleClick,
    handleSaveEditVehicle,
    handleDeleteVehicleClick,
    confirmDeleteVehicle
  }
}