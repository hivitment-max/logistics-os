'use client'

import { useEffect, useState, useMemo } from 'react'

interface LoadingTruckProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function LoadingTruck({ 
  message = 'შეკვეთები იტვირთება...', 
  size = 'md' 
}: LoadingTruckProps) {
  const [dots, setDots] = useState('')
  const [mounted, setMounted] = useState(false)

  // ტიპოგრაფიული ეფექტი წერტილებისთვის
  useEffect(() => {
    setMounted(true)
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 500)
    return () => clearInterval(interval)
  }, [])

  // დეკორატიული ნაწილაკების პოზიციები - მხოლოდ client-side-ზე გენერირდება
  const particles = useMemo(() => {
    if (!mounted) return []
    return [...Array(6)].map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 5}s`,
      duration: `${3 + Math.random() * 4}s`,
    }))
  }, [mounted])

  const sizeClasses = {
    sm: 'scale-75',
    md: 'scale-100',
    lg: 'scale-125',
  }

  return (
    <div className="fixed inset-0 bg-gray-900/95 backdrop-blur-sm flex items-center justify-center z-50">
      <div className={`flex flex-col items-center gap-8 ${sizeClasses[size]}`}>
        
        {/* მთავარი ანიმაციის კონტეინერი */}
        <div className="relative w-80 h-32">
          
          {/* გზა */}
          <div className="absolute bottom-8 left-0 right-0 h-1 bg-gray-700 rounded-full overflow-hidden">
            <div className="absolute inset-0 flex gap-2 animate-road">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="w-4 h-full bg-gray-500 rounded-full flex-shrink-0" />
              ))}
            </div>
          </div>

          {/* ატვირთვის წერტილი (მარცხნივ) */}
          <div className="absolute left-4 bottom-12 flex flex-col items-center">
            <div className="relative">
              {/* პაკეტი */}
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg shadow-lg shadow-violet-500/50 flex items-center justify-center animate-pulse-slow">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                  <line x1="12" y1="22.08" x2="12" y2="12"/>
                </svg>
              </div>
              {/* Glow ეფექტი */}
              <div className="absolute inset-0 bg-violet-500 rounded-lg blur-xl opacity-50 animate-pulse" />
            </div>
            {/* A ლეიბლი */}
            <div className="mt-2 text-[10px] font-bold text-violet-400">A</div>
          </div>

          {/* მიწოდების წერტილი (მარჯვნივ) */}
          <div className="absolute right-4 bottom-12 flex flex-col items-center">
            <div className="relative">
              {/* Pin */}
              <div className="w-10 h-10 flex items-center justify-center animate-bounce-slow">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-emerald-400">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              {/* Glow ეფექტი */}
              <div className="absolute inset-0 bg-emerald-500 rounded-full blur-xl opacity-30 animate-pulse" />
            </div>
            {/* B ლეიბლი */}
            <div className="mt-2 text-[10px] font-bold text-emerald-400">B</div>
          </div>

          {/* სატვირთო მანქანა */}
          <div className="absolute bottom-6 animate-truck">
            <div className="relative">
              {/* მანქანის სხეული */}
              <div className="flex items-end gap-0.5">
                {/* ტვირთის ნაწილი */}
                <div className="w-16 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-t-lg shadow-lg relative">
                  {/* ლოგო მანქანაზე */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                    </svg>
                  </div>
                </div>
                {/* კაბინა */}
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-tr-lg rounded-bl-lg shadow-lg relative">
                  {/* ფანჯარა */}
                  <div className="absolute top-1 right-1 w-4 h-3 bg-blue-300/30 rounded-sm" />
                </div>
              </div>
              
              {/* ბორბლები */}
              <div className="flex gap-3 -mt-1 ml-2">
                <div className="w-4 h-4 bg-gray-800 rounded-full border-2 border-gray-600 animate-spin-slow relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-1 h-1 bg-gray-400 rounded-full" />
                  </div>
                </div>
                <div className="w-4 h-4 bg-gray-800 rounded-full border-2 border-gray-600 animate-spin-slow relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-1 h-1 bg-gray-400 rounded-full" />
                  </div>
                </div>
              </div>

              {/* კვამლი/ნაწილაკები */}
              <div className="absolute -left-4 bottom-2 flex gap-1">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-smoke-1 opacity-60" />
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-smoke-2 opacity-40" />
                <div className="w-0.5 h-0.5 bg-gray-400 rounded-full animate-smoke-3 opacity-20" />
              </div>

              {/* Glow ეფექტი მანქანის ქვეშ */}
              <div className="absolute -bottom-2 left-0 right-0 h-2 bg-blue-500/30 blur-lg" />
            </div>
          </div>

          {/* პროგრესის ინდიკატორი */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-violet-500 via-blue-500 to-emerald-500 animate-progress" />
          </div>
        </div>

        {/* ტექსტი */}
        <div className="flex flex-col items-center gap-3">
          <div className="text-lg font-semibold text-white flex items-center gap-1">
            {message}
            <span className="text-violet-400 w-6">{dots}</span>
          </div>
          
          {/* სტატუსის ტექსტი */}
          <div className="text-xs text-gray-500 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse" />
            <span>მონაცემები იტვირთება სერვერიდან</span>
          </div>
        </div>

        {/* დეკორატიული ნაწილაკები ფონზე - მხოლოდ mounted-ის შემდეგ */}
        {mounted && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map((particle, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-violet-500/20 rounded-full animate-float"
                style={{
                  left: particle.left,
                  top: particle.top,
                  animationDelay: particle.delay,
                  animationDuration: particle.duration,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}