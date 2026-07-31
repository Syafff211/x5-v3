import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from './config'

/** Server component / route handler client. Returns null in demo mode. */
export function createClient() {
  if (!isSupabaseConfigured) return null
  const cookieStore = cookies()

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch {
          // Called from a Server Component — safe to ignore, middleware refreshes.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch {
          /* noop */
        }
      },
    },
  })
}

/** Service-role client for privileged server-only operations (never expose). */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!isSupabaseConfigured || !key || key.includes('your_service_role')) return null
  return createServerClient(SUPABASE_URL, key, {
    cookies: { get: () => undefined, set: () => {}, remove: () => {} },
  })
}
