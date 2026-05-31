// src/app/api/telegram/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ============================================================================
// 🔐 კონფიგურაცია (შენი .env-ის მიხედვით)
// ============================================================================
// ⚠️ შენიშვნა: NEXT_PUBLIC_TELEGRAM_BOT_TOKEN გამოყენებულია, რადგან შენს .env-ში ასეა.
// პროდაქშენში რეკომენდებულია TELEGRAM_BOT_TOKEN (NEXT_PUBLIC_ გარეშე) უსაფრთხოებისთვის.
const BOT_TOKEN = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!BOT_TOKEN) console.error('🚨 CRITICAL: NEXT_PUBLIC_TELEGRAM_BOT_TOKEN is MISSING in .env!')
if (!SUPABASE_KEY) console.error('🚨 CRITICAL: NEXT_PUBLIC_SUPABASE_ANON_KEY is MISSING in .env!')

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// ============================================================================
// 🔄 პროგრესული ღილაკების კონფიგურაცია (State Machine)
// ============================================================================
type StageKey = 'initial' | 'accepted' | 'en_route' | 'loaded' | 'in_transit' | 'border_crossed' | 'arrived' | 'delivered'

interface StageConfig {
  nextAction: string
  nextStage: StageKey | null
  buttonText: string
  dbField: string
  orderStatus?: string
  trackingEventType: string
  dashboardTitle: string
  dashboardMessage: (driverName: string, trackingCode: string) => string
  replyText: string
  shouldRemoveButtons: boolean
}

const STAGES: Record<StageKey, StageConfig> = {
  initial: {
    nextAction: 'acc',
    nextStage: 'accepted',
    buttonText: '✅ მივიღე',
    // ✅ ✅ ✅ განახლებული: dbField ახლა არის driver_confirmed_at (თარიღისთვის)
    // driver_response ცალკე დაყენდება ქვემოთ კოდში
    dbField: 'driver_confirmed_at',
    orderStatus: 'confirmed',
    trackingEventType: 'accepted',
    dashboardTitle: '✅ მძღოლმა მიიღო შეკვეთა',
    dashboardMessage: (name, code) => `👨‍✈️ <b>${name}</b>-მა მიიღო შეკვეთა <code>${code}</code>`,
    replyText: '✅ <b>მიღებულია!</b>\nახლა გამოჩნდება სამუშაო ღილაკები.',
    shouldRemoveButtons: false
  },
  accepted: {
    nextAction: 'en_route',
    nextStage: 'en_route',
    buttonText: '🚗 მივდივარ ატვირთვაზე',
    dbField: 'en_route_at',
    trackingEventType: 'en_route_pickup',
    dashboardTitle: '🚗 მძღოლი მიემართება ატვირთვას',
    dashboardMessage: (name, code) => `👨‍✈️ <b>${name}</b> მიდის ატვირთვის ადგილას (<code>${code}</code>)`,
    replyText: '🚗 <b>გზაში ხარ ატვირთვისკენ!</b>\nდეშბორდზე დაფიქსირდა.',
    shouldRemoveButtons: false
  },
  en_route: {
    nextAction: 'loaded',
    nextStage: 'loaded',
    buttonText: '📦 ჩავიტვირთე',
    dbField: 'loaded_at',
    trackingEventType: 'loaded',
    dashboardTitle: '📦 ტვირთი ჩაიტვირთა',
    dashboardMessage: (name, code) => `👨‍✈️ <b>${name}</b>-მა ჩატვირთა ტვირთი (<code>${code}</code>)`,
    replyText: '📦 <b>ტვირთი ჩატვირთულია!</b>\nდეშბორდზე დაფიქსირდა.',
    shouldRemoveButtons: false
  },
  loaded: {
    nextAction: 'in_transit',
    nextStage: 'in_transit',
    buttonText: '🛣️ გზაში ვარ',
    dbField: 'in_transit_at',
    orderStatus: 'in_transit',
    trackingEventType: 'in_transit',
    dashboardTitle: '🛣️ მძღოლი გზაშია',
    dashboardMessage: (name, code) => `👨‍✈️ <b>${name}</b> ტრანზიტშია (<code>${code}</code>)`,
    replyText: '🛣️ <b>გზაში ხარ!</b>\nდეშბორდზე დაფიქსირდა.',
    shouldRemoveButtons: false
  },
  in_transit: {
    nextAction: 'border',
    nextStage: 'border_crossed',
    buttonText: '🌍 საზღვარი გადავკვეთე',
    dbField: 'border_crossing_at',
    trackingEventType: 'border_crossed',
    dashboardTitle: '🌍 მძღოლი საზღვარზეა',
    dashboardMessage: (name, code) => `👨‍✈️ <b>${name}</b> კვეთს საზღვარს (<code>${code}</code>)`,
    replyText: '🌍 <b>საზღვარი გადაკვეთილია!</b>\nდეშბორდზე დაფიქსირდა.',
    shouldRemoveButtons: false
  },
  border_crossed: {
    nextAction: 'arrived',
    nextStage: 'arrived',
    buttonText: '📍 მივედი დანიშნულებას',
    dbField: 'arrived_at',
    trackingEventType: 'arrived',
    dashboardTitle: '📍 მძღოლი ადგილზეა',
    dashboardMessage: (name, code) => `👨‍✈️ <b>${name}</b> მივიდა დანიშნულების ადგილას (<code>${code}</code>)`,
    replyText: '📍 <b>ადგილზე ხარ!</b>\nდეშბორდზე დაფიქსირდა.',
    shouldRemoveButtons: false
  },
  arrived: {
    nextAction: 'delivered',
    nextStage: 'delivered',
    buttonText: '✅ ჩავაბარე / დასრულება',
    dbField: 'delivered_at',
    orderStatus: 'delivered',
    trackingEventType: 'delivered',
    dashboardTitle: '🏁 შეკვეთა ჩაბარებულია',
    dashboardMessage: (name, code) => `👨‍✈️ <b>${name}</b>-მა წარმატებით ჩააბარა <code>${code}</code>`,
    replyText: '🏁 <b>წარმატებით ჩააბარე!</b>\nდიდი მადლობა თანამშრომლობისთვის.',
    shouldRemoveButtons: true
  },
  delivered: {
    // Terminal state - no further actions
    nextAction: '',
    nextStage: null,
    buttonText: '',
    dbField: '',
    trackingEventType: 'completed',
    dashboardTitle: '✅ შეკვეთა დასრულებულია',
    dashboardMessage: (name, code) => `👨‍✈️ <b>${name}</b>-მა დაასრულა <code>${code}</code>`,
    replyText: '✅ <b>შეკვეთა დასრულებულია!</b>',
    shouldRemoveButtons: true
  }
}

