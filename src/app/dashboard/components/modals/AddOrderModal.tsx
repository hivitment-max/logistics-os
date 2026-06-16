'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { calculateAIPrice } from '@/app/actions/calculateAIPrice'

// ============================================================================
// 🗺️ GEOCODING & DISTANCE CALCULATION
// ============================================================================

interface Coordinates {
  lat: number
  lon: number
}

const GEORGIAN_CITIES: Record<string, { lat: number; lon: number; alt: string[] }> = {
  'თბილისი': { lat: 41.7151, lon: 44.8271, alt: ['tbilisi', 'тбилиси'] },
  'ბათუმი': { lat: 41.6168, lon: 41.6367, alt: ['batumi', 'батуми'] },
  'ქუთაისი': { lat: 42.2710, lon: 42.6960, alt: ['kutaisi', 'кутаиси'] },
  'რუსთავი': { lat: 41.5391, lon: 45.0047, alt: ['rustavi'] },
  'ზუგდიდი': { lat: 42.5094, lon: 41.8703, alt: ['zugdidi'] },
  'გორი': { lat: 41.9843, lon: 44.1139, alt: ['gori'] },
  'ფოთი': { lat: 42.1464, lon: 41.6717, alt: ['poti'] },
  'სოხუმი': { lat: 43.0016, lon: 41.0237, alt: ['sukhumi'] },
  'სენაკი': { lat: 42.2700, lon: 42.0500, alt: ['senaki'] },
  'ქობულეთი': { lat: 41.8172, lon: 41.7683, alt: ['kobuleti'] },
  'ოზურგეთი': { lat: 41.9236, lon: 42.0000, alt: ['ozurgeti'] },
  'ახალციხე': { lat: 41.6386, lon: 42.9894, alt: ['akhaltsikhe'] },
  'თელავი': { lat: 41.9197, lon: 45.4733, alt: ['telavi'] },
  'მცხეთა': { lat: 41.8444, lon: 44.7197, alt: ['mtskheta'] },
  'ყვარელი': { lat: 41.9500, lon: 45.8000, alt: ['kvareli'] },
  'სიღნაღი': { lat: 41.6167, lon: 45.9333, alt: ['sighnaghi'] },
  'ლაგოდეხი': { lat: 41.8167, lon: 46.2833, alt: ['lagodekhi'] },
  'დუშეთი': { lat: 42.0833, lon: 44.7000, alt: ['dusheti'] },
  'კასპი': { lat: 41.9333, lon: 44.4333, alt: ['kaspi'] },
  'ხაშური': { lat: 42.0000, lon: 43.6000, alt: ['khashuri'] },
  'ბორჯომი': { lat: 41.8333, lon: 43.4000, alt: ['borjomi'] },
  'ახმეტა': { lat: 42.0500, lon: 45.1833, alt: ['akhmeta'] },
  'საგარეჯო': { lat: 41.7500, lon: 45.3333, alt: ['sagarejo'] },
  'გურჯაანი': { lat: 41.7500, lon: 45.8000, alt: ['gurjaani'] },
  'დედოფლისწყარო': { lat: 41.4833, lon: 46.1500, alt: ['dedoplistskaro'] },
  'მარნეული': { lat: 41.4833, lon: 44.7833, alt: ['marneuli'] },
  'ბოლნისი': { lat: 41.4500, lon: 44.5333, alt: ['bolnisi'] },
  'წალკა': { lat: 41.6000, lon: 44.1000, alt: ['tsalka'] },
  'ნინოწმინდა': { lat: 41.2667, lon: 43.5833, alt: ['ninotsminda'] },
  'ახალქალაქი': { lat: 41.4000, lon: 43.4833, alt: ['akhalkalaki'] },
  'ვალი': { lat: 41.6333, lon: 43.4500, alt: ['vale'] },
  'ონი': { lat: 42.5833, lon: 43.4333, alt: ['oni'] },
  'ამბროლაური': { lat: 42.5167, lon: 43.1500, alt: ['ambrolauri'] },
  'ჭიათურა': { lat: 42.2833, lon: 43.2833, alt: ['chiatura'] },
  'საჩხერე': { lat: 42.3500, lon: 43.4167, alt: ['sachkhere'] },
  'ტყიბული': { lat: 42.3500, lon: 43.0000, alt: ['tkibuli'] },
  'ტერჯოლა': { lat: 42.1000, lon: 42.6000, alt: ['terjola'] },
  'ვანი': { lat: 42.0833, lon: 42.5000, alt: ['vani'] },
  'ბაღდათი': { lat: 42.1500, lon: 43.0500, alt: ['baghdati'] },
  'წალენჯიხა': { lat: 42.5833, lon: 42.0833, alt: ['tsalenjikha'] },
  'ჩხოროწყუ': { lat: 42.5167, lon: 42.0167, alt: ['chkhorotsku'] },
  'მარტვილი': { lat: 42.4167, lon: 42.3833, alt: ['martvili'] },
  'აბაშა': { lat: 42.2000, lon: 42.2000, alt: ['abasha'] },
  'ხობი': { lat: 42.3167, lon: 41.8500, alt: ['khobi'] },
  'ლანჩხუთი': { lat: 42.0833, lon: 42.0333, alt: ['lanchkhuti'] },
  'ხონი': { lat: 42.3167, lon: 42.4167, alt: ['khoni'] },
  'წნორი': { lat: 41.6000, lon: 45.7500, alt: ['tsnori'] },
  'ჯვარი': { lat: 42.5000, lon: 41.9500, alt: ['jvari'] },
  'სამტრედია': { lat: 42.1667, lon: 42.3333, alt: ['samtredia'] },
  'ხარაგაული': { lat: 42.0500, lon: 43.0167, alt: ['kharagauli'] },
  'ცხინვალი': { lat: 42.2333, lon: 44.0167, alt: ['tskhinvali'] },
}

const GEORGIA_BBOX = { minLat: 41.0, maxLat: 43.6, minLon: 40.0, maxLon: 46.8 }

const findCityInLocalDB = (address: string): Coordinates | null => {
  const normalizedAddress = address.toLowerCase().trim()
  for (const [cityName, data] of Object.entries(GEORGIAN_CITIES)) {
    if (normalizedAddress === cityName.toLowerCase()) return { lat: data.lat, lon: data.lon }
  }
  for (const [cityName, data] of Object.entries(GEORGIAN_CITIES)) {
    if (normalizedAddress.includes(cityName.toLowerCase()) && cityName.length >= 3) return { lat: data.lat, lon: data.lon }
    for (const alt of data.alt) {
      if (normalizedAddress.includes(alt.toLowerCase()) && alt.length >= 3) return { lat: data.lat, lon: data.lon }
    }
  }
  return null
}

const geocodeWithNominatim = async (address: string): Promise<Coordinates | null> => {
  try {
    const params = new URLSearchParams({ q: address, format: 'json', limit: '5', countrycodes: 'ge', 'accept-language': 'ka,en,ru', addressdetails: '1' })
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { headers: { 'User-Agent': 'LogisticsOS/1.0' } })
    if (!response.ok) return null
    const data = await response.json()
    if (!data || data.length === 0) return null
    for (const result of data) {
      const lat = parseFloat(result.lat)
      const lon = parseFloat(result.lon)
      if (lat >= GEORGIA_BBOX.minLat && lat <= GEORGIA_BBOX.maxLat && lon >= GEORGIA_BBOX.minLon && lon <= GEORGIA_BBOX.maxLon) {
        return { lat, lon }
      }
    }
    return null
  } catch (error) {
    console.error('❌ Nominatim შეცდომა:', error)
    return null
  }
}

