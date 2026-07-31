'use client'

import { useMemo, useState } from 'react'
import { motion, Reorder } from 'framer-motion'
import { toast } from 'sonner'
import { Crown, GripVertical, Network, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/shared/empty-state'
import { uid, useDataStore } from '@/store/data-store'
import { initials, sanitizeText } from '@/lib/utils'
import type { OrganizationMember } from '@/types/database'

const PRESET = ['Ketua Kelas', 'Wakil Ketua', 'Sekretaris', 'Bendahara', 'Seksi Kebersihan', 'Seksi Keamanan', 'Seksi Keagamaan', 'Seksi Olahraga']

export default function AdminOrganizationPage() {
  const students = useDataStore((s) => s.students)
  const organization = useDataStore((s) => s.organization)
  const add = useDataStore((s) => s.add)
  const remove = useDataStore((s) => s.remove)
  const replace = useDataStore((s) => s.replace)

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ position: PRESET[0], student_id: '' })

  const studentList = useMemo(
    () => students.filter((s) => s.role === 'student').sort((a, b) => a.full_name.localeCompare(b.full_name)),
    [students]
  )

  const ordered = useMemo(() => [...organization].sort((a, b) => a.order - b.order), [organization])

  function handleReorder(next: OrganizationMember[]) {
    replace('organization', next.map((m, i) => ({ ...m, order: i + 1 })))
  }

  function save(e: React.FormEvent) {
    e.preventDefault()
    if (!form.position.trim()) return toast.error('Jabatan wajib diisi.')
    if (!form.student_id) return toast.error('Pilih siswa terlebih dahulu.')

    const student = students.find((s) => s.id === form.student_id)
    add('organization', {
      id: uid(),
      position: sanitizeText(form.position, 60),
      student_id: form.student_id,
      order: organization.length + 1,
      profiles: student ? { id: student.id, full_name: student.full_name, avatar_url: student.avatar_url, nisn: student.nisn } : null,
    })
    toast.success('Pengurus ditambahkan.')
    setOpen(false)
    setForm({ position: PRESET[0], student_id: '' })
  }

  const nameOf = (m: OrganizationMember) =>
    m.profiles?.full_name ?? students.find((s) => s.id === m.student_id)?.full_name ?? 'Belum dipilih'
  const avatarOf = (m: OrganizationMember) =>
    m.profiles?.avatar_url ?? students.find((s) => s.id === m.student_id)?.avatar_url ?? null

  return (
    <div className="space-y-6">
      <PageHeader
        title="Struktur Organisasi"
        description="Kelola pengurus kelas. Seret kartu untuk mengubah urutan."
        action={<Button variant="gradient" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Tambah Pengurus</Button>}
      />

      {ordered.length === 0 ? (
        <EmptyState
          icon={Network}
          title="Belum ada pengurus"
          description="Tambahkan ketua, wakil, sekretaris, dan bendahara kelas."
          action={<Button variant="gradient" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Tambah Pengurus</Button>}
        />
      ) : (
        <>
          {/* Top 4 highlight */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ordered.slice(0, 4).map((m, i) => (
              <motion.div key={m.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <Card glass className="p-5 text-center card-hover">
                  <Avatar className="mx-auto h-16 w-16 ring-2 ring-primary/25">
                    {avatarOf(m) && <AvatarImage src={avatarOf(m)!} alt={nameOf(m)} />}
                    <AvatarFallback>{initials(nameOf(m))}</AvatarFallback>
                  </Avatar>
                  <Badge className="mt-3 gap-1"><Crown className="h-3 w-3" /> {m.position}</Badge>
                  <p className="mt-2 truncate text-sm font-semibold">{nameOf(m)}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Reorderable list */}
          <Card glass>
            <CardHeader>
              <CardTitle className="text-base">Daftar Pengurus ({ordered.length})</CardTitle>
              <p className="text-xs text-muted-foreground">Seret kartu untuk mengubah urutan tampilan.</p>
            </CardHeader>
            <CardContent>
              <Reorder.Group axis="y" values={ordered} onReorder={handleReorder} className="space-y-2">
                {ordered.map((m) => (
                  <Reorder.Item key={m.id} value={m} className="list-none">
                    <div className="flex cursor-grab items-center gap-3 rounded-xl border border-border/60 bg-card/60 p-3 active:cursor-grabbing">
                      <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-xs font-bold text-primary">{m.order}</span>
                      <Avatar className="h-9 w-9 shrink-0">
                        {avatarOf(m) && <AvatarImage src={avatarOf(m)!} alt="" />}
                        <AvatarFallback className="text-[10px]">{initials(nameOf(m))}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{nameOf(m)}</p>
                        <p className="truncate text-xs text-muted-foreground">{m.position}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0 text-destructive hover:bg-destructive/10"
                        aria-label="Hapus pengurus"
                        onClick={() => { remove('organization', m.id); toast.success('Pengurus dihapus.') }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Pengurus</DialogTitle>
            <DialogDescription>Pilih jabatan dan siswa yang mengisinya.</DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="o-pos">Jabatan *</Label>
              <Input id="o-pos" list="positions" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} required maxLength={60} />
              <datalist id="positions">
                {PRESET.map((p) => <option key={p} value={p} />)}
              </datalist>
            </div>
            <div className="space-y-2">
              <Label htmlFor="o-student">Siswa *</Label>
              <Select value={form.student_id} onValueChange={(v) => setForm({ ...form, student_id: v })}>
                <SelectTrigger id="o-student"><SelectValue placeholder="Pilih siswa" /></SelectTrigger>
                <SelectContent className="max-h-64">
                  {studentList.map((s) => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" variant="gradient">Tambah</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
