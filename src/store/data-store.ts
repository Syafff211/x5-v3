'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createClient } from '@/lib/supabase/client'
import {
  DEMO_ANNOUNCEMENTS,
  DEMO_ASSIGNMENTS,
  DEMO_ATTENDANCE,
  DEMO_EVENTS,
  DEMO_GALLERY,
  DEMO_GRADES,
  DEMO_MATERIALS,
  DEMO_MESSAGES,
  DEMO_ORGANIZATION,
  DEMO_SCHEDULE,
  DEMO_STUDENTS,
  DEMO_ADMIN_ACCOUNTS,
  DEMO_SUBMISSIONS,
} from '@/lib/demo-data'
import type {
  Announcement,
  Assignment,
  AssignmentSubmission,
  Attendance,
  CalendarEvent,
  GalleryItem,
  Grade,
  Material,
  Message,
  OrganizationMember,
  Profile,
  Schedule,
} from '@/types/database'

type Table =
  | 'profiles'
  | 'attendance'
  | 'assignments'
  | 'assignment_submissions'
  | 'grades'
  | 'materials'
  | 'announcements'
  | 'gallery'
  | 'messages'
  | 'schedules'
  | 'organization'
  | 'events'

interface DataState {
  students: Profile[]
  attendance: Attendance[]
  assignments: Assignment[]
  submissions: AssignmentSubmission[]
  grades: Grade[]
  materials: Material[]
  announcements: Announcement[]
  gallery: GalleryItem[]
  messages: Message[]
  schedules: Schedule[]
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
}

const KEY_MAP: Record<Table, keyof DataState> = {
  profiles: 'students',
  attendance: 'attendance',
  assignments: 'assignments',
  assignment_submissions: 'submissions',
  grades: 'grades',
  materials: 'materials',
  announcements: 'announcements',
  gallery: 'gallery',
  messages: 'messages',
  schedules: 'schedules',
  organization: 'organization',
  events: 'events',
}

const INITIAL = {
  // profiles = siswa + akun pengelola (admin & super admin)
  students: [...DEMO_STUDENTS, ...DEMO_ADMIN_ACCOUNTS],
  attendance: DEMO_ATTENDANCE,
  assignments: DEMO_ASSIGNMENTS,
  submissions: DEMO_SUBMISSIONS,
  grades: DEMO_GRADES,
  materials: DEMO_MATERIALS,
  announcements: DEMO_ANNOUNCEMENTS,
  gallery: DEMO_GALLERY,
  messages: DEMO_MESSAGES,
  schedules: DEMO_SCHEDULE,
  organization: DEMO_ORGANIZATION,
  events: DEMO_EVENTS,
}

/** Fire-and-forget Supabase write; local state is the source of truth for UI responsiveness. */
async function syncRemote(op: 'insert' | 'update' | 'delete', table: Table, payload: any, id?: string) {
  const supabase = createClient()
  if (!supabase || table === 'events') return
  try {
    if (op === 'insert') await supabase.from(table).insert(payload)
    else if (op === 'update') await supabase.from(table).update(payload).eq('id', id!)
    else await supabase.from(table).delete().eq('id', id!)
  } catch {
    /* offline-tolerant */
  }
}

export const useDataStore = create<DataState>()(
  persist(
    (set) => ({
      ...INITIAL,
      hydrated: false,

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
          ['assignment_submissions', 'submissions'],
          ['grades', 'grades'],
          ['materials', 'materials'],
          ['announcements', 'announcements'],
          ['gallery', 'gallery'],
          ['messages', 'messages'],
          ['schedules', 'schedules'],
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
        void syncRemote('insert', table, row)
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
      version: 3, // bump = buang cache data lama dari browser
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => {
        const { hydrated, add, update, remove, replace, resetAll, hydrateFromSupabase, ...rest } = s as any
        return rest
      },
    }
  )
)

export const uid = () => (globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`)
export const nowIso = () => new Date().toISOString()
