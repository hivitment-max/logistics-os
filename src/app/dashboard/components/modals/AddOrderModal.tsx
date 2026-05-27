'use client'

import { useState } from 'react'

// ============================================================================
// 🧩 Helper Components
// ============================================================================

const FormField = ({ 
  label, hint, required, type = 'text', value, onChange, options, textarea, checkbox, radio, file, className = ''
}: any) => {
  if (checkbox) {
    return (
      <div className={`flex items-center gap-2 p-3 bg-gray-700/30 rounded-lg border border-gray-600 ${className}`}>
        <input type="checkbox" checked={!!value} onChange={onChange} className="w-4 h-4 accent-blue-500 rounded" />
        <label className="text-xs text-gray-300 select-none">{label}</label>
      </div>
    )
  }
  if (radio && options) {
    return (
      <div className={className}>
        <label className="block text-[10px] font-semibold text-gray-400 mb-2 uppercase tracking-wide">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
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
        <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wide">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center hover:border-blue-500/50 transition cursor-pointer" onClick={() => document.getElementById('file-input')?.click()}>
          <input id="file-input" type="file" onChange={onChange} className="hidden" accept=".pdf,.jpg,.png" />
          <span className="text-2xl">📎</span>
          <p className="text-xs text-gray-400 mt-1">{hint || 'დააჭირე ატვირთვისთვის'}</p>
        </div>
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
        <input type={type} value={value || ''} onChange={onChange} placeholder={hint} required={required} className="w-full px-3 py-2.5 bg-gray-800/60 border border-gray-600 rounded-lg text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition placeholder-gray-500" />
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
// 🔍 VALIDATION HELPERS
// ============================================================================

const validateStep = (step: number, form: any): string[] => {
  const errors: string[] = []
  if (step === 1) {
    if (!form.pickup_address?.trim()) errors.push('ატვირთვის მისამართი სავალდებულოა')
    if (!form.delivery_address?.trim()) errors.push('ჩატვირთვის მისამართი სავალდებულოა')
    if (!form.pickup_date) errors.push('ატვირთვის თარიღი სავალდებულოა')
  }
  if (step === 2) {
    if (!form.cargo_description?.trim()) errors.push('ტვირთის აღწერა სავალდებულოა')
  }
  if (step === 3) {
    if (!form.price) errors.push('ფასი სავალდებულოა')
    if (!form.currency) errors.push('ვალუტა სავალდებულოა')
  }
  if (step === 4) {
    if (!form.client_name?.trim()) errors.push('დამკვეთის სახელი სავალდებულოა')
    if (!form.client_phone?.trim()) errors.push('დამკვეთის ტელეფონი სავალდებულოა')
  }
  return errors
}

// ============================================================================
// 📦 ADD ORDER MODAL - FINAL VERSION (Beautiful Compact Preview)
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

export default function AddOrderModal({ 
  isOpen, onClose, orderForm, setOrderForm, onSubmit, clients = [], companies = []
}: AddOrderModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [activeClientTab, setActiveClientTab] = useState<'private' | 'company'>('private')
  const [showNewClientForm, setShowNewClientForm] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  if (!isOpen) return null

  const totalSteps = STEPS.length
  const currentStepConfig = STEPS[currentStep - 1]

  const updateField = (field: string, value: any) => {
    setOrderForm({ ...orderForm, [field]: value })
    setErrors([])
  }

  const handleNext = () => {
    const stepErrors = validateStep(currentStep, orderForm)
    if (stepErrors.length > 0) { setErrors(stepErrors); return }
    setErrors([])
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1)
  }

  const handleBack = () => {
    if (currentStep > 1) { setCurrentStep(currentStep - 1); setErrors([]) }
  }

  const handleSubmit = () => { onSubmit(); setCurrentStep(1) }

  // ============================================================================
  // RENDER STEPS
  // ============================================================================

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-5">
            <SectionTitle title="📍 მარშრუტი" icon="" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-3 p-4 bg-gray-800/30 rounded-xl border border-gray-700/30">
                <h4 className="text-[10px] font-bold text-red-400 uppercase tracking-wide flex items-center gap-1">📤 ატვირთვა</h4>
                <FormField label="📍 მისამართი" hint="სრული მისამართი" required textarea value={orderForm.pickup_address} onChange={(e: any) => updateField('pickup_address', e.target.value)} />
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="📅 თარიღი" type="date" required value={orderForm.pickup_date} onChange={(e: any) => updateField('pickup_date', e.target.value)} />
                  <FormField label="⏰ დრო" type="time" value={orderForm.pickup_time} onChange={(e: any) => updateField('pickup_time', e.target.value)} />
                </div>
                <FormField label="👤 კონტაქტი" hint="სახელი" value={orderForm.pickup_contact} onChange={(e: any) => updateField('pickup_contact', e.target.value)} />
                <FormField label="📞 ტელეფონი" hint="+995..." value={orderForm.pickup_phone} onChange={(e: any) => updateField('pickup_phone', e.target.value)} />
              </div>
              <div className="space-y-3 p-4 bg-gray-800/30 rounded-xl border border-gray-700/30">
                <h4 className="text-[10px] font-bold text-green-400 uppercase tracking-wide flex items-center gap-1">📥 ჩატვირთვა</h4>
                <FormField label="🏁 მისამართი" hint="სრული მისამართი" required textarea value={orderForm.delivery_address} onChange={(e: any) => updateField('delivery_address', e.target.value)} />
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="📅 თარიღი" type="date" value={orderForm.delivery_date} onChange={(e: any) => updateField('delivery_date', e.target.value)} />
                  <FormField label="⏰ დრო" type="time" value={orderForm.delivery_time} onChange={(e: any) => updateField('delivery_time', e.target.value)} />
                </div>
                <FormField label="👤 კონტაქტი" hint="ვინ იღებს" value={orderForm.delivery_contact} onChange={(e: any) => updateField('delivery_contact', e.target.value)} />
                <FormField label="📞 ტელეფონი" hint="+995..." value={orderForm.delivery_phone} onChange={(e: any) => updateField('delivery_phone', e.target.value)} />
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-5">
            <SectionTitle title="📦 ტვირთი" icon="📦" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="📦 აღწერა" hint="რას გადავზიდავთ?" required textarea className="md:col-span-2" value={orderForm.cargo_description} onChange={(e: any) => updateField('cargo_description', e.target.value)} />
              <FormField label="🏷️ ტიპი" options={[{ value: 'standard', label: '📦 სტანდარტული' }, { value: 'fragile', label: '💎 მყიფე' }, { value: 'adr', label: '⚠️ ADR' }, { value: 'refrigerated', label: '❄️ მაცივარი' }, { value: 'bulk', label: '🌾 ნაყარი' }]} value={orderForm.cargo_type} onChange={(e: any) => updateField('cargo_type', e.target.value)} />
              <FormField label="⚖️ წონა (კგ)" type="number" hint="მაგ: 500" value={orderForm.cargo_weight_kg} onChange={(e: any) => updateField('cargo_weight_kg', e.target.value)} />
              <FormField label="📐 მოცულობა (m³)" type="number" hint="მაგ: 12.5" value={orderForm.cargo_volume_m3} onChange={(e: any) => updateField('cargo_volume_m3', e.target.value)} />
              <FormField label="🔢 ერთეულები" type="number" hint="რაოდენობა" value={orderForm.cargo_units} onChange={(e: any) => updateField('cargo_units', e.target.value)} />
              <div className="md:col-span-3">
                <p className="text-[10px] font-semibold text-gray-400 mb-2 uppercase tracking-wide">📏 განზომილებები (სურვილისამებრ)</p>
                <div className="grid grid-cols-3 gap-3">
                  <FormField label="სიგრძე (მ)" type="number" value={orderForm.cargo_length_m} onChange={(e: any) => updateField('cargo_length_m', e.target.value)} />
                  <FormField label="სიგანე (მ)" type="number" value={orderForm.cargo_width_m} onChange={(e: any) => updateField('cargo_width_m', e.target.value)} />
                  <FormField label="სიმაღლე (მ)" type="number" value={orderForm.cargo_height_m} onChange={(e: any) => updateField('cargo_height_m', e.target.value)} />
                </div>
              </div>
              <FormField label="📦 შეფუთვა" options={[{ value: 'box', label: '📦 ყუთი' }, { value: 'pallet', label: '🪵 პალიტი' }, { value: 'bag', label: '🛍️ ტომარა' }, { value: 'bulk', label: '🌾 ნაყარი' }]} value={orderForm.packaging_type} onChange={(e: any) => updateField('packaging_type', e.target.value)} />
              <FormField label="🔄 დაბრუნებადი ტარა?" checkbox value={orderForm.returnable_packaging} onChange={(e: any) => updateField('returnable_packaging', e.target.checked)} />
              
              {/* ✅ ახალი ველები: გადაზიდვის სახეობა და კონტეინერის ნომერი */}
              <div className="md:col-span-3 pt-3 border-t border-gray-700/30 mt-2">
                <p className="text-[10px] font-semibold text-gray-400 mb-2 uppercase tracking-wide">🚛 გადაზიდვის დეტალები</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField 
                    label="გადაზიდვის სახეობა" 
                    options={[
                      { value: 'road_ftl', label: '🚛 სახმელეთო / FTL' },
                      { value: 'road_ltl', label: '🚚 სახმელეთო / LTL' },
                      { value: 'sea', label: '🚢 საზღვაო' },
                      { value: 'air', label: '✈️ ავია' },
                      { value: 'rail', label: '🚆 რკინიგზა' },
                      { value: 'multimodal', label: '🔄 მულტიმოდალური' },
                    ]} 
                    value={orderForm.transport_type} 
                    onChange={(e: any) => updateField('transport_type', e.target.value)} 
                  />
                  <FormField 
                    label="კონტეინერის/ტრეილერის ნომერი" 
                    hint="მაგ: AN008BL-AN004B, MSCU1234567"
                    value={orderForm.container_number} 
                    onChange={(e: any) => updateField('container_number', e.target.value)} 
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-5">
            <SectionTitle title="💰 ფინანსები" icon="💰" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <FormField label="💰 ფასი" type="number" required hint="მაგ: 250" value={orderForm.price} onChange={(e: any) => updateField('price', e.target.value)} />
              <FormField label="💵 ვალუტა" required options={[{ value: 'GEL', label: '🇬🇪 GEL' }, { value: 'USD', label: '🇺🇸 USD' }, { value: 'EUR', label: '🇪🇺 EUR' }, { value: 'RUB', label: '🇷🇺 RUB' }]} value={orderForm.currency} onChange={(e: any) => updateField('currency', e.target.value)} />
              <FormField label="💳 გადახდა" options={[{ value: 'prepaid', label: '💸 წინასწარ' }, { value: 'on_delivery', label: '📦 მიწოდებისას' }, { value: 'invoice', label: '🧾 ინვოისით' }]} value={orderForm.payment_terms} onChange={(e: any) => updateField('payment_terms', e.target.value)} />
              <FormField label="🧾 ინვოისი სჭირდება?" checkbox value={orderForm.invoice_needed} onChange={(e: any) => updateField('invoice_needed', e.target.checked)} />
              <div className="md:col-span-4 pt-3 border-t border-gray-700/30">
                <p className="text-[10px] font-semibold text-gray-400 mb-2 uppercase tracking-wide">💸 დამატებითი ხარჯები (სურვილისამებრ)</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <FormField label="🛣️ გზის" type="number" hint="თუ ცალკეა" value={orderForm.road_fee} onChange={(e: any) => updateField('road_fee', e.target.value)} />
                  <FormField label="🏙️ ქალაქგარე" type="number" hint="დამატებითი" value={orderForm.outside_city_fee} onChange={(e: any) => updateField('outside_city_fee', e.target.value)} />
                  <FormField label="⏰ ოდინის/სთ" type="number" hint="გადაჭარბებისას" value={orderForm.waiting_fee_per_hour} onChange={(e: any) => updateField('waiting_fee_per_hour', e.target.value)} />
                  <FormField label="🔧 სხვა" type="number" hint="დამატებითი" value={orderForm.extra_fees} onChange={(e: any) => updateField('extra_fees', e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-5">
            <SectionTitle title="👤 დამკვეთი" icon="👤" />
            <div className="flex bg-gray-800/50 p-1 rounded-lg w-fit">
              {(['private', 'company'] as const).map(tab => (
                <button key={tab} type="button" onClick={() => { setActiveClientTab(tab); updateField('client_type', tab) }}
                  className={`px-5 py-2 rounded-md text-[10px] font-bold uppercase tracking-wide transition ${activeClientTab === tab ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:text-gray-200'}`}>
                  {tab === 'private' ? '👤 კერძო პირი' : '🏢 კომპანია'}
                </button>
              ))}
            </div>
            {!showNewClientForm ? (
              <>
                <FormField label="🔍 აირჩიე არსებული დამკვეთი" options={(activeClientTab === 'private' ? clients : companies).map((c: any) => ({ value: c.id, label: `${activeClientTab === 'private' ? c.full_name : c.name} (${activeClientTab === 'private' ? c.personal_id : c.registration_number})` }))} value={orderForm.client_id} onChange={(e: any) => {
                  const selectedId = e.target.value; updateField('client_id', selectedId)
                  if (selectedId) {
                    const source = activeClientTab === 'private' ? clients : companies
                    const sel = source.find((c: any) => c.id === selectedId)
                    if (sel) { updateField('client_name', sel.full_name || sel.name); updateField('client_email', sel.email); updateField('client_phone', sel.phone); updateField('client_address', sel.address || sel.legal_address) }
                  }
                }} />
                <button type="button" onClick={() => setShowNewClientForm(true)} className="text-xs text-purple-400 hover:text-purple-300 underline">➕ ახალი დამკვეთის დამატება</button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-purple-500/5 rounded-xl border border-purple-500/20">
                  <FormField label="სახელი / კომპანია" required value={orderForm.client_name} onChange={(e: any) => updateField('client_name', e.target.value)} />
                  <FormField label="📞 ტელეფონი" required value={orderForm.client_phone} onChange={(e: any) => updateField('client_phone', e.target.value)} />
                  <FormField label="📧 ელ-ფოსტა" type="email" value={orderForm.client_email} onChange={(e: any) => updateField('client_email', e.target.value)} />
                  {activeClientTab === 'private' ? <FormField label="🆔 პირადი ნომერი" value={orderForm.client_personal_id} onChange={(e: any) => updateField('client_personal_id', e.target.value)} /> : <FormField label="🆔 საიდ / რეგ. ნომერი" value={orderForm.client_registration_number} onChange={(e: any) => updateField('client_registration_number', e.target.value)} />}
                  <FormField label="📍 მისამართი" textarea className="md:col-span-2" value={orderForm.client_address} onChange={(e: any) => updateField('client_address', e.target.value)} />
                </div>
              </>
            ) : (
              <div className="space-y-4 p-4 bg-purple-500/5 rounded-xl border border-purple-500/20">
                <h4 className="text-xs font-bold text-purple-400">✨ ახალი {activeClientTab === 'private' ? 'კერძო პირი' : 'კომპანია'}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label={activeClientTab === 'private' ? "სახელი და გვარი *" : "კომპანიის სახელი *"} required value={orderForm.client_name} onChange={(e: any) => updateField('client_name', e.target.value)} />
                  <FormField label="📞 ტელეფონი *" required value={orderForm.client_phone} onChange={(e: any) => updateField('client_phone', e.target.value)} />
                  <FormField label="📧 ელ-ფოსტა" type="email" value={orderForm.client_email} onChange={(e: any) => updateField('client_email', e.target.value)} />
                  {activeClientTab === 'private' ? <FormField label="🆔 პირადი ნომერი *" required value={orderForm.client_personal_id} onChange={(e: any) => updateField('client_personal_id', e.target.value)} /> : <><FormField label="🆔 საიდ *" required value={orderForm.client_registration_number} onChange={(e: any) => updateField('client_registration_number', e.target.value)} /><FormField label="💼 VAT" value={orderForm.client_vat} onChange={(e: any) => updateField('client_vat', e.target.value)} /></>}
                  <FormField label="📍 მისამართი" textarea className="md:col-span-2" value={orderForm.client_address} onChange={(e: any) => updateField('client_address', e.target.value)} />
                </div>
                <button type="button" onClick={() => setShowNewClientForm(false)} className="text-xs text-gray-400 hover:text-gray-200 underline">← უკან, არსებულის არჩევა</button>
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
              <FormField label="📎 დოკუმენტი" hint="PDF, JPG, PNG" file className="md:col-span-2" onChange={(e: any) => { const file = e.target.files?.[0]; if (file) updateField('attachment', file) }} />
            </div>
          </div>
        )

      // ✅ CASE 6: COMPACT & BEAUTIFUL REVIEW PREVIEW
      case 6:
        return (
          <div className="max-w-3xl mx-auto">
            <SectionTitle title="✅ შეკვეთის დასტური" icon="✅" />
            <p className="text-xs text-gray-400 mb-6 text-center">გადაამოწმე ინფორმაცია და დაადასტურე შეკვეთა</p>
            
            <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-2">
              
              {/* მარშრუტი */}
              <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-xl p-4">
                <h4 className="text-xs font-bold text-red-400 mb-3 flex items-center gap-2">📍 მარშრუტი</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-gray-500 mb-1">📤 ატვირთვა</p>
                    <p className="text-white font-medium">{orderForm.pickup_address}</p>
                    <p className="text-gray-400 mt-1">{orderForm.pickup_date} {orderForm.pickup_time && `• ${orderForm.pickup_time}`}</p>
                    <p className="text-gray-400">{orderForm.pickup_contact} {orderForm.pickup_phone && `• ${orderForm.pickup_phone}`}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">📥 ჩატვირთვა</p>
                    <p className="text-white font-medium">{orderForm.delivery_address}</p>
                    <p className="text-gray-400 mt-1">{orderForm.delivery_date} {orderForm.delivery_time && `• ${orderForm.delivery_time}`}</p>
                    <p className="text-gray-400">{orderForm.delivery_contact} {orderForm.delivery_phone && `• ${orderForm.delivery_phone}`}</p>
                  </div>
                </div>
              </div>

              {/* ტვირთი */}
              <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-4">
                <h4 className="text-xs font-bold text-yellow-400 mb-3 flex items-center gap-2">📦 ტვირთი</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div><p className="text-gray-500">აღწერა</p><p className="text-white font-medium truncate">{orderForm.cargo_description}</p></div>
                  <div><p className="text-gray-500">ტიპი</p><p className="text-white font-medium">{orderForm.cargo_type}</p></div>
                  <div><p className="text-gray-500">წონა</p><p className="text-white font-medium">{orderForm.cargo_weight_kg} კგ</p></div>
                  <div><p className="text-gray-500">მოცულობა</p><p className="text-white font-medium">{orderForm.cargo_volume_m3} m³</p></div>
                </div>
              </div>

              {/* ფინანსები */}
              <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-4">
                <h4 className="text-xs font-bold text-blue-400 mb-3 flex items-center gap-2">💰 ფინანსები</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div><p className="text-gray-500">ფასი</p><p className="text-white font-bold text-lg">{orderForm.price} {orderForm.currency}</p></div>
                  <div><p className="text-gray-500">გადახდა</p><p className="text-white font-medium">{orderForm.payment_terms}</p></div>
                  <div><p className="text-gray-500">ინვოისი</p><p className="text-white font-medium">{orderForm.invoice_needed ? '✅ კი' : '❌ არა'}</p></div>
                  <div><p className="text-gray-500">დამ. ხარჯები</p><p className="text-white font-medium">{(parseFloat(orderForm.road_fee || '0') + parseFloat(orderForm.outside_city_fee || '0') + parseFloat(orderForm.waiting_fee_per_hour || '0') + parseFloat(orderForm.extra_fees || '0')).toFixed(2)} {orderForm.currency}</p></div>
                </div>
              </div>

              {/* დამკვეთი */}
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4">
                <h4 className="text-xs font-bold text-purple-400 mb-3 flex items-center gap-2">👤 დამკვეთი</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div><p className="text-gray-500">ტიპი</p><p className="text-white font-medium">{orderForm.client_type === 'private' ? '👤 კერძო პირი' : '🏢 კომპანია'}</p></div>
                  <div><p className="text-gray-500">სახელი</p><p className="text-white font-medium">{orderForm.client_name}</p></div>
                  <div><p className="text-gray-500">ტელეფონი</p><p className="text-white font-medium">{orderForm.client_phone}</p></div>
                  <div><p className="text-gray-500">ელ-ფოსტა</p><p className="text-white font-medium truncate">{orderForm.client_email || '–'}</p></div>
                </div>
              </div>

              {/* დამატებითი */}
              {(orderForm.special_requirements || orderForm.needs_tail_lift || orderForm.needs_straps || orderForm.transport_type || orderForm.container_number) && (
                <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-green-400 mb-3 flex items-center gap-2">📝 დამატებითი</h4>
                  {orderForm.special_requirements && <div className="mb-2"><p className="text-gray-500 text-[10px]">მოთხოვნები</p><p className="text-white text-xs">{orderForm.special_requirements}</p></div>}
                  <div className="flex flex-wrap gap-2">
                    {orderForm.needs_tail_lift && <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-[10px]">🔽 ლიფტი</span>}
                    {orderForm.needs_straps && <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-[10px]">🔗 ღვედები</span>}
                    {orderForm.needs_bricklaying && <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-[10px]">🧱 აგური</span>}
                    {orderForm.needs_two_cargo_handlers && <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-[10px]">👥 2 მზიდავი</span>}
                    {orderForm.transport_type && <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-[10px]">🚛 {orderForm.transport_type}</span>}
                    {orderForm.container_number && <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-[10px]">📦 {orderForm.container_number}</span>}
                  </div>
                </div>
              )}

              {/* პრიორიტეტი */}
              <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-4">
                <h4 className="text-xs font-bold text-emerald-400 mb-3 flex items-center gap-2">🔥 პრიორიტეტი & სტატუსი</h4>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div><p className="text-gray-500">პრიორიტეტი</p><p className="text-white font-medium capitalize">{orderForm.priority}</p></div>
                  <div><p className="text-gray-500">სტატუსი</p><p className="text-white font-medium capitalize">{orderForm.status || 'pending'}</p></div>
                  <div><p className="text-gray-500">შეტყობინება</p><p className="text-white font-medium">{orderForm.notify_client !== false ? '✅ კი' : '❌ არა'}</p></div>
                </div>
              </div>

            </div>
          </div>
        )

      default:
        return null
    }
  }

  // ============================================================================
  // RENDER - FINAL STRUCTURE (100% Working Scroll)
  // ============================================================================

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-[#1a202c] border border-gray-700 rounded-2xl w-full max-w-4xl my-8 flex flex-col shadow-2xl shadow-black/50 relative" onClick={e => e.stopPropagation()}>
        
        {/* 🔝 Header */}
        <div className="px-6 py-4 border-b border-gray-700 bg-[#151b26] sticky top-0 z-10 rounded-t-2xl">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">📦 ახალი შეკვეთა</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">ნაბიჯი {currentStep} / {totalSteps} — {currentStepConfig.title}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-xl transition p-1 hover:bg-gray-700 rounded-lg">&times;</button>
          </div>
          {/* Progress Bar */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {STEPS.map((step, i) => {
              const isCompleted = currentStep > step.id
              const isCurrent = currentStep === step.id
              const stepColor = isCompleted ? 'emerald' : isCurrent ? step.color : 'gray'
              return (
                <div key={step.id} className="flex items-center flex-1 min-w-[60px]">
                  <div className="flex flex-col items-center relative z-10">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all duration-300 ${COLOR_MAP[stepColor]}`}>
                      {isCompleted ? '✓' : step.id}
                    </div>
                    <span className={`text-[8px] mt-1 font-medium hidden md:block whitespace-nowrap ${isCurrent ? 'text-white' : 'text-gray-500'}`}>{step.title}</span>
                  </div>
                  {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-1 rounded-full transition-all duration-500 ${currentStep > step.id ? LINE_COLOR_MAP['emerald'] : 'bg-gray-700'}`} />}
                </div>
              )
            })}
          </div>
        </div>

        {/* 📜 Content */}
        <div className="p-6">
          {errors.length > 0 && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-xs font-bold text-red-400 mb-1">⚠️ შეავსე სავალდებულო ველები:</p>
              <ul className="text-[10px] text-red-300 space-y-0.5">{errors.map((err, i) => <li key={i}>• {err}</li>)}</ul>
            </div>
          )}
          {renderStepContent()}
        </div>

        {/* 🔽 Footer */}
        <div className="px-6 py-4 border-t border-gray-700 bg-[#151b26] sticky bottom-0 rounded-b-2xl">
          <div className="flex justify-between items-center">
            <button type="button" onClick={handleBack} disabled={currentStep === 1} className={`px-5 py-2.5 rounded-lg text-xs font-medium transition flex items-center gap-2 ${currentStep === 1 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>← უკან</button>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-medium transition text-white">გაუქმება</button>
              {currentStep < totalSteps ? (
                <button type="button" onClick={handleNext} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold transition shadow-lg shadow-blue-500/20 text-white flex items-center gap-2">შემდეგი →</button>
              ) : (
                <button type="button" onClick={handleSubmit} className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 rounded-lg text-xs font-bold transition shadow-lg shadow-emerald-500/20 text-white flex items-center gap-2">✅ შეკვეთის შექმნა</button>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}