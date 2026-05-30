// src/app/dashboard/components/modals/vehicle/AddVehicleModal.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
// ✅ გასწორებული იმპორტები:
import FormField from '../../helpers/FormField'
import SectionHeader from '../../helpers/SectionHeader'
import { Vehicle } from '../../AdminDashboard/types'

interface AddVehicleModalProps {
  isOpen: boolean
  onClose: () => void
  onVehicleAdded: () => void
  showNotification: (msg: string) => void
}

// ✅ განახლებული: owner_type იღებს ორივე ვარიანტს
const initialFormState = {
  plate_number: '',
  vin_number: '',
  tech_passport: '',
  pti_expiry: '',
  insurance_policy: '',
  insurance_cmre_policy: '',
  owner_name: '',
  owner_type: 'company' as 'company' | 'individual', // ✅ აქ იყო პრობლემა!
  power_of_attorney: '',
  model: '',
  type: 'truck' as const,
  body_type: 'tent' as const,
  capacity_kg: '',
  volume_m3: '',
  length_m: '',
  width_m: '',
  height_m: '',
  adr_class: '',
  euro_standard: '6' as const,
  straps_count: '',
  has_tail_lift: false,
  has_refrigeration: false,
  gps_device_id: '',
  has_fuel_sensor: false,
  photo_urls: '',
  tire_season: 'all_season' as const,
  tire_condition: 'good' as const,
  status: 'active' as const,
  notes: '',
  extra_equipment: '',
}

