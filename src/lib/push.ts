'use client'

/**
 * Utilitas Web Push di sisi browser.
 *
 * Tidak ada `node:` apa pun di file ini — semuanya API browser.
 * (Pengiriman notifikasi ada di src/app/api/push/kirim/route.ts.)
 */

export const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

/** true bila browser ini mampu menerima Web Push. */
export function pushDidukung(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

/**
 * Apakah aplikasi sedang berjalan sebagai PWA terpasang?
 *
 * Penting untuk iOS: Safari di iPhone HANYA mengizinkan Web Push kalau situs
 * sudah ditambahkan ke Layar Utama. Di browser biasa, tombolnya percuma.
 */
export function berjalanSebagaiPWA(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // Safari iOS memakai properti non-standar ini.
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

/** Deteksi iOS (termasuk iPad yang menyamar sebagai Mac). */
export function iniIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && 'ontouchend' in document)
}

export type StatusIzin = 'default' | 'granted' | 'denied' | 'tidak-didukung'

export function statusIzin(): StatusIzin {
  if (!pushDidukung()) return 'tidak-didukung'
  return Notification.permission as StatusIzin
}

/** Ubah kunci VAPID base64url menjadi Uint8Array yang diminta PushManager. */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i)
  return out
}

/** Ubah ArrayBuffer jadi base64url agar bisa dikirim sebagai JSON. */
function bufferKeBase64(buf: ArrayBuffer | null): string {
  if (!buf) return ''
  const bytes = new Uint8Array(buf)
  let s = ''
  for (let i = 0; i < bytes.length; i += 1) s += String.fromCharCode(bytes[i])
  return window.btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Tunggu service worker siap. Mengembalikan null bila tidak tersedia. */
async function registrasiSiap(): Promise<ServiceWorkerRegistration | null> {
  if (!pushDidukung()) return null
  try {
    // `ready` menunggu SW yang sudah aktif. Kalau belum pernah terdaftar,
    // daftarkan dulu supaya tombol tetap bekerja pada kunjungan pertama.
    const sudah = await navigator.serviceWorker.getRegistration()
    if (!sudah) await navigator.serviceWorker.register('/sw.js')
    return await navigator.serviceWorker.ready
  } catch {
    return null
  }
}

export interface HasilAktivasi {
  ok: boolean
  pesan: string
}

/**
 * Minta izin lalu daftarkan perangkat ini ke server.
 * Aman dipanggil berkali-kali — langganan yang sudah ada dipakai ulang.
 */
export async function aktifkanNotifikasi(studentId: string): Promise<HasilAktivasi> {
  if (!pushDidukung()) {
    return { ok: false, pesan: 'Browser ini tidak mendukung notifikasi.' }
  }
  if (!VAPID_PUBLIC_KEY) {
    return {
      ok: false,
      pesan: 'Kunci notifikasi belum dipasang. Hubungi admin (NEXT_PUBLIC_VAPID_PUBLIC_KEY).',
    }
  }
  if (iniIOS() && !berjalanSebagaiPWA()) {
    return {
      ok: false,
      pesan:
        'Di iPhone, notifikasi hanya bisa aktif setelah aplikasi ditambahkan ke Layar Utama. ' +
        'Ketuk tombol Bagikan → Tambahkan ke Layar Utama, lalu buka dari ikon tersebut.',
    }
  }

  const izin = await Notification.requestPermission()
  if (izin === 'denied') {
    return {
      ok: false,
      pesan:
        'Notifikasi diblokir. Buka pengaturan situs di browser, izinkan Notifikasi, lalu coba lagi.',
    }
  }
  if (izin !== 'granted') {
    return { ok: false, pesan: 'Izin notifikasi belum diberikan.' }
  }

  const reg = await registrasiSiap()
  if (!reg) return { ok: false, pesan: 'Service worker belum siap. Muat ulang halaman.' }

  let sub = await reg.pushManager.getSubscription()

  // Kalau kunci server berganti, langganan lama tidak akan pernah menerima
  // apa pun. Lebih baik dibuang dan dibuat ulang.
  if (sub) {
    const kunciLama = bufferKeBase64(sub.options?.applicationServerKey ?? null)
    if (kunciLama && kunciLama !== VAPID_PUBLIC_KEY) {
      await sub.unsubscribe().catch(() => {})
      sub = null
    }
  }

  if (!sub) {
    try {
      sub = await reg.pushManager.subscribe({
        // Wajib true. Browser menolak langganan yang tidak selalu menampilkan
        // notifikasi kepada pengguna.
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      })
    } catch (e) {
      const pesan = e instanceof Error ? e.message : 'Gagal berlangganan notifikasi.'
      return { ok: false, pesan }
    }
  }

  const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } }

  try {
    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId,
        subscription: {
          endpoint: json.endpoint,
          keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
        },
        userAgent: navigator.userAgent,
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { ok: false, pesan: data?.error ?? 'Server menolak pendaftaran notifikasi.' }
    }
  } catch {
    return { ok: false, pesan: 'Tidak bisa menghubungi server. Periksa koneksi.' }
  }

  return { ok: true, pesan: 'Notifikasi aktif. Kamu akan diberi tahu di layar HP.' }
}

/** Matikan notifikasi untuk perangkat ini. */
export async function matikanNotifikasi(): Promise<HasilAktivasi> {
  const reg = await registrasiSiap()
  if (!reg) return { ok: false, pesan: 'Service worker tidak tersedia.' }

  const sub = await reg.pushManager.getSubscription()
  if (!sub) return { ok: true, pesan: 'Notifikasi memang sudah nonaktif.' }

  const endpoint = sub.endpoint
  await sub.unsubscribe().catch(() => {})

  try {
    await fetch('/api/push/subscribe', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint }),
    })
  } catch {
    /* langganan lokal sudah dicabut; sisa baris di server akan dibersihkan
       otomatis saat pengiriman berikutnya gagal (410 Gone). */
  }

  if ('clearAppBadge' in navigator) {
    ;(navigator as Navigator & { clearAppBadge?: () => Promise<void> }).clearAppBadge?.().catch(() => {})
  }

  return { ok: true, pesan: 'Notifikasi dimatikan untuk perangkat ini.' }
}

/** Apakah perangkat ini sedang berlangganan? */
export async function sedangBerlangganan(): Promise<boolean> {
  if (!pushDidukung() || Notification.permission !== 'granted') return false
  const reg = await registrasiSiap()
  if (!reg) return false
  return !!(await reg.pushManager.getSubscription())
}
