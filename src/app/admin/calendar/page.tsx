'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { uid, useDataStore } from '@/store/data-store'
import { cn, formatDate, sanitizeText } from '@/lib/utils'

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const COLORS = [
  { value: '#6366f1', label: 'Indigo' },
  { value: '#22c55e', label: 'Hijau' },
  { value: '#f59e0b', label: 'Kuning' },
  { value: '#ef4444', label: 'Merah' },
  { value: '#d946ef', label: 'Fuchsia' },
  { value: '#0ea5e9', label: 'Biru' },
]

export default function AdminCalendarPage() {
  const events = useDataStore((s) => s.events)
  const add = useDataStore((s) => s.add)
  const remove = useDataStore((s) => s.remove)

  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: '', date: '', color: COLORS[0].value, description: '' })

  const todayStr = new Date().toISOString().slice(0, 10)

  const grid = useMemo(() => {
    const first = new Date(cursor.year, cursor.month, 1)
    const startOffset = first.getDay()
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate()
    const cells: (string | null)[] = Array(startOffset).fill(null)
    for (let d = 1; d <= daysInMonth; d++) {
      const m = String(cursor.month + 1).padStart(2, '0')
      cells.push(`${cursor.year}-${m}-${String(d).padStart(2, '0')}`)
    }
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [cursor])

  const eventsOn = (date: string) => events.filter((e) => e.date === date)
  const monthEvents = useMemo(
    () =>
      events
        .filter((e) => {
          const d = new Date(e.date)
          return d.getFullYear() === cursor.year && d.getMonth() === cursor.month
        })
        .sort((a, b) => a.date.localeCompare(b.date)),
    [events, cursor]
  )

  function shift(delta: number) {
    setCursor((c) => {
      const m = c.month + delta
      if (m < 0) return { year: c.year - 1, month: 11 }
      if (m > 11) return { year: c.year + 1, month: 0 }
      return { ...c, month: m }
    })
  }

  function openAdd(date?: string) {
    setForm({ title: '', date: date ?? todayStr, color: COLORS[0].value, description: '' })
    setOpen(true)
  }

  function save(e: React.FormEvent) {
    e.preventDefault()
    if (form.title.trim().length < 3) return toast.error('Judul acara minimal 3 karakter.')
    if (!form.date) return toast.error('Tanggal wajib diisi.')
    add('events', {
      id: uid(),
      title: sanitizeText(form.title, 120),
      date: form.date,
      color: form.color,
      description: sanitizeText(form.description, 300) || null,
    })
    toast.success('Acara ditambahkan ke kalender.')
    setOpen(false)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kalender Kegiatan"
        description="Kelola agenda dan acara penting kelas X-5."
        action={<Button variant="gradient" onClick={() => openAdd()}><Plus className="h-4 w-4" /> Tambah Acara</Button>}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card glass className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">{MONTHS[cursor.month]} {cursor.year}</CardTitle>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon-sm" onClick={() => shift(-1)} aria-label="Bulan sebelumnya"><ChevronLeft className="h-4 w-4" /></Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { const d = new Date(); setCursor({ year: d.getFullYear(), month: d.getMonth() }) }}
              >
                Hari ini
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => shift(1)} aria-label="Bulan berikutnya"><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-2 grid grid-cols-7 gap-1">
              {DAY_LABELS.map((d) => (
                <div key={d} className="py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {grid.map((date, i) => {
                if (!date) return <div key={`e-${i}`} className="aspect-square rounded-lg" />
                const dayEvents = eventsOn(date)
                const isToday = date === todayStr
                return (
                  <button
                    key={date}
                    onClick={() => openAdd(date)}
                    className={cn(
                      'flex aspect-square flex-col items-center gap-0.5 rounded-lg border p-1 text-xs transition-colors hover:border-primary/50 hover:bg-accent/50',
                      isToday ? 'border-primary bg-primary/10 font-bold' : 'border-border/50'
                    )}
                    aria-label={`${date}, ${dayEvents.length} acara`}
                  >
                    <span className={cn('mt-0.5', isToday && 'text-primary')}>{Number(date.slice(-2))}</span>
                    <div className="flex flex-wrap justify-center gap-0.5">
                      {dayEvents.slice(0, 3).map((e) => (
                        <span key={e.id} className="h-1.5 w-1.5 rounded-full" style={{ background: e.color }} />
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card glass>
          <CardHeader>
            <CardTitle className="text-base">Acara Bulan Ini ({monthEvents.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {monthEvents.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Belum ada acara bulan ini.</p>}
            {monthEvents.map((e) => (
              <div key={e.id} className="flex items-start gap-3 rounded-xl border border-border/60 bg-card/40 p-3">
                <span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ background: e.color }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{e.title}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(e.date, true)}</p>
                  {e.description && <p className="mt-0.5 truncate text-xs text-muted-foreground">{e.description}</p>}
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 text-destructive hover:bg-destructive/10"
                  aria-label="Hapus acara"
                  onClick={() => { remove('events', e.id); toast.success('Acara dihapus.') }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Acara</DialogTitle>
            <DialogDescription>Acara akan tampil di kalender kelas.</DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ev-title">Judul Acara *</Label>
              <Input id="ev-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required maxLength={120} placeholder="Contoh: Class Meeting" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ev-date">Tanggal *</Label>
              <Input id="ev-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Warna Label</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setForm({ ...form, color: c.value })}
                    aria-label={c.label}
                    aria-pressed={form.color === c.value}
                    className={cn('h-9 w-9 rounded-lg border-2 transition-transform hover:scale-110', form.color === c.value ? 'border-foreground' : 'border-transparent')}
                    style={{ background: c.value }}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ev-desc">Deskripsi</Label>
              <Textarea id="ev-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={300} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" variant="gradient">Tambah Acara</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
