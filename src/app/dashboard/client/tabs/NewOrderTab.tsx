'use client'
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'

// ============================================================================
// 🗺️ GEOCODING & DISTANCE CALCULATION
// ============================================================================

interface Coordinates {
  lat: number
  lon: number
}

const geocodeAddress = async (address: string): Promise<Coordinates | null> => {
  if (!address || address.trim().length < 5) return null
  
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
      { headers: { 'User-Agent': 'LogisticsOS/1.0' } }
    )
    
    if (!response.ok) return null
    
    const data = await response.json()
    if (data.length === 0) return null
    
    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon)
    }
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

const haversineDistance = (coord1: Coordinates, coord2: Coordinates): number => {
  const R = 6371
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180
  const dLon = (coord2.lon - coord1.lon) * Math.PI / 180
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c)
}

const calculateDistanceBetweenAddresses = async (
  pickupAddress: string,
  deliveryAddress: string
): Promise<number | null> => {
  if (!pickupAddress || !deliveryAddress) return null
  
  const [pickupCoords, deliveryCoords] = await Promise.all([
    geocodeAddress(pickupAddress),
    geocodeAddress(deliveryAddress)
  ])
  
  if (!pickupCoords || !deliveryCoords) return null
  
  return haversineDistance(pickupCoords, deliveryCoords)
}

// ============================================================================
// 🧩 Helper Components - განახლებული სავალდებულო ველების ფერებით
// ============================================================================

