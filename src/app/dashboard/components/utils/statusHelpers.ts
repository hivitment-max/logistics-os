// ============================================================================
// 🎨 Status & Badge Helpers
// ============================================================================

export const getStatusColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'delivered':
    case 'paid':
      return 'bg-green-500/20 text-green-400 border-green-500/30'
    case 'idle':
    case 'pending':
    case 'sent':
    case 'confirmed':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    case 'maintenance':
    case 'cancelled':
    case 'overdue':
      return 'bg-red-500/20 text-red-400 border-red-500/30'
    case 'in_transit':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }
}

export const getStatusDotColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'delivered':
    case 'paid':
      return 'bg-green-400'
    case 'idle':
    case 'pending':
    case 'sent':
    case 'confirmed':
      return 'bg-yellow-400'
    case 'maintenance':
    case 'cancelled':
    case 'overdue':
      return 'bg-red-400'
    case 'in_transit':
      return 'bg-blue-400'
    default:
      return 'bg-gray-400'
  }
}

export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    active: 'აქტიური',
    idle: 'ლოდინში',
    maintenance: 'რემონტში',
    inactive: 'არააქტიური',
    pending: 'ლოდინში',
    confirmed: 'დადასტურებული',
    in_transit: 'მოძრაობაში',
    delivered: 'მიწოდებული',
    cancelled: 'გაუქმებული',
    draft: 'დრაფტი',
    sent: 'გაგზავნილი',
    viewed: 'ნანახი',
    partial_paid: 'ნაწილობრივ გადახდილი',
    paid: 'გადახდილი',
    overdue: 'ვადაგასული',
  }
  return labels[status?.toLowerCase()] || status
}