// ============================================================================
// 🛠️ Helper ფუნქციები
// ============================================================================

// 📩 პასუხი callback_query-ზე (მოკლე ტექსტი ზემოთ)
async function answerCallback(callbackQueryId: string, text: string, showAlert: boolean = false) {
  if (!BOT_TOKEN) return
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackQueryId, text, show_alert: showAlert })
    })
  } catch (e) { console.error('❌ Failed to answer callback:', e) }
}

// 💬 ტექსტური მესიჯის გაგზავნა
async function sendTelegramMessage(chatId: string, text: string, parseMode: 'HTML' | 'Markdown' = 'HTML') {
  if (!BOT_TOKEN) return
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode, disable_web_page_preview: true })
    })
  } catch (e) { console.error('❌ Failed to send message:', e) }
}

// ✏️ მესიჯის რედაქტირება (ღილაკების ჩანაცვლება)
async function editTelegramMessage(chatId: number, messageId: number, newText: string, newKeyboard?: any) {
  if (!BOT_TOKEN) return
  try {
    const payload: any = {
      chat_id: chatId,
      message_id: messageId,
      text: newText,
      parse_mode: 'HTML'
    }
    if (newKeyboard !== undefined) {
      payload.reply_markup = newKeyboard === null ? { inline_keyboard: [] } : newKeyboard
    }
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  } catch (e) { console.error('❌ Failed to edit message:', e) }
}

// 🔍 მძღოლის ვერიფიკაცია + შეკვეთის მოძიება
async function verifyDriverAndOrder(chatId: string, orderId: string) {
  // 1. ვიპოვოთ მძღოლი chat_id-ით
  const { data: driver, error: driverErr } = await supabase
    .from('drivers')
    .select('id, full_name, telegram_chat_id')
    .eq('telegram_chat_id', chatId.toString())
    .single()

  if (driverErr || !driver) {
    return { error: 'Driver not found or not linked to this Telegram account' }
  }

  // 2. ვიპოვოთ შეკვეთა და დავრწმუნდეთ რომ ეს მძღოლი ეკუთვნის
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('*, drivers:driver_id(id, full_name), external_drivers:external_driver_id(id, full_name), driver_type')
    .eq('id', orderId)
    .single()

  if (orderErr || !order) {
    return { error: 'Order not found' }
  }

  // 3. უსაფრთხოების შემოწმება: მძღოლი უნდა ეკუთვნოდეს ამ შეკვეთას
  const assignedDriverId = order.driver_type === 'internal' ? order.drivers?.id : order.external_drivers?.id
  if (assignedDriverId !== driver.id) {
    return { error: 'This order is not assigned to you' }
  }

  return { driver, order }
}