const geocodeAddress = async (address: string): Promise<Coordinates | null> => {
  if (!address || address.trim().length < 3) return null
  const trimmedAddress = address.trim()
  const localResult = findCityInLocalDB(trimmedAddress)
  if (localResult) return localResult
  return await geocodeWithNominatim(trimmedAddress)
}

const haversineDistance = (coord1: Coordinates, coord2: Coordinates): number => {
  const R = 6371
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180
  const dLon = (coord2.lon - coord1.lon) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c)
}

const calculateDistanceBetweenAddresses = async (pickupAddress: string, deliveryAddress: string): Promise<number | null> => {
  if (!pickupAddress || !deliveryAddress) return null
  const [pickupCoords, deliveryCoords] = await Promise.all([geocodeAddress(pickupAddress), geocodeAddress(deliveryAddress)])
  if (!pickupCoords || !deliveryCoords) return null
  return haversineDistance(pickupCoords, deliveryCoords)
}

// ============================================================================
// 🧩 Helper Components
// ============================================================================

type ValidationState = 'valid' | 'warning' | 'invalid' | null

const FormField = ({ label, hint, required, type = 'text', value, onChange, options, textarea, checkbox, radio, file, className = '', suffix = '', validation = null, inputMode }: any) => {
  const getBorderClass = () => {
    if (validation === 'valid') return 'border-green-500 ring-1 ring-green-500/30'
    if (validation === 'warning') return 'border-amber-500 ring-1 ring-amber-500/30'
    if (validation === 'invalid') return 'border-red-500 ring-1 ring-red-500/30 bg-red-950/20'
    return 'border-gray-600'
  }
  const borderClass = getBorderClass()

  if (checkbox) {
    return (
      <div className={`flex items-center gap-2 p-3 rounded-lg border ${validation === 'valid' ? 'bg-green-500/5 border-green-500/50' : validation === 'warning' ? 'bg-amber-500/5 border-amber-500/50' : validation === 'invalid' ? 'bg-red-500/5 border-red-500/50' : 'bg-gray-700/30 border-gray-600'} ${className}`}>
        <input type="checkbox" checked={!!value} onChange={onChange} className="w-4 h-4 accent-blue-500 rounded" />
        <label className="text-xs text-gray-300 select-none">{label}</label>
      </div>
    )
  }
  if (radio && options) {
    return (
      <div className={className}>
        <label className="block text-[10px] font-semibold text-gray-400 mb-2 uppercase tracking-wide">{label} {required && <span className="text-red-500">*</span>}</label>
        <div className="flex flex-wrap gap-2">
          {options.map((opt: any) => (
            <label key={opt.value} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition ${value === opt.value ? 'bg-blue-500/20 border-blue-500/50' : 'bg-gray-700/30 border-gray-600 hover:border-gray-500'}`}>
              <input type="radio" name={label} value={opt.value} checked={value === opt.value} onChange={onChange} className="hidden" />
              <span className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${value === opt.value ? 'border-blue-400' : 'border-gray-500'}`}>
                {value === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
              </span>
              <span className="text-xs text-gray-300">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>
    )
  }
  if (file) {
    return (
      <div className={className}>
        <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wide">{label} {required && <span className="text-red-500">*</span>}</label>
        <div className={`border-2 border-dashed rounded-lg p-4 text-center transition cursor-pointer ${validation === 'valid' ? 'border-green-500/50 bg-green-500/5' : validation === 'warning' ? 'border-amber-500/50 bg-amber-500/5' : validation === 'invalid' ? 'border-red-500/50 bg-red-500/5' : 'border-gray-600 hover:border-blue-500/50'}`} onClick={() => document.getElementById('file-input')?.click()}>
          <input id="file-input" type="file" onChange={onChange} className="hidden" accept=".pdf,.jpg,.png" />
          <span className="text-2xl">📎</span>
          <p className="text-xs text-gray-400 mt-1">{hint || 'დააჭირე ატვირთვისთვის'}</p>
        </div>
      </div>
    )
  }
  return (
    <div className={textarea ? "col-span-1 md:col-span-2" : className}>
      <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wide">{label} {required && <span className="text-red-500">*</span>}</label>
      {textarea ? (
        <textarea rows={3} value={value || ''} onChange={onChange} placeholder={hint} className={`w-full px-3 py-2.5 bg-gray-800/60 border rounded-lg text-xs text-white outline-none transition resize-none placeholder-gray-500 ${borderClass}`} />
      ) : options ? (
        <select value={value || ''} onChange={onChange} className={`w-full px-3 py-2.5 bg-gray-800/60 border rounded-lg text-xs text-white outline-none transition ${borderClass}`}>
          <option value="">აირჩიე...</option>
          {options.map((opt: any) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      ) : (
        <div className="relative">
          <input 
            type={type} 
            inputMode={inputMode}
            value={value || ''} 
            onChange={onChange} 
            placeholder={hint} 
            required={required} 
            className={`w-full ${suffix ? 'pr-12' : ''} px-3 py-2.5 bg-gray-800/60 border rounded-lg text-xs text-white outline-none transition placeholder-gray-500 ${borderClass}`} 
          />
          {suffix && (<span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-gray-400 pointer-events-none">{suffix}</span>)}
        </div>
      )}
      {validation === 'invalid' && !textarea && !options && !checkbox && !radio && !file && (
        <p className="text-[9px] text-red-400 mt-1 flex items-center gap-1">
          <span>❌</span>
          <span>შეიყვანეთ დადებითი რიცხვი</span>
        </p>
      )}
    </div>
  )
}

const SectionTitle = ({ title, icon }: { title: string, icon: string }) => (
  <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4 pb-2 border-b border-gray-700/50">
    <span className="text-base">{icon}</span>{title}
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
  red: 'bg-red-500/50', yellow: 'bg-yellow-500/50', blue: 'bg-blue-500/50',
  purple: 'bg-purple-500/50', green: 'bg-green-500/50', emerald: 'bg-emerald-500/50',
}

// ============================================================================
// 📦 ADD ORDER MODAL
// ============================================================================

interface AddOrderModalProps {
  isOpen: boolean
  onClose: () => void
  orderForm: any
  setOrderForm: (form: any) => void
  onSubmit: (e?: any) => void
  clients?: any[]
  companies?: any[]
}

export default function AddOrderModal({ isOpen, onClose, orderForm, setOrderForm, onSubmit, clients = [], companies = [] }: AddOrderModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [activeClientTab, setActiveClientTab] = useState<'private' | 'company'>('private')
  const [showNewClientForm, setShowNewClientForm] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [aiSuggestion, setAiSuggestion] = useState<any>(null)
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false)
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false)
  const [pickupGeocoded, setPickupGeocoded] = useState(false)
  const [deliveryGeocoded, setDeliveryGeocoded] = useState(false)
  const [pickupGeocodingDone, setPickupGeocodingDone] = useState(false)
  const [deliveryGeocodingDone, setDeliveryGeocodingDone] = useState(false)
  const pickupAbortRef = useRef<AbortController | null>(null)
  const deliveryAbortRef = useRef<AbortController | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null
  const totalSteps = STEPS.length
  const currentStepConfig = STEPS[currentStep - 1]

  const updateField = (field: string, value: any) => {
    setOrderForm({ ...orderForm, [field]: value })
    setErrors([])
  }

  useEffect(() => {
    const pickup = orderForm.pickup_address?.trim()
    if (!pickup || pickup.length < 3) { setPickupGeocoded(false); setPickupGeocodingDone(false); return }
    if (pickupAbortRef.current) pickupAbortRef.current.abort()
    const controller = new AbortController()
    pickupAbortRef.current = controller
    const timer = setTimeout(async () => {
      if (controller.signal.aborted) return
      try {
        const coords = await geocodeAddress(pickup)
        if (controller.signal.aborted) return
        setPickupGeocoded(!!coords)
        setPickupGeocodingDone(true)
      } catch (error) {
        if (!controller.signal.aborted) { setPickupGeocoded(false); setPickupGeocodingDone(true) }
      }
    }, 1000)
    return () => { clearTimeout(timer); controller.abort() }
  }, [orderForm.pickup_address])

  useEffect(() => {
    const delivery = orderForm.delivery_address?.trim()
    if (!delivery || delivery.length < 3) { setDeliveryGeocoded(false); setDeliveryGeocodingDone(false); return }
    if (deliveryAbortRef.current) deliveryAbortRef.current.abort()
    const controller = new AbortController()
    deliveryAbortRef.current = controller
    const timer = setTimeout(async () => {
      if (controller.signal.aborted) return
      try {
        const coords = await geocodeAddress(delivery)
        if (controller.signal.aborted) return
        setDeliveryGeocoded(!!coords)
        setDeliveryGeocodingDone(true)
      } catch (error) {
        if (!controller.signal.aborted) { setDeliveryGeocoded(false); setDeliveryGeocodingDone(true) }
      }
    }, 1000)
    return () => { clearTimeout(timer); controller.abort() }
  }, [orderForm.delivery_address])

  useEffect(() => {
    const calculateDistance = async () => {
      if (!pickupGeocoded || !deliveryGeocoded) { updateField('distance_km', ''); return }
      const pickup = orderForm.pickup_address?.trim()
      const delivery = orderForm.delivery_address?.trim()
      if (!pickup || !delivery) return
      setIsCalculatingDistance(true)
      try {
        const distance = await calculateDistanceBetweenAddresses(pickup, delivery)
        if (distance && distance > 0) updateField('distance_km', distance.toString())
        else updateField('distance_km', '')
      } catch (error) { updateField('distance_km', '') }
      finally { setIsCalculatingDistance(false) }
    }
    calculateDistance()
  }, [pickupGeocoded, deliveryGeocoded])

  // ✅ FIX: prev-ს აქვს explicit any type
  useEffect(() => {
    const l = parseFloat(orderForm.cargo_length_m)
    const w = parseFloat(orderForm.cargo_width_m)
    const h = parseFloat(orderForm.cargo_height_m)
    if (l > 0 && w > 0 && h > 0) {
      const calculatedVolume = (l * w * h).toFixed(2)
      if (orderForm.cargo_volume_m3 !== calculatedVolume) setOrderForm((prev: any) => ({ ...prev, cargo_volume_m3: calculatedVolume }))
    }
  }, [orderForm.cargo_length_m, orderForm.cargo_width_m, orderForm.cargo_height_m])

  const fieldValidation = useMemo(() => {
    const getAddressValidation = (address: string | undefined, geocoded: boolean, geocodingDone: boolean): ValidationState => {
      if (!address?.trim()) return null
      if (geocoded) return 'valid'
      if (geocodingDone) return 'warning'
      return null
    }

    const getNumberValidation = (value: any): ValidationState => {
      if (value === '' || value === null || value === undefined) return null
      const num = parseFloat(value)
      if (isNaN(num)) return 'invalid'
      if (num <= 0) return 'invalid'
      return 'valid'
    }

    return {
      pickup_address: getAddressValidation(orderForm.pickup_address, pickupGeocoded, pickupGeocodingDone),
      delivery_address: getAddressValidation(orderForm.delivery_address, deliveryGeocoded, deliveryGeocodingDone),
      pickup_date: orderForm.pickup_date ? 'valid' : null,
      cargo_description: orderForm.cargo_description?.trim() ? 'valid' : null,
      cargo_weight_kg: getNumberValidation(orderForm.cargo_weight_kg),
      cargo_volume_m3: getNumberValidation(orderForm.cargo_volume_m3),
      cargo_units: getNumberValidation(orderForm.cargo_units),
      cargo_length_m: getNumberValidation(orderForm.cargo_length_m),
      cargo_width_m: getNumberValidation(orderForm.cargo_width_m),
      cargo_height_m: getNumberValidation(orderForm.cargo_height_m),
      price: getNumberValidation(orderForm.price),
      currency: orderForm.currency ? 'valid' : null,
      client_name: orderForm.client_name?.trim() ? 'valid' : null,
      client_phone: orderForm.client_phone?.trim() && orderForm.client_phone.trim().length >= 5 ? 'valid' : (orderForm.client_phone?.trim() ? 'invalid' : null),
    }
  }, [orderForm, pickupGeocoded, deliveryGeocoded, pickupGeocodingDone, deliveryGeocodingDone])

  const isNextDisabled = useMemo(() => {
    if (currentStep === 1) {
      const pickupFilled = !!orderForm.pickup_address?.trim()
      const deliveryFilled = !!orderForm.delivery_address?.trim()
      const dateFilled = !!orderForm.pickup_date
      return !pickupFilled || !deliveryFilled || !dateFilled
    }
    if (currentStep === 2) {
      return fieldValidation.cargo_description !== 'valid' ||
             fieldValidation.cargo_weight_kg !== 'valid' ||
             fieldValidation.cargo_volume_m3 !== 'valid' ||
             fieldValidation.cargo_units !== 'valid' ||
             fieldValidation.cargo_length_m !== 'valid' ||
             fieldValidation.cargo_width_m !== 'valid' ||
             fieldValidation.cargo_height_m !== 'valid'
    }
    if (currentStep === 3) {
      return fieldValidation.price !== 'valid' || fieldValidation.currency !== 'valid'
    }
    if (currentStep === 4) {
      return fieldValidation.client_name !== 'valid' || fieldValidation.client_phone !== 'valid'
    }
    return false
  }, [currentStep, fieldValidation, orderForm])

  const handleNext = () => { if (isNextDisabled) return; setErrors([]); if (currentStep < totalSteps) setCurrentStep(currentStep + 1) }
  const handleBack = () => { if (currentStep > 1) { setCurrentStep(currentStep - 1); setErrors([]) } }

  const handleGetAIPrice = async () => {
    setIsCalculatingPrice(true)
    setAiSuggestion(null)
    try {
      const urgencyValue = orderForm.priority === 'high' ? 'express' : orderForm.priority === 'urgent' ? 'urgent' : 'standard'
      const orderData = {
        distance_km: parseFloat(orderForm.distance_km || '0') || 50,
        weight_kg: parseFloat(orderForm.cargo_weight_kg || '0') || 100,
        volume_m3: parseFloat(orderForm.cargo_volume_m3 || '0') || 1,
        cargo_type: orderForm.cargo_type || 'standard',
        urgency: urgencyValue as 'standard' | 'express' | 'urgent',
        requires_special_handling: Boolean(orderForm.needs_tail_lift || orderForm.needs_straps || orderForm.cargo_type === 'fragile'),
        is_hazardous: orderForm.cargo_type === 'adr',
        is_refrigerated: orderForm.cargo_type === 'refrigerated',
      }
      const result = await calculateAIPrice(orderData)
      setAiSuggestion(result)
      if (result.suggested_price > 0 && !result.error) updateField('price', result.suggested_price.toString())
    } catch (err: any) {
      setAiSuggestion({ suggested_price: 0, confidence: 0, source: 'error', explanation: `შეცდომა: ${err.message}`, local_baseline: 0, error: err.message })
    } finally { setIsCalculatingPrice(false) }
  }

  const handleUseAIPrice = () => { if (aiSuggestion?.suggested_price) updateField('price', aiSuggestion.suggested_price.toString()) }

  const upsertClient = async (): Promise<void> => {
    try {
      const isPrivate = orderForm.client_type === 'private'
      const legacyTable = isPrivate ? 'private_clients' : 'companies'
      const legacyData = isPrivate 
        ? { full_name: orderForm.client_name, personal_id: orderForm.client_personal_id || '', phone: orderForm.client_phone || null, email: orderForm.client_email || null, address: orderForm.client_address || null, is_active: true }
        : { name: orderForm.client_name, registration_number: orderForm.client_registration_number || '', vat_number: orderForm.client_vat || null, phone: orderForm.client_phone || null, email: orderForm.client_email || null, legal_address: orderForm.client_address || null, contact_person: orderForm.pickup_contact || null, is_active: true }
      const clientData = { type: isPrivate ? 'individual' : 'company', name: orderForm.client_name, email: orderForm.client_email || null, phone: orderForm.client_phone || null, address: orderForm.client_address || null, personal_id: orderForm.client_personal_id || null, registration_number: orderForm.client_registration_number || null, vat_number: orderForm.client_vat || null, is_active: true }
      let existingLegacyClient = null
      if (orderForm.client_email) { const { data } = await supabase.from(legacyTable).select('id').eq('email', orderForm.client_email).maybeSingle(); existingLegacyClient = data }
      if (!existingLegacyClient && orderForm.client_phone) { const { data } = await supabase.from(legacyTable).select('id').eq('phone', orderForm.client_phone).maybeSingle(); existingLegacyClient = data }
      if (existingLegacyClient) await supabase.from(legacyTable).update(legacyData).eq('id', existingLegacyClient.id)
      else await supabase.from(legacyTable).insert([legacyData])
      try {
        let existingClient = null
        if (orderForm.client_email) { const { data } = await supabase.from('clients').select('id').eq('email', orderForm.client_email).maybeSingle(); existingClient = data }
        if (!existingClient && orderForm.client_phone) { const { data } = await supabase.from('clients').select('id').eq('phone', orderForm.client_phone).maybeSingle(); existingClient = data }
        if (existingClient) await supabase.from('clients').update(clientData).eq('id', existingClient.id)
        else await supabase.from('clients').insert([clientData])
      } catch (clientsError: any) { console.warn('⚠️ clients ცხრილის შეცდომა:', clientsError.message) }
    } catch (e: any) { console.error('❌ კლიენტის შენახვის შეცდომა:', e) }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try { await upsertClient(); onSubmit(); setShowSuccessPopup(true) }
    catch (error) { console.error('შეკვეთის შექმნის შეცდომა:', error) }
    finally { setIsSubmitting(false) }
  }

  const handleNewOrder = () => {
    setShowSuccessPopup(false); setCurrentStep(1); setAiSuggestion(null); setShowDetailsModal(false); setErrors([])
    setPickupGeocoded(false); setDeliveryGeocoded(false); setPickupGeocodingDone(false); setDeliveryGeocodingDone(false)
    setOrderForm({
      ...orderForm,
      pickup_address: '', delivery_address: '', pickup_date: '', pickup_time: '', delivery_date: '', delivery_time: '',
      pickup_contact: '', delivery_contact: '', pickup_phone: '', delivery_phone: '',
      cargo_description: '', cargo_type: 'standard', cargo_weight_kg: '', cargo_volume_m3: '', cargo_units: '',
      cargo_length_m: '', cargo_width_m: '', cargo_height_m: '', packaging_type: '', returnable_packaging: false,
      transport_type: '', container_number: '', distance_km: '', price: '', currency: 'GEL', payment_terms: '', invoice_needed: false,
      road_fee: '', outside_city_fee: '', waiting_fee_per_hour: '', extra_fees: '',
      client_type: 'private', client_id: '', client_name: '', client_phone: '', client_email: '', client_address: '',
      client_personal_id: '', client_registration_number: '', client_vat: '',
      internal_notes: '', special_requirements: '',
      needs_tail_lift: false, needs_straps: false, needs_bricklaying: false, needs_two_cargo_handlers: false,
    })
  }

  const hasDistance = !!orderForm.distance_km && parseFloat(orderForm.distance_km) > 0
  const canCalculateAI = hasDistance && 
    fieldValidation.cargo_weight_kg === 'valid' && 
    fieldValidation.cargo_volume_m3 === 'valid'

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-5">
            <SectionTitle title="📍 მარშრუტი" icon="" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-3 p-4 bg-gray-800/30 rounded-xl border border-gray-700/30">
                <h4 className="text-[10px] font-bold text-red-400 uppercase tracking-wide flex items-center gap-1">📤 ატვირთვა</h4>
                <FormField label="📍 მისამართი" hint="მაგ: თბილისი, ვაჟა-ფშაველა 10" required textarea value={orderForm.pickup_address} onChange={(e: any) => updateField('pickup_address', e.target.value)} validation={fieldValidation.pickup_address} />
                {orderForm.pickup_address?.trim() && fieldValidation.pickup_address && (
                  <div className={`flex items-center gap-1.5 text-[10px] px-2 py-1 rounded ${fieldValidation.pickup_address === 'valid' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    {fieldValidation.pickup_address === 'valid' ? (<><span>✅</span><span>მისამართი ამოცნობილია</span></>) : (<><span>⚠️</span><span>მისამართი ვერ ამოვიცნეთ, მაგრამ შეგიძლია გააგრძელო</span></>)}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="📅 თარიღი" type="date" required value={orderForm.pickup_date} onChange={(e: any) => updateField('pickup_date', e.target.value)} validation={fieldValidation.pickup_date} />
                  <FormField label="⏰ დრო" type="time" value={orderForm.pickup_time} onChange={(e: any) => updateField('pickup_time', e.target.value)} />
                </div>
                <FormField label="👤 კონტაქტი" hint="სახელი" value={orderForm.pickup_contact} onChange={(e: any) => updateField('pickup_contact', e.target.value)} />
                <FormField label="📞 ტელეფონი" hint="+995..." value={orderForm.pickup_phone} onChange={(e: any) => updateField('pickup_phone', e.target.value)} />
              </div>
              <div className="space-y-3 p-4 bg-gray-800/30 rounded-xl border border-gray-700/30">
                <h4 className="text-[10px] font-bold text-green-400 uppercase tracking-wide flex items-center gap-1">📥 ჩატვირთვა</h4>
                <FormField label="🏁 მისამართი" hint="მაგ: ბათუმი, ჭავჭავაძე 5" required textarea value={orderForm.delivery_address} onChange={(e: any) => updateField('delivery_address', e.target.value)} validation={fieldValidation.delivery_address} />
                {orderForm.delivery_address?.trim() && fieldValidation.delivery_address && (
                  <div className={`flex items-center gap-1.5 text-[10px] px-2 py-1 rounded ${fieldValidation.delivery_address === 'valid' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    {fieldValidation.delivery_address === 'valid' ? (<><span>✅</span><span>მისამართი ამოცნობილია</span></>) : (<><span>⚠️</span><span>მისამართი ვერ ამოვიცნეთ, მაგრამ შეგიძლია გააგრძელო</span></>)}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="📅 თარიღი" type="date" value={orderForm.delivery_date} onChange={(e: any) => updateField('delivery_date', e.target.value)} />
                  <FormField label="⏰ დრო" type="time" value={orderForm.delivery_time} onChange={(e: any) => updateField('delivery_time', e.target.value)} />
                </div>
                <FormField label="👤 კონტაქტი" hint="ვინ იღებს" value={orderForm.delivery_contact} onChange={(e: any) => updateField('delivery_contact', e.target.value)} />
                <FormField label="📞 ტელეფონი" hint="+995..." value={orderForm.delivery_phone} onChange={(e: any) => updateField('delivery_phone', e.target.value)} />
              </div>
            </div>
            {isCalculatingDistance && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-blue-400">მანძილის გამოთვლა...</span>
              </div>
            )}
            {orderForm.distance_km && !isCalculatingDistance && (
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-xs text-green-400 flex items-center gap-2">
                  ✅ მანძილი ავტომატურად გამოითვალა: <strong>{orderForm.distance_km} კმ</strong>
                </p>
              </div>
            )}
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <SectionTitle title="📦 ტვირთი" icon="📦" />
            <div className="p-4 bg-gray-800/30 rounded-xl border border-gray-700/30 space-y-4">
              <h4 className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1 h-3 bg-yellow-400 rounded-full"></span>ძირითადი ინფორმაცია
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                <div className="md:col-span-2 flex flex-col">
                  <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wide">📦 აღწერა <span className="text-red-500">*</span></label>
                  <textarea value={orderForm.cargo_description || ''} onChange={(e: any) => updateField('cargo_description', e.target.value)} placeholder="რას გადავზიდავთ?" className={`flex-1 w-full px-3 py-2.5 bg-gray-800/60 border rounded-lg text-xs text-white outline-none focus:ring-1 transition resize-none placeholder-gray-500 ${fieldValidation.cargo_description === 'valid' ? 'border-green-500 ring-green-500/30' : 'border-gray-600 focus:border-blue-500 focus:ring-blue-500/50'}`} />
                </div>
                <div className="flex flex-col justify-between">
                  <FormField label="🏷️ ტიპი" options={[{ value: 'standard', label: '📦 სტანდარტული' }, { value: 'fragile', label: '💎 მყიფე' }, { value: 'adr', label: '⚠️ ADR' }, { value: 'refrigerated', label: '❄️ მაცივარი' }, { value: 'bulk', label: '🌾 ნაყარი' }]} value={orderForm.cargo_type} onChange={(e: any) => updateField('cargo_type', e.target.value)} />
                  <FormField label="📦 შეფუთვა" options={[{ value: 'box', label: '📦 ყუთი' }, { value: 'pallet', label: '🪵 პალიტი' }, { value: 'bag', label: '🛍️ ტომარა' }, { value: 'bulk', label: '🌾 ნაყარი' }]} value={orderForm.packaging_type} onChange={(e: any) => updateField('packaging_type', e.target.value)} />
                  <FormField label="🔄 დაბრუნებადი ტარა?" checkbox value={orderForm.returnable_packaging} onChange={(e: any) => updateField('returnable_packaging', e.target.checked)} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-900/20 to-cyan-900/20 rounded-xl border border-blue-500/30 space-y-3">
                <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1 h-3 bg-blue-400 rounded-full"></span>ფიზიკური პარამეტრები <span className="text-red-400 ml-1">*</span>
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  <FormField label="⚖️ წონა" type="text" inputMode="decimal" hint="500" suffix="კგ" required value={orderForm.cargo_weight_kg} onChange={(e: any) => updateField('cargo_weight_kg', e.target.value)} validation={fieldValidation.cargo_weight_kg} />
                  <FormField label="📐 მოცულობა" type="text" inputMode="decimal" hint="ავტო" suffix="m³" required value={orderForm.cargo_volume_m3} onChange={(e: any) => updateField('cargo_volume_m3', e.target.value)} validation={fieldValidation.cargo_volume_m3} />
                  <FormField label="🔢 ერთეულები" type="text" inputMode="numeric" hint="10" suffix="ცალი" required value={orderForm.cargo_units} onChange={(e: any) => updateField('cargo_units', e.target.value)} validation={fieldValidation.cargo_units} />
                </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-xl border border-green-500/30 space-y-3">
                <h4 className="text-[10px] font-bold text-green-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1 h-3 bg-green-400 rounded-full"></span>განზომილებები <span className="text-red-400 ml-1">*</span>
                </h4>
                <div className="flex items-end gap-1">
                  <div className="flex-1">
                    <FormField label="↔️ სიგრძე" type="text" inputMode="decimal" hint="0" required value={orderForm.cargo_length_m} onChange={(e: any) => updateField('cargo_length_m', e.target.value)} validation={fieldValidation.cargo_length_m} />
                  </div>
                  <span className="text-gray-500 text-lg font-bold pb-2.5">×</span>
                  <div className="flex-1">
                    <FormField label="↕️ სიგანე" type="text" inputMode="decimal" hint="0" required value={orderForm.cargo_width_m} onChange={(e: any) => updateField('cargo_width_m', e.target.value)} validation={fieldValidation.cargo_width_m} />
                  </div>
                  <span className="text-gray-500 text-lg font-bold pb-2.5">×</span>
                  <div className="flex-1">
                    <FormField label="↕️ სიმაღლე" type="text" inputMode="decimal" hint="0" required value={orderForm.cargo_height_m} onChange={(e: any) => updateField('cargo_height_m', e.target.value)} validation={fieldValidation.cargo_height_m} />
                  </div>
                  <span className="text-[10px] font-semibold text-gray-400 pb-3 whitespace-nowrap">მ</span>
                </div>
                {orderForm.cargo_length_m && orderForm.cargo_width_m && orderForm.cargo_height_m && parseFloat(orderForm.cargo_length_m) > 0 && parseFloat(orderForm.cargo_width_m) > 0 && parseFloat(orderForm.cargo_height_m) > 0 && (
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center justify-between">
                    <span className="text-[11px] text-emerald-300 flex items-center gap-2">📊 მოცულობა:</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">{(parseFloat(orderForm.cargo_length_m) * parseFloat(orderForm.cargo_width_m) * parseFloat(orderForm.cargo_height_m)).toFixed(2)} m³</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <SectionTitle title="💰 ფინანსები" icon="💰" />
            
            {(hasDistance || canCalculateAI) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                {hasDistance && (
                  <div className="p-4 bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border border-blue-500/30 rounded-xl relative overflow-hidden">
                    <div className="absolute -top-8 -right-8 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center"><span className="text-base">🗺️</span></div>
                        <div>
                          <h4 className="text-xs font-bold text-blue-300">გამოთვლილი მანძილი</h4>
                          <p className="text-[9px] text-gray-500">ავტომატურად მისამართებიდან</p>
                        </div>
                      </div>
                      {isCalculatingDistance ? (
                        <div className="flex items-center gap-2 mt-3">
                          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-xs text-blue-400">ითვლება...</span>
                        </div>
                      ) : (
                        <div className="mt-2 flex items-baseline gap-1">
                          <span className="text-3xl font-bold text-white">{orderForm.distance_km}</span>
                          <span className="text-sm text-gray-400">კმ</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {canCalculateAI && (
                  <div className="p-4 bg-gradient-to-br from-purple-900/20 via-indigo-900/20 to-blue-900/20 border border-purple-500/30 rounded-xl relative overflow-hidden">
                    <div className="absolute -top-8 -right-8 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl"></div>
                    <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center"><span className="text-base">🤖</span></div>
                        <div>
                          <h4 className="text-xs font-bold text-purple-300">AI ფასის რეკომენდაცია</h4>
                          <p className="text-[9px] text-gray-500">ფორმულა + AI აგენტი</p>
                        </div>
                      </div>
                      {isCalculatingPrice ? (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-xs text-purple-300">ითვლება...</span>
                        </div>
                      ) : !aiSuggestion ? (
                        <button type="button" onClick={handleGetAIPrice} className="mt-2 w-full px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20">
                          🤖 AI ანალიზი
                        </button>
                      ) : aiSuggestion.error ? (
                        <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                          <p className="text-[10px] text-red-400">❌ {aiSuggestion.explanation}</p>
                          <button type="button" onClick={handleGetAIPrice} className="mt-1.5 w-full px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-[10px] font-medium transition">🔄 ხელახლა ცდა</button>
                        </div>
                      ) : (
                        <>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <div className="flex items-baseline gap-1 flex-1 min-w-0">
                              <span className="text-3xl font-bold text-white truncate">{aiSuggestion.suggested_price}</span>
                              <span className="text-sm text-gray-400">₾</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button type="button" onClick={handleUseAIPrice} className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white rounded-xl transition-all shadow-lg shadow-emerald-500/30 hover:scale-110 active:scale-95 flex items-center justify-center" title="AI ფასის ჩამგდებადი">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                              </button>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${aiSuggestion.confidence >= 0.8 ? 'bg-emerald-400' : aiSuggestion.confidence >= 0.6 ? 'bg-amber-400' : 'bg-rose-400'}`}></div>
                            <span className="text-[9px] text-gray-400">სანდოობა: <span className="text-white font-bold">{Math.round(aiSuggestion.confidence * 100)}%</span></span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!hasDistance && !canCalculateAI && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <h4 className="text-sm font-bold text-amber-300">მანძილი ჯერ არ გამოთვლილა</h4>
                    <p className="text-xs text-amber-400/80 mt-1">
                      დაბრუნდით <strong>ნაბიჯი 1</strong>-ში და შეავსეთ მისამართები. მანძილის გამოთვლის შემდეგ აქ ავტომატურად გამოჩნდება ფასის ბარათები.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <FormField label="💰 საბოლოო ფასი" type="text" inputMode="decimal" required hint="მაგ: 250" value={orderForm.price} onChange={(e: any) => updateField('price', e.target.value)} validation={fieldValidation.price} />
              <FormField label="💵 ვალუტა" required options={[{ value: 'GEL', label: '🇬 GEL' }, { value: 'USD', label: '🇺🇸 USD' }, { value: 'EUR', label: '🇪🇺 EUR' }, { value: 'RUB', label: '🇷🇺 RUB' }]} value={orderForm.currency} onChange={(e: any) => updateField('currency', e.target.value)} validation={fieldValidation.currency} />
              <FormField label="💳 გადახდა" options={[{ value: 'prepaid', label: '💸 წინასწარ' }, { value: 'on_delivery', label: '📦 მიწოდებისას' }, { value: 'invoice', label: '🧾 ინვოისით' }]} value={orderForm.payment_terms} onChange={(e: any) => updateField('payment_terms', e.target.value)} />
              <FormField label="🧾 ინვოისი სჭირდება?" checkbox value={orderForm.invoice_needed} onChange={(e: any) => updateField('invoice_needed', e.target.checked)} />
              <div className="md:col-span-4 pt-3 border-t border-gray-700/30">
                <p className="text-[10px] font-semibold text-gray-400 mb-2 uppercase tracking-wide">💸 დამატებითი ხარჯები (სურვილისამებრ)</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <FormField label="🛣️ გზის" type="text" inputMode="decimal" hint="თუ ცალკეა" value={orderForm.road_fee} onChange={(e: any) => updateField('road_fee', e.target.value)} />
                  <FormField label="🏙️ ქალაქგარე" type="text" inputMode="decimal" hint="დამატებითი" value={orderForm.outside_city_fee} onChange={(e: any) => updateField('outside_city_fee', e.target.value)} />
                  <FormField label="⏰ ლოდინი/სთ" type="text" inputMode="decimal" hint="გადაჭარბებისას" value={orderForm.waiting_fee_per_hour} onChange={(e: any) => updateField('waiting_fee_per_hour', e.target.value)} />
                  <FormField label="🔧 სხვა" type="text" inputMode="decimal" hint="დამატებითი" value={orderForm.extra_fees} onChange={(e: any) => updateField('extra_fees', e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <SectionTitle title="👤 დამკვეთი" icon="👤" />
            <div className="p-3 bg-gray-800/40 rounded-xl border border-gray-700/40">
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                <div className="flex bg-gray-900/50 p-1 rounded-lg shrink-0">
                  {(['private', 'company'] as const).map(tab => (
                    <button key={tab} type="button" onClick={() => { setActiveClientTab(tab); updateField('client_type', tab); updateField('client_id', ''); setShowNewClientForm(false) }} className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wide transition whitespace-nowrap ${activeClientTab === tab ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:text-gray-200'}`}>
                      {tab === 'private' ? '👤 კერძო პირი' : '🏢 კომპანია'}
                    </button>
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  <select value={orderForm.client_id || ''} onChange={(e: any) => {
                    const selectedId = e.target.value
                    if (selectedId) {
                      const source = activeClientTab === 'private' ? clients : companies
                      const sel = source.find((c: any) => c.id === selectedId)
                      if (sel) {
                        setOrderForm({ ...orderForm, client_id: selectedId, client_name: sel.full_name || sel.name || '', client_email: sel.email || '', client_phone: sel.phone || '', client_address: sel.address || sel.legal_address || '', client_personal_id: sel.personal_id || '', client_registration_number: sel.registration_number || '', client_vat: sel.vat_number || '' })
                        setErrors([]); setShowNewClientForm(false)
                      }
                    } else { setOrderForm({ ...orderForm, client_id: '' }) }
                  }} className="w-full px-3 py-2 bg-gray-800/60 border border-gray-600 rounded-lg text-xs text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition">
                    <option value="">🔍 აირჩიე არსებული {activeClientTab === 'private' ? 'კერძო პირი' : 'კომპანია'}...</option>
                    {(activeClientTab === 'private' ? clients : companies).map((c: any) => (
                      <option key={c.id} value={c.id}>{activeClientTab === 'private' ? c.full_name : c.name} {activeClientTab === 'private' && c.personal_id ? ` (${c.personal_id})` : ''} {activeClientTab === 'company' && c.registration_number ? ` (${c.registration_number})` : ''}</option>
                    ))}
                  </select>
                </div>
                <button type="button" onClick={() => { setShowNewClientForm(!showNewClientForm); if (!showNewClientForm) updateField('client_id', '') }} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide transition whitespace-nowrap shrink-0 ${showNewClientForm ? 'bg-gray-600 text-white hover:bg-gray-500' : 'bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600/30'}`}>
                  {showNewClientForm ? '← არსებული' : '➕ ახალი'}
                </button>
              </div>
            </div>

            {!showNewClientForm ? (
              <div className="p-4 bg-purple-500/5 rounded-xl border border-purple-500/20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="სახელი / კომპანია" required value={orderForm.client_name} onChange={(e: any) => updateField('client_name', e.target.value)} validation={fieldValidation.client_name} />
                  <FormField label="📞 ტელეფონი" required value={orderForm.client_phone} onChange={(e: any) => updateField('client_phone', e.target.value)} validation={fieldValidation.client_phone} />
                  <FormField label="📧 ელ-ფოსტა" type="email" value={orderForm.client_email} onChange={(e: any) => updateField('client_email', e.target.value)} />
                  {activeClientTab === 'private' ? (
                    <FormField label="🆔 პირადი ნომერი" value={orderForm.client_personal_id} onChange={(e: any) => updateField('client_personal_id', e.target.value)} />
                  ) : (
                    <FormField label="🆔 საიდ / რეგ. ნომერი" value={orderForm.client_registration_number} onChange={(e: any) => updateField('client_registration_number', e.target.value)} />
                  )}
                  <FormField label="📍 მისამართი" textarea className="md:col-span-2" value={orderForm.client_address} onChange={(e: any) => updateField('client_address', e.target.value)} />
                </div>
              </div>
            ) : (
              <div className="p-4 bg-purple-500/5 rounded-xl border border-purple-500/20 space-y-4">
                <h4 className="text-xs font-bold text-purple-400 flex items-center gap-2"><span className="w-1 h-3 bg-purple-400 rounded-full"></span>✨ ახალი {activeClientTab === 'private' ? 'კერძო პირი' : 'კომპანია'}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label={activeClientTab === 'private' ? "სახელი და გვარი *" : "კომპანიის სახელი *"} required value={orderForm.client_name} onChange={(e: any) => updateField('client_name', e.target.value)} validation={fieldValidation.client_name} />
                  <FormField label="📞 ტელეფონი *" required value={orderForm.client_phone} onChange={(e: any) => updateField('client_phone', e.target.value)} validation={fieldValidation.client_phone} />
                  <FormField label="📧 ელ-ფოსტა" type="email" value={orderForm.client_email} onChange={(e: any) => updateField('client_email', e.target.value)} />
                  {activeClientTab === 'private' ? (
                    <FormField label="🆔 პირადი ნომერი *" required value={orderForm.client_personal_id} onChange={(e: any) => updateField('client_personal_id', e.target.value)} />
                  ) : (
                    <>
                      <FormField label="🆔 საიდ *" required value={orderForm.client_registration_number} onChange={(e: any) => updateField('client_registration_number', e.target.value)} />
                      <FormField label="💼 VAT" value={orderForm.client_vat} onChange={(e: any) => updateField('client_vat', e.target.value)} />
                    </>
                  )}
                  <FormField label="📍 მისამართი" textarea className="md:col-span-2" value={orderForm.client_address} onChange={(e: any) => updateField('client_address', e.target.value)} />
                </div>
              </div>
            )}
          </div>
        )

      case 5:
        return (
          <div className="space-y-5">
            <SectionTitle title="📝 დამატებითი ინფორმაცია" icon="📝" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="📝 შიდა შენიშვნა" hint="დისპეტჩერისთვის" textarea value={orderForm.internal_notes} onChange={(e: any) => updateField('internal_notes', e.target.value)} />
              <FormField label="⚠️ სპეციალური მოთხოვნები" hint="მაგ: ლიფტი, ღვედები..." textarea value={orderForm.special_requirements} onChange={(e: any) => updateField('special_requirements', e.target.value)} />
              <div className="md:col-span-2">
                <p className="text-[10px] font-semibold text-gray-400 mb-2 uppercase tracking-wide">🔧 საჭირო აღჭურვილობა</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <FormField checkbox label="🔽 ლიფტი" value={orderForm.needs_tail_lift} onChange={(e: any) => updateField('needs_tail_lift', e.target.checked)} />
                  <FormField checkbox label="🔗 ღვედები" value={orderForm.needs_straps} onChange={(e: any) => updateField('needs_straps', e.target.checked)} />
                  <FormField checkbox label="🧱 აგურის დალაგება" value={orderForm.needs_bricklaying} onChange={(e: any) => updateField('needs_bricklaying', e.target.checked)} />
                  <FormField checkbox label="👥 2 მზიდავი" value={orderForm.needs_two_cargo_handlers} onChange={(e: any) => updateField('needs_two_cargo_handlers', e.target.checked)} />
                </div>
              </div>
            </div>
          </div>
        )

      case 6:
        return (
          <div className="max-w-3xl mx-auto">
            <SectionTitle title="✅ შეკვეთის დასტური" icon="✅" />
            <p className="text-xs text-gray-400 mb-6 text-center">გადაამოწმე ინფორმაცია და დაადასტურე შეკვეთა</p>
            <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-2">
              <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-xl p-4">
                <h4 className="text-xs font-bold text-red-400 mb-3 flex items-center gap-2">📍 მარშრუტი</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div><p className="text-gray-500 mb-1">📤 ატვირთვა</p><p className="text-white font-medium">{orderForm.pickup_address}</p><p className="text-gray-400 mt-1">{orderForm.pickup_date} {orderForm.pickup_time && `• ${orderForm.pickup_time}`}</p></div>
                  <div><p className="text-gray-500 mb-1">📥 ჩატვირთვა</p><p className="text-white font-medium">{orderForm.delivery_address}</p><p className="text-gray-400 mt-1">{orderForm.delivery_date} {orderForm.delivery_time && `• ${orderForm.delivery_time}`}</p></div>
                </div>
                {orderForm.distance_km && <div className="mt-3 pt-3 border-t border-red-500/20"><p className="text-gray-500 text-[10px]">🗺️ მანძილი</p><p className="text-white font-bold text-lg">{orderForm.distance_km} კმ</p></div>}
              </div>
              <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-4">
                <h4 className="text-xs font-bold text-yellow-400 mb-3 flex items-center gap-2">📦 ტვირთი</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div><p className="text-gray-500">აღწერა</p><p className="text-white font-medium truncate">{orderForm.cargo_description}</p></div>
                  <div><p className="text-gray-500">ტიპი</p><p className="text-white font-medium">{orderForm.cargo_type}</p></div>
                  <div><p className="text-gray-500">წონა</p><p className="text-white font-medium">{orderForm.cargo_weight_kg} კგ</p></div>
                  <div><p className="text-gray-500">მოცულობა</p><p className="text-white font-medium">{orderForm.cargo_volume_m3} m³</p></div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-4">
                <h4 className="text-xs font-bold text-blue-400 mb-3 flex items-center gap-2">💰 ფინანსები</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div><p className="text-gray-500">ფასი</p><p className="text-white font-bold text-lg">{orderForm.price} {orderForm.currency}</p></div>
                  <div><p className="text-gray-500">გადახდა</p><p className="text-white font-medium">{orderForm.payment_terms}</p></div>
                  <div><p className="text-gray-500">ინვოისი</p><p className="text-white font-medium">{orderForm.invoice_needed ? '✅ კი' : '❌ არა'}</p></div>
                  <div><p className="text-gray-500">დამ. ხარჯები</p><p className="text-white font-medium">{(parseFloat(orderForm.road_fee || '0') + parseFloat(orderForm.outside_city_fee || '0') + parseFloat(orderForm.waiting_fee_per_hour || '0') + parseFloat(orderForm.extra_fees || '0')).toFixed(2)} {orderForm.currency}</p></div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4">
                <h4 className="text-xs font-bold text-purple-400 mb-3 flex items-center gap-2">👤 დამკვეთი</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div><p className="text-gray-500">ტიპი</p><p className="text-white font-medium">{orderForm.client_type === 'private' ? '👤 კერძო პირი' : '🏢 კომპანია'}</p></div>
                  <div><p className="text-gray-500">სახელი</p><p className="text-white font-medium">{orderForm.client_name}</p></div>
                  <div><p className="text-gray-500">ტელეფონი</p><p className="text-white font-medium">{orderForm.client_phone}</p></div>
                  <div><p className="text-gray-500">ელ-ფოსტა</p><p className="text-white font-medium truncate">{orderForm.client_email || '–'}</p></div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const renderDetailsModal = () => {
    if (!showDetailsModal || !aiSuggestion) return null
    const breakdown = aiSuggestion.breakdown
    const priceDiff = aiSuggestion.suggested_price - aiSuggestion.local_baseline
    const priceDiffPercent = aiSuggestion.local_baseline > 0 ? Math.round((priceDiff / aiSuggestion.local_baseline) * 100) : 0
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4" onClick={() => setShowDetailsModal(false)}>
        <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 border border-purple-500/30 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
          <div className="px-6 py-4 border-b border-purple-500/20 bg-gradient-to-r from-purple-900/30 via-blue-900/30 to-indigo-900/30 shrink-0 flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">📊 ფასის დეტალური ანალიზი</h3>
              <p className="text-[11px] text-gray-400 mt-1">ფორმულა + AI აგენტის სრული გამოთვლა</p>
            </div>
            <button onClick={() => setShowDetailsModal(false)} className="w-9 h-9 bg-red-500/10 hover:bg-red-500/30 border border-red-500/30 rounded-full flex items-center justify-center transition-all hover:rotate-90 duration-300">
              <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-800/60 border border-slate-700 rounded-xl">
                <p className="text-[9px] text-slate-400 uppercase">ფორმულით</p>
                <p className="text-3xl font-bold text-white mt-2">{aiSuggestion.local_baseline} <span className="text-sm text-gray-400">₾</span></p>
              </div>
              <div className="p-4 bg-purple-900/40 border border-purple-500/40 rounded-xl">
                <p className="text-[9px] text-purple-300 uppercase">AI რეკომენდაცია</p>
                <p className="text-3xl font-bold text-white mt-2">{aiSuggestion.suggested_price} <span className="text-sm text-gray-400">₾</span></p>
                {priceDiff !== 0 && <p className={`text-[11px] font-bold mt-1 ${priceDiff < 0 ? 'text-emerald-400' : 'text-amber-400'}`}>{priceDiff < 0 ? '↓' : '↑'} {Math.abs(priceDiff)} ₾ ({priceDiffPercent}%)</p>}
              </div>
            </div>
            {breakdown && (
              <div className="p-5 bg-slate-800/40 border border-slate-700 rounded-xl space-y-2">
                <h4 className="text-sm font-bold text-white mb-3">💻 ფორმულის Breakdown</h4>
                <div className="flex justify-between py-2 px-3 bg-slate-800/60 rounded-lg"><span className="text-slate-300">📦 ბაზის ფასი</span><span className="text-slate-100 font-mono">{breakdown.base_price?.toFixed(2)} ₾</span></div>
                <div className="flex justify-between py-2 px-3 bg-slate-800/60 rounded-lg"><span className="text-slate-300">📏 მანძილი ({orderForm.distance_km} კმ)</span><span className="text-slate-100 font-mono">{breakdown.distance_fee?.toFixed(2)} ₾</span></div>
                <div className="flex justify-between py-2 px-3 bg-slate-800/60 rounded-lg"><span className="text-slate-300">⚖️ წონა</span><span className="text-slate-100 font-mono">{breakdown.weight_fee?.toFixed(2)} ₾</span></div>
                <div className="flex justify-between py-2 px-3 bg-slate-800/60 rounded-lg"><span className="text-slate-300">📦 მოცულობა</span><span className="text-slate-100 font-mono">{breakdown.volume_fee?.toFixed(2)} ₾</span></div>
                <div className="flex justify-between py-3 px-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg mt-3"><span className="text-emerald-300 font-bold">💰 ჯამი:</span><span className="text-2xl font-bold text-emerald-400 font-mono">{aiSuggestion.local_baseline?.toFixed(2)} ₾</span></div>
              </div>
            )}
            <div className="p-5 bg-purple-900/30 border border-purple-500/30 rounded-xl">
              <h4 className="text-sm font-bold text-white mb-2">🤖 AI ანალიზი</h4>
              <p className="text-sm text-slate-200">{aiSuggestion.explanation}</p>
            </div>
          </div>
          <div className="px-6 py-4 border-t border-purple-500/20 bg-slate-900/50 shrink-0">
            <button type="button" onClick={() => setShowDetailsModal(false)} className="w-full px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition">დახურვა</button>
          </div>
        </div>
      </div>
    )
  }

  if (showSuccessPopup) {
    return (
      <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-[#1a202c] border border-emerald-500/30 rounded-2xl w-full max-w-md shadow-2xl">
          <div className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-emerald-500/20 rounded-full flex items-center justify-center border-2 border-emerald-500/30">
              <span className="text-5xl animate-bounce">✅</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">შეკვეთა წარმატებით შეიქმნა!</h3>
            <p className="text-sm text-gray-400 mb-6">შეკვეთა #{orderForm.id || 'ახალი'} წარმატებით დაემატა სისტემაში</p>
            <div className="bg-gray-800/50 rounded-xl p-4 mb-6 text-left space-y-2">
              <div className="flex justify-between text-xs"><span className="text-gray-400">📍 მარშრუტი:</span><span className="text-white font-medium">{orderForm.pickup_address?.split(',')[0]} → {orderForm.delivery_address?.split(',')[0]}</span></div>
              <div className="flex justify-between text-xs"><span className="text-gray-400">💰 ფასი:</span><span className="text-emerald-400 font-bold">{orderForm.price} {orderForm.currency}</span></div>
              <div className="flex justify-between text-xs"><span className="text-gray-400">👤 დამკვეთი:</span><span className="text-white font-medium">{orderForm.client_name}</span></div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-sm font-medium transition">დახურვა</button>
              <button type="button" onClick={handleNewOrder} className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl text-sm font-bold transition">➕ ახალი შეკვეთა</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {renderDetailsModal()}
      <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
        <div className="bg-[#1a202c] border border-gray-700 rounded-2xl w-full max-w-4xl my-8 flex flex-col shadow-2xl relative" onClick={e => e.stopPropagation()}>
          <div className="px-6 py-3 border-b border-gray-700 bg-[#151b26] sticky top-0 z-10 rounded-t-2xl">
            <div className="flex items-center gap-4">
              <div className="shrink-0">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">📦 ახალი შეკვეთა</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">ნაბიჯი {currentStep} / {totalSteps} — {currentStepConfig.title}</p>
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
              <button onClick={onClose} className="text-gray-400 hover:text-white text-xl transition p-1 hover:bg-gray-700 rounded-lg shrink-0">&times;</button>
            </div>
          </div>

          <div className="p-6">{renderStepContent()}</div>

          <div className="px-6 py-4 border-t border-gray-700 bg-[#151b26] sticky bottom-0 rounded-b-2xl">
            <div className="flex justify-between items-center">
              <button type="button" onClick={handleBack} disabled={currentStep === 1} className={`px-5 py-2.5 rounded-lg text-xs font-medium transition ${currentStep === 1 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>← უკან</button>
              <div className="flex gap-3">
                <button type="button" onClick={onClose} className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-medium transition text-white">გაუქმება</button>
                {currentStep < totalSteps ? (
                  <button type="button" onClick={handleNext} disabled={isNextDisabled} className={`px-6 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${isNextDisabled ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 text-white'}`}>
                    შემდეგი →
                  </button>
                ) : (
                  <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-bold transition shadow-lg shadow-emerald-500/20 text-white flex items-center gap-2">
                    {isSubmitting ? <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>იქმნება...</> : <>✅ შეკვეთის შექმნა</>}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}