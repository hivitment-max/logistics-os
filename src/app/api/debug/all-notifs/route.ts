import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET() {
  // 🔍 ვიღებთ ყველა ჩანაწერს (ნებისმიერი channel-ით)
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)
  
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({
    ok: true,
    total: data?.length || 0,
    items: data?.map((n: any) => ({
      id: n.id?.slice(0,8) + '...',
      channel: n.channel,
      status: n.status,
      title: n.title?.slice(0,40),
      order_id: n.order_id?.slice(0,8) + '...',
      created_at: n.created_at
    })) || []
  })
}