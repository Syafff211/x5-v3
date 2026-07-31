'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '@supabase/supabase-js'
import type { Profile, Role } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { DEMO_ADMIN, DEMO_CURRENT_STUDENT, DEMO_STUDENTS, DEMO_SUPER_ADMIN } from '@/lib/demo-data'
import { LOGIN_PATH, ROLE_LABEL } from '@/lib/rbac'

interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
  initialized: boolean
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  signIn: (email: string, password: string, expectedRole: Role) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: string | null }>
  updateProfile: (patch: Partial<Profile>) => Promise<{ error: string | null }>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      loading: false,
      initialized: false,

      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      setLoading: (loading) => set({ loading }),

      initialize: async () => {
        const supabase = createClient()
        if (!supabase) {
          set({ initialized: true })
          return
        }
        set({ loading: true })
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
          set({ user, profile: (profile as Profile) ?? null })
        }
        set({ loading: false, initialized: true })
      },

      signIn: async (email, password, expectedRole) => {
        set({ loading: true })
        const supabase = createClient()

        // ---- Demo mode (Supabase belum dikonfigurasi) ----
        if (!supabase || !isSupabaseConfigured) {
          await new Promise((r) => setTimeout(r, 700))
          if (!email || password.length < 6) {
            set({ loading: false })
            return { error: 'Email atau password tidak valid (min. 6 karakter).' }
          }

          const typed = email.trim().toLowerCase()

          // Mode demo pun menegakkan batas peran: email harus cocok dengan
          // akun pengelola yang benar, supaya perilakunya sama dengan produksi.
          if (expectedRole === 'super_admin' || expectedRole === 'admin') {
            const target = expectedRole === 'super_admin' ? DEMO_SUPER_ADMIN : DEMO_ADMIN
            const other = expectedRole === 'super_admin' ? DEMO_ADMIN : DEMO_SUPER_ADMIN

            if (typed === other.email.toLowerCase()) {
              set({ loading: false })
              return {
                error:
                  `Akun ini terdaftar sebagai ${ROLE_LABEL[other.role]}. ` +
                  `Silakan masuk melalui ${LOGIN_PATH[other.role]}.`,
              }
            }
            if (typed !== target.email.toLowerCase()) {
              set({ loading: false })
              return { error: `Akun ${ROLE_LABEL[expectedRole]} tidak ditemukan. Gunakan ${target.email}.` }
            }

            set({ profile: target, user: { id: target.id, email: target.email } as User, loading: false })
            return { error: null }
          }

          // Siswa tidak boleh masuk lewat halaman login pengelola dan sebaliknya.
          if (typed === DEMO_ADMIN.email.toLowerCase() || typed === DEMO_SUPER_ADMIN.email.toLowerCase()) {
            const acc = typed === DEMO_ADMIN.email.toLowerCase() ? DEMO_ADMIN : DEMO_SUPER_ADMIN
            set({ loading: false })
            return {
              error:
                `Akun ini terdaftar sebagai ${ROLE_LABEL[acc.role]}. ` +
                `Silakan masuk melalui ${LOGIN_PATH[acc.role]}.`,
            }
          }

          // Cocokkan email dengan daftar siswa asli; jika tidak ada, tolak.
          const match = DEMO_STUDENTS.find((s) => s.email.toLowerCase() === email.toLowerCase())
          const profile = match ?? DEMO_CURRENT_STUDENT
          if (!match && email.toLowerCase() !== DEMO_CURRENT_STUDENT.email.toLowerCase()) {
            set({ loading: false })
            return { error: 'Email tidak terdaftar di kelas X-5. Gunakan email sekolah kamu.' }
          }
          set({ profile, user: { id: profile.id, email: profile.email } as User, loading: false })
          return { error: null }
        }

        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          set({ loading: false })
          return { error: error.message === 'Invalid login credentials' ? 'Email atau password salah.' : error.message }
        }

        const { data: profile, error: pErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .single()

        if (pErr || !profile) {
          await supabase.auth.signOut()
          set({ loading: false })
          return { error: 'Profil tidak ditemukan. Hubungi admin kelas.' }
        }

        // Setiap halaman login hanya menerima peran yang tepat, agar batas
        // antara Siswa / Admin / Super Admin benar-benar tegas.
        const actualRole = (profile as Profile).role
        if (actualRole !== expectedRole) {
          await supabase.auth.signOut()
          set({ loading: false })
          return {
            error:
              `Akun ini terdaftar sebagai ${ROLE_LABEL[actualRole] ?? actualRole}. ` +
              `Silakan masuk melalui halaman login ${ROLE_LABEL[actualRole] ?? ''} (${LOGIN_PATH[actualRole] ?? '/auth/login'}).`,
          }
        }

        set({ user: data.user, profile: profile as Profile, loading: false })
        return { error: null }
      },

      signOut: async () => {
        const supabase = createClient()
        if (supabase) await supabase.auth.signOut()
        set({ user: null, profile: null })
      },

      resetPassword: async (email) => {
        const supabase = createClient()
        if (!supabase) {
          await new Promise((r) => setTimeout(r, 600))
          return { error: null }
        }
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        })
        return { error: error?.message ?? null }
      },

      updateProfile: async (patch) => {
        const { profile } = get()
        if (!profile) return { error: 'Belum login.' }
        const supabase = createClient()
        if (!supabase) {
          set({ profile: { ...profile, ...patch, updated_at: new Date().toISOString() } })
          return { error: null }
        }
        const { error } = await supabase.from('profiles').update(patch).eq('id', profile.id)
        if (error) return { error: error.message }
        set({ profile: { ...profile, ...patch } })
        return { error: null }
      },
    }),
    {
      name: 'x5-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ profile: s.profile, user: s.user }),
    }
  )
)
