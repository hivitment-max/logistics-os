'use client'

import { useState, memo } from 'react'

// ════════════════════════════════════════════════════════════
// interfaces
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

interface VehiclesTabProps {
  vehicles: Vehicle[]
  loading: boolean
  onEdit: (vehicle: Vehicle) => void
  onDelete: (vehicle: Vehicle) => void
  onAdd: () => void
  onPrint?: (vehicle: Vehicle) => void
}

// ════════════════════════════════════════════════════════════
// helpers
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
// 🪪 LicensePlate
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
// LoadBar
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
// VehicleTags
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
// 🖨️ PrintPreview
// ════════════════════════════════════════════════════════════
const PrintPreview = ({ vehicle, onClose }: { vehicle: Vehicle; onClose: () => void }) => {
  const cfg = getStatusCfg(vehicle.status)
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white text-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl print:shadow-none" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center print:hidden">
          <h3 className="text-lg font-bold text-gray-900">🚛 მანქანის დეტალები</h3>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition">🖨️ დაბეჭდვა</button>
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
          {vehicle.driver_name && (<div className="mt-6 pt-4 border-t border-gray-200 print:border-gray-300"><h4 className="text-sm font-bold text-gray-700 mb-2">👨‍️ მინიჭებული მძღოლი</h4><p className="text-base font-medium text-gray-900">{vehicle.driver_name}</p></div>)}
          {vehicle.notes && (<div className="mt-6 pt-4 border-t border-gray-200 print:border-gray-300"><h4 className="text-sm font-bold text-gray-700 mb-2">📝 შენიშვნები</h4><p className="text-sm text-gray-600 whitespace-pre-wrap">{vehicle.notes}</p></div>)}
          <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-500 print:block hidden"><p>Logistics OS • დაბეჭდილი: {new Date().toLocaleString('ka-GE')}</p></div>
        </div>
      </div>
    </div>
  )
}

