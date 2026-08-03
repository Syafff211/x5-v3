'use client'

/**
 * Pemanggil sederhana untuk menyiarkan notifikasi dari panel admin.
 *
 * Sengaja tidak pernah melempar error: kegagalan notifikasi tidak boleh
 * membatalkan penyimpanan pengumuman/PR. Cukup dicatat di console.
 */

export type JenisSiaran = 'pengumuman' | 'pr' | 'pesan'

export async function siarkanNotifikasi(opsi: {
  jenis: JenisSiaran
  title: string
  body: string
  url?: string
}): Promise<void> {
  try {
    const res = await fetch('/api/push/kirim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(opsi),
    })
    if (!res.ok) {
      console.warn('[notifikasi] gagal disiarkan:', res.status)
    }
  } catch (e) {
    console.warn('[notifikasi] gagal disiarkan:', e)
  }
}