// 📝 tracking_events-ის ჩაწერა
async function logTrackingEvent(orderId: string | null, driverId: string, eventType: string, eventData: any = {}) {
  if (!orderId) return // ოფციონალური: შეიძლება ჩავწეროთ უკვე არსებობის გარეშეც
  
  const { error } = await supabase.from('tracking_events').insert({
    order_id: orderId,
    driver_id: driverId,
    event_type: eventType,
    source: 'telegram',
    event_data: eventData,
    created_at: new Date().toISOString()
  })
  if (error) console.error('❌ Failed to log tracking event:', error)
  else console.log(`✅ Tracking event logged: ${eventType}`)
}

// 🔔 dashboard notification-ის ჩაწერა
async function logDashboardNotification(orderId: string | null, driverId: string | null, driverType: string, title: string, message: string, metadata: any = {}) {
  const { error } = await supabase.from('notifications').insert({
    channel: 'dashboard',
    status: 'unread',
    title,
    message,
    order_id: orderId,
    driver_id: driverType === 'internal' ? driverId : null,
    external_driver_id: driverType === 'external' ? driverId : null,
    metadata: { ...metadata, responded_at: new Date().toISOString() },
    created_at: new Date().toISOString()
  })
  if (error) console.error('❌ Failed to log dashboard notification:', error)
  else console.log('✅ Dashboard notification logged')
}

