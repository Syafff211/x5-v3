'use client'

import { useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { CheckCircle2, ClipboardList, Clock, FileUp, Loader2, Paperclip, Star, Upload, X } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/shared/empty-state'
import { useAuthStore } from '@/store/auth-store'
import { nowIso, uid, useDataStore } from '@/store/data-store'
import { cn, deadlineInfo, formatBytes, formatDate, formatDateTime, gradeBadge, sanitizeText, validateFile } from '@/lib/utils'
import type { Assignment } from '@/types/database'

export default function AssignmentsPage() {
  const profile = useAuthStore((s) => s.profile)
  const assignments = useDataStore((s) => s.assignments)
  const submissions = useDataStore((s) => s.submissions)
  const add = useDataStore((s) => s.add)

  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted'>('all')
  const [active, setActive] = useState<Assignment | null>(null)
  const [desc, setDesc] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const mySubs = useMemo(() => submissions.filter((s) => s.student_id === profile?.id), [submissions, profile?.id])
  const subFor = (id: string) => mySubs.find((s) => s.assignment_id === id)

  const list = useMemo(() => {
    const sorted = [...assignments].sort((a, b) => +new Date(a.deadline) - +new Date(b.deadline))
    if (filter === 'pending') return sorted.filter((a) => !subFor(a.id))
    if (filter === 'submitted') return sorted.filter((a) => subFor(a.id))
    return sorted
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignments, mySubs, filter])

  function pickFile(f: File | null) {
    if (!f) return setFile(null)
    const err = validateFile(f)
    if (err) return toast.error(err)
    setFile(f)
  }

  async function submitWork(e: React.FormEvent) {
    e.preventDefault()
    if (!active) return
    if (!file && desc.trim().length < 3) {
      toast.error('Lampirkan file atau tulis keterangan pengumpulan.')
      return
    }
    setSaving(true)
    await new Promise((r) => setTimeout(r, 700))
    add('assignment_submissions', {
      id: uid(),
      assignment_id: active.id,
      student_id: profile!.id,
      file_url: file?.name ?? null,
      description: sanitizeText(desc, 800) || null,
      submitted_at: nowIso(),
      score: null,
      feedback: null,
    })
    setSaving(false)
    setActive(null)
    setDesc('')
    setFile(null)
    toast.success('PR berhasil dikumpulkan!')
  }

  const counts = {
    all: assignments.length,
    pending: assignments.filter((a) => !subFor(a.id)).length,
    submitted: mySubs.length,
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Info PR" description="Daftar PR kelas, deadline, dan status pengumpulan." />

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList>
          <TabsTrigger value="all">Semua ({counts.all})</TabsTrigger>
          <TabsTrigger value="pending">Belum ({counts.pending})</TabsTrigger>
          <TabsTrigger value="submitted">Dikumpulkan ({counts.submitted})</TabsTrigger>
        </TabsList>
      </Tabs>

      {list.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Tidak ada PR" description="Belum ada PR pada kategori ini." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((a, i) => {
            const sub = subFor(a.id)
            const info = deadlineInfo(a.deadline)
            return (
              <motion.div key={a.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.05, 0.4) }}>
                <Card glass className="flex h-full flex-col p-5 card-hover">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        <ClipboardList className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold">{a.title}</h3>
                        <Badge variant="outline" className="mt-1 text-[11px]">
                          {a.subject}
                        </Badge>
                      </div>
                    </div>
                    {sub ? (
                      <Badge variant="success" className="shrink-0 gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Terkumpul
                      </Badge>
                    ) : (
                      <Badge
                        variant={info.tone === 'overdue' || info.tone === 'urgent' ? 'destructive' : info.tone === 'soon' ? 'warning' : 'outline'}
                        className="shrink-0"
                      >
                        {info.label}
                      </Badge>
                    )}
                  </div>

                  <p className="mb-4 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">{a.description}</p>

                  <div className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    Deadline: {formatDateTime(a.deadline)}
                  </div>

                  {sub ? (
                    <div className="rounded-xl border border-border/60 bg-card/40 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground">Dikumpulkan {formatDate(sub.submitted_at)}</p>
                        {sub.score != null ? (
                          <Badge variant="outline" className={cn('border gap-1', gradeBadge(sub.score))}>
                            <Star className="h-3 w-3" /> {sub.score}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Menunggu nilai</Badge>
                        )}
                      </div>
                      {sub.file_url && (
                        <p className="mt-2 flex items-center gap-1.5 truncate text-xs text-primary">
                          <Paperclip className="h-3 w-3 shrink-0" /> {sub.file_url}
                        </p>
                      )}
                      {sub.feedback && <p className="mt-2 text-xs italic text-muted-foreground">&ldquo;{sub.feedback}&rdquo;</p>}
                    </div>
                  ) : (
                    <Button variant="gradient" className="w-full" onClick={() => setActive(a)}>
                      <Upload className="h-4 w-4" /> Kumpulkan PR
                    </Button>
                  )}
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Submit dialog */}
      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kumpulkan PR</DialogTitle>
            <DialogDescription>{active?.title} · {active?.subject}</DialogDescription>
          </DialogHeader>

          <form onSubmit={submitWork} className="space-y-4">
            <div className="space-y-2">
              <Label>File PR</Label>
              <input
                ref={inputRef}
                type="file"
                className="sr-only"
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.zip,.txt"
              />
              {file ? (
                <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
                  <Paperclip className="h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                  </div>
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => setFile(null)} aria-label="Hapus file">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border px-4 py-8 text-center transition-colors hover:border-primary/50 hover:bg-accent/30"
                >
                  <FileUp className="h-7 w-7 text-muted-foreground" />
                  <span className="text-sm font-medium">Klik untuk pilih file</span>
                  <span className="text-xs text-muted-foreground">PDF, DOC, PPT, XLS, gambar, ZIP · maks 10 MB</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sub-desc">Keterangan</Label>
              <Textarea
                id="sub-desc"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Catatan untuk guru, misalnya bagian yang belum selesai..."
                maxLength={800}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setActive(null)}>
                Batal
              </Button>
              <Button type="submit" variant="gradient" disabled={saving}>
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Mengunggah...</> : 'Kumpulkan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
