// src/app/dashboard/components/tabs/OrdersTab.tsx
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import LoadingTruck from '@/app/dashboard/components/ui/LoadingTruck'
import AddOrderModal from '../modals/AddOrderModal'
import OrderPreviewModal from '../modals/OrderPreviewModal'
import SendNotificationModal from '../modals/SendNotificationModal'
import CreateInvoiceModal from '../modals/CreateInvoiceModal'
import { DEFAULT_ORDER_COLUMNS, type OrderColumnConfig } from './SettingsTab'

interface OrdersTabProps {
  orders: any[]
  loading: boolean
  orderFilter: string
  setOrderFilter: (filter: string) => void
  onStatusChange: (orderId: string, newStatus: string) => void
  onEdit: (order: any) => void
  onDelete: (order: any) => void
  onAdd: () => void
  onCreateInvoice: (order: any) => void
  getStatusColor: (status: string) => string
  ActionButtons: React.ComponentType<{ onEdit: () => void; onDelete: () => void }>
  loadData?: () => void
}

// ════════════════════════════════════════════════════════════
// 🍞 TOAST NOTIFICATION SYSTEM
// ════════════════════════════════════════════════════════════
type ToastType = 'success' | 'error' | 'info' | 'warning'
interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

const ToastContainer = ({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) => (
  <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
    {toasts.map(toast => {
      const colors = {
        success: 'bg-emerald-500/90 border-emerald-400',
        error: 'bg-rose-500/90 border-rose-400',
        info: 'bg-blue-500/90 border-blue-400',
        warning: 'bg-amber-500/90 border-amber-400',
      }
      const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' }
      return (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-xl border backdrop-blur-md text-white text-xs font-medium shadow-2xl ${colors[toast.type]}`}
        >
          <span className="text-base">{icons[toast.type]}</span>
          <span className="max-w-xs">{toast.message}</span>
          <button onClick={() => onRemove(toast.id)} className="ml-2 hover:opacity-70">✕</button>
        </div>
      )
    })}
  </div>
)

const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((type: ToastType, message: string, duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts(prev => [...prev, { id, type, message, duration }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return {
    toasts,
    removeToast,
    success: (msg: string, dur?: number) => addToast('success', msg, dur),
    error: (msg: string, dur?: number) => addToast('error', msg, dur),
    info: (msg: string, dur?: number) => addToast('info', msg, dur),
    warning: (msg: string, dur?: number) => addToast('warning', msg, dur),
  }
}

// ════════════════════════════════════════════════════════════
// 📊 STATS CARD COMPONENT
// ════════════════════════════════════════════════════════════
const StatsCard = ({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) => {
  const colorClasses: Record<string, string> = {
    violet: 'from-violet-500/20 to-violet-600/5 border-violet-500/30',
    amber: 'from-amber-500/20 to-amber-600/5 border-amber-500/30',
    emerald: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/30',
    blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/30',
    rose: 'from-rose-500/20 to-rose-600/5 border-rose-500/30',
    cyan: 'from-cyan-500/20 to-cyan-600/5 border-cyan-500/30',
  }
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-3 transition-all hover:scale-[1.02]`}>
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">{label}</span>
          <span className="text-xl font-bold text-white tabular-nums">{value}</span>
        </div>
        <div className="text-2xl opacity-60">{icon}</div>
      </div>
    </div>
  )
}

// ============================================================================
// 🔔 HELPER: ნოტიფიკაციის ჩაწერა
// ============================================================================
const createNotification = async (data: any) => {
  try {
    await supabase.from('notifications').insert({
      order_id: data.order_id || null,
      driver_id: data.driver_id || null,
      external_driver_id: data.external_driver_id || null,
      title: data.title,
      message: data.message,
      type: data.type || 'general',
      read: false,
      channel: data.channel || 'system',
      status: data.status || 'sent',
      metadata: data.metadata || null,
      sent_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    })
  } catch (e: any) {
    console.warn('⚠️ Notification create failed:', e.message)
  }
}

// ════════════════════════════════════════════════════════════
// 🎨 STATUS CONFIG
// ════════════════════════════════════════════════════════════
const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending:    { label: 'ლოდინში',  color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  confirmed:  { label: 'დადასტურებული', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  rejected:   { label: 'უარყოფილი',   color: 'text-rose-400',  bg: 'bg-rose-500/10',  border: 'border-rose-500/20' },
  in_transit: { label: 'გზაში',   color: 'text-blue-400',  bg: 'bg-blue-500/10',  border: 'border-blue-500/20' },
  delivered:  { label: 'მიტანა',  color: 'text-violet-400',bg: 'bg-violet-500/10',border: 'border-violet-500/20' },
  cancelled:  { label: 'გაუქმებული',  color: 'text-gray-400',  bg: 'bg-gray-500/10',  border: 'border-gray-500/20' },
}
const getSt = (s: string) => STATUS_CFG[s] ?? STATUS_CFG.pending

const FILTER_TABS = [
  { key: 'all', label: 'ყველა' },
  { key: 'pending', label: 'ლოდინში' },
  { key: 'confirmed', label: 'დადასტურებული' },
  { key: 'in_transit', label: 'გზაში' },
  { key: 'delivered', label: 'მიტანა' },
  { key: 'rejected', label: 'უარყოფილი' },
  { key: 'cancelled', label: 'გაუქმებული' },
]

const DriverResponseBadge = ({ order }: { order: any }) => {
  if (!order.driver_id && !order.external_driver_id) return <span className="text-gray-600 text-xs">—</span>
  if (order.delivered_at) return <span className="text-emerald-400 text-xs font-medium">🏁 მიწოდდა</span>
  if (order.arrived_at) return <span className="text-blue-400 text-xs font-medium">📍 ადგილზეა</span>
  if (order.border_crossing_at) return <span className="text-indigo-400 text-xs font-medium">🌍 საზღვარზეა</span>
  if (order.in_transit_at) return <span className="text-cyan-400 text-xs font-medium">🛣️ ტრანზიტი</span>
  if (order.loaded_at) return <span className="text-sky-400 text-xs font-medium">📦 ჩატვირთ.</span>
  if (order.en_route_at) return <span className="text-cyan-400 text-xs font-medium">🚗 გზაშია</span>
  if (order.instructions_sent_at && order.driver_response === 'accepted') return <span className="text-amber-400 text-xs font-medium animate-pulse">🟡 ელოდება</span>
  if (order.driver_response === 'accepted') return <span className="text-emerald-400 text-xs font-medium">✅ დაადასტ.</span>
  if (order.driver_response === 'rejected') return <span className="text-rose-400 text-xs font-medium">❌ უარყო</span>
  return <span className="text-amber-400 text-xs font-medium animate-pulse">⏳ მოლოდინში</span>
}

const RefreshIcon = ({ spinning }: { spinning?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={spinning ? 'animate-spin' : ''}>
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 21h5v-5" />
  </svg>
)

const ReminderIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
)

const InvoiceIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
)

const RouteCell = ({ from, to }: { from: string; to: string }) => (
  <div className="flex flex-col gap-0.5 w-full">
    <div className="flex items-center gap-1">
      <div className="w-1 h-1 rounded-full bg-blue-400 flex-shrink-0" />
      <span className="text-xs text-gray-300 truncate">{from || '—'}</span>
    </div>
    <div className="flex items-center gap-1">
      <div className="w-1 h-1 rounded-full bg-emerald-400 flex-shrink-0" />
      <span className="text-xs text-gray-300 truncate">{to || '—'}</span>
    </div>
  </div>
)

const ActionIconButton = ({ onClick, icon, title, colorClass }: { onClick: () => void; icon: React.ReactNode; title: string; colorClass: string }) => (
  <button
    onClick={(e) => { e.stopPropagation(); onClick() }}
    title={title}
    className={`p-1 rounded transition-all duration-200 hover:scale-110 active:scale-95 ${colorClass}`}
  >
    {icon}
  </button>
)

const ActionIconsGrid = ({ onEdit, onPreview, onNotify, onInvoice, onInstructions, onEnRoute, onReminder, onDelete, showInstructions, showEnRoute, showReminder }: any) => {
  const row1 = [
    { onClick: onEdit, icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>, title: "რედაქტირება", color: "text-blue-400 hover:bg-blue-500/10 hover:text-blue-300" },
    { onClick: onPreview, icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>, title: "Preview", color: "text-violet-400 hover:bg-violet-500/10 hover:text-violet-300" },
    { onClick: onNotify, icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 2 11 13"/><path d="M22 2 15 22 11 13 2 9l20-7z"/></svg>, title: "შეტყობინება", color: "text-teal-400 hover:bg-teal-500/10 hover:text-teal-300" },
    { onClick: onInvoice, icon: <InvoiceIcon />, title: "ინვოისი", color: "text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300" },
  ]
  const row2 = [
    ...(showInstructions ? [{ onClick: onInstructions, icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>, title: "ინსტრუქცია", color: "text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300" }] : []),
    ...(showEnRoute ? [{ onClick: onEnRoute, icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>, title: "შეხსენება", color: "text-amber-400 hover:bg-amber-500/10 hover:text-amber-300" }] : []),
    ...(showReminder ? [{ onClick: onReminder, icon: <ReminderIcon />, title: "შეხსენება", color: "text-amber-400 hover:bg-amber-500/10 hover:text-amber-300" }] : []),
    { onClick: onDelete, icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>, title: "წაშლა", color: "text-rose-400 hover:bg-rose-500/10 hover:text-rose-300" },
  ]
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-center gap-0.5">
        {row1.map((btn, idx) => <ActionIconButton key={idx} onClick={btn.onClick} icon={btn.icon} title={btn.title} colorClass={btn.color} />)}
      </div>
      {row2.length > 0 && (
        <div className="flex items-center justify-center gap-0.5">
          {row2.map((btn, idx) => <ActionIconButton key={idx} onClick={btn.onClick} icon={btn.icon} title={btn.title} colorClass={btn.color} />)}
        </div>
      )}
    </div>
  )
}

const SmartCell = ({ children, align = 'center', className = '' }: { children: React.ReactNode; align?: 'left' | 'center' | 'right'; className?: string }) => {
  const alignClass = align === 'right' ? 'justify-end' : align === 'left' ? 'justify-start' : 'justify-center'
  return <div className={`flex items-center ${alignClass} overflow-hidden min-w-0 ${className}`}>{children}</div>
}

const TruncatedText = ({ text, maxLength = 20, className = '' }: { text: string; maxLength?: number; className?: string }) => {
  const isTruncated = text && text.length > maxLength
  const displayText = isTruncated ? `${text.slice(0, maxLength)}...` : text
  if (isTruncated) {
    return (
      <div className="group relative inline-block max-w-full">
        <span className={`truncate block cursor-help ${className}`}>{displayText}</span>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-gray-700">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      </div>
    )
  }
  return <span className={`truncate block ${className}`}>{displayText || '—'}</span>
}

const SortableHeader = ({ label, sortKey, currentSort, onSort, align = 'center' }: any) => {
  const isActive = currentSort.key === sortKey
  const alignClass = align === 'left' ? 'justify-start' : align === 'right' ? 'justify-end' : 'justify-center'
  return (
    <div className={`flex items-center ${alignClass}`}>
      <button onClick={() => onSort(sortKey)} className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-wider transition-colors ${isActive ? 'text-violet-400' : 'text-gray-400 hover:text-gray-200'}`}>
        {label}
        {isActive && <span className="text-[10px]">{currentSort.direction === 'asc' ? '↑' : '↓'}</span>}
      </button>
    </div>
  )
}

// ============================================================================
// 📋 INITIAL ORDER FORM & HELPERS
// ============================================================================
const getInitialOrderForm = () => ({
  pickup_address: '', pickup_date: '', pickup_time: '', pickup_contact: '', pickup_phone: '',
  delivery_address: '', delivery_date: '', delivery_time: '', delivery_contact: '', delivery_phone: '',
  cargo_description: '', cargo_type: 'standard', cargo_weight_kg: '', cargo_volume_m3: '',
  cargo_units: '', cargo_length_m: '', cargo_width_m: '', cargo_height_m: '',
  packaging_type: 'box', returnable_packaging: false,
  price: '', currency: 'GEL', payment_terms: 'on_delivery', invoice_needed: false,
  road_fee: '', outside_city_fee: '', waiting_fee_per_hour: '', extra_fees: '',
  client_type: 'private', client_id: '', client_name: '', client_phone: '', client_email: '',
  client_personal_id: '', client_registration_number: '', client_vat: '', client_address: '',
  internal_notes: '', special_requirements: '',
  needs_tail_lift: false, needs_straps: false, needs_bricklaying: false, needs_two_cargo_handlers: false,
  attachment: null,
  priority: 'medium', status: 'pending', notify_client: true,
  tracking_code: '', created_at: new Date().toISOString(),
  driver_type: 'internal', vehicle_type: 'internal',
  driver_id: '', external_driver_id: '', vehicle_id: '', external_vehicle_id: '',
  external_driver_rate: '0', external_vehicle_rate: '0',
  transport_type: '', container_number: '',
})

const generateTrackingCode = () => {
  const rand1 = Math.floor(100000 + Math.random() * 900000)
  const rand2 = Math.floor(100 + Math.random() * 900)
  return `LOG-${rand1}-${rand2}`
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'ლოდინში', confirmed: 'დადასტურებული', rejected: 'უარყოფილი',
  in_transit: 'გზაში', delivered: 'მიწოდებული', cancelled: 'გაუქმებული'
}

// ============================================================================
// 🧩 MAIN COMPONENT
// ============================================================================
export default function OrdersTab({ 
  orders, loading, orderFilter, setOrderFilter, onStatusChange, onEdit, onDelete,
  onAdd, onCreateInvoice, getStatusColor, ActionButtons, loadData
}: OrdersTabProps) {
  
  const toast = useToast()
  
  // ════════════════════════════════════════════════════════════
  // 📌 ALL useState HOOKS
  // ════════════════════════════════════════════════════════════
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingOrder, setEditingOrder] = useState<any | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewOrder, setPreviewOrder] = useState<any | null>(null)
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [notificationOrder, setNotificationOrder] = useState<any | null>(null)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<any>(null)
  const [showInstructionsModal, setShowInstructionsModal] = useState(false)
  const [instructionsOrder, setInstructionsOrder] = useState<any | null>(null)
  const [instructionsText, setInstructionsText] = useState('')
  const [sendingInstructions, setSendingInstructions] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [privateClients, setPrivateClients] = useState<any[]>([])
  const [companiesList, setCompaniesList] = useState<any[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [newOrderForm, setNewOrderForm] = useState<any>(getInitialOrderForm())
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'created_at', direction: 'desc' })
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  
  // 🆕 SETTINGS - სვეტების კონფიგურაცია
  const [visibleColumns, setVisibleColumns] = useState<OrderColumnConfig[]>(DEFAULT_ORDER_COLUMNS)

  // ════════════════════════════════════════════════════════════
  // 📌 ALL useMemo HOOKS
  // ════════════════════════════════════════════════════════════
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const mf = orderFilter === 'all' || o.status === orderFilter
      const q = search.toLowerCase()
      const ms = !q || [o.tracking_code, o.pickup_address, o.delivery_address, o.client_name, o.drivers?.full_name, o.cargo_description].join(' ').toLowerCase().includes(q)
      return mf && ms
    })
  }, [orders, orderFilter, search])

  const sortedOrders = useMemo(() => {
    const sorted = [...filteredOrders]
    sorted.sort((a, b) => {
      let aVal = a[sortConfig.key]
      let bVal = b[sortConfig.key]
      if (sortConfig.key === 'driver_name') {
        aVal = a.drivers?.full_name || a.external_drivers?.full_name || ''
        bVal = b.drivers?.full_name || b.external_drivers?.full_name || ''
      }
      if (sortConfig.key === 'plate_number') {
        aVal = a.vehicles?.plate_number || a.external_vehicles?.plate_number || ''
        bVal = b.vehicles?.plate_number || b.external_vehicles?.plate_number || ''
      }
      if (aVal === null || aVal === undefined) aVal = ''
      if (bVal === null || bVal === undefined) bVal = ''
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal
      }
      const comparison = String(aVal).localeCompare(String(bVal))
      return sortConfig.direction === 'asc' ? comparison : -comparison
    })
    return sorted
  }, [filteredOrders, sortConfig])

  const stats = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayOrders = orders.filter(o => new Date(o.created_at) >= today)
    const totalRevenue = orders.filter(o => o.status !== 'cancelled' && o.price).reduce((sum, o) => sum + parseFloat(o.price || 0), 0)
    const todayRevenue = todayOrders.filter(o => o.status !== 'cancelled' && o.price).reduce((sum, o) => sum + parseFloat(o.price || 0), 0)
    return {
      total: orders.length,
      todayCount: todayOrders.length,
      totalRevenue,
      todayRevenue,
      pendingCount: orders.filter(o => o.status === 'pending').length,
      inTransitCount: orders.filter(o => o.status === 'in_transit').length,
    }
  }, [orders])

  // ════════════════════════════════════════════════════════════
  // 📌 ALL useEffect HOOKS
  // ════════════════════════════════════════════════════════════
  const loadClients = useCallback(async () => {
    try {
      const [privateRes, companiesRes] = await Promise.all([
        supabase.from('private_clients').select('*').eq('is_active', true).order('full_name', { ascending: true }),
        supabase.from('companies').select('*').eq('is_active', true).order('name', { ascending: true })
      ])
      if (privateRes.data) setPrivateClients(privateRes.data)
      if (companiesRes.data) setCompaniesList(companiesRes.data)
    } catch (e: any) {
      console.error('❌ კლიენტების ჩატვირთვა ვერ მოხერხდა:', e)
    }
  }, [])

  useEffect(() => {
    loadClients()
  }, [loadClients])

  useEffect(() => {
    if (!loadData) return
    const channel = supabase
      .channel('orders_realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, () => {
        loadData()
        loadClients()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadData, loadClients])

  // 🆕 Settings-დან სვეტების კონფიგურაციის წაკითხვა
  useEffect(() => {
    const loadColumnSettings = async () => {
      try {
        const { data } = await supabase.from('settings').select('order_columns').single()
        if (data?.order_columns && data.order_columns.length > 0) {
          setVisibleColumns(data.order_columns)
        }
      } catch (err) {
        console.warn('Could not load column settings, using defaults')
      }
    }
    loadColumnSettings()
  }, [])

  // ════════════════════════════════════════════════════════════
  // 📌 ALL FUNCTIONS
  // ════════════════════════════════════════════════════════════
  const handleRefresh = async () => {
    if (!loadData || isRefreshing) return
    setIsRefreshing(true)
    try {
      await loadData()
      await loadClients()
      toast.success('მონაცემები განახლდა')
    } catch (err) {
      toast.error('განახლება ვერ მოხერხდა')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleAddClick = () => {
    setNewOrderForm(getInitialOrderForm())
    setShowAddModal(true)
  }

  const handleSort = (key: string) => {
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }))
  }

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev => {
      const next = new Set(prev)
      if (next.has(orderId)) next.delete(orderId)
      else next.add(orderId)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedOrders.size === sortedOrders.length) {
      setSelectedOrders(new Set())
    } else {
      setSelectedOrders(new Set(sortedOrders.map(o => o.id)))
    }
  }

  const countBy = (k: string) => k === 'all' ? orders.length : orders.filter(o => o.status === k).length

  const mapDatabaseToForm = (order: any) => {
    const splitDateTime = (timestamp: string | null) => {
      if (!timestamp) return { date: '', time: '' }
      try {
        if (timestamp.includes('T')) {
          const [date, timePart] = timestamp.split('T')
          const time = timePart.split('.')[0].split('+')[0].split('-').slice(0,2).join('-')
          return { date, time: time.substring(0, 5) }
        }
        if (timestamp.includes(' ')) {
          const [date, time] = timestamp.split(' ')
          return { date, time: time.substring(0, 5) }
        }
        return { date: timestamp, time: '' }
      } catch { return { date: '', time: '' } }
    }
    const pickup = splitDateTime(order.scheduled_pickup_date)
    const delivery = splitDateTime(order.scheduled_delivery_date)
    return {
      pickup_address: order.pickup_address || '', pickup_date: pickup.date, pickup_time: pickup.time,
      pickup_contact: order.pickup_contact_person || '', pickup_phone: order.pickup_phone || '',
      delivery_address: order.delivery_address || '', delivery_date: delivery.date, delivery_time: delivery.time,
      delivery_contact: order.delivery_contact_person || '', delivery_phone: order.delivery_phone || '',
      cargo_description: order.cargo_description || '', cargo_type: order.cargo_type || 'standard',
      cargo_weight_kg: order.cargo_weight_kg?.toString() || '', cargo_volume_m3: order.cargo_volume_m3?.toString() || '',
      cargo_units: order.places_count?.toString() || '',
      cargo_length_m: order.cargo_length_m?.toString() || '', cargo_width_m: order.cargo_width_m?.toString() || '',
      cargo_height_m: order.cargo_height_m?.toString() || '',
      packaging_type: order.packaging_type || 'box', returnable_packaging: !!order.returnable_packaging,
      price: order.price?.toString() || '', currency: order.currency || 'GEL',
      payment_terms: order.payment_terms || 'on_delivery', invoice_needed: !!order.invoice_needed,
      road_fee: order.road_fee?.toString() || '', outside_city_fee: order.outside_city_fee?.toString() || '',
      waiting_fee_per_hour: order.waiting_fee_per_hour?.toString() || '', extra_fees: order.extra_fees?.toString() || '',
      client_type: order.client_type || 'private', client_id: order.client_id || '',
      client_name: order.client_name || '', client_phone: order.client_phone || '',
      client_email: order.client_email || '', client_personal_id: order.client_personal_id || '',
      client_registration_number: order.client_registration_number || '', client_vat: order.client_vat || '',
      client_address: order.client_address || '',
      internal_notes: order.notes || order.internal_notes || '', special_requirements: order.special_requirements || '',
      needs_tail_lift: !!order.needs_tail_lift, needs_straps: !!order.needs_straps,
      needs_bricklaying: !!order.needs_bricklaying, needs_two_cargo_handlers: !!order.needs_two_cargo_handlers,
      attachment: null, priority: order.priority || 'medium', status: order.status || 'pending',
      notify_client: order.notify_client !== false, tracking_code: order.tracking_code || '',
      created_at: order.created_at || new Date().toISOString(),
      driver_type: order.driver_type || 'internal', vehicle_type: order.vehicle_type || 'internal',
      driver_id: order.driver_id || '', external_driver_id: order.external_driver_id || '',
      vehicle_id: order.vehicle_id || '', external_vehicle_id: order.external_vehicle_id || '',
      external_driver_rate: order.external_driver_rate?.toString() || '0',
      external_vehicle_rate: order.external_vehicle_rate?.toString() || '0',
      transport_type: order.transport_type || '', container_number: order.container_number || '',
    }
  }

  const mapFormToDatabase = (form: any) => {
    const combineDateTime = (date: string, time: string) => {
      if (!date) return null
      return time ? `${date}T${time}:00Z` : `${date}T00:00:00Z`
    }
    return {
      pickup_address: form.pickup_address || null, delivery_address: form.delivery_address || null,
      scheduled_pickup_date: combineDateTime(form.pickup_date, form.pickup_time),
      scheduled_delivery_date: combineDateTime(form.delivery_date, form.delivery_time),
      pickup_contact_person: form.pickup_contact || null, pickup_phone: form.pickup_phone || null,
      delivery_contact_person: form.delivery_contact || null, delivery_phone: form.delivery_phone || null,
      cargo_description: form.cargo_description || null, cargo_type: form.cargo_type || 'standard',
      cargo_weight_kg: parseFloat(form.cargo_weight_kg) || 0, cargo_volume_m3: parseFloat(form.cargo_volume_m3) || null,
      places_count: parseInt(form.cargo_units) || null,
      cargo_length_m: parseFloat(form.cargo_length_m) || null, cargo_width_m: parseFloat(form.cargo_width_m) || null,
      cargo_height_m: parseFloat(form.cargo_height_m) || null,
      packaging_type: form.packaging_type || 'box', returnable_packaging: !!form.returnable_packaging,
      price: parseFloat(form.price) || 0, currency: form.currency || 'GEL',
      payment_terms: form.payment_terms || 'on_delivery', invoice_needed: !!form.invoice_needed,
      road_fee: parseFloat(form.road_fee) || 0, outside_city_fee: parseFloat(form.outside_city_fee) || 0,
      waiting_fee_per_hour: parseFloat(form.waiting_fee_per_hour) || 0, extra_fees: parseFloat(form.extra_fees) || 0,
      client_type: form.client_type || 'private', client_name: form.client_name || null,
      client_phone: form.client_phone || null, client_email: form.client_email || null,
      client_personal_id: form.client_personal_id || null, client_registration_number: form.client_registration_number || null,
      client_vat: form.client_vat || null, client_address: form.client_address || null,
      client_id: form.client_id || null,
      notes: form.internal_notes || null, special_requirements: form.special_requirements || null,
      needs_tail_lift: !!form.needs_tail_lift, needs_straps: !!form.needs_straps,
      needs_bricklaying: !!form.needs_bricklaying, needs_two_cargo_handlers: !!form.needs_two_cargo_handlers,
      priority: form.priority || 'medium', status: form.status || 'pending', notify_client: !!form.notify_client,
      driver_type: form.driver_type || 'internal', vehicle_type: form.vehicle_type || 'internal',
      driver_id: form.driver_type === 'internal' ? (form.driver_id || null) : null,
      external_driver_id: form.driver_type === 'external' ? (form.external_driver_id || null) : null,
      vehicle_id: form.vehicle_type === 'internal' ? (form.vehicle_id || null) : null,
      external_vehicle_id: form.vehicle_type === 'external' ? (form.external_vehicle_id || null) : null,
      external_driver_rate: parseFloat(form.external_driver_rate) || 0,
      external_vehicle_rate: parseFloat(form.external_vehicle_rate) || 0,
      transport_type: form.transport_type || null, container_number: form.container_number || null,
      tracking_code: form.tracking_code || generateTrackingCode(),
      created_at: form.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }

  const handleAddSubmit = async () => {
    try {
      const payload = mapFormToDatabase(newOrderForm)
      const { data, error } = await supabase.from('orders').insert([payload]).select().single()
      if (error) throw error
      await createNotification({ order_id: data.id, title: '📦 ახალი შეკვეთა შეიქმნა', message: `შეიქმნა შეკვეთა #${data.tracking_code}`, type: 'order' })
      setShowAddModal(false)
      setNewOrderForm(getInitialOrderForm())
      if (loadData) loadData()
      await loadClients()
      toast.success(`შეკვეთა შეიქმნა! კოდი: ${data.tracking_code}`)
    } catch (e: any) {
      toast.error(`შეცდომა: ${e.message}`)
    }
  }

  const handleEditClick = (order: any) => {
    setEditingOrder(mapDatabaseToForm(order))
    setShowEditModal(true)
  }

  // ✅ გამოსწორებული - tracking_code აღარ არის ორჯერ
  const handleEditSave = (updatedData: any) => {
    const payload = mapFormToDatabase(updatedData)
    onEdit({ id: editingOrder?.id, ...payload })
    setShowEditModal(false)
    setEditingOrder(null)
  }

  const handleDeleteClick = async (order: any) => {
    if (!confirm(`წაიშალოს შეკვეთა ${order.tracking_code}?`)) return
    try {
      await supabase.from('invoices').delete().eq('order_id', order.id)
      onDelete(order)
      await createNotification({ title: '🗑️ შეკვეთა წაიშალა', message: `წაიშალა შეკვეთა #${order.tracking_code}`, type: 'alert' })
      toast.success(`შეკვეთა ${order.tracking_code} წაიშალა`)
    } catch (e: any) {
      toast.error(`შეცდომა: ${e.message}`)
    }
  }

  const handlePreviewClick = (order: any) => { setPreviewOrder(order); setShowPreviewModal(true) }
  const handleOpenNotification = (order: any) => { setNotificationOrder(order); setShowNotificationModal(true) }
  const handleInvoiceClick = (order: any) => { setSelectedOrderForInvoice(order); setShowInvoiceModal(true) }

  const handleStatusChange = async (order: any, newStatus: string) => {
    const oldStatus = order.status
    onStatusChange(order.id, newStatus)
    if (oldStatus !== newStatus) {
      await createNotification({ order_id: order.id, title: `🔄 სტატუსი შეიცვალა: #${order.tracking_code}`, message: `${STATUS_LABELS[oldStatus]} → ${STATUS_LABELS[newStatus]}`, type: 'order' })
    }
  }

  const sendReminder = async (order: any) => {
    if (!confirm(`გავუგზავნოთ შეხსენება მძღოლს შეკვეთისთვის #${order.tracking_code}?`)) return
    const driverId = order.driver_type === 'external' ? order.external_driver_id : order.driver_id
    if (!driverId) { toast.warning('მძღოლი არ არის მინიჭებული'); return }
    try {
      const { data: driver } = await supabase.from('drivers').select('id, telegram_chat_id, full_name').eq('id', driverId).single()
      if (!driver?.telegram_chat_id) { toast.warning('მძღოლს არ აქვს Telegram Chat ID'); return }
      const token = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN
      if (!token) throw new Error('Bot token missing')
      const message = `⏰ <b>შეხსენება!</b>\n\nშეკვეთა #${order.tracking_code} ჯერ კიდევ ლოდინშია.\n📍 მარშრუტი: ${order.pickup_address} → ${order.delivery_address}`
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: driver.telegram_chat_id, text: message, parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '✅ მივიღე', callback_data: `acc:${order.id}` }], [{ text: '❌ უარვყავი', callback_data: `rej:${order.id}` }]] } })
      })
      await createNotification({ order_id: order.id, driver_id: order.driver_type === 'internal' ? driver.id : null, external_driver_id: order.driver_type === 'external' ? driver.id : null, title: '⏰ შეხსენება გაგზავნილია', message: `მძღოლს ${driver.full_name} გაეგზავნა შეხსენება`, type: 'driver', channel: 'telegram' })
      toast.success('შეხსენება გაიგზავნა!')
    } catch (err: any) { toast.error(`შეცდომა: ${err.message}`) }
  }

  const sendEnRouteReminder = async (order: any) => {
    if (!confirm(`გავუგზავნოთ შეხსენება მძღოლს?`)) return
    const driverId = order.driver_type === 'external' ? order.external_driver_id : order.driver_id
    if (!driverId) { toast.warning('მძღოლი არ არის მინიჭებული'); return }
    try {
      const { data: driver } = await supabase.from('drivers').select('id, telegram_chat_id, full_name').eq('id', driverId).single()
      if (!driver?.telegram_chat_id) { toast.warning('მძღოლს არ აქვს Telegram Chat ID'); return }
      const token = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN
      if (!token) throw new Error('Bot token missing')
      const reminderMessage = `🔔 <b>შეხსენება!</b>\n\nშეკვეთა #${order.tracking_code}\n📍 ${order.pickup_address}`
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: driver.telegram_chat_id, text: reminderMessage, parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '🚗 მივდივარ ატვირთვაზე', callback_data: `en_route:${order.id}` }]] } })
      })
      await createNotification({ order_id: order.id, driver_id: order.driver_type === 'internal' ? driver.id : null, external_driver_id: order.driver_type === 'external' ? driver.id : null, title: '🔔 გზის შეხსენება გაგზავნილია', message: `მძღოლს ${driver.full_name} გაეგზავნა შეხსენება`, type: 'driver', channel: 'telegram' })
      toast.success('შეხსენება გაიგზავნა!')
    } catch (err: any) { toast.error(`შეცდომა: ${err.message}`) }
  }

  const handleOpenInstructions = (order: any) => {
    setInstructionsOrder(order); setInstructionsText(''); setShowInstructionsModal(true)
  }

  const handleSendInstructions = async () => {
    if (!instructionsOrder || !instructionsText.trim()) { toast.warning('გთხოვთ, შეიყვანოთ ინსტრუქცია'); return }
    setSendingInstructions(true)
    try {
      const order = instructionsOrder
      const driverId = order.driver_type === 'external' ? order.external_driver_id : order.driver_id
      if (!driverId) throw new Error('მძღოლი არ არის მინიჭებული')
      const { data: driver } = await supabase.from('drivers').select('id, telegram_chat_id, full_name').eq('id', driverId).single()
      if (!driver?.telegram_chat_id) throw new Error('მძღოლს არ აქვს Telegram Chat ID')
      const message = `📋 *დეტალური ინსტრუქცია #${order.tracking_code}*\n\n📍 ${order.pickup_address}\n\n${instructionsText}`
      const token = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN
      if (!token) throw new Error('Bot token missing')
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: driver.telegram_chat_id, text: message, parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: '🚗 მივდივარ ატვირთვაზე', callback_data: `en_route:${order.id}` }]] } })
      })
      const result = await res.json()
      if (!result.ok) throw new Error(result.description)
      await supabase.from('orders').update({ instructions_sent_at: new Date().toISOString(), instructions_content: instructionsText, instruction_message_id: result.result?.message_id?.toString() }).eq('id', order.id)
      await createNotification({ order_id: order.id, driver_id: order.driver_type === 'internal' ? driver.id : null, external_driver_id: order.driver_type === 'external' ? driver.id : null, title: '📋 ინსტრუქცია გაგზავნილია', message: `მძღოლს ${driver.full_name} გაეგზავნა ინსტრუქცია`, type: 'driver', channel: 'telegram' })
      toast.success('ინსტრუქცია გაიგზავნა!')
      setShowInstructionsModal(false); setInstructionsOrder(null); setInstructionsText('')
      if (loadData) loadData()
    } catch (err: any) { toast.error(`შეცდომა: ${err.message}`) }
    finally { setSendingInstructions(false) }
  }

  const handleSendNotification = async (channels: string[]) => {
    if (!notificationOrder) throw new Error('შეკვეთა არ არის არჩეული')
    const order = notificationOrder
    const driverId = order.driver_type === 'external' ? order.external_driver_id : order.driver_id
    if (!driverId) throw new Error('მძღოლი არ არის მინიჭებული')
    const { data: driver } = await supabase.from('drivers').select('id, telegram_chat_id, full_name').eq('id', driverId).single()
    if (!driver?.telegram_chat_id) { toast.warning('მძღოლს არ აქვს Telegram Chat ID'); return { success: false } }
    const token = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN
    if (!token) throw new Error('Bot token missing')
    const message = `🚛 <b>ახალი შეკვეთა!</b>\n\n📦 <code>${order.tracking_code}</code>\n📍 ${order.pickup_address} → ${order.delivery_address}\n💰 ${order.price} ${order.currency}`
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: driver.telegram_chat_id, text: message, parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '✅ მივიღე', callback_data: `acc:${order.id}` }, { text: '❌ უარვყავი', callback_data: `rej:${order.id}` }]] } })
    })
    const result = await res.json()
    if (!result.ok) throw new Error(result.description)
    await createNotification({ order_id: order.id, driver_id: order.driver_type === 'internal' ? driver.id : null, external_driver_id: order.driver_type === 'external' ? driver.id : null, title: '🚛 ახალი შეკვეთა მინიჭებულია', message: `მძღოლს ${driver.full_name} დაენიშნა შეკვეთა`, type: 'order', channel: 'telegram' })
    toast.success('შეტყობინება გაიგზავნა!')
    return { success: true }
  }

  const handleBulkDelete = async () => {
    if (selectedOrders.size === 0) return
    if (!confirm(`წაიშალოს ${selectedOrders.size} შეკვეთა?`)) return
    try {
      const ids = Array.from(selectedOrders)
      await supabase.from('invoices').delete().in('order_id', ids)
      await supabase.from('orders').delete().in('id', ids)
      toast.success(`${selectedOrders.size} შეკვეთა წაიშალა`)
      setSelectedOrders(new Set())
      if (loadData) loadData()
    } catch (e: any) { toast.error(`შეცდომა: ${e.message}`) }
  }

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedOrders.size === 0) return
    try {
      const ids = Array.from(selectedOrders)
      await supabase.from('orders').update({ status: newStatus }).in('id', ids)
      toast.success(`${selectedOrders.size} შეკვეთის სტატუსი შეიცვალა`)
      setSelectedOrders(new Set())
      if (loadData) loadData()
    } catch (e: any) { toast.error(`შეცდომა: ${e.message}`) }
  }

  const exportToCSV = useCallback(() => {
    const dataToExport = selectedOrders.size > 0 ? sortedOrders.filter(o => selectedOrders.has(o.id)) : sortedOrders
    const headers = ['Tracking', 'მარშრუტი (აღება)', 'მარშრუტი (მიწოდება)', 'ტვირთი', 'მძღოლი', 'მანქანა', 'ფასი', 'ვალუტა', 'სტატუსი', 'თარიღი']
    const rows = dataToExport.map(o => [
      o.tracking_code, o.pickup_address || '', o.delivery_address || '', o.cargo_description || '',
      o.drivers?.full_name || o.external_drivers?.full_name || '',
      o.vehicles?.plate_number || o.external_vehicles?.plate_number || '',
      o.price || 0, o.currency || 'GEL', STATUS_LABELS[o.status] || o.status,
      o.created_at ? new Date(o.created_at).toLocaleString('ka-GE') : ''
    ])
    const csv = '\uFEFF' + [headers.join(','), ...rows.map(row => row.map(v => `"${v}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`ექსპორტირებულია ${dataToExport.length} შეკვეთა`)
  }, [sortedOrders, selectedOrders, toast])

  // ⌨️ KEYBOARD SHORTCUTS
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') { e.preventDefault(); handleAddClick() }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault(); document.getElementById('orders-search')?.focus() }
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') { e.preventDefault(); exportToCSV() }
      if (e.key === 'Delete' && selectedOrders.size > 0) { e.preventDefault(); handleBulkDelete() }
      if (e.key === 'Escape') { setSelectedOrders(new Set()) }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedOrders, exportToCSV])

  // 🆕 ფიქსირებული + დინამიური სვეტები
  const FIXED_LEFT_WIDTHS: Record<string, string> = {
    checkbox: '40px',
    tracking: '110px',
  }
  const FIXED_RIGHT_WIDTHS: Record<string, string> = {
    actions: '140px',
  }

  const getFixedLeftColumns = useCallback(() => 
    visibleColumns.filter(c => c.fixed === 'left' && c.visible), 
  [visibleColumns])

  const getFixedRightColumns = useCallback(() => 
    visibleColumns.filter(c => c.fixed === 'right' && c.visible), 
  [visibleColumns])

  const getMiddleColumns = useCallback(() => 
    visibleColumns.filter(c => !c.fixed && c.visible), 
  [visibleColumns])

  // 🆕 COL: ფიქსირებული მარცხნივ + 1fr შუაში + ფიქსირებული მარჯვნივ
  const COL = useMemo(() => {
    return [
      ...getFixedLeftColumns().map(c => FIXED_LEFT_WIDTHS[c.id] || '100px'),
      ...getMiddleColumns().map(() => '1fr'),
      ...getFixedRightColumns().map(c => FIXED_RIGHT_WIDTHS[c.id] || '100px'),
    ].join(' ')
  }, [getFixedLeftColumns, getMiddleColumns, getFixedRightColumns])

  // 🆕 რენდერის რიგი: მარცხენა → შუა → მარჯვენა
  const getOrderedColumns = useCallback(() => [
    ...getFixedLeftColumns(),
    ...getMiddleColumns(),
    ...getFixedRightColumns(),
  ], [getFixedLeftColumns, getMiddleColumns, getFixedRightColumns])

  // ════════════════════════════════════════════════════════════
  // 🚨 EARLY RETURN - ყველა hook-ის შემდეგ!
  // ════════════════════════════════════════════════════════════
  if (loading) return <LoadingTruck message="შეკვეთები იტვირთება..." size="md" />

  // ════════════════════════════════════════════════════════════
  // 🎨 RENDER
  // ════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col rounded-2xl overflow-hidden bg-gray-900/50 border border-gray-800">
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />

      {/* HEADER */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900/80 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">შეკვეთები</h2>
            <p className="text-xs text-gray-500">{filteredOrders.length} შეკვეთა</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input id="orders-search" type="text" placeholder="ძებნა... (Ctrl+F)" value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-8 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-200 placeholder-gray-600 outline-none focus:border-violet-500/50 w-48 transition-all" />
            {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs">✕</button>}
          </div>
          <button onClick={exportToCSV} title="ექსპორტი CSV (Ctrl+E)" className="p-2 rounded-lg border border-gray-700 bg-gray-800 text-gray-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
          <button onClick={handleRefresh} disabled={isRefreshing || !loadData} className="p-2 rounded-lg border border-gray-700 bg-gray-800 text-gray-400 hover:text-white hover:border-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            <RefreshIcon spinning={isRefreshing} />
          </button>
          <button onClick={handleAddClick} title="ახალი შეკვეთა (Ctrl+N)" className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-violet-500/25 transition-all hover:scale-105 active:scale-95">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            ახალი
          </button>
        </div>
      </div>

      {/* 📊 STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 px-6 py-4 border-b border-gray-800 bg-gray-900/30">
        <StatsCard label="სულ" value={stats.total} icon="📦" color="violet" />
        <StatsCard label="დღეს" value={stats.todayCount} icon="📅" color="blue" />
        <StatsCard label="შემოსავალი" value={`${stats.totalRevenue.toLocaleString()} ₾`} icon="💰" color="emerald" />
        <StatsCard label="დღეს" value={`${stats.todayRevenue.toLocaleString()} ₾`} icon="📈" color="cyan" />
        <StatsCard label="ლოდინში" value={stats.pendingCount} icon="⏳" color="amber" />
        <StatsCard label="გზაში" value={stats.inTransitCount} icon="🚚" color="rose" />
      </div>

      {/* FILTER TABS */}
      <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-800 bg-gray-900/40">
        {FILTER_TABS.map(f => (
          <button key={f.key} onClick={() => setOrderFilter(f.key)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${orderFilter === f.key ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25' : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'}`}>
            {f.label}
            <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${orderFilter === f.key ? 'bg-white/20' : 'bg-gray-700'}`}>{countBy(f.key)}</span>
          </button>
        ))}
      </div>

      {/* ☑️ BULK ACTIONS BAR */}
      {selectedOrders.size > 0 && (
        <div className="flex items-center justify-between px-6 py-2.5 bg-violet-500/10 border-b border-violet-500/20">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-violet-300">არჩეულია: {selectedOrders.size}</span>
            <button onClick={() => setSelectedOrders(new Set())} className="text-xs text-gray-400 hover:text-white transition-colors">გაუქმება (Esc)</button>
          </div>
          <div className="flex items-center gap-2">
            <select onChange={(e) => { if (e.target.value) { handleBulkStatusChange(e.target.value); e.target.value = '' } }}
              className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-200 outline-none" defaultValue="">
              <option value="" disabled>სტატუსის შეცვლა...</option>
              <option value="pending">⏳ ლოდინში</option>
              <option value="confirmed">✅ დადასტურებული</option>
              <option value="in_transit">🚚 გზაში</option>
              <option value="delivered">🎯 მიტანა</option>
              <option value="cancelled">🚫 გაუქმებული</option>
            </select>
            <button onClick={exportToCSV} className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs hover:bg-emerald-500/30 transition-all">📥 ექსპორტი</button>
            <button onClick={handleBulkDelete} className="px-3 py-1 bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-lg text-xs hover:bg-rose-500/30 transition-all">🗑️ წაშლა (Del)</button>
          </div>
        </div>
      )}

      {/* 🆕 TABLE HEADER - Fixed + Dynamic + Fixed */}
      <div className="grid px-4 py-3 border-b border-gray-800 bg-gray-800/50" style={{ gridTemplateColumns: COL }}>
        {getOrderedColumns().map(col => {
          switch (col.id) {
            case 'checkbox':
              return (
                <div key={col.id} className="flex items-center justify-center">
                  <input type="checkbox" checked={selectedOrders.size === sortedOrders.length && sortedOrders.length > 0} onChange={toggleSelectAll}
                    className="w-3.5 h-3.5 rounded border-gray-600 bg-gray-700 text-violet-500 focus:ring-violet-500 focus:ring-offset-0 cursor-pointer" />
                </div>
              )
            case 'tracking':
              return <SortableHeader key={col.id} label="Tracking" sortKey="tracking_code" currentSort={sortConfig} onSort={handleSort} align="left" />
            case 'route':
              return <SortableHeader key={col.id} label="მარშრუტი" sortKey="pickup_address" currentSort={sortConfig} onSort={handleSort} />
            case 'cargo':
              return <SortableHeader key={col.id} label="ტვირთი" sortKey="cargo_description" currentSort={sortConfig} onSort={handleSort} />
            case 'driver':
              return <SortableHeader key={col.id} label="მძღოლი" sortKey="driver_name" currentSort={sortConfig} onSort={handleSort} />
            case 'price':
              return <SortableHeader key={col.id} label="ფასი" sortKey="price" currentSort={sortConfig} onSort={handleSort} />
            case 'status':
              return <SortableHeader key={col.id} label="სტატუსი" sortKey="status" currentSort={sortConfig} onSort={handleSort} />
            case 'response':
              return <SortableHeader key={col.id} label="პასუხი" sortKey="driver_response" currentSort={sortConfig} onSort={handleSort} />
            case 'actions':
              return (
                <div key={col.id} className="flex items-center justify-center">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">მოქმედება</span>
                </div>
              )
            default:
              return null
          }
        })}
      </div>

      {/* 🆕 TABLE BODY - Fixed + Dynamic + Fixed */}
      <div className="divide-y divide-gray-800/50 max-h-[calc(100vh-500px)] overflow-y-auto">
        {sortedOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-600">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
            </div>
            <p className="text-sm text-gray-500">შეკვეთები ვერ მოიძებნა</p>
          </div>
        ) : (
          sortedOrders.map((o) => {
            const st = getSt(o.status)
            const min = Math.floor((Date.now() - new Date(o.created_at).getTime()) / 60000)
            const canSendInstructions = o.status === 'confirmed' && o.driver_response === 'accepted' && !o.instructions_sent_at && (o.driver_id || o.external_driver_id)
            const isSelected = selectedOrders.has(o.id)

            return (
              <div key={o.id} className={`grid px-4 py-2.5 transition-colors group ${isSelected ? 'bg-violet-500/10 hover:bg-violet-500/15' : 'hover:bg-gray-800/30'}`} style={{ gridTemplateColumns: COL }}>
                {getOrderedColumns().map(col => {
                  switch (col.id) {
                    case 'checkbox':
                      return (
                        <div key={col.id} className="flex items-center justify-center">
                          <input type="checkbox" checked={isSelected} onChange={() => toggleOrderSelection(o.id)} onClick={(e) => e.stopPropagation()}
                            className="w-3.5 h-3.5 rounded border-gray-600 bg-gray-700 text-violet-500 focus:ring-violet-500 focus:ring-offset-0 cursor-pointer" />
                        </div>
                      )
                    case 'tracking':
                      return (
                        <SmartCell key={col.id} align="left">
                          <div className="flex flex-col w-full">
                            <span className="text-xs font-mono font-semibold text-violet-400 truncate">{o.tracking_code}</span>
                            <span className="text-[9px] text-gray-600">{o.created_at ? new Date(o.created_at).toLocaleDateString('ka-GE', { day: '2-digit', month: '2-digit' }) : ''}</span>
                          </div>
                        </SmartCell>
                      )
                    case 'route':
                      return (
                        <SmartCell key={col.id} align="center">
                          <div className="w-full px-2">
                            <RouteCell from={(o.pickup_address || '').slice(0, 18)} to={(o.delivery_address || '').slice(0, 18)} />
                          </div>
                        </SmartCell>
                      )
                    case 'cargo':
                      return (
                        <SmartCell key={col.id} align="center">
                          <div className="flex flex-col items-center text-center w-full">
                            <TruncatedText text={o.cargo_description || '—'} maxLength={18} className="text-xs text-gray-300" />
                            {o.cargo_weight_kg && <span className="text-[9px] text-gray-500 mt-0.5">{Number(o.cargo_weight_kg).toLocaleString()} კგ</span>}
                          </div>
                        </SmartCell>
                      )
                    case 'driver':
                      return (
                        <SmartCell key={col.id} align="center">
                          <div className="flex flex-col gap-0.5 items-center w-full">
                            <div className="flex items-center gap-1">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" className="flex-shrink-0"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                              <TruncatedText text={o.drivers?.full_name || o.external_drivers?.full_name || '—'} maxLength={12} className="text-xs text-gray-300" />
                              {o.driver_type === 'external' && <span className="text-[8px] px-1 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex-shrink-0">გარე</span>}
                            </div>
                            <div className="flex items-center gap-1">
                              <svg width="10" height="7" viewBox="0 0 20 10" fill="none" stroke="#6b7280" strokeWidth="1.5" className="flex-shrink-0"><rect x="1" y="1" width="18" height="7" rx="1.5"/></svg>
                              <TruncatedText text={o.vehicles?.plate_number || o.external_vehicles?.plate_number || '—'} maxLength={10} className="text-[9px] text-gray-400 font-mono" />
                            </div>
                          </div>
                        </SmartCell>
                      )
                    case 'price':
                      return (
                        <SmartCell key={col.id} align="center">
                          <div className="flex flex-col items-center text-center w-full">
                            <span className="text-xs font-semibold text-gray-200 font-mono">{o.price ? Number(o.price).toLocaleString() : '—'}</span>
                            <span className="text-[9px] text-gray-500">{o.currency || 'GEL'}</span>
                          </div>
                        </SmartCell>
                      )
                    case 'status':
                      return (
                        <SmartCell key={col.id} align="center">
                          <select value={o.status} onChange={e => handleStatusChange(o, e.target.value)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-medium border cursor-pointer outline-none transition-all whitespace-nowrap max-w-full ${st.bg} ${st.color} ${st.border}`} style={{ minWidth: '110px' }}>
                            <option value="pending">⏳ ლოდინში</option>
                            <option value="confirmed">✅ დადასტურებული</option>
                            <option value="rejected">❌ უარყოფილი</option>
                            <option value="in_transit">🚚 გზაში</option>
                            <option value="delivered">🎯 მიტანა</option>
                            <option value="cancelled">🚫 გაუქმებული</option>
                          </select>
                        </SmartCell>
                      )
                    case 'response':
                      return (
                        <SmartCell key={col.id} align="center">
                          <div className="flex flex-col items-center gap-0.5 w-full">
                            <DriverResponseBadge order={o} />
                            {o.status === 'pending' && !o.driver_response && (
                              <span className={`text-[9px] ${min > 30 ? 'text-rose-400 font-semibold' : min > 15 ? 'text-amber-400' : 'text-gray-600'}`}>{min} წთ</span>
                            )}
                          </div>
                        </SmartCell>
                      )
                    case 'actions':
                      return (
                        <SmartCell key={col.id} align="center">
                          <ActionIconsGrid
                            onEdit={() => handleEditClick(o)} onPreview={() => handlePreviewClick(o)}
                            onNotify={() => handleOpenNotification(o)} onInvoice={() => handleInvoiceClick(o)}
                            onInstructions={() => handleOpenInstructions(o)} onEnRoute={() => sendEnRouteReminder(o)}
                            onReminder={() => sendReminder(o)} onDelete={() => handleDeleteClick(o)}
                            showInstructions={canSendInstructions}
                            showEnRoute={o.instructions_sent_at && !o.en_route_at && o.driver_response === 'accepted'}
                            showReminder={o.status === 'pending' && !o.driver_response && o.driver_id}
                          />
                        </SmartCell>
                      )
                    default:
                      return null
                  }
                })}
              </div>
            )
          })
        )}
      </div>

      {/* KEYBOARD SHORTCUTS HINT */}
      <div className="flex items-center justify-between px-6 py-2 border-t border-gray-800 bg-gray-900/50 text-[10px] text-gray-600">
        <div className="flex items-center gap-4">
          <span><kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-400">Ctrl+N</kbd> ახალი</span>
          <span><kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-400">Ctrl+F</kbd> ძებნა</span>
          <span><kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-400">Ctrl+E</kbd> ექსპორტი</span>
          <span><kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-400">Del</kbd> წაშლა</span>
          <span><kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-400">Esc</kbd> გაუქმება</span>
        </div>
        <span>{sortedOrders.length} შეკვეთა</span>
      </div>

      {/* INSTRUCTIONS MODAL */}
      {showInstructionsModal && instructionsOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowInstructionsModal(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                  </span>
                  ინსტრუქციის გაგზავნა
                </h3>
                <p className="text-xs text-gray-500 mt-1">შეკვეთა: <span className="font-mono text-violet-400">{instructionsOrder.tracking_code}</span></p>
              </div>
              <button onClick={() => setShowInstructionsModal(false)} className="p-2 text-gray-400 hover:text-white transition">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">შეკვეთის დეტალები</p>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-gray-500 mb-1">მარშრუტი</p>
                    <p className="text-gray-200 font-medium">{instructionsOrder.pickup_address}</p>
                    <div className="w-px h-4 bg-gray-700 my-2" />
                    <p className="text-gray-200 font-medium">{instructionsOrder.delivery_address}</p>
                  </div>
                  <div className="space-y-3">
                    {instructionsOrder.scheduled_pickup_date && (<div><p className="text-gray-500 mb-1">დრო</p><p className="text-gray-200">{new Date(instructionsOrder.scheduled_pickup_date).toLocaleString('ka-GE')}</p></div>)}
                    <div><p className="text-gray-500 mb-1">ფასი</p><p className="text-gray-200 font-semibold">{instructionsOrder.price} {instructionsOrder.currency}</p></div>
                  </div>
                  <div><p className="text-gray-500 mb-1">ტვირთი</p><p className="text-gray-200">{instructionsOrder.cargo_description}</p></div>
                  <div><p className="text-gray-500 mb-1">მძღოლი</p><p className="text-gray-200">{instructionsOrder.drivers?.full_name || instructionsOrder.external_drivers?.full_name || '—'}</p></div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">დამატებითი ინსტრუქცია <span className="text-rose-400">*</span></label>
                <textarea value={instructionsText} onChange={e => setInstructionsText(e.target.value)}
                  placeholder="მაგალითად: შესასვლელი: მთავარი კარი, მე-3 სართული..."
                  className="w-full h-32 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-200 outline-none focus:border-cyan-500/50 transition placeholder-gray-600 resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-800 flex justify-end gap-3">
              <button onClick={() => setShowInstructionsModal(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition">გაუქმება</button>
              <button onClick={handleSendInstructions} disabled={sendingInstructions || !instructionsText.trim()}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${sendingInstructions || !instructionsText.trim() ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25'}`}>
                {sendingInstructions ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />იგზავნება...</>) : (<><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13"/><path d="M22 2 15 22 11 13 2 9l20-7z"/></svg>გაგზავნა</>)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {showAddModal && (
        <AddOrderModal isOpen={showAddModal} onClose={() => { setShowAddModal(false); setNewOrderForm(getInitialOrderForm()) }}
          orderForm={newOrderForm} setOrderForm={setNewOrderForm} onSubmit={handleAddSubmit}
          clients={privateClients} companies={companiesList} />
      )}
      {showEditModal && editingOrder && (
        <AddOrderModal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setEditingOrder(null) }}
          orderForm={editingOrder} setOrderForm={setEditingOrder} onSubmit={handleEditSave}
          clients={privateClients} companies={companiesList} />
      )}
      {showPreviewModal && previewOrder && (
        <OrderPreviewModal isOpen={showPreviewModal} onClose={() => { setShowPreviewModal(false); setPreviewOrder(null) }} order={previewOrder} />
      )}
      {showNotificationModal && notificationOrder && (
        <SendNotificationModal isOpen={showNotificationModal} onClose={() => { setShowNotificationModal(false); setNotificationOrder(null) }}
          order={notificationOrder} onSend={handleSendNotification} logs={[]} />
      )}
      <CreateInvoiceModal isOpen={showInvoiceModal} onClose={() => { setShowInvoiceModal(false); setSelectedOrderForInvoice(null) }}
        order={selectedOrderForInvoice} onSuccess={async () => {
          if (loadData) loadData()
          if (selectedOrderForInvoice) {
            await createNotification({ order_id: selectedOrderForInvoice.id, title: '🧾 ინვოისი შეიქმნა',
              message: `შეკვეთისთვის #${selectedOrderForInvoice.tracking_code} შეიქმნა ახალი ინვოისი`, type: 'payment' })
            toast.success('ინვოისი შეიქმნა!')
          }
        }} />
    </div>
  )
}