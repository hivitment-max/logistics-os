'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

// ============================================================================
// 🎨 UI კომპონენტები (გადატანილია გარეთ - პერფორმანსისთვის!)
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
// ⚙️ სექციების კონფიგურაცია
// ============================================================================
const SECTIONS = [
  { id: 'company', icon: '🏢', title: 'კომპანიის პროფილი' },
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
  extra_config: {}
})

// ============================================================================
// 👑 MAIN COMPONENT
// ============================================================================
export default function SettingsTab() {
  const [activeSection, setActiveSection] = useState<string>('company')
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)

  // 🔄 დატვირთვა Supabase-დან
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('settings').select('*').single()
      if (error) throw error
      if (data) setSettings(data as Settings)
    } catch (err) {
      console.error('Failed to load settings:', err)
      setSettings(getDefaultSettings())
    } finally {
      setLoading(false)
    }
  }

  // ✅ ოპტიმიზირებული handleChange - მხოლოდ კონკრეტული ველის განახლება
  const handleChange = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => {
      if (!prev) return prev
      if (prev[key] === value) return prev
      return { ...prev, [key]: value }
    })
  }, [])

  // 💾 შენახვა Supabase-ში (გამოსწორებული ვერსია)
  const handleSave = useCallback(async () => {
    if (!settings) return
    setIsSaving(true)
    setSaveStatus('idle')
    
    try {
      // მივიღოთ სწორი ID
      const { data: existing } = await supabase.from('settings').select('id').single()
      const settingsId = existing?.id
      
      const { error } = await supabase
        .from('settings')
        .upsert({ id: settingsId, ...settings, updated_at: new Date().toISOString() }, { onConflict: 'id' })
      
      if (error) throw error
      
      setSaveStatus('success')
      
      // 📜 აუდიტის ლოგი (გამოსწორებული: await + error შემოწმება)
      const user = await supabase.auth.getUser()
      const { error: auditError } = await supabase
        .from('audit_logs')
        .insert({
          user_email: user.data.user?.email || 'system',
          action: 'update',
          table_name: 'settings',
          record_id: settingsId,
          details: `პარამეტრები განახლდა: ${activeSection}`
        })
      
      if (auditError) {
        console.warn('Audit log failed:', auditError.message)
        // არ ვაბლოკირებთ მთავარ ოპერაციას
      }
      
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err: any) {
      console.error('Failed to save settings:', err)
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }, [settings, activeSection])

  // 📑 სექციების რენდერი
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
      case 'security':
        return (
          <div className="space-y-4">
            <Select 
              label="სესიის ავტომატური გასვლა" 
              value={settings.session_timeout_hours.toString()} 
              onChange={(v) => handleChange('session_timeout_hours', parseInt(v))}
              options={[{value:'4', label:'4 საათი'}, {value:'12', label:'12 საათი'}, {value:'24', label:'24 საათი'}, {value:'168', label:'7 დღე'}]} 
              disabled={loading || isSaving}
            />
            <Select 
              label="პაროლის მინიმალური სიგრძე" 
              value={settings.password_min_length.toString()} 
              onChange={(v) => handleChange('password_min_length', parseInt(v))}
              options={[{value:'6', label:'6 სიმბოლო'}, {value:'8', label:'8 სიმბოლო'}, {value:'12', label:'12 სიმბოლო'}]} 
              disabled={loading || isSaving}
            />
            <Toggle 
              label="ორ-ფაქტორიანი აუთენტიკაცია (2FA)" 
              description="მოითხოვს კოდს SMS/Email-ით შესვლისას"
              checked={settings.enable_2fa} 
              onChange={(v) => handleChange('enable_2fa', v)} 
              disabled={loading || isSaving}
            />
            <Input label="IP Whitelist" value={settings.ip_whitelist?.join(', ') || ''} onChange={(v) => handleChange('ip_whitelist', v.split(',').map(s => s.trim()).filter(Boolean))} hint="მხოლოდ მითითებული IP-ებიდან იქნება წვდომა" disabled={loading || isSaving} />
          </div>
        )
      case 'localization':
        return (
          <div className="space-y-4">
            <Select 
              label="ინტერფეისის ენა" 
              value={settings.language} 
              onChange={(v) => handleChange('language', v)}
              options={[{value:'ka', label:'🇬🇪 ქართული'}, {value:'en', label:'🇬🇧 English'}, {value:'ru', label:'🇷🇺 Русский'}]} 
              disabled={loading || isSaving}
            />
            <Select 
              label="თარიღის ფორმატი" 
              value={settings.date_format} 
              onChange={(v) => handleChange('date_format', v)}
              options={[{value:'DD/MM/YYYY', label:'31/01/2024'}, {value:'MM/DD/YYYY', label:'01/31/2024'}, {value:'YYYY-MM-DD', label:'2024-01-31'}]} 
              disabled={loading || isSaving}
            />
            <Select 
              label="დროის ფორმატი" 
              value={settings.time_format} 
              onChange={(v) => handleChange('time_format', v)}
              options={[{value:'24h', label:'24-საათიანი (14:30)'}, {value:'12h', label:'12-საათიანი (2:30 PM)'}]} 
              disabled={loading || isSaving}
            />
            <Select 
              label="ნაგულისხმევი ვალუტა" 
              value={settings.default_currency} 
              onChange={(v) => handleChange('default_currency', v)}
              options={[{value:'GEL', label:'₾ GEL'}, {value:'USD', label:'$ USD'}, {value:'EUR', label:'€ EUR'}]} 
              disabled={loading || isSaving}
            />
          </div>
        )
      case 'integrations':
        return (
          <div className="space-y-4">
            <Input label="Webhook URL" value={settings.webhook_url} onChange={(v) => handleChange('webhook_url', v)} hint="გარე სისტემებთან სინქრონიზაციისთვის" disabled={loading || isSaving} />
            <Toggle 
              label="Email ალერტები" 
              description="ავტომატური ემაილი ახალი შეკვეთების/შეცდომების შესახებ"
              checked={settings.enable_email_alerts} 
              onChange={(v) => handleChange('enable_email_alerts', v)} 
              disabled={loading || isSaving}
            />
            <Toggle 
              label="SMS ალერტები" 
              description="მძღოლებისთვის სტატუსის შეცვლის SMS (გამოიყენებს გარე პროვაიდერს)"
              checked={settings.enable_sms_alerts} 
              onChange={(v) => handleChange('enable_sms_alerts', v)} 
              disabled={loading || isSaving}
            />
          </div>
        )
      case 'data':
        return (
          <div className="space-y-4">
            <Select 
              label="აუდიტის ლოგების შენახვის ვადა" 
              value={settings.audit_retention_days.toString()} 
              onChange={(v) => handleChange('audit_retention_days', parseInt(v))}
              options={[{value:'30', label:'30 დღე'}, {value:'90', label:'90 დღე'}, {value:'180', label:'6 თვე'}, {value:'365', label:'1 წელი'}, {value:'0', label:'უსასრულო'}]} 
              disabled={loading || isSaving}
            />
            <Toggle 
              label="ავტომატური ბექაპი" 
              description="ყოველდღიური სნეფშოტი Supabase Storage-ში"
              checked={settings.enable_auto_backup} 
              onChange={(v) => handleChange('enable_auto_backup', v)} 
              disabled={loading || isSaving}
            />
            <Select 
              label="არააქტიური მომხმარებლების გასუფთავება" 
              value={settings.cleanup_inactive_users_days.toString()} 
              onChange={(v) => handleChange('cleanup_inactive_users_days', parseInt(v))}
              options={[{value:'0', label:'არასდროს'}, {value:'90', label:'3 თვის შემდეგ'}, {value:'180', label:'6 თვის შემდეგ'}]} 
              disabled={loading || isSaving}
            />
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-[10px] text-yellow-300">
              ⚠️ ყურადღება: აუდიტის ლოგების წაშლა შეუქცევადია. დარწმუნდით, რომ გაქვთ ექსპორტირებული არქივი.
            </div>
          </div>
        )
      default:
        return null
    }
  }, [settings, activeSection, loading, isSaving, handleChange])

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
      {/* 📂 მარცხენა ნავიგაცია */}
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

      {/* 📝 ძირითადი კონტენტი */}
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

        {/* სექციის ფორმა */}
        <div className="max-w-2xl">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}