// src/app/dashboard/components/tabs/VehiclesTab.tsx
'use client'

import { useState, memo, useCallback, useRef } from 'react'
import { 
  DndContext, 
  DragEndEvent, 
  DragStartEvent,
  useSensor, 
  useSensors, 
  PointerSensor,
  DragOverlay,
  useDraggable,
  useDroppable
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { uploadVehiclePhoto, deleteVehiclePhoto } from '../utils/supabaseStorage'

// ════════════════════════════════════════════════════════════
// Interfaces
// ════════════════════════════════════════════════════════════
interface Vehicle {
  id: string
  plate_number: string
  model: string
  type: string
  body_type?: string
  capacity_kg?: number
  volume_m3?: number
  has_tail_lift?: boolean
  straps_count?: number
  adr_capable?: boolean
  has_refrigeration?: boolean
  status: string
  driver_id?: string
  driver_name?: string
  driver_photo_url?: string
  current_load_kg?: number
  current_load_m3?: number
  last_location?: string
  vin_number?: string
  tech_passport?: string
  insurance_policy?: string
  owner_name?: string
  notes?: string
  photo_urls?: string
}

interface Driver {
  id: string
  full_name: string
  phone: string
  photo_url?: string
  is_available?: boolean
}

interface VehiclesTabProps {
  vehicles: Vehicle[]
  loading: boolean
  onEdit: (vehicle: Vehicle) => void
  onDelete: (vehicle: Vehicle) => void
  onAdd: () => void
  onPrint?: (vehicle: Vehicle) => void
  drivers?: Driver[]
  onAssignDriver?: (vehicleId: string, driverId: string) => Promise<void>
  onUnassignDriver?: (vehicleId: string) => Promise<void>
  onUpdateVehiclePhotos?: (vehicleId: string, photos: string[]) => Promise<void>
}

// ════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════
const STATUS_CFG: Record<string, { label: string; pill: string; dot: string; rail: string }> = {
  active:      { label: 'თავისუფალი',   pill: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400',                   rail: 'bg-emerald-500' },
  in_transit:  { label: 'მოძრავია',     pill: 'bg-blue-500/10    text-blue-400    border-blue-500/20',    dot: 'bg-blue-400 animate-pulse',         rail: 'bg-blue-500'    },
  idle:        { label: 'ლოდინში',      pill: 'bg-amber-500/10   text-amber-400   border-amber-500/20',   dot: 'bg-amber-400',                     rail: 'bg-amber-500'   },
  maintenance: { label: 'ტექ. მომსახ.', pill: 'bg-rose-500/10    text-rose-400    border-rose-500/20',    dot: 'bg-rose-400',                      rail: 'bg-rose-500'    },
  inactive:    { label: 'არააქტიური',   pill: 'bg-gray-500/10    text-gray-400    border-gray-500/20',    dot: 'bg-gray-500',                      rail: 'bg-gray-600'    },
}
const getStatusCfg = (s: string) => STATUS_CFG[s] ?? STATUS_CFG.inactive

const TYPE_ICON: Record<string, string> = { truck: '🚛', van: '🚐', car: '🚗' }
const TYPE_LABEL: Record<string, string> = { truck: 'სატვირთო', van: 'ფურგონი', car: 'მსუბუქი' }

const barColor = (pct: number) => {
  if (pct > 85) return 'bg-rose-500'
  if (pct > 60) return 'bg-amber-400'
  return 'bg-emerald-500'
}

const barTextColor = (pct: number) => {
  if (pct > 85) return 'text-rose-400'
  if (pct > 60) return 'text-amber-400'
  return 'text-gray-400'
}

// ════════════════════════════════════════════════════════════
// 🪪 LicensePlate Component
// ════════════════════════════════════════════════════════════
const LicensePlate = ({ number }: { number: string }) => (
  <div 
    className="inline-flex items-center rounded-sm overflow-hidden shadow-sm border border-gray-400 flex-shrink-0"
    style={{ 
      background: 'linear-gradient(180deg, #fffdf0 0%, #fff9e6 100%)',
      width: 'fit-content',
      maxWidth: '140px',
      height: '24px',
      fontFamily: 'monospace'
    }}
    role="img"
    aria-label={`სანომრე ნიშანი: ${number}`}
  >
    <div className="flex flex-col items-center justify-center px-1 h-full flex-shrink-0 border-r border-gray-400" style={{ background: '#1e3a8a' }}>
      <span className="text-[7px] text-[#fbbf24] leading-none font-bold tracking-tight">GEO</span>
    </div>
    <div className="flex items-center justify-center px-2 h-full flex-shrink-0">
      <span className="font-bold tracking-[0.12em] uppercase whitespace-nowrap overflow-hidden text-ellipsis" style={{ fontSize: '12px', color: '#1a1a1a', textShadow: '0 0 1px rgba(0,0,0,0.1)' }}>{number}</span>
    </div>
  </div>
)

// ════════════════════════════════════════════════════════════
// LoadBar Component
// ════════════════════════════════════════════════════════════
const LoadBar = ({ current, max, unit }: { current: number; max: number; unit: string }) => {
  if (!max) return null
  const pct = Math.min(Math.round((current / max) * 100), 100)
  return (
    <div className="flex items-center gap-2" title={`${current}/${max} ${unit}`}>
      <span className="text-[10px] text-gray-500 w-7 flex-shrink-0">{unit}</span>
      <div className="flex-1 h-[3px] rounded-full bg-gray-700/60 overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className={`h-full rounded-full transition-all duration-500 ${barColor(pct)}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-[10px] font-mono w-8 text-right flex-shrink-0 ${barTextColor(pct)}`}>{pct}%</span>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// VehicleTags Component
// ════════════════════════════════════════════════════════════
const VehicleTags = ({ vehicle }: { vehicle: Vehicle }) => {
  const tags: string[] = []
  if (vehicle.adr_capable) tags.push('⚠️ ADR')
  if (vehicle.has_refrigeration) tags.push('❄️ მაცივარი')
  if (vehicle.has_tail_lift) tags.push('🔽 იფტი')
  if ((vehicle.straps_count || 0) >= 4) tags.push('🔗 ვედები')
  if (vehicle.body_type) tags.push(`📦 ${vehicle.body_type}`)
  if (!tags.length) return null
  return (
    <div className="flex flex-wrap gap-1 px-4 pb-3 border-t border-gray-800/60 pt-2 mt-1">
      {tags.map((t, i) => (
        <span key={i} className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-gray-700/50 bg-gray-800/40 text-gray-400">{t}</span>
      ))}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// 👥 DraggableDriver Component
// ════════════════════════════════════════════════════════════
const DraggableDriver = ({ driver }: { driver: Driver }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `driver-${driver.id}`,
    data: { type: 'driver', driverId: driver.id, driverName: driver.full_name },
  })

  const style = transform ? { transform: CSS.Transform.toString(transform), zIndex: 50 } : undefined

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className={`
        flex items-center gap-2 p-2 rounded-lg border cursor-grab active:cursor-grabbing transition-all select-none
        ${isDragging ? 'opacity-40 scale-95' : ''}
        ${driver.is_available 
          ? 'bg-gray-800/50 border-gray-700 hover:border-cyan-400/50 hover:bg-gray-800' 
          : 'bg-gray-900/30 border-gray-800 opacity-50 cursor-not-allowed'
        }
      `}
      title={driver.is_available ? 'გადაათრიე მანქანის მძღოლის ველზე' : 'მძღოლი დაკავებულია'}
      onMouseDown={(e) => e.preventDefault()}
    >
      {driver.photo_url ? (
        <img src={driver.photo_url} alt={driver.full_name} className="w-7 h-7 rounded-full object-cover border border-gray-600 pointer-events-none" />
      ) : (
        <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-300 pointer-events-none">
          {driver.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
        </div>
      )}
      <div className="flex-1 min-w-0 pointer-events-none">
        <p className="text-[11px] font-medium text-white truncate">{driver.full_name}</p>
        <p className="text-[9px] text-gray-500">{driver.phone}</p>
      </div>
      <span className="text-xs opacity-50 pointer-events-none">✋</span>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// 🚐 DroppableVehicleZone Component — ნეონის ეფექტებით (მინიშნების გარეშე!) ✨
// ════════════════════════════════════════════════════════════
const DroppableVehicleZone = ({ 
  vehicleId, 
  children,
  className,
  isDraggingAnyDriver,
  hasAssignedDriver,
}: { 
  vehicleId: string
  children: React.ReactNode
  className?: string
  isDraggingAnyDriver?: boolean
  hasAssignedDriver?: boolean
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `vehicle-drop-${vehicleId}`,
    data: { type: 'vehicle', vehicleId },
  })

  // ✨ მაქსიმალურად თვალსაჩინო ვიზუალური ეფექტები:
  const baseClasses = "transition-all duration-200 cursor-copy rounded-lg relative overflow-visible"
  
  // როცა მძღოლი იდრაგება: მთლიანი ზონა ანთდება ციან ნეონით
  const draggingClasses = isDraggingAnyDriver && !hasAssignedDriver
    ? "bg-cyan-500/20 border-2 border-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.5)] scale-[1.02]" 
    : "border border-gray-700/50"
  
  // როცა ზედ გადადიხარ: უფრო ძლიერი ნეონი + პულსაცია
  const overClasses = isOver 
    ? "!bg-cyan-500/30 !border-cyan-300 !shadow-[0_0_40px_rgba(34,211,238,0.8)] !scale-[1.04] animate-pulse" 
    : ""

  return (
    <div 
      ref={setNodeRef} 
      className={`${baseClasses} ${draggingClasses} ${overClasses} ${className || ''}`}
    >
      {/* ✅ მინიშნება წაშლილია — ნეონი საკმარისია! */}
      {children}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// 📸 PhotoGallery Component
// ════════════════════════════════════════════════════════════
const PhotoGallery = ({ 
  vehicleId, 
  initialPhotos = [], 
  onPhotosChange,
}: { 
  vehicleId: string
  initialPhotos: string[]
  onPhotosChange?: (photos: string[]) => void
}) => {
  const [photos, setPhotos] = useState<string[]>(initialPhotos)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleUpload = async (file: File) => {
    setUploading(true)
    setUploadProgress(0)
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
    setUploadProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDelete = async (url: string) => {
    if (!confirm('დარწმუნებული ხართ რომ გინდათ წაშალოთ ეს ფოტო?')) return
    
    const result = await deleteVehiclePhoto(url)
    
    if (result.success) {
      const newPhotos = photos.filter(p => p !== url)
      setPhotos(newPhotos)
      onPhotosChange?.(newPhotos)
      if (selectedPhoto === url) setSelectedPhoto(null)
    } else {
      setError(result.error || 'წაშლა ვერ მოხერხდა')
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-2">
        <label className={`
          aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer transition relative
          ${uploading ? 'border-cyan-500 bg-gray-800/30 cursor-wait' : 'border-gray-600 hover:border-cyan-400 hover:bg-gray-800/50'}
        `}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
          {uploading ? (
            <>
              <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-[9px] text-cyan-400">{uploadProgress}%</span>
            </>
          ) : (
            <>
              <span className="text-lg">📷</span>
              <span className="text-[9px] text-gray-400">{photos.length}</span>
            </>
          )}
          {uploading && uploadProgress > 0 && (
            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
              <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}
        </label>

        {photos.map((photo, idx) => (
          <div key={idx} className="relative aspect-square group">
            <img
              src={photo}
              alt={`ფოტო ${idx + 1}`}
              className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition"
              onClick={() => setSelectedPhoto(photo)}
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="%23666" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>'
              }}
            />
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(photo) }}
              className="absolute top-1 right-1 w-5 h-5 bg-red-500/90 hover:bg-red-600 rounded-full flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition shadow-lg"
              title="წაშლა"
            >
              ×
            </button>
            <span className="absolute bottom-1 left-1 px-1 py-0.5 bg-black/60 rounded text-[8px] text-white font-mono">
              {idx + 1}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-[10px] text-red-400">
          ⚠️ {error}
          <button onClick={() => setError(null)} className="ml-2 underline hover:text-red-300">დახურვა</button>
        </div>
      )}

      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
          <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <img src={selectedPhoto} alt="დიდი" className="w-full h-[60vh] object-contain rounded-xl" />
            <button onClick={() => setSelectedPhoto(null)} className="absolute top-4 right-4 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full text-white">✕</button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/60 rounded-full text-[10px] text-white">
              {photos.indexOf(selectedPhoto) + 1} / {photos.length}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// 🖨️ PrintPreview Component
// ════════════════════════════════════════════════════════════
const PrintPreview = ({ vehicle, onClose }: { vehicle: Vehicle; onClose: () => void }) => {
  const cfg = getStatusCfg(vehicle.status)
  const photos = vehicle.photo_urls?.split(',').filter(url => url.trim()) || []
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white text-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl print:shadow-none" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center print:hidden">
          <h3 className="text-lg font-bold text-gray-900">🚛 მანქანის დეტალები</h3>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition">🖨️ დაბეჭდვა</button>
            <button onClick={onClose} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition">დახურვა</button>
          </div>
        </div>
        <div className="p-6 print:p-0">
          <div className="flex items-center gap-4 pb-4 border-b border-gray-200 print:border-gray-300">
            <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-3xl print:bg-gray-200">{TYPE_ICON[vehicle.type] ?? '🚐'}</div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{vehicle.model}</h2>
              <div className="mt-1"><LicensePlate number={vehicle.plate_number} /></div>
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border mt-2 ${cfg.pill.replace('bg-', 'border-').replace('/10', '/20')}`}>
                <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />{cfg.label}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <InfoRow label="ტიპი" value={TYPE_LABEL[vehicle.type] ?? vehicle.type} />
            <InfoRow label="ძარა" value={vehicle.body_type || '–'} />
            <InfoRow label="ტვირთამწეობა" value={vehicle.capacity_kg ? `${vehicle.capacity_kg.toLocaleString()} კგ` : '–'} />
            <InfoRow label="მოცულობა" value={vehicle.volume_m3 ? `${vehicle.volume_m3} მ³` : '–'} />
            <InfoRow label="VIN კოდი" value={vehicle.vin_number || '–'} />
            <InfoRow label="ტექ. პასპორტი" value={vehicle.tech_passport || '–'} />
            <InfoRow label="დაზღვევა" value={vehicle.insurance_policy || '–'} />
            <InfoRow label="მფლობელი" value={vehicle.owner_name || '–'} />
          </div>
          {(vehicle.has_tail_lift || vehicle.has_refrigeration || vehicle.adr_capable || vehicle.straps_count) && (
            <div className="mt-6 pt-4 border-t border-gray-200 print:border-gray-300">
              <h4 className="text-sm font-bold text-gray-700 mb-2">🔧 აღჭურვილობა</h4>
              <div className="flex flex-wrap gap-2">
                {vehicle.has_tail_lift && <Badge>🔽 იფტი</Badge>}
                {vehicle.has_refrigeration && <Badge>❄️ მაცივარი</Badge>}
                {vehicle.adr_capable && <Badge>⚠️ ADR</Badge>}
                {vehicle.straps_count && vehicle.straps_count >= 4 && <Badge>🔗 {vehicle.straps_count} ვედი</Badge>}
              </div>
            </div>
          )}
          {vehicle.driver_name && (
            <div className="mt-6 pt-4 border-t border-gray-200 print:border-gray-300">
              <h4 className="text-sm font-bold text-gray-700 mb-2">👨‍✈️ მინიჭებული მძღოლი</h4>
              <p className="text-base font-medium text-gray-900">{vehicle.driver_name}</p>
            </div>
          )}
          {photos.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200 print:border-gray-300">
              <h4 className="text-sm font-bold text-gray-700 mb-2">📸 ფოტოები</h4>
              <div className="grid grid-cols-3 gap-2">
                {photos.slice(0, 6).map((url, i) => (
                  <img key={i} src={url} alt={`ფოტო ${i+1}`} className="aspect-square object-cover rounded" />
                ))}
              </div>
            </div>
          )}
          {vehicle.notes && (
            <div className="mt-6 pt-4 border-t border-gray-200 print:border-gray-300">
              <h4 className="text-sm font-bold text-gray-700 mb-2">📝 შენიშვნები</h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{vehicle.notes}</p>
            </div>
          )}
          <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-500 print:block hidden">
            <p>Logistics OS • დაბეჭდილი: {new Date().toLocaleString('ka-GE')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-[10px] uppercase tracking-wide text-gray-500">{label}</p>
    <p className="text-sm font-medium text-gray-900 mt-0.5">{value}</p>
  </div>
)
const Badge = ({ children }: { children: React.ReactNode }) => (
  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded border border-gray-200">{children}</span>
)

// ════════════════════════════════════════════════════════════
// VehicleCard Component — ცარიელი წრე + ნეონის ეფექტებით! ✨
// ════════════════════════════════════════════════════════════
const VehicleCard = memo(({ 
  vehicle, 
  onEdit, 
  onDelete, 
  onPrint,
  drivers,
  onAssignDriver,
  onUnassignDriver,
  onUpdateVehiclePhotos,
  isDraggingAnyDriver,
}: { 
  vehicle: Vehicle
  onEdit: () => void
  onDelete: () => void
  onPrint?: () => void
  drivers?: Driver[]
  onAssignDriver?: (driverId: string) => Promise<void>
  onUnassignDriver?: () => Promise<void>
  onUpdateVehiclePhotos?: (photos: string[]) => Promise<void>
  isDraggingAnyDriver?: boolean
}) => {
  const cfg = getStatusCfg(vehicle.status)
  const icon = TYPE_ICON[vehicle.type] ?? '🚐'
  const typeLabel = TYPE_LABEL[vehicle.type] ?? vehicle.type
  const hasLoad = !!(vehicle.capacity_kg && vehicle.capacity_kg > 0)
  const hasVol = !!(vehicle.volume_m3 && vehicle.volume_m3 > 0)
  const kgPct = hasLoad ? Math.round(((vehicle.current_load_kg || 0) / vehicle.capacity_kg!) * 100) : 0
  
  const [showDetails, setShowDetails] = useState(false)
  const photos = vehicle.photo_urls?.split(',').filter(url => url.trim()) || []
  const assignedDriver = drivers?.find(d => d.id === vehicle.driver_id)

  return (
    <div className="relative flex flex-col bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-700 transition-all duration-200 group">
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${cfg.rail}`} aria-hidden="true" />
      
      {/* ── HEAD ── */}
      <div className="flex items-start gap-2.5 pl-4 pr-3 pt-3 pb-2.5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 bg-gray-800 border border-gray-700/50" aria-hidden="true">{icon}</div>
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <p className="text-[13px] font-semibold text-white truncate leading-tight">{vehicle.model}</p>
          <LicensePlate number={vehicle.plate_number} />
        </div>
        
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <div className="flex gap-1">
            {onPrint && (
              <button onClick={e => { e.stopPropagation(); onPrint() }} className="w-6 h-6 flex items-center justify-center rounded-md border border-gray-700 bg-gray-800 text-gray-500 hover:bg-cyan-500/10 hover:border-cyan-400/30 hover:text-cyan-400 transition text-xs" aria-label="პრინტი" title="პრინტი">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
                </svg>
              </button>
            )}
            <button onClick={e => { e.stopPropagation(); onEdit() }} className="w-6 h-6 flex items-center justify-center rounded-md border border-gray-700 bg-gray-800 text-gray-500 hover:bg-cyan-500/10 hover:border-cyan-400/30 hover:text-cyan-400 transition text-xs" aria-label="რედაქტირება" title="რედაქტირება">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button onClick={e => { e.stopPropagation(); onDelete() }} className="w-6 h-6 flex items-center justify-center rounded-md border border-gray-700 bg-gray-800 text-gray-500 hover:bg-rose-500/10 hover:border-rose-400/30 hover:text-rose-400 transition text-xs opacity-0 group-hover:opacity-100" aria-label="წაშლა" title="წაშლა">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
              </svg>
            </button>
          </div>
          <span className="text-[9px] font-medium py-0.5 rounded-md border text-center flex-shrink-0" style={{ width: '80px', borderColor: 'rgba(107, 114, 128, 0.5)' }}>{typeLabel}</span>
        </div>
      </div>

      <div className="mx-4 ml-4 h-px bg-gray-800" aria-hidden="true" />

      {/* ✅ ახალი: Driver Drop Zone — მაქსიმალურად თვალსაჩინო! */}
      <DroppableVehicleZone 
        vehicleId={vehicle.id} 
        className="flex items-center gap-3 pl-4 pr-4 py-3"
        isDraggingAnyDriver={isDraggingAnyDriver}
        hasAssignedDriver={!!assignedDriver}
      >
        {/* 🔵 Driver Avatar Circle — პროფილის აიკონით ან ფოტოთი */}
        <div className={`
          w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all duration-200
          ${assignedDriver 
            ? 'border-cyan-400 bg-gray-800 shadow-[0_0_12px_rgba(34,211,238,0.5)]' 
            : 'border-gray-600 bg-gray-900/50 border-dashed'
          }
        `}>
          {assignedDriver ? (
            assignedDriver.photo_url ? (
              <img 
                src={assignedDriver.photo_url} 
                alt={assignedDriver.full_name} 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              // 👤 პროფილის აიკონი (კაცი)
              <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )
          ) : (
            // ❌ ცარიელი მდგომარეობა
            <span className="text-gray-500 text-lg font-light">+</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[9px] text-gray-500 uppercase tracking-wide leading-none mb-0.5">მძღოლი</p>
          <p className="text-[11px] font-medium text-gray-200 truncate">
            {assignedDriver?.full_name || <span className="text-gray-500 italic">მიბმული არ არის</span>}
          </p>
        </div>
        
        {/* Status Badge */}
        <span className={`inline-flex items-center gap-1.5 text-[9px] font-medium px-2 py-1 rounded-full border flex-shrink-0 ${cfg.pill}`}>
          <span className={`w-[4px] h-[4px] rounded-full flex-shrink-0 ${cfg.dot}`} aria-hidden="true" />{cfg.label}
        </span>
      </DroppableVehicleZone>

      {/* ── ჩამოსაშლელი ღილაკი ── */}
      <button onClick={() => setShowDetails(!showDetails)} className="mx-4 mb-2 px-3 py-1.5 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-lg text-[10px] text-gray-400 hover:text-gray-300 transition flex items-center justify-center gap-1.5">
        {showDetails ? '▲ დამალვა' : '▼ დეტალური ინფორმაცია'}
      </button>

      {/* ── ჩამოშლილი კონტენტი ── */}
      {showDetails && (
        <>
          <div className="grid grid-cols-2 border-t border-gray-800">
            <div className="flex flex-col gap-0.5 pl-4 pr-2 py-2 border-r border-b border-gray-800">
              <span className="text-[9px] text-gray-600 uppercase tracking-wide flex items-center gap-1">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                მდებარეობა
              </span>
              <span className="text-[11px] font-medium text-gray-200 truncate">{vehicle.last_location || 'უცნობი'}</span>
            </div>
            <div className="flex flex-col gap-0.5 pl-3 pr-3 py-2 border-b border-gray-800">
              <span className="text-[9px] text-gray-600 uppercase tracking-wide flex items-center gap-1">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                სიგნალი
              </span>
              <span className="text-[11px] font-medium text-emerald-400 font-mono">—</span>
            </div>
            {hasLoad && (
              <>
                <div className="flex flex-col gap-0.5 pl-4 pr-2 py-2 border-r border-gray-800">
                  <span className="text-[9px] text-gray-600 uppercase tracking-wide">ტვირთი</span>
                  <span className={`text-[11px] font-medium font-mono ${kgPct > 85 ? 'text-rose-400' : kgPct > 60 ? 'text-amber-400' : 'text-gray-200'}`}>
                    {(vehicle.current_load_kg || 0).toLocaleString()} კგ
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 pl-3 pr-3 py-2">
                  <span className="text-[9px] text-gray-600 uppercase tracking-wide">ტევადობა</span>
                  <span className="text-[11px] font-medium font-mono text-gray-200">{vehicle.capacity_kg!.toLocaleString()} კგ</span>
                </div>
              </>
            )}
          </div>
          {(hasLoad || hasVol) && (
            <div className="px-4 pt-2 pb-3 flex flex-col gap-1.5 border-t border-gray-800">
              {hasLoad && <LoadBar current={vehicle.current_load_kg || 0} max={vehicle.capacity_kg!} unit="კგ" />}
              {hasVol && <LoadBar current={vehicle.current_load_m3 || 0} max={vehicle.volume_m3!} unit="მ³" />}
            </div>
          )}
          <VehicleTags vehicle={vehicle} />
          
          {/* 👥 Driver Assignment Section — ✅ ახალი: მაქს. 3 მძღოლი + სქროლი + ფეიდი */}
          {drivers && drivers.length > 0 && (
            <div className="border-t border-gray-800 p-4">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2 flex items-center justify-between">
                <span>👥 მძღოლის მინიჭება</span>
                <span className="text-[9px] text-gray-600 normal-case">
                  {drivers.filter(d => d.is_available && d.id !== vehicle.driver_id).length} ხელმისაწვდომი
                </span>
              </p>
              
              {/* ✅ Scrollable container with max 3 visible drivers + gradient fade */}
              <div className="relative mb-3">
                <div 
                  className="max-h-[120px] overflow-y-auto space-y-1.5 pr-1"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#4b5563 transparent'
                  }}
                >
                  {drivers
                    .filter(d => d.is_available && d.id !== vehicle.driver_id)
                    .map(driver => (
                      <DraggableDriver key={driver.id} driver={driver} />
                    ))}
                  {drivers.filter(d => d.is_available && d.id !== vehicle.driver_id).length === 0 && (
                    <p className="text-[10px] text-gray-600 text-center py-2">ყველა მძღოლი დაკავებულია</p>
                  )}
                </div>
                {/* Gradient fade at bottom — indicates more content below */}
                <div className="absolute bottom-0 left-0 right-0 h-5 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none" />
              </div>
              
              {assignedDriver && (
                <button
                  onClick={onUnassignDriver}
                  className="w-full px-2 py-1.5 text-[10px] text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded border border-red-500/20 transition flex items-center justify-center gap-1"
                >
                  🔓 {assignedDriver.full_name}-ის მოხსნა
                </button>
              )}
            </div>
          )}
          
          {/* 📸 Photo Gallery Section */}
          <div className="border-t border-gray-800 p-4">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">📸 მანქანის ფოტოები</p>
            <PhotoGallery 
              vehicleId={vehicle.id}
              initialPhotos={photos}
              onPhotosChange={onUpdateVehiclePhotos}
            />
          </div>
        </>
      )}
    </div>
  )
})
VehicleCard.displayName = 'VehicleCard'

// ════════════════════════════════════════════════════════════
// VehiclesTab Main Component — მაქსიმალურად თვალსაჩინო ნეონით! ✨
// ════════════════════════════════════════════════════════════
export default function VehiclesTab({ 
  vehicles, 
  loading, 
  onEdit, 
  onDelete, 
  onAdd, 
  onPrint,
  drivers = [],
  onAssignDriver,
  onUnassignDriver,
  onUpdateVehiclePhotos,
}: VehiclesTabProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [printVehicle, setPrintVehicle] = useState<Vehicle | null>(null)
  const [activeDraggedDriver, setActiveDraggedDriver] = useState<Driver | null>(null)
  const [isDraggingAnyDriver, setIsDraggingAnyDriver] = useState(false)

  const FILTER_DEFS = [
    { key: 'all', label: 'სულ მანქანა', color: '#6b7280' },
    { key: 'active', label: 'თავისუფალი', color: '#34d399' },
    { key: 'idle', label: 'ლოდინში', color: '#fbbf24' },
    { key: 'maintenance', label: 'ტექ. მომსახ.', color: '#f87171' },
  ]

  // 🎯 Drag & Drop სენსორები
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  // 🤝 Drag Start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    const driver = drivers.find(d => d.id === active.data.current?.driverId)
    if (driver) {
      setActiveDraggedDriver(driver)
      setIsDraggingAnyDriver(true)  // ✅ ავანთეთ ყველა დროპ ზონა
    }
  }, [drivers])

  // 🤝 Drag End — ✅ განახლებული: წაშლილია preventDefault
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    // ✅ წაშლილი: event.preventDefault?.() - DragEndEvent-ს არ აქვს ეს მეთოდი!
    
    setActiveDraggedDriver(null)
    setIsDraggingAnyDriver(false)  // ✅ ჩავაქრეთ დროპ ზონების ანთება
    
    if (!over) return
    
    const activeData = active.data.current as any
    const overData = over.data.current as any

    if (activeData?.type === 'driver' && overData?.type === 'vehicle' && onAssignDriver) {
      const driverId = activeData.driverId
      const vehicleId = overData.vehicleId
      await onAssignDriver(vehicleId, driverId)
    }
  }, [onAssignDriver])

  const filteredVehicles = vehicles.filter(v => {
    const q = searchTerm.toLowerCase()
    const matchSearch = !q || v.plate_number.toLowerCase().includes(q) || v.model.toLowerCase().includes(q) || v.driver_name?.toLowerCase().includes(q)
    const matchFilter = activeFilter === 'all' || v.status === activeFilter || (activeFilter === 'active' && v.status === 'in_transit')
    return matchSearch && matchFilter
  })

  const handlePrint = (vehicle: Vehicle) => { 
    if (onPrint) { onPrint(vehicle) } 
    else { setPrintVehicle(vehicle) } 
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-3">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-500" aria-hidden="true" />
      <span className="text-sm text-gray-500">მანქანების ჩატვირთვა...</span>
    </div>
  )

  return (
    <DndContext 
      sensors={sensors} 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">

        {/* ── ONE-LINE TOOLBAR ── */}
        <div className="flex items-center gap-3 pb-4 border-b border-gray-800 flex-nowrap">
          {/* 🔍 Search */}
          <div className="relative flex-shrink-0 w-48">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input 
              type="text" 
              placeholder="ძებნა..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="w-full pl-9 pr-8 py-2 bg-gray-900 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-cyan-500 transition placeholder-gray-600"
              aria-label="მანქანების ძებნა"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition text-xs" aria-label="გასუფთავება">✕</button>
            )}
          </div>

          {/* 📊 Filters */}
          <div className="flex-1 flex gap-2">
            {FILTER_DEFS.map(f => {
              const isActive = activeFilter === f.key
              const count = f.key === 'all' ? vehicles.length : vehicles.filter(v => v.status === f.key).length
              return (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={`
                    flex-1 flex items-center justify-between px-2 py-2 rounded-lg border text-xs font-medium transition-all flex-shrink-0
                    ${isActive 
                      ? 'bg-cyan-600/20 border-cyan-400/50 text-cyan-400' 
                      : 'bg-gray-900/50 border-gray-700/50 text-gray-400 hover:border-gray-600 hover:text-gray-300'
                    }
                  `}
                >
                  <span className="truncate text-[10px]">{f.label}</span>
                  <span className={`font-bold tabular-nums ml-1 ${isActive ? 'text-cyan-300' : 'text-gray-300'}`}>{count}</span>
                </button>
              )
            })}
          </div>

          {/* ➕ Add */}
          <button
            onClick={onAdd}
            className="flex-shrink-0 w-48 flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white rounded-lg text-xs font-semibold transition shadow-[0_0_20px_rgba(34,211,238,0.4)]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            მანქანის დამატება
          </button>
        </div>

        {/* ── CARDS GRID ── */}
        {filteredVehicles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-600">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-30" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <p className="text-sm font-medium text-gray-500">მანქანები ვერ მოიძებნა</p>
            <p className="text-xs text-gray-600">{searchTerm ? 'სცადე სხვა საძიებო სიტყვა' : 'ფილტრი გაასუფთავე ან დაამატე ახალი მანქანა'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredVehicles.map(vehicle => (
              <VehicleCard 
                key={vehicle.id} 
                vehicle={vehicle} 
                onEdit={() => onEdit(vehicle)} 
                onDelete={() => onDelete(vehicle)} 
                onPrint={() => handlePrint(vehicle)}
                drivers={drivers}
                onAssignDriver={onAssignDriver ? (driverId) => onAssignDriver(vehicle.id, driverId) : undefined}
                onUnassignDriver={onUnassignDriver ? () => onUnassignDriver(vehicle.id) : undefined}
                onUpdateVehiclePhotos={onUpdateVehiclePhotos ? (photos) => onUpdateVehiclePhotos(vehicle.id, photos) : undefined}
                isDraggingAnyDriver={isDraggingAnyDriver}
              />
            ))}
            
            {/* ➕ Add Card */}
            <button
              onClick={onAdd}
              className="flex flex-col items-center justify-center min-h-[200px] border-2 border-dashed border-gray-700 rounded-2xl bg-gray-900/30 hover:bg-gray-800/50 hover:border-cyan-400/50 transition group"
            >
              <div className="w-16 h-16 rounded-full bg-gray-800 group-hover:bg-cyan-600/20 flex items-center justify-center mb-3 transition">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-gray-500 group-hover:text-cyan-400 transition">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-400 group-hover:text-cyan-400 transition">ახალი მანქანა</span>
              <span className="text-xs text-gray-600 mt-1">დაამატე ფლოტს</span>
            </button>
          </div>
        )}

        {/* 🎯 Drag Overlay — ნეონის ეფექტებით */}
        <DragOverlay>
          {activeDraggedDriver && (
            <div className="w-48 p-2 bg-gray-800 border border-cyan-400 rounded-lg shadow-[0_0_30px_rgba(34,211,238,0.8)]">
              <div className="flex items-center gap-2">
                {activeDraggedDriver.photo_url ? (
                  <img src={activeDraggedDriver.photo_url} className="w-8 h-8 rounded-full object-cover border-2 border-cyan-400" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm border-2 border-cyan-400">
                    {activeDraggedDriver.full_name.split(' ').map(n => n[0]).slice(0,2).join('')}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-white">{activeDraggedDriver.full_name}</p>
                  <p className="text-[10px] text-gray-400">{activeDraggedDriver.phone}</p>
                </div>
              </div>
              <p className="text-[9px] text-cyan-400 mt-1 text-center animate-pulse">✨ ჩააგდე მანქანის მძღოლის ველზე</p>
            </div>
          )}
        </DragOverlay>

        {/* 🖨️ Print Modal */}
        {printVehicle && !onPrint && <PrintPreview vehicle={printVehicle} onClose={() => setPrintVehicle(null)} />}
      </div>
    </DndContext>
  )
}