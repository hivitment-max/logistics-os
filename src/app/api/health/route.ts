import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// გამოვიყენოთ სერვერული კლიენტი (ანუ env-დან)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  const tables = [
    'orders', 'invoices', 'clients', 'private_clients', 
    'companies', 'drivers', 'vehicles', 'payroll', 
    'trip_expenses', 'audit_logs'
  ]
  
  const results: any = {}
  
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      results[table] = {
        status: error ? '❌ FAILED' : '✅ OK',
        count: count || 0,
        error: error?.message || null
      }
    } catch (e: any) {
      results[table] = { status: '❌ CRASH', error: e.message }
    }
  }
  
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    system_health: 'CHECK COMPLETE',
    results
  }, { status: 200 })
}