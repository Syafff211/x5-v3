'use client'

import { createBrowserClient } from '@supabase/ssr'
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from './config'

let cached: ReturnType<typeof createBrowserClient> | null = null

/** Returns a browser Supabase client, or null when running in demo mode. */
export function createClient() {
  if (!isSupabaseConfigured) return null
  if (!cached) cached = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  return cached
}
