'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import {
  DEMO_ANNOUNCEMENTS,
  DEMO_ASSIGNMENTS,
  DEMO_ATTENDANCE,
  DEMO_EVENTS,
  DEMO_GALLERY,
  DEMO_MESSAGES,
  DEMO_ORGANIZATION,
  DEMO_SCHEDULE,
  DEMO_SUBJECTS,
  DEMO_STUDENTS,
  DEMO_ADMIN_ACCOUNTS,
} from '@/lib/demo-data'
import type {
  Announcement,
  Assignment,
  Attendance,
  CalendarEvent,
  GalleryItem,
  Message,
  OrganizationMember,
  Profile,
  Schedule,
  Subject,
} from '@/types/database'

type Table =
  | 'profiles'
  | 'attendance'
  | 'assignments'
  | 'announcements'
  | 'gallery'
  | 'messages'
  | 'schedules'
  | 'subjects'
  | 'organization'
  | 'events'

interface DataState {
  students: Profile[]
  attendance: Attendance[]
  assignments: Assignment[]
  announcements: Announcement[]
  gallery: GalleryItem[]
  messages: Message[]
  schedules: Schedule[]
  subjects: Subject[]
  organization: OrganizationMember[]
  events: CalendarEvent[]

  hydrated: boolean
  add: <T extends { id: string }>(table: Table, row: T) => void
  update: (table: Table, id: string, patch: Record<string, unknown>) => void
  remove: (table: Table, id: string) => void
  replace: (table: Table, rows: unknown[]) => void
  resetAll: () => void
  /** Tarik seluruh data dari Supabase (no-op saat mode demo). */
  hydrateFromSupabase: () => Promise<void>
  /** Tarik hanya data publik (galeri, organisasi, profil) untuk landing page. */
  hydratePublic: () => Promise<void>
  /** true setelah data publik selesai diambil dari server. */
  publicHydrated: boolean
}

const KEY_MAP: Record<Table, keyof DataState> = {
  profiles: 'students',
  attendance: 'attendance',
  assignments: 'assignments',
  announcements: 'announcements',
  gallery: 'gallery',
  messages: 'messages',
  schedules: 'schedules',
  subjects: 'subjects',
  organization: 'organization',
  events: 'events',
}

const INITIAL = {
  // profiles = siswa + akun pengelola (admin & super admin)
  students: [...DEMO_STUDENTS, ...DEMO_ADMIN_ACCOUNTS],
  attendance: DEMO_ATTENDANCE,
  assignments: DEMO_ASSIGNMENTS,
  announcements: DEMO_ANNOUNCEMENTS,
  gallery: DEMO_GALLERY,
  messages: DEMO_MESSAGES,
  schedules: DEMO_SCHEDULE,
  subjects: DEMO_SUBJECTS,
  organization: DEMO_ORGANIZATION,
  events: DEMO_EVENTS,
}

/** Fire-and-forget Supabase write; local state is the source of truth for UI responsiveness. */
async function syncRemote(
  op: 'insert' | 'update' | 'delete',
  table: Table,
  payload: any,
  id?: string
): Promise<{ error: string | null }> {
  const supabase = createClient()
  if (!supabase || table === 'events') return { error: null }

  try {
    // Bersihkan payload sebelum dikirim ke Postgres.
    let bersih = payload
    if (payload && typeof payload === 'object') {
      // 1) Kolom hasil join hanya ada di sisi klien — Postgres akan menolaknya.
      const { profiles, assignments, ...sisa } = payload as Record<string, unknown>

      // 2) Kolom UUID tidak boleh diisi id buatan mode demo (mis. "sadmin-01"),
      //    karena melanggar foreign key. Kosongkan saja bila bukan UUID.
      const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      for (const kolom of ['uploaded_by', 'created_by', 'student_id', 'sender_id', 'receiver_id', 'assignment_id', 'user_id']) {
        const nilai = sisa[kolom]
        if (typeof nilai === 'string' && !UUID.test(nilai)) {
          // Pengurus TANPA student_id = kartu "Belum ditentukan" di landing.
          // Lebih baik gagal terang-terangan daripada tersimpan setengah jadi.
          if (table === 'organization' && kolom === 'student_id') {
            return {
              error:
                'Siswa yang dipilih belum punya akun di database. Buka Kelola Siswa, ' +
                'pastikan siswa tersebut sudah tersimpan, lalu ulangi.',
            }
          }
          sisa[kolom] = null
        }
      }
      if (typeof sisa.id === 'string' && !UUID.test(sisa.id)) delete sisa.id

      bersih = sisa
    }

    const res =
      op === 'insert'
        ? await supabase.from(table).insert(bersih)
        : op === 'update'
          ? await supabase.from(table).update(bersih).eq('id', id!)
          : await supabase.from(table).delete().eq('id', id!)

    if (res.error) {
      console.error(`[sync] ${op} ${table} gagal:`, res.error.message)
      return { error: res.error.message }
    }
    return { error: null }
  } catch (e) {
    const pesan = e instanceof Error ? e.message : 'Gagal menghubungi server.'
    console.error(`[sync] ${op} ${table} gagal:`, pesan)
    return { error: pesan }
  }
}

/**
 * Ambil pengurus kelas BESERTA nama & foto siswanya lewat join.
 *
 * Tabel `organization` hanya menyimpan `student_id`. Kalau landing page harus
 * mencocokkan sendiri ke daftar `students`, nama pengurus ikut hilang begitu
 * pengambilan profil gagal/terlambat — muncullah "Belum ditentukan".
 * Dengan join, nama sudah menempel di barisnya sendiri.
 *
 * Bila join ditolak (relasi FK belum terbaca PostgREST), jatuh ke select biasa.
 */
