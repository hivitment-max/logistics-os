// src/app/dashboard/components/modals/vehicle/DeleteVehicleModal.tsx
'use client'

import { Vehicle } from '../../AdminDashboard/types'

interface DeleteVehicleModalProps {
  isOpen: boolean
  onClose: () => void
  vehicle: Vehicle | null
  onConfirm: () => void
  loading?: boolean
}

export default function DeleteVehicleModal({ isOpen, onClose, vehicle, onConfirm, loading = false }: DeleteVehicleModalProps) {
  if (!isOpen || !vehicle) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 border border-red-500/30 rounded-2xl w-full max-w-sm p-6 text-center shadow-2xl" onClick={e => e.stopPropagation()}>
        
        {/* Icon */}
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🗑️</span>
        </div>
        
        {/* Title */}
        <h3 className="text-lg font-bold text-white mb-2">მანქანის წაშლა</h3>
        
        {/* Message */}
        <p className="text-sm text-gray-400 mb-4">
          დარწმუნებული ხართ რომ გინდათ წაშალოთ მანქანა{' '}
          <strong className="text-white">{vehicle.plate_number}</strong> ({vehicle.model})?
          <br />
          <span className="text-red-400">ეს მოქმედება შეუქცევადია!</span>
        </p>
        
        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl text-sm font-medium transition disabled:opacity-50"
          >
            გაუქმება
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition disabled:opacity-50 shadow-lg shadow-red-500/20"
          >
            {loading ? '🔄...' : '✅ დავადასტურებ'}
          </button>
        </div>
      </div>
    </div>
  )
}