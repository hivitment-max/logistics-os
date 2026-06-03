'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import InvoiceRenderer from '../templates/InvoiceRenderer'

interface CreateInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  order: any
  onSuccess: () => void
}

export default function CreateInvoiceModal({ isOpen, onClose, order, onSuccess }: CreateInvoiceModalProps) {
  const [step, setStep] = useState<'select' | 'preview' | 'success'>('select')
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [previewData, setPreviewData] = useState<any>(null)
  const [manualInvoiceNumber, setManualInvoiceNumber] = useState('')
  const [manualIssueDate, setManualIssueDate] = useState('')
  const [manualDueDate, setManualDueDate] = useState('')

  // ტემპლეიტების ჩატვირთვა
  useEffect(() => {
    if (isOpen) {
      loadTemplates()
      setStep('select')
      setSelectedTemplate(null)
    }
  }, [isOpen])

  const loadTemplates = async () => {
    const { data } = await supabase.from('invoice_templates').select('*').order('is_default', { ascending: false })
    setTemplates(data || [])
    if (data?.length) setSelectedTemplate(data.find(t => t.is_default) || data[0])
  }

  // 🧮 ინვოისის მონაცემების გამოთვლა ტემპლეიტის წესებით
  const generatePreview = () => {
    if (!selectedTemplate || !order) return
    const config = selectedTemplate.template_json
    const meta = config.invoice_meta
    const lineItems = config.line_items

    // 🔢 ნომერი
    let invoice_number = ''
    if (meta.invoice_number_mode === 'auto_tracking') {
      invoice_number = order.tracking_code || `ORD-${order.id?.slice(0, 8) || 'NEW'}`
    } else if (meta.invoice_number_mode === 'auto_sequence') {
      const year = new Date().getFullYear()
      invoice_number = `INV-${year}-${String(Math.floor(Math.random() * 9000) + 1000)}`
    } else {
      invoice_number = manualInvoiceNumber || `DRAFT-${Date.now()}`
    }

    // 📅 თარიღები
    const today = new Date().toISOString().split('T')[0]
    const orderDate = order.created_at ? new Date(order.created_at).toISOString().split('T')[0] : today
    let issue_date = meta.issue_date_mode === 'auto_current' ? today : meta.issue_date_mode === 'auto_order' ? orderDate : manualIssueDate || today
    let due_date = null
    if (meta.due_date_mode === 'auto_offset') {
      const d = new Date(issue_date)
      d.setDate(d.getDate() + (meta.due_date_offset_days || 14))
      due_date = d.toISOString().split('T')[0]
    } else if (meta.due_date_mode === 'fixed') {
      due_date = meta.fixed_due_date || null
    }

    // 💰 ფინანსები
    const price = parseFloat(order.price || order.total_amount || 0)
    const vat_rate = lineItems.vat_exempt ? 0 : (lineItems.vat_rate || 18)
    const subtotal = price
    const vat_amount = subtotal * (vat_rate / 100)
    const total_amount = subtotal + vat_amount

    // ✅ client_tax_id
    const clientTaxId = order.client_registration_number || order.client_tax_id || order.client_personal_id || ''

    // ✅ კონტეინერის/მანქანის ნომერი
    const containerNumber = order.vehicle_plate_number || ''
    
    // ✅ გადაზიდვის სახეობა
    const hasVehicle = order.vehicle_id || order.vehicle_plate_number || order.driver_id
    const transportType = hasVehicle ? 'სახმელეთო' : 'სტანდარტული'

    setPreviewData({
      invoice_number, 
      issue_date, 
      due_date, 
      subtotal, 
      vat_amount, 
      total_amount, 
      vat_rate,
      client_name: order.client_name || 'კლიენტი',
      client_tax_id: clientTaxId,
      client_address: order.client_address || '',
      client_email: order.client_email || '',
      container_number: containerNumber,
      transport_type: transportType,
      loading_place: order.pickup_address || '',
      destination: order.delivery_address || '',
      line_items: [{ description: order.cargo_description || 'სატრანსპორტო მომსახურება', price: subtotal }]
    })
    setStep('preview')
  }

  // 💾 შენახვა Supabase-ში - FIXED VERSION (user_id დამატებულია)
  const handleSave = async () => {
    if (!previewData || !selectedTemplate) return
    setLoading(true)
    try {
      // 1. ⬅️ FIX: მივიღოთ მიმდინარე მომხმარებლის მონაცემები
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('მომხმარებელი არ არის ავტორიზებული. გთხოვთ, თავიდან შეხვიდეთ სისტემაში.')
      }

      // 2. შევქმნათ payload დამატებული user_id-ით
      const payload = {
        order_id: order.id,
        template_id: selectedTemplate.id,
        invoice_number: previewData.invoice_number,
        issue_date: previewData.issue_date,
        due_date: previewData.due_date,
        client_name: previewData.client_name,
        client_tax_id: previewData.client_tax_id,
        client_address: previewData.client_address,
        client_email: previewData.client_email,
        subtotal: previewData.subtotal,
        vat_amount: previewData.vat_amount,
        total_amount: previewData.total_amount,
        currency: 'GEL',
        status: 'draft',
        user_id: user.id, // ⬅️ FIX: მომხმარებლის ID
        client_snapshot: JSON.stringify({ 
          name: previewData.client_name, 
          tax_id: previewData.client_tax_id, 
          email: previewData.client_email 
        }),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // 3. ჩავწეროთ ბაზაში
      const { error } = await supabase.from('invoices').insert([payload])
      if (error) throw error

      // 4. აუდიტის ლოგი
      await supabase.from('audit_logs').insert({
        user_email: user.email || 'system',
        action: 'create',
        table_name: 'invoices',
        record_id: payload.invoice_number,
        details: `შეიქმნა ინვოისი #${payload.invoice_number} შეკვეთიდან ${order.tracking_code || order.id}`
      })

      setStep('success')
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1500)
    } catch (e: any) {
      console.error('Invoice save error:', e)
      alert('შეცდომა შენახვისას: ' + (e.message || 'უცნობი შეცდომა'))
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            🧾 ინვოისის შექმნა: {order.tracking_code || 'ახალი შეკვეთა'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl transition">&times;</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {step === 'select' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase">აირჩიე შაბლონი</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {templates.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t)}
                    className={`p-4 rounded-xl border text-left transition ${
                      selectedTemplate?.id === t.id ? 'bg-blue-600/20 border-blue-500' : 'bg-gray-700/30 border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <div className="font-bold text-sm text-white">{t.name}</div>
                    <div className="text-[10px] text-gray-400 mt-1">{t.is_default ? '⭐ დეფოლტი' : 'მორგებული'}</div>
                  </button>
                ))}
              </div>
              {selectedTemplate?.template_json?.invoice_meta?.invoice_number_mode === 'manual' && (
                <input 
                  type="text" 
                  placeholder="შეიყვანე ინვოისის ნომერი" 
                  value={manualInvoiceNumber} 
                  onChange={e => setManualInvoiceNumber(e.target.value)} 
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-xs text-white mt-2" 
                />
              )}
              <button 
                onClick={generatePreview} 
                disabled={!selectedTemplate} 
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded transition"
              >
                წინასწარი ნახვა →
              </button>
            </div>
          )}

          {step === 'preview' && previewData && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase">პრევიუ</h4>
                <button onClick={() => setStep('select')} className="text-[10px] text-blue-400 hover:text-blue-300">← უკან</button>
              </div>
              <div className="bg-white rounded-xl p-4 max-h-[60vh] overflow-y-auto shadow-inner">
                <InvoiceRenderer config={selectedTemplate.template_json} invoiceData={previewData} isTemplate={false} />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setStep('select')} className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium rounded transition">გასწორება</button>
                <button 
                  onClick={handleSave} 
                  disabled={loading} 
                  className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-bold rounded transition shadow-lg shadow-green-500/20"
                >
                  {loading ? '🔄 ინახება...' : '💾 შენახვა & გამოწერა'}
                </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center text-3xl mb-4">✅</div>
              <h3 className="text-lg font-bold text-white mb-2">ინვოისი წარმატებით შეიქმნა!</h3>
              <p className="text-xs text-gray-400">ინვოისი დამატებულია ფინანსების ტაბში.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}