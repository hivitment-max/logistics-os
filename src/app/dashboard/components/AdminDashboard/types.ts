// ============================================================================
// 📋 TypeScript Interfaces - ცენტრალიზებული ტიპები
// ============================================================================

// 🚗 Vehicle
export interface Vehicle {
    id: string
    plate_number: string
    vin_number: string
    tech_passport: string
    pti_expiry: string
    insurance_policy: string
    insurance_cmre_policy: string | null
    owner_name: string
    owner_type: 'company' | 'individual'
    power_of_attorney: string | null
    model: string
    type: 'truck' | 'van' | 'car'
    body_type: 'tent' | 'refrigerated' | 'container' | 'flatbed' | 'bulk' | 'standard'
    capacity_kg: number | null
    volume_m3: number | null
    length_m: number | null
    width_m: number | null
    height_m: number | null
    adr_class: string | null
    euro_standard: '5' | '6' | 'EEV' | null
    straps_count: number | null
    has_tail_lift: boolean
    has_refrigeration: boolean
    gps_device_id: string | null
    has_fuel_sensor: boolean
    photo_urls: string | null
    tire_season: 'summer' | 'winter' | 'all_season'
    tire_condition: 'new' | 'good' | 'replace_soon' | 'replace_now'
    status: 'active' | 'idle' | 'maintenance' | 'inactive'
    notes: string | null
    extra_equipment: string | null
    driver_name?: string | null
    created_at: string
    updated_at: string
  }
  
  // 👨‍✈️ Driver
  export interface Driver {
    id: string
    full_name: string
    phone: string
    email: string | null
    personal_id: string
    dob: string
    address: string
    license_number: string
    license_category: 'B' | 'C' | 'C+E' | 'D'
    license_expiry: string
    total_experience_years: number | null
    special_experience: string | null
    has_adr: boolean
    employment_type: 'internal' | 'contractor'
    payment_method: 'bank_transfer' | 'cash' | 'card' | null
    commission_percent: number | null
    rate_per_km: number | null
    base_salary: number | null
    bank_name: string | null
    bank_account: string | null
    telegram_username: string | null
    telegram_chat_id: string | null
    notify_order_assign: boolean
    notify_payment: boolean
    notify_promo: boolean
    status: 'active' | 'inactive' | 'on_leave'
    assigned_vehicle_id: string | null
    created_at: string
    updated_at: string
  }
  
  // 📦 Order
  export interface Order {
    id: string
    tracking_code: string
    client_name: string
    client_email: string | null
    client_phone: string | null
    pickup_address: string
    delivery_address: string
    cargo_description: string
    cargo_weight_kg: number | null
    cargo_volume_m3: number | null
    price: number
    currency: string
    status: 'pending' | 'confirmed' | 'in_transit' | 'delivered' | 'cancelled'
    assigned_driver_id: string | null
    assigned_vehicle_id: string | null
    scheduled_pickup: string | null
    scheduled_delivery: string | null
    actual_pickup: string | null
    actual_delivery: string | null
    notes: string | null
    created_at: string
    updated_at: string
  }
  
  // 🧾 Invoice
  export interface Invoice {
    id: string
    invoice_number: string
    order_id: string | null
    tracking_code: string | null
    client_name: string
    client_email: string | null
    total_amount: number
    currency: string
    status: 'draft' | 'sent' | 'viewed' | 'partial_paid' | 'paid' | 'overdue' | 'cancelled'
    issue_date: string
    due_date: string | null
    paid_date: string | null
    created_at: string
    updated_at: string
  }
  
  // 👤 Private Client
  export interface PrivateClient {
    id: string
    full_name: string
    personal_id: string
    phone: string
    email: string | null
    address: string | null
    notes: string | null
    created_at: string
    updated_at: string
  }
  
  // 🏢 Company
  export interface Company {
    id: string
    name: string
    registration_number: string
    vat_number: string | null
    contact_person: string | null
    phone: string
    email: string | null
    address: string | null
    notes: string | null
    created_at: string
    updated_at: string
  }
  
  // 🔔 Notification
  export interface DashboardNotification {
    id: string
    title: string
    message: string
    channel: 'dashboard' | 'email' | 'sms' | 'telegram'
    status: 'unread' | 'read'
    order_id: string | null
    created_at: string
    read_at: string | null
  }
  
  // 🎨 Helper Types
  export type VehicleStatus = 'active' | 'idle' | 'maintenance' | 'inactive'
  export type OrderStatus = 'pending' | 'confirmed' | 'in_transit' | 'delivered' | 'cancelled'
  export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'partial_paid' | 'paid' | 'overdue' | 'cancelled'
  export type DriverStatus = 'active' | 'inactive' | 'on_leave'
  export type VehicleType = 'truck' | 'van' | 'car'
  export type VehicleBodyType = 'tent' | 'refrigerated' | 'container' | 'flatbed' | 'bulk' | 'standard'