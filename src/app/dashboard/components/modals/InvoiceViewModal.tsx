// /home/hivitment-max/logistics-os/src/app/dashboard/components/modals/InvoiceViewModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import InvoiceRenderer from '../templates/InvoiceRenderer'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

interface InvoiceViewModalProps {
  isOpen: boolean
  onClose: () => void
  invoiceId: string | null
}

export default function InvoiceViewModal({ isOpen, onClose, invoiceId }: InvoiceViewModalProps) {
  const [loading, setLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [invoice, setInvoice] = useState<any>(null)
  const [template, setTemplate] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && invoiceId) {
      loadInvoice()
    }
  }, [isOpen, invoiceId])

  const loadInvoice = async () => {
    if (!invoiceId) return
    
    setLoading(true)
    setError(null)
    
    try {
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single()
      
      if (invoiceError) throw invoiceError
      if (!invoiceData) throw new Error('ინვოისი ვერ მოიძებნა')
      
      setInvoice(invoiceData)
      
      if (invoiceData.template_id) {
        const { data: templateData, error: templateError } = await supabase
          .from('invoice_templates')
          .select('*')
          .eq('id', invoiceData.template_id)
          .single()
        
        if (templateError) throw templateError
        if (!templateData) throw new Error('შაბლონი ვერ მოიძებნა')
        
        setTemplate(templateData)
      } else {
        const { data: defaultTemplate } = await supabase
          .from('invoice_templates')
          .select('*')
          .eq('is_default', true)
          .limit(1)
          .maybeSingle()
        
        if (defaultTemplate) {
          setTemplate(defaultTemplate)
        } else {
          throw new Error('შაბლონი ვერ მოიძებნა')
        }
      }
      
    } catch (e: any) {
      console.error('Failed to load invoice:', e)
      setError(e.message || 'შეცდომა ჩატვირთვისას')
    } finally {
      setLoading(false)
    }
  }

  // 👁️ Preview ფანჯრის გახსნა (Tailwind CSS-ით)
  const handlePreview = () => {
    if (!invoice || !template) return

    // ვიღებთ ინვოისის HTML-ს modal-იდან
    const invoiceElement = document.querySelector('#invoice-print-source')
    if (!invoiceElement) {
      alert('ინვოისი ჯერ არ ჩაიტვირთა')
      return
    }

    const invoiceHTML = invoiceElement.innerHTML

    // ვქმნით ახალ ფანჯარას
    const previewWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes')
    if (!previewWindow) {
      alert('გთხოვთ, დაუშვათ popup-ები ამ საიტისთვის')
      return
    }

    // ვწერთ სრულ HTML-ს Tailwind CSS-ით
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="ka">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ინვოისი ${invoice.invoice_number}</title>
        <script src="https://cdn.tailwindcss.com"><\/script>
        <style>
          body {
            margin: 0;
            padding: 20px;
            background: #f3f4f6;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          .invoice-container {
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .action-buttons {
            position: fixed;
            top: 20px;
            right: 20px;
            display: flex;
            gap: 10px;
            z-index: 1000;
          }
          .action-buttons button {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s;
          }
          .btn-print {
            background: #3b82f6;
            color: white;
          }
          .btn-print:hover {
            background: #2563eb;
          }
          .btn-pdf {
            background: #10b981;
            color: white;
          }
          .btn-pdf:hover {
            background: #059669;
          }
          @media print {
            body {
              background: white;
              padding: 0;
            }
            .invoice-container {
              box-shadow: none;
              padding: 20px;
            }
            .action-buttons {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="action-buttons">
          <button class="btn-print" onclick="window.print()">
            🖨️ ბეჭდვა
          </button>
          <button class="btn-pdf" onclick="downloadPDF()">
            📥 PDF ჩამოტვირთვა
          </button>
        </div>

        <div class="invoice-container" id="invoice-content">
          ${invoiceHTML}
        </div>

        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"><\/script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"><\/script>
        <script>
          async function downloadPDF() {
            const element = document.getElementById('invoice-content');
            const canvas = await html2canvas(element, { 
              scale: 2, 
              useCORS: true,
              backgroundColor: '#ffffff'
            });
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save('Invoice_${invoice.invoice_number}.pdf');
          }
        <\/script>
      </body>
      </html>
    `

    previewWindow.document.write(htmlContent)
    previewWindow.document.close()
  }

  //  PDF ჩამოტვირთვა (პირდაპირ)
  const handleDownloadPDF = async () => {
    if (!invoice || !template) return

    setPdfLoading(true)
    
    try {
      const invoiceElement = document.querySelector('#invoice-print-source')
      if (!invoiceElement) {
        throw new Error('ინვოისი ვერ მოიძებნა')
      }

      const canvas = await html2canvas(invoiceElement as HTMLElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      })

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const imgWidth = 210
      const pageHeight = 297
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      const imgData = canvas.toDataURL('image/png')
      
      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      const fileName = `Invoice_${invoice.invoice_number || invoiceId}.pdf`
      pdf.save(fileName)

      console.log(`✅ PDF ჩამოტვირთულია: ${fileName}`)
      
    } catch (e: any) {
      console.error('PDF გენერაციის შეცდომა:', e)
      alert(`PDF-ის შექმნა ვერ მოხერხდა: ${e.message}`)
    } finally {
      setPdfLoading(false)
    }
  }

  if (!isOpen) return null

  const invoiceData = invoice ? {
    invoice_number: invoice.invoice_number,
    issue_date: invoice.issue_date,
    due_date: invoice.due_date,
    client_name: invoice.client_name,
    client_tax_id: invoice.client_tax_id,
    client_address: invoice.client_address,
    client_email: invoice.client_email,
    subtotal: invoice.subtotal,
    vat_amount: invoice.vat_amount,
    total_amount: invoice.total_amount,
    currency: invoice.currency,
    status: invoice.status,
    iban: invoice.iban || '',
    tracking_code: invoice.tracking_code || '',
    container_number: invoice.container_number || '',
    transport_type: invoice.transport_type || '',
    loading_place: invoice.loading_place || '',
    destination: invoice.destination || '',
    line_items: [{
      description: invoice.cargo_description || 'სატრანსპორტო მომსახურება',
      price: invoice.subtotal
    }]
  } : null

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" 
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            🧾 ინვოისი: {invoice?.invoice_number || 'იტვირთება...'}
          </h3>
          <div className="flex gap-2">
            <button 
              onClick={handlePreview}
              disabled={loading || !invoice}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-xs font-medium transition flex items-center gap-1.5 text-white"
              title="გახსნის ინვოისს ცალკე ფანჯარაში (Tailwind სტილებით)"
            >
              👁️ Preview / ბეჭდვა
            </button>
            <button 
              onClick={handleDownloadPDF}
              disabled={loading || !invoice || pdfLoading}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                pdfLoading 
                  ? 'bg-amber-600 cursor-wait' 
                  : 'bg-emerald-600 hover:bg-emerald-700'
              } disabled:opacity-50 text-white`}
              title="ჩამოტვირთავს PDF ფაილს"
            >
              {pdfLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  გენერაცია...
                </>
              ) : (
                <>
                  📥 PDF
                </>
              )}
            </button>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-white text-xl transition px-2"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-sm text-gray-400">ინვოისი იტვირთება...</p>
            </div>
          )}
          
          {error && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center text-3xl mb-4">❌</div>
              <h3 className="text-lg font-bold text-white mb-2">შეცდომა</h3>
              <p className="text-sm text-gray-400 text-center">{error}</p>
            </div>
          )}
          
          {!loading && !error && invoice && template && invoiceData && (
            <div 
              id="invoice-print-source"
              className="bg-white rounded-xl shadow-inner"
            >
              <InvoiceRenderer 
                config={template.template_json} 
                invoiceData={invoiceData} 
                isTemplate={false} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}