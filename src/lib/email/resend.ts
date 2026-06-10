// src/lib/email/resend.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendEmailParams {
  to: string | string[]
  subject: string
  html: string
  from?: string
}

export async function sendEmail({ to, subject, html, from }: SendEmailParams) {
  try {
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

// ============================================================================
// 📧 Email Templates
// ============================================================================

export const emailTemplates = {
  // ✅ შეკვეთა მიღებულია
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

  // 👨‍✈️ მძღოლი დაინიშნა
  driverAssigned: (trackingCode: string, clientName: string, driverName: string, driverPhone: string) => ({
    subject: `👨‍✈️ მძღოლი დაინიშნა - შეკვეთა ${trackingCode}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">🚛 Logistics OS</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb; border: 1px solid #e5e7eb;">
          <h2 style="color: #111827;">გამარჯობა, ${clientName}!</h2>
          <p style="color: #4b5563; font-size: 16px;">
            თქვენს შეკვეთას <strong style="color: #7c3aed;">#${trackingCode}</strong> მძღოლი დაენიშნა.
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #6b7280;">👨‍✈️ მძღოლი:</p>
            <p style="margin: 5px 0; font-size: 20px; font-weight: bold; color: #111827;">${driverName}</p>
            <p style="margin: 10px 0 0 0; color: #6b7280;">📞 ტელეფონი:</p>
            <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold; color: #10b981;">${driverPhone}</p>
          </div>
          <p style="color: #4b5563;">მძღოლი მალე დაგიკავშირდებათ.</p>
        </div>
        <div style="padding: 20px; text-align: center; background: #f3f4f6; border-radius: 0 0 10px 10px;">
          <p style="margin: 0; color: #6b7280; font-size: 12px;">© 2026 Logistics OS</p>
        </div>
      </div>
    `
  }),

  // 🚗 მძღოლი გზაშია
  driverEnRoute: (trackingCode: string, clientName: string, driverName: string) => ({
    subject: `🚗 მძღოლი გზაშია - შეკვეთა ${trackingCode}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">🚛 Logistics OS</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb; border: 1px solid #e5e7eb;">
          <h2 style="color: #111827;">გამარჯობა, ${clientName}!</h2>
          <p style="color: #4b5563; font-size: 16px;">
            მძღოლი <strong>${driverName}</strong> გზაშია თქვენი ტვირთისკენ.
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; font-size: 48px;">🚗💨</p>
            <p style="margin: 10px 0 0 0; color: #6b7280;">მძღოლი მიემართება ატვირთვის ადგილას</p>
          </div>
          <p style="color: #4b5563;">შეკვეთა: <strong style="color: #7c3aed;">#${trackingCode}</strong></p>
        </div>
        <div style="padding: 20px; text-align: center; background: #f3f4f6; border-radius: 0 0 10px 10px;">
          <p style="margin: 0; color: #6b7280; font-size: 12px;">© 2026 Logistics OS</p>
        </div>
      </div>
    `
  }),

  // 📦 ტვირთი ჩაიტვირთა
  cargoLoaded: (trackingCode: string, clientName: string) => ({
    subject: `📦 ტვირთი ჩაიტვირთა - შეკვეთა ${trackingCode}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">🚛 Logistics OS</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb; border: 1px solid #e5e7eb;">
          <h2 style="color: #111827;">გამარჯობა, ${clientName}!</h2>
          <p style="color: #4b5563; font-size: 16px;">
            თქვენი ტვირთი წარმატებით ჩაიტვირთა.
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; font-size: 48px;">📦✅</p>
            <p style="margin: 10px 0 0 0; color: #6b7280;">ტვირთი მზადაა ტრანსპორტირებისთვის</p>
          </div>
          <p style="color: #4b5563;">შეკვეთა: <strong style="color: #7c3aed;">#${trackingCode}</strong></p>
        </div>
        <div style="padding: 20px; text-align: center; background: #f3f4f6; border-radius: 0 0 10px 10px;">
          <p style="margin: 0; color: #6b7280; font-size: 12px;">© 2026 Logistics OS</p>
        </div>
      </div>
    `
  }),

  // 🏁 შეკვეთა ჩაბარდა
  orderDelivered: (trackingCode: string, clientName: string) => ({
    subject: `🏁 შეკვეთა ჩაბარდა - ${trackingCode}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">🎉 წარმატება!</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb; border: 1px solid #e5e7eb;">
          <h2 style="color: #111827;">გამარჯობა, ${clientName}!</h2>
          <p style="color: #4b5563; font-size: 16px;">
            თქვენი შეკვეთა <strong style="color: #10b981;">#${trackingCode}</strong> წარმატებით ჩაბარდა!
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; font-size: 48px;">🏁✅</p>
            <p style="margin: 10px 0 0 0; color: #10b981; font-weight: bold;">ჩაბარებულია</p>
          </div>
          <p style="color: #4b5563;">მადლობა რომ იყენებთ Logistics OS-ს!</p>
        </div>
        <div style="padding: 20px; text-align: center; background: #f3f4f6; border-radius: 0 0 10px 10px;">
          <p style="margin: 0; color: #6b7280; font-size: 12px;">© 2026 Logistics OS</p>
        </div>
      </div>
    `
  }),
}