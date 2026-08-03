'use client'

import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useDataStore } from '@/store/data-store'
import { pushDidukung } from '@/lib/push'

/**
 * Pengawas notifikasi lokal.
 *
 * Menampilkan notifikasi untuk pengumuman & Info PR yang BELUM pernah dilihat
 * siswa di perangkat ini, tanpa perlu server mengirim push.
 *
 * Kenapa perlu, padahal sudah ada Web Push?
 *  - Web Push menangani keadaan aplikasi tertutup (butuh kunci VAPID + cron).
 *  - Bagian ini menangani saat siswa membuka aplikasi: kalau selama dia pergi
 *    ada pengumuman baru, dia langsung tahu — bahkan bila VAPID belum diisi.
 *
 * Penanda "sudah dilihat" disimpan per akun di localStorage, sehingga satu
 * pengumuman tidak diberitahukan berulang kali.
 */

const kunciDilihat = (idSiswa: string) => `x5-notif-dilihat:${idSiswa}`

interface Ditandai {
  pengumuman: string[]
  pr: string[]
}

function baca(idSiswa: string): Ditandai {
  if (typeof window === 'undefined') return { pengumuman: [], pr: [] }
  try {
    const raw = localStorage.getItem(kunciDilihat(idSiswa))
    if (!raw) return { pengumuman: [], pr: [] }
    const p = JSON.parse(raw) as Partial<Ditandai>
    return { pengumuman: p.pengumuman ?? [], pr: p.pr ?? [] }
  } catch {
    return { pengumuman: [], pr: [] }
  }
}

function tulis(idSiswa: string, d: Ditandai) {
  try {
    // Simpan maksimal 100 id terakhir supaya localStorage tidak membengkak.
    localStorage.setItem(
      kunciDilihat(idSiswa),
      JSON.stringify({
        pengumuman: d.pengumuman.slice(-100),
        pr: d.pr.slice(-100),
      })
    )
  } catch {
    /* penyimpanan penuh — abaikan */
  }
}

async function tampilkan(
  judul: string,
  isi: string,
  tag: string,
  url: string
): Promise<void> {
  if (!pushDidukung() || Notification.permission !== 'granted') return
  try {
    const reg = await navigator.serviceWorker.ready
    await reg.showNotification(judul, {
      body: isi,
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-96.png',
      tag,
      lang: 'id',
      data: { url },
      // @ts-expect-error — vibrate & renotify belum ada di lib DOM bawaan TS.
      vibrate: [120, 60, 120],
      renotify: true,
    })
  } catch {
    /* abaikan */
  }
}

export function NotificationWatcher() {
  const profile = useAuthStore((s) => s.profile)
  const announcements = useDataStore((s) => s.announcements)
  const assignments = useDataStore((s) => s.assignments)
  const hydrated = useDataStore((s) => s.hydrated)

  // Lewati putaran pertama setelah login: kalau tidak, siswa baru akan
  // dibanjiri notifikasi untuk semua pengumuman lama sekaligus.
  const pertamaKali = useRef(true)

  useEffect(() => {
    if (!profile || profile.role !== 'student') return
    if (!hydrated) return
    if (!pushDidukung() || Notification.permission !== 'granted') return

    const ditandai = baca(profile.id)

    const barunya = {
      pengumuman: announcements.filter((a) => !ditandai.pengumuman.includes(a.id)),
      pr: assignments.filter(
        (a) => !ditandai.pr.includes(a.id) && new Date(a.deadline).getTime() > Date.now()
      ),
    }

    // Kunjungan pertama: catat semua sebagai "sudah dilihat" tanpa memberi tahu.
    if (pertamaKali.current) {
      pertamaKali.current = false
      if (ditandai.pengumuman.length === 0 && ditandai.pr.length === 0) {
        tulis(profile.id, {
          pengumuman: announcements.map((a) => a.id),
          pr: assignments.map((a) => a.id),
        })
        return
      }
    }

    void (async () => {
      // Ringkas kalau banyak sekaligus — jangan tumpuk 10 notifikasi.
      if (barunya.pengumuman.length === 1) {
        const a = barunya.pengumuman[0]
        await tampilkan(
          'Pengumuman Baru',
          a.title,
          'x5-pengumuman',
          '/dashboard/announcements'
        )
      } else if (barunya.pengumuman.length > 1) {
        await tampilkan(
          'Pengumuman Baru',
          `Ada ${barunya.pengumuman.length} pengumuman yang belum kamu baca.`,
          'x5-pengumuman',
          '/dashboard/announcements'
        )
      }

      if (barunya.pr.length === 1) {
        const t = barunya.pr[0]
        await tampilkan(
          'Info PR Baru',
          `${t.subject} — ${t.title}`,
          'x5-pr',
          '/dashboard/assignments'
        )
      } else if (barunya.pr.length > 1) {
        await tampilkan(
          'Info PR Baru',
          `Ada ${barunya.pr.length} PR baru yang perlu kamu cek.`,
          'x5-pr',
          '/dashboard/assignments'
        )
      }

      if (barunya.pengumuman.length > 0 || barunya.pr.length > 0) {
        tulis(profile.id, {
          pengumuman: [...ditandai.pengumuman, ...barunya.pengumuman.map((a) => a.id)],
          pr: [...ditandai.pr, ...barunya.pr.map((a) => a.id)],
        })
      }

      // Lencana angka di ikon aplikasi, seperti WhatsApp.
      const total = barunya.pengumuman.length + barunya.pr.length
      const nav = navigator as Navigator & {
        setAppBadge?: (n?: number) => Promise<void>
        clearAppBadge?: () => Promise<void>
      }
      if (total > 0) nav.setAppBadge?.(total).catch(() => {})
      else nav.clearAppBadge?.().catch(() => {})
    })()
  }, [profile, announcements, assignments, hydrated])

  return null
}
