'use client'

// 🌐 ლექსიკონი - ბილინგუალური მხარდაჭერა
const L = {
  ka: {
    invoice: 'INVOICE',
    date: 'Date',
    no: 'Invoice No',
    billTo: 'გადამხდელი/Bill to',
    company: 'კომპანიის სახელი',
    address: 'მისამართი',
    taxId: 'ს/კ',
    email: 'ელ.ფოსტა',
    serviceDesc: 'მომსახურების აღწერილობა',
    exporter: 'ექსპორტიორი',
    transport: 'გადაზიდვის სახეობა',
    container: 'კონტეინერის ნომერი',
    volWeight: 'მოცულობა/წონა',
    qty: 'რაოდენობა',
    loadPlace: 'დატვირთვის ადგილი',
    dest: 'დანიშნულების ადგილი',
    desc: 'აღწერილობა',
    price: 'ფასი',
    vat: '18%',
    total: 'სრულად',
    subtotal: 'ქვეჯამი',
    totalSum: 'სულ',
    amountWords: 'თანხა სიტყვიერად',
    bank: 'საბანკო რეკვიზიტები',
    notes: 'შენიშვნა*',
    sign: 'ხელმოწერა',
    qr: 'QR გადახდა',
    watermark: {
      DRAFT: 'შავი',
      SENT: 'გაგზავნილი',
      PAID: 'გადახდილი',
      OVERDUE: 'ვადაგასული',
      CANCELLED: 'გაუქმებული'
    }
  },
  en: {
    invoice: 'INVOICE',
    date: 'Date',
    no: 'No',
    billTo: 'Bill To',
    company: 'Company Name',
    address: 'Address',
    taxId: 'Tax ID',
    email: 'Email',
    serviceDesc: 'Service Description',
    exporter: 'Exporter',
    transport: 'Transport Type',
    container: 'Container No',
    volWeight: 'Vol/Weight',
    qty: 'Qty',
    loadPlace: 'Loading Place',
    dest: 'Destination',
    desc: 'Description',
    price: 'Price',
    vat: 'VAT 18%',
    total: 'Total',
    subtotal: 'Subtotal',
    totalSum: 'Grand Total',
    amountWords: 'Amount in Words',
    bank: 'Bank Details',
    notes: 'Notes*',
    sign: 'Signature',
    qr: 'Scan to Pay',
    watermark: {
      DRAFT: 'DRAFT',
      SENT: 'SENT',
      PAID: 'PAID',
      OVERDUE: 'OVERDUE',
      CANCELLED: 'CANCELLED'
    }
  }
}

interface InvoiceRendererProps {
  config: any
  invoiceData: any
  isTemplate?: boolean
}

