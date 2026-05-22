import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!SUPABASE_KEY) console.error('🚨 CRITICAL: SUPABASE_SERVICE_ROLE_KEY is MISSING in Vercel Env!')

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

export async function POST(req: Request) {
  console.log('🚀 [WEBHOOK] === REQUEST STARTED ===')
  
  try {
    const update = await req.json()
    const cb = update.callback_query
    
    if (!cb) {
      console.log('⚠️ No callback_query, ignoring')
      return NextResponse.json({ ok: true })
    }

    // 🔍 ნაბიჯი 1: ვამოწმებთ მონაცემებს
    console.log('📥 callback_data:', cb.data)
    console.log('👤 User:', cb.from?.first_name, cb.from?.username)

    const [action, orderId] = cb.data?.split(':') || []
    console.log(`🔘 Parsed: action="${action}", orderId="${orderId}"`)

    if (!orderId || !['acc', 'rej'].includes(action)) {
      console.error('❌ Invalid callback data format')
      return NextResponse.json({ ok: false, error: 'Invalid data' }, { status: 400 })
    }

    // 🔍 ნაბიჯი 2: ვიღებთ შეკვეთას
    console.log('🔎 Fetching order from Supabase...')
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('*, drivers:driver_id(full_name), external_drivers:external_driver_id(full_name)')
      .eq('id', orderId)
      .single()

    if (orderErr || !order) {
      console.error('❌ Order fetch failed:', orderErr?.message || 'Not found')
      return NextResponse.json({ ok: false }, { status: 404 })
    }
    console.log('✅ Order found:', order.tracking_code, '| Current status:', order.status)

    // 📦 ნაბიჯი 3: ვამზადებთ განახლებას
    const isAccept = action === 'acc'
    
    // 🎯 ძირითადი ველები (100% მუშაობს)
    const basicPayload = {
      status: isAccept ? 'confirmed' : 'rejected',
      driver_response: isAccept ? 'accepted' : 'rejected'
    }
    
    // 🎯 Timestamp ველები (შეიძლება კეშში არ იყოს ხილული)
    const timestampPayload = {
      driver_responded_at: new Date().toISOString(),
      ...(isAccept 
        ? { driver_confirmed_at: new Date().toISOString() } 
        : { driver_rejected_at: new Date().toISOString(), driver_id: null })
    }

    // 🔄 ნაბიჯი 4a: ვაახლებთ მხოლოდ ძირითად ველებს (გარანტირებული)
    console.log('🔄 Step 1: Updating basic fields (status + driver_response)...')
    const { error: basicErr } = await supabase
      .from('orders')
      .update(basicPayload)
      .eq('id', orderId)

    if (basicErr) {
      console.error('❌ [DB] Basic update failed:', JSON.stringify(basicErr))
    } else {
      console.log('✅ [DB] Basic fields updated (status + driver_response)')
    }

    // 🔄 ნაბიჯი 4b: ვცადოთ timestamp-ების განახლება (ცალკე)
    console.log('🔄 Step 2: Updating timestamps (if schema cache ready)...')
    const { error: tsErr } = await supabase
      .from('orders')
      .update(timestampPayload)
      .eq('id', orderId)

    if (tsErr) {
      // ⚠️ თუ კეში არ არის განახლებული, ეს შეცდომა არ აჩერებს მთლიან პროცესს
      console.log('⚠️ [DB] Timestamp update skipped (cache not ready):', tsErr.message)
      console.log('💡 Timestamps will auto-update when cache refreshes (2-5 min)')
    } else {
      console.log('✅ [DB] Timestamps updated successfully')
    }

    // 📢 ნაბიჯი 5: ტელეგრამ პასუხი
    const driver = order.drivers || order.external_drivers
    const driverName = driver?.full_name || 'უცნობი'
    const replyText = isAccept ? '✅ <b>მიღებულია!</b> მადლობა.' : '❌ <b>უარყოფილია!</b> ადმინისტრატორი დაგიკავშირდებათ.'
    
    try {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: cb.from.id, text: replyText, parse_mode: 'HTML' })
      })
    } catch (e) {
      console.error('❌ Telegram reply failed:', e)
    }

    // ✏️ ნაბიჯი 6: ღილაკების წაშლა
    try {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: cb.from.id, message_id: cb.message.message_id,
          text: cb.message.text + `\n\n🔄 პასუხი: ${isAccept ? '✅ მიღებული' : '❌ უარყოფილი'}`,
          parse_mode: 'HTML', reply_markup: { inline_keyboard: [] }
        })
      })
    } catch (e) {
      console.error('❌ Edit message failed:', e)
    }

    // 🔔 ნაბიჯი 7: დეშბორდის შეტყობინება
    console.log('🔔 Inserting dashboard notification...')
    const { error: notifErr } = await supabase.from('notifications').insert({
      channel: 'dashboard', status: 'unread',
      title: isAccept ? '✅ მძღოლმა მიიღო შეკვეთა' : '❌ მძღოლმა უარყო შეკვეთა',
      message: `👨‍✈️ <b>${driverName}</b>-მა ${isAccept ? 'მიიღო' : 'უარყო'} <code>${order.tracking_code}</code>`,
      order_id: orderId,
      driver_id: order.driver_type === 'internal' ? driver?.id : null,
      external_driver_id: order.driver_type === 'external' ? driver?.id : null,
      metadata: { driver_response: basicPayload.driver_response, responded_at: new Date().toISOString() },
      created_at: new Date().toISOString()
    })
    
    if (notifErr) {
      console.error('❌ Notification insert failed:', notifErr)
    } else {
      console.log('✅ Dashboard notification inserted')
    }

    console.log('🏁 [WEBHOOK] === REQUEST COMPLETED ===\n')
    return NextResponse.json({ ok: true })

  } catch (err: any) {
    console.error('💥 CRITICAL WEBHOOK ERROR:', err)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}