const InfoRow = ({ label, value }: { label: string; value: string }) => (<div><p className="text-[10px] uppercase tracking-wide text-gray-500">{label}</p><p className="text-sm font-medium text-gray-900 mt-0.5">{value}</p></div>)
const Badge = ({ children }: { children: React.ReactNode }) => (<span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded border border-gray-200">{children}</span>)

// ════════════════════════════════════════════════════════════
// VehicleCard
// ════════════════════════════════════════════════════════════
const VehicleCard = memo(({ vehicle, onEdit, onDelete, onPrint, }: { vehicle: Vehicle; onEdit: () => void; onDelete: () => void; onPrint?: () => void }) => {
  const cfg = getStatusCfg(vehicle.status)
  const icon = TYPE_ICON[vehicle.type] ?? '🚐'
  const typeLabel = TYPE_LABEL[vehicle.type] ?? vehicle.type
  const hasLoad = !!(vehicle.capacity_kg && vehicle.capacity_kg > 0)
  const hasVol = !!(vehicle.volume_m3 && vehicle.volume_m3 > 0)
  const kgPct = hasLoad ? Math.round(((vehicle.current_load_kg || 0) / vehicle.capacity_kg!) * 100) : 0
  const initials = vehicle.driver_name ? vehicle.driver_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '—'
  
  const [showDetails, setShowDetails] = useState(false)

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
            {onPrint && (<button onClick={e => { e.stopPropagation(); onPrint() }} className="w-6 h-6 flex items-center justify-center rounded-md border border-gray-700 bg-gray-800 text-gray-500 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400 transition text-xs" aria-label="პრინტი" title="პრინტი"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg></button>)}
            <button onClick={e => { e.stopPropagation(); onEdit() }} className="w-6 h-6 flex items-center justify-center rounded-md border border-gray-700 bg-gray-800 text-gray-500 hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-400 transition text-xs" aria-label="რედაქტირება" title="რედაქტირება"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
            <button onClick={e => { e.stopPropagation(); onDelete() }} className="w-6 h-6 flex items-center justify-center rounded-md border border-gray-700 bg-gray-800 text-gray-500 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400 transition text-xs opacity-0 group-hover:opacity-100" aria-label="წაშლა" title="წაშლა"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg></button>
          </div>
          
          <span className="text-[9px] font-medium py-0.5 rounded-md border text-center flex-shrink-0" style={{ width: '80px', borderColor: 'rgba(107, 114, 128, 0.5)' }}>{typeLabel}</span>
        </div>
      </div>

      <div className="mx-4 ml-4 h-px bg-gray-800" aria-hidden="true" />

      {/* ── DRIVER + STATUS ── */}
      <div className="flex items-center gap-2 pl-4 pr-3 py-2.5">
        {vehicle.driver_photo_url ? (<img src={vehicle.driver_photo_url} alt={vehicle.driver_name || 'მძღოლი'} className="w-7 h-7 rounded-full object-cover border border-gray-700 flex-shrink-0" />) : (<div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium flex-shrink-0 bg-gray-800 border border-gray-700 text-gray-400" aria-hidden="true">{initials}</div>)}
        <div className="flex-1 min-w-0">
          <p className="text-[9px] text-gray-600 uppercase tracking-wide leading-none mb-0.5">მძღოლი</p>
          <p className="text-[11px] font-medium text-gray-200 truncate">{vehicle.driver_name || <span className="text-gray-600">მიბმული არ არის</span>}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-[9px] font-medium px-2 py-1 rounded-full border flex-shrink-0 ${cfg.pill}`}>
          <span className={`w-[4px] h-[4px] rounded-full flex-shrink-0 ${cfg.dot}`} aria-hidden="true" />{cfg.label}
        </span>
      </div>

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
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                მდებარეობა
              </span>
              <span className="text-[11px] font-medium text-gray-200 truncate">{vehicle.last_location || 'უცნობი'}</span>
            </div>
            <div className="flex flex-col gap-0.5 pl-3 pr-3 py-2 border-b border-gray-800">
              <span className="text-[9px] text-gray-600 uppercase tracking-wide flex items-center gap-1">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                სიგნალი
              </span>
              <span className="text-[11px] font-medium text-emerald-400 font-mono">—</span>
            </div>
            {hasLoad && (
              <>
                <div className="flex flex-col gap-0.5 pl-4 pr-2 py-2 border-r border-gray-800">
                  <span className="text-[9px] text-gray-600 uppercase tracking-wide">ტვირთი</span>
                  <span className={`text-[11px] font-medium font-mono ${kgPct > 85 ? 'text-rose-400' : kgPct > 60 ? 'text-amber-400' : 'text-gray-200'}`}>{(vehicle.current_load_kg || 0).toLocaleString()} კგ</span>
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
              {hasLoad && (<LoadBar current={vehicle.current_load_kg || 0} max={vehicle.capacity_kg!} unit="კგ" />)}
              {hasVol && (<LoadBar current={vehicle.current_load_m3 || 0} max={vehicle.volume_m3!} unit="მ³" />)}
            </div>
          )}
          <VehicleTags vehicle={vehicle} />
        </>
      )}
    </div>
  )
})
VehicleCard.displayName = 'VehicleCard'

// ════════════════════════════════════════════════════════════
// VehiclesTab
// ════════════════════════════════════════════════════════════
export default function VehiclesTab({ vehicles, loading, onEdit, onDelete, onAdd, onPrint, }: VehiclesTabProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [printVehicle, setPrintVehicle] = useState<Vehicle | null>(null)

  const FILTER_DEFS = [
    { key: 'all', label: 'სულ მანქანა', color: '#6b7280' },
    { key: 'active', label: 'თავისუფალი', color: '#34d399' },
    { key: 'idle', label: 'ლოდინში', color: '#fbbf24' },
    { key: 'maintenance', label: 'ტექ. მომსახ.', color: '#f87171' },
  ]

  const filteredVehicles = vehicles.filter(v => {
    const q = searchTerm.toLowerCase()
    const matchSearch = !q || v.plate_number.toLowerCase().includes(q) || v.model.toLowerCase().includes(q) || v.driver_name?.toLowerCase().includes(q)
    const matchFilter = activeFilter === 'all' || v.status === activeFilter || (activeFilter === 'active' && v.status === 'in_transit')
    return matchSearch && matchFilter
  })

  const handlePrint = (vehicle: Vehicle) => { if (onPrint) { onPrint(vehicle) } else { setPrintVehicle(vehicle) } }

  if (loading) return (<div className="flex items-center justify-center h-64 gap-3"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" aria-hidden="true" /><span className="text-sm text-gray-500">მანქანების ჩატვირთვა...</span></div>)

  return (
    <div className="space-y-4">

      {/* ── ONE-LINE TOOLBAR ── */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-800 flex-nowrap">
        
        {/* 🔍 Search Input - Fixed Width */}
        <div className="relative flex-shrink-0 w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input 
            type="text" 
            placeholder="ძებნა..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            className="w-full pl-9 pr-8 py-2 bg-gray-900 border border-gray-700 rounded-lg text-xs text-white outline-none focus:border-blue-500 transition placeholder-gray-600"
            aria-label="მანქანების ძებნა"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition text-xs" aria-label="გასუფთავება">✕</button>
          )}
        </div>

        {/* 📊 4 Filter Cards - Equal Width (flex-1 divided by 4) */}
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
                    ? 'bg-blue-600/20 border-blue-500/50 text-blue-400' 
                    : 'bg-gray-900/50 border-gray-700/50 text-gray-400 hover:border-gray-600 hover:text-gray-300'
                  }
                `}
              >
                <span className="truncate text-[10px]">{f.label}</span>
                <span className={`font-bold tabular-nums ml-1 ${isActive ? 'text-blue-300' : 'text-gray-300'}`}>{count}</span>
              </button>
            )
          })}
        </div>

        {/* ➕ Add Button - Fixed Width */}
        <button
          onClick={onAdd}
          className="flex-shrink-0 w-48 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shadow-lg shadow-blue-500/20"
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
          {filteredVehicles.map(vehicle => (<VehicleCard key={vehicle.id} vehicle={vehicle} onEdit={() => onEdit(vehicle)} onDelete={() => onDelete(vehicle)} onPrint={() => handlePrint(vehicle)} />))}
          
          {/* ➕ Dashed "Add New Vehicle" Card */}
          <button
            onClick={onAdd}
            className="flex flex-col items-center justify-center min-h-[200px] border-2 border-dashed border-gray-700 rounded-2xl bg-gray-900/30 hover:bg-gray-800/50 hover:border-blue-500/50 transition group"
          >
            <div className="w-16 h-16 rounded-full bg-gray-800 group-hover:bg-blue-600/20 flex items-center justify-center mb-3 transition">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-gray-500 group-hover:text-blue-400 transition">
                <path d="M12 5v14M5 12h14"/>
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-400 group-hover:text-blue-400 transition">ახალი მანქანა</span>
            <span className="text-xs text-gray-600 mt-1">დაამატე ფლოტს</span>
          </button>
          
        </div>
      )}

      {/* 🖨️ პრინტის მოდალი */}
      {printVehicle && !onPrint && (<PrintPreview vehicle={printVehicle} onClose={() => setPrintVehicle(null)} />)}
    </div>
  )
}