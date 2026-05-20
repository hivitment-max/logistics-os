#!/usr/bin/env node
/**
 * 🔍 ORDERS DIAGNOSTIC - Supabase Schema & Data Checker
 * გაშვება: npx tsx src/scripts/diagnose-orders.ts
 */
import { createClient } from '@supabase/supabase-js'

// 🔑 გარემოს ცვლადების შემოწმება
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(`
❌ MISSING ENVIRONMENT VARIABLES!

გაუშვი ასე:
  npx tsx src/scripts/diagnose-orders.ts

ან დაამატე .env.local-ში:
  NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  `)
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// 🎨 Colors & Helpers
const C = {
  R: '\x1b[31m', G: '\x1b[32m', Y: '\x1b[33m', B: '\x1b[34m', 
  CY: '\x1b[36m', M: '\x1b[35m', GR: '\x1b[90m', X: '\x1b[0m',
  bold: (s: string) => `\x1b[1m${s}\x1b[22m`
}
const log = {
  ok: (m: string) => console.log(`  ${C.G}✓${C.X} ${m}`),
  warn: (m: string) => console.log(`  ${C.Y}⚠${C.X} ${m}`),
  err: (m: string) => console.log(`  ${C.R}✗${C.X} ${m}`),
  info: (m: string) => console.log(`  ${C.CY}→${C.X} ${m}`),
  step: (m: string) => console.log(`\n${C.B}━━ ${C.bold(m)} ${C.X}`),
  box: (title: string, content: string) => {
    const width = Math.max(60, title.length + 4)
    const border = '═'.repeat(width)
    console.log(`\n${C.CY}╔${border}╗${C.X}`)
    console.log(`${C.CY}║${C.X} ${C.bold(title)}${' '.repeat(width - title.length - 2)}${C.CY}║${C.X}`)
    console.log(`${C.CY}╠${border}╣${C.X}`)
    content.split('\n').forEach(line => {
      const safeLine = line.replace(/\x1b\[[0-9;]*m/g, '')
      const padding = Math.max(0, width - safeLine.length - 2)
      console.log(`${C.CY}║${C.X} ${line}${' '.repeat(padding)}${C.CY}║${C.X}`)
    })
    console.log(`${C.CY}╚${border}╝${C.X}\n`)
  }
}

// ============================================================================
// 🔍 DIAGNOSTICS
// ============================================================================

async function checkTableStructure(tableName: string) {
  log.step(`📋 ${tableName} - სტრუქტურა`)
  
  // ველების მიღება
  const { data: columns, error: colError } = await supabase
    .from(tableName)
    .select('*')
    .limit(1)
    .single()
  
  if (colError) {
    log.err(`ვერ წავიკითხე სტრუქტურა: ${colError.message}`)
    return null
  }
  
  if (columns) {
    log.ok(`ველები: ${Object.keys(columns).join(', ')}`)
  }
  
  // Foreign Keys-ის შემოწმება (pg_catalog-ის მეშვეობით)
  log.info('Foreign Keys-ის შემოწმება...')
  const { data: fks, error: fkError } = await supabase.rpc('get_foreign_keys', { table_name: tableName })
  
  if (fkError) {
    log.warn(`FK შემოწმება ვერ მოხერხდა: ${fkError.message}`)
  } else if (fks && fks.length > 0) {
    log.ok(`Foreign Keys ნაპოვნია:`)
    fks.forEach((fk: any) => {
      console.log(`    • ${fk.column_name} → ${fk.foreign_table_name}(${fk.foreign_column_name})`)
    })
  } else {
    log.warn('Foreign Keys არ არის განსაზღვრული (ან RPC არ არსებობს)')
  }
  
  return columns
}

async function checkClientReferences() {
  log.step('🔗 orders.client_id ბმულების შემოწმება')
  
  // მივიღოთ ყველა შეკვეთის client_id
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('id, client_id, client_type, client_name')
  
  if (ordersError) {
    log.err(`orders წაკითხვა ვერ მოხერხდა: ${ordersError.message}`)
    return
  }
  
  if (!orders || orders.length === 0) {
    log.info('orders ცხრილი ცარიელია')
    return
  }
  
  log.ok(`ნაპოვნია ${orders.length} შეკვეთა`)
  
  // შევამოწმოთ თითოეული client_id
  let brokenLinks = 0
  let privateCount = 0
  let companyCount = 0
  
  for (const order of orders) {
    if (!order.client_id) continue
    
    let exists = false
    let table = ''
    
    // ვცადოთ private_clients
    const { data: pc } = await supabase.from('private_clients').select('id').eq('id', order.client_id).maybeSingle()
    if (pc) { exists = true; table = 'private_clients'; privateCount++ }
    
    // თუ არ ნახეთ, ვცადოთ companies
    if (!exists) {
      const { data: co } = await supabase.from('companies').select('id').eq('id', order.client_id).maybeSingle()
      if (co) { exists = true; table = 'companies'; companyCount++ }
    }
    
    if (!exists) {
      log.err(`🔗 გატეხილი ბმული: order #${order.id} (${order.client_name}) → client_id "${order.client_id}" არ არსებობს არც ერთ ცხრილში!`)
      brokenLinks++
    }
  }
  
  log.box('📊 შედეგები', 
    `• კერძო პირებთან დაკავშირებული: ${privateCount}
• კომპანიებთან დაკავშირებული: ${companyCount}
• ❌ გატეხილი ბმულები: ${brokenLinks}
• 📈 სულ შეკვეთები: ${orders.length}`
  )
  
  if (brokenLinks > 0) {
    log.warn('💡 რჩევა: განაახლე ბაზის სქემა ან წაშალე/განაახლე გატეხილი შეკვეთები')
  }
}

async function checkSampleData() {
  log.step('📦 ნიმუში მონაცემები')
  
  // კერძო პირები
  const { data: pc, error: pcErr } = await supabase.from('private_clients').select('id, full_name, email').limit(2)
  if (pcErr) log.warn(`private_clients: ${pcErr.message}`)
  else if (pc?.length) {
    log.ok(`private_clients (${pc.length} ჩანაწერი):`)
    pc.forEach((c: any) => console.log(`    • ${c.id.slice(0,8)}... | ${c.full_name} | ${c.email}`))
  } else log.info('private_clients: ცარიელი')
  
  // კომპანიები
  const { data: co, error: coErr } = await supabase.from('companies').select('id, name, email').limit(2)
  if (coErr) log.warn(`companies: ${coErr.message}`)
  else if (co?.length) {
    log.ok(`companies (${co.length} ჩანაწერი):`)
    co.forEach((c: any) => console.log(`    • ${c.id.slice(0,8)}... | ${c.name} | ${c.email}`))
  } else log.info('companies: ცარიელი')
  
  // შეკვეთები
  const { data: ord, error: ordErr } = await supabase.from('orders').select('id, client_id, client_name, client_type').limit(3)
  if (ordErr) log.warn(`orders: ${ordErr.message}`)
  else if (ord?.length) {
    log.ok(`orders (${ord.length} ჩანაწერი):`)
    ord.forEach((o: any) => console.log(`    • ${o.id.slice(0,8)}... | client: ${o.client_name} | type: ${o.client_type || 'N/A'} | client_id: ${o.client_id?.slice(0,8)}...`))
  } else log.info('orders: ცარიელი')
}

// ============================================================================
// 🚀 MAIN
// ============================================================================

async function main() {
  console.log(`${C.CY}╔════════════════════════════════╗${C.X}`)
  console.log(`${C.CY}║${C.X}  🔍 ORDERS DIAGNOSTIC v1.0  ${C.CY}║${C.X}`)
  console.log(`${C.CY}╚════════════════════════════════╝${C.X}\n`)
  
  log.step('1. გარემო')
  log.ok(`URL: ${SUPABASE_URL?.slice(0, 30)}...`)
  
  log.step('2. კავშირის შემოწმება')
  try {
    await supabase.from('orders').select('count', { count: 'exact', head: true })
    log.ok('✓ Supabase-თან კავშირი წარმატებულია')
  } catch (e: any) {
    log.err(`✗ კავშირი ვერ დამყარდა: ${e.message}`)
    return
  }
  
  // სტრუქტურის შემოწმება
  await checkTableStructure('orders')
  await checkTableStructure('private_clients')
  await checkTableStructure('companies')
  
  // ბმულების შემოწმება
  await checkClientReferences()
  
  // ნიმუში მონაცემები
  await checkSampleData()
  
  // 🎯 დასკვნა
  log.box('🎯 დასკვნა', 
    `1. თუ "გატეხილი ბმულები" > 0 → ბაზაში არის შეკვეთები, რომელთაც არასწორი client_id აქვთ.
2. თუ orders.client_id მხოლოდ ერთ ცხრილს უკავშირდება → მეორე ტიპის კლიენტებისთვის გჭირდება ახალი ველი.
3. სწორი არქიტექტურა: 
   • client_private_id UUID REFERENCES private_clients(id)
   • client_company_id UUID REFERENCES companies(id)
   • CHECK constraint რომ მხოლოდ ერთი იყოს შევსებული`
  )
  
  console.log(`${C.G}🏁 დიაგნოსტიკა დასრულებულია!${C.X}\n`)
}

main().catch(e => { 
  log.err(`💥 Fatal: ${e.message}`)
  console.error(e)
  process.exit(1) 
})