'use client'

interface LoadingTruckProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function LoadingTruck({ 
  message = 'იტვირთება მონაცემები...', 
  size = 'md' 
}: LoadingTruckProps) {
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl', 
    lg: 'text-6xl'
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="relative">
        <div className={`${sizeClasses[size]} animate-bounce-slow`}>🚛</div>
        <div className="absolute bottom-1 left-2 flex gap-1">
          <div className="w-3 h-3 bg-gray-700 rounded-full border-2 border-blue-400 animate-spin-slow"></div>
          <div className="w-3 h-3 bg-gray-700 rounded-full border-2 border-blue-400 animate-spin-slow" style={{ animationDelay: '0.2s' }}></div>
        </div>
        <div className="absolute -bottom-4 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent animate-pulse"></div>
        <div className="absolute -bottom-2 -right-2 text-gray-500/60 animate-ping text-sm">💨</div>
      </div>
      <p className="mt-6 text-sm font-medium text-gray-400 flex items-center gap-2">
        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
        {message}
        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></span>
      </p>
      <div className="mt-4 w-48 h-1 bg-gray-700 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-loading-bar"></div>
      </div>
    </div>
  )
}