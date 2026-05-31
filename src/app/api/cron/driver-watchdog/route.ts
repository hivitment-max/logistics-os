// src/app/api/cron/driver-watchdog/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 🔐 უსაფრთხოება: Vercel Cron მხოლოდ ამ Secret-ით უნდა შემოვიდეს
const CRON_SECRET = process.env.CRON_SECRET
const BOT_TOKEN = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
// ⚠️ მნიშვნელოვანია: გჭირდება SERVICE_ROLE_KEY რომ RLS-ის გარეშე წაიკითხოს/ჩაწეროს
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!BOT_TOKEN) console.error('🚨 Bot Token Missing')
if (!SUPABASE_KEY) console.error('🚨 Supabase Key Missing')

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ⚙️ კონფიგურაცია (წუთებში)
const REMINDER_THRESHOLD_MINUTES = 5  // 5 წუთში შეხსენება
const ESCALATION_THRESHOLD_MINUTES = 10 // 10 წუთში ესკალაცია

export async function GET(request: Request) {
  // 🔍 მივიღოთ Secret ორი წყაროდან:
  // 1. Authorization ჰედერი (სტანდარტული, Cron-ისთვის)
  // 2. URL პარამეტრი (ტესტირებისთვის, ბრაუზერში გასახსნელად)
  const authHeader = request.headers.get('Authorization')
  const url = new URL(request.url)
  const querySecret = url.searchParams.get('secret')
  
  const expectedSecret = CRON_SECRET
  const providedSecret = authHeader?.replace('Bearer ', '') || querySecret

  // 🔐 უსაფრთხოების შემოწმება
  // დეველოპმენტში შეიძლება გამოვტოვოთ, პროდაქშენში - არა
  if (process.env.NODE_ENV !== 'development' && providedSecret !== expectedSecret) {
    console.warn('🚫 Unauthorized Cron Attempt. Provided:', providedSecret ? '[REDACTED]' : 'none')
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  console.log('🐕 [WATCHDOG] Starting check...')

  const now = new Date()

  try {
    // 2️⃣ მოძებნე შეკვეთები სადაც მძღოლი მინიჭებულია მაგრამ არ უპასუხია
    const { data: pendingOrders, error } = await supabase
      .from('orders')
      .select(`
        id, 
        tracking_code, 
        driver_id, 
        external_driver_id, 
        driver_notified_at, 
        driver_reminder_at, 
        driver_escalated_at, 
        drivers!inner(telegram_chat_id, full_name)
      `)
      .in('status', ['assigned', 'confirmed']) 
      .is('driver_response', null)
      .not('driver_notified_at', 'is', null)
      .order('driver_notified_at', { ascending: true })

    if (error) throw error

    let actionsTaken = 0

    for (const order of pendingOrders || []) {
      // ✅ ✅ ✅ FIX: drivers არის მასივი (Supabase join), ვიღებთ პირველ ელემენტს
      const driver = Array.isArray(order.drivers) ? order.drivers[0] : order.drivers
      const driverName = driver?.full_name || 'მძღოლი'
      const chatId = driver?.telegram_chat_id
      
      if (!chatId) {
        console.log(`⚠️ Driver ${driverName} has no telegram_chat_id, skipping`)
        continue // თუ მძღოლს ტელეგრამი არ აქვს მიბმული, გამოვტოვოთ
      }

      const notifiedAt = new Date(order.driver_notified_at)
      const timeDiffMinutes = (now.getTime() - notifiedAt.getTime()) / (1000 * 60)

      // 🔔 ლოგიკა 1: 5 წუთი გავიდა და შეხსენება არ გაგზავნილა
      if (timeDiffMinutes >= REMINDER_THRESHOLD_MINUTES && !order.driver_reminder_at) {
        console.log(`⏰ [REMINDER] Sending to ${driverName} (${chatId}) for order ${order.tracking_code}`)
        
        // ტექსტი მძღოლისთვის
        const reminderText = `⚠️ <b>შეხსენება!</b>\n\n შეკვეთა <code>${order.tracking_code}</code> ჯერ კიდევ მოლოდინშია.\nგთხოვთ გახსნათ წინა შეტყობინება და დაადასტუროთ.`

        // გაგზავნა Telegram-ზე
        try {
          const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              chat_id: chatId, 
              text: reminderText, 
              parse_mode: 'HTML',
              disable_web_page_preview: true
            })
          })
          const tgResult = await tgRes.json()
          if (!tgRes.ok) {
            console.error(`❌ Telegram API error:`, tgResult)
          } else {
            console.log(`✅ Telegram reminder sent to ${chatId}`)
          }
        } catch (tgErr) {
          console.error(`❌ Failed to send Telegram reminder to ${chatId}`, tgErr)
        }

        // განვაახლოთ ბაზა რომ შეხსენება გაგზავნილია
        await supabase
          .from('orders')
          .update({ driver_reminder_at: now.toISOString() })
          .eq('id', order.id)
        
        actionsTaken++
      }

      // 🔥 ლოგიკა 2: 10 წუთი გავიდა და ესკალაცია არ მომხდარა
      else if (timeDiffMinutes >= ESCALATION_THRESHOLD_MINUTES && !order.driver_escalated_at) {
        console.log(`🚨 [ESCALATION] Order ${order.tracking_code} ESCALATED!`)

        // განვაახლოთ ბაზა
        await supabase
          .from('orders')
          .update({ 
            driver_escalated_at: now.toISOString(),
            priority: 'high'
          })
          .eq('id', order.id)

        // დისპეტჩერისთვის შეტყობინების გაგზავნა (Dashboard notification)
        await supabase.from('notifications').insert({
          channel: 'dashboard',
          status: 'unread',
          title: '🚨 ესკალაცია! მძღოლმა არ უპასუხა',
          message: `მძღოლმა (${driverName}) არ უპასუხა შეკვეთას <code>${order.tracking_code}</code>. გთხოვთ დაუკავშირდეთ.`,
          metadata: { order_id: order.id, driver_name: driverName, escalated_at: now.toISOString() },
          created_at: now.toISOString()
        })

        actionsTaken++
      }
    }

    console.log(`✅ [WATCHDOG] Check finished. Actions taken: ${actionsTaken}`)
    return NextResponse.json({ ok: true, actions: actionsTaken, timestamp: now.toISOString() })

  } catch (err: any) {
    console.error('💥 [WATCHDOG] Error:', err)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}