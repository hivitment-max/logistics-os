'use client'

interface InvoiceConfig {
  header: { show_logo: boolean; logo_url: string; company_name: string; company_details: string }
  client_section: { show: boolean; fields: string[] }
  invoice_meta: { show_tracking: boolean; show_issue_date: boolean; show_due_date: boolean }
  line_items: { columns: string[]; show_weight: boolean }
  totals_section: { show_tax: boolean; tax_label: string; show_discount: boolean }
  footer: { notes: string; terms: string; show_signature_line: boolean }
  styling: { primary_color: string; font: string; layout: string }
}

interface InvoiceRendererProps {
  config: InvoiceConfig
  invoiceData: any
}

export default function InvoiceRenderer({ config, invoiceData }: InvoiceRendererProps) {
  const { header, client_section, invoice_meta, line_items, totals_section, footer, styling } = config

  return (
    <div className="bg-white text-gray-900 p-8 max-w-3xl mx-auto" style={{ fontFamily: styling.font || 'system-ui' }}>
      {/* 🏢 Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          {header.show_logo && header.logo_url && (
            <img src={header.logo_url} alt="Logo" className="h-12 mb-2 object-contain" />
          )}
          <h1 className="text-2xl font-bold" style={{ color: styling.primary_color }}>{header.company_name}</h1>
          <p className="text-sm text-gray-500 whitespace-pre-line">{header.company_details}</p>
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-bold text-gray-800">INVOICE</h2>
          <p className="text-sm font-mono text-gray-600">{invoiceData.invoice_number}</p>
          {invoice_meta.show_issue_date && <p className="text-xs text-gray-500">Issue: {invoiceData.issue_date}</p>}
          {invoice_meta.show_due_date && <p className="text-xs text-gray-500">Due: {invoiceData.due_date}</p>}
        </div>
      </div>

      {/* 👤 Client Section */}
      {client_section.show && (
        <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-xs font-bold uppercase text-gray-500 mb-2">Bill To</h3>
          {client_section.fields.includes('client_name') && <p className="font-medium">{invoiceData.client_name || '–'}</p>}
          {client_section.fields.includes('client_address') && <p className="text-sm text-gray-600">{invoiceData.client_address || '–'}</p>}
          {client_section.fields.includes('client_email') && <p className="text-sm text-gray-600">{invoiceData.client_email || '–'}</p>}
          {client_section.fields.includes('client_tax_id') && <p className="text-xs text-gray-500">VAT/ID: {invoiceData.client_tax_id || '–'}</p>}
        </div>
      )}

      {/* 📦 Line Items */}
      <table className="w-full mb-8 text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            {line_items.columns.includes('description') && <th className="py-2 text-left">Description</th>}
            {line_items.show_weight && <th className="py-2 text-right">Weight</th>}
            {line_items.columns.includes('quantity') && <th className="py-2 text-right">Qty</th>}
            {line_items.columns.includes('unit_price') && <th className="py-2 text-right">Unit Price</th>}
            {line_items.columns.includes('total') && <th className="py-2 text-right">Total</th>}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-100">
            {line_items.columns.includes('description') && <td className="py-2">{invoiceData.cargo_description || 'Logistics Service'}</td>}
            {line_items.show_weight && <td className="py-2 text-right">{invoiceData.cargo_weight_kg || '–'} kg</td>}
            {line_items.columns.includes('quantity') && <td className="py-2 text-right">1</td>}
            {line_items.columns.includes('unit_price') && <td className="py-2 text-right">{invoiceData.total_amount} {invoiceData.currency}</td>}
            {line_items.columns.includes('total') && <td className="py-2 text-right font-bold">{invoiceData.total_amount} {invoiceData.currency}</td>}
          </tr>
        </tbody>
      </table>

      {/* 💰 Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-1/2 space-y-2">
          <div className="flex justify-between py-1 border-b border-gray-200">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">{invoiceData.total_amount} {invoiceData.currency}</span>
          </div>
          {totals_section.show_tax && (
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-gray-600">{totals_section.tax_label}</span>
              <span className="font-medium">–</span>
            </div>
          )}
          <div className="flex justify-between py-2 font-bold text-lg" style={{ color: styling.primary_color }}>
            <span>Total</span>
            <span>{invoiceData.total_amount} {invoiceData.currency}</span>
          </div>
        </div>
      </div>

      {/* 📝 Footer */}
      <div className="border-t border-gray-200 pt-4 text-xs text-gray-500 space-y-2">
        {footer.notes && <p><strong>Notes:</strong> {footer.notes}</p>}
        {footer.terms && <p><strong>Terms:</strong> {footer.terms}</p>}
        {footer.show_signature_line && (
          <div className="mt-6 flex justify-between">
            <div className="w-1/2 border-t border-gray-300 pt-1 text-center">Authorized Signature</div>
            <div className="w-1/2 border-t border-gray-300 pt-1 text-center">Client Acceptance</div>
          </div>
        )}
      </div>
    </div>
  )
}