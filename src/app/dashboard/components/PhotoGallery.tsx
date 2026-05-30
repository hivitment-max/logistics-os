// ============================================================================
// 📸 Photo Gallery - ფოტოების ატვირთვა/ნახვა/წაშლა
// ============================================================================
'use client'

import { useState, useRef, useCallback } from 'react'
import { uploadVehiclePhoto, deleteVehiclePhoto } from '../utils/supabaseStorage'

interface PhotoGalleryProps {
  vehicleId: string
  initialPhotos?: string[]
  onPhotosChange?: (photos: string[]) => void
  maxPhotos?: number
}

export default function PhotoGallery({ 
  vehicleId, 
  initialPhotos = [], 
  onPhotosChange,
  maxPhotos = 10 
}: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<string[]>(initialPhotos)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 📤 ფოტოს ატვირთვა
  const handleUpload = useCallback(async (file: File) => {
    setUploading(true)
    setError(null)
    
    const result = await uploadVehiclePhoto(vehicleId, file)
    
    if (result.error) {
      setError(result.error)
    } else if (result.url) {
      const newPhotos = [...photos, result.url]
      setPhotos(newPhotos)
      onPhotosChange?.(newPhotos)
    }
    
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [vehicleId, photos, onPhotosChange])

  // 🗑️ ფოტოს წაშლა
  const handleDelete = useCallback(async (photoUrl: string) => {
    if (!confirm('დარწმუნებული ხართ რომ გინდათ წაშალოთ ეს ფოტო?')) return
    
    const result = await deleteVehiclePhoto(photoUrl)
    
    if (result.success) {
      const newPhotos = photos.filter(p => p !== photoUrl)
      setPhotos(newPhotos)
      onPhotosChange?.(newPhotos)
      if (selectedPhoto === photoUrl) setSelectedPhoto(null)
    } else {
      setError(result.error || 'წაშლა ვერ მოხერხდა')
    }
  }, [photos, selectedPhoto, onPhotosChange])

  // 🖱️ File Input Trigger
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
  }

  // 🖼️ Lightbox Navigation
  const navigatePhoto = (direction: 'prev' | 'next') => {
    if (!selectedPhoto) return
    const currentIndex = photos.indexOf(selectedPhoto)
    const newIndex = direction === 'prev' 
      ? (currentIndex - 1 + photos.length) % photos.length
      : (currentIndex + 1) % photos.length
    setSelectedPhoto(photos[newIndex])
  }

  return (
    <div className="space-y-3">
      {/* 📸 Photo Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {/* ➕ Upload Button */}
        <label className={`
          aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer transition
          ${uploading 
            ? 'border-gray-600 bg-gray-800/30 cursor-wait' 
            : photos.length >= maxPhotos
              ? 'border-gray-700 bg-gray-900/30 opacity-50 cursor-not-allowed'
              : 'border-gray-600 hover:border-blue-500 hover:bg-gray-800/50'
          }
        `}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            disabled={uploading || photos.length >= maxPhotos}
            className="hidden"
          />
          {uploading ? (
            <>
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-[9px] text-blue-400">იტვირთება...</span>
            </>
          ) : (
            <>
              <span className="text-xl">📷</span>
              <span className="text-[9px] text-gray-400">
                {photos.length}/{maxPhotos}
              </span>
            </>
          )}
        </label>

        {/* 🖼️ Photo Thumbnails */}
        {photos.map((photo, index) => (
          <div key={index} className="relative aspect-square group">
            <img
              src={photo}
              alt={`მანქანა ${index + 1}`}
              className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition"
              onClick={() => setSelectedPhoto(photo)}
            />
            {/* 🗑️ Delete Button (on hover) */}
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(photo) }}
              className="absolute top-1 right-1 w-5 h-5 bg-red-500/90 hover:bg-red-600 rounded-full flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition shadow-lg"
              title="წაშლა"
            >
              ×
            </button>
            {/* 📊 Index Badge */}
            <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 rounded text-[9px] text-white font-mono">
              {index + 1}
            </span>
          </div>
        ))}
      </div>

      {/* ❌ Error Message */}
      {error && (
        <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-[10px] text-red-400">
          ⚠️ {error}
        </div>
      )}

      {/* 🖼️ Lightbox Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            {/* 🖼️ Main Image */}
            <img
              src={selectedPhoto}
              alt="დიდი ფოტო"
              className="w-full h-[70vh] object-contain rounded-xl shadow-2xl"
            />
            
            {/* 🎛️ Controls */}
            <div className="absolute inset-0 flex items-center justify-between p-4 pointer-events-none">
              <button
                onClick={() => navigatePhoto('prev')}
                className="pointer-events-auto w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white text-xl transition"
              >
                ‹
              </button>
              <button
                onClick={() => navigatePhoto('next')}
                className="pointer-events-auto w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white text-xl transition"
              >
                ›
              </button>
            </div>
            
            {/* ❌ Close Button */}
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white text-lg transition"
            >
              ×
            </button>
            
            {/* 📊 Photo Info */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/60 rounded-full text-[10px] text-white font-mono">
              {photos.indexOf(selectedPhoto) + 1} / {photos.length}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}