const FormField = ({ 
  label, hint, required, type = 'text', value, onChange, options, textarea, checkbox, className = '', suffix = '', icon = ''
}: any) => {
  if (checkbox) {
    return (
      <label className={`flex items-center gap-2 p-2.5 bg-gray-800/50 border border-gray-700 rounded-lg cursor-pointer hover:border-violet-500/50 hover:bg-gray-800 transition-all group ${className}`}>
        <input type="checkbox" checked={!!value} onChange={onChange} className="w-3.5 h-3.5 rounded border-gray-600 bg-gray-700 text-violet-600 focus:ring-violet-500/20" />
        <span className="text-xs text-gray-300 group-hover:text-white">{label}</span>
      </label>
    )
  }

  // ✅ სავალდებულო ველების ფერების ლოგიკა
  const isRequiredFilled = required && value && value.toString().trim() !== ''
  const borderColorClass = required 
    ? isRequiredFilled 
      ? 'border-emerald-500/40 focus:border-emerald-500/60 focus:ring-emerald-500/20' 
      : 'border-red-500/40 focus:border-red-500/60 focus:ring-red-500/20'
    : 'border-gray-700 focus:border-violet-500 focus:ring-violet-500/20'

  return (
    <div className={textarea ? "col-span-1 md:col-span-2" : className}>
      <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-1.5">
        {icon && <span>{icon}</span>}
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {textarea ? (
        <textarea 
          rows={3} 
          value={value || ''} 
          onChange={onChange} 
          placeholder={hint} 
          className={`w-full px-3 py-2 bg-gray-800/50 border rounded-lg text-xs text-white placeholder-gray-500 outline-none focus:ring-1 transition-all resize-none hover:border-gray-600 ${borderColorClass}`} 
        />
      ) : options ? (
        <select 
          value={value || ''} 
          onChange={onChange} 
          className={`w-full px-3 py-2 bg-gray-800/50 border rounded-lg text-xs text-white outline-none transition-all appearance-none cursor-pointer hover:border-gray-600 ${borderColorClass}`}
        >
          <option value="">აირჩიე...</option>
          {options.map((opt: any) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      ) : (
        <div className="relative">
          <input 
            type={type} 
            value={value || ''} 
            onChange={onChange} 
            placeholder={hint} 
            required={required} 
            className={`w-full ${suffix ? 'pr-10' : ''} px-3 py-2 bg-gray-800/50 border rounded-lg text-xs text-white placeholder-gray-500 outline-none focus:ring-1 transition-all hover:border-gray-600 ${borderColorClass}`} 
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-gray-500 pointer-events-none">
              {suffix}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// 📊 STEP CONFIGURATION
// ============================================================================

const STEPS = [
  { id: 1, title: 'მარშრუტი', icon: '📍', color: 'from-blue-500 to-cyan-500' },
  { id: 2, title: 'ტვირთი', icon: '📦', color: 'from-violet-500 to-purple-500' },
  { id: 3, title: 'ფინანსები', icon: '💰', color: 'from-emerald-500 to-teal-500' },
  { id: 4, title: 'დამკვეთი', icon: '👤', color: 'from-orange-500 to-red-500' },
  { id: 5, title: 'დამატებითი', icon: '📝', color: 'from-pink-500 to-rose-500' },
  { id: 6, title: 'დასტური', icon: '✅', color: 'from-green-500 to-emerald-500' },
]

// ============================================================================
// 🔍 VALIDATION
// ============================================================================

const validateStep = (step: number, form: any): string[] => {
  const errors: string[] = []
  if (step === 1) {
    if (!form.pickup_address?.trim()) errors.push('ატვირთვის მისამართი სავალდებულოა')
    if (!form.delivery_address?.trim()) errors.push('ჩატვირთვის მისამართი სავალდებულოა')
    if (!form.pickup_date) errors.push('ატვირთვის თარიღი სავალდებულოა')
    if (!form.pickup_contact_person?.trim()) errors.push('საკონტაქტო პირი სავალდებულოა')
    if (!form.pickup_phone?.trim()) errors.push('ატვირთვის ტელეფონი სავალდებულოა')
    if (!form.delivery_contact_person?.trim()) errors.push('მიმღები პირი სავალდებულოა')
    if (!form.delivery_phone?.trim()) errors.push('მიწოდების ტელეფონი სავალდებულოა')
  }
  if (step === 2) {
    if (!form.cargo_description?.trim()) errors.push('ტვირთის აღწერა სავალდებულოა')
    if (!form.cargo_weight_kg) errors.push('წონა სავალდებულოა')
  }
  if (step === 3) {
    if (!form.price) errors.push('ფასი სავალდებულოა')
    if (!form.currency) errors.push('ვალუტა სავალდებულოა')
  }
  if (step === 4) {
    if (form.client_type === 'private') {
      if (!form.client_name?.trim()) errors.push('სახელი და გვარი სავალდებულოა')
      if (!form.client_personal_id?.trim()) errors.push('პირადი ნომერი სავალდებულოა')
      if (!form.client_phone?.trim()) errors.push('ტელეფონი სავალდებულოა')
      if (!form.client_email?.trim()) errors.push('Email სავალდებულოა')
      if (!form.client_address?.trim()) errors.push('მისამართი სავალდებულოა')
    } else {
      if (!form.client_company_name?.trim()) errors.push('კომპანიის სახელი სავალდებულოა')
      if (!form.client_registration_number?.trim()) errors.push('საიდენტო კოდი სავალდებულოა')
      if (!form.client_contact_person?.trim()) errors.push('საკონტაქტო პირი სავალდებულოა')
      if (!form.client_contact_phone?.trim()) errors.push('საკონტაქტო პირის ტელეფონი სავალდებულოა')
      if (!form.client_phone?.trim()) errors.push('ტელეფონი სავალდებულოა')
      if (!form.client_email?.trim()) errors.push('Email სავალდებულოა')
      if (!form.client_address?.trim()) errors.push('მისამართი სავალდებულოა')
    }
  }
  return errors
}

// ============================================================================
// 🚀 INITIAL FORM
// ============================================================================

const INITIAL_FORM = {
  pickup_address: '',
  pickup_date: '',
  pickup_time: '',
  pickup_contact_person: '',
  pickup_phone: '',
  delivery_address: '',
  delivery_date: '',
  delivery_time: '',
  delivery_contact_person: '',
  delivery_phone: '',
  distance_km: '',
  cargo_description: '',
  cargo_type: 'standard',
  cargo_weight_kg: '',
  cargo_volume_m3: '',
  places_count: '',
  cargo_length_m: '',
  cargo_width_m: '',
  cargo_height_m: '',
  packaging_type: '',
  returnable_packaging: false,
  declared_value: '',
  price: '',
  currency: 'GEL',
  payment_terms: '',
  invoice_needed: false,
  client_type: 'private',
  client_name: '',
  client_personal_id: '',
  client_company_name: '',
  client_registration_number: '',
  client_vat: '',
  client_phone: '',
  client_email: '',
  client_address: '',
  client_contact_person: '',
  client_contact_phone: '',
  transport_type: '',
  container_number: '',
  special_requirements: '',
  internal_notes: '',
  needs_tail_lift: false,
  needs_straps: false,
  needs_bricklaying: false,
  needs_two_cargo_handlers: false,
}

// ============================================================================
// 📦 NEW ORDER TAB
// ============================================================================

export default function NewOrderTab({ onCreateOrder }: any) {
  const [currentStep, setCurrentStep] = useState(1)
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState<string[]>([])
  const [error, setError] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUser(user)
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          setUserProfile(profile)
          setForm(prev => ({
            ...prev,
            client_type: profile.client_type || 'private',
            client_name: profile.full_name || '',
            client_personal_id: profile.client_type === 'private' ? (profile.tax_id || '') : '',
            client_company_name: profile.company_name || '',
            client_registration_number: profile.client_type === 'company' ? (profile.tax_id || '') : '',
            client_vat: profile.vat_number || '',
            client_contact_person: profile.contact_person || '',
            client_contact_phone: profile.contact_phone || '',
            client_phone: profile.phone || '',
            client_email: profile.email || user.email || '',
            client_address: profile.address || '',
          }))
        }
      }
    }
    loadUser()
  }, [])

  useEffect(() => {
    const calculateDistance = async () => {
      const pickup = form.pickup_address
      const delivery = form.delivery_address
      if (!pickup || !delivery || pickup.length < 5 || delivery.length < 5) return
      setIsCalculatingDistance(true)
      try {
        const distance = await calculateDistanceBetweenAddresses(pickup, delivery)
        if (distance && distance > 0) {
          setForm(prev => ({ ...prev, distance_km: distance.toString() }))
        }
      } catch (error) {
        console.error('Distance calculation error:', error)
      } finally {
        setIsCalculatingDistance(false)
      }
    }
    const timer = setTimeout(calculateDistance, 1000)
    return () => clearTimeout(timer)
  }, [form.pickup_address, form.delivery_address])

  const updateField = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors([])
  }

  const handleNext = () => {
    const stepErrors = validateStep(currentStep, form)
    if (stepErrors.length > 0) { 
      setErrors(stepErrors)
      setTimeout(() => setErrors([]), 3000)
      return 
    }
    setErrors([])
    if (currentStep < STEPS.length) setCurrentStep(currentStep + 1)
  }

  const handleBack = () => {
    if (currentStep > 1) { 
      setCurrentStep(currentStep - 1)
      setErrors([])
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError('')

    try {
      if (!currentUser) throw new Error('მომხმარებელი არ არის ავტორიზებული')

      const buildTimestamp = (date: string, time: string): string | null => {
        if (!date) return null
        const t = time || '00:00'
        return new Date(`${date}T${t}:00`).toISOString()
      }

      const newOrder = {
        client_email: currentUser.email,
        tracking_code: `LOG-${Date.now().toString().slice(-6)}`,
        status: 'pending',
        created_at: new Date().toISOString(),
        created_by: currentUser.id,
        client_type: form.client_type,
        client_name: form.client_type === 'private' ? form.client_name : form.client_company_name,
        client_personal_id: form.client_type === 'private' ? form.client_personal_id : null,
        client_registration_number: form.client_type === 'company' ? form.client_registration_number : null,
        client_vat: form.client_type === 'company' ? (form.client_vat || null) : null,
        client_phone: form.client_phone,
        client_address: form.client_address,
        pickup_address: form.pickup_address,
        pickup_contact_person: form.pickup_contact_person,
        pickup_phone: form.pickup_phone,
        scheduled_pickup_date: buildTimestamp(form.pickup_date, form.pickup_time),
        delivery_address: form.delivery_address,
        delivery_contact_person: form.delivery_contact_person,
        delivery_phone: form.delivery_phone,
        scheduled_delivery_date: buildTimestamp(form.delivery_date, form.delivery_time),
        cargo_description: form.cargo_description,
        cargo_type: form.cargo_type,
        cargo_weight_kg: parseFloat(form.cargo_weight_kg) || null,
        cargo_volume_m3: parseFloat(form.cargo_volume_m3) || null,
        places_count: parseInt(form.places_count) || null,
        cargo_length_m: parseFloat(form.cargo_length_m) || null,
        cargo_width_m: parseFloat(form.cargo_width_m) || null,
        cargo_height_m: parseFloat(form.cargo_height_m) || null,
        packaging_type: form.packaging_type || null,
        returnable_packaging: form.returnable_packaging,
        declared_value: parseFloat(form.declared_value) || null,
        price: parseFloat(form.price) || null,
        currency: form.currency,
        payment_terms: form.payment_terms || null,
        invoice_needed: form.invoice_needed,
        transport_type: form.transport_type || null,
        container_number: form.container_number || null,
        special_requirements: form.special_requirements || null,
        notes: form.internal_notes || null,
        needs_tail_lift: form.needs_tail_lift,
        needs_straps: form.needs_straps,
        needs_bricklaying: form.needs_bricklaying,
        needs_two_cargo_handlers: form.needs_two_cargo_handlers,
      }

      const { data, error: insertError } = await supabase
        .from('orders')
        .insert([newOrder])
        .select()
        .single()
      
      if (insertError) throw insertError

      onCreateOrder(data)
      setShowSuccessPopup(true)
      
    } catch (err: any) {
      console.error('❌ [NewOrder] Error:', err.message)
      setError(err.message || 'შეკვეთის შექმნა ვერ მოხერხდა')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNewOrder = () => {
    setShowSuccessPopup(false)
    setCurrentStep(1)
    setForm(INITIAL_FORM)
    setErrors([])
    setError('')
  }

  const suggestedPrice = useMemo(() => {
    const distance = parseFloat(form.distance_km) || 0
    const weight = parseFloat(form.cargo_weight_kg) || 0
    const volume = parseFloat(form.cargo_volume_m3) || 0
    if (distance === 0 && weight === 0) return 0
    const basePrice = (distance * 1.5) + (weight * 0.3) + (volume * 15) + 50
    const typeMultipliers: Record<string, number> = {
      standard: 1.0, fragile: 1.3, adr: 1.8, refrigerated: 1.5, bulk: 0.9, oversized: 1.4
    }
    const multiplier = typeMultipliers[form.cargo_type] || 1.0
    return Math.round(basePrice * multiplier)
  }, [form.distance_km, form.cargo_weight_kg, form.cargo_volume_m3, form.cargo_type])

  // ============================================================================
  // RENDER STEPS
  // ============================================================================

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white">📍 მარშრუტი</h2>
                <p className="text-xs text-gray-400 mt-0.5">შეავსეთ ატვირთვის და ჩატვირთვის ინფორმაცია</p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <span className="text-lg">🚛</span>
                <div>
                  <p className="text-[10px] text-gray-400">მანძილი</p>
                  <p className="text-sm font-bold text-blue-400">{form.distance_km || '-'} კმ</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-blue-500/30 transition-all">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-700">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/30">📤</div>
                  <div>
                    <h3 className="text-sm font-bold text-white">ატვირთვა</h3>
                    <p className="text-[10px] text-gray-400">Pickup Location</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <FormField label="მისამართი" hint="სრული მისამართი" required textarea icon="📍" value={form.pickup_address} onChange={(e: any) => updateField('pickup_address', e.target.value)} />
                  <div className="grid grid-cols-2 gap-2">
                    <FormField label="თარიღი" type="date" required icon="📅" value={form.pickup_date} onChange={(e: any) => updateField('pickup_date', e.target.value)} />
                    <FormField label="დრო" type="time" icon="⏰" value={form.pickup_time} onChange={(e: any) => updateField('pickup_time', e.target.value)} />
                  </div>
                  <FormField label="საკონტაქტო პირი" hint="სახელი გვარი" required icon="👤" value={form.pickup_contact_person} onChange={(e: any) => updateField('pickup_contact_person', e.target.value)} />
                  <FormField label="ტელეფონი" hint="+995..." required icon="📞" value={form.pickup_phone} onChange={(e: any) => updateField('pickup_phone', e.target.value)} />
                </div>
              </div>

              <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-emerald-500/30 transition-all">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-700">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">📥</div>
                  <div>
                    <h3 className="text-sm font-bold text-white">ჩატვირთვა</h3>
                    <p className="text-[10px] text-gray-400">Delivery Location</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <FormField label="მისამართი" hint="სრული მისამართი" required textarea icon="📍" value={form.delivery_address} onChange={(e: any) => updateField('delivery_address', e.target.value)} />
                  <div className="grid grid-cols-2 gap-2">
                    <FormField label="თარიღი" type="date" icon="📅" value={form.delivery_date} onChange={(e: any) => updateField('delivery_date', e.target.value)} />
                    <FormField label="დრო" type="time" icon="⏰" value={form.delivery_time} onChange={(e: any) => updateField('delivery_time', e.target.value)} />
                  </div>
                  <FormField label="მიმღები პირი" hint="ვინ იღებს" required icon="👤" value={form.delivery_contact_person} onChange={(e: any) => updateField('delivery_contact_person', e.target.value)} />
                  <FormField label="ტელეფონი" hint="+995..." required icon="📞" value={form.delivery_phone} onChange={(e: any) => updateField('delivery_phone', e.target.value)} />
                </div>
              </div>
            </div>
            
            {isCalculatingDistance && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-blue-400 font-medium">მანძილის გამოთვლა...</span>
              </div>
            )}
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white">📦 ტვირთი</h2>
                <p className="text-xs text-gray-400 mt-0.5">ტვირთის დეტალური ინფორმაცია</p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-lg">
                <span className="text-lg">📊</span>
                <div>
                  <p className="text-[10px] text-gray-400">წონა</p>
                  <p className="text-sm font-bold text-violet-400">{form.cargo_weight_kg || '-'} კგ</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-700">
                <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-violet-500/30">📋</div>
                <div>
                  <h3 className="text-sm font-bold text-white">ძირითადი ინფორმაცია</h3>
                  <p className="text-[10px] text-gray-400">Cargo Details</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-1.5">
                    <span>📝</span>
                    აღწერა <span className="text-red-400">*</span>
                  </label>
                  <textarea 
                    value={form.cargo_description || ''} 
                    onChange={(e: any) => updateField('cargo_description', e.target.value)} 
                    placeholder="რას გადავზიდავთ? (მაგ: ელექტრონიკა, ავეჯი, საკვები...)"
                    rows={5}
                    className={`w-full px-3 py-2 bg-gray-800/50 border rounded-lg text-xs text-white placeholder-gray-500 outline-none focus:ring-1 transition-all resize-none hover:border-gray-600 ${
                      form.cargo_description?.trim() 
                        ? 'border-emerald-500/40 focus:border-emerald-500/60 focus:ring-emerald-500/20' 
                        : 'border-red-500/40 focus:border-red-500/60 focus:ring-red-500/20'
                    }`}
                  />
                </div>
                
                <div className="space-y-2">
                  <FormField 
                    label="ტიპი" 
                    icon="🏷️"
                    options={[
                      { value: 'standard', label: '📦 სტანდარტული' }, 
                      { value: 'fragile', label: '💎 მყიფე' }, 
                      { value: 'adr', label: '⚠️ ADR' }, 
                      { value: 'refrigerated', label: '❄️ მაცივარი' }, 
                      { value: 'bulk', label: '🌾 ნაყარი' },
                      { value: 'oversized', label: '📏 დიდი ზომის' }
                    ]} 
                    value={form.cargo_type} 
                    onChange={(e: any) => updateField('cargo_type', e.target.value)} 
                  />
                  <FormField 
                    label="შეფუთვა" 
                    icon="📦"
                    options={[
                      { value: 'box', label: '📦 ყუთი' }, 
                      { value: 'pallet', label: '🪵 პალიტი' }, 
                      { value: 'bag', label: '🛍️ ტომარა' }, 
                      { value: 'bulk', label: '🌾 ნაყარი' },
                      { value: 'other', label: '📋 სხვა' }
                    ]} 
                    value={form.packaging_type} 
                    onChange={(e: any) => updateField('packaging_type', e.target.value)} 
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-700">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/30">⚖️</div>
                  <div>
                    <h3 className="text-sm font-bold text-white">ფიზიკური პარამეტრები</h3>
                    <p className="text-[10px] text-gray-400">Weight & Volume</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <FormField label="წონა" type="number" hint="500" suffix="კგ" required icon="⚖️" value={form.cargo_weight_kg} onChange={(e: any) => updateField('cargo_weight_kg', e.target.value)} />
                  <FormField label="მოცულობა" type="number" hint="12.5" suffix="m³" icon="📐" value={form.cargo_volume_m3} onChange={(e: any) => updateField('cargo_volume_m3', e.target.value)} />
                  <FormField label="რაოდენობა" type="number" hint="10" suffix="ცალი" icon="🔢" value={form.places_count} onChange={(e: any) => updateField('places_count', e.target.value)} />
                </div>
                
                <div className="mt-3">
                  <FormField label="ღირებულება" type="number" hint="10000" suffix="₾" icon="💎" value={form.declared_value} onChange={(e: any) => updateField('declared_value', e.target.value)} />
                </div>
              </div>

              <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-700">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">📏</div>
                  <div>
                    <h3 className="text-sm font-bold text-white">განზომილებები</h3>
                    <p className="text-[10px] text-gray-400">Dimensions</p>
                  </div>
                </div>
                
                <div className="flex items-end gap-1.5 mb-3">
                  <div className="flex-1">
                    <FormField label="სიგრძე" type="number" hint="0" value={form.cargo_length_m} onChange={(e: any) => updateField('cargo_length_m', e.target.value)} />
                  </div>
                  <span className="text-gray-500 text-sm font-bold pb-2">×</span>
                  <div className="flex-1">
                    <FormField label="სიგანე" type="number" hint="0" value={form.cargo_width_m} onChange={(e: any) => updateField('cargo_width_m', e.target.value)} />
                  </div>
                  <span className="text-gray-500 text-sm font-bold pb-2">×</span>
                  <div className="flex-1">
                    <FormField label="სიმაღლე" type="number" hint="0" value={form.cargo_height_m} onChange={(e: any) => updateField('cargo_height_m', e.target.value)} />
                  </div>
                  <span className="text-[10px] font-medium text-gray-500 pb-2">მ</span>
                </div>
                
                {form.cargo_length_m && form.cargo_width_m && form.cargo_height_m && (
                  <div className="p-2 bg-violet-500/10 border border-violet-500/20 rounded-lg">
                    <p className="text-xs text-violet-400">
                      📊 <strong>მოცულობა:</strong> <span className="font-bold text-violet-300">{(parseFloat(form.cargo_length_m) * parseFloat(form.cargo_width_m) * parseFloat(form.cargo_height_m)).toFixed(2)} m³</span>
                    </p>
                  </div>
                )}
                
                <div className="mt-3">
                  <FormField label="დაბრუნებადი ტარა?" icon="🔄" checkbox value={form.returnable_packaging} onChange={(e: any) => updateField('returnable_packaging', e.target.checked)} />
                </div>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white">💰 ფინანსები</h2>
                <p className="text-xs text-gray-400 mt-0.5">ფასი და გადახდის პირობები</p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <span className="text-lg">💵</span>
                <div>
                  <p className="text-[10px] text-gray-400">სულ</p>
                  <p className="text-sm font-bold text-emerald-400">{form.price || '0'} {form.currency}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl">
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-700">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">💳</div>
                    <div>
                      <h3 className="text-sm font-bold text-white">გადახდის დეტალები</h3>
                      <p className="text-[10px] text-gray-400">Payment Information</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FormField label="ფასი" type="number" required hint="მაგ: 250" icon="💰" value={form.price} onChange={(e: any) => updateField('price', e.target.value)} />
                    <FormField label="ვალუტა" required icon="💵" options={[{ value: 'GEL', label: '🇬🇪 GEL' }, { value: 'USD', label: '🇺🇸 USD' }, { value: 'EUR', label: '🇪🇺 EUR' }]} value={form.currency} onChange={(e: any) => updateField('currency', e.target.value)} />
                    <FormField label="გადახდა" icon="💳" options={[{ value: 'prepaid', label: '💸 წინასწარ' }, { value: 'on_delivery', label: '📦 მიწოდებისას' }, { value: 'invoice', label: '🧾 ინვოისით' }]} value={form.payment_terms} onChange={(e: any) => updateField('payment_terms', e.target.value)} />
                    <div className="flex items-center pt-6">
                      <FormField label="ინვოისი სჭირდება?" icon="🧾" checkbox value={form.invoice_needed} onChange={(e: any) => updateField('invoice_needed', e.target.checked)} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {form.distance_km && (
                  <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg shadow-blue-500/25 text-white">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">🗺️</div>
                      <div>
                        <p className="text-xs font-semibold">მანძილი</p>
                        <p className="text-[10px] text-blue-100">ავტომატური</p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold">{form.distance_km} <span className="text-sm font-normal">კმ</span></p>
                  </div>
                )}

                {/* ✅ განახლებული რეკომენდებული ფასის ბარათი */}
                {suggestedPrice > 0 && (
                  <div className="p-4 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg shadow-violet-500/25 text-white relative overflow-hidden">
                    {/* ბეჯი ზედა მარჯვენა კუთხეში */}
                    <div className="absolute top-2 right-2 px-2 py-1 bg-white/20 backdrop-blur-sm rounded-md">
                      <span className="text-[10px] font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                        ავტომატური
                      </span>
                    </div>

                    <div className="flex items-start gap-3 mb-3 pr-20">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm shrink-0">
                        <span className="text-xl">💡</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold">სისტემის შეთავაზება</p>
                        <p className="text-[10px] text-violet-100 mt-0.5">დააწკაპუნე გამოსაყენებლად</p>
                      </div>
                    </div>

                    {/* ფასი და ღილაკი */}
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-3xl font-bold">{suggestedPrice}</p>
                        <p className="text-sm text-violet-100">₾</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateField('price', suggestedPrice.toString())}
                        className="px-4 py-2.5 bg-white text-violet-600 rounded-xl text-xs font-bold transition-all hover:bg-violet-50 hover:scale-105 active:scale-95 shadow-lg flex items-center gap-1.5 group"
                      >
                        <span className="text-lg group-hover:scale-110 transition-transform">✓</span>
                        <span>გამოყენება</span>
                      </button>
                    </div>

                    {/* ქვედა ტექსტი */}
                    <div className="mt-3 pt-3 border-t border-white/20">
                      <p className="text-[10px] text-violet-100 flex items-center gap-1">
                        <span className="text-[10px]">ℹ️</span>
                        მანძილსა და წონაზე დაყრდნობით
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white">👤 დამკვეთი</h2>
                <p className="text-xs text-gray-400 mt-0.5">კლიენტის ინფორმაცია</p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <span className="text-lg">👤</span>
                <div>
                  <p className="text-[10px] text-gray-400">ტიპი</p>
                  <p className="text-xs font-bold text-orange-400">{form.client_type === 'private' ? 'ფიზიკური' : 'იურიდიული'}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => updateField('client_type', 'private')}
                className={`relative p-4 rounded-xl border-2 transition-all text-left hover:shadow-lg ${
                  form.client_type === 'private'
                    ? 'border-violet-500 bg-gradient-to-br from-violet-500/10 to-purple-500/10 shadow-lg'
                    : 'border-gray-700 bg-gray-800/50 hover:border-violet-500/50'
                }`}
              >
                {form.client_type === 'private' && (
                  <div className="absolute top-3 right-3 w-6 h-6 bg-violet-500 rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg ${
                    form.client_type === 'private' ? 'bg-gradient-to-br from-violet-500 to-purple-600' : 'bg-gray-700'
                  }`}>👤</div>
                  <div className="flex-1">
                    <h4 className={`text-sm font-bold ${form.client_type === 'private' ? 'text-white' : 'text-gray-300'}`}>ფიზიკური პირი</h4>
                    <p className="text-xs text-gray-400 mt-0.5">პირადი შეკვეთები</p>
                    <div className="mt-2">
                      {form.client_name && form.client_personal_id ? (
                        <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">✅ შევსებულია</span>
                      ) : (
                        <span className="text-[10px] px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-medium">⚠️ შეავსეთ</span>
                      )}
                    </div>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => updateField('client_type', 'company')}
                className={`relative p-4 rounded-xl border-2 transition-all text-left hover:shadow-lg ${
                  form.client_type === 'company'
                    ? 'border-violet-500 bg-gradient-to-br from-violet-500/10 to-purple-500/10 shadow-lg'
                    : 'border-gray-700 bg-gray-800/50 hover:border-violet-500/50'
                }`}
              >
                {form.client_type === 'company' && (
                  <div className="absolute top-3 right-3 w-6 h-6 bg-violet-500 rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg ${
                    form.client_type === 'company' ? 'bg-gradient-to-br from-violet-500 to-purple-600' : 'bg-gray-700'
                  }`}>🏢</div>
                  <div className="flex-1">
                    <h4 className={`text-sm font-bold ${form.client_type === 'company' ? 'text-white' : 'text-gray-300'}`}>იურიდიული პირი</h4>
                    <p className="text-xs text-gray-400 mt-0.5">ბიზნეს შეკვეთები</p>
                    <div className="mt-2">
                      {form.client_company_name && form.client_registration_number && form.client_contact_person ? (
                        <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">✅ შევსებულია</span>
                      ) : (
                        <span className="text-[10px] px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-medium">⚠️ შეავსეთ</span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {form.client_type === 'private' && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl">
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-700">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/30">👤</div>
                    <div>
                      <h3 className="text-sm font-bold text-white">ფიზიკური პირის ინფორმაცია</h3>
                      <p className="text-[10px] text-gray-400">Personal Information</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FormField label="სახელი და გვარი" required icon="👤" value={form.client_name} onChange={(e: any) => updateField('client_name', e.target.value)} placeholder="გიორგი ბერიძე" />
                    <FormField label="პირადი ნომერი" required icon="🆔" value={form.client_personal_id} onChange={(e: any) => updateField('client_personal_id', e.target.value)} placeholder="12345678901" />
                  </div>
                </div>

                <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl">
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-700">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">📧</div>
                    <div>
                      <h3 className="text-sm font-bold text-white">საკონტაქტო ინფორმაცია</h3>
                      <p className="text-[10px] text-gray-400">Contact Details</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FormField label="ტელეფონი" required type="tel" icon="📞" value={form.client_phone} onChange={(e: any) => updateField('client_phone', e.target.value)} placeholder="+995 555 123 456" />
                    <FormField label="Email" required type="email" icon="✉️" value={form.client_email} onChange={(e: any) => updateField('client_email', e.target.value)} placeholder="info@company.ge" />
                    <div className="md:col-span-2">
                      <FormField label="მისამართი" required icon="📍" textarea value={form.client_address} onChange={(e: any) => updateField('client_address', e.target.value)} placeholder="თბილისი, რუსთაველის გამზირი 12" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {form.client_type === 'company' && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl">
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-700">
                    <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-violet-500/30">🏢</div>
                    <div>
                      <h3 className="text-sm font-bold text-white">კომპანიის ინფორმაცია</h3>
                      <p className="text-[10px] text-gray-400">Company Information</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FormField label="კომპანიის სახელი" required icon="🏢" value={form.client_company_name} onChange={(e: any) => updateField('client_company_name', e.target.value)} placeholder="შპს ლოჯისტიკა" />
                    <FormField label="საიდენტო კოდი" required icon="🆔" value={form.client_registration_number} onChange={(e: any) => updateField('client_registration_number', e.target.value)} placeholder="123456789" />
                    <FormField label="VAT ნომერი" icon="🧾" value={form.client_vat} onChange={(e: any) => updateField('client_vat', e.target.value)} placeholder="GE123456789" />
                  </div>
                </div>

                <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl">
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-700">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-orange-500/30">👨‍💼</div>
                    <div>
                      <h3 className="text-sm font-bold text-white">საკონტაქტო პირი</h3>
                      <p className="text-[10px] text-gray-400">Contact Person</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FormField label="სახელი და გვარი" required icon="👤" value={form.client_contact_person} onChange={(e: any) => updateField('client_contact_person', e.target.value)} placeholder="გიორგი ბერიძე" />
                    <FormField label="ტელეფონი" required icon="📞" value={form.client_contact_phone} onChange={(e: any) => updateField('client_contact_phone', e.target.value)} placeholder="+995 555 123 456" />
                  </div>
                </div>

                <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl">
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-700">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">📧</div>
                    <div>
                      <h3 className="text-sm font-bold text-white">საკონტაქტო ინფორმაცია</h3>
                      <p className="text-[10px] text-gray-400">Contact Details</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FormField label="ტელეფონი" required type="tel" icon="📞" value={form.client_phone} onChange={(e: any) => updateField('client_phone', e.target.value)} placeholder="+995 555 123 456" />
                    <FormField label="Email" required type="email" icon="✉️" value={form.client_email} onChange={(e: any) => updateField('client_email', e.target.value)} placeholder="info@company.ge" />
                    <div className="md:col-span-2">
                      <FormField label="მისამართი" required icon="📍" textarea value={form.client_address} onChange={(e: any) => updateField('client_address', e.target.value)} placeholder="თბილისი, რუსთაველის გამზირი 12" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )

      case 5:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white">📝 დამატებითი</h2>
                <p className="text-xs text-gray-400 mt-0.5">დამატებითი ინფორმაცია და მოთხოვნები</p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-500/10 border border-pink-500/20 rounded-lg">
                <span className="text-lg">🔧</span>
                <div>
                  <p className="text-[10px] text-gray-400">დამატებითი</p>
                  <p className="text-xs font-bold text-pink-400">
                    {[form.needs_tail_lift, form.needs_straps, form.needs_bricklaying, form.needs_two_cargo_handlers].filter(Boolean).length} პარამეტრი
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-700">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/30">🚛</div>
                  <div>
                    <h3 className="text-sm font-bold text-white">ტრანსპორტი</h3>
                    <p className="text-[10px] text-gray-400">Transport Type</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <FormField label="ტრანსპორტის ტიპი" icon="🚛" options={[
                    { value: 'road', label: '🚛 სახმელეთო' },
                    { value: 'air', label: '✈️ საჰაერო' },
                    { value: 'sea', label: '🚢 საზღვაო' },
                    { value: 'rail', label: '🚂 რკინიგზა' }
                  ]} value={form.transport_type} onChange={(e: any) => updateField('transport_type', e.target.value)} />
                  <FormField label="კონტეინერის ნომერი" hint="თუ აქვს" icon="📦" value={form.container_number} onChange={(e: any) => updateField('container_number', e.target.value)} />
                </div>
              </div>

              <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-700">
                  <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-violet-500/30">📝</div>
                  <div>
                    <h3 className="text-sm font-bold text-white">შენიშვნები</h3>
                    <p className="text-[10px] text-gray-400">Notes</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <FormField label="შიდა შენიშვნა" hint="დისპეტჩერისთვის" icon="📋" textarea value={form.internal_notes} onChange={(e: any) => updateField('internal_notes', e.target.value)} />
                  <FormField label="სპეციალური მოთხოვნები" hint="მაგ: ლიფტი, ღვედები..." icon="⚠️" textarea value={form.special_requirements} onChange={(e: any) => updateField('special_requirements', e.target.value)} />
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-700">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">🔧</div>
                <div>
                  <h3 className="text-sm font-bold text-white">საჭირო აღჭურვილობა</h3>
                  <p className="text-[10px] text-gray-400">Required Equipment</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <FormField checkbox icon="🔽" label="ლიფტი" value={form.needs_tail_lift} onChange={(e: any) => updateField('needs_tail_lift', e.target.checked)} />
                <FormField checkbox icon="🔗" label="ღვედები" value={form.needs_straps} onChange={(e: any) => updateField('needs_straps', e.target.checked)} />
                <FormField checkbox icon="🧱" label="აგურის დალაგება" value={form.needs_bricklaying} onChange={(e: any) => updateField('needs_bricklaying', e.target.checked)} />
                <FormField checkbox icon="👥" label="2 მზიდავი" value={form.needs_two_cargo_handlers} onChange={(e: any) => updateField('needs_two_cargo_handlers', e.target.checked)} />
              </div>
            </div>
          </div>
        )

      case 6:
        return (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl shadow-xl shadow-green-500/30 mb-3">
                <span className="text-3xl">✅</span>
              </div>
              <h2 className="text-2xl font-bold text-white">შეკვეთის დასტური</h2>
              <p className="text-xs text-gray-400 mt-1">გადაამოწმეთ ყველა ინფორმაცია</p>
            </div>
            
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-700">
                  <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-violet-500/30">👤</div>
                  <div>
                    <h3 className="text-sm font-bold text-white">დამკვეთი</h3>
                    <p className="text-[10px] text-gray-400">Client Information</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div><p className="text-gray-400 text-xs mb-0.5">ტიპი</p><p className="text-white font-medium">{form.client_type === 'private' ? '👤 ფიზიკური პირი' : '🏢 იურიდიული პირი'}</p></div>
                  <div><p className="text-gray-400 text-xs mb-0.5">{form.client_type === 'private' ? 'სახელი' : 'კომპანია'}</p><p className="text-white font-medium">{form.client_type === 'private' ? form.client_name : form.client_company_name}</p></div>
                  <div><p className="text-gray-400 text-xs mb-0.5">ტელეფონი</p><p className="text-white font-medium">{form.client_phone}</p></div>
                  <div><p className="text-gray-400 text-xs mb-0.5">Email</p><p className="text-white font-medium truncate">{form.client_email}</p></div>
                  <div className="md:col-span-2"><p className="text-gray-400 text-xs mb-0.5">მისამართი</p><p className="text-white font-medium">{form.client_address}</p></div>
                </div>
              </div>

              <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-700">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/30">📍</div>
                  <div>
                    <h3 className="text-sm font-bold text-white">მარშრუტი</h3>
                    <p className="text-[10px] text-gray-400">Route Information</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-400 text-xs mb-0.5">📤 ატვირთვა</p>
                    <p className="text-white font-medium">{form.pickup_address}</p>
                    <p className="text-gray-400 mt-1.5 text-xs">{form.pickup_date} {form.pickup_time && `• ${form.pickup_time}`}</p>
                    <p className="text-gray-400 text-xs">{form.pickup_contact_person} • {form.pickup_phone}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-0.5">📥 ჩატვირთვა</p>
                    <p className="text-white font-medium">{form.delivery_address}</p>
                    <p className="text-gray-400 mt-1.5 text-xs">{form.delivery_date} {form.delivery_time && `• ${form.delivery_time}`}</p>
                    <p className="text-gray-400 text-xs">{form.delivery_contact_person} • {form.delivery_phone}</p>
                  </div>
                </div>
                {form.distance_km && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <p className="text-gray-400 text-xs mb-0.5">🗺️ მანძილი</p>
                    <p className="text-lg font-bold text-violet-400">{form.distance_km} კმ</p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-700">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">💰</div>
                  <div>
                    <h3 className="text-sm font-bold text-white">ფინანსები</h3>
                    <p className="text-[10px] text-gray-400">Financial Details</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div><p className="text-gray-400 text-xs mb-0.5">ფასი</p><p className="text-lg font-bold text-violet-400">{form.price} {form.currency}</p></div>
                  <div><p className="text-gray-400 text-xs mb-0.5">გადახდა</p><p className="text-white font-medium">{form.payment_terms || '–'}</p></div>
                  <div><p className="text-gray-400 text-xs mb-0.5">ინვოისი</p><p className="text-white font-medium">{form.invoice_needed ? '✅ კი' : '❌ არა'}</p></div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (showSuccessPopup) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
          <div className="p-6 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/40 animate-bounce">
              <span className="text-4xl">✅</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-1">შეკვეთა წარმატებით შეიქმნა!</h3>
            <p className="text-xs text-gray-400 mb-4">თქვენი შეკვეთა დაემატა სისტემაში</p>
            <div className="bg-gray-800/50 rounded-xl p-4 mb-4 text-left space-y-2 border border-gray-700">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">👤 დამკვეთი:</span>
                <span className="text-white font-medium truncate ml-2">{form.client_type === 'private' ? form.client_name : form.client_company_name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">💰 ფასი:</span>
                <span className="text-violet-400 font-bold">{form.price} {form.currency}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowSuccessPopup(false)} className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-xs font-medium text-white transition-all border border-gray-700">დახურვა</button>
              <button type="button" onClick={handleNewOrder} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 rounded-xl text-xs font-medium text-white transition-all shadow-lg shadow-violet-500/30">🔄 ახალი</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-6xl mx-auto p-4 space-y-4">
        {/* Stepper */}
        <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-4 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="shrink-0">
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <span className="text-2xl">📦</span>
                ახალი შეკვეთა
              </h3>
              <p className="text-[10px] text-gray-400 mt-0.5">ნაბიჯი {currentStep} / {STEPS.length} — {STEPS[currentStep - 1].title}</p>
            </div>
            
            <div className="flex-1 flex items-center gap-1.5 overflow-x-auto">
              {STEPS.map((step, i) => {
                const isCompleted = currentStep > step.id
                const isCurrent = currentStep === step.id
                return (
                  <div key={step.id} className="flex items-center flex-1 min-w-[50px]">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold border-2 transition-all ${
                        isCurrent 
                          ? `bg-gradient-to-br ${step.color} border-transparent text-white shadow-lg scale-105`
                          : isCompleted
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'bg-gray-800 border-gray-700 text-gray-400'
                      }`}>
                        {isCompleted ? '✓' : <span className="flex items-center justify-center w-full h-full text-xs">{step.icon}</span>}
                      </div>
                      <span className={`text-[9px] mt-1 font-medium whitespace-nowrap ${isCurrent ? 'text-white' : 'text-gray-400'}`}>{step.title}</span>
                    </div>
                    {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-1 rounded-full ${currentStep > step.id ? 'bg-emerald-500' : 'bg-gray-800'}`} />}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {errors.length > 0 && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-xs font-semibold text-red-400 mb-1.5">⚠️ შეავსე სავალდებულო ველები:</p>
            <ul className="text-[10px] text-red-300 space-y-0.5">{errors.map((err, i) => <li key={i}>• {err}</li>)}</ul>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center justify-between">
            <span>❌ {error}</span>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-300 font-bold px-2 py-1 rounded-lg hover:bg-red-500/20">✕</button>
          </div>
        )}

        <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-5 shadow-2xl">
          {renderStepContent()}
        </div>

        <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-4 shadow-2xl">
          <div className="flex justify-between items-center">
            <button 
              type="button" 
              onClick={handleBack} 
              disabled={currentStep === 1} 
              className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all ${
                currentStep === 1 
                  ? 'text-gray-600 cursor-not-allowed' 
                  : 'text-gray-300 hover:bg-gray-800 border border-gray-700'
              }`}
            >
              ← უკან
            </button>
            
            <div className="flex gap-2">
              {currentStep < STEPS.length ? (
                <button 
                  type="button" 
                  onClick={handleNext} 
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 rounded-xl text-xs font-bold text-white transition-all shadow-lg shadow-blue-500/25 hover:scale-105 active:scale-95"
                >
                  შემდეგი →
                </button>
              ) : (
                <button 
                  type="button" 
                  onClick={handleSubmit} 
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xs font-bold text-white transition-all shadow-lg shadow-emerald-500/25 hover:scale-105 active:scale-95"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block mr-1.5"></div>
                      იქმნება...
                    </>
                  ) : (
                    <>✅ შეკვეთის შექმნა</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}