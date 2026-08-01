import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

export const runtime = 'nodejs'

const FOLDER: Record<string, string> = {
  gallery: 'photos',
  avatars: 'avatars',
}

const EKSTENSI: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

const MAKS = 5 * 1024 * 1024

/**
 * Menyimpan gambar ke folder `public/` dan mengembalikan URL rapi
 * seperti `/photos/galeri-1.jpg`.
 *
 * CATATAN PENTING
 * Ini hanya bekerja saat `npm run dev` / server sendiri, karena filesystem
 * Vercel bersifat read-only saat runtime. Di produksi, aplikasi otomatis
 * memakai Supabase Storage (lihat src/lib/upload.ts).
 */
export async function POST(req: Request) {
  // Vercel & serverless lain punya filesystem read-only.
  // Deteksi lewat env bawaan platform, bukan NODE_ENV, supaya `next start`
  // di server sendiri (VPS/lokal) tetap bisa menulis berkas.
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return NextResponse.json(
      { error: 'Filesystem read-only. Gunakan Supabase Storage.', fallback: true },
      { status: 501 }
    )
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Permintaan tidak valid.' }, { status: 400 })
  }

  const file = form.get('file')
  const bucket = String(form.get('bucket') ?? 'gallery')
  const namaDiminta = String(form.get('nama') ?? '').trim()

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Berkas tidak ditemukan.' }, { status: 400 })
  }
  if (!EKSTENSI[file.type]) {
    return NextResponse.json({ error: 'Format harus JPG, PNG, WebP, atau GIF.' }, { status: 400 })
  }
  if (file.size > MAKS) {
    return NextResponse.json({ error: 'Ukuran maksimal 5 MB.' }, { status: 400 })
  }

  const folder = FOLDER[bucket] ?? 'photos'
  const ext = EKSTENSI[file.type]

  // Hanya huruf, angka, dan strip — cegah path traversal.
  const dasar =
    namaDiminta
      .toLowerCase()
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'foto'

  const namaFile = `${dasar}-${Date.now().toString(36)}.${ext}`
  const tujuan = path.join(process.cwd(), 'public', folder)

  try {
    await mkdir(tujuan, { recursive: true })
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(path.join(tujuan, namaFile), buffer)
  } catch (e) {
    console.error('[upload] gagal menulis berkas:', e)
    return NextResponse.json(
      { error: 'Gagal menyimpan berkas ke server.', fallback: true },
      { status: 500 }
    )
  }

  return NextResponse.json({ url: `/${folder}/${namaFile}` })
}
