'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Images, X, ZoomIn } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useDataStore } from '@/store/data-store'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { cn, formatDate } from '@/lib/utils'

/** Jumlah foto yang tampil sebelum pengunjung menekan "Lihat semua". */
const TAMPIL_AWAL = 6

export function GallerySection() {
  const gallery = useDataStore((s) => s.gallery)
  const publicHydrated = useDataStore((s) => s.publicHydrated)
  const [index, setIndex] = useState<number | null>(null)
  const [semua, setSemua] = useState(false)

  // Saat Supabase aktif, tunggu data server sebelum menampilkan apa pun.
  // Tanpa ini, foto contoh sempat berkedip lalu tertimpa foto asli.
  const menunggu = isSupabaseConfigured && !publicHydrated

  // Galeri selalu berasal dari data asli. Tidak ada foto contoh —
  // kalau kosong, tampilkan pesan kosong yang jujur.
  const semuaFoto = useMemo(
    () =>
      gallery.map((g) => ({
        id: g.id,
        title: g.title,
        category: g.category,
        media_url: g.media_url,
        created_at: g.created_at,
      })),
    [gallery]
  )

  const adaSisa = semuaFoto.length > TAMPIL_AWAL

  // Yang benar-benar dirender di grid.
  const items = useMemo(
    () => (semua ? semuaFoto : semuaFoto.slice(0, TAMPIL_AWAL)),
    [semua, semuaFoto]
  )

  // Lightbox selalu menelusuri SELURUH galeri, bukan cuma yang tampil.
  // Jadi dari foto ke-6 pengunjung bisa terus menekan panah kanan
  // tanpa harus menutup dan menekan "Lihat semua" dulu.
  const tutup = useCallback(() => setIndex(null), [])
  const prev = useCallback(
    () => setIndex((i) => (i === null ? null : (i - 1 + semuaFoto.length) % semuaFoto.length)),
    [semuaFoto.length]
  )
  const next = useCallback(
    () => setIndex((i) => (i === null ? null : (i + 1) % semuaFoto.length)),
    [semuaFoto.length]
  )

  useEffect(() => {
    if (index === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') tutup()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [index, tutup, prev, next])

  const aktif = index !== null ? semuaFoto[index] : null

  return (
    <section id="galeri" className="relative px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <Badge variant="outline" className="mb-4 gap-1.5">
            <Images className="h-3.5 w-3.5" />
            Galeri Kelas
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Momen yang <span className="text-gradient">kami rekam bersama</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Dari diskusi di kelas sampai kegiatan di luar sekolah — setiap cerita punya tempatnya di sini.
          </p>
          {!menunggu && semuaFoto.length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground/80">
              {semuaFoto.length} foto tersimpan
            </p>
          )}
        </motion.div>

        {menunggu ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : semuaFoto.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border py-14 text-center text-sm text-muted-foreground">
            Belum ada foto di galeri.
          </p>
        ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
          {items.map((g, i) => (
            <motion.button
              key={g.id}
              initial={{ opacity: 0, scale: 0.94 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: Math.min(i * 0.06, 0.4) }}
              onClick={() => setIndex(i)}
              aria-label={`Lihat foto: ${g.title}`}
              className={cn(
                'group relative overflow-hidden rounded-2xl border border-border/60 bg-muted text-left',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                // Semua kartu rasio sama -> grid selalu rapat tanpa celah.
                'aspect-[4/3]'
              )}
            >
              <Image
                src={g.media_url}
                alt={g.title}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                unoptimized={g.media_url.startsWith('data:') || g.media_url.startsWith('blob:')}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent opacity-85 transition-opacity group-hover:opacity-100" />
              <div className="absolute inset-x-0 bottom-0 p-3">
                <p className="line-clamp-2 text-xs font-semibold text-white sm:text-sm">{g.title}</p>
                <p className="mt-0.5 text-[10px] text-white/75">{g.category}</p>
              </div>
              <div className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-lg bg-black/50 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                <ZoomIn className="h-4 w-4" />
              </div>
            </motion.button>
          ))}
        </div>
        )}

        {/* Lihat semua / Tampilkan lebih sedikit */}
        {!menunggu && adaSisa && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-8 flex justify-center"
          >
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                // Saat menutup, kembalikan pandangan ke awal galeri supaya
                // pengunjung tidak tiba-tiba terlempar ke bagian bawah halaman.
                if (semua) {
                  document.getElementById('galeri')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
                setSemua((v) => !v)
              }}
              className="gap-2 rounded-full px-6"
            >
              {semua ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Tampilkan lebih sedikit
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Lihat semua foto
                  <span className="ml-0.5 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                    +{semuaFoto.length - TAMPIL_AWAL}
                  </span>
                </>
              )}
            </Button>
          </motion.div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {aktif && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={tutup}
            role="dialog"
            aria-modal="true"
            aria-label={aktif.title}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/92 p-4 backdrop-blur-sm"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={tutup}
              aria-label="Tutup"
              className="absolute right-4 top-4 z-10 text-white hover:bg-white/15"
            >
              <X className="h-5 w-5" />
            </Button>

            {semuaFoto.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => { e.stopPropagation(); prev() }}
                  aria-label="Sebelumnya"
                  className="absolute left-2 z-10 h-11 w-11 rounded-full bg-black/40 text-white hover:bg-white/20 sm:left-6"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => { e.stopPropagation(); next() }}
                  aria-label="Berikutnya"
                  className="absolute right-2 z-10 h-11 w-11 rounded-full bg-black/40 text-white hover:bg-white/20 sm:right-6"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}

            <motion.div
              key={aktif.id}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-black/40">
                <Image src={aktif.media_url} alt={aktif.title} fill sizes="90vw" className="object-contain" priority />
              </div>
              <div className="mt-4 text-center text-white">
                <h3 className="text-lg font-semibold">{aktif.title}</h3>
                <div className="mt-2 flex items-center justify-center gap-2 text-xs text-white/70">
                  <Badge variant="outline" className="border-white/30 text-white">{aktif.category}</Badge>
                  {aktif.created_at && <span>{formatDate(aktif.created_at)}</span>}
                  <span>·</span>
                  <span>{(index ?? 0) + 1} / {semuaFoto.length}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
