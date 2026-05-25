'use client'

import { useState, useMemo, useRef, useCallback } from 'react'

// ════════════════════════════════════════════════════════════
// interfaces
// ════════════════════════════════════════════════════════════
export interface Driver {
  id: string
  full_name: string
  phone: string
  email?: string
  photo_url?: string
  license_number: string
  license_expiry?: string
  has_adr: boolean
  languages?: string | string[]
  employment_type: 'internal' | 'contractor'
  status: 'available' | 'on_route' | 'off' | 'inactive'
  current_location?: string
  assigned_vehicle?: { id: string; plate_number: string; model: string }
  telegram_chat_id?: string
  telegram_username?: string
  total_experience_years?: number
  address?: string
  emergency_contact?: string
  personal_id?: string
  dob?: string
}

interface DriversTabProps {
  drivers: Driver[]
  loading: boolean
  onEdit: (driver: Driver) => void
  onDelete: (driver: Driver) => void
  onAdd: () => void
  onAssignVehicle?: (driverId: string, vehicleId: string) => void
  getStatusColor: (status: string) => string
  onPrint?: (driver: Driver) => void
}

// ════════════════════════════════════════════════════════════
// status config - centralized & typed
// ════════════════════════════════════════════════════════════
type StatusKey = 'available' | 'on_route' | 'off' | 'inactive'

interface StatusConfig {
  label: string
  pill: string
  dot: string
  rail: string
  aurora: string
}

const STATUS_CFG: Record<StatusKey, StatusConfig> = {
  available: {
    label: 'ხელმისაწვდომი',
    pill: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    dot: 'bg-emerald-400 shadow-[0_0_8px_#34d399]',
    rail: 'from-emerald-500 to-emerald-800',
    aurora: 'from-emerald-500/10 via-transparent',
  },
  on_route: {
    label: 'რეისში',
    pill: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    dot: 'bg-blue-400 shadow-[0_0_8px_#60a5fa] animate-pulse',
    rail: 'from-blue-500 to-blue-800',
    aurora: 'from-blue-500/10 via-transparent',
  },
  off: {
    label: 'დასვენება',
    pill: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    dot: 'bg-rose-400 shadow-[0_0_8px_#f87171]',
    rail: 'from-rose-500 to-rose-800',
    aurora: 'from-rose-500/8 via-transparent',
  },
  inactive: {
    label: 'არააქტიური',
    pill: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    dot: 'bg-gray-500',
    rail: 'from-gray-500 to-gray-700',
    aurora: 'from-gray-500/5 via-transparent',
  },
}

const getStatusCfg = (s: string): StatusConfig => STATUS_CFG[s as StatusKey] ?? STATUS_CFG.inactive

const AV_BG: Record<StatusKey, string> = {
  available: 'from-emerald-900 to-emerald-700',
  on_route:  'from-blue-900 to-blue-700',
  off:       'from-rose-900 to-rose-700',
  inactive:  'from-gray-800 to-gray-600',
}

const AV_RING: Record<StatusKey, string> = {
  available: 'border-emerald-500/40',
  on_route:  'border-blue-500/40',
  off:       'border-rose-500/40',
  inactive:  'border-gray-500/40',
}

// ════════════════════════════════════════════════════════════
// helpers - pure functions, memoizable
// ════════════════════════════════════════════════════════════
const licExpiryClass = (exp?: string): string => {
  if (!exp) return 'text-gray-600'
  const days = Math.round((new Date(exp).getTime() - Date.now()) / 86400000)
  if (days < 0)  return 'text-rose-400'
  if (days < 30) return 'text-amber-400'
  return 'text-emerald-400'
}

const getInitials = (name: string): string =>
  name.split(' ').map(w => w[0]).slice(0, 1).join('').toUpperCase()

const getLangs = (langs?: string | string[]): string => {
  if (!langs) return ''
  if (Array.isArray(langs)) return langs.join(' / ')
  return String(langs).trim()
}

// ════════════════════════════════════════════════════════════
// DriverCard - with React-friendly 3D tilt & a11y
// ════════════════════════════════════════════════════════════
interface DriverCardProps {
  driver: Driver
  onEdit: () => void
  onDelete: () => void
  onPrint?: () => void
}

