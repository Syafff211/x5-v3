'use client'

import { createClient } from '@/lib/supabase/client'

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5 MB sebelum kompresi
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export interface HasilUnggah {
  url: string | null
  error: string | null
}

/** Validasi berkas gambar sebelum diproses. */
export function validasiGambar(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Format harus JPG, PNG, WebP, atau GIF.'
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `Ukuran maksimal 5 MB. Berkas ini ${(file.size / 1024 / 1024).toFixed(1)} MB.`
  }
  return null
}

/**
 * Perkecil gambar lewat canvas sebelum disimpan.
 *
 * Penting untuk mode demo: data URL disimpan di localStorage yang kuotanya
 * hanya ~5 MB. Tanpa kompresi, satu foto saja bisa membuat penyimpanan penuh.
 */
export function kompresGambar(
  file: File,
  maxSisi = 1280,
  mutu = 0.82
): Promise<{ dataUrl: string; blob: Blob }> {
  return new Promise((resolve, reject) => {
    // GIF dibiarkan apa adanya supaya animasinya tidak hilang.
    if (file.type === 'image/gif') {
      const fr = new FileReader()
      fr.onload = () => resolve({ dataUrl: String(fr.result), blob: file })
      fr.onerror = () => reject(new Error('Gagal membaca berkas.'))
      fr.readAsDataURL(file)
      return
    }

    const img = new window.Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      let { width, height } = img
      if (width > maxSisi || height > maxSisi) {
        const rasio = Math.min(maxSisi / width, maxSisi / height)
        width = Math.round(width * rasio)
        height = Math.round(height * rasio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Browser tidak mendukung canvas.'))

      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, width, height)

      const dataUrl = canvas.toDataURL('image/jpeg', mutu)
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Gagal memproses gambar.'))
          resolve({ dataUrl, blob })
        },
        'image/jpeg',
        mutu
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Berkas bukan gambar yang valid.'))
    }
    img.src = objectUrl
  })
}

/**
 * Unggah gambar ke Supabase Storage.
 * Saat Supabase belum dikonfigurasi, gambar dikembalikan sebagai data URL
 * sehingga tetap tersimpan dan tampil setelah halaman dimuat ulang.
 */
export async function unggahGambar(
  file: File,
  bucket: 'avatars' | 'gallery' | 'materials',
  prefix = ''
): Promise<HasilUnggah> {
  const salah = validasiGambar(file)
  if (salah) return { url: null, error: salah }

  let dataUrl: string
  let blob: Blob
  try {
    const hasil = await kompresGambar(file, bucket === 'avatars' ? 512 : 1600, bucket === 'avatars' ? 0.85 : 0.8)
    dataUrl = hasil.dataUrl
    blob = hasil.blob
  } catch (e) {
    return { url: null, error: e instanceof Error ? e.message : 'Gagal memproses gambar.' }
  }

  const supabase = createClient()

  // ---- Mode demo: simpan sebagai data URL ----
  if (!supabase) {
    if (dataUrl.length > 1_500_000) {
      return { url: null, error: 'Gambar terlalu besar untuk mode demo. Coba gambar yang lebih kecil.' }
    }
    return { url: dataUrl, error: null }
  }

  // ---- Mode Supabase Storage ----
  const ext = file.type === 'image/gif' ? 'gif' : 'jpg'
  const nama = `${prefix ? prefix + '/' : ''}${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`

  const { error: errUnggah } = await supabase.storage.from(bucket).upload(nama, blob, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type === 'image/gif' ? 'image/gif' : 'image/jpeg',
  })

  if (errUnggah) {
    const pesan = errUnggah.message.toLowerCase()
    if (pesan.includes('not found') || pesan.includes('bucket')) {
      return { url: null, error: `Bucket "${bucket}" belum ada. Jalankan supabase/schema.sql bagian Storage.` }
    }
    if (pesan.includes('policy') || pesan.includes('unauthorized')) {
      return { url: null, error: 'Tidak punya izin mengunggah. Periksa policy Storage di Supabase.' }
    }
    return { url: null, error: `Gagal mengunggah: ${errUnggah.message}` }
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(nama)
  return { url: data.publicUrl, error: null }
}

/** Hapus berkas dari Storage berdasarkan URL publiknya. */
export async function hapusGambar(url: string, bucket: 'avatars' | 'gallery' | 'materials') {
  const supabase = createClient()
  if (!supabase || url.startsWith('data:')) return
  const tanda = `/storage/v1/object/public/${bucket}/`
  const idx = url.indexOf(tanda)
  if (idx === -1) return
  const path = url.slice(idx + tanda.length)
  await supabase.storage.from(bucket).remove([path]).catch(() => {})
}
