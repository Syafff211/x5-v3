'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { DEFAULT_LANDING } from '@/lib/demo-data'
import type { LandingContent } from '@/types/database'

interface LandingState {
  content: LandingContent
  update: (patch: Partial<LandingContent>) => void
  reset: () => void
}

export const useLandingStore = create<LandingState>()(
  persist(
    (set) => ({
      content: DEFAULT_LANDING,
      update: (patch) => set((s) => ({ content: { ...s.content, ...patch } })),
      reset: () => set({ content: DEFAULT_LANDING }),
    }),
    { name: 'x5-landing', version: 2, storage: createJSONStorage(() => localStorage) }
  )
)
