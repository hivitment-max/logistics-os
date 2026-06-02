// src/app/dashboard/components/orders/InstructionsPanel.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface InstructionsPanelProps {
  order: {
    id: string
    tracking_code: string
    pickup_address: string
    pickup_contact_person?: string
    pickup_phone?: string
    driver_id?: string
    external_driver_id?: string
    driver_type?: 'internal' | 'external'
    instructions_sent_at?: string | null
  }
  onInstructionsSent?: () => void
}

export default function InstructionsPanel({ order, onInstructionsSent }: InstructionsPanelProps) {
  const [sending, setSending] = useState(false)
  const [instructions, setInstructions] = useState('')
  const [error, setError] = useState<string | null>(null)

  // თუ ინსტრუქცია უკვე გაგზავნილია
  if (order.instructions_sent_at) {
    return (
      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
        <p className="text-sm text-emerald-400 font-medium">
          ✅ ინსტრუქცია გაგზავნილია: {new Date(order.instructions_sent_at!).toLocaleString('ka-GE')}
        </p>
        <p className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">{order.instructions_content}</p>
      </div>
    )
  }

  const handleSend = async () => {
    if (!instructions.trim()) {
      setError('შეიყვანეთ ინსტრუქცია')
      return
    }

    setSending(true)
    setError(null)

    try {
      // 1. მივიღოთ მძღოლის Telegram Chat ID
      const driverId = order.driver_type === 'external' ? order.external_driver_id : order.driver_id
      if (!driverId) throw new Error('მძღოლი არ არის მინიჭებული')

      const { data: driver } = await supabase
        .from('drivers')
        .select('telegram_chat_id, full_name')
        .eq('id', driverId)
        .single()

      if (!driver?.telegram_chat_id) {
        throw new Error('მძღოლს არ აქვს Telegram Chat ID')
      }

      // 2. ფორმატირება შეტყობინების
      const message = `📋 *დეტალური ინსტრუქცია შეკვეთისთვის #${order.tracking_code}*\n\n` +
        `📍 მისამართი: ${order.pickup_address}\n` +
        `${order.pickup_contact_person ? `👤 კონტაქტი: ${order.pickup_contact_person}\n` : ''}` +
        `${order.pickup_phone ? `📞 ტელ: ${order.pickup_phone}\n` : ''}` +
        `\n📝 დამატებითი შენიშვნები:\n${instructions}` +
        `\n\nგთხოვთ, დაადასტუროთ რომ მიდიხართ:`

      const inline_keyboard = [[
        { text: '🚗 მივდივარ ატვირთვაზე', callback_data: `en_route:${order.id}` }
      ]]

      // 3. გაგზავნა Telegram-ზე
      const token = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN
      if (!token) throw new Error('Bot token missing')

      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: driver.telegram_chat_id,
          text: message,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard }
        })
      })

      const result = await res.json()
      if (!result.ok) throw new Error(result.description || 'Telegram API error')

      // 4. განვაახლოთ ბაზა
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          instructions_sent_at: new Date().toISOString(),
          instructions_content: instructions
        })
        .eq('id', order.id)

      if (updateError) throw updateError

      // 5. ჩავწეროთ ლოგი
      await supabase.from('notifications').insert({
        order_id: order.id,
        driver_id: order.driver_type === 'internal' ? driver.id : null,
        external_driver_id: order.driver_type === 'external' ? driver.id : null,
        title: '📋 ინსტრუქცია გაგზავნილია',
        message: `დისპეტჩერმა გაუგზავნა დეტალური ინსტრუქცია მძღოლს ${driver.full_name}`,
        channel: 'telegram',
        status: 'sent',
        metadata: { type: 'instructions', telegram_message_id: result.result?.message_id },
        sent_at: new Date().toISOString()
      })

      alert('✅ ინსტრუქცია გაგზავნილია!')
      onInstructionsSent?.()

    } catch (err: any) {
      console.error('❌ Failed to send instructions:', err)
      setError(err.message || 'შეცდომა გაგზავნისას')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">
          📝 დამატებითი ინსტრუქცია მძღოლისთვის
        </label>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="მაგ: შესასვლელი მარცხნივაა, პარკინგი #5, დაურეკეთ მიწოდებისას..."
          className="w-full h-24 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white outline-none focus:border-cyan-500 transition placeholder-gray-600 resize-none"
        />
      </div>

      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded">{error}</p>
      )}

      <button
        onClick={handleSend}
        disabled={sending || !instructions.trim()}
        className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2
          ${sending || !instructions.trim()
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_16px_rgba(34,211,238,0.3)]'
          }`}
      >
        {sending ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            იგზავნება...
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/>
            </svg>
            📤 გაგზავნა ინსტრუქციის
          </>
        )}
      </button>

      <p className="text-[10px] text-gray-600 text-center">
        მძღოლი მიიღებს შეტყობინებას + ღილაკს "[🚗 მივდივარ ატვირთვაზე]"
      </p>
    </div>
  )
}