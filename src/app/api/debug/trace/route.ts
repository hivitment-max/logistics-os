import { NextResponse } from 'next/server'

// 🎯 ეს არის მარტივი დიაგნოსტიკური ენდპოინტი
// გაუშვი: GET https://შენი-სტექბლიცი.../api/debug/trace

export async function GET() {
  const log: string[] = []
  
  const step = (msg: string) => {
    const time = new Date().toISOString().split('T')[1].split('.')[0]
    log.push(`[${time}] ${msg}`)
    console.log(`[TRACE] ${msg}`)
  }
  
  step('🚀 დაიწყო')
  
  try {
    step('1️⃣ გარემოს შემოწმება...')
    step(`   • TELEGRAM_BOT_TOKEN: ${process.env.TELEGRAM_BOT_TOKEN ? '✅ არის' : '❌ არ არის'}`)
    
    step('2️⃣ Supabase შემოწმება...')
    const { supabase } = await import('@/lib/supabase/client')
    
    step('3️⃣ notifications ცხრილის შემოწმება...')
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      step(`   ❌ შეცდომა: ${error.message}`)
    } else {
      step(`   ✅ ჩანაწერები: ${count}`)
    }
    
    step('4️⃣ ბოლო 3 შეტყობინების ნახვა...')
    const { data: recent } = await supabase
      .from('notifications')
      .select('id, channel, status, title, created_at')
      .order('created_at', { ascending: false })
      .limit(3)
    
    recent?.forEach((n: any, i: number) => {
      step(`   ${i+1}. [${n.channel}] ${n.status} - ${n.title?.slice(0,30)}...`)
    })
    
    step('✅ დასრულდა წარმატებით')
    
  } catch (err: any) {
    step(`❌ კრიტიკული შეცდომა: ${err.message}`)
  }
  
  // 🔴 დააბრუნებს ყველა ნაბიჯს როგორც JSON
  return NextResponse.json({ 
    ok: true, 
    trace: log,
    timestamp: new Date().toISOString()
  })
}