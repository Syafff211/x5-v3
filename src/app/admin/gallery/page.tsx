'use client'

import { useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { ArrowDown, ArrowUp, ImagePlus, Images, Pencil, Trash2, Upload } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/shared/empty-state'
import { useAuthStore } from '@/store/auth-store'
import { nowIso, uid, useDataStore } from '@/store/data-store'
import { GALLERY_CATEGORIES } from '@/lib/demo-data'
import { cn, formatDate, sanitizeText } from '@/lib/utils'
import type { GalleryItem } from '@/types/database'

const CATS = GALLERY_CATEGORIES.filter((c) => c !== 'Semua')

export default function AdminGalleryPage() {
  const profile = useAuthStore((s) => s.profile)
  const gallery = useDataStore((s) => s.gallery)
  const add = useDataStore((s) => s.add)
  const update = useDataStore((s) => s.update)
  const remove = useDataStore((s) => s.remove)
  const replace = useDataStore((s) => s.replace)

  const [filter, setFilter] = useState('Semua')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<GalleryItem | null>(null)
  const [form, setForm] = useState({ title: '', category: CATS[0], media_url: '' })
  const [confirmDelete, setConfirmDelete] = useState<GalleryItem | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const list = useMemo(() => gallery.filter((g) => filter === 'Semua' || g.category === filter), [gallery, filter])

  function openAdd() {
    setEditing(null)
    setForm({ title: '', category: CATS[0], media_url: '' })
    setOpen(true)
  }

  function openEdit(g: GalleryItem) {
    setEditing(g)
    setForm({ title: g.title, category: g.category, media_url: g.media_url })
    setOpen(true)
  }

  function save(e: React.FormEvent) {
    e.preventDefault()
    if (form.title.trim().length < 3) return toast.error('Judul minimal 3 karakter.')
    if (!editing && !form.media_url.trim()) return toast.error('URL gambar wajib diisi atau unggah file.')

    const payload = { title: sanitizeText(form.title, 120), category: form.category, media_url: form.media_url.trim() }
    if (editing) {
      update('gallery', editing.id, payload)
      toast.success('Item galeri diperbarui.')
    } else {
      add('gallery', { id: uid(), media_type: 'image' as const, uploaded_by: profile?.id ?? null, created_at: nowIso(), ...payload })
      toast.success('Media ditambahkan ke galeri.')
    }
    setOpen(false)
  }

  function bulkUpload(files: FileList) {
    let count = 0
    Array.from(files).forEach((f) => {
      if (!f.type.startsWith('image/')) return
      const url = URL.createObjectURL(f)
      add('gallery', {
        id: uid(),
        title: f.name.replace(/\.[^.]+$/, ''),
        category: filter === 'Semua' ? CATS[0] : filter,
        media_url: url,
        media_type: 'image' as const,
        uploaded_by: profile?.id ?? null,
        created_at: nowIso(),
      })
      count++
    })
    toast.success(`${count} foto diunggah.`)
    if (fileRef.current) fileRef.current.value = ''
  }

  function move(item: GalleryItem, dir: -1 | 1) {
    const idx = gallery.findIndex((g) => g.id === item.id)
    const target = idx + dir
    if (target < 0 || target >= gallery.length) return
    const next = [...gallery]
    ;[next[idx], next[target]] = [next[target], next[idx]]
    replace('gallery', next)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kelola Galeri"
        description={`${gallery.length} media dalam galeri kelas`}
        action={
          <>
            <input ref={fileRef} type="file" accept="image/*" multiple className="sr-only" onChange={(e) => e.target.files && bulkUpload(e.target.files)} />
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" /> Bulk Upload
            </Button>
            <Button variant="gradient" size="sm" onClick={openAdd}>
              <ImagePlus className="h-4 w-4" /> Tambah Media
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap gap-2">
        {GALLERY_CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            aria-pressed={filter === c}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all',
              filter === c ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:bg-accent'
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={Images}
          title="Galeri kosong"
          description="Unggah foto kegiatan kelas."
          action={<Button variant="gradient" onClick={openAdd}><ImagePlus className="h-4 w-4" /> Tambah Media</Button>}
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {list.map((g) => (
            <Card key={g.id} glass className="group overflow-hidden p-0">
              <div className="relative aspect-square bg-muted">
                <Image src={g.media_url} alt={g.title} fill sizes="240px" className="object-cover" unoptimized={g.media_url.startsWith('blob:')} />
                <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button variant="ghost" size="icon-sm" onClick={() => move(g, -1)} aria-label="Naikkan urutan" className="text-white hover:bg-white/20"><ArrowUp className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => move(g, 1)} aria-label="Turunkan urutan" className="text-white hover:bg-white/20"><ArrowDown className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => openEdit(g)} aria-label="Edit" className="text-white hover:bg-white/20"><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => setConfirmDelete(g)} aria-label="Hapus" className="text-rose-300 hover:bg-white/20"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="p-3">
                <p className="truncate text-xs font-medium">{g.title}</p>
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <Badge variant="outline" className="text-[10px]">{g.category}</Badge>
                  <span className="shrink-0 text-[10px] text-muted-foreground">{formatDate(g.created_at)}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Media' : 'Tambah Media'}</DialogTitle>
            <DialogDescription>Tambahkan foto kegiatan ke galeri kelas.</DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="g-title">Judul *</Label>
              <Input id="g-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required maxLength={120} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="g-cat">Kategori</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger id="g-cat"><SelectValue /></SelectTrigger>
                <SelectContent>{CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="g-url">URL Gambar {!editing && '*'}</Label>
              <Input id="g-url" type="url" value={form.media_url} onChange={(e) => setForm({ ...form, media_url: e.target.value })} placeholder="https://..." required={!editing} />
              <p className="text-xs text-muted-foreground">Setelah Supabase Storage aktif, upload file langsung tersedia.</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" variant="gradient">{editing ? 'Simpan' : 'Tambah'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Media?</DialogTitle>
            <DialogDescription>&ldquo;{confirmDelete?.title}&rdquo; akan dihapus dari galeri.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Batal</Button>
            <Button variant="destructive" onClick={() => { if (confirmDelete) remove('gallery', confirmDelete.id); toast.success('Media dihapus.'); setConfirmDelete(null) }}>
              <Trash2 className="h-4 w-4" /> Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
