import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    // ✅ ეს კონფიგურაცია აიძულებს Supabase-ს გამოიყენოს localStorage სესიისთვის
    cookies: {
      get(name: string) {
        if (typeof window === 'undefined') return undefined
        const cookies = document.cookie.split(';').map(c => c.trim())
        const cookie = cookies.find(c => c.startsWith(name + '='))
        return cookie ? decodeURIComponent(cookie.split('=')[1]) : undefined
      },
      set(name: string, value: string, options: any) {
        if (typeof window === 'undefined') return
        let cookie = `${name}=${encodeURIComponent(value)}`
        if (options?.maxAge) cookie += `; Max-Age=${options.maxAge}`
        if (options?.path) cookie += `; Path=${options.path}`
        if (options?.secure) cookie += '; Secure'
        if (options?.sameSite) cookie += `; SameSite=${options.sameSite}`
        document.cookie = cookie
      },
      remove(name: string, options: any) {
        if (typeof window === 'undefined') return
        document.cookie = `${name}=; Max-Age=-1; Path=${options?.path || '/'}`
      },
    },
  }
)