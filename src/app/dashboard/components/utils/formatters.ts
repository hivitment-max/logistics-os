// ============================================================================
// 💱 Formatters & Utilities
// ============================================================================

export const formatCurrency = (amount: number, currency: string = 'GEL'): string => {
    const symbols: Record<string, string> = { GEL: '₾', USD: '$', EUR: '€' }
    const symbol = symbols[currency] || currency
    return `${symbol} ${amount.toLocaleString('ka-GE', { minimumFractionDigits: 2 })}`
  }
  
  export const formatDate = (dateString: string, options?: Intl.DateTimeFormatOptions): string => {
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }
    return new Date(dateString).toLocaleDateString('ka-GE', { ...defaultOptions, ...options })
  }
  
  export const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString('ka-GE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  
  export const formatPhone = (phone: string): string => {
    // Format: +995 5XX XXX XXX
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.startsWith('995') && cleaned.length === 12) {
      return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`
    }
    return phone
  }
  
  export const truncate = (text: string, maxLength: number = 50): string => {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength - 3) + '...'
  }
  
  export const generateTrackingCode = (): string => {
    const year = new Date().getFullYear()
    const random = Math.floor(Math.random() * 9000) + 1000
    return `TRK-${year}-${random}`
  }
  
  export const generateInvoiceNumber = (): string => {
    const year = new Date().getFullYear()
    const random = Math.floor(Math.random() * 900) + 100
    return `INV-${year}-${random}`
  }