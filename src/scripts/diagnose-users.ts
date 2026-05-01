#!/usr/bin/env node
/**
 * 🔍 AUTO-FIX Users Diagnostic v5 (Final Fixed)
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ MISSING ENV. გამოიყენე: NEXT_PUBLIC_... npx tsx src/scripts/diagnose-users.ts')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// 🎨 Colors & Helpers
const C = { R: '\x1b[31m', G: '\x1b[32m', Y: '\x1b[33m', B: '\x1b[34m', CY: '\x1b[36m', GR: '\x1b[90m', X: '\x1b[0m' }
const log = {
  ok: (m: string) => console.log(`  ${C.G}✓${C.X} ${m}`),
  warn: (m: string) => console.log(`  ${C.Y}⚠${C.X} ${m}`),
  err: (m: string) => console.log(`  ${C.R}✗${C.X} ${m}`),
  info: (m: string) => console.log(`  ${C.CY}→${C.X} ${m}`),
  step: (m: string) => console.log(`\n${C.B}━━ ${m} ${C.X}`),
  // ✅ გასწორებული box: მუშაობს ნებისმიერი სიგრძის სათაურზე
  box: (title: string, content: string) => {
    const width = Math.max(60, title.length + 4)
    const border = '═'.repeat(width)
    console.log(`\n${C.CY}╔${border}╗${C.X}`)
    console.log(`${C.CY}║${C.X} ${C.bold?.(title) || title}${' '.repeat(Math.max(0, width - title.length - 2))}${C.CY}║${C.X}`)
    console.log(`${C.CY}╠${border}╣${C.X}`)
    content.split('\n').forEach(line => {
      const safeLine = line.replace(/\x1b\[[0-9;]*m/g, '') // remove colors for padding calc
      const padding = Math.max(0, width - safeLine.length - 2)
      console.log(`${C.CY}║${C.X} ${line}${' '.repeat(padding)}${C.CY}║${C.X}`)
    })
    console.log(`${C.CY}╚${border}╝${C.X}\n`)
  },
  bold: (s: string) => `\x1b[1m${s}\x1b[22m`,
  fix: (title: string, sql: string) => {
    // ✅ გამოვიყენოთ გასწორებული box
    log.box(`🔧 FIX: ${title}`, sql)
  }
}

// 🔍 Diagnostics
async function checkStructure() {
  log.step('3. Table Structure')
  try {
    const { data } = await supabase.from('profiles').select('*').limit(1)
    if (data?.[0]) {
      const cols = Object.keys(data[0])
      log.ok(`Columns: ${cols.join(', ')}`)
      return { hasLastSignIn: cols.includes('last_sign_in') }
    }
    log.info('Table exists (empty or sample fetch failed)')
    return { hasLastSignIn: false }
  } catch (e: any) {
    if (e.message?.includes('relation')) log.warn('Table may not exist')
    else log.warn(`Structure check: ${e.message}`)
    return { hasLastSignIn: false }
  }
}

async function checkRLS() {
  log.step('4. RLS Check')
  const { error } = await supabase.from('profiles').select('id').limit(1)
  if (error?.code === 'PGRST301') { log.warn('RLS blocks SELECT'); return true }
  log.ok('SELECT allowed (or table empty)')
  return false
}

async function checkData() {
  log.step('5. Data Check')
  let authCount = null, profCount = null
  try { const { count } = await supabase.from('auth.users').select('*', { count: 'exact', head: true }); authCount = count; log.ok(`auth.users: ${authCount}`) } 
  catch { log.info('auth.users: not accessible') }
  try { const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }); profCount = count; log.ok(`profiles: ${profCount}`) } 
  catch (e: any) { log.err(`profiles error: ${e.message}`) }
  
  if (profCount === 0) {
    log.warn('⚠️ PROFILES TABLE IS EMPTY - SYNC REQUIRED')
    return { syncNeeded: true, profCount: 0 }
  }
  return { syncNeeded: false, profCount }
}

async function tryUIQuery(hasLastSignIn: boolean) {
  log.step('6. UI Query')
  const cols = ['id', 'email', 'role', 'status', 'created_at', 'user_metadata']
  if (hasLastSignIn) cols.push('last_sign_in')
  const { data, error } = await supabase.from('profiles').select(cols.join(',')).order('created_at', { ascending: false })
  if (error) { log.err(`Query failed: ${error.message}`); return { count: 0, error: true } }
  log.ok(`Returned ${data?.length || 0} rows`)
  return { count: data?.length || 0, error: false }
}

// 🛠️ Fix Generator
function generateFix(needsSync: boolean, hasLastSignIn: boolean) {
  log.step('🔧 AUTO-FIX')
  
  if (!needsSync && !hasLastSignIn) {
    log.ok('✅ Setup looks correct. If UI shows 0 users, check browser Network tab.')
    return
  }
  
  // Fix 1: Add column if missing
  if (!hasLastSignIn) {
    log.fix('Add last_sign_in column', 
      `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_sign_in TIMESTAMPTZ;`
    )
  }
  
  // Fix 2: SYNC (ყველაზე მნიშვნელოვანი)
  if (needsSync) {
    log.fix('SYNC: Copy auth.users → profiles (RLS-safe)', 
`-- 1. დროებით გავთიშოთ RLS ჩაწერისთვის (მხოლოდ ამ ოპერაციისთვის)
-- შენიშვნა: ეს მუშაობს მხოლოდ თუ გაქვს საკმარისი წვდომა

-- 2. სინქრონიზაცია
INSERT INTO public.profiles (id, email, role, user_metadata)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'role', 'client') AS role,
  COALESCE(raw_user_meta_data, '{}'::jsonb) AS user_metadata
FROM auth.users
ON CONFLICT (id) DO UPDATE 
SET email = EXCLUDED.email, role = EXCLUDED.role, user_metadata = EXCLUDED.user_metadata;

-- 3. გადაამოწმე
SELECT COUNT(*) AS "Profiles Count" FROM public.profiles;`
    )
  }
  
  // Fix 3: RLS Policy for admin
  log.fix('RLS Policy: Allow admin access', 
`-- 1. დარწმუნდი რომ ადმინს აქვს როლი
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role":"admin"}'::jsonb
WHERE email = 'admin@logistics.ge';

-- 2. შექმენი პოლიტიკა
DROP POLICY IF EXISTS "admin_access" ON public.profiles;
CREATE POLICY "admin_access" ON public.profiles
  FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() ->> 'role') = 'admin');`
  )
  
  log.info('📋 Instructions: 1) Copy SQL 2) Supabase SQL Editor 3) Run 4) Ctrl+Shift+R 5) Check Users tab')
}

// 🚀 Main
async function main() {
  console.log(`${C.CY}╔════════════════════════╗\n║  🔍 Diagnostic v5      ║\n╚════════════════════════╝${C.X}\n`)
  
  log.step('1. Env'); log.ok(`URL: ${SUPABASE_URL?.slice(0,30)}...`)
  log.step('2. Connection')
  try { await supabase.from('profiles').select('count', {count:'exact',head:true}); log.ok('✓ Connected') } 
  catch(e:any) { if(e.message?.includes('relation')) { log.warn('✗ Table missing'); generateFix(true,false); return }; log.err(`✗ ${e.message}`); return }
  
  const struct = await checkStructure()
  const rlsBlock = await checkRLS()
  const data = await checkData()
  const ui = await tryUIQuery(struct.hasLastSignIn)
  
  generateFix(data.syncNeeded, struct.hasLastSignIn)
  
  // Summary
  console.log(`${C.CY}╔════════════════════════╗\n║  📊 SUMMARY            ║\n╠════════════════════════╣${C.X}`)
  console.log(`${C.CY}║${C.X} RLS: ${rlsBlock?'⚠ blocking':'✓ ok'}${' '.repeat(30)}${C.CY}║${C.X}`)
  console.log(`${C.CY}║${C.X} Profiles: ${data.profCount} records${' '.repeat(22)}${C.CY}║${C.X}`)
  console.log(`${C.CY}║${C.X} UI Query: ${ui.count} rows${' '.repeat(26)}${C.CY}║${C.X}`)
  console.log(`${C.CY}╚════════════════════════╝${C.X}\n${C.G}🏁 Done!${C.X}\n`)
}

main().catch(e => { log.err(`Fatal: ${e.message}`); console.error(e); process.exit(1) })