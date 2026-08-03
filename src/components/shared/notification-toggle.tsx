'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Bell, BellOff, BellRing, Loader2, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuthStore } from '@/store/auth-store'
import {
  aktifkanNotifikasi,
  berjalanSebagaiPWA,
  iniIOS,
  matikanNotifikasi,
  pushDidukung,
  sedangBerlangganan,
  statusIzin,
  VAPID_PUBLIC_KEY,
} from '@/lib/push'

/**
 * Kartu pengaturan notifikasi HP.
 *
 * Ditempatkan di /dashboard/settings. Menampilkan keadaan sebenarnya —
 * termasuk kalau perangkat memang tidak mendukung, atau kalau iPhone belum
 * memasang PWA — supaya siswa tidak menebak-nebak kenapa tidak ada notifikasi.
 */
export function NotificationToggle() {
  const profile = useAuthStore((s) => s.profile)

  const [siap, setSiap] = useState(false)
  const [aktif, setAktif] = useState(false)
  const [proses, setProses] = useState(false)
  const [izin, setIzin] = useState<string>('default')
  const [pwa, setPwa] = useState(false)
  const [ios, setIos] = useState(false)

  const muat = useCallback(async () => {
    setIzin(statusIzin())
    setPwa(berjalanSebagaiPWA())
    setIos(iniIOS())
    setAktif(await sedangBerlangganan())
    setSiap(true)
  }, [])

  useEffect(() => {
    void muat()
  }, [muat])

  async function alihkan() {
    if (!profile) return
    setProses(true)

    if (aktif) {
      const r = await matikanNotifikasi()
      setProses(false)
      setAktif(false)
      toast.success(r.pesan)
      return
    }

    const r = await aktifkanNotifikasi(profile.id)
    setProses(false)
    setIzin(statusIzin())

    if (!r.ok) {
      toast.error(r.pesan, { duration: 7000 })
      return
    }

    setAktif(true)
    toast.success(r.pesan)

    // Notifikasi percobaan supaya siswa langsung tahu bentuknya di HP.
    try {
      const reg = await navigator.serviceWorker.ready
      await reg.showNotification('Notifikasi aktif 🎉', {
        body: 'Beginilah pemberitahuan dari X-5 akan muncul di HP kamu.',
        icon: '/icons/icon-192.png',
        badge: '/icons/badge-96.png',
        tag: 'x5-uji',
        data: { url: '/dashboard' },
      })
    } catch {
      /* tidak masalah kalau gagal */
    }
  }

  if (!siap) {
    return (
      <Card glass className="flex items-center gap-3 p-5">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Memeriksa dukungan notifikasi...</p>
      </Card>
    )
  }

  const tidakDidukung = !pushDidukung()
  const kunciKosong = !VAPID_PUBLIC_KEY
  const iosBelumPWA = ios && !pwa
  const diblokir = izin === 'denied'
  const terkunci = tidakDidukung || kunciKosong || iosBelumPWA || diblokir

  return (
    <Card glass className="p-5">
      <div className="flex items-start gap-4">
        <div
          className={
            aktif
              ? 'grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25'
              : 'grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground'
          }
        >
          {aktif ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-semibold">Notifikasi di HP</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Dapat pemberitahuan pengumuman, Info PR, dan pengingat absen langsung di layar
            HP — walau aplikasi sedang tertutup.
          </p>

          {aktif && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <BellRing className="h-3 w-3" /> Aktif di perangkat ini
            </p>
          )}

          {/* --- Penjelasan kalau tidak bisa dipakai --- */}
          {tidakDidukung && (
            <p className="mt-3 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
              Browser ini tidak mendukung notifikasi push. Coba Chrome (Android) atau Safari
              (iPhone, iOS 16.4 ke atas).
            </p>
          )}

          {!tidakDidukung && iosBelumPWA && (
            <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
              <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <div className="text-xs">
                <p className="font-medium text-amber-600 dark:text-amber-400">
                  Pasang dulu di Layar Utama
                </p>
                <p className="mt-1 text-muted-foreground">
                  Di iPhone, notifikasi hanya bisa aktif kalau aplikasi dibuka dari ikon di
                  Layar Utama. Ketuk tombol <strong>Bagikan</strong> di Safari →{' '}
                  <strong>Tambahkan ke Layar Utama</strong>, lalu buka dari ikon tersebut.
                </p>
              </div>
            </div>
          )}

          {!tidakDidukung && !iosBelumPWA && diblokir && (
            <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
              Notifikasi diblokir untuk situs ini. Buka pengaturan browser → Izin situs →
              Notifikasi → Izinkan, lalu muat ulang halaman.
            </p>
          )}

          {!tidakDidukung && kunciKosong && (
            <p className="mt-3 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
              Notifikasi belum disiapkan oleh admin (kunci VAPID kosong).
            </p>
          )}

          {!terkunci && !aktif && !pwa && (
            <p className="mt-3 text-xs text-muted-foreground">
              Tips: pasang aplikasi ke layar utama agar notifikasi tetap masuk walau browser
              ditutup.
            </p>
          )}

          <Button
            variant={aktif ? 'outline' : 'gradient'}
            className="mt-4"
            onClick={alihkan}
            disabled={proses || terkunci}
          >
            {proses ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Memproses...
              </>
            ) : aktif ? (
              <>
                <BellOff className="h-4 w-4" /> Matikan Notifikasi
              </>
            ) : (
              <>
                <Bell className="h-4 w-4" /> Aktifkan Notifikasi
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  )
}
