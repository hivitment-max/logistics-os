import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, emailTemplates } from '@/lib/email/resend'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to } = body

    if (!to) {
      return NextResponse.json({ error: 'Email (to) is required' }, { status: 400 })
    }

    const emailData = emailTemplates.orderCreated('TEST-123', 'ტესტ მომხმარებელი')
    
    const result = await sendEmail({
      to,
      subject: emailData.subject,
      html: emailData.html,
    })

    return NextResponse.json(result)
  } catch (err: any) {
    console.error('❌ API error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Email test endpoint is running',
    hasApiKey: !!process.env.RESEND_API_KEY,
    fromEmail: process.env.EMAIL_FROM,
    apiKeyPreview: process.env.RESEND_API_KEY 
      ? process.env.RESEND_API_KEY.substring(0, 10) + '...' 
      : 'NOT SET'
  })
}