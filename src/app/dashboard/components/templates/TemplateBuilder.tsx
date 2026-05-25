'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import InvoiceRenderer from './InvoiceRenderer'

// ✅ ფუნქცია ფაილის Base64-ში გადასაყვანად
const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader()
  reader.readAsDataURL(file)
  reader.onload = () => resolve(reader.result as string)
  reader.onerror = (error) => reject(error)
})

// ✅ Deep merge helper - აერთიანებს ობიექტებს რეკურსიულად
// ეს ფუნქცია ავსებს ნაკლულ ველებს DEFAULT_TEMPLATE-დან
function deepMerge(target: any, source: any): any {
  const output = { ...target }
  if (typeof source === 'object' && source !== null) {
    Object.keys(source).forEach(key => {
      if (
        source[key] instanceof Object &&
        key in target &&
        target[key] instanceof Object
      ) {
        output[key] = deepMerge(target[key], source[key])
      } else {
        output[key] = source[key]
      }
    })
  }
  return output
}

// ✅ ახალი სტრუქტურა სმარტ-ფუნქციონალით
const DEFAULT_TEMPLATE = {
  company: { 
    name: 'შპს "კომპანია"', 
    address: 'ქალაქი, ქუჩა ქ.N 7', 
    email: 'logistics@gmail.com', 
    show_logo: false, 
    logo_url: '' 
  },
  invoice_meta: {
    title: 'INVOICE',
    // 🔢 ინვოისის ნომერი
    invoice_number_mode: 'auto_tracking', // 'auto_tracking' | 'auto_sequence' | 'manual'
    manual_invoice_number: '',
    sequence_prefix: 'INV-',
    // 📅 თარიღი
    issue_date_mode: 'auto_current', // 'auto_current' | 'auto_order' | 'manual'
    manual_issue_date: '',
    date_format: 'DD.MM.YYYY',
    // ⏳ გადახდის ვადა
    due_date_mode: 'auto_offset', // 'auto_offset' | 'fixed' | 'none'
    due_date_offset_days: 14,
    fixed_due_date: '',
    // 🌐 დამატებითი
    show_qr_payment: true,
    show_watermark: true,
    language: 'ka', // 'ka' | 'en'
  },
  bill_to: { 
    title: 'გადამხდელი/Bill to', 
    show_company_name: true, 
    show_address: true, 
    show_tax_id: true, 
    show_email: true, 
    tax_id_label: 'ს/კ' 
  },
  service_details: { 
    show_exporter: true, exporter_label: 'ექსპორტიორი:', 
    show_transport_type: true, transport_type_label: 'გადაზიდვის სახეობა:', 
    show_container_number: true, container_number_label: 'კონტეინერის ნომერი:', 
    show_volume_weight: true, volume_weight_label: 'მოცულობა/წონა:', 
    show_quantity: true, quantity_label: 'რაოდენობა:', 
    show_loading_place: true, loading_place_label: 'დატვირთვის ადგილი:', 
    show_destination: true, destination_label: 'დანიშნულების ადგილი:' 
  },
  line_items: { 
    description_label: 'მომსახურების აღწერილობა', 
    show_price: true, price_label: 'ფასი', 
    show_vat: true, vat_label: '18%', 
    show_total: true, total_label: 'სრულად', 
    vat_rate: 18,
    vat_exempt: false
  },
  footer: { 
    show_amount_in_words: true, amount_in_words_label: 'თანხა სიტყვიერად:', 
    show_bank_details: true, 
    bank_details: 'ანგარიშსწორების ანგარიში შპს"კომპანია" ს.ს"თიბისი ბანკი" SWIFT:TBCBGE22', 
    show_notes: true, notes_label: 'შენიშვნა*', 
    show_signature: true, signature_label: 'ხელმოწერა',
    stamp_image: '', 
    signature_image: ''
  },
  styling: { 
    primary_color: '#1e40af', 
    font: 'system-ui', 
    layout: 'georgian-standard' 
  }
}

interface TemplateBuilderProps { 
  templateId?: string | null
  onSave?: () => void 
}

export default function TemplateBuilder({ templateId, onSave }: TemplateBuilderProps) {
  const [config, setConfig] = useState(DEFAULT_TEMPLATE)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('ქართული ინვოისი')
  const [isDefault, setIsDefault] = useState(false)
  const [activeTab, setActiveTab] = useState<'general' | 'company' | 'service' | 'footer' | 'style'>('general')
  
  // ✅ შაბლონების სია
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [templatesLoading, setTemplatesLoading] = useState(true)
  
  // ✅ პრევიუს რეჟიმი & ავტო-შენახვა
  const [previewMode, setPreviewMode] = useState<'template' | 'real'>('template')
  const [autoSaving, setAutoSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)

  // ✅ ჩატვირთვა
  useEffect(() => { loadTemplates() }, [])
  
  // ✅ ავტო-შენახვა (ყოველ 60წმ)
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedTemplateId && !loading && name !== 'ახალი შაბლონი') {
        setAutoSaving(true)
        handleSave(true) // silent save
      }
    }, 60000)
    return () => clearInterval(interval)
  }, [selectedTemplateId, config, name, isDefault])

  const loadTemplates = async () => {
    setTemplatesLoading(true)
    try {
      const { data, error } = await supabase
        .from('invoice_templates')
        .select('*')
        .order('updated_at', { ascending: false })
      
      if (error) throw error
      
      setTemplates(data || [])
      
      if (data && data.length > 0) {
        const templateToLoad = templateId 
          ? data.find(t => t.id === templateId) 
          : data[0]
        
        if (templateToLoad) {
          setSelectedTemplateId(templateToLoad.id)
          // ✅ ფიქსი: deep merge with defaults to prevent undefined values
          setConfig(deepMerge(DEFAULT_TEMPLATE, templateToLoad.template_json || {}))
          setName(templateToLoad.name)
          setIsDefault(templateToLoad.is_default || false)
        }
      }
    } catch (err) {
      console.error('❌ Failed to load templates:', err)
    } finally {
      setTemplatesLoading(false)
    }
  }

  const loadTemplate = async (id: string) => {
    const { data, error } = await supabase.from('invoice_templates').select('*').eq('id', id).single()
    if (data && !error) {
      setSelectedTemplateId(id)
      // ✅ ფიქსი: deep merge with defaults to prevent undefined values
      setConfig(deepMerge(DEFAULT_TEMPLATE, data.template_json || {}))
      setName(data.name)
      setIsDefault(data.is_default || false)
    }
  }

  const handleChange = (section: keyof typeof config, key: string, value: any) => {
    setConfig(prev => ({ ...prev, [section]: { ...(prev[section] as any), [key]: value } }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'stamp_image' | 'signature_image') => {
    if (e.target.files?.[0]) { 
      try { handleChange('footer', type, await toBase64(e.target.files[0])) } catch {} 
    }
  }

  const handleSave = async (silent = false) => {
    setLoading(!silent)
    try {
      const payload = { 
        name, 
        template_json: config, 
        is_default: isDefault, 
        updated_at: new Date().toISOString() 
      }
      const { error, data } = selectedTemplateId 
        ? await supabase.from('invoice_templates').update(payload).eq('id', selectedTemplateId).select()
        : await supabase.from('invoice_templates').insert([payload]).select()
      
      if (error) throw error
      if (data?.[0]) { 
        setSelectedTemplateId(data[0].id)
        await loadTemplates() 
      }
      setLastSaved(new Date().toLocaleTimeString('ka-GE'))
      
      if (!silent) { alert('✅ თემფლეიტი შენახულია!') }
      
    } catch (err: any) { 
      if (!silent) alert(`❌ ${err.message}`) 
    } finally { 
      setLoading(!silent)
      setAutoSaving(false)
    }
  }

  const handleDelete = async (id: string, templateName: string) => {
    if (!confirm(`დარწმუნებული ხარ რომ გინდა წაშალო შაბლონი "${templateName}"?`)) return
    try {
      await supabase.from('invoice_templates').delete().eq('id', id)
      if (selectedTemplateId === id) { 
        setSelectedTemplateId(null)
        setConfig(DEFAULT_TEMPLATE)
        setName('ქართული ინვოისი')
        setIsDefault(false) 
      }
      await loadTemplates()
    } catch (err: any) { 
      alert(`❌ ${err.message}`) 
    }
  }

  const handleNew = () => { 
    setSelectedTemplateId(null)
    setConfig(DEFAULT_TEMPLATE)
    setName('ახალი შაბლონი')
    setIsDefault(false) 
  }

  // ✅ Mock data for real preview mode
  const mockRealData = {
    invoice_number: '2026-008', 
    issue_date: new Date().toISOString().split('T')[0], 
    due_date: new Date(Date.now() + 14*86400000).toISOString().split('T')[0],
    client_name: 'შპს სოლე ტრანსი', 
    client_tax_id: '428518311', 
    client_address: 'თბილისი, დავით აღმაშენებლის 100', 
    client_email: 'info@soletrans.ge',
    transport_type: 'სახმელეთო/LTL', 
    container_number: 'AN 008BL-AN004B', 
    loading_place: 'თბილისი', 
    destination: 'ქუთაისი',
    line_items: [{ description: 'ტრანსპორტირება თბილისი-ქუთაისი', price: 677.97 }],
    total_amount: 800, 
    total_in_words: 'რვაასი ლარი', 
    currency: 'GEL', 
    status: 'SENT', 
    iban: 'GE06TB7146936080100013'
  }

  const tabs = [
    { id: 'general', label: '📋 ზოგადი' }, 
    { id: 'company', label: '🏢 კომპანია' }, 
    { id: 'service', label: '🚛 მომსახურება' }, 
    { id: 'footer', label: '📝 ქვედა ნაწილი' }, 
    { id: 'style', label: '🎨 სტილი' }
  ]

  // ✅ ხელმისაწვდომი ცვლადები
  const variables = [
    '{{tracking_code}}', '{{order_date}}', '{{issue_date}}', '{{due_date}}', 
    '{{client.name}}', '{{client.tax_id}}', '{{totals.subtotal}}', '{{totals.vat}}', '{{totals.grand}}'
  ]

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      
      {/* 🎯 მთავარი კონტენტი - 50/50 ლაუთი */}
      <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
        
        {/* 🛠️ რედაქტორი - 50% */}
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl overflow-hidden flex flex-col min-h-0">
          {/* Tabs + Preview Toggle */}
          <div className="flex border-b border-gray-700 overflow-x-auto items-center justify-between px-2 flex-shrink-0">
            <div className="flex">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-2 text-xs font-medium whitespace-nowrap transition ${
                    activeTab === tab.id 
                      ? 'bg-blue-600/20 text-blue-400 border-b-2 border-blue-500' 
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {/* ✅ პრევიუს რეჟიმის გადამრთველი */}
            <div className="flex bg-gray-700/50 rounded p-0.5">
              <button 
                onClick={() => setPreviewMode('template')} 
                className={`px-2 py-1 text-[10px] rounded transition ${
                  previewMode === 'template' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                🎨 შაბლონი
              </button>
              <button 
                onClick={() => setPreviewMode('real')} 
                className={`px-2 py-1 text-[10px] rounded transition ${
                  previewMode === 'real' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                📊 რეალური
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-5">
            
            {/* 📋 ზოგადი ტაბი - სმარტ ველები */}
            {activeTab === 'general' && (
              <div className="space-y-5">
                {/* სახელი და დეფოლტი */}
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-sm text-white"
                  placeholder="შაბლონის სახელი"
                />
                <label className="flex items-center gap-2 text-xs text-gray-300">
                  <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} /> 
                  დეფოლტ შაბლონი
                </label>
                
                {/* 🔢 ინვოისის ნომერი */}
                <div className="p-3 bg-gray-700/20 rounded-lg border border-gray-600/50">
                  <h4 className="text-xs font-bold text-gray-400 mb-2">🔢 ინვოისის ნომერი</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                      <input 
                        type="radio" 
                        name="inv_num" 
                        checked={config.invoice_meta.invoice_number_mode === 'auto_tracking'} 
                        onChange={() => handleChange('invoice_meta', 'invoice_number_mode', 'auto_tracking')} 
                      /> 
                      ავტო: შეკვეთის კოდიდან <code className="bg-gray-800 px-1 rounded text-blue-400 text-[10px]">{'{{tracking_code}}'}</code>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                      <input 
                        type="radio" 
                        name="inv_num" 
                        checked={config.invoice_meta.invoice_number_mode === 'auto_sequence'} 
                        onChange={() => handleChange('invoice_meta', 'invoice_number_mode', 'auto_sequence')} 
                      /> 
                      ავტო: სერიული ნუმერაცია (მაგ: INV-001)
                    </label>
                    {config.invoice_meta.invoice_number_mode === 'auto_sequence' && (
                      <input 
                        type="text" 
                        value={config.invoice_meta.sequence_prefix || ''} 
                        onChange={e => handleChange('invoice_meta', 'sequence_prefix', e.target.value)} 
                        className="ml-5 w-32 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs text-white" 
                        placeholder="Prefix (მაგ: INV-)" 
                      />
                    )}
                    <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                      <input 
                        type="radio" 
                        name="inv_num" 
                        checked={config.invoice_meta.invoice_number_mode === 'manual'} 
                        onChange={() => handleChange('invoice_meta', 'invoice_number_mode', 'manual')} 
                      /> 
                      მანუალური
                    </label>
                    {config.invoice_meta.invoice_number_mode === 'manual' && (
                      <input 
                        type="text" 
                        value={config.invoice_meta.manual_invoice_number || ''} 
                        onChange={e => handleChange('invoice_meta', 'manual_invoice_number', e.target.value)} 
                        className="ml-5 w-40 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs text-white" 
                        placeholder="შეიყვანეთ ნომერი" 
                      />
                    )}
                  </div>
                </div>

                {/* 📅 თარიღი & ⏳ ვადა */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-700/20 rounded-lg border border-gray-600/50">
                    <h4 className="text-xs font-bold text-gray-400 mb-2">📅 თარიღი</h4>
                    <label className="flex items-center gap-2 text-xs text-gray-300 mb-1 cursor-pointer">
                      <input 
                        type="radio" 
                        name="date" 
                        checked={config.invoice_meta.issue_date_mode === 'auto_current'} 
                        onChange={() => handleChange('invoice_meta', 'issue_date_mode', 'auto_current')} 
                      /> 
                      შექმნის დღე
                    </label>
                    <label className="flex items-center gap-2 text-xs text-gray-300 mb-1 cursor-pointer">
                      <input 
                        type="radio" 
                        name="date" 
                        checked={config.invoice_meta.issue_date_mode === 'auto_order'} 
                        onChange={() => handleChange('invoice_meta', 'issue_date_mode', 'auto_order')} 
                      /> 
                      შეკვეთის თარიღი
                    </label>
                    <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                      <input 
                        type="radio" 
                        name="date" 
                        checked={config.invoice_meta.issue_date_mode === 'manual'} 
                        onChange={() => handleChange('invoice_meta', 'issue_date_mode', 'manual')} 
                      /> 
                      მანუალური
                    </label>
                    {config.invoice_meta.issue_date_mode === 'manual' && (
                      <input 
                        type="date" 
                        value={config.invoice_meta.manual_issue_date || ''} 
                        onChange={e => handleChange('invoice_meta', 'manual_issue_date', e.target.value)} 
                        className="mt-2 w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs text-white" 
                      />
                    )}
                  </div>
                  <div className="p-3 bg-gray-700/20 rounded-lg border border-gray-600/50">
                    <h4 className="text-xs font-bold text-gray-400 mb-2">⏳ გადახდის ვადა</h4>
                    <label className="flex items-center gap-2 text-xs text-gray-300 mb-1 cursor-pointer">
                      <input 
                        type="radio" 
                        name="due" 
                        checked={config.invoice_meta.due_date_mode === 'auto_offset'} 
                        onChange={() => handleChange('invoice_meta', 'due_date_mode', 'auto_offset')} 
                      /> 
                      ავტო: თარიღი + 
                      <input 
                        type="number" 
                        value={config.invoice_meta.due_date_offset_days || 14} 
                        onChange={e => handleChange('invoice_meta', 'due_date_offset_days', parseInt(e.target.value) || 0)} 
                        className="w-10 px-1 bg-gray-800 border border-gray-600 rounded text-xs text-white mx-1 text-center" 
                      /> 
                      დღე
                    </label>
                    <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                      <input 
                        type="radio" 
                        name="due" 
                        checked={config.invoice_meta.due_date_mode === 'none'} 
                        onChange={() => handleChange('invoice_meta', 'due_date_mode', 'none')} 
                      /> 
                      არ ჩაწერო
                    </label>
                  </div>
                </div>

                {/* 🌐 დამატებითი ფუნქციები */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <label className="flex items-center gap-2 p-2 bg-gray-700/20 rounded border border-gray-600/50 cursor-pointer hover:bg-gray-700/30 transition">
                    <input type="checkbox" checked={config.invoice_meta.show_qr_payment} onChange={e => handleChange('invoice_meta', 'show_qr_payment', e.target.checked)} /> 
                    📱 QR გადახდა
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-gray-700/20 rounded border border-gray-600/50 cursor-pointer hover:bg-gray-700/30 transition">
                    <input type="checkbox" checked={config.invoice_meta.show_watermark} onChange={e => handleChange('invoice_meta', 'show_watermark', e.target.checked)} /> 
                    💧 სტატუსის წყლის ნიშანი
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-gray-700/20 rounded border border-gray-600/50 cursor-pointer hover:bg-gray-700/30 transition">
                    <input type="checkbox" checked={config.line_items.vat_exempt} onChange={e => handleChange('line_items', 'vat_exempt', e.target.checked)} /> 
                    🚫 დღგ-სგან გათავისუფლებული
                  </label>
                  <select 
                    value={config.invoice_meta.language || 'ka'} 
                    onChange={e => handleChange('invoice_meta', 'language', e.target.value)} 
                    className="p-2 bg-gray-700/20 border border-gray-600/50 rounded text-gray-300 outline-none cursor-pointer"
                  >
                    <option value="ka">🇬🇪 ქართული</option>
                    <option value="en">🇬🇧 English</option>
                  </select>
                </div>

                {/* 📖 ცვლადების გიდი */}
                <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                  <h4 className="text-xs font-bold text-blue-400 mb-1">💡 ხელმისაწვდომი ცვლადები</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {variables.map(v => (
                      <span key={v} className="text-[10px] bg-gray-800 px-2 py-0.5 rounded border border-gray-600 text-gray-400 font-mono">
                        {v}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-500 mt-2">
                    * სისტემა ავტომატურად ჩაანაცვლებს ამ ცვლადებს რეალური მონაცემებით ინვოისის გენერაციისას.
                  </p>
                </div>
              </div>
            )}

            {/* 🏢 კომპანია */}
            {activeTab === 'company' && (
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={config.company.show_logo} onChange={e => handleChange('company', 'show_logo', e.target.checked)} /> 
                  ლოგოს ჩვენება
                </label>
                <input type="text" value={config.company.name || ''} onChange={e => handleChange('company', 'name', e.target.value)} placeholder="კომპანიის სახელი" className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-xs text-white" />
                <input type="text" value={config.company.address || ''} onChange={e => handleChange('company', 'address', e.target.value)} placeholder="მისამართი" className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-xs text-white" />
                <input type="email" value={config.company.email || ''} onChange={e => handleChange('company', 'email', e.target.value)} placeholder="ელ-ფოსტა" className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-xs text-white" />
              </div>
            )}

            {/* 🚛 მომსახურება */}
            {activeTab === 'service' && (
              <div className="space-y-4">
                <div className="p-3 bg-gray-700/30 rounded-lg space-y-2">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase">გადაზიდვის დეტალები</h4>
                  {['show_exporter', 'show_transport_type', 'show_container_number', 'show_volume_weight', 'show_quantity', 'show_loading_place', 'show_destination'].map(key => (
                    <label key={key} className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                      <input type="checkbox" checked={(config.service_details as any)[key]} onChange={e => handleChange('service_details', key, e.target.checked)} /> 
                      {(config.service_details as any)[`${key.replace('show_', '')}_label`] || ''}
                    </label>
                  ))}
                </div>
                <div className="p-3 bg-gray-700/30 rounded-lg">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">ხაზების ცხრილი</h4>
                  <input type="text" value={config.line_items.description_label || ''} onChange={e => handleChange('line_items', 'description_label', e.target.value)} placeholder="აღწერის ლეიბლი" className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-xs text-white mb-2" />
                  <input type="number" value={config.line_items.vat_rate || 18} onChange={e => handleChange('line_items', 'vat_rate', e.target.value)} placeholder="გადასახადი %" className="px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-xs text-white" />
                </div>
              </div>
            )}

            {/* 📝 ქვედა ნაწილი */}
            {activeTab === 'footer' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-2">🔵 კომპანიის ბეჭედი</label>
                    <input type="file" accept="image/png,image/jpeg" onChange={(e) => handleImageUpload(e, 'stamp_image')} className="block w-full text-xs text-gray-400 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer" />
                    <p className="text-[10px] text-gray-500 mt-1">ატვირთეთ PNG/JPG ფაილი (გირჩევთ გამჭვირვალე ფონს)</p>
                    {config.footer.stamp_image && (
                      <>
                        <div className="mt-2 h-20 flex items-center justify-center bg-white rounded p-1 border border-gray-300">
                          <img src={config.footer.stamp_image} alt="Stamp" className="max-h-full max-w-full object-contain" />
                        </div>
                        <button onClick={() => handleChange('footer', 'stamp_image', '')} className="text-[10px] text-red-400 mt-1 hover:text-red-300">❌ წაშლა</button>
                      </>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-2">✍️ ხელმოწერა</label>
                    <input type="file" accept="image/png,image/jpeg" onChange={(e) => handleImageUpload(e, 'signature_image')} className="block w-full text-xs text-gray-400 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer" />
                    <p className="text-[10px] text-gray-500 mt-1">ატვირთეთ ხელმოწერის სკანი ან PNG</p>
                    {config.footer.signature_image && (
                      <>
                        <div className="mt-2 h-20 flex items-center justify-center bg-white rounded p-1 border border-gray-300">
                          <img src={config.footer.signature_image} alt="Sign" className="max-h-full max-w-full object-contain" />
                        </div>
                        <button onClick={() => handleChange('footer', 'signature_image', '')} className="text-[10px] text-red-400 mt-1 hover:text-red-300">❌ წაშლა</button>
                      </>
                    )}
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={config.footer.show_amount_in_words} onChange={e => handleChange('footer', 'show_amount_in_words', e.target.checked)} /> 
                  თანხა სიტყვიერად
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={config.footer.show_bank_details} onChange={e => handleChange('footer', 'show_bank_details', e.target.checked)} /> 
                  საბანკო რეკვიზიტები
                </label>
                {config.footer.show_bank_details && (
                  <textarea value={config.footer.bank_details || ''} onChange={e => handleChange('footer', 'bank_details', e.target.value)} placeholder="საბანკო რეკვიზიტები" className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-xs text-white resize-none" rows={2} />
                )}
                <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={config.footer.show_notes} onChange={e => handleChange('footer', 'show_notes', e.target.checked)} /> 
                  შენიშვნების ველი
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={config.footer.show_signature} onChange={e => handleChange('footer', 'show_signature', e.target.checked)} /> 
                  ხელმოწერის ველი
                </label>
              </div>
            )}

            {/* 🎨 სტილი */}
            {activeTab === 'style' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input type="color" value={config.styling.primary_color || '#1e40af'} onChange={e => handleChange('styling', 'primary_color', e.target.value)} className="w-10 h-8 rounded cursor-pointer bg-transparent border border-gray-600" />
                  <span className="text-xs text-gray-300">ძირითადი ფერი</span>
                </div>
              </div>
            )}
          </div>

          {/* Save Footer */}
          <div className="p-3 border-t border-gray-700 flex justify-between items-center bg-gray-800/40 flex-shrink-0">
            <div className="text-[10px] text-gray-500">
              {autoSaving ? '🔄 ავტო-შენახვა...' : lastSaved ? `✅ ბოლოს შენახვა: ${lastSaved}` : ''}
            </div>
            <div className="flex gap-2">
              <button onClick={handleNew} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium rounded transition">🔄 ახალი</button>
              <button 
                onClick={() => handleSave(false)} 
                disabled={loading} 
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded transition disabled:opacity-50 shadow-lg shadow-blue-500/20"
              >
                {loading ? '🔄...' : '💾 შენახვა'}
              </button>
            </div>
          </div>
        </div>

        {/* 👁️ Preview - 50%, დინამიური მონაცემებით */}
        <div className="bg-gray-100 rounded-xl overflow-hidden flex flex-col border border-gray-300 min-h-0">
          <div className="p-3 border-b border-gray-300 bg-gray-50 flex-shrink-0">
            <h3 className="text-xs font-bold text-gray-600 text-center">
              👁️ {previewMode === 'template' ? 'შაბლონის პრევიუ' : 'რეალური მონაცემები'}
            </h3>
          </div>
          <div className="flex-1 overflow-auto p-4 flex justify-center bg-gray-200">
            <div className="transform origin-top scale-[0.7]">
              <InvoiceRenderer 
                config={config} 
                invoiceData={previewMode === 'template' ? {} : mockRealData} 
                isTemplate={previewMode === 'template'} 
              />
            </div>
          </div>
        </div>
      </div>
      
    </div>
  )
}