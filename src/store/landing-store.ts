'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { DEFAULT_LANDING } from '@/lib/demo-data'
import { createClient } from '@/lib/supabase/client'
import type { LandingContent } from '@/types/database'

interface LandingState {
  content: LandingContent
  /** true setelah konten ditarik dari server (atau dipastikan mode demo). */
  hydrated: boolean
  update: (patch: Partial<LandingContent>) => void
  reset: () => void
  /** Baca konten dari Supabase. Dipanggil setiap landing page dibuka. */
  hydrateFromServer: () => Promise<void>
  /** Simpan konten ke Supabase supaya terlihat semua pengunjung. */
  publish: () => Promise<{ error: string | null }>
}

export const useLandingStore = create<LandingState>()(
  persist(
    (set, get) => ({
      content: DEFAULT_LANDING,
      hydrated: false,

      update: (patch) => set((s) => ({ content: { ...s.content, ...patch } })),
      reset: () => set({ content: DEFAULT_LANDING }),

      hydrateFromServer: async () => {
        const supabase = createClient()
        if (!supabase) {
          // Mode demo: pakai apa pun yang tersimpan di browser ini.
          set({ hydrated: true })
          return
        }
        try {
          const { data, error } = await supabase
            .from('site_settings')
            .select('landing')
            .eq('id', 1)
            .single()

          // Hanya timpa kalau server benar-benar punya konten tersimpan.
          if (!error && data?.landing && Object.keys(data.landing).length > 0) {
            set({ content: { ...DEFAULT_LANDING, ...(data.landing as Partial<LandingContent>) } })
          }
        } catch {
          /* biarkan pakai nilai lokal */
        } finally {
          set({ hydrated: true })
        }
      },

      publish: async () => {
        const supabase = createClient()
        if (!supabase) {
          // Mode demo: tidak ada server, perubahan hanya berlaku di browser ini.
          return { error: null }
        }
        const { error } = await supabase
          .from('site_settings')
          .update({ landing: get().content, updated_at: new Date().toISOString() })
          .eq('id', 1)

        if (error) {
          if (error.message.toLowerCase().includes('policy')) {
            return { error: 'Tidak punya izin menyimpan. Pastikan login sebagai Super Admin.' }
          }
          if (error.message.toLowerCase().includes('does not exist')) {
            return { error: 'Tabel site_settings belum ada. Jalankan ulang supabase/schema.sql.' }
          }
          return { error: error.message }
        }
        return { error: null }
      },
    }),
    {
      name: 'x5-landing',
      version: 3,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ content: s.content }),
    }
  )
)
