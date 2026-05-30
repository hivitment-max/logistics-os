// ============================================================================
// 📸 Supabase Storage Helpers - ფოტოების მართვა
// ============================================================================

import { supabase } from '@/lib/supabase/client'

const BUCKET = 'vehicle-photos'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// 📤 ფოტოს ატვირთვა
export const uploadVehiclePhoto = async (
  vehicleId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ url: string; error?: string }> => {
  // ✅ ვალიდაცია
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { url: '', error: 'მხოლოდ JPG, PNG ან WebP ფაილები' }
  }
  if (file.size > MAX_FILE_SIZE) {
    return { url: '', error: 'ფაილი ზედმეტად დიდია (მაქს. 5MB)' }
  }

  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${vehicleId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`

    // 📤 ატვირთვა პროგრესით
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      })

    if (uploadError) throw uploadError

    // 🔗 Public URL-ის მიღება
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(fileName)

    return { url: publicUrl }
  } catch (err: any) {
    console.error('Photo upload failed:', err)
    return { url: '', error: err.message || 'ატვირთვა ვერ მოხერხდა' }
  }
}

// 🗑️ ფოტოს წაშლა
export const deleteVehiclePhoto = async (photoUrl: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const path = photoUrl.split(`${BUCKET}/`).pop()
    if (!path) throw new Error('Invalid photo URL')

    const { error } = await supabase.storage.from(BUCKET).remove([path])
    if (error) throw error

    return { success: true }
  } catch (err: any) {
    console.error('Photo delete failed:', err)
    return { success: false, error: err.message }
  }
}

// 📥 ფოტოების ჩამოტვირთვა
export const getVehiclePhotos = async (vehicleId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(`${vehicleId}/`, { limit: 20 })

    if (error) throw error

    return data
      .filter(file => file.name && /\.(jpg|jpeg|png|webp)$/i.test(file.name))
      .map(file => {
        const { data: { publicUrl } } = supabase.storage
          .from(BUCKET)
          .getPublicUrl(`${vehicleId}/${file.name}`)
        return publicUrl
      })
  } catch (err) {
    console.error('Failed to fetch photos:', err)
    return []
  }
}

// 🖼️ Blob-დან File-ის კონვერტაცია (DataURL-ისთვის)
export const dataUrlToFile = async (dataUrl: string, fileName: string): Promise<File> => {
  const res = await fetch(dataUrl)
  const blob = await res.blob()
  return new File([blob], fileName, { type: blob.type })
}