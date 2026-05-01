'use client'
import { useState } from 'react'

export default function SettingsTab({ user, onSignOut }: any) {
  const [language, setLanguage] = useState('ka')
  const [emailNotifications, setEmailNotifications] = useState(true)

  return (
    <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-6 max-w-2xl">
      <h2 className="text-sm font-bold mb-4">⚙️ პარამეტრები</h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-[10px] font-semibold text-gray-400 mb-2">ენა</label>
          <select value={language} onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-xs outline-none focus:border-blue-500">
            <option value="ka">🇬 ქართული</option>
            <option value="en">🇬🇧 English</option>
            <option value="ru">🇷 Русский</option>
          </select>
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg">
          <input type="checkbox" checked={emailNotifications} onChange={(e) => setEmailNotifications(e.target.checked)}
            className="w-4 h-4 accent-blue-500" />
          <label className="text-xs text-gray-300">📧 ელ-ფოსტაზე შეტყობინებების მიღება</label>
        </div>
        
        <div className="pt-4 border-t border-gray-700">
          <button onClick={onSignOut} className="w-full py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-lg text-xs font-semibold transition">
            🚪 სისტემიდან გასვლა
          </button>
        </div>
      </div>
    </div>
  )
}