'use client'
import { useState, useEffect, FormEvent, useMemo } from 'react'
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
// 🧩 Helper Components
// ============================================================================

const FormField = ({ 
  label, hint, required, type = 'text', value, onChange, options, textarea, checkbox, className = '', suffix = ''
}: any) => {
  if (checkbox) {
    return (
      <div className={`flex items-center gap-2 p-3 bg-gray-700/30 rounded-lg border border-gray-600 ${className}`}>
        <input type="checkbox" checked={!!value} onChange={onChange} className="w-4 h-4 accent-blue-500 rounded" />
        <label className="text-xs text-gray-300 select-none">{label}</label>
      </div>
    )
  }
  return (
    <div className={textarea ? "col-span-1 md:col-span-2" : className}>
      <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wide">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {textarea ? (
        <textarea rows={3} value={value || ''} onChange={onChange} placeholder={hint} className="w-full px-3 py-2.5 bg-gray-800/60 border border-gray-600 rounded-lg text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition resize-none placeholder-gray-500" />
      ) : options ? (
        <select value={value || ''} onChange={onChange} className="w-full px-3 py-2.5 bg-gray-800/60 border border-gray-600 rounded-lg text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition">
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
            className={`w-full ${suffix ? 'pr-12' : ''} px-3 py-2.5 bg-gray-800/60 border border-gray-600 rounded-lg text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition placeholder-gray-500`} 
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-gray-400 pointer-events-none">
              {suffix}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

const SectionTitle = ({ title, icon }: { title: string, icon: string }) => (
  <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4 pb-2 border-b border-gray-700/50">
    <span className="text-base">{icon}</span>
    {title}
  </h3>
)

// ============================================================================
// 📊 STEP CONFIGURATION
// ============================================================================

const STEPS = [
  { id: 1, title: 'მარშრუტი', icon: '📍', color: 'red' },
  { id: 2, title: 'ტვირთი', icon: '📦', color: 'yellow' },
  { id: 3, title: 'ფინანსები', icon: '💰', color: 'blue' },
  { id: 4, title: 'დამკვეთი', icon: '👤', color: 'purple' },
  { id: 5, title: 'დამატებითი', icon: '📝', color: 'green' },
  { id: 6, title: 'დასტური', icon: '✅', color: 'emerald' },
]

const COLOR_MAP: Record<string, string> = {
  red: 'text-red-400 bg-red-500/20 border-red-500/50',
  yellow: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50',
  blue: 'text-blue-400 bg-blue-500/20 border-blue-500/50',
  purple: 'text-purple-400 bg-purple-500/20 border-purple-500/50',
  green: 'text-green-400 bg-green-500/20 border-green-500/50',
  emerald: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/50',
  gray: 'text-gray-400 bg-gray-700/50 border-gray-600',
}

const LINE_COLOR_MAP: Record<string, string> = {
  red: 'bg-red-500/50',
  yellow: 'bg-yellow-500/50',
  blue: 'bg-blue-500/50',
  purple: 'bg-purple-500/50',
  green: 'bg-green-500/50',
  emerald: 'bg-emerald-500/50',
}

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
    // დამკვეთის ტიპის მიხედვით ვალიდაცია
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
//  INITIAL FORM
// ============================================================================

const INITIAL_FORM = {
  // მარშრუტი
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
  
  // ტვირთი
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
  
  // ფინანსები
  price: '',
  currency: 'GEL',
  payment_terms: '',
  invoice_needed: false,
  
  // დამკვეთი
  client_type: 'private', // 'private' | 'company'
  // ფიზიკური პირი
  client_name: '',
  client_personal_id: '',
  // იურიდიული პირი
  client_company_name: '',
  client_registration_number: '',
  client_vat: '',
  // საერთო
  client_phone: '',
  client_email: '',
  client_address: '',
  client_contact_person: '',
  client_contact_phone: '',
  
  // დამატებითი
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
// 📦 NEW ORDER TAB - CLIENT VERSION
// ============================================================================

export default function NewOrderTab({ onCreateOrder }: any) {
  const [currentStep, setCurrentStep] = useState(1)
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState<string[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)

  // 🔐 მომხმარებლის ინფორმაცია + პროფილის ჩატვირთვა
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
          
          // ავტომატურად შევავსოთ დამკვეთის ინფორმაცია პროფილიდან
          setForm(prev => ({
            ...prev,
            client_type: profile.client_type || 'private',
            // ფიზიკური პირი
            client_name: profile.full_name || '',
            client_personal_id: profile.client_type === 'private' ? (profile.tax_id || '') : '',
            // იურიდიული პირი
            client_company_name: profile.company_name || '',
            client_registration_number: profile.client_type === 'company' ? (profile.tax_id || '') : '',
            client_vat: profile.vat_number || '',
            client_contact_person: profile.contact_person || '',
            client_contact_phone: profile.contact_phone || '',
            // საერთო
            client_phone: profile.phone || '',
            client_email: profile.email || user.email || '',
            client_address: profile.address || '',
          }))
        }
      }
    }
    loadUser()
  }, [])

  // 🗺️ მანძილის ავტომატური გამოთვლა
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

  // 💾 შეკვეთის შექმნა
  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      if (!currentUser) throw new Error('მომხმარებელი არ არის ავტორიზებული')

      const buildTimestamp = (date: string, time: string): string | null => {
        if (!date) return null
        const t = time || '00:00'
        return new Date(`${date}T${t}:00`).toISOString()
      }

      const newOrder = {
        // ძირითადი
        client_email: currentUser.email,
        tracking_code: `LOG-${Date.now().toString().slice(-6)}`,
        status: 'pending',
        created_at: new Date().toISOString(),
        created_by: currentUser.id,
        
        // დამკვეთის ინფორმაცია
        client_type: form.client_type,
        client_name: form.client_type === 'private' ? form.client_name : form.client_company_name,
        client_personal_id: form.client_type === 'private' ? form.client_personal_id : null,
        client_registration_number: form.client_type === 'company' ? form.client_registration_number : null,
        client_vat: form.client_type === 'company' ? (form.client_vat || null) : null,
        client_phone: form.client_phone,
        client_address: form.client_address,
        
        // მარშრუტი
        pickup_address: form.pickup_address,
        pickup_contact_person: form.pickup_contact_person,
        pickup_phone: form.pickup_phone,
        scheduled_pickup_date: buildTimestamp(form.pickup_date, form.pickup_time),
        
        delivery_address: form.delivery_address,
        delivery_contact_person: form.delivery_contact_person,
        delivery_phone: form.delivery_phone,
        scheduled_delivery_date: buildTimestamp(form.delivery_date, form.delivery_time),
        
        // ტვირთი
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
        
        // ფინანსები
        price: parseFloat(form.price) || null,
        currency: form.currency,
        payment_terms: form.payment_terms || null,
        invoice_needed: form.invoice_needed,
        
        // დამატებითი
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

      setSuccess('✅ შეკვეთა წარმატებით შეიქმნა!')
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
    setSuccess('')
  }

  // 💰 ფასის ავტომატური გამოთვლა
  const suggestedPrice = useMemo(() => {
    const distance = parseFloat(form.distance_km) || 0
    const weight = parseFloat(form.cargo_weight_kg) || 0
    const volume = parseFloat(form.cargo_volume_m3) || 0
    
    if (distance === 0 && weight === 0) return 0
    
    const basePrice = (distance * 1.5) + (weight * 0.3) + (volume * 15) + 50
    
    const typeMultipliers: Record<string, number> = {
      standard: 1.0,
      fragile: 1.3,
      adr: 1.8,
      refrigerated: 1.5,
      bulk: 0.9,
      oversized: 1.4
    }
    const multiplier = typeMultipliers[form.cargo_type] || 1.0
    
    return Math.round(basePrice * multiplier)
  }, [form.distance_km, form.cargo_weight_kg, form.cargo_volume_m3, form.cargo_type])

  // ============================================================================
  // RENDER STEPS
  // ============================================================================

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // მარშრუტი
        return (
          <div className="space-y-5">
            <SectionTitle title="📍 მარშრუტი" icon="" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-3 p-4 bg-gray-800/30 rounded-xl border border-gray-700/30">
                <h4 className="text-[10px] font-bold text-red-400 uppercase tracking-wide flex items-center gap-1">📤 ატვირთვა</h4>
                <FormField label="📍 მისამართი" hint="სრული მისამართი" required textarea value={form.pickup_address} onChange={(e: any) => updateField('pickup_address', e.target.value)} />
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="📅 თარიღი" type="date" required value={form.pickup_date} onChange={(e: any) => updateField('pickup_date', e.target.value)} />
                  <FormField label="⏰ დრო" type="time" value={form.pickup_time} onChange={(e: any) => updateField('pickup_time', e.target.value)} />
                </div>
                <FormField label=" საკონტაქტო პირი" hint="სახელი გვარი" required value={form.pickup_contact_person} onChange={(e: any) => updateField('pickup_contact_person', e.target.value)} />
                <FormField label="📞 ტელეფონი" hint="+995..." required value={form.pickup_phone} onChange={(e: any) => updateField('pickup_phone', e.target.value)} />
              </div>
              <div className="space-y-3 p-4 bg-gray-800/30 rounded-xl border border-gray-700/30">
                <h4 className="text-[10px] font-bold text-green-400 uppercase tracking-wide flex items-center gap-1">📥 ჩატვირთვა</h4>
                <FormField label="🏁 მისამართი" hint="სრული მისამართი" required textarea value={form.delivery_address} onChange={(e: any) => updateField('delivery_address', e.target.value)} />
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="📅 თარიღი" type="date" value={form.delivery_date} onChange={(e: any) => updateField('delivery_date', e.target.value)} />
                  <FormField label=" დრო" type="time" value={form.delivery_time} onChange={(e: any) => updateField('delivery_time', e.target.value)} />
                </div>
                <FormField label="👤 მიმღები პირი" hint="ვინ იღებს" required value={form.delivery_contact_person} onChange={(e: any) => updateField('delivery_contact_person', e.target.value)} />
                <FormField label=" ტელეფონი" hint="+995..." required value={form.delivery_phone} onChange={(e: any) => updateField('delivery_phone', e.target.value)} />
              </div>
            </div>
            
            {isCalculatingDistance && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-blue-400">მანძილის გამოთვლა...</span>
              </div>
            )}
            
            {form.distance_km && !isCalculatingDistance && (
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-xs text-green-400 flex items-center gap-2">
                  ✅ მანძილი ავტომატურად გამოითვალა: <strong>{form.distance_km} კმ</strong>
                </p>
              </div>
            )}
          </div>
        )

      case 2: // ტვირთი
        return (
          <div className="space-y-4">
            <SectionTitle title="📦 ტვირთი" icon="📦" />

            <div className="p-4 bg-gray-800/30 rounded-xl border border-gray-700/30 space-y-4">
              <h4 className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1 h-3 bg-yellow-400 rounded-full"></span>
                ძირითადი ინფორმაცია
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                <div className="md:col-span-2 flex flex-col">
                  <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wide">
                    📦 აღწერა <span className="text-red-500">*</span>
                  </label>
                  <textarea 
                    value={form.cargo_description || ''} 
                    onChange={(e: any) => updateField('cargo_description', e.target.value)} 
                    placeholder="რას გადავზიდავთ? (მაგ: ელექტრონიკა, ავეჯი, საკვები...)"
                    className="flex-1 w-full px-3 py-2.5 bg-gray-800/60 border border-gray-600 rounded-lg text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition resize-none placeholder-gray-500"
                  />
                </div>
                
                <div className="flex flex-col justify-between space-y-3">
                  <FormField 
                    label="🏷️ ტიპი" 
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
                    label=" შეფუთვა" 
                    options={[
                      { value: 'box', label: ' ყუთი' }, 
                      { value: 'pallet', label: '🪵 პალიტი' }, 
                      { value: 'bag', label: '🛍️ ტომარა' }, 
                      { value: 'bulk', label: ' ნაყარი' },
                      { value: 'other', label: '📋 სხვა' }
                    ]} 
                    value={form.packaging_type} 
                    onChange={(e: any) => updateField('packaging_type', e.target.value)} 
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-800/30 rounded-xl border border-gray-700/30 space-y-3">
                <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1 h-3 bg-blue-400 rounded-full"></span>
                  ფიზიკური პარამეტრები
                </h4>
                
                <div className="grid grid-cols-3 gap-2">
                  <FormField label="⚖️ წონა" type="number" hint="500" suffix="კგ" required value={form.cargo_weight_kg} onChange={(e: any) => updateField('cargo_weight_kg', e.target.value)} />
                  <FormField label="📐 მოცულობა" type="number" hint="12.5" suffix="m³" value={form.cargo_volume_m3} onChange={(e: any) => updateField('cargo_volume_m3', e.target.value)} />
                  <FormField label="🔢 ერთეულები" type="number" hint="10" suffix="ცალი" value={form.places_count} onChange={(e: any) => updateField('places_count', e.target.value)} />
                </div>
                
                <FormField label="💎 ღირებულება (დაზღვევისთვის)" type="number" hint="10000" suffix="₾" value={form.declared_value} onChange={(e: any) => updateField('declared_value', e.target.value)} />
              </div>

              <div className="p-4 bg-gray-800/30 rounded-xl border border-gray-700/30 space-y-3">
                <h4 className="text-[10px] font-bold text-green-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1 h-3 bg-green-400 rounded-full"></span>
                  განზომილებები <span className="text-gray-500 normal-case">(სურვილისამებრ)</span>
                </h4>
                
                <div className="flex items-end gap-1">
                  <div className="flex-1">
                    <FormField label="↔️ სიგრძე" type="number" hint="0" value={form.cargo_length_m} onChange={(e: any) => updateField('cargo_length_m', e.target.value)} />
                  </div>
                  <span className="text-gray-500 text-lg font-bold pb-2.5">×</span>
                  <div className="flex-1">
                    <FormField label="↕️ სიგანე" type="number" hint="0" value={form.cargo_width_m} onChange={(e: any) => updateField('cargo_width_m', e.target.value)} />
                  </div>
                  <span className="text-gray-500 text-lg font-bold pb-2.5">×</span>
                  <div className="flex-1">
                    <FormField label="↕️ სიმაღლე" type="number" hint="0" value={form.cargo_height_m} onChange={(e: any) => updateField('cargo_height_m', e.target.value)} />
                  </div>
                  <span className="text-[10px] font-semibold text-gray-400 pb-3 whitespace-nowrap">მ</span>
                </div>
                
                {form.cargo_length_m && form.cargo_width_m && form.cargo_height_m && (
                  <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded text-[10px] text-blue-300">
                    📊 გამოთვლილი მოცულობა: <strong>{(parseFloat(form.cargo_length_m) * parseFloat(form.cargo_width_m) * parseFloat(form.cargo_height_m)).toFixed(2)} m³</strong>
                  </div>
                )}
                
                <FormField label="🔄 დაბრუნებადი ტარა?" checkbox value={form.returnable_packaging} onChange={(e: any) => updateField('returnable_packaging', e.target.checked)} />
              </div>
            </div>
          </div>
        )

      // 🆕 case 3: ფინანსები - განახლებული ლეიაუთით
      case 3:
        return (
          <div className="space-y-4">
            <SectionTitle title="💰 ფინანსები" icon="💰" />
            
            {/* ორი სვეტიანი ლეიაუთი */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* მარცხენა სვეტი: 4 ველი ვერტიკალურად */}
              <div className="space-y-3">
                <FormField 
                  label="💰 ფასი" 
                  type="number" 
                  required 
                  hint="მაგ: 250" 
                  value={form.price} 
                  onChange={(e: any) => updateField('price', e.target.value)} 
                />
                <FormField 
                  label="💵 ვალუტა" 
                  required 
                  options={[{ value: 'GEL', label: '🇬🇪 GEL' }, { value: 'USD', label: '🇺🇸 USD' }, { value: 'EUR', label: '🇪🇺 EUR' }]} 
                  value={form.currency} 
                  onChange={(e: any) => updateField('currency', e.target.value)} 
                />
                <FormField 
                  label="💳 გადახდა" 
                  options={[{ value: 'prepaid', label: '💸 წინასწარ' }, { value: 'on_delivery', label: ' მიწოდებისას' }, { value: 'invoice', label: '🧾 ინვოისით' }]} 
                  value={form.payment_terms} 
                  onChange={(e: any) => updateField('payment_terms', e.target.value)} 
                />
                <FormField 
                  label="🧾 ინვოისი სჭირდება?" 
                  checkbox 
                  value={form.invoice_needed} 
                  onChange={(e: any) => updateField('invoice_needed', e.target.checked)} 
                />
              </div>

              {/* მარჯვენა სვეტი: მანძილი + რეკომენდებული ფასი */}
              <div className="space-y-3">
                {form.distance_km && (
                  <div className="p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-blue-400 flex items-center gap-2">🗺️ გამოთვლილი მანძილი</h4>
                        <p className="text-[9px] text-gray-500 mt-0.5">ავტომატურად გამოითვალა მისამართებიდან</p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-blue-400">{form.distance_km}</span>
                        <span className="text-sm text-gray-400 ml-1">კმ</span>
                      </div>
                    </div>
                  </div>
                )}

                {suggestedPrice > 0 && (
                  <div className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="text-xs font-bold text-purple-400 flex items-center gap-2">💡 რეკომენდებული ფასი</h4>
                        <p className="text-[9px] text-gray-500 mt-0.5">ავტომატურად გამოითვალა</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateField('price', suggestedPrice.toString())}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[10px] font-bold transition"
                      >
                        ✅ გამოყენება
                      </button>
                    </div>
                    <span className="text-2xl font-bold text-purple-400">{suggestedPrice} ₾</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      // 🆕 case 4: დამკვეთი - ორი ამაზი ბარათით
      case 4:
        return (
          <div className="space-y-4">
            <SectionTitle title="👤 დამკვეთის ინფორმაცია" icon="👤" />
            
            {/* ინფორმაცია */}
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-xs text-blue-400 flex items-center gap-2">
                ℹ️ ინფორმაცია ავტომატურად არის შევსებული თქვენი პროფილიდან. აირჩიეთ ტიპი და შეავსეთ დარჩენილი ველები.
              </p>
            </div>

            {/* ორი ლამაზი ბარათი - ტიპის არჩევანი */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ფიზიკური პირის ბარათი */}
              <button
                type="button"
                onClick={() => updateField('client_type', 'private')}
                className={`relative p-5 rounded-2xl border-2 transition-all text-left ${
                  form.client_type === 'private'
                    ? 'border-blue-500 bg-gradient-to-br from-blue-500/20 to-purple-500/20 shadow-lg shadow-blue-500/20'
                    : 'border-gray-700 bg-gray-800/30 hover:border-gray-600 hover:bg-gray-800/50'
                }`}
              >
                {/* აქტიურობის ინდიკატორი */}
                {form.client_type === 'private' && (
                  <div className="absolute top-3 right-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                    form.client_type === 'private'
                      ? 'bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg'
                      : 'bg-gray-700/50'
                  }`}>
                    👤
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-sm font-bold ${form.client_type === 'private' ? 'text-white' : 'text-gray-300'}`}>
                      ფიზიკური პირი
                    </h4>
                    <p className="text-[10px] text-gray-400 mt-1">
                      პირადი შეკვეთები
                    </p>
                    {/* სტატუსი */}
                    <div className="mt-2 flex items-center gap-1">
                      {form.client_name && form.client_personal_id ? (
                        <span className="text-[9px] px-2 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">
                          ✅ შევსებულია
                        </span>
                      ) : (
                        <span className="text-[9px] px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                          ️ შეავსეთ
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>

              {/* იურიდიული პირის ბარათი */}
              <button
                type="button"
                onClick={() => updateField('client_type', 'company')}
                className={`relative p-5 rounded-2xl border-2 transition-all text-left ${
                  form.client_type === 'company'
                    ? 'border-purple-500 bg-gradient-to-br from-purple-500/20 to-pink-500/20 shadow-lg shadow-purple-500/20'
                    : 'border-gray-700 bg-gray-800/30 hover:border-gray-600 hover:bg-gray-800/50'
                }`}
              >
                {/* აქტიურობის ინდიკატორი */}
                {form.client_type === 'company' && (
                  <div className="absolute top-3 right-3 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                    form.client_type === 'company'
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg'
                      : 'bg-gray-700/50'
                  }`}>
                    🏢
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-sm font-bold ${form.client_type === 'company' ? 'text-white' : 'text-gray-300'}`}>
                      იურიდიული პირი
                    </h4>
                    <p className="text-[10px] text-gray-400 mt-1">
                      ბიზნეს შეკვეთები
                    </p>
                    {/* სტატუსი */}
                    <div className="mt-2 flex items-center gap-1">
                      {form.client_company_name && form.client_registration_number && form.client_contact_person ? (
                        <span className="text-[9px] px-2 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">
                          ✅ შევსებულია
                        </span>
                      ) : (
                        <span className="text-[9px] px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                          ⚠️ შეავსეთ
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {/* ფიზიკური პირის ფორმა */}
            {form.client_type === 'private' && (
              <div className="space-y-3">
                <div className="p-4 bg-gray-800/30 rounded-xl border border-gray-700/30">
                  <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-3">👤 ფიზიკური პირის ინფორმაცია</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FormField 
                      label="სახელი და გვარი" 
                      required 
                      value={form.client_name} 
                      onChange={(e: any) => updateField('client_name', e.target.value)} 
                      placeholder="გიორგი ბერიძე"
                    />
                    <FormField 
                      label="პირადი ნომერი" 
                      required 
                      value={form.client_personal_id} 
                      onChange={(e: any) => updateField('client_personal_id', e.target.value)} 
                      placeholder="12345678901"
                      maxLength={11}
                    />
                  </div>
                </div>

                <div className="p-4 bg-gray-800/30 rounded-xl border border-gray-700/30">
                  <h4 className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-3">📧 საკონტაქტო ინფორმაცია</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FormField 
                      label="ტელეფონი" 
                      required 
                      type="tel"
                      value={form.client_phone} 
                      onChange={(e: any) => updateField('client_phone', e.target.value)} 
                      placeholder="+995 555 123 456"
                    />
                    <FormField 
                      label="Email" 
                      required 
                      type="email"
                      value={form.client_email} 
                      onChange={(e: any) => updateField('client_email', e.target.value)} 
                      placeholder="info@company.ge"
                    />
                    <div className="md:col-span-2">
                      <FormField 
                        label="მისამართი" 
                        required 
                        textarea
                        value={form.client_address} 
                        onChange={(e: any) => updateField('client_address', e.target.value)} 
                        placeholder="თბილისი, რუსთაველის გამზირი 12"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* იურიდიული პირის ფორმა */}
            {form.client_type === 'company' && (
              <div className="space-y-3">
                <div className="p-4 bg-gray-800/30 rounded-xl border border-gray-700/30">
                  <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-3">🏢 კომპანიის ინფორმაცია</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FormField 
                      label="კომპანიის სახელი" 
                      required 
                      value={form.client_company_name} 
                      onChange={(e: any) => updateField('client_company_name', e.target.value)} 
                      placeholder="შპს ლოჯისტიკა"
                    />
                    <FormField 
                      label="საიდენტო კოდი" 
                      required 
                      value={form.client_registration_number} 
                      onChange={(e: any) => updateField('client_registration_number', e.target.value)} 
                      placeholder="123456789"
                      maxLength={9}
                    />
                    <FormField 
                      label="VAT ნომერი" 
                      value={form.client_vat} 
                      onChange={(e: any) => updateField('client_vat', e.target.value)} 
                      placeholder="GE123456789"
                    />
                  </div>
                </div>

                <div className="p-4 bg-gray-800/30 rounded-xl border border-gray-700/30">
                  <h4 className="text-[10px] font-bold text-green-400 uppercase tracking-wider mb-3">👨‍💼 საკონტაქტო პირი</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FormField 
                      label="სახელი და გვარი" 
                      required 
                      value={form.client_contact_person} 
                      onChange={(e: any) => updateField('client_contact_person', e.target.value)} 
                      placeholder="გიორგი ბერიძე"
                    />
                    <FormField 
                      label="ტელეფონი" 
                      required 
                      value={form.client_contact_phone} 
                      onChange={(e: any) => updateField('client_contact_phone', e.target.value)} 
                      placeholder="+995 555 123 456"
                    />
                  </div>
                </div>

                <div className="p-4 bg-gray-800/30 rounded-xl border border-gray-700/30">
                  <h4 className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-3">📧 საკონტაქტო ინფორმაცია</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FormField 
                      label="ტელეფონი" 
                      required 
                      type="tel"
                      value={form.client_phone} 
                      onChange={(e: any) => updateField('client_phone', e.target.value)} 
                      placeholder="+995 555 123 456"
                    />
                    <FormField 
                      label="Email" 
                      required 
                      type="email"
                      value={form.client_email} 
                      onChange={(e: any) => updateField('client_email', e.target.value)} 
                      placeholder="info@company.ge"
                    />
                    <div className="md:col-span-2">
                      <FormField 
                        label="მისამართი" 
                        required 
                        textarea
                        value={form.client_address} 
                        onChange={(e: any) => updateField('client_address', e.target.value)} 
                        placeholder="თბილისი, რუსთაველის გამზირი 12"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )

      case 5: // დამატებითი
        return (
          <div className="space-y-5">
            <SectionTitle title="📝 დამატებითი ინფორმაცია" icon="📝" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label=" ტრანსპორტის ტიპი" options={[
                { value: 'road', label: '🚛 სახმელეთო' },
                { value: 'air', label: '✈️ საჰაერო' },
                { value: 'sea', label: ' საზღვაო' },
                { value: 'rail', label: '🚂 რკინიგზა' }
              ]} value={form.transport_type} onChange={(e: any) => updateField('transport_type', e.target.value)} />
              <FormField label="📦 კონტეინერის ნომერი" hint="თუ აქვს" value={form.container_number} onChange={(e: any) => updateField('container_number', e.target.value)} />
              <FormField label="📝 შიდა შენიშვნა" hint="დისპეტჩერისთვის" textarea value={form.internal_notes} onChange={(e: any) => updateField('internal_notes', e.target.value)} />
              <FormField label="⚠️ სპეციალური მოთხოვნები" hint="მაგ: ლიფტი, ღვედები..." textarea value={form.special_requirements} onChange={(e: any) => updateField('special_requirements', e.target.value)} />
              <div className="md:col-span-2">
                <p className="text-[10px] font-semibold text-gray-400 mb-2 uppercase tracking-wide">🔧 საჭირო აღჭურვილობა</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <FormField checkbox label="🔽 ლიფტი" value={form.needs_tail_lift} onChange={(e: any) => updateField('needs_tail_lift', e.target.checked)} />
                  <FormField checkbox label="🔗 ღვედები" value={form.needs_straps} onChange={(e: any) => updateField('needs_straps', e.target.checked)} />
                  <FormField checkbox label="🧱 აგურის დალაგება" value={form.needs_bricklaying} onChange={(e: any) => updateField('needs_bricklaying', e.target.checked)} />
                  <FormField checkbox label="👥 2 მზიდავი" value={form.needs_two_cargo_handlers} onChange={(e: any) => updateField('needs_two_cargo_handlers', e.target.checked)} />
                </div>
              </div>
            </div>
          </div>
        )

      case 6: // დასტური
        return (
          <div className="max-w-3xl mx-auto">
            <SectionTitle title="✅ შეკვეთის დასტური" icon="✅" />
            <p className="text-xs text-gray-400 mb-6 text-center">გადაამოწმე ინფორმაცია და დაადასტურე შეკვეთა</p>
            
            <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-2">
              
              {/* დამკვეთის ინფორმაცია */}
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4">
                <h4 className="text-xs font-bold text-purple-400 mb-3 flex items-center gap-2">👤 დამკვეთი</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div><p className="text-gray-500">ტიპი</p><p className="text-white font-medium">{form.client_type === 'private' ? '👤 ფიზიკური პირი' : ' იურიდიული პირი'}</p></div>
                  <div><p className="text-gray-500">{form.client_type === 'private' ? 'სახელი' : 'კომპანია'}</p><p className="text-white font-medium">{form.client_type === 'private' ? form.client_name : form.client_company_name}</p></div>
                  {form.client_type === 'private' && form.client_personal_id && (
                    <div><p className="text-gray-500">პირადი ნომერი</p><p className="text-white font-medium">{form.client_personal_id}</p></div>
                  )}
                  {form.client_type === 'company' && form.client_registration_number && (
                    <div><p className="text-gray-500">საიდენტო კოდი</p><p className="text-white font-medium">{form.client_registration_number}</p></div>
                  )}
                  {form.client_type === 'company' && form.client_vat && (
                    <div><p className="text-gray-500">VAT</p><p className="text-white font-medium">{form.client_vat}</p></div>
                  )}
                  <div><p className="text-gray-500">ტელეფონი</p><p className="text-white font-medium">{form.client_phone}</p></div>
                  <div><p className="text-gray-500">Email</p><p className="text-white font-medium truncate">{form.client_email}</p></div>
                  <div className="md:col-span-2"><p className="text-gray-500">მისამართი</p><p className="text-white font-medium">{form.client_address}</p></div>
                  {form.client_type === 'company' && form.client_contact_person && (
                    <>
                      <div><p className="text-gray-500">საკონტაქტო პირი</p><p className="text-white font-medium">{form.client_contact_person}</p></div>
                      <div><p className="text-gray-500">საკონტაქტო ტელეფონი</p><p className="text-white font-medium">{form.client_contact_phone}</p></div>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-xl p-4">
                <h4 className="text-xs font-bold text-red-400 mb-3 flex items-center gap-2">📍 მარშრუტი</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-gray-500 mb-1">📤 ატვირთვა</p>
                    <p className="text-white font-medium">{form.pickup_address}</p>
                    <p className="text-gray-400 mt-1">{form.pickup_date} {form.pickup_time && `• ${form.pickup_time}`}</p>
                    <p className="text-gray-400">{form.pickup_contact_person} • {form.pickup_phone}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">📥 ჩატვირთვა</p>
                    <p className="text-white font-medium">{form.delivery_address}</p>
                    <p className="text-gray-400 mt-1">{form.delivery_date} {form.delivery_time && `• ${form.delivery_time}`}</p>
                    <p className="text-gray-400">{form.delivery_contact_person} • {form.delivery_phone}</p>
                  </div>
                </div>
                {form.distance_km && (
                  <div className="mt-3 pt-3 border-t border-red-500/20">
                    <p className="text-gray-500 text-[10px]">🗺️ მანძილი</p>
                    <p className="text-white font-bold text-lg">{form.distance_km} კმ</p>
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-4">
                <h4 className="text-xs font-bold text-yellow-400 mb-3 flex items-center gap-2">📦 ტვირთი</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div><p className="text-gray-500">აღწერა</p><p className="text-white font-medium truncate">{form.cargo_description}</p></div>
                  <div><p className="text-gray-500">ტიპი</p><p className="text-white font-medium">{form.cargo_type}</p></div>
                  <div><p className="text-gray-500">წონა</p><p className="text-white font-medium">{form.cargo_weight_kg} კგ</p></div>
                  <div><p className="text-gray-500">მოცულობა</p><p className="text-white font-medium">{form.cargo_volume_m3 || '–'} m³</p></div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-4">
                <h4 className="text-xs font-bold text-blue-400 mb-3 flex items-center gap-2">💰 ფინანსები</h4>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div><p className="text-gray-500">ფასი</p><p className="text-white font-bold text-lg">{form.price} {form.currency}</p></div>
                  <div><p className="text-gray-500">გადახდა</p><p className="text-white font-medium">{form.payment_terms || '–'}</p></div>
                  <div><p className="text-gray-500">ინვოისი</p><p className="text-white font-medium">{form.invoice_needed ? '✅ კი' : '❌ არა'}</p></div>
                </div>
              </div>

              {(form.special_requirements || form.needs_tail_lift || form.needs_straps || form.transport_type || form.container_number) && (
                <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-green-400 mb-3 flex items-center gap-2">📝 დამატებითი</h4>
                  {form.special_requirements && <div className="mb-2"><p className="text-gray-500 text-[10px]">მოთხოვნები</p><p className="text-white text-xs">{form.special_requirements}</p></div>}
                  <div className="flex flex-wrap gap-2">
                    {form.needs_tail_lift && <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-[10px]">🔽 ლიფტი</span>}
                    {form.needs_straps && <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-[10px]">🔗 ვედები</span>}
                    {form.needs_bricklaying && <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-[10px]">🧱 აგური</span>}
                    {form.needs_two_cargo_handlers && <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-[10px]">👥 2 მზიდავი</span>}
                    {form.transport_type && <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-[10px]">🚛 {form.transport_type}</span>}
                    {form.container_number && <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-[10px]">📦 {form.container_number}</span>}
                  </div>
                </div>
              )}

            </div>
          </div>
        )

      default:
        return null
    }
  }

  // ✅ წარმატების პოპაპი
  if (showSuccessPopup) {
    return (
      <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-[#1a202c] border border-emerald-500/30 rounded-2xl w-full max-w-md shadow-2xl shadow-emerald-500/20">
          <div className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-full flex items-center justify-center border-2 border-emerald-500/30">
              <span className="text-5xl animate-bounce">✅</span>
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2">შეკვეთა წარმატებით შეიქმნა!</h3>
            <p className="text-sm text-gray-400 mb-6">თქვენი შეკვეთა დაემატა სისტემაში</p>
            
            <div className="bg-gray-800/50 rounded-xl p-4 mb-6 text-left space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">👤 დამკვეთი:</span>
                <span className="text-white font-medium truncate ml-2 max-w-[200px]">
                  {form.client_type === 'private' ? form.client_name : form.client_company_name}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">📍 მარშრუტი:</span>
                <span className="text-white font-medium truncate ml-2 max-w-[200px]">
                  {form.pickup_address?.split(',')[0]} → {form.delivery_address?.split(',')[0]}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">💰 ფასი:</span>
                <span className="text-emerald-400 font-bold">{form.price} {form.currency}</span>
              </div>
              {form.distance_km && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">🗺️ მანძილი:</span>
                  <span className="text-blue-400 font-medium">{form.distance_km} კმ</span>
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowSuccessPopup(false)} className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-sm font-medium transition">
                დახურვა
              </button>
              <button type="button" onClick={handleNewOrder} className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white rounded-xl text-sm font-bold transition shadow-lg shadow-emerald-500/20">
                🔄 ახალი შეკვეთა
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 🎯 მთავარი რენდერი
  return (
    <div className="space-y-4">
      <div className="bg-[#1a202c] border border-gray-700 rounded-xl p-4">
        <div className="flex items-center gap-4 mb-3">
          <div className="shrink-0">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">📦 ახალი შეკვეთა</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">ნაბიჯი {currentStep} / {STEPS.length} — {STEPS[currentStep - 1].title}</p>
          </div>
          
          <div className="flex-1 flex items-center gap-1 overflow-x-auto">
            {STEPS.map((step, i) => {
              const isCompleted = currentStep > step.id
              const isCurrent = currentStep === step.id
              const stepColor = isCompleted ? 'emerald' : isCurrent ? step.color : 'gray'
              return (
                <div key={step.id} className="flex items-center flex-1 min-w-[40px]">
                  <div className="flex flex-col items-center relative z-10">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold border-2 transition-all duration-300 ${COLOR_MAP[stepColor]}`}>
                      {isCompleted ? '✓' : step.id}
                    </div>
                    <span className={`text-[7px] mt-0.5 font-medium whitespace-nowrap ${isCurrent ? 'text-white' : 'text-gray-500'}`}>{step.title}</span>
                  </div>
                  {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-0.5 rounded-full transition-all duration-500 ${currentStep > step.id ? LINE_COLOR_MAP['emerald'] : 'bg-gray-700'}`} />}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-xs font-bold text-red-400 mb-1">⚠️ შეავსე სავალდებულო ველები:</p>
          <ul className="text-[10px] text-red-300 space-y-0.5">{errors.map((err, i) => <li key={i}>• {err}</li>)}</ul>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs flex items-center justify-between">
          <span> {error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-300">✕</button>
        </div>
      )}

      <div className="bg-[#1a202c] border border-gray-700 rounded-xl p-6">
        {renderStepContent()}
      </div>

      <div className="bg-[#1a202c] border border-gray-700 rounded-xl p-4">
        <div className="flex justify-between items-center">
          <button type="button" onClick={handleBack} disabled={currentStep === 1} className={`px-5 py-2.5 rounded-lg text-xs font-medium transition flex items-center gap-2 ${currentStep === 1 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>
            ← უკან
          </button>
          
          <div className="flex gap-3">
            {currentStep < STEPS.length ? (
              <button type="button" onClick={handleNext} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold transition shadow-lg shadow-blue-500/20 text-white flex items-center gap-2">
                შემდეგი →
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-bold transition shadow-lg shadow-emerald-500/20 text-white flex items-center gap-2">
                {isSubmitting ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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
  )
}