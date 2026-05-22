import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 🔐 პირდაპირი კლიენტი (უსაფრთხოა Vercel Serverless-ისთვის)
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export async function POST(req: Request) {
  try {
    const update = await req.json()
    console.log('📥 [WEBHOOK] Received update:', JSON.stringify(update).slice(0, 150))

    if (update.callback_query) {
      const callback = update.callback_query
      const chatId = callback.from.id
      const messageId = callback.message.message_id
      const data = callback.data
      const [action, orderId] = data.split(':')

      if (!orderId) return NextResponse.json({ ok: false }, { status: 400 })

      // 🔍 ვიპოვოთ შეკვეთა
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*, drivers:driver_id(full_name), external_drivers:external_driver_id(full_name)')
        .eq('id', orderId)
        .single()

      if (orderError || !order) {
        console.error('❌ Order not found:', orderId)
        return NextResponse.json({ ok: false }, { status: 404 })
      }

      const driver = order.drivers || order.external_drivers
      const driverName = driver?.full_name || 'უცნობი'

      let dashboardTitle = '', dashboardMessage = '', replyMsg = ''

      if (action === 'acc') {
        dashboardTitle = '✅ მძღოლმა მიიღო შეკვეთა'
        dashboardMessage = `👨‍✈️ <b>${driverName}</b>-მა მიიღო <code>${order.tracking_code}</code>`
        replyMsg = '✅ <b>მიღებულია!</b> მადლობა.'
        await supabase.from('orders').update({ status: 'accepted', driver_confirmed_at: new Date().toISOString() }).eq('id', orderId)
      } else if (action === 'rej') {
        dashboardTitle = '❌ მძღოლმა უარყო შეკვეთა'
        dashboardMessage = `👨‍✈️ <b>${driverName}</b>-მა უარყო <code>${order.tracking_code}</code>`
        replyMsg = '❌ <b>უარყოფილია!</b> ადმინისტრატორი შეგეკონტაქტებათ.'
        await supabase.from('orders').update({ status: 'pending', driver_rejected_at: new Date().toISOString(), driver_id: null }).eq('id', orderId)
      }

      // 📢 1. პასუხი მძღოლს
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: replyMsg, parse_mode: 'HTML' })
      })

      // ✏️ 2. ღილაკების წაშლა
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId, message_id: messageId,
          text: callback.message.text + `\n\n🔄 <b>პასუხი:</b> ${action === 'acc' ? '✅ მიღებული' : '❌ უარყოფილი'}`,
          parse_mode: 'HTML', reply_markup: { inline_keyboard: [] }
        })
      })

      // 🚨 3. დეშბორდის შეტყობინების ჩაწერა (ახლა 100%-ით იმუშავებს)
      console.log('🔔 [WEBHOOK] Inserting dashboard notification...')
      const { error: notifError } = await supabase.from('notifications').insert({
        channel: 'dashboard',
        status: 'unread',          // ✅ 'unread' რომ ლურჯი ინდიკატორით გამოჩნდეს
        title: dashboardTitle,
        message: dashboardMessage,
        order_id: orderId,
        driver_id: order.driver_type === 'internal' ? driver?.id : null,
        external_driver_id: order.driver_type === 'external' ? driver?.id : null,
        metadata: { driver_response: action, responded_at: new Date().toISOString() },
        created_at: new Date().toISOString()
      })

      if (notifError) {
        console.error('❌ Failed to insert notification:', JSON.stringify(notifError))
      } else {
        console.log('✅ Dashboard notification inserted successfully!')
      }

      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('❌ Webhook Critical Error:', err)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}