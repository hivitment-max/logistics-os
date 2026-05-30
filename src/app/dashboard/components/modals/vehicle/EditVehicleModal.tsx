// src/app/dashboard/components/modals/vehicle/EditVehicleModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import FormField from '../../helpers/FormField'
import SectionHeader from '../../helpers/SectionHeader'
import { Vehicle } from '../../AdminDashboard/types'

interface EditVehicleModalProps {
  isOpen: boolean
  onClose: () => void
  vehicle: Vehicle | null
  onVehicleUpdated: () => void
  showNotification: (msg: string) => void
}

export default function EditVehicleModal({ isOpen, onClose, vehicle, onVehicleUpdated, showNotification }: EditVehicleModalProps) {
  // ✅ განახლებული: body_type და სხვა ველები იღებენ უნიონ ტიპებს
  const [formData, setFormData] = useState({
    plate_number: '',
    vin_number: '',
    tech_passport: '',
    pti_expiry: '',
    insurance_policy: '',
    insurance_cmre_policy: '',
    owner_name: '',
    owner_type: 'company' as 'company' | 'individual',
    power_of_attorney: '',
    model: '',
    type: 'truck' as 'truck' | 'van' | 'car',
    body_type: 'tent' as 'tent' | 'refrigerated' | 'container' | 'flatbed' | 'bulk' | 'standard', // ✅ აქ იყო პრობლემა!
    capacity_kg: '',
    volume_m3: '',
    length_m: '',
    width_m: '',
    height_m: '',
    adr_class: '',
    euro_standard: '6' as '5' | '6' | 'EEV',
    straps_count: '',
    has_tail_lift: false,
    has_refrigeration: false,
    gps_device_id: '',
    has_fuel_sensor: false,
    photo_urls: '',
    tire_season: 'all_season' as 'summer' | 'winter' | 'all_season',
    tire_condition: 'good' as 'new' | 'good' | 'replace_soon' | 'replace_now',
    status: 'active' as 'active' | 'idle' | 'maintenance' | 'inactive',
    notes: '',
    extra_equipment: '',
  })
  
  const [submitting, setSubmitting] = useState(false)

  // ✅ განახლებული: ყველა ველი ცალ-ცალკე დამუშავებული, null → ''
  useEffect(() => {
    if (vehicle) {
      setFormData({
        // 🔴 Critical fields
        plate_number: vehicle.plate_number || '',
        vin_number: vehicle.vin_number || '',
        tech_passport: vehicle.tech_passport || '',
        pti_expiry: vehicle.pti_expiry || '',
        insurance_policy: vehicle.insurance_policy || '',
        insurance_cmre_policy: vehicle.insurance_cmre_policy || '',
        owner_name: vehicle.owner_name || '',
        owner_type: (vehicle.owner_type as 'company' | 'individual') || 'company',
        power_of_attorney: vehicle.power_of_attorney || '',
        
        // 🟡 Operational fields
        model: vehicle.model || '',
        type: (vehicle.type as 'truck' | 'van' | 'car') || 'truck',
        body_type: (vehicle.body_type as 'tent' | 'refrigerated' | 'container' | 'flatbed' | 'bulk' | 'standard') || 'tent', // ✅ ახლა მუშაობს!
        capacity_kg: vehicle.capacity_kg?.toString() || '',
        volume_m3: vehicle.volume_m3?.toString() || '',
        length_m: vehicle.length_m?.toString() || '',
        width_m: vehicle.width_m?.toString() || '',
        height_m: vehicle.height_m?.toString() || '',
        adr_class: vehicle.adr_class || '',
        euro_standard: (vehicle.euro_standard as '5' | '6' | 'EEV') || '6',
        straps_count: vehicle.straps_count?.toString() || '',
        has_tail_lift: vehicle.has_tail_lift || false,
        has_refrigeration: vehicle.has_refrigeration || false,
        
        // 🔵 Tech fields
        gps_device_id: vehicle.gps_device_id || '',
        has_fuel_sensor: vehicle.has_fuel_sensor || false,
        photo_urls: vehicle.photo_urls || '',
        tire_season: (vehicle.tire_season as 'summer' | 'winter' | 'all_season') || 'all_season',
        tire_condition: (vehicle.tire_condition as 'new' | 'good' | 'replace_soon' | 'replace_now') || 'good',
        status: (vehicle.status as 'active' | 'idle' | 'maintenance' | 'inactive') || 'active',
        
        // 🟣 Extra fields
        notes: vehicle.notes || '',
        extra_equipment: vehicle.extra_equipment || '',
      })
    }
  }, [vehicle])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // ✅ კონვერტაცია რიცხვებად სუბმიტის დროს
      const payload: Partial<Vehicle> = {
        ...formData,
        capacity_kg: formData.capacity_kg ? Number(formData.capacity_kg) : null,
        volume_m3: formData.volume_m3 ? Number(formData.volume_m3) : null,
        length_m: formData.length_m ? Number(formData.length_m) : null,
        width_m: formData.width_m ? Number(formData.width_m) : null,
        height_m: formData.height_m ? Number(formData.height_m) : null,
        straps_count: formData.straps_count ? Number(formData.straps_count) : null,
      }

      const { error } = await supabase.from('vehicles').update(payload).eq('id', vehicle?.id)
      if (error) throw error

      showNotification('✅ მანქანა წარმატებით განახლდა')
      onVehicleUpdated()
      onClose()
    } catch (err: any) {
      console.error('Failed to update vehicle:', err)
      showNotification(`❌ შეცდომა: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen || !vehicle) return null

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">✏️ მანქანის რედაქტირება</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl transition">&times;</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-6">
          
          {/* 🔴 Critical Section */}
          <div className="bg-gray-900/20 p-4 rounded-xl border border-gray-700/50">
            <SectionHeader title="🔴 კრიტიკულად აუცილებელი" icon="📋" color="text-red-400" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="სანომრე ნიშანი" hint="მაგ: AA-123-BB" required value={formData.plate_number} onChange={(e) => setFormData({ ...formData, plate_number: e.target.value })} />
              <FormField label="VIN კოდი" hint="17 სიმბოლო" required value={formData.vin_number} onChange={(e) => setFormData({ ...formData, vin_number: e.target.value })} />
              <FormField label="ტექ. პასპორტი / სკანი" hint="ფაილის სახელი ან URL" required value={formData.tech_passport} onChange={(e) => setFormData({ ...formData, tech_passport: e.target.value })} />
              <FormField label="PTI ვადა" type="date" required value={formData.pti_expiry} onChange={(e) => setFormData({ ...formData, pti_expiry: e.target.value })} />
              <FormField label="სამოქალაქო დაზღვევა" hint="პოლისის ნომერი" required value={formData.insurance_policy} onChange={(e) => setFormData({ ...formData, insurance_policy: e.target.value })} />
              <FormField label="CMR დაზღვევა" hint="პოლისის ნომერი" value={formData.insurance_cmre_policy} onChange={(e) => setFormData({ ...formData, insurance_cmre_policy: e.target.value })} />
              <FormField label="მფლობელი" hint="ვინ არის მესაკუთრე" required value={formData.owner_name} onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })} />
              <FormField label="მფლობელის ტიპი" options={[{ value: 'company', label: '🏢 კომპანია' }, { value: 'individual', label: '👤 ფიზიკური პირი' }]} value={formData.owner_type} onChange={(e) => setFormData({ ...formData, owner_type: e.target.value as 'company' | 'individual' })} />
              <FormField label="მინდობილობა" hint="თუ მძღოლი არ არის მესაკუთრე" value={formData.power_of_attorney} onChange={(e) => setFormData({ ...formData, power_of_attorney: e.target.value })} />
            </div>
          </div>

          {/* 🟡 Operational Section */}
          <div className="bg-gray-900/20 p-4 rounded-xl border border-gray-700/50">
            <SectionHeader title="🟡 საოპერაციო მონაცემები" icon="⚙️" color="text-yellow-400" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="მოდელი" hint="მაგ: Mercedes Actros" required value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} />
              <FormField label="სატრანსპორტო ტიპი" required options={[{ value: 'truck', label: '🚛 სატვირთო' }, { value: 'van', label: '🚐 ფურგონი' }, { value: 'car', label: '🚗 მსუბუქი' }]} value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as 'truck' | 'van' | 'car' })} />
              <FormField label="ძარის ტიპი" options={[{ value: 'tent', label: '🟦 ტენტი' }, { value: 'refrigerated', label: '❄️ მაცივარი' }, { value: 'container', label: '📦 კონტეინერი' }, { value: 'flatbed', label: '🔩 პლატფორმა' }, { value: 'bulk', label: '🌾 ნაყარი' }, { value: 'standard', label: '📦 სტანდარტული' }]} value={formData.body_type} onChange={(e) => setFormData({ ...formData, body_type: e.target.value as any })} />
              <FormField label="ტვირთამწეობა (კგ)" type="number" hint="მაგ: 20000" value={formData.capacity_kg} onChange={(e) => setFormData({ ...formData, capacity_kg: e.target.value })} />
              <FormField label="მოცულობა (m³)" type="number" hint="მაგ: 86" value={formData.volume_m3} onChange={(e) => setFormData({ ...formData, volume_m3: e.target.value })} />
              <div className="grid grid-cols-3 gap-2">
                <FormField label="სიგრძე (მ)" type="number" value={formData.length_m} onChange={(e) => setFormData({ ...formData, length_m: e.target.value })} />
                <FormField label="სიგანე (მ)" type="number" value={formData.width_m} onChange={(e) => setFormData({ ...formData, width_m: e.target.value })} />
                <FormField label="სიმაღლე (მ)" type="number" value={formData.height_m} onChange={(e) => setFormData({ ...formData, height_m: e.target.value })} />
              </div>
              <FormField label="ADR კლასი" hint="სახიფათო ტვირთი 1-9" value={formData.adr_class} onChange={(e) => setFormData({ ...formData, adr_class: e.target.value })} />
              <FormField label="EURO სტანდარტი" options={[{ value: '5', label: 'EURO 5' }, { value: '6', label: 'EURO 6' }, { value: 'EEV', label: 'EEV' }]} value={formData.euro_standard} onChange={(e) => setFormData({ ...formData, euro_standard: e.target.value as any })} />
              <FormField label="ღვედების რაოდენობა" type="number" hint="მაგ: 8" value={formData.straps_count} onChange={(e) => setFormData({ ...formData, straps_count: e.target.value })} />
              <FormField checkbox label="აქვს ლიფტი (Tail lift)" value={formData.has_tail_lift} onChange={(e) => setFormData({ ...formData, has_tail_lift: (e.target as HTMLInputElement).checked })} />
              <FormField checkbox label="აქვს მაცივარი" value={formData.has_refrigeration} onChange={(e) => setFormData({ ...formData, has_refrigeration: (e.target as HTMLInputElement).checked })} />
            </div>
          </div>

          {/* 🔵 Tech Section */}
          <div className="bg-gray-900/20 p-4 rounded-xl border border-gray-700/50">
            <SectionHeader title="🔵 ტექნოლოგიური & მონიტორინგი" icon="📡" color="text-blue-400" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="GPS მოწყობილობის ID" hint="ტრეკინგის ნომერი" value={formData.gps_device_id} onChange={(e) => setFormData({ ...formData, gps_device_id: e.target.value })} />
              <FormField checkbox label="აქვს საწვავის სენსორი" value={formData.has_fuel_sensor} onChange={(e) => setFormData({ ...formData, has_fuel_sensor: (e.target as HTMLInputElement).checked })} />
              <FormField label="ფოტოები (URL-ები)" hint="გამოყოფილი მძიმით" textarea value={formData.photo_urls} onChange={(e) => setFormData({ ...formData, photo_urls: e.target.value })} />
              <FormField label="საბურავების სეზონი" options={[{ value: 'summer', label: '☀️ ზაფხული' }, { value: 'winter', label: '❄️ ზამთარი' }, { value: 'all_season', label: '🌤️ ყველა სეზონი' }]} value={formData.tire_season} onChange={(e) => setFormData({ ...formData, tire_season: e.target.value as any })} />
              <FormField label="საბურავების მდგომარეობა" options={[{ value: 'new', label: '🟢 ახალი' }, { value: 'good', label: '🟡 კარგი' }, { value: 'replace_soon', label: '🟠 მალე შესაცვლელი' }, { value: 'replace_now', label: '🔴 დაუყოვნებლივ' }]} value={formData.tire_condition} onChange={(e) => setFormData({ ...formData, tire_condition: e.target.value as any })} />
              <FormField label="სტატუსი" required options={[{ value: 'active', label: '🟢 აქტიური' }, { value: 'idle', label: '🟡 ლოდინში' }, { value: 'maintenance', label: '🔧 რემონტში' }, { value: 'inactive', label: '⚫ არააქტიური' }]} value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} />
            </div>
          </div>

          {/* 🟣 Extra Section */}
          <div className="bg-gray-900/20 p-4 rounded-xl border border-gray-700/50">
            <SectionHeader title="🟣 დამატებითი ინფორმაცია" icon="📝" color="text-purple-400" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="შენიშვნები" hint="შიდა შენიშვნა ან დეტალები..." textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
              <FormField label="დამატებითი აღჭურვილობა" hint="მაგ: ავტოამწე, GPS ტრეკერი..." textarea value={formData.extra_equipment} onChange={(e) => setFormData({ ...formData, extra_equipment: e.target.value })} />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-700 mt-2">
            <button type="button" onClick={onClose} disabled={submitting} className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-medium transition disabled:opacity-50">გაუქმება</button>
            <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-bold transition shadow-lg shadow-blue-500/20 disabled:opacity-50">
              {submitting ? '🔄 ითვირთება...' : '💾 განახლება'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}