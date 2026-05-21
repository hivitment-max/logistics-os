'use client'

interface OrderPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  order: any
}

export default function OrderPreviewModal({ isOpen, onClose, order }: OrderPreviewModalProps) {
  if (!isOpen) return null

  const handlePrint = () => {
    // 🖨️ ბეჭდვა - მხოლოდ მოდარის კონტენტი
    const printContent = document.getElementById('order-preview-content')
    if (!printContent) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('გთხოვთ, დაუშვათ pop-up ფანჯრები ბეჭდვისთვის')
      return
    }

    const content = printContent.innerHTML
    const trackingCode = order.tracking_code || 'N/A'
    const createdDate = order.created_at ? new Date(order.created_at).toLocaleString('ka-GE') : ''

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ka">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>შეკვეთა ${trackingCode}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            padding: 20px;
            color: #1f2937;
            line-height: 1.6;
          }
          .header {
            border-bottom: 3px solid #374151;
            padding-bottom: 15px;
            margin-bottom: 25px;
          }
          .header h1 {
            font-size: 24px;
            color: #111827;
            margin-bottom: 5px;
          }
          .tracking-code {
            font-family: monospace;
            font-size: 14px;
            color: #6b7280;
          }
          .section {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            page-break-inside: avoid;
          }
          .section-title {
            font-size: 14px;
            font-weight: 700;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e5e7eb;
          }
          .field {
            font-size: 12px;
            margin-bottom: 6px;
            line-height: 1.5;
          }
          .field-label {
            color: #6b7280;
            font-weight: 500;
          }
          .field-value {
            color: #111827;
            font-weight: 500;
          }
          .divider {
            border-top: 1px solid #e5e7eb;
            margin: 10px 0;
          }
          .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
          }
          .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            font-size: 11px;
            color: #9ca3af;
          }
          @media print {
            body { padding: 0; }
            .section { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📦 შეკვეთის სრული ინფორმაცია</h1>
          <div class="tracking-code">Tracking: ${trackingCode} | შექმნილი: ${createdDate}</div>
        </div>
        ${content}
        <div class="footer">
          <p>Logistics OS | დაბეჭდილი: ${new Date().toLocaleString('ka-GE')}</p>
        </div>
      </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()
    
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  // 🎯 Helper: ფორმატირებული ველების გამოტანა
  const renderField = (label: string, value: any) => {
    if (value === null || value === undefined || value === '' || value === 'null') return null
    
    let displayValue: string
    if (typeof value === 'boolean') {
      displayValue = value ? '✅ კი' : '❌ არა'
    } else if (value instanceof Date || (!isNaN(Date.parse(value)) && typeof value === 'string' && value.includes('T'))) {
      displayValue = new Date(value).toLocaleString('ka-GE', { dateStyle: 'short', timeStyle: 'short' })
    } else {
      displayValue = String(value)
    }

    return (
      <div className="text-xs leading-relaxed break-words">
        <span className="text-gray-500 font-medium">{label}:</span>{' '}
        <span className="text-gray-900 font-medium">{displayValue}</span>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white text-gray-900 rounded-2xl w-full max-w-5xl max-h-[85vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0 sticky top-0 z-10 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">📦 შეკვეთის სრული ინფორმაცია</h2>
              <p className="text-sm text-gray-600 font-mono">{order.tracking_code}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl transition p-1 hover:bg-gray-200 rounded-lg">&times;</button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div id="order-preview-content" className="flex-1 overflow-y-auto p-5 min-h-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 🔴 მარშრუტი */}
            <section className="p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg border border-red-200">
              <h3 className="text-sm font-bold text-red-900 mb-3 flex items-center gap-2 border-b border-red-200 pb-2">🔴 მარშრუტი</h3>
              <div className="space-y-1.5">
                {renderField('📤 ატვირთვის მისამართი', order.pickup_address)}
                {renderField('📅 ატვირთვის თარიღი', order.pickup_date)}
                {renderField('⏰ ატვირთვის დრო', order.pickup_time)}
                {renderField('👤 ატვირთვის კონტაქტი', order.pickup_contact || order.pickup_contact_person)}
                {renderField('📞 ატვირთვის ტელეფონი', order.pickup_phone)}
                <div className="border-t border-red-200 my-2"></div>
                {renderField('📥 ჩატვირთვის მისამართი', order.delivery_address)}
                {renderField('📅 ჩატვირთვის თარიღი', order.delivery_date)}
                {renderField('⏰ ჩატვირთვის დრო', order.delivery_time)}
                {renderField('👤 ჩატვირთვის კონტაქტი', order.delivery_contact || order.delivery_contact_person)}
                {renderField('📞 ჩატვირთვის ტელეფონი', order.delivery_phone)}
              </div>
            </section>

            {/* 🟡 ტვირთი */}
            <section className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
              <h3 className="text-sm font-bold text-yellow-900 mb-3 flex items-center gap-2 border-b border-yellow-200 pb-2">🟡 ტვირთი</h3>
              <div className="space-y-1.5">
                {renderField('📦 აღწერა', order.cargo_description)}
                {renderField('🏷️ ტიპი', order.cargo_type)}
                {renderField('⚖️ წონა', order.cargo_weight_kg ? `${order.cargo_weight_kg} კგ` : null)}
                {renderField('📐 მოცულობა', order.cargo_volume_m3 ? `${order.cargo_volume_m3} m³` : null)}
                {renderField('🔢 ერთეულები', order.cargo_units || order.places_count)}
                {renderField('📏 სიგრძე', order.cargo_length_m ? `${order.cargo_length_m} მ` : null)}
                {renderField('📏 სიგანე', order.cargo_width_m ? `${order.cargo_width_m} მ` : null)}
                {renderField('📏 სიმაღლე', order.cargo_height_m ? `${order.cargo_height_m} მ` : null)}
                {renderField('📦 შეფუთვა', order.packaging_type)}
                {renderField('🔄 დაბრუნებადი ტარა', order.returnable_packaging)}
              </div>
            </section>

            {/* 🔵 ფინანსები */}
            <section className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
              <h3 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2 border-b border-blue-200 pb-2">🔵 ფინანსები</h3>
              <div className="space-y-1.5">
                {renderField('💰 ფასი', order.price ? `${order.price} ${order.currency || 'GEL'}` : null)}
                {renderField('💵 ვალუტა', order.currency)}
                {renderField('💳 გადახდის პირობა', order.payment_terms)}
                {renderField('🧾 ინვოისი სჭირდება', order.invoice_needed)}
                <div className="border-t border-blue-200 my-2"></div>
                {renderField('🛣️ გზის ხარჯი', order.road_fee)}
                {renderField('🏙️ ქალაქგარე', order.outside_city_fee)}
                {renderField('⏰ ლოდინის საათი', order.waiting_fee_per_hour)}
                {renderField('🔧 დამატებითი ხარჯი', order.extra_fees)}
              </div>
            </section>

            {/* 🟣 დამკვეთი */}
            <section className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
              <h3 className="text-sm font-bold text-purple-900 mb-3 flex items-center gap-2 border-b border-purple-200 pb-2">🟣 დამკვეთი</h3>
              <div className="space-y-1.5">
                {renderField('👤 ტიპი', order.client_type === 'private' ? 'კერძო პირი' : order.client_type === 'company' ? 'კომპანია' : order.client_type)}
                {renderField('📛 სახელი', order.client_name)}
                {renderField('📞 ტელეფონი', order.client_phone)}
                {renderField('📧 ელ-ფოსტა', order.client_email)}
                {renderField('🆔 პირადი ნომერი', order.client_personal_id)}
                {renderField('🆔 საიდ/რეგ. ნომერი', order.client_registration_number)}
                {renderField('💼 VAT', order.client_vat)}
                {renderField('📍 მისამართი', order.client_address)}
                {renderField('🔗 Client ID', order.client_id)}
              </div>
            </section>

            {/* 🟢 დამატებითი */}
            <section className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <h3 className="text-sm font-bold text-green-900 mb-3 flex items-center gap-2 border-b border-green-200 pb-2">🟢 დამატებითი</h3>
              <div className="space-y-1.5">
                {renderField('📝 შიდა შენიშვნა', order.internal_notes || order.notes)}
                {renderField('⚠️ სპეციალური მოთხოვნები', order.special_requirements)}
                <div className="border-t border-green-200 my-2"></div>
                {renderField('🔽 სჭირდება ლიფტი', order.needs_tail_lift || order.requires_taillift)}
                {renderField('🔗 სჭირდება ღვედები', order.needs_straps)}
                {renderField('🧱 სჭირდება აგურის დალაგება', order.needs_bricklaying)}
                {renderField('👥 სჭირდება 2 მზიდავი', order.needs_two_cargo_handlers)}
              </div>
            </section>

            {/* 🟤 პრიორიტეტი & სტატუსი */}
            <section className="p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg border border-gray-200">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2 border-b border-gray-200 pb-2">🟤 პრიორიტეტი & სტატუსი</h3>
              <div className="space-y-1.5">
                {renderField('🔥 პრიორიტეტი', order.priority)}
                {renderField('📊 სტატუსი', order.status)}
                {renderField('🔔 შეტყობინება კლიენტს', order.notify_client)}
                <div className="border-t border-gray-200 my-2"></div>
                {renderField('📅 შექმნის თარიღი', order.created_at)}
                {renderField('🕐 განახლების თარიღი', order.updated_at)}
              </div>
            </section>

            {/* 🚛 მძღოლი/მანქანა */}
            {(order.driver_type || order.vehicle_type || order.driver_id || order.vehicle_id) && (
              <section className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg border border-indigo-200 md:col-span-2">
                <h3 className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2 border-b border-indigo-200 pb-2">🚛 მძღოლი & მანქანა</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    {renderField('👨‍✈️ მძღოლის ტიპი', order.driver_type)}
                    {renderField('🔗 მძღოლის ID', order.driver_id)}
                    {renderField('🌐 გარე მძღოლის ID', order.external_driver_id)}
                    {renderField('💰 გარე მძღოლის ტარიფი', order.external_driver_rate)}
                  </div>
                  <div className="space-y-1.5">
                    {renderField('🚗 მანქანის ტიპი', order.vehicle_type)}
                    {renderField('🔗 მანქანის ID', order.vehicle_id)}
                    {renderField('🌐 გარე მანქანის ID', order.external_vehicle_id)}
                    {renderField('💰 გარე მანქანის ტარიფი', order.external_vehicle_rate)}
                  </div>
                </div>
              </section>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex-shrink-0 sticky bottom-0 rounded-b-2xl flex justify-between items-center">
          <button 
            onClick={handlePrint} 
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-2 shadow-sm"
          >
            🖨️ ბეჭდვა
          </button>
          <button 
            onClick={onClose} 
            className="px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition shadow-sm"
          >
            დახურვა
          </button>
        </div>

      </div>
    </div>
  )
}