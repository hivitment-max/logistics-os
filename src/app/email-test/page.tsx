'use client'

import { useState } from 'react'

export default function EmailTestPage() {
  const [email, setEmail] = useState('hivitment@gmail.com')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const sendTestEmail = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const res = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: email })
      })
      const data = await res.json()
      setResult(data)
    } catch (err: any) {
      setResult({ success: false, error: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-6">📧 Email ტესტი</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-2">მიმღების Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
            />
          </div>

          <button
            onClick={sendTestEmail}
            disabled={loading}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium"
          >
            {loading ? '⏳ იგზავნება...' : '📤 გაგზავნა'}
          </button>

          {result && (
            <div className={`p-4 rounded-lg ${result.success ? 'bg-green-500/20 border border-green-500/50' : 'bg-red-500/20 border border-red-500/50'}`}>
              <pre className="text-xs text-white whitespace-pre-wrap">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}