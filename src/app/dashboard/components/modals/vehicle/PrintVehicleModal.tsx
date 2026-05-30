// src/app/dashboard/components/modals/vehicle/PrintVehicleModal.tsx
'use client'

import { useEffect } from 'react'
import { Vehicle } from '../../AdminDashboard/types'

interface PrintVehicleModalProps {
  isOpen: boolean
  onClose: () => void
  vehicle: Vehicle | null
}

export default function PrintVehicleModal({ isOpen, onClose, vehicle }: PrintVehicleModalProps) {
  // 🖨️ ავტომატური პრინტი როცა მოდალი იხსნება
  useEffect(() => {
    if (isOpen && vehicle) {
      // მცირე დაყოვნება რომ კონტენტი დაირენდეროს
      const timer = setTimeout(() => {
        window.print()
        onClose()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen, vehicle, onClose])

  if (!isOpen || !vehicle) return null

  // 🎨 სტატუსის სტილები
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'in_transit': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'idle': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'maintenance': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const TYPE_ICON: Record<string, string> = { truck: '🚛', van: '🚐', car: '🚗' }
  const TYPE_LABEL: Record<string, string> = { truck: 'სატვირთო', van: 'ფურგონი', car: 'მსუბუქი' }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4 print:bg-white print:z-[200]">
      <div className="bg-white text-gray-900 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl print:shadow-none print:max-w-none print:max-h-none">
        
        {/* 🖨️ Print Header - მხოლოდ ეკრანზე */}
        <div className="print:hidden sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">🚛 მანქანის დეტალები</h3>
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition">დახურვა</button>
        </div>

        {/* 📄 Printable Content */}
        <div className="p-6 print:p-0">
          
          {/* Header Section */}
          <div className="flex items-center gap-4 pb-4 border-b border-gray-200 print:border-gray-300">
            <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-3xl print:bg-gray-200">
              {TYPE_ICON[vehicle.type as keyof typeof TYPE_ICON] ?? '🚐'}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{vehicle.model}</h2>
              
              {/* 🪪 License Plate */}
              <div className="inline-flex items-center rounded-sm overflow-hidden shadow-sm border border-gray-400 mt-1" style={{ background: 'linear-gradient(180deg, #fffdf0 0%, #fff9e6 100%)', fontFamily: 'monospace' }}>
                <div className="flex flex-col items-center justify-center px-1 h-6 flex-shrink-0 border-r border-gray-400" style={{ background: '#1e3a8a' }}>
                  <span className="text-[6px] text-[#fbbf24] leading-none font-bold tracking-tight">GEO</span>
                </div>
                <div className="flex items-center justify-center px-2 h-6 flex-shrink-0">
                  <span className="font-bold tracking-[0.12em] uppercase" style={{ fontSize: '10px', color: '#1a1a1a' }}>{vehicle.plate_number}</span>
                </div>
              </div>
              
              {/* Status Badge */}
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border mt-2 ${getStatusColor(vehicle.status).replace('bg-', 'border-').replace('/20', '/20')}`}>
                <span className={`w-2 h-2 rounded-full ${getStatusColor(vehicle.status).includes('green') ? 'bg-green-400' : getStatusColor(vehicle.status).includes('blue') ? 'bg-blue-400' : getStatusColor(vehicle.status).includes('yellow') ? 'bg-yellow-400' : getStatusColor(vehicle.status).includes('red') ? 'bg-red-400' : 'bg-gray-400'}`} />
                {/* ✅ განახლებული: ტაიპ ასერშენი რომ TypeScript-მა არ დაბლოკოს */}
                {(() => {
                  const s = vehicle.status as string;
                  return s === 'active' ? 'თავისუფალი' 
                    : s === 'in_transit' ? 'მოძრავია' 
                    : s === 'idle' ? 'ლოდინში' 
                    : s === 'maintenance' ? 'ტექ. მომსახ.' 
                    : 'არააქტიური';
                })()}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <InfoRow label="ტიპი" value={TYPE_LABEL[vehicle.type as keyof typeof TYPE_LABEL] ?? vehicle.type} />
            <InfoRow label="ძარა" value={vehicle.body_type || '–'} />
            <InfoRow label="ტვირთამწეობა" value={vehicle.capacity_kg ? `${vehicle.capacity_kg.toLocaleString()} კგ` : '–'} />
            <InfoRow label="მოცულობა" value={vehicle.volume_m3 ? `${vehicle.volume_m3} მ³` : '–'} />
            <InfoRow label="VIN კოდი" value={vehicle.vin_number || '–'} />
            <InfoRow label="ტექ. პასპორტი" value={vehicle.tech_passport || '–'} />
            <InfoRow label="დაზღვევა" value={vehicle.insurance_policy || '–'} />
            <InfoRow label="მფლობელი" value={vehicle.owner_name || '–'} />
          </div>

          {/* Equipment Tags */}
          {(vehicle.has_tail_lift || vehicle.has_refrigeration || (vehicle as any).adr_capable || vehicle.straps_count) && (
            <div className="mt-6 pt-4 border-t border-gray-200 print:border-gray-300">
              <h4 className="text-sm font-bold text-gray-700 mb-2">🔧 აღჭურვილობა</h4>
              <div className="flex flex-wrap gap-2">
                {vehicle.has_tail_lift && <Badge>🔽 იფტი</Badge>}
                {vehicle.has_refrigeration && <Badge>❄️ მაცივარი</Badge>}
                {(vehicle as any).adr_capable && <Badge>⚠️ ADR</Badge>}
                {vehicle.straps_count && vehicle.straps_count >= 4 && <Badge>🔗 {vehicle.straps_count} ვედი</Badge>}
              </div>
            </div>
          )}

          {/* Driver Info */}
          {vehicle.driver_name && (
            <div className="mt-6 pt-4 border-t border-gray-200 print:border-gray-300">
              <h4 className="text-sm font-bold text-gray-700 mb-2">👨‍✈️ მინიჭებული მძღოლი</h4>
              <p className="text-base font-medium text-gray-900">{vehicle.driver_name}</p>
            </div>
          )}

          {/* Notes */}
          {vehicle.notes && (
            <div className="mt-6 pt-4 border-t border-gray-200 print:border-gray-300">
              <h4 className="text-sm font-bold text-gray-700 mb-2">📝 შენიშვნები</h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{vehicle.notes}</p>
            </div>
          )}

          {/* Footer - მხოლოდ პრინტზე */}
          <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-500 print:block hidden">
            <p>Logistics OS • დაბეჭდილი: {new Date().toLocaleString('ka-GE')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// 🧩 Helper Components
const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-[10px] uppercase tracking-wide text-gray-500">{label}</p>
    <p className="text-sm font-medium text-gray-900 mt-0.5">{value}</p>
  </div>
)

const Badge = ({ children }: { children: React.ReactNode }) => (
  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded border border-gray-200">{children}</span>
)