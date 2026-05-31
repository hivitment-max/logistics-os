// 📄 ფაილი: src/pages/api/debug/ping.ts
import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // მხოლოდ GET მეთოდს ვუშვებთ
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  console.log('🔔 [PING] Pages Router endpoint accessed!')
  
  // ვაბრუნებთ JSON-ს
  res.status(200).json({
    status: 'ok',
    message: 'Pages Router API is alive!',
    timestamp: new Date().toISOString(),
    env: {
      hasCronSecret: !!process.env.CRON_SECRET,
      hasBotToken: !!process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      nodeEnv: process.env.NODE_ENV
    }
  })
}