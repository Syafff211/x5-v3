'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { BookOpen, GripVertical, Pencil, Plus, Trash2, X } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/shared/empty-state'
import { nowIso, uid, useDataStore } from '@/store/data-store'

import { cn, sanitizeText } from '@/lib/utils'
import type { Schedule, Subject } from '@/types/database'

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const JS_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

const EMPTY = { day: 'Senin', time: '', subject: '', room: '', teacher: '' }

export default function AdminSchedulePage() {
  const schedules = useDataStore((s) => s.schedules)
  const subjects = useDataStore((s) => s.subjects)
  const add = useDataStore((s) => s.add)
  const update = useDataStore((s) => s.update)
  const remove = useDataStore((s) => s.remove)

  const todayName = JS_DAYS[new Date().getDay()]
  const [day, setDay] = useState(DAYS.includes(todayName) ? todayName : 'Senin')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Schedule | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [confirmDelete, setConfirmDelete] = useState<Schedule | null>(null)
  const [kelolaMapel, setKelolaMapel] = useState(false)
  const [mapelBaru, setMapelBaru] = useState('')
  const [hapusMapel, setHapusMapel] = useState<Subject | null>(null)

  const daftarMapel = useMemo(
    () => [...subjects].sort((a, b) => a.order - b.order),
    [subjects]
  )

  function tambahMapel(e: React.FormEvent) {
    e.preventDefault()
    const nama = sanitizeText(mapelBaru, 60).trim()
    if (nama.length < 2) return toast.error('Nama mata pelajaran minimal 2 karakter.')
    if (subjects.some((x) => x.name.toLowerCase() === nama.toLowerCase())) {
      return toast.error(`"${nama}" sudah ada dalam daftar.`)
    }
    add('subjects', {
      id: uid(),
      name: nama,
      order: subjects.length + 1,
      created_at: nowIso(),
    })
    setMapelBaru('')
    toast.success(`Mata pelajaran "${nama}" ditambahkan.`)
  }

  function doHapusMapel() {
    if (!hapusMapel) return
    const dipakai = schedules.filter((s) => s.subject === hapusMapel.name).length
    remove('subjects', hapusMapel.id)
    toast.success(
      dipakai > 0
        ? `"${hapusMapel.name}" dihapus. ${dipakai} jadwal masih memakai nama ini.`
        : `"${hapusMapel.name}" dihapus.`
    )
    setHapusMapel(null)
  }

  const byDay = useMemo(() => schedules.filter((s) => s.day === day), [schedules, day])

  function openAdd() {
    setEditing(null)
    setForm({ ...EMPTY, day, subject: daftarMapel[0]?.name ?? '' })
    setOpen(true)
  }

  function openEdit(s: Schedule) {
    setEditing(s)
    setForm({ day: s.day, time: s.time, subject: s.subject, room: s.room ?? '', teacher: s.teacher ?? '' })
    setOpen(true)
  }

  function save(e: React.FormEvent) {
    e.preventDefault()
    if (!form.time.trim()) return toast.error('Jam pelajaran wajib diisi.')

    const payload = {
      day: form.day,
      time: sanitizeText(form.time, 40),
      subject: form.subject,
      room: sanitizeText(form.room, 40),
      teacher: sanitizeText(form.teacher, 60),
    }

    if (editing) {
      update('schedules', editing.id, payload)
      toast.success('Jadwal diperbarui.')
    } else {
      add('schedules', { id: uid(), ...payload })
      toast.success('Jadwal ditambahkan.')
    }
    setOpen(false)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kelola Jadwal Pelajaran"
        description={`${schedules.length} slot jadwal tersimpan`}
        action={
          <>
            <Button variant="outline" onClick={() => setKelolaMapel(true)}>
              <BookOpen className="h-4 w-4" /> Mata Pelajaran ({subjects.length})
            </Button>
            <Button variant="gradient" onClick={openAdd} disabled={subjects.length === 0}>
              <Plus className="h-4 w-4" /> Tambah Jadwal
            </Button>
          </>
        }
      />

      {subjects.length === 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div className="text-sm">
            <p className="font-medium text-amber-600 dark:text-amber-400">Belum ada mata pelajaran</p>
            <p className="mt-0.5 text-muted-foreground">
              Tambahkan mata pelajaran dulu lewat tombol <strong>Mata Pelajaran</strong> di atas,
              baru jadwal bisa disusun.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {DAYS.map((d) => {
          const count = schedules.filter((s) => s.day === d).length
          return (
            <button
              key={d}
              onClick={() => setDay(d)}
              aria-pressed={day === d}
              className={cn(
                'rounded-xl border px-4 py-2 text-sm font-medium transition-all',
                day === d
                  ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25'
                  : 'border-border text-muted-foreground hover:border-primary/40 hover:bg-accent'
              )}
            >
              {d}
              <span className={cn('ml-1.5 text-xs', day === d ? 'text-white/80' : 'text-muted-foreground')}>({count})</span>
            </button>
          )
        })}
      </div>

      <Card glass>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Hari {day}</CardTitle>
          {day === todayName && <Badge variant="success">Hari ini</Badge>}
        </CardHeader>
        <CardContent className="px-2 pb-4">
          {byDay.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="Belum ada jadwal"
              description={`Belum ada jadwal untuk hari ${day}.`}
              action={<Button variant="gradient" onClick={openAdd}><Plus className="h-4 w-4" /> Tambah Jadwal</Button>}
              className="m-4"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Jam ke</TableHead>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Mata Pelajaran</TableHead>
                  <TableHead className="hidden md:table-cell">Ruang</TableHead>
                  <TableHead className="hidden lg:table-cell">Guru</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byDay.map((s, i) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                        {i + 1}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{s.time}</TableCell>
                    <TableCell className="font-medium">{s.subject}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{s.room || '—'}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{s.teacher || '—'}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(s)} aria-label="Edit jadwal">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setConfirmDelete(s)}
                          aria-label="Hapus jadwal"
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Jadwal' : 'Tambah Jadwal'}</DialogTitle>
            <DialogDescription>Jadwal langsung tampil di halaman Jadwal Pelajaran siswa.</DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="s-day">Hari *</Label>
                <Select value={form.day} onValueChange={(v) => setForm({ ...form, day: v })}>
                  <SelectTrigger id="s-day"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-time">Waktu *</Label>
                <Input
                  id="s-time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  placeholder="07.00 - 08.30"
                  required
                  maxLength={40}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-subject">Mata Pelajaran *</Label>
              <Select value={form.subject} onValueChange={(v) => setForm({ ...form, subject: v })}>
                <SelectTrigger id="s-subject"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-64">
                  {daftarMapel.map((x) => (
                    <SelectItem key={x.id} value={x.name}>{x.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="s-room">Ruang</Label>
                <Input id="s-room" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} placeholder="X-5 / Lab" maxLength={40} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-teacher">Guru</Label>
                <Input id="s-teacher" value={form.teacher} onChange={(e) => setForm({ ...form, teacher: e.target.value })} placeholder="Nama guru" maxLength={60} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" variant="gradient">{editing ? 'Simpan' : 'Tambah'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ---------- KELOLA MATA PELAJARAN ---------- */}
      <Dialog open={kelolaMapel} onOpenChange={setKelolaMapel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mata Pelajaran</DialogTitle>
            <DialogDescription>
              Daftar ini yang muncul saat menyusun jadwal. Tambah atau hapus sesuai kebutuhan kelas.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={tambahMapel} className="flex gap-2">
            <Input
              value={mapelBaru}
              onChange={(e) => setMapelBaru(e.target.value)}
              placeholder="Contoh: Bahasa Jawa"
              maxLength={60}
              aria-label="Nama mata pelajaran baru"
            />
            <Button type="submit" variant="gradient" className="shrink-0">
              <Plus className="h-4 w-4" /> Tambah
            </Button>
          </form>

          <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1 scrollbar-thin">
            {daftarMapel.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Belum ada mata pelajaran. Tambahkan lewat kolom di atas.
              </p>
            )}
            {daftarMapel.map((m, i) => {
              const dipakai = schedules.filter((x) => x.subject === m.name).length
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-card/40 p-2.5"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{m.name}</span>
                  {dipakai > 0 && (
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      {dipakai} jadwal
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Hapus ${m.name}`}
                    onClick={() => setHapusMapel(m)}
                    className="shrink-0 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setKelolaMapel(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------- HAPUS MATA PELAJARAN ---------- */}
      <Dialog open={!!hapusMapel} onOpenChange={(o) => !o && setHapusMapel(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Mata Pelajaran?</DialogTitle>
            <DialogDescription>
              &ldquo;{hapusMapel?.name}&rdquo; akan hilang dari pilihan saat menyusun jadwal.
              {hapusMapel && schedules.some((x) => x.subject === hapusMapel.name) && (
                <span className="mt-2 block text-amber-600 dark:text-amber-400">
                  Jadwal yang sudah memakai mapel ini tidak ikut terhapus.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHapusMapel(null)}>Batal</Button>
            <Button variant="destructive" onClick={doHapusMapel}>
              <Trash2 className="h-4 w-4" /> Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Jadwal?</DialogTitle>
            <DialogDescription>
              {confirmDelete?.subject} ({confirmDelete?.time}) akan dihapus dari hari {confirmDelete?.day}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Batal</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirmDelete) remove('schedules', confirmDelete.id)
                toast.success('Jadwal dihapus.')
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
