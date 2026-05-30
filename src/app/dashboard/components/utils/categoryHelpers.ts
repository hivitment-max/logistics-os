// ============================================================================
// 🎨 Category Icons & Labels
// ============================================================================

export const getCategoryIcon = (category: string): string => {
    const icons: Record<string, string> = {
      // Expenses
      fuel: '⛽',
      toll: '🛣️',
      repair: '🔧',
      food: '🍔',
      tire: '🛞',
      other: '📦',
      // Tables
      orders: '📦',
      drivers: '👨‍✈️',
      vehicles: '🚐',
      invoices: '🧾',
      private_clients: '👤',
      companies: '🏢',
      auth: '🔐',
      trip_expenses: '🛣️',
    }
    return icons[category] || '📋'
  }
  
  export const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      fuel: 'საწვავი',
      toll: 'ტოლი',
      repair: 'შეკეთება',
      food: 'კვება',
      tire: 'საბურავი',
      other: 'სხვა',
    }
    return labels[category] || category
  }
  
  export const getVehicleTypeIcon = (type: string): string => {
    switch (type) {
      case 'truck': return '🚛'
      case 'van': return '🚐'
      case 'car': return '🚗'
      default: return '🚙'
    }
  }
  
  export const getVehicleTypeLabel = (type: string): string => {
    switch (type) {
      case 'truck': return 'სატვირთო'
      case 'van': return 'ფურგონი'
      case 'car': return 'მსუბუქი'
      default: return type
    }
  }