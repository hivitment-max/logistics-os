'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

interface SendNotificationModalProps {
  isOpen: boolean
  onClose: () => void
  order: any
  onSend: (channels: string[]) => Promise<void>
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
  
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['telegram'])
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null)
  const [driverData, setDriverData] = useState<any>(null)
  const [telegramChatId, setTelegramChatId] = useState<string | null>(null)

  // 🔍 მივიღოთ მძღოლის მონაცემები როცა მოდალი იხსნება
  useEffect(() => {
    if (isOpen && order) {
      fetchDriverData()
    }
  }, [isOpen, order])

  const fetchDriverData = async () => {
    if (!order) return

    try {
      let driver = null
      let chatId = null

      if (order.driver_type === 'external' && order.external_driver_id) {
        const { data } = await supabase
          .from('external_drivers')
          .select('id, full_name, phone, telegram_chat_id, telegram_username')
          .eq('id', order.external_driver_id)
          .single()
        
        driver = data
        chatId = data?.telegram_chat_id
      } 
      else if (order.driver_id) {
        const { data } = await supabase
          .from('drivers')
          .select('id, full_name, phone, telegram_chat_id, telegram_username')
          .eq('id', order.driver_id)
          .single()
        
        driver = data
        chatId = data?.telegram_chat_id
      }

      setDriverData(driver)
      setTelegramChatId(chatId)
      
      console.log('📱 [MODAL] Driver data loaded:', { 
        name: driver?.full_name, 
        telegram_chat_id: chatId 
      })
    } catch (error) {
      console.error('❌ Failed to fetch driver data:', error)
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
    if (selectedChannels.length === 0) return
    setSending(true)
    setSendResult(null)
    
    try {
      await onSend(selectedChannels)
      setSendResult({ success: true, message: '✅ შეტყობინება წარმატებით გაიგზავნა!' })
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (err: any) {
      setSendResult({ success: false, message: `❌ ${err.message || 'შეცდომა გაგზავნისას'}` })
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
              <div>
                <span className="text-gray-500 text-xs block mb-1">📍 მარშრუტი:</span>
                <p className="font-medium">{order?.pickup_city || order?.pickup_address?.slice(0,20)} → {order?.delivery_city || order?.delivery_address?.slice(0,20)}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs block mb-1">👨‍✈️ მძღოლი:</span>
                <p className="font-medium">
                  {driverData?.full_name || order?.drivers?.full_name || order?.external_drivers?.full_name || '–'}
                  {order?.driver_type === 'external' && <span className="text-[10px] px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded ml-1">გარე</span>}
                </p>
              </div>
              <div>
                <span className="text-gray-500 text-xs block mb-1">🚛 მანქანა:</span>
                <p className="font-medium">{order?.vehicles?.plate_number || order?.external_vehicles?.plate_number || '–'}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs block mb-1">💰 თანხა:</span>
                <p className="font-bold text-green-600">{order?.price} {order?.currency}</p>
              </div>
            </div>
          </section>

          {/* 📡 გაგზავნის არხები */}
          <section className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">📡 გაგზავნის არხები</h3>
            <div className="space-y-2">
              {channels.map(channel => {
                const isSelected = selectedChannels.includes(channel.id)
                const isDisabled = !channel.available
                
                return (
                  <label 
                    key={channel.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                      isSelected && !isDisabled
                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                        : isDisabled
                          ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                          : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={() => toggleChannel(channel.id)}
                      disabled={isDisabled}
                      className="w-4 h-4 accent-blue-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{channel.icon}</span>
                        <span className="font-medium text-gray-900">{channel.name}</span>
                        {channel.soon && <span className="text-[10px] px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">მალე</span>}
                        {!channel.available && !channel.soon && <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">მიუწვდომელი</span>}
                      </div>
                      <div className="ml-6 mt-0.5">
                        <p className="text-xs text-gray-500">{channel.desc}</p>
                        {/* ✅ აქ ვაჩვენებთ Telegram Chat ID-ს */}
                        {channel.id === 'telegram' && channel.chatId && (
                          <p className="text-[10px] text-blue-600 font-mono mt-0.5">📱 Chat ID: <code className="bg-blue-100 px-1 rounded">{channel.chatId}</code></p>
                        )}
                        {channel.id === 'email' && order?.client_email && (
                          <p className="text-[10px] text-blue-600 mt-0.5">📧 {order.client_email}</p>
                        )}
                      </div>
                    </div>
                  </label>
                )
              })}
            </div>
          </section>

          {/* 📊 გაგზავნის ისტორია/ლოგები */}
          {logs.length > 0 && (
            <section className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">📊 გაგზავნის ისტორია</h3>
              <div className="space-y-2">
                {logs.map((log, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border border-gray-100 text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        log.status === 'sent' ? 'bg-green-500' : log.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                      }`}></span>
                      <span className="font-medium">{log.channel}</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        log.status === 'sent' ? 'bg-green-100 text-green-700' : log.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {log.status === 'sent' ? 'გაიგზავნა' : log.status === 'failed' ? 'ვერ გაიგზავნა' : 'ლოდინში'}
                      </span>
                      <p className="text-[10px] text-gray-400 mt-0.5">{new Date(log.timestamp).toLocaleString('ka-GE')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

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
            disabled={sending || selectedChannels.length === 0}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold transition flex items-center gap-2 shadow-lg shadow-blue-500/20"
          >
            {sending ? <><span className="animate-spin">⏳</span> იგზავნება...</> : <>📢 გაგზავნა ({selectedChannels.length})</>}
          </button>
        </div>

      </div>
    </div>
  )
}