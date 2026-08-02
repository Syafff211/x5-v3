'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ClipboardList, Pencil, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/shared/empty-state'
import { useAuthStore } from '@/store/auth-store'
import { nowIso, uid, useDataStore } from '@/store/data-store'

import { deadlineInfo, formatDateTime, sanitizeText } from '@/lib/utils'
import type { Assignment } from '@/types/database'

const EMPTY = { title: '', subject: '', description: '', deadline: '' }

export default function AdminAssignmentsPage() {
  const profile = useAuthStore((s) => s.profile)
  const assignments = useDataStore((s) => s.assignments)
  const subjects = useDataStore((s) => s.subjects)
  const add = useDataStore((s) => s.add)
  const update = useDataStore((s) => s.update)
  const remove = useDataStore((s) => s.remove)

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Assignment | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [confirmDelete, setConfirmDelete] = useState<Assignment | null>(null)

  const list = useMemo(
    () => [...assignments].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)),
    [assignments]
  )

  const daftarMapel = useMemo(() => [...subjects].sort((a, b) => a.order - b.order), [subjects])

  const aktif = useMemo(
    () => assignments.filter((a) => new Date(a.deadline).getTime() >= Date.now()).length,
    [assignments]
  )

  function openAdd() {
    setEditing(null)
    const d = new Date()
    d.setDate(d.getDate() + 7)
    d.setHours(23, 59, 0, 0)
    setForm({ ...EMPTY, subject: daftarMapel[0]?.name ?? '', deadline: toLocalInput(d) })
    setOpen(true)
  }

  function openEdit(a: Assignment) {
    setEditing(a)
    setForm({
      title: a.title,
      subject: a.subject,
      description: a.description ?? '',
      deadline: toLocalInput(new Date(a.deadline)),
    })
    setOpen(true)
  }

  function save(e: React.FormEvent) {
    e.preventDefault()
    if (form.title.trim().length < 4) return toast.error('Judul PR minimal 4 karakter.')
    if (!form.deadline) return toast.error('Tenggat wajib diisi.')

    const payload = {
      title: sanitizeText(form.title, 150),
      subject: form.subject,
      description: sanitizeText(form.description, 2000),
      deadline: new Date(form.deadline).toISOString(),
      updated_at: nowIso(),
    }

    if (editing) {
      update('assignments', editing.id, payload)
      toast.success('Info PR diperbarui.')
    } else {
      add('assignments', {
        id: uid(),
        file_url: null,
        created_by: profile?.id ?? null,
        created_at: nowIso(),
        ...payload,
      })
      toast.success('Info PR berhasil dibuat.')
    }
    setOpen(false)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kelola Info PR"
        description={`${assignments.length} PR · ${aktif} masih aktif`}
        action={
          <Button variant="gradient" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Buat PR
          </Button>
        }
      />

      {list.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Belum ada PR"
          description="Buat informasi PR pertama untuk kelas X-5."
          action={
            <Button variant="gradient" onClick={openAdd}>
              <Plus className="h-4 w-4" /> Buat PR
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((a) => {
            const info = deadlineInfo(a.deadline)
            return (
              <Card key={a.id} glass className="flex h-full flex-col p-5">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">{a.title}</h3>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <Badge variant="outline" className="text-[11px]">{a.subject}</Badge>
                      <Badge
                        variant={
                          info.tone === 'overdue'
                            ? 'destructive'
                            : info.tone === 'soon' || info.tone === 'urgent'
                              ? 'warning'
                              : 'outline'
                        }
                        className="text-[11px]"
                      >
                        {info.label}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => openEdit(a)} aria-label="Edit PR">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setConfirmDelete(a)}
                      aria-label="Hapus PR"
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {a.description && (
                  <p className="mb-3 line-clamp-3 flex-1 text-sm text-muted-foreground">{a.description}</p>
                )}
                <p className="text-xs text-muted-foreground">Tenggat: {formatDateTime(a.deadline)}</p>
              </Card>
            )
          })}
        </div>
      )}

      {/* Buat / Edit */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Info PR' : 'Buat Info PR'}</DialogTitle>
            <DialogDescription>Informasi ini akan tampil di menu Info PR siswa.</DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="t-title">Judul PR *</Label>
              <Input
                id="t-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                maxLength={150}
                placeholder="Contoh: Latihan Soal Trigonometri Bab 4"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="t-subject">Mata Pelajaran *</Label>
                <Select value={form.subject} onValueChange={(v) => setForm({ ...form, subject: v })}>
                  <SelectTrigger id="t-subject"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-64">
                    {daftarMapel.map((s) => (
                      <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="t-deadline">Tenggat *</Label>
                <Input
                  id="t-deadline"
                  type="datetime-local"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-desc">Keterangan</Label>
              <Textarea
                id="t-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                maxLength={2000}
                className="min-h-28"
                placeholder="Halaman, nomor soal, atau instruksi lain..."
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" variant="gradient">{editing ? 'Simpan Perubahan' : 'Buat PR'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Hapus */}
      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Info PR?</DialogTitle>
            <DialogDescription>&ldquo;{confirmDelete?.title}&rdquo; akan dihapus permanen.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Batal</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirmDelete) remove('assignments', confirmDelete.id)
                toast.success('Info PR dihapus.')
                setConfirmDelete(null)
              }}
            >
              <Trash2 className="h-4 w-4" /> Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
