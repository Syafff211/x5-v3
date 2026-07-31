'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Megaphone, Pencil, Pin, PinOff, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/shared/empty-state'
import { useAuthStore } from '@/store/auth-store'
import { nowIso, uid, useDataStore } from '@/store/data-store'
import { cn, formatDate, relativeTime, sanitizeText } from '@/lib/utils'
import type { Announcement } from '@/types/database'

const EMPTY = { title: '', content: '', is_pinned: false, schedule_at: '' }

export default function AdminAnnouncementsPage() {
  const profile = useAuthStore((s) => s.profile)
  const announcements = useDataStore((s) => s.announcements)
  const add = useDataStore((s) => s.add)
  const update = useDataStore((s) => s.update)
  const remove = useDataStore((s) => s.remove)

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Announcement | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [confirmDelete, setConfirmDelete] = useState<Announcement | null>(null)

  const list = useMemo(
    () =>
      [...announcements].sort(
        (a, b) => Number(b.is_pinned) - Number(a.is_pinned) || +new Date(b.created_at) - +new Date(a.created_at)
      ),
    [announcements]
  )

  function openAdd() {
    setEditing(null)
    setForm(EMPTY)
    setOpen(true)
  }

  function openEdit(a: Announcement) {
    setEditing(a)
    setForm({ title: a.title, content: a.content, is_pinned: a.is_pinned, schedule_at: '' })
    setOpen(true)
  }

  function save(e: React.FormEvent) {
    e.preventDefault()
    if (form.title.trim().length < 4) return toast.error('Judul minimal 4 karakter.')
    if (form.content.trim().length < 10) return toast.error('Isi pengumuman minimal 10 karakter.')

    const payload = {
      title: sanitizeText(form.title, 150),
      content: sanitizeText(form.content, 3000),
      is_pinned: form.is_pinned,
      updated_at: nowIso(),
    }

    if (editing) {
      update('announcements', editing.id, payload)
      toast.success('Pengumuman diperbarui.')
    } else {
      const createdAt = form.schedule_at ? new Date(form.schedule_at).toISOString() : nowIso()
      add('announcements', { id: uid(), created_by: profile?.id ?? null, created_at: createdAt, ...payload })
      toast.success(form.schedule_at ? 'Pengumuman dijadwalkan.' : 'Pengumuman dipublikasikan.')
    }
    setOpen(false)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kelola Pengumuman"
        description={`${announcements.length} pengumuman · ${announcements.filter((a) => a.is_pinned).length} dipin`}
        action={<Button variant="gradient" onClick={openAdd}><Plus className="h-4 w-4" /> Buat Pengumuman</Button>}
      />

      {list.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="Belum ada pengumuman"
          description="Buat pengumuman pertama untuk kelas."
          action={<Button variant="gradient" onClick={openAdd}><Plus className="h-4 w-4" /> Buat Pengumuman</Button>}
        />
      ) : (
        <div className="space-y-3">
          {list.map((a) => {
            const scheduled = new Date(a.created_at).getTime() > Date.now()
            return (
              <Card key={a.id} glass className={cn('relative overflow-hidden p-5', a.is_pinned && 'border-amber-500/30 bg-amber-500/[0.04]')}>
                {a.is_pinned && <div className="absolute inset-y-0 left-0 w-1 bg-amber-500" />}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{a.title}</h3>
                      {a.is_pinned && <Badge variant="warning" className="gap-1"><Pin className="h-3 w-3" /> Dipin</Badge>}
                      {scheduled && <Badge variant="secondary">Terjadwal</Badge>}
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{a.content}</p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {formatDate(a.created_at, true)} · {scheduled ? 'akan tayang' : relativeTime(a.created_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={a.is_pinned ? 'Lepas pin' : 'Pin pengumuman'}
                      onClick={() => {
                        update('announcements', a.id, { is_pinned: !a.is_pinned })
                        toast.success(a.is_pinned ? 'Pin dilepas.' : 'Pengumuman dipin.')
                      }}
                      className={a.is_pinned ? 'text-amber-500' : ''}
                    >
                      {a.is_pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => openEdit(a)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => setConfirmDelete(a)} aria-label="Hapus" className="text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Pengumuman' : 'Buat Pengumuman'}</DialogTitle>
            <DialogDescription>Pengumuman akan tampil di dashboard seluruh siswa.</DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="a-title">Judul *</Label>
              <Input id="a-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required maxLength={150} placeholder="Contoh: Jadwal Penilaian Tengah Semester" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="a-content">Isi Pengumuman *</Label>
              <Textarea id="a-content" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required maxLength={3000} className="min-h-32" />
              <p className="text-right text-[11px] text-muted-foreground">{form.content.length}/3000</p>
            </div>
            {!editing && (
              <div className="space-y-2">
                <Label htmlFor="a-schedule">Jadwalkan (opsional)</Label>
                <Input id="a-schedule" type="datetime-local" value={form.schedule_at} onChange={(e) => setForm({ ...form, schedule_at: e.target.value })} />
                <p className="text-xs text-muted-foreground">Kosongkan untuk publikasi langsung.</p>
              </div>
            )}
            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card/40 p-3">
              <div>
                <Label htmlFor="a-pin" className="cursor-pointer">Pin pengumuman</Label>
                <p className="text-xs text-muted-foreground">Tampil paling atas dan ditandai penting.</p>
              </div>
              <Switch id="a-pin" checked={form.is_pinned} onCheckedChange={(v) => setForm({ ...form, is_pinned: v })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" variant="gradient">{editing ? 'Simpan' : 'Publikasikan'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Pengumuman?</DialogTitle>
            <DialogDescription>&ldquo;{confirmDelete?.title}&rdquo; akan dihapus permanen.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Batal</Button>
            <Button variant="destructive" onClick={() => { if (confirmDelete) remove('announcements', confirmDelete.id); toast.success('Pengumuman dihapus.'); setConfirmDelete(null) }}>
              <Trash2 className="h-4 w-4" /> Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