async function ambilOrganisasi(supabase: NonNullable<ReturnType<typeof createClient>>) {
  const join = await supabase
    .from('organization')
    .select('id,position,student_id,order,profiles:student_id(id,full_name,avatar_url,nisn)')
    .order('order', { ascending: true })

  if (!join.error) {
    // PostgREST mengembalikan objek untuk relasi to-one, tetapi sebagian versi
    // membungkusnya dalam array. Normalkan agar tipe di klien selalu sama.
    const data = (join.data ?? []).map((row: any) => ({
      ...row,
      profiles: Array.isArray(row.profiles) ? (row.profiles[0] ?? null) : (row.profiles ?? null),
    }))
    return { data, error: null }
  }

  console.warn('[hydratePublic] join organization gagal, pakai select biasa:', join.error.message)
  return supabase.from('organization').select('*').order('order', { ascending: true })
}

export const useDataStore = create<DataState>()(
  persist(
    (set) => ({
      ...INITIAL,
      hydrated: false,
      publicHydrated: false,

      hydratePublic: async () => {
        const supabase = createClient()
        if (!supabase) {
          set({ publicHydrated: true } as any)
          return
        }
        // PERHATIAN: urutan variabel di kiri WAJIB sama persis dengan urutan
        // query di dalam Promise.all. Pernah tertukar (subjects masuk ke slot
        // profiles) sehingga nama pengurus di landing jadi "Belum ditentukan".
        const [gal, org, subj, prof] = await Promise.all([
          supabase.from('gallery').select('*').order('created_at', { ascending: false }),
          ambilOrganisasi(supabase),
          supabase.from('subjects').select('*').order('order', { ascending: true }),
          supabase.from('profiles').select('id,full_name,avatar_url,nisn,role,email,user_id,created_at,updated_at'),
        ])

        // PENTING: terapkan hasil server walaupun kosong.
        // Kalau hanya diterapkan saat ada isi, penghapusan foto oleh admin
        // tidak pernah sampai ke pengunjung — mereka terus melihat galeri lama
        // dari cache localStorage.
        const patch: Record<string, unknown> = {}
        if (!gal.error && Array.isArray(gal.data)) patch.gallery = gal.data
        if (!org.error && Array.isArray(org.data)) patch.organization = org.data
        if (!prof.error && Array.isArray(prof.data) && prof.data.length) patch.students = prof.data
        if (!subj.error && Array.isArray(subj.data) && subj.data.length) patch.subjects = subj.data

        patch.publicHydrated = true
        set(patch as any)
      },

      hydrateFromSupabase: async () => {
        const supabase = createClient()
        if (!supabase) {
          set({ hydrated: true })
          return
        }
        const tables: [Table, keyof DataState][] = [
          ['profiles', 'students'],
          ['attendance', 'attendance'],
          ['assignments', 'assignments'],
          ['announcements', 'announcements'],
          ['gallery', 'gallery'],
          ['messages', 'messages'],
          ['schedules', 'schedules'],
          ['subjects', 'subjects'],
          ['organization', 'organization'],
          ['events', 'events'],
        ]
        const patch: Record<string, unknown> = {}
        await Promise.all(
          tables.map(async ([table, key]) => {
            const { data, error } = await supabase.from(table).select('*')
            if (!error && Array.isArray(data)) patch[key as string] = data
          })
        )
        set({ ...patch, hydrated: true } as any)
      },

      add: (table, row) => {
        const key = KEY_MAP[table]
        set((s) => ({ [key]: [row, ...(s[key] as any[])] }) as any)

        // Kalau penyimpanan ke server gagal, tarik kembali baris dari tampilan
        // supaya tidak ada data "hantu" yang terlihat ada padahal tidak tersimpan.
        void syncRemote('insert', table, row).then(({ error }) => {
          if (!error) return
          set((s) => ({ [key]: (s[key] as any[]).filter((r) => r.id !== row.id) }) as any)
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('x5-sync-error', { detail: { table, error } })
            )
          }
        })
      },

      update: (table, id, patch) => {
        const key = KEY_MAP[table]
        set((s) => ({ [key]: (s[key] as any[]).map((r) => (r.id === id ? { ...r, ...patch } : r)) }) as any)
        void syncRemote('update', table, patch, id)
      },

      remove: (table, id) => {
        const key = KEY_MAP[table]
        set((s) => ({ [key]: (s[key] as any[]).filter((r) => r.id !== id) }) as any)
        void syncRemote('delete', table, null, id)
      },

      replace: (table, rows) => {
        const key = KEY_MAP[table]
        set({ [key]: rows } as any)
      },

      resetAll: () => set({ ...INITIAL }),
    }),
    {
      name: 'x5-data',
      version: 5, // bump = buang cache data lama dari browser
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => {
        const { hydrated, publicHydrated, add, update, remove, replace, resetAll,
                hydrateFromSupabase, hydratePublic, ...rest } = s as any
        // Saat Supabase aktif, database adalah sumber kebenaran.
        // Menyimpan salinan di localStorage justru membuat pengunjung
        // melihat data basi setelah admin mengubah isinya.
        if (isSupabaseConfigured) {
          const { gallery, organization, students, ...lokal } = rest
          return lokal
        }
        return rest
      },
    }
  )
)

export const uid = () => (globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`)
export const nowIso = () => new Date().toISOString()
