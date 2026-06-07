'use client'

import { useState, useEffect } from 'react'
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
  readonly?: boolean
}

const Input = ({ label, type = 'text', value, onChange, placeholder, hint, disabled, readonly }: InputProps) => (
  <div className="space-y-1">
    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</label>
    <input
      type={type}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readonly}
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

const Toggle = ({ label, checked, onChange, description, disabled }: ToggleProps) => (
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

// ============================================================================
// 🤖 ინტერფეისები
// ============================================================================
interface AIProvider {
  id?: string
  provider_type: 'gemini' | 'groq' | 'openai' | 'anthropic'
  provider_name: string
  api_endpoint: string
  api_key: string
  model_name: string
  is_paid: boolean
  is_active: boolean
  priority: number
  detection_status?: 'idle' | 'detecting' | 'success' | 'error'
  detected_model?: string
  // 🆕 ტესტისთვის დამატებითი ველები
  is_testing?: boolean
  test_message?: string
}

interface AIConfig {
  is_active: boolean
  use_local_algorithm: boolean
  local_base_rate_per_km: number
  fallback_to_local_on_error: boolean
  max_ai_price_deviation_percent: number
}

const DEFAULT_CONFIG: AIConfig = {
  is_active: true,
  use_local_algorithm: true,
  local_base_rate_per_km: 1.5,
  fallback_to_local_on_error: true,
  max_ai_price_deviation_percent: 30,
}

// ============================================================================
// 🔍 Helper: API ტიპის დეტექცია
// ============================================================================
const detectApiType = (endpoint: string, apiKey: string): 'gemini' | 'groq' | 'anthropic' | 'openai' => {
  if (endpoint.includes('groq.com') || apiKey.startsWith('gsk_')) return 'groq'
  if (endpoint.includes('googleapis.com') || endpoint.includes('gemini') || apiKey.startsWith('AIza')) return 'gemini'
  if (endpoint.includes('anthropic.com') || apiKey.startsWith('sk-ant-')) return 'anthropic'
  return 'openai'
}

const getDefaultModel = (apiType: string): string => {
  switch (apiType) {
    case 'gemini': return 'gemini-1.5-flash'
    case 'groq': return 'llama3-8b-8192'
    case 'anthropic': return 'claude-3-haiku-20240307'
    default: return 'gpt-3.5-turbo'
  }
}

const PROVIDER_STYLES: Record<string, { color: string; icon: string; bgColor: string; borderColor: string }> = {
  gemini: { color: 'text-blue-400', icon: '🔵', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30' },
  groq: { color: 'text-orange-400', icon: '🟠', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/30' },
  openai: { color: 'text-emerald-400', icon: '🟢', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30' },
  anthropic: { color: 'text-purple-400', icon: '🟣', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/30' },
}

// ============================================================================
// 👑 MAIN COMPONENT
// ============================================================================
export default function AITab() {
  const [config, setConfig] = useState<AIConfig>(DEFAULT_CONFIG)
  const [providers, setProviders] = useState<AIProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [globalMessage, setGlobalMessage] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data: configData } = await supabase.from('ai_pricing_config').select('*').single()
      if (configData) {
        setConfig({
          is_active: configData.is_active ?? true,
          use_local_algorithm: configData.use_local_algorithm ?? true,
          local_base_rate_per_km: configData.local_base_rate_per_km ?? 1.5,
          fallback_to_local_on_error: configData.fallback_to_local_on_error ?? true,
          max_ai_price_deviation_percent: configData.max_ai_price_deviation_percent ?? 30,
        })
      }

      const { data: providersData } = await supabase.from('ai_pricing_providers').select('*').order('priority', { ascending: true })
      if (providersData) {
        setProviders(providersData.map((p: any) => ({
          ...p,
          detection_status: 'idle',
          is_testing: false,
          test_message: '',
        })))
      }
    } catch (err) {
      console.error('Failed to load AI data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleConfigChange = <K extends keyof AIConfig>(key: K, value: AIConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  const handleProviderChange = (id: string, key: keyof AIProvider, value: any) => {
    setProviders(prev => prev.map(p => p.id === id ? { ...p, [key]: value } : p))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data: existing } = await supabase.from('ai_pricing_config').select('id').single()
      const payload = { ...config, updated_at: new Date().toISOString() }
      
      if (existing?.id) {
        await supabase.from('ai_pricing_config').update(payload).eq('id', existing.id)
      } else {
        await supabase.from('ai_pricing_config').insert(payload)
      }

      for (const provider of providers) {
        if (provider.id) {
          await supabase.from('ai_pricing_providers')
            .update({
              api_key: provider.api_key,
              api_endpoint: provider.api_endpoint,
              model_name: provider.model_name,
              is_active: provider.is_active,
              updated_at: new Date().toISOString(),
            })
            .eq('id', provider.id)
        }
      }

      setGlobalMessage({ success: true, message: '✅ ყველაფერი წარმატებით შეინახა!' })
      setTimeout(() => setGlobalMessage(null), 3000)
    } catch (err: any) {
      setGlobalMessage({ success: false, message: `❌ შეცდომა: ${err.message}` })
    } finally {
      setSaving(false)
    }
  }

  // 🔗 განახლებული ტესტის ფუნქცია: რეალური ჩატის მოთხოვნა
  const handleTestConnection = async (provider: AIProvider) => {
    if (!provider.api_key) {
      setGlobalMessage({ success: false, message: '❌ გთხოვთ, ჯერ შეიყვანოთ API გასაღები.' })
      return
    }

    handleProviderChange(provider.id!, 'is_testing', true)
    handleProviderChange(provider.id!, 'test_message', '')
    setGlobalMessage(null)

    try {
      const apiType = detectApiType(provider.api_endpoint, provider.api_key)
      const modelName = provider.model_name || getDefaultModel(apiType)
      const prompt = "დღეს რა დღეა? მომეცი ძალიან მოკლე პასუხი (მხოლოდ დღის სახელი)."

      let res: Response
      let answer = ""

      if (apiType === 'gemini') {
        res = await fetch(`${provider.api_endpoint}/v1beta/models/${modelName}:generateContent?key=${provider.api_key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`)
        answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "პასუხი ვერ მივიღე"
        
      } else if (apiType === 'anthropic') {
        res = await fetch(`${provider.api_endpoint}/v1/messages`, {
          method: 'POST',
          headers: { 
            'x-api-key': provider.api_key, 
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({ 
            model: modelName, 
            max_tokens: 50, 
            messages: [{ role: "user", content: prompt }] 
          })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`)
        answer = data.content?.[0]?.text || "პასუხი ვერ მივიღე"
        
      } else {
        // OpenAI & Groq
        res = await fetch(`${provider.api_endpoint}/v1/chat/completions`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${provider.api_key}`, 
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({ 
            model: modelName, 
            messages: [{ role: "user", content: prompt }], 
            max_tokens: 50 
          })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`)
        answer = data.choices?.[0]?.message?.content || "პასუხი ვერ მივიღე"
      }

      handleProviderChange(provider.id!, 'is_testing', false)
      handleProviderChange(provider.id!, 'test_message', `✅ მუშაობს! პასუხი: "${answer.trim()}"`)
      
    } catch (err: any) {
      handleProviderChange(provider.id!, 'is_testing', false)
      handleProviderChange(provider.id!, 'test_message', `❌ შეცდომა: ${err.message}`)
    }
  }

  // 🔍 ავტომატური მოდელის პოვნა (უცვლელი)
  const handleAutoDetectModel = async (provider: AIProvider) => {
    if (!provider.api_key || !provider.api_endpoint) {
      setGlobalMessage({ success: false, message: '❌ შეავსეთ endpoint და გასაღები.' })
      return
    }

    handleProviderChange(provider.id!, 'detection_status', 'detecting')
    setGlobalMessage(null)

    try {
      const apiType = detectApiType(provider.api_endpoint, provider.api_key)
      let models: any[] = []

      if (apiType === 'gemini') {
        const res = await fetch(`${provider.api_endpoint}/v1beta/models?key=${provider.api_key}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        models = (data.models || []).map((m: any) => ({
          id: (m.name || '').replace('models/', ''),
          name: m.displayName || m.name,
          supportedMethods: m.supportedGenerationMethods || []
        })).filter((m: any) => !m.supportedMethods || m.supportedMethods.includes('generateContent'))
      } else if (apiType === 'anthropic') {
        const res = await fetch(`${provider.api_endpoint}/v1/models`, {
          headers: { 'x-api-key': provider.api_key, 'anthropic-version': '2023-06-01' }
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        models = data.data || []
      } else {
        const res = await fetch(`${provider.api_endpoint}/v1/models`, {
          headers: { 'Authorization': `Bearer ${provider.api_key}` }
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        models = data.data || []
      }

      if (models.length === 0) throw new Error('მოდელები ვერ მოიძებნა')

      const freeKeywords: Record<string, string[]> = {
        gemini: ['2.5-flash', '2.0-flash', '1.5-flash', 'flash'],
        groq: ['llama-3.3-70b', 'llama-3.1-8b', 'llama3-70b', 'gemma2'],
        openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5'],
        anthropic: ['claude-3-5-haiku', 'claude-3-haiku', 'claude-3-5-sonnet'],
      }

      let bestModel = null
      for (const keyword of freeKeywords[apiType] || []) {
        const found = models.find((m: any) => (m.id || m.name || '').toLowerCase().includes(keyword))
        if (found) { bestModel = found; break }
      }

      if (!bestModel) bestModel = models[0]
      const modelName = bestModel?.id || bestModel?.name || 'unknown'
      
      handleProviderChange(provider.id!, 'detected_model', modelName)
      handleProviderChange(provider.id!, 'model_name', modelName)
      handleProviderChange(provider.id!, 'detection_status', 'success')
      
      setGlobalMessage({ success: true, message: `✅ ${provider.provider_name}: მოდელი ნაპოვნია → ${modelName}` })
    } catch (err: any) {
      handleProviderChange(provider.id!, 'detection_status', 'error')
      setGlobalMessage({ success: false, message: `❌ ${err.message}` })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-xs text-gray-400">იტვირთება AI კონფიგურაცია...</p>
        </div>
      </div>
    )
  }

  const freeProviders = providers.filter(p => !p.is_paid)
  const paidProviders = providers.filter(p => p.is_paid)

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-120px)]">
      <div className="w-full lg:w-52 bg-gray-800/60 border border-gray-700 rounded-xl p-2 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-y-auto shrink-0">
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-blue-600/20 text-blue-400 border border-blue-500/30 whitespace-nowrap">
          <span>🤖</span>
          <span>AI აგენტის მართვა</span>
        </button>
      </div>

      <div className="flex-1 bg-gray-800/60 border border-gray-700 rounded-xl p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              🤖 AI ფასების აგენტის კონფიგურაცია
            </h2>
            <p className="text-[10px] text-gray-400 mt-1">მართეთ 4 AI პლატფორმა: Gemini, Groq, ChatGPT, Claude</p>
          </div>
          
          <div className="flex items-center gap-3">
            {globalMessage && (
              <span className={`text-xs flex items-center gap-1 ${globalMessage.success ? 'text-green-400' : 'text-red-400'}`}>
                {globalMessage.message}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold transition flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ინახება...
                </>
              ) : (
                <>💾 ყველაფრის შენახვა</>
              )}
            </button>
          </div>
        </div>

        <div className="max-w-4xl space-y-6">
          <div className="p-4 bg-gray-900/50 border border-gray-700 rounded-xl">
            <Toggle 
              label="AI ფასების რეკომენდაციის ჩართვა" 
              description="როდესაც ჩართულია, სისტემა შესთავაზებს ოპტიმალურ ფასს შეკვეთის შექმნის დროს."
              checked={config.is_active} 
              onChange={(v) => handleConfigChange('is_active', v)} 
            />
          </div>

          {/* 🔓 უფასო API პლატფორმები */}
          <div className="p-4 bg-gray-900/50 border border-gray-700 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wide flex items-center gap-2">🔓 უფასო API პლატფორმები</h3>
              <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">რეკომენდირებული</span>
            </div>
            <div className="space-y-3">
              {freeProviders.map(provider => {
                const style = PROVIDER_STYLES[provider.provider_type] || PROVIDER_STYLES.openai
                return (
                  <div key={provider.id} className={`p-4 rounded-xl border ${style.bgColor} ${style.borderColor} space-y-3`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{style.icon}</span>
                        <div>
                          <h4 className={`text-sm font-bold ${style.color}`}>{provider.provider_name}</h4>
                          <p className="text-[9px] text-gray-500">Priority #{provider.priority} • უფასო</p>
                        </div>
                      </div>
                      <Toggle label="" checked={provider.is_active} onChange={(v) => handleProviderChange(provider.id!, 'is_active', v)} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input label="API Endpoint" value={provider.api_endpoint} onChange={(v) => handleProviderChange(provider.id!, 'api_endpoint', v)} placeholder="https://..." />
                      <Input label="API გასაღები" type="password" value={provider.api_key} onChange={(v) => handleProviderChange(provider.id!, 'api_key', v)} placeholder={provider.provider_type === 'gemini' ? 'AIza...' : provider.provider_type === 'groq' ? 'gsk_...' : 'sk-...'} />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button onClick={() => handleAutoDetectModel(provider)} disabled={provider.detection_status === 'detecting' || !provider.api_key} className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-medium transition flex items-center gap-2">
                        {provider.detection_status === 'detecting' ? <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>იძებნება...</> : <>🔍 მოდელის პოვნა</>}
                      </button>

                      <button onClick={() => handleTestConnection(provider)} disabled={provider.is_testing || !provider.api_key} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition flex items-center gap-2">
                        {provider.is_testing ? <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>მოწმდება...</> : <>🔗 ტესტი</>}
                      </button>

                      {/* 🆕 აქ გამოდის ტესტის პასუხი */}
                      {provider.test_message && (
                        <span className={`text-[10px] px-2 py-1 rounded border ${provider.test_message.startsWith('✅') ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                          {provider.test_message}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 💰 ფასიანი API პლატფორმები */}
          <div className="p-4 bg-gray-900/50 border border-gray-700 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wide flex items-center gap-2">💰 ფასიანი API პლატფორმები</h3>
              <span className="text-[9px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">პრემიუმ</span>
            </div>
            <div className="space-y-3">
              {paidProviders.map(provider => {
                const style = PROVIDER_STYLES[provider.provider_type] || PROVIDER_STYLES.openai
                return (
                  <div key={provider.id} className={`p-4 rounded-xl border ${style.bgColor} ${style.borderColor} space-y-3`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{style.icon}</span>
                        <div>
                          <h4 className={`text-sm font-bold ${style.color}`}>{provider.provider_name}</h4>
                          <p className="text-[9px] text-gray-500">Priority #{provider.priority} • ფასიანი</p>
                        </div>
                      </div>
                      <Toggle label="" checked={provider.is_active} onChange={(v) => handleProviderChange(provider.id!, 'is_active', v)} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input label="API Endpoint" value={provider.api_endpoint} onChange={(v) => handleProviderChange(provider.id!, 'api_endpoint', v)} placeholder="https://..." />
                      <Input label="API გასაღები" type="password" value={provider.api_key} onChange={(v) => handleProviderChange(provider.id!, 'api_key', v)} placeholder={provider.provider_type === 'anthropic' ? 'sk-ant-...' : 'sk-...'} />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button onClick={() => handleAutoDetectModel(provider)} disabled={provider.detection_status === 'detecting' || !provider.api_key} className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-medium transition flex items-center gap-2">
                        {provider.detection_status === 'detecting' ? <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>იძებნება...</> : <>🔍 მოდელის პოვნა</>}
                      </button>

                      <button onClick={() => handleTestConnection(provider)} disabled={provider.is_testing || !provider.api_key} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition flex items-center gap-2">
                        {provider.is_testing ? <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>მოწმდება...</> : <>🔗 ტესტი</>}
                      </button>

                      {/* 🆕 აქ გამოდის ტესტის პასუხი */}
                      {provider.test_message && (
                        <span className={`text-[10px] px-2 py-1 rounded border ${provider.test_message.startsWith('✅') ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                          {provider.test_message}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ⚖️ ჰიბრიდული ლოგიკის წესები */}
          <div className="p-4 bg-gray-900/50 border border-gray-700 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wide flex items-center gap-2">⚖️ ჰიბრიდული ლოგიკის წესები</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Toggle label="სარეზერვო ლოკალური ალგორითმი" description="თუ ყველა API შეცდომას დააბრუნებს, გამოიყენე ლოკალური ფორმულა." checked={config.fallback_to_local_on_error} onChange={(v) => handleConfigChange('fallback_to_local_on_error', v)} />
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide">მაქსიმალური გადახრა (%)</label>
                <input type="number" value={config.max_ai_price_deviation_percent} onChange={(e) => handleConfigChange('max_ai_price_deviation_percent', Number(e.target.value))} className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500 transition" />
                <p className="text-[9px] text-gray-500">AI ვერ შესთავაზებს ლოკალურ ფასზე ამ %-ით მეტს/ნაკლებს.</p>
              </div>
            </div>
          </div>

          {/* 🖥️ ლოკალური ალგორითმი */}
          <div className="p-4 bg-gray-900/50 border border-gray-700 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wide flex items-center gap-2">🖥️ ლოკალური ალგორითმი (სარეზერვო)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Toggle label="ლოკალური ალგორითმის გამოყენება" description="გამოიყენება როგორც ბაზისური ფასი AI-ს კორექტირებისთვის." checked={config.use_local_algorithm} onChange={(v) => handleConfigChange('use_local_algorithm', v)} />
              <Input label="ბაზისური ტარიფი (₾/კმ)" type="number" value={config.local_base_rate_per_km} onChange={(v) => handleConfigChange('local_base_rate_per_km', Number(v))} placeholder="1.5" />
            </div>
          </div>

          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-[10px] text-blue-300">
            💡 <strong>როგორ მუშაობს სისტემა?</strong><br/>
            1. სისტემა ჯერ ცდის <strong>Priority #1</strong> პლატფორმას (Gemini)<br/>
            2. თუ ლიმიტი ამოიწურა → გადადის <strong>Priority #2</strong>-ზე (Groq)<br/>
            3. თუ ესეც ვერ მუშაობს → <strong>Priority #3-4</strong> (ChatGPT/Claude)<br/>
            4. თუ ყველა API პრობლემაა → <strong>ლოკალური ალგორითმი</strong>
          </div>
        </div>
      </div>
    </div>
  )
}