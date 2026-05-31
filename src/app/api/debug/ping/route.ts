// src/app/api/debug/ping/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  console.log('🔔 [PING] Debug endpoint accessed!')
  
  return NextResponse.json({
    status: 'ok',
    message: 'API is alive!',
    timestamp: new Date().toISOString(),
    env: {
      hasCronSecret: !!process.env.CRON_SECRET,
      hasBotToken: !!process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      nodeEnv: process.env.NODE_ENV
    }
  }, {
    headers: {
      'Cache-Control': 'no-store, max-age=0'
    }
  })
}