const DriverCard = ({ driver, onEdit, onDelete, onPrint }: DriverCardProps) => {
  const [expanded, setExpanded] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const glareRef = useRef<HTMLDivElement>(null)
  
  const cfg = getStatusCfg(driver.status)
  const langs = getLangs(driver.languages)
  const initials = getInitials(driver.full_name)
  const cardId = `driver-card-${driver.id}`

  // ✅ React-friendly 3D tilt using CSS variables (no direct DOM manipulation)
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    
    // Use CSS custom properties for tilt
    cardRef.current.style.setProperty('--tilt-x', `${x * 8}`)
    cardRef.current.style.setProperty('--tilt-y', `${-y * 10}`)
    
    // Glare effect via CSS var
    if (glareRef.current) {
      const gx = 50 + x * 60
      const gy = 50 + y * 60
      glareRef.current.style.setProperty('--glare-x', `${gx}%`)
      glareRef.current.style.setProperty('--glare-y', `${gy}%`)
    }
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (cardRef.current) {
      cardRef.current.style.setProperty('--tilt-x', '0')
      cardRef.current.style.setProperty('--tilt-y', '0')
    }
    if (glareRef.current) {
      glareRef.current.style.setProperty('--glare-x', '50%')
      glareRef.current.style.setProperty('--glare-y', '50%')
    }
  }, [])

  // Keyboard support for expand button
  const handleExpandKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setExpanded(v => !v)
    }
  }, [])

  return (
    <div
      ref={cardRef}
      id={cardId}
      role="article"
      aria-labelledby={`${cardId}-name`}
      className="relative flex flex-col rounded-[18px] overflow-hidden border border-white/[0.07] cursor-default
        transition-[box-shadow] duration-300 will-change-transform
        [transform:translateZ(0)_rotateX(var(--tilt-y,_0deg))_rotateY(var(--tilt-x,_0deg))]"
      style={{ 
        background: 'linear-gradient(160deg,#0e0e1c 0%,#080812 60%,#0c0c18 100%)',
        transformStyle: 'preserve-3d'
      } as React.CSSProperties}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* glare - controlled via CSS vars */}
      <div 
        ref={glareRef}
        className="card-glare absolute inset-0 z-10 pointer-events-none rounded-[18px] transition-[background] duration-200"
        style={{ 
          background: 'radial-gradient(circle at var(--glare-x,50%) var(--glare-y,50%), rgba(255,255,255,.06) 0%, transparent 60%)'
        } as React.CSSProperties} 
      />

      {/* aurora glow */}
      <div className={`absolute top-0 left-0 right-0 h-[110px] pointer-events-none z-[1]
        bg-gradient-to-br ${cfg.aurora} to-transparent`} />

      {/* status rail */}
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] z-[2] bg-gradient-to-b ${cfg.rail} rounded-l-[18px]`} />

      {/* ── HEAD ── */}
      <div className="relative z-[3] flex items-start gap-3 pl-[17px] pr-3 pt-[14px] pb-[11px]">
        {/* avatar with animated ring */}
        <div className="relative flex-shrink-0" style={{ transformStyle: 'preserve-3d' }}>
          <div className={`absolute inset-[-3px] rounded-[16px] border-[1.5px] ${AV_RING[driver.status] ?? 'border-gray-500/30'}
            animate-[ringPulse_3s_ease-in-out_infinite]`} aria-hidden="true" />
          
          {driver.photo_url ? (
            <img 
              src={driver.photo_url} 
              alt={`${driver.full_name}-ის ფოტო`}
              className="relative z-[1] w-12 h-12 rounded-[13px] object-cover border border-white/10
                shadow-[0_4px_16px_rgba(0,0,0,.5),inset_0_0.5px_0_rgba(255,255,255,.12)]" 
            />
          ) : (
            <div className={`relative z-[1] w-12 h-12 rounded-[13px] flex items-center justify-center
              text-[19px] font-semibold text-white
              bg-gradient-to-br ${AV_BG[driver.status] ?? AV_BG.inactive}
              border border-white/10
              shadow-[0_4px_16px_rgba(0,0,0,.5),inset_0_0.5px_0_rgba(255,255,255,.12)]`}
              style={{ transform: 'translateZ(4px)' }}
              aria-hidden="true">
              {initials}
            </div>
          )}
          
          {/* status dot */}
          <span className={`absolute -bottom-[2px] -right-[2px] w-[13px] h-[13px] rounded-full
            border-2 border-[#080812] z-[3] ${cfg.dot}`} aria-hidden="true" />
        </div>

        {/* name + phone */}
        <div className="flex-1 min-w-0 pt-[3px]">
          <p id={`${cardId}-name`} className="text-[13px] font-semibold text-slate-100 truncate mb-[2px]
            drop-shadow-[0_1px_8px_rgba(0,0,0,.5)]">
            {driver.full_name}
          </p>
          <p className="text-[10px] text-[#2d3650] font-mono flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.07 9.72 19.79 19.79 0 0 1 1 1.09 2 2 0 0 1 3 .91h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            <a href={`tel:${driver.phone}`} className="hover:text-indigo-400 transition" onClick={e => e.stopPropagation()}>
              {driver.phone}
            </a>
          </p>
        </div>

        {/* status + employment type */}
        <div className="flex flex-col items-end gap-[5px] flex-shrink-0">
          <span className={`inline-flex items-center gap-1 text-[9px] font-semibold
            px-[9px] py-[3px] rounded-full border tracking-wide
            shadow-[0_2px_8px_rgba(0,0,0,.3)] backdrop-blur-sm ${cfg.pill}`}
            role="status"
            aria-label={`სტატუსი: ${cfg.label}`}>
            <span className={`w-[4px] h-[4px] rounded-full inline-block ${cfg.dot}`} aria-hidden="true" />
            {cfg.label}
          </span>
          <span className="text-[9px] px-[7px] py-[2px] rounded-[5px]
            border border-white/[0.06] bg-white/[0.03] text-[#2d3650]"
            aria-label={`დასაქმების ტიპი: ${driver.employment_type === 'internal' ? 'შტატი' : 'კონტრაქტორი'}`}>
            {driver.employment_type === 'internal' ? '🏢 შტატი' : '🤝 კონტრ.'}
          </span>
        </div>
      </div>

      {/* ── INFO GRID ── */}
      <div className="relative z-[3] grid grid-cols-2 border-t border-white/[0.04]">
        {[
          {
            icon: (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
            ),
            label: 'მანქანა',
            value: driver.assigned_vehicle
              ? `${driver.assigned_vehicle.plate_number} · ${driver.assigned_vehicle.model}`
              : null,
            mono: false,
          },
          {
            icon: (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
            ),
            label: 'მდებარეობა',
            value: driver.current_location ?? null,
            mono: false,
          },
          {
            icon: (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            ),
            label: 'ლიცენზია',
            value: driver.license_number,
            mono: true,
          },
          {
            icon: (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            ),
            label: 'გამოცდ.',
            value: driver.total_experience_years ? `${driver.total_experience_years} წელი` : null,
            mono: false,
            green: true,
          },
        ].map((item, idx) => (
          <div key={idx}
            className={`flex flex-col gap-[2px] py-[9px] transition-colors duration-200
              hover:bg-white/[0.02] focus-within:bg-white/[0.03]
              ${idx % 2 === 0 ? 'pl-[17px] pr-3 border-r border-white/[0.04]' : 'pl-3 pr-3'}
              ${idx < 2 ? 'border-b border-white/[0.04]' : ''}`}>
            <span className="text-[9px] text-[#2d3650] uppercase tracking-[.05em] flex items-center gap-[3px]">
              {item.icon}{item.label}
            </span>
            <span className={`text-[11px] font-medium flex items-center gap-1
              ${item.mono ? 'font-mono text-[10px]' : ''}
              ${item.green ? 'text-emerald-400' : item.value ? 'text-slate-400' : 'text-[#2d3650]'}`}>
              {item.value ?? '—'}
            </span>
          </div>
        ))}
      </div>

      {/* ── BADGES ── */}
      {(driver.has_adr || langs || driver.telegram_chat_id) && (
        <div className="relative z-[3] flex flex-wrap gap-[5px] px-[17px] py-[9px] border-t border-white/[0.04]" role="list" aria-label="დამატებითი ინფორმაცია">
          {driver.has_adr && (
            <span className="text-[9px] font-medium px-2 py-[3px] rounded-[6px]
              bg-rose-500/[0.07] text-rose-400 border border-rose-500/[0.18]
              transition-transform duration-150 hover:-translate-y-[1px]"
              role="listitem"
              aria-label="ADR სერტიფიკატი აქვს">
              ⚠️ ADR
            </span>
          )}
          {langs && (
            <span className="text-[9px] font-medium px-2 py-[3px] rounded-[6px]
              bg-sky-500/[0.06] text-sky-400 border border-sky-500/[0.15]
              transition-transform duration-150 hover:-translate-y-[1px]"
              role="listitem"
              aria-label={`ენები: ${langs}`}>
              🗣️ {langs}
            </span>
          )}
          {driver.telegram_chat_id && (
            <span className="text-[9px] font-medium px-2 py-[3px] rounded-[6px]
              bg-teal-500/[0.06] text-teal-400 border border-teal-500/[0.15]
              transition-transform duration-150 hover:-translate-y-[1px]"
              role="listitem"
              aria-label="Telegram კონტაქტი">
              📱 TG
            </span>
          )}
        </div>
      )}

      {/* ── EXPAND BUTTON ── */}
      <button
        onClick={() => setExpanded(v => !v)}
        onKeyDown={handleExpandKey}
        aria-expanded={expanded}
        aria-controls={`${cardId}-details`}
        className="relative z-[3] mx-[17px] mb-[10px] overflow-hidden
          px-3 py-[8px] rounded-[10px]
          bg-indigo-500/[0.05] border border-indigo-500/[0.1]
          text-[#3d3f6b] text-[10px] cursor-pointer
          flex items-center justify-center gap-[5px]
          transition-all duration-200
          hover:bg-indigo-500/10 hover:border-indigo-500/25 hover:text-indigo-400
          hover:-translate-y-[1px] hover:shadow-[0_4px_16px_rgba(99,102,241,.15)]
          focus:outline-none focus:ring-2 focus:ring-indigo-500/50
          group"
        style={{ fontFamily: 'inherit' }}
      >
        <span className="absolute inset-0 bg-indigo-400/[0.04] -translate-x-full
          group-hover:translate-x-full transition-transform duration-500" aria-hidden="true" />
        <svg className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
        <span className="sr-only">{expanded ? 'დახურვა' : 'სრული ინფორმაცია'}</span>
        <span aria-hidden="true">{expanded ? 'დახურვა' : 'სრული ინფორმაცია'}</span>
      </button>

      {/* ── DETAIL PANEL ── */}
      {expanded && (
        <div id={`${cardId}-details`} className="relative z-[3] mx-[17px] mb-[10px]
          animate-[slideDown_.22s_cubic-bezier(.23,1,.32,1)]" role="region" aria-label="დამატებითი დეტალები">
          <div className="grid grid-cols-2 gap-[6px]">
            {[
              { label: 'ლიც. ვადა',    value: driver.license_expiry, cls: licExpiryClass(driver.license_expiry) },
              { label: 'მისამართი',     value: driver.address },
              { label: 'Telegram',      value: driver.telegram_username, cls: 'text-teal-400' },
              { label: 'საავარიო კონტ.',value: driver.emergency_contact },
            ].filter(item => item.value).map((item, i) => (
              <div key={i}
                className="bg-white/[0.02] border border-white/[0.04] rounded-[9px] px-[10px] py-[9px]
                  transition-all duration-200 hover:bg-white/[0.03] hover:border-white/[0.07] hover:-translate-y-[1px]">
                <div className="text-[8px] text-[#2d3650] uppercase tracking-[.06em] mb-[3px]">{item.label}</div>
                <div className={`text-[10px] font-medium font-mono ${item.cls ?? 'text-slate-500'}`}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ACTIONS ── */}
      <div className="relative z-[3] flex gap-[5px] px-[17px] pb-[12px] pt-[10px]
        border-t border-white/[0.04] bg-black/[0.15]" role="group" aria-label="მოქმედებები">
        {onPrint && (
          <button onClick={e => { e.stopPropagation(); onPrint() }}
            className="flex-1 h-8 rounded-[9px] border border-white/[0.06] bg-white/[0.02]
              text-[#2d3650] text-[11px] flex items-center justify-center gap-1
              transition-all duration-150 relative overflow-hidden
              hover:border-emerald-500/30 hover:text-emerald-400 hover:shadow-[0_0_12px_rgba(16,185,129,.12)]
              active:scale-[.97] focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            style={{ fontFamily: 'inherit' }}
            aria-label={`დაბეჭდვა: ${driver.full_name}`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
            </svg>
            <span aria-hidden="true">პრინტი</span>
          </button>
        )}
        <button onClick={e => { e.stopPropagation(); onEdit() }}
          className="flex-1 h-8 rounded-[9px] border border-white/[0.06] bg-white/[0.02]
            text-[#2d3650] text-[11px] flex items-center justify-center gap-1
            transition-all duration-150 relative overflow-hidden
            hover:border-indigo-500/30 hover:text-indigo-400 hover:shadow-[0_0_12px_rgba(99,102,241,.12)]
            active:scale-[.97] focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          style={{ fontFamily: 'inherit' }}
          aria-label={`რედაქტირება: ${driver.full_name}`}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          <span aria-hidden="true">რედაქტ.</span>
        </button>
        <button onClick={e => { e.stopPropagation(); onDelete() }}
          className="w-8 h-8 rounded-[9px] border border-white/[0.06] bg-white/[0.02]
            text-[#2d3650] text-[11px] flex items-center justify-center
            transition-all duration-150
            hover:border-rose-500/30 hover:text-rose-400 hover:shadow-[0_0_12px_rgba(244,63,94,.12)]
            active:scale-[.97] focus:outline-none focus:ring-2 focus:ring-rose-500/50"
          style={{ fontFamily: 'inherit' }}
          title="წაშლა"
          aria-label={`წაშლა: ${driver.full_name}`}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// FilterChip - with a11y & keyboard support
// ════════════════════════════════════════════════════════════
interface FilterChipProps {
  label: string
  count: number
  color: string
  active: boolean
  onClick: () => void
  id?: string
}

const FilterChip = ({ label, count, color, active, onClick, id }: FilterChipProps) => (
  <button
    id={id}
    role="tab"
    aria-selected={active}
    onClick={onClick}
    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
    className={`flex items-center gap-2 px-[13px] py-[10px] rounded-xl border text-left
      transition-all duration-200
      hover:-translate-y-[2px] hover:shadow-[0_8px_20px_rgba(0,0,0,.3)]
      focus:outline-none focus:ring-2 focus:ring-blue-500/50
      ${active
        ? 'bg-blue-600/10 border-blue-500/30 ring-1 ring-blue-500/20'
        : 'bg-gray-900 border-gray-800 hover:border-gray-700'
      }`}
    style={{ transformStyle: 'preserve-3d', fontFamily: 'inherit' }}
  >
    <div className="flex-1">
      <div className={`text-[20px] font-medium leading-none tabular-nums mb-[2px]
        ${active ? 'text-blue-400' : 'text-white'}`}>
        {count}
      </div>
      <div className={`text-[10px] mt-[2px] ${active ? 'text-blue-400/70' : 'text-gray-500'}`}>{label}</div>
    </div>
    <span className="w-2 h-2 rounded-full flex-shrink-0 ml-auto" style={{ background: color }} aria-hidden="true" />
  </button>
)

// ════════════════════════════════════════════════════════════
// DriversTab — მთავარი კომპონენტი
// ════════════════════════════════════════════════════════════
export default function DriversTab({
  drivers,
  loading,
  onEdit,
  onDelete,
  onAdd,
  onAssignVehicle,
  getStatusColor,
  onPrint,
}: DriversTabProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [filterAdr, setFilterAdr] = useState('')
  const [filterType, setFilterType] = useState('')

  const FILTER_DEFS = [
    { key: 'all', label: 'სულ მძღოლი', color: '#6b7280' },
    { key: 'available', label: 'ხელმისაწვდომი', color: '#34d399' },
    { key: 'on_route', label: 'რეისში', color: '#60a5fa' },
    { key: 'adr', label: 'ADR სერტ.', color: '#f87171' },
  ] as const

  const filteredDrivers = useMemo(() => {
    return drivers.filter(d => {
      if (searchTerm) {
        const t = searchTerm.toLowerCase()
        const haystack = [
          d.full_name, d.phone, d.license_number,
          d.current_location, d.telegram_username,
        ].join(' ').toLowerCase()
        if (!haystack.includes(t)) return false
      }
      if (activeFilter === 'available' && d.status !== 'available') return false
      if (activeFilter === 'on_route' && d.status !== 'on_route') return false
      if (activeFilter === 'adr' && !d.has_adr) return false
      if (filterAdr === 'true' && !d.has_adr) return false
      if (filterAdr === 'false' && d.has_adr) return false
      if (filterType && d.employment_type !== filterType) return false
      return true
    })
  }, [drivers, searchTerm, activeFilter, filterAdr, filterType])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3" role="status" aria-live="polite">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" aria-hidden="true" />
        <span className="text-sm text-gray-500">მძღოლების ჩატვირთვა...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4" style={{ perspective: '1200px' }}>

      {/* ── TOOLBAR ── */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center
        pb-4 border-b border-gray-800">
        <div className="relative w-full sm:w-72">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none"
            width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="search"
            placeholder="ძებნა სახელით, ტელეფონით, ლიცენზიით..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            aria-label="მძღოლების ძებნა"
            className="w-full pl-9 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-xl
              text-xs text-white outline-none focus:border-gray-600 transition placeholder-gray-600"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition text-xs"
              aria-label="ძებნის გასუფთავება">
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select value={filterAdr} onChange={e => setFilterAdr(e.target.value)}
            className="px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs text-gray-400 outline-none focus:border-gray-600 transition"
            aria-label="ADR ფილტრი">
            <option value="">ყველა</option>
            <option value="true">⚠️ ADR</option>
            <option value="false">ADR გარეშე</option>
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs text-gray-400 outline-none focus:border-gray-600 transition"
            aria-label="დასაქმების ტიპი">
            <option value="">ყველა ტიპი</option>
            <option value="internal">🏢 შტატი</option>
            <option value="contractor">🤝 კონტრ.</option>
          </select>
          <button onClick={onAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500
              active:bg-blue-700 text-white rounded-xl text-xs font-semibold
              transition shadow-lg shadow-blue-500/20 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500/50">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            ახალი მძღოლი
          </button>
        </div>
      </div>

      {/* ── FILTER CHIPS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" role="tablist" aria-label="მძღოლების ფილტრები">
        {FILTER_DEFS.map(f => (
          <FilterChip
            key={f.key}
            id={`filter-${f.key}`}
            label={f.label}
            color={f.color}
            active={activeFilter === f.key}
            count={
              f.key === 'all' ? drivers.length :
              f.key === 'adr' ? drivers.filter(d => d.has_adr).length :
              drivers.filter(d => d.status === f.key).length
            }
            onClick={() => setActiveFilter(f.key)}
          />
        ))}
      </div>

      {/* ── CARDS ── */}
      {filteredDrivers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-600" role="status" aria-live="polite">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-30" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <p className="text-sm font-medium text-gray-500">მძღოლები ვერ მოიძებნა</p>
          <p className="text-xs text-gray-600">
            {searchTerm ? 'სცადე სხვა საძიებო სიტყვა' : 'ფილტრი გაასუფთავე ან დაამატე ახალი'}
          </p>
          <button onClick={onAdd}
            className="mt-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-500/50">
            + ახალი მძღოლი
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredDrivers.map(driver => (
            <DriverCard
              key={driver.id}
              driver={driver}
              onEdit={() => onEdit(driver)}
              onDelete={() => onDelete(driver)}
              onPrint={onPrint ? () => onPrint(driver) : undefined}
            />
          ))}
        </div>
      )}

      {/* Global keyframes - using styled-jsx for Next.js compatibility */}
      <style jsx global>{`
        @keyframes ringPulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(1.02); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}