// src/app/dashboard/components/modals/vehicle/PrintVehicleModal.tsx
'use client'

import { Vehicle } from '../../AdminDashboard/types'
import { getStatusColor } from '../../utils/statusHelpers'
import { getVehicleTypeIcon, getVehicleTypeLabel } from '../../utils/categoryHelpers'
import { formatDate } from '../../utils/formatters'

interface PrintVehicleModalProps {
  isOpen: boolean
  onClose: () => void
  vehicle: Vehicle | null
}

export default function PrintVehicleModal({ isOpen, onClose, vehicle }: PrintVehicleModalProps) {
  if (!isOpen || !vehicle) return null

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white text-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl print:shadow-none" onClick={e => e.stopPropagation()}>
        
        {/* Header - print hidden */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center print:hidden">
          <h3 className="text-lg font-bold text-gray-900">🚛 მანქანის დეტალები</h3>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition">🖨️ დაბეჭდვა</button>
            <button onClick={onClose} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition">დახურვა</button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 print:p-0">
          
          {/* Header Section */}
          <div className="flex items-center gap-4 pb-4 border-b border-gray-200 print:border-gray-300">
            <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-3xl print:bg-gray-200">
              {getVehicleTypeIcon(vehicle.type)}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{vehicle.model}</h2>
              
              {/* License Plate */}
              <div className="mt-1 inline-flex items-center rounded-sm overflow-hidden shadow-sm border border-gray-400" 
                   style={{ background: 'linear-gradient(180deg, #fffdf0 0%, #fff9e6 100%)', height: '24px', fontFamily: 'monospace' }}>
                <div className="flex flex-col items-center justify-center px-1.5 h-full flex-shrink-0 border-r border-gray-400" style={{ background: '#1e3a8a' }}>
                  <span className="text-[8px] text-[#fbbf24] leading-none font-bold tracking-tight">GEO</span>
                </div>
                <div className="flex items-center justify-center px-2 h-full flex-shrink-0">
                  <span className="font-bold tracking-[0.15em] uppercase" style={{ fontSize: '13px', color: '#1a1a1a' }}>{vehicle.plate_number}</span>
                </div>
              </div>
              
              {/* Status Badge */}
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border mt-2 ${getStatusColor(vehicle.status).replace('bg-', 'border-').replace('/20', '/20')}`}>
                <span className={`w-2 h-2 rounded-full ${getStatusColor(vehicle.status).includes('green') ? 'bg-green-400' : getStatusColor(vehicle.status).includes('blue') ? 'bg-blue-400' : getStatusColor(vehicle.status).includes('yellow') ? 'bg-yellow-400' : getStatusColor(vehicle.status).includes('red') ? 'bg-red-400' : 'bg-gray-400'}`} />
                {vehicle.status === 'active' ? 'თავისუფალი' : vehicle.status === 'in_transit' ? 'მოძრავია' : vehicle.status === 'idle' ? 'ლოდინში' : vehicle.status === 'maintenance' ? 'ტექ. მომსახ.' : 'არააქტიური'}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-gray-500">ტიპი</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{getVehicleTypeLabel(vehicle.type)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-gray-500">ძარა</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{vehicle.body_type || '–'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-gray-500">ტვირთამწეობა</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{vehicle.capacity_kg ? `${vehicle.capacity_kg.toLocaleString('ka-GE')} კგ` : '–'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-gray-500">მოცულობა</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{vehicle.volume_m3 ? `${vehicle.volume_m3} მ³` : '–'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-gray-500">VIN კოდი</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5 font-mono text-xs">{vehicle.vin_number || '–'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-gray-500">ტექ. პასპორტი</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{vehicle.tech_passport || '–'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-gray-500">დაზღვევა</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{vehicle.insurance_policy || '–'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-gray-500">მფლობელი</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{vehicle.owner_name || '–'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-gray-500">PTI ვადა</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{vehicle.pti_expiry ? formatDate(vehicle.pti_expiry) : '–'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-gray-500">EURO სტანდარტი</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{vehicle.euro_standard || '–'}</p>
            </div>
          </div>

          {/* Equipment Section */}
          {(vehicle.has_tail_lift || vehicle.has_refrigeration || vehicle.adr_class || (vehicle.straps_count && vehicle.straps_count >= 4)) && (
            <div className="mt-6 pt-4 border-t border-gray-200 print:border-gray-300">
              <h4 className="text-sm font-bold text-gray-700 mb-2">🔧 აღჭურვილობა</h4>
              <div className="flex flex-wrap gap-2">
                {vehicle.has_tail_lift && <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded border border-gray-200">🔽 ლიფტი</span>}
                {vehicle.has_refrigeration && <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded border border-gray-200">❄️ მაცივარი</span>}
                {vehicle.adr_class && <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded border border-gray-200">⚠️ ADR კლასი {vehicle.adr_class}</span>}
                {vehicle.straps_count && vehicle.straps_count >= 4 && <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded border border-gray-200">🔗 {vehicle.straps_count} ღვედი</span>}
              </div>
            </div>
          )}

          {/* Driver Section */}
          {vehicle.driver_name && (
            <div className="mt-6 pt-4 border-t border-gray-200 print:border-gray-300">
              <h4 className="text-sm font-bold text-gray-700 mb-2">👨‍✈️ მინიჭებული მძღოლი</h4>
              <p className="text-base font-medium text-gray-900">{vehicle.driver_name}</p>
            </div>
          )}

          {/* Notes Section */}
          {vehicle.notes && (
            <div className="mt-6 pt-4 border-t border-gray-200 print:border-gray-300">
              <h4 className="text-sm font-bold text-gray-700 mb-2">📝 შენიშვნები</h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{vehicle.notes}</p>
            </div>
          )}

          {/* Footer - print only */}
          <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-500 print:block hidden">
            <p>Logistics OS • დაბეჭდილი: {new Date().toLocaleString('ka-GE')}</p>
            <p className="mt-1 font-mono text-[10px]">ID: {vehicle.id}</p>
          </div>
        </div>
      </div>
    </div>
  )
}