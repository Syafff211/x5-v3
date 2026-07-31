'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ClipboardList, Eye, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/shared/empty-state'
import { useAuthStore } from '@/store/auth-store'
import { nowIso, uid, useDataStore } from '@/store/data-store'
import { SUBJECTS } from '@/lib/demo-data'
import { cn, deadlineInfo, formatDate, formatDateTime, gradeBadge, initials, sanitizeText } from '@/lib/utils'
import type { Assignment } from '@/types/database'

const EMPTY = { title: '', subject: SUBJECTS[0], description: '', deadline: '' }

export default function AdminAssignmentsPage() {
  const profile = useAuthStore((s) => s.profile)
  const assignments = useDataStore((s) => s.assignments)
  const submissions = useDataStore((s) => s.submissions)
  const students = useDataStore((s) => s.students)
  const add = useDataStore((s) => s.add)
  const update = useDataStore((s) => s.update)
  const remove = useDataStore((s) => s.remove)

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Assignment | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [viewing, setViewing] = useState<Assignment | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Assignment | null>(null)
  const [scores, setScores] = useState<Record<string, string>>({})
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({})

  const list = useMemo(() => [...assignments].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)), [assignments])
  const subsFor = (id: string) => submissions.filter((s) => s.assignment_id === id)
  const studentOf = (id: string) => students.find((s) => s.id === id)
  const studentCount = students.filter((s) => s.role === 'student').length

  function openAdd() {
    setEditing(null)
    const d = new Date()
    d.setDate(d.getDate() + 7)
    d.setHours(23, 59, 0, 0)
    setForm({ ...EMPTY, deadline: toLocalInput(d) })
    setOpen(true)
  }

  function openEdit(a: Assignment) {
    setEditing(a)
    setForm({ title: a.title, subject: a.subject, description: a.description ?? '', deadline: toLocalInput(new Date(a.deadline)) })
    setOpen(true)
  }

  function save(e: React.FormEvent) {
    e.preventDefault()
    if (form.title.trim().length < 4) return toast.error('Judul PR minimal 4 karakter.')
    if (!form.deadline) return toast.error('Deadline wajib diisi.')

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
      add('assignments', { id: uid(), file_url: null, created_by: profile?.id ?? null, created_at: nowIso(), ...payload })
      toast.success('Info PR berhasil dibuat.')
    }
    setOpen(false)
  }

  function saveGrade(subId: string) {
    const raw = scores[subId]
    const score = Number(raw)
    if (raw === undefined || raw === '' || Number.isNaN(score) || score < 0 || score > 100) {
      return toast.error('Nilai harus berupa angka 0–100.')
    }
    update('assignment_submissions', subId, { score, feedback: sanitizeText(feedbacks[subId] ?? '', 500) || null })
    toast.success('Nilai tersimpan.')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kelola Info PR"
        description={`${assignments.length} PR · ${submissions.filter((s) => s.score == null).length} menunggu penilaian`}
        action={<Button variant="gradient" onClick={openAdd}><Plus className="h-4 w-4" /> Buat PR</Button>}
      />

      {list.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Belum ada PR"
          description="Buat PR pertama untuk kelas X-5."
          action={<Button variant="gradient" onClick={openAdd}><Plus className="h-4 w-4" /> Buat PR</Button>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((a) => {
            const subs = subsFor(a.id)
            const graded = subs.filter((s) => s.score != null).length
            const info = deadlineInfo(a.deadline)
            const pct = studentCount ? Math.round((subs.length / studentCount) * 100) : 0
            return (
              <Card key={a.id} glass className="flex h-full flex-col p-5">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">{a.title}</h3>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <Badge variant="outline" className="text-[11px]">{a.subject}</Badge>
                      <Badge variant={info.tone === 'overdue' ? 'destructive' : info.tone === 'soon' || info.tone === 'urgent' ? 'warning' : 'outline'} className="text-[11px]">
                        {info.label}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => openEdit(a)} aria-label="Edit PR"><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => setConfirmDelete(a)} aria-label="Hapus PR" className="text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <p className="mb-3 line-clamp-2 flex-1 text-sm text-muted-foreground">{a.description}</p>
                <p className="mb-3 text-xs text-muted-foreground">Deadline: {formatDateTime(a.deadline)}</p>

                <div className="mb-3">
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Pengumpulan</span>
                    <span className="font-medium">{subs.length}/{studentCount} · {graded} dinilai</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full brand-gradient transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <Button variant="outline" size="sm" className="w-full" onClick={() => setViewing(a)}>
                  <Eye className="h-4 w-4" /> Lihat Pengumpulan ({subs.length})
                </Button>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create / Edit */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Info PR' : 'Buat Info PR'}</DialogTitle>
            <DialogDescription>Isi detail PR yang akan dibagikan ke siswa kelas X-5.</DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="t-title">Judul PR *</Label>
              <Input id="t-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required maxLength={150} placeholder="Contoh: Laporan Praktikum Hukum Newton" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="t-subject">Mata Pelajaran *</Label>
                <Select value={form.subject} onValueChange={(v) => setForm({ ...form, subject: v })}>
                  <SelectTrigger id="t-subject"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="t-deadline">Deadline *</Label>
                <Input id="t-deadline" type="datetime-local" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-desc">Deskripsi</Label>
              <Textarea id="t-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={2000} className="min-h-28" placeholder="Instruksi pengerjaan tugas..." />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" variant="gradient">{editing ? 'Simpan Perubahan' : 'Buat PR'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Submissions */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pengumpulan PR</DialogTitle>
            <DialogDescription>{viewing?.title} · {viewing?.subject}</DialogDescription>
          </DialogHeader>
          <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1 scrollbar-thin">
            {viewing && subsFor(viewing.id).length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">Belum ada siswa yang mengumpulkan.</p>
            )}
            {viewing &&
              subsFor(viewing.id).map((s) => {
                const st = studentOf(s.student_id)
                return (
                  <div key={s.id} className="rounded-xl border border-border/60 bg-card/40 p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 shrink-0">
                        {st?.avatar_url && <AvatarImage src={st.avatar_url} alt="" />}
                        <AvatarFallback className="text-[10px]">{initials(st?.full_name ?? '?')}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{st?.full_name ?? 'Siswa'}</p>
                        <p className="text-xs text-muted-foreground">Dikumpulkan {formatDate(s.submitted_at)}</p>
                      </div>
                      {s.score != null && (
                        <Badge variant="outline" className={cn('border gap-1', gradeBadge(s.score))}>
                          <Star className="h-3 w-3" /> {s.score}
                        </Badge>
                      )}
                    </div>
                    {s.file_url && <p className="mt-2 truncate text-xs text-primary">📎 {s.file_url}</p>}
                    {s.description && <p className="mt-1 text-xs text-muted-foreground">{s.description}</p>}
                    <div className="mt-3 flex flex-wrap items-end gap-2">
                      <div className="w-24 space-y-1">
                        <Label htmlFor={`sc-${s.id}`} className="text-[11px]">Nilai</Label>
                        <Input
                          id={`sc-${s.id}`}
                          type="number"
                          min={0}
                          max={100}
                          className="h-9"
                          defaultValue={s.score ?? ''}
                          onChange={(e) => setScores((p) => ({ ...p, [s.id]: e.target.value }))}
                        />
                      </div>
                      <div className="min-w-[140px] flex-1 space-y-1">
                        <Label htmlFor={`fb-${s.id}`} className="text-[11px]">Feedback</Label>
                        <Input
                          id={`fb-${s.id}`}
                          className="h-9"
                          defaultValue={s.feedback ?? ''}
                          placeholder="Catatan untuk siswa..."
                          onChange={(e) => setFeedbacks((p) => ({ ...p, [s.id]: e.target.value }))}
                        />
                      </div>
                      <Button size="sm" variant="gradient" onClick={() => saveGrade(s.id)}>Simpan</Button>
                    </div>
                  </div>
                )
              })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Info PR?</DialogTitle>
            <DialogDescription>&ldquo;{confirmDelete?.title}&rdquo; beserta pengumpulannya akan dihapus permanen.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Batal</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!confirmDelete) return
                submissions.filter((s) => s.assignment_id === confirmDelete.id).forEach((s) => remove('assignment_submissions', s.id))
                remove('assignments', confirmDelete.id)
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
