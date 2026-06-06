import { createBrowserClient } from '@supabase/ssr'

// 🔒 გლობალური ცვლადი Singleton-ისთვის
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  // თუ უკვე არსებობს, ვაბრუნებთ იგივე ინსტანსს 
  // (ეს აჩერებს React Strict Mode-ის მიერ გამოწვეულ ორმაგ ინიციალიზაციას)
  if (supabaseInstance) {
    return supabaseConfig
  }

  supabaseInstance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        // ⚠️ ეს არის ყველაზე მნიშვნელოვანი ხაზი Next.js-ში ციკლის შესაჩერებლად!
        detectSessionInUrl: false, 
      }
    }
  )

  return supabaseInstance
}

export const supabase = createClient()