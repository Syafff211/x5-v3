import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Pengiriman Web Push dari sisi server.
 *
 * HANYA untuk dipakai di route handler (runtime nodejs).
 * Jangan pernah mengimpor file ini dari komponen klien —
 * `web-push` memerlukan modul kripto Node.
 */

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? ''
const SUBJECT = process.env.VAPID_SUBJECT ?? 'mailto:admin@x5-sman1.web.id'

export const pushDikonfigurasi = PUBLIC_KEY.length > 20 && PRIVATE_KEY.length > 20

if (pushDikonfigurasi) {
  webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY)
}

export type JenisNotifikasi = 'absen' | 'pengumuman' | 'pr' | 'pesan'

export interface IsiNotifikasi {
  jenis: JenisNotifikasi
  title: string
  body: string
  url?: string
  badgeCount?: number
}

interface BarisLangganan {
  id: string
  student_id: string
  endpoint: string
  p256dh: string
  auth: string
}

export interface HasilKirim {
  terkirim: number
  gagal: number
  dibersihkan: number
}

/**
 * Kirim satu notifikasi ke sekumpulan siswa.
 *
 * @param studentIds daftar id profil tujuan. Kosongkan untuk mengirim ke semua
 *                   perangkat yang terdaftar.
 */
export async function kirimNotifikasi(
  isi: IsiNotifikasi,
  studentIds?: string[]
): Promise<HasilKirim> {
  const kosong: HasilKirim = { terkirim: 0, gagal: 0, dibersihkan: 0 }

  if (!pushDikonfigurasi) return kosong

  const admin = createAdminClient()
  if (!admin) return kosong

  let q = admin.from('push_subscriptions').select('id,student_id,endpoint,p256dh,auth')
  if (studentIds && studentIds.length > 0) {
    q = q.in('student_id', studentIds)
  }

  const { data, error } = await q
  if (error || !data || data.length === 0) return kosong

  const langganan = data as unknown as BarisLangganan[]
  const muatan = JSON.stringify(isi)

  let terkirim = 0
  let gagal = 0
  const endpointMati: string[] = []

  // Kirim paralel, tapi dibatasi agar tidak membanjiri fungsi serverless.
  const UKURAN_BATCH = 20
  for (let i = 0; i < langganan.length; i += UKURAN_BATCH) {
    const batch = langganan.slice(i, i + UKURAN_BATCH)
    await Promise.all(
      batch.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            muatan,
            { TTL: 60 * 60 * 12, urgency: isi.jenis === 'absen' ? 'high' : 'normal' }
          )
          terkirim += 1
        } catch (e) {
          gagal += 1
          const kode = (e as { statusCode?: number })?.statusCode
          // 404/410 = perangkat sudah mencabut izin atau aplikasi dihapus.
          // Baris seperti ini harus dibuang, kalau tidak akan menumpuk selamanya.
          if (kode === 404 || kode === 410) endpointMati.push(s.endpoint)
        }
      })
    )
  }

  if (endpointMati.length > 0) {
    await admin.from('push_subscriptions').delete().in('endpoint', endpointMati)
  }

  return { terkirim, gagal, dibersihkan: endpointMati.length }
}

/**
 * Catat bahwa notifikasi sudah dikirim, agar tidak terkirim dua kali.
 * Mengembalikan `false` bila ternyata sudah pernah dicatat sebelumnya.
 */
export async function tandaiTerkirim(
  studentId: string,
  jenis: JenisNotifikasi,
  refId: string
): Promise<boolean> {
  const admin = createAdminClient()
  if (!admin) return true

  const { error } = await admin
    .from('push_log')
    .insert({ student_id: studentId, jenis, ref_id: refId })

  // Kode 23505 = pelanggaran unique -> memang sudah pernah dikirim.
  if (error) return false
  return true
}

/** Siswa mana saja yang BELUM tercatat menerima notifikasi ini. */
export async function saringYangBelumDikirim(
  studentIds: string[],
  jenis: JenisNotifikasi,
  refId: string
): Promise<string[]> {
  const admin = createAdminClient()
  if (!admin || studentIds.length === 0) return studentIds

  const { data } = await admin
    .from('push_log')
    .select('student_id')
    .eq('jenis', jenis)
    .eq('ref_id', refId)
    .in('student_id', studentIds)

  const sudah = new Set((data ?? []).map((r) => (r as { student_id: string }).student_id))
  return studentIds.filter((id) => !sudah.has(id))
}

/** Catat massal supaya tidak ada pengiriman ulang. */
export async function catatMassal(
  studentIds: string[],
  jenis: JenisNotifikasi,
  refId: string
): Promise<void> {
  const admin = createAdminClient()
  if (!admin || studentIds.length === 0) return
  await admin
    .from('push_log')
    .upsert(
      studentIds.map((id) => ({ student_id: id, jenis, ref_id: refId })),
      { onConflict: 'student_id,jenis,ref_id' }
    )
}