export default function InvoiceRenderer({ config, invoiceData, isTemplate = false }: InvoiceRendererProps) {
  const lang = L[config.invoice_meta?.language as keyof typeof L] || L.ka
  const fmtDate = (d: string) => {
    if (!d || isTemplate) return isTemplate ? '--.--.----' : d
    return d.split('-').reverse().join('.')
  }

  const resolve = (key: string, fallback = '--') => {
    if (isTemplate) return `{{${key}}}`
    return invoiceData[key] ?? fallback
  }

  const getInvoiceNumber = () => {
    if (isTemplate) {
      const mode = config.invoice_meta?.invoice_number_mode
      if (mode === 'auto_tracking') return '{{tracking_code}}'
      if (mode === 'auto_sequence') return `${config.invoice_meta?.sequence_prefix || 'INV-'}{{seq}}`
      return config.invoice_meta?.manual_invoice_number || '----'
    }
    const mode = config.invoice_meta?.invoice_number_mode
    if (mode === 'auto_tracking') return invoiceData.tracking_code || invoiceData.invoice_number || '----'
    if (mode === 'manual') return config.invoice_meta?.manual_invoice_number || '----'
    return invoiceData.invoice_number || '----'
  }

  const getIssueDate = () => {
    if (isTemplate) return '{{issue_date}}'
    const mode = config.invoice_meta?.issue_date_mode
    if (mode === 'auto_current') return fmtDate(invoiceData.issue_date || new Date().toISOString().split('T')[0])
    if (mode === 'manual') return config.invoice_meta?.manual_issue_date || '--.--.----'
    return invoiceData.issue_date ? fmtDate(invoiceData.issue_date) : '--.--.----'
  }

  const getDueDate = () => {
    if (isTemplate || config.invoice_meta?.due_date_mode === 'none') return null
    if (config.invoice_meta?.due_date_mode === 'fixed') {
      return config.invoice_meta?.fixed_due_date ? fmtDate(config.invoice_meta.fixed_due_date) : null
    }
    const baseDate = invoiceData.issue_date ? new Date(invoiceData.issue_date) : new Date()
    const offset = config.invoice_meta?.due_date_offset_days || 14
    const due = new Date(baseDate)
    due.setDate(due.getDate() + offset)
    return fmtDate(due.toISOString().split('T')[0])
  }

  const subtotal = invoiceData.line_items?.reduce((s: number, i: any) => s + (i.price || 0), 0) || 0
  const vatRate = config.line_items?.vat_exempt ? 0 : (config.line_items?.vat_rate || 18) / 100
  const vatAmt = subtotal * vatRate
  const grand = subtotal + vatAmt

  const qrData = encodeURIComponent(`IBAN: ${invoiceData.iban || '---'}|AMOUNT: ${grand.toFixed(2)}|REF: ${getInvoiceNumber()}`)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${qrData}`

  const Watermark = config.invoice_meta?.show_watermark && invoiceData.status && !isTemplate && (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-[0.07] rotate-[-30deg] select-none">
      <span className="text-[120px] font-black uppercase tracking-widest leading-none whitespace-nowrap" style={{ color: config.styling?.primary_color || '#1e40af' }}>
        {lang.watermark[invoiceData.status as keyof typeof lang.watermark] || invoiceData.status}
      </span>
    </div>
  )

  return (
    <div 
      className="p-8 text-[11px] relative min-h-[297mm] bg-white" 
      style={{ 
        fontFamily: config.styling?.font || 'system-ui', 
        color: '#111',
        printColorAdjust: 'exact' as any,
        WebkitPrintColorAdjust: 'exact' as any
      }}
    >
      {Watermark}
      
      {/* ── HEADER: კომპანია და ინვოისის მეტა ── */}
      <div className="flex justify-between items-start mb-6 pb-4 border-b-2 relative z-10" style={{ borderColor: config.styling?.primary_color }}>
        <div>
          {config.company?.show_logo && config.company?.logo_url && (
            <img src={config.company.logo_url} alt="Logo" className="h-12 mb-2 object-contain" />
          )}
          <h1 className="text-xl font-bold uppercase tracking-wider" style={{ color: config.styling?.primary_color }}>
            {config.company?.name || '----'}
          </h1>
          <p className="text-gray-600 whitespace-pre-line mt-1 text-[10px]">
            {config.company?.address || '----'}
          </p>
          {config.company?.email && <p className="text-gray-600 text-[10px]">{config.company.email}</p>}
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold tracking-widest" style={{ color: config.styling?.primary_color }}>
            {config.invoice_meta?.title || lang.invoice}
          </h2>
          <div className="mt-2 space-y-1 text-gray-700 text-[10px]">
            {config.invoice_meta?.show_invoice_number && (
              <p><span className="font-bold">{lang.no}:</span> <span className="font-mono">{getInvoiceNumber()}</span></p>
            )}
            {config.invoice_meta?.show_date && (
              <p><span className="font-bold">{lang.date}:</span> <span className="font-mono">{getIssueDate()}</span></p>
            )}
            {getDueDate() && (
              <p><span className="font-bold">Due:</span> <span className="font-mono">{getDueDate()}</span></p>
            )}
          </div>
        </div>
      </div>

      {/* ── BILL TO: გადამხდელი (მთელ სიგანეზე) ── */}
      <div className="mb-4 relative z-10">
        <h3 className="text-[10px] font-bold uppercase mb-2 pb-1 border-b border-gray-300" style={{ color: config.styling?.primary_color }}>
          {config.bill_to?.title || lang.billTo}
        </h3>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-[10px] text-gray-700">
          {config.bill_to?.show_company_name && (
            <><span className="text-gray-500">{lang.company}:</span><span className="font-medium">{resolve('client_name')}</span></>
          )}
          
          {/* ✅ გასწორებული: მხოლოდ მაშინ ჩანს, როცა client_tax_id არ არის ცარიელი */}
          {config.bill_to?.show_tax_id && invoiceData.client_tax_id && (
            <><span className="text-gray-500">{lang.taxId}:</span><span className="font-mono">{resolve('client_tax_id')}</span></>
          )}
          
          {config.bill_to?.show_address && invoiceData.client_address && (
            <><span className="text-gray-500">{lang.address}:</span><span>{resolve('client_address')}</span></>
          )}
          {config.bill_to?.show_email && invoiceData.client_email && (
            <><span className="text-gray-500">{lang.email}:</span><span>{resolve('client_email')}</span></>
          )}
        </div>
      </div>

      {/* ── SERVICE DETAILS: მომსახურების აღწერილობა (მთელ სიგანეზე, ქვემოთ) ── */}
      <div className="mb-6 pt-3 border-t border-gray-200 relative z-10">
        <h3 className="text-[10px] font-bold uppercase mb-2 pb-1 border-b border-gray-300" style={{ color: config.styling?.primary_color }}>
          {lang.serviceDesc}
        </h3>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-[10px] text-gray-700">
          {config.service_details?.show_exporter && invoiceData.exporter && (
            <><span className="text-gray-500">{lang.exporter}:</span><span>{resolve('exporter')}</span></>
          )}
          {config.service_details?.show_transport_type && (
            <><span className="text-gray-500">{lang.transport}:</span><span>{resolve('transport_type')}</span></>
          )}
          {config.service_details?.show_container_number && (
            <><span className="text-gray-500">{lang.container}:</span><span className="font-mono">{resolve('container_number')}</span></>
          )}
          {config.service_details?.show_volume_weight && invoiceData.volume_weight && (
            <><span className="text-gray-500">{lang.volWeight}:</span><span>{resolve('volume_weight')}</span></>
          )}
          {config.service_details?.show_quantity && invoiceData.quantity && (
            <><span className="text-gray-500">{lang.qty}:</span><span>{resolve('quantity')}</span></>
          )}
          {config.service_details?.show_loading_place && (
            <><span className="text-gray-500">{lang.loadPlace}:</span><span>{resolve('loading_place')}</span></>
          )}
          {config.service_details?.show_destination && (
            <><span className="text-gray-500">{lang.dest}:</span><span>{resolve('destination')}</span></>
          )}
        </div>
      </div>

      {/* ── PRICING TABLE ── */}
      <table className="w-full mb-6 border-collapse text-[10px] relative z-10">
        <thead>
          <tr 
            style={{ 
              backgroundColor: config.styling?.primary_color, 
              color: '#fff',
              printColorAdjust: 'exact' as any,
              WebkitPrintColorAdjust: 'exact' as any
            }}
            className="[print-color-adjust:exact] [-webkit-print-color-adjust:exact]"
          >
            <th className="p-2 text-left font-bold rounded-tl">{config.line_items?.description_label || lang.desc}</th>
            {config.line_items?.show_price && <th className="p-2 text-right font-bold">{lang.price}</th>}
            {config.line_items?.show_vat && (
              <th className="p-2 text-right font-bold">
                {config.line_items.vat_exempt ? 'VAT 0%' : `${lang.vat} (${config.line_items.vat_rate}%)`}
              </th>
            )}
            {config.line_items?.show_total && <th className="p-2 text-right font-bold rounded-tr">{lang.total}</th>}
          </tr>
        </thead>
        <tbody>
          {invoiceData.line_items?.map((item: any, idx: number) => {
            const price = item.price || 0
            const vat = price * vatRate
            const total = price * (1 + vatRate)
            return (
              <tr key={idx} className="border-b border-gray-200">
                <td className="p-2">{item.description || resolve('description')}</td>
                {config.line_items?.show_price && <td className="p-2 text-right font-mono">{price.toFixed(2)}</td>}
                {config.line_items?.show_vat && <td className="p-2 text-right font-mono">{vat.toFixed(2)}</td>}
                {config.line_items?.show_total && <td className="p-2 text-right font-bold font-mono">{total.toFixed(2)}</td>}
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50 [print-color-adjust:exact] [-webkit-print-color-adjust:exact]">
            <td colSpan={config.line_items?.show_vat ? 3 : 2} className="p-2 text-right font-bold">
              {lang.totalSum}:
            </td>
            <td className="p-2 text-right font-bold text-base" style={{ color: config.styling?.primary_color }}>
              {grand.toFixed(2)} {invoiceData.currency || 'GEL'}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* ── FOOTER ── */}
      <div className="pt-4 border-t-2 relative z-10" style={{ borderColor: config.styling?.primary_color }}>
        <div className="flex justify-between items-start gap-6">
          
          {/* მარცხენა მხარე: თანხა სიტყვიერად, ბანკი, შენიშვნა */}
          <div className="flex-1">
            {config.footer?.show_amount_in_words && (
              <p className="text-[10px] mb-2 italic">
                <span className="font-bold">{lang.amountWords}:</span> {resolve('total_in_words')}
              </p>
            )}
            {config.footer?.show_bank_details && (
              <div className="text-[10px] text-gray-600 mb-3 p-2 bg-gray-50 rounded border border-gray-200">
                <p className="font-bold">{lang.bank}</p>
                <p>{config.footer.bank_details}</p>
                {invoiceData.iban && <p className="font-mono mt-1">IBAN: {invoiceData.iban}</p>}
              </div>
            )}
            {config.footer?.show_notes && (
              <div className="text-[10px] mt-2">
                <span className="font-bold">{lang.notes}</span>
                <div className="h-8 border-b border-gray-400 mt-1"></div>
              </div>
            )}
          </div>

          {/* მარჯვენა მხარე: QR, ხელმოწერა, ბეჭედი */}
          <div className="w-1/3 text-right flex flex-col items-end gap-3">
            
            {/* 📱 QR კოდი */}
            {config.invoice_meta?.show_qr_payment && !isTemplate && (
              <div className="text-center">
                <img 
                  src={qrUrl} 
                  alt="QR Payment" 
                  className="h-20 w-20 object-contain border rounded bg-white p-1"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                <p className="text-[8px] text-gray-500 mt-1">{lang.qr}</p>
              </div>
            )}
            
            {/* ✍️ ხელმოწერა */}
            {config.footer?.signature_image && (
              <img src={config.footer.signature_image} alt="Signature" className="h-8 object-contain mb-[-4px]" />
            )}
            {config.footer?.show_signature && (
              <>
                <span className="text-[10px] font-bold block">{lang.sign}</span>
                <div className="h-8 border-b border-gray-400 w-28"></div>
              </>
            )}
            
            {/* 🔵 ბეჭედი */}
            {config.footer?.stamp_image && (
              <img 
                src={config.footer.stamp_image} 
                alt="Company Stamp" 
                className="h-16 object-contain opacity-90 mix-blend-multiply mt-2 [print-color-adjust:exact]" 
              />
            )}
          </div>
          
        </div>
      </div>
    </div>
  )
}