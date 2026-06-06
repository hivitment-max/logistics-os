import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 🖥️ ეს კლიენტი მხოლოდ Server/API Route-ებისთვისაა
// სერვერზე არ გვაქვს localStorage, ამიტომ persistSession და autoRefreshToken გამორთულია!
export const supabaseServer = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
})