export default function AddVehicleModal({ isOpen, onClose, onVehicleAdded, showNotification }: AddVehicleModalProps) {
  const [vehicleForm, setVehicleForm] = useState(initialFormState)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const payload: Partial<Vehicle> = {
        ...vehicleForm,
        capacity_kg: vehicleForm.capacity_kg ? Number(vehicleForm.capacity_kg) : null,
        volume_m3: vehicleForm.volume_m3 ? Number(vehicleForm.volume_m3) : null,
        length_m: vehicleForm.length_m ? Number(vehicleForm.length_m) : null,
        width_m: vehicleForm.width_m ? Number(vehicleForm.width_m) : null,
        height_m: vehicleForm.height_m ? Number(vehicleForm.height_m) : null,
        straps_count: vehicleForm.straps_count ? Number(vehicleForm.straps_count) : null,
      }

      const { error } = await supabase.from('vehicles').insert([payload])
      if (error) throw error

      showNotification('✅ მანქანა წარმატებით დაემატა')
      onVehicleAdded()
      setVehicleForm(initialFormState)
      onClose()
    } catch (err: any) {
      console.error('Failed to add vehicle:', err)
      showNotification(`❌ შეცდომა: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">🚐 ახალი მანქანის რეგისტრაცია</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl transition">&times;</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-6">
          
          {/* 🔴 Critical Section */}
          <div className="bg-gray-900/20 p-4 rounded-xl border border-gray-700/50">
            <SectionHeader title="🔴 კრიტიკულად აუცილებელი (სავალდებულო)" icon="📋" color="text-red-400" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="სანომრე ნიშანი" hint="მაგ: AA-123-BB" required value={vehicleForm.plate_number} onChange={(e) => setVehicleForm({ ...vehicleForm, plate_number: e.target.value })} />
              <FormField label="VIN კოდი" hint="17 სიმბოლო" required value={vehicleForm.vin_number} onChange={(e) => setVehicleForm({ ...vehicleForm, vin_number: e.target.value })} />
              <FormField label="ტექ. პასპორტი / სკანი" hint="ფაილის სახელი ან URL" required value={vehicleForm.tech_passport} onChange={(e) => setVehicleForm({ ...vehicleForm, tech_passport: e.target.value })} />
              <FormField label="PTI ვადა" type="date" required value={vehicleForm.pti_expiry} onChange={(e) => setVehicleForm({ ...vehicleForm, pti_expiry: e.target.value })} />
              <FormField label="სამოქალაქო დაზღვევა" hint="პოლისის ნომერი" required value={vehicleForm.insurance_policy} onChange={(e) => setVehicleForm({ ...vehicleForm, insurance_policy: e.target.value })} />
              <FormField label="CMR დაზღვევა" hint="პოლისის ნომერი" value={vehicleForm.insurance_cmre_policy} onChange={(e) => setVehicleForm({ ...vehicleForm, insurance_cmre_policy: e.target.value })} />
              <FormField label="მფლობელი" hint="ვინ არის მესაკუთრე" required value={vehicleForm.owner_name} onChange={(e) => setVehicleForm({ ...vehicleForm, owner_name: e.target.value })} />
              <FormField label="მფლობელის ტიპი" options={[{ value: 'company', label: '🏢 კომპანია' }, { value: 'individual', label: '👤 ფიზიკური პირი' }]} value={vehicleForm.owner_type} onChange={(e) => setVehicleForm({ ...vehicleForm, owner_type: e.target.value as 'company' | 'individual' })} />
              <FormField label="მინდობილობა" hint="თუ მძღოლი არ არის მესაკუთრე" value={vehicleForm.power_of_attorney} onChange={(e) => setVehicleForm({ ...vehicleForm, power_of_attorney: e.target.value })} />
            </div>
          </div>

          {/* 🟡 Operational Section */}
          <div className="bg-gray-900/20 p-4 rounded-xl border border-gray-700/50">
            <SectionHeader title="🟡 საოპერაციო მონაცემები" icon="⚙️" color="text-yellow-400" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="მოდელი" hint="მაგ: Mercedes Actros" required value={vehicleForm.model} onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })} />
              <FormField label="სატრანსპორტო ტიპი" required options={[{ value: 'truck', label: '🚛 სატვირთო' }, { value: 'van', label: '🚐 ფურგონი' }, { value: 'car', label: '🚗 მსუბუქი' }]} value={vehicleForm.type} onChange={(e) => setVehicleForm({ ...vehicleForm, type: e.target.value as 'truck' | 'van' | 'car' })} />
              <FormField label="ძარის ტიპი" options={[{ value: 'tent', label: '🟦 ტენტი' }, { value: 'refrigerated', label: '❄️ მაცივარი' }, { value: 'container', label: '📦 კონტეინერი' }, { value: 'flatbed', label: '🔩 პლატფორმა' }, { value: 'bulk', label: '🌾 ნაყარი' }, { value: 'standard', label: '📦 სტანდარტული' }]} value={vehicleForm.body_type} onChange={(e) => setVehicleForm({ ...vehicleForm, body_type: e.target.value as any })} />
              <FormField label="ტვირთამწეობა (კგ)" type="number" hint="მაგ: 20000" value={vehicleForm.capacity_kg} onChange={(e) => setVehicleForm({ ...vehicleForm, capacity_kg: e.target.value })} />
              <FormField label="მოცულობა (m³)" type="number" hint="მაგ: 86" value={vehicleForm.volume_m3} onChange={(e) => setVehicleForm({ ...vehicleForm, volume_m3: e.target.value })} />
              <div className="grid grid-cols-3 gap-2">
                <FormField label="სიგრძე (მ)" type="number" value={vehicleForm.length_m} onChange={(e) => setVehicleForm({ ...vehicleForm, length_m: e.target.value })} />
                <FormField label="სიგანე (მ)" type="number" value={vehicleForm.width_m} onChange={(e) => setVehicleForm({ ...vehicleForm, width_m: e.target.value })} />
                <FormField label="სიმაღლე (მ)" type="number" value={vehicleForm.height_m} onChange={(e) => setVehicleForm({ ...vehicleForm, height_m: e.target.value })} />
              </div>
              <FormField label="ADR კლასი" hint="სახიფათო ტვირთი 1-9" value={vehicleForm.adr_class} onChange={(e) => setVehicleForm({ ...vehicleForm, adr_class: e.target.value })} />
              <FormField label="EURO სტანდარტი" options={[{ value: '5', label: 'EURO 5' }, { value: '6', label: 'EURO 6' }, { value: 'EEV', label: 'EEV' }]} value={vehicleForm.euro_standard} onChange={(e) => setVehicleForm({ ...vehicleForm, euro_standard: e.target.value as any })} />
              <FormField label="ღვედების რაოდენობა" type="number" hint="მაგ: 8" value={vehicleForm.straps_count} onChange={(e) => setVehicleForm({ ...vehicleForm, straps_count: e.target.value })} />
              <FormField checkbox label="აქვს ლიფტი (Tail lift)" value={vehicleForm.has_tail_lift} onChange={(e) => setVehicleForm({ ...vehicleForm, has_tail_lift: e.target.checked })} />
              <FormField checkbox label="აქვს მაცივარი" value={vehicleForm.has_refrigeration} onChange={(e) => setVehicleForm({ ...vehicleForm, has_refrigeration: e.target.checked })} />
            </div>
          </div>

          {/* 🔵 Tech Section */}
          <div className="bg-gray-900/20 p-4 rounded-xl border border-gray-700/50">
            <SectionHeader title="🔵 ტექნოლოგიური & მონიტორინგი" icon="📡" color="text-blue-400" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="GPS მოწყობილობის ID" hint="ტრეკინგის ნომერი" value={vehicleForm.gps_device_id} onChange={(e) => setVehicleForm({ ...vehicleForm, gps_device_id: e.target.value })} />
              <FormField checkbox label="აქვს საწვავის სენსორი" value={vehicleForm.has_fuel_sensor} onChange={(e) => setVehicleForm({ ...vehicleForm, has_fuel_sensor: e.target.checked })} />
              <FormField label="ფოტოები (URL-ები)" hint="გამოყოფილი მძიმით" textarea value={vehicleForm.photo_urls} onChange={(e) => setVehicleForm({ ...vehicleForm, photo_urls: e.target.value })} />
              <FormField label="საბურავების სეზონი" options={[{ value: 'summer', label: '☀️ ზაფხული' }, { value: 'winter', label: '❄️ ზამთარი' }, { value: 'all_season', label: '🌤️ ყველა სეზონი' }]} value={vehicleForm.tire_season} onChange={(e) => setVehicleForm({ ...vehicleForm, tire_season: e.target.value as any })} />
              <FormField label="საბურავების მდგომარეობა" options={[{ value: 'new', label: '🟢 ახალი' }, { value: 'good', label: '🟡 კარგი' }, { value: 'replace_soon', label: '🟠 მალე შესაცვლელი' }, { value: 'replace_now', label: '🔴 დაუყოვნებლივ' }]} value={vehicleForm.tire_condition} onChange={(e) => setVehicleForm({ ...vehicleForm, tire_condition: e.target.value as any })} />
              <FormField label="სტატუსი" required options={[{ value: 'active', label: '🟢 აქტიური' }, { value: 'idle', label: '🟡 ლოდინში' }, { value: 'maintenance', label: '🔧 რემონტში' }, { value: 'inactive', label: '⚫ არააქტიური' }]} value={vehicleForm.status} onChange={(e) => setVehicleForm({ ...vehicleForm, status: e.target.value as any })} />
            </div>
          </div>

          {/* 🟣 Extra Section */}
          <div className="bg-gray-900/20 p-4 rounded-xl border border-gray-700/50">
            <SectionHeader title="🟣 დამატებითი ინფორმაცია" icon="📝" color="text-purple-400" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="შენიშვნები" hint="შიდა შენიშვნა ან დეტალები..." textarea value={vehicleForm.notes} onChange={(e) => setVehicleForm({ ...vehicleForm, notes: e.target.value })} />
              <FormField label="დამატებითი აღჭურვილობა" hint="მაგ: ავტოამწე, GPS ტრეკერი..." textarea value={vehicleForm.extra_equipment} onChange={(e) => setVehicleForm({ ...vehicleForm, extra_equipment: e.target.value })} />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-700 mt-2">
            <button type="button" onClick={onClose} disabled={submitting} className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-medium transition disabled:opacity-50">გაუქმება</button>
            <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-bold transition shadow-lg shadow-blue-500/20 disabled:opacity-50">
              {submitting ? '🔄 ითვირთება...' : '💾 შენახვა'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}