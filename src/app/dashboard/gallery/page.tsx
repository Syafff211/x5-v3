'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Images, X, ZoomIn } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import { useDataStore } from '@/store/data-store'
import { GALLERY_CATEGORIES } from '@/lib/demo-data'
import { cn, formatDate } from '@/lib/utils'

export default function GalleryPage() {
  const gallery = useDataStore((s) => s.gallery)
  const [category, setCategory] = useState('Semua')
  const [index, setIndex] = useState<number | null>(null)

  const list = useMemo(
    () => gallery.filter((g) => category === 'Semua' || g.category === category),
    [gallery, category]
  )

  const close = useCallback(() => setIndex(null), [])
  const prev = useCallback(() => setIndex((i) => (i === null ? null : (i - 1 + list.length) % list.length)), [list.length])
  const next = useCallback(() => setIndex((i) => (i === null ? null : (i + 1) % list.length)), [list.length])

  useEffect(() => {
    if (index === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [index, close, prev, next])

  const current = index !== null ? list[index] : null

  return (
    <div className="space-y-6">
      <PageHeader title="Galeri" description="Dokumentasi kegiatan dan momen seru kelas X-5." />

      <div className="flex flex-wrap gap-2">
        {GALLERY_CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            aria-pressed={category === c}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all',
              category === c
                ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25'
                : 'border-border text-muted-foreground hover:border-primary/40 hover:bg-accent'
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState icon={Images} title="Belum ada media" description="Belum ada foto pada kategori ini." />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {list.map((g, i) => (
            <motion.button
              key={g.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(i * 0.04, 0.4) }}
              onClick={() => setIndex(i)}
              className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-border/60 bg-muted text-left focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Lihat ${g.title}`}
            >
              <Image
                src={g.media_url}
                alt={g.title}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 400px"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-80 transition-opacity group-hover:opacity-100" />
              <div className="absolute inset-x-0 bottom-0 p-3">
                <p className="line-clamp-1 text-xs font-semibold text-white sm:text-sm">{g.title}</p>
                <p className="mt-0.5 text-[10px] text-white/70 sm:text-xs">{g.category}</p>
              </div>
              <div className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-lg bg-black/50 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                <ZoomIn className="h-4 w-4" />
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {current && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/92 p-4 backdrop-blur-sm"
            onClick={close}
            role="dialog"
            aria-modal="true"
            aria-label={current.title}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={close}
              aria-label="Tutup"
              className="absolute right-4 top-4 z-10 text-white hover:bg-white/15"
            >
              <X className="h-5 w-5" />
            </Button>

            {list.length > 1 && (
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
              key={current.id}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-black/40">
                <Image src={current.media_url} alt={current.title} fill sizes="90vw" className="object-contain" priority />
              </div>
              <div className="mt-4 text-center text-white">
                <h2 className="text-lg font-semibold">{current.title}</h2>
                <div className="mt-2 flex items-center justify-center gap-2 text-xs text-white/70">
                  <Badge variant="outline" className="border-white/30 text-white">{current.category}</Badge>
                  <span>{formatDate(current.created_at)}</span>
                  <span>·</span>
                  <span>{(index ?? 0) + 1} / {list.length}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
