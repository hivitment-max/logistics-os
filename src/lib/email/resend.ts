// src/lib/email/resend.ts
import { Resend } from 'resend'

// ❌ ეს არ მუშაობს - იქმნება build time-ზე
// const resend = new Resend(process.env.RESEND_API_KEY)

// ✅ ეს მუშაობს - იქმნება runtime-ზე
let resendInstance: Resend | null = null

function getResend(): Resend {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not set in environment variables')
    }
    resendInstance = new Resend(apiKey)
  }
  return resendInstance
}

interface SendEmailParams {
  to: string | string[]
  subject: string
  html: string
  from?: string
}

export async function sendEmail({ to, subject, html, from }: SendEmailParams) {
  try {
    const resend = getResend()
    const fromEmail = from || process.env.EMAIL_FROM || 'Logistics OS <onboarding@resend.dev>'
    
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    })

    if (error) {
      console.error('❌ Resend error:', error)
      return { success: false, error: error.message, messageId: null }
    }

    console.log('✅ Email sent:', data?.id)
    return { success: true, error: null, messageId: data?.id }
  } catch (err: any) {
    console.error('❌ Send email failed:', err)
    return { success: false, error: err.message, messageId: null }
  }
}

export const emailTemplates = {
  orderCreated: (trackingCode: string, clientName: string) => ({
    subject: `✅ შეკვეთა ${trackingCode} მიღებულია`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">🚛 Logistics OS</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb; border: 1px solid #e5e7eb;">
          <h2 style="color: #111827;">გამარჯობა, ${clientName}!</h2>
          <p style="color: #4b5563; font-size: 16px;">
            თქვენი შეკვეთა <strong style="color: #7c3aed;">#${trackingCode}</strong> წარმატებით მიღებულია.
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #6b7280;">📋 ტრეკინგი კოდი:</p>
            <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #7c3aed;">${trackingCode}</p>
          </div>
          <p style="color: #4b5563;">მალე დაგიკავშირდებით დეტალებით.</p>
        </div>
        <div style="padding: 20px; text-align: center; background: #f3f4f6; border-radius: 0 0 10px 10px;">
          <p style="margin: 0; color: #6b7280; font-size: 12px;">© 2026 Logistics OS</p>
        </div>
      </div>
    `
  }),
}