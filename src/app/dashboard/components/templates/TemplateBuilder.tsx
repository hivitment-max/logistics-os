'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import InvoiceRenderer from './InvoiceRenderer'

const DEFAULT_TEMPLATE = {
  header: { show_logo: false, logo_url: '', company_name: 'Logistics OS LLC', company_details: 'თბილისი, ვაჟა-ფშაველას 10 | VAT: GE123456789' },
  client_section: { show: true, fields: ['client_name', 'client_address', 'client_email'] },
  invoice_meta: { show_tracking: true, show_issue_date: true, show_due_date: true },
  line_items: { columns: ['description', 'quantity', 'unit_price', 'total'], show_weight: false },
  totals_section: { show_tax: false, tax_label: 'VAT 18%', show_discount: false },
  footer: { notes: 'გადახდის ვადა: 14 დღე', terms: 'დაგვიანების შემთხვევაში ერიცხება საპროცენტო', show_signature_line: true },
  styling: { primary_color: '#2563eb', font: 'system-ui', layout: 'standard' }
}

interface TemplateBuilderProps {
  templateId?: string | null
  onSave?: () => void
}

export default function TemplateBuilder({ templateId, onSave }: TemplateBuilderProps) {
  const [config, setConfig] = useState(DEFAULT_TEMPLATE)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('Custom Invoice Template')
  const [isDefault, setIsDefault] = useState(false)

  // ჩატვირთვა თუ templateId მოცემულია
  useEffect(() => {
    if (templateId) {
      loadTemplate(templateId)
    }
  }, [templateId])

  const loadTemplate = async (id: string) => {
    const { data, error } = await supabase.from('invoice_templates').select('*').eq('id', id).single()
    if (data && !error) {
      setConfig(data.template_json)
      setName(data.name)
      setIsDefault(data.is_default)
    }
  }

  const handleChange = (section: keyof typeof config, key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: { ...(prev[section] as any), [key]: value }
    }))
  }

  const handleSave = async () => {
    setLoading(true)
    const { error } = await supabase.from('invoice_templates').upsert({
      id: templateId || undefined,
      name,
      template_json: config,
      is_default: isDefault,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' })

    setLoading(false)
    if (!error) {
      alert('✅ თემფლეიტი შენახულია!')
      onSave?.()
    } else {
      alert(`❌ შეცდომა: ${error.message}`)
    }
  }

  // Mock invoice data for preview
  const mockInvoice = {
    invoice_number: 'INV-2024-001',
    issue_date: '2024-05-20',
    due_date: '2024-06-03',
    client_name: 'TechCorp Georgia',
    client_address: 'თბილისი, კოსტავას 15',
    client_email: 'billing@techcorp.ge',
    client_tax_id: 'GE987654321',
    cargo_description: 'ტვირთის გადაზიდვა: თბილისი → ბათუმი',
    cargo_weight_kg: 1200,
    total_amount: 850.00,
    currency: 'GEL'
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* 🛠️ Editor */}
      <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-5 overflow-y-auto max-h-[85vh]">
        <h3 className="text-sm font-bold text-gray-200 mb-4">⚙️ თემფლეიტის კონფიგურაცია</h3>
        
        <div className="space-y-4 mb-6">
          <input 
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-sm text-white"
            placeholder="თემფლეიტის სახელი"
          />
          <label className="flex items-center gap-2 text-xs text-gray-300">
            <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} />
            დეფოლტ თემფლეიტი
          </label>
        </div>

        {/* Header */}
        <section className="mb-6 p-3 bg-gray-700/30 rounded-lg">
          <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">🏢 ჰედერი</h4>
          <label className="flex items-center gap-2 mb-2 text-xs text-gray-300">
            <input type="checkbox" checked={config.header.show_logo} onChange={e => handleChange('header', 'show_logo', e.target.checked)} />
            ლოგოს ჩვენება
          </label>
          <input 
            type="text" value={config.header.company_name} onChange={e => handleChange('header', 'company_name', e.target.value)}
            placeholder="კომპანიის სახელი" className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-xs text-white mb-2"
          />
          <textarea 
            value={config.header.company_details} onChange={e => handleChange('header', 'company_details', e.target.value)}
            placeholder="კომპანიის დეტალები" className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-xs text-white resize-none" rows={2}
          />
        </section>

        {/* Client Fields */}
        <section className="mb-6 p-3 bg-gray-700/30 rounded-lg">
          <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">👤 კლიენტის ინფორმაცია</h4>
          <div className="space-y-1">
            {['client_name', 'client_address', 'client_email', 'client_tax_id'].map(field => (
              <label key={field} className="flex items-center gap-2 text-xs text-gray-300">
                <input 
                  type="checkbox" 
                  checked={config.client_section.fields.includes(field)} 
                  onChange={e => {
                    const fields = e.target.checked 
                      ? [...config.client_section.fields, field] 
                      : config.client_section.fields.filter(f => f !== field)
                    handleChange('client_section', 'fields', fields)
                  }} 
                />
                {field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </label>
            ))}
          </div>
        </section>

        {/* Styling */}
        <section className="mb-6 p-3 bg-gray-700/30 rounded-lg">
          <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">🎨 სტილი</h4>
          <div className="flex items-center gap-3">
            <input 
              type="color" value={config.styling.primary_color} onChange={e => handleChange('styling', 'primary_color', e.target.value)}
              className="w-10 h-8 rounded cursor-pointer bg-transparent border border-gray-600"
            />
            <span className="text-xs text-gray-300">ძირითადი ფერი</span>
          </div>
        </section>

        <button 
          onClick={handleSave} disabled={loading}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded transition disabled:opacity-50"
        >
          {loading ? '🔄 ითვლება...' : '💾 თემფლეიტის შენახვა'}
        </button>
      </div>

      {/* 👁️ Live Preview */}
      <div className="bg-gray-100 rounded-xl p-4 overflow-y-auto max-h-[85vh]">
        <h3 className="text-xs font-bold text-gray-500 mb-3">👁️ რეალურდროული პრევიუ</h3>
        <div className="bg-white rounded-lg shadow-lg">
          <InvoiceRenderer config={config} invoiceData={mockInvoice} />
        </div>
      </div>
    </div>
  )
}