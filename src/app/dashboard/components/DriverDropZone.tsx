// ============================================================================
// 👥 Driver Drop Zone - Drag & Drop მძღოლის მინიჭება
// ============================================================================
'use client'

import { useState, useCallback } from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

interface Driver {
  id: string
  full_name: string
  phone: string
  photo_url?: string
  is_available?: boolean
}

interface Vehicle {
  id: string
  plate_number: string
  model: string
  driver_id?: string
  driver_name?: string
}

interface DriverDropZoneProps {
  vehicle: Vehicle
  availableDrivers: Driver[]
  onAssign: (vehicleId: string, driverId: string) => Promise<void>
  onUnassign: (vehicleId: string) => Promise<void>
}

// 🚛 Draggable Driver Card
export const DraggableDriver = ({ driver }: { driver: Driver }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `driver-${driver.id}`,
    data: { type: 'driver', driverId: driver.id },
  })

  const style = transform ? { transform: CSS.Transform.toString(transform) } : undefined

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className={`
        flex items-center gap-2 p-2 rounded-lg border cursor-grab active:cursor-grabbing
        ${driver.is_available 
          ? 'bg-gray-800/50 border-gray-700 hover:border-blue-500/50 hover:bg-gray-800' 
          : 'bg-gray-900/30 border-gray-800 opacity-50 cursor-not-allowed'
        }
        transition-all
      `}
      title={driver.is_available ? 'გადაათრიე მანქანაზე' : 'მძღოლი დაკავებულია'}
    >
      {driver.photo_url ? (
        <img src={driver.photo_url} alt={driver.full_name} className="w-7 h-7 rounded-full object-cover border border-gray-600" />
      ) : (
        <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-300">
          {driver.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-white truncate">{driver.full_name}</p>
        <p className="text-[9px] text-gray-500">{driver.phone}</p>
      </div>
      <span className="text-xs">✋</span>
    </div>
  )
}

// 🚐 Droppable Vehicle Card
export const DroppableVehicle = ({ 
  vehicle, 
  assignedDriver, 
  children 
}: { 
  vehicle: Vehicle
  assignedDriver?: Driver
  children: React.ReactNode
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `vehicle-${vehicle.id}`,
    data: { type: 'vehicle', vehicleId: vehicle.id },
  })

  return (
    <div
      ref={setNodeRef}
      className={`relative transition-all duration-200 ${isOver ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-950 scale-[1.02]' : ''}`}
    >
      {children}
      
      {/* 🎯 Drop Indicator */}
      {isOver && (
        <div className="absolute inset-0 bg-blue-500/10 rounded-2xl border-2 border-dashed border-blue-500 flex items-center justify-center z-10">
          <span className="text-blue-400 text-sm font-medium">👇 მძღოლი აქ ჩააგდე</span>
        </div>
      )}

      {/* 👤 Assigned Driver Badge */}
      {assignedDriver && (
        <div className="absolute top-2 right-2 z-5">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
            {assignedDriver.photo_url ? (
              <img src={assignedDriver.photo_url} alt={assignedDriver.full_name} className="w-4 h-4 rounded-full object-cover" />
            ) : (
              <span className="w-4 h-4 rounded-full bg-emerald-600 flex items-center justify-center text-[8px] text-white">
                {assignedDriver.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </span>
            )}
            <span className="text-[9px] text-emerald-400 font-medium truncate max-w-[80px]">
              {assignedDriver.full_name.split(' ')[0]}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// 🎛️ Driver Assignment Panel
export const DriverAssignmentPanel = ({ vehicle, availableDrivers, onAssign, onUnassign }: DriverDropZoneProps) => {
  const [isAssigning, setIsAssigning] = useState(false)

  const handleAssign = useCallback(async (driverId: string) => {
    setIsAssigning(true)
    try {
      await onAssign(vehicle.id, driverId)
    } finally {
      setIsAssigning(false)
    }
  }, [vehicle.id, onAssign])

  const handleUnassign = useCallback(async () => {
    setIsAssigning(true)
    try {
      await onUnassign(vehicle.id)
    } finally {
      setIsAssigning(false)
    }
  }, [vehicle.id, onUnassign])

  const assignedDriver = availableDrivers.find(d => d.id === vehicle.driver_id)

  return (
    <div className="space-y-3">
      {/* 👤 Current Assignment */}
      <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
        <div className="flex items-center gap-3">
          {assignedDriver ? (
            <>
              {assignedDriver.photo_url ? (
                <img src={assignedDriver.photo_url} alt={assignedDriver.full_name} className="w-8 h-8 rounded-full object-cover border border-gray-600" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-300">
                  {assignedDriver.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
              )}
              <div>
                <p className="text-[11px] font-medium text-white">{assignedDriver.full_name}</p>
                <p className="text-[9px] text-gray-500">{assignedDriver.phone}</p>
              </div>
            </>
          ) : (
            <p className="text-[11px] text-gray-500">მძღოლი არ არის მინიჭებული</p>
          )}
        </div>
        
        {assignedDriver && (
          <button
            onClick={handleUnassign}
            disabled={isAssigning}
            className="px-2 py-1 text-[10px] text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition disabled:opacity-50"
          >
            {isAssigning ? '🔄' : '🔓 მოხსნა'}
          </button>
        )}
      </div>

      {/* 📋 Available Drivers */}
      <div>
        <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">ხელმისაწვდომი მძღოლები</p>
        <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
          {availableDrivers
            .filter(d => d.is_available && d.id !== vehicle.driver_id)
            .map(driver => (
              <DraggableDriver key={driver.id} driver={driver} />
            ))}
          {availableDrivers.filter(d => d.is_available && d.id !== vehicle.driver_id).length === 0 && (
            <p className="text-[10px] text-gray-600 text-center py-2">ყველა მძღოლი დაკავებულია</p>
          )}
        </div>
      </div>

      {/* 💡 Instructions */}
      <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-[9px] text-blue-300">
          💡 <strong>მინიჭება:</strong> გადაათრიე მძღოლი მანქანის ბარათზე ან დააჭირე მძღოლს და აირჩიე "მინიჭება".
        </p>
      </div>
    </div>
  )
}