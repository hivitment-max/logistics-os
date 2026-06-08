'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export type SendNotificationResult = {
  success: boolean
  logs?: any[]
  telegram_message_id?: any
  error?: any
}

interface SendNotificationModalProps {
  isOpen: boolean
  onClose: () => void
  order: any
  onSend: (channels: string[]) => Promise<SendNotificationResult | void>
  logs?: Array<{
    channel: string
    status: 'sent' | 'failed' | 'pending'
    timestamp: string
    message?: string
  }>
}

export default function SendNotificationModal({ 
  isOpen, 
  onClose, 
  order, 
  onSend,
  logs = []
}: SendNotificationModalProps) {
  
  const [selectedChannels, setSelectedChannels] = useState<string[]>([])
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null)
  const [driverData, setDriverData] = useState<any>(null)
  const [telegramChatId, setTelegramChatId] = useState<string | null>(null)
  const [loadingDriver, setLoadingDriver] = useState(false)

  // 🔁 1. მოდლის გახსნა: რესეტი და მონაცემების ჩატვირთვა
  useEffect(() => {
    if (isOpen && order) {
      // რესეტი
      setSending(false)
      setSendResult(null)
      setSelectedChannels([])
      setLoadingDriver(true)
      
      // მონაცემების ჩატვირთვა
      fetchDriverData()
    }
  }, [isOpen, order?.id])

  // 🔁 2. როცა მონაცემები ჩაიტვირთება: ავტო-მონიშვნა
  useEffect(() => {
    if (!loadingDriver && isOpen) {
      if (telegramChatId) {
        setSelectedChannels(['telegram'])
      } else if (order?.client_email) {
        setSelectedChannels(['email'])
      } else {
        setSelectedChannels([])
      }
    }
  }, [loadingDriver, telegramChatId, order?.client_email, isOpen])

  const fetchDriverData = async () => {
    if (!order) return
    
    try {
      console.log('🔍 Fetching driver data for order:', order.id, 'type:', order.driver_type)
      
      let driver = null
      let chatId = null

      if (order.driver_type === 'external' && order.external_driver_id) {
        console.log('🔎 Fetching external_driver:', order.external_driver_id)
        const { data, error } = await supabase
          .from('external_drivers')
          .select('id, full_name, phone, telegram_chat_id, telegram_username')
          .eq('id', order.external_driver_id)
          .single()
        
        if (error) {
          console.error('❌ External driver error:', error)
          throw new Error(`External driver: ${error.message}`)
        }
        driver = data
        chatId = data?.telegram_chat_id
        console.log('✅ External driver found:', data?.full_name, 'chatId:', chatId)
        
      } else if (order.driver_id) {
        console.log('🔎 Fetching internal driver:', order.driver_id)
        const { data, error } = await supabase
          .from('drivers')
          .select('id, full_name, phone, telegram_chat_id, telegram_username')
          .eq('id', order.driver_id)
          .single()
        
        if (error) {
          console.error('❌ Internal driver error:', error)
          throw new Error(`Internal driver: ${error.message}`)
        }
        driver = data
        chatId = data?.telegram_chat_id
        console.log('✅ Internal driver found:', data?.full_name, 'chatId:', chatId)
      } else {
        console.warn('⚠️ No driver_id found in order')
      }

      setDriverData(driver)
      setTelegramChatId(chatId || null)
      
    } catch (error: any) {
      console.error('❌ fetchDriverData failed:', error)
      setTelegramChatId(null)
    } finally {
      setLoadingDriver(false)
    }
  }

  if (!isOpen) return null

  const channels = [
    { 
      id: 'telegram', 
      name: 'Telegram', 
      icon: '📱', 
      desc: 'მყისიერი შეტყობინება',
      chatId: telegramChatId,
      available: !!telegramChatId 
    },
    { 
      id: 'email', 
      name: 'Email', 
      icon: '📧', 
      desc: 'დეტალური ინვოისი',
      available: !!order?.client_email 
    },
    { 
      id: 'sms', 
      name: 'SMS', 
      icon: '💬', 
      desc: 'მოკლე შეტყობინება',
      available: false,
      soon: true 
    },
  ]

  const handleSend = async () => {
    if (sending || selectedChannels.length === 0) return
    
    setSending(true)
    setSendResult(null)
    
    try {
      await onSend(selectedChannels)
      setSendResult({ success: true, message: '✅ წარმატებით გაიგზავნა!' })
      setTimeout(() => onClose(), 1500)
    } catch (err: any) {
      console.error('❌ Send error:', err)
      setSendResult({ success: false, message: `❌ ${err.message || 'გაგზავნა ვერ მოხერხდა'}` })
    } finally {
      setSending(false)
    }
  }

  const toggleChannel = (channelId: string) => {
    const channel = channels.find(c => c.id === channelId)
    if (!channel?.available) return
    setSelectedChannels(prev => 
      prev.includes(channelId) 
        ? prev.filter(c => c !== channelId) 
        : [...prev, channelId]
    )
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white text-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        
        {/* 🔝 Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">📢 შეტყობინების გაგზავნა</h2>
              <p className="text-sm text-gray-600 font-mono">{order?.tracking_code}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl transition p-1 hover:bg-gray-200 rounded-lg">&times;</button>
          </div>
        </div>

        {/* 📜 Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* 📋 შეკვეთის ინფო */}
          <section className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">📦 შეკვეთის დეტალები</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500 text-xs block mb-1">📍 მარშრუტი:</span><p className="font-medium">{order?.pickup_address?.slice(0,20) || '–'} → {order?.delivery_address?.slice(0,20) || '–'}</p></div>
              <div><span className="text-gray-500 text-xs block mb-1">👨‍✈️ მძღოლი:</span><p className="font-medium">{driverData?.full_name || order?.drivers?.full_name || order?.external_drivers?.full_name || '–'}</p></div>
              <div><span className="text-gray-500 text-xs block mb-1">💰 თანხა:</span><p className="font-bold text-green-600">{order?.price} {order?.currency}</p></div>
            </div>
          </section>

          {/* 📡 გაგზავნის არხები - ერთ ხაზზე */}
          <section className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 mb-3">📡 გაგზავნის არხები</h3>
            
            {loadingDriver ? (
              <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600">მძღოლის მონაცემები იტვირთება...</span>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {channels.map(channel => {
                  const isSelected = selectedChannels.includes(channel.id)
                  const isDisabled = !channel.available
                  
                  // 💡 კონტაქტის ინფორმაცია + მინიშნება სად ჩაიწეროს
                  let contactInfo = ''
                  let hintLocation = ''
                  
                  if (channel.id === 'telegram') {
                    contactInfo = telegramChatId || ''
                    hintLocation = 'მძღოლის პროფილში'
                  } else if (channel.id === 'email') {
                    contactInfo = order?.client_email || ''
                    hintLocation = 'დამკვეთის მონაცემებში'
                  } else if (channel.id === 'sms') {
                    contactInfo = driverData?.phone || order?.client_phone || ''
                    hintLocation = 'მძღოლის/დამკვეთის პროფილში'
                  }
                  
                  return (
                    <label 
                      key={channel.id}
                      className={`flex flex-col p-3 rounded-lg border cursor-pointer transition ${
                        isSelected && !isDisabled
                          ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                          : isDisabled
                            ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                            : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => toggleChannel(channel.id)}
                          disabled={isDisabled}
                          className="w-4 h-4 accent-blue-600 mt-0.5"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-lg">{channel.icon}</span>
                            <span className="font-medium text-gray-900 text-sm">{channel.name}</span>
                          </div>
                          {channel.soon && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded mt-1 inline-block">
                              მალე
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* 📋 კონტაქტის ინფორმაცია ან მინიშნება */}
                      <div className="ml-6 mt-1">
                        {channel.available ? (
                          <div className="flex items-center gap-1 text-[10px] text-green-600 font-medium">
                            <span>✅</span>
                            <span className="truncate" title={contactInfo}>
                              {contactInfo}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1 text-[10px] text-gray-400">
                              <span>❌</span>
                              <span>მონაცემები არ არის</span>
                            </div>
                            <div className="text-[9px] text-amber-600 font-medium">
                              📍 {hintLocation}
                            </div>
                          </div>
                        )}
                      </div>
                    </label>
                  )
                })}
              </div>
            )}
          </section>

          {/* ✅ შედეგი */}
          {sendResult && (
            <div className={`p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${
              sendResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              <span>{sendResult.success ? '✅' : '❌'}</span>
              {sendResult.message}
            </div>
          )}

        </div>

        {/* 🔽 Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0 flex justify-end gap-3 rounded-b-2xl">
          <button onClick={onClose} className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition">გაუქმება</button>
          <button 
            onClick={handleSend} 
            disabled={sending || selectedChannels.length === 0 || loadingDriver}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold transition flex items-center gap-2 shadow-lg shadow-blue-500/20"
          >
            {sending ? <><span className="animate-spin">⏳</span> იგზავნება...</> : <>📢 გაგზავნა ({selectedChannels.length})</>}
          </button>
        </div>

      </div>
    </div>
  )
}