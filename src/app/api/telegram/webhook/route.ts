import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

export async function POST(req: Request) {
  try {
    const update = await req.json()
    
    // 🔴 ეს ლოგი აუცილებლად უნდა გამოჩნდეს Console-ში როცა ღილაკს აჭერენ
    console.log('📥 [WEBHOOK] Received update:', JSON.stringify(update).slice(0, 150))
    
    if (update.callback_query) {
      const callback = update.callback_query
      const chatId = callback.from.id
      const messageId = callback.message.message_id
      const data = callback.data // მაგ: "rej:order-uuid"
      
      console.log(`🔘 [WEBHOOK] Button clicked: ${data}`)
      
      const [action, orderId] = data.split(':')
      
      if (!orderId) {
        return NextResponse.json({ ok: false, error: 'Invalid data' }, { status: 400 })
      }
      
      // 🔍 ვიპოვოთ შეკვეთა და მძღოლი
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          drivers:driver_id (id, full_name),
          external_drivers:external_driver_id (id, full_name)
        `)
        .eq('id', orderId)
        .single()
      
      if (orderError || !order) {
        console.error('❌ Order not found:', orderId)
        return NextResponse.json({ ok: false, error: 'Order not found' }, { status: 404 })
      }
      
      const driver = order.drivers || order.external_drivers
      const driverName = driver?.full_name || 'უცნობი'
      
      let message = ''
      let dashboardTitle = ''
      let dashboardMessage = ''
      
      // ✅ ლოგიკა: მიღება თუ უარყოფა
      if (action === 'acc') {
        dashboardTitle = '✅ მძღოლმა მიიღო შეკვეთა'
        dashboardMessage = `👨‍️ <b>${driverName}</b>-მა მიიღო შეკვეთა <code>${order.tracking_code}</code>`
        message = `✅ <b>შეკვეთა მიღებულია!</b>\n\nმადლობა.`
        
        // განვაახლოთ შეკვეთა
        await supabase.from('orders').update({ status: 'accepted', driver_confirmed_at: new Date().toISOString() }).eq('id', orderId)
        
      } else if (action === 'rej') {
        dashboardTitle = '❌ მძღოლმა უარყო შეკვეთა'
        dashboardMessage = `👨‍✈️ <b>${driverName}</b>-მა უარყო შეკვეთა <code>${order.tracking_code}</code>`
        message = `❌ <b>შეკვეთა უარყოფილია</b>\n\nადმინისტრატორი შეგეკონტაქტებათ.`
        
        // განვაახლოთ შეკვეთა (უკან pending-ზე)
        await supabase.from('orders').update({ status: 'pending', driver_id: null }).eq('id', orderId)
      }
      
      // 📢 1. გავუგზავნოთ მძღოლს დადასტურება
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' })
      })
      
      // ✏️ 2. წავშალოთ ღილაკები ძველ მესიჯში
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId, message_id: messageId,
          text: callback.message.text + `\n\n🔄 <b>პასუხი:</b> ${action === 'acc' ? '✅ მიღებული' : '❌ უარყოფილი'}`,
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: [] }
        })
      })
      
      // 📝 3.  მთავარი: ჩავწეროთ დეშბორდის შეტყობინება (რასაც ეძებ!)
      console.log(`🔔 [WEBHOOK] Creating Dashboard Notification for order ${orderId}`)
      const { error: notifError } = await supabase.from('notifications').insert({
        channel: 'dashboard',        // ✅ ეს არხი ჩნდება შენს ტაბში
        status: action === 'acc' ? 'delivered' : 'failed', // ✅ სტატუსი
        title: dashboardTitle,       // ✅ სათაური
        message: dashboardMessage,   // ✅ შეტყობინება
        order_id: orderId,           // ✅ კავშირი შეკვეთასთან
        driver_id: order.driver_type === 'internal' ? driver?.id : null,
        external_driver_id: order.driver_type === 'external' ? driver?.id : null,
        metadata: { driver_response: action, responded_at: new Date().toISOString() },
        created_at: new Date().toISOString()
      })
      
      if (notifError) {
        console.error('❌ Failed to insert dashboard notification:', notifError)
      } else {
        console.log('✅ Dashboard notification inserted successfully!')
      }
      
      return NextResponse.json({ ok: true })
    }
    
    return NextResponse.json({ ok: true })
    
  } catch (err: any) {
    console.error('❌ Webhook Error:', err)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}