// ============================================================================
// 🎮 ჰენდლერი: Callback Query (ღილაკების დამუშავება)
// ============================================================================
async function handleCallbackQuery(callback: any) {
  const callbackQueryId = callback.id
  const driverChatId = callback.from.id.toString()
  const data = callback.data // ფორმატი: "action:ORDER_ID"

  console.log(`🎮 [CALLBACK] Driver ${driverChatId} pressed: ${data}`)

  // პარსინგი
  const parts = data?.split(':') || []
  const action = parts[0]
  const orderId = parts[1]

  if (!orderId || !action) {
    await answerCallback(callbackQueryId, '❌ არასწორი ფორმატი', true)
    return NextResponse.json({ ok: false, error: 'Invalid callback data' }, { status: 400 })
  }

  // ვერიფიკაცია
  const verification = await verifyDriverAndOrder(driverChatId, orderId)
  if (verification.error) {
    console.error('❌ Verification failed:', verification.error)
    await answerCallback(callbackQueryId, `⚠️ ${verification.error}`, true)
    return NextResponse.json({ ok: false, error: verification.error }, { status: 403 })
  }

  const { driver, order } = verification
  // ✅ ✅ ✅ FIX: დავამატეთ ! (non-null assertion) TypeScript-ის შეცდომის გამოსასწორებლად
  const driverName = driver!.full_name
  const trackingCode = order!.tracking_code
  const originalText = callback.message?.text || `🚛 შეკვეთა ${trackingCode}`

  // ვიპოვოთ მიმდინარე სტატუსი/ეტაპი
  let currentStage: StageKey = 'initial'
  if (order!.driver_response === 'accepted') currentStage = 'accepted'
  if (order!.en_route_at) currentStage = 'en_route'
  if (order!.loaded_at) currentStage = 'loaded'
  if (order!.in_transit_at) currentStage = 'in_transit'
  if (order!.border_crossing_at) currentStage = 'border_crossed'
  if (order!.arrived_at) currentStage = 'arrived'
  if (order!.delivered_at) currentStage = 'delivered'

  const stageConfig = STAGES[currentStage]

  // შევამოწმოთ რომ მოქმედება ემთხვევა მოსალოდნელს
  if (action !== stageConfig.nextAction) {
    await answerCallback(callbackQueryId, '⚠️ ეს ნაბიჯი უკვე გავლილია ან არასწორია', true)
    return NextResponse.json({ ok: false, error: 'Action mismatch' }, { status: 400 })
  }

  try {
    // 1️⃣ განვაახლოთ შეკვეთა ბაზაში
    const dbUpdate: Record<string, any> = {
      [stageConfig.dbField]: new Date().toISOString()
    }
    if (stageConfig.orderStatus) {
      dbUpdate.status = stageConfig.orderStatus
    }

    // ✅ ✅ ✅ FIX: დავამატეთ driver_response-ის სწორი დაყენება
    // თუ მძღოლმა დაადასტურა ან უარყო, ვაყენებთ შესაბამის მნიშვნელობას
    if (action === 'acc') {
      dbUpdate.driver_response = 'accepted'
    } else if (action === 'rej') {
      dbUpdate.driver_response = 'rejected'
    }

    const { error: updateErr } = await supabase
      .from('orders')
      .update(dbUpdate)
      .eq('id', orderId)

    if (updateErr) throw updateErr
    console.log(`✅ Order ${orderId} updated: ${stageConfig.dbField}, driver_response: ${dbUpdate.driver_response || 'unchanged'}`)

    // 2️⃣ ჩავწეროთ tracking_events
    await logTrackingEvent(orderId, driver!.id, stageConfig.trackingEventType, {
      action,
      stage: currentStage,
      next_stage: stageConfig.nextStage,
      callback_query_id: callbackQueryId
    })

    // 3️⃣ ჩავწეროთ dashboard notification
    await logDashboardNotification(
      orderId,
      driver!.id,
      order!.driver_type || 'internal',
      stageConfig.dashboardTitle,
      stageConfig.dashboardMessage(driverName, trackingCode),
      { action, stage: currentStage }
    )

    // 4️⃣ გავუგზავნოთ პასუხი მძღოლს + განვაახლოთ ღილაკები
    const newMessageText = `${originalText}\n\n🔄 ${stageConfig.replyText}`
    
    let newKeyboard: any = undefined
    if (stageConfig.shouldRemoveButtons) {
      // ბოლო ეტაპი → ვშლით ყველა ღილაკს
      newKeyboard = { inline_keyboard: [] }
    } else if (stageConfig.nextStage && STAGES[stageConfig.nextStage]) {
      // გადავდივართ შემდეგ ეტაპზე → ვაჩვენებთ ახალ ღილაკს
      const nextStage = STAGES[stageConfig.nextStage]
      newKeyboard = {
        inline_keyboard: [[
          { text: nextStage.buttonText, callback_data: `${nextStage.nextAction}:${orderId}` }
        ]]
      }
    }
    // თუ newKeyboard === undefined, ძველ ღილაკებს ვტოვებთ (არ ვაგზავნით reply_markup)

    await editTelegramMessage(callback.from.id, callback.message.message_id, newMessageText, newKeyboard)
    await answerCallback(callbackQueryId, '✅ განახლდა!', false)

    console.log(`✅ [SUCCESS] Stage ${currentStage} → ${stageConfig.nextStage || 'END'} for order ${orderId}`)
    return NextResponse.json({ ok: true })

  } catch (error: any) {
    console.error('❌ [CALLBACK] Processing error:', error)
    await answerCallback(callbackQueryId, '❌ სისტემური შეცდომა', true)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}

// ============================================================================
// 🆘 ჰენდლერი: /sos კომანდა (პრობლემა / დახმარება)
// ============================================================================
async function handleSosCommand(message: any) {
  const chatId = message.from.id.toString()
  const firstName = message.from.first_name
  const text = message.text // /sos ან დამატებითი ტექსტი

  console.log(`🆘 [SOS] Request from: ${firstName} [${chatId}]`)

  // ვიპოვოთ მძღოლი
  const { data: driver, error: driverErr } = await supabase
    .from('drivers')
    .select('id, full_name')
    .eq('telegram_chat_id', chatId)
    .single()

  if (driverErr || !driver) {
    await sendTelegramMessage(chatId, '⚠️ თქვენ არ ხართ რეგისტრირებული როგორც მძღოლი სისტემაში.\nგთხოვთ დაუკავშირდეთ ადმინისტრატორს.')
    return NextResponse.json({ ok: true })
  }

  // ვიპოვოთ აქტიური შეკვეთა (თუ არის)
  const { data: activeOrder } = await supabase
    .from('orders')
    .select('id, tracking_code, status')
    .eq('driver_id', driver.id)
    .in('status', ['confirmed', 'in_transit', 'arrived'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // ჩავწეროთ tracking_event
  await logTrackingEvent(activeOrder?.id || null, driver.id, 'issue_reported', {
    source_command: '/sos',
    user_message: text,
    order_tracking_code: activeOrder?.tracking_code
  })

  // ჩავწეროთ dashboard notification (პრიორიტეტული!)
  await logDashboardNotification(
    activeOrder?.id || null,
    driver.id,
    (activeOrder as any)?.driver_type || 'internal',
    '🆨 SOS ალერტი! პრობლემა დაფიქსირდა',
    `👨‍✈️ <b>${driver.full_name}</b>-მა მოითხოვა დახმარება${activeOrder ? ` შეკვეთაზე <code>${activeOrder.tracking_code}</code>` : ''}.\n\n💬 მესიჯი: <code>${text}</code>`,
    { type: 'sos_alert', urgent: true }
  )

  // პასუხი მძღოლს
  await sendTelegramMessage(chatId, 
    `⚠️ <b>პრობლემა დაფიქსირდა!</b>\n\n` +
    `👨‍💼 დისპეტჩერი მალე დაგიკავშირდებათ.\n` +
    `📍 თუ საგანგებო სიტუაციაა, დაურეკეთ პირდაპირ: +995 555 123 456`
  )

  console.log(`✅ [SOS] Logged for driver ${driver.id}`)
  return NextResponse.json({ ok: true })
}

// ============================================================================
// 🚀 ჰენდლერი: /start კომანდა (მძღოლის დაკავშირება)
// ============================================================================
async function handleStartCommand(message: any) {
  const chatId = message.from.id.toString()
  const firstName = message.from.first_name
  const username = message.from.username

  console.log(`🚀 [START] Connection request from: ${firstName} (@${username}) [${chatId}]`)

  // ვიპოვოთ თუ უკვე რეგისტრირებულია
  const { data: existingDriver } = await supabase
    .from('drivers')
    .select('id, full_name, telegram_chat_id')
    .eq('telegram_chat_id', chatId)
    .single()

  if (existingDriver) {
    await sendTelegramMessage(chatId, 
      `👋 გამარჯობა, <b>${existingDriver.full_name}</b>!\n\n` +
      `✅ უკვე დაკავშირებული ხარ Logistics OS-თან.\n` +
      `ახლა შეგიძლია მიიღო შეკვეთები და განაახლო სტატუსი ღილაკებით.\n\n` +
      `📋 ბრძანებები:\n` +
      `/sos - 🆨 პრობლემა / დახმარება`
    )
  } else {
    // ახალი მომხმარებელი - ინსტრუქცია
    await sendTelegramMessage(chatId, 
      `👋 გამარჯობა, <b>${firstName}</b>!\n\n` +
      `🤖 ეს არის <b>Logistics OS</b> ბოტი მძღოლებისთვის.\n\n` +
      `🔹 თუ ხარ რეგისტრირებული მძღოლი, დისპეტჩერმა უნდა მიგაბას ამ ანგარიშს.\n` +
      `🔹 დაკავშირების შემდეგ მიიღებ შეტყობინებებს ახალ შეკვეთებზე.\n\n` +
      `📋 ხელმისაწვდომი ბრძანებები:\n` +
      `/sos - 🆨 პრობლემა / დახმარება`
    )
  }

  return NextResponse.json({ ok: true })
}

// ============================================================================
// 📥 POST Handler - მთავარი entry point
// ============================================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📡 [WEBHOOK] Received update:', JSON.stringify({
      update_id: body.update_id,
      has_callback: !!body.callback_query,
      has_message: !!body.message,
      message_text: body.message?.text
    }).slice(0, 200))

    // 1️⃣ Callback Query (ღილაკების დამუშავება)
    if (body.callback_query) {
      return await handleCallbackQuery(body.callback_query)
    }

    // 2️⃣ Message Commands (/start, /sos, etc.)
    if (body.message?.text) {
      const text = body.message.text.trim()
      
      if (text === '/start') {
        return await handleStartCommand(body.message)
      }
      if (text === '/sos' || text.toLowerCase().includes('sos') || text.toLowerCase().includes('პრობლემა')) {
        return await handleSosCommand(body.message)
      }
      
      // ნებისმიერი სხვა ტექსტი - ლოგი
      console.log(`💬 [MESSAGE] User ${body.message.from.id}: ${text}`)
      // აქ შეიძლება დაემატოს Chatbot ლოგიკა მომავალში
      return NextResponse.json({ ok: true })
    }

    // 3️⃣ სხვა განახლებები (შეიძლება დამატებითი ლოგიკა მომავალში)
    return NextResponse.json({ ok: true, message: 'No action needed' })

  } catch (error: any) {
    console.error('💥 CRITICAL WEBHOOK ERROR:', error)
    console.error('💥 Stack:', error.stack)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}

// ============================================================================
// 🔍 GET Handler - Webhook სტატუსის შესამოწმებლად
// ============================================================================
export async function GET() {
  if (!BOT_TOKEN) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_TELEGRAM_BOT_TOKEN missing in environment' }, { status: 500 })
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`)
    const info = await res.json()

    return NextResponse.json({
      status: 'ok',
      webhook: info.result,
      message: 'Webhook endpoint is running',
      timestamp: new Date().toISOString()
    })
  } catch (e: any) {
    return NextResponse.json({ status: 'error', message: 'Failed to check webhook', error: e.message })
  }
}