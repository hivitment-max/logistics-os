'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import InvoiceRenderer from './InvoiceRenderer'

// ════════════════════════════════════════════
// helpers — უცვლელია (შენი ლოგიკა)
// ════════════════════════════════════════════
const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader()
  reader.readAsDataURL(file)
  reader.onload  = () => resolve(reader.result as string)
  reader.onerror = (e) => reject(e)
})

function deepMerge(target: any, source: any): any {
  const output = { ...target }
  if (typeof source === 'object' && source !== null) {
    Object.keys(source).forEach(key => {
      if (source[key] instanceof Object && key in target && target[key] instanceof Object) {
        output[key] = deepMerge(target[key], source[key])
      } else {
        output[key] = source[key]
      }
    })
  }
  return output
}

// ════════════════════════════════════════════
// DEFAULT_TEMPLATE — უცვლელია (შენი სტრუქტურა)
// ════════════════════════════════════════════
const DEFAULT_TEMPLATE = {
  company: { name: 'შპს "კომპანია"', address: 'ქალაქი, ქუჩა ქ.N 7', email: 'logistics@gmail.com', show_logo: false, logo_url: '' },
  invoice_meta: {
    title: 'INVOICE',
    invoice_number_mode: 'auto_tracking',
    manual_invoice_number: '', sequence_prefix: 'INV-',
    issue_date_mode: 'auto_current', manual_issue_date: '', date_format: 'DD.MM.YYYY',
    due_date_mode: 'auto_offset', due_date_offset_days: 14, fixed_due_date: '',
    show_qr_payment: true, show_watermark: true, language: 'ka',
  },
  bill_to: { title: 'გადამხდელი/Bill to', show_company_name: true, show_address: true, show_tax_id: true, show_email: true, tax_id_label: 'ს/კ' },
  service_details: {
    show_exporter: true, exporter_label: 'ექსპორტიორი:',
    show_transport_type: true, transport_type_label: 'გადაზიდვის სახეობა:',
    show_container_number: true, container_number_label: 'კონტეინერის ნომერი:',
    show_volume_weight: true, volume_weight_label: 'მოცულობა/წონა:',
    show_quantity: true, quantity_label: 'რაოდენობა:',
    show_loading_place: true, loading_place_label: 'დატვირთვის ადგილი:',
    show_destination: true, destination_label: 'დანიშნულების ადგილი:',
  },
  line_items: {
    description_label: 'მომსახურების აღწერილობა',
    show_price: true, price_label: 'ფასი',
    show_vat: true, vat_label: '18%',
    show_total: true, total_label: 'სრულად',
    vat_rate: 18, vat_exempt: false,
  },
  footer: {
    show_amount_in_words: true, amount_in_words_label: 'თანხა სიტყვიერად:',
    show_bank_details: true,
    bank_details: 'ანგარიშსწორების ანგარიში შპს"კომპანია" ს.ს"თიბისი ბანკი" SWIFT:TBCBGE22',
    show_notes: true, notes_label: 'შენიშვნა*',
    show_signature: true, signature_label: 'ხელმოწერა',
    stamp_image: '', signature_image: '',
  },
  styling: { primary_color: '#1e40af', font: 'system-ui', layout: 'georgian-standard' },
}

interface TemplateBuilderProps {
  templateId?: string | null
  onSave?: () => void
}

// ════════════════════════════════════════════
// UI კომპონენტები (Claude დიზაინი)
// ════════════════════════════════════════════
const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-4 w-7 items-center rounded-full border-0 transition-colors duration-200 cursor-pointer flex-shrink-0 ${
      checked ? 'bg-blue-500' : 'bg-gray-600'
    }`}
  >
    <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform duration-200 ${
      checked ? 'translate-x-3.5' : 'translate-x-0.5'
    }`} />
  </button>
)

const ToggleRow = ({
  icon, label, checked, onChange,
}: { icon: string; label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-700/50 bg-gray-800/30 gap-3">
    <span className="flex items-center gap-2 text-xs text-gray-300">
      <i className={`ti ${icon} text-gray-500`} aria-hidden="true" style={{ fontSize: 13 }} />
      {label}
    </span>
    <ToggleSwitch checked={checked} onChange={onChange} />
  </div>
)

const RadioCard = ({
  name, checked, onChange, children,
}: { name: string; checked: boolean; onChange: () => void; children: React.ReactNode }) => (
  <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-xs transition-all duration-150 ${
    checked
      ? 'border-blue-500/40 bg-blue-500/10 text-blue-300'
      : 'border-gray-700/50 bg-gray-800/30 text-gray-400 hover:border-gray-600 hover:text-gray-300'
  }`}>
    <input type="radio" name={name} checked={checked} onChange={onChange} className="accent-blue-500 flex-shrink-0" />
    {children}
  </label>
)

const FormSection = ({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) => (
  <div className="rounded-xl border border-gray-700/50 overflow-hidden">
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/60 border-b border-gray-700/50">
      <i className={`ti ${icon} text-gray-500`} aria-hidden="true" style={{ fontSize: 14 }} />
      <span className="text-xs font-medium text-gray-300">{title}</span>
    </div>
    <div className="p-3 bg-gray-800/20 space-y-2">{children}</div>
  </div>
)

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wide">{label}</label>
    {children}
  </div>
)

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={`w-full px-3 py-1.5 bg-gray-800/60 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition ${props.className ?? ''}`} />
)

const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...props} className="w-full px-3 py-2 bg-gray-800/60 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500 transition resize-none" />
)

const VarChip = ({ v }: { v: string }) => (
  <span className="inline-flex text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono cursor-pointer hover:bg-blue-500/20 transition-colors">
    {v}
  </span>
)

// ════════════════════════════════════════════
// TABS config
// ════════════════════════════════════════════
const TABS = [
  { id: 'general', label: 'ზოგადი',   icon: 'ti-layout-list'  },
  { id: 'company', label: 'კომპანია', icon: 'ti-building'      },
  { id: 'service', label: 'სერვისი',  icon: 'ti-truck'         },
  { id: 'footer',  label: 'ქვედა',    icon: 'ti-file-text'     },
  { id: 'style',   label: 'სტილი',    icon: 'ti-palette'       },
] as const

type TabId = typeof TABS[number]['id']

const VARIABLES = [
  '{{tracking_code}}', '{{order_date}}', '{{issue_date}}', '{{due_date}}',
  '{{client.name}}', '{{client.tax_id}}', '{{totals.subtotal}}', '{{totals.vat}}', '{{totals.grand}}',
]

const COLOR_SWATCHES = [
  { hex: '#1e40af', label: 'Blue'   },
  { hex: '#065f46', label: 'Green'  },
  { hex: '#7c3aed', label: 'Violet' },
  { hex: '#9f1239', label: 'Rose'   },
  { hex: '#92400e', label: 'Amber'  },
  { hex: '#111827', label: 'Dark'   },
]

// ════════════════════════════════════════════
// Mock data — უცვლელია (შენი მონაცემები)
// ════════════════════════════════════════════
const MOCK_REAL_DATA = {
  invoice_number: '2026-008',
  issue_date: new Date().toISOString().split('T')[0],
  due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
  client_name: 'შპს სოლე ტრანსი', client_tax_id: '428518311',
  client_address: 'თბილისი, დავით აღმაშენებლის 100', client_email: 'info@soletrans.ge',
  transport_type: 'სახმელეთო/LTL', container_number: 'AN 008BL-AN004B',
  loading_place: 'თბილისი', destination: 'ქუთაისი',
  line_items: [{ description: 'ტრანსპორტირება თბილისი-ქუთაისი', price: 677.97 }],
  total_amount: 800, total_in_words: 'რვაასი ლარი', currency: 'GEL', status: 'SENT',
  iban: 'GE06TB7146936080100013',
}

// ════════════════════════════════════════════
// TemplateBuilder — მთავარი კომპონენტი
// ════════════════════════════════════════════
export default function TemplateBuilder({ templateId, onSave }: TemplateBuilderProps) {
  // ✅ STATE — უცვლელია (შენი ლოგიკა)
  const [config, setConfig]                   = useState(DEFAULT_TEMPLATE)
  const [loading, setLoading]                 = useState(false)
  const [name, setName]                       = useState('ქართული ინვოისი')
  const [isDefault, setIsDefault]             = useState(false)
  const [activeTab, setActiveTab]             = useState<TabId>('general')
  const [templates, setTemplates]             = useState<any[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [previewMode, setPreviewMode]         = useState<'template' | 'real'>('template')
  const [autoSaving, setAutoSaving]           = useState(false)
  const [lastSaved, setLastSaved]             = useState<string | null>(null)
  const [ddOpen, setDdOpen]                   = useState(false)

  // ✅ EFFECTS — უცვლელია
  useEffect(() => { loadTemplates() }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedTemplateId && !loading && name !== 'ახალი შაბლონი') {
        setAutoSaving(true)
        handleSave(true)
      }
    }, 60000)
    return () => clearInterval(interval)
  }, [selectedTemplateId, config, name, isDefault])

  // ✅ FUNCTIONS — უცვლელია (შენი ლოგიკა)
  const loadTemplates = async () => {
    setTemplatesLoading(true)
    try {
      const { data, error } = await supabase
        .from('invoice_templates').select('*').order('updated_at', { ascending: false })
      if (error) throw error
      setTemplates(data || [])
      if (data && data.length > 0) {
        const tpl = templateId ? data.find((t: any) => t.id === templateId) : data[0]
        if (tpl) {
          setSelectedTemplateId(tpl.id)
          setConfig(deepMerge(DEFAULT_TEMPLATE, tpl.template_json || {}))
          setName(tpl.name)
          setIsDefault(tpl.is_default || false)
        }
      }
    } catch (err) { console.error('❌ Failed to load templates:', err) }
    finally { setTemplatesLoading(false) }
  }

  const loadTemplate = async (id: string) => {
    const { data, error } = await supabase.from('invoice_templates').select('*').eq('id', id).single()
    if (data && !error) {
      setSelectedTemplateId(id)
      setConfig(deepMerge(DEFAULT_TEMPLATE, data.template_json || {}))
      setName(data.name)
      setIsDefault(data.is_default || false)
    }
    setDdOpen(false)
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
      const payload = { name, template_json: config, is_default: isDefault, updated_at: new Date().toISOString() }
      const { error, data } = selectedTemplateId
        ? await supabase.from('invoice_templates').update(payload).eq('id', selectedTemplateId).select()
        : await supabase.from('invoice_templates').insert([payload]).select()
      if (error) throw error
      if (data?.[0]) { setSelectedTemplateId(data[0].id); await loadTemplates() }
      setLastSaved(new Date().toLocaleTimeString('ka-GE'))
      if (!silent) alert('✅ შაბლონი შენახულია!')
    } catch (err: any) { if (!silent) alert(`❌ ${err.message}`) }
    finally { setLoading(false); setAutoSaving(false) }
  }

  const handleDelete = async (id: string, tplName: string) => {
    if (!confirm(`წაიშალოს შაბლონი "${tplName}"?`)) return
    try {
      await supabase.from('invoice_templates').delete().eq('id', id)
      if (selectedTemplateId === id) { setSelectedTemplateId(null); setConfig(DEFAULT_TEMPLATE); setName('ქართული ინვოისი'); setIsDefault(false) }
      await loadTemplates()
    } catch (err: any) { alert(`❌ ${err.message}`) }
  }

  const handleNew = () => {
    setSelectedTemplateId(null); setConfig(DEFAULT_TEMPLATE)
    setName('ახალი შაბლონი'); setIsDefault(false); setDdOpen(false)
  }

  // ── RENDER TABS (Claude დიზაინი + შენი ლოგიკა) ──────────────────────────────
  const renderGeneral = () => (
    <div className="space-y-3">
      <Field label="შაბლონის სახელი">
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="შაბლონის სახელი" />
      </Field>
      <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
        <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} className="accent-blue-500" />
        ძირითადი შაბლონი
      </label>

      <FormSection icon="ti-hash" title="ინვოისის ნომერი">
        <div className="space-y-1.5">
          <RadioCard name="invnum" checked={config.invoice_meta.invoice_number_mode === 'auto_tracking'} onChange={() => handleChange('invoice_meta','invoice_number_mode','auto_tracking')}>
            ავტო — შეკვეთის კოდი <code className="ml-1 text-[9px] bg-gray-700 px-1.5 py-0.5 rounded text-blue-400">{'{{'+'tracking_code'+'}}'}</code>
          </RadioCard>
          <RadioCard name="invnum" checked={config.invoice_meta.invoice_number_mode === 'auto_sequence'} onChange={() => handleChange('invoice_meta','invoice_number_mode','auto_sequence')}>
            სერიული ნუმერაცია <code className="ml-1 text-[9px] bg-gray-700 px-1.5 py-0.5 rounded text-blue-400">INV-001</code>
          </RadioCard>
          {config.invoice_meta.invoice_number_mode === 'auto_sequence' && (
            <Input className="ml-4 w-36" value={config.invoice_meta.sequence_prefix || ''} onChange={e => handleChange('invoice_meta','sequence_prefix',e.target.value)} placeholder="INV-" />
          )}
          <RadioCard name="invnum" checked={config.invoice_meta.invoice_number_mode === 'manual'} onChange={() => handleChange('invoice_meta','invoice_number_mode','manual')}>
            მანუალური
          </RadioCard>
          {config.invoice_meta.invoice_number_mode === 'manual' && (
            <Input className="ml-4 w-40" value={config.invoice_meta.manual_invoice_number || ''} onChange={e => handleChange('invoice_meta','manual_invoice_number',e.target.value)} placeholder="INV-0001" />
          )}
        </div>
      </FormSection>

      <div className="grid grid-cols-2 gap-3">
        <FormSection icon="ti-calendar" title="თარიღი">
          <div className="space-y-1.5">
            <RadioCard name="dt" checked={config.invoice_meta.issue_date_mode === 'auto_current'} onChange={() => handleChange('invoice_meta','issue_date_mode','auto_current')}>შექმნის დღე</RadioCard>
            <RadioCard name="dt" checked={config.invoice_meta.issue_date_mode === 'auto_order'} onChange={() => handleChange('invoice_meta','issue_date_mode','auto_order')}>შეკვეთის თარიღი</RadioCard>
            <RadioCard name="dt" checked={config.invoice_meta.issue_date_mode === 'manual'} onChange={() => handleChange('invoice_meta','issue_date_mode','manual')}>მანუალური</RadioCard>
            {config.invoice_meta.issue_date_mode === 'manual' && (
              <Input type="date" value={config.invoice_meta.manual_issue_date || ''} onChange={e => handleChange('invoice_meta','manual_issue_date',e.target.value)} />
            )}
          </div>
        </FormSection>
        <FormSection icon="ti-hourglass" title="გადახდის ვადა">
          <div className="space-y-1.5">
            <RadioCard name="due" checked={config.invoice_meta.due_date_mode === 'auto_offset'} onChange={() => handleChange('invoice_meta','due_date_mode','auto_offset')}>
              <span className="flex items-center gap-1">
                ავტო +
                <input type="number" value={config.invoice_meta.due_date_offset_days || 14} onChange={e => handleChange('invoice_meta','due_date_offset_days',parseInt(e.target.value)||0)}
                  className="w-9 px-1 text-center bg-gray-800 border border-gray-600 rounded text-xs text-white" onClick={e => e.stopPropagation()} />
                დღე
              </span>
            </RadioCard>
            <RadioCard name="due" checked={config.invoice_meta.due_date_mode === 'none'} onChange={() => handleChange('invoice_meta','due_date_mode','none')}>არ ჩაწეროს</RadioCard>
          </div>
        </FormSection>
      </div>

      <FormSection icon="ti-adjustments-horizontal" title="დამატებითი ფუნქციები">
        <ToggleRow icon="ti-qrcode" label="QR გადახდა" checked={config.invoice_meta.show_qr_payment} onChange={v => handleChange('invoice_meta','show_qr_payment',v)} />
        <ToggleRow icon="ti-droplet" label="სტატუსის ნიშანი" checked={config.invoice_meta.show_watermark} onChange={v => handleChange('invoice_meta','show_watermark',v)} />
        <ToggleRow icon="ti-ban" label="დღგ-სგან გათავისუფლება" checked={config.line_items.vat_exempt} onChange={v => handleChange('line_items','vat_exempt',v)} />
        <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-700/50 bg-gray-800/30">
          <span className="flex items-center gap-2 text-xs text-gray-300">
            <i className="ti ti-world text-gray-500" aria-hidden="true" style={{ fontSize: 13 }} /> ენა
          </span>
          <select value={config.invoice_meta.language || 'ka'} onChange={e => handleChange('invoice_meta','language',e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded text-xs text-white px-2 py-1 outline-none cursor-pointer">
            <option value="ka">ქართული</option>
            <option value="en">English</option>
          </select>
        </div>
      </FormSection>

      <div className="rounded-xl border border-blue-500/20 overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border-b border-blue-500/20">
          <i className="ti ti-variable text-blue-400" aria-hidden="true" style={{ fontSize: 14 }} />
          <span className="text-xs font-medium text-blue-400">ხელმისაწვდომი ცვლადები</span>
        </div>
        <div className="p-3 bg-blue-500/5 space-y-2">
          <div className="flex flex-wrap gap-1.5">{VARIABLES.map(v => <VarChip key={v} v={v} />)}</div>
          <p className="text-[10px] text-gray-500">სისტემა ავტომატურად ჩაანაცვლებს ამ ცვლადებს ინვოისის გენერაციისას.</p>
        </div>
      </div>
    </div>
  )

  const renderCompany = () => (
    <div className="space-y-3">
      <FormSection icon="ti-building" title="კომპანიის მონაცემები">
        <Field label="სახელი"><Input value={config.company.name || ''} onChange={e => handleChange('company','name',e.target.value)} /></Field>
        <Field label="მისამართი"><Input value={config.company.address || ''} onChange={e => handleChange('company','address',e.target.value)} /></Field>
        <Field label="ელ-ფოსტა"><Input type="email" value={config.company.email || ''} onChange={e => handleChange('company','email',e.target.value)} /></Field>
        <ToggleRow icon="ti-photo" label="ლოგოს ჩვენება" checked={config.company.show_logo} onChange={v => handleChange('company','show_logo',v)} />
      </FormSection>
    </div>
  )

  const renderService = () => (
    <div className="space-y-3">
      <FormSection icon="ti-truck" title="გადაზიდვის დეტალები">
        {[
          { key: 'show_exporter',         icon: 'ti-building-factory', label: 'ექსპორტიორი'           },
          { key: 'show_transport_type',    icon: 'ti-route',            label: 'გადაზიდვის სახეობა'    },
          { key: 'show_container_number',  icon: 'ti-container',        label: 'კონტეინერის ნომერი'    },
          { key: 'show_volume_weight',     icon: 'ti-weight',           label: 'მოცულობა / წონა'       },
          { key: 'show_quantity',          icon: 'ti-list-numbers',     label: 'რაოდენობა'             },
          { key: 'show_loading_place',     icon: 'ti-map-pin',          label: 'დატვირთვის ადგილი'     },
          { key: 'show_destination',       icon: 'ti-flag',             label: 'დანიშნულების ადგილი'   },
        ].map(({ key, icon, label }) => (
          <ToggleRow key={key} icon={icon} label={label}
            checked={(config.service_details as any)[key]}
            onChange={v => handleChange('service_details', key, v)} />
        ))}
      </FormSection>
      <FormSection icon="ti-table" title="ხაზების ცხრილი">
        <Field label="სვეტის სათაური"><Input value={config.line_items.description_label || ''} onChange={e => handleChange('line_items','description_label',e.target.value)} /></Field>
        <Field label="დღგ %"><Input type="number" value={config.line_items.vat_rate || 18} onChange={e => handleChange('line_items','vat_rate',parseInt(e.target.value)||0)} className="w-20" /></Field>
        <ToggleRow icon="ti-currency-lari" label="ფასის სვეტი" checked={config.line_items.show_price} onChange={v => handleChange('line_items','show_price',v)} />
        <ToggleRow icon="ti-receipt-tax" label="დღგ-ს სვეტი" checked={config.line_items.show_vat} onChange={v => handleChange('line_items','show_vat',v)} />
      </FormSection>
    </div>
  )

  const renderFooter = () => (
    <div className="space-y-3">
      <FormSection icon="ti-layout-bottombar" title="ქვედა სექცია">
        <ToggleRow icon="ti-message-dots"  label="თანხა სიტყვიერად"    checked={config.footer.show_amount_in_words} onChange={v => handleChange('footer','show_amount_in_words',v)} />
        <ToggleRow icon="ti-building-bank" label="საბანკო რეკვიზიტები" checked={config.footer.show_bank_details}   onChange={v => handleChange('footer','show_bank_details',v)} />
        <ToggleRow icon="ti-notes"         label="შენიშვნების ველი"     checked={config.footer.show_notes}          onChange={v => handleChange('footer','show_notes',v)} />
        <ToggleRow icon="ti-signature"     label="ხელმოწერის ველი"      checked={config.footer.show_signature}      onChange={v => handleChange('footer','show_signature',v)} />
        {config.footer.show_bank_details && (
          <Field label="საბანკო რეკვიზიტები">
            <Textarea rows={2} value={config.footer.bank_details || ''} onChange={e => handleChange('footer','bank_details',e.target.value)} />
          </Field>
        )}
      </FormSection>

      <FormSection icon="ti-photo" title="ბეჭედი და ხელმოწერა">
        <div className="grid grid-cols-2 gap-3">
          {(['stamp_image','signature_image'] as const).map(type => (
            <div key={type} className="space-y-1.5">
              <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                {type === 'stamp_image' ? 'კომპანიის ბეჭედი' : 'ხელმოწერა'}
              </label>
              <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-600 rounded-lg cursor-pointer text-xs text-gray-500 hover:border-blue-500 hover:text-blue-400 transition-colors">
                <i className="ti ti-upload" aria-hidden="true" style={{ fontSize: 13 }} />
                ატვირთვა
                <input type="file" accept="image/png,image/jpeg" onChange={e => handleImageUpload(e, type)} className="hidden" />
              </label>
              {config.footer[type] && (
                <div className="mt-1 relative">
                  <div className="h-16 flex items-center justify-center bg-white rounded border border-gray-300 p-1">
                    <img src={config.footer[type]} alt="" className="max-h-full max-w-full object-contain" />
                  </div>
                  <button onClick={() => handleChange('footer', type, '')} className="mt-1 text-[10px] text-red-400 hover:text-red-300 transition">წაშლა</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </FormSection>
    </div>
  )

  const renderStyle = () => (
    <div className="space-y-3">
      <FormSection icon="ti-palette" title="ძირითადი ფერი">
        <div className="flex items-center gap-3">
          <input type="color" value={config.styling.primary_color || '#1e40af'} onChange={e => handleChange('styling','primary_color',e.target.value)}
            className="w-9 h-8 rounded-lg border border-gray-600 cursor-pointer bg-transparent p-0.5" />
          <div className="flex gap-2 flex-wrap">
            {COLOR_SWATCHES.map(({ hex, label }) => (
              <button key={hex} title={label} onClick={() => handleChange('styling','primary_color',hex)}
                className={`w-6 h-6 rounded-lg border-2 transition-all ${config.styling.primary_color === hex ? 'border-white scale-110' : 'border-transparent hover:border-gray-500'}`}
                style={{ background: hex }} />
            ))}
          </div>
        </div>
      </FormSection>
      <FormSection icon="ti-typography" title="შრიფტი">
        <select value={config.styling.font || 'system-ui'} onChange={e => handleChange('styling','font',e.target.value)}
          className="w-full px-3 py-2 bg-gray-800/60 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500 cursor-pointer">
          <option value="system-ui">System UI</option>
          <option value="Georgia,serif">Georgia</option>
          <option value="Arial,sans-serif">Arial</option>
        </select>
      </FormSection>
    </div>
  )

  const tabRenderers: Record<TabId, () => React.ReactNode> = {
    general: renderGeneral,
    company: renderCompany,
    service: renderService,
    footer:  renderFooter,
    style:   renderStyle,
  }

  // ── JSX RETURN (Claude დიზაინი) ──────────────────────────────
  return (
    <div className="h-full flex flex-col gap-0 bg-gray-900 rounded-xl overflow-hidden border border-gray-700/50">

      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900 border-b border-gray-700/50 flex-shrink-0 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center flex-shrink-0">
            <i className="ti ti-file-invoice text-blue-400" aria-hidden="true" style={{ fontSize: 14 }} />
          </div>
          <span className="text-xs font-medium text-gray-200">ინვოისის შაბლონები</span>
          <span className="w-1 h-1 rounded-full bg-gray-600" />

          {/* Dropdown trigger */}
          <div className="relative">
            <button
              onClick={() => setDdOpen(v => !v)}
              className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-gray-700 bg-gray-800 text-xs font-medium text-gray-200 cursor-pointer transition-colors hover:border-gray-600"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
              {name}
              <i className="ti ti-chevron-down text-gray-500" aria-hidden="true" style={{ fontSize: 11 }} />
            </button>

            {/* DROPDOWN */}
            {ddOpen && (
              <div className="absolute top-[calc(100%+6px)] left-0 z-50 w-64 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-2xl"
                onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700/50">
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">შაბლონები</span>
                  <button onClick={handleNew} className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-md bg-blue-500/15 border border-blue-500/20 text-blue-400 hover:bg-blue-500/25 transition">
                    <i className="ti ti-plus" aria-hidden="true" style={{ fontSize: 11 }} /> ახალი
                  </button>
                </div>
                <div className="max-h-56 overflow-y-auto py-1 px-1">
                  {templatesLoading ? (
                    <div className="flex items-center justify-center py-4 text-gray-500 text-xs gap-2">
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-500" /> იტვირთება...
                    </div>
                  ) : templates.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 text-xs">შაბლონები არ მოიძებნა</div>
                  ) : templates.map((t: any) => (
                    <div key={t.id}
                      onClick={() => loadTemplate(t.id)}
                      className={`group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors ${
                        t.id === selectedTemplateId
                          ? 'bg-blue-500/15 border border-blue-500/20'
                          : 'hover:bg-gray-700/50 border border-transparent'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-md bg-gray-700/50 border border-gray-600/50 flex items-center justify-center flex-shrink-0">
                        <i className="ti ti-file-invoice text-gray-400" aria-hidden="true" style={{ fontSize: 12 }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-200 truncate">{t.name}</p>
                        <p className="text-[10px] text-gray-500">
                          {t.is_default && <span className="text-emerald-400 mr-1.5">✓ ძირითადი</span>}
                          {t.updated_at ? new Date(t.updated_at).toLocaleDateString('ka-GE') : ''}
                        </p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                        <button onClick={() => handleDelete(t.id, t.name)}
                          className="w-5 h-5 flex items-center justify-center rounded border border-transparent hover:bg-red-500/15 hover:border-red-500/20 text-gray-600 hover:text-red-400 transition">
                          <i className="ti ti-trash" aria-hidden="true" style={{ fontSize: 10 }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between px-3 py-2 border-t border-gray-700/50">
                  <span className="text-[10px] text-gray-500">{templates.length} შაბლონი</span>
                  <span className="flex items-center gap-1 text-[10px] text-blue-400 cursor-pointer hover:opacity-75">
                    <i className="ti ti-upload" aria-hidden="true" style={{ fontSize: 10 }} /> JSON იმპორტი
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* autosave */}
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500 px-2 py-1 rounded-md bg-gray-800">
            {autoSaving ? (
              <><div className="animate-spin h-2.5 w-2.5 rounded-full border-b border-gray-500" /> შენახვა...</>
            ) : lastSaved ? (
              <><i className="ti ti-check text-emerald-400" aria-hidden="true" style={{ fontSize: 11 }} /> {lastSaved}</>
            ) : (
              <><i className="ti ti-clock" aria-hidden="true" style={{ fontSize: 11 }} /> ავტო-შენახვა 60წმ</>
            )}
          </div>

          {/* preview toggle */}
          <div className="flex gap-0 bg-gray-800 border border-gray-700 rounded-lg p-0.5">
            {(['template','real'] as const).map(m => (
              <button key={m} onClick={() => setPreviewMode(m)}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all cursor-pointer font-sans border-none ${
                  previewMode === m ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-gray-300 bg-transparent'
                }`}>
                <i className={`ti ${m==='template' ? 'ti-code' : 'ti-chart-bar'}`} aria-hidden="true" style={{ fontSize: 11 }} />
                {m === 'template' ? 'შაბლონი' : 'რეალური'}
              </button>
            ))}
          </div>

          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-[11px] text-gray-300 hover:border-gray-600 transition cursor-pointer font-sans">
            <i className="ti ti-download" aria-hidden="true" style={{ fontSize: 12 }} /> PDF
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-[11px] text-gray-300 hover:border-gray-600 transition cursor-pointer font-sans">
            <i className="ti ti-printer" aria-hidden="true" style={{ fontSize: 12 }} /> პრინტი
          </button>
          <button onClick={handleNew}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-[11px] text-gray-300 hover:border-gray-600 transition cursor-pointer font-sans">
            <i className="ti ti-plus" aria-hidden="true" style={{ fontSize: 12 }} /> ახალი
          </button>
          <button onClick={() => handleSave(false)} disabled={loading}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/50 rounded-lg text-[11px] font-medium text-white transition disabled:opacity-50 cursor-pointer font-sans shadow-lg shadow-emerald-500/20">
            <i className="ti ti-device-floppy" aria-hidden="true" style={{ fontSize: 12 }} />
            {loading ? 'შენახვა...' : 'შენახვა'}
          </button>
        </div>
      </div>

      {/* ── MAIN 50/50 ── */}
      <div className="flex-1 grid grid-cols-2 min-h-0">

        {/* EDITOR */}
        <div className="flex flex-col border-r border-gray-700/50 min-h-0 bg-gray-900">
          {/* tab nav */}
          <div className="flex items-center justify-between px-3 border-b border-gray-700/50 bg-gray-800/40 flex-shrink-0">
            <div className="flex">
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap border-b-2 font-sans
                    ${activeTab === tab.id
                      ? 'text-blue-400 border-blue-500'
                      : 'text-gray-500 border-transparent hover:text-gray-300'
                    }`}
                  style={{ background: 'none', borderLeft: 'none', borderRight: 'none', borderTop: 'none' }}
                >
                  <i className={`ti ${tab.icon}`} aria-hidden="true" style={{ fontSize: 13 }} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* tab content */}
          <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: 'thin' }}>
            {tabRenderers[activeTab]?.()}
          </div>
        </div>

        {/* PREVIEW */}
        <div className="flex flex-col min-h-0 bg-gray-200">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-300 bg-gray-100 flex-shrink-0">
            <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
              <i className="ti ti-eye" aria-hidden="true" style={{ fontSize: 13 }} />
              პრევიუ — <span className="text-blue-600">{name}</span>
            </span>
            <div className="flex gap-1.5">
              <button className="flex items-center justify-center w-6 h-6 rounded border border-gray-300 bg-white text-gray-500 hover:text-gray-700 transition cursor-pointer">
                <i className="ti ti-printer" aria-hidden="true" style={{ fontSize: 12 }} />
              </button>
              <button className="flex items-center justify-center w-6 h-6 rounded border border-gray-300 bg-white text-gray-500 hover:text-gray-700 transition cursor-pointer">
                <i className="ti ti-download" aria-hidden="true" style={{ fontSize: 12 }} />
              </button>
              <button className="flex items-center justify-center w-6 h-6 rounded border border-gray-300 bg-white text-gray-500 hover:text-gray-700 transition cursor-pointer">
                <i className="ti ti-arrows-maximize" aria-hidden="true" style={{ fontSize: 12 }} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-5 flex justify-center items-start">
            <div style={{ transform: 'scale(0.72)', transformOrigin: 'top center', flexShrink: 0 }}>
              <InvoiceRenderer
                config={config}
                invoiceData={previewMode === 'template' ? {} : MOCK_REAL_DATA}
                isTemplate={previewMode === 'template'}
              />
            </div>
          </div>
        </div>
      </div>

      {/* click-outside close dropdown */}
      {ddOpen && <div className="fixed inset-0 z-40" onClick={() => setDdOpen(false)} />}
    </div>
  )
}