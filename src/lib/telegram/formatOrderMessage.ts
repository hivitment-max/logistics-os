// src/lib/telegram/formatOrderMessage.ts

/**
 * ქმნის ტელეგრამ შეტყობინების ტექსტს და ღილაკებს ახალი შეკვეთისთვის
 * @param order - შეკვეთის ობიექტი ბაზიდან
 * @returns { text: string, inline_keyboard: any[] }
 */
export function formatOrderMessage(order: any) {
  const text = `🚛 *ახალი შეკვეთა*\n\n` +
    `📦 კოდი: \`${order.tracking_code}\`\n` +
    `📍 მარშრუტი: ${order.pickup_address} → ${order.delivery_address}\n` +
    `🕒 დრო: ${order.scheduled_pickup_date ? new Date(order.scheduled_pickup_date).toLocaleString('ka-GE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'უცნობი'}\n` +
    `💰 თანხა: ${order.price} ${order.currency}\n` +
    `📞 კონტაქტი: ${order.pickup_phone || '–'}\n\n` +
    `გთხოვთ, დაადასტუროთ ან უარყოთ:`

  const inline_keyboard = [
    [{ text: '✅ დადასტურება', callback_data: `acc:${order.id}` }],
    [{ text: '❌ უარყოფა', callback_data: `rej:${order.id}` }]
  ]

  return { text, inline_keyboard }
}