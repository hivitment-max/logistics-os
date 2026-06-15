'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

// ============================================================================
// 🎨 UI კომპონენტები
// ============================================================================
interface InputProps {
  label: string
  type?: string
  value: string | number
  onChange: (value: string) => void
  placeholder?: string
  hint?: string
  disabled?: boolean
}

export const Input = ({ label, type = 'text', value, onChange, placeholder, hint, disabled }: InputProps) => (
  <div className="space-y-1">
    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</label>
    <input
      type={type}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition disabled:opacity-50"
    />
    {hint && <p className="text-[9px] text-gray-500">{hint}</p>}
  </div>
)

interface ToggleProps {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
  description?: string
  disabled?: boolean
}

export const Toggle = ({ label, checked, onChange, description, disabled }: ToggleProps) => (
  <div className="flex items-start justify-between p-3 bg-gray-900/30 rounded-lg border border-gray-800">
    <div>
      <div className="text-xs font-medium text-gray-300">{label}</div>
      <div className="text-[9px] text-gray-500 mt-0.5">{description}</div>
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`relative w-9 h-5 rounded-full transition-colors duration-200 disabled:opacity-50 ${checked ? 'bg-blue-600' : 'bg-gray-700'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  </div>
)

interface SelectProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  disabled?: boolean
}

export const Select = ({ label, value, onChange, options, disabled }: SelectProps) => (
  <div className="space-y-1">
    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500 transition disabled:opacity-50"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
)

// ============================================================================
// 📋 შეკვეთების სვეტების კონფიგურაცია
// ============================================================================
export interface OrderColumnConfig {
  id: string
  label: string
  icon: string
  visible: boolean
  required: boolean
  description: string
  fixed?: 'left' | 'right'
}

export const DEFAULT_ORDER_COLUMNS: OrderColumnConfig[] = [
  { id: 'checkbox', label: 'მონიშვნა', icon: '☑️', visible: true, required: true, fixed: 'left', description: 'Checkbox მასობრივი მოქმედებებისთვის' },
  { id: 'tracking', label: 'Tracking კოდი', icon: '🔢', visible: true, required: true, fixed: 'left', description: 'შეკვეთის უნიკალური კოდი და თარიღი' },
  { id: 'route', label: 'მარშრუტი', icon: '🗺️', visible: true, required: false, description: 'აღების და მიწოდების მისამართები' },
  { id: 'cargo', label: 'ტვირთი', icon: '📦', visible: true, required: false, description: 'ტვირთის აღწერა და წონა' },
  { id: 'driver', label: 'მძღოლი / მანქანა', icon: '🚚', visible: true, required: false, description: 'მძღოლის სახელი და მანქანის ნომერი' },
  { id: 'price', label: 'ფასი', icon: '💰', visible: true, required: false, description: 'შეკვეთის ღირებულება და ვალუტა' },
  { id: 'status', label: 'სტატუსი', icon: '📊', visible: true, required: true, description: 'შეკვეთის მიმდინარე სტატუსი' },
  { id: 'response', label: 'მძღოლის პასუხი', icon: '💬', visible: true, required: false, description: 'მძღოლის რეაქცია შეკვეთაზე' },
  { id: 'actions', label: 'მოქმედება', icon: '⚙️', visible: true, required: true, fixed: 'right', description: 'რედაქტირება, წაშლა და სხვა' },
]

const migrateColumns = (columns: OrderColumnConfig[]): OrderColumnConfig[] => {
  return columns.map(col => {
    if (col.fixed) return col
    if (col.id === 'checkbox' || col.id === 'tracking') {
      return { ...col, fixed: 'left' as const }
    }
    if (col.id === 'actions') {
      return { ...col, fixed: 'right' as const }
    }
    return col
  })
}

// ============================================================================
// ⚙️ სექციების კონფიგურაცია
// ============================================================================
const SECTIONS = [
  { id: 'company', icon: '🏢', title: 'კომპანიის პროფილი' },
  { id: 'email_notifications', icon: '📧', title: 'Email შეტყობინებები' },
  { id: 'orders_display', icon: '📋', title: 'შეკვეთების სვეტები' },
  { id: 'pricing', icon: '💰', title: 'ფასების გამოთვლა' },
  { id: 'security', icon: '🔐', title: 'უსაფრთხოება & წვდომა' },
  { id: 'localization', icon: '🌍', title: 'ლოკალიზაცია & ფორმატები' },
  { id: 'integrations', icon: '🔌', title: 'ინტეგრაციები & API' },
  { id: 'data', icon: '💾', title: 'მონაცემები & შენახვა' },
] as const

interface Settings {
  company_name: string
  company_email: string
  company_phone: string
  company_address: string
  vat_id: string
  session_timeout_hours: number
  password_min_length: number
  enable_2fa: boolean
  ip_whitelist: string[]
  language: string
  date_format: string
  time_format: string
  timezone: string
  default_currency: string
  webhook_url: string
  enable_email_alerts: boolean
  enable_sms_alerts: boolean
  audit_retention_days: number
  enable_auto_backup: boolean
  cleanup_inactive_users_days: number
  order_columns?: OrderColumnConfig[]
  // 🆕 Email Settings
  email_from: string
  email_company_name: string
  email_enabled_order_created: boolean
  email_enabled_driver_assigned: boolean
  email_enabled_driver_en_route: boolean
  email_enabled_cargo_loaded: boolean
  email_enabled_order_delivered: boolean
  // 💰 Pricing Settings
  pricing_base_price: number
  pricing_min_price: number
  pricing_max_price: number
  pricing_rate_short_haul: number
  pricing_rate_medium_haul: number
  pricing_rate_long_haul: number
  pricing_rate_per_kg: number
  pricing_rate_per_m3: number
  pricing_volume_weight_factor: number
  pricing_fuel_surcharge_per_km: number
  pricing_toll_fee_flat: number
  pricing_waiting_time_per_hour: number
  pricing_special_handling_adr: number
  pricing_special_handling_refrigerated: number
  pricing_discount_percentage: number
  extra_config: Record<string, any>
}

const getDefaultSettings = (): Settings => ({
  company_name: 'Logistics OS',
  company_email: 'admin@logistics.ge',
  company_phone: '+995 555 00 00 00',
  company_address: 'თბილისი, საქართველო',
  vat_id: '',
  session_timeout_hours: 24,
  password_min_length: 8,
  enable_2fa: false,
  ip_whitelist: [],
  language: 'ka',
  date_format: 'DD/MM/YYYY',
  time_format: '24h',
  timezone: 'Asia/Tbilisi',
  default_currency: 'GEL',
  webhook_url: '',
  enable_email_alerts: true,
  enable_sms_alerts: false,
  audit_retention_days: 90,
  enable_auto_backup: false,
  cleanup_inactive_users_days: 180,
  order_columns: DEFAULT_ORDER_COLUMNS,
  // 🆕 Email Settings
  email_from: 'Logistics OS <onboarding@resend.dev>',
  email_company_name: 'Logistics OS',
  email_enabled_order_created: true,
  email_enabled_driver_assigned: true,
  email_enabled_driver_en_route: true,
  email_enabled_cargo_loaded: true,
  email_enabled_order_delivered: true,
  // 💰 Pricing Settings
  pricing_base_price: 50,
  pricing_min_price: 30,
  pricing_max_price: 5000,
  pricing_rate_short_haul: 0.80,
  pricing_rate_medium_haul: 0.50,
  pricing_rate_long_haul: 0.30,
  pricing_rate_per_kg: 0.10,
  pricing_rate_per_m3: 5.00,
  pricing_volume_weight_factor: 333,
  pricing_fuel_surcharge_per_km: 0.05,
  pricing_toll_fee_flat: 10,
  pricing_waiting_time_per_hour: 15,
  pricing_special_handling_adr: 50,
  pricing_special_handling_refrigerated: 75,
  pricing_discount_percentage: 0,
  extra_config: {}
})

// ============================================================================
// 💰 ფასების გამოთვლის ფუნქცია
// ============================================================================
function calculatePrice(params: {
  distance_km: number
  weight_kg: number
  volume_m3: number
  settings: Settings
}): {
  base_price: number
  distance_fee: number
  weight_fee: number
  volume_fee: number
  subtotal: number
  extra_fees: number
  discount: number
  total: number
} {
  const { distance_km, weight_kg, volume_m3, settings } = params

  // ბაზის ფასი
  const base_price = settings.pricing_base_price

  // მანძილის ფასი (ზონური)
  let distance_fee = 0
  if (distance_km < 100) {
    distance_fee = distance_km * settings.pricing_rate_short_haul
  } else if (distance_km < 500) {
    distance_fee = (100 * settings.pricing_rate_short_haul) + 
                   ((distance_km - 100) * settings.pricing_rate_medium_haul)
  } else {
    distance_fee = (100 * settings.pricing_rate_short_haul) + 
                   (400 * settings.pricing_rate_medium_haul) + 
                   ((distance_km - 500) * settings.pricing_rate_long_haul)
  }

  // მოცულობითი წონა
  const volume_weight = volume_m3 * settings.pricing_volume_weight_factor
  const chargeable_weight = Math.max(weight_kg, volume_weight)

  // წონის ფასი
  const weight_fee = chargeable_weight * settings.pricing_rate_per_kg

  // მოცულობის ფასი
  const volume_fee = volume_m3 * settings.pricing_rate_per_m3

  // ჯამი
  const subtotal = base_price + distance_fee + weight_fee + volume_fee

  // დამატებითი ხარჯები (საწვავი + გზასაკეტი)
  const extra_fees = (distance_km * settings.pricing_fuel_surcharge_per_km) + 
                     settings.pricing_toll_fee_flat

  // ფასდაკლება
  const total_before_discount = subtotal + extra_fees
  const discount = total_before_discount * (settings.pricing_discount_percentage / 100)

  // საბოლოო ფასი
  let total = total_before_discount - discount

  // მინ/მაქს შეზღუდვები
  if (total < settings.pricing_min_price) total = settings.pricing_min_price
  if (total > settings.pricing_max_price) total = settings.pricing_max_price

  return {
    base_price: Math.round(base_price * 100) / 100,
    distance_fee: Math.round(distance_fee * 100) / 100,
    weight_fee: Math.round(weight_fee * 100) / 100,
    volume_fee: Math.round(volume_fee * 100) / 100,
    subtotal: Math.round(subtotal * 100) / 100,
    extra_fees: Math.round(extra_fees * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    total: Math.round(total * 100) / 100
  }
}

// ============================================================================
// 👑 MAIN COMPONENT
// ============================================================================
export default function SettingsTab() {
  const [activeSection, setActiveSection] = useState<string>('company')
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  
  // 🆕 Email test state
  const [testEmail, setTestEmail] = useState('')
  const [testLoading, setTestLoading] = useState(false)
  const [testResult, setTestResult] = useState<{success: boolean; message: string} | null>(null)

  // 💰 Pricing test state
  const [testDistance, setTestDistance] = useState(150)
  const [testWeight, setTestWeight] = useState(500)
  const [testVolume, setTestVolume] = useState(2)
  const [testResult2, setTestResult2] = useState<ReturnType<typeof calculatePrice> | null>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('settings').select('*').single()
      if (error) throw error
      if (data) {
        const loadedSettings = data as Settings
        if (!loadedSettings.order_columns || loadedSettings.order_columns.length === 0) {
          loadedSettings.order_columns = DEFAULT_ORDER_COLUMNS
        } else {
          loadedSettings.order_columns = migrateColumns(loadedSettings.order_columns)
        }
        // 🆕 Email defaults
        if (!loadedSettings.email_from) loadedSettings.email_from = 'Logistics OS <onboarding@resend.dev>'
        if (!loadedSettings.email_company_name) loadedSettings.email_company_name = 'Logistics OS'
        // 💰 Pricing defaults
        const defaults = getDefaultSettings()
        if (loadedSettings.pricing_base_price === undefined) loadedSettings.pricing_base_price = defaults.pricing_base_price
        if (loadedSettings.pricing_min_price === undefined) loadedSettings.pricing_min_price = defaults.pricing_min_price
        if (loadedSettings.pricing_max_price === undefined) loadedSettings.pricing_max_price = defaults.pricing_max_price
        if (loadedSettings.pricing_rate_short_haul === undefined) loadedSettings.pricing_rate_short_haul = defaults.pricing_rate_short_haul
        if (loadedSettings.pricing_rate_medium_haul === undefined) loadedSettings.pricing_rate_medium_haul = defaults.pricing_rate_medium_haul
        if (loadedSettings.pricing_rate_long_haul === undefined) loadedSettings.pricing_rate_long_haul = defaults.pricing_rate_long_haul
        if (loadedSettings.pricing_rate_per_kg === undefined) loadedSettings.pricing_rate_per_kg = defaults.pricing_rate_per_kg
        if (loadedSettings.pricing_rate_per_m3 === undefined) loadedSettings.pricing_rate_per_m3 = defaults.pricing_rate_per_m3
        if (loadedSettings.pricing_volume_weight_factor === undefined) loadedSettings.pricing_volume_weight_factor = defaults.pricing_volume_weight_factor
        if (loadedSettings.pricing_fuel_surcharge_per_km === undefined) loadedSettings.pricing_fuel_surcharge_per_km = defaults.pricing_fuel_surcharge_per_km
        if (loadedSettings.pricing_toll_fee_flat === undefined) loadedSettings.pricing_toll_fee_flat = defaults.pricing_toll_fee_flat
        if (loadedSettings.pricing_waiting_time_per_hour === undefined) loadedSettings.pricing_waiting_time_per_hour = defaults.pricing_waiting_time_per_hour
        if (loadedSettings.pricing_special_handling_adr === undefined) loadedSettings.pricing_special_handling_adr = defaults.pricing_special_handling_adr
        if (loadedSettings.pricing_special_handling_refrigerated === undefined) loadedSettings.pricing_special_handling_refrigerated = defaults.pricing_special_handling_refrigerated
        if (loadedSettings.pricing_discount_percentage === undefined) loadedSettings.pricing_discount_percentage = defaults.pricing_discount_percentage
        setSettings(loadedSettings)
      }
    } catch (err) {
      console.error('Failed to load settings:', err)
      setSettings(getDefaultSettings())
    } finally {
      setLoading(false)
    }
  }

  const handleChange = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => {
      if (!prev) return prev
      if (prev[key] === value) return prev
      return { ...prev, [key]: value }
    })
  }, [])

  const handleColumnToggle = useCallback((columnId: string, visible: boolean) => {
    setSettings(prev => {
      if (!prev) return prev
      const updatedColumns = (prev.order_columns || DEFAULT_ORDER_COLUMNS).map(col => {
        if (col.id === columnId && col.fixed) return col
        return col.id === columnId ? { ...col, visible } : col
      })
      return { ...prev, order_columns: updatedColumns }
    })
  }, [])

  const handleColumnMove = useCallback((columnId: string, direction: 'up' | 'down') => {
    setSettings(prev => {
      if (!prev) return prev
      const columns = [...(prev.order_columns || DEFAULT_ORDER_COLUMNS)]
      const index = columns.findIndex(c => c.id === columnId)
      if (index === -1) return prev
      
      if (columns[index].fixed) return prev
      
      if (direction === 'up' && index > 0) {
        if (columns[index - 1].fixed) return prev
        const temp = columns[index - 1]
        columns[index - 1] = columns[index]
        columns[index] = temp
      } else if (direction === 'down' && index < columns.length - 1) {
        if (columns[index + 1].fixed) return prev
        const temp = columns[index + 1]
        columns[index + 1] = columns[index]
        columns[index] = temp
      }
      
      return { ...prev, order_columns: columns }
    })
  }, [])

  const handleToggleAll = useCallback((visible: boolean) => {
    setSettings(prev => {
      if (!prev) return prev
      const updatedColumns = (prev.order_columns || DEFAULT_ORDER_COLUMNS).map(col =>
        col.required || col.fixed ? { ...col, visible: true } : { ...col, visible }
      )
      return { ...prev, order_columns: updatedColumns }
    })
  }, [])

  const handleResetColumns = useCallback(() => {
    setSettings(prev => {
      if (!prev) return prev
      return { ...prev, order_columns: DEFAULT_ORDER_COLUMNS }
    })
  }, [])

  // 🆕 Test Email Function
  const handleSendTestEmail = async () => {
    if (!testEmail) {
      setTestResult({ success: false, message: '❌ ჩაწერე email მისამართი' })
      return
    }
    
    setTestLoading(true)
    setTestResult(null)
    
    try {
      const res = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testEmail })
      })
      const data = await res.json()
      
      if (data.success) {
        setTestResult({ success: true, message: `✅ Email წარმატებით გაიგზავნა! (ID: ${data.messageId?.substring(0, 8)}...)` })
      } else {
        setTestResult({ success: false, message: `❌ ${data.error || 'უცნობი შეცდომა'}` })
      }
    } catch (err: any) {
      setTestResult({ success: false, message: `❌ ${err.message}` })
    } finally {
      setTestLoading(false)
    }
  }

  // 💰 Test Pricing Function
  const handleTestPricing = () => {
    if (!settings) return
    const result = calculatePrice({
      distance_km: testDistance,
      weight_kg: testWeight,
      volume_m3: testVolume,
      settings
    })
    setTestResult2(result)
  }

  const handleSave = useCallback(async () => {
    if (!settings) return
    setIsSaving(true)
    setSaveStatus('idle')
    
    try {
      const { data: existing } = await supabase.from('settings').select('id').single()
      const settingsId = existing?.id
      
      const { error } = await supabase
        .from('settings')
        .upsert({ 
          id: settingsId, 
          ...settings, 
          updated_at: new Date().toISOString() 
        }, { onConflict: 'id' })
      
      if (error) throw error
      
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err: any) {
      console.error('Failed to save settings:', err)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } finally {
      setIsSaving(false)
    }
  }, [settings])

  const renderContent = useCallback(() => {
    if (!settings) return null
    
    switch (activeSection) {
      case 'company':
        return (
          <div className="space-y-4">
            <Input label="კომპანიის სახელი" value={settings.company_name} onChange={(v) => handleChange('company_name', v)} hint="გამოჩნდება ინვოისებსა და ემაილებში" disabled={loading || isSaving} />
            <Input label="ოფიციალური ემაილი" value={settings.company_email} onChange={(v) => handleChange('company_email', v)} disabled={loading || isSaving} />
            <Input label="ტელეფონი" value={settings.company_phone} onChange={(v) => handleChange('company_phone', v)} disabled={loading || isSaving} />
            <Input label="იურიდიული მისამართი" value={settings.company_address} onChange={(v) => handleChange('company_address', v)} disabled={loading || isSaving} />
            <Input label="VAT / საგადასახადო კოდი" value={settings.vat_id} onChange={(v) => handleChange('vat_id', v)} disabled={loading || isSaving} />
          </div>
        )

      // 💰 PRICING SECTION
      case 'pricing':
        return (
          <div className="space-y-6">
            {/* 📊 ფორმულის აღწერა */}
            <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/30 rounded-xl">
              <h3 className="text-sm font-semibold text-emerald-300 flex items-center gap-2 mb-3">
                💰 ფასების გამოთვლის ფორმულა
              </h3>
              <div className="bg-gray-900/50 rounded-lg p-3 font-mono text-[10px] text-emerald-200 space-y-1">
                <div>TOTAL_PRICE = BASE_PRICE + DISTANCE_FEE + WEIGHT_FEE + VOLUME_FEE + EXTRA_FEES - DISCOUNT</div>
                <div className="text-gray-500 mt-2">სადაც:</div>
                <div className="text-gray-400">• DISTANCE_FEE = ზონური ტარიფი (&lt;100კმ, 100-500კმ, &gt;500კმ)</div>
                <div className="text-gray-400">• WEIGHT_FEE = max(რეალური_წონა, მოცულობა×333) × ტარიფი/კგ</div>
                <div className="text-gray-400">• VOLUME_FEE = მოცულობა × ტარიფი/მ³</div>
                <div className="text-gray-400">• EXTRA_FEES = საწვავი + გზასაკეტი + ლოდინი + სპეციალური</div>
              </div>
            </div>

            {/* 📦 ბაზის პარამეტრები */}
            <div className="p-4 bg-gray-900/50 border border-gray-700 rounded-xl">
              <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-3">
                📦 ბაზის პარამეტრები
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input 
                  label="ბაზის ფასი (₾)" 
                  type="number" 
                  value={settings.pricing_base_price} 
                  onChange={(v) => handleChange('pricing_base_price', parseFloat(v) || 0)} 
                  hint="ფიქსირებული საწყისი ღირებულება"
                  disabled={loading || isSaving} 
                />
                <Input 
                  label="მინიმალური ფასი (₾)" 
                  type="number" 
                  value={settings.pricing_min_price} 
                  onChange={(v) => handleChange('pricing_min_price', parseFloat(v) || 0)} 
                  hint="შეკვეთის მინიმალური ღირებულება"
                  disabled={loading || isSaving} 
                />
                <Input 
                  label="მაქსიმალური ფასი (₾)" 
                  type="number" 
                  value={settings.pricing_max_price} 
                  onChange={(v) => handleChange('pricing_max_price', parseFloat(v) || 0)} 
                  hint="შეკვეთის მაქსიმალური ღირებულება"
                  disabled={loading || isSaving} 
                />
              </div>
            </div>

            {/* 📏 მანძილის ტარიფები */}
            <div className="p-4 bg-gray-900/50 border border-gray-700 rounded-xl">
              <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-3">
                📏 მანძილის ტარიფები (₾/კმ)
              </h3>
              <p className="text-[10px] text-gray-500 mb-3">
                ზონური ფასები მანძილის მიხედვით. რაც უფრო გრძელი მარშრუტი, მით უფრო დაბალი ტარიფი.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input 
                  label="მოკლე (&lt; 100 კმ)" 
                  type="number" 
                  value={settings.pricing_rate_short_haul} 
                  onChange={(v) => handleChange('pricing_rate_short_haul', parseFloat(v) || 0)} 
                  hint="მაგ: 0.80₾/კმ"
                  disabled={loading || isSaving} 
                />
                <Input 
                  label="საშუალო (100-500 კმ)" 
                  type="number" 
                  value={settings.pricing_rate_medium_haul} 
                  onChange={(v) => handleChange('pricing_rate_medium_haul', parseFloat(v) || 0)} 
                  hint="მაგ: 0.50₾/კმ"
                  disabled={loading || isSaving} 
                />
                <Input 
                  label="გრძელი (&gt; 500 კმ)" 
                  type="number" 
                  value={settings.pricing_rate_long_haul} 
                  onChange={(v) => handleChange('pricing_rate_long_haul', parseFloat(v) || 0)} 
                  hint="მაგ: 0.30₾/კმ"
                  disabled={loading || isSaving} 
                />
              </div>
            </div>

            {/* ⚖️ წონა & მოცულობა */}
            <div className="p-4 bg-gray-900/50 border border-gray-700 rounded-xl">
              <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-3">
                ⚖️ წონა & მოცულობა
              </h3>
              <p className="text-[10px] text-gray-500 mb-3">
                Chargeable Weight = max(რეალური_წონა, მოცულობა × ფაქტორი). სისტემა ირჩევს უფრო დიდს.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input 
                  label="ტარიფი წონაზე (₾/კგ)" 
                  type="number" 
                  value={settings.pricing_rate_per_kg} 
                  onChange={(v) => handleChange('pricing_rate_per_kg', parseFloat(v) || 0)} 
                  hint="მაგ: 0.10₾/კგ"
                  disabled={loading || isSaving} 
                />
                <Input 
                  label="ტარიფი მოცულობაზე (₾/მ³)" 
                  type="number" 
                  value={settings.pricing_rate_per_m3} 
                  onChange={(v) => handleChange('pricing_rate_per_m3', parseFloat(v) || 0)} 
                  hint="მაგ: 5.00₾/მ³"
                  disabled={loading || isSaving} 
                />
                <Input 
                  label="მოცულობითი ფაქტორი" 
                  type="number" 
                  value={settings.pricing_volume_weight_factor} 
                  onChange={(v) => handleChange('pricing_volume_weight_factor', parseFloat(v) || 0)} 
                  hint="საგზაო: 333, საჰაერო: 167"
                  disabled={loading || isSaving} 
                />
              </div>
            </div>

            {/*  დამატებითი ხარჯები */}
            <div className="p-4 bg-gray-900/50 border border-gray-700 rounded-xl">
              <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-3">
                 დამატებითი ხარჯები
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input 
                  label="საწვავის დამატება (₾/კმ)" 
                  type="number" 
                  value={settings.pricing_fuel_surcharge_per_km} 
                  onChange={(v) => handleChange('pricing_fuel_surcharge_per_km', parseFloat(v) || 0)} 
                  hint="მაგ: 0.05₾/კმ"
                  disabled={loading || isSaving} 
                />
                <Input 
                  label="გზასაკეტი (₾)" 
                  type="number" 
                  value={settings.pricing_toll_fee_flat} 
                  onChange={(v) => handleChange('pricing_toll_fee_flat', parseFloat(v) || 0)} 
                  hint="ფიქსირებული თანხა"
                  disabled={loading || isSaving} 
                />
                <Input 
                  label="ლოდინის ტარიფი (₾/სთ)" 
                  type="number" 
                  value={settings.pricing_waiting_time_per_hour} 
                  onChange={(v) => handleChange('pricing_waiting_time_per_hour', parseFloat(v) || 0)} 
                  hint="მაგ: 15₾/სთ"
                  disabled={loading || isSaving} 
                />
                <Input 
                  label="ADR საფრთხიანი ტვირთი (₾)" 
                  type="number" 
                  value={settings.pricing_special_handling_adr} 
                  onChange={(v) => handleChange('pricing_special_handling_adr', parseFloat(v) || 0)} 
                  hint="მაგ: 50₾"
                  disabled={loading || isSaving} 
                />
                <Input 
                  label="მაცივარი (₾)" 
                  type="number" 
                  value={settings.pricing_special_handling_refrigerated} 
                  onChange={(v) => handleChange('pricing_special_handling_refrigerated', parseFloat(v) || 0)} 
                  hint="მაგ: 75₾"
                  disabled={loading || isSaving} 
                />
                <Input 
                  label="ფასდაკლება (%)" 
                  type="number" 
                  value={settings.pricing_discount_percentage} 
                  onChange={(v) => handleChange('pricing_discount_percentage', parseFloat(v) || 0)} 
                  hint="0-100%"
                  disabled={loading || isSaving} 
                />
              </div>
            </div>

            {/* 🧪 ტესტირება */}
            <div className="p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl">
              <h3 className="text-sm font-semibold text-blue-300 flex items-center gap-2 mb-3">
                🧪 ფორმულის ტესტირება
              </h3>
              <p className="text-[10px] text-gray-400 mb-3">
                შეიყვანე სატესტო მონაცემები და ნახე როგორ გამოითვლება ფასი
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <Input 
                  label="მანძილი (კმ)" 
                  type="number" 
                  value={testDistance} 
                  onChange={(v) => setTestDistance(parseFloat(v) || 0)} 
                  disabled={loading || isSaving} 
                />
                <Input 
                  label="წონა (კგ)" 
                  type="number" 
                  value={testWeight} 
                  onChange={(v) => setTestWeight(parseFloat(v) || 0)} 
                  disabled={loading || isSaving} 
                />
                <Input 
                  label="მოცულობა (მ³)" 
                  type="number" 
                  value={testVolume} 
                  onChange={(v) => setTestVolume(parseFloat(v) || 0)} 
                  disabled={loading || isSaving} 
                />
              </div>

              <button
                onClick={handleTestPricing}
                disabled={loading || isSaving}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-2"
              >
                 გამოთვლა
              </button>

              {testResult2 && (
                <div className="mt-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                  <h4 className="text-xs font-bold text-gray-200 mb-3">📊 გამოთვლის შედეგი:</h4>
                  <div className="space-y-2 text-[11px]">
                    <div className="flex justify-between text-gray-400">
                      <span>ბაზის ფასი:</span>
                      <span className="font-mono">{testResult2.base_price} ₾</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>მანძილის ფასი:</span>
                      <span className="font-mono">{testResult2.distance_fee} ₾</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>წონის ფასი:</span>
                      <span className="font-mono">{testResult2.weight_fee} ₾</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>მოცულობის ფასი:</span>
                      <span className="font-mono">{testResult2.volume_fee} ₾</span>
                    </div>
                    <div className="flex justify-between text-gray-400 border-t border-gray-700 pt-2">
                      <span>ქვეჯამი:</span>
                      <span className="font-mono font-semibold">{testResult2.subtotal} ₾</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>დამატებითი:</span>
                      <span className="font-mono">+{testResult2.extra_fees} ₾</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>ფასდაკლება:</span>
                      <span className="font-mono text-red-400">-{testResult2.discount} ₾</span>
                    </div>
                    <div className="flex justify-between text-emerald-400 border-t border-emerald-500/30 pt-2 text-lg font-bold">
                      <span>საბოლოო ფასი:</span>
                      <span className="font-mono">{testResult2.total} ₾</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-[9px] text-amber-300">
                💡 <strong>შენიშვნა:</strong> ეს ფორმულა გამოიყენება ავტომატურად შეკვეთის შექმნისას და AI აგენტიც იყენებს მას რეკომენდაციებისთვის.
              </div>
            </div>
          </div>
        )

      // 🆕 EMAIL NOTIFICATIONS SECTION
      case 'email_notifications':
        const enabledCount = [
          settings.email_enabled_order_created,
          settings.email_enabled_driver_assigned,
          settings.email_enabled_driver_en_route,
          settings.email_enabled_cargo_loaded,
          settings.email_enabled_order_delivered,
        ].filter(Boolean).length

        return (
          <div className="space-y-6">
            {/* 📧 ზოგადი პარამეტრები */}
            <div className="p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl">
              <h3 className="text-sm font-semibold text-blue-300 flex items-center gap-2 mb-3">
                ⚙️ ზოგადი Email პარამეტრები
              </h3>
              <div className="space-y-3">
                <Input 
                  label="From Email (ვისგან იგზავნება)" 
                  value={settings.email_from} 
                  onChange={(v) => handleChange('email_from', v)} 
                  placeholder="Logistics OS <noreply@logistics.ge>"
                  hint="ფორმატი: სახელი <email@domain.com>"
                  disabled={loading || isSaving} 
                />
                <Input 
                  label="კომპანიის სახელი (Email-ებში)" 
                  value={settings.email_company_name} 
                  onChange={(v) => handleChange('email_company_name', v)} 
                  hint="გამოჩნდება ყველა ავტომატურ Email-ში"
                  disabled={loading || isSaving} 
                />
              </div>
            </div>

            {/* 🔔 შეტყობინებების ტიპები */}
            <div className="p-4 bg-gray-900/50 border border-gray-700 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                  🔔 ავტომატური შეტყობინებები
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {enabledCount}/5 ჩართული
                </span>
              </div>
              <p className="text-[10px] text-gray-500 mb-4">
                აირჩიეთ რომელი სტატუსის ცვლილებისას გაეგზავნოს ავტომატური Email დამკვეთს
              </p>
              
              <div className="space-y-2">
                <div className="flex items-start justify-between p-3 bg-gray-900/30 rounded-lg border border-gray-800">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🆕</span>
                    <div>
                      <div className="text-xs font-medium text-gray-300">შეკვეთა შეიქმნა</div>
                      <div className="text-[9px] text-gray-500 mt-0.5">
                        "თქვენი შეკვეთა მიღებულია" - იგზავნება ახალი შეკვეთის შექმნისას
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleChange('email_enabled_order_created', !settings.email_enabled_order_created)}
                    disabled={loading || isSaving}
                    className={`relative w-9 h-5 rounded-full transition-colors duration-200 disabled:opacity-50 ${settings.email_enabled_order_created ? 'bg-emerald-600' : 'bg-gray-700'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${settings.email_enabled_order_created ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="flex items-start justify-between p-3 bg-gray-900/30 rounded-lg border border-gray-800">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">👨‍✈️</span>
                    <div>
                      <div className="text-xs font-medium text-gray-300">მძღოლი დაინიშნა</div>
                      <div className="text-[9px] text-gray-500 mt-0.5">
                        "მძღოლი [სახელი] დაინიშნა თქვენს შეკვეთაზე" - მძღოლის მითითებისას
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleChange('email_enabled_driver_assigned', !settings.email_enabled_driver_assigned)}
                    disabled={loading || isSaving}
                    className={`relative w-9 h-5 rounded-full transition-colors duration-200 disabled:opacity-50 ${settings.email_enabled_driver_assigned ? 'bg-emerald-600' : 'bg-gray-700'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${settings.email_enabled_driver_assigned ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="flex items-start justify-between p-3 bg-gray-900/30 rounded-lg border border-gray-800">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🚗</span>
                    <div>
                      <div className="text-xs font-medium text-gray-300">მძღოლი გზაშია</div>
                      <div className="text-[9px] text-gray-500 mt-0.5">
                        "მძღოლი გზაშია თქვენი ტვირთისკენ" - სტატუსის en_route-ზე გადასვლისას
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleChange('email_enabled_driver_en_route', !settings.email_enabled_driver_en_route)}
                    disabled={loading || isSaving}
                    className={`relative w-9 h-5 rounded-full transition-colors duration-200 disabled:opacity-50 ${settings.email_enabled_driver_en_route ? 'bg-emerald-600' : 'bg-gray-700'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${settings.email_enabled_driver_en_route ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="flex items-start justify-between p-3 bg-gray-900/30 rounded-lg border border-gray-800">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📦</span>
                    <div>
                      <div className="text-xs font-medium text-gray-300">ტვირთი ჩაიტვირთა</div>
                      <div className="text-[9px] text-gray-500 mt-0.5">
                        "ტვირთი წარმატებით ჩაიტვირთა" - ჩატვირთვის დადასტურებისას
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleChange('email_enabled_cargo_loaded', !settings.email_enabled_cargo_loaded)}
                    disabled={loading || isSaving}
                    className={`relative w-9 h-5 rounded-full transition-colors duration-200 disabled:opacity-50 ${settings.email_enabled_cargo_loaded ? 'bg-emerald-600' : 'bg-gray-700'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${settings.email_enabled_cargo_loaded ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="flex items-start justify-between p-3 bg-gray-900/30 rounded-lg border border-gray-800">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🏁</span>
                    <div>
                      <div className="text-xs font-medium text-gray-300">შეკვეთა ჩაბარდა</div>
                      <div className="text-[9px] text-gray-500 mt-0.5">
                        "შეკვეთა წარმატებით ჩაბარდა" - მიწოდების დადასტურებისას
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleChange('email_enabled_order_delivered', !settings.email_enabled_order_delivered)}
                    disabled={loading || isSaving}
                    className={`relative w-9 h-5 rounded-full transition-colors duration-200 disabled:opacity-50 ${settings.email_enabled_order_delivered ? 'bg-emerald-600' : 'bg-gray-700'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${settings.email_enabled_order_delivered ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={() => {
                    handleChange('email_enabled_order_created', true)
                    handleChange('email_enabled_driver_assigned', true)
                    handleChange('email_enabled_driver_en_route', true)
                    handleChange('email_enabled_cargo_loaded', true)
                    handleChange('email_enabled_order_delivered', true)
                  }}
                  className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-lg text-[10px] font-medium hover:bg-emerald-500/20 transition"
                >
                  ✅ ყველას ჩართვა
                </button>
                <button
                  onClick={() => {
                    handleChange('email_enabled_order_created', false)
                    handleChange('email_enabled_driver_assigned', false)
                    handleChange('email_enabled_driver_en_route', false)
                    handleChange('email_enabled_cargo_loaded', false)
                    handleChange('email_enabled_order_delivered', false)
                  }}
                  className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg text-[10px] font-medium hover:bg-rose-500/20 transition"
                >
                  ❌ ყველას გამორთვა
                </button>
              </div>
            </div>

            {/* 🧪 ტესტ Email */}
            <div className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl">
              <h3 className="text-sm font-semibold text-purple-300 flex items-center gap-2 mb-3">
                🧪 ტესტ Email გაგზავნა
              </h3>
              <p className="text-[10px] text-gray-400 mb-3">
                გაგზავნე სატესტო Email რომ შეამოწმო სისტემა მუშაობს თუ არა
              </p>
              
              <div className="flex gap-2">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                  className="flex-1 px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-purple-500"
                />
                <button
                  onClick={handleSendTestEmail}
                  disabled={testLoading}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-2"
                >
                  {testLoading ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      იგზავნება...
                    </>
                  ) : (
                    <>📤 გაგზავნა</>
                  )}
                </button>
              </div>

              {testResult && (
                <div className={`mt-3 p-3 rounded-lg text-xs ${
                  testResult.success 
                    ? 'bg-green-500/10 border border-green-500/30 text-green-300' 
                    : 'bg-red-500/10 border border-red-500/30 text-red-300'
                }`}>
                  {testResult.message}
                </div>
              )}

              <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-[9px] text-amber-300">
                💡 <strong>შენიშვნა:</strong> Resend-ის უფასო პლანზე Email იგზავნება მხოლოდ ვერიფიცირებულ მიმღებებზე.
              </div>
            </div>

            {/* 📋 Templates Preview */}
            <div className="p-4 bg-gray-900/50 border border-gray-700 rounded-xl">
              <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-3">
                📋 Email შაბლონების გადახედვა
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  { icon: '🆕', name: 'შეკვეთა შეიქმნა', subject: '✅ შეკვეთა #TRK-001 მიღებულია', enabled: settings.email_enabled_order_created },
                  { icon: '👨‍✈️', name: 'მძღოლი დაინიშნა', subject: '👨‍✈️ მძღოლი დაინიშნა - შეკვეთა #TRK-001', enabled: settings.email_enabled_driver_assigned },
                  { icon: '🚗', name: 'მძღოლი გზაშია', subject: '🚗 მძღოლი გზაშია - შეკვეთა #TRK-001', enabled: settings.email_enabled_driver_en_route },
                  { icon: '📦', name: 'ტვირთი ჩაიტვირთა', subject: '📦 ტვირთი ჩაიტვირთა - შეკვეთა #TRK-001', enabled: settings.email_enabled_cargo_loaded },
                  { icon: '🏁', name: 'შეკვეთა ჩაბარდა', subject: '🏁 შეკვეთა ჩაბარდა - #TRK-001', enabled: settings.email_enabled_order_delivered },
                ].map((tpl, i) => (
                  <div key={i} className={`p-3 rounded-lg border ${tpl.enabled ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-gray-800/30 border-gray-700 opacity-60'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{tpl.icon}</span>
                      <span className="text-xs font-medium text-gray-200">{tpl.name}</span>
                      {tpl.enabled ? (
                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">აქტიური</span>
                      ) : (
                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-gray-500/20 text-gray-400 border border-gray-500/30">გამორთული</span>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono truncate">{tpl.subject}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 'orders_display':
        const columns = settings.order_columns || DEFAULT_ORDER_COLUMNS
        const visibleCount = columns.filter(c => c.visible).length
        const fixedLeftCols = columns.filter(c => c.fixed === 'left')
        const fixedRightCols = columns.filter(c => c.fixed === 'right')
        const middleCols = columns.filter(c => !c.fixed)
        
        return (
          <div className="space-y-4">
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-blue-300 flex items-center gap-2">
                    📋 შეკვეთების ცხრილის მორგება
                  </h3>
                  <p className="text-[10px] text-blue-400/70 mt-1">
                    აირჩიეთ რომელი სვეტები გამოჩნდეს. 🔒 ფიქსირებული სვეტები ყოველთვის კიდეებში რჩება.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-300">{visibleCount}</div>
                  <div className="text-[9px] text-blue-400/70">ჩართული</div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-gray-900/50 border border-gray-800 rounded-xl">
              <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                📐 ცხრილის სტრუქტურა
              </h4>
              <div className="flex items-stretch gap-1 h-10">
                <div className="flex items-center gap-1 px-2 bg-violet-500/20 border border-violet-500/40 rounded text-[9px] text-violet-300 whitespace-nowrap">
                  🔒 მარცხენა ({fixedLeftCols.length})
                </div>
                <div className="flex-1 flex items-center justify-center bg-blue-500/10 border border-blue-500/30 rounded text-[9px] text-blue-300">
                  ⚡ დინამიური ({middleCols.filter(c => c.visible).length})
                </div>
                <div className="flex items-center gap-1 px-2 bg-rose-500/20 border border-rose-500/40 rounded text-[9px] text-rose-300 whitespace-nowrap">
                  🔒 მარჯვენა ({fixedRightCols.length})
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1 overflow-x-auto">
                {fixedLeftCols.map(col => (
                  <div key={col.id} className="px-2 py-0.5 bg-violet-500/10 border border-violet-500/30 rounded text-[8px] text-violet-300 whitespace-nowrap">
                    {col.icon} {col.label}
                  </div>
                ))}
                <span className="text-gray-600 text-[9px]">│</span>
                {middleCols.filter(c => c.visible).map(col => (
                  <div key={col.id} className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/30 rounded text-[8px] text-blue-300 whitespace-nowrap">
                    {col.icon} {col.label}
                  </div>
                ))}
                <span className="text-gray-600 text-[9px]">│</span>
                {fixedRightCols.map(col => (
                  <div key={col.id} className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/30 rounded text-[8px] text-rose-300 whitespace-nowrap">
                    {col.icon} {col.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggleAll(true)}
                className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-lg text-[10px] font-medium hover:bg-emerald-500/20 transition"
              >
                ✅ ყველას ჩართვა
              </button>
              <button
                onClick={() => handleToggleAll(false)}
                className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg text-[10px] font-medium hover:bg-rose-500/20 transition"
              >
                ❌ ყველას გამორთვა
              </button>
              <button
                onClick={handleResetColumns}
                className="px-3 py-1.5 bg-gray-500/10 border border-gray-500/30 text-gray-300 rounded-lg text-[10px] font-medium hover:bg-gray-500/20 transition"
              >
                🔄 ნაგულისხმევზე დაბრუნება
              </button>
            </div>

            <div className="space-y-2">
              {columns.map((col, index) => {
                const isFixed = !!col.fixed
                const fixedPosition = col.fixed === 'left' ? '🔒 მარცხენა კიდე' : col.fixed === 'right' ? '🔒 მარჯვენა კიდე' : null
                
                return (
                  <div
                    key={col.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      isFixed
                        ? 'bg-gradient-to-r from-violet-500/10 to-rose-500/10 border-violet-500/30'
                        : col.visible 
                          ? 'bg-blue-500/5 border-blue-500/30' 
                          : 'bg-gray-900/30 border-gray-800 opacity-70'
                    }`}
                  >
                    <div className="text-[10px] text-gray-600 font-mono w-5 text-center">
                      {index + 1}
                    </div>

                    <div className="text-xl w-8 text-center">{col.icon}</div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-gray-200">{col.label}</span>
                        {col.required && !isFixed && (
                          <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold">
                            სავალდებულო
                          </span>
                        )}
                        {fixedPosition && (
                          <span className="text-[8px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30 font-semibold">
                            {fixedPosition}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5">{col.description}</p>
                    </div>

                    {!isFixed ? (
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => handleColumnMove(col.id, 'up')}
                          disabled={index === 0 || !!columns[index - 1]?.fixed}
                          className="p-1 text-gray-500 hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition"
                          title="ზემოთ"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <polyline points="18 15 12 9 6 15"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleColumnMove(col.id, 'down')}
                          disabled={index === columns.length - 1 || !!columns[index + 1]?.fixed}
                          className="p-1 text-gray-500 hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition"
                          title="ქვემოთ"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <polyline points="6 9 12 15 18 9"/>
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="w-[26px]" />
                    )}

                    <button
                      type="button"
                      onClick={() => !isFixed && !col.required && handleColumnToggle(col.id, !col.visible)}
                      disabled={isFixed || col.required}
                      className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
                        isFixed || col.required
                          ? 'bg-blue-600 cursor-not-allowed' 
                          : col.visible ? 'bg-emerald-600' : 'bg-gray-700'
                      }`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                        col.visible || isFixed ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-[10px] text-amber-300">
              💡 <strong>მითითება:</strong> 🔒 ფიქსირებული სვეტები (Tracking მარცხნივ, მოქმედება მარჯვნივ) ყოველთვის ჩართულია და ვერ გადაადგილდება. დანარჩენი სვეტები თანაბრად ნაწილდება მათ შორის.
            </div>
          </div>
        )

      case 'security':
        return (
          <div className="space-y-4">
            <Select label="სესიის ავტომატური გასვლა" value={settings.session_timeout_hours.toString()} onChange={(v) => handleChange('session_timeout_hours', parseInt(v))}
              options={[{value:'4', label:'4 საათი'}, {value:'12', label:'12 საათი'}, {value:'24', label:'24 საათი'}, {value:'168', label:'7 დღე'}]} disabled={loading || isSaving} />
            <Select label="პაროლის მინიმალური სიგრძე" value={settings.password_min_length.toString()} onChange={(v) => handleChange('password_min_length', parseInt(v))}
              options={[{value:'6', label:'6 სიმბოლო'}, {value:'8', label:'8 სიმბოლო'}, {value:'12', label:'12 სიმბოლო'}]} disabled={loading || isSaving} />
            <Toggle label="ორ-ფაქტორიანი აუთენტიკაცია (2FA)" description="მოითხოვს კოდს SMS/Email-ით შესვლისას"
              checked={settings.enable_2fa} onChange={(v) => handleChange('enable_2fa', v)} disabled={loading || isSaving} />
            <Input label="IP Whitelist" value={settings.ip_whitelist?.join(', ') || ''} onChange={(v) => handleChange('ip_whitelist', v.split(',').map(s => s.trim()).filter(Boolean))} hint="მხოლოდ მითითებული IP-ებიდან იქნება წვდომა" disabled={loading || isSaving} />
          </div>
        )
      case 'localization':
        return (
          <div className="space-y-4">
            <Select label="ინტერფეისის ენა" value={settings.language} onChange={(v) => handleChange('language', v)}
              options={[{value:'ka', label:'🇬🇪 ქართული'}, {value:'en', label:'🇬🇧 English'}, {value:'ru', label:'🇷🇺 Русский'}]} disabled={loading || isSaving} />
            <Select label="თარიღის ფორმატი" value={settings.date_format} onChange={(v) => handleChange('date_format', v)}
              options={[{value:'DD/MM/YYYY', label:'31/01/2024'}, {value:'MM/DD/YYYY', label:'01/31/2024'}, {value:'YYYY-MM-DD', label:'2024-01-31'}]} disabled={loading || isSaving} />
            <Select label="დროის ფორმატი" value={settings.time_format} onChange={(v) => handleChange('time_format', v)}
              options={[{value:'24h', label:'24-საათიანი (14:30)'}, {value:'12h', label:'12-საათიანი (2:30 PM)'}]} disabled={loading || isSaving} />
            <Select label="ნაგულისხმევი ვალუტა" value={settings.default_currency} onChange={(v) => handleChange('default_currency', v)}
              options={[{value:'GEL', label:'₾ GEL'}, {value:'USD', label:'$ USD'}, {value:'EUR', label:'€ EUR'}]} disabled={loading || isSaving} />
          </div>
        )
      case 'integrations':
        return (
          <div className="space-y-4">
            <Input label="Webhook URL" value={settings.webhook_url} onChange={(v) => handleChange('webhook_url', v)} hint="გარე სისტემებთან სინქრონიზაციისთვის" disabled={loading || isSaving} />
            <Toggle label="Email ალერტები" description="ავტომატური ემაილი ახალი შეკვეთების/შეცდომების შესახებ"
              checked={settings.enable_email_alerts} onChange={(v) => handleChange('enable_email_alerts', v)} disabled={loading || isSaving} />
            <Toggle label="SMS ალერტები" description="მძღოლებისთვის სტატუსის შეცვლის SMS"
              checked={settings.enable_sms_alerts} onChange={(v) => handleChange('enable_sms_alerts', v)} disabled={loading || isSaving} />
          </div>
        )
      case 'data':
        return (
          <div className="space-y-4">
            <Select label="აუდიტის ლოგების შენახვის ვადა" value={settings.audit_retention_days.toString()} onChange={(v) => handleChange('audit_retention_days', parseInt(v))}
              options={[{value:'30', label:'30 დღე'}, {value:'90', label:'90 დღე'}, {value:'180', label:'6 თვე'}, {value:'365', label:'1 წელი'}, {value:'0', label:'უსასრულო'}]} disabled={loading || isSaving} />
            <Toggle label="ავტომატური ბექაპი" description="ყოველდღიური სნეფშოტი Supabase Storage-ში"
              checked={settings.enable_auto_backup} onChange={(v) => handleChange('enable_auto_backup', v)} disabled={loading || isSaving} />
            <Select label="არააქტიური მომხმარებლების გასუფთავება" value={settings.cleanup_inactive_users_days.toString()} onChange={(v) => handleChange('cleanup_inactive_users_days', parseInt(v))}
              options={[{value:'0', label:'არასდროს'}, {value:'90', label:'3 თვის შემდეგ'}, {value:'180', label:'6 თვის შემდეგ'}]} disabled={loading || isSaving} />
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-[10px] text-yellow-300">
              ⚠️ ყურადღება: აუდიტის ლოგების წაშლა შეუქცევადია.
            </div>
          </div>
        )
      default:
        return null
    }
  }, [settings, activeSection, loading, isSaving, handleChange, handleColumnToggle, handleColumnMove, handleToggleAll, handleResetColumns, testEmail, testLoading, testResult, testDistance, testWeight, testVolume, testResult2])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-xs text-gray-400">იტვირთება პარამეტრები...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-120px)]">
      <div className="w-full lg:w-52 bg-gray-800/60 border border-gray-700 rounded-xl p-2 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-y-auto shrink-0">
        {SECTIONS.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              activeSection === section.id 
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
            }`}
          >
            <span>{section.icon}</span>
            <span>{section.title}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 bg-gray-800/60 border border-gray-700 rounded-xl p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              {SECTIONS.find(s => s.id === activeSection)?.icon} {SECTIONS.find(s => s.id === activeSection)?.title}
            </h2>
            <p className="text-[10px] text-gray-400 mt-1">პლატფორმის გლობალური კონფიგურაციის მართვა</p>
          </div>
          
          <div className="flex items-center gap-3">
            {saveStatus === 'success' && <span className="text-xs text-green-400 flex items-center gap-1">✅ შენახულია</span>}
            {saveStatus === 'error' && <span className="text-xs text-red-400 flex items-center gap-1">❌ შეცდომა</span>}
            <button
              onClick={handleSave}
              disabled={isSaving || !settings}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold transition flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ინახება...
                </>
              ) : (
                <>💾 ცვლილებების შენახვა</>
              )}
            </button>
          </div>
        </div>

        <div className="max-w-2xl">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}