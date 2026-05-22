import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!SUPABASE_KEY) console.error('🚨 CRITICAL: SUPABASE_SERVICE_ROLE_KEY is MISSING in Vercel Env!')

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// 🔘 ღილაკების კონფიგურაცია
const BUTTONS = {
  // თავდაპირველი ღილაკები (მიღება/უარყოფა)
  initial: [
    [{ text: '✅ მივიღე', callback_data: 'acc:{id}' }, { text: '❌ უარყოფა', callback_data: 'rej:{id}' }]
  ],
  // აქტიური სამუშაო ღილაკები (ჩატვირთვა/საზღვარი/ჩაბარება)
  active: [
    [{ text: '📦 ჩავიტვირთე', callback_data: 'loaded:{id}' }, { text: '🌍 საზღვარზე', callback_data: 'border:{id}' }],
    [{ text: '🏁 ჩავაბარე', callback_data: 'delivered:{id}' }]
  ]
}

export async function POST(req: Request) {
  console.log('🚀 [WEBHOOK] === REQUEST STARTED ===')
  
  try {
    const update = await req.json()
    const cb = update.callback_query
    
    if (!cb) {
      console.log('⚠️ No callback_query, ignoring')
      return NextResponse.json({ ok: true })
    }

    // 🔍 ნაბიჯი 1: პარსინგი
    console.log('📥 callback_data:', cb.data)
    console.log('👤 User:', cb.from?.first_name, cb.from?.username)

    const [action, orderId] = cb.data?.split(':') || []
    console.log(`🔘 Parsed: action="${action}", orderId="${orderId}"`)

    if (!orderId) {
      console.error('❌ Missing orderId')
      return NextResponse.json({ ok: false, error: 'Missing orderId' }, { status: 400 })
    }

    // 🔍 ნაბიჯი 2: ვიპოვოთ შეკვეთა
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

    const driver = order.drivers || order.external_drivers
    const driverName = driver?.full_name || 'უცნობი'
    const trackingCode = order.tracking_code
    const originalText = cb.message.text

    console.log('✅ Order found:', { tracking_code: trackingCode, driver: driverName })

    // 📦 ნაბიჯი 3: მოქმედების დამუშავება
    let dbUpdate: any = {}
    let dashboardTitle = ''
    let dashboardMessage = ''
    let replyText = ''
    let newKeyboard: any = null // null = არ შევცვალოთ, {} = წავშალოთ, {inline_keyboard: ...} = ახალი

    switch (action) {
      // === თავდაპირველი მოქმედებები ===
      case 'acc': // ✅ მივიღე
        dbUpdate = { 
          status: 'confirmed', 
          driver_response: 'accepted', 
          driver_confirmed_at: new Date().toISOString() 
        }
        replyText = `✅ <b>მიღებულია!</b>\nახლა გამოჩნდება სამუშაო ღილაკები.`
        dashboardTitle = '✅ მძღოლმა მიიღო შეკვეთა'
        dashboardMessage = `👨‍✈️ <b>${driverName}</b>-მა მიიღო <code>${trackingCode}</code>`
        // ვაჩვენებთ ახალ ღილაკებს
        newKeyboard = { inline_keyboard: BUTTONS.active.map(row => 
          row.map(btn => ({ ...btn, callback_data: btn.callback_data.replace('{id}', orderId) }))
        )}
        break

      case 'rej': // ❌ უარყოფა
        dbUpdate = { 
          status: 'rejected', 
          driver_response: 'rejected', 
          driver_rejected_at: new Date().toISOString(),
          driver_id: null 
        }
        replyText = `❌ <b>უარყოფილია.</b>\nადმინისტრატორი დაგიკავშირდებათ.`
        dashboardTitle = '❌ მძღოლმა უარყო შეკვეთა'
        dashboardMessage = `👨‍✈️ <b>${driverName}</b>-მა უარყო <code>${trackingCode}</code>`
        // ვშლით ყველა ღილაკს
        newKeyboard = { inline_keyboard: [] }
        break

      // === აქტიური სამუშაო ღილაკები ===
      case 'loaded': // 📦 ჩავიტვირთე
        dbUpdate = { loaded_at: new Date().toISOString() }
        replyText = `📦 <b>ტვირთი ჩატვირთულია!</b>\nდეშბორდზე დაფიქსირდა.`
        dashboardTitle = '📦 ტვირთი ჩაიტვირთა'
        dashboardMessage = `👨‍✈️ <b>${driverName}</b>-მა ჩატვირთა <code>${trackingCode}</code>`
        // ღილაკებს ვტოვებთ (მძღოლს კიდევ უნდა შეეძლოს სხვა მოქმედებები)
        newKeyboard = null
        break

      case 'border': // 🌍 საზღვარზე ვარ
        dbUpdate = { border_crossing_at: new Date().toISOString() }
        replyText = `🌍 <b>საზღვარზე ხარ!</b>\nდეშბორდზე დაფიქსირდა.`
        dashboardTitle = '🌍 მძღოლი საზღვარზეა'
        dashboardMessage = `👨‍✈️ <b>${driverName}</b> კვეთს საზღვარს (<code>${trackingCode}</code>)`
        newKeyboard = null
        break

      case 'delivered': // 🏁 ჩავაბარე
        dbUpdate = { 
          status: 'delivered', 
          delivered_at: new Date().toISOString() 
        }
        replyText = `🏁 <b>წარმატებით ჩააბარე!</b>\nდიდი მადლობა თანამშრომლობისთვის.`
        dashboardTitle = '🏁 შეკვეთა ჩაბარებულია'
        dashboardMessage = `👨‍✈️ <b>${driverName}</b>-მა მიაწოდა <code>${trackingCode}</code>`
        // სამუშაო დასრულებულია → ვშლით ყველა ღილაკს
        newKeyboard = { inline_keyboard: [] }
        break

      default:
        console.warn('⚠️ Unknown action:', action)
        return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 })
    }

    // 🔄 ნაბიჯი 4: ბაზის განახლება
    if (Object.keys(dbUpdate).length > 0) {
      console.log('🔄 Updating orders table:', dbUpdate)
      const { error: updateErr } = await supabase
        .from('orders')
        .update(dbUpdate)
        .eq('id', orderId)

      if (updateErr) {
        console.error('❌ [DB] Update failed:', JSON.stringify(updateErr))
      } else {
        console.log('✅ [DB] Order updated successfully')
      }
    }

    // 🔔 ნაბიჯი 5: დეშბორდის შეტყობინების ჩაწერა
    if (dashboardTitle) {
      console.log('🔔 Inserting dashboard notification...')
      const { error: notifErr } = await supabase.from('notifications').insert({
        channel: 'dashboard',
        status: 'unread',
        title: dashboardTitle,
        message: dashboardMessage,
        order_id: orderId,
        driver_id: order.driver_type === 'internal' ? driver?.id : null,
        external_driver_id: order.driver_type === 'external' ? driver?.id : null,
        metadata: { 
          action: action, 
          responded_at: new Date().toISOString(),
          tracking_code: trackingCode
        },
        created_at: new Date().toISOString()
      })
      
      if (notifErr) {
        console.error('❌ Notification insert failed:', notifErr)
      } else {
        console.log('✅ Dashboard notification inserted')
      }
    }

    // 📢 ნაბიჯი 6: ტელეგრამის პასუხი (ღილაკების რედაქტირება)
    try {
      const editPayload: any = {
        chat_id: cb.from.id,
        message_id: cb.message.message_id,
        text: `${originalText}\n\n🔄 ${replyText}`,
        parse_mode: 'HTML'
      }
      
      // თუ newKeyboard არის მითითებული, ვცვლით ღილაკებს
      if (newKeyboard !== null) {
        editPayload.reply_markup = newKeyboard
      }
      // თუ newKeyboard === null, ძველ ღილაკებს ვტოვებთ (არ ვაგზავნით reply_markup-ს)

      const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editPayload)
      })
      
      const result = await response.json()
      console.log('✏️ Telegram edit result:', result.ok ? '✅' : '❌', result)
    } catch (e) {
      console.error('❌ Telegram edit failed:', e)
    }

    console.log('🏁 [WEBHOOK] === REQUEST COMPLETED ===\n')
    return NextResponse.json({ ok: true })

  } catch (err: any) {
    console.error('💥 CRITICAL WEBHOOK ERROR:', err)
    console.error('💥 Stack:', err.stack)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}