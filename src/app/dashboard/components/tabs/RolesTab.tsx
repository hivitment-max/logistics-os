'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  color: string
}

const SYSTEM_ROLES: Role[] = [
  {
    id: 'admin',
    name: '👑 ადმინისტრატორი',
    description: 'სრული წვდომა სისტემის ყველა ფუნქციონალზე',
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    permissions: ['all']
  },
  {
    id: 'manager',
    name: '📋 მენეჯერი',
    description: 'ოპერაციული მართვა (შეკვეთები, ფლოტი, მძღოლები)',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    permissions: ['orders', 'fleet', 'drivers', 'tracking']
  },
  {
    id: 'dispatcher',
    name: '📦 დისპეტჩერი',
    description: 'შეკვეთების განაწილება და მარშრუტიზაცია',
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
    permissions: ['orders', 'tracking']
  },
  {
    id: 'accountant',
    name: '💰 ბუღალტერი',
    description: 'ინვოისები, გადახდები და ანგარიშგება',
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    permissions: ['invoices', 'payroll', 'clients']
  },
  {
    id: 'driver',
    name: '🚛 მძღოლი',
    description: 'მხოლოდ საკუთარი შეკვეთების და მარშრუტის ნახვა',
    color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    permissions: ['my_orders', 'profile']
  },
  {
    id: 'client',
    name: '👤 კლიენტი',
    description: 'შეკვეთის შექმნა და სტატუსის ნახვა',
    color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    permissions: ['client_dashboard']
  }
]

export default function RolesTab(): JSX.Element {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const counts: Record<string, number> = {}
        
        // დათვალე მძღოლები
        const { count: driverCount } = await supabase
          .from('drivers').select('*', { count: 'exact', head: true })
        counts['driver'] = driverCount || 0
        
        // დათვალე კლიენტები (კერძო + კომპანია)
        const { count: privateCount } = await supabase
          .from('private_clients').select('*', { count: 'exact', head: true })
        const { count: companyCount } = await supabase
          .from('companies').select('*', { count: 'exact', head: true })
        counts['client'] = (privateCount || 0) + (companyCount || 0)
        
        // დანარჩენები დროებით 0
        counts['admin'] = 1
        counts['manager'] = 0
        counts['dispatcher'] = 0
        counts['accountant'] = 0
        
        setRoleCounts(counts)
      } catch (e) {
        console.error('Failed to fetch counts:', e)
      } finally {
        setLoading(false)
      }
    }
    
    fetchCounts()
  }, [])

  return (
    <div className="space-y-6">
      <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">🔑 როლების სისტემა</h2>
        <p className="text-sm text-gray-400 mb-6">
          სისტემაში გამოყენებული როლების ნუსხა და მათი ნებართვები.
        </p>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <span className="text-gray-400 text-sm">იტვირთება...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SYSTEM_ROLES.map((role) => (
              <div 
                key={role.id} 
                className="bg-gray-900/50 border border-gray-700 rounded-xl p-4 hover:border-gray-500 transition cursor-pointer"
                onClick={() => setSelectedRole(role)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-white">{role.name}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${role.color}`}>
                    {role.id}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 mb-3">{role.description}</p>
                <div className="flex items-center justify-between text-[10px] text-gray-500">
                  <span>👥 მომხმარებლები:</span>
                  <span className="font-bold text-white">{roleCounts[role.id] || 0}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* მოდალი */}
      {selectedRole && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedRole(null)}>
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">{selectedRole.name}</h3>
              <button onClick={() => setSelectedRole(null)} className="text-gray-400 hover:text-white text-xl">&times;</button>
            </div>
            <p className="text-sm text-gray-300 mb-4">{selectedRole.description}</p>
            <div className="space-y-2">
              {selectedRole.permissions.map(perm => (
                <div key={perm} className="flex items-center justify-between p-2 bg-gray-900/50 rounded">
                  <span className="text-xs text-gray-300">{perm}</span>
                  <span className="text-green-400 text-xs">✅</span>
                </div>
              ))}
            </div>
            <button onClick={() => setSelectedRole(null)} className="mt-4 w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs">დახურვა</button>
          </div>
        </div>
      )}
    </div>
  )
}