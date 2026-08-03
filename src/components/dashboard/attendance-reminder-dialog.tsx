'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { CalendarCheck, CheckCircle2, Clock, Loader2, Sparkles } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth-store'
import { nowIso, uid, useDataStore } from '@/store/data-store'
import { ATTENDANCE_LABEL, formatDate } from '@/lib/utils'
import type { AttendanceStatus } from '@/types/database'

/**
 * Popup pengingat absensi.
 *
 * Muncul otomatis saat siswa membuka dashboard dan belum mengisi kehadiran
 * hari ini. Satu tombol besar "Absen Sekarang" langsung mencatat status
 * "Hadir" tanpa perlu pindah halaman.
 *
 * Aturan tampil:
 *  - hanya untuk peran siswa,
 *  - hanya bila belum ada catatan kehadiran bertanggal hari ini,
 *  - maksimal sekali per hari per perangkat (ditandai di localStorage),
 *    supaya tidak mengganggu tiap kali pindah menu.
 */

/** Kunci penanda "popup sudah ditutup hari ini" di localStorage. */
const kunciTunda = (idSiswa: string, tanggal: string) => `x5-absen-popup:${idSiswa}:${tanggal}`

/** Batas jam saat status otomatis dianggap terlambat. */
const JAM_TERLAMBAT = 7

export function AttendanceReminderDialog() {
  const profile = useAuthStore((s) => s.profile)
  const attendance = useDataStore((s) => s.attendance)
  const hydrated = useDataStore((s) => s.hydrated)
  const add = useDataStore((s) => s.add)

  // Notifikasi HP membuka /dashboard?absen=1 saat tombol "Absen Sekarang"
  // ditekan. Penanda ini memaksa popup muncul walaupun sudah ditunda hari ini.
  const params = useSearchParams()
  const dariNotifikasi = params.get('absen') === '1'

  const [buka, setBuka] = useState(false)
  const [menyimpan, setMenyimpan] = useState(false)
  const [selesai, setSelesai] = useState(false)

  const hariIni = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const sudahAbsen = useMemo(
    () => attendance.some((a) => a.student_id === profile?.id && a.date === hariIni),
    [attendance, profile?.id, hariIni]
  )

  // Lewat jam 7 pagi dihitung terlambat — sama seperti aturan di kelas.
  const statusOtomatis: AttendanceStatus = useMemo(
    () => (new Date().getHours() >= JAM_TERLAMBAT ? 'late' : 'present'),
    []
  )

  useEffect(() => {
    if (!profile || profile.role !== 'student') return
    if (sudahAbsen || selesai) return

    // Tunggu data selesai ditarik dari server. Tanpa ini, popup sempat muncul
    // sekejap padahal siswa sebenarnya sudah absen dari perangkat lain.
    if (!hydrated) return

    // Datang dari notifikasi = memang sengaja mau absen. Abaikan penundaan.
    if (
      !dariNotifikasi &&
      typeof window !== 'undefined' &&
      localStorage.getItem(kunciTunda(profile.id, hariIni))
    ) {
      return
    }

    // Beri jeda singkat supaya tidak menabrak animasi masuk halaman.
    const timer = setTimeout(() => setBuka(true), dariNotifikasi ? 250 : 900)
    return () => clearTimeout(timer)
  }, [profile, sudahAbsen, selesai, hydrated, hariIni, dariNotifikasi])

  function tunda() {
    if (profile) {
      localStorage.setItem(kunciTunda(profile.id, hariIni), '1')
    }
    setBuka(false)
  }

  async function absenSekarang() {
    if (!profile) return
    setMenyimpan(true)

    add('attendance', {
      id: uid(),
      student_id: profile.id,
      date: hariIni,
      status: statusOtomatis,
      note: null,
      created_at: nowIso(),
    })

    // Jeda pendek supaya perubahan terasa nyata, bukan berkedip.
    await new Promise((r) => setTimeout(r, 450))

    setMenyimpan(false)
    setSelesai(true)
    setBuka(false)
    localStorage.setItem(kunciTunda(profile.id, hariIni), '1')
    toast.success(`Kehadiran tercatat: ${ATTENDANCE_LABEL[statusOtomatis]}`, {
      description: formatDate(new Date(), true),
    })
  }

  if (!profile || profile.role !== 'student') return null

  const namaDepan = profile.full_name?.split(' ')[0] ?? 'Kamu'

  return (
    <Dialog open={buka} onOpenChange={(o) => !o && tunda()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25">
            <CalendarCheck className="h-7 w-7" />
          </div>
          <DialogTitle className="text-center text-xl">
            Halo {namaDepan}, belum absen nih!
          </DialogTitle>
          <DialogDescription className="text-center">
            Kehadiranmu untuk <strong className="text-foreground">{formatDate(new Date(), true)}</strong>{' '}
            belum tercatat. Isi sekarang biar tidak lupa.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-border/60 bg-muted/40 p-4 text-center">
          <p className="text-xs text-muted-foreground">Status yang akan dicatat</p>
          <p className="mt-1.5 flex items-center justify-center gap-2 text-lg font-semibold">
            {statusOtomatis === 'present' ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">Hadir</span>
              </>
            ) : (
              <>
                <Clock className="h-5 w-5 text-amber-500" />
                <span className="text-amber-600 dark:text-amber-400">Terlambat</span>
              </>
            )}
          </p>
          {statusOtomatis === 'late' && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              Sekarang sudah lewat pukul {String(JAM_TERLAMBAT).padStart(2, '0')}.00.
            </p>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            variant="gradient"
            size="lg"
            className="w-full"
            onClick={absenSekarang}
            disabled={menyimpan}
          >
            {menyimpan ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Absen Sekarang
              </>
            )}
          </Button>

          <div className="flex w-full gap-2">
            <Button variant="outline" className="flex-1" onClick={tunda} disabled={menyimpan}>
              Nanti saja
            </Button>
            <Button asChild variant="ghost" className="flex-1" disabled={menyimpan}>
              <Link href="/dashboard/attendance" onClick={tunda}>
                Izin / Sakit
              </Link>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
