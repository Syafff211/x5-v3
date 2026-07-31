export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

/**
 * The app ships with a fully working "demo mode" so it can be run, reviewed and
 * deployed before Supabase credentials exist. As soon as valid env vars are set
 * every screen switches to the real Supabase backend automatically.
 */
export const isSupabaseConfigured =
  SUPABASE_URL.startsWith('http') &&
  !SUPABASE_URL.includes('your_supabase') &&
  SUPABASE_ANON_KEY.length > 20 &&
  !SUPABASE_ANON_KEY.includes('your_supabase')
