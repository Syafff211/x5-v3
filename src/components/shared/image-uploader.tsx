'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { ImagePlus, Loader2, UploadCloud, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { unggahGambar } from '@/lib/upload'
import { cn, formatBytes } from '@/lib/utils'

interface Props {
  value?: string | null
  onChange: (url: string | null) => void
  bucket: 'avatars' | 'gallery' | 'materials'
  prefix?: string
  label?: string
  /** Rasio pratinjau. 'square' untuk avatar. */
  aspect?: 'square' | 'video'
  className?: string
}

export function ImageUploader({
  value,
  onChange,
  bucket,
  prefix,
  label = 'Unggah gambar',
  aspect = 'video',
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [sedangUnggah, setSedangUnggah] = useState(false)
  const [seret, setSeret] = useState(false)
  const [galat, setGalat] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  async function proses(file: File | null | undefined) {
    if (!file) return
    setGalat(null)
    setSedangUnggah(true)
    setInfo(`${file.name} · ${formatBytes(file.size)}`)

    const { url, error } = await unggahGambar(file, bucket, prefix)

    setSedangUnggah(false)
    if (error) {
      setGalat(error)
      setInfo(null)
      return
    }
    onChange(url)
  }

  return (
    <div className={cn('space-y-2', className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={(e) => {
          proses(e.target.files?.[0])
          e.target.value = ''
        }}
      />

      {value ? (
        <div
          className={cn(
            'group relative overflow-hidden rounded-xl border border-border bg-muted',
            aspect === 'square' ? 'aspect-square w-32' : 'aspect-video w-full'
          )}
        >
          <Image
            src={value}
            alt="Pratinjau"
            fill
            sizes="400px"
            className="object-cover"
            unoptimized={value.startsWith('data:')}
          />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={() => inputRef.current?.click()}
            >
              Ganti
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label="Hapus gambar"
              className="text-rose-300 hover:bg-white/20"
              onClick={() => {
                onChange(null)
                setInfo(null)
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setSeret(true)
          }}
          onDragLeave={() => setSeret(false)}
          onDrop={(e) => {
            e.preventDefault()
            setSeret(false)
            proses(e.dataTransfer.files?.[0])
          }}
          disabled={sedangUnggah}
          className={cn(
            'flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 transition-colors',
            seret ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50 hover:bg-accent/30',
            sedangUnggah && 'pointer-events-none opacity-70',
            aspect === 'square' && 'aspect-square w-32 py-0'
          )}
        >
          {sedangUnggah ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-xs font-medium">Memproses...</span>
            </>
          ) : (
            <>
              {seret ? (
                <UploadCloud className="h-6 w-6 text-primary" />
              ) : (
                <ImagePlus className="h-6 w-6 text-muted-foreground" />
              )}
              <span className="text-center text-xs font-medium">{label}</span>
              {aspect !== 'square' && (
                <span className="text-center text-[11px] text-muted-foreground">
                  Klik atau seret berkas · JPG, PNG, WebP · maks 5 MB
                </span>
              )}
            </>
          )}
        </button>
      )}

      {info && !galat && <p className="truncate text-[11px] text-muted-foreground">{info}</p>}
      {galat && <p className="text-[11px] text-destructive">{galat}</p>}
    </div>